/**
 * TerritorySystem.js
 * Manages 12 warehouse sectors with faction control meters.
 * Pure data module — no Three.js objects.
 */

export const SECTORS = [
  'sector_1', 'sector_2', 'sector_3', 'sector_4',
  'sector_5', 'sector_6', 'sector_7', 'sector_8',
  'sector_9', 'sector_10', 'sector_11', 'sector_12'
];

const DEFENSE_INTERVAL = 1200; // 20 minutes in seconds

const SECTOR_CONFIG = {
  sector_1:  { name: 'Loading Bay Alpha',    controllingFaction: 'vanguard', benefits: { hasHealthStation: true,  hasFastTravel: false, hasScavengerNPC: true,  scrapBonus: 1.0 } },
  sector_2:  { name: 'Cold Storage Beta',      controllingFaction: 'synapse',  benefits: { hasHealthStation: true,  hasFastTravel: false, hasScavengerNPC: false, scrapBonus: 1.0 } },
  sector_3:  { name: 'Assembly Line Gamma',    controllingFaction: 'hollow',   benefits: { hasHealthStation: false, hasFastTravel: false, hasScavengerNPC: true,  scrapBonus: 1.25 } },
  sector_4:  { name: 'Maintenance Shaft Delta',controllingFaction: 'vanguard', benefits: { hasHealthStation: false, hasFastTravel: true,  hasScavengerNPC: false, scrapBonus: 1.0 } },
  sector_5:  { name: 'Smelting Floor Epsilon', controllingFaction: 'hollow',   benefits: { hasHealthStation: true,  hasFastTravel: false, hasScavengerNPC: false, scrapBonus: 1.5 } },
  sector_6:  { name: 'Conveyor Maze Zeta',     controllingFaction: 'synapse',  benefits: { hasHealthStation: false, hasFastTravel: true,  hasScavengerNPC: true,  scrapBonus: 1.0 } },
  sector_7:  { name: 'Hazard Vault Eta',       controllingFaction: 'vanguard', benefits: { hasHealthStation: true,  hasFastTravel: true,  hasScavengerNPC: false, scrapBonus: 1.0 } },
  sector_8:  { name: 'Scrapyard Theta',        controllingFaction: 'hollow',   benefits: { hasHealthStation: false, hasFastTravel: false, hasScavengerNPC: true,  scrapBonus: 2.0 } },
  sector_9:  { name: 'Control Room Iota',      controllingFaction: 'synapse',  benefits: { hasHealthStation: true,  hasFastTravel: true,  hasScavengerNPC: false, scrapBonus: 1.0 } },
  sector_10: { name: 'Freight Lift Kappa',     controllingFaction: 'vanguard', benefits: { hasHealthStation: false, hasFastTravel: false, hasScavengerNPC: true,  scrapBonus: 1.0 } },
  sector_11: { name: 'Reactor Access Lambda',  controllingFaction: 'hollow',   benefits: { hasHealthStation: true,  hasFastTravel: false, hasScavengerNPC: false, scrapBonus: 1.5 } },
  sector_12: { name: 'Director\'s Overlook',   controllingFaction: 'synapse',  benefits: { hasHealthStation: false, hasFastTravel: true,  hasScavengerNPC: true,  scrapBonus: 1.0 } }
};

export class TerritorySystem {
  constructor(world = null, factionSystem = null) {
    this.world = world;
    this.factionSystem = factionSystem;
    this._sectors = new Map();

    for (const id of SECTORS) {
      const cfg = SECTOR_CONFIG[id];
      this._sectors.set(id, {
        id,
        name: cfg.name,
        control: 0,
        controllingFaction: cfg.controllingFaction,
        liberated: false,
        defenseTimer: 0,
        lastLiberationTime: 0,
        benefits: { ...cfg.benefits }
      });
    }

    this._pendingCounterAttack = null;
  }

  /* ---------- Queries ---------- */

  getSectorControl(sectorId) {
    const s = this._getSector(sectorId);
    return s ? s.control : 0;
  }

  getControllingFaction(sectorId) {
    const s = this._getSector(sectorId);
    return s ? s.controllingFaction : null;
  }

  isLiberated(sectorId) {
    const s = this._getSector(sectorId);
    return s ? s.liberated : false;
  }

  getSectorData(sectorId) {
    const s = this._getSector(sectorId);
    return s ? { ...s, benefits: { ...s.benefits } } : null;
  }

  /* ---------- Liberation ---------- */

