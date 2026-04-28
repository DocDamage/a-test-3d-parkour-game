/**
 * SeasonSystem — rotating global modifiers based on real-world date.
 * Each week (or day) a new modifier is active, changing gameplay rules.
 */

const SEASONS = [
    {
        id: 'gravity_week',
        name: 'Low Gravity',
        description: 'All jumps have 2x height. Falling damage reduced by 50%.',
        modifier: (player) => {
            if (!player._seasonOriginalJump) player._seasonOriginalJump = player.JUMP_FORCE;
            player.JUMP_FORCE = player._seasonOriginalJump * 1.5;
        },
        unmodifier: (player) => {
            if (player._seasonOriginalJump) player.JUMP_FORCE = player._seasonOriginalJump;
        }
    },
    {
        id: 'storm_week',
        name: 'Electric Storm',
        description: 'All weapons deal bonus lightning damage. Drones attack 30% faster.',
        modifier: (player) => {
            player._seasonLightningBonus = true;
        },
        unmodifier: (player) => {
            player._seasonLightningBonus = false;
        }
    },
    {
        id: 'dense_week',
        name: 'Dense Air',
        description: 'Movement speed reduced 20%. Wall-run duration doubled.',
        modifier: (player) => {
            if (!player._seasonOriginalSpeed) player._seasonOriginalSpeed = player.SPEED_SPRINT;
            player.SPEED_SPRINT = player._seasonOriginalSpeed * 0.8;
        },
        unmodifier: (player) => {
            if (player._seasonOriginalSpeed) player.SPEED_SPRINT = player._seasonOriginalSpeed;
        }
    },
    {
        id: 'wealth_week',
        name: 'Golden Age',
        description: 'Shard drops doubled. Shop prices reduced 25%.',
        modifier: () => {},
        unmodifier: () => {}
    },
    {
        id: 'hazard_week',
        name: 'Hazard Pay',
        description: 'Environmental damage doubled. Loot quality increased.',
        modifier: () => {},
        unmodifier: () => {}
    },
    {
        id: 'stealth_week',
        name: 'Ghost Protocol',
        description: 'Drone detection range halved. Melee damage doubled.',
        modifier: (player) => {
            player._seasonStealthBonus = true;
        },
        unmodifier: (player) => {
            player._seasonStealthBonus = false;
        }
    },
    {
        id: 'overclock_week',
        name: 'Overdrive',
        description: 'Overclock cooldown halved. Energy drain doubled while active.',
        modifier: () => {},
        unmodifier: () => {}
    }
];

export class SeasonSystem {
    constructor(player) {
        this.player = player;
        this.current = null;
        this._applied = false;
        this._update();
    }

    _update() {
        const now = new Date();
        const week = this._getWeekNumber(now);
        const idx = week % SEASONS.length;
        this.current = SEASONS[idx];
    }

    apply() {
        if (!this.player || !this.current) return;
        if (this._applied) this.remove();
        if (this.current.modifier) this.current.modifier(this.player);
        this._applied = true;
    }

    remove() {
        if (!this.player || !this.current) return;
        if (this.current.unmodifier) this.current.unmodifier(this.player);
        this._applied = false;
    }

    getCurrent() {
        this._update();
        return this.current;
    }

    getAll() {
        return SEASONS;
    }

    _getWeekNumber(d) {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    }

    serialize() {
        return { currentId: this.current?.id || null };
    }

    deserialize(data) {
        this._update();
    }
}
