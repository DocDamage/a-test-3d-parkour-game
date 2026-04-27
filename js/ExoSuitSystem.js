export const SLOTS = {
  FRAME: 'frame',
  BOOTS: 'boots',
  GLOVES: 'gloves',
  OPTICS: 'optics'
};

export const MANUFACTURERS = {
  SYNAPSE: 'synapse',
  REDLINE: 'redline',
  HOLLOW: 'hollow',
  GHOSTWORKS: 'ghostworks'
};

const VALID_SLOTS = new Set(Object.values(SLOTS));

const SET_BONUSES = {
  [MANUFACTURERS.SYNAPSE]: {
    2: { id: 'synapse_2pc', description: 'EMP radius +4m', stats: { empRadius: 4 } },
    4: { id: 'synapse_4pc', description: 'Hijacked drones last 2× longer', stats: { hijackDurationMult: 2.0 } }
  },
  [MANUFACTURERS.REDLINE]: {
    2: { id: 'redline_2pc', description: 'Shoulder bash breaks all shields', stats: { shieldBreak: true } },
    4: { id: 'redline_4pc', description: 'Sprinting leaves fire trail (5/s DOT)', stats: { fireTrail: true, fireTrailDamage: 5 } }
  },
  [MANUFACTURERS.HOLLOW]: {
    2: { id: 'hollow_2pc', description: 'Explosive radius +25%', stats: { explosiveRadiusMult: 0.25 } },
    4: { id: 'hollow_4pc', description: 'Self-damage from explosions -75%', stats: { selfExplosiveDamageReduction: 0.75 } }
  },
  [MANUFACTURERS.GHOSTWORKS]: {
    2: { id: 'ghostworks_2pc', description: 'Silent takedowns work on elites', stats: { eliteSilentTakedown: true } },
    4: { id: 'ghostworks_4pc', description: 'Crouched enemies detect at 1m', stats: { crouchDetectionRadius: 1.0 } }
  }
};

export const PRE_DEFINED_ITEMS = [
  {
    id: 'kinetic_weave',
    name: 'Kinetic Weave',
    rarity: 2,
    slot: SLOTS.FRAME,
    manufacturer: MANUFACTURERS.REDLINE,
    baseStats: { meleeDamage: 0.15 },
    affixes: [],
    description: '+15% melee dmg, -10% max stamina'
  },
  {
    id: 'aeroframe',
    name: 'AeroFrame',
    rarity: 3,
    slot: SLOTS.FRAME,
    manufacturer: MANUFACTURERS.SYNAPSE,
    baseStats: { airDashStaminaCost: 0, maxHealth: -20 },
    affixes: [],
    description: 'Air dash costs 0 stamina, -20 HP max'
  },
  {
    id: 'mag_stompers',
    name: 'Mag-Stompers',
    rarity: 2,
    slot: SLOTS.BOOTS,
    manufacturer: MANUFACTURERS.HOLLOW,
    baseStats: { ceilingDropDamage: 15 },
    affixes: [],
    description: 'Ceiling drop +15 dmg'
  },
  {
    id: 'ghost_soles',
    name: 'Ghost Soles',
    rarity: 3,
    slot: SLOTS.BOOTS,
    manufacturer: MANUFACTURERS.GHOSTWORKS,
    baseStats: { crouchWalkSilent: true },
    affixes: [],
    description: 'Crouch-walk silent'
  },
  {
    id: 'shock_gauntlets',
    name: 'Shock Gauntlets',
    rarity: 3,
    slot: SLOTS.GLOVES,
    manufacturer: MANUFACTURERS.SYNAPSE,
    baseStats: { lightAttackStunChance: 0.15 },
    affixes: [],
    description: 'Light attacks 15% stun'
  },
  {
    id: 'junker_gloves',
    name: 'Junker Gloves',
    rarity: 1,
    slot: SLOTS.GLOVES,
    manufacturer: MANUFACTURERS.HOLLOW,
    baseStats: { meleeHarvestScrap: 1 },
    affixes: [],
    description: 'Melee harvests 1 scrap'
  },
  {
    id: 'predator_lens',
    name: 'Predator Lens',
    rarity: 3,
    slot: SLOTS.OPTICS,
    manufacturer: MANUFACTURERS.REDLINE,
    baseStats: { revealWeakPoints: true },
    affixes: [],
    description: 'V reveals weak points'
  },
  {
    id: 'tac_optics',
    name: 'Tac-Optics',
    rarity: 2,
    slot: SLOTS.OPTICS,
    manufacturer: MANUFACTURERS.GHOSTWORKS,
    baseStats: { adsFov: 65 },
    affixes: [],
    description: 'ADS FOV 65°'
  }
];

export class ExoSuitSystem {
  constructor(player, characterSheet) {
    this.player = player;
    this.characterSheet = characterSheet;
    this.equipped = {
      [SLOTS.FRAME]: null,
      [SLOTS.BOOTS]: null,
      [SLOTS.GLOVES]: null,
      [SLOTS.OPTICS]: null
    };
  }

