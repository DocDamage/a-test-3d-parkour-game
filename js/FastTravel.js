/**
 * FastTravel — unlock zipline nodes by completing time trials.
 */

import * as THREE from 'three';

export const FAST_TRAVEL_NODES = [
    { id: 'rooftop', name: 'Rooftop', position: new THREE.Vector3(10, 8, 5), requirement: 'Rooftop' },
    { id: 'tunnel', name: 'Underground Tunnel', position: new THREE.Vector3(-15, 2, 12), requirement: 'Rooftop' },
    { id: 'shaft', name: 'Vertical Shaft', position: new THREE.Vector3(5, 15, -8), requirement: 'Freezer' },
    { id: 'freezer', name: 'Freezer Section', position: new THREE.Vector3(-10, 5, -15), requirement: 'Freezer' },
    { id: 'server', name: 'Server Room', position: new THREE.Vector3(20, 4, 20), requirement: 'ServerRoom' },
    { id: 'hangar', name: 'Hangar Bay', position: new THREE.Vector3(-20, 3, -20), requirement: 'HangarBay' },
];

export class FastTravel {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.unlocked = new Set();
        this._markers = [];
        this._load();
        this._spawnMarkers();
    }

    _spawnMarkers() {
        for (const node of FAST_TRAVEL_NODES) {
            if (!this.unlocked.has(node.id)) continue;
            const geo = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(node.position);
            this.scene.add(mesh);
            this._markers.push({ mesh, node });
        }
    }

    unlock(nodeId) {
        if (this.unlocked.has(nodeId)) return;
        this.unlocked.add(nodeId);
        this._save();
        // Spawn the marker
        const node = FAST_TRAVEL_NODES.find(n => n.id === nodeId);
        if (node) {
            const geo = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(node.position);
            this.scene.add(mesh);
            this._markers.push({ mesh, node });
        }
    }

    canTravelTo(nodeId) {
        return this.unlocked.has(nodeId);
    }

    travelTo(nodeId) {
        if (!this.canTravelTo(nodeId)) return false;
        const node = FAST_TRAVEL_NODES.find(n => n.id === nodeId);
        if (!node || !this.player) return false;
        this.player.position.copy(node.position);
        this.player.position.y += 0.5;
        if (window.__DEV__) console.log('[FastTravel] traveled to', node.name);
        return true;
    }

    getNearbyNode() {
        if (!this.player) return null;
        for (const node of FAST_TRAVEL_NODES) {
            if (node.position.distanceTo(this.player.position) < 2.0) {
                return node;
            }
        }
        return null;
    }

    serialize() {
        return Array.from(this.unlocked);
    }

    deserialize(data) {
        if (Array.isArray(data)) this.unlocked = new Set(data);
    }

    _save() {
        try {
            localStorage.setItem('apex_fast_travel', JSON.stringify(this.serialize()));
        } catch (e) {}
    }

    _load() {
        try {
            const raw = localStorage.getItem('apex_fast_travel');
            if (raw) this.deserialize(JSON.parse(raw));
        } catch (e) {}
    }
}
