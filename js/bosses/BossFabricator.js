/**
 * BossFabricator — industrial assembly-line boss.
 *
 * Phases:
 *   1: Spawns minions from 3 assembly lines. Destroy all lines.
 *   2: Welding arm sweeps. Vault over or slide under.
 *   3: Core exposed. Floor is lava — magnet boots on ceiling required.
 * Weak Point: Welding torch overheats after 3 attacks (5s vulnerability).
 */

import * as THREE from 'three';

export class BossFabricator {
    constructor(scene, world, player, enemyManager) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.enemyManager = enemyManager;

        this.currentPhase = 1;
        this.health = 3000;
        this.maxHealth = 3000;
        this.isActive = false;
        this.isDead = false;

        // Assembly lines (Phase 1)
        this.assemblyLines = [true, true, true];
        this.spawnTimer = 0;

        // Welding arm (Phase 2)
        this.armAngle = 0;
        this.armSweepSpeed = 1.2;
        this.armHeight = 2.5;
        this.sweepDirection = 1;
        this.torchOverheat = 0; // attacks until overheat
        this.torchVulnerable = false;
        this.torchVulnTimer = 0;

        // Core (Phase 3)
        this.coreExposed = false;
        this.coreHealth = 800;
        this.lavaActive = false;
        this.lavaDamageTimer = 0;

        // Visuals
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this._buildMesh();

