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
import { WeatherGameplay } from './WeatherGameplay.js';
import { PowerUpSystem } from './PowerUpSystem.js';
import { HologramPlatforms } from './HologramPlatforms.js';
import { StructuralCollapse } from './StructuralCollapse.js';
import { RisingTide } from './RisingTide.js';
import { ParticleEffects } from './ParticleEffects.js';
import { LensFlare } from './LensFlare.js';
import { GamepadController } from './GamepadController.js';
import { AdvancedMovement } from './AdvancedMovement.js';
import { InteractiveEnvironment } from './InteractiveEnvironment.js';
import { SniperDrone, SwarmDrone, HunterDrone } from './AdvancedDrones.js';
import { DirectorMode } from './DirectorMode.js';
import { GhostRacing } from './GhostRacing.js';
import { BulletTime } from './BulletTime.js';
import { AssistMode } from './AssistMode.js';
import { SpeedrunILs } from './SpeedrunILs.js';
import { ChallengeSystem } from './ChallengeSystem.js';
import { GodRays } from './GodRays.js';
import { FootIK } from './FootIK.js';
import { ProceduralAnimation } from './ProceduralAnimation.js';
import LevelEditor from './LevelEditor.js';
import BossFight from './BossFight.js';
import { CharacterSheet } from './CharacterSheet.js';
import { ProgressionSystem } from './ProgressionSystem.js';
import { ArchetypeSystem } from './ArchetypeSystem.js';
import { OriginSystem } from './OriginSystem.js';
import { ExoSuitSystem, SLOTS } from './ExoSuitSystem.js';
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

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x151520);
scene.fog = new THREE.Fog(0x151520, 20, 70);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

// Post-processing
const postProcessing = new PostProcessing(renderer, scene, camera);

// Lighting
const ambient = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffaa55, 1.2);
sun.position.set(25, 40, 15);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 100;
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;
sun.shadow.bias = -0.001;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x5577ff, 0.25);
fill.position.set(-15, 10, -15);
scene.add(fill);

// Atmospheric point lights
const pointLights = [];
const lightDefs = [
    { pos: [15, 6, 12], color: 0xff6600, intensity: 3, dist: 25 },
    { pos: [-15, 6, -12], color: 0x0066ff, intensity: 3, dist: 25 },
    { pos: [0, 6, -20], color: 0xffcc00, intensity: 2, dist: 20 },
    { pos: [23, 3, 10], color: 0xff3333, intensity: 2, dist: 15 },
];

lightDefs.forEach(l => {
    const pl = new THREE.PointLight(l.color, l.intensity, l.dist);
    pl.position.set(...l.pos);
    scene.add(pl);
    pointLights.push(pl);
    
    const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshBasicMaterial({ color: l.color })
    );
    orb.position.set(...l.pos);
    scene.add(orb);
});

// Lens flares
const lensFlare = new LensFlare(scene, camera);

// Register lights with post-processing for day/night transitions
postProcessing.registerLights(ambient, sun, fill, pointLights);

// Add lens flares to atmospheric lights
lensFlare.addFlare(new THREE.Vector3(15, 6, 12), 0xff6600, 2.5);
lensFlare.addFlare(new THREE.Vector3(-15, 6, -12), 0x0066ff, 2.5);
lensFlare.addFlare(new THREE.Vector3(0, 6, -20), 0xffcc00, 2);
lensFlare.addFlare(new THREE.Vector3(23, 3, 10), 0xff3333, 1.5);

// World
const world = new World(scene);

// Audio
const audio = new AudioManager(scene, world);

// Player first (camera controller wired after tpc is created)
const player = new Player(scene, world, camera, audio, null);

// RPG Phase 1 systems
const characterSheet = new CharacterSheet(player);
const progression = new ProgressionSystem(characterSheet);
const archetype = new ArchetypeSystem(player, characterSheet);
const origin = new OriginSystem(player, characterSheet);
player.setCharacterSheet(characterSheet);

progression.onLevelUp = (level, points) => {
    console.log(`Level up! Now level ${level}. Attribute points: ${points}`);
};

// Apply stored character creation choices
const savedOrigin = sessionStorage.getItem('rpg_origin');
const savedArchetype = sessionStorage.getItem('rpg_archetype');
if (savedOrigin) {
    try { origin.setOrigin(savedOrigin); } catch (e) { console.warn('OriginSystem.setOrigin missing', e); }
}
if (savedArchetype) {
    try { archetype.setPrimary(savedArchetype); } catch (e) { console.warn('ArchetypeSystem.setPrimary missing', e); }
}

