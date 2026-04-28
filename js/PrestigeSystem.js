/**
 * PrestigeSystem — after max level, convert XP into marginal permanent bonuses.
 */

export const PRESTIGE_PERKS = [
    { id: 'speed', name: 'Swift Stride', description: '+0.5% move speed', cost: 1000, apply: (p) => { p.SPEED_WALK *= 1.005; p.SPEED_SPRINT *= 1.005; } },
    { id: 'health', name: 'Iron Core', description: '+0.5% max health', cost: 1000, apply: (p) => { p.maxHealth *= 1.005; p.health = Math.min(p.health, p.maxHealth); } },
    { id: 'damage', name: 'Sharpened Edge', description: '+0.5% damage', cost: 1000, apply: (p) => { p._prestigeDamageMult = (p._prestigeDamageMult || 1) * 1.005; } },
    { id: 'stamina', name: 'Deep Reserve', description: '+0.5% stamina', cost: 1000, apply: (p) => { p.maxStamina *= 1.005; } },
    { id: 'crit', name: 'Precise Eye', description: '+0.3% crit chance', cost: 1500, apply: (p) => { p._prestigeCritBonus = (p._prestigeCritBonus || 0) + 0.003; } },
    { id: 'xp', name: 'Wisdom', description: '+1% XP gain', cost: 2000, apply: (p) => { p._xpBonusMult = (p._xpBonusMult || 1) * 1.01; } },
];

export class PrestigeSystem {
    constructor(player) {
        this.player = player;
        this.maxLevel = 50;
        this._prestigePoints = 0;
        this._spentPoints = {};
        this._totalSpent = 0;
        this._load();
    }

    getPrestigePoints() {
        return this._prestigePoints;
    }

    addXP(xp) {
        // Only converts to prestige points after max level
        const rate = 1000; // XP per prestige point
        this._prestigePoints += Math.floor(xp / rate);
    }

    canAfford(perkId) {
        const perk = PRESTIGE_PERKS.find(p => p.id === perkId);
        if (!perk) return false;
        return this._prestigePoints >= perk.cost;
    }

    buyPerk(perkId) {
        const perk = PRESTIGE_PERKS.find(p => p.id === perkId);
        if (!perk || !this.canAfford(perkId)) return false;
        this._prestigePoints -= perk.cost;
        this._spentPoints[perkId] = (this._spentPoints[perkId] || 0) + 1;
        this._totalSpent += perk.cost;
        if (this.player) perk.apply(this.player);
        this._save();
        return true;
    }

    getPerkCount(perkId) {
        return this._spentPoints[perkId] || 0;
    }

    getTotalSpent() {
        return this._totalSpent;
    }

    serialize() {
        return {
            points: this._prestigePoints,
            spent: this._spentPoints,
            total: this._totalSpent,
        };
    }

    deserialize(data) {
        if (!data) return;
        this._prestigePoints = data.points || 0;
        this._spentPoints = data.spent || {};
        this._totalSpent = data.total || 0;
    }

    _save() {
        try {
            localStorage.setItem('apex_prestige', JSON.stringify(this.serialize()));
        } catch (e) {}
    }

    _load() {
        try {
            const raw = localStorage.getItem('apex_prestige');
            if (raw) this.deserialize(JSON.parse(raw));
        } catch (e) {}
    }
}
