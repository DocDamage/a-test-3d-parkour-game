# Apex Rift — Warehouse Parkour Playground

A browser-based 3D parkour-RPG built with **Three.js r160** (ES modules). No build step — serve the files and play.

> **Play now:** `python -m http.server 8080` → `http://localhost:8080`
> **Dev mode:** append `#dev` to the URL for verbose console logging.

---

## Gameplay Loop

```
Character Creation → Explore Warehouse → Collect & Fight → Progress → Endgame
```

### 1. Character Creation
On first launch you choose an **Origin** (background story that grants passive stat bonuses) and a **Primary Archetype** (Drifter, Ghost, Brawler, Technician — each with a unique skill tree). Choices persist in `localStorage` and carry through New Game+.

### 2. Explore the Warehouse
The core 80×80m warehouse is your playground — climb walls, vault obstacles, wall-run, and grapple through 7 themed zones (Rooftop, Underground Tunnel, Vertical Shaft, Water Treatment, Freezer Section, Server Room, Hangar Bay). Collect **Data Chips** (scrap currency) and **Heart Piece** collectibles. Interact with **NPCs** for dialogue, bounties, and shop access.

### 3. Fight Drones & Earn XP
Enemy drones patrol every zone. Take them down by wall-running into them, using weapons, or chaining skills. Each kill awards XP, loot drops, and combo flow. Complete **Bounty Contracts** for bonus rewards. Defeating enemies fills your **Nephalem Glory** meter for damage/speed multipliers.

### 4. Progress Your Runner
- **Level up** via ProgressionSystem → earn Attribute Points for CharacterSheet stats (MOB, REF, SYN, FOR, TEC, GUT).
- Spend points on the **Passive Tree** for passive upgrades.
- Equip **Exo-Suit gear** with random affixes and Legendary Powers.
- Install **Implants** for permanent stat boosts.
- Unlock **Masteries** and **Codex entries** by performing techniques.
- Manage **Stamina** — sprint and skill use are gated by a stamina bar.

### 5. Challenge Modes
- **Time Trial** (`T`) — race 10 checkpoints, beat your ghost.
- **Speedrun ILs** (`1-4`) — per-zone leaderboard runs with S–F grading.
- **Rising Tide** (`Shift+O`) — survive endless toxic sludge rising from below.
- **Arena Mode** (`Shift+T`) — wave-based combat selector.
- **Boss Fight** (`B`) — 3-phase battle against The Overseer.

### 6. Endgame Loop
Defeating the Boss unlocks:
- **New Game+** — replay with corruption modifiers (elite drones, EMP bursts, gravity shifts, rapid respawn).
- **Collapse Mode** (`Y`) — 10-floor roguelike survival with scaling enemies.
- **Apex Rift** (`T`) — portal to a separate endgame dimension.

The **Legacy System** carries heirloom stats and dynasty bonuses from retired runners across NG+ cycles.

---

## Features

### Core Parkour — 16 Movement States

| State | How to Enter |
|-------|-------------|
| Idle / Walk / Sprint | `WASD` + `Shift` |
| Crouch | `C` while grounded |
| Jump | `Space` |
| Fall | Step off edge |
| Climb | `Space` into climbable wall |
| Slide | `C` while sprinting |
| Vault | `Space` into low obstacle |
| Wall-run | Sprint parallel to wall while airborne |
| Hang (ledge) | Fall near ledge edge |
| Roll | `C` while landing from height |
| Stumble | Hard landing without roll |
| Ragdoll | Severe sudden velocity loss |
| Grapple Aim / Swing / Retract | `Mouse2` |
| Ceiling Run | `Ctrl` near ceiling (Magnet Boots) |
| Platform Grab | Hold `E` at platform edge |

**Advanced tech:** crouch-jump, edge boost, climb-cancel kick, chain vaulting, bunny-hop chaining, strafe jumps, tic-tac, dive kick, ground pound, wall-kick stun, ledge takedown, ceiling drop assassination, backflip kick, vault strike, slide tackle, rolling thunder (invincible roll tackle).

### RPG Systems

