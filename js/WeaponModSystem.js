/**
 * WeaponModSystem — attachment manager for the 5-slot WeaponSystem.
 *
 * Slots per weapon:
 *   barrel, scope, grip, magazine, muzzle, underbarrel, stock
 *
 * Integration:
 *   const mods = new WeaponModSystem();
 *   weaponSystem.setModSystem(mods);
 *   mods.equipMod(modItem, WEAPON_SLOTS.PRIMARY, 'barrel');
 *   const stats = mods.getModStats(WEAPON_SLOTS.PRIMARY);
 */

export const MOD_SLOTS = {
    BARREL: 'barrel',
    SCOPE: 'scope',
    GRIP: 'grip',
    MAGAZINE: 'magazine',
    MUZZLE: 'muzzle',
    UNDERBARREL: 'underbarrel',
    STOCK: 'stock',
};

export const MOD_SLOT_ORDER = [
    MOD_SLOTS.BARREL,
    MOD_SLOTS.SCOPE,
    MOD_SLOTS.GRIP,
    MOD_SLOTS.MAGAZINE,
    MOD_SLOTS.MUZZLE,
    MOD_SLOTS.UNDERBARREL,
    MOD_SLOTS.STOCK,
];

const MOD_TEMPLATES = [
    { name: 'Heavy Barrel', slot: MOD_SLOTS.BARREL, stats: { damageMul: 1.15, spreadMul: 1.10 } },
    { name: 'Red Dot Sight', slot: MOD_SLOTS.SCOPE, stats: { spreadMul: 0.75, rangeMul: 1.10 } },
    { name: 'Tactical Grip', slot: MOD_SLOTS.GRIP, stats: { spreadMul: 0.80, reloadSpeedMul: 1.15 } },
    { name: 'Extended Mag', slot: MOD_SLOTS.MAGAZINE, stats: { clipSizeAdd: 10, reloadSpeedMul: 0.90 } },
    { name: 'Suppressor', slot: MOD_SLOTS.MUZZLE, stats: { damageMul: 0.90, spreadMul: 0.70 } },
    { name: 'Laser Sight', slot: MOD_SLOTS.UNDERBARREL, stats: { spreadMul: 0.60 } },
    { name: 'Stabilizing Stock', slot: MOD_SLOTS.STOCK, stats: { spreadMul: 0.85, fireRateMul: 1.10 } },
    { name: 'Overclocked Core', slot: MOD_SLOTS.BARREL, stats: { damageMul: 1.25, fireRateMul: 1.20, spreadMul: 1.20 } },
    { name: 'Hollow-Point Rounds', slot: MOD_SLOTS.MAGAZINE, stats: { damageMul: 1.20, rangeMul: 0.85 } },
    { name: 'Compensator', slot: MOD_SLOTS.MUZZLE, stats: { spreadMul: 0.50, damageMul: 0.95 } },
    { name: 'Long-Range Scope', slot: MOD_SLOTS.SCOPE, stats: { rangeMul: 1.30, spreadMul: 0.90, fireRateMul: 0.90 } },
    { name: 'Quick-Draw Grip', slot: MOD_SLOTS.GRIP, stats: { reloadSpeedMul: 1.25, fireRateMul: 1.05 } },
    { name: 'Drum Mag', slot: MOD_SLOTS.MAGAZINE, stats: { clipSizeAdd: 25, reloadSpeedMul: 0.75 } },
    { name: 'Flash Hider', slot: MOD_SLOTS.MUZZLE, stats: { spreadMul: 0.80, damageMul: 1.05 } },
    { name: 'Foregrip Bipod', slot: MOD_SLOTS.UNDERBARREL, stats: { spreadMul: 0.40, fireRateMul: 0.90 } },
    { name: 'Skeleton Stock', slot: MOD_SLOTS.STOCK, stats: { reloadSpeedMul: 1.10, spreadMul: 0.90 } },
];

const RARITY_WEIGHTS = [
    { key: 'common', weight: 50, rollBonus: 0 },
    { key: 'uncommon', weight: 30, rollBonus: 0.05 },
    { key: 'rare', weight: 15, rollBonus: 0.10 },
    { key: 'epic', weight: 4, rollBonus: 0.20 },
    { key: 'legendary', weight: 1, rollBonus: 0.35 },
];

export class WeaponModSystem {
    constructor() {
        // Map<weaponSlot, Map<modSlot, modItem>>
        this.equipped = new Map();
        this._load();
    }

    /* ------------------------------------------------------------------ */
    /*  Equip / Unequip                                                   */
    /* ------------------------------------------------------------------ */

    equipMod(modItem, weaponSlot, modSlot) {
        if (!modItem || !weaponSlot || !modSlot) return false;
        if (!this.equipped.has(weaponSlot)) {
            this.equipped.set(weaponSlot, new Map());
        }
        const slotMap = this.equipped.get(weaponSlot);
        // Unequip existing mod in this slot first
        slotMap.set(modSlot, { ...modItem });
        this._save();
        return true;
    }

