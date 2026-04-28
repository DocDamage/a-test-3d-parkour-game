/**
 * FatalitySystem — quick contextual executions on low-HP enemies.
 * Auto-prompts when enemy HP < 25% and within melee range.
 * Press F when skull icon visible. Brief slow-mo + invincibility + style bonus.
 */

import * as THREE from 'three';

export const FINISHER_TYPES = {
    LEDGE_KICK: 'ledge_kick',
    WALL_SLAM: 'wall_slam',
    GROUND_STOMP: 'ground_stomp',
    AERIAL_SPIKE: 'aerial_spike',
    BACK_BREAKER: 'back_breaker',
};

export class FatalitySystem {
    constructor(scene, player, particleEffects = null) {
        this.scene = scene;
        this.player = player;
        this.particleEffects = particleEffects;
        this.promptRange = 3.0;
        this.hpThreshold = 0.25;
        this.isExecuting = false;
        this.executeTimer = 0;
        this.slowMoTimer = 0;
        this.promptedEnemy = null;
        this._promptMesh = null;
        this._buildPromptMesh();
    }

    _buildPromptMesh() {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠', 32, 32);
        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        this._promptMesh = new THREE.Sprite(spriteMat);
        this._promptMesh.scale.set(0.6, 0.6, 0.6);
        this._promptMesh.visible = false;
        this.scene.add(this._promptMesh);
    }

    update(dt, player, world, input) {
        if (this.isExecuting) {
            this.executeTimer -= dt;
            if (this.executeTimer <= 0) {
                this.isExecuting = false;
                this.player.isInvincible = false;
            }
            return;
        }

        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= dt;
        }

        // Find nearest low-HP enemy
        const enemies = this._getAllEnemies(world);
        let nearest = null;
        let nearestDist = Infinity;
        for (const e of enemies) {
            if (e.isDead || e.team === 'player') continue;
            const hp = e.health ?? e.hp ?? 100;
            const maxHp = e.maxHealth ?? e.maxHp ?? 100;
            if (maxHp > 0 && hp / maxHp > this.hpThreshold) continue;
            const pos = e.position || (e.mesh && e.mesh.position);
            if (!pos) continue;
            const dist = player.position.distanceTo(pos);
            if (dist < this.promptRange && dist < nearestDist) {
                nearest = e;
                nearestDist = dist;
            }
        }

        this.promptedEnemy = nearest;
        if (nearest) {
            const pos = nearest.position || (nearest.mesh && nearest.mesh.position);
            if (pos && this._promptMesh) {
                this._promptMesh.position.copy(pos).add(new THREE.Vector3(0, 1.8, 0));
                this._promptMesh.visible = true;
            }
            // Activation
            if (input && input.wasPressed('KeyF')) {
                this._executeFatality(nearest, world);
            }
        } else if (this._promptMesh) {
            this._promptMesh.visible = false;
        }
    }

    _getAllEnemies(world) {
        const out = [];
        if (world && world.drones && world.drones.drones) out.push(...world.drones.drones);
        return out;
    }

    _executeFatality(enemy, world) {
        if (this.isExecuting) return;
        const type = this._determineFinisher(enemy, world);
        this.isExecuting = true;
        this.executeTimer = 0.4;
        this.slowMoTimer = 0.5;
        this.player.isInvincible = true;

        const ePos = enemy.position || (enemy.mesh && enemy.mesh.position);
        if (!ePos) return;

        // Snap player to face enemy
        const dir = ePos.clone().sub(this.player.position);
        dir.y = 0;
        if (dir.lengthSq() > 0.001) {
            this.player.facing = Math.atan2(dir.x, dir.z);
        }

        // Kill enemy
        if (enemy.takeDamage) enemy.takeDamage(9999, 'fatality', this.player);
        else if (enemy.die) enemy.die();
        else enemy.isDead = true;

        // Effects
        if (this.particleEffects) {
            this.particleEffects.explosion(ePos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xff0000, 15);
        }

        // Callback for TrickSystem
        if (this.player.onFatality) this.player.onFatality(type, ePos);
    }

    _determineFinisher(enemy, world) {
        const ePos = enemy.position || (enemy.mesh && enemy.mesh.position);
        if (!ePos) return FINISHER_TYPES.BACK_BREAKER;

        // Check for ledge (no ground below)
        if (this._isNearLedge(ePos, world)) return FINISHER_TYPES.LEDGE_KICK;
        // Check for wall behind enemy
        if (this._hasWallBehind(ePos, world)) return FINISHER_TYPES.WALL_SLAM;
        // Airborne enemy
        if (enemy.position && enemy.position.y > 2 && !enemy.grounded) return FINISHER_TYPES.AERIAL_SPIKE;
        // Default
        return FINISHER_TYPES.BACK_BREAKER;
    }

    _isNearLedge(pos, world) {
        if (!world || !world.collidables) return false;
        const test = pos.clone().add(new THREE.Vector3(0, -2, 0));
        // Simple heuristic: if no collidable within 2 units below, it's a ledge
        for (const c of world.collidables) {
            const box = new THREE.Box3().setFromObject(c);
            if (box.containsPoint(test)) return false;
        }
        return true;
    }

    _hasWallBehind(pos, world) {
        if (!world || !world.collidables) return false;
        const backDir = new THREE.Vector3(Math.sin(this.player.facing || 0), 0, Math.cos(this.player.facing || 0)).negate();
        const test = pos.clone().addScaledVector(backDir, 1.5);
        for (const c of world.collidables) {
            const box = new THREE.Box3().setFromObject(c);
            if (box.containsPoint(test)) return true;
        }
        return false;
    }

    getTimeScale() {
        return this.slowMoTimer > 0 ? 0.3 : 1.0;
    }

    reset() {
        this.isExecuting = false;
        this.executeTimer = 0;
        this.slowMoTimer = 0;
        this.promptedEnemy = null;
        if (this._promptMesh) this._promptMesh.visible = false;
    }
}
