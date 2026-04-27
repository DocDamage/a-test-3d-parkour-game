import * as THREE from 'three';

/**
 * DungeonSystem — Zelda-style story dungeon framework
 *
 * Seven story dungeons map onto the seven existing world zones.
 * Each dungeon entrance is a glowing portal disc in the world.
 * Walking onto a portal and pressing Interact (F) enters the dungeon.
 *
 * Inside a dungeon (conceptual state machine — geometry lives in World):
 *   • Small Key doors: useSmallKey(doorId) to unlock
 *   • Big Chest: openBigChest() → awards the dungeon's key item
 *   • Compass: pickupCompass() → reveals chest positions on dungeon map
 *   • Dungeon Map: pickupDungeonMap() → reveals room layout
 *   • Boss Room: locked until bigChestOpened (player has key item first)
 *   • Boss Defeat: defeatBoss() → awards heart container + sector key
 *
 * Collecting all 7 sector keys unlocks the true final boss.
 *
 * Integration in main.js:
 *   const dungeons = new DungeonSystem(scene, player, world, heartSystem, keyItemSystem);
 *   // In animate():
 *   dungeons.update(finalDt, activeInput);
 *   // Check proximity → prompt "Press F to enter" in UI
 *   const nearId = dungeons.checkProximityEnter(player.position);
 *   // On F press and nearId exists:
 *   dungeons.enterDungeon(nearId);
 *   // On exit (Tab or leaving dungeon bounds):
 *   dungeons.exitDungeon();
 */

export const DUNGEONS = {
    underground_tunnel: {
        id: 'underground_tunnel',
        name: 'Underground Tunnel',
        subtitle: 'The Crawl',
        keyItem: 'grappling_hook',
        bossName: 'The Crawler',
        totalRooms: 6,
        smallKeyCount: 2,
        color: 0xcc6600,
        lightColor: 0xff8800,
        worldPosition: new THREE.Vector3(0, 0, -18),
        order: 1,
    },
    freezer: {
        id: 'freezer',
        name: 'Frozen Vault',
        subtitle: 'The Chill',
        keyItem: 'magnet_boots',
        bossName: 'Cryo Sentinel',
        totalRooms: 7,
        smallKeyCount: 3,
        color: 0x0088cc,
        lightColor: 0x44ccff,
        worldPosition: new THREE.Vector3(-28, 0, -10),
        order: 2,
    },
    server_room: {
        id: 'server_room',
        name: 'Server Citadel',
        subtitle: 'The Grid',
        keyItem: 'zipline_kit',
        bossName: 'Overseer Prime',
        totalRooms: 8,
        smallKeyCount: 3,
        color: 0x00aa66,
        lightColor: 0x00ffaa,
        worldPosition: new THREE.Vector3(0, 0, 18),
        order: 3,
    },
    water_treatment: {
        id: 'water_treatment',
        name: 'Flood Works',
        subtitle: 'The Deluge',
        keyItem: 'dive_charge',
        bossName: 'Tide Warden',
        totalRooms: 7,
        smallKeyCount: 2,
        color: 0x2244dd,
        lightColor: 0x4466ff,
        worldPosition: new THREE.Vector3(28, 0, -10),
        order: 4,
    },
    vertical_shaft: {
        id: 'vertical_shaft',
        name: 'The Ascent',
        subtitle: 'The Climb',
        keyItem: 'wall_hook',
        bossName: 'Apex Crawler',
        totalRooms: 9,
        smallKeyCount: 4,
        color: 0xdd6622,
        lightColor: 0xff9955,
        worldPosition: new THREE.Vector3(28, 0, 18),
        order: 5,
    },
    hangar_bay: {
        id: 'hangar_bay',
        name: 'The Hangar',
        subtitle: 'The Machine',
        keyItem: 'overclock_module',
        bossName: 'War Machine X-7',
        totalRooms: 8,
        smallKeyCount: 3,
        color: 0xddcc00,
        lightColor: 0xffee44,
        worldPosition: new THREE.Vector3(-28, 0, 18),
        order: 6,
    },
    rooftop: {
        id: 'rooftop',
        name: 'The Crown',
        subtitle: 'The Summit',
        keyItem: 'phase_mirror',
        bossName: 'The Director',
        totalRooms: 10,
        smallKeyCount: 5,
        color: 0xaa44dd,
        lightColor: 0xcc77ff,
        worldPosition: new THREE.Vector3(0, 6, 0),
        order: 7,
    },
};

// ─── Per-run dungeon state ────────────────────────────────────────────────────

