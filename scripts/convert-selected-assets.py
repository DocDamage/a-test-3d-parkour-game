import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


WEAPON_ASSETS = [
    ("smg_generic", "Modular Sci Fi Guns - Nov 2021/Guns/glTF/SMG_1.gltf", "models/weapons/smg_generic.glb", 0.65),
    ("sniper_rifle_generic", "Modular Sci Fi Guns - Nov 2021/Guns/glTF/Sniper_1.gltf", "models/weapons/sniper_rifle_generic.glb", 0.65),
    ("shotgun_generic", "Modular Sci Fi Guns - Nov 2021/Guns/glTF/AR_5.gltf", "models/weapons/shotgun_generic.glb", 0.65),
    ("plasma_rifle_generic", "Modular Sci Fi Guns - Nov 2021/Guns/glTF/AR_2.gltf", "models/weapons/plasma_rifle_generic.glb", 0.65),
    ("rocket_launcher_generic", "Modular Sci Fi Guns - Nov 2021/Guns/glTF/Grenade_3.gltf", "models/weapons/rocket_launcher_generic.glb", 0.75),
    ("grenade_pickup", "Modular Sci Fi Guns - Nov 2021/Guns/glTF/Grenade.gltf", "models/loot/grenade_pickup.glb", 0.55),
]

ENVIRONMENT_ASSETS = [
    ("skyline_tiny", "Package/TinyBuilding01.obj", "models/environment/skyline_tiny_building.glb", 0.08),
    ("skyline_small_01", "Package/SmallBuilding01.obj", "models/environment/skyline_small_building_01.glb", 0.08),
    ("skyline_small_02", "Package/SmallBuilding02.obj", "models/environment/skyline_small_building_02.glb", 0.08),
    ("skyline_small_03", "Package/SmallBuilding03.obj", "models/environment/skyline_small_building_03.glb", 0.08),
    ("skyline_small_04", "Package/SmallBuilding04.obj", "models/environment/skyline_small_building_04.glb", 0.08),
    ("skyline_tall_01", "Package/TallBuilding01.obj", "models/environment/skyline_tall_building_01.glb", 0.08),
    ("skyline_tall_02", "Package/TallBuilding02.obj", "models/environment/skyline_tall_building_02.glb", 0.08),
    ("skyline_tall_03", "Package/TallBuilding03.obj", "models/environment/skyline_tall_building_03.glb", 0.08),
    ("skyline_large_01", "Package/LargeBuilding01.obj", "models/environment/skyline_large_building_01.glb", 0.08),
    ("cyberpunk_building_06", "Free Sample/Building_06.fbx", "models/environment/cyberpunk_building_06.glb", 0.08),
    ("bunker_wall_container_blue", "Free Sample/Bunker - Free Sample-0-Wall_Container_Blue-0.obj", "models/environment/bunker_wall_container_blue.glb", 0.12),
    ("bunker_chair_red", "Free Sample/Bunker - Free Sample-30-Chair_Red-2.obj", "models/environment/bunker_chair_red.glb", 0.2),
]

DRONE_ASSETS = [
    ("drone_robot", "drone/robot_no_rig.fbx", "models/enemies/drone_robot.glb", 1.2),
]

NEW_ENEMY_ASSETS = [
    ("arachnodroid", "arachnodroid/Package/Arachnoid.obj", "models/enemies/arachnodroid.glb", 1.25),
    ("eye_monster", "eye monster/scene.gltf", "models/enemies/eye_monster.glb", 1.35),
    ("bot_recon", "more bots/Package/ReconBot.obj", "models/enemies/recon_bot.glb", 1.1),
    ("bot_companion", "more bots/Package/Companion-bot.obj", "models/enemies/companion_bot.glb", 1.0),
    ("bot_quadruped_tank", "more bots/Package/QuadrupedTank.obj", "models/enemies/quadruped_tank.glb", 1.3),
    ("sentry_turret_plasma", "sentry/Modular_Sentry By 3Darknight/Models/Separated Modules/GLB/Turret MK3 Plasma Cannon.glb", "models/enemies/sentry_turret_plasma.glb", 1.1),
    ("sentry_turret_sniper", "sentry/Modular_Sentry By 3Darknight/Models/Separated Modules/GLB/Turret MK3 Sniper Cannon.glb", "models/enemies/sentry_turret_sniper.glb", 1.1),
    ("sentry_base_2a", "sentry/Modular_Sentry By 3Darknight/Models/Separated Modules/GLB/Base 2A.glb", "models/enemies/sentry_base_2a.glb", 1.0),
]

