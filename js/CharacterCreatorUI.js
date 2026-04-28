import { CHARACTER_BASES } from './CharacterBaseVisuals.js';
import { CHARACTER_PARTS, SILHOUETTES, STYLE_PRESETS } from './CharacterCustomizationSystem.js';

export class CharacterCreatorUI {
    constructor(customizationSystem) {
        this.system = customizationSystem;
        this.panel = null;
        this.fields = new Map();
        this._installStyles();
        this._createPanel();
        this._wireOpenButtons();
        this.refresh();
    }

    open() {
        this.refresh();
        this.panel.style.display = 'grid';
    }

    close() {
        this.panel.style.display = 'none';
    }

    refresh() {
        if (!this.panel) return;
        const config = this.system.getConfig();
        for (const [key, input] of this.fields) {
            input.value = config[key] || '';
        }
    }

    _createPanel() {
        const panel = document.createElement('div');
        panel.id = 'character-customizer-panel';
        panel.innerHTML = `
            <div class="ccx-header">
                <div>
                    <h2>Runner Workshop</h2>
                    <p>Mix base bodies, split gear pieces, colors, silhouette, and FX.</p>
                </div>
                <button class="ccx-close" type="button">x</button>
            </div>
            <div class="ccx-grid">
                <section class="ccx-section">
                    <h3>Body</h3>
                    <label>Base<select data-field="baseId"></select></label>
                    <label>Silhouette<select data-field="silhouette"></select></label>
                    <label>Head Part<select data-field="head"></select></label>
                    <label>Torso<select data-field="torso"></select></label>
                </section>
                <section class="ccx-section">
                    <h3>Limbs</h3>
                    <label>Left Arm<select data-field="leftArm"></select></label>
                    <label>Right Arm<select data-field="rightArm"></select></label>
                    <label>Left Leg<select data-field="leftLeg"></select></label>
                    <label>Right Leg<select data-field="rightLeg"></select></label>
                </section>
                <section class="ccx-section">
                    <h3>Gear</h3>
                    <label>Back / Cloth<select data-field="gear"></select></label>
                    <label>Displayed Weapon<select data-field="weapon"></select></label>
                    <label>FX Accent<select data-field="fx"></select></label>
                </section>
                <section class="ccx-section">
                    <h3>Style</h3>
                    <div class="ccx-presets"></div>
                    <label>Primary<input data-field="primary" type="color"></label>
                    <label>Accent<input data-field="accent" type="color"></label>
                    <label>Glow<input data-field="emissive" type="color"></label>
                </section>
            </div>
            <div class="ccx-footer">
                <button type="button" data-action="randomize">Randomize</button>
                <button type="button" data-action="apply">Apply</button>
                <button type="button" data-action="close">Done</button>
            </div>
            <p class="ccx-note">Some source packs provide whole-body meshes rather than clean limb meshes. Limb slots are data-ready and will fill in as split limb exports become available.</p>
        `;
        document.body.appendChild(panel);
        this.panel = panel;

        this._fillSelect('baseId', CHARACTER_BASES.map(base => ({ value: base.id, label: base.name })));
        this._fillSelect('silhouette', Object.entries(SILHOUETTES).map(([value, def]) => ({ value, label: def.label })));
        this._fillPartSelect('head', 'head');
        this._fillPartSelect('torso', 'torso');
        this._fillPartSelect('leftArm', 'leftArm');
        this._fillPartSelect('rightArm', 'rightArm');
        this._fillPartSelect('leftLeg', 'leftLeg');
        this._fillPartSelect('rightLeg', 'rightLeg');
        this._fillPartSelect('gear', 'gear');
        this._fillPartSelect('weapon', 'weapon');
        this._fillPartSelect('fx', 'fx');

        panel.querySelectorAll('[data-field]').forEach(input => {
            this.fields.set(input.dataset.field, input);
            input.addEventListener('input', () => this._applyFromFields());
            input.addEventListener('change', () => this._applyFromFields());
        });
        panel.querySelector('.ccx-close').addEventListener('click', () => this.close());
        panel.querySelector('[data-action="close"]').addEventListener('click', () => this.close());
        panel.querySelector('[data-action="apply"]').addEventListener('click', () => this._applyFromFields());
        panel.querySelector('[data-action="randomize"]').addEventListener('click', () => {
            this.system.randomize();
            this.refresh();
        });

        const presetHost = panel.querySelector('.ccx-presets');
        for (const preset of STYLE_PRESETS) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = preset.label;
            btn.style.borderColor = preset.emissive;
            btn.addEventListener('click', () => {
                this.system.setConfig({
                    primary: preset.primary,
                    accent: preset.accent,
                    emissive: preset.emissive
                });
                this.refresh();
            });
            presetHost.appendChild(btn);
        }
    }

    _fillSelect(field, options) {
        const select = this.panel.querySelector(`[data-field="${field}"]`);
        select.innerHTML = options.map(option => `<option value="${escapeAttr(option.value)}">${escapeHtml(option.label)}</option>`).join('');
    }

    _fillPartSelect(field, kind) {
        const options = [
            { value: '', label: 'None' },
            ...CHARACTER_PARTS
                .filter(part => part.kind === kind)
                .map(part => ({ value: part.assetId, label: `${part.label} (${part.base})` }))
        ];
        this._fillSelect(field, options);
    }

    _wireOpenButtons() {
        const characterPanel = document.getElementById('character-panel');
        if (characterPanel && !document.getElementById('btn-character-customize')) {
            const btn = document.createElement('button');
            btn.id = 'btn-character-customize';
            btn.type = 'button';
            btn.textContent = 'Customize Runner';
            btn.style.cssText = 'width:100%;margin-top:10px;';
            btn.addEventListener('click', () => this.open());
            characterPanel.appendChild(btn);
        }

        const start = document.getElementById('start-screen');
        if (start && !document.getElementById('btn-open-runner-workshop')) {
            const btn = document.createElement('button');
            btn.id = 'btn-open-runner-workshop';
            btn.type = 'button';
            btn.textContent = 'Runner Workshop';
            btn.style.marginTop = '10px';
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.open();
            });
            start.appendChild(btn);
        }
    }

    _applyFromFields() {
        const config = {};
        for (const [key, input] of this.fields) config[key] = input.value || null;
        this.system.setConfig(config);
        window.dispatchEvent(new CustomEvent('apex-character-customization-changed', { detail: this.system.getConfig() }));
    }

    _installStyles() {
        if (document.getElementById('character-customizer-styles')) return;
        const style = document.createElement('style');
        style.id = 'character-customizer-styles';
        style.textContent = `
            #character-customizer-panel {
                position: fixed; inset: 54px auto auto 50%; transform: translateX(-50%);
                width: min(900px, calc(100vw - 28px)); max-height: calc(100vh - 90px);
                overflow: auto; display: none; gap: 14px; z-index: 2600;
                background: rgba(8, 9, 14, 0.96); border: 1px solid #2f6f85;
                box-shadow: 0 18px 60px rgba(0,0,0,0.65); padding: 16px; color: #ddd;
                font-family: 'Courier New', monospace;
            }
            .ccx-header { display: flex; align-items: start; justify-content: space-between; gap: 14px; }
            .ccx-header h2 { margin: 0; color: #66e6ff; letter-spacing: 2px; text-transform: uppercase; }
            .ccx-header p, .ccx-note { margin: 5px 0 0; color: #8d9ca8; font-size: 12px; line-height: 1.4; }
            .ccx-close { width: 30px; height: 30px; }
            .ccx-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
            .ccx-section { border: 1px solid #253445; background: rgba(20,24,32,0.8); padding: 12px; }
            .ccx-section h3 { margin: 0 0 10px; color: #ffaa00; font-size: 13px; text-transform: uppercase; }
            .ccx-section label { display: grid; gap: 5px; margin-bottom: 10px; font-size: 11px; color: #8fa4b5; text-transform: uppercase; }
            .ccx-section select, .ccx-section input { width: 100%; box-sizing: border-box; background: #10151e; color: #e8f8ff; border: 1px solid #34495e; padding: 7px; }
            .ccx-presets { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
            .ccx-presets button, .ccx-footer button, .ccx-close { background: #121a24; color: #dff7ff; border: 1px solid #35546b; padding: 8px; cursor: pointer; }
            .ccx-presets button:hover, .ccx-footer button:hover, .ccx-close:hover { border-color: #ffaa00; color: #fff; }
            .ccx-footer { display: flex; justify-content: flex-end; gap: 8px; }
            @media (max-width: 760px) { .ccx-grid { grid-template-columns: 1fr; } }
        `;
        document.head.appendChild(style);
    }
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeAttr(value) {
    return escapeHtml(value);
}
