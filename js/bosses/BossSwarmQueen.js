/**
 * BossSwarmQueen — hive infestation boss.
 *
 * Phases:
 *   1: 20+ tiny drones swarm. EMP burst is essential.
 *   2: Queen lays eggs that hatch. Must destroy eggs in 5s.
 *   3: Queen alone, fast flight. Grapple to her, climb, attack core on back.
 * Weak Point: Abdomen sac (swells before egg lay, 3s window).
 */

import * as THREE from 'three';

export class BossSwarmQueen {
    constructor(scene, world, player, enemyManager) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.enemyManager = enemyManager;

        this.currentPhase = 1;
        this.health = 2800;
        this.maxHealth = 2800;
        this.isActive = false;
        this.isDead = false;

        // Phase 1: swarm
        this.swarmTimer = 0;
        this.swarmDrones = [];

        // Phase 2: eggs
        this.eggs = [];
        this.eggLayTimer = 0;
        this.sacSwell = false;
        this.sacTimer = 0;

        // Phase 3: flight
        this.flightAngle = 0;
        this.flightRadius = 8;

        this.group = new THREE.Group();
        this.scene.add(this.group);
        this._buildMesh();
        this.position = new THREE.Vector3(0, 4, 0);
        this.group.position.copy(this.position);
    }

    start() {
        this.isActive = true;
        this.currentPhase = 1;
        this.health = this.maxHealth;
        this.eggs = [];
        this.sacSwell = false;
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

    _updatePhase1(dt) {
        this.swarmTimer -= dt;
        if (this.swarmTimer <= 0 && this.enemyManager) {
            this.swarmTimer = 3.0;
            for (let i = 0; i < 4; i++) {
                const angle = Math.random() * Math.PI * 2;
                const pos = new THREE.Vector3(
                    this.position.x + Math.cos(angle) * 6,
                    3,
                    this.position.z + Math.sin(angle) * 6
                );
                this.enemyManager.spawnEnemy('suicide', { position: pos });
            }
        }
        if (this.health <= this.maxHealth * 0.6) {
            this._transitionToPhase(2);
        }
    }

    _updatePhase2(dt) {
        this.eggLayTimer -= dt;
        this.sacTimer -= dt;

        if (this.sacTimer <= 0) {
            this.sacSwell = !this.sacSwell;
            this.sacTimer = this.sacSwell ? 3.0 : 5.0;
        }

        if (this.eggLayTimer <= 0 && this.enemyManager) {
            this.eggLayTimer = 4.0;
            const pos = this.position.clone();
            pos.y = 0.5;
            const egg = { mesh: new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0x88ff00, emissive: 0x44aa00, emissiveIntensity: 0.5 })
            ), timer: 5, pos };
            egg.mesh.position.copy(pos);
            this.scene.add(egg.mesh);
            this.eggs.push(egg);
        }

        // Hatch eggs after 5s
        for (let i = this.eggs.length - 1; i >= 0; i--) {
            this.eggs[i].timer -= dt;
            if (this.eggs[i].timer <= 0) {
                this.scene.remove(this.eggs[i].mesh);
                if (this.enemyManager) {
                    this.enemyManager.spawnEnemy('brawler', { position: this.eggs[i].pos });
                }
                this.eggs.splice(i, 1);
            }
        }

        if (this.health <= this.maxHealth * 0.25) {
            this._transitionToPhase(3);
        }
    }

    destroyEgg(index) {
        if (index >= 0 && index < this.eggs.length) {
            this.scene.remove(this.eggs[index].mesh);
            this.eggs.splice(index, 1);
            this.health -= 100;
        }
    }

    _updatePhase3(dt) {
        // Fast circular flight
        this.flightAngle += dt * 1.5;
        this.position.x = Math.cos(this.flightAngle) * this.flightRadius;
        this.position.z = Math.sin(this.flightAngle) * this.flightRadius;
        this.position.y = 4 + Math.sin(this.flightAngle * 2) * 2;
        this.group.position.copy(this.position);
        this.group.lookAt(
            this.position.x + Math.cos(this.flightAngle + 0.5),
            this.position.y,
            this.position.z + Math.sin(this.flightAngle + 0.5)
        );
    }

    _transitionToPhase(phase) {
        this.currentPhase = phase;
    }

    takeDamage(amount, type, source) {
        if (this.isDead) return 0;
        if (this.currentPhase === 2 && this.sacSwell) {
            amount *= 2.0; // sac is vulnerable when swollen
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
            new THREE.ConeGeometry(1.2, 3, 8),
            new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 0.8 })
        );
        body.rotation.x = Math.PI;
        body.position.y = 1.5;
        this.group.add(body);

        // Abdomen sac
        const sac = new THREE.Mesh(
            new THREE.SphereGeometry(1, 12, 12),
            new THREE.MeshStandardMaterial({ color: 0x88ff00, emissive: 0x44aa00, emissiveIntensity: 0.3, transparent: true, opacity: 0.8 })
        );
        sac.position.set(0, 0.5, -1);
        this.sacMesh = sac;
        this.group.add(sac);

        // Wings
        for (let i = 0; i < 2; i++) {
            const wing = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 1),
                new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
            );
            wing.position.set(i === 0 ? -1 : 1, 2, 0);
            wing.rotation.y = i === 0 ? 0.3 : -0.3;
            this.group.add(wing);
        }
    }

    _updateVisuals() {
        if (this.sacMesh) {
            const scale = this.sacSwell ? 1.4 : 1.0;
            this.sacMesh.scale.setScalar(scale);
            this.sacMesh.material.emissiveIntensity = this.sacSwell ? 1.5 : 0.3;
        }
    }
}
