# Apex Rift Asset Production List

This is the master list of real art assets needed to move Apex Rift from prototype geometry to an authored visual style.

The runtime is ready for GLB assets through:

- `js/AssetManager.js` for GLB/texture loading, caching, cloning, and disposal
- `js/VisualAssetRegistry.js` for stable asset IDs and file paths
- `js/LootDropVisualFactory.js` for asset-backed loot drops with procedural fallbacks
- `js/AudioAssetRegistry.js` plus `js/AudioManager.js` buffer playback for curated runtime OGG sound cues

All 3D models should ship as `.glb` unless there is a strong reason to use loose glTF files.
Runtime audio should ship as curated `.ogg` clips. Keep source WAV/MP3 packs in `my game assets/audio`; the current source library is over 1.5 GB and should not be loaded wholesale by the browser.

## Art Direction

Target look: readable cyber-parkour action RPG.

Use bold silhouettes, emissive trims, and strong manufacturer identity. Gameplay readability matters more than realism. The player should be able to identify traversal surfaces, enemy type, loot rarity, and weapon family at a glance while moving fast.

Manufacturer visual language:

| Manufacturer | Visual Identity |
| --- | --- |
| Redline | red/white speed hardware, exposed vents, aggressive fins, motion stripes |
| Synapse | cyan energy coils, clean paneling, shields, EMP/status tech |
| Hollow | orange/black volatile parts, hazard marks, unstable cores, explosive plating |
| Ghostworks | grey/violet stealth shapes, suppressed profiles, precision optics, low-glow trims |

## Technical Requirements

- Format: `.glb`
- Units: 1 Three.js unit = 1 meter
- Forward axis: model local `+Z` should face forward where practical
- Origin: place at logical gameplay pivot
- Materials: PBR materials using base color, roughness, metalness, normal, emissive when needed
- Texture sizes: prefer 1024 for small props/weapons, 2048 for hero player/enemy assets
- Geometry: keep silhouettes strong; avoid tiny details that disappear at gameplay distance
- Animations: name clips clearly, e.g. `Run`, `Jump`, `Slide`, `WallRunLeft`
- Licensing: only use original, purchased, or permissively licensed assets with attribution tracked

## Folder Layout

```text
assets/
  models/
    player/
    weapons/
    enemies/
    loot/
    environment/
  textures/
    materials/
    ui/
    fx/
  audio/
```

## Runtime Manifest Paths

These paths are already registered in `js/VisualAssetRegistry.js`.

