# Plan: Complete All Incomplete Features in Apex Rift

## TL;DR
Research confirmed: Traceur is 100% wired; 20 skills across 4 archetypes have zero callbacks. LegendaryPowerSystem and PassiveTree don't exist. Rift/Difficulty UI is console.log only. NephalemGlory has rendering fields but no output. Plan covers 12 phases in dependency order — new files + targeted edits to main.js and index.html.

---

## Phase 1 — Ranged Projectile Infrastructure *(blocks Phase 2)*

**New file: `js/ProjectileManager.js`**
- Class `ProjectileManager` with `(scene, world)` constructor
- `fire(origin, direction, config)` — spawns a THREE.Mesh projectile (small sphere), moves it each frame, calls `config.onHit(target)` on collision with enemy hitboxes or collidables
- `firePiercing(origin, direction, config)` — same but passes through all enemies in a line (for `ghost_bullet`)
- `fireChainLightning(origin, targets[], config)` — hops to nearest successive targets (for `zap`)
- `update(dt)` — advance all live projectiles, cleanup expired
- Imported in `main.js`, instantiated after `world` + `player`

**Relevant patterns:** Mirror how `HitboxSystem.registerHitbox()` creates short-lived sphere hitboxes (`js/HitboxSystem.js`); ProjectileManager is essentially a persistent-trajectory version of the same idea.

---

## Phase 2 — Complete All 4 Archetype Skill Callbacks *(depends on Phase 1)*

20 `skillSystem.onExecute('skill_id', callback)` calls added to `js/main.js`, following the exact pattern of the 5 existing Traceur callbacks at ~line 218.

### Operative (resource: Focus, color: #00ccff)

1. **`silenced_pistol`** — `ProjectileManager.fire()` 25m in facing direction. On hit: `target.takeDamage(skill.finalDamage, 'kinetic', p)` + `spawnDamageNumber(...)` + `resource.generate(skill.finalResourceGen)`.
2. **`ghost_bullet`** — `ProjectileManager.firePiercing()` hits ALL enemies in a line up to 25m. Each takes `skill.finalDamage` energy damage.
3. **`predator_vision`** — Set `player._predatorVisionActive = true` for 6s. Force all `EnemyHealthBar` visible. Add `player._critBonusFromPredator = 0.15`. Blue-tinted DOM overlay at low opacity.
4. **`smoke_bomb`** — Spawn particle cloud at `p.position`. Set `player.isInvisible = true` for 3s. Nearest DroneAI targets nulled inside 4m. Dark vignette DOM pulse.
5. **`assassinate`** — Find nearest enemy ≤15m via `world.drones.drones`. Teleport `p.position` behind target. Register immediate `Hitbox` for `skill.finalDamage` kinetic. Camera shake.

### Saboteur (resource: Chaos, color: #ff3333)

6. **`scrap_throw`** — `ProjectileManager.fire()` range 12m, kinetic damage, generates Chaos on hit.
7. **`grenade_toss`** — Lob projectile with 1.5s delay. On land: `HitboxSystem` sphere `radius: 4`, explosive damage, particle explosion via `ParticleEffects`.
8. **`proxy_mine`** — Spawn glowing THREE.Mesh cube at player feet. Store in `world._proximityMines[]`. Each frame: check drone distances; explode at `dist < 3m` (`radius: 3, damage: 40`). Auto-remove after 30s.
9. **`decoy`** — Spawn player-geometry clone forward. Enemies within 10m target it. Explodes on death (30 damage) or despawns after 5s.
10. **`zero_cooldown`** — Add `SkillSystem.setNoCooldown(true/false)`. Set `resource.costMultiplier = 0`. Both active for 5s.

### Specimen (resource: Fury, color: #ff0066)

11. **`claw_swipe`** — `Hitbox` sphere `radius: 1.5`, 180° front-hemisphere filter, hits ≤3 enemies, generates Fury.
12. **`berserk_lunge`** — Find nearest enemy ≤15m. Teleport-lunge to target. `Hitbox` sphere `radius: 3` on landing. Camera shake.
13. **`roar`** — All enemies within 6m: `_feared = true` for 2s (DroneAI flees). `resource.generate(20)`. Bass audio burst via `AudioManager`.
14. **`adrenaline_rush`** — `player.moveSpeedMultiplier *= 1.5`, `player._regenPerSecond += 0.05 * maxHealth` for 5s. Undo on expiry.
15. **`primal_surge`** — `player._damageMultiplier *= 2.0`, `moveSpeedMultiplier *= 1.5`, `_staggerImmune = true` for 6s. Red vignette DOM pulse. Undo on expiry.

### Netrunner (resource: Charge, color: #aa66ff)

