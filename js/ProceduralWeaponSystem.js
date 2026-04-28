import { RARITY } from './AffixSystem.js';
import { DAMAGE_TYPES } from './DamageSystem.js';
import { MANUFACTURERS } from './ExoSuitSystem.js';
import { AMMO_TYPES, WEAPON_SLOTS } from './WeaponSystem.js';

/*
 * Procedural weapon loot schema for Apex Rift.
 *
 * Rarity choice:
 * This module uses a weapon-specific 5-tier table so weapon loot can stay
 * readable in the shooter UI without removing the existing 7 ExoSuit gear
 * rarities. Each tier carries a compatRarity that maps back to AffixSystem
 * constants for color, stash value, and future shared UI sorting.
 *
 * Generated weapons are plain JSON-compatible item data. Each weapon is rolled
 * from an existing js/weapons/*.js class template, then receives manufacturer,
 * element, affix, and rarity modifications. Runtime adapters can use the
 * baseWeapon field to instantiate or modify the shipped fixed weapon classes.
 */

export const WEAPON_RARITY_TIERS = {
    COMMON: {
        id: 'common',
        name: 'Common',
        compatRarity: RARITY.COMMON,
        weight: 52,
        statMultiplier: 1.00,
        affixCount: 0,
        legendaryChance: 0,
        gearScoreBonus: 0
    },
    UNCOMMON: {
        id: 'uncommon',
        name: 'Uncommon',
        compatRarity: RARITY.MAGIC,
        weight: 26,
        statMultiplier: 1.08,
        affixCount: 1,
        legendaryChance: 0,
        gearScoreBonus: 8
    },
    RARE: {
        id: 'rare',
        name: 'Rare',
        compatRarity: RARITY.RARE,
        weight: 15,
        statMultiplier: 1.18,
        affixCount: 2,
        legendaryChance: 0,
        gearScoreBonus: 18
    },
    EPIC: {
        id: 'epic',
        name: 'Epic',
        compatRarity: RARITY.LEGENDARY,
        weight: 6,
        statMultiplier: 1.32,
        affixCount: 3,
        legendaryChance: 0.18,
        gearScoreBonus: 34
    },
    LEGENDARY: {
        id: 'legendary',
        name: 'Legendary',
        compatRarity: RARITY.ANCIENT,
        weight: 1,
        statMultiplier: 1.50,
        affixCount: 4,
        legendaryChance: 1,
        gearScoreBonus: 55
    }
};

export const PROCEDURAL_WEAPON_SCHEMA = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Apex Rift Procedural Weapon',
    type: 'object',
    required: [
        'schemaVersion', 'id', 'itemType', 'name', 'level', 'rarity',
        'compatRarity', 'manufacturer', 'baseWeapon', 'weaponType', 'slot', 'type',
        'damageType', 'damage', 'fireRate', 'clipSize', 'reloadTime',
        'spread', 'range', 'gearScore', 'itemPower', 'affixes',
        'legendaryEffects', 'projectile'
    ],
    properties: {
        schemaVersion: { const: 1 },
        id: { type: 'string' },
        itemType: { const: 'weapon' },
        name: { type: 'string' },
        level: { type: 'integer', minimum: 1 },
        rarity: { enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'] },
        compatRarity: { type: 'integer' },
        manufacturer: { enum: Object.values(MANUFACTURERS) },
        baseWeapon: {
            type: 'object',
            required: ['id', 'className', 'module'],
            properties: {
                id: { type: 'string' },
                className: { type: 'string' },
                module: { type: 'string' }
            }
        },
        weaponType: { enum: ['SMG', 'Sniper Rifle', 'Shotgun', 'Plasma Rifle', 'Rocket Launcher', 'Energy Sword'] },
        slot: { enum: Object.values(WEAPON_SLOTS) },
        type: { enum: ['projectile', 'hitscan', 'melee'] },
        ammoType: { enum: [...Object.values(AMMO_TYPES), null] },
        damageType: { enum: Object.values(DAMAGE_TYPES) },
        damage: { type: 'number', minimum: 1 },
        fireRate: { type: 'number', minimum: 0.1 },
        attackSpeed: { type: 'number', minimum: 0.1 },
        clipSize: { type: 'integer', minimum: 1 },
        reloadTime: { type: 'number', minimum: 0 },
        spread: { type: 'number', minimum: 0 },
        range: { type: 'number', minimum: 1 },
        critChance: { type: 'number', minimum: 0, maximum: 1 },
        critDamage: { type: 'number', minimum: 1 },
        gearScore: { type: 'integer', minimum: 1 },
        itemPower: { type: 'integer', minimum: 1 },
        projectile: {
            type: 'object',
            properties: {
                behavior: { enum: ['bullet', 'beam', 'pellet', 'rocket', 'slash'] },
                speed: { type: 'number', minimum: 0 },
                pelletCount: { type: 'integer', minimum: 1 },
                blastRadius: { type: 'number', minimum: 0 },
                pierce: { type: 'integer', minimum: 0 },
                color: { type: 'integer' }
            }
        },
        affixes: { type: 'array', items: { type: 'object' } },
        legendaryEffects: { type: 'array', items: { type: 'object' } },
        integration: { type: 'object' }
    }
};

