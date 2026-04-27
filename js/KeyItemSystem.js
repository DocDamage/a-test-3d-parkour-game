/**
 * KeyItemSystem — Zelda-style key item progression
 *
 * Each of the 7 story dungeons contains one key item inside its Big Chest.
 * Abilities that depend on these items start locked. Finding the item in
 * the dungeon permanently unlocks the ability for the rest of the session.
 *
 * Locked abilities:
 *   grappling_hook   → GrapplingHook.startAim() checks player.grapplingHook.locked
 *   magnet_boots     → main.js skips magnetBoots.update() when locked
 *   zipline_kit      → main.js skips ziplines.update() when locked
 *   overclock_module → main.js skips overclock heat-build when locked
 *   wall_hook        → player.extendedClimbEnabled (extended climb timer)
 *   dive_charge      → player.diveChargeEnabled (future water dash)
 *   phase_mirror     → player.phaseMirrorEnabled (light/dark world shift)
 *
 * Integration:
 *   const keyItems = new KeyItemSystem(player);
 *   // On Big Chest open:
 *   keyItems.collectItem('grappling_hook');
 *   // In animate():
 *   if (!keyItems.hasItem('magnet_boots')) { skip magnetBoots.update(); }
 */

export const KEY_ITEMS = {
    grappling_hook: {
        id: 'grappling_hook',
        name: 'Grappling Hook',
        description: 'Fire a cable onto distant surfaces to swing and climb.',
        dungeon: 'underground_tunnel',
        icon: '🪝',
        color: '#ffaa00',
    },
    magnet_boots: {
        id: 'magnet_boots',
        name: 'Magnet Boots',
        description: 'Electromagnetic soles — cling to metal ceilings and walls.',
        dungeon: 'freezer',
        icon: '🥾',
        color: '#00aaff',
    },
    zipline_kit: {
        id: 'zipline_kit',
        name: 'Zipline Kit',
        description: 'Deploy personal ziplines across wide gaps.',
        dungeon: 'server_room',
        icon: '🔗',
        color: '#00ffaa',
    },
    dive_charge: {
        id: 'dive_charge',
        name: 'Hydro Charger',
        description: 'Charge through water and liquid hazards at speed.',
        dungeon: 'water_treatment',
        icon: '💧',
        color: '#4466ff',
    },
    wall_hook: {
        id: 'wall_hook',
        name: 'Wall Hook',
        description: 'Anchor-spikes for extended wall climbs without slipping.',
        dungeon: 'vertical_shaft',
        icon: '⚓',
        color: '#ff8844',
    },
    overclock_module: {
        id: 'overclock_module',
        name: 'Overclock Module',
        description: 'Overcharge your exosuit for a burst of time dilation.',
        dungeon: 'hangar_bay',
        icon: '⚡',
        color: '#ffff44',
    },
    phase_mirror: {
        id: 'phase_mirror',
        name: 'Phase Mirror',
        description: 'Shift between the clean and corrupted versions of the warehouse.',
        dungeon: 'rooftop',
        icon: '🪞',
        color: '#cc44ff',
    },
};

export class KeyItemSystem {
    constructor(player) {
        this.player = player;
        this.collected = new Set();

        // Apply starting restrictions — abilities locked until found
        this._applyStartingRestrictions();
    }

    // ─── Startup ───────────────────────────────────────────────────────────

    _applyStartingRestrictions() {
        // Grappling hook: locked via GrapplingHook.locked property
        if (this.player.grapplingHook) {
            this.player.grapplingHook.locked = true;
        }
        // Other flags polled by main.js or sub-systems
        this.player.magnetBootsUnlocked = false;
        this.player.ziplineKitUnlocked = false;
        this.player.overclockUnlocked = false;
        this.player.extendedClimbEnabled = false;
        this.player.diveChargeEnabled = false;
        this.player.phaseMirrorEnabled = false;
    }

    // ─── Collection ────────────────────────────────────────────────────────

    /**
     * Collect a key item by id. Returns false if already owned.
     * Fires the corresponding ability unlock.
     */
    collectItem(id) {
        if (this.collected.has(id)) return false;
        this.collected.add(id);
        this._applyItemEffect(id);
        this._spawnCollectNotification(id);
        return true;
    }

    _applyItemEffect(id) {
        switch (id) {
            case 'grappling_hook':
                if (this.player.grapplingHook) this.player.grapplingHook.locked = false;
                break;
            case 'magnet_boots':
                this.player.magnetBootsUnlocked = true;
                break;
            case 'zipline_kit':
                this.player.ziplineKitUnlocked = true;
                break;
            case 'overclock_module':
                this.player.overclockUnlocked = true;
                break;
            case 'wall_hook':
                this.player.extendedClimbEnabled = true;
                // Double the climb height allowance
                this.player.CLIMB_HEIGHT = (this.player.CLIMB_HEIGHT || 5) * 2;
                break;
            case 'dive_charge':
                this.player.diveChargeEnabled = true;
                break;
            case 'phase_mirror':
                this.player.phaseMirrorEnabled = true;
                break;
        }
    }

    // ─── Queries ───────────────────────────────────────────────────────────

    hasItem(id) {
        return this.collected.has(id);
    }

    getCollectedCount() {
        return this.collected.size;
    }

    /** Returns all KEY_ITEMS with a `collected` flag. */
    getAllItems() {
        return Object.values(KEY_ITEMS).map(item => ({
            ...item,
            collected: this.collected.has(item.id),
        }));
    }

    getCollectedItems() {
        return Object.values(KEY_ITEMS).filter(item => this.collected.has(item.id));
    }

    // ─── Notification ──────────────────────────────────────────────────────

    _spawnCollectNotification(id) {
        const def = KEY_ITEMS[id];
        if (!def) return;

        const overlay = document.createElement('div');
        overlay.style.cssText = [
            'position:fixed;top:0;left:0;right:0;bottom:0;',
            'background:rgba(0,0,0,0.7);',
            'display:flex;flex-direction:column;align-items:center;justify-content:center;',
            'pointer-events:none;z-index:300;',
            'transition:opacity 0.5s;',
        ].join('');

        overlay.innerHTML = `
            <div style="font-size:64px;margin-bottom:16px">${def.icon}</div>
            <div style="color:#ffd700;font-size:14px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px">You got a key item!</div>
            <div style="color:${def.color};font-size:28px;font-weight:bold;margin-bottom:8px">${def.name}</div>
            <div style="color:#ccc;font-size:14px;max-width:300px;text-align:center">${def.description}</div>
        `;

        document.body.appendChild(overlay);

        // Hold 2.5 s, then fade out
        setTimeout(() => { overlay.style.opacity = '0'; }, 2500);
        setTimeout(() => overlay.remove(), 3100);
    }
}
