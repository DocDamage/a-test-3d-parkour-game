import * as THREE from 'three';

/**
 * MantleSystem — auto-pull-up onto ledges that are too high for vault but within reach.
 * Triggered from Player.js collision logic when upper body grazes the top edge of a climbable.
 */

export class MantleSystem {
    constructor(player) {
        this.player = player;
        this.mantleDuration = 0.4;
        this._mantleTimer = 0;
        this._isMantling = false;
        this._targetY = 0;
    }

    update(dt, input) {
        if (!this.player || this.player.isDead) return;

        if (this._isMantling) {
            this._mantleTimer -= dt;
            const t = 1 - (this._mantleTimer / this.mantleDuration);
            if (t <= 1) {
                this.player.position.y = THREE.MathUtils.lerp(
                    this.player.position.y,
                    this._targetY,
                    Math.min(1, t * 3)
                );
            }
            if (this._mantleTimer <= 0) {
                this._isMantling = false;
                this.player.grounded = true;
                this.player.velocity.set(0, 0, 0);
                this.player.isInvincible = false;
            }
        }
    }

    checkMantleTrigger(obj, box, playerMin, playerMax) {
        const p = this.player;
        if (p.grounded) return false;
        if (p.state === 'MANTLE') return false;
        if (!p.world || !p.world.climbables) return false;
        if (!p.world.climbables.includes(obj)) return false;

        const wallTop = box.max.y;
        const playerFeet = p.position.y;
        const wallHeightFromFeet = wallTop - playerFeet;

        // Too high for vault, but within climb reach
        if (wallHeightFromFeet <= p.VAULT_HEIGHT) return false;
        if (wallHeightFromFeet > p.CLIMB_HEIGHT) return false;

        // Upper body near top edge
        const playerTop = playerMax.y;
        const nearTop = playerTop >= wallTop - 0.5 && playerTop <= wallTop + 0.3;
        if (!nearTop) return false;

        // Must be horizontal collision (side hit)
        const penX = Math.min(playerMax.x - box.min.x, box.max.x - playerMin.x);
        const penZ = Math.min(playerMax.z - box.min.z, box.max.z - playerMin.z);
        const penY = Math.min(playerMax.y - box.min.y, box.max.y - playerMin.y);
        const minPen = Math.min(penX, penY, penZ);

        return minPen === penX || minPen === penZ;
    }

    startMantle(targetY) {
        this._isMantling = true;
        this._mantleTimer = this.mantleDuration;
        this._targetY = targetY + 0.05;
        this.player.state = 'MANTLE';
        this.player.velocity.set(0, 0, 0);
        this.player.isInvincible = true;
        if (window.__DEV__) console.log('[Mantle] pulling up to', targetY.toFixed(2));
    }

    isMantling() {
        return this._isMantling;
    }

    reset() {
        this._isMantling = false;
        this._mantleTimer = 0;
    }
}
