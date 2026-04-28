import * as THREE from 'three';
import { PlayerAnimationController } from './PlayerAnimationController.js';
import { Trajectory } from './Trajectory.js';
import { GrapplingHook } from './GrapplingHook.js';
import { ComboSystem } from './ComboSystem.js';
import { WallKickSystem } from './WallKickSystem.js';
import { SlideJumpSystem } from './SlideJumpSystem.js';
import { MantleSystem } from './MantleSystem.js';
import { SlopeGrindSystem } from './SlopeGrindSystem.js';
import { TicTacSystem } from './TicTacSystem.js';
import { AirDodgeSystem } from './AirDodgeSystem.js';
import { DoubleJumpSystem } from './DoubleJumpSystem.js';
import { CornerKickSystem } from './CornerKickSystem.js';
import { DiveRollSystem } from './DiveRollSystem.js';
import { createBunnyHopFlashMesh, createScreenGlowMesh, createTrailMeshes, updateScreenGlow, updateTrail } from './PlayerVisualEffects.js';
/**
 * IDLE/WALK/SPRINT/CROUCH -> JUMP (Space, grounded)
 * IDLE/WALK/SPRINT/CROUCH -> SLIDE (C while sprinting)
 * IDLE/WALK/SPRINT/CROUCH -> FALL (walk off edge)
 * SPRINT -> VAULT (auto into low obstacle)
 * JUMP/FALL -> CLIMB (Space near climbable wall)
 * JUMP/FALL -> WALLRUN (sprint into wall at shallow angle)
 * JUMP/FALL -> HANG (auto near ledge while falling)
 * JUMP/FALL -> VAULT (Space near low wall, or auto mantle)
 * JUMP/FALL -> GRAPPLE_AIM (hold Mouse2)
 * GRAPPLE_AIM -> GRAPPLE_SWING / GRAPPLE_RETRACT (release Mouse2 with valid anchor)
 * CLIMB -> JUMP (Space, push off wall)
 * CLIMB -> FALL (E or edge of wall)
 * CLIMB -> VAULT (reach top, auto mantle)
 * Advanced states include wallrun, hang, roll, stumble, tic-tac, ragdoll.
 */

export class Player {
    constructor(scene, world, camera, audio = null, cameraController = null) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;
        this.audio = audio;
        this.cameraController = cameraController;

        // Constants
        this.RADIUS = 0.35;
        this.HEIGHT_STAND = 1.7;
        this.HEIGHT_CROUCH = 0.9;
        this.HEIGHT_SLIDE = 0.5;
        this.SPEED_WALK = 5;
        this.SPEED_SPRINT = 10;
        this.SPEED_CROUCH = 2.5;
        this.SPEED_CLIMB = 3.5;
        this.JUMP_FORCE = 10.5;
        this.GRAVITY = -26;
        this.VAULT_HEIGHT = 1.3;
        this.CLIMB_HEIGHT = 5;

        // New mechanic constants
        this.WALLRUN_MAX_TIME = 1.5;
        this.WALLRUN_GRAVITY = -3;
        this.AIR_DASH_FORCE = 15;
        this.HANG_SHIMMY_SPEED = 2.5;
        this.ROLL_DURATION = 0.4;
        this.STUMBLE_DURATION = 0.6;
        this.RAGDOLL_DURATION = 2.0;
        this.MIN_FALL_FOR_ROLL = 3.0;
        this.RAGDOLL_MIN_SPEED = 12;

        // State
        this.position = new THREE.Vector3(0, 1, 10);
        this.velocity = new THREE.Vector3();
        this.prevVelocity = new THREE.Vector3();
        this.facing = 0;
        this.currentHeight = this.HEIGHT_STAND;
        this.state = 'IDLE';
        this.grounded = false;

        // Timers & buffers
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        this.slideTimer = 0;
        this.vaultTimer = 0;
        this.vaultIsMantle = false;
        this.stepTimer = 0;
        this.rollInputTimer = 0;

        // New mechanic state
        this.airDashUsed = false;
        this.wallRunTimer = 0;
        this.wallRunData = null;
        this.hangData = null;
        this.fallStartY = 0;
        this.rollTimer = 0;
        this.stumbleTimer = 0;
        this.ragdollTimer = 0;
        this.lastSafePosition = new THREE.Vector3(0, 2, 10);
        this.ragdollAngularVelocity = new THREE.Vector3();

        // Data
        this.climbData = null;
        this.vaultStartPos = new THREE.Vector3();
        this.vaultEndPos = new THREE.Vector3();
        this.vaultPeak = 0;
        this.wasSprinting = false;

        // Bunny hop / strafe jump state
        this.justLandedTimer = 0;
        this.preLandingHSpeed = 0;
        this.bunnyHopFlashTimer = 0;

        // Tic-tac state
        this.ticTacCount = 0;
        this.ticTacLastSide = null;

        // Subsystems
        this.grapplingHook = new GrapplingHook(scene, this, world);
        this.comboSystem = new ComboSystem();
        this.wallKickSystem = new WallKickSystem(this, this.staminaSystem);
        this.slideJumpSystem = new SlideJumpSystem(this);
        this.mantleSystem = new MantleSystem(this);
        this.slopeGrindSystem = new SlopeGrindSystem(this, null);
        this.ticTacSystem = new TicTacSystem(this);
        this.airDodgeSystem = new AirDodgeSystem(this, this.staminaSystem);
        this.doubleJumpSystem = new DoubleJumpSystem(this);
        this.cornerKickSystem = new CornerKickSystem(this);
        this.diveRollSystem = new DiveRollSystem(this, this.staminaSystem);

        // Health / damage system
        this.maxHealth = 100;
        this.health = 100;
        this.shield = 0;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.isDead = false;
        this.isInvisible = false;
        this.moveSpeedMultiplier = 1.0;
        this._damageMultiplier = 1.0;
        this._regenPerSecond = 0;
        this._staggerImmune = false;
        this._firewallActive = false;
        this._predatorVisionActive = false;
        this._respawnHPBonus = 0;
        this._critBonusFromPredator = 0;
        this._parryWindow = 0;
        this._parryCooldown = 0;
        this.onPerfectParry = null;
        this._shield = 0;          // Aegis Field absorb pool (set by onPerfectParry)
        this._shieldTimer = 0;     // Duration remaining for the shield

        // Defensive mechanics
        this._dodgeWindow = 0;      // perfect dodge i-frame window
        this._dodgeCooldown = 0;
        this._knockbackTimer = 0;
        this._knockbackRecoveryReady = false;
        this._slideTackleTriggered = false;
        this._wallKickTimer = 0;
        this._slideJumpTimer = 0;
        this._isSlideJumping = false;
        this._mantleTimer = 0;
        this._tacticalRollBuffer = 0;
        this._coyoteFlashTimer = 0;
        this._wasCoyoteFlashing = false;
        this._perfectDodgeCounter = 0;

        // Parkour melee callbacks
        this.onSlideTackle = null;
        this.onLedgeTakedown = null;
        this.onCeilingDrop = null;

        // Ceiling run / magnet boots
        this.ceilingRunData = null;
        this.CEILING_ATTACH_RANGE = 2.5;
        this.CEILING_RUN_SPEED = 4;

        // Platform grab / shield
        this.platformGrabData = null;
        this._platformShieldActive = false;
        this._platformShieldAbsorb = 0;

        // RPG system hook
        this.characterSheet = null;
        this.staminaSystem = null;

        // Death rewind snapshots
        this._rewindBuffer = [];
        this._rewindSnapshotTimer = 0;
        this.REWIND_SNAPSHOT_INTERVAL = 0.5;
        this.REWIND_WINDOW = 3.0;

        // Visuals
        this.mesh = this.createMesh();
        this._baseMesh = this.mesh;
        this._customVisual = null;
        this._customAnimation = null;
        this._customVisualScale = 1;
        this.shadow = this.createShadow();
        this.trajectory = new Trajectory(scene);

