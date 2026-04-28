/**
 * ParkourCallbackWiring — wires dormant Player.js parkour callbacks to actual effects.
 * Provides implementations for onLedgeTakedown, onVaultStrike, onBackflipKick,
 * onRollHit, onWallKick, onTicTac, onAirDodge, onDoubleJump, onCornerKick,
 * onDiveStart, onDiveLand, onFatality, onSprayTag.
 */

import * as THREE from 'three';
import { Hitbox } from './HitboxSystem.js';

export class ParkourCallbackWiring {
    constructor(player, hitboxSystem, damageSystem, particleEffects, trickSystem) {
        this.player = player;
        this.hitboxSystem = hitboxSystem;
        this.damageSystem = damageSystem;
        this.particleEffects = particleEffects;
        this.trickSystem = trickSystem;
        this._wireCallbacks();
    }

    _wireCallbacks() {
        // Ledge takedown: vault over enemy on ledge = instant kill
        this.player.onLedgeTakedown = (enemy) => {
            if (!enemy || enemy.isDead) return;
            if (enemy.takeDamage) enemy.takeDamage(9999, 'parkour', this.player);
            else enemy.isDead = true;
            if (this.particleEffects) this.particleEffects.explosion(enemy.position.clone(), 0xffaa00, 10);
            if (this.trickSystem) this.trickSystem.reportTrick('VAULT', { bonusMul: 2 });
        };

        // Vault strike: vault into enemy = knee strike
        this.player.onVaultStrike = (enemy) => {
            if (!enemy || enemy.isDead) return;
            const dmg = 30;
            if (enemy.takeDamage) enemy.takeDamage(dmg, 'kinetic', this.player);
            if (this.particleEffects) this.particleEffects.burst(enemy.position.clone(), 0xffaa00, 6);
        };

        // Backflip kick: backflip off wall into enemy
        this.player.onBackflipKick = (enemy) => {
            if (!enemy || enemy.isDead) return;
            const dmg = 40;
            if (enemy.takeDamage) enemy.takeDamage(dmg, 'kinetic', this.player);
            // Launch enemy upward
            if (enemy.velocity) enemy.velocity.y = 8;
            if (this.particleEffects) this.particleEffects.burst(enemy.position.clone(), 0x00aaff, 8);
            if (this.trickSystem) this.trickSystem.reportTrick('WALLKICK', { bonusMul: 1.5 });
        };

        // Roll hit: roll into enemy = trip
        this.player.onRollHit = (enemy) => {
            if (!enemy || enemy.isDead) return;
            const dmg = 20;
            if (enemy.takeDamage) enemy.takeDamage(dmg, 'kinetic', this.player);
            // Stun / trip
            if (enemy._stunTimer !== undefined) enemy._stunTimer = 2.0;
            if (this.particleEffects) this.particleEffects.burst(enemy.position.clone(), 0xaaaaaa, 5);
        };

        // Wall kick into enemy
        this.player.onWallKick = (enemy) => {
            if (!enemy || enemy.isDead) return;
            const dmg = 35;
            if (enemy.takeDamage) enemy.takeDamage(dmg, 'kinetic', this.player);
            const knockback = new THREE.Vector3(Math.sin(this.player.facing || 0), 0.3, Math.cos(this.player.facing || 0)).multiplyScalar(10);
            if (enemy.velocity) {
                enemy.velocity.x += knockback.x;
                enemy.velocity.y += knockback.y;
                enemy.velocity.z += knockback.z;
            }
            if (this.trickSystem) this.trickSystem.reportTrick('WALLKICK', { bonusMul: 1.2 });
        };

        // Tic-tac
        this.player.onTicTac = (chainCount) => {
            if (this.trickSystem) this.trickSystem.reportTrick('TICTAC', { bonusMul: 1 + chainCount * 0.2 });
        };

        // Air dodge
        this.player.onAirDodge = () => {
            if (this.trickSystem) this.trickSystem.reportTrick('AIR_DODGE');
        };

        // Double jump
        this.player.onDoubleJump = () => {
            if (this.trickSystem) this.trickSystem.reportTrick('DOUBLE_JUMP');
        };

        // Corner kick
        this.player.onCornerKick = () => {
            if (this.trickSystem) this.trickSystem.reportTrick('CORNER_KICK');
        };

        // Dive start
        this.player.onDiveStart = () => {
            if (this.particleEffects) this.particleEffects.burst(this.player.position, 0xaaaaaa, 4);
        };

        // Dive land
        this.player.onDiveLand = (pos, damage, radius) => {
            if (this.particleEffects) this.particleEffects.explosion(pos.clone(), 0x888888, 12);
            // AOE damage
            if (this.hitboxSystem) {
                const hb = new Hitbox(
                    { position: pos }, 'explosion',
                    { type: 'sphere', radius }, new THREE.Vector3(0, 0, 0), 0.2
                );
                hb.damage = damage;
                hb.team = 'player';
                this.hitboxSystem.registerHitbox(hb);
            }
            if (this.trickSystem) this.trickSystem.reportTrick('DIVE_ROLL');
        };

        // Fatality
        this.player.onFatality = (type, pos) => {
            if (this.trickSystem) this.trickSystem.reportTrick('FATALITY');
            if (this.particleEffects) {
                this.particleEffects.explosion(pos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xff0000, 20);
            }
        };

        // Spray tag
        this.player.onSprayTag = (bonusMul) => {
            if (this.trickSystem) this.trickSystem.reportTrick('SPRAY_TAG', { bonusMul });
        };
    }
}