/*
 * Base values mirror the existing fixed weapon classes:
 * SubMachineGun, SniperRifle, Shotgun, PlasmaRifle, RocketLauncher, EnergySword.
 * The generator never rolls a detached generic gun archetype; it rolls a data
 * item that says "start from this shipped weapon, then apply these RPG mods."
 */
const WEAPON_TYPES = {
    SMG: {
        label: 'SMG',
        baseWeapon: { id: 'sub_machine_gun', className: 'SubMachineGun', module: './weapons/SubMachineGun.js' },
        slot: WEAPON_SLOTS.PRIMARY,
        type: 'projectile',
        ammoType: AMMO_TYPES.RIFLE,
        damage: 9,
        fireRate: 14,
        clipSize: 32,
        reloadTime: 1.2,
        spread: 0.08,
        range: 25,
        critChance: 0.06,
        critDamage: 1.45,
        projectile: { behavior: 'bullet', speed: 70, pelletCount: 1, blastRadius: 0, pierce: 0, color: 0xffffff },
        weights: { kinetic: 35, electric: 20, burn: 15, energy: 20, freeze: 10 }
    },
    SNIPER_RIFLE: {
        label: 'Sniper Rifle',
        baseWeapon: { id: 'sniper_rifle', className: 'SniperRifle', module: './weapons/SniperRifle.js' },
        slot: WEAPON_SLOTS.PRIMARY,
        type: 'hitscan',
        ammoType: AMMO_TYPES.RIFLE,
        damage: 85,
        fireRate: 0.8,
        clipSize: 5,
        reloadTime: 2.5,
        spread: 0.005,
        range: 80,
        critChance: 0.16,
        critDamage: 4.0,
        projectile: { behavior: 'beam', speed: 0, pelletCount: 1, blastRadius: 0, pierce: 1, color: 0xffffff },
        weights: { kinetic: 35, energy: 25, electric: 12, freeze: 12, magic: 16 }
    },
    SHOTGUN: {
        label: 'Shotgun',
        baseWeapon: { id: 'shotgun', className: 'Shotgun', module: './weapons/Shotgun.js' },
        slot: WEAPON_SLOTS.HEAVY,
        type: 'projectile',
        ammoType: AMMO_TYPES.SHOTGUN,
        damage: 12,
        fireRate: 1.5,
        clipSize: 6,
        reloadTime: 2.0,
        spread: 0.12,
        range: 15,
        critChance: 0.07,
        critDamage: 1.55,
        projectile: { behavior: 'pellet', speed: 56, pelletCount: 8, blastRadius: 0, pierce: 0, color: 0xffffff },
        weights: { kinetic: 34, explosive: 18, electric: 12, freeze: 14, burn: 22 }
    },
    PLASMA_RIFLE: {
        label: 'Plasma Rifle',
        baseWeapon: { id: 'plasma_rifle', className: 'PlasmaRifle', module: './weapons/PlasmaRifle.js' },
        slot: WEAPON_SLOTS.PRIMARY,
        type: 'projectile',
        ammoType: AMMO_TYPES.RIFLE,
        damage: 22,
        fireRate: 6,
        clipSize: 24,
        reloadTime: 1.8,
        spread: 0.025,
        range: 35,
        critChance: 0.08,
        critDamage: 1.6,
        projectile: { behavior: 'bullet', speed: 58, pelletCount: 1, blastRadius: 0, pierce: 0, color: 0x00ffaa },
        weights: { energy: 44, electric: 26, freeze: 12, magic: 18 }
    },
    ROCKET_LAUNCHER: {
        label: 'Rocket Launcher',
        baseWeapon: { id: 'rocket_launcher', className: 'RocketLauncher', module: './weapons/RocketLauncher.js' },
        slot: WEAPON_SLOTS.HEAVY,
        type: 'projectile',
        ammoType: AMMO_TYPES.HEAVY,
        damage: 100,
        fireRate: 1.0,
        clipSize: 2,
        reloadTime: 3.0,
        spread: 0.025,
        range: 40,
        critChance: 0.04,
        critDamage: 1.4,
        projectile: { behavior: 'rocket', speed: 35, pelletCount: 1, blastRadius: 5, pierce: 0, color: 0xff5500 },
        weights: { explosive: 60, burn: 20, electric: 8, magic: 12 }
    },
    ENERGY_SWORD: {
        label: 'Energy Sword',
        baseWeapon: { id: 'energy_sword', className: 'EnergySword', module: './weapons/EnergySword.js' },
        slot: WEAPON_SLOTS.MELEE,
        type: 'melee',
        ammoType: null,
        damage: 35,
        fireRate: 1.1,
        clipSize: 1,
        reloadTime: 0,
        spread: 0,
        range: 2.8,
        critChance: 0.11,
        critDamage: 1.7,
        projectile: { behavior: 'slash', speed: 0, pelletCount: 1, blastRadius: 0, pierce: 0, color: 0x00ffaa },
        weights: { energy: 36, electric: 20, freeze: 12, kinetic: 12, magic: 20 }
    }
};