  liberateSector(sectorId) {
    const s = this._getSector(sectorId);
    if (!s) return false;

    const previousFaction = s.controllingFaction;

    s.control = 100;
    s.liberated = true;
    s.defenseTimer = DEFENSE_INTERVAL;
    s.lastLiberationTime = Date.now();

    // Notify faction system of the liberation.
    if (this.factionSystem && typeof this.factionSystem.onSectorLiberated === 'function') {
      this.factionSystem.onSectorLiberated(previousFaction);
    }

    return true;
  }

  setSectorControl(sectorId, value) {
    const s = this._getSector(sectorId);
    if (!s) return false;
    s.control = Math.max(0, Math.min(100, value));
    if (s.control < 100) {
      s.liberated = false;
    }
    return true;
  }

  /* ---------- Defense / Counter-Attack ---------- */

  update(dt) {
    if (dt <= 0) return;

    for (const s of this._sectors.values()) {
      if (s.liberated && s.defenseTimer > 0) {
        s.defenseTimer -= dt;
        if (s.defenseTimer <= 0) {
          s.defenseTimer = 0;
          this._pendingCounterAttack = s.id;
        }
      }
    }
  }

  checkCounterAttack() {
    if (this._pendingCounterAttack) {
      const id = this._pendingCounterAttack;
      this._pendingCounterAttack = null;
      return id;
    }
    return null;
  }

  resolveCounterAttack(sectorId, playerPresent, playerWon) {
    const s = this._getSector(sectorId);
    if (!s || !s.liberated) return false;

    if (playerPresent) {
      if (playerWon) {
        // Player successfully defended — reset the timer.
        s.defenseTimer = DEFENSE_INTERVAL;
        return true;
      } else {
        // Player lost — sector falls back to enemy control.
        s.control = 0;
        s.liberated = false;
        s.defenseTimer = 0;
        return false;
      }
    } else {
      // Player absent: 50% chance the sector reverts.
      const reverted = Math.random() < 0.5;
      if (reverted) {
        s.control = 0;
        s.liberated = false;
        s.defenseTimer = 0;
        return false;
      } else {
        // Attack repelled off-screen — reset timer.
        s.defenseTimer = DEFENSE_INTERVAL;
        return true;
      }
    }
  }

  /* ---------- Benefits ---------- */

  getSectorBenefits(sectorId) {
    const s = this._getSector(sectorId);
    if (!s) {
      return { hasHealthStation: false, hasFastTravel: false, hasScavengerNPC: false, scrapBonus: 0 };
    }
    // Benefits only apply to liberated sectors.
    if (!s.liberated) {
      return { hasHealthStation: false, hasFastTravel: false, hasScavengerNPC: false, scrapBonus: 0 };
    }
    return { ...s.benefits };
  }

  /* ---------- Endgame ---------- */

  getLiberatedCount() {
    let count = 0;
    for (const s of this._sectors.values()) {
      if (s.liberated) count++;
    }
    return count;
  }

  isAllLiberated() {
    return this.getLiberatedCount() === SECTORS.length;
  }

  /* ---------- Internal ---------- */

  _getSector(sectorId) {
    return this._sectors.get(sectorId) || null;
  }

  /* ---------- Serialization ---------- */

  serialize() {
    const data = {};
    for (const [id, s] of this._sectors) {
      data[id] = {
        control: s.control,
        controllingFaction: s.controllingFaction,
        liberated: s.liberated,
        defenseTimer: s.defenseTimer,
        lastLiberationTime: s.lastLiberationTime,
        benefits: { ...s.benefits }
      };
    }
    return { sectors: data };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object' || !data.sectors) return;

    for (const id of SECTORS) {
      const incoming = data.sectors[id];
      if (!incoming) continue;
      const s = this._sectors.get(id);
      if (!s) continue;

      if (typeof incoming.control === 'number') {
        s.control = Math.max(0, Math.min(100, incoming.control));
      }
      if (typeof incoming.controllingFaction === 'string') {
        s.controllingFaction = incoming.controllingFaction;
      }
      if (typeof incoming.liberated === 'boolean') {
        s.liberated = incoming.liberated;
      }
      if (typeof incoming.defenseTimer === 'number') {
        s.defenseTimer = Math.max(0, incoming.defenseTimer);
      }
      if (typeof incoming.lastLiberationTime === 'number') {
        s.lastLiberationTime = incoming.lastLiberationTime;
      }
      if (incoming.benefits && typeof incoming.benefits === 'object') {
        s.benefits = {
          hasHealthStation: !!incoming.benefits.hasHealthStation,
          hasFastTravel:    !!incoming.benefits.hasFastTravel,
          hasScavengerNPC:  !!incoming.benefits.hasScavengerNPC,
          scrapBonus:       typeof incoming.benefits.scrapBonus === 'number' ? incoming.benefits.scrapBonus : s.benefits.scrapBonus
        };
      }
    }
  }
}
