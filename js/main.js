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
import { StaminaSystem } from './StaminaSystem.js';
import { CombatSystem } from './CombatSystem.js';
import { StatusEffectSystem } from './StatusEffectSystem.js';
import { EnemyManager } from './EnemyManager.js';
import { WeaponSystem, WEAPON_SLOTS } from './WeaponSystem.js';
import { ArenaMode } from './ArenaMode.js';
import { ConsequenceSystem } from './ConsequenceSystem.js';
import { DebtSystem } from './DebtSystem.js';
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
const projectileManager = new ProjectileManager(scene, world);

// Audio
const audio = new AudioManager(scene, world);

// Player first (camera controller wired after tpc is created)
const player = new Player(scene, world, camera, audio, null);

// RPG Phase 1 systems
const characterSheet = new CharacterSheet(player);
characterSheet._load();
const progression = new ProgressionSystem(characterSheet);
const archetype = new ArchetypeSystem(player, characterSheet);
const origin = new OriginSystem(player, characterSheet);
player.setCharacterSheet(characterSheet);

progression.onLevelUp = (level, points) => {
    console.log(`Level up! Now level ${level}. Attribute points: ${points}`);
    if (passiveTree) passiveTree.addPoints(1);
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
exoSuit._load();
exoSuit.onEquip = showLootToast;
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
const consequences = new ConsequenceSystem();
const debt = new DebtSystem(player, enemyManager);

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
    if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.lightAttack)) return;
    if (staminaSystem) staminaSystem.spend(staminaSystem.costs.lightAttack);
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
            if (target && legendaryPowerSystem) legendaryPowerSystem.onMeleeHit(target);
        }
    );
    hitbox.damage = skill.finalDamage || 15;
    hitbox.team = 'player';
    hitboxSystem.registerHitbox(hitbox);
    if (gamepad && gamepad.rumble) gamepad.rumble(0.1, 0.4, 50);
});

skillSystem.onExecute('dive_kick', (skill, targetPos, p) => {
    if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.heavyAttack)) return;
    if (staminaSystem) staminaSystem.spend(staminaSystem.costs.heavyAttack);
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
    if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.lightAttack)) return;
    if (staminaSystem) staminaSystem.spend(staminaSystem.costs.lightAttack);
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
    if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.heavyAttack)) return;
    if (staminaSystem) staminaSystem.spend(staminaSystem.costs.heavyAttack);
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
    if (gamepad && gamepad.rumble) gamepad.rumble(0.5, 1.0, 200);
});

// ------------------------------------------------------------------
// Phase 2 — Operative callbacks
// ------------------------------------------------------------------
skillSystem.onExecute('silenced_pistol', (skill, targetPos, p) => {
    const dir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
    projectileManager.fire(p.position.clone().add(new THREE.Vector3(0, 1.2, 0)), dir, {
        speed: 60, range: 25, radius: 0.15, damage: skill.finalDamage || 12,
        damageType: 'kinetic', color: 0x00ccff,
        onHit: (target) => {
            if (target && target.takeDamage) {
                target.takeDamage(skill.finalDamage || 12, 'kinetic', p);
            }
            const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
            spawnDamageNumber(tPos, Math.round(skill.finalDamage || 12), false, 'kinetic');
        }
    });
});

skillSystem.onExecute('ghost_bullet', (skill, targetPos, p) => {
    const dir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
    projectileManager.firePiercing(p.position.clone().add(new THREE.Vector3(0, 1.2, 0)), dir, {
        range: 25, radius: 0.5, damage: skill.finalDamage || 60,
        damageType: 'energy', color: 0x00ffcc,
        onHit: (target) => {
            if (target && target.takeDamage) {
                target.takeDamage(skill.finalDamage || 60, 'energy', p);
            }
            const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
            spawnDamageNumber(tPos, Math.round(skill.finalDamage || 60), false, 'energy');
        }
    });
});

