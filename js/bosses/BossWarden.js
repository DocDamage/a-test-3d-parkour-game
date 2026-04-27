/**
 * BossWarden — security-themed boss with turrets and prisoner release.
 *
 * Phases:
 *   1: Ranged suppressive fire from guard towers. Grapple to towers and takedown snipers.
 *   2: Releases prisoner drones (friendly to player, fight Warden's drones).
 *   3: Warden descends, shield + shock baton. Must parry 3 times to break shield.
 * Weak Point: Back panel (only exposed during baton overcharge animation).
 */

import * as THREE from 'three';

export class BossWarden {
    constructor(scene, world, player, enemyManager) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.enemyManager = enemyManager;

        this.currentPhase = 1;
        this.health = 2500;
        this.maxHealth = 2500;
        this.isActive = false;
        this.isDead = false;

        // Phase 1: guard towers
        this.towers = [{ alive: true, pos: new THREE.Vector3(-10, 5, 0) }, { alive: true, pos: new THREE.Vector3(10, 5, 0) }];
        this.suppressionTimer = 0;

        // Phase 2: prisoners
        this.prisonersReleased = false;

        // Phase 3: shield + baton
        this.shieldActive = true;
        this.parryCount = 0;
        this.battonOvercharge = false;
        this.overchargeTimer = 0;

        this.group = new THREE.Group();
        this.scene.add(this.group);
        this._buildMesh();
        this.position = new THREE.Vector3(0, 3, 0);
        this.group.position.copy(this.position);
    }

    start() {
        this.isActive = true;
        this.currentPhase = 1;
        this.health = this.maxHealth;
        this.towers.forEach(t => t.alive = true);
        this.prisonersReleased = false;
        this.shieldActive = true;
        this.parryCount = 0;
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
        this.suppressionTimer -= dt;
        if (this.suppressionTimer <= 0) {
            this.suppressionTimer = 0.8;
            // Fire at player from each alive tower
            for (const tower of this.towers) {
                if (!tower.alive || !this.player) continue;
                if (this.player.takeDamage) this.player.takeDamage(8, 'energy', this);
            }
        }
        // Transition when both towers destroyed
        if (!this.towers.some(t => t.alive)) {
            this._transitionToPhase(2);
        }
    }

    destroyTower(index) {
        if (index >= 0 && index < this.towers.length) {
            this.towers[index].alive = false;
            this.health -= 400;
        }
    }

    _updatePhase2(dt) {
        if (!this.prisonersReleased) {
            this.prisonersReleased = true;
            if (this.enemyManager) {
                for (let i = 0; i < 4; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const pos = new THREE.Vector3(Math.cos(angle) * 6, 3, Math.sin(angle) * 6);
                    this.enemyManager.spawnEnemy('brawler', { position: pos, team: 'player', isElite: false });
                }
            }
        }
        if (this.health <= this.maxHealth * 0.45) {
            this._transitionToPhase(3);
        }
    }

    _updatePhase3(dt) {
        // Move toward player
        if (this.player) {
            const dir = new THREE.Vector3().subVectors(this.player.position, this.position).normalize();
            this.position.addScaledVector(dir, 2.5 * dt);
            this.group.position.copy(this.position);
            this.group.lookAt(this.player.position.x, this.position.y, this.player.position.z);
        }

        // Baton overcharge cycle
        this.overchargeTimer -= dt;
        if (this.overchargeTimer <= 0) {
            this.battonOvercharge = !this.battonOvercharge;
            this.overchargeTimer = this.battonOvercharge ? 3.0 : 4.0;
        }

        // Melee attack
        if (this.player && this.position.distanceTo(this.player.position) < 2.0) {
            if (this.player.takeDamage) this.player.takeDamage(15, 'electric', this);
        }
    }

    _transitionToPhase(phase) {
        this.currentPhase = phase;
    }

    takeDamage(amount, type, source) {
        if (this.isDead) return 0;
        if (this.currentPhase === 3 && this.shieldActive) {
            amount *= 0.05; // 95% blocked by shield
        }
        if (this.currentPhase === 3 && this.battonOvercharge && source === this.player) {
            // Back panel exposed during overcharge — bonus damage
            amount *= 2.5;
        }
        this.health -= amount;
        if (this.health <= 0) this.die();
        return amount;
    }

    onParried() {
        if (this.currentPhase === 3) {
            this.parryCount++;
            if (this.parryCount >= 3) {
                this.shieldActive = false;
            }
        }
    }

    die() {
        this.isDead = true;
        this.isActive = false;
        setTimeout(() => { if (this.group) this.group.visible = false; }, 3000);
    }

    _buildMesh() {
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1.2, 2.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x4444ff, emissive: 0x1111aa, emissiveIntensity: 0.4, metalness: 0.7 })
        );
        body.position.y = 1.25;
        this.group.add(body);

        // Shield bubble
        const shieldGeo = new THREE.SphereGeometry(1.8, 16, 16);
        const shieldMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.15, wireframe: true });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.shieldMesh.position.y = 1.5;
        this.group.add(this.shieldMesh);

        // Baton
        const baton = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8),
            new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, emissiveIntensity: 1 })
        );
        baton.position.set(1.2, 1.5, 0);
        baton.rotation.z = -0.3;
        this.group.add(baton);
    }

    _updateVisuals() {
        if (this.shieldMesh) {
            this.shieldMesh.visible = this.currentPhase === 3 && this.shieldActive;
            this.shieldMesh.material.opacity = this.battonOvercharge ? 0.05 : 0.15;
        }
    }
}
