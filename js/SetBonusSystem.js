/**
 * SetBonusSystem — equipping 3+ pieces from same manufacturer grants unique bonuses.
 */

export const SET_BONUSES = {
    'Synapse Industries': {
        name: 'Synapse Protocol',
        bonus3: 'Hacked drones last 2x longer',
        bonus5: 'All drones start as neutral',
        apply: (player) => {
            player._synapseBonus = true;
            player._hackDurationMult = 2.0;
        },
        remove: (player) => {
            player._synapseBonus = false;
            player._hackDurationMult = 1.0;
        }
    },
    'Aegis Armaments': {
        name: 'Aegis Wall',
        bonus3: 'Parry grants 3-second damage shield',
        bonus5: 'Shield reflects 50% damage back',
        apply: (player) => {
            player._aegisBonus = true;
            player._parryShieldDuration = 3.0;
        },
        remove: (player) => {
            player._aegisBonus = false;
            player._parryShieldDuration = 0;
        }
    },
    'Vortex Dynamics': {
        name: 'Vortex Surge',
        bonus3: 'Slide-jump and wall-kick cost no stamina',
        bonus5: 'Double air dash charges',
        apply: (player) => {
            player._vortexBonus = true;
            player._freeParkourStamina = true;
        },
        remove: (player) => {
            player._vortexBonus = false;
            player._freeParkourStamina = false;
        }
    },
    'Null Sector': {
        name: 'Null Field',
        bonus3: 'Drone detection range halved',
        bonus5: 'Invisibility lasts 2x longer',
        apply: (player) => {
            player._nullBonus = true;
            player._detectionRangeMult = 0.5;
        },
        remove: (player) => {
            player._nullBonus = false;
            player._detectionRangeMult = 1.0;
        }
    },
};

export class SetBonusSystem {
    constructor(player) {
        this.player = player;
        this._activeBonuses = new Set();
    }

    update(exoSuit) {
        if (!exoSuit || !exoSuit.equipped) return;
        const counts = {};
        for (const slot of Object.keys(exoSuit.equipped)) {
            const item = exoSuit.equipped[slot];
            if (item && item.manufacturer) {
                counts[item.manufacturer] = (counts[item.manufacturer] || 0) + 1;
            }
        }

        const newBonuses = new Set();
        for (const [mfr, count] of Object.entries(counts)) {
            if (count >= 3 && SET_BONUSES[mfr]) {
                newBonuses.add(mfr);
            }
        }

        // Remove old bonuses
        for (const mfr of this._activeBonuses) {
            if (!newBonuses.has(mfr) && SET_BONUSES[mfr]) {
                SET_BONUSES[mfr].remove(this.player);
            }
        }
        // Add new bonuses
        for (const mfr of newBonuses) {
            if (!this._activeBonuses.has(mfr) && SET_BONUSES[mfr]) {
                SET_BONUSES[mfr].apply(this.player);
            }
        }
        this._activeBonuses = newBonuses;
    }

    getActiveText() {
        return Array.from(this._activeBonuses).map(m => {
            const set = SET_BONUSES[m];
            return set ? `${set.name}: ${set.bonus3}` : '';
        }).filter(Boolean);
    }
}