16. **`zap`** — `ProjectileManager.fireChainLightning()` to nearest enemy ≤15m, chains to 1 more within 6m at 50% damage. Electric. Generates Charge. Purple arc particle.
17. **`hack_drone`** — Nearest non-allied drone ≤12m: `drone.team = 'player'`, `drone._hackExpiry = 8s`. DroneAI attacks other drones while hacked. Reverts on expiry. "HACKED" floating text.
18. **`emp_pulse`** — `Hitbox` sphere `radius: 5`. Each enemy hit: `_disabled = true` for 3s (DroneAI skips update). Electric damage. EMP ring particle.
19. **`firewall`** — `player._firewallActive = true` for 4s. Projectiles hitting player while active are destroyed. Translucent blue sphere mesh around player for duration.
20. **`swarm_override`** — All drones ≤15m: `drone.team = 'player'`, `drone._hackExpiry = 8s`. Purple ring particle burst at each drone.

**Supporting change in `js/DroneAI.js`:** Add `_feared`, `_disabled`, `_hackExpiry` flag handling. Skip update while `_disabled`; flee while `_feared`; attack own team while hacked.

---

## Phase 3 — LegendaryPowerSystem.js *(depends on Phase 2)*

**New file: `js/LegendaryPowerSystem.js`**

Class `LegendaryPowerSystem` with `(player, world, scene, hitboxSystem, damageSystem, bulletTime)` constructor. All 12 powers from `js/AffixSystem.js` finally execute.

### Event hooks
- `onMeleeHit(target)` — called from `light_strike`/`claw_swipe` callbacks in `main.js`
- `onJump(isDoubleJump)` — called from Player.js state machine jump trigger
- `onSprint(dt)` — called each frame while sprinting
- `onTakeFatalDamage()` — returns `true` if power blocked death
- `onEnemyKilled(enemy)` — called from enemy death handler

### Powers

| Power ID | Trigger | Implementation |
|---|---|---|
| `fabricators_torch` | `onMeleeHit` | `enemy._burning = {dmg: 20, duration: 4s}` |
| `swarm_link` | `onEnemyKilled(drone)` | 20% chance: spawn allied clone drone at death pos |
| `temporal_shift` | `onJump(isDoubleJump=true)` | `bulletTime.start(0.5)` |
| `void_walk` | `onSprint` + enemy overlap | `enemy._ethereal = true` for 2s |
| `boss_slayer` | `onDamageDealt(target, amt)` | If `target.isBoss`: `amt * (1 + affix.value)` |
| `aegis_field` | `onPerfectParry` | `player._shield = 30` absorb buffer for 3s |
| `loot_beacon` | Passive stat | Sets `player._lootPickupRadius` via `getRPGStats()` |
| `second_life` | `onTakeFatalDamage` | Once per 5min: block death, heal to 30% max HP |
| `chain_lightning` | `onMeleeHit` (every hit) | Arc to 2 enemies within 6m at 50% damage |
| `omniscience` | Passive, always on | `EnemyHealthBar.alwaysVisible = true` while equipped |
| `kinetic_cascade` | `onMeleeHit` (3rd hit) | `Hitbox` sphere `radius: 4, damage: 30` at player pos |
| `adrenaline_surge` | Passive, each frame | If `player.health < 30% max`: +20% damage, +15% speed |

`getActivePowers(player)` reads `ExoSuitSystem.getEquippedAffixes()` → filters `affix.power` fields. `legendaryPowerSystem.update(dt)` in animate loop.

---

## Phase 4 — PassiveTree.js *(parallel with Phases 5–7)*

**New file: `js/PassiveTree.js`**

Class `PassiveTree` with `(archetypeId, skillSystem)` constructor. Reads `PASSIVE_TREES[archetypeId]` from `SkillData.js` (all 50 nodes across 5 archetypes already defined there).

- `investPoint(nodeId)` — validates `requires[]` met, `currentRank < maxRank`, `availablePoints > 0`
- `computeBonuses()` — aggregates invested-rank bonuses → calls `skillSystem.setPassiveBonuses(bonuses)`
- `availablePoints` increments +1 on level-up via `ProgressionSystem` level-up callback
- `serialize()` / `deserialize()` — `localStorage.setItem('apex_passives', ...)`

**DOM panel `#passive-tree`** in `index.html` (P key toggle):
- 10 node buttons per archetype in 2-column grid
- Each shows: name, `rank/maxRank`, description, lock state (grey if `requires[]` not met)
- "Spend Point" button disabled if locked or max rank or no points available
- Available points counter at top, color-coded by archetype resource color

---

## Phase 5 — Rift HUD *(parallel with Phases 4, 6, 7)*

