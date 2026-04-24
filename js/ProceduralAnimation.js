import * as THREE from 'three';

/**
 * ProceduralAnimation - Subtle life-like enhancements for the player mesh.
 *
 * Features:
 *   - Head tracking (movement dir / checkpoints / hazards)
 *   - Breathing torso scale when idle
 *   - Shoulder sway into turns
 *   - Landing compression spring
 *   - Velocity lean (sprint / slide)
 *
 * All effects are deliberately subtle (few degrees / few percent scale).
 *
 * API:
 *   new ProceduralAnimation(scene, player, world)
 *   .update(dt)
 *   .dispose()
 */
export class ProceduralAnimation {
    constructor(scene, player, world) {
        this.scene = scene;
        this.player = player;
        this.world = world;

        // Cached mesh references
        this.mesh = player.mesh;
        this.torso = this.findMesh('CylinderGeometry', 0.85);
        this.head = this.findMesh('SphereGeometry', 1.4);
        this.leftArm = player.leftArm;
        this.rightArm = player.rightArm;

        // Internal state
        this.prevGrounded = true;
        this.prevRotY = 0;
        this.turnRate = 0;
        this.landingSpring = 0;
        this.breathPhase = Math.random() * Math.PI * 2;

        // Target caches
        this.checkpoints = [];
        this.hazardRefs = [];
        this.scanCheckpoints();
        this.scanHazards();
    }

    /* -------------------------------------------------------------
       Setup helpers
       ------------------------------------------------------------- */
    findMesh(geoType, expectedY) {
        for (const c of this.mesh.children) {
            if (c.geometry && c.geometry.type === geoType && Math.abs(c.position.y - expectedY) < 0.1) {
                return c;
            }
        }
        return null;
    }

    scanCheckpoints() {
        this.scene.traverse((obj) => {
            if (obj.isMesh && obj.geometry && obj.geometry.type === 'TorusGeometry') {
                this.checkpoints.push(obj);
            }
        });
    }

    scanHazards() {
        const h = this.world.hazards;
        for (const l of h.lasers) {
            this.hazardRefs.push({ getPos: () => new THREE.Vector3(l.x, l.y, l.z) });
        }
        for (const wb of h.wreckingBalls) {
            this.hazardRefs.push({
                getPos: () => {
                    const p = new THREE.Vector3();
                    wb.ball.getWorldPosition(p);
                    return p;
                },
            });
        }
        for (const s of h.spinners) {
            this.hazardRefs.push({ getPos: () => new THREE.Vector3(s.x, s.y, s.z) });
        }
        for (const f of h.fans) {
            this.hazardRefs.push({ getPos: () => new THREE.Vector3(f.x, 2, f.z) });
        }
    }

