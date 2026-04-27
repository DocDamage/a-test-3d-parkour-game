/**
 * StaminaSystem — regenerating resource that gates sprint, dash, attacks, block, and parry.
 *
 * Integration:
 *   const stamina = new StaminaSystem(player);
 *   stamina.update(dt, player);          // regen + sprint drain
 *   if (stamina.canSpend(15)) { ... }    // check before action
 *   stamina.spend(15);                   // deduct cost
 */

export class StaminaSystem {
    constructor(player) {
        this.maxStamina = 100;
        this.stamina = 100;

        // Regen rates
        this.regenGrounded = 20;   // per second
        this.regenAirborne = 10;   // per second

        // Costs
        this.costs = {
            sprint: 5,        // per second
            airDash: 15,
            block: 10,        // per second
            lightAttack: 10,
            heavyAttack: 25,
            parry: 5,
            grapple: 10,
            vault: 5,
            wallRun: 3,       // per second
            slide: 2,         // per second
        };

        this._barEl = null;
        this._buildUI();
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                        */
    /* ------------------------------------------------------------------ */

    canSpend(amount) {
        return this.stamina >= amount;
    }

    spend(amount) {
        this.stamina = Math.max(0, this.stamina - amount);
        this._updateUI();
    }

    /** Replenish stamina (e.g., stamina pickup, rest checkpoint). */
    restore(amount) {
        this.stamina = Math.min(this.maxStamina, this.stamina + amount);
        this._updateUI();
    }

    /** Per-frame update: regen + ongoing drains (sprint, block, wallrun). */
    update(dt, player) {
        const grounded = player && player.grounded;
        const isSprinting = player && player.state === 'SPRINT';
        const isBlocking = player && player.state === 'BLOCK';
        const isWallRunning = player && player.state === 'WALLRUN';
        const isSliding = player && player.state === 'SLIDE';

        // Base regen
        let rate = grounded ? this.regenGrounded : this.regenAirborne;

        // Ongoing drains subtract from regen rate
        if (isSprinting) rate -= this.costs.sprint;
        if (isBlocking) rate -= this.costs.block;
        if (isWallRunning) rate -= this.costs.wallRun;
        if (isSliding) rate -= this.costs.slide;

        // Apply
        if (rate > 0) {
            this.stamina = Math.min(this.maxStamina, this.stamina + rate * dt);
        } else if (rate < 0) {
            this.stamina = Math.max(0, this.stamina + rate * dt);
        }

        // If stamina hits 0 while sprinting, force walk
        if (this.stamina <= 0 && isSprinting && player) {
            player.wasSprinting = false;
        }

        this._updateUI();
    }

    /* ------------------------------------------------------------------ */
    /*  UI                                                                */
    /* ------------------------------------------------------------------ */

    _buildUI() {
        const container = document.getElementById('ui');
        if (!container) return;

        const wrap = document.createElement('div');
        wrap.id = 'stamina-bar-wrap';
        wrap.style.cssText =
            'position:absolute;bottom:68px;left:50%;transform:translateX(-50%);' +
            'width:220px;height:10px;background:rgba(0,0,0,0.5);' +
            'border:1px solid rgba(255,255,255,0.2);border-radius:3px;' +
            'overflow:hidden;z-index:10;';

        const fill = document.createElement('div');
        fill.id = 'stamina-bar-fill';
        fill.style.cssText =
            'width:100%;height:100%;background:linear-gradient(90deg,#44ff88,#22cc66);' +
            'transition:width 0.1s linear;';
        wrap.appendChild(fill);

        const label = document.createElement('div');
        label.id = 'stamina-bar-label';
        label.style.cssText =
            'position:absolute;top:-14px;left:0;width:100%;text-align:center;' +
            'font-family:monospace;font-size:10px;color:#aaa;letter-spacing:1px;';
        label.textContent = 'STAMINA';
        wrap.appendChild(label);

        container.appendChild(wrap);
        this._barEl = fill;
    }

    _updateUI() {
        if (!this._barEl) return;
        const pct = this.maxStamina > 0 ? (this.stamina / this.maxStamina) * 100 : 0;
        this._barEl.style.width = `${pct}%`;
        // Color shift when low
        if (pct < 20) {
            this._barEl.style.background = 'linear-gradient(90deg,#ff4444,#cc2222)';
        } else if (pct < 50) {
            this._barEl.style.background = 'linear-gradient(90deg,#ffcc00,#cc9900)';
        } else {
            this._barEl.style.background = 'linear-gradient(90deg,#44ff88,#22cc66)';
        }
    }
}
