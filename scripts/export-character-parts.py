import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


CHARACTERS = [
    ("drizzel", "DRIZZEL_asset/DRIZZLE_Lowpoly.fbx"),
    ("gekkou", "GEKKOU_asset/GEKKOU_lowpoly.fbx"),
    ("kasa", "KASA_asset/KASA_Lowpoly.fbx"),
    ("kurenai", "KURENAI_asset/KURENAI_lowpoly.fbx"),
    ("samidale", "SAMIDALE_asset/SAMIDALE_lowpoly.fbx"),
    ("shogun", "SHOGUN_asset/SHOGUN_Lowpoly.fbx"),
]

SKIP_OBJECT_TOKENS = ("cube", "camera", "light")


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
        for corner in getattr(obj, "bound_box", []):
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
    height = max(size.z, 0.001)

    if size.y > size.z * 1.25:
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
    mins, _ = scene_bounds(roots)
    for obj in roots:
        if obj.parent is None:
            obj.location.z -= mins.z

    bpy.context.view_layer.update()
    for obj in bpy.context.scene.objects:
        obj.name = obj.name.replace(" ", "_")
        if hasattr(obj.data, "name"):
            obj.data.name = obj.data.name.replace(" ", "_")


def part_kind(name):
    n = name.lower()
    if any(token in n for token in ("katana", "stick")):
        return "weapon"
    if any(token in n for token in ("scabbard", "cape", "tail", "pipe", "cloth", "tissue")):
        return "gear"
    if any(token in n for token in ("smoke", "circle", "info", "ui")):
        return "fx"
    if "head" in n:
        return "head"
    if "body" in n or "geo" in n:
        return "body"
    return "gear"


def clean_part_name(name):
    out = name.lower().replace("_geo", "").replace("_lowpoly", "")
    for prefix in ("drizzle_", "drizzel_", "gekkou_", "kasa_", "kurenai_", "samidale_", "shogun_"):
        out = out.replace(prefix, "")
    return "".join(ch if ch.isalnum() else "_" for ch in out).strip("_")


def mesh_objects():
    result = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        lowered = obj.name.lower()
        if any(token in lowered for token in SKIP_OBJECT_TOKENS):
            continue
        result.append(obj)
    return result


def armatures():
    return [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]


def export_selected(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_animations=True,
        export_materials="EXPORT",
    )


def select_for_export(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    if objects:
        bpy.context.view_layer.objects.active = objects[0]


def export_parts(source_root, output_root):
    lines = ["# Generated character part exports", "base,kind,name,asset_id,file"]
    for base_id, rel_source in CHARACTERS:
        source = source_root / rel_source
        if not source.exists():
            print(f"SKIP {base_id}: missing {source}")
            continue

        clear_scene()
        import_fbx(source)
        normalize_scene()
        rigs = armatures()

        for obj in mesh_objects():
            kind = part_kind(obj.name)
            clean = clean_part_name(obj.name)
            filename = f"{base_id}_{kind}_{clean}.glb"
            output = output_root / filename
            select_for_export([obj, *rigs])
            export_selected(output)
            asset_id = f"player.part.{base_id}.{kind}.{clean}"
            lines.append(f"{base_id},{kind},{clean},{asset_id},assets/models/player/parts/{filename}")
            print(f"OK {asset_id}: {output}")

    manifest = output_root / "CHARACTER_PARTS.csv"
    manifest.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"WROTE {manifest}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", required=True)
    parser.add_argument("--output-root", required=True)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    args = parser.parse_args(argv)
    export_parts(Path(args.source_root), Path(args.output_root))


if __name__ == "__main__":
    main()
