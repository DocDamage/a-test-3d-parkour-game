#!/usr/bin/env node
import assert from 'node:assert/strict';
import { getEndgameRarityOdds, getRiftBalance, rollEndgameRarity, RARITY_VALUES } from '../js/BalanceModel.js';

const RARITY_NAMES = {
  [RARITY_VALUES.COMMON]: 'Common',
  [RARITY_VALUES.MAGIC]: 'Magic',
  [RARITY_VALUES.RARE]: 'Rare',
  [RARITY_VALUES.LEGENDARY]: 'Legendary',
  [RARITY_VALUES.SET]: 'Set',
  [RARITY_VALUES.ANCIENT]: 'Ancient',
  [RARITY_VALUES.PRIMAL]: 'Primal'
};

function mulberry32(seed) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rollEnemyDrop(kind, riftLevel, random) {
  const roll = random();
  if (kind === 'guardian') {
    if (roll < 0.30) return rollEndgameRarity(0.20, true, riftLevel, random);
    if (roll < 0.60) return rollEndgameRarity(0.40, true, riftLevel, random);
    if (roll < 0.85) return RARITY_VALUES.LEGENDARY;
    if (roll < 0.95) return RARITY_VALUES.SET;
    return null;
  }

  if (kind === 'elite') {
    if (roll < 0.63) return null;
    if (roll < 0.90) return rollEndgameRarity(0.55, true, riftLevel, random);
    if (roll < 0.98) return RARITY_VALUES.LEGENDARY;
    return RARITY_VALUES.SET;
  }

  if (roll < 0.98) return null;
  if (roll < 0.998) return RARITY_VALUES.MAGIC;
  return rollEndgameRarity(0.30, true, riftLevel, random);
}

function simulate(kind, riftLevel, iterations = 100000) {
  const random = mulberry32(0xC0FFEE + riftLevel + kind.length);
  const counts = new Map();
  let gearDrops = 0;
  for (let i = 0; i < iterations; i++) {
    const rarity = rollEnemyDrop(kind, riftLevel, random);
    if (!rarity) continue;
    gearDrops++;
    counts.set(rarity, (counts.get(rarity) || 0) + 1);
  }
  const pct = rarity => gearDrops ? ((counts.get(rarity) || 0) / gearDrops) * 100 : 0;
  return {
    kind,
    riftLevel,
    gearDrops,
    ancientPct: pct(RARITY_VALUES.ANCIENT),
    primalPct: pct(RARITY_VALUES.PRIMAL),
    legendaryPlusPct: [
      RARITY_VALUES.LEGENDARY,
      RARITY_VALUES.SET,
      RARITY_VALUES.ANCIENT,
      RARITY_VALUES.PRIMAL
    ].reduce((sum, rarity) => sum + pct(rarity), 0),
    counts
  };
}

function printSimulation() {
  console.log('=== Rift Scaling ===');
  for (const level of [1, 25, 50, 75, 100]) {
    const b = getRiftBalance(level);
    const guardianHp = Math.round(800 * b.guardianHpMult);
    const guardianDamage = Math.round(b.guardianDamageMult * 100) / 100;
    console.log(`Rift ${level}: enemy HP x${b.enemyHpMult.toFixed(2)}, guardian HP ${guardianHp}, guardian dmg x${guardianDamage}`);
  }

  console.log('\n=== Guardian Gear Drops (100k simulated kills each) ===');
  for (const level of [1, 25, 50, 75, 100]) {
    const sim = simulate('guardian', level);
    console.log(`Rift ${level}: legendary+ ${sim.legendaryPlusPct.toFixed(2)}%, ancient ${sim.ancientPct.toFixed(2)}%, primal ${sim.primalPct.toFixed(2)}%`);
  }

  console.log('\n=== Level 100 Rarity Odds Used By Roll Table ===');
  const odds = getEndgameRarityOdds(0.30, true, 100);
  for (const [rarity, chance] of Object.entries(odds)) {
    if (chance > 0) console.log(`${RARITY_NAMES[rarity] || rarity}: ${(chance * 100).toFixed(2)}%`);
  }
}

const level1Odds = getEndgameRarityOdds(0.30, true, 1);
const level100Odds = getEndgameRarityOdds(0.30, true, 100);
assert.ok(level100Odds[RARITY_VALUES.ANCIENT] > level1Odds[RARITY_VALUES.ANCIENT]);
assert.ok(level100Odds[RARITY_VALUES.PRIMAL] > level1Odds[RARITY_VALUES.PRIMAL]);
assert.ok(level100Odds[RARITY_VALUES.ANCIENT] <= 0.010);
assert.ok(level100Odds[RARITY_VALUES.PRIMAL] <= 0.005);
assert.ok(getRiftBalance(100).enemyHpMult < 225);
assert.ok(getRiftBalance(100).guardianHpMult < 90);

printSimulation();
