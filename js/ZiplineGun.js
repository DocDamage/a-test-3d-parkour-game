import * as THREE from 'three';

/**
 * ZiplineGun — gadget that pins enemies to the nearest wall.
 * Input: Aim (hold Mouse2) + Mouse1 at enemy.
 * Effect: Cable shoots out, wraps enemy, pins to nearest wall for 4s.
 */
export class ZiplineGun {
    constructor(scene, player, world) {
        this.scene = scene;
        this.player = player;
        this.world = world;
        this.cooldown = 0;
        this.COOLDOWN_TIME = 8;
        this.pinnedEnemies = new Map(); // enemy -> { mesh, expiry }
    }

    update(dt) {
        if (this.cooldown > 0) this.cooldown -= dt;

        const now = performance.now() * 0.001;
        for (const [enemy, data] of this.pinnedEnemies) {
            if (now >= data.expiry || enemy.isDead) {
                this._unpin(enemy);
                continue;
            }
            // Keep enemy at pin position
            const pos = enemy.position || (enemy.mesh && enemy.mesh.position);
            if (pos) pos.copy(data.pinPos);
        }
    }

    fire(direction) {
        if (this.cooldown > 0) return false;

        const origin = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const dir = direction.clone().normalize();

        // Raycast to find enemy
        const end = origin.clone().add(dir.clone().multiplyScalar(30));
        let hitEnemy = null;
        let hitDist = Infinity;

        const drones = this.world?.drones?.drones || [];
        for (const drone of drones) {
            if (drone.isDead || drone.team === 'player') continue;
            const pos = drone.position || (drone.mesh && drone.mesh.position);
            if (!pos) continue;
            const closest = this._closestPointOnSegment(pos, origin, end);
            const dist = pos.distanceTo(closest);
            if (dist < 1.0 && origin.distanceTo(pos) < hitDist) {
                hitEnemy = drone;
                hitDist = origin.distanceTo(pos);
            }
        }

        if (!hitEnemy) return false;

        // Find nearest wall/collidable behind enemy
        const pinPos = this._findPinPosition(hitEnemy, dir);
        if (!pinPos) return false;

        this.cooldown = this.COOLDOWN_TIME;
        this._pin(hitEnemy, pinPos);
        return true;
    }

    _findPinPosition(enemy, dir) {
        const pos = enemy.position || (enemy.mesh && enemy.mesh.position);
        if (!pos) return null;

        // Cast ray backward from enemy to find wall
        const backDir = dir.clone().negate();
        const collidables = this.world?.collidables || [];
        let nearestWall = null;
        let nearestDist = Infinity;

        for (const obj of collidables) {
            const box = new THREE.Box3().setFromObject(obj);
            const ray = new THREE.Ray(pos, backDir);
            const hit = new THREE.Vector3();
            if (ray.intersectBox(box, hit) !== null) {
                const dist = pos.distanceTo(hit);
                if (dist < nearestDist && dist < 15) {
                    nearestDist = dist;
                    nearestWall = hit;
                }
            }
        }

        if (nearestWall) return nearestWall;
        // Fallback: pin in place
        return pos.clone();
    }

    _pin(enemy, pinPos) {
        const ePos = enemy.position || (enemy.mesh && enemy.mesh.position);
        if (!ePos) return;

        // Visual cable
        const points = [ePos.clone(), pinPos.clone()];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.8 });
        const line = new THREE.Line(geo, mat);
        this.scene.add(line);

        // Wrap mesh around enemy
        const wrapGeo = new THREE.TorusGeometry(0.5, 0.08, 8, 16);
        const wrapMat = new THREE.MeshBasicMaterial({ color: 0x00aaff });
        const wrap = new THREE.Mesh(wrapGeo, wrapMat);
        wrap.position.copy(ePos);
        this.scene.add(wrap);

        const expiry = performance.now() * 0.001 + 4;
        this.pinnedEnemies.set(enemy, {
            pinPos: pinPos.clone(),
            line, geo, mat,
            wrap, wrapGeo, wrapMat,
            expiry
        });

        if (enemy._disabled !== undefined) enemy._disabled = true;
    }

    _unpin(enemy) {
        const data = this.pinnedEnemies.get(enemy);
        if (!data) return;
        this.scene.remove(data.line);
        data.geo.dispose();
        data.mat.dispose();
        this.scene.remove(data.wrap);
        data.wrapGeo.dispose();
        data.wrapMat.dispose();
        this.pinnedEnemies.delete(enemy);
        if (enemy._disabled !== undefined) enemy._disabled = false;
    }

    _closestPointOnSegment(point, a, b) {
        const ab = new THREE.Vector3().subVectors(b, a);
        const t = Math.max(0, Math.min(1, point.clone().sub(a).dot(ab) / ab.lengthSq()));
        return a.clone().add(ab.multiplyScalar(t));
    }

    dispose() {
        for (const [enemy] of this.pinnedEnemies) {
            this._unpin(enemy);
        }
    }
}
