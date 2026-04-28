/**
 * AccessibilityManager — centralized accessibility settings and effects.
 * Handles: colorblind modes, UI scale, high contrast, reduced motion,
 *          motor accessibility, sound visualization, epilepsy safe mode,
 *          dyslexia font, screen reader hooks.
 */

import * as THREE from 'three';

export class AccessibilityManager {
    constructor(postProcessing) {
        this.pp = postProcessing;
        this.settings = {
            colorblindMode: 'none',
            uiScale: 1.0,
            highContrast: false,
            reducedMotion: false,
            subtitles: false,
            subtitleSize: 'medium',
            subtitleBackground: true,
            screenReader: false,
            toggleSprint: false,
            stickyTargeting: false,
            pauseOnDamage: false,
            soundVisualization: false,
            epilepsySafe: false,
            dyslexiaFont: false,
        };
        this._sprintToggled = false;
        this._pauseOnDamageTimer = 0;
        this._soundVizEntries = [];
        this._buildColorblindFilter();
        this._applyCSSVars();
    }

    load(s = {}) {
        Object.assign(this.settings, s);
        this._applyAll();
    }

    serialize() {
        return { ...this.settings };
    }

    set(key, value) {
        if (this.settings[key] === undefined) return false;
        this.settings[key] = value;
        this._applyOne(key);
        return true;
    }

    get(key) { return this.settings[key]; }

    /* ---------- Application ---------- */

    _applyAll() {
        for (const key of Object.keys(this.settings)) this._applyOne(key);
    }

    _applyOne(key) {
        switch (key) {
            case 'colorblindMode': this._applyColorblind(); break;
            case 'uiScale': this._applyCSSVars(); break;
            case 'highContrast': this._applyCSSVars(); break;
            case 'reducedMotion': this._applyCSSVars(); break;
            case 'dyslexiaFont': this._applyCSSVars(); break;
            case 'epilepsySafe': this._applyEpilepsy(); break;
            case 'screenReader': this._applyScreenReader(); break;
        }
    }

    /* ---------- Colorblind ---------- */

    _buildColorblindFilter() {
        if (document.getElementById('apex-colorblind-filters')) return;
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.id = 'apex-colorblind-filters';
        svg.style.position = 'absolute';
        svg.style.width = '0';
        svg.style.height = '0';
        svg.innerHTML = `
            <defs>
                <filter id="deuteranopia"><feColorMatrix type="matrix" values="0.43 0.72 -0.15 0 0  0.34 0.57 0.09 0 0  -0.02 0.03 1 0 0  0 0 0 1 0"/></filter>
                <filter id="protanopia"><feColorMatrix type="matrix" values="0.57 0.43 0 0 0  0.56 0.44 0 0 0  0 0.24 0.76 0 0  0 0 0 1 0"/></filter>
                <filter id="tritanopia"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.43 0.57 0 0  0 0.48 0.52 0 0  0 0 0 1 0"/></filter>
                <filter id="achromatopsia"><feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0"/></filter>
            </defs>
        `;
        document.body.appendChild(svg);
    }

    _applyColorblind() {
        const mode = this.settings.colorblindMode;
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        canvas.style.filter = (mode !== 'none') ? `url(#${mode})` : 'none';
    }

    /* ---------- CSS Variables ---------- */

    _applyCSSVars() {
        const root = document.documentElement;
        root.style.setProperty('--apex-ui-scale', this.settings.uiScale);
        root.style.setProperty('--apex-high-contrast', this.settings.highContrast ? '1' : '0');
        root.style.setProperty('--apex-reduced-motion', this.settings.reducedMotion ? '1' : '0');
        root.style.setProperty('--apex-dyslexia-font', this.settings.dyslexiaFont ? "'OpenDyslexic', 'Segoe UI', sans-serif" : "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif");

        if (this.settings.highContrast) {
            root.classList.add('apex-high-contrast');
        } else {
            root.classList.remove('apex-high-contrast');
        }

        if (this.settings.reducedMotion) {
            root.classList.add('apex-reduced-motion');
        } else {
            root.classList.remove('apex-reduced-motion');
        }

        if (this.settings.dyslexiaFont) {
            root.classList.add('apex-dyslexia');
        } else {
            root.classList.remove('apex-dyslexia');
        }
    }

    /* ---------- Epilepsy Safe ---------- */

    _applyEpilepsy() {
        const safe = this.settings.epilepsySafe;
        if (this.pp) {
            this.pp.toggleBloom(!safe);
            this.pp.toggleFilmGrain(!safe);
            this.pp.toggleChromaticAberration(!safe);
        }
    }

    /* ---------- Screen Reader ---------- */

    _applyScreenReader() {
        const enabled = this.settings.screenReader;
        const regions = ['levelup-toast', 'save-toast', 'death-screen'];
        for (const id of regions) {
            const el = document.getElementById(id);
            if (el) {
                el.setAttribute('role', 'status');
                el.setAttribute('aria-live', enabled ? 'assertive' : 'off');
            }
        }
    }

    /* ---------- Motor / Sprint ---------- */

    shouldToggleSprint() {
        return this.settings.toggleSprint;
    }

    getSprintState(inputWasPressed, inputIsPressed) {
        if (!this.settings.toggleSprint) return inputIsPressed;
        if (inputWasPressed) this._sprintToggled = !this._sprintToggled;
        return this._sprintToggled;
    }

    resetSprint() { this._sprintToggled = false; }

    /* ---------- Pause on Damage ---------- */

    triggerPauseOnDamage() {
        if (!this.settings.pauseOnDamage) return 0;
        this._pauseOnDamageTimer = 0.5;
        return this._pauseOnDamageTimer;
    }

    getPauseOnDamageRemain() {
        return this._pauseOnDamageTimer;
    }

    updatePauseOnDamage(dt) {
        if (this._pauseOnDamageTimer > 0) {
            this._pauseOnDamageTimer -= dt;
            if (this._pauseOnDamageTimer < 0) this._pauseOnDamageTimer = 0;
        }
        return this._pauseOnDamageTimer > 0;
    }

    /* ---------- Sound Visualization ---------- */

    addSoundViz(position, type = 'generic', intensity = 1.0) {
        if (!this.settings.soundVisualization) return;
        this._soundVizEntries.push({ position: position.clone(), type, intensity, timer: 0, duration: 1.5 });
    }

    updateSoundViz(dt, camera, player) {
        if (!this.settings.soundVisualization) {
            this._soundVizEntries = [];
            return [];
        }
        const out = [];
        for (const entry of this._soundVizEntries) {
            entry.timer += dt;
            if (entry.timer >= entry.duration) continue;
            const t = entry.timer / entry.duration;
            const fade = 1 - t;
            const dir = new THREE.Vector3().subVectors(entry.position, player.position).normalize();
            out.push({ dir, intensity: entry.intensity * fade, type: entry.type });
        }
        this._soundVizEntries = this._soundVizEntries.filter(e => e.timer < e.duration);
        return out;
    }
}
