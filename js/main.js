import * as THREE from 'three';
import { InputManager } from './InputManager.js';
import { Player } from './Player.js';
import { World } from './World.js';
import { ThirdPersonCamera } from './ThirdPersonCamera.js';
import { AudioManager } from './AudioManager.js';
import { PostProcessing } from './PostProcessing.js';
import { TimeTrial } from './TimeTrial.js';
import { PhotoMode } from './PhotoMode.js';
import { RunnerVision } from './RunnerVision.js';
import { DecalSystem } from './DecalSystem.js';
import { WeatherSystem } from './WeatherSystem.js';
import { ZiplineNetwork } from './ZiplineNetwork.js';
import { OverclockSystem } from './OverclockSystem.js';
import { MagnetBoots } from './MagnetBoots.js';
import { ChainGrappleRelays } from './ChainGrappleRelays.js';
import { DroneTakedown } from './DroneTakedown.js';
import { ZiplineGun } from './ZiplineGun.js';
import { WeatherGameplay } from './WeatherGameplay.js';
import { PowerUpSystem } from './PowerUpSystem.js';
import { HologramPlatforms } from './HologramPlatforms.js';
import { StructuralCollapse } from './StructuralCollapse.js';
import { RisingTide } from './RisingTide.js';
import { ParticleEffects } from './ParticleEffects.js';
import { setupLighting } from './LightingSetup.js';
import { setupWeaponLoadout } from './WeaponLoadout.js';
import { WeaponLoadoutUI } from './WeaponLoadoutUI.js';
import { createHintSystem } from './HintSystem.js';
import { GamepadController } from './GamepadController.js';
import { keyBindings } from './KeyBindings.js';
import { TouchControls } from './TouchControls.js';
import { AdvancedMovement } from './AdvancedMovement.js';
import { InteractiveEnvironment } from './InteractiveEnvironment.js';
import { SniperDrone, SwarmDrone, HunterDrone } from './AdvancedDrones.js';
import { DirectorMode } from './DirectorMode.js';
import { GhostRacing } from './GhostRacing.js';
import { BulletTime } from './BulletTime.js';
import { AssistMode } from './AssistMode.js';
import { StaminaSystem } from './StaminaSystem.js';
import { CombatSystem } from './CombatSystem.js';
import { StatusEffectSystem } from './StatusEffectSystem.js';
import { EnemyManager } from './EnemyManager.js';
import { WeaponSystem, WEAPON_SLOTS } from './WeaponSystem.js';
import { WeaponModSystem } from './WeaponModSystem.js';
import { ArenaMode } from './ArenaMode.js';
import { BossFabricator } from './bosses/BossFabricator.js';
import { BossWarden } from './bosses/BossWarden.js';
import { BossLeviathan } from './bosses/BossLeviathan.js';
import { BossSwarmQueen } from './bosses/BossSwarmQueen.js';
import { BossArchitect } from './bosses/BossArchitect.js';
import { EnergySword } from './weapons/EnergySword.js';
import { Crossbow } from './weapons/Crossbow.js';
import { GrenadeLauncher } from './weapons/GrenadeLauncher.js';
import { MagicSystem } from './MagicSystem.js';
import { AccessorySystem, ACCESSORY_SLOTS } from './AccessorySystem.js';
import { InventorySystem } from './InventorySystem.js';
import { Gatekeeper } from './minibosses/Gatekeeper.js';
import { RiftStalker } from './minibosses/RiftStalker.js';
import { ForgeHound } from './minibosses/ForgeHound.js';
import { CrystalGolem } from './minibosses/CrystalGolem.js';
import { ConsequenceSystem } from './ConsequenceSystem.js';
import { DebtSystem } from './DebtSystem.js';
import { wireSkillCallbacks } from './SkillCallbacks.js';
import { SpeedrunILs } from './SpeedrunILs.js';
import { ChallengeSystem } from './ChallengeSystem.js';
import { GodRays } from './GodRays.js';
import { FootIK } from './FootIK.js';
import { ProceduralAnimation } from './ProceduralAnimation.js';
import LevelEditor from './LevelEditor.js';
import BossFight from './BossFight.js';
import RiftGuardian from './RiftGuardian.js';
import { CharacterSheet } from './CharacterSheet.js';
import { ProgressionSystem } from './ProgressionSystem.js';
import { ArchetypeSystem } from './ArchetypeSystem.js';
import { OriginSystem } from './OriginSystem.js';
import { ExoSuitSystem, SLOTS } from './ExoSuitSystem.js';
import { InventoryStash } from './InventoryStash.js';
import { AffixSystem, RARITY } from './AffixSystem.js';
import { FamiliaritySystem } from './FamiliaritySystem.js';
import { CompanionDrone, COMPANION_MODES } from './CompanionDrone.js';
import { LoyaltySystem } from './LoyaltySystem.js';
import { FactionSystem, FACTIONS } from './FactionSystem.js';
import { TerritorySystem, SECTORS } from './TerritorySystem.js';
import { SafehouseSystem } from './SafehouseSystem.js';
import { BountySystem } from './BountySystem.js';
import { NPCSystem } from './NPCSystem.js';
import { BlackoutSystem } from './BlackoutSystem.js';
import { RivalSystem } from './RivalSystem.js';
import { SubLevelSystem } from './SubLevelSystem.js';
import { MasterySystem } from './MasterySystem.js';
import { CodexSystem } from './CodexSystem.js';
import { ImplantSystem } from './ImplantSystem.js';
import { LegacySystem } from './LegacySystem.js';
import { NewGamePlus } from './NewGamePlus.js';
import { CollapseMode } from './CollapseMode.js';
import { DamageSystem, DAMAGE_TYPES } from './DamageSystem.js';
import { HitboxSystem, Hitbox } from './HitboxSystem.js';
import { LootSystem } from './LootSystem.js';
import { EnemyHealthBar } from './EnemyHealthBar.js';
import { SkillSystem } from './SkillSystem.js';
import { ResourceSystem } from './ResourceSystem.js';
import { SkillBarUI } from './SkillBarUI.js';
import { getDefaultLoadout, ACTIVE_SKILLS } from './SkillData.js';
import { DifficultyTierSystem } from './DifficultyTierSystem.js';
import { ApexRiftSystem } from './ApexRiftSystem.js';
import { NephalemGlory } from './NephalemGlory.js';
import { ProjectileManager } from './ProjectileManager.js';
import { PassiveTree } from './PassiveTree.js';
import { LegendaryPowerSystem } from './LegendaryPowerSystem.js';
import { HeartContainerSystem } from './HeartContainerSystem.js';
import { KeyItemSystem, KEY_ITEMS } from './KeyItemSystem.js';
import { DungeonSystem, DUNGEONS } from './DungeonSystem.js';
import { PuzzleRoom } from './PuzzleRoom.js';
import { LightDarkWorldSystem } from './LightDarkWorldSystem.js';
import { DialogueSystem } from './DialogueSystem.js';
import { ShopSystem } from './ShopSystem.js';
import { BottleSystem } from './BottleSystem.js';
import { OverworldMap } from './OverworldMap.js';
import { SaveSystem } from './SaveSystem.js';
import { DamageNumbers } from './DamageNumbers.js';
import { UIManager } from './UIManager.js';
import { MenuNavigator } from './MenuNavigator.js';
import { wireEditorUI } from './EditorUI.js';
import { GameContext } from './GameContext.js';

const __DEV__ = window.location.hash === '#dev';
window.__DEV__ = __DEV__;

import { DEFAULT_SETTINGS, wireSettings } from './SettingsUI.js';
import { wireKeybindings } from './KeybindingsUI.js';

// ── GameContext — dependency injection container ──────────────────────────
const ctx = new GameContext();

// Scene-level singletons (no deps)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x151520);
scene.fog = new THREE.Fog(0x151520, 20, 70);
ctx.register('scene', [], () => scene);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
ctx.register('camera', [], () => camera);

// H15 — WebGL 2 fallback: show a clear error before Three.js fails cryptically
(function checkWebGL2() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        const overlay = document.getElementById('loading-overlay') || document.body;
        const msg = document.createElement('div');
        msg.style.cssText = 'position:fixed;inset:0;background:#111;color:#f66;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;font-size:18px;z-index:99999;text-align:center;padding:20px;';
        msg.innerHTML = '<b>WebGL 2 Required</b><br><br>Your browser or GPU does not support WebGL 2.<br>Please try Chrome, Firefox, or Edge on a device with GPU acceleration enabled.';
        document.body.appendChild(msg);
        throw new Error('WebGL 2 not supported');
    }
})();

function setLoadProgress(text) {
    const el = document.getElementById('loading-progress');
    if (el) el.textContent = text;
}

setLoadProgress('Initializing renderer...');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);
ctx.register('renderer', [], () => renderer);

// Post-processing
const postProcessing = new PostProcessing(renderer, scene, camera);
ctx.register('postProcessing', ['scene', 'camera', 'renderer'], () => postProcessing);

// Lighting
const { ambient, sun, fill, pointLights, lensFlare } = setupLighting(scene, camera, postProcessing);
ctx.register('ambientLight', [], () => ambient);
ctx.register('sunLight', [], () => sun);
ctx.register('fillLight', [], () => fill);
ctx.register('pointLights', [], () => pointLights);
ctx.register('lensFlare', [], () => lensFlare);

// World
setLoadProgress('Building world...');
const world = new World(scene);
ctx.register('world', ['scene'], () => world);
const projectileManager = new ProjectileManager(scene, world);
ctx.register('projectileManager', ['scene', 'world'], () => projectileManager);

// Audio
const audio = new AudioManager(scene, world);
ctx.register('audio', ['scene', 'world'], () => audio);

// Player (camera controller wired after tpc is created later)
setLoadProgress('Creating player...');
const player = new Player(scene, world, camera, audio, null);
ctx.register('player', ['scene', 'world', 'camera', 'audio'], () => player);

// Unified save system
const saveSystem = new SaveSystem();
ctx.register('saveSystem', [], () => saveSystem);

