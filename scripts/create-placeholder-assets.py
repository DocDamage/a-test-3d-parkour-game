import argparse
import math
import sys
from pathlib import Path

import bpy


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def mat(name, color, emissive=None):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = 0.35
        bsdf.inputs["Metallic"].default_value = 0.4
        if emissive and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emissive
            bsdf.inputs["Emission Strength"].default_value = 0.8
    return material


def add_cube(name, scale, location, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(material)
    return obj


def add_uv_sphere(name, radius, location, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def add_cylinder(name, radius, depth, location, material, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=18, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def add_cone(name, radius1, radius2, depth, location, material, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=18, radius1=radius1, radius2=radius2, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def export(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_yup=True, export_apply=True)


def make_energy_sword(path):
    clear_scene()
    metal = mat("dark_metal", (0.04, 0.04, 0.05, 1))
    blade = mat("energy_blade", (0.0, 1.0, 0.75, 0.85), (0.0, 1.0, 0.75, 1))
    add_cylinder("hilt", 0.04, 0.24, (0, 0.08, -0.28), metal, (math.pi / 2, 0, 0))
    add_cube("blade", (0.035, 0.01, 0.55), (0, 0.1, 0.15), blade)
    export(path)


def make_loot(path, kind):
    clear_scene()
    colors = {
        "gear": ((1.0, 0.55, 0.05, 1), (1.0, 0.35, 0.0, 1)),
        "gem": ((0.45, 0.85, 1.0, 1), (0.2, 0.7, 1.0, 1)),
        "scrap": ((0.45, 0.5, 0.56, 1), None),
        "chips": ((0.0, 1.0, 0.75, 1), (0.0, 1.0, 0.75, 1)),
        "health": ((1.0, 0.08, 0.08, 0.9), (1.0, 0.0, 0.0, 1)),
        "mine": ((0.8, 1.0, 0.05, 1), (0.5, 1.0, 0.0, 1)),
        "scanner": ((0.0, 0.8, 1.0, 1), (0.0, 0.6, 1.0, 1)),
    }
    material = mat(f"{kind}_mat", *colors[kind])
    if kind == "gear":
        add_cube("gear_cache", (0.18, 0.12, 0.18), (0, 0.12, 0), material)
        add_cylinder("cache_core", 0.08, 0.28, (0, 0.22, 0), material, (math.pi / 2, 0, 0))
    elif kind == "gem":
        add_cone("gem_top", 0.16, 0.03, 0.18, (0, 0.18, 0), material)
        add_cone("gem_bottom", 0.03, 0.16, 0.18, (0, 0.0, 0), material)
    elif kind == "scrap":
        add_cube("scrap_a", (0.12, 0.04, 0.08), (-0.06, 0.05, 0), material)
        add_cube("scrap_b", (0.08, 0.05, 0.12), (0.06, 0.09, 0.04), material)
        add_cone("scrap_spike", 0.08, 0.02, 0.16, (0.02, 0.12, -0.08), material)
    elif kind == "chips":
        for i in range(3):
            add_cube(f"chip_{i}", (0.16, 0.015, 0.1), (0, 0.04 + i * 0.035, 0), material)
    elif kind == "health":
        add_uv_sphere("health_globe", 0.18, (0, 0.18, 0), material)
    elif kind == "mine":
        add_cylinder("mine_body", 0.16, 0.08, (0, 0.05, 0), material)
        add_uv_sphere("mine_light", 0.035, (0, 0.12, 0), material)
    elif kind == "scanner":
        add_cube("scanner_body", (0.15, 0.05, 0.1), (0, 0.08, 0), material)
        add_cylinder("scanner_lens", 0.04, 0.03, (0, 0.08, 0.11), material, (math.pi / 2, 0, 0))
    export(path)


def make_drone(path, kind):
    clear_scene()
    color = {
        "basic": (0.0, 0.7, 1.0, 1),
        "sniper": (1.0, 0.25, 0.15, 1),
        "swarm": (0.85, 0.2, 1.0, 1),
        "hunter": (1.0, 0.6, 0.05, 1),
    }[kind]
    core = mat(f"{kind}_core", color, color)
    metal = mat("drone_metal", (0.06, 0.07, 0.09, 1))
    add_uv_sphere("core", 0.22, (0, 0.32, 0), core)
    add_cylinder("ring", 0.34, 0.025, (0, 0.32, 0), metal, (math.pi / 2, 0, 0))
    if kind == "sniper":
        add_cylinder("lens", 0.06, 0.35, (0, 0.32, 0.28), core, (math.pi / 2, 0, 0))
    elif kind == "swarm":
        for x in [-0.32, 0.32]:
            add_uv_sphere("pod", 0.08, (x, 0.32, 0), core)
    elif kind == "hunter":
        add_cone("nose", 0.12, 0.02, 0.36, (0, 0.32, 0.32), core, (math.pi / 2, 0, 0))
    export(path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-root", required=True)
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    args = parser.parse_args(argv)
    root = Path(args.output_root)
    make_energy_sword(root / "models/weapons/energy_sword_generic.glb")
    make_loot(root / "models/loot/gear_cache.glb", "gear")
    make_loot(root / "models/loot/gem_generic.glb", "gem")
    make_loot(root / "models/loot/scrap_bundle.glb", "scrap")
    make_loot(root / "models/loot/data_chip_stack.glb", "chips")
    make_loot(root / "models/loot/health_globe.glb", "health")
    make_loot(root / "models/loot/mine_pickup.glb", "mine")
    make_loot(root / "models/loot/scanner_pickup.glb", "scanner")
    make_drone(root / "models/enemies/drone_basic.glb", "basic")
    make_drone(root / "models/enemies/drone_sniper.glb", "sniper")
    make_drone(root / "models/enemies/drone_swarm_core.glb", "swarm")
    make_drone(root / "models/enemies/drone_hunter.glb", "hunter")
    print("Placeholder GLB assets created.")


if __name__ == "__main__":
    main()

