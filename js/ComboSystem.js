/**
 * ComboSystem tracks consecutive parkour moves to build a Flow Meter.
 * Flow grants speed boosts and visual effects at milestone thresholds.
 */
export class ComboSystem {
    constructor() {
        this.flowMeter = 0;      // 0 - 100
        this.flowLevel = 0;      // 0 - 4
        this.groundedTimer = 0;
        this.chainCount = 0;
        this.lastMoveType = null;
        this.broken = false;
        this.breakFlashTimer = 0;
    }
    
    /**
     * Register a parkour move to extend the chain and fill the Flow Meter.
     * @param {string} moveType — 'jump' | 'vault' | 'climb' | 'wallrun' | 'wallKick' | 'airDash' | 'grappleSwing'
     */
    registerMove(moveType) {
        if (moveType === this.lastMoveType) return;
        
        this.chainCount++;
        this.lastMoveType = moveType;
        this.groundedTimer = 0;
        this.broken = false;
        this.breakFlashTimer = 0;
        
        // Diminishing fill per consecutive move
        const fillAmount = Math.max(4, 18 - this.chainCount * 2);
        this.flowMeter = Math.min(100, this.flowMeter + fillAmount);
        this._updateFlowLevel();
    }
    
    /**
     * Call each frame. Decays meter if grounded too long.
     * @param {number} dt — delta time in seconds
     * @param {boolean} playerGrounded
     */
    update(dt, playerGrounded) {
        if (playerGrounded) {
            this.groundedTimer += dt;
            if (this.groundedTimer > 0.3) {
                this._breakChain();
            }
        } else {
            this.groundedTimer = Math.max(0, this.groundedTimer - dt * 0.5);
        }
        
        // Slow decay while active
        if (this.flowMeter > 0 && this.chainCount > 0) {
            this.flowMeter = Math.max(0, this.flowMeter - dt * 6);
            if (this.flowMeter <= 0) {
                this._breakChain();
            }
        }
        
        this._updateFlowLevel();
        this.breakFlashTimer = Math.max(0, this.breakFlashTimer - dt);
    }
    
    _breakChain() {
        if (this.chainCount > 0 && !this.broken) {
            this.broken = true;
            this.breakFlashTimer = 0.5;
        }
        this.chainCount = 0;
        this.lastMoveType = null;
        this.flowMeter = 0;
        this._updateFlowLevel();
    }
    
    _updateFlowLevel() {
        if (this.flowMeter >= 100) this.flowLevel = 4;
        else if (this.flowMeter >= 75) this.flowLevel = 3;
        else if (this.flowMeter >= 50) this.flowLevel = 2;
        else if (this.flowMeter >= 25) this.flowLevel = 1;
        else this.flowLevel = 0;
    }
    
    /** @returns {number} 0–4 */
    getFlowLevel() {
        return this.flowLevel;
    }
    
    /**
     * Returns a speed multiplier to apply to movement velocity.
     * Approximates +1 / +2 / +3 m/s at sprint speed.
     */
    getFlowBoost() {
        switch (this.flowLevel) {
            case 4: return 1.30;
            case 3: return 1.20;
            case 2: return 1.10;
            case 1: return 1.10;
            default: return 1.0;
        }
    }
    
    /**
     * Returns visual configuration for the current flow level.
     * @returns {{screenGlowColor: number|null, trailEnabled: boolean, fovOffset: number}}
     */
    getVisualConfig() {
        const base = { screenGlowColor: null, trailEnabled: false, fovOffset: 0 };
        switch (this.flowLevel) {
            case 1:
                break;
            case 2:
                base.trailEnabled = true;
                break;
            case 3:
                base.trailEnabled = true;
                base.fovOffset = 13; // push 75° base toward 88°
                break;
            case 4:
                base.trailEnabled = true;
                base.fovOffset = 13;
                base.screenGlowColor = 0x00ffff;
                break;
        }
        return base;
    }
    
    /** @returns {boolean} true during the red break-flash frame */
    isBreakFlashActive() {
        return this.breakFlashTimer > 0;
    }
    
    /** Hard reset (e.g. on stumble / ragdoll / respawn). */
    reset() {
        this._breakChain();
    }
}
