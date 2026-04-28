/**
 * BlackoutSystem.js
 * Global event scheduler for warehouse-wide crises and opportunities.
 * Pure data module — no Three.js objects.
 */

export const EVENT_TYPES = {
  GRID_FAILURE: 'grid_failure',
  OVERCLOCK_SURGE: 'overclock_surge',
  DRONE_MIGRATION: 'drone_migration',
  LOCKDOWN: 'lockdown',
  SCRAP_FEVER: 'scrap_fever',
};

const EVENT_CONFIG = {
  [EVENT_TYPES.GRID_FAILURE]: {
    name: 'Grid Failure',
    description: 'Lights out for 6 hours. Drone vision halved. Perfect stealth window.',
    durationHours: 6,
    effects: {
      droneVisionMult: 0.5,
      playerDetectionRadiusMult: 0.5,
      lockLights: true,
    },
  },
  [EVENT_TYPES.OVERCLOCK_SURGE]: {
    name: 'Overclock Surge',
    description: 'Abilities cost 0 flow. Health drains 1%/s. Speedrun window.',
    durationHours: 2,
    effects: {
      flowCostMult: 0,
      healthDrainPerSecond: 0.01,
      speedMult: 1.2,
    },
  },
  [EVENT_TYPES.DRONE_MIGRATION]: {
    name: 'Drone Migration',
    description: 'One faction floods a random sector. XP farm opportunity.',
    durationHours: 4,
    effects: {
      droneSpawnRateMult: 3.0,
      xpMult: 2.0,
    },
  },
  [EVENT_TYPES.LOCKDOWN]: {
    name: 'Lockdown',
    description: 'Arenas sealed. Forces hub / NPC interaction.',
    durationHours: 3,
    effects: {
      sealArenas: true,
      forceHub: true,
    },
  },
  [EVENT_TYPES.SCRAP_FEVER]: {
    name: 'Scrap Fever',
    description: 'All scrap values doubled for 1 hour.',
    durationHours: 1,
    effects: {
      scrapValueMult: 2.0,
    },
  },
};

const NPC_REACTIONS = {
  [EVENT_TYPES.GRID_FAILURE]: [
    { npcId: 'malik', dialogue: "Grid's down. My night-vision scrap just tripled in price.", priceMod: 3.0, tempQuest: 'black_market_vision' },
    { npcId: 'vega_npc', dialogue: "Darkness is a runner's best friend. Let's move.", tempQuest: 'stealth_run' },
    { npcId: 'dr_chen', dialogue: "Emergency generators won't last. Hurry if you need work done.", priceMod: 1.5 },
  ],
  [EVENT_TYPES.OVERCLOCK_SURGE]: [
    { npcId: 'vega_npc', dialogue: "Feel that hum? The grid is screaming. Push it harder.", tempQuest: 'speedrun_challenge' },
    { npcId: 'dr_chen', dialogue: "Your implants will overheat. I can stabilize them—for a fee.", priceMod: 2.0 },
    { npcId: 'scrap_broker', dialogue: "High risk, high reward. Need a loan to capitalize?", priceMod: 1.0 },
  ],
  [EVENT_TYPES.DRONE_MIGRATION]: [
    { npcId: 'malik', dialogue: "Drones everywhere means salvage everywhere. Bring me the cores.", tempQuest: 'core_harvest' },
    { npcId: 'vega_npc', dialogue: "Sector's hot. Race through it alive and you're legend.", tempQuest: 'hot_sector_race' },
    { npcId: 'informant', dialogue: "They are searching for something. I know where.", priceMod: 0.5, tempQuest: 'migration_secret' },
  ],
  [EVENT_TYPES.LOCKDOWN]: [
    { npcId: 'malik', dialogue: "Doors are sealed. Good time to trade, since we can't do much else.", priceMod: 0.9 },
    { npcId: 'dr_chen', dialogue: "Sit down. Let me run diagnostics while we wait.", priceMod: 0.8 },
    { npcId: 'scrap_broker', dialogue: "Lockdowns make people desperate. My favorite market condition.", priceMod: 1.2 },
  ],
  [EVENT_TYPES.SCRAP_FEVER]: [
    { npcId: 'malik', dialogue: "Prices are insane today. Sell now or regret it.", priceMod: 2.0 },
    { npcId: 'scrap_broker', dialogue: "I'll buy your debt for half price. Limited time.", priceMod: 0.5 },
    { npcId: 'old_man_rust', dialogue: "Scrap fever comes from the old reactor leak. Don't ask how I know.", tempQuest: 'reactor_history' },
  ],
};

const EVENT_INTERVAL_DAYS = 3;
const HOURS_PER_DAY = 24;

export class BlackoutSystem {
  constructor(world, player, npcSystem, factionSystem, territorySystem) {
    this.world = world;
    this.player = player;
    this.npcSystem = npcSystem;
    this.factionSystem = factionSystem;
    this.territorySystem = territorySystem;

    this._gameTime = 0; // in-game hours elapsed (continuous)
    this._activeEvent = null;
    this._eventHistory = [];
    this._lastEventTime = -EVENT_INTERVAL_DAYS * HOURS_PER_DAY; // allow first event after interval
  }

