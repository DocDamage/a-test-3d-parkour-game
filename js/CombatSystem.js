/**
 * CombatSystem — player attack state machine, combo routing, and hit registration.
 *
 * Integration:
 *   const combat = new CombatSystem(player, hitboxSystem, damageSystem, camera, audio);
 *   combat.update(dt, input);   // call every frame after input snapshot
 *   combat.onHit = (target, damage, type) => { ... };
 */

import * as THREE from 'three';

export const COMBO_STATES = {
    IDLE: 'IDLE',
    LIGHT_1: 'LIGHT_1',
    LIGHT_2: 'LIGHT_2',
    HEAVY: 'HEAVY',
    FINISHER: 'FINISHER',
};

export class CombatSystem {
    constructor(player, hitboxSystem, damageSystem, camera, audio = null) {
        this.player = player;
        this.hitboxSystem = hitboxSystem;
        this.damageSystem = damageSystem;
        this.camera = camera;
        this.audio = audio;

        this.state = COMBO_STATES.IDLE;
        this.stateTimer = 0;
        this.comboCount = 0; // 0, 1, 2
        this.bufferedInput = null; // 'light' | 'heavy' | null
        this.bufferTimer = 0;
        this.hitRegistered = false;

        // Config
        this.lightDuration = 0.30;
        this.heavyDuration = 0.55;
        this.finisherDuration = 0.70;
        this.bufferWindow = 0.15;
        this.hitActiveStart = 0.08; // hitbox becomes active after this much time
        this.hitStopDuration = 0.06;
        this.hitStopTimer = 0;

        this.onHit = null;
    }

    /* ------------------------------------------------------------------ */
    /*  Per-frame update                                                  */
    /* ------------------------------------------------------------------ */

