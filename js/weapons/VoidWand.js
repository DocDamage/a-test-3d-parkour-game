/**
 * VoidWand — rapid-fire magic weapon.
 * Low damage, high fire rate, drains small mana per shot.
 */

import * as THREE from 'three';

export class VoidWand {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Void Wand';
        this.type = 'sidearm';
        this.slot = 1;

        this.damage = 12;
        this.range = 18;
        this.attackSpeed = 8.0;
        this.cooldown = 0;
        this.manaCost = 3;
        this.spread = 0.03;

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const group = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.04, 0.3, 8),
            new THREE.MeshStandardMaterial({ color: 0x220044, emissive: 0x440088, emissiveIntensity: 0.8 })
        );
        body.rotation.x = Math.PI / 2;
        group.add(body);

        const tip = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x6600cc, emissive: 0x6600cc, emissiveIntensity: 2 })
        );
        tip.position.z = 0.18;
        group.add(tip);

        return group;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.mesh.visible && this.player) {
            const offset = new THREE.Vector3(0.2, -0.05, -0.2).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0);
            this.mesh.position.copy(this.player.position).add(offset);
            this.mesh.rotation.y = this.player.facing || 0;
        }
    }

    canFire() {
        if (this.cooldown > 0) return false;
        if (!this.player || !this.player.magicSystem) return false;
        return this.player.magicSystem.resourceSystem && this.player.magicSystem.resourceSystem.canSpend(this.manaCost);
    }

    fire(origin, direction) {
        if (!this.canFire()) return null;
        if (this.player.magicSystem.resourceSystem) this.player.magicSystem.resourceSystem.spend(this.manaCost);
        this.cooldown = 1 / this.attackSpeed;
        const spreadY = (Math.random() - 0.5) * this.spread;
        const dir = direction.clone().applyAxisAngle(new THREE.Vector3(0,1,0), spreadY);
        return {
            type: 'projectile',
            damage: this.damage,
            range: this.range,
            speed: 65,
            origin: origin.clone(),
            direction: dir,
            damageType: 'magic',
            color: 0x6600cc,
            radius: 0.08,
            piercing: false
        };
    }

    reload() { return true; }
    setVisible(v) { this.mesh.visible = v; }
}
