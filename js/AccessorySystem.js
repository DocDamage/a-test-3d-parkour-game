/**
 * AccessorySystem — rings, amulets, belts with unique passive effects.
 *
 * Rules:
 *   - 4 slots: amulet, ring_left, ring_right, belt
 *   - Accessories can roll ANY affix category
 *   - Legendary accessories have unique passive effects (not just stats)
 *   - No set bonuses
 *   - Can be swapped mid-combat (no cooldown)
 */

export const ACCESSORY_SLOTS = {
  AMULET: 'amulet',
  RING_LEFT: 'ring_left',
  RING_RIGHT: 'ring_right',
  BELT: 'belt'
};

const VALID_ACCESSORY_SLOTS = new Set(Object.values(ACCESSORY_SLOTS));

export const LEGENDARY_ACCESSORY_POWERS = {
  'amulet_of_echoes': { description: '20% chance to cast last spell again for free', effect: 'spell_echo' },
  'ring_of_the_vortex': { description: 'Pull nearby loot within 3m automatically', effect: 'loot_magnet' },
  'belt_of_the_ox': { description: '+50 max stamina, +20% knockback resistance', effect: 'ox_stamina' },
  'signet_of_doom': { description: 'Enemies below 10% HP are marked for execution', effect: 'execution_mark' }
};

export class AccessorySystem {
  constructor(player, characterSheet) {
    this.player = player;
    this.characterSheet = characterSheet;
    this.equipped = {
      [ACCESSORY_SLOTS.AMULET]: null,
      [ACCESSORY_SLOTS.RING_LEFT]: null,
      [ACCESSORY_SLOTS.RING_RIGHT]: null,
      [ACCESSORY_SLOTS.BELT]: null
    };
    this._passiveEffects = new Set();
  }

  equip(item) {
    if (!item || !VALID_ACCESSORY_SLOTS.has(item.slot)) {
      console.warn('AccessorySystem: invalid item or slot', item);
      return false;
    }
    const prev = this.equipped[item.slot];
    this.equipped[item.slot] = item;
    this._syncBonuses();
    this._updatePassiveEffects();
    if (this.onEquip) this.onEquip(item);
    return prev;
  }

  unequip(slot) {
    if (!VALID_ACCESSORY_SLOTS.has(slot)) return null;
    const prev = this.equipped[slot];
    this.equipped[slot] = null;
    this._syncBonuses();
    this._updatePassiveEffects();
    return prev;
  }

  _syncBonuses() {
    if (this.characterSheet && this.characterSheet.setAccessoryBonuses) {
      this.characterSheet.setAccessoryBonuses(this.getTotalBonuses());
    } else if (this.characterSheet && this.characterSheet.setGearBonuses) {
      // Merge with gear bonuses if no dedicated accessory method
      const gear = this.characterSheet.getGearBonuses ? this.characterSheet.getGearBonuses() : {};
      const accessory = this.getTotalBonuses();
      const merged = { ...gear };
      for (const [k, v] of Object.entries(accessory)) {
        merged[k] = (merged[k] || 0) + v;
      }
      this.characterSheet.setGearBonuses(merged);
    }
  }

  getTotalBonuses() {
    const totals = {};
    for (const slot of VALID_ACCESSORY_SLOTS) {
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
    return totals;
  }

  getLegendaryPowers() {
    const powers = [];
    for (const slot of VALID_ACCESSORY_SLOTS) {
      const item = this.equipped[slot];
      if (!item || item.rarity < 4) continue;
      const power = LEGENDARY_ACCESSORY_POWERS[item.id];
      if (power) powers.push(power);
    }
    return powers;
  }

  _updatePassiveEffects() {
    this._passiveEffects.clear();
    for (const slot of VALID_ACCESSORY_SLOTS) {
      const item = this.equipped[slot];
      if (!item || item.rarity < 4) continue;
      const power = LEGENDARY_ACCESSORY_POWERS[item.id];
      if (power && power.effect) this._passiveEffects.add(power.effect);
    }
  }

  hasPassiveEffect(effectId) {
    return this._passiveEffects.has(effectId);
  }

  getEquipped(slot) {
    if (!VALID_ACCESSORY_SLOTS.has(slot)) return null;
    return this.equipped[slot];
  }

  getAllEquipped() {
    return { ...this.equipped };
  }

  serialize() {
    const data = {};
    for (const slot of VALID_ACCESSORY_SLOTS) {
      data[slot] = this.equipped[slot] ? { ...this.equipped[slot] } : null;
    }
    return data;
  }

  deserialize(data) {
    if (!data) return;
    for (const slot of VALID_ACCESSORY_SLOTS) {
      this.equipped[slot] = data[slot] || null;
    }
    this._syncBonuses();
    this._updatePassiveEffects();
  }
}