**`index.html`:** Add `#rift-hud` div (hidden by default) showing:
- Rift level + countdown timer (counts down from `timeLimit`)
- Progress bar (fill width = `progress / 100 * 100%`)
- Wave number (`this.floor`) + kill count (`this.kills`)
- "GUARDIAN SPAWNED" flash text on guardian spawn
- Result overlay on rift end: CLEARED / FAILED + time used + levels gained

**`js/ApexRiftSystem.js`:**
- Add `_updateHUD()` — called at top of `update(dt)`, sets `textContent`/`style.width` on DOM elements
- `startRift()` — `document.getElementById('rift-hud').style.display = 'block'`
- `endRift()` — show result overlay, hide HUD after 3s delay

---

## Phase 6 — Difficulty HUD Badge *(parallel with Phases 4, 5, 7)*

**`index.html`:** Persistent `#difficulty-badge` top-right corner. Color classes per tier (Normal=grey, Nightmare=blue, Hell=orange, Torment I–VI=red shades). Click opens `#difficulty-popup` listing all tiers, locked ones greyed out.

**`js/DifficultyTierSystem.js`:** Add `updateHUD()` — sets badge text + color class. Call at end of `setTier()` and `_load()`. Wire into `main.js` M-key handler after tier cycle.

---

## Phase 7 — NephalemGlory Visual FX *(parallel with Phases 4, 5, 6)*

The class already has `screenTint`, `trailActive`, `damageMultiplier` fields — just no DOM calls.

**`index.html`:** Add `#glory-overlay` — fixed fullscreen div, `pointer-events: none`, initially `opacity: 0`.

**`js/NephalemGlory.js`:** In `_applyTier(tier)` ADD:
- Tier 1: `#glory-overlay` gold at `opacity: 0.08` + spawn persistent particle trail on player
- Tier 2: orange at `opacity: 0.15` + all enemy health bars pulse gold
- Tier 3: red at `opacity: 0.25` + spawn floating "NEPHALEM GLORY" text

`_clearTier()` fades overlay to 0, stops trail. `_gloryEl = document.getElementById('glory-overlay')` in constructor.

---

## Phase 8 — Boss Cores Damageable *(depends on Phase 2)*

Phase 2 ranged skills (`silenced_pistol`, `ghost_bullet`, `zap`, `scrap_throw`) naturally solve this for Operative, Netrunner, Saboteur. For Traceur/Specimen (melee-only):

**`js/BossFight.js`:**
- In `_chooseAttack()` Phase 3 windup block: extend core exposure from 1.5s → 3.0s
- Temporarily add `cores[0]` to `world.collidables` during windup so melee player can reach it
- Expose `cores[1]` and `cores[2]` during their respective Phase 2 vulnerable states

---

## Phase 9 — Full Save System *(parallel with Phases 1, 10)*

**`js/CharacterSheet.js`:** Add `_save()` / `_load()` with `localStorage.setItem('apex_character', ...)`. Call `_save()` at end of `levelUp()` and `spendAttributePoint()`.

**`js/ExoSuitSystem.js`:** Add `_save()` / `_load()` with `localStorage.setItem('apex_exosuit', ...)`. Call `_save()` at end of `equip()`.

**`js/main.js`:** Call `characterSheet.load()` and `exoSuitSystem.load()` before first frame.

PassiveTree save/load covered in Phase 4.

---

## Phase 10 — Onboarding Hints + Loot Toast *(parallel with Phases 1, 9)*

**`index.html`:**
- Add `#hint-toast` — center-screen fade-in/out, auto-hides after 4s
- Add `#loot-toast` — bottom-right item card (rarity-colored name + first affix text)

**`js/main.js`:** `_shownHints` Set tracking fired hints. Hook into Player.js state transitions (wallrun entry, grapple entry) and first kill → `showHint(text)`. On gear equip: `showLootToast(item)`.

| Trigger | Message |
|---|---|
| First wallrun | "Wallrun — press SPACE to jump off!" |
| First grapple | "Hold RMB to grapple-swing. Release to fly!" |
| First enemy kill | "Loot drops! Walk over items to pick them up." |
| First Legendary drop | "LEGENDARY! Check your gear stats (G key)." |
| First Rift unlock | "Press T to enter the Apex Rift — endgame awaits." |

---

## Phase 11 — Settings Panel *(parallel with Phase 12)*

**`index.html`:** Add `#settings-panel` (O key toggle):
- **Graphics:** FOV slider (60–120°), checkboxes for Film Grain / Motion Blur / SAO / Bloom / Chromatic Aberration / Vignette
- **Audio:** Master / SFX / Music volume sliders (0–100)
- **Accessibility:** Merge `AssistMode._buildUI()` options into this panel

**`js/PostProcessing.js`:** Add `setEffectEnabled(name, bool)` and `setFOV(degrees)`. Wire FOV to camera.

**`js/AudioManager.js`:** Add `setMasterVolume(v)`, `setSFXVolume(v)`, `setMusicVolume(v)` scaling the `AudioContext` GainNode.

