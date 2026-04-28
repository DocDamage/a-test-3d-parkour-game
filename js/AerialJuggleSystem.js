/**
 * AerialJuggleSystem — launch enemies airborne and juggle them.
 */

import * as THREE from 'three';

export class AerialJuggleSystem {
    constructor(player, combatSystem) {
        this.player = player;
        this.combat = combatSystem;
        this.launchForce = 6;
        this.airComboMult = 1.5;
        this.groundPoundMult = 3.0;
        this._juggledEnemies = new Map(); // enemy -> { hitCount, startTime }
    }

    update(dt) {
        // Track juggled enemies
        for (const [enemy, data] of this._juggledEnemies) {
            if (!enemy || enemy.isDead || enemy.health <= 0) {
                this._juggledEnemies.delete(enemy);
                continue;
            }
            // Ground pound detection
            if (this.player.state === 'GROUND_POUND' || this._isGroundPounding()) {
                if (enemy.position.distanceTo(this.player.position) < 2.5) {
                    this._executeGroundPound(enemy);
                    this._juggledEnemies.delete(enemy);
                }
            }
        }
    }

    onHeavyHit(enemy) {
        if (!enemy || enemy.isDead) return;
        // Launch enemy airborne
        if (enemy.velocity) {
            enemy.velocity.y = this.launchForce;
            enemy._isAirborne = true;
        }
        this._juggledEnemies.set(enemy, { hitCount: 1, startTime: performance.now() });
        if (window.__DEV__) console.log('[Juggle] launched enemy');
    }

    onAirLightHit(enemy) {
        if (!enemy || enemy.isDead) return;
        if (!enemy._isAirborne) return;
        const data = this._juggledEnemies.get(enemy);
        if (data) {
            data.hitCount++;
            return this.airComboMult;
        }
        return 1.0;
    }

    _executeGroundPound(enemy) {
        if (!enemy.takeDamage) return;
        const dmg = 25 * this.groundPoundMult;
        enemy.takeDamage(dmg, 'kinetic', this.player);
        enemy._isAirborne = false;
        if (window.__DEV__) console.log('[Juggle] ground pound', dmg);
    }

    _isGroundPounding() {
        const p = this.player;
        return p.state === 'DIVE' || (p.velocity && p.velocity.y < -8 && !p.grounded);
    }
}