#### Character Building
- **CharacterSheet** — 6 core stats: MOB (mobility), REF (reflexes / parry window), SYN (synergy / tech), FOR (fortitude / HP), TEC (tech / weapons), GUT (resilience). Stats derive crit chance, crit damage, parry window, stamina, and more.
- **ArchetypeSystem** — 4 archetypes (Drifter, Ghost, Brawler, Technician) each with unique passive bonuses and skill tree paths.
- **OriginSystem** — 6 origins granting flat stat bonuses and world-interaction modifiers.
- **ProgressionSystem** — XP → level-up → attribute points. Level-up toast shown in HUD.
- **PassiveTree** — spendable point tree keyed to archetype (`P`).
- **ImplantSystem** — slot-based permanent stat augmentations (`M`).
- **MasterySystem** — technique-based milestones (e.g. "land 50 vaults") (`L`).
- **CodexSystem** — lore entries unlocked by exploration and kills (`K`).
- **LegacySystem** — cross-NG+ heirloom stats and dynasty bonus applied to all CharacterSheet stat lookups.

#### Gear & Inventory
- **ExoSuitSystem** — helmet, chest, gloves, boots; each item has base stats + up to 4 random affixes (from AffixSystem) (`G`).
- **InventoryStash** — persistent off-character gear storage (`I`).
- **LegendaryPowerSystem** — unique effects: Aegis Field (parry-granted damage shield), Loot Beacon (auto-pickup radius), and more.
- **WeaponSystem** — 5 weapon slots (Melee, Sidearm, Primary, Heavy, Throwable); starter: energy sword + SMG.
- **WeaponLoadoutUI** — `[` panel to swap slots from the unlocked weapon pool.
- **WeaponModSystem** — attach mods to weapons for stat bonuses.
- **InventorySystem** — consumable bag: health potions, mana potions, smoke bombs, stamina vials (`]` to view, `6-9` quick-use).
- **BottleSystem** — Zelda-style 4-bottle slots (`6-9`), fillable at shops.
- **ResourceSystem** — tracks scrap, mana, energy, and crafting materials.

#### Economy
- **ShopSystem** — NPC vendor; shows debt indicator and 10% discount when `shop_bonus_chips` flag is active via ConsequenceSystem.
- **DebtSystem** — borrow chips when broke; accrues daily interest.
- **BountySystem** — accept kill contracts per zone; rank improves contract quality (`J`).
- **LootSystem** — enemies drop gear, consumables, scrap on death; consumables automatically routed to InventorySystem.

#### Social / World
- **FactionSystem** — runner factions with standing; affects prices and ally behavior.
- **TerritorySystem** — zone ownership shifts based on kills and events.
- **NPCSystem** — schedule-driven NPCs with time-of-day routing; sector position map for all world areas.
- **DialogueSystem** — branching choice dialogue with consequence recording.
- **ConsequenceSystem** — world-flag system; flags like `shop_bonus_chips` and `trophy_buff_active` alter gameplay globally.
- **RivalSystem** — up to 3 rival runners who compete, taunt, and fight.
- **FamiliaritySystem** — weapon use history boosts damage with oft-used weapons.
- **LoyaltySystem** — companion drone loyalty grows with use; unlocks advanced behaviors.

### Combat

#### Weapons (10+ Types)
Energy Sword, SMG, Rocket Launcher, Flamethrower, Plasma Rifle, Crossbow, Grenade Launcher, Sniper Rifle. All support hitbox-based melee, hitscan ranged, and projectile variants via ProjectileManager.

#### Drone Enemies

| Type | Behavior |
|------|---------|
| **Base Drone** | Patrol → detect → chase → melee + ranged shots (4–8m) |
| **Sniper Drone** | Ground-tracking laser, stun projectile |
| **Swarm Drone** | 3-drone triangle, simultaneous detection lock |
| **Hunter Drone** | Platform-destroying pursuit (Rising Tide) |

All drones: vision cones with LOS, stealth break on `player.isInvisible`, EMP-disable via NG+ `static_field`, separate ranged cooldown, Firewall interception (reflects shots back).

#### Combat Mechanics
- **ComboSystem** — 4-tier flow multiplier (1.0–1.30×) boosts speed and damage.
- **DamageSystem** — types: kinetic, energy, explosive, psychic. Applies CharacterSheet resistances, crit rolls, status effects.
- **HitboxSystem** — transient AABB hitboxes for melee, vault strikes, ground pound, rolling thunder.
- **StatusEffectSystem** — burn, stun, freeze, slow, root.
- **Parry** (`Shift+F`) — 0.25s + REF-stat bonus window. Aegis Field grants a damage-absorbing shield on perfect parry.
- **Perfect Dodge** — dodge during i-frame window → 2× counter for 2s.
- **DroneTakedown** (`F` while wall-running) — slow-mo execution.
- **NephalemGlory** — kill-streak tier power: T1 (+25% dmg / +10% spd), T2 (+60% / +25%), T3 (+100% / +50%) with particle trail.
- **DamageNumbers** — floating color-coded damage labels.
- **Stamina** (`StaminaSystem`) — sprint and skills consume stamina; `canSprint()` gates sprint entry.

