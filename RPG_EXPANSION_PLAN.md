# PARKOUR RPG EXPANSION — Master Plan

## Overview

Transform the movement-combat hybrid into a full **character-driven RPG**. Every jump, every bullet, and every drone takedown now feeds into persistent progression, build-defining choices, and a world that reacts to who you are.

**Design pillars:**
1. **Build Identity Over Power** — Your stats, archetype, and gear define how you play, not just how hard you hit
2. **The World Remembers** — Factions, NPCs, and the environment track your choices
3. **Permanent Consequences** — Implants, debt, and retirement make every run unique
4. **Infinite Depth** — Sub-Levels and NG+ give hardcore players an endless endgame

---

## PHASE 1: CORE CHARACTER SYSTEM

### 1.1 The Six Attributes

**File:** `js/CharacterSheet.js` (new)

All player scaling flows from six core stats. Every level-up grants **2 attribute points**. Soft cap at 30; hard diminishing returns at 50.

| Stat | Name | Governs | 1 Point = |
|------|------|---------|-----------|
| **MOB** | Mobility | Sprint speed, wallrun duration, jump height, dodge distance | +2% move speed, +0.1s wallrun |
| **REF** | Reflex | Parry window, aim stability, weapon swap speed, crit chance | +0.01s parry window, +1.5% crit |
| **SYN** | Synthesis | Flow meter gain, hack speed, drone hijack duration, EMP radius | +3% flow gain, +5% hack speed |
| **FOR** | Fortitude | Max HP, stamina pool, knockback resistance, status duration | +3 HP, +2 stamina |
| **TEC** | Tech | Crafting quality, mod effectiveness, turret damage, trap detection | +5% mod bonus, +1 trap sense range |
| **GUT** | Guts | Death Rewind charges, panic roll i-frames, shop haggling | +1% haggle, +0.02s i-frames |

**Derived stat — Gear Score:**
```javascript
gearScore = Math.floor(averageItemRarity * (mob + ref + for) / 10);
```
Arena modes gate entry by Gear Score, not story progress.

**UI:** Attribute panel accessible from Inventory (I key). Hover shows current value, next-point preview, and soft-cap warning.

### 1.2 Leveling & XP

**File:** `js/ProgressionSystem.js` (new)

- **Level cap:** 50
- **XP sources:** Enemy kills, boss defeats, arena completions, bounty turn-ins, Codex discoveries
- **XP curve:** Exponential; level 10 ≈ 2h play, level 50 ≈ 40h
- **Respec:** Costs chips; cost scales with level. First respec free.

### 1.3 Runner Archetypes (Classes)

**File:** `js/ArchetypeSystem.js` (new)

Pick at character creation. Each archetype has a **unique resource** mechanic, a **starter kit**, and a **capstone ability** at level 20.

| Archetype | Resource | Build Mechanic | Capstone (Lv20) |
|-----------|----------|----------------|-----------------|
| **Traceur** | *Momentum* | Chains parkour without touching ground → spend on Parkour Ultimates | *Infinite Wallrun* — 8s of unlimited wallrun/celing run |
| **Operative** | *Focus* | Standing still or crouching builds Focus → spend on Precision Strikes | *Ghost Bullet* — next shot is silent, penetrates shields, guaranteed crit |
| **Saboteur** | *Chaos* | Destroying objects/causes explosions builds Chaos → spend on Overclock | *Zero Cooldown* — all gadgets have 0 cooldown for 5s |
| **Specimen** | *Adrenaline* | Health below 50% builds Adrenaline → spend on Primal Surge | *Berserk* — +100% melee, +10 HP/s regen, can't use guns, 8s duration |
| **Netrunner** | *Bandwidth* | Hacking drones/terminals builds Bandwidth → spend on Daemon Upload | *Swarm Override* — possess up to 3 drones simultaneously |

**Multiclassing:**
- Level 20: Unlock second archetype at 50% efficiency
- Level 40: Unlock third archetype at 25% efficiency
- Example: *Traceur/Netrunner* = parkour hacker; *Saboteur/Specimen* = suicide demolitionist

### 1.4 Runner Origins

**File:** `js/OriginSystem.js` (new)

Background selected at creation. Gives starting gear + passive + unique dialogue tags.

| Origin | Passive | Starter Exo-Suit Piece | Dialogue Tag |
|--------|---------|------------------------|--------------|
| **Corporate Defector** | +25% chip drops | *Negotiator Frame* — shops -10% cost | Corporates fear you, drones recognize your ID |
| **Street Traceur** | Vault regenerates 5 stamina | *Freerun Boots* — wallrun +2s | Street NPCs give free tips |
| **Military Washout** | AR reload +30% | *Tac-Optics* — ADS FOV 65° | Military drones hesitate 0.5s before firing |
| **Salvage Rat** | Dismantle +50% scrap | *Junker Gloves* — melee harvests 1 scrap | Scavengers offer side quests |

