/**
 * SkillSystem.js
 * Core skill bar controller. Manages 5 slots (LMB/RMB/Q/E/R),
 * cooldowns, resource costs, and delegates execution to callbacks.
 *
 * Design: SkillSystem does NOT contain Three.js/physics logic.
 * It tells main.js WHAT to do via executeSkill callbacks.
 */

import { ACTIVE_SKILLS, resolveSkillStats, SKILL_SLOTS } from './SkillData.js';

export class SkillSystem {
  /**
   * @param {object} player — Player instance
   * @param {ResourceSystem} resourceSystem
   * @param {string} archetypeId — e.g. 'traceur'
   */
  constructor(player, resourceSystem, archetypeId) {
    this.player = player;
    this.resource = resourceSystem;
    this.archetypeId = archetypeId;
    this.skills = ACTIVE_SKILLS[archetypeId] || {};

    // slot -> { skillId, runeId, resolvedStats }
    this.slots = {};
    SKILL_SLOTS.forEach(s => this.slots[s] = null);

    // skillId -> remaining cooldown seconds
    this.cooldowns = new Map();

    // skillId -> current charge count (for skills with charges)
    this.charges = new Map();

    // Global cooldown flag (prevents spam between slots)
    this.globalCooldown = 0;

    // Callbacks registered by main.js for each skill
    // skillId -> function(skill, targetPosition, resolvedStats)
    this.executeCallbacks = new Map();

    // Passive bonuses aggregated from PassiveTree
    this.passiveBonuses = {};

    // CDR stat from gear/passives (0.0 = no reduction, 0.25 = 25% reduction)
    this.cooldownReduction = 0;

    // Track combo state for rune conditionals
    this.comboCounter = 0;
    this.lastSkillTime = 0;
    this.consecutiveParkourMoves = 0;
  }

  /**
   * Assign a skill to a slot.
   */
  assignSkill(slot, skillId, runeId = null) {
    if (!SKILL_SLOTS.includes(slot)) return false;
    const base = this.skills[skillId];
    if (!base) return false;

    this.slots[slot] = {
      skillId,
      runeId,
      base
    };

    // Initialize charges if skill supports them
    if (base.maxCharges && base.maxCharges > 1) {
      this.charges.set(skillId, base.maxCharges);
    }

    return true;
  }

  /**
   * Register the execution callback for a skill.
   * main.js provides the actual Three.js/physics implementation.
   */
  onExecute(skillId, callback) {
    this.executeCallbacks.set(skillId, callback);
  }

  /**
   * Set global cooldown reduction (0.0 to 0.80 cap).
   */
  setCooldownReduction(value) {
    this.cooldownReduction = Math.min(0.80, Math.max(0, value));
  }

  /**
   * Update passive bonuses from PassiveTree.
   */
  setPassiveBonuses(bonuses) {
    this.passiveBonuses = bonuses || {};
  }

  /**
   * Check if a skill can be used right now.
   */
  canUse(slot) {
    const assigned = this.slots[slot];
    if (!assigned) return false;

    const { skillId, base } = assigned;

    // Dead check
    if (this.player && this.player.isDead) return false;

    // Global cooldown
    if (this.globalCooldown > 0) return false;

    // Cooldown check
    const cd = this.cooldowns.get(skillId) || 0;
    if (cd > 0 && !this._noCooldown) return false;

    // Charge check
    const charges = this.charges.get(skillId);
    if (charges !== undefined && charges <= 0) return false;

    // Resource check (spenders only; generators always work)
    const resolved = this._resolveStats(assigned);
    if (resolved.finalResourceCost > 0) {
      if (!this.resource || this.resource.current < resolved.finalResourceCost) return false;
    }

    // Skill-specific condition checks
    if (skillId === 'dive_kick') {
      // Must be airborne
      if (this.player && this.player.grounded) return false;
    }

    return true;
  }

  /**
   * Use a skill by slot. Returns true if executed.
   */
  useSkill(slot, targetPosition = null) {
    if (!this.canUse(slot)) return false;

    const assigned = this.slots[slot];
    const { skillId, base } = assigned;
    const resolved = this._resolveStats(assigned);

    // Consume resource
    if (resolved.finalResourceCost > 0) {
      const consumed = this.resource.consume(resolved.finalResourceCost);
      if (!consumed) return false;
    }

    // Generate resource (generators)
    if (resolved.finalResourceGen > 0) {
      this.resource.generate(resolved.finalResourceGen);
    }

    // Apply cooldown
    const finalCd = this._applyCDR(resolved.finalCooldown);
    if (finalCd > 0 && !this._noCooldown) {
      this.cooldowns.set(skillId, finalCd);
    }

    // Deduct charge if applicable
    const charges = this.charges.get(skillId);
    if (charges !== undefined) {
      this.charges.set(skillId, charges - 1);
    }

    // Small global cooldown to prevent frame-perfect double-casts
    if (base.category !== 'generator') {
      this.globalCooldown = 0.05;
    }

    // Combo tracking
    this.comboCounter++;
    this.lastSkillTime = performance.now();

    // Execute
    const callback = this.executeCallbacks.get(skillId);
    if (callback) {
      callback(resolved, targetPosition, this.player);
    }

    return true;
  }

