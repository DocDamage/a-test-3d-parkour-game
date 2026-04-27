/**
 * SubMachineGun — high RoF, low accuracy, quick reload.
 */

import * as THREE from 'three';

export class SubMachineGun {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Submachine Gun';
        this.type = 'primary';
        this.slot = 2;
        this.damage = 9;
        this.range = 25;
        this.attackSpeed = 14;
        this.cooldown = 0;
        this.clipSize = 32;
        this.ammo = this.clipSize;
        this.reloadTime = 1.2;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.spread = 0.08;
        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }
    _buildMesh() {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.35), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        g.add(body);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7 }));
        barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.25;
        g.add(barrel);
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.08), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        mag.position.set(0, -0.1, 0.05);
        g.add(mag);
        return g;
    }
    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isReloading) { this.reloadTimer -= dt; if (this.reloadTimer <= 0) { this.ammo = this.clipSize; this.isReloading = false; } }
        if (this.mesh.visible && this.player) { const off = new THREE.Vector3(0.25, -0.1, -0.3).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0); this.mesh.position.copy(this.player.position).add(off); this.mesh.rotation.y = this.player.facing || 0; }
    }
    canFire() { return this.cooldown <= 0 && !this.isReloading && this.ammo > 0; }
    fire(origin, direction) {
        if (!this.canFire()) { if (this.ammo <= 0 && !this.isReloading) this.reload(); return null; }
        this.cooldown = 1 / this.attackSpeed; this.ammo--;
        const dir = direction.clone().applyAxisAngle(new THREE.Vector3(0,1,0), (Math.random()-0.5)*this.spread).applyAxisAngle(new THREE.Vector3(1,0,0), (Math.random()-0.5)*this.spread);
        return { type: 'projectile', damage: this.damage, range: this.range, speed: 70, origin: origin.clone(), direction: dir, piercing: false, spread: this.spread };
    }
    reload() { if (this.isReloading || this.ammo === this.clipSize) return false; this.isReloading = true; this.reloadTimer = this.reloadTime; return true; }
    setVisible(v) { this.mesh.visible = v; }
}
