// Curated real-asset choices for the in-game level editor. These stay as plain
// metadata so exported levels only need type + props, not runtime object refs.
export const DEFAULT_EDITOR_ASSET_ID = 'environment.kit.crate';

export const EDITOR_ASSET_OPTIONS = Object.freeze([
    { id: 'environment.kit.crate', label: 'Crate', category: 'Props', width: 1.2, height: 1.2, depth: 1.2, collidable: true },
    { id: 'environment.kit.crateLarge', label: 'Large Crate', category: 'Props', width: 1.8, height: 1.5, depth: 1.8, collidable: true },
    { id: 'environment.kit.barrelClosed', label: 'Barrel', category: 'Props', width: 1.0, height: 1.5, depth: 1.0, collidable: true },
    { id: 'environment.kit.locker', label: 'Locker', category: 'Props', width: 1.1, height: 2.4, depth: 0.8, collidable: true, climbable: true },
    { id: 'environment.megakit.computer', label: 'Computer', category: 'Props', width: 1.6, height: 1.4, depth: 1.0, collidable: true },
    { id: 'environment.megakit.accessPoint', label: 'Access Point', category: 'Props', width: 1.0, height: 1.8, depth: 0.6, collidable: true },
    { id: 'environment.megakit.itemHolder', label: 'Item Holder', category: 'Props', width: 1.0, height: 1.3, depth: 1.0, collidable: true },
    { id: 'environment.megakit.ventBig', label: 'Big Vent', category: 'Props', width: 2.0, height: 1.0, depth: 0.5, collidable: true, climbable: true },
    { id: 'environment.megakit.doorDark', label: 'Dark Door', category: 'Structures', width: 2.0, height: 3.0, depth: 0.3, collidable: true },
    { id: 'environment.megakit.doorFrameSquare', label: 'Door Frame', category: 'Structures', width: 2.4, height: 3.2, depth: 0.5, collidable: false },
    { id: 'environment.megakit.doorMetal', label: 'Metal Door', category: 'Structures', width: 2.0, height: 3.0, depth: 0.3, collidable: true },
    { id: 'environment.megakit.platformMetal', label: 'Metal Platform', category: 'Structures', width: 4.0, height: 0.4, depth: 4.0, collidable: true },
    { id: 'environment.megakit.platformSimple', label: 'Simple Platform', category: 'Structures', width: 4.0, height: 0.4, depth: 4.0, collidable: true },
    { id: 'environment.megakit.platformRamp2', label: 'Sci-Fi Ramp', category: 'Structures', width: 3.0, height: 1.4, depth: 5.0, collidable: true },
    { id: 'environment.megakit.platformStairs4', label: 'Stairs', category: 'Structures', width: 3.0, height: 1.8, depth: 4.0, collidable: true },
    { id: 'environment.megakit.platformRails4', label: 'Rails', category: 'Structures', width: 4.0, height: 1.3, depth: 4.0, collidable: true },
    { id: 'environment.megakit.wallAstraStraight', label: 'Wall Panel', category: 'Structures', width: 4.0, height: 3.0, depth: 0.4, collidable: true, climbable: true },
    { id: 'environment.megakit.wallAstraWindow', label: 'Window Wall', category: 'Structures', width: 4.0, height: 3.0, depth: 0.4, collidable: true, climbable: true },
    { id: 'environment.megakit.shortWallAccent', label: 'Short Wall', category: 'Structures', width: 3.0, height: 1.2, depth: 0.4, collidable: true },
    { id: 'environment.megakit.topCables', label: 'Ceiling Cables', category: 'Structures', width: 4.0, height: 0.7, depth: 2.0, collidable: false },
    { id: 'environment.megakit.columnPipes', label: 'Pipe Column', category: 'Structures', width: 1.0, height: 3.5, depth: 1.0, collidable: true, climbable: true },
    { id: 'environment.megakit.columnHollow', label: 'Hollow Column', category: 'Structures', width: 1.2, height: 3.5, depth: 1.2, collidable: true, climbable: true },
    { id: 'environment.industrial.gratedPowerFloor', label: 'Grated Power Floor', category: 'Industrial', width: 4.0, height: 0.25, depth: 4.0, collidable: true },
    { id: 'environment.industrial.markedMetalWalkway', label: 'Marked Walkway', category: 'Industrial', width: 4.0, height: 0.25, depth: 4.0, collidable: true },
    { id: 'environment.industrial.markedWalkwayJunction', label: 'Walkway Junction', category: 'Industrial', width: 4.0, height: 0.25, depth: 4.0, collidable: true },
    { id: 'environment.industrial.plateSteelFloor', label: 'Steel Floor', category: 'Industrial', width: 4.0, height: 0.25, depth: 4.0, collidable: true },
    { id: 'environment.industrial.patternedMetalFloor', label: 'Pattern Floor', category: 'Industrial', width: 4.0, height: 0.25, depth: 4.0, collidable: true },
    { id: 'environment.industrial.concreteBlockWall', label: 'Concrete Block Wall', category: 'Industrial', width: 4.0, height: 3.0, depth: 0.4, collidable: true, climbable: true },
    { id: 'environment.industrial.reinforcedMetalWall', label: 'Reinforced Wall', category: 'Industrial', width: 4.0, height: 3.0, depth: 0.4, collidable: true, climbable: true },
    { id: 'environment.industrial.reinforcedMetalWall2', label: 'Reinforced Wall 2', category: 'Industrial', width: 4.0, height: 3.0, depth: 0.4, collidable: true, climbable: true },
    { id: 'environment.industrial.groovedMetalWall', label: 'Grooved Wall', category: 'Industrial', width: 4.0, height: 3.0, depth: 0.4, collidable: true, climbable: true },
    { id: 'environment.industrial.powerLineWall', label: 'Power Line Wall', category: 'Industrial', width: 4.0, height: 3.0, depth: 0.4, collidable: true, climbable: true },
    { id: 'environment.industrial.cablePanel', label: 'Cable Panel', category: 'Industrial', width: 4.0, height: 3.0, depth: 0.4, collidable: true, climbable: true },
    { id: 'environment.industrial.ridgedLightPanel', label: 'Ridged Light Panel', category: 'Industrial', width: 4.0, height: 3.0, depth: 0.35, collidable: true, climbable: true },
    { id: 'environment.industrial.rivetedElectricityPanel', label: 'Electric Panel', category: 'Industrial', width: 4.0, height: 3.0, depth: 0.35, collidable: true, climbable: true },
    { id: 'environment.industrial.metalVent', label: 'Industrial Vent', category: 'Industrial', width: 1.8, height: 1.0, depth: 0.35, collidable: true, climbable: true },
    { id: 'environment.industrial.wallCameraHal', label: 'Wall Camera', category: 'Industrial', width: 0.8, height: 0.8, depth: 0.8, collidable: false },
    { id: 'environment.corridor.kitjam202108', label: 'Corridor Kit Scene', category: 'Industrial', width: 8.0, height: 4.0, depth: 8.0, collidable: false },
    { id: 'loot.gear.sciFiChest', label: 'Loot Chest', category: 'Loot', width: 1.6, height: 1.0, depth: 1.0, collidable: true },
    { id: 'loot.health.pack', label: 'Health Pack', category: 'Loot', width: 0.8, height: 0.4, depth: 0.8, collidable: false },
    { id: 'loot.ammo.small', label: 'Ammo Small', category: 'Loot', width: 0.8, height: 0.4, depth: 0.8, collidable: false },
    { id: 'loot.keycard', label: 'Keycard', category: 'Loot', width: 0.6, height: 0.1, depth: 0.4, collidable: false },
    { id: 'enemy.essentials.eyeDrone', label: 'Eye Drone Model', category: 'Enemies', width: 1.3, height: 1.3, depth: 1.3, collidable: false },
    { id: 'enemy.essentials.quadShell', label: 'Quad Shell Model', category: 'Enemies', width: 1.6, height: 1.0, depth: 1.8, collidable: false },
    { id: 'enemy.megakit.alienCyclop', label: 'Alien Model', category: 'Enemies', width: 1.2, height: 2.2, depth: 1.2, collidable: false },
    { id: 'enemy.sentry.turretPlasma', label: 'Turret Model', category: 'Enemies', width: 1.4, height: 1.4, depth: 1.4, collidable: false }
]);

export function getEditorAssetOption(id) {
    return EDITOR_ASSET_OPTIONS.find(option => option.id === id) || EDITOR_ASSET_OPTIONS[0];
}

export function getEditorAssetPlacementProps(id) {
    const option = getEditorAssetOption(id);
    return {
        assetId: option.id,
        width: option.width,
        height: option.height,
        depth: option.depth,
        collidable: !!option.collidable,
        climbable: !!option.climbable
    };
}
