/**
 * NephalemGlory.js
 * Kill streak system rewarding aggressive parkour-combat flow.
 *
 * Tiers:
 *   Tier 1 (10 kills): +100% damage, +50% move speed, visual trail
 *   Tier 2 (30 kills): Screen tint gold, all drops Rare+
 *   Tier 3 (50 kills): Guaranteed Legendary from next elite
 *
 * Streak breaks if:
 *   - Player takes damage
 *   - Player touches ground after being airborne for >2s
 *   - No kill for 5 seconds
 */

export class NephalemGlory {
  constructor(player, challengeSystem, enemyHealthBars = []) {
    this.player = player;
    this.challengeSystem = challengeSystem;
    this.enemyHealthBars = enemyHealthBars;

    this.killStreak = 0;
    this.bestStreak = 0;
    this.lastKillTime = 0;
    this.tier = 0; // 0, 1, 2, 3
    this.active = false;

    // Timer for streak decay
    this.decayTimer = 0;
    this.DECAY_TIME = 5.0;

    // Track if player has been airborne long enough for ground-touch reset
    this.airborneTime = 0;
    this.wasAirborne = false;

    // Guaranteed legendary flag (consumed on next elite kill)
    this.guaranteedLegendary = false;

    // Visual state
    this.screenTint = 0; // 0-1 intensity
    this.trailActive = false;

    // Multiplier cache
    this.damageMultiplier = 1.0;
    this.moveSpeedMultiplier = 1.0;

    this._gloryEl = document.getElementById('glory-overlay');
  }

  setEnemyHealthBars(bars) {
    this.enemyHealthBars = bars;
  }

  /* ------------------------------------------------------------------ */
  /*  Events                                                             */
  /* ------------------------------------------------------------------ */

  onKill(enemy) {
    if (!this.player || this.player.isDead) return;

    const now = performance.now() / 1000;
    this.killStreak++;
    this.lastKillTime = now;
    this.decayTimer = this.DECAY_TIME;
    this.active = true;

    if (this.killStreak > this.bestStreak) {
      this.bestStreak = this.killStreak;
    }

    this._updateTier();

    // Report to challenge system
    if (this.challengeSystem && this.challengeSystem.reportEvent) {
      this.challengeSystem.reportEvent('killStreak', { count: this.killStreak });
    }

    // Consume guaranteed legendary
    if (this.guaranteedLegendary && enemy && enemy.isElite) {
      this.guaranteedLegendary = false;
      // The loot system should check this flag
    }
  }

  onDamageTaken() {
    if (this.killStreak > 0) {
      this._breakStreak('damage taken');
    }
  }

  onGroundTouch() {
    // Only break if player was airborne for >2s (prevents tiny hops from breaking streak)
    if (this.wasAirborne && this.airborneTime > 2.0 && this.killStreak > 0) {
      this._breakStreak('ground touch');
    }
    this.airborneTime = 0;
    this.wasAirborne = false;
  }

  onAirborne() {
    this.wasAirborne = true;
  }

  /* ------------------------------------------------------------------ */
  /*  Per-frame update                                                   */
  /* ------------------------------------------------------------------ */

  update(dt) {
    if (!this.active) return;

    // Track airborne time
    if (this.player && !this.player.grounded) {
      this.airborneTime += dt;
      this.onAirborne();
    } else {
      this.onGroundTouch();
    }

    // Decay timer
    if (this.decayTimer > 0) {
      this.decayTimer -= dt;
      if (this.decayTimer <= 0) {
        this._breakStreak('timeout');
      }
    }

    // Update visual effects
    this._updateVisuals(dt);

    // Update multipliers based on tier
    this._updateMultipliers();
  }

  /* ------------------------------------------------------------------ */
  /*  Tier logic                                                         */
  /* ------------------------------------------------------------------ */

  _updateTier() {
    let newTier = 0;
    if (this.killStreak >= 50) newTier = 3;
    else if (this.killStreak >= 30) newTier = 2;
    else if (this.killStreak >= 10) newTier = 1;

    if (newTier !== this.tier) {
      this.tier = newTier;
      this._onTierChange(newTier);
    }
  }

