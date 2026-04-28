# Roadmap to 100% — Apex Rift Completion Plan

**Date:** 2026-04-28  
**Current Module Count:** 170 JS files  
**Target:** Close all gameplay shells, wire every callback, and ship a fully playable vertical slice.

**Implementation pass:** 2026-04-28 — roadmap systems are wired and the app boots in Chromium with no page exceptions. Extra required fixes outside the original scope were documented in `docs/QUALITY.md`. Follow-up refactor extracted player visual FX into `js/PlayerVisualEffects.js` so `Player.js` has budget headroom again.

---

## Philosophy

Work in **dependency order**. Each phase unlocks the next. No phase should depend on something in a later phase.

**File budget:** `main.js` ≤ 2000 lines, `Player.js` ≤ 2000 lines. Extract aggressively into new modules.

---

## Phase 1: Projectile Infrastructure *(Unblocks Phase 2)*

**Goal:** Give ranged skills and bosses something to actually shoot.

### 1.1 `js/ProjectileManager.js` — Expand
- Add `firePiercing(origin, direction, config)` — penetrates all enemies in line
- Add `fireChainLightning(origin, targets, config)` — hops to nearest successive targets
- Add `fireLob(origin, target, config)` — parabolic arc for grenades/mines
- Add `fireDecoy(origin, config)` — spawns player-clone mesh that enemies target
- Wire all methods into existing `ProjectileManager.update(dt)` loop

### 1.2 `js/DroneAI.js` — Drone States
- Add `_feared` flag — flee from player for duration
- Add `_disabled` flag — skip update loop entirely
- Add `_hackExpiry` timestamp — revert team on expiry
- Add `isProjectileAttacker` subclass — drones that fire actual projectiles (so `firewall` has a purpose)

**Estimated:** 2 files modified, ~200 lines.

---

## Phase 2: All 20 Skill Callbacks *(Unblocks Phase 3)*

**Goal:** Every skill in `SkillData.js` has a working callback.

### 2.1 Operative (Focus, `#00ccff`)
| Skill | Implementation |
|-------|---------------|
| `silenced_pistol` | `ProjectileManager.fire()` 25m, kinetic damage, generates Focus |
| `ghost_bullet` | `ProjectileManager.firePiercing()` line damage to all enemies, energy type |
| `predator_vision` | `player._predatorVisionActive = true` 6s, force all health bars visible, +15% crit |
| `smoke_bomb` | Particle cloud, `player.isInvisible = true` 3s, null nearest drone targets |
| `assassinate` | Find nearest enemy ≤15m, teleport behind, instant `Hitbox` for `skill.finalDamage` |

### 2.2 Saboteur (Chaos, `#ff3333`)
| Skill | Implementation |
|-------|---------------|
| `scrap_throw` | `ProjectileManager.fire()` 12m, kinetic, generates Chaos |
| `grenade_toss` | `ProjectileManager.fireLob()` 1.5s fuse, `Hitbox` sphere radius 4, explosive |
| `proxy_mine` | Spawn cube at feet → `world._proximityMines[]`, explode at 3m, despawn 30s |
| `decoy` | `ProjectileManager.fireDecoy()` clone forward, enemies target it, explodes on death |
| `zero_cooldown` | `SkillSystem.setNoCooldown(true)` 5s, `resource.costMultiplier = 0` |

### 2.3 Specimen (Fury, `#ff0066`)
| Skill | Implementation |
|-------|---------------|
| `claw_swipe` | `Hitbox` sphere radius 1.5, 180° front filter, ≤3 enemies, generates Fury |
| `berserk_lunge` | Find nearest ≤15m, teleport-lunge, `Hitbox` radius 3 on landing |
| `roar` | All enemies ≤6m: `_feared = true` 2s, generate 20 Fury |
| `adrenaline_rush` | `moveSpeedMultiplier *= 1.5`, `_regenPerSecond += 5% maxHP` 5s |
| `primal_surge` | `_damageMultiplier *= 2.0`, `_staggerImmune = true` 6s, red vignette |

