/**
 * AirDodgeSystem — quick aerial dash with invincibility frames.
 * Double-tap a direction in mid-air (or press dodge key) to zip 3m with i-frames.
 * Costs 15 stamina. Integrates with StaminaSystem.
 */

import * as THREE from 'three';

export class AirDodgeSystem {
    constructor(player, staminaSystem) {
        this.player = player;
        this.staminaSystem = staminaSystem;
        this.cost = 15;
        this.dashDistance = 3.5;
        this.dashDuration = 0.15;
        this.cooldown = 0;
        this.cooldownTime = 0.4;
        this.isDodging = false;
        this.dodgeTimer = 0;
        this._iFrameTimer = 0;
        this._lastTapTime = 0;
        this._lastTapKey = null;
        this._tapWindow = 0.2;
    }

    update(dt, input) {
        if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isDodging) {
            this.dodgeTimer -= dt;
            this._iFrameTimer -= dt;
            if (this.dodgeTimer <= 0) {
                this.isDodging = false;
                this.player.isInvincible = this._iFrameTimer > 0;
            }
        }
        if (this._iFrameTimer > 0) {
            this._iFrameTimer -= dt;
            if (this._iFrameTimer <= 0) this.player.isInvincible = false;
        }

        // Detect double-tap on WASD while airborne
        if (!this.player.grounded && input) {
            const dirs = [
                { key: 'KeyW', dir: new THREE.Vector3(0, 0, 1) },
                { key: 'KeyS', dir: new THREE.Vector3(0, 0, -1) },
                { key: 'KeyA', dir: new THREE.Vector3(-1, 0, 0) },
                { key: 'KeyD', dir: new THREE.Vector3(1, 0, 0) },
            ];
            for (const d of dirs) {
                if (input.wasPressed(d.key)) {
                    const now = performance.now() / 1000;
                    if (this._lastTapKey === d.key && (now - this._lastTapTime) < this._tapWindow) {
                        this.tryDodge(d.dir);
                    }
                    this._lastTapTime = now;
                    this._lastTapKey = d.key;
                }
            }
        }
    }

    tryDodge(direction) {
        if (this.cooldown > 0 || this.isDodging || this.player.grounded) return false;
        if (this.staminaSystem && this.staminaSystem.stamina < this.cost) return false;

        if (this.staminaSystem) this.staminaSystem.stamina -= this.cost;
        this.isDodging = true;
        this.dodgeTimer = this.dashDuration;
        this._iFrameTimer = 0.25;
        this.cooldown = this.cooldownTime;
        this.player.isInvincible = true;

        const yaw = this.player.facing || 0;
        const worldDir = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        worldDir.normalize();

        const speed = this.dashDistance / this.dashDuration;
        this.player.velocity.x = worldDir.x * speed;
        this.player.velocity.z = worldDir.z * speed;
        // Slight upward preservation
        this.player.velocity.y = Math.max(this.player.velocity.y, 0);

        if (this.player.onAirDodge) this.player.onAirDodge();
        return true;
    }

    reset() {
        this.isDodging = false;
        this.dodgeTimer = 0;
        this._iFrameTimer = 0;
        this.cooldown = 0;
        this.player.isInvincible = false;
    }
}