class DungeonRunState {
    constructor() {
        this.currentRoom = 0;
        this.smallKeysHeld = 0;
        this.hasCompass = false;
        this.hasDungeonMap = false;
        this.roomsCleared = new Set();
        this.doorsUnlocked = new Set();
        this.bigChestOpened = false;
        this.bossDefeated = false;
    }
}

// ─── Main class ───────────────────────────────────────────────────────────────

export class DungeonSystem {
    constructor(scene, player, world, heartSystem, keyItemSystem) {
        this.scene = scene;
        this.player = player;
        this.world = world;
        this.heartSystem = heartSystem;
        this.keyItemSystem = keyItemSystem;

        /** Currently active dungeon id, or null in overworld. */
        this.activeDungeon = null;

        /** Per-run state for the active dive. */
        this.runState = null;

        /** Persistent per-dungeon completion data. */
        this.completionData = {};
        for (const id of Object.keys(DUNGEONS)) {
            this.completionData[id] = {
                completed: false,
                bossDefeated: false,
                sectorKeyCollected: false,
            };
        }

        /** Entrance portal meshes. */
        this.portals = [];
        this.portalLights = [];
        this._buildPortals();

        /** Proximity prompt state. */
        this.nearbyDungeonId = null;
        this._promptEl = this._createPromptElement();
    }

    // ─── Portal construction ─────────────────────────────────────────────