| Asset ID | File Path | Priority |
| --- | --- | --- |
| `player.runner` | `assets/models/player/runner_base.glb` | High |
| `player.runner.firstPersonArms` | `assets/models/player/first_person_arms.glb` | Medium |
| `player.base.drizzel` | `assets/models/player/base_drizzel.glb` | Done |
| `player.base.gekkou` | `assets/models/player/base_gekkou.glb` | Done |
| `player.base.kasa` | `assets/models/player/base_kasa.glb` | Done |
| `player.base.kurenai` | `assets/models/player/base_kurenai.glb` | Done |
| `player.base.samidale` | `assets/models/player/base_samidale.glb` | Done |
| `player.base.shogun` | `assets/models/player/base_shogun.glb` | Done |
| `enemy.drone.basic` | `assets/models/enemies/drone_basic.glb` | High |
| `enemy.drone.sniper` | `assets/models/enemies/drone_sniper.glb` | Medium |
| `enemy.drone.swarm` | `assets/models/enemies/drone_swarm_core.glb` | Medium |
| `enemy.drone.hunter` | `assets/models/enemies/drone_hunter.glb` | Medium |
| `enemy.drone.robot` | `assets/models/enemies/drone_robot.glb` | Done |
| `enemy.arachnodroid` | `assets/models/enemies/arachnodroid.glb` | Candidate |
| `enemy.eyeMonster` | `assets/models/enemies/eye_monster.glb` | Candidate |
| `enemy.bot.recon` | `assets/models/enemies/recon_bot.glb` | Candidate |
| `enemy.bot.companion` | `assets/models/enemies/companion_bot.glb` | Candidate |
| `enemy.bot.quadrupedTank` | `assets/models/enemies/quadruped_tank.glb` | Candidate |
| `enemy.sentry.turretPlasma` | `assets/models/enemies/sentry_turret_plasma.glb` | Candidate |
| `enemy.sentry.turretSniper` | `assets/models/enemies/sentry_turret_sniper.glb` | Candidate |
| `enemy.sentry.base2A` | `assets/models/enemies/sentry_base_2a.glb` | Candidate |
| `enemy.essentials.*` | `assets/models/enemies/essentials_*.glb` | Candidate |
| `enemy.megakit.alien*` | `assets/models/enemies/megakit_alien_*.glb` | Candidate |
| `weapon.smg.generic` | `assets/models/weapons/smg_generic.glb` | High |
| `weapon.sniperRifle.generic` | `assets/models/weapons/sniper_rifle_generic.glb` | High |
| `weapon.shotgun.generic` | `assets/models/weapons/shotgun_generic.glb` | High |
| `weapon.plasmaRifle.generic` | `assets/models/weapons/plasma_rifle_generic.glb` | High |
| `weapon.rocketLauncher.generic` | `assets/models/weapons/rocket_launcher_generic.glb` | High |
| `weapon.energySword.generic` | `assets/models/weapons/energy_sword_generic.glb` | High |
| `weapon.energySword.laser` | `assets/models/weapons/energy_sword_laser.glb` | Done |
| `weapon.essentials.*` | `assets/models/weapons/essentials_*.glb` | Candidate |
| `loot.gear.cache` | `assets/models/loot/gear_cache.glb` | High |
| `loot.gear.sciFiChest` | `assets/models/loot/sci_fi_chest.glb` | Done |
| `loot.gem.generic` | `assets/models/loot/gem_generic.glb` | High |
| `loot.scrap.bundle` | `assets/models/loot/scrap_bundle.glb` | Medium |
| `loot.chip.stack` | `assets/models/loot/data_chip_stack.glb` | Medium |
| `loot.health.globe` | `assets/models/loot/health_globe.glb` | Medium |
| `loot.health.pack` | `assets/models/loot/health_pack.glb` | Done |
| `loot.ammo.small` | `assets/models/loot/ammo_small.glb` | Done |
| `loot.ammo.smg` | `assets/models/loot/smg_ammo.glb` | Done |
| `loot.ammo.sniper` | `assets/models/loot/sniper_ammo.glb` | Done |
| `loot.keycard` | `assets/models/loot/keycard.glb` | Done |
| `loot.syringe` | `assets/models/loot/syringe.glb` | Done |
| `loot.consumable.grenade` | `assets/models/loot/grenade_pickup.glb` | Low |
| `loot.consumable.mine` | `assets/models/loot/mine_pickup.glb` | Low |
| `loot.consumable.scanner` | `assets/models/loot/scanner_pickup.glb` | Low |
| `environment.rooftop.propPack` | `assets/models/environment/rooftop_prop_pack.glb` | High |
| `environment.skyline.towers` | `assets/models/environment/skyline_towers.glb` | Medium |
| `environment.skyline.*` | `assets/models/environment/skyline_*_building*.glb` | Done |
| `environment.cyberpunk.building06` | `assets/models/environment/cyberpunk_building_06.glb` | Done |
| `environment.bunker.wallContainerBlue` | `assets/models/environment/bunker_wall_container_blue.glb` | Done |
| `environment.bunker.chairRed` | `assets/models/environment/bunker_chair_red.glb` | Done |
| `environment.kit.*` | `assets/models/environment/kit_*.glb` | Done |
| `environment.megakit.*` | `assets/models/environment/megakit_*.glb` | Done |
| `environment.industrial.*` | `assets/models/environment/industrial_*.glb` | Done |
| `environment.corridor.kitjam202108` | `assets/models/environment/corridor_kitjam_2021_08.glb` | Candidate |

## Player Assets

| Asset | File | Notes |
| --- | --- | --- |
| Runner base body | `assets/models/player/runner_base.glb` | Hero third-person character with exo-suit silhouette |
| Drizzel base body | `assets/models/player/base_drizzel.glb` | Converted from `my game assets/DRIZZEL_asset/DRIZZLE_Lowpoly.fbx` |
| Gekkou base body | `assets/models/player/base_gekkou.glb` | Converted from `my game assets/GEKKOU_asset/GEKKOU_lowpoly.fbx` |
| Kasa base body | `assets/models/player/base_kasa.glb` | Converted from `my game assets/KASA_asset/KASA_Lowpoly.fbx` |
| Kurenai base body | `assets/models/player/base_kurenai.glb` | Converted from `my game assets/KURENAI_asset/KURENAI_lowpoly.fbx` |
| Samidale base body | `assets/models/player/base_samidale.glb` | Converted from `my game assets/SAMIDALE_asset/SAMIDALE_lowpoly.fbx` |
| Shogun base body | `assets/models/player/base_shogun.glb` | Converted from `my game assets/SHOGUN_asset/SHOGUN_Lowpoly.fbx` |
| First-person arms | `assets/models/player/first_person_arms.glb` | Optional rig for first-person view |
| Runner head variants | `assets/models/player/runner_heads.glb` | Character creation or future cosmetics |
| Exo-suit light armor | `assets/models/player/exosuit_light.glb` | Mobility-focused silhouette |
| Exo-suit medium armor | `assets/models/player/exosuit_medium.glb` | Balanced default silhouette |
| Exo-suit heavy armor | `assets/models/player/exosuit_heavy.glb` | Tankier silhouette for gear visuals |

