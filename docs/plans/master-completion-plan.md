# Master Completion Plan — Apex Rift Release Blockers

**Date:** 2026-04-27  
**Scope:** All remaining incomplete work across P1 (bugs), P2 (combat expansion), P3 (RPG wiring), P4 (vertical ARPG vision).

---

## PART A: P1 — Immediate Release Blockers (Known Debt)

These are file-by-file defects that break or nullify existing features.

### A1. `js/LootSystem.js` — `update()` ignores `player._lootPickupRadius`

**Defect:** `LegendaryPowerSystem` sets `player._lootPickupRadius` when `loot_beacon` legendary power is equipped, but `LootSystem.update()` hard-codes `1.0`m for health globes and `1.5`m for scrap/chips.

**Fix:** Read `player._lootPickupRadius || 0` and add it to all proximity checks.

**Verification:** Equip `loot_beacon` power → drop scrap near player at 2.5m → should auto-pickup.

---

### A2. `js/DroneAI.js` — Melee damage bypasses `DamageSystem.applyDamage()`

**Defect:** Lines 220 and 242 call `target.takeDamage(10, 'kinetic', this)` directly. This skips dodge chance, crit calculations, damage-type modifiers, and status effects.

**Fix:** Pass `DamageSystem` into `DroneAI` constructor. Route both player-facing and hacked-drone melee through `damageSystem.applyDamage(source, target, baseAmount, type)`.

**Verification:** Player with +dodge gear should see occasional "DODGED" floating text when drone attacks.

---

### A3. `js/main.js` — `firewall` skill is a no-op

**Defect:** `player._firewallActive = true` for 4s, but no drone has projectile attacks. Skill does literally nothing.

**Fix:** Add secondary effect: while active, melee attackers take 15 electric damage feedback. Wire into `DroneAI.js` melee block.

**Verification:** Cast `firewall` → drone melee attacks → drone takes 15 electric damage feedback.

---

### A4. `js/Player.js` + `js/LegendaryPowerSystem.js` — No parry mechanic exists

**Defect:** `onPerfectParry()` exists in `LegendaryPowerSystem` but has no trigger path.

**Fix:** Add `PARRY` state to Player.js. Input: tap `KeyF` while grounded. 0.2s window. If drone melee hits during window, block damage and call `legendaryPowerSystem.onPerfectParry()`.

**Verification:** Tap F just before drone hits → "PARRY" text flash + Aegis Field shield if legendary equipped.

---

### A5. `js/AssistMode.js` — Binary toggle, settings panel needs granular flags

**Defect:** Settings panel jump/grapple/aim checkboxes all call `assistMode.toggle()`. No per-feature control.

**Fix:** Add boolean flags: `_jumpAssist`, `_grappleAssist`, `_aimAssist`. Split the `modifyPlayer()` logic so each flag controls only its subsystem.

**Verification:** Toggle only Jump Assist → golden border appears but grapple/aim remain unassisted.

---

## PART B: P2 — Combat Expansion Plan Gaps

### B1. `js/StaminaSystem.js` — NEW FILE (~250 lines)

**Blocker for:** All attack states, blocking, parrying.

**Requirements:**
- `stamina` (100 max), regenerates 20/s grounded, 10/s airborne
- Costs: Sprint 5/s, Air Dash 15, Block 10/s, Light Attack 10, Heavy Attack 25, Parry 5, Grapple 10
- Bar UI in `#ui` panel (horizontal bar above health)
- `canSpend(amount)` / `spend(amount)` API
- Integration: Player.js checks stamina before sprint/dash/attacks

---

### B2. `js/CombatSystem.js` — NEW FILE (~600 lines)

**Blocker for:** All melee combat feel, combo system, attack cancelling.

**Requirements:**
- Attack state machine: `ATTACK_LIGHT` (0.3s), `ATTACK_HEAVY` (0.6s), `ATTACK_AERIAL`, `BLOCK`, `PARRY`
- Combo routing: Light → Light → Heavy finisher
- Input buffering: store inputs up to 0.15s before animation ends
- Hit registration: creates `Hitbox` instances via `HitboxSystem`
- Camera shake on heavy hits, 0.05–0.15s hit-stop
- Animation events: `attackStart`, `attackActive`, `attackEnd`
- Integration: called from `main.js` update loop

---

### B3. Parkour-Integrated Melee (8 mechanics) — Modifications to `js/Player.js`

| Mechanic | Input | File |
|----------|-------|------|
| Slide Tackle | Slide (C) into grounded enemy | `Player.js` `updateSlide()` |
| Wall-Kick Stun | Wallrun → jump off into enemy | `Player.js` `startWallRun()` |
| Vault Strike | Vault over enemy | `Player.js` `startVault()` |
| Ledge Takedown | Hang + E when enemy passes | `Player.js` `updateHang()` |
| Ceiling Drop | Magnet boots ceiling → Space | `Player.js` (new state) |
| Rolling Thunder | Roll (C mid-air) through enemies | `Player.js` `updateRoll()` |
| Backflip Kick | Jump + S + Space | `Player.js` `startJump()` |
| Sprint Shoulder Bash | Sprint + F (no wall) | `Player.js` `updateGrounded()` |

