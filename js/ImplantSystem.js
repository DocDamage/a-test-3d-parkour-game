/**
 * ImplantSystem.js
 * Permanent body modifications that slot into the player.
 * Pure data module — no Three.js objects.
 */

export const IMPLANT_SLOTS = ['neural', 'muscular', 'ocular', 'skeletal'];

const VALID_SLOTS = new Set(IMPLANT_SLOTS);

const REMOVAL_BASE_COST = 500;
const REMOVAL_PER_MINUTE = 50;
const REMOVAL_MAX_COST = 5000;

export const IMPLANTS = [
  {
    id: 'myomer_threads',
    name: 'Myomer Threads',
    slot: 'muscular',
    bonuses: { meleeDamageMult: 0.30 },
    drawbacks: { canUsePistols: false },
    removalPenalty: { stamina: -20 }
  },
  {
    id: 'adrenal_valve',
    name: 'Adrenal Valve',
    slot: 'neural',
    bonuses: { deathRewind: true, deathRewindThreshold: 0.10 },
    drawbacks: { maxHealth: -25 },
    removalPenalty: { health: -15 }
  },
  {
    id: 'optical_overdrive',
    name: 'Optical Overdrive',
    slot: 'ocular',
    bonuses: { predatorVision: true, seeLootThroughWalls: true },
    drawbacks: { screenFlicker: true },
    removalPenalty: { stamina: -15 }
  },
  {
    id: 'grapple_spine',
    name: 'Grapple Spine',
    slot: 'skeletal',
    bonuses: { grappleCharges: 2, grappleCooldown: 0 },
    drawbacks: { fallDamageMult: 2.0 },
    removalPenalty: { health: -10 }
  },
  {
    id: 'hive_pheromones',
    name: 'Hive Pheromones',
    slot: 'neural',
    bonuses: { droneIgnoreChance: 0.25, npcFear: true },
    drawbacks: { shopCostMult: 1.20 },
    removalPenalty: { health: -10 }
  },
  {
    id: 'kinetic_dampeners',
    name: 'Kinetic Dampeners',
    slot: 'muscular',
    bonuses: { knockbackReduction: 0.50 },
    drawbacks: { moveSpeedMult: -0.10 },
    removalPenalty: { stamina: -20 }
  },
  {
    id: 'synaptic_accelerator',
    name: 'Synaptic Accelerator',
    slot: 'neural',
    bonuses: { flowGainMult: 0.20 },
    drawbacks: { staminaDrainMult: 2.0 },
    removalPenalty: { stamina: -25 }
  },
  {
    id: 'titanium_ribs',
    name: 'Titanium Ribs',
    slot: 'skeletal',
    bonuses: { maxHealth: 50 },
    drawbacks: { canRoll: false },
    removalPenalty: { health: -30 }
  }
];

const IMPLANT_MAP = new Map(IMPLANTS.map(i => [i.id, i]));

function mergeEffects(implants, key) {
  const merged = {};
  for (const entry of implants) {
    const effect = entry[key];
    if (!effect) continue;
    for (const [prop, val] of Object.entries(effect)) {
      if (typeof val === 'number') {
        merged[prop] = (merged[prop] || 0) + val;
      } else if (typeof val === 'boolean') {
        if (merged[prop] === undefined) {
          merged[prop] = val;
        } else {
          merged[prop] = merged[prop] || val;
        }
      } else {
        merged[prop] = val;
      }
    }
  }
  return merged;
}

export class ImplantSystem {
  /**
   * @param {object} player — the Player instance
   * @param {CharacterSheet} characterSheet
   */
  constructor(player, characterSheet) {
    this.player = player;
    this.characterSheet = characterSheet;

    /** @type {object<string, {implant: object, installedAt: number}|null>} */
    this.slots = {
      neural: null,
      muscular: null,
      ocular: null,
      skeletal: null
    };
  }

  /* ---------- Installation ---------- */

