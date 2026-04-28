export const ASSET_TAGS = Object.freeze({
    BOOT: 'boot',
    PLAYER: 'player',
    WEAPON: 'weapon',
    ENEMY: 'enemy',
    LOOT: 'loot',
    ENVIRONMENT: 'environment',
    FX: 'fx',
    UI: 'ui'
});

// Central registry for future authored assets. Keep paths stable so artists can
// drop GLB/texture files into /assets without changing gameplay modules.
export const VISUAL_ASSET_MANIFEST = Object.freeze({
    models: {
        'player.runner': {
            path: 'assets/models/player/runner_base.glb',
            tags: [ASSET_TAGS.PLAYER],
            scale: 1,
            notes: 'Main third-person runner mesh with parkour animation clips.'
        },
        'player.runner.firstPersonArms': {
            path: 'assets/models/player/first_person_arms.glb',
            tags: [ASSET_TAGS.PLAYER, ASSET_TAGS.WEAPON],
            scale: 1,
            notes: 'Optional first-person arms/weapon rig.'
        },
        'player.base.drizzel': {
            path: 'assets/models/player/base_drizzel.glb',
            tags: [ASSET_TAGS.PLAYER],
            scale: 1,
            notes: 'Converted from DRIZZEL low-poly source asset.'
        },
        'player.base.gekkou': {
            path: 'assets/models/player/base_gekkou.glb',
            tags: [ASSET_TAGS.PLAYER],
            scale: 1,
            notes: 'Converted from GEKKOU low-poly source asset.'
        },
        'player.base.kasa': {
            path: 'assets/models/player/base_kasa.glb',
            tags: [ASSET_TAGS.PLAYER],
            scale: 1,
            notes: 'Converted from KASA low-poly source asset.'
        },
        'player.base.kurenai': {
            path: 'assets/models/player/base_kurenai.glb',
            tags: [ASSET_TAGS.PLAYER],
            scale: 1,
            notes: 'Converted from KURENAI low-poly source asset.'
        },
        'player.base.samidale': {
            path: 'assets/models/player/base_samidale.glb',
            tags: [ASSET_TAGS.PLAYER],
            scale: 1,
            notes: 'Converted from SAMIDALE low-poly source asset.'
        },
        'player.base.shogun': {
            path: 'assets/models/player/base_shogun.glb',
            tags: [ASSET_TAGS.PLAYER],
            scale: 1,
            notes: 'Converted from SHOGUN low-poly source asset.'
        },

        'enemy.drone.basic': {
            path: 'assets/models/enemies/drone_basic.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.drone.sniper': {
            path: 'assets/models/enemies/drone_sniper.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.drone.swarm': {
            path: 'assets/models/enemies/drone_swarm_core.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.drone.hunter': {
            path: 'assets/models/enemies/drone_hunter.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.drone.robot': {
            path: 'assets/models/enemies/drone_robot.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1,
            notes: 'Authored robot drone converted from local FBX source. DroneAI uses it when present and falls back to procedural drone geometry.'
        },
        'enemy.arachnodroid': {
            path: 'assets/models/enemies/arachnodroid.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1,
            notes: 'Ground crawler candidate from the new arachnodroid source pack.'
        },
        'enemy.eyeMonster': {
            path: 'assets/models/enemies/eye_monster.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1,
            notes: 'Floating caster/void enemy candidate. Source is CC-BY-4.0 and requires attribution.'
        },
        'enemy.bot.recon': {
            path: 'assets/models/enemies/recon_bot.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.bot.companion': {
            path: 'assets/models/enemies/companion_bot.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.bot.quadrupedTank': {
            path: 'assets/models/enemies/quadruped_tank.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.sentry.turretPlasma': {
            path: 'assets/models/enemies/sentry_turret_plasma.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.sentry.turretSniper': {
            path: 'assets/models/enemies/sentry_turret_sniper.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.sentry.base2A': {
            path: 'assets/models/enemies/sentry_base_2a.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.essentials.eyeDrone': {
            path: 'assets/models/enemies/essentials_eye_drone.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.essentials.quadShell': {
            path: 'assets/models/enemies/essentials_quad_shell.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.essentials.trilobite': {
            path: 'assets/models/enemies/essentials_trilobite.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.megakit.alienCyclop': {
            path: 'assets/models/enemies/megakit_alien_cyclop.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.megakit.alienOculichrysalis': {
            path: 'assets/models/enemies/megakit_alien_oculichrysalis.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },
        'enemy.megakit.alienScolitex': {
            path: 'assets/models/enemies/megakit_alien_scolitex.glb',
            tags: [ASSET_TAGS.ENEMY],
            scale: 1
        },

        'weapon.smg.generic': {
            path: 'assets/models/weapons/smg_generic.glb',
            tags: [ASSET_TAGS.BOOT, ASSET_TAGS.WEAPON, ASSET_TAGS.LOOT],
            preload: true,
            scale: 0.65
        },
        'weapon.sniperRifle.generic': {
            path: 'assets/models/weapons/sniper_rifle_generic.glb',
            tags: [ASSET_TAGS.BOOT, ASSET_TAGS.WEAPON, ASSET_TAGS.LOOT],
            preload: true,
            scale: 0.65
        },
        'weapon.shotgun.generic': {
            path: 'assets/models/weapons/shotgun_generic.glb',
            tags: [ASSET_TAGS.BOOT, ASSET_TAGS.WEAPON, ASSET_TAGS.LOOT],
            preload: true,
            scale: 0.65
        },
        'weapon.plasmaRifle.generic': {
            path: 'assets/models/weapons/plasma_rifle_generic.glb',
            tags: [ASSET_TAGS.BOOT, ASSET_TAGS.WEAPON, ASSET_TAGS.LOOT],
            preload: true,
            scale: 0.65
        },
        'weapon.rocketLauncher.generic': {
            path: 'assets/models/weapons/rocket_launcher_generic.glb',
            tags: [ASSET_TAGS.BOOT, ASSET_TAGS.WEAPON, ASSET_TAGS.LOOT],
            preload: true,
            scale: 0.65
        },
        'weapon.energySword.generic': {
            path: 'assets/models/weapons/energy_sword_generic.glb',
            tags: [ASSET_TAGS.WEAPON, ASSET_TAGS.LOOT],
            scale: 0.65
        },
        'weapon.energySword.laser': {
            path: 'assets/models/weapons/energy_sword_laser.glb',
            tags: [ASSET_TAGS.WEAPON, ASSET_TAGS.LOOT],
            scale: 0.65,
            notes: 'Authored laser sword source converted from the Unity/FBX sword pack.'
        },
        'weapon.essentials.pistol': {
            path: 'assets/models/weapons/essentials_pistol.glb',
            tags: [ASSET_TAGS.WEAPON, ASSET_TAGS.LOOT],
            scale: 0.65
        },
        'weapon.essentials.revolver': {
            path: 'assets/models/weapons/essentials_revolver.glb',
            tags: [ASSET_TAGS.WEAPON, ASSET_TAGS.LOOT],
            scale: 0.65
        },
        'weapon.essentials.rifle': {
            path: 'assets/models/weapons/essentials_rifle.glb',
            tags: [ASSET_TAGS.WEAPON, ASSET_TAGS.LOOT],
            scale: 0.65
        },
        'weapon.essentials.sniper': {
            path: 'assets/models/weapons/essentials_sniper.glb',
            tags: [ASSET_TAGS.WEAPON, ASSET_TAGS.LOOT],
            scale: 0.65
        },

        'loot.gear.cache': {
            path: 'assets/models/loot/gear_cache.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1
        },
        'loot.gear.sciFiChest': {
            path: 'assets/models/loot/sci_fi_chest.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1,
            notes: 'Quaternius Sci-Fi Essentials chest, lightweight viewport-material export.'
        },
        'loot.gem.generic': {
            path: 'assets/models/loot/gem_generic.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1
        },
        'loot.scrap.bundle': {
            path: 'assets/models/loot/scrap_bundle.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1
        },
        'loot.chip.stack': {
            path: 'assets/models/loot/data_chip_stack.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1
        },
        'loot.health.globe': {
            path: 'assets/models/loot/health_globe.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1
        },
        'loot.health.pack': {
            path: 'assets/models/loot/health_pack.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1
        },
        'loot.ammo.small': {
            path: 'assets/models/loot/ammo_small.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1
        },
        'loot.ammo.smg': {
            path: 'assets/models/loot/smg_ammo.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1
        },
        'loot.ammo.sniper': {
            path: 'assets/models/loot/sniper_ammo.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1
        },
        'loot.keycard': {
            path: 'assets/models/loot/keycard.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1
        },
        'loot.syringe': {
            path: 'assets/models/loot/syringe.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1
        },
        'loot.consumable.grenade': {
            path: 'assets/models/loot/grenade_pickup.glb',
            tags: [ASSET_TAGS.BOOT, ASSET_TAGS.LOOT],
            preload: true,
            scale: 1
        },
        'loot.consumable.mine': {
            path: 'assets/models/loot/mine_pickup.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1
        },
        'loot.consumable.scanner': {
            path: 'assets/models/loot/scanner_pickup.glb',
            tags: [ASSET_TAGS.LOOT],
            scale: 1
        },

        'environment.rooftop.propPack': {
            path: 'assets/models/environment/rooftop_prop_pack.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1,
            notes: 'Modular vents, pipes, rails, ducts, billboards, antennas.'
        },
        'environment.skyline.towers': {
            path: 'assets/models/environment/skyline_towers.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.skyline.tiny': {
            path: 'assets/models/environment/skyline_tiny_building.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.skyline.small01': {
            path: 'assets/models/environment/skyline_small_building_01.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.skyline.small02': {
            path: 'assets/models/environment/skyline_small_building_02.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.skyline.small03': {
            path: 'assets/models/environment/skyline_small_building_03.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.skyline.small04': {
            path: 'assets/models/environment/skyline_small_building_04.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.skyline.tall01': {
            path: 'assets/models/environment/skyline_tall_building_01.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.skyline.tall02': {
            path: 'assets/models/environment/skyline_tall_building_02.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.skyline.tall03': {
            path: 'assets/models/environment/skyline_tall_building_03.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.skyline.large01': {
            path: 'assets/models/environment/skyline_large_building_01.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.cyberpunk.building06': {
            path: 'assets/models/environment/cyberpunk_building_06.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.bunker.wallContainerBlue': {
            path: 'assets/models/environment/bunker_wall_container_blue.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.bunker.chairRed': {
            path: 'assets/models/environment/bunker_chair_red.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.kit.crate': {
            path: 'assets/models/environment/kit_crate.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.kit.crateLarge': {
            path: 'assets/models/environment/kit_crate_large.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.kit.barrelClosed': {
            path: 'assets/models/environment/kit_barrel_closed.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.kit.locker': {
            path: 'assets/models/environment/kit_locker.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.accessPoint': {
            path: 'assets/models/environment/megakit_access_point.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.computer': {
            path: 'assets/models/environment/megakit_computer.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.itemHolder': {
            path: 'assets/models/environment/megakit_item_holder.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.ventBig': {
            path: 'assets/models/environment/megakit_vent_big.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.doorDark': {
            path: 'assets/models/environment/megakit_door_dark.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.platformMetal': {
            path: 'assets/models/environment/megakit_platform_metal.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.platformSimple': {
            path: 'assets/models/environment/megakit_platform_simple.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.platformRamp2': {
            path: 'assets/models/environment/megakit_platform_ramp_2.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.platformStairs4': {
            path: 'assets/models/environment/megakit_platform_stairs_4.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.platformRails4': {
            path: 'assets/models/environment/megakit_platform_rails_4.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.doorFrameSquare': {
            path: 'assets/models/environment/megakit_door_frame_square.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.doorMetal': {
            path: 'assets/models/environment/megakit_door_metal.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.wallAstraStraight': {
            path: 'assets/models/environment/megakit_wall_astra_straight.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.wallAstraWindow': {
            path: 'assets/models/environment/megakit_wall_astra_window.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.shortWallAccent': {
            path: 'assets/models/environment/megakit_short_wall_accent.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.topCables': {
            path: 'assets/models/environment/megakit_top_cables.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.columnPipes': {
            path: 'assets/models/environment/megakit_column_pipes.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.megakit.columnHollow': {
            path: 'assets/models/environment/megakit_column_hollow.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.bathroomTiles1': {
            path: 'assets/models/environment/industrial_bathroom_tiles_1.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1,
            notes: 'Industrial Cyberpunk 3D Tilepack by Slippers, CC0.'
        },
        'environment.industrial.bathroomTiles2': {
            path: 'assets/models/environment/industrial_bathroom_tiles_2.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.bathroomTiles3': {
            path: 'assets/models/environment/industrial_bathroom_tiles_3.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.cablePanel': {
            path: 'assets/models/environment/industrial_cable_panel.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.concreteBlockWall': {
            path: 'assets/models/environment/industrial_concrete_block_wall.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.concreteCeilingTiles': {
            path: 'assets/models/environment/industrial_concrete_ceiling_tiles.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.gratedPowerFloor': {
            path: 'assets/models/environment/industrial_grated_power_floor.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.groovedMetalWall': {
            path: 'assets/models/environment/industrial_grooved_metal_wall.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.markedMetalWalkway': {
            path: 'assets/models/environment/industrial_marked_metal_walkway.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.markedWalkwayJunction': {
            path: 'assets/models/environment/industrial_marked_walkway_junction.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.metalCrosshatch': {
            path: 'assets/models/environment/industrial_metal_crosshatch.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.metalVent': {
            path: 'assets/models/environment/industrial_metal_vent.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.paddedCellWall': {
            path: 'assets/models/environment/industrial_padded_cell_wall.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.patternedMetalFloor': {
            path: 'assets/models/environment/industrial_patterned_metal_floor.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.plateSteelFloor': {
            path: 'assets/models/environment/industrial_plate_steel_floor.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.powerLineWall': {
            path: 'assets/models/environment/industrial_power_line_wall.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.reinforcedLight': {
            path: 'assets/models/environment/industrial_reinforced_light.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.reinforcedMetalWall': {
            path: 'assets/models/environment/industrial_reinforced_metal_wall.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.reinforcedMetalWall2': {
            path: 'assets/models/environment/industrial_reinforced_metal_wall2.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.ridgedLightPanel': {
            path: 'assets/models/environment/industrial_ridged_light_panel.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.ridgedPanel': {
            path: 'assets/models/environment/industrial_ridged_panel.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.rivetedElectricityPanel': {
            path: 'assets/models/environment/industrial_riveted_electricity_panel.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.scratchedWhitePanel': {
            path: 'assets/models/environment/industrial_scratched_white_panel.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.industrial.wallCameraHal': {
            path: 'assets/models/environment/industrial_wall_camera_hal.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1
        },
        'environment.corridor.kitjam202108': {
            path: 'assets/models/environment/corridor_kitjam_2021_08.glb',
            tags: [ASSET_TAGS.ENVIRONMENT],
            scale: 1,
            notes: 'Candidate full corridor kit scene. Source folder did not include an obvious license file.'
        }
    },
    textures: {
        'material.floor.trim': {
            path: 'assets/textures/materials/floor_trim_emissive.png',
            tags: [ASSET_TAGS.ENVIRONMENT]
        },
        'material.concrete.albedo': {
            path: 'assets/textures/materials/concrete_albedo.png',
            tags: [ASSET_TAGS.ENVIRONMENT]
        },
        'material.metal.normal': {
            path: 'assets/textures/materials/brushed_metal_normal.png',
            tags: [ASSET_TAGS.ENVIRONMENT, ASSET_TAGS.WEAPON]
        },
        'ui.weapon.icons': {
            path: 'assets/textures/ui/weapon_icons.png',
            tags: [ASSET_TAGS.UI]
        },
        'fx.noise': {
            path: 'assets/textures/fx/noise.png',
            tags: [ASSET_TAGS.FX]
        },
        'fx.explosion': {
            path: 'assets/textures/fx/explosion_6x5.png',
            tags: [ASSET_TAGS.FX]
        },
        'fx.electricRing': {
            path: 'assets/textures/fx/electric_ring_6x5.png',
            tags: [ASSET_TAGS.FX]
        },
        'fx.fire': {
            path: 'assets/textures/fx/fire_6x5.png',
            tags: [ASSET_TAGS.FX]
        },
        'fx.impactBig': {
            path: 'assets/textures/fx/impact_big_6x5.png',
            tags: [ASSET_TAGS.FX]
        },
        'fx.impactWhite': {
            path: 'assets/textures/fx/impact_white_6x4.png',
            tags: [ASSET_TAGS.FX]
        },
        'fx.vortex': {
            path: 'assets/textures/fx/vortex_6x5.png',
            tags: [ASSET_TAGS.FX]
        },
        'fx.wavyBlue': {
            path: 'assets/textures/fx/wavy_blue_6x5.png',
            tags: [ASSET_TAGS.FX]
        },
        'fx.wavyPurple': {
            path: 'assets/textures/fx/wavy_purple_6x5.png',
            tags: [ASSET_TAGS.FX]
        },
        'fx.charge': {
            path: 'assets/textures/fx/charge_7x6.png',
            tags: [ASSET_TAGS.FX]
        }
    }
});

export const WEAPON_TYPE_ASSET_IDS = Object.freeze({
    SMG: 'weapon.smg.generic',
    'Submachine Gun': 'weapon.smg.generic',
    'SubMachineGun': 'weapon.smg.generic',
    'Sniper Rifle': 'weapon.sniperRifle.generic',
    SniperRifle: 'weapon.sniperRifle.generic',
    Pistol: 'weapon.essentials.pistol',
    Revolver: 'weapon.essentials.revolver',
    Rifle: 'weapon.essentials.rifle',
    Shotgun: 'weapon.shotgun.generic',
    'Plasma Rifle': 'weapon.plasmaRifle.generic',
    PlasmaRifle: 'weapon.plasmaRifle.generic',
    'Rocket Launcher': 'weapon.rocketLauncher.generic',
    RocketLauncher: 'weapon.rocketLauncher.generic',
    'Energy Sword': 'weapon.energySword.laser',
    EnergySword: 'weapon.energySword.laser',
    AssaultRifle: 'weapon.plasmaRifle.generic',
    'Assault Rifle': 'weapon.plasmaRifle.generic',
    GrenadeLauncher: 'weapon.rocketLauncher.generic',
    'Grenade Launcher': 'weapon.rocketLauncher.generic'
});

export const LOOT_ASSET_IDS = Object.freeze({
    gear: 'loot.gear.sciFiChest',
    gem: 'loot.gem.generic',
    scrap: 'loot.scrap.bundle',
    chips: 'loot.chip.stack',
    health_globe: 'loot.health.pack',
    grenade: 'loot.consumable.grenade',
    mine: 'loot.consumable.mine',
    scanner: 'loot.keycard',
    ammo: 'loot.ammo.small',
    syringe: 'loot.syringe'
});

export const MANUFACTURER_VISUALS = Object.freeze({
    Redline: { color: 0xff3344, emissive: 0xff1028, accent: 0xffffff },
    Synapse: { color: 0x38d8ff, emissive: 0x00aaff, accent: 0xd8fbff },
    Hollow: { color: 0xff9a22, emissive: 0xff4a00, accent: 0x101010 },
    Ghostworks: { color: 0xb6a8ff, emissive: 0x7755ff, accent: 0xd7d7df }
});

export function getLootModelId(drop) {
    if (!drop) return null;
    if (drop.type === 'weapon') {
        const weaponType = drop.itemData?.weaponType || drop.itemData?.baseWeapon?.displayName;
        return WEAPON_TYPE_ASSET_IDS[weaponType] || 'weapon.smg.generic';
    }
    if (drop.type === 'consumable') {
        return LOOT_ASSET_IDS[drop.consumableType] || LOOT_ASSET_IDS.scanner;
    }
    return LOOT_ASSET_IDS[drop.type] || null;
}

export function getWeaponModelId(weapon) {
    const weaponType = weapon?.weaponType || weapon?.itemData?.weaponType || weapon?.baseWeapon?.displayName || weapon?.name;
    return WEAPON_TYPE_ASSET_IDS[weaponType] || null;
}
