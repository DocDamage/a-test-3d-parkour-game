/**
 * SaveSlots — manage 3 named save slots.
 */

export class SaveSlots {
    constructor() {
        this.maxSlots = 3;
        this._slotNames = ['Slot 1', 'Slot 2', 'Slot 3'];
        this._loadNames();
    }

    getSlotKeys(slotIndex) {
        const prefix = `apex_slot${slotIndex}_`;
        return {
            save: `${prefix}save`,
            settings: `${prefix}settings`,
            character: `${prefix}character`,
            quests: `${prefix}quests`,
            graffiti: `${prefix}graffiti`,
            transmog: `${prefix}transmog`,
            prestige: `${prefix}prestige`,
            history: `${prefix}history`,
        };
    }

    copyToSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.maxSlots) return false;
        const keys = this.getSlotKeys(slotIndex);
        const sources = {
            [keys.save]: 'apex_save_v1',
            [keys.settings]: 'apex_settings_v1',
            [keys.character]: 'apex_character',
            [keys.quests]: 'apex_quests',
            [keys.graffiti]: 'apex_graffiti',
            [keys.transmog]: 'apex_transmog',
            [keys.prestige]: 'apex_prestige',
            [keys.history]: 'apex_run_history',
        };
        for (const [dest, src] of Object.entries(sources)) {
            try {
                const val = localStorage.getItem(src);
                if (val !== null) localStorage.setItem(dest, val);
            } catch (e) {}
        }
        return true;
    }

    loadFromSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.maxSlots) return false;
        const keys = this.getSlotKeys(slotIndex);
        const dests = {
            'apex_save_v1': keys.save,
            'apex_settings_v1': keys.settings,
            'apex_character': keys.character,
            'apex_quests': keys.quests,
            'apex_graffiti': keys.graffiti,
            'apex_transmog': keys.transmog,
            'apex_prestige': keys.prestige,
            'apex_run_history': keys.history,
        };
        for (const [dest, src] of Object.entries(dests)) {
            try {
                const val = localStorage.getItem(src);
                if (val !== null) localStorage.setItem(dest, val);
                else localStorage.removeItem(dest);
            } catch (e) {}
        }
        return true;
    }

    hasData(slotIndex) {
        const keys = this.getSlotKeys(slotIndex);
        try {
            return localStorage.getItem(keys.save) !== null;
        } catch (e) { return false; }
    }

    setSlotName(slotIndex, name) {
        this._slotNames[slotIndex] = name;
        this._saveNames();
    }

    getSlotName(slotIndex) {
        return this._slotNames[slotIndex] || `Slot ${slotIndex + 1}`;
    }

    _saveNames() {
        try {
            localStorage.setItem('apex_slot_names', JSON.stringify(this._slotNames));
        } catch (e) {}
    }

    _loadNames() {
        try {
            const raw = localStorage.getItem('apex_slot_names');
            if (raw) this._slotNames = JSON.parse(raw);
        } catch (e) {}
    }
}
