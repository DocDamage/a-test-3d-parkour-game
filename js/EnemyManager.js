/**
 * EnemyManager — spawn orchestrator and factory for all enemy types.
 *
 * Usage:
 *   const mgr = new EnemyManager(scene, world, player);
 *   mgr.setDamageSystem(damageSystem);
 *   const brawler = mgr.spawnEnemy('brawler', { position: new THREE.Vector3(10, 3, 5) });
 *   mgr.spawnSquad('assault', centerPosition);
 *   mgr.update(dt);
 */

import * as THREE from 'three';
import { EnemyBase } from './EnemyBase.js';

/* ------------------------------------------------------------------ */
/*  Enemy type definitions                                            */
/* ------------------------------------------------------------------ */

const ENEMY_TYPES = {
    brawler: {
        maxHealth: 80, speed: 3.0, attackDamage: 12, attackRange: 1.2, attackCooldown: 1.2,
        color: 0xff4444, emissive: 0xaa0000,
        desc: 'Charges, melee range, blocks frontal attacks'
    },
    shield: {
        maxHealth: 60, speed: 2.0, attackDamage: 8, attackRange: 1.5, attackCooldown: 1.5,
        color: 0x4488ff, emissive: 0x0044aa,
        desc: 'Frontal energy shield, invulnerable from front'
    },
    turret: {
        maxHealth: 40, speed: 0, attackDamage: 6, attackRange: 12, attackCooldown: 0.4,
        color: 0xffaa00, emissive: 0xaa6600,
        desc: 'Stationary, 180° arc suppression fire'
    },
    suicide: {
        maxHealth: 30, speed: 5.0, attackDamage: 50, attackRange: 1.0, attackCooldown: 0.1,
        color: 0xff00ff, emissive: 0xaa00aa,
        desc: 'Rushes player, explodes on contact'
    },
    sapper: {
        maxHealth: 50, speed: 2.5, attackDamage: 10, attackRange: 1.5, attackCooldown: 2.0,
        color: 0x88ff00, emissive: 0x44aa00,
        desc: 'Destroys platforms/collidables near player'
    },
    jammer: {
        maxHealth: 45, speed: 2.2, attackDamage: 0, attackRange: 10, attackCooldown: 5.0,
        color: 0x00ffff, emissive: 0x00aaaa,
        desc: 'Disables grapple, dash, magnet boots in 10m'
    },
    medic: {
        maxHealth: 35, speed: 2.0, attackDamage: 5, attackRange: 8, attackCooldown: 2.0,
        color: 0xffffff, emissive: 0xaaaaaa,
        desc: 'Heals other drones, low HP, stays back'
    },
    phantom: {
        maxHealth: 55, speed: 3.5, attackDamage: 15, attackRange: 1.5, attackCooldown: 1.0,
        color: 0x666666, emissive: 0x333333,
        desc: 'Cloaked, visible only in Runner Vision'
    },
    command: {
        maxHealth: 70, speed: 2.0, attackDamage: 10, attackRange: 1.5, attackCooldown: 1.2,
        color: 0xffd700, emissive: 0xaa8800,
        desc: 'Buffs nearby drones (+25% speed, +50% damage)'
    },
    minelayer: {
        maxHealth: 45, speed: 2.0, attackDamage: 8, attackRange: 1.5, attackCooldown: 1.5,
        color: 0xff6600, emissive: 0xaa4400,
        desc: 'Drops proximity mines while patrolling'
    },
};

/* ------------------------------------------------------------------ */
/*  Concrete enemy classes                                            */
/* ------------------------------------------------------------------ */

