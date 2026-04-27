/**
 * Crossbow — silent, high single-shot, bolt retrieval.
 */

import * as THREE from 'three';

export class Crossbow {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Crossbow';
        this.type = 'sidearm';
        this.slot = 1;
        this.damage = 55;
        this.range = 30;
        this.attackSpeed = 1.2;
        this.cooldown = 0;
        this.clipSize = 1;
        this.ammo = this.clipSize;
        this.reloadTime = 1.0;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.silent = true;
        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }
    _buildMesh() {
        const g = new THREE.Group();
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: 0x5c3a1e }));
        stock.position.z = -0.15;
        g.add(stock);
        const bow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.02), new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5 }));
        bow.position.z = 0.05;
        g.add(bow);
        return g;
    }
    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isReloading) { this.reloadTimer -= dt; if (this.reloadTimer <= 0) { this.ammo = this.clipSize; this.isReloading = false; } }
        if (this.mesh.visible && this.player) { const off = new THREE.Vector3(0.2, -0.05, -0.2).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0); this.mesh.position.copy(this.player.position).add(off); this.mesh.rotation.y = this.player.facing || 0; }
    }
    canFire() { return this.cooldown <= 0 && !this.isReloading && this.ammo > 0; }
    fire(origin, direction) {
        if (!this.canFire()) { if (this.ammo <= 0 && !this.isReloading) this.reload(); return null; }
        this.cooldown = 1 / this.attackSpeed; this.ammo--;
        return { type: 'projectile', damage: this.damage, range: this.range, speed: 50, origin: origin.clone(), direction: direction.clone(), piercing: true, silent: true };
    }
    reload() { if (this.isReloading || this.ammo === this.clipSize) return false; this.isReloading = true; this.reloadTimer = this.reloadTime; return true; }
    setVisible(v) { this.mesh.visible = v; }
}
