import * as THREE from 'three';
import { RARITY } from './AffixSystem.js';
import { SLOTS, PRE_DEFINED_ITEMS } from './ExoSuitSystem.js';
import { rollEndgameRarity } from './BalanceModel.js';
import { ProceduralWeaponSystem } from './ProceduralWeaponSystem.js';
import { createLootDropVisual } from './LootDropVisualFactory.js';
import { disposeObject3D } from './AssetManager.js';

/** @typedef {'gear'|'weapon'|'gem'|'scrap'|'chips'|'health_globe'|'consumable'} DropType */

/**
 * LootSystem handles item drops from dead enemies, spawning 3D meshes,
 * and auto-pickup logic (notably health globes).
 */
export class LootSystem {
    /**
     * @param {THREE.Scene} scene
     * @param {Object} player — must expose position (Vector3), health, maxHealth, takeDamage()
     * @param {Object} exoSuitSystem
     * @param {Object} affixSystem — must expose generateItem(template)
     */
    constructor(scene, player, exoSuitSystem, affixSystem) {
        this.scene = scene;
        this.player = player;
        this.exoSuit = exoSuitSystem;
        this.affixSystem = affixSystem;

        /** @type {Map<string, Object>} */
        this.drops = new Map();

        this._nextId = 1;
        this._tempVec = new THREE.Vector3();
        this._inventorySystem = null; // set via setInventorySystem()
        this._inventoryStash = null;
        this._gemSystem = null;
        this._proceduralWeapons = new ProceduralWeaponSystem({ defaultLevel: 10 });
        this._assetManager = null;
    }

    /** Wire in the InventorySystem after construction. */
    setInventorySystem(inv) {
        this._inventorySystem = inv;
    }

    setInventoryStash(stash) {
        this._inventoryStash = stash;
    }

    setGemSystem(gemSystem) {
        this._gemSystem = gemSystem;
    }

    setProceduralWeaponSystem(system) {
        this._proceduralWeapons = system || this._proceduralWeapons;
    }

    setAssetManager(assetManager) {
        this._assetManager = assetManager || null;
    }

    /**
     * Roll loot for a slain enemy.
     *
     * @param {string} enemyType — e.g. 'drone', 'elite', 'boss'
     * @param {boolean} isElite
     * @param {number} [difficultyMultiplier=1.0]
     * @returns {Object|null} drop descriptor
     */
    generateDrop(enemyType, isElite, difficultyMultiplier = 1.0, playerArchetype = null, opts = {}) {
        const roll = Math.random();
        const riftLevel = opts.riftLevel || 1;
        const magicFind = (this.player && this.player.getRPGStats)
            ? (this.player.getRPGStats().magicFind || 0)
            : 0;
        const mfRoll = roll * (1 - Math.min(0.5, magicFind)); // MF shifts roll toward better loot

        if (enemyType === 'boss' || enemyType === 'guardian') {
            return this._generateBossDrop(difficultyMultiplier, playerArchetype, riftLevel);
        }

        if (isElite) {
            // Elite: 15% nothing, 25% scrap, 15% chips, 35% gear, 8% legendary, 2% set
            if (mfRoll < 0.15) return null;
            if (mfRoll < 0.40) return this._makeScrap(3 + Math.floor(Math.random() * 3), difficultyMultiplier);
            if (mfRoll < 0.55) return this._makeChips(2 + Math.floor(Math.random() * 3), difficultyMultiplier);
            if (mfRoll < 0.63) return this._makeGem();
            if (mfRoll < 0.90) return this._makeEquipmentDrop(this._rollRarity(0.55, true, riftLevel), difficultyMultiplier, playerArchetype, opts, 0.35);
            if (mfRoll < 0.98) return this._makeEquipmentDrop(RARITY.LEGENDARY, difficultyMultiplier, playerArchetype, opts, 0.45);
            return this._makeGear(RARITY.SET, difficultyMultiplier, playerArchetype);
        }

        // Common enemy: 55% nothing, 28% scrap, 10% chips, 5% gear, 1.8% magic, 0.2% rare+
        if (mfRoll < 0.55) return null;
        if (mfRoll < 0.83) return this._makeScrap(1 + Math.floor(Math.random() * 2), difficultyMultiplier);
        if (mfRoll < 0.93) return this._makeChips(1, difficultyMultiplier);
        if (mfRoll < 0.95) return this._makeGem();
        if (mfRoll < 0.98) return this._makeEquipmentDrop(RARITY.COMMON, difficultyMultiplier, playerArchetype, opts, 0.25);
        if (mfRoll < 0.998) return this._makeEquipmentDrop(RARITY.MAGIC, difficultyMultiplier, playerArchetype, opts, 0.30);
        return this._makeEquipmentDrop(this._rollRarity(0.30, true, riftLevel), difficultyMultiplier, playerArchetype, opts, 0.35);
    }

