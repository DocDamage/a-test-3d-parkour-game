/**
 * BoStaff — fast melee staff with sweep attack and pole-vault trick.
 * Light attacks are rapid thrusts; heavy is a wide sweep that hits multiple enemies.
 * Pole-vault: jump immediately after heavy to launch off an enemy's head.
 */

import * as THREE from 'three';

export class BoStaff {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Bo Staff';
        this.type = 'melee';
        this.slot = 1;
        this.id = 'bo_staff';

        this.damage = 18;
        this.sweepDamage = 28;
        this.range = 3.2;
        this.attackSpeed = 1.6;
        this.cooldown = 0;
        this.chargeTime = 0;
        this.isCharging = false;
        this.sweepRadius = 4;

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const g = new THREE.Group();
        const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 1.6, 8),
            new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.6 })
        );
        shaft.rotation.x = Math.PI / 2;
        g.add(shaft);
        const cap1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7 })
        );
        cap1.position.z = 0.8;
        g.add(cap1);
        const cap2 = cap1.clone();
        cap2.position.z = -0.8;
        g.add(cap2);
        return g;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isCharging) this.chargeTime += dt;
        if (this.player && this.mesh.visible) {
            const pos = this.player.position.clone();
            pos.y += this.player.currentHeight * 0.5;
            this.mesh.position.copy(pos);
            this.mesh.rotation.y = this.player.facing || 0;
        }
    }

    canFire() { return this.cooldown <= 0; }

    fire(origin, direction) {
        if (!this.canFire()) return null;
        this.cooldown = 1 / this.attackSpeed;
        const isSweep = this.chargeTime >= 0.5;
        const dmg = isSweep ? this.sweepDamage : this.damage;
        this.chargeTime = 0;
        this.isCharging = false;
        return {
            type: 'melee',
            damage: dmg,
            range: isSweep ? this.sweepRadius : this.range,
            origin: origin.clone(),
            direction: direction.clone(),
            isSweep,
            poleVaultReady: isSweep,
        };
    }

    startCharge() { this.isCharging = true; }
    releaseCharge() { this.isCharging = false; }
    reload() { return false; }
    setVisible(v) { this.mesh.visible = v; }
}
