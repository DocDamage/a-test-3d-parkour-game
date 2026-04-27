/**
 * ArchetypeSystem manages runner classes, their unique resources,
 * and level-locked capstone abilities.
 *
 * Primary archetype generates resource at 100% efficiency.
 * Secondary (unlocked at level 20) generates at 50% efficiency.
 * Tertiary (unlocked at level 40) generates at 25% efficiency.
 */

export const ARCHETYPES = {
    TRACEUR: 'traceur',
    OPERATIVE: 'operative',
    SABOTEUR: 'saboteur',
    SPECIMEN: 'specimen',
    NETRUNNER: 'netrunner',
    MAGE: 'mage'
};

const ARCHETYPE_DATA = {
    [ARCHETYPES.TRACEUR]: {
        name: 'Traceur',
        description: 'Master of fluid movement and kinetic chains. Momentum fuels impossible acrobatics.',
        resource: 'momentum',
        resourceMax: 100,
        decayDelay: 1.0, // seconds grounded before decay starts
        decayRate: 10,   // per second
        chainGain: 5,
        capstoneCost: 80,
        capstoneDuration: 8
    },
    [ARCHETYPES.OPERATIVE]: {
        name: 'Operative',
        description: 'Silent, precise, and always three moves ahead. Focus powers the perfect shot.',
        resource: 'focus',
        resourceMax: 100,
        passiveGainCrouch: 3,  // per second
        passiveGainStill: 3,   // per second
        takedownGain: 10,
        capstoneCost: 60,
        capstoneDuration: 15   // seconds until ghost bullet expires if unused
    },
    [ARCHETYPES.SABOTEUR]: {
        name: 'Saboteur',
        description: 'Chaos is a tool. Destruction feeds ingenuity.',
        resource: 'chaos',
        resourceMax: 100,
        environmentalGain: 15,
        gadgetKillGain: 5,
        capstoneCost: 80,
        capstoneDuration: 5
    },
    [ARCHETYPES.SPECIMEN]: {
        name: 'Specimen',
        description: 'Pushing biological limits through pain. Adrenaline unlocks raw power.',
        resource: 'adrenaline',
        resourceMax: 100,
        lowHealthThreshold: 0.5,
        lowHealthGain: 8,   // per second
        damageGain: 20,
        capstoneCost: 80,
        capstoneDuration: 8
    },
    [ARCHETYPES.NETRUNNER]: {
        name: 'Netrunner',
        description: 'The digital world bends to your will. Bandwidth controls the machine.',
        resource: 'bandwidth',
        resourceMax: 100,
        hackGain: 10,
        droneControlGain: 5,  // per second per controlled drone
        capstoneCost: 80,
        capstoneDuration: 10
    },
    [ARCHETYPES.MAGE]: {
        name: 'Mage',
        description: 'Reality is merely a suggestion. Bend the elements to your will.',
        resource: 'mana',
        resourceMax: 120,
        spellCastGain: 5,      // per spell cast
        capstoneCost: 80,
        capstoneDuration: 10   // Mana Surge duration
    }
};

const PARKOUR_STATES = new Set([
    'JUMP', 'FALL', 'CLIMB', 'VAULT', 'WALLRUN', 'HANG',
    'GRAPPLE_AIM', 'SWING', 'RETRACT'
]);

const SLOT_EFFICIENCY = {
    primary: 1.0,
    secondary: 0.5,
    tertiary: 0.25
};

const SLOTS = ['primary', 'secondary', 'tertiary'];

export class ArchetypeSystem {
    constructor(player, characterSheet = null) {
        this.player = player;
        this.sheet = characterSheet;

        this.primary = null;
        this.secondary = null;
        this.tertiary = null;

        // Resource pools per slot: Map<slot, {current, max}>
        this._resources = new Map();

        // Traceur tracking
        this._lastState = null;
        this._groundedTimer = 0;

        // Operative
        this._ghostBulletReady = false;
        this._ghostBulletTimer = 0;

        // Netrunner
        this._controllingDrones = 0;

        // Timed capstones
        this._infiniteWallrunTimer = 0;
        this._zeroCooldownTimer = 0;
        this._berserkTimer = 0;
        this._swarmOverrideTimer = 0;
    }

    // --- Helpers ---