---

### B4. Ranged & Projectile Mechanics (7) — Modifications + `js/ProjectileManager.js`

| Mechanic | Status | Action |
|----------|--------|--------|
| Grapple Pull | Missing | Extend `GrapplingHook.js` with enemy targeting |
| Disk Throw | Missing | Add to `ProjectileManager.js` (ricochet) |
| Drone Hijack | Missing | Extend `DroneTakedown.js` + camera switch |
| Barrel Kick | Missing | `InteractiveEnvironment.js` add explosive barrel type |
| Steam Pipe | Missing | `InteractiveEnvironment.js` add pipe type |
| Mirror Laser | Missing | `Hazards.js` + interactible mirror |
| Zipline Gun | Missing | NEW `js/ZiplineGun.js` |
| EMP Burst | ✅ | Already implemented as `emp_pulse` |

---

### B5. Defensive Mechanics (8) — New + Modified Files

| Mechanic | File | Work |
|----------|------|------|
| Parry | `Player.js` | 0.2s window, reflect projectile (when projectiles exist) |
| Perfect Dodge | `Player.js` + `HitboxSystem` | Dash through attack = 2s slow-mo counter |
| Grapple Block | `GrapplingHook.js` | Cable intercepts missile |
| Decoy Afterimage | `main.js` | Flow max + Shift+Q = hologram clone |
| Panic Roll | `Player.js` | C right as attack hits = i-frames |
| Knockback Recovery | `Player.js` | Space while airborne from hit = flip |
| Drone Meat Shield | `GrapplingHook.js` | Grapple + hold E = absorb 50 dmg |
| Platform Shield | `Player.js` | Grab platform edge + E = mobile cover |

---

### B6. `js/StatusEffectSystem.js` — NEW FILE (~400 lines)

**Blocker for:** Elemental interactions, build depth.

**Requirements:**
- 10 status effects: Burning, Frozen, Shocked, Corroded, Blinded, Magnetized, Marked, Enraged, Weakened, Overclocked
- Elemental interactions: Burning+Frozen=Steam Cloud, Shocked+Oil=Fire Pool, etc.
- `applyEffect(target, effectId, duration, stacks)` / `removeEffect(target, effectId)`
- Integration: `DamageSystem.applyStatusEffect()` delegates to this

---

### B7. `js/EnemyBase.js` + `js/EnemyManager.js` — NEW FILES (~400 + ~700 lines)

**Blocker for:** Enemy variety, squad tactics.

**Requirements:**
- `EnemyBase` class with `update(dt, player)`, `takeDamage()`, `die()`, `getHitbox()`, `getVisionCone()`
- `EnemyManager.spawnEnemy(type, {isElite, position})`
- 10 enemy types with distinct behaviors and weaknesses
- Elite variants: red glow, 2× HP, strategy injection
- Squad compositions: Assault, Ambush, Siege, Sapper

---

### B8. 5 New Bosses — NEW FILES (~800 lines each)

| Boss | File |
|------|------|
| The Fabricator | `js/bosses/BossFabricator.js` |
| The Warden | `js/bosses/BossWarden.js` |
| The Leviathan | `js/bosses/BossLeviathan.js` |
| The Swarm Queen | `js/bosses/BossSwarmQueen.js` |
| The Architect | `js/bosses/BossArchitect.js` |

---

### B9. `js/WeaponSystem.js` + `js/weapons/` — NEW DIRECTORY (~30 files, ~2500 lines)

**Blocker for:** Ranged combat loop, ammo economy.

**Requirements:**
- `WeaponSystem` manager: 5 slots, switching, ammo tracking
- 5 melee weapons, 4 pistols, 4 rifles, 5 heavy weapons, 5 gadgets
- Weapon mods: Extended Mag, Fast Reload, Armor Piercing, Incendiary, Shock, Scope, Suppressor
- Ammo boxes, reserve caps, dropped weapon persistence

---

### B10. `js/ArenaMode.js` — NEW FILE (~500 lines)

**Blocker for:** Endgame variety.

**Requirements:**
- 10 arena modes: Wave Defense, Boss Rush, Drone Gauntlet, Juggernaut, Mirror Match, Collateral, Stealth Only, Speed Kill, Barehands, Ironman
- 10 random modifiers per run
- Mode selector UI in warehouse hub

---

## PART C: P3 — RPG Shell Wiring

Many files exist as data shells but are not integrated into `main.js` or gameplay.