    /**
     * Spawn a drop mesh in the world.
     * @param {Object} drop — object returned from generateDrop
     * @param {THREE.Vector3} position
     * @returns {string} dropId
     */
    spawnDrop(drop, position) {
        if (!drop) return null;

        const id = `drop_${this._nextId++}`;
        const mesh = this._createMeshForDrop(drop);
        mesh.position.copy(position);
        mesh.position.y = Math.max(0.3, position.y);
        this.scene.add(mesh);

        this.drops.set(id, {
            ...drop,
            id,
            mesh,
            spawnTime: performance.now() * 0.001,
            bobOffset: Math.random() * Math.PI * 2
        });

        return id;
    }

    /**
     * Called when player walks over / triggers a drop.
     * @param {string} dropId
     * @returns {boolean} true if drop existed and was consumed
     */
    pickupDrop(dropId) {
        const drop = this.drops.get(dropId);
        if (!drop) return false;

        switch (drop.type) {
            case 'gear':
                this._pickupGear(drop);
                break;
            case 'weapon':
                this._pickupWeapon(drop);
                break;
            case 'gem':
                this._pickupGem(drop);
                break;
            case 'scrap':
                this._pickupScrap(drop);
                break;
            case 'chips':
                this._pickupChips(drop);
                break;
            case 'health_globe':
                this._pickupHealthGlobe();
                break;
            case 'consumable':
                this._pickupConsumable(drop);
                break;
        }

        this._playPickupCue(drop);
        this._removeDrop(dropId);
        return true;
    }

    /**
     * Animate drops and process auto-pickups (health globes).
     * @param {number} dt
     * @param {THREE.Vector3} playerPosition
     */
    update(dt, playerPosition) {
        const now = performance.now() * 0.001;

        for (const [id, drop] of this.drops) {
            if (!drop.mesh) continue;

            // Idle animation: bob + spin
            const bob = Math.sin(now * 2 + drop.bobOffset) * 0.15;
            drop.mesh.position.y += bob * dt * 0.5;
            drop.mesh.rotation.y += dt * 1.5;

            // Read legendary loot beacon radius bonus
            const pickupBonus = (this.player && this.player._lootPickupRadius) ? this.player._lootPickupRadius : 0;

            // Health globe auto-pickup within 1 metre (+ bonus)
            if (drop.type === 'health_globe') {
                const dist = drop.mesh.position.distanceTo(playerPosition);
                if (dist <= (1.0 + pickupBonus)) {
                    this.pickupDrop(id);
                    continue;
                }
            }

            // Generic proximity pickup for scrap / chips / gear / weapons / consumables (generous 1.5 m + bonus)
            if (drop.type === 'scrap' || drop.type === 'chips' || drop.type === 'gear' || drop.type === 'weapon' || drop.type === 'gem' || drop.type === 'consumable') {
                const dist = drop.mesh.position.distanceTo(playerPosition);
                if (dist <= (1.5 + pickupBonus)) {
                    this.pickupDrop(id);
                }
            }
        }
    }