// RPG Phase 2-4 systems
const exoSuit = new ExoSuitSystem(player, characterSheet);
const affixSystem = new AffixSystem();
const familiarity = new FamiliaritySystem();
const companion = new CompanionDrone(scene, player, null); // eventBus placeholder
const loyalty = new LoyaltySystem(companion);
const factions = new FactionSystem(null); // eventBus placeholder
const territory = new TerritorySystem(world, factions);
const safehouse = new SafehouseSystem(player, characterSheet, progression, exoSuit, affixSystem);
const bounty = new BountySystem(player, characterSheet, progression, factions, territory);
const npcSystem = new NPCSystem(world, player, factions);
const blackout = new BlackoutSystem(world, player, npcSystem, factions, territory);
const rivals = new RivalSystem(scene, player, world, exoSuit);
const subLevels = new SubLevelSystem(world, player, factions);
const mastery = new MasterySystem(player, characterSheet);
const codex = new CodexSystem(player, characterSheet);
const implants = new ImplantSystem(player, characterSheet);
const legacy = new LegacySystem(characterSheet, progression, exoSuit, familiarity);
const ngPlus = new NewGamePlus(player, world, characterSheet);
const collapse = new CollapseMode(world, player, characterSheet, exoSuit, archetype);

// Skill system (Phase 2)
const activeArchetypeId = savedArchetype || 'traceur';
const resourceSystem = new ResourceSystem(activeArchetypeId);
const skillSystem = new SkillSystem(player, resourceSystem, activeArchetypeId);

// Assign default loadout for archetype
const defaultLoadout = getDefaultLoadout(activeArchetypeId);
for (const [slot, skillId] of Object.entries(defaultLoadout)) {
    skillSystem.assignSkill(slot, skillId);
}

// Register skill execution callbacks
skillSystem.onExecute('light_strike', (skill, targetPos, p) => {
    // Melee hitbox — same as existing LMB attack
    const attackDir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
    const offset = attackDir.multiplyScalar(0.8);
    offset.y = 0.5;
    const hitbox = new Hitbox(
        p, 'melee', { type: 'sphere', radius: 0.6 }, offset, 0.15,
        (hb, target) => {
            if (target && typeof spawnDamageNumber === 'function') {
                const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                spawnDamageNumber(tPos, Math.round(skill.finalDamage || 15), false, 'kinetic');
            }
        }
    );
    hitbox.damage = skill.finalDamage || 15;
    hitbox.team = 'player';
    hitboxSystem.registerHitbox(hitbox);
});

skillSystem.onExecute('dive_kick', (skill, targetPos, p) => {
    if (p.startDiveKick) p.startDiveKick();
    // Damage hitbox on landing area
    const offset = new THREE.Vector3(0, -0.5, 0);
    const hitbox = new Hitbox(
        p, 'melee', { type: 'sphere', radius: 1.2 }, offset, 0.3,
        (hb, target) => {
            if (target && target.takeDamage) {
                target.takeDamage(skill.finalDamage || 50, 'kinetic', p);
            }
            if (target && typeof spawnDamageNumber === 'function') {
                const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                spawnDamageNumber(tPos, Math.round(skill.finalDamage || 50), false, 'kinetic');
            }
        }
    );
    hitbox.damage = skill.finalDamage || 50;
    hitbox.team = 'player';
    hitboxSystem.registerHitbox(hitbox);
});

skillSystem.onExecute('air_dash', (skill, targetPos, p) => {
    const moveDir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
    if (p.startAirDash) p.startAirDash(moveDir);
});

skillSystem.onExecute('slide_tackle', (skill, targetPos, p) => {
    const moveDir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
    if (p.startSlide) p.startSlide(moveDir);
    // Slide hitbox
    const hitbox = new Hitbox(
        p, 'melee', { type: 'sphere', radius: 0.8 }, new THREE.Vector3(0, 0.3, 0), 0.5,
        (hb, target) => {
            if (target && target.takeDamage) {
                target.takeDamage(skill.finalDamage || 30, 'kinetic', p);
            }
            if (target && typeof spawnDamageNumber === 'function') {
                const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                spawnDamageNumber(tPos, Math.round(skill.finalDamage || 30), false, 'kinetic');
            }
        }
    );
    hitbox.damage = skill.finalDamage || 30;
    hitbox.team = 'player';
    hitboxSystem.registerHitbox(hitbox);
});

skillSystem.onExecute('ground_pound', (skill, targetPos, p) => {
    if (p.startGroundPound) p.startGroundPound();
    // AoE hitbox on impact — registered now, expires quickly
    const hitbox = new Hitbox(
        p, 'explosion', { type: 'sphere', radius: 5.0 }, new THREE.Vector3(0, 0, 0), 0.4,
        (hb, target) => {
            if (target && target.takeDamage) {
                target.takeDamage(skill.finalDamage || 80, 'explosive', p);
            }
            if (target && typeof spawnDamageNumber === 'function') {
                const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                spawnDamageNumber(tPos, Math.round(skill.finalDamage || 80), false, 'explosive');
            }
        }
    );
    hitbox.damage = skill.finalDamage || 80;
    hitbox.team = 'player';
    hitboxSystem.registerHitbox(hitbox);
});

