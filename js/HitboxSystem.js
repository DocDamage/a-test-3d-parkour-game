import * as THREE from 'three';

/**
 * @typedef {Object} HitboxShape
 * @property {'sphere'|'box'} type
 * @property {number} [radius]  — sphere radius
 * @property {THREE.Vector3} [size] — box half-extents (x, y, z)
 */

/**
 * @typedef {Object} HitResult
 * @property {Hitbox} hitbox
 * @property {Hitbox} target
 * @property {THREE.Vector3} point — approximate collision point
 */

/**
 * Single combat hitbox registered in HitboxSystem.
 */
export class Hitbox {
    /**
     * @param {Object} owner — entity that owns this hitbox (player, drone, projectile, etc.)
     * @param {string} type — 'melee' | 'projectile' | 'explosion' | 'beam' | 'hurtbox'
     * @param {HitboxShape} shape
     * @param {THREE.Vector3} offset — local offset from owner position
     * @param {number} duration — seconds before auto-expire (0 = instant, removed after one check)
     * @param {Function} [onHit] — callback(hitbox, target)
     */
    constructor(owner, type, shape, offset, duration, onHit = null) {
        this.owner = owner;
        this.type = type;
        this.shape = shape;
        this.offset = offset.clone();
        this.duration = duration;
        this.onHit = onHit;

        /** @type {'player'|'enemy'|'neutral'} */
        this.team = owner.team || 'neutral';

        /** Set of owner objects already hit (prevents multi-tick damage). */
        this.hitOwners = new Set();

        /** Internal flag for instant hitboxes. */
        this._expired = false;
    }

    /**
     * World-space centre of this hitbox.
     * @returns {THREE.Vector3}
     */
    getWorldPosition() {
        const base = this.owner.position ? this.owner.position.clone() : new THREE.Vector3();
        return base.add(this.offset);
    }
}

/**
 * Centralized collision detection for combat.
 * Handles hitbox↔hurtbox queries with simple sphere-sphere / sphere-box distance checks.
 */
export class HitboxSystem {
    constructor() {
        /** @type {Hitbox[]} */
        this.hitboxes = [];
    }

    /**
     * Add a hitbox to the active set.
     * @param {Hitbox} hitbox
     */
    registerHitbox(hitbox) {
        if (!hitbox || this.hitboxes.includes(hitbox)) return;
        this.hitboxes.push(hitbox);
    }

    /**
     * Remove a specific hitbox.
     * @param {Hitbox} hitbox
     */
    unregisterHitbox(hitbox) {
        const idx = this.hitboxes.indexOf(hitbox);
        if (idx !== -1) {
            this.hitboxes.splice(idx, 1);
        }
    }

    /**
     * Run all collision checks and forward hits to damageSystem.
     *
     * Collision rules:
     *   - player  hitboxes → enemy  hurtboxes
     *   - enemy   hitboxes → player hurtbox
     *   - neutral hitboxes → all hurtboxes
     *
     * @param {Object} damageSystem — object with applyDamage(source, target, amount, type)
     */
    checkCollisions(damageSystem) {
        if (!damageSystem) return;

        const hurtboxes = this.hitboxes.filter(h => h.type === 'hurtbox');
        const attackers = this.hitboxes.filter(h => h.type !== 'hurtbox');

        for (const atk of attackers) {
            if (atk._expired) continue;

            for (const def of hurtboxes) {
                // Skip self-damage unless explicitly allowed
                if (atk.owner === def.owner) continue;

                // Already hit this owner this frame / session
                if (atk.hitOwners.has(def.owner)) continue;

                // Team filtering
                if (!this._canHit(atk, def)) continue;

                if (this._intersects(atk, def)) {
                    atk.hitOwners.add(def.owner);

                    const amount = this._resolveDamage(atk);
                    const damageType = this._resolveDamageType(atk);

                    if (typeof damageSystem.applyDamage === 'function') {
                        damageSystem.applyDamage(atk.owner, def.owner, amount, damageType);
                    }

                    if (atk.onHit) {
                        atk.onHit(atk, def);
                    }

                    // Instant hitboxes expire immediately after first contact
                    if (atk.duration === 0) {
                        atk._expired = true;
                    }
                }
            }
        }
    }

