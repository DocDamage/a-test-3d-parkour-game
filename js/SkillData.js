/**
 * SkillData.js
 * Pure data definitions for all archetype skills, runes, and passives.
 * No runtime logic — SkillSystem consumes these as config.
 */

export const DAMAGE_TYPES = {
  KINETIC: 'kinetic',
  ENERGY: 'energy',
  EXPLOSIVE: 'explosive',
  ELECTRIC: 'electric',
  FREEZE: 'freeze'
};

export const SKILL_SLOTS = ['LMB', 'RMB', 'Q', 'E', 'R'];

export const RESOURCE_TYPES = {
  traceur: 'momentum',
  operative: 'focus',
  saboteur: 'chaos',
  specimen: 'fury',
  netrunner: 'charge'
};

/**
 * Active skills by archetype.
 * Each skill defines its base behavior. SkillSystem applies rune modifiers at runtime.
 */
export const ACTIVE_SKILLS = {
  traceur: {
    light_strike: {
      id: 'light_strike',
      name: 'Light Strike',
      slot: 'LMB',
      category: 'generator',
      baseDamage: 15,
      damageType: DAMAGE_TYPES.KINETIC,
      cooldown: 0,
      resourceCost: 0,
      resourceGen: 12,
      range: 1.2,
      description: 'Quick forward melee. Generates Momentum.',
      runes: {
        bloodletting: { name: 'Bloodletting', effect: 'Heals 5% of damage dealt.' },
        ricochet: { name: 'Ricochet', effect: 'Chains to 1 nearby enemy within 4m.' },
        heavy_hands: { name: 'Heavy Hands', effect: '+50% damage, -25% attack speed.' }
      }
    },
    dive_kick: {
      id: 'dive_kick',
      name: 'Dive Kick',
      slot: 'RMB',
      category: 'spender',
      baseDamage: 50,
      damageType: DAMAGE_TYPES.KINETIC,
      cooldown: 3.0,
      resourceCost: 30,
      resourceGen: 0,
      description: 'Aerial descent strike. Must be airborne. Consumes Momentum.',
      runes: {
        meteor: { name: 'Meteor', effect: 'Leaves a 3m burn zone for 4s (20% weapon damage/s).' },
        concussion: { name: 'Concussion', effect: 'Stuns target for 1.5s.' },
        ricochet: { name: 'Ricochet', effect: 'Bounces to a 2nd target within 6m at 75% damage.' }
      }
    },
    air_dash: {
      id: 'air_dash',
      name: 'Air Dash',
      slot: 'Q',
      category: 'utility',
      baseDamage: 0,
      damageType: null,
      cooldown: 5.0,
      resourceCost: 15,
      resourceGen: 0,
      description: 'Burst forward in mid-air. Invincible during dash.',
      runes: {
        blitz: { name: 'Blitz', effect: 'Damages enemies passed through for 25 kinetic.' },
        phantom: { name: 'Phantom', effect: '+0.3s invincibility window.' },
        afterimage: { name: 'Afterimage', effect: 'Leave a decoy that explodes after 1s for 30 damage.' }
      }
    },
    slide_tackle: {
      id: 'slide_tackle',
      name: 'Slide Tackle',
      slot: 'E',
      category: 'defense',
      baseDamage: 30,
      damageType: DAMAGE_TYPES.KINETIC,
      cooldown: 6.0,
      resourceCost: 20,
      resourceGen: 0,
      description: 'Slide into enemies, knocking them down. Grants brief i-frames.',
      runes: {
        shockwave: { name: 'Shockwave', effect: 'Emits a 4m shockwave on impact for 20 damage.' },
        oil_slick: { name: 'Oil Slick', effect: 'Ground is slippery for 3s; enemies slide and stumble.' },
        momentum: { name: 'Momentum', effect: 'Refunds 50% of Momentum cost if you hit 2+ enemies.' }
      }
    },
    ground_pound: {
      id: 'ground_pound',
      name: 'Ground Pound',
      slot: 'R',
      category: 'ultimate',
      baseDamage: 80,
      damageType: DAMAGE_TYPES.EXPLOSIVE,
      cooldown: 20.0,
      resourceCost: 60,
      resourceGen: 0,
      description: 'Slam the ground from any height. 5m radius AoE.',
      runes: {
        quake: { name: 'Quake', effect: 'Radius increased to 8m. Damage increased to 120.' },
        singularity: { name: 'Singularity', effect: 'Pulls enemies to center before detonating.' },
        zenith: { name: 'Zenith', effect: 'Resets all other cooldowns on kill.' }
      }
    }
  },

  operative: {
    silenced_pistol: {
      id: 'silenced_pistol',
      name: 'Silenced Pistol',
      slot: 'LMB',
      category: 'generator',
      baseDamage: 12,
      damageType: DAMAGE_TYPES.KINETIC,
      cooldown: 0.4,
      resourceCost: 0,
      resourceGen: 10,
      range: 25,
      description: 'Ranged shot. Generates Focus.',
      runes: {
        poison_rounds: { name: 'Poison Rounds', effect: 'Applies poison DoT (15 damage over 3s).' },
        armor_pierce: { name: 'Armor Pierce', effect: 'Ignores 50% of target armor.' },
        fan_fire: { name: 'Fan Fire', effect: 'Shoots 3 rounds in a spread. +200% Focus gen.' }
      }
    },
    ghost_bullet: {
      id: 'ghost_bullet',
      name: 'Ghost Bullet',
      slot: 'RMB',
      category: 'spender',
      baseDamage: 60,
      damageType: DAMAGE_TYPES.ENERGY,
      cooldown: 4.0,
      resourceCost: 35,
      description: 'Piercing round passes through all enemies in a line.',
      runes: {
        mark: { name: 'Mark', effect: 'Marked enemies take +20% damage for 5s.' },
        chain: { name: 'Chain', effect: 'After piercing, round chains to 3 nearby enemies.' },
        execute: { name: 'Execute', effect: 'Deals 3× damage to enemies below 25% HP.' }
      }
    },
    predator_vision: {
      id: 'predator_vision',
      name: 'Predator Vision',
      slot: 'Q',
      category: 'utility',
      baseDamage: 0,
      cooldown: 12.0,
      resourceCost: 25,
      description: 'Highlight all enemies through walls for 6s. +15% crit chance.',
      runes: {
        weakpoints: { name: 'Weakpoints', effect: 'Highlighted enemies have guaranteed crit spots.' },
        prey_drive: { name: 'Prey Drive', effect: '+30% move speed toward highlighted enemies.' },
        overclock: { name: 'Overclock', effect: 'Also reduces all cooldowns by 2s on activation.' }
      }
    },
    smoke_bomb: {
      id: 'smoke_bomb',
      name: 'Smoke Bomb',
      slot: 'E',
      category: 'defense',
      baseDamage: 0,
      cooldown: 10.0,
      resourceCost: 20,
      description: 'Drop smoke at your feet. Enemies lose target. You become invisible for 3s.',
      runes: {
        choking_gas: { name: 'Choking Gas', effect: 'Enemies in smoke take 10 damage/s and cough (stunned).' },
        flash: { name: 'Flash', effect: 'Blinds enemies for 2s when they enter smoke.' },
        shadow_step: { name: 'Shadow Step', effect: 'Teleport to cursor location on activation.' }
      }
    },
    assassinate: {
      id: 'assassinate',
      name: 'Assassinate',
      slot: 'R',
      category: 'ultimate',
      baseDamage: 200,
      damageType: DAMAGE_TYPES.KINETIC,
      cooldown: 30.0,
      resourceCost: 80,
      description: 'Teleport behind target and strike for massive damage. Must be within 15m.',
      runes: {
        massacre: { name: 'Massacre', effect: 'If kill, reset cooldown and refund 50% Focus.' },
        terror: { name: 'Terror', effect: 'All nearby enemies flee for 3s.' },
        poison_blade: { name: 'Poison Blade', effect: 'Target bleeds for 100 damage over 5s.' }
      }
    }
  },

  saboteur: {
    scrap_throw: {
      id: 'scrap_throw',
      name: 'Scrap Throw',
      slot: 'LMB',
      category: 'generator',
      baseDamage: 18,
      damageType: DAMAGE_TYPES.KINETIC,
      cooldown: 0,
      resourceCost: 0,
      resourceGen: 10,
      range: 12,
      description: 'Throw junk. Generates Chaos.',
      runes: {
        shrapnel: { name: 'Shrapnel', effect: 'Explodes on impact for 8 damage in 2m.' },
        magnet: { name: 'Magnet', effect: 'Scrap pulls enemy toward you on hit.' },
        recycle: { name: 'Recycle', effect: '25% chance to not consume ammo (infinite scrap).' }
      }
    },
    grenade_toss: {
      id: 'grenade_toss',
      name: 'Grenade Toss',
      slot: 'RMB',
      category: 'spender',
      baseDamage: 55,
      damageType: DAMAGE_TYPES.EXPLOSIVE,
      cooldown: 5.0,
      resourceCost: 35,
      description: 'Lobbed explosive. 4m radius.',
      runes: {
        cluster: { name: 'Cluster', effect: 'Splits into 3 mini-grenades on detonation.' },
        gas: { name: 'Gas', effect: 'Leaves poison cloud (15 damage/s for 4s).' },
        sticky: { name: 'Sticky', effect: 'Attaches to first enemy hit. Detonates after 2s.' }
      }
    },
    proxy_mine: {
      id: 'proxy_mine',
      name: 'Proxy Mine',
      slot: 'Q',
      category: 'utility',
      baseDamage: 40,
      damageType: DAMAGE_TYPES.EXPLOSIVE,
      cooldown: 8.0,
      resourceCost: 20,
      description: 'Place a mine. Explodes when enemy walks within 3m. Lasts 30s.',
      runes: {
        cluster_trap: { name: 'Cluster Trap', effect: 'Places 3 mines in a triangle.' },
        freeze_trap: { name: 'Freeze Trap', effect: 'Freezes enemy for 2s instead of exploding.' },
        overclocked: { name: 'Overclocked', effect: 'Mine arms instantly. Damage +50%.' }
      }
    },
    decoy: {
      id: 'decoy',
      name: 'Decoy',
      slot: 'E',
      category: 'defense',
      baseDamage: 0,
      cooldown: 14.0,
      resourceCost: 25,
      description: 'Deploy a holographic decoy. Enemies target it for 5s. Explodes on death for 30.',
      runes: {
        taunt: { name: 'Taunt', effect: 'All enemies in 10m are forced to attack decoy.' },
        shield: { name: 'Shield', effect: 'While decoy is alive, you take -30% damage.' },
        duplicate: { name: 'Duplicate', effect: 'Deploy 2 decoys.' }
      }
    },
    zero_cooldown: {
      id: 'zero_cooldown',
      name: 'Zero Cooldown',
      slot: 'R',
      category: 'ultimate',
      baseDamage: 0,
      cooldown: 45.0,
      resourceCost: 100,
      description: 'For 5s, all skills have 0 cooldown and 0 resource cost.',
      runes: {
        overdrive: { name: 'Overdrive', effect: 'Duration increased to 8s. +25% damage during effect.' },
        feedback: { name: 'Feedback', effect: 'When effect ends, refund 50% of Chaos spent.' },
        chain_reaction: { name: 'Chain Reaction', effect: 'All explosions during effect trigger twice.' }
      }
    }
  },

  specimen: {
    claw_swipe: {
      id: 'claw_swipe',
      name: 'Claw Swipe',
      slot: 'LMB',
      category: 'generator',
      baseDamage: 20,
      damageType: DAMAGE_TYPES.KINETIC,
      cooldown: 0,
      resourceCost: 0,
      resourceGen: 10,
      range: 1.5,
      description: 'Wide melee arc. Generates Fury.',
      runes: {
        blood_frenzy: { name: 'Blood Frenzy', effect: 'Each hit reduces all cooldowns by 0.2s.' },
        rupture: { name: 'Rupture', effect: 'Applies bleed (10 damage/s for 4s).' },
        savage: { name: 'Savage', effect: '+30% damage. Swipe speed increased.' }
      }
    },
    berserk_lunge: {
      id: 'berserk_lunge',
      name: 'Berserk Lunge',
      slot: 'RMB',
      category: 'spender',
      baseDamage: 65,
      damageType: DAMAGE_TYPES.KINETIC,
      cooldown: 4.0,
      resourceCost: 35,
      description: 'Leap at target. 3m AoE on landing.',
      runes: {
        tremor: { name: 'Tremor', effect: '6m AoE. Enemies are knocked down.' },
        bloodscent: { name: 'Bloodscent', effect: 'If target is bleeding, lunge deals +50% damage.' },
        relentless: { name: 'Relentless', effect: 'If kill, reset cooldown instantly.' }
      }
    },
    roar: {
      id: 'roar',
      name: 'Roar',
      slot: 'Q',
      category: 'utility',
      baseDamage: 0,
      cooldown: 10.0,
      resourceCost: 20,
      description: 'Fears all enemies within 6m for 2s. Generates 20 Fury.',
      runes: {
        intimidate: { name: 'Intimidate', effect: 'Feared enemies take +25% damage.' },
        rally: { name: 'Rally', effect: 'Instead of fear, allies (companion) gain +20% damage for 5s.' },
        primal: { name: 'Primal', effect: 'You gain +30% attack speed for 4s.' }
      }
    },
    adrenaline_rush: {
      id: 'adrenaline_rush',
      name: 'Adrenaline Rush',
      slot: 'E',
      category: 'defense',
      baseDamage: 0,
      cooldown: 12.0,
      resourceCost: 25,
      description: '+50% move speed, +20% dodge chance, health regen +5%/s for 5s.',
      runes: {
        second_wind: { name: 'Second Wind', effect: 'If below 25% HP, also heal 30% max HP.' },
        unfazed: { name: 'Unfazed', effect: 'Immune to crowd control during effect.' },
        blood_rush: { name: 'Blood Rush', effect: 'Damage dealt during effect is converted to healing.' }
      }
    },
    primal_surge: {
      id: 'primal_surge',
      name: 'Primal Surge',
      slot: 'R',
      category: 'ultimate',
      baseDamage: 100,
      damageType: DAMAGE_TYPES.KINETIC,
      cooldown: 25.0,
      resourceCost: 80,
      description: 'Transform for 6s. +100% damage, +50% move speed, immune to stagger.',
      runes: {
        apex_predator: { name: 'Apex Predator', effect: 'Duration 10s. Kills extend duration by 1s.' },
        thrash: { name: 'Thrash', effect: 'All attacks are 360° AoE during effect.' },
        metamorphosis: { name: 'Metamorphosis', effect: 'On expiration, heal 25% max HP.' }
      }
    }
  },

  netrunner: {
    zap: {
      id: 'zap',
      name: 'Zap',
      slot: 'LMB',
      category: 'generator',
      baseDamage: 14,
      damageType: DAMAGE_TYPES.ELECTRIC,
      cooldown: 0,
      resourceCost: 0,
      resourceGen: 10,
      range: 15,
      description: 'Chain lightning to nearest enemy. Generates Charge.',
      runes: {
        arc: { name: 'Arc', effect: 'Chains to 2 additional enemies (50% damage each).' },
        surge: { name: 'Surge', effect: 'Drains target shield and converts to Charge.' },
        overload: { name: 'Overload', effect: 'Every 5th zap stuns for 1s.' }
      }
    },
    hack_drone: {
      id: 'hack_drone',
      name: 'Hack Drone',
      slot: 'RMB',
      category: 'spender',
      baseDamage: 0,
      damageType: null,
      cooldown: 6.0,
      resourceCost: 40,
      description: 'Hack target drone. It fights for you for 8s.',
      runes: {
        overclock: { name: 'Overclock', effect: 'Hacked drone deals +50% damage and moves faster.' },
        detonate: { name: 'Detonate', effect: 'When hack expires, drone explodes for 60 damage.' },
        virus: { name: 'Virus', effect: 'On hack expiry, drone infects nearest enemy drone.' }
      }
    },
    emp_pulse: {
      id: 'emp_pulse',
      name: 'EMP Pulse',
      slot: 'Q',
      category: 'utility',
      baseDamage: 30,
      damageType: DAMAGE_TYPES.ELECTRIC,
      cooldown: 10.0,
      resourceCost: 25,
      description: '5m radius pulse. Disables drones for 3s. Damages shields.',
      runes: {
        feedback: { name: 'Feedback', effect: 'Disabled drones take 15 damage/s.' },
        recharge: { name: 'Recharge', effect: 'You gain 20 Charge per drone disabled.' },
        ion_storm: { name: 'Ion Storm', effect: 'Radius 8m. Also slows enemy movement -40%.' }
      }
    },
    firewall: {
      id: 'firewall',
      name: 'Firewall',
      slot: 'E',
      category: 'defense',
      baseDamage: 0,
      damageType: null,
      cooldown: 12.0,
      resourceCost: 30,
      description: 'Energy barrier blocks incoming projectiles for 4s.',
      runes: {
        reflect: { name: 'Reflect', effect: 'Blocked projectiles are reflected at attackers.' },
        amplify: { name: 'Amplify', effect: 'While active, +20% electric damage dealt.' },
        recharge: { name: 'Recharge', effect: 'Barrier duration +2s. Heals 2% HP/s while active.' }
      }
    },
    swarm_override: {
      id: 'swarm_override',
      name: 'Swarm Override',
      slot: 'R',
      category: 'ultimate',
      baseDamage: 0,
      damageType: null,
      cooldown: 35.0,
      resourceCost: 90,
      description: 'All drones in 15m become allied for 8s. +50% drone damage.',
      runes: {
        assimilation: { name: 'Assimilation', effect: 'When effect ends, hacked drones explode for 40 damage.' },
        hive_mind: { name: 'Hive Mind', effect: 'You gain a copy of each hacked drone\'s weapon.' },
        signal_boost: { name: 'Signal Boost', effect: 'Duration 12s. Drones gain +100% attack speed.' }
      }
    }
  }
};

