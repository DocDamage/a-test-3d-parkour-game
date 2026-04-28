export const RARITY_VALUES = {
  COMMON: 1,
  MAGIC: 2,
  RARE: 3,
  LEGENDARY: 4,
  SET: 5,
  ANCIENT: 6,
  PRIMAL: 7
};

const RIFT_BALANCE = {
  enemyHpGrowth: 1.055,
  enemyDamageGrowth: 1.025,
  guardianHpGrowth: 1.045,
  guardianDamageGrowth: 1.018
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getRiftBalance(riftLevel = 1, difficultyHpMult = 1, difficultyDamageMult = 1) {
  const level = Math.max(1, Math.floor(riftLevel || 1));
  const levelDelta = level - 1;
  return {
    level,
    enemyHpMult: difficultyHpMult * Math.pow(RIFT_BALANCE.enemyHpGrowth, levelDelta),
    enemyDamageMult: difficultyDamageMult * Math.pow(RIFT_BALANCE.enemyDamageGrowth, levelDelta),
    guardianHpMult: difficultyHpMult * Math.pow(RIFT_BALANCE.guardianHpGrowth, levelDelta),
    guardianDamageMult: difficultyDamageMult * Math.pow(RIFT_BALANCE.guardianDamageGrowth, levelDelta)
  };
}

export function getEndgameRarityOdds(commonThreshold = 0.55, allowSet = false, riftLevel = 1) {
  const common = clamp(commonThreshold, 0, 0.84);
  if (!allowSet) {
    return {
      [RARITY_VALUES.COMMON]: common,
      [RARITY_VALUES.MAGIC]: Math.max(0, 0.85 - common),
      [RARITY_VALUES.RARE]: 0.10,
      [RARITY_VALUES.LEGENDARY]: 0.05,
      [RARITY_VALUES.SET]: 0,
      [RARITY_VALUES.ANCIENT]: 0,
      [RARITY_VALUES.PRIMAL]: 0
    };
  }

  const level = Math.max(1, Math.floor(riftLevel || 1));
  const ancient = clamp(0.003 + Math.max(0, level - 25) * 0.00012, 0.003, 0.010);
  const primal = clamp(0.002 + Math.max(0, level - 70) * 0.00008, 0.002, 0.005);
  const set = 0.010;
  const legendary = Math.max(0.020, 1 - 0.95 - set - ancient - primal);

  return {
    [RARITY_VALUES.COMMON]: common,
    [RARITY_VALUES.MAGIC]: Math.max(0, 0.85 - common),
    [RARITY_VALUES.RARE]: 0.10,
    [RARITY_VALUES.LEGENDARY]: legendary,
    [RARITY_VALUES.SET]: set,
    [RARITY_VALUES.ANCIENT]: ancient,
    [RARITY_VALUES.PRIMAL]: primal
  };
}

export function rollEndgameRarity(commonThreshold = 0.55, allowSet = false, riftLevel = 1, random = Math.random) {
  const odds = getEndgameRarityOdds(commonThreshold, allowSet, riftLevel);
  const roll = random();
  let cursor = 0;
  for (const rarity of [
    RARITY_VALUES.COMMON,
    RARITY_VALUES.MAGIC,
    RARITY_VALUES.RARE,
    RARITY_VALUES.LEGENDARY,
    RARITY_VALUES.SET,
    RARITY_VALUES.ANCIENT,
    RARITY_VALUES.PRIMAL
  ]) {
    cursor += odds[rarity] || 0;
    if (roll < cursor) return rarity;
  }
  return allowSet ? RARITY_VALUES.PRIMAL : RARITY_VALUES.LEGENDARY;
}
