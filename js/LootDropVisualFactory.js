import * as THREE from 'three';
import { getLootModelId, MANUFACTURER_VISUALS } from './VisualAssetRegistry.js';

const DEFAULT_COLOR = 0xaaaaaa;

export function createLootDropVisual(drop, options = {}) {
    const color = options.rarityColor ? options.rarityColor(drop.rarity, drop) : DEFAULT_COLOR;
    const manufacturer = drop.itemData?.manufacturer;
    const manufacturerVisual = MANUFACTURER_VISUALS[manufacturer] || null;
    const accent = manufacturerVisual?.color || color;
    const emissive = manufacturerVisual?.emissive || color;
    const modelId = getLootModelId(drop);
    const asset = options.assetManager?.instantiateModel(modelId, {
        materialTint: accent,
        emissiveTint: emissive,
        scale: drop.type === 'weapon' ? 0.9 : 1
    });

    const root = new THREE.Group();
    root.name = `loot-drop-${drop.type}`;
    const core = asset || createFallbackCore(drop, color, accent, emissive);
    root.add(core);
    root.add(createRarityBeam(color, drop));
    root.add(createPickupRing(color));

    if (drop.type === 'weapon' && manufacturerVisual) {
        root.add(createManufacturerPip(manufacturerVisual.accent, manufacturerVisual.color));
    }

    root.userData.assetReady = !!asset;
    root.userData.assetId = modelId;
    return root;
}

function createFallbackCore(drop, color, accent, emissive) {
    switch (drop.type) {
        case 'gear':
            return makeGearCore(color);
        case 'weapon':
            return makeWeaponCore(drop, color, accent, emissive);
        case 'gem':
            return makeGemCore(drop.gemId, color);
        case 'scrap':
            return makeScrapCore();
        case 'chips':
            return makeChipCore();
        case 'health_globe':
            return makeHealthCore();
        case 'consumable':
            return makeConsumableCore(drop.consumableType);
        default:
            return makeScrapCore();
    }
}

function makeGearCore(color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness: 0.28,
        metalness: 0.75
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.28), mat);
    const trim = new THREE.Mesh(
        new THREE.TorusGeometry(0.19, 0.012, 6, 24),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.4 })
    );
    trim.rotation.x = Math.PI / 2;
    group.add(box, trim);
    setShadows(group);
    return group;
}

function makeWeaponCore(drop, color, accent, emissive) {
    const group = new THREE.Group();
    const type = drop.itemData?.weaponType || 'SMG';
    const length = type === 'Sniper Rifle' ? 0.76 : type === 'Rocket Launcher' ? 0.62 : type === 'Energy Sword' ? 0.72 : 0.46;
    const height = type === 'Rocket Launcher' ? 0.18 : 0.12;
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, height, length),
        new THREE.MeshStandardMaterial({ color: accent, emissive, emissiveIntensity: 0.35, roughness: 0.32, metalness: 0.7 })
    );
    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, Math.max(0.18, length * 0.42), 10),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.85, roughness: 0.2 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = length * 0.58;
    group.add(body, barrel);

    if (type === 'Energy Sword') {
        body.scale.set(0.45, 0.5, 1.0);
        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.045, 0.012, 0.7),
            new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.8, transparent: true, opacity: 0.85 })
        );
        blade.position.z = 0.24;
        group.add(blade);
    } else if (type === 'Shotgun') {
        const secondBarrel = barrel.clone();
        secondBarrel.position.x = 0.05;
        barrel.position.x = -0.05;
        group.add(secondBarrel);
    } else if (type === 'Plasma Rifle') {
        const coil = new THREE.Mesh(
            new THREE.TorusGeometry(0.075, 0.012, 8, 20),
            new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.0 })
        );
        coil.rotation.y = Math.PI / 2;
        coil.position.z = 0.08;
        group.add(coil);
    }

    group.rotation.z = -0.12;
    setShadows(group);
    return group;
}

function makeGemCore(gemId, fallbackColor) {
    const colors = { ruby: 0xff3355, sapphire: 0x4488ff, emerald: 0x22dd77, diamond: 0xddddff, topaz: 0xffcc44 };
    const color = colors[gemId] || fallbackColor;
    const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.2, 0),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.25 })
    );
    mesh.castShadow = true;
    return mesh;
}

function makeScrapCore() {
    const group = new THREE.Group();
    for (let i = 0; i < 3; i++) {
        const shard = new THREE.Mesh(
            new THREE.TetrahedronGeometry(0.09 + i * 0.015, 0),
            new THREE.MeshStandardMaterial({ color: 0x8796a3, roughness: 0.55, metalness: 0.85 })
        );
        shard.position.set((i - 1) * 0.09, i * 0.025, (i % 2) * 0.07);
        shard.rotation.set(i * 0.7, i * 0.3, i * 0.5);
        group.add(shard);
    }
    setShadows(group);
    return group;
}

function makeChipCore() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
        color: 0x00ffaa,
        emissive: 0x00ffaa,
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.55,
        transparent: true,
        opacity: 0.92
    });
    for (let i = 0; i < 3; i++) {
        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.14), mat);
        chip.position.y = i * 0.035;
        chip.rotation.y = i * 0.35;
        group.add(chip);
    }
    setShadows(group);
    return group;
}

function makeHealthCore() {
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 18, 18),
        new THREE.MeshStandardMaterial({
            color: 0xff2222,
            emissive: 0xff0000,
            emissiveIntensity: 0.9,
            roughness: 0.08,
            metalness: 0.1,
            transparent: true,
            opacity: 0.85
        })
    );
    mesh.castShadow = true;
    return mesh;
}

function makeConsumableCore(subType) {
    const color = subType === 'grenade' ? 0xff6600 : subType === 'mine' ? 0xccff00 : 0x00ccff;
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.22, 10),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.35, metalness: 0.6 })
    );
    mesh.castShadow = true;
    return mesh;
}

function createRarityBeam(color, drop) {
    const height = drop.rarity >= 4 || drop.itemData?.weaponRarity === 'legendary' ? 1.45 : 0.85;
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.18, height, 18, 1, true),
        new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        })
    );
    mesh.position.y = height * 0.5;
    return mesh;
}

function createPickupRing(color) {
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.012, 6, 32),
        new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.16;
    return ring;
}

function createManufacturerPip(accent, color) {
    const pip = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 10, 10),
        new THREE.MeshStandardMaterial({ color: accent, emissive: color, emissiveIntensity: 0.9, roughness: 0.18, metalness: 0.4 })
    );
    pip.position.set(0.22, 0.17, -0.18);
    return pip;
}

function setShadows(root) {
    root.traverse(obj => {
        if (obj.isMesh) obj.castShadow = true;
    });
}