### 2.4 Netrunner (Charge, `#aa66ff`)
| Skill | Implementation |
|-------|---------------|
| `zap` | `ProjectileManager.fireChainLightning()` nearest ≤15m, chains 1 more at 50% dmg |
| `hack_drone` | Nearest non-allied ≤12m: `team = 'player'`, `_hackExpiry = 8s` |
| `emp_pulse` | `Hitbox` radius 5, each hit: `_disabled = true` 3s, electric damage |
| `firewall` | `player._firewallActive = true` 4s, destroy incoming projectiles, melee feedback 15 electric |
| `swarm_override` | All drones ≤15m: `team = 'player'`, `_hackExpiry = 8s` |

**Integration:** Add all 20 `skillSystem.onExecute('skill_id', callback)` calls in `main.js` (~line 218 pattern).

**Estimated:** 1 file modified (`main.js`), ~400 lines of callbacks.

---

## Phase 3: Legendary Powers *(Depends on Phase 2)*

**Goal:** All 12 legendary affixes actually do something.

### 3.1 `js/LegendaryPowerSystem.js` — Implement All Powers

| Power ID | Trigger | Implementation |
|----------|---------|---------------|
| `fabricators_torch` | `onMeleeHit` | `enemy._burning = {dmg: 20, duration: 4}` |
| `swarm_link` | `onEnemyKilled` | 20% chance spawn allied clone drone |
| `temporal_shift` | `onJump(isDoubleJump=true)` | `bulletTime.start(0.5)` |
| `void_walk` | `onSprint` + enemy overlap | `enemy._ethereal = true` 2s |
| `boss_slayer` | `onDamageDealt` | If `target.isBoss`: damage `* (1 + affix.value)` |
| `aegis_field` | `onPerfectParry` | `player._shield = 30` absorb 3s |
| `loot_beacon` | Passive | Sets `player._lootPickupRadius = 3.0` |
| `second_life` | `onTakeFatalDamage` | Once per 5min: block death, heal to 30% |
| `chain_lightning` | `onMeleeHit` | Arc to 2 enemies ≤6m at 50% damage |
| `omniscience` | Passive | `EnemyHealthBar.alwaysVisible = true` |
| `kinetic_cascade` | `onMeleeHit` (3rd hit) | `Hitbox` radius 4, damage 30 at player pos |
| `adrenaline_surge` | Passive per-frame | If health < 30%: +20% dmg, +15% speed |

### 3.2 Event Hooks
- `onMeleeHit(target)` — call from CombatSystem `_registerHitbox()` on hit
- `onJump(isDoubleJump)` — call from `Player.startJump()`
- `onSprint(dt)` — call from `Player.updateGrounded()` while sprinting
- `onTakeFatalDamage()` — call from `Player.takeDamage()` before death
- `onEnemyKilled(enemy)` — call from `main.js` `_handleEnemyKilled()`
- `onDamageDealt(target, amount)` — call from DamageSystem

**Estimated:** 1 new file + 5 modified files, ~350 lines.

---

## Phase 4: Passive Tree *(Parallel with Phases 5–7)*

**Goal:** Players can actually invest points into the 50 passive nodes in `SkillData.js`.

### 4.1 `js/PassiveTree.js` — New File (~300 lines)
- Constructor: `(archetypeId, skillSystem)`
- `investPoint(nodeId)` — validate `requires[]`, `currentRank < maxRank`, `availablePoints > 0`
- `computeBonuses()` — aggregate invested bonuses → `skillSystem.setPassiveBonuses()`
- `availablePoints` increments +1 on level-up via `ProgressionSystem` callback
- `serialize()` / `deserialize()` — `localStorage` key `apex_passives`

### 4.2 UI Panel (`index.html`)
- `#passive-tree` panel (P key toggle)
- 10 node buttons per archetype in 2-column grid
- Show name, `rank/maxRank`, description, lock state
- "Spend Point" button (disabled if locked/max/no points)
- Available points counter, color-coded by archetype

**Estimated:** 1 new file + 1 modified HTML file, ~400 lines.

---

## Phase 5: Rift HUD *(Parallel with Phases 4, 6, 7)*

**Goal:** Apex Rift shows actual UI instead of console logs.

