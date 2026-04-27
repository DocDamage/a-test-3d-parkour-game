import * as THREE from 'three';
import { Hitbox } from './HitboxSystem.js';

/**
 * LegendaryPowerSystem.js
 * Executes legendary affix powers from equipped gear.
 */
export class LegendaryPowerSystem {
    constructor(player, world, scene, hitboxSystem, damageSystem, bulletTime, enemyHealthBars = []) {
        this.player = player;
        this.world = world;
        this.scene = scene;
        this.hitboxSystem = hitboxSystem;
        this.damageSystem = damageSystem;
        this.bulletTime = bulletTime;
        this.enemyHealthBars = enemyHealthBars;
        this.activePowers = [];
        this._meleeHitCount = 0;
        this._secondLifeCooldown = 0;
        this._adrenalineSurgeActive = false;
    }

    getActivePowers(player) {
        // Read from ExoSuitSystem if available via player or global reference
        // Since we don't have direct reference to exoSuit here, caller must refresh
        return this.activePowers;
    }

    refreshPowers(equippedAffixes) {
        const powers = [];
        if (equippedAffixes) {
            for (const affix of equippedAffixes) {
                if (affix && affix.power) {
                    powers.push(affix);
                }
            }
        }
        this.activePowers = powers;
        // Omniscience: always visible health bars
        if (this._hasPower('omniscience')) {
            for (const bar of this.enemyHealthBars) {
                if (bar) bar.alwaysVisible = true;
            }
        } else {
            for (const bar of this.enemyHealthBars) {
                if (bar) bar.alwaysVisible = false;
            }
        }
    }

    _hasPower(id) {
        return this.activePowers.some(a => a.power === id);
    }

    _getPowerValue(id, defaultVal) {
        const p = this.activePowers.find(a => a.power === id);
        return p ? (p.value || defaultVal) : defaultVal;
    }

    update(dt) {
        if (this._secondLifeCooldown > 0) {
            this._secondLifeCooldown -= dt;
        }

        // Adrenaline Surge passive check
        if (this._hasPower('adrenaline_surge')) {
            const hpPct = this.player.health / this.player.maxHealth;
            const wasActive = this._adrenalineSurgeActive;
            this._adrenalineSurgeActive = hpPct < 0.30;
            if (this._adrenalineSurgeActive && !wasActive) {
                if (this.player.characterSheet) {
                    this.player.characterSheet.addTempBonus('adrenaline_surge', 'damageMultiplier', 0.20, 1);
                    this.player.moveSpeedMultiplier *= 1.15;
                }
            } else if (!this._adrenalineSurgeActive && wasActive) {
                this.player.moveSpeedMultiplier /= 1.15;
            }
        }
    }

    onMeleeHit(target) {
        if (!target) return;

        // Fabricator's Torch
        if (this._hasPower('fabricators_torch')) {
            target._burning = { dmg: 20, duration: 4, tick: 0 };
        }

        // Chain Lightning
        if (this._hasPower('chain_lightning')) {
            this._arcChainLightning(target);
        }

        // Kinetic Cascade (3rd hit)
        if (this._hasPower('kinetic_cascade')) {
            this._meleeHitCount++;
            if (this._meleeHitCount >= 3) {
                this._meleeHitCount = 0;
                this._shockwave();
            }
        }

        // Void Walk (sprint-through phasing) — handled in onSprint
    }

    onJump(isDoubleJump) {
        if (isDoubleJump && this._hasPower('temporal_shift')) {
            if (this.bulletTime && this.bulletTime.start) {
                this.bulletTime.start(0.5);
            }
        }
    }

    onSprint(dt) {
        if (this._hasPower('void_walk')) {
            const drones = this.world?.drones?.drones || [];
            for (const drone of drones) {
                if (drone.isDead) continue;
                const pos = drone.position || (drone.mesh && drone.mesh.position);
                if (!pos) continue;
                if (pos.distanceTo(this.player.position) < 1.5) {
                    drone._ethereal = true;
                    drone._etherealTimer = 2;
                }
            }
        }
    }

