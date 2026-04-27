import * as THREE from 'three';

export const COMPANION_MODES = {
    ATTACK: 'attack',
    DISTRACT: 'distract',
    HEAL: 'heal',
    SCOUT: 'scout',
    LOOT: 'loot'
};

const UPGRADE_BASE_COST = {
    chassis: 15,
    battery: 20,
    ai: 25,
    sensor: 15
};

const UPGRADE_SCALING = 1.6;
const MAX_LEVEL = 5;

export class CompanionDrone {
    constructor(scene, player, eventBus) {
        this.scene = scene;
        this.player = player;
        this.eventBus = eventBus;

        this.mode = COMPANION_MODES.ATTACK;
        this.upgrades = {
            chassis: 1,
            battery: 1,
            ai: 1,
            sensor: 1
        };

        this.hp = this._getMaxHp();
        this.maxHp = this._getMaxHp();
        this.alive = true;
        this.active = true;

        // ---- Visuals ----
        this.group = new THREE.Group();
        this.scene.add(this.group);

        const bodyGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x0088aa,
            emissiveIntensity: 1.2,
            roughness: 0.3,
            metalness: 0.5
        });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.group.add(this.body);

        const ringGeo = new THREE.TorusGeometry(0.32, 0.025, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xaaddff });
        this.ring = new THREE.Mesh(ringGeo, ringMat);
        this.group.add(this.ring);

        this.light = new THREE.PointLight(0x00ffff, 2, 6);
        this.light.position.set(0, 0, 0);
        this.group.add(this.light);

        // Start behind the player
        this.group.position.copy(player.position).add(new THREE.Vector3(-2, 2, -2));

        // Timers
        this.attackCooldown = 0;
        this.healCooldown = 0;
        this.distractTimer = 0;
        this.distractTarget = null;
        this.scoutTimer = 0;
        this.scoutPosition = new THREE.Vector3();
        this.scoutActive = false;
        this.lootTimer = 0;
        this.synergyReady = true;
        this.synergyCooldown = 0;

        // Personality
        this.chatterTimer = 0;
        this.chatterInterval = 12;
    }

    setMode(mode) {
        if (!Object.values(COMPANION_MODES).includes(mode)) return;
        this.mode = mode;
        this._emit('companion:comment', { type: 'praise', text: `Switching to ${mode} mode.` });
    }

    getMode() {
        return this.mode;
    }

    /* ------------------------------------------------------------------ */
    /*  Upgrades                                                          */
    /* ------------------------------------------------------------------ */
    upgrade(type, level) {
        if (!this.upgrades.hasOwnProperty(type)) return false;
        if (level < 1 || level > MAX_LEVEL) return false;
        this.upgrades[type] = level;
        if (type === 'chassis') {
            this.maxHp = this._getMaxHp();
            this.hp = Math.min(this.hp + 10, this.maxHp);
        }
        this._emit('companion:comment', { type: 'praise', text: `${type} upgraded to level ${level}.` });
        return true;
    }

    getUpgradeLevel(type) {
        return this.upgrades[type] ?? 1;
    }

    getUpgradeCost(type, nextLevel) {
        if (!this.upgrades.hasOwnProperty(type)) return null;
        if (nextLevel < 2 || nextLevel > MAX_LEVEL) return null;
        const base = UPGRADE_BASE_COST[type] ?? 15;
        return Math.floor(base * Math.pow(UPGRADE_SCALING, nextLevel - 2));
    }

    /* ------------------------------------------------------------------ */
    /*  Core per-frame update                                             */
    /* ------------------------------------------------------------------ */
    update(dt, player, world, enemies) {
        if (!this.alive || !this.active) return;

        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        this.healCooldown = Math.max(0, this.healCooldown - dt);
        this.distractTimer = Math.max(0, this.distractTimer - dt);
        this.scoutTimer = Math.max(0, this.scoutTimer - dt);
        this.lootTimer = Math.max(0, this.lootTimer - dt);
        this.synergyCooldown = Math.max(0, this.synergyCooldown - dt);
        this.chatterTimer = Math.max(0, this.chatterTimer - dt);

        this.ring.rotation.z += dt * 3;
        this.ring.rotation.x += dt * 1.5;

        if (!player) return;

        // Follow player with smoothing
        const offset = new THREE.Vector3(-2, 2 + Math.sin(performance.now() * 0.002) * 0.2, -2);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.facing ?? 0);
        const targetPos = new THREE.Vector3().copy(player.position).add(offset);
        const followSpeed = 3 + this.upgrades.chassis * 0.8;
        this.group.position.lerp(targetPos, Math.min(1, dt * followSpeed));

        // Mode behaviors
        switch (this.mode) {
            case COMPANION_MODES.ATTACK:
                this._updateAttack(dt, player, enemies);
                break;
            case COMPANION_MODES.DISTRACT:
                this._updateDistract(dt, player, enemies);
                break;
            case COMPANION_MODES.HEAL:
                this._updateHeal(dt, player);
                break;
            case COMPANION_MODES.SCOUT:
                this._updateScout(dt, player, world, enemies);
                break;
            case COMPANION_MODES.LOOT:
                this._updateLoot(dt, player, world);
                break;
        }

        // Personality chatter
        if (this.chatterTimer <= 0) {
            this._randomChatter();
            this.chatterTimer = this.chatterInterval + Math.random() * 8;
        }
    }

    triggerSynergy() {
        if (!this.alive || !this.active) return;
        const synergyRate = 0.3 + (this.upgrades.battery * 0.1);
        if (!this.synergyReady || this.synergyCooldown > 0 || Math.random() > synergyRate) return;
        this._fireStunBolt(null);
        this.synergyCooldown = Math.max(0.5, 2 - this.upgrades.battery * 0.25);
        this._emit('companion:comment', { type: 'praise', text: 'Synergy shot fired!' });
    }

    /* ------------------------------------------------------------------ */
    /*  Mode behaviours                                                   */
    /* ------------------------------------------------------------------ */
    _updateAttack(dt, player, enemies) {
        if (this.attackCooldown > 0 || !enemies || enemies.length === 0) return;
        const target = this._pickTarget(enemies, player);
        if (target) {
            this._fireStunBolt(target);
            this.attackCooldown = Math.max(1, 2.5 - this.upgrades.battery * 0.3);
        }
    }

    _updateDistract(dt, player, enemies) {
        if (!enemies || enemies.length === 0) return;
        if (this.distractTimer <= 0) {
            const target = this._pickTarget(enemies, player);
            if (target) {
                this.distractTarget = target;
                this.distractTimer = 3;
                this._emit('companion:comment', { type: 'warn', text: 'Drawing enemy attention.' });
            }
        }
        if (this.distractTarget && this.distractTimer > 0) {
            const tPos = this.distractTarget.position ?? this.distractTarget.group?.position ?? new THREE.Vector3();
            const approach = new THREE.Vector3().copy(tPos).add(new THREE.Vector3(0, 1, 0));
            this.group.position.lerp(approach, Math.min(1, dt * 4));
            // Flash light
            this.light.intensity = 2 + Math.sin(performance.now() * 0.02) * 2;
        } else {
            this.light.intensity = 2;
        }
    }

    _updateHeal(dt, player) {
        const current = player.health ?? 0;
        const max = player.maxHealth ?? current;
        const healThreshold = Math.max(20, 50 - this.upgrades.ai * 8);
        if (this.healCooldown <= 0 && current < Math.min(max, healThreshold)) {
            const healAmount = 10;
            player.health = Math.min(max, current + healAmount);
            this.healCooldown = Math.max(3, 6 - this.upgrades.battery * 0.5);
            this._emit('companion:comment', { type: 'praise', text: 'Repair pulse emitted.' });
            this._emit('companion:heal', { amount: healAmount });
        }
    }

    _updateScout(dt, player, world, enemies) {
        if (this.scoutTimer <= 0) {
            const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.facing ?? 0);
            this.scoutPosition.copy(player.position).add(forward.multiplyScalar(10));
            this.scoutTimer = 5;
            this.scoutActive = true;
            this._emit('companion:comment', { type: 'praise', text: 'Scouting ahead.' });
        }
        if (this.scoutActive) {
            this.group.position.lerp(this.scoutPosition, Math.min(1, dt * 2));
            const range = 10 + this.upgrades.sensor * 4;
            this._highlightInRange(enemies, range);
        }
    }

    _updateLoot(dt, player, world) {
        if (this.lootTimer > 0) return;
        const radius = 5 + this.upgrades.sensor * 1.5;
        const chips = world?.collectibles?.chips ?? [];
        let collected = 0;
        for (const chip of chips) {
            if (!chip.active) continue;
            const pos = chip.mesh?.position ?? chip.position ?? new THREE.Vector3();
            if (pos.distanceTo(this.group.position) < radius) {
                chip.active = false;
                if (chip.mesh) chip.mesh.visible = false;
                collected++;
            }
        }
        if (collected > 0) {
            this._emit('companion:loot', { count: collected });
            this._emit('companion:comment', { type: 'praise', text: `Collected ${collected} items.` });
        }
        this.lootTimer = 0.5;
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                           */
    /* ------------------------------------------------------------------ */
    _fireStunBolt(target) {
        this._emit('companion:attack', { damage: 5, stun: 0.5, target });
        this._emit('companion:comment', { type: 'warn', text: 'Stun bolt away.' });
    }

    _pickTarget(enemies, player) {
        const candidates = [];
        for (const e of enemies) {
            const pos = e.position ?? e.group?.position ?? new THREE.Vector3();
            const dist = pos.distanceTo(player.position);
            const hp = e.hp ?? e.health ?? 100;
            if (dist < 25) candidates.push({ enemy: e, dist, hp });
        }
        if (candidates.length === 0) return null;

        if (this.upgrades.ai >= 3) {
            candidates.sort((a, b) => a.hp - b.hp);
        } else if (this.upgrades.ai >= 2) {
            candidates.sort((a, b) => a.dist - b.dist);
        } else {
            const nearest = candidates.reduce((best, cur) => cur.dist < best.dist ? cur : best);
            return nearest.enemy;
        }
        return candidates[0].enemy;
    }

    _highlightInRange(enemies, range) {
        if (!enemies) return;
        for (const e of enemies) {
            const pos = e.position ?? e.group?.position ?? new THREE.Vector3();
            if (pos.distanceTo(this.group.position) < range) {
                this._emit('companion:highlight', { target: e, type: 'enemy' });
            }
        }
    }

    _getMaxHp() {
        return 30 + (this.upgrades.chassis - 1) * 15;
    }

    _getTimeScale() {
        return 1 + (this.upgrades.battery - 1) * 0.1;
    }

    _randomChatter() {
        const lines = [
            { type: 'joke', text: 'I am not the droid you are looking for.' },
            { type: 'joke', text: 'My hover circuits are tingling.' },
            { type: 'warn', text: 'Sensors picking up movement.' },
            { type: 'praise', text: 'Nice moves back there.' }
        ];
        const line = lines[Math.floor(Math.random() * lines.length)];
        this._emit('companion:comment', line);
    }

    _emit(event, data) {
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
            this.eventBus.emit(event, data);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Lifecycle                                                         */
    /* ------------------------------------------------------------------ */
    takeDamage(amount) {
        if (!this.alive) return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            this.active = false;
            this._emit('companion:die', { companion: this });
            this._emit('companion:comment', { type: 'warn', text: 'Critical damage... shutting down...' });
        }
    }

    revive() {
        this.alive = true;
        this.active = true;
        this.hp = this.maxHp;
        this._emit('companion:comment', { type: 'praise', text: 'Systems back online.' });
    }

    dispose() {
        this.active = false;
        this.alive = false;
        this.scene.remove(this.group);
        this.body.geometry.dispose();
        this.body.material.dispose();
        this.ring.geometry.dispose();
        this.ring.material.dispose();
        this.light.dispose();
    }
}
