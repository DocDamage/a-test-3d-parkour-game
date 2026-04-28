import * as THREE from 'three';

/**
 * SlideJumpSystem — press Space mid-slide to launch forward at high speed.
 */

export class SlideJumpSystem {
    constructor(player) {
        this.player = player;
        this.horizontalBoost = 1.4;
        this.verticalBoost = 0.9;
        this._wasSpace = false;
        this._slideJumpDuration = 0.1;
    }

    update(dt, input) {
        if (!this.player || this.player.isDead) return;
        const space = input.isPressed('Space');
        if (space && !this._wasSpace && this.player.state === 'SLIDE') {
            this._performSlideJump();
        }
        this._wasSpace = space;
    }

    _performSlideJump() {
        const p = this.player;
        const facingDir = new THREE.Vector3(
            Math.sin(p.facing), 0, Math.cos(p.facing)
        ).normalize();

        p.velocity.x = facingDir.x * p.SPEED_SPRINT * this.horizontalBoost;
        p.velocity.z = facingDir.z * p.SPEED_SPRINT * this.horizontalBoost;
        p.velocity.y = p.JUMP_FORCE * this.verticalBoost;

        p.state = 'SLIDE_JUMP';
        p._slideJumpTimer = this._slideJumpDuration;
        p._isSlideJumping = true;

        if (window.__DEV__) console.log('[SlideJump] launched');
    }

    reset() {
        this._wasSpace = false;
    }
}
