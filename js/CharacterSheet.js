/**
 * CharacterSheet.js
 * Manages the six core RPG attributes plus gear-derived combat stats.
 *
 * Stats:
 *   mob — Mobility
 *   ref — Reflexes
 *   syn — Synthesis
 *   for — Fortitude
 *   tec — Technique
 *   gut — Guts
 *
 * Soft-cap math:
 *   1–30  : 100 % effectiveness
 *   31–40 : 50 % effectiveness
 *   41–50 : 25 % effectiveness
 *   51+   : 0 % effectiveness
 */

export class CharacterSheet {
    constructor(player) {
        this.player = player;

        /** @type {object<string, number>} raw stat values (base 10) */
        this._stats = {
            mob: 10, ref: 10, syn: 10, for: 10, tec: 10, gut: 10,
        };

        this._attributePoints = 0;
        this.progressionSystem = null;
        this.implantSystem = null;
        this.safehouseSystem = null;

        /** Gear-derived bonuses aggregated from ExoSuitSystem */
        this.gearBonuses = {
            // Offense
            damageMultiplier: 0,
            critChance: 0,
            critDamage: 0,
            attackSpeed: 0,
            cooldownReduction: 0,
            areaDamage: 0,
            // Defense
            armor: 0,
            maxHealth: 0,
            healthRegen: 0,
            dodgeChance: 0,
            blockChance: 0,
            resistance: 0,
            // Utility
            moveSpeed: 0,
            pickupRadius: 0,
            resourceCostReduction: 0,
            magicFind: 0,
            // Parkour
            airDashCharges: 0,
            wallrunDuration: 0,
            vaultSpeed: 0,
            slideDistance: 0,
            // Legacy flat bonuses (kept for compatibility)
            maxStamina: 0,
            jumpHeight: 0,
            fallDamageReduction: 0,
        };

        /** Temporary buffs/debuffs: id -> { stat, value, expiresAt } */
        this._tempBonuses = new Map();
    }

    /* ============================================================
       CORE STAT API
       ============================================================ */

    getStat(statName) {
        const raw = this._stats[statName];
        if (raw === undefined) {
            console.warn(`CharacterSheet: unknown stat "${statName}"`);
            return 0;
        }
        return this._applySoftCap(raw);
    }

    getRawStat(statName) {
        return this._stats[statName] ?? 0;
    }

    getAttributePoints() { return this._attributePoints; }
    grantAttributePoints(amount) { this._attributePoints += amount; this._save(); }
    spendAttributePoint(statName) {
        if (this._stats[statName] === undefined) {
            console.warn(`CharacterSheet: cannot spend point on unknown stat "${statName}"`);
            return false;
        }
        if (this._attributePoints <= 0) return false;
        this._attributePoints--;
        this._stats[statName]++;
        this._save();
        return true;
    }

    respec() {
        // Refund all spent attribute points
        const totalSpent = Object.values(this._stats).reduce((sum, v) => sum + v, 0);
        const baseTotal = Object.values(this._defaultStats()).reduce((sum, v) => sum + v, 0);
        const pointsToRefund = totalSpent - baseTotal;
        if (pointsToRefund <= 0) return false;

        this._attributePoints += pointsToRefund;
        // Reset stats to defaults
        const defaults = this._defaultStats();
        for (const key of Object.keys(this._stats)) {
            this._stats[key] = defaults[key] || 0;
        }
        this._save();
        return true;
    }

    _defaultStats() {
        return {
            mob: 10, ref: 10, syn: 10,
            for: 10, tec: 10, gut: 10
        };
    }

    _save() {
        try {
            const data = {
                stats: { ...this._stats },
                attributePoints: this._attributePoints,
                tempBonuses: Array.from(this._tempBonuses.entries()).map(([k, v]) => ({ key: k, ...v }))
            };
            localStorage.setItem('apex_character', JSON.stringify(data));
        } catch (e) { /* ignore */ }
    }