        // Effect meshes
        this.bunnyHopFlashMesh = createBunnyHopFlashMesh(this);
        this.screenGlowMesh = createScreenGlowMesh(this);
        this.trailMeshes = createTrailMeshes(this);
        this.trailHistory = [];
    }

    createMesh() {
        const group = new THREE.Group();

        const suitMat = new THREE.MeshStandardMaterial({ color: 0x2266cc, roughness: 0.6 });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x111133, roughness: 0.7 });
        this._suitMaterial = suitMat;
        this._skinMaterial = skinMat;
        this._darkMaterial = darkMat;

        // Torso
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.65, 8), suitMat);
        torso.position.y = 0.85;
        torso.castShadow = true;
        group.add(torso);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), skinMat);
        head.position.y = 1.4;
        head.castShadow = true;
        group.add(head);

        // Cap/helmet
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), darkMat);
        cap.position.y = 1.4;
        group.add(cap);

        // Arms
        const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.55, 6);
        this.leftArm = new THREE.Mesh(armGeo, suitMat);
        this.leftArm.position.set(-0.32, 0.9, 0);
        this.leftArm.castShadow = true;
        group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeo, suitMat);
        this.rightArm.position.set(0.32, 0.9, 0);
        this.rightArm.castShadow = true;
        group.add(this.rightArm);

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.75, 8);
        this.leftLeg = new THREE.Mesh(legGeo, darkMat);
        this.leftLeg.position.set(-0.14, 0.38, 0);
        this.leftLeg.castShadow = true;
        group.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, darkMat);
        this.rightLeg.position.set(0.14, 0.38, 0);
        this.rightLeg.castShadow = true;
        group.add(this.rightLeg);

        this.scene.add(group);
        return group;
    }

    setVisualModel(model, options = {}) {
        if (!model) return false;
        if (this._customVisual) {
            this.mesh.remove(this._customVisual);
        }
        for (const child of [...this._baseMesh.children]) {
            child.visible = false;
        }
        model.position.set(0, options.yOffset ?? 0, 0);
        model.rotation.set(0, options.rotationY ?? Math.PI, 0);
        const scale = options.scale ?? 1;
        model.scale.setScalar(scale);
        model.traverse(obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = false;
            }
        });
        this._baseMesh.add(model);
        this._customVisual = model;
        this._customAnimation = new PlayerAnimationController(model, this);
        this._customVisualScale = scale;
        return true;
    }

    clearVisualModel() {
        if (this._customVisual) {
            this.mesh.remove(this._customVisual);
            this._customVisual = null;
            this._customAnimation = null;
        }
        for (const child of [...this._baseMesh.children]) {
            child.visible = true;
        }
    }

    createShadow() {
        const geo = new THREE.CircleGeometry(0.4, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.02;
        this.scene.add(mesh);
        return mesh;
    }

    update(dt, input, cameraYaw) {
        // Sync max health from character sheet gear bonuses
        this._syncMaxHealth();

        // NOTE: preUpdate() is called once per frame in main.js — do NOT add another here

        this.facing = cameraYaw;
        const moveDir = this.getMoveDir(input, cameraYaw);

        // Track previous velocity and grounded state
        this.prevVelocity.copy(this.velocity);
        this.prevGrounded = this.grounded;

        // Update timers
        if (this.grounded) {
            this.coyoteTime = 0.18;
        } else {
            this.coyoteTime = Math.max(0, this.coyoteTime - dt);
        }

        // Coyote jump indicator
        if (this.coyoteTime > 0 && !this.grounded && this.mesh && this.mesh.material) {
            const flash = Math.sin(performance.now() * 0.02) * 0.15 + 0.15;
            this.mesh.material.emissive = this.mesh.material.emissive || new THREE.Color(0x000000);
            this.mesh.material.emissive.setHex(0xff6600);
            this.mesh.material.emissiveIntensity = flash;
        } else if (this.mesh && this.mesh.material && this.mesh.material.emissive && this.mesh.material.emissive.getHex() === 0xff6600) {
            this.mesh.material.emissive.setHex(0x000000);
            this.mesh.material.emissiveIntensity = 0;
        }

        if (input.isPressed('Space')) {
            this.jumpBuffer = 0.15;
        } else {
            this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
        }

        this.rollInputTimer = Math.max(0, this.rollInputTimer - dt);
        if (input.isPressed('KeyC') && !this.grounded) {
            this.rollInputTimer = 0.3;
        }

        this._tacticalRollBuffer = Math.max(0, this._tacticalRollBuffer - dt);
        if (input.isPressed('KeyC') && !this.grounded) {
            this._tacticalRollBuffer = 0.15;
        }

        this.justLandedTimer = Math.max(0, this.justLandedTimer - dt);
        this.bunnyHopFlashTimer = Math.max(0, this.bunnyHopFlashTimer - dt);

        // Parry timers
        if (this._parryWindow > 0) this._parryWindow = Math.max(0, this._parryWindow - dt);
        if (this._parryCooldown > 0) this._parryCooldown = Math.max(0, this._parryCooldown - dt);
        if (this._shieldTimer > 0) {
            this._shieldTimer = Math.max(0, this._shieldTimer - dt);
            if (this._shieldTimer <= 0) this._shield = 0;
        }

        // Dodge / defensive timers
        if (this._dodgeWindow > 0) this._dodgeWindow = Math.max(0, this._dodgeWindow - dt);
        if (this._dodgeCooldown > 0) this._dodgeCooldown = Math.max(0, this._dodgeCooldown - dt);
        if (this._perfectDodgeCounter > 0) this._perfectDodgeCounter = Math.max(0, this._perfectDodgeCounter - dt);
        if (this._knockbackTimer > 0) {
            this._knockbackTimer -= dt;
            if (this._knockbackTimer <= 0) {
                this._knockbackTimer = 0;
                if (this.state === 'KNOCKBACK') this.state = 'IDLE';
            }
        }

        // Update subsystems
        this.comboSystem.update(dt, this.grounded);
        this.wallKickSystem.update(dt, input);
        this.slideJumpSystem.update(dt, input);
        this.mantleSystem.update(dt, input);
        this.slopeGrindSystem.update(dt, input);
        this.ticTacSystem.update(dt, input);
        this.airDodgeSystem.update(dt, input);
        this.doubleJumpSystem.update(dt);
        this.cornerKickSystem.update(dt);
        this.diveRollSystem.update(dt, input);

        // Passive health regen
        if (this._regenPerSecond > 0 && this.health < this.maxHealth && !this.isDead) {
            this.health = Math.min(this.maxHealth, this.health + this._regenPerSecond * dt);
        }

        // State machine
        switch (this.state) {
            case 'IDLE':
            case 'WALK':
            case 'SPRINT':
            case 'CROUCH':
                this.updateGrounded(dt, input, moveDir);
                break;
            case 'JUMP':
            case 'FALL':
                this.updateAirborne(dt, input, moveDir);
                break;
            case 'CLIMB':
                this.updateClimbing(dt, input);
                break;
            case 'SLIDE':
                this.updateSliding(dt, input);
                break;
            case 'VAULT':
                this.updateVaulting(dt);
                break;
            case 'WALLRUN':
                this.updateWallRun(dt, input);
                break;
            case 'HANG':
                this.updateHang(dt, input);
                break;
            case 'ROLL':
                this.updateRoll(dt, input);
                break;
            case 'STUMBLE':
                this.updateStumble(dt, input);
                break;
            case 'RAGDOLL':
                this.updateRagdoll(dt);
                break;
            case 'DIVE_KICK':
                this.updateDiveKick(dt);
                break;
            case 'GROUND_POUND':
                this.updateGroundPound(dt);
                break;
            case 'KNOCKBACK':
                // Knockback Recovery: press Space to flip out of knockback
                if (input.wasPressed('Space')) {
                    this._knockbackRecoveryReady = true;
                    this.velocity.y = Math.max(this.velocity.y, 6);
                    this.state = 'JUMP';
                }
                break;
            case 'GRAPPLE_AIM':
                this.updateGrappleAim(dt, input);
                break;
            case 'GRAPPLE_SWING':
                this.updateGrappleSwing(dt, input);
                break;
            case 'GRAPPLE_RETRACT':
                this.updateGrappleRetract(dt, input);
                break;
            case 'CEILING_RUN':
                this.updateCeilingRun(dt, input);
                break;
            case 'PLATFORM_GRAB':
                this.updatePlatformGrab(dt, input);
                break;
            case 'WALLKICK':
                this.updateWallKick(dt);
                break;
            case 'SLIDE_JUMP':
                this.updateSlideJump(dt, input);
                break;
            case 'MANTLE':
                this.updateMantle(dt);
                break;
            case 'GRIND':
                this.updateGrind(dt, input);
                break;
        }

        // Apply gravity (skip special states)
        if (!this.grounded && this.state !== 'CLIMB' && this.state !== 'VAULT' && this.state !== 'HANG' &&
            this.state !== 'GRAPPLE_AIM' && this.state !== 'GRAPPLE_SWING' && this.state !== 'GRAPPLE_RETRACT' &&
            this.state !== 'DIVE_KICK' && this.state !== 'GROUND_POUND' &&
            this.state !== 'CEILING_RUN' && this.state !== 'WALLKICK' && this.state !== 'MANTLE') {
            this.velocity.y += this.GRAVITY * dt;
            this.velocity.y = Math.max(this.velocity.y, -25);
        }

        // Apply velocity to position
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        // Collision resolution (skip vault, ragdoll and mantle)
        if (this.state !== 'VAULT' && this.state !== 'RAGDOLL' && this.state !== 'MANTLE') {
            this.resolveCollisions();
        }

        // Ground check
        this.checkGround();

        // Ground state transitions
        if (this.grounded) {
            if (this.state === 'JUMP' || this.state === 'FALL' || this.state === 'SLIDE_JUMP') {
                this.tryRollLanding();
                if (this.state !== 'ROLL' && this.state !== 'STUMBLE') {
                    this.state = 'IDLE';
                    this.velocity.y = 0;
                    // Bunny hop landing window
                    this.justLandedTimer = 0.15;
                    this.preLandingHSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
                }
            }
        } else {
            if (['IDLE', 'WALK', 'SPRINT', 'CROUCH', 'GRIND'].includes(this.state)) {
                this.state = 'FALL';
            }
        }

        // Track safe position for respawn
        if (this.grounded && ['IDLE', 'WALK', 'SPRINT', 'CROUCH'].includes(this.state)) {
            this.lastSafePosition.copy(this.position);
        }

        // Death rewind snapshot ring buffer
        if (!this.isDead) {
            this._rewindSnapshotTimer -= dt;
            if (this._rewindSnapshotTimer <= 0) {
                this._rewindSnapshotTimer = this.REWIND_SNAPSHOT_INTERVAL;
                this._rewindBuffer.push({
                    position: this.position.clone(),
                    health: this.health,
                    time: performance.now()
                });
            }
            const cutoff = performance.now() - this.REWIND_WINDOW * 1000;
            while (this._rewindBuffer.length > 0 && this._rewindBuffer[0].time < cutoff) {
                this._rewindBuffer.shift();
            }
        }

        // Update trajectory prediction
        this.trajectory.update(this, this.world);

        // Update visuals
        this.updateVisuals(dt, moveDir, input);
        updateTrail(this, dt);
        updateScreenGlow(this);

        // Respawn if fell out of world
        if (this.position.y < -20) {
            this.respawn();
        }
    }

    getMoveDir(input, cameraYaw) {
        const dir = new THREE.Vector3();
        if (input.isPressed('KeyW')) dir.z -= 1;
        if (input.isPressed('KeyS')) dir.z += 1;
        if (input.isPressed('KeyA')) dir.x -= 1;
        if (input.isPressed('KeyD')) dir.x += 1;
        if (dir.length() > 0) dir.normalize();
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
        return dir;
    }

    updateGrounded(dt, input, moveDir) {
        // Handle height transitions
        let targetHeight = this.HEIGHT_STAND;

        if (input.isPressed('KeyC')) {
            targetHeight = this.HEIGHT_CROUCH;
        }

        if (!input.isPressed('KeyC') && this.state === 'CROUCH') {
            if (!this.canStand()) {
                targetHeight = this.HEIGHT_CROUCH;
            }
        }

        this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, targetHeight, dt * 12);

        // Sprint tracking
        if (input.isPressed('ShiftLeft') && moveDir.length() > 0.5 && targetHeight === this.HEIGHT_STAND) {
            this.wasSprinting = true;
        } else if (moveDir.length() < 0.1) {
            this.wasSprinting = false;
        }

        // Determine speed and state
        let speed = this.SPEED_WALK;
        let nextState = moveDir.length() > 0.1 ? 'WALK' : 'IDLE';

        if (input.isPressed('ShiftLeft') && moveDir.length() > 0.5 && targetHeight === this.HEIGHT_STAND && (!this.staminaSystem || this.staminaSystem.canSprint())) {
            speed = this.SPEED_SPRINT;
            nextState = 'SPRINT';
        } else if (targetHeight === this.HEIGHT_CROUCH) {
            speed = this.SPEED_CROUCH;
            nextState = 'CROUCH';
        }

        // Apply flow speed boost
        speed *= this.comboSystem.getFlowBoost();
        speed *= this.moveSpeedMultiplier;

        // Slide initiation
        if (input.isPressed('KeyC') && this.wasSprinting && this.state === 'SPRINT') {
            this.startSlide(moveDir);
            return;
        }

        // Auto-vault when sprinting into low obstacles
        if (this.state === 'SPRINT') {
            const vaultInfo = this.checkAutoVault();
            if (vaultInfo) {
                this.startVault(vaultInfo);
                return;
            }
        }

        // Jump / Vault
        if (this.jumpBuffer > 0) {
            this.jumpBuffer = 0;

            const wallInfo = this.checkWallInFront();
            if (wallInfo && wallInfo.canVault) {
                this.startVault(wallInfo);
                return;
            }

            if (this.grounded || this.coyoteTime > 0) {
                this.startJump(input);
                return;
            }
        }

        // Grapple aim initiation from grounded
        if (input.isPressed('Mouse2') && this.grapplingHook.state !== 'AIM') {
            if (this.grapplingHook.startAim()) {
                this.state = 'GRAPPLE_AIM';
                return;
            }
        }

        // Apply horizontal movement with acceleration
        const targetVel = moveDir.multiplyScalar(speed);
        const accel = this.grounded ? 22 : 10;
        this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVel.x, dt * accel);
        this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVel.z, dt * accel);

        // Apply friction when no input
        if (moveDir.length() < 0.1 && this.grounded) {
            this.velocity.x *= (1 - dt * 14);
            this.velocity.z *= (1 - dt * 14);
            if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
            if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
        }

        // Footstep audio
        if (this.audio && this.grounded && moveDir.length() > 0.1 && this.state !== 'SLIDE') {
            this.stepTimer += dt;
            const interval = this.state === 'SPRINT' ? 0.28 : this.state === 'CROUCH' ? 0.6 : 0.45;
            if (this.stepTimer >= interval) {
                this.stepTimer -= interval;
                const material = this.audio.detectSurface(this.position);
                this.audio.playFootstep(material, this.state === 'SPRINT' ? 1.2 : 0.7);
            }
        } else {
            this.stepTimer = 0;
        }

        this.state = nextState;
    }

    updateAirborne(dt, input, moveDir) {
        // Track fall start height
        if (this.state === 'JUMP') {
            this.fallStartY = Math.max(this.fallStartY, this.position.y);
        }

        // Air control with flow boost - high responsiveness for strafe jumps
        const airControl = 12;
        const airSpeed = this.SPEED_SPRINT * 1.1 * this.comboSystem.getFlowBoost() * this.moveSpeedMultiplier;
        const targetVel = moveDir.multiplyScalar(airSpeed);
        this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVel.x, dt * airControl);
        this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVel.z, dt * airControl);
        
        // Counter-strafe bonus: changing direction in air gives a slight boost
        if (moveDir.length() > 0.3) {
            const currentDir = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).normalize();
            const dot = currentDir.dot(moveDir);
            if (dot < -0.2) {
                this.velocity.x += moveDir.x * 3 * dt;
                this.velocity.z += moveDir.z * 3 * dt;
            }
        }

        // Air dash (handled by SkillSystem in Phase 2)
        // if (input.isPressed('KeyQ') && !this.airDashUsed) {
        //     this.startAirDash(moveDir);
        // }

        // Grapple aim initiation while airborne
        if (input.isPressed('Mouse2') && this.grapplingHook.state !== 'AIM') {
            if (this.grapplingHook.startAim()) {
                this.state = 'GRAPPLE_AIM';
                return;
            }
        }

        // Check for wall interactions
        if (this.jumpBuffer > 0) {
            this.jumpBuffer = 0;

            // Double jump
            if (this.doubleJumpSystem.tryDoubleJump(true)) {
                return;
            }

            // Tic-tac takes priority
            const wallInfo = this.checkWallInFront();
            if (wallInfo && this.ticTacSystem.tryTicTac(wallInfo.normal, true)) {
                return;
            }

            // Corner kick
            const nearbyNormals = this._getNearbyWallNormals();
            if (this.cornerKickSystem.tryCornerKick(nearbyNormals, true)) {
                return;
            }

            // Prioritize ledge hang when falling
            if (this.velocity.y < -0.5) {
                const hangInfo = this.checkLedgeHang();
                if (hangInfo) {
                    this.startHang(hangInfo);
                    return;
                }
            }

            if (wallInfo) {
                if (wallInfo.canClimb) {
                    this.startClimb(wallInfo);
                    return;
                } else if (wallInfo.canVault) {
                    this.startVault(wallInfo);
                    return;
                }
            }
        }

        // Auto wall-run detection while sprinting
        if (this.state === 'JUMP' && this.wasSprinting) {
            const wallRunInfo = this.checkWallRun();
            if (wallRunInfo) {
                this.startWallRun(wallRunInfo);
                return;
            }
        }

        // Auto ledge hang when falling near ledge
        if (this.velocity.y < -1 && !this.hangData) {
            const hangInfo = this.checkLedgeHang();
            if (hangInfo) {
                this.startHang(hangInfo);
                return;
            }
        }

        this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, this.HEIGHT_STAND, dt * 5);
    }

    updateClimbing(dt, input) {
        const up = input.isPressed('KeyW') ? 1 : input.isPressed('KeyS') ? -1 : 0;
        const side = input.isPressed('KeyD') ? 1 : input.isPressed('KeyA') ? -1 : 0;

        this.position.y += up * this.SPEED_CLIMB * dt;

        const wallRight = new THREE.Vector3(0, 1, 0).cross(this.climbData.normal).normalize();
        this.position.add(wallRight.multiplyScalar(side * this.SPEED_CLIMB * dt));

        const toPoint = new THREE.Vector3().subVectors(this.position, this.climbData.point);
        const dist = toPoint.dot(this.climbData.normal);
        const offset = this.climbData.normal.clone().multiplyScalar(dist - (this.RADIUS + 0.05));
        this.position.sub(offset);

        if (this.jumpBuffer > 0) {
            this.jumpBuffer = 0;
            this.state = 'JUMP';

            const pushDir = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
            if (input.isPressed('KeyA')) {
                pushDir.add(wallRight.clone().negate().multiplyScalar(0.7));
            } else if (input.isPressed('KeyD')) {
                pushDir.add(wallRight.multiplyScalar(0.7));
            }
            pushDir.normalize().multiplyScalar(6);
            this.velocity.set(pushDir.x, this.JUMP_FORCE * 0.7, pushDir.z);
            this.climbData = null;
            return;
        }

        if (input.isPressed('KeyE')) {
            this.state = 'FALL';
            this.climbData = null;
            return;
        }

        if (this.position.y + this.currentHeight > this.climbData.wallTop - 0.1) {
            this.startVault({
                isMantle: true,
                wallTop: this.climbData.wallTop,
                point: this.climbData.point,
                normal: this.climbData.normal
            });
            return;
        }

        if (this.position.y <= this.climbData.wallBottom + 0.1) {
            this.state = 'IDLE';
            this.grounded = true;
            this.climbData = null;
            return;
        }

        if (!this.isStillOnWall()) {
            this.state = 'FALL';
            this.climbData = null;
        }
    }

    updateSliding(dt, input) {
        this.slideTimer -= dt;
        this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, this.HEIGHT_SLIDE, dt * 15);

        const friction = 5;
        this.velocity.x *= (1 - dt * friction);
        this.velocity.z *= (1 - dt * friction);

        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);

        // Slide Tackle: one hitbox trigger per slide when moving fast
        if (!this._slideTackleTriggered && speed > 4 && this.onSlideTackle) {
            this._slideTackleTriggered = true;
            this.onSlideTackle(this.position.clone(), this.facing);
        }

        if (speed < 2 || this.slideTimer <= 0 || !input.isPressed('KeyC')) {
            if (this.audio) this.audio.playSlide(false);
            this.state = 'CROUCH';
            this.currentHeight = this.HEIGHT_CROUCH;
            this._slideTackleTriggered = false;
        }
    }

    updateVaulting(dt) {
        this.vaultTimer -= dt;
        const duration = this.vaultIsMantle ? 0.3 : 0.4;
        const progress = Math.min(1, 1 - (this.vaultTimer / duration));

        const x = THREE.MathUtils.lerp(this.vaultStartPos.x, this.vaultEndPos.x, progress);
        const z = THREE.MathUtils.lerp(this.vaultStartPos.z, this.vaultEndPos.z, progress);

        const baseY = THREE.MathUtils.lerp(this.vaultStartPos.y, this.vaultEndPos.y, progress);
        const maxY = Math.max(this.vaultStartPos.y, this.vaultEndPos.y);
        const arc = Math.sin(progress * Math.PI) * Math.max(0, this.vaultPeak - maxY);
        const y = baseY + arc;

        this.position.set(x, y, z);
        this.velocity.set(0, 0, 0);

        if (this.vaultTimer <= 0) {
            this.state = 'IDLE';
            this.grounded = true;
            this.velocity.y = 0;
        }
    }

    updateWallRun(dt, input) {
        this.wallRunTimer -= dt;

        const up = input.isPressed('KeyW') ? 1 : input.isPressed('KeyS') ? -1 : 0;

        const tangent = this.wallRunData.tangent.clone();
        const speed = this.SPEED_SPRINT * this.comboSystem.getFlowBoost() * this.moveSpeedMultiplier;

        this.velocity.copy(tangent.multiplyScalar(speed));
        this.velocity.y = up * 3;
        this.velocity.y += this.WALLRUN_GRAVITY * dt;

        const toPoint = new THREE.Vector3().subVectors(this.position, this.wallRunData.point);
        const dist = toPoint.dot(this.wallRunData.normal);
        const offset = this.wallRunData.normal.clone().multiplyScalar(dist - (this.RADIUS + 0.05));
        this.position.sub(offset);

        if (this.jumpBuffer > 0) {
            this.jumpBuffer = 0;
            this.state = 'JUMP';
            const away = this.wallRunData.normal.clone().multiplyScalar(7);
            this.velocity.set(away.x * 1.4, this.JUMP_FORCE * 1.05, away.z * 1.4);
            this.wallRunData = null;
            this.wallKickJump();
            if (this.audio) this.audio.playJump();
            return;
        }

        if (this.wallRunTimer <= 0 || !input.isPressed('ShiftLeft') || this.velocity.y < -5) {
            this.state = 'FALL';
            this.wallRunData = null;
        }
    }

    updateHang(dt, input) {
        const side = input.isPressed('KeyD') ? 1 : input.isPressed('KeyA') ? -1 : 0;

        const wallRight = new THREE.Vector3(0, 1, 0).cross(this.hangData.normal).normalize();
        this.position.add(wallRight.multiplyScalar(side * this.HANG_SHIMMY_SPEED * dt));

        const handPos = this.hangData.point.clone();
        handPos.y = this.hangData.wallTop - 1.3;
        const stickPos = handPos.clone().add(this.hangData.normal.clone().multiplyScalar(this.RADIUS + 0.05));
        this.position.x = stickPos.x;
        this.position.z = stickPos.z;
        this.position.y = this.hangData.wallTop - 1.3;
        this.velocity.set(0, 0, 0);

        if (input.isPressed('KeyW') || this.jumpBuffer > 0) {
            this.jumpBuffer = 0;
            if (this.canStandAt(this.hangData.wallTop)) {
                this.startVault({
                    isMantle: true,
                    wallTop: this.hangData.wallTop,
                    point: this.hangData.point,
                    normal: this.hangData.normal
                });
                this.hangData = null;
            }
            return;
        }

        if (input.isPressed('KeyS') || input.isPressed('KeyE')) {
            // Ledge Takedown: if enemy is near below ledge, pull them down
            if (input.isPressed('KeyE') && this.onLedgeTakedown) {
                this.onLedgeTakedown(this.position.clone(), this.facing, this.hangData);
            }
            this.state = 'FALL';
            this.hangData = null;
            return;
        }

        if (!this.isStillOnLedge()) {
            this.state = 'FALL';
            this.hangData = null;
        }
    }

    updateRoll(dt, input) {
        this.rollTimer -= dt;
        this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, this.HEIGHT_SLIDE, dt * 20);

        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        if (speed < 4) {
            const forward = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
            this.velocity.x += forward.x * 8 * dt;
            this.velocity.z += forward.z * 8 * dt;
        }

        // Rolling Thunder: invincible tackle through enemies
        if (this.onRollHit && this.rollTimer > 0) {
            this.onRollHit(this.position.clone(), this.facing);
        }

        if (this.rollTimer <= 0) {
            this.state = 'IDLE';
            this.currentHeight = this.HEIGHT_STAND;
        }
    }

    updateStumble(dt, input) {
        this.stumbleTimer -= dt;
        this.velocity.x *= (1 - dt * 5);
        this.velocity.z *= (1 - dt * 5);

        if (this.stumbleTimer <= 0) {
            this.state = 'IDLE';
        }
    }

    updateRagdoll(dt) {
        this.ragdollTimer -= dt;

        this.velocity.y += this.GRAVITY * dt;
        this.velocity.x *= 0.95;
        this.velocity.z *= 0.95;
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        this.mesh.rotation.x += this.ragdollAngularVelocity.x * dt;
        this.mesh.rotation.z += this.ragdollAngularVelocity.z * dt;
        this.mesh.rotation.y += this.ragdollAngularVelocity.y * dt;

        if (this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y = Math.max(0, this.velocity.y);
        }

        if (this.ragdollTimer <= 0) {
            this.respawn();
        }
    }

    updateDiveKick(dt) {
        this.diveKickTimer -= dt;
        // Continue falling fast; gravity handled separately
        this.velocity.y += this.GRAVITY * dt * 0.5; // reduced gravity for control
        this.velocity.x *= 0.98;
        this.velocity.z *= 0.98;
        if (this.grounded || this.diveKickTimer <= 0) {
            this.state = 'IDLE';
            this.velocity.set(0, 0, 0);
        }
    }

    updateGroundPound(dt) {
        this.groundPoundTimer -= dt;
        // Fast slam
        this.velocity.y += this.GRAVITY * dt * 2.0; // extra gravity
        if (this.grounded || this.groundPoundTimer <= 0) {
            // Impact resolved by main.js hitbox
            this.state = 'IDLE';
            this.velocity.set(0, 0, 0);
            if (this.cameraController && this.cameraController.shake) {
                this.cameraController.shake(0.5, 0.4);
            }
        }
    }

    startJump(input, isDoubleJump = false) {
        this.state = 'JUMP';
        this.fallStartY = this.position.y;
        this.velocity.y = this.JUMP_FORCE;
        this.grounded = false;
        this.coyoteTime = 0;
        this.airDashUsed = false;
        this.ticTacCount = 0;
        this.ticTacLastSide = null;
        if (this.onJump) this.onJump(isDoubleJump);

        // Bunny hop: if we landed very recently, preserve and boost horizontal velocity
        if (this.justLandedTimer > 0 && this.preLandingHSpeed > 1.0) {
            const boost = 1.08;
            this.velocity.x *= boost;
            this.velocity.z *= boost;
            this.bunnyHopFlashTimer = 0.3;
        }

        // Strafe jump: if moving at an angle to facing, add slight boost
        if (input) {
            const moveDir = this.getMoveDir(input, this.facing);
            const facingDir = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
            const dot = moveDir.dot(facingDir);
            if (dot > 0.15 && dot < 0.92 && moveDir.length() > 0.3) {
                this.velocity.x *= 1.04;
                this.velocity.z *= 1.04;
            }
        }

        // Long jump boost if sprinting
        if (this.wasSprinting) {
            const forward = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
            this.velocity.x += forward.x * 3;
            this.velocity.z += forward.z * 3;
        }

        // Backflip Kick: if jumping with backward input, launch enemy upward
        if (input) {
            const moveDir = this.getMoveDir(input, this.facing);
            const facingDir = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
            if (moveDir.dot(facingDir) < -0.5 && this.onBackflipKick) {
                this.onBackflipKick(this.position.clone(), this.facing);
            }
        }

        this.comboSystem.registerMove('jump');
        if (this.audio) this.audio.playJump();
    }

    startSlide(moveDir) {
        this.state = 'SLIDE';
        this.slideTimer = 0.8;
        this._slideTackleTriggered = false;
        const forward = moveDir.length() > 0.1 ? moveDir :
            new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
        const speed = this.SPEED_SPRINT * 1.6 * this.comboSystem.getFlowBoost() * this.moveSpeedMultiplier;
        this.velocity.x = forward.x * speed;
        this.velocity.z = forward.z * speed;
        if (this.audio) this.audio.playSlide(true);
    }

    startClimb(info) {
        this.state = 'CLIMB';
        this.velocity.set(0, 0, 0);
        this.climbData = info;
        const stickPos = info.point.clone().add(info.normal.clone().multiplyScalar(this.RADIUS + 0.05));
        this.position.x = stickPos.x;
        this.position.z = stickPos.z;
        this.position.y = Math.max(this.position.y, info.wallTop - 1.5);
        this.comboSystem.registerMove('climb');
        if (this.audio) this.audio.playClimbGrab();
    }

    startVault(info) {
        this.state = 'VAULT';
        this.vaultIsMantle = !!info.isMantle;
        this.vaultTimer = info.isMantle ? 0.3 : 0.4;
        this.vaultStartPos = this.position.clone();
        this.velocity.set(0, 0, 0);

        if (info.isMantle) {
            this.vaultEndPos = new THREE.Vector3(
                this.position.x + Math.sin(this.facing) * 0.6,
                info.wallTop,
                this.position.z + Math.cos(this.facing) * 0.6
            );
            this.vaultPeak = info.wallTop + 0.4;
        } else {
            this.vaultEndPos = new THREE.Vector3(
                info.point.x + info.normal.x * (this.RADIUS + 0.4),
                info.wallTop,
                info.point.z + info.normal.z * (this.RADIUS + 0.4)
            );
            this.vaultPeak = Math.max(info.wallTop + 0.5, this.position.y + 0.4);
        }
        this.comboSystem.registerMove('vault');
        if (this.audio) this.audio.playVault();

        // Vault Strike hook — main.js wires hitbox creation
        if (this.onVaultStrike) {
            this.onVaultStrike(this.vaultStartPos, this.vaultEndPos, this.facing);
        }
    }

    startWallRun(info) {
        this.state = 'WALLRUN';
        this.wallRunTimer = this.WALLRUN_MAX_TIME;
        this.wallRunData = info;
        this.airDashUsed = false;
        this.comboSystem.registerMove('wallrun');
    }

    wallKickJump() {
        // Called when jumping off wallrun — triggers Wall-Kick Stun
        const kickDir = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
        if (this.onWallKick) this.onWallKick(this.position.clone(), kickDir);
    }

    startHang(info) {
        this.state = 'HANG';
        this.hangData = info;
        this.velocity.set(0, 0, 0);
    }

    startRoll() {
        this.state = 'ROLL';
        this.rollTimer = this.ROLL_DURATION;
        this.currentHeight = this.HEIGHT_SLIDE;
        if (this.audio) this.audio.playRoll();
        if (this.cameraController && this.cameraController.shake) {
            this.cameraController.shake(0.3, 0.3);
        }
    }

    startStumble() {
        this.state = 'STUMBLE';
        this.stumbleTimer = this.STUMBLE_DURATION;
        this.velocity.multiplyScalar(0.3);
        this.comboSystem.reset();
        if (this.cameraController && this.cameraController.shake) {
            this.cameraController.shake(0.5, 0.4);
        }
    }

    startRagdoll() {
        this.state = 'RAGDOLL';
        this.ragdollTimer = this.RAGDOLL_DURATION;
        this.ragdollAngularVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 12
        );
        this.velocity.y = 4;
        this.comboSystem.reset();
    }

    startAirDash(direction) {
        this.airDashUsed = true;
        // Perfect dodge window on air dash
        if (this._dodgeCooldown <= 0) {
            this._dodgeWindow = 0.35;
            this._dodgeCooldown = 0.5;
        }
        const dashDir = direction.length() > 0.1 ? direction :
            new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
        dashDir.normalize().multiplyScalar(this.AIR_DASH_FORCE);
        this.velocity.x = dashDir.x;
        this.velocity.z = dashDir.z;
        this.velocity.y = Math.max(this.velocity.y + 2, 3);
        this.comboSystem.registerMove('airDash');
    }

    startDiveKick() {
        this.state = 'DIVE_KICK';
        this.diveKickTimer = 0.5;
        const forward = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
        this.velocity.x = forward.x * 18;
        this.velocity.z = forward.z * 18;
        this.velocity.y = -12;
        this.comboSystem.registerMove('diveKick');
    }

    startGroundPound() {
        this.state = 'GROUND_POUND';
        this.groundPoundTimer = 0.6;
        this.velocity.x *= 0.3;
        this.velocity.z *= 0.3;
        this.velocity.y = -20;
        this.comboSystem.registerMove('groundPound');
    }

    tryRollLanding() {
        const fallDist = this.fallStartY - this.position.y;
        if (this._tacticalRollBuffer > 0) {
            this.startRoll();
            this._tacticalRollBuffer = 0;
            return;
        }
        if (fallDist > this.MIN_FALL_FOR_ROLL) {
            if (this.rollInputTimer > 0) {
                this.startRoll();
            } else {
                this.startStumble();
            }
        } else if (fallDist > 1.5) {
            if (this.audio) this.audio.playLand(Math.abs(this.velocity.y));
            if (this.cameraController && this.cameraController.shake) {
                this.cameraController.shake(0.2, 0.2);
            }
        }
    }

    // --- Ceiling Run (Magnet Boots) ---

    checkCeilingAbove() {
        const origin = this.position.clone().add(new THREE.Vector3(0, this.currentHeight, 0));
        const ray = new THREE.Ray(origin, new THREE.Vector3(0, 1, 0));
        let bestY = Infinity;
        let bestBox = null;

        for (const obj of this.world.collidables) {
            const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
            const hit = new THREE.Vector3();
            if (ray.intersectBox(box, hit) !== null) {
                const dist = hit.y - origin.y;
                if (dist > 0.1 && dist < this.CEILING_ATTACH_RANGE && hit.y < bestY) {
                    bestY = hit.y;
                    bestBox = box;
                }
            }
        }

        if (!bestBox) return null;
        return {
            y: bestY,
            normal: new THREE.Vector3(0, -1, 0)
        };
    }

    startCeilingRun(info) {
        this.state = 'CEILING_RUN';
        this.ceilingRunData = info;
        this.velocity.set(0, 0, 0);
        this.position.y = info.y - this.currentHeight - 0.05;
        this.comboSystem.registerMove('ceilingRun');
        if (this.audio) this.audio.playClimbGrab();
    }

    updateGrappleAim(dt, input) {
        if (!this.grapplingHook) { this.state = 'FALL'; return; }
        this.grapplingHook.update(dt, { isPressed: () => false }, this.facing);
        if (this.grapplingHook.state !== 'AIM') this.state = 'FALL';
    }

    updateGrappleSwing(dt, input) {
        if (!this.grapplingHook) { this.state = 'FALL'; return; }
        this.grapplingHook.update(dt, input, this.facing);
        if (!this.grapplingHook.isActive()) this.state = 'FALL';
    }

    updateGrappleRetract(dt, input) {
        if (!this.grapplingHook) { this.state = 'FALL'; return; }
        this.grapplingHook.update(dt, input, this.facing);
        if (!this.grapplingHook.isActive()) this.state = 'FALL';
    }

    updateCeilingRun(dt, input) {
        if (!this.ceilingRunData) {
            this.state = 'FALL';
            return;
        }

        // Keep player attached to ceiling
        this.position.y = this.ceilingRunData.y - this.currentHeight - 0.05;

        // Movement projected onto ceiling plane (inverted controls)
        const moveDir = this.getMoveDir(input, this.facing);
        const speed = this.CEILING_RUN_SPEED * this.moveSpeedMultiplier;

        if (moveDir.length() > 0.1) {
            this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, moveDir.x * speed, dt * 10);
            this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, moveDir.z * speed, dt * 10);
        } else {
            this.velocity.x *= (1 - dt * 8);
            this.velocity.z *= (1 - dt * 8);
        }

        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;

        // Drop: Space to detach
        if (input.wasPressed('Space')) {
            // Ceiling Drop assassination check
            if (this.onCeilingDrop) {
                this.onCeilingDrop(this.position.clone(), this.facing);
            }
            this.state = 'FALL';
            this.ceilingRunData = null;
            this.velocity.y = -2;
        }

        // Also drop if Ctrl is released and no ceiling nearby
        if (!input.isPressed('ControlLeft')) {
            const check = this.checkCeilingAbove();
            if (!check || Math.abs(check.y - this.ceilingRunData.y) > 0.5) {
                this.state = 'FALL';
                this.ceilingRunData = null;
                this.velocity.y = -2;
            }
        }
    }

    // --- Platform Grab / Shield ---

    checkPlatformGrab() {
        // Look for a platform edge near the player
        // Check if player is at the edge of a collidable (falling off or near corner)
        const probeDirs = [
            new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing)),
            new THREE.Vector3(0, -1, 0)
        ];

        for (const obj of this.world.collidables) {
            const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
            // Player must be near the edge of this box
            const nearX = Math.abs(this.position.x - box.min.x) < 0.8 || Math.abs(this.position.x - box.max.x) < 0.8;
            const nearZ = Math.abs(this.position.z - box.min.z) < 0.8 || Math.abs(this.position.z - box.max.z) < 0.8;
            const nearY = this.position.y >= box.min.y - 0.5 && this.position.y <= box.max.y + 2;

            if ((nearX || nearZ) && nearY) {
                return {
                    box,
                    edgePos: new THREE.Vector3(
                        THREE.MathUtils.clamp(this.position.x, box.min.x, box.max.x),
                        box.max.y,
                        THREE.MathUtils.clamp(this.position.z, box.min.z, box.max.z)
                    )
                };
            }
        }
        return null;
    }

    startPlatformGrab(info) {
        this.state = 'PLATFORM_GRAB';
        this.platformGrabData = info;
        this.velocity.set(0, 0, 0);
        this.position.copy(info.edgePos);
        this.position.y -= this.currentHeight * 0.8;
    }

    updatePlatformGrab(dt, input) {
        if (!this.platformGrabData) {
            this.state = 'FALL';
            this._platformShieldActive = false;
            return;
        }

        // Stay at grab position
        this.position.x = this.platformGrabData.edgePos.x;
        this.position.z = this.platformGrabData.edgePos.z;

        // Platform Shield: active while E is held
        this._platformShieldActive = input.isPressed('KeyE');

        // Pull up onto platform
        if (input.isPressed('KeyW') || input.wasPressed('Space')) {
            this.state = 'JUMP';
            this.position.y = this.platformGrabData.edgePos.y + 0.1;
            this.velocity.y = 5;
            this.platformGrabData = null;
            this._platformShieldActive = false;
            return;
        }

        // Drop
        if (input.isPressed('KeyS') || !input.isPressed('KeyE')) {
            this.state = 'FALL';
            this.platformGrabData = null;
            this._platformShieldActive = false;
        }
    }

    updateWallKick(dt) {
        this._wallKickTimer -= dt;
        if (this._wallKickTimer <= 0) {
            this.state = 'FALL';
        }
    }

    updateSlideJump(dt, input) {
        this._slideJumpTimer -= dt;
        this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, this.HEIGHT_SLIDE, dt * 10);
        const airControl = 8;
        const moveDir = this.getMoveDir(input, this.facing);
        const airSpeed = this.SPEED_SPRINT * 1.2;
        const targetVel = moveDir.multiplyScalar(airSpeed);
        this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVel.x, dt * airControl);
        this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVel.z, dt * airControl);
        if (this._slideJumpTimer <= 0) {
            this._isSlideJumping = false;
            this.state = 'JUMP';
        }
    }

    updateMantle(dt) {
        if (!this.mantleSystem.isMantling()) {
            this.state = 'IDLE';
            this.isInvincible = false;
        }
    }

    updateGrind(dt, input) {
        this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, this.HEIGHT_SLIDE, dt * 10);
        if (this.jumpBuffer > 0) {
            this.jumpBuffer = 0;
            this.state = 'JUMP';
            this.velocity.y = this.JUMP_FORCE * 0.8;
            this.slopeGrindSystem._stopGrind();
        }
        if (!input.isPressed('KeyC')) {
            this.slopeGrindSystem._stopGrind();
            this.state = 'IDLE';
        }
    }

    checkAutoVault() {
        const forward = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
        const origin = this.position.clone().add(new THREE.Vector3(0, 0.6, 0));
        const ray = new THREE.Ray(origin, forward);

        for (const obj of this.world.collidables) {
            const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
            const hit = new THREE.Vector3();
            if (ray.intersectBox(box, hit) !== null) {
                const dist = origin.distanceTo(hit);
                if (dist < 0.7) {
                    const wallHeight = box.max.y - this.position.y;
                    if (wallHeight > 0.3 && wallHeight <= this.VAULT_HEIGHT) {
                        return {
                            wallTop: box.max.y,
                            point: hit,
                            normal: this.getBoxNormal(box, hit).negate()
                        };
                    }
                }
            }
        }
        return null;
    }

    checkWallInFront() {
        const forward = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
        const origins = [
            this.position.clone().add(new THREE.Vector3(0, 0.8, 0)),
            this.position.clone().add(new THREE.Vector3(0, 1.4, 0)),
        ];

        let bestResult = null;
        let bestDist = Infinity;

        for (const origin of origins) {
            const ray = new THREE.Ray(origin, forward);
            for (const obj of this.world.climbables) {
                const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
                const hit = new THREE.Vector3();
                if (ray.intersectBox(box, hit) !== null) {
                    const dist = origin.distanceTo(hit);
                    if (dist > 1.2) continue;

                    const normal = this.getBoxNormal(box, hit);
                    if (Math.abs(normal.y) > 0.3) continue;

                    const wallTop = box.max.y;
                    const wallBottom = box.min.y;
                    const wallHeight = wallTop - this.position.y;

                    if (wallHeight < 0.3 || wallBottom > this.position.y + this.currentHeight * 0.7) continue;

                    if (dist < bestDist) {
                        bestDist = dist;
                        bestResult = {
                            canClimb: wallHeight > this.VAULT_HEIGHT && wallHeight <= this.CLIMB_HEIGHT,
                            canVault: wallHeight <= this.VAULT_HEIGHT,
                            wallTop,
                            wallBottom,
                            point: hit,
                            normal: normal.negate(),
                            obj
                        };
                    }
                }
            }
        }
        return bestResult;
    }

    checkWallRun() {
        const forward = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
        const origin = this.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        const ray = new THREE.Ray(origin, forward);

        for (const obj of this.world.climbables) {
            const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
            const hit = new THREE.Vector3();
            if (ray.intersectBox(box, hit) !== null) {
                const dist = origin.distanceTo(hit);
                if (dist < 0.8) {
                    const normal = this.getBoxNormal(box, hit);
                    if (Math.abs(normal.y) > 0.3) continue;

                    const tangent = new THREE.Vector3(0, 1, 0).cross(normal).normalize();
                    const playerDir = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).normalize();
                    const dot = Math.abs(playerDir.dot(tangent));

                    if (dot > 0.55) {
                        return {
                            point: hit,
                            normal: normal.negate(),
                            tangent: tangent,
                            obj
                        };
                    }
                }
            }
        }
        return null;
    }

    _getNearbyWallNormals() {
        const normals = [];
        const origin = this.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        const dirs = [
            new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1),
        ];
        for (const dir of dirs) {
            const ray = new THREE.Ray(origin, dir);
            for (const obj of this.world.climbables) {
                const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
                const hit = new THREE.Vector3();
                if (ray.intersectBox(box, hit) !== null) {
                    const dist = origin.distanceTo(hit);
                    if (dist < 1.5) {
                        const normal = this.getBoxNormal(box, hit).negate();
                        if (Math.abs(normal.y) <= 0.3) normals.push(normal);
                    }
                }
            }
        }
        return normals;
    }

    checkLedgeHang() {
        if (this.velocity.y > -0.5) return null;

        const forward = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
        const origin = this.position.clone().add(new THREE.Vector3(0, 1.3, 0));
        const ray = new THREE.Ray(origin, forward);

        for (const obj of this.world.collidables) {
            const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
            const hit = new THREE.Vector3();
            if (ray.intersectBox(box, hit) !== null) {
                const dist = origin.distanceTo(hit);
                if (dist < 0.8) {
                    const wallTop = box.max.y;
                    const handHeight = origin.y;
                    if (wallTop > handHeight - 0.4 && wallTop < handHeight + 0.3 &&
                        wallTop > this.position.y + 0.8) {
                        return {
                            wallTop,
                            point: hit,
                            normal: this.getBoxNormal(box, hit).negate(),
                            obj,
                            canHang: true
                        };
                    }
                }
            }
        }
        return null;
    }

    isStillOnWall() {
        if (!this.climbData || !this.climbData.obj) return false;
        const forward = this.climbData.normal.clone().negate();
        const origins = [
            this.position.clone().add(new THREE.Vector3(0, 0.8, 0)),
            this.position.clone().add(new THREE.Vector3(0, 1.4, 0)),
        ];
        for (const origin of origins) {
            const ray = new THREE.Ray(origin, forward);
            const box = this.climbData.obj.userData.bbox || new THREE.Box3().setFromObject(this.climbData.obj);
            const hit = new THREE.Vector3();
            if (ray.intersectBox(box, hit) !== null) {
                if (origin.distanceTo(hit) < 0.6) return true;
            }
        }
        return false;
    }

    isStillOnLedge() {
        if (!this.hangData || !this.hangData.obj) return false;
        const forward = this.hangData.normal.clone().negate();
        const origin = this.position.clone().add(new THREE.Vector3(0, 1.3, 0));
        const ray = new THREE.Ray(origin, forward);
        const box = this.hangData.obj.userData.bbox || new THREE.Box3().setFromObject(this.hangData.obj);
        const hit = new THREE.Vector3();
        if (ray.intersectBox(box, hit) !== null) {
            if (origin.distanceTo(hit) < 0.6) return true;
        }
        return false;
    }

    resolveCollisions() {
        if (this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y = Math.max(0, this.velocity.y);
            this.grounded = true;
        }

        const playerMin = new THREE.Vector3(
            this.position.x - this.RADIUS,
            this.position.y,
            this.position.z - this.RADIUS
        );
        const playerMax = new THREE.Vector3(
            this.position.x + this.RADIUS,
            this.position.y + this.currentHeight,
            this.position.z + this.RADIUS
        );

        for (const obj of this.world.collidables) {
            const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
            if (!this.checkAABBCollision(playerMin, playerMax, box)) continue;
            if (this.mantleSystem.checkMantleTrigger(obj, box, playerMin, playerMax)) {
                this.mantleSystem.startMantle(box.max.y);
                return;
            }
            this.resolveCollision(playerMin, playerMax, box);
        }

        // Ragdoll trigger: hard impact with sudden velocity loss
        const speedLoss = this.prevVelocity.length() - this.velocity.length();
        if (speedLoss > 10 && this.prevVelocity.length() > this.RAGDOLL_MIN_SPEED &&
            this.state !== 'VAULT' && this.state !== 'CLIMB' && this.state !== 'WALLRUN' &&
            this.state !== 'HANG' && this.state !== 'RAGDOLL' && this.state !== 'ROLL') {
            this.startRagdoll();
        }
    }

    checkAABBCollision(min1, max1, box) {
        return max1.x > box.min.x && min1.x < box.max.x &&
               max1.y > box.min.y && min1.y < box.max.y &&
               max1.z > box.min.z && min1.z < box.max.z;
    }

    resolveCollision(playerMin, playerMax, box) {
        const penX = Math.min(playerMax.x - box.min.x, box.max.x - playerMin.x);
        const penY = Math.min(playerMax.y - box.min.y, box.max.y - playerMin.y);
        const penZ = Math.min(playerMax.z - box.min.z, box.max.z - playerMin.z);

        if (penX < 0.001 || penY < 0.001 || penZ < 0.001) return;

        const minPen = Math.min(penX, penY, penZ);

        if (minPen === penY) {
            if (this.position.y + this.currentHeight * 0.5 > (box.min.y + box.max.y) * 0.5) {
                this.position.y = box.min.y - this.currentHeight;
                this.velocity.y = Math.min(0, this.velocity.y);
            } else {
                this.position.y = box.max.y;
                if (this.velocity.y <= 0.1) {
                    this.velocity.y = 0;
                    this.grounded = true;
                }
            }
        } else if (minPen === penX) {
            if (this.position.x < (box.min.x + box.max.x) * 0.5) {
                this.position.x = box.min.x - this.RADIUS;
            } else {
                this.position.x = box.max.x + this.RADIUS;
            }
            this.velocity.x = 0;
        } else {
            if (this.position.z < (box.min.z + box.max.z) * 0.5) {
                this.position.z = box.min.z - this.RADIUS;
            } else {
                this.position.z = box.max.z + this.RADIUS;
            }
            this.velocity.z = 0;
        }

        playerMin.set(
            this.position.x - this.RADIUS,
            this.position.y,
            this.position.z - this.RADIUS
        );
        playerMax.set(
            this.position.x + this.RADIUS,
            this.position.y + this.currentHeight,
            this.position.z + this.RADIUS
        );
    }

    checkGround() {
        if (this.state === 'CLIMB' || this.state === 'VAULT' || this.state === 'HANG' || this.state === 'RAGDOLL' ||
            this.state === 'CEILING_RUN' || this.state === 'PLATFORM_GRAB' || this.state === 'MANTLE') {
            this.grounded = false;
            return;
        }

        const origin = new THREE.Vector3(this.position.x, this.position.y + 0.05, this.position.z);
        const ray = new THREE.Ray(origin, new THREE.Vector3(0, -1, 0));
        let groundY = -Infinity;

        for (const obj of this.world.collidables) {
            const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
            const hit = new THREE.Vector3();
            if (ray.intersectBox(box, hit) !== null) {
                if (hit.y > groundY && hit.y <= origin.y + 0.01) {
                    groundY = hit.y;
                }
            }
        }

        if (this.position.y <= 0.05) {
            groundY = Math.max(groundY, 0);
        }

        if (groundY >= this.position.y - 0.1 && this.velocity.y <= 0.1) {
            this.grounded = true;
            if (Math.abs(this.position.y - groundY) > 0.001) {
                this.position.y = groundY;
            }
            this.velocity.y = 0;
        } else {
            this.grounded = false;
        }
    }

    canStand() {
        const origin = this.position.clone().add(new THREE.Vector3(0, this.currentHeight + 0.05, 0));
        const ray = new THREE.Ray(origin, new THREE.Vector3(0, 1, 0));
        for (const obj of this.world.collidables) {
            const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
            const hit = new THREE.Vector3();
            if (ray.intersectBox(box, hit) !== null) {
                const dist = hit.y - origin.y;
                if (dist < this.HEIGHT_STAND - this.currentHeight + 0.05) {
                    return false;
                }
            }
        }
        return true;
    }

    canStandAt(y) {
        const origin = new THREE.Vector3(this.position.x, y + this.HEIGHT_STAND + 0.05, this.position.z);
        const ray = new THREE.Ray(origin, new THREE.Vector3(0, 1, 0));
        for (const obj of this.world.collidables) {
            const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
            const hit = new THREE.Vector3();
            if (ray.intersectBox(box, hit) !== null) {
                const dist = hit.y - origin.y;
                if (dist < this.HEIGHT_STAND - this.currentHeight + 0.05) {
                    return false;
                }
            }
        }
        return true;
    }

    getBoxNormal(box, point) {
        const eps = 0.02;
        if (Math.abs(point.x - box.min.x) < eps) return new THREE.Vector3(-1, 0, 0);
        if (Math.abs(point.x - box.max.x) < eps) return new THREE.Vector3(1, 0, 0);
        if (Math.abs(point.y - box.min.y) < eps) return new THREE.Vector3(0, -1, 0);
        if (Math.abs(point.y - box.max.y) < eps) return new THREE.Vector3(0, 1, 0);
        if (Math.abs(point.z - box.min.z) < eps) return new THREE.Vector3(0, 0, -1);
        if (Math.abs(point.z - box.max.z) < eps) return new THREE.Vector3(0, 0, 1);

        const center = new THREE.Vector3().addVectors(box.min, box.max).multiplyScalar(0.5);
        const diff = new THREE.Vector3().subVectors(point, center);
        const abs = new THREE.Vector3(Math.abs(diff.x), Math.abs(diff.y), Math.abs(diff.z));
        if (abs.x > abs.y && abs.x > abs.z) return new THREE.Vector3(Math.sign(diff.x), 0, 0);
        if (abs.y > abs.x && abs.y > abs.z) return new THREE.Vector3(0, Math.sign(diff.y), 0);
        return new THREE.Vector3(0, 0, Math.sign(diff.z));
    }

    updateVisuals(dt, moveDir, input) {
        this.mesh.position.copy(this.position);

        const targetScale = this.currentHeight / this.HEIGHT_STAND;
        this.mesh.scale.y = THREE.MathUtils.lerp(this.mesh.scale.y, targetScale, dt * 15);

        let targetRot;
        if (this.state === 'CLIMB' || this.state === 'HANG') {
            targetRot = Math.atan2(-(this.climbData?.normal?.x || this.hangData?.normal?.x),
                                   -(this.climbData?.normal?.z || this.hangData?.normal?.z));
        } else if (this.state === 'RAGDOLL') {
            targetRot = this.mesh.rotation.y;
        } else if (moveDir.length() > 0.1) {
            targetRot = Math.atan2(moveDir.x, moveDir.z);
        } else {
            targetRot = this.facing;
        }

        let diff = targetRot - this.mesh.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const rotSpeed = (this.state === 'CLIMB' || this.state === 'HANG') ? 15 : 8;
        this.mesh.rotation.y += diff * dt * rotSpeed;

        const time = Date.now() * 0.01;
        if (this.state === 'CLIMB' || this.state === 'HANG') {
            this.leftArm.rotation.x = -2.5;
            this.rightArm.rotation.x = -2.5;
            this.leftArm.rotation.z = 0.2;
            this.rightArm.rotation.z = -0.2;
        } else if (this.state === 'SLIDE' || this.state === 'ROLL' || this.state === 'SLIDE_JUMP' || this.state === 'GRIND') {
            this.leftArm.rotation.x = -1;
            this.rightArm.rotation.x = -1;
            this.leftArm.rotation.z = 0.5;
            this.rightArm.rotation.z = -0.5;
        } else if (this.state === 'RAGDOLL') {
            this.leftArm.rotation.x += Math.sin(time * 3) * dt * 5;
            this.rightArm.rotation.x += Math.cos(time * 3) * dt * 5;
        } else if (this.state === 'STUMBLE' || this.state === 'MANTLE' || this.state === 'WALLKICK') {
            this.leftArm.rotation.x = 0.5;
            this.rightArm.rotation.x = -0.5;
        } else if (this.state === 'GRAPPLE_AIM' || this.state === 'GRAPPLE_SWING' || this.state === 'GRAPPLE_RETRACT') {
            this.rightArm.rotation.x = -2.2;
            this.rightArm.rotation.z = 0.3;
            this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, -0.5, dt * 8);
            this.leftArm.rotation.z = 0;
        } else if (this.grounded && moveDir.length() > 0.1) {
            const bob = Math.sin(time * (this.state === 'SPRINT' ? 1.8 : 1.2)) * 0.6;
            this.leftArm.rotation.x = bob;
            this.rightArm.rotation.x = -bob;
            this.leftArm.rotation.z = 0;
            this.rightArm.rotation.z = 0;
        } else {
            this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, dt * 10);
            this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, dt * 10);
            this.leftArm.rotation.z = 0;
            this.rightArm.rotation.z = 0;
        }

        if (this.grounded && moveDir.length() > 0.1 && this.state !== 'SLIDE' && this.state !== 'ROLL') {
            const legBob = Math.sin(time * (this.state === 'SPRINT' ? 1.8 : 1.2)) * 0.4;
            this.leftLeg.rotation.x = -legBob;
            this.rightLeg.rotation.x = legBob;
        } else if (this.state === 'SLIDE' || this.state === 'ROLL' || this.state === 'SLIDE_JUMP' || this.state === 'GRIND') {
            this.leftLeg.rotation.x = -1.3;
            this.rightLeg.rotation.x = -1.3;
        } else if (this.state === 'RAGDOLL') {
            this.leftLeg.rotation.x += Math.sin(time * 2.5) * dt * 5;
            this.rightLeg.rotation.x += Math.cos(time * 2.5) * dt * 5;
        } else if (this.state === 'STUMBLE') {
            this.leftLeg.rotation.x = 0.3;
            this.rightLeg.rotation.x = -0.3;
        } else if (this.state === 'GRAPPLE_SWING' || this.state === 'GRAPPLE_RETRACT') {
            this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, -0.6, dt * 6);
            this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, -0.4, dt * 6);
        } else if (this.ticTacCount > 0 && (this.state === 'JUMP' || this.state === 'FALL')) {
            const extend = Math.max(0, 1 - (this.ticTacCount * 0.15));
            this.leftLeg.rotation.x = -0.8 * extend;
            this.rightLeg.rotation.x = 0.5 * extend;
        } else {
            this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, dt * 10);
            this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, dt * 10);
        }

        if (this.grounded && (this.state === 'WALK' || this.state === 'SPRINT')) {
            const bobAmount = this.state === 'SPRINT' ? 0.04 : 0.02;
            const bobSpeed = this.state === 'SPRINT' ? 18 : 12;
            this.mesh.position.y += Math.sin(time * 0.1 * bobSpeed) * bobAmount;
        }

        if (this._customAnimation) {
            this._customAnimation.update(dt, moveDir.length());
        }

        if (this.bunnyHopFlashTimer > 0) {
            const flash = Math.sin(this.bunnyHopFlashTimer * 25) * 0.5 + 0.5;
            this.bunnyHopFlashMesh.material.opacity = flash * 0.9;
            this.bunnyHopFlashMesh.visible = true;
        } else {
            this.bunnyHopFlashMesh.visible = false;
            this.bunnyHopFlashMesh.material.opacity = 0;
        }

        if (this._coyoteFlashTimer > 0) {
            this._suitMaterial.emissive.setHex(0xff6600);
            this._suitMaterial.emissiveIntensity = 0.6;
            this._wasCoyoteFlashing = true;
        } else if (this._wasCoyoteFlashing) {
            this._suitMaterial.emissive.setHex(0x000000);
            this._suitMaterial.emissiveIntensity = 0;
            this._wasCoyoteFlashing = false;
        }

        this.shadow.position.set(this.position.x, 0.02, this.position.z);
        const shadowScale = 1 - Math.min(this.position.y * 0.08, 0.8);
        this.shadow.scale.setScalar(Math.max(0.2, shadowScale));
        this.shadow.material.opacity = Math.max(0.05, 0.3 * shadowScale);
    }

    respawn() {
        this.position.copy(this.lastSafePosition);
        this.velocity.set(0, 0, 0);
        this.state = 'IDLE';
        this.currentHeight = this.HEIGHT_STAND;
        this.climbData = null;
        this.wallRunData = null;
        this.hangData = null;
        this.ragdollTimer = 0;
        this.stumbleTimer = 0;
        this.rollTimer = 0;
        this.mesh.rotation.x = 0;
        this.mesh.rotation.z = 0;
        this.comboSystem.reset();
        this.grapplingHook._release();
        this.ticTacCount = 0;
        this.ticTacLastSide = null;
        this._isSlideJumping = false;
        this._wallKickTimer = 0;
        this.wallKickSystem.reset();
        this.slideJumpSystem.reset();
        this.mantleSystem.reset();
        this.slopeGrindSystem.reset();
        this.ticTacSystem.reset();
        this.airDodgeSystem.reset();
        this.doubleJumpSystem.reset();
        this.cornerKickSystem.reset();
        this.diveRollSystem.reset();
    }

    getStateDisplay() {
        const names = {
            'IDLE': 'IDLE',
            'WALK': 'WALKING',
            'SPRINT': 'SPRINTING',
            'CROUCH': 'CROUCHING',
            'JUMP': 'JUMPING',
            'FALL': 'FALLING',
            'CLIMB': 'CLIMBING',
            'SLIDE': 'SLIDING',
            'VAULT': 'VAULTING',
            'WALLRUN': 'WALL RUNNING',
            'HANG': 'HANGING',
            'ROLL': 'ROLLING',
            'STUMBLE': 'STUMBLING',
            'RAGDOLL': 'RAGDOLL',
            'GRAPPLE_AIM': 'GRAPPLE AIM',
            'GRAPPLE_SWING': 'GRAPPLE SWING',
            'GRAPPLE_RETRACT': 'GRAPPLE RETRACT',
            'WALLKICK': 'WALL KICK',
            'SLIDE_JUMP': 'SLIDE JUMPING',
            'MANTLE': 'MANTLING',
            'GRIND': 'GRINDING'
        };
        return names[this.state] || this.state;
    }

    getSpeed() { return (Math.sqrt(this.velocity.x**2 + this.velocity.z**2) * 3.6).toFixed(0); }
    setCharacterSheet(sheet) { this.characterSheet = sheet; }
    getRPGStats() { return this.characterSheet ? (this.characterSheet.getStats ? this.characterSheet.getStats() : {}) : {}; }

    triggerParry() {
        if (window.audioManager && typeof window.audioManager.playSFX === 'function') {
            window.audioManager.playSFX('parry');
        }
        if (this._parryCooldown > 0 || this.isDead) return false;
        const parryBonus = (this.characterSheet && this.characterSheet.getParryWindowBonus) ? this.characterSheet.getParryWindowBonus() : 0;
        this._parryWindow = 0.25 + parryBonus; // 0.25s base + REF stat bonus
        this._parryCooldown = 1.0; // 1s cooldown
        return true;
    }

    takeDamage(amount, type = 'kinetic', source = null) {
        if (this.isDead || this.isInvincible) return 0;

        // Perfect Dodge: if dashing when damage lands = dodge + counter window
        if (this._dodgeWindow > 0 && amount > 0) {
            this._dodgeWindow = 0;
            if (this.scene && this.scene.userData && this.scene.userData.spawnDamageNumber) {
                const pos = this.position.clone(); pos.y += 1.8;
                this.scene.userData.spawnDamageNumber(pos, 'DODGE', true, 'kinetic');
            }
            // 2s counter window: next attack deals 2x damage
            this._perfectDodgeCounter = 2.0;
            return 0;
        }

        // Panic Roll: if roll input was pressed right before impact (0.15s window)
        if (this.rollInputTimer > 0 && amount > 0) {
            this.rollInputTimer = 0;
            if (this.scene && this.scene.userData && this.scene.userData.spawnDamageNumber) {
                const pos = this.position.clone(); pos.y += 1.8;
                this.scene.userData.spawnDamageNumber(pos, 'DODGED', true, 'kinetic');
            }
            // I-frames for remainder of roll
            this.isInvincible = true;
            clearTimeout(this._invincibilityTimer);
            this._invincibilityTimer = setTimeout(() => { this.isInvincible = false; }, 300);
            return 0;
        }

        // Perfect Parry: block melee damage during parry window
        if (this._parryWindow > 0 && amount > 0) {
            this._parryWindow = 0;
            if (this.onPerfectParry) this.onPerfectParry(source);
            // Spawn parry visual feedback
            if (this.scene && this.scene.userData && this.scene.userData.spawnDamageNumber) {
                const pos = this.position.clone(); pos.y += 1.8;
                this.scene.userData.spawnDamageNumber(pos, 'PARRY', true, 'kinetic');
            }
            return 0;
        }

        // Firewall: while active, attacker takes 15 electric damage on any hit
        if (this._firewallActive && amount > 0 && source && source.takeDamage) {
            source.takeDamage(15, 'electric', this);
            if (this.scene && this.scene.userData && this.scene.userData.spawnDamageNumber) {
                const pos = this.position.clone(); pos.y += 1.5;
                this.scene.userData.spawnDamageNumber(pos, 'SHOCK', false, 'electric');
            }
        }

        // Platform Shield: block frontal damage while grabbing platform edge
        if (this._platformShieldActive && amount > 0) {
            // Block 75% of incoming damage while shielded
            const blocked = amount * 0.75;
            amount -= blocked;
            if (this.scene && this.scene.userData && this.scene.userData.spawnDamageNumber) {
                const pos = this.position.clone(); pos.y += 1.5;
                this.scene.userData.spawnDamageNumber(pos, `BLOCKED`, false, 'energy');
            }
            if (amount <= 0) return 0;
        }

        // Meat Shield: absorb damage from friendly drone
        if (this._meatShield > 0 && amount > 0) {
            const absorb = Math.min(this._meatShield, amount);
            this._meatShield -= absorb;
            amount -= absorb;
            if (this.scene && this.scene.userData && this.scene.userData.spawnDamageNumber) {
                const pos = this.position.clone(); pos.y += 1.5;
                this.scene.userData.spawnDamageNumber(pos, `SHIELD -${Math.round(absorb)}`, false, 'energy');
            }
            if (amount <= 0) return 0;
        }

        // Aegis Shield: absorb incoming damage (granted by Aegis Field legendary power on perfect parry)
        if (this._shield > 0 && amount > 0) {
            const absorb = Math.min(this._shield, amount);
            this._shield -= absorb;
            amount -= absorb;
            if (this.scene && this.scene.userData && this.scene.userData.spawnDamageNumber) {
                const pos = this.position.clone(); pos.y += 1.5;
                this.scene.userData.spawnDamageNumber(pos, `SHIELD -${Math.round(absorb)}`, false, 'energy');
            }
            if (amount <= 0) return 0;
        }

        // Stagger immunity: resist kinetic and explosive damage
        if (this._staggerImmune && amount > 0 && (type === 'kinetic' || type === 'explosive')) {
            amount *= 0.5;
            if (this.scene && this.scene.userData && this.scene.userData.spawnDamageNumber) {
                const pos = this.position.clone(); pos.y += 1.8;
                this.scene.userData.spawnDamageNumber(pos, 'RESIST', false, type);
            }
            if (amount <= 0) return 0;
        }

        // Knockback on heavy hits (>20 damage)
        if (amount > 20 && this.state !== 'KNOCKBACK') {
            this.state = 'KNOCKBACK';
            this._knockbackTimer = 0.5;
            this._knockbackRecoveryReady = false;
            // Push back from source
            if (source && source.position) {
                const away = this.position.clone().sub(source.position).normalize();
                this.velocity.x = away.x * 8;
                this.velocity.z = away.z * 8;
                this.velocity.y = 5;
            }
            amount *= 0.5; // reduce damage during knockback
        }

        this.health -= amount;
        if (window.audioManager && typeof window.audioManager.playHitSound === 'function') {
            window.audioManager.playHitSound(type, this.position);
        }
        if (this.health <= 0) {
            // Allow legendary powers to block fatal damage
            let blocked = false;
            if (this.onDamageTaken) {
                // onDamageTaken may contain onTakeFatalDamage logic
                // We call it early for fatal damage checks
                this.onDamageTaken(amount, type, source);
                if (this.health > 0) blocked = true;
            }
            if (!blocked) {
                this.health = 0;
                this.die();
            }
        } else {
            if (this.onDamageTaken) this.onDamageTaken(amount, type, source);
        }
        return amount;
    }

    heal(amount) {
        if (this.isDead) return;
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    die() {
        if (window.audioManager && typeof window.audioManager.playDeathSound === 'function') {
            window.audioManager.playDeathSound(this.position);
        }
        clearTimeout(this._invincibilityTimer);
        // Adrenal Valve death rewind
        const stats = this.getRPGStats();
        const implantBonuses = stats._implantBonuses || {};
        if (implantBonuses.deathRewind) {
            const threshold = implantBonuses.deathRewindThreshold || 0.10;
            const cutoff = performance.now() - this.REWIND_WINDOW * 1000;
            let validSnapshot = null;
            for (let i = this._rewindBuffer.length - 1; i >= 0; i--) {
                const snap = this._rewindBuffer[i];
                if (snap.time < cutoff) continue;
                if (snap.health > this.maxHealth * threshold) {
                    validSnapshot = snap;
                    break;
                }
            }
            if (validSnapshot) {
                this.position.copy(validSnapshot.position);
                this.health = Math.min(this.maxHealth, validSnapshot.health);
                this.velocity.set(0, 0, 0);
                this.state = 'IDLE';
                this.isDead = false;
                this.isInvincible = true;
                clearTimeout(this._invincibilityTimer);
                this._invincibilityTimer = setTimeout(() => { this.isInvincible = false; }, 1000);
                if (this.scene && this.scene.userData && this.scene.userData.spawnDamageNumber) {
                    const pos = this.position.clone(); pos.y += 1.8;
                    this.scene.userData.spawnDamageNumber(pos, 'REWIND', true, 'energy');
                }
                return;
            }
        }

        this.isDead = true;
        this.state = 'RAGDOLL';
        // death handled by caller/main.js
    }

    respawn() {
        clearTimeout(this._invincibilityTimer);
        this.isDead = false;
        this.health = this.maxHealth + this._respawnHPBonus;
        this.state = 'IDLE';
        this.velocity.set(0, 0, 0);
        this._isSlideJumping = false;
        this._wallKickTimer = 0;
        this.wallKickSystem.reset();
        this.slideJumpSystem.reset();
        this.mantleSystem.reset();
        this.slopeGrindSystem.reset();
        this.ticTacSystem.reset();
        this.airDodgeSystem.reset();
        this.doubleJumpSystem.reset();
        this.cornerKickSystem.reset();
        this.diveRollSystem.reset();
        if (window.audioManager && typeof window.audioManager.playSFX === 'function') {
            window.audioManager.playSFX('respawn');
        }
    }

    getHealthPercent() {
        return this.maxHealth > 0 ? this.health / this.maxHealth : 0;
    }

    _syncMaxHealth() {
        const baseMax = 100;
        let bonus = 0;
        if (this.characterSheet) {
            bonus = this.characterSheet.getMaxHPBonus ? this.characterSheet.getMaxHPBonus() : 0;
        }
        const newMax = baseMax + bonus;
        if (newMax !== this.maxHealth) {
            const ratio = this.maxHealth > 0 ? this.health / this.maxHealth : 1;
            this.maxHealth = newMax;
            this.health = Math.min(this.maxHealth, this.health);
        }
    }
}