MELEE_ASSETS = [
    ("energy_sword_laser", "LaserSwords/LaserSword/LaserSword.fbx", "models/weapons/energy_sword_laser.glb", 1.0),
]

KIT_PICKUP_ASSETS = [
    ("loot_cache_chest", "sci fi essentials kit/glTF/Prop_Chest.gltf", "models/loot/sci_fi_chest.glb", 0.9, "VIEWPORT"),
    ("loot_health_pack", "sci fi essentials kit/glTF/Prop_HealthPack.gltf", "models/loot/health_pack.glb", 0.75, "VIEWPORT"),
    ("loot_mine", "sci fi essentials kit/glTF/Prop_Mine.gltf", "models/loot/mine_pickup.glb", 0.75, "VIEWPORT"),
    ("loot_grenade", "sci fi essentials kit/glTF/Prop_Grenade.gltf", "models/loot/grenade_pickup.glb", 0.72, "VIEWPORT"),
    ("loot_ammo_small", "sci fi essentials kit/glTF/Prop_Ammo_Small.gltf", "models/loot/ammo_small.glb", 0.72, "VIEWPORT"),
    ("loot_keycard", "sci fi essentials kit/glTF/Prop_KeyCard.gltf", "models/loot/keycard.glb", 0.7, "VIEWPORT"),
    ("loot_syringe", "sci fi essentials kit/glTF/Prop_Syringe.gltf", "models/loot/syringe.glb", 0.7, "VIEWPORT"),
]

KIT_PROP_ASSETS = [
    ("kit_crate", "sci fi essentials kit/glTF/Prop_Crate.gltf", "models/environment/kit_crate.glb", 1.0, "VIEWPORT"),
    ("kit_crate_large", "sci fi essentials kit/glTF/Prop_Crate_Large.gltf", "models/environment/kit_crate_large.glb", 1.0, "VIEWPORT"),
    ("kit_barrel", "sci fi essentials kit/glTF/Prop_Barrel2_Closed.gltf", "models/environment/kit_barrel_closed.glb", 1.0, "VIEWPORT"),
    ("kit_locker", "sci fi essentials kit/glTF/Prop_Locker.gltf", "models/environment/kit_locker.glb", 1.0, "VIEWPORT"),
    ("kit_access_point", "Modular SciFi MegaKit[Standard]/glTF/Props/Prop_AccessPoint.gltf", "models/environment/megakit_access_point.glb", 1.0, "VIEWPORT"),
    ("kit_computer", "Modular SciFi MegaKit[Standard]/glTF/Props/Prop_Computer.gltf", "models/environment/megakit_computer.glb", 1.0, "VIEWPORT"),
    ("kit_item_holder", "Modular SciFi MegaKit[Standard]/glTF/Props/Prop_ItemHolder.gltf", "models/environment/megakit_item_holder.glb", 1.0, "VIEWPORT"),
    ("kit_vent_big", "Modular SciFi MegaKit[Standard]/glTF/Props/Prop_Vent_Big.gltf", "models/environment/megakit_vent_big.glb", 1.0, "VIEWPORT"),
    ("kit_door_dark", "Modular SciFi MegaKit[Standard]/glTF/Platforms/Door_DarkMetal.gltf", "models/environment/megakit_door_dark.glb", 1.0, "VIEWPORT"),
]

