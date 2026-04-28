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
import { ProceduralWeaponSystem } from './ProceduralWeaponSystem.js';
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
import { GemSystem } from './GemSystem.js';
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
import { SoulsSystem } from './SoulsSystem.js';
import { DamageNumbers } from './DamageNumbers.js';
import { UIManager } from './UIManager.js';
import { MenuNavigator } from './MenuNavigator.js';
import { wireEditorUI } from './EditorUI.js';
import { GameContext } from './GameContext.js';
import { GameDirector } from './GameDirector.js';
import { i18n } from './I18n.js';
import { controllerPrompts } from './ControllerPrompts.js';
import { SubtitleSystem } from './SubtitleSystem.js';
import { AccessibilityManager } from './AccessibilityManager.js';
import { AimAssist } from './AimAssist.js';
import { DirectionalDamageIndicator } from './DirectionalDamageIndicator.js';
import { BuildCodeSystem } from './BuildCodeSystem.js';
import { SeasonSystem } from './SeasonSystem.js';
import { initExpansionSystems } from './ExpansionSystems.js';
import {
    wireExpansionSystems, updateMeatShield, updateShoulderBash,
    updateProxyMines, updateDecoys, updateExpansionSystems
} from './ExpansionWiring.js';

const __DEV__ = window.location.hash === '#dev';
window.__DEV__ = __DEV__;

// Init i18n early so modules can reference it
i18n.init(['en']).then(() => i18n.applyDOM());
window.i18n = i18n;
window.controllerPrompts = controllerPrompts;

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

// Accessibility manager (needs postProcessing for epilepsy safe mode)
const accessibilityManager = new AccessibilityManager(postProcessing);
window.accessibilityManager = accessibilityManager;
ctx.register('accessibilityManager', ['postProcessing'], () => accessibilityManager);

// Subtitle system
const subtitleSystem = new SubtitleSystem();
window.subtitleSystem = subtitleSystem;
ctx.register('subtitleSystem', [], () => subtitleSystem);

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
window.audioManager = audio; // expose for Player.js / WeaponSystem.js SFX hooks
ctx.register('audio', ['scene', 'world'], () => audio);

// Player (camera controller wired after tpc is created later)
setLoadProgress('Creating player...');
const player = new Player(scene, world, camera, audio, null);
ctx.register('player', ['scene', 'world', 'camera', 'audio'], () => player);

// Combat polish systems
const aimAssist = new AimAssist(player, camera);
window.aimAssist = aimAssist;
ctx.register('aimAssist', ['player', 'camera'], () => aimAssist);

const directionalDamageIndicator = new DirectionalDamageIndicator();
ctx.register('directionalDamageIndicator', [], () => directionalDamageIndicator);

// Season system (real-world date rotations)
const seasonSystem = new SeasonSystem(player);
ctx.register('seasonSystem', ['player'], () => seasonSystem);
seasonSystem.apply();

// Unified save system
const saveSystem = new SaveSystem();
ctx.register('saveSystem', [], () => saveSystem);

// Hint / loot toast UI is needed by gear setup and later onboarding hooks.
const { showHint, showLootToast } = createHintSystem();

// Souls-like risk layer (echo shards + healing vials + safehouse rest)
const soulsSystem = new SoulsSystem(scene, player);
ctx.register('soulsSystem', ['scene', 'player'], () => soulsSystem);

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
const gemSystem = new GemSystem();
inventoryStash.setGemSystem(gemSystem);
ctx.register('gemSystem', [], () => gemSystem);
const affixSystem = new AffixSystem();
ctx.register('affixSystem', [], () => affixSystem);
const lootSystem = new LootSystem(scene, player, exoSuit, affixSystem);
ctx.register('lootSystem', ['scene', 'player', 'exoSuit', 'affixSystem'], () => lootSystem);
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
const proceduralWeaponSystem = new ProceduralWeaponSystem({ defaultLevel: 10 });
ctx.register('proceduralWeaponSystem', [], () => proceduralWeaponSystem);
lootSystem.setProceduralWeaponSystem(proceduralWeaponSystem);
inventoryStash.setWeaponSystem(weaponSystem, scene);
if (__DEV__) {
    window.proceduralWeaponSystem = proceduralWeaponSystem;
}
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

