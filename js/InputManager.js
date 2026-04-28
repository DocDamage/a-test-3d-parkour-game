import { keyBindings } from './KeyBindings.js';

export class InputManager {
    constructor() {
        this.keys = {};
        this.prevKeys = {};
        this.mouse = { dx: 0, dy: 0 };
        this.mouseDown = false;
        this.mouse2Down = false;
        this.prevMouseDown = false;
        this.prevMouse2Down = false;
        this.pointerLocked = false;
        
        this.setupEvents();
    }
    
    setupEvents() {
        document.addEventListener('keydown', (e) => {
            if (['Space','Tab','F1','F12','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code) || (e.ctrlKey && ['KeyS','KeyO','KeyZ'].includes(e.code))) {
                e.preventDefault();
            }
            const virtual = keyBindings.getBindingForPhysicalKey(e.code);
            this.keys[virtual || e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            const virtual = keyBindings.getBindingForPhysicalKey(e.code);
            this.keys[virtual || e.code] = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.pointerLocked) {
                this.mouse.dx += e.movementX;
                this.mouse.dy += e.movementY;
            }
        });
        
        document.addEventListener('mousedown', (e) => {
            const physical = e.button === 0 ? 'Mouse1' : (e.button === 1 ? 'Mouse3' : (e.button === 2 ? 'Mouse2' : null));
            if (!physical) return;
            const virtual = keyBindings.getBindingForPhysicalKey(physical);
            const code = virtual || physical;
            if (e.button === 0) {
                this.mouseDown = true;
                this.keys[code] = true;
            } else if (e.button === 1) {
                this.mouse1Down = true;
                this.keys[code] = true;
            } else if (e.button === 2) {
                this.mouse2Down = true;
                this.keys[code] = true;
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            const physical = e.button === 0 ? 'Mouse1' : (e.button === 1 ? 'Mouse3' : (e.button === 2 ? 'Mouse2' : null));
            if (!physical) return;
            const virtual = keyBindings.getBindingForPhysicalKey(physical);
            const code = virtual || physical;
            if (e.button === 0) {
                this.mouseDown = false;
                this.keys[code] = false;
            } else if (e.button === 1) {
                this.mouse1Down = false;
                this.keys[code] = false;
            } else if (e.button === 2) {
                this.mouse2Down = false;
                this.keys[code] = false;
            }
        });
        
        document.addEventListener('wheel', (e) => {
            const upVirtual = keyBindings.getBindingForPhysicalKey('ScrollUp');
            const downVirtual = keyBindings.getBindingForPhysicalKey('ScrollDown');
            this.keys[upVirtual || 'ScrollUp'] = e.deltaY < 0;
            this.keys[downVirtual || 'ScrollDown'] = e.deltaY > 0;
        }, { passive: true });
        
        // Prevent context menu on right-click so Mouse2 can be used for gameplay
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = !!document.pointerLockElement;
        });
    }
    
    /** Call at the start of each frame to capture edge detection state. */
    preUpdate() {
        this.prevKeys = { ...this.keys };
        this.prevMouseDown = this.mouseDown;
        this.prevMouse2Down = this.mouse2Down;
        const scrollUpVirtual = keyBindings.getBindingForPhysicalKey('ScrollUp') || 'ScrollUp';
        const scrollDownVirtual = keyBindings.getBindingForPhysicalKey('ScrollDown') || 'ScrollDown';
        this.prevKeys[scrollUpVirtual] = this.keys[scrollUpVirtual];
        this.prevKeys[scrollDownVirtual] = this.keys[scrollDownVirtual];
        this.keys[scrollUpVirtual] = false;
        this.keys[scrollDownVirtual] = false;
    }
    
    isPressed(code) {
        return !!this.keys[code];
    }
    
    /** Returns true if the key was pressed this frame (edge detection). */
    wasPressed(code) {
        return !!this.keys[code] && !this.prevKeys[code];
    }
    
    /** Returns true if the key was released this frame (edge detection). */
    wasReleased(code) {
        return !this.keys[code] && !!this.prevKeys[code];
    }
    
    isMouse2Pressed() {
        return this.mouse2Down;
    }
    
    /** Edge detection for Mouse2 press. */
    wasMouse2Pressed() {
        return this.mouse2Down && !this.prevMouse2Down;
    }
    
    /** Edge detection for Mouse2 release. */
    wasMouse2Released() {
        return !this.mouse2Down && this.prevMouse2Down;
    }
    
    consumeKey(code) {
        const pressed = this.wasPressed(code);
        if (pressed) this.prevKeys[code] = true;
        return pressed;
    }
    
    consumeMouse() {
        const d = { x: this.mouse.dx, y: this.mouse.dy };
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        return d;
    }

    /**
     * Programmatically set a key state. Used by TouchControls to inject
     * synthetic keyboard input without mutating internals directly.
     */
    setKey(code, pressed) {
        this.keys[code] = pressed;
    }
    
    dispose() {
        // Remove all listeners if needed for long-lived SPAs
        // Currently listeners are attached to document and leak on hot-reload
    }
}
