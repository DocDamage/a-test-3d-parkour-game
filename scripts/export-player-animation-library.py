import argparse
from pathlib import Path

import bpy


CLIPS = [
    ("idle_01", "Animations/Male/Idles/HumanM@Idle01.fbx"),
    ("idle_02", "Animations/Male/Idles/HumanM@Idle02.fbx"),
    ("walk_forward", "Animations/Male/Movement/Walk/HumanM@Walk01_Forward.fbx"),
    ("run_forward", "Animations/Male/Movement/Run/HumanM@Run01_Forward.fbx"),
    ("sprint_forward", "Animations/Male/Movement/Sprint/HumanM@Sprint01_Forward.fbx"),
    ("jump", "Animations/Male/Movement/Jump/HumanM@Jump01.fbx"),
    ("jump_begin", "Animations/Male/Movement/Jump/HumanM@Jump01 - Begin.fbx"),
    ("jump_land", "Animations/Male/Movement/Jump/HumanM@Jump01 - Land.fbx"),
    ("fall", "Animations/Male/Movement/Jump/HumanM@Fall01.fbx"),
    ("turn_left", "Animations/Male/Movement/Turn/HumanM@Turn01_Left.fbx"),
    ("turn_right", "Animations/Male/Movement/Turn/HumanM@Turn01_Right.fbx"),
    ("hands_closed", "Animations/Masked Poses/Human@HandsClosed01.fbx"),
    ("hands_grip", "Animations/Masked Poses/Human@ObjectGripHands01.fbx"),
]


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in list(bpy.data.actions):
        bpy.data.actions.remove(block)
    for block in list(bpy.data.armatures):
        bpy.data.armatures.remove(block)
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block)


def export_clip(source_root, output_root, clip_id, relative_path):
    src = source_root / relative_path
    if not src.exists():
        print(f"WARN missing {src}")
        return False
    clear_scene()
    bpy.ops.import_scene.fbx(filepath=str(src), use_anim=True, automatic_bone_orientation=False)
    for obj in bpy.context.scene.objects:
        obj.select_set(obj.type == "ARMATURE")
    bpy.context.view_layer.objects.active = next((obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"), None)
    for action in bpy.data.actions:
        action.name = clip_id
    out = output_root / f"{clip_id}.glb"
    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(out),
        export_format="GLB",
        export_animations=True,
        export_frame_range=True,
        export_force_sampling=True,
        export_optimize_animation_size=True,
        export_yup=True,
    )
    print(f"Exported {out}")
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", default="my game assets/animations")
    parser.add_argument("--output-root", default="assets/animations/player")
    args = parser.parse_args(bpy.context.window_manager.get("argv", []))

    source_root = Path(args.source_root)
    output_root = Path(args.output_root)
    count = 0
    for clip_id, relative_path in CLIPS:
        if export_clip(source_root, output_root, clip_id, relative_path):
            count += 1
    print(f"Exported {count} player animation clips")


if __name__ == "__main__":
    import sys
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    bpy.context.window_manager["argv"] = argv
    main()
