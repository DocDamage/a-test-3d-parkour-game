/**
 * AimAssist — controller magnetism that pulls crosshair toward nearest enemy
 * within a configurable cone. Strength scales inversely with distance.
 */

import * as THREE from 'three';

export class AimAssist {
    constructor(player, camera) {
        this.player = player;
        this.camera = camera;
        this.enabled = false;
        this.angle = 8 * (Math.PI / 180); // default 8 degrees
        this.maxDistance = 40;
        this.strength = 0.35;
        this._tmpDir = new THREE.Vector3();
        this._tmpToEnemy = new THREE.Vector3();
    }

    setEnabled(v) { this.enabled = !!v; }
    setAngle(deg) { this.angle = deg * (Math.PI / 180); }
    setMaxDistance(d) { this.maxDistance = d; }
    setStrength(s) { this.strength = Math.max(0, Math.min(1, s)); }

    /**
     * Apply aim assist to mouse/gamepad look delta.
     * @param {number} dx — incoming horizontal look delta (radians or screen units)
     * @param {number} dy — incoming vertical look delta
     * @param {Array} enemies — array of enemy objects with .position
     * @param {number} dt
     * @returns {{dx: number, dy: number}} modified deltas
     */
    apply(dx, dy, enemies, dt) {
        if (!this.enabled || !this.player || !this.camera) return { dx, dy };
        if (!enemies || enemies.length === 0) return { dx, dy };

        const camPos = this.camera.position;
        const camDir = this._tmpDir;
        this.camera.getWorldDirection(camDir);

        let best = null;
        let bestScore = Infinity;

        for (const enemy of enemies) {
            if (!enemy || !enemy.position) continue;
            if (enemy.isDead || enemy.health <= 0) continue;

            const toEnemy = this._tmpToEnemy.subVectors(enemy.position, camPos);
            const dist = toEnemy.length();
            if (dist > this.maxDistance || dist < 0.5) continue;

            toEnemy.normalize();
            const angle = camDir.angleTo(toEnemy);
            if (angle > this.angle) continue;

            // Prefer closer + more centered enemies
            const score = dist + angle * 10;
            if (score < bestScore) {
                bestScore = score;
                best = { enemy, dist, angle, dir: toEnemy.clone() };
            }
        }

        if (!best) return { dx, dy };

        // Compute desired screen-space delta toward target
        const targetScreen = best.enemy.position.clone().project(this.camera);
        // targetScreen is in NDC [-1,1]; we only care about sign for pull direction
        const pullX = -targetScreen.x * this.strength * dt * 60; // normalize to ~60fps
        const pullY = -targetScreen.y * this.strength * dt * 60;

        // Falloff with distance
        const distFactor = 1 - (best.dist / this.maxDistance);
        const s = this.strength * distFactor;

        return {
            dx: dx * (1 - s) + pullX * s,
            dy: dy * (1 - s) + pullY * s,
        };
    }
}
