import * as THREE from 'three';

/**
 * ProjectileManager.js
 * Persistent-trajectory projectiles for ranged archetype skills.
 * Manages spawn, flight, collision, and cleanup of projectile meshes.
 */
export class ProjectileManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.projectiles = [];
        this._tempVec = new THREE.Vector3();
        this._interactiveEnv = null;
    }

    setInteractiveEnvironment(ie) {
        this._interactiveEnv = ie;
    }

    /**
     * Fire a standard projectile that destroys on first enemy/collidable hit.
     * @param {THREE.Vector3} origin
     * @param {THREE.Vector3} direction — should be normalized
     * @param {object} config
     * @param {number} config.speed — units/sec (default 40)
     * @param {number} config.range — max distance (default 25)
     * @param {number} config.radius — hit radius (default 0.3)
     * @param {number} config.damage
     * @param {string} config.damageType
     * @param {Function} config.onHit — (target) => void
     * @param {number} config.color — hex color for mesh
     */
    fire(origin, direction, config = {}) {
        const speed = config.speed ?? 40;
        const range = config.range ?? 25;
        const radius = config.radius ?? 0.3;
        const color = config.color ?? 0xffffff;

        const geo = new THREE.SphereGeometry(radius, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(origin);
        this.scene.add(mesh);

        const proj = {
            mesh,
            velocity: direction.clone().normalize().multiplyScalar(speed),
            origin: origin.clone(),
            range,
            radius,
            damage: config.damage ?? 10,
            damageType: config.damageType ?? 'kinetic',
            onHit: config.onHit || null,
            piercing: false,
            hitOwners: new Set(),
            lifetime: range / speed,
            age: 0
        };
        this.projectiles.push(proj);
        return proj;
    }

    /**
     * Fire a piercing projectile that hits ALL enemies in a line up to range.
     * Instant ray-cast, not a moving mesh.
     */
    firePiercing(origin, direction, config = {}) {
        const range = config.range ?? 25;
        const radius = config.radius ?? 0.5;
        const damage = config.damage ?? 10;
        const damageType = config.damageType ?? 'energy';
        const onHit = config.onHit || null;

        const dir = direction.clone().normalize();
        const end = origin.clone().add(dir.clone().multiplyScalar(range));

        // Visual tracer
        const points = [origin.clone(), end.clone()];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: config.color ?? 0x00ffcc, transparent: true, opacity: 0.6 });
        const line = new THREE.Line(lineGeo, lineMat);
        this.scene.add(line);
        setTimeout(() => { this.scene.remove(line); lineGeo.dispose(); lineMat.dispose(); }, 150);

        const drones = this.world?.drones?.drones || [];
        for (const drone of drones) {
            if (drone.isDead) continue;
            const pos = drone.position || (drone.mesh && drone.mesh.position);
            if (!pos) continue;
            const closest = this._closestPointOnSegment(pos, origin, end);
            const dist = pos.distanceTo(closest);
            if (dist < radius + 0.5) {
                if (onHit) onHit(drone);
                else if (drone.takeDamage) drone.takeDamage(damage, damageType, null);
            }
        }
    }

    /**
     * Fire a ricocheting disk projectile that bounces off collidables up to N times.
     * @param {THREE.Vector3} origin
     * @param {THREE.Vector3} direction
     * @param {object} config
     * @param {number} config.bounces — max ricochets (default 3)
     */
    fireRicochet(origin, direction, config = {}) {
        const speed = config.speed ?? 30;
        const bounces = config.bounces ?? 3;
        const radius = config.radius ?? 0.25;
        const color = config.color ?? 0xccff00;
        const damage = config.damage ?? 15;
        const damageType = config.damageType ?? 'kinetic';
        const onHit = config.onHit || null;

        const collidables = this.world?.collidables || [];
        const drones = this.world?.drones?.drones || [];

        let pos = origin.clone();
        let dir = direction.clone().normalize();
        let remainingBounces = bounces;
        let hitEnemies = new Set();

        // Visual disk mesh
        const geo = new THREE.CylinderGeometry(radius, radius, 0.08, 16);
        geo.rotateX(Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        this.scene.add(mesh);

        const step = 0.05;
        const maxSteps = 600; // 30 units at 0.05 per step
        let steps = 0;
        let alive = true;

        const anim = () => {
            if (!alive || steps >= maxSteps) {
                this.scene.remove(mesh);
                geo.dispose();
                mat.dispose();
                return;
            }
            steps++;

            const nextPos = pos.clone().add(dir.clone().multiplyScalar(speed * step));

            // Check enemy hits
            for (const drone of drones) {
                if (drone.isDead || hitEnemies.has(drone)) continue;
                const dPos = drone.position || (drone.mesh && drone.mesh.position);
                if (!dPos) continue;
                if (dPos.distanceTo(nextPos) < radius + 0.5) {
                    hitEnemies.add(drone);
                    if (onHit) onHit(drone);
                    else if (drone.takeDamage) drone.takeDamage(damage, damageType, null);
                }
            }

            // Check collidable bounce
            let bounced = false;
            for (const obj of collidables) {
                const box = new THREE.Box3().setFromObject(obj);
                if (box.containsPoint(nextPos) || box.distanceToPoint(nextPos) < radius) {
                    if (remainingBounces > 0) {
                        // Simple reflection: reverse closest axis
                        const center = box.getCenter(new THREE.Vector3());
                        const dx = Math.abs(nextPos.x - center.x);
                        const dy = Math.abs(nextPos.y - center.y);
                        const dz = Math.abs(nextPos.z - center.z);
                        const normal = new THREE.Vector3();
                        if (dx >= dy && dx >= dz) normal.set(dir.x > 0 ? -1 : 1, 0, 0);
                        else if (dy >= dx && dy >= dz) normal.set(0, dir.y > 0 ? -1 : 1, 0);
                        else normal.set(0, 0, dir.z > 0 ? -1 : 1);
                        dir.reflect(normal).normalize();
                        remainingBounces--;
                        bounced = true;
                        // Spark effect
                        this._spawnArc(pos, nextPos, color);
                    } else {
                        alive = false;
                    }
                    break;
                }
            }

            if (!bounced) {
                pos.copy(nextPos);
                mesh.position.copy(pos);
                mesh.rotation.z += 0.3;
            }

            // Range limit
            if (pos.distanceTo(origin) > (config.range ?? 40)) alive = false;

            if (alive) requestAnimationFrame(anim);
            else {
                this.scene.remove(mesh);
                geo.dispose();
                mat.dispose();
            }
        };
        anim();
    }

    /**
     * Chain lightning: hops from origin to nearest enemy, then chains.
     */
    fireChainLightning(origin, targets, config = {}) {
        const maxChains = config.maxChains ?? 1;
        const jumpRange = config.jumpRange ?? 6;
        const damage = config.damage ?? 10;
        const damageType = config.damageType ?? 'electric';
        const onHit = config.onHit || null;
        const color = config.color ?? 0xaa66ff;

        const drones = this.world?.drones?.drones || [];
        let currentOrigin = origin.clone();
        let currentDamage = damage;
        const hitSet = new Set();

        for (let i = 0; i <= maxChains; i++) {
            let nearest = null;
            let nearestDist = Infinity;
            for (const drone of drones) {
                if (drone.isDead) continue;
                if (hitSet.has(drone)) continue;
                const pos = drone.position || (drone.mesh && drone.mesh.position);
                if (!pos) continue;
                const dist = pos.distanceTo(currentOrigin);
                if (dist < jumpRange && dist < nearestDist) {
                    nearest = drone;
                    nearestDist = dist;
                }
            }
            if (!nearest) break;
            hitSet.add(nearest);
            const targetPos = nearest.position || (nearest.mesh && nearest.mesh.position);
            if (targetPos) {
                this._spawnArc(currentOrigin, targetPos, color);
                if (onHit) onHit(nearest, currentDamage);
                else if (nearest.takeDamage) nearest.takeDamage(currentDamage, damageType, null);
                currentOrigin.copy(targetPos);
                currentDamage *= 0.5;
            }
        }
    }

    update(dt) {
        const drones = this.world?.drones?.drones || [];
        const collidables = this.world?.collidables || [];

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.age += dt;
            if (p.age >= p.lifetime) {
                this._removeProjectile(i);
                continue;
            }

            // Move
            p.mesh.position.addScaledVector(p.velocity, dt);

            // Check enemy hits
            let hit = false;
            for (const drone of drones) {
                if (drone.isDead) continue;
                if (p.hitOwners.has(drone)) continue;
                const pos = drone.position || (drone.mesh && drone.mesh.position);
                if (!pos) continue;
                const dist = p.mesh.position.distanceTo(pos);
                if (dist < p.radius + 0.5) {
                    p.hitOwners.add(drone);
                    if (p.onHit) p.onHit(drone);
                    else if (drone.takeDamage) drone.takeDamage(p.damage, p.damageType, null);
                    if (!p.piercing) {
                        hit = true;
                        break;
                    }
                }
            }

            // Check collidables
            if (!hit && !p.piercing) {
                for (const obj of collidables) {
                    const box = new THREE.Box3().setFromObject(obj);
                    if (box.containsPoint(p.mesh.position) || box.distanceToPoint(p.mesh.position) < p.radius) {
                        hit = true;
                        break;
                    }
                }
            }

            // Steam Redirect: projectiles passing through steam jets get boosted upward
            if (!hit && this._interactiveEnv) {
                for (const jet of this._interactiveEnv.steamJets || []) {
                    if (jet.timer <= 0) continue;
                    const dx = p.mesh.position.x - jet.pipe.x;
                    const dz = p.mesh.position.z - jet.pipe.z;
                    const dy = p.mesh.position.y - jet.baseY;
                    const horizDist = Math.hypot(dx, dz);
                    if (horizDist < 0.9 && dy >= 0 && dy <= jet.height) {
                        // Boost upward and slow horizontal
                        p.velocity.y += 18 * dt;
                        p.velocity.x *= 0.9;
                        p.velocity.z *= 0.9;
                        // Tint white to show steam influence
                        if (p.mesh.material && p.mesh.material.color) {
                            p.mesh.material.color.lerp(new THREE.Color(0xffffff), 0.1);
                        }
                        // Heat-seek toward nearest enemy if in steam long enough
                        if (!p._steamTime) p._steamTime = 0;
                        p._steamTime += dt;
                        if (p._steamTime > 0.2) {
                            let nearest = null;
                            let nearestDist = Infinity;
                            for (const drone of drones) {
                                if (drone.isDead) continue;
                                const dPos = drone.position || (drone.mesh && drone.mesh.position);
                                if (!dPos) continue;
                                const dist = dPos.distanceTo(p.mesh.position);
                                if (dist < nearestDist) { nearest = drone; nearestDist = dist; }
                            }
                            if (nearest) {
                                const dPos = nearest.position || (nearest.mesh && nearest.mesh.position);
                                const seekDir = new THREE.Vector3().subVectors(dPos, p.mesh.position).normalize();
                                p.velocity.lerp(seekDir.multiplyScalar(p.velocity.length()), 0.15);
                            }
                        }
                        break;
                    }
                }
            }

            // Mirror Laser: projectiles reflect off mirror surfaces
            if (!hit && this._interactiveEnv) {
                for (const mirror of this._interactiveEnv.mirrors || []) {
                    const group = mirror.group;
                    if (!group) continue;
                    const box = new THREE.Box3().setFromObject(group);
                    if (box.containsPoint(p.mesh.position) || box.distanceToPoint(p.mesh.position) < p.radius) {
                        // Compute mirror normal (same formula as InteractiveEnvironment)
                        const normal = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), mirror.rotationY + Math.PI / 4);
                        const dir = p.velocity.clone().normalize();
                        const dot = dir.dot(normal);
                        if (Math.abs(dot) >= 0.01) {
                            // Reflect: R = D - 2(D·N)N
                            const reflectDir = dir.clone().sub(normal.clone().multiplyScalar(2 * dot)).normalize();
                            p.velocity.copy(reflectDir.multiplyScalar(p.velocity.length()));
                            // Spawn spark visual
                            this._spawnSpark(p.mesh.position, 0x00ffff);
                            // Limit to one mirror bounce per projectile
                            if (!p._mirrorBounces) p._mirrorBounces = 0;
                            p._mirrorBounces++;
                            if (p._mirrorBounces >= 2) hit = true;
                        }
                        break;
                    }
                }
            }

            if (hit) {
                this._removeProjectile(i);
            }
        }
    }

    _removeProjectile(index) {
        const p = this.projectiles[index];
        this.projectiles.splice(index, 1);
        if (p.mesh) {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        }
    }

    _closestPointOnSegment(point, a, b) {
        const ab = this._tempVec.subVectors(b, a);
        const t = Math.max(0, Math.min(1, point.clone().sub(a).dot(ab) / ab.lengthSq()));
        return a.clone().add(ab.multiplyScalar(t));
    }

    _spawnArc(from, to, color) {
        const mid = from.clone().add(to).multiplyScalar(0.5);
        mid.y += 0.5 + Math.random() * 0.5;
        const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
        const points = curve.getPoints(10);
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 });
        const line = new THREE.Line(geo, mat);
        this.scene.add(line);
        let life = 0.2;
        const anim = () => {
            life -= 0.016;
            mat.opacity = Math.max(0, life / 0.2);
            if (life > 0) requestAnimationFrame(anim);
            else { this.scene.remove(line); geo.dispose(); mat.dispose(); }
        };
        anim();
    }

    _spawnSpark(pos, color) {
        const geo = new THREE.BufferGeometry();
        const count = 12;
        const positions = new Float32Array(count * 3);
        const velocities = [];
        for (let i = 0; i < count; i++) {
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
            ));
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color, size: 0.08, transparent: true, opacity: 0.9 });
        const points = new THREE.Points(geo, mat);
        this.scene.add(points);
        let life = 0.3;
        const anim = () => {
            life -= 0.016;
            const posArr = points.geometry.attributes.position.array;
            for (let i = 0; i < count; i++) {
                posArr[i * 3] += velocities[i].x * 0.016;
                posArr[i * 3 + 1] += velocities[i].y * 0.016;
                posArr[i * 3 + 2] += velocities[i].z * 0.016;
            }
            points.geometry.attributes.position.needsUpdate = true;
            mat.opacity = Math.max(0, life / 0.3);
            if (life > 0) requestAnimationFrame(anim);
            else { this.scene.remove(points); geo.dispose(); mat.dispose(); }
        };
        anim();
    }

    dispose() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this._removeProjectile(i);
        }
    }
}
