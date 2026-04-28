/**
 * CraftingBench — reroll affixes, upgrade rarity, socket runes at the safehouse.
 */

export const RARITY_TIERS = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export class CraftingBench {
    constructor(affixSystem, exoSuit) {
        this.affixSystem = affixSystem;
        this.exoSuit = exoSuit;
        this.rerollCost = 50;
        this.upgradeCosts = { common: 100, uncommon: 200, rare: 400, epic: 800 };
        this._unlocked = false;
    }

    unlock() {
        this._unlocked = true;
    }

    isUnlocked() {
        return this._unlocked;
    }

    canReroll(item) {
        if (!this._unlocked || !item) return false;
        return true; // Cost checked by caller
    }

    rerollAffix(item, slot, playerShards) {
        if (!this.canReroll(item)) return { success: false };
        if (playerShards < this.rerollCost) return { success: false, error: 'Not enough shards' };
        if (!item.affixes || item.affixes.length === 0) return { success: false, error: 'No affixes to reroll' };

        const idx = Math.floor(Math.random() * item.affixes.length);
        const newAffix = this.affixSystem ? this.affixSystem.generateAffix() : { name: 'Random', value: 1 };
        item.affixes[idx] = newAffix;
        return { success: true, cost: this.rerollCost, newAffix };
    }

    upgradeRarity(item, playerShards) {
        if (!this._unlocked || !item) return { success: false };
        const currentIdx = RARITY_TIERS.indexOf(item.rarity || 'common');
        if (currentIdx >= RARITY_TIERS.length - 1) return { success: false, error: 'Max rarity' };
        const nextRarity = RARITY_TIERS[currentIdx + 1];
        const cost = this.upgradeCosts[item.rarity || 'common'];
        if (playerShards < cost) return { success: false, error: 'Not enough shards' };

        item.rarity = nextRarity;
        // Add a new affix on upgrade
        if (this.affixSystem) {
            item.affixes = item.affixes || [];
            item.affixes.push(this.affixSystem.generateAffix());
        }
        return { success: true, cost, newRarity: nextRarity };
    }

    getCosts() {
        return {
            reroll: this.rerollCost,
            upgrade: this.upgradeCosts,
        };
    }
}
