import * as THREE from 'three';

// ======================
// CONFIGURATION
// ======================

/** World-space positions for each checkpoint ring. */
const CHECKPOINT_POSITIONS = [
    new THREE.Vector3(0, 1.5, 8),       // 1. Start line near spawn
    new THREE.Vector3(14, 1.5, -5),     // 2. After vault barriers
    new THREE.Vector3(0, 4.5, 0),       // 3. Top of central platform
    new THREE.Vector3(26, 1.5, 10),     // 4. Through slide tunnel
    new THREE.Vector3(16, 1.7, 16),     // 5. End of balance beam
    new THREE.Vector3(-15, 4.5, -10),   // 6. After wall-climb section
    new THREE.Vector3(0, 4.5, -20),     // 7. Through moving platform gauntlet
    new THREE.Vector3(-27.5, 5, 0),     // 8. Through wall-jump corridor
    new THREE.Vector3(0, 2, 20),        // 9. Near finish line
    new THREE.Vector3(0, 1.5, 28),      // 10. Finish line
];

const CHECKPOINT_RADIUS = 1.8;
const CHECKPOINT_TUBE = 0.15;
const CHECKPOINT_RADIAL_SEGMENTS = 16;
const CHECKPOINT_TUBULAR_SEGMENTS = 32;

const COLORS = {
    UPCOMING: 0x00ff00,
    CURRENT: 0xffff00,
    PASSED: 0x0088ff,
};

const LS_KEYS = {
    BEST_SPLITS: 'parkour_timeTrial_bestSplits',
    GHOST: 'parkour_timeTrial_ghost',
    LEADERBOARD: 'parkour_timeTrial_leaderboard',
};

const RECORD_INTERVAL = 0.05; // 50 ms

/**
 * TimeTrial - Race mode with checkpoints, timer, ghost replay and leaderboard.
 *
 * Integration notes:
 *  - Instantiate once in main.js after the Player is created.
 *  - Call handleInput(input) every frame so edge-detection works for T / R / Escape.
 *  - Call update(dt, player) every frame.
 *  - Skip player.update(...) while timeTrial.state === 'COUNTDOWN' to freeze movement.
 */
export class TimeTrial {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        this.state = 'IDLE'; // IDLE | COUNTDOWN | RACING | FINISHED

        this.checkpoints = [];
        this.currentCheckpointIndex = -1;

        this.timer = 0;          // official race time (starts at CP1)
        this.raceElapsed = 0;    // time since GO! (used for ghost recording)
        this.timerRunning = false;
        this.splitTimes = [];
        this.bestSplits = [];

        this.ghostData = null;
        this.ghostMesh = null;
        this.ghostPlaybackTime = 0;
        this.ghostPlaybackIndex = 0;

        this.recording = [];
        this.recordTimer = 0;

        this.leaderboard = [];

        this.countdownTimer = 0;

        this.ui = this.cacheUI();
        this.initCheckpoints();
        this.createGhostMesh();
        this.loadData();
        this.bindButtons();