// RPG Phase 1 systems
const characterSheet = new CharacterSheet(player);
characterSheet._load();
ctx.register('characterSheet', ['player'], () => characterSheet);
const progression = new ProgressionSystem(characterSheet);
ctx.register('progression', ['characterSheet'], () => progression);
const archetype = new ArchetypeSystem(player, characterSheet);
ctx.register('archetype', ['player', 'characterSheet'], () => archetype);
const origin = new OriginSystem(player, characterSheet);
ctx.register('origin', ['player', 'characterSheet'], () => origin);
player.setCharacterSheet(characterSheet);

// Apply stored character creation choices
const savedOrigin = localStorage.getItem('rpg_origin');
const savedArchetype = localStorage.getItem('rpg_archetype');
if (savedOrigin) {
    try { origin.setOrigin(savedOrigin); } catch (e) { if (__DEV__) console.warn('OriginSystem.setOrigin missing', e); }
}
if (savedArchetype) {
    try { archetype.setPrimary(savedArchetype); } catch (e) { if (__DEV__) console.warn('ArchetypeSystem.setPrimary missing', e); }
}

// RPG Phase 2-4 systems
const exoSuit = new ExoSuitSystem(player, characterSheet);
exoSuit._load();
exoSuit.onEquip = showLootToast;
ctx.register('exoSuit', ['player', 'characterSheet'], () => exoSuit);
const inventoryStash = new InventoryStash(player, exoSuit, characterSheet);
ctx.register('inventoryStash', ['player', 'exoSuit', 'characterSheet'], () => inventoryStash);
const affixSystem = new AffixSystem();
ctx.register('affixSystem', [], () => affixSystem);
const familiarity = new FamiliaritySystem();
ctx.register('familiarity', [], () => familiarity);
const companion = new CompanionDrone(scene, player, null); // eventBus placeholder
ctx.register('companion', ['scene', 'player'], () => companion);
const loyalty = new LoyaltySystem(companion);
ctx.register('loyalty', ['companion'], () => loyalty);
const factions = new FactionSystem(null); // eventBus placeholder
ctx.register('factions', [], () => factions);
const territory = new TerritorySystem(world, factions);
ctx.register('territory', ['world', 'factions'], () => territory);
const safehouse = new SafehouseSystem(player, characterSheet, progression, exoSuit, affixSystem);
ctx.register('safehouse', ['player', 'characterSheet', 'progression', 'exoSuit', 'affixSystem'], () => safehouse);
characterSheet.setSafehouseSystem(safehouse);
// Wire safehouse passive effects (damageSystem hook added after damageSystem is instantiated below)
function _updateSafehousePassives() {
    const effects = safehouse.getPassiveEffects();
    player._respawnHPBonus = effects.respawnHPBonus || 0;
}
_updateSafehousePassives();
const bounty = new BountySystem(player, characterSheet, progression, factions, territory);
ctx.register('bounty', ['player', 'characterSheet', 'progression', 'factions', 'territory'], () => bounty);
const npcSystem = new NPCSystem(world, player, factions);
const blackout = new BlackoutSystem(world, player, npcSystem, factions, territory);
ctx.register('npcSystem', ['world', 'player', 'factions'], () => npcSystem);
const rivals = new RivalSystem(scene, player, world, exoSuit);
ctx.register('rivals', ['scene', 'player', 'world', 'exoSuit'], () => rivals);
const subLevels = new SubLevelSystem(world, player, factions);
ctx.register('subLevels', ['world', 'player', 'factions'], () => subLevels);
const mastery = new MasterySystem(player, characterSheet);
ctx.register('mastery', ['player', 'characterSheet'], () => mastery);
const codex = new CodexSystem(player, characterSheet);
ctx.register('codex', ['player', 'characterSheet'], () => codex);
const implants = new ImplantSystem(player, characterSheet);
ctx.register('implants', ['player', 'characterSheet'], () => implants);
characterSheet.setImplantSystem(implants);
const legacy = new LegacySystem(characterSheet, progression, exoSuit, familiarity);
ctx.register('legacy', ['characterSheet', 'progression', 'exoSuit', 'familiarity'], () => legacy);
characterSheet.legacySystem = legacy; // wire dynasty bonus into stat pipeline
const ngPlus = new NewGamePlus(player, world, characterSheet);
ctx.register('ngPlus', ['player', 'world', 'characterSheet'], () => ngPlus);
const collapse = new CollapseMode(world, player, characterSheet, exoSuit, archetype);
ctx.register('collapse', ['world', 'player', 'characterSheet', 'exoSuit', 'archetype'], () => collapse);
const consequences = new ConsequenceSystem();
consequences.setCharacterSheet(characterSheet); // wire trophy_buff_active into stat pipeline
ctx.register('consequences', ['characterSheet'], () => consequences);
// debt instantiated after enemyManager below

// Status effects (needed by damageSystem)
const statusEffectSystem = new StatusEffectSystem();
ctx.register('statusEffectSystem', [], () => statusEffectSystem);

// Combat systems
const damageSystem = new DamageSystem(characterSheet, statusEffectSystem);
ctx.register('damageSystem', ['characterSheet', 'statusEffectSystem'], () => damageSystem);
const hitboxSystem = new HitboxSystem();
ctx.register('hitboxSystem', [], () => hitboxSystem);
const staminaSystem = new StaminaSystem(player);
player.staminaSystem = staminaSystem;
ctx.register('staminaSystem', ['player'], () => staminaSystem);
const combatSystem = new CombatSystem(player, hitboxSystem, damageSystem, camera, audio);
ctx.register('combatSystem', ['player', 'hitboxSystem', 'damageSystem', 'camera', 'audio'], () => combatSystem);

// Enemy manager + new combat subsystems (instantiated after combatSystem exists)
const enemyManager = new EnemyManager(scene, world, player);
ctx.register('enemyManager', ['scene', 'world', 'player'], () => enemyManager);
if (damageSystem) enemyManager.setDamageSystem(damageSystem);
if (damageSystem) damageSystem.setSafehouseSystem(safehouse);

// Weapon system: equip starter loadout
const weaponSystem = new WeaponSystem(player, scene, hitboxSystem, projectileManager);
ctx.register('weaponSystem', ['player', 'scene', 'hitboxSystem', 'projectileManager'], () => weaponSystem);
const weaponModSystem = new WeaponModSystem();
ctx.register('weaponModSystem', [], () => weaponModSystem);
weaponSystem.setModSystem(weaponModSystem);
weaponSystem.setFamiliaritySystem(familiarity);
// Pre-equip demo mods on starter loadout
weaponModSystem.equipMod(weaponModSystem.generateMod('barrel', 'rare'), WEAPON_SLOTS.PRIMARY, 'barrel');
weaponModSystem.equipMod(weaponModSystem.generateMod('scope', 'uncommon'), WEAPON_SLOTS.PRIMARY, 'scope');
weaponModSystem.equipMod(weaponModSystem.generateMod('grip', 'common'), WEAPON_SLOTS.SIDEARM, 'grip');

// Register subsystems with unified SaveSystem
saveSystem.register('characterSheet',
    () => ({
        stats: { ...characterSheet._stats },
        attributePoints: characterSheet._attributePoints,
        tempBonuses: Array.from(characterSheet._tempBonuses.entries()).map(([k, v]) => ({ key: k, ...v }))
    }),
    (data) => {
        if (!data) return;
        if (data.stats) characterSheet._stats = { ...characterSheet._stats, ...data.stats };
        if (data.attributePoints !== undefined) characterSheet._attributePoints = data.attributePoints;
        if (Array.isArray(data.tempBonuses)) {
            characterSheet._tempBonuses.clear();
            for (const tb of data.tempBonuses) {
                const { key, ...rest } = tb;
                characterSheet._tempBonuses.set(key, rest);
            }
        }
    }
);

saveSystem.register('exoSuit',
    () => {
        const data = {};
        for (const slot of Object.keys(exoSuit.equipped)) {
            data[slot] = exoSuit.equipped[slot] ? { ...exoSuit.equipped[slot] } : null;
        }
        return data;
    },
    (data) => {
        if (!data) return;
        for (const slot of Object.keys(exoSuit.equipped)) {
            exoSuit.equipped[slot] = data[slot] || null;
        }
        if (exoSuit._syncGearBonuses) exoSuit._syncGearBonuses();
    }
);

saveSystem.register('weaponModSystem',
    () => {
        const raw = {};
        for (const [weaponSlot, slotMap] of weaponModSystem.equipped) {
            raw[weaponSlot] = {};
            for (const [modSlot, mod] of slotMap) {
                raw[weaponSlot][modSlot] = mod;
            }
        }
        return raw;
    },
    (data) => {
        if (!data) return;
        weaponModSystem.equipped.clear();
        for (const [weaponSlot, slotData] of Object.entries(data)) {
            const slotMap = new Map();
            for (const [modSlot, mod] of Object.entries(slotData)) {
                slotMap.set(modSlot, mod);
            }
            weaponModSystem.equipped.set(Number(weaponSlot) || weaponSlot, slotMap);
        }
    }
);

saveSystem.register('progression',
    () => ({
        level: progression._level,
        xp: progression._xp,
        totalXPEarned: progression._totalXPEarned,
        xpSources: progression._xpSources
    }),
    (data) => {
        if (!data) return;
        progression._level = data.level ?? 1;
        progression._xp = data.xp ?? 0;
        progression._totalXPEarned = data.totalXPEarned ?? 0;
        progression._xpToNext = progression._xpForLevel(progression._level);
        if (data.xpSources) progression._xpSources = { ...progression._xpSources, ...data.xpSources };
    }
);

saveSystem.register('familiarity',
    () => familiarity.serialize(),
    (data) => familiarity.deserialize(data)
);

saveSystem.register('implants',
    () => implants.serialize(),
    (data) => implants.deserialize(data)
);

saveSystem.register('safehouse',
    () => safehouse.serialize(),
    (data) => safehouse.deserialize(data)
);



saveSystem.register('origin',
    () => ({ origin: origin.currentOrigin }),
    (data) => {
        if (data && data.origin) origin.setOrigin(data.origin);
    }
);

saveSystem.register('archetype',
    () => ({
        primary: archetype.primary,
        secondary: archetype.secondary,
        tertiary: archetype.tertiary
    }),
    (data) => {
        if (!data) return;
        if (data.primary) archetype.setPrimary(data.primary);
        if (data.secondary) archetype.setSecondary(data.secondary);
        if (data.tertiary) archetype.setTertiary(data.tertiary);
    }
);

