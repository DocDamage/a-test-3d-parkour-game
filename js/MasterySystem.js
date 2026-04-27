/**
 * MasterySystem.js
 * Independent parkour-move leveling (0–50) with milestone bonuses.
 * Pure data module — no Three.js objects.
 */

export const MOVE_IDS = [
  'dive_kick',
  'slide_tackle',
  'wall_kick',
  'vault_strike',
  'ground_pound',
  'sprint_bash',
  'parry',
  'perfect_dodge',
  'silent_takedown',
  'grapple_pull'
];

const MOVE_NAMES = {
  dive_kick: 'Dive Kick',
  slide_tackle: 'Slide Tackle',
  wall_kick: 'Wall Kick',
  vault_strike: 'Vault Strike',
  ground_pound: 'Ground Pound',
  sprint_bash: 'Sprint Bash',
  parry: 'Parry',
  perfect_dodge: 'Perfect Dodge',
  silent_takedown: 'Silent Takedown',
  grapple_pull: 'Grapple Pull'
};

const MAX_MOVE_LEVEL = 50;

/**
 * XP needed to reach `level + 1` from `level`.
 * Gentle curve: base 50, ×1.08 per level.
 */
function xpForLevel(level) {
  if (level >= MAX_MOVE_LEVEL) return 0;
  return Math.floor(50 * Math.pow(1.08, level));
}

export class MasterySystem {
  /**
   * @param {Player} player
   * @param {CharacterSheet} characterSheet
   */
  constructor(player, characterSheet) {
    this.player = player;
    this.characterSheet = characterSheet;

    /** @type {Map<string, {xp: number, totalEarned: number}>} */
    this._moves = new Map();

    for (const moveId of MOVE_IDS) {
      this._moves.set(moveId, { xp: 0, totalEarned: 0 });
    }
  }

  /* ============================================================
     XP API
     ============================================================ */

  /**
   * Add XP to a specific move.
   * @param {string} moveId
   * @param {number} amount — must be > 0
   */
  addMoveXP(moveId, amount) {
    if (amount <= 0) return;
    const data = this._moves.get(moveId);
    if (!data) {
      console.warn(`MasterySystem: unknown move "${moveId}"`);
      return;
    }

    data.totalEarned += amount;

    let currentLevel = this.getMoveLevel(moveId);
    let remaining = amount;

    while (currentLevel < MAX_MOVE_LEVEL && remaining > 0) {
      const needed = xpForLevel(currentLevel);
      const toNext = needed - data.xp;
      if (remaining >= toNext) {
        remaining -= toNext;
        data.xp = 0;
        currentLevel++;
      } else {
        data.xp += remaining;
        remaining = 0;
      }
    }

    // If capped, XP stays at 0 (excess discarded)
    if (currentLevel >= MAX_MOVE_LEVEL) {
      data.xp = 0;
    }
  }

  /**
   * @param {string} moveId
   * @returns {number} current level (0–50)
   */
  getMoveLevel(moveId) {
    const data = this._moves.get(moveId);
    if (!data) return 0;

    let level = 0;
    let accumulated = 0;
    while (level < MAX_MOVE_LEVEL) {
      accumulated += xpForLevel(level);
      if (data.totalEarned < accumulated) break;
      level++;
    }
    return level;
  }

  /**
   * @param {string} moveId
   * @returns {number} XP accumulated toward the next level
   */
  getMoveXP(moveId) {
    const data = this._moves.get(moveId);
    if (!data) return 0;
    return data.xp;
  }

  /**
   * @param {string} moveId
   * @returns {number} XP required to reach the next level
   */
  getMoveXPToNext(moveId) {
    const level = this.getMoveLevel(moveId);
    if (level >= MAX_MOVE_LEVEL) return 0;
    return xpForLevel(level);
  }

  /* ============================================================
     BONUSES
     ============================================================ */

  /**
   * Retrieve the active bonus(es) for a move at its current level.
   * @param {string} moveId
   * @returns {object} bonus descriptor (empty if none)
   */
  getMoveBonus(moveId) {
    const level = this.getMoveLevel(moveId);
    const bonuses = {
      dive_kick: {
        milestone10: level >= 10 ? { damageMultiplier: 1.25 } : null,
        milestone50: level >= 50 ? { meteorStrike: true, burnZoneRadius: 3 } : null
      },
      wall_kick: {
        milestone10: level >= 10 ? { wallrunDurationBonus: 2 } : null,
        milestone50: level >= 50 ? { magneticGrace: true, canFireWhileWallrunning: true } : null
      },
      parry: {
        milestone10: level >= 10 ? { reflectMultiplier: 5 } : null,
        milestone50: level >= 50 ? { perfectGuard: true, parryReloadsWeapon: true } : null
      },
      silent_takedown: {
        milestone10: level >= 10 ? { backstabMultiplier: 1.50 } : null,
        milestone50: level >= 50 ? { ghostProtocol: true, takedownsPreserveSprint: true } : null
      },
      slide_tackle: {
        milestone10: level >= 10 ? { damageMultiplier: 1.20 } : null,
        milestone50: level >= 50 ? { iceSlide: true, slideSpeedCapRemoved: true } : null
      },
      vault_strike: {
        milestone10: level >= 10 ? { damageMultiplier: 1.15 } : null,
        milestone50: level >= 50 ? { vaultChain: true, noStaminaCostOnChain: true } : null
      },
      ground_pound: {
        milestone10: level >= 10 ? { radiusMultiplier: 1.30 } : null,
        milestone50: level >= 50 ? { shockwave: true, stunDuration: 2 } : null
      },
      sprint_bash: {
        milestone10: level >= 10 ? { damageMultiplier: 1.20 } : null,
        milestone50: level >= 50 ? { unstoppable: true, breakThroughWalls: true } : null
      },
      perfect_dodge: {
        milestone10: level >= 10 ? { slowMotionDuration: 0.5 } : null,
        milestone50: level >= 50 ? { afterimage: true, dodgeCostsNoStamina: true } : null
      },
      grapple_pull: {
        milestone10: level >= 10 ? { pullSpeedMultiplier: 1.25 } : null,
        milestone50: level >= 50 ? { yoink: true, pullDisarmsEnemy: true } : null
      }
    };

    const moveBonuses = bonuses[moveId] || {};
    const active = {};
    for (const key of Object.keys(moveBonuses)) {
      if (moveBonuses[key]) {
        Object.assign(active, moveBonuses[key]);
      }
    }
    return active;
  }

  /**
   * @returns {object[]} overview of every move
   */
  getMasteryOverview() {
    return MOVE_IDS.map(id => ({
      id,
      name: MOVE_NAMES[id] || id,
      level: this.getMoveLevel(id),
      xp: this.getMoveXP(id),
      xpToNext: this.getMoveXPToNext(id),
      bonus: this.getMoveBonus(id)
    }));
  }

  /* ============================================================
     SERIALIZATION
     ============================================================ */

  serialize() {
    const data = {};
    for (const [moveId, moveData] of this._moves.entries()) {
      data[moveId] = { xp: moveData.xp, totalEarned: moveData.totalEarned };
    }
    return data;
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;

    for (const moveId of MOVE_IDS) {
      const incoming = data[moveId];
      if (incoming && typeof incoming === 'object') {
        const xp = Math.max(0, Number(incoming.xp) || 0);
        const totalEarned = Math.max(0, Number(incoming.totalEarned) || 0);
        this._moves.set(moveId, { xp, totalEarned });
      } else {
        this._moves.set(moveId, { xp: 0, totalEarned: 0 });
      }
    }
  }
}