const skillBarUI = new SkillBarUI(skillSystem, resourceSystem);

// Combat systems
const damageSystem = new DamageSystem(characterSheet);
const hitboxSystem = new HitboxSystem();
const lootSystem = new LootSystem(scene, player, exoSuit, affixSystem);
const enemyHealthBars = []; // tracks EnemyHealthBar instances

// Wire drone death to loot and damage numbers
if (world.drones && world.drones.drones) {
    world.drones.drones.forEach(drone => {
        if (drone && !drone.onDeath) {
            drone.onDeath = (deadDrone, source) => {
                // Phase 4: Nephalem Glory kill streak
                if (nephalemGlory) nephalemGlory.onKill(deadDrone);
                // Phase 4: Apex Rift progress
                if (apexRift) apexRift.onEnemyKilled(deadDrone, source);
                // Loot drop with difficulty scaling
                const diffLootMult = difficultyTier ? difficultyTier.getTierConfig().lootBonus : 0;
                const drop = lootSystem.generateDrop(deadDrone.type || 'patrol', deadDrone.isElite, 1.0 + diffLootMult, activeArchetypeId);
                if (drop) lootSystem.spawnDrop(drop, deadDrone.position || deadDrone.mesh.position);
            };
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
}

// Player damage numbers + Nephalem Glory streak break
player.onDamageTaken = (amount, type, source) => {
    const pos = player.position.clone();
    pos.y += 1.5;
    spawnDamageNumber(pos, Math.ceil(amount), false, type);
    if (nephalemGlory) nephalemGlory.onDamageTaken();
};

// Equip starter gear based on origin
const startingGear = origin.getStartingGear ? origin.getStartingGear() : null;
if (startingGear && exoSuit) {
    const template = exoSuit.getItemTemplate ? exoSuit.getItemTemplate(startingGear) : null;
    if (template && affixSystem) {
        const item = affixSystem.generateItem(template);
        exoSuit.equip(item);
    }
}

// Third person camera
const tpc = new ThirdPersonCamera(camera, player);
tpc.setPostProcessing(postProcessing);
player.cameraController = tpc;

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
droneTakedown.onKill = (drone) => {
    if (progression && typeof progression.addXP === 'function') {
        const xpBase = 50;
        const xpScaled = difficultyTier ? difficultyTier.scaleXP(xpBase) : xpBase;
        progression.addXP(Math.floor(xpScaled), 'enemy_kill');
    }
    if (familiarity && drone && drone.weaponId) {
        familiarity.addKill(drone.weaponId);
    }
    if (factions && drone && drone.faction) {
        factions.onDroneKilled(drone.faction, drone.isElite);
    }
    if (companion && typeof companion.triggerSynergy === 'function') {
        companion.triggerSynergy();
    }
};

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

// Advanced movement
const advMovement = new AdvancedMovement(player, scene, audio, tpc);

// Interactive environment
const interEnv = new InteractiveEnvironment(scene, world, player, world.hazards, audio);

// Advanced drones
const sniperDrone = new SniperDrone(scene, world, player);
const swarmDrone = new SwarmDrone(scene, world, player);
const hunterDrone = new HunterDrone(scene, world, player);

// Director mode
const directorMode = new DirectorMode();

// Ghost racing
const ghostRacing = new GhostRacing(scene);

// Bullet time
const bulletTime = new BulletTime();

// Assist mode
const assistMode = new AssistMode();
assistMode.setRisingTide(risingTide);

// Speedrun ILs
const speedrunILs = new SpeedrunILs(scene, player, world, timeTrial);

// Challenge system
const challenges = new ChallengeSystem(scene, player);

// Boss Fight (needs directorMode, bulletTime, challenges)
const bossFight = new BossFight(scene, world, player, camera, postProcessing, directorMode, bulletTime, challenges);

// Phase 4: Endgame systems
const difficultyTier = new DifficultyTierSystem(challenges);
const apexRift = new ApexRiftSystem(scene, world, player, bossFight, challenges, lootSystem, difficultyTier);
const nephalemGlory = new NephalemGlory(player, challenges);

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

// Place new world features
world.placeZiplines(ziplines);
world.placeCoolantPuddles(overclock);
world.placeGrappleRelays(grappleRelays);
world.placePowerUps(powerUps);
world.placeHologramZones(holograms);
world.markStructuralElements(structuralCollapse);

// Wire player to world (drones & collectibles)
world.setPlayer(player);

// Input
const input = new InputManager();

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

startScreen.addEventListener('click', () => {
    audio.playUIClick();
    document.body.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement) {
        gameStarted = true;
        startScreen.style.display = 'none';
        if (!levelEditor.isActive()) {
            ui.style.display = 'block';
            crosshair.style.display = 'block';
            const phb = document.getElementById('player-health-bar');
            const pht = document.getElementById('player-health-text');
            if (phb) phb.style.display = 'block';
            if (pht) pht.style.display = 'block';
            if (skillBarUI) skillBarUI.show();
        }
        audio.playAmbience();
    } else {
        gameStarted = false;
        startScreen.style.display = 'flex';
        ui.style.display = 'none';
        crosshair.style.display = 'none';
        const phb = document.getElementById('player-health-bar');
        const pht = document.getElementById('player-health-text');
        if (phb) phb.style.display = 'none';
        if (pht) pht.style.display = 'none';
        if (skillBarUI) skillBarUI.hide();
        editorUI.classList.remove('active');
    }
});

/* ============================================================
   EDITOR UI EVENT LISTENERS
   ============================================================ */

// Palette object type buttons
editorPalette.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        editorPalette.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        levelEditor.setPlacementType(btn.dataset.type);
        levelEditor.setTool('place');
        updateEditorToolbar();
    });
});