    _load() {
        try {
            const raw = localStorage.getItem('apex_character');
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data.stats) this._stats = { ...this._stats, ...data.stats };
            if (data.attributePoints !== undefined) this._attributePoints = data.attributePoints;
            if (Array.isArray(data.tempBonuses)) {
                this._tempBonuses.clear();
                for (const tb of data.tempBonuses) {
                    const { key, ...rest } = tb;
                    this._tempBonuses.set(key, rest);
                }
            }
        } catch (e) { /* ignore */ }
    }

    /* ============================================================
       LEVEL / XP DELEGATION
       ============================================================ */

    getLevel() {
        return this.progressionSystem ? this.progressionSystem.getLevel() : 1;
    }
    getXP() {
        return this.progressionSystem ? this.progressionSystem.getXP() : 0;
    }
    getXPToNext() {
        return this.progressionSystem ? this.progressionSystem.getXPToNext() : 100;
    }

    /* ============================================================
       GEAR BONUS INTEGRATION
       ============================================================ */

    /**
     * Called by ExoSuitSystem whenever equipped gear changes.
     * @param {object} bonuses — flat numeric bonuses from gear
     */
    setGearBonuses(bonuses) {
        this.gearBonuses = { ...this._defaultGearBonuses(), ...bonuses };
    }

    _defaultGearBonuses() {
        return {
            damageMultiplier: 0, critChance: 0, critDamage: 0, attackSpeed: 0,
            cooldownReduction: 0, areaDamage: 0,
            armor: 0, maxHealth: 0, healthRegen: 0, dodgeChance: 0,
            blockChance: 0, resistance: 0,
            moveSpeed: 0, pickupRadius: 0, resourceCostReduction: 0, magicFind: 0,
            airDashCharges: 0, wallrunDuration: 0, vaultSpeed: 0, slideDistance: 0,
            maxStamina: 0, jumpHeight: 0, fallDamageReduction: 0,
            // Legacy stats from pre-Phase 3 items
            meleeDamage: 0, airDashStaminaCost: 0, adsFov: 0,
            empRadius: 0, hijackDurationMult: 0, shieldBreak: 0,
            fireTrail: 0, fireTrailDamage: 0, explosiveRadiusMult: 0,
            selfExplosiveDamageReduction: 0, eliteSilentTakedown: 0,
            crouchDetectionRadius: 0, reloadSpeed: 0,
            targetAcquisitionSpeed: 0, dashStaminaCost: 0,
            critDamageVsAirborne: 0, groundPoundRadius: 0, slideSpeed: 0,
            climbSpeed: 0, grappleRange: 0, dodgeIframes: 0,
            sprintAcceleration: 0, backstabDamage: 0, staminaRegen: 0,
            weaponSwapSpeed: 0, crouchMoveSpeed: 0, fallDamageToAoE: 0,
            reactiveArmor: 0, overclockDuration: 0, hijackChance: 0,
            scrapOnKill: 0, airControl: 0, comboDecayReduction: 0,
            droneCommandLimit: 0, temporalShift: 0, bossDamageMult: 0,
            aegisField: 0, lootRadius: 0, secondLifeCooldown: 0,
            meleeChainLightning: 0, omniscience: 0, kineticCascade: 0,
            adrenalineSurge: 0, phantomDash: 0, bulletCatcher: 0,
            scavenger: 0, gravBoots: 0, neuralSync: 0,
        };
    }

    /**
     * Add a temporary bonus (buffs, consumables, etc).
     * @param {string} id — unique buff id
     * @param {string} stat — bonus key
     * @param {number} value — flat bonus amount
     * @param {number} durationSeconds
     */
    addTempBonus(id, stat, value, durationSeconds) {
        this._tempBonuses.set(id, { stat, value, expiresAt: performance.now() + durationSeconds * 1000 });
    }

    removeTempBonus(id) {
        this._tempBonuses.delete(id);
    }

    _getTempBonus(stat) {
        const now = performance.now();
        let total = 0;
        for (const [id, bonus] of this._tempBonuses) {
            if (bonus.expiresAt <= now) {
                this._tempBonuses.delete(id);
                continue;
            }
            if (bonus.stat === stat) total += bonus.value;
        }
        return total;
    }

    /**
     * Get a single combat stat merged from base + gear + temp bonuses.
     */
    setImplantSystem(implantSystem) {
        this.implantSystem = implantSystem;
    }

    setSafehouseSystem(safehouse) {
        this.safehouseSystem = safehouse;
    }

    getCombatStat(statName) {
        const gear = this.gearBonuses[statName] || 0;
        const temp = this._getTempBonus(statName);
        let implant = 0;
        if (this.implantSystem) {
            const bonuses = this.implantSystem.getTotalBonuses();
            // Map implant bonus keys to gear bonus keys
            const mapping = {
                maxHealth: 'maxHealth',
                meleeDamageMult: 'damageMultiplier',
                moveSpeedMult: 'moveSpeed',
                knockbackReduction: 'fallDamageReduction',
            };
            for (const [implantKey, gearKey] of Object.entries(mapping)) {
                if (statName === gearKey && typeof bonuses[implantKey] === 'number') {
                    implant += bonuses[implantKey];
                }
            }
        }
        return gear + temp + implant;
    }

    /**
     * Get all stats as a flat object for DamageSystem / SkillSystem consumption.
     * Returns: { mob, ref, syn, for, tec, gut, critChance, critDamage, damageMultiplier, ... }
     */
    getStats() {
        const stats = {
            // Base attributes (effective, soft-capped)
            mob: this.getStat('mob'),
            ref: this.getStat('ref'),
            syn: this.getStat('syn'),
            for: this.getStat('for'),
            tec: this.getStat('tec'),
            gut: this.getStat('gut'),
        };

        // Merge gear + temp bonuses
        const allKeys = Object.keys(this._defaultGearBonuses());
        for (const key of allKeys) {
            stats[key] = this.getCombatStat(key);
        }

        // Implant raw bonuses (for systems that query specific implant flags)
        if (this.implantSystem) {
            stats._implantBonuses = this.implantSystem.getTotalBonuses();
            stats._implantDrawbacks = this.implantSystem.getTotalDrawbacks();
        }

        // Safehouse Hall of Legends: dynasty stat multiplier
        if (this.safehouseSystem) {
            const dynastyMul = this.safehouseSystem.getDynastyStatMultiplier();
            if (dynastyMul > 0) {
                for (const key of Object.keys(stats)) {
                    if (typeof stats[key] === 'number') {
                        stats[key] *= (1 + dynastyMul);
                    }
                }
            }
        }

        // Derived compound stats
        stats.critChance = (stats.critChance || 0) + (stats.ref * 0.005);
        stats.critDamage = (stats.critDamage || 0) + 1.5;
        stats.maxHealth = (stats.maxHealth || 0) + (stats.for * 2);
        stats.damageMultiplier = (stats.damageMultiplier || 0) + (stats.mob * 0.01) + (stats.tec * 0.015);
        stats.moveSpeed = (stats.moveSpeed || 0) + (stats.mob * 0.015);
        stats.cooldownReduction = Math.min(0.80, stats.cooldownReduction || 0);

        return stats;
    }

    /* ============================================================
       DERIVED STAT BONUSES
       ============================================================ */

    getMoveSpeedBonus() {
        return this.getStat('mob') * 0.02 + this.getCombatStat('moveSpeed');
    }

    getWallrunDurationBonus() {
        return this.getStat('mob') * 0.1 + this.getCombatStat('wallrunDuration');
    }

    getParryWindowBonus() {
        return this.getStat('ref') * 0.01;
    }

    getCritChance() {
        return this.getStat('ref') * 0.015 + this.getCombatStat('critChance');
    }

    getCritDamage() {
        return 1.5 + this.getCombatStat('critDamage');
    }

    getFlowGainBonus() {
        return this.getStat('syn') * 0.03;
    }

    getMaxHPBonus() {
        return this.getStat('for') * 3 + this.getCombatStat('maxHealth');
    }

    getMaxStaminaBonus() {
        return this.getStat('for') * 2 + this.getCombatStat('maxStamina');
    }

    getModEffectivenessBonus() {
        return this.getStat('tec') * 0.05;
    }

    getHaggleBonus() {
        return this.getStat('gut') * 0.01;
    }

    getGearScore() {
        const sum =
            this.getStat('mob') + this.getStat('ref') + this.getStat('syn') +
            this.getStat('for') + this.getStat('tec') + this.getStat('gut');
        return Math.round(sum);
    }

    /* ============================================================
       HELPERS
       ============================================================ */

    _applySoftCap(raw) {
        let effective = 0;
        effective += Math.min(raw, 30);
        if (raw > 30) effective += Math.min(raw - 30, 10) * 0.5;
        if (raw > 40) effective += Math.min(raw - 40, 10) * 0.25;
        return effective;
    }
}
