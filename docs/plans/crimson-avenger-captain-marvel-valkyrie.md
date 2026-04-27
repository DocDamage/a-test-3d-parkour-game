# Plan: Transform Into a Real ARPG (Diablo-Style)

## Current State Assessment

**What exists:** 24 RPG data modules (stats, progression, gear, factions, etc.) + parkour sandbox with NO real combat.

**Critical gap:** `COMBAT_EXPANSION_PLAN.md` was never implemented. Player cannot deal damage. Enemies have no health. Boss fight crashes because `player.takeDamage()` doesn't exist. Loot doesn't drop.

**The opportunity:** The parkour movement system is unique and polished. Instead of throwing it away to make a pure Diablo clone, we pivot to a **Vertical ARPG** — a genre blend where parkour *is* your combat rotation.

---

## The Vision: "Apex Rift"

A Diablo-style action RPG where:
- **Movement = Skills:** Wallrun, vault, slide, and air-dash are your mobility skills with cooldowns
- **Parkour = Combat:** Dive kick is your melee nuke. Ground pound is your AoE. Slide tackle is your CC.
- **Verticality = Identity:** Levels are towers, shafts, and stacked warehouses. You fight upward through rifts.
- **Build depth = Diablo:** Skill runes, legendary affixes, set bonuses, paragon, and infinite scaling

---

## Phase 1: Combat Foundation (The Missing Bedrock)

**Goal:** Make the player able to kill things and enemies able to fight back.

| System | What It Does | Files |
|--------|-------------|-------|
| **Player Health & Damage** | Add `health`, `maxHealth`, `takeDamage()`, `isDead` to Player.js. Add i-frames, death state, respawn. | `js/Player.js` |
| **DamageSystem** | Central damage calc with types (kinetic, energy, explosive, electric, freeze), resistances, crits. | `js/DamageSystem.js` |
| **HitboxSystem** | Sphere/box collision for player attacks vs enemies, enemy attacks vs player. | `js/HitboxSystem.js` |
| **Enemy Health** | Give all drones HP bars, death states, loot drops. Refactor DroneAI to support damage. | `js/DroneAI.js` |
| **Boss Fix** | Implement `player.takeDamage()` so the boss fight stops crashing. Wire boss cores to take damage. | `js/BossFight.js` |
| **Loot Drops** | Enemies drop scrap, chips, gear, and health globes on death. | `js/LootSystem.js` |

**Acceptance criteria:** Player can walk up to a drone, press attack, see damage numbers, kill it, and pick up loot.

---

## Phase 2: The Skill Bar (Diablo's Soul)

**Goal:** Turn parkour moves into a true ARPG skill system with cooldowns, runes, and synergies.

### 2.1 Active Skill System

5 skill slots: **LMB, RMB, Q, E, R** (mouse + keyboard, Diablo standard)

Each archetype has a skill tree with ~15 active skills and ~10 passives.

| Archetype | LMB (Generator) | RMB (Spender) | Q (Utility) | E (Defense) | R (Ultimate) |
|-----------|-----------------|---------------|-------------|-------------|--------------|
| **Traceur** | Light Strike | Dive Kick | Air Dash | Wallrun Escape | Infinite Wallrun |
| **Operative** | Silenced Pistol | Ghost Bullet | Predator Vision | Smoke Bomb | Assassinate |
| **Saboteur** | Scrap Throw | Grenade Toss | Proxy Mine | Decoy | Zero Cooldown |
| **Specimen** | Claw Swipe | Berserk Lunge | Roar | Adrenaline Rush | Primal Surge |
| **Netrunner** | Zap | Hack Drone | EMP Pulse | Firewall | Swarm Override |

**Skill Runes:** Each skill has 3 rune variants that change its behavior:
- Dive Kick: *Meteor* (burn zone) / *Concussion* (stun) / *Ricochet* (bounces to 2nd target)
- Grenade Toss: *Cluster* (splits) / *Gas* (poison cloud) / *Sticky* (attaches to enemy)

