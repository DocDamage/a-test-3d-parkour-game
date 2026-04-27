# Architecture

## Module Dependency Graph

```
index.html (UI shell, canvas, CSS)
    └── js/main.js (composition root)
        ├── THREE.js (renderer, scene, camera)
        ├── InputManager / GamepadController
        ├── Player.js (state machine, physics, health)
        │   └── CharacterSheet (stats)
        │   └── ComboSystem
        │   └── GrapplingHook
        │   └── Trajectory
        ├── World.js (geometry, collidables, platforms, hazards)
        │   └── DroneAI (patrol drones)
        ├── ThirdPersonCamera
        ├── PostProcessing (composer chain)
        ├── AudioManager (procedural synthesis)
        │
        ├── RPG DATA MODULES (24 modules)
        │   ├── CharacterSheet ←──┐
        │   ├── ProgressionSystem   │
        │   ├── ArchetypeSystem     │
        │   ├── OriginSystem        │
        │   ├── ExoSuitSystem ──────┤ (reads CharacterSheet for gear score)
        │   ├── AffixSystem         │
        │   ├── FamiliaritySystem   │
        │   ├── CompanionDrone      │
        │   ├── LoyaltySystem       │
        │   ├── FactionSystem       │
        │   ├── TerritorySystem     │
        │   ├── SafehouseSystem     │
        │   ├── BountySystem        │
        │   ├── NPCSystem           │
        │   ├── BlackoutSystem      │
        │   ├── RivalSystem         │
        │   ├── SubLevelSystem      │
        │   ├── MasterySystem       │
        │   ├── CodexSystem         │
        │   ├── ImplantSystem       │
        │   ├── LegacySystem        │
        │   ├── NewGamePlus         │
        │   └── CollapseMode        │
        │                           │
        ├── COMBAT MODULES (Phase 1-3)
        │   ├── DamageSystem ←──────┤ (reads player.getRPGStats())
        │   ├── HitboxSystem        │
        │   ├── LootSystem          │
        │   ├── EnemyHealthBar      │
        │   ├── SkillSystem ←───────┤ (reads player.getRPGStats() for CDR)
        │   ├── ResourceSystem      │
        │   ├── SkillBarUI          │
        │   ├── SkillData           │
        │   ├── ProjectileManager   │ (ranged projectile trajectory + collision)
        │   ├── LegendaryPowerSystem│ (executes legendary affix powers from gear)
        │   └── PassiveTree         │ (node investment, bonus aggregation, UI)
        │                           │
        ├── ENDGAME MODULES (Phase 4)
        │   ├── DifficultyTierSystem│
        │   ├── ApexRiftSystem      │
        │   └── NephalemGlory       │
        │                           │
        └── PARKOUR / FEATURE MODULES
            ├── DroneTakedown
            ├── BulletTime
            ├── OverclockSystem
            ├── MagnetBoots
            ├── ChainGrappleRelays
            ├── RunnerVision
            ├── DecalSystem
            ├── WeatherSystem / WeatherGameplay
            ├── ZiplineNetwork
            ├── PowerUpSystem
            ├── HologramPlatforms
            ├── StructuralCollapse
            ├── RisingTide
            ├── ParticleEffects
            ├── FootIK
            ├── ProceduralAnimation
            ├── DirectorMode
            ├── GhostRacing
            ├── AssistMode
            ├── SpeedrunILs
            ├── ChallengeSystem
            ├── InteractiveEnvironment
            ├── AdvancedMovement
            ├── AdvancedDrones (Sniper, Swarm, Hunter)
            └── LevelEditor
```

## Design Principles

1. **One module per subsystem.** Never bloat Player.js or World.js with new feature logic.
2. **main.js is the composition root.** All systems are instantiated there and wired by reference.
3. **Game loop contract:** All gameplay updates receive `finalDt` (time-dilated). Visual FX can use `dt`.
4. **Parkour = Combat.** Movement abilities are skills on the skill bar. The "Vertical ARPG" identity is preserved.
5. **Data-first RPG modules.** The 24 RPG modules are data-only shells with UI panels. Combat integration happens gradually (Phase 1-3).