class BrawlerEnemy extends EnemyBase {
    _buildMesh(cfg) {
        const geo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color || 0xff4444,
            emissive: cfg.emissive || 0xaa0000,
            emissiveIntensity: cfg.isElite ? 1.2 : 0.6,
            roughness: 0.4, metalness: 0.5
        });
        this.body = new THREE.Mesh(geo, mat);
        this.group.add(this.body);
        if (cfg.isElite) {
            const glow = new THREE.Mesh(
                new THREE.BoxGeometry(0.7, 0.7, 0.7),
                new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, transparent: true, opacity: 0.3 })
            );
            this.group.add(glow);
            this._eliteGlow = glow;
        }
    }

    _chooseBehaviour(dt, player) {
        if (!player) return;
        const dist = this.group.position.distanceTo(player.position);
        const canSee = this.checkVision(player);

        if (canSee || dist < 5) {
            this.state = 'CHASE';
            const dir = new THREE.Vector3().subVectors(player.position, this.group.position).normalize();
            this.group.position.addScaledVector(dir, this.speed * dt);
            this.group.lookAt(player.position.x, this.group.position.y, player.position.z);
            if (dist < this._attackRange) this._tryMeleeAttack(player);
        } else {
            this.state = 'PATROL';
        }

        if (this._eliteGlow) {
            this._eliteGlow.rotation.y += dt * 2;
        }
    }
}

class ShieldEnemy extends EnemyBase {
    _buildMesh(cfg) {
        const geo = new THREE.CylinderGeometry(0.3, 0.35, 0.7, 8);
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color || 0x4488ff,
            emissive: cfg.emissive || 0x0044aa,
            emissiveIntensity: cfg.isElite ? 1.2 : 0.6,
            roughness: 0.3, metalness: 0.7
        });
        this.body = new THREE.Mesh(geo, mat);
        this.group.add(this.body);
        // Shield mesh (front-facing plane)
        const shieldGeo = new THREE.PlaneGeometry(0.8, 0.8);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: 0x44aaff, transparent: true, opacity: 0.4, side: THREE.DoubleSide
        });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.shieldMesh.position.set(0, 0, 0.4);
        this.group.add(this.shieldMesh);
        this._shieldActive = true;
    }

    _chooseBehaviour(dt, player) {
        if (!player) return;
        const dist = this.group.position.distanceTo(player.position);
        const canSee = this.checkVision(player);

        if (canSee || dist < 6) {
            this.state = 'CHASE';
            const dir = new THREE.Vector3().subVectors(player.position, this.group.position).normalize();
            this.group.position.addScaledVector(dir, this.speed * dt);
            this.group.lookAt(player.position.x, this.group.position.y, player.position.z);
            if (dist < this._attackRange) this._tryMeleeAttack(player);
        } else {
            this.state = 'PATROL';
        }
    }

    takeDamage(amount, type, source) {
        // Shield blocks frontal damage
        if (this._shieldActive && source) {
            const toSource = new THREE.Vector3().subVectors(
                source.position || this.group.position, this.group.position
            ).normalize();
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
            const angle = Math.acos(THREE.MathUtils.clamp(forward.dot(toSource), -1, 1));
            if (angle < Math.PI / 3) {
                amount *= 0.1; // 90% blocked from front
            }
        }
        return super.takeDamage(amount, type, source);
    }
}

class TurretEnemy extends EnemyBase {
    _buildMesh(cfg) {
        const geo = new THREE.ConeGeometry(0.3, 0.6, 8);
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color || 0xffaa00,
            emissive: cfg.emissive || 0xaa6600,
            emissiveIntensity: cfg.isElite ? 1.2 : 0.6,
            roughness: 0.4, metalness: 0.6
        });
        this.body = new THREE.Mesh(geo, mat);
        this.group.add(this.body);
        // Barrel
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.3;
        this.group.add(barrel);
    }

    _chooseBehaviour(dt, player) {
        if (!player) return;
        const dist = this.group.position.distanceTo(player.position);
        const canSee = this.checkVision(player);

        if (canSee && dist < this._attackRange) {
            this.state = 'ATTACK';
            this.group.lookAt(player.position.x, this.group.position.y, player.position.z);
            if (this.attackCooldown <= 0) {
                // Turret "projectile" — raycast damage
                const ds = this._damageSystem || null;
                if (ds) ds.applyDamage(this, player, this._attackDamage, 'energy');
                else if (player.takeDamage) player.takeDamage(this._attackDamage, 'energy', this);
                this.attackCooldown = this._attackCooldownTime;
            }
        } else {
            this.state = 'IDLE';
            // Slowly scan
            this.group.rotation.y += dt * 0.5;
        }
    }
}

