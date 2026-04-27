/**
 * StatusEffectSystem — centralized status effect application, ticking, and removal.
 *
 * Supports 10 core effects + elemental interactions.
 *
 * Integration:
 *   const statusFx = new StatusEffectSystem();
 *   statusFx.applyEffect(target, 'burning', 5.0, { dmg: 5 });
 *   statusFx.update(dt);   // tick all active effects
 */

export const STATUS_EFFECTS = {
    BURNING: 'burning',
    FROZEN: 'frozen',
    SHOCKED: 'shocked',
    CORRODED: 'corroded',
    BLINDED: 'blinded',
    MAGNETIZED: 'magnetized',
    MARKED: 'marked',
    ENRAGED: 'enraged',
    WEAKENED: 'weakened',
    OVERCLOCKED: 'overclocked',
};

export class StatusEffectSystem {
    constructor() {
        /** @type {Map<Object, Array<EffectInstance>>} */
        this.active = new Map();
        this._toRemove = [];
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Apply a status effect to a target.
     * @param {Object} target — must expose takeDamage(), addStatus() optional
     * @param {string} effectId — one of STATUS_EFFECTS
     * @param {number} duration — seconds
     * @param {Object} [params] — effect-specific params (e.g. { dmg: 5, stacks: 1 })
     */
    applyEffect(target, effectId, duration, params = {}) {
        if (!target) return;
        let list = this.active.get(target);
        if (!list) {
            list = [];
            this.active.set(target, list);
        }

        // Stack rules
        const existing = list.find(e => e.id === effectId);
        if (existing) {
            if (this._canStack(effectId)) {
                existing.stacks = Math.min((existing.stacks || 1) + (params.stacks || 1), this._maxStacks(effectId));
                existing.duration = Math.max(existing.duration, duration);
                existing.params = { ...existing.params, ...params };
            } else {
                // Refresh duration
                existing.duration = Math.max(existing.duration, duration);
                existing.params = { ...existing.params, ...params };
            }
            return;
        }

        list.push({
            id: effectId,
            duration,
            maxDuration: duration,
            tick: this._tickInterval(effectId),
            tickTimer: this._tickInterval(effectId),
            stacks: params.stacks || 1,
            params: { ...params },
            target,
        });

        // On-apply hooks
        this._onApply(target, effectId, params);
    }

    removeEffect(target, effectId) {
        const list = this.active.get(target);
        if (!list) return;
        const idx = list.findIndex(e => e.id === effectId);
        if (idx >= 0) {
            this._onRemove(target, effectId, list[idx]);
            list.splice(idx, 1);
            if (list.length === 0) this.active.delete(target);
        }
    }

    hasEffect(target, effectId) {
        const list = this.active.get(target);
        return list ? list.some(e => e.id === effectId) : false;
    }

    getEffect(target, effectId) {
        const list = this.active.get(target);
        return list ? list.find(e => e.id === effectId) : null;
    }

    clearAll(target) {
        const list = this.active.get(target);
        if (list) {
            for (const fx of list) this._onRemove(target, fx.id, fx);
            this.active.delete(target);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Per-frame tick                                                    */
    /* ------------------------------------------------------------------ */

    update(dt) {
        for (const [target, list] of this.active) {
            for (let i = list.length - 1; i >= 0; i--) {
                const fx = list[i];
                fx.duration -= dt;
                fx.tickTimer -= dt;

                if (fx.tickTimer <= 0) {
                    fx.tickTimer = this._tickInterval(fx.id);
                    this._onTick(target, fx, dt);
                }

                if (fx.duration <= 0) {
                    this._onRemove(target, fx.id, fx);
                    list.splice(i, 1);
                }
            }
            if (list.length === 0) this.active.delete(target);
        }

        // Elemental interaction checks
        this._checkElementalInteractions();
    }

    /* ------------------------------------------------------------------ */
    /*  Effect-specific logic                                             */
    /* ------------------------------------------------------------------ */

    _onApply(target, effectId, params) {
        switch (effectId) {
            case STATUS_EFFECTS.FROZEN:
                if (target.moveSpeedMultiplier !== undefined) {
                    target._frozenSpeedPenalty = 0.75;
                    target.moveSpeedMultiplier *= (1 - target._frozenSpeedPenalty);
                }
                break;
            case STATUS_EFFECTS.ENRAGED:
                if (target._damageMultiplier !== undefined) target._damageMultiplier *= 1.5;
                break;
            case STATUS_EFFECTS.WEAKENED:
                if (target._damageMultiplier !== undefined) target._damageMultiplier *= 0.5;
                break;
            case STATUS_EFFECTS.OVERCLOCKED:
                if (target.moveSpeedMultiplier !== undefined) target.moveSpeedMultiplier *= 1.5;
                break;
            case STATUS_EFFECTS.MARKED:
                if (target._markedDamageBonus !== undefined) target._markedDamageBonus = 0.25;
                break;
        }
    }

    _onRemove(target, effectId, fx) {
        switch (effectId) {
            case STATUS_EFFECTS.FROZEN:
                if (target._frozenSpeedPenalty && target.moveSpeedMultiplier !== undefined) {
                    target.moveSpeedMultiplier /= (1 - target._frozenSpeedPenalty);
                    target._frozenSpeedPenalty = 0;
                }
                // Shatter damage on removal if frozen fully
                if (fx.duration <= 0 && target.takeDamage) {
                    target.takeDamage(20, 'kinetic', null);
                }
                break;
            case STATUS_EFFECTS.ENRAGED:
                if (target._damageMultiplier !== undefined) target._damageMultiplier /= 1.5;
                break;
            case STATUS_EFFECTS.WEAKENED:
                if (target._damageMultiplier !== undefined) target._damageMultiplier /= 0.5;
                break;
            case STATUS_EFFECTS.OVERCLOCKED:
                if (target.moveSpeedMultiplier !== undefined) target.moveSpeedMultiplier /= 1.5;
                break;
            case STATUS_EFFECTS.MARKED:
                if (target._markedDamageBonus !== undefined) target._markedDamageBonus = 0;
                break;
        }
    }

    _onTick(target, fx, dt) {
        switch (fx.id) {
            case STATUS_EFFECTS.BURNING:
                if (target.takeDamage) {
                    const dmg = (fx.params.dmg || 5) * (fx.stacks || 1);
                    target.takeDamage(dmg, 'energy', fx.params.source || null);
                }
                break;
            case STATUS_EFFECTS.SHOCKED:
                // Stun + arc to nearby
                if (target._disabled !== undefined) target._disabled = true;
                setTimeout(() => { if (target._disabled !== undefined) target._disabled = false; }, 200);
                break;
            case STATUS_EFFECTS.CORRODED:
                // Armor reduction is passive; tick does nothing extra
                break;
            case STATUS_EFFECTS.BLINDED:
                // Vision reduction is passive
                break;
            case STATUS_EFFECTS.MAGNETIZED:
                // Pull debris — handled by physics system if available
                break;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Elemental Interactions                                            */
    /* ------------------------------------------------------------------ */

    _checkElementalInteractions() {
        for (const [target, list] of this.active) {
            const has = (id) => list.some(e => e.id === id);

            // Burning + Frozen = Steam Cloud (blind 2s)
            if (has(STATUS_EFFECTS.BURNING) && has(STATUS_EFFECTS.FROZEN)) {
                this.applyEffect(target, STATUS_EFFECTS.BLINDED, 2.0);
                this.removeEffect(target, STATUS_EFFECTS.BURNING);
                this.removeEffect(target, STATUS_EFFECTS.FROZEN);
            }

            // Shocked + Oil Slick (treated as Burning proxy) = Fire Pool
            // Simplified: Shocked + Burning = enhanced burn
            if (has(STATUS_EFFECTS.SHOCKED) && has(STATUS_EFFECTS.BURNING)) {
                const burn = this.getEffect(target, STATUS_EFFECTS.BURNING);
                if (burn) burn.params.dmg = (burn.params.dmg || 5) * 1.5;
                this.removeEffect(target, STATUS_EFFECTS.SHOCKED);
            }

            // Frozen + Shocked = Shatter (instant 40 dmg, freeze 2× longer)
            if (has(STATUS_EFFECTS.FROZEN) && has(STATUS_EFFECTS.SHOCKED)) {
                if (target.takeDamage) target.takeDamage(40, 'electric', null);
                const frozen = this.getEffect(target, STATUS_EFFECTS.FROZEN);
                if (frozen) frozen.duration *= 2;
                this.removeEffect(target, STATUS_EFFECTS.SHOCKED);
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Config helpers                                                    */
    /* ------------------------------------------------------------------ */

    _canStack(effectId) {
        switch (effectId) {
            case STATUS_EFFECTS.BURNING: return true;
            case STATUS_EFFECTS.SHOCKED: return true;
            case STATUS_EFFECTS.FROZEN: return false;
            case STATUS_EFFECTS.CORRODED: return false;
            case STATUS_EFFECTS.BLINDED: return false;
            case STATUS_EFFECTS.MAGNETIZED: return false;
            case STATUS_EFFECTS.MARKED: return false;
            case STATUS_EFFECTS.ENRAGED: return false;
            case STATUS_EFFECTS.WEAKENED: return false;
            case STATUS_EFFECTS.OVERCLOCKED: return false;
            default: return false;
        }
    }

    _maxStacks(effectId) {
        switch (effectId) {
            case STATUS_EFFECTS.BURNING: return 3;
            case STATUS_EFFECTS.SHOCKED: return 3;
            default: return 1;
        }
    }

    _tickInterval(effectId) {
        switch (effectId) {
            case STATUS_EFFECTS.BURNING: return 1.0;
            case STATUS_EFFECTS.SHOCKED: return 0.5;
            case STATUS_EFFECTS.CORRODED: return 1.0;
            default: return 1.0;
        }
    }
}