// Auto-load existing unified save (overrides piecemeal localStorage loads)
if (saveSystem.hasSave()) {
    saveSystem.load();
}

// Skill system (Phase 2) — after save so loaded archetype is used
const activeArchetypeId = (archetype && archetype.getPrimaryArchetype()) || savedArchetype || 'traceur';
player._archetypeId = activeArchetypeId;
const resourceSystem = new ResourceSystem(activeArchetypeId);
if (activeArchetypeId === 'mage') {
    resourceSystem.setMaxResource(120);
}
const skillSystem = new SkillSystem(player, resourceSystem, activeArchetypeId);

// Assign default loadout for archetype
const defaultLoadout = getDefaultLoadout(activeArchetypeId);
for (const [slot, skillId] of Object.entries(defaultLoadout)) {
    skillSystem.assignSkill(slot, skillId);
}

const skillBarUI = new SkillBarUI(skillSystem, resourceSystem);
const passiveTree = new PassiveTree(activeArchetypeId, skillSystem);
passiveTree._load();

progression.onLevelUp = (level, points) => {
    if (passiveTree) passiveTree.addPoints(1);
    // Show level-up toast
    const toast = document.getElementById('levelup-toast');
    const msg   = document.getElementById('levelup-msg');
    if (toast) {
        if (msg) msg.textContent = `Level ${level} — +${points} attribute point${points !== 1 ? 's' : ''} available.`;
        toast.style.display = 'block';
        clearTimeout(progression._levelToastTimer);
        progression._levelToastTimer = setTimeout(() => { toast.style.display = 'none'; }, 4000);
    }
};

saveSystem.register('passiveTree',
    () => passiveTree.serialize(),
    (data) => passiveTree.deserialize(data)
);

// Remove the manual load hack; passiveTree is registered and will be loaded by saveSystem on next save/load cycle.
// If load already happened, deserialize now:
try {
    const _rawSave = localStorage.getItem(saveSystem.key);
    if (_rawSave) {
        const _saveData = JSON.parse(_rawSave);
        if (_saveData.passiveTree) passiveTree.deserialize(_saveData.passiveTree);
    }
} catch (e) { if (__DEV__) console.warn('PassiveTree manual load failed', e); }

const {
    pipeWrench, semiAutoPistol, assaultRifle, shotgun, stickyBomb,
    staffOfEmbers, voidWand, cryoGauntlet,
    sniperRifle, subMachineGun, rocketLauncher, flamethrower, plasmaRifle, energySword, crossbow, grenadeLauncher,
    magicSystem, accessorySystem, inventorySystem, miniBosses
} = setupWeaponLoadout(scene, world, player, weaponSystem, WEAPON_SLOTS, resourceSystem, characterSheet);

// Wire InventorySystem into LootSystem so consumable drops go to inventory
lootSystem.setInventorySystem(inventorySystem);
// Wire InventorySystem into UIManager so the inventory panel can render and use items
uiManager.inventorySystem = inventorySystem;

// Weapon Loadout UI panel (toggle with N key)
const weaponLoadoutUI = new WeaponLoadoutUI(weaponSystem);

// Stash panel button wiring
(function wireStashPanel() {
    const stashPanel = document.getElementById('stash-panel');
    if (!stashPanel || !inventoryStash) return;
    stashPanel.addEventListener('click', (e) => {
        if (e.target.classList.contains('stash-equip')) {
            const idx = parseInt(e.target.dataset.index, 10);
            inventoryStash.equipFromStash(idx);
        }
        if (e.target.classList.contains('stash-scrap')) {
            const idx = parseInt(e.target.dataset.index, 10);
            inventoryStash.scrapItem(idx);
        }
    });
})();

stickyBomb.onExplode = (data) => {
    if (!hitboxSystem) return;
    const hb = new Hitbox(
        { position: data.position }, 'explosion',
        { type: 'sphere', radius: data.radius },
        new THREE.Vector3(0, 0, 0), 0.3
    );
    hb.damage = data.damage; hb.team = 'player';
    hitboxSystem.registerHitbox(hb);
    if (particleEffects) particleEffects.explosion(data.position.clone(), 0xff3300, 20);
};

// Arena mode will be instantiated after bossFight is created (see below)

// Debt system (now that enemyManager exists)
const debt = new DebtSystem(player, enemyManager);

combatSystem.onHitbox = (data) => {
    let dmg = data.damage;
    // Perfect Dodge counter: 2x damage for 2s after successful dodge
    if (player._perfectDodgeCounter > 0) {
        dmg *= 2;
    }
    const hb = new Hitbox(data.owner, data.type, data.shape, data.offset, data.duration, (hitbox, target) => {
        if (target && target.takeDamage) {
            target.takeDamage(dmg, 'kinetic', data.owner);
        }
        if (target && typeof spawnDamageNumber === 'function') {
            const tPos = target.position || (target.mesh && target.mesh.position) || data.owner.position;
            spawnDamageNumber(tPos, Math.round(dmg), false, 'kinetic');
        }
        combatSystem.triggerHitStop(data.isFinisher ? 0.12 : (data.isHeavy ? 0.08 : 0.05));
        if (data.isHeavy || data.isFinisher) combatSystem.triggerCameraShake(0.15, 0.2);
    });
    hb.damage = dmg;
    hb.team = 'player';
    hitboxSystem.registerHitbox(hb);
};
const lootSystem = new LootSystem(scene, player, exoSuit, affixSystem);
const enemyHealthBars = []; // tracks EnemyHealthBar instances

// Unified enemy kill handler — wired to both drones and EnemyManager enemies
function _handleEnemyKilled(enemy, source) {
    // Progression XP
    if (progression && typeof progression.addXP === 'function') {
        const xpBase = enemy.isElite ? 100 : 50;
        const xpScaled = difficultyTier ? difficultyTier.scaleXP(xpBase) : xpBase;
        const sourceType = enemy.type || 'enemy_kill';
        progression.addXP(Math.floor(xpScaled), sourceType);
    }
    // Familiarity: track kill for current weapon
    if (familiarity && weaponSystem) {
        const w = weaponSystem.getCurrentWeapon();
        const weaponId = w ? (w.id || w.name || 'melee') : 'melee';
        familiarity.addKill(weaponId);
    }
    // Factions
    if (factions && enemy && enemy.faction) {
        factions.onDroneKilled(enemy.faction, enemy.isElite);
    }
    // Companion synergy
    if (companion && typeof companion.triggerSynergy === 'function') {
        companion.triggerSynergy();
    }
    // Nephalem Glory kill streak
    if (nephalemGlory) nephalemGlory.onKill(enemy);
    // Apex Rift progress
    if (apexRift) apexRift.onEnemyKilled(enemy, source);
    // Arena Mode score + kill tracking
    if (arenaMode && arenaMode.active) arenaMode.onEnemyKilled(enemy, source);
    // Collapse Mode kill tracking
    if (collapse && collapse._inRun) collapse.onEnemyKilled(enemy);
    // Legendary powers
    if (legendaryPowerSystem) legendaryPowerSystem.onEnemyKilled(enemy);
    // Loot drop with difficulty scaling
    const diffLootMult = difficultyTier ? difficultyTier.getTierConfig().lootBonus : 0;
    const drop = lootSystem.generateDrop(enemy.type || 'patrol', enemy.isElite, 1.0 + diffLootMult, activeArchetypeId);
    if (drop) {
        if (drop.type === 'gear') {
            const acquired = inventoryStash.acquireItem(drop.itemData);
            if (acquired) {
                showLootToast(drop.itemData);
                if (drop.rarity >= 4) showHint('LEGENDARY! Check your stash (I key).');
            }
        } else {
            lootSystem.spawnDrop(drop, enemy.position || (enemy.mesh && enemy.mesh.position));
        }
        showHint('Loot drops! Walk over items to pick them up.');
    }
}

// Wire drone death
if (world.drones && world.drones.drones) {
    world.drones.drones.forEach(drone => {
        if (drone && !drone.onDeath) {
            drone.onDeath = _handleEnemyKilled;
            drone.onDamageTaken = (amount, type, source) => {
                const pos = drone.position ? drone.position.clone() : drone.mesh.position.clone();
                pos.y += 1.0;
                spawnDamageNumber(pos, Math.ceil(amount), false, type);
            };
            const bar = new EnemyHealthBar(scene, drone);
            enemyHealthBars.push(bar);
            // Register hurtbox for player attacks
            if (hitboxSystem) {
                const hurtbox = new Hitbox(drone, 'hurtbox', { type: 'sphere', radius: 0.5 }, new THREE.Vector3(0, 0.4, 0), -1, null);
                hurtbox.team = 'enemy';
                hitboxSystem.registerHitbox(hurtbox);
            }
        }
    });
    if (nephalemGlory) nephalemGlory.setEnemyHealthBars(enemyHealthBars);
}

// Wire DamageSystem into DroneAI for dodge/crit/type calculations
if (world.drones) {
    world.drones.setDamageSystem(damageSystem);
}

// Player damage numbers + Nephalem Glory streak break
player.onDamageTaken = (amount, type, source) => {
    // Frost armor absorption
    if (magicSystem && player._frostArmorAbsorb > 0) {
        amount = magicSystem.absorbDamage(amount);
    }
    const pos = player.position.clone();
    pos.y += 1.5;
    spawnDamageNumber(pos, Math.ceil(amount), false, type);
    if (nephalemGlory) nephalemGlory.onDamageTaken();
    if (gamepad && gamepad.rumble) gamepad.rumble(0.3, 0.7, 100);
    if (legendaryPowerSystem) legendaryPowerSystem.onTakeFatalDamage();
};

player.onJump = (isDoubleJump) => {
    if (legendaryPowerSystem) legendaryPowerSystem.onJump(isDoubleJump);
};

player.onPerfectParry = (source) => {
    if (legendaryPowerSystem) legendaryPowerSystem.onPerfectParry();
};

// Parkour-integrated melee callbacks
player.onVaultStrike = (startPos, endPos, facing) => {
    // Vault over enemy = elbow drop behind them
    const mid = new THREE.Vector3().lerpVectors(startPos, endPos, 0.5);
    const hitbox = new Hitbox(player, 'melee', { type: 'sphere', radius: 1.0 }, new THREE.Vector3(0, 0.5, 0), 0.2, (hb, target) => {
        if (target && target.takeDamage) {
            target.takeDamage(20, 'kinetic', player);
            spawnDamageNumber(target.position || target.mesh.position, 20, false, 'kinetic');
        }
    });
    hitbox.damage = 20; hitbox.team = 'player';
    hitboxSystem.registerHitbox(hitbox);
};

