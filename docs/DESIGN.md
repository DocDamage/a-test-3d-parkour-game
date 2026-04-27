# Design

## Core Belief: Parkour Is Combat

This is not a Diablo clone with parkour tacked on. It is a parkour game where every movement ability is also a combat skill. The "Vertical ARPG" identity means:

- **Wallrun** is a mobility skill with cooldown and resource cost
- **Dive Kick** is a melee nuke that requires being airborne
- **Slide Tackle** is crowd control that knocks enemies down
- **Ground Pound** is an AoE ultimate that scales with height
- **Air Dash** is an invincibility-frame escape

The skill bar (LMB/RMB/Q/E/R) is the primary interface. Parkour state transitions are the "animation frames" of our combat system.

## Skill Design Philosophy

| Slot | Role | Resource Pattern |
|------|------|-----------------|
| **LMB** | Generator | Builds resource, no cooldown |
| **RMB** | Spender | Consumes resource, short cooldown |
| **Q** | Utility | Moderate cooldown, tactical |
| **E** | Defense | Longer cooldown, survival |
| **R** | Ultimate | Long cooldown, massive impact |

## Archetype Identity

Each archetype has a distinct resource and playstyle:

- **Traceur** (Momentum): Build by moving, spend on big moves. Pure parkour-combat.
- **Operative** (Focus): Build by hitting, spend on stealth. Hit-and-run.
- **Saboteur** (Chaos): Build by exploding, spend on gadgets. Area denial.
- **Specimen** (Fury): Build by taking damage, spend on berserk. Risk-reward.
- **Netrunner** (Charge): Build over time, spend on hacks. Pet/drone master.

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
- **Enemy health bars** appear only when damaged (billboard sprites)
- **Damage numbers** float upward, color-coded by type, larger for crits
- **RPG panels** toggle with single keys (P, G, U, F, H, J, K, L, N)

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
- **Don't make gear auto-equip without notification.** Players need to know what they picked up.
- **Don't scale enemy HP without scaling damage.** Boring fights = longer TTK without higher lethality.
- **Don't add inventory management before combat feels good.** Auto-equip is fine until Phase 5.