#### Boss Fight: The Overseer
Circular arena, 3 phases:
- **Phase 1** — Sweep beam, shockwave slam, drone spawns.
- **Phase 2** — Dive bombs, missile barrage, platform purge, perimeter lasers.
- **Phase 3** — Time distortion, healing drones, arena collapse.

Destroy all 3 weak-point cores to win. S–F grade based on damage taken. Victory triggers `onVictory` callback → unlocks NG+ and CollapseMode.

### Skills
SkillSystem: 4 active slots mapped to `RMB`, `E`, `R`, `Q`. ~40 skills per archetype (mobility, combat, stealth, utility). SkillBarUI renders cooldown pip HUD.

### Endgame Systems

| System | Unlock | Key |
|--------|--------|-----|
| New Game+ | Beat the Boss | Auto |
| Collapse Mode | Beat the Boss or clear all dungeons | `Y` |
| Apex Rift | Post-boss | `T` |
| Legacy System | NG+ cycles | Auto |
| DifficultyTierSystem | Always | `Shift+T` selector |

**New Game+ corruption modifiers:** static_field (EMP bursts), rapid_respawn (30s drone revival), director_watches (all drones elite), gravity_shifts (periodic upward impulse), and more stacking per NG+ tier.

### Dungeons & Puzzles
- **DungeonSystem** — multi-room dungeons with locked doors, mini-bosses, and boss rooms.
- **PuzzleRoom** — block-push, pressure-plate, sequence puzzles; `onSolve` grants heart piece.
- **KeyItemSystem** — dungeon keys and plot items tracked separately (`Shift+I`).

### World & Environment

**8 Interactive Areas:** Moving platform gauntlet, laser corridor, glass bridge, wrecking ball room, fan shaft, spinner alley, conveyor run, mirror room.

**7 Themed Zones:** Rooftop, Underground Tunnel, Vertical Shaft, Water Treatment, Freezer Section (icy physics), Server Room, Hangar Bay.

**Dynamic Weather:** Rain (slippery), steam (obscures drones), power outage (lasers off + strobes). Affects friction, drone detection range, and laser states.

**Collectibles:**
- 15 Data Chips (scrap)
- 8 Heart Pieces in hard-to-reach spots — 4 pieces = +1 max HP heart container
- 10 Power-Up orb types: Speed, Ghost, Double Jump, Gravity, Magnet, Time Freeze, Super Jump, Invincible, Bounce, Teleport

**Structural collapse** — fracture physics on marked walls.

### Traversal Gadgets
- **GrapplingHook** — RMB aim, pendulum swing, retract. Trajectory preview line.
- **Zipline Network** — grab and slide.
- **Chain Grapple Relays** — cyan rings reset grapple cooldown.
- **Magnet Boots** — ceiling run with `Ctrl`.
- **OverclockSystem** (`Shift+Q`) — heat-based slow-mo with 2 air dashes.
- **RunnerVision** (`V`) — emissive highlight: climbables (red), vaultables (orange), grapple anchors (cyan), checkpoints (green). Routed through InputManager; no raw listener bypass.

### Visual Effects
- **Post-processing chain** — SAO → Bloom → Motion Blur → Film Grain → Chromatic Aberration → Vignette → Output.
- **Day/Night/Neon** preset cycle (`N`).
- **God Rays** — 4 volumetric shafts with dust motes.
- **Lens Flares** — on atmospheric point lights.
- **Particle Effects** — speed lines, sparks, dust, explosions, wall-run decals.
- **Procedural Animation** — head tracking, breathing, lean on movement transitions.
- **Foot IK** — slope adaptation, wall bracing.
- **Nephalem Glory trail** — cyan particle trail during kill-streak tiers.

### Audio
All audio procedurally synthesised via **Web Audio API** — no external files.
- Singleton `AudioContext` shared across all systems (no duplicate contexts).
- 3D positional audio via `THREE.AudioListener` attached to the camera.
- Dynamic ambience, surface-aware footsteps, jump, land, climb, slide, vault, grapple, UI SFX.

### Photo & Cinematic
- **Photo Mode** (`F12`) — free-orbit camera, depth-of-field, 5 filter presets. Pauses game.
- **Director Mode** — AI camera predicts highlight moments and records a 30s rolling buffer.

