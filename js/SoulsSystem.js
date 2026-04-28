/**
 * SoulsSystem — Souls-like risk/reward layer.
 *
 * Features:
 *  1. Echo Shards — a risky currency dropped on death.
 *     - Enemies yield shards proportional to their type/threat.
 *     - On death all carried shards drop as a glowing beacon at the death position.
 *     - Walking over the beacon recovers them.
 *     - Dying again before recovery destroys the previous beacon permanently.
 *
 *  2. Healing Vials — a limited-use heal (Estus-flask analog).
 *     - Default: 3 vials, each restoring 40 HP.
 *     - Refill only when the player rests at a safehouse.
 *     - Press V to consume a vial.
 *
 *  3. Safehouse Rest — the bonfire analog.
 *     - Refills vials, triggers enemy respawn, auto-saves.
 *     - Accessible via the "Rest" button in the Safehouse panel.
 *
 * Integration:
 *   const soulsSystem = new SoulsSystem(scene, player);
 *   soulsSystem.onRest = () => { world.drones.respawnAll(); saveSystem.save(); };
 *   soulsSystem.onShardChange = (carried, beacon) => updateShardHUD(carried, beacon);
 *   soulsSystem.onVialChange  = (current, max)    => updateVialHUD(current, max);
 *
 *   // In the kill handler:
 *   soulsSystem.addShards(SoulsSystem.getShardYield(enemy.type, enemy.isElite));
 *
 *   // In the player death block:
 *   soulsSystem.onPlayerDeath(player.position);
 *
 *   // In the animate loop:
 *   soulsSystem.update(finalDt);
 */

import * as THREE from 'three';

/* Shard yield by enemy type (non-elite values) */
const SHARD_YIELD = {
    brawler:   50,
    shield:    60,
    turret:    80,
    suicide:   30,
    sapper:    70,
    jammer:    90,
    medic:     40,
    phantom:  100,
    command:  120,
    minelayer: 70,
    drone:     45,  // DroneAI patrol drone
};

export class SoulsSystem {
    constructor(scene, player) {
        this._scene  = scene;
        this._player = player;

        /* ── Echo Shards ─────────────────────────────────── */
        this.carriedShards  = 0;
        this._beaconShards  = 0;
        this._beaconPos     = null;   // THREE.Vector3 of the beacon base
        this._beacon        = null;   // THREE.Mesh (glowing orb)
        this._beaconLight   = null;   // THREE.PointLight
        this._beaconAge     = 0;      // seconds since beacon spawned (for animation)

        /* ── Healing Vials ───────────────────────────────── */
        this.vials          = 3;
        this.maxVials       = 3;
        this.vialHealAmount = 40;

        /* ── Callbacks (wired by main.js) ────────────────── */
        this.onRest        = null;  // () => void
        this.onShardChange = null;  // (carried: number, beacon: number) => void
        this.onVialChange  = null;  // (current: number, max: number) => void
    }

    /* ================================================================== */
    /*  Echo Shards                                                        */
    /* ================================================================== */

    /** Add shards from a killed enemy. */
    addShards(amount) {
        this.carriedShards += amount;
        this._notifyShards();
    }

    /**
     * Call when the player dies.
     * Carried shards become a recoverable beacon at the death position.
     * Any existing beacon from a previous death is lost permanently.
     */
    onPlayerDeath(deathPosition) {
        // Destroy previous beacon — shards are gone forever
        if (this._beacon) {
            this._destroyBeacon(false);
        }

        if (this.carriedShards > 0) {
            this._beaconShards  = this.carriedShards;
            this.carriedShards  = 0;
            this._spawnBeacon(deathPosition.clone());
        }

        this._notifyShards();
    }

