/**
 * BottleSystem — Zelda-style 4-slot bottle inventory
 * Keys: 6, 7, 8, 9 (Digit6–9; Digit1–4 are taken by SpeedrunILs)
 */
export class BottleSystem {
    constructor(player, heartSystem, resourceSystem) {
        this.player = player;
        this.heartSystem = heartSystem;
        this.resourceSystem = resourceSystem;

        this.bottles = ['health_potion', 'empty', 'empty', 'empty']; // slot 0 demo
        this.activeSlot = 0;

        this._keys   = ['Digit6', 'Digit7', 'Digit8', 'Digit9'];
        this._labels = ['6', '7', '8', '9'];
        this._emojis = { empty: '🍶', health_potion: '❤️', magic_potion: '💙', fairy: '🧚' };

        this._container = null;
        this._slots = [];
        this._buildHUD();
    }

    // ─── HUD ───────────────────────────────────────────────────────────────

    _buildHUD() {
        this._container = document.createElement('div');
        this._container.id = 'bottle-hud';
        Object.assign(this._container.style, {
            position: 'fixed', bottom: '60px', right: '16px',
            display: 'flex', gap: '6px',
            zIndex: '100', pointerEvents: 'none'
        });

        for (let i = 0; i < 4; i++) {
            const wrap = document.createElement('div');
            Object.assign(wrap.style, {
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '2px'
            });

            const icon = document.createElement('div');
            Object.assign(icon.style, {
                width: '32px', height: '32px',
                background: 'rgba(0,0,0,0.65)',
                border: '2px solid #555',
                borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', lineHeight: '1', userSelect: 'none'
            });

            const label = document.createElement('div');
            label.textContent = this._labels[i];
            Object.assign(label.style, {
                color: '#aaa', fontSize: '10px', fontFamily: 'monospace'
            });

            wrap.appendChild(icon);
            wrap.appendChild(label);
            this._container.appendChild(wrap);
            this._slots.push({ icon });
        }

        document.body.appendChild(this._container);
        this.renderHUD();
    }

    renderHUD() {
        for (let i = 0; i < 4; i++) {
            const { icon } = this._slots[i];
            icon.textContent = this._emojis[this.bottles[i]] ?? '🍶';
            icon.style.borderColor = (i === this.activeSlot) ? 'gold' : '#555';
        }
    }

    // ─── API ───────────────────────────────────────────────────────────────

    fillBottle(slot, contents) {
        if (slot < 0 || slot > 3) return;
        this.bottles[slot] = contents;
        this.renderHUD();
    }

    getBottle(slot) {
        return this.bottles[slot] ?? 'empty';
    }

    useBottle(slot) {
        const contents = this.bottles[slot];
        if (contents === 'empty') {
            this._notify('Nothing in this bottle!');
            return false;
        }

        switch (contents) {
            case 'health_potion':
                this.heartSystem?.healHearts(3);
                break;
            case 'magic_potion':
                if (this.resourceSystem) {
                    this.resourceSystem.current = this.resourceSystem.max;
                } else {
                    this.player.health = Math.min(
                        this.player.health + 20, this.player.maxHealth
                    );
                }
                break;
            case 'fairy':
                if (this.heartSystem) this.heartSystem.storedFairy = true;
                break;
        }

        this.bottles[slot] = 'empty';
        this.renderHUD();
        return true;
    }

    // ─── Update ────────────────────────────────────────────────────────────

    update(dt, activeInput) {
        for (let i = 0; i < 4; i++) {
            if (activeInput.wasPressed(this._keys[i])) {
                this.activeSlot = i;
                this.renderHUD();
                this.useBottle(i);
                break;
            }
        }
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    _notify(msg) {
        const el = document.createElement('div');
        el.textContent = msg;
        Object.assign(el.style, {
            position: 'fixed', bottom: '140px', right: '16px',
            background: 'rgba(0,0,0,0.75)', color: '#fff',
            padding: '6px 12px', borderRadius: '4px',
            fontFamily: 'monospace', fontSize: '13px',
            zIndex: '200', pointerEvents: 'none'
        });
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
    }

    dispose() {
        this._container?.remove();
        this._container = null;
    }
}