    unequipMod(weaponSlot, modSlot) {
        if (!this.equipped.has(weaponSlot)) return null;
        const slotMap = this.equipped.get(weaponSlot);
        const existing = slotMap.get(modSlot) || null;
        if (existing) {
            slotMap.delete(modSlot);
            this._save();
        }
        return existing;
    }

    getMod(weaponSlot, modSlot) {
        if (!this.equipped.has(weaponSlot)) return null;
        return this.equipped.get(weaponSlot).get(modSlot) || null;
    }

    getAllMods(weaponSlot) {
        if (!this.equipped.has(weaponSlot)) return [];
        return Array.from(this.equipped.get(weaponSlot).values());
    }

    /* ------------------------------------------------------------------ */
    /*  Stat Aggregation                                                  */
    /* ------------------------------------------------------------------ */

    getModStats(weaponSlot) {
        const mods = this.getAllMods(weaponSlot);
        const stats = {
            damageMul: 1,
            fireRateMul: 1,
            spreadMul: 1,
            rangeMul: 1,
            reloadSpeedMul: 1,
            clipSizeAdd: 0,
            projectileSpeedMul: 1,
        };
        for (const mod of mods) {
            if (!mod.stats) continue;
            const s = mod.stats;
            if (s.damageMul) stats.damageMul *= s.damageMul;
            if (s.fireRateMul) stats.fireRateMul *= s.fireRateMul;
            if (s.spreadMul) stats.spreadMul *= s.spreadMul;
            if (s.rangeMul) stats.rangeMul *= s.rangeMul;
            if (s.reloadSpeedMul) stats.reloadSpeedMul *= s.reloadSpeedMul;
            if (s.clipSizeAdd) stats.clipSizeAdd += s.clipSizeAdd;
            if (s.projectileSpeedMul) stats.projectileSpeedMul *= s.projectileSpeedMul;
        }
        return stats;
    }

    /* ------------------------------------------------------------------ */
    /*  Generation                                                        */
    /* ------------------------------------------------------------------ */

    generateMod(preferredSlot = null, forcedRarity = null) {
        let template;
        if (preferredSlot) {
            const candidates = MOD_TEMPLATES.filter(t => t.slot === preferredSlot);
            template = candidates[Math.floor(Math.random() * candidates.length)] || MOD_TEMPLATES[Math.floor(Math.random() * MOD_TEMPLATES.length)];
        } else {
            template = MOD_TEMPLATES[Math.floor(Math.random() * MOD_TEMPLATES.length)];
        }

        let rarity;
        if (forcedRarity) {
            rarity = forcedRarity;
        } else {
            const roll = Math.random() * 100;
            let cum = 0;
            rarity = 'common';
            for (const rw of RARITY_WEIGHTS) {
                cum += rw.weight;
                if (roll <= cum) { rarity = rw.key; break; }
            }
        }

        const rarityBonus = RARITY_WEIGHTS.find(r => r.key === rarity)?.rollBonus || 0;
        const stats = {};
        for (const [key, base] of Object.entries(template.stats)) {
            // Apply rarity bonus: additive for multipliers, multiplicative for additives
            if (key === 'clipSizeAdd') {
                stats[key] = Math.round(base * (1 + rarityBonus));
            } else {
                // For multipliers, move toward beneficial direction
                const isBeneficial = base < 1;
                const bonus = isBeneficial ? -rarityBonus : rarityBonus;
                stats[key] = Math.max(0.1, base + bonus);
            }
        }

        return {
            id: `mod_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: template.name,
            slot: template.slot,
            rarity,
            stats,
        };
    }

    generateModPack(count = 3) {
        const pack = [];
        for (let i = 0; i < count; i++) pack.push(this.generateMod());
        return pack;
    }

    /* ------------------------------------------------------------------ */
    /*  Persistence                                                       */
    /* ------------------------------------------------------------------ */

    _save() {
        try {
            const raw = {};
            for (const [weaponSlot, slotMap] of this.equipped) {
                raw[weaponSlot] = {};
                for (const [modSlot, mod] of slotMap) {
                    raw[weaponSlot][modSlot] = mod;
                }
            }
            localStorage.setItem('apex_rift_weapon_mods', JSON.stringify(raw));
        } catch (e) { /* ignore */ }
    }

    _load() {
        try {
            const raw = JSON.parse(localStorage.getItem('apex_rift_weapon_mods') || '{}');
            for (const [weaponSlot, slotData] of Object.entries(raw)) {
                const slotMap = new Map();
                for (const [modSlot, mod] of Object.entries(slotData)) {
                    slotMap.set(modSlot, mod);
                }
                const key = String(weaponSlot);
                this.equipped.set(key, slotMap);
            }
        } catch (e) { /* ignore */ }
    }

    clear() {
        this.equipped.clear();
        this._save();
    }
}
