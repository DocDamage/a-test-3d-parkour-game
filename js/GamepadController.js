import * as THREE from 'three';

/**
 * GamepadController - Modern controller support (Xbox/PS/Switch Pro).
 * Maps to the same API as InputManager for seamless drop-in.
 */
export class GamepadController {
    constructor() {
        this.gamepad = null;
        this.deadZone = 0.15;
        this.rumbleEnabled = true;
        
        // Virtual keyboard state (mirrors InputManager)
        this.keys = {};
        this.prevKeys = {};
        this.mouse = { dx: 0, dy: 0 };
        this.mouseDown = false;
        this.mouse2Down = false;
        this.prevMouseDown = false;
        this.prevMouse2Down = false;
        
        // Button mapping: gamepad button index -> action
        this.buttonMap = {
            0: 'Space',      // A/Cross = Jump
            1: 'KeyC',       // B/Circle = Slide/Crouch
            2: 'KeyQ',       // X/Square = Air Dash
            3: 'KeyE',       // Y/Triangle = Drop/Interact
            4: 'ShiftLeft',  // L1/LB = Sprint
            5: 'KeyF',       // R1/RB = Drone Takedown
            6: 'Mouse2',     // L2/LT = Grapple Aim
            7: 'ShiftQ',     // R2/RT = Overclock (when held with sprint)
            8: 'KeyV',       // Share/Back = Runner Vision
            9: 'KeyP',       // Options/Start = Rising Tide
            10: 'ControlLeft', // L3 = Magnet Boots
            11: 'KeyN',      // R3 = Day/Night
        };
        
        // D-pad
        this.dpadMap = {
            12: { code: 'KeyW', dir: 'up' },
            13: { code: 'KeyS', dir: 'down' },
            14: { code: 'KeyA', dir: 'left' },
            15: { code: 'KeyD', dir: 'right' },
        };
        
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
        
        // Left stick -> WASD
        const lx = gp.axes[0];
        const ly = gp.axes[1];
        this.keys['KeyW'] = ly < -this.deadZone;
        this.keys['KeyS'] = ly > this.deadZone;
        this.keys['KeyA'] = lx < -this.deadZone;
        this.keys['KeyD'] = lx > this.deadZone;
        
        // Right stick -> camera look
        const rx = gp.axes[2];
        const ry = gp.axes[3];
        if (Math.abs(rx) > this.deadZone) this.mouse.dx += rx * 15;
        if (Math.abs(ry) > this.deadZone) this.mouse.dy += ry * 15;
        
        // Buttons
        for (const [idx, code] of Object.entries(this.buttonMap)) {
            const pressed = gp.buttons[idx] && gp.buttons[idx].pressed;
            if (code === 'Mouse2') {
                this.mouse2Down = pressed;
            } else if (code === 'ShiftQ') {
                // R2 as Shift+Q (Overclock / Decoy)
                this.keys['KeyQ'] = pressed;
                this.keys['ShiftLeft'] = pressed;
            } else {
                this.keys[code] = pressed;
            }
        }
        
        // D-pad
        for (const [idx, map] of Object.entries(this.dpadMap)) {
            if (gp.buttons[idx] && gp.buttons[idx].pressed) {
                this.keys[map.code] = true;
            }
        }
        
        // Left stick click = sprint toggle alternative
        if (gp.buttons[10] && gp.buttons[10].pressed) {
            this.keys['ShiftLeft'] = true;
        }
    }
    
    isPressed(code) { return !!this.keys[code]; }
    wasPressed(code) { return !!this.keys[code] && !this.prevKeys[code]; }
    wasReleased(code) { return !this.keys[code] && !!this.prevKeys[code]; }
    isMouse2Pressed() { return this.mouse2Down; }
    wasMouse2Pressed() { return this.mouse2Down && !this.prevMouse2Down; }
    wasMouse2Released() { return !this.mouse2Down && this.prevMouse2Down; }
    
    consumeMouse() {
        const d = { x: this.mouse.dx, y: this.mouse.dy };
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        return d;
    }
    
    rumble(intensity = 0.5, duration = 200) {
        if (!this.rumbleEnabled || !this.gamepad || !this.gamepad.vibrationActuator) return;
        try {
            this.gamepad.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: duration,
                weakMagnitude: intensity * 0.5,
                strongMagnitude: intensity
            });
        } catch (e) {}
    }
    
    _getGamepad() {
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const pad of pads) {
            if (pad) return pad;
        }
        return null;
    }
}