KIT_ENEMY_ASSETS = [
    ("essentials_enemy_eye_drone", "sci fi essentials kit/glTF/Enemy_EyeDrone.gltf", "models/enemies/essentials_eye_drone.glb", 1.1, "VIEWPORT"),
    ("essentials_enemy_quad_shell", "sci fi essentials kit/glTF/Enemy_QuadShell.gltf", "models/enemies/essentials_quad_shell.glb", 1.25, "VIEWPORT"),
    ("essentials_enemy_trilobite", "sci fi essentials kit/glTF/Enemy_Trilobite.gltf", "models/enemies/essentials_trilobite.glb", 1.25, "VIEWPORT"),
    ("megakit_alien_cyclop", "Modular SciFi MegaKit[Standard]/glTF/Aliens/Alien_Cyclop.gltf", "models/enemies/megakit_alien_cyclop.glb", 1.25, "VIEWPORT"),
    ("megakit_alien_oculichrysalis", "Modular SciFi MegaKit[Standard]/glTF/Aliens/Alien_Oculichrysalis.gltf", "models/enemies/megakit_alien_oculichrysalis.glb", 1.25, "VIEWPORT"),
    ("megakit_alien_scolitex", "Modular SciFi MegaKit[Standard]/glTF/Aliens/Alien_Scolitex.gltf", "models/enemies/megakit_alien_scolitex.glb", 1.25, "VIEWPORT"),
]

KIT_WEAPON_ASSETS = [
    ("essentials_pistol", "sci fi essentials kit/glTF/Gun_Pistol.gltf", "models/weapons/essentials_pistol.glb", 0.7, "VIEWPORT"),
    ("essentials_revolver", "sci fi essentials kit/glTF/Gun_Revolver.gltf", "models/weapons/essentials_revolver.glb", 0.7, "VIEWPORT"),
    ("essentials_rifle", "sci fi essentials kit/glTF/Gun_Rifle.gltf", "models/weapons/essentials_rifle.glb", 0.7, "VIEWPORT"),
    ("essentials_sniper", "sci fi essentials kit/glTF/Gun_Sniper.gltf", "models/weapons/essentials_sniper.glb", 0.75, "VIEWPORT"),
    ("essentials_smg_ammo", "sci fi essentials kit/glTF/Gun_SMG_Ammo.gltf", "models/loot/smg_ammo.glb", 0.65, "VIEWPORT"),
    ("essentials_sniper_ammo", "sci fi essentials kit/glTF/Gun_Sniper_Ammo.gltf", "models/loot/sniper_ammo.glb", 0.65, "VIEWPORT"),
]

KIT_STRUCTURE_ASSETS = [
    ("megakit_platform_metal", "Modular SciFi MegaKit[Standard]/glTF/Platforms/Platform_Metal.gltf", "models/environment/megakit_platform_metal.glb", 1.0, "VIEWPORT"),
    ("megakit_platform_simple", "Modular SciFi MegaKit[Standard]/glTF/Platforms/Platform_Simple.gltf", "models/environment/megakit_platform_simple.glb", 1.0, "VIEWPORT"),
    ("megakit_platform_ramp_2", "Modular SciFi MegaKit[Standard]/glTF/Platforms/Platform_Ramp_2.gltf", "models/environment/megakit_platform_ramp_2.glb", 1.0, "VIEWPORT"),
    ("megakit_platform_stairs_4", "Modular SciFi MegaKit[Standard]/glTF/Platforms/Platform_Stairs_4.gltf", "models/environment/megakit_platform_stairs_4.glb", 1.0, "VIEWPORT"),
    ("megakit_platform_rails_4", "Modular SciFi MegaKit[Standard]/glTF/Platforms/Platform_Rails_4.gltf", "models/environment/megakit_platform_rails_4.glb", 1.0, "VIEWPORT"),
    ("megakit_door_frame_square", "Modular SciFi MegaKit[Standard]/glTF/Platforms/Door_Frame_Square.gltf", "models/environment/megakit_door_frame_square.glb", 1.0, "VIEWPORT"),
    ("megakit_door_metal", "Modular SciFi MegaKit[Standard]/glTF/Platforms/Door_Metal.gltf", "models/environment/megakit_door_metal.glb", 1.0, "VIEWPORT"),
    ("megakit_wall_straight", "Modular SciFi MegaKit[Standard]/glTF/Walls/WallAstra_Straight.gltf", "models/environment/megakit_wall_astra_straight.glb", 1.0, "VIEWPORT"),
    ("megakit_wall_window", "Modular SciFi MegaKit[Standard]/glTF/Walls/WallAstra_Straight_Window.gltf", "models/environment/megakit_wall_astra_window.glb", 1.0, "VIEWPORT"),
    ("megakit_short_wall", "Modular SciFi MegaKit[Standard]/glTF/Walls/ShortWall_AccentStrip_Straight.gltf", "models/environment/megakit_short_wall_accent.glb", 1.0, "VIEWPORT"),
    ("megakit_top_cables", "Modular SciFi MegaKit[Standard]/glTF/Walls/TopCables_Straight.gltf", "models/environment/megakit_top_cables.glb", 1.0, "VIEWPORT"),
    ("megakit_column_pipes", "Modular SciFi MegaKit[Standard]/glTF/Columns/Column_Pipes.gltf", "models/environment/megakit_column_pipes.glb", 1.0, "VIEWPORT"),
    ("megakit_column_hollow", "Modular SciFi MegaKit[Standard]/glTF/Columns/Column_Hollow.gltf", "models/environment/megakit_column_hollow.glb", 1.0, "VIEWPORT"),
]


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def import_asset(path):
    suffix = path.suffix.lower()
    if suffix in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=str(path))
    elif suffix == ".fbx":
        bpy.ops.import_scene.fbx(filepath=str(path))
    elif suffix == ".obj":
        bpy.ops.wm.obj_import(filepath=str(path))
    else:
        raise ValueError(f"Unsupported asset type: {path}")


