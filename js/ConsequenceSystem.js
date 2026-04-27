/**
 * ConsequenceSystem — lightweight choice tracker that modifies world state.
 *
 * Karma Vector: Cruel ↔ Merciful, Selfish ↔ Altruistic
 * Final boss encounter changes based on vector.
 */

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

export class ConsequenceSystem {
    constructor() {
        this.choices = new Map(); // choiceId -> { timestamp, karmaShift }
        this.karma = { cruelMerciful: 0, selfishAltruistic: 0 }; // -100 to +100
        this.worldFlags = new Map(); // persistent world changes
        this._load();
    }

    /* ------------------------------------------------------------------ */
    /*  Recording choices                                                 */
    /* ------------------------------------------------------------------ */

    record(choiceId, karmaShift = {}) {
        if (this.choices.has(choiceId)) return; // immutable

        this.choices.set(choiceId, {
            timestamp: Date.now(),
            karmaShift: { ...karmaShift }
        });

        // Apply karma shift
        if (karmaShift.cruelMerciful !== undefined) {
            this.karma.cruelMerciful = clamp(
                this.karma.cruelMerciful + karmaShift.cruelMerciful, -100, 100
            );
        }
        if (karmaShift.selfishAltruistic !== undefined) {
            this.karma.selfishAltruistic = clamp(
                this.karma.selfishAltruistic + karmaShift.selfishAltruistic, -100, 100
            );
        }

        this._applyConsequence(choiceId);
        this._save();
    }

    hasMade(choiceId) {
        return this.choices.has(choiceId);
    }

    /* ------------------------------------------------------------------ */
    /*  Consequence table                                                 */
    /* ------------------------------------------------------------------ */

    _applyConsequence(choiceId) {
        switch (choiceId) {
            case 'spare_sapper':
                this.worldFlags.set('sapper_npc_active', true);
                break;
            case 'free_warden_prisoners':
                this.worldFlags.set('prisoner_runners_active', true);
                break;
            case 'sell_boss_core':
                this.worldFlags.set('shop_bonus_chips', true);
                break;
            case 'mount_trophy':
                this.worldFlags.set('trophy_buff_active', true);
                break;
            case 'betray_faction_vanguard':
                this.karma.cruelMerciful -= 20;
                break;
            case 'save_civilian_sector4':
                this.karma.selfishAltruistic += 15;
                break;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Queries                                                           */
    /* ------------------------------------------------------------------ */

    getKarmaDescription() {
        const cm = this.karma.cruelMerciful;
        const sa = this.karma.selfishAltruistic;
        let desc = '';
        if (cm > 30) desc += 'Merciful ';
        else if (cm < -30) desc += 'Ruthless ';
        if (sa > 30) desc += 'Altruist';
        else if (sa < -30) desc += 'Opportunist';
        if (!desc) desc = 'Balanced';
        return desc.trim();
    }

    getFinalBossModifier() {
        // Returns modifier object for final boss based on karma
        const cm = this.karma.cruelMerciful;
        const sa = this.karma.selfishAltruistic;
        if (cm > 50 && sa > 50) return { dialogue: 'redemption', bossHpMult: 0.8, playerDmgMult: 1.2 };
        if (cm < -50 && sa < -50) return { dialogue: 'tyranny', bossHpMult: 1.3, playerDmgMult: 1.0 };
        if (cm > 50) return { dialogue: 'mercy', bossHpMult: 1.0, playerDmgMult: 1.1 };
        if (cm < -50) return { dialogue: 'judgement', bossHpMult: 1.2, playerDmgMult: 1.0 };
        return { dialogue: 'neutral', bossHpMult: 1.0, playerDmgMult: 1.0 };
    }

    /* ------------------------------------------------------------------ */
    /*  Persistence                                                       */
    /* ------------------------------------------------------------------ */

    _save() {
        try {
            localStorage.setItem('apex_consequences', JSON.stringify({
                choices: Array.from(this.choices.entries()),
                karma: { ...this.karma },
                worldFlags: Array.from(this.worldFlags.entries())
            }));
        } catch (e) {}
    }

    _load() {
        try {
            const raw = localStorage.getItem('apex_consequences');
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data.choices) this.choices = new Map(data.choices);
            if (data.karma) this.karma = data.karma;
            if (data.worldFlags) this.worldFlags = new Map(data.worldFlags);
        } catch (e) {}
    }
}