    update(dt, input) {
        // Hit-stop pauses combat time
        if (this.hitStopTimer > 0) {
            this.hitStopTimer -= dt;
            if (this.hitStopTimer < 0) this.hitStopTimer = 0;
            // During hit-stop, only advance state timer partially (visual freeze)
            dt *= 0.1;
        }

        // Buffer input if pressed during an attack
        if (input.wasPressed('Mouse1')) {
            if (this.state === COMBO_STATES.IDLE) {
                this._startAttack('light');
            } else {
                this.bufferedInput = 'light';
                this.bufferTimer = this.bufferWindow;
            }
        }
        if (input.wasPressed('Mouse2')) {
            if (this.state === COMBO_STATES.IDLE) {
                this._startAttack('heavy');
            } else {
                this.bufferedInput = 'heavy';
                this.bufferTimer = this.bufferWindow;
            }
        }

        // Decay buffer
        if (this.bufferTimer > 0) {
            this.bufferTimer -= dt;
            if (this.bufferTimer <= 0) {
                this.bufferedInput = null;
                this.bufferTimer = 0;
            }
        }

        // Advance state timer
        if (this.state !== COMBO_STATES.IDLE) {
            this.stateTimer -= dt;

            // Activate hitbox mid-animation
            const totalDuration = this._getStateDuration();
            if (!this.hitRegistered && this.stateTimer <= (totalDuration - this.hitActiveStart)) {
                this._registerHitbox();
                this.hitRegistered = true;
            }

            // State transition
            if (this.stateTimer <= 0) {
                this._endAttack();
            }
        }

        // Cancel attacks into dash or jump
        const cancelled = this._checkCancels(input);
        if (cancelled && this.state !== COMBO_STATES.IDLE) {
            this._cancelAttack();
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Internal state machine                                            */
    /* ------------------------------------------------------------------ */

    _startAttack(type) {
        const p = this.player;
        if (!p || p.isDead) return;

        // Grounded check for light/heavy (aerial handled by Player.js dive/groundpound)
        if (!p.grounded && type !== 'aerial') return;

        // Aerial attacks use Player states
        if (!p.grounded && type === 'light') {
            // Convert airborne light to dive kick if falling
            if (p.velocity.y < -2 && p.startDiveKick) {
                p.startDiveKick();
                return;
            }
            return; // Can't do grounded light in air
        }

        if (type === 'light') {
            this.comboCount = (this.comboCount + 1) % 3;
            if (this.comboCount === 1) {
                this.state = COMBO_STATES.LIGHT_1;
            } else if (this.comboCount === 2) {
                this.state = COMBO_STATES.LIGHT_2;
            } else {
                // 3rd light becomes heavy finisher
                this.state = COMBO_STATES.FINISHER;
                this.comboCount = 0;
            }
        } else if (type === 'heavy') {
            this.state = COMBO_STATES.HEAVY;
            this.comboCount = 0;
        }

        this.stateTimer = this._getStateDuration();
        this.hitRegistered = false;

        if (window.audioManager && typeof window.audioManager.playSFX === 'function') {
            const pos = this.player ? this.player.position : null;
            window.audioManager.playSFX(type === 'heavy' ? 'heavy_swing' : 'light_swing', pos);
        }

        // Visual: brief camera nudge on attack start
        if (this.camera && type === 'heavy') {
            this._cameraNudge(0.15);
        }
    }

    _endAttack() {
        if (this.bufferedInput) {
            const next = this.bufferedInput;
            this.bufferedInput = null;
            this.bufferTimer = 0;
            this._startAttack(next);
        } else {
            this.state = COMBO_STATES.IDLE;
            this.stateTimer = 0;
            this.hitRegistered = false;
        }
    }

    _cancelAttack() {
        this.state = COMBO_STATES.IDLE;
        this.stateTimer = 0;
        this.hitRegistered = false;
        this.bufferedInput = null;
        this.bufferTimer = 0;
    }

    _checkCancels(input) {
        // Dash (Q) or Jump (Space) cancels any attack
        return input.wasPressed('KeyQ') || input.wasPressed('Space');
    }

    /* ------------------------------------------------------------------ */
    /*  Hit registration                                                  */
    /* ------------------------------------------------------------------ */

    _registerHitbox() {
        const p = this.player;
        if (!p || !this.hitboxSystem) return;

        const isHeavy = (this.state === COMBO_STATES.HEAVY || this.state === COMBO_STATES.FINISHER);
        const isFinisher = (this.state === COMBO_STATES.FINISHER);

        const dir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
        const offset = dir.clone().multiplyScalar(isHeavy ? 1.0 : 0.7);
        offset.y = 0.5;

        const radius = isHeavy ? 1.4 : 0.9;
        const damage = isFinisher ? 45 : (isHeavy ? 35 : 15);
        const duration = 0.12;

        // Emit hitbox request — main.js (which has Hitbox imported) creates the actual hitbox
        if (this.onHitbox) {
            this.onHitbox({
                owner: p,
                type: 'melee',
                shape: { type: 'sphere', radius },
                offset,
                duration,
                damage,
                isHeavy,
                isFinisher
            });
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Effects                                                           */
    /* ------------------------------------------------------------------ */

    triggerHitStop(duration = 0.06) {
        this.hitStopTimer = duration;
        if (window.audioManager && typeof window.audioManager.playSFX === 'function') {
            const pos = this.player ? this.player.position : null;
            window.audioManager.playSFX('hit_stop', pos);
        }
    }

    triggerCameraShake(intensity = 0.15, duration = 0.2) {
        if (this.camera && this.camera.userData) {
            this.camera.userData.shakeIntensity = intensity;
            this.camera.userData.shakeDuration = duration;
        }
    }

    _cameraNudge(amount) {
        if (!this.camera) return;
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * amount,
            (Math.random() - 0.5) * amount * 0.5,
            0
        );
        this.camera.position.add(offset);
    }

    _getStateDuration() {
        switch (this.state) {
            case COMBO_STATES.LIGHT_1: return this.lightDuration;
            case COMBO_STATES.LIGHT_2: return this.lightDuration;
            case COMBO_STATES.HEAVY: return this.heavyDuration;
            case COMBO_STATES.FINISHER: return this.finisherDuration;
            default: return 0;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Queries                                                           */
    /* ------------------------------------------------------------------ */

    isAttacking() {
        return this.state !== COMBO_STATES.IDLE;
    }

    canCancel() {
        // Can cancel after hitbox has already activated
        return this.hitRegistered;
    }
}
