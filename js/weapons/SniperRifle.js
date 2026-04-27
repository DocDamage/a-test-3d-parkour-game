/**
 * SniperRifle — long-range hitscan weapon.
 * Headshot crit 4×, scope zoom, very slow fire rate.
 */

import * as THREE from 'three';

export class SniperRifle {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Sniper Rifle';
        this.type = 'primary';
        this.slot = 2;

        this.damage = 85;
        this.range = 80;
        this.attackSpeed = 0.8;
        this.cooldown = 0;
        this.clipSize = 5;
        this.ammo = this.clipSize;
        this.reloadTime = 2.5;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.headshotMultiplier = 4.0;
        this.isScoped = false;

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const group = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.14, 0.7),
            new THREE.MeshStandardMaterial({ color: 0x2a3a2a, metalness: 0.5, roughness: 0.5 })
        );
        group.add(body);
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.025, 0.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.55;
        group.add(barrel);
        const scope = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        scope.rotation.x = Math.PI / 2;
        scope.position.set(0, 0.08, 0.1);
        group.add(scope);
        return group;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) { this.ammo = this.clipSize; this.isReloading = false; }
        }
        if (this.mesh.visible && this.player) {
            const offset = new THREE.Vector3(0.3, -0.1, -0.4).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0);
            this.mesh.position.copy(this.player.position).add(offset);
            this.mesh.rotation.y = this.player.facing || 0;
        }
    }

    canFire() { return this.cooldown <= 0 && !this.isReloading && this.ammo > 0; }

    fire(origin, direction) {
        if (!this.canFire()) { if (this.ammo <= 0 && !this.isReloading) this.reload(); return null; }
        this.cooldown = 1 / this.attackSpeed;
        this.ammo--;
        return {
            type: 'hitscan',
            damage: this.damage,
            range: this.range,
            origin: origin.clone(),
            direction: direction.clone(),
            headshotMultiplier: this.headshotMultiplier,
            piercing: true
        };
    }

    reload() {
        if (this.isReloading || this.ammo === this.clipSize) return false;
        this.isReloading = true;
        this.reloadTimer = this.reloadTime;
        return true;
    }

    toggleScope() { this.isScoped = !this.isScoped; return this.isScoped; }
    setVisible(v) { this.mesh.visible = v; }
}
