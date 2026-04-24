import * as THREE from 'three';

/**
 * SpeedrunILs — Individual Level time trials for specific world zones.
 *
 * Integration:
 *   const ils = new SpeedrunILs(scene, player, world, timeTrial);
 *   ils.startIL('Rooftop');
 *   // In game loop:
 *   ils.update(dt);
 */

const ZONES = {
    Rooftop:    { start: new THREE.Vector3(35, 8.5, 35),  end: new THREE.Vector3(35, 8.5, 45) },
    Freezer:    { start: new THREE.Vector3(30, 1, -30),   end: new THREE.Vector3(30, 1, -20) },
    ServerRoom: { start: new THREE.Vector3(-10, 1, -35),  end: new THREE.Vector3(-10, 1, -15) },
    HangarBay:  { start: new THREE.Vector3(0, 1, 35),     end: new THREE.Vector3(0, 1, 45) },
};

// Grade thresholds in seconds (S / A / B / C — anything slower is D)
const TARGETS = {
    Rooftop:    { S: 3.0,  A: 5.0,  B: 8.0,  C: 12.0 },
    Freezer:    { S: 3.0,  A: 5.0,  B: 8.0,  C: 12.0 },
    ServerRoom: { S: 5.0,  A: 8.0,  B: 13.0, C: 18.0 },
    HangarBay:  { S: 3.0,  A: 5.0,  B: 8.0,  C: 12.0 },
};

const TRIGGER_SIZE = new THREE.Vector3(3, 3, 3);

export class SpeedrunILs {
    constructor(scene, player, world, timeTrial) {
        this.scene = scene;
        this.player = player;
        this.world = world;
        this.timeTrial = timeTrial;

        this.state = 'IDLE'; // IDLE | COUNTDOWN | RACING | FINISHED
        this.currentZone = null;
        this.timer = 0;
        this.countdownTimer = 0;
        this.splitTimes = [];

        this._triggers = new Map();
        this._buildTriggers();
        this._buildUI();
    }

    /* ------------------------------------------------------------------ */
    /*  Lifecycle                                                         */
    /* ------------------------------------------------------------------ */

    startIL(zoneName) {
        const zone = ZONES[zoneName];
        if (!zone) {
            console.warn(`SpeedrunILs: unknown zone "${zoneName}"`);
            return;
        }

        this.currentZone = zoneName;
        this.state = 'COUNTDOWN';
        this.timer = 0;
        this.countdownTimer = 0;
        this.splitTimes = [];

        // Teleport player
        this.player.respawn();
        this.player.position.copy(zone.start);
        this.player.velocity.set(0, 0, 0);

        // Show countdown overlay
        this._overlay.style.display = 'flex';
        this._results.style.display = 'none';
        this._newPBToast.style.display = 'none';
        this._flash.style.opacity = '0';
        this._timerText.textContent = '00:00.000';
        this._zoneLabel.textContent = `${zoneName} — IL`;
        this._countdownText.textContent = '3';
        this._countdownText.style.display = 'block';
    }

    update(dt) {
        switch (this.state) {
            case 'COUNTDOWN':
                this._updateCountdown(dt);
                break;
            case 'RACING':
                this._updateRace(dt);
                break;
            default:
                break;
        }
    }

    _updateCountdown(dt) {
        this.countdownTimer += dt;
        this.player.velocity.set(0, 0, 0);

        let text = '';
        if (this.countdownTimer < 1.0) text = '3';
        else if (this.countdownTimer < 2.0) text = '2';
        else if (this.countdownTimer < 3.0) text = '1';
        else if (this.countdownTimer < 3.6) text = 'GO!';
        else {
            this.state = 'RACING';
            this.timer = 0;
            this._countdownText.style.display = 'none';
            return;
        }
        this._countdownText.textContent = text;
    }

    _updateRace(dt) {
        this.timer += dt;
        const ms = Math.round(this.timer * 1000);
        this._timerText.textContent = this._formatTime(ms);

        // Check end trigger
        const zone = ZONES[this.currentZone];
        const half = TRIGGER_SIZE.clone().multiplyScalar(0.5);
        const box = new THREE.Box3().setFromCenterAndSize(zone.end, TRIGGER_SIZE);

        if (box.containsPoint(this.player.position)) {
            this._finish();
        }
    }

