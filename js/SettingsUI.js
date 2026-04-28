export const DEFAULT_SETTINGS = {
    masterVolume: 0.8,
    musicVolume: 0.5,
    sfxVolume: 0.7,
    voiceVolume: 0.8,
    uiVolume: 0.6,
    fov: 75,
    sensitivity: 2.5,
    cameraShake: true,
    motionBlur: true,
    filmGrain: true,
    sao: true,
    bloom: true,
    chromaticAberration: true,
    vignette: true,
    assistJump: false,
    assistGrapple: false,
    assistAim: false,
    hapticsEnabled: true,
    touchControls: false,
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
    gamepadDeadzone: 0.15,
    triggerThreshold: 0.1,
    gyroAim: false,
    gyroSensitivity: 1.0,
    promptSet: 'auto',
    language: 'en',
};

export function wireSettings(settings, deps) {
    const { postProcessing, audio, assistMode, player, touchControls, saveSystem } = deps;
    const SETTINGS_KEY = 'apex_settings_v1';

    function getSettingsValues() {
        const vals = {};
        const fovSlider = document.getElementById('set-fov');
        if (fovSlider) vals.fov = parseFloat(fovSlider.value);
        const sensSlider = document.getElementById('set-sensitivity');
        if (sensSlider) vals.sensitivity = parseFloat(sensSlider.value);
        const effects = [
            ['set-filmgrain', 'filmGrain'],
            ['set-motionblur', 'motionBlur'],
            ['set-sao', 'sao'],
            ['set-bloom', 'bloom'],
            ['set-chromatic', 'chromaticAberration'],
            ['set-vignette', 'vignette']
        ];
        for (const [id, name] of effects) {
            const cb = document.getElementById(id);
            if (cb) vals[name] = cb.checked;
        }
        const volMaster = document.getElementById('set-vol-master');
        if (volMaster) vals.masterVolume = parseFloat(volMaster.value) / 100;
        const volSFX = document.getElementById('set-vol-sfx');
        if (volSFX) vals.sfxVolume = parseFloat(volSFX.value) / 100;
        const volMusic = document.getElementById('set-vol-music');
        if (volMusic) vals.musicVolume = parseFloat(volMusic.value) / 100;
        const assistJump = document.getElementById('set-assist-jump');
        if (assistJump) vals.assistJump = assistJump.checked;
        const assistGrapple = document.getElementById('set-assist-grapple');
        if (assistGrapple) vals.assistGrapple = assistGrapple.checked;
        const assistAim = document.getElementById('set-assist-aim');
        if (assistAim) vals.assistAim = assistAim.checked;
        const hapticsToggle = document.getElementById('set-haptics');
        if (hapticsToggle) vals.hapticsEnabled = hapticsToggle.checked;
        const touchCb = document.getElementById('set-touch');
        if (touchCb) vals.touchControls = touchCb.checked;

        // New accessibility settings
        const cbMode = document.getElementById('set-colorblind');
        if (cbMode) vals.colorblindMode = cbMode.value;
        const uiScale = document.getElementById('set-ui-scale');
        if (uiScale) vals.uiScale = parseFloat(uiScale.value);
        const hc = document.getElementById('set-high-contrast');
        if (hc) vals.highContrast = hc.checked;
        const rm = document.getElementById('set-reduced-motion');
        if (rm) vals.reducedMotion = rm.checked;
        const sub = document.getElementById('set-subtitles');
        if (sub) vals.subtitles = sub.checked;
        const subSize = document.getElementById('set-subtitle-size');
        if (subSize) vals.subtitleSize = subSize.value;
        const subBg = document.getElementById('set-subtitle-bg');
        if (subBg) vals.subtitleBackground = subBg.checked;
        const sr = document.getElementById('set-screen-reader');
        if (sr) vals.screenReader = sr.checked;
        const ts = document.getElementById('set-toggle-sprint');
        if (ts) vals.toggleSprint = ts.checked;
        const st = document.getElementById('set-sticky-targeting');
        if (st) vals.stickyTargeting = st.checked;
        const pod = document.getElementById('set-pause-damage');
        if (pod) vals.pauseOnDamage = pod.checked;
        const sv = document.getElementById('set-sound-viz');
        if (sv) vals.soundVisualization = sv.checked;
        const ep = document.getElementById('set-epilepsy');
        if (ep) vals.epilepsySafe = ep.checked;
        const df = document.getElementById('set-dyslexia');
        if (df) vals.dyslexiaFont = df.checked;

        // New controller settings
        const dz = document.getElementById('set-deadzone');
        if (dz) vals.gamepadDeadzone = parseFloat(dz.value);
        const tt = document.getElementById('set-trigger-threshold');
        if (tt) vals.triggerThreshold = parseFloat(tt.value);
        const gyro = document.getElementById('set-gyro');
        if (gyro) vals.gyroAim = gyro.checked;
        const gyroSens = document.getElementById('set-gyro-sens');
        if (gyroSens) vals.gyroSensitivity = parseFloat(gyroSens.value);
        const prompts = document.getElementById('set-prompts');
        if (prompts) vals.promptSet = prompts.value;

        // Language
        const lang = document.getElementById('set-language');
        if (lang) vals.language = lang.value;

        return vals;
    }

    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(getSettingsValues()));
        } catch (e) { /* ignore */ }
    }

    function applySettings(raw) {
        const s = { ...DEFAULT_SETTINGS, ...(raw || {}) };
        Object.assign(settings, s);
        const fovSlider = document.getElementById('set-fov');
        if (fovSlider && s.fov !== undefined) {
            fovSlider.value = s.fov;
            if (postProcessing) postProcessing.setFOV(s.fov);
        }
        const sensSlider = document.getElementById('set-sensitivity');
        if (sensSlider && s.sensitivity !== undefined) {
            sensSlider.value = s.sensitivity;
        }
        const effects = [
            ['set-filmgrain', 'filmGrain'],
            ['set-motionblur', 'motionBlur'],
            ['set-sao', 'sao'],
            ['set-bloom', 'bloom'],
            ['set-chromatic', 'chromaticAberration'],
            ['set-vignette', 'vignette']
        ];
        for (const [id, name] of effects) {
            const cb = document.getElementById(id);
            if (cb && s[name] !== undefined) {
                cb.checked = s[name];
                if (postProcessing) postProcessing.setEffectEnabled(name, s[name]);
            }
        }
        const volMaster = document.getElementById('set-vol-master');
        if (volMaster && s.masterVolume !== undefined) {
            volMaster.value = Math.round(s.masterVolume * 100);
            if (audio) audio.setMasterVolume(s.masterVolume);
        }
        const volSFX = document.getElementById('set-vol-sfx');
        if (volSFX && s.sfxVolume !== undefined) {
            volSFX.value = Math.round(s.sfxVolume * 100);
            if (audio) audio.setSFXVolume(s.sfxVolume);
        }
        const volMusic = document.getElementById('set-vol-music');
        if (volMusic && s.musicVolume !== undefined) {
            volMusic.value = Math.round(s.musicVolume * 100);
            if (audio) audio.setMusicVolume(s.musicVolume);
        }
        const assistJump = document.getElementById('set-assist-jump');
        if (assistJump && s.assistJump !== undefined) {
            assistJump.checked = s.assistJump;
            if (assistMode) {
                assistMode.setJumpAssist(s.assistJump);
                if (s.assistJump) assistMode.modifyPlayer(player);
                else assistMode.restorePlayer(player);
            }
        }
        const assistGrapple = document.getElementById('set-assist-grapple');
        if (assistGrapple && s.assistGrapple !== undefined) {
            assistGrapple.checked = s.assistGrapple;
            if (assistMode) {
                assistMode.setGrappleAssist(s.assistGrapple);
                if (s.assistGrapple) assistMode.modifyPlayer(player);
                else assistMode.restorePlayer(player);
            }
        }
        const assistAim = document.getElementById('set-assist-aim');
        if (assistAim && s.assistAim !== undefined) {
            assistAim.checked = s.assistAim;
            if (assistMode) {
                assistMode.setAimAssist(s.assistAim);
                if (s.assistAim) assistMode.modifyPlayer(player);
                else assistMode.restorePlayer(player);
            }
        }
        const hapticsToggle = document.getElementById('set-haptics');
        if (hapticsToggle && s.hapticsEnabled !== undefined) {
            hapticsToggle.checked = s.hapticsEnabled;
        }
        const touchCb = document.getElementById('set-touch');
        if (touchCb && s.touchControls !== undefined) {
            touchCb.checked = s.touchControls;
            if (touchControls) touchControls.setEnabled(s.touchControls);
        }

        // New accessibility
        const cbMode = document.getElementById('set-colorblind');
        if (cbMode && s.colorblindMode !== undefined) cbMode.value = s.colorblindMode;
        const uiScale = document.getElementById('set-ui-scale');
        if (uiScale && s.uiScale !== undefined) uiScale.value = s.uiScale;
        const hc = document.getElementById('set-high-contrast');
        if (hc && s.highContrast !== undefined) hc.checked = s.highContrast;
        const rm = document.getElementById('set-reduced-motion');
        if (rm && s.reducedMotion !== undefined) rm.checked = s.reducedMotion;
        const sub = document.getElementById('set-subtitles');
        if (sub && s.subtitles !== undefined) sub.checked = s.subtitles;
        const subSize = document.getElementById('set-subtitle-size');
        if (subSize && s.subtitleSize !== undefined) subSize.value = s.subtitleSize;
        const subBg = document.getElementById('set-subtitle-bg');
        if (subBg && s.subtitleBackground !== undefined) subBg.checked = s.subtitleBackground;
        const sr = document.getElementById('set-screen-reader');
        if (sr && s.screenReader !== undefined) sr.checked = s.screenReader;
        const ts = document.getElementById('set-toggle-sprint');
        if (ts && s.toggleSprint !== undefined) ts.checked = s.toggleSprint;
        const st = document.getElementById('set-sticky-targeting');
        if (st && s.stickyTargeting !== undefined) st.checked = s.stickyTargeting;
        const pod = document.getElementById('set-pause-damage');
        if (pod && s.pauseOnDamage !== undefined) pod.checked = s.pauseOnDamage;
        const sv = document.getElementById('set-sound-viz');
        if (sv && s.soundVisualization !== undefined) sv.checked = s.soundVisualization;
        const ep = document.getElementById('set-epilepsy');
        if (ep && s.epilepsySafe !== undefined) ep.checked = s.epilepsySafe;
        const df = document.getElementById('set-dyslexia');
        if (df && s.dyslexiaFont !== undefined) df.checked = s.dyslexiaFont;

        // New controller
        const dz = document.getElementById('set-deadzone');
        if (dz && s.gamepadDeadzone !== undefined) dz.value = s.gamepadDeadzone;
        const tt = document.getElementById('set-trigger-threshold');
        if (tt && s.triggerThreshold !== undefined) tt.value = s.triggerThreshold;
        const gyro = document.getElementById('set-gyro');
        if (gyro && s.gyroAim !== undefined) gyro.checked = s.gyroAim;
        const gyroSens = document.getElementById('set-gyro-sens');
        if (gyroSens && s.gyroSensitivity !== undefined) gyroSens.value = s.gyroSensitivity;
        const prompts = document.getElementById('set-prompts');
        if (prompts && s.promptSet !== undefined) prompts.value = s.promptSet;

        // Language
        const lang = document.getElementById('set-language');
        if (lang && s.language !== undefined) lang.value = s.language;

        return settings;
    }

    // Load on startup
    try {
        const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if (raw && typeof raw === 'object') {
            applySettings(raw);
        } else {
            applySettings(DEFAULT_SETTINGS);
        }
    } catch (e) {
        applySettings(DEFAULT_SETTINGS);
        if (window.__DEV__) console.warn('Settings load failed', e);
    }

    // Wire listeners that also save
    const fovSlider = document.getElementById('set-fov');
    if (fovSlider && postProcessing) {
        fovSlider.addEventListener('input', (e) => {
            postProcessing.setFOV(parseFloat(e.target.value));
            saveSettings();
        });
    }
    const sensSlider = document.getElementById('set-sensitivity');
    if (sensSlider) {
        sensSlider.addEventListener('input', () => { saveSettings(); });
    }
    const effects = [
        ['set-filmgrain', 'filmGrain'],
        ['set-motionblur', 'motionBlur'],
        ['set-sao', 'sao'],
        ['set-bloom', 'bloom'],
        ['set-chromatic', 'chromaticAberration'],
        ['set-vignette', 'vignette']
    ];
    for (const [id, name] of effects) {
        const cb = document.getElementById(id);
        if (cb && postProcessing) {
            cb.addEventListener('change', (e) => {
                postProcessing.setEffectEnabled(name, e.target.checked);
                saveSettings();
            });
        }
    }
    const volMaster = document.getElementById('set-vol-master');
    if (volMaster && audio) {
        volMaster.addEventListener('input', (e) => {
            audio.setMasterVolume(parseFloat(e.target.value) / 100);
            saveSettings();
        });
    }
    const volSFX = document.getElementById('set-vol-sfx');
    if (volSFX && audio) {
        volSFX.addEventListener('input', (e) => {
            audio.setSFXVolume(parseFloat(e.target.value) / 100);
            saveSettings();
        });
    }
    const volMusic = document.getElementById('set-vol-music');
    if (volMusic && audio) {
        volMusic.addEventListener('input', (e) => {
            audio.setMusicVolume(parseFloat(e.target.value) / 100);
            saveSettings();
        });
    }
    const assistJump = document.getElementById('set-assist-jump');
    if (assistJump && assistMode) {
        assistJump.addEventListener('change', (e) => {
            assistMode.setJumpAssist(e.target.checked);
            if (e.target.checked) assistMode.modifyPlayer(player);
            else assistMode.restorePlayer(player);
            saveSettings();
        });
    }
    const assistGrapple = document.getElementById('set-assist-grapple');
    if (assistGrapple && assistMode) {
        assistGrapple.addEventListener('change', (e) => {
            assistMode.setGrappleAssist(e.target.checked);
            if (e.target.checked) assistMode.modifyPlayer(player);
            else assistMode.restorePlayer(player);
            saveSettings();
        });
    }
    const assistAim = document.getElementById('set-assist-aim');
    if (assistAim && assistMode) {
        assistAim.addEventListener('change', (e) => {
            assistMode.setAimAssist(e.target.checked);
            if (e.target.checked) assistMode.modifyPlayer(player);
            else assistMode.restorePlayer(player);
            saveSettings();
        });
    }
    const hapticsToggle = document.getElementById('set-haptics');
    if (hapticsToggle) {
        hapticsToggle.addEventListener('change', (e) => {
            settings.hapticsEnabled = e.target.checked;
            saveSettings();
        });
    }
    const touchCb = document.getElementById('set-touch');
    if (touchCb && touchControls) {
        touchCb.addEventListener('change', (e) => {
            touchControls.setEnabled(e.target.checked);
            saveSettings();
        });
    }
    const saveBtn = document.getElementById('btn-save-game');
    if (saveBtn) saveBtn.addEventListener('click', () => {
        if (confirm('Overwrite current save?')) saveSystem.save();
    });
    const loadBtn = document.getElementById('btn-load-game');
    if (loadBtn) loadBtn.addEventListener('click', () => {
        if (confirm('Load saved game? Unsaved progress will be lost.')) {
            saveSystem.load();
            location.reload();
        }
    });

    // Wire new DOM elements added by release audit
    const startSettings = document.getElementById('btn-start-settings');
    if (startSettings) {
        startSettings.addEventListener('click', () => {
            const sp = document.getElementById('settings-panel');
            if (sp) sp.style.display = 'flex';
        });
    }
    const charBack = document.getElementById('btn-char-back');
    if (charBack) {
        charBack.addEventListener('click', () => {
            const cc = document.getElementById('char-create');
            const ss = document.getElementById('start-screen');
            if (cc) cc.style.display = 'none';
            if (ss) ss.style.display = 'flex';
        });
    }
    const invClose = document.getElementById('inventory-close');
    if (invClose) {
        invClose.addEventListener('click', () => {
            const p = document.getElementById('inventory-panel');
            if (p) p.style.display = 'none';
        });
    }
    const creditsClose = document.getElementById('credits-close');
    if (creditsClose) {
        creditsClose.addEventListener('click', () => {
            const p = document.getElementById('credits-overlay');
            if (p) p.style.display = 'none';
        });
    }
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    if (settingsCloseBtn) {
        settingsCloseBtn.addEventListener('click', () => {
            const sp = document.getElementById('settings-panel');
            if (sp) sp.style.display = 'none';
        });
    }

    // ── New accessibility / controller / language listeners ──
    function _wireToggle(id, key, callback) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', (e) => {
                settings[key] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                if (callback) callback(settings[key]);
                saveSettings();
            });
        }
    }
    function _wireInput(id, key, callback) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (e) => {
                const v = parseFloat(e.target.value);
                settings[key] = v;
                if (callback) callback(v);
                saveSettings();
            });
        }
    }

    _wireToggle('set-colorblind', 'colorblindMode', (v) => {
        if (window.accessibilityManager) window.accessibilityManager.set('colorblindMode', v);
    });
    _wireInput('set-ui-scale', 'uiScale', (v) => {
        document.documentElement.style.fontSize = `calc(100% * ${v})`;
        if (window.accessibilityManager) window.accessibilityManager.set('uiScale', v);
    });
    _wireToggle('set-high-contrast', 'highContrast', (v) => {
        if (window.accessibilityManager) window.accessibilityManager.set('highContrast', v);
    });
    _wireToggle('set-reduced-motion', 'reducedMotion', (v) => {
        if (window.accessibilityManager) window.accessibilityManager.set('reducedMotion', v);
    });
    _wireToggle('set-subtitles', 'subtitles', (v) => {
        if (window.subtitleSystem) window.subtitleSystem.setEnabled(v);
    });
    _wireToggle('set-subtitle-size', 'subtitleSize', (v) => {
        if (window.subtitleSystem) window.subtitleSystem.setSize(v);
    });
    _wireToggle('set-subtitle-bg', 'subtitleBackground', (v) => {
        if (window.subtitleSystem) window.subtitleSystem.setBackground(v);
    });
    _wireToggle('set-screen-reader', 'screenReader', (v) => {
        if (window.accessibilityManager) window.accessibilityManager.set('screenReader', v);
    });
    _wireToggle('set-toggle-sprint', 'toggleSprint', (v) => {
        if (window.accessibilityManager) window.accessibilityManager.set('toggleSprint', v);
    });
    _wireToggle('set-sticky-targeting', 'stickyTargeting', (v) => {
        if (window.accessibilityManager) window.accessibilityManager.set('stickyTargeting', v);
    });
    _wireToggle('set-pause-damage', 'pauseOnDamage', (v) => {
        if (window.accessibilityManager) window.accessibilityManager.set('pauseOnDamage', v);
    });
    _wireToggle('set-sound-viz', 'soundVisualization', (v) => {
        if (window.accessibilityManager) window.accessibilityManager.set('soundVisualization', v);
    });
    _wireToggle('set-epilepsy', 'epilepsySafe', (v) => {
        if (window.accessibilityManager) window.accessibilityManager.set('epilepsySafe', v);
    });
    _wireToggle('set-dyslexia', 'dyslexiaFont', (v) => {
        if (window.accessibilityManager) window.accessibilityManager.set('dyslexiaFont', v);
    });

    // Controller
    _wireInput('set-deadzone', 'gamepadDeadzone', (v) => {
        if (window.gamepadController) window.gamepadController.setDeadZone(v);
    });
    _wireInput('set-trigger-threshold', 'triggerThreshold', (v) => {
        if (window.gamepadController) window.gamepadController.setTriggerThreshold(v);
    });
    _wireToggle('set-gyro', 'gyroAim', (v) => {
        if (window.gamepadController) window.gamepadController.setGyroEnabled(v);
    });
    _wireInput('set-gyro-sens', 'gyroSensitivity', (v) => {
        if (window.gamepadController) window.gamepadController.setGyroSensitivity(v);
    });
    _wireToggle('set-prompts', 'promptSet', (v) => {
        if (window.controllerPrompts) window.controllerPrompts.setSet(v);
    });

    // Language
    _wireToggle('set-language', 'language', (v) => {
        if (window.i18n) window.i18n.setLocale(v);
    });
}
