import * as THREE from 'three';
import { MovingPlatform } from './MovingPlatform.js';

/* -------------------------------------------------------------------------- */
/*  Helper: simple chase drone spawned by the boss                            */
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
                color: 0x0088ff,
                emissive: 0x0044aa,
                emissiveIntensity: 1.5,
                roughness: 0.3,
                metalness: 0.6
            })
        );
        this.mesh.add(body);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.32, 0.03, 8, 16),
            new THREE.MeshBasicMaterial({ color: 0x00ccff })
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
/*  Helper: tiny healing drone                                                */
/* -------------------------------------------------------------------------- */
class HealingDrone {
    constructor(scene, bossFight, bossGroup) {
        this.scene = scene;
        this.bossFight = bossFight;
        this.bossGroup = bossGroup;
        this.dead = false;
        this.hp = 8;
        this.health = this.hp;

        this.mesh = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            new THREE.MeshStandardMaterial({
                color: 0x00ff44,
                emissive: 0x00aa22,
                emissiveIntensity: 1.5
            })
        );
        this.mesh.add(body);

        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            1 + Math.random() * 2,
            (Math.random() - 0.5) * 4
        );
        this.mesh.position.copy(bossGroup.position).add(offset);
        this.scene.add(this.mesh);

        this.healTimer = 0;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.orbitRadius = 2.5 + Math.random() * 1.5;
    }

    update(dt) {
        this.orbitAngle += dt * 1.5;
        this.mesh.position.x = this.bossGroup.position.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.mesh.position.z = this.bossGroup.position.z + Math.sin(this.orbitAngle) * this.orbitRadius;
        this.mesh.position.y = this.bossGroup.position.y + 1 + Math.sin(this.orbitAngle * 3) * 0.5;

        this.healTimer += dt;
        if (this.healTimer >= 1) {
            this.healTimer -= 1;
            this.bossFight._healBoss(2);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) this.dead = true;
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
                color: 0xff3300,
                emissive: 0xff0000,
                emissiveIntensity: 2
            })
        );
        body.rotation.x = Math.PI / 2;
        this.mesh.add(body);

        const glow = new THREE.PointLight(0xff2200, 2, 4);
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
/*  BossFight – The Overseer                                                  */
/* -------------------------------------------------------------------------- */
export default class BossFight {
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
        this.coreHealth = [50, 50, 50];
        this.coreMaxHealth = 50;
        this.coreExposed = [true, true, true];

        this.stunnedTimer = 0;
        this.attackTimer = 0;
        this.attackCooldown = 4;
        this.currentAttack = null;
        this.attackWindupTimer = 0;
        this.attackDuration = 0;

        this.arenaObjects = [];
        this.platforms = [];
        this.lasers = [];
        this.floorSegments = [];

        this.drones = [];
        this.healingDrones = [];
        this.missiles = [];
        this.shockwave = null;
        this.sweepLaser = null;
        this.timeDistortions = [];
        this.detachedArms = null;
        this.bossFallVelocity = 0;

        this.cinematicTimer = 0;
        this.cinematicMode = null;
        this._cinematicCameraTarget = null;
        this.nextPhase = 1;
        this._playerInTimeDistortion = false;

        this.healthBarContainer = null;
        this.healthBarFill = null;
        this.nameplate = null;
        this.victoryUI = null;
        this._vignetteOverlay = null;

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

        // Circular floor
        const floorGeo = new THREE.CylinderGeometry(radius, radius, 0.5, 64);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.85,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(centerX, -0.25, centerZ);
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.world.collidables.push(floor);
        this.arenaObjects.push(floor);

