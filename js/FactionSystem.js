/**
 * FactionSystem.js
 * Manages player reputation with three drone factions.
 * Pure data module — no Three.js objects.
 */

export const FACTIONS = {
  VANGUARD: 'vanguard',
  SYNAPSE: 'synapse',
  HOLLOW: 'hollow'
};

export const REPUTATION_TIERS = {
  HATED:   { min: -100, max: -50,  key: 'hated' },
  HOSTILE: { min: -50,  max: 0,    key: 'hostile' },
  NEUTRAL: { min: 0,    max: 50,   key: 'neutral' },
  FRIENDLY:{ min: 50,   max: 100,  key: 'friendly' },
  ALLIED:  { min: 100,  max: 100,  key: 'allied' }
};

const TIER_KEYS = ['HATED', 'HOSTILE', 'NEUTRAL', 'FRIENDLY', 'ALLIED'];

const RIVALS = {
  [FACTIONS.VANGUARD]: [FACTIONS.SYNAPSE, FACTIONS.HOLLOW],
  [FACTIONS.SYNAPSE]:  [FACTIONS.VANGUARD],
  [FACTIONS.HOLLOW]:   [FACTIONS.VANGUARD]
};

const UNEASY_ALLIES = {
  [FACTIONS.SYNAPSE]: FACTIONS.HOLLOW,
  [FACTIONS.HOLLOW]:  FACTIONS.SYNAPSE
};

export class FactionSystem {
  constructor(eventBus = null) {
    this.eventBus = eventBus;
    this._reputation = {
      [FACTIONS.VANGUARD]: 0,
      [FACTIONS.SYNAPSE]:  0,
      [FACTIONS.HOLLOW]:   0
    };
    this._history = [];
  }

  /* ---------- Core Reputation ---------- */

  getReputation(faction) {
    if (!this._isValidFaction(faction)) {
      throw new Error(`Invalid faction: ${faction}`);
    }
    return this._reputation[faction];
  }

  adjustReputation(faction, delta, reason = '') {
    if (!this._isValidFaction(faction)) {
      throw new Error(`Invalid faction: ${faction}`);
    }
    const oldValue = this._reputation[faction];
    let newValue = oldValue + delta;
    newValue = Math.max(-100, Math.min(100, newValue));

    if (newValue !== oldValue) {
      this._reputation[faction] = newValue;
      this._history.push({ faction, delta, reason, timestamp: Date.now() });

      const oldTier = this._tierFromValue(oldValue);
      const newTier = this._tierFromValue(newValue);

      if (this.eventBus && typeof this.eventBus.emit === 'function') {
        this.eventBus.emit('reputationChanged', {
          faction,
          oldValue,
          newValue,
          delta: newValue - oldValue,
          reason,
          oldTier,
          newTier
        });
        if (oldTier !== newTier) {
          this.eventBus.emit('tierChanged', { faction, oldTier, newTier, reason });
        }
      }
    }

    return this._reputation[faction];
  }

  getTier(faction) {
    if (!this._isValidFaction(faction)) {
      throw new Error(`Invalid faction: ${faction}`);
    }
    return this._tierFromValue(this._reputation[faction]);
  }

  /* ---------- Behavior Overrides ---------- */

  shouldFactionAttackPlayer(faction) {
    const tier = this.getTier(faction);
    // HATED, HOSTILE and NEUTRAL use standard drone behavior (attack on sight).
    // FRIENDLY and ALLIED drones will not attack unless provoked.
    return tier === 'hated' || tier === 'hostile' || tier === 'neutral';
  }

  shouldFactionAssistPlayer(faction) {
    const tier = this.getTier(faction);
    // Only ALLIED factions will actively fight alongside the player.
    return tier === 'allied';
  }

  getShopPriceModifier(faction) {
    const tier = this.getTier(faction);
    switch (tier) {
      case 'hated':   return 2.00; // +100%
      case 'hostile': return 1.50; // +50%
      case 'neutral': return 1.00;
      case 'friendly':return 0.85; // -15%
      case 'allied':  return 0.70; // -30%
      default:        return 1.00;
    }
  }

  getBountyHunterChance(faction) {
    const tier = this.getTier(faction);
    // Chance per minute that the faction dispatches bounty hunters.
    switch (tier) {
      case 'hated':   return 0.30;
      case 'hostile': return 0.10;
      default:        return 0.00;
    }
  }

  /* ---------- Cross-Faction Dynamics ---------- */

  onDroneKilled(faction, wasElite = false) {
    if (!this._isValidFaction(faction)) return;

    const victimPenalty = wasElite ? -30 : -15;
    this.adjustReputation(faction, victimPenalty, `Killed ${wasElite ? 'elite ' : ''}drone`);

    // Rivals gain rep
    const rivals = RIVALS[faction] || [];
    for (const rival of rivals) {
      this.adjustReputation(rival, wasElite ? 12 : 8, `Rival ${faction} drone killed`);
    }

    // Uneasy ally may react negatively
    const ally = UNEASY_ALLIES[faction];
    if (ally) {
      this.adjustReputation(ally, wasElite ? -5 : -3, `Ally ${faction} drone killed`);
    }
  }

  onDroneSpared(faction) {
    if (!this._isValidFaction(faction)) return;
    this.adjustReputation(faction, 10, 'Drone spared / pacified');
  }

  onSectorLiberated(faction) {
    if (!this._isValidFaction(faction)) return;

    // Big rep boost for rivals of the faction that lost the sector.
    const rivals = RIVALS[faction] || [];
    for (const rival of rivals) {
      this.adjustReputation(rival, 25, `Sector liberated from ${faction}`);
    }

    // Uneasy ally of the loser takes a small hit.
    const ally = UNEASY_ALLIES[faction];
    if (ally) {
      this.adjustReputation(ally, -5, `Sector liberated from ally ${faction}`);
    }
  }

  /* ---------- Utilities ---------- */

  _isValidFaction(faction) {
    return Object.values(FACTIONS).includes(faction);
  }

  _tierFromValue(value) {
    for (const key of TIER_KEYS) {
      const t = REPUTATION_TIERS[key];
      if (value >= t.min && value <= t.max) {
        return t.key;
      }
    }
    return 'neutral';
  }

  /* ---------- Serialization ---------- */

  serialize() {
    return {
      reputation: { ...this._reputation },
      history: this._history.slice()
    };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;
    if (data.reputation) {
      for (const f of Object.values(FACTIONS)) {
        if (typeof data.reputation[f] === 'number') {
          this._reputation[f] = Math.max(-100, Math.min(100, data.reputation[f]));
        }
      }
    }
    if (Array.isArray(data.history)) {
      this._history = data.history.slice();
    }
  }
}
