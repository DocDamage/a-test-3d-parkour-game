/**
 * AffixSystem.js
 * Diablo-style affix rolling with ranges, categories, and legendary powers.
 */

export const RARITY = {
  COMMON: 1,
  MAGIC: 2,
  RARE: 3,
  LEGENDARY: 4,
  SET: 5,
  ANCIENT: 6,
  PRIMAL: 7
};

const RARITY_NAMES = {
  [RARITY.COMMON]: 'Common',
  [RARITY.MAGIC]: 'Magic',
  [RARITY.RARE]: 'Rare',
  [RARITY.LEGENDARY]: 'Legendary',
  [RARITY.SET]: 'Set',
  [RARITY.ANCIENT]: 'Ancient Legendary',
  [RARITY.PRIMAL]: 'Primal Ancient'
};

/* ================================================================
   AFFIX POOLS WITH ROLLING RANGES
   Each affix: { id, name, stat, min, max, category }
   ================================================================ */

const AFFIX_POOL = {
  [RARITY.COMMON]: [
    { id: 'c_max_hp', name: 'Reinforced', stat: 'maxHealth', min: 5, max: 15, category: 'defense' },
    { id: 'c_move_speed', name: 'Swift Stride', stat: 'moveSpeed', min: 0.02, max: 0.05, category: 'utility' },
    { id: 'c_melee_dmg', name: 'Sharpened Edge', stat: 'meleeDamage', min: 0.03, max: 0.08, category: 'offense' },
    { id: 'c_crit_chance', name: 'Hair Trigger', stat: 'critChance', min: 0.01, max: 0.03, category: 'offense' },
    { id: 'c_armor', name: 'Hardened Plate', stat: 'armor', min: 5, max: 15, category: 'defense' },
    { id: 'c_resistance', name: 'Insulated', stat: 'resistance', min: 3, max: 8, category: 'defense' },
    { id: 'c_stamina', name: 'Light Frame', stat: 'maxStamina', min: 2, max: 5, category: 'defense' },
    { id: 'c_slide', name: 'Low Profile', stat: 'slideDistance', min: 0.05, max: 0.12, category: 'parkour' },
    { id: 'c_jump', name: 'Spring Heel', stat: 'jumpHeight', min: 0.02, max: 0.05, category: 'parkour' },
    { id: 'c_fall', name: 'Shock Absorber', stat: 'fallDamageReduction', min: 0.05, max: 0.10, category: 'defense' },
    { id: 'c_pickup', name: 'Magnetized', stat: 'pickupRadius', min: 0.5, max: 1.5, category: 'utility' },
    { id: 'c_regen', name: 'Regenerative', stat: 'healthRegen', min: 0.2, max: 0.5, category: 'defense' }
  ],

  [RARITY.MAGIC]: [
    { id: 'm_damage', name: 'Brutal', stat: 'damageMultiplier', min: 0.05, max: 0.10, category: 'offense' },
    { id: 'm_crit_dmg', name: 'Devastating', stat: 'critDamage', min: 0.10, max: 0.20, category: 'offense' },
    { id: 'm_attack_speed', name: 'Rapid', stat: 'attackSpeed', min: 0.03, max: 0.07, category: 'offense' },
    { id: 'm_cdr', name: 'Efficient', stat: 'cooldownReduction', min: 0.02, max: 0.05, category: 'offense' },
    { id: 'm_area_dmg', name: 'Expansive', stat: 'areaDamage', min: 0.05, max: 0.12, category: 'offense' },
    { id: 'm_dodge', name: 'Elusive', stat: 'dodgeChance', min: 0.02, max: 0.05, category: 'defense' },
    { id: 'm_block', name: 'Bulwark', stat: 'blockChance', min: 0.02, max: 0.05, category: 'defense' },
    { id: 'm_resource_cost', name: 'Thrifty', stat: 'resourceCostReduction', min: 0.03, max: 0.08, category: 'utility' },
    { id: 'm_magic_find', name: 'Lucky', stat: 'magicFind', min: 0.05, max: 0.15, category: 'utility' },
    { id: 'm_wallrun', name: 'Flow State', stat: 'wallrunDuration', min: 0.10, max: 0.20, category: 'parkour' },
    { id: 'm_vault', name: 'Agile', stat: 'vaultSpeed', min: 0.08, max: 0.15, category: 'parkour' },
    { id: 'm_grapple', name: 'Tensile Cable', stat: 'grappleRange', min: 3, max: 8, category: 'parkour' }
  ],

  [RARITY.RARE]: [
    { id: 'r_damage', name: 'Savage', stat: 'damageMultiplier', min: 0.08, max: 0.15, category: 'offense' },
    { id: 'r_crit_combo', name: 'Precision Strikes', stat: 'critChance', min: 0.03, max: 0.06, category: 'offense' },
    { id: 'r_crit_dmg', name: 'Ruinous', stat: 'critDamage', min: 0.15, max: 0.30, category: 'offense' },
    { id: 'r_cdr', name: 'Flowing', stat: 'cooldownReduction', min: 0.04, max: 0.08, category: 'offense' },
    { id: 'r_hp_pct', name: 'Vital', stat: 'maxHealth', min: 15, max: 30, category: 'defense' },
    { id: 'r_armor_pct', name: 'Reinforced Bulk', stat: 'armor', min: 15, max: 30, category: 'defense' },
    { id: 'r_dodge', name: 'Ghostly', stat: 'dodgeChance', min: 0.04, max: 0.08, category: 'defense' },
    { id: 'r_resource_cost', name: 'Efficient Core', stat: 'resourceCostReduction', min: 0.06, max: 0.12, category: 'utility' },
    { id: 'r_air_dash', name: 'Aerialist', stat: 'airDashCharges', min: 1, max: 1, category: 'parkour' },
    { id: 'r_sprint', name: 'Overdrive', stat: 'moveSpeed', min: 0.05, max: 0.10, category: 'utility' },
    { id: 'r_area', name: 'Cataclysmic', stat: 'areaDamage', min: 0.10, max: 0.20, category: 'offense' },
    { id: 'r_regen', name: 'Renewal', stat: 'healthRegen', min: 0.5, max: 1.0, category: 'defense' }
  ],

  [RARITY.LEGENDARY]: [
    { id: 'l_fabricators_torch', name: "Fabricator's Torch", stat: 'meleeAppliesBurning', min: 1, max: 1, trigger: 'melee applies Burning (20 dmg/s for 4s)', power: 'fabricators_torch' },
    { id: 'l_swarm_link', name: 'Swarm Link', stat: 'swarmLink', min: 0.20, max: 0.30, trigger: 'drones you kill have 20% chance to revive as allies', power: 'swarm_link' },
    { id: 'l_temporal_shift', name: 'Temporal Shift', stat: 'temporalShift', min: 1, max: 1, trigger: 'double-jump briefly slows time (0.5s bullet time)', power: 'temporal_shift' },
    { id: 'l_void_walk', name: 'Void Walk', stat: 'voidWalk', min: 1, max: 1, trigger: 'sprint through enemies to phase them (they become ethereal for 2s)', power: 'void_walk' },
    { id: 'l_boss_slayer', name: 'Boss Slayer', stat: 'bossDamageMult', min: 0.25, max: 0.40, trigger: '+25% damage vs bosses', power: 'boss_slayer' },
    { id: 'l_aegis_field', name: 'Aegis Field', stat: 'aegisField', min: 1, max: 1, trigger: 'perfect parry deploys 3s shield (absorbs 30 dmg)', power: 'aegis_field' },
    { id: 'l_loot_beacon', name: 'Loot Beacon', stat: 'lootRadius', min: 10, max: 15, trigger: '+10m pickup radius', power: 'loot_beacon' },
    { id: 'l_second_life', name: 'Second Life', stat: 'secondLifeCooldown', min: 300, max: 300, trigger: 'fatal blow healed once per 5 min', power: 'second_life' },
    { id: 'l_chain_lightning', name: 'Chain Lightning', stat: 'meleeChainLightning', min: 1, max: 1, trigger: 'melee arcs to 2 nearby enemies (50% weapon damage)', power: 'chain_lightning' },
    { id: 'l_omniscience', name: 'Omniscience', stat: 'omniscience', min: 1, max: 1, trigger: 'see enemy health bars through walls', power: 'omniscience' },
    { id: 'l_kinetic_cascade', name: 'Kinetic Cascade', stat: 'kineticCascade', min: 1, max: 1, trigger: 'every 3rd melee releases shockwave (4m, 30 dmg)', power: 'kinetic_cascade' },
    { id: 'l_adrenaline_surge', name: 'Adrenaline Surge', stat: 'adrenalineSurge', min: 0.20, max: 0.35, trigger: 'below 30% HP: +20% damage and +15% move speed', power: 'adrenaline_surge' }
  ],

  [RARITY.SET]: [
    // Set items roll from Rare + Legendary pools plus set bonus
    { id: 's_damage', name: 'Set-Blessed Might', stat: 'damageMultiplier', min: 0.10, max: 0.15, category: 'offense' },
    { id: 's_hp', name: 'Set-Blessed Vitality', stat: 'maxHealth', min: 20, max: 35, category: 'defense' },
    { id: 's_cdr', name: 'Set-Blessed Flow', stat: 'cooldownReduction', min: 0.05, max: 0.10, category: 'offense' }
  ],

  [RARITY.ANCIENT]: [
    // Ancient rolls same as Legendary but values are 30% higher
    { id: 'a_fabricators_torch', name: "Ancient Fabricator's Torch", stat: 'meleeAppliesBurning', min: 1, max: 1, trigger: 'melee applies Burning (26 dmg/s for 4s)', power: 'fabricators_torch' },
    { id: 'a_boss_slayer', name: 'Ancient Boss Slayer', stat: 'bossDamageMult', min: 0.33, max: 0.52, trigger: '+33% damage vs bosses', power: 'boss_slayer' },
    { id: 'a_loot_beacon', name: 'Ancient Loot Beacon', stat: 'lootRadius', min: 13, max: 20, trigger: '+13m pickup radius', power: 'loot_beacon' }
  ],

  [RARITY.PRIMAL]: [
    // Primal rolls max values on all stats + guaranteed perfect affixes
    { id: 'p_perfect', name: 'Primal Perfection', stat: 'damageMultiplier', min: 0.15, max: 0.15, category: 'offense' }
  ]
};

