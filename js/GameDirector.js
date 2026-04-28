/**
 * GameDirector — gameplay orchestration extracted from main.js.
 *
 * Coordinates:
 *   - game start / pause / resume
 *   - player spawn / death / retry
 *   - enemy kill flow (XP, loot, glory)
 *   - save triggers
 *   - UI notifications
 *   - release-safe mode gating
 *
 * All gameplay updates receive finalDt (time-dilated).
 */

const __DEV__ = typeof window !== 'undefined' && window.location.hash === '#dev';

export class GameDirector {
    constructor(deps) {
        this.deps = deps;
        this.gameStarted = false;
        this.paused = false;
        this.gameOver = false;
        this.autoSaveTimer = 0;
        this._deathHandled = false;
        this._eventBus = deps.ctx || null;

        // Release-safe gating
        this._isDev = __DEV__;
    }

    /* ================================================================ */
    /*  Lifecycle                                                        */
    /* ================================================================ */

    start() {
        this.gameStarted = true;
        this.gameOver = false;
        this._deathHandled = false;
        this._emit('game.started');
        this._notify('Game started');
    }

    pause() {
        if (!this.gameStarted || this.gameOver) return;
        this.paused = true;
        this._emit('game.paused');
        this._showPauseMenu(true);
        this._exitPointerLock();
    }

    resume() {
        this.paused = false;
        this._emit('game.resumed');
        this._showPauseMenu(false);
        this._requestPointerLock();
    }

    togglePause() {
        if (this.paused) this.resume();
        else this.pause();
    }

    onPlayerDeath() {
        if (this._deathHandled) return;
        this._deathHandled = true;
        this.gameOver = true;
        this._emit('player.died');
        this._showDeathScreen(true);
        this._exitPointerLock();

        const { player, soulsSystem } = this.deps;
        if (soulsSystem && player) soulsSystem.onPlayerDeath(player.position);
    }

    onPlayerRespawn() {
        this.gameOver = false;
        this._deathHandled = false;
        const { player } = this.deps;
        if (player) {
            player.respawn();
            player.health = player.maxHealth || 100;
            player.isDead = false;
        }
        this._showDeathScreen(false);
        this._emit('player.respawned');
        this._requestPointerLock();
    }

    quitToMenu() {
        this.gameStarted = false;
        this.gameOver = false;
        this.paused = false;
        this._deathHandled = false;

        const { player, bossFight, apexRift, statusEffectSystem, saveSystem } = this.deps;
        if (bossFight && typeof bossFight.cleanup === 'function') bossFight.cleanup();
        if (apexRift && typeof apexRift.endRun === 'function') apexRift.endRun();
        if (player) {
            player.isDead = false;
            player.health = player.maxHealth || 100;
            player.state = 'idle';
        }
        if (statusEffectSystem && typeof statusEffectSystem.clearAll === 'function') statusEffectSystem.clearAll();

        this._hideAllOverlays();
        this._showPauseMenu(false);
        this._showStartScreen(true);
        this._emit('game.quitToMenu');
    }

    /* ================================================================ */
    /*  Per-frame update                                                 */
    /* ================================================================ */

    update(dt, finalDt) {
        if (!this.gameStarted) return;

        // Handle death transition
        const { player } = this.deps;
        if (player && player.isDead && !this._deathHandled) {
            this.onPlayerDeath();
        }

        // Auto-save every 30 seconds of gameplay
        if (!this.paused && !this.gameOver) {
            this.autoSaveTimer += dt;
            if (this.autoSaveTimer >= 30) {
                this._triggerAutoSave();
                this.autoSaveTimer = 0;
            }
        }
    }

    _triggerAutoSave() {
        const { saveSystem } = this.deps;
        if (saveSystem && typeof saveSystem.save === 'function') {
            saveSystem.save();
        }
        this._emit('save.completed');
    }

    /* ================================================================ */
    /*  Enemy kill flow                                                  */
    /* ================================================================ */

