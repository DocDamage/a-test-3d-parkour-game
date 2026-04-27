/**
 * GrenadeLauncher — arc shots, bounce, remote detonate.
 */

import * as THREE from 'three';

export class GrenadeLauncher {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Grenade Launcher';
        this.type = 'heavy';
        this.slot = 3;
        this.damage = 80;
        this.blastRadius = 4;
        this.range = 25;
        this.attackSpeed = 1.5;
        this.cooldown = 0;
        this.clipSize = 4;
        this.ammo = this.clipSize;
        this.reloadTime = 2.5;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.activeGrenades = [];
        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }
    _buildMesh() {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0x3a4a2a }));
        body.rotation.x = Math.PI / 2;
        g.add(body);
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 8), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        cyl.rotation.x = Math.PI / 2; cyl.position.z = 0.25;
        g.add(cyl);
        return g;
    }
    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isReloading) { this.reloadTimer -= dt; if (this.reloadTimer <= 0) { this.ammo = this.clipSize; this.isReloading = false; } }
        if (this.mesh.visible && this.player) { const off = new THREE.Vector3(0.25, -0.05, -0.3).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0); this.mesh.position.copy(this.player.position).add(off); this.mesh.rotation.y = this.player.facing || 0; }
        for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
            const g = this.activeGrenades[i];
            g.velocity.y -= 9.8 * dt;
            g.mesh.position.addScaledVector(g.velocity, dt);
            if (g.mesh.position.y <= 0.1) { g.mesh.position.y = 0.1; g.velocity.y *= -0.5; g.velocity.x *= 0.7; g.velocity.z *= 0.7; }
            g.timer -= dt;
            if (g.timer <= 0 || g.detonateNow) { this._explode(g); this.scene.remove(g.mesh); this.activeGrenades.splice(i, 1); }
        }
    }
    canFire() { return this.cooldown <= 0 && !this.isReloading && this.ammo > 0; }
    fire(origin, direction) {
        if (!this.canFire()) { if (this.ammo <= 0 && !this.isReloading) this.reload(); return null; }
        this.cooldown = 1 / this.attackSpeed; this.ammo--;
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: 0x338822 }));
        mesh.position.copy(origin);
        this.scene.add(mesh);
        const velocity = direction.clone().multiplyScalar(10); velocity.y += 4;
        this.activeGrenades.push({ mesh, velocity, timer: 3, detonateNow: false });
        return { type: 'grenade_thrown' };
    }
    detonateAll() { for (const g of this.activeGrenades) g.detonateNow = true; }
    _explode(g) {
        const exp = new THREE.Mesh(new THREE.SphereGeometry(this.blastRadius, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.5 }));
        exp.position.copy(g.mesh.position); this.scene.add(exp); setTimeout(() => { this.scene.remove(exp); exp.geometry.dispose(); exp.material.dispose(); }, 200);
        if (this.onExplode) this.onExplode({ position: g.mesh.position.clone(), radius: this.blastRadius, damage: this.damage, type: 'explosive' });
    }
    reload() { if (this.isReloading || this.ammo === this.clipSize) return false; this.isReloading = true; this.reloadTimer = this.reloadTime; return true; }
    setVisible(v) { this.mesh.visible = v; }
}
