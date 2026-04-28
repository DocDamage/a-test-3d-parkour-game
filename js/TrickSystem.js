/**
 * TrickSystem — unified trick/combo tracker for parkour, combat, and weapon tricks.
 * Chains tricks across categories for multipliers. Integrates with ChallengeSystem.
 */

export const TRICK_CATEGORIES = {
    PARKOUR: 'parkour',
    COMBAT: 'combat',
    WEAPON: 'weapon',
};

export const TRICKS = {
    // Parkour
    WALLRUN: { name: 'Wallrun', cat: TRICK_CATEGORIES.PARKOUR, base: 150 },
    VAULT: { name: 'Vault', cat: TRICK_CATEGORIES.PARKOUR, base: 100 },
    SLIDE: { name: 'Slide', cat: TRICK_CATEGORIES.PARKOUR, base: 75 },
    GRAPPLE: { name: 'Grapple', cat: TRICK_CATEGORIES.PARKOUR, base: 200 },
    WALLKICK: { name: 'Wall Kick', cat: TRICK_CATEGORIES.PARKOUR, base: 120 },
    TICTAC: { name: 'Tic-Tac', cat: TRICK_CATEGORIES.PARKOUR, base: 180 },
    DOUBLE_JUMP: { name: 'Double Jump', cat: TRICK_CATEGORIES.PARKOUR, base: 130 },
    CORNER_KICK: { name: 'Corner Kick', cat: TRICK_CATEGORIES.PARKOUR, base: 160 },
    DIVE_ROLL: { name: 'Dive Roll', cat: TRICK_CATEGORIES.PARKOUR, base: 140 },
    AIR_DODGE: { name: 'Air Dodge', cat: TRICK_CATEGORIES.PARKOUR, base: 110 },
    SLOPE_GRIND: { name: 'Slope Grind', cat: TRICK_CATEGORIES.PARKOUR, base: 170 },
    // Combat
    LIGHT_CHAIN3: { name: 'Light Chain', cat: TRICK_CATEGORIES.COMBAT, base: 90 },
    HEAVY_LAUNCH: { name: 'Heavy Launch', cat: TRICK_CATEGORIES.COMBAT, base: 120 },
    JUGGLE_3: { name: 'Juggle x3', cat: TRICK_CATEGORIES.COMBAT, base: 250 },
    PARRY_COUNTER: { name: 'Parry Counter', cat: TRICK_CATEGORIES.COMBAT, base: 200 },
    DODGE_SHOOT: { name: 'Dodge Shoot', cat: TRICK_CATEGORIES.COMBAT, base: 150 },
    MEAT_SHIELD_TOSS: { name: 'Meat Shield Toss', cat: TRICK_CATEGORIES.COMBAT, base: 180 },
    STATUS_COMBO: { name: 'Status Combo', cat: TRICK_CATEGORIES.COMBAT, base: 220 },
    FATALITY: { name: 'Fatality', cat: TRICK_CATEGORIES.COMBAT, base: 500 },
    // Weapon
    AERIAL_SHOOT: { name: 'Aerial Shoot', cat: TRICK_CATEGORIES.WEAPON, base: 140 },
    SLIDE_SHOOT: { name: 'Slide Shoot', cat: TRICK_CATEGORIES.WEAPON, base: 130 },
    WALLRUN_SHOOT: { name: 'Wallrun Shoot', cat: TRICK_CATEGORIES.WEAPON, base: 180 },
    BACKFLIP_TOSS: { name: 'Backflip Toss', cat: TRICK_CATEGORIES.WEAPON, base: 160 },
    CHARGE_SHOT: { name: 'Charge Shot', cat: TRICK_CATEGORIES.WEAPON, base: 120 },
    BANK_SHOT: { name: 'Bank Shot', cat: TRICK_CATEGORIES.WEAPON, base: 170 },
    FAN_HAMMER: { name: 'Fan the Hammer', cat: TRICK_CATEGORIES.WEAPON, base: 200 },
    GROUND_SLAM: { name: 'Ground Slam', cat: TRICK_CATEGORIES.WEAPON, base: 190 },
    POLE_VAULT: { name: 'Pole Vault', cat: TRICK_CATEGORIES.WEAPON, base: 150 },
    SPRAY_TAG: { name: 'Spray Tag', cat: TRICK_CATEGORIES.WEAPON, base: 100 },
};