/**
 * Passive skill trees by archetype.
 * Each node has: id, name, description, maxRank, requires (prereq ids), stat bonuses.
 */
export const PASSIVE_TREES = {
  traceur: [
    { id: 'traceur_1', name: 'Flow State', description: '+5% move speed per rank.', maxRank: 5, requires: [], bonuses: { moveSpeed: 0.05 } },
    { id: 'traceur_2', name: 'Kinetic Transfer', description: '+10% melee damage per rank.', maxRank: 5, requires: [], bonuses: { meleeDamage: 0.10 } },
    { id: 'traceur_3', name: 'Parkour Mastery', description: 'Wallrun duration +1s per rank.', maxRank: 3, requires: ['traceur_1'], bonuses: { wallrunDuration: 1.0 } },
    { id: 'traceur_4', name: 'Dive Bomb', description: 'Dive Kick deals +20% damage per rank.', maxRank: 3, requires: ['traceur_2'], bonuses: { diveKickDamage: 0.20 } },
    { id: 'traceur_5', name: 'Freerun Cultist', description: 'After 3 consecutive parkour moves, next attack crits.', maxRank: 1, requires: ['traceur_3', 'traceur_4'], bonuses: { freerunBonus: 1 } },
    { id: 'traceur_6', name: 'Aerialist', description: 'Air Dash cooldown -1s per rank.', maxRank: 3, requires: ['traceur_3'], bonuses: { airDashCooldown: -1.0 } },
    { id: 'traceur_7', name: 'Slide Master', description: 'Slide Tackle range +1m per rank.', maxRank: 3, requires: ['traceur_2'], bonuses: { slideRange: 1.0 } },
    { id: 'traceur_8', name: 'Momentum Surge', description: 'Max Momentum +20 per rank.', maxRank: 3, requires: [], bonuses: { maxMomentum: 20 } },
    { id: 'traceur_9', name: 'Impact Absorption', description: 'Ground Pound grants a shield (10% max HP) for 3s.', maxRank: 1, requires: ['traceur_4'], bonuses: { groundPoundShield: 0.10 } },
    { id: 'traceur_10', name: 'The Freerun Cult', description: 'Set bonus node: Every parkour move deals 50% weapon damage to nearby enemies.', maxRank: 1, requires: ['traceur_5'], bonuses: { freerunCult: 1 } }
  ],

  operative: [
    { id: 'op_1', name: 'Sharpshooter', description: '+5% crit chance per rank.', maxRank: 5, requires: [], bonuses: { critChance: 0.05 } },
    { id: 'op_2', name: 'Ghost Walk', description: '+3% dodge chance per rank.', maxRank: 5, requires: [], bonuses: { dodgeChance: 0.03 } },
    { id: 'op_3', name: 'Predator Instinct', description: 'Predator Vision duration +1s per rank.', maxRank: 3, requires: ['op_1'], bonuses: { predatorDuration: 1.0 } },
    { id: 'op_4', name: 'Smoke and Mirrors', description: 'Smoke Bomb duration +1s per rank.', maxRank: 3, requires: ['op_2'], bonuses: { smokeDuration: 1.0 } },
    { id: 'op_5', name: 'Assassin\'s Creed', description: 'Assassinate deals +25% damage per rank.', maxRank: 3, requires: ['op_3', 'op_4'], bonuses: { assassinateDamage: 0.25 } },
    { id: 'op_6', name: 'Silent Killer', description: 'Silent takedowns generate 20 Focus.', maxRank: 1, requires: ['op_1'], bonuses: { silentTakedownFocus: 20 } },
    { id: 'op_7', name: 'Evasion', description: 'After dodging, next attack deals +30% damage.', maxRank: 1, requires: ['op_2'], bonuses: { evasionBonus: 0.30 } },
    { id: 'op_8', name: 'Focus Pool', description: 'Max Focus +20 per rank.', maxRank: 3, requires: [], bonuses: { maxFocus: 20 } },
    { id: 'op_9', name: 'Wetwork', description: 'First attack from invisibility deals 2× damage.', maxRank: 1, requires: ['op_4'], bonuses: { wetworkBonus: 1.0 } },
    { id: 'op_10', name: 'Wetwork Operative', description: 'Set bonus node: Invisibility lasts 2× longer.', maxRank: 1, requires: ['op_5'], bonuses: { wetworkOperative: 1 } }
  ],

  saboteur: [
    { id: 'sab_1', name: 'Tinkerer', description: '+10% explosive damage per rank.', maxRank: 5, requires: [], bonuses: { explosiveDamage: 0.10 } },
    { id: 'sab_2', name: 'Scavenger', description: '+5% scrap find per rank.', maxRank: 5, requires: [], bonuses: { scrapFind: 0.05 } },
    { id: 'sab_3', name: 'Cluster Bombs', description: 'Grenade Toss radius +0.5m per rank.', maxRank: 3, requires: ['sab_1'], bonuses: { grenadeRadius: 0.5 } },
    { id: 'sab_4', name: 'Trap Expert', description: 'Proxy Mine duration +5s per rank.', maxRank: 3, requires: ['sab_1'], bonuses: { mineDuration: 5.0 } },
    { id: 'sab_5', name: 'Demolitionist', description: 'All explosives have +15% crit chance.', maxRank: 1, requires: ['sab_3', 'sab_4'], bonuses: { explosiveCrit: 0.15 } },
    { id: 'sab_6', name: 'Jury Rig', description: 'Decoy health +50% per rank.', maxRank: 3, requires: ['sab_2'], bonuses: { decoyHealth: 0.50 } },
    { id: 'sab_7', name: 'Chain Reaction', description: 'Killing an enemy with explosives has 25% chance to trigger another explosion.', maxRank: 1, requires: ['sab_1'], bonuses: { chainReaction: 0.25 } },
    { id: 'sab_8', name: 'Chaos Pool', description: 'Max Chaos +20 per rank.', maxRank: 3, requires: [], bonuses: { maxChaos: 20 } },
    { id: 'sab_9', name: 'Overclocked', description: 'Zero Cooldown duration +1s per rank.', maxRank: 3, requires: ['sab_5'], bonuses: { zeroCooldownDuration: 1.0 } },
    { id: 'sab_10', name: 'Demolition Corps', description: 'Set bonus node: Every 5th grenade is a nuke.', maxRank: 1, requires: ['sab_5'], bonuses: { demolitionCorps: 1 } }
  ],

  specimen: [
    { id: 'spec_1', name: 'Savagery', description: '+8% melee damage per rank.', maxRank: 5, requires: [], bonuses: { meleeDamage: 0.08 } },
    { id: 'spec_2', name: 'Thick Hide', description: '+5% armor per rank.', maxRank: 5, requires: [], bonuses: { armor: 0.05 } },
    { id: 'spec_3', name: 'Bloodlust', description: 'Killing an enemy generates 10 Fury.', maxRank: 1, requires: ['spec_1'], bonuses: { killFury: 10 } },
    { id: 'spec_4', name: 'Leap Predator', description: 'Berserk Lunge cooldown -1s per rank.', maxRank: 3, requires: ['spec_1'], bonuses: { lungeCooldown: -1.0 } },
    { id: 'spec_5', name: 'Primal Roar', description: 'Roar duration +1s per rank.', maxRank: 3, requires: ['spec_2'], bonuses: { roarDuration: 1.0 } },
    { id: 'spec_6', name: 'Adrenaline Junkie', description: 'Adrenaline Rush duration +1s per rank.', maxRank: 3, requires: ['spec_2'], bonuses: { adrenalineDuration: 1.0 } },
    { id: 'spec_7', name: 'Berserker', description: 'Below 50% HP, +20% damage.', maxRank: 1, requires: ['spec_1', 'spec_2'], bonuses: { berserkerBonus: 0.20 } },
    { id: 'spec_8', name: 'Fury Pool', description: 'Max Fury +20 per rank.', maxRank: 3, requires: [], bonuses: { maxFury: 20 } },
    { id: 'spec_9', name: 'Primal Surge Mastery', description: 'Primal Surge duration +1s per rank.', maxRank: 3, requires: ['spec_6'], bonuses: { surgeDuration: 1.0 } },
    { id: 'spec_10', name: 'The Specimen', description: 'Set bonus node: Below 25% HP, all damage dealt is converted to healing.', maxRank: 1, requires: ['spec_7'], bonuses: { specimenBonus: 1 } }
  ],

  netrunner: [
    { id: 'net_1', name: 'Circuit Breaker', description: '+10% electric damage per rank.', maxRank: 5, requires: [], bonuses: { electricDamage: 0.10 } },
    { id: 'net_2', name: 'Encryption', description: '+5% shield capacity per rank.', maxRank: 5, requires: [], bonuses: { shieldCapacity: 0.05 } },
    { id: 'net_3', name: 'Chain Lightning', description: 'Zap chains to +1 additional enemy per rank.', maxRank: 3, requires: ['net_1'], bonuses: { zapChains: 1 } },
    { id: 'net_4', name: 'Drone Master', description: 'Hacked drone duration +2s per rank.', maxRank: 3, requires: ['net_1'], bonuses: { hackDuration: 2.0 } },
    { id: 'net_5', name: 'EMP Specialist', description: 'EMP Pulse disables for +1s per rank.', maxRank: 3, requires: ['net_2'], bonuses: { empDuration: 1.0 } },
    { id: 'net_6', name: 'Firewall Expert', description: 'Firewall duration +1s per rank.', maxRank: 3, requires: ['net_2'], bonuses: { firewallDuration: 1.0 } },
    { id: 'net_7', name: 'Overcharge', description: 'When at max Charge, +15% damage.', maxRank: 1, requires: ['net_1'], bonuses: { overchargeBonus: 0.15 } },
    { id: 'net_8', name: 'Charge Pool', description: 'Max Charge +20 per rank.', maxRank: 3, requires: [], bonuses: { maxCharge: 20 } },
    { id: 'net_9', name: 'Swarm Intelligence', description: 'Swarm Override duration +2s per rank.', maxRank: 3, requires: ['net_4'], bonuses: { swarmDuration: 2.0 } },
    { id: 'net_10', name: 'Synapse Overclocker', description: 'Set bonus node: EMP Pulse overcharges next 3 skills.', maxRank: 1, requires: ['net_5'], bonuses: { synapseBonus: 1 } }
  ]
};