### 5.1 `index.html` — `#rift-hud`
- Rift level + countdown timer
- Progress bar (fill = `progress / 100`)
- Wave number + kill count
- "GUARDIAN SPAWNED" flash text
- Result overlay on end: CLEARED / FAILED + time + levels gained

### 5.2 `js/ApexRiftSystem.js`
- `_updateHUD()` — called at top of `update(dt)`, sets DOM text/width
- `startRift()` — show HUD
- `endRift()` — show result overlay, hide HUD after 3s

**Estimated:** 1 modified HTML + 1 modified JS, ~100 lines.

---

## Phase 6: Difficulty HUD Badge *(Parallel with Phases 4, 5, 7)*

**Goal:** Visible difficulty indicator + selector.

### 6.1 `index.html` — `#difficulty-badge`
- Top-right persistent badge
- Color classes: Normal=grey, Nightmare=blue, Hell=orange, Torment I–VI=red shades
- Click opens `#difficulty-popup` listing tiers, locked greyed out

### 6.2 `js/DifficultyTierSystem.js`
- Add `updateHUD()` — sets badge text + color class
- Call at end of `setTier()` and `_load()`

**Estimated:** 1 modified HTML + 1 modified JS, ~80 lines.

---

## Phase 7: Nephalem Glory Visual FX *(Parallel with Phases 4, 5, 6)*

**Goal:** Glory tiers have visible screen effects.

### 7.1 `index.html` — `#glory-overlay`
- Fixed fullscreen div, `pointer-events: none`, `opacity: 0`

### 7.2 `js/NephalemGlory.js`
- `_applyTier(tier)`:
  - Tier 1: gold overlay opacity 0.08 + persistent particle trail
  - Tier 2: orange overlay opacity 0.15 + enemy health bars pulse gold
  - Tier 3: red overlay opacity 0.25 + floating "NEPHALEM GLORY" text
- `_clearTier()` fades overlay to 0, stops trail

**Estimated:** 1 modified HTML + 1 modified JS, ~80 lines.

---

## Phase 8: Boss Cores Damageable *(Depends on Phase 2)*

**Goal:** Melee players can damage boss cores.

### 8.1 `js/BossFight.js`
- Extend Phase 3 windup core exposure: 1.5s → 3.0s
- Temporarily add `cores[0]` to `world.collidables` during windup
- Expose `cores[1]` and `cores[2]` during Phase 2 vulnerable states

**Estimated:** 1 modified file, ~30 lines.

---

## Phase 9: Full Save System *(Parallel with Phases 1, 10)*

**Goal:** Character, gear, and passives persist across sessions.

### 9.1 `js/CharacterSheet.js`
- Add `_save()` / `_load()` — `localStorage` key `apex_character`
- Call `_save()` at end of `levelUp()` and `spendAttributePoint()`

### 9.2 `js/ExoSuitSystem.js`
- Add `_save()` / `_load()` — `localStorage` key `apex_exosuit`
- Call `_save()` at end of `equip()`

### 9.3 `js/main.js`
- Call `characterSheet._load()` and `exoSuit._load()` before first frame

**Estimated:** 2 modified files, ~60 lines.

---

## Phase 10: Onboarding + Loot Toast *(Parallel with Phases 1, 9)*

**Goal:** New players understand the game.

### 10.1 `index.html`
- `#hint-toast` — center-screen, auto-hides 4s
- `#loot-toast` — bottom-right item card (rarity-colored)

### 10.2 `js/main.js`
- `_shownHints` Set tracking fired hints
- Hook into Player.js state transitions:
  - First wallrun → "Wallrun — press SPACE to jump off!"
  - First grapple → "Hold RMB to grapple-swing. Release to fly!"
  - First kill → "Loot drops! Walk over items to pick them up."
  - First legendary → "LEGENDARY! Check your gear stats (G key)."
  - First rift unlock → "Press T to enter the Apex Rift — endgame awaits."
- On gear equip: `showLootToast(item)`

**Estimated:** 1 modified HTML + 1 modified JS, ~120 lines.

---

## Phase 11: Settings Panel *(Parallel with Phase 12)*

**Goal:** All settings in one place.