    /* -------------------------------------------------------------
       Main update
       ------------------------------------------------------------- */
    update(dt) {
        const p = this.player;
        const mesh = this.mesh;

        // ---- Turn rate (used for shoulder sway & lateral lean) ----
        let dRot = mesh.rotation.y - this.prevRotY;
        while (dRot > Math.PI) dRot -= Math.PI * 2;
        while (dRot < -Math.PI) dRot += Math.PI * 2;
        this.turnRate = THREE.MathUtils.lerp(this.turnRate, dRot / Math.max(dt, 0.001), dt * 5);
        this.prevRotY = mesh.rotation.y;

        // ---- Landing compression ----
        const justLanded = p.grounded && !this.prevGrounded && p.velocity.y < -2;
        if (justLanded) this.landingSpring = -1.0;
        this.prevGrounded = p.grounded;

        let squash = 0;
        if (this.landingSpring !== 0) {
            this.landingSpring += dt * 10;
            squash = Math.sin(this.landingSpring * Math.PI) * 0.05; // 5% peak
            if (this.landingSpring >= 1.0) {
                this.landingSpring = 0;
                squash = 0;
            }
        }

        // ---- Breathing ----
        let breath = 0;
        if (p.state === 'IDLE' || p.state === 'CROUCH') {
            this.breathPhase += dt * 1.5;
            breath = Math.sin(this.breathPhase) * 0.005; // 0.5%
        }

        // Apply torso scale (mesh.scale from crouch is independent)
        if (this.torso) {
            const ty = 1.0 + breath + squash;
            const txz = 1.0 - breath * 0.5 - squash * 0.3;
            this.torso.scale.y = THREE.MathUtils.lerp(this.torso.scale.y, ty, dt * 12);
            this.torso.scale.x = THREE.MathUtils.lerp(this.torso.scale.x, txz, dt * 12);
            this.torso.scale.z = THREE.MathUtils.lerp(this.torso.scale.z, txz, dt * 12);
        }

        // ---- Velocity lean ----
        const speed = Math.sqrt(p.velocity.x ** 2 + p.velocity.z ** 2);
        let targetLeanX = 0;
        let targetLeanZ = 0;

        if (p.state === 'SPRINT' || p.state === 'WALK') {
            targetLeanX = Math.min(speed / p.SPEED_SPRINT, 1.0) * 0.12; // ~7 deg
        } else if (p.state === 'SLIDE') {
            targetLeanX = 0.15; // ~8.5 deg
        } else if (p.state === 'ROLL') {
            targetLeanX = 0.22;
        }
        targetLeanZ = -this.turnRate * 0.05;

        if (p.state !== 'RAGDOLL') {
            mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, targetLeanX, dt * 6);
            mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, targetLeanZ, dt * 6);
        }

        // ---- Head & shoulders ----
        this.updateHead(dt, speed);
        this.updateShoulderSway(dt);
    }

    /* -------------------------------------------------------------
       Head tracking
       ------------------------------------------------------------- */
    updateHead(dt, speed) {
        if (!this.head) return;

        const p = this.player;
        let targetYaw = 0;
        let targetPitch = 0;
        let weight = 0;

        if (speed > 0.5 && p.grounded) {
            // Look toward movement direction
            const v = new THREE.Vector3(p.velocity.x, 0, p.velocity.z).normalize();
            const fwd = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
            targetYaw = Math.atan2(fwd.x * v.z - fwd.z * v.x, fwd.x * v.x + fwd.z * v.z);
            weight = Math.min(speed / p.SPEED_SPRINT, 1.0) * 0.25;
        } else if (p.state === 'IDLE' || p.state === 'CROUCH') {
            const nearestCp = this.getNearestCheckpoint();
            const nearestHz = this.getNearestHazard();
            const cpDist = nearestCp ? p.position.distanceTo(nearestCp) : Infinity;
            const hzDist = nearestHz ? p.position.distanceTo(nearestHz) : Infinity;

            if (hzDist < 8 && hzDist < cpDist) {
                const dir = new THREE.Vector3().subVectors(nearestHz, p.position).normalize();
                const fwd = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
                targetYaw = Math.atan2(fwd.x * dir.z - fwd.z * dir.x, fwd.x * dir.x + fwd.z * dir.z);
                targetPitch = -Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
                weight = 1.0 - THREE.MathUtils.clamp(hzDist / 8, 0, 1);
            } else if (cpDist < 15) {
                const dir = new THREE.Vector3().subVectors(nearestCp, p.position).normalize();
                const fwd = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
                targetYaw = Math.atan2(fwd.x * dir.z - fwd.z * dir.x, fwd.x * dir.x + fwd.z * dir.z);
                targetPitch = -Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
                weight = 0.3 * (1.0 - THREE.MathUtils.clamp(cpDist / 15, 0, 1));
            }
        }

        if (weight > 0.01) {
            this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, targetYaw * weight, dt * 4);
            this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, targetPitch * weight, dt * 4);
        } else {
            this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, 0, dt * 3);
            this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0, dt * 3);
        }
    }

    getNearestCheckpoint() {
        let best = null;
        let bestD = Infinity;
        for (const cp of this.checkpoints) {
            const d = this.player.position.distanceToSquared(cp.position);
            if (d < bestD) {
                bestD = d;
                best = cp.position;
            }
        }
        return best;
    }

    getNearestHazard() {
        let best = null;
        let bestD = Infinity;
        for (const h of this.hazardRefs) {
            const pos = h.getPos();
            const d = this.player.position.distanceToSquared(pos);
            if (d < bestD) {
                bestD = d;
                best = pos;
            }
        }
        return best;
    }

    /* -------------------------------------------------------------
       Shoulder sway
       ------------------------------------------------------------- */
    updateShoulderSway(dt) {
        const sway = THREE.MathUtils.clamp(-this.turnRate * 0.25, -0.12, 0.12);

        if (this.leftArm && !this.leftArm.userData.handIKActive) {
            this.leftArm.rotation.z = THREE.MathUtils.lerp(this.leftArm.rotation.z, sway, dt * 5);
        }
        if (this.rightArm && !this.rightArm.userData.handIKActive) {
            this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, -sway, dt * 5);
        }
    }

    dispose() {
        // No GPU resources owned by this class
    }
}