player.onWallKick = (pos, dir) => {
    // Boot to face — stun enemy in front of wall
    const offset = dir.clone().multiplyScalar(1.2);
    offset.y = 0.5;
    const hitbox = new Hitbox(player, 'melee', { type: 'sphere', radius: 1.0 }, offset, 0.15, (hb, target) => {
        if (target && target.takeDamage) {
            target.takeDamage(20, 'kinetic', player);
            if (target._stunTimer !== undefined) target._stunTimer = 3.0;
            spawnDamageNumber(target.position || target.mesh.position, 20, false, 'kinetic');
        }
    });
    hitbox.damage = 20; hitbox.team = 'player';
    hitboxSystem.registerHitbox(hitbox);
};

player.onRollHit = (pos, facing) => {
    // Rolling Thunder: invincible tackle
    const dir = new THREE.Vector3(Math.sin(facing), 0, Math.cos(facing));
    const offset = dir.clone().multiplyScalar(0.8);
    offset.y = 0.3;
    const hitbox = new Hitbox(player, 'melee', { type: 'sphere', radius: 0.7 }, offset, 0.05, (hb, target) => {
        if (target && target.takeDamage) {
            target.takeDamage(10, 'kinetic', player);
            spawnDamageNumber(target.position || target.mesh.position, 10, false, 'kinetic');
        }
    });
    hitbox.damage = 10; hitbox.team = 'player';
    hitboxSystem.registerHitbox(hitbox);
};

player.onBackflipKick = (pos, facing) => {
    // Launch enemy upward
    const dir = new THREE.Vector3(Math.sin(facing), 0, Math.cos(facing)).negate();
    const offset = dir.clone().multiplyScalar(1.0);
    offset.y = 0.5;
    const hitbox = new Hitbox(player, 'melee', { type: 'sphere', radius: 1.0 }, offset, 0.15, (hb, target) => {
        if (target && target.takeDamage) {
            target.takeDamage(20, 'kinetic', player);
            if (target.velocity) target.velocity.y += 8; // launch upward
            spawnDamageNumber(target.position || target.mesh.position, 20, false, 'kinetic');
        }
    });
    hitbox.damage = 20; hitbox.team = 'player';
    hitboxSystem.registerHitbox(hitbox);
};

player.onSlideTackle = (pos, facing) => {
    // Slide Tackle: leg sweep knocks down enemy
    const dir = new THREE.Vector3(Math.sin(facing), 0, Math.cos(facing));
    const offset = dir.clone().multiplyScalar(0.6);
    offset.y = 0.3;
    const hitbox = new Hitbox(player, 'melee', { type: 'sphere', radius: 0.9 }, offset, 0.1, (hb, target) => {
        if (target && target.takeDamage) {
            target.takeDamage(15, 'kinetic', player);
            if (target._stunTimer !== undefined) target._stunTimer = 3.0;
            spawnDamageNumber(target.position || target.mesh.position, 15, false, 'kinetic');
        }
    });
    hitbox.damage = 15; hitbox.team = 'player';
    hitboxSystem.registerHitbox(hitbox);
};

player.onLedgeTakedown = (pos, facing, hangData) => {
    // Ledge Takedown: pull enemy over ledge if they're near
    const allEnemies = [
        ...(world.drones ? world.drones.drones : []),
        ...(enemyManager ? enemyManager.enemies : [])
    ];
    for (const e of allEnemies) {
        if (e.isDead || e.team === 'player') continue;
        const ePos = e.position || (e.mesh && e.mesh.position);
        if (!ePos) continue;
        // Enemy must be near the ledge edge, below the player
        const distXZ = Math.hypot(ePos.x - pos.x, ePos.z - pos.z);
        const distY = pos.y - ePos.y;
        if (distXZ < 2.0 && distY > 0.5 && distY < 3.0) {
            if (e.takeDamage) e.takeDamage(50, 'kinetic', player);
            spawnDamageNumber(ePos.clone().add(new THREE.Vector3(0, 1, 0)), 50, true, 'kinetic');
            // Pull enemy down
            if (e.group) e.group.position.y -= 2;
            break;
        }
    }
};

player.onCeilingDrop = (pos, facing) => {
    // Ceiling Drop: assassinate enemy directly below
    const allEnemies = [
        ...(world.drones ? world.drones.drones : []),
        ...(enemyManager ? enemyManager.enemies : [])
    ];
    for (const e of allEnemies) {
        if (e.isDead || e.team === 'player') continue;
        const ePos = e.position || (e.mesh && e.mesh.position);
        if (!ePos) continue;
        const distXZ = Math.hypot(ePos.x - pos.x, ePos.z - pos.z);
        const distY = pos.y - ePos.y;
        if (distXZ < 1.2 && distY > 0 && distY < 5.0) {
            if (e.takeDamage) e.takeDamage(40, 'kinetic', player);
            spawnDamageNumber(ePos.clone().add(new THREE.Vector3(0, 1, 0)), 'ASSASSINATED', true, 'kinetic');
            break;
        }
    }
};

// Hint system
const { showHint, showLootToast } = createHintSystem();

// Equip starter gear based on origin (only on first play)
if (!saveSystem.hasSave()) {
    const startingGear = origin.getStartingGear ? origin.getStartingGear() : null;
    if (startingGear && exoSuit) {
        const template = exoSuit.getItemTemplate ? exoSuit.getItemTemplate(startingGear) : null;
        if (template && affixSystem) {
            const item = affixSystem.generateItem(template);
            exoSuit.equip(item);
            showLootToast(item);
        }
    }
}

// Third person camera
const tpc = new ThirdPersonCamera(camera, player);
tpc.setPostProcessing(postProcessing);
player.cameraController = tpc;

// Attach 3D audio listener to camera
if (audio && typeof audio.attachToCamera === 'function') {
    audio.attachToCamera(tpc.camera || camera);
}

// Level Editor
const levelEditor = new LevelEditor(scene, camera, renderer, world, player);

// Time trial
const timeTrial = new TimeTrial(scene, player);

// Photo mode
const photoMode = new PhotoMode(renderer, scene, camera, player, postProcessing);

// Runner vision
const runnerVision = new RunnerVision(scene, world, timeTrial);

// Decals
const decalSystem = new DecalSystem(scene, world);

// Weather
const weatherSystem = new WeatherSystem(scene, camera, { ambient, sun, fill, points: pointLights });

// Weather gameplay integration
const weatherGameplay = new WeatherGameplay(world);

// Ziplines
const ziplines = new ZiplineNetwork(scene, world);

// Overclock / Heat
const overclock = new OverclockSystem(scene, player, postProcessing);

// Magnet boots
const magnetBoots = new MagnetBoots(scene, world, player);

// Chain grapple relays
const grappleRelays = new ChainGrappleRelays(scene);

// Drone takedowns
const droneTakedown = new DroneTakedown(scene);
// Wire EnemyManager kills through the same unified handler
if (enemyManager) enemyManager.setOnDeathCallback(_handleEnemyKilled);

// Power-ups
const powerUps = new PowerUpSystem(scene, player);

// Hologram platforms
const holograms = new HologramPlatforms(scene, world);

// Structural collapse
const structuralCollapse = new StructuralCollapse(scene, world);

// Rising Tide
const risingTide = new RisingTide(scene, player);

// Particle effects
const particleEffects = new ParticleEffects(scene, player);

// God rays
const godRays = new GodRays(scene, player, world);

// Foot IK
const footIK = new FootIK(scene, player, world);

// Procedural animation
const procAnim = new ProceduralAnimation(scene, player, world);

// Gamepad controller
const gamepad = new GamepadController();
// M4: give gamepad access to keyboard so both inputs can be active simultaneously
gamepad.setKeyboardInput(input);

// Advanced movement
const advMovement = new AdvancedMovement(player, scene, audio, tpc);

// Interactive environment
const interEnv = new InteractiveEnvironment(scene, world, player, world.hazards, audio);
projectileManager.setInteractiveEnvironment(interEnv);

// Zipline gun gadget
const ziplineGun = new ZiplineGun(scene, player, world);

// Advanced drones
const sniperDrone = new SniperDrone(scene, world, player, { grapplingHook: player.grapplingHook });
const swarmDrone = new SwarmDrone(scene, world, player);
const hunterDrone = new HunterDrone(scene, world, player);

// Director mode
const directorMode = new DirectorMode();

// Ghost racing
const ghostRacing = new GhostRacing(scene);

// Bullet time
const bulletTime = new BulletTime();
const legendaryPowerSystem = new LegendaryPowerSystem(player, world, scene, hitboxSystem, damageSystem, bulletTime, enemyHealthBars);

// Assist mode
const assistMode = new AssistMode();
assistMode.setRisingTide(risingTide);

// Speedrun ILs
const speedrunILs = new SpeedrunILs(scene, player, world, timeTrial);

// Challenge system
const challenges = new ChallengeSystem(scene, player);

// Boss Fight (needs directorMode, bulletTime, challenges)
const bossFight = new BossFight(scene, world, player, camera, postProcessing, directorMode, bulletTime, challenges);
// Wire boss victory: unlock NG+ and CollapseMode, also trigger dungeon boss-defeat reward path
bossFight.onVictory = () => {
    if (ngPlus && !ngPlus.isUnlocked()) ngPlus.unlock();
    if (collapse && !collapse.isUnlocked()) collapse.unlock();
    showHint('BOSS DEFEATED — NG+ and Collapse Mode unlocked! Press Y for Collapse.');
};
const riftGuardian = new RiftGuardian(scene, world, player, camera, postProcessing, directorMode, bulletTime, challenges);
const arenaMode = new ArenaMode(scene, world, player, enemyManager, bossFight);

// Phase 8: Boss Roster
const bosses = [];
const bossFabricator = new BossFabricator(scene, world, player, enemyManager);
const bossWarden = new BossWarden(scene, world, player, enemyManager);
const bossLeviathan = new BossLeviathan(scene, world, player);
const bossSwarmQueen = new BossSwarmQueen(scene, world, player, enemyManager);
const bossArchitect = new BossArchitect(scene, world, player);
bosses.push(bossFabricator, bossWarden, bossLeviathan, bossSwarmQueen, bossArchitect);

