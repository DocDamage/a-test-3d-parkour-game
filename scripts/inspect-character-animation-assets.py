import argparse
import json
import sys
from pathlib import Path

import bpy


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def import_asset(path):
    suffix = path.suffix.lower()
    if suffix == ".glb" or suffix == ".gltf":
        bpy.ops.import_scene.gltf(filepath=str(path))
    elif suffix == ".fbx":
        bpy.ops.import_scene.fbx(filepath=str(path))
    else:
        raise ValueError(f"Unsupported asset type: {path}")


def inspect_asset(path):
    clear_scene()
    import_asset(path)
    armatures = []
    for obj in bpy.context.scene.objects:
        if obj.type == "ARMATURE":
            armatures.append({
                "name": obj.name,
                "bones": [bone.name for bone in obj.data.bones],
            })
    animations = []
    for action in bpy.data.actions:
        animations.append({
            "name": action.name,
            "frameStart": action.frame_range[0],
            "frameEnd": action.frame_range[1],
        })
    meshes = [obj.name for obj in bpy.context.scene.objects if obj.type == "MESH"]
    return {
        "path": str(path),
        "meshes": meshes,
        "armatures": armatures,
        "animations": animations,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assets", nargs="+", required=True)
    parser.add_argument("--out", required=True)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    args = parser.parse_args(argv)
    report = [inspect_asset(Path(path)) for path in args.assets]
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()

