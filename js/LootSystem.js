import * as THREE from 'three';
import { RARITY } from './AffixSystem.js';
import { SLOTS, PRE_DEFINED_ITEMS } from './ExoSuitSystem.js';

/** @typedef {'gear'|'scrap'|'chips'|'health_globe'|'consumable'} DropType */

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
    }

    /**
     * Roll loot for a slain enemy.
     *
     * @param {string} enemyType — e.g. 'drone', 'elite', 'boss'
     * @param {boolean} isElite
     * @param {number} [difficultyMultiplier=1.0]
     * @returns {Object|null} drop descriptor
     */
    generateDrop(enemyType, isElite, difficultyMultiplier = 1.0, playerArchetype = null) {
        const roll = Math.random();
        const magicFind = (this.player && this.player.getRPGStats)
            ? (this.player.getRPGStats().magicFind || 0)
            : 0;
        const mfRoll = roll * (1 - Math.min(0.5, magicFind)); // MF shifts roll toward better loot

        if (enemyType === 'boss') {
            return this._generateBossDrop(difficultyMultiplier, playerArchetype);
        }

        if (isElite) {
            // Elite: 15% nothing, 25% scrap, 15% chips, 35% gear, 8% legendary, 2% set
            if (mfRoll < 0.15) return null;
            if (mfRoll < 0.40) return this._makeScrap(3 + Math.floor(Math.random() * 3), difficultyMultiplier);
            if (mfRoll < 0.55) return this._makeChips(2 + Math.floor(Math.random() * 3), difficultyMultiplier);
            if (mfRoll < 0.90) return this._makeGear(this._rollRarity(0.55, true), difficultyMultiplier, playerArchetype);
            if (mfRoll < 0.98) return this._makeGear(RARITY.LEGENDARY, difficultyMultiplier, playerArchetype);
            return this._makeGear(RARITY.SET, difficultyMultiplier, playerArchetype);
        }

        // Common enemy: 55% nothing, 28% scrap, 10% chips, 5% gear, 1.8% magic, 0.2% rare+
        if (mfRoll < 0.55) return null;
        if (mfRoll < 0.83) return this._makeScrap(1 + Math.floor(Math.random() * 2), difficultyMultiplier);
        if (mfRoll < 0.93) return this._makeChips(1, difficultyMultiplier);
        if (mfRoll < 0.98) return this._makeGear(RARITY.COMMON, difficultyMultiplier, playerArchetype);
        if (mfRoll < 0.998) return this._makeGear(RARITY.MAGIC, difficultyMultiplier, playerArchetype);
        return this._makeGear(this._rollRarity(0.30, true), difficultyMultiplier, playerArchetype);
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

            // Generic proximity pickup for scrap / chips / gear / consumables (generous 1.5 m + bonus)
            if (drop.type === 'scrap' || drop.type === 'chips' || drop.type === 'gear' || drop.type === 'consumable') {
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
                if (drop.mesh.geometry) drop.mesh.geometry.dispose();
                if (drop.mesh.material) {
                    if (Array.isArray(drop.mesh.material)) {
                        drop.mesh.material.forEach(m => m.dispose());
                    } else {
                        drop.mesh.material.dispose();
                    }
                }
            }
        }
        this.drops.clear();
    }

    /* -------------------------------------------------------------------- */
    /*  Internal generators                                                 */
    /* -------------------------------------------------------------------- */

    _generateBossDrop(difficultyMultiplier, playerArchetype = null) {
        const pick = Math.random();
        if (pick < 0.30) return this._makeGear(this._rollRarity(0.20, true), difficultyMultiplier, playerArchetype);
        if (pick < 0.60) return this._makeGear(this._rollRarity(0.40, true), difficultyMultiplier, playerArchetype);
        if (pick < 0.85) return this._makeGear(RARITY.LEGENDARY, difficultyMultiplier, playerArchetype);
        if (pick < 0.95) return this._makeGear(RARITY.SET, difficultyMultiplier, playerArchetype);
        if (pick < 0.98) return this._makeScrap(5 + Math.floor(Math.random() * 5), difficultyMultiplier);
        return this._makeChips(3 + Math.floor(Math.random() * 4), difficultyMultiplier);
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

    _rollRarity(commonThreshold, allowSet = false) {
        const r = Math.random();
        if (r < commonThreshold) return RARITY.COMMON;
        if (r < 0.85) return RARITY.MAGIC;
        if (r < 0.95) return RARITY.RARE;
        if (r < 0.985) return RARITY.LEGENDARY;
        if (allowSet && r < 0.995) return RARITY.SET;
        if (allowSet && r < 0.998) return RARITY.ANCIENT;
        if (allowSet) return RARITY.PRIMAL;
        return RARITY.LEGENDARY;
    }

    /* -------------------------------------------------------------------- */
    /*  Mesh factory                                                        */
    /* -------------------------------------------------------------------- */

    _createMeshForDrop(drop) {
        switch (drop.type) {
            case 'gear':      return this._createGearMesh(drop.rarity);
            case 'scrap':     return this._createScrapMesh();
            case 'chips':     return this._createChipsMesh();
            case 'health_globe': return this._createHealthGlobeMesh();
            case 'consumable': return this._createConsumableMesh(drop.consumableType);
            default:          return this._createScrapMesh();
        }
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

        if (drop.unidentified && !drop.identified) {
            // Unidentified items can't be equipped directly
            // Notify player (console for now, UI later)
            console.log(`[Loot] Picked up UNIDENTIFIED ${drop.itemData.name || 'item'} — take to safehouse to identify!`);
            // Store in a temporary unidentified stash
            if (!this._unidentifiedStash) this._unidentifiedStash = [];
            this._unidentifiedStash.push(drop.itemData);
            return;
        }

        this.exoSuit.equip(drop.itemData);
        console.log(`[Loot] Equipped ${drop.itemData.name || 'gear'} (${drop.slot})`);
    }

    _pickupScrap(drop) {
        // Scrap is virtual currency; no mesh state to maintain.
        // Callers can hook into this via console or event if needed.
    }

    _pickupChips(drop) {
        // Chips are virtual currency.
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
        // Consumables go to an inventory pouch if one exists.
        // For now this is a no-op stub.
    }

    _removeDrop(id) {
        const drop = this.drops.get(id);
        if (!drop) return;
        if (drop.mesh) {
            this.scene.remove(drop.mesh);
            if (drop.mesh.geometry) drop.mesh.geometry.dispose();
            if (drop.mesh.material) {
                if (Array.isArray(drop.mesh.material)) {
                    drop.mesh.material.forEach(m => m.dispose());
                } else {
                    drop.mesh.material.dispose();
                }
            }
        }
        this.drops.delete(id);
    }
}