    /** Remove all drop meshes (arena reset / cleanup). */
    dispose() {
        for (const [id, drop] of this.drops) {
            if (drop.mesh) {
                this.scene.remove(drop.mesh);
                disposeObject3D(drop.mesh);
            }
        }
        this.drops.clear();
    }

    /* -------------------------------------------------------------------- */
    /*  Internal generators                                                 */
    /* -------------------------------------------------------------------- */

    _generateBossDrop(difficultyMultiplier, playerArchetype = null, riftLevel = 1) {
        const pick = Math.random();
        if (pick < 0.30) return this._makeEquipmentDrop(this._rollRarity(0.20, true, riftLevel), difficultyMultiplier, playerArchetype, { riftLevel }, 0.35);
        if (pick < 0.60) return this._makeEquipmentDrop(this._rollRarity(0.40, true, riftLevel), difficultyMultiplier, playerArchetype, { riftLevel }, 0.40);
        if (pick < 0.85) return this._makeEquipmentDrop(RARITY.LEGENDARY, difficultyMultiplier, playerArchetype, { riftLevel }, 0.50);
        if (pick < 0.95) return this._makeGear(RARITY.SET, difficultyMultiplier, playerArchetype);
        if (pick < 0.98) return this._makeGem();
        return this._makeChips(3 + Math.floor(Math.random() * 4), difficultyMultiplier);
    }

    _makeEquipmentDrop(rarity, difficultyMultiplier, playerArchetype, opts = {}, weaponChance = 0.30) {
        if (this._proceduralWeapons && Math.random() < weaponChance) {
            return this._makeWeapon(opts.playerLevel || 10, opts);
        }
        return this._makeGear(rarity, difficultyMultiplier, playerArchetype);
    }

    _makeWeapon(level = 10, opts = {}) {
        const itemData = this._proceduralWeapons.generateWeapon({
            level,
            seed: opts.seed || undefined,
            weaponType: opts.weaponType || undefined
        });
        return {
            type: 'weapon',
            rarity: itemData.compatRarity,
            itemData,
            slot: itemData.slot,
            unidentified: false,
            identified: true
        };
    }

    _makeGem() {
        const ids = ['ruby', 'sapphire', 'emerald', 'diamond', 'topaz'];
        return { type: 'gem', rarity: RARITY.RARE, gemId: ids[Math.floor(Math.random() * ids.length)], quantity: 1 };
    }

    _makeScrap(quantity, difficultyMultiplier) {
        return {
            type: 'scrap',
            rarity: RARITY.COMMON,
            quantity: Math.floor(quantity * difficultyMultiplier)
        };
    }

    _makeChips(quantity, difficultyMultiplier) {
        return {
            type: 'chips',
            rarity: RARITY.COMMON,
            quantity: Math.floor(quantity * difficultyMultiplier)
        };
    }

