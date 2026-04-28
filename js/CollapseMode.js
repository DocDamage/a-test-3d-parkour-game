/**
 * CollapseMode.js
 * Roguelite gauntlet mode with procedural floors and meta-unlocks.
 * Pure data module — does not create Three.js objects.
 */

const TOTAL_FLOORS = 10;

const LAYOUT_TYPES = [
  'warehouse_a',
  'warehouse_b',
  'vertical_shaft',
  'conveyor_maze',
  'open_yard',
  'maintenance_tunnel',
  'reactor_core',
  'hazard_vault'
];

const ENEMY_SQUADS = [
  'patrol_pair',
  'heavy_solo',
  'drone_swarm',
  'mixed_trio',
  'elite_duo',
  'sniper_nest',
  'brute_pack',
  'hacker_support'
];

const ARENA_MODIFIERS = [
  'none',
  'low_gravity',
  'toxic_fog',
  'laser_grid',
  'emp_burst',
  'overclocked_drones',
  'crumbling_floor'
];

const UPGRADE_POOL = [
  { id: 'w_starter_pistol', type: 'weapon', name: 'Starter Pistol', slot: 'optics', rarity: 1 },
  { id: 'w_scrap_blade', type: 'weapon', name: 'Scrap Blade', slot: 'gloves', rarity: 1 },
  { id: 'w_shock_baton', type: 'weapon', name: 'Shock Baton', slot: 'gloves', rarity: 2 },
  { id: 'g_patch_frame', type: 'gear', name: 'Patch Frame', slot: 'frame', rarity: 1, stats: { maxHealth: 10 } },
  { id: 'g_worn_boots', type: 'gear', name: 'Worn Boots', slot: 'boots', rarity: 1, stats: { moveSpeedMult: 0.05 } },
  { id: 's_dash_master', type: 'skill', name: 'Dash Master', effect: { dashCostReduction: 0.5 } },
  { id: 's_wallrun_flow', type: 'skill', name: 'Wallrun Flow', effect: { wallrunStaminaCost: -0.3 } },
  { id: 'st_mob', type: 'stat', name: '+1 Mobility', stat: 'mob', value: 1 },
  { id: 'st_ref', type: 'stat', name: '+1 Reflexes', stat: 'ref', value: 1 },
  { id: 'st_for', type: 'stat', name: '+1 Fortitude', stat: 'for', value: 1 },
  { id: 'c_health_pack', type: 'consumable', name: 'Health Pack', effect: { health: 25 } },
  { id: 'c_stim_injector', type: 'consumable', name: 'Stim Injector', effect: { stamina: 40 } }
];

const META_UNLOCKS = {
  collapse_participant: { name: 'Collapse Participant', kind: 'title' },
  collapse_scavenger: { name: 'Collapse Scavenger', kind: 'cosmetic' },
  collapse_veteran: { name: 'Collapse Veteran', kind: 'cosmetic' },
  collapse_legend: { name: 'Collapse Legend', kind: 'cosmetic' },
  starter_knife: { name: 'Starter Knife', kind: 'starting_gear' },
  aeroframe_starter: { name: 'AeroFrame (Starter)', kind: 'starting_gear' }
};

