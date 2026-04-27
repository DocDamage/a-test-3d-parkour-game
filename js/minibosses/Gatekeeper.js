/**
 * Gatekeeper — heavy armored mini-boss.
 * Phase 1: Slow walk, shield bash, ground slam
 * Phase 2: Discards shield, faster attacks, spinning sweep
 * Weak Point: Shield generator on back (exposed after bash)
 */

import * as THREE from 'three';
import { MiniBossBase } from '../MiniBossBase.js';

export class Gatekeeper extends MiniBossBase {
    constructor(scene, world, player, position) {
        super(scene, world, player, {
            type: 'gatekeeper',
            maxHealth: 1200,
            attackDamage: 30,
            attackRange: 2.5,
            attackCooldown: 2.5,
            speed: 2.0,
            position
        });
        this._hasShield = true;
        this._bashCooldown = 0;
        this._spinCooldown = 0;
        this._buildMesh();
    }

    _buildMesh() {
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 2.0, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.4 })
        );
        body.position.y = 1.0;
        this.group.add(body);

        this.shieldMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 1.8, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x2266cc, emissive: 0x1133aa, emissiveIntensity: 0.5, metalness: 0.8 })
        );
        this.shieldMesh.position.set(0.7, 1.0, 0);
        this.group.add(this.shieldMesh);

        this.generatorMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 })
        );
        this.generatorMesh.position.set(-0.7, 1.2, 0);
        this.group.add(this.generatorMesh);

        this._enrageMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff4400 })
        );
        this._enrageMesh.position.y = 2.3;
        this._enrageMesh.visible = false;
        this.group.add(this._enrageMesh);
    }

    _updateAI(dt) {
        const dist = this.position.distanceTo(this.player.position);
        this._bashCooldown -= dt;
        this._spinCooldown -= dt;

        if (this.currentPhase === 1) {
            if (dist > this.attackRange) {
                const dir = this.player.position.clone().sub(this.position).normalize();
                dir.y = 0;
                this.position.addScaledVector(dir, this.speed * dt);
                this.group.position.copy(this.position);
                this.group.lookAt(this.player.position.x, this.position.y, this.player.position.z);
            } else if (this._attackTimer <= 0) {
                if (this._bashCooldown <= 0 && Math.random() < 0.4) {
                    this._shieldBash();
                    this._bashCooldown = 6.0;
                } else {
                    this._groundSlam();
                }
                this._attackTimer = this.attackCooldown;
            }
        } else {
            if (dist > this.attackRange * 1.5) {
                const dir = this.player.position.clone().sub(this.position).normalize();
                dir.y = 0;
                this.position.addScaledVector(dir, this.speed * 1.8 * dt);
                this.group.position.copy(this.position);
                this.group.lookAt(this.player.position.x, this.position.y, this.player.position.z);
            } else if (this._attackTimer <= 0) {
                if (this._spinCooldown <= 0) {
                    this._spinSweep();
                    this._spinCooldown = 5.0;
                } else {
                    this._heavyStrike();
                }
                this._attackTimer = this.attackCooldown * 0.6;
            }
        }
    }

    _shieldBash() {
        const dir = new THREE.Vector3(Math.sin(this.group.rotation.y), 0, Math.cos(this.group.rotation.y));
        const hitPos = this.position.clone().add(dir.multiplyScalar(1.5));
        if (this.player.position.distanceTo(hitPos) < 2) {
            this.player.takeDamage(this.attackDamage, 'kinetic', this);
            this.player.velocity.add(dir.multiplyScalar(8));
        }
        this.exposeWeakPoint(3.0);
    }

    _groundSlam() {
        if (this.player.position.distanceTo(this.position) < this.attackRange + 1) {
            this.player.takeDamage(this.attackDamage * 1.2, 'explosive', this);
        }
    }

    _spinSweep() {
        const dir = this.player.position.clone().sub(this.position).normalize();
        if (this.player.position.distanceTo(this.position) < 4) {
            this.player.takeDamage(this.attackDamage * 1.3, 'kinetic', this);
            this.player.velocity.add(dir.multiplyScalar(6));
        }
    }

    _heavyStrike() {
        if (this.player.position.distanceTo(this.position) < this.attackRange) {
            this.player.takeDamage(this.attackDamage * 1.5, 'kinetic', this);
        }
    }

    _transitionToPhase(phase) {
        super._transitionToPhase(phase);
        this._hasShield = false;
        if (this.shieldMesh) this.shieldMesh.visible = false;
        this.speed *= 1.5;
    }

    _updateVisuals(dt) {
        if (this.generatorMesh) {
            this.generatorMesh.material.emissiveIntensity = this._weakPointExposed ? 2.0 : 0.5;
        }
    }
}
