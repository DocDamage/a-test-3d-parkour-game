import * as THREE from 'three';

/**
 * GrapplingHook provides aim, swing, and retract mechanics.
 * Hold Mouse2 to aim; release to fire. Swing is physics-based pendulum motion.
 */
export class GrapplingHook {
    constructor(scene, player, world) {
        this.scene = scene;
        this.player = player;
        this.world = world;
        
        this.MAX_RANGE = 20;
        this.COOLDOWN = 0.5;
        
        this.state = 'IDLE'; // IDLE | AIM | SWING | RETRACT
        this.anchorPoint = null;
        this.cableLength = 0;
        this.cooldownTimer = 0;
        
        this.aimDirection = new THREE.Vector3();
        this.aimTarget = new THREE.Vector3();
        this.aimValid = false;
        
        // Cable visual
        this.cableLine = this._createCable();
        this.cableVisible = false;
        
        // Swing physics data
        this.swingPlaneNormal = new THREE.Vector3(0, 1, 0);

        /**
         * When true (set by KeyItemSystem until the grappling_hook item is
         * found in the Underground Tunnel dungeon), the hook cannot be used.
         */
        this.locked = false;
    }
    
    _createCable() {
        const geo = new THREE.BufferGeometry();
        const mat = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.85
        });
        const line = new THREE.Line(geo, mat);
        line.frustumCulled = false;
        this.scene.add(line);
        return line;
    }
    
    /**
     * Main update called from Player while in a grapple-related state.
     */
    update(dt, input, cameraYaw) {
        this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
        
        // Aim direction follows camera yaw with slight upward bias
        this.aimDirection.set(Math.sin(cameraYaw), 0.25, Math.cos(cameraYaw)).normalize();
        
        switch (this.state) {
            case 'AIM':
                this._updateAim(dt);
                break;
            case 'SWING':
                this._updateSwing(dt, input);
                break;
            case 'RETRACT':
                this._updateRetract(dt, input);
                break;
            default:
                this._hideCable();
                break;
        }
    }
    
    _updateAim(dt) {
        this._findAnchor();
        const handPos = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const color = this.aimValid ? 0x00ff00 : 0xff0000;
        this._updateCableVisual(handPos, this.aimTarget, color);
    }
    
    _findAnchor() {
        const origin = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const ray = new THREE.Ray(origin, this.aimDirection);
        
        this.aimValid = false;
        this.aimTarget.copy(origin).add(this.aimDirection.clone().multiplyScalar(this.MAX_RANGE));
        
        let bestDist = this.MAX_RANGE;
        let bestPoint = null;
        
        // Check world collidables for ceiling beams / high walls
        for (const obj of this.world.collidables) {
            const box = new THREE.Box3().setFromObject(obj);
            const hit = new THREE.Vector3();
            if (ray.intersectBox(box, hit) !== null) {
                const dist = origin.distanceTo(hit);
                if (dist < bestDist && dist <= this.MAX_RANGE) {
                    // Valid anchors must be above the player or on a high wall face
                    if (hit.y > this.player.position.y + 0.8) {
                        bestDist = dist;
                        bestPoint = hit;
                    }
                }
            }
        }
        
        // Also check dedicated grapple points if World exposes them
        if (this.world.grapplePoints) {
            for (const gp of this.world.grapplePoints) {
                const dist = origin.distanceTo(gp);
                if (dist < bestDist && dist <= this.MAX_RANGE) {
                    bestDist = dist;
                    bestPoint = gp;
                }
            }
        }
        
        if (bestPoint) {
            this.aimValid = true;
            this.aimTarget.copy(bestPoint);
        }
    }
    
    _updateSwing(dt, input) {
        if (!this.anchorPoint) {
            this._release();
            return;
        }
        
        const handPos = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const toAnchor = new THREE.Vector3().subVectors(this.anchorPoint, handPos);
        const currentDist = toAnchor.length();
        const dir = toAnchor.normalize();
        
        // Enforce cable length constraint (soft spring)
        if (currentDist > this.cableLength) {
            const overshoot = currentDist - this.cableLength;
            // Pull player toward anchor to relieve tension
            this.player.position.add(dir.clone().multiplyScalar(overshoot * 0.6));
            
            // Dampen velocity along cable direction
            const velDot = this.player.velocity.dot(dir);
            if (velDot > 0) {
                this.player.velocity.sub(dir.clone().multiplyScalar(velDot * 0.85));
            }
        }
        
        // Pendulum swing force: gravity accelerates perpendicular to cable
        const gravity = new THREE.Vector3(0, this.player.GRAVITY || -28, 0);
        const tensionDir = new THREE.Vector3().subVectors(this.anchorPoint, handPos).normalize();
        
        // Tangential component of gravity
        const gravDotTension = gravity.dot(tensionDir);
        const tangentialGravity = gravity.clone().sub(tensionDir.clone().multiplyScalar(gravDotTension));
        this.player.velocity.add(tangentialGravity.multiplyScalar(dt));
        
        // Air control while swinging (subtle)
        const moveDir = this.player.getMoveDir ? this.player.getMoveDir(input, this.player.facing) : new THREE.Vector3();
        this.player.velocity.x += moveDir.x * 2.5 * dt;
        this.player.velocity.z += moveDir.z * 2.5 * dt;
        
        // Release conditions
        if (input.isPressed('Space') || currentDist < this.cableLength * 0.25) {
            // Launch on release: preserve tangential velocity, add small boost
            const releaseBoost = 1.15;
            this.player.velocity.x *= releaseBoost;
            this.player.velocity.z *= releaseBoost;
            this.player.velocity.y = Math.max(this.player.velocity.y, 3);
            this._release();
            return;
        }
        
        this._updateCableVisual(handPos, this.anchorPoint, 0x00ffff);
    }
    
    _updateRetract(dt, input) {
        if (!this.anchorPoint) {
            this._release();
            return;
        }
        
        const handPos = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const toAnchor = new THREE.Vector3().subVectors(this.anchorPoint, handPos);
        const currentDist = toAnchor.length();
        const dir = toAnchor.normalize();
        
        // Constant retract speed toward anchor
        const retractSpeed = 14;
        this.player.velocity.copy(dir.multiplyScalar(retractSpeed));
        
        if (currentDist < 0.6) {
            // Reached anchor: launch forward in facing direction
            const launchDir = new THREE.Vector3(
                Math.sin(this.player.facing),
                0.35,
                Math.cos(this.player.facing)
            ).normalize();
            this.player.velocity.copy(launchDir.multiplyScalar(12));
            this.player.state = 'JUMP';
            this._release();
            return;
        }
        
        this._updateCableVisual(handPos, this.anchorPoint, 0x00ffff);
    }
    
    _updateCableVisual(start, end, colorHex) {
        const positions = new Float32Array([
            start.x, start.y, start.z,
            end.x, end.y, end.z
        ]);
        this.cableLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.cableLine.material.color.setHex(colorHex);
        this.cableLine.visible = true;
        this.cableVisible = true;
    }
    
    _hideCable() {
        if (this.cableVisible) {
            this.cableLine.visible = false;
            this.cableVisible = false;
        }
    }
    
    /** Attempt to enter aim mode. Returns false if on cooldown or locked. */
    startAim() {
        if (this.locked) return false;
        if (this.cooldownTimer > 0) return false;
        this.state = 'AIM';
        return true;
    }
    
    /** Fire the grapple (release Mouse2 while aiming). */
    fire() {
        if (this.state !== 'AIM') return;
        if (!this.aimValid) {
            this.state = 'IDLE';
            return;
        }
        
        this.anchorPoint = this.aimTarget.clone();
        const handPos = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        this.cableLength = handPos.distanceTo(this.anchorPoint);
        
        const toAnchor = new THREE.Vector3().subVectors(this.anchorPoint, handPos).normalize();
        const upDot = toAnchor.dot(new THREE.Vector3(0, 1, 0));
        
        // Mostly above player => retract / pull-up; otherwise swing
        if (upDot > 0.55) {
            this.state = 'RETRACT';
        } else {
            this.state = 'SWING';
            // Define swing plane from aim direction crossed with world up
            this.swingPlaneNormal.copy(
                new THREE.Vector3().crossVectors(this.aimDirection, new THREE.Vector3(0, 1, 0)).normalize()
            );
        }
    }
    
    _release() {
        this.state = 'IDLE';
        this.anchorPoint = null;
        this.cooldownTimer = this.COOLDOWN;
        this._hideCable();
    }
    
    isActive() {
        return this.state === 'SWING' || this.state === 'RETRACT';
    }
    
    isAiming() {
        return this.state === 'AIM';
    }
    
    getAimTarget() {
        return this.aimValid ? this.aimTarget : null;
    }
    
    getAimValid() {
        return this.aimValid;
    }

    /**
     * Grapple Pull: if aiming at an enemy, yank them toward player.
     * Returns true if an enemy was pulled.
     */
    pullEnemy() {
        if (this.state !== 'AIM') return null;
        const origin = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const ray = new THREE.Ray(origin, this.aimDirection);

        const drones = this.world?.drones?.drones || [];
        let bestEnemy = null;
        let bestDist = this.MAX_RANGE;

        for (const drone of drones) {
            if (drone.isDead || drone.team === 'player') continue;
            const pos = drone.position || (drone.mesh && drone.mesh.position);
            if (!pos) continue;
            const dist = origin.distanceTo(pos);
            if (dist > this.MAX_RANGE) continue;
            // Check if enemy is roughly in aim direction
            const toEnemy = pos.clone().sub(origin).normalize();
            if (toEnemy.dot(this.aimDirection) > 0.85) {
                if (dist < bestDist) {
                    bestDist = dist;
                    bestEnemy = drone;
                }
            }
        }

        if (!bestEnemy) return null;

        // Yank enemy toward player
        const ePos = bestEnemy.position || (bestEnemy.mesh && bestEnemy.mesh.position);
        if (!ePos) return null;

        const pullDir = origin.clone().sub(ePos).normalize();
        const pullForce = 15;

        // Animate pull
        let t = 0;
        const startPos = ePos.clone();
        const endPos = origin.clone().add(pullDir.clone().multiplyScalar(1.5));
        const anim = () => {
            t += 0.05;
            if (t >= 1) {
                ePos.copy(endPos);
                if (bestEnemy.takeDamage) bestEnemy.takeDamage(20, 'kinetic', this.player);
                return;
            }
            const frac = 1 - Math.pow(1 - t, 2); // ease out
            ePos.lerpVectors(startPos, endPos, frac);
            requestAnimationFrame(anim);
        };
        anim();

        this.state = 'IDLE';
        this.cooldownTimer = this.COOLDOWN;
        this._hideCable();
        return bestEnemy;
    }

    dispose() {
        this.scene.remove(this.cableLine);
        this.cableLine.geometry.dispose();
        this.cableLine.material.dispose();
    }
}
