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
}