// Deferred-load is now handled by SaveSystem.register() itself — no manual hack needed.

const {
    pipeWrench, semiAutoPistol, assaultRifle, shotgun, stickyBomb,
    staffOfEmbers, voidWand, cryoGauntlet,
    sniperRifle, subMachineGun, rocketLauncher, flamethrower, plasmaRifle, energySword, crossbow, grenadeLauncher,
    magicSystem, accessorySystem, inventorySystem, miniBosses
} = setupWeaponLoadout(scene, world, player, weaponSystem, WEAPON_SLOTS, resourceSystem, characterSheet);

// Wire InventorySystem into LootSystem so consumable drops go to inventory
lootSystem.setInventorySystem(inventorySystem);
lootSystem.setInventoryStash(inventoryStash);
lootSystem.setGemSystem(gemSystem);

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
        if (e.target.classList.contains('stash-identify')) {
            const idx = parseInt(e.target.dataset.index, 10);
            inventoryStash.identifyItem(idx);
        }
        if (e.target.classList.contains('stash-socket')) {
            const idx = parseInt(e.target.dataset.index, 10);
            if (e.target.dataset.gemId) inventoryStash.socketGem(idx, e.target.dataset.gemId);
            else inventoryStash.socketBestGem(idx);
        }
        if (e.target.classList.contains('stash-unsocket')) {
            const idx = parseInt(e.target.dataset.index, 10);
            const gemIdx = parseInt(e.target.dataset.gemIndex, 10);
            inventoryStash.unsocketGem(idx, gemIdx);
        }
        if (e.target.classList.contains('stash-scrap')) {
            const idx = parseInt(e.target.dataset.index, 10);
            inventoryStash.scrapItem(idx);
        }
    });
})();

// Build Code System
const buildCodeSystem = new BuildCodeSystem(characterSheet, archetype, origin, passiveTree, skillSystem, exoSuit, weaponSystem, implants);

