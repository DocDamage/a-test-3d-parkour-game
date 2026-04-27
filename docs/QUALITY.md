# Quality Scorecard

**Last updated:** 2026-04-27
**Scoring:** A (production-ready) → B (functional, needs polish) → C (partially implemented) → D (data shell) → F (not started)

## Phase 1: Combat Foundation

| System | Grade | Notes |
|--------|-------|-------|
| DamageSystem | B | Full damage types, crits, status effects. Needs more thorough testing with all damage types. |
| HitboxSystem | B | Sphere/box collision, team filters. Needs spatial hash when >15 hitboxes. |
| LootSystem | B | Tiered drops, smart drops, unidentified legendaries. Needs inventory/stash instead of auto-equip. |
| EnemyHealthBar | B | Canvas sprite billboards. Works but could use better positioning (sometimes clips). |
| Player Health | B | takeDamage, heal, die, respawn. Needs death camera/FX polish. |
| DroneAI Combat | B | Health, damage, death callbacks. Melee attack works but is simple. |
| BossFight Fix | C | takeDamage guards added. Boss cores still undamageable without Phase 2 skills. |

**Phase 1 Overall: B** — Core loop works: LMB → hitbox → damage → death → loot.

## Phase 2: Skill Bar

| System | Grade | Notes |
|--------|-------|-------|
| SkillSystem | B | 5 slots, cooldowns, CDR, charges. Needs more archetypes beyond Traceur loadout. |
| ResourceSystem | B | Momentum/Focus/Chaos/Fury/Charge. Works but only Traceur is wired. |
| SkillBarUI | B | DOM-based, cooldown overlays, resource orb. Needs art/icons. |
| SkillData | C | All 5 archetypes defined but only Traceur callbacks are wired in main.js. |
| Dive Kick | B | Player state added, damage hitbox works. Needs better landing FX. |
| Ground Pound | B | Player state added, AoE hitbox works. Needs shockwave visual. |
| Passive Trees | D | Data defined in SkillData.js. No PassiveTree.js controller or UI exists yet. |

**Phase 2 Overall: B-** — Skill bar works for Traceur. Other archetypes need execution callbacks.

## Phase 3: Deep Itemization

| System | Grade | Notes |
|--------|-------|-------|
| AffixSystem | B | 7 tiers, rolling ranges, legendary powers. Needs more playtesting for balance. |
| ExoSuitSystem | B | 4 slots, set bonuses, gear score. Auto-equip is acceptable for now. |
| CharacterSheet | B | Base stats + gear bonuses merged. getStats() feeds into combat. |
| Gear→Combat Wire | B | DamageSystem reads player.getRPGStats(). CDR flows to SkillSystem. Max HP syncs. |
| Loot Tiers | B | Common→Primal drop weights, unidentified items, smart drops. |
| Legendary Powers | D | Data defined with `trigger` strings. No LegendaryPowerSystem.js execution engine yet. |
| Gem System | F | Not implemented. |
| Identify System | C | Unidentified flag exists. No safehouse identification mechanic yet. |
| Inventory | F | Auto-equip only. No stash or comparison UI. |

**Phase 3 Overall: B-** — Gear affects combat. Legendary powers are descriptive only.

## Phase 4: Endgame Loop

| System | Grade | Notes |
|--------|-------|-------|
| DifficultyTierSystem | B | 9 tiers, persistent unlocks, scales HP/dmg/XP/loot. Needs UI panel. |
| ApexRiftSystem | C | Arena, progress bar, guardian spawn, time limits. Needs more playtesting. Guardian reuses BossFight. |
| NephalemGlory | C | Kill streak tracking, 3 tiers, multipliers. Needs visual FX (trails, screen tint). |
| Rift Guardian | C | Reuses BossFight with scaling. Needs unique guardian boss instead of Overseer clone. |
| Difficulty UI | D | Console log only. No in-game difficulty selector panel. |
| Rift UI | D | Console log only. No in-game rift progress / timer UI. |

**Phase 4 Overall: C+** — Systems exist and are wired. UI is missing.

## Parkour Core

| System | Grade | Notes |
|--------|-------|-------|
| Player Controller | A | 1700-line state machine. Polished, handles edge cases well. |
| World / Collision | B | AABB collision, climbables, platforms. Could use spatial partitioning. |
| Camera | B | Third-person with post-processing. Occasional clipping through walls. |
| Movement Feel | A | Parkour is responsive and satisfying. The core identity is strong. |

## Audio / Visual

| System | Grade | Notes |
|--------|-------|-------|
| Post-Processing | B | Full chain (SAO→Bloom→MotionBlur→FilmGrain→ChromaticAberration→Vignette). Performance OK. |
| Audio | B | Procedural synthesis. No external files. Could use more combat SFX. |
| Particles | B | ParticleEffects module. Could use more hit/death FX. |

## Infrastructure

| System | Grade | Notes |
|--------|-------|-------|
| Module System | A | Pure ES modules, no build step. Clean imports. |
| Save/Load | C | localStorage for difficulty, rift level, RPG choices. No full savegame yet. |
| Testing | D | `node -c` syntax checks only. No unit tests, no browser automation. |
| CI/CD | F | No CI. No automated testing on push. |

## Known Technical Debt

1. **Boss cores undamageable** — No player attack mechanic hits core colliders. Needs Phase 2 skill system to provide ranged attacks.
2. **Legendary powers are descriptive only** — `trigger` strings exist but no code executes them.
3. **Passive trees not implemented** — Data exists, no controller or UI.
4. **Inventory missing** — Gear auto-equips blindly. No comparison, no stash.
5. **Ancient/Primal tiers under-tested** — Drop rates may need tuning.
6. **No automated browser testing** — Manual testing only.
7. **Rift Guardian is BossFight clone** — Needs unique guardian with different attacks.
8. **Nephalem Glory lacks visual FX** — No screen tint, no trails, no gold filter.

## Action Priority

| Priority | Task | Estimated Effort |
|----------|------|-----------------|
| P0 | Add browser smoke test (load game, kill drone, open rift) | 2 hours |
| P1 | Implement LegendaryPowerSystem.js | 4 hours |
| P1 | Wire remaining archetype skill callbacks | 3 hours |
| P2 | Add Rift UI (progress bar, timer, difficulty panel) | 3 hours |
| P2 | Add Nephalem Glory visual FX | 2 hours |
| P3 | Passive tree controller + UI | 6 hours |
| P3 | Inventory / stash system | 8 hours |
| P4 | Unique Rift Guardian boss | 6 hours |
