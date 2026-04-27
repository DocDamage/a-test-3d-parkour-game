/**
 * RiftStalker — teleporting assassin mini-boss.
 * Phase 1: Teleport behind player, stab, vanish
 * Phase 2: Spawns 2 clone decoys, all attack together
 * Weak Point: Real stalker flickers slightly before teleport
 */

import * as THREE from 'three';
import { MiniBossBase } from '../MiniBossBase.js';

export class RiftStalker extends MiniBossBase {
    constructor(scene, world, player, position) {
        super(scene, world, player, {
            type: 'riftstalker',
            maxHealth: 900,
            attackDamage: 35,
            attackRange: 1.8,
            attackCooldown: 2.0,
            speed: 5.0,
            position
        });
        this._teleportCooldown = 0;
        this._cloneDecoys = [];
        this._flickerTimer = 0;
        this._buildMesh();
    }

    _buildMesh() {
        const body = new THREE.Mesh(
            new THREE.ConeGeometry(0.5, 1.8, 4),
            new THREE.MeshStandardMaterial({ color: 0x220044, emissive: 0x440088, emissiveIntensity: 0.3 })
        );
        body.rotation.x = Math.PI;
        body.position.y = 0.9;
        this.group.add(body);

        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.6, 0.15),
            new THREE.MeshStandardMaterial({ color: 0x8800ff, emissive: 0x8800ff, emissiveIntensity: 1 })
        );
        blade.position.set(0.4, 0.8, 0.3);
        this.group.add(blade);

        this._enrageMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff00ff })
        );
        this._enrageMesh.position.y = 2.0;
        this._enrageMesh.visible = false;
        this.group.add(this._enrageMesh);
    }

    _updateAI(dt) {
        this._teleportCooldown -= dt;
        this._flickerTimer -= dt;

        if (this.currentPhase === 1) {
            if (this._teleportCooldown <= 0) {
                this._flickerTimer = 0.5;
                setTimeout(() => this._teleportStrike(), 500);
                this._teleportCooldown = 4.0;
            }
        } else {
            if (this._cloneDecoys.length === 0 && this._teleportCooldown <= 0) {
                this._spawnClones();
                this._teleportCooldown = 8.0;
            }
            // All clones attack together
            if (this._attackTimer <= 0) {
                this._stabAttack();
                for (const clone of this._cloneDecoys) {
                    if (clone.position.distanceTo(this.player.position) < this.attackRange) {
                        this.player.takeDamage(this.attackDamage * 0.5, 'kinetic', this);
                    }
                }
                this._attackTimer = this.attackCooldown;
            }
        }
    }

    _teleportStrike() {
        if (this.isDead) return;
        const behind = new THREE.Vector3(Math.sin(this.player.facing), 0, Math.cos(this.player.facing)).multiplyScalar(-2);
        this.position.copy(this.player.position).add(behind);
        this.position.y = Math.max(this.position.y, 0.5);
        this.group.position.copy(this.position);
        this.group.lookAt(this.player.position);
        this._stabAttack();
    }

    _stabAttack() {
        if (this.player.position.distanceTo(this.position) < this.attackRange) {
            const isBackstab = this._isBehindPlayer();
            const dmg = isBackstab ? this.attackDamage * 2.5 : this.attackDamage;
            this.player.takeDamage(dmg, 'kinetic', this);
        }
    }

    _isBehindPlayer() {
        const toBoss = this.position.clone().sub(this.player.position).normalize();
        const playerFacing = new THREE.Vector3(Math.sin(this.player.facing), 0, Math.cos(this.player.facing));
        return toBoss.dot(playerFacing) < -0.5;
    }

    _spawnClones() {
        for (let i = 0; i < 2; i++) {
            const clone = this.group.clone();
            const angle = Math.random() * Math.PI * 2;
            const dist = 4 + Math.random() * 3;
            clone.position.set(
                this.player.position.x + Math.cos(angle) * dist,
                0.5,
                this.player.position.z + Math.sin(angle) * dist
            );
            this.scene.add(clone);
            this._cloneDecoys.push({ mesh: clone, health: 1 });
        }
        setTimeout(() => {
            for (const clone of this._cloneDecoys) this.scene.remove(clone.mesh);
            this._cloneDecoys = [];
        }, 10000);
    }

    _transitionToPhase(phase) {
        super._transitionToPhase(phase);
        this.speed *= 1.3;
        this.attackCooldown *= 0.7;
    }

    _updateVisuals(dt) {
        if (this._flickerTimer > 0) {
            this.group.visible = Math.floor(performance.now() / 50) % 2 === 0;
        } else {
            this.group.visible = true;
        }
    }

    die(source) {
        for (const clone of this._cloneDecoys) this.scene.remove(clone.mesh);
        this._cloneDecoys = [];
        super.die(source);
    }
}