## Critical Integration Points

### Player.js Contract
All subsystems expect `player` to expose:
- `position`, `velocity` (THREE.Vector3)
- `state` (string), `grounded` (boolean), `facing` (number)
- `health`, `maxHealth`, `isDead`, `isInvincible`
- `takeDamage(amount, type, source)`, `heal(amount)`, `die()`, `respawn()`
- `getRPGStats()` → returns merged base + gear + temp bonuses
- `RADIUS`, `currentHeight`

**New skill-related fields (added for archetype skills):**
- `moveSpeedMultiplier` (number) — applied to all movement speeds
- `_damageMultiplier` (number) — aggregated via CharacterSheet temp bonuses
- `_regenPerSecond` (number) — passive health regen tick
- `_staggerImmune` (boolean)
- `isInvisible` (boolean) — smoke bomb
- `_firewallActive` (boolean) — netrunner firewall
- `_predatorVisionActive` (boolean) — operative predator vision
- `_critBonusFromPredator` (number) — +0.15 crit while active
- `onJump(isDoubleJump)` — callback fired from `startJump()`

### World Arrays
- `world.collidables[]` — THREE.Mesh objects for AABB collision
- `world.climbables[]` — subset of collidables the player can climb
- `world.platforms[]` — MovingPlatform or compatible objects
- `world.grapplePoints[]` — THREE.Vector3 positions
- `world.drones.drones[]` — DroneAI instances
- `world._proximityMines[]` — Saboteur proxy mines (trigger volumes, NOT collision surfaces)
- `world._decoys[]` — Saboteur decoy objects with `mesh`, `health`, `takeDamage()`

**Rule:** Never mutate these arrays directly from gameplay modules. Use World placement methods or the Level Editor.

### main.js Time Dilation
```javascript
const timeScale = overclock.update(dt, activeInput);
const slowMo = droneTakedown.update(dt, player, activeInput, world.drones.drones);
const finalDt = dt * Math.min(timeScale, slowMo);
```

### Legendary Power Hooks
`LegendaryPowerSystem` receives event hooks from:
- `light_strike` / `claw_swipe` callbacks → `onMeleeHit(target)`
- `Player.startJump()` → `onJump(isDoubleJump)`
- `animate()` sprint check → `onSprint(dt)`
- `Player.takeDamage()` fatal path → `onTakeFatalDamage()`
- `drone.onDeath()` → `onEnemyKilled(enemy)`
- `Player.onDamageTaken()` → `onDamageDealt(target, amount)` (via DamageSystem)
- Perfect parry (not yet implemented) → `onPerfectParry()`

## File Size Budgets

| File | Target | Current |
|------|--------|---------|
| Player.js | < 2000 lines | ~1743 |
| main.js | < 1500 lines | ~1970 ⚠️ |
| World.js | < 1500 lines | ~900 |
| New modules | < 500 lines each | varies |

> **Note:** `main.js` exceeded 1500 lines after wiring 20 skill callbacks, hint system, settings wiring, and gamepad rumble. Consider extracting skill callbacks to `js/SkillCallbacks.js` or per-archetype files if it grows further.

## Performance Budgets

| System | Target CPU/frame |
|--------|-----------------|
| Player physics + collision | < 1ms |
| Foot IK (4 raycasts) | < 0.5ms |
| Drone AI (all drones) | < 0.5ms |
| Post-processing (full chain) | GPU-bound, ~2ms |
| Particle effects | < 0.3ms |
| ProjectileManager (max 20 live) | < 0.2ms |

## Dependency Rules

- `js/*.js` may import from `three` and sibling `js/*.js` files.
- No circular dependencies between gameplay modules.
- Data modules (CharacterSheet, ProgressionSystem, etc.) must not import Three.js.
- UI modules (SkillBarUI) must not import Three.js except for math types (Vector3).
