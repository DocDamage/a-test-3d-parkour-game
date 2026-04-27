import * as THREE from 'three';

/* -------------------------------------------------------------------------- */
/*  Helper: simple chase drone spawned by the guardian                        */
/* -------------------------------------------------------------------------- */
class BossDrone {
    constructor(scene, player, spawnPos) {
        this.scene = scene;
        this.player = player;
        this.dead = false;
        this.hitPlayer = false;
        this.attackCooldown = 0;

        this.mesh = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 8, 8),
            new THREE.MeshStandardMaterial({
                color: 0x8800ff,
                emissive: 0x4400aa,
                emissiveIntensity: 1.5,
                roughness: 0.3,
                metalness: 0.6
            })
        );
        this.mesh.add(body);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.32, 0.03, 8, 16),
            new THREE.MeshBasicMaterial({ color: 0xcc00ff })
        );
        ring.rotation.x = Math.PI / 2;
        this.mesh.add(ring);

        this.mesh.position.copy(spawnPos);
        this.mesh.position.y += 1 + Math.random();
        this.scene.add(this.mesh);

        this.velocity = new THREE.Vector3();
        this.speed = 3.5;
        this.life = 30;
    }

    update(dt) {
        this.life -= dt;
        this.attackCooldown -= dt;
        if (this.life <= 0) { this.dead = true; return; }
        if (!this.player) return;

        const dir = new THREE.Vector3()
            .subVectors(this.player.position, this.mesh.position)
            .normalize();
        this.velocity.lerp(dir.multiplyScalar(this.speed), dt * 2);
        this.mesh.position.addScaledVector(this.velocity, dt);
        this.mesh.lookAt(this.player.position);

        if (this.mesh.position.distanceTo(this.player.position) < 0.6) {
            this.hitPlayer = true;
            this.dead = true;
        }
    }

    dispose() {
        this.scene.remove(this.mesh);
        this.mesh.traverse(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) {
                if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                else c.material.dispose();
            }
        });
    }
}

/* -------------------------------------------------------------------------- */
/*  Helper: homing missile                                                    */
/* -------------------------------------------------------------------------- */
class HomingMissile {
    constructor(scene, startPos, player) {
        this.scene = scene;
        this.player = player;
        this.exploded = false;
        this.hitPlayer = false;

        this.mesh = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.06, 0.5, 8),
            new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0xff8800,
                emissiveIntensity: 2
            })
        );
        body.rotation.x = Math.PI / 2;
        this.mesh.add(body);

        const glow = new THREE.PointLight(0xffaa00, 2, 4);
        this.mesh.add(glow);

        this.mesh.position.copy(startPos);
        this.scene.add(this.mesh);

        this.velocity = new THREE.Vector3(0, 0, -1).multiplyScalar(4);
        this.speed = 5.5;
        this.turnRate = 2.0;
        this.life = 10;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.exploded = true;
            return;
        }
        if (!this.player) return;

        const targetDir = new THREE.Vector3()
            .subVectors(this.player.position, this.mesh.position)
            .normalize();
        this.velocity.addScaledVector(targetDir, this.turnRate * dt * this.speed);
        this.velocity.normalize().multiplyScalar(this.speed);

        this.mesh.position.addScaledVector(this.velocity, dt);
        this.mesh.lookAt(this.mesh.position.clone().add(this.velocity));

        if (this.mesh.position.distanceTo(this.player.position) < 0.7) {
            this.exploded = true;
            this.hitPlayer = true;
        }
    }

    dispose() {
        this.scene.remove(this.mesh);
        this.mesh.traverse(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) {
                if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                else c.material.dispose();
            }
        });
    }
}

/* -------------------------------------------------------------------------- */
/*  RiftGuardian – Unique endgame boss                                        */
/* -------------------------------------------------------------------------- */
export default class RiftGuardian {
    constructor(scene, world, player, camera, postProcessing, directorMode = null, bulletTime = null, challengeSystem = null) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.camera = camera;
        this.postProcessing = postProcessing;
        this.directorMode = directorMode;
        this.bulletTime = bulletTime;
        this.challengeSystem = challengeSystem;

