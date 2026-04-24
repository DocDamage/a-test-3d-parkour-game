import * as THREE from 'three';

/**
 * FootIK & HandIK - Inverse kinematics for the simple cylinder player mesh.
 *
 * Foot IK:
 *   - Short raycasts from each foot downward to find ground height + normal.
 *   - Smoothly interpolates leg Y and tilts the leg to match surface angle.
 *   - Only active while grounded and not in SLIDE / VAULT / RAGDOLL.
 *   - Combines with the walking swing animation already set by Player.updateVisuals.
 *
 * Hand IK:
 *   - When the player is within 0.5 m of a wall, rays cast forward from the
 *     shoulders rotate the arms to point at the hit point (bracing).
 *   - Completely overrides the walking arm animation while active.
 *
 * Performance:
 *   - 4 raycasts per frame max (2 feet + 2 hands), all limited to < 0.6 m.
 *   - Uses THREE.Raycaster against world.collidables (low-poly boxes/planes).
 *
 * API:
 *   new FootIK(scene, player, world)
 *   .update(dt)
 *   .dispose()
 */
export class FootIK {
    constructor(scene, player, world) {
        this.scene = scene;
        this.player = player;
        this.world = world;

        this.raycaster = new THREE.Raycaster();
        this._tmpVec = new THREE.Vector3();
        this._tmpQ = new THREE.Quaternion();
        this._tmpM = new THREE.Matrix4();

        // Cached limb references
        this.leftLeg = player.leftLeg;
        this.rightLeg = player.rightLeg;
        this.leftArm = player.leftArm;
        this.rightArm = player.rightArm;

        // Smoothing memory
        this.leftFootY = 0.38;
        this.rightFootY = 0.38;
    }

    /* -------------------------------------------------------------
       Raycast helpers
       ------------------------------------------------------------- */
    raycastDown(origin, maxDist = 0.6) {
        this.raycaster.set(origin, new THREE.Vector3(0, -1, 0));
        this.raycaster.near = 0.0;
        this.raycaster.far = maxDist;
        const hits = this.raycaster.intersectObjects(this.world.collidables, false);

        let best = null;
        let bestY = -Infinity;
        for (const hit of hits) {
            if (hit.point.y <= origin.y + 0.02 && hit.point.y > bestY) {
                bestY = hit.point.y;
                best = hit;
            }
        }
        return best;
    }

    raycastForward(origin, direction, maxDist = 0.6) {
        this.raycaster.set(origin, direction.normalize());
        this.raycaster.near = 0.05;
        this.raycaster.far = maxDist;
        const hits = this.raycaster.intersectObjects(this.world.collidables, false);
        return hits.length > 0 ? hits[0] : null;
    }

    /* -------------------------------------------------------------
       Quaternion helpers
       ------------------------------------------------------------- */

    /**
     * Build a rotation that aligns the leg's local Y axis with the ground normal
     * while keeping the foot pointing roughly forward (local +Z).
     */
    legRotationFromNormal(localNormal) {
        const yAxis = localNormal.clone().normalize();
        if (yAxis.y > 0.999) return new THREE.Quaternion(); // flat ground

        const zAxis = new THREE.Vector3(0, 0, 1);
        let xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
        if (xAxis.lengthSq() < 0.001) {
            xAxis.set(1, 0, 0);
        }
        const newZ = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();

        this._tmpM.makeBasis(xAxis, yAxis, newZ);
        return this._tmpQ.setFromRotationMatrix(this._tmpM);
    }

    /* -------------------------------------------------------------
       Main update
       ------------------------------------------------------------- */
    update(dt) {
        const p = this.player;
        const mesh = p.mesh;

        // -------- Foot IK --------
        const canDoFeet = p.grounded && !['SLIDE', 'VAULT', 'RAGDOLL'].includes(p.state);
        if (canDoFeet) {
            this.updateLeg(this.leftLeg, dt, true);
            this.updateLeg(this.rightLeg, dt, false);
        } else {
            // Smooth back to default local height
            this.leftFootY = THREE.MathUtils.lerp(this.leftFootY, 0.38, dt * 10);
            this.rightFootY = THREE.MathUtils.lerp(this.rightFootY, 0.38, dt * 10);
            this.leftLeg.position.y = this.leftFootY;
            this.rightLeg.position.y = this.rightFootY;

            // Reset tilt while keeping walking swing (handled next frame by Player)
            this.leftLeg.quaternion.set(0, 0, 0, 1);
            this.rightLeg.quaternion.set(0, 0, 0, 1);
        }

        // -------- Hand IK --------
        this.updateHand(this.leftArm, dt, true);
        this.updateHand(this.rightArm, dt, false);
    }