| File | Size | Status | Action |
|------|------|--------|--------|
| `js/ProgressionSystem.js` | 5.4KB | Shell | Wire XP gain from kills, level-up callback |
| `js/OriginSystem.js` | 5.1KB | Shell | Character creation wiring, starter gear |
| `js/FamiliaritySystem.js` | 2.7KB | Shell | Weapon kill tracking, heirloom flag |
| `js/FactionSystem.js` | 6.0KB | Shell | Reputation UI, AI behavior hooks |
| `js/TerritorySystem.js` | 8.5KB | Shell | Sector HUD, liberation events |
| `js/NPCSystem.js` | 15KB | Shell | Schedule engine, dialogue branches |
| `js/CompanionDrone.js` | 13.4KB | Shell | AI modes, synergy hooks in main.js |
| `js/LoyaltySystem.js` | 6.2KB | Shell | Trust meter UI |
| `js/ConsequenceSystem.js` | — | **Missing** | Create file (~350 lines) |
| `js/CollapseMode.js` | 8.6KB | Shell | Roguelite floor generation |
| `js/NewGamePlus.js` | 4.2KB | Shell | Corruption modifier application |
| `js/SubLevelSystem.js` | 11KB | Shell | Procedural dungeon entrance |
| `js/ImplantSystem.js` | 7.1KB | Shell | Body mod UI, install/remove |
| `js/DebtSystem.js` | — | **Missing** | Create file (~300 lines) |
| `js/LegacySystem.js` | 5.1KB | Shell | Retirement flow, dynasty bonuses |
| `js/MasterySystem.js` | 6.9KB | Shell | Move XP tracking |
| `js/CodexSystem.js` | 9.6KB | Shell | Entry unlocks, gameplay effects |
| `js/SafehouseSystem.js` | 12.9KB | Shell | Upgrade tree, visual changes |
| `js/BountySystem.js` | 18.2KB | Shell | Contract generation, reward scaling |
| `js/RivalSystem.js` | 15.4KB | Shell | Spawning, races, duels |
| `js/BlackoutSystem.js` | 9.0KB | Shell | Event scheduling, NPC reactions |
| `js/ShopSystem.js` | ~? | Partial | Buy/sell terminals, random stock |

---

## PART D: P4 — Vertical ARPG Vision (Crimson Avenger Plan)

These are campaign and endgame features that depend on P2+P3 being complete.

| Feature | File(s) | Dependencies |
|---------|---------|-------------|
| 5-Act Campaign | `js/CampaignSystem.js` + act data | Boss roster, NPC system |
| Adventure Mode | `js/AdventureMode.js` | Campaign completion |
| Uber Bosses | `js/UberBossSystem.js` | Keywarden drops, crafting |
| The Director (hidden boss) | `js/bosses/BossDirector.js` | All 12 sectors liberated |
| True Ending (NG+3) | `js/TrueEnding.js` | NewGamePlus, Architect defeated |
| Dynasty / Hall of Legends | `js/LegacySystem.js` (extend) | 10 retirements |
| Heirloom Weapons | `js/FamiliaritySystem.js` (extend) | Familiarity 1000 |
| Corruption Modifiers | `js/NewGamePlus.js` (extend) | NG+ cycle tracking |
| Seasons Framework | `js/SeasonSystem.js` | Leaderboards, seasonal chars |
| Hardcore Mode | `js/HardcoreMode.js` | Character deletion on death |
| Leaderboards | `js/LeaderboardSystem.js` | Backend or localStorage |
| Clans / Player Factions | `js/ClanSystem.js` | Social features |

---

## Execution Priority

| Phase | Items | Est. Time | Impact |
|-------|-------|-----------|--------|
| **P1** | A1–A5 (5 bug fixes) | 2 hours | Fixes broken features |
| **P2-B1** | StaminaSystem | 2 hours | Unblocks attack states |
| **P2-B2** | CombatSystem | 6 hours | Core melee feel |
| **P2-B3** | 8 parkour melee | 4 hours | Movement = combat |
| **P2-A3** | Firewall fix | 15 min | Skill no longer no-op |
| **P2-B6** | StatusEffectSystem | 3 hours | Elemental depth |
| **P2-B7** | EnemyBase + 10 types | 8 hours | Enemy variety |
| **P2-B9** | WeaponSystem + weapons | 6 hours | Ranged combat |
| **P2-B8** | 5 new bosses | 10 hours | Boss roster |
| **P2-B10** | ArenaMode | 4 hours | Endgame variety |
| **P3** | Wire 20 RPG shells | 8 hours | World feels alive |
| **P3** | Create ConsequenceSystem + DebtSystem | 2 hours | Missing files |
| **P4** | Campaign + endgame | 20+ hours | Full release |

**Total to MVP (P1 + P2 + P3):** ~55 hours  
**Total to full vision (P4):** ~80+ hours
