/**
 * NewGamePlus.js
 * NG+ system with escalating corruption modifiers.
 * Pure data module — no Three.js objects.
 */

const CORRUPTION_TABLE = [
  {
    id: 'chain_reaction',
    name: 'Chain Reaction',
    description: 'All explosions chain to nearby enemies'
  },
  {
    id: 'gravity_shifts',
    name: 'Gravity Shifts',
    description: 'Gravity direction changes every 60s'
  },
  {
    id: 'rapid_respawn',
    name: 'Rapid Respawn',
    description: 'Drones respawn 30s after death'
  },
  {
    id: 'static_field',
    name: 'Static Field',
    description: 'Random EMP bursts every 2 minutes'
  },
  {
    id: 'director_watches',
    name: 'The Director Watches',
    description: 'All drones are elite variant'
  }
];

export class NewGamePlus {
  /**
   * @param {object} player — the Player instance
   * @param {object} world — the World instance
   * @param {CharacterSheet} characterSheet
   */
  constructor(player, world, characterSheet) {
    this.player = player;
    this.world = world;
    this.characterSheet = characterSheet;

    /** @type {boolean} */
    this._unlocked = false;

    /** @type {number} */
    this._cycleCount = 0;

    /** @type {object[]} */
    this._corruptionModifiers = [];

    /** @type {string|null} */
    this._carriedHeirloom = null;

    /** @type {number} */
    this._enemyLevelOffset = 0;
  }

  /* ---------- Unlock ---------- */

  isUnlocked() {
    return this._unlocked;
  }

  /** Call this after beating The Architect. */
  unlock() {
    this._unlocked = true;
  }

  /* ---------- Cycle Management ---------- */

  getCycleCount() {
    return this._cycleCount;
  }

  getCorruptionModifiers() {
    return this._corruptionModifiers.map(c => ({ ...c }));
  }

  canAccessTrueEnding() {
    return this._cycleCount >= 3;
  }

  /**
   * Start a new NG+ cycle.
   * @param {string|null} heirloomItemId — heirloom carried into the new cycle
   * @returns {boolean} true if the cycle was started
   */
  startNewCycle(heirloomItemId = null) {
    if (!this._unlocked) {
      window.__DEV__ && console.warn('NewGamePlus: not unlocked');
      return false;
    }

    this._cycleCount++;
    this._carriedHeirloom = heirloomItemId || null;
    this._enemyLevelOffset = this._cycleCount * 10;

    const modifierIndex = this._cycleCount - 1;
    if (modifierIndex >= 0 && modifierIndex < CORRUPTION_TABLE.length) {
      this._corruptionModifiers.push({ ...CORRUPTION_TABLE[modifierIndex] });
    } else if (modifierIndex >= CORRUPTION_TABLE.length) {
      // Beyond defined modifiers — duplicate the last one as intensified
      const last = CORRUPTION_TABLE[CORRUPTION_TABLE.length - 1];
      this._corruptionModifiers.push({
        ...last,
        id: `${last.id}_intensified_${modifierIndex}`,
        name: `${last.name} (Intensified)`
      });
    }

    return true;
  }

  /* ---------- Queries ---------- */

  getCarriedHeirloom() {
    return this._carriedHeirloom;
  }

  getEnemyLevelOffset() {
    return this._enemyLevelOffset;
  }

  /* ---------- Serialization ---------- */

  serialize() {
    return {
      unlocked: this._unlocked,
      cycleCount: this._cycleCount,
      corruptionModifiers: this._corruptionModifiers.map(c => ({ ...c })),
      carriedHeirloom: this._carriedHeirloom,
      enemyLevelOffset: this._enemyLevelOffset
    };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;

    if (typeof data.unlocked === 'boolean') {
      this._unlocked = data.unlocked;
    }
    if (typeof data.cycleCount === 'number') {
      this._cycleCount = Math.max(0, Math.floor(data.cycleCount));
    }
    if (Array.isArray(data.corruptionModifiers)) {
      this._corruptionModifiers = data.corruptionModifiers.map(c => ({
        id: c.id || 'unknown',
        name: c.name || 'Unknown',
        description: c.description || ''
      }));
    }
    if (data.carriedHeirloom != null) {
      this._carriedHeirloom = String(data.carriedHeirloom);
    } else {
      this._carriedHeirloom = null;
    }
    if (typeof data.enemyLevelOffset === 'number') {
      this._enemyLevelOffset = Math.max(0, data.enemyLevelOffset);
    }
  }
}
