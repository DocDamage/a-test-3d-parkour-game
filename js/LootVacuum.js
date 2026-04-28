/**
 * LootVacuum — automatically pull nearby loot after combat ends.
 */

import * as THREE from 'three';

export class LootVacuum {
    constructor(player, lootSystem) {
        this.player = player;
        this.lootSystem = lootSystem;
        this.range = 8;
        this.cooldown = 3.0;
        this._timer = 0;
        this._active = false;
    }

    update(dt) {
        if (!this.player || !this.lootSystem) return;
        this._timer -= dt;
        if (this._timer > 0) return;

        // Check if in combat (simplified: any enemy within 15m)
        const inCombat = this._isInCombat();
        if (inCombat) {
            this._active = false;
            return;
        }

        // After combat ends, wait 1s then vacuum
        if (!this._active) {
            this._active = true;
            this._timer = 1.0;
            return;
        }

        this._vacuumLoot();
        this._timer = this.cooldown;
        this._active = false;
    }

    _isInCombat() {
        // Check world drones
        if (this.player.world && this.player.world.drones && this.player.world.drones.drones) {
            for (const drone of this.player.world.drones.drones) {
                const pos = drone.position || drone.mesh?.position || drone.group?.position;
                if (!drone.isDead && pos && pos.distanceTo(this.player.position) < 15) {
                    return true;
                }
            }
        }
        return false;
    }

    _vacuumLoot() {
        // This would integrate with LootSystem to pull drops
        // For now, just a hook for future implementation
        if (window.__DEV__) console.log('[LootVacuum] would pull nearby loot');
    }
}
