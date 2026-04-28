/**
 * WeaponComboSystem — quick-switch cancel combos (melee finisher -> instant gunshot).
 */

export class WeaponComboSystem {
    constructor(player, combatSystem, weaponSystem) {
        this.player = player;
        this.combat = combatSystem;
        this.weapon = weaponSystem;
        this.switchWindow = 0.3; // seconds after finisher
        this._finisherTimer = 0;
        this._awaitingSwitch = false;
    }

    update(dt, input) {
        if (!this.combat || !this.weapon) return;

        // Detect finisher completion
        if (this.combat.state === 'FINISHER') {
            this._awaitingSwitch = true;
        }

        if (this._awaitingSwitch) {
            this._finisherTimer += dt;
            if (this._finisherTimer <= this.switchWindow) {
                // Check for weapon slot switch during window
                for (let slot = 1; slot <= 5; slot++) {
                    if (input.wasPressed('Digit' + slot)) {
                        this._executeSwitchCancel(slot);
                        input.consumeKey('Digit' + slot);
                        break;
                    }
                }
                // Also check scroll wheel
                if (input.wasPressed('ScrollUp') || input.wasPressed('ScrollDown')) {
                    this.weapon.cycleSlot(input.wasPressed('ScrollUp') ? -1 : 1);
                    this._fireInstantShot();
                }
            } else {
                this._awaitingSwitch = false;
                this._finisherTimer = 0;
            }
        }
    }

    _executeSwitchCancel(slot) {
        this.weapon.switchSlot(slot);
        this._fireInstantShot();
        this._awaitingSwitch = false;
        this._finisherTimer = 0;
        if (window.__DEV__) console.log('[Combo] Switch-cancel to slot', slot);
    }

    _fireInstantShot() {
        const p = this.player;
        const dir = new THREE.Vector3(
            Math.sin(p.facing), 0, Math.cos(p.facing)
        );
        if (this.weapon.fire) {
            this.weapon.fire(p.position.clone().add(new THREE.Vector3(0, 1.2, 0)), dir);
        }
    }
}
