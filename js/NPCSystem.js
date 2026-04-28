/**
 * NPCSystem.js
 * Schedules and locations for friendly NPCs.
 * Pure data module — no Three.js objects.
 */

export const TIME_OF_DAY = {
  DAWN: 'dawn',       // 05:00 – 08:00
  MORNING: 'morning', // 08:00 – 12:00
  AFTERNOON: 'afternoon', // 12:00 – 17:00
  DUSK: 'dusk',       // 17:00 – 20:00
  NIGHT: 'night',     // 20:00 – 05:00
};

const TIME_RANGES = {
  [TIME_OF_DAY.DAWN]:      { start: 5,  end: 8 },
  [TIME_OF_DAY.MORNING]:   { start: 8,  end: 12 },
  [TIME_OF_DAY.AFTERNOON]: { start: 12, end: 17 },
  [TIME_OF_DAY.DUSK]:      { start: 17, end: 20 },
  [TIME_OF_DAY.NIGHT]:     { start: 20, end: 5 }, // wraps around midnight
};

function resolveTimeBlock(hour) {
  for (const [block, range] of Object.entries(TIME_RANGES)) {
    if (block === TIME_OF_DAY.NIGHT) {
      if (hour >= 20 || hour < 5) return block;
    } else if (hour >= range.start && hour < range.end) {
      return block;
    }
  }
  return TIME_OF_DAY.NIGHT;
}

const PRE_DEFINED_NPCS = [
  {
    id: 'malik',
    name: 'Malik',
    role: 'scrap_dealer',
    schedule: {
      [TIME_OF_DAY.MORNING]:   { sectorId: 'safehouse',   offset: { x: 2, y: 0, z: -1 } },
      [TIME_OF_DAY.AFTERNOON]: { sectorId: 'sector_4',    offset: { x: -3, y: 1, z: 4 } },
      [TIME_OF_DAY.NIGHT]:     { sectorId: 'break_room',  offset: { x: 0, y: 0, z: 0 }, note: 'vent_access' },
      [TIME_OF_DAY.DAWN]:      { sectorId: 'safehouse',   offset: { x: 2, y: 0, z: -1 } },
      [TIME_OF_DAY.DUSK]:      { sectorId: 'sector_4',    offset: { x: -3, y: 1, z: 4 } },
    },
    basePrices: { scrapBuy: 0.6, scrapSell: 1.0, info: 50 },
    secretsUnlocked: [],
    questStage: 0,
  },
  {
    id: 'vega_npc',
    name: 'Vega',
    role: 'rival_runner',
    schedule: {
      [TIME_OF_DAY.DAWN]:      { sectorId: 'shooting_range', offset: { x: 1, y: 0, z: 0 } },
      [TIME_OF_DAY.MORNING]:   { sectorId: 'safehouse',      offset: { x: -1, y: 0, z: 2 } },
      [TIME_OF_DAY.AFTERNOON]: { sectorId: 'safehouse',      offset: { x: -1, y: 0, z: 2 } },
      [TIME_OF_DAY.DUSK]:      { sectorId: 'rooftops',       offset: { x: 5, y: 8, z: -2 } },
      [TIME_OF_DAY.NIGHT]:     { sectorId: 'offline',        offset: { x: 0, y: 0, z: 0 } },
    },
    basePrices: {},
    secretsUnlocked: [],
    questStage: 0,
  },
  {
    id: 'informant',
    name: 'The Informant',
    role: 'informant',
    schedule: {
      // Only appears during FOG weather; location is fixed when visible
      [TIME_OF_DAY.MORNING]:   { sectorId: 'sector_7', offset: { x: 0, y: 0, z: 0 }, weatherRequired: 'fog' },
      [TIME_OF_DAY.AFTERNOON]: { sectorId: 'sector_7', offset: { x: 0, y: 0, z: 0 }, weatherRequired: 'fog' },
      [TIME_OF_DAY.NIGHT]:     { sectorId: 'sector_7', offset: { x: 0, y: 0, z: 0 }, weatherRequired: 'fog' },
      [TIME_OF_DAY.DAWN]:      { sectorId: 'sector_7', offset: { x: 0, y: 0, z: 0 }, weatherRequired: 'fog' },
      [TIME_OF_DAY.DUSK]:      { sectorId: 'sector_7', offset: { x: 0, y: 0, z: 0 }, weatherRequired: 'fog' },
    },
    basePrices: { secret: 100 },
    secretsUnlocked: [],
    questStage: 0,
  },
  {
    id: 'dr_chen',
    name: 'Dr. Chen',
    role: 'implant_surgeon',
    schedule: {
      // Always at safehouse
      [TIME_OF_DAY.MORNING]:   { sectorId: 'safehouse', offset: { x: -2, y: 0, z: -2 } },
      [TIME_OF_DAY.AFTERNOON]: { sectorId: 'safehouse', offset: { x: -2, y: 0, z: -2 } },
      [TIME_OF_DAY.NIGHT]:     { sectorId: 'safehouse', offset: { x: -2, y: 0, z: -2 } },
      [TIME_OF_DAY.DAWN]:      { sectorId: 'safehouse', offset: { x: -2, y: 0, z: -2 } },
      [TIME_OF_DAY.DUSK]:      { sectorId: 'safehouse', offset: { x: -2, y: 0, z: -2 } },
    },
    basePrices: { implantInstall: 200, implantRemove: 50 },
    secretsUnlocked: [],
    questStage: 0,
  },
  {
    id: 'scrap_broker',
    name: 'Scrap Broker',
    role: 'loan_shark',
    schedule: {
      [TIME_OF_DAY.MORNING]:   { sectorId: 'safehouse', offset: { x: 3, y: 0, z: 1 } },
      [TIME_OF_DAY.AFTERNOON]: { sectorId: 'safehouse', offset: { x: 3, y: 0, z: 1 } },
      [TIME_OF_DAY.NIGHT]:     { sectorId: 'safehouse', offset: { x: 3, y: 0, z: 1 } },
      [TIME_OF_DAY.DAWN]:      { sectorId: 'safehouse', offset: { x: 3, y: 0, z: 1 } },
      [TIME_OF_DAY.DUSK]:      { sectorId: 'safehouse', offset: { x: 3, y: 0, z: 1 } },
    },
    basePrices: { loan: 500, interestRate: 0.15 },
    secretsUnlocked: [],
    questStage: 0,
    playerDebt: 0,
  },
];

