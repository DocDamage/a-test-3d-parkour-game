import * as THREE from 'three';

// ============================================================================
// SNIPER DRONE
// ============================================================================

export class SniperDrone {
    constructor(scene, world, player, config = {}) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.grapplingHook = config.grapplingHook || null;

        this.position = (config.position !== undefined) ? config.position.clone() : new THREE.Vector3(0, 12, 0);
        this.beamRadius = config.beamRadius ?? 1.0;
        this.beamSpeed = config.beamSpeed ?? 4.0;           // how fast ground dot follows player
        this.shotCooldown = config.shotCooldown ?? 15.0;
        this.projectileSpeed = config.projectileSpeed ?? 25.0;

        this.isAlive = true;
        this.timeInBeam = 0.0;
        this.cooldownTimer = 0.0;
        this.projectiles = [];

        // ---- Drone body ----
        this.group = new THREE.Group();
        this.scene.add(this.group);

        const bodyGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.3,
            metalness: 0.8,
            emissive: 0x330000,
            emissiveIntensity: 0.5
        });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.group.add(this.body);

        const lensGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16);
        const lensMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 3.0
        });
        this.lens = new THREE.Mesh(lensGeo, lensMat);
        this.lens.rotation.x = Math.PI / 2;
        this.lens.position.z = 0.3;
        this.group.add(this.lens);

        this.group.position.copy(this.position);

        // ---- Laser beam (drone to ground) ----
        this.laserGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 8);
        this.laserGeo.translate(0, 0.5, 0);
        this.laserGeo.rotateX(Math.PI / 2);
        this.laserMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5,
            depthWrite: false
        });
        this.laserMesh = new THREE.Mesh(this.laserGeo, this.laserMat);
        this.scene.add(this.laserMesh);

        // ---- Ground targeting ring ----
        this.ringGeo = new THREE.RingGeometry(this.beamRadius * 0.7, this.beamRadius, 32);
        this.ringMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.ringMesh = new THREE.Mesh(this.ringGeo, this.ringMat);
        this.ringMesh.rotation.x = -Math.PI / 2;
        this.scene.add(this.ringMesh);

        this.currentTarget = new THREE.Vector3(this.position.x, 0, this.position.z);

        // ---- Cooldown ring above drone ----
        this.cdGeo = new THREE.RingGeometry(0.25, 0.35, 32);
        this.cdMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.cdMesh = new THREE.Mesh(this.cdGeo, this.cdMat);
        this.cdMesh.rotation.x = -Math.PI / 2;
        this.scene.add(this.cdMesh);
    }

    update(dt) {
        if (!this.isAlive) {
            this.updateProjectiles(dt);
            return;
        }

        // Hover
        const hover = Math.sin(Date.now() * 0.002) * 0.15;
        this.group.position.y = this.position.y + hover;
        this.group.lookAt(this.player.position.x, this.position.y + hover, this.player.position.z);

        // Move ground target toward player (clamped speed)
        const playerGround = new THREE.Vector3(this.player.position.x, 0, this.player.position.z);
        const toPlayer = new THREE.Vector3().subVectors(playerGround, this.currentTarget);
        const flatDist = Math.hypot(toPlayer.x, toPlayer.z);
        if (flatDist > 0.01) {
            const move = Math.min(flatDist, this.beamSpeed * dt);
            toPlayer.normalize().multiplyScalar(move);
            this.currentTarget.add(toPlayer);
        }

        // Update laser mesh
        const start = this.group.position.clone();
        const end = this.currentTarget.clone();
        end.y = 0.05;
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const len = start.distanceTo(end);
        this.laserMesh.position.copy(mid);
        this.laserMesh.lookAt(end);
        this.laserMesh.scale.set(1, 1, len);

        // Update ground ring
        this.ringMesh.position.set(this.currentTarget.x, 0.05, this.currentTarget.z);

        // Check player inside beam
        const dx = this.player.position.x - this.currentTarget.x;
        const dz = this.player.position.z - this.currentTarget.z;
        const inBeam = Math.hypot(dx, dz) < this.beamRadius;

        // Cooldown
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= dt;
        }

        if (inBeam && this.cooldownTimer <= 0) {
            this.timeInBeam += dt;
            // Visual warning: ring pulses faster as charge builds
            this.ringMat.opacity = 0.35 + (this.timeInBeam / 1.0) * 0.45 + Math.sin(Date.now() * 0.02) * 0.1;
            this.ringMat.opacity = Math.min(this.ringMat.opacity, 0.9);
        } else {
            this.timeInBeam = Math.max(0, this.timeInBeam - dt);
            this.ringMat.opacity = 0.35;
        }

        // Fire
        if (this.timeInBeam >= 1.0 && this.cooldownTimer <= 0) {
            this.fire();
            this.timeInBeam = 0;
            this.cooldownTimer = this.shotCooldown;
        }

        // Cooldown indicator
        this.cdMesh.position.set(this.group.position.x, this.group.position.y + 0.7, this.group.position.z);
        const ratio = this.cooldownTimer / this.shotCooldown;
        this.cdMesh.scale.setScalar(1 - ratio);
        this.cdMesh.visible = this.cooldownTimer > 0;

        this.updateProjectiles(dt);
    }

    fire() {
        const geo = new THREE.SphereGeometry(0.12, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(this.group.position);

        // Aim at player current position
        const dir = new THREE.Vector3().subVectors(this.player.position, this.group.position).normalize();
        const vel = dir.multiplyScalar(this.projectileSpeed);

        this.scene.add(mesh);
        this.projectiles.push({ mesh, velocity: vel, life: 4.0 });
    }

    updateProjectiles(dt) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life -= dt;
            p.mesh.position.addScaledVector(p.velocity, dt);

            // Hit test vs player
            const dist = p.mesh.position.distanceTo(this.player.position);
            const hitRadius = (this.player.RADIUS ?? 0.5) + 0.15;
            if (dist < hitRadius) {
                // Grapple Block: while grappling, projectiles are intercepted
                if (this.grapplingHook && this.grapplingHook.isActive()) {
                    // Destroy projectile and spawn block visual
                    this.removeProjectile(i);
                    if (this.scene.userData && this.scene.userData.spawnDamageNumber) {
                        const pos = this.player.position.clone();
                        pos.y += 1.2;
                        this.scene.userData.spawnDamageNumber(pos, 'BLOCKED', false, 'energy');
                    }
                    // Damage the sniper drone for blocking with grapple
                    if (!this.health) this.health = 60;
                    this.health -= 15;
                    if (this.health <= 0 && this.isAlive) {
                        this.isAlive = false;
                        this.scene.remove(this.group);
                    }
                    continue;
                }
                if (typeof this.player.startStumble === 'function') {
                    this.player.startStumble();
                }
                this.removeProjectile(i);
                continue;
            }

            if (p.life <= 0) {
                this.removeProjectile(i);
            }
        }
    }

    removeProjectile(index) {
        const p = this.projectiles[index];
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.projectiles.splice(index, 1);
    }

    getMeshes() {
        const out = [this.group, this.laserMesh, this.ringMesh, this.cdMesh];
        for (const p of this.projectiles) out.push(p.mesh);
        return out;
    }

    destroy() {
        this.isAlive = false;
        this.scene.remove(this.group);
        this.scene.remove(this.laserMesh);
        this.scene.remove(this.ringMesh);
        this.scene.remove(this.cdMesh);
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.removeProjectile(i);
        }
    }
}