class SuicideEnemy extends EnemyBase {
    _buildMesh(cfg) {
        const geo = new THREE.IcosahedronGeometry(0.25, 0);
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color || 0xff00ff,
            emissive: cfg.emissive || 0xaa00aa,
            emissiveIntensity: cfg.isElite ? 1.5 : 0.8,
            roughness: 0.2, metalness: 0.3
        });
        this.body = new THREE.Mesh(geo, mat);
        this.group.add(this.body);
    }

    _chooseBehaviour(dt, player) {
        if (!player) return;
        const dist = this.group.position.distanceTo(player.position);
        const canSee = this.checkVision(player);

        if (canSee || dist < 8) {
            this.state = 'CHASE';
            const dir = new THREE.Vector3().subVectors(player.position, this.group.position).normalize();
            this.group.position.addScaledVector(dir, this.speed * dt);
            this.group.lookAt(player.position.x, this.group.position.y, player.position.z);
            if (dist < this._attackRange) {
                // Explode
                const ds = this._damageSystem || null;
                if (ds) ds.applyDamage(this, player, this._attackDamage, 'explosive');
                else if (player.takeDamage) player.takeDamage(this._attackDamage, 'explosive', this);
                this.die(this);
            }
        } else {
            this.state = 'PATROL';
        }
    }
}

class JammerEnemy extends EnemyBase {
    _buildMesh(cfg) {
        const geo = new THREE.OctahedronGeometry(0.3, 0);
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color || 0x00ffff,
            emissive: cfg.emissive || 0x00aaaa,
            emissiveIntensity: cfg.isElite ? 1.2 : 0.6,
            roughness: 0.3, metalness: 0.5
        });
        this.body = new THREE.Mesh(geo, mat);
        this.group.add(this.body);
        // Jamming ring
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.5, 0.02, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 })
        );
        ring.rotation.x = Math.PI / 2;
        this.group.add(ring);
    }

    _chooseBehaviour(dt, player) {
        if (!player) return;
        const dist = this.group.position.distanceTo(player.position);
        if (dist < 10) {
            this.state = 'JAMMING';
            // Jam player abilities
            if (player._jamTimer === undefined) player._jamTimer = 0;
            player._jamTimer = 3.0; // 3s jam refresh
        } else {
            this.state = 'PATROL';
        }
    }
}

class MedicEnemy extends EnemyBase {
    _buildMesh(cfg) {
        const geo = new THREE.SphereGeometry(0.25, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color || 0xffffff,
            emissive: cfg.emissive || 0xaaaaaa,
            emissiveIntensity: cfg.isElite ? 1.2 : 0.6,
            roughness: 0.3, metalness: 0.4
        });
        this.body = new THREE.Mesh(geo, mat);
        this.group.add(this.body);
        // Cross symbol
        const cross = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.25, 0.05),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        this.group.add(cross);
        const cross2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.05, 0.05),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        this.group.add(cross2);
    }

    _chooseBehaviour(dt, player) {
        if (!player) return;
        // Find nearest wounded ally
        let nearest = null;
        let nearestDist = Infinity;
        // Note: allies list should be injected via manager; fallback to empty
        const allies = this._allies || [];
        for (const ally of allies) {
            if (ally === this || ally.isDead || ally.team !== this.team) continue;
            if (ally.getHealthPercent() < 0.5) {
                const d = this.group.position.distanceTo(ally.position);
                if (d < nearestDist) { nearest = ally; nearestDist = d; }
            }
        }

        if (nearest && nearestDist < this._attackRange) {
            this.state = 'HEAL';
            if (this.attackCooldown <= 0) {
                ally.health = Math.min(ally.maxHealth, ally.health + 15);
                this.attackCooldown = this._attackCooldownTime;
            }
        } else if (nearest) {
            this.state = 'CHASE';
            const dir = new THREE.Vector3().subVectors(nearest.position, this.group.position).normalize();
            this.group.position.addScaledVector(dir, this.speed * dt);
        } else {
            // Fallback: stay away from player
            const dist = this.group.position.distanceTo(player.position);
            if (dist < 5) {
                const away = this.group.position.clone().sub(player.position).normalize();
                this.group.position.addScaledVector(away, this.speed * dt);
            }
        }
    }
}