ctx.register('buildCodeSystem', ['characterSheet', 'archetype', 'origin', 'passiveTree', 'skillSystem', 'exoSuit', 'weaponSystem', 'implants'], () => buildCodeSystem);

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
        if (!target) return;

        // Aerial juggle: heavy attacks launch enemies
        if (data.isHeavy && aerialJuggleSystem) {
            aerialJuggleSystem.onHeavyHit(target);
        }

        // Environmental finisher damage mod
        if (environmentalFinisher) {
            dmg = environmentalFinisher.onMeleeHit(target, dmg);
        }

        // Status effect combos
        if (statusComboSystem) {
            dmg = statusComboSystem.onDamageDealt(target, dmg, 'kinetic', !data.isHeavy);
        }

        if (damageSystem) damageSystem.applyDamage(data.owner, target, dmg, 'kinetic');
        else if (target.takeDamage) target.takeDamage(dmg, 'kinetic', data.owner);
        if (legendaryPowerSystem) legendaryPowerSystem.onMeleeHit(target);
        if (typeof spawnDamageNumber === 'function') {
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
const enemyHealthBars = []; // tracks EnemyHealthBar instances
let gameDirector = null;

// Unified enemy kill handler — delegates to GameDirector
function _handleEnemyKilled(enemy, source) {
    if (gameDirector) gameDirector.handleEnemyKilled(enemy, source);
    if (deathRecap) deathRecap.onEnemyKilled();
    if (dailyQuestSystem) {
        dailyQuestSystem.reportEvent('kill');
        if (enemy && enemy._isElite) dailyQuestSystem.reportEvent('kill_elite');
    }
    if (runHistory) {
        // runHistory records kills via a counter; actual recording happens on death/session end
    }
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
    if (legendaryPowerSystem && player.health <= 0) legendaryPowerSystem.onTakeFatalDamage();
    if (deathRecap) deathRecap.onDamageTaken(amount, type, source);

    // Directional damage indicator
    if (source && source.position && directionalDamageIndicator) {
        const dir = DirectionalDamageIndicator.getDirection(source.position, player.position, player.facing);
        directionalDamageIndicator.trigger(dir);
    }

    // Pause on damage accessibility feature
    if (accessibilityManager && accessibilityManager.settings.pauseOnDamage) {
        accessibilityManager.triggerPauseOnDamage();
    }

    // Sound visualization
    if (accessibilityManager && source && source.position) {
        accessibilityManager.addSoundViz(source.position, 'damage', 1.0);
    }
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
const weatherGameplay = new WeatherGameplay(world, player);

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

// Expansion systems (parkour, combat, enemies, world, RPG, polish)
const exps = initExpansionSystems(ctx, {
    player, staminaSystem, combatSystem, weaponSystem, statusEffectSystem,
    world, scene, exoSuit, affixSystem, lootSystem, saveSystem,
    particleEffects, overclock
});
const {
    wallKickSystem, slideJumpSystem, mantleSystem, slopeGrindSystem, autoWalk,
    weaponComboSystem, aerialJuggleSystem, environmentalFinisher, statusComboSystem,
    eliteModifierSystem,
    wanderingVendor, dailyQuestSystem, graffitiCollectible, fastTravel,
    craftingBench, setBonusSystem, transmogSystem, prestigeSystem,
    saveSlots, cloudSaveExport, deathRecap, runHistory, lootVacuum, trainingDummy,
    trickSystem, fatalitySystem, graffitiSpraySystem, parkourCallbackWiring,
    predatorDrone, photoBountySystem, escortSystem, rhythmParkour, trapCrafting,
    moddingAPI,
} = exps;

if (combatSystem && fatalitySystem) {
    combatSystem.fatalitySystem = fatalitySystem;
}
if (weaponSystem && trickSystem) {
    weaponSystem.setTrickSystem(trickSystem);
}

// God rays
const godRays = new GodRays(scene, player, world);

// Foot IK
const footIK = new FootIK(scene, player, world);

// Procedural animation
const procAnim = new ProceduralAnimation(scene, player, world);

// Input is shared by keyboard, gamepad, touch, and menu systems.
const input = new InputManager();

// Gamepad controller
const gamepad = new GamepadController();
window.gamepadController = gamepad;
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
const sniperDrone = new SniperDrone(scene, world, player, {
    grapplingHook: player.grapplingHook,
    position: new THREE.Vector3(18, 12, 18),
    activationDelay: 20.0
});
const swarmDrone = new SwarmDrone(scene, world, player, {
    position: new THREE.Vector3(-18, 6, 18),
    activationDelay: 20.0
});
const hunterDrone = new HunterDrone(scene, world, player, { spawnDelay: 180.0 });

// Director mode
const directorMode = new DirectorMode();

// Ghost racing
const ghostRacing = new GhostRacing(scene);

// Bullet time
const bulletTime = new BulletTime();
const legendaryPowerSystem = new LegendaryPowerSystem(player, world, scene, hitboxSystem, damageSystem, bulletTime, enemyHealthBars);
damageSystem.setLegendaryPowerSystem(legendaryPowerSystem);

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
const riftGuardianHurtbox = new Hitbox(riftGuardian, 'hurtbox', { type: 'sphere', radius: 2.2 }, new THREE.Vector3(0, 0, 0), -1, null);
riftGuardianHurtbox.team = 'enemy';
hitboxSystem.registerHitbox(riftGuardianHurtbox);
const arenaMode = new ArenaMode(scene, world, player, enemyManager, bossFight);

// Phase 8: Boss Roster
const bosses = [];
const bossFabricator = new BossFabricator(scene, world, player, enemyManager);
const bossWarden = new BossWarden(scene, world, player, enemyManager);
const bossLeviathan = new BossLeviathan(scene, world, player);
const bossSwarmQueen = new BossSwarmQueen(scene, world, player, enemyManager);
const bossArchitect = new BossArchitect(scene, world, player);
bosses.push(bossFabricator, bossWarden, bossLeviathan, bossSwarmQueen, bossArchitect);
let bossRosterIndex = 0;
for (const boss of bosses) {
    boss.isBoss = true;
    boss.team = 'enemy';
    boss.onDeath = _handleEnemyKilled;
    enemyHealthBars.push(new EnemyHealthBar(scene, boss));
    const bossHurtbox = new Hitbox(boss, 'hurtbox', { type: 'sphere', radius: 1.6 }, new THREE.Vector3(0, 1.2, 0), -1, null);
    bossHurtbox.team = 'enemy';
    hitboxSystem.registerHitbox(bossHurtbox);
}

// Phase 4: Endgame systems
const difficultyTier = new DifficultyTierSystem(challenges);
const apexRift = new ApexRiftSystem(scene, world, player, riftGuardian, challenges, lootSystem, difficultyTier, enemyManager);
const nephalemGlory = new NephalemGlory(player, challenges);

gameDirector = new GameDirector({
    ctx, player, progression, familiarity, weaponSystem, factions, companion,
    nephalemGlory, apexRift, arenaMode, collapse, legendaryPowerSystem, soulsSystem,
    lootSystem, difficultyTier, inventoryStash, activeArchetypeId, showLootToast, showHint,
    bossFight, statusEffectSystem, saveSystem
});
ctx.register('gameDirector', ['player', 'progression', 'weaponSystem', 'factions', 'companion', 'nephalemGlory', 'apexRift', 'arenaMode', 'collapse', 'legendaryPowerSystem', 'soulsSystem', 'lootSystem', 'difficultyTier', 'inventoryStash', 'bossFight', 'statusEffectSystem', 'saveSystem'], () => gameDirector);

wireExpansionSystems({
    world, eliteModifierSystem, hitboxSystem, scene, enemyHealthBars, nephalemGlory,
    buildCodeSystem, showHint, onEnemyKilled: _handleEnemyKilled,
    spawnDamageNumber, particleEffects, EnemyHealthBar
});

if (predatorDrone) {
    predatorDrone.onDeath = _handleEnemyKilled;
    const predatorBar = new EnemyHealthBar(scene, predatorDrone);
    enemyHealthBars.push(predatorBar);
    const predatorHurtbox = new Hitbox(predatorDrone, 'hurtbox', { type: 'sphere', radius: 0.55 }, new THREE.Vector3(0, 0.4, 0), -1, null);
    predatorHurtbox.team = 'enemy';
    hitboxSystem.registerHitbox(predatorHurtbox);
}

photoMode.onPhotoTaken = (photoCamera) => {
    if (!photoBountySystem) return;
    const subjects = [
        ...(world.drones ? world.drones.drones : []),
        ...(enemyManager ? enemyManager.enemies : []),
        ...(predatorDrone ? [predatorDrone] : []),
        ...(bossFight && bossFight.isActive && bossFight.isActive() ? [bossFight] : []),
    ];
    if (photoBountySystem.captureFromCamera(photoCamera, subjects)) {
        challenges.reportEvent('photo');
        showHint('Photo bounty complete — chips awarded.');
    }
};

// Register remaining systems with SaveSystem.
// autoRegister skips null systems and those without serialize/deserialize.
function autoRegister(key, system) {
    if (system && typeof system.serialize === 'function' && typeof system.deserialize === 'function') {
        saveSystem.register(key, () => system.serialize(), (d) => system.deserialize(d));
    }
}

autoRegister('skillSystem',    skillSystem);
autoRegister('resourceSystem', resourceSystem);
autoRegister('inventorySystem',inventorySystem);
autoRegister('factions',       factions);
autoRegister('territory',      territory);
autoRegister('mastery',        mastery);
autoRegister('codex',          codex);
autoRegister('legacy',         legacy);
autoRegister('ngPlus',         ngPlus);
autoRegister('collapse',       collapse);
autoRegister('npcSystem',      npcSystem);
autoRegister('accessorySystem',accessorySystem);
autoRegister('nephalemGlory',  nephalemGlory);
autoRegister('apexRift',       apexRift);
autoRegister('difficultyTier', difficultyTier);
autoRegister('bounty',         bounty);
autoRegister('debt',           debt);
autoRegister('consequences',   consequences);
autoRegister('challenges',     challenges);
autoRegister('risingTide',     risingTide);
autoRegister('ghostRacing',    ghostRacing);
autoRegister('speedrunILs',    speedrunILs);
autoRegister('timeTrial',      timeTrial);
autoRegister('inventoryStash', inventoryStash);
autoRegister('photoBountySystem', photoBountySystem);
autoRegister('weaponSystem', weaponSystem);

// Show a brief HUD indicator after every save (auto-save and manual).
saveSystem.onSave = (meta) => {
    const el = document.getElementById('save-toast');
    if (!el) return;
    const timeStr = new Date(meta.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgEl = el.querySelector('#save-toast-msg');
    if (msgEl) msgEl.textContent = `Saved ${timeStr}`;
    el.style.display = 'block';
    clearTimeout(saveSystem._toastTimer);
    saveSystem._toastTimer = setTimeout(() => { el.style.display = 'none'; }, 2500);
};

// ── Souls system callbacks ─────────────────────────────────────────────────
soulsSystem.onRest = () => {
    // Respawn all patrol drones
    world.drones.respawnAll();
    // Save the game
    saveSystem.save();
};

soulsSystem.onShardChange = (carried, beacon) => {
    const el = document.getElementById('shards-count');
    if (el) el.textContent = carried.toLocaleString();
    const beaconEl = document.getElementById('shards-beacon');
    if (beaconEl) beaconEl.style.display = beacon > 0 ? 'inline' : 'none';
    const beaconCount = document.getElementById('shards-beacon-count');
    if (beaconCount) beaconCount.textContent = beacon.toLocaleString();
};

soulsSystem.onVialChange = (current, max) => {
    const container = document.getElementById('vial-pips');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < max; i++) {
        const pip = document.createElement('span');
        pip.className = 'vial-pip' + (i < current ? '' : ' vial-pip-empty');
        container.appendChild(pip);
    }
};

// Trigger initial HUD render
soulsSystem.onVialChange(soulsSystem.vials, soulsSystem.maxVials);
soulsSystem.onShardChange(soulsSystem.carriedShards, soulsSystem._beaconShards);

// Register SoulsSystem with save system
autoRegister('soulsSystem', soulsSystem);

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
    inventoryStash, gemSystem, weaponSystem
});
uiManager.createMiniBossBars(miniBosses);
uiManager.createManaBar();
uiManager.inventorySystem = inventorySystem;

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

