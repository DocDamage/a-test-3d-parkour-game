# Quality Scorecard

**Last updated:** 2026-04-28
**Scoring:** A (production-ready) → B (functional, needs polish) → C (partially implemented) → D (data shell) → F (not started)

## Phase 1: Combat Foundation

| System | Grade | Notes |
|--------|-------|-------|
| DamageSystem | B | Full damage types, crits, status effects. Needs more thorough testing with all damage types. |
| HitboxSystem | B | Sphere/box collision, team filters. Needs spatial hash when >15 hitboxes. |
| LootSystem | B | Tiered drops, smart drops, unidentified legendaries, stash routing, gem drops. Needs more economy/balance testing. |
| EnemyHealthBar | B | Canvas sprite billboards. Gold pulse support added for Nephalem Glory. `alwaysVisible` flag added for Omniscience. |
| Player Health | B | takeDamage, heal, die, respawn. Second Life legendary power can now block fatal damage. |
| DroneAI Combat | B | Health, damage, death callbacks. Added _feared, _disabled, _hackExpiry, _burning DoT, team switching. |
| BossFight Fix | B | Phase 3 windup extended to 3.0s. Core[0] added to world.collidables during windup. Phase 2 exposes all 3 cores. Melee can now damage cores. |

**Phase 1 Overall: B** — Core loop works. Boss cores are now hittable.

## Phase 2: Skill Bar

| System | Grade | Notes |
|--------|-------|-------|
| SkillSystem | B | 5 slots, cooldowns, CDR, charges. Added `setNoCooldown()` for Saboteur ultimate. |
| ResourceSystem | B | Momentum/Focus/Chaos/Fury/Charge. All 5 archetypes now generate/consume their resource. |
| SkillBarUI | B | DOM-based, cooldown overlays, resource orb. Needs art/icons. |
| SkillData | B | All 5 archetypes defined. **All 25 skill callbacks are now wired in main.js.** |
| Dive Kick | B | Player state added, damage hitbox works. Needs better landing FX. |
| Ground Pound | B | Player state added, AoE hitbox works. Gamepad rumble wired. |
| Passive Trees | B | PassiveTree.js controller + `#passive-tree` DOM panel added. Points granted on level-up. Save/load via localStorage. |

**Phase 2 Overall: B** — All archetype skills execute. Passive tree is playable.

## Phase 3: Deep Itemization

| System | Grade | Notes |
|--------|-------|-------|
| AffixSystem | B | 7 tiers, rolling ranges, legendary powers. Ancient/Primal odds now use the shared rift-aware `BalanceModel`; still needs long-run economy telemetry. |
| ExoSuitSystem | B | 4 slots, set bonuses, gear score. Added `_save()`/`_load()` and `onEquip` callback for loot toast. |
| CharacterSheet | B | Base stats + gear bonuses merged. Added `_save()`/`_load()` for persistent attributes. |
| Gear→Combat Wire | B | DamageSystem reads player.getRPGStats(). CDR flows to SkillSystem. Max HP syncs. |
| Loot Tiers | B | Common→Primal drop weights, unidentified items, smart drops. Guardian/boss drops now use rift-aware Ancient/Primal odds and are covered by balance simulation. |
| Legendary Powers | B | LegendaryPowerSystem.js executes all 12 powers. Hooks wired into melee, jump, sprint, damage, death, parry. Loot Beacon pickup radius is now read by `LootSystem.update()`. |
| Gem System | B | `GemSystem.js` adds persistent stackable gems, random gem drops, stash socketing/unsocketing, and stat bonuses through equipped gear. Needs playtesting around gem scarcity. |
| Identify System | B | Stash identify exists, plus a safehouse Identifier Bench that can identify all stashed gear for chips. |
| Inventory | B | Gear routes to persistent stash. Stash supports identify, gem-specific socketing, unsocketing, equip-swap, scrap, and stat comparison against equipped gear. |

**Phase 3 Overall: B** — Legendary powers now execute and pickup-radius bonuses are wired into loot collection.

## Phase 4: Endgame Loop

| System | Grade | Notes |
|--------|-------|-------|
| DifficultyTierSystem | B | 9 tiers, persistent unlocks, scales HP/dmg/XP/loot. `#difficulty-badge` + popup added. |
| ApexRiftSystem | B | Arena, progress bar, guardian spawn, time limits. `#rift-hud` with live timer, progress fill, wave/kill counters, guardian flash, and result overlay added. |
| NephalemGlory | B | Kill streak tracking, 3 tiers, multipliers. `#glory-overlay` DOM tint added (gold/orange/red per tier). Floating text at tier 3. |
| Rift Guardian | B | Unique `RiftGuardian` boss now drives Apex Rift directly, has its own core damage model, attacks, cleanup, combat hurtbox, and rift-aware HP/damage scaling. |
| Difficulty UI | B | `#difficulty-badge` top-right with tier color classes. Click opens popup listing all tiers with lock states. |
| Rift UI | B | `#rift-hud` visible during rift. Result overlay on clear/fail. |

**Phase 4 Overall: B** — All HUDs are now DOM-based. Unique Rift Guardian exists and high-rift scaling is covered by the balance simulation.

## Parkour Core

