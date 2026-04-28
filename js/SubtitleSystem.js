/**
 * SubtitleSystem — closed captions for all gameplay audio events.
 * Hooks into AudioManager and combat events. Supports speaker names, positioning, and sizing.
 */

export class SubtitleSystem {
    constructor() {
        this.enabled = false;
        this.size = 'medium'; // small, medium, large
        this.background = true;
        this._queue = [];
        this._active = [];
        this._container = null;
        this._nextId = 1;
        this._maxLines = 3;
        this._buildUI();
    }

    setEnabled(v) { this.enabled = !!v; this._updateVisibility(); }
    setSize(v) { this.size = v; this._updateStyles(); }
    setBackground(v) { this.background = !!v; this._updateStyles(); }

    show(text, options = {}) {
        if (!this.enabled) return;
        const entry = {
            id: this._nextId++,
            text,
            speaker: options.speaker || null,
            duration: options.duration || Math.max(2.0, text.length * 0.06),
            priority: options.priority || 0,
            position: options.position || null, // 'top', 'bottom', 'center'
            timer: 0,
        };
        this._queue.push(entry);
        this._queue.sort((a, b) => b.priority - a.priority);
        this._pruneQueue();
        this._render();
    }

    showFromAudio(eventName, options = {}) {
        const captions = AUDIO_CAPTIONS[eventName];
        if (!captions) return;
        const text = typeof captions === 'string' ? captions : captions.text;
        const speaker = typeof captions === 'object' ? captions.speaker : null;
        this.show(text, { speaker: speaker || options.speaker, ...options });
    }

    update(dt) {
        if (!this.enabled) return;
        for (const entry of this._active) {
            entry.timer += dt;
        }
        this._active = this._active.filter(e => e.timer < e.duration);
        this._pruneQueue();
        this._render();
    }

    _pruneQueue() {
        const room = Math.max(0, this._maxLines - this._active.length);
        while (this._queue.length > 0 && this._active.length < this._maxLines) {
            const next = this._queue.shift();
            this._active.push(next);
        }
        if (this._queue.length > 20) this._queue.length = 20;
    }

    _buildUI() {
        if (this._container) return;
        const el = document.createElement('div');
        el.id = 'subtitle-container';
        el.setAttribute('role', 'log');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'false');
        el.style.cssText =
            'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
            'z-index:90;display:none;flex-direction:column;align-items:center;' +
            'gap:4px;pointer-events:none;max-width:80vw;';
        document.body.appendChild(el);
        this._container = el;
    }

    _updateVisibility() {
        if (!this._container) return;
        this._container.style.display = this.enabled ? 'flex' : 'none';
    }

    _updateStyles() {
        if (!this._container) return;
        const sizes = { small: '13px', medium: '16px', large: '20px' };
        this._container.style.fontSize = sizes[this.size] || sizes.medium;
        this._container.style.fontFamily = 'Segoe UI, sans-serif';
    }

    _render() {
        if (!this._container) return;
        this._container.innerHTML = '';
        for (const entry of this._active) {
            const line = document.createElement('div');
            line.className = 'subtitle-line';
            const bg = this.background ? 'rgba(0,0,0,0.75)' : 'transparent';
            line.style.cssText =
                `background:${bg};color:#fff;padding:3px 10px;border-radius:4px;` +
                `text-align:center;line-height:1.4;text-shadow:0 1px 3px rgba(0,0,0,0.9);`;
            if (entry.speaker) {
                const speaker = document.createElement('span');
                speaker.style.cssText = 'color:#ffaa00;font-weight:bold;margin-right:6px;';
                speaker.textContent = entry.speaker + ':';
                line.appendChild(speaker);
            }
            const text = document.createElement('span');
            text.textContent = entry.text;
            line.appendChild(text);
            this._container.appendChild(line);
        }
    }
}

// Map known audio events to caption text
const AUDIO_CAPTIONS = {
    'heavy_swing': '[Heavy swing]',
    'light_swing': '[Light swing]',
    'hit_stop': '[Impact]',
    'weapon_fire': { text: '[Gunshot]', speaker: null },
    'explosion': { text: '[Explosion]', speaker: null },
    'death_generic': '[Enemy eliminated]',
    'ambience_drone': { text: '[Low hum]', speaker: null },
    'footstep_concrete': '[Footsteps]',
    'footstep_metal': '[Metallic footsteps]',
    'grapple_fire': '[Grapple launch]',
    'grapple_attach': '[Grapple attach]',
    'zip_line': '[Zipline]',
    'drone_alert': { text: '[Drone alert siren]', speaker: 'Drone' },
    'boss_roar': { text: '[Roar]', speaker: 'Boss' },
    'level_up': 'Level Up!',
    'shield_break': '[Shield breaks]',
    'door_open': '[Door opens]',
    'chest_open': '[Chest opens]',
    'teleport': '[Teleport]',
};