function requestPointerLockSafe(target = document.body) {
    if (!target || typeof target.requestPointerLock !== 'function') return;
    try {
        const request = target.requestPointerLock();
        if (request && typeof request.catch === 'function') request.catch(() => {});
    } catch (err) {
        // Pointer lock is best-effort; gameplay must still run in browsers/tests that deny it.
    }
}

function enterGameplay() {
    if (!gameStarted) {
        gameStarted = true;
        gameDirector.start();
        world.drones?.setOpeningGrace?.(14);
        player.isInvincible = true;
        clearTimeout(player._invincibilityTimer);
        player._invincibilityTimer = setTimeout(() => { player.isInvincible = false; }, 6000);
        showHint('Safe start: get your bearings, then move when ready.');
    }
    startScreen.style.display = 'none';
    if (paused) {
        gameDirector.resume();
        paused = gameDirector.paused;
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
}

// Pause menu wiring
const pauseMenu = document.getElementById('pause-menu');
const btnResume = document.getElementById('pause-resume');
const btnSettings = document.getElementById('pause-settings');
const btnQuit = document.getElementById('pause-quit');

if (btnResume) {
    btnResume.addEventListener('click', () => {
        gameDirector.resume();
        paused = gameDirector.paused;
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
        gameDirector.quitToMenu();
        gameStarted = gameDirector.gameStarted;
        paused = gameDirector.paused;
        gameOver = gameDirector.gameOver;
        if (skillBarUI) skillBarUI.hide();
    });
}

startScreen.addEventListener('click', () => {
    audio.playUIClick();
    requestPointerLockSafe();
    enterGameplay();
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement) {
        enterGameplay();
    } else {
        // Do NOT conflate pointer lock loss with pause or game stop
        if (paused) {
            gameDirector.resume();
            paused = gameDirector.paused;
        }
        audio.stopAmbience();
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
    requestPointerLockSafe();
    if (player) {
        player.position.set(0, 2, 0); // warehouse default spawn
        player.health = player.maxHealth || 100;
        player.isDead = false;
        player.state = 'idle';
    }
    if (statusEffectSystem && typeof statusEffectSystem.clearAll === 'function') statusEffectSystem.clearAll();
    gameDirector._deathHandled = false;
    gameDirector.gameOver = false;
    gameOver = false;
});

// Death screen respawn button
document.getElementById('death-respawn').addEventListener('click', () => {
    gameDirector.onPlayerRespawn();
    gameOver = gameDirector.gameOver;
});

// Safehouse "Rest" button
const btnRest = document.getElementById('btn-safehouse-rest');
if (btnRest) {
    btnRest.addEventListener('click', () => {
        soulsSystem.rest();
        // Close the panel after resting
        const sp = document.getElementById('safehouse-panel');
        if (sp) sp.style.display = 'none';
        requestPointerLockSafe();
    });
}

const btnIdentifyAll = document.getElementById('btn-safehouse-identify-all');
if (btnIdentifyAll) {
    btnIdentifyAll.addEventListener('click', () => {
        const result = inventoryStash.identifyAll(10);
        if (result.ok && result.identified > 0) showHint(`Identified ${result.identified} item${result.identified === 1 ? '' : 's'} for ${result.cost} chips.`);
        else if (!result.ok) showHint(`Need ${result.cost} chips to identify everything.`);
        else showHint('No unidentified gear in the stash.');
    });
}

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

// Load new settings into their respective systems
if (accessibilityManager) {
    accessibilityManager.load({
        colorblindMode: settings.colorblindMode,
        uiScale: settings.uiScale,
        highContrast: settings.highContrast,
        reducedMotion: settings.reducedMotion,
        subtitles: settings.subtitles,
        subtitleSize: settings.subtitleSize,
        subtitleBackground: settings.subtitleBackground,
        screenReader: settings.screenReader,
        toggleSprint: settings.toggleSprint,
        stickyTargeting: settings.stickyTargeting,
        pauseOnDamage: settings.pauseOnDamage,
        soundVisualization: settings.soundVisualization,
        epilepsySafe: settings.epilepsySafe,
        dyslexiaFont: settings.dyslexiaFont,
    });
    if (subtitleSystem) {
        subtitleSystem.setEnabled(settings.subtitles);
        subtitleSystem.setSize(settings.subtitleSize);
        subtitleSystem.setBackground(settings.subtitleBackground);
    }
}
if (gamepad) {
    gamepad.setDeadZone(settings.gamepadDeadzone ?? 0.15);
    gamepad.setTriggerThreshold(settings.triggerThreshold ?? 0.1);
    gamepad.setGyroEnabled(settings.gyroAim ?? false);
    gamepad.setGyroSensitivity(settings.gyroSensitivity ?? 1.0);
}
if (controllerPrompts) {
    controllerPrompts.setSet(settings.promptSet ?? 'auto');
}
if (aimAssist) {
    aimAssist.setEnabled(settings.assistAim ?? false);
}

const keybindingsGamepadCheck = wireKeybindings(gamepad);

// Wire Save/Load buttons with confirmation dialogs (C2)
(function wireSaveLoadButtons() {
    const btnSave = document.getElementById('btn-save-game');
    const btnLoad = document.getElementById('btn-load-game');
    if (btnSave) {
        btnSave.addEventListener('click', () => {
            if (confirm('Overwrite current save?')) saveSystem.save();
        });
    }
    if (btnLoad) {
        btnLoad.addEventListener('click', () => {
            if (confirm('Load saved game? Unsaved progress will be lost.')) {
                saveSystem.load();
                location.reload();
            }
        });
    }
})();

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
        applyKeyboardCameraLook(activeInput, mouseDelta, dt);

        // Menu navigation (gamepad/keyboard focus)
        if (typeof menuNavigator !== 'undefined' && menuNavigator) {
            menuNavigator.update(activeInput);
        }
        
        // === PAUSE TOGGLE ===
        if (activeInput.wasPressed('Escape')) {
            if (paused) {
                gameDirector.resume();
                paused = gameDirector.paused;
            } else {
                // Close the topmost open panel first; only show pause if none were open
                const closedPanel = uiManager && typeof uiManager.closeOpenPanel === 'function'
                    ? uiManager.closeOpenPanel() : false;
                if (!closedPanel) {
                    gameDirector.pause();
                    paused = gameDirector.paused;
                }
            }
        }
        
        if (paused) {
            dt = 0;
            postProcessing.render(dt, 0);
            return;
        }

        if (activeInput.wasPressed('KeyZ') && !levelEditor.isActive()) {
            const reverseCameraCycle = activeInput.isPressed('ShiftLeft') || activeInput.isPressed('ShiftRight');
            const label = tpc.cycleMode(reverseCameraCycle ? -1 : 1);
            showHint(`Camera: ${label}`);
            activeInput.consumeKey('KeyZ');
        }
        
        // === EDITOR MODE TOGGLE (F1) ===
        if (gameDirector.allowEditor() && activeInput.wasPressed('F1')) {
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
                requestPointerLockSafe();
            }
        }
        
        // Death screen — delegated to GameDirector
        if (player && player.isDead && !gameDirector._deathHandled) {
            gameDirector.onPlayerDeath();
            gameOver = gameDirector.gameOver;
        } else if (player && !player.isDead && gameDirector._deathHandled) {
            gameDirector._deathHandled = false;
            gameDirector.gameOver = false;
            gameOver = false;
            const deathScreen = document.getElementById('death-screen');
            if (deathScreen && deathScreen.style.display === 'flex') deathScreen.style.display = 'none';
        }

        // === SKILL BAR INPUTS (RMB / E / R) ===
        if (skillSystem && player && !player.isDead && !player._empDisabled) {
            if (activeInput.wasPressed('Mouse2')) skillSystem.useSkill('RMB');
            if (activeInput.wasPressed('KeyE') && player.state !== 'CLIMB' && player.state !== 'HANG') skillSystem.useSkill('E');
            if (activeInput.wasPressed('KeyR')) skillSystem.useSkill('R');
        }

        // === HEALING VIAL (X) ===
        if (soulsSystem && activeInput.wasPressed('KeyX') && !player.isDead) {
            soulsSystem.useVial();
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
        
        // === TIME TRIAL INPUT (must come before T-key checks so consumeKey works) ===
        timeTrial.handleInput(activeInput);

        // === BOSS FIGHT TOGGLE (B) ===
        if (activeInput.wasPressed('KeyB') && !bossFight.isActive() && !levelEditor.isActive()) {
            if (activeInput.isPressed('ShiftLeft') && bosses.length > 0) {
                const boss = bosses[bossRosterIndex % bosses.length];
                bossRosterIndex++;
                if (boss && typeof boss.start === 'function') boss.start();
                showHint(`BOSS SPAWNED — ${boss.constructor.name.replace(/^Boss/, '')}`);
            } else {
                bossFight.start();
            }
            bossHUD.style.display = 'block';
            ui.style.display = 'none';
        }
        
        // === DIFFICULTY TIER CYCLE (Shift+T) ===
        if (activeInput.wasPressed('KeyT') && activeInput.isPressed('ShiftLeft')) {
            if (arenaMode._lockdownSealed) showHint('LOCKDOWN — arena entrances are sealed.');
            else arenaMode.toggleSelector();
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
        
        // Apply aim assist before camera update
        const allEnemies = [
            ...(enemyManager ? enemyManager.enemies : []),
            ...(world.drones ? world.drones.drones : [])
        ];
        if (aimAssist && aimAssist.enabled) {
            const assisted = aimAssist.apply(mouseDelta.dx, mouseDelta.dy, allEnemies, dt);
            mouseDelta.dx = assisted.dx;
            mouseDelta.dy = assisted.dy;
        }

        tpc.update(dt, mouseDelta, world);
        
        // Accessibility: pause-on-damage time dilation
        if (accessibilityManager && accessibilityManager.updatePauseOnDamage(dt)) {
            dt *= 0.1;
        }

        // Update subtitle system
        if (subtitleSystem) subtitleSystem.update(dt);

        // Update directional damage indicators
        if (directionalDamageIndicator) directionalDamageIndicator.update(dt);

        // Track playtime and auto-save every 30 seconds
        saveSystem.tickPlaytime(dt);

        // Overclock / Heat (compute early for finalDt) — gated by key item and EMP disable
        const _empBlocked = player._empDisabled === true;
        const timeScale = (!_empBlocked && player.overclockUnlocked !== false) ? overclock.update(dt, activeInput) : 1.0;
        const slowMo = droneTakedown.update(dt, player, activeInput, world.drones.drones);
        if (droneTakedown.slowMoTimer > 0) bulletTime.trigger(player.position, 5);
        const fatalityScale = fatalitySystem ? fatalitySystem.getTimeScale() : 1.0;
        const finalDt = dt * Math.min(timeScale, slowMo, fatalityScale);
        gameDirector.update(dt, finalDt);
        autoSaveTimer = gameDirector.autoSaveTimer;
        
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

        // Update souls system (echo beacon animation + pickup proximity)
        soulsSystem.update(finalDt);
        
        // Update decals
        decalSystem.update(finalDt, player);
        
        // Update runner vision
        runnerVision.update(finalDt);
        
        // Update weather gameplay
        weatherGameplay.update(finalDt, weatherSystem);
        
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

        updateMeatShield({ player, world }, finalDt, activeInput);

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

        // Parkour expansion
        wallKickSystem.update(finalDt, activeInput);
        slideJumpSystem.update(finalDt, activeInput);
        mantleSystem.update(finalDt, activeInput);
        slopeGrindSystem.update(finalDt, activeInput);
        autoWalk.update(finalDt, activeInput);
        if (autoWalk.enabled && player.state === 'SPRINT') autoWalk.cancel(); // cancel on sprint

        // Combat expansion
        weaponComboSystem.update(finalDt, activeInput);
        aerialJuggleSystem.update(finalDt);
        environmentalFinisher.update(finalDt);
        combatSystem.overclockActive = (overclock && overclock.active) || false;
        combatSystem.update(finalDt, activeInput);
        statusEffectSystem.update(finalDt);
        if (magicSystem) magicSystem.update(finalDt);
        
        // Speedrun ILs
        speedrunILs.update(finalDt);
        
        // Challenge system
        challenges.update(finalDt);
        challenges.updateMovementTime(finalDt, player.state === 'SPRINT');
        if (player.state === 'SPRINT' && legendaryPowerSystem) legendaryPowerSystem.onSprint(finalDt);

        updateShoulderBash({ player, world, enemyManager, spawnDamageNumber, gamepad }, finalDt);

        updateExpansionSystems({
            archetype, companion, territory, loyalty, npcSystem, blackout, rivals, mastery,
            subLevels, collapse, safehouse, bounty, codex, implants, legacy, ngPlus,
            consequences, debt, shop, factions, familiarity, apexRift, nephalemGlory,
            legendaryPowerSystem, projectileManager,
            wanderingVendor, dailyQuestSystem, graffitiCollectible, fastTravel,
            setBonusSystem, prestigeSystem, trainingDummy, lootVacuum, moddingAPI,
            trickSystem, fatalitySystem, graffitiSpraySystem,
            predatorDrone, photoBountySystem, escortSystem, rhythmParkour, trapCrafting,
            exoSuit, player, world, activeInput, resourceSystem, arenaMode
        }, finalDt);

        updateProxyMines({ world, scene, particleEffects, hitboxSystem, enemyManager, predatorDrone }, finalDt);
        updateDecoys({ world }, finalDt);

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

function applyKeyboardCameraLook(activeInput, mouseDelta, dt) {
    const yawSpeed = 520;
    const pitchSpeed = 360;
    if (activeInput.isPressed('ArrowLeft')) mouseDelta.x -= yawSpeed * dt;
    if (activeInput.isPressed('ArrowRight')) mouseDelta.x += yawSpeed * dt;
    if (activeInput.isPressed('ArrowUp')) mouseDelta.y -= pitchSpeed * dt;
    if (activeInput.isPressed('ArrowDown')) mouseDelta.y += pitchSpeed * dt;
}

// H16: Hide loading overlay after the first rendered frame, not synchronously during init.
// This ensures the GPU has actually produced a frame before the overlay disappears.
setLoadProgress('Ready!');
const loadingOverlay = document.getElementById('loading-overlay');
requestAnimationFrame(() => {
    try {
        animate();
        requestAnimationFrame(() => {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        });
    } catch (err) {
        console.error('Startup render failed', err);
        setLoadProgress(`Startup error: ${err && err.message ? err.message : err}`);
        const spinner = document.querySelector('.loading-spinner');
        if (spinner) spinner.style.display = 'none';
    }
});
