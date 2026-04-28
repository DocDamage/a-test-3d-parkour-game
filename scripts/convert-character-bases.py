import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


BASES = [
    ("drizzel", "DRIZZEL_asset/DRIZZLE_Lowpoly.fbx", "base_drizzel.glb"),
    ("gekkou", "GEKKOU_asset/GEKKOU_lowpoly.fbx", "base_gekkou.glb"),
    ("kasa", "KASA_asset/KASA_Lowpoly.fbx", "base_kasa.glb"),
    ("kurenai", "KURENAI_asset/KURENAI_lowpoly.fbx", "base_kurenai.glb"),
    ("samidale", "SAMIDALE_asset/SAMIDALE_lowpoly.fbx", "base_samidale.glb"),
    ("shogun", "SHOGUN_asset/SHOGUN_Lowpoly.fbx", "base_shogun.glb"),
]


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def import_fbx(path):
    bpy.ops.import_scene.fbx(filepath=str(path))


def scene_bounds(objects):
    mins = Vector((math.inf, math.inf, math.inf))
    maxs = Vector((-math.inf, -math.inf, -math.inf))
    found = False
    for obj in objects:
        if obj.type not in {"MESH", "ARMATURE", "EMPTY"}:
            continue
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            mins.x = min(mins.x, world.x)
            mins.y = min(mins.y, world.y)
            mins.z = min(mins.z, world.z)
            maxs.x = max(maxs.x, world.x)
            maxs.y = max(maxs.y, world.y)
            maxs.z = max(maxs.z, world.z)
            found = True
    return (mins, maxs) if found else (Vector((0, 0, 0)), Vector((1, 1, 1)))


def normalize_scene(target_height=1.75):
    roots = list(bpy.context.scene.objects)
    mins, maxs = scene_bounds(roots)
    size = maxs - mins
    height_axis = "Z"
    height = max(size.z, 0.001)

    # Some FBX exports arrive Y-up. Rotate to Three.js-friendly Y-up world where
    # model height is local Y after export.
    if size.y > size.z * 1.25:
        height_axis = "Y"
        height = max(size.y, 0.001)
        for obj in roots:
            if obj.parent is None:
                obj.rotation_euler.rotate_axis("X", math.radians(90))
        bpy.context.view_layer.update()
        mins, maxs = scene_bounds(roots)
        size = maxs - mins
        height = max(size.z, 0.001)

    scale = target_height / height
    center = (mins + maxs) * 0.5
    for obj in roots:
        if obj.parent is None:
            obj.location -= center
            obj.scale *= scale

    bpy.context.view_layer.update()
    mins, maxs = scene_bounds(roots)
    for obj in roots:
        if obj.parent is None:
            obj.location.z -= mins.z

    bpy.context.view_layer.update()
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.name = obj.name.replace(" ", "_")
            obj.data.name = obj.data.name.replace(" ", "_")
            obj.data.materials.update()
            obj.select_set(True)
        else:
            obj.select_set(obj.type == "ARMATURE")
    return height_axis


def export_glb(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_animations=True,
    )


def convert_all(source_root, output_root):
    for base_id, relative_source, output_name in BASES:
        source = source_root / relative_source
        output = output_root / output_name
        if not source.exists():
            print(f"SKIP {base_id}: missing {source}")
            continue
        clear_scene()
        import_fbx(source)
        axis = normalize_scene()
        export_glb(output)
        print(f"OK {base_id}: {source} -> {output} (source height axis {axis})")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", required=True)
    parser.add_argument("--output-root", required=True)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    args = parser.parse_args(argv)
    convert_all(Path(args.source_root), Path(args.output_root))


if __name__ == "__main__":
    main()