---

## PHASE 2: GEAR & LOOT

### 2.1 Exo-Suit Loadout System

**File:** `js/ExoSuitSystem.js` (new)

4 gear slots beyond weapons: **Frame** (torso), **Boots**, **Gloves**, **Optics**.

| Slot | Example Gear | Effect |
|------|-------------|--------|
| Frame | *Kinetic Weave* | +15% melee dmg, -10% max stamina |
| Frame | *AeroFrame* | Air dash costs 0 stamina, -20 HP max |
| Boots | *Mag-Stompers* | Ceiling drop +15 dmg |
| Boots | *Ghost Soles* | Crouch-walk completely silent |
| Gloves | *Shock Gauntlets* | Light attacks 15% stun chance |
| Optics | *Predator Lens* | V reveals enemy weak points |

**Set Bonuses:**
| Manufacturer | 2pc Bonus | 4pc Bonus |
|--------------|-----------|-----------|
| *Synapse Industries* | EMP radius +4m | Hijacked drones last 2× longer |
| *Redline Athletics* | Shoulder bash breaks all shields | Sprinting leaves fire trail (5/s DOT) |
| *Hollow Corp* | Explosive radius +25% | Self-damage from explosions reduced 75% |
| *Ghostworks* | Silent takedowns work on elites | While crouched, enemies detect you at 1m range |

### 2.2 Affix System

**File:** `js/AffixSystem.js` (new)

Every gear piece rolls 1–4 random affixes.

| Tier | Roll Count | Example Affixes |
|------|------------|-----------------|
| Common | 1 | +5% reload, +2 max stamina |
| Rare | 2 | +15% crit dmg vs airborne, ground pound +1m radius |
| Epic | 3 | *Kinetic Cascade* — every 3rd melee hit releases shockwave |
| Legendary | 4 | *Fabricator's Torch* — melee applies Burning; boss-only |

**Rerolling:** Spend *Boss Cores* at safehouse to reroll one affix. Cost doubles each attempt on same item.

### 2.3 Weapon Familiarity

**File:** `js/FamiliaritySystem.js` (new)

Soul-bound weapon progression.

| Kills | Bonus |
|-------|-------|
| 50 | +5% damage |
| 200 | Named weapon; custom killfeed |
| 500 | Unique skin + hidden affix slot |
| 1000 | *Legendary Status* — can't drop; becomes NG+ heirloom |

---

## PHASE 3: WORLD & FACTIONS

### 3.1 Faction Reputation

**File:** `js/FactionSystem.js` (new)

Three drone factions control the warehouse.

| Faction | Color | Strength | Weakness |
|---------|-------|----------|----------|
| **Vanguard** | Red | Heavy armor, shields, squad tactics | Slow, flankable |
| **Synapse** | Cyan | Cloaked, jammers, platform hackers | Fragile, EMP vulnerable |
| **Hollow** | Yellow | Suicide drones, sappers, minelayers | Disorganized, kill command drone = retreat |

**Reputation Tiers:** Hated (-100) → Hostile (-50) → Neutral (0) → Friendly (+50) → Allied (+100)
- Allied faction drones ignore you and fight *for* you against rivals
- Hostile factions send bounty hunter squads to your location

**File:** `js/TerritorySystem.js` (new)

Warehouse divided into **12 Sectors**. Each has a control meter (0% = drone-owned, 100% = liberated).

- **Liberate:** Kill Command Drone + destroy relay antenna
- **Defend:** Counter-attacks every 20 min playtime; fail = reverts
- **Benefit:** Liberated sectors spawn friendly scavengers, health stations, fast-travel ziplines

**Endgame:** All 12 liberated → unlock **The Director** (hidden 6th boss, server room)

### 3.2 NPC Schedules

**File:** `js/NPCSystem.js` (new)

NPCs have daily cycles, not static positions.

| NPC | Morning | Afternoon | Night |
|-----|---------|-----------|-------|
| **Malik** (scrap dealer) | Safehouse | Scavenging Sector 4 | Break room (vent-only access) |
| **Vega** (rival) | Shooting range | Rooftop patrol | Offline (recharging) |
| **The Informant** | Nowhere | Nowhere | Appears *only during fog* |

Different locations = different dialogue branches, prices, and quest availability.

### 3.3 Blackout Economy

**File:** `js/BlackoutSystem.js` (new)