| System | Grade | Notes |
|--------|-------|-------|
| Player Controller | A | State machine kept under the 2000-line budget by extracting trail/glow/flash helpers to `PlayerVisualEffects.js`. Added `moveSpeedMultiplier`, `_damageMultiplier`, `_regenPerSecond`, `_staggerImmune`, `isInvisible`, `_firewallActive`, `_predatorVisionActive`. |
| World / Collision | B | AABB collision, climbables, platforms. Could use spatial partitioning. |
| Camera | B | Third-person with post-processing. Occasional clipping through walls. |
| Movement Feel | A | Parkour is responsive and satisfying. The core identity is strong. |

## Audio / Visual

| System | Grade | Notes |
|--------|-------|-------|
| Post-Processing | B | Full chain + `setEffectEnabled(name, bool)` + `setFOV(degrees)`. Settings panel wired. |
| Audio | B | Procedural synthesis. Added `setSFXVolume()` and `setMusicVolume()`. Settings panel wired. |
| Particles | B | ParticleEffects module. Could use more hit/death FX. Grenade and EMP now use particle explosions. |

## Infrastructure

| System | Grade | Notes |
|--------|-------|-------|
| Module System | A | Pure ES modules, no build step. Clean imports. |
| Save/Load | B | CharacterSheet, ExoSuitSystem, PassiveTree, DifficultyTierSystem, and ApexRiftSystem all persist to localStorage. No full savegame snapshot yet. |
| Testing | B | `node -c` syntax checks, focused unit tests, deterministic balance simulation, and committed headless browser smoke with stash/safehouse scenario assertions. |
| CI/CD | B | GitHub Actions installs Chrome and runs `scripts/check.sh` on push/PR. Browser smoke is now required in CI and local check scripts. |

## Known Technical Debt

1. **Economy telemetry** — Ancient/Primal odds are simulated and capped, but real run data should still be collected over longer sessions.
2. **Scenario depth** — Browser smoke now covers boot, stash comparison, gem buttons, and safehouse identify UI; rift entry and combat scenarios can still go deeper.
3. **Lifecycle migration** — `Lifecycle.js` centralizes mixed update signatures; individual subsystems can now migrate toward `update(dt, context)` over time.
4. **Combat performance profiling** — `HitboxSystem` now has spatial hashing, but heavy combat scenes should still be profiled with real enemy density.

## Action Priority

| Priority | Task | Estimated Effort |
|----------|------|-----------------|
| P1 | Add rift-entry and combat interaction scenarios to browser smoke | 4 hours |
| P1 | Add live economy telemetry export for long sessions | 4 hours |
| P2 | Profile dense combat scenes with spatial hash enabled | 3 hours |
| P2 | Migrate expansion subsystems toward `update(dt, context)` | 4 hours |

## 2026-04-28 Implementation Notes

- Fixed runtime boot blockers outside the roadmap scope: `AudioManager` now exports the shared audio context expected by legacy modules, and `main.js` initialization order now creates hints, loot, input, expansion systems, and `GameDirector` after their dependencies exist.
- Added missing roadmap-named systems: `PredatorDrone`, `PhotoBountySystem`, `EscortSystem`, `RhythmParkour`, and `TrapCrafting`, wired through `ExpansionSystems` and `ExpansionWiring`.
- Added missing projectile APIs: `ProjectileManager.fireLob()` and `ProjectileManager.fireDecoy()`.
- Fixed enemy variety runtime issues: added the missing `SapperEnemy` class and corrected medic healing to use the selected wounded ally.
- Wired second-pass gameplay integrations: Saboteur grenade/decoy skills now use `ProjectileManager` APIs, photo captures can complete photo bounties, predator drone has a hurtbox/health bar/death callback, crafted traps affect drones, enemies, and predator, and blackout events now apply drone-vision, resource-cost, health-drain, and lockdown effects.
- Combat states now surface through shared player state for light/heavy/aerial attacks, block/parry, and reload; block mitigation and Boss Slayer damage flow through `DamageSystem`.
- The five expansion bosses are now directly spawnable with Shift+B, registered as `isBoss`, and have combat hurtboxes/health bars.
- Added stash comparison rows that include base stats, affixes, and socketed gem bonuses against the currently equipped item in the same slot.
- Added gem-specific stash socket buttons, unsocketing, richer gem chip display, and a safehouse Identifier Bench that identifies all stashed gear for chips.
- Added focused unit tests for gem socket round-trips, identify-all costs, and comparison stat aggregation.
- Made browser smoke required in `scripts/check.ps1`, `scripts/check.sh`, and GitHub Actions by installing Chrome in CI.
- Added `BalanceModel.js` and `scripts/balance-sim.mjs`; Rift 100 Guardian now simulates to ~62k HP instead of the old runaway exponential curve, with Ancient/Primal odds increasing at high rift and capped.
- Added rift-aware boss/Guardian loot routing, including Guardian kills as boss-tier drops.
- Added `Lifecycle.js` and routed expansion updates through a shared lifecycle adapter.
- Added HitboxSystem spatial hashing for broadphase checks once active hitboxes exceed the performance threshold.
- Expanded browser smoke to seed stash/gem data and assert stash comparison, socket/unsocket controls, and safehouse identify UI render after boot.