// ============================================================================
// SWARM DRONE
// ============================================================================

export class SwarmDrone {
    constructor(scene, world, player, config = {}) {
        this.scene = scene;
        this.world = world;
        this.player = player;

        this.center = (config.position !== undefined) ? config.position.clone() : new THREE.Vector3(0, 6, 0);
        this.visionRadius = config.visionRadius ?? 6.0;
        this.lockDuration = config.lockDuration ?? 2.0;
        this.orbitRadius = config.orbitRadius ?? 1.2;
        this.orbitSpeed = config.orbitSpeed ?? 1.5;

        this.isAlive = true;
        this.formationAngle = 0.0;
        this.playerLocked = false;
        this.lockTimer = 0.0;

        // Three sub-drones
        this.drones = [];
        for (let i = 0; i < 3; i++) {
            const geo = new THREE.SphereGeometry(0.15, 12, 12);
            const mat = new THREE.MeshStandardMaterial({
                color: 0x111111,
                roughness: 0.2,
                metalness: 0.9,
                emissive: 0x0044ff,
                emissiveIntensity: 1.2
            });
            const mesh = new THREE.Mesh(geo, mat);
            this.scene.add(mesh);

            this.drones.push({
                mesh,
                alive: true,
                hoverOffset: Math.random() * 100
            });
        }

        // Triangle beam visuals
        this.beamGeo = new THREE.BufferGeometry();
        this.beamMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.beamMesh = new THREE.Mesh(this.beamGeo, this.beamMat);
        this.beamMesh.visible = false;
        this.scene.add(this.beamMesh);

        this.edgeGeo = new THREE.BufferGeometry();
        this.edgeMat = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6,
            depthWrite: false
        });
        this.edgeLines = new THREE.LineSegments(this.edgeGeo, this.edgeMat);
        this.edgeLines.visible = false;
        this.scene.add(this.edgeLines);
    }

    update(dt) {
        if (!this.isAlive) return;

        this.formationAngle += this.orbitSpeed * dt;

        // Update individual drone positions
        let aliveCount = 0;
        for (let i = 0; i < 3; i++) {
            const d = this.drones[i];
            if (!d.alive) {
                d.mesh.visible = false;
                continue;
            }
            aliveCount++;

            const angle = this.formationAngle + (i / 3) * Math.PI * 2;
            d.mesh.position.x = this.center.x + Math.cos(angle) * this.orbitRadius;
            d.mesh.position.z = this.center.z + Math.sin(angle) * this.orbitRadius;
            d.mesh.position.y = this.center.y + Math.sin(Date.now() * 0.003 + d.hoverOffset) * 0.25;

            // Face player
            d.mesh.lookAt(this.player.position);
        }

        // Vision check: all three alive drones must see player
        let spotting = 0;
        for (const d of this.drones) {
            if (!d.alive) continue;
            if (d.mesh.position.distanceTo(this.player.position) < this.visionRadius) {
                spotting++;
            }
        }

        const allSpot = spotting === 3;

        if (allSpot && !this.playerLocked) {
            this.playerLocked = true;
            this.lockTimer = this.lockDuration;
        }

        if (this.playerLocked) {
            this.lockTimer -= dt;
            // Lock player in place
            this.player.velocity.set(0, 0, 0);

            this.updateBeamVisuals();

            if (this.lockTimer <= 0) {
                this.playerLocked = false;
                this.beamMesh.visible = false;
                this.edgeLines.visible = false;
            }
        } else {
            this.beamMesh.visible = false;
            this.edgeLines.visible = false;
        }
    }

    updateBeamVisuals() {
        const y = this.player.position.y + (this.player.currentHeight ?? 1.7) * 0.5;

        const positions = [];
        const linePos = [];

        // Triangle vertices at drone positions, projected to player mid-height
        for (let i = 0; i < 3; i++) {
            const d = this.drones[i];
            positions.push(d.mesh.position.x, y, d.mesh.position.z);
        }
        // Center vertex (4th) for triangle fan
        positions.push(this.player.position.x, y, this.player.position.z);

        // Indices for triangle fan: 3-0-1, 3-1-2, 3-2-0
        const indices = [3, 0, 1, 3, 1, 2, 3, 2, 0];

        // Perimeter lines
        for (let i = 0; i < 3; i++) {
            const a = this.drones[i].mesh.position;
            const b = this.drones[(i + 1) % 3].mesh.position;
            linePos.push(a.x, y, a.z, b.x, y, b.z);
        }

        this.beamGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.beamGeo.setIndex(indices);
        this.beamGeo.computeVertexNormals();

        this.edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));

        this.beamMesh.visible = true;
        this.edgeLines.visible = true;
    }

    /** Called when a wall-kick hits a specific drone index (0-2). */
    hitDrone(index) {
        if (index < 0 || index >= 3) return;
        const d = this.drones[index];
        if (!d.alive) return;

        d.alive = false;
        this.scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        d.mesh.material.dispose();

        // If lock was active, cancel it
        if (this.playerLocked) {
            this.playerLocked = false;
            this.lockTimer = 0;
            this.beamMesh.visible = false;
            this.edgeLines.visible = false;
        }

        // Check if any remain
        const anyAlive = this.drones.some(dd => dd.alive);
        if (!anyAlive) {
            this.isAlive = false;
            this.beamMesh.visible = false;
            this.edgeLines.visible = false;
        }
    }

    getMeshes() {
        const out = [];
        for (const d of this.drones) {
            if (d.alive) out.push(d.mesh);
        }
        if (this.beamMesh.visible) {
            out.push(this.beamMesh);
            out.push(this.edgeLines);
        }
        return out;
    }

    destroy() {
        this.isAlive = false;
        for (const d of this.drones) {
            if (d.mesh) {
                this.scene.remove(d.mesh);
                d.mesh.geometry.dispose();
                d.mesh.material.dispose();
            }
        }
        this.scene.remove(this.beamMesh);
        this.scene.remove(this.edgeLines);
    }
}

