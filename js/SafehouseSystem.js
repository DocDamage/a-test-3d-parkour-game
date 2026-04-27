/**
 * SafehouseSystem.js
 * Persistent hub upgrade manager.
 *
 * Tracks scrap, chips, boss cores and retired runners as hub currency.
 * Six upgrades can be purchased and levelled; effects are queried passively
 * by other gameplay systems.
 */

const STORAGE_KEY = 'parkour_safehouse_v1';

const UPGRADE_DEFS = [
    {
        id: 'shooting_range',
        name: 'Shooting Range',
        description: 'Preview weapon mods before equipping them.',
        cost: { scrap: 500 },
        maxLevel: 1,
    },
    {
        id: 'scrap_forge',
        name: 'Scrap Forge',
        description: 'Dismantle 3 common items to craft 1 rare item.',
        cost: { scrap: 1000 },
        maxLevel: 1,
    },
    {
        id: 'trophy_wall',
        name: 'Trophy Wall',
        description: 'Mount boss cores. Each mounted core grants +10% damage to that boss\'s faction.',
        cost: { bossCores: 1 },
        maxLevel: 5,
    },
    {
        id: 'relay_antenna',
        name: 'Relay Antenna',
        description: 'Unlocks the bounty board for contract generation.',
        cost: { scrap: 800 },
        maxLevel: 1,
    },
    {
        id: 'medical_bay',
        name: 'Medical Bay',
        description: 'Respawn with an additional +25 HP.',
        cost: { scrap: 600 },
        maxLevel: 1,
    },
    {
        id: 'hall_of_legends',
        name: 'Hall of Legends',
        description: 'Requires 10 retired runners. Grants +5% to all stats for each retired runner.',
        cost: { retiredRunners: 10 },
        maxLevel: 1,
    },
];

const CURRENCY_TYPES = ['scrap', 'chips', 'bossCores', 'retiredRunners'];

export class SafehouseSystem {
    /**
     * @param {object} player
     * @param {CharacterSheet} characterSheet
     * @param {ProgressionSystem} progression
     * @param {ExoSuitSystem} exoSuit
     * @param {AffixSystem} affixSystem
     */
    constructor(player, characterSheet, progression, exoSuit, affixSystem) {
        this.player = player;
        this.characterSheet = characterSheet;
        this.progression = progression;
        this.exoSuit = exoSuit;
        this.affixSystem = affixSystem;

        /** @type {object<string, number>} hub currencies */
        this._currency = {
            scrap: 0,
            chips: 0,
            bossCores: 0,
            retiredRunners: 0,
        };

        /** @type {number} lifetime retired runners (never decreases) */
        this._lifetimeRetiredRunners = 0;

        /** @type {Map<string, object>} current upgrade state keyed by id */
        this._upgrades = new Map();
        for (const def of UPGRADE_DEFS) {
            this._upgrades.set(def.id, {
                ...def,
                currentLevel: 0,
            });
        }

        /** @type {string[]} faction ids mounted on the trophy wall */
        this._trophyWallCores = [];

        this._loadFromStorage();
    }

    /* ============================================================
       CURRENCY API
       ============================================================ */

    /**
     * Add currency to the safehouse.
     * @param {string} type — 'scrap' | 'chips' | 'bossCores' | 'retiredRunners'
     * @param {number} amount
     */
    addCurrency(type, amount) {
        if (!CURRENCY_TYPES.includes(type)) {
            console.warn(`SafehouseSystem: unknown currency type "${type}"`);
            return;
        }
        if (amount <= 0) return;
        this._currency[type] = (this._currency[type] || 0) + amount;

        if (type === 'retiredRunners') {
            this._lifetimeRetiredRunners += amount;
        }

        this._saveToStorage();
    }

    /**
     * Deduct currency from the safehouse.
     * @param {string} type
     * @param {number} amount
     * @returns {boolean} true if deduction succeeded
     */
    deductCurrency(type, amount) {
        if (!CURRENCY_TYPES.includes(type)) return false;
        if (amount <= 0) return true;
        if ((this._currency[type] || 0) < amount) return false;
        this._currency[type] -= amount;
        this._saveToStorage();
        return true;
    }

