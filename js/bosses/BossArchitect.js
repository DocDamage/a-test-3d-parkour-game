/**
 * BossArchitect — shifting maze boss with gravity manipulation.
 *
 * Phases:
 *   1: Holographic duplicates. Real one casts shadows differently.
 *   2: Maze collapses inward. Must parkour to center platform.
 *   3: Gravity shifts 90°. Wallrun becomes floor run. Adapt or die.
 * Weak Point: Hologram projector on head (flickers when he changes maze layout).
 */

import * as THREE from 'three';

export class BossArchitect {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;

        this.currentPhase = 1;
        this.health = 3200;
        this.maxHealth = 3200;
        this.isActive = false;
        this.isDead = false;

        // Phase 1: holograms
        this.duplicates = [];
        this.shuffleTimer = 0;
        this.realIndex = 0;

        // Phase 2: maze collapse
        this.collapseTimer = 0;
        this.wallMeshes = [];

        // Phase 3: gravity shift
        this.gravityShiftTimer = 0;
        this.gravityAxis = new THREE.Vector3(0, -1, 0);

        this.group = new THREE.Group();
        this.scene.add(this.group);
        this._buildMesh();
        this.position = new THREE.Vector3(0, 2, 0);
        this.group.position.copy(this.position);
    }

    start() {
        this.isActive = true;
        this.currentPhase = 1;
        this.health = this.maxHealth;
        this.duplicates = [];
        this._spawnDuplicates();
    }

    stop() {
        this.isActive = false;
        this.group.visible = false;
    }

    update(dt) {
        if (!this.isActive || this.isDead) return;
        switch (this.currentPhase) {
            case 1: this._updatePhase1(dt); break;
            case 2: this._updatePhase2(dt); break;
            case 3: this._updatePhase3(dt); break;
        }
        this._updateVisuals();
    }

    _spawnDuplicates() {
        for (let i = 0; i < 3; i++) {
            const dup = this.bodyMesh.clone();
            dup.position.set((i - 1) * 4, 2, 0);
            dup.material = dup.material.clone();
            dup.material.transparent = true;
            dup.material.opacity = 0.6;
            this.scene.add(dup);
            this.duplicates.push(dup);
        }
        this.realIndex = Math.floor(Math.random() * this.duplicates.length);
        this.duplicates[this.realIndex].material.opacity = 0.95;
    }

    _updatePhase1(dt) {
        this.shuffleTimer -= dt;
        if (this.shuffleTimer <= 0) {
            this.shuffleTimer = 4.0;
            // Shuffle positions
            const positions = this.duplicates.map(d => d.position.clone());
            positions.sort(() => Math.random() - 0.5);
            for (let i = 0; i < this.duplicates.length; i++) {
                this.duplicates[i].position.copy(positions[i]);
            }
            this.realIndex = Math.floor(Math.random() * this.duplicates.length);
            for (let i = 0; i < this.duplicates.length; i++) {
                this.duplicates[i].material.opacity = (i === this.realIndex) ? 0.95 : 0.5;
            }
        }
        if (this.health <= this.maxHealth * 0.6) {
            this._clearDuplicates();
            this._transitionToPhase(2);
        }
    }

    _clearDuplicates() {
        for (const dup of this.duplicates) {
            this.scene.remove(dup);
        }
        this.duplicates = [];
    }

    _updatePhase2(dt) {
        this.collapseTimer -= dt;
        if (this.collapseTimer <= 0) {
            this.collapseTimer = 6.0;
            // Spawn inward-moving walls
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(2, 6, 0.5),
                    new THREE.MeshStandardMaterial({ color: 0x888888 })
                );
                mesh.position.set(Math.cos(angle) * 12, 3, Math.sin(angle) * 12);
                mesh.lookAt(0, 3, 0);
                this.scene.add(mesh);
                this.wallMeshes.push({ mesh, dir: new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle)) });
            }
        }
        // Move walls inward
        for (const w of this.wallMeshes) {
            w.mesh.position.addScaledVector(w.dir, 2 * dt);
        }
        if (this.health <= this.maxHealth * 0.3) {
            this._clearWalls();
            this._transitionToPhase(3);
        }
    }

    _clearWalls() {
        for (const w of this.wallMeshes) this.scene.remove(w.mesh);
        this.wallMeshes = [];
    }

    _updatePhase3(dt) {
        this.gravityShiftTimer -= dt;
        if (this.gravityShiftTimer <= 0) {
            this.gravityShiftTimer = 10.0;
            // Shift gravity 90°
            const axes = [
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(0, 0, -1),
                new THREE.Vector3(1, 0, 0),
            ];
            this.gravityAxis = axes[Math.floor(Math.random() * axes.length)];
            if (this.player) {
                // Visual indication
                this.player.velocity.add(this.gravityAxis.clone().multiplyScalar(-5));
            }
        }
        // Apply shifted gravity to player
        if (this.player && this.gravityAxis) {
            this.player.velocity.add(this.gravityAxis.clone().multiplyScalar(15 * dt));
        }
    }

    _transitionToPhase(phase) {
        this.currentPhase = phase;
    }

    takeDamage(amount, type, source) {
        if (this.isDead) return 0;
        if (this.currentPhase === 1) {
            // Only damage real Architect
            const hitIndex = this.duplicates.findIndex(d => d.position.distanceTo(source.position || source) < 1.5);
            if (hitIndex !== this.realIndex) {
                amount = 0; // hologram
            }
        }
        this.health -= amount;
        if (this.health <= 0) this.die();
        return amount;
    }

    die() {
        this.isDead = true;
        this.isActive = false;
        this._clearDuplicates();
        this._clearWalls();
        setTimeout(() => { if (this.group) this.group.visible = false; }, 3000);
    }

    _buildMesh() {
        const geo = new THREE.BoxGeometry(1, 2, 1);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xaa44ff, emissive: 0x4400aa, emissiveIntensity: 0.5,
            transparent: true, opacity: 0.8
        });
        this.bodyMesh = new THREE.Mesh(geo, mat);
        this.bodyMesh.position.y = 1;
        this.group.add(this.bodyMesh);

        // Projector on head
        const proj = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 })
        );
        proj.position.y = 2.2;
        this.projMesh = proj;
        this.group.add(proj);
    }

    _updateVisuals() {
        if (this.projMesh) {
            const flicker = this.currentPhase === 1 && this.shuffleTimer < 1.0;
            this.projMesh.material.emissiveIntensity = flicker ? (Math.random() * 3) : 1;
        }
    }
}
