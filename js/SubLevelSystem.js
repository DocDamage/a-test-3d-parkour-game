/**
 * SubLevelSystem.js
 * Procedural dungeon beneath the warehouse — infinite floors with scaling difficulty.
 * Pure data module — no Three.js objects.
 */

export const TILESETS = [
  'freezer',
  'factory',
  'server_farm',
  'flooded_basement',
  'maintenance_shaft'
];

export const ENEMY_ARCHETYPES = [
  'patrol_drone',
  'heavy_guard',
  'sniper_turret',
  'swarm_cluster',
  'hunter_killer'
];

export const MODIFIERS = [
  'dense_fog',
  'electrified_floors',
  'alarm_sprint',
  'low_gravity',
  'high_gravity',
  'malfunctioning_lights',
  'toxic_leak',
  'reinforced_armor'
];

const BOSS_NAMES = [
  'Deep-Freeze Leviathan',
  'Assembly-Line Tyrant',
  'Root-Access Colossus',
  'Drowned Warden',
  'Shaft-Crawler Prime'
];

const MINI_BOSS_NAMES = [
  'Frost Sentinel',
  'Forge Keeper',
  'Packet Guardian',
  'Leak Overseer',
  'Elevator Shade'
];

export class SubLevelSystem {
  /**
   * @param {World} world
   * @param {Player} player
   * @param {FactionSystem|null} [factionSystem]
   */
  constructor(world, player, factionSystem = null) {
    this.world = world;
    this.player = player;
    this.factionSystem = factionSystem;

    /** @type {object|null} current floor data */
    this._currentFloor = null;

    /** @type {number|null} floor number currently entered */
    this._currentFloorNumber = null;

    /** @type {number} deepest floor ever reached */
    this._deepestReached = 0;

    /** @type {object[]} loot accumulated on current dive */
    this._diveLoot = [];

    /** @type {number|null} player level on entry (caps effective stats) */
    this._entryLevel = null;

    /** @type {boolean} whether a dive is currently active */
    this._inDive = false;

    /** @type {object[]} history of completed / failed dives */
    this._diveHistory = [];
  }

  /* ============================================================
     FLOOR GENERATION
     ============================================================ */

  /**
   * Generate procedural floor data for a given floor number.
   * @param {number} floorNumber — 1-based
   * @returns {{id: string, floorNumber: number, tileset: string, enemies: object[], modifiers: string[], loot: object[], bossRoom: object|null}}
   */
  generateFloor(floorNumber) {
    const tileset = TILESETS[(floorNumber - 1) % TILESETS.length];
    const scaling = 1 + (floorNumber - 1) * 0.05;

    const enemyCount = Math.min(3 + Math.floor(floorNumber / 3), 12);
    const enemies = [];
    for (let i = 0; i < enemyCount; i++) {
      const archetype = this._pickEnemyArchetype(floorNumber);
      enemies.push({
        id: `f${floorNumber}_e${i}`,
        archetype,
        hp: Math.round(100 * scaling),
        damage: Math.round(10 * scaling),
        speed: Math.round(5 * scaling * 10) / 10,
        faction: this._deriveFaction(archetype)
      });
    }

    const modifiers = this._rollModifiers(floorNumber);
    const loot = this._rollLoot(floorNumber);

    const bossRoom = this._generateBossRoom(floorNumber, scaling);

    return {
      id: `sublevel_${floorNumber}_${Date.now()}`,
      floorNumber,
      tileset,
      enemies,
      modifiers,
      loot,
      bossRoom
    };
  }

  /* ============================================================
     DIVE LIFECYCLE
     ============================================================ */

  /**
   * Enter a specific floor, starting or continuing a dive.
   * @param {number} floorNumber
   * @returns {object|null} the floor data, or null if already at surface in a dive
   */
  enterFloor(floorNumber) {
    if (!this._inDive) {
      this._startDive();
    }

    const floor = this.generateFloor(floorNumber);
    this._currentFloor = floor;
    this._currentFloorNumber = floorNumber;

    if (floorNumber > this._deepestReached) {
      this._deepestReached = floorNumber;
    }

    return floor;
  }

  /**
   * Exit to the surface, banking all dive loot.
   * @returns {object[]} the loot that was banked
   */
  exitToSurface() {
    const banked = [...this._diveLoot];
    this._diveHistory.push({
      floorsVisited: this._currentFloorNumber || 0,
      deepestFloor: this._deepestReached,
      lootBanked: banked,
      exitedAt: Date.now(),
      died: false
    });

    this._resetDive();
    return banked;
  }

  /**
   * Call when the player dies inside a sub-level.
   * All dive loot is lost and the player respawns at the surface.
   * @returns {object[]} the loot that was lost
   */
  onDeathInSubLevel() {
    const lost = [...this._diveLoot];
    this._diveHistory.push({
      floorsVisited: this._currentFloorNumber || 0,
      deepestFloor: this._deepestReached,
      lootLost: lost,
      exitedAt: Date.now(),
      died: true
    });

    this._resetDive();

    if (this.player && typeof this.player.respawn === 'function') {
      this.player.respawn();
    }
    return lost;
  }

  /* ============================================================
     QUERIES
     ============================================================ */

  /** @returns {object|null} */
  getCurrentFloor() {
    return this._currentFloor ? { ...this._currentFloor } : null;
  }

  /** @returns {number} */
  getDeepestReached() {
    return this._deepestReached;
  }

  /** @returns {object[]} shallow copy of current dive loot */
  getLootFromCurrentDive() {
    return this._diveLoot.map(l => ({ ...l }));
  }

  /** @returns {boolean} */
  isInDive() {
    return this._inDive;
  }

  /** @returns {number|null} */
  getEntryLevel() {
    return this._entryLevel;
  }

