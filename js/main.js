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
import { BossFabricator } from './bosses/BossFabricator.js';
import { BossWarden } from './bosses/BossWarden.js';
import { BossLeviathan } from './bosses/BossLeviathan.js';
import { BossSwarmQueen } from './bosses/BossSwarmQueen.js';
import { BossArchitect } from './bosses/BossArchitect.js';
import { PipeWrench } from './weapons/PipeWrench.js';
import { SemiAutoPistol } from './weapons/SemiAutoPistol.js';
import { AssaultRifle } from './weapons/AssaultRifle.js';
import { Shotgun } from './weapons/Shotgun.js';
import { StickyBomb } from './weapons/StickyBomb.js';
import { StaffOfEmbers } from './weapons/StaffOfEmbers.js';
import { VoidWand } from './weapons/VoidWand.js';
import { CryoGauntlet } from './weapons/CryoGauntlet.js';
import { SniperRifle } from './weapons/SniperRifle.js';
import { SubMachineGun } from './weapons/SubMachineGun.js';
import { RocketLauncher } from './weapons/RocketLauncher.js';
import { Flamethrower } from './weapons/Flamethrower.js';
import { PlasmaRifle } from './weapons/PlasmaRifle.js';
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
import { DamageNumbers } from './DamageNumbers.js';
import { UIManager } from './UIManager.js';
import { wireEditorUI } from './EditorUI.js';

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
// debt instantiated after enemyManager below

// Skill system (Phase 2)
const activeArchetypeId = savedArchetype || 'traceur';
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