/**
 * Get the default skill loadout for an archetype.
 * Returns { slot: skillId } mapping.
 */
export function getDefaultLoadout(archetypeId) {
  const skills = ACTIVE_SKILLS[archetypeId];
  if (!skills) return {};
  const loadout = {};
  for (const [skillId, skill] of Object.entries(skills)) {
    if (skill.slot) {
      loadout[skill.slot] = skillId;
    }
  }
  return loadout;
}

/**
 * Resolve a skill's stats with rune modifiers applied.
 * @param {object} baseSkill — from ACTIVE_SKILLS
 * @param {string|null} runeId — selected rune key
 * @param {object} passiveBonuses — aggregated from unlocked passive nodes
 * @returns {object} resolved skill with final stats
 */
export function resolveSkillStats(baseSkill, runeId = null, passiveBonuses = {}) {
  const resolved = {
    ...baseSkill,
    finalDamage: baseSkill.baseDamage,
    finalCooldown: baseSkill.cooldown,
    finalResourceCost: baseSkill.resourceCost,
    finalResourceGen: baseSkill.resourceGen,
    runeEffect: null
  };

  // Apply rune overrides (runes modify description/effect; damage multipliers are handled by SkillSystem)
  if (runeId && baseSkill.runes && baseSkill.runes[runeId]) {
    resolved.runeEffect = baseSkill.runes[runeId].effect;
    resolved.selectedRune = runeId;
  }

  // Apply passive bonuses that affect this skill
  const skillBonuses = passiveBonuses[baseSkill.id] || {};
  if (skillBonuses.damageMultiplier) {
    resolved.finalDamage *= (1 + skillBonuses.damageMultiplier);
  }
  if (skillBonuses.cooldownReduction) {
    resolved.finalCooldown = Math.max(0.1, resolved.finalCooldown - skillBonuses.cooldownReduction);
  }
  if (skillBonuses.resourceCostReduction) {
    resolved.finalResourceCost = Math.max(0, resolved.finalResourceCost * (1 - skillBonuses.resourceCostReduction));
  }

  return resolved;
}