        this.position = new THREE.Vector3(0, 3, 0);
        this.group.position.copy(this.position);
    }

    /* ------------------------------------------------------------------ */
    /*  Lifecycle                                                         */
    /* ------------------------------------------------------------------ */

    start() {
        this.isActive = true;
        this.currentPhase = 1;
        this.health = this.maxHealth;
        this.coreHealth = 800;
        this.assemblyLines = [true, true, true];
        this.torchOverheat = 3;
        this.torchVulnerable = false;
        this.lavaActive = false;
        console.log('[Boss] Fabricator activated — Phase 1');
    }

    stop() {
        this.isActive = false;
        this.group.visible = false;
    }

    /* ------------------------------------------------------------------ */
    /*  Per-frame update                                                  */
    /* ------------------------------------------------------------------ */

    update(dt) {
        if (!this.isActive || this.isDead) return;

        switch (this.currentPhase) {
            case 1: this._updatePhase1(dt); break;
            case 2: this._updatePhase2(dt); break;
            case 3: this._updatePhase3(dt); break;
        }

        // Global: rotate body slowly
        this.group.rotation.y += dt * 0.2;

        // Update mesh visibility per phase
        this._updateVisuals();
    }

    /* ------------------------------------------------------------------ */
    /*  Phase 1 — Assembly Lines                                          */
    /* ------------------------------------------------------------------ */

    _updatePhase1(dt) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 4.0;
            for (let i = 0; i < 3; i++) {
                if (this.assemblyLines[i] && this.enemyManager) {
                    const angle = (i / 3) * Math.PI * 2;
                    const pos = new THREE.Vector3(
                        this.position.x + Math.cos(angle) * 8,
                        3,
                        this.position.z + Math.sin(angle) * 8
                    );
                    this.enemyManager.spawnEnemy('brawler', { position: pos });
                }
            }
        }

        // Check if all lines destroyed
        if (!this.assemblyLines.some(l => l)) {
            this._transitionToPhase(2);
        }
    }

    destroyAssemblyLine(index) {
        if (index >= 0 && index < 3) {
            this.assemblyLines[index] = false;
            this.health -= 300;
            console.log(`[Boss] Assembly line ${index} destroyed!`);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Phase 2 — Welding Arm Sweep                                       */
    /* ------------------------------------------------------------------ */

    _updatePhase2(dt) {
        // Arm sweeps back and forth
        this.armAngle += this.armSweepSpeed * dt * this.sweepDirection;
        if (Math.abs(this.armAngle) > 1.2) {
            this.sweepDirection *= -1;
            this.torchOverheat--;
            if (this.torchOverheat <= 0) {
                this.torchVulnerable = true;
                this.torchVulnTimer = 5.0;
                this.torchOverheat = 0;
                console.log('[Boss] Welding torch OVERHEATED — 5s vulnerability!');
            }
        }

        if (this.torchVulnerable) {
            this.torchVulnTimer -= dt;
            if (this.torchVulnTimer <= 0) {
                this.torchVulnerable = false;
                this.torchOverheat = 3;
                console.log('[Boss] Torch cooled down.');
            }
        }

        // Damage player if arm hits them
        if (this.player) {
            const armPos = this._getArmPosition();
            const dist = this.player.position.distanceTo(armPos);
            if (dist < 2.0 && !this.torchVulnerable) {
                if (this.player.takeDamage) this.player.takeDamage(20, 'energy', this);
            }
        }

        // Phase transition at 40% HP
        if (this.health <= this.maxHealth * 0.4) {
            this._transitionToPhase(3);
        }
    }

    _getArmPosition() {
        const sweep = new THREE.Vector3(
            Math.cos(this.armAngle) * 6,
            this.armHeight,
            Math.sin(this.armAngle) * 6
        );
        return this.position.clone().add(sweep);
    }

    /* ------------------------------------------------------------------ */
    /*  Phase 3 — Core Exposure + Lava Floor                              */
    /* ------------------------------------------------------------------ */

    _updatePhase3(dt) {
        this.coreExposed = true;
        this.lavaActive = true;

        // Floor lava damage
        if (this.player && this.player.position.y < 2.0) {
            this.lavaDamageTimer -= dt;
            if (this.lavaDamageTimer <= 0) {
                this.lavaDamageTimer = 0.5;
                if (this.player.takeDamage) this.player.takeDamage(15, 'energy', this);
            }
        }

        // Core damage check
        if (this.coreHealth <= 0) {
            this.die();
        }
    }

    _transitionToPhase(phase) {
        this.currentPhase = phase;
        console.log(`[Boss] Fabricator entering Phase ${phase}`);
    }

    /* ------------------------------------------------------------------ */
    /*  Damage                                                            */
    /* ------------------------------------------------------------------ */

    takeDamage(amount, type, source) {
        if (this.isDead) return 0;

        // Phase 2: only vulnerable when torch overheated
        if (this.currentPhase === 2 && !this.torchVulnerable) {
            amount *= 0.1; // 90% damage reduction
        }

        // Phase 3: damage core directly
        if (this.currentPhase === 3 && this.coreExposed) {
            this.coreHealth -= amount;
            if (this.coreHealth <= 0) {
                this.die();
                return amount;
            }
        }

        this.health -= amount;
        if (this.health <= 0 && this.currentPhase !== 3) {
            this.die();
        }
        return amount;
    }

    die() {
        this.isDead = true;
        this.isActive = false;
        console.log('[Boss] Fabricator DEFEATED');
        // Explosion visual
        if (this.group) {
            this.group.children.forEach(c => {
                if (c.material) c.material.emissive.setHex(0xff0000);
            });
        }
        setTimeout(() => { if (this.group) this.group.visible = false; }, 3000);
    }

    isActive() { return this.isActive; }

    /* ------------------------------------------------------------------ */
    /*  Visuals                                                           */
    /* ------------------------------------------------------------------ */

    _buildMesh() {
        // Main body
        const bodyGeo = new THREE.CylinderGeometry(1.5, 2, 3, 12);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x664422, emissive: 0x332211, emissiveIntensity: 0.3,
            roughness: 0.7, metalness: 0.6
        });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 1.5;
        this.group.add(this.bodyMesh);

        // Welding arm
        const armGeo = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
        this.armMesh = new THREE.Mesh(armGeo, armMat);
        this.armMesh.rotation.z = Math.PI / 2;
        this.armMesh.position.y = 2.5;
        this.group.add(this.armMesh);

        // Torch tip
        const torchGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const torchMat = new THREE.MeshStandardMaterial({
            color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 2
        });
        this.torchMesh = new THREE.Mesh(torchGeo, torchMat);
        this.torchMesh.position.set(3, 2.5, 0);
        this.group.add(this.torchMesh);

        // Core (Phase 3)
        const coreGeo = new THREE.IcosahedronGeometry(0.8, 1);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff, emissive: 0x00aaff, emissiveIntensity: 1,
            transparent: true, opacity: 0.6
        });
        this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
        this.coreMesh.position.y = 2;
        this.coreMesh.visible = false;
        this.group.add(this.coreMesh);
    }

    _updateVisuals() {
        if (!this.armMesh || !this.torchMesh) return;

        // Arm sweep rotation
        const armPos = this._getArmPosition();
        this.armMesh.lookAt(armPos);
        this.torchMesh.position.copy(armPos).sub(this.position);

        // Torch overheat visual
        if (this.torchVulnerable) {
            this.torchMesh.material.emissive.setHex(0x00ff00);
        } else {
            this.torchMesh.material.emissive.setHex(0xff2200);
        }

        // Core visibility
        this.coreMesh.visible = this.coreExposed;
    }
}