Needed animation clips:

| Clip | Notes |
| --- | --- |
| Idle | Subtle breathing, readable stance |
| Walk | Root motion not required |
| Run | Parkour-ready forward movement |
| Sprint | More aggressive lean |
| JumpStart | Takeoff pose |
| AirLoop | Midair pose |
| LandSoft | Normal landing |
| LandHard | Heavy impact |
| Slide | Low profile slide |
| Roll | Recovery roll |
| WallRunLeft | Left wall contact |
| WallRunRight | Right wall contact |
| Climb | Vertical climb loop |
| LedgeHang | Hanging idle |
| Mantle | Climb over ledge |
| GrappleAim | Arm/torso aiming pose |
| GrappleSwing | Suspended swing pose |
| MeleeLight | Fast melee strike |
| MeleeHeavy | Heavy melee strike |
| Takedown | Close execution move |
| Hurt | Short damage reaction |
| Death | Prototype death fallback |

Current create-a-character bases are selectable in the character creator and saved as `character_base` in `localStorage`. They are visual-only bodies; origin and archetype still determine stats.

The character creator also exposes the split body-part and limb exports generated from the same character source packs:

| Runtime Pattern | Source/Script | Runtime Use |
| --- | --- | --- |
| `assets/models/player/parts/*.glb` | `scripts/export-character-parts.py` | Head, torso, arm, leg, and accent selections for the body-part creator. |
| `assets/models/player/limbs/*.glb` | `scripts/export-character-limbs.py` | Anatomical limb slots for deeper modular assembly. |

`js/CharacterCustomizationSystem.js` loads these as plain visual parts, adds runtime seam armor around major joins, and saves selections in browser storage. These pieces are ready for creator previews and player visuals; they are not yet a full mesh-merge/rig-retarget pipeline.

The converted bases use `mixamorig:*` bones and are driven in-game by `js/PlayerAnimationController.js`, which procedurally poses run, sprint, air, slide, climb, and grapple states from `Player.state`. The Universal Animation Library was inspected and uses a different `root/pelvis/...` skeleton, so its clips are not directly bound to these bases yet. Use Blender retargeting if authored clip playback is needed later.

To reconvert those six bases after source edits:

```powershell
blender --background --python scripts/convert-character-bases.py -- --source-root "my game assets" --output-root "assets/models/player"
```

Current industrial/environment additions:

| Runtime File Pattern | Source | Notes |
| --- | --- | --- |
| `assets/models/environment/industrial_*.glb` | `my game assets/more assets/GLB_industrial_cyberpunk_tilepack_v1.01` | Industrial Cyberpunk 3D Tilepack by Slippers, CC0 1.0; registered as `environment.industrial.*` and exposed in the level editor palette. |
| `assets/models/environment/corridor_kitjam_2021_08.glb` | `my game assets/more assets/corridor level kit - dueddel/KitJam-2021-08.glb` | Candidate full corridor kit scene; license needs confirmation before relying on it as core shipped content. |

## Weapon Assets

Create one clean generic model per procedural weapon family first. Manufacturer skins can be material variants later.

| Weapon Family | File | Required Visual Cues |
| --- | --- | --- |
| SMG | `assets/models/weapons/smg_generic.glb` | compact body, short barrel, magazine |
| Sniper Rifle | `assets/models/weapons/sniper_rifle_generic.glb` | long barrel, scope, precision silhouette |
| Shotgun | `assets/models/weapons/shotgun_generic.glb` | thick barrel cluster, chunky receiver |
| Plasma Rifle | `assets/models/weapons/plasma_rifle_generic.glb` | energy coils, glowing core |
| Rocket Launcher | `assets/models/weapons/rocket_launcher_generic.glb` | large tube, hazard markings |
| Energy Sword | `assets/models/weapons/energy_sword_generic.glb` | hilt plus emissive blade |

