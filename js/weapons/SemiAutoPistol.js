/**
 * SemiAutoPistol — sidearm with headshot crit.
 * Accurate, moderate damage, infinite ammo (no reload).
 */

import * as THREE from 'three';

export class SemiAutoPistol {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Semi-Auto Pistol';
        this.type = 'sidearm';
        this.slot = 1;

        this.damage = 18;
        this.range = 40;
        this.attackSpeed = 4.0; // shots per second
        this.cooldown = 0;
        this.headshotMultiplier = 2.5;
        this.ammo = Infinity;
        this.clipSize = Infinity;

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const group = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.12, 0.25),
            new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 })
        );
        group.add(body);
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.18;
        group.add(barrel);
        return group;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.mesh.visible && this.player) {
            const offset = new THREE.Vector3(0.25, -0.15, -0.35).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0);
            this.mesh.position.copy(this.player.position).add(offset);
            this.mesh.rotation.y = this.player.facing || 0;
        }
    }

    canFire() {
        return this.cooldown <= 0;
    }

    fire(origin, direction) {
        if (!this.canFire()) return null;
        this.cooldown = 1 / this.attackSpeed;
        return {
            type: 'projectile',
            damage: this.damage,
            range: this.range,
            speed: 60,
            origin: origin.clone(),
            direction: direction.clone(),
            headshotMultiplier: this.headshotMultiplier,
            piercing: false,
            spread: 0.01
        };
    }

    reload() { return true; }
    setVisible(v) { this.mesh.visible = v; }
}
