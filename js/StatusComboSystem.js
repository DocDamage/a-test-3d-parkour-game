/**
 * StatusComboSystem — elemental and status effect combos.
 */

export const COMBO_RULES = [
    { name: 'Thermal Shock', effects: ['burn', 'freeze'], bonusDamage: 1.25, message: 'Thermal Shock!' },
    { name: 'Execution', effects: ['stun'], condition: 'healthPercent', threshold: 0.30, instantKill: true, message: 'Execution!' },
    { name: 'Shatter', effects: ['freeze', 'kinetic'], bonusDamage: 1.50, message: 'Shatter!' },
    { name: 'Guaranteed Crit', effects: ['slow'], condition: 'melee', critChance: 1.0, message: 'Critical Break!' },
];

export class StatusComboSystem {
    constructor(statusEffectSystem) {
        this.statusSystem = statusEffectSystem;
        this._trackedTargets = new WeakMap(); // target -> Set(activeEffects)
    }

    onDamageDealt(target, damage, damageType, isMelee) {
        if (!this.statusSystem) return damage;

        const activeEffects = this._getActiveEffects(target);
        let multiplier = 1.0;
        let message = null;

        for (const rule of COMBO_RULES) {
            const hasEffects = rule.effects.every(e => activeEffects.has(e));
            if (!hasEffects) continue;

            // Check extra conditions
            if (rule.condition === 'healthPercent' && target.health / target.maxHealth > rule.threshold) continue;
            if (rule.condition === 'melee' && !isMelee) continue;

            // Apply combo
            if (rule.instantKill) {
                multiplier = 9999; // instakill
            } else if (rule.bonusDamage) {
                multiplier = rule.bonusDamage;
            }
            if (rule.critChance && isMelee) {
                // Handled by caller
            }
            message = rule.message;

            // Consume one effect to prevent infinite loop
            if (rule.effects.length > 0) {
                this._removeEffect(target, rule.effects[0]);
            }
            break; // Only one combo per hit
        }

        if (message && window.__DEV__) console.log('[Combo]', message);
        return damage * multiplier;
    }

    _getActiveEffects(target) {
        if (!this.statusSystem._effects) return new Set();
        const effects = this.statusSystem._effects.get(target);
        if (!effects) return new Set();
        const set = new Set();
        for (const e of effects) {
            if (e.active !== false) set.add(e.type);
        }
        return set;
    }

    _removeEffect(target, type) {
        if (!this.statusSystem._effects) return;
        const effects = this.statusSystem._effects.get(target);
        if (!effects) return;
        const idx = effects.findIndex(e => e.type === type);
        if (idx >= 0) {
            effects[idx].active = false;
            effects.splice(idx, 1);
        }
    }
}
