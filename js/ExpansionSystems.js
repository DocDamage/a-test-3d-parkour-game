/**
 * ExpansionSystems — factory for all new expansion modules.
 * Extracted from main.js to keep the composition root under the file size limit.
 */

import { WallKickSystem } from './WallKickSystem.js';
import { SlideJumpSystem } from './SlideJumpSystem.js';
import { MantleSystem } from './MantleSystem.js';
import { SlopeGrindSystem } from './SlopeGrindSystem.js';
import { WeaponComboSystem } from './WeaponComboSystem.js';
import { AerialJuggleSystem } from './AerialJuggleSystem.js';
import { EnvironmentalFinisher } from './EnvironmentalFinisher.js';
import { StatusComboSystem } from './StatusComboSystem.js';
import { EliteModifierSystem } from './EliteModifierSystem.js';
import { WanderingVendor } from './WanderingVendor.js';
import { DailyQuestSystem } from './DailyQuestSystem.js';
import { GraffitiCollectible } from './GraffitiCollectible.js';
import { CraftingBench } from './CraftingBench.js';
import { SetBonusSystem } from './SetBonusSystem.js';
import { TransmogSystem } from './TransmogSystem.js';
import { PrestigeSystem } from './PrestigeSystem.js';
import { TrainingDummy } from './TrainingDummy.js';
import { DeathRecap } from './DeathRecap.js';
import { RunHistory } from './RunHistory.js';
import { SaveSlots } from './SaveSlots.js';
import { AutoWalk } from './AutoWalk.js';
import { LootVacuum } from './LootVacuum.js';
import { FastTravel } from './FastTravel.js';
import { CloudSaveExport } from './CloudSaveExport.js';
import { ModdingAPI } from './ModdingAPI.js';
import { TrickSystem } from './TrickSystem.js';
import { FatalitySystem } from './FatalitySystem.js';
import { GraffitiSpraySystem } from './GraffitiSpraySystem.js';
import { ParkourCallbackWiring } from './ParkourCallbackWiring.js';
import * as THREE from 'three';

export function initExpansionSystems(ctx, deps) {
    const { player, staminaSystem, combatSystem, weaponSystem, statusEffectSystem,
            world, scene, exoSuit, affixSystem, lootSystem, saveSystem,
            particleEffects, overclock } = deps;

    // Parkour
    const wallKickSystem = new WallKickSystem(player, staminaSystem);
    const slideJumpSystem = new SlideJumpSystem(player);
    const mantleSystem = new MantleSystem(player);
    const slopeGrindSystem = new SlopeGrindSystem(player, particleEffects);
    const autoWalk = new AutoWalk();

    // Combat
    const weaponComboSystem = new WeaponComboSystem(player, combatSystem, weaponSystem);
    const aerialJuggleSystem = new AerialJuggleSystem(player, combatSystem);
    const environmentalFinisher = new EnvironmentalFinisher(player, world);
    const statusComboSystem = new StatusComboSystem(statusEffectSystem);

    // Enemies
    const eliteModifierSystem = new EliteModifierSystem(scene);

    // World
    const wanderingVendor = new WanderingVendor(scene, world, player);
    const dailyQuestSystem = new DailyQuestSystem(player);
    const graffitiCollectible = new GraffitiCollectible(scene, player, world, particleEffects, exoSuit);
    const fastTravel = new FastTravel(scene, player);
    const graffitiSpraySystem = new GraffitiSpraySystem(scene, player, world, null); // territorySystem optional

    // RPG
    const craftingBench = new CraftingBench(affixSystem, exoSuit);
    const setBonusSystem = new SetBonusSystem(player);
    const transmogSystem = new TransmogSystem(exoSuit);
    const prestigeSystem = new PrestigeSystem(player);

    // Polish
    const saveSlots = new SaveSlots();
    const cloudSaveExport = new CloudSaveExport(saveSystem);
    const deathRecap = new DeathRecap();
    const runHistory = new RunHistory();
    const lootVacuum = new LootVacuum(player, lootSystem);
    const trainingDummy = new TrainingDummy(scene, new THREE.Vector3(-5, 1, -5));

    // Trick / Fatality / Callbacks
    const trickSystem = new TrickSystem();
    const fatalitySystem = new FatalitySystem(scene, player, particleEffects);
    const parkourCallbackWiring = new ParkourCallbackWiring(player, null, null, particleEffects, trickSystem);

    // Modding
    const moddingAPI = new ModdingAPI(ctx);

    return {
        wallKickSystem, slideJumpSystem, mantleSystem, slopeGrindSystem, autoWalk,
        weaponComboSystem, aerialJuggleSystem, environmentalFinisher, statusComboSystem,
        eliteModifierSystem,
        wanderingVendor, dailyQuestSystem, graffitiCollectible, fastTravel,
        craftingBench, setBonusSystem, transmogSystem, prestigeSystem,
        saveSlots, cloudSaveExport, deathRecap, runHistory, lootVacuum, trainingDummy,
        trickSystem, fatalitySystem, graffitiSpraySystem, parkourCallbackWiring,
        moddingAPI,
    };
}