  /* ---------- Queries ---------- */

  getCurrentEvent() {
    if (!this._activeEvent) return null;
    return {
      type: this._activeEvent.type,
      config: { ...EVENT_CONFIG[this._activeEvent.type] },
      startedAt: this._activeEvent.startedAt,
      endsAt: this._activeEvent.endsAt,
      remainingHours: Math.max(0, this._activeEvent.endsAt - this._gameTime),
    };
  }

  getTimeUntilNextEvent() {
    if (this._activeEvent) return 0;
    const next = this._lastEventTime + (EVENT_INTERVAL_DAYS * HOURS_PER_DAY);
    return Math.max(0, next - this._gameTime);
  }

  /* ---------- Event Control ---------- */

  startEvent(eventType, durationHours = null) {
    if (!EVENT_CONFIG[eventType]) {
      throw new Error(`Unknown event type: ${eventType}`);
    }
    if (this._activeEvent) {
      this.endCurrentEvent();
    }

    const cfg = EVENT_CONFIG[eventType];
    const dur = durationHours !== null ? durationHours : cfg.durationHours;

    this._activeEvent = {
      type: eventType,
      startedAt: this._gameTime,
      endsAt: this._gameTime + dur,
    };

    this._lastEventTime = this._gameTime;
    this._eventHistory.push({
      type: eventType,
      startedAt: this._gameTime,
      duration: dur,
    });
    if (this._eventHistory.length > 100) this._eventHistory.shift();

    // Apply NPC reactions as temporary quest flags
    const reactions = NPC_REACTIONS[eventType] || [];
    for (const r of reactions) {
      if (this.npcSystem && typeof this.npcSystem.advanceQuest === 'function') {
        // Use negative quest stages for temporary event quests so they don't collide with normal progression
        this.npcSystem.advanceQuest(r.npcId, -100);
      }
    }

    // Special: DRONE_MIGRATION picks a random sector and faction
    if (eventType === EVENT_TYPES.DRONE_MIGRATION && this.territorySystem) {
      const sectors = this.territorySystem._sectors ? Array.from(this.territorySystem._sectors.keys()) : [];
      if (sectors.length > 0) {
        this._activeEvent.targetSector = sectors[Math.floor(Math.random() * sectors.length)];
      }
      const factions = ['vanguard', 'synapse', 'hollow'];
      this._activeEvent.migratingFaction = factions[Math.floor(Math.random() * factions.length)];
    }

    return this._activeEvent;
  }

  endCurrentEvent() {
    if (!this._activeEvent) return false;

    // Clear temporary quest flags from NPC reactions
    const reactions = NPC_REACTIONS[this._activeEvent.type] || [];
    for (const r of reactions) {
      if (this.npcSystem && typeof this.npcSystem.advanceQuest === 'function') {
        this.npcSystem.advanceQuest(r.npcId, 0);
      }
    }

    this._activeEvent = null;
    return true;
  }

  /* ---------- NPC Reactions ---------- */

  getNPCReactions(eventType) {
    const reactions = NPC_REACTIONS[eventType];
    if (!reactions) return [];

    return reactions.map(r => ({
      npcId: r.npcId,
      dialogue: r.dialogue,
      priceModifier: r.priceMod || 1.0,
      temporaryQuest: r.tempQuest || null,
    }));
  }

  /* ---------- Update ---------- */

  update(dt, gameTime) {
    if (typeof gameTime === 'number') {
      this._gameTime = gameTime;
    } else {
      // Advance by real-time seconds (treat 1 real second = 1 in-game minute for default pacing)
      this._gameTime += (dt / 60);
    }

    // Auto-expire events
    if (this._activeEvent && this._gameTime >= this._activeEvent.endsAt) {
      this.endCurrentEvent();
    }

    // Auto-trigger next event when interval elapsed (only if not already active)
    if (!this._activeEvent && this._gameTime >= this._lastEventTime + (EVENT_INTERVAL_DAYS * HOURS_PER_DAY)) {
      this._triggerRandomEvent();
    }
  }

  _triggerRandomEvent() {
    const keys = Object.values(EVENT_TYPES);
    const type = keys[Math.floor(Math.random() * keys.length)];
    this.startEvent(type);
  }

  /* ---------- Serialization ---------- */

  serialize() {
    return {
      gameTime: this._gameTime,
      lastEventTime: this._lastEventTime,
      activeEvent: this._activeEvent ? { ...this._activeEvent } : null,
      eventHistory: this._eventHistory.slice(),
    };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;
    if (typeof data.gameTime === 'number') this._gameTime = data.gameTime;
    if (typeof data.lastEventTime === 'number') this._lastEventTime = data.lastEventTime;
    if (data.activeEvent && typeof data.activeEvent === 'object') {
      this._activeEvent = {
        type: data.activeEvent.type,
        startedAt: data.activeEvent.startedAt,
        endsAt: data.activeEvent.endsAt,
        targetSector: data.activeEvent.targetSector || null,
        migratingFaction: data.activeEvent.migratingFaction || null,
      };
    } else {
      this._activeEvent = null;
    }
    if (Array.isArray(data.eventHistory)) {
      this._eventHistory = data.eventHistory.slice();
    }
  }
}