---

## Phase 12 — Gamepad Rumble *(parallel with Phase 11)*

**`js/GamepadController.js`:** Add `rumble(weakMagnitude, strongMagnitude, durationMs)` calling `gamepad.vibrationActuator.playEffect('dual-rumble', {...})` if available.

| Event | Weak | Strong | Duration |
|---|---|---|---|
| Player takes damage | 0.3 | 0.7 | 100ms |
| Light melee hit | 0.1 | 0.4 | 50ms |
| Ground pound / berserk lunge | 0.5 | 1.0 | 200ms |

Pass `gamepadController` into damage handler and heavy skill callbacks in `main.js`.

---

## Files Modified

| File | Changes |
|---|---|
| `js/main.js` | +20 archetype callbacks, proxy mines loop, decoy loop, legendary power hooks, save init, hint system |
| `js/ProjectileManager.js` | **NEW** — fire, firePiercing, fireChainLightning, update |
| `js/LegendaryPowerSystem.js` | **NEW** — 12 powers, event hooks |
| `js/PassiveTree.js` | **NEW** — node investment, bonus computation, save/load |
| `js/DroneAI.js` | +`_feared`, `_disabled`, `_hackExpiry` flag handling |
| `js/ApexRiftSystem.js` | +`_updateHUD()` in update/startRift/endRift |
| `js/DifficultyTierSystem.js` | +`updateHUD()` in setTier/_load |
| `js/NephalemGlory.js` | +DOM glory overlay, particle trail calls |
| `js/BossFight.js` | +Extend Phase 3 core exposure to 3s, add to collidables during windup |
| `js/CharacterSheet.js` | +`_save()`/`_load()` localStorage |
| `js/ExoSuitSystem.js` | +`_save()`/`_load()` localStorage, +loot toast call |
| `js/GamepadController.js` | +`rumble()` method |
| `js/PostProcessing.js` | +`setEffectEnabled()`, +`setFOV()` |
| `js/AudioManager.js` | +volume control methods |
| `index.html` | +rift-hud, +difficulty-badge, +glory-overlay, +hint-toast, +loot-toast, +settings-panel, +passive-tree panel |

---

## Execution Order

**Start in parallel (no dependencies between them):**
- Phase 1 (ProjectileManager) — needed by Phase 2
- Phase 9 (Save system)
- Phase 10 (Onboarding/toasts)

**Then in parallel (once Phase 1 is done):**
- Phase 2 (All 20 archetype callbacks)
- Phase 4 (PassiveTree)
- Phase 5 (Rift HUD)
- Phase 6 (Difficulty badge)
- Phase 7 (Nephalem FX)
- Phase 11 (Settings panel)
- Phase 12 (Gamepad rumble)

**After Phase 2:**
- Phase 3 (LegendaryPowerSystem) — hooks into Phase 2 callbacks
- Phase 8 (Boss cores) — ranged skills from Phase 2 solve it for most archetypes

---

## Verification Checklist

1. Create Operative → fire `silenced_pistol` (LMB) at drone → damage registers, Focus fills
2. Create Saboteur → throw grenade (RMB) → explosion AoE kills drone group in radius
3. Create Specimen → `claw_swipe` (LMB) hits 3 enemies → `primal_surge` (R) turns player red, doubles damage
4. Create Netrunner → `zap` chains lightning → `hack_drone` converts drone to ally → `swarm_override` mass-hacks all
5. Equip Legendary with `fabricators_torch` → melee hit applies burning DoT (visual tick + damage numbers)
6. Press P → passive tree panel opens → spend point on `Flow State` → move speed visibly increases
7. Press T → Rift HUD visible with live timer + progress bar → kill enemies → bar fills → guardian spawns
8. Press M → difficulty badge updates in top-right with correct tier color
9. Kill 10 enemies without taking damage → screen edges tint gold (Nephalem Tier 1)
10. Boss Phase 3 sweepBeam wind-up → core hittable for 3s → melee damage registers
11. Refresh page → character level, gear, and passive points all restored from localStorage
12. First wallrun → hint toast appears center-screen with jump tip

---

## Scope Boundaries (Excluded)

- **Rune selection UI** — runes exist in `SkillData.js` but selecting them is lower priority than skills working at all. Post-launch pass.
- **Inventory / stash panel** — auto-equip remains. Full stash UI depends on stable gear system; separate follow-up.
- **Gem system** — not designed anywhere in the codebase yet. Needs design work first.
- **Full weapon system** — architecture-level work planned in `COMBAT_EXPANSION_PLAN.md`; requires its own plan.
- Proxy mines stored in `world._proximityMines[]` — do NOT add to `world.collidables[]` (trigger volumes, not collision surfaces).