const DIALOGUE_TREES = {
  malik: {
    greeting: {
      text: "Got scrap? Got creds? Either way, I got options.",
      options: [
        { id: 'buy',  text: 'Buy scrap',    condition: null, next: 'buy_menu' },
        { id: 'sell', text: 'Sell scrap',   condition: null, next: 'sell_menu' },
        { id: 'ask_vent', text: 'Heard anything about vents?', condition: 'questStage>=1', next: 'vent_secret' },
        { id: 'rumor', text: 'Any rumors today?', condition: null, next: 'rumor' },
      ]
    },
    buy_menu:  { text: "Take a look. Prices shift with the factions.", options: [], action: 'open_shop_buy' },
    sell_menu: { text: "Show me what you found out there.", options: [], action: 'open_shop_sell' },
    vent_secret: { text: "Break room vent leads to the old maintenance tunnels. Don't tell the corps.", options: [], action: 'unlock_secret', secretId: 'vent_tunnel' },
    rumor: {
      text: "Synapse is moving heavy gear through Sector 6 tonight. Could be an opportunity... or a death trap.",
      options: [
        { id: 'thanks', text: 'Thanks for the tip.', next: 'greeting' },
      ]
    },
  },
  vega_npc: {
    greeting: {
      text: "You're slow today, runner. Or maybe I'm just faster.",
      options: [
        { id: 'race', text: 'Race me through the rooftops.', condition: 'time==dusk', next: 'race_challenge' },
        { id: 'tips', text: 'Any route tips?', condition: null, next: 'tips' },
        { id: 'leave', text: 'Maybe later.', next: null },
      ]
    },
    race_challenge: { text: "You're on. First to the north spire wins.", options: [], action: 'start_race' },
    tips: {
      text: "Use the steam vents in Sector 5 for a vertical boost. Timing is everything.",
      options: [
        { id: 'thanks', text: 'Good looking out.', next: 'greeting' },
      ]
    },
  },
  informant: {
    greeting: {
      text: "The fog hides many things. For a price, I hide fewer.",
      options: [
        { id: 'buy_secret', text: 'Buy a secret (100 creds)', condition: 'credits>=100', next: 'secret_reveal' },
        { id: 'ask', text: 'Who are you?', next: 'identity' },
        { id: 'leave', text: 'Stay hidden.', next: null },
      ]
    },
    secret_reveal: { text: "The Director's Overlook has a hidden elevator. Keycard is in Sector 3.", options: [], action: 'unlock_secret', secretId: 'director_elevator', cost: 100 },
    identity: {
      text: "Nobody. Everybody. Just a shadow with good ears.",
      options: [
        { id: 'back', text: 'Back', next: 'greeting' },
      ]
    },
  },
  dr_chen: {
    greeting: {
      text: "Sit down. Let me see what the streets have done to your hardware.",
      options: [
        { id: 'install', text: 'Install implant', condition: null, next: 'implant_menu' },
        { id: 'remove',  text: 'Remove implant',  condition: 'hasImplant', next: 'remove_confirm' },
        { id: 'chat',    text: 'Any side effects?', next: 'side_effects' },
      ]
    },
    implant_menu: { text: "What slot are we working with today?", options: [], action: 'open_implant_shop' },
    remove_confirm: { text: "Removal carries risk. Are you sure?", options: [
      { id: 'yes', text: 'Do it.', action: 'remove_implant' },
      { id: 'no',  text: 'Never mind.', next: 'greeting' },
    ]},
    side_effects: {
      text: "Some patients report phantom momentum after removing leg actuators. Your brain adapts. Usually.",
      options: [
        { id: 'back', text: 'Comforting.', next: 'greeting' },
      ]
    },
  },
  scrap_broker: {
    greeting: {
      text: "Need capital? I offer liquidity. Terms are... flexible.",
      options: [
        { id: 'loan', text: 'Take a loan (500 creds, 15% interest)', condition: 'debt==0', next: 'loan_confirm' },
        { id: 'repay', text: 'Repay debt', condition: 'debt>0', next: 'repay_menu' },
        { id: 'ask', text: 'What happens if I default?', next: 'default_warning' },
      ]
    },
    loan_confirm: { text: "Pleasure doing business. I'll find you when it's due.", options: [], action: 'give_loan', amount: 500 },
    repay_menu: { text: "Always good to see a runner who honors their debts.", options: [], action: 'repay_loan' },
    default_warning: {
      text: "Let's just say I know people who know drones. Friendly drones. Mostly.",
      options: [
        { id: 'back', text: 'Noted.', next: 'greeting' },
      ]
    },
  },
};