skillSystem.onExecute('predator_vision', (skill, targetPos, p) => {
    p._predatorVisionActive = true;
    p._critBonusFromPredator = 0.15;
    const overlay = document.getElementById('glory-overlay');
    if (overlay) { overlay.style.background = 'rgba(0,100,255,0.12)'; overlay.style.opacity = '0.12'; }
    enemyHealthBars.forEach(bar => { if (bar && bar.sprite) bar.sprite.visible = true; });
    setTimeout(() => {
        p._predatorVisionActive = false;
        p._critBonusFromPredator = 0;
        if (overlay) { overlay.style.background = ''; overlay.style.opacity = '0'; }
    }, 6000);
});

skillSystem.onExecute('smoke_bomb', (skill, targetPos, p) => {
    particleEffects.explosion(p.position.clone(), 0x333333, 15);
    p.isInvisible = true;
    const overlay = document.getElementById('glory-overlay');
    if (overlay) { overlay.style.background = 'rgba(0,0,0,0.4)'; overlay.style.opacity = '0.3'; }
    const drones = world.drones ? world.drones.drones : [];
    for (const drone of drones) {
        const pos = drone.position || (drone.mesh && drone.mesh.position);
        if (pos && pos.distanceTo(p.position) < 4) {
            drone._smokeBlind = true;
            setTimeout(() => { drone._smokeBlind = false; }, 3000);
        }
    }
    setTimeout(() => {
        p.isInvisible = false;
        if (overlay) { overlay.style.background = ''; overlay.style.opacity = '0'; }
    }, 3000);
});

skillSystem.onExecute('assassinate', (skill, targetPos, p) => {
    const drones = world.drones ? world.drones.drones : [];
    let nearest = null;
    let nearestDist = Infinity;
    for (const drone of drones) {
        if (drone.isDead) continue;
        const pos = drone.position || (drone.mesh && drone.mesh.position);
        if (!pos) continue;
        const dist = pos.distanceTo(p.position);
        if (dist < 15 && dist < nearestDist) {
            nearest = drone; nearestDist = dist;
        }
    }
    if (nearest) {
        const tPos = nearest.position || (nearest.mesh && nearest.mesh.position);
        const behind = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing)).normalize();
        p.position.copy(tPos).sub(behind.multiplyScalar(1.2));
        p.position.y = Math.max(p.position.y, 0.5);
        const hitbox = new Hitbox(
            p, 'melee', { type: 'sphere', radius: 0.8 }, new THREE.Vector3(0, 0.3, 0), 0.15,
            (hb, target) => {
                if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 200, 'kinetic', p);
                const tp = target.position || (target.mesh && target.mesh.position) || p.position;
                spawnDamageNumber(tp, Math.round(skill.finalDamage || 200), false, 'kinetic');
            }
        );
        hitbox.damage = skill.finalDamage || 200;
        hitbox.team = 'player';
        hitboxSystem.registerHitbox(hitbox);
        postProcessing.shake(0.6, 0.3);
    }
});

// ------------------------------------------------------------------
// Phase 2 — Saboteur callbacks
// ------------------------------------------------------------------
skillSystem.onExecute('scrap_throw', (skill, targetPos, p) => {
    const dir = new THREE.Vector3(Math.sin(p.facing), 0.1, Math.cos(p.facing)).normalize();
    projectileManager.fire(p.position.clone().add(new THREE.Vector3(0, 1.0, 0)), dir, {
        speed: 25, range: 12, radius: 0.25, damage: skill.finalDamage || 18,
        damageType: 'kinetic', color: 0xff3333,
        onHit: (target) => {
            if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 18, 'kinetic', p);
            const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
            spawnDamageNumber(tPos, Math.round(skill.finalDamage || 18), false, 'kinetic');
        }
    });
});

skillSystem.onExecute('grenade_toss', (skill, targetPos, p) => {
    const start = p.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const dir = new THREE.Vector3(Math.sin(p.facing), 0.4, Math.cos(p.facing)).normalize();
    const end = start.clone().add(dir.multiplyScalar(10));
    // Simple lob arc
    let t = 0;
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff3333 })
    );
    mesh.position.copy(start);
    scene.add(mesh);
    const duration = 1.5;
    const timer = setInterval(() => {
        t += 0.05;
        const frac = Math.min(1, t / duration);
        mesh.position.lerpVectors(start, end, frac);
        mesh.position.y += Math.sin(frac * Math.PI) * 3;
        if (frac >= 1) {
            clearInterval(timer);
            scene.remove(mesh);
            mesh.geometry.dispose(); mesh.material.dispose();
            particleEffects.explosion(mesh.position.clone(), 0xff5500, 25);
            const hitbox = new Hitbox(
                { position: mesh.position }, 'explosion', { type: 'sphere', radius: 4 }, new THREE.Vector3(0, 0, 0), 0.3,
                (hb, target) => {
                    if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 55, 'explosive', p);
                    const tp = target.position || (target.mesh && target.mesh.position) || mesh.position;
                    spawnDamageNumber(tp, Math.round(skill.finalDamage || 55), false, 'explosive');
                }
            );
            hitbox.damage = skill.finalDamage || 55;
            hitbox.team = 'player';
            hitboxSystem.registerHitbox(hitbox);
        }
    }, 50);
});

