import * as THREE from 'three';

// World state presets
const LIGHT_WORLD = {
    fogColor:       new THREE.Color(0x151520),
    fogNear:        20,
    fogFar:         70,
    ambientColor:   new THREE.Color(0x404060),
    ambientIntens:  0.6,
    sunColor:       new THREE.Color(0xffaa55),
    sunIntens:      1.2,
    chromaStrength: 0.005,
    chromaEnabled:  false,
};

const DARK_WORLD = {
    fogColor:       new THREE.Color(0x1a0010),
    fogNear:        12,
    fogFar:         45,
    ambientColor:   new THREE.Color(0x300020),
    ambientIntens:  0.4,
    sunColor:       new THREE.Color(0xcc2200),
    sunIntens:      0.8,
    chromaStrength: 0.022,
    chromaEnabled:  true,
};

const TRANSITION_DURATION = 0.8;

export class LightDarkWorldSystem {
    /**
     * @param {THREE.Scene}            scene
     * @param {object}                 player
     * @param {object}                 postProcessing
     * @param {THREE.AmbientLight}     ambient
     * @param {THREE.DirectionalLight} sun
     * @param {THREE.DirectionalLight} fill
     */
    constructor(scene, player, postProcessing, ambient, sun, fill) {
        this._scene  = scene;
        this._player = player;
        this._pp     = postProcessing;
        this._ambient = ambient;
        this._sun     = sun;
        this._fill    = fill;

        this._corrupted   = false;
        this._transitioning = false;
        this._transitionT   = 1.0; // 1 = fully settled
        this._fromPreset    = LIGHT_WORLD;
        this._toPreset      = LIGHT_WORLD;

        // Persistent dark-world vignette overlay
        this._overlay = document.createElement('div');
        Object.assign(this._overlay.style, {
            position:        'fixed',
            inset:           '0',
            pointerEvents:   'none',
            zIndex:          '90',
            background:      'radial-gradient(ellipse at center, transparent 40%, rgba(120,0,30,0.55) 100%)',
            opacity:         '0',
            transition:      'opacity 0.4s ease',
        });
        document.body.appendChild(this._overlay);

        // One-shot flash div
        this._flash = document.createElement('div');
        Object.assign(this._flash.style, {
            position:      'fixed',
            inset:         '0',
            pointerEvents: 'none',
            zIndex:        '91',
            background:    'rgba(160,0,80,0.75)',
            opacity:       '0',
        });
        document.body.appendChild(this._flash);

        // Working color temps used during lerp
        this._tmpFog     = new THREE.Color();
        this._tmpAmbient = new THREE.Color();
        this._tmpSun     = new THREE.Color();

        // Apply light-world state immediately
        this._applyPreset(LIGHT_WORLD, 1.0);
    }

    get isCorrupted() { return this._corrupted; }

    /** Flip worlds. No-op if Phase Mirror not collected. */
    toggle() {
        if (!this._player.phaseMirrorEnabled) return;
        this._corrupted    = !this._corrupted;
        this._fromPreset   = this._corrupted ? LIGHT_WORLD : DARK_WORLD;
        this._toPreset     = this._corrupted ? DARK_WORLD  : LIGHT_WORLD;
        this._transitionT  = 0;
        this._transitioning = true;
        this._playFlash();
    }

    /**
     * @param {number} dt
     * @param {object} activeInput
     */
    update(dt, activeInput) {
        if (activeInput.wasPressed('KeyZ')) {
            this.toggle();
        }

        if (!this._transitioning) return;

        this._transitionT += dt / TRANSITION_DURATION;
        if (this._transitionT >= 1.0) {
            this._transitionT  = 1.0;
            this._transitioning = false;
        }

        const t = this._easeInOut(this._transitionT);
        this._applyLerp(this._fromPreset, this._toPreset, t);
        this._overlay.style.opacity = String((this._corrupted ? t : 1 - t) * 0.18);
    }

    dispose() {
        this._overlay.remove();
        this._flash.remove();
    }

    // ------------------------------------------------------------------ //
    //  Private helpers
    // ------------------------------------------------------------------ //

    _applyPreset(preset, t) {
        this._applyLerp(preset, preset, t);
        this._overlay.style.opacity = preset === DARK_WORLD ? '0.18' : '0';
    }

    _applyLerp(from, to, t) {
        const scene   = this._scene;

        // Fog color
        this._tmpFog.copy(from.fogColor).lerp(to.fogColor, t);
        if (scene.fog) {
            scene.fog.color.copy(this._tmpFog);
            scene.fog.near = from.fogNear + (to.fogNear - from.fogNear) * t;
            scene.fog.far  = from.fogFar  + (to.fogFar  - from.fogFar)  * t;
        }
        scene.background = this._tmpFog.clone();

        // Ambient
        if (this._ambient) {
            this._tmpAmbient.copy(from.ambientColor).lerp(to.ambientColor, t);
            this._ambient.color.copy(this._tmpAmbient);
            this._ambient.intensity = from.ambientIntens +
                (to.ambientIntens - from.ambientIntens) * t;
        }

        // Sun / directional
        if (this._sun) {
            this._tmpSun.copy(from.sunColor).lerp(to.sunColor, t);
            this._sun.color.copy(this._tmpSun);
            this._sun.intensity = from.sunIntens +
                (to.sunIntens - from.sunIntens) * t;
        }

        // Chromatic aberration (PostProcessing pass)
        const cap = this._pp && this._pp.chromaticAberrationPass;
        if (cap) {
            const strength = from.chromaStrength +
                (to.chromaStrength - from.chromaStrength) * t;
            cap.uniforms.strength.value = strength;
            cap.enabled = t > 0.01 ? to.chromaEnabled : from.chromaEnabled;
        }
    }

    _playFlash() {
        const f = this._flash;
        f.style.transition = 'none';
        f.style.opacity    = '1';
        // Force reflow then fade out
        void f.offsetWidth;
        f.style.transition = 'opacity 0.35s ease';
        f.style.opacity    = '0';
    }

    _easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
}
