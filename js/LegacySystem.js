/**
 * LegacySystem.js
 * Retirement and dynasty mechanics for endgame characters.
 * Pure data module — no Three.js objects.
 */

const MAX_DYNASTY_BONUS = 10;
const HALL_PEDESTALS = 10;

export class LegacySystem {
  /**
   * @param {CharacterSheet} characterSheet
   * @param {ProgressionSystem} progression
   * @param {ExoSuitSystem} exoSuit
   * @param {FamiliaritySystem} familiarity
   */
  constructor(characterSheet, progression, exoSuit, familiarity) {
    this.characterSheet = characterSheet;
    this.progression = progression;
    this.exoSuit = exoSuit;
    this.familiarity = familiarity;

    /** @type {object[]} */
    this.retiredRunners = [];
  }

  /* ---------- Retirement ---------- */

  canRetire() {
    return this.progression ? this.progression.getLevel() >= 50 : false;
  }

  /**
   * Retire the current runner and create a legacy record.
   * @param {string} runnerName
   * @param {string|null} [heirloomItemId] — optional explicit heirloom ID
   * @returns {object|null} the legacy record, or null if retirement failed
   */
  retire(runnerName, heirloomItemId = null) {
    if (!this.canRetire()) {
      console.warn('LegacySystem: cannot retire — level 50 required');
      return null;
    }

    const record = {
      name: String(runnerName),
      level: this.progression.getLevel(),
      archetype: this._getArchetype(),
      origin: this._getOrigin(),
      stats: this._snapshotStats(),
      heirloomItem: heirloomItemId || this._pickHeirloomItem(),
      codexProgress: this._computeCodexProgress(),
      retiredAt: Date.now()
    };

    this.retiredRunners.push(record);
    return record;
  }

  /* ---------- Dynasty ---------- */

  getRetiredRunners() {
    return this.retiredRunners.map(r => ({ ...r, stats: { ...r.stats } }));
  }

  getRetiredCount() {
    return this.retiredRunners.length;
  }

  getDynastyAttributeBonus() {
    return Math.min(this.retiredRunners.length, MAX_DYNASTY_BONUS);
  }

  getAvailableHeirlooms() {
    const heirlooms = [];
    for (const r of this.retiredRunners) {
      if (r.heirloomItem) {
        heirlooms.push({
          runnerName: r.name,
          itemId: r.heirloomItem,
          retiredAt: r.retiredAt
        });
      }
    }
    return heirlooms;
  }

  /* ---------- Hall of Legends ---------- */

  getHallStatus() {
    const status = new Array(HALL_PEDESTALS).fill(false);
    const filled = Math.min(this.retiredRunners.length, HALL_PEDESTALS);
    for (let i = 0; i < filled; i++) {
      status[i] = true;
    }
    return status;
  }

  /* ---------- Helpers ---------- */

  _getArchetype() {
    if (this.characterSheet && this.characterSheet.archetype) {
      return this.characterSheet.archetype;
    }
    if (this.characterSheet && this.characterSheet.player && this.characterSheet.player.archetype) {
      return this.characterSheet.player.archetype;
    }
    return 'unknown';
  }

  _getOrigin() {
    if (this.characterSheet && this.characterSheet.origin) {
      return this.characterSheet.origin;
    }
    if (this.characterSheet && this.characterSheet.player && this.characterSheet.player.origin) {
      return this.characterSheet.player.origin;
    }
    return 'unknown';
  }

  _snapshotStats() {
    const stats = {};
    if (this.characterSheet) {
      for (const key of ['mob', 'ref', 'syn', 'for', 'tec', 'gut']) {
        stats[key] = this.characterSheet.getRawStat(key);
      }
    }
    return stats;
  }

  _pickHeirloomItem() {
    if (!this.exoSuit) return null;
    const equipped = this.exoSuit.getAllEquipped ? this.exoSuit.getAllEquipped() : this.exoSuit.equipped;
    if (!equipped) return null;

    for (const slot of ['frame', 'boots', 'gloves', 'optics']) {
      const item = equipped[slot];
      if (item && item.id) {
        return item.id;
      }
    }
    return null;
  }

  _computeCodexProgress() {
    if (!this.familiarity) return { totalKills: 0, heirloomCount: 0 };

    let totalKills = 0;
    let heirloomCount = 0;

    // FamiliaritySystem stores data in a private Map; we use its serialize() for safe access.
    const data = this.familiarity.serialize ? this.familiarity.serialize() : {};
    for (const entry of Object.values(data)) {
      if (entry && typeof entry.kills === 'number') {
        totalKills += entry.kills;
        if (entry.kills >= 1000) {
          heirloomCount++;
        }
      }
    }

    return { totalKills, heirloomCount };
  }

  /* ---------- Serialization ---------- */

  serialize() {
    return {
      retiredRunners: this.retiredRunners.map(r => ({ ...r, stats: { ...r.stats } }))
    };
  }

  deserialize(data) {
    if (!data || !Array.isArray(data.retiredRunners)) return;

    this.retiredRunners = data.retiredRunners.map(r => ({
      name: r.name || 'Unknown',
      level: r.level || 50,
      archetype: r.archetype || 'unknown',
      origin: r.origin || 'unknown',
      stats: r.stats ? { ...r.stats } : {},
      heirloomItem: r.heirloomItem || null,
      codexProgress: r.codexProgress || { totalKills: 0, heirloomCount: 0 },
      retiredAt: r.retiredAt || Date.now()
    }));
  }
}