    _buildPortals() {
        for (const dungeon of Object.values(DUNGEONS)) {
            // Ground disc
            const discGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.12, 32);
            const discMat = new THREE.MeshStandardMaterial({
                color: dungeon.color,
                emissive: dungeon.color,
                emissiveIntensity: 0.6,
                roughness: 0.3,
                metalness: 0.5,
            });
            const disc = new THREE.Mesh(discGeo, discMat);
            disc.position.copy(dungeon.worldPosition);
            disc.position.y = 0.06;
            disc.userData.dungeonId = dungeon.id;
            disc.receiveShadow = true;
            this.scene.add(disc);

            // Floating ring above the disc
            const ringGeo = new THREE.TorusGeometry(0.9, 0.06, 8, 32);
            const ringMat = new THREE.MeshStandardMaterial({
                color: dungeon.lightColor,
                emissive: dungeon.lightColor,
                emissiveIntensity: 1.0,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.copy(dungeon.worldPosition);
            ring.position.y = 1.2;
            ring.userData.dungeonId = dungeon.id;
            this.scene.add(ring);

            // Point light
            const pl = new THREE.PointLight(dungeon.lightColor, 2, 8);
            pl.position.copy(dungeon.worldPosition);
            pl.position.y = 1.5;
            this.scene.add(pl);

            this.portals.push({ disc, ring, id: dungeon.id, baseY: 1.2 });
            this.portalLights.push(pl);

            // Completion shield (shown when dungeon is beaten)
            const shieldGeo = new THREE.OctahedronGeometry(0.35, 0);
            const shieldMat = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                emissive: 0x886600,
                emissiveIntensity: 0.8,
            });
            const shield = new THREE.Mesh(shieldGeo, shieldMat);
            shield.position.copy(dungeon.worldPosition);
            shield.position.y = 2.4;
            shield.visible = false;
            shield.userData.completionShield = dungeon.id;
            this.scene.add(shield);
            const portalEntry = this.portals[this.portals.length - 1];
            portalEntry.shield = shield;
        }
    }

    // ─── Proximity check ────────────────────────────────────────────────

    /**
     * Returns the id of the nearest dungeon entrance within interact range,
     * or null. Call from main.js animate loop.
     */
    checkProximityEnter(playerPos) {
        let closest = null;
        let closestDist = 2.0;
        for (const portal of this.portals) {
            const dx = playerPos.x - portal.disc.position.x;
            const dz = playerPos.z - portal.disc.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < closestDist) {
                closestDist = dist;
                closest = portal.id;
            }
        }
        return closest;
    }

    // ─── Enter / Exit ────────────────────────────────────────────────────

    enterDungeon(id) {
        const config = DUNGEONS[id];
        if (!config) return false;

        this.activeDungeon = id;
        this.runState = new DungeonRunState();
        this._updateDungeonHUD();
        this._showEnterBanner(config);
        return true;
    }

    exitDungeon() {
        this.activeDungeon = null;
        this.runState = null;
        this._hideDungeonHUD();
    }

    // ─── In-dungeon events ───────────────────────────────────────────────

    /** Called when all enemies in a room are defeated. */
    clearRoom(roomIndex) {
        if (!this.runState) return;
        this.runState.roomsCleared.add(roomIndex);
        this.runState.currentRoom = roomIndex;
        this._updateDungeonHUD();
    }

    pickupSmallKey() {
        if (!this.runState) return;
        this.runState.smallKeysHeld++;
        this._updateDungeonHUD();
        this._spawnPickupText('Small Key', '#ffdd00');
    }

    /**
     * Attempt to use a small key on a locked door.
     * Returns true on success.
     */
    useSmallKey(doorId) {
        if (!this.runState || this.runState.smallKeysHeld <= 0) return false;
        this.runState.smallKeysHeld--;
        this.runState.doorsUnlocked.add(doorId);
        this._updateDungeonHUD();
        return true;
    }

    isDoorUnlocked(doorId) {
        return this.runState ? this.runState.doorsUnlocked.has(doorId) : false;
    }

    pickupCompass() {
        if (!this.runState) return;
        this.runState.hasCompass = true;
        this._updateDungeonHUD();
        this._spawnPickupText('Compass — Chests revealed!', '#00ffdd');
    }

    pickupDungeonMap() {
        if (!this.runState) return;
        this.runState.hasDungeonMap = true;
        this._updateDungeonHUD();
        this._spawnPickupText('Dungeon Map — Layout revealed!', '#00ddff');
    }

    /**
     * Open the Big Chest. Returns the key item id on success, null if
     * already opened or no active dungeon.
     */
    openBigChest() {
        if (!this.runState || this.runState.bigChestOpened) return null;
        this.runState.bigChestOpened = true;
        const config = DUNGEONS[this.activeDungeon];
        if (this.keyItemSystem) {
            this.keyItemSystem.collectItem(config.keyItem);
        }
        this._updateDungeonHUD();
        return config.keyItem;
    }

    /** Call after the dungeon boss is defeated. Returns total sector keys collected. */
    defeatBoss() {
        if (!this.activeDungeon) return 0;

        this.runState.bossDefeated = true;
        const data = this.completionData[this.activeDungeon];
        data.bossDefeated = true;
        data.completed = true;
        data.sectorKeyCollected = true;

        // Heart container reward
        if (this.heartSystem) this.heartSystem.addHeartContainer();

        // Show completion shield
        const portal = this.portals.find(p => p.id === this.activeDungeon);
        if (portal && portal.shield) portal.shield.visible = true;

        const count = this.getSectorKeyCount();
        this._showClearBanner(DUNGEONS[this.activeDungeon], count);

        return count;
    }

    /** True when all 7 sector keys collected. */
    allDungeonsComplete() {
        return this.getSectorKeyCount() >= Object.keys(DUNGEONS).length;
    }

    getSectorKeyCount() {
        return Object.values(this.completionData).filter(d => d.sectorKeyCollected).length;
    }

    isDungeonComplete(id) {
        return this.completionData[id]?.completed ?? false;
    }

    getActiveDungeonConfig() {
        return this.activeDungeon ? DUNGEONS[this.activeDungeon] : null;
    }

    getRunState() {
        return this.runState;
    }

    // ─── Update loop ─────────────────────────────────────────────────────

    update(dt, activeInput) {
        const t = performance.now() / 1000;

        // Animate portals
        for (let i = 0; i < this.portals.length; i++) {
            const p = this.portals[i];
            p.ring.rotation.y += dt * 1.2;
            p.ring.position.y = p.baseY + Math.sin(t * 1.5 + i) * 0.08;
            if (p.shield && p.shield.visible) {
                p.shield.rotation.y += dt * 0.8;
                p.shield.rotation.x += dt * 0.4;
            }
            // Pulse light
            if (this.portalLights[i]) {
                this.portalLights[i].intensity = 1.5 + Math.sin(t * 2 + i) * 0.5;
            }
        }

        // Proximity prompt
        if (!this.activeDungeon) {
            const nearId = this.checkProximityEnter(this.player.position);
            if (nearId !== this.nearbyDungeonId) {
                this.nearbyDungeonId = nearId;
                this._updatePrompt(nearId);
            }
        }
    }

    // ─── HUD helpers ─────────────────────────────────────────────────────

    _updateDungeonHUD() {
        const hud = document.getElementById('dungeon-hud');
        if (!hud || !this.activeDungeon || !this.runState) return;

        hud.style.display = 'block';
        const config = DUNGEONS[this.activeDungeon];
        const rs = this.runState;

        const nameEl = document.getElementById('dungeon-name');
        if (nameEl) nameEl.textContent = config.name;

        const keysEl = document.getElementById('dungeon-small-keys');
        if (keysEl) keysEl.textContent = '🗝 × ' + rs.smallKeysHeld;

        const compassEl = document.getElementById('dungeon-compass');
        if (compassEl) compassEl.style.opacity = rs.hasCompass ? '1' : '0.25';

        const mapEl = document.getElementById('dungeon-map-icon');
        if (mapEl) mapEl.style.opacity = rs.hasDungeonMap ? '1' : '0.25';

        const chestEl = document.getElementById('dungeon-big-chest');
        if (chestEl) chestEl.style.opacity = rs.bigChestOpened ? '0.4' : '1';

        // Sector key counter (shown outside dungeon too)
        const sectorEl = document.getElementById('sector-key-count');
        if (sectorEl) sectorEl.textContent = this.getSectorKeyCount() + ' / 7';
    }

    _hideDungeonHUD() {
        const hud = document.getElementById('dungeon-hud');
        if (hud) hud.style.display = 'none';
        this._updatePrompt(null);
    }

    _createPromptElement() {
        const el = document.createElement('div');
        el.id = 'dungeon-enter-prompt';
        el.style.cssText = [
            'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);',
            'background:rgba(0,0,0,0.75);border:1px solid rgba(255,200,0,0.5);',
            'color:#ffd700;font-size:15px;padding:8px 20px;border-radius:8px;',
            'pointer-events:none;z-index:50;display:none;',
            'text-shadow:0 1px 4px rgba(0,0,0,0.9);',
        ].join('');
        document.body.appendChild(el);
        return el;
    }

    _updatePrompt(dungeonId) {
        if (!this._promptEl) return;
        if (!dungeonId) {
            this._promptEl.style.display = 'none';
            return;
        }
        const config = DUNGEONS[dungeonId];
        const done = this.isDungeonComplete(dungeonId);
        this._promptEl.style.display = 'block';
        this._promptEl.textContent = `[F] Enter ${config.name}${done ? ' ✓' : ''}`;
    }

    _showEnterBanner(config) {
        this._showBanner(config.name, config.subtitle, config.lightColor);
    }

    _showClearBanner(config, sectorKeys) {
        this._showBanner(
            config.name + ' — Cleared!',
            `Sector Key obtained  (${sectorKeys} / 7)`,
            0xffd700,
            3500
        );
    }

    _showBanner(line1, line2, colorInt, duration = 2800) {
        const hexStr = '#' + colorInt.toString(16).padStart(6, '0');
        const el = document.createElement('div');
        el.style.cssText = [
            'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);',
            'text-align:center;pointer-events:none;z-index:400;',
            'transition:opacity 0.5s;',
        ].join('');
        el.innerHTML = `
            <div style="color:${hexStr};font-size:28px;letter-spacing:4px;text-transform:uppercase;font-weight:bold;text-shadow:0 2px 12px rgba(0,0,0,0.9)">${line1}</div>
            <div style="color:#ccc;font-size:16px;margin-top:6px;text-shadow:0 1px 6px rgba(0,0,0,0.9)">${line2}</div>
        `;
        document.body.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; }, duration - 500);
        setTimeout(() => el.remove(), duration + 100);
    }

    _spawnPickupText(text, color) {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.cssText = [
            'position:fixed;top:45%;left:50%;transform:translateX(-50%);',
            `color:${color};font-size:16px;font-weight:bold;`,
            'text-shadow:0 1px 6px rgba(0,0,0,0.9);',
            'pointer-events:none;z-index:150;transition:opacity 1s,top 1s;',
        ].join('');
        document.body.appendChild(el);
        requestAnimationFrame(() => {
            el.style.top = '40%';
            setTimeout(() => { el.style.opacity = '0'; }, 1200);
            setTimeout(() => el.remove(), 2300);
        });
    }

    // ─── Cleanup ─────────────────────────────────────────────────────────

    dispose() {
        for (const portal of this.portals) {
            this.scene.remove(portal.disc);
            this.scene.remove(portal.ring);
            portal.disc.geometry.dispose();
            portal.ring.geometry.dispose();
            if (portal.shield) {
                this.scene.remove(portal.shield);
                portal.shield.geometry.dispose();
            }
        }
        for (const pl of this.portalLights) {
            this.scene.remove(pl);
        }
        if (this._promptEl) this._promptEl.remove();
        this.portals = [];
        this.portalLights = [];
    }
}
