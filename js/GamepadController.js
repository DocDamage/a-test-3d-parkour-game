/**
 * GamepadController — Modern controller support (Xbox/PS/Switch Pro).
 * Enhanced with: gyro aim, per-device deadzone/sensitivity, trigger thresholds,
 * hot-swap support, adaptive trigger stubs, and prompt detection.
 */
import { keyBindings } from './KeyBindings.js';
import { controllerPrompts } from './ControllerPrompts.js';

const DEADZONE_KEY = 'apex_gamepad_deadzone';
const TRIGGER_KEY = 'apex_gamepad_trigger';
const GYRO_KEY = 'apex_gamepad_gyro';

export class GamepadController {
    constructor() {
        this.gamepad = null;
        this.deadZone = 0.15;
        this.rumbleEnabled = true;
        this.gyroAimEnabled = false;
        this.gyroSensitivity = 1.0;
        this.triggerThreshold = 0.1;
        this._keyboard = null;
        this._activeIndex = -1;
        this._lastId = null;
        this._perDeviceSettings = {};
        this._gyro = { x: 0, y: 0, z: 0 };

        this.keys = {};
        this.prevKeys = {};
        this.mouse = { dx: 0, dy: 0 };
        this.mouseDown = false;
        this.mouse2Down = false;
        this.prevMouseDown = false;
        this.prevMouse2Down = false;

        this._loadSettings();

        window.addEventListener('gamepadconnected', (e) => {
            this._onConnect(e.gamepad);
        });
        window.addEventListener('gamepaddisconnected', (e) => {
            if (this._activeIndex === e.gamepad.index) {
                this.gamepad = null;
                this._activeIndex = -1;
            }
        });
    }

    _onConnect(gp) {
        this.gamepad = gp;
        this._activeIndex = gp.index;
        this._lastId = gp.id;
        controllerPrompts.detect();
        this._loadDeviceSettings(gp.id);
    }

    _loadSettings() {
        try {
            const raw = localStorage.getItem(DEADZONE_KEY);
            if (raw) this.deadZone = parseFloat(raw);
        } catch (e) {}
        try {
            const raw = localStorage.getItem(TRIGGER_KEY);
            if (raw) this.triggerThreshold = parseFloat(raw);
        } catch (e) {}
        try {
            const raw = localStorage.getItem(GYRO_KEY);
            if (raw) {
                const g = JSON.parse(raw);
                this.gyroAimEnabled = !!g.enabled;
                this.gyroSensitivity = g.sens || 1.0;
            }
        } catch (e) {}
    }

    _saveSettings() {
        try {
            localStorage.setItem(DEADZONE_KEY, String(this.deadZone));
            localStorage.setItem(TRIGGER_KEY, String(this.triggerThreshold));
            localStorage.setItem(GYRO_KEY, JSON.stringify({ enabled: this.gyroAimEnabled, sens: this.gyroSensitivity }));
        } catch (e) {}
    }

    _loadDeviceSettings(id) {
        if (!id) return;
        try {
            const raw = localStorage.getItem(`apex_gp_${id}`);
            if (raw) this._perDeviceSettings = JSON.parse(raw);
        } catch (e) {}
    }

    _saveDeviceSettings() {
        if (!this._lastId) return;
        try {
            localStorage.setItem(`apex_gp_${this._lastId}`, JSON.stringify(this._perDeviceSettings));
        } catch (e) {}
    }

    setDeadZone(v) {
        this.deadZone = Math.max(0.01, Math.min(0.9, v));
        if (this._lastId) {
            this._perDeviceSettings.deadZone = this.deadZone;
            this._saveDeviceSettings();
        }
        this._saveSettings();
    }

    setTriggerThreshold(v) {
        this.triggerThreshold = Math.max(0.0, Math.min(1.0, v));
        this._saveSettings();
    }

    setGyroEnabled(v) {
        this.gyroAimEnabled = !!v;
        this._saveSettings();
    }

    setGyroSensitivity(v) {
        this.gyroSensitivity = Math.max(0.1, Math.min(5.0, v));
        this._saveSettings();
    }