    handleEnemyKilled(enemy, source) {
        const { progression, familiarity, weaponSystem, factions, companion, nephalemGlory, apexRift, arenaMode, collapse, legendaryPowerSystem, soulsSystem, lootSystem, difficultyTier, inventoryStash, activeArchetypeId, showLootToast, showHint } = this.deps;

        // XP
        if (progression && typeof progression.addXP === 'function') {
            const xpBase = enemy.isElite ? 100 : 50;
            const xpScaled = difficultyTier ? difficultyTier.scaleXP(xpBase) : xpBase;
            progression.addXP(Math.floor(xpScaled), enemy.type || 'enemy_kill');
        }

        // Familiarity
        if (familiarity && weaponSystem) {
            const w = weaponSystem.getCurrentWeapon();
            const weaponId = w ? (w.id || w.name || 'melee') : 'melee';
            familiarity.addKill(weaponId);
        }

        // Factions
        if (factions && enemy && enemy.faction) {
            factions.onDroneKilled(enemy.faction, enemy.isElite);
        }

        // Companion synergy
        if (companion && typeof companion.triggerSynergy === 'function') {
            companion.triggerSynergy();
        }

        // Nephalem Glory
        if (nephalemGlory) nephalemGlory.onKill(enemy);

        // Apex Rift
        if (apexRift) apexRift.onEnemyKilled(enemy, source);

        // Arena Mode
        if (arenaMode && arenaMode.active) arenaMode.onEnemyKilled(enemy, source);

        // Collapse Mode
        if (collapse && collapse._inRun) collapse.onEnemyKilled(enemy);

        // Legendary powers
        if (legendaryPowerSystem) legendaryPowerSystem.onEnemyKilled(enemy);

        // Souls
        if (soulsSystem) {
            const shards = soulsSystem.constructor.getShardYield ? soulsSystem.constructor.getShardYield(enemy.type || 'drone', enemy.isElite) : 0;
            if (shards) soulsSystem.addShards(shards);
        }

        // Loot
        if (lootSystem) {
            const diffLootMult = difficultyTier ? difficultyTier.getTierConfig().lootBonus : 0;
            const riftLevel = apexRift ? apexRift.riftLevel || 1 : 1;
            const drop = lootSystem.generateDrop(enemy.type || 'patrol', enemy.isElite, 1.0 + diffLootMult, activeArchetypeId, { riftLevel });
            if (drop) {
                if (drop.type === 'gear' && inventoryStash) {
                    const acquired = inventoryStash.acquireItem(drop.itemData);
                    if (acquired) {
                        if (showLootToast) showLootToast(drop.itemData);
                        if (drop.rarity >= 4 && showHint) showHint('LEGENDARY! Check your stash (I key).');
                    }
                } else {
                    lootSystem.spawnDrop(drop, enemy.position || (enemy.mesh && enemy.mesh.position));
                }
                if (showHint) showHint('Loot drops! Walk over items to pick them up.');
            }
        }

        this._emit('combat.kill', { enemy, source });
    }

    /* ================================================================ */
    /*  Release-safe gating                                              */
    /* ================================================================ */

    isDevMode() {
        return this._isDev;
    }

    allowEditor() {
        return this._isDev;
    }

    allowDebugPanels() {
        return this._isDev;
    }

    /* ================================================================ */
    /*  Internal helpers                                                 */
    /* ================================================================ */

    _emit(event, data) {
        if (this._eventBus && typeof this._eventBus.emit === 'function') {
            this._eventBus.emit(event, data);
        }
    }

    _notify(msg) {
        this._emit('ui.notification', { message: msg });
    }

    _showPauseMenu(show) {
        const el = document.getElementById('pause-menu');
        if (el) el.style.display = show ? 'flex' : 'none';
    }

    _showDeathScreen(show) {
        const el = document.getElementById('death-screen');
        if (el) el.style.display = show ? 'flex' : 'none';
    }

    _showStartScreen(show) {
        const el = document.getElementById('start-screen');
        if (el) el.style.display = show ? 'flex' : 'none';
        const ui = document.getElementById('ui');
        if (ui) ui.style.display = show ? 'none' : 'block';
        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.display = show ? 'none' : 'block';
        const hcr = document.getElementById('heart-container-row');
        if (hcr) hcr.style.display = show ? 'none' : 'flex';
        const skb = document.getElementById('sector-key-bar');
        if (skb) skb.style.display = show ? 'none' : 'flex';
    }

    _hideAllOverlays() {
        const ids = ['rift-result-overlay','death-screen','boss-victory','celebration'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }

    _requestPointerLock() {
        if (document.body.requestPointerLock) document.body.requestPointerLock();
    }

    _exitPointerLock() {
        if (document.exitPointerLock) document.exitPointerLock();
    }
}
