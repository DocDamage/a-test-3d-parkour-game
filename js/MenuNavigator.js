/**
 * MenuNavigator — gamepad/keyboard focus navigation for UI panels.
 */
export class MenuNavigator {
    constructor() {
        this.focusIndex = -1;
        this.focusables = [];
        this.currentPanel = null;
        this._prevPanel = null;
    }

    update(activeInput) {
        const panel = this._getOpenPanel();
        if (!panel) {
            if (this.currentPanel) {
                this._clearFocus();
                this.currentPanel = null;
                this.focusables = [];
                this.focusIndex = -1;
            }
            return;
        }

        if (this.currentPanel !== panel) {
            this.currentPanel = panel;
            this._buildFocusables(panel);
            this.focusIndex = this.focusables.length > 0 ? 0 : -1;
            this._applyFocus();
        }

        let consumed = false;

        if (activeInput.wasPressed('ArrowUp') || activeInput.wasPressed('KeyW')) {
            this._moveFocus(-1);
            consumed = true;
        } else if (activeInput.wasPressed('ArrowDown') || activeInput.wasPressed('KeyS')) {
            this._moveFocus(1);
            consumed = true;
        } else if (activeInput.wasPressed('Enter') || activeInput.wasPressed('Space')) {
            this._activate();
            consumed = true;
        } else if (activeInput.wasPressed('Escape')) {
            // Close the panel
            panel.style.display = 'none';
            this._clearFocus();
            this.currentPanel = null;
            consumed = true;
        }

        if (consumed) {
            // Consume all navigation keys so they don't leak to gameplay
            ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
             'KeyW', 'KeyA', 'KeyS', 'KeyD',
             'Enter', 'Space', 'Escape'].forEach(code => {
                if (activeInput.consumeKey) activeInput.consumeKey(code);
            });
        }
    }

    _getOpenPanel() {
        const ids = [
            'pause-menu', 'settings-panel', 'keybindings-panel',
            'inventory-panel', 'stash-panel', 'character-panel',
            'gear-panel', 'companion-panel', 'faction-panel',
            'safehouse-panel', 'bounty-panel', 'codex-panel',
            'mastery-panel', 'implants-panel', 'rift-result-overlay'
        ];
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el && el.style.display !== 'none' && window.getComputedStyle(el).display !== 'none') {
                return el;
            }
        }
        return null;
    }

    _buildFocusables(panel) {
        this.focusables = Array.from(panel.querySelectorAll(
            'button, [role="button"], input[type="checkbox"], input[type="range"], select, a'
        )).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
        });
    }

    _moveFocus(dir) {
        if (this.focusables.length === 0) return;
        this._clearFocus();
        this.focusIndex += dir;
        if (this.focusIndex < 0) this.focusIndex = this.focusables.length - 1;
        if (this.focusIndex >= this.focusables.length) this.focusIndex = 0;
        this._applyFocus();
    }

    _applyFocus() {
        const el = this.focusables[this.focusIndex];
        if (!el) return;
        el.classList.add('menu-focus');
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    _clearFocus() {
        this.focusables.forEach(el => el.classList.remove('menu-focus'));
    }

    _activate() {
        const el = this.focusables[this.focusIndex];
        if (!el) return;
        if (el.tagName === 'INPUT' && el.type === 'checkbox') {
            el.checked = !el.checked;
            el.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (el.tagName === 'INPUT' && el.type === 'range') {
            // For sliders, left/right arrows could adjust value, but Enter doesn't do much
            // Just trigger a click if there's an associated handler
            el.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            el.click();
        }
    }
}
