/**
 * OriginSystem manages character backgrounds, providing passive bonuses,
 * starting exo-suit gear references, dialogue tags, and unique interactions.
 */

export const ORIGINS = {
    CORPORATE: 'corporate_defector',
    STREET: 'street_traceur',
    MILITARY: 'military_washout',
    SALVAGE: 'salvage_rat'
};

const ORIGIN_DATA = {
    [ORIGINS.CORPORATE]: {
        name: 'Corporate Defector',
        description: 'You left the boardroom for the rooftops, taking trade secrets with you.',
        lore: 'Once a mid-level executive at Zenith Solutions, you discovered the truth behind Project Aegis. You abandoned your corner office for a life in the shadows, but your insider knowledge still opens doors — and drops jaws.',
        passiveBonus: { chipDropMultiplier: 1.25 },
        startingGear: 'negotiator',
        dialogueTag: 'corporate',
        enemyInteraction: {
            type: 'corporate_drone',
            effect: 'recognize_id'
        }
    },
    [ORIGINS.STREET]: {
        name: 'Street Traceur',
        description: 'Raised on concrete and chaos, the city is your playground.',
        lore: 'No academy taught you to move. You learned vaults escaping rent-a-cops and wallruns evading rival crews. The street gave you calluses, instincts, and a network of informants who trade tips for thrills.',
        passiveBonus: { vaultStaminaRegen: 5 },
        startingGear: 'freerun',
        dialogueTag: 'street',
        enemyInteraction: null
    },
    [ORIGINS.MILITARY]: {
        name: 'Military Washout',
        description: 'Discharged but not disarmed. Discipline is your weapon.',
        lore: 'A training accident buried your squad career, but not your muscle memory. You still clear rooms in your sleep, and your tactical mindset turns every alley into a killzone — or an escape route.',
        passiveBonus: { reloadSpeedMultiplier: 1.30 },
        startingGear: 'tac',
        dialogueTag: 'military',
        enemyInteraction: {
            type: 'military_drone',
            effect: 'hesitate',
            duration: 0.5
        }
    },
    [ORIGINS.SALVAGE]: {
        name: 'Salvage Rat',
        description: "One person's scrap is your payday.",
        lore: 'You grew up in the Rust Quarter, pulling fusion cells from dead mechs and wiring black-market implants. Scavengers know your face, and your fingers can strip a drone to parts in thirty seconds flat.',
        passiveBonus: { scrapMultiplier: 1.50 },
        startingGear: 'junker',
        dialogueTag: 'scavenger',
        enemyInteraction: null
    }
};

export class OriginSystem {
    constructor(player, characterSheet = null) {
        this.player = player;
        this.sheet = characterSheet;
        this.currentOrigin = null;
    }

    // --- Core ---

    setOrigin(originKey) {
        if (!ORIGIN_DATA[originKey]) return false;
        this.currentOrigin = originKey;
        return true;
    }

    getOrigin() {
        return this.currentOrigin;
    }

    _getData() {
        if (!this.currentOrigin) return null;
        return ORIGIN_DATA[this.currentOrigin];
    }

    // --- Info ---

    getName() {
        const data = this._getData();
        return data ? data.name : null;
    }

    getDescription() {
        const data = this._getData();
        return data ? data.description : null;
    }

    getLore() {
        const data = this._getData();
        return data ? data.lore : null;
    }

    // --- Bonuses ---

    /**
     * @returns {{[stat: string]: number}|null} flat stat or multiplier bonuses
     */
    getPassiveBonus() {
        const data = this._getData();
        return data ? { ...data.passiveBonus } : null;
    }

    /**
     * @returns {string|null} exo-suit piece ID for future ExoSuitSystem
     */
    getStartingGear() {
        const data = this._getData();
        return data ? data.startingGear : null;
    }

    /**
     * @returns {string|null} dialogue tag for NPC reactions
     */
    getDialogueTag() {
        const data = this._getData();
        return data ? data.dialogueTag : null;
    }

    // --- Interaction hooks ---

    /**
     * Called when an enemy spots the player.
     * @param {string} enemyType - e.g. 'military_drone', 'corporate_drone'
     * @returns {{hesitate?: number, recognize_id?: boolean}|null} interaction result
     */
    onEnemySpot(enemyType) {
        const data = this._getData();
        if (!data || !data.enemyInteraction) return null;

        const interaction = data.enemyInteraction;
        if (interaction.type === enemyType) {
            if (interaction.effect === 'hesitate') {
                return { hesitate: interaction.duration || 0.5 };
            }
            if (interaction.effect === 'recognize_id') {
                return { recognize_id: true };
            }
        }
        return null;
    }

    /**
     * Called when the player enters a shop.
     * @returns {{priceMultiplier?: number}|null}
     */
    onShopEnter() {
        if (this.currentOrigin === ORIGINS.CORPORATE) {
            return { priceMultiplier: 0.90 };
        }
        return null;
    }
}