skillSystem.onExecute('proxy_mine', (skill, targetPos, p) => {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.3),
        new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9 })
    );
    mesh.position.copy(p.position);
    mesh.position.y = 0.15;
    scene.add(mesh);
    const mine = { mesh, placedAt: performance.now(), exploded: false };
    if (!world._proximityMines) world._proximityMines = [];
    world._proximityMines.push(mine);
    // Auto-remove after 30s
    setTimeout(() => {
        if (!mine.exploded) {
            mine.exploded = true;
            scene.remove(mesh);
            mesh.geometry.dispose(); mesh.material.dispose();
            const idx = world._proximityMines.indexOf(mine);
            if (idx >= 0) world._proximityMines.splice(idx, 1);
        }
    }, 30000);
});

skillSystem.onExecute('decoy', (skill, targetPos, p) => {
    const decoyMesh = p.mesh.clone();
    const forward = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing)).multiplyScalar(3);
    decoyMesh.position.copy(p.position).add(forward);
    decoyMesh.position.y = 0.5;
    scene.add(decoyMesh);
    const decoy = {
        mesh: decoyMesh, health: 30, maxHealth: 30, isDead: false, team: 'player',
        takeDamage(amt) {
            this.health -= amt;
            if (this.health <= 0 && !this.isDead) {
                this.isDead = true;
                particleEffects.explosion(this.mesh.position.clone(), 0xffaa00, 20);
                const hb = new Hitbox(
                    { position: this.mesh.position }, 'explosion', { type: 'sphere', radius: 3 }, new THREE.Vector3(0, 0, 0), 0.3
                );
                hb.damage = 30; hb.team = 'player';
                hitboxSystem.registerHitbox(hb);
                scene.remove(this.mesh);
                const idx = world._decoys.indexOf(this);
                if (idx >= 0) world._decoys.splice(idx, 1);
            }
        }
    };
    if (!world._decoys) world._decoys = [];
    world._decoys.push(decoy);
    // Taunt nearby drones
    const drones = world.drones ? world.drones.drones : [];
    for (const drone of drones) {
        const pos = drone.position || (drone.mesh && drone.mesh.position);
        if (pos && pos.distanceTo(decoyMesh.position) < 10) {
            drone._decoyTarget = decoy;
        }
    }
    // Explode or despawn after 5s
    setTimeout(() => {
        if (!decoy.isDead) {
            decoy.isDead = true;
            particleEffects.explosion(decoyMesh.position.clone(), 0xffaa00, 20);
            const hitbox = new Hitbox(
                { position: decoyMesh.position }, 'explosion', { type: 'sphere', radius: 3 }, new THREE.Vector3(0, 0, 0), 0.3
            );
            hitbox.damage = 30; hitbox.team = 'player';
            hitboxSystem.registerHitbox(hitbox);
        }
        scene.remove(decoyMesh);
        const idx = world._decoys.indexOf(decoy);
        if (idx >= 0) world._decoys.splice(idx, 1);
    }, 5000);
});

skillSystem.onExecute('zero_cooldown', (skill, targetPos, p) => {
    skillSystem.setNoCooldown(true);
    resourceSystem.costMultiplier = 0;
    setTimeout(() => {
        skillSystem.setNoCooldown(false);
        resourceSystem.costMultiplier = 1.0;
    }, 5000);
});