  /**
   * Get the effective stat cap for the current dive.
   * Player stats are treated as capped at entry level.
   * @returns {number|null}
   */
  getEffectiveLevelCap() {
    return this._entryLevel;
  }

  /* ============================================================
     UPDATE
     ============================================================ */

  /**
   * @param {number} dt
   * @param {Player} player
   */
  update(dt, player) {
    if (!this._inDive || !this._currentFloor) return;

    // If player health drops to zero, trigger sub-level death
    if (player && typeof player.health === 'number' && player.health <= 0) {
      this.onDeathInSubLevel();
    }
  }

  /* ============================================================
     SERIALIZATION
     ============================================================ */

  serialize() {
    return {
      deepestReached: this._deepestReached,
      diveHistory: this._diveHistory.map(h => ({ ...h, lootBanked: h.lootBanked ? [...h.lootBanked] : undefined, lootLost: h.lootLost ? [...h.lootLost] : undefined })),
      currentDive: this._inDive ? {
        currentFloorNumber: this._currentFloorNumber,
        currentFloor: this._currentFloor ? { ...this._currentFloor } : null,
        diveLoot: this._diveLoot.map(l => ({ ...l })),
        entryLevel: this._entryLevel
      } : null
    };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;

    this._deepestReached = data.deepestReached || 0;
    this._diveHistory = Array.isArray(data.diveHistory) ? data.diveHistory.map(h => ({
      floorsVisited: h.floorsVisited || 0,
      deepestFloor: h.deepestFloor || 0,
      lootBanked: Array.isArray(h.lootBanked) ? h.lootBanked.map(l => ({ ...l })) : undefined,
      lootLost: Array.isArray(h.lootLost) ? h.lootLost.map(l => ({ ...l })) : undefined,
      exitedAt: h.exitedAt || Date.now(),
      died: !!h.died
    })) : [];

    if (data.currentDive) {
      this._inDive = true;
      this._currentFloorNumber = data.currentDive.currentFloorNumber || null;
      this._currentFloor = data.currentDive.currentFloor ? { ...data.currentDive.currentFloor } : null;
      this._diveLoot = Array.isArray(data.currentDive.diveLoot) ? data.currentDive.diveLoot.map(l => ({ ...l })) : [];
      this._entryLevel = data.currentDive.entryLevel || null;
    } else {
      this._resetDive();
    }
  }

  /* ============================================================
     INTERNALS
     ============================================================ */

  _startDive() {
    this._inDive = true;
    this._diveLoot = [];
    this._entryLevel = this._getPlayerLevel();
  }

  _resetDive() {
    this._inDive = false;
    this._currentFloor = null;
    this._currentFloorNumber = null;
    this._diveLoot = [];
    this._entryLevel = null;
  }

  _getPlayerLevel() {
    if (this.player && this.player.characterSheet) {
      return this.player.characterSheet.getLevel();
    }
    return 1;
  }

  _pickEnemyArchetype(floorNumber) {
    const pool = [...ENEMY_ARCHETYPES];
    if (floorNumber >= 10) pool.push('hunter_killer');
    if (floorNumber >= 20) pool.push('swarm_cluster');
    return pool[Math.floor(Math.random() * pool.length)];
  }

  _deriveFaction(archetype) {
    if (!this.factionSystem) return null;
    const mapping = {
      patrol_drone: 'vanguard',
      heavy_guard: 'vanguard',
      sniper_turret: 'synapse',
      swarm_cluster: 'synapse',
      hunter_killer: 'hollow'
    };
    return mapping[archetype] || null;
  }

  _rollModifiers(floorNumber) {
    const count = Math.min(Math.floor(floorNumber / 5), 3);
    const shuffled = [...MODIFIERS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  _rollLoot(floorNumber) {
    const loot = [];
    const baseLoot = Math.min(2 + Math.floor(floorNumber / 4), 6);
    for (let i = 0; i < baseLoot; i++) {
      loot.push(this._generateLootItem(floorNumber));
    }
    return loot;
  }

  _generateLootItem(floorNumber) {
    const r = Math.random();
    let rarity = 'common';
    if (r > 0.95) rarity = 'legendary';
    else if (r > 0.80) rarity = 'epic';
    else if (r > 0.55) rarity = 'rare';

    const types = ['chip', 'scrap', 'implant_fragment', 'weapon_mod', 'consumable'];
    const type = types[Math.floor(Math.random() * types.length)];

    return {
      id: `loot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      rarity,
      floor: floorNumber,
      value: Math.round(10 * floorNumber * (rarity === 'legendary' ? 5 : rarity === 'epic' ? 3 : rarity === 'rare' ? 2 : 1))
    };
  }

  _generateBossRoom(floorNumber, scaling) {
    const isMiniBoss = floorNumber % 5 === 0 && floorNumber % 25 !== 0;
    const isUniqueBoss = floorNumber % 25 === 0;

    if (!isMiniBoss && !isUniqueBoss) return null;

    const tilesetIndex = (floorNumber - 1) % TILESETS.length;
    const name = isUniqueBoss
      ? BOSS_NAMES[tilesetIndex]
      : MINI_BOSS_NAMES[tilesetIndex];

    const hpMult = isUniqueBoss ? 10 : 4;
    const dmgMult = isUniqueBoss ? 3 : 1.5;

    return {
      type: isUniqueBoss ? 'unique_boss' : 'mini_boss',
      name,
      boss: {
        hp: Math.round(500 * scaling * hpMult),
        damage: Math.round(25 * scaling * dmgMult),
        speed: Math.round(6 * scaling * 10) / 10
      },
      guaranteedLoot: [
        this._generateLootItem(floorNumber + 5),
        this._generateLootItem(floorNumber + 5)
      ]
    };
  }
}
