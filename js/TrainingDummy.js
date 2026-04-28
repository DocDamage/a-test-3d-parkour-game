/**
 * TrainingDummy — invincible target with DPS meter and damage breakdown.
 */

import * as THREE from 'three';

export class TrainingDummy {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position.clone();
        this.health = Infinity;
        this.maxHealth = Infinity;
        this.isDead = false;
        this._damageLog = []; // { amount, type, time }
        this._windowDuration = 5.0;
        this._mesh = null;
        this._buildMesh();
    }

    _buildMesh() {
        const geo = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
        const mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        this._mesh = new THREE.Mesh(geo, mat);
        this._mesh.position.copy(this.position);
        this.scene.add(this._mesh);

        // Health bar visual (always full since invincible)
        const barGeo = new THREE.PlaneGeometry(1.0, 0.1);
        const barMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this._bar = new THREE.Mesh(barGeo, barMat);
        this._bar.position.set(0, 1.0, 0);
        this._bar.rotation.x = -Math.PI / 2;
        this._mesh.add(this._bar);
    }

    takeDamage(amount, type, source) {
        this._damageLog.push({ amount, type, time: performance.now() });
        // Flash white
        if (this._mesh) {
            this._mesh.material.emissive = new THREE.Color(0xffffff);
            this._mesh.material.emissiveIntensity = 0.5;
            setTimeout(() => {
                if (this._mesh) {
                    this._mesh.material.emissive = new THREE.Color(0x000000);
                    this._mesh.material.emissiveIntensity = 0;
                }
            }, 100);
        }
        return amount;
    }

    getDPS() {
        const now = performance.now();
        const windowStart = now - this._windowDuration * 1000;
        const hits = this._damageLog.filter(d => d.time > windowStart);
        const total = hits.reduce((sum, d) => sum + d.amount, 0);
        return total / this._windowDuration;
    }

    getDamageBreakdown() {
        const now = performance.now();
        const windowStart = now - this._windowDuration * 1000;
        const hits = this._damageLog.filter(d => d.time > windowStart);
        const byType = {};
        for (const h of hits) {
            byType[h.type] = (byType[h.type] || 0) + h.amount;
        }
        return byType;
    }

    getBiggestHit() {
        if (this._damageLog.length === 0) return 0;
        return Math.max(...this._damageLog.map(d => d.amount));
    }

    getHitCount() {
        return this._damageLog.length;
    }

    reset() {
        this._damageLog = [];
    }

    update(dt) {
        // Prune old entries
        const cutoff = performance.now() - 60000; // keep 1 minute
        this._damageLog = this._damageLog.filter(d => d.time > cutoff);
    }

    dispose() {
        if (this._mesh) {
            this.scene.remove(this._mesh);
            this._mesh.geometry.dispose();
            this._mesh.material.dispose();
        }
    }
}
