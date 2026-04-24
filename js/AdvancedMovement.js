import * as THREE from 'three';

/**
 * AdvancedMovement
 * Hooks into Player to add:
 *  - Crouch Jump (slip-under hitbox reduction + squat visual)
 *  - Edge Boost (coyote-window ledge jump +15% h-velocity)
 *  - Climb Cancel (E during climb -> wall-kick back at 45°, speed 8)
 *  - Chain Vaulting (auto-chain vaults within 0.3s, +10% exit speed per link, max 3)
 */
export class AdvancedMovement {
    constructor(player, scene, audio, cameraController) {
        this.player = player;
        this.scene = scene;
        this.audio = audio;
        this.cameraController = cameraController;

        this.time = 0;

        // Previous frame snapshots
        this.prevState = player.state;
        this.prevGrounded = player.grounded;
        this.prevInputCrouch = false;
        this.prevInputJump = false;
        this.prevInputInteract = false;

        // Crouch Jump
        this.lastCrouchTime = -10;

        // Edge Boost
        this.edgeBoostFrames = 0;

        // Climb Cancel
        this.lastClimbData = null;

        // Chain Vaulting
        this.vaultChainCount = 0;
        this.vaultChainTimer = 0;
        this.preVaultSpeed = 0;
        this.vaultDir = new THREE.Vector3();
        this.pendingVault = null;

        // Visual FX
        this.sparks = [];
        this.trailBoostTimer = 0;
    }

    update(dt, input) {
        const p = this.player;
        this.time += dt;

        const crouch = input.isPressed('KeyC');
        const jump = input.isPressed('Space');
        const interact = input.isPressed('KeyE');

        const crouchJust = crouch && !this.prevInputCrouch;
        const jumpJust = jump && !this.prevInputJump;
        const interactJust = interact && !this.prevInputInteract;

        // ===== 1. Crouch Jump =====
        if (crouchJust) {
            this.lastCrouchTime = this.time;
        }

        if (this.prevState !== 'JUMP' && p.state === 'JUMP') {
            // Detect crouch-jump window
            if (this.time - this.lastCrouchTime <= 0.15) {
                this._applyCrouchJump();
            }
            // Edge boost also triggers on any jump entry while timer is active
            if (this.edgeBoostFrames > 0) {
                this._applyEdgeBoost();
                this.edgeBoostFrames = 0; // consume
            }
        }

        // ===== 2. Edge Boost =====
        const groundStates = ['IDLE', 'WALK', 'SPRINT', 'CROUCH'];
        if (this.prevGrounded && !p.grounded && groundStates.includes(this.prevState) && p.state === 'FALL') {
            this.edgeBoostFrames = 4; // 3-frame coyote window after the leave frame
        }
        if (this.edgeBoostFrames > 0) {
            this.edgeBoostFrames--;
        }

        // ===== 3. Climb Cancel =====
        if (interactJust) {
            if (p.state === 'CLIMB' && p.climbData) {
                this._applyClimbCancel(p.climbData);
            } else if (this.prevState === 'CLIMB' && this.lastClimbData) {
                // Fallback if Player.update already processed the drop to FALL
                this._applyClimbCancel(this.lastClimbData);
            }
        }
        // Cache climb data for fallback
        if (p.state === 'CLIMB' && p.climbData) {
            this.lastClimbData = p.climbData;
        }

        // ===== 4. Chain Vaulting =====
        this._updateChainVaulting(dt);

        // ===== FX =====
        this._updateEffects(dt);

        // Store previous frame data
        this.prevState = p.state;
        this.prevGrounded = p.grounded;
        this.prevInputCrouch = crouch;
        this.prevInputJump = jump;
        this.prevInputInteract = interact;
    }

    /* --------------------------------------------------------------- */

    _applyCrouchJump() {
        const p = this.player;
        // Reduce hitbox by 0.3 (slip-under obstacles)
        p.currentHeight = Math.max(0.3, p.currentHeight - 0.3);

        if (this.cameraController && this.cameraController.shake) {
            this.cameraController.shake(0.15, 0.15);
        }
        // Visual squat compression is handled automatically by Player.updateVisuals
        // because it scales the mesh to currentHeight / HEIGHT_STAND.
    }

    _applyEdgeBoost() {
        const p = this.player;
        const hSpeed = Math.sqrt(p.velocity.x ** 2 + p.velocity.z ** 2);
        if (hSpeed > 0.01) {
            p.velocity.x *= 1.15;
            p.velocity.z *= 1.15;
        } else {
            // No horizontal speed: give a tiny forward nudge
            const forward = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
            p.velocity.x = forward.x * 2;
            p.velocity.z = forward.z * 2;
        }

        this._spawnSpark(p.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0x00ffff, 0.25);
        if (this.cameraController && this.cameraController.shake) {
            this.cameraController.shake(0.2, 0.1);
        }
    }

    _applyClimbCancel(climbData) {
        if (!climbData) return;
        const p = this.player;

        // Convert drop into a wall-kick
        p.state = 'JUMP';
        p.climbData = null;

        // Backwards from wall (opposite of facing) at 45° upward, speed 8
        const speed = 8;
        const horiz = speed * Math.cos(Math.PI / 4);
        const vert = speed * Math.sin(Math.PI / 4);
        const back = new THREE.Vector3(-Math.sin(p.facing), 0, -Math.cos(p.facing)).normalize();

        p.velocity.set(back.x * horiz, vert, back.z * horiz);

        if (this.cameraController && this.cameraController.shake) {
            this.cameraController.shake(0.3, 0.25);
        }
        if (this.audio && this.audio.playJump) {
            this.audio.playJump();
        }
    }