    /* -------------------------------------------------------------
       Leg logic
       ------------------------------------------------------------- */
    updateLeg(leg, dt, isLeft) {
        const mesh = this.player.mesh;

        // World-space shoulder/hip position (mesh origin already includes parent scale)
        leg.getWorldPosition(this._tmpVec);
        const footBottomWorld = this._tmpVec.y - 0.375 * mesh.scale.y;
        const origin = new THREE.Vector3(this._tmpVec.x, footBottomWorld + 0.3, this._tmpVec.z);

        const hit = this.raycastDown(origin, 0.6);

        // Player.updateVisuals has already written leg.rotation.x (walking swing).
        // We read it and fold it into the final quaternion so IK and anim coexist.
        const walkSwing = leg.rotation.x;
        const walkQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), walkSwing);

        if (hit) {
            // Desired foot-bottom world Y -> desired leg centre local Y
            const desiredBottom = hit.point.y;
            let targetLocalY = (desiredBottom - this.player.position.y) / mesh.scale.y + 0.375;
            targetLocalY = THREE.MathUtils.clamp(targetLocalY, 0.15, 0.65);

            if (isLeft) {
                this.leftFootY = THREE.MathUtils.lerp(this.leftFootY, targetLocalY, dt * 14);
                leg.position.y = this.leftFootY;
            } else {
                this.rightFootY = THREE.MathUtils.lerp(this.rightFootY, targetLocalY, dt * 14);
                leg.position.y = this.rightFootY;
            }

            // Surface normal in world space
            const n = hit.face.normal.clone();
            hit.object.updateMatrixWorld();
            const nMat = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
            n.applyMatrix3(nMat).normalize();

            // Convert to player-local space
            const localN = n.applyQuaternion(mesh.quaternion.clone().invert());
            const slopeQ = this.legRotationFromNormal(localN);

            // Combine: slope tilt first, then walking swing
            const finalQ = slopeQ.multiply(walkQ);
            leg.quaternion.copy(finalQ);
        } else {
            // No ground beneath this foot – revert to default height
            const targetY = 0.38;
            if (isLeft) {
                this.leftFootY = THREE.MathUtils.lerp(this.leftFootY, targetY, dt * 8);
                leg.position.y = this.leftFootY;
            } else {
                this.rightFootY = THREE.MathUtils.lerp(this.rightFootY, targetY, dt * 8);
                leg.position.y = this.rightFootY;
            }
            leg.quaternion.copy(walkQ);
        }
    }

    /* -------------------------------------------------------------
       Hand logic
       ------------------------------------------------------------- */
    updateHand(arm, dt, isLeft) {
        // Skip during ragdoll – arms are physics-simulated there
        if (this.player.state === 'RAGDOLL') {
            arm.userData.handIKActive = false;
            return;
        }

        const forward = new THREE.Vector3(
            Math.sin(this.player.facing),
            0,
            Math.cos(this.player.facing)
        );

        // Shoulder world position
        arm.getWorldPosition(this._tmpVec);
        const origin = this._tmpVec.clone().add(forward.clone().multiplyScalar(0.1));

        const hit = this.raycastForward(origin, forward, 0.6);

        if (hit && hit.distance < 0.5) {
            arm.userData.handIKActive = true;

            // Direction from shoulder to hit point
            const worldDir = new THREE.Vector3().subVectors(hit.point, this._tmpVec).normalize();

            // Convert to player-local space
            const localDir = worldDir.clone().applyQuaternion(this.player.mesh.quaternion.clone().invert());

            // Clamp to a reasonable brace angle (max ~70 deg from vertical)
            const angleFromUp = Math.acos(Math.max(-1, Math.min(1, localDir.y)));
            if (angleFromUp > Math.PI * 0.4) {
                // Too steep – arm would clip through body; fade out
                arm.userData.handIKActive = false;
                return;
            }

            const targetQ = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                localDir
            );
            arm.quaternion.slerp(targetQ, dt * 12);
        } else {
            // Let Player.updateVisuals drive the arm; just clear our flag
            arm.userData.handIKActive = false;
        }
    }

    dispose() {
        // No persistent GPU resources allocated by this class
    }
}
