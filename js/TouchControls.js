/**
 * TouchControls.js — Virtual joystick + action buttons for mobile/tablet play.
 *
 * Maps touch input to InputManager key states so the rest of the game
 * continues to work through the existing keyboard/mouse abstraction.
 */

export class TouchControls {
    /**
     * @param {HTMLElement} canvas — the renderer canvas or document.body
     * @param {InputManager} inputManager — instance of InputManager
     */
    constructor(canvas, inputManager) {
        this.canvas = canvas;
        this.input = inputManager;
        this.enabled = false;

        // Joystick state (left side — movement)
        this.joystick = {
            active: false,
            touchId: null,
            baseX: 0,
            baseY: 0,
            stickX: 0,
            stickY: 0,
            maxRadius: 50, // px the stick can travel from centre
            vector: { x: 0, y: 0 }, // normalized -1..1
        };

        // Look state (right side — camera)
        this.look = {
            active: false,
            touchId: null,
            lastX: 0,
            lastY: 0,
            sensitivity: 0.4, // px → degrees-equivalent sensitivity
        };

        // Button definitions: id → { code, label, position class }
        this.buttons = [
            { id: 'tc-jump',     code: 'Space',   label: '⬆',     posClass: 'tc-pos-jump' },
            { id: 'tc-fire',     code: 'Mouse1',  label: '●',     posClass: 'tc-pos-fire' },
            { id: 'tc-crouch',   code: 'KeyC',    label: '▼',     posClass: 'tc-pos-crouch' },
            { id: 'tc-interact', code: 'KeyF',    label: 'F',     posClass: 'tc-pos-interact' },
            { id: 'tc-dash',     code: 'KeyQ',    label: '⚡',     posClass: 'tc-pos-dash' },
        ];
        this.buttonElements = new Map();
        this.buttonPressed = new Map();

        // DOM root
        this.root = null;
        this.joystickBase = null;
        this.joystickStick = null;

        // Bound handlers (so we can remove them later)
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onTouchCancel = this._onTouchCancel.bind(this);

        this._buildDOM();
    }

    /* ============================================================
       DOM construction
       ============================================================ */

