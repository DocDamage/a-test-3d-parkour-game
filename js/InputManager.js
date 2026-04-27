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
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.pointerLocked) {
                this.mouse.dx += e.movementX;
                this.mouse.dy += e.movementY;
            }
        });
        
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouseDown = true;
                this.keys['Mouse1'] = true;
            } else if (e.button === 2) {
                this.mouse2Down = true;
                this.keys['Mouse2'] = true;
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouseDown = false;
                this.keys['Mouse1'] = false;
            } else if (e.button === 2) {
                this.mouse2Down = false;
                this.keys['Mouse2'] = false;
            }
        });
        
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
    
    consumeMouse() {
        const d = { x: this.mouse.dx, y: this.mouse.dy };
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        return d;
    }
}
