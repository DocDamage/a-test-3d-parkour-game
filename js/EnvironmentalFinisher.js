/**
 * EnvironmentalFinisher — context-sensitive kills (ledge kick, wall slam, water drown).
 */

import * as THREE from 'three';

export class EnvironmentalFinisher {
    constructor(player, world) {
        this.player = player;
        this.world = world;
        this.ledgleKillHeight = 10;
        this.wallSlamDist = 2.0;
        this.wallSlamBonus = 1.5;
    }

    onMeleeHit(enemy, damage) {
        if (!enemy || enemy.isDead) return damage;
        let bonus = 1.0;

        // Ledge kick check
        if (this._isNearLedge(enemy)) {
            this._kickOffLedge(enemy);
            return damage; // instakill handled separately
        }

        // Wall slam check
        const wallBonus = this._checkWallSlam(enemy);
        if (wallBonus > 1) {
            bonus = wallBonus;
            if (enemy._stunTimer !== undefined) enemy._stunTimer = 2.0;
        }

        return damage * bonus;
    }

    _isNearLedge(enemy) {
        const pos = enemy.position || (enemy.mesh && enemy.mesh.position);
        if (!pos) return false;
        // Check if there's open air below within kill height
        const below = pos.clone(); below.y -= this.ledgleKillHeight;
        if (!this.world || !this.world.collidables) return false;
        for (const mesh of this.world.collidables) {
            if (!mesh) continue;
            const box = new THREE.Box3().setFromObject(mesh);
            if (box.containsPoint(below)) return false;
        }
        // Check if enemy is near edge (simplified: check if forward from player leads to air)
        const toEnemy = pos.clone().sub(this.player.position).normalize();
        const probe = pos.clone().add(toEnemy.multiplyScalar(1.5));
        probe.y -= 2;
        for (const mesh of this.world.collidables) {
            if (!mesh) continue;
            const box = new THREE.Box3().setFromObject(mesh);
            if (box.containsPoint(probe)) return false;
        }
        return true;
    }

    _kickOffLedge(enemy) {
        const pos = enemy.position || (enemy.mesh && enemy.mesh.position);
        if (!pos) return;
        const dir = pos.clone().sub(this.player.position).normalize();
        if (enemy.velocity) {
            enemy.velocity.add(dir.multiplyScalar(10));
            enemy.velocity.y = 5;
        }
        enemy._fallingToDeath = true;
        if (window.__DEV__) console.log('[Finisher] kicked off ledge');
    }

    _checkWallSlam(enemy) {
        const pos = enemy.position || (enemy.mesh && enemy.mesh.position);
        if (!pos) return 1.0;
        const dir = pos.clone().sub(this.player.position).normalize();
        const ray = new THREE.Ray(pos, dir);
        if (!this.world || !this.world.collidables) return 1.0;
        for (const mesh of this.world.collidables) {
            if (!mesh || mesh.userData._isCollectible) continue;
            const box = new THREE.Box3().setFromObject(mesh);
            if (ray.intersectsBox(box)) {
                const dist = pos.distanceTo(ray.intersectBox(box, new THREE.Vector3()) || pos);
                if (dist < this.wallSlamDist) {
                    return this.wallSlamBonus;
                }
            }
        }
        return 1.0;
    }

    update(dt) {
        // Check falling enemies for death
        for (const enemy of this._getAllEnemies()) {
            if (enemy._fallingToDeath && enemy.position) {
                if (enemy.position.y < -20) {
                    if (enemy.takeDamage) enemy.takeDamage(9999, 'fall', this.player);
                    enemy._fallingToDeath = false;
                }
            }
        }
    }

    _getAllEnemies() {
        const enemies = [];
        if (this.world && this.world.drones && this.world.drones.drones) {
            enemies.push(...this.world.drones.drones);
        }
        return enemies;
    }
}
