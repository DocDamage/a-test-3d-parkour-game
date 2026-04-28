import * as THREE from 'three';

const LOOP_STEPS = Object.freeze({
    ORIENT: 'orient',
    SCAVENGE: 'scavenge',
    HUNT: 'hunt',
    EQUIP: 'equip',
    RIFT_READY: 'riftReady'
});

const STEP_COPY = Object.freeze({
    [LOOP_STEPS.ORIENT]: 'Breathe: move through the safe start lane and get above ground.',
    [LOOP_STEPS.SCAVENGE]: 'Scavenge: collect a chip or grab the starter cache.',
    [LOOP_STEPS.HUNT]: 'Hunt: use parkour and weapons to defeat a patrol drone.',
    [LOOP_STEPS.EQUIP]: 'Gear Up: pick up loot, then open Backpack with I.',
    [LOOP_STEPS.RIFT_READY]: 'Escalate: press T when ready to enter the Apex Rift.'
});

/**
 * ApexRunLoopDirector turns the sandbox systems into a readable first session:
 * orient -> scavenge -> fight -> loot/equip -> rift escalation. It only talks
 * through public systems and visual scene objects; World arrays stay owned by World.
 */
export class ApexRunLoopDirector {
    constructor(scene, player, world, systems = {}) {
        this.scene = scene;
        this.player = player;
        this.world = world;
        this.assetManager = systems.assetManager || null;
        this.lootSystem = systems.lootSystem || null;
        this.inventoryStash = systems.inventoryStash || null;
        this.showHint = systems.showHint || (() => {});
        this.activeArchetypeId = systems.activeArchetypeId || null;

        this.step = LOOP_STEPS.ORIENT;
        this.started = false;
        this.completed = {};
        this._elapsed = 0;
        this._hintCooldown = 0;
        this._starterDropIds = [];
        this._visuals = [];
        this._startChipCount = 0;
        this._startDroneKills = 0;
        this._startStashCount = 0;
        this._ui = this._createUI();
    }

    start() {
        if (this.started) return;
        this.started = true;
        this._elapsed = 0;
        this._startChipCount = this._chipCount();
        this._startDroneKills = this._droneKills();
        this._startStashCount = this._stashCount();
        this._spawnStarterCaches();
        this._spawnLoopSetDressing();
        this._setStep(this.step || LOOP_STEPS.ORIENT, true);
    }

    update(dt, input = null, apexRift = null) {
        if (!this.started) return;
        this._elapsed += dt;
        this._hintCooldown = Math.max(0, this._hintCooldown - dt);

        switch (this.step) {
            case LOOP_STEPS.ORIENT:
                if (this._elapsed > 8 || this.player.position.y > 2.2 || this.player.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 10) {
                    this.completed.orient = true;
                    this._setStep(LOOP_STEPS.SCAVENGE);
                }
                break;
            case LOOP_STEPS.SCAVENGE:
                if (this._chipCount() > this._startChipCount || this._stashCount() > this._startStashCount || this._elapsed > 35) {
                    this.completed.scavenge = true;
                    this._setStep(LOOP_STEPS.HUNT);
                }
                break;
            case LOOP_STEPS.HUNT:
                if (this._droneKills() > this._startDroneKills) {
                    this.completed.hunt = true;
                    this._spawnRewardCache();
                    this._setStep(LOOP_STEPS.EQUIP);
                }
                break;
            case LOOP_STEPS.EQUIP:
                if (this._stashCount() > this._startStashCount || input?.wasPressed?.('KeyI')) {
                    this.completed.equip = true;
                    this._setStep(LOOP_STEPS.RIFT_READY);
                }
                break;
            case LOOP_STEPS.RIFT_READY:
                if (apexRift?.active) this.completed.riftEntered = true;
                break;
        }
        this._updateUI();
    }

    serialize() {
        return {
            step: this.step,
            completed: { ...this.completed }
        };
    }

    deserialize(data) {
        if (!data) return;
        if (STEP_COPY[data.step]) this.step = data.step;
        if (data.completed && typeof data.completed === 'object') this.completed = { ...data.completed };
        this._updateUI();
    }