    onDamageDealt(target, amount) {
        if (!target) return amount;
        // Boss Slayer
        if (this._hasPower('boss_slayer') && target.isBoss) {
            const bonus = this._getPowerValue('boss_slayer', 0.25);
            return amount * (1 + bonus);
        }
        return amount;
    }

    onTakeFatalDamage() {
        // Second Life
        if (this._hasPower('second_life') && this._secondLifeCooldown <= 0) {
            this._secondLifeCooldown = 300; // 5 minutes
            const healAmount = this.player.maxHealth * 0.30;
            this.player.health = healAmount;
            this.player.isDead = false;
            return true;
        }
        return false;
    }

    onEnemyKilled(enemy) {
        if (!enemy) return;
        // Swarm Link
        if (this._hasPower('swarm_link')) {
            if (Math.random() < 0.20) {
                this._spawnAlliedDrone(enemy.position || (enemy.mesh && enemy.mesh.position));
            }
        }
    }

    onPerfectParry() {
        if (this._hasPower('aegis_field')) {
            this.player._shield = 30;
            this.player._shieldTimer = 3;
        }
    }

    _arcChainLightning(sourceTarget) {
        const drones = this.world?.drones?.drones || [];
        const srcPos = sourceTarget.position || (sourceTarget.mesh && sourceTarget.mesh.position);
        if (!srcPos) return;
        let arcs = 0;
        for (const drone of drones) {
            if (drone === sourceTarget || drone.isDead) continue;
            const pos = drone.position || (drone.mesh && drone.mesh.position);
            if (!pos) continue;
            if (pos.distanceTo(srcPos) < 6 && arcs < 2) {
                arcs++;
                if (drone.takeDamage) drone.takeDamage(0.5 * (sourceTarget.lastDamageTaken || 15), 'electric', this.player);
                // Visual arc
                this._spawnArc(srcPos, pos, 0xaa66ff);
            }
        }
    }

    _shockwave() {
        const pos = this.player.position.clone();
        const hitbox = new Hitbox(
            this.player, 'explosion', { type: 'sphere', radius: 4 }, new THREE.Vector3(0, 0, 0), 0.3
        );
        hitbox.damage = 30;
        hitbox.team = 'player';
        this.hitboxSystem.registerHitbox(hitbox);
        // Visual ring
        if (this.scene) {
            const geo = new THREE.RingGeometry(0.1, 0.3, 32);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(geo, mat);
            ring.position.copy(pos);
            ring.rotation.x = -Math.PI / 2;
            this.scene.add(ring);
            let life = 0.4;
            const anim = () => {
                life -= 0.016;
                const s = 1 + (0.4 - life) * 20;
                ring.scale.set(s, s, s);
                mat.opacity = Math.max(0, life / 0.4);
                if (life > 0) requestAnimationFrame(anim);
                else { this.scene.remove(ring); geo.dispose(); mat.dispose(); }
            };
            anim();
        }
    }

    _spawnAlliedDrone(pos) {
        if (!pos || !this.world || !this.world.drones) return;
        const drone = this.world.drones.addDrone({
            position: pos.clone(),
            waypoints: [pos.clone().add(new THREE.Vector3(5, 0, 0)), pos.clone().add(new THREE.Vector3(-5, 0, 0))],
            faction: 'player'
        });
        if (drone) {
            drone.team = 'player';
        }
    }

    _spawnArc(from, to, color) {
        const mid = from.clone().add(to).multiplyScalar(0.5);
        mid.y += 0.5;
        const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
        const points = curve.getPoints(8);
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
        const line = new THREE.Line(geo, mat);
        this.scene.add(line);
        let life = 0.15;
        const anim = () => {
            life -= 0.016;
            mat.opacity = Math.max(0, life / 0.15);
            if (life > 0) requestAnimationFrame(anim);
            else { this.scene.remove(line); geo.dispose(); mat.dispose(); }
        };
        anim();
    }

}
