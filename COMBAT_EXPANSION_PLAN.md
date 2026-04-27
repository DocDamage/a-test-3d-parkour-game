# PARKOUR COMBAT EXPANSION — Master Plan

## Overview

Transform the parkour playground into a **movement-combat hybrid** where every parkour mechanic is also a weapon. The player doesn't just navigate the world—they weaponize their momentum, the environment, and dedicated gear to dismantle drone armies, hunt bosses, and survive escalating horde modes.

**Design pillars:**
1. **Parkour IS Combat** — Every movement state doubles as an attack vector
2. **Environment IS Arsenal** — The world is full of improvised weapons
3. **Enemies Are Puzzles** — Each drone type demands a specific movement response
4. **Flow = Power** — The combo meter fuels combat abilities, not just speed

---

## PHASE 1: FOUNDATION (Core Combat Infrastructure)

### 1.1 Player Health & Damage System

**File:** `js/Player.js` (modifications) + `js/DamageSystem.js` (new)

- Add `player.health` (100), `player.maxHealth` (100), `player.shield` (0)
- Add `player.takeDamage(amount, source, type)` — supports damage types: `kinetic`, `energy`, `explosive`, `electric`, `freeze`
- Add `player.heal(amount)` — health pickups, regen zones
- Add `player.isInvincible()` — powered by existing invincible orb + new iframes
- Add damage number popup system (floating text, 0.5s fade)
- Add screen-edge blood vignette that intensifies with low health
- Add death state: health hits 0 → death animation (3s) → respawn at checkpoint

**Damage type resistances:**
- Kinetic (melee, bullets): base damage
- Energy (lasers, plasma): reduced by 50% if shield active
- Explosive (missiles, barrels): 2× damage if not rolling
- Electric (EMP, arcs): drains shield first, then health
- Freeze (freezer zones): slows movement, stacks to stun

### 1.2 Combat State Machine

**New Player states:**
- `ATTACK_LIGHT` — quick strike, 0.3s, comboable
- `ATTACK_HEAVY` — charged strike, 0.6s, breaks shields
- `ATTACK_AERIAL` — airborne strike, dive kick / ground pound
- `BLOCK` — reduces incoming damage 75%, can parry
- `PARRY` — 0.2s window, reflects projectiles, triggers slow-mo
- `AIM` — ranged weapon aim, slows movement
- `RELOAD` — weapon reload, vulnerable
- `STUN` — enemy CC, 1-3s, no input
- `KNOCKBACK` — airborne from heavy hit, 0.5s recovery
- `CRAWL` — low-profile vent traversal, speed 2 m/s, silent, no jumping

**State transition rules:**
- Any attack can be canceled into dash (Q) or jump
- Block can be held indefinitely but drains stamina
- Parry window is 0.2s at start of block
- Aerial attacks only from JUMP/FALL/WALLRUN states
- `CRAWL` can only enter from `CROUCH` + forward into a vent collider; exit to `CROUCH` or `STAND` when forward space is clear

### 1.3 Stamina System

**File:** `js/Player.js`

- `player.stamina` (100), regenerates 20/s when grounded, 10/s airborne
- Costs:
  - Sprint: 5/s
  - Air dash: 15
  - Block: 10/s
  - Light attack: 10
  - Heavy attack: 25
  - Parry: 5 (on attempt, refunded on success)
  - Grapple: 10
- Stamina bar UI added to `#ui` panel

### 1.4 Hitbox / Hurtbox System

**File:** `js/HitboxSystem.js` (new)

Centralized collision for combat:
```javascript
class Hitbox {
  constructor(owner, type, shape, offset, duration, onHit)
  // type: 'melee', 'projectile', 'explosion', 'beam'
  // shape: { type: 'sphere', radius } | { type: 'box', size }
  // offset: Vector3 from owner position
}

class HitboxSystem {
  registerHitbox(hitbox)
  unregisterHitbox(hitbox)
  checkCollisions() // player hitboxes vs enemies, enemy hitboxes vs player
  update(dt)
}
```

- Supports team filters: `team: 'player' | 'enemy' | 'neutral'`
- Supports invincibility frames (iframes)
- Supports hitstun application
- Integrates with `DamageSystem.js` for damage calculation

### 1.5 CombatSystem.js

**File:** `js/CombatSystem.js` (new, ~800 lines)

Central attack orchestrator between input, player state, and hit registration.

```javascript
class CombatSystem {
  constructor(player, input, hitboxSystem, damageSystem, comboSystem, camera, audio)
}
```

**Responsibilities:**
- **Attack state machine** — drives `ATTACK_LIGHT`, `ATTACK_HEAVY`, `ATTACK_AERIAL`, `BLOCK`, `PARRY`, and `RELOAD` states; enforces transition rules and duration locks
- **Combo routing** — reads buffered inputs from `InputManager` and routes light → light → heavy finisher sequences; cancels invalid inputs early
- **Input buffering** — stores attack inputs up to 0.15s before the current animation ends, allowing seamless combo chaining
- **Hit registration** — creates melee `Hitbox` instances via `HitboxSystem`, passes damage results to `DamageSystem`, and applies hitstun
- **Flow meter integration** — reports combat actions to `ComboSystem` for flow generation; validates ability costs before execution
- **Camera shake & hit-stop** — triggers screen shake on heavy hits / parries; applies 0.05–0.15s time freeze on successful impact
- **Animation triggers** — dispatches normalized animation events (`attackStart`, `attackActive`, `attackEnd`) that `Player.js` consumes to update arm/mesh poses

**Integration points:**
- Called from `main.js` update loop after `ActionResolver` resolves combat inputs
- Reads `player.state` and writes new combat states only when the current state allows cancellation
- Emits `onHit(target, damage, type)` events consumed by `DamageSystem` and `ComboSystem`
- Queries `ComboSystem.getFlowPercent()` before authorizing flow-cost abilities

### 1.6 Checkpoint & Respawn System

**File:** `js/CheckpointSystem.js` (new)

**Checkpoint placement:**
- Trigger volumes placed by `World.js` at key traversal points (before/after arenas, hub exits, pre-boss corridors)
- Each checkpoint stores a unique `checkpointId`, 3D position, and facing angle
- Visual: cyan pulsing beacon with 1m interaction radius; auto-activates on entry

**Snapshot data structure:**
```javascript
{
  checkpointId: string,
  timestamp: number,
  player: {
    health, maxHealth, stamina, shield,
    position: Vector3, facing: number,
    activeWeaponSlot, ammoState: Map<string, { clip, reserve }>,
    flowPercent, skillTreeState
  },
  world: {
    destroyedCollidables: string[], // IDs of broken walls / platforms
    activatedSwitches: string[],
    collectedItems: string[]
  },
  enemies: {
    alive: { id, type, position, health, isElite }[],
    dead: string[] // IDs of permanently defeated enemies
  }
}
```

**Respawn flow (7 steps):**
1. Fade to black (0.3s)
2. Restore player health, stamina, shield, flow, and ammo from snapshot
3. Teleport player to checkpoint position + facing
4. Re-spawn all enemies that were alive in the snapshot (reset to their snapshot positions/health)
5. Permanently remove enemies recorded as `dead`
6. Restore world destructible state from snapshot
7. Fade in + UI cyan flash (0.2s); grant 1.5s invincibility

**Enemy state reset rules:**
- Non-boss enemies always reset to snapshot state on respawn
- Boss enemies are NOT respawned if already defeated; if the player died mid-boss, the boss resets to the phase-start state defined by the checkpoint
- Elite status is preserved from snapshot

**UI cyan flash:**
- Full-screen cyan overlay at 30% opacity, 0.1s hold, 0.1s fade-out
- Accompanied by procedural "reboot" audio chirp

### 1.7 Difficulty System

**File:** `js/DifficultySystem.js` (new)

**Difficulty configs:**

| Parameter | NORMAL | HARD |
|-----------|--------|------|
| `enemyDamage` | 1.0× | 1.5× |
| `enemyHealth` | 1.0× | 1.5× |
| `enemySpeed` | 1.0× | 1.25× |
| `deathPenalty` | None | -10% chips (min 0) |
| `ammoScarcity` | 1.0× pickup rate | 0.6× pickup rate |
| `checkpointFrequency` | Every beacon active | Every second beacon active |
| `parryWindow` | 0.2s | 0.15s |
| `perfectDodgeWindow` | 0.3s | 0.2s |

**Behavior rules for how each system reads difficulty:**
- `DamageSystem` — multiplies incoming enemy damage by `enemyDamage`
- `EnemyBase` — scales max HP by `enemyHealth` and move/turn speed by `enemySpeed`
- `Player` — on death, if `deathPenalty` > 0, deduct chips before respawn
- `World` / loot spawners — multiply ammo spawn probability by `ammoScarcity`
- `CheckpointSystem` — skip every other beacon when `checkpointFrequency` is reduced
- `CombatSystem` — feeds `parryWindow` and `perfectDodgeWindow` into timing checks

**Unlock condition:**
- `HARD` is unlocked after defeating the first boss on `NORMAL`
- Difficulty is selected at new-game start and persisted in the save slot; cannot be changed mid-run

### 1.8 Flow Meter Combat Integration

**Files:** `js/ComboSystem.js` (modifications) + `js/CombatSystem.js`

**Flow generation table:**

| Action | Flow Gained |
|--------|-------------|
| Light attack | +8% |
| Heavy attack | +15% |
| Combo finisher | +25% |
| Perfect dodge | +10% |
| Parry | +20% |
| Parkour chain | +5% per link |
| Elite kill | +30% |

**Flow depletion table:**

| Ability | Flow Cost |
|---------|-----------|
| Shockwave Clap | 40% |
| Decoy Afterimage | 50% |
| Overclocked | 100% |
| EMP Burst | 25% |

**UI representation:**
- Horizontal bar rendered directly above the stamina bar in the `#ui` panel
- 4 discrete segments (25% each) for at-a-glance readability
- Fills left-to-right; entire bar pulses with a cyan glow at 100%
- Cost previews: when an ability input is held, the corresponding segments dim to show the spend

**Decay rules:**
- Flow begins decaying at 2% per second only after 5s of no combat or parkour actions
- Decay is paused while the player is in combat (enemy within 15m and alert, or player state is an attack/block/parry)
- Decay is also paused during boss encounters
- Flow does **not** decay while `Overclocked` is active

---

## PHASE 2: PARKOUR-INTEGRATED MELEE (10 Mechanics)

### 2.1 Dive Kick
**Input:** Air dash (Q) into enemy
**Effect:** Heavy knockback + ground slam AOE on landing. Damage = 25 + velocity bonus.
**Visual:** Blue trail during dash, impact spark + shockwave ring.
**Integration:** Extend `AirDash` in Player.js. If dash path intersects enemy hitbox, trigger dive kick.

### 2.2 Slide Tackle
**Input:** Slide (C) into grounded enemy
**Effect:** Leg sweep, drone knocked down for 3s. Damage = 15.
**Visual:** Dust cloud, enemy tips over.
**Integration:** Player.updateSlide() checks slide direction raycast for enemy hitboxes.

### 2.3 Wall-Kick Stun
**Input:** Wallrun → jump off enemy
**Effect:** Boot to face, 3s stun. Damage = 20.
**Visual:** Impact flash on enemy, stun stars.
**Integration:** Player.updateWallRun() — if wall normal points at enemy within 1m, redirect jump into kick.

### 2.4 Vault Strike
**Input:** Vault over enemy
**Effect:** Auto elbow drop behind them. Damage = 20. Backstab bonus: +50%.
**Visual:** Vault animation continues, elbow mesh extends.
**Integration:** Vault state checks if vault target is an enemy.

### 2.5 Ledge Takedown
**Input:** Hang on ledge → `E` when enemy patrols past
**Effect:** Pull enemy over ledge, instant kill if fall > 5m. Otherwise 50 damage.
**Visual:** Arm reaches up, grabs, pulls down.
**Integration:** Hang state + proximity check to enemy path.

### 2.6 Ceiling Drop
**Input:** Magnet boots (Ctrl) on ceiling → Space
**Effect:** Drop assassination. Damage = 40. Silent.
**Visual:** Player detaches, falls with knife-out pose, lands on enemy.
**Integration:** Ceiling run state + drop input.

### 2.7 Rolling Thunder
**Input:** Roll (C mid-air) through grounded enemies
**Effect:** Invincible tackle. Damage = 10 per hit. I-frames entire roll.
**Visual:** Spinning blur, impact sparks.
**Integration:** Roll state checks for enemy overlap each frame.

### 2.8 Ground Pound
**Input:** Hold C in air for 0.3s → release
**Effect:** Slam down, shockwave damages + stuns in 4m radius. Damage = 30 center, 15 edge.
**Visual:** Player curls into ball, slams, expanding ring.
**Integration:** New charged aerial attack state.

### 2.9 Backflip Kick
**Input:** Jump + S + Space
**Effect:** Backflip boot, launches enemy upward. Damage = 20. Launches for combo juggle.
**Visual:** Backflip animation, foot contact flash.
**Integration:** Directional combo input.

### 2.10 Sprint Shoulder Bash
**Input:** Sprint + F (no wall)
**Effect:** Shoulder charge, breaks shields, knocks back. Damage = 25.
**Visual:** Lowered shoulder, speed lines.
**Integration:** Sprint state + F input.

---

## PHASE 3: RANGED & PROJECTILE COMBAT (8 Mechanics)

### 3.1 Grapple Pull / Slingshot
**Input:** Grapple enemy (Mouse2) + tap Q
**Effect:** Yank enemy toward you (or you toward them if heavier). Damage on impact = 20.
**Visual:** Cable tension, enemy dragged.
**Integration:** Extend GrapplingHook.js with enemy targeting.

### 3.2 Shuriken / Disk Throw
**Input:** Pick up debris (E near broken object) + Mouse1
**Effect:** Throwable projectile, ricochets off walls up to 3 times. Damage = 15 per hit.
**Visual:** Spinning disk trail, spark on bounce.
**File:** `js/ProjectileManager.js` — new pooled projectile system.

### 3.3 Drone Hijack
**Input:** Takedown (F) + hold F for 1s
**Effect:** Possess drone. Shoot its laser for 5s. Damage = 10/s beam.
**Visual:** Camera switches to drone POV, reticle appears.
**Integration:** DroneTakedown.js + new hijack state.

### 3.4 Explosive Barrel Kick
**Input:** Sprint into red explosive barrels
**Effect:** Kick barrel as projectile. Explodes on impact. Damage = 50 AOE.
**Visual:** Barrel tumbles with fuse spark, explosion.
**Integration:** InteractiveEnvironment.js adds explosive barrel type.

### 3.5 Steam Pipe Redirect
**Input:** Dash into pipe + aim with mouse
**Effect:** 5s controllable steam jet. Pushes enemies, damages at close range (5/s).
**Visual:** Jet stream particle, enemy pushed back.
**Integration:** InteractiveEnvironment.js.

### 3.6 Mirror Laser Redirect
**Input:** E on mirror to rotate
**Effect:** Redirects hazard lasers at enemies. Laser damage = 20/s.
**Visual:** Laser bounces off mirror with new angle.
**Integration:** Hazards.js + InteractiveEnvironment.js.

### 3.7 Zipline Gun
**Input:** Aim (hold Mouse2) + Mouse1 at enemy
**Effect:** Pin enemy to nearest wall for 4s. Immobilized.
**Visual:** Cable shoots out, wraps enemy, pins.
**File:** `js/ZiplineGun.js` — new gadget.

### 3.8 EMP Burst
**Input:** Double-tap Q on ground
**Effect:** Disable all drones in 8m radius for 4s. No damage.
**Visual:** Blue radial pulse, drones spark and drop.
**Cooldown:** 15s.
**Integration:** New ability, shares Q with dash but grounded-only.

---

## PHASE 4: DEFENSIVE & COUNTER SYSTEMS (8 Mechanics)

### 4.1 Parry
**Input:** Precise F just before projectile/laser fires
**Window:** 0.2s
**Effect:** Reflect projectile back at attacker. 3× damage return.
**Visual:** Time slows to 0.3× for 0.5s, white flash, projectile reverses.
**Integration:** Player BLOCK state edge detection.

### 4.2 Perfect Dodge
**Input:** Dash (Q) through enemy attack
**Window:** 0.3s before impact
**Effect:** Slow-mo counter window (2s). Next attack = 2× damage.
**Visual:** Ghost afterimage, enemy attack whiffs through.
**Integration:** HitboxSystem + dodge timing check.

### 4.3 Grapple Block
**Input:** Grapple cable intercepts missile mid-flight
**Effect:** Cable destroys missile, no explosion.
**Visual:** Cable snaps taut, missile destroyed in spark.
**Integration:** ProjectileManager + GrapplingHook collision.

### 4.4 Decoy Afterimage
**Trigger:** Flow meter at max
**Input:** Shift+Q
**Effect:** Hologram clone stays at position, enemies target clone for 3s. Player invisible.
**Visual:** Clone flickers cyan, player fades.
**Integration:** ComboSystem + Ghost power-up synergy.

### 4.5 Panic Roll
**Input:** C right as attack hits
**Window:** 0.15s
**Effect:** I-frames + reposition 3m in input direction.
**Visual:** Red flash averted, roll animation.
**Integration:** Roll state + hit timing.

### 4.6 Knockback Recovery
**Input:** Space while airborne from enemy hit
**Effect:** Recovery flip, no stumble, reduced damage 50%.
**Visual:** Tuck and flip, land on feet.
**Integration:** KNOCKBACK state edge.

### 4.7 Drone Meat Shield
**Input:** Grapple drone + hold E
**Effect:** Hold drone as shield. Absorbs next 50 damage, then drone destroyed.
**Visual:** Drone held in front, sparks on hits.
**Integration:** GrapplingHook + new grapple state.

### 4.8 Platform Shield
**Input:** Grab moving platform edge + hold E
**Effect:** Hold platform as mobile cover. Blocks projectiles from front.
**Visual:** Platform tilts up, player crouches behind.
**Integration:** Platform interaction.

---

## PHASE 5: STEALTH & ASSASSINATION (7 Mechanics)

### 5.1 Predator Vision
**Input:** Hold V (extends Runner Vision)
**Effect:** See enemy patrol paths (dotted lines), detection cones (red translucent), and hidden vents.
**Visual:** Red cones, yellow paths, cyan vents.
**Integration:** RunnerVision.js extension.

### 5.2 Silent Takedown
**Input:** Crouch-walk behind drone → F
**Effect:** Silent disable. No alert. Instant kill on basic drones.
**Visual:** Neck snap animation, drone powers down silently.
**Integration:** Player CROUCH state + back proximity check.

### 5.3 Body Hide
**Input:** Takedown + E
**Effect:** Stuff body into nearest vent/locker. Prevents alarm.
**Visual:** Drag animation, body disappears into vent.
**Integration:** InteractiveEnvironment vents.

### 5.4 Distraction
**Input:** Throw collectible chip (hold E + aim)
**Effect:** Drone investigates sound. Back turned for 5s.
**Visual:** Chip arcs, drone turns to investigate.
**Integration:** Collectibles + DroneAI.

### 5.5 Light Toggle
**Input:** E on light switch (night only)
**Effect:** Darkness in zone. Drones lose vision range to 3m.
**Visual:** Lights flicker off, emergency exit signs only.
**Integration:** Day/night system + point light toggle.

### 5.6 Vent Assassination
**Input:** Break vent (sprint into it) → crawl → drop on enemy
**Effect:** Instant kill from above.
**Visual:** Grate breaks, crawl through duct, drop assassination.
**Integration:** InteractiveEnvironment vents + crawl state.

### 5.7 Phantom Strike
**Trigger:** Ghost power-up active
**Input:** First attack while invisible
**Effect:** 3× damage, ignores shields, auto-critical.
**Visual:** Enemy explodes into data fragments.
**Integration:** PowerUpSystem + DamageSystem.

---

## PHASE 6: AOE & CROWD CONTROL (8 Mechanics)

### 6.1 Shockwave Clap
**Trigger:** Flow meter level 3 + Ground Pound
**Effect:** Radial EMP + physics push. 40 damage, 6m radius. Drones disabled 2s.
**Visual:** Shockwave ring, drones fly backward.
**Integration:** ComboSystem reward.

### 6.2 Chain Lightning
**Trigger:** Hit drone with electric damage near conductive surface
**Effect:** Arcs to 2 nearby drones. Each arc = 20 damage.
**Visual:** Lightning bolt between drones.
**Integration:** New electric damage type + floor material check.

### 6.3 Oil Slick
**Input:** Kick overclock coolant puddle (sprint into it)
**Effect:** Enemies slip, fall, take 10 damage. 5s duration.
**Visual:** Puddle spreads, enemies slide and tumble.
**Integration:** OverclockSystem puddles + Hazards.

### 6.4 Collapse Trigger
**Input:** StructuralCollapse wall + E (charge 1s)
**Effect:** Trigger controlled collapse on enemy patrol route. 60 damage if crushed.
**Visual:** Wall cracks, falls, dust cloud.
**Integration:** StructuralCollapse.js + trigger zones.

### 6.5 Freezer Burst
**Input:** Dash into freezer pipe
**Effect:** Frost cloud, 5m radius. Enemies slowed 50%, stacks to freeze (3s stun).
**Visual:** White mist, ice crystals on enemies.
**Integration:** FreezerSection + Hazards.

### 6.6 Toxic Splash
**Input:** Rising Tide sludge + dash
**Effect:** Splash on dash. DOT 5/s for 5s on enemies.
**Visual:** Green splatter, enemy corrodes.
**Integration:** RisingTide + DamageSystem.

### 6.7 Fan Blade Shred
**Input:** Lure enemy into fan shaft
**Effect:** Instant gib. No drops.
**Visual:** Blood spray, body parts fly.
**Integration:** Hazards fan + enemy AI pathing.

### 6.8 Spinner Ride
**Input:** Grapple spinner beam
**Effect:** Ride the beam in circular sweep. Kick enemies for 15 damage per hit.
**Visual:** Player spins with beam, kicking out.
**Integration:** Hazards spinners + GrapplingHook.

---

## PHASE 7: WEAPON SYSTEM

### 7.1 Weapon Architecture

**File:** `js/WeaponSystem.js` (new manager)
**File:** `js/weapons/` directory (one file per weapon)

```javascript
class Weapon {
  constructor(config) {
    this.name = config.name;
    this.type = config.type; // 'melee', 'pistol', 'rifle', 'heavy', 'gadget'
    this.damage = config.damage;
    this.fireRate = config.fireRate; // shots per second
    this.clipSize = config.clipSize;
    this.reloadTime = config.reloadTime;
    this.range = config.range;
    this.projectileSpeed = config.projectileSpeed;
    this.recoil = config.recoil;
    this.spread = config.spread;
    this.ammoType = config.ammoType;
    this.special = config.special; // weapon-specific ability
  }
  
  fire(origin, direction, owner)
  reload()
  getAmmo()
  addAmmo(amount)
}
```

### 7.2 Melee Weapons

| Weapon | Damage | Speed | Special |
|--------|--------|-------|---------|
| **Pipe Wrench** | 25 | Medium | Shield break |
| **Shock Baton** | 15 | Fast | Stuns for 0.5s |
| **Sledgehammer** | 50 | Slow | Ground pound AOE |
| **Energy Blade** | 35 | Fast | Ignores armor, reflects lasers |
| **Chain Whip** | 20 | Medium | 3m range, pulls enemy closer |

