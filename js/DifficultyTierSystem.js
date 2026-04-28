/**
 * DifficultyTierSystem.js
 * Global difficulty manager scaling enemy HP, damage, XP, and loot.
 * Tiers: Normal → Nightmare → Hell → Torment I–VI
 */

export const TIERS = {
  normal:     { id: 'normal',     name: 'Normal',     hpMult: 1.0,   dmgMult: 1.0,   xpBonus: 0,    lootBonus: 0,    unlock: 'start' },
  nightmare:  { id: 'nightmare',  name: 'Nightmare',  hpMult: 2.0,   dmgMult: 1.5,   xpBonus: 0.5,  lootBonus: 0.5,  unlock: 'completeAct1' },
  hell:       { id: 'hell',       name: 'Hell',       hpMult: 4.0,   dmgMult: 2.5,   xpBonus: 1.0,  lootBonus: 1.0,  unlock: 'completeAct2' },
  torment1:   { id: 'torment1',   name: 'Torment I',  hpMult: 8.0,   dmgMult: 4.0,   xpBonus: 2.0,  lootBonus: 2.0,  unlock: 'completeAct3' },
  torment2:   { id: 'torment2',   name: 'Torment II', hpMult: 16.0,  dmgMult: 6.0,   xpBonus: 2.5,  lootBonus: 2.5,  unlock: 'riftLevel10' },
  torment3:   { id: 'torment3',   name: 'Torment III',hpMult: 32.0,  dmgMult: 9.0,   xpBonus: 3.0,  lootBonus: 3.0,  unlock: 'riftLevel25' },
  torment4:   { id: 'torment4',   name: 'Torment IV', hpMult: 64.0,  dmgMult: 13.0,  xpBonus: 3.5,  lootBonus: 3.5,  unlock: 'riftLevel50' },
  torment5:   { id: 'torment5',   name: 'Torment V',  hpMult: 128.0, dmgMult: 19.0,  xpBonus: 4.0,  lootBonus: 4.0,  unlock: 'riftLevel75' },
  torment6:   { id: 'torment6',   name: 'Torment VI', hpMult: 256.0, dmgMult: 28.0,  xpBonus: 5.0,  lootBonus: 5.0,  unlock: 'riftLevel100' }
};

const TIER_ORDER = [
  'normal', 'nightmare', 'hell',
  'torment1', 'torment2', 'torment3', 'torment4', 'torment5', 'torment6'
];

export class DifficultyTierSystem {
  constructor(challengeSystem = null) {
    this.currentTier = 'normal';
    this.challengeSystem = challengeSystem;
    this.unlockedTiers = new Set(['normal']);
    this._load();
  }

  getTierConfig(tierId = this.currentTier) {
    return TIERS[tierId] || TIERS.normal;
  }

  getCurrentTier() {
    return this.getTierConfig();
  }

  setTier(tierId) {
    if (!TIERS[tierId]) {
      window.__DEV__ && console.warn('DifficultyTierSystem: unknown tier', tierId);
      return false;
    }
    if (!this.unlockedTiers.has(tierId)) {
      window.__DEV__ && console.warn('DifficultyTierSystem: tier locked', tierId);
      return false;
    }
    this.currentTier = tierId;
    this._save();
    this.updateHUD();
    return true;
  }

  getNextTier() {
    const idx = TIER_ORDER.indexOf(this.currentTier);
    return TIER_ORDER[idx + 1] || null;
  }

  unlockTier(tierId) {
    if (!TIERS[tierId]) return false;
    if (this.unlockedTiers.has(tierId)) return false;
    this.unlockedTiers.add(tierId);
    this._save();
    if (this.challengeSystem && this.challengeSystem.reportEvent) {
      this.challengeSystem.reportEvent('unlockTier', { tier: tierId });
    }
    return true;
  }

  isUnlocked(tierId) {
    return this.unlockedTiers.has(tierId);
  }

  /** Scale a base value by current difficulty */
  scaleEnemyHP(base) {
    return base * this.getTierConfig().hpMult;
  }

  scaleEnemyDamage(base) {
    return base * this.getTierConfig().dmgMult;
  }

  scaleXP(base) {
    return base * (1 + this.getTierConfig().xpBonus);
  }

  scaleLoot(base) {
    return base * (1 + this.getTierConfig().lootBonus);
  }

  /** Get display string for UI */
  getDisplayString() {
    const t = this.getTierConfig();
    return `${t.name} — HP ${t.hpMult}× / DMG ${t.dmgMult}× / XP +${Math.round(t.xpBonus * 100)}% / Loot +${Math.round(t.lootBonus * 100)}%`;
  }

  serialize() {
    return {
      currentTier: this.currentTier,
      unlockedTiers: Array.from(this.unlockedTiers)
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.currentTier && TIERS[data.currentTier]) {
      this.currentTier = data.currentTier;
    }
    if (Array.isArray(data.unlockedTiers)) {
      this.unlockedTiers = new Set(data.unlockedTiers.filter(t => TIERS[t]));
    }
  }

  _save() {
    try {
      localStorage.setItem('apex_difficulty', JSON.stringify(this.serialize()));
    } catch (e) { /* ignore */ }
  }

  _load() {
    try {
      const raw = localStorage.getItem('apex_difficulty');
      if (raw) this.deserialize(JSON.parse(raw));
    } catch (e) { /* ignore */ }
    this.updateHUD();
  }

  updateHUD() {
    const badge = document.getElementById('difficulty-badge');
    const popup = document.getElementById('difficulty-popup');
    if (!badge) return;
    const cfg = this.getTierConfig();
    badge.textContent = cfg.name;
    badge.className = 'tier-' + (cfg.id.startsWith('torment') ? 'torment' : cfg.id);
    if (popup) {
      popup.innerHTML = '';
      for (const id of TIER_ORDER) {
        const t = TIERS[id];
        const div = document.createElement('div');
        div.className = 'diff-tier' + (this.unlockedTiers.has(id) ? '' : ' locked');
        div.textContent = t.name;
        div.onclick = () => {
          if (this.setTier(id)) {
            popup.style.display = 'none';
            this._removeOutsideClickListener();
          }
        };
        popup.appendChild(div);
      }
    }
    badge.onclick = () => {
      if (popup) {
        const showing = popup.style.display === 'block';
        popup.style.display = showing ? 'none' : 'block';
        if (!showing) {
          this._outsideClickHandler = (e) => {
            if (!popup.contains(e.target) && e.target !== badge) {
              popup.style.display = 'none';
              document.removeEventListener('mousedown', this._outsideClickHandler);
            }
          };
          document.addEventListener('mousedown', this._outsideClickHandler);
        } else {
          this._removeOutsideClickListener();
        }
      }
    };
  }

  _removeOutsideClickListener() {
    if (this._outsideClickHandler) {
      document.removeEventListener('mousedown', this._outsideClickHandler);
      this._outsideClickHandler = null;
    }
  }
}
