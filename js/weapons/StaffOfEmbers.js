/**
 * StaffOfEmbers — magic weapon that channels fire spells.
 * Drains mana per shot. Charged shot fires a larger fireball.
 */

import * as THREE from 'three';

export class StaffOfEmbers {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Staff of Embers';
        this.type = 'primary';
        this.slot = 2;

        this.damage = 35;
        this.range = 25;
        this.attackSpeed = 3.0;
        this.cooldown = 0;
        this.manaCost = 8;
        this.chargeTime = 0;
        this.isCharging = false;

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const group = new THREE.Group();
        const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 1.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.8 })
        );
        shaft.rotation.x = Math.PI / 2;
        shaft.position.z = -0.4;
        group.add(shaft);

        const head = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.15, 0),
            new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 1.5 })
        );
        head.position.z = 0.25;
        group.add(head);

        const glow = new THREE.PointLight(0xff4400, 2, 4);
        glow.position.z = 0.25;
        group.add(glow);

        return group;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isCharging) this.chargeTime += dt;
        if (this.mesh.visible && this.player) {
            const offset = new THREE.Vector3(0.25, -0.1, -0.3).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0);
            this.mesh.position.copy(this.player.position).add(offset);
            this.mesh.rotation.y = this.player.facing || 0;
        }
    }

    canFire() {
        if (this.cooldown > 0) return false;
        if (!this.player || !this.player.magicSystem) return false;
        const cost = this.isCharging && this.chargeTime >= 1.0 ? this.manaCost * 3 : this.manaCost;
        return this.player.magicSystem.resourceSystem && this.player.magicSystem.resourceSystem.canSpend(cost);
    }

    fire(origin, direction) {
        if (!this.canFire()) return null;
        const isCharged = this.isCharging && this.chargeTime >= 1.0;
        const cost = isCharged ? this.manaCost * 3 : this.manaCost;
        if (this.player.magicSystem.resourceSystem) this.player.magicSystem.resourceSystem.spend(cost);
        this.cooldown = 1 / this.attackSpeed;
        this.chargeTime = 0;
        this.isCharging = false;

        return {
            type: 'projectile',
            damage: isCharged ? this.damage * 2.5 : this.damage,
            range: this.range,
            speed: isCharged ? 40 : 55,
            origin: origin.clone(),
            direction: direction.clone(),
            damageType: 'magic',
            color: 0xff4400,
            radius: isCharged ? 0.35 : 0.15,
            piercing: false
        };
    }

    startCharge() { this.isCharging = true; this.chargeTime = 0; }
    cancelCharge() { this.isCharging = false; this.chargeTime = 0; }
    reload() { return true; }
    setVisible(v) { this.mesh.visible = v; }
}