### 11.1 `index.html` — `#settings-panel` (O key toggle)
- **Graphics:** FOV slider (60–120°), Film Grain / Motion Blur / SAO / Bloom / Chromatic Aberration / Vignette checkboxes
- **Audio:** Master / SFX / Music sliders (0–100)
- **Accessibility:** Merge `AssistMode._buildUI()` options into this panel

**Estimated:** 1 modified HTML file, ~200 lines.

---

## Phase 12: Combat State Machine *(Depends on Phases 1, 2)*

**Goal:** CombatSystem fully drives player combat states.

### 12.1 `js/Player.js` — Add Combat States
- `ATTACK_LIGHT` — 0.3s, comboable
- `ATTACK_HEAVY` — 0.6s, breaks shields
- `ATTACK_AERIAL` — airborne strike
- `BLOCK` — hold to reduce damage 75%, drains stamina 10/s
- `PARRY` — 0.2s window on block start, reflects projectiles
- `RELOAD` — weapon reload, vulnerable
- `STUN` — enemy CC, 1-3s
- `KNOCKBACK` — airborne from heavy hit
- `CRAWL` — vent traversal, 2 m/s, silent

### 12.2 `js/CombatSystem.js` — Integrate with Player States
- Write player states instead of internal `COMBO_STATES`
- Stamina checks before attacks
- Block/parry input handling
- Aerial attack routing

### 12.3 `js/StaminaSystem.js` — Gate Everything
- Sprint: 5/s, Air dash: 15, Block: 10/s, Light: 10, Heavy: 25, Parry: 5, Grapple: 10
- `canSpend()` / `spend()` API
- Bar UI in `#ui` panel

**Estimated:** 3 modified files, ~600 lines.

---

## Phase 13: Enemy Variety *(Depends on Phases 1, 12)*

**Goal:** Enemies are interesting to fight.

### 13.1 `js/EnemyBase.js` + `js/EnemyManager.js` — Expand
- 10 enemy types with distinct behaviors and weaknesses
- Elite variants: red glow, 2× HP, strategy injection
- Squad compositions: Assault, Ambush, Siege, Sapper

### 13.2 5 New Bosses
| Boss | File | Concept |
|------|------|---------|
| The Fabricator | `js/bosses/BossFabricator.js` | Spawns drones, repairs cores |
| The Warden | `js/bosses/BossWarden.js` | Heavy shield, shockwaves |
| The Leviathan | `js/bosses/BossLeviathan.js` | Aerial, dive attacks |
| The Swarm Queen | `js/bosses/BossSwarmQueen.js` | Minion flood, hive mind |
| The Architect | `js/bosses/BossArchitect.js` | Rewrites arena geometry |

### 13.3 Predator Drone
- `js/PredatorDrone.js` — hunts player across sectors, leaves trails

**Estimated:** 7 new files, ~3500 lines.

---

## Phase 14: World & Quests *(Depends on Phases 13)*

**Goal:** World feels alive.

### 14.1 Photography Bounties
- `js/PhotoBountySystem.js` — NPC gives target subject, player takes photo, rewards chips

### 14.2 Escort Missions
- `js/EscortSystem.js` — NPC follows player path, must survive to destination

### 14.3 Rhythm Parkour Challenge
- `js/RhythmParkour.js` — timed button prompts during parkour run, Perfect/Good/Miss scoring

### 14.4 Trap Crafting
- `js/TrapCrafting.js` — spend scrap to craft proximity mines, tripwires, EMP traps

### 14.5 Blackout Events
- Wire existing `BlackoutSystem.js` events into gameplay:
  - Grid Failure: lights off, drone vision halved
  - Overclock Surge: abilities cost 0 flow, health drains 1%/s
  - Drone Migration: faction floods random sector
  - Lockdown: arena entrances sealed

**Estimated:** 5 new files, ~1200 lines.

---

## Phase 15: P1 Debt Fixes *(Parallel with all phases)*

**Goal:** Fix known bugs that break or nullify features.