Current converted weapon models:

| Runtime File | Source |
| --- | --- |
| `assets/models/weapons/smg_generic.glb` | `my game assets/Modular Sci Fi Guns - Nov 2021/Guns/glTF/SMG_1.gltf` |
| `assets/models/weapons/sniper_rifle_generic.glb` | `my game assets/Modular Sci Fi Guns - Nov 2021/Guns/glTF/Sniper_1.gltf` |
| `assets/models/weapons/shotgun_generic.glb` | `my game assets/Modular Sci Fi Guns - Nov 2021/Guns/glTF/AR_5.gltf` |
| `assets/models/weapons/plasma_rifle_generic.glb` | `my game assets/Modular Sci Fi Guns - Nov 2021/Guns/glTF/AR_2.gltf` |
| `assets/models/weapons/rocket_launcher_generic.glb` | `my game assets/Modular Sci Fi Guns - Nov 2021/Guns/glTF/Grenade_3.gltf` |
| `assets/models/loot/grenade_pickup.glb` | `my game assets/Modular Sci Fi Guns - Nov 2021/Guns/glTF/Grenade.gltf` |

These are preloaded at boot and used by procedural weapon loot through `js/LootDropVisualFactory.js`. Shotgun and rocket launcher are currently best-fit stand-ins from the available sci-fi gun pack.

Equipped generated weapons also use these GLBs through `WeaponSystem.setAssetManager(...)`. Fixed weapon classes still keep their existing handcrafted placeholder meshes until they are migrated one by one.

Generated placeholder GLBs now cover:

| Runtime File | Purpose |
| --- | --- |
| `assets/models/weapons/energy_sword_generic.glb` | Energy sword weapon family stand-in |
| `assets/models/weapons/energy_sword_laser.glb` | Authored laser sword replacement for Energy Sword mappings |
| `assets/models/loot/gear_cache.glb` | Generic gear pickup |
| `assets/models/loot/gem_generic.glb` | Generic gem pickup |
| `assets/models/loot/scrap_bundle.glb` | Scrap pickup |
| `assets/models/loot/data_chip_stack.glb` | Chip pickup |
| `assets/models/loot/health_globe.glb` | Health pickup |
| `assets/models/loot/mine_pickup.glb` | Mine consumable pickup |
| `assets/models/loot/scanner_pickup.glb` | Scanner consumable pickup |
| `assets/models/loot/sci_fi_chest.glb` | Sci-Fi Essentials chest used for gear drops |
| `assets/models/loot/health_pack.glb` | Sci-Fi Essentials health pack used for health drops |
| `assets/models/loot/ammo_small.glb` | Ammo pickup candidate |
| `assets/models/loot/keycard.glb` | Keycard/scanner pickup candidate |
| `assets/models/loot/syringe.glb` | Future stim or consumable pickup candidate |
| `assets/models/enemies/drone_basic.glb` | Basic drone stand-in |
| `assets/models/enemies/drone_sniper.glb` | Sniper drone stand-in |
| `assets/models/enemies/drone_swarm_core.glb` | Swarm core stand-in |
| `assets/models/enemies/drone_hunter.glb` | Hunter drone stand-in |
| `assets/models/enemies/drone_robot.glb` | Authored drone converted from `my game assets/drone/robot_no_rig.fbx` |

Future manufacturer variants:

| Weapon Family | Redline | Synapse | Hollow | Ghostworks |
| --- | --- | --- | --- | --- |
| SMG | `smg_redline.glb` | `smg_synapse.glb` | `smg_hollow.glb` | `smg_ghostworks.glb` |
| Sniper Rifle | `sniper_redline.glb` | `sniper_synapse.glb` | `sniper_hollow.glb` | `sniper_ghostworks.glb` |
| Shotgun | `shotgun_redline.glb` | `shotgun_synapse.glb` | `shotgun_hollow.glb` | `shotgun_ghostworks.glb` |
| Plasma Rifle | `plasma_redline.glb` | `plasma_synapse.glb` | `plasma_hollow.glb` | `plasma_ghostworks.glb` |
| Rocket Launcher | `rocket_redline.glb` | `rocket_synapse.glb` | `rocket_hollow.glb` | `rocket_ghostworks.glb` |
| Energy Sword | `sword_redline.glb` | `sword_synapse.glb` | `sword_hollow.glb` | `sword_ghostworks.glb` |

## Enemy Assets