// ------------------------------------------------------------------
// Phase 2 — Specimen callbacks
// ------------------------------------------------------------------
skillSystem.onExecute('claw_swipe', (skill, targetPos, p) => {
    if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.lightAttack)) return;
    if (staminaSystem) staminaSystem.spend(staminaSystem.costs.lightAttack);
    const forward = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
    let hits = 0;
    const hitbox = new Hitbox(
        p, 'melee', { type: 'sphere', radius: 1.5 }, new THREE.Vector3(0, 0.3, 0), 0.2,
        (hb, target) => {
            if (hits >= 3) return;
            const tPos = target.position || (target.mesh && target.mesh.position);
            if (!tPos) return;
            const toTarget = tPos.clone().sub(p.position).normalize();
            const dot = forward.dot(toTarget);
            if (dot > 0) { // front hemisphere
                hits++;
                if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 20, 'kinetic', p);
                spawnDamageNumber(tPos, Math.round(skill.finalDamage || 20), false, 'kinetic');
                if (legendaryPowerSystem) legendaryPowerSystem.onMeleeHit(target);
            }
        }
    );
    hitbox.damage = skill.finalDamage || 20;
    hitbox.team = 'player';
    hitboxSystem.registerHitbox(hitbox);
    if (gamepad && gamepad.rumble) gamepad.rumble(0.1, 0.4, 50);
});

skillSystem.onExecute('berserk_lunge', (skill, targetPos, p) => {
    if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.heavyAttack)) return;
    if (staminaSystem) staminaSystem.spend(staminaSystem.costs.heavyAttack);
    const drones = world.drones ? world.drones.drones : [];
    let nearest = null; let nearestDist = Infinity;
    for (const drone of drones) {
        if (drone.isDead) continue;
        const pos = drone.position || (drone.mesh && drone.mesh.position);
        if (!pos) continue;
        const dist = pos.distanceTo(p.position);
        if (dist < 15 && dist < nearestDist) { nearest = drone; nearestDist = dist; }
    }
    if (nearest) {
        const tPos = nearest.position || (nearest.mesh && nearest.mesh.position);
        p.position.copy(tPos);
        p.position.y = Math.max(p.position.y, 0.5);
        postProcessing.shake(0.8, 0.3);
        const hitbox = new Hitbox(
            p, 'melee', { type: 'sphere', radius: 3 }, new THREE.Vector3(0, 0, 0), 0.3,
            (hb, target) => {
                if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 65, 'kinetic', p);
                const tp = target.position || (target.mesh && target.mesh.position) || p.position;
                spawnDamageNumber(tp, Math.round(skill.finalDamage || 65), false, 'kinetic');
            }
        );
        hitbox.damage = skill.finalDamage || 65;
        hitbox.team = 'player';
        hitboxSystem.registerHitbox(hitbox);
        if (gamepad && gamepad.rumble) gamepad.rumble(0.5, 1.0, 200);
    }
});

skillSystem.onExecute('roar', (skill, targetPos, p) => {
    if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.lightAttack)) return;
    if (staminaSystem) staminaSystem.spend(staminaSystem.costs.lightAttack);
    const drones = world.drones ? world.drones.drones : [];
    for (const drone of drones) {
        const pos = drone.position || (drone.mesh && drone.mesh.position);
        if (pos && pos.distanceTo(p.position) < 6) {
            drone._feared = true;
            setTimeout(() => { drone._feared = false; }, 2000);
        }
    }
    if (audio && audio.ctx) {
        const t = audio.ctx.currentTime;
        const dest = audio._makeDestination();
        const osc = audio.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
        const gain = audio.ctx.createGain();
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain); gain.connect(dest);
        osc.start(t); osc.stop(t + 0.5);
    }
});

skillSystem.onExecute('adrenaline_rush', (skill, targetPos, p) => {
    p.moveSpeedMultiplier *= 1.5;
    p._regenPerSecond += 0.05 * p.maxHealth;
    setTimeout(() => {
        p.moveSpeedMultiplier /= 1.5;
        p._regenPerSecond -= 0.05 * p.maxHealth;
    }, 5000);
});

