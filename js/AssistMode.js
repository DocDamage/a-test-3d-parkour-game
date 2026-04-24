import * as THREE from 'three';

/**
 * AssistMode — accessibility modifiers that make parkour easier.
 *
 * Integration:
 *   const assist = new AssistMode();
 *   assist.setRisingTide(risingTide); // optional
 *   assist.toggle();                  // on / off
 *   // In your game loop:
 *   assist.update(dt, player);
 */
export class AssistMode {
    constructor() {
        this._active = false;
        this._risingTide = null;
        this._originals = new WeakMap(); // per-player backups
        this._uiBuilt = false;
        this._buildUI();
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                        */
    /* ------------------------------------------------------------------ */

    toggle() {
        this._active = !this._active;
        this._updateUI();
        return this._active;
    }

    isActive() {
        return this._active;
    }

    setRisingTide(risingTide) {
        this._risingTide = risingTide;
    }

    /** Tag an achievement name when assist is active. */
    tagAchievement(name) {
        return this._active ? `${name} (Assist)` : name;
    }

    /** Apply assist modifiers to a player instance. */
    modifyPlayer(player) {
        if (this._originals.has(player)) return; // already modified

        const backups = {
            VAULT_HEIGHT: player.VAULT_HEIGHT,
            SPEED_SPRINT: player.SPEED_SPRINT,
            JUMP_FORCE: player.JUMP_FORCE,
            _assistActive: player._assistActive,
        };

        // 1. Player constants
        player.VAULT_HEIGHT = 1.3; // already 1.3 in base, kept explicit
        // Coyote time is hard-coded (0.18) in Player.update — we intercept via setter
        // Knockback reduction is handled by wrapping velocity methods
        // Auto-vault expansion is handled in our update() wrapper

        // 2. Intercept coyoteTime assignment (Player sets exactly 0.18 when grounded)
        const self = this;
        const _rawCoyote = player.coyoteTime;
        Object.defineProperty(player, 'coyoteTime', {
            get() { return _rawCoyote; },
            set(v) {
                if (self._active && typeof v === 'number' && Math.abs(v - 0.18) < 0.001) {
                    v = 0.35;
                }
                _rawCoyote = v;
            },
        });
        backups._coyoteTimeSetter = Object.getOwnPropertyDescriptor(player, 'coyoteTime');

        // 3. Reduce hazard knockback by wrapping velocity.add / .copy
        backups._velAdd = player.velocity.add.bind(player.velocity);
        player.velocity.add = function (v) {
            if (self._active && v && v.isVector3) {
                const mag = v.length();
                if (mag > 3) {
                    v = v.clone().multiplyScalar(0.5);
                }
            }
            return backups._velAdd(v);
        };

        backups._velCopy = player.velocity.copy.bind(player.velocity);
        player.velocity.copy = function (v) {
            if (self._active && v && v.isVector3) {
                const mag = v.length();
                if (mag > 10) {
                    v = v.clone().multiplyScalar(0.5);
                }
            }
            return backups._velCopy(v);
        };

        // 4. Wrap player.update to inject auto-vault in WALK/IDLE/CROUCH
        backups._playerUpdate = player.update.bind(player);
        player.update = function (dt, input, yaw) {
            backups._playerUpdate(dt, input, yaw);
            // After base update, if grounded and not in special state, try auto-vault
            if (self._active && this.grounded &&
                (this.state === 'WALK' || this.state === 'IDLE' || this.state === 'CROUCH')) {
                const info = this.checkAutoVault ? this.checkAutoVault() : null;
                if (info) {
                    this.startVault(info);
                }
            }
        };

        // 5. Patch drones (2× longer detection)
        this._patchDrones(player, true);

        // 6. Patch Rising Tide if reference available
        this._patchRisingTide(true);

        player._assistActive = true;
        this._originals.set(player, backups);
    }

    /** Restore original player constants and behaviour. */
    restorePlayer(player) {
        const backups = this._originals.get(player);
        if (!backups) return;

        // Constants
        player.VAULT_HEIGHT = backups.VAULT_HEIGHT;
        player.SPEED_SPRINT = backups.SPEED_SPRINT;
        player.JUMP_FORCE = backups.JUMP_FORCE;
        player._assistActive = backups._assistActive;

        // Remove coyoteTime interceptor
        delete player.coyoteTime;
        player.coyoteTime = 0;

        // Restore velocity methods
        player.velocity.add = backups._velAdd;
        player.velocity.copy = backups._velCopy;

        // Restore update
        player.update = backups._playerUpdate;

        // Unpatch drones
        this._patchDrones(player, false);

        // Unpatch Rising Tide
        this._patchRisingTide(false);

        this._originals.delete(player);
    }

    /** Call every frame (after player.update is fine, or before). */
    update(dt, player) {
        if (!this._active) return;
        // Ensure coyote time stays extended if Player update overwrote it
        if (player.grounded && player.coyoteTime < 0.35) {
            player.coyoteTime = 0.35;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Internal — Drone Patching                                         */
    /* ------------------------------------------------------------------ */

    _patchDrones(player, enable) {
        const mgr = player.world && player.world.drones ? player.world.drones : null;
        if (!mgr || !mgr.drones) return;

        for (const drone of mgr.drones) {
            if (enable) {
                if (drone._assistOriginalUpdate) continue;
                drone._assistOriginalUpdate = drone.update.bind(drone);
                drone.update = function (dt, ply) {
                    const prevTic = this.timeInCone;
                    const prevDet = this.detection;
                    this._assistOriginalUpdate(dt, ply);
                    if (ply && ply._assistActive) {
                        // Halve detection build-up (2× longer to detect)
                        const ticDelta = this.timeInCone - prevTic;
                        if (ticDelta > 0) {
                            this.timeInCone = prevTic + ticDelta * 0.5;
                        }
                        const detDelta = this.detection - prevDet;
                        if (detDelta > 0) {
                            this.detection = prevDet + detDelta * 0.5;
                        }
                    }
                };
            } else {
                if (drone._assistOriginalUpdate) {
                    drone.update = drone._assistOriginalUpdate;
                    delete drone._assistOriginalUpdate;
                }
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Internal — Rising Tide Patching                                   */
    /* ------------------------------------------------------------------ */

    _patchRisingTide(enable) {
        const rt = this._risingTide;
        if (!rt) return;

        if (enable) {
            if (!rt._assistOriginalRiseSpeed) {
                rt._assistOriginalRiseSpeed = rt.riseSpeed;
            }
            if (!rt._assistOriginalSpawnPlatform) {
                rt._assistOriginalSpawnPlatform = rt._spawnPlatform.bind(rt);
            }
            // 30% slower sludge
            rt.riseSpeed = rt._assistOriginalRiseSpeed * 0.7;
            // Platforms spawn 20% closer (reduce the +5 offset)
            rt._spawnPlatform = function () {
                const y = this.player.position.y + 5 * 0.8 + Math.random() * 3;
                const x = (Math.random() - 0.5) * 30;
                const z = (Math.random() - 0.5) * 30;
                const geo = new THREE.BoxGeometry(2 + Math.random() * 2, 0.3, 2 + Math.random() * 2);
                const mat = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.8 });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(x, y, z);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                this.scene.add(mesh);
                this.platforms.push({ mesh });
                this.player.world.collidables.push(mesh);
                mesh.userData.size = { x: geo.parameters.width, y: geo.parameters.height, z: geo.parameters.depth };
            };
        } else {
            if (rt._assistOriginalRiseSpeed !== undefined) {
                rt.riseSpeed = rt._assistOriginalRiseSpeed;
            }
            if (rt._assistOriginalSpawnPlatform) {
                rt._spawnPlatform = rt._assistOriginalSpawnPlatform;
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /*  UI                                                                */
    /* ------------------------------------------------------------------ */

    _buildUI() {
        if (this._uiBuilt) return;
        this._uiBuilt = true;

        // Golden border overlay
        const border = document.createElement('div');
        border.id = 'assist-border';
        border.style.cssText =
            'position:fixed;inset:0;pointer-events:none;z-index:999;' +
            'box-shadow:inset 0 0 60px rgba(255,215,0,0.15), inset 0 0 8px rgba(255,215,0,0.25);' +
            'border:2px solid rgba(255,215,0,0.35);display:none;';
        document.body.appendChild(border);
        this._borderEl = border;

        // ASSIST badge
        const badge = document.createElement('div');
        badge.id = 'assist-badge';
        badge.style.cssText =
            'position:fixed;top:12px;left:12px;z-index:1000;' +
            'background:rgba(255,215,0,0.15);color:#ffd700;' +
            'font-family:monospace;font-size:12px;font-weight:bold;' +
            'padding:4px 10px;border:1px solid rgba(255,215,0,0.4);' +
            'border-radius:4px;letter-spacing:1px;text-shadow:0 0 6px rgba(255,215,0,0.6);' +
            'display:none;';
        badge.textContent = 'ASSIST';
        document.body.appendChild(badge);
        this._badgeEl = badge;
    }

    _updateUI() {
        if (!this._borderEl || !this._badgeEl) return;
        const d = this._active ? 'block' : 'none';
        this._borderEl.style.display = d;
        this._badgeEl.style.display = d;
    }
}