        // Edge-detection buffers for keyboard input
        this._wasT = false;
        this._wasR = false;
        this._wasEsc = false;
    }

    // --------------------
    // Setup
    // --------------------

    cacheUI() {
        return {
            raceUI: document.getElementById('race-ui'),
            timer: document.getElementById('timer'),
            checkpointCounter: document.getElementById('checkpoint-counter'),
            bestTime: document.getElementById('best-time'),
            countdown: document.getElementById('countdown'),
            raceResults: document.getElementById('race-results'),
            finalTime: document.getElementById('final-time'),
            runName: document.getElementById('run-name'),
            leaderboard: document.getElementById('leaderboard'),
            celebration: document.getElementById('celebration'),
            restartBtn: document.getElementById('race-restart'),
            exitBtn: document.getElementById('race-exit'),
        };
    }

    bindButtons() {
        this.ui.restartBtn.addEventListener('click', () => this.startRace());
        this.ui.exitBtn.addEventListener('click', () => this.cancelRace());
    }

    initCheckpoints() {
        const geometry = new THREE.TorusGeometry(
            CHECKPOINT_RADIUS,
            CHECKPOINT_TUBE,
            CHECKPOINT_RADIAL_SEGMENTS,
            CHECKPOINT_TUBULAR_SEGMENTS
        );

        CHECKPOINT_POSITIONS.forEach((pos, i) => {
            const material = new THREE.MeshStandardMaterial({
                color: COLORS.UPCOMING,
                emissive: COLORS.UPCOMING,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide,
            });

            const mesh = new THREE.Mesh(geometry.clone(), material);
            mesh.position.copy(pos);
            mesh.visible = false;
            this.scene.add(mesh);

            this.checkpoints.push({
                index: i,
                position: pos.clone(),
                mesh,
                passed: false,
                splitTime: null,
            });
        });
    }

    createGhostMesh() {
        const group = new THREE.Group();

        const ghostMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
        });

        // Body capsule
        const bodyGeo = new THREE.CapsuleGeometry(0.3, 1.1, 4, 8);
        const body = new THREE.Mesh(bodyGeo, ghostMat);
        body.position.y = 0.85;
        group.add(body);

        // Head
        const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const head = new THREE.Mesh(headGeo, ghostMat);
        head.position.y = 1.5;
        group.add(head);

        group.visible = false;
        this.scene.add(group);
        this.ghostMesh = group;
    }

    // --------------------
    // Persistence
    // --------------------

    loadData() {
        try {
            const raw = localStorage.getItem(LS_KEYS.BEST_SPLITS);
            if (raw) this.bestSplits = JSON.parse(raw);
        } catch (e) { this.bestSplits = []; }

        try {
            const raw = localStorage.getItem(LS_KEYS.GHOST);
            if (raw) this.ghostData = JSON.parse(raw);
        } catch (e) { this.ghostData = null; }

        try {
            const raw = localStorage.getItem(LS_KEYS.LEADERBOARD);
            if (raw) this.leaderboard = JSON.parse(raw);
        } catch (e) { this.leaderboard = []; }
    }

    saveData() {
        localStorage.setItem(LS_KEYS.BEST_SPLITS, JSON.stringify(this.bestSplits));
        localStorage.setItem(LS_KEYS.GHOST, JSON.stringify(this.ghostData));
        localStorage.setItem(LS_KEYS.LEADERBOARD, JSON.stringify(this.leaderboard));
    }

    // --------------------
    // Race Lifecycle
    // --------------------

    startRace() {
        this.state = 'COUNTDOWN';
        this.timer = 0;
        this.raceElapsed = 0;
        this.timerRunning = false;
        this.splitTimes = [];
        this.currentCheckpointIndex = 0;
        this.countdownTimer = 0;

        this.recording = [];
        this.recordTimer = 0;

        this.ghostPlaybackTime = 0;
        this.ghostPlaybackIndex = 0;

        // Respawn player to ensure a fair start
        if (this.player.respawn) {
            this.player.respawn();
        }

        // Reset checkpoints
        this.checkpoints.forEach((cp, i) => {
            cp.passed = false;
            cp.splitTime = null;
            cp.mesh.visible = true;
            cp.mesh.material.color.setHex(i === 0 ? COLORS.CURRENT : COLORS.UPCOMING);
            cp.mesh.material.emissive.setHex(i === 0 ? COLORS.CURRENT : COLORS.UPCOMING);
            cp.mesh.rotation.set(0, 0, 0);
        });

        this.updateCheckpointVisuals();

        // UI
        this.ui.raceUI.style.display = 'block';
        this.ui.raceResults.style.display = 'none';
        this.ui.celebration.style.display = 'none';
        this.ui.countdown.style.display = 'block';
        this.ui.countdown.textContent = '3';
        this.ui.timer.textContent = '00:00.000';
        this.ui.checkpointCounter.textContent = `1 / ${this.checkpoints.length}`;
        this.updateBestTimeDisplay();

        // Ghost
        if (this.ghostData && this.ghostData.points && this.ghostData.points.length > 0) {
            this.ghostMesh.visible = true;
        } else {
            this.ghostMesh.visible = false;
        }
    }

    cancelRace() {
        this.state = 'IDLE';
        this.checkpoints.forEach(cp => { cp.mesh.visible = false; });
        this.ghostMesh.visible = false;
        this.ui.raceUI.style.display = 'none';
        this.ui.raceResults.style.display = 'none';
        this.ui.celebration.style.display = 'none';
        this.ui.countdown.style.display = 'none';
    }

    finishRace() {
        this.state = 'FINISHED';
        this.checkpoints.forEach(cp => { cp.mesh.visible = false; });
        this.ghostMesh.visible = false;

        const totalMs = Math.round(this.timer * 1000);
        const isNewBest = this.isNewBest(totalMs);

        if (isNewBest) {
            this.bestSplits = [...this.splitTimes];
            this.ghostData = {
                totalTime: this.raceElapsed,
                points: this.recording,
            };
            this.ui.celebration.style.display = 'block';
            setTimeout(() => {
                if (this.ui.celebration) this.ui.celebration.style.display = 'none';
            }, 3000);
        }

        // Leaderboard entry
        const entry = {
            time: totalMs,
            date: new Date().toLocaleString(),
            name: (this.ui.runName.value || '').trim() || 'Anonymous',
        };
        this.leaderboard.push(entry);
        this.leaderboard.sort((a, b) => a.time - b.time);
        this.leaderboard = this.leaderboard.slice(0, 5);
        this.saveData();

        // Results UI
        this.ui.raceUI.style.display = 'none';
        this.ui.countdown.style.display = 'none';
        this.ui.finalTime.textContent = this.formatTime(totalMs);
        this.ui.runName.value = '';
        this.renderLeaderboard();
        this.ui.raceResults.style.display = 'block';
    }

    isNewBest(totalMs) {
        if (this.bestSplits.length === 0) return true;
        const bestTotal = this.bestSplits[this.bestSplits.length - 1];
        return totalMs < bestTotal;
    }

    renderLeaderboard() {
        const container = this.ui.leaderboard;
        container.innerHTML = '';
        this.leaderboard.forEach((entry, i) => {
            const div = document.createElement('div');
            div.className = 'entry' + (i === 0 ? ' best' : '');
            div.textContent = `${i + 1}. ${entry.name} — ${this.formatTime(entry.time)} (${entry.date})`;
            container.appendChild(div);
        });
    }

    updateBestTimeDisplay() {
        if (this.bestSplits.length > 0) {
            const total = this.bestSplits[this.bestSplits.length - 1];
            this.ui.bestTime.textContent = `Best: ${this.formatTime(total)}`;
        } else {
            this.ui.bestTime.textContent = 'Best: --:--.---';
        }
    }

    // --------------------
    // Per-Frame Update
    // --------------------

    update(dt, player) {
        switch (this.state) {
            case 'COUNTDOWN':
                this.updateCountdown(dt, player);
                this.animateCheckpoints(dt);
                break;
            case 'RACING':
                this.updateRacing(dt, player);
                this.updateGhost(dt);
                this.animateCheckpoints(dt);
                break;
            default:
                break;
        }
    }

    updateCountdown(dt, player) {
        this.countdownTimer += dt;

        // Safety net: zero velocity so the player doesn't drift.
        // NOTE: For a true freeze, skip calling player.update() in main.js during COUNTDOWN.
        player.velocity.set(0, 0, 0);

        let displayText = '';
        if (this.countdownTimer < 1.0) {
            displayText = '3';
        } else if (this.countdownTimer < 2.0) {
            displayText = '2';
        } else if (this.countdownTimer < 3.0) {
            displayText = '1';
        } else if (this.countdownTimer < 3.6) {
            displayText = 'GO!';
        } else {
            this.state = 'RACING';
            this.timer = 0;
            this.raceElapsed = 0;
            this.ui.countdown.style.display = 'none';
            return;
        }

        if (this.ui.countdown.textContent !== displayText) {
            this.ui.countdown.textContent = displayText;
        }
    }

    updateRacing(dt, player) {
        this.raceElapsed += dt;

        if (this.timerRunning) {
            this.timer += dt;
        }

        // Record ghost sample every 50 ms
        this.recordTimer += dt;
        if (this.recordTimer >= RECORD_INTERVAL) {
            this.recordTimer -= RECORD_INTERVAL;
            this.recording.push({
                t: this.raceElapsed,
                pos: {
                    x: player.position.x,
                    y: player.position.y,
                    z: player.position.z,
                },
                rot: {
                    y: player.mesh.rotation.y,
                },
            });
        }

        this.checkCheckpoints(player);
        this.updateUI();
    }

    checkCheckpoints(player) {
        if (this.currentCheckpointIndex < 0 || this.currentCheckpointIndex >= this.checkpoints.length) {
            return;
        }

        const cp = this.checkpoints[this.currentCheckpointIndex];
        const distSq = player.position.distanceToSquared(cp.position);
        const triggerRadius = CHECKPOINT_RADIUS * 0.85;

        if (distSq < triggerRadius * triggerRadius) {
            // First checkpoint starts the official timer
            if (this.currentCheckpointIndex === 0 && !this.timerRunning) {
                this.timerRunning = true;
                this.timer = 0;
            }

            const splitMs = Math.round(this.timer * 1000);
            cp.splitTime = splitMs;
            cp.passed = true;
            this.splitTimes.push(splitMs);

            // Turn passed checkpoint blue
            cp.mesh.material.color.setHex(COLORS.PASSED);
            cp.mesh.material.emissive.setHex(COLORS.PASSED);

            this.currentCheckpointIndex++;

            if (this.currentCheckpointIndex >= this.checkpoints.length) {
                this.finishRace();
            } else {
                this.updateCheckpointVisuals();
            }
        }
    }

    updateCheckpointVisuals() {
        this.checkpoints.forEach((cp, i) => {
            if (i === this.currentCheckpointIndex) {
                cp.mesh.material.color.setHex(COLORS.CURRENT);
                cp.mesh.material.emissive.setHex(COLORS.CURRENT);
            } else if (cp.passed) {
                cp.mesh.material.color.setHex(COLORS.PASSED);
                cp.mesh.material.emissive.setHex(COLORS.PASSED);
            } else {
                cp.mesh.material.color.setHex(COLORS.UPCOMING);
                cp.mesh.material.emissive.setHex(COLORS.UPCOMING);
            }
        });
    }

    animateCheckpoints(dt) {
        const time = Date.now() * 0.003;
        this.checkpoints.forEach((cp, i) => {
            if (!cp.mesh.visible) return;
            cp.mesh.rotation.y += dt * 1.2;
            cp.mesh.position.y = cp.position.y + Math.sin(time + i * 1.5) * 0.12;
        });
    }

    // --------------------
    // Ghost Replay
    // --------------------

    updateGhost(dt) {
        if (!this.ghostMesh.visible || !this.ghostData || !this.ghostData.points || this.ghostData.points.length === 0) {
            return;
        }

        this.ghostPlaybackTime += dt;

        const points = this.ghostData.points;

        // Advance index to the correct segment
        while (this.ghostPlaybackIndex < points.length - 1 &&
               points[this.ghostPlaybackIndex + 1].t < this.ghostPlaybackTime) {
            this.ghostPlaybackIndex++;
        }

        if (this.ghostPlaybackIndex >= points.length - 1) {
            const last = points[points.length - 1];
            this.ghostMesh.position.set(last.pos.x, last.pos.y, last.pos.z);
            this.ghostMesh.rotation.y = last.rot.y;
            return;
        }

        const p0 = points[this.ghostPlaybackIndex];
        const p1 = points[this.ghostPlaybackIndex + 1];
        const segDt = p1.t - p0.t;
        const alpha = segDt > 0 ? (this.ghostPlaybackTime - p0.t) / segDt : 0;

        this.ghostMesh.position.x = THREE.MathUtils.lerp(p0.pos.x, p1.pos.x, alpha);
        this.ghostMesh.position.y = THREE.MathUtils.lerp(p0.pos.y, p1.pos.y, alpha);
        this.ghostMesh.position.z = THREE.MathUtils.lerp(p0.pos.z, p1.pos.z, alpha);

        let rotDiff = p1.rot.y - p0.rot.y;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        this.ghostMesh.rotation.y = p0.rot.y + rotDiff * alpha;
    }

    // --------------------
    // UI Helpers
    // --------------------

    updateUI() {
        const totalMs = Math.round(this.timer * 1000);
        this.ui.timer.textContent = this.formatTime(totalMs);
        this.ui.checkpointCounter.textContent = `${this.currentCheckpointIndex + 1} / ${this.checkpoints.length}`;

        if (!this.timerRunning) {
            this.updateBestTimeDisplay();
            return;
        }

        const cpIndex = this.currentCheckpointIndex;
        if (cpIndex < this.bestSplits.length && cpIndex >= 0) {
            const bestSplit = this.bestSplits[cpIndex];
            const currentSplit = totalMs;
            const diff = currentSplit - bestSplit;
            const sign = diff <= 0 ? '-' : '+';
            const diffStr = this.formatTime(Math.abs(diff));
            this.ui.bestTime.textContent = `Best: ${this.formatTime(bestSplit)} (${sign}${diffStr})`;
        } else {
            this.updateBestTimeDisplay();
        }
    }

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const millis = ms % 1000;
        const mStr = minutes.toString().padStart(2, '0');
        const sStr = seconds.toString().padStart(2, '0');
        const msStr = millis.toString().padStart(3, '0');
        return `${mStr}:${sStr}.${msStr}`;
    }

    // --------------------
    // Input Handling
    // --------------------

    /**
     * Call this every frame with the current InputManager instance.
     * Edge detection for T / R / Escape is handled internally.
     */
    handleInput(input) {
        const t = input.isPressed('KeyT');
        const r = input.isPressed('KeyR');
        const esc = input.isPressed('Escape');

        if (t && !this._wasT) {
            if (this.state === 'IDLE' || this.state === 'FINISHED') {
                this.startRace();
            } else if (this.state === 'RACING' || this.state === 'COUNTDOWN') {
                this.startRace(); // restart
            }
        }

        if ((r && !this._wasR) || (esc && !this._wasEsc)) {
            if (this.state === 'RACING' || this.state === 'COUNTDOWN') {
                this.cancelRace();
            }
        }

        this._wasT = t;
        this._wasR = r;
        this._wasEsc = esc;
    }
}