const MANUFACTURER_BIASES = {
    [MANUFACTURERS.REDLINE]: {
        weight: 32,
        name: 'Redline',
        prefixes: ['Overcranked', 'Rushline', 'Heatwake', 'Sprintborn'],
        statMods: { damage: 0.98, fireRate: 1.18, reloadTime: 0.90, spread: 1.18, range: 0.96, critChance: 1.02 },
        damageWeights: { kinetic: 8, explosive: 4, burn: 6 },
        affixBias: ['airborne', 'slide', 'flow', 'reload']
    },
    [MANUFACTURERS.SYNAPSE]: {
        weight: 28,
        name: 'Synapse',
        prefixes: ['Neural', 'Phase-Tuned', 'Ion-Sighted', 'Lattice'],
        statMods: { damage: 1.00, fireRate: 1.02, reloadTime: 0.98, spread: 0.78, range: 1.08, critChance: 1.08 },
        damageWeights: { energy: 10, electric: 8, freeze: 3 },
        affixBias: ['status', 'shield', 'wallrun', 'accuracy']
    },
    [MANUFACTURERS.HOLLOW]: {
        weight: 21,
        name: 'Hollow',
        prefixes: ['Volatile', 'Rift-Split', 'Backblast', 'Faultline'],
        statMods: { damage: 1.14, fireRate: 0.92, reloadTime: 1.12, spread: 1.08, range: 0.94, critChance: 0.92 },
        damageWeights: { explosive: 14, burn: 8, magic: 6 },
        affixBias: ['blast', 'takedown', 'risk', 'airborne']
    },
    [MANUFACTURERS.GHOSTWORKS]: {
        weight: 19,
        name: 'Ghostworks',
        prefixes: ['Quietline', 'Afterimage', 'Null-Signed', 'Silkbolt'],
        statMods: { damage: 0.93, fireRate: 1.00, reloadTime: 0.82, spread: 0.70, range: 1.12, critChance: 1.35 },
        damageWeights: { kinetic: 5, energy: 3, magic: 7, freeze: 4 },
        affixBias: ['crit', 'stealth', 'grapple', 'reload']
    }
};

// Uses the current DamageSystem vocabulary. Burn/fire and void/psychic are
// safe authoring aliases that resolve to existing energy and magic damage.
const DAMAGE_TYPE_ALIASES = {
    kinetic: DAMAGE_TYPES.KINETIC,
    energy: DAMAGE_TYPES.ENERGY,
    explosive: DAMAGE_TYPES.EXPLOSIVE,
    electric: DAMAGE_TYPES.ELECTRIC,
    freeze: DAMAGE_TYPES.FREEZE,
    burn: DAMAGE_TYPES.ENERGY,
    fire: DAMAGE_TYPES.ENERGY,
    void: DAMAGE_TYPES.MAGIC,
    psychic: DAMAGE_TYPES.MAGIC,
    magic: DAMAGE_TYPES.MAGIC
};