### 2.2 Passive Skill Tree

Each archetype has a passive tree (like Diablo 4 Paragon / Path of Exile):
- ~30 nodes per tree
- Nodes: +5% crit, +10% move speed, "Dive Kick refunds 50% stamina", "Killing an enemy resets Air Dash cooldown"
- Synergy nodes require adjacent unlocked nodes
- Respec costs chips

### 2.3 Cooldown & Resource Management

- **Generators** (LMB) build your archetype resource (Momentum/Focus/Chaos/etc.)
- **Spenders** (RMB) consume resource for big damage
- **Cooldowns** (Q/E/R) are time-gated
- **Cooldown Reduction** (CDR) is a core stat on gear
- **Resource Cost Reduction** is another core gear stat

---

## Phase 3: Deep Itemization (The Loot Loop)

**Goal:** Make every drop exciting and build-defining.

### 3.1 Core Stats Expansion

Gear now rolls the full Diablo stat suite:

| Stat Category | Examples |
|---------------|----------|
| **Offense** | Damage, Crit Chance, Crit Damage, Attack Speed, CDR, Area Damage |
| **Defense** | Armor, Max HP, HP Regen, Dodge, Block Chance, Resistance |
| **Utility** | Move Speed, Pickup Radius, Resource Cost Reduction, Gold Find, Magic Find |
| **Parkour** | Air Dash Charges, Wallrun Duration, Vault Speed, Slide Distance |

### 3.2 Legendary Powers

Legendary items don't just have stats — they change how skills work:

| Legendary | Effect |
|-----------|--------|
| *The Meteor's Kiss* | Dive Kick creates a 5m burn zone. Burn damage scales with MOB. |
| *Synapse Overclocker* | EMP Pulse also overcharges your next 3 skills (0 cooldown). |
| *Ghostwalkers* | After a silent takedown, become invisible for 3s. Invisibility breaks on attack. |
| *Kinetic Cascade Bracers* | Every 3rd melee hit releases a shockwave that damages all enemies in 4m. |
| *The Berserker's Valve* | Below 25% HP, all damage dealt is converted to healing. |

**Kanai's Cube equivalent:** Extract legendary powers and slot them into a "Mod Matrix" — 3 passive legendary effects that work even without wearing the item.

### 3.3 Set Items

6-piece sets with massive bonuses:

| Set Name | Theme | 2pc | 4pc | 6pc |
|----------|-------|-----|-----|-----|
| *The Freerun Cult* | Pure parkour | +20% move speed | Wallrun is infinite | Every parkour move deals 200% weapon damage to nearby enemies |
| *Wetwork Operatives* | Stealth | Silent takedowns work on elites | Invisibility lasts 2× longer | First attack out of invisibility deals 10× damage |
| *Demolition Corps* | Explosives | +25% explosive radius | Self-damage immune | Every 5th grenade is a nuke (10× damage, 15m radius) |

### 3.4 Gem System

- **Regular gems:** Socket into gear for raw stats (Ruby = damage, Sapphire = crit, Emerald = speed, Diamond = CDR)
- **Legendary Gems:** Level up by completing rifts. Each has a unique power:
  - *Gem of the Riftwalker:* +1% damage per floor cleared in current dive
  - *Gem of the Berserker:* While below 50% HP, deal +30% damage
  - *Gem of the Pack:* Companion drone gets 3 clone shadows

### 3.5 Item Tiers

| Tier | Drop Rate | Power |
|------|-----------|-------|
| Common | 60% | 0 affixes |
| Magic | 25% | 1-2 affixes |
| Rare | 10% | 3-4 affixes |
| Legendary | 4% | 4 affixes + legendary power |
| Set | 0.8% | 4 affixes + set bonus |
| Ancient Legendary | 0.15% | 30% stronger legendaries |
| Primal Ancient | 0.05% | Max-rolled perfect legendaries |

### 3.6 Identify System

Legendary and Set items drop as **Unidentified**. Must be identified at the safehouse or with a portable scanner (consumable). Creates anticipation and slows down loot evaluation.

