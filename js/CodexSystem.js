/**
 * CodexSystem.js
 * Exploration journal that fills through play and mutates gameplay.
 * Pure data module — no Three.js objects.
 */

export const ENTRY_TYPES = {
  DRONE_BLUEPRINT: 'drone_blueprint',
  EMPLOYEE_MEMO: 'employee_memo',
  BOSS_LORE: 'boss_lore',
  WORLD_LORE: 'world_lore',
  MOVE_TUTORIAL: 'move_tutorial'
};

/**
 * Pre-defined codex entries with gameplay effects.
 * Each entry may optionally require a SYN (Synthesis) stat check to decrypt.
 */
const CODEX_ENTRIES = {
  codex_vanguard_knees: {
    title: 'Vanguard Knee Servo Schematic',
    type: ENTRY_TYPES.DRONE_BLUEPRINT,
    lore: 'The Mk-IV Vanguard drone routes 70 % of stabiliser load through its knee servos. A clean shot there cascades failure into the gyroscope.',
    synRequirement: 12,
    effects: { vanguardKneeDamageMultiplier: 3 }
  },
  codex_sector9_vent: {
    title: 'Sector 9 Maintenance Vent',
    type: ENTRY_TYPES.WORLD_LORE,
    lore: 'A hand-written note on a grease-stained map: "Sector 9 vent grille is loose — cuts straight to the coolant annex."',
    synRequirement: 0,
    effects: { unlockSector9Shortcut: true }
  },
  codex_overseer_name: {
    title: 'The Overseer\'s True Name',
    type: ENTRY_TYPES.BOSS_LORE,
    lore: 'HR file #7741-B. Subject: Elias Vance. Clearance: terminated. Knowing a tyrant\'s birth name has power.',
    synRequirement: 18,
    effects: { overseerUsesPlayerName: true }
  },
  codex_flow_mastery: {
    title: 'Flow-State Field Manual',
    type: ENTRY_TYPES.MOVE_TUTORIAL,
    lore: 'Zenith Solutions internal memo: runners who internalise flow cues show 10 % faster neural integration.',
    synRequirement: 8,
    effects: { flowGainBonus: 0.10 }
  },
  codex_implant_schematic: {
    title: 'Neural Implant Schematic',
    type: ENTRY_TYPES.DRONE_BLUEPRINT,
    lore: 'Early prototype diagram. The neural bridge socket can be rigged without a sterile lab — just a soldering iron and spite.',
    synRequirement: 15,
    effects: { unlockNeuralSlotEarly: true }
  },
  codex_blackout_schedule: {
    title: 'Grid Maintenance Schedule',
    type: ENTRY_TYPES.EMPLOYEE_MEMO,
    lore: 'Rolling blackouts every Tuesday 02:00–04:00. Security drones switch to capacitor backup — detection range drops 20 %.',
    synRequirement: 0,
    effects: { blackoutDroneDetectionReduction: 0.20 }
  },
  codex_salvage_rat_routes: {
    title: 'Rat-Run Smuggling Routes',
    type: ENTRY_TYPES.WORLD_LORE,
    lore: 'A map drawn in machine grease. Back alleys the patrol drones never scan because the cameras were "reclaimed" years ago.',
    synRequirement: 5,
    effects: { patrolDroneIgnoreChance: 0.15 }
  },
  codex_synapse_weakness: {
    title: 'Synapse Drone Kernel Panic',
    type: ENTRY_TYPES.DRONE_BLUEPRINT,
    lore: 'Overflow the optical buffer with rapid directional changes and the target-lock stack collapses.',
    synRequirement: 20,
    effects: { synapseLockBreakOnDodge: true }
  },
  codex_coolant_toxicity: {
    title: 'Coolant Toxicity Report',
    type: ENTRY_TYPES.EMPLOYEE_MEMO,
    lore: 'Exposure to industrial coolant reduces stamina recovery by half. Seal your suit before crossing the flooded annex.',
    synRequirement: 0,
    effects: { coolantStaminaRecoveryMultiplier: 0.50 }
  },
  codex_hollow_signal: {
    title: 'Hollow Signal Fragment',
    type: ENTRY_TYPES.WORLD_LORE,
    lore: 'A burst of static that, when slowed, resolves into coordinates. The Hollow faction listens on this frequency.',
    synRequirement: 22,
    effects: { hollowFactionDiscount: 0.20, hollowTruceChance: 0.10 }
  },
  codex_perfect_dodge_frame: {
    title: 'Reflex Calibration Log',
    type: ENTRY_TYPES.MOVE_TUTORIAL,
    lore: 'Frame-by-frame analysis of a perfect dodge. The window exists — it is simply narrower than fear.',
    synRequirement: 10,
    effects: { perfectDodgeWindowBonus: 0.03 }
  },
  codex_boss_coolant_valve: {
    title: 'Coolant Annex Valve Override',
    type: ENTRY_TYPES.BOSS_LORE,
    lore: 'Emergency override for the coolant system. If the Overseer ever enters the annex, a single shot to the valve would flash-freeze the chamber.',
    synRequirement: 14,
    effects: { bossCoolantValveVulnerability: true, bossFreezeDuration: 5 }
  }
};