    _makeGear(rarity, difficultyMultiplier, playerArchetype = null) {
        const slotKeys = Object.values(SLOTS);
        const slot = slotKeys[Math.floor(Math.random() * slotKeys.length)];

        // Smart drop: if archetype is known, weight toward slot that archetype benefits from
        let smartSlot = slot;
        if (playerArchetype) {
            const archetypeSlots = {
                traceur: 'boots',
                operative: 'optics',
                saboteur: 'gloves',
                specimen: 'frame',
                netrunner: 'optics'
            };
            if (Math.random() < 0.35 && archetypeSlots[playerArchetype]) {
                smartSlot = archetypeSlots[playerArchetype];
            }
        }

        let template = null;
        if (this.exoSuit && typeof this.exoSuit.getItemTemplate === 'function') {
            const all = PRE_DEFINED_ITEMS || [];
            const candidates = all.filter(i => i.slot === smartSlot);
            template = candidates.length > 0
                ? candidates[Math.floor(Math.random() * candidates.length)]
                : all[Math.floor(Math.random() * all.length)];
        }

        if (!template) {
            template = {
                id: 'random_gear',
                name: 'Scavenged Part',
                rarity,
                slot: smartSlot,
                baseStats: {},
                affixes: []
            };
        } else {
            template = { ...template, rarity, slot: smartSlot };
        }

        let itemData = template;
        if (this.affixSystem && typeof this.affixSystem.generateItem === 'function') {
            itemData = this.affixSystem.generateItem(template);
        }

        // Legendary and Set items drop unidentified
        const isUnidentified = (rarity === RARITY.LEGENDARY || rarity === RARITY.SET || rarity === RARITY.ANCIENT || rarity === RARITY.PRIMAL);
        itemData = {
            ...itemData,
            unidentified: isUnidentified,
            identified: !isUnidentified,
            sockets: itemData.sockets ?? (rarity >= RARITY.ANCIENT ? 3 : rarity >= RARITY.LEGENDARY ? 2 : rarity >= RARITY.MAGIC ? 1 : 0)
        };
        if (isUnidentified && itemData.name && !itemData.name.startsWith('Unidentified ')) {
            itemData.name = `Unidentified ${itemData.slot || 'Gear'}`;
        }

        return {
            type: 'gear',
            rarity,
            itemData,
            slot: smartSlot,
            unidentified: isUnidentified,
            identified: !isUnidentified
        };
    }

    _makeHealthGlobe() {
        return {
            type: 'health_globe',
            rarity: RARITY.COMMON
        };
    }

    _makeConsumable() {
        const types = ['grenade', 'mine', 'scanner'];
        return {
            type: 'consumable',
            rarity: RARITY.COMMON,
            consumableType: types[Math.floor(Math.random() * types.length)],
            quantity: 1
        };
    }

    _rollRarity(commonThreshold, allowSet = false, riftLevel = 1) {
        return rollEndgameRarity(commonThreshold, allowSet, riftLevel);
    }

    /* -------------------------------------------------------------------- */
    /*  Mesh factory                                                        */
    /* -------------------------------------------------------------------- */

    _createMeshForDrop(drop) {
        return createLootDropVisual(drop, {
            assetManager: this._assetManager,
            rarityColor: rarity => this._rarityColor(rarity)
        });
    }

    _createGearMesh(rarity) {
        const geo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
        const color = this._rarityColor(rarity);
        const mat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.4,
            roughness: 0.3,
            metalness: 0.7
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        return mesh;
    }

