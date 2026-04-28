/**
 * ModdingAPI — exposes hooks for userscripts and community mods.
 */

export class ModdingAPI {
    constructor(ctx) {
        this.ctx = ctx;
        this._hooks = {
            preUpdate: [],
            postUpdate: [],
            onPlayerDamage: [],
            onEnemyKilled: [],
            onLevelUp: [],
        };
        this._expose();
    }

    _expose() {
        window.ApexAPI = {
            getSystem: (name) => this.ctx.resolve(name),
            getPlayer: () => this.ctx.resolve('player'),
            getWorld: () => this.ctx.resolve('world'),
            getScene: () => this.ctx.resolve('scene'),
            getCamera: () => this.ctx.resolve('camera'),
            hook: (event, fn) => this._addHook(event, fn),
            unhook: (event, fn) => this._removeHook(event, fn),
            spawnEntity: (type, position, options) => this._spawnEntity(type, position, options),
            setPlayerStat: (stat, value) => this._setPlayerStat(stat, value),
            addTempBonus: (key, stat, value, duration) => this._addTempBonus(key, stat, value, duration),
            log: (msg) => console.log('[Mod]', msg),
        };
    }

    _addHook(event, fn) {
        if (this._hooks[event]) {
            this._hooks[event].push(fn);
        }
    }

    _removeHook(event, fn) {
        if (this._hooks[event]) {
            const idx = this._hooks[event].indexOf(fn);
            if (idx >= 0) this._hooks[event].splice(idx, 1);
        }
    }

    dispatch(event, ...args) {
        if (!this._hooks[event]) return;
        for (const fn of this._hooks[event]) {
            try { fn(...args); } catch (e) { console.warn('[ModdingAPI] hook error:', e); }
        }
    }

    _spawnEntity(type, position, options) {
        const scene = this.ctx.resolve('scene');
        if (!scene) return null;
        // Basic spawn stub — mods can extend this
        console.log('[ModdingAPI] spawnEntity:', type, position, options);
        return null;
    }

    _setPlayerStat(stat, value) {
        const player = this.ctx.resolve('player');
        if (!player) return;
        if (player[stat] !== undefined) player[stat] = value;
    }

    _addTempBonus(key, stat, value, duration) {
        const cs = this.ctx.resolve('characterSheet');
        if (cs && cs.addTempBonus) {
            cs.addTempBonus(key, stat, value, duration);
        }
    }
}