  equip(item) {
    if (!item || !VALID_SLOTS.has(item.slot)) {
      console.warn('ExoSuitSystem: invalid item or slot', item);
      return false;
    }
    const prev = this.equipped[item.slot];
    this.equipped[item.slot] = item;
    this._syncGearBonuses();
    this._save();
    if (this.onEquip) this.onEquip(item);
    return prev;
  }

  unequip(slot) {
    if (!VALID_SLOTS.has(slot)) return null;
    const prev = this.equipped[slot];
    this.equipped[slot] = null;
    this._syncGearBonuses();
    return prev;
  }

  _syncGearBonuses() {
    if (this.characterSheet && this.characterSheet.setGearBonuses) {
      this.characterSheet.setGearBonuses(this.getTotalBonuses());
    }
  }

  getEquipped(slot) {
    if (!VALID_SLOTS.has(slot)) return null;
    return this.equipped[slot];
  }

  getAllEquipped() {
    return { ...this.equipped };
  }

  getItemTemplate(id) {
    return PRE_DEFINED_ITEMS.find(item => item.id === id) || null;
  }

  getManufacturerCount(manufacturer) {
    let count = 0;
    for (const slot of VALID_SLOTS) {
      const item = this.equipped[slot];
      if (item && item.manufacturer === manufacturer) {
        count++;
      }
    }
    return count;
  }

  getActiveSetBonuses() {
    const bonuses = [];
    for (const manu of Object.values(MANUFACTURERS)) {
      const count = this.getManufacturerCount(manu);
      const thresholds = SET_BONUSES[manu];
      if (!thresholds) continue;
      const tiers = Object.keys(thresholds)
        .map(Number)
        .sort((a, b) => a - b);
      for (const t of tiers) {
        if (count >= t) {
          bonuses.push({ manufacturer: manu, pieces: t, ...thresholds[t] });
        }
      }
    }
    return bonuses;
  }

  getTotalBonuses() {
    const totals = {};

    for (const slot of VALID_SLOTS) {
      const item = this.equipped[slot];
      if (!item) continue;
      if (item.baseStats) {
        for (const [key, val] of Object.entries(item.baseStats)) {
          totals[key] = (totals[key] || 0) + val;
        }
      }
      if (item.affixes) {
        for (const affix of item.affixes) {
          if (affix.stat != null && affix.value != null) {
            totals[affix.stat] = (totals[affix.stat] || 0) + affix.value;
          }
        }
      }
    }

    const setBonuses = this.getActiveSetBonuses();
    for (const bonus of setBonuses) {
      if (bonus.stats) {
        for (const [key, val] of Object.entries(bonus.stats)) {
          if (typeof val === 'number') {
            totals[key] = (totals[key] || 0) + val;
          } else {
            totals[key] = val;
          }
        }
      }
    }

    return totals;
  }

  getGearScore() {
    let raritySum = 0;
    let pieceCount = 0;
    let statSum = 0;

    for (const slot of VALID_SLOTS) {
      const item = this.equipped[slot];
      if (item) {
        raritySum += (item.rarity || 1);
        pieceCount++;
      }
    }

    if (pieceCount === 0) return 0;

    if (this.characterSheet) {
      statSum += (this.characterSheet.mob || 0);
      statSum += (this.characterSheet.ref || 0);
      statSum += (this.characterSheet.for || 0);
    }

    const avgRarity = raritySum / pieceCount;
    return (avgRarity * statSum) / 10;
  }

  getBonusDescriptions() {
    const descriptions = [];
    for (const slot of VALID_SLOTS) {
      const item = this.equipped[slot];
      if (!item) continue;
      descriptions.push(`${item.name} (${slot}): ${item.description || ''}`);
      if (item.baseStats) {
        for (const [key, val] of Object.entries(item.baseStats)) {
          descriptions.push(`  ${key}: ${val}`);
        }
      }
      if (item.affixes) {
        for (const affix of item.affixes) {
          descriptions.push(`  ${affix.name}: ${affix.stat} ${affix.value}`);
        }
      }
    }
    const setBonuses = this.getActiveSetBonuses();
    for (const bonus of setBonuses) {
      descriptions.push(`Set (${bonus.manufacturer} ${bonus.pieces}pc): ${bonus.description}`);
    }
    return descriptions;
  }

  _save() {
    try {
      const data = {};
      for (const slot of VALID_SLOTS) {
        const item = this.equipped[slot];
        data[slot] = item ? { ...item } : null;
      }
      localStorage.setItem('apex_exosuit', JSON.stringify(data));
    } catch (e) { /* ignore */ }
  }

  _load() {
    try {
      const raw = localStorage.getItem('apex_exosuit');
      if (!raw) return;
      const data = JSON.parse(raw);
      for (const slot of VALID_SLOTS) {
        this.equipped[slot] = data[slot] || null;
      }
      this._syncGearBonuses();
    } catch (e) { /* ignore */ }
  }
}
