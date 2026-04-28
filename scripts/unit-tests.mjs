#!/usr/bin/env node
import assert from 'node:assert/strict';

import { GemSystem } from '../js/GemSystem.js';
import { InventoryStash } from '../js/InventoryStash.js';
import { UIManager } from '../js/UIManager.js';
import { getEndgameRarityOdds, getRiftBalance, RARITY_VALUES } from '../js/BalanceModel.js';

function testGemSocketRoundTrip() {
  const gems = new GemSystem();
  gems.gems.clear();
  gems.addGem('ruby', 1);

  const item = { rarity: 4, sockets: 1, gems: [] };
  assert.equal(gems.socketGem(item, 'ruby'), true);
  assert.equal(item.gems.length, 1);
  assert.equal(gems.gems.has('ruby'), false);

  assert.equal(gems.unsocketGem(item, 0), true);
  assert.equal(item.gems.length, 0);
  assert.equal(gems.gems.get('ruby'), 1);
}

function testIdentifyAllCostsChips() {
  const player = { _chips: 25, chips: 25 };
  const stash = new InventoryStash(player, null, null);
  stash.stash = [
    { name: 'Unidentified Helmet', unidentified: true, identified: false },
    { name: 'Known Boots', unidentified: false, identified: true },
    { name: 'Unidentified Gloves', unidentified: true, identified: false },
  ];

  const result = stash.identifyAll(10);
  assert.deepEqual(result, { identified: 2, cost: 20, ok: true });
  assert.equal(player._chips, 5);
  assert.equal(stash.getUnidentifiedCount(), 0);
  assert.equal(stash.stash[0].name, 'Helmet');
}

function testIdentifyAllRejectsWhenShortOnChips() {
  const player = { _chips: 5, chips: 5 };
  const stash = new InventoryStash(player, null, null);
  stash.stash = [{ name: 'Unidentified Frame', unidentified: true, identified: false }];

  const result = stash.identifyAll(10);
  assert.deepEqual(result, { identified: 0, cost: 10, ok: false });
  assert.equal(player._chips, 5);
  assert.equal(stash.getUnidentifiedCount(), 1);
}

function testIdentifyAllSupportsPublicChipsCounter() {
  const player = { chips: 25 };
  const stash = new InventoryStash(player, null, null);
  stash.stash = [{ name: 'Unidentified Boots', unidentified: true, identified: false }];

  const result = stash.identifyAll(10);
  assert.deepEqual(result, { identified: 1, cost: 10, ok: true });
  assert.equal(player.chips, 15);
  assert.equal('_chips' in player, false);
}

function testComparisonIncludesAffixesAndGems() {
  const ui = new UIManager({});
  const item = {
    baseStats: { armor: 10 },
    affixes: [{ stat: 'damageMultiplier', value: 0.08 }],
    gems: [{ bonuses: { armor: 5, critChance: 0.03 } }],
  };
  assert.deepEqual(ui._collectItemStats(item), {
    armor: 15,
    damageMultiplier: 0.08,
    critChance: 0.03,
  });
}

function testEndgameBalanceCurves() {
  const earlyOdds = getEndgameRarityOdds(0.30, true, 1);
  const lateOdds = getEndgameRarityOdds(0.30, true, 100);
  assert.ok(lateOdds[RARITY_VALUES.ANCIENT] > earlyOdds[RARITY_VALUES.ANCIENT]);
  assert.ok(lateOdds[RARITY_VALUES.PRIMAL] > earlyOdds[RARITY_VALUES.PRIMAL]);
  assert.ok(getRiftBalance(100).guardianHpMult < 90);
}

testGemSocketRoundTrip();
testIdentifyAllCostsChips();
testIdentifyAllRejectsWhenShortOnChips();
testIdentifyAllSupportsPublicChipsCounter();
testComparisonIncludesAffixesAndGems();
testEndgameBalanceCurves();

console.log('Unit tests passed.');
