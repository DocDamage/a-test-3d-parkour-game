/**
 * ControllerPrompts — maps abstract actions to controller-specific button glyphs.
 * Detects gamepad type from navigator.getGamepads() and provides CSS class + label.
 */

const PROMPT_SETS = {
    xbox:   { A: 'A', B: 'B', X: 'X', Y: 'Y', LB: 'LB', RB: 'RB', LT: 'LT', RT: 'RT', LS: 'LS', RS: 'RS', Dpad: 'Dpad', Menu: '☰', View: '☷' },
    ps:     { A: 'Cross', B: 'Circle', X: 'Square', Y: 'Triangle', LB: 'L1', RB: 'R1', LT: 'L2', RT: 'R2', LS: 'L3', RS: 'R3', Dpad: 'Dpad', Menu: 'Options', View: 'Create' },
    switch: { A: 'B', B: 'A', X: 'Y', Y: 'X', LB: 'L', RB: 'R', LT: 'ZL', RT: 'ZR', LS: 'L Stick', RS: 'R Stick', Dpad: 'Dpad', Menu: '+', View: '-' },
};

export class ControllerPrompts {
    constructor() {
        this._set = 'xbox';
        this._autoDetect = true;
        this._custom = null;
    }

    detect() {
        if (!this._autoDetect) return this._set;
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const gp of pads) {
            if (!gp) continue;
            const id = (gp.id || '').toLowerCase();
            if (id.includes('playstation') || id.includes('dualsense') || id.includes('dualshock') || id.includes('sony')) {
                return 'ps';
            }
            if (id.includes('nintendo') || id.includes('switch') || id.includes('pro controller')) {
                return 'switch';
            }
            if (id.includes('xbox') || id.includes('microsoft')) {
                return 'xbox';
            }
        }
        return this._set;
    }

    getSet() {
        return this._autoDetect ? this.detect() : this._set;
    }

    setSet(name) {
        this._set = PROMPT_SETS[name] ? name : 'xbox';
        this._autoDetect = (name === 'auto');
    }

    get(action) {
        const setName = this.getSet();
        const set = PROMPT_SETS[setName] || PROMPT_SETS.xbox;
        return set[action] || action;
    }

    getClass() {
        return `prompt-${this.getSet()}`;
    }

    render(action) {
        const setName = this.getSet();
        const label = this.get(action);
        return `<span class="controller-prompt ${this.getClass()}">${label}</span>`;
    }
}

export const controllerPrompts = new ControllerPrompts();