Global event every 3 in-game days.

| Type | Effect | Opportunity |
|------|--------|-------------|
| **Grid Failure** | Lights off 6h; drone vision halved | Stealth heist window |
| **Overclock Surge** | Abilities cost 0 flow; health drains 1%/s | Speedrun boss attempts |
| **Drone Migration** | One faction floods a random sector | Massive XP farm |
| **Lockdown** | Arena entrances sealed | Forces hub/NPC interaction |

NPCs react with unique dialogue and temporary quests during Blackouts.

---

## PHASE 4: COMPANION & NARRATIVE

### 4.1 Companion Drone "Buddy"

**File:** `js/CompanionDrone.js` (new)

Customizable follower found in crashed pod.

- **Modes:** Attack / Distract / Heal / Scout / Loot
- **Upgrades:** Scrap → chassis, battery, AI tree improvements
- **Personality:** Procedural audio comments based on performance
- **Synergy:** Air-dash into enemy → Buddy auto-fires stun bolt for juggle combos

### 4.2 Companion Loyalty

**File:** `js/LoyaltySystem.js` (new)

Hidden trust meter (0–100).

| Trust | Behavior |
|-------|----------|
| 80–100 | Sacrifices battery to revive you once per run |
| 40–79 | Standard performance |
| 10–39 | Steals loot, sells it to vendors |
| 0–9 | Abandons you; becomes mini-boss in Sector 11 |

Dialogue choices drive trust. "Shut up and follow orders" too many times = rivalry path.

### 4.3 Narrative Consequence Tracker

**File:** `js/ConsequenceSystem.js` (new)

Lightweight choice tracker.

| Choice | Consequence |
|--------|-------------|
| Spare Sapper Drone | It remembers; later appears as friendly NPC clearing rubble |
| Free Warden's prisoners | They become rival runners who aid in boss fights |
| Sell boss core vs mount trophy | Shop = more chips; Trophy = passive buff |

**Karma Vector:** Cruel ↔ Merciful, Selfish ↔ Altruistic. Final boss encounter changes based on vector.

---

## PHASE 5: ENDGAME SYSTEMS

### 5.1 The Collapse (Roguelite Mode)

**File:** `js/CollapseMode.js` (new)

Unlocked after all 5 bosses. Start at Level 1, naked. 10 procedural floors.

- Between floors: choose 1 of 3 upgrades (weapon, gear, or skill)
- Every 5 floors: mini-boss
- Every 25 floors: unique boss (not in main game)
- **Depth scaling:** Enemies +5% stats per floor; your stats capped at entry
- **Extraction:** Bail every 5 floors, keep loot. Death = lose everything from dive.

### 5.2 New Game+

**File:** `js/NewGamePlus.js` (new)

After beating The Architect:

- Carry **one** heirloom item (familiarity 1000)
- Enemies scale to previous final level +10
- **Corruption:** Each NG+ cycle adds 1 permanent world modifier
  - NG+1: "All explosions chain"
  - NG+2: "Gravity shifts every 60s"
  - NG+3: "Drones respawn 30s after death"
- **True Ending** requires NG+3 — The Architect was a subroutine

### 5.3 Sub-Levels (Procedural Dungeon)

**File:** `js/SubLevelSystem.js` (new)

Beneath the warehouse: infinite floors.

| Feature | Detail |
|---------|--------|
| Tilesets | Freezer, factory, server farm, flooded basement |
| Bosses | Every 5 floors = mini-boss; every 25 = unique boss |
| Scaling | +5% enemy stats per floor; player stats capped at entry |
| Extraction | Bail every 5 floors, keep loot. Death = lose dive loot. |

### 5.4 Implants

**File:** `js/ImplantSystem.js` (new)

Permanent body mods. Slotted into *you*, not gear. Costly to remove.

| Implant | Bonus | Drawback |
|---------|-------|----------|
| *Myomer Threads* | +30% melee damage | Can't use pistols |
| *Adrenal Valve* | Death Rewind at 10% HP | Max HP -25 |
| *Optical Overdrive* | Predator Vision sees loot through walls | Screen flickers in bright areas |
| *Grapple Spine* | Grapple has 2 charges, 0 cooldown | Fall damage doubled |
| *Hive Pheromones* | Drones sometimes ignore you | NPCs fear you; shop prices +20% |

Implants make builds *weird* and memorable.

### 5.5 Debt System

**File:** `js/DebtSystem.js` (new)

Loans from the Scrap Broker.

- Borrow 5,000 chips → repay 7,500 in 3 in-game days
- **Fail:** Elite bounty hunters chase you across all sectors
- **Early pay:** Credit score up → bigger loans, better rates
- **Bankruptcy:** Surrender highest-rarity gear piece; slot locked for 2 days

