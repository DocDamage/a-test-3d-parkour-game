export class SaveSystem {
    constructor() {
        this.registrations = new Map();
        this.key = 'apex_rift_save_v1';
        // Holds the most-recently loaded/saved data so systems that register
        // *after* load() has already run can still restore their state immediately.
        this._pendingData = null;
        this._playtime = 0;       // total seconds of accumulated playtime
        this._backupIndex = 0;    // rotates 0/1 for the two backup slots
        this.onSave = null;       // (meta) => void — called after every successful save
    }

    // ── Registration ─────────────────────────────────────────────────────────

    register(key, getStateFn, setStateFn) {
        this.registrations.set(key, { getStateFn, setStateFn });
        // If load() already ran, immediately restore state for this late-registering system.
        if (this._pendingData && this._pendingData[key] !== undefined) {
            try {
                setStateFn(this._pendingData[key]);
            } catch (e) {
                if (window.__DEV__) console.warn(`SaveSystem: late-load failed for "${key}"`, e);
            }
        }
    }

    // ── Save ─────────────────────────────────────────────────────────────────

    save() {
        try {
            const data = {};
            for (const [key, { getStateFn }] of this.registrations) {
                try {
                    data[key] = getStateFn();
                } catch (e) {
                    if (window.__DEV__) console.warn(`SaveSystem: getState failed for "${key}"`, e);
                }
            }
            data._meta = {
                version: 2,
                timestamp: Date.now(),
                playtime: this._playtime,
                runnerName: localStorage.getItem('runner_name') || 'Unknown',
            };
            // Rotate backup before overwriting.
            const existing = localStorage.getItem(this.key);
            if (existing) {
                localStorage.setItem(`${this.key}_backup_${this._backupIndex}`, existing);
                this._backupIndex = (this._backupIndex + 1) % 2;
            }
            localStorage.setItem(this.key, JSON.stringify(data));
            this._pendingData = data;
            if (typeof this.onSave === 'function') this.onSave(data._meta);
        } catch (e) {
            if (window.__DEV__) console.warn('SaveSystem: save failed', e);
        }
    }

    // ── Load ─────────────────────────────────────────────────────────────────

    load() {
        try {
            const raw = localStorage.getItem(this.key);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (!this._validate(data)) throw new Error('Invalid save data shape');
            this._pendingData = data;
            // Restore accumulated playtime from save metadata.
            if (data._meta && typeof data._meta.playtime === 'number') {
                this._playtime = data._meta.playtime;
            }
            // Apply state to all already-registered systems.
            for (const [key, { setStateFn }] of this.registrations) {
                if (data[key] !== undefined) {
                    try {
                        setStateFn(data[key]);
                    } catch (e) {
                        if (window.__DEV__) console.warn(`SaveSystem: deserialize failed for "${key}"`, e);
                    }
                }
            }
        } catch (e) {
            if (window.__DEV__) console.warn('SaveSystem: load failed — trying backup', e);
            this._tryRestoreBackup();
        }
    }

    _tryRestoreBackup() {
        // Try most-recent backup first (index 1), then index 0, then legacy key.
        const slots = [
            `${this.key}_backup_1`,
            `${this.key}_backup_0`,
            `${this.key}_backup`,
        ];
        for (const slot of slots) {
            const raw = localStorage.getItem(slot);
            if (!raw) continue;
            try { JSON.parse(raw); } catch (_) { continue; } // skip unparseable slots
            if (typeof window !== 'undefined' && window.confirm &&
                window.confirm('Save data appears corrupted. Restore from backup?')) {
                localStorage.setItem(this.key, raw);
                location.reload();
            }
            return;
        }
    }

    // ── Utility ──────────────────────────────────────────────────────────────

    /** Accumulate playtime — call with the frame delta-time (seconds) from the game loop. */
    tickPlaytime(dt) {
        this._playtime += dt;
    }

    /** Return the _meta object from the active save, or null if no save is loaded. */
    getMetadata() {
        return (this._pendingData && this._pendingData._meta) ? this._pendingData._meta : null;
    }

    hasSave() {
        return !!localStorage.getItem(this.key);
    }

    clear() {
        localStorage.removeItem(this.key);
        localStorage.removeItem(`${this.key}_backup_0`);
        localStorage.removeItem(`${this.key}_backup_1`);
        localStorage.removeItem(`${this.key}_backup`); // legacy slot
        this._pendingData = null;
        this._playtime = 0;
    }

    _validate(data) {
        return data !== null && typeof data === 'object' && !Array.isArray(data);
    }

    // ── Export / Import ───────────────────────────────────────────────────────

    exportToFile() {
        const raw = localStorage.getItem(this.key);
        if (!raw) return;
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const name = (localStorage.getItem('runner_name') || 'runner').replace(/[^A-Za-z0-9_-]/g, '_');
        const blob = new Blob([raw], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `apex-rift-${name}-${ts}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    importFromString(jsonString) {
        let data;
        try {
            data = JSON.parse(jsonString);
        } catch (e) {
            if (window.__DEV__) console.warn('SaveSystem: import parse failed', e);
            return false;
        }
        if (!this._validate(data)) {
            if (window.__DEV__) console.warn('SaveSystem: import validation failed — not a valid save object');
            return false;
        }
        this._pendingData = data;
        for (const [key, { setStateFn }] of this.registrations) {
            if (data[key] !== undefined) {
                try { setStateFn(data[key]); } catch (e) {
                    if (window.__DEV__) console.warn(`SaveSystem: import deserialize failed for "${key}"`, e);
                }
            }
        }
        this.save();
        return true;
    }
}