    _updateChainVaulting(dt) {
        const p = this.player;

        // Just entered a vault
        if (this.prevState !== 'VAULT' && p.state === 'VAULT') {
            this.vaultChainCount = 0;
            this.vaultChainTimer = 0.3;
            // Player.startVault zeroes velocity, so capture pre-vault speed from prevVelocity
            this.preVaultSpeed = Math.sqrt(p.prevVelocity.x ** 2 + p.prevVelocity.z ** 2);
            this.vaultDir.set(Math.sin(p.facing), 0, Math.cos(p.facing));
            this.pendingVault = null;
        }

        // While vaulting, scan for the next vaultable object
        if (p.state === 'VAULT') {
            this.vaultChainTimer -= dt;
            if (this.vaultChainTimer > 0 && !this.pendingVault) {
                const auto = p.checkAutoVault();
                if (auto) {
                    const sameWall = p.vaultStartPos && auto.point.distanceTo(p.vaultStartPos) < 0.6;
                    if (!sameWall) {
                        this.pendingVault = auto;
                    }
                } else {
                    const wall = p.checkWallInFront();
                    if (wall && wall.canVault) {
                        const sameWall = p.vaultStartPos && wall.point.distanceTo(p.vaultStartPos) < 0.6;
                        if (!sameWall) {
                            this.pendingVault = wall;
                        }
                    }
                }
            }
        }

        // Vault ended this frame
        if (this.prevState === 'VAULT' && p.state !== 'VAULT') {
            if (this.pendingVault && this.vaultChainCount < 3) {
                this.vaultChainCount++;
                const mult = 1 + 0.1 * this.vaultChainCount;

                // Start next vault immediately (skips landing recovery)
                p.startVault(this.pendingVault);

                // Extend vault trajectory to reflect momentum gain
                const isMantle = !!this.pendingVault.isMantle;
                const duration = isMantle ? 0.3 : 0.4;
                const extraDist = p.SPEED_SPRINT * 0.1 * this.vaultChainCount * duration;

                if (p.vaultEndPos && p.vaultStartPos) {
                    if (isMantle) {
                        const dir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
                        p.vaultEndPos.add(dir.multiplyScalar(extraDist));
                    } else {
                        const dir = p.vaultEndPos.clone().sub(p.vaultStartPos).normalize();
                        if (dir.length() > 0.001) {
                            p.vaultEndPos.add(dir.multiplyScalar(extraDist));
                        }
                    }
                    p.vaultPeak += extraDist * 0.3;
                }

                // Reset window for another chain
                this.vaultChainTimer = 0.3;
                this.pendingVault = null;

                if (this.cameraController && this.cameraController.shake) {
                    this.cameraController.shake(0.1 * this.vaultChainCount, 0.1);
                }
                this.trailBoostTimer = 0.3;
            } else {
                // Chain finished – apply preserved momentum on exit
                if (this.vaultChainCount > 0) {
                    const mult = 1 + 0.1 * this.vaultChainCount;
                    const exitSpeed = Math.max(this.preVaultSpeed, p.SPEED_SPRINT) * mult;
                    p.velocity.x = this.vaultDir.x * exitSpeed;
                    p.velocity.z = this.vaultDir.z * exitSpeed;
                    p.velocity.y = 0;
                }
                this.vaultChainCount = 0;
                this.pendingVault = null;
            }
        }
    }

    /* --------------------------------------------------------------- */

    _spawnSpark(pos, color, duration) {
        const geo = new THREE.PlaneGeometry(0.25, 0.25);
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            depthTest: false
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        // Billboard toward camera if possible
        if (this.player && this.player.camera) {
            mesh.lookAt(this.player.camera.position);
        } else {
            mesh.rotation.x = -Math.PI / 2;
        }
        this.scene.add(mesh);
        this.sparks.push({ mesh, timer: duration, maxTime: duration });
    }

    _updateEffects(dt) {
        // Sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];
            s.timer -= dt;
            const t = Math.max(0, s.timer / s.maxTime);
            s.mesh.material.opacity = t * 0.9;
            s.mesh.scale.setScalar(1 + (1 - t) * 3);
            if (s.timer <= 0) {
                this.scene.remove(s.mesh);
                s.mesh.geometry.dispose();
                s.mesh.material.dispose();
                this.sparks.splice(i, 1);
            }
        }

        // Trail intensity boost
        if (this.trailBoostTimer > 0) {
            this.trailBoostTimer -= dt;
            const intensity = Math.max(0, this.trailBoostTimer / 0.3);
            const p = this.player;
            if (p.trailMeshes) {
                for (let i = 0; i < p.trailMeshes.length; i++) {
                    const m = p.trailMeshes[i];
                    if (m && m.material) {
                        m.material.opacity = Math.max(m.material.opacity, intensity * (0.35 + 0.04 * i));
                        m.visible = true;
                    }
                }
            }
        }
    }
}
