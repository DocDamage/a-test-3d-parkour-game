const TIERS = [
  { threshold: 0,   tier: 0, name: 'Stranger',     damageMult: 1.00 },
  { threshold: 50,  tier: 1, name: 'Acquainted',   damageMult: 1.05 },
  { threshold: 200, tier: 2, name: 'Bonded',       damageMult: 1.08 },
  { threshold: 500, tier: 3, name: 'Soul-Linked',  damageMult: 1.12 },
  { threshold: 1000, tier: 4, name: 'Heirloom',    damageMult: 1.20 }
];

const HEIRLOOM_THRESHOLD = 1000;
const NAMING_THRESHOLD = 200;

export class FamiliaritySystem {
  constructor() {
    this.weaponData = new Map();
  }

  _ensure(weaponId) {
    if (!this.weaponData.has(weaponId)) {
      this.weaponData.set(weaponId, { kills: 0, heirloomName: null });
    }
    return this.weaponData.get(weaponId);
  }

  addKill(weaponId) {
    const data = this._ensure(weaponId);
    data.kills += 1;
    return data.kills;
  }

  getKills(weaponId) {
    const data = this.weaponData.get(weaponId);
    return data ? data.kills : 0;
  }

  getFamiliarityTier(weaponId) {
    const kills = this.getKills(weaponId);
    let active = 0;
    for (const t of TIERS) {
      if (kills >= t.threshold) {
        active = t.tier;
      }
    }
    return active;
  }

  getFamiliarityBonus(weaponId) {
    const kills = this.getKills(weaponId);
    let active = TIERS[0];
    for (const t of TIERS) {
      if (kills >= t.threshold) {
        active = t;
      }
    }
    return {
      tier: active.tier,
      tierName: active.name,
      damageMult: active.damageMult,
      hasHiddenAffixSlot: active.tier >= 3,
      isHeirloom: active.tier >= 4
    };
  }

  isHeirloom(weaponId) {
    return this.getKills(weaponId) >= HEIRLOOM_THRESHOLD;
  }

  setHeirloomName(weaponId, name) {
    if (this.getKills(weaponId) < NAMING_THRESHOLD) {
      console.warn(`FamiliaritySystem: cannot name weapon until ${NAMING_THRESHOLD} kills`);
      return false;
    }
    const data = this._ensure(weaponId);
    data.heirloomName = String(name);
    return true;
  }

  getHeirloomName(weaponId) {
    const data = this.weaponData.get(weaponId);
    return data ? data.heirloomName : null;
  }

  serialize() {
    const obj = {};
    for (const [id, data] of this.weaponData.entries()) {
      obj[id] = { kills: data.kills, heirloomName: data.heirloomName };
    }
    return obj;
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') {
      console.warn('FamiliaritySystem: invalid deserialize data');
      return;
    }
    this.weaponData.clear();
    for (const [id, entry] of Object.entries(data)) {
      if (entry && typeof entry.kills === 'number') {
        this.weaponData.set(id, {
          kills: entry.kills,
          heirloomName: entry.heirloomName || null
        });
      }
    }
  }
}