export class CodexSystem {
  /**
   * @param {Player} player
   * @param {CharacterSheet} characterSheet
   */
  constructor(player, characterSheet) {
    this.player = player;
    this.characterSheet = characterSheet;

    /** @type {Set<string>} ids of unlocked entries */
    this._unlocked = new Set();

    /** @type {Set<string>} ids of entries that have been decrypted */
    this._decrypted = new Set();

    /** @type {Map<string, string>} entryId -> source description */
    this._sources = new Map();
  }

  /* ============================================================
     ENTRY API
     ============================================================ */

  /**
   * Unlock an entry by ID.
   * @param {string} entryId
   * @param {string} source — human-readable description of how it was found
   * @returns {boolean} true if newly unlocked
   */
  unlockEntry(entryId, source) {
    const def = CODEX_ENTRIES[entryId];
    if (!def) {
      window.__DEV__ && console.warn(`CodexSystem: unknown entry "${entryId}"`);
      return false;
    }

    if (this._unlocked.has(entryId)) return false;

    this._unlocked.add(entryId);
    this._sources.set(entryId, String(source));
    return true;
  }

  /**
   * @param {string} entryId
   * @returns {boolean}
   */
  hasEntry(entryId) {
    return this._unlocked.has(entryId);
  }

  /**
   * @param {string} entryId
   * @returns {object|null} full entry with decryption state
   */
  getEntry(entryId) {
    const def = CODEX_ENTRIES[entryId];
    if (!def || !this._unlocked.has(entryId)) return null;

    return {
      id: entryId,
      title: def.title,
      type: def.type,
      lore: this._decrypted.has(entryId) ? def.lore : '[Encrypted — decrypt to reveal]',
      decrypted: this._decrypted.has(entryId),
      synRequirement: def.synRequirement,
      effects: { ...def.effects },
      source: this._sources.get(entryId) || 'Unknown'
    };
  }

  /**
   * @returns {object[]} all unlocked entries
   */
  getAllEntries() {
    const list = [];
    for (const id of this._unlocked) {
      const entry = this.getEntry(id);
      if (entry) list.push(entry);
    }
    return list;
  }

  /* ============================================================
     DECRYPTION
     ============================================================ */

  /**
   * Check whether the player meets the SYN requirement to decrypt an entry.
   * @param {string} entryId
   * @returns {boolean}
   */
  canDecrypt(entryId) {
    const def = CODEX_ENTRIES[entryId];
    if (!def || !this._unlocked.has(entryId)) return false;
    if (this._decrypted.has(entryId)) return true;

    const syn = this._getSynStat();
    return syn >= def.synRequirement;
  }

  /**
   * Attempt to decrypt an entry.
   * @param {string} entryId
   * @returns {boolean} true if successfully decrypted (or already decrypted)
   */
  attemptDecrypt(entryId) {
    if (!this._unlocked.has(entryId)) return false;
    if (this._decrypted.has(entryId)) return true;

    if (this.canDecrypt(entryId)) {
      this._decrypted.add(entryId);
      return true;
    }
    return false;
  }

  /* ============================================================
     GAMEPLAY EFFECTS
     ============================================================ */

  /**
   * Aggregate all active gameplay effects from decrypted entries.
   * @returns {object} merged effect dictionary
   */
  getGameplayEffects() {
    const effects = {};

    for (const entryId of this._decrypted) {
      const def = CODEX_ENTRIES[entryId];
      if (!def || !def.effects) continue;

      for (const [key, value] of Object.entries(def.effects)) {
        if (typeof value === 'boolean') {
          // Boolean flags: any true sets it true
          if (value) effects[key] = true;
        } else if (typeof value === 'number') {
          // Numbers: additive for multipliers, max for reductions
          if (key.toLowerCase().includes('multiplier') || key.toLowerCase().includes('bonus')) {
            effects[key] = (effects[key] || 0) + value;
          } else if (key.toLowerCase().includes('reduction') || key.toLowerCase().includes('duration')) {
            effects[key] = Math.max(effects[key] || 0, value);
          } else {
            effects[key] = (effects[key] || 0) + value;
          }
        } else {
          effects[key] = value;
        }
      }
    }

    return effects;
  }

  /* ============================================================
     SERIALIZATION
     ============================================================ */

  serialize() {
    return {
      unlocked: Array.from(this._unlocked),
      decrypted: Array.from(this._decrypted),
      sources: Object.fromEntries(this._sources)
    };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;

    this._unlocked = new Set(Array.isArray(data.unlocked) ? data.unlocked : []);
    this._decrypted = new Set(Array.isArray(data.decrypted) ? data.decrypted : []);
    this._sources = new Map(
      data.sources && typeof data.sources === 'object'
        ? Object.entries(data.sources)
        : []
    );
  }

  /* ============================================================
     INTERNALS
     ============================================================ */

  _getSynStat() {
    if (this.characterSheet) {
      return this.characterSheet.getStat('syn');
    }
    return 0;
  }
}
