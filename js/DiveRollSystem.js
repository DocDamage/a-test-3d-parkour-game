/**
 * DiveRollSystem — sprint + crouch in air = dive toward ground.
 * On landing, automatically rolls and damages enemies in the landing path.
 * Integrates with StaminaSystem.
 */

import * as THREE from 'three';

export class DiveRollSystem {
    constructor(player, staminaSystem = null) {
        this.player = player;
        this.staminaSystem = staminaSystem;
        this.isDiving = false;
        this.diveSpeed = 14;
        this.diveAngle = -0.6; // downward radians
        this.damage = 30;
        this.knockbackRadius = 2.5;
        this.staminaCost = 10;
        this._diveDir = new THREE.Vector3();
        this._hasLanded = false;
    }

    update(dt, input) {
        if (this.isDiving) {
            // Maintain dive trajectory
            if (!this.player.grounded) {
                this.player.velocity.x = this._diveDir.x * this.diveSpeed;
                this.player.velocity.z = this._diveDir.z * this.diveSpeed;
                this.player.velocity.y = Math.max(this.player.velocity.y, -12);
            } else if (!this._hasLanded) {
                this._hasLanded = true;
                this._onLandImpact();
            }
        }

        // Auto-end dive after roll completes
        if (this.player.grounded && this._hasLanded && this.player.state !== 'ROLL') {
            this.isDiving = false;
            this._hasLanded = false;
        }

        // Input detection: sprint + crouch while airborne
        if (input && input.wasPressed('KeyC') && !this.player.grounded && !this.isDiving) {
            const isSprinting = input.isPressed('ShiftLeft') || (this.player.state === 'SPRINT');
            if (isSprinting) this.tryDive();
        }
    }

    tryDive() {
        if (this.player.grounded || this.isDiving) return false;
        if (this.staminaSystem && this.staminaSystem.stamina < this.staminaCost) return false;
        if (this.staminaSystem) this.staminaSystem.stamina -= this.staminaCost;

        this.isDiving = true;
        this._hasLanded = false;
        const yaw = this.player.facing || 0;
        this._diveDir.set(Math.sin(yaw), 0, Math.cos(yaw)).normalize();

        // Set initial dive velocity
        this.player.velocity.x = this._diveDir.x * this.diveSpeed;
        this.player.velocity.z = this._diveDir.z * this.diveSpeed;
        this.player.velocity.y = -4;

        if (this.player.onDiveStart) this.player.onDiveStart();
        return true;
    }

    _onLandImpact() {
        // Damage and knockback nearby enemies
        const pos = this.player.position.clone();
        pos.y += 0.5;
        if (this.player.onDiveLand) this.player.onDiveLand(pos, this.damage, this.knockbackRadius);
    }

    reset() {
        this.isDiving = false;
        this._hasLanded = false;
        this._diveDir.set(0, 0, 0);
    }
}
