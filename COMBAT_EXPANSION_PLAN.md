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

**State transition rules:**
- Any attack can be canceled into dash (Q) or jump
- Block can be held indefinitely but drains stamina
- Parry window is 0.2s at start of block
- Aerial attacks only from JUMP/FALL/WALLRUN states

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

### Weapons — Pistols (4)
- [ ] Semi-Auto Pistol
- [ ] Burst Pistol
- [ ] Plasma Pistol
- [ ] Grapple Pistol

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