    preUpdate() {
        this.prevKeys = { ...this.keys };
        this.prevMouseDown = this.mouseDown;
        this.prevMouse2Down = this.mouse2Down;
        this.mouse.dx = 0;
        this.mouse.dy = 0;

        const gp = this._getGamepad();
        if (!gp) return;

        // Hot-swap: if active gamepad is null, scan for another
        if (this._activeIndex >= 0) {
            const pads = navigator.getGamepads ? navigator.getGamepads() : [];
            const active = pads[this._activeIndex];
            if (!active) {
                for (let i = 0; i < pads.length; i++) {
                    if (pads[i]) {
                        this._onConnect(pads[i]);
                        break;
                    }
                }
            }
        }

        const dz = this._perDeviceSettings.deadZone ?? this.deadZone;

        // Left stick -> WASD
        const lx = gp.axes[0];
        const ly = gp.axes[1];
        const kb = this._keyboard ? this._keyboard.keys : {};
        this.keys['KeyW'] = kb['KeyW'] || (ly < -dz);
        this.keys['KeyS'] = kb['KeyS'] || (ly > dz);
        this.keys['KeyA'] = kb['KeyA'] || (lx < -dz);
        this.keys['KeyD'] = kb['KeyD'] || (lx > dz);

        // Right stick -> camera look
        const rx = gp.axes[2];
        const ry = gp.axes[3];
        const sens = (window.settingsStore && window.settingsStore.sensitivity) ? window.settingsStore.sensitivity * 6 : 15;
        if (Math.abs(rx) > dz) this.mouse.dx += rx * sens;
        if (Math.abs(ry) > dz) this.mouse.dy += ry * sens;

        // Gyro aim (WebHID / Gamepad.pose experimental)
        if (this.gyroAimEnabled && gp.pose && gp.pose.orientation) {
            const q = gp.pose.orientation;
            const gyroX = (q[1] || 0) * this.gyroSensitivity * 300;
            const gyroY = (q[0] || 0) * this.gyroSensitivity * 300;
            this.mouse.dx += gyroX;
            this.mouse.dy += gyroY;
        }

        // R2/RT -> Overclock chord
        const r2 = gp.buttons[7];
        if (r2 && r2.value > this.triggerThreshold) {
            this.keys['ShiftLeft'] = true;
            this.keys['KeyQ'] = true;
        }

        // Buttons with trigger threshold for analog triggers
        for (let idx = 0; idx < gp.buttons.length; idx++) {
            const code = keyBindings.getGamepadBinding(idx);
            if (!code) continue;
            const btn = gp.buttons[idx];
            const pressed = btn && (btn.pressed || btn.value > this.triggerThreshold);
            const kbPressed = this._keyboard ? !!this._keyboard.keys[code] : false;
            if (code === 'Mouse2') {
                this.mouse2Down = pressed || kbPressed;
                this.keys['Mouse2'] = this.mouse2Down;
            } else {
                this.keys[code] = pressed || kbPressed;
            }
        }

        // D-pad
        for (let idx = 0; idx < gp.buttons.length; idx++) {
            const code = keyBindings.getDpadBinding(idx);
            if (!code) continue;
            if (gp.buttons[idx] && gp.buttons[idx].pressed) {
                this.keys[code] = true;
            }
        }
    }

    isPressed(code) { return !!this.keys[code]; }
    wasPressed(code) { return !!this.keys[code] && !this.prevKeys[code]; }
    wasReleased(code) { return !this.keys[code] && !!this.prevKeys[code]; }
    consumeKey(code) {
        this.prevKeys[code] = true;
    }

    setKeyboardInput(inputManager) {
        this._keyboard = inputManager;
    }
    isMouse2Pressed() { return this.mouse2Down; }
    wasMouse2Pressed() { return this.mouse2Down && !this.prevMouse2Down; }
    wasMouse2Released() { return !this.mouse2Down && !!this.prevMouse2Down; }

    consumeMouse() {
        const d = { x: this.mouse.dx, y: this.mouse.dy };
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        return d;
    }

    rumble(intensity, duration, delay = 0) {
        if (window.settingsStore && window.settingsStore.hapticsEnabled === false) return;
        const gp = this._getGamepad();
        if (gp && gp.vibrationActuator) {
            gp.vibrationActuator.playEffect('dual-rumble', {
                startDelay: delay,
                duration: Math.max(10, duration * 1000),
                weakMagnitude: intensity,
                strongMagnitude: intensity
            }).catch(() => {});
        }
    }

    /** Stub for adaptive trigger resistance (PS5 DualSense via WebHID) */
    async setTriggerResistance(left, right) {
        // Future: navigator.hid.requestDevice() + DualSense HID report
        // For now, no-op with debug logging in dev mode
        if (window.__DEV__ && left > 0) {
            console.log('[GamepadController] Adaptive trigger stub:', { left, right });
        }
    }

    _getGamepad() {
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        if (this._activeIndex >= 0) {
            const gp = pads[this._activeIndex];
            if (gp) return gp;
        }
        for (const pad of pads) {
            if (pad) {
                this._activeIndex = pad.index;
                this._lastId = pad.id;
                return pad;
            }
        }
        return null;
    }
}