    _getLevel() {
        if (this.sheet && typeof this.sheet.level === 'number') {
            return this.sheet.level;
        }
        return 1;
    }

    _ensureResourceSlot(slot) {
        if (!this._resources.has(slot)) {
            this._resources.set(slot, { current: 0, max: 0 });
        }
        return this._resources.get(slot);
    }

    _getEfficiency(slot) {
        return SLOT_EFFICIENCY[slot] || 1.0;
    }

    _changeResource(slot, delta) {
        const res = this._ensureResourceSlot(slot);
        const efficiency = this._getEfficiency(slot);
        res.current = Math.max(0, Math.min(res.max, res.current + (delta * efficiency)));
    }

    _setArchetype(slot, archetypeKey) {
        const data = ARCHETYPE_DATA[archetypeKey];
        if (!data) return false;

        // Prevent duplicates across different slots
        const alreadyInSlot =
            (this.primary === archetypeKey ? 'primary' :
             this.secondary === archetypeKey ? 'secondary' :
             this.tertiary === archetypeKey ? 'tertiary' : null);

        if (alreadyInSlot && alreadyInSlot !== slot) return false;

        this[slot] = archetypeKey;
        const res = this._ensureResourceSlot(slot);
        res.max = Math.floor(data.resourceMax * this._getEfficiency(slot));
        res.current = Math.min(res.current, res.max);
        return true;
    }

    // --- Slot Setters ---

    setPrimary(archetypeKey) {
        return this._setArchetype('primary', archetypeKey);
    }

    setSecondary(archetypeKey) {
        if (this._getLevel() < 20) return false;
        return this._setArchetype('secondary', archetypeKey);
    }

    setTertiary(archetypeKey) {
        if (this._getLevel() < 40) return false;
        return this._setArchetype('tertiary', archetypeKey);
    }

    getPrimaryArchetype()   { return this.primary; }
    getSecondaryArchetype() { return this.secondary; }
    getTertiaryArchetype()  { return this.tertiary; }

    getArchetypeData(archetypeKey) {
        return ARCHETYPE_DATA[archetypeKey] || null;
    }

    // --- Primary Resource API ---

    getResourceType() {
        if (!this.primary) return null;
        return ARCHETYPE_DATA[this.primary].resource;
    }

    getResourceValue() {
        const res = this._resources.get('primary');
        return res ? res.current : 0;
    }

    getResourceMax() {
        const res = this._resources.get('primary');
        return res ? res.max : 0;
    }

    /**
     * Add resource to the primary archetype.
     * @param {number} amount
     */
    addResource(amount) {
        this._changeResource('primary', amount);
    }

    /**
     * Spend resource from the primary archetype.
     * @param {number} amount
     * @returns {boolean} true if sufficient resource was available
     */
    spendResource(amount) {
        const res = this._resources.get('primary');
        if (!res || res.current < amount) return false;
        res.current -= amount;
        return true;
    }

    // --- Event hooks called by other gameplay systems ---

    /** Call when the player completes a silent takedown. */
    onSilentTakedown() {
        SLOTS.forEach(slot => {
            if (this[slot] === ARCHETYPES.OPERATIVE) {
                this._changeResource(slot, ARCHETYPE_DATA[ARCHETYPES.OPERATIVE].takedownGain);
            }
        });
    }

    /** Call when an environmental object explodes or breaks. */
    onEnvironmentalBreak() {
        SLOTS.forEach(slot => {
            if (this[slot] === ARCHETYPES.SABOTEUR) {
                this._changeResource(slot, ARCHETYPE_DATA[ARCHETYPES.SABOTEUR].environmentalGain);
            }
        });
    }

    /** Call when a grenade or trap kills an enemy. */
    onGadgetKill() {
        SLOTS.forEach(slot => {
            if (this[slot] === ARCHETYPES.SABOTEUR) {
                this._changeResource(slot, ARCHETYPE_DATA[ARCHETYPES.SABOTEUR].gadgetKillGain);
            }
        });
    }

    /** Call when the player takes damage. */
    onDamageTaken() {
        SLOTS.forEach(slot => {
            if (this[slot] === ARCHETYPES.SPECIMEN) {
                this._changeResource(slot, ARCHETYPE_DATA[ARCHETYPES.SPECIMEN].damageGain);
            }
        });
    }

