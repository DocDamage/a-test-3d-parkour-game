/**
 * CrystalGolem — slow tank mini-boss.
 * Phase 1: Crystal armor reflects projectiles, slow melee slam
 * Phase 2: Armor cracks, faster, crystal shards AoE
 * Weak Point: Core exposed when armor cracks (Phase 2 start)
 */

import * as THREE from 'three';
import { MiniBossBase } from '../MiniBossBase.js';

export class CrystalGolem extends MiniBossBase {
    constructor(scene, world, player, position) {
        super(scene, world, player, {
            type: 'crystalgolem',
            maxHealth: 1500,
            attackDamage: 40,
            attackRange: 3.5,
            attackCooldown: 3.0,
            speed: 1.5,
            position
        });
        this._armorActive = true;
        this._shardCooldown = 0;
        this._buildMesh();
    }

    _buildMesh() {
        const body = new THREE.Mesh(
            new THREE.DodecahedronGeometry(1.2, 0),
            new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x4488aa, emissiveIntensity: 0.4, transparent: true, opacity: 0.9 })
        );
        body.position.y = 1.2;
        this.group.add(body);

        this.armorMesh = new THREE.Mesh(
            new THREE.IcosahedronGeometry(1.4, 1),
            new THREE.MeshStandardMaterial({ color: 0xaaddff, emissive: 0xaaddff, emissiveIntensity: 0.2, transparent: true, opacity: 0.4, wireframe: true })
        );
        this.armorMesh.position.y = 1.2;
        this.group.add(this.armorMesh);

        this.coreMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xff0044, emissive: 0xff0044, emissiveIntensity: 2 })
        );
        this.coreMesh.position.y = 1.2;
        this.coreMesh.visible = false;
        this.group.add(this.coreMesh);

        this._enrageMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff0044 })
        );
        this._enrageMesh.position.y = 2.6;
        this._enrageMesh.visible = false;
        this.group.add(this._enrageMesh);
    }

    _updateAI(dt) {
        this._shardCooldown -= dt;
        const dist = this.position.distanceTo(this.player.position);

        if (this.currentPhase === 1) {
            if (dist > this.attackRange) {
                const dir = this.player.position.clone().sub(this.position).normalize();
                dir.y = 0;
                this.position.addScaledVector(dir, this.speed * dt);
                this.group.position.copy(this.position);
                this.group.lookAt(this.player.position.x, this.position.y, this.player.position.z);
            } else if (this._attackTimer <= 0) {
                this._crystalSlam();
                this._attackTimer = this.attackCooldown;
            }
        } else {
            if (dist > this.attackRange * 1.2) {
                const dir = this.player.position.clone().sub(this.position).normalize();
                dir.y = 0;
                this.position.addScaledVector(dir, this.speed * 2.0 * dt);
                this.group.position.copy(this.position);
                this.group.lookAt(this.player.position.x, this.position.y, this.player.position.z);
            } else if (this._attackTimer <= 0) {
                if (this._shardCooldown <= 0) {
                    this._crystalShards();
                    this._shardCooldown = 6.0;
                } else {
                    this._crystalSlam();
                }
                this._attackTimer = this.attackCooldown * 0.6;
            }
        }
    }

    _crystalSlam() {
        if (this.player.position.distanceTo(this.position) < this.attackRange + 0.5) {
            this.player.takeDamage(this.attackDamage, 'kinetic', this);
            // Knock up
            this.player.velocity.y += 6;
        }
    }

    _crystalShards() {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dir = new THREE.Vector3(Math.cos(angle), 0.2, Math.sin(angle));
            const mesh = new THREE.Mesh(
                new THREE.ConeGeometry(0.08, 0.4, 4),
                new THREE.MeshBasicMaterial({ color: 0x88ccff })
            );
            mesh.position.copy(this.position).add(new THREE.Vector3(0, 1, 0));
            mesh.rotation.x = Math.PI / 2;
            mesh.lookAt(mesh.position.clone().add(dir));
            this.scene.add(mesh);
            let life = 1.0;
            const fly = () => {
                life -= 0.016;
                mesh.position.addScaledVector(dir, 8 * 0.016);
                if (life > 0) {
                    requestAnimationFrame(fly);
                } else {
                    this.scene.remove(mesh);
                    if (mesh.position.distanceTo(this.player.position) < 1.5) {
                        this.player.takeDamage(this.attackDamage * 0.6, 'kinetic', this);
                    }
                }
            };
            fly();
        }
    }

    takeDamage(amount, type, source) {
        if (this.isDead) return 0;
        if (this._armorActive && type === 'kinetic') {
            // Reflect projectiles back at attacker
            if (source && source.position && Math.random() < 0.3) {
                const reflectDir = source.position.clone().sub(this.position).normalize();
                // Visual only for reflection
                const mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(0.1, 6, 6),
                    new THREE.MeshBasicMaterial({ color: 0x88ccff })
                );
                mesh.position.copy(this.position);
                this.scene.add(mesh);
                let life = 0.5;
                const fly = () => {
                    life -= 0.016;
                    mesh.position.addScaledVector(reflectDir, 15 * 0.016);
                    if (life > 0) requestAnimationFrame(fly);
                    else this.scene.remove(mesh);
                };
                fly();
            }
            amount *= 0.5; // armor halves kinetic damage
        }
        return super.takeDamage(amount, type, source);
    }

    _transitionToPhase(phase) {
        super._transitionToPhase(phase);
        this._armorActive = false;
        if (this.armorMesh) this.armorMesh.visible = false;
        if (this.coreMesh) {
            this.coreMesh.visible = true;
            this.exposeWeakPoint(999); // permanently exposed in phase 2
        }
    }

    _updateVisuals(dt) {
        if (this.armorMesh) {
            this.armorMesh.rotation.y += 0.01;
            this.armorMesh.rotation.x += 0.005;
        }
        if (this.coreMesh && this.coreMesh.visible) {
            this.coreMesh.material.emissiveIntensity = 1.5 + Math.sin(performance.now() * 0.005) * 0.5;
        }
    }
}