### Level Editor (`F1`)
Full in-browser 3D editor. 14 object types, live properties panel, undo, export/import JSON. Intentionally uses raw DOM events (separate from InputManager) because pointer lock is released in editor mode.

### Accessibility
- **Assist Mode** (`Shift+P`) — extended coyote time, auto-vault, halved knockback, slower drones and Rising Tide.
- **Haptics toggle** — settings panel checkbox; controller rumble on hard landings and hits.
- **Full gamepad** — Xbox / PS / Switch Pro; keyboard + gamepad are OR-merged so both work simultaneously.
- **Touch controls** — left-side joystick (movement), right-side swipe (camera look).

### Infrastructure
- **GameContext** (`js/GameContext.js`) — DI container with topological sort, circular dependency detection, event bus, and per-system `.update()` dispatch. Enables clean NG+ re-initialization.
- **SaveSystem** — serialize/deserialize all subsystems to `localStorage`.
- **InputManager** — edge detection (`wasPressed`), key consumption (`consumeKey`), synthetic mouse delta injection (`addMouseDelta`).
- **KeyBindings / KeybindingsUI** — runtime-remappable key bindings with settings panel.
- **Loading progress text** — `#loading-progress` sub-element updates: "Initializing renderer..." → "Building world..." → "Creating player..." → "Ready!".
- **WebGL 2 guard** — shows a clear error message before Three.js fails if WebGL 2 is absent.
- **Dev mode** (`#dev`) — enables `__DEV__` console warnings in all error catch blocks.

---

## Controls

### Keyboard & Mouse

| Key | Action |
|-----|--------|
| `W A S D` | Move |
| `Shift` | Sprint |
| `Space` | Jump / Grab / Hang |
| `C` | Slide / Crouch / Roll |
| `Q` | Air Dash |
| `Shift+Q` | Overclock |
| `Ctrl` | Magnet Boots |
| `Mouse2` | Grapple Aim |
| `F` | Context (Talk / Shop / Takedown) |
| `Shift+F` | Parry |
| `E` | Drop / Interact / Mirror |
| `T` | Time Trial |
| `Shift+T` | Arena Mode Selector |
| `O` | Settings |
| `Shift+O` | Rising Tide |
| `P` | Passive Tree |
| `Shift+P` | Assist Mode |
| `G` | Gear Panel |
| `U` | Companion |
| `H` | Safehouse |
| `J` | Bounty |
| `K` | Codex |
| `L` | Mastery |
| `I` | Stash |
| `Shift+I` | Key Items |
| `M` | Implants |
| `N` | Day / Night / Neon |
| `[` | Weapon Loadout |
| `]` | Inventory |
| `Y` | Collapse Mode |
| `B` | Boss Fight |
| `V` | Runner Vision |
| `Z` | Phase Mirror |
| `` ` `` | Overworld Map |
| `F1` | Level Editor |
| `F12` | Photo Mode |
| `1-4` | Speedrun ILs |
| `6-9` | Quick-use consumables |

### Controller (Xbox / PlayStation / Switch Pro)

| Input | Action |
|-------|--------|
| Left Stick | Move |
| Right Stick | Look |
| A / Cross | Jump / Grab |
| B / Circle | Slide / Crouch |
| X / Square | Air Dash |
| Y / Triangle | Drop |
| LB / L1 | Sprint |
| RB / R1 | Takedown |
| LT / L2 | Grapple Aim |
| RT / R2 | Overclock |
| L3 | Magnet Boots |
| R3 | Day / Night |

### Level Editor

| Input | Action |
|-------|--------|
| `Click` | Place / Select |
| `Right-Click` | Delete |
| `Drag` | Move |
| `Shift+Drag` | Move on Y axis |
| `Scroll` | Rotate Y |
| `Shift+Scroll` | Scale |
| `Middle-Mouse` | Orbit camera |
| `W A S D / Q E` | Fly camera |
| `Space` | Fast fly speed |
| `G` | Grid snap |
| `H` | Toggle helpers |
| `Delete` | Delete selected |
| `Ctrl+Z` | Undo |
| `Ctrl+S` | Export JSON |
| `Ctrl+O` | Import JSON |

---

## Architecture

```
index.html              — UI panels, canvas, importmap, CSS
js/main.js              — Game loop hub; composition root
js/GameContext.js       — DI container: register, topological sort, event bus
js/Player.js            — 16-state parkour controller (~1700 lines)
js/World.js             — Warehouse geometry, zones, collectibles, hazards
js/ThirdPersonCamera.js — Orbit + collision-avoiding follow camera
js/InputManager.js      — Keyboard/mouse, edge detection, key consumption
js/GamepadController.js — Gamepad API, dead zones, OR-merged with keyboard, rumble
js/PostProcessing.js    — EffectComposer chain + day/night transitions
js/AudioManager.js      — Procedural Web Audio synthesis, shared AudioContext
```

### Module Map
```
Traversal:    GrapplingHook, ZiplineNetwork, ChainGrappleRelays, MagnetBoots
              OverclockSystem, BulletTime, AdvancedMovement, RunnerVision
