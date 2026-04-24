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
        }
        audio.playAmbience();
    } else {
        gameStarted = false;
        startScreen.style.display = 'flex';
        ui.style.display = 'none';
        crosshair.style.display = 'none';
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
        
        // === BOSS FIGHT TOGGLE (B) ===
        if (activeInput.wasPressed('KeyB') && !bossFight.isActive() && !levelEditor.isActive()) {
            bossFight.start();
            bossHUD.style.display = 'block';
            ui.style.display = 'none';
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
        
        // Rising Tide toggle
        if (activeInput.wasPressed('KeyP')) {
            if (activeInput.isPressed('ShiftLeft')) {
                assistMode.toggle();
            } else {
                if (risingTide.active) risingTide.stop();
                else risingTide.start();
            }
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