    /** Call when the player successfully hacks, EMPs, or hijacks a target. */
    onHack() {
        SLOTS.forEach(slot => {
            if (this[slot] === ARCHETYPES.NETRUNNER) {
                this._changeResource(slot, ARCHETYPE_DATA[ARCHETYPES.NETRUNNER].hackGain);
            }
        });
    }

    /** Set the number of drones currently under player control. */
    setControllingDrone(count) {
        this._controllingDrones = Math.max(0, count);
    }

    // --- Update ---

    /**
     * Update resource generation and capstone timers.
     * @param {number} dt — delta time in seconds
     * @param {object} playerState — object with {state, grounded, velocity, health, maxHealth}
     */
    update(dt, playerState = this.player) {
        if (!playerState || dt <= 0) return;

        const state = playerState.state || 'IDLE';
        const grounded = playerState.grounded || false;
        const velocity = playerState.velocity || { x: 0, y: 0, z: 0 };
        const health = playerState.health ?? (this.player ? this.player.health : 100);
        const maxHealth = playerState.maxHealth ?? (this.player ? this.player.maxHealth : 100);
        const healthPct = maxHealth > 0 ? health / maxHealth : 1;

        // Passive resource generation per slot
        SLOTS.forEach(slot => {
            const key = this[slot];
            if (!key) return;
            this._updateSlot(dt, slot, key, state, grounded, velocity, healthPct);
        });

        // Traceur: parkour chain links
        const isParkour = PARKOUR_STATES.has(state);
        const wasParkour = PARKOUR_STATES.has(this._lastState);
        const airborne = !grounded;

        if (airborne && wasParkour && isParkour && state !== this._lastState) {
            SLOTS.forEach(slot => {
                if (this[slot] === ARCHETYPES.TRACEUR) {
                    this._changeResource(slot, ARCHETYPE_DATA[ARCHETYPES.TRACEUR].chainGain);
                }
            });
        }

        // Traceur: grounded decay
        if (grounded) {
            this._groundedTimer += dt;
        } else {
            this._groundedTimer = 0;
        }

        if (this._groundedTimer > ARCHETYPE_DATA[ARCHETYPES.TRACEUR].decayDelay) {
            SLOTS.forEach(slot => {
                if (this[slot] === ARCHETYPES.TRACEUR) {
                    const decay = ARCHETYPE_DATA[ARCHETYPES.TRACEUR].decayRate * dt;
                    this._changeResource(slot, -decay);
                }
            });
        }

        this._lastState = state;

        // Tick capstone timers
        this._updateCapstones(dt);
    }

    _updateSlot(dt, slot, key, state, grounded, velocity, healthPct) {
        const data = ARCHETYPE_DATA[key];

        switch (key) {
            case ARCHETYPES.OPERATIVE: {
                const isCrouched = state === 'CROUCH';
                const speedSq = (velocity.x * velocity.x) + (velocity.y * velocity.y) + (velocity.z * velocity.z);
                const isStill = state === 'IDLE' && speedSq < 0.01;
                if (isCrouched || isStill) {
                    this._changeResource(slot, data.passiveGainCrouch * dt);
                }
                break;
            }
            case ARCHETYPES.SPECIMEN: {
                if (healthPct < data.lowHealthThreshold) {
                    this._changeResource(slot, data.lowHealthGain * dt);
                }
                break;
            }
            case ARCHETYPES.NETRUNNER: {
                if (this._controllingDrones > 0) {
                    this._changeResource(slot, data.droneControlGain * this._controllingDrones * dt);
                }
                break;
            }
            case ARCHETYPES.MAGE: {
                // Mana regenerates passively via ResourceSystem.update()
                // Mage gets bonus regen during Mana Surge
                if (this._manaSurgeTimer > 0) {
                    this._changeResource(slot, 15 * dt);
                }
                break;
            }
        }
    }

    _updateCapstones(dt) {
        this._infiniteWallrunTimer = Math.max(0, this._infiniteWallrunTimer - dt);
        this._zeroCooldownTimer = Math.max(0, this._zeroCooldownTimer - dt);
        this._berserkTimer = Math.max(0, this._berserkTimer - dt);
        this._swarmOverrideTimer = Math.max(0, this._swarmOverrideTimer - dt);
        this._ghostBulletTimer = Math.max(0, this._ghostBulletTimer - dt);
        this._manaSurgeTimer = Math.max(0, this._manaSurgeTimer - dt);

        if (this._ghostBulletTimer <= 0) {
            this._ghostBulletReady = false;
        }
    }