/* ================================================================
   AFFIX COUNT PER RARITY
   ================================================================ */

const AFFIX_COUNT = {
  [RARITY.COMMON]: 0,
  [RARITY.MAGIC]: 1,
  [RARITY.RARE]: 2,
  [RARITY.LEGENDARY]: 3,
  [RARITY.SET]: 3,
  [RARITY.ANCIENT]: 3,
  [RARITY.PRIMAL]: 4
};

/* ================================================================
   HELPERS
   ================================================================ */

function rng(max) {
  return Math.floor(Math.random() * max);
}

function rollInRange(min, max) {
  if (min === max) return min;
  const val = min + Math.random() * (max - min);
  // Round to 2 decimal places for percentages, integers for whole numbers
  if (max < 10 && max > 0 && max !== Math.floor(max)) {
    return Math.round(val * 100) / 100;
  }
  return Math.round(val);
}

function pickUnique(pool, count) {
  if (count <= 0) return [];
  const copy = pool.slice();
  const picked = [];
  for (let i = 0; i < count; i++) {
    if (copy.length === 0) break;
    const idx = rng(copy.length);
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
}

function getRarityName(rarityValue) {
  return RARITY_NAMES[rarityValue] || 'Unknown';
}

/* ================================================================
   AFFIX SYSTEM CLASS
   ================================================================ */

export class AffixSystem {
  constructor() {}

  /**
   * Roll affixes for a given rarity and slot.
   * @param {number} rarity — RARITY.* constant
   * @param {string} slot — gear slot id
   * @returns {Array} rolled affix objects
   */
  rollAffixes(rarity, slot) {
    const count = AFFIX_COUNT[rarity] || 0;
    if (count === 0) return [];

    let pool = AFFIX_POOL[rarity] || [];

    // Set items pull from Rare pool + Set pool
    if (rarity === RARITY.SET) {
      pool = [...AFFIX_POOL[RARITY.RARE], ...AFFIX_POOL[RARITY.SET]];
    }

    // Primal gets one guaranteed perfect offensive + one defensive + one utility + one parkour
    if (rarity === RARITY.PRIMAL) {
      return this._rollPrimalAffixes(slot);
    }

    const picked = pickUnique(pool, count);

    return picked.map((base) => ({
      id: base.id,
      name: base.name,
      stat: base.stat,
      value: rollInRange(base.min, base.max),
      tier: rarity,
      trigger: base.trigger || null,
      power: base.power || null,
      slotHint: slot || null,
      category: base.category || 'offense'
    }));
  }

  _rollPrimalAffixes(slot) {
    const categories = ['offense', 'defense', 'utility', 'parkour'];
    const affixes = [];
    for (const cat of categories) {
      // Find best affix in each category from Rare + Legendary pools
      const pool = [...AFFIX_POOL[RARITY.RARE], ...AFFIX_POOL[RARITY.LEGENDARY]];
      const matches = pool.filter(a => a.category === cat);
      if (matches.length > 0) {
        const base = matches[rng(matches.length)];
        affixes.push({
          id: 'p_' + base.id,
          name: 'Primal ' + base.name,
          stat: base.stat,
          value: base.max,
          tier: RARITY.PRIMAL,
          trigger: base.trigger || null,
          power: base.power || null,
          slotHint: slot || null,
          category: cat
        });
      }
    }
    return affixes;
  }

  getAffixBonus(affixes, statName) {
    if (!Array.isArray(affixes)) return 0;
    let total = 0;
    for (const a of affixes) {
      if (a.stat === statName && typeof a.value === 'number') {
        total += a.value;
      }
    }
    return total;
  }

  rerollAffix(item, affixIndex) {
    if (!item || !Array.isArray(item.affixes)) {
      console.warn('AffixSystem: invalid item for reroll');
      return null;
    }
    if (affixIndex < 0 || affixIndex >= item.affixes.length) {
      console.warn('AffixSystem: affixIndex out of bounds');
      return null;
    }

    const newAffixes = this.rollAffixes(item.rarity, item.slot);
    if (newAffixes.length === 0) {
      console.warn('AffixSystem: no affix pool for rarity', item.rarity);
      return null;
    }

    const replacement = newAffixes[rng(newAffixes.length)];
    item.affixes[affixIndex] = replacement;
    return replacement;
  }

  generateItem(baseItemTemplate) {
    if (!baseItemTemplate) return null;
    const item = {
      ...baseItemTemplate,
      affixes: this.rollAffixes(baseItemTemplate.rarity, baseItemTemplate.slot)
    };
    return item;
  }

  /**
   * Get all legendary powers from an item's affixes.
   * @returns {Array<string>} power ids
   */
  getLegendaryPowers(item) {
    if (!item || !item.affixes) return [];
    return item.affixes
      .filter(a => a.power)
      .map(a => a.power);
  }
}

export { getRarityName, RARITY_NAMES };