| Enemy | File | Notes |
| --- | --- | --- |
| Basic patrol drone | `assets/models/enemies/drone_basic.glb` | Replacement for current sphere drone |
| Authored robot drone | `assets/models/enemies/drone_robot.glb` | Converted from the new local FBX source. `DroneAI` uses it when available and falls back to procedural sphere/ring visuals if loading fails. |
| Arachnoid crawler | `assets/models/enemies/arachnodroid.glb` | Converted candidate for a ground melee drone or trap enemy. Source texture path needs cleanup before promotion. |
| Eye monster | `assets/models/enemies/eye_monster.glb` | Converted candidate for a floating void/psychic caster. Requires CC-BY-4.0 attribution to Levraicoincoin. |
| Recon bot | `assets/models/enemies/recon_bot.glb` | Converted candidate for light scout behavior. |
| Companion bot | `assets/models/enemies/companion_bot.glb` | Converted candidate for companion/NPC or friendly drone skin. |
| Quadruped tank | `assets/models/enemies/quadruped_tank.glb` | Converted candidate for heavy ground enemy behavior. |
| Sentry plasma turret | `assets/models/enemies/sentry_turret_plasma.glb` | Converted turret head module; needs a base/assembly system before gameplay use. |
| Sentry sniper turret | `assets/models/enemies/sentry_turret_sniper.glb` | Converted turret head module; needs a base/assembly system before gameplay use. |
| Sentry base 2A | `assets/models/enemies/sentry_base_2a.glb` | Converted sentry base module. |
| Essentials eye drone | `assets/models/enemies/essentials_eye_drone.glb` | Converted candidate for a fast floating scout. |
| Essentials quad shell | `assets/models/enemies/essentials_quad_shell.glb` | Converted candidate for armored ground behavior. |
| Essentials trilobite | `assets/models/enemies/essentials_trilobite.glb` | Converted candidate for crawler/swarm behavior. |
| MegaKit alien cyclop | `assets/models/enemies/megakit_alien_cyclop.glb` | Converted candidate for a bio-tech enemy variant. |
| MegaKit alien oculichrysalis | `assets/models/enemies/megakit_alien_oculichrysalis.glb` | Converted candidate for stationary/caster enemy behavior. |
| MegaKit alien scolitex | `assets/models/enemies/megakit_alien_scolitex.glb` | Converted candidate for a larger alien enemy variant. |
| Sniper drone | `assets/models/enemies/drone_sniper.glb` | Long lens, charge indicator, precision silhouette |
| Swarm core | `assets/models/enemies/drone_swarm_core.glb` | Central emitter for swarm behavior |
| Swarm mini-drone | `assets/models/enemies/drone_swarm_minion.glb` | Small orbiting drone |
| Hunter drone | `assets/models/enemies/drone_hunter.glb` | Dangerous late-spawn predator silhouette |
| Training dummy | `assets/models/enemies/training_dummy.glb` | Safehouse/practice target |
| Rift Guardian | `assets/models/enemies/rift_guardian.glb` | Large boss-scale enemy |

Needed enemy animation clips:

| Clip | Notes |
| --- | --- |
| IdleHover | Basic hovering |
| Patrol | Subtle movement/scan |
| Alert | Aggro transition |
| Attack | Firing/strike anticipation |
| Stagger | Damage reaction |
| Death | Break apart or power down |

To reconvert the authored drone:

```powershell
blender --background --python scripts/convert-selected-assets.py -- --source-root "my game assets" --output-root assets --kind drone
```

To reconvert the newly curated enemy candidates:

```powershell
blender --background --python scripts/convert-selected-assets.py -- --source-root "my game assets" --output-root assets --kind new-enemies
```

To reconvert the authored laser sword:

```powershell
blender --background --python scripts/convert-selected-assets.py -- --source-root "my game assets" --output-root assets --kind melee
```

## Audio Assets

The runtime audio set is curated and compressed to OGG Vorbis with `scripts/convert-audio-assets.ps1`. This is preferable to shipping raw WAV for the browser because the source audio folder contains 1,371 usable audio files totaling roughly 1.56 GB.

Current runtime cues:

