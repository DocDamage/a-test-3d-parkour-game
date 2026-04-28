/**
 * GamepadController - Modern controller support (Xbox/PS/Switch Pro).
 * Maps to the same API as InputManager for seamless drop-in.
 */
import { keyBindings } from './KeyBindings.js';

export class GamepadController {
    constructor() {
        this.gamepad = null;
        this.deadZone = 0.15;
        this.rumbleEnabled = true;
        
        // M4: reference to InputManager so keyboard stays active when gamepad is connected
        this._keyboard = null;
        
        // Virtual keyboard state (mirrors InputManager)
        this.keys = {};
        this.prevKeys = {};
        this.mouse = { dx: 0, dy: 0 };
        this.mouseDown = false;
        this.mouse2Down = false;
        this.prevMouseDown = false;
        this.prevMouse2Down = false;
        
        // Default gamepad bindings are now managed by KeyBindings.js
        
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepad = e.gamepad;
        });
        window.addEventListener('gamepaddisconnected', (e) => {
            this.gamepad = null;
        });
    }
    
    preUpdate() {
        this.prevKeys = { ...this.keys };
        this.prevMouseDown = this.mouseDown;
        this.prevMouse2Down = this.mouse2Down;
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        
        const gp = this._getGamepad();
        if (!gp) return;
        
        // Left stick -> WASD (OR with real keyboard state so keyboard always takes priority)
        const lx = gp.axes[0];
        const ly = gp.axes[1];
        const kb = this._keyboard ? this._keyboard.keys : {};
        const kbW = kb['KeyW'];
        const kbA = kb['KeyA'];
        const kbS = kb['KeyS'];
        const kbD = kb['KeyD'];
        this.keys['KeyW'] = kbW || (ly < -this.deadZone);
        this.keys['KeyS'] = kbS || (ly > this.deadZone);
        this.keys['KeyA'] = kbA || (lx < -this.deadZone);
        this.keys['KeyD'] = kbD || (lx > this.deadZone);
        
        // Right stick -> camera look
        const rx = gp.axes[2];
        const ry = gp.axes[3];
        const sens = (window.settingsStore && window.settingsStore.sensitivity) ? window.settingsStore.sensitivity * 6 : 15;
        if (Math.abs(rx) > this.deadZone) this.mouse.dx += rx * sens;
        if (Math.abs(ry) > this.deadZone) this.mouse.dy += ry * sens;
        
        // Buttons
        for (let idx = 0; idx < gp.buttons.length; idx++) {
            const code = keyBindings.getGamepadBinding(idx);
            if (!code) continue;
            const pressed = gp.buttons[idx] && gp.buttons[idx].pressed;
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

    /** M4: call this once after both InputManager and GamepadController are created */
    setKeyboardInput(inputManager) {
        this._keyboard = inputManager;
    }
    isMouse2Pressed() { return this.mouse2Down; }
    wasMouse2Pressed() { return this.mouse2Down && !this.prevMouse2Down; }
    wasMouse2Released() { return !this.mouse2Down && this.prevMouse2Down; }
    
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
    
    _getGamepad() {
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const pad of pads) {
            if (pad) return pad;
        }
        return null;
    }
}