---

## Phase 4: The Endgame Loop (Infinite Replayability)

### 4.1 Greater Rifts ("Apex Rifts")

Replace the basic Collapse/Sub-Level with a proper Greater Rift system:

- Enter a portal → procedural vertical tower
- Kill enemies to fill a progress bar
- Progress bar full → spawn Rift Guardian (random boss)
- Kill guardian in time limit → upgrade to next rift level
- Rift levels scale infinitely: +17% enemy HP/damage per level
- Rewards: Legendary gems, Primal drop chance, cosmetic wings

**Time limits:**
- Complete in < 10 min: upgrade +3 rift levels
- Complete in < 15 min: upgrade +1 rift level
- Fail time limit: no upgrade, reduced rewards

### 4.2 Nephalem Glory

Kill streak system:
- Kill 10 enemies without touching ground → +100% damage, +50% move speed, visual trail
- Kill 30 enemies → screen turns gold, all drops are Rare+
- Kill 50 enemies → guaranteed Legendary drop from next elite
- Streak breaks if you take damage or stop killing for 5s

This rewards aggressive parkour-combat flow.

### 4.3 Difficulty Tiers

| Tier | Enemy HP | Enemy Dmg | XP Bonus | Loot Bonus | Unlock |
|------|----------|-----------|----------|------------|--------|
| Normal | 1.0× | 1.0× | 0% | 0% | Start |
| Nightmare | 2.0× | 1.5× | +50% | +50% | Beat Act I |
| Hell | 4.0× | 2.5× | +100% | +100% | Beat Act II |
| Torment I | 8.0× | 4.0× | +200% | +200% | Beat Act III |
| Torment VI | 64.0× | 16.0× | +600% | +600% | Beat Game |
| Torment XVI | 4096.0× | 256.0× | +1500% | +1500% | Paragon 1000 |

### 4.4 Seasons

Every 3 months:
- Fresh seasonal characters (separate from non-seasonal)
- Seasonal theme modifier (e.g., "All explosions chain", "Gravity shifts every 60s")
- Seasonal journey (chapters with specific goals)
- Seasonal leaderboard: Highest rift level, fastest boss kill, longest kill streak
- Seasonal transmog rewards

### 4.5 Hardcore Mode

Character deletion on death. Separate leaderboard. Hardcore characters get:
- +10% magic find
- Unique "Near-Death" legendary affix pool
- Legacy bonus: retiring a hardcore character gives +2 dynasty points instead of +1

---

## Phase 5: Campaign Structure (Acts & Chapters)

**Goal:** Give the sandbox a narrative skeleton.

### 5.1 Act Structure

The warehouse is divided into **5 Acts**, each with a distinct biome and boss:

| Act | Biome | Boss | Theme |
|-----|-------|------|-------|
| I | Loading Docks | The Fabricator | Industrial / conveyor belts |
| II | Prison Block | The Warden | Security / turrets |
| III | Flooded Basement | The Leviathan | Water / toxic sludge |
| IV | Server Farm | The Architect | Holograms / shifting mazes |
| V | Hive Chamber | The Swarm Queen | Infestation / swarms |

Each act has:
- 6–8 story quests (bounties with narrative)
- 3 optional side dungeons
- 1 Keywarden (drops keys for Uber boss)
- Town portal to Safehouse hub

### 5.2 Adventure Mode

After beating the campaign:
- All acts unlocked simultaneously
- Bounties randomized across all acts
- Rifts accessible from any act
- Uber bosses craftable with Keywarden keys

---

## Phase 6: Economy & Crafting

### 6.1 The Mystic (Enchantress)