### 5.6 Legacy & Retirement

**File:** `js/LegacySystem.js` (new)

At level 50, retire your runner.

- They become a hub NPC with their gear and build
- Next character starts with:
  - +1 permanent attribute point (account-wide, max +10)
  - One heirloom from retired runner
  - Access to retired runner's Codex
- Retired runners post bounties against their old rivals

Ten retired runners = dynasty. Tenth character starts +10 stats and a Hall of Legends.

### 5.7 Parkour Mastery Paths

**File:** `js/MasterySystem.js` (new)

Moves level independently.

| Move | Lv10 | Lv50 |
|------|------|------|
| Dive Kicks | +25% damage | *Meteor Strike* — creates 3m burn zone |
| Wallruns | +2s duration | *Magnetic Grace* — can fire while wallrunning |
| Parries | Reflect 5× damage | *Perfect Guard* — parry auto-reloads weapon |
| Takedowns | +50% backstab | *Ghost Protocol* — takedowns don't break sprint |

Encourages specialization and build identity.

### 5.8 The Codex

**File:** `js/CodexSystem.js` (new)

Journal that fills through exploration. Entries change gameplay.

| Entry Unlocked | Effect |
|----------------|--------|
| *Drone Blueprint: Vanguard Mk.IV* | Knee servos take 3× damage |
| *Employee Memo #44* | Secret vent password → Sector 9 shortcut |
| *The Overseer's Diary* | Boss addresses you by name in dialogue |
| *Warehouse Floor Plan* | Minimap reveals hidden rooms |

Some entries require **SYN checks** to decrypt.

---

## PHASE 6: CONTENT SYSTEMS

### 6.1 Safehouse Upgrades

**File:** `js/SafehouseSystem.js` (new)

Persistent hub progression.

| Upgrade | Cost | Effect |
|---------|------|--------|
| Shooting Range | 500 scrap | Test TTK; preview weapon mods |
| Scrap Forge | 1000 scrap | Dismantle 3 common → 1 rare |
| Trophy Wall | 5 boss cores | Mount boss remains; each gives passive buff |
| Relay Antenna | 800 scrap | Unlock bounty board |
| Medical Bay | 600 scrap | Respawn with +25 HP |
| Hall of Legends | 10 retired runners | Dynasty bonuses, cosmetic pedestals |

### 6.2 Procedural Bounty Board

**File:** `js/BountySystem.js` (new)

Daily/weekly contracts.

> **Contract: "Ghost in Sector 7"**
> - Target: Elite Phantom Drone
> - Modifier: No Predator Vision
> - Time limit: 3 minutes
> - Reward: Rare mod chip + 200 chips

**Runner Rank:** Street → Runner → Ace → Legend. Higher rank = harder contracts = better rewards.

### 6.3 Rival Runners

**File:** `js/RivalSystem.js` (new)

Human NPCs scattered in world.

- **Friendly:** Trade intel, sell rare mods
- **Hostile:** Challenge to parkour races or duels
- **Defeating a rival:** Drops their unique exo-suit piece
- **Rival relationships:** Some become allies after you beat them; others hold grudges

---

## PHASE 7: NEW FILES & ARCHITECTURE

### New Files

| File | Lines | Purpose |
|------|-------|---------|
| `js/CharacterSheet.js` | ~400 | Stats, level, XP, Gear Score |
| `js/ProgressionSystem.js` | ~300 | Leveling curve, XP sources, respec |
| `js/ArchetypeSystem.js` | ~500 | Class resources, capstones, multiclass |
| `js/OriginSystem.js` | ~200 | Background selection, starter kits |
| `js/ExoSuitSystem.js` | ~600 | Gear slots, set bonuses, equip/unequip |
| `js/AffixSystem.js` | ~400 | Random affix rolling, reroll costs |
| `js/FamiliaritySystem.js` | ~250 | Weapon kill tracking, heirloom status |
| `js/FactionSystem.js` | ~400 | Reputation math, tier effects |
| `js/TerritorySystem.js` | ~500 | Sector control, liberation, defense |
| `js/NPCSystem.js` | ~600 | Schedules, locations, dialogue branches |
| `js/BlackoutSystem.js` | ~300 | Event scheduling, modifiers, NPC reactions |
| `js/CompanionDrone.js` | ~700 | Follower AI, modes, upgrades, synergy |
| `js/LoyaltySystem.js` | ~300 | Trust meter, dialogue impact, rivalry |
| `js/ConsequenceSystem.js` | ~350 | Choice tracking, karma vector, world changes |
| `js/CollapseMode.js` | ~600 | Roguelite floor generation, upgrade rooms |
| `js/NewGamePlus.js` | ~300 | Heirloom carry, corruption, true ending gate |
| `js/SubLevelSystem.js` | ~800 | Procedural dungeon, tilesets, depth scaling |
| `js/ImplantSystem.js` | ~400 | Body mod slots, install/remove, drawbacks |
| `js/DebtSystem.js` | ~300 | Loans, repayment, bounty hunters, bankruptcy |
| `js/LegacySystem.js` | ~350 | Retirement, dynasty bonuses, Hall of Legends |
| `js/MasterySystem.js` | ~400 | Move XP tracking, level bonuses |
| `js/CodexSystem.js` | ~350 | Entry unlocks, SYN checks, gameplay effects |
| `js/SafehouseSystem.js` | ~400 | Upgrade tree, visual changes, buff application |
| `js/BountySystem.js` | ~450 | Procedural contract generation, reward scaling |
| `js/RivalSystem.js` | ~500 | Rival spawning, races, duels, relationship arcs |

