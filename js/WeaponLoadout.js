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
import { AccessorySystem } from './AccessorySystem.js';
import { InventorySystem } from './InventorySystem.js';
import { Gatekeeper } from './minibosses/Gatekeeper.js';
import { RiftStalker } from './minibosses/RiftStalker.js';
import { ForgeHound } from './minibosses/ForgeHound.js';
import { CrystalGolem } from './minibosses/CrystalGolem.js';
import * as THREE from 'three';

export function setupWeaponLoadout(scene, world, player, weaponSystem, WEAPON_SLOTS, resourceSystem, characterSheet) {
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

    const staffOfEmbers = new StaffOfEmbers(scene, player);
    const voidWand = new VoidWand(scene, player);
    const cryoGauntlet = new CryoGauntlet(scene, player);
    weaponSystem.equip(staffOfEmbers, WEAPON_SLOTS.PRIMARY);
    weaponSystem.equip(voidWand, WEAPON_SLOTS.SIDEARM);
    weaponSystem.equip(cryoGauntlet, WEAPON_SLOTS.MELEE);

    const magicSystem = new MagicSystem(player, resourceSystem, scene);
    player.magicSystem = magicSystem;

    const accessorySystem = new AccessorySystem(player, characterSheet);

    const inventorySystem = new InventorySystem(player, 20);
    inventorySystem.addItem('health_potion', 3);
    inventorySystem.addItem('smoke_bomb', 2);

    const sniperRifle = new SniperRifle(scene, player);
    const subMachineGun = new SubMachineGun(scene, player);
    const rocketLauncher = new RocketLauncher(scene, player);
    const flamethrower = new Flamethrower(scene, player);
    const plasmaRifle = new PlasmaRifle(scene, player);
    const energySword = new EnergySword(scene, player);
    const crossbow = new Crossbow(scene, player);
    const grenadeLauncher = new GrenadeLauncher(scene, player);
    weaponSystem.equip(sniperRifle, WEAPON_SLOTS.PRIMARY);
    weaponSystem.equip(energySword, WEAPON_SLOTS.MELEE);
    weaponSystem.switchSlot(WEAPON_SLOTS.MELEE);

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

    return {
        pipeWrench, semiAutoPistol, assaultRifle, shotgun, stickyBomb,
        staffOfEmbers, voidWand, cryoGauntlet,
        sniperRifle, subMachineGun, rocketLauncher, flamethrower, plasmaRifle, energySword, crossbow, grenadeLauncher,
        magicSystem, accessorySystem, inventorySystem,
        miniBosses
    };
}
