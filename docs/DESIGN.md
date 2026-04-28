# Design

## Core Belief: Parkour Is Combat

This is not a Diablo clone with parkour tacked on. It is a parkour game where every movement ability is also a combat skill. The "Vertical ARPG" identity means:

- **Wallrun** is a mobility skill with cooldown and resource cost
- **Dive Kick** is a melee nuke that requires being airborne
- **Slide Tackle** is crowd control that knocks enemies down
- **Ground Pound** is an AoE ultimate that scales with height
- **Air Dash** is an invincibility-frame escape

The skill bar (LMB/RMB/Q/E/R) is the primary interface. Parkour state transitions are the "animation frames" of our combat system.

## First-Session Loop

The current playable loop is intentionally direct:

1. **Orient** — give the player a safer start lane, camera time, and vertical space before pressure ramps.
2. **Scavenge** — teach loot pickup with chips and a starter weapon cache.
3. **Hunt** — ask for one drone kill using movement, weapons, and the current camera mode.
4. **Gear Up** — route rewards into the infinite backpack and invite equipment decisions.
5. **Escalate** — open Apex Rift when the player chooses to push into endgame pressure.

`ApexRunLoopDirector` owns this guidance layer. It should stay light: spawn through existing systems, show objectives, add small visual landmarks, and never become a second game director.

## Skill Design Philosophy

| Slot | Role | Resource Pattern |
|------|------|-----------------|
| **LMB** | Generator | Builds resource, no cooldown |
| **RMB** | Spender | Consumes resource, short cooldown |
| **Q** | Utility | Moderate cooldown, tactical |
| **E** | Defense | Longer cooldown, survival |
| **R** | Ultimate | Long cooldown, massive impact |

## Archetype Identity

Each archetype has a distinct resource and playstyle. **All 25 skills across 5 archetypes are now wired and playable.**

- **Traceur** (Momentum): Build by moving, spend on big moves. Pure parkour-combat.
  - LMB: light_strike | RMB: dive_kick | Q: air_dash | E: slide_tackle | R: ground_pound
- **Operative** (Focus): Build by hitting, spend on stealth. Hit-and-run.
  - LMB: silenced_pistol | RMB: ghost_bullet | Q: predator_vision | E: smoke_bomb | R: assassinate
- **Saboteur** (Chaos): Build by exploding, spend on gadgets. Area denial.
  - LMB: scrap_throw | RMB: grenade_toss | Q: proxy_mine | E: decoy | R: zero_cooldown
- **Specimen** (Fury): Build by taking damage, spend on berserk. Risk-reward.
  - LMB: claw_swipe | RMB: berserk_lunge | Q: roar | E: adrenaline_rush | R: primal_surge
- **Netrunner** (Charge): Build over time, spend on hacks. Pet/drone master.
  - LMB: zap | RMB: hack_drone | Q: emp_pulse | E: firewall | R: swarm_override

## Rarity Color Language

We follow Diablo conventions so players immediately understand drop quality:

| Tier | Color | Hex | Affixes | Special |
|------|-------|-----|---------|---------|
| Common | Grey | `#aaaaaa` | 0 | — |
| Magic | Blue | `#4488ff` | 1 | — |
| Rare | Yellow | `#ffcc00` | 2 | — |
| Legendary | Orange | `#ff8800` | 3 | Legendary power |
| Set | Green | `#00ff44` | 3 | Set bonus |
| Ancient | Red | `#ff4444` | 3 | +30% stats |
| Primal | Magenta | `#ff00ff` | 4 | Max rolls |

## Damage Type Language

| Type | Color | Effect |
|------|-------|--------|
| Kinetic | White | Base damage, no modifier |
| Energy | Orange | Halved vs shields |
| Explosive | Red | 2× vs non-rolling targets |
| Electric | Cyan | Drains shield first, then stuns |
| Freeze | Light Blue | Slows, stacks to stun |

## UI Principles

- **Skill bar is always visible** when in-game (bottom center)
- **Player health bar** is always visible (bottom center, below skill bar)
- **Run loop objective** is visible during the first session so the sandbox has a readable next action
- **Enemy health bars** appear when damaged; always visible if Omniscience legendary power is equipped
- **Damage numbers** float upward, color-coded by type, larger for crits
- **RPG panels** toggle with single keys:
  - **P** — Passive Tree
  - **Shift+P** — Character Panel
  - **G** — Gear Panel
  - **U** — Companion Panel
  - **F** — Faction Panel (when not in dialogue/shop/dungeon)
  - **H** — Safehouse Panel
  - **J** — Bounty Panel
  - **K** — Codex Panel
  - **L** — Mastery Panel
  - **N** — Implants Panel
  - **O** — Settings Panel
  - **Shift+O** — Rising Tide toggle
  - **T** — Apex Rift
  - **M** — Cycle Difficulty Tier

## Asset Direction

- Real assets should improve readability first: traversal edges, pickup type, enemy threat, weapon family, and character silhouette.
- Character creation uses modular body bases, limb/part slots, gear overlays, colors, and runtime seam armor. Stats still come from origin, archetype, gear, and RPG systems rather than from cosmetic body choices.
- The level editor should feel like a toy box: fast placement, visible previews, curated asset palettes, local save/load, and export/import for sharing layouts.
- Authored OGG sounds should be curated into short runtime cues. Source WAV/MP3 libraries stay outside the browser load path.

## Progression Pacing

| Milestone | Time to Reach | Unlocks |
|-----------|--------------|---------|
| Character creation | 0 min | Origin + Archetype choice |
| First skill slot filled | 5 min | Combat feels like Diablo |
| First legendary drop | 15 min | Item hunt begins |
| First Apex Rift clear | 30 min | Endgame loop opens |
| Torment I | 2 hours | Difficulty tiers |
| Rift Level 10 | 4 hours | Higher Torment tiers |
| Rift Level 100 | 20+ hours | Primal drops |

## Anti-Patterns

- **Don't add cooldowns to parkour moves without visual feedback.** The skill bar must show the cooldown.
- **Don't scale enemy HP without scaling damage.** Boring fights = longer TTK without higher lethality.
- **Don't add inventory management before combat feels good.** Auto-equip is fine until Phase 5.
