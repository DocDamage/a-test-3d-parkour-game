export class SaveSystem {
    constructor() {
        this.registrations = new Map();
        this.key = 'apex_rift_save_v1';
    }

    register(key, getStateFn, setStateFn) {
        this.registrations.set(key, { getStateFn, setStateFn });
    }

    save() {
        try {
            const data = {};
            for (const [key, { getStateFn }] of this.registrations) {
                data[key] = getStateFn();
            }
            const existing = localStorage.getItem(this.key);
            if (existing) localStorage.setItem(this.key + '_backup', existing);
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch (e) {
            if (window.__DEV__) console.warn('SaveSystem: save failed', e);
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(this.key);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (!this._validate(data)) throw new Error('Invalid save data shape');
            for (const [key, { setStateFn }] of this.registrations) {
                if (data[key] !== undefined) {
                    try { setStateFn(data[key]); } catch (e) { if (window.__DEV__) console.warn(`SaveSystem: failed to deserialize ${key}`, e); }
                }
            }
        } catch (e) {
            if (window.__DEV__) console.warn('SaveSystem: load failed', e);
            const backup = localStorage.getItem(this.key + '_backup');
            if (backup) {
                if (typeof window !== 'undefined' && window.confirm && window.confirm('Save corrupted. Restore from backup?')) {
                    localStorage.setItem(this.key, backup);
                    location.reload();
                }
            }
        }
    }

    clear() {
        localStorage.removeItem(this.key);
    }

    hasSave() {
        return !!localStorage.getItem(this.key);
    }

    _validate(data) {
        return data && typeof data === 'object';
    }

    exportToFile() {
        const raw = localStorage.getItem(this.key);
        if (!raw) return;
        const blob = new Blob([raw], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'apex-rift-save.json';
        a.click();
    }

    importFromString(jsonString) {
        let data;
        try {
            data = JSON.parse(jsonString);
        } catch (e) {
            if (window.__DEV__) console.warn('SaveSystem: import parse failed', e);
            return;
        }
        for (const [key, { setStateFn }] of this.registrations) {
            if (data[key] !== undefined) setStateFn(data[key]);
        }
        this.save();
    }
}