export class NPCSystem {
  // H20: known sector anchors (world-space XZ centre, Y at floor level)
  // Any sectorId appearing in schedules MUST have an entry here or a __DEV__ warning fires.
  static SECTOR_POSITIONS = {
    safehouse:      { x:  0, y: 0, z:  0 },
    sector_4:       { x: 20, y: 0, z: -10 },
    sector_7:       { x:-20, y: 0, z:  15 },
    break_room:     { x:  8, y: 0, z: -18 },
    rooftops:       { x:  0, y:12, z:   5 },
    shooting_range: { x:-12, y: 0, z: -5 },
    offline:        { x:  0, y: 0, z:   0 }, // NPC is off-map/unreachable intentionally
  };

  constructor(world, player, factionSystem, weatherSystem = null) {
    this.world = world;
    this.player = player;
    this.factionSystem = factionSystem;
    this.weatherSystem = weatherSystem;

    this._npcs = new Map();
    for (const def of PRE_DEFINED_NPCS) {
      this._npcs.set(def.id, { ...def, memory: {}, lastDialogueChoice: null });
    }

    // H20: validate that every sectorId in NPC schedules has a known world position
    if (window.__DEV__) {
      for (const [npcId, npc] of this._npcs) {
        for (const [timeBlock, slot] of Object.entries(npc.schedule || {})) {
          if (slot && slot.sectorId && !(slot.sectorId in NPCSystem.SECTOR_POSITIONS)) {
            console.warn(`NPCSystem: NPC "${npcId}" schedule[${timeBlock}] references unknown sectorId "${slot.sectorId}". Add it to NPCSystem.SECTOR_POSITIONS.`);
          }
        }
      }
    }

    this._gameTimeHours = 8;
    this._weatherCache = null;
  }

  /* ---------- Schedule Queries ---------- */

  /** Returns the world-space anchor {x,y,z} for a sector, or null if unknown. */
  getSectorPosition(sectorId) {
    return NPCSystem.SECTOR_POSITIONS[sectorId] || null;
  }

  getNPCsAtLocation(sectorId, timeOfDay = null) {
    const block = timeOfDay || resolveTimeBlock(this._gameTimeHours);
    const results = [];

    for (const npc of this._npcs.values()) {
      const slot = npc.schedule[block];
      if (!slot) continue;
      if (slot.weatherRequired && (!this.weatherSystem || this.weatherSystem.mode !== slot.weatherRequired)) {
        continue;
      }
      if (slot.sectorId === sectorId) {
        results.push({
          id: npc.id,
          name: npc.name,
          role: npc.role,
          positionOffset: { ...slot.offset },
          note: slot.note || null,
        });
      }
    }

    return results;
  }

  /* ---------- Dialogue ---------- */