    /**
     * Decrement durations and purge expired hitboxes.
     * @param {number} dt — delta time in seconds
     */
    update(dt) {
        for (let i = this.hitboxes.length - 1; i >= 0; i--) {
            const hb = this.hitboxes[i];
            if (hb.duration > 0) {
                hb.duration -= dt;
                if (hb.duration <= 0) {
                    this.hitboxes.splice(i, 1);
                }
            } else if (hb.duration === 0 && hb._expired) {
                this.hitboxes.splice(i, 1);
            }
        }
    }

    /** Remove every hitbox (arena reset). */
    clear() {
        this.hitboxes.length = 0;
    }

    /* -------------------------------------------------------------------- */
    /*  Private helpers                                                     */
    /* -------------------------------------------------------------------- */

    /**
     * Team-based filtering.
     * @private
     */
    _canHit(atk, def) {
        if (atk.type === 'hurtbox' || def.type !== 'hurtbox') return false;

        switch (atk.team) {
            case 'player':
                return def.team === 'enemy';
            case 'enemy':
                return def.team === 'player';
            case 'neutral':
                return def.team === 'player' || def.team === 'enemy';
            default:
                return false;
        }
    }

    /**
     * Simple intersection test: sphere-sphere or sphere-box.
     * @private
     */
    _intersects(a, b) {
        const posA = a.getWorldPosition();
        const posB = b.getWorldPosition();

        const shapeA = a.shape;
        const shapeB = b.shape;

        // Both spheres
        if (shapeA.type === 'sphere' && shapeB.type === 'sphere') {
            const rSum = (shapeA.radius || 0) + (shapeB.radius || 0);
            return posA.distanceToSquared(posB) <= rSum * rSum;
        }

        // A sphere, B box
        if (shapeA.type === 'sphere' && shapeB.type === 'box') {
            return this._sphereBoxIntersect(posA, shapeA.radius || 0, posB, shapeB.size);
        }

        // A box, B sphere
        if (shapeA.type === 'box' && shapeB.type === 'sphere') {
            return this._sphereBoxIntersect(posB, shapeB.radius || 0, posA, shapeA.size);
        }

        // Both boxes — approximate with sphere using half-diagonal
        if (shapeA.type === 'box' && shapeB.type === 'box') {
            const rA = shapeA.size.length();
            const rB = shapeB.size.length();
            const rSum = rA + rB;
            return posA.distanceToSquared(posB) <= rSum * rSum;
        }

        return false;
    }

    /**
     * @private
     */
    _sphereBoxIntersect(spherePos, radius, boxPos, boxSize) {
        const half = boxSize;
        const dx = Math.max(boxPos.x - half.x, Math.min(spherePos.x, boxPos.x + half.x));
        const dy = Math.max(boxPos.y - half.y, Math.min(spherePos.y, boxPos.y + half.y));
        const dz = Math.max(boxPos.z - half.z, Math.min(spherePos.z, boxPos.z + half.z));
        const distSq = (spherePos.x - dx) ** 2 + (spherePos.y - dy) ** 2 + (spherePos.z - dz) ** 2;
        return distSq <= radius * radius;
    }

    /**
     * Derive damage amount from the hitbox / owner.
     * @private
     */
    _resolveDamage(atk) {
        if (atk.owner && typeof atk.owner.meleeDamage === 'number') {
            return atk.owner.meleeDamage;
        }
        if (atk.owner && typeof atk.owner.damage === 'number') {
            return atk.owner.damage;
        }
        // Defaults by type
        switch (atk.type) {
            case 'melee':      return 25;
            case 'projectile': return 35;
            case 'explosion':  return 60;
            case 'beam':       return 8;
            default:           return 10;
        }
    }

    /**
     * Derive DAMAGE_TYPES string from the hitbox type.
     * @private
     */
    _resolveDamageType(atk) {
        // DamageSystem.js (parallel work) defines these constants.
        // We return the string keys it expects.
        switch (atk.type) {
            case 'melee':      return 'MELEE';
            case 'projectile': return 'PROJECTILE';
            case 'explosion':  return 'EXPLOSIVE';
            case 'beam':       return 'BEAM';
            default:           return 'GENERIC';
        }
    }
}
