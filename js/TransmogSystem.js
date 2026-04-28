/**
 * TransmogSystem — separate cosmetic appearance from gear stats.
 */

export class TransmogSystem {
    constructor(exoSuit) {
        this.exoSuit = exoSuit;
        this._overrides = {}; // slot -> cosmetic item name
        this._unlockedSkins = new Set();
        this._load();
    }

    setTransmog(slot, skinName) {
        this._overrides[slot] = skinName;
        this._save();
    }

    clearTransmog(slot) {
        delete this._overrides[slot];
        this._save();
    }

    getVisualName(slot) {
        return this._overrides[slot] || null;
    }

    unlockSkin(skinName) {
        this._unlockedSkins.add(skinName);
        this._save();
    }

    hasSkin(skinName) {
        return this._unlockedSkins.has(skinName);
    }

    getUnlockedSkins() {
        return Array.from(this._unlockedSkins);
    }

    serialize() {
        return {
            overrides: this._overrides,
            unlocked: Array.from(this._unlockedSkins),
        };
    }

    deserialize(data) {
        if (!data) return;
        this._overrides = data.overrides || {};
        this._unlockedSkins = new Set(data.unlocked || []);
    }

    _save() {
        try {
            localStorage.setItem('apex_transmog', JSON.stringify(this.serialize()));
        } catch (e) {}
    }

    _load() {
        try {
            const raw = localStorage.getItem('apex_transmog');
            if (raw) this.deserialize(JSON.parse(raw));
        } catch (e) {}
    }
}