skillSystem.onExecute('primal_surge', (skill, targetPos, p) => {
    characterSheet.addTempBonus('primal_surge', 'damageMultiplier', 1.0, 6);
    p.moveSpeedMultiplier *= 1.5;
    p._staggerImmune = true;
    const overlay = document.getElementById('glory-overlay');
    if (overlay) { overlay.style.background = 'rgba(255,0,0,0.2)'; overlay.style.opacity = '0.2'; }
    setTimeout(() => {
        characterSheet.removeTempBonus('primal_surge');
        p.moveSpeedMultiplier /= 1.5;
        p._staggerImmune = false;
        if (overlay) { overlay.style.background = ''; overlay.style.opacity = '0'; }
    }, 6000);
});

// ------------------------------------------------------------------
// Phase 2 — Netrunner callbacks
// ------------------------------------------------------------------
skillSystem.onExecute('zap', (skill, targetPos, p) => {
    projectileManager.fireChainLightning(p.position.clone().add(new THREE.Vector3(0, 1, 0)), null, {
        maxChains: 1, jumpRange: 6, damage: skill.finalDamage || 14,
        damageType: 'electric', color: 0xaa66ff,
        onHit: (target, dmg) => {
            if (target && target.takeDamage) target.takeDamage(dmg, 'electric', p);
            const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
            spawnDamageNumber(tPos, Math.round(dmg), false, 'electric');
        }
    });
});

skillSystem.onExecute('hack_drone', (skill, targetPos, p) => {
    const drones = world.drones ? world.drones.drones : [];
    let nearest = null; let nearestDist = Infinity;
    for (const drone of drones) {
        if (drone.isDead || drone.team === 'player') continue;
        const pos = drone.position || (drone.mesh && drone.mesh.position);
        if (!pos) continue;
        const dist = pos.distanceTo(p.position);
        if (dist < 12 && dist < nearestDist) { nearest = drone; nearestDist = dist; }
    }
    if (nearest) {
        nearest.team = 'player';
        nearest._hackExpiry = 8;
        spawnDamageNumber((nearest.position || nearest.mesh.position).clone().add(new THREE.Vector3(0, 1, 0)), 'HACKED', false, 'electric');
    }
});

skillSystem.onExecute('emp_pulse', (skill, targetPos, p) => {
    const hitbox = new Hitbox(
        p, 'explosion', { type: 'sphere', radius: 5 }, new THREE.Vector3(0, 0, 0), 0.3,
        (hb, target) => {
            if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 30, 'electric', p);
            target._disabled = true;
            setTimeout(() => { target._disabled = false; }, 3000);
            const tp = target.position || (target.mesh && target.mesh.position) || p.position;
            spawnDamageNumber(tp, Math.round(skill.finalDamage || 30), false, 'electric');
        }
    );
    hitbox.damage = skill.finalDamage || 30;
    hitbox.team = 'player';
    hitboxSystem.registerHitbox(hitbox);
    // EMP ring visual
    const ringGeo = new THREE.RingGeometry(0.1, 0.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(p.position); ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
    let life = 0.5;
    const anim = () => {
        life -= 0.016;
        const s = 1 + (0.5 - life) * 20;
        ring.scale.set(s, s, s);
        ringMat.opacity = Math.max(0, life / 0.5);
        if (life > 0) requestAnimationFrame(anim);
        else { scene.remove(ring); ringGeo.dispose(); ringMat.dispose(); }
    };
    anim();
});

