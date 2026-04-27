import * as THREE from 'three';

/**
 * Single patrol drone with vision-cone detection.
 */
class Drone {
    constructor(scene, world, config) {
        this.scene = scene;
        this.world = world;

        // Waypoints are supplied as [x, z]; Y is fixed at height
        this.waypoints = config.waypoints.map(w => new THREE.Vector3(w[0], config.height, w[1]));
        this.speed = config.speed ?? 2.5;
        this.height = config.height ?? 3;
        this.pauseTime = config.pauseTime ?? 1.5;
        this.visionRange = 10;           // metres
        this.visionHalfAngle = Math.PI / 8; // 22.5 deg -> 45 deg full cone

        // Runtime state
        this.state = 'PATROL';           // PATROL | ALERT | CHASE | SEARCH
        this.currentIndex = 0;
        this.pauseTimer = 0;
        this.detection = 0;              // 0..1
        this.timeInCone = 0;             // seconds player has been in cone + LOS
        this.caught = false;
        this.lastKnownPosition = new THREE.Vector3();
        this.alertBaseRotation = 0;
        this.alertScanAngle = 0;

        // Combat stats
        this.maxHealth = 40;
        this.health = this.maxHealth;
        this.isDead = false;
        this.faction = 'vanguard';
        this.team = 'enemy';
        this.isElite = false;
        this.attackCooldown = 0;
        this._feared = false;
        this._disabled = false;
        this._hackExpiry = 0;
        this._ethereal = false;
        this._etherealTimer = 0;
        this._smokeBlind = false;
        this._decoyTarget = null;

        // ---- Visuals ----
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Body sphere (emissive blue)
        const bodyGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x0088ff,
            emissive: 0x0044aa,
            emissiveIntensity: 1.5,
            roughness: 0.3,
            metalness: 0.6
        });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.group.add(this.body);

        // Rotating ring
        const ringGeo = new THREE.TorusGeometry(0.4, 0.03, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ccff });
        this.ring = new THREE.Mesh(ringGeo, ringMat);
        this.group.add(this.ring);

        // Spotlight projecting the vision cone
        this.spotLight = new THREE.SpotLight(0xffff00, 8, this.visionRange, this.visionHalfAngle * 2, 0.5, 1);
        this.spotLight.position.set(0, 0, 0);
        this.spotLight.castShadow = false;
        this.group.add(this.spotLight);

        this.spotTarget = new THREE.Object3D();
        this.scene.add(this.spotTarget);
        this.spotLight.target = this.spotTarget;

        // Transparent cone mesh (visualises the spotlight)
        const coneHeight = this.visionRange;
        const coneRadius = coneHeight * Math.tan(this.visionHalfAngle);
        const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 32, 1, true);
        // Default Cone points +Y. Rotate so it points +Z, then shift apex to origin.
        coneGeo.rotateX(-Math.PI / 2);
        coneGeo.translate(0, 0, -coneHeight / 2);
        const coneMat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.coneMesh = new THREE.Mesh(coneGeo, coneMat);
        this.group.add(this.coneMesh);

        // Start at first waypoint, facing the second (or +Z if only one)
        this.group.position.copy(this.waypoints[0]);
        this.orientToNextWaypoint();
    }

    /* ------------------------------------------------------------------ */
    /*  Per-frame update                                                    */
    /* ------------------------------------------------------------------ */
    update(dt, player) {
        if (this.isDead) return;

        // Status effect timers
        if (this._disabled) return;
        if (this._hackExpiry > 0) {
            this._hackExpiry -= dt;
            if (this._hackExpiry <= 0) {
                this.team = 'enemy';
                this._hackExpiry = 0;
            }
        }
        if (this._etherealTimer > 0) {
            this._etherealTimer -= dt;
            if (this._etherealTimer <= 0) this._ethereal = false;
        }

        this.attackCooldown -= dt;

        // Burning DoT tick
        if (this._burning) {
            this._burning.tick -= dt;
            if (this._burning.tick <= 0) {
                this._burning.tick = 1.0;
                this._burning.duration -= 1.0;
                this.takeDamage(this._burning.dmg, 'energy', null);
                if (this._burning.duration <= 0) this._burning = null;
            }
        }

        // Idle ring spin
        this.ring.rotation.x += dt * 2.5;
        this.ring.rotation.y += dt * 1.8;

        // Feared: flee from player
        if (this._feared) {
            if (player) {
                const away = this.group.position.clone().sub(player.position).normalize();
                this.group.position.addScaledVector(away, this.speed * dt * 1.5);
            }
            this.updateVisuals();
            return;
        }

        // Smoke blind: pause vision
        if (this._smokeBlind) {
            this.updateVisuals();
            return;
        }

        // Vision test
        const canSee = player ? this.checkVision(player) : false;
        if (canSee) {
            this.timeInCone += dt;
            this.lastKnownPosition.copy(player.position);
        } else {
            this.timeInCone = 0;
        }

        // Detection meter
        if (this.timeInCone > 0.5) {
            this.detection = Math.min(1, this.detection + dt / 1.5);
        } else {
            this.detection = Math.max(0, this.detection - dt * 2.5);
        }

        // ---- State machine ----
        const prevState = this.state;

        if (this.detection >= 1.0) {
            this.state = 'CHASE';
            if (player && !this.caught) {
                this.caught = true;
                // Only stumble if player isn't already incapacitated
                if (player.state !== 'STUMBLE' && player.state !== 'RAGDOLL') {
                    player.startStumble();
                }
            }
        } else if (this.detection > 0.5) {
            this.state = 'CHASE';
        } else if (this.detection > 0 || this.timeInCone > 0) {
            this.state = 'ALERT';
        } else if (prevState === 'CHASE' || prevState === 'ALERT') {
            this.state = 'SEARCH';
        } else if (prevState === 'SEARCH') {
            // Return to patrol once near the current waypoint
            const target = this.waypoints[this.currentIndex];
            const flatDist = Math.hypot(this.group.position.x - target.x, this.group.position.z - target.z);
            if (flatDist < 0.5) {
                this.state = 'PATROL';
            }
        }

        if (this.detection <= 0) {
            this.caught = false;
        }

        if (this.state === 'ALERT' && prevState !== 'ALERT') {
            this.alertBaseRotation = this.group.rotation.y;
            this.alertScanAngle = 0;
        }

        // Colours / light
        this.updateVisuals();

        // Movement
        switch (this.state) {
            case 'PATROL':  this.updatePatrol(dt);  break;
            case 'ALERT':   this.updateAlert(dt);   break;
            case 'CHASE':   this.updateChase(dt);   break;
            case 'SEARCH':  this.updateSearch(dt);  break;
        }

        // Melee attack while chasing
        if (this.state === 'CHASE' && player && !this.isDead && this.team !== 'player') {
            const distToPlayer = this.group.position.distanceTo(player.position);
            if (distToPlayer < 1.5 && this.attackCooldown <= 0) {
                if (player.takeDamage) player.takeDamage(10, 'kinetic', this);
                this.attackCooldown = 1.5;
            }
        }

        // Hacked drone attacks enemies
        if (this.team === 'player' && !this.isDead) {
            const drones = this.scene?.userData?.allDrones || [];
            // Fallback: try to find enemy drones via world reference if available
            let enemies = [];
            if (this.world && this.world.drones && this.world.drones.drones) {
                enemies = this.world.drones.drones.filter(d => d !== this && d.team !== 'player' && !d.isDead);
            }
            if (enemies.length > 0) {
                let nearest = null; let nearestDist = Infinity;
                for (const d of enemies) {
                    const pos = d.position || (d.mesh && d.mesh.position);
                    if (!pos) continue;
                    const dist = this.group.position.distanceTo(pos);
                    if (dist < nearestDist) { nearest = d; nearestDist = dist; }
                }
                if (nearest && nearestDist < 1.5 && this.attackCooldown <= 0) {
                    if (nearest.takeDamage) nearest.takeDamage(10, 'kinetic', this);
                    this.attackCooldown = 1.5;
                } else if (nearest) {
                    const pos = nearest.position || (nearest.mesh && nearest.mesh.position);
                    const dir = pos.clone().sub(this.group.position).normalize();
                    this.group.position.addScaledVector(dir, this.speed * dt);
                }
            }
        }

        // Aim spotlight & cone mesh forward
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
        this.spotTarget.position.copy(this.group.position).add(forward.multiplyScalar(this.visionRange));
        this.coneMesh.lookAt(this.spotTarget.position);
    }

    /* ------------------------------------------------------------------ */
    /*  Vision cone + line-of-sight                                         */
    /* ------------------------------------------------------------------ */
    checkVision(player) {
        const toPlayer = new THREE.Vector3().subVectors(player.position, this.group.position);
        const dist = toPlayer.length();
        if (dist > this.visionRange) return false;

        const dir = toPlayer.clone().normalize();
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
        const angle = Math.acos(THREE.MathUtils.clamp(forward.dot(dir), -1, 1));
        if (angle > this.visionHalfAngle) return false;

        // Line-of-sight: raycast against world collidables
        const ray = new THREE.Ray(this.group.position, dir);
        for (const obj of this.world.collidables) {
            const box = new THREE.Box3().setFromObject(obj);
            const hit = new THREE.Vector3();
            if (ray.intersectBox(box, hit) !== null) {
                const hitDist = this.group.position.distanceTo(hit);
                if (hitDist < dist - 0.4) {
                    return false; // blocked
                }
            }
        }
        return true;
    }

    /* ------------------------------------------------------------------ */
    /*  Movement behaviours                                                 */
    /* ------------------------------------------------------------------ */
    updatePatrol(dt) {
        if (this.pauseTimer > 0) {
            this.pauseTimer -= dt;
            return;
        }

        const target = this.waypoints[this.currentIndex];
        const dx = target.x - this.group.position.x;
        const dz = target.z - this.group.position.z;
        const flatDist = Math.hypot(dx, dz);

        if (flatDist < 0.2) {
            this.currentIndex = (this.currentIndex + 1) % this.waypoints.length;
            this.pauseTimer = this.pauseTime;
            return;
        }

        const moveX = (dx / flatDist) * this.speed * dt;
        const moveZ = (dz / flatDist) * this.speed * dt;
        this.group.position.x += moveX;
        this.group.position.z += moveZ;
        this.group.position.y = this.height;

        // Smooth yaw toward target
        const targetYaw = Math.atan2(dx, dz);
        this.smoothRotateTo(targetYaw, dt, 5);
    }

    updateAlert(dt) {
        // Scan back and forth around the facing direction when alert triggered
        this.alertScanAngle += dt * 2.2;
        const sweep = Math.sin(this.alertScanAngle) * 0.9;
        this.group.rotation.y = this.alertBaseRotation + sweep;
        this.group.position.y = this.height;
    }

    updateChase(dt) {
        // Fly toward last known player position
        const target = this.lastKnownPosition.clone();
        target.y = this.height;
        const dx = target.x - this.group.position.x;
        const dz = target.z - this.group.position.z;
        const flatDist = Math.hypot(dx, dz);
        if (flatDist < 0.3) return;

        const speed = this.speed * 1.6;
        this.group.position.x += (dx / flatDist) * speed * dt;
        this.group.position.z += (dz / flatDist) * speed * dt;
        this.group.position.y = this.height;

        const targetYaw = Math.atan2(dx, dz);
        this.smoothRotateTo(targetYaw, dt, 8);
    }

    updateSearch(dt) {
        // Head back to the current waypoint at normal speed
        const target = this.waypoints[this.currentIndex];
        const dx = target.x - this.group.position.x;
        const dz = target.z - this.group.position.z;
        const flatDist = Math.hypot(dx, dz);
        if (flatDist < 0.2) {
            this.state = 'PATROL';
            return;
        }

        this.group.position.x += (dx / flatDist) * this.speed * dt;
        this.group.position.z += (dz / flatDist) * this.speed * dt;
        this.group.position.y = this.height;

        const targetYaw = Math.atan2(dx, dz);
        this.smoothRotateTo(targetYaw, dt, 5);
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                             */
    /* ------------------------------------------------------------------ */
    orientToNextWaypoint() {
        if (this.waypoints.length < 2) {
            this.group.rotation.y = 0;
            return;
        }
        const a = this.waypoints[0];
        const b = this.waypoints[1];
        this.group.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    }

    smoothRotateTo(targetYaw, dt, speed) {
        let diff = targetYaw - this.group.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.group.rotation.y += diff * Math.min(1, dt * speed);
    }

    updateVisuals() {
        const styles = {
            PATROL: { cone: 0xffff00, light: 0xffff00, bodyEmissive: 0x0044aa, ring: 0x00ccff },
            ALERT:  { cone: 0xff8800, light: 0xff8800, bodyEmissive: 0xaa4400, ring: 0xff8800 },
            CHASE:  { cone: 0xff0000, light: 0xff0000, bodyEmissive: 0xaa0000, ring: 0xff0000 },
            SEARCH: { cone: 0xffff00, light: 0xffff00, bodyEmissive: 0x0044aa, ring: 0x00ccff }
        };
        const s = styles[this.state] || styles.PATROL;
        this.coneMesh.material.color.setHex(s.cone);
        this.spotLight.color.setHex(s.light);
        this.body.material.emissive.setHex(s.bodyEmissive);
        this.ring.material.color.setHex(s.ring);
    }

    getMeshes() {
        return [this.group];
    }

    takeDamage(amount, type, source) {
        if (this.isDead) return 0;
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die(source);
        }
        if (this.onDamageTaken) this.onDamageTaken(amount, type, source);
        return amount;
    }

    die(source) {
        this.isDead = true;
        this.state = 'DEAD';
        if (this.onDeath) this.onDeath(this, source);
        setTimeout(() => { if (this.group) this.group.visible = false; }, 2000);
    }

    getHealthPercent() {
        return this.maxHealth > 0 ? this.health / this.maxHealth : 0;
    }
}

/**
 * Manages all patrol drones in the warehouse.
 */
export class DroneAI {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.drones = [];
    }

    /** Wire up the player reference (called from World.setPlayer). */
    setPlayer(player) {
        this.player = player;
    }

    /**
     * Add a new drone.
     * @param {Object} config
     * @param {number[][]} config.waypoints  Array of [x, z] patrol points
     * @param {number}     [config.speed=2.5]
     * @param {number}     [config.height=3]
     * @param {number}     [config.pauseTime=1.5]
     */
    addDrone(config) {
        const drone = new Drone(this.scene, this.world, config);
        this.drones.push(drone);
        return drone;
    }

    update(dt) {
        for (const drone of this.drones) {
            drone.update(dt, this.player);
        }
    }

    /** Returns every drone Group for debug / collision inspection. */
    getDroneMeshes() {
        return this.drones.flatMap(d => d.getMeshes());
    }
}