  /**
   * Get the resolved stats for a slot (for UI preview).
   */
  getResolvedSkill(slot) {
    const assigned = this.slots[slot];
    if (!assigned) return null;
    return this._resolveStats(assigned);
  }

  /**
   * Get remaining cooldown for a slot (for UI).
   */
  getCooldownRemaining(slot) {
    const assigned = this.slots[slot];
    if (!assigned) return 0;
    return this.cooldowns.get(assigned.skillId) || 0;
  }

  /**
   * Get total cooldown for a slot (for UI percentage).
   */
  getCooldownTotal(slot) {
    const assigned = this.slots[slot];
    if (!assigned) return 0;
    const resolved = this._resolveStats(assigned);
    return this._applyCDR(resolved.finalCooldown);
  }

  /**
   * Get charges remaining.
   */
  getCharges(slot) {
    const assigned = this.slots[slot];
    if (!assigned) return 0;
    return this.charges.get(assigned.skillId) ?? 1;
  }

  /**
   * Get max charges.
   */
  getMaxCharges(slot) {
    const assigned = this.slots[slot];
    if (!assigned) return 1;
    return assigned.base.maxCharges || 1;
  }

  /**
   * Update cooldowns and regen. Call every frame.
   */
  update(dt) {
    // Sync CDR from player gear stats
    if (this.player && this.player.getRPGStats) {
      const stats = this.player.getRPGStats();
      if (stats && stats.cooldownReduction !== undefined) {
        this.setCooldownReduction(stats.cooldownReduction);
      }
    }

    // Update skill cooldowns
    for (const [skillId, time] of this.cooldowns) {
      const remaining = Math.max(0, time - dt);
      if (remaining <= 0) {
        this.cooldowns.delete(skillId);
        // Replenish a charge if the skill uses charges
        const maxCharges = this._getMaxChargesForSkill(skillId);
        if (maxCharges > 1) {
          const current = this.charges.get(skillId) || 0;
          if (current < maxCharges) {
            this.charges.set(skillId, current + 1);
            // If still below max, restart cooldown for next charge
            if (current + 1 < maxCharges) {
              const baseCd = this._getBaseCooldown(skillId);
              if (baseCd > 0) {
                this.cooldowns.set(skillId, this._applyCDR(baseCd));
              }
            }
          }
        }
      } else {
        this.cooldowns.set(skillId, remaining);
      }
    }

    // Global cooldown
    if (this.globalCooldown > 0) {
      this.globalCooldown = Math.max(0, this.globalCooldown - dt);
    }

    // Resource regen
    if (this.resource) this.resource.update(dt);
  }

  /**
   * Notify that a parkour move was performed (for passive/run conditionals).
   */
  onParkourMove(moveType) {
    this.consecutiveParkourMoves++;
    // Generators that build resource on parkour could hook here
  }

  /**
   * Reset combo state (e.g. on taking damage).
   */
  resetCombo() {
    this.comboCounter = 0;
    this.consecutiveParkourMoves = 0;
  }

  /**
   * Reset all cooldowns (for debug / checkpoint / ultimate effects).
   */
  resetAllCooldowns() {
    if (!window.__DEV__) return;
    this.cooldowns.clear();
    for (const [skillId, max] of this._getAllChargeSkills()) {
      this.charges.set(skillId, max);
    }
  }

  /**
   * Toggle no-cooldown mode (for zero_cooldown ultimate).
   */
  setNoCooldown(enabled) {
    this._noCooldown = enabled;
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                   */
  /* ------------------------------------------------------------------ */

  _resolveStats(assigned) {
    return resolveSkillStats(assigned.base, assigned.runeId, this.passiveBonuses);
  }

  _applyCDR(cooldown) {
    if (cooldown <= 0) return 0;
    return cooldown * (1 - this.cooldownReduction);
  }

  _getMaxChargesForSkill(skillId) {
    const skill = this.skills[skillId];
    return skill ? (skill.maxCharges || 1) : 1;
  }

  _getBaseCooldown(skillId) {
    const skill = this.skills[skillId];
    return skill ? (skill.cooldown || 0) : 0;
  }

  _getAllChargeSkills() {
    const result = [];
    for (const [skillId, skill] of Object.entries(this.skills)) {
      if (skill.maxCharges && skill.maxCharges > 1) {
        result.push([skillId, skill.maxCharges]);
      }
    }
    return result;
  }

  serialize() {
    return {
      archetypeId: this.archetypeId,
      slots: Object.fromEntries(
        Object.entries(this.slots).map(([k, v]) => [k, v ? { skillId: v.skillId, runeId: v.runeId } : null])
      ),
      cooldowns: Array.from(this.cooldowns.entries()),
      charges: Array.from(this.charges.entries()),
      cdr: this.cooldownReduction,
      resource: this.resource ? this.resource.serialize() : null
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.slots) {
      for (const [slot, info] of Object.entries(data.slots)) {
        if (info) this.assignSkill(slot, info.skillId, info.runeId);
      }
    }
    if (data.cooldowns) this.cooldowns = new Map(data.cooldowns);
    if (data.charges) this.charges = new Map(data.charges);
    if (data.cdr !== undefined) this.cooldownReduction = data.cdr;
    if (data.resource && this.resource) this.resource.deserialize(data.resource);
  }
}