    _spawnBeacon(pos) {
        const geo = new THREE.SphereGeometry(0.28, 12, 12);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x00ccff,
            emissive: 0x0077bb,
            emissiveIntensity: 2.5,
            transparent: true,
            opacity: 0.9,
        });
        this._beacon = new THREE.Mesh(geo, mat);
        this._beacon.position.set(pos.x, pos.y + 0.5, pos.z);

        this._beaconLight = new THREE.PointLight(0x00ccff, 1.8, 5);
        this._beaconLight.position.copy(this._beacon.position);

        this._beaconPos = pos.clone();
        this._beaconAge = 0;

        this._scene.add(this._beacon);
        this._scene.add(this._beaconLight);
    }

    _destroyBeacon(recovered) {
        if (this._beacon) {
            this._scene.remove(this._beacon);
            this._beacon.geometry.dispose();
            this._beacon.material.dispose();
            this._beacon = null;
        }
        if (this._beaconLight) {
            this._scene.remove(this._beaconLight);
            this._beaconLight = null;
        }
        if (!recovered) {
            this._beaconShards = 0;
        }
        this._beaconPos = null;
    }

    /* ================================================================== */
    /*  Healing Vials                                                      */
    /* ================================================================== */

    /** Consume one vial and heal the player. Returns false if none remain or player is full. */
    useVial() {
        if (this.vials <= 0) return false;
        if (!this._player || this._player.isDead) return false;
        if (this._player.health >= this._player.maxHealth) return false;

        this.vials--;
        this._player.heal(this.vialHealAmount);
        this._notifyVials();
        return true;
    }

    refillVials() {
        this.vials = this.maxVials;
        this._notifyVials();
    }

    /* ================================================================== */
    /*  Safehouse Rest                                                     */
    /* ================================================================== */

    /**
     * Rest at a safehouse:
     *  - Refills vials.
     *  - Fires onRest (main.js wires drone respawn + saveSystem.save() here).
     */
    rest() {
        this.refillVials();
        if (typeof this.onRest === 'function') this.onRest();
    }

    /* ================================================================== */
    /*  Per-frame update                                                   */
    /* ================================================================== */

    update(dt) {
        if (!this._beacon || !this._beaconPos) return;

        this._beaconAge += dt;

        // Float + pulse animation
        const floatY = this._beaconPos.y + 0.5 + Math.sin(this._beaconAge * 2.5) * 0.14;
        this._beacon.position.y      = floatY;
        this._beaconLight.position.y = floatY;
        this._beacon.rotation.y     += dt * 1.5;
        this._beaconLight.intensity  = 1.4 + Math.sin(this._beaconAge * 5) * 0.5;

        // Proximity pickup (1.5 m radius)
        if (this._player && !this._player.isDead) {
            const p = this._player.position;
            const b = this._beaconPos;
            const dist2 = (p.x - b.x) ** 2 + (p.y - b.y) ** 2 + (p.z - b.z) ** 2;
            if (dist2 < 1.5 ** 2) {
                this.carriedShards += this._beaconShards;
                this._beaconShards  = 0;
                this._destroyBeacon(true);
                this._notifyShards();
            }
        }
    }

    /* ================================================================== */
    /*  Static helpers                                                     */
    /* ================================================================== */

    /**
     * Returns shard yield for a killed enemy.
     * @param {string}  enemyType
     * @param {boolean} isElite
     */
    static getShardYield(enemyType, isElite = false) {
        const base = SHARD_YIELD[enemyType] ?? 50;
        return isElite ? base * 3 : base;
    }

    /* ================================================================== */
    /*  Internal notifications                                             */
    /* ================================================================== */

    _notifyShards() {
        if (typeof this.onShardChange === 'function') {
            this.onShardChange(this.carriedShards, this._beaconShards);
        }
    }

    _notifyVials() {
        if (typeof this.onVialChange === 'function') {
            this.onVialChange(this.vials, this.maxVials);
        }
    }

    /* ================================================================== */
    /*  SaveSystem serialization                                           */
    /* ================================================================== */

    serialize() {
        return {
            carriedShards:  this.carriedShards,
            vials:          this.vials,
            maxVials:       this.maxVials,
            vialHealAmount: this.vialHealAmount,
        };
    }

    deserialize(data) {
        if (!data) return;
        this.carriedShards  = data.carriedShards  ?? 0;
        this.vials          = data.vials          ?? this.maxVials;
        this.maxVials       = data.maxVials        ?? 3;
        if (data.vialHealAmount !== undefined) this.vialHealAmount = data.vialHealAmount;
        this._notifyVials();
        this._notifyShards();
    }
}
