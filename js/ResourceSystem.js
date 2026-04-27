/**
 * ResourceSystem.js
 * Archetype-specific resource management (Momentum, Focus, Chaos, Fury, Charge).
 */

export const RESOURCE_TYPES = {
  MOMENTUM: 'momentum',
  FOCUS: 'focus',
  CHAOS: 'chaos',
  FURY: 'fury',
  CHARGE: 'charge'
};

export class ResourceSystem {
  constructor(archetypeId) {
    this.archetypeId = archetypeId;
    this.type = this._resolveType(archetypeId);
    this.current = 0;
    this.max = 100;
    this.baseMax = 100;
    this.generationMultiplier = 1.0;
    this.costMultiplier = 1.0;
    this.regenPerSecond = 0;
  }

  _resolveType(archetypeId) {
    const map = {
      traceur: RESOURCE_TYPES.MOMENTUM,
      operative: RESOURCE_TYPES.FOCUS,
      saboteur: RESOURCE_TYPES.CHAOS,
      specimen: RESOURCE_TYPES.FURY,
      netrunner: RESOURCE_TYPES.CHARGE
    };
    return map[archetypeId] || RESOURCE_TYPES.MOMENTUM;
  }

  /**
   * Set max resource from passives/gear.
   */
  setMaxResource(value) {
    this.baseMax = value;
    this.max = value;
    this.current = Math.min(this.current, this.max);
  }

  /**
   * Add resource (generators, kills, etc).
   */
  generate(amount) {
    const final = amount * this.generationMultiplier;
    this.current = Math.min(this.max, this.current + final);
    return final;
  }

  /**
   * Attempt to consume resource. Returns true if successful.
   */
  consume(amount) {
    const final = amount * this.costMultiplier;
    if (this.current < final) return false;
    this.current -= final;
    return true;
  }

  /**
   * Set resource directly (used by initialization, cheats, etc).
   */
  set(value) {
    this.current = Math.max(0, Math.min(this.max, value));
  }

  /**
   * Passive regen — call every frame.
   */
  update(dt) {
    if (this.regenPerSecond > 0 && this.current < this.max) {
      this.current = Math.min(this.max, this.current + this.regenPerSecond * dt);
    }
  }

  /**
   * Get percentage for UI bars.
   */
  getPercent() {
    return this.max > 0 ? (this.current / this.max) * 100 : 0;
  }

  /**
   * Get display name for UI.
   */
  getDisplayName() {
    const names = {
      momentum: 'Momentum',
      focus: 'Focus',
      chaos: 'Chaos',
      fury: 'Fury',
      charge: 'Charge'
    };
    return names[this.type] || 'Resource';
  }

  /**
   * Get color hex for UI.
   */
  getColor() {
    const colors = {
      momentum: '#ffaa00',
      focus: '#00ccff',
      chaos: '#ff3333',
      fury: '#ff0066',
      charge: '#aa66ff'
    };
    return colors[this.type] || '#ffffff';
  }

  serialize() {
    return {
      type: this.type,
      current: this.current,
      max: this.max,
      generationMultiplier: this.generationMultiplier,
      costMultiplier: this.costMultiplier
    };
  }

  deserialize(data) {
    if (!data) return;
    this.type = data.type || this.type;
    this.current = data.current ?? this.current;
    this.max = data.max ?? this.max;
    this.generationMultiplier = data.generationMultiplier ?? this.generationMultiplier;
    this.costMultiplier = data.costMultiplier ?? this.costMultiplier;
  }
}
