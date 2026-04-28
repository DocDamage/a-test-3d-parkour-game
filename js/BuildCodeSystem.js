/**
 * BuildCodeSystem — encode/decode player builds into shareable short strings.
 * Uses base64url + simple checksum. Covers: archetype, origin, passives, gear, skills.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export class BuildCodeSystem {
    constructor(characterSheet, archetype, origin, passiveTree, skillSystem, exoSuit, weaponSystem, implantSystem) {
        this.characterSheet = characterSheet;
        this.archetype = archetype;
        this.origin = origin;
        this.passiveTree = passiveTree;
        this.skillSystem = skillSystem;
        this.exoSuit = exoSuit;
        this.weaponSystem = weaponSystem;
        this.implantSystem = implantSystem;
    }

    exportBuild() {
        const data = this._collectBuildData();
        const json = JSON.stringify(data);
        const encoded = this._encode(json);
        return encoded;
    }

    importBuild(code) {
        try {
            const json = this._decode(code);
            const data = JSON.parse(json);
            this._applyBuildData(data);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    _collectBuildData() {
        const data = {
            v: 1,
            archetype: this.archetype?.primary || 'traceur',
            origin: this.origin?.currentOrigin || 'street',
            attributes: this.characterSheet?._stats ? { ...this.characterSheet._stats } : {},
            passives: this.passiveTree?.serialize ? this.passiveTree.serialize() : null,
            skills: this.skillSystem?.getLoadout ? this.skillSystem.getLoadout() : null,
            gear: {},
            implants: this.implantSystem?.serialize ? this.implantSystem.serialize() : null,
        };
        if (this.exoSuit?.equipped) {
            for (const slot of Object.keys(this.exoSuit.equipped)) {
                data.gear[slot] = this.exoSuit.equipped[slot] ? { name: this.exoSuit.equipped[slot].name } : null;
            }
        }
        if (this.weaponSystem?.serialize) {
            data.weapon = this.weaponSystem.serialize();
        }
        return data;
    }

    _applyBuildData(data) {
        if (!data || data.v !== 1) throw new Error('Unsupported build code version');
        if (data.archetype && this.archetype?.setPrimary) this.archetype.setPrimary(data.archetype);
        if (data.origin && this.origin?.setOrigin) this.origin.setOrigin(data.origin);
        if (data.attributes && this.characterSheet?.setStats) this.characterSheet.setStats(data.attributes);
        if (data.passives && this.passiveTree?.deserialize) this.passiveTree.deserialize(data.passives);
        if (data.skills && this.skillSystem?.setLoadout) this.skillSystem.setLoadout(data.skills);
        if (data.gear && this.exoSuit) {
            for (const [slot, item] of Object.entries(data.gear)) {
                if (item && this.exoSuit.equip) this.exoSuit.equip(slot, item);
            }
        }
        if (data.implants && this.implantSystem?.deserialize) this.implantSystem.deserialize(data.implants);
    }

    _encode(str) {
        const bytes = new TextEncoder().encode(str);
        let out = '';
        let i = 0;
        while (i < bytes.length) {
            const b1 = bytes[i++];
            const b2 = i < bytes.length ? bytes[i++] : null;
            const b3 = i < bytes.length ? bytes[i++] : null;
            out += ALPHABET[b1 >> 2];
            out += ALPHABET[((b1 & 3) << 4) | (b2 !== null ? b2 >> 4 : 0)];
            out += b2 !== null ? ALPHABET[((b2 & 15) << 2) | (b3 !== null ? b3 >> 6 : 0)] : '';
            out += b3 !== null ? ALPHABET[b3 & 63] : '';
        }
        // Simple checksum: sum of byte values mod 64
        const checksum = bytes.reduce((a, b) => a + b, 0) % 64;
        return out + ALPHABET[checksum];
    }

    _decode(str) {
        if (!str || str.length < 2) throw new Error('Empty code');
        const checksumChar = str[str.length - 1];
        const payload = str.slice(0, -1);
        const expectedChecksum = ALPHABET.indexOf(checksumChar);
        if (expectedChecksum < 0) throw new Error('Invalid checksum character');

        const bytes = [];
        let i = 0;
        while (i < payload.length) {
            const c1 = ALPHABET.indexOf(payload[i++]);
            const c2 = ALPHABET.indexOf(payload[i++]);
            const c3 = i < payload.length ? ALPHABET.indexOf(payload[i++]) : -1;
            const c4 = i < payload.length ? ALPHABET.indexOf(payload[i++]) : -1;
            if (c1 < 0 || c2 < 0) throw new Error('Invalid character');
            bytes.push((c1 << 2) | (c2 >> 4));
            if (c3 >= 0) bytes.push(((c2 & 15) << 4) | (c3 >> 2));
            if (c4 >= 0) bytes.push(((c3 & 3) << 6) | c4);
        }

        const actualChecksum = bytes.reduce((a, b) => a + b, 0) % 64;
        if (actualChecksum !== expectedChecksum) throw new Error('Checksum mismatch');

        return new TextDecoder().decode(new Uint8Array(bytes));
    }
}
