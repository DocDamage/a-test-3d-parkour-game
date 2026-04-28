import { createProceduralWeaponAdapter } from './ProceduralWeaponAdapter.js';

export class InventoryStash {
  constructor(player, exoSuitSystem, characterSheet) {
    this.player = player;
    this.exoSuit = exoSuitSystem;
    this.characterSheet = characterSheet;
    this.gemSystem = null;
    this.weaponSystem = null;
    this.scene = null;
    this.stash = [];
    this.maxSize = Infinity;
    this.deserialize();
  }

  acquireItem(item) {
    if (!item) return false;
    this.stash.push({ ...item });
    this.serialize();
    return true;
  }

  setGemSystem(gemSystem) {
    this.gemSystem = gemSystem;
  }

  setWeaponSystem(weaponSystem, scene = null) {
    this.weaponSystem = weaponSystem;
    this.scene = scene;
  }

  identifyItem(index) {
    if (index < 0 || index >= this.stash.length) return false;
    const item = this.stash[index];
    if (!item || (!item.unidentified && item.identified)) return false;
    item.identified = true;
    item.unidentified = false;
    if (item.name && item.name.startsWith('Unidentified ')) item.name = item.name.replace('Unidentified ', '');
    this.serialize();
    return true;
  }

  identifyAll(costPerItem = 10) {
    const targets = this.stash
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item && item.unidentified && !item.identified);
    if (!targets.length) return { identified: 0, cost: 0, ok: true };

    const cost = Math.max(0, Math.floor(costPerItem)) * targets.length;
    const chips = this.player?._chips ?? this.player?.chips ?? 0;
    if (cost > 0 && chips < cost) return { identified: 0, cost, ok: false };

    if (cost > 0 && this.player) {
      const remaining = Math.max(0, chips - cost);
      if ('_chips' in this.player || !('chips' in this.player)) this.player._chips = remaining;
      if ('chips' in this.player) this.player.chips = remaining;
    }

    for (const { index } of targets) this.identifyItem(index);
    return { identified: targets.length, cost, ok: true };
  }

  socketBestGem(index) {
    if (!this.gemSystem || index < 0 || index >= this.stash.length) return false;
    const ok = this.gemSystem.socketBestGem(this.stash[index]);
    if (ok) this.serialize();
    return ok;
  }

  socketGem(index, gemId) {
    if (!this.gemSystem || index < 0 || index >= this.stash.length) return false;
    const ok = this.gemSystem.socketGem(this.stash[index], gemId);
    if (ok) this.serialize();
    return ok;
  }

  unsocketGem(index, gemIndex) {
    if (!this.gemSystem || index < 0 || index >= this.stash.length) return false;
    const ok = this.gemSystem.unsocketGem(this.stash[index], gemIndex);
    if (ok) this.serialize();
    return ok;
  }

  equipFromStash(index) {
    if (index < 0 || index >= this.stash.length) return false;
    const item = this.stash[index];
    if (item.unidentified && !item.identified) return false;
    if (item.itemType === 'weapon') return this._equipWeaponFromBackpack(index, item);
    if (!this.exoSuit) return false;
    const previous = this.exoSuit.equip(item);
    this.stash.splice(index, 1);
    if (previous) this.stash.push(previous);
    this.serialize();
    return true;
  }

  scrapItem(index) {
    if (index < 0 || index >= this.stash.length) return false;
    const item = this.stash[index];
    const amount = this._scrapValue(item);
    if (this.player) {
      this.player.scrap = (this.player.scrap || 0) + amount;
      this.player._scrap = (this.player._scrap || 0) + amount;
    }
    this.stash.splice(index, 1);
    this.serialize();
    return amount;
  }

  getStash() {
    return [...this.stash];
  }

  getUnidentifiedCount() {
    return this.stash.filter(item => item && item.unidentified && !item.identified).length;
  }

  serialize() {
    try {
      localStorage.setItem('apex_inventory_stash', JSON.stringify(this.stash));
    } catch (e) { /* ignore */ }
    return {
      maxSize: null,
      stash: this.stash
    };
  }

  deserialize(data = null) {
    try {
      if (data && Array.isArray(data.stash)) {
        this.stash = data.stash;
        return;
      }
      if (Array.isArray(data)) {
        this.stash = data;
        return;
      }
      const raw = localStorage.getItem('apex_inventory_stash');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) this.stash = parsed;
      else if (parsed && Array.isArray(parsed.stash)) this.stash = parsed.stash;
    } catch (e) { /* ignore */ }
  }

  _scrapValue(item) {
    if (item?.itemType === 'weapon') {
      const values = { common: 2, uncommon: 4, rare: 7, epic: 12, legendary: 20 };
      return values[item.rarity] || Math.max(2, Math.floor((item.itemPower || item.gearScore || 100) / 100));
    }
    const rarity = item.rarity || 1;
    const values = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 5, 6: 8, 7: 10 };
    return values[rarity] || 1;
  }

  _equipWeaponFromBackpack(index, item) {
    if (!this.weaponSystem) return false;
    const weapon = createProceduralWeaponAdapter(item, this.scene, this.player);
    const slot = item.slot || weapon.slot;
    const previous = this.weaponSystem.getWeapon(slot);
    if (!this.weaponSystem.equip(weapon, slot)) {
      weapon.dispose?.();
      return false;
    }
    this.weaponSystem.registerUnlocked(weapon);
    this.weaponSystem.switchSlot(slot);
    this.stash.splice(index, 1);
    if (previous?.isProceduralWeapon && typeof previous.toItemData === 'function') {
      previous.dispose?.();
      this.stash.push(previous.toItemData());
    }
    this.serialize();
    return true;
  }
}
