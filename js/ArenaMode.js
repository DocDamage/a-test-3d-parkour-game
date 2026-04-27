/**
 * ArenaMode — combat arena selector and runner.
 *
 * Modes:
 *   wave_defense, boss_rush, drone_gauntlet, juggernaut, mirror_match,
 *   collateral, stealth_only, speed_kill, barehands, ironman
 *
 * Modifiers (1–3 per run):
 *   low_gravity, high_gravity, fog_of_war, weapon_jam, friendly_fire,
 *   vampire, timer_drain, glass_cannon, no_dash, emp_zone
 */

export const ARENA_MODES = {
    wave_defense:   { name: 'Wave Defense',   desc: 'Hold rooftop against 10 escalating waves', reward: 'skill_point_rare_mod' },
    boss_rush:      { name: 'Boss Rush',      desc: 'All bosses back-to-back, no healing', reward: '5_skill_points_legendary' },
    drone_gauntlet: { name: 'Drone Gauntlet', desc: 'Infinite corridor, survive as long as possible', reward: 'chips_time' },
    juggernaut:     { name: 'Juggernaut',     desc: '1 HP, every kill heals 25 HP', reward: 'skill_point' },
    mirror_match:   { name: 'Mirror Match',   desc: 'Boss clones your exact movement', reward: 'cosmetic_unique' },
    collateral:     { name: 'Collateral',     desc: 'Every enemy death explodes, chain = score', reward: 'chips_chain' },
    stealth_only:   { name: 'Stealth Only',   desc: 'No weapons, only silent takedowns', reward: 'skill_point_suppressor' },
    speed_kill:     { name: 'Speed Kill',     desc: 'Kill 50 drones in 2 minutes', reward: 'skill_point_extended_mag' },
    barehands:      { name: 'Barehands',      desc: 'No weapons, only parkour attacks', reward: 'skill_point_damage_boost' },
    ironman:        { name: 'Ironman',        desc: 'No respawns, 1 life, beat 3 bosses', reward: 'title_untouchable' },
};

export const ARENA_MODIFIERS = {
    low_gravity:    { name: 'Low Gravity',    desc: 'Jump +100%, fall damage -50%' },
    high_gravity:   { name: 'High Gravity',   desc: 'Jump -50%, ground pound +100%' },
    fog_of_war:     { name: 'Fog of War',     desc: 'Vision 10m, Predator Vision essential' },
    weapon_jam:     { name: 'Weapon Jam',     desc: 'Every 10 shots jams for 2s' },
    friendly_fire:  { name: 'Friendly Fire',  desc: 'Your explosions damage you' },
    vampire:        { name: 'Vampire',        desc: 'Enemies heal 50% of damage dealt to you' },
    timer_drain:    { name: 'Timer Drain',    desc: '-1 HP every 2s, kills add +5s' },
    glass_cannon:   { name: 'Glass Cannon',   desc: '3× damage dealt, 3× damage taken' },
    no_dash:        { name: 'No Dash',        desc: 'Air dash disabled' },
    emp_zone:       { name: 'EMP Zone',       desc: 'All electronics disabled every 15s for 5s' },
};

export class ArenaMode {
    constructor(scene, world, player, enemyManager, bossFight, lootSystem) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.enemyManager = enemyManager;
        this.bossFight = bossFight;
        this.lootSystem = lootSystem;