class PhantomEnemy extends EnemyBase {
    _buildMesh(cfg) {
        const geo = new THREE.SphereGeometry(0.28, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color || 0x666666,
            emissive: cfg.emissive || 0x333333,
            emissiveIntensity: cfg.isElite ? 0.4 : 0.2,
            transparent: true, opacity: cfg.isElite ? 0.35 : 0.25,
            roughness: 0.2, metalness: 0.8
        });
        this.body = new THREE.Mesh(geo, mat);
        this.group.add(this.body);
    }

    _chooseBehaviour(dt, player) {
        if (!player) return;
        const dist = this.group.position.distanceTo(player.position);
        const canSee = this.checkVision(player);

        // Cloaked: only visible when very close or in Runner Vision
        const isSpotted = dist < 3 || (player._predatorVisionActive);
        this.body.material.opacity = isSpotted ? 0.6 : 0.15;

        if (canSee && isSpotted) {
            this.state = 'CHASE';
            const dir = new THREE.Vector3().subVectors(player.position, this.group.position).normalize();
            this.group.position.addScaledVector(dir, this.speed * dt);
            this.group.lookAt(player.position.x, this.group.position.y, player.position.z);
            if (dist < this._attackRange) this._tryMeleeAttack(player);
        } else {
            this.state = 'PATROL';
        }
    }
}

class CommandEnemy extends EnemyBase {
    _buildMesh(cfg) {
        const geo = new THREE.CylinderGeometry(0.2, 0.3, 0.7, 8);
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color || 0xffd700,
            emissive: cfg.emissive || 0xaa8800,
            emissiveIntensity: cfg.isElite ? 1.2 : 0.6,
            roughness: 0.3, metalness: 0.6
        });
        this.body = new THREE.Mesh(geo, mat);
        this.group.add(this.body);
        // Command aura
        const aura = new THREE.Mesh(
            new THREE.RingGeometry(0.5, 0.6, 32),
            new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
        );
        aura.rotation.x = -Math.PI / 2;
        this.group.add(aura);
    }

    _chooseBehaviour(dt, player) {
        if (!player) return;
        const dist = this.group.position.distanceTo(player.position);
        const canSee = this.checkVision(player);

        // Buff nearby allies
        const allies = this._allies || [];
        for (const ally of allies) {
            if (ally === this || ally.isDead) continue;
            const d = this.group.position.distanceTo(ally.position);
            if (d < 8) {
                ally._commandBuffed = true;
                ally._commandBuffTimer = 1.0;
            }
        }

        if (canSee || dist < 6) {
            this.state = 'CHASE';
            const dir = new THREE.Vector3().subVectors(player.position, this.group.position).normalize();
            this.group.position.addScaledVector(dir, this.speed * dt);
            this.group.lookAt(player.position.x, this.group.position.y, player.position.z);
            if (dist < this._attackRange) this._tryMeleeAttack(player);
        } else {
            this.state = 'PATROL';
        }
    }
}