skillSystem.onExecute('firewall', (skill, targetPos, p) => {
    p._firewallActive = true;
    const geo = new THREE.SphereGeometry(1.2, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.25, wireframe: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(p.position);
    scene.add(mesh);
    const interval = setInterval(() => {
        mesh.position.copy(p.position);
    }, 16);
    setTimeout(() => {
        clearInterval(interval);
        p._firewallActive = false;
        scene.remove(mesh);
        geo.dispose(); mat.dispose();
    }, 4000);
});

skillSystem.onExecute('swarm_override', (skill, targetPos, p) => {
    const drones = world.drones ? world.drones.drones : [];
    for (const drone of drones) {
        const pos = drone.position || (drone.mesh && drone.mesh.position);
        if (!pos || pos.distanceTo(p.position) > 15) continue;
        drone.team = 'player';
        drone._hackExpiry = 8;
        // Purple burst
        particleEffects.explosion(pos.clone(), 0xaa66ff, 8);
    }
});

const skillBarUI = new SkillBarUI(skillSystem, resourceSystem);
const passiveTree = new PassiveTree(activeArchetypeId, skillSystem);
passiveTree._load();

// Combat systems
const damageSystem = new DamageSystem(characterSheet, statusEffectSystem);
const hitboxSystem = new HitboxSystem();
const staminaSystem = new StaminaSystem(player);
player.staminaSystem = staminaSystem;
const combatSystem = new CombatSystem(player, hitboxSystem, damageSystem, camera, audio);
const statusEffectSystem = new StatusEffectSystem();
combatSystem.onHitbox = (data) => {
    const hb = new Hitbox(data.owner, data.type, data.shape, data.offset, data.duration, (hitbox, target) => {
        if (target && target.takeDamage) {
            target.takeDamage(data.damage, 'kinetic', data.owner);
        }
        if (target && typeof spawnDamageNumber === 'function') {
            const tPos = target.position || (target.mesh && target.mesh.position) || data.owner.position;
            spawnDamageNumber(tPos, Math.round(data.damage), false, 'kinetic');
        }
        combatSystem.triggerHitStop(data.isFinisher ? 0.12 : (data.isHeavy ? 0.08 : 0.05));
        if (data.isHeavy || data.isFinisher) combatSystem.triggerCameraShake(0.15, 0.2);
    });
    hb.damage = data.damage;
    hb.team = 'player';
    hitboxSystem.registerHitbox(hb);
};
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
                // Legendary powers
                if (legendaryPowerSystem) legendaryPowerSystem.onEnemyKilled(deadDrone);
                // Loot drop with difficulty scaling
                const diffLootMult = difficultyTier ? difficultyTier.getTierConfig().lootBonus : 0;
                const drop = lootSystem.generateDrop(deadDrone.type || 'patrol', deadDrone.isElite, 1.0 + diffLootMult, activeArchetypeId);
                if (drop) {
                    lootSystem.spawnDrop(drop, deadDrone.position || deadDrone.mesh.position);
                    showHint('Loot drops! Walk over items to pick them up.');
                    if (drop.rarity >= 4) showHint('LEGENDARY! Check your gear stats (G key).');
                }
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
    if (nephalemGlory) nephalemGlory.setEnemyHealthBars(enemyHealthBars);
}

// Wire DamageSystem into DroneAI for dodge/crit/type calculations
if (world.drones) {
    world.drones.setDamageSystem(damageSystem);
}

// Player damage numbers + Nephalem Glory streak break
player.onDamageTaken = (amount, type, source) => {
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

// Hint system
const _shownHints = new Set();
function showHint(text) {
    if (_shownHints.has(text)) return;
    _shownHints.add(text);
    const el = document.getElementById('hint-toast');
    if (!el) return;
    el.textContent = text;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 4000);
}