// Toolbar tool buttons
function updateEditorToolbar() {
    editorToolbar.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
    if (levelEditor.tool === 'select') document.getElementById('tool-select').classList.add('active');
    if (levelEditor.tool === 'place') document.getElementById('tool-place').classList.add('active');
    if (levelEditor.tool === 'delete') document.getElementById('tool-delete').classList.add('active');
}

document.getElementById('tool-select').addEventListener('click', () => {
    levelEditor.setTool('select');
    updateEditorToolbar();
});
document.getElementById('tool-place').addEventListener('click', () => {
    levelEditor.setTool('place');
    updateEditorToolbar();
});
document.getElementById('tool-delete').addEventListener('click', () => {
    levelEditor.setTool('delete');
    updateEditorToolbar();
});

document.getElementById('editor-export').addEventListener('click', () => {
    const json = levelEditor.exportLevel();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parkour-level.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('editor-import').addEventListener('click', () => {
    editorFileInput.click();
});

editorFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            levelEditor.importLevel(ev.target.result);
        } catch (err) {
            console.error('Import failed:', err);
            alert('Failed to import level: ' + err.message);
        }
    };
    reader.readAsText(file);
    editorFileInput.value = '';
});

document.getElementById('editor-playtest').addEventListener('click', () => {
    levelEditor.toggle();
    editorUI.classList.remove('active');
    ui.style.display = 'block';
    crosshair.style.display = 'block';
    document.body.requestPointerLock();
});

// Property panel binding
function updatePropertyPanel() {
    const props = levelEditor.getSelectedProps();
    if (!props) {
        editorProperties.classList.remove('active');
        return;
    }
    editorProperties.classList.add('active');
    editorPropList.innerHTML = '';
    
    Object.entries(props).forEach(([key, value]) => {
        const row = document.createElement('div');
        row.className = 'prop-row';
        const label = document.createElement('label');
        label.textContent = key;
        row.appendChild(label);
        
        if (key === 'color') {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = typeof value === 'number' ? '#' + value.toString(16).padStart(6, '0') : value;
            input.addEventListener('input', (e) => {
                levelEditor.setSelectedProp(key, parseInt(e.target.value.replace('#', ''), 16));
            });
            row.appendChild(input);
        } else if (typeof value === 'boolean') {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = value;
            input.addEventListener('change', (e) => {
                levelEditor.setSelectedProp(key, e.target.checked);
            });
            row.appendChild(input);
        } else if (typeof value === 'number') {
            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.1';
            input.value = value;
            input.addEventListener('input', (e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) levelEditor.setSelectedProp(key, v);
            });
            row.appendChild(input);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.addEventListener('input', (e) => {
                levelEditor.setSelectedProp(key, e.target.value);
            });
            row.appendChild(input);
        }
        editorPropList.appendChild(row);
    });
}

/* ============================================================
   BOSS FIGHT UI
   ============================================================ */