class MinelayerEnemy extends EnemyBase {
    _buildMesh(cfg) {
        const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color || 0xff6600,
            emissive: cfg.emissive || 0xaa4400,
            emissiveIntensity: cfg.isElite ? 1.2 : 0.6,
            roughness: 0.4, metalness: 0.5
        });
        this.body = new THREE.Mesh(geo, mat);
        this.group.add(this.body);
        this._mines = [];
    }

    _chooseBehaviour(dt, player) {
        if (!player) return;
        const dist = this.group.position.distanceTo(player.position);
        const canSee = this.checkVision(player);

        // Drop mine every 3 seconds while moving
        if (this.attackCooldown <= 0) {
            this._dropMine();
            this.attackCooldown = 3.0;
        }

        // Check existing mines for player proximity
        for (let i = this._mines.length - 1; i >= 0; i--) {
            const m = this._mines[i];
            if (!m.mesh.parent) { this._mines.splice(i, 1); continue; }
            const md = m.mesh.position.distanceTo(player.position);
            if (md < 1.5) {
                // Explode
                const ds = this._damageSystem || null;
                if (ds) ds.applyDamage(this, player, 25, 'explosive');
                else if (player.takeDamage) player.takeDamage(25, 'explosive', this);
                this.scene.remove(m.mesh);
                this._mines.splice(i, 1);
            }
        }

        if (canSee || dist < 6) {
            this.state = 'CHASE';
            const dir = new THREE.Vector3().subVectors(player.position, this.group.position).normalize();
            this.group.position.addScaledVector(dir, this.speed * dt);
            this.group.lookAt(player.position.x, this.group.position.y, player.position.z);
            if (dist < this._attackRange) this._tryMeleeAttack(player);
        } else {
            this.state = 'PATROL';
        }
    }

    _dropMine() {
        const geo = new THREE.SphereGeometry(0.15, 8, 8);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xff3300, emissive: 0xff0000, emissiveIntensity: 0.8
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(this.group.position);
        mesh.position.y = 0.2;
        this.scene.add(mesh);
        this._mines.push({ mesh, spawnTime: performance.now() * 0.001 });
    }
}

const ENEMY_CLASS_MAP = {
    brawler: BrawlerEnemy,
    shield: ShieldEnemy,
    turret: TurretEnemy,
    suicide: SuicideEnemy,
    sapper: SapperEnemy,
    jammer: JammerEnemy,
    medic: MedicEnemy,
    phantom: PhantomEnemy,
    command: CommandEnemy,
    minelayer: MinelayerEnemy,
};

/* ------------------------------------------------------------------ */
/*  EnemyManager                                                      */
/* ------------------------------------------------------------------ */

export class EnemyManager {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.enemies = [];
        this._damageSystem = null;
        this._onDeathCb = null;
    }

    setOnDeathCallback(cb) {
        this._onDeathCb = cb;
    }

    setDamageSystem(ds) {
        this._damageSystem = ds;
    }

    setPlayer(player) {
        this.player = player;
    }

    spawnEnemy(type, config = {}) {
        const def = ENEMY_TYPES[type];
        if (!def) {
            console.warn(`[EnemyManager] Unknown enemy type: ${type}`);
            return null;
        }

        const ClassCtor = ENEMY_CLASS_MAP[type] || EnemyBase;
        const merged = { ...def, ...config, type };

        // Elite scaling
        if (merged.isElite) {
            merged.maxHealth *= 2;
            merged.attackDamage = Math.round(merged.attackDamage * 1.3);
        }

        const enemy = new ClassCtor(this.scene, this.world, merged);
        enemy._allies = this.enemies;

        if (this._damageSystem) enemy._damageSystem = this._damageSystem;
        if (this._onDeathCb) {
            enemy.onDeath = (e, source) => this._onDeathCb(e, source);
        }

        this.enemies.push(enemy);
        return enemy;
    }

    spawnSquad(squadType, center, radius = 8) {
        const squads = {
            assault: ['brawler', 'brawler', 'command', 'medic'],
            ambush: ['phantom', 'phantom', 'suicide', 'suicide'],
            siege: ['turret', 'turret', 'jammer', 'shield'],
            sapper: ['sapper', 'sapper', 'sapper'],
        };
        const types = squads[squadType] || squads.assault;
        for (let i = 0; i < types.length; i++) {
            const angle = (i / types.length) * Math.PI * 2;
            const pos = new THREE.Vector3(
                center.x + Math.cos(angle) * radius,
                center.y,
                center.z + Math.sin(angle) * radius
            );
            this.spawnEnemy(types[i], { position: pos });
        }
    }

    update(dt) {
        for (const e of this.enemies) {
            e.update(dt, this.player);
        }
    }

    getMeshes() {
        return this.enemies.flatMap(e => e.getMeshes());
    }

    clearDead() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].isDead) {
                this.enemies.splice(i, 1);
            }
        }
    }

    dispose() {
        for (const e of this.enemies) {
            if (e.group) this.scene.remove(e.group);
        }
        this.enemies = [];
    }
}
