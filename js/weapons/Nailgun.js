/**
 * Nailgun — rapid-fire low-damage projectile weapon.
 * Pins enemies to walls on kill. Slide-firing fans shots in a horizontal spread.
 */

import * as THREE from 'three';

export class Nailgun {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Nailgun';
        this.type = 'sidearm';
        this.slot = 2;
        this.id = 'nailgun';

        this.damage = 6;
        this.range = 25;
        this.attackSpeed = 10;
        this.cooldown = 0;
        this.clipSize = 30;
        this.ammo = this.clipSize;
        this.reloadTime = 1.4;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.spread = 0.06;
        this.slideSpread = 0.25;
        this.pinForce = 8;

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const g = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.12, 0.35),
            new THREE.MeshStandardMaterial({ color: 0xcc8800, metalness: 0.4 })
        );
        g.add(body);
        const mag = new THREE.Mesh(
            new THREE.BoxGeometry(0.07, 0.14, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        mag.position.set(0, -0.1, -0.05);
        g.add(mag);
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8),
            new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.28;
        g.add(barrel);
        return g;
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
            const off = new THREE.Vector3(0.26, -0.08, -0.34).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0);
            this.mesh.position.copy(this.player.position).add(off);
            this.mesh.rotation.y = this.player.facing || 0;
        }
    }

    canFire() { return this.cooldown <= 0 && !this.isReloading && this.ammo > 0; }

    fire(origin, direction) {
        if (!this.canFire()) { if (this.ammo <= 0 && !this.isReloading) this.reload(); return null; }
        this.cooldown = 1 / this.attackSpeed;
        this.ammo--;
        const isSlide = this.player && this.player.state === 'SLIDE';
        const s = isSlide ? this.slideSpread : this.spread;
        const dir = direction.clone();
        dir.x += (Math.random() - 0.5) * s;
        dir.z += (Math.random() - 0.5) * s;
        dir.normalize();
        return {
            type: 'projectile',
            damage: this.damage,
            range: this.range,
            speed: 70,
            origin: origin.clone(),
            direction: dir,
            damageType: 'kinetic',
            pin: true,
            pinForce: this.pinForce,
            isSlideFire: isSlide,
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