    // --- Capstone API ---

    _capstoneUnlocked() {
        return this._getLevel() >= 20;
    }

    _isCapstoneEffectActive(key) {
        switch (key) {
            case ARCHETYPES.TRACEUR:   return this._infiniteWallrunTimer > 0;
            case ARCHETYPES.OPERATIVE: return this._ghostBulletReady;
            case ARCHETYPES.SABOTEUR:  return this._zeroCooldownTimer > 0;
            case ARCHETYPES.SPECIMEN:  return this._berserkTimer > 0;
            case ARCHETYPES.NETRUNNER: return this._swarmOverrideTimer > 0;
            case ARCHETYPES.MAGE:      return this._manaSurgeTimer > 0;
            default: return false;
        }
    }

    canUseCapstone() {
        if (!this.primary || !this._capstoneUnlocked()) return false;
        const data = ARCHETYPE_DATA[this.primary];
        const res = this._resources.get('primary');
        if (!res || res.current < data.capstoneCost) return false;
        if (this._isCapstoneEffectActive(this.primary)) return false;
        return true;
    }

    activateCapstone() {
        if (!this.canUseCapstone()) return false;

        const key = this.primary;
        const data = ARCHETYPE_DATA[key];
        const res = this._resources.get('primary');
        if (!res) return false;

        res.current -= data.capstoneCost;

        switch (key) {
            case ARCHETYPES.TRACEUR:
                this._infiniteWallrunTimer = data.capstoneDuration;
                break;
            case ARCHETYPES.OPERATIVE:
                this._ghostBulletReady = true;
                this._ghostBulletTimer = data.capstoneDuration;
                break;
            case ARCHETYPES.SABOTEUR:
                this._zeroCooldownTimer = data.capstoneDuration;
                break;
            case ARCHETYPES.SPECIMEN:
                this._berserkTimer = data.capstoneDuration;
                break;
            case ARCHETYPES.NETRUNNER:
                this._swarmOverrideTimer = data.capstoneDuration;
                break;
            case ARCHETYPES.MAGE:
                this._manaSurgeTimer = data.capstoneDuration;
                break;
        }

        return true;
    }

    // --- Capstone query API for other systems ---

    isInfiniteWallrunActive() {
        return this._infiniteWallrunTimer > 0;
    }

    isGhostBulletReady() {
        return this._ghostBulletReady;
    }

    /** Call after firing the ghost bullet to consume the charge. */
    consumeGhostBullet() {
        const ready = this._ghostBulletReady;
        this._ghostBulletReady = false;
        this._ghostBulletTimer = 0;
        return ready;
    }

    isZeroCooldownActive() {
        return this._zeroCooldownTimer > 0;
    }

    isBerserkActive() {
        return this._berserkTimer > 0;
    }

    isSwarmOverrideActive() {
        return this._swarmOverrideTimer > 0;
    }

    isManaSurgeActive() {
        return this._manaSurgeTimer > 0;
    }

    getCapstoneTimeRemaining(capstoneKey) {
        switch (capstoneKey) {
            case ARCHETYPES.TRACEUR:   return this._infiniteWallrunTimer;
            case ARCHETYPES.OPERATIVE: return this._ghostBulletTimer;
            case ARCHETYPES.SABOTEUR:  return this._zeroCooldownTimer;
            case ARCHETYPES.SPECIMEN:  return this._berserkTimer;
            case ARCHETYPES.NETRUNNER: return this._swarmOverrideTimer;
            case ARCHETYPES.MAGE:      return this._manaSurgeTimer;
            default: return 0;
        }
    }

    /** Reset all resources and capstones (e.g. on respawn). */
    reset() {
        this._resources.forEach(res => { res.current = 0; });
        this._infiniteWallrunTimer = 0;
        this._zeroCooldownTimer = 0;
        this._berserkTimer = 0;
        this._swarmOverrideTimer = 0;
        this._ghostBulletTimer = 0;
        this._ghostBulletReady = false;
        this._manaSurgeTimer = 0;
        this._groundedTimer = 0;
        this._lastState = null;
        this._controllingDrones = 0;
    }
}