    _createWeaponMesh(rarity) {
        const color = this._rarityColor(rarity);
        const group = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.12, 0.42),
            new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.35, metalness: 0.65 })
        );
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 0.26, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.25 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.32;
        group.add(body, barrel);
        group.castShadow = true;
        return group;
    }

    _createScrapMesh() {
        const geo = new THREE.TetrahedronGeometry(0.12, 0);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x8899aa,
            roughness: 0.6,
            metalness: 0.8
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        return mesh;
    }

    _createChipsMesh() {
        const geo = new THREE.OctahedronGeometry(0.15, 0);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x00ffaa,
            emissive: 0x00ffaa,
            emissiveIntensity: 0.6,
            roughness: 0.2,
            metalness: 0.5,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        return mesh;
    }

    _createGemMesh(gemId) {
        const colors = { ruby: 0xff3355, sapphire: 0x4488ff, emerald: 0x22dd77, diamond: 0xddddff, topaz: 0xffcc44 };
        const color = colors[gemId] || 0xffffff;
        const mesh = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.18, 0),
            new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, roughness: 0.15, metalness: 0.2 })
        );
        mesh.castShadow = true;
        return mesh;
    }

    _createHealthGlobeMesh() {
        const geo = new THREE.SphereGeometry(0.2, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xff2222,
            emissive: 0xff0000,
            emissiveIntensity: 0.8,
            roughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: 0.85
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        return mesh;
    }

    _createConsumableMesh(subType) {
        const color = subType === 'grenade' ? 0xff6600 : subType === 'mine' ? 0xccff00 : 0x00ccff;
        const geo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
        const mat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.3,
            roughness: 0.4,
            metalness: 0.5
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        return mesh;
    }

    _rarityColor(rarity) {
        switch (rarity) {
            case RARITY.COMMON:    return 0xaaaaaa; // grey
            case RARITY.MAGIC:     return 0x4488ff; // blue
            case RARITY.RARE:      return 0xffcc00; // yellow
            case RARITY.LEGENDARY: return 0xff8800; // orange
            case RARITY.SET:       return 0x00ff44; // green
            case RARITY.ANCIENT:   return 0xff4444; // red
            case RARITY.PRIMAL:    return 0xff00ff; // magenta
            default:               return 0xaaaaaa;
        }
    }

    /* -------------------------------------------------------------------- */
    /*  Pickup handlers                                                     */
    /* -------------------------------------------------------------------- */

    _pickupGear(drop) {
        if (!this.exoSuit || !drop.itemData) return;
        const item = {
            ...drop.itemData,
            unidentified: drop.unidentified,
            identified: drop.identified,
            sockets: drop.itemData.sockets ?? (drop.rarity >= RARITY.ANCIENT ? 3 : drop.rarity >= RARITY.LEGENDARY ? 2 : drop.rarity >= RARITY.MAGIC ? 1 : 0)
        };
        if (item.unidentified && !item.identified && !item.name.startsWith('Unidentified ')) {
            item.name = `Unidentified ${item.slot || 'Gear'}`;
        }

        if (this._inventoryStash && this._inventoryStash.acquireItem(item)) return;
        if (!item.unidentified || item.identified) {
            this.exoSuit.equip(item);
        }
    }

    _pickupWeapon(drop) {
        if (!drop.itemData) return;
        if (this._inventoryStash && this._inventoryStash.acquireItem(drop.itemData)) return;
    }

    _pickupScrap(drop) {
        if (this._inventorySystem) this._inventorySystem.addItem('scrap_metal', drop.quantity || 1);
        if (this.player) this.player._scrap = (this.player._scrap || 0) + (drop.quantity || 1);
    }

    _pickupChips(drop) {
        if (this._inventorySystem) this._inventorySystem.addItem('data_chip', drop.quantity || 1);
        if (this.player) this.player._chips = (this.player._chips || 0) + (drop.quantity || 1);
    }

    _pickupGem(drop) {
        if (this._gemSystem) this._gemSystem.addGem(drop.gemId, drop.quantity || 1);
    }

    _pickupHealthGlobe() {
        if (!this.player) return;
        const max = this.player.maxHealth || 100;
        const heal = max * 0.20;
        // takeDamage with negative amount = heal
        if (typeof this.player.takeDamage === 'function') {
            this.player.takeDamage(-heal);
        } else {
            this.player.health = Math.min(max, (this.player.health || 0) + heal);
        }
    }

    _pickupConsumable(drop) {
        if (!this._inventorySystem) return;
        // Map consumableType to the InventorySystem item id
        const typeMap = {
            grenade:  'smoke_bomb',
            mine:     'smoke_bomb',
            scanner:  'health_potion',
        };
        const itemId = (drop.consumableType && typeMap[drop.consumableType]) || 'health_potion';
        this._inventorySystem.addItem(itemId, drop.quantity || 1);
    }

    _playPickupCue(drop) {
        const audio = window.audioManager;
        if (!audio || typeof audio.playSFX !== 'function') return;
        const isRareLoot = drop.rarity >= RARITY.LEGENDARY || drop.type === 'weapon';
        audio.playSFX(isRareLoot ? 'loot_rare' : 'loot_pickup', drop.mesh ? drop.mesh.position : null);
    }

    _removeDrop(id) {
        const drop = this.drops.get(id);
        if (!drop) return;
        if (drop.mesh) {
            this.scene.remove(drop.mesh);
            disposeObject3D(drop.mesh);
        }
        this.drops.delete(id);
    }
}