document.getElementById('boss-exit').addEventListener('click', () => {
    bossFight.cleanup();
    bossVictory.style.display = 'none';
    bossHUD.style.display = 'none';
    ui.style.display = 'block';
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
const damageNumbers = [];
function spawnDamageNumber(position, amount, isCrit, damageType) {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.left = '50%';
    div.style.top = '50%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.color = isCrit ? '#ffaa00' : '#ffffff';
    div.style.fontWeight = 'bold';
    div.style.fontSize = isCrit ? '24px' : '16px';
    div.style.textShadow = '0 1px 4px rgba(0,0,0,0.8)';
    div.style.pointerEvents = 'none';
    div.style.zIndex = '100';
    div.style.transition = 'opacity 0.5s';
    div.textContent = amount;
    document.body.appendChild(div);
    
    // Project 3D position to screen
    const vec = position.clone();
    vec.project(camera);
    const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(vec.y * 0.5) + 0.5) * window.innerHeight;
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    
    damageNumbers.push({ div, life: 0.8, vy: -30 });
}

// Game loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const rawDt = clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    
    if (gameStarted) {
        // Use gamepad if connected, otherwise keyboard/mouse
        const activeInput = (gamepad.gamepad) ? gamepad : input;
        const mouseDelta = activeInput.consumeMouse();
        activeInput.preUpdate();
        
        // === EDITOR MODE TOGGLE (F1) ===
        if (activeInput.wasPressed('F1')) {
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
        
        // === SKILL BAR INPUTS (LMB / RMB / Q / E / R) ===
        if (skillSystem && player && !player.isDead) {
            if (activeInput.wasPressed('Mouse1')) skillSystem.useSkill('LMB');
            if (activeInput.wasPressed('Mouse2')) skillSystem.useSkill('RMB');
            if (activeInput.wasPressed('KeyQ')) skillSystem.useSkill('Q');
            if (activeInput.wasPressed('KeyE') && player.state !== 'CLIMB' && player.state !== 'HANG') skillSystem.useSkill('E');
            if (activeInput.wasPressed('KeyR')) skillSystem.useSkill('R');
        }
        
        // === BOSS FIGHT TOGGLE (B) ===
        if (activeInput.wasPressed('KeyB') && !bossFight.isActive() && !levelEditor.isActive()) {
            bossFight.start();
            bossHUD.style.display = 'block';
            ui.style.display = 'none';
        }
        
        // === APEX RIFT TOGGLE (T) ===
        if (activeInput.wasPressed('KeyT') && apexRift && !apexRift.active && !bossFight.isActive() && !levelEditor.isActive()) {
            apexRift.startRift();
        }
        
        // === DIFFICULTY TIER CYCLE (M) ===
        if (activeInput.wasPressed('KeyM')) {
            const tiers = ['normal', 'nightmare', 'hell', 'torment1', 'torment2', 'torment3', 'torment4', 'torment5', 'torment6'];
            const currentIdx = tiers.indexOf(difficultyTier.currentTier);
            const nextIdx = (currentIdx + 1) % tiers.length;
            if (difficultyTier.setTier(tiers[nextIdx])) {
                console.log(`[Difficulty] Set to: ${difficultyTier.getDisplayString()}`);
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
        
        // Overclock / Heat (compute early for finalDt)
        const timeScale = overclock.update(dt, activeInput);
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
        
        // Character panel toggle
        if (activeInput.wasPressed('KeyP') && !activeInput.isPressed('ShiftLeft')) {
            const cp = document.getElementById('character-panel');
            cp.style.display = (cp.style.display === 'block') ? 'none' : 'block';
        }
        
        // Assist mode toggle
        if (activeInput.wasPressed('KeyP') && activeInput.isPressed('ShiftLeft')) {
            assistMode.toggle();
        }
        
        // Gear panel toggle
        if (activeInput.wasPressed('KeyG')) {
            const gp = document.getElementById('gear-panel');
            if (gp) gp.style.display = (gp.style.display === 'block') ? 'none' : 'block';
        }
        
        // Companion panel toggle (U for Buddy)
        if (activeInput.wasPressed('KeyU')) {
            const comp = document.getElementById('companion-panel');
            if (comp) comp.style.display = (comp.style.display === 'block') ? 'none' : 'block';
        }
        
        // Faction panel toggle
        if (activeInput.wasPressed('KeyF') && !activeInput.isPressed('ShiftLeft')) {
            const fp = document.getElementById('faction-panel');
            if (fp) fp.style.display = (fp.style.display === 'block') ? 'none' : 'block';
        }
        
        // Safehouse panel toggle (H for Hub)
        if (activeInput.wasPressed('KeyH')) {
            const sp = document.getElementById('safehouse-panel');
            if (sp) sp.style.display = (sp.style.display === 'block') ? 'none' : 'block';
        }
        
        // Bounty panel toggle
        if (activeInput.wasPressed('KeyJ')) {
            const bp = document.getElementById('bounty-panel');
            if (bp) bp.style.display = (bp.style.display === 'block') ? 'none' : 'block';
        }
        
        // Codex panel toggle
        if (activeInput.wasPressed('KeyK')) {
            const cop = document.getElementById('codex-panel');
            if (cop) cop.style.display = (cop.style.display === 'block') ? 'none' : 'block';
        }
        
        // Mastery panel toggle
        if (activeInput.wasPressed('KeyL')) {
            const mp = document.getElementById('mastery-panel');
            if (mp) mp.style.display = (mp.style.display === 'block') ? 'none' : 'block';
        }
        
        // Implants panel toggle
        if (activeInput.wasPressed('KeyN')) {
            const ip = document.getElementById('implants-panel');
            if (ip) ip.style.display = (ip.style.display === 'block') ? 'none' : 'block';
        }
        
        // Rising Tide toggle
        if (activeInput.wasPressed('KeyO')) {
            if (risingTide.active) risingTide.stop();
            else risingTide.start();
        }
        
        // Speedrun IL hotkeys
        if (activeInput.wasPressed('Digit1')) speedrunILs.startIL('Rooftop');
        if (activeInput.wasPressed('Digit2')) speedrunILs.startIL('Freezer');
        if (activeInput.wasPressed('Digit3')) speedrunILs.startIL('ServerRoom');
        if (activeInput.wasPressed('Digit4')) speedrunILs.startIL('HangarBay');
        
        // Day/night toggle
        if (input.isPressed('KeyN') && !dayNightPressed) {
            dayNightPressed = true;
            presetIndex = (presetIndex + 1) % presets.length;
            postProcessing.setTimeOfDay(presets[presetIndex]);
            godRays.setTimeOfDay(presets[presetIndex]);
        } else if (!input.isPressed('KeyN')) {
            dayNightPressed = false;
        }
        
        // Freeze player during countdown
        if (timeTrial.state !== 'COUNTDOWN') {
            player.update(finalDt, activeInput, tpc.yaw);
        
        // Procedural animation
        procAnim.update(finalDt);
        
        // Foot IK
        footIK.update(finalDt);
        } else {
            // Still update trajectory and visuals during countdown
            player.trajectory.hide();
            player.updateVisuals(dt, new THREE.Vector3(), input);
        }
        
        timeTrial.update(dt, player);
        
        // Save ghost run on time trial finish
        if (timeTrial.state === 'FINISHED' && timeTrial.prevState !== 'FINISHED') {
            ghostRacing.saveRun('run_' + Date.now());
        }
        
        // Update drones
        world.drones.update(finalDt);
        
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
        
        // Update ziplines
        ziplines.update(finalDt, player, activeInput);
        
        // Update magnet boots
        magnetBoots.update(finalDt, activeInput);
        
        // Update grapple relays
        grappleRelays.update(finalDt, player);
        
        // Advanced movement
        advMovement.update(finalDt, activeInput);
        
        // Interactive environment
        interEnv.update(finalDt, activeInput);
        
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
        
        // Speedrun ILs
        speedrunILs.update(finalDt);
        
        // Challenge system
        challenges.update(finalDt);
        challenges.updateMovementTime(finalDt, player.state === 'SPRINT');
        
        // RPG systems update
        if (archetype) archetype.update(dt);
        if (progression) progression.update(dt);
        if (companion) companion.update(finalDt, player, world, world.drones ? world.drones.drones : []);
        if (territory) territory.update(finalDt);
        if (loyalty && typeof loyalty.update === 'function') loyalty.update(finalDt);
        if (npcSystem) npcSystem.update && npcSystem.update(finalDt, 12); // noon default
        if (blackout) blackout.update && blackout.update(finalDt, 12);
        if (rivals) rivals.update && rivals.update(finalDt, player);
        if (mastery) mastery.update && mastery.update(finalDt, player);
        if (subLevels) subLevels.update && subLevels.update(finalDt, player);
        if (collapse) collapse.update && collapse.update(finalDt, player);
        if (apexRift) apexRift.update(finalDt);
        if (nephalemGlory) nephalemGlory.update(finalDt);
        
        // Sync Nephalem Glory damage multiplier to CharacterSheet temp bonus
        if (nephalemGlory && characterSheet) {
            const gloryMult = nephalemGlory.getDamageMultiplier();
            const baseMult = gloryMult > 1.0 ? gloryMult - 1.0 : 0;
            characterSheet.addTempBonus('nephalem_glory', 'damageMultiplier', baseMult, 10);
        }
        if (codex) codex.update && codex.update(finalDt, player);
        
        // Combat systems update
        if (hitboxSystem) {
            hitboxSystem.update(finalDt);
            hitboxSystem.checkCollisions(damageSystem);
        }
        if (lootSystem) lootSystem.update(finalDt, player.position);
        enemyHealthBars.forEach(bar => { if (bar && bar.update) bar.update(finalDt); });
        
        // Skill system update
        if (skillSystem) skillSystem.update(finalDt);
        if (skillBarUI) skillBarUI.update();
        
        // === BOSS FIGHT UPDATE ===
        if (bossFight.isActive()) {
            bossFight.update(finalDt);
            // Update boss HUD
            const health = bossFight.getBossHealth();
            const maxHealth = bossFight.getBossMaxHealth();
            const pct = maxHealth > 0 ? (health / maxHealth) * 100 : 0;
            bossHealthFill.style.width = pct + '%';
            if (bossFight.currentPhase === 1) bossPhaseLabel.textContent = 'Phase 1: Ground Supremacy';
            else if (bossFight.currentPhase === 2) bossPhaseLabel.textContent = 'Phase 2: Aerial Dominance';
            else if (bossFight.currentPhase === 3) bossPhaseLabel.textContent = 'Phase 3: Overclocked Fury';
            
            // Check for victory
            if (bossFight.bossState === 'defeated' && bossVictory.style.display !== 'block') {
                bossVictory.style.display = 'block';
                bossHUD.style.display = 'none';
                document.getElementById('boss-time').textContent = 'Time: ' + bossFight.getFightTime();
                document.getElementById('boss-hits').textContent = 'Hits Taken: ' + bossFight.hitsTaken;
                document.getElementById('boss-grade').textContent = bossFight.getGrade();
                // Unlock achievement
                challenges.unlock('firstBossKill');
            }
        }
        
        // Update UI
        stateDisplay.textContent = player.getStateDisplay();
        speedDisplay.textContent = player.getSpeed();
        
        // Update player health bar
        const healthBar = document.getElementById('player-health-bar');
        const healthText = document.getElementById('player-health-text');
        const healthFill = document.getElementById('player-health-fill');
        if (healthBar && healthFill && player) {
            const pct = player.maxHealth > 0 ? (player.health / player.maxHealth) * 100 : 100;
            healthFill.style.width = pct + '%';
            if (healthText) healthText.textContent = Math.ceil(player.health) + ' / ' + player.maxHealth;
        }
        if (levelDisplay) {
            levelDisplay.textContent = progression.getLevel();
        }
        if (xpDisplay) {
            const pct = progression.getXPToNext() > 0
                ? Math.floor((progression.getXP() / progression.getXPToNext()) * 100)
                : 100;
            xpDisplay.textContent = pct + '%';
        }
        if (apDisplay) {
            apDisplay.textContent = characterSheet.getAttributePoints();
        }
        
        // Update gear panel
        const gp = document.getElementById('gear-panel');
        if (gp && gp.style.display === 'block' && exoSuit) {
            const equipped = exoSuit.getAllEquipped ? exoSuit.getAllEquipped() : {};
            const slots = ['frame', 'boots', 'gloves', 'optics'];
            slots.forEach(slot => {
                const el = document.getElementById('gear-' + slot);
                if (el) {
                    const item = equipped[slot];
                    if (item) {
                        el.textContent = item.name || item.id || 'Equipped';
                        el.classList.remove('empty');
                    } else {
                        el.textContent = 'Empty';
                        el.classList.add('empty');
                    }
                }
            });
            const gsEl = document.getElementById('gear-score');
            if (gsEl) gsEl.textContent = exoSuit.getGearScore ? exoSuit.getGearScore() : 0;
        }
        
        // Update companion panel
        const compPanel = document.getElementById('companion-panel');
        if (compPanel && compPanel.style.display === 'block' && companion && loyalty) {
            const modeEl = document.getElementById('companion-mode');
            const trustEl = document.getElementById('companion-trust');
            const tierEl = document.getElementById('companion-tier');
            if (modeEl) modeEl.textContent = companion.getMode ? companion.getMode() : '-';
            if (trustEl) trustEl.textContent = loyalty.getTrust ? loyalty.getTrust() : '-';
            if (tierEl) tierEl.textContent = loyalty.getTier ? loyalty.getTier() : '-';
        }
        
        // Update damage numbers
        for (let i = damageNumbers.length - 1; i >= 0; i--) {
            const dn = damageNumbers[i];
            dn.life -= dt;
            const rect = dn.div.getBoundingClientRect();
            dn.div.style.top = (rect.top + dn.vy * dt) + 'px';
            if (dn.life <= 0.3) dn.div.style.opacity = dn.life / 0.3;
            if (dn.life <= 0) {
                dn.div.remove();
                damageNumbers.splice(i, 1);
            }
        }
        
        // Update faction panel
        const fp = document.getElementById('faction-panel');
        if (fp && fp.style.display === 'block' && factions) {
            const facs = ['vanguard', 'synapse', 'hollow'];
            facs.forEach(f => {
                const rep = factions.getReputation ? factions.getReputation(f) : 0;
                const tier = factions.getTier ? factions.getTier(f) : 'neutral';
                const fillEl = document.getElementById('faction-' + f + '-fill');
                const tierEl = document.getElementById('faction-' + f + '-tier');
                if (fillEl) {
                    const pct = ((rep + 100) / 200) * 100;
                    fillEl.style.width = Math.max(0, Math.min(100, pct)) + '%';
                }
                if (tierEl) tierEl.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
            });
        }
        
        // Update safehouse panel
        const sp = document.getElementById('safehouse-panel');
        if (sp && sp.style.display === 'block' && safehouse) {
            const upgContainer = document.getElementById('safehouse-upgrades');
            if (upgContainer && safehouse.getAllUpgrades) {
                const upgrades = safehouse.getAllUpgrades();
                upgContainer.innerHTML = upgrades.map(u => {
                    return `<div class="sh-upgrade"><span class="name">${u.name}</span><span class="level">Lv${u.currentLevel}/${u.maxLevel}</span><br/><span style="color:#888;">${u.description}</span></div>`;
                }).join('');
            }
        }
        
        // Update bounty panel
        const bp = document.getElementById('bounty-panel');
        if (bp && bp.style.display === 'block' && bounty) {
            const rankEl = document.getElementById('bounty-rank');
            const contractsEl = document.getElementById('bounty-contracts');
            if (rankEl && bounty.getRunnerRank) rankEl.textContent = 'Rank: ' + bounty.getRunnerRank();
            if (contractsEl && bounty.getActiveContracts) {
                const contracts = bounty.getActiveContracts();
                contractsEl.innerHTML = contracts.slice(0, 3).map(c => {
                    return `<div class="bounty-contract"><strong>${c.targetType}</strong> in ${c.sectorId}<br/>Reward: ${c.reward}</div>`;
                }).join('') || '<div class="bounty-contract">No active contracts</div>';
            }
        }
        
        // Update codex panel
        const cop = document.getElementById('codex-panel');
        if (cop && cop.style.display === 'block' && codex) {
            const entriesEl = document.getElementById('codex-entries');
            if (entriesEl && codex.getAllEntries) {
                const entries = codex.getAllEntries();
                entriesEl.innerHTML = entries.map(e => {
                    const cls = e.unlocked ? 'codex-entry unlocked' : 'codex-entry locked';
                    return `<div class="${cls}">${e.unlocked ? e.title : '???'}</div>`;
                }).join('');
            }
        }
        
        // Update mastery panel
        const mp = document.getElementById('mastery-panel');
        if (mp && mp.style.display === 'block' && mastery) {
            const movesEl = document.getElementById('mastery-moves');
            if (movesEl && mastery.getMasteryOverview) {
                const overview = mastery.getMasteryOverview();
                movesEl.innerHTML = overview.map(m => {
                    return `<div class="mastery-row"><span>${m.name}</span><span>Lv${m.level}</span></div>`;
                }).join('');
            }
        }
        
        // Update implants panel
        const ip = document.getElementById('implants-panel');
        if (ip && ip.style.display === 'block' && implants) {
            const slots = ['neural', 'muscular', 'ocular', 'skeletal'];
            slots.forEach(s => {
                const el = document.getElementById('implant-' + s);
                if (el && implants.getImplant) {
                    const imp = implants.getImplant(s);
                    el.textContent = imp ? (imp.name || imp.id) : 'Empty';
                }
            });
        }
        
        // Update character panel
        const cp = document.getElementById('character-panel');
        if (cp && cp.style.display === 'block') {
            const lvlEl = document.getElementById('char-level');
            const xpFill = document.getElementById('char-xp-fill');
            if (lvlEl && progression) {
                lvlEl.textContent = progression.getLevel ? progression.getLevel() : (progression.level ?? 1);
                const xpVal = progression.getXP ? progression.getXP() : (progression.xp ?? 0);
                const xpNext = progression.getXPToNext ? progression.getXPToNext() : (progression.maxXp ?? 1);
                const xpPct = xpNext > 0 ? (xpVal / xpNext * 100) : 100;
                xpFill.style.width = Math.max(0, Math.min(100, xpPct)) + '%';
            }
            const stats = player.getRPGStats();
            const statMap = { mob: 'char-mob', ref: 'char-ref', syn: 'char-syn', for: 'char-for', tec: 'char-tec', gut: 'char-gut' };
            for (const [key, id] of Object.entries(statMap)) {
                const el = document.getElementById(id);
                if (el) el.textContent = stats[key] ?? 10;
            }
            const archEl = document.getElementById('char-archetype');
            const origEl = document.getElementById('char-origin');
            if (archEl && archetype) archEl.textContent = archetype.currentArchetype ?? archetype.name ?? '-';
            if (origEl && origin) origEl.textContent = origin.currentOrigin ?? origin.name ?? '-';
            const resFill = document.getElementById('char-resource-fill');
            if (resFill && characterSheet) {
                const res = archetype ? archetype.getResourceValue() : 0;
                const maxRes = archetype ? archetype.getResourceMax() : 100;
                resFill.style.width = (maxRes > 0 ? (res / maxRes * 100) : 0) + '%';
            }
        }
        
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

animate();