def bounds():
    mins = Vector((math.inf, math.inf, math.inf))
    maxs = Vector((-math.inf, -math.inf, -math.inf))
    found = False
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
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


def normalize(scale_multiplier):
    mins, maxs = bounds()
    center = (mins + maxs) * 0.5
    longest = max((maxs - mins).x, (maxs - mins).y, (maxs - mins).z, 0.001)
    scale = scale_multiplier / longest
    for obj in bpy.context.scene.objects:
        if obj.parent is None:
            obj.location -= center
            obj.scale *= scale
    bpy.context.view_layer.update()
    mins, _ = bounds()
    for obj in bpy.context.scene.objects:
        if obj.parent is None:
            obj.location.z -= mins.z
    bpy.context.view_layer.update()
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.name = obj.name.replace(" ", "_")
            obj.data.name = obj.data.name.replace(" ", "_")
            obj.select_set(True)
        else:
            obj.select_set(False)


def export_glb(path, material_mode="EXPORT"):
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_animations=False,
        export_materials=material_mode,
    )


def convert(asset_list, source_root, output_root):
    for item in asset_list:
        asset_id, relative_source, relative_output, scale = item[:4]
        material_mode = item[4] if len(item) > 4 else "EXPORT"
        source = source_root / relative_source
        output = output_root / relative_output
        if not source.exists():
            print(f"SKIP {asset_id}: missing {source}")
            continue
        clear_scene()
        import_asset(source)
        normalize(scale)
        export_glb(output, material_mode)
        print(f"OK {asset_id}: {source} -> {output}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", required=True)
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--kind", choices=["weapons", "environment", "drone", "new-enemies", "melee", "kit-pickups", "kit-props", "kit-enemies", "kit-weapons", "kit-structures", "kits", "all"], default="all")
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    args = parser.parse_args(argv)
    source_root = Path(args.source_root)
    output_root = Path(args.output_root)
    if args.kind in {"weapons", "all"}:
        convert(WEAPON_ASSETS, source_root, output_root)
    if args.kind in {"environment", "all"}:
        convert(ENVIRONMENT_ASSETS, source_root, output_root)
    if args.kind in {"drone", "all"}:
        convert(DRONE_ASSETS, source_root, output_root)
    if args.kind in {"new-enemies", "all"}:
        convert(NEW_ENEMY_ASSETS, source_root, output_root)
    if args.kind in {"melee", "all"}:
        convert(MELEE_ASSETS, source_root, output_root)
    if args.kind in {"kit-pickups", "kits", "all"}:
        convert(KIT_PICKUP_ASSETS, source_root, output_root)
    if args.kind in {"kit-props", "kits", "all"}:
        convert(KIT_PROP_ASSETS, source_root, output_root)
    if args.kind in {"kit-enemies", "kits", "all"}:
        convert(KIT_ENEMY_ASSETS, source_root, output_root)
    if args.kind in {"kit-weapons", "kits", "all"}:
        convert(KIT_WEAPON_ASSETS, source_root, output_root)
    if args.kind in {"kit-structures", "kits", "all"}:
        convert(KIT_STRUCTURE_ASSETS, source_root, output_root)


if __name__ == "__main__":
    main()