    _buildDOM() {
        // Overlay container
        this.root = document.createElement('div');
        this.root.id = 'touch-controls';
        this.root.className = 'touch-controls';
        this.root.style.display = 'none';

        // Joystick base
        this.joystickBase = document.createElement('div');
        this.joystickBase.className = 'tc-joystick-base';
        this.joystickBase.style.display = 'none';
        this.root.appendChild(this.joystickBase);

        // Joystick stick (nub)
        this.joystickStick = document.createElement('div');
        this.joystickStick.className = 'tc-joystick-stick';
        this.joystickStick.style.display = 'none';
        this.root.appendChild(this.joystickStick);

        // Action buttons
        for (const btn of this.buttons) {
            const el = document.createElement('button');
            el.id = btn.id;
            el.className = `tc-btn ${btn.posClass}`;
            el.textContent = btn.label;
            el.dataset.code = btn.code;
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this._setButton(btn.code, true);
                el.classList.add('pressed');
            }, { passive: false });
            el.addEventListener('touchend', (e) => {
                e.preventDefault();
                this._setButton(btn.code, false);
                el.classList.remove('pressed');
            }, { passive: false });
            el.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this._setButton(btn.code, false);
                el.classList.remove('pressed');
            }, { passive: false });
            this.root.appendChild(el);
            this.buttonElements.set(btn.code, el);
            this.buttonPressed.set(btn.code, false);
        }

        document.body.appendChild(this.root);
    }

    /* ============================================================
       Public API
       ============================================================ */

    setEnabled(enabled) {
        if (this.enabled === enabled) return;
        this.enabled = enabled;
        this.root.style.display = enabled ? 'block' : 'none';

        if (enabled) {
            this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
            this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
            this.canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
            this.canvas.addEventListener('touchcancel', this._onTouchCancel, { passive: false });
        } else {
            this.canvas.removeEventListener('touchstart', this._onTouchStart);
            this.canvas.removeEventListener('touchmove', this._onTouchMove);
            this.canvas.removeEventListener('touchend', this._onTouchEnd);
            this.canvas.removeEventListener('touchcancel', this._onTouchCancel);
            this._releaseAll();
        }
    }

    update() {
        if (!this.enabled) return;
        this._updateVisibility();
    }

    _updateVisibility() {
        const panelIds = ['pause-menu', 'settings-panel', 'keybindings-panel', 'inventory-panel', 'stash-panel', 'character-panel', 'gear-panel', 'companion-panel', 'faction-panel', 'safehouse-panel', 'bounty-panel', 'codex-panel', 'mastery-panel', 'implants-panel', 'rift-result-overlay', 'credits-overlay'];
        const anyOpen = panelIds.some(id => {
            const el = document.getElementById(id);
            return el && el.style.display !== 'none' && window.getComputedStyle(el).display !== 'none';
        });
        const container = document.getElementById('touch-controls');
        if (container) {
            container.style.display = (this.enabled && !anyOpen) ? 'block' : 'none';
        }
    }

    dispose() {
        this.setEnabled(false);
        if (this.root && this.root.parentNode) {
            this.root.parentNode.removeChild(this.root);
        }
        this.root = null;
        this.joystickBase = null;
        this.joystickStick = null;
        this.buttonElements.clear();
        this.buttonPressed.clear();
    }

    /* ============================================================
       Internal helpers
       ============================================================ */

    _releaseAll() {
        // Release joystick keys
        this._setJoystickKeys(0, 0);
        this.joystick.active = false;
        this.joystick.touchId = null;
        this.joystickBase.style.display = 'none';
        this.joystickStick.style.display = 'none';

        // Release look
        this.look.active = false;
        this.look.touchId = null;

        // Release all buttons
        for (const [code, pressed] of this.buttonPressed) {
            if (pressed) this._setButton(code, false);
        }
        for (const el of this.buttonElements.values()) {
            el.classList.remove('pressed');
        }
    }

    _setButton(code, pressed) {
        if (this.buttonPressed.get(code) === pressed) return;
        this.buttonPressed.set(code, pressed);
        if (this.input && typeof this.input.setKey === 'function') {
            this.input.setKey(code, pressed);
        }
    }

    _setJoystickKeys(x, y) {
        // x/y are normalized -1..1
        const deadzone = 0.15;
        const set = (code, active) => {
            if (this.input && typeof this.input.setKey === 'function') {
                const current = !!this.input.keys[code];
                if (current !== active) this.input.setKey(code, active);
            }
        };
        set('KeyW', y < -deadzone);
        set('KeyS', y > deadzone);
        set('KeyA', x < -deadzone);
        set('KeyD', x > deadzone);
    }

    /* ============================================================
       Touch event handlers
       ============================================================ */

    _onTouchStart(e) {
        if (!this.enabled) return;
        const touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const t = touches[i];
            // Ignore touches that land on buttons (they handle themselves)
            if (this._isOnButton(t.target)) continue;

            // Left 40% of screen = joystick zone
            if (t.clientX < window.innerWidth * 0.4) {
                if (!this.joystick.active) {
                    this.joystick.active = true;
                    this.joystick.touchId = t.identifier;
                    this.joystick.baseX = t.clientX;
                    this.joystick.baseY = t.clientY;
                    this.joystick.stickX = t.clientX;
                    this.joystick.stickY = t.clientY;
                    this._updateJoystickVisuals();
                    this.joystickBase.style.display = 'block';
                    this.joystickStick.style.display = 'block';
                }
            } else if (t.clientX > window.innerWidth * 0.5) {
                // Right 50% of screen = look/camera zone
                if (!this.look.active) {
                    this.look.active = true;
                    this.look.touchId = t.identifier;
                    this.look.lastX = t.clientX;
                    this.look.lastY = t.clientY;
                }
            }
        }
    }

    _onTouchMove(e) {
        if (!this.enabled) return;
        e.preventDefault(); // prevent scroll
        const touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const t = touches[i];
            if (this.joystick.active && t.identifier === this.joystick.touchId) {
                const dx = t.clientX - this.joystick.baseX;
                const dy = t.clientY - this.joystick.baseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const clampedDist = Math.min(dist, this.joystick.maxRadius);
                const angle = Math.atan2(dy, dx);
                this.joystick.stickX = this.joystick.baseX + Math.cos(angle) * clampedDist;
                this.joystick.stickY = this.joystick.baseY + Math.sin(angle) * clampedDist;
                this.joystick.vector.x = (Math.cos(angle) * clampedDist) / this.joystick.maxRadius;
                this.joystick.vector.y = (Math.sin(angle) * clampedDist) / this.joystick.maxRadius;
                this._updateJoystickVisuals();
                this._setJoystickKeys(this.joystick.vector.x, this.joystick.vector.y);
            }
            // Camera look — inject delta into InputManager's mouse accumulator
            if (this.look.active && t.identifier === this.look.touchId) {
                const dx = (t.clientX - this.look.lastX) * this.look.sensitivity;
                const dy = (t.clientY - this.look.lastY) * this.look.sensitivity;
                this.look.lastX = t.clientX;
                this.look.lastY = t.clientY;
                if (this.input && typeof this.input.addMouseDelta === 'function') {
                    this.input.addMouseDelta(dx, dy);
                }
            }
        }
    }

    _onTouchEnd(e) {
        if (!this.enabled) return;
        const touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const t = touches[i];
            if (this.joystick.active && t.identifier === this.joystick.touchId) {
                this.joystick.active = false;
                this.joystick.touchId = null;
                this.joystick.vector.x = 0;
                this.joystick.vector.y = 0;
                this._setJoystickKeys(0, 0);
                this.joystickBase.style.display = 'none';
                this.joystickStick.style.display = 'none';
            }
            if (this.look.active && t.identifier === this.look.touchId) {
                this.look.active = false;
                this.look.touchId = null;
            }
        }
    }

    _onTouchCancel(e) {
        this._onTouchEnd(e);
    }

    _isOnButton(el) {
        return el && (el.classList && el.classList.contains('tc-btn'));
    }

    _updateJoystickVisuals() {
        const baseSize = 120;
        const stickSize = 60;
        this.joystickBase.style.left = `${this.joystick.baseX - baseSize / 2}px`;
        this.joystickBase.style.top = `${this.joystick.baseY - baseSize / 2}px`;
        this.joystickStick.style.left = `${this.joystick.stickX - stickSize / 2}px`;
        this.joystickStick.style.top = `${this.joystick.stickY - stickSize / 2}px`;
    }
}