  _onTierChange(tier) {
    const messages = {
      1: 'NEPHALEM GLORY I — +100% Damage, +50% Speed',
      2: 'NEPHALEM GLORY II — Golden Drops!',
      3: 'NEPHALEM GLORY III — Legendary Guaranteed!'
    };

    if (messages[tier]) {
      this._showToast(messages[tier]);
    }

    if (tier >= 3) {
      this.guaranteedLegendary = true;
    }

    if (this.challengeSystem) {
      if (tier >= 1) this.challengeSystem.unlock('gloryTier1');
      if (tier >= 2) this.challengeSystem.unlock('gloryTier2');
      if (tier >= 3) this.challengeSystem.unlock('gloryTier3');
    }

    this._applyTier(tier);
  }

  _applyTier(tier) {
    if (!this._gloryEl) return;
    if (tier === 1) {
      this._gloryEl.style.background = 'rgba(255, 215, 0, 0.08)';
      this._gloryEl.style.opacity = '0.08';
    } else if (tier === 2) {
      this._gloryEl.style.background = 'rgba(255, 140, 0, 0.15)';
      this._gloryEl.style.opacity = '0.15';
      this.enemyHealthBars.forEach(bar => { if (bar) bar._pulseGold = true; });
    } else if (tier === 3) {
      this._gloryEl.style.background = 'rgba(255, 0, 0, 0.25)';
      this._gloryEl.style.opacity = '0.25';
      const float = document.createElement('div');
      float.style.position = 'fixed'; float.style.top = '30%'; float.style.left = '50%';
      float.style.transform = 'translate(-50%, -50%)';
      float.style.color = '#ff4444'; float.style.fontSize = '28px'; float.style.fontWeight = 'bold';
      float.style.textShadow = '0 2px 8px rgba(0,0,0,0.8)'; float.style.pointerEvents = 'none';
      float.style.zIndex = '100'; float.style.transition = 'opacity 1s';
      float.textContent = 'NEPHALEM GLORY';
      document.body.appendChild(float);
      setTimeout(() => { float.style.opacity = '0'; }, 2000);
      setTimeout(() => { if (float.parentNode) float.parentNode.removeChild(float); }, 3000);
    }
  }

  _clearTier() {
    if (!this._gloryEl) return;
    this._gloryEl.style.background = '';
    this._gloryEl.style.opacity = '0';
    this.enemyHealthBars.forEach(bar => { if (bar) bar._pulseGold = false; });
  }

  _breakStreak(reason) {
    this.killStreak = 0;
    this.tier = 0;
    this.active = false;
    this.decayTimer = 0;
    this.airborneTime = 0;
    this.wasAirborne = false;
    this.trailActive = false;
    this.screenTint = 0;
    this.damageMultiplier = 1.0;
    this.moveSpeedMultiplier = 1.0;
    this._clearTier();
  }

    _updateMultipliers() {
        switch (this.tier) {
            case 1:
                this.damageMultiplier = 1.25;
                this.moveSpeedMultiplier = 1.1;
                this.trailActive = true;
                break;
            case 2:
                this.damageMultiplier = 1.6;
                this.moveSpeedMultiplier = 1.25;
                this.trailActive = true;
                break;
            case 3:
                this.damageMultiplier = 2.0;
                this.moveSpeedMultiplier = 1.5;
                this.trailActive = true;
                break;
            default:
                this.damageMultiplier = 1.0;
                this.moveSpeedMultiplier = 1.0;
                this.trailActive = false;
        }
    }

  _updateVisuals(dt) {
    // Fade screen tint
    if (this.tier >= 2) {
      this.screenTint = Math.min(1, this.screenTint + dt * 2);
    } else {
      this.screenTint = Math.max(0, this.screenTint - dt * 3);
    }
  }

  _showToast(message) {
    // Simple console toast for now — UI can be added later
    // Could also emit an event for main.js to display
  }

  /* ------------------------------------------------------------------ */
  /*  Queries                                                            */
  /* ------------------------------------------------------------------ */

  getDamageMultiplier() {
    return this.damageMultiplier;
  }

  getMoveSpeedMultiplier() {
    return this.moveSpeedMultiplier;
  }

  hasGuaranteedLegendary() {
    return this.guaranteedLegendary;
  }

  getTierDropBonus() {
    // Tier 2+ guarantees Rare+ drops
    if (this.tier >= 2) return { minRarity: 2 };
    return null;
  }

  serialize() {
    return {
      bestStreak: this.bestStreak,
      totalKills: this._totalKills || 0
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.bestStreak) this.bestStreak = data.bestStreak;
    if (data.totalKills) this._totalKills = data.totalKills;
  }
}