    dispose() {
        for (const visual of this._visuals) {
            this.scene.remove(visual);
        }
        this._visuals = [];
        this._ui?.remove?.();
    }

    _setStep(step, silent = false) {
        this.step = step;
        this._updateUI();
        if (!silent && this._hintCooldown <= 0) {
            this.showHint(STEP_COPY[step]);
            this._hintCooldown = 5;
        }
    }

    _spawnStarterCaches() {
        if (!this.lootSystem || this._starterDropIds.length > 0) return;
        const positions = [
            new THREE.Vector3(3, 1.1, -6),
            new THREE.Vector3(-4, 1.1, -8)
        ];
        const drops = [
            this._makeDrop('weapon'),
            { type: 'chips', rarity: 0, quantity: 5 }
        ];
        for (let i = 0; i < drops.length; i++) {
            const id = this.lootSystem.spawnDrop(drops[i], positions[i]);
            if (id) this._starterDropIds.push(id);
        }
    }

    _spawnRewardCache() {
        if (!this.lootSystem) return;
        const pos = this.player.position.clone().add(new THREE.Vector3(0, 0.3, -1.5));
        const drop = this._makeDrop('gear') || this.lootSystem.generateDrop('elite', true, 1.1, this.activeArchetypeId);
        this.lootSystem.spawnDrop(drop, pos);
    }

    _makeDrop(kind) {
        if (!this.lootSystem) return null;
        if (kind === 'weapon' && typeof this.lootSystem._makeWeapon === 'function') {
            return this.lootSystem._makeWeapon(10, { playerLevel: 10 });
        }
        if (kind === 'gear' && typeof this.lootSystem.generateDrop === 'function') {
            for (let i = 0; i < 12; i++) {
                const drop = this.lootSystem.generateDrop('elite', true, 1.15, this.activeArchetypeId, { playerLevel: 10 });
                if (drop?.type === 'gear' || drop?.type === 'weapon') return drop;
            }
        }
        return null;
    }

    _spawnLoopSetDressing() {
        if (!this.assetManager || this._visuals.length > 0) return;
        this._addAssetVisual('environment.industrial.wallCameraHal', new THREE.Vector3(0, 2.2, -9.5), 0, 0.9);
        this._addAssetVisual('environment.industrial.markedMetalWalkway', new THREE.Vector3(3, 0.02, -6), 0, 1);
        this._addAssetVisual('environment.industrial.ridgedLightPanel', new THREE.Vector3(-4, 1.5, -9), Math.PI, 1);
    }

    async _addAssetVisual(assetId, position, yaw = 0, scale = 1) {
        const loaded = await this.assetManager.loadModel(assetId);
        if (!loaded) return;
        const model = this.assetManager.instantiateModel(assetId, { position, yaw, scale, receiveShadow: true });
        if (!model) return;
        model.name = `RunLoop_${assetId}`;
        this.scene.add(model);
        this._visuals.push(model);
    }

    _chipCount() {
        return this.world?.collectibles?.getCount?.() || 0;
    }

    _droneKills() {
        return this.world?.drones?.drones?.filter(drone => drone.isDead).length || 0;
    }

    _stashCount() {
        if (Array.isArray(this.inventoryStash?.stash)) return this.inventoryStash.stash.length;
        const stash = this.inventoryStash?.getStash?.();
        return Array.isArray(stash) ? stash.length : 0;
    }

    _createUI() {
        const uiRoot = document.getElementById('ui');
        if (!uiRoot) return null;
        const panel = document.createElement('div');
        panel.id = 'run-loop-objective';
        panel.style.cssText = 'margin-top:10px;padding:9px;border:1px solid rgba(102,230,255,0.35);background:rgba(4,12,18,0.55);font-size:12px;color:#bfefff;';
        uiRoot.appendChild(panel);
        return panel;
    }

    _updateUI() {
        if (!this._ui) return;
        const steps = Object.values(LOOP_STEPS);
        const index = steps.indexOf(this.step) + 1;
        this._ui.innerHTML = `<div style="color:#66e6ff;font-weight:bold;letter-spacing:1px;">RUN LOOP ${Math.max(1, index)}/${steps.length}</div><div>${STEP_COPY[this.step] || ''}</div>`;
    }
}