        // 6 pillars around perimeter (climbable, 3m tall)
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = centerX + Math.cos(angle) * (radius * 0.85);
            const pz = centerZ + Math.sin(angle) * (radius * 0.85);
            const pGeo = new THREE.CylinderGeometry(0.5, 0.6, 3, 16);
            const pMat = new THREE.MeshStandardMaterial({
                color: 0x333333,
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

        // 3 elevated platforms at 2m, 4m, 6m
        const heights = [2, 4, 6];
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 + 0.4;
            const px = centerX + Math.cos(angle) * (radius * 0.5);
            const pz = centerZ + Math.sin(angle) * (radius * 0.5);

            const plat = new MovingPlatform(this.scene, 'elevator', {
                x: px,
                y: heights[i],
                z: pz,
                width: 3,
                depth: 3,
                height: 0.4,
                color: 0x556677,
                speed: 0.8 + i * 0.2,
                minY: heights[i] - 1.5,
                maxY: heights[i] + 1.5
            });
            this.world.platforms.push(plat);
            this.world.collidables.push(plat.mesh);
            this.arenaObjects.push(plat.mesh);
            this.platforms.push(plat);
        }

        // Central pillar (8m tall)
        const cpGeo = new THREE.CylinderGeometry(1.2, 1.5, 8, 24);
        const cpMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.4,
            metalness: 0.7
        });
        const cp = new THREE.Mesh(cpGeo, cpMat);
        cp.position.set(centerX, 4, centerZ);
        cp.castShadow = true;
        cp.receiveShadow = true;
        this.scene.add(cp);
        this.world.collidables.push(cp);
        this.arenaObjects.push(cp);
        this.centerPillar = cp;
    }

    /* ---------------------------------------------------------------------- */
    /*  Boss mesh                                                             */
    /* ---------------------------------------------------------------------- */
    _createBossMesh() {
        this.bossGroup = new THREE.Group();

        // Central hexagonal body (2m wide, 1.5m tall)
        const bodyGeo = new THREE.CylinderGeometry(1, 1, 1.5, 6);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.3,
            metalness: 0.9,
            emissive: 0x220000,
            emissiveIntensity: 0.6
        });
        this.bossBody = new THREE.Mesh(bodyGeo, bodyMat);
        this.bossGroup.add(this.bossBody);

        // Red glowing edge lines
        const edgeGeo = new THREE.EdgesGeometry(bodyGeo);
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
        this.bossBody.add(new THREE.LineSegments(edgeGeo, edgeMat));

        // 6 rotating arms around the body
        this.arms = [];
        for (let i = 0; i < 6; i++) {
            const armGeo = new THREE.BoxGeometry(0.15, 0.08, 1.4);
            const armMat = new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                emissive: 0xff0000,
                emissiveIntensity: 0.9
            });
            const arm = new THREE.Mesh(armGeo, armMat);
            const angle = (i / 6) * Math.PI * 2;
            arm.position.set(Math.cos(angle) * 1.35, 0, Math.sin(angle) * 1.35);
            arm.rotation.y = -angle;
            this.bossGroup.add(arm);
            this.arms.push(arm);
        }

        // 3 weak-point cores (glowing orange spheres, 0.3m)
        this.cores = [];
        for (let i = 0; i < 3; i++) {
            const coreGeo = new THREE.SphereGeometry(0.3, 16, 16);
            const coreMat = new THREE.MeshStandardMaterial({
                color: 0xff6600,
                emissive: 0xff4400,
                emissiveIntensity: 2.5
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            const angle = (i / 3) * Math.PI * 2;
            core.position.set(Math.cos(angle) * 0.65, 0, Math.sin(angle) * 0.65);
            this.bossGroup.add(core);
            this.cores.push(core);
        }

        this.scene.add(this.bossGroup);

        // Initial hover / orbit state
        this.bossGroup.position.set(this.arenaCenter.x, 3, this.arenaCenter.z);
        this.bossOrbitAngle = 0;
        this.bossOrbitRadius = 4;
        this.bossOrbitSpeed = 0.6;
        this.bossHoverBaseY = 3;
    }

    /* ---------------------------------------------------------------------- */
    /*  UI                                                                    */
    /* ---------------------------------------------------------------------- */
    _createHealthBarUI() {
        // Use existing HTML elements from index.html
        this.healthBarContainer = document.getElementById('boss-hud');
        this.healthBarFill = document.getElementById('boss-health-fill');
        this.nameplate = document.getElementById('boss-name');
        this.phaseLabel = document.getElementById('boss-phase');
        if (this.healthBarContainer) this.healthBarContainer.style.display = 'block';
    }

    _updateHealthBar() {
        if (!this.healthBarFill) return;
        const max = this.getBossMaxHealth() || 150;
        const pct = max > 0 ? (this.getBossHealth() / max) * 100 : 0;
        this.healthBarFill.style.width = Math.max(0, pct) + '%';
        if (this.phaseLabel) {
            if (this.currentPhase === 1) this.phaseLabel.textContent = 'Phase 1: Ground Supremacy';
            else if (this.currentPhase === 2) this.phaseLabel.textContent = 'Phase 2: Aerial Dominance';
            else if (this.currentPhase === 3) this.phaseLabel.textContent = 'Phase 3: Overclocked Fury';
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

        this.setupArena(0, 0, 20);
        this._createBossMesh();
        this._createHealthBarUI();

        // Spawn player at arena edge
        this.player.position.set(this.arenaCenter.x - 10, 2, this.arenaCenter.z);
        this.player.velocity.set(0, 0, 0);

        // Integration hooks
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

        for (const plat of this.platforms) {
            const pIdx = this.world.platforms.indexOf(plat);
            if (pIdx >= 0) this.world.platforms.splice(pIdx, 1);
            this.scene.remove(plat.mesh);
        }
        this.platforms = [];

        // Remove hazard lasers we created
        if (this.world.hazards) {
            for (const l of this.lasers) {
                const idx = this.world.hazards.lasers.indexOf(l);
                if (idx >= 0) this.world.hazards.lasers.splice(idx, 1);
                this.scene.remove(l.group);
                l.mesh.geometry.dispose();
                l.mesh.material.dispose();
                l.line.geometry.dispose();
                l.line.material.dispose();
            }
        }
        this.lasers = [];

        for (const d of this.drones) d.dispose();
        for (const d of this.healingDrones) d.dispose();
        for (const m of this.missiles) m.dispose();
        this.drones = [];
        this.healingDrones = [];
        this.missiles = [];

        for (const seg of this.floorSegments) {
            this.scene.remove(seg.mesh);
            if (seg.mesh.geometry) seg.mesh.geometry.dispose();
            if (seg.mesh.material) seg.mesh.material.dispose();
        }
        this.floorSegments = [];

        // Hide UI (don't remove static HTML elements)
        if (this.healthBarContainer) this.healthBarContainer.style.display = 'none';
        if (this.victoryUI) this.victoryUI.style.display = 'none';
        if (this._vignetteOverlay && this._vignetteOverlay.parentNode) {
            this._vignetteOverlay.parentNode.removeChild(this._vignetteOverlay);
        }
    }

    isActive() {
        return this.active;
    }

    getBossHealth() {
        let sum = 0;
        for (let i = 0; i < 3; i++) {
            if (this.coreExposed[i]) sum += Math.max(0, this.coreHealth[i]);
        }
        return sum;
    }

    getBossMaxHealth() {
        let sum = 0;
        for (let i = 0; i < 3; i++) {
            if (this.coreExposed[i]) sum += this.coreMaxHealth;
        }
        return sum || 150;
    }

    getFightTime() {
        const elapsed = (performance.now() / 1000) - this.fightStartTime;
        const m = Math.floor(elapsed / 60);
        const s = Math.floor(elapsed % 60);
        const ms = Math.floor((elapsed % 1) * 1000);
        return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}.${ms.toString().padStart(3,'0')}`;
    }

    getGrade() {
        const hits = this.hitsTaken || 0;
        return hits === 0 ? 'S' : hits <= 3 ? 'A' : hits <= 6 ? 'B' : hits <= 10 ? 'C' : 'F';
    }

    /* ---------------------------------------------------------------------- */
    /*  Damage & Cores                                                        */
    /* ---------------------------------------------------------------------- */
    damageCore(index, amount) {
        if (!this.active || this.bossState === 'defeated') return;
        if (index < 0 || index >= 3) return;
        if (!this.coreExposed[index]) return;
        if (this.coreHealth[index] <= 0) return;

        this.coreHealth[index] -= amount;

        // Flash white on hit
        const core = this.cores[index];
        const baseColor = new THREE.Color(0xff6600);
        const baseEmissive = new THREE.Color(0xff4400);
        core.material.color.setHex(0xffffff);
        core.material.emissive.setHex(0xffffff);
        setTimeout(() => {
            if (core && core.material) {
                core.material.color.copy(baseColor);
                core.material.emissive.copy(baseEmissive);
            }
        }, 100);

        // Darken as damaged
        const pct = Math.max(0, this.coreHealth[index]) / this.coreMaxHealth;
        const r = THREE.MathUtils.lerp(0.15, 1, pct);
        const g = THREE.MathUtils.lerp(0.08, 0.4, pct);
        const b = THREE.MathUtils.lerp(0.05, 0, pct);
        core.material.color.setRGB(r, g, b);
        core.material.emissive.setRGB(r * 0.7, g * 0.4, 0);

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

        if (this.postProcessing) {
            this.postProcessing.shake(0.9, 0.5);
        }
        if (this.bulletTime) {
            this.bulletTime.trigger(worldPos, 15);
        }
        if (this.directorMode) {
            this.directorMode.registerEvent('boss_core_destroyed', worldPos, 0.3);
        }

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

        if (this.currentPhase === 1 && pct <= 0.66) {
            this._startPhaseTransition(2);
        } else if (this.currentPhase === 2 && pct <= 0.33) {
            this._startPhaseTransition(3);
        }
    }

    _healBoss(amount) {
        let bestIdx = -1;
        let bestHealth = Infinity;
        for (let i = 0; i < 3; i++) {
            if (this.coreExposed[i] && this.coreHealth[i] > 0 && this.coreHealth[i] < this.coreMaxHealth) {
                if (this.coreHealth[i] < bestHealth) {
                    bestHealth = this.coreHealth[i];
                    bestIdx = i;
                }
            }
        }
        if (bestIdx >= 0) {
            this.coreHealth[bestIdx] = Math.min(this.coreMaxHealth, this.coreHealth[bestIdx] + amount);
            const core = this.cores[bestIdx];
            core.material.emissive.setHex(0x00ff44);
            setTimeout(() => {
                if (core && core.material) {
                    const pct = Math.max(0, this.coreHealth[bestIdx]) / this.coreMaxHealth;
                    const r = THREE.MathUtils.lerp(0.15, 1, pct);
                    const g = THREE.MathUtils.lerp(0.08, 0.4, pct);
                    const b = THREE.MathUtils.lerp(0.05, 0, pct);
                    core.material.color.setRGB(r, g, b);
                    core.material.emissive.setRGB(r * 0.7, g * 0.4, 0);
                }
            }, 200);
            this._updateHealthBar();
        }
    }

    _spawnExplosion(pos) {
        const count = 24;
        for (let i = 0; i < count; i++) {
            const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
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

        if (this.shockwave) {
            this.scene.remove(this.shockwave.mesh);
            this.shockwave.mesh.geometry.dispose();
            this.shockwave.mesh.material.dispose();
            this.shockwave = null;
        }
        if (this.sweepLaser) {
            this.scene.remove(this.sweepLaser.mesh);
            this.sweepLaser.mesh.geometry.dispose();
            this.sweepLaser.mesh.material.dispose();
            this.sweepLaser = null;
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

        if (this.bulletTime) {
            this.bulletTime.trigger(this.bossGroup.position, 20);
        }
        if (this.directorMode) {
            this.directorMode.registerEvent('boss_phase_transition', this.bossGroup.position, 0.2);
        }

        this._cinematicCameraTarget = this.bossGroup.position.clone();
    }

    _finishPhaseTransition() {
        this.currentPhase = this.nextPhase;
        this.bossState = 'patrol';
        this.cinematicMode = null;

        if (this.currentPhase === 2) {
            this.bossHoverBaseY = 8;
            this.bossOrbitSpeed = 1.2;
            this.coreExposed = [true, true, false];
            for (let i = 0; i < 3; i++) {
                this.cores[i].visible = this.coreExposed[i];
            }
            this._activatePerimeterLasers();
        } else if (this.currentPhase === 3) {
            this.bossHoverBaseY = 4;
            this.bossOrbitSpeed = 0;
            this.bossOrbitRadius = 0;
            this.coreExposed = [false, false, false];
            for (let i = 0; i < 3; i++) {
                this.cores[i].visible = false;
            }
            this._setRedVignette(true);
        }
    }

    _activatePerimeterLasers() {
        if (!this.world.hazards) return;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + Math.PI / 12;
            const x = this.arenaCenter.x + Math.cos(angle) * (this.arenaRadius * 0.92);
            const z = this.arenaCenter.z + Math.sin(angle) * (this.arenaRadius * 0.92);
            this.world.hazards.createLaser({
                x, y: 1.5, z,
                length: this.arenaRadius * 0.35,
                orientation: 'vertical',
                toggleInterval: 1.5 + Math.random() * 2
            });
            const laserObj = this.world.hazards.lasers[this.world.hazards.lasers.length - 1];
            if (laserObj) this.lasers.push(laserObj);
        }
    }

    _setRedVignette(enabled) {
        if (!this._vignetteOverlay) {
            const div = document.createElement('div');
            div.style.cssText =
                'position:fixed;top:0;left:0;width:100%;height:100%;' +
                'pointer-events:none;z-index:50;' +
                'box-shadow:inset 0 0 150px rgba(255,0,0,0);' +
                'transition:box-shadow 0.6s ease;';
            document.body.appendChild(div);
            this._vignetteOverlay = div;
        }
        this._vignetteOverlay.style.boxShadow = enabled
            ? 'inset 0 0 220px rgba(255,0,0,0.55)'
            : 'inset 0 0 150px rgba(255,0,0,0)';
    }

    /* ---------------------------------------------------------------------- */
    /*  Defeat                                                                */
    /* ---------------------------------------------------------------------- */
    _startDefeatSequence() {
        this.bossState = 'defeated';
        this.cinematicMode = 'defeat';
        this.cinematicTimer = 5;

        this.detachedArms = [];
        for (const arm of this.arms) {
            const worldPos = new THREE.Vector3();
            arm.getWorldPosition(worldPos);
            const worldQuat = new THREE.Quaternion();
            arm.getWorldQuaternion(worldQuat);
            this.bossGroup.remove(arm);
            this.scene.add(arm);
            arm.position.copy(worldPos);
            arm.quaternion.copy(worldQuat);
            arm.userData.detachVel = new THREE.Vector3(
                (Math.random() - 0.5) * 6,
                Math.random() * 6 + 2,
                (Math.random() - 0.5) * 6
            );
            arm.userData.detachRot = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
            );
            this.detachedArms.push(arm);
        }

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

        if (this.bulletTime) {
            this.bulletTime.trigger(this.bossGroup.position, 25);
        }
        if (this.directorMode) {
            this.directorMode.registerEvent('boss_defeat', this.bossGroup.position, 0.1);
        }
    }

    _finishDefeat() {
        this.active = false;
        this._setRedVignette(false);
        this._showVictoryUI();

        if (this.challengeSystem) {
            this.challengeSystem.unlock('firstBossKill');
        }
    }

    _showVictoryUI() {
        const victory = document.getElementById('boss-victory');
        if (!victory) return;
        const timeTaken = (performance.now() / 1000) - this.fightStartTime;
        const grade = this.getGrade();
        const timeStr = this.getFightTime();
        document.getElementById('boss-time').textContent = 'Time: ' + timeStr;
        document.getElementById('boss-hits').textContent = 'Hits Taken: ' + this.hitsTaken;
        document.getElementById('boss-grade').textContent = grade;
        victory.style.display = 'block';
        if (this.healthBarContainer) this.healthBarContainer.style.display = 'none';
    }

    /* ---------------------------------------------------------------------- */
    /*  Attacks                                                               */
    /* ---------------------------------------------------------------------- */
    sweepBeam() {
        this.bossState = 'attack_windup';
        this.currentAttack = 'sweepBeam';
        this.attackWindupTimer = this.currentPhase === 3 ? 2.0 : 1.2;
        this.attackDuration = 3.5;

        const laserGeo = new THREE.CylinderGeometry(0.12, 0.12, 16, 8);
        laserGeo.translate(0, 8, 0);
        laserGeo.rotateZ(-Math.PI / 2);
        const laserMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.75
        });
        const laser = new THREE.Mesh(laserGeo, laserMat);
        this.scene.add(laser);

        this.sweepLaser = {
            mesh: laser,
            angle: Math.random() * Math.PI * 2,
            speed: this.currentPhase >= 2 ? 2.2 : 1.3,
            active: false
        };
    }

    shockwaveSlam() {
        this.bossState = 'attack_windup';
        this.currentAttack = 'shockwaveSlam';
        this.attackWindupTimer = this.currentPhase === 3 ? 2.0 : 1.0;
        this.attackDuration = 2.5;
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

    diveBomb() {
        this.bossState = 'attack_windup';
        this.currentAttack = 'diveBomb';
        this.attackWindupTimer = this.currentPhase === 3 ? 2.0 : 1.0;
        this.attackDuration = 2.0;
        this.diveTarget = this.player.position.clone();
        this.diveTarget.y = 0.5;
        this.diveStartPos = this.bossGroup.position.clone();
        this.diveTimer = 0;
    }

    missileBarrage() {
        for (let i = 0; i < 6; i++) {
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

    platformPurge() {
        if (this.platforms.length === 0) {
            this._endAttack();
            return;
        }
        const idx = Math.floor(Math.random() * this.platforms.length);
        const plat = this.platforms[idx];
        this.platforms.splice(idx, 1);

        const cIdx = this.world.collidables.indexOf(plat.mesh);
        if (cIdx >= 0) this.world.collidables.splice(cIdx, 1);
        const pIdx = this.world.platforms.indexOf(plat);
        if (pIdx >= 0) this.world.platforms.splice(pIdx, 1);

        this._spawnExplosion(plat.mesh.position.clone());
        this.scene.remove(plat.mesh);
        this.arenaObjects.push(plat.mesh); // ensure cleanup catches it

        this._endAttack();
    }

    timeDistortion() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.arenaRadius * 0.6;
        const pos = new THREE.Vector3(
            this.arenaCenter.x + Math.cos(angle) * dist,
            1,
            this.arenaCenter.z + Math.sin(angle) * dist
        );

        const geo = new THREE.SphereGeometry(3, 16, 16);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xaa00ff,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        this.scene.add(mesh);

        this.timeDistortions.push({
            position: pos,
            radius: 3,
            timer: 5,
            active: true,
            mesh
        });
        this._endAttack();
    }

    healingDrones() {
        for (let i = 0; i < 3; i++) {
            this.healingDrones.push(new HealingDrone(this.scene, this, this.bossGroup));
        }
        this._endAttack();
    }

    arenaCollapse() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.arenaRadius * 0.6;
        const pos = new THREE.Vector3(
            this.arenaCenter.x + Math.cos(angle) * dist,
            0.02,
            this.arenaCenter.z + Math.sin(angle) * dist
        );

        const geo = new THREE.CircleGeometry(2.2, 32);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.copy(pos);
        this.scene.add(mesh);

        this.floorSegments.push({
            mesh,
            active: true,
            warningTimer: 2,
            collapseTimer: 0,
            radius: 2.2
        });
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
            this._updateCinematic(dt);
            return;
        }

        this._updateBossMovement(dt);
        this._updateAttacks(dt);
        this._updateDrones(dt);
        this._updateMissiles(dt);
        this._updateHealingDrones(dt);
        this._updateTimeDistortions(dt);
        this._updateArenaCollapse(dt);
        this._checkCollisions(dt);
        this._checkPhaseTransition();
        this._updateHealthBar();
    }

    _updateCinematic(dt) {
        if (this.cinematicTimer > 0 && this._cinematicCameraTarget) {
            const targetPos = this._cinematicCameraTarget.clone().add(new THREE.Vector3(0, 3, 10));
            this.camera.position.lerp(targetPos, dt * 2.5);
            this.camera.lookAt(this._cinematicCameraTarget);
        }
    }

    _updatePhaseTransition(dt) {
        this.cinematicTimer -= dt;
        if (this.cinematicTimer <= 0) {
            this._cinematicCameraTarget = null;
            this._finishPhaseTransition();
        }
    }

    _updateDefeat(dt) {
        this.cinematicTimer -= dt;

        if (this.detachedArms) {
            for (const arm of this.detachedArms) {
                arm.position.addScaledVector(arm.userData.detachVel, dt);
                arm.rotation.x += arm.userData.detachRot.x * dt;
                arm.rotation.y += arm.userData.detachRot.y * dt;
                arm.rotation.z += arm.userData.detachRot.z * dt;
                arm.userData.detachVel.y -= 9.8 * dt;
            }
        }

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

        // Orbit / patrol
        if (this.bossOrbitRadius > 0) {
            this.bossOrbitAngle += this.bossOrbitSpeed * dt;
            const tx = this.arenaCenter.x + Math.cos(this.bossOrbitAngle) * this.bossOrbitRadius;
            const tz = this.arenaCenter.z + Math.sin(this.bossOrbitAngle) * this.bossOrbitRadius;
            this.bossGroup.position.x += (tx - this.bossGroup.position.x) * dt * 2;
            this.bossGroup.position.z += (tz - this.bossGroup.position.z) * dt * 2;
        } else if (this.currentPhase === 3) {
            this.bossGroup.position.x += (this.arenaCenter.x - this.bossGroup.position.x) * dt * 2;
            this.bossGroup.position.z += (this.arenaCenter.z - this.bossGroup.position.z) * dt * 2;
        }

        // Hover bob
        const t = performance.now() * 0.002;
        this.bossGroup.position.y = this.bossHoverBaseY + Math.sin(t) * 0.3;

        // Arm spin
        const armSpeed = this.currentAttack === 'sweepBeam' ? 8 : 3;
        for (let i = 0; i < this.arms.length; i++) {
            this.arms[i].rotation.y += dt * armSpeed;
        }

        // Core orbit
        for (let i = 0; i < this.cores.length; i++) {
            if (!this.coreExposed[i]) continue;
            const speed = this.currentPhase === 2 ? 3 : 1;
            const angle = t * speed + (i / 3) * Math.PI * 2;
            const r = 0.65;
            this.cores[i].position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
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
            pool.push('sweepBeam', 'shockwaveSlam', 'droneSpawn');
        } else if (this.currentPhase === 2) {
            pool.push('sweepBeam', 'shockwaveSlam', 'diveBomb', 'missileBarrage', 'platformPurge');
        } else {
            pool.push('sweepBeam', 'shockwaveSlam', 'diveBomb', 'missileBarrage',
                      'timeDistortion', 'healingDrones', 'arenaCollapse');
        }

        const pick = pool[Math.floor(Math.random() * pool.length)];
        const hasWindup = ['sweepBeam', 'shockwaveSlam', 'diveBomb'].includes(pick);

        if (this.currentPhase === 3 && hasWindup) {
            // Expose the single center core during wind-up
            this.coreExposed[0] = true;
            this.cores[0].visible = true;
            this.cores[0].position.set(0, 0, 0);
        }

        if (pick === 'sweepBeam') this.sweepBeam();
        else if (pick === 'shockwaveSlam') this.shockwaveSlam();
        else if (pick === 'droneSpawn') this.droneSpawn();
        else if (pick === 'diveBomb') this.diveBomb();
        else if (pick === 'missileBarrage') this.missileBarrage();
        else if (pick === 'platformPurge') this.platformPurge();
        else if (pick === 'timeDistortion') this.timeDistortion();
        else if (pick === 'healingDrones') this.healingDrones();
        else if (pick === 'arenaCollapse') this.arenaCollapse();
    }

    _executeAttack() {
        if (this.currentAttack === 'sweepBeam') {
            if (this.sweepLaser) this.sweepLaser.active = true;
        } else if (this.currentAttack === 'shockwaveSlam') {
            this.bossGroup.position.y = 0.75;
            const ringGeo = new THREE.RingGeometry(0.3, 0.8, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xff4400,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.85
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(this.bossGroup.position.x, 0.05, this.bossGroup.position.z);
            this.scene.add(ring);
            this.shockwave = {
                mesh: ring,
                radius: 0.8,
                maxRadius: this.arenaRadius,
                speed: 9,
                damageDealt: false
            };
            if (this.postProcessing) this.postProcessing.shake(0.7, 0.3);
        } else if (this.currentAttack === 'diveBomb') {
            // nothing extra
        }

        // In phase 3 the center core is hidden once the attack begins
        if (this.currentPhase === 3) {
            this.coreExposed[0] = false;
            this.cores[0].visible = false;
        }
    }

    _updateActiveAttack(dt) {
        if (this.currentAttack === 'sweepBeam' && this.sweepLaser) {
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
                    this.player.takeDamage(10 * dt, 'energy', this);
                } else {
                    console.warn('BossFight: player.takeDamage not available');
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

        if (this.currentAttack === 'shockwaveSlam' && this.shockwave) {
            this.shockwave.radius += this.shockwave.speed * dt;
            const s = this.shockwave.radius / 0.8;
            this.shockwave.mesh.scale.set(s, s, 1);
            this.shockwave.mesh.material.opacity = Math.max(0, 0.85 - (this.shockwave.radius / this.shockwave.maxRadius));

            const dist = new THREE.Vector2(
                this.bossGroup.position.x - this.player.position.x,
                this.bossGroup.position.z - this.player.position.z
            ).length();
            const thickness = 1.2;
            if (!this.shockwave.damageDealt &&
                Math.abs(dist - this.shockwave.radius) < thickness &&
                this.player.grounded) {
                if (this.player && typeof this.player.takeDamage === 'function') {
                    this.player.takeDamage(20, 'energy', this);
                } else {
                    console.warn('BossFight: player.takeDamage not available');
                }
                this.hitsTaken++;
                if (this.player && typeof this.player.startStumble === 'function') {
                    this.player.startStumble();
                }
                this.shockwave.damageDealt = true;
            }
        }

        if (this.currentAttack === 'diveBomb') {
            this.diveTimer += dt;
            const t = Math.min(1, this.diveTimer / 0.6);
            this.bossGroup.position.lerpVectors(this.diveStartPos, this.diveTarget, t);
            this.bossGroup.position.y = THREE.MathUtils.lerp(this.bossHoverBaseY, 0.5, t);

            if (t >= 1) {
                if (this.postProcessing) this.postProcessing.shake(1.1, 0.4);
                this._spawnExplosion(this.bossGroup.position.clone());

                for (let i = this.platforms.length - 1; i >= 0; i--) {
                    const plat = this.platforms[i];
                    if (plat.mesh.position.distanceTo(this.bossGroup.position) < 4) {
                        this.platforms.splice(i, 1);
                        const cIdx = this.world.collidables.indexOf(plat.mesh);
                        if (cIdx >= 0) this.world.collidables.splice(cIdx, 1);
                        const pIdx = this.world.platforms.indexOf(plat);
                        if (pIdx >= 0) this.world.platforms.splice(pIdx, 1);
                        this._spawnExplosion(plat.mesh.position.clone());
                        this.scene.remove(plat.mesh);
                    }
                }

                if (this.bossGroup.position.distanceTo(this.player.position) < 3) {
                    if (this.player && typeof this.player.takeDamage === 'function') {
                        this.player.takeDamage(30, 'energy', this);
                    } else {
                        console.warn('BossFight: player.takeDamage not available');
                    }
                    this.hitsTaken++;
                    if (this.player && typeof this.player.startRagdoll === 'function') {
                        this.player.startRagdoll();
                    }
                }

                this._endAttack();
            }
        }
    }

    _endAttack() {
        this.currentAttack = null;
        this.bossState = 'patrol';
        this.attackTimer = this.currentPhase === 3 ? 2 : this.currentPhase === 2 ? 3 : 4;

        if (this.shockwave) {
            this.scene.remove(this.shockwave.mesh);
            this.shockwave.mesh.geometry.dispose();
            this.shockwave.mesh.material.dispose();
            this.shockwave = null;
        }
        if (this.sweepLaser) {
            this.scene.remove(this.sweepLaser.mesh);
            this.sweepLaser.mesh.geometry.dispose();
            this.sweepLaser.mesh.material.dispose();
            this.sweepLaser = null;
        }

        // Safety: hide phase-3 center core when attack ends
        if (this.currentPhase === 3) {
            this.coreExposed[0] = false;
            this.cores[0].visible = false;
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
                    } else {
                        console.warn('BossFight: player.takeDamage not available');
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
                    } else {
                        console.warn('BossFight: player.takeDamage not available');
                    }
                    this.hitsTaken++;
                }
                if (this.bulletTime) {
                    this.bulletTime.trigger(m.mesh.position, 10);
                }
                this._spawnExplosion(m.mesh.position.clone());
                m.dispose();
                this.missiles.splice(i, 1);
            }
        }
    }

    _updateHealingDrones(dt) {
        for (let i = this.healingDrones.length - 1; i >= 0; i--) {
            const d = this.healingDrones[i];
            d.update(dt);

            if (this.player.position.distanceTo(d.mesh.position) < 1.2) {
                const speed = this.player.velocity.length();
                if (speed > 4) {
                    d.takeDamage(10);
                }
            }

            if (d.dead) {
                this._spawnExplosion(d.mesh.position.clone());
                d.dispose();
                this.healingDrones.splice(i, 1);
            }
        }
    }

    _updateTimeDistortions(dt) {
        let playerInside = false;
        for (const td of this.timeDistortions) {
            if (!td.active) continue;
            td.timer -= dt;
            td.mesh.material.opacity = 0.1 + Math.sin(performance.now() * 0.008) * 0.05;
            if (td.timer <= 0) {
                td.active = false;
                this.scene.remove(td.mesh);
                td.mesh.geometry.dispose();
                td.mesh.material.dispose();
                continue;
            }
            const dist = this.player.position.distanceTo(td.position);
            if (dist < td.radius) playerInside = true;
        }
        this.timeDistortions = this.timeDistortions.filter(td => td.active);
        this._playerInTimeDistortion = playerInside;
    }

    _updateArenaCollapse(dt) {
        for (const seg of this.floorSegments) {
            if (!seg.active) continue;
            if (seg.warningTimer > 0) {
                seg.warningTimer -= dt;
                seg.mesh.material.opacity = 0.2 + Math.sin(performance.now() * 0.015) * 0.2;
                if (seg.warningTimer <= 0) {
                    seg.collapseTimer = 4;
                }
            } else if (seg.collapseTimer > 0) {
                seg.collapseTimer -= dt;
                seg.mesh.position.y -= dt * 2.5;
                seg.mesh.material.opacity *= 0.98;

                const dx = this.player.position.x - seg.mesh.position.x;
                const dz = this.player.position.z - seg.mesh.position.z;
                if (dx * dx + dz * dz < seg.radius * seg.radius && this.player.position.y < 1) {
                    if (this.player && typeof this.player.takeDamage === 'function') {
                        this.player.takeDamage(6 * dt, 'energy', this);
                    } else {
                        console.warn('BossFight: player.takeDamage not available');
                    }
                    this.hitsTaken++;
                }
                if (seg.collapseTimer <= 0 || seg.mesh.position.y < -6) {
                    seg.active = false;
                    this.scene.remove(seg.mesh);
                    seg.mesh.geometry.dispose();
                    seg.mesh.material.dispose();
                }
            }
        }
        this.floorSegments = this.floorSegments.filter(s => s.active);
    }

    _checkCollisions(dt) {
        if (this.bossState === 'defeated') return;
        const bossPos = this.bossGroup.position;

        // Body collision
        if (this.player.position.distanceTo(bossPos) < 1.1) {
            if (this.player && typeof this.player.takeDamage === 'function') {
                this.player.takeDamage(25, 'energy', this);
            } else {
                console.warn('BossFight: player.takeDamage not available');
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

        // Arm collision
        for (const arm of this.arms) {
            const wPos = new THREE.Vector3();
            arm.getWorldPosition(wPos);
            if (this.player.position.distanceTo(wPos) < 0.7) {
                if (this.player && typeof this.player.takeDamage === 'function') {
                    this.player.takeDamage(15, 'energy', this);
                } else {
                    console.warn('BossFight: player.takeDamage not available');
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

        if (this.currentPhase === 1 && pct <= 0.66) {
            this._startPhaseTransition(2);
        } else if (this.currentPhase === 2 && pct <= 0.33) {
            this._startPhaseTransition(3);
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

    /* ---------------------------------------------------------------------- */
    /*  External query helpers                                                */
    /* ---------------------------------------------------------------------- */
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

    getPlayerTimeScale() {
        return this._playerInTimeDistortion ? 0.3 : 1.0;
    }
}