**Total new files:** 25 files, ~10,500 lines

### Modified Files

| File | Changes |
|------|---------|
| `js/Player.js` | Add stats, archetype resource, implant slots |
| `js/main.js` | Import all RPG systems, update loop hooks |
| `js/DamageSystem.js` | Scale damage by stats, apply familiarity bonuses |
| `js/WeaponSystem.js` | Affix integration, familiarity tracking |
| `js/EnemyManager.js` | Faction reputation affects AI behavior |
| `js/ComboSystem.js` | SYN stat affects flow generation |
| `js/InputManager.js` | Mode toggles for companion drone |
| `js/ShopSystem.js` | Origin haggling, debt tracking, faction discounts |
| `js/CraftingSystem.js` | TEC stat affects crafting quality |
| `index.html` | Character sheet panel, codex UI, faction HUD, implant screen |

---

## PHASE 8: IMPLEMENTATION ROADMAP

### Sprint 1: Character Foundation (Week 1)
- CharacterSheet + six stats
- ProgressionSystem (leveling, XP)
- ArchetypeSystem (5 classes, resources, capstones)
- OriginSystem (4 origins)

### Sprint 2: Gear & Loot (Week 2)
- ExoSuitSystem (4 slots, set bonuses)
- AffixSystem (roll tables, rarity tiers)
- FamiliaritySystem (weapon bonding)
- Gear Score integration

### Sprint 3: World Systems (Week 3)
- FactionSystem + TerritorySystem
- NPCSystem (schedules, locations)
- BlackoutSystem
- Safehouse upgrades

### Sprint 4: Companion & Story (Week 4)
- CompanionDrone + LoyaltySystem
- ConsequenceSystem + karma vector
- CodexSystem
- BountySystem

### Sprint 5: Endgame (Week 5)
- CollapseMode (roguelite)
- SubLevelSystem (procedural dungeon)
- Implants
- DebtSystem
- MasterySystem

### Sprint 6: Polish & Loop (Week 6)
- NewGamePlus + corruption
- LegacySystem + retirement
- RivalSystem
- Balance pass, integration testing, UI polish

---

## APPENDIX: RPG MECHANICS CHECKLIST

### Core Character (4)
- [ ] Six Attribute System (MOB, REF, SYN, FOR, TEC, GUT)
- [ ] Leveling & XP Curve
- [ ] Runner Archetypes (5 classes)
- [ ] Runner Origins (4 backgrounds)

### Gear & Loot (3)
- [ ] Exo-Suit Loadout (4 slots, set bonuses)
- [ ] Affix System (Common → Legendary)
- [ ] Weapon Familiarity / Heirlooms

### World & Factions (3)
- [ ] Faction Reputation (3 factions, 5 tiers)
- [ ] Territory Control (12 sectors)
- [ ] NPC Schedules & Blackout Events

### Companion & Narrative (3)
- [ ] Companion Drone "Buddy"
- [ ] Companion Loyalty / Rivalry
- [ ] Narrative Consequence Tracker

### Endgame (6)
- [ ] The Collapse (Roguelite Mode)
- [ ] New Game+ & Corruption
- [ ] Sub-Levels (Procedural Dungeon)
- [ ] Implants
- [ ] Debt System
- [ ] Legacy & Retirement

### Content (3)
- [ ] Safehouse Upgrades
- [ ] Procedural Bounty Board
- [ ] Rival Runners

### Progression (2)
- [ ] Parkour Mastery Paths
- [ ] The Codex

**TOTAL: ~24 new RPG systems, ~10,500 lines**
