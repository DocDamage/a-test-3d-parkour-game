/**
 * DirectionalDamageIndicator — shows a red chevron at screen edge
 * pointing toward off-screen attackers when the player takes damage.
 */

export class DirectionalDamageIndicator {
    constructor() {
        this._entries = [];
        this._container = null;
        this._buildUI();
    }

    _buildUI() {
        if (this._container) return;
        const el = document.createElement('div');
        el.id = 'damage-indicator-container';
        el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:85;overflow:hidden;';
        document.body.appendChild(el);
        this._container = el;
    }

    trigger(directionName) {
        const el = document.createElement('div');
        el.className = 'damage-indicator';
        const arrow = this._arrowFor(directionName);
        el.textContent = arrow;
        el.style.cssText = this._positionFor(directionName);
        el.setAttribute('aria-hidden', 'true');
        this._container.appendChild(el);

        const entry = { el, timer: 0, duration: 1.0 };
        this._entries.push(entry);

        // Animate in
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = el.style.transform.replace('scale(0.5)', 'scale(1)');
        });
    }

    update(dt) {
        for (const entry of this._entries) {
            entry.timer += dt;
            const t = entry.timer / entry.duration;
            entry.el.style.opacity = String(1 - t);
        }
        this._entries = this._entries.filter(e => {
            if (e.timer >= e.duration) {
                e.el.remove();
                return false;
            }
            return true;
        });
    }

    clear() {
        for (const e of this._entries) e.el.remove();
        this._entries = [];
    }

    _arrowFor(dir) {
        switch (dir) {
            case 'front': return '▲';
            case 'back': return '▼';
            case 'left': return '◀';
            case 'right': return '▶';
            default: return '◆';
        }
    }

    _positionFor(dir) {
        const base = 'position:absolute;color:#ff2222;font-size:32px;font-weight:bold;text-shadow:0 0 10px rgba(255,0,0,0.8);opacity:0;transform:scale(0.5);transition:opacity 0.15s,transform 0.15s;';
        switch (dir) {
            case 'front': return `${base}top:20px;left:50%;transform:translateX(-50%) scale(0.5);`;
            case 'back': return `${base}bottom:20px;left:50%;transform:translateX(-50%) scale(0.5);`;
            case 'left': return `${base}left:20px;top:50%;transform:translateY(-50%) scale(0.5);`;
            case 'right': return `${base}right:20px;top:50%;transform:translateY(-50%) scale(0.5);`;
            default: return `${base}top:50%;left:50%;transform:translate(-50%,-50%) scale(0.5);`;
        }
    }

    static getDirection(from, to, facing) {
        // from = attacker position, to = player position, facing = player facing angle (radians)
        const dx = from.x - to.x;
        const dz = from.z - to.z;
        const angle = Math.atan2(dx, dz); // angle from player to attacker
        let diff = angle - facing;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        const threshold = Math.PI / 4; // 45 degrees
        if (Math.abs(diff) < threshold) return 'front';
        if (Math.abs(diff) > Math.PI - threshold) return 'back';
        if (diff > 0) return 'right';
        return 'left';
    }
}