        this.active = false;
        this.currentMode = null;
        this.modifiers = [];
        this.wave = 0;
        this.score = 0;
        this.timer = 0;
        this.ironmanLives = 1;
        this._buildUI();
    }

    /* ------------------------------------------------------------------ */
    /*  Mode selection                                                    */
    /* ------------------------------------------------------------------ */

    selectMode(modeId) {
        const mode = ARENA_MODES[modeId];
        if (!mode) return false;
        this.currentMode = modeId;
        // Roll 1–3 random modifiers
        const allMods = Object.keys(ARENA_MODIFIERS);
        const count = 1 + Math.floor(Math.random() * 3);
        this.modifiers = [];
        const pool = [...allMods];
        for (let i = 0; i < count && pool.length > 0; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            this.modifiers.push(pool[idx]);
            pool.splice(idx, 1);
        }
        this._updateSelectorUI();
        return true;
    }

    start() {
        if (!this.currentMode || this.active) return false;
        this.active = true;
        this.wave = 0;
        this.score = 0;
        this.timer = 0;
        this.ironmanLives = 1;

        // Apply modifiers
        this._applyModifiers();

        // Mode-specific setup
        switch (this.currentMode) {
            case 'wave_defense':
                this._spawnWave(1);
                break;
            case 'boss_rush':
                if (this.bossFight) this.bossFight.start();
                break;
            case 'drone_gauntlet':
                this._spawnWave(1);
                break;
            case 'juggernaut':
                this.player.health = 1;
                this.player.maxHealth = 1;
                this._spawnWave(1);
                break;
            case 'speed_kill':
                this._timeLimit = 120;
                this._spawnWave(1);
                break;
            case 'barehands':
                // Disarm player
                if (this.player.staminaSystem) this.player.staminaSystem.costs.lightAttack = 0;
                this._spawnWave(1);
                break;
            case 'ironman':
                this.ironmanLives = 1;
                if (this.bossFight) this.bossFight.start();
                break;
            default:
                this._spawnWave(1);
        }

        this._showHUD();
        return true;
    }

    end(success) {
        if (!this.active) return;
        this.active = false;
        this._removeModifiers();
        this._showResult(success);
    }

    /* ------------------------------------------------------------------ */
    /*  Per-frame update                                                  */
    /* ------------------------------------------------------------------ */

    update(dt) {
        if (!this.active) return;
        this.timer += dt;

        // Modifier: timer drain
        if (this.modifiers.includes('timer_drain')) {
            this._drainTimer += dt;
            if (this._drainTimer >= 2) {
                this._drainTimer -= 2;
                if (this.player && this.player.takeDamage) {
                    this.player.takeDamage(1, 'kinetic', null);
                }
            }
        }

        // Modifier: EMP zone
        if (this.modifiers.includes('emp_zone')) {
            this._empTimer = (this._empTimer || 0) + dt;
            const cycle = 20; // 15s on, 5s off
            const inEMP = (this._empTimer % cycle) >= 15;
            if (inEMP && this.player) this.player._empDisabled = true;
            else if (this.player) this.player._empDisabled = false;
        }

        // Mode-specific logic
        switch (this.currentMode) {
            case 'wave_defense':
                this._updateWaveDefense(dt);
                break;
            case 'speed_kill':
                if (this.timer >= this._timeLimit) this.end(false);
                break;
            case 'drone_gauntlet':
                // Spawn escalating waves every 20s
                if (Math.floor(this.timer / 20) > this.wave) {
                    this.wave++;
                    this._spawnWave(this.wave);
                }
                break;
            case 'collateral':
                // Score from chain explosions tracked via onEnemyKilled
                break;
        }
    }

    onEnemyKilled(enemy, source) {
        if (!this.active) return;
        this.score += 10;

        // Juggernaut: heal on kill
        if (this.currentMode === 'juggernaut' && this.player) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
        }

        // Speed Kill: count kills
        if (this.currentMode === 'speed_kill') {
            this._killCount = (this._killCount || 0) + 1;
            if (this._killCount >= 50) this.end(true);
        }

        // Timer drain: kills add +5s buffer
        if (this.modifiers.includes('timer_drain')) {
            this._drainTimer = Math.max(0, (this._drainTimer || 0) - 5);
        }

        this._updateHUD();
    }

    onPlayerDeath() {
        if (!this.active) return;
        if (this.currentMode === 'ironman') {
            this.ironmanLives--;
            if (this.ironmanLives <= 0) this.end(false);
        } else {
            this.end(false);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Internal                                                          */
    /* ------------------------------------------------------------------ */

    _spawnWave(waveNum) {
        if (!this.enemyManager) return;
        const count = Math.min(3 + waveNum, 12);
        const center = this.player ? this.player.position.clone() : new THREE.Vector3(0, 0, 0);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 8 + Math.random() * 8;
            const pos = new THREE.Vector3(
                center.x + Math.cos(angle) * dist,
                3,
                center.z + Math.sin(angle) * dist
            );
            const types = ['brawler', 'shield', 'suicide'];
            if (waveNum > 3) types.push('turret', 'jammer');
            if (waveNum > 6) types.push('phantom', 'command', 'medic');
            const type = types[Math.floor(Math.random() * types.length)];
            this.enemyManager.spawnEnemy(type, { position: pos, isElite: Math.random() < 0.1 });
        }
    }

    _updateWaveDefense(dt) {
        const alive = this.enemyManager ? this.enemyManager.enemies.filter(e => !e.isDead).length : 0;
        if (alive === 0 && this.wave < 10) {
            this.wave++;
            this._spawnWave(this.wave);
        }
        if (this.wave >= 10 && alive === 0) {
            this.end(true);
        }
    }

    _applyModifiers() {
        if (!this.player) return;
        for (const mod of this.modifiers) {
            switch (mod) {
                case 'low_gravity':
                    this.player.JUMP_FORCE *= 2;
                    break;
                case 'high_gravity':
                    this.player.JUMP_FORCE *= 0.5;
                    break;
                case 'glass_cannon':
                    this.player._damageMultiplier *= 3;
                    break;
                case 'no_dash':
                    this.player.canDash = false;
                    break;
            }
        }
    }

    _removeModifiers() {
        if (!this.player) return;
        for (const mod of this.modifiers) {
            switch (mod) {
                case 'low_gravity':
                    this.player.JUMP_FORCE /= 2;
                    break;
                case 'high_gravity':
                    this.player.JUMP_FORCE /= 0.5;
                    break;
                case 'glass_cannon':
                    this.player._damageMultiplier /= 3;
                    break;
                case 'no_dash':
                    this.player.canDash = true;
                    break;
            }
        }
        this.player._empDisabled = false;
    }

    /* ------------------------------------------------------------------ */
    /*  UI                                                                */
    /* ------------------------------------------------------------------ */

    _buildUI() {
        // Selector panel
        const selector = document.createElement('div');
        selector.id = 'arena-selector';
        selector.style.cssText =
            'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:2000;' +
            'display:none;flex-direction:column;align-items:center;justify-content:center;' +
            'font-family:monospace;color:#fff;';

        const title = document.createElement('h2');
        title.textContent = 'ARENA MODE';
        selector.appendChild(title);

        const grid = document.createElement('div');
        grid.id = 'arena-mode-grid';
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:12px;max-width:600px;';
        selector.appendChild(grid);

        const modsDiv = document.createElement('div');
        modsDiv.id = 'arena-modifiers';
        modsDiv.style.cssText = 'margin-top:16px;font-size:12px;color:#aaa;';
        selector.appendChild(modsDiv);

        document.body.appendChild(selector);
        this._selectorEl = selector;
        this._gridEl = grid;
        this._modsEl = modsDiv;

        // HUD
        const hud = document.createElement('div');
        hud.id = 'arena-hud';
        hud.style.cssText =
            'position:fixed;top:60px;left:50%;transform:translateX(-50%);' +
            'background:rgba(0,0,0,0.6);padding:8px 16px;border-radius:4px;' +
            'font-family:monospace;font-size:14px;color:#fff;z-index:100;display:none;';
        document.body.appendChild(hud);
        this._hudEl = hud;

        this._updateSelectorUI();
    }

    _updateSelectorUI() {
        if (!this._gridEl) return;
        this._gridEl.innerHTML = '';
        for (const [id, mode] of Object.entries(ARENA_MODES)) {
            const btn = document.createElement('button');
            btn.style.cssText =
                'padding:12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);' +
                'color:#fff;font-family:monospace;cursor:pointer;text-align:left;';
            btn.innerHTML = `<strong>${mode.name}</strong><br><span style="font-size:11px;color:#aaa">${mode.desc}</span>`;
            btn.onclick = () => {
                this.selectMode(id);
                this.start();
                this._selectorEl.style.display = 'none';
            };
            this._gridEl.appendChild(btn);
        }
    }

    _showHUD() {
        if (this._hudEl) this._hudEl.style.display = 'block';
        this._updateHUD();
    }

    _updateHUD() {
        if (!this._hudEl) return;
        const modeName = ARENA_MODES[this.currentMode]?.name || 'Arena';
        const modNames = this.modifiers.map(m => ARENA_MODIFIERS[m]?.name || m).join(', ');
        this._hudEl.innerHTML =
            `<span style="color:#ffcc00">${modeName}</span> — ` +
            `Wave ${this.wave} — Score ${this.score}` +
            (modNames ? `<br><span style="font-size:11px;color:#aaa">${modNames}</span>` : '');
    }

    _showResult(success) {
        if (this._hudEl) this._hudEl.style.display = 'none';
        const el = document.createElement('div');
        el.style.cssText =
            'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:2001;' +
            'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
            'font-family:monospace;color:#fff;';
        el.innerHTML =
            `<h1 style="color:${success ? '#44ff88' : '#ff4444'}">${success ? 'CLEARED' : 'FAILED'}</h1>` +
            `<p>Score: ${this.score} | Waves: ${this.wave} | Time: ${Math.floor(this.timer)}s</p>` +
            `<button onclick="this.parentElement.remove()" style="padding:8px 24px;margin-top:16px;cursor:pointer;">Close</button>`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 5000);
    }

    toggleSelector() {
        if (!this._selectorEl) return;
        const d = this._selectorEl.style.display;
        this._selectorEl.style.display = (d === 'flex') ? 'none' : 'flex';
    }
}
