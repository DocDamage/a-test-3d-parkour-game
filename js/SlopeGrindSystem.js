import * as THREE from 'three';

/**
 * SlopeGrindSystem — hold C on steep ramps to surf down at high speed.
 */

export class SlopeGrindSystem {
    constructor(player, particleEffects = null) {
        this.player = player;
        this.particles = particleEffects;
        this.minSlopeAngle = 30 * (Math.PI / 180); // 30 degrees
        this.grindAccel = 15;
        this.maxGrindSpeed = 20;
        this._isGrinding = false;
        this._grindSpeed = 0;
        this._sparkTimer = 0;
        this._slopeNormal = new THREE.Vector3(0, 1, 0);
    }

    update(dt, input) {
        if (!this.player || this.player.isDead) return;

        const p = this.player;
        const crouch = input.isPressed('KeyC');

        if (this._isGrinding) {
            const slope = this._getSlopeAngle();
            if (!crouch || slope < this.minSlopeAngle || p.grounded === false) {
                this._stopGrind();
                return;
            }

            this._grindSpeed = Math.min(this.maxGrindSpeed, this._grindSpeed + this.grindAccel * dt);
            const downDir = this._getSlopeDownDirection();
            p.velocity.x = downDir.x * this._grindSpeed;
            p.velocity.z = downDir.z * this._grindSpeed;

            // Launch off ramp ends: if no ground ahead, keep momentum and transition to jump
            if (!this._hasGroundAhead(downDir)) {
                p.state = 'JUMP';
                p.velocity.y = Math.max(p.velocity.y, 4);
                this._stopGrind();
                return;
            }

            // Sparks
            this._sparkTimer -= dt;
            if (this._sparkTimer <= 0) {
                this._spawnSparks(p.position);
                this._sparkTimer = 0.05;
            }

            p.state = 'GRIND';
            return;
        }

        // Start grinding
        if (crouch && p.grounded &&
            p.state !== 'SLIDE' && p.state !== 'CROUCH' &&
            p.state !== 'ROLL' && p.state !== 'STUMBLE' && p.state !== 'RAGDOLL') {
            const slope = this._getSlopeAngle();
            if (slope >= this.minSlopeAngle) {
                this._isGrinding = true;
                this._grindSpeed = Math.sqrt(p.velocity.x ** 2 + p.velocity.z ** 2);
                if (window.__DEV__) console.log('[Grind] started');
            }
        }
    }

    _getSlopeAngle() {
        const normal = this._getSlopeNormal();
        if (!normal) return 0;
        const angle = Math.acos(Math.max(-1, Math.min(1, normal.y)));
        return angle;
    }

    _getSlopeNormal() {
        const p = this.player;
        if (!p.world || !p.world.collidables) return null;
        const pos = p.position;
        const below = pos.clone(); below.y -= 0.1;
        for (const mesh of p.world.collidables) {
            if (!mesh) continue;
            const box = mesh.userData.bbox || new THREE.Box3().setFromObject(mesh);
            if (box.containsPoint(below) || box.containsPoint(pos)) {
                const normal = new THREE.Vector3(0, 1, 0);
                normal.applyEuler(mesh.rotation);
                this._slopeNormal.copy(normal);
                return this._slopeNormal;
            }
        }
        return null;
    }

    _getSlopeDownDirection() {
        const p = this.player;
        const normal = this._getSlopeNormal();
        if (!normal) {
            return new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing)).normalize();
        }
        const gravity = new THREE.Vector3(0, -1, 0);
        const dot = gravity.dot(normal);
        const downDir = gravity.clone().sub(normal.clone().multiplyScalar(dot)).normalize();
        const facing = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
        return downDir.multiplyScalar(0.8).add(facing.multiplyScalar(0.2)).normalize();
    }

    _hasGroundAhead(downDir) {
        const p = this.player;
        if (!p.world || !p.world.collidables) return true;
        const ahead = p.position.clone().add(downDir.clone().multiplyScalar(0.5));
        ahead.y -= 0.3;
        for (const mesh of p.world.collidables) {
            if (!mesh) continue;
            const box = mesh.userData.bbox || new THREE.Box3().setFromObject(mesh);
            if (box.containsPoint(ahead)) return true;
        }
        return false;
    }

    _spawnSparks(pos) {
        if (this.particles && typeof this.particles.sparks === 'function') {
            this.particles.sparks(pos, 0xffaa00, 3);
        } else {
            console.log('[Grind] sparks at', pos.x.toFixed(1), pos.y.toFixed(1), pos.z.toFixed(1));
        }
    }

    _stopGrind() {
        this._isGrinding = false;
        if (window.__DEV__) console.log('[Grind] stopped');
    }

    isGrinding() {
        return this._isGrinding;
    }

    reset() {
        this._stopGrind();
    }
}