// Wire all 25 skill execution callbacks (extracted to keep main.js under limit)
wireSkillCallbacks({
    skillSystem, staminaSystem, Hitbox, hitboxSystem,
    world, player, projectileManager, resourceSystem,
    particleEffects, legendaryPowerSystem, gamepad,
    scene, audio, spawnDamageNumber, activeArchetypeId,
    nephalemGlory, enemyHealthBars, characterSheet,
    postProcessing
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

// Enemy manager + new combat subsystems (instantiated after combatSystem exists)
const enemyManager = new EnemyManager(scene, world, player);
if (damageSystem) enemyManager.setDamageSystem(damageSystem);

// Weapon system: equip starter loadout
const weaponSystem = new WeaponSystem(player, scene, hitboxSystem, projectileManager);
const pipeWrench = new PipeWrench(scene, player);
const semiAutoPistol = new SemiAutoPistol(scene, player);
const assaultRifle = new AssaultRifle(scene, player);
const shotgun = new Shotgun(scene, player);
const stickyBomb = new StickyBomb(scene, player);

weaponSystem.equip(pipeWrench, WEAPON_SLOTS.MELEE);
weaponSystem.equip(semiAutoPistol, WEAPON_SLOTS.SIDEARM);
weaponSystem.equip(assaultRifle, WEAPON_SLOTS.PRIMARY);
weaponSystem.equip(shotgun, WEAPON_SLOTS.HEAVY);
weaponSystem.equip(stickyBomb, WEAPON_SLOTS.THROWABLE);
weaponSystem.switchSlot(WEAPON_SLOTS.MELEE);

// Magic weapons
const staffOfEmbers = new StaffOfEmbers(scene, player);
const voidWand = new VoidWand(scene, player);
const cryoGauntlet = new CryoGauntlet(scene, player);
weaponSystem.equip(staffOfEmbers, WEAPON_SLOTS.PRIMARY);
weaponSystem.equip(voidWand, WEAPON_SLOTS.SIDEARM);
weaponSystem.equip(cryoGauntlet, WEAPON_SLOTS.MELEE);

// Magic system
const magicSystem = new MagicSystem(player, resourceSystem, scene);
player.magicSystem = magicSystem;

// Accessory system
const accessorySystem = new AccessorySystem(player, characterSheet);

// Inventory system
const inventorySystem = new InventorySystem(player, 20);
// Starter consumables
inventorySystem.addItem('health_potion', 3);
inventorySystem.addItem('smoke_bomb', 2);

// Additional weapons (available for loot/shop, not all equipped)
const sniperRifle = new SniperRifle(scene, player);
const subMachineGun = new SubMachineGun(scene, player);
const rocketLauncher = new RocketLauncher(scene, player);
const flamethrower = new Flamethrower(scene, player);
const plasmaRifle = new PlasmaRifle(scene, player);
const energySword = new EnergySword(scene, player);
const crossbow = new Crossbow(scene, player);
const grenadeLauncher = new GrenadeLauncher(scene, player);
weaponSystem.equip(sniperRifle, WEAPON_SLOTS.PRIMARY); // overrides staff for default
weaponSystem.equip(energySword, WEAPON_SLOTS.MELEE);   // overrides cryo for default
weaponSystem.switchSlot(WEAPON_SLOTS.MELEE);

// Mini-bosses
const miniBosses = [];
const gatekeeper = new Gatekeeper(scene, world, player, new THREE.Vector3(15, 0, 15));
gatekeeper.start();
miniBosses.push(gatekeeper);

const riftStalker = new RiftStalker(scene, world, player, new THREE.Vector3(-15, 0, -15));
riftStalker.start();
miniBosses.push(riftStalker);

const forgeHound = new ForgeHound(scene, world, player, new THREE.Vector3(20, 0, -10));
forgeHound.start();
miniBosses.push(forgeHound);

const crystalGolem = new CrystalGolem(scene, world, player, new THREE.Vector3(-20, 0, 10));
crystalGolem.start();
miniBosses.push(crystalGolem);

// UIManager — centralized UI panel toggles, updates, and dynamic DOM creation
const uiManager = new UIManager({
    player, progression, archetype, origin, characterSheet,
    heartSystem, dungeonSystem, exoSuit, companion, loyalty,
    factions, safehouse, bounty, codex, mastery, implants,
    resourceSystem, dialogueSystem, shop, passiveTree, keyItems, risingTide
});
uiManager.createMiniBossBars(miniBosses);
uiManager.createManaBar();

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

// Arena mode
const arenaMode = new ArenaMode(scene, world, player, enemyManager, bossFight);

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

// Zipline gun gadget
const ziplineGun = new ZiplineGun(scene, player, world);

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
        
        // Panel toggles (delegated to UIManager)
        if (uiManager) uiManager.handleInput(activeInput);

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

        // Zipline Gun: Mouse2 aim + Mouse1 fire at enemy
        if (grapplingHook && grapplingHook.isAiming() && activeInput.wasPressed('Mouse1')) {
            ziplineGun.fire(player.facingDirection || new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing)));
        }

        // Grapple Pull: Q while grappling aims at enemy
        if (grapplingHook && grapplingHook.isAiming() && activeInput.wasPressed('KeyQ')) {
            const pulled = grapplingHook.pullEnemy();
            if (pulled && spawnDamageNumber) {
                const pPos = pulled.position || (pulled.mesh && pulled.mesh.position);
                if (pPos) spawnDamageNumber(pPos.clone().add(new THREE.Vector3(0, 1, 0)), 'YANKED', false, 'kinetic');
            }
        }

        // Decoy Afterimage: Shift+Q at max flow = hologram clone
        if (activeInput.wasPressed('KeyQ') && activeInput.isPressed('ShiftLeft') &&
            comboSystem && comboSystem.flowMeter >= 100) {
            comboSystem.flowMeter = 0;
            // Spawn decoy clone using existing decoy system
            if (skillSystem) skillSystem.useSkill('decoy');
            // Player becomes briefly invisible
            player.isInvisible = true;
            setTimeout(() => { player.isInvisible = false; }, 3000);
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
        
        // Boss fight + all panel updates (delegated to UIManager)
        if (uiManager) {
            uiManager.updateBossHUD(bossFight, challenges);
            uiManager.update(dt);
            uiManager.updateMiniBossBars(miniBosses);
        }

        // Damage numbers
        if (damageNumbers) damageNumbers.update(dt);

        // Inventory quick-use (keys 6-9)
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

animate();
