/**
 * DamageSystem.js
 * Central damage calculator and status effect handler.
 */

export const DAMAGE_TYPES = {
    KINETIC: 'kinetic',
    ENERGY: 'energy',
    EXPLOSIVE: 'explosive',
    ELECTRIC: 'electric',
    FREEZE: 'freeze'
};

export class DamageSystem {
    constructor(characterSheet = null) {
        this.characterSheet = characterSheet;
    }

    /**
     * Calculate final damage after applying type modifiers, crits, and stats.
     * @param {number} baseAmount
     * @param {string} damageType - one of DAMAGE_TYPES
     * @param {object} sourceStats - optional { critChance, critDamage, ... }
     * @param {object} targetStats - optional { shieldActive, isRolling, ... }
     * @returns {object} { amount: number, isCrit: boolean, type: string }
     */
    calculateDamage(baseAmount, damageType = DAMAGE_TYPES.KINETIC, sourceStats = {}, targetStats = {}) {
        let amount = baseAmount;

        // Apply damage-type modifiers
        switch (damageType) {
            case DAMAGE_TYPES.KINETIC:
                // Base damage, no modification
                break;
            case DAMAGE_TYPES.ENERGY:
                if (targetStats.shieldActive) {
                    amount *= 0.5;
                }
                break;
            case DAMAGE_TYPES.EXPLOSIVE:
                if (!targetStats.isRolling) {
                    amount *= 2;
                }
                break;
            case DAMAGE_TYPES.ELECTRIC:
                // Electric drains shield first, then health — handled by caller
                break;
            case DAMAGE_TYPES.FREEZE:
                // Freeze applies slow / stun stacks — handled by applyStatusEffect
                break;
            default:
                break;
        }

        // Apply gear damage multiplier
        const damageMultiplier = sourceStats.damageMultiplier || 0;
        if (damageMultiplier > 0) {
            amount *= (1 + damageMultiplier);
        }

        // Critical hits
        const critChance = sourceStats.critChance ?? 0;
        const critDamage = sourceStats.critDamage ?? 1.5;
        const crit = this.rollCrit(critChance, critDamage);
        if (crit.isCrit) {
            amount *= crit.finalMultiplier;
        }

        // Area damage splash chance
        if (sourceStats.areaDamageChance && Math.random() < sourceStats.areaDamageChance) {
            amount *= 1.25; // splash bonus applied to primary target for simplicity
        }

        return {
            amount: Math.max(0, amount),
            isCrit: crit.isCrit,
            type: damageType
        };
    }

    /**
     * Roll for a critical hit.
     * @param {number} critChance - 0..1
     * @param {number} critDamage - multiplier, e.g. 1.5 for +50%
     * @returns {object} { isCrit, finalMultiplier }
     */
    rollCrit(critChance = 0, critDamage = 1.5) {
        const roll = Math.random();
        const isCrit = roll < critChance;
        return {
            isCrit,
            finalMultiplier: isCrit ? critDamage : 1.0
        };
    }

    /**
     * Apply damage to a target (standard integration point for HitboxSystem).
     * @param {object} source - attacker
     * @param {object} target - defender
     * @param {number} baseAmount
     * @param {string} damageType
     */
    applyDamage(source, target, baseAmount, damageType = DAMAGE_TYPES.KINETIC) {
        if (!target || target.isDead) return 0;
        const sourceStats = source && source.getRPGStats ? source.getRPGStats() : {};
        const targetStats = target && target.getRPGStats ? target.getRPGStats() : {};
        const dmg = this.calculateDamage(baseAmount, damageType, sourceStats, targetStats);
        if (target.takeDamage) {
            const dealt = target.takeDamage(dmg.amount, dmg.type, source);
            this.applyStatusEffect(dmg.type, target);
            return dealt;
        }
        return 0;
    }

    /**
     * Apply a status effect based on damage type.
     * @param {string} damageType
     * @param {object} target - object with optional { addStatus, velocity, shield, ... }
     */
    applyStatusEffect(damageType, target) {
        if (!target) return;

        switch (damageType) {
            case DAMAGE_TYPES.FREEZE:
                if (target.addStatus) {
                    target.addStatus('freeze_slow', 3.0); // 3 second slow
                }
                break;
            case DAMAGE_TYPES.ELECTRIC:
                if (target.shield !== undefined && target.shield > 0) {
                    const drain = Math.min(target.shield, 10);
                    target.shield -= drain;
                } else if (target.addStatus) {
                    target.addStatus('electric_stun', 0.5);
                }
                break;
            case DAMAGE_TYPES.EXPLOSIVE:
                if (target.addStatus) {
                    target.addStatus('knockback', 0.3);
                }
                break;
            default:
                break;
        }
    }

    /**
     * Get color for floating damage numbers.
     * @param {string} damageType
     * @param {boolean} isCrit
     * @returns {string} hex color
     */
    getDamageNumberColor(damageType, isCrit = false) {
        if (isCrit) return '#ff4400'; // bright orange-red for crits

        switch (damageType) {
            case DAMAGE_TYPES.KINETIC:
                return '#ffffff';
            case DAMAGE_TYPES.ENERGY:
                return '#ffaa00';
            case DAMAGE_TYPES.EXPLOSIVE:
                return '#ff3300';
            case DAMAGE_TYPES.ELECTRIC:
                return '#00ccff';
            case DAMAGE_TYPES.FREEZE:
                return '#88ccff';
            default:
                return '#ffffff';
        }
    }
}
