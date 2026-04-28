/**
 * RunHistory — saves last 10 runs with stats for comparison.
 */

export class RunHistory {
    constructor() {
        this.maxEntries = 10;
        this._entries = [];
        this._load();
    }

    recordRun(data) {
        const entry = {
            timestamp: Date.now(),
            duration: data.duration || 0,
            kills: data.kills || 0,
            deaths: data.deaths || 0,
            build: data.build || null,
            xpGained: data.xpGained || 0,
            shardsGained: data.shardsGained || 0,
            highestCombo: data.highestCombo || 0,
            zone: data.zone || 'Warehouse',
        };
        this._entries.unshift(entry);
        if (this._entries.length > this.maxEntries) {
            this._entries = this._entries.slice(0, this.maxEntries);
        }
        this._save();
    }

    getEntries() {
        return this._entries;
    }

    getBestRun(metric = 'kills') {
        if (this._entries.length === 0) return null;
        return this._entries.reduce((best, entry) => {
            return (entry[metric] || 0) > (best[metric] || 0) ? entry : best;
        });
    }

    clear() {
        this._entries = [];
        this._save();
    }

    serialize() {
        return this._entries;
    }

    deserialize(data) {
        if (Array.isArray(data)) this._entries = data.slice(0, this.maxEntries);
    }

    _save() {
        try {
            localStorage.setItem('apex_run_history', JSON.stringify(this.serialize()));
        } catch (e) {}
    }

    _load() {
        try {
            const raw = localStorage.getItem('apex_run_history');
            if (raw) this.deserialize(JSON.parse(raw));
        } catch (e) {}
    }
}
