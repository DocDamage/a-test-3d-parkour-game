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
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch (e) {
            console.warn('SaveSystem: save failed', e);
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(this.key);
            if (!raw) return;
            const data = JSON.parse(raw);
            for (const [key, { setStateFn }] of this.registrations) {
                if (data[key] !== undefined) {
                    setStateFn(data[key]);
                }
            }
        } catch (e) {
            console.warn('SaveSystem: load failed', e);
        }
    }

    clear() {
        localStorage.removeItem(this.key);
    }

    hasSave() {
        return !!localStorage.getItem(this.key);
    }
}