const CROSS_MULT = {
    [`${TRICK_CATEGORIES.PARKOUR}->${TRICK_CATEGORIES.COMBAT}`]: 1.5,
    [`${TRICK_CATEGORIES.COMBAT}->${TRICK_CATEGORIES.WEAPON}`]: 1.5,
    [`${TRICK_CATEGORIES.PARKOUR}->${TRICK_CATEGORIES.WEAPON}`]: 2.0,
    [`${TRICK_CATEGORIES.COMBAT}->${TRICK_CATEGORIES.PARKOUR}`]: 1.5,
    [`${TRICK_CATEGORIES.WEAPON}->${TRICK_CATEGORIES.COMBAT}`]: 1.5,
    [`${TRICK_CATEGORIES.WEAPON}->${TRICK_CATEGORIES.PARKOUR}`]: 2.0,
};

const NAMED_SEQUENCES = [
    { name: 'Railgrind Warrior', seq: ['SLOPE_GRIND', 'SLIDE_SHOOT', 'WALLRUN_SHOOT'], bonus: 400 },
    { name: 'Aerial Assassin', seq: ['DOUBLE_JUMP', 'AERIAL_SHOOT', 'HEAVY_LAUNCH'], bonus: 500 },
    { name: 'Cornered Rat', seq: ['CORNER_KICK', 'PARRY_COUNTER', 'BANK_SHOT'], bonus: 450 },
    { name: 'Street Artist', seq: ['WALLRUN', 'SPRAY_TAG', 'GROUND_SLAM'], bonus: 400 },
    { name: 'Freestyle', seq: [], minLen: 5, bonus: 1000 },
];

export class TrickSystem {
    constructor(challengeSystem = null) {
        this.challengeSystem = challengeSystem;
        this.chain = [];
        this.chainTimer = 0;
        this.chainWindow = 3.0;
        this.totalScore = 0;
        this.bestChain = 0;
        this.discoveredSequences = new Set();
        this._lastCat = null;
        this._comboMultiplier = 1;
        this.onTrick = null;
        this.onSequence = null;
    }

    update(dt) {
        if (this.chainTimer > 0) {
            this.chainTimer -= dt;
            if (this.chainTimer <= 0) {
                this._endChain();
            }
        }
    }

    reportTrick(trickKey, context = {}) {
        const trick = TRICKS[trickKey];
        if (!trick) return 0;

        let multiplier = 1;
        if (this._lastCat && this._lastCat !== trick.cat) {
            const key = `${this._lastCat}->${trick.cat}`;
            multiplier = CROSS_MULT[key] || 1;
        }
        if (this.chain.length >= 2) {
            const cats = [...new Set(this.chain.map(t => t.cat))];
            if (cats.length >= 3) multiplier *= 3;
        }

        const score = Math.round(trick.base * multiplier * (context.bonusMul || 1));
        this.chain.push({ key: trickKey, cat: trick.cat, score, time: performance.now() });
        this.chainTimer = this.chainWindow;
        this._lastCat = trick.cat;
        this.totalScore += score;
        this.bestChain = Math.max(this.bestChain, this.chain.length);

        // Check named sequences
        this._checkSequences();

        // Report to challenge system
        if (this.challengeSystem && this.challengeSystem._addStyle) {
            this.challengeSystem._addStyle(trick.name, score);
        }

        if (this.onTrick) this.onTrick(trick.name, score, this.chain.length);
        return score;
    }

    _checkSequences() {
        const keys = this.chain.map(c => c.key);
        for (const seq of NAMED_SEQUENCES) {
            if (seq.name === 'Freestyle') {
                if (keys.length >= seq.minLen && !this.discoveredSequences.has(seq.name)) {
                    this.discoveredSequences.add(seq.name);
                    this.totalScore += seq.bonus;
                    if (this.onSequence) this.onSequence(seq.name, seq.bonus);
                }
                continue;
            }
            if (this.discoveredSequences.has(seq.name)) continue;
            // Check if sequence appears as contiguous subarray
            const sLen = seq.seq.length;
            if (keys.length < sLen) continue;
            const tail = keys.slice(-sLen);
            if (tail.every((k, i) => k === seq.seq[i])) {
                this.discoveredSequences.add(seq.name);
                this.totalScore += seq.bonus;
                if (this.onSequence) this.onSequence(seq.name, seq.bonus);
            }
        }
    }

    _endChain() {
        this.chain = [];
        this._lastCat = null;
        this._comboMultiplier = 1;
    }

    getCurrentMultiplier() {
        let m = 1;
        if (this._lastCat) {
            const cats = [...new Set(this.chain.map(t => t.cat))];
            if (cats.length >= 3) m = 3;
            else if (cats.length >= 2) m = 1.5;
        }
        return m;
    }

    reset() {
        this.chain = [];
        this.chainTimer = 0;
        this._lastCat = null;
        this._comboMultiplier = 1;
    }
}