        this.active = false;
        this.bossState = 'idle';
        this.currentPhase = 1;

        this.arenaCenter = new THREE.Vector3();
        this.arenaRadius = 20;

        this.bossGroup = null;
        this.arms = [];
        this.cores = [];
        this.coreHealth = [200, 200, 200, 200];
        this.coreMaxHealth = 200;
        this.coreExposed = [true, true, true, true];

        this.stunnedTimer = 0;
        this.attackTimer = 0;
        this.attackCooldown = 3;
        this.currentAttack = null;
        this.attackWindupTimer = 0;
        this.attackDuration = 0;

        this.arenaObjects = [];
        this.drones = [];
        this.missiles = [];
        this.sweepLaser = null;
        this.gravityWell = null;

        this.healthBarContainer = null;
        this.healthBarFill = null;
        this.nameplate = null;
        this.phaseLabel = null;

        this.fightStartTime = 0;
        this.hitsTaken = 0;
        this.coresDestroyed = 0;
    }

    /* ---------------------------------------------------------------------- */
    /*  Arena setup                                                           */
    /* ---------------------------------------------------------------------- */
    setupArena(centerX, centerZ, radius) {
        this.arenaCenter.set(centerX, 0, centerZ);
        this.arenaRadius = radius;

        const floorGeo = new THREE.CylinderGeometry(radius, radius, 0.5, 64);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x1a0a1a,
            roughness: 0.85,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(centerX, -0.25, centerZ);
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.world.collidables.push(floor);
        this.arenaObjects.push(floor);

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const px = centerX + Math.cos(angle) * (radius * 0.85);
            const pz = centerZ + Math.sin(angle) * (radius * 0.85);
            const pGeo = new THREE.CylinderGeometry(0.5, 0.6, 3, 16);
            const pMat = new THREE.MeshStandardMaterial({
                color: 0x221133,
                roughness: 0.6,
                metalness: 0.5
            });
            const pillar = new THREE.Mesh(pGeo, pMat);
            pillar.position.set(px, 1.5, pz);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.scene.add(pillar);
            this.world.collidables.push(pillar);
            this.arenaObjects.push(pillar);
        }
    }

    /* ---------------------------------------------------------------------- */
    /*  Boss mesh                                                             */
    /* ---------------------------------------------------------------------- */
    _createBossMesh() {
        this.bossGroup = new THREE.Group();

        const bodyGeo = new THREE.OctahedronGeometry(1.2, 0);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x110022,
            roughness: 0.3,
            metalness: 0.9,
            emissive: 0x330055,
            emissiveIntensity: 0.6
        });
        this.bossBody = new THREE.Mesh(bodyGeo, bodyMat);
        this.bossGroup.add(this.bossBody);

        const edgeGeo = new THREE.EdgesGeometry(bodyGeo);
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xffaa00 });
        this.bossBody.add(new THREE.LineSegments(edgeGeo, edgeMat));

        this.arms = [];
        for (let i = 0; i < 4; i++) {
            const armGeo = new THREE.BoxGeometry(0.15, 0.08, 1.6);
            const armMat = new THREE.MeshStandardMaterial({
                color: 0x1a0a1a,
                emissive: 0xaa55ff,
                emissiveIntensity: 0.9
            });
            const arm = new THREE.Mesh(armGeo, armMat);
            const angle = (i / 4) * Math.PI * 2;
            arm.position.set(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5);
            arm.rotation.y = -angle;
            this.bossGroup.add(arm);
            this.arms.push(arm);
        }

        this.cores = [];
        for (let i = 0; i < 4; i++) {
            const coreGeo = new THREE.SphereGeometry(0.3, 16, 16);
            const coreMat = new THREE.MeshStandardMaterial({
                color: 0xffcc00,
                emissive: 0xffaa00,
                emissiveIntensity: 2.5
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            core.position.set(Math.cos(angle) * 0.7, 0.4, Math.sin(angle) * 0.7);
            this.bossGroup.add(core);
            this.cores.push(core);
        }

        this.scene.add(this.bossGroup);

        this.bossGroup.position.set(this.arenaCenter.x, 3, this.arenaCenter.z);
        this.bossOrbitAngle = 0;
        this.bossOrbitRadius = 5;
        this.bossOrbitSpeed = 0.5;
        this.bossHoverBaseY = 3;
    }

    /* ---------------------------------------------------------------------- */
    /*  UI                                                                    */
    /* ---------------------------------------------------------------------- */
    _createHealthBarUI() {
        this.healthBarContainer = document.getElementById('boss-hud');
        this.healthBarFill = document.getElementById('boss-health-fill');
        this.nameplate = document.getElementById('boss-name');
        this.phaseLabel = document.getElementById('boss-phase');
        if (this.healthBarContainer) this.healthBarContainer.style.display = 'block';
        if (this.nameplate) this.nameplate.textContent = 'Rift Guardian';
    }

    _updateHealthBar() {
        if (!this.healthBarFill) return;
        const max = this.getBossMaxHealth() || 800;
        const pct = max > 0 ? (this.getBossHealth() / max) * 100 : 0;
        this.healthBarFill.style.width = Math.max(0, pct) + '%';
        if (this.phaseLabel) {
            if (this.currentPhase === 1) this.phaseLabel.textContent = 'Phase 1: Astral Presence';
            else if (this.currentPhase === 2) this.phaseLabel.textContent = 'Phase 2: Event Horizon';
        }
    }

    /* ---------------------------------------------------------------------- */
    /*  Lifecycle                                                             */
    /* ---------------------------------------------------------------------- */
    start() {
        this.active = true;
        this.bossState = 'patrol';
        this.currentPhase = 1;
        this.fightStartTime = performance.now() / 1000;
        this.hitsTaken = 0;
        this.coresDestroyed = 0;

        const mult = this._riftMultiplier || 1;
        this.coreMaxHealth = Math.floor(200 * mult);
        this.coreHealth = [this.coreMaxHealth, this.coreMaxHealth, this.coreMaxHealth, this.coreMaxHealth];

        this.setupArena(0, 0, 20);
        this._createBossMesh();
        this._createHealthBarUI();

        this.player.position.set(this.arenaCenter.x - 10, 2, this.arenaCenter.z);
        this.player.velocity.set(0, 0, 0);

        if (this.directorMode) {
            this.directorMode.registerEvent('boss_fight_start', this.arenaCenter, 0.5);
        }
        if (this.bulletTime) {
            this.bulletTime.trigger(this.arenaCenter, 25);
        }
        if (this.world.audioManager) {
            this.world.audioManager.ensureInit();
        }

        this.attackTimer = 2;
    }

    cleanup() {
        this.active = false;

        if (this.bossGroup) {
            this.scene.remove(this.bossGroup);
            this.bossGroup.traverse(c => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) {
                    if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                    else c.material.dispose();
                }
            });
            this.bossGroup = null;
        }

        for (const obj of this.arenaObjects) {
            this.scene.remove(obj);
            const idx = this.world.collidables.indexOf(obj);
            if (idx >= 0) this.world.collidables.splice(idx, 1);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else obj.material.dispose();
            }
        }
        this.arenaObjects = [];

        for (const d of this.drones) d.dispose();
        for (const m of this.missiles) m.dispose();
        this.drones = [];
        this.missiles = [];

        if (this.sweepLaser) {
            this.scene.remove(this.sweepLaser.mesh);
            this.sweepLaser.mesh.geometry.dispose();
            this.sweepLaser.mesh.material.dispose();
            this.sweepLaser = null;
        }
        if (this.gravityWell) {
            this.scene.remove(this.gravityWell.mesh);
            this.gravityWell.mesh.geometry.dispose();
            this.gravityWell.mesh.material.dispose();
            this.gravityWell = null;
        }

        if (this.healthBarContainer) this.healthBarContainer.style.display = 'none';
    }

    isActive() {
        return this.active;
    }

    getBossHealth() {
        let sum = 0;
        for (let i = 0; i < 4; i++) {
            if (this.coreExposed[i]) sum += Math.max(0, this.coreHealth[i]);
        }
        return sum;
    }

    getBossMaxHealth() {
        let sum = 0;
        for (let i = 0; i < 4; i++) {
            if (this.coreExposed[i]) sum += this.coreMaxHealth;
        }
        return sum || 800;
    }

    /* ---------------------------------------------------------------------- */
    /*  Damage & Cores                                                        */
    /* ---------------------------------------------------------------------- */
    damageCore(index, amount) {
        if (!this.active || this.bossState === 'defeated') return;
        if (index < 0 || index >= 4) return;
        if (!this.coreExposed[index]) return;
        if (this.coreHealth[index] <= 0) return;

        this.coreHealth[index] -= amount;

        const core = this.cores[index];
        core.material.color.setHex(0xffffff);
        core.material.emissive.setHex(0xffffff);
        setTimeout(() => {
            if (core && core.material) {
                core.material.color.setHex(0xffcc00);
                core.material.emissive.setHex(0xffaa00);
            }
        }, 100);

        if (this.coreHealth[index] <= 0) {
            this._destroyCore(index);
        }
        this._updateHealthBar();
    }

    _destroyCore(index) {
        this.coresDestroyed++;
        this.coreExposed[index] = false;
        this.cores[index].visible = false;

        const worldPos = new THREE.Vector3();
        this.cores[index].getWorldPosition(worldPos);
        this._spawnExplosion(worldPos);

        if (this.postProcessing) this.postProcessing.shake(0.9, 0.5);
        if (this.bulletTime) this.bulletTime.trigger(worldPos, 15);

        this.bossState = 'stunned';
        this.stunnedTimer = 3;
        this._clearAttacks();

        const health = this.getBossHealth();
        if (health <= 0) {
            this._startDefeatSequence();
            return;
        }

        const max = this.getBossMaxHealth();
        const pct = max > 0 ? health / max : 0;
        if (this.currentPhase === 1 && pct <= 0.5) {
            this._startPhaseTransition(2);
        }
    }

    _spawnExplosion(pos) {
        const count = 24;
        for (let i = 0; i < count; i++) {
            const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12
            );
            this.scene.add(mesh);
            let life = 0.6;
            const step = () => {
                life -= 0.016;
                mesh.position.addScaledVector(vel, 0.016);
                mesh.rotation.x += 0.15;
                mesh.rotation.y += 0.1;
                if (life > 0) requestAnimationFrame(step);
                else {
                    this.scene.remove(mesh);
                    geo.dispose();
                    mat.dispose();
                }
            };
            step();
        }
    }

    _clearAttacks() {
        this.currentAttack = null;
        this.attackWindupTimer = 0;
        this.attackDuration = 0;

        if (this.sweepLaser) {
            this.scene.remove(this.sweepLaser.mesh);
            this.sweepLaser.mesh.geometry.dispose();
            this.sweepLaser.mesh.material.dispose();
            this.sweepLaser = null;
        }
        if (this.gravityWell) {
            this.scene.remove(this.gravityWell.mesh);
            this.gravityWell.mesh.geometry.dispose();
            this.gravityWell.mesh.material.dispose();
            this.gravityWell = null;
        }

        for (const m of this.missiles) m.dispose();
        this.missiles = [];
    }

    /* ---------------------------------------------------------------------- */
    /*  Phase transitions                                                     */
    /* ---------------------------------------------------------------------- */
    _startPhaseTransition(newPhase) {
        this.bossState = 'phase_transition';
        this.cinematicMode = 'phase';
        this.cinematicTimer = 3;
        this.nextPhase = newPhase;
        if (this.bulletTime) this.bulletTime.trigger(this.bossGroup.position, 20);
    }

    _finishPhaseTransition() {
        this.currentPhase = this.nextPhase;
        this.bossState = 'patrol';
        this.cinematicMode = null;
        if (this.currentPhase === 2) {
            this.bossHoverBaseY = 6;
            this.bossOrbitSpeed = 1.0;
            this.coreExposed = [true, true, true, true];
            for (let i = 0; i < 4; i++) this.cores[i].visible = true;
        }
    }

    /* ---------------------------------------------------------------------- */
    /*  Defeat                                                                */
    /* ---------------------------------------------------------------------- */
    _startDefeatSequence() {
        this.bossState = 'defeated';
        this.cinematicTimer = 4;
        this.bossFallVelocity = 0;

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (!this.active) return;
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 3
                );
                this._spawnExplosion(this.bossGroup.position.clone().add(offset));
                if (this.postProcessing) this.postProcessing.shake(1.0, 0.4);
            }, i * 700);
        }
        if (this.bulletTime) this.bulletTime.trigger(this.bossGroup.position, 25);
    }

    _finishDefeat() {
        this.active = false;
        if (this.challengeSystem) this.challengeSystem.unlock('firstBossKill');
    }

    /* ---------------------------------------------------------------------- */
    /*  Attacks                                                               */
    /* ---------------------------------------------------------------------- */
    beamSweep() {
        this.bossState = 'attack_windup';
        this.currentAttack = 'beamSweep';
        this.attackWindupTimer = 1.0;
        this.attackDuration = 3.0;

        const laserGeo = new THREE.CylinderGeometry(0.12, 0.12, 16, 8);
        laserGeo.translate(0, 8, 0);
        laserGeo.rotateZ(-Math.PI / 2);
        const laserMat = new THREE.MeshBasicMaterial({
            color: 0xaa00ff,
            transparent: true,
            opacity: 0.75
        });
        const laser = new THREE.Mesh(laserGeo, laserMat);
        this.scene.add(laser);

        this.sweepLaser = {
            mesh: laser,
            angle: Math.random() * Math.PI * 2,
            speed: this.currentPhase >= 2 ? 2.8 : 1.8,
            active: false
        };
    }

    gravityWell() {
        this.bossState = 'attack_windup';
        this.currentAttack = 'gravityWell';
        this.attackWindupTimer = 1.2;
        this.attackDuration = 4.0;

        const geo = new THREE.SphereGeometry(1, 16, 16);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xaa00ff,
            transparent: true,
            opacity: 0.25,
            side: THREE.BackSide
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(this.bossGroup.position);
        this.scene.add(mesh);

        this.gravityWell = {
            mesh,
            radius: 1,
            maxRadius: 10,
            active: false,
            timer: 0
        };
    }

    missileBarrage() {
        for (let i = 0; i < 4; i++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 2
            );
            this.missiles.push(new HomingMissile(
                this.scene,
                this.bossGroup.position.clone().add(offset),
                this.player
            ));
        }
        this._endAttack();
    }

    droneSpawn() {
        for (let i = 0; i < 2; i++) {
            const spawnPos = this.bossGroup.position.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                0,
                (Math.random() - 0.5) * 4
            ));
            this.drones.push(new BossDrone(this.scene, this.player, spawnPos));
        }
        this._endAttack();
    }

    /* ---------------------------------------------------------------------- */
    /*  Main update                                                           */
    /* ---------------------------------------------------------------------- */
    update(dt) {
        if (!this.active) return;

        if (this.bossState === 'defeated') {
            this._updateDefeat(dt);
            return;
        }
        if (this.bossState === 'phase_transition') {
            this._updatePhaseTransition(dt);
            return;
        }

        this._updateBossMovement(dt);
        this._updateAttacks(dt);
        this._updateDrones(dt);
        this._updateMissiles(dt);
        this._checkCollisions(dt);
        this._checkPhaseTransition();
        this._updateHealthBar();
    }

    _updatePhaseTransition(dt) {
        this.cinematicTimer -= dt;
        if (this.cinematicTimer <= 0) {
            this._finishPhaseTransition();
        }
    }

    _updateDefeat(dt) {
        this.cinematicTimer -= dt;
        this.bossFallVelocity += 9.8 * dt;
        this.bossGroup.position.y -= this.bossFallVelocity * dt;
        if (this.bossGroup.position.y < 0.75) {
            this.bossGroup.position.y = 0.75;
            this.bossFallVelocity *= -0.3;
        }
        if (this.cinematicTimer <= 0) {
            this._finishDefeat();
        }
    }

    _updateBossMovement(dt) {
        if (this.bossState === 'stunned') {
            this.stunnedTimer -= dt;
            if (this.stunnedTimer <= 0) {
                this.bossState = 'patrol';
                this.bossGroup.rotation.z = 0;
            } else {
                this.bossGroup.rotation.z = Math.sin(this.stunnedTimer * 12) * 0.08;
            }
            return;
        }

        if (this.bossState === 'attack_windup' || this.bossState === 'attacking') {
            const dir = new THREE.Vector3()
                .subVectors(this.player.position, this.bossGroup.position);
            dir.y = 0;
            if (dir.lengthSq() > 0.001) {
                const targetRot = Math.atan2(dir.x, dir.z);
                let yaw = this.bossGroup.rotation.y;
                let delta = targetRot - yaw;
                while (delta > Math.PI) delta -= Math.PI * 2;
                while (delta < -Math.PI) delta += Math.PI * 2;
                this.bossGroup.rotation.y += delta * dt * 4;
            }
            return;
        }

        this.bossOrbitAngle += this.bossOrbitSpeed * dt;
        const tx = this.arenaCenter.x + Math.cos(this.bossOrbitAngle) * this.bossOrbitRadius;
        const tz = this.arenaCenter.z + Math.sin(this.bossOrbitAngle) * this.bossOrbitRadius;
        this.bossGroup.position.x += (tx - this.bossGroup.position.x) * dt * 2;
        this.bossGroup.position.z += (tz - this.bossGroup.position.z) * dt * 2;

        const t = performance.now() * 0.002;
        this.bossGroup.position.y = this.bossHoverBaseY + Math.sin(t) * 0.3;

        const armSpeed = this.currentAttack === 'beamSweep' ? 8 : 3;
        for (let i = 0; i < this.arms.length; i++) {
            this.arms[i].rotation.y += dt * armSpeed;
        }

        for (let i = 0; i < this.cores.length; i++) {
            if (!this.coreExposed[i]) continue;
            const speed = this.currentPhase === 2 ? 3 : 1;
            const angle = t * speed + (i / 4) * Math.PI * 2 + Math.PI / 4;
            const r = 0.7;
            this.cores[i].position.set(Math.cos(angle) * r, 0.4 * Math.sin(t * 2 + i), Math.sin(angle) * r);
        }
    }

    _updateAttacks(dt) {
        if (this.bossState === 'stunned' || this.bossState === 'defeated') return;

        if (this.currentAttack === null) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0 && this.bossState === 'patrol') {
                this._chooseAttack();
            }
            return;
        }

        if (this.bossState === 'attack_windup') {
            this.attackWindupTimer -= dt;
            if (this.attackWindupTimer <= 0) {
                this.bossState = 'attacking';
                this._executeAttack();
            }
            return;
        }

        if (this.bossState === 'attacking') {
            this.attackDuration -= dt;
            this._updateActiveAttack(dt);
            if (this.attackDuration <= 0) {
                this._endAttack();
            }
        }
    }

    _chooseAttack() {
        const pool = [];
        if (this.currentPhase === 1) {
            pool.push('beamSweep', 'droneSpawn', 'missileBarrage');
        } else {
            pool.push('beamSweep', 'gravityWell', 'missileBarrage', 'droneSpawn');
        }
        const pick = pool[Math.floor(Math.random() * pool.length)];
        if (pick === 'beamSweep') this.beamSweep();
        else if (pick === 'gravityWell') this.gravityWell();
        else if (pick === 'missileBarrage') this.missileBarrage();
        else if (pick === 'droneSpawn') this.droneSpawn();
    }

    _executeAttack() {
        if (this.currentAttack === 'beamSweep' && this.sweepLaser) {
            this.sweepLaser.active = true;
        } else if (this.currentAttack === 'gravityWell' && this.gravityWell) {
            this.gravityWell.active = true;
        }
    }

    _updateActiveAttack(dt) {
        if (this.currentAttack === 'beamSweep' && this.sweepLaser) {
            this.sweepLaser.angle += this.sweepLaser.speed * dt;
            const bossPos = this.bossGroup.position;
            this.sweepLaser.mesh.position.set(bossPos.x, bossPos.y, bossPos.z);
            this.sweepLaser.mesh.rotation.y = -this.sweepLaser.angle;

            const dir = new THREE.Vector3(
                Math.cos(this.sweepLaser.angle),
                0,
                Math.sin(this.sweepLaser.angle)
            );
            const start = bossPos;
            const end = start.clone().add(dir.multiplyScalar(16));
            const dist = this._distanceToSegment(this.player.position, start, end);
            if (dist < 0.6 && Math.abs(this.player.position.y - bossPos.y) < 1.2) {
                if (this.player && typeof this.player.takeDamage === 'function') {
                    this.player.takeDamage(12 * dt, 'energy', this);
                }
                this.hitsTaken++;
                const push = new THREE.Vector3()
                    .subVectors(this.player.position, bossPos)
                    .normalize()
                    .multiplyScalar(6 * dt);
                this.player.velocity.x += push.x;
                this.player.velocity.z += push.z;
            }
        }

        if (this.currentAttack === 'gravityWell' && this.gravityWell) {
            this.gravityWell.timer += dt;
            const expand = Math.min(1, this.gravityWell.timer / 1.5);
            this.gravityWell.radius = 1 + (this.gravityWell.maxRadius - 1) * expand;
            const s = this.gravityWell.radius;
            this.gravityWell.mesh.scale.set(s, s, s);
            this.gravityWell.mesh.material.opacity = 0.15 + Math.sin(this.gravityWell.timer * 4) * 0.05;
            this.gravityWell.mesh.position.copy(this.bossGroup.position);

            const dist = this.player.position.distanceTo(this.bossGroup.position);
            if (dist < this.gravityWell.radius) {
                const pullDir = new THREE.Vector3()
                    .subVectors(this.bossGroup.position, this.player.position)
                    .normalize();
                const pullStrength = 8 * dt;
                this.player.velocity.x += pullDir.x * pullStrength;
                this.player.velocity.z += pullDir.z * pullStrength;
                if (this.player.position.y < this.bossGroup.position.y) {
                    this.player.velocity.y += pullDir.y * pullStrength * 0.5;
                }

                if (dist < 3) {
                    if (this.player && typeof this.player.takeDamage === 'function') {
                        this.player.takeDamage(8 * dt, 'energy', this);
                    }
                    this.hitsTaken++;
                }
            }
        }
    }

    _endAttack() {
        this.currentAttack = null;
        this.bossState = 'patrol';
        this.attackTimer = this.currentPhase === 2 ? 2 : 3;

        if (this.sweepLaser) {
            this.scene.remove(this.sweepLaser.mesh);
            this.sweepLaser.mesh.geometry.dispose();
            this.sweepLaser.mesh.material.dispose();
            this.sweepLaser = null;
        }
        if (this.gravityWell) {
            this.scene.remove(this.gravityWell.mesh);
            this.gravityWell.mesh.geometry.dispose();
            this.gravityWell.mesh.material.dispose();
            this.gravityWell = null;
        }
    }

    _updateDrones(dt) {
        for (let i = this.drones.length - 1; i >= 0; i--) {
            const d = this.drones[i];
            d.update(dt);
            if (d.dead) {
                if (d.hitPlayer) {
                    if (this.player && typeof this.player.takeDamage === 'function') {
                        this.player.takeDamage(10, 'energy', this);
                    }
                    this.hitsTaken++;
                    if (this.player && typeof this.player.startStumble === 'function') {
                        this.player.startStumble();
                    }
                }
                d.dispose();
                this.drones.splice(i, 1);
            }
        }
    }

    _updateMissiles(dt) {
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const m = this.missiles[i];
            m.update(dt);
            if (m.exploded) {
                if (m.hitPlayer) {
                    if (this.player && typeof this.player.takeDamage === 'function') {
                        this.player.takeDamage(15, 'energy', this);
                    }
                    this.hitsTaken++;
                }
                if (this.bulletTime) this.bulletTime.trigger(m.mesh.position, 10);
                this._spawnExplosion(m.mesh.position.clone());
                m.dispose();
                this.missiles.splice(i, 1);
            }
        }
    }

    _checkCollisions(dt) {
        if (this.bossState === 'defeated') return;
        const bossPos = this.bossGroup.position;

        if (this.player.position.distanceTo(bossPos) < 1.1) {
            if (this.player && typeof this.player.takeDamage === 'function') {
                this.player.takeDamage(25, 'energy', this);
            }
            this.hitsTaken++;
            const knockback = new THREE.Vector3()
                .subVectors(this.player.position, bossPos)
                .normalize()
                .multiplyScalar(12);
            knockback.y = 6;
            this.player.velocity.copy(knockback);
            this.player.startStumble();
        }

        for (const arm of this.arms) {
            const wPos = new THREE.Vector3();
            arm.getWorldPosition(wPos);
            if (this.player.position.distanceTo(wPos) < 0.7) {
                if (this.player && typeof this.player.takeDamage === 'function') {
                    this.player.takeDamage(15, 'energy', this);
                }
                this.hitsTaken++;
                if (this.player && typeof this.player.startRagdoll === 'function') {
                    this.player.startRagdoll();
                }
                break;
            }
        }
    }

    _checkPhaseTransition() {
        if (this.bossState === 'phase_transition' || this.bossState === 'defeated') return;
        const health = this.getBossHealth();
        const max = this.getBossMaxHealth();
        const pct = max > 0 ? health / max : 0;
        if (this.currentPhase === 1 && pct <= 0.5) {
            this._startPhaseTransition(2);
        } else if (health <= 0) {
            this._startDefeatSequence();
        }
    }

    _distanceToSegment(point, start, end) {
        const ab = new THREE.Vector3().subVectors(end, start);
        const ap = new THREE.Vector3().subVectors(point, start);
        const abLenSq = ab.lengthSq();
        if (abLenSq === 0) return ap.length();
        let t = ap.dot(ab) / abLenSq;
        t = Math.max(0, Math.min(1, t));
        const closest = new THREE.Vector3().copy(start).addScaledVector(ab, t);
        return point.distanceTo(closest);
    }

    getExposedCores() {
        const out = [];
        for (let i = 0; i < this.cores.length; i++) {
            if (this.coreExposed[i] && this.coreHealth[i] > 0) {
                const worldPos = new THREE.Vector3();
                this.cores[i].getWorldPosition(worldPos);
                out.push({ index: i, position: worldPos, health: this.coreHealth[i] });
            }
        }
        return out;
    }
}