function showLootToast(item) {
    const el = document.getElementById('loot-toast');
    if (!el || !item) return;
    const nameEl = document.getElementById('loot-toast-name');
    const affixEl = document.getElementById('loot-toast-affix');
    if (nameEl) {
        nameEl.textContent = item.name || 'Unknown Item';
        const rarityColors = { 1: '#aaa', 2: '#4488ff', 3: '#ffaa00', 4: '#ff4444', 5: '#00ff44', 6: '#ff8800', 7: '#ff00ff' };
        nameEl.style.color = rarityColors[item.rarity] || '#fff';
    }
    if (affixEl) {
        const firstAffix = item.affixes && item.affixes[0];
        affixEl.textContent = firstAffix ? `${firstAffix.name}: ${firstAffix.stat} ${firstAffix.value}` : '';
    }
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// Equip starter gear based on origin
const startingGear = origin.getStartingGear ? origin.getStartingGear() : null;
if (startingGear && exoSuit) {
    const template = exoSuit.getItemTemplate ? exoSuit.getItemTemplate(startingGear) : null;
    if (template && affixSystem) {
        const item = affixSystem.generateItem(template);
        exoSuit.equip(item);
        showLootToast(item);
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

// Phase 4: Endgame systems
const difficultyTier = new DifficultyTierSystem(challenges);
const apexRift = new ApexRiftSystem(scene, world, player, bossFight, challenges, lootSystem, difficultyTier, enemyManager);
const nephalemGlory = new NephalemGlory(player, challenges);

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
        console.log('[PuzzleRoom] Demo switches solved!');
        dungeonSystem._spawnPickupText && dungeonSystem._spawnPickupText('Puzzle Solved!', '#ffff44');
    }
);
demoPuzzle.addBlockPuzzle(
    new THREE.Vector3(-5, 0, 8),
    new THREE.Vector3(-5, 0, 5),
    () => {
        console.log('[PuzzleRoom] Demo block puzzle solved!');
    }
);

// ── Wave-2 Zelda systems ────────────────────────────────────────────────────
const lightDarkWorld = new LightDarkWorldSystem(scene, player, postProcessing, ambient, sun, fill);
const dialogueSystem = new DialogueSystem(player, npcSystem, bounty);
const shop = new ShopSystem(scene, player, heartSystem);
const bottleSystem = new BottleSystem(player, heartSystem, resourceSystem);
shop.setBottleSystem(bottleSystem);
const overworldMap = new OverworldMap(player, dungeonSystem, keyItems);

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
            const hcr = document.getElementById('heart-container-row');
            if (hcr) hcr.style.display = 'flex';
            const skb = document.getElementById('sector-key-bar');
            if (skb) skb.style.display = 'flex';
            if (skillBarUI) skillBarUI.show();
        }
        audio.playAmbience();
    } else {
        gameStarted = false;
        startScreen.style.display = 'flex';
        ui.style.display = 'none';
        crosshair.style.display = 'none';
        const hcr = document.getElementById('heart-container-row');
        if (hcr) hcr.style.display = 'none';
        const skb = document.getElementById('sector-key-bar');
        if (skb) skb.style.display = 'none';
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

// Settings panel wiring
(function wireSettings() {
    const fovSlider = document.getElementById('set-fov');
    if (fovSlider && postProcessing) {
        fovSlider.addEventListener('input', (e) => postProcessing.setFOV(parseFloat(e.target.value)));
    }
    const effects = [
        ['set-filmgrain', 'filmGrain'],
        ['set-motionblur', 'motionBlur'],
        ['set-sao', 'sao'],
        ['set-bloom', 'bloom'],
        ['set-chromatic', 'chromaticAberration'],
        ['set-vignette', 'vignette']
    ];
    for (const [id, name] of effects) {
        const cb = document.getElementById(id);
        if (cb && postProcessing) {
            cb.addEventListener('change', (e) => postProcessing.setEffectEnabled(name, e.target.checked));
        }
    }
    const volMaster = document.getElementById('set-vol-master');
    if (volMaster && audio) volMaster.addEventListener('input', (e) => audio.setMasterVolume(parseFloat(e.target.value) / 100));
    const volSFX = document.getElementById('set-vol-sfx');
    if (volSFX && audio) volSFX.addEventListener('input', (e) => audio.setSFXVolume(parseFloat(e.target.value) / 100));
    const volMusic = document.getElementById('set-vol-music');
    if (volMusic && audio) volMusic.addEventListener('input', (e) => audio.setMusicVolume(parseFloat(e.target.value) / 100));
    // Assist mode toggles (granular flags)
    const assistJump = document.getElementById('set-assist-jump');
    if (assistJump && assistMode) {
        assistJump.addEventListener('change', (e) => {
            assistMode.setJumpAssist(e.target.checked);
            if (e.target.checked) assistMode.modifyPlayer(player);
            else assistMode.restorePlayer(player);
        });
    }
    const assistGrapple = document.getElementById('set-assist-grapple');
    if (assistGrapple && assistMode) {
        assistGrapple.addEventListener('change', (e) => {
            assistMode.setGrappleAssist(e.target.checked);
            if (e.target.checked) assistMode.modifyPlayer(player);
            else assistMode.restorePlayer(player);
        });
    }
    const assistAim = document.getElementById('set-assist-aim');
    if (assistAim && assistMode) {
        assistAim.addEventListener('change', (e) => {
            assistMode.setAimAssist(e.target.checked);
            if (e.target.checked) assistMode.modifyPlayer(player);
            else assistMode.restorePlayer(player);
        });
    }
})();

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

        // Parry input (Shift+F while grounded)
        if (activeInput.wasPressed('KeyF') && activeInput.isPressed('ShiftLeft') && player.grounded
            && !dialogueSystem.isOpen && !shop.isOpen && !dungeonSystem.nearbyDungeonId) {
            const didParry = player.triggerParry();
            if (didParry && audio) audio.playTone(880, 0.05, 'sine');
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
            showHint('Press T to enter the Apex Rift — endgame awaits.');
        }
        
        // === DIFFICULTY TIER CYCLE (M) ===
        if (activeInput.wasPressed('KeyT') && activeInput.isPressed('ShiftLeft')) {
            arenaMode.toggleSelector();
        }

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
        
        // Overclock / Heat (compute early for finalDt) — gated by key item
        const timeScale = player.overclockUnlocked !== false ? overclock.update(dt, activeInput) : 1.0;
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
        
        // Passive tree toggle (P)
        if (activeInput.wasPressed('KeyP') && !activeInput.isPressed('ShiftLeft')) {
            const pt = document.getElementById('passive-tree');
            if (pt) {
                const showing = pt.style.display === 'block';
                pt.style.display = showing ? 'none' : 'block';
                if (!showing && passiveTree) passiveTree._renderUI();
            }
        }

        // Character panel toggle (Shift+P)
        if (activeInput.wasPressed('KeyP') && activeInput.isPressed('ShiftLeft')) {
            const cp = document.getElementById('character-panel');
            cp.style.display = (cp.style.display === 'block') ? 'none' : 'block';
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
        
        // Faction panel toggle (guarded: not when dialogue/shop/dungeon is active)
        if (activeInput.wasPressed('KeyF') && !activeInput.isPressed('ShiftLeft')
            && !dialogueSystem.isOpen && !shop.isOpen && !dungeonSystem.nearbyDungeonId) {
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

        // Key Items panel toggle (I)
        if (activeInput.wasPressed('KeyI')) {
            const ki = document.getElementById('keyitem-panel');
            if (ki) {
                const showing = ki.style.display === 'block';
                ki.style.display = showing ? 'none' : 'block';
                if (!showing && keyItems) {
                    // Refresh collected state
                    keyItems.getAllItems().forEach(item => {
                        const row = document.getElementById('ki-' + item.id);
                        if (row) {
                            if (item.collected) row.classList.add('found');
                            else row.classList.remove('found');
                        }
                    });
                }
            }
        }

        // Settings panel toggle (O)
        if (activeInput.wasPressed('KeyO') && !activeInput.isPressed('ShiftLeft')) {
            const sp = document.getElementById('settings-panel');
            if (sp) sp.style.display = (sp.style.display === 'block') ? 'none' : 'block';
        }

        // Rising Tide toggle (Shift+O)
        if (activeInput.wasPressed('KeyO') && activeInput.isPressed('ShiftLeft')) {
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
            player.updateVisuals(dt, new THREE.Vector3(), input);
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
        weaponSystem.update(finalDt, activeInput);
        arenaMode.update(finalDt);
        
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
        
        // Speedrun ILs
        speedrunILs.update(finalDt);
        
        // Challenge system
        challenges.update(finalDt);
        challenges.updateMovementTime(finalDt, player.state === 'SPRINT');
        if (player.state === 'SPRINT' && legendaryPowerSystem) legendaryPowerSystem.onSprint(finalDt);
        
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
        overworldMap.update(finalDt, activeInput);

        dungeonSystem.update(finalDt, activeInput);
        demoPuzzle.update(finalDt, activeInput);

        // Dungeon enter via F (only in overworld, not when dialogue/shop is active)
        if (!dialogueSystem.isOpen && !shop.isOpen &&
            !dungeonSystem.activeDungeon && activeInput.wasPressed('KeyF') && dungeonSystem.nearbyDungeonId) {
            dungeonSystem.enterDungeon(dungeonSystem.nearbyDungeonId);
        }
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
        
        // Update Zelda-style heart containers
        if (heartSystem) heartSystem.renderHearts('heart-container-row');

        // Update sector key counter
        const sectorKeyEl = document.getElementById('sector-key-count');
        if (sectorKeyEl && dungeonSystem) {
            sectorKeyEl.textContent = dungeonSystem.getSectorKeyCount() + ' / 7';
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