| Cue | Runtime File | Source |
| --- | --- | --- |
| UI click | `assets/audio/ui/click.ogg` | `UI/click_double_on.wav` |
| UI hover | `assets/audio/ui/hover.ogg` | `UI/sci_fi_hover.wav` |
| UI select | `assets/audio/ui/select.ogg` | `UI/sci_fi_select.wav` |
| Jump | `assets/audio/player/jump.ogg` | `Retro/jump_short.wav` |
| Slide whoosh | `assets/audio/player/slide_whoosh.ogg` | `Other/whoosh_1.wav` |
| Weapon fire | `assets/audio/weapons/fire_generic.ogg` | `Weapons/shot_muffled.wav` |
| Reload | `assets/audio/weapons/reload.ogg` | `Weapons/weapon_equip_short.wav` |
| Weapon switch | `assets/audio/weapons/switch.ogg` | `Weapons/weapon_equip.wav` |
| Sword swing | `assets/audio/weapons/sword_swing.ogg` | `Weapons/sword_slice.wav` |
| Sword clash | `assets/audio/weapons/sword_clash.ogg` | `Weapons/sword_clash.wav` |
| Hit thud | `assets/audio/combat/hit_thud.ogg` | `Weapons/harsh_thud.wav` |
| Electric parry | `assets/audio/combat/electric_parry.ogg` | `ELECSprk_Anime Spark 1.wav` |
| Explosion | `assets/audio/combat/explosion.ogg` | `Retro/explosion_medium.wav` |
| Ability charge | `assets/audio/combat/ability_charge.ogg` | `MAGSpel_Anime Ability Charge 2.wav` |
| Loot pickup | `assets/audio/loot/pickup.ogg` | `Items/item_equip.wav` |
| Rare loot | `assets/audio/loot/rare.ogg` | `Weapons/weapon_upgrade.wav` |
| Drone alert | `assets/audio/enemies/drone_alert.ogg` | `Horror SFX Free/Monsters & Ghosts/robotic_hiss.wav` |
| Drone death | `assets/audio/enemies/drone_death.ogg` | `Horror SFX Free/Monsters & Ghosts/Robotic_bass.wav` |
| Drone explosion | `assets/audio/enemies/drone_explosion.ogg` | `Retro/explosion_large.wav` |