    _finish() {
        this.state = 'FINISHED';
        const totalMs = Math.round(this.timer * 1000);
        const prevPB = this._getStoredPB(this.currentZone);
        const isNewPB = prevPB === null || totalMs < prevPB;

        if (isNewPB) {
            localStorage.setItem(`parkour_il_pb_${this.currentZone}`, totalMs.toString());
            localStorage.setItem(`parkour_il_splits_${this.currentZone}`, JSON.stringify(this.splitTimes));
            this._showNewPB();
        }

        // Update leaderboard
        this._addLeaderboardEntry(this.currentZone, totalMs);

        // Build results HTML
        const grade = this._computeGrade(this.currentZone, this.timer);
        const timeStr = this._formatTime(totalMs);
        const pbStr = prevPB !== null ? this._formatTime(prevPB) : '--:--.---';
        const diff = prevPB !== null ? totalMs - prevPB : null;
        const diffStr = diff !== null ? (diff <= 0 ? '-' : '+') + this._formatTime(Math.abs(diff)) : '';

        this._resultsGrade.textContent = grade;
        this._resultsGrade.style.color = this._gradeColor(grade);
        this._resultsTime.textContent = `Time: ${timeStr}`;
        this._resultsPB.textContent = `PB: ${pbStr}${diff !== null ? ` (${diffStr})` : ''}`;
        this._resultsLeaderboard.innerHTML = this.renderLeaderboard(this.currentZone);

        this._results.style.display = 'block';
    }

    /* ------------------------------------------------------------------ */
    /*  Persistence                                                       */
    /* ------------------------------------------------------------------ */

    getPB(zoneName) {
        const raw = localStorage.getItem(`parkour_il_pb_${zoneName}`);
        return raw !== null ? parseInt(raw, 10) : null;
    }

