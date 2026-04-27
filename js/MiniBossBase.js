/**
 * MiniBossBase — shared lifecycle for mini-bosses.
 *
 * Mini-bosses sit between regular enemies and full bosses:
 *   - 800–1500 HP
 *   - 2 phases: Normal → Enraged at 50%
 *   - No cinematic camera, no arena setup
 *   - Single weak point
 *   - 60s respawn timer
 *   - Guaranteed rare+ drops
 */

import * as THREE from 'three';

export class MiniBossBase {
    constructor(scene, world, player, config = {}) {
        this.scene = scene;
        this.world = world;
        this.player = player;

        this.type = config.type || 'miniboss';
        this.maxHealth = config.maxHealth || 1000;
        this.health = this.maxHealth;
        this.attackDamage = config.attackDamage || 25;
        this.attackRange = config.attackRange || 2.5;
        this.attackCooldown = config.attackCooldown || 2.0;
        this.speed = config.speed || 3.0;
        this.isDead = false;
        this.isActive = false;
        this.currentPhase = 1;
        this.enrageThreshold = config.enrageThreshold || 0.5;

        this._attackTimer = 0;
        this._respawnTimer = 0;
        this._spawnPosition = config.position ? config.position.clone() : new THREE.Vector3(0, 0, 0);
        this._weakPointExposed = false;
        this._weakPointTimer = 0;

        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.position = this._spawnPosition.clone();
        this.group.position.copy(this.position);

        this.onDeath = null;
        this.onDamageTaken = null;
    }

    start() {
        this.isActive = true;
        this.isDead = false;
        this.health = this.maxHealth;
        this.currentPhase = 1;
        this._attackTimer = 0;
        this.group.visible = true;
        this.group.position.copy(this._spawnPosition);
        this.position.copy(this._spawnPosition);
    }

    stop() {
        this.isActive = false;
        this.group.visible = false;
    }

    update(dt) {
        if (!this.isActive) return;
        if (this.isDead) {
            this._respawnTimer -= dt;
            if (this._respawnTimer <= 0) this._respawn();
            return;
        }

        this._attackTimer -= dt;
        if (this._weakPointTimer > 0) {
            this._weakPointTimer -= dt;
            if (this._weakPointTimer <= 0) this._weakPointExposed = false;
        }

        // Phase transition
        const healthPct = this.health / this.maxHealth;
        if (this.currentPhase === 1 && healthPct <= this.enrageThreshold) {
            this._transitionToPhase(2);
        }

        if (this.player && !this.player.isDead) {
            this._updateAI(dt);
        }

        this._updateVisuals(dt);
    }

    _updateAI(dt) {
        // Default: move toward player and attack
        const dist = this.position.distanceTo(this.player.position);
        if (dist > this.attackRange) {
            const dir = this.player.position.clone().sub(this.position).normalize();
            dir.y = 0;
            this.position.addScaledVector(dir, this.speed * dt);
            this.group.position.copy(this.position);
            this.group.lookAt(this.player.position.x, this.position.y, this.player.position.z);
        } else if (this._attackTimer <= 0) {
            this._attack();
            this._attackTimer = this.attackCooldown;
        }
    }

    _attack() {
        // Default melee attack
        if (this.player && this.player.takeDamage) {
            const dmg = this.currentPhase === 2 ? this.attackDamage * 1.5 : this.attackDamage;
            this.player.takeDamage(dmg, 'kinetic', this);
        }
    }

    _transitionToPhase(phase) {
        this.currentPhase = phase;
        // Visual indicator
        if (this._enrageMesh) {
            this._enrageMesh.visible = true;
        }
    }

    _respawn() {
        this.isDead = false;
        this.health = this.maxHealth;
        this.currentPhase = 1;
        this._attackTimer = 0;
        this.position.copy(this._spawnPosition);
        this.group.position.copy(this._spawnPosition);
        this.group.visible = true;
        if (this._enrageMesh) this._enrageMesh.visible = false;
    }

    takeDamage(amount, type, source) {
        if (this.isDead) return 0;
        if (this._weakPointExposed) amount *= 2.0;
        this.health -= amount;
        if (this.onDamageTaken) this.onDamageTaken(amount, type, source);
        if (this.health <= 0) {
            this.health = 0;
            this.die(source);
        }
        return amount;
    }

    die(source) {
        this.isDead = true;
        this._respawnTimer = 60;
        if (this.onDeath) this.onDeath(this, source);
        // Hide after brief delay
        setTimeout(() => { if (this.isDead) this.group.visible = false; }, 2000);
    }

    exposeWeakPoint(duration = 3.0) {
        this._weakPointExposed = true;
        this._weakPointTimer = duration;
    }

    _updateVisuals(dt) {
        // Override in subclasses
    }

    getHealthPercent() {
        return this.maxHealth > 0 ? (this.health / this.maxHealth) : 0;
    }
}
