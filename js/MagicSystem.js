/**
 * MagicSystem — mana pool, spell casting, cooldowns, spell book.
 *
 * Hybrid design:
 *   - Mage archetype: full spell kit + fastest mana regen
 *   - Other archetypes: can equip 1–2 spell gems for limited magic access
 */

import * as THREE from 'three';

export const SPELL_GEM_SLOTS = 2;

export class MagicSystem {
    constructor(player, resourceSystem, scene) {
        this.player = player;
        this.resourceSystem = resourceSystem;
        this.scene = scene;

        // Spell gem slots for non-mage archetypes
        this.spellGems = [null, null]; // { spellId, cooldown, cooldownMax }

        // Arcane bolt combo counter for Overcharge rune
        this.arcaneBoltCount = 0;

        // Frost armor state
        this.frostArmorActive = false;

        // Mana regen bonuses
        this.manaRegenBase = 5;      // per second
        this.manaRegenGrounded = 15; // per second while grounded

        // Spellbook: unlocked spell IDs (for scroll learning)
        this.spellbook = new Set(['arcane_bolt', 'fireball', 'frost_armor', 'lightning_chain', 'void_rift']);
    }

    /* ------------------------------------------------------------------ */
    /*  Mana regeneration                                                 */
    /* ------------------------------------------------------------------ */

    update(dt) {
        if (!this.resourceSystem || this.resourceSystem.type !== 'mana') return;

        let regen = this.manaRegenBase;
        if (this.player && this.player.grounded) regen = this.manaRegenGrounded;

        // Mage archetype gets faster regen
        if (this.player && this.player._archetypeId === 'mage') {
            regen *= 1.5;
        }

        // Passive tree bonus
        const stats = this.player && this.player.getRPGStats ? this.player.getRPGStats() : {};
        const manaRegenBonus = stats.manaRegen || 0;
        regen *= (1 + manaRegenBonus);

        this.resourceSystem.generate(regen * dt);

        // Update spell gem cooldowns
        for (const gem of this.spellGems) {
            if (gem && gem.cooldown > 0) gem.cooldown -= dt;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Spell gem equipping (for non-mage)                                */
    /* ------------------------------------------------------------------ */

    equipSpellGem(spellId, slotIndex) {
        if (slotIndex < 0 || slotIndex >= SPELL_GEM_SLOTS) return false;
        if (!this.spellbook.has(spellId)) return false;
        const skill = this._getSkillData(spellId);
        if (!skill) return false;
        this.spellGems[slotIndex] = {
            spellId,
            cooldown: 0,
            cooldownMax: skill.cooldown || 5.0
        };
        return true;
    }

    unequipSpellGem(slotIndex) {
        if (slotIndex < 0 || slotIndex >= SPELL_GEM_SLOTS) return false;
        this.spellGems[slotIndex] = null;
        return true;
    }

    canCastGem(slotIndex) {
        const gem = this.spellGems[slotIndex];
        if (!gem) return false;
        if (gem.cooldown > 0) return false;
        const skill = this._getSkillData(gem.spellId);
        if (!skill) return false;
        const cost = skill.resourceCost || 0;
        return this.resourceSystem && this.resourceSystem.canSpend && this.resourceSystem.canSpend(cost);
    }

    castGem(slotIndex, skillSystem) {
        if (!this.canCastGem(slotIndex)) return false;
        const gem = this.spellGems[slotIndex];
        const skill = this._getSkillData(gem.spellId);
        const cost = skill.resourceCost || 0;
        if (this.resourceSystem) this.resourceSystem.spend(cost);
        gem.cooldown = gem.cooldownMax;
        if (skillSystem) skillSystem.useSkillById(gem.spellId);
        return true;
    }

    _getSkillData(spellId) {
        // Lazy import to avoid circular dependency
        try {
            const { ACTIVE_SKILLS } = require('./SkillData.js');
            for (const archetype of Object.values(ACTIVE_SKILLS)) {
                if (archetype[spellId]) return archetype[spellId];
            }
        } catch (e) {
            // In ES modules, we can't require — caller must pass skill data
        }
        return null;
    }

    /* ------------------------------------------------------------------ */
    /*  Spellbook                                                         */
    /* ------------------------------------------------------------------ */

    learnSpell(spellId) {
        if (this.spellbook.has(spellId)) return false;
        this.spellbook.add(spellId);
        return true;
    }

    hasSpell(spellId) {
        return this.spellbook.has(spellId);
    }

    /* ------------------------------------------------------------------ */
    /*  Frost armor damage absorption                                     */
    /* ------------------------------------------------------------------ */

    absorbDamage(amount) {
        if (!this.player || !this.player._frostArmorAbsorb) return amount;
        const absorb = Math.min(amount, this.player._frostArmorAbsorb);
        this.player._frostArmorAbsorb -= absorb;
        if (this.player._frostArmorAbsorb <= 0) {
            this.player._frostArmorAbsorb = 0;
            // Shield break visual
            if (this.scene) {
                const burst = new THREE.Mesh(
                    new THREE.SphereGeometry(1.5, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5 })
                );
                burst.position.copy(this.player.position);
                this.scene.add(burst);
                setTimeout(() => { this.scene.remove(burst); burst.geometry.dispose(); burst.material.dispose(); }, 300);
            }
        }
        return amount - absorb;
    }

    /* ------------------------------------------------------------------ */
    /*  Arcane bolt combo                                                 */
    /* ------------------------------------------------------------------ */

    onArcaneBoltCast() {
        this.arcaneBoltCount++;
        if (this.arcaneBoltCount >= 4) {
            this.arcaneBoltCount = 0;
            return true; // overcharged
        }
        return false;
    }
}
