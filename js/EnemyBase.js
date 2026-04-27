/**
 * EnemyBase — abstract base for all enemy types.
 *
 * Subclasses override:
 *   _chooseBehaviour(dt, player)   — AI state machine
 *   _getAttackDamage()             — melee damage
 *   _getAttackRange()              — melee reach
 *   _getAttackCooldown()           — seconds between attacks
 */

import * as THREE from 'three';

export class EnemyBase {
    constructor(scene, world, config = {}) {
        this.scene = scene;
        this.world = world;

        // Stats
        this.maxHealth = config.maxHealth || 40;
        this.health = this.maxHealth;
        this.speed = config.speed || 2.5;
        this.isDead = false;
        this.team = config.team || 'enemy';
        this.faction = config.faction || 'vanguard';
        this.isElite = config.isElite || false;
        this.type = config.type || 'base';

        // Combat
        this.attackCooldown = 0;
        this._attackDamage = config.attackDamage || 10;
        this._attackRange = config.attackRange || 1.5;
        this._attackCooldownTime = config.attackCooldown || 1.5;

        // Status effects
        this._feared = false;
        this._disabled = false;
        this._hackExpiry = 0;
        this._ethereal = false;
        this._etherealTimer = 0;
        this._smokeBlind = false;
        this._burning = null;

        // Vision
        this.visionRange = config.visionRange || 10;
        this.visionHalfAngle = config.visionHalfAngle || (Math.PI / 8);
        this.detection = 0;
        this.timeInCone = 0;

        // State
        this.state = 'PATROL';
        this.lastKnownPosition = new THREE.Vector3();

        // Callbacks
        this.onDeath = null;
        this.onDamageTaken = null;

        // Visuals — subclasses override _buildMesh()
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this._buildMesh(config);

        // Position
        if (config.position) {
            this.group.position.copy(config.position);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Per-frame update                                                  */
    /* ------------------------------------------------------------------ */

    update(dt, player) {
        if (this.isDead) return;
        if (this._disabled) return;

        // Hack expiry
        if (this._hackExpiry > 0) {
            this._hackExpiry -= dt;
            if (this._hackExpiry <= 0) {
                this.team = 'enemy';
                this._hackExpiry = 0;
            }
        }

        // Ethereal timer
        if (this._etherealTimer > 0) {
            this._etherealTimer -= dt;
            if (this._etherealTimer <= 0) this._ethereal = false;
        }

        // Burning DoT
        if (this._burning) {
            this._burning.tick -= dt;
            if (this._burning.tick <= 0) {
                this._burning.tick = 1.0;
                this._burning.duration -= 1.0;
                this.takeDamage(this._burning.dmg, 'energy', null);
                if (this._burning.duration <= 0) this._burning = null;
            }
        }

        this.attackCooldown -= dt;

        // Feared: flee
        if (this._feared && player) {
            const away = this.group.position.clone().sub(player.position).normalize();
            this.group.position.addScaledVector(away, this.speed * dt * 1.5);
            this._updateVisuals();
            return;
        }

        // Smoke blind: pause
        if (this._smokeBlind) {
            this._updateVisuals();
            return;
        }

        // Delegate behaviour to subclass
        this._chooseBehaviour(dt, player);
        this._updateVisuals();
    }

    /* ------------------------------------------------------------------ */
    /*  Combat                                                            */
    /* ------------------------------------------------------------------ */

    takeDamage(amount, type = 'kinetic', source = null) {
        if (this.isDead) return 0;
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die(source);
        }
        if (this.onDamageTaken) this.onDamageTaken(amount, type, source);
        return amount;
    }

    die(source = null) {
        this.isDead = true;
        this.state = 'DEAD';
        if (this.onDeath) this.onDeath(this, source);
        setTimeout(() => { if (this.group) this.group.visible = false; }, 2000);
    }

    getHealthPercent() {
        return this.maxHealth > 0 ? this.health / this.maxHealth : 0;
    }

    get position() {
        return this.group.position;
    }

    /* ------------------------------------------------------------------ */
    /*  Vision                                                            */
    /* ------------------------------------------------------------------ */

    checkVision(player) {
        const toPlayer = new THREE.Vector3().subVectors(player.position, this.group.position);
        const dist = toPlayer.length();
        if (dist > this.visionRange) return false;

        const dir = toPlayer.clone().normalize();
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
        const angle = Math.acos(THREE.MathUtils.clamp(forward.dot(dir), -1, 1));
        if (angle > this.visionHalfAngle) return false;

        // Line-of-sight
        if (this.world && this.world.collidables) {
            const ray = new THREE.Ray(this.group.position, dir);
            for (const obj of this.world.collidables) {
                const box = new THREE.Box3().setFromObject(obj);
                const hit = new THREE.Vector3();
                if (ray.intersectBox(box, hit) !== null) {
                    const hitDist = this.group.position.distanceTo(hit);
                    if (hitDist < dist - 0.4) return false;
                }
            }
        }
        return true;
    }

    /* ------------------------------------------------------------------ */
    /*  Melee attack helper                                               */
    /* ------------------------------------------------------------------ */

    _tryMeleeAttack(target, damageSystem = null) {
        if (!target || this.attackCooldown > 0) return false;
        const dist = this.group.position.distanceTo(target.position);
        if (dist > this._attackRange) return false;

        const ds = damageSystem || this._damageSystem || null;
        if (ds) {
            ds.applyDamage(this, target, this._attackDamage, 'kinetic');
        } else if (target.takeDamage) {
            target.takeDamage(this._attackDamage, 'kinetic', this);
        }
        this.attackCooldown = this._attackCooldownTime;
        return true;
    }

    /* ------------------------------------------------------------------ */
    /*  Subclass hooks                                                    */
    /* ------------------------------------------------------------------ */

    _chooseBehaviour(dt, player) {
        // Override in subclass
    }

    _buildMesh(config) {
        // Override in subclass
        const geo = new THREE.SphereGeometry(0.3, 16, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0x0088ff });
        this.body = new THREE.Mesh(geo, mat);
        this.group.add(this.body);
    }

    _updateVisuals() {
        // Override in subclass
    }

    getMeshes() {
        return [this.group];
    }
}