    /** @returns {number} current amount of the given currency */
    getCurrency(type) {
        return this._currency[type] || 0;
    }

    /** @returns {object<string, number>} snapshot of all currencies */
    getAllCurrency() {
        return { ...this._currency };
    }

    /**
     * Retire a runner, adding to the dynasty pool.
     */
    addRetiredRunner() {
        this.addCurrency('retiredRunners', 1);
    }

    /* ============================================================
       UPGRADE QUERIES
       ============================================================ */

    /**
     * Get a single upgrade's definition + current state.
     * @param {string} id
     * @returns {object|null}
     */
    getUpgrade(id) {
        const up = this._upgrades.get(id);
        return up ? { ...up } : null;
    }

    /** @returns {object[]} all upgrades with current state */
    getAllUpgrades() {
        return Array.from(this._upgrades.values()).map(u => ({ ...u }));
    }

    /**
     * Check whether the player can afford the next level of an upgrade.
     * @param {string} id
     * @returns {boolean}
     */
    canAffordUpgrade(id) {
        const up = this._upgrades.get(id);
        if (!up) return false;
        if (up.currentLevel >= up.maxLevel) return false;

        const cost = this._getLevelCost(up);
        for (const [cType, cAmount] of Object.entries(cost)) {
            if ((this._currency[cType] || 0) < cAmount) {
                return false;
            }
        }
        return true;
    }

    /**
     * Purchase the next level of an upgrade.
     * @param {string} id
     * @param {object} [opts] — optional metadata (e.g. { faction } for trophy_wall)
     * @returns {boolean} true on success
     */
    purchaseUpgrade(id, opts = {}) {
        const up = this._upgrades.get(id);
        if (!up) {
            console.warn(`SafehouseSystem: unknown upgrade "${id}"`);
            return false;
        }
        if (up.currentLevel >= up.maxLevel) {
            console.warn(`SafehouseSystem: upgrade "${id}" is already max level.`);
            return false;
        }
        if (!this.canAffordUpgrade(id)) {
            console.warn(`SafehouseSystem: cannot afford upgrade "${id}".`);
            return false;
        }

        const cost = this._getLevelCost(up);
        for (const [cType, cAmount] of Object.entries(cost)) {
            this.deductCurrency(cType, cAmount);
        }

        up.currentLevel++;

        // Special handling for trophy wall — each level mounts one core.
        if (id === 'trophy_wall') {
            const faction = opts.faction || this._pickRandomFaction();
            this._trophyWallCores.push(faction);
        }

        this._saveToStorage();
        return true;
    }

    /* ============================================================
       PASSIVE EFFECTS
       ============================================================ */

    /**
     * @returns {object} current passive effects from all upgrades.
     */
    getPassiveEffects() {
        const medicalBay = this._upgrades.get('medical_bay');
        const hall = this._upgrades.get('hall_of_legends');
        const trophy = this._upgrades.get('trophy_wall');
        const shooting = this._upgrades.get('shooting_range');
        const forge = this._upgrades.get('scrap_forge');
        const relay = this._upgrades.get('relay_antenna');

        // Build faction damage map from trophy wall.
        const factionDamage = {};
        if (trophy && trophy.currentLevel > 0) {
            for (const f of this._trophyWallCores) {
                factionDamage[f] = (factionDamage[f] || 0) + 0.10;
            }
        }

        return {
            modPreviewUnlocked: shooting ? shooting.currentLevel > 0 : false,
            canDismantleCommonToRare: forge ? forge.currentLevel > 0 : false,
            bountyBoardUnlocked: relay ? relay.currentLevel > 0 : false,
            respawnHPBonus: medicalBay && medicalBay.currentLevel > 0 ? 25 : 0,
            factionDamageBoost: factionDamage,
            dynastyStatMultiplier: hall && hall.currentLevel > 0
                ? this._lifetimeRetiredRunners * 0.05
                : 0,
        };
    }