const AFFIX_POOL = [
    { id: 'airborne_damage', name: 'Airborne Pressure', tag: 'airborne', stat: 'airborneDamageMult', min: 0.08, max: 0.18, text: '+{valuePct}% damage while airborne' },
    { id: 'wallrun_crit', name: 'Wallrun Sightline', tag: 'wallrun', stat: 'wallRunCritChance', min: 0.06, max: 0.14, text: '+{valuePct}% crit chance during wall-runs' },
    { id: 'slide_reload', name: 'Slide-Chambered', tag: 'slide', stat: 'slideReloadSpeedMult', min: 0.12, max: 0.28, text: '+{valuePct}% reload speed after sliding' },
    { id: 'grapple_opening', name: 'Grapple Opener', tag: 'grapple', stat: 'grappleDamageMult', min: 0.10, max: 0.24, text: '+{valuePct}% damage shortly after grappling' },
    { id: 'flow_stacks', name: 'Flow Capacitor', tag: 'flow', stat: 'flowDamagePerStack', min: 0.015, max: 0.035, text: '+{valuePct}% damage per combo stack' },
    { id: 'takedown_charge', name: 'Takedown Battery', tag: 'takedown', stat: 'takedownAmmoRefundChance', min: 0.12, max: 0.28, text: '{valuePct}% chance to refund ammo after takedowns' },
    { id: 'status_amp', name: 'Status Conductor', tag: 'status', stat: 'statusChance', min: 0.08, max: 0.20, text: '+{valuePct}% elemental status chance' },
    { id: 'shield_break', name: 'Shield Shear', tag: 'shield', stat: 'shieldDamageMult', min: 0.12, max: 0.30, text: '+{valuePct}% damage to shields' },
    { id: 'precision_core', name: 'Precision Core', tag: 'crit', stat: 'critDamage', min: 0.15, max: 0.35, text: '+{valuePct}% critical damage' },
    { id: 'quiet_handling', name: 'Quiet Handling', tag: 'stealth', stat: 'stealthCritChance', min: 0.08, max: 0.18, text: '+{valuePct}% crit chance while undetected' },
    { id: 'stable_lens', name: 'Stable Lens', tag: 'accuracy', stat: 'spreadMult', min: -0.08, max: -0.20, text: '{valuePct}% weapon spread' },
    { id: 'volatile_payload', name: 'Volatile Payload', tag: 'blast', stat: 'blastRadiusMult', min: 0.10, max: 0.25, text: '+{valuePct}% blast radius' },
    { id: 'danger_close', name: 'Danger Close', tag: 'risk', stat: 'closeRangeDamageMult', min: 0.12, max: 0.26, text: '+{valuePct}% close-range damage, risky at point blank' },
    { id: 'quick_swap', name: 'Quick Swap', tag: 'reload', stat: 'swapReloadSpeedMult', min: 0.08, max: 0.18, text: '+{valuePct}% reload speed after weapon swap' }
];

