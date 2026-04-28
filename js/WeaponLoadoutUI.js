/**
 * WeaponLoadoutUI — Weapon slot management panel (toggle with N key).
 * Displays equipped slots and the unlocked weapon pool.
 * Player can click a slot button to cycle through pool weapons for that slot.
 */

import { WEAPON_SLOTS } from './WeaponSystem.js';

const SLOT_NAMES = {
    [WEAPON_SLOTS.MELEE]:    'Melee',
    [WEAPON_SLOTS.SIDEARM]:  'Sidearm',
    [WEAPON_SLOTS.PRIMARY]:  'Primary',
    [WEAPON_SLOTS.HEAVY]:    'Heavy',
    [WEAPON_SLOTS.THROWABLE]:'Throwable',
};

export class WeaponLoadoutUI {
    constructor(weaponSystem) {
        this._ws = weaponSystem;
        this._panel = document.getElementById('weapon-loadout-panel');
        this._slotsEl = document.getElementById('loadout-slots');
        this._poolEl = document.getElementById('loadout-pool');
        this._visible = false;

        if (!this._panel) return;
        this._build();
    }

    toggle() {
        this._visible = !this._visible;
        if (this._panel) {
            this._panel.style.display = this._visible ? 'block' : 'none';
            if (this._visible) this._refresh();
        }
    }

    show() {
        this._visible = true;
        if (this._panel) { this._panel.style.display = 'block'; this._refresh(); }
    }

    hide() {
        this._visible = false;
        if (this._panel) this._panel.style.display = 'none';
    }

    _build() {
        // Slot cards
        this._slotsEl.innerHTML = '';
        for (const [slotId, slotName] of Object.entries(SLOT_NAMES)) {
            const card = document.createElement('div');
            card.style.cssText = 'background:rgba(255,255,255,0.05);border:1px solid #444;border-radius:6px;padding:10px;font-family:monospace;';
            card.dataset.slot = slotId;

            const label = document.createElement('div');
            label.style.cssText = 'font-size:11px;color:#888;margin-bottom:4px;';
            label.textContent = slotName;

            const nameEl = document.createElement('div');
            nameEl.style.cssText = 'font-size:14px;color:#fff;font-weight:bold;margin-bottom:6px;';
            nameEl.id = `loadout-slot-name-${slotId}`;
            nameEl.textContent = '— Empty —';

            const swapBtn = document.createElement('button');
            swapBtn.textContent = 'Swap ↕';
            swapBtn.style.cssText = 'font-family:monospace;font-size:11px;padding:3px 8px;cursor:pointer;background:#1a3a3a;color:#00ffcc;border:1px solid #00ffcc;border-radius:3px;';
            swapBtn.addEventListener('click', () => this._cycleSlot(Number(slotId)));

            const clearBtn = document.createElement('button');
            clearBtn.textContent = 'Clear';
            clearBtn.style.cssText = 'font-family:monospace;font-size:11px;padding:3px 8px;cursor:pointer;background:#2a1a1a;color:#ff6666;border:1px solid #ff6666;border-radius:3px;margin-left:6px;';
            clearBtn.addEventListener('click', () => { this._ws.unequip(Number(slotId)); this._refresh(); });

            card.appendChild(label);
            card.appendChild(nameEl);
            card.appendChild(swapBtn);
            card.appendChild(clearBtn);
            this._slotsEl.appendChild(card);
        }
    }

    _refresh() {
        if (!this._slotsEl || !this._poolEl) return;

        // Update slot names
        for (const [slotId, slotName] of Object.entries(SLOT_NAMES)) {
            const el = document.getElementById(`loadout-slot-name-${slotId}`);
            if (!el) continue;
            const w = this._ws.getWeapon(Number(slotId));
            el.textContent = w ? (w.name || w.constructor?.name || 'Weapon') : '— Empty —';
        }

        // Render pool
        this._poolEl.innerHTML = '';
        const pool = this._ws.getUnlocked();
        if (pool.length === 0) {
            const msg = document.createElement('span');
            msg.style.cssText = 'font-family:monospace;font-size:12px;color:#555;';
            msg.textContent = 'No unlocked weapons yet.';
            this._poolEl.appendChild(msg);
            return;
        }
        for (const w of pool) {
            const tag = document.createElement('div');
            tag.style.cssText = 'background:#112;border:1px solid #336;border-radius:4px;padding:5px 10px;font-family:monospace;font-size:12px;color:#adf;cursor:default;';
            tag.textContent = w.name || w.constructor?.name || 'Weapon';
            this._poolEl.appendChild(tag);
        }
    }

    /**
     * Cycle the equipped weapon in a slot to the next available unlocked weapon.
     * If current slot is occupied by a pool weapon, swap it back to pool and equip next.
     */
    _cycleSlot(slotId) {
        const pool = this._ws.getUnlocked();
        if (pool.length === 0) return;

        const current = this._ws.getWeapon(slotId);
        let idx = -1;
        if (current) {
            idx = pool.findIndex(w => w === current || (w.name && w.name === current.name));
        }
        const next = pool[(idx + 1) % pool.length];
        this._ws.equip(next, slotId);
        this._refresh();
    }

    update(dt, activeInput) {
        if (activeInput && activeInput.wasPressed('BracketLeft')) {
            this.toggle();
        }
    }
}