| Bug | Fix | File |
|-----|-----|------|
| LootSystem ignores `_lootPickupRadius` | Add radius to all proximity checks | `js/LootSystem.js` |
| DroneAI melee bypasses DamageSystem | Route through `damageSystem.applyDamage()` | `js/DroneAI.js` |
| `firewall` skill is no-op | Add melee electric feedback 15 dmg | `js/main.js` + `js/DroneAI.js` |
| No parry mechanic | Add `PARRY` state, 0.2s window, F key | `js/Player.js` + `js/CombatSystem.js` |
| AssistMode binary toggle | Split into `_jumpAssist`, `_grappleAssist`, `_aimAssist` flags | `js/AssistMode.js` |

**Estimated:** 5 modified files, ~150 lines.

---

## Phase 16: Final Integration & QA

**Goal:** Everything works together.

### 16.1 Integration Checklist
- [x] All 20 planned non-Traceur archetype skills have callbacks; all 30 current active skills are wired in `SkillCallbacks.js`
- [x] All 12 legendary powers have active hooks; `DamageSystem` now routes Boss Slayer/on-damage effects
- [x] Passive tree points spendable and persisting
- [x] All 5 bosses are instantiated, Shift+B spawnable, and registered with hurtboxes/health bars
- [x] All 10 enemy types spawn through `EnemyManager` squads; missing Sapper runtime class added
- [x] Parry/block/stamina gating wired through `CombatSystem`, `Player`, `StaminaSystem`, and `DamageSystem`
- [x] Rift HUD updates correctly
- [x] Difficulty badge reflects current tier
- [x] Nephalem Glory overlay visible
- [x] Save/load preserves character + gear + passives
- [x] Hints fire once and only once
- [x] Settings panel controls graphics/audio/accessibility subsystems
- [x] P1 debt fixes verified by code path and browser boot
- [x] Stash comparison, gem socket/unsocket, and safehouse identify UI covered by browser scenario smoke
- [x] Ancient/Primal odds and high-rift Guardian scaling covered by deterministic balance simulation

### 16.2 Performance Pass
- [x] No page exceptions during Chromium boot smoke
- [x] Projectile cleanup disposes meshes/materials, including cloned decoy groups
- [x] Particle systems use existing disposal paths where provided
- [x] HitboxSystem uses spatial hashing when many hitboxes are active
- [x] Expansion systems route through shared lifecycle adapter while legacy signatures migrate
- [x] `node -c` passes on all 179 modules
- [x] `scripts/check.ps1` passes (file sizes, docs freshness, unit tests, balance simulation, browser scenario smoke)

### 16.3 Commit
- Single commit: `feat: 100% complete — all skills, powers, enemies, bosses, quests, UI`
- Estimated: ~40 files changed, ~10,000 lines.

---

## Summary

| Phase | Scope | Files | Lines | Unlocks |
|-------|-------|-------|-------|---------|
| 1 | Projectile infra | 2 | 200 | Phase 2, 12 |
| 2 | 20 skill callbacks | 1 | 400 | Phase 3, 8 |
| 3 | 12 legendary powers | 1 new + 5 mod | 350 | Phase 16 |
| 4 | Passive tree | 1 new + 1 mod | 400 | Phase 16 |
| 5 | Rift HUD | 2 mod | 100 | Phase 16 |
| 6 | Difficulty HUD | 2 mod | 80 | Phase 16 |
| 7 | Glory FX | 2 mod | 80 | Phase 16 |
| 8 | Boss cores | 1 mod | 30 | Phase 16 |
| 9 | Full save | 2 mod | 60 | Phase 16 |
| 10 | Onboarding | 2 mod | 120 | Phase 16 |
| 11 | Settings panel | 1 mod | 200 | Phase 16 |
| 12 | Combat states | 3 mod | 600 | Phase 13 |
| 13 | Enemy variety | 7 new | 3500 | Phase 14 |
| 14 | World/quests | 5 new | 1200 | Phase 16 |
| 15 | Debt fixes | 5 mod | 150 | Phase 16 |
| 16 | Integration/QA | all | — | **SHIP** |

**Total estimate:** ~25 modified files, ~14 new files, ~7,500 new lines.

**Recommended execution:** Phases 1–11 can be done in any order (or parallel). Phase 12 depends on 1. Phase 13 depends on 12. Phase 14 depends on 13. Phase 15 is parallel. Phase 16 is last.
