/**
 * DamageSystem.js
 * Central damage calculator and status effect handler.
 */

export const DAMAGE_TYPES = {
    KINETIC: 'kinetic',
    ENERGY: 'energy',
    EXPLOSIVE: 'explosive',
    ELECTRIC: 'electric',
    FREEZE: 'freeze',
    MAGIC: 'magic'
};

export class DamageSystem {
    constructor(characterSheet = null, statusEffectSystem = null) {
        this.characterSheet = characterSheet;
        this.statusEffectSystem = statusEffectSystem;
        this.safehouseSystem = null;
    }

    setSafehouseSystem(safehouse) {
        this.safehouseSystem = safehouse;
    }

    setLegendaryPowerSystem(legendaryPowerSystem) {
        this.legendaryPowerSystem = legendaryPowerSystem;
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
            case DAMAGE_TYPES.MAGIC:
                // Magic bypasses armor but is blocked by ward
                if (targetStats.magicWard > 0) {
                    amount *= 0.25;
                }
                break;
            default:
                break;
        }

        // Apply gear damage multiplier
        const damageMultiplier = sourceStats.damageMultiplier || 0;
        if (damageMultiplier > 0) {
            amount *= (1 + damageMultiplier);
        }

        // Dodge roll
        const dodgeChance = targetStats.dodgeChance ?? 0;
        if (dodgeChance > 0 && Math.random() < dodgeChance) {
            return { amount: 0, isCrit: false, type: damageType, dodged: true };
        }

        // Critical hits
        let critChance = sourceStats.critChance ?? 0;
        const critDamage = sourceStats.critDamage ?? 1.5;
        if (sourceStats._critBonusFromPredator > 0) {
            critChance += sourceStats._critBonusFromPredator;
        }
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
        let adjustedBase = baseAmount;
        // Safehouse trophy wall: bonus damage vs specific factions
        if (this.safehouseSystem && target && target.faction) {
            const boost = this.safehouseSystem.getFactionDamageBoost(target.faction);
            if (boost > 0) adjustedBase *= (1 + boost);
        }
        const dmg = this.calculateDamage(adjustedBase, damageType, sourceStats, targetStats);
        if (dmg.dodged) {
            if (target.scene && target.scene.userData && target.scene.userData.spawnDamageNumber) {
                const pos = target.position.clone();
                pos.y += 1.8;
                target.scene.userData.spawnDamageNumber(pos, 'DODGE', false, damageType);
            }
            return 0;
        }
        if (target.takeDamage) {
            let finalAmount = dmg.amount;
            if (this.legendaryPowerSystem && source === this.legendaryPowerSystem.player) {
                finalAmount = this.legendaryPowerSystem.onDamageDealt(target, finalAmount);
            }
            if (target.state === 'BLOCK') finalAmount *= 0.25;
            const dealt = target.takeDamage(finalAmount, dmg.type, source);
            this.applyStatusEffect(dmg.type, target, source);
            return dealt;
        }
        return 0;
    }

    /**
     * Apply a status effect based on damage type.
     * @param {string} damageType
     * @param {object} target - object with optional { addStatus, velocity, shield, ... }
     */
    applyStatusEffect(damageType, target, source = null) {
        if (!target) return;

        // Delegate to StatusEffectSystem if available
        if (this.statusEffectSystem) {
            switch (damageType) {
                case DAMAGE_TYPES.FREEZE:
                    this.statusEffectSystem.applyEffect(target, 'frozen', 3.0);
                    break;
                case DAMAGE_TYPES.ELECTRIC:
                    if (target.shield !== undefined && target.shield > 0) {
                        const drain = Math.min(target.shield, 10);
                        target.shield -= drain;
                    } else {
                        this.statusEffectSystem.applyEffect(target, 'shocked', 2.0);
                    }
                    break;
                case DAMAGE_TYPES.EXPLOSIVE:
                    if (target.addStatus) target.addStatus('knockback', 0.3);
                    break;
                case DAMAGE_TYPES.ENERGY:
                    this.statusEffectSystem.applyEffect(target, 'burning', 5.0, { dmg: 5, source });
                    break;
                case DAMAGE_TYPES.MAGIC:
                    this.statusEffectSystem.applyEffect(target, 'magicked', 4.0, { dmg: 3, source });
                    break;
                default:
                    break;
            }
            return;
        }

        // Fallback if no StatusEffectSystem
        switch (damageType) {
            case DAMAGE_TYPES.FREEZE:
                if (target.addStatus) target.addStatus('freeze_slow', 3.0);
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
                if (target.addStatus) target.addStatus('knockback', 0.3);
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
            case DAMAGE_TYPES.MAGIC:
                return '#aa44ff';
            default:
                return '#ffffff';
        }
    }
}
