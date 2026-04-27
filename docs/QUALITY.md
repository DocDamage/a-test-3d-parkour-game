# Quality Scorecard

**Last updated:** 2026-04-27
**Scoring:** A (production-ready) → B (functional, needs polish) → C (partially implemented) → D (data shell) → F (not started)

## Phase 1: Combat Foundation

| System | Grade | Notes |
|--------|-------|-------|
| DamageSystem | B | Full damage types, crits, status effects. Needs more thorough testing with all damage types. |
| HitboxSystem | B | Sphere/box collision, team filters. Needs spatial hash when >15 hitboxes. |
| LootSystem | B | Tiered drops, smart drops, unidentified legendaries. Needs inventory/stash instead of auto-equip. |
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
| AffixSystem | B | 7 tiers, rolling ranges, legendary powers. Needs more playtesting for balance. |
| ExoSuitSystem | B | 4 slots, set bonuses, gear score. Added `_save()`/`_load()` and `onEquip` callback for loot toast. |
| CharacterSheet | B | Base stats + gear bonuses merged. Added `_save()`/`_load()` for persistent attributes. |
| Gear→Combat Wire | B | DamageSystem reads player.getRPGStats(). CDR flows to SkillSystem. Max HP syncs. |
| Loot Tiers | B | Common→Primal drop weights, unidentified items, smart drops. Loot toast notification added. |
| Legendary Powers | B | LegendaryPowerSystem.js executes all 12 powers. Hooks wired into melee, jump, sprint, damage, death, parry. **Loot Beacon power sets `player._lootPickupRadius` but LootSystem does not yet read it.** |
| Gem System | F | Not implemented. |
| Identify System | C | Unidentified flag exists. No safehouse identification mechanic yet. |
| Inventory | F | Auto-equip only. No stash or comparison UI. |

**Phase 3 Overall: B** — Legendary powers now execute. Remaining gap: LootSystem ignores `_lootPickupRadius`.

## Phase 4: Endgame Loop

| System | Grade | Notes |
|--------|-------|-------|
| DifficultyTierSystem | B | 9 tiers, persistent unlocks, scales HP/dmg/XP/loot. `#difficulty-badge` + popup added. |
| ApexRiftSystem | B | Arena, progress bar, guardian spawn, time limits. `#rift-hud` with live timer, progress fill, wave/kill counters, guardian flash, and result overlay added. |
| NephalemGlory | B | Kill streak tracking, 3 tiers, multipliers. `#glory-overlay` DOM tint added (gold/orange/red per tier). Floating text at tier 3. |
| Rift Guardian | C | Reuses BossFight with scaling. Needs unique guardian boss instead of Overseer clone. |
| Difficulty UI | B | `#difficulty-badge` top-right with tier color classes. Click opens popup listing all tiers with lock states. |
| Rift UI | B | `#rift-hud` visible during rift. Result overlay on clear/fail. |

**Phase 4 Overall: B-** — All HUDs are now DOM-based. Rift Guardian still needs unique boss.

## Parkour Core

| System | Grade | Notes |
|--------|-------|-------|
| Player Controller | A | 1700-line state machine. Added `moveSpeedMultiplier`, `_damageMultiplier`, `_regenPerSecond`, `_staggerImmune`, `isInvisible`, `_firewallActive`, `_predatorVisionActive`. |
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
| Testing | D | `node -c` syntax checks only. No unit tests, no browser automation. |
| CI/CD | F | No CI. No automated testing on push. |

## Known Technical Debt

1. **LootSystem ignores `player._lootPickupRadius`** — Loot Beacon legendary power exists but has no effect.
2. **Firewall blocks nothing** — `player._firewallActive` is set, but drones have no projectile attacks (all melee). Needs enemy ranged attack system or should be deprioritized.
3. **Adrenaline Rush dodge is a no-op** — `+20% dodge` granted but `player.takeDamage()` is called directly by DroneAI; dodgeChance is never rolled.
4. **Aegis Field / Perfect Parry orphaned** — `onPerfectParry()` exists in LegendaryPowerSystem, but no parry mechanic exists in the codebase to trigger it.
5. **Inventory missing** — Gear auto-equips blindly. No comparison, no stash.
6. **Ancient/Primal tiers under-tested** — Drop rates may need tuning.
7. **No automated browser testing** — Manual testing only.
8. **Rift Guardian is BossFight clone** — Needs unique guardian with different attacks.

## Action Priority

| Priority | Task | Estimated Effort |
|----------|------|-----------------|
| P1 | Wire `player._lootPickupRadius` into `LootSystem.update()` | 15 min |
| P1 | Route drone melee damage through `DamageSystem.applyDamage()` so dodge chance rolls | 20 min |
| P2 | Add enemy projectile attack to drones OR remove Firewall from player-facing skills | 30 min |
| P2 | Implement parry input window (e.g., tap F within 0.2s of damage) to trigger `onPerfectParry()` | 45 min |
| P2 | Split AssistMode into granular flags (jump/grapple/aim) instead of single global toggle | 30 min |
| P3 | Inventory / stash system | 8 hours |
| P3 | Unique Rift Guardian boss | 6 hours |
| P4 | Browser smoke test automation | 2 hours |
