const STORAGE_KEY = 'apex_keybindings_v1';

export const DEFAULT_BINDINGS = {
    moveForward:  { label: 'Move Forward',  keyboard: 'KeyW',      gamepad: null }, // gamepad uses axes
    moveBackward: { label: 'Move Backward', keyboard: 'KeyS',      gamepad: null },
    moveLeft:     { label: 'Move Left',     keyboard: 'KeyA',      gamepad: null },
    moveRight:    { label: 'Move Right',    keyboard: 'KeyD',      gamepad: null },
    jump:         { label: 'Jump',          keyboard: 'Space',     gamepad: 0 },
    crouch:       { label: 'Crouch/Slide',  keyboard: 'KeyC',      gamepad: 1 },
    sprint:       { label: 'Sprint',        keyboard: 'ShiftLeft', gamepad: 4 },
    airDash:      { label: 'Air Dash',      keyboard: 'KeyQ',      gamepad: 2 },
    interact:     { label: 'Interact',      keyboard: 'KeyE',      gamepad: 3 },
    grapple:      { label: 'Grapple Aim',   keyboard: 'Mouse2',    gamepad: 6 },
    fire:         { label: 'Fire / Melee',  keyboard: 'Mouse1',    gamepad: 5 },
    droneTakedown:{ label: 'Drone Takedown',keyboard: 'KeyF',      gamepad: 5 }, // shared with fire on gamepad
    runnerVision: { label: 'Runner Vision', keyboard: 'KeyV',      gamepad: 8 },
    magnetBoots:  { label: 'Magnet Boots',  keyboard: 'ControlLeft',gamepad: 10 },
    dayNight:     { label: 'Day/Night',     keyboard: 'KeyN',      gamepad: 11 },
    inventory:    { label: 'Inventory',     keyboard: 'KeyI',      gamepad: null },
    passiveTree:  { label: 'Passive Tree',  keyboard: 'KeyK',      gamepad: null },
    codex:        { label: 'Codex',         keyboard: 'KeyL',      gamepad: null },
    map:          { label: 'Map',           keyboard: 'KeyO',      gamepad: null },
    pause:        { label: 'Pause',         keyboard: 'Escape',    gamepad: 9 },
    weapon1:      { label: 'Weapon 1',      keyboard: 'Digit1',    gamepad: null },
    weapon2:      { label: 'Weapon 2',      keyboard: 'Digit2',    gamepad: null },
    weapon3:      { label: 'Weapon 3',      keyboard: 'Digit3',    gamepad: null },
    weapon4:      { label: 'Weapon 4',      keyboard: 'Digit4',    gamepad: null },
    weapon5:      { label: 'Weapon 5',      keyboard: 'Digit5',    gamepad: null },
    scrollUp:     { label: 'Weapon Prev',   keyboard: 'ScrollUp',  gamepad: null },
    scrollDown:   { label: 'Weapon Next',   keyboard: 'ScrollDown',gamepad: null },
};

export class KeyBindings {
    constructor() {
        this.keyboardMap = new Map();
        this.gamepadMap = new Map();
        this._load();
    }

    _load() {
        // Start with identity: each virtual key maps to itself
        for (const [action, def] of Object.entries(DEFAULT_BINDINGS)) {
            if (def.keyboard) this.keyboardMap.set(def.keyboard, def.keyboard);
            if (def.gamepad !== null) this.gamepadMap.set(String(def.gamepad), def.keyboard || action);
        }
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                if (saved.keyboard) {
                    for (const [k, v] of Object.entries(saved.keyboard)) this.keyboardMap.set(k, v);
                }
                if (saved.gamepad) {
                    for (const [k, v] of Object.entries(saved.gamepad)) this.gamepadMap.set(k, v);
                }
            }
        } catch (e) {
            if (window.__DEV__) console.warn('KeyBindings: failed to load', e);
        }
    }

    _save() {
        const obj = {
            keyboard: Object.fromEntries(this.keyboardMap),
            gamepad: Object.fromEntries(this.gamepadMap),
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
        } catch (e) {
            if (window.__DEV__) console.warn('KeyBindings: failed to save', e);
        }
    }

    /** Given a physical key code, return the virtual key code it maps to. */
    mapKeyboard(physicalCode) {
        return this.keyboardMap.get(physicalCode) || physicalCode;
    }

    /** Alias used by InputManager. */
    getBindingForPhysicalKey(physicalCode) {
        return this.keyboardMap.get(physicalCode) || null;
    }

    /** Given a gamepad button index, return the virtual key code it maps to. */
    mapGamepad(buttonIndex) {
        return this.gamepadMap.get(String(buttonIndex)) || null;
    }

    /** Alias used by GamepadController for button mapping. */
    getGamepadBinding(buttonIndex) {
        return this.gamepadMap.get(String(buttonIndex)) || null;
    }

    /** Alias used by GamepadController for d-pad mapping. */
    getDpadBinding(buttonIndex) {
        // D-pad buttons are typically indices 12-15
        const dpadMap = {
            '12': 'KeyW',
            '13': 'KeyS',
            '14': 'KeyA',
            '15': 'KeyD',
        };
        return dpadMap[String(buttonIndex)] || null;
    }

    /** Remap a physical keyboard key to a virtual key. */
    setKeyboardBinding(physicalCode, virtualCode) {
        // Remove any existing mapping that points to this virtual code to avoid duplicates
        for (const [k, v] of this.keyboardMap.entries()) {
            if (v === virtualCode) this.keyboardMap.delete(k);
        }
        this.keyboardMap.set(physicalCode, virtualCode);
        this._save();
    }

    /** Remap a gamepad button to a virtual key. */
    setGamepadBinding(buttonIndex, virtualCode) {
        for (const [k, v] of this.gamepadMap.entries()) {
            if (v === virtualCode) this.gamepadMap.delete(k);
        }
        this.gamepadMap.set(String(buttonIndex), virtualCode);
        this._save();
    }

    /** Get all current bindings as an array for UI rendering. */
    getAllBindings() {
        const list = [];
        for (const [action, def] of Object.entries(DEFAULT_BINDINGS)) {
            const kbPhysical = [...this.keyboardMap.entries()].find(([k, v]) => v === def.keyboard)?.[0] || def.keyboard;
            const gpPhysical = [...this.gamepadMap.entries()].find(([k, v]) => v === def.keyboard)?.[0] || (def.gamepad !== null ? String(def.gamepad) : null);
            list.push({ action, label: def.label, keyboard: kbPhysical, gamepad: gpPhysical });
        }
        return list;
    }

    /** Find which virtual key a physical keyboard key currently triggers. */
    getKeyboardTarget(physicalCode) {
        return this.keyboardMap.get(physicalCode) || physicalCode;
    }

    /** Find which virtual key a gamepad button currently triggers. */
    getGamepadTarget(buttonIndex) {
        return this.gamepadMap.get(String(buttonIndex)) || null;
    }

    resetToDefaults() {
        this.keyboardMap.clear();
        this.gamepadMap.clear();
        for (const [action, def] of Object.entries(DEFAULT_BINDINGS)) {
            if (def.keyboard) this.keyboardMap.set(def.keyboard, def.keyboard);
            if (def.gamepad !== null) this.gamepadMap.set(String(def.gamepad), def.keyboard || action);
        }
        this._save();
    }
}

export const keyBindings = new KeyBindings();
