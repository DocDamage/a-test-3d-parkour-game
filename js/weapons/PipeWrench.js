/**
 * PipeWrench — starter melee weapon.
 * High stagger, shield break on charged heavy.
 */

import * as THREE from 'three';

export class PipeWrench {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Pipe Wrench';
        this.type = 'melee';
        this.slot = 0; // melee slot

        this.damage = 25;
        this.range = 2.5;
        this.attackSpeed = 1.2; // attacks per second
        this.cooldown = 0;
        this.chargeTime = 0;
        this.isCharging = false;

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const group = new THREE.Group();
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8),
            new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 })
        );
        handle.rotation.x = Math.PI / 2;
        handle.position.z = -0.3;
        group.add(handle);

        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.08, 0.15),
            new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.3 })
        );
        head.position.z = 0.15;
        group.add(head);

        return group;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isCharging) {
            this.chargeTime += dt;
        }
        // Follow player camera/position
        if (this.player && this.mesh.visible) {
            const pos = this.player.position.clone();
            pos.y += this.player.currentHeight * 0.5;
            this.mesh.position.copy(pos);
            this.mesh.rotation.y = this.player.facing || 0;
        }
    }

    canFire() {
        return this.cooldown <= 0;
    }

    fire(origin, direction) {
        if (!this.canFire()) return null;
        this.cooldown = 1 / this.attackSpeed;

        const isCharged = this.chargeTime >= 0.6;
        const dmg = isCharged ? this.damage * 2.5 : this.damage;
        const isShieldBreak = isCharged;

        this.chargeTime = 0;
        this.isCharging = false;

        return {
            type: 'melee',
            damage: dmg,
            range: this.range,
            shieldBreak: isShieldBreak,
            origin: origin.clone(),
            direction: direction.clone(),
            arcAngle: Math.PI / 3,
            stagger: isCharged ? 1.5 : 0.5,
            knockback: isCharged ? 8 : 3
        };
    }

    startCharge() {
        this.isCharging = true;
        this.chargeTime = 0;
    }

    cancelCharge() {
        this.isCharging = false;
        this.chargeTime = 0;
    }

    reload() {
        // Melee weapons don't reload
        return true;
    }

    setVisible(v) {
        this.mesh.visible = v;
    }
}