// Legendary effects are data-only hooks. They name the intended parkour-combat
// trigger so WeaponSystem, LegendaryPowerSystem, or a future adapter can apply
// behavior without this generator depending on frame updates.
const LEGENDARY_EFFECTS = [
    {
        id: 'skyhook_capacitor',
        name: 'Skyhook Capacitor',
        tags: ['airborne', 'grapple'],
        text: 'Grapple launches overcharge the next shot for bonus electric splash.',
        stats: { grappleNextShotDamageMult: 0.45, bonusDamageType: DAMAGE_TYPES.ELECTRIC }
    },
    {
        id: 'wallghost_protocol',
        name: 'Wallghost Protocol',
        tags: ['wallrun', 'crit', 'stealth'],
        text: 'Wall-run crits briefly cloak the player and refill a small amount of ammo.',
        stats: { wallRunCritCloakSeconds: 1.2, critAmmoRefund: 1 }
    },
    {
        id: 'redline_afterburn',
        name: 'Redline Afterburn',
        tags: ['flow', 'slide'],
        text: 'Maintaining flow stacks ramps fire rate; sliding vents heat into a faster reload.',
        stats: { flowFireRateRamp: 0.04, slideReloadSpeedMult: 0.35 }
    },
    {
        id: 'hollow_backblast',
        name: 'Hollow Backblast',
        tags: ['blast', 'risk'],
        text: 'Explosive hits at close range create a second delayed burst with reduced self-risk.',
        stats: { delayedBurstDamageMult: 0.35, selfDamageReduction: 0.45 }
    },
    {
        id: 'synapse_cascade',
        name: 'Synapse Cascade',
        tags: ['status', 'shield'],
        text: 'Status procs chain to a nearby drone and hit shields harder.',
        stats: { statusChainTargets: 1, shieldDamageMult: 0.25 }
    },
    {
        id: 'ghostworks_cut',
        name: 'Ghostworks Cut',
        tags: ['crit', 'reload', 'stealth'],
        text: 'Precision kills grant instant handling and make the next shot nearly silent.',
        stats: { precisionKillReloadSpeedMult: 0.50, nextShotStealthCritChance: 0.20 }
    }
];

const NOUNS = ['Vector', 'Rift', 'Spire', 'Relay', 'Pulse', 'Breaker', 'Lance', 'Arc', 'Warden', 'Drift'];
const SUFFIXES = ['of Flow', 'of the Skyline', 'of Overrun', 'of the Aerialist', 'of the Breach', 'of Momentum'];

export class ProceduralWeaponSystem {
    constructor(options = {}) {
        this.defaultLevel = options.defaultLevel || 10;
    }

    generateWeapon(options = {}) {
        const rng = createSeededRng(options.seed);
        const level = clampInt(options.level ?? this.defaultLevel, 1, 100);
        const weaponKey = options.weaponType
            ? findWeaponKey(options.weaponType)
            : weightedPick(weaponWeightTable(), rng).key;
        const base = WEAPON_TYPES[weaponKey];
        const manufacturer = options.manufacturer || weightedPick(manufacturerWeightTable(), rng).key;
        const rarityTier = options.rarity
            ? getRarityTier(options.rarity)
            : weightedPick(rarityWeightTable(level), rng).value;
        const bias = MANUFACTURER_BIASES[manufacturer];
        const damageType = rollDamageType(base, bias, rng);
        const affixes = rollAffixes(rarityTier.affixCount, bias.affixBias, rng);
        const legendaryEffects = rollLegendaryEffects(rarityTier, affixes, bias.affixBias, rng);
        const stats = buildStats(base, bias, rarityTier, level, rng);
        const itemPower = calculateItemPower(stats, rarityTier, level, affixes, legendaryEffects);
        const name = buildName(base, bias, rarityTier, damageType, legendaryEffects, rng);

        const weapon = {
            schemaVersion: 1,
            id: buildId(name, level, rng),
            itemType: 'weapon',
            name,
            shortName: shortName(name),
            level,
            rarity: rarityTier.id,
            rarityName: rarityTier.name,
            compatRarity: rarityTier.compatRarity,
            manufacturer,
            manufacturerName: bias.name,
            baseWeapon: { ...base.baseWeapon },
            weaponType: base.label,
            slot: base.slot,
            type: base.type,
            ammoType: base.ammoType,
            damageType,
            damage: stats.damage,
            fireRate: stats.fireRate,
            attackSpeed: stats.fireRate,
            clipSize: stats.clipSize,
            reloadTime: stats.reloadTime,
            spread: stats.spread,
            range: stats.range,
            critChance: stats.critChance,
            critDamage: stats.critDamage,
            projectile: stats.projectile,
            affixes,
            legendaryEffects,
            gearScore: itemPower,
            itemPower,
            mods: [],
            tags: buildTags(base, bias, affixes, legendaryEffects),
            integration: {
                lootSystem: 'Add a weapon drop branch that stores this object as itemData under type "weapon" or routes it to a weapon stash.',
                weaponSystem: 'Instantiate baseWeapon.className, then apply generated scalar stats and metadata. Directly equipping this data is safe only for simple projectile/hitscan/melee behavior; add an adapter for pelletCount, blastRadius, pierce, and legendaryEffects.',
                ui: 'Render itemType, rarityName, manufacturerName, weaponType, damageType, itemPower, affixes, and legendaryEffects in loadout/stash panels.'
            }
        };

        return weapon;
    }

