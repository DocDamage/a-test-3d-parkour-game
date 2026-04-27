/**
 * HeartContainerSystem — Zelda-style heart container health UI
 *
 * Replaces the numeric health bar with discrete heart containers.
 * Each heart = HP_PER_HEART hit points. Players start with STARTING_HEARTS
 * and earn more by defeating dungeon bosses or collecting 4 heart pieces.
 *
 * Integration:
 *   - Syncs player.maxHealth / player.health on every heart change.
 *   - Call renderHearts(containerId) each frame to update the DOM.
 *   - Call addHeartContainer() on boss defeat.
 *   - Call addHeartPiece() on heart-piece collectible pickup.
 */

export class HeartContainerSystem {
    constructor(player) {
        this.player = player;

        this.HP_PER_HEART = 4;
        this.STARTING_HEARTS = 3;
        this.MAX_HEARTS = 20;

        this.hearts = this.STARTING_HEARTS;
        this.heartPieces = 0; // 0-3; 4 pieces → new heart container

        // Fairy bottle: stored fairy auto-revives on death
        this.storedFairy = false;

        this._syncPlayerHealth(true);

        // Hook player death to check fairy
        const origDie = this.player.die ? this.player.die.bind(this.player) : null;
        if (origDie) {
            this.player.die = () => {
                if (this.storedFairy) {
                    this.storedFairy = false;
                    this.player.health = Math.ceil(this.player.maxHealth * 0.5);
                    this.player.isDead = false;
                    this._showFairyRevive();
                    return;
                }
                origDie();
            };
        }
    }

    // ─── Sync ──────────────────────────────────────────────────────────────

    /** Syncs player.maxHealth. Optionally also restores health to full. */
    _syncPlayerHealth(restoreFull = false) {
        this.player.maxHealth = this.hearts * this.HP_PER_HEART;
        if (restoreFull) {
            this.player.health = this.player.maxHealth;
        } else {
            // Don't exceed new max
            this.player.health = Math.min(this.player.health, this.player.maxHealth);
        }
    }

    // ─── Heart Containers ──────────────────────────────────────────────────

    /** Add a full heart container (from boss defeat). Returns true if added. */
    addHeartContainer() {
        if (this.hearts >= this.MAX_HEARTS) return false;
        this.hearts++;
        this._syncPlayerHealth(false);
        // Award the new heart as current HP
        this.player.health = Math.min(
            this.player.health + this.HP_PER_HEART,
            this.player.maxHealth
        );
        this._spawnNotification('Heart Container +1', '#ff4444');
        return true;
    }

    /** Add a heart piece. Returns 'container' if completed, 'piece' otherwise. */
    addHeartPiece() {
        this.heartPieces++;
        this._spawnNotification('Heart Piece', '#ff8888');
        if (this.heartPieces >= 4) {
            this.heartPieces -= 4;
            this.addHeartContainer();
            return 'container';
        }
        return 'piece';
    }

    // ─── Healing ──────────────────────────────────────────────────────────

    /** Restore full health (fairy / red potion). */
    healFull() {
        this.player.health = this.player.maxHealth;
    }

    /** Restore N hearts of health (green potion = 0.5 hearts, etc.). */
    healHearts(count) {
        this.player.health = Math.min(
            this.player.health + count * this.HP_PER_HEART,
            this.player.maxHealth
        );
    }

    /** Store a fairy for auto-revive on death. */
    captureFairy() {
        this.storedFairy = true;
        this._spawnNotification('Fairy captured!', '#aaffaa');
    }

    // ─── DOM Rendering ─────────────────────────────────────────────────────

    /**
     * Renders heart containers into the given DOM element.
     * Call every frame (cheap DOM diff via className changes).
     */
    renderHearts(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { hearts, heartPieces, HP_PER_HEART } = this;
        const currentHP = this.player.health;

        // Build or reuse heart divs
        while (container.children.length < hearts + 1) {
            container.appendChild(document.createElement('div'));
        }
        while (container.children.length > hearts + 1) {
            container.removeChild(container.lastChild);
        }

        for (let i = 0; i < hearts; i++) {
            const heartHP = Math.max(0, Math.min(HP_PER_HEART, currentHP - i * HP_PER_HEART));
            const pct = heartHP / HP_PER_HEART;
            const el = container.children[i];
            el.className = 'zelda-heart ' + this._heartClass(pct);
        }

        // Piece indicator (last child)
        const pieceEl = container.children[hearts];
        pieceEl.className = 'heart-pieces-row';
        pieceEl.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const p = document.createElement('div');
            p.className = i < heartPieces ? 'heart-piece filled' : 'heart-piece';
            pieceEl.appendChild(p);
        }
    }

    _heartClass(pct) {
        if (pct >= 1.00) return 'full';
        if (pct >= 0.75) return 'three-quarter';
        if (pct >= 0.50) return 'half';
        if (pct >= 0.25) return 'quarter';
        return 'empty';
    }

    // ─── Fairy revive flash ────────────────────────────────────────────────

    _showFairyRevive() {
        const flash = document.createElement('div');
        flash.style.cssText = [
            'position:fixed;top:0;left:0;right:0;bottom:0;',
            'background:rgba(0,255,100,0.35);',
            'pointer-events:none;z-index:200;',
            'transition:opacity 1.2s;',
        ].join('');
        document.body.appendChild(flash);
        requestAnimationFrame(() => { flash.style.opacity = '0'; });
        setTimeout(() => flash.remove(), 1300);

        this._spawnNotification('A fairy saved you!', '#aaffaa');
    }

    // ─── Notification helper ───────────────────────────────────────────────

    _spawnNotification(text, color = '#ffffff') {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.cssText = [
            'position:fixed;top:80px;left:50%;transform:translateX(-50%);',
            `color:${color};font-size:20px;font-weight:bold;`,
            'text-shadow:0 2px 8px rgba(0,0,0,0.9);',
            'pointer-events:none;z-index:150;',
            'transition:opacity 1s, top 1s;',
        ].join('');
        document.body.appendChild(el);
        requestAnimationFrame(() => {
            el.style.top = '60px';
            setTimeout(() => { el.style.opacity = '0'; }, 1500);
            setTimeout(() => el.remove(), 2600);
        });
    }

    // ─── Accessors ─────────────────────────────────────────────────────────

    getHeartCount() { return this.hearts; }
    getHeartPieceCount() { return this.heartPieces; }
    hasFairy() { return this.storedFairy; }
}