// Phase 4: Endgame systems
const difficultyTier = new DifficultyTierSystem(challenges);
const apexRift = new ApexRiftSystem(scene, world, player, riftGuardian, challenges, lootSystem, difficultyTier, enemyManager);
const nephalemGlory = new NephalemGlory(player, challenges);

// Register remaining systems with SaveSystem
if (saveSystem && typeof saveSystem.register === 'function' && skillSystem && typeof skillSystem.serialize === 'function') {
    saveSystem.register('skillSystem', () => skillSystem.serialize(), (d) => skillSystem.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && resourceSystem && typeof resourceSystem.serialize === 'function') {
    saveSystem.register('resourceSystem', () => resourceSystem.serialize(), (d) => resourceSystem.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && inventorySystem && typeof inventorySystem.serialize === 'function') {
    saveSystem.register('inventorySystem', () => inventorySystem.serialize(), (d) => inventorySystem.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && factions && typeof factions.serialize === 'function') {
    saveSystem.register('factions', () => factions.serialize(), (d) => factions.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && territory && typeof territory.serialize === 'function') {
    saveSystem.register('territory', () => territory.serialize(), (d) => territory.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && mastery && typeof mastery.serialize === 'function') {
    saveSystem.register('mastery', () => mastery.serialize(), (d) => mastery.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && codex && typeof codex.serialize === 'function') {
    saveSystem.register('codex', () => codex.serialize(), (d) => codex.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && legacy && typeof legacy.serialize === 'function') {
    saveSystem.register('legacy', () => legacy.serialize(), (d) => legacy.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && ngPlus && typeof ngPlus.serialize === 'function') {
    saveSystem.register('ngPlus', () => ngPlus.serialize(), (d) => ngPlus.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && collapse && typeof collapse.serialize === 'function') {
    saveSystem.register('collapse', () => collapse.serialize(), (d) => collapse.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && npcSystem && typeof npcSystem.serialize === 'function') {
    saveSystem.register('npcSystem', () => npcSystem.serialize(), (d) => npcSystem.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && accessorySystem && typeof accessorySystem.serialize === 'function') {
    saveSystem.register('accessorySystem', () => accessorySystem.serialize(), (d) => accessorySystem.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && nephalemGlory && typeof nephalemGlory.serialize === 'function') {
    saveSystem.register('nephalemGlory', () => nephalemGlory.serialize(), (d) => nephalemGlory.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && apexRift && typeof apexRift.serialize === 'function') {
    saveSystem.register('apexRift', () => apexRift.serialize(), (d) => apexRift.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && difficultyTier && typeof difficultyTier.serialize === 'function') {
    saveSystem.register('difficultyTier', () => difficultyTier.serialize(), (d) => difficultyTier.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && bounty && typeof bounty.serialize === 'function') {
    saveSystem.register('bounty', () => bounty.serialize(), (d) => bounty.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && debt && typeof debt.serialize === 'function') {
    saveSystem.register('debt', () => debt.serialize(), (d) => debt.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && consequences && typeof consequences.serialize === 'function') {
    saveSystem.register('consequences', () => consequences.serialize(), (d) => consequences.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && challenges && typeof challenges.serialize === 'function') {
    saveSystem.register('challenges', () => challenges.serialize(), (d) => challenges.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && risingTide && typeof risingTide.serialize === 'function') {
    saveSystem.register('risingTide', () => risingTide.serialize(), (d) => risingTide.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && ghostRacing && typeof ghostRacing.serialize === 'function') {
    saveSystem.register('ghostRacing', () => ghostRacing.serialize(), (d) => ghostRacing.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && speedrunILs && typeof speedrunILs.serialize === 'function') {
    saveSystem.register('speedrunILs', () => speedrunILs.serialize(), (d) => speedrunILs.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && timeTrial && typeof timeTrial.serialize === 'function') {
    saveSystem.register('timeTrial', () => timeTrial.serialize(), (d) => timeTrial.deserialize(d));
}
if (saveSystem && typeof saveSystem.register === 'function' && inventoryStash && typeof inventoryStash.serialize === 'function') {
    saveSystem.register('inventoryStash', () => inventoryStash.serialize(), (d) => inventoryStash.deserialize(d));
}

// ── Zelda-style systems ────────────────────────────────────────────────────
// Heart containers replace the numeric health bar (3 hearts = 12 HP to start)
const heartSystem = new HeartContainerSystem(player);

// Key item system — gates abilities until found in story dungeons
const keyItems = new KeyItemSystem(player);

// Story dungeon portals + state management
const dungeonSystem = new DungeonSystem(scene, player, world, heartSystem, keyItems);

// Demo puzzle room near spawn (two floor switches → opens a conceptual door)
const demoPuzzle = new PuzzleRoom(scene, world, player);
demoPuzzle.addSwitchPuzzle(
    [new THREE.Vector3(4, 0, 6), new THREE.Vector3(6, 0, 6)],
    () => {
        dungeonSystem._spawnPickupText && dungeonSystem._spawnPickupText('Puzzle Solved!', '#ffff44');
    }
);
demoPuzzle.addBlockPuzzle(
    new THREE.Vector3(-5, 0, 8),
    new THREE.Vector3(-5, 0, 5),
    () => {
        if (audio && typeof audio.playSFX === 'function') audio.playSFX('mechanical_click');
    }
);
// H19: wire the room-level solve callback (fires when ALL sub-puzzles are complete)
demoPuzzle.onSolve = () => {
    dungeonSystem._spawnPickupText && dungeonSystem._spawnPickupText('All puzzles complete!', '#44ffaa');
    if (heartSystem && typeof heartSystem.addHeartPiece === 'function') heartSystem.addHeartPiece();
};

// ── Wave-2 Zelda systems ────────────────────────────────────────────────────
const lightDarkWorld = new LightDarkWorldSystem(scene, player, postProcessing, ambient, sun, fill);
const dialogueSystem = new DialogueSystem(player, npcSystem, bounty);
const shop = new ShopSystem(scene, player, heartSystem);
const bottleSystem = new BottleSystem(player, heartSystem, resourceSystem);
shop.setBottleSystem(bottleSystem);
shop.setDebtSystem(debt);
shop.setConsequenceSystem(consequences);
const overworldMap = new OverworldMap(player, dungeonSystem, keyItems);

// UIManager — centralized UI panel toggles, updates, and dynamic DOM creation
const uiManager = new UIManager({
    player, progression, archetype, origin, characterSheet,
    heartSystem, dungeonSystem, exoSuit, companion, loyalty,
    factions, safehouse, bounty, codex, mastery, implants,
    resourceSystem, dialogueSystem, shop, passiveTree, keyItems, risingTide,
    inventoryStash
});
uiManager.createMiniBossBars(miniBosses);
uiManager.createManaBar();

const menuNavigator = new MenuNavigator();

// Apply difficulty scaling to existing world drones
if (world.drones && world.drones.drones && difficultyTier) {
    const diffConfig = difficultyTier.getTierConfig();
    world.drones.drones.forEach(drone => {
        if (drone && drone.maxHealth) {
            drone.maxHealth = Math.floor(drone.maxHealth * diffConfig.hpMult);
            drone.health = drone.maxHealth;
        }
        if (drone && drone.meleeDamage) {
            drone.meleeDamage = (drone.meleeDamage || 10) * diffConfig.dmgMult;
        }
    });
}

// Place interactive environment features
interEnv.addVent(20, 2, 10, 1.5, 1.5);
interEnv.addVent(-15, 3, -10, 1.5, 1.5);
interEnv.addSteamPipe(-20, 2, 20, 'y');
interEnv.addSteamPipe(25, 2, -15, 'y');
interEnv.addMirror(-10, 1.5, -30, 0);
interEnv.addMirror(-10, 1.5, -28, Math.PI/2);
interEnv.addCraneHook(0, 8, 35);
interEnv.addExplosiveBarrel(10, 0, 15);
interEnv.addExplosiveBarrel(-12, 0, 8);
interEnv.addExplosiveBarrel(25, 0, -20);

// Place new world features
world.placeZiplines(ziplines);
world.placeCoolantPuddles(overclock);
world.placeGrappleRelays(grappleRelays);
world.placePowerUps(powerUps);
world.placeHologramZones(holograms);
world.markStructuralElements(structuralCollapse);

// Wire player to world (drones & collectibles)
world.setPlayer(player);

// Wire HeartContainerSystem to collectible heart piece pickups
world.collectibles.onHeartPieceCollected = () => {
    heartSystem.addHeartPiece();
};

// Input
const input = new InputManager();

// Touch controls (fullscreen overlay on canvas)
const touchControls = new TouchControls(renderer.domElement, input);
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouchDevice) {
    touchControls.setEnabled(true);
}

// UI elements
const startScreen = document.getElementById('start-screen');
const ui = document.getElementById('ui');
const crosshair = document.getElementById('crosshair');
const stateDisplay = document.getElementById('state-display');
const speedDisplay = document.getElementById('speed-display');
const levelDisplay = document.getElementById('level-display');
const xpDisplay = document.getElementById('xp-display');
const apDisplay = document.getElementById('ap-display');

// Editor UI elements
const editorUI = document.getElementById('editor-ui');
const editorPalette = document.getElementById('editor-palette');
const editorProperties = document.getElementById('editor-properties');
const editorPropList = document.getElementById('prop-list');
const editorToolbar = document.getElementById('editor-toolbar');
const editorFileInput = document.getElementById('editor-file-input');

// Boss UI elements
const bossHUD = document.getElementById('boss-hud');
const bossHealthFill = document.getElementById('boss-health-fill');
const bossPhaseLabel = document.getElementById('boss-phase');
const bossVictory = document.getElementById('boss-victory');

let gameStarted = false;
let paused = false;
let gameOver = false;
// H14: expose these to window so PhotoMode's raw keydown listener can guard on them
Object.defineProperty(window, 'gameStarted', { get: () => gameStarted });
Object.defineProperty(window, 'paused',      { get: () => paused });
window.gameOver = gameOver; // expose for PhotoMode/RunnerVision guards

// Pause menu wiring
const pauseMenu = document.getElementById('pause-menu');
const btnResume = document.getElementById('pause-resume');
const btnSettings = document.getElementById('pause-settings');
const btnQuit = document.getElementById('pause-quit');

if (btnResume) {
    btnResume.addEventListener('click', () => {
        paused = false;
        if (pauseMenu) pauseMenu.style.display = 'none';
        document.body.requestPointerLock();
    });
}
if (btnSettings) {
    btnSettings.addEventListener('click', () => {
        const sp = document.getElementById('settings-panel');
        if (sp) sp.style.display = (sp.style.display === 'block') ? 'none' : 'block';
    });
}
if (btnQuit) {
    btnQuit.addEventListener('click', () => {
        paused = false;
        gameOver = false;
        gameStarted = false;
        if (bossFight && typeof bossFight.cleanup === 'function') bossFight.cleanup();
        if (apexRift && typeof apexRift.endRun === 'function') apexRift.endRun();
        if (player) {
            player.isDead = false;
            player.health = player.maxHealth || 100;
            player.state = 'idle';
        }
        if (statusEffectSystem && typeof statusEffectSystem.clearAll === 'function') statusEffectSystem.clearAll();
        // Hide any overlays
        const overlays = ['rift-result-overlay','death-screen','boss-victory','celebration'];
        overlays.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
        if (pauseMenu) pauseMenu.style.display = 'none';
        startScreen.style.display = 'flex';
        ui.style.display = 'none';
        crosshair.style.display = 'none';
        const hcr = document.getElementById('heart-container-row');
        if (hcr) hcr.style.display = 'none';
        const skb = document.getElementById('sector-key-bar');
        if (skb) skb.style.display = 'none';
        if (skillBarUI) skillBarUI.hide();
    });
}

startScreen.addEventListener('click', () => {
    audio.playUIClick();
    document.body.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement) {
        if (!gameStarted) gameStarted = true;
        startScreen.style.display = 'none';
        if (paused) {
            paused = false;
            if (pauseMenu) pauseMenu.style.display = 'none';
        }
        if (!levelEditor.isActive()) {
            ui.style.display = 'block';
            crosshair.style.display = 'block';
            const hcr = document.getElementById('heart-container-row');
            if (hcr) hcr.style.display = 'flex';
            const skb = document.getElementById('sector-key-bar');
            if (skb) skb.style.display = 'flex';
            if (skillBarUI) skillBarUI.show();
        }
        if (!audio._ambiencePlaying) audio.playAmbience();
    } else {
        // Do NOT conflate pointer lock loss with pause or game stop
        if (paused) {
            paused = false;
            if (pauseMenu) pauseMenu.style.display = 'none';
        }
        audio._ambiencePlaying = false;
    }
});

/* ============================================================
   EDITOR UI EVENT LISTENERS
   ============================================================ */
const updatePropertyPanel = wireEditorUI(levelEditor, editorUI, ui, crosshair, editorPalette, editorProperties, editorPropList, editorToolbar, editorFileInput);

/* ============================================================
   BOSS FIGHT UI
   ============================================================ */
document.getElementById('boss-exit').addEventListener('click', () => {
    bossFight.cleanup();
    bossVictory.style.display = 'none';
    bossHUD.style.display = 'none';
    ui.style.display = 'block';
    document.body.requestPointerLock();
    if (player) {
        player.position.set(0, 2, 0); // warehouse default spawn
        player.health = player.maxHealth || 100;
        player.isDead = false;
        player.state = 'idle';
    }
    if (statusEffectSystem && typeof statusEffectSystem.clearAll === 'function') statusEffectSystem.clearAll();
});

// Death screen respawn button
document.getElementById('death-respawn').addEventListener('click', () => {
    gameOver = false;
    if (player) player.respawn();
    document.getElementById('death-screen').style.display = 'none';
    document.body.requestPointerLock();
});

// Handle resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    postProcessing.resize(window.innerWidth, window.innerHeight);
});

// Day/night toggle
let dayNightPressed = false;
const presets = ['day', 'night', 'neon'];
let presetIndex = 0;

// Damage number floating text system
const damageNumbers = new DamageNumbers(camera);
function spawnDamageNumber(position, amount, isCrit, damageType) {
    damageNumbers.spawn(position, amount, isCrit, damageType);
}

// Wire all 25 skill execution callbacks (now that all referenced systems exist)
wireSkillCallbacks({
    skillSystem, staminaSystem, Hitbox, hitboxSystem,
    world, player, projectileManager, resourceSystem,
    particleEffects, legendaryPowerSystem, gamepad,
    scene, audio, spawnDamageNumber, activeArchetypeId,
    nephalemGlory, enemyHealthBars, characterSheet,
    postProcessing
});

let settings = { ...DEFAULT_SETTINGS };
window.settingsStore = settings;

wireSettings(settings, { postProcessing, audio, assistMode, player, touchControls, saveSystem });
const keybindingsGamepadCheck = wireKeybindings(gamepad);

window.settingsStore = settings;

// Game loop
const clock = new THREE.Clock();
let autoSaveTimer = 0;

function animate() {
    requestAnimationFrame(animate);
    
    const rawDt = clock.getDelta();
    let dt = Math.min(rawDt, 0.05);

    
    if (gameStarted) {
        if (touchControls && typeof touchControls.update === 'function') touchControls.update();
        if (gameOver) return;
        // Check for gamepad keybinding input
        if (keybindingsGamepadCheck) keybindingsGamepadCheck();
        // Use gamepad if connected, otherwise keyboard/mouse
        const activeInput = (gamepad.gamepad) ? gamepad : input;
        activeInput.preUpdate(); // sole source of truth — Player.js must NOT call this too
        const mouseDelta = activeInput.consumeMouse();

        // Menu navigation (gamepad/keyboard focus)
        if (typeof menuNavigator !== 'undefined' && menuNavigator) {
            menuNavigator.update(activeInput);
        }
        
        // === PAUSE TOGGLE ===
        if (activeInput.wasPressed('Escape')) {
            if (paused) {
                paused = false;
                if (pauseMenu) pauseMenu.style.display = 'none';
                document.body.requestPointerLock();
            } else {
                // Close the topmost open panel first; only show pause if none were open
                const closedPanel = uiManager && typeof uiManager.closeOpenPanel === 'function'
                    ? uiManager.closeOpenPanel() : false;
                if (!closedPanel) {
                    paused = true;
                    if (uiManager && typeof uiManager.closeAllPanels === 'function') uiManager.closeAllPanels();
                    if (pauseMenu) pauseMenu.style.display = 'flex';
                    document.exitPointerLock();
                }
            }
        }
        
        if (paused) {
            dt = 0;
            postProcessing.render(dt, 0);
            return;
        }
        
        // === EDITOR MODE TOGGLE (F1) ===
        if (__DEV__ && activeInput.wasPressed('F1')) {
            levelEditor.toggle();
            if (levelEditor.isActive()) {
                document.exitPointerLock();
                editorUI.classList.add('active');
                ui.style.display = 'none';
                crosshair.style.display = 'none';
                bossHUD.style.display = 'none';
            } else {
                editorUI.classList.remove('active');
                ui.style.display = 'block';
                crosshair.style.display = 'block';
                document.body.requestPointerLock();
            }
        }
        
        // Death screen
        if (player && player.isDead) {
            const deathScreen = document.getElementById('death-screen');
            if (deathScreen && deathScreen.style.display !== 'flex') {
                deathScreen.style.display = 'flex';
                if (document.pointerLockElement) document.exitPointerLock();
            }
            gameOver = true;
        } else {
            const deathScreen = document.getElementById('death-screen');
            if (deathScreen && deathScreen.style.display === 'flex') deathScreen.style.display = 'none';
        }

        // === SKILL BAR INPUTS (RMB / E / R) ===
        if (skillSystem && player && !player.isDead && !player._empDisabled) {
            if (activeInput.wasPressed('Mouse2')) skillSystem.useSkill('RMB');
            if (activeInput.wasPressed('KeyE') && player.state !== 'CLIMB' && player.state !== 'HANG') skillSystem.useSkill('E');
            if (activeInput.wasPressed('KeyR')) skillSystem.useSkill('R');
        }

        // === UNIFIED INPUT DISPATCHERS ===

        // --- Mouse1 (LMB) dispatcher ---
        if (activeInput.wasPressed('Mouse1')) {
            if (player.grapplingHook && player.grapplingHook.isAiming()) {
                ziplineGun.fire(player.facingDirection || new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing)));
                activeInput.consumeKey('Mouse1');
            } else if (skillSystem && skillSystem.canUse('LMB')) {
                skillSystem.useSkill('LMB');
                activeInput.consumeKey('Mouse1');
            }
            // Else: let CombatSystem fire weapon
        }

        // --- KeyQ dispatcher ---
        if (activeInput.wasPressed('KeyQ')) {
            if (player.grapplingHook && player.grapplingHook.isAiming()) {
                const pulled = player.grapplingHook.pullEnemy();
                if (pulled && spawnDamageNumber) {
                    const pPos = pulled.position || (pulled.mesh && pulled.mesh.position);
                    if (pPos) spawnDamageNumber(pPos.clone().add(new THREE.Vector3(0, 1, 0)), 'YANKED', false, 'kinetic');
                }
                activeInput.consumeKey('KeyQ');
            } else if (activeInput.isPressed('ShiftLeft')) {
                if (player.comboSystem && player.comboSystem.flowMeter >= 100) {
                    player.comboSystem.flowMeter = 0;
                    if (skillSystem) skillSystem.useSkill('decoy');
                    player.isInvisible = true;
                    setTimeout(() => { player.isInvisible = false; }, 3000);
                } else if (overclock.tryActivate()) {
                    // Overclock triggered
                }
                activeInput.consumeKey('KeyQ');
            } else {
                if (skillSystem) skillSystem.useSkill('Q');
                activeInput.consumeKey('KeyQ');
            }
        }

        // --- KeyF dispatcher ---
        if (activeInput.wasPressed('KeyF')) {
            let handled = false;
            // 1. Shift+F → Parry (only if grounded, not in UI)
            if (activeInput.isPressed('ShiftLeft') && player.grounded && !dialogueSystem.isOpen && !shop.isOpen) {
                const didParry = player.triggerParry();
                if (didParry && audio) audio.playTone(880, 0.05, 'sine');
                handled = true;
            // 2. If dialogue open → advance/close
            } else if (dialogueSystem.isOpen) {
                dialogueSystem._advance();
                handled = true;
            // 3. If shop open → close
            } else if (shop.isOpen) {
                shop.close();
                handled = true;
            // 4. If near NPC → dialogue
            } else if (dialogueSystem._nearNpcId) {
                dialogueSystem.openDialogue(dialogueSystem._nearNpcId);
                handled = true;
            // 5. If near shop → open shop
            } else if (shop.checkProximity(player.position)) {
                shop.open();
                handled = true;
            // 6. If near dungeon → enter
            } else if (!dungeonSystem.activeDungeon && dungeonSystem.nearbyDungeonId) {
                dungeonSystem.enterDungeon(dungeonSystem.nearbyDungeonId);
                handled = true;
            // 7. If near puzzle block → push
            } else if (demoPuzzle && demoPuzzle._pushCooldown <= 0) {
                const pushDir = new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing)).normalize();
                for (const block of demoPuzzle._blocks) {
                    if (block.tryPush(pushDir, player.position)) {
                        demoPuzzle._pushCooldown = 0.35;
                        handled = true;
                        break;
                    }
                }
            }
            // 8. Else → Faction Panel toggle
            if (!handled) {
                const fp = document.getElementById('faction-panel');
                if (fp) fp.style.display = (fp.style.display === 'block') ? 'none' : 'block';
            }
            if (handled) activeInput.consumeKey('KeyF');
        }
        
        // === BOSS FIGHT TOGGLE (B) ===
        if (activeInput.wasPressed('KeyB') && !bossFight.isActive() && !levelEditor.isActive()) {
            bossFight.start();
            bossHUD.style.display = 'block';
            ui.style.display = 'none';
        }
        
        // === DIFFICULTY TIER CYCLE (Shift+T) ===
        if (activeInput.wasPressed('KeyT') && activeInput.isPressed('ShiftLeft')) {
            arenaMode.toggleSelector();
        }
        
        // === APEX RIFT TOGGLE (T) — only fire if Shift is NOT held ===
        if (activeInput.wasPressed('KeyT') && !activeInput.isPressed('ShiftLeft') && apexRift && !apexRift.active && !bossFight.isActive() && !levelEditor.isActive()) {
            apexRift.startRift();
            showHint('Press T to enter the Apex Rift — endgame awaits.');
        }

        // === COLLAPSE MODE (Y) ===
        if (activeInput.wasPressed('KeyY')) {
            // Auto-unlock once all dungeons are complete or if already unlocked
            if (dungeonSystem && dungeonSystem.allDungeonsComplete && dungeonSystem.allDungeonsComplete()) {
                if (collapse && !collapse.isUnlocked()) collapse.unlock();
            }
            if (collapse && collapse.isUnlocked()) {
                collapse.startRun();
                showHint('COLLAPSE MODE — survive all 10 floors!');
            } else {
                showHint('Collapse Mode locked — complete all dungeons first.');
            }
        }

        if (activeInput.wasPressed('KeyM')) {
            const tiers = ['normal','nightmare','hell','torment1','torment2','torment3','torment4','torment5','torment6'];
            const currentId = difficultyTier.currentTierId || 'normal';
            const currentIdx = tiers.indexOf(currentId);
            let next = (currentIdx + 1) % tiers.length;
            let attempts = 0;
            while (attempts < tiers.length) {
                if (difficultyTier.setTier(tiers[next])) break;
                next = (next + 1) % tiers.length;
                attempts++;
            }
        }
        
        // === EDITOR MODE ===
        if (levelEditor.isActive()) {
            levelEditor.handleInput(activeInput, mouseDelta);
            levelEditor.update(dt);
            updatePropertyPanel();
            postProcessing.render(dt, 0);
            return;
        }
        
        tpc.update(dt, mouseDelta, world);
        
        // Auto-save every 30 seconds
        autoSaveTimer += dt;
        if (autoSaveTimer >= 30) {
            saveSystem.save();
            autoSaveTimer = 0;
        }

        // Overclock / Heat (compute early for finalDt) — gated by key item and EMP disable
        const _empBlocked = player._empDisabled === true;
        const timeScale = (!_empBlocked && player.overclockUnlocked !== false) ? overclock.update(dt, activeInput) : 1.0;
        const slowMo = droneTakedown.update(dt, player, activeInput, world.drones.drones);
        if (droneTakedown.slowMoTimer > 0) bulletTime.trigger(player.position, 5);
        const finalDt = dt * Math.min(timeScale, slowMo);
        
        // Update platforms
        for (const platform of world.platforms) {
            platform.update(finalDt);
        }
        
        // Platform carrying player
        const platform = world.getPlatformUnderPlayer(player);
        if (platform && player.grounded && player.state !== 'VAULT' && player.state !== 'CLIMB') {
            const platVel = platform.currentVelocity;
            player.position.x += platVel.x * dt;
            player.position.z += platVel.z * dt;
            player.position.y = platform.getTopY();
        }
        
        // Update hazards
        world.hazards.update(finalDt, player);
        
        // Time trial input & update
        timeTrial.handleInput(activeInput);
        
        // Photo mode update
        photoMode.update(dt, input);
        if (photoMode.isActive()) {
            postProcessing.render(dt, 0);
            return;
        }
        
        // Report events for trick dictionary
        if (activeInput.wasPressed('Space') && player.state === 'CLIMB') {
            challenges.reportEvent('climbCancel');
        }
        
        // Panel toggles (delegated to UIManager)
        const uiConsumed = uiManager.handleInput(activeInput);
        if (uiConsumed) return;

        // Speedrun IL hotkeys
        if (activeInput.wasPressed('Digit1')) speedrunILs.startIL('Rooftop');
        if (activeInput.wasPressed('Digit2')) speedrunILs.startIL('Freezer');
        if (activeInput.wasPressed('Digit3')) speedrunILs.startIL('ServerRoom');
        if (activeInput.wasPressed('Digit4')) speedrunILs.startIL('HangarBay');
        
        // Day/night toggle
        if (activeInput.isPressed('KeyN') && !dayNightPressed) {
            dayNightPressed = true;
            presetIndex = (presetIndex + 1) % presets.length;
            postProcessing.setTimeOfDay(presets[presetIndex]);
            godRays.setTimeOfDay(presets[presetIndex]);
        } else if (!activeInput.isPressed('KeyN')) {
            dayNightPressed = false;
        }
        
        // Freeze player during countdown or dialogue
        if (timeTrial.state !== 'COUNTDOWN' && !dialogueSystem.isOpen) {
            player.update(finalDt, activeInput, tpc.yaw);
            if (player.state === 'WALLRUN') showHint('Wallrun — press SPACE to jump off!');
            if (player.state === 'GRAPPLE_SWING') showHint('Hold RMB to grapple-swing. Release to fly!');
        
        // Procedural animation
        procAnim.update(finalDt);
        
        // Foot IK
        footIK.update(finalDt);
        } else {
            // Still update trajectory and visuals during countdown
            player.trajectory.hide();
            player.updateVisuals(dt, new THREE.Vector3(), activeInput);
        }
        
        timeTrial.update(dt, player);
        
        // Save ghost run on time trial finish
        if (timeTrial.state === 'FINISHED' && timeTrial.prevState !== 'FINISHED') {
            ghostRacing.saveRun('run_' + Date.now());
        }
        
        // Update drones
        world.drones.update(finalDt);
        enemyManager.update(finalDt);
        enemyManager.clearDead();
        miniBosses.forEach(mb => mb.update(finalDt));
        weaponSystem.update(finalDt, activeInput);
        arenaMode.update(finalDt);
        if (bossFight && typeof bossFight.update === 'function') bossFight.update(finalDt);
        for (const boss of bosses) {
            if (boss && typeof boss.update === 'function') boss.update(finalDt);
        }
        
        // Update collectibles
        world.collectibles.update(finalDt, player);
        
        // Update decals
        decalSystem.update(finalDt, player);
        
        // Update runner vision
        runnerVision.update(finalDt);
        
        // Update weather gameplay
        weatherGameplay.update(dt, weatherSystem);
        
        // Update weather
        weatherSystem.update(dt);
        
        // Update power ups
        powerUps.update(finalDt);
        
        // Update holograms
        holograms.update(finalDt, player);
        
        // Update structural collapse
        structuralCollapse.update(finalDt, player);
        
        // Update rising tide
        risingTide.update(finalDt);
        
        // Update particles
        particleEffects.update(finalDt);
        
        // Update ziplines — gated by key item
        if (player.ziplineKitUnlocked !== false) ziplines.update(finalDt, player, activeInput);
        
        // Update magnet boots — gated by key item
        if (player.magnetBootsUnlocked !== false) magnetBoots.update(finalDt, activeInput);
        
        // Update grapple relays
        grappleRelays.update(finalDt, player);
        
        // Advanced movement
        advMovement.update(finalDt, activeInput);
        
        // Interactive environment
        interEnv.update(finalDt, activeInput);
        ziplineGun.update(finalDt);

        // Zipline Gun and Grapple Pull are now handled by unified input dispatchers above

        // Drone Meat Shield: hold E near a hacked/friendly drone = absorb 50 dmg
        if (activeInput.isPressed('KeyE') && !player.isDead) {
            const drones = world.drones ? world.drones.drones : [];
            let shieldDrone = null;
            for (const drone of drones) {
                if (drone.isDead || drone.team !== 'player') continue;
                const pos = drone.position || (drone.mesh && drone.mesh.position);
                if (pos && pos.distanceTo(player.position) < 2.5) {
                    shieldDrone = drone;
                    break;
                }
            }
            if (shieldDrone) {
                if (!player._meatShield) player._meatShield = 50;
                // Visual: drone hovers in front of player
                const front = new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing)).multiplyScalar(1.2);
                const targetPos = player.position.clone().add(front);
                targetPos.y = Math.max(targetPos.y, 1);
                const sPos = shieldDrone.position || (shieldDrone.mesh && shieldDrone.mesh.position);
                if (sPos) sPos.lerp(targetPos, 0.1);
            }
        } else {
            player._meatShield = 0;
        }

        // Decoy Afterimage is now handled by unified KeyQ dispatcher above

        // Disk Throw: G key fires a ricocheting disk projectile
        if (activeInput.wasPressed('KeyG') && projectileManager) {
            const dir = new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing));
            projectileManager.fireRicochet(
                player.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
                dir,
                { bounces: 3, damage: 15, damageType: 'kinetic', color: 0xccff00 }
            );
        }
        
        // Advanced drones
        sniperDrone.update(finalDt);
        swarmDrone.update(finalDt);
        if (risingTide.active) hunterDrone.update(finalDt);
        
        // Director mode
        directorMode.update(finalDt, player, camera, tpc);
        
        // Ghost racing
        ghostRacing.recordFrame(finalDt, player);
        ghostRacing.update(finalDt);
        
        // Bullet time
        const bulletScale = bulletTime.update(finalDt);
        
        // Assist mode
        assistMode.update(finalDt, player, activeInput);
        staminaSystem.update(finalDt, player);
        combatSystem.update(finalDt, activeInput);
        statusEffectSystem.update(finalDt);
        if (magicSystem) magicSystem.update(finalDt);
        
        // Speedrun ILs
        speedrunILs.update(finalDt);
        
        // Challenge system
        challenges.update(finalDt);
        challenges.updateMovementTime(finalDt, player.state === 'SPRINT');
        if (player.state === 'SPRINT' && legendaryPowerSystem) legendaryPowerSystem.onSprint(finalDt);

        // Sprint Shoulder Bash: auto-trigger when sprinting into enemy
        if (player.state === 'SPRINT') {
            if (!player._shoulderBashCooldown) player._shoulderBashCooldown = 0;
            player._shoulderBashCooldown -= finalDt;
            if (player._shoulderBashCooldown <= 0) {
                const allEnemies = [
                    ...(world.drones ? world.drones.drones : []),
                    ...(enemyManager ? enemyManager.enemies : [])
                ];
                for (const e of allEnemies) {
                    if (e.isDead || e.team === 'player') continue;
                    const pos = e.position || (e.mesh && e.mesh.position);
                    if (!pos) continue;
                    const dist = player.position.distanceTo(pos);
                    if (dist < 1.5) {
                        if (e.takeDamage) e.takeDamage(25, 'kinetic', player);
                        spawnDamageNumber(pos.clone().add(new THREE.Vector3(0, 1, 0)), 25, false, 'kinetic');
                        if (gamepad && gamepad.rumble) gamepad.rumble(0.3, 0.6, 80);
                        player._shoulderBashCooldown = 1.0;
                        break;
                    }
                }
            }
        }

        // RPG systems update
        if (archetype) archetype.update(dt);
        // ProgressionSystem has no update() method
        if (companion) companion.update(finalDt, player, world, world.drones ? world.drones.drones : []);
        if (territory) territory.update(finalDt);
        if (loyalty && typeof loyalty.update === 'function') loyalty.update(finalDt);
        if (npcSystem) npcSystem.update && npcSystem.update(finalDt, 12); // noon default
        if (blackout) blackout.update && blackout.update(finalDt, 12);
        if (rivals) rivals.update && rivals.update(finalDt, player);
        if (mastery) mastery.update && mastery.update(finalDt, player);
        if (subLevels) subLevels.update && subLevels.update(finalDt, player);
        if (collapse) collapse.update && collapse.update(finalDt, player);
        if (safehouse) safehouse.update && safehouse.update(finalDt);
        if (bounty) bounty.update && bounty.update(finalDt, player);
        if (codex) codex.update && codex.update(finalDt, player);
        if (implants) implants.update && implants.update(finalDt, player);
        if (legacy) legacy.update && legacy.update(finalDt);
        if (ngPlus) ngPlus.update && ngPlus.update(finalDt);
        if (consequences) consequences.update && consequences.update(finalDt);
        if (debt) debt.update && debt.update(finalDt);
        if (shop) shop.update && shop.update(finalDt);
        if (factions) factions.update && factions.update(finalDt);
        if (familiarity) familiarity.update && familiarity.update(finalDt);
        if (apexRift) apexRift.update(finalDt);
        if (nephalemGlory) nephalemGlory.update(finalDt);
        if (legendaryPowerSystem) legendaryPowerSystem.update(finalDt);
        if (projectileManager) projectileManager.update(finalDt);

        // Proxy mine loop
        if (world._proximityMines) {
            for (let i = world._proximityMines.length - 1; i >= 0; i--) {
                const mine = world._proximityMines[i];
                if (mine.exploded) continue;
                const drones = world.drones ? world.drones.drones : [];
                for (const drone of drones) {
                    if (drone.isDead) continue;
                    const pos = drone.position || (drone.mesh && drone.mesh.position);
                    if (pos && pos.distanceTo(mine.mesh.position) < 3) {
                        mine.exploded = true;
                        particleEffects.explosion(mine.mesh.position.clone(), 0xff3300, 20);
                        const hb = new Hitbox(
                            { position: mine.mesh.position }, 'explosion', { type: 'sphere', radius: 3 }, new THREE.Vector3(0,0,0), 0.3
                        );
                        hb.damage = 40; hb.team = 'player';
                        hitboxSystem.registerHitbox(hb);
                        scene.remove(mine.mesh);
                        mine.mesh.geometry.dispose(); mine.mesh.material.dispose();
                        world._proximityMines.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // Decoy loop
        if (world._decoys) {
            for (const decoy of world._decoys) {
                if (decoy.isDead || !decoy.mesh) continue;
                const drones = world.drones ? world.drones.drones : [];
                for (const drone of drones) {
                    if (drone._decoyTarget === decoy && !drone.isDead) {
                        const pos = drone.position || (drone.mesh && drone.mesh.position);
                        if (pos) {
                            const dir = decoy.mesh.position.clone().sub(pos).normalize();
                            drone.group.position.addScaledVector(dir, (drone.speed || 2.5) * finalDt);
                        }
                    }
                }
            }
        }

        // ── Zelda systems update ───────────────────────────────────────────
        // Key-item gates: skip locked subsystems
        const _magnetActive = player.magnetBootsUnlocked !== false;
        const _overclockActive = player.overclockUnlocked !== false;

        // Wave-2 Zelda systems (dialogue & shop handle F internally; ordered for priority)
        lightDarkWorld.update(finalDt, activeInput);
        dialogueSystem.update(finalDt, activeInput);
        shop.update(finalDt, activeInput);
        bottleSystem.update(finalDt, activeInput);
        weaponLoadoutUI.update(finalDt, activeInput);
        overworldMap.update(finalDt, activeInput);

        dungeonSystem.update(finalDt, activeInput);
        demoPuzzle.update(finalDt, activeInput);

        // Dungeon enter is now handled by unified KeyF dispatcher above
        // Dungeon exit via Tab
        if (dungeonSystem.activeDungeon && activeInput.wasPressed('Tab')) {
            dungeonSystem.exitDungeon();
        }
        
        // Sync Nephalem Glory damage multiplier to CharacterSheet temp bonus
        if (nephalemGlory && characterSheet) {
            const gloryMult = nephalemGlory.getDamageMultiplier();
            const baseMult = gloryMult > 1.0 ? gloryMult - 1.0 : 0;
            characterSheet.addTempBonus('nephalem_glory', 'damageMultiplier', baseMult, 10);
        }
        if (codex) codex.update && codex.update(finalDt, player);
        if (consequences) consequences.update && consequences.update(finalDt);
        if (debt) debt.update && debt.update(finalDt);
        
        // Combat systems update
        if (hitboxSystem) {
            hitboxSystem.update(finalDt);
            hitboxSystem.checkCollisions(damageSystem);
        }
        if (lootSystem) lootSystem.update(finalDt, player.position);
        enemyHealthBars.forEach(bar => { if (bar && bar.update) bar.update(finalDt); });

        // Legendary power: refresh when gear changes
        if (legendaryPowerSystem && exoSuit) {
            const allAffixes = [];
            for (const slot of ['FRAME','BOOTS','GLOVES','OPTICS']) {
                const item = exoSuit.equipped[slot];
                if (item && item.affixes) allAffixes.push(...item.affixes);
            }
            legendaryPowerSystem.refreshPowers(allAffixes);
        }
        
        // Skill system update
        if (skillSystem) skillSystem.update(finalDt);
        if (skillBarUI) skillBarUI.update();
        
        // Boss fight + all panel updates (delegated to UIManager)
        if (uiManager) {
            uiManager.updateBossHUD(bossFight, challenges);
            uiManager.update(dt);
            uiManager.updateMiniBossBars(miniBosses);
        }

        // Damage numbers
        if (damageNumbers) damageNumbers.update(dt);

        // Inventory quick-use (keys 6-9) — inventorySystem handles RPG consumables
        // BottleSystem also listens on 6-9 for Zelda-style bottle slots (independent)
        if (activeInput.wasPressed('Digit6')) inventorySystem.useItem('health_potion');
        if (activeInput.wasPressed('Digit7')) inventorySystem.useItem('mana_potion');
        if (activeInput.wasPressed('Digit8')) inventorySystem.useItem('stamina_vial');
        if (activeInput.wasPressed('Digit9')) inventorySystem.useItem('smoke_bomb');
        
        // Time freeze from power-up
        let renderDt = finalDt;
        if (powerUps.isTimeFrozen()) {
            renderDt = dt * 0.1; // only camera/FX update at near-normal speed
        }
        
        // Rumble on hard landing
        if (player.grounded && !player.prevGrounded && activeInput === gamepad) {
            const impact = Math.abs(player.prevVelocity.y);
            if (impact > 5) gamepad.rumble(Math.min(1, impact / 15), 150);
        }
        
        // Update lens flares
        lensFlare.update(renderDt, camera);
        
        // Render with post-processing
        const rawSpeed = Math.sqrt(player.velocity.x ** 2 + player.velocity.z ** 2);
        postProcessing.render(renderDt, rawSpeed);
    } else {
        renderer.render(scene, camera);
    }
}

// H16: Hide loading overlay after the first rendered frame, not synchronously during init.
// This ensures the GPU has actually produced a frame before the overlay disappears.
setLoadProgress('Ready!');
const loadingOverlay = document.getElementById('loading-overlay');
requestAnimationFrame(() => {
    animate();
    requestAnimationFrame(() => {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    });
});