    generateLevel10Weapon(options = {}) {
        return this.generateWeapon({ ...options, level: 10 });
    }

    generateLevel10Samples(count = 10, seed = 'apex-rift-level-10-samples') {
        const samples = [];
        for (let i = 0; i < count; i++) {
            samples.push(this.generateLevel10Weapon({ seed: `${seed}:${i}` }));
        }
        return samples;
    }

    validateWeapon(weapon) {
        return validateProceduralWeapon(weapon);
    }
}

export function generateProceduralWeapon(options = {}) {
    return new ProceduralWeaponSystem().generateWeapon(options);
}

export function generateLevel10ProceduralWeapon(options = {}) {
    return new ProceduralWeaponSystem().generateLevel10Weapon(options);
}

export function generateLevel10WeaponSamples(count = 10, seed = 'apex-rift-level-10-samples') {
    return new ProceduralWeaponSystem().generateLevel10Samples(count, seed);
}

export function validateProceduralWeapon(weapon) {
    const errors = [];
    if (!weapon || typeof weapon !== 'object') errors.push('weapon must be an object');
    if (errors.length) return { valid: false, errors };

    requireValue(errors, weapon.schemaVersion === 1, 'schemaVersion must be 1');
    requireValue(errors, weapon.itemType === 'weapon', 'itemType must be weapon');
    requireString(errors, weapon.id, 'id');
    requireString(errors, weapon.name, 'name');
    requireValue(errors, Number.isInteger(weapon.level) && weapon.level >= 1, 'level must be a positive integer');
    requireValue(errors, rarityById(weapon.rarity) != null, 'rarity must be a known 5-tier weapon rarity');
    requireValue(errors, Object.values(MANUFACTURERS).includes(weapon.manufacturer), 'manufacturer is not supported');
    requireValue(errors, weapon.baseWeapon && typeof weapon.baseWeapon === 'object', 'baseWeapon must identify an existing weapon class');
    if (weapon.baseWeapon) {
        requireString(errors, weapon.baseWeapon.id, 'baseWeapon.id');
        requireString(errors, weapon.baseWeapon.className, 'baseWeapon.className');
        requireString(errors, weapon.baseWeapon.module, 'baseWeapon.module');
    }
    requireValue(errors, Object.values(WEAPON_TYPES).some(t => t.label === weapon.weaponType), 'weaponType is not supported');
    requireValue(errors, Object.values(WEAPON_SLOTS).includes(weapon.slot), 'slot is not supported');
    requireValue(errors, ['projectile', 'hitscan', 'melee'].includes(weapon.type), 'type must be projectile, hitscan, or melee');
    requireValue(errors, Object.values(DAMAGE_TYPES).includes(weapon.damageType), 'damageType is not supported by DamageSystem');

    for (const key of ['damage', 'fireRate', 'attackSpeed', 'reloadTime', 'spread', 'range', 'critChance', 'critDamage', 'gearScore', 'itemPower']) {
        requireNumber(errors, weapon[key], key);
    }
    requireValue(errors, Number.isInteger(weapon.clipSize) && weapon.clipSize >= 1, 'clipSize must be a positive integer');
    requireValue(errors, Array.isArray(weapon.affixes), 'affixes must be an array');
    requireValue(errors, Array.isArray(weapon.legendaryEffects), 'legendaryEffects must be an array');
    requireValue(errors, weapon.projectile && typeof weapon.projectile === 'object', 'projectile must be an object');

    if (weapon.projectile) {
        requireValue(errors, ['bullet', 'beam', 'pellet', 'rocket', 'slash'].includes(weapon.projectile.behavior), 'projectile.behavior is invalid');
        requireValue(errors, Number.isInteger(weapon.projectile.pelletCount) && weapon.projectile.pelletCount >= 1, 'projectile.pelletCount must be positive');
        requireNumber(errors, weapon.projectile.speed, 'projectile.speed');
        requireNumber(errors, weapon.projectile.blastRadius, 'projectile.blastRadius');
    }

    return { valid: errors.length === 0, errors };
}

