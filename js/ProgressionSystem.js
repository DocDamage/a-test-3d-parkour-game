/**
 * ProgressionSystem handles XP accrual, level-ups, and source analytics.
 *
 * XP curve (exponential):
 *   Level 1 → 2 : 100 XP
 *   Each subsequent level requires 1.15× the previous requirement.
 *   Hard cap at level 50.
 *
 * On level-up the system grants 2 attribute points to the linked CharacterSheet
 * and fires the `onLevelUp` callback if one is registered.
 */
export class ProgressionSystem {
    /**
     * @param {CharacterSheet} characterSheet
     */
    constructor(characterSheet) {
        this.characterSheet = characterSheet;
        // Wire back-reference so CharacterSheet can delegate level/XP queries.
        this.characterSheet.progressionSystem = this;

        /** @type {number} current level (1–50) */
        this._level = 1;

        /** @type {number} XP earned toward the next level */
        this._xp = 0;

        /** @type {number} total lifetime XP earned */
        this._totalXPEarned = 0;

        /** @type {number|null} cached XP requirement for the current level */
        this._xpToNext = this._xpForLevel(this._level);

        /** @type {Function|null} optional callback(level, newTotalPoints) */
        this.onLevelUp = null;

        /** @type {object<string, {count: number, totalXP: number}>} analytics per source */
        this._xpSources = {
            enemy_kill: { count: 0, totalXP: 0 },
            boss_defeat: { count: 0, totalXP: 0 },
            arena_complete: { count: 0, totalXP: 0 },
            bounty_complete: { count: 0, totalXP: 0 },
            codex_discovery: { count: 0, totalXP: 0 },
            move_mastery: { count: 0, totalXP: 0 },
        };
    }

    /* ============================================================
       XP / LEVEL API
       ============================================================ */

    /**
     * Add XP and process any level-ups.
     * @param {number} amount — XP to add (must be > 0)
     * @param {string} source — 'enemy_kill' | 'boss_defeat' | 'arena_complete' |
     *                          'bounty_complete' | 'codex_discovery' | 'move_mastery'
     */
    addXP(amount, source) {
        if (amount <= 0) return;
        if (this._level >= 50) {
            // Still track totals even at cap
            this._totalXPEarned += amount;
            this._trackSource(source, amount);
            return;
        }

        this._xp += amount;
        this._totalXPEarned += amount;
        this._trackSource(source, amount);

        // Process multiple level-ups in one call
        while (this._level < 50 && this._xp >= this._xpToNext) {
            this._xp -= this._xpToNext;
            this._level++;

            // Grant attribute points
            this.characterSheet.grantAttributePoints(2);

            // Recalculate next threshold
            this._xpToNext = this._xpForLevel(this._level);

            // Notify
            if (typeof this.onLevelUp === 'function') {
                try {
                    this.onLevelUp(this._level, this.characterSheet.getAttributePoints());
                } catch (err) {
                    console.error('ProgressionSystem onLevelUp callback error:', err);
                }
            }
        }
    }

    /** @returns {number} current level (1–50) */
    getLevel() {
        return this._level;
    }

    /** @returns {number} XP accumulated toward the next level */
    getXP() {
        return this._xp;
    }

    /** @returns {number} XP required to reach the next level */
    getXPToNext() {
        return this._xpToNext;
    }

    /** @returns {number} total lifetime XP earned */
    getTotalXPEarned() {
        return this._totalXPEarned;
    }

    /* ============================================================
       ANALYTICS
       ============================================================ */

    /**
     * Retrieve analytics for a specific XP source.
     * @param {string} source
     * @returns {{count: number, totalXP: number}|undefined}
     */
    getSourceAnalytics(source) {
        return this._xpSources[source];
    }

    /**
     * @returns {object<string, {count: number, totalXP: number}>} full analytics snapshot
     */
    getAllAnalytics() {
        // Return a shallow copy so callers can't mutate internals
        const snapshot = {};
        for (const key of Object.keys(this._xpSources)) {
            snapshot[key] = { ...this._xpSources[key] };
        }
        return snapshot;
    }

    /* ============================================================
       HELPERS
       ============================================================ */

    /**
     * XP needed to go from `level` → `level + 1`.
     * @param {number} level — current level
     * @returns {number}
     */
    _xpForLevel(level) {
        if (level >= 50) return 0;
        // Level 1→2 costs 100; each subsequent step multiplies by 1.15
        return Math.floor(100 * Math.pow(1.15, level - 1));
    }

    /**
     * Track an XP grant by source.
     * @param {string} source
     * @param {number} amount
     */
    _trackSource(source, amount) {
        if (this._xpSources[source]) {
            this._xpSources[source].count++;
            this._xpSources[source].totalXP += amount;
        } else {
            // Unknown source — create a dynamic bucket
            this._xpSources[source] = { count: 1, totalXP: amount };
        }
    }
}