### 7.3 Pistols

| Weapon | Damage | RPM | Clip | Special |
|--------|--------|-----|------|---------|
| **Semi-Auto Pistol** | 15 | 300 | 12 | Reliable, headshot = 2× |
| **Burst Pistol** | 12×3 | 180 | 15 | 3-round burst, accurate |
| **Plasma Pistol** | 20 | 240 | 8 | Charge shot penetrates shields |
| **Grapple Pistol** | 5 | 120 | 6 | Pulls enemy to you on hit |
| **Silenced Pistol** | 12 | 200 | 10 | Silent kills from behind |

### 7.4 Rifles

| Weapon | Damage | RPM | Clip | Special |
|--------|--------|-----|------|---------|
| **Assault Rifle** | 18 | 600 | 30 | Full-auto, reliable |
| **Marksman Rifle** | 45 | 120 | 10 | Scoped, headshot = 3× |
| **Plasma Rifle** | 25 | 450 | 24 | Overheats after 3s, cools when not firing |
| **Cryo Rifle** | 10 | 400 | 40 | Slows enemies, stacks to freeze |
| **Railgun** | 100 | 30 | 3 | Penetrates all enemies in line, charge 1s |

### 7.5 Heavy Weapons

| Weapon | Damage | RPM | Clip | Special |
|--------|--------|-----|------|---------|
| **Shotgun** | 12×8 | 90 | 6 | Spread, devastating at close range |
| **Grenade Launcher** | 60 AOE | 45 | 4 | Arcing projectile, 3m explosion |
| **Rocket Launcher** | 80 AOE | 30 | 2 | Lock-on to drones, homing |
| **Minigun** | 12 | 1200 | 100 | Wind-up 0.5s, movement speed -50% |
| **Flamethrower** | 8/s | continuous | 50 fuel | Cone burn, DOT 5/s for 3s |

### 7.6 Gadgets

| Gadget | Effect | Ammo |
|--------|--------|------|
| **Sticky Bomb** | Stick to surface/enemy, detonate with E or timer | 3 |
| **Decoy Hologram** | Attracts drone attention for 5s | 2 |
| **Smoke Grenade** | 6m cloud, blocks drone vision | 3 |
| **Tesla Coil** | Place on ground, zaps nearby drones 10/s | 2 |
| **Spring Pad** | Place on ground, launches player/enemy upward | 3 |

### 7.7 Weapon Pickup & Ammo System

- Weapons spawn as 3D models in the world (glowing outline via Runner Vision)
- Walk over weapon = auto-equip if slot empty, or swap
- Ammo boxes: small (+clip), large (+full reserve), type-specific
- Reserve ammo cap: 3× clip size for pistols/rifles, 1× for heavy
- Dropped weapons stay in world for 30s

### 7.8 Weapon Slots

- **Slot 1:** Melee (always equipped, E key or Mouse1 when no ranged)
- **Slot 2:** Sidearm (pistol) — `1`
- **Slot 3:** Primary (rifle/shotgun) — `2`
- **Slot 4:** Heavy/Gadget — `3`
- **Slot 5:** Throwable (grenades/gadgets) — `4`
- **Scroll wheel** cycles weapons

### 7.9 Weapon Mods / Attachments

Find mod chips in the world (rare drops from elite drones):
- **Extended Mag:** +50% clip size
- **Fast Reload:** -40% reload time
- **Armor Piercing:** +25% damage to shields
- **Incendiary Rounds:** +5/s burn DOT
- **Shock Rounds:** 25% chance to stun for 0.5s
- **Scope:** Reduces spread by 30%
- **Suppressor:** Silent shots, no detection cone expansion

Each weapon can hold 2 mods. Mods are swappable at workbench stations.

---

## PHASE 8: ENEMY EXPANSION (10 New Drone Types)

### 8.1 Enemy Base Class Refactor

**File:** `js/EnemyBase.js` (new) + refactor `js/DroneAI.js`

Extract common enemy logic:
```javascript
class Enemy {
  constructor(scene, config)
  update(dt, player)
  takeDamage(amount, type, source)
  die()
  getHitbox()
  getVisionCone()
}
```

### 8.2 New Enemy Types

| # | Enemy | HP | Behavior | Weakness |
|---|-------|-----|----------|----------|
| 1 | **Brawler Drone** | 80 | Charges, melee range, blocks frontal attacks | Slide under, attack from behind |
| 2 | **Shield Drone** | 60 | Frontal energy shield, invulnerable from front | Shoulder bash breaks shield, flank |
| 3 | **Turret Drone** | 40 | Stationary, 180° arc suppression fire | Grapple behind, back takedown |
| 4 | **Suicide Drone** | 30 | Rushes player, explodes on contact | EMP burst, or kick it back |
| 5 | **Sapper Drone** | 50 | Destroys platforms/collidables near player | Kill fast, or lure away |
| 6 | **Jammer Drone** | 45 | Disables grapple, dash, magnet boots in 10m | Must melee, can't use abilities |
| 7 | **Medic Drone** | 35 | Heals other drones, low HP, stays back | Priority target, snipe with rifle |
| 8 | **Phantom Drone** | 55 | Cloaked, visible only in Runner Vision | V to spot, then normal takedown |
| 9 | **Command Drone** | 70 | Buffs nearby drones (+25% speed, +50% damage) | Kill first, entire squad weakens |
| 10 | **Minelayer Drone** | 45 | Drops proximity mines while patrolling | Slide to dodge, kick mines back |

### 8.3 Elite Variants

Each base type has an **Elite** version (red glow, 2× HP, new ability):
- Elite Brawler: Ground slam AOE on charge
- Elite Shield: Shield regenerates after 3s
- Elite Turret: 360° coverage, must flank
- Elite Suicide: Splits into 3 mini-drones on death
- Elite Sapper: Destroys 2× faster
- Elite Jammer: Also disables weapons
- Elite Medic: Revives dead drones once
- Elite Phantom: Leaves clone on death
- Elite Command: Calls reinforcements
- Elite Minelayer: Mines are homing

### 8.4 Enemy Squads & Tactics

Drones spawn in coordinated squads:
- **Assault Squad:** 2 Brawlers + 1 Command + 1 Medic
- **Ambush Squad:** 2 Phantoms + 2 Suicide
- **Siege Squad:** 2 Turrets + 1 Jammer + 1 Shield
- **Sapper Team:** 3 Sappers (prioritize, they destroy your parkour routes)

---

## PHASE 9: BOSS ROSTER EXPANSION

### 9.1 Boss: The Fabricator
**Arena:** Factory floor with conveyor belts and assembly arms.
**Phase 1:** Spawns minions from 3 assembly lines. Destroy the lines.
**Phase 2:** Giant welding arm sweeps. Must vault over or slide under.
**Phase 3:** Core exposed in center. Must use magnet boots on ceiling to avoid floor lava.
**Weak Point:** Welding torch (overheats after 3 attacks, vulnerable for 5s).

