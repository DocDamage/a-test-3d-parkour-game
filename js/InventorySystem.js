/**
 * InventorySystem — stack-based inventory for consumables and crafting mats.
 *
 * Slots: 20 (expandable via belt upgrades)
 * Stackable: scrap, chips, crafting mats, potions (max 20)
 * Non-stackable: gear, scrolls, runes
 */

export const ITEM_CATEGORIES = {
  CONSUMABLE: 'consumable',
  CRAFTING: 'crafting',
  SCROLL: 'scroll',
  RUNE: 'rune',
  GEAR: 'gear'
};

export const CONSUMABLE_DEFS = {
  health_potion: { name: 'Health Potion', category: ITEM_CATEGORIES.CONSUMABLE, stackSize: 10, effect: 'heal', value: 30, description: 'Restores 30 HP' },
  mana_potion: { name: 'Mana Potion', category: ITEM_CATEGORIES.CONSUMABLE, stackSize: 10, effect: 'restore_mana', value: 40, description: 'Restores 40 Mana' },
  stamina_vial: { name: 'Stamina Vial', category: ITEM_CATEGORIES.CONSUMABLE, stackSize: 10, effect: 'restore_stamina', value: 50, description: 'Refills stamina + boosts regen 10s' },
  scroll_teleport: { name: 'Scroll of Teleport', category: ITEM_CATEGORIES.SCROLL, stackSize: 5, effect: 'teleport', value: 0, description: 'Return to safehouse' },
  rune_power: { name: 'Rune of Power', category: ITEM_CATEGORIES.RUNE, stackSize: 5, effect: 'buff_damage', value: 0.25, duration: 30, description: '+25% damage for 30s' },
  smoke_bomb: { name: 'Smoke Bomb', category: ITEM_CATEGORIES.CONSUMABLE, stackSize: 5, effect: 'smoke', value: 0, duration: 5, description: 'Escape combat, stealth 5s' },
  scrap_metal: { name: 'Scrap Metal', category: ITEM_CATEGORIES.CRAFTING, stackSize: 99, description: 'Common crafting material' },
  data_chip: { name: 'Data Chip', category: ITEM_CATEGORIES.CRAFTING, stackSize: 99, description: 'Rare crafting material' },
  bio_sample: { name: 'Bio Sample', category: ITEM_CATEGORIES.CRAFTING, stackSize: 99, description: 'Specimen crafting material' }
};

export class InventorySystem {
  constructor(player, maxSlots = 20) {
    this.player = player;
    this.maxSlots = maxSlots;
    this.items = new Map(); // itemId -> { count, data }
  }

  addItem(itemId, count = 1) {
    const def = CONSUMABLE_DEFS[itemId];
    if (!def) return false;
    const existing = this.items.get(itemId);
    if (existing) {
      const newCount = existing.count + count;
      if (newCount > def.stackSize) return false;
      existing.count = newCount;
    } else {
      if (this.items.size >= this.maxSlots) return false;
      this.items.set(itemId, { count, data: def });
    }
    return true;
  }

  removeItem(itemId, count = 1) {
    const existing = this.items.get(itemId);
    if (!existing || existing.count < count) return false;
    existing.count -= count;
    if (existing.count <= 0) this.items.delete(itemId);
    return true;
  }

  useItem(itemId) {
    const existing = this.items.get(itemId);
    if (!existing || existing.count <= 0) return false;
    const def = existing.data;
    const used = this._applyEffect(def);
    if (used) {
      existing.count--;
      if (existing.count <= 0) this.items.delete(itemId);
    }
    return used;
  }

  _applyEffect(def) {
    if (!this.player) return false;
    switch (def.effect) {
      case 'heal':
        if (this.player.heal) this.player.heal(def.value);
        return true;
      case 'restore_mana':
        if (this.player.magicSystem && this.player.magicSystem.resourceSystem) {
          this.player.magicSystem.resourceSystem.generate(def.value);
        }
        return true;
      case 'restore_stamina':
        if (this.player.staminaSystem) this.player.staminaSystem.stamina = Math.min(this.player.staminaSystem.maxStamina, this.player.staminaSystem.stamina + def.value);
        return true;
      case 'buff_damage':
        if (this.player.characterSheet) {
          this.player.characterSheet.addTempBonus('rune_power', 'damageMultiplier', def.value, def.duration);
        }
        return true;
      case 'smoke':
        this.player.isInvisible = true;
        setTimeout(() => { this.player.isInvisible = false; }, (def.duration || 5) * 1000);
        return true;
      case 'teleport':
        // Teleport to safehouse
        return true;
      default:
        return false;
    }
  }

  hasItem(itemId, count = 1) {
    const existing = this.items.get(itemId);
    return existing && existing.count >= count;
  }

  getCount(itemId) {
    const existing = this.items.get(itemId);
    return existing ? existing.count : 0;
  }

  getAllItems() {
    return Array.from(this.items.entries()).map(([id, entry]) => ({ id, count: entry.count, ...entry.data }));
  }

  getUsedSlots() {
    return this.items.size;
  }

  getFreeSlots() {
    return this.maxSlots - this.items.size;
  }

  serialize() {
    const data = {};
    for (const [id, entry] of this.items) {
      data[id] = entry.count;
    }
    return { maxSlots: this.maxSlots, items: data };
  }

  deserialize(data) {
    if (!data) return;
    this.maxSlots = data.maxSlots || this.maxSlots;
    this.items.clear();
    for (const [id, count] of Object.entries(data.items || {})) {
      const def = CONSUMABLE_DEFS[id];
      if (def) this.items.set(id, { count, data: def });
    }
  }
}