    /**
     * Get the damage multiplier against a specific faction from the trophy wall.
     * @param {string} faction
     * @returns {number} e.g. 0.30 for +30%
     */
    getFactionDamageBoost(faction) {
        const trophy = this._upgrades.get('trophy_wall');
        if (!trophy || trophy.currentLevel <= 0) return 0;
        let count = 0;
        for (const f of this._trophyWallCores) {
            if (f === faction) count++;
        }
        return count * 0.10;
    }

    /**
     * Get the dynasty bonus multiplier for all stats.
     * @returns {number} e.g. 0.50 for +50%
     */
    getDynastyStatMultiplier() {
        const hall = this._upgrades.get('hall_of_legends');
        if (!hall || hall.currentLevel <= 0) return 0;
        return this._lifetimeRetiredRunners * 0.05;
    }

    /**
     * Attempt to dismantle 3 common items into 1 rare item.
     * Requires Scrap Forge upgrade.
     * @returns {object|null} the crafted rare item template, or null
     */
    dismantleCommonToRare(commonItems) {
        const forge = this._upgrades.get('scrap_forge');
        if (!forge || forge.currentLevel <= 0) {
            console.warn('SafehouseSystem: Scrap Forge not unlocked.');
            return null;
        }
        if (!Array.isArray(commonItems) || commonItems.length < 3) {
            console.warn('SafehouseSystem: need 3 common items.');
            return null;
        }
        // Return a deterministic "success" flag and consume the items.
        // The caller is responsible for removing the 3 common items.
        return {
            success: true,
            rarity: 2, // rare
            slot: commonItems[0].slot || null,
        };
    }

    /* ============================================================
       HELPERS
       ============================================================ */

    _getLevelCost(up) {
        // Linear scaling: each level costs the same base amount.
        // Future extensibility: multiply by level index for exponential curves.
        return { ...up.cost };
    }

    _pickRandomFaction() {
        const factions = ['vanguard', 'synapse', 'hollow'];
        return factions[Math.floor(Math.random() * factions.length)];
    }

    /* ============================================================
       SERIALIZATION
       ============================================================ */

    serialize() {
        const upgrades = {};
        for (const [id, up] of this._upgrades) {
            upgrades[id] = { currentLevel: up.currentLevel };
        }
        return {
            currency: { ...this._currency },
            lifetimeRetiredRunners: this._lifetimeRetiredRunners,
            upgrades,
            trophyWallCores: this._trophyWallCores.slice(),
        };
    }

    deserialize(data) {
        if (!data || typeof data !== 'object') return;

        if (data.currency && typeof data.currency === 'object') {
            for (const t of CURRENCY_TYPES) {
                if (typeof data.currency[t] === 'number') {
                    this._currency[t] = Math.max(0, data.currency[t]);
                }
            }
        }

        if (typeof data.lifetimeRetiredRunners === 'number') {
            this._lifetimeRetiredRunners = Math.max(0, data.lifetimeRetiredRunners);
        }

        if (data.upgrades && typeof data.upgrades === 'object') {
            for (const [id, state] of Object.entries(data.upgrades)) {
                const up = this._upgrades.get(id);
                if (up && state && typeof state.currentLevel === 'number') {
                    up.currentLevel = Math.max(0, Math.min(up.maxLevel, state.currentLevel));
                }
            }
        }

        if (Array.isArray(data.trophyWallCores)) {
            this._trophyWallCores = data.trophyWallCores
                .filter(f => typeof f === 'string')
                .slice(0, 5);
        }
    }

    /* ============================================================
       LOCAL STORAGE
       ============================================================ */

    _saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.serialize()));
        } catch (e) {
            console.warn('SafehouseSystem: save failed', e);
        }
    }

    _loadFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                this.deserialize(JSON.parse(raw));
            }
        } catch (e) {
            console.warn('SafehouseSystem: load failed', e);
        }
    }
}
