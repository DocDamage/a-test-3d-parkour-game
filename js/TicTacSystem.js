/**
 * TicTacSystem — wall-to-wall jump chains.
 * Jump toward a wall, jump off at an angle, chain up to 3 walls.
 * Each wall gives a height boost. Integrates with WallKickSystem.
 */

export class TicTacSystem {
    constructor(player) {
        this.player = player;
        this.maxChain = 3;
        this.chainCount = 0;
        this.cooldown = 0;
        this.cooldownTime = 0.3;
        this.boostForce = 5;
        this.heightBoost = 4;
        this.sideForce = 4;
        this._lastWallNormal = null;
        this._chainTimer = 0;
        this._chainWindow = 1.0;
    }

    update(dt, input) {
        if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);
        if (this._chainTimer > 0) {
            this._chainTimer -= dt;
            if (this._chainTimer <= 0) {
                this.chainCount = 0;
                this._lastWallNormal = null;
            }
        }
    }

    /**
     * Attempt a tic-tac off a wall surface.
     * @param {THREE.Vector3} wallNormal - normal of the wall surface
     * @param {boolean} inputPressed - whether jump was pressed this frame
     * @returns {boolean} true if tic-tac was performed
     */
    tryTicTac(wallNormal, inputPressed) {
        if (!inputPressed || this.cooldown > 0) return false;
        if (!wallNormal) return false;

        // Prevent tic-tacking off the same wall twice
        if (this._lastWallNormal && wallNormal.dot(this._lastWallNormal) > 0.8) {
            return false;
        }

        if (this.chainCount >= this.maxChain) {
            this.chainCount = 0;
            this._lastWallNormal = null;
            return false;
        }

        this.chainCount++;
        this._lastWallNormal = wallNormal.clone();
        this._chainTimer = this._chainWindow;
        this.cooldown = this.cooldownTime;

        // Compute launch direction: reflect velocity across wall normal + upward boost
        const facing = new THREE.Vector3(
            Math.sin(this.player.facing || 0), 0, Math.cos(this.player.facing || 0)
        );
        // Project facing away from wall
        const dot = facing.dot(wallNormal);
        const projected = facing.clone().sub(wallNormal.clone().multiplyScalar(dot));
        projected.normalize();

        // Add lateral push perpendicular to wall normal for diagonal feel
        const lateral = new THREE.Vector3().crossVectors(wallNormal, new THREE.Vector3(0, 1, 0)).normalize();
        if (lateral.dot(projected) < 0) lateral.negate();

        const boostDir = new THREE.Vector3()
            .addScaledVector(projected, this.boostForce)
            .addScaledVector(lateral, this.sideForce * 0.5)
            .add(new THREE.Vector3(0, this.heightBoost / (1 + this.chainCount * 0.3), 0));

        this.player.velocity.x = boostDir.x;
        this.player.velocity.y = boostDir.y;
        this.player.velocity.z = boostDir.z;

        // Trigger callbacks
        if (this.player.onTicTac) this.player.onTicTac(this.chainCount);

        return true;
    }

    reset() {
        this.chainCount = 0;
        this._lastWallNormal = null;
        this._chainTimer = 0;
        this.cooldown = 0;
    }
}