    getSplits(zoneName) {
        try {
            const raw = localStorage.getItem(`parkour_il_splits_${zoneName}`);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    _getStoredPB(zoneName) {
        return this.getPB(zoneName);
    }

    _addLeaderboardEntry(zoneName, ms) {
        const key = `parkour_il_leaderboard_${zoneName}`;
        let board = [];
        try {
            const raw = localStorage.getItem(key);
            if (raw) board = JSON.parse(raw);
        } catch (e) { /* ignore */ }

        board.push({
            time: ms,
            date: new Date().toLocaleString(),
        });
        board.sort((a, b) => a.time - b.time);
        board = board.slice(0, 10);
        localStorage.setItem(key, JSON.stringify(board));
    }

    _getLeaderboard(zoneName) {
        try {
            const raw = localStorage.getItem(`parkour_il_leaderboard_${zoneName}`);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Leaderboard & Grades                                              */
    /* ------------------------------------------------------------------ */

    renderLeaderboard(zoneName) {
        const board = this._getLeaderboard(zoneName);
        if (board.length === 0) {
            return '<div style="color:#888;font-style:italic;">No runs yet</div>';
        }
        const pb = this.getPB(zoneName);
        return board.map((entry, i) => {
            const isPB = entry.time === pb;
            const timeStr = this._formatTime(entry.time);
            const highlight = isPB ? 'color:#ffd700;font-weight:bold;' : '';
            return `<div style="${highlight}margin:2px 0;">${i + 1}. ${timeStr} — ${entry.date}</div>`;
        }).join('');
    }

    _computeGrade(zoneName, seconds) {
        const t = TARGETS[zoneName];
        if (!t) return 'D';
        if (seconds <= t.S) return 'S';
        if (seconds <= t.A) return 'A';
        if (seconds <= t.B) return 'B';
        if (seconds <= t.C) return 'C';
        return 'D';
    }

    _gradeColor(grade) {
        switch (grade) {
            case 'S': return '#ffd700';
            case 'A': return '#00ff88';
            case 'B': return '#66ccff';
            case 'C': return '#ffaa44';
            default:  return '#ff4444';
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Triggers (visualised only in debug)                               */
    /* ------------------------------------------------------------------ */

    _buildTriggers() {
        const geo = new THREE.BoxGeometry(3, 3, 3);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.0,
            depthWrite: false,
        });

        for (const [name, zone] of Object.entries(ZONES)) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(zone.end);
            mesh.visible = false;
            this.scene.add(mesh);
            this._triggers.set(name, mesh);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  UI                                                                */
    /* ------------------------------------------------------------------ */

    _buildUI() {
        // Main overlay container
        const overlay = document.createElement('div');
        overlay.style.cssText =
            'position:fixed;inset:0;pointer-events:none;z-index:200;' +
            'display:none;flex-direction:column;justify-content:space-between;' +
            'padding:20px;font-family:monospace;';
        document.body.appendChild(overlay);
        this._overlay = overlay;

        // Top bar: zone name + timer
        const topBar = document.createElement('div');
        topBar.style.cssText =
            'display:flex;justify-content:space-between;align-items:flex-start;';
        overlay.appendChild(topBar);

        const zoneLabel = document.createElement('div');
        zoneLabel.style.cssText = 'color:#fff;font-size:14px;opacity:0.8;';
        topBar.appendChild(zoneLabel);
        this._zoneLabel = zoneLabel;

        const timerText = document.createElement('div');
        timerText.style.cssText =
            'color:#fff;font-size:28px;font-weight:bold;text-shadow:0 0 10px rgba(0,0,0,0.8);';
        timerText.textContent = '00:00.000';
        topBar.appendChild(timerText);
        this._timerText = timerText;

        // Centre countdown
        const countdownText = document.createElement('div');
        countdownText.style.cssText =
            'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
            'font-size:72px;font-weight:bold;color:#fff;text-shadow:0 0 20px rgba(0,0,0,0.8);' +
            'display:none;';
        overlay.appendChild(countdownText);
        this._countdownText = countdownText;

        // Results panel
        const results = document.createElement('div');
        results.style.cssText =
            'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
            'background:rgba(0,0,0,0.85);border:1px solid #444;padding:24px 32px;' +
            'border-radius:8px;text-align:center;pointer-events:auto;display:none;' +
            'min-width:260px;';
        overlay.appendChild(results);
        this._results = results;

        const resultsGrade = document.createElement('div');
        resultsGrade.style.cssText = 'font-size:56px;font-weight:bold;margin-bottom:8px;';
        results.appendChild(resultsGrade);
        this._resultsGrade = resultsGrade;

        const resultsTime = document.createElement('div');
        resultsTime.style.cssText = 'color:#fff;font-size:18px;margin-bottom:4px;';
        results.appendChild(resultsTime);
        this._resultsTime = resultsTime;

        const resultsPB = document.createElement('div');
        resultsPB.style.cssText = 'color:#aaa;font-size:14px;margin-bottom:16px;';
        results.appendChild(resultsPB);
        this._resultsPB = resultsPB;

        const resultsLeaderboard = document.createElement('div');
        resultsLeaderboard.style.cssText =
            'text-align:left;color:#ccc;font-size:12px;max-height:150px;overflow-y:auto;';
        results.appendChild(resultsLeaderboard);
        this._resultsLeaderboard = resultsLeaderboard;

        // Close button for results
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText =
            'margin-top:16px;padding:6px 16px;background:#333;color:#fff;border:1px solid #555;' +
            'border-radius:4px;cursor:pointer;font-family:monospace;';
        closeBtn.addEventListener('click', () => {
            this._results.style.display = 'none';
            this._overlay.style.display = 'none';
            this.state = 'IDLE';
        });
        results.appendChild(closeBtn);

        // NEW PB toast
        const toast = document.createElement('div');
        toast.style.cssText =
            'position:absolute;top:20%;left:50%;transform:translateX(-50%);' +
            'background:rgba(255,215,0,0.9);color:#000;font-size:24px;font-weight:bold;' +
            'padding:12px 24px;border-radius:6px;box-shadow:0 0 20px rgba(255,215,0,0.5);' +
            'display:none;pointer-events:none;';
        toast.textContent = 'NEW PB!';
        overlay.appendChild(toast);
        this._newPBToast = toast;

        // Golden flash overlay
        const flash = document.createElement('div');
        flash.style.cssText =
            'position:fixed;inset:0;background:#ffd700;opacity:0;pointer-events:none;z-index:300;' +
            'transition:opacity 0.3s ease-out;';
        document.body.appendChild(flash);
        this._flash = flash;
    }

    _showNewPB() {
        this._newPBToast.style.display = 'block';
        this._flash.style.opacity = '0.6';
        setTimeout(() => {
            this._flash.style.opacity = '0';
        }, 100);
        setTimeout(() => {
            this._newPBToast.style.display = 'none';
        }, 2500);
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                           */
    /* ------------------------------------------------------------------ */

    _formatTime(ms) {
        if (this.timeTrial && typeof this.timeTrial.formatTime === 'function') {
            return this.timeTrial.formatTime(ms);
        }
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const millis = ms % 1000;
        const mStr = minutes.toString().padStart(2, '0');
        const sStr = seconds.toString().padStart(2, '0');
        const msStr = millis.toString().padStart(3, '0');
        return `${mStr}:${sStr}.${msStr}`;
    }
}
