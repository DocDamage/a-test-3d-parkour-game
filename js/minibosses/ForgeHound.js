/**
 * ForgeHound — mech beast mini-boss.
 * Phase 1: Missile volleys, charge attack, overheating build-up
 * Phase 2: Overheats — vents steam (vulnerable 3s), then enraged faster attacks
 * Weak Point: Coolant tank on belly (exposed during vent)
 */

import * as THREE from 'three';
import { MiniBossBase } from '../MiniBossBase.js';

export class ForgeHound extends MiniBossBase {
    constructor(scene, world, player, position) {
        super(scene, world, player, {
            type: 'forgehound',
            maxHealth: 1400,
            attackDamage: 28,
            attackRange: 3.0,
            attackCooldown: 2.0,
            speed: 3.5,
            position
        });
        this._heat = 0;
        this._maxHeat = 100;
        this._missileCooldown = 0;
        this._venting = false;
        this._buildMesh();
    }

    _buildMesh() {
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.0, 2.0),
            new THREE.MeshStandardMaterial({ color: 0x662200, metalness: 0.6, roughness: 0.5 })
        );
        body.position.y = 0.8;
        this.group.add(body);

        const head = new THREE.Mesh(
            new THREE.ConeGeometry(0.5, 1.0, 4),
            new THREE.MeshStandardMaterial({ color: 0x883300 })
        );
        head.rotation.x = Math.PI / 2;
        head.position.set(0, 1.0, 1.2);
        this.group.add(head);

        this.coolantTank = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.25, 0.6, 8),
            new THREE.MeshStandardMaterial({ color: 0x00ccff, emissive: 0x0088aa, emissiveIntensity: 0.5, transparent: true, opacity: 0.8 })
        );
        this.coolantTank.rotation.z = Math.PI / 2;
        this.coolantTank.position.set(0, 0.5, 0);
        this.group.add(this.coolantTank);

        this._enrageMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff4400 })
        );
        this._enrageMesh.position.y = 1.8;
        this._enrageMesh.visible = false;
        this.group.add(this._enrageMesh);
    }

    _updateAI(dt) {
        this._missileCooldown -= dt;
        const dist = this.position.distanceTo(this.player.position);

        if (this._venting) return; // Vulnerable, can't attack

        if (this._heat >= this._maxHeat) {
            this._startVent();
            return;
        }

        if (this.currentPhase === 1) {
            if (dist > 8 && this._missileCooldown <= 0) {
                this._missileVolley();
                this._missileCooldown = 5.0;
                this._heat += 25;
            } else if (dist > this.attackRange) {
                const dir = this.player.position.clone().sub(this.position).normalize();
                dir.y = 0;
                this.position.addScaledVector(dir, this.speed * dt);
                this.group.position.copy(this.position);
                this.group.lookAt(this.player.position.x, this.position.y, this.player.position.z);
            } else if (this._attackTimer <= 0) {
                this._chargeAttack();
                this._heat += 15;
                this._attackTimer = this.attackCooldown;
            }
        } else {
            if (dist > 6 && this._missileCooldown <= 0) {
                this._missileVolley();
                this._missileCooldown = 3.0;
                this._heat += 20;
            } else if (this._attackTimer <= 0) {
                this._chargeAttack();
                this._heat += 10;
                this._attackTimer = this.attackCooldown * 0.5;
            }
        }

        this._heat = Math.max(0, this._heat - 5 * dt); // passive cooling
    }

    _chargeAttack() {
        const dir = this.player.position.clone().sub(this.position).normalize();
        this.position.addScaledVector(dir, 4);
        this.group.position.copy(this.position);
        if (this.player.position.distanceTo(this.position) < this.attackRange + 1) {
            this.player.takeDamage(this.attackDamage, 'kinetic', this);
            this.player.velocity.add(dir.multiplyScalar(5));
        }
    }

    _missileVolley() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (this.isDead) return;
                const start = this.position.clone().add(new THREE.Vector3(0, 1.5, 0));
                const dir = this.player.position.clone().sub(start).normalize();
                // Simple projectile
                const mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 6, 6),
                    new THREE.MeshBasicMaterial({ color: 0xff3300 })
                );
                mesh.position.copy(start);
                this.scene.add(mesh);
                let life = 1.5;
                const fly = () => {
                    life -= 0.016;
                    mesh.position.addScaledVector(dir, 12 * 0.016);
                    if (life > 0 && mesh.position.distanceTo(this.player.position) > 1) {
                        requestAnimationFrame(fly);
                    } else {
                        this.scene.remove(mesh);
                        if (mesh.position.distanceTo(this.player.position) < 2) {
                            this.player.takeDamage(this.attackDamage * 0.8, 'explosive', this);
                        }
                    }
                };
                fly();
            }, i * 300);
        }
    }

    _startVent() {
        this._venting = true;
        this.exposeWeakPoint(3.0);
        setTimeout(() => {
            this._venting = false;
            this._heat = 0;
        }, 3000);
    }

    _transitionToPhase(phase) {
        super._transitionToPhase(phase);
        this.speed *= 1.4;
        this.attackCooldown *= 0.6;
    }

    _updateVisuals(dt) {
        if (this.coolantTank) {
            const heatRatio = this._heat / this._maxHeat;
            this.coolantTank.material.color.setRGB(heatRatio, 1 - heatRatio, 1 - heatRatio * 0.5);
            this.coolantTank.material.emissiveIntensity = this._venting ? 2.0 : 0.5 + heatRatio;
        }
    }
}
