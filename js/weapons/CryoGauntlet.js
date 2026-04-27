/**
 * CryoGauntlet — ice melee magic weapon.
 * Punch combo builds frost stacks. Heavy attack releases frost nova.
 */

import * as THREE from 'three';

export class CryoGauntlet {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Cryo Gauntlet';
        this.type = 'melee';
        this.slot = 0;

        this.damage = 22;
        this.range = 2.2;
        this.attackSpeed = 1.5;
        this.cooldown = 0;
        this.manaCost = 5;
        this.frostStacks = 0;
        this.maxFrostStacks = 5;

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const group = new THREE.Group();
        const glove = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.18, 0.25),
            new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x4488aa, emissiveIntensity: 0.5, transparent: true, opacity: 0.9 })
        );
        group.add(glove);
        const crystal = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.08, 0),
            new THREE.MeshStandardMaterial({ color: 0xaaddff, emissive: 0xaaddff, emissiveIntensity: 1 })
        );
        crystal.position.set(0, 0.12, 0.05);
        group.add(crystal);
        return group;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.mesh.visible && this.player) {
            const offset = new THREE.Vector3(0.15, -0.05, -0.15).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0);
            this.mesh.position.copy(this.player.position).add(offset);
            this.mesh.rotation.y = this.player.facing || 0;
        }
    }

    canFire() {
        if (this.cooldown > 0) return false;
        if (!this.player || !this.player.magicSystem) return true; // melee doesn't require mana
        return true;
    }

    fire(origin, direction) {
        if (!this.canFire()) return null;
        const isNova = this.frostStacks >= this.maxFrostStacks;
        if (isNova) {
            if (this.player.magicSystem.resourceSystem) {
                if (!this.player.magicSystem.resourceSystem.canSpend(20)) return null;
                this.player.magicSystem.resourceSystem.spend(20);
            }
            this.frostStacks = 0;
        } else {
            this.frostStacks = Math.min(this.maxFrostStacks, this.frostStacks + 1);
        }
        this.cooldown = 1 / this.attackSpeed;

        if (isNova) {
            return {
                type: 'melee',
                damage: this.damage * 2,
                range: 4.0,
                shieldBreak: false,
                origin: origin.clone(),
                direction: direction.clone(),
                arcAngle: Math.PI * 2,
                stagger: 1.0,
                knockback: 5,
                frostNova: true
            };
        }
        return {
            type: 'melee',
            damage: this.damage,
            range: this.range,
            shieldBreak: false,
            origin: origin.clone(),
            direction: direction.clone(),
            arcAngle: Math.PI / 3,
            stagger: 0.3,
            knockback: 2,
            applyChill: true
        };
    }

    reload() { return true; }
    setVisible(v) { this.mesh.visible = v; }
}
