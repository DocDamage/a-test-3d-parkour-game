/**
 * Shotgun — heavy spread weapon.
 * Fires 8 pellets, high close-range damage, falls off at distance.
 */

import * as THREE from 'three';

export class Shotgun {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Combat Shotgun';
        this.type = 'heavy';
        this.slot = 3;

        this.damage = 12; // per pellet
        this.pellets = 8;
        this.range = 15;
        this.attackSpeed = 1.5;
        this.cooldown = 0;
        this.clipSize = 6;
        this.ammo = this.clipSize;
        this.reloadTime = 2.0;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.spread = 0.12;
        this.falloffStart = 8;
        this.falloffEnd = 15;

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const group = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.14, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.7 })
        );
        group.add(body);
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.04, 0.35, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.38;
        group.add(barrel);
        const pump = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.06, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        pump.position.set(0, -0.06, 0.1);
        group.add(pump);
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
            const offset = new THREE.Vector3(0.25, -0.1, -0.35).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0);
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

        const projectiles = [];
        for (let i = 0; i < this.pellets; i++) {
            const spreadY = (Math.random() - 0.5) * this.spread;
            const spreadX = (Math.random() - 0.5) * this.spread;
            const dir = direction.clone()
                .applyAxisAngle(new THREE.Vector3(0,1,0), spreadY)
                .applyAxisAngle(new THREE.Vector3(1,0,0), spreadX);
            projectiles.push({
                type: 'projectile',
                damage: this.damage,
                range: this.range,
                speed: 55,
                origin: origin.clone(),
                direction: dir,
                falloffStart: this.falloffStart,
                falloffEnd: this.falloffEnd,
                piercing: false
            });
        }
        return { type: 'shotgun', projectiles };
    }

    reload() {
        if (this.isReloading || this.ammo === this.clipSize) return false;
        this.isReloading = true;
        this.reloadTimer = this.reloadTime;
        return true;
    }

    setVisible(v) { this.mesh.visible = v; }
}
