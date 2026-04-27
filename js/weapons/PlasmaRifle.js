/**
 * PlasmaRifle — energy weapon that melts shields.
 */

import * as THREE from 'three';

export class PlasmaRifle {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Plasma Rifle';
        this.type = 'primary';
        this.slot = 2;
        this.damage = 22;
        this.range = 35;
        this.attackSpeed = 6;
        this.cooldown = 0;
        this.clipSize = 24;
        this.ammo = this.clipSize;
        this.reloadTime = 1.8;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }
    _buildMesh() {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.5), new THREE.MeshStandardMaterial({ color: 0x444466, metalness: 0.5 }));
        g.add(body);
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 8, 16), new THREE.MeshStandardMaterial({ color: 0x00ffaa, emissive: 0x00ffaa, emissiveIntensity: 1 }));
        coil.position.z = 0.25;
        g.add(coil);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.35;
        g.add(barrel);
        return g;
    }
    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isReloading) { this.reloadTimer -= dt; if (this.reloadTimer <= 0) { this.ammo = this.clipSize; this.isReloading = false; } }
        if (this.mesh.visible && this.player) { const off = new THREE.Vector3(0.28, -0.1, -0.38).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0); this.mesh.position.copy(this.player.position).add(off); this.mesh.rotation.y = this.player.facing || 0; }
    }
    canFire() { return this.cooldown <= 0 && !this.isReloading && this.ammo > 0; }
    fire(origin, direction) {
        if (!this.canFire()) { if (this.ammo <= 0 && !this.isReloading) this.reload(); return null; }
        this.cooldown = 1 / this.attackSpeed; this.ammo--;
        return { type: 'projectile', damage: this.damage, range: this.range, speed: 55, origin: origin.clone(), direction: direction.clone(), damageType: 'energy', shieldMelt: true, color: 0x00ffaa };
    }
    reload() { if (this.isReloading || this.ammo === this.clipSize) return false; this.isReloading = true; this.reloadTimer = this.reloadTime; return true; }
    setVisible(v) { this.mesh.visible = v; }
}
