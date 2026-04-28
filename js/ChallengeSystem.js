import * as THREE from 'three';

export class ChallengeSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.achievements = this._loadAchievements();
        this.styleScore = 0;
        this.styleMultiplier = 1;
        this.styleTimer = 0;
        this.bestStyleChain = 0;
        this.currentChain = 0;
        this.totalTricks = 0;
        this.dailySeed = this._getDailySeed();

        // Trick Dictionary
        this.discoveredTricks = this._loadDiscoveredTricks();
        this.moveHistory = [];

        // Movement Grade
        this.runStats = this._createRunStats();

        this._buildUI();
        this._buildDailyLeaderboardUI();
        this._buildGradeScreen();

        // Intercept ComboSystem moves without modifying other files
        if (this.player.comboSystem && this.player.comboSystem.registerMove) {
            const original = this.player.comboSystem.registerMove.bind(this.player.comboSystem);
            this.player.comboSystem.registerMove = (moveType) => {
                original(moveType);
                this._recordMove(moveType);
            };
        }
    }

    _loadAchievements() {
        const saved = localStorage.getItem("parkour_achievements");
        const defaults = {
            firstJump: false,
            firstVault: false,
            firstWallrun: false,
            firstDroneTakedown: false,
            speedDemon: false,      // reach 40 km/h
            flowMaster: false,      // reach flow level 4
            chipHoarder: false,     // collect all 20 chips
            survivor: false,        // survive rising tide for 60s
            destroyer: false,       // collapse 5 structural objects
            photographer: false,    // take a photo
        };
        if (!saved) return { ...defaults };
        try {
            return { ...defaults, ...JSON.parse(saved) };
        } catch (e) {
            if (window.__DEV__) console.warn('ChallengeSystem: failed to parse achievements', e);
            return { ...defaults };
        }
    }

    _saveAchievements() {
        localStorage.setItem("parkour_achievements", JSON.stringify(this.achievements));
    }

    _getDailySeed() {
        const d = new Date();
        return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }

    _buildUI() {
        this.ui = document.createElement("div");
        this.ui.style.cssText = "position:fixed;top:20px;right:20px;color:white;font-family:monospace;z-index:20;text-align:right;pointer-events:none;";
        this.ui.innerHTML = [
            `<div style="font-size:18px;font-weight:bold;color:#ffaa00;" id="style-score">0</div>`,
            `<div style="font-size:11px;color:#aaa;" id="style-label">STYLE POINTS</div>`,
            `<div style="font-size:14px;color:#0ff;margin-top:4px;" id="style-multi">x1</div>`,
        ].join("");
        document.body.appendChild(this.ui);

        this.toast = document.createElement("div");
        this.toast.style.cssText = "position:fixed;bottom:100px;left:50%;transform:translateX(-50%);color:#ffd700;font-size:20px;font-weight:bold;text-shadow:0 2px 8px rgba(0,0,0,0.9);z-index:30;opacity:0;transition:opacity 0.3s;pointer-events:none;";
        document.body.appendChild(this.toast);
    }

    update(dt) {
        // Track player state for trick detection
        this._detectTricks();

        // Style decay
        if (this.styleTimer > 0) {
            this.styleTimer -= dt;
            this.currentChain = Math.max(0, this.currentChain - dt * 0.5);
        } else {
            this.styleMultiplier = 1;
            this.currentChain = 0;
        }

        // Check achievements
        this._checkAchievements();

        // Update UI
        const scoreEl = document.getElementById("style-score");
        const multiEl = document.getElementById("style-multi");
        if (scoreEl) scoreEl.textContent = Math.floor(this.styleScore);
        if (multiEl) multiEl.textContent = "x" + this.styleMultiplier.toFixed(1);
    }

    _detectTricks() {
        const state = this.player.state;
        const speed = Math.sqrt(this.player.velocity.x ** 2 + this.player.velocity.z ** 2);

        // Trigger on state changes
        if (state === "WALLRUN" && this._lastState !== "WALLRUN") {
            this._addStyle("WALLRUN", 150);
        }
        if (state === "VAULT" && this._lastState !== "VAULT") {
            this._addStyle("VAULT", 100);
        }
        if (state === "SLIDE" && this._lastState !== "SLIDE") {
            this._addStyle("SLIDE", 75);
        }
        if (state === "GRAPPLE_SWING" && this._lastState !== "GRAPPLE_SWING") {
            this._addStyle("GRAPPLE", 200);
        }
        if (speed > 11 && this.player.grounded && (!this._wasFast || this._wasFast < 11)) {
            this._addStyle("SPEED", 50);
        }

        this._lastState = state;
        this._wasFast = speed;
    }

    _addStyle(name, basePoints) {
        this.styleTimer = 3;
        this.currentChain += 1;
        this.styleMultiplier = 1 + Math.min(this.currentChain * 0.2, 3);
        const points = Math.floor(basePoints * this.styleMultiplier);
        this.styleScore += points;
        this.totalTricks++;
        this._showToast(name + " +" + points);

        if (this.currentChain > this.bestStyleChain) {
            this.bestStyleChain = this.currentChain;
        }

        this._recordMove(name);
    }

    _showToast(text) {
        this.toast.textContent = text;
        this.toast.style.opacity = "1";
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            this.toast.style.opacity = "0";
        }, 1500);
    }

    _checkAchievements() {
        const speed = Math.floor(Math.sqrt(this.player.velocity.x ** 2 + this.player.velocity.z ** 2) * 3.6);

        if (!this.achievements.firstJump && this.totalTricks > 0) {
            this.achievements.firstJump = true; this._showToast("ACHIEVEMENT: First Blood!");
        }
        if (!this.achievements.speedDemon && speed >= 40) {
            this.achievements.speedDemon = true; this._showToast("ACHIEVEMENT: Speed Demon!");
        }
        if (!this.achievements.flowMaster && this.player.comboSystem.getFlowLevel() >= 4) {
            this.achievements.flowMaster = true; this._showToast("ACHIEVEMENT: Flow Master!");
        }

        this._saveAchievements();
    }

    reportEvent(event) {
        if (event === "vault" && !this.achievements.firstVault) {
            this.achievements.firstVault = true; this._showToast("ACHIEVEMENT: First Vault!");
        }
        if (event === "wallrun" && !this.achievements.firstWallrun) {
            this.achievements.firstWallrun = true; this._showToast("ACHIEVEMENT: First Wallrun!");
        }
        if (event === "droneTakedown" && !this.achievements.firstDroneTakedown) {
            this.achievements.firstDroneTakedown = true; this._showToast("ACHIEVEMENT: Sky Hunter!");
        }
        if (event === "photo" && !this.achievements.photographer) {
            this.achievements.photographer = true; this._showToast("ACHIEVEMENT: Photographer!");
        }
        if (event === "collapse" && !this.achievements.destroyer) {
            let count = parseInt(localStorage.getItem("collapse_count") || "0") + 1;
            localStorage.setItem("collapse_count", count.toString());
            if (count >= 5) { this.achievements.destroyer = true; this._showToast("ACHIEVEMENT: Destroyer!"); }
        }
        this._saveAchievements();

        // Record for trick dictionary
        this._recordMove(event);
    }

    /* =========================================================
       TRICK DICTIONARY
       ========================================================= */

    _loadDiscoveredTricks() {
        const saved = localStorage.getItem("parkour_trick_dictionary");
        if (!saved) return {};
        try {
            return JSON.parse(saved);
        } catch (e) {
            if (window.__DEV__) console.warn('ChallengeSystem: failed to parse discovered tricks', e);
            return {};
        }
    }

    _saveDiscoveredTricks() {
        localStorage.setItem("parkour_trick_dictionary", JSON.stringify(this.discoveredTricks));
    }

    _normalizeMoveName(name) {
        const map = {
            'WALLRUN': 'Wallrun',
            'VAULT': 'Vault',
            'SLIDE': 'Slide',
            'GRAPPLE': 'Grapple',
            'SPEED': 'Sprint',
            'vault': 'Vault',
            'wallrun': 'Wallrun',
            'droneTakedown': 'Drone Takedown',
            'wallkick': 'Wallkick',
            'wallKick': 'Wallkick',
            'airDash': 'Air Dash',
            'airDash': 'Air Dash',
            'slideHazard': 'Slide under hazard',
            'crouchJump': 'Crouch Jump',
            'edgeBoost': 'Edge Boost',
            'jump': 'Jump',
            'climb': 'Climb',
            'grappleSwing': 'Grapple',
        };
        return map[name] || name;
    }

    _recordMove(moveName) {
        const normalized = this._normalizeMoveName(moveName);
        const now = Date.now();

        // Deduplicate rapid identical moves (e.g. ComboSystem + _detectTricks)
        if (this.moveHistory.length > 0) {
            const last = this.moveHistory[this.moveHistory.length - 1];
            if (last.name === normalized && (now - last.time) < 100) {
                return;
            }
        }

        this.moveHistory.push({ name: normalized, time: now });
        if (this.moveHistory.length > 20) {
            this.moveHistory.shift();
        }

        this._checkTrickDictionary();
    }

    _checkTrickDictionary() {
        this._checkNamedTricks();
        this._checkFreestyle();
    }

    _checkNamedTricks() {
        const moves = this.moveHistory.map(m => m.name);
        const tricks = [
            { name: 'The Sequence', moves: ['Vault', 'Wallrun', 'Wallkick', 'Air Dash'], points: 500 },
            { name: 'Under and Over', moves: ['Slide under hazard', 'Grapple', 'Drone Takedown'], points: 750 },
            { name: 'Ping Pong', moves: ['Wallrun', 'Wallkick', 'Wallrun', 'Wallkick'], points: 600 },
            { name: 'Low Profile', moves: ['Crouch Jump', 'Vault', 'Slide'], points: 400 },
            { name: 'Edge Master', moves: ['Edge Boost', 'Air Dash', 'Wallkick'], points: 550 },
        ];

        for (const trick of tricks) {
            if (!this.discoveredTricks[trick.name]) {
                if (this._hasMoveSequence(moves, trick.moves)) {
                    this._discoverTrick(trick.name, trick.points);
                }
            }
        }
    }

    _hasMoveSequence(moves, sequence) {
        if (sequence.length > moves.length) return false;
        for (let i = 0; i <= moves.length - sequence.length; i++) {
            let match = true;
            for (let j = 0; j < sequence.length; j++) {
                if (moves[i + j] !== sequence[j]) {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }
        return false;
    }

    _checkFreestyle() {
        if (this.currentChain >= 5 && !this.discoveredTricks['Freestyle']) {
            this._discoverTrick('Freestyle', 1000);
        }
    }

    _discoverTrick(name, points) {
        this.discoveredTricks[name] = {
            discovered: true,
            date: new Date().toISOString(),
            points: points,
        };
        this._saveDiscoveredTricks();
        this.styleScore += points;
        this._showToast(`TRICK DISCOVERED: ${name}! +${points}`);
    }

    /* =========================================================
       DAILY SEED & LEADERBOARD
       ========================================================= */

    getDailySeed() {
        return this.dailySeed;
    }

    _loadDailyScores() {
        const saved = localStorage.getItem("parkour_daily_scores");
        let all = [];
        if (saved) {
            try { all = JSON.parse(saved); } catch (e) { all = []; }
        }
        if (!Array.isArray(all)) all = [];
        return all.filter(s => s.seed === this.dailySeed);
    }

    _saveDailyScore(score) {
        const saved = localStorage.getItem("parkour_daily_scores");
        let all = [];
        if (saved) {
            try { all = JSON.parse(saved); } catch (e) { all = []; }
        }
        if (!Array.isArray(all)) all = [];
        all.push({
            seed: this.dailySeed,
            score: score,
            date: new Date().toISOString(),
            name: 'You',
        });
        if (all.length > 50) all.shift();
        localStorage.setItem("parkour_daily_scores", JSON.stringify(all));
        this._updateDailyLeaderboard();
    }

    _buildDailyLeaderboardUI() {
        this.dailyUI = document.createElement("div");
        this.dailyUI.style.cssText = "position:fixed;top:20px;left:20px;color:white;font-family:monospace;z-index:20;pointer-events:none;background:rgba(0,0,0,0.5);padding:10px;border-radius:8px;min-width:160px;";
        this.dailyUI.innerHTML = [
            `<div style="font-size:14px;font-weight:bold;color:#0ff;">Daily Run #${this.dailySeed}</div>`,
            `<div style="font-size:11px;color:#aaa;margin-bottom:6px;">Leaderboard</div>`,
            `<div id="daily-leaderboard"></div>`,
        ].join("");
        document.body.appendChild(this.dailyUI);
        this._updateDailyLeaderboard();
    }

    _updateDailyLeaderboard() {
        const el = document.getElementById("daily-leaderboard");
        if (!el) return;
        const scores = this._loadDailyScores()
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        if (scores.length === 0) {
            el.innerHTML = `<div style="font-size:11px;color:#888;">No scores yet</div>`;
        } else {
            el.innerHTML = scores.map((s, i) =>
                `<div style="font-size:12px;color:${i === 0 ? '#ffd700' : '#fff'};">${i + 1}. ${s.name} — ${s.score}</div>`
            ).join("");
        }
    }

    /* =========================================================
       MOVEMENT GRADE
       ========================================================= */

    _createRunStats() {
        return {
            perfectInputs: 0,
            totalInputs: 0,
            stumbleCount: 0,
            sprintTime: 0,
            walkTime: 0,
            startTime: Date.now(),
        };
    }

    resetRunStats() {
        this.runStats = this._createRunStats();
        this.moveHistory = [];
        this.styleScore = 0;
        this.styleMultiplier = 1;
        this.styleTimer = 0;
        this.currentChain = 0;
        this.bestStyleChain = 0;
        this.totalTricks = 0;
    }

    recordPerfectInput(isPerfect) {
        this.runStats.totalInputs++;
        if (isPerfect) this.runStats.perfectInputs++;
    }

    recordStumble() {
        this.runStats.stumbleCount++;
    }

    updateMovementTime(dt, isSprinting) {
        if (isSprinting) {
            this.runStats.sprintTime += dt;
        } else {
            this.runStats.walkTime += dt;
        }
    }

    calculateGrade() {
        const rs = this.runStats;
        const perfectPct = rs.totalInputs > 0 ? (rs.perfectInputs / rs.totalInputs) * 100 : 0;
        const moveTime = rs.sprintTime + rs.walkTime;
        const sprintPct = moveTime > 0 ? (rs.sprintTime / moveTime) * 100 : 0;
        const hasChains = this.bestStyleChain >= 2;
        const allChained = this.bestStyleChain >= 4;

        if (perfectPct > 95 && allChained && rs.stumbleCount === 0) return 'S';
        if (perfectPct > 85 && allChained) return 'A';
        if (perfectPct > 70 && hasChains) return 'B';
        if (perfectPct > 50) return 'C';
        if (sprintPct < 50 && moveTime > 1) return 'F';
        return 'D';
    }

    endRun() {
        const grade = this.calculateGrade();
        this._saveDailyScore(this.styleScore);
        this.showGradeScreen(grade, this.runStats);
    }

    _buildGradeScreen() {
        this.gradeScreen = document.createElement("div");
        this.gradeScreen.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:none;justify-content:center;align-items:center;flex-direction:column;z-index:100;color:white;font-family:monospace;";
        this.gradeScreen.innerHTML = [
            `<div id="grade-letter" style="font-size:120px;font-weight:bold;text-shadow:0 0 30px rgba(255,255,255,0.5);animation:gradePop 0.6s ease-out;">F</div>`,
            `<div style="margin-top:20px;font-size:18px;" id="grade-label">RUN COMPLETE</div>`,
            `<div style="margin-top:30px;background:rgba(255,255,255,0.1);padding:20px;border-radius:10px;min-width:280px;">`,
            `  <div style="display:flex;justify-content:space-between;margin:6px 0;"><span>Perfect Inputs:</span><span id="grade-perfect">0%</span></div>`,
            `  <div style="display:flex;justify-content:space-between;margin:6px 0;"><span>Best Chain:</span><span id="grade-chain">0</span></div>`,
            `  <div style="display:flex;justify-content:space-between;margin:6px 0;"><span>Stumbles:</span><span id="grade-stumbles">0</span></div>`,
            `  <div style="display:flex;justify-content:space-between;margin:6px 0;"><span>Style Score:</span><span id="grade-score">0</span></div>`,
            `  <div style="display:flex;justify-content:space-between;margin:6px 0;"><span>Sprint Time:</span><span id="grade-sprint">0s</span></div>`,
            `</div>`,
            `<div style="margin-top:30px;font-size:14px;color:#aaa;animation:fadeIn 1s ease 0.5s both;">Press any key or click to continue</div>`,
        ].join("");

        const style = document.createElement("style");
        style.textContent = `
            @keyframes gradePop {
                0% { transform: scale(0); opacity: 0; }
                60% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        if (!document.getElementById("grade-animations")) {
            style.id = "grade-animations";
            document.head.appendChild(style);
        }

        document.body.appendChild(this.gradeScreen);

        this._gradeKeyHandler = () => this.hideGradeScreen();
        document.addEventListener("keydown", this._gradeKeyHandler);
        this.gradeScreen.addEventListener("click", this._gradeKeyHandler);
    }

    showGradeScreen(grade, stats) {
        const perfectPct = stats.totalInputs > 0 ? Math.floor((stats.perfectInputs / stats.totalInputs) * 100) : 0;
        const totalTime = stats.sprintTime + stats.walkTime;

        const letterEl = document.getElementById("grade-letter");
        if (letterEl) {
            letterEl.textContent = grade;
            letterEl.style.color = this._gradeColor(grade);
            // Restart animation
            letterEl.style.animation = "none";
            letterEl.offsetHeight; // force reflow
            letterEl.style.animation = "gradePop 0.6s ease-out";
        }

        const perfectEl = document.getElementById("grade-perfect");
        if (perfectEl) perfectEl.textContent = perfectPct + "% (" + stats.perfectInputs + "/" + stats.totalInputs + ")";

        const chainEl = document.getElementById("grade-chain");
        if (chainEl) chainEl.textContent = this.bestStyleChain;

        const stumbleEl = document.getElementById("grade-stumbles");
        if (stumbleEl) stumbleEl.textContent = stats.stumbleCount;

        const scoreEl = document.getElementById("grade-score");
        if (scoreEl) scoreEl.textContent = Math.floor(this.styleScore);

        const sprintEl = document.getElementById("grade-sprint");
        if (sprintEl) sprintEl.textContent = Math.floor(stats.sprintTime) + "s / " + Math.floor(totalTime) + "s";

        this.gradeScreen.style.display = "flex";
    }

    _gradeColor(grade) {
        const colors = {
            'S': '#ffd700',
            'A': '#4CAF50',
            'B': '#8BC34A',
            'C': '#FFC107',
            'D': '#FF9800',
            'F': '#f44336',
        };
        return colors[grade] || '#fff';
    }

    hideGradeScreen() {
        if (this.gradeScreen && this.gradeScreen.style.display === "flex") {
            this.gradeScreen.style.display = "none";
            document.removeEventListener("keydown", this._gradeKeyHandler);
            this.gradeScreen.removeEventListener("click", this._gradeKeyHandler);
            this.resetRunStats();
        }
    }
}
