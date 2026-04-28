/**
 * GraffitiCollectible — hidden graffiti tags scattered in hard-to-reach spots.
 * Collect all to unlock a secret skin.
 */

import * as THREE from 'three';

const GRAFFITI_POSITIONS = [
    { x: 12, y: 8, z: 5, name: 'Rooftop Tag' },
    { x: -18, y: 3, z: 12, name: 'Tunnel Tag' },
    { x: 5, y: 15, z: -8, name: 'Shaft Tag' },
    { x: -10, y: 6, z: -15, name: 'Freezer Tag' },
    { x: 22, y: 4, z: 20, name: 'Hangar Tag' },
    { x: 0, y: 20, z: 0, name: 'Crown Tag' },
    { x: -25, y: 10, z: -5, name: 'Silent Tag' },
    { x: 30, y: 2, z: -20, name: 'Edge Tag' },
    { x: -5, y: 12, z: 25, name: 'Wind Tag' },
    { x: 15, y: 18, z: -15, name: 'Zenith Tag' },
    { x: -30, y: 5, z: 15, name: 'Rust Tag' },
    { x: 8, y: 25, z: 8, name: 'Sky Tag' },
    { x: -15, y: 14, z: -25, name: 'Deep Tag' },
    { x: 35, y: 8, z: 5, name: 'Forge Tag' },
    { x: -8, y: 22, z: -10, name: 'Ghost Tag' },
    { x: 20, y: 16, z: 20, name: 'Neon Tag' },
    { x: -22, y: 3, z: -18, name: 'Drain Tag' },
    { x: 10, y: 30, z: -5, name: 'Apex Tag' },
    { x: -12, y: 9, z: 30, name: 'Bridge Tag' },
    { x: 28, y: 12, z: -28, name: 'Last Tag' },
];

export class GraffitiCollectible {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.collected = new Set();
        this._markers = [];
        this._load();
        this._spawnMarkers();
    }

    _spawnMarkers() {
        for (const pos of GRAFFITI_POSITIONS) {
            if (this.collected.has(pos.name)) continue;
            const geo = new THREE.PlaneGeometry(0.8, 0.8);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xff00ff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.6,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(pos.x, pos.y, pos.z);
            mesh.lookAt(pos.x + 1, pos.y, pos.z);
            mesh.userData = { _isGraffiti: true, name: pos.name };
            this.scene.add(mesh);
            this._markers.push({ mesh, name: pos.name, collected: false });
        }
    }

    update() {
        if (!this.player) return;
        const pPos = this.player.position;
        for (const marker of this._markers) {
            if (marker.collected) continue;
            if (pPos.distanceTo(marker.mesh.position) < 1.5) {
                this._collect(marker);
            }
            // Pulse animation
            const scale = 1 + Math.sin(performance.now() * 0.003 + marker.mesh.position.x) * 0.1;
            marker.mesh.scale.setScalar(scale);
        }
    }

    _collect(marker) {
        marker.collected = true;
        this.collected.add(marker.name);
        this.scene.remove(marker.mesh);
        marker.mesh.geometry.dispose();
        marker.mesh.material.dispose();
        this._save();
        if (window.__DEV__) console.log('[Graffiti] collected:', marker.name, `(${this.collected.size}/${GRAFFITI_POSITIONS.length})`);
        if (this.collected.size >= GRAFFITI_POSITIONS.length && this._onComplete) {
            this._onComplete();
        }
    }

    getCount() {
        return this.collected.size;
    }

    getTotal() {
        return GRAFFITI_POSITIONS.length;
    }

    _save() {
        try {
            localStorage.setItem('apex_graffiti', JSON.stringify(Array.from(this.collected)));
        } catch (e) {}
    }

    _load() {
        try {
            const raw = localStorage.getItem('apex_graffiti');
            if (raw) this.collected = new Set(JSON.parse(raw));
        } catch (e) {}
    }
}
