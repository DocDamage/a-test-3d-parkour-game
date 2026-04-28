/**
 * CloudSaveExport — export/import saves as JSON files for cross-device portability.
 */

export class CloudSaveExport {
    constructor(saveSystem) {
        this.saveSystem = saveSystem;
    }

    exportToFile() {
        const data = this._gatherAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `apex_rift_save_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this._restoreAllData(data);
                    resolve({ success: true });
                } catch (err) {
                    reject(new Error('Invalid save file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    _gatherAllData() {
        const keys = [
            'apex_save_v1', 'apex_settings_v1', 'apex_character',
            'rpg_origin', 'rpg_archetype', 'runner_name',
            'apex_quests', 'apex_graffiti', 'apex_transmog',
            'apex_prestige', 'apex_run_history', 'apex_locale',
        ];
        const data = { version: 1, exportedAt: new Date().toISOString(), slots: {} };
        for (const key of keys) {
            try {
                const val = localStorage.getItem(key);
                if (val !== null) data.slots[key] = val;
            } catch (e) {}
        }
        return data;
    }

    _restoreAllData(data) {
        if (!data || !data.slots) throw new Error('Invalid save data');
        for (const [key, val] of Object.entries(data.slots)) {
            try {
                localStorage.setItem(key, val);
            } catch (e) {}
        }
    }
}
