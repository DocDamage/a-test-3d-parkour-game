import * as THREE from 'three';

/**
 * GhostRacing - Async multiplayer ghost replay system.
 * Records player runs, saves them to localStorage, and replays
 * up to 5 translucent capsule ghosts in the scene.
 */
export class GhostRacing {
    constructor(scene) {
        this.scene = scene;
        this.currentRun = [];
        this.recordTime = 0;
        this.isRecording = false;

        this.ghosts = []; // { data, mesh, material, time, index, active }
        this.maxGhosts = 5;
        this.ghostColors = [
            0x00ffff,
            0xff00ff,
            0xffff00,
            0x00ff00,
            0xff8800
        ];

        this._tmpPos = new THREE.Vector3();
        this._tmpQuat = new THREE.Quaternion();
    }

    /** Start a new recording. */
    startRecording() {
        this.currentRun = [];
        this.recordTime = 0;
        this.isRecording = true;
    }

    /** Stop recording (does not save automatically). */
    stopRecording() {
        this.isRecording = false;
    }

    /**
     * Store one frame of player data.
     * @param {number} dt
     * @param {Player} player
     */
    recordFrame(dt, player) {
        if (!this.isRecording) return;
        this.recordTime += dt;

        // Capture mesh rotation if available, otherwise derive from facing
        let qx = 0, qy = 0, qz = 0, qw = 1;
        if (player.mesh && player.mesh.quaternion) {
            const q = player.mesh.quaternion;
            qx = q.x; qy = q.y; qz = q.z; qw = q.w;
        } else {
            // Derive quaternion from facing angle
            const half = player.facing * 0.5;
            qy = Math.sin(half);
            qw = Math.cos(half);
        }

        this.currentRun.push({
            t: this.recordTime,
            pos: [player.position.x, player.position.y, player.position.z],
            rot: [qx, qy, qz, qw],
            state: player.state,
            facing: player.facing,
            vel: [player.velocity.x, player.velocity.y, player.velocity.z]
        });
    }

    /**
     * Save the current run to localStorage.
     * @param {string} name
     */
    saveRun(name) {
        if (!this.currentRun.length) return;
        const payload = {
            name: name || 'Run',
            savedAt: Date.now(),
            duration: this.recordTime,
            frames: this.currentRun
        };
        const key = `ghostRun_${name}_${Date.now()}`;
        try {
            localStorage.setItem(key, JSON.stringify(payload));
        } catch (e) {
            window.__DEV__ && console.warn('GhostRacing: localStorage save failed', e);
        }
    }

    /**
     * Load N random ghosts from localStorage.
     * @param {number} count
     * @returns {number} number of ghosts actually loaded
     */
    loadRandomGhosts(count) {
        // Clear existing ghosts
        this.clearGhosts();

        const keys = Object.keys(localStorage).filter(k => k.startsWith('ghostRun_'));

        if (keys.length === 0) return 0;

        // Shuffle keys
        for (let i = keys.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [keys[i], keys[j]] = [keys[j], keys[i]];
        }

        const toLoad = Math.min(count, this.maxGhosts, keys.length);
        let loaded = 0;

        for (let i = 0; i < toLoad; i++) {
            try {
                const raw = localStorage.getItem(keys[i]);
                if (!raw) continue;
                const data = JSON.parse(raw);
                if (!data.frames || data.frames.length < 2) continue;
                this._spawnGhost(data, this.ghostColors[i % this.ghostColors.length]);
                loaded++;
            } catch (e) {
                window.__DEV__ && console.warn('GhostRacing: failed to load ghost', keys[i], e);
            }
        }

        return loaded;
    }

    /** Remove all ghost meshes from the scene. */
    clearGhosts() {
        for (const g of this.ghosts) {
            if (g.mesh) {
                this.scene.remove(g.mesh);
                g.mesh.traverse(c => {
                    if (c.geometry) c.geometry.dispose();
                    if (c.material) c.material.dispose();
                });
            }
        }
        this.ghosts = [];
    }

    /**
     * Update ghost replays.
     * @param {number} dt
     */
    update(dt) {
        for (const ghost of this.ghosts) {
            if (!ghost.active) continue;

            ghost.time += dt;
            const frames = ghost.data.frames;
            if (!frames || frames.length < 2) continue;

            // Find surrounding keyframes
            while (ghost.index < frames.length - 2 && frames[ghost.index + 1].t < ghost.time) {
                ghost.index++;
            }

            const f0 = frames[ghost.index];
            const f1 = frames[ghost.index + 1];

            if (!f1) {
                // Hold at last frame
                const last = frames[frames.length - 1];
                this._tmpPos.set(last.pos[0], last.pos[1], last.pos[2]);
                this._tmpQuat.set(last.rot[0], last.rot[1], last.rot[2], last.rot[3]);
                ghost.mesh.position.copy(this._tmpPos);
                ghost.mesh.quaternion.copy(this._tmpQuat);
                continue;
            }

            // Interpolate
            const range = f1.t - f0.t;
            const t = range > 0.0001 ? Math.max(0, Math.min(1, (ghost.time - f0.t) / range)) : 0;

            this._tmpPos.set(
                THREE.MathUtils.lerp(f0.pos[0], f1.pos[0], t),
                THREE.MathUtils.lerp(f0.pos[1], f1.pos[1], t),
                THREE.MathUtils.lerp(f0.pos[2], f1.pos[2], t)
            );

            const q0 = new THREE.Quaternion(f0.rot[0], f0.rot[1], f0.rot[2], f0.rot[3]);
            const q1 = new THREE.Quaternion(f1.rot[0], f1.rot[1], f1.rot[2], f1.rot[3]);
            this._tmpQuat.copy(q0).slerp(q1, t);

            ghost.mesh.position.copy(this._tmpPos);
            ghost.mesh.quaternion.copy(this._tmpQuat);
        }
    }

    // ============================================================
    //  INTERNALS
    // ============================================================

    _spawnGhost(data, colorHex) {
        const group = new THREE.Group();

        // Capsule mesh: radius 0.35, length 1.0 => total height ~1.7
        let geo;
        try {
            geo = new THREE.CapsuleGeometry(0.35, 1.0, 4, 8);
        } catch (e) {
            // Fallback for older three.js without CapsuleGeometry
            geo = new THREE.CylinderGeometry(0.35, 0.35, 1.0, 12);
        }

        const mat = new THREE.MeshStandardMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
            roughness: 0.4,
            metalness: 0.6
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.85; // half total height
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        group.add(mesh);

        // Ghost "trail" glow ring
        const ringGeo = new THREE.TorusGeometry(0.45, 0.03, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.25
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.1;
        group.add(ring);

        this.scene.add(group);

        this.ghosts.push({
            data,
            mesh: group,
            material: mat,
            ringMaterial: ringMat,
            time: 0,
            index: 0,
            active: true
        });
    }
}