  getNPCDialogue(npcId, context = {}) {
    const npc = this._npcs.get(npcId);
    if (!npc) return null;

    const tree = DIALOGUE_TREES[npcId];
    if (!tree) return { text: "...", options: [] };

    const nodeId = context.nodeId || 'greeting';
    const node = tree[nodeId];
    if (!node) return { text: "...", options: [] };

    // Evaluate option conditions
    const options = [];
    for (const opt of (node.options || [])) {
      if (opt.condition && !this._evaluateCondition(opt.condition, npc, context)) {
        continue;
      }
      options.push({
        id: opt.id,
        text: opt.text,
        next: opt.next || null,
        action: opt.action || null,
        secretId: opt.secretId || null,
        cost: opt.cost || 0,
      });
    }

    // Remember last choice
    if (context.choiceId) {
      npc.lastDialogueChoice = context.choiceId;
      if (!npc.memory.choices) npc.memory.choices = [];
      npc.memory.choices.push({ choiceId: context.choiceId, timestamp: Date.now() });
    }

    return {
      npcId: npc.id,
      npcName: npc.name,
      nodeId,
      text: node.text,
      options,
      action: node.action || null,
      secretId: node.secretId || null,
      cost: node.cost || 0,
    };
  }

  _evaluateCondition(condition, npc, context) {
    // Simple condition DSL: 'questStage>=1', 'credits>=100', 'debt>0', 'hasImplant', 'time==dusk'
    if (condition === 'hasImplant') {
      return !!(this.player && this.player.implants && this.player.implants.length > 0);
    }

    const timeMatch = condition.match(/^time==(.+)$/);
    if (timeMatch) {
      return resolveTimeBlock(this._gameTimeHours) === timeMatch[1];
    }

    const cmpMatch = condition.match(/^([a-zA-Z_]+)(>=|<=|>|<|==)(.+)$/);
    if (cmpMatch) {
      const [, key, op, valStr] = cmpMatch;
      let left;
      if (key === 'questStage') left = npc.questStage;
      else if (key === 'credits') left = context.credits || (this.player && this.player.credits) || 0;
      else if (key === 'debt') left = npc.playerDebt || 0;
      else left = 0;

      const right = parseFloat(valStr);
      switch (op) {
        case '>=': return left >= right;
        case '<=': return left <= right;
        case '>':  return left > right;
        case '<':  return left < right;
        case '==': return left === right;
      }
    }

    return true;
  }

  /* ---------- Memory / Progression ---------- */

  unlockSecret(npcId, secretId) {
    const npc = this._npcs.get(npcId);
    if (!npc) return false;
    if (!npc.secretsUnlocked.includes(secretId)) {
      npc.secretsUnlocked.push(secretId);
      return true;
    }
    return false;
  }

  advanceQuest(npcId, stage = null) {
    const npc = this._npcs.get(npcId);
    if (!npc) return false;
    if (stage !== null) {
      npc.questStage = stage;
    } else {
      npc.questStage += 1;
    }
    return true;
  }

  addPlayerDebt(npcId, amount) {
    const npc = this._npcs.get(npcId);
    if (!npc || typeof npc.playerDebt !== 'number') return false;
    npc.playerDebt += amount;
    return true;
  }

  repayPlayerDebt(npcId, amount) {
    const npc = this._npcs.get(npcId);
    if (!npc || typeof npc.playerDebt !== 'number') return false;
    const paid = Math.min(amount, npc.playerDebt);
    npc.playerDebt -= paid;
    return paid;
  }

  /* ---------- Update ---------- */

  update(dt, gameTimeHours) {
    if (typeof gameTimeHours === 'number') {
      this._gameTimeHours = gameTimeHours % 24;
    }
  }

  /* ---------- Serialization ---------- */

  serialize() {
    const data = {};
    for (const [id, npc] of this._npcs) {
      data[id] = {
        secretsUnlocked: npc.secretsUnlocked.slice(),
        questStage: npc.questStage,
        memory: JSON.parse(JSON.stringify(npc.memory)),
        lastDialogueChoice: npc.lastDialogueChoice,
        playerDebt: npc.playerDebt || 0,
      };
    }
    return { npcs: data, gameTimeHours: this._gameTimeHours };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;
    if (typeof data.gameTimeHours === 'number') {
      this._gameTimeHours = data.gameTimeHours % 24;
    }
    if (!data.npcs || typeof data.npcs !== 'object') return;

    for (const [id, incoming] of Object.entries(data.npcs)) {
      const npc = this._npcs.get(id);
      if (!npc) continue;

      if (Array.isArray(incoming.secretsUnlocked)) {
        npc.secretsUnlocked = incoming.secretsUnlocked.slice();
      }
      if (typeof incoming.questStage === 'number') {
        npc.questStage = incoming.questStage;
      }
      if (incoming.memory && typeof incoming.memory === 'object') {
        npc.memory = JSON.parse(JSON.stringify(incoming.memory));
      }
      if (incoming.lastDialogueChoice !== undefined) {
        npc.lastDialogueChoice = incoming.lastDialogueChoice;
      }
      if (typeof incoming.playerDebt === 'number') {
        npc.playerDebt = incoming.playerDebt;
      }
    }
  }
}