  installImplant(slot, implantId) {
    if (!VALID_SLOTS.has(slot)) {
      window.__DEV__ && console.warn(`ImplantSystem: invalid slot "${slot}"`);
      return false;
    }

    const template = IMPLANT_MAP.get(implantId);
    if (!template) {
      window.__DEV__ && console.warn(`ImplantSystem: unknown implant "${implantId}"`);
      return false;
    }

    if (template.slot !== slot) {
      window.__DEV__ && console.warn(`ImplantSystem: "${implantId}" does not fit in ${slot} slot`);
      return false;
    }

    if (this.slots[slot]) {
      window.__DEV__ && console.warn(`ImplantSystem: ${slot} already occupied`);
      return false;
    }

    this.slots[slot] = {
      implant: { ...template },
      installedAt: Date.now()
    };

    return true;
  }

  removeImplant(slot) {
    if (!VALID_SLOTS.has(slot)) {
      window.__DEV__ && console.warn(`ImplantSystem: invalid slot "${slot}"`);
      return null;
    }

    const entry = this.slots[slot];
    if (!entry) {
      window.__DEV__ && console.warn(`ImplantSystem: no implant in ${slot}`);
      return null;
    }

    const cost = this.getRemovalCost(slot);

    // Deduct chips if the player exposes a currency property
    if (this.player && typeof this.player.chips === 'number') {
      if (this.player.chips < cost) {
        window.__DEV__ && console.warn(`ImplantSystem: cannot afford removal cost ${cost}`);
        return null;
      }
      this.player.chips -= cost;
    }

    // Apply removal penalty
    if (entry.implant.removalPenalty && this.player) {
      for (const [prop, val] of Object.entries(entry.implant.removalPenalty)) {
        if (prop === 'health' && typeof this.player.health === 'number') {
          this.player.health = Math.max(1, this.player.health + val);
        } else if (prop === 'stamina' && typeof this.player.stamina === 'number') {
          this.player.stamina = Math.max(0, this.player.stamina + val);
        }
      }
    }

    const removed = entry.implant;
    this.slots[slot] = null;
    return removed;
  }

  /* ---------- Queries ---------- */

  getImplant(slot) {
    if (!VALID_SLOTS.has(slot)) return null;
    const entry = this.slots[slot];
    return entry ? { ...entry.implant } : null;
  }

  getAllImplants() {
    const result = {};
    for (const slot of IMPLANT_SLOTS) {
      const entry = this.slots[slot];
      result[slot] = entry ? { ...entry.implant } : null;
    }
    return result;
  }

  getTotalBonuses() {
    const active = IMPLANT_SLOTS
      .map(s => this.slots[s]?.implant)
      .filter(Boolean);
    return mergeEffects(active, 'bonuses');
  }

  getTotalDrawbacks() {
    const active = IMPLANT_SLOTS
      .map(s => this.slots[s]?.implant)
      .filter(Boolean);
    return mergeEffects(active, 'drawbacks');
  }

  getRemovalCost(slot) {
    if (!VALID_SLOTS.has(slot)) return 0;
    const entry = this.slots[slot];
    if (!entry) return 0;

    const minutes = Math.floor((Date.now() - entry.installedAt) / 60000);
    return Math.min(REMOVAL_MAX_COST, REMOVAL_BASE_COST + minutes * REMOVAL_PER_MINUTE);
  }

  /* ---------- Serialization ---------- */

  serialize() {
    const data = {};
    for (const slot of IMPLANT_SLOTS) {
      const entry = this.slots[slot];
      data[slot] = entry
        ? { implantId: entry.implant.id, installedAt: entry.installedAt }
        : null;
    }
    return { slots: data };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object' || !data.slots) return;

    for (const slot of IMPLANT_SLOTS) {
      const incoming = data.slots[slot];
      if (incoming && typeof incoming.implantId === 'string') {
        const template = IMPLANT_MAP.get(incoming.implantId);
        if (template) {
          this.slots[slot] = {
            implant: { ...template },
            installedAt: typeof incoming.installedAt === 'number' ? incoming.installedAt : Date.now()
          };
        } else {
          this.slots[slot] = null;
        }
      } else {
        this.slots[slot] = null;
      }
    }
  }
}