// ============================================================================
// HUNTER DRONE
// ============================================================================

export class HunterDrone {
    constructor(scene, world, player, config = {}) {
        this.scene = scene;
        this.world = world;
        this.player = player;

        this.position = (config.position !== undefined) ? config.position.clone() : new THREE.Vector3(30, 2, 30);
        this.speed = config.speed ?? 4.0;
        this.radius = config.radius ?? 1.0;
        this.spawnDelay = config.spawnDelay ?? 120.0; // 2 minutes default

        this.isAlive = true;
        this.spawned = false;
        this.spawnTimer = this.spawnDelay;
        this.destroyedPlatforms = new Set();

        // Main body
        const bodyGeo = new THREE.SphereGeometry(this.radius, 32, 32);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x220000,
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0xff0000,
            emissiveIntensity: 0.4
        });
        this.mesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.mesh.position.copy(this.position);
        this.mesh.visible = false;
        this.scene.add(this.mesh);

        // Inner pulsing core
        const coreGeo = new THREE.SphereGeometry(this.radius * 0.4, 16, 16);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 2.0
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.mesh.add(this.core);

        // Red point light
        this.light = new THREE.PointLight(0xff0000, 8, 25);
        this.light.position.copy(this.position);
        this.light.visible = false;
        this.scene.add(this.light);
    }

    update(dt) {
        if (!this.isAlive) return;

        if (!this.spawned) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                this.spawned = true;
                this.mesh.visible = true;
                this.light.visible = true;
            }
            return;
        }

        // Move toward player horizontally
        const toPlayer = new THREE.Vector3().subVectors(this.player.position, this.position);
        toPlayer.y = 0;
        const flatDist = Math.hypot(toPlayer.x, toPlayer.z);

        if (flatDist > 0.1) {
            toPlayer.normalize().multiplyScalar(this.speed * dt);
            this.position.x += toPlayer.x;
            this.position.z += toPlayer.z;
        }

        // Smooth vertical follow
        const targetY = this.player.position.y + 1.5;
        this.position.y += (targetY - this.position.y) * 3.0 * dt;

        this.mesh.position.copy(this.position);
        this.light.position.copy(this.position);

        // Face player
        this.mesh.lookAt(this.player.position);

        // Pulsating emissive / light
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.003);
        this.mesh.material.emissiveIntensity = 0.3 + pulse * 0.9;
        this.core.material.emissiveIntensity = 1.0 + pulse * 2.0;
        this.light.intensity = 5 + pulse * 15;

        // Destroy platforms on contact
        this.checkPlatformDestruction();
    }

    checkPlatformDestruction() {
        if (!this.world.platforms) return;

        for (const platform of this.world.platforms) {
            if (this.destroyedPlatforms.has(platform)) continue;

            const mesh = platform.mesh;
            if (!mesh) continue;

            // Use userData.size if available, otherwise estimate
            const size = mesh.userData?.size ?? { x: 2.5, y: 0.4, z: 2.5 };
            const halfX = size.x / 2;
            const halfY = size.y / 2;
            const halfZ = size.z / 2;

            const dx = Math.abs(this.position.x - mesh.position.x);
            const dy = Math.abs(this.position.y - mesh.position.y);
            const dz = Math.abs(this.position.z - mesh.position.z);

            if (dx < halfX + this.radius && dy < halfY + this.radius && dz < halfZ + this.radius) {
                this.destroyPlatform(platform);
            }
        }
    }

    destroyPlatform(platform) {
        this.destroyedPlatforms.add(platform);
        const mesh = platform.mesh;
        if (!mesh) return;

        // Make platform semi-transparent / damaged look
        if (mesh.material) {
            mesh.material = mesh.material.clone();
            mesh.material.transparent = true;
            mesh.material.opacity = 0.25;
            mesh.material.color.setHex(0x330000);
        }

        // Remove from world collision arrays
        if (Array.isArray(this.world.collidables)) {
            const idx = this.world.collidables.indexOf(mesh);
            if (idx !== -1) this.world.collidables.splice(idx, 1);
        }
        if (Array.isArray(this.world.climbables)) {
            const idx = this.world.climbables.indexOf(mesh);
            if (idx !== -1) this.world.climbables.splice(idx, 1);
        }

        // Override update to make it fall
        platform._fallSpeed = 0;
        platform.update = (dt) => {
            platform._fallSpeed += 9.8 * dt;
            mesh.position.y -= platform._fallSpeed * dt;
            // Stop tracking once far below
            if (mesh.position.y < -30) {
                platform.update = () => {}; // no-op
            }
        };
    }

    getMeshes() {
        if (!this.spawned) return [];
        return [this.mesh];
    }

    destroy() {
        this.isAlive = false;
        this.scene.remove(this.mesh);
        this.scene.remove(this.light);
    }
}
