/**
 * RocketLauncher — explosive projectile with splash damage.
 */

import * as THREE from 'three';

export class RocketLauncher {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Rocket Launcher';
        this.type = 'heavy';
        this.slot = 3;
        this.damage = 100;
        this.blastRadius = 5;
        this.range = 40;
        this.attackSpeed = 1.0;
        this.cooldown = 0;
        this.clipSize = 2;
        this.ammo = this.clipSize;
        this.reloadTime = 3.0;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }
    _buildMesh() {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.5), new THREE.MeshStandardMaterial({ color: 0x3d3d3d }));
        g.add(body);
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6 }));
        tube.rotation.x = Math.PI / 2; tube.position.z = 0.4;
        g.add(tube);
        const sight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.08), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        sight.position.set(0, 0.12, 0.1);
        g.add(sight);
        return g;
    }
    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isReloading) { this.reloadTimer -= dt; if (this.reloadTimer <= 0) { this.ammo = this.clipSize; this.isReloading = false; } }
        if (this.mesh.visible && this.player) { const off = new THREE.Vector3(0.3, -0.05, -0.35).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0); this.mesh.position.copy(this.player.position).add(off); this.mesh.rotation.y = this.player.facing || 0; }
    }
    canFire() { return this.cooldown <= 0 && !this.isReloading && this.ammo > 0; }
    fire(origin, direction) {
        if (!this.canFire()) { if (this.ammo <= 0 && !this.isReloading) this.reload(); return null; }
        this.cooldown = 1 / this.attackSpeed; this.ammo--;
        return { type: 'rocket', damage: this.damage, range: this.range, blastRadius: this.blastRadius, speed: 35, origin: origin.clone(), direction: direction.clone(), damageType: 'explosive' };
    }
    reload() { if (this.isReloading || this.ammo === this.clipSize) return false; this.isReloading = true; this.reloadTimer = this.reloadTime; return true; }
    setVisible(v) { this.mesh.visible = v; }
}
