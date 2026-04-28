import * as THREE from 'three';

/**
 * WallKickSystem — double-tap Space against a wall to kick off at a sharp angle.
 * Supports up to 3 consecutive wall-kicks before stamina gate.
 */

export class WallKickSystem {
    constructor(player, staminaSystem = null) {
        this.player = player;
        this.stamina = staminaSystem;
        this.chainCount = 0;
        this.chainTimer = 0;
        this.maxChain = 3;
        this.chainWindow = 0.6; // seconds to chain
        this.kickBoost = 1.3;   // vertical boost multiplier
        this.kickHorizontal = 8;
        this.kickVertical = 7;
        this.staminaCost = 8;
        this._wasSpacePressed = false;
        this._spaceTapCount = 0;
        this._tapWindow = 0.25;
        this._tapTimer = 0;
        this._lastWallNormal = new THREE.Vector3();
        this._wallKickStateDuration = 0.15;
    }

    update(dt, input) {
        if (!this.player || this.player.isDead) return;

        // Decay chain timer
        if (this.chainTimer > 0) {
            this.chainTimer -= dt;
            if (this.chainTimer <= 0) {
                this.chainCount = 0;
            }
        }

        // Track double-tap Space using edge detection on isPressed
        const spacePressed = input.isPressed('Space');
        if (spacePressed && !this._wasSpacePressed) {
            this._spaceTapCount++;
            this._tapTimer = this._tapWindow;
        }
        if (this._tapTimer > 0) {
            this._tapTimer -= dt;
            if (this._tapTimer <= 0) this._spaceTapCount = 0;
        }
        this._wasSpacePressed = spacePressed;

        // Detect wall collision while airborne
        if (this.player.grounded) {
            this.chainCount = 0; // reset on ground
            return;
        }

        if (this._spaceTapCount >= 2 && this._canWallKick()) {
            this._performWallKick();
            this._spaceTapCount = 0;
        }
    }

    _canWallKick() {
        if (this.chainCount >= this.maxChain) {
            // Stamina gate after max chain
            if (this.stamina && this.stamina.canSpend(this.staminaCost * 2)) {
                return this._detectWallContact();
            }
            return false;
        }
        if (this.stamina && !this.stamina.canSpend(this.staminaCost)) {
            return false;
        }
        return this._detectWallContact();
    }

    _detectWallContact() {
        const p = this.player;
        if (!p.world || !p.world.collidables) return false;
        const pos = p.position;
        const radius = p.RADIUS || 0.35;
        for (const mesh of p.world.collidables) {
            if (!mesh || mesh.userData._isCollectible) continue;
            const box = mesh.userData.bbox || new THREE.Box3().setFromObject(mesh);
            const closest = box.clampPoint(pos, new THREE.Vector3());
            const dist = pos.distanceTo(closest);
            if (dist < radius + 0.2 && dist > 0.01) {
                const normal = pos.clone().sub(closest).normalize();
                // Must be roughly horizontal wall, not floor/ceiling
                if (Math.abs(normal.y) < 0.7) {
                    this._lastWallNormal.copy(normal);
                    return true;
                }
            }
        }
        return false;
    }

    _performWallKick() {
        const p = this.player;
        if (this.stamina) {
            const cost = this.chainCount >= this.maxChain ? this.staminaCost * 2 : this.staminaCost;
            this.stamina.spend(cost);
        }

        const normal = this._lastWallNormal.clone();
        // Kick away from wall with upward bias
        const kickDir = normal.clone().multiplyScalar(this.kickHorizontal);
        kickDir.y = this.kickVertical;

        p.velocity.x = kickDir.x;
        p.velocity.z = kickDir.z;
        p.velocity.y = kickDir.y * this.kickBoost;

        p.state = 'WALLKICK';
        p._wallKickTimer = this._wallKickStateDuration;

        this.chainCount++;
        this.chainTimer = this.chainWindow;

        if (window.__DEV__) console.log('[WallKick] chain', this.chainCount);
    }

    reset() {
        this.chainCount = 0;
        this.chainTimer = 0;
        this._spaceTapCount = 0;
        this._tapTimer = 0;
        this._wasSpacePressed = false;
    }
}