To reconvert the curated audio set:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/convert-audio-assets.ps1
```

Use `window.audioStatus()` in dev mode to inspect loaded decoded buffers.

## Loot Assets

| Loot Type | File | Notes |
| --- | --- | --- |
| Gear cache | `assets/models/loot/gear_cache.glb` | Generic exo-suit equipment pickup |
| Gem | `assets/models/loot/gem_generic.glb` | Material tint handles gem type |
| Scrap bundle | `assets/models/loot/scrap_bundle.glb` | Metal shards or parts |
| Data chip stack | `assets/models/loot/data_chip_stack.glb` | Currency pickup |
| Health globe | `assets/models/loot/health_globe.glb` | Red healing orb |
| Grenade pickup | `assets/models/loot/grenade_pickup.glb` | Consumable |
| Mine pickup | `assets/models/loot/mine_pickup.glb` | Consumable |
| Scanner pickup | `assets/models/loot/scanner_pickup.glb` | Consumable |
| Sci-fi chest | `assets/models/loot/sci_fi_chest.glb` | Runtime gear drop visual from Quaternius Sci-Fi Essentials |
| Health pack | `assets/models/loot/health_pack.glb` | Runtime health drop visual from Quaternius Sci-Fi Essentials |
| Ammo box | `assets/models/loot/ammo_small.glb` | Ammo pickup candidate |
| SMG ammo | `assets/models/loot/smg_ammo.glb` | SMG ammo pickup candidate |
| Sniper ammo | `assets/models/loot/sniper_ammo.glb` | Sniper ammo pickup candidate |
| Keycard | `assets/models/loot/keycard.glb` | Scanner/key item pickup candidate |
| Syringe | `assets/models/loot/syringe.glb` | Stim or consumable pickup candidate |

## Environment Assets

Start with modular dressing pieces. The gameplay collision can remain simple while these sit around it.

| Asset | File | Notes |
| --- | --- | --- |
| Rooftop prop pack | `assets/models/environment/rooftop_prop_pack.glb` | Vents, pipes, ducts, rails, antennae, AC units |
| Skyline towers | `assets/models/environment/skyline_towers.glb` | Background city silhouettes |
| Neon billboard set | `assets/models/environment/neon_billboards.glb` | Brand/world identity |
| Industrial pipe set | `assets/models/environment/pipe_set.glb` | Traversal dressing |
| Cable bundle set | `assets/models/environment/cable_bundle_set.glb` | Wall/floor dressing |
| Fan turbine | `assets/models/environment/fan_turbine.glb` | Animated prop candidate |
| Hologram projector | `assets/models/environment/hologram_projector.glb` | Runner vision/safehouse dressing |
| Door/gate set | `assets/models/environment/door_gate_set.glb` | Dungeon/safehouse/rift entrances |
| Hazard set | `assets/models/environment/hazard_set.glb` | Spikes, warning barriers, energy rails |
| Safehouse kit | `assets/models/environment/safehouse_kit.glb` | Identifier bench, stash terminal, shop props |

Current converted kit dressing:

| Runtime File | Source |
| --- | --- |
| `assets/models/environment/kit_crate.glb` | Quaternius Sci-Fi Essentials `Prop_Crate.gltf` |
| `assets/models/environment/kit_crate_large.glb` | Quaternius Sci-Fi Essentials `Prop_Crate_Large.gltf` |
| `assets/models/environment/kit_barrel_closed.glb` | Quaternius Sci-Fi Essentials `Prop_Barrel2_Closed.gltf` |
| `assets/models/environment/kit_locker.glb` | Quaternius Sci-Fi Essentials `Prop_Locker.gltf` |
| `assets/models/environment/megakit_access_point.glb` | Quaternius Modular SciFi MegaKit `Prop_AccessPoint.gltf` |
| `assets/models/environment/megakit_computer.glb` | Quaternius Modular SciFi MegaKit `Prop_Computer.gltf` |
| `assets/models/environment/megakit_item_holder.glb` | Quaternius Modular SciFi MegaKit `Prop_ItemHolder.gltf` |
| `assets/models/environment/megakit_vent_big.glb` | Quaternius Modular SciFi MegaKit `Prop_Vent_Big.gltf` |
| `assets/models/environment/megakit_door_dark.glb` | Quaternius Modular SciFi MegaKit `Door_DarkMetal.gltf` |
| `assets/models/environment/megakit_platform_*.glb` | Quaternius Modular SciFi MegaKit platform, ramp, stair, and rail pieces |
| `assets/models/environment/megakit_door_*.glb` | Quaternius Modular SciFi MegaKit door and frame pieces |
| `assets/models/environment/megakit_wall_*.glb` | Quaternius Modular SciFi MegaKit wall pieces |
| `assets/models/environment/megakit_column_*.glb` | Quaternius Modular SciFi MegaKit column pieces |

## Material And Texture Assets

| Texture | File | Notes |
| --- | --- | --- |
| Concrete albedo | `assets/textures/materials/concrete_albedo.png` | Rooftop floors/walls |
| Concrete normal | `assets/textures/materials/concrete_normal.png` | Pair with albedo |
| Brushed metal albedo | `assets/textures/materials/brushed_metal_albedo.png` | Beams/platforms/weapons |
| Brushed metal normal | `assets/textures/materials/brushed_metal_normal.png` | Registered in manifest |
| Floor trim emissive | `assets/textures/materials/floor_trim_emissive.png` | Registered in manifest |
| Hazard stripe | `assets/textures/materials/hazard_stripe.png` | Hollow/explosive areas |
| Glass panel | `assets/textures/materials/glass_panel.png` | Cyber architecture |
| Noise | `assets/textures/fx/noise.png` | Registered in manifest; dissolve, scanlines, distortion |
| Weapon icon atlas | `assets/textures/ui/weapon_icons.png` | Registered in manifest |
| Rarity icon atlas | `assets/textures/ui/rarity_icons.png` | Inventory/backpack UI |

## FX Assets

These can be textures, sprite sheets, or small GLB meshes.

| FX | Suggested File |
| --- | --- |
| Loot beam sprite/noise | `assets/textures/fx/loot_beam_noise.png` |
| Bullet impact decal | `assets/textures/fx/bullet_impact.png` |
| Slash arc | `assets/textures/fx/slash_arc.png` |
| Explosion flipbook | `assets/textures/fx/explosion_flipbook.png` |
| Electric arc | `assets/textures/fx/electric_arc.png` |
| Freeze burst | `assets/textures/fx/freeze_burst.png` |
| Burn lick | `assets/textures/fx/fire_lingering.png` |
| Void distortion | `assets/textures/fx/void_distortion.png` |
| EMP ring | `assets/textures/fx/emp_ring.png` |
| Grapple trail | `assets/textures/fx/grapple_trail.png` |

Current converted VFX sheets from Brackeys:

| Runtime File | Runtime Use |
| --- | --- |
| `assets/textures/fx/explosion_6x5.png` | explosive projectile impacts |
| `assets/textures/fx/electric_ring_6x5.png` | electric projectile impacts |
| `assets/textures/fx/fire_6x5.png` | fire/burn projectile impacts |
| `assets/textures/fx/impact_white_6x4.png` | generic projectile impacts |
| `assets/textures/fx/impact_big_6x5.png` | larger hit effect source |
| `assets/textures/fx/vortex_6x5.png` | void/psychic projectile impacts |
| `assets/textures/fx/wavy_blue_6x5.png` | future freeze/energy source |
| `assets/textures/fx/wavy_purple_6x5.png` | future void source |
| `assets/textures/fx/charge_7x6.png` | future charge/cast source |

`js/SpriteSheetEffects.js` drives projectile impact sprite sheets. Broader status-effect and skill VFX can reuse the same module.

## UI Assets

| UI Asset | File |
| --- | --- |
| Weapon icon atlas | `assets/textures/ui/weapon_icons.png` |
| Rarity icon atlas | `assets/textures/ui/rarity_icons.png` |
| Manufacturer logo atlas | `assets/textures/ui/manufacturer_logos.png` |
| Damage type icon atlas | `assets/textures/ui/damage_type_icons.png` |
| Exo-suit slot icons | `assets/textures/ui/exosuit_slot_icons.png` |
| Status effect icons | `assets/textures/ui/status_effect_icons.png` |

## Future Audio Assets

The first curated authored OGG set is already listed earlier in this document. Future additions should follow the same pattern: add one manifest entry in `js/AudioAssetRegistry.js`, convert to a compact `assets/audio/.../*.ogg` file, and keep the source pack out of runtime.

| Audio | Suggested Runtime Path |
| --- | --- |
| SMG shot variant | `assets/audio/weapons/smg_shot_02.ogg` |
| Sniper shot | `assets/audio/weapons/sniper_shot.ogg` |
| Shotgun shot | `assets/audio/weapons/shotgun_shot.ogg` |
| Plasma shot | `assets/audio/weapons/plasma_shot.ogg` |
| Rocket launch | `assets/audio/weapons/rocket_launch.ogg` |
| Energy sword heavy swing | `assets/audio/weapons/energy_sword_heavy.ogg` |
| Loot pickup legendary variant | `assets/audio/loot/legendary_02.ogg` |
| Rift ambience loop | `assets/audio/ambience/rift_loop.ogg` |

## First Asset Milestone

Make these first for the biggest visual jump with the least integration risk:

1. `assets/models/loot/gear_cache.glb`
2. `assets/models/weapons/smg_generic.glb`
3. `assets/models/weapons/sniper_rifle_generic.glb`
4. `assets/models/weapons/shotgun_generic.glb`
5. `assets/models/weapons/plasma_rifle_generic.glb`
6. `assets/models/weapons/rocket_launcher_generic.glb`
7. `assets/models/weapons/energy_sword_generic.glb`
8. `assets/models/enemies/drone_basic.glb`
9. `assets/models/player/runner_base.glb`
10. `assets/models/environment/rooftop_prop_pack.glb`

## Conversion Commands

Convert selected weapon, loot, and environment assets:

```powershell
blender --background --python scripts/convert-selected-assets.py -- --source-root "my game assets" --output-root assets --kind all
```

Convert only the Quaternius pickup and dressing kits:

```powershell
blender --background --python scripts/convert-selected-assets.py -- --source-root "my game assets" --output-root assets --kind kits
```

Individual Quaternius batches are also available:

```powershell
blender --background --python scripts/convert-selected-assets.py -- --source-root "my game assets" --output-root assets --kind kit-pickups
blender --background --python scripts/convert-selected-assets.py -- --source-root "my game assets" --output-root assets --kind kit-props
blender --background --python scripts/convert-selected-assets.py -- --source-root "my game assets" --output-root assets --kind kit-enemies
blender --background --python scripts/convert-selected-assets.py -- --source-root "my game assets" --output-root assets --kind kit-weapons
blender --background --python scripts/convert-selected-assets.py -- --source-root "my game assets" --output-root assets --kind kit-structures
```

Regenerate compact placeholder GLBs for loot, drones, and energy sword:

```powershell
blender --background --python scripts/create-placeholder-assets.py -- --output-root assets
```

In dev mode, run this in the browser console to inspect loaded/pending/failed assets:

```javascript
window.assetStatus()
```

## Adding A New Asset To The Runtime

1. Put the `.glb` or texture in the matching `assets/` folder.
2. Add or update its ID in `js/VisualAssetRegistry.js`.
3. Set `preload: true` only for assets that must be loaded before gameplay.
4. Use `assetManager.instantiateModel(assetId)` from a visual adapter module.
5. Keep a procedural fallback so the game remains playable when assets are missing.
6. Run `scripts/check.ps1`.
