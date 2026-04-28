import { keyBindings } from './KeyBindings.js';

export function wireKeybindings(gamepad) {
    const panel = document.getElementById('keybindings-panel');
    const list = document.getElementById('keybindings-list');
    const resetBtn = document.getElementById('keybindings-reset');
    const closeBtn = document.getElementById('keybindings-close');
    let listeningAction = null;
    let listeningType = null; // 'keyboard' or 'gamepad'

    function render() {
        if (!list) return;
        list.innerHTML = '';
        const all = keyBindings.getAllBindings();
        for (const item of all) {
            const row = document.createElement('div');
            row.className = 'kb-row';
            const label = document.createElement('span');
            label.className = 'kb-label';
            label.textContent = item.label;
            const keyBtn = document.createElement('button');
            keyBtn.className = 'kb-bind';
            keyBtn.textContent = item.keyboard || '—';
            keyBtn.dataset.action = item.action;
            keyBtn.dataset.type = 'keyboard';
            keyBtn.addEventListener('click', () => startListen(item.action, 'keyboard'));
            const gpBtn = document.createElement('button');
            gpBtn.className = 'kb-bind';
            gpBtn.textContent = item.gamepad !== null ? item.gamepad : '—';
            gpBtn.dataset.action = item.action;
            gpBtn.dataset.type = 'gamepad';
            gpBtn.addEventListener('click', () => startListen(item.action, 'gamepad'));
            row.appendChild(label);
            row.appendChild(keyBtn);
            row.appendChild(gpBtn);
            list.appendChild(row);
        }
    }

    function startListen(action, type) {
        listeningAction = action;
        listeningType = type;
        document.querySelectorAll('.kb-bind').forEach(b => b.classList.remove('listening'));
        const btn = document.querySelector(`.kb-bind[data-action="${action}"][data-type="${type}"]`);
        if (btn) {
            btn.classList.add('listening');
            btn.textContent = 'Press key/button...';
        }
    }

    function stopListen() {
        listeningAction = null;
        listeningType = null;
        render();
    }

    document.addEventListener('keydown', (e) => {
        if (!listeningAction || listeningType !== 'keyboard') return;
        e.preventDefault();
        if (e.code === 'Escape') {
            stopListen();
            return;
        }
        // Find the default virtual code for this action
        const virtualCode = keyBindings.getBinding(listeningAction);
        if (virtualCode) {
            keyBindings.setKeyboardBinding(e.code, virtualCode);
        }
        stopListen();
    });

    function checkGamepad() {
        if (!listeningAction || listeningType !== 'gamepad') return;
        const gp = gamepad && gamepad._getGamepad ? gamepad._getGamepad() : null;
        if (!gp) return;
        for (let i = 0; i < gp.buttons.length; i++) {
            if (gp.buttons[i] && gp.buttons[i].pressed) {
                const virtualCode = keyBindings.getBinding(listeningAction);
                if (virtualCode) {
                    keyBindings.setGamepadBinding(i, virtualCode);
                }
                stopListen();
                return;
            }
        }
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset all key bindings to defaults?')) {
                keyBindings.resetToDefaults();
                render();
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (panel) panel.style.display = 'none';
            stopListen();
        });
    }

    const openBtn = document.getElementById('btn-keybindings');
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            if (panel) {
                panel.style.display = 'block';
                render();
            }
        });
    }

    const pauseKeyBtn = document.getElementById('pause-keybindings');
    if (pauseKeyBtn) {
        pauseKeyBtn.addEventListener('click', () => {
            if (panel) {
                panel.style.display = 'block';
                render();
            }
        });
    }

    return checkGamepad;
}
