export class InventoryStash {
  constructor(player, exoSuitSystem, characterSheet) {
    this.player = player;
    this.exoSuit = exoSuitSystem;
    this.characterSheet = characterSheet;
    this.stash = [];
    this.maxSize = 20;
    this.deserialize();
  }

  acquireItem(item) {
    if (!item) return false;
    if (this.stash.length >= this.maxSize) {
      window.__DEV__ && console.warn('[Stash] Full — cannot acquire', item.name || 'item');
      return false;
    }
    this.stash.push(item);
    this.serialize();
    return true;
  }

  equipFromStash(index) {
    if (index < 0 || index >= this.stash.length) return false;
    const item = this.stash[index];
    if (!this.exoSuit) return false;
    this.exoSuit.equip(item);
    this.stash.splice(index, 1);
    this.serialize();
    return true;
  }

  scrapItem(index) {
    if (index < 0 || index >= this.stash.length) return false;
    const item = this.stash[index];
    const amount = this._scrapValue(item);
    if (this.player) {
      this.player.scrap = (this.player.scrap || 0) + amount;
    }
    this.stash.splice(index, 1);
    this.serialize();
    return amount;
  }

  getStash() {
    return [...this.stash];
  }

  serialize() {
    try {
      localStorage.setItem('apex_inventory_stash', JSON.stringify(this.stash));
    } catch (e) { /* ignore */ }
  }

  deserialize() {
    try {
      const raw = localStorage.getItem('apex_inventory_stash');
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) this.stash = data;
      }
    } catch (e) { /* ignore */ }
  }

  _scrapValue(item) {
    const rarity = item.rarity || 1;
    const values = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 5, 6: 8, 7: 10 };
    return values[rarity] || 1;
  }
}
