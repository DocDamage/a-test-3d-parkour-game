import * as THREE from 'three';

const SKYLINE_IDS = [
    'environment.skyline.tiny',
    'environment.skyline.small01',
    'environment.skyline.small02',
    'environment.skyline.small03',
    'environment.skyline.small04',
    'environment.skyline.tall01',
    'environment.skyline.tall02',
    'environment.skyline.tall03',
    'environment.skyline.large01'
];

const SKYLINE_PLACEMENTS = [
    [-42, -18, -36, 0.0, 1.2],
    [-30, -18, -44, 0.4, 1.0],
    [-16, -18, -48, -0.2, 1.15],
    [4, -18, -46, 0.1, 1.05],
    [22, -18, -40, -0.5, 1.25],
    [40, -18, -34, 0.3, 1.15],
    [-48, -18, 20, 0.9, 1.2],
    [46, -18, 24, -0.8, 1.25],
    [-34, -18, 42, 0.6, 1.1],
    [34, -18, 46, -0.6, 1.0]
];

const PROP_PLACEMENTS = [
    ['environment.bunker.wallContainerBlue', -7, 0.05, 8, 0.6, 1.0],
    ['environment.bunker.wallContainerBlue', 9, 0.05, -8, -0.4, 1.0],
    ['environment.bunker.chairRed', -3, 0.05, 5, 1.2, 0.9],
    ['environment.bunker.chairRed', 6, 0.05, 7, -1.0, 0.9],
    ['environment.kit.crate', -13, 0.05, 12, 0.4, 0.9],
    ['environment.kit.crateLarge', 14, 0.05, 10, -0.2, 0.85],
    ['environment.kit.barrelClosed', -16, 0.05, -5, 0.0, 0.9],
    ['environment.kit.locker', 15, 0.05, -12, Math.PI, 1.0],
    ['environment.megakit.computer', -5, 0.05, -13, 0.15, 1.0],
    ['environment.megakit.accessPoint', 4, 0.05, -14, -0.15, 1.0],
    ['environment.megakit.itemHolder', 12, 0.05, -3, 0.8, 1.0],
    ['environment.megakit.ventBig', -12, 1.1, -13, 0.0, 1.0],
    ['environment.megakit.doorDark', 0, 0.05, -19, 0.0, 1.2],
    ['environment.megakit.doorFrameSquare', 0, 0.05, -18.6, 0.0, 1.25],
    ['environment.megakit.doorMetal', 3, 0.05, -18.8, 0.05, 1.0],
    ['environment.megakit.platformMetal', -18, 0.08, 2, 0.2, 1.0],
    ['environment.megakit.platformSimple', 18, 0.08, -2, -0.2, 1.0],
    ['environment.megakit.platformRamp2', -18, 0.08, 7, -0.4, 1.0],
    ['environment.megakit.platformStairs4', 18, 0.08, 5, 0.3, 1.0],
    ['environment.megakit.platformRails4', -11, 0.08, -16, 0.0, 1.0],
    ['environment.megakit.wallAstraStraight', -20, 0.05, -20, Math.PI / 2, 1.0],
    ['environment.megakit.wallAstraWindow', 20, 0.05, -20, -Math.PI / 2, 1.0],
    ['environment.megakit.shortWallAccent', -20, 0.05, 18, Math.PI / 2, 1.0],
    ['environment.megakit.topCables', 0, 4.8, -20, 0.0, 1.0],
    ['environment.megakit.columnPipes', -18, 0.05, -18, 0.2, 1.0],
    ['environment.megakit.columnHollow', 18, 0.05, -18, -0.2, 1.0]
];

export class EnvironmentDressing {
    constructor(scene, assetManager, options = {}) {
        this.scene = scene;
        this.assetManager = assetManager;
        this.enabled = options.enabled !== false;
        this.objects = [];
        this._started = false;
    }

    async init() {
        if (!this.enabled || this._started || !this.assetManager) return;
        this._started = true;
        await this.assetManager.preloadModels([...SKYLINE_IDS, ...PROP_PLACEMENTS.map(p => p[0])]);
        this._placeSkyline();
        this._placeProps();
    }

    dispose() {
        for (const obj of this.objects) {
            this.scene.remove(obj);
        }
        this.objects.length = 0;
    }

    _placeSkyline() {
        for (let i = 0; i < SKYLINE_PLACEMENTS.length; i++) {
            const [x, y, z, yaw, scale] = SKYLINE_PLACEMENTS[i];
            const id = SKYLINE_IDS[i % SKYLINE_IDS.length];
            const model = this.assetManager.instantiateModel(id, {
                position: new THREE.Vector3(x, y, z),
                yaw,
                scale,
                castShadow: false,
                receiveShadow: false,
                materialTint: 0x9fb6d8,
                emissiveTint: 0x103060
            });
            if (!model) continue;
            model.name = `dressing-${id}`;
            this.scene.add(model);
            this.objects.push(model);
        }
    }

    _placeProps() {
        for (const [id, x, y, z, yaw, scale] of PROP_PLACEMENTS) {
            const model = this.assetManager.instantiateModel(id, {
                position: new THREE.Vector3(x, y, z),
                yaw,
                scale,
                castShadow: true,
                receiveShadow: false,
                materialTint: 0x7f8f9f,
                emissiveTint: 0x102030
            });
            if (!model) continue;
            model.name = `dressing-${id}`;
            this.scene.add(model);
            this.objects.push(model);
        }
    }
}
