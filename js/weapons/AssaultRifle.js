/**
 * AssaultRifle — full-auto primary weapon.
 * Moderate damage, fast fire rate, requires reload.
 */

import * as THREE from 'three';

export class AssaultRifle {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Assault Rifle';
        this.type = 'primary';
        this.slot = 2;

        this.damage = 14;
        this.range = 50;
        this.attackSpeed = 10.0; // shots per second
        this.cooldown = 0;
        this.clipSize = 30;
        this.ammo = this.clipSize;
        this.reloadTime = 1.5;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.spread = 0.04;

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const group = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.14, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5, roughness: 0.5 })
        );
        group.add(body);
        const mag = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.18, 0.12),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        mag.position.set(0, -0.12, 0.05);
        group.add(mag);
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.42;
        group.add(barrel);
        return group;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.ammo = this.clipSize;
                this.isReloading = false;
            }
        }
        if (this.mesh.visible && this.player) {
            const offset = new THREE.Vector3(0.3, -0.12, -0.4).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0);
            this.mesh.position.copy(this.player.position).add(offset);
            this.mesh.rotation.y = this.player.facing || 0;
        }
    }

    canFire() {
        return this.cooldown <= 0 && !this.isReloading && this.ammo > 0;
    }

    fire(origin, direction) {
        if (!this.canFire()) {
            if (this.ammo <= 0 && !this.isReloading) this.reload();
            return null;
        }
        this.cooldown = 1 / this.attackSpeed;
        this.ammo--;
        return {
            type: 'projectile',
            damage: this.damage,
            range: this.range,
            speed: 80,
            origin: origin.clone(),
            direction: direction.clone().applyAxisAngle(new THREE.Vector3(0,1,0), (Math.random()-0.5)*this.spread)
                .applyAxisAngle(new THREE.Vector3(1,0,0), (Math.random()-0.5)*this.spread),
            piercing: false,
            spread: this.spread
        };
    }

    reload() {
        if (this.isReloading || this.ammo === this.clipSize) return false;
        this.isReloading = true;
        this.reloadTimer = this.reloadTime;
        return true;
    }

    setVisible(v) { this.mesh.visible = v; }
}