function pickRandom(arr, count) {
  const pool = arr.slice();
  const result = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

function generateFloorDescriptor(floorNumber) {
  return {
    floorNumber,
    layout: pickRandom(LAYOUT_TYPES, 1)[0],
    enemySquad: pickRandom(ENEMY_SQUADS, 1)[0],
    arenaModifier: pickRandom(ARENA_MODIFIERS, 1)[0],
    hasLootRoom: floorNumber % 3 === 0,
    hasBoss: floorNumber % 5 === 0
  };
}

export class CollapseMode {
  /**
   * @param {object} world — the World instance
   * @param {object} player — the Player instance
   * @param {CharacterSheet} characterSheet
   * @param {ExoSuitSystem} exoSuit
   * @param {string} archetype — player archetype string
   */
  constructor(world, player, characterSheet, exoSuit, archetype) {
    this.world = world;
    this.player = player;
    this.characterSheet = characterSheet;
    this.exoSuit = exoSuit;
    this.archetype = archetype || 'runner';

    /** @type {boolean} */
    this._unlocked = false;

    /** @type {boolean} */
    this._inRun = false;

    /** @type {number} */
    this._currentFloor = 0;

    /** @type {object[]} */
    this._floors = [];

    /** @type {object[]} */
    this._runUpgrades = [];

    /** @type {object} */
    this._runStats = {
      kills: 0,
      time: 0,
      floorsCleared: 0,
      upgradesTaken: 0
    };

    /** @type {Set<string>} */
    this._metaUnlocks = new Set();
  }

  /* ---------- Unlock ---------- */

  isUnlocked() {
    return this._unlocked;
  }

  /** Call this once all 5 bosses have been defeated. */
  unlock() {
    this._unlocked = true;
  }

  /* ---------- Run Lifecycle ---------- */

  startRun() {
    if (!this._unlocked) {
      window.__DEV__ && console.warn('CollapseMode: not unlocked');
      return false;
    }

    this._inRun = true;
    this._currentFloor = 1;
    this._runUpgrades = [];
    this._runStats = {
      kills: 0,
      time: 0,
      floorsCleared: 0,
      upgradesTaken: 0
    };

    this._floors = [];
    for (let i = 1; i <= TOTAL_FLOORS; i++) {
      this._floors.push(generateFloorDescriptor(i));
    }

    return true;
  }

  /**
   * @param {boolean} success — true if the run was completed successfully
   * @returns {object|null} final run stats, or null if no run was active
   */
  endRun(success) {
    if (!this._inRun) {
      window.__DEV__ && console.warn('CollapseMode: no active run to end');
      return null;
    }

    this._inRun = false;

    // Meta-unlock logic
    this._metaUnlocks.add('collapse_participant');

    if (this._currentFloor >= 5) {
      this._metaUnlocks.add('collapse_scavenger');
    }

    if (success) {
      this._metaUnlocks.add('collapse_veteran');
      this._metaUnlocks.add('starter_knife');
      this._metaUnlocks.add('collapse_legend');
      this._metaUnlocks.add('aeroframe_starter');
    }

    return { ...this._runStats, success };
  }

  /* ---------- Floor Management ---------- */

  getCurrentFloor() {
    if (!this._inRun) return null;
    const descriptor = this._floors[this._currentFloor - 1];
    return descriptor ? { ...descriptor } : null;
  }

  advanceFloor() {
    if (!this._inRun) return false;

    this._runStats.floorsCleared = Math.max(this._runStats.floorsCleared, this._currentFloor);
    this._currentFloor++;

    if (this._currentFloor > TOTAL_FLOORS) {
      this.endRun(true);
      return true;
    }

    return true;
  }

  /* ---------- Upgrades ---------- */

  getFloorUpgradeOptions() {
    if (!this._inRun) return [];
    const options = pickRandom(UPGRADE_POOL, 3);
    return options.map(o => ({ ...o }));
  }

  chooseUpgrade(upgrade) {
    if (!this._inRun) {
      window.__DEV__ && console.warn('CollapseMode: cannot choose upgrade outside of a run');
      return false;
    }

    if (!upgrade || !upgrade.id) {
      window.__DEV__ && console.warn('CollapseMode: invalid upgrade');
      return false;
    }

    this._runUpgrades.push({ ...upgrade });
    this._runStats.upgradesTaken++;

    // Apply immediate effects where possible
    if (upgrade.type === 'stat' && upgrade.stat && this.characterSheet) {
      const stats = this.characterSheet._stats || this.characterSheet.stats;
      if (stats && typeof stats[upgrade.stat] === 'number' && typeof upgrade.value === 'number') {
        stats[upgrade.stat] += upgrade.value;
      }
    }

    if (upgrade.type === 'gear' && upgrade.slot && this.exoSuit) {
      const item = {
        id: upgrade.id,
        name: upgrade.name,
        slot: upgrade.slot,
        rarity: upgrade.rarity || 1,
        baseStats: upgrade.stats || {}
      };
      if (typeof this.exoSuit.equip === 'function') {
        this.exoSuit.equip(item);
      }
    }

    if (upgrade.type === 'consumable' && upgrade.effect && this.player) {
      for (const [prop, val] of Object.entries(upgrade.effect)) {
        if (prop === 'health' && typeof this.player.health === 'number') {
          this.player.health = Math.min(this.player.maxHealth || Infinity, this.player.health + val);
        } else if (prop === 'stamina' && typeof this.player.stamina === 'number') {
          this.player.stamina = Math.min(this.player.maxStamina || Infinity, this.player.stamina + val);
        }
      }
    }

    return true;
  }

  /* ---------- Stats & Meta ---------- */

  getRunStats() {
    return { ...this._runStats };
  }

  getMetaUnlocks() {
    return Array.from(this._metaUnlocks).map(id => ({
      id,
      ...(META_UNLOCKS[id] || { name: id, kind: 'unknown' })
    }));
  }

  /* ---------- Update ---------- */

  /** Call from _handleEnemyKilled when collapse run is active. */
  onEnemyKilled(enemy) {
    if (!this._inRun) return;
    this._runStats.kills = (this._runStats.kills || 0) + 1;
  }

  update(dt, player) {
    if (!this._inRun) return;
    if (dt <= 0) return;

    this._runStats.time += dt;

    if (player && typeof player.health === 'number' && player.health <= 0) {
      this.endRun(false);
    }
  }

  /* ---------- Serialization ---------- */

  serialize() {
    return {
      unlocked: this._unlocked,
      metaUnlocks: Array.from(this._metaUnlocks)
    };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;

    if (typeof data.unlocked === 'boolean') {
      this._unlocked = data.unlocked;
    }

    if (Array.isArray(data.metaUnlocks)) {
      this._metaUnlocks = new Set(data.metaUnlocks.filter(id => typeof id === 'string'));
    }
  }
}
