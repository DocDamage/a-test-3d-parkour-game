/**
 * BossLeviathan — flooded warehouse boss with rising/falling water.
 *
 * Phases:
 *   1: Submerged, tentacles burst from water. Grapple to high ground.
 *   2: Surfaces, water spouts knock player back. Must use ziplines.
 *   3: Beached, vulnerable. But water is toxic now. Speedrun to kill before drowning.
 * Weak Point: Eye (opens for 2s after each tentacle attack).
 */

import * as THREE from 'three';

export class BossLeviathan {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;

        this.currentPhase = 1;
        this.health = 3500;
        this.maxHealth = 3500;
        this.isActive = false;
        this.isDead = false;

        // Phase 1: tentacles
        this.tentacles = [];
        this.tentacleAttackTimer = 0;
        this.eyeOpen = false;
        this.eyeTimer = 0;

        // Phase 2: water spouts
        this.spoutTimer = 0;

        // Phase 3: toxic water
        this.toxicTimer = 0;
        this.drowningDamage = 0;

        this.group = new THREE.Group();
        this.scene.add(this.group);
        this._buildMesh();
        this.position = new THREE.Vector3(0, -2, 0);
        this.group.position.copy(this.position);
    }

    start() {
        this.isActive = true;
        this.currentPhase = 1;
        this.health = this.maxHealth;
        this.tentacles = [];
        for (let i = 0; i < 6; i++) {
            this._spawnTentacle(i);
        }
    }

    stop() {
        this.isActive = false;
        this.group.visible = false;
    }

    update(dt) {
        if (!this.isActive || this.isDead) return;
        switch (this.currentPhase) {
            case 1: this._updatePhase1(dt); break;
            case 2: this._updatePhase2(dt); break;
            case 3: this._updatePhase3(dt); break;
        }
        this._updateVisuals();
    }

    _spawnTentacle(index) {
        const angle = (index / 6) * Math.PI * 2;
        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.15, 6, 8),
            new THREE.MeshStandardMaterial({ color: 0x226622, roughness: 0.8 })
        );
        mesh.position.set(Math.cos(angle) * 5, -1, Math.sin(angle) * 5);
        mesh.rotation.z = Math.cos(angle) * 0.4;
        mesh.rotation.x = Math.sin(angle) * 0.4;
        this.group.add(mesh);
        this.tentacles.push({ mesh, angle, alive: true });
    }

    _updatePhase1(dt) {
        this.tentacleAttackTimer -= dt;
        if (this.tentacleAttackTimer <= 0) {
            this.tentacleAttackTimer = 3.0;
            // Random tentacle strikes at player
            const alive = this.tentacles.filter(t => t.alive);
            if (alive.length > 0 && this.player) {
                const t = alive[Math.floor(Math.random() * alive.length)];
                const strikePos = new THREE.Vector3(
                    this.position.x + Math.cos(t.angle) * 5,
                    2,
                    this.position.z + Math.sin(t.angle) * 5
                );
                if (this.player.position.distanceTo(strikePos) < 3) {
                    if (this.player.takeDamage) this.player.takeDamage(25, 'kinetic', this);
                }
                this.eyeOpen = true;
                this.eyeTimer = 2.0;
            }
        }

        if (this.eyeTimer > 0) {
            this.eyeTimer -= dt;
            if (this.eyeTimer <= 0) this.eyeOpen = false;
        }

        // Phase transition when half tentacles destroyed
        if (this.tentacles.filter(t => t.alive).length <= 3) {
            this._transitionToPhase(2);
        }
    }

    destroyTentacle(index) {
        if (index >= 0 && index < this.tentacles.length && this.tentacles[index].alive) {
            this.tentacles[index].alive = false;
            this.tentacles[index].mesh.visible = false;
            this.health -= 200;
        }
    }

    _updatePhase2(dt) {
        this.spoutTimer -= dt;
        if (this.spoutTimer <= 0) {
            this.spoutTimer = 2.5;
            // Water spouts push player back
            if (this.player) {
                const away = new THREE.Vector3().subVectors(this.player.position, this.position).normalize();
                this.player.velocity.add(away.multiplyScalar(12));
                if (this.player.takeDamage) this.player.takeDamage(10, 'kinetic', this);
            }
        }
        if (this.health <= this.maxHealth * 0.3) {
            this._transitionToPhase(3);
        }
    }

    _updatePhase3(dt) {
        this.toxicTimer += dt;
        // Toxic water damage if player is below safe height
        if (this.player && this.player.position.y < 4) {
            this.drowningDamage += dt;
            if (this.drowningDamage >= 1.0) {
                this.drowningDamage -= 1.0;
                if (this.player.takeDamage) this.player.takeDamage(12, 'energy', this);
            }
        }
        // Beached — vulnerable, no special defenses
    }

    _transitionToPhase(phase) {
        this.currentPhase = phase;
    }

    takeDamage(amount, type, source) {
        if (this.isDead) return 0;
        if (this.currentPhase === 1 && !this.eyeOpen) {
            amount *= 0.1; // submerged, only eye vulnerable
        }
        this.health -= amount;
        if (this.health <= 0) this.die();
        return amount;
    }

    die() {
        this.isDead = true;
        this.isActive = false;
        if (this.onDeath) this.onDeath(this, this.player);
        setTimeout(() => { if (this.group) this.group.visible = false; }, 3000);
    }

    _buildMesh() {
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(2, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0x113311, roughness: 0.9 })
        );
        body.scale.y = 0.6;
        this.group.add(body);

        // Eye
        const eye = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, emissiveIntensity: 2 })
        );
        eye.position.set(0, 0.5, 1.8);
        this.eyeMesh = eye;
        this.group.add(eye);
    }

    _updateVisuals() {
        if (this.eyeMesh) {
            this.eyeMesh.material.emissiveIntensity = this.eyeOpen ? 3 : 0.3;
        }
    }
}
