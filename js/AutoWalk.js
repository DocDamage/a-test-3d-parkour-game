/**
 * AutoWalk — double-tap W to toggle auto-forward.
 */

export class AutoWalk {
    constructor() {
        this.enabled = false;
        this._tapCount = 0;
        this._tapWindow = 0.3;
        this._tapTimer = 0;
        this._lastW = false;
    }

    update(dt, input) {
        const w = input.isPressed('KeyW');
        if (w && !this._lastW) {
            this._tapCount++;
            this._tapTimer = this._tapWindow;
            if (this._tapCount >= 2) {
                this.enabled = !this.enabled;
                this._tapCount = 0;
                if (window.__DEV__) console.log('[AutoWalk]', this.enabled ? 'ON' : 'OFF');
            }
        }
        if (this._tapTimer > 0) {
            this._tapTimer -= dt;
            if (this._tapTimer <= 0) this._tapCount = 0;
        }
        this._lastW = w;

        // Inject into input if active
        if (this.enabled) {
            input.keys['KeyW'] = true;
        }
    }

    cancel() {
        this.enabled = false;
    }
}
