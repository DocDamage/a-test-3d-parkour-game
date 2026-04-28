export const GEM_DEFS = {
  ruby: { name: 'Ruby', color: '#ff3355', bonuses: { meleeDamage: 0.05, damageMultiplier: 0.03 } },
  sapphire: { name: 'Sapphire', color: '#4488ff', bonuses: { cooldownReduction: 0.03, resourceCostReduction: 0.03 } },
  emerald: { name: 'Emerald', color: '#22dd77', bonuses: { critChance: 0.03, magicFind: 0.05 } },
  diamond: { name: 'Diamond', color: '#ddddff', bonuses: { armor: 10, resistance: 8 } },
  topaz: { name: 'Topaz', color: '#ffcc44', bonuses: { moveSpeed: 0.03, pickupRadius: 1 } }
};

export class GemSystem {
  constructor() {
    this.gems = new Map();
    this.deserialize();
  }

  addGem(id, count = 1) {
    if (!GEM_DEFS[id]) return false;
    this.gems.set(id, (this.gems.get(id) || 0) + count);
    this.serialize();
    return true;
  }

  socketGem(item, gemId) {
    if (!item || !GEM_DEFS[gemId] || (this.gems.get(gemId) || 0) <= 0) return false;
    item.sockets = item.sockets ?? this.getSocketLimit(item);
    item.gems = item.gems || [];
    if (item.gems.length >= item.sockets) return false;
    item.gems.push({ id: gemId, ...GEM_DEFS[gemId] });
    this.gems.set(gemId, this.gems.get(gemId) - 1);
    if (this.gems.get(gemId) <= 0) this.gems.delete(gemId);
    this.serialize();
    return true;
  }

  unsocketGem(item, gemIndex) {
    if (!item || !Array.isArray(item.gems)) return false;
    if (gemIndex < 0 || gemIndex >= item.gems.length) return false;
    const [gem] = item.gems.splice(gemIndex, 1);
    if (!gem || !GEM_DEFS[gem.id]) return false;
    this.addGem(gem.id, 1);
    return true;
  }

  socketBestGem(item) {
    const first = this.getAllGems()[0];
    return first ? this.socketGem(item, first.id) : false;
  }

  getSocketLimit(item) {
    const rarity = item?.rarity || 1;
    if (rarity >= 6) return 3;
    if (rarity >= 4) return 2;
    if (rarity >= 2) return 1;
    return 0;
  }

  getAllGems() {
    return Array.from(this.gems.entries()).map(([id, count]) => ({ id, count, ...GEM_DEFS[id] }));
  }

  serialize() {
    try { localStorage.setItem('apex_gems', JSON.stringify(Object.fromEntries(this.gems))); } catch (e) { /* ignore */ }
  }

  deserialize() {
    try {
      const data = JSON.parse(localStorage.getItem('apex_gems') || '{}');
      Object.entries(data).forEach(([id, count]) => { if (GEM_DEFS[id]) this.gems.set(id, count); });
    } catch (e) { /* ignore */ }
  }
}