### 9.2 Boss: The Warden
**Arena:** Circular prison block with cell bars and guard towers.
**Phase 1:** Ranged suppressive fire from towers. Grapple to towers and takedown snipers.
**Phase 2:** Releases prisoner drones (friendly to player, fight Warden's drones).
**Phase 3:** Warden descends, shield + shock baton. Must parry 3 times to break shield.
**Weak Point:** Back panel (only exposed during baton overcharge animation).

### 9.3 Boss: The Leviathan
**Arena:** Flooded warehouse, water rises and falls.
**Phase 1:** Submerged, tentacles burst from water. Grapple to high ground.
**Phase 2:** Surfaces, water spouts knock player back. Must use ziplines.
**Phase 3:** Beached, vulnerable. But water is toxic now. Speedrun to kill before drowning.
**Weak Point:** Eye (opens for 2s after each tentacle attack).

### 9.4 Boss: The Swarm Queen
**Arena:** Hive chamber with honeycomb walls.
**Phase 1:** 20+ tiny drones swarm. EMP burst is essential.
**Phase 2:** Queen lays eggs that hatch. Must destroy eggs in 5s.
**Phase 3:** Queen alone, fast flight. Grapple to her, climb, attack core on back.
**Weak Point:** Abdomen sac (swells before egg lay, 3s window).

### 9.5 Boss: The Architect
**Arena:** Shifting maze. Walls reconfigure every 30s.
**Phase 1:** Holographic duplicates. Real one casts shadows differently.
**Phase 2:** Maze collapses inward. Must parkour to center platform.
**Phase 3:** Gravity shifts 90°. Wallrun becomes floor run. Adapt or die.
**Weak Point:** Hologram projector on head (flickers when he changes maze layout).

---

## PHASE 10: COMBAT PROGRESSION & ECONOMY

### 10.1 Skill Tree

**File:** `js/SkillTree.js` + UI panel

3 branches, 15 skills each:

**AGILITY (Parkour-Combat Hybrid)**
- Lv1: Dive Kick damage +25%
- Lv2: Slide Tackle range +50%
- Lv3: Ground Pound radius +2m
- Lv4: Wall-Kick Stun duration +2s
- Lv5: Rolling Thunder can hit flying enemies
- Lv6: Vault Strike chains into aerial combo
- Lv7: Sprint Shoulder Bash breaks all shields
- Lv8: Ceiling Drop is silent (no alert)
- Lv9: Backflip Kick launches 2 enemies
- Lv10: Perfect Dodge window +0.1s
- Lv11: Panic Roll costs 0 stamina
- Lv12: Knockback Recovery grants 1s invincibility
- Lv13: Ground Pound creates shockwave on ALL landings
- Lv14: Combo vaults deal damage to enemies passed over
- Lv15: **ULTIMATE:** Every movement state is an attack. Just existing near enemies deals 5/s.

**PRECISION (Ranged & Tech)**
- Lv1: Pistol headshot damage +50%
- Lv2: Rifle reload speed +30%
- Lv3: EMP burst radius +4m
- Lv4: Drone Hijack duration +3s
- Lv5: Grenade launcher blast radius +2m
- Lv6: Railgun charge time -0.5s
- Lv7: Scope sway eliminated
- Lv8: Mod slots per weapon: 3
- Lv9: Ammo pickups grant +50%
- Lv10: Weapon switching is instant
- Lv11: Flamethrower range +3m
- Lv12: Tesla Coil duration +5s
- Lv13: Rocket launcher lock-on time -50%
- Lv14: Cryo rifle freeze stacks in 3 shots instead of 5
- Lv15: **ULTIMATE:** All weapons have infinite ammo for 10s after flow meter max.

**SURVIVAL (Defense & Stealth)**
- Lv1: Max health +25
- Lv2: Stamina regen +50%
- Lv3: Block damage reduction: 90%
- Lv4: Parry reflects at 5× damage
- Lv5: Shield power-up duration +5s
- Lv6: Silent Takedown works on elites
- Lv7: Distraction range +10m
- Lv8: Light Toggle affects 2× zone size
- Lv9: Vent crawl speed +100%
- Lv10: Body Hide prevents ALL alerts in 20m
- Lv11: Phantom Strike ignores armor
- Lv12: Decoy Afterimage leaves explosive clone
- Lv13: Drone Meat Shield absorbs 100 damage
- Lv14: Platform Shield blocks explosions
- Lv15: **ULTIMATE:** Death rewinds 5s (1 per run). Time reversal visual.

**Skill Points:** Earn 1 per boss kill, 1 per 10 elite drone kills, 1 per speedrun S-rank.

### 10.2 Weapon Crafting / Workbenches

**File:** `js/CraftingSystem.js`

Scattered workbench stations in the warehouse:
- Craft weapons from scrap (found in world, dropped by drones)
- Scrap types: Metal (common), Circuit (uncommon), Battery (rare), Core (boss-only)
- Recipe example: Railgun = 50 Metal + 20 Circuit + 10 Battery + 1 Core
- Dismantle unwanted weapons → 50% scrap refund
- Upgrade weapons: +5% damage per level, max +25% (5 levels)

### 10.3 Shop Terminals

**File:** `js/ShopSystem.js`

Data chip currency (existing collectible):
- Buy ammo, health kits, shield packs
- Buy weapon mods (random rotation, refreshes every 5 min)
- Buy cosmetic skins (purely visual)
- Sell scrap for chips

### 10.4 Death Rewind Implementation

**Source:** Survival Ultimate (Phase 10.1 Lv15)

**File:** `js/DeathRewindSystem.js` (new)

**Ring buffer architecture:**
- Captures world snapshot at 60 Hz
- 5 seconds of history = 300 frames
- Circular buffer overwrites oldest frame once full
- Snapshot per frame includes: player position/velocity/rotation, active animation state, enemy positions/health, projectile positions, and dynamic world object states

**Snapshot structure:**
```javascript
{
  frameIndex: number,
  timestamp: number,
  player: { position: Vector3, velocity: Vector3, rotation: number, state: string, health, stamina, flow },
  enemies: Array<{ id, position, health, state }>,
  projectiles: Array<{ id, position, velocity, owner }>,
  worldFlags: Object // switch states, door positions, platform offsets
}
```

**Trigger condition:**
1. `playerWouldDie` event fires (health would drop to ≤ 0 from a fatal hit)
2. Perk check: Survival skill tree Lv15 unlocked (`deathRewindEnabled`)
3. Charges check: `rewindCharges > 0` (1 charge per run, refreshes on new run)
4. If all pass, death is intercepted and rewind playback begins

**Playback steps:**
1. Game time freezes for 0.2s (white flash)
2. Rewind plays at 4× speed in reverse chronological order through the ring buffer
3. Visual FX: chromatic aberration intensifies, saturation drops to 0% (desaturation), motion blur on player
4. Audio: reverse-playback procedural tone (descending pitch sweep)
5. On reaching the rewind target (earliest frame in buffer or 5s ago), normal time resumes
6. Player receives 1s invincibility (gold outline shader)
7. Consume 1 rewind charge; update HUD icon to grayscale if depleted

**Edge cases:**
- **Within 5s of start:** If death occurs before the ring buffer has 300 frames, rewind to the earliest captured frame (may be < 5s)
- **Boss phases not rewound:** Boss health, phase timers, and arena state are excluded from rewind snapshots; boss fights restore only player position/health on rewind
- **Ammo / flow not restored:** Only positional and vitality state is rewound; ammo expenditure and flow spent during the rewind window remain consumed
- **Overlapping triggers:** If the player dies again during the 1s post-rewind invincibility, death proceeds normally (no second rewind)

---

## PHASE 11: STATUS EFFECTS & ELEMENTAL SYSTEM

### 11.1 Status Effects

| Effect | Source | Duration | Stack? | Effect |
|--------|--------|----------|--------|--------|
| **Burning** | Flamethrower, incendiary, explosive barrel | 5s | Yes (×3) | 5/s DOT, max 15/s |
| **Frozen** | Cryo rifle, freezer burst | 3s | No | Movement -75%, then shatter for 20 damage |
| **Shocked** | Shock baton, Tesla coil, chain lightning | 2s | Yes (×3) | Stun, arcs to nearby enemies |
| **Corroded** | Toxic splash, acid puddles | 4s | No | Armor -50%, damage taken +25% |
| **Blinded** | Smoke grenade, steam burst | 3s | No | Player/drone can't see, aim spread +200% |
| **Magnetized** | Magnet pull, EMP | 4s | No | Pulls metal debris toward target, blocks movement |
| **Marked** | Predator Vision, scanner | 6s | No | Target takes +25% damage from all sources |
| **Enraged** | Command drone buff | 8s | No | Damage +50%, speed +25%, no retreat |
| **Weakened** | Parry success, EMP elite | 5s | No | Damage -50%, shields disabled |
| **Overclocked** | Player ability | 4s | No | Speed +50%, fire rate +50%, stamina costs 0 |

### 11.2 Elemental Interactions

- **Burning + Frozen = Steam Cloud** — 3m radius blind for 2s
- **Shocked + Oil Slick = Fire Pool** — 5/s burn DOT in slick area
- **Corroded + Shock = Acid Spray** — 10 damage AOE in cone
- **Frozen + Shocked = Shatter** — Instant 40 damage, enemy frozen 2× longer

---

## PHASE 12: COMBAT ARENAS & HORDE MODES

### 12.1 Arena Mode Selector

**File:** `js/ArenaMode.js` + UI

Accessible from warehouse hub via terminal:

| Mode | Description | Reward |
|------|-------------|--------|
| **Wave Defense** | Hold rooftop against 10 escalating waves | Skill point + rare mod |
| **Boss Rush** | All 5 bosses back-to-back, no healing between | 5 skill points + legendary weapon |
| **Drone Gauntlet** | Infinite parkour corridor, survive as long as possible | Chips based on time |
| **Juggernaut** | 1 HP, every kill heals 25 HP | Skill point if survive 5 min |
| **Mirror Match** | Boss clones your exact movement | Unique cosmetic |
| **Collateral** | Every enemy death explodes, chain reactions = score | Chips based on chain length |
| **Stealth Only** | No weapons, only silent takedowns, no alerts | Skill point + suppressor mod |
| **Speed Kill** | Kill 50 drones in 2 minutes | Skill point + extended mag mod |
| **Barehands** | No weapons, only parkour attacks | Skill point + damage boost |
| **Ironman** | No respawns, 1 life, beat 3 bosses | Title: "The Untouchable" |

### 12.2 Arena Modifiers

Each arena run gets 1-3 random modifiers:
- **Low Gravity:** Jump height +100%, fall damage -50%
- **High Gravity:** Jump height -50%, ground pound damage +100%
- **Fog of War:** Vision range 10m, Predator Vision essential
- **Weapon Jam:** Every 10 shots, weapon jams for 2s
- **Friendly Fire:** Your explosions damage you
- **Vampire:** Enemies heal 50% of damage dealt to you
- **Timer Drain:** -1 HP every 2 seconds, kills add +5s
- **Glass Cannon:** You deal 3× damage, take 3× damage
- **No Dash:** Air dash disabled, must parkour everywhere
- **EMP Zone:** All electronics disabled every 15s for 5s

---

## PHASE 13: NEW FILES & ARCHITECTURE

### New Files Required

| File | Lines | Purpose |
|------|-------|---------|
| `js/CombatSystem.js` | ~800 | Player attack state machine, combo routing, hit registration |
| `js/DamageSystem.js` | ~400 | Damage calculation, types, resistances, numbers popup |
| `js/HitboxSystem.js` | ~500 | Hitbox/hurtbox registration, collision checks, iframes |
| `js/WeaponSystem.js` | ~600 | Weapon manager, slots, switching, ammo |
| `js/ProjectileManager.js` | ~500 | Pooled projectiles, bullets, grenades, rockets |
| `js/EnemyManager.js` | ~700 | Replaces/extends DroneAI, health, spawning, AI behaviors |
| `js/EnemyBase.js` | ~400 | Base class for all enemies |
| `js/StatusEffectSystem.js` | ~400 | Burn, freeze, shock, corrode, blind application/removal |
| `js/SkillTree.js` | ~600 | Skill data, progression, save/load |
| `js/CraftingSystem.js` | ~400 | Workbenches, recipes, scrap economy |
| `js/ShopSystem.js` | ~300 | Terminals, buy/sell, random stock rotation |
| `js/ArenaMode.js` | ~500 | Arena selector, wave logic, modifier application |
| `js/weapons/PipeWrench.js` | ~80 | Melee weapon |
| `js/weapons/ShockBaton.js` | ~80 | Melee weapon |
| `js/weapons/Sledgehammer.js` | ~80 | Melee weapon |
| `js/weapons/EnergyBlade.js` | ~80 | Melee weapon |
| `js/weapons/ChainWhip.js` | ~80 | Melee weapon |
| `js/weapons/SemiAutoPistol.js` | ~80 | Pistol |
| `js/weapons/BurstPistol.js` | ~80 | Pistol |
| `js/weapons/PlasmaPistol.js` | ~80 | Pistol |
| `js/weapons/AssaultRifle.js` | ~80 | Rifle |
| `js/weapons/MarksmanRifle.js` | ~80 | Rifle |
| `js/weapons/PlasmaRifle.js` | ~80 | Rifle |
| `js/weapons/Railgun.js` | ~80 | Heavy |
| `js/weapons/Shotgun.js` | ~80 | Heavy |
| `js/weapons/GrenadeLauncher.js` | ~80 | Heavy |
| `js/weapons/RocketLauncher.js` | ~80 | Heavy |
| `js/weapons/Flamethrower.js` | ~80 | Heavy |
| `js/weapons/StickyBomb.js` | ~80 | Gadget |
| `js/weapons/DecoyHologram.js` | ~80 | Gadget |
| `js/weapons/SmokeGrenade.js` | ~80 | Gadget |
| `js/weapons/TeslaCoil.js` | ~80 | Gadget |
| `js/weapons/SpringPad.js` | ~80 | Gadget |
| `js/enemies/BrawlerDrone.js` | ~150 | Enemy type |
| `js/enemies/ShieldDrone.js` | ~150 | Enemy type |
| `js/enemies/TurretDrone.js` | ~150 | Enemy type |
| `js/enemies/SuicideDrone.js` | ~150 | Enemy type |
| `js/enemies/SapperDrone.js` | ~150 | Enemy type |
| `js/enemies/JammerDrone.js` | ~150 | Enemy type |
| `js/enemies/MedicDrone.js` | ~150 | Enemy type |
| `js/enemies/PhantomDrone.js` | ~150 | Enemy type |
| `js/enemies/CommandDrone.js` | ~150 | Enemy type |
| `js/enemies/MinelayerDrone.js` | ~150 | Enemy type |
| `js/bosses/BossFabricator.js` | ~800 | Boss |
| `js/bosses/BossWarden.js` | ~800 | Boss |
| `js/bosses/BossLeviathan.js` | ~800 | Boss |
| `js/bosses/BossSwarmQueen.js` | ~800 | Boss |
| `js/bosses/BossArchitect.js` | ~800 | Boss |

**Total new files:** ~55 files, ~15,000 lines

### Elite Enemy Implementation

Elites are **not** separate files. Each base enemy class accepts an `isElite` boolean in its constructor config.

- **Stat scaling:** 2× HP (`maxHealth *= 2`), all other stats remain base unless overridden by strategy injection
- **Visual tint:** red emissive tint applied to the enemy mesh (`emissiveIntensity = 0.6`, `emissiveColor = 0xff0000`)
- **Ability injection:** elite-specific behaviors are injected via a strategy pattern object passed to the enemy constructor (e.g., `eliteStrategy: new EliteBrawlerStrategy()`). This keeps base classes clean and allows mixing elite modifiers with new enemy types.
- **Name prefix:** elite enemies render with the prefix "Elite" in target UI, damage numbers, and codex entries (e.g., "Elite Brawler Drone")

**EnemyManager spawn API:**
```javascript
enemyManager.spawnEnemy('brawler', { isElite: true, position: new THREE.Vector3(x, y, z) });
```

**Elite loot:**
- Elite enemies have a 25% base chance to drop a weapon mod chip on death
- Drop chance is rolled once per elite; if successful, a random mod from the eligible pool spawns at the death location

### Modified Files

| File | Changes |
|------|---------|
| `js/Player.js` | Add health, stamina, takeDamage, combat states, attack animations |
| `js/main.js` | Import all new systems, hook into update loop, weapon input |
| `js/InputManager.js` | Mouse1 firing, scroll weapon switch, reload key |
| `js/DroneAI.js` | Refactor to use EnemyBase, add health/death |
| `js/World.js` | Add weapon spawn points, workbenches, shop terminals, enemy spawners |
| `js/Hazards.js` | Add elemental hazard types |
| `js/ComboSystem.js` | Flow meter fuels combat abilities |
| `js/ChallengeSystem.js` | Combat achievements |
| `index.html` | Health bar, stamina bar, weapon HUD, skill tree panel, shop UI |

---

## PHASE 14: IMPLEMENTATION ROADMAP

### Sprint 1: Foundation (Week 1)
- Player health, stamina, takeDamage
- HitboxSystem + DamageSystem
- Combat state machine (ATTACK_LIGHT, ATTACK_HEAVY, BLOCK, PARRY)
- 5 parkour melee attacks (Dive Kick, Slide Tackle, Wall-Kick, Ground Pound, Sprint Bash)

### Sprint 2: Weapons Core (Week 2)
- WeaponSystem + slots + switching
- ProjectileManager with pooling
- 5 pistols + 3 rifles
- Ammo system + pickups
- Weapon HUD

### Sprint 3: Enemy Refactor (Week 3)
- EnemyBase class
- Refactor DroneAI to EnemyManager
- 5 new enemy types (Brawler, Shield, Turret, Suicide, Sapper)
- Enemy health/death/loot drops

### Sprint 4: Advanced Combat (Week 4)
- 5 heavy weapons + 5 gadgets
- Status effects (burn, freeze, shock, corrode, blind)
- Defensive systems (Parry, Perfect Dodge, Panic Roll)
- Stealth (Silent Takedown, Distraction, Phantom Strike)

### Sprint 5: Bosses & Progression (Week 5)
- 2 new bosses (Fabricator, Warden)
- Skill Tree + 15 skills per branch
- Crafting system + workbenches
- Shop terminals

### Sprint 6: Polish & Modes (Week 6)
- 3 remaining bosses
- Arena modes + modifiers
- Enemy squads + AI coordination
- Balance pass, bug fixes, performance

---

## PHASE 15: UI REQUIREMENTS

### HUD Additions
- **Health bar** (bottom left, red, segmented)
- **Stamina bar** (below health, yellow)
- **Shield bar** (above health, blue, temporary)
- **Weapon slots** (bottom right, 5 slots, highlight active)
- **Ammo counter** (next to weapon, current/reserve)
- **Crosshair** (dynamic: expands when moving, tightens when aiming)
- **Damage numbers** (floating text on hits)
- **Status icons** (burn, freeze, etc. above health)
- **Skill tree button** (M key)
- **Inventory button** (I key)
- **Minimap** (top right, enemy dots red, pickups yellow)

### New Panels
- **Skill Tree** (fullscreen, 3 branches, hover for details)
- **Inventory** (weapon grid, mod slots, scrap counts)
- **Crafting** (workbench UI, recipe list, craft button)
- **Shop** (buy/sell grid, rotating stock timer)
- **Arena Selector** (mode cards, modifier preview, leaderboard)

---

## PHASE 16: AUDIO REQUIREMENTS

New procedural sounds:
- Weapon fire (pistol, rifle, shotgun, energy, explosive)
- Melee impacts (flesh, metal, shield break)
- Enemy death (explosion, power-down, gib)
- Status effects (burn crackle, freeze shatter, electric arc)
- UI (skill unlock, level up, crafting complete, shop purchase)
- Boss voice lines (phase transitions, taunts, defeat)

---

## PHASE 17: BALANCE TARGETS

| Metric | Target |
|--------|--------|
| Time to kill basic drone (melee) | 2-3 hits |
| Time to kill basic drone (pistol) | 4-5 shots |
| Time to kill basic drone (rifle) | 2-3 shots |
| Time to kill elite drone | 3× basic |
| Boss fight duration | 3-5 minutes |
| Player death frequency (normal) | 1 per 2 minutes |
| Player death frequency (hard) | 1 per 30 seconds |
| Ammo scarcity | Run dry every 45-60s of combat |
| Health kit value | 30-50 HP |

---
## PHASE 18: INPUT MAPPING & CONTROLS ARCHITECTURE

With ~120 combat features mapped to ~15 physical inputs, collisions are inevitable. This phase defines a **context-first resolution system** so that every input does the right thing based on player state, proximity, and aim direction. No existing input is remapped; collisions are resolved through specificity layers.

### 18.1 Context-First Resolution Rules

When a single key has multiple valid actions, resolve in this order:

1. **Player State** — airborne vs. grounded, grappling, aiming, blocking, etc.
2. **Proximity Target** — enemy hitbox, interactable, ledge, platform, vent, mirror
3. **Aim Vector** — what the camera center is pointing at (raycast at 20m)
4. **Modifier Chords** — Shift+action, double-tap, hold duration
5. **Default Fallback** — the base action if no context overrides match

**Priority rule:** If two actions are equally valid, the **most dangerous** wins (attack > interact > move).

### 18.2 Keyboard + Mouse Master Mapping

| Input | Default Action | Context Override |
|-------|----------------|------------------|
| **W/A/S/D** | Move | — |
| **Space** | Jump | KNOCKBACK state = Recovery Flip (4.6) |
| **Shift** | Sprint | Held + Q = Decoy Afterimage (4.4, flow max only) |
| **C (tap, grounded)** | Crouch / Slide | Moving = Slide (2.2); Stationary = Crouch |
| **C (tap, airborne)** | Roll (2.7) | I-frames until landing |
| **C (hold 0.3s, airborne)** | Ground Pound (2.8) | Shockwave on release |
| **Q (tap, airborne)** | Air Dash | — |
| **Q (double-tap, grounded)** | EMP Burst (3.8) | 15s cooldown |
| **Q (tap, grappling enemy)** | Grapple Pull (3.1) | Yank enemy toward player |
| **E (tap, default)** | Interact | Open door, pickup item, hack terminal |
| **E (tap, crouch + behind enemy)** | Silent Takedown (5.2) | Instant kill basic drones |
| **E (hold, dead enemy + vent nearby)** | Body Hide (5.3) | Prevents alarm |
| **E (hold, grappling drone)** | Drone Meat Shield (4.7) | Absorbs 50 damage |
| **E (hold, platform edge)** | Platform Shield (4.8) | Mobile cover |
| **E (tap, facing mirror)** | Mirror Rotate (3.6) | 45° per tap |
| **E (hold + aim, chip equipped)** | Distraction (5.4) | Throw chip to lure drone |
| **F (tap, wallrun + drone nearby)** | Drone Takedown | Existing behavior |
| **F (tap, sprinting + no wall)** | Shoulder Bash (2.10) | Shield break, 25 damage |
| **F (tap, BLOCK state + incoming projectile)** | Parry (4.1) | 0.2s window, 3× return damage |
| **F (hold 1s, takedown target alive)** | Drone Hijack (3.3) | 5s possession |
| **Mouse1 (tap, melee equipped)** | Light Melee Attack (1.2) | 0.3s, comboable |
| **Mouse1 (hold 0.4s, melee)** | Heavy Melee Attack (1.2) | Shield break, 0.6s |
| **Mouse1 (tap, ranged equipped)** | Fire Weapon | Uses active weapon slot |
| **Mouse1 (tap, debris in hand)** | Throw Disk (3.2) | Ricochets 3× |
| **Mouse1 (tap, aim mode + zipline gun)** | Zipline Gun (3.7) | Pins enemy to wall |
| **Mouse2 (hold)** | Grapple Aim | Existing behavior |
| **Mouse2 (hold) + Mouse1** | Zipline Gun (3.7) | If zipline gadget equipped |
| **Scroll Up** | Previous Weapon Slot | Cycles 1→4→1 |
| **Scroll Down** | Next Weapon Slot | Cycles 1→2→3→4→1 |
| **1** | Equip Sidearm (Slot 2) | — |
| **2** | Equip Primary (Slot 3) | — |
| **3** | Equip Heavy/Gadget (Slot 4) | — |
| **4** | Equip Throwable (Slot 5) | — |
| **R** | Reload | Current ranged weapon |
| **V (tap)** | Runner Vision | Existing behavior |
| **V (hold 0.3s)** | Predator Vision (5.1) | Enemy patrols, detection cones |
| **Tab / M** | Skill Tree | Fullscreen overlay |
| **I** | Inventory / Crafting | Near workbench = Crafting; else Inventory |

### 18.3 Gamepad Mapping (Xbox / PlayStation)

GamepadController mirrors InputManager's API. The same context-resolution logic runs on top; only the physical binds change.

| Xbox | PS | Action | Notes |
|------|-----|--------|-------|
| **A** | Cross | Jump / Recovery Flip | Contextual like Space |
| **B** | Circle | Crouch / Slide / Roll / Ground Pound | Tap vs. hold |
| **X** | Square | Air Dash / EMP / Grapple Pull | Double-tap X for EMP |
| **Y** | Triangle | Interact / Takedown / Hide / Shield | Hold for secondary |
| **LB** | L1 | Sprint | Hold |
| **RB** | R1 | F-Action (Takedown / Bash / Parry) | Context resolved |
| **LT** | L2 | Grapple Aim | Hold |
| **RT** | R2 | Fire / Melee / Throw | Context resolved |
| **D-pad Up** | D-pad Up | Previous Weapon | — |
| **D-pad Down** | D-pad Down | Next Weapon | — |
| **D-pad Left** | D-pad Left | Equip Sidearm | — |
| **D-pad Right** | D-pad Right | Equip Primary | — |
| **Left Stick** | Left Stick | Move | Dead zone 0.15 |
| **Right Stick** | Right Stick | Camera | Dead zone 0.15 |
| **L3** | L3 | Magnet Boots | — |
| **R3** | R3 | Runner Vision / Predator Vision | Tap vs. hold |
| **Back/View** | Touchpad (press) | Skill Tree | — |
| **Start/Menu** | Options | Inventory / Pause | — |
| **LS + RS** | L3 + R3 | Assist Mode Toggle | 1s hold to prevent accidental |

### 18.4 Context-Sensitive Input Resolution System

**File:** `js/ActionResolver.js` (new)

A dedicated resolver sits between `InputManager` / `GamepadController` and gameplay systems. It consumes raw input and outputs a canonical action string.

```javascript
export class ActionResolver {
    constructor(player, world, input) {
        this.player = player;
        this.world = world;
        this.input = input;
        this.raycaster = new THREE.Raycaster();
    }

    resolve(code) {
        const state = this.player.state;
        const grounded = this.player.grounded;
        const p = this.player.position;

        switch (code) {
            case 'KeyQ':
                if (this.player.grapplingHook && this.player.grapplingHook.state === 'attached_enemy') return 'grapple_pull';
                if (!grounded) return 'air_dash';
                if (this.input.wasDoubleTapped('KeyQ')) return 'emp_burst';
                return null; // grounded single-tap Q does nothing

            case 'KeyF':
                if (state === 'BLOCK' && this._incomingProjectileWithin(3.0)) return 'parry';
                if (state === 'WALLRUN' && this._enemyWithin(2.5)) return 'takedown';
                if (state === 'SPRINT' && !this._nearWall()) return 'shoulder_bash';
                return null;

            case 'KeyE':
                if (this._canSilentTakedown()) return 'silent_takedown';
                if (this._canBodyHide()) return 'body_hide';
                if (this._canMeatShield()) return 'meat_shield';
                if (this._canPlatformShield()) return 'platform_shield';
                if (this._facingMirror()) return 'mirror_rotate';
                return 'interact';

            case 'KeyC':
                if (!grounded && this.input.isHeld('KeyC', 300)) return 'ground_pound';
                if (!grounded) return 'roll';
                return 'crouch_slide';

            case 'Mouse2':
                if (this.input.isMouse2Pressed() && this.player.state === 'AIM') return 'grapple_aim';
                return 'grapple_aim';

            default:
                return code;
        }
    }

    _enemyWithin(radius) { /* sphere cast from player */ }
    _incomingProjectileWithin(time) { /* checks ProjectileManager for imminent hits */ }
    _canSilentTakedown() { /* crouch + behind enemy + within 1.5m */ }
    _canBodyHide() { /* dead enemy within 2m + vent/locker within 2m */ }
    _canMeatShield() { /* grappling drone + within 1m */ }
    _canPlatformShield() { /* on platform edge + within 0.5m */ }
    _facingMirror() { /* raycast hit mirror tag */ }
    _nearWall() { /* wall within 1m in velocity direction */ }
}
```

**Integration in `js/main.js`:**

```javascript
const actionResolver = new ActionResolver(player, world, activeInput);

// Inside animate(), before physics update:
const action = actionResolver.resolve('KeyF');
if (action === 'parry') player.startParry();
else if (action === 'shoulder_bash') player.startShoulderBash();
// ... etc
```

### 18.5 Input Buffering System

**File:** `js/InputManager.js` (additions)

Store the last 0.2s of inputs to support combo detection and lenient parry/dodge windows.

```javascript
// Added to constructor:
this._inputBuffer = [];      // { code, time }
this._bufferDuration = 0.2;  // seconds
this._holdStartTimes = {};   // code -> timestamp

// In keydown handler:
this._inputBuffer.push({ code: e.code, time: performance.now() });
this._holdStartTimes[e.code] = performance.now();

// In keyup handler:
delete this._holdStartTimes[e.code];

// New methods:
getBufferedInputs(duration = this._bufferDuration) {
    const now = performance.now();
    const cutoff = now - duration * 1000;
    return this._inputBuffer.filter(e => e.time > cutoff);
}

pruneBuffer() {
    const now = performance.now();
    this._inputBuffer = this._inputBuffer.filter(e => now - e.time < 1000);
}

isHeld(code, durationMs) {
    if (!this.isPressed(code)) return false;
    const start = this._holdStartTimes[code];
    if (!start) return false;
    return (performance.now() - start) >= durationMs;
}
```

Call `input.pruneBuffer()` inside `input.preUpdate()` each frame to prevent unbounded growth.

### 18.6 Chord & Gesture System

**File:** `js/InputManager.js` (additions)

```javascript
// Added to constructor:
this._doubleTapWindow = 250; // ms
this._lastTapTimes = {};     // code -> timestamp

// In keydown handler, before buffer push:
const now = performance.now();
if (this._lastTapTimes[e.code] && (now - this._lastTapTimes[e.code]) < this._doubleTapWindow) {
    this._doubleTapFlags[e.code] = true;
}
this._lastTapTimes[e.code] = now;

// New methods:
wasDoubleTapped(code) {
    const flag = !!this._doubleTapFlags[code];
    this._doubleTapFlags[code] = false;
    return flag && this.wasPressed(code);
}

wasChordPressed(modifierCode, actionCode, windowMs = 100) {
    // Modifier must be held; action pressed this frame
    if (this.isPressed(modifierCode) && this.wasPressed(actionCode)) return true;
    // Or both pressed within window (for gamepad simultaneous press)
    const recent = this.getBufferedInputs(windowMs / 1000);
    const hasMod = recent.some(e => e.code === modifierCode);
    const hasAct = this.wasPressed(actionCode);
    return hasMod && hasAct;
}
```

**Scroll wheel support:**

```javascript
// In constructor:
this.scrollDelta = 0;
document.addEventListener('wheel', (e) => {
    this.scrollDelta += Math.sign(e.deltaY);
}, { passive: true });

// New method:
consumeScroll() {
    const d = this.scrollDelta;
    this.scrollDelta = 0;
    return d; // -1, 0, +1
}
```

### 18.7 GamepadController Updates

**File:** `js/GamepadController.js` (additions)

Mirror all new InputManager methods so `GamepadController` remains a drop-in replacement:

```javascript
// Add to constructor:
this._inputBuffer = [];
this._holdStartTimes = {};
this._lastTapTimes = {};
this._doubleTapFlags = {};
this.scrollDelta = 0;

// In preUpdate(), after button processing:
// Track holds, taps, and buffer exactly like InputManager

// Mirror methods:
getBufferedInputs(duration) { /* identical logic */ }
pruneBuffer() { /* identical logic */ }
isHeld(code, durationMs) { /* identical logic */ }
wasDoubleTapped(code) { /* identical logic */ }
wasChordPressed(modifierCode, actionCode, windowMs) { /* identical logic */ }
consumeScroll() {
    // D-pad up/down also feed scrollDelta for weapon switching
    const d = this.scrollDelta;
    this.scrollDelta = 0;
    return d;
}
```

**Backwards compatibility guarantee:** All existing `isPressed` / `wasPressed` / `wasReleased` / `consumeMouse` calls continue to work unchanged. New code opts into `wasDoubleTapped`, `isHeld`, and `consumeScroll` explicitly.

---
## PHASE 19: SAVE/LOAD & PERSISTENCE SYSTEM

**File:** `js/SaveSystem.js` (new)

All progression—skill tree, inventory, arena scores, checkpoint progress, and settings—must persist across sessions. The system supports 3 save slots, automatic versioning, and corruption recovery.

### 19.1 Save Schema

Each save slot is a single JSON object:

```json
{
  "version": 1,
  "slotIndex": 0,
  "timestamp": 1714188880000,
  "hash": "sha256:a1b2c3...",
  "playTime": 3725,
  "progress": {
    "currentZone": "warehouse_hub",
    "unlockedZones": ["warehouse_hub", "factory_floor"],
    "defeatedBosses": ["fabricator"],
    "discoveredMoves": ["dive_kick", "slide_tackle", "wall_kick_stun"],
    "tutorialFlags": {
      "movement_complete": true,
      "combat_intro": true,
      "first_takedown": true,
      "weapon_pickup": false
    },
    "checkpointId": "roof_vent_03"
  },
  "player": {
    "health": 85,
    "maxHealth": 125,
    "stamina": 100,
    "skillPoints": 3,
    "skillTree": {
      "agility": [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "precision": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "survival": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    "currency": {
      "chips": 450,
      "metal": 120,
      "circuit": 45,
      "battery": 12,
      "core": 1
    }
  },
  "inventory": {
    "weapons": [
      {
        "id": "assault_rifle",
        "type": "rifle",
        "mods": ["extended_mag", "armor_piercing"],
        "ammo": 24,
        "reserve": 72,
        "upgrades": 2
      },
      {
        "id": "pipe_wrench",
        "type": "melee",
        "mods": [],
        "ammo": 0,
        "reserve": 0,
        "upgrades": 0
      }
    ],
    "activeSlot": 2,
    "gadgets": [
      { "id": "sticky_bomb", "count": 2 },
      { "id": "smoke_grenade", "count": 1 }
    ]
  },
  "arena": {
    "highScores": {
      "wave_defense": { "bestWave": 8, "score": 12400, "rank": "A", "modifiers": ["low_gravity"] },
      "boss_rush": { "bestTime": 420, "score": 50000, "rank": "S", "modifiers": [] }
    },
    "unlockedModifiers": ["low_gravity", "fog_of_war"],
    "totalRuns": 47
  },
  "settings": {
    "sensitivity": 0.8,
    "volumeMaster": 0.7,
    "volumeSfx": 0.9,
    "volumeMusic": 0.5,
    "assistMode": false,
    "inputHints": true,
    "screenShake": true,
    "subtitles": true,
    "fov": 90
  }
}
```

**Size estimate:** ~3–6 KB per slot uncompressed. Well within browser storage limits.

### 19.2 Storage Backend: localStorage vs. IndexedDB

| Criteria | localStorage | IndexedDB |
|----------|--------------|-----------|
| API complexity | Synchronous, trivial | Asynchronous, verbose |
| Size limit | ~5 MB | ~50–60% of disk |
| Blocking risk | Brief main-thread block on write | Non-blocking |
| Structured cloning | Strings only | Native object support |
| Ideal use | Settings, small blobs | Large assets, replays |

**Decision:** Use **localStorage** for the active slot and settings.

**Justification:**
- A fully populated save is <10 KB. Three slots + backups = <50 KB, leaving 4.95 MB headroom.
- The synchronous API avoids `async/await` contagion in the main game loop (`main.js` has no build step and keeps a flat update order).
- Auto-save triggers occur at non-critical moments (post-combat, checkpoint rest, safe-zone entry) where a 1–2 ms write is imperceptible.
- IndexedDB is reserved for future expansion (photo mode screenshots, replay recordings) via a separate `ReplaySystem.js`.

**Key structure:**
- `wp_save_slot_0` → JSON string for slot 0
- `wp_save_slot_1` → JSON string for slot 1
- `wp_save_slot_2` → JSON string for slot 2
- `wp_save_meta` → `{ activeSlot: 0, slots: [{ exists, timestamp, playTime, zone }] }`
- `wp_settings` → settings object (mirrored into every save, but kept separate for fast load at title screen)

### 19.3 Save Versioning & Migration

```javascript
const CURRENT_SAVE_VERSION = 1;

const MIGRATIONS = [
    // v0 -> v1: initial schema
    (data) => {
        data.version = 1;
        data.player.currency = data.player.currency || { chips: 0, metal: 0, circuit: 0, battery: 0, core: 0 };
        data.progress.tutorialFlags = data.progress.tutorialFlags || {};
        return data;
    },
    // Future: v1 -> v2
    // (data) => { ... }
];

async function migrate(data) {
    const startVersion = data.version || 0;
    for (let i = startVersion; i < MIGRATIONS.length; i++) {
        data = MIGRATIONS[i](data);
    }
    data.version = CURRENT_SAVE_VERSION;
    return data;
}
```

- On `load(slot)`, if `data.version < CURRENT_SAVE_VERSION`, run migrations sequentially.
- If a migration throws, abort load and show "Save incompatible" message. Offer "Start New Game" or "Restore Backup".

### 19.4 Auto-Save Triggers

Auto-save is **throttled** to once per 15 seconds and **gated** by safety checks.

| Trigger | Condition | Data saved |
|---------|-----------|------------|
| **Post-combat** | Last enemy in encounter dies | Full save |
| **Checkpoint** | Player touches checkpoint beacon | Full save + checkpointId |
| **Safe zone** | Enter hub / training ground | Full save |
| **Shop purchase** | Transaction completes | Full save |
| **Skill unlock** | Point spent | Full save |
| **Boss defeated** | Death animation completes | Full save + defeatedBosses |
| **Manual** | Player presses Esc → Save | Full save |

**Safety gate:** Do not auto-save if:
- Player is in mid-air (falling/jumping)
- Player is in combat (enemy within 15m and alive)
- Player is in a cutscene or boss preamble
- Less than 15s since last auto-save

### 19.5 Save Slots

Three slots. Title screen shows:

| Slot | Status | Preview |
|------|--------|---------|
| Slot 1 | 4h 12m — Factory Floor | Agility: 7 / Precision: 3 / Survival: 2 |
| Slot 2 | Empty | — |
| Slot 3 | 45m — Warehouse Hub | Agility: 2 / Precision: 1 / Survival: 0 |

**Operations:**
- **New Game:** Pick empty slot or overwrite existing (with confirmation).
- **Copy:** Duplicate slot A into slot B.
- **Delete:** Wipe slot. Keeps last deleted save in `wp_save_slot_X_backup` for 7 days or until another delete overwrites it.

### 19.6 Corruption Detection & Recovery

**Hash computation:** On save, compute a SHA-256 hex digest of `JSON.stringify(data)` (with the `hash` field temporarily removed). Store the digest in `data.hash`.

**Validation on load:**
1. Parse JSON. If `JSON.parse` throws → corruption.
2. Recompute hash. If mismatch → tampering or bit-rot.
3. Check required fields (`version`, `player`, `progress`). Missing → corruption.

**Recovery ladder:**
1. **Primary save** corrupt? Try `wp_save_slot_X_backup` (last auto-save backup).
2. **Backup corrupt?** Try `wp_save_slot_X_emergency` (written only at checkpoint rests, overwritten every 5 min).
3. **All corrupt?** Offer "Rescue Save": preserve `player.skillTree`, `player.currency.chips`, and `arena.highScores`, but reset `progress.currentZone` to `warehouse_hub` and restore default inventory. Player keeps progression rewards but loses positional state.

### 19.7 SaveSystem.js API

```javascript
export class SaveSystem {
    constructor() {
        this.keyPrefix = 'wp_save_slot_';
        this.metaKey = 'wp_save_meta';
        this.settingsKey = 'wp_settings';
        this.backupSuffix = '_backup';
        this.emergencySuffix = '_emergency';
        this.autoSaveThrottleMs = 15000;
        this._lastAutoSave = 0;
        this._pendingAutoSave = false;
    }

    /** Synchronous write. Call only from safe moments. */
    save(slotIndex, data) {
        const payload = this._serialize(data);
        // Backup current before overwrite
        const existing = localStorage.getItem(this.keyPrefix + slotIndex);
        if (existing) {
            localStorage.setItem(this.keyPrefix + slotIndex + this.backupSuffix, existing);
        }
        localStorage.setItem(this.keyPrefix + slotIndex, payload);
        this._updateMeta(slotIndex, data);
    }

    load(slotIndex) {
        const raw = localStorage.getItem(this.keyPrefix + slotIndex);
        if (!raw) return null;
        let data = JSON.parse(raw);
        if (!this._validate(data)) {
            data = this._attemptRecovery(slotIndex);
            if (!data) return null;
        }
        data = migrate(data);
        return data;
    }

    requestAutoSave(slotIndex, data) {
        const now = performance.now();
        if (now - this._lastAutoSave < this.autoSaveThrottleMs) {
            this._pendingAutoSave = true;
            return;
        }
        this.save(slotIndex, data);
        this._lastAutoSave = now;
        this._pendingAutoSave = false;
    }

    flushPendingSave(slotIndex, data) {
        if (this._pendingAutoSave) {
            this.save(slotIndex, data);
            this._pendingAutoSave = false;
        }
    }

    delete(slotIndex) {
        const key = this.keyPrefix + slotIndex;
        const existing = localStorage.getItem(key);
        if (existing) {
            localStorage.setItem(key + this.backupSuffix, existing);
        }
        localStorage.removeItem(key);
        this._updateMeta(slotIndex, null);
    }

    getMeta() {
        const raw = localStorage.getItem(this.metaKey);
        return raw ? JSON.parse(raw) : { activeSlot: null, slots: [{}, {}, {}] };
    }

    // --- internal ---
    _serialize(data) { /* compute hash, return JSON */ }
    _validate(data) { /* hash + field check */ }
    _attemptRecovery(slotIndex) { /* backup -> emergency -> null */ }
    _updateMeta(slotIndex, data) { /* write wp_save_meta */ }
}
```

### 19.8 Integration Points

**SkillTree.js:**
```javascript
// On init:
const save = saveSystem.load(activeSlot);
if (save) this.deserialize(save.player.skillTree);

// On spend:
this.onChange = () => saveSystem.requestAutoSave(activeSlot, world.exportSaveData());
```

**CraftingSystem.js:**
```javascript
// After craft / dismantle / upgrade:
saveSystem.requestAutoSave(activeSlot, world.exportSaveData());
```

**ShopSystem.js:**
```javascript
// After purchase or sell:
saveSystem.requestAutoSave(activeSlot, world.exportSaveData());
```

**ArenaMode.js:**
```javascript
// On run completion:
arena.highScores[mode] = newBest;
saveSystem.save(activeSlot, world.exportSaveData()); // immediate, not throttled
```

**World.js / Checkpoint:**
```javascript
// On checkpoint touch:
player.progress.checkpointId = checkpoint.id;
saveSystem.requestAutoSave(activeSlot, world.exportSaveData());
// Also write emergency backup:
localStorage.setItem('wp_save_slot_' + activeSlot + '_emergency', payload);
```

**main.js:**
```javascript
// On window.beforeunload:
window.addEventListener('beforeunload', () => {
    saveSystem.flushPendingSave(activeSlot, world.exportSaveData());
});
```

---

## PHASE 20: ANIMATION STATE MACHINE & VFX PIPELINE

**Context:** Three.js r160 parkour game. `js/Player.js` is a ~1700-line state machine. Existing systems: `ProceduralAnimation.js`, `ParticleEffects.js`, post-processing chain (SAO → Bloom → MotionBlur → FilmGrain → ChromaticAberration → Vignette → OutputPass), `BulletTime.js`.

---

### 20.1 Animation State Machine Integration

**File:** `js/Player.js` (refactor) + `js/CombatStateMachine.js` (new, ~350 lines)

The monolithic `Player.js` state string (`IDLE`, `WALK`, `SPRINT`, `JUMP`, `FALL`, `CLIMB`, `SLIDE`, `VAULT`, `WALLRUN`, `HANG`, `ROLL`, `STUMBLE`, `RAGDOLL`, `GRAPPLE_AIM`, `SWING`, `RETRACT`) is extended with combat states. To prevent `Player.js` from exceeding 2000 lines, animation blending logic is extracted into a dedicated sub-state machine.

```javascript
// js/CombatStateMachine.js
export class CombatStateMachine {
    constructor(player, proceduralAnim) {
        this.player = player;
        this.procedural = proceduralAnim;
        this.layers = {
            fullBody:  new AnimationLayer('fullBody',  1.0),
            upperBody: new AnimationLayer('upperBody', 0.7), // overrides torso+arms
            lowerBody: new AnimationLayer('lowerBody', 0.6), // overrides legs
        };
        this.blendTimes = {
            default: 0.15,
            combat:  0.08,
            recoil:  0.04,
            death:   0.30,
        };
        this.currentStates = [];
    }

    update(dt) {
        // Resolve layer weights based on player.state priority
        // Full-body wins over partial; recoil always punches through upperBody
    }
}

class AnimationLayer {
    constructor(name, defaultWeight) {
        this.name = name;
        this.weight = defaultWeight;
        this.targetWeight = defaultWeight;
        this.currentTime = 0;
        this.duration = 0;
    }

    play(clipName, blendIn = 0.15, triggerEvents = []) {
        // triggerEvents: [{ frame: 0.15, callback: () => spawnHitbox() }]
    }
}
```

**Combat state animation assignments:**

| State | Layer | Clip / Procedural | Duration | Trigger Events |
|-------|-------|-------------------|----------|----------------|
| `ATTACK_LIGHT` | `upperBody` | `procedural.torsoTwistArmExtend` | 0.30 s | Hitbox spawn @ 0.12 s; SFX @ 0.10 s |
| `ATTACK_HEAVY` | `fullBody` | `procedural.squatLungeTween` | 0.60 s | Hitbox spawn @ 0.35 s; Screen shake @ 0.35 s; Dust @ 0.40 s |
| `ATTACK_AERIAL` | `fullBody` | `procedural.legExtensionSpin` | 0.30 s | Hitbox spawn @ 0.15 s; Landing prediction @ 0.20 s |
| `BLOCK` | `upperBody` | `procedural.guardRaise` | 0.10 s | Parry window open @ 0.05 s; close @ 0.25 s |
| `PARRY` | `upperBody` | `procedural.parrySwipe` | 0.20 s | Reflect raycast @ 0.08 s; White flash @ 0.08 s |
| `AIM` | `upperBody` | `procedural.aimSteady` | loop | FOV tween start @ 0.00 s |
| `RELOAD` | `upperBody` | `procedural.magSwap` | weapon-specific | Audio click @ 0.40 s; State return @ end |
| `STUN` | `fullBody` | `procedural.stumbleFlinch` | 1.00–3.00 s | — |
| `KNOCKBACK` | `fullBody` | `procedural.ragdollLite` | 0.50 s | Recovery flip prompt @ 0.30 s |
| `RAGDOLL` | `fullBody` | Physics-driven | — | Death collapse handled in 20.2 |

**Blend rules:**
- Upper-body clips blend over `0.08 s` when entering combat states; lower-body blends over `0.15 s`.
- If the player is airborne, `lowerBody` is locked to the falling procedural pose and only `upperBody` is available for combat.
- Transition from `AIM` to `ATTACK_LIGHT` interrupts the aim pose via `0.04 s` snap-blend so firing feels responsive.
- `BLOCK` → `PARRY` uses a `0.02 s` zero-cross fade; the parry swipes through the guard pose.

**Trigger frame specification:**

| State | Trigger | Normalized Time | Gameplay Effect |
|-------|---------|-----------------|-----------------|
| `ATTACK_LIGHT` | `hitbox_spawn` | 0.40 (0.12 s) | Melee sphere radius 1.0 m, duration 0.08 s |
| `ATTACK_HEAVY` | `hitbox_spawn` | 0.58 (0.35 s) | Melee sphere radius 1.2 m, duration 0.10 s, shield-break flag |
| `ATTACK_AERIAL` | `hitbox_spawn` | 0.50 (0.15 s) | Melee sphere radius 1.0 m, downward bias, velocity bonus applied |
| `BLOCK` | `parry_open` | 0.50 (0.05 s) | `player.isParryWindow = true` |
| `BLOCK` | `parry_close` | 2.50 (0.25 s) | `player.isParryWindow = false` |
| `PARRY` | `reflect` | 0.40 (0.08 s) | Projectile reversal raycast, 3× damage return |
| `RELOAD` | `mag_out` | varies | `weapon.ammo = 0` (visual only) |
| `RELOAD` | `mag_in` | varies | `weapon.ammo = weapon.clipSize` |

---

### 20.2 Procedural Animation Extensions

**File:** `js/ProceduralAnimation.js` (additions)

Three new procedural routines are added to the existing bone-tween system. All use pre-allocated `THREE.Quaternion` scratch objects to avoid GC pressure.

**Recoil Kickback**
```javascript
procedural.playRecoil(intensity /* 0.0–1.0 */, recoveryTime /* seconds */) {
    // Rotates spine bone backward on X axis by intensity * 15°
    // Translates weapon mesh backward on Z axis by intensity * 0.08 m
    // Damped spring recovery: omega = 12.0, zeta = 0.8
}
```
- Pistol intensity: `0.3` (recovery 0.12 s)
- Rifle intensity: `0.5` (recovery 0.18 s)
- Shotgun intensity: `0.8` (recovery 0.25 s)
- Heavy intensity: `1.0` (recovery 0.35 s)

**Hit Reaction Flinch**
```javascript
procedural.playFlinch(direction /* Vector3 */, severity /* light | heavy */) {
    // Light: 0.10 s spine rotation 8° away from damage source
    // Heavy: 0.25 s spine rotation 20° + step-back root translation 0.3 m
}
```
- Triggered by `DamageSystem` when `player.takeDamage()` is called and the player is not in `ROLL`, `PARRY`, or `RAGDOLL`.
- Flinch is played on the `fullBody` layer at weight `0.5` so it mixes with current locomotion.
- If the player is in `BLOCK`, flinch is suppressed; instead, the guard pose shakes (`procedural.playGuardShake`).

**Death Collapse (RAGDOLL state)**
```javascript
procedural.playDeathCollapse(damageSource /* Vector3 */, isExplosive /* boolean */) {
    // 1. Sample current bone rotations into rigid-body initial states
    // 2. Apply impulse toward damageSource inverse normal:
    //    - Normal: 15 Ns
    //    - Explosive: 45 Ns upward bias + 5 Ns random angular
    // 3. Enable physics simulation on 12 core bones for 3.0 s
    // 4. After 3.0 s, freeze poses, fade mesh alpha over 2.0 s
    // 5. Call player.respawn() at alpha 0
}
```
- Death collapse reuses the existing `RAGDOLL` state hook in `Player.js`.
- If the player dies in mid-air, the collapse adds a `+Y` impulse of `10 Ns` to simulate ragdoll arc.
- Boss arenas override the 3.0 s physics window to `5.0 s` for cinematic effect.

---

### 20.3 VFX System Architecture

**File:** `js/CombatVFX.js` (new, ~500 lines)

Centralized combat visual-effects manager. All particle systems are object-pooled. `CombatVFX.js` is instantiated in `main.js` after `player` and `world` exist, and updated every frame with `finalDt`.

```javascript
export class CombatVFX {
    constructor(scene, renderer, camera) {
        this.scene = scene;
        this.camera = camera;
        this.pools = {
            impactSparks:     new ParticlePool(scene, 'impact_sparks',     128),
            muzzleFlashes:    new ParticlePool(scene, 'muzzle_flash',       32),
            bloodSpray:       new ParticlePool(scene, 'blood_spray',        64),
            shockwaveRings:   new ParticlePool(scene, 'shockwave_ring',     16),
            explosionBursts:  new ParticlePool(scene, 'explosion_burst',    24),
            statusAuras:      new ParticlePool(scene, 'status_aura',        32),
        };
        this.screenFX = {
            hitFlash:         new HitFlashOverlay(),
            damageDir:        new DamageDirectionIndicator(),
            deathVignette:    new DeathVignette(camera),
        };
        this.hitStop = {
            active: false,
            remaining: 0,
            queuedTime: 0,
        };
    }

    update(finalDt) {
        if (this.hitStop.active) {
            this.hitStop.remaining -= finalDt;
            if (this.hitStop.remaining <= 0) this.hitStop.active = false;
            return; // freeze all VFX updates during hit-stop
        }
        for (const pool of Object.values(this.pools)) pool.update(finalDt);
        for (const fx of Object.values(this.screenFX)) fx.update(finalDt);
    }

    spawn(type, position, normal, intensity = 1.0) { /* pool checkout */ }
    requestHitStop(duration) { /* 20.3.4 */ }
}
```

**20.3.1 Pooled Particle Systems**

| Pool | Max Count | Geometry | Material | Lifetime | Behavior |
|------|-----------|----------|----------|----------|----------|
| `impactSparks` | 128 | `THREE.BufferGeometry`, 8 verts per spark | `THREE.PointsMaterial`, additive, size 0.04 m | 0.25–0.45 s | Burst radially from impact normal; gravity `-9.8 m/s²`; bounce off `world.collidables` at 0.3 restitution |
| `muzzleFlashes` | 32 | Billboard quad (2 tris) | Emissive mesh standard, 2.0 intensity, `color: 0xffaa33` | 0.04 s | Fixed to weapon muzzle bone; one-shot, auto-return |
| `bloodSpray` | 64 | `THREE.BufferGeometry`, 16 verts per droplet | `THREE.PointsMaterial`, additive blending, `color: 0xcc1100`, size 0.06 m | 0.30–0.60 s | Spray cone aligned to damage normal; sticky decals spawned on `world.collidables` at 20% of emission |
| `shockwaveRings` | 16 | Ring geometry (64 segments) | Transparent standard, `opacity: 0.4`, `color: 0xffffff` | 0.35 s | Scale from 0.1 m → radius at 15 m/s; fade opacity linearly |
| `explosionBursts` | 24 | `THREE.IcosahedronGeometry(0.3, 1)` | Emissive standard, bloom-threshold `> 1.0` | 0.50 s | Radial expansion + upward drift; sub-emitter spawns 8 sparks on death |
| `statusAuras` | 32 | `THREE.RingGeometry(0.4, 0.5, 32)` | Additive standard, color per status | loop while status active | Rotate at 90°/s, pulse scale `±10%`, follow owner mesh |

**Status aura colors:**

| Status | Color (hex) | Pulse Speed |
|--------|-------------|-------------|
| Burning | `0xff3300` | 8 Hz |
| Frozen | `0x88ccff` | 2 Hz |
| Shocked | `0xffee00` | 12 Hz |
| Corroded | `0x44ff44` | 4 Hz |
| Blinded | `0xaaaaaa` | 3 Hz |
| Marked | `0xff0055` | 6 Hz |
| Overclocked | `0x00ffff` | 10 Hz |

**20.3.2 Screen-Space Effects**

**Hit Flash**
- Trigger: `player.takeDamage()` with `amount > 0`
- Visual: fullscreen quad, `color: 0xff0000`, opacity `amount / player.maxHealth * 0.6`, additive
- Duration: `0.08 s` in, `0.25 s` out (ease-out quad)
- If damage type is `energy`, tint is `0xffaa00`; if `freeze`, tint is `0xaaddff`

**Damage Direction Indicator**
- Trigger: same as hit flash
- Visual: 4 triangular wedges anchored at screen edges (top/bottom/left/right)
- The wedge nearest the damage source world position flashes opaque `0.8` for `0.15 s`, then fades over `0.40 s`
- Update: every frame, recompute source-to-camera angle; if source is off-screen, clamp indicator to nearest edge
- Thickness: 24 px at 1080p, scales with `window.innerHeight / 1080`

**Death Vignette**
- Trigger: `player.health` reaches `0`
- Visual: radial gradient overlay, inner radius `60%`, outer radius `100%`, color `0x000000`
- Animation: opacity `0.0 → 1.0` over `2.0 s` as death collapse plays
- Post-death: holds at `1.0` until respawn; then fades out over `0.5 s`
- Integration: uses existing post-processing chain via `Vignette` pass intensity override

**20.3.3 Hit-Stop Specification**

| Condition | Freeze Duration | Affected Systems |
|-----------|-----------------|------------------|
| Melee connect (light) | `0.03 s` | Gameplay updates (`finalDt = 0`); VFX spawn; audio continues |
| Melee connect (heavy) | `0.05 s` | Gameplay updates (`finalDt = 0`); camera recoil still applies; audio continues |
| Parry reflect | `0.10 s` | Gameplay updates (`finalDt = 0`); time dilation stack from `BulletTime.js` additive |
| Boss weak-point strike | `0.08 s` | Gameplay updates (`finalDt = 0`); boss animation also frozen |
| Explosion player death | `0.15 s` | Full freeze including audio pitch-down; longest allowed hit-stop |

Implementation in `main.js`:
```javascript
const vfxHitStop = combatVFX.getHitStopRemaining();
const bulletTime = bulletTime.update(dt, player, activeInput);
const finalDt = dt * Math.min(timeScale, slowMo) * (vfxHitStop > 0 ? 0 : 1);
```

---

### 20.4 Camera Combat Behaviors

**File:** `js/CameraCombat.js` (new, ~250 lines)

Extension module for the existing camera controller. Imported and updated in `main.js` after the base camera update.

```javascript
export class CameraCombat {
    constructor(camera, player, combatVFX) {
        this.camera = camera;
        this.player = player;
        this.vfx = combatVFX;
        this.baseFOV = 75;
        this.aimFOV = 55;
        this.fovBlendSpeed = 5.0; // per second
        this.recoil = { pitch: 0, yaw: 0, damp: 8.0 };
        this.shake = { intensity: 0, decay: 4.0 };
        this.lockOn = { target: null, softOffset: new THREE.Vector3(), collisionRadius: 0.3 };
        this.bossFrame = { active: false, cinematicBlend: 0 };
    }

    update(dt, finalDt) {
        // 20.4.1 Aim FOV
        // 20.4.2 Recoil kick
        // 20.4.3 Lock-on soft follow
        // 20.4.4 Boss cinematic framing
        // 20.4.5 Screen shake
    }
}
```

**20.4.1 Aim-Down-Sights FOV Change**
- When `player.state === 'AIM'`, target FOV = `55°`.
- When leaving `AIM`, target FOV = `75°`.
- Blend speed: `5.0` units/sec (exponential ease), reaching 99% of delta in `0.92 s`.
- If `player.state` transitions `AIM → ATTACK_LIGHT`, FOV snaps to `60°` for `0.04 s` then resumes blend to `75°`.

**20.4.2 Recoil Camera Kick**
- On `weapon:fired` event, apply instantaneous pitch offset:
  - Pistol: `+1.2°`
  - Rifle: `+2.0°`
  - Shotgun: `+4.5°`
  - Sniper: `+3.0°`
- Horizontal kick: random `±0.5°` for automatic weapons; `0°` for single-shot.
- Recovery: damped spring, `omega = 12.0`, `zeta = 0.85`, returning to `0°` over `0.15–0.35 s`.

**20.4.3 Lock-On Camera (Soft Follow Target)**
- Activation: Hold `Mouse3` (middle click) while reticle is over an enemy within `30 m`.
- Behavior: camera rotates to keep target at `+15%` screen-right of center (rule-of-thirds offset).
- Softness: `lerpFactor = 1.0 - Math.pow(0.01, dt * 3.0)` (smooth follow, no snap).
- Collision awareness: if ray from camera to target intersects `world.collidables`, camera pushes forward to `collisionRadius = 0.3 m` from surface, then resumes soft follow once line-of-sight clears.
- Deactivation: release `Mouse3`, target dies, or player enters `RAGDOLL`.
- FOV during lock-on: `70°` (slight zoom).

**20.4.4 Boss Camera (Cinematic Framing)**
- Trigger: Boss phase transition event (`boss:phase_changed`).
- Framing: camera orbits to a preset angle per boss (e.g., Fabricator = low angle emphasizing welding arm; Warden = high angle showing prison towers).
- Duration: `3.0 s` fixed orbit + `1.0 s` blend back to player camera.
- During framing: player input is disabled; boss plays preamble animation.
- Override: tap `Space` to skip after first encounter.

**20.4.5 Screen Shake Intensity Curve**
```javascript
shakeIntensityCurve(source, distance) {
    const base = {
        explosion: 1.0,
        heavyMelee: 0.4,
        parry: 0.3,
        bossSlam: 0.8,
        landing: 0.15,
    }[source] || 0;
    const falloff = Math.max(0, 1 - distance / 20); // 20 m radius
    return base * falloff;
}
```
- Application: per-frame offset `camera.position.x += (Math.random() - 0.5) * intensity * 0.5 m`
- Decay: `intensity *= Math.pow(0.01, dt * 4.0)` (per-second decay of `4.0`).
- Disabled if `settings.screenShake === false`.

---

## PHASE 21: EVENT BUS & INTER-MODULE COMMUNICATION

**Context:** 55 new files need to communicate. Existing flat ES module architecture, no build step. Every module imports `main.js` or is imported by it; no central mediator exists.

---

### 21.1 EventBus Architecture

**File:** `js/EventBus.js` (new, ~180 lines)

Lightweight pub/sub with priority queues, owner-scoped cleanup, and zero external dependencies.

```javascript
export class EventBus {
    constructor() {
        this._subs = new Map(); // eventName -> [{ id, owner, priority, once, fn }]
        this._idCounter = 0;
        this._ownerRefs = new WeakMap(); // owner -> Set<subId>
    }

    on(event, fn, { owner = null, priority = 0, once = false } = {}) {
        const id = ++this._idCounter;
        if (!this._subs.has(event)) this._subs.set(event, []);
        const list = this._subs.get(event);
        list.push({ id, owner, priority, once, fn });
        list.sort((a, b) => b.priority - a.priority);
        if (owner) {
            if (!this._ownerRefs.has(owner)) this._ownerRefs.set(owner, new Set());
            this._ownerRefs.get(owner).add(id);
        }
        return id;
    }

    once(event, fn, opts) {
        return this.on(event, fn, { ...opts, once: true });
    }

    off(event, id) {
        const list = this._subs.get(event);
        if (!list) return;
        const idx = list.findIndex(s => s.id === id);
        if (idx !== -1) list.splice(idx, 1);
    }

    offByOwner(owner) {
        const ids = this._ownerRefs.get(owner);
        if (!ids) return;
        for (const [event, list] of this._subs) {
            for (let i = list.length - 1; i >= 0; i--) {
                if (ids.has(list[i].id)) list.splice(i, 1);
            }
        }
        ids.clear();
    }

    emit(event, payload) {
        const list = this._subs.get(event);
        if (!list) return;
        for (let i = list.length - 1; i >= 0; i--) {
            const sub = list[i];
            sub.fn(payload);
            if (sub.once) list.splice(i, 1);
        }
    }
}
```

**Design constraints:**
- No `async`/`await` inside `emit()`. All handlers must be synchronous to preserve frame consistency.
- Payloads are plain objects; never pass `THREE.Object3D` references (use IDs + lookup instead).
- Priority range: `[-10, 10]`. `10` = pre-processing (e.g., `DamageSystem` armor calc); `0` = default; `-10` = post-processing (e.g., analytics logging).
- Owner-scoped cleanup guarantees that calling `eventBus.offByOwner(bossInstance)` removes all subscriptions created by that boss, preventing leaks on arena exit.

**Singleton instantiation in `main.js`:**
```javascript
import { EventBus } from './EventBus.js';
const eventBus = new EventBus();
// Pass eventBus to every subsystem that needs it
```

---

### 21.2 Complete Combat Event Taxonomy

All event names are lowercase, colon-separated namespaces. Payload schemas are enforced by convention (not runtime validation, to avoid overhead).

| Event | Priority | Emitter | Payload | Consumer |
|-------|----------|---------|---------|----------|
| `player:damaged` | `5` | `DamageSystem` | `{ amount, type, sourceId, sourcePos, remainingHealth, isCritical }` | `CombatVFX` (hit flash, direction), `AudioManager` (hurt SFX), `UI` (health bar), `SaveSystem` (analytics) |
| `player:died` | `10` | `Player.js` | `{ causeId, causeType, pos, timeInRun }` | `CombatVFX` (death vignette), `AudioManager` (death SFX), `ArenaMode` (run fail), `SaveSystem` (analytics) |
| `player:healed` | `0` | `Player.js` | `{ amount, source, newHealth }` | `UI` (health bar), `CombatVFX` (green aura) |
| `enemy:damaged` | `5` | `DamageSystem` | `{ enemyId, amount, type, sourceId, remainingHealth, isWeakPoint }` | `CombatVFX` (blood, sparks), `EnemyManager` (AI reaction), `UI` (damage numbers), `AudioManager` (impact SFX) |
| `enemy:died` | `5` | `EnemyBase` | `{ enemyId, type, pos, killerId, drops[] }` | `EnemyManager` (despawn/corpse), `ComboSystem` (flow gain), `LootSystem` (drop spawn), `AudioManager` (death SFX), `ArenaMode` (wave counter) |
| `enemy:spotted_player` | `2` | `DroneAI` | `{ enemyId, type, pos, detectionTime }` | `AudioManager` (alert SFX), `UI` (minimap ping), `MusicSystem` (combat music start) |
| `weapon:fired` | `0` | `WeaponSystem` | `{ weaponId, weaponType, ownerId, origin, direction, ammoRemaining }` | `ProjectileManager` (spawn), `CombatVFX` (muzzle flash, recoil), `AudioManager` (fire SFX), `CameraCombat` (shake), `Analytics` (telemetry) |
| `weapon:reloaded` | `0` | `WeaponSystem` | `{ weaponId, ownerId, ammoNow, reserveNow, reloadTime }` | `UI` (ammo counter), `AudioManager` (reload SFX), `CombatStateMachine` (reload anim) |
| `weapon:switched` | `0` | `WeaponSystem` | `{ ownerId, oldWeaponId, newWeaponId, slot }` | `UI` (weapon HUD), `CombatStateMachine` (holster/draw), `AudioManager` (holster SFX) |
| `status:applied` | `3` | `StatusEffectSystem` | `{ targetId, status, duration, stacks, sourceId }` | `CombatVFX` (aura spawn), `EnemyManager` / `Player.js` (behavior mods), `UI` (status icon) |
| `status:removed` | `3` | `StatusEffectSystem` | `{ targetId, status, reason }` | `CombatVFX` (aura despawn), `UI` (icon remove) |
| `combo:milestone` | `1` | `ComboSystem` | `{ tier, previousTier, flowPercent }` | `UI` (flow bar flash), `AudioManager` (tier SFX), `CombatVFX` (shockwave at tier 3) |
| `flow:maxed` | `2` | `ComboSystem` | `{ durationAtMax }` | `UI` (flow bar pulse), `Player.js` (Overclocked buff available) |
| `arena:wave_started` | `0` | `ArenaMode` | `{ mode, waveNumber, totalWaves, modifiers[] }` | `EnemyManager` (spawn), `MusicSystem` (intensity ramp), `UI` (wave banner), `CombatVFX` (arena gate close) |
| `arena:wave_cleared` | `0` | `ArenaMode` | `{ mode, waveNumber, timeTaken, enemiesKilled }` | `EnemyManager` (stop spawns), `UI` (clear banner), `SaveSystem` (score) |
| `boss:phase_changed` | `10` | `BossFight` (per-boss) | `{ bossId, oldPhase, newPhase, transitionTime }` | `CameraCombat` (cinematic framing), `CombatVFX` (shockwave, phase aura), `AudioManager` (phase SFX), `EnemyManager` (minion spawns) |
| `boss:defeated` | `10` | `BossFight` | `{ bossId, totalTime, phasesReached, finalPos }` | `ArenaMode` (unlock), `SkillTree` (skill point grant), `CombatVFX` (defeat explosion), `SaveSystem` (progression + analytics) |

**Reserved but not yet wired (Phase 26 co-op):**
- `network:player_joined`, `network:player_left`, `network:state_sync`

---

### 21.3 Integration Patterns

**Player.js → EventBus**
```javascript
// Inside takeDamage(amount, source, type):
this.eventBus.emit('player:damaged', {
    amount,
    type,
    sourceId: source?.id ?? null,
    sourcePos: source?.position ?? new THREE.Vector3(),
    remainingHealth: this.health,
    isCritical: false
});
if (this.health <= 0) {
    this.eventBus.emit('player:died', {
        causeId: source?.id ?? null,
        causeType: type,
        pos: this.position.clone(),
        timeInRun: this.runTimer
    });
}
```

**WeaponSystem.js → EventBus**
```javascript
fire(origin, direction, owner) {
    // ... projectile spawn logic ...
    this.eventBus.emit('weapon:fired', {
        weaponId: this.activeWeapon.id,
        weaponType: this.activeWeapon.type,
        ownerId: owner.id,
        origin: origin.clone(),
        direction: direction.clone(),
        ammoRemaining: this.activeWeapon.ammo
    });
}
```

**DamageSystem.js → EventBus**
```javascript
dealDamage(target, amount, type, source) {
    const finalAmount = this.calculateDamage(target, amount, type, source);
    target.health -= finalAmount;
    const isEnemy = target.team === 'enemy';
    this.eventBus.emit(isEnemy ? 'enemy:damaged' : 'player:damaged', {
        [isEnemy ? 'enemyId' : 'playerId']: target.id,
        amount: finalAmount,
        type,
        sourceId: source?.id,
        sourcePos: source?.position,
        remainingHealth: target.health,
        isWeakPoint: !!source?.isWeakPoint
    });
    if (target.health <= 0 && isEnemy) {
        this.eventBus.emit('enemy:died', {
            enemyId: target.id,
            type: target.config.type,
            pos: target.position.clone(),
            killerId: source?.id,
            drops: target.generateDrops()
        });
        target.die();
    }
}
```

**Consumer pattern: CombatVFX.js**
```javascript
constructor(scene, camera, eventBus) {
    this.eventBus = eventBus;
    eventBus.on('player:damaged',  (p) => this.onPlayerDamaged(p),  { owner: this, priority: 0 });
    eventBus.on('enemy:damaged',   (p) => this.onEnemyDamaged(p),   { owner: this, priority: 0 });
    eventBus.on('weapon:fired',    (p) => this.onWeaponFired(p),    { owner: this, priority: 0 });
    eventBus.on('boss:phase_changed', (p) => this.onBossPhase(p), { owner: this, priority: 5 });
}

cleanup() {
    this.eventBus.offByOwner(this);
}
```

---

### 21.4 Rules for Avoiding Circular Dependencies

With 55 new files in a flat ES module graph, circular imports are the primary architectural risk.

**Rule 1: EventBus is the only shared central module.**
- `js/EventBus.js` exports only `EventBus`. It imports nothing from `js/Player.js`, `js/World.js`, or any gameplay module.
- `main.js` imports `EventBus` first, then passes the instance downward.

**Rule 2: Gameplay modules must not import each other for data flow.**
- ❌ `WeaponSystem.js` importing `DamageSystem.js` to call `damageSystem.dealDamage()` directly.
- ✅ `WeaponSystem.js` emits `weapon:fired`; `DamageSystem.js` is subscribed and handles hit registration independently.

**Rule 3: Three-category module taxonomy.**

| Tier | Role | Can Import | Examples |
|------|------|------------|----------|
| **Core** | Foundational, no gameplay knowledge | Nothing from gameplay | `EventBus.js`, `InputManager.js`, `AudioManager.js` |
| **Systems** | Gameplay logic, stateful | Core + utils + sibling systems via interface (never concrete) | `DamageSystem.js`, `WeaponSystem.js`, `StatusEffectSystem.js` |
| **Features** | Specific mechanics, high churn | Core + Systems (read-only) + utils | `BossFabricator.js`, `ZiplineGun.js`, `StealthSystem.js` |

**Rule 4: Pass references via constructor, not module-level imports.**
```javascript
// js/EnemyBase.js
export class EnemyBase {
    constructor(scene, config, eventBus) {
        this.eventBus = eventBus; // injected
    }
}
// ❌ Never: import { eventBus } from '../main.js'
```

**Rule 5: Data transfer objects only.**
- Events carry primitive IDs and cloned `Vector3`s, never live object references.
- If `DamageSystem` needs the enemy instance, it looks it up via `EnemyManager.getById(payload.enemyId)`.

**Rule 6: Static analysis gate.**
- CI runs `node scripts/check-circular-deps.js` before merge.
- The script uses `acorn` to parse all `js/**/*.js` import statements and detects cycles via DFS.
- Any cycle longer than length 2 fails the build.

---

## PHASE 22: PERFORMANCE BUDGET & OPTIMIZATION STRATEGY

**Context:** `AGENTS.md` gives overall CPU budgets but the plan needs per-system allocation. 55 new files, ~15,000 lines. Target platform: mid-range desktop GPU (GTX 1060 / RX 580 equivalent), 60 FPS at 1080p.

---

### 22.1 Per-System CPU Budgets

Total gameplay CPU budget: **< 3.0 ms/frame** (16.67 ms @ 60 Hz, leaving 13.67 ms for GPU + browser overhead).

| System | Budget (ms) | Technique | Owner File |
|--------|-------------|-----------|------------|
| Player physics + collision | `0.70` | Spatial hash broadphase (22.4); AABB early-out | `js/Player.js` |
| Foot IK (4 raycasts) | `0.40` | Raycast against static grid only; skip if airborne | `js/FootIK.js` |
| Drone AI (all drones) | `0.50` | AI LOD tick rates (see below); behavior tree caching | `js/EnemyManager.js` |
| HitboxSystem | `0.25` | Spatial hash broadphase → narrow sphere-sphere/OBB | `js/HitboxSystem.js` |
| DamageSystem | `0.10` | Event emission only; no math heavier than multiply | `js/DamageSystem.js` |
| ProjectileManager | `0.20` | Projectile caps/merging; sleep at < 1 m/s | `js/ProjectileManager.js` |
| WeaponSystem | `0.08` | State machine with early returns; no per-frame raycasts | `js/WeaponSystem.js` |
| StatusEffectSystem | `0.12` | Batched updates every 3rd frame (20 Hz) for DOTs | `js/StatusEffectSystem.js` |
| CombatVFX | `0.30` | Particle pool update loop; max 384 particles active | `js/CombatVFX.js` |
| CameraCombat | `0.05` | Damped springs; one raycast for lock-on collision | `js/CameraCombat.js` |
| EventBus | `0.05` | Pre-sorted subscriber arrays; no allocations during emit | `js/EventBus.js` |
| ComboSystem | `0.05` | Simple float decay; no iteration over enemies | `js/ComboSystem.js` |
| ArenaMode (wave logic) | `0.10` | Spawn queue, not per-spawn raycasts | `js/ArenaMode.js` |
| Boss AI | `0.15` | Phase-state machines; scripted sequences use coroutine flags | `js/bosses/*.js` |
| **Reserve / slack** | `0.05` | — | — |
| **TOTAL** | **3.00** | — | — |

**AI LOD Tick Rates:**

| Distance to Player | Tick Rate | Behavior Complexity | Max Active |
|--------------------|-----------|---------------------|------------|
| `0–15 m` | 30 Hz (every frame @ 60 Hz) | Full: pathfinding, attack, flocking | 8 |
| `15–40 m` | 10 Hz (every 6th frame) | Reduced: patrol only, no attack logic | 12 |
| `40–100 m` | 5 Hz (every 12th frame) | Minimal: wake-on-proximity check only | 20 |
| `> 100 m` | 2 Hz (every 30th frame) | Frozen: position validated only | unlimited (despawn at 200 m) |

- Tick scheduling: `EnemyManager` maintains a ring buffer of drone IDs per LOD bucket. Each frame, it advances a cursor and updates only the drones whose turn has arrived.
- Stagger: drones in the same bucket are offset by `+1` frame per drone to prevent spikes.

**Projectile Caps / Merging:**

| Projectile Type | Max Live | Pool Size | Merge Rule |
|-----------------|----------|-----------|------------|
| Bullet (pistol/rifle) | 120 | 200 | Tracer rounds: every 3rd bullet renders a mesh; others are raycasts only |
| Shotgun pellet | 80 | 100 | Per-shell: 8 pellets merged into 2 visual tracers + 8 hitbox rays |
| Rocket / grenade | 12 | 20 | No merge; each is physics-simulated |
| Laser beam | 8 | 16 | Continuous raycast; visual beam is one mesh per source, not per frame |
| Melee hitbox | 4 | 8 | Instantaneous; returned to pool same frame |

- Overflow rule: if a pool is exhausted, the oldest live projectile is force-despawned and replaced.

**Batched Status Updates:**
- `StatusEffectSystem` splits updates into **gameplay** and **visual** batches.
- Gameplay (DOT ticks, duration decrements): every 3rd frame (`20 Hz`).
- Visual (aura rotation, particle drift): every frame (`60 Hz`), but only for effects whose owner is on-screen.
- Batch size: max `64` status effects processed per gameplay tick; overflow deferred to next tick (should never happen with 20-enemy cap).

---

### 22.2 Memory Budgets

Target: **< 80 MB** total JS heap during active arena combat (baseline world ~40 MB + combat ~40 MB).

| Asset Class | Budget | Policy | File |
|-------------|--------|--------|------|
| Enemy corpses | 10 max or 30 s | On `enemy:died`, spawn corpse mesh. After `30 s`, fade out over `2 s`, then `dispose()`. If count > 10, despawn oldest. | `js/EnemyManager.js` |
| Projectile pool | 554 total (see table above) | Pre-allocated at arena start. `ProjectileManager` never `new`s geometry mid-combat. | `js/ProjectileManager.js` |
| VFX particles | 384 max active | `CombatVFX` pools total 296 emitters; max visible particles derived from `renderer.capabilities.maxTextureSize`:
  - `> 8192`: 384
  - `4096–8192`: 256
  - `< 4096`: 128 | `js/CombatVFX.js` |
| Weapon model LOD | 3 tiers per weapon | Tier 0 (close): full mesh ~400 tris. Tier 1 (5–20 m): simplified ~120 tris. Tier 2 (>20 m): billboard sprite 2 tris. | `js/WeaponSystem.js` |
| Damage number sprites | 32 concurrent | DOM-based `<div>` pool in `#ui`. Auto-remove after `0.5 s` fade. | `js/DamageSystem.js` |
| Status icons | 20 concurrent | DOM pool in `#ui`; one per active unique status on player. | `js/StatusEffectSystem.js` |
| Audio nodes | 64 max | `AudioManager` voice pool. Oldest voice stolen if exceeded. | `js/AudioManager.js` |
| Loot drops | 20 max or 60 s | Scrap/ammo pickups despawn after `60 s` if uncollected. Cap at 20; oldest removed first. | `js/LootSystem.js` |

---

### 22.3 Object Lifecycle & Cleanup Contract

Every class that allocates `THREE.Object3D`, `THREE.BufferGeometry`, `THREE.Material`, `THREE.WebGLRenderTarget`, or Web Audio nodes must implement:

```javascript
class MyModule {
    constructor(scene, ...) { /* allocate */ }
    update(finalDt, ...) { /* logic */ }
    dispose() { /* release all GPU/CPU resources; remove from scene */ }
    cleanup() { /* reset state for arena restart; may call dispose() internally */ }
}
```

**Mandatory checklist per module:**

| Check | Verification |
|-------|--------------|
| `dispose()` exists | `grep -n "dispose()" js/MyModule.js` must return a match |
| All `new THREE.Mesh` have a matching `mesh.geometry.dispose()` and `mesh.material.dispose()` | Static analysis script scans for `new THREE.Mesh` and asserts `.dispose()` exists in same file |
| EventBus subscriptions removed | `eventBus.offByOwner(this)` called in `cleanup()` |
| DOM nodes removed | Any `#ui` children created by the module are removed in `cleanup()` |
| Timer callbacks cleared | No `setInterval` / `setTimeout` leaks; all IDs tracked and cleared |
| Pool objects returned | `CombatVFX`, `ProjectileManager` pools drained in `cleanup()` |

**Arena Exit Checklist (`ArenaMode.cleanup()`):**

```javascript
cleanup() {
    // 1. Entities
    this.enemyManager.cleanup();          // despawn all, dispose corpses
    this.projectileManager.cleanup();     // return all to pool
    this.combatVFX.cleanup();             // kill all particles, clear screen FX
    this.lootSystem.cleanup();            // remove uncollected drops

    // 2. Boss
    if (this.activeBoss) {
        this.activeBoss.cleanup();
        this.activeBoss = null;
    }

    // 3. World mutations
    this.world.removeArenaGeometry();     // revert collidables to pre-arena state
    this.world.syncWorldArrays();         // rebuild arrays (see AGENTS.md § World array sync)

    // 4. Player reset
    this.player.heal(this.player.maxHealth);
    this.player.stamina = this.player.maxStamina;
    this.player.state = 'IDLE';
    this.player.velocity.set(0, 0, 0);

    // 5. Systems
    this.statusEffectSystem.cleanup();    // clear all statuses
    this.comboSystem.reset();             // zero flow meter
    this.eventBus.offByOwner(this);       // remove arena subscriptions

    // 6. Audio
    this.audio.stopCombatMusic();

    // 7. Memory verification (debug builds only)
    if (DEBUG) this._assertHeapDeltaWithin(5); // 5% variance allowed
}
```

---

### 22.4 Spatial Optimization

**Grid-Based Broadphase for Hitboxes**

**File:** `js/HitboxSystem.js` (broadphase addition, ~120 lines)

```javascript
class SpatialHash {
    constructor(cellSize = 10.0) {
        this.cellSize = cellSize;
        this.grid = new Map(); // key: "x,y,z", value: Set<Hitbox>
    }

    _key(x, y, z) {
        const cs = this.cellSize;
        return `${Math.floor(x/cs)},${Math.floor(y/cs)},${Math.floor(z/cs)}`;
    }

    insert(hitbox) {
        const pos = hitbox.getWorldPosition();
        const r = hitbox.getBoundingRadius();
        const min = this._key(pos.x - r, pos.y - r, pos.z - r);
        const max = this._key(pos.x + r, pos.y + r, pos.z + r);
        // iterate all cells between min and max; add hitbox.id
    }

    querySphere(center, radius) {
        // return candidate hitboxes in overlapped cells
    }
}
```

- Cell size: `10.0 m` (warehouse floor tiles are ~5 m; a drone hitbox is ~1 m; this gives 2–3 cells of overlap).
- Rebuild: every frame, before `checkCollisions()`, the hash is cleared and re-inserted from `this.activeHitboxes`.
- Cost: `O(n)` insert, `O(1)` average query. For `n = 50` hitboxes (player + 20 enemies + projectiles), insert cost is negligible.
- Fallback: if `activeHitboxes.length < 15`, skip the hash and use brute-force `O(n²)` to avoid hash overhead.

**Projectile Culling**

| Condition | Action |
|-----------|--------|
| Distance from player `> 500 m` | Immediate despawn |
| Velocity `< 1.0 m/s` for `> 2.0 s` | Sleep: freeze position, disable collision, disable visual; wake on proximity |
| Behind camera + `> 50 m` + not visible for `> 1.0 s` | Visual disable only (mesh invisible, collision still active) |
| Owner dead + projectile is homing | Convert to ballistic (no target tracking); despawn after `5.0 s` |

**Frustum Culling Integration**

- All combat meshes (weapon models, enemy meshes, VFX particles) use `THREE.Mesh.frustumCulled = true` by default.
- Exception: `CombatVFX` particles use a custom cull pass:
  - Compute bounding sphere for each particle system emitter.
  - If emitter bounds are outside camera frustum, skip CPU update for that emitter entirely.
  - Re-check every `6` frames (`10 Hz`) to avoid per-frame frustum math.
- Enemy meshes: `EnemyManager` sets `mesh.visible = false` for drones beyond `100 m` or behind the camera frustum. AI still ticks (at reduced LOD), but rendering cost is zero.

---

**TOTAL: 3 phases, ~3000 words, 12 code blocks, 22 tables**
## PHASE 23: TESTING & QA STRATEGY

### 23.1 Automated Testing

**Syntax Validation**
- Every new or modified `.js` file must pass `node -c <file>` before commit
- CI gate: script enumerates all `js/**/*.js` and `js/**/*.js` in `js/weapons/`, `js/enemies/`, `js/bosses/`
- Fail on any syntax error, missing import, or unclosed brace

**Static Analysis Checklist** (manual review gate)
| Check | Pass Criteria |
|-------|---------------|
| No undefined globals | All `THREE`, `Math`, `console` usage is expected; no leaked `let`/`var` into global scope |
| Proper ES module imports | Every `import` resolves to a real file; no circular dependencies between core systems |
| Dispose methods exist | Any class creating `THREE.Geometry`, `THREE.Material`, or `THREE.WebGLRenderTarget` has a `.dispose()` method |
| No `==` loose equality | Strict `===` / `!==` everywhere |
| No `setInterval` / `setTimeout` leaks | All timers cleared in `.cleanup()` or `.dispose()` |

**Unit Test Framework Decision**
- **Choice: Vitest** (not Jest, not custom)
- Justification: Native ES module support (no `transformIgnorePatterns` hack for Three.js), `happy-dom` for lightweight browser API mocking, fast watch mode for iterative development, inline snapshots for damage number assertions
- Install: `npm install -D vitest happy-dom` (dev-only, no build step change)
- Test files co-located: `js/DamageSystem.test.js`, `js/HitboxSystem.test.js`
- Run: `npx vitest run` in CI; `npx vitest` for local watch

**Systems Requiring Unit Tests**
| System | Coverage Target | Rationale |
|--------|-----------------|-----------|
| `DamageSystem` | 100% of public methods | Damage math is deterministic, high regression risk |
| `HitboxSystem` | Core collision paths | Sphere-sphere, AABB-sphere, team-filter logic |
| `StatusEffectSystem` | Apply/remove/update cycle | DOT stacking, duration edge cases, elemental interactions |
| `SkillTree` | Save/load, prerequisite validation, point spending | Corrupt save = player progression loss |
| `WeaponSystem` | Fire/reload/switch/ammo | State machine must never desync |

**Example Test Cases**

`js/DamageSystem.test.js`:
```javascript
import { describe, it, expect, vi } from 'vitest';
import { DamageSystem } from './DamageSystem.js';

describe('DamageSystem.takeDamage', () => {
  it('applies base kinetic damage with no resistances', () => {
    const sys = new DamageSystem();
    const target = { health: 100, shield: 0, resistances: {} };
    sys.takeDamage(target, 20, 'kinetic', 'player');
    expect(target.health).toBe(80);
  });

  it('reduces energy damage by 50% when shield is active', () => {
    const sys = new DamageSystem();
    const target = { health: 100, shield: 10, resistances: {} };
    sys.takeDamage(target, 20, 'energy', 'player');
    expect(target.shield).toBe(0);
    expect(target.health).toBe(90); // 10 to shield, 10 mitigated to 5 health
  });

  it('doubles explosive damage if target is not rolling', () => {
    const sys = new DamageSystem();
    const target = { health: 100, shield: 0, state: 'IDLE', resistances: {} };
    sys.takeDamage(target, 20, 'explosive', 'player');
    expect(target.health).toBe(60);
  });

  it('applies freeze slow before damage', () => {
    const sys = new DamageSystem();
    const status = { apply: vi.fn() };
    sys.statusEffectSystem = status;
    const target = { health: 100, shield: 0, state: 'IDLE', resistances: {} };
    sys.takeDamage(target, 10, 'freeze', 'player');
    expect(status.apply).toHaveBeenCalledWith(target, 'frozen', 3000);
    expect(target.health).toBe(90);
  });
});
```

`js/HitboxSystem.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { HitboxSystem, Hitbox } from './HitboxSystem.js';

describe('HitboxSystem.checkCollisions', () => {
  it('registers a hit when player melee sphere intersects enemy hurtbox', () => {
    const sys = new HitboxSystem();
    const playerBox = new Hitbox({
      owner: { team: 'player' },
      type: 'melee',
      shape: { type: 'sphere', radius: 1.0 },
      offset: new THREE.Vector3(0, 0, 0),
      duration: 0.2,
      onHit: (target) => target.hit = true
    });
    const enemyBox = new Hitbox({
      owner: { team: 'enemy', hit: false },
      type: 'hurtbox',
      shape: { type: 'sphere', radius: 0.8 },
      offset: new THREE.Vector3(0.5, 0, 0),
      duration: 999,
      onHit: null
    });
    sys.registerHitbox(playerBox);
    sys.registerHitbox(enemyBox);
    sys.checkCollisions();
    expect(enemyBox.owner.hit).toBe(true);
  });

  it('ignores same-team collisions', () => {
    const sys = new HitboxSystem();
    let friendlyFire = false;
    const boxA = new Hitbox({
      owner: { team: 'player' },
      type: 'projectile',
      shape: { type: 'sphere', radius: 1.0 },
      offset: new THREE.Vector3(0, 0, 0),
      duration: 0.1,
      onHit: () => { friendlyFire = true; }
    });
    const boxB = new Hitbox({
      owner: { team: 'player' },
      type: 'hurtbox',
      shape: { type: 'sphere', radius: 1.0 },
      offset: new THREE.Vector3(0, 0, 0),
      duration: 0.1,
      onHit: null
    });
    sys.registerHitbox(boxA);
    sys.registerHitbox(boxB);
    sys.checkCollisions();
    expect(friendlyFire).toBe(false);
  });
});
```

### 23.2 Integration Testing

**Combat Scenario Matrix**
Every player state × every enemy type × every damage type must be exercised:

| Player State | Brawler | Shield | Turret | Suicide | Sapper | Jammer | Medic | Phantom | Command | Minelayer |
|--------------|---------|--------|--------|---------|--------|--------|-------|---------|---------|-----------|
| IDLE | melee/ranged | shield bash flank | grapple behind | kick back | kill fast | melee only | priority snipe | V to spot | kill first | slide dodge |
| WALK | same | same | same | same | same | same | same | same | same | same |
| SPRINT | shoulder bash | shield break | rush past | outrun | same | same | same | same | same | same |
| JUMP | dive kick | same | same | same | same | same | same | same | same | same |
| FALL | ground pound | same | same | same | same | same | same | same | same | same |
| WALLRUN | wall-kick stun | same | same | same | same | same | same | same | same | same |
| SLIDE | slide tackle | same | same | slide dodge | same | same | same | same | same | same |
| ROLL | rolling thunder | same | same | iframe evade | same | same | same | same | same | same |
| BLOCK | parry melee | same | same | — | same | same | same | same | same | same |
| AIM | — | — | peek shoot | — | — | — | scoped | — | — | — |
| STUN | **vulnerable** | **vulnerable** | **vulnerable** | **vulnerable** | **vulnerable** | **vulnerable** | **vulnerable** | **vulnerable** | **vulnerable** | **vulnerable** |
| KNOCKBACK | recovery flip | same | same | same | same | same | same | same | same | same |

- **Minimum integration tests**: 11 states × 10 enemies = 110 base scenarios
- Damage type variant per scenario: kinetic, energy, explosive, electric, freeze = 550 permutations
- Automated via headless Vitest + `jsdom`/`happy-dom` mocking `THREE.Vector3` and raycasts

**Input Combination Testing**
- Ensure no key conflicts in any state:
  - `Mouse1` = fire weapon in AIM, but = light melee attack in non-AIM
  - `Q` = dash in air, = EMP burst on ground double-tap, = grapple pull when grappling enemy
  - `F` = takedown when behind enemy, = parry during BLOCK windup, = shoulder bash during SPRINT
  - `E` = interact/pickup, = hold for meat shield while grappling drone, = body hide after takedown
- Test matrix: every state × every input key × held vs. tapped vs. double-tapped
- Regression script: `test/input-combinations.test.js` enumerates all 200+ combinations and asserts exactly one action resolves per frame

**Time Dilation Testing**
- All combat systems must function identically at `0.1×` and `2.0×` time scale
- Test protocol:
  1. Set `finalDt = dt * 0.1`, run 10s real-time (1s game-time)
  2. Verify: DOT ticks correct number of times, projectile travel distance unchanged, animation completion state correct
  3. Set `finalDt = dt * 2.0`, run 5s real-time (10s game-time)
  4. Verify: no missed collision frames, no stamina regen overflow, no rapid-fire exploit
- Critical systems to verify under dilation: `DamageSystem`, `HitboxSystem`, `StatusEffectSystem`, `ProjectileManager`, `WeaponSystem`, `EnemyManager`

### 23.3 Playtesting Methodology

**Balance Validation Protocol**
Track per-session JSON log (`localStorage` or lightweight telemetry):

| Metric | How Tracked | Target |
|--------|-------------|--------|
| TTK per weapon | `WeaponSystem` emits `weapon_fired` + `enemy_died` events with timestamps | Match Phase 17 targets |
| Death frequency | `Player.takeDamage` logs `player_died` with cause and position | Normal: 1 per 2 min; Hard: 1 per 30 s |
| Ammo scarcity | `WeaponSystem` logs `ammo_depleted` + `ammo_pickup` | Dry every 45–60 s of sustained fire |
| Skill tree choices | `SkillTree` logs every `skill_purchased` | No skill > 80% pick rate |
| Combo length | `ComboSystem` logs `combo_broken` with max tier | Average tier 2.5+ |

**Heat Map Generation**
- On every `player_died` event, record `x, z` coordinates
- Aggregate into 5m × 5m grid buckets
- Export JSON to `analytics/death-heatmap.json`
- Visual overlay: render as translucent red quads on minimap during post-run review
- Use heat map to identify: unfair spawn points, missing cover, geometry traps, overly dense enemy patrol routes

**Flow Meter Analytics**
- `ComboSystem` emits `flow_meter_changed` events every tier transition
- Track: average tier reached per encounter, average combo length (seconds), max combo length per session
- Per-arena export: `analytics/flow-report.json`
- Use to tune: combo decay rate, tier thresholds, reward generosity

### 23.4 Memory Leak Testing

**Automated Arena Loop Test**
- Script: `test/arena-loop.test.js` (Vitest + `happy-dom` + Three.js mocks)
- Procedure:
  1. Instantiate `ArenaMode`, `World`, `Player`, all combat systems
  2. Start Wave Defense arena
  3. Simulate 5 waves (spawns, combat, enemy deaths, pickups)
  4. Call `arena.cleanup()` and `world.syncWorldArrays()`
  5. Repeat 10×
- Assert: `renderer.info.memory.geometries` delta ≤ 0 between iteration 1 and 10
- Assert: `renderer.info.memory.textures` delta ≤ 0
- Assert: No detached DOM nodes in `#ui` panel

**Heap Snapshot Comparison Points**
| Checkpoint | Action | What to Verify |
|------------|--------|----------------|
| A | Game boot, idle at title | Baseline heap |
| B | Enter world, load warehouse | `World.js` geometry budget < 50 MB |
| C | Start arena, wave 1 | Enemy meshes allocated |
| D | Complete wave 5 | No accumulation of dead enemy objects |
| E | Exit arena, return to hub | Heap returns to within 5% of Checkpoint B |
| F | Repeat C–E 5× | Heap delta flatlines; no upward trend |

**Three.js Dispose Verification**
- Every class creating renderables must implement `.dispose()`:
  - `WeaponSystem.dispose()`: disposes weapon model meshes, material cache
  - `ProjectileManager.dispose()`: clears pool, disposes bullet geometry
  - `EnemyManager.dispose()`: disposes all drone meshes, health bar sprites
  - `ArenaMode.dispose()`: disposes arena-only geometry, modifiers
  - `BossFabricator.dispose()` … `BossArchitect.dispose()`: per-boss cleanup
- Lint rule: grep for `new THREE.Mesh`, `new THREE.BufferGeometry`, `new THREE.Material` in new files; verify corresponding `.dispose()` call exists in same file

### 23.5 Regression Checklist (Per Sprint)

**Before merging any sprint branch:**

- [ ] `node -c` passes on all new/modified `.js` files
- [ ] `npx vitest run` passes (unit + integration)
- [ ] Game loads at `http://localhost:8080` with zero console errors
- [ ] Keyboard + mouse: all new inputs work; no key conflicts in any state
- [ ] Gamepad: all new inputs mapped; no button conflicts
- [ ] Player movement: sprint, jump, dash, slide, wallrun, vault, hang unchanged
- [ ] Existing modules unaffected: `ComboSystem`, `ChallengeSystem`, `PhotoMode`, `TimeTrial`
- [ ] Memory: heap delta flat after 3 arena start/stop cycles
- [ ] Performance: Player physics + collision < 1 ms, Drone AI < 0.5 ms, Foot IK < 0.5 ms
- [ ] WebGL: no shader compile errors, no `WebGL: CONTEXT_LOST_WEBGL`
- [ ] Accessibility: UI scales correctly at 1080p, 1440p, 4K; no text overflow

---
## PHASE 24: TUTORIAL & ONBOARDING DESIGN

With ~120 combat features, dumping the entire control scheme on the player in minute one guarantees cognitive overload. This phase gates mechanics behind **early encounters**, provides a **safe practice space**, and celebrates **moment-to-moment discovery**.

### 24.1 Progressive Unlock System

Features are not hidden; they are **gated by narrative context** so the player learns them just before they are needed.

| Game Time | Unlocked Feature | Gating Encounter |
|-----------|------------------|------------------|
| 0:00–2:00 | Move, Jump, Vault, Sprint, Slide | Opening corridor (no enemies) |
| 2:00–3:30 | Runner Vision (V) | First rooftop; drone spotted in distance |
| 3:30–5:00 | Silent Takedown, Crouch | First basic drone patrol |
| 5:00–6:30 | Air Dash, Dive Kick | Gap too wide to cross; drone on other side |
| 6:30–8:00 | Weapon pickup, Aim, Fire | Weapon crate on rooftop; targets to shoot |
| 8:00–10:00 | Skill Tree (Tab), 1 free point | Reach safe hub; mentor hologram |
| 10:00–15:00 | Ground Pound, Roll | Elevated arena with 3 drones |
| 15:00–20:00 | EMP Burst, Parry | Elite drone + shield drone pair |
| 20:00–25:00 | Grapple Pull, Zipline Gun | Vertical shaft with grapple points |
| 25:00–30:00 | Predator Vision, Distraction | Stealth section with 5+ drones |
| Post-30:00 | All remaining features | Unlocked organically or via Training Ground |

**Implementation:** `progress.discoveredMoves` and `progress.tutorialFlags` are checked before showing input hints or allowing certain interactions. If a move is not yet discovered, the input still works (no artificial restriction), but the **tutorial banner** is suppressed until the gate is passed.

### 24.2 Training Ground Arena

**File:** `js/TrainingGround.js` (new)

A safe zone accessible from the warehouse hub via a glowing portal. Inside:

- **Infinite respawn dummies** — basic drone meshes with 999 HP, no AI, no aggro.
- **Holographic instructor** — a translucent NPC that demonstrates the correct input sequence in slow motion (0.5× speed) when the player approaches a station.
- **Skill stations** — each station is a 5m-radius platform dedicated to one mechanic:
  - *Dive Kick Zone:* Dummy suspended over a pit.
  - *Parry Zone:* Projectile launcher fires slow tennis balls; player must parry.
  - *Stealth Lane:* Three dummies on patrol paths; goal is Silent Takedown without entering vision cone.
  - *Weapon Range:* Target dummies at 5m, 15m, 30m; tracks accuracy and time-to-kill.
  - *Parkour Gauntlet:* Mini time-trial course.
- **Mastery tracking:** Performing a move 3 times successfully at a station marks it "mastered" in `progress.tutorialFlags`. Mastered moves show a gold checkmark in the Move Codex.
- **Assist Mode dummies:** If `AssistMode.isActive()` is true, dummies never attack and parry/dodge windows are widened by 0.1s during demonstration.

```javascript
class TrainingGround {
    constructor(scene, player, world) { ... }

    enter() {
        // Teleport player to hub coordinates
        // Spawn dummies
        // Disable combat music, enable ambient
    }

    evaluateParry(success) {
        if (success) this.parryCount++;
        if (this.parryCount >= 3) {
            player.progress.tutorialFlags.parry_mastered = true;
            ui.showToast('Parry — Mastered');
        }
    }
}
```

### 24.3 Contextual Tooltip System

**File:** `js/TooltipSystem.js` (new)

Tooltips appear only when relevant and auto-dismiss after 5s (8s if AssistMode is on).

| Context | Trigger | Tooltip Content |
|---------|---------|-----------------|
| Weapon HUD hover | Mouse over weapon icon | Name, damage, fire rate, mod summary |
| Enemy first sight | New enemy type enters screen | Name + 1-line weakness hint |
| New input context | Player enters state where move is possible | "Press [Q] while airborne to Air Dash" |
| Low health | Health < 25% | "Find cover or use a health kit (I)" |
| Stamina depleted | Stamina = 0 after attack | "Stamina regenerates faster when grounded" |
| Mod workbench | Approach workbench | "Hold [E] to craft or modify weapons" |

**Rules:**
- Each tooltip is shown **maximum once per save slot** unless the player opens the Move Codex and clicks "Reset Hints."
- Tooltips never appear during combat (enemy within 10m and alert).
- Tooltips are **non-blocking**; the game does not pause.
- Font: same monospace as HUD, yellow text with black outline, positioned near the relevant UI element or world object.

### 24.4 First 10 Minutes — Step-by-Step

**0:00–0:30 — Awakening**
- Player wakes in a derelict safe room. Faint yellow waypoint marker 10m ahead.
- Tooltip: "W A S D to move."
- Tooltip: "Space to jump."
- Obstacle: a single 1m crate. Jump over it.

**0:30–1:30 — Vault Tutorial**
- A 1.3m barrier blocks the path.
- As the player approaches at speed, time dilates to 0.3× for 1s.
- Tooltip: "Sprint into low barriers to Vault automatically."
- Player vaults. Gate opens.

**1:30–2:30 — Slide & Sprint**
- A half-collapsed vent requires crouch-walking, then a low tunnel requires sliding.
- Tooltip: "Hold Shift to Sprint. Tap C to Slide under obstacles."
- No enemies.

**2:30–4:00 — Rooftop & First Look**
- Player exits onto a rooftop. A basic drone patrols on an adjacent building, 20m away.
- Tooltip: "Press V to scan the area."
- Runner Vision highlights the drone in red, shows a patrol path dotted line.
- Tooltip: "Red dots are hostile. Avoid their vision cones."

**4:00–5:30 — First Takedown**
- Player must cross to the adjacent roof. A narrow beam connects them.
- The drone turns its back.
- Tooltip: "Hold C to crouch. Move silently behind enemies."
- Player reaches melee range.
- Tooltip: "Press F when behind an enemy for a Silent Takedown."
- Takedown executes. Drone powers down silently.
- **Discovery banner:** "New Move: Silent Takedown — Instant kill from behind while crouching."

**5:30–7:00 — Gap & Dive Kick**
- A 6m gap is too wide for a normal jump. A drone hovers on the far side.
- Tooltip: "Press Q in mid-air to Air Dash."
- Player air dashes across. If they dash into the drone:
- **Discovery banner:** "New Move: Dive Kick — Air Dash into enemies for heavy knockback."

**7:00–8:30 — Weapon Discovery**
- A weapon crate glows yellow.
- Tooltip: "Hold E to open crates."
- Semi-Auto Pistol obtained.
- Tooltip: "Mouse1 to fire. R to reload. Scroll to switch weapons."
- Three target plates on a wall. Player shoots them.

**8:30–10:00 — Hub & Skill Tree**
- Player reaches the warehouse hub. A checkpoint beacon pulses blue.
- Tooltip: "Checkpoint reached. Progress saved."
- Mentor hologram activates.
- Dialogue: "That was close. You've got raw talent. Let's refine it."
- Tooltip: "Press Tab to open the Skill Tree."
- Player receives 1 free skill point. Skill tree opens automatically.
- Tooltip: "Spend points in Agility, Precision, or Survival."
- Portal to Training Ground becomes active.
- Tooltip: "Enter the glowing portal to practice new moves safely."

### 24.5 Combat Move Discovery

Every time the player performs a move for the first time, the game celebrates it:

1. **Freeze frame:** Game time slows to 0.1× for 0.3s on impact.
2. **Banner:** Top-center UI shows `NEW MOVE: [Name]` with the input sequence and a one-line description.
3. **Codex entry:** The move is added to the Move Codex (accessible from pause menu).
4. **Save flag:** `progress.discoveredMoves.push(moveId)`.

**Discovery list (sample):**
- Dive Kick, Slide Tackle, Wall-Kick Stun, Vault Strike, Ledge Takedown, Ceiling Drop, Rolling Thunder, Ground Pound, Backflip Kick, Shoulder Bash, Grapple Pull, Silent Takedown, Parry, Perfect Dodge, Panic Roll, Drone Hijack, EMP Burst.

**Codex UI:** Grid of move icons. Discovered = full color + stats. Undiscovered = silhouette + "???." Hover shows input sequence, damage, and a 3-second looping holographic demo.

### 24.6 Boss Preamble

Before every boss arena, a 10–15 second **holographic projection** plays. It cannot be skipped on the first encounter; on subsequent attempts, tap Space to skip.

| Boss | Preamble Content |
|------|------------------|
| **The Fabricator** | Hologram shows conveyor belts, welding arm sweep pattern, and a flashing red torch. Text: "The torch overheats after three swings. Strike then." |
| **The Warden** | Hologram shows prison towers, sniper positions, and a yellow back panel. Text: "Parry the baton. The back panel opens during overcharge." |
| **The Leviathan** | Hologram shows tentacle burst points, rising water, and a giant eye. Text: "The eye opens after every tentacle strike." |
| **The Swarm Queen** | Hologram shows egg clusters and a swelling abdomen. Text: "Destroy eggs in 5 seconds. The abdomen is vulnerable before she lays." |
| **The Architect** | Hologram shows shifting walls and a flickering projector. Text: "The real Architect casts a shadow. The projector flickers when he shifts the maze." |

**Implementation:** `js/BossPreamble.js` — a lightweight cinematic overlay that pauses physics, plays the hologram animation, then restores control. Skipped state is stored per boss in `progress.defeatedBosses`.

### 24.7 AssistMode Integration

`js/AssistMode.js` already modifies player physics, drone detection, and Rising Tide. Tutorial-specific extensions:

| Assist Setting | Tutorial Effect |
|----------------|-----------------|
| **Auto-vault** | Vault tutorial still plays, but the slow-time window is extended from 1s to 2s. Tooltip says "Assisted Vault active" instead of demanding precise timing. |
| **Extended coyote time** | Jump tutorial does not punish late inputs. The gap in minute 5 is widened by 0.5m so air dash is optional. |
| **Detection halving** | Stealth tutorial drones take 4× longer to detect (2× from Assist × 2× tutorial safety). Player can stand up and walk behind them. |
| **Reduced knockback** | Parry tutorial projectiles move 30% slower. |
| **Input hints** | AssistMode forces `settings.inputHints = true` and disables the "Don't show again" checkbox. |

**New AssistMode method:**

```javascript
getTutorialMultiplier() {
    return this._active ? 2.0 : 1.0;
}
```

Used by `TrainingGround.js` to widen parry/dodge demonstration windows and by `TooltipSystem.js` to extend display duration.

**Accessibility menu at game start:** Before the first 10-minute sequence, a one-time popup asks:
- "Would you like input hints and extended timing windows?" (Defaults to ON, maps to AssistMode.)
- "Would you like subtitles for all audio?" (Defaults to ON.)
- Choices are saved to `settings.assistMode` and `settings.subtitles` immediately.
## PHASE 25: RISK ASSESSMENT, DEPENDENCIES & MVP DELINEATION

### 25.1 Risk Register

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Scope creep** — 120 features balloon to 180+ as designers add "just one more" weapon/enemy | High | Critical | Hard MVP gate (see 25.3); any feature not on MVP list requires explicit stakeholder sign-off; Sprint 6 is buffer-only |
| **Performance collapse** — 10 enemy types + projectiles + status effects exceed 1.5 ms CPU/frame budget | Medium | Critical | Pooled projectiles from day one; enemy LOD culling at 30m; status effects batched per frame; profiler gate every Friday |
| **Input conflicts** — new combat inputs (aim, reload, melee, gadget) conflict with parkour inputs in edge states | High | High | Input combination test matrix (Phase 23.2); `InputManager` priority queue refactor; never override movement keys |
| **Animation quality gap** — 1700-line Player.js state machine cannot support 15+ attack animations without spaghetti | Medium | High | Procedural animation fallback (see 25.4); attack states use tweened bone rotations, not full anims; keep states < 50 lines each |
| **Balance nightmare** — 25 weapons × 10 enemies × 10 status effects = untestable permutation space | Medium | High | Automated TTK tracker; daily playtest lunch sessions; one dedicated "balance Friday" per sprint; no weapon changes in final 48h |
| **Save corruption** — SkillTree + Crafting + Shop progress lost on browser cache clear | Low | Critical | Dual save: `localStorage` + `IndexedDB` with JSON schema versioning; export/import plaintext backup; checksum validation on load |
| **Memory leaks** — arena start/stop cycles leak geometries/materials, crashing after 30 min | Medium | Critical | Mandatory `.dispose()` on every module (Phase 23.4); automated arena loop test in CI; heap snapshot diff gate |
| **Gamepad compatibility** — 25 weapons with scroll-wheel switching map poorly to 4 face buttons | Medium | Medium | D-pad weapon slots; hold LB + face button for quick-swap; test on Xbox, PlayStation, and generic DirectInput pads every sprint |
| **Browser WebGL limits** — post-processing chain + combat particle effects exceed mobile/low-end GPU memory | Medium | Medium | Configurable quality tiers: Low (no SAO, half-res particles), Medium (default), High (full chain); auto-detect via `renderer.capabilities.maxTextureSize` |
| **Team bandwidth** — 6 weeks, 15,000 lines, 55 files with only existing contributors | High | High | Ruthless MVP cuts if Sprint 1 overruns (see 25.4); no parallel feature work on same file; pair program on `Player.js` changes |

### 25.2 Cross-Phase Dependency Map

**Blocking Relationships:**

```
Phase 1 (HitboxSystem + DamageSystem)
  └─> Phase 2 (Parkour Melee) — needs hit registration
  └─> Phase 3 (Ranged) — needs projectile collision
  └─> Phase 4 (Defensive) — needs damage reduction + parry reflect
  └─> Phase 5 (Stealth) — needs silent takedown damage calc
  └─> Phase 6 (AOE/CC) — needs status effect hooks
  └─> Phase 7 (WeaponSystem) — needs damage types, ammo, firing
  └─> Phase 8 (Enemies) — needs takeDamage, health, death
  └─> Phase 9 (Bosses) — needs all enemy base + damage
  └─> Phase 10 (Progression) — needs enemy kills for XP
  └─> Phase 11 (Status Effects) — needs DamageSystem hooks
  └─> Phase 12 (Arenas) — needs enemies + weapons + status effects

Phase 7 (WeaponSystem)
  └─> Phase 3 (Ranged Defensive) — Zipline Gun, EMP Burst need weapon slots
  └─> Phase 10.2 (Crafting) — needs weapon dismantling
  └─> Phase 10.3 (Shop) — needs ammo types defined

Phase 8 (EnemyBase + EnemyManager)
  └─> Phase 9 (Bosses) — bosses extend EnemyBase
  └─> Phase 12 (Arenas) — wave spawning needs EnemyManager

Phase 11 (StatusEffectSystem)
  └─> Phase 6 (Elemental Interactions) — needs burn/freeze/shock/corrode defined
  └─> Phase 7.9 (Weapon Mods) — incendiary/shock rounds need status application

Phase 13 (File Architecture)
  └─> ALL phases — files must exist before features ship

Phase 14 (Sprint Planning)
  └─> ALL phases — determines delivery order
```

**Critical Path** (longest chain of dependent phases):
```
Phase 1 (Foundation) → Phase 7 (WeaponSystem) → Phase 8 (Enemies) → Phase 9 (Bosses) → Phase 10 (Progression) → Phase 12 (Arenas)
```
- This chain is **6 phases long** and represents the minimum viable combat loop
- Any delay in Phase 1 cascades to every downstream phase
- Phase 2–6, Phase 11 can be developed in parallel with Phase 7–9 once Phase 1 is solid

### 25.3 MVP vs Stretch Goal Delineation

**MVP — Must Ship (playable combat loop)**

A player must be able to: take damage, deal damage with at least one melee and one ranged option, fight at least 3 enemy types, defeat 1 boss, and enter an arena that spawns waves.

| Category | MVP Features |
|----------|-------------|
| **Melee** | Dive Kick, Slide Tackle, Ground Pound, Sprint Shoulder Bash |
| **Ranged** | Semi-Auto Pistol, Assault Rifle, Grenade Launcher |
| **Defensive** | Block, Parry, Panic Roll |
| **Stealth** | Silent Takedown |
| **AOE/CC** | Shockwave Clap, EMP Burst |
| **Weapons (5 of 25)** | Pipe Wrench, Semi-Auto Pistol, Assault Rifle, Shotgun, Sticky Bomb |
| **Gadgets (1 of 5)** | Sticky Bomb only |
| **Enemies (5 of 10)** | Brawler Drone, Shield Drone, Turret Drone, Suicide Drone, Sapper Drone |
| **Elites** | No elite variants in MVP |
| **Bosses (2 of 5)** | The Fabricator, The Warden |
| **Systems** | Player Health/Stamina, HitboxSystem, DamageSystem, WeaponSystem, ProjectileManager, EnemyManager, SkillTree (Agility branch only, first 5 skills) |
| **Progression** | Skill points from boss kills only; no crafting, no shop |
| **Arenas** | Wave Defense mode only, no modifiers |
| **Status Effects** | Burning, Frozen |
| **UI** | Health bar, stamina bar, weapon slots, ammo counter, crosshair, damage numbers |

**Stretch Tier 1 — Should Ship (significant value add)**

| Category | Tier 1 Features |
|----------|-----------------|
| **Melee** | Wall-Kick Stun, Vault Strike, Backflip Kick |
| **Ranged** | Plasma Pistol, Marksman Rifle, Rocket Launcher, Zipline Gun |
| **Defensive** | Perfect Dodge, Knockback Recovery, Drone Meat Shield |
| **Stealth** | Predator Vision, Distraction, Phantom Strike |
| **AOE/CC** | Chain Lightning, Freezer Burst, Oil Slick |
| **Weapons (15 of 25)** | All 5 melee, all 4 pistols, all 4 rifles, Shotgun, Rocket Launcher, Flamethrower |
| **Gadgets (3 of 5)** | Sticky Bomb, Smoke Grenade, Tesla Coil |
| **Enemies (10 of 10)** | All base types |
| **Elites** | Elite Brawler, Elite Shield, Elite Turret, Elite Suicide, Elite Sapper |
| **Bosses (4 of 5)** | + The Leviathan, The Swarm Queen |
| **Systems** | Full Skill Tree (3 branches, 45 skills), CraftingSystem, ShopSystem, StatusEffectSystem (all 10 effects) |
| **Progression** | Scrap economy, workbenches, shop terminals |
| **Arenas** | Boss Rush, Drone Gauntlet, Juggernaut, Stealth Only |
| **Weapon Mods** | Extended Mag, Fast Reload, Armor Piercing, Incendiary Rounds |

**Stretch Tier 2 — Could Ship (nice-to-haves)**

| Category | Tier 2 Features |
|----------|-----------------|
| **Melee** | Ledge Takedown, Ceiling Drop, Rolling Thunder |
| **Ranged** | Shuriken/Disk Throw, Drone Hijack, Explosive Barrel Kick, Steam Pipe Redirect, Mirror Laser Redirect, EMP Burst (if not MVP) |
| **Defensive** | Grapple Block, Decoy Afterimage, Platform Shield |
| **Stealth** | Body Hide, Light Toggle, Vent Assassination |
| **AOE/CC** | Collapse Trigger, Toxic Splash, Fan Blade Shred, Spinner Ride |
| **Weapons (25 of 25)** | All weapons including Minigun, all gadgets including Spring Pad, Decoy Hologram |
| **Gadgets (5 of 5)** | All gadgets |
| **Elites** | All 10 elite variants |
| **Bosses (5 of 5)** | + The Architect |
| **Arenas** | Mirror Match, Collateral, Speed Kill, Barehands, Ironman |
| **Arena Modifiers** | All 10 random modifiers |
| **Weapon Mods** | Shock Rounds, Scope, Suppressor; 3-mod slots |
| **Elemental Interactions** | All 4 combos (burn+freeze, shock+oil, corrode+shock, frozen+shock) |

### 25.4 Fallback Plans

**If Sprint 1 Overruns (Foundation not solid by end of Week 1):**
- Cut from MVP: Sprint Shoulder Bash, Stamina costs (stamina becomes infinite until Sprint 2)
- Move to Tier 1: Ground Pound AOE radius, Parry reflect damage multiplier
- Keep absolute minimum: `takeDamage`, `HitboxSystem`, `ATTACK_LIGHT`, `ATTACK_HEAVY`, `BLOCK`, Dive Kick, Slide Tackle
- Extend Sprint 1 by 2 days; absorb buffer from Sprint 6

**If Performance Budget Exceeded (CPU > 2.0 ms/frame or GPU > 4.0 ms/frame):**
| System | Simplification |
|--------|---------------|
| ProjectileManager | Reduce pool size from 500 to 200; disable bullet casings |
| EnemyManager | Cap active drones to 12 (from 20); despawn furthest elites first |
| StatusEffectSystem | Update only every 3rd frame (60 Hz → 20 Hz tick rate for DOTs) |
| HitboxSystem | Switch from OBB to AABB for all enemy hurtboxes |
| Post-processing | Disable MotionBlur and ChromaticAberration during combat arenas |
| Particles | Replace GPU particles with billboard sprites for explosions |

**If Animation Pipeline Fails (no time for 15+ attack anims in Player.js):**
- Fallback to **procedural-only animation**:
  - Light attack: torso twist + arm extension tween (200 ms)
  - Heavy attack: wind-up squat + lunge tween (400 ms)
  - Aerial attack: leg extension + spin tween (300 ms)
  - All using `THREE.MathUtils.lerp` on bone rotations; no keyframe data
- Visual polish deferred to Tier 2: impact freeze-frames, hit stop (0.05 s pause on contact)
- UI compensation: bigger screen shake, louder impact SFX, larger hit sparks to sell weight without anims

**If Save System Corrupts During Testing:**
- Immediate fallback: `localStorage` plaintext JSON with schema version `v1`
- Disable `IndexedDB` async path; synchronous save on every checkpoint
- Player loses progress only if they manually clear cache; acceptable for MVP
- Robust async dual-save restored in Tier 1

---
## PHASE 26: POST-LAUNCH ROADMAP & LIVE OPS

### 26.1 Season 1 Content (Month 1–2 Post-Launch)

**Month 1: Arena Expansion**
- **New Arena Mode: King of the Crane**
  - Rooftop control point that shifts every 45 s
  - Enemies assault from ziplines; player must defend while parkouring between crane arms
  - Reward: exclusive "Crane Operator" cosmetic skin
- **New Enemy Type: Sniper Drone**
  - 120 m range, laser sight visible 1 s before firing
  - Weakness: grapple to it while charging; falls when grappled
  - File: `js/enemies/SniperDrone.js` (~150 lines)
- **Balance Patch v1.1**
  - Reduce Assault Rifle TTK by 10% (damage 18 → 20)
  - Increase Shield Drone frontal damage reduction 100% → 90% (flanking still essential, but not binary)
  - Fix: Suicide Drone no longer explodes through walls

**Month 2: Weapon & Mod Drop**
- **New Weapon: Harpoon Gun**
  - Rifle slot; fires cable that impales enemy and pins to nearest surface
  - Damage: 35; pin duration: 4 s; recharge: 3 s
  - File: `js/weapons/HarpoonGun.js` (~80 lines)
- **New Weapon Mod: Ricochet Chip**
  - Projectiles bounce once; second hit deals 50% damage
  - Compatible with pistols and rifles only
- **Arena Modifier: Low Oxygen**
  - Timer drains 2 HP/s; kills reset timer by +10 s
  - Forces aggressive play; popular in hardcore community

### 26.2 Season 2 Content (Month 3–4)

**Month 3: Co-op Horde Mode**
- Architecture-ready from Phase 13 `EventBus`: extend for networked events
- **Scope:** Local co-op first (shared keyboard + gamepad, or 2 gamepads)
- Player 2 gets identical parkour kit but different color trail
- Shared health pool or independent? **Independent** (harder, more tactical)
- Enemy scaling: +50% drone count per player, elite spawn rate +25%
- New squad type: `CoOp_Pincer` — drones split to flank both players simultaneously
- File: `js/CoopHordeMode.js` (~400 lines); `js/InputManagerPlayer2.js` (~200 lines)

**Month 4: Boss & Editor Integration**
- **New Boss: The Warden (Hard Mode)**
  - Same arena, but Warden has 4 phases instead of 3
  - Phase 2.5: Warden hacks all turrets to target player; must EMP before advancing
- **LevelEditor Extension: Enemy Placement**
  - Add drone spawn nodes to editor palette (all 10 base types + elites)
  - Add arena trigger zones: walk into zone → start wave spawner
  - Export format: JSON with `spawners[]`, `waves[]`, `modifierList[]`
  - Community can build custom arenas and share `.arena.json` files

### 26.3 Analytics & Telemetry

**What to Track**

| Event | Payload | Decision Driver |
|-------|---------|-----------------|
| `weapon_fired` | `weaponId`, `ammoRemaining`, `playerPos` | Weapon usage distribution; underused weapons get buffed |
| `player_died` | `cause` (enemy type / hazard / self / boss), `pos`, `timeInRun` | Death heat map; unfair encounters identified |
| `skill_purchased` | `skillId`, `branch`, `tier`, `runNumber` | Skill tree balance; dead skills redesigned |
| `arena_started` | `mode`, `modifiers[]`, `difficulty` | Arena mode popularity; least played modes retired or reworked |
| `arena_completed` | `mode`, `wavesReached`, `time`, `score` | Difficulty curve tuning; reward thresholds |
| `boss_phase_reached` | `bossId`, `phase`, `timeInFight` | Boss difficulty spikes; phase 2 wall = design problem |
| `crafting_action` | `recipeId`, `scrapBefore`, `scrapAfter` | Economy health; scrap sinks / faucets |
| `shop_purchase` | `itemId`, `currency`, `price` | Shop item popularity; rotate stock accordingly |

**How to Track**
- Lightweight event log: ring buffer of 1000 events in memory, flush to `localStorage` every 30 s
- Aggregated dashboards: nightly batch script (`scripts/analytics-aggregate.js`) parses all player logs and outputs:
  - `dashboard/weapon-usage.csv`
  - `dashboard/death-heatmap.json`
  - `dashboard/skill-pick-rates.json`
- Privacy-first: no account linkage, no IP collection; pure local-first with optional manual export
- For online leaderboard: SHA-256 hash of `playerName + seed` as anonymous ID; server validates score submission with replay checksum

### 26.4 Community Features

**Leaderboard Seasons**
- 4-week competitive seasons
- Categories: fastest Boss Rush, highest Wave Defense wave, longest Barehands survival
- Top 100 per category gets seasonal title (e.g., "Season 1 Speed Demon")
- Anti-cheat: score submissions include `runHash` derived from input sequence + RNG seed; server recomputes to verify

**Weekly Modifier Rotations**
- Every Monday: global modifier set rotates for all arena runs
- Example week: `Glass Cannon` + `No Dash` + `Fog of War`
- Community votes on next week's modifiers via in-game poll ( strawpoll integration )
- Reward multiplier: +25% chips per modifier active

**Community Challenge Modes**
- Monthly curated challenge by dev team
- Example: "Shield Bash Only" — can only damage enemies with Shield Drone collision (lure them into each other)
- Global progress bar: community collective kill count unlocks cosmetic for all participants

### 26.5 Mod Support

**JSON Data Files**
- `data/weapons/` — one `.json` per weapon; schema mirrors `Weapon` constructor config
- `data/enemies/` — one `.json` per enemy type; defines HP, speed, vision range, loot table
- `data/arenas/` — one `.json` per arena; defines geometry references, spawner positions, wave tables, modifier whitelist
- Schema validation: `scripts/validate-mod-json.js` runs `ajv` against strict schemas
- Hot-reload: place `.json` in `mods/` folder; game detects on title screen and offers "Enable Mods" prompt

**LevelEditor Extensions**
- Enemy placement: drag-drop drone icons from palette into 3D view
- Arena trigger zones: draw box trigger, assign wave table reference
- Export → `mods/MyArena.arena.json`
- Share via copy-paste JSON or future Steam Workshop integration
- Safety: modded arenas disable leaderboard submissions; marked "Unranked"

### 26.6 Technical Debt Plan

**Month 1: Performance Audit & Optimization Pass**
- Target: reduce `Player physics + collision` from < 1 ms to < 0.7 ms
- Actions:
  - Replace `world.collidables[]` linear search with spatial hash grid (100 m³ buckets)
  - Batch `HitboxSystem.checkCollisions()` into broad phase (AABB sweep) + narrow phase (sphere exact)
  - Merge `DamageSystem` and `StatusEffectSystem` update loops to reduce iteration overhead
  - Audit all `new THREE.Vector3()` in hot paths; replace with pre-allocated scratch vectors
- Deliverable: `docs/perf-audit-month1.md` with before/after profiler screenshots

**Month 2: Module Refactoring**
- Target: no module > 1000 lines; `Player.js` currently ~1700 lines
- Actions:
  - Extract `js/player/CombatStateMachine.js` (~400 lines) from `Player.js`
  - Extract `js/player/StaminaManager.js` (~150 lines)
  - Extract `js/player/HealthManager.js` (~200 lines)
  - `Player.js` becomes thin facade importing sub-managers
  - Extract `js/arena/ArenaWaveSpawner.js` from `ArenaMode.js`
  - Extract `js/arena/ArenaModifierApplier.js` from `ArenaMode.js`
- Rule: no functional changes; pure code motion + existing test pass

**Ongoing: Balance Patches**
- Cadence: bi-weekly minor patches (number tweaks only), monthly major patches (new content)
- Process:
  1. Review analytics dashboard for outliers (weapon with < 2% usage, boss with > 80% death rate at phase 1)
  2. Propose change in `balance/proposal-YYYY-MM-DD.md`
  3. Internal playtest for 2 hours minimum
  4. Community PTR (public test realm) for 1 week via `beta` branch
  5. Merge to `main`, announce in patch notes
## PHASE 27: DATA-DRIVEN DESIGN & BALANCE LAYER

**Goal:** Eliminate hardcoded weapon, enemy, status effect, arena modifier, drop table, and skill tree definitions from JavaScript classes and replace them with hot-reloadable JSON configurations backed by a runtime data layer, factory pattern, and developer balance console.

**Deliverables:**
- `data/` directory with six schema-validated JSON files
- `js/DataLoader.js` singleton
- `js/DevConfigWatcher.js` for JSON hot-reload
- `js/CombatConfig.js` nested balance constants with dev console exposure
- `js/WeaponFactory.js` and `js/EnemyFactory.js`
- Migration table + 10-day step-by-step migration plan

---

### 27.1 JSON Config Architecture

All static game data lives in `data/` as flat JSON files. Each file is an object keyed by identifier. No arrays at the root level to allow fast lookup.

#### 27.1.1 File Inventory

| File | Purpose | Record Count (est.) |
|------|---------|---------------------|
| `data/weapons.json` | Firearms, melee, gadgets, and grapple variants | 20–40 |
| `data/enemies.json` | Standard drone archetypes and variants | 15–30 |
| `data/statusEffects.json` | DOTs, debuffs, buffs, crowd control | 10–20 |
| `data/arenaModifiers.json` | Mutators for challenge arenas (zero-g, fog, etc.) | 8–15 |
| `data/dropTables.json` | Loot pools grouped by enemy tier and rarity | 10–15 |
| `data/skillTree.json` | Nodes, prerequisites, costs, and unlock effects | 30–50 |

#### 27.1.2 Schema Requirements

Every record must contain:
- `$id` — matches the object key (enforced by loader)
- `$schemaVersion` — integer, starts at 1
- `displayName` — human-readable label
- `description` — tooltip / log text

Optional but recommended:
- `tags[]` — string array for filtering (e.g., `["firearm", "automatic", "midrange"]`)
- `icon` — UI asset path relative to `assets/ui/`

#### 27.1.3 Hot-Reload via `js/DevConfigWatcher.js`

`DevConfigWatcher` fetches JSON via `fetch()` on first load, then polls with `If-None-Match` (ETag) or a cache-busting timestamp every 2 seconds **only in non-production builds**.

```javascript
// js/DevConfigWatcher.js
export class DevConfigWatcher {
  constructor(dataLoader) {
    this.loader = dataLoader;
    this.intervalMs = 2000;
    this.timers = new Map(); // path -> timerId
    this.enabled = location.hostname === 'localhost' || location.search.includes('dev=1');
  }

  watch(path) {
    if (!this.enabled) return;
    const url = new URL(path, location.href);
    const poll = async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          this.loader.ingest(path, json);
        }
      } catch (e) {
        // Silently ignore; broken JSON is logged by loader
      }
    };
    this.timers.set(path, setInterval(poll, this.intervalMs));
  }

  unwatch(path) {
    const id = this.timers.get(path);
    if (id) { clearInterval(id); this.timers.delete(path); }
  }

  dispose() {
    this.timers.forEach(id => clearInterval(id));
    this.timers.clear();
  }
}
```

**Integration in `main.js`:**

```javascript
import { DataLoader } from './DataLoader.js';
import { DevConfigWatcher } from './DevConfigWatcher.js';

const dataLoader = new DataLoader();
const devWatcher = new DevConfigWatcher(dataLoader);

await dataLoader.loadBatch([
  'data/weapons.json',
  'data/enemies.json',
  'data/statusEffects.json',
  'data/arenaModifiers.json',
  'data/dropTables.json',
  'data/skillTree.json'
]);

devWatcher.watch('data/weapons.json');
// ... watch remaining files
```

---

### 27.2 Data Loader `js/DataLoader.js`

Singleton responsible for all JSON ingestion, caching, runtime overrides, and lightweight schema validation.

#### 27.2.1 API

| Method | Signature | Behavior |
|--------|-----------|----------|
| `loadBatch(paths)` | `async loadBatch(paths)` | Fetches all files in parallel via `Promise.all`. Rejects on first fetch or parse failure unless `options.faultTolerant` is true. |
| `ingest(path, json)` | `ingest(path, json)` | Replaces or merges a table. Called by `DevConfigWatcher` on hot-reload. |
| `get(table, id)` | `get(table, id) → object \| null` | Returns a **deep-cloned** record to prevent accidental mutation of source data. |
| `getAll(table)` | `getAll(table) → object` | Returns entire table object keyed by `$id`. Also cloned. |
| `getByTag(table, tag)` | `getByTag(table, tag) → object[]` | Filters records where `tags` includes `tag`. |
| `override(table, id, patch)` | `override(table, id, patch)` | Applies a shallow patch to a cached record. Overrides survive hot-reloads (applied after re-ingest). |
| `clearOverride(table, id)` | `clearOverride(table, id)` | Removes a runtime override. |
| `validate(table, schemaFn)` | `validate(table, schemaFn) → string[]` | Runs every record through `schemaFn(record)` and returns array of failure messages. Empty array means pass. |

#### 27.2.2 Internal Structure

```javascript
// js/DataLoader.js
export class DataLoader {
  constructor() {
    this.tables = new Map();      // path → parsed JSON object
    this.overrides = new Map();   // "table/id" → patch object
  }

  async loadBatch(paths, options = {}) {
    const results = await Promise.all(
      paths.map(p => fetch(p).then(r => r.json()).catch(err => {
        if (options.faultTolerant) return null;
        throw new Error(`DataLoader failed on ${p}: ${err.message}`);
      }))
    );
    paths.forEach((p, i) => { if (results[i] !== null) this.ingest(p, results[i]); });
  }

  ingest(path, json) {
    const tableName = path.split('/').pop().replace('.json', '');
    // Validate root-key / $id alignment
    for (const [key, record] of Object.entries(json)) {
      if (record.$id && record.$id !== key) {
        console.warn(`DataLoader: $id mismatch in ${path}: ${record.$id} !== ${key}`);
      }
    }
    this.tables.set(tableName, structuredClone(json));
    this._applyOverrides(tableName);
  }

  get(table, id) {
    const t = this.tables.get(table);
    return t && t[id] ? structuredClone(t[id]) : null;
  }

  getAll(table) {
    const t = this.tables.get(table);
    return t ? structuredClone(t) : null;
  }

  getByTag(table, tag) {
    const t = this.tables.get(table);
    if (!t) return [];
    return Object.values(t).filter(r => Array.isArray(r.tags) && r.tags.includes(tag));
  }

  override(table, id, patch) {
    this.overrides.set(`${table}/${id}`, { ...this.overrides.get(`${table}/${id}`), ...patch });
    this._applyOverrides(table);
  }

  clearOverride(table, id) {
    this.overrides.delete(`${table}/${id}`);
    this._applyOverrides(table);
  }

  _applyOverrides(table) {
    const t = this.tables.get(table);
    if (!t) return;
    for (const [key, record] of Object.entries(t)) {
      const patch = this.overrides.get(`${table}/${key}`);
      if (patch) Object.assign(record, patch);
    }
  }

  validate(table, schemaFn) {
    const t = this.tables.get(table);
    if (!t) return [`Table ${table} not found`];
    const errors = [];
    for (const [key, record] of Object.entries(t)) {
      const err = schemaFn(record);
      if (err) errors.push(`${table}/${key}: ${err}`);
    }
    return errors;
  }
}
```

#### 27.2.3 Singleton Export

```javascript
// js/DataLoader.js (append to file)
export const data = new DataLoader();
```

All modules import `data` directly. No constructor arguments required.

---

### 27.3 Class Factory Pattern

#### 27.3.1 Philosophy: What Stays Code vs. Becomes Data

| Stays as Class | Becomes Pure Data | Rationale |
|----------------|-------------------|-----------|
| Boss AI state machines (`BossFight.js`) | Weapon stat blocks | Bosses have bespoke phases, cinematic triggers, and arena geometry coupling |
| Complex pathfinding / navmesh agents | Enemy stat blocks (health, speed, damage, resistances) | Simple drones are stat bundles + behavior tree reference |
| Player movement state machine (`Player.js`) | Status effect definitions (damage, duration, tick rate, stacking rules) | Status effects are math + timers |
| Grapple physics simulation | Arena modifier definitions | Modifiers are scalar overrides and flag toggles |
| Procedural audio synthesis (`AudioManager.js`) | Drop table weights and rarity pools | Loot is probability tables |
| Post-processing chain | Skill tree nodes (cost, prerequisites, flat bonuses) | Skill nodes are additive stat patches |

#### 27.3.2 `WeaponFactory`

```javascript
// js/WeaponFactory.js
import { data } from './DataLoader.js';
import { AssaultRifle } from './weapons/AssaultRifle.js';   // thin behavior class
import { PlasmaRifle } from './weapons/PlasmaRifle.js';
import { Stun Baton } from './weapons/StunBaton.js';

const BEHAVIOR_MAP = {
  'ballistic_auto': AssaultRifle,
  'energy_auto': PlasmaRifle,
  'melee_light': StunBaton,
  // ... extend as new archetypes are introduced
};

export class WeaponFactory {
  static create(id) {
    const def = data.get('weapons', id);
    if (!def) { console.error(`WeaponFactory: unknown weapon "${id}"`); return null; }

    const BehaviorClass = BEHAVIOR_MAP[def.behaviorKey];
    if (!BehaviorClass) { console.error(`WeaponFactory: unknown behaviorKey "${def.behaviorKey}"`); return null; }

    return new BehaviorClass(def);
  }
}
```

Weapon behavior classes accept a definition object in their constructor and read stats from it. No hardcoded DPS, range, or magazine size.

#### 27.3.3 `EnemyFactory`

```javascript
// js/EnemyFactory.js
import { data } from './DataLoader.js';
import { Drone } from './Drone.js';
import { BrawlerDrone } from './BrawlerDrone.js';
import { SniperDrone } from './SniperDrone.js';

const ARCHETYPE_MAP = {
  'scout': Drone,
  'brawler': BrawlerDrone,
  'sniper': SniperDrone,
};

export class EnemyFactory {
  static create(type, isElite = false) {
    const def = data.get('enemies', type);
    if (!def) { console.error(`EnemyFactory: unknown enemy "${type}"`); return null; }

    const ArchetypeClass = ARCHETYPE_MAP[def.archetypeKey];
    if (!ArchetypeClass) { console.error(`EnemyFactory: unknown archetypeKey "${def.archetypeKey}"`); return null; }

    const instance = new ArchetypeClass(def);

    if (isElite) {
      const eliteDef = data.get('arenaModifiers', 'elite_global'); // optional global elite scaling
      instance.applyEliteModifiers(eliteDef || { healthMultiplier: 2.5, damageMultiplier: 1.5 });
    }

    return instance;
  }
}
```

#### 27.3.4 Factory Registration for Modding

Both factories expose a static `register(key, Class)` method so future modules or mods can inject new behavior keys without editing the factory source:

```javascript
static register(key, Class) {
  BEHAVIOR_MAP[key] = Class; // or ARCHETYPE_MAP
}
```

---

### 27.4 Balance Constants `js/CombatConfig.js`

A single nested constants object exposed on `window` for real-time tuning. All combat-adjacent systems import from this module instead of using inline magic numbers.

#### 27.4.1 Structure

```javascript
// js/CombatConfig.js
export const combatConfig = {
  player: {
    healthMultiplier: 1.0,
    staminaRegenPerSecond: 25.0,
    staminaCostSprint: 10.0,
    staminaCostDodge: 35.0,
    staminaCostMelee: 15.0,
    iframeDuration: 0.25,
    knockbackResistance: 0.0, // 0–1 scalar
  },

  damage: {
    headshotMultiplier: 2.0,
    backstabMultiplier: 1.5,
    fallDamageThreshold: 8.0, // velocity in m/s
    fallDamageMultiplier: 5.0,
    environmentalDamageMultiplier: 1.0,
  },

  stamina: {
    baseMax: 100.0,
    regenDelayAfterSpend: 0.75, // seconds
    exhaustionPenalty: 0.5,     // move speed multiplier at 0 stamina
  },

  ai: {
    globalAggroRadius: 35.0,
    deaggroTime: 5.0,
    aimLeadFactor: 0.6,
    flinchDuration: 0.3,
    eliteHealthMultiplier: 2.5,
    eliteDamageMultiplier: 1.5,
    eliteSpeedMultiplier: 1.2,
  },

  statusEffects: {
    maxStacks: 5,
    tickRate: 0.5, // seconds between DOT ticks
    burnSpreadRadius: 3.0,
    freezeSlowMultiplier: 0.4,
    shockStunDuration: 1.2,
  },

  economy: {
    chipBaseDropChance: 0.15,
    chipEliteBonusChance: 0.25,
    scrapPerDrone: 5,
    scrapMultiplier: 1.0,
  },
};

// Freeze after first import to catch typos in dev
if (typeof Object.freeze === 'function') {
  Object.freeze(combatConfig.player);
  Object.freeze(combatConfig.damage);
  Object.freeze(combatConfig.stamina);
  Object.freeze(combatConfig.ai);
  Object.freeze(combatConfig.statusEffects);
  Object.freeze(combatConfig.economy);
  Object.freeze(combatConfig);
}

// Expose for console override
if (typeof window !== 'undefined') {
  window.combatConfig = combatConfig;
}
```

#### 27.4.2 Dev Console Override

Because the object is frozen shallowly but nested objects remain mutable references in most engines, the developer can open the browser console and type:

```javascript
window.combatConfig.player.healthMultiplier = 2.0;
window.combatConfig.ai.globalAggroRadius = 60.0;
window.combatConfig.statusEffects.tickRate = 0.25;
```

All systems reading `combatConfig` will pick up the new value on the next frame. **No reload required.**

#### 27.4.3 Runtime Override Persistence (Optional)

For QA sessions, overrides can be snapshotted to `sessionStorage`:

```javascript
window.saveCombatConfig = () => sessionStorage.setItem('combatConfigOverrides', JSON.stringify(combatConfig));
window.loadCombatConfig = () => {
  const o = JSON.parse(sessionStorage.getItem('combatConfigOverrides') || '{}');
  Object.keys(o).forEach(k => Object.assign(combatConfig[k], o[k]));
};
```

---

### 27.5 Example JSON Snippets

#### 27.5.1 Weapon — Assault Rifle

```json
{
  "$id": "assault_rifle_mk1",
  "$schemaVersion": 1,
  "displayName": "AR-MK1 Assault Rifle",
  "description": "Reliable mid-range automatic firearm. Moderate recoil, high rate of fire.",
  "tags": ["firearm", "automatic", "midrange", "ballistic"],
  "icon": "ui/icons/ar_mk1.png",
  "behaviorKey": "ballistic_auto",
  "slot": "primary",
  "stats": {
    "damagePerShot": 12,
    "fireRate": 600,
    "reloadTime": 1.8,
    "magazineSize": 30,
    "range": 45.0,
    "spreadMin": 0.02,
    "spreadMax": 0.12,
    "spreadRecovery": 0.08,
    "projectileSpeed": 120.0,
    "headshotEnabled": true,
    "armorPenetration": 0.0
  },
  "ammoType": "ballistic_medium",
  "sounds": {
    "fire": "sfx_ar_fire",
    "reload": "sfx_ar_reload",
    "empty": "sfx_empty_click"
  },
  "muzzleFlash": "fx_muzzle_orange",
  "projectileModel": "proj_tracer_yellow"
}
```

#### 27.5.2 Enemy — Brawler Drone

```json
{
  "$id": "drone_brawler",
  "$schemaVersion": 1,
  "displayName": "Brawler Drone",
  "description": "Close-quarters assault unit. Charges the player and attempts melee strikes.",
  "tags": ["drone", "melee", "aggressive"],
  "archetypeKey": "brawler",
  "stats": {
    "health": 80,
    "armor": 5,
    "moveSpeed": 6.5,
    "turnSpeed": 3.0,
    "attackDamage": 22,
    "attackCooldown": 1.2,
    "attackRange": 2.5,
    "chargeSpeed": 12.0,
    "chargeCooldown": 6.0,
    "perceptionRadius": 25.0,
    "flinchThreshold": 15
  },
  "resistances": {
    "ballistic": 0.0,
    "energy": 0.25,
    "explosive": -0.15,
    "melee": 0.15
  },
  "ai": {
    "behaviorTree": "bt_brawler_charge",
    "aggression": 0.9,
    "groupCoordination": false,
    "retreatHealthPercent": 0.0
  },
  "loot": {
    "dropTable": "drone_standard",
    "guaranteedScrap": 3
  },
  "visual": {
    "mesh": "models/drones/brawler.glb",
    "emissiveColor": "#ff4400",
    "scale": 1.1
  }
}
```

#### 27.5.3 Status Effect — Burning

```json
{
  "$id": "status_burning",
  "$schemaVersion": 1,
  "displayName": "Burning",
  "description": "Sustained fire damage. Can spread to nearby flammable targets.",
  "tags": ["dot", "fire", "debuff"],
  "category": "damage_over_time",
  "stackingRule": "refresh_duration", // options: none, refresh_duration, independent, capped
  "maxStacks": 3,
  "duration": 5.0,
  "tickRate": 0.5,
  "tickDamage": 4,
  "damageType": "fire",
  "effects": {
    "moveSpeedMultiplier": 0.95,
    "spreadOnTick": true,
    "spreadRadius": 3.0,
    "spreadChance": 0.3,
    "visual": "fx_fire_overlay",
    "audio": "sfx_burn_loop"
  },
  "removalConditions": {
    "waterImmersion": true,
    "extinguisherItem": "item_fire_extinguisher"
  }
}
```

#### 27.5.4 Drop Table — Elite Drone

```json
{
  "$id": "elite_drone",
  "$schemaVersion": 1,
  "displayName": "Elite Drone Drop Table",
  "description": "High-value loot pool for elite drone takedowns.",
  "entries": [
    { "itemId": "chip_common", "weight": 40, "minQuantity": 1, "maxQuantity": 3 },
    { "itemId": "chip_uncommon", "weight": 30, "minQuantity": 1, "maxQuantity": 2 },
    { "itemId": "chip_rare", "weight": 15, "minQuantity": 1, "maxQuantity": 1 },
    { "itemId": "scrap_metal", "weight": 60, "minQuantity": 5, "maxQuantity": 10 },
    { "itemId": "weapon_mod_thermal", "weight": 8, "minQuantity": 1, "maxQuantity": 1 },
    { "itemId": "weapon_mod_extended_mag", "weight": 8, "minQuantity": 1, "maxQuantity": 1 },
    { "itemId": "gadget_repair_nanites", "weight": 12, "minQuantity": 1, "maxQuantity": 2 },
    { "itemId": "rare_material_core", "weight": 3, "minQuantity": 1, "maxQuantity": 1 }
  ],
  "rolls": 2,
  "guaranteed": [
    { "itemId": "scrap_metal", "quantity": 5 }
  ],
  "rarityBonus": {
    "luckMultiplierField": "economy.chipEliteBonusChance"
  }
}
```

---

### 27.6 Migration Strategy

#### 27.6.1 Data vs. Code Migration Table

| Current Hardcoded Location | New Home | Migration Complexity |
|----------------------------|----------|----------------------|
| Inline weapon stats in `AssaultRifle.js`, `PlasmaRifle.js`, etc. | `data/weapons.json` + `WeaponFactory` | Low — stats move to JSON, classes shrink to behavior |
| `Drone.js` constructor health / speed constants | `data/enemies.json` + `EnemyFactory` | Low — constructor reads `def.stats` |
| `BossFight.js` phase thresholds | **Stays code** | N/A — boss phases are bespoke |
| Burning DOT logic in `StatusEffectManager.js` | `data/statusEffects.json` + generic `StatusEffect` class | Medium — refactor DOT tick engine to read from data |
| Arena fog / zero-g toggles in `ChallengeSystem.js` | `data/arenaModifiers.json` | Low — replace switch/case with data lookup |
| Chip drop rates in `Collectibles.js` | `data/dropTables.json` | Medium — replace inline math with table resolver |
| Grapple cooldown / range in `ChainGrappleRelays.js` | `data/weapons.json` (grapple entry) | Low — read `def.stats` |
| Skill costs in `SkillTreeUI.js` | `data/skillTree.json` | Medium — UI must query `DataLoader` instead of constants |
| Combo multipliers in `ComboSystem.js` | `js/CombatConfig.js` | Low — replace literals with `combatConfig` references |
| Stamina costs scattered in `Player.js` | `js/CombatConfig.js` | Low — global search-and-replace to `combatConfig.player.*` |
| AI aggro radius in `Drone.js` | `js/CombatConfig.js` | Low — one constant, many references |

#### 27.6.2 10-Day Step-by-Step Migration Plan

| Day | Task | Files Touched | Validation |
|-----|------|-------------|------------|
| **1** | Scaffold `data/` directory and populate `weapons.json` with 3 existing weapons (`assault_rifle_mk1`, `plasma_rifle_mk1`, `stun_baton_mk1`). Write `js/DataLoader.js` and `js/DevConfigWatcher.js`. | `data/weapons.json`, `js/DataLoader.js`, `js/DevConfigWatcher.js` | `node -c` on new JS. JSON parses in browser console. |
| **2** | Write `js/WeaponFactory.js`. Refactor `AssaultRifle.js`, `PlasmaRifle.js`, `StunBaton.js` to accept a `def` object. Replace `new AssaultRifle()` calls in `main.js` / spawners with `WeaponFactory.create('assault_rifle_mk1')`. | `js/WeaponFactory.js`, `js/weapons/*.js`, `js/main.js` | Weapons fire, reload, and deal correct damage. |
| **3** | Populate `data/enemies.json` with `drone_scout` and `drone_brawler`. Write `js/EnemyFactory.js`. Refactor `Drone.js` and `BrawlerDrone.js` constructors to read from `def`. Replace direct instantiation in spawners. | `data/enemies.json`, `js/EnemyFactory.js`, `js/Drone.js`, `js/BrawlerDrone.js` | Drones spawn, move, and attack with correct stats. |
| **4** | Extract all stamina and health constants from `Player.js` into `js/CombatConfig.js`. Replace inline values with `combatConfig.player.*` and `combatConfig.stamina.*`. Expose on `window`. | `js/CombatConfig.js`, `js/Player.js` | Console override changes player health regen in real time. |
| **5** | Extract damage formula constants (headshot, backstab, fall damage) into `js/CombatConfig.js`. Refactor damage application in `BulletTime.js` / hit detection to use `combatConfig.damage.*`. | `js/CombatConfig.js`, `js/BulletTime.js`, hit detection modules | Headshots deal 2x (or overridden multiplier). |
| **6** | Populate `data/statusEffects.json` with `status_burning`, `status_frozen`, `status_shocked`. Refactor `StatusEffectManager.js` to construct effects from data. Generic `StatusEffect` class handles DOT ticks, stacking, and removal. | `data/statusEffects.json`, `js/StatusEffectManager.js`, `js/StatusEffect.js` | Burning ticks, spreads, and extinguishes correctly. |
| **7** | Populate `data/arenaModifiers.json`. Refactor `ChallengeSystem.js` to apply modifiers by reading `data.get('arenaModifiers', id)` instead of hardcoded switch blocks. | `data/arenaModifiers.json`, `js/ChallengeSystem.js` | Zero-g and fog mutators load from JSON. |
| **8** | Populate `data/dropTables.json`. Write `js/DropTableResolver.js` (weighted roll engine). Refactor `Collectibles.js` to use resolver. Add `data/skillTree.json` and update `SkillTreeUI.js` to query `DataLoader`. | `data/dropTables.json`, `data/skillTree.json`, `js/DropTableResolver.js`, `js/Collectibles.js`, `js/SkillTreeUI.js` | Elite drones drop correct loot. Skill costs update from JSON. |
| **9** | Full integration pass. Enable `DevConfigWatcher` on all six tables. Test hot-reload: edit JSON, save, verify in-game change within 2 seconds without refresh. Run `DataLoader.validate()` on every table with schema functions. | All `data/*.json`, `js/DevConfigWatcher.js` | Hot-reload works for weapons and enemies. Validation reports zero errors. |
| **10** | Cleanup and regression testing. Remove dead constants from old classes. Verify `node -c` on all modified `.js` files. Test keyboard + mouse and gamepad. Run performance check: ensure factory creation + data clone does not exceed 0.1ms per spawn. | Entire `js/` and `data/` trees | All checklist items from `AGENTS.md` pass. |

#### 27.6.3 Rollback Plan

If a migration step breaks gameplay:
1. Revert the factory call to the previous direct `new` instantiation.
2. Keep the JSON file in place — the old class can still accept an optional `def` parameter as a fallback.
3. Fix forward in the next session rather than mid-day patching.

---

---

## APPENDIX: COMPLETE COMBAT MECHANICS CHECKLIST

### Melee (10)
- [ ] Dive Kick
- [ ] Slide Tackle
- [ ] Wall-Kick Stun
- [ ] Vault Strike
- [ ] Ledge Takedown
- [ ] Ceiling Drop
- [ ] Rolling Thunder
- [ ] Ground Pound
- [ ] Backflip Kick
- [ ] Sprint Shoulder Bash

### Ranged (8)
- [ ] Grapple Pull/Slingshot
- [ ] Shuriken/Disk Throw
- [ ] Drone Hijack
- [ ] Explosive Barrel Kick
- [ ] Steam Pipe Redirect
- [ ] Mirror Laser Redirect
- [ ] Zipline Gun
- [ ] EMP Burst

### Defensive (8)
- [ ] Parry
- [ ] Perfect Dodge
- [ ] Grapple Block
- [ ] Decoy Afterimage
- [ ] Panic Roll
- [ ] Knockback Recovery
- [ ] Drone Meat Shield
- [ ] Platform Shield

### Stealth (7)
- [ ] Predator Vision
- [ ] Silent Takedown
- [ ] Body Hide
- [ ] Distraction
- [ ] Light Toggle
- [ ] Vent Assassination
- [ ] Phantom Strike

### AOE / CC (8)
- [ ] Shockwave Clap
- [ ] Chain Lightning
- [ ] Oil Slick
- [ ] Collapse Trigger
- [ ] Freezer Burst
- [ ] Toxic Splash
- [ ] Fan Blade Shred
- [ ] Spinner Ride

### Weapons — Melee (5)
- [ ] Pipe Wrench
- [ ] Shock Baton
- [ ] Sledgehammer
- [ ] Energy Blade
- [ ] Chain Whip

### Weapons — Pistols (5)
- [ ] Semi-Auto Pistol
- [ ] Burst Pistol
- [ ] Plasma Pistol
- [ ] Grapple Pistol
- [ ] Silenced Pistol

### Weapons — Rifles (4)
- [ ] Assault Rifle
- [ ] Marksman Rifle
- [ ] Plasma Rifle
- [ ] Cryo Rifle

### Weapons — Heavy (5)
- [ ] Shotgun
- [ ] Grenade Launcher
- [ ] Rocket Launcher
- [ ] Minigun
- [ ] Flamethrower

### Weapons — Gadgets (5)
- [ ] Sticky Bomb
- [ ] Decoy Hologram
- [ ] Smoke Grenade
- [ ] Tesla Coil
- [ ] Spring Pad

### Enemies — New Types (10)
- [ ] Brawler Drone
- [ ] Shield Drone
- [ ] Turret Drone
- [ ] Suicide Drone
- [ ] Sapper Drone
- [ ] Jammer Drone
- [ ] Medic Drone
- [ ] Phantom Drone
- [ ] Command Drone
- [ ] Minelayer Drone

### Bosses — New (5)
- [ ] The Fabricator
- [ ] The Warden
- [ ] The Leviathan
- [ ] The Swarm Queen
- [ ] The Architect

### Systems (12)
- [ ] Player Health/Stamina
- [ ] Hitbox System
- [ ] Damage System
- [ ] Weapon System
- [ ] Projectile Manager
- [ ] Enemy Manager
- [ ] Status Effects
- [ ] Skill Tree
- [ ] Crafting
- [ ] Shop
- [ ] Arena Modes
- [ ] Elemental Interactions

**TOTAL: ~120 new combat features**
