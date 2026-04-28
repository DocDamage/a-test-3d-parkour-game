/**
 * WanderingVendor — roaming merchant that appears in random zones each in-game day.
 */

import * as THREE from 'three';

export class WanderingVendor {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.active = false;
        this.position = new THREE.Vector3();
        this.inventory = [];
        this._day = 0;
        this._restockTimer = 0;
        this._restockInterval = 300; // 5 minutes real time
        this._mesh = null;
        this._buildMesh();
    }

    _buildMesh() {
        const geo = new THREE.CapsuleGeometry(0.3, 1.0, 4, 8);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.2 });
        this._mesh = new THREE.Mesh(geo, mat);
        this._mesh.visible = false;
        this.scene.add(this._mesh);

        // Floating icon above head
        const iconGeo = new THREE.BoxGeometry(0.2, 0.2, 0.02);
        const iconMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const icon = new THREE.Mesh(iconGeo, iconMat);
        icon.position.y = 1.2;
        this._mesh.add(icon);
    }

    update(dt) {
        this._restockTimer += dt;
        if (this._restockTimer >= this._restockInterval) {
            this._restockTimer = 0;
            this._relocate();
        }

        if (this.active && this._mesh) {
            this._mesh.position.copy(this.position);
            // Bob animation
            this._mesh.position.y += Math.sin(performance.now() * 0.002) * 0.05;
            // Face player
            if (this.player) {
                this._mesh.lookAt(this.player.position.x, this._mesh.position.y, this.player.position.z);
            }
        }
    }

    _relocate() {
        const zones = [
            new THREE.Vector3(10, 1, 10),
            new THREE.Vector3(-15, 1, 20),
            new THREE.Vector3(25, 5, -10),
            new THREE.Vector3(-20, 8, -20),
            new THREE.Vector3(0, 12, 0),
        ];
        const zone = zones[Math.floor(Math.random() * zones.length)];
        this.position.copy(zone);
        this.active = true;
        if (this._mesh) {
            this._mesh.visible = true;
            this._mesh.position.copy(this.position);
        }
        this._generateInventory();
        if (window.__DEV__) console.log('[Vendor] relocated to', zone.x, zone.z);
    }

    _generateInventory() {
        this.inventory = [];
        const items = [
            { name: 'Rare Mod Fragment', type: 'mod', price: 200 },
            { name: 'Overclock Coolant', type: 'consumable', price: 50 },
            { name: 'Blueprint: Gravity Hammer', type: 'blueprint', price: 500 },
            { name: 'Elite Drone Core', type: 'material', price: 150 },
            { name: 'Health Vial Pack', type: 'consumable', price: 80 },
        ];
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const item = items[Math.floor(Math.random() * items.length)];
            this.inventory.push({ ...item, id: `vendor_${Date.now()}_${i}` });
        }
    }

    isNearby() {
        if (!this.active || !this.player) return false;
        return this.position.distanceTo(this.player.position) < 3.0;
    }

    getInventory() {
        return this.inventory;
    }

    buy(itemId, playerShards) {
        const item = this.inventory.find(i => i.id === itemId);
        if (!item) return { success: false, error: 'Item not found' };
        if (playerShards < item.price) return { success: false, error: 'Not enough shards' };
        // Remove from inventory
        this.inventory = this.inventory.filter(i => i.id !== itemId);
        return { success: true, item, remainingShards: playerShards - item.price };
    }

    dispose() {
        if (this._mesh) {
            this.scene.remove(this._mesh);
            this._mesh.geometry.dispose();
            this._mesh.material.dispose();
        }
    }
}
