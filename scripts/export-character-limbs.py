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

LIMB_GROUPS = {
    "head": ("head", "neck", "hair", "hat", "mask", "veil"),
    "torso": ("hips", "spine", "shoulder", "chest", "body", "torso"),
    "leftArm": (":leftshoulder", ":leftarm", ":leftforearm", ":lefthand", "forearm.l", ".l", "sleeve.l"),
    "rightArm": (":rightshoulder", ":rightarm", ":rightforearm", ":righthand", "forearm.r", ".r", "sleeve.r"),
    "leftLeg": (":leftupleg", ":leftleg", ":leftfoot", ":lefttoebase", "toes_fingera.l", "toes_fingerb.l"),
    "rightLeg": (":rightupleg", ":rightleg", ":rightfoot", ":righttoebase", "toes_fingera.r", "toes_fingerb.r"),
}

MIN_VERTS = 24


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


def armatures():
    return [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]


def body_meshes():
    meshes = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        groups = [g.name.lower() for g in obj.vertex_groups]
        if "mixamorig:hips" in groups and len(groups) > 10:
            meshes.append(obj)
    return meshes


def group_matches(group_name, tokens):
    name = group_name.lower()
    return any(token in name for token in tokens)


def selected_vertex_indices(obj, limb):
    tokens = LIMB_GROUPS[limb]
    group_names = {group.index: group.name for group in obj.vertex_groups}
    selected = set()
    has_weight_data = False
    for vertex in obj.data.vertices:
        total = 0.0
        for weight in vertex.groups:
            has_weight_data = True
            if group_matches(group_names.get(weight.group, ""), tokens):
                total += weight.weight
        if total >= 0.12:
            selected.add(vertex.index)
    if has_weight_data and len(selected) >= MIN_VERTS:
        return selected
    return spatial_vertex_indices(obj, limb)


def spatial_vertex_indices(obj, limb):
    coords = [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]
    if not coords:
        return set()
    mins = Vector((min(v.x for v in coords), min(v.y for v in coords), min(v.z for v in coords)))
    maxs = Vector((max(v.x for v in coords), max(v.y for v in coords), max(v.z for v in coords)))
    size = maxs - mins
    center = (mins + maxs) * 0.5
    height = max(size.z, 0.001)
    width = max(size.x, 0.001)

    def zn(v):
        return (v.z - mins.z) / height

    selected = set()
    for vertex, world in zip(obj.data.vertices, coords):
        z = zn(world)
        side = (world.x - center.x) / width
        keep = False
        # These regions intentionally overlap around shoulders, hips, and neck.
        # Low-poly character packs were authored as whole bodies, so a little
        # overlap gives the runtime seam armor something to cover and prevents
        # obvious holes during parkour animation poses.
        if limb == "head":
            keep = z >= 0.62
        elif limb == "torso":
            keep = 0.25 <= z <= 0.82 and abs(side) <= 0.42
        elif limb == "leftArm":
            keep = 0.24 <= z <= 0.82 and side < -0.12
        elif limb == "rightArm":
            keep = 0.24 <= z <= 0.82 and side > 0.12
        elif limb == "leftLeg":
            keep = z <= 0.5 and side < 0.12
        elif limb == "rightLeg":
            keep = z <= 0.5 and side > -0.12
        if keep:
            selected.add(vertex.index)
    return selected


def duplicate_limb_mesh(obj, limb):
    keep = selected_vertex_indices(obj, limb)
    if len(keep) < MIN_VERTS:
        return None

    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.duplicate()
    dup = bpy.context.object
    dup.name = f"{obj.name}_{limb}"
    dup.data.name = dup.name

    bpy.context.view_layer.objects.active = dup
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_mode(type="VERT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for vertex in dup.data.vertices:
        vertex.select = vertex.index not in keep
    dup.data.update()
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    dup.data.update()

    if len(dup.data.vertices) < MIN_VERTS:
        bpy.data.objects.remove(dup, do_unlink=True)
        return None
    return dup


def select_for_export(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    if objects:
        bpy.context.view_layer.objects.active = objects[0]


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


def export_limbs(source_root, output_root):
    output_root.mkdir(parents=True, exist_ok=True)
    lines = ["# Generated anatomical limb exports", "base,kind,name,asset_id,file"]
    for base_id, rel_source in CHARACTERS:
        source = source_root / rel_source
        if not source.exists():
            print(f"SKIP {base_id}: missing {source}")
            continue
        clear_scene()
        import_fbx(source)
        normalize_scene()
        rigs = armatures()
        meshes = body_meshes()
        if not meshes:
            print(f"SKIP {base_id}: no weighted body mesh")
            continue

        for mesh in meshes:
            for limb in LIMB_GROUPS:
                dup = duplicate_limb_mesh(mesh, limb)
                if not dup:
                    print(f"SKIP {base_id}.{limb}: insufficient weighted vertices")
                    continue
                filename = f"{base_id}_limb_{limb}.glb"
                output = output_root / filename
                select_for_export([dup, *rigs])
                export_selected(output)
                asset_id = f"player.limb.{base_id}.{limb}"
                lines.append(f"{base_id},limb,{limb},{asset_id},assets/models/player/limbs/{filename}")
                print(f"OK {asset_id}: {output}")
                bpy.data.objects.remove(dup, do_unlink=True)

    manifest = output_root / "CHARACTER_LIMBS.csv"
    manifest.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"WROTE {manifest}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", required=True)
    parser.add_argument("--output-root", required=True)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    args = parser.parse_args(argv)
    export_limbs(Path(args.source_root), Path(args.output_root))


if __name__ == "__main__":
    main()
