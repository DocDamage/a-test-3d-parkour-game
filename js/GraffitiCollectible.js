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

const HIDDEN_GRAFFITI_POSITIONS = [
    { x: 14, y: 5, z: 14, name: 'Shadow Tag' },
    { x: -20, y: 12, z: -8, name: 'Whisper Tag' },
    { x: 3, y: 18, z: 18, name: 'Moon Tag' },
    { x: -15, y: 2, z: -22, name: 'Sewer Tag' },
    { x: 25, y: 22, z: -5, name: 'Star Tag' },
    { x: -8, y: 16, z: 8, name: 'Mist Tag' },
    { x: 18, y: 10, z: -25, name: 'Steel Tag' },
    { x: -28, y: 20, z: 12, name: 'Void Tag' },
    { x: 5, y: 5, z: -30, name: 'Root Tag' },
    { x: 32, y: 15, z: 18, name: 'Bolt Tag' },
    { x: -5, y: 28, z: -15, name: 'Cloud Tag' },
    { x: 12, y: 3, z: -12, name: 'Dust Tag' },
    { x: -35, y: 8, z: -5, name: 'Rune Tag' },
    { x: 22, y: 25, z: 10, name: 'Pulse Tag' },
    { x: -18, y: 18, z: 25, name: ' Prism Tag' },
];

export class GraffitiCollectible {
    constructor(scene, player, world = null, particleEffects = null, transmogSystem = null) {
        this.scene = scene;
        this.player = player;
        this.world = world;
        this.particleEffects = particleEffects;
        this.transmogSystem = transmogSystem;
        this.collected = new Set();
        this._markers = [];
        this._hiddenMarkers = [];
        this._load();
        this._spawnMarkers();
        this._spawnHiddenMarkers();
    }

    _spawnMarkers() {
        for (const pos of GRAFFITI_POSITIONS) {
            if (this.collected.has(pos.name)) continue;
            const mesh = this._createMarker(pos, 0xff00ff);
            this._markers.push({ mesh, name: pos.name, collected: false });
        }
    }

    _spawnHiddenMarkers() {
        for (const pos of HIDDEN_GRAFFITI_POSITIONS) {
            if (this.collected.has(pos.name)) continue;
            const mesh = this._createMarker(pos, 0x00ffff);
            mesh.visible = false;
            this._hiddenMarkers.push({ mesh, name: pos.name, collected: false });
        }
    }

    _createMarker(pos, color) {
        const geo = new THREE.PlaneGeometry(0.8, 0.8);
        const mat = new THREE.MeshBasicMaterial({
            color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(pos.x, pos.y, pos.z);
        // Wall alignment
        this._alignToWall(mesh);
        mesh.userData = { _isGraffiti: true, name: pos.name };
        this.scene.add(mesh);
        return mesh;
    }

    _alignToWall(mesh) {
        if (!this.world || !this.world.collidables) {
            mesh.lookAt(mesh.position.x + 1, mesh.position.y, mesh.position.z);
            return;
        }
        const raycaster = new THREE.Raycaster();
        const directions = [
            new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1),
        ];
        for (const dir of directions) {
            raycaster.set(mesh.position, dir);
            const hits = raycaster.intersectObjects(this.world.collidables, false);
            if (hits.length > 0 && hits[0].distance < 3) {
                const normal = hits[0].face ? hits[0].face.normal.clone().transformDirection(hits[0].object.matrixWorld).normalize() : dir.clone().negate();
                const up = new THREE.Vector3(0, 1, 0);
                const q = new THREE.Quaternion().setFromUnitVectors(up, normal);
                mesh.quaternion.copy(q);
                return;
            }
        }
        mesh.lookAt(mesh.position.x + 1, mesh.position.y, mesh.position.z);
    }

    update() {
        if (!this.player) return;
        const pPos = this.player.position;
        const runnerVisionActive = this.player._predatorVisionActive || false;
        for (const marker of this._markers) {
            if (marker.collected) continue;
            if (pPos.distanceTo(marker.mesh.position) < 1.5) {
                this._collect(marker);
            }
            const scale = 1 + Math.sin(performance.now() * 0.003 + marker.mesh.position.x) * 0.1;
            marker.mesh.scale.setScalar(scale);
        }
        for (const marker of this._hiddenMarkers) {
            if (marker.collected) continue;
            marker.mesh.visible = runnerVisionActive;
            if (runnerVisionActive && pPos.distanceTo(marker.mesh.position) < 1.5) {
                this._collect(marker);
            }
            if (marker.mesh.visible) {
                const scale = 1 + Math.sin(performance.now() * 0.005 + marker.mesh.position.z) * 0.15;
                marker.mesh.scale.setScalar(scale);
            }
        }
    }

    _collect(marker) {
        marker.collected = true;
        this.collected.add(marker.name);
        this.scene.remove(marker.mesh);
        marker.mesh.geometry.dispose();
        marker.mesh.material.dispose();
        this._save();
        if (window.__DEV__) console.log('[Graffiti] collected:', marker.name, `(${this.collected.size}/${GRAFFITI_POSITIONS.length + HIDDEN_GRAFFITI_POSITIONS.length})`);
        // Collection VFX
        if (this.particleEffects && this.particleEffects.burst) {
            this.particleEffects.burst(marker.mesh.position.clone(), 0xff00ff, 10);
        }
        // Style points
        if (this.player && this.player.onSprayTag) {
            this.player.onSprayTag(1.0);
        }
        // Completion reward
        const total = GRAFFITI_POSITIONS.length + HIDDEN_GRAFFITI_POSITIONS.length;
        if (this.collected.size >= total) {
            if (this.transmogSystem && this.transmogSystem.unlock) {
                this.transmogSystem.unlock('street_artist');
            }
            if (this._onComplete) this._onComplete();
        }
    }

    getCount() {
        return this.collected.size;
    }

    getTotal() {
        return GRAFFITI_POSITIONS.length + HIDDEN_GRAFFITI_POSITIONS.length;
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