function createSeededRng(seed) {
    if (seed === undefined || seed === null) return Math.random;
    let h = 2166136261;
    const text = String(seed);
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return function rng() {
        h += 0x6D2B79F5;
        let t = h;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function weightedPick(entries, rng) {
    const total = entries.reduce((sum, e) => sum + Math.max(0, e.weight), 0);
    let roll = rng() * total;
    for (const entry of entries) {
        roll -= Math.max(0, entry.weight);
        if (roll <= 0) return entry;
    }
    return entries[entries.length - 1];
}

function weaponWeightTable() {
    return Object.entries(WEAPON_TYPES).map(([key, value]) => ({ key, value, weight: 1 }));
}

function manufacturerWeightTable() {
    return Object.entries(MANUFACTURER_BIASES).map(([key, value]) => ({ key, value, weight: value.weight }));
}

function rarityWeightTable(level) {
    // Level 10 is the requested baseline: mostly Common/Uncommon, with enough
    // Rare/Epic/Legendary chance to produce exciting test loot without endgame
    // inflation. Higher levels gently push weight upward.
    const levelBonus = Math.max(0, level - 10);
    return Object.values(WEAPON_RARITY_TIERS).map(tier => {
        let weight = tier.weight;
        if (tier.id === 'rare') weight += levelBonus * 0.5;
        if (tier.id === 'epic') weight += levelBonus * 0.2;
        if (tier.id === 'legendary') weight += levelBonus * 0.05;
        return { key: tier.id, value: tier, weight };
    });
}

function getRarityTier(idOrTier) {
    if (idOrTier && typeof idOrTier === 'object') return idOrTier;
    const tier = rarityById(String(idOrTier).toLowerCase());
    if (!tier) throw new Error(`Unknown procedural weapon rarity: ${idOrTier}`);
    return tier;
}

function rarityById(id) {
    return Object.values(WEAPON_RARITY_TIERS).find(t => t.id === id) || null;
}

function findWeaponKey(label) {
    const normalized = String(label).toLowerCase().replace(/[\s_-]/g, '');
    const found = Object.entries(WEAPON_TYPES).find(([key, value]) =>
        key.toLowerCase().replace(/[\s_-]/g, '') === normalized ||
        value.label.toLowerCase().replace(/[\s_-]/g, '') === normalized
    );
    if (!found) throw new Error(`Unknown procedural weapon type: ${label}`);
    return found[0];
}

function rollDamageType(base, bias, rng) {
    const weights = { ...base.weights };
    for (const [key, add] of Object.entries(bias.damageWeights || {})) {
        weights[key] = (weights[key] || 0) + add;
    }
    const picked = weightedPick(Object.entries(weights).map(([key, weight]) => ({ key, weight })), rng).key;
    return DAMAGE_TYPE_ALIASES[picked] || DAMAGE_TYPES.KINETIC;
}

function rollAffixes(count, preferredTags, rng) {
    const picked = [];
    const pool = AFFIX_POOL.slice();
    while (picked.length < count && pool.length > 0) {
        const weighted = pool.map(affix => ({
            value: affix,
            weight: preferredTags.includes(affix.tag) ? 4 : 1
        }));
        const affix = weightedPick(weighted, rng).value;
        pool.splice(pool.indexOf(affix), 1);
        const rolled = rollAffix(affix, rng);
        picked.push(rolled);
    }
    return picked;
}

function rollAffix(base, rng) {
    const value = roundStat(base.min + rng() * (base.max - base.min));
    return {
        id: base.id,
        name: base.name,
        tag: base.tag,
        stat: base.stat,
        value,
        description: formatAffixText(base.text, value)
    };
}

function rollLegendaryEffects(rarityTier, affixes, preferredTags, rng) {
    if (rng() > rarityTier.legendaryChance) return [];
    const tags = new Set([...preferredTags, ...affixes.map(a => a.tag)]);
    const weighted = LEGENDARY_EFFECTS.map(effect => ({
        value: effect,
        weight: effect.tags.some(tag => tags.has(tag)) ? 5 : 1
    }));
    const effect = weightedPick(weighted, rng).value;
    return [{ ...effect, tags: effect.tags.slice(), stats: { ...effect.stats } }];
}

function buildStats(base, bias, rarityTier, level, rng) {
    // Level scaling starts from the fixed weapon class stats, then applies
    // manufacturer identity, rarity multiplier, and small deterministic variance.
    const levelScale = 1 + (level - 1) * 0.075;
    const variance = 0.96 + rng() * 0.08;
    const statMultiplier = rarityTier.statMultiplier * levelScale * variance;
    const projectile = { ...base.projectile };

    projectile.speed = roundStat(projectile.speed * (bias.statMods.projectileSpeed || 1));
    projectile.blastRadius = roundStat(projectile.blastRadius * (1 + (bias.affixBias.includes('blast') ? 0.08 : 0)));

    return {
        damage: roundStat(base.damage * statMultiplier * bias.statMods.damage),
        fireRate: roundStat(base.fireRate * bias.statMods.fireRate),
        clipSize: Math.max(1, Math.round(base.clipSize * (bias.statMods.clipSize || 1))),
        reloadTime: roundStat(Math.max(0, base.reloadTime * bias.statMods.reloadTime)),
        spread: roundStat(Math.max(0, base.spread * bias.statMods.spread)),
        range: roundStat(base.range * bias.statMods.range),
        critChance: roundStat(Math.min(0.75, base.critChance * bias.statMods.critChance)),
        critDamage: roundStat(base.critDamage),
        projectile
    };
}

function calculateItemPower(stats, rarityTier, level, affixes, legendaryEffects) {
    const offense = stats.damage * Math.max(0.5, stats.fireRate);
    const handling = stats.range * 0.45 + stats.clipSize * 0.7 + (1 / Math.max(0.25, stats.reloadTime || 0.25)) * 8;
    const crit = 1 + stats.critChance * (stats.critDamage - 1);
    const special = affixes.length * 7 + legendaryEffects.length * 20;
    return Math.round(level * 8 + offense * crit * 0.75 + handling + rarityTier.gearScoreBonus + special);
}

function buildName(base, bias, rarityTier, damageType, legendaryEffects, rng) {
    if (legendaryEffects.length > 0 && rarityTier.id === 'legendary') {
        return `${bias.name} ${legendaryEffects[0].name}`;
    }
    const prefix = pick(bias.prefixes, rng);
    const noun = pick(NOUNS, rng);
    const suffix = rarityTier.id === 'common' ? '' : ` ${pick(SUFFIXES, rng)}`;
    const element = damageType === DAMAGE_TYPES.MAGIC ? 'Void' : damageType.charAt(0).toUpperCase() + damageType.slice(1);
    return `${prefix} ${element} ${base.label} ${noun}${suffix}`;
}

function buildId(name, level, rng) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `pweapon_${level}_${slug}_${Math.floor(rng() * 100000).toString(36)}`;
}

function shortName(name) {
    return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function buildTags(base, bias, affixes, legendaryEffects) {
    const tags = new Set([base.label.toLowerCase(), bias.name.toLowerCase()]);
    for (const affix of affixes) tags.add(affix.tag);
    for (const effect of legendaryEffects) {
        for (const tag of effect.tags || []) tags.add(tag);
    }
    return Array.from(tags);
}

function pick(items, rng) {
    return items[Math.floor(rng() * items.length)];
}

function roundStat(value) {
    return Math.round(value * 1000) / 1000;
}

function clampInt(value, min, max) {
    return Math.max(min, Math.min(max, Math.floor(Number(value) || min)));
}

function formatAffixText(template, value) {
    const pct = `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`;
    return template.replace('{valuePct}', pct);
}

function requireString(errors, value, key) {
    if (typeof value !== 'string' || value.length === 0) errors.push(`${key} must be a non-empty string`);
}

function requireNumber(errors, value, key) {
    if (typeof value !== 'number' || !Number.isFinite(value)) errors.push(`${key} must be a finite number`);
}

function requireValue(errors, condition, message) {
    if (!condition) errors.push(message);
}

/*
 * Dev helper:
 *   import { generateLevel10WeaponSamples } from './ProceduralWeaponSystem.js';
 *   console.table(generateLevel10WeaponSamples(10, 'demo').map(w => ({
 *       name: w.name,
 *       rarity: w.rarity,
 *       manufacturer: w.manufacturer,
 *       type: w.weaponType,
 *       damageType: w.damageType,
 *       dps: Math.round(w.damage * w.fireRate),
 *       itemPower: w.itemPower
 *   })));
 *
 * Ten deterministic level-10 sample names from the helper seed are available
 * via window.proceduralWeaponSystem.generateLevel10Samples(10, 'demo') in dev.
 */
