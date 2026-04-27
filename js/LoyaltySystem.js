export const RELATIONSHIP_TIERS = {
    RIVAL: 0,
    STRANGER: 1,
    FRIEND: 2,
    PARTNER: 3
};

const TIER_THRESHOLDS = [
    { tier: RELATIONSHIP_TIERS.RIVAL, min: 0, max: 9 },
    { tier: RELATIONSHIP_TIERS.STRANGER, min: 10, max: 39 },
    { tier: RELATIONSHIP_TIERS.FRIEND, min: 40, max: 79 },
    { tier: RELATIONSHIP_TIERS.PARTNER, min: 80, max: 100 }
];

export class LoyaltySystem {
    constructor(companionDrone) {
        this.companion = companionDrone;
        this._trust = 20; // start as Stranger
        this._abandoned = false;
        this._reviveUsed = false;
        this._trustLog = []; // [{ reason, delta, time }]
    }

    adjustTrust(delta, reason) {
        const before = this._trust;
        this._trust = Math.max(0, Math.min(100, this._trust + delta));
        this._trustLog.push({
            reason,
            delta,
            before,
            after: this._trust,
            time: performance.now()
        });

        this._clampLog();
        this._checkTierChange(before);
        this._checkRivalryPath();
    }

    getTrust() {
        return this._trust;
    }

    getTier() {
        for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
            if (this._trust >= TIER_THRESHOLDS[i].min) {
                return TIER_THRESHOLDS[i].tier;
            }
        }
        return RELATIONSHIP_TIERS.RIVAL;
    }

    /* ------------------------------------------------------------------ */
    /*  Dialogue                                                          */
    /* ------------------------------------------------------------------ */
    onPlayerDialogue(choiceType) {
        switch (choiceType) {
            case 'encouraging':
                this.adjustTrust(+5, 'encouraging dialogue');
                break;
            case 'curious':
                this.adjustTrust(+8, 'curious dialogue');
                break;
            case 'dismissive':
                this.adjustTrust(-3, 'dismissive dialogue');
                break;
            case 'authoritarian':
                this.adjustTrust(-8, 'authoritarian dialogue');
                break;
            default:
                break;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Event reactions                                                   */
    /* ------------------------------------------------------------------ */
    onCompanionRevivePlayer() {
        this.adjustTrust(+20, 'companion sacrificed battery to revive player');
        this._reviveUsed = true;
    }

    onCompanionDie() {
        this.adjustTrust(-10, 'companion died');
    }

    onPlayerAbandonCompanion() {
        this.adjustTrust(-15, 'player left companion behind');
    }

    onCompanionHealPlayer() {
        this.adjustTrust(+10, 'companion saved player with heal');
    }

    onSharedVictory() {
        this.adjustTrust(+15, 'shared victory (boss kill)');
    }

    /* ------------------------------------------------------------------ */
    /*  Tier effects helpers                                              */
    /* ------------------------------------------------------------------ */
    getSynergyBonus() {
        const tier = this.getTier();
        if (tier === RELATIONSHIP_TIERS.FRIEND) return 0.10;
        if (tier === RELATIONSHIP_TIERS.PARTNER) return 0.20;
        return 0;
    }

    canSacrificeRevive() {
        return this.getTier() === RELATIONSHIP_TIERS.PARTNER && !this._reviveUsed;
    }

    /* ------------------------------------------------------------------ */
    /*  Rivalry path                                                      */
    /* ------------------------------------------------------------------ */
    hasAbandoned() {
        return this._abandoned;
    }

    setAbandoned(bool) {
        this._abandoned = bool;
        if (bool) {
            this._trust = 0;
            if (this.companion) {
                this.companion.active = false;
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Serialization                                                     */
    /* ------------------------------------------------------------------ */
    serialize() {
        return {
            trust: this._trust,
            abandoned: this._abandoned,
            reviveUsed: this._reviveUsed,
            log: this._trustLog.slice(-50)
        };
    }

    deserialize(data) {
        if (typeof data.trust === 'number') {
            this._trust = Math.max(0, Math.min(100, data.trust));
        }
        if (typeof data.abandoned === 'boolean') {
            this._abandoned = data.abandoned;
        }
        if (typeof data.reviveUsed === 'boolean') {
            this._reviveUsed = data.reviveUsed;
        }
        if (Array.isArray(data.log)) {
            this._trustLog = data.log.slice(-50);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Internals                                                         */
    /* ------------------------------------------------------------------ */
    _clampLog() {
        if (this._trustLog.length > 200) {
            this._trustLog = this._trustLog.slice(-100);
        }
    }

    _checkTierChange(beforeTrust) {
        const beforeTier = this._trustToTier(beforeTrust);
        const afterTier = this.getTier();
        if (beforeTier !== afterTier) {
            this._emit('loyalty:tierChange', { from: beforeTier, to: afterTier, trust: this._trust });
        }
    }

    _checkRivalryPath() {
        if (this._trust === 0 && !this._abandoned) {
            this._emit('loyalty:rivalry', { trust: this._trust });
        }
    }

    _trustToTier(trust) {
        for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
            if (trust >= TIER_THRESHOLDS[i].min) {
                return TIER_THRESHOLDS[i].tier;
            }
        }
        return RELATIONSHIP_TIERS.RIVAL;
    }

    _emit(event, data) {
        if (this.companion?.eventBus && typeof this.companion.eventBus.emit === 'function') {
            this.companion.eventBus.emit(event, data);
        }
    }
}