Combat:       CombatSystem, DamageSystem, HitboxSystem, StatusEffectSystem
              WeaponSystem, WeaponLoadout, WeaponLoadoutUI, WeaponModSystem
              DroneTakedown, ComboSystem, NephalemGlory
Enemies:      DroneAI, AdvancedDrones, EnemyManager, EnemyBase, EnemyHealthBar
              BossFight, RiftGuardian, MiniBossBase
RPG:          CharacterSheet, ProgressionSystem, ArchetypeSystem, OriginSystem
              PassiveTree, SkillSystem, SkillData, SkillCallbacks, SkillBarUI
              ExoSuitSystem, AffixSystem, ImplantSystem, LegendaryPowerSystem
              MasterySystem, CodexSystem, FamiliaritySystem
Inventory:    InventorySystem, InventoryStash, LootSystem, ResourceSystem
              BottleSystem, WeaponModSystem, KeyItemSystem
Economy:      ShopSystem, DebtSystem, BountySystem
Social:       NPCSystem, DialogueSystem, FactionSystem, TerritorySystem
              RivalSystem, LoyaltySystem, CompanionDrone
World:        MovingPlatform, HologramPlatforms, Hazards, WeatherSystem
              WeatherGameplay, PowerUpSystem, Collectibles, DecalSystem
              InteractiveEnvironment, StructuralCollapse, LightDarkWorldSystem
Challenge:    TimeTrial, SpeedrunILs, ChallengeSystem, GhostRacing
              RisingTide, ArenaMode, CollapseMode, ApexRiftSystem
              DifficultyTierSystem, NewGamePlus, LegacySystem
Content:      DungeonSystem, PuzzleRoom, SafehouseSystem, OverworldMap
              BlackoutSystem, SubLevelSystem
Visual:       ParticleEffects, GodRays, LensFlare, FootIK, ProceduralAnimation
              DamageNumbers, PhotoMode, DirectorMode
UI:           UIManager, MenuNavigator, HintSystem, SettingsUI, KeybindingsUI
              EditorUI, LevelEditor
```

---

## Development Setup

No build tooling required.

```bash
git clone https://github.com/DocDamage/a-test-3d-parkour-game.git
cd a-test-3d-parkour-game
python -m http.server 8080
# open http://localhost:8080
```

**Requirements:** WebGL 2 (Chrome 80+, Firefox 71+, Edge 80+).

**CDN deps (importmap in `index.html`):**
- `three` @ 0.160.0 via unpkg

### Validation
```powershell
scripts/check.ps1   # Windows — syntax-checks all js/*.js, enforces size limits, checks docs
scripts/check.sh    # Unix
```

### Adding a New Module
1. Create `js/MyModule.js` with a named export class.
2. Import in `js/main.js` after its dependencies.
3. Register: `ctx.register('myModule', ['dep1'], () => instance)`.
4. Call `.update(finalDt, ...)` in the `animate()` loop.
5. Add controls to `index.html` `#ui` panel if player-facing.
6. Run `scripts/check.ps1` before committing.

---

## Level Format

```json
{
  "version": 1,
  "metadata": { "name": "My Level", "author": "Player", "created": "2026-04-28" },
  "spawnPoint": { "x": 0, "y": 2, "z": 0 },
  "objects": [
    {
      "type": "platform",
      "position": { "x": 5, "y": 1, "z": 0 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "scale":    { "x": 1, "y": 1, "z": 1 },
      "color": 8899994,
      "props": { "width": 4, "height": 0.4, "depth": 4 }
    }
  ]
}
```

Import via Level Editor (`Ctrl+O`) or `levelEditor.importLevel(jsonString)`.

---

## License

MIT — fork, modify, and build on top freely.

---

Built with love and way too many `requestAnimationFrame` callbacks.
