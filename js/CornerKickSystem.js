/**
 * CornerKickSystem — kick off a wall corner for a diagonal boost.
 * When jumping into the inside corner of two walls, launch diagonally outward
 * with increased speed. Integrates with WallKickSystem.
 */

import * as THREE from 'three';

export class CornerKickSystem {
    constructor(player) {
        this.player = player;
        this.cooldown = 0;
        this.cooldownTime = 0.25;
        this.boostSpeed = 9;
        this.heightBoost = 3.5;
    }

    update(dt) {
        if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);
    }

    /**
     * Check if player is in a corner (two nearby walls at ~90°) and kick off.
     * @param {Array} nearbyNormals - array of wall normals from collision checks
     * @param {boolean} inputPressed - jump pressed this frame
     * @returns {boolean} true if corner kick executed
     */
    tryCornerKick(nearbyNormals, inputPressed) {
        if (!inputPressed || this.cooldown > 0) return false;
        if (!nearbyNormals || nearbyNormals.length < 2) return false;

        // Find two normals that are roughly perpendicular
        let bestPair = null;
        let bestDot = Infinity;
        for (let i = 0; i < nearbyNormals.length; i++) {
            for (let j = i + 1; j < nearbyNormals.length; j++) {
                const dot = Math.abs(nearbyNormals[i].dot(nearbyNormals[j]));
                if (dot < bestDot) {
                    bestDot = dot;
                    bestPair = [nearbyNormals[i], nearbyNormals[j]];
                }
            }
        }
        if (!bestPair || bestDot > 0.4) return false; // not perpendicular enough

        this.cooldown = this.cooldownTime;

        // Bisector direction (outward from corner)
        const bisector = new THREE.Vector3()
            .addVectors(bestPair[0], bestPair[1])
            .normalize();

        // Ensure bisector points away from walls
        if (bisector.dot(bestPair[0]) < 0) bisector.negate();

        this.player.velocity.x = bisector.x * this.boostSpeed;
        this.player.velocity.z = bisector.z * this.boostSpeed;
        this.player.velocity.y = Math.max(this.player.velocity.y, this.heightBoost);

        if (this.player.onCornerKick) this.player.onCornerKick();
        return true;
    }

    reset() {
        this.cooldown = 0;
    }
}