Safehouse NPC who can:
- **Enchant:** Reroll ONE affix on an item (like Diablo's Enchantress)
- **Transmog:** Change item appearance (cosmetic only)
- **Reforge:** Completely reroll a Legendary (costs Forgotten Souls)

### 6.2 The Blacksmith

- Craft weapons/armor from scrap + blueprints
- Salvage items into materials
- Upgrade item rarity (Rare → Legendary, costs Primal Essence)

### 6.3 The Jeweler

- Socket gems into gear
- Combine 3 gems of same tier → 1 gem of next tier
- Remove gems without destroying them

### 6.4 Currency

| Currency | Source | Use |
|----------|--------|-----|
| **Chips** | Enemy drops, quests | Shopping, identifying, fast travel |
| **Scrap** | Salvaging gear | Crafting, blacksmith upgrades |
| **Forgotten Souls** | Salvaging Legendaries | Enchanting, reforging |
| **Primal Essence** | Salvaging Ancients | Upgrading to Ancient/Primal |
| **Rift Shards** | Bounties | Opening Greater Rifts |
| **Blood Shards** | Rift Guardians | Gambling for random gear |

### 6.5 Gambling (Kadala-style)

Spend Blood Shards for random items by slot:
- 25 shards = random Common/Rare
- 75 shards = guaranteed Legendary (random slot)
- The thrill of the gamble without the slog of farming

---

## Phase 7: Social & Leaderboards

### 7.1 Clans / Factions

Join a player faction (not the drone factions):
- **The Runners:** Parkour-focused, speedrun leaderboards
- **The Cell:** Stealth-focused, no-alert challenge leaderboards
- **The Vanguard:** Combat-focused, DPS and rift leaderboards
- **The Collectors:** Lore-focused, completionist leaderboards

Faction tournaments every weekend with unique rewards.

### 7.2 Leaderboards

| Category | Metric |
|----------|--------|
| Apex Rift | Highest rift level cleared |
| Speed Kill | Fastest boss kill (any boss) |
| Kill Streak | Longest Nephalem Glory streak |
| Pure Parkour | Fastest Act I–V completion without weapons |
| Hardcore | Highest rift level on Hardcore |

---

## Implementation Roadmap

### Sprint 1: Combat Foundation (Week 1)
- Player health, takeDamage, death, respawn
- DamageSystem + HitboxSystem
- Enemy health bars + death + loot drops
- Fix boss fight crash
- Basic attack input (LMB = light melee)

### Sprint 2: Skill System (Week 2)
- Skill bar (LMB/RMB/Q/E/R)
- 5 archetype skill trees (15 active + 10 passive each)
- Rune system (3 variants per skill)
- Cooldown + resource management

### Sprint 3: Deep Itemization (Week 3)
- Expanded affix pool (CDR, Area Damage, etc.)
- Legendary powers (20 legendaries)
- 3 full 6-piece sets
- Gem system (regular + legendary)
- Ancient/Primal tiers
- Identify system

### Sprint 4: Endgame Loop (Week 4)
- Greater Rifts with infinite scaling
- Nephalem Glory kill streaks
- Difficulty tiers (Normal → Torment XVI)
- Season framework
- Hardcore mode

### Sprint 5: Campaign & Economy (Week 5)
- 5 acts with quests and narrative
- Adventure mode unlock
- Blacksmith, Mystic, Jeweler NPCs
- Full currency economy
- Gambling system

### Sprint 6: Polish & Launch (Week 6)
- Leaderboards
- Clan system
- Balance pass across all 5 archetypes
- Bug fixes, performance, UI polish

---

## Decision Point

**Option A: Full Diablo Pivot**
Implement everything above — combat, skills, itemization, endgame, campaign — turning this into a full vertical ARPG. Estimated 30,000+ lines, 6 weeks.

**Option B: Minimum Viable ARPG**
Implement only Phases 1–3 (combat + skills + itemization) and use existing Collapse/Sub-Level as the endgame. Skip campaign, seasons, and clans for now. Get the core loop feeling good first. Estimated 15,000 lines, 3 weeks.

**Recommendation:** Option B. The existing 24 RPG modules give us a massive head start on data/UI. Adding combat + skills + loot drops will immediately make this feel like a real game. Endgame and campaign can come after the core loop is addictive.
