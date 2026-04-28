import * as THREE from 'three';

export const CAMERA_MODES = Object.freeze({
    CHASE: 'chase',
    SHOULDER: 'shoulder',
    GEARS: 'gears',
    FIRST_PERSON: 'firstPerson'
});

const CAMERA_MODE_ORDER = [
    CAMERA_MODES.CHASE,
    CAMERA_MODES.SHOULDER,
    CAMERA_MODES.GEARS,
    CAMERA_MODES.FIRST_PERSON
];

const CAMERA_PRESETS = Object.freeze({
    // Existing parkour chase view. Wide, readable, and forgiving.
    [CAMERA_MODES.CHASE]: {
        label: 'Parkour Chase',
        distance: 6,
        height: 2.2,
        lookAtHeight: 1.3,
        shoulderOffset: 0,
        aimForward: 0,
        fov: 75,
        sprintFov: 80,
        slideFov: 82,
        smoothSpeed: 5.5,
        minPitch: -0.4,
        maxPitch: 1.0,
        autoFollowStrength: 1.4,
        firstPerson: false
    },
    // Resident Evil 4-style shoulder view for deliberate aiming.
    [CAMERA_MODES.SHOULDER]: {
        label: 'Over Shoulder',
        distance: 3.2,
        height: 1.55,
        lookAtHeight: 1.42,
        shoulderOffset: 0.62,
        aimForward: 1.8,
        fov: 68,
        sprintFov: 72,
        slideFov: 74,
        smoothSpeed: 9.0,
        minPitch: -0.45,
        maxPitch: 0.75,
        autoFollowStrength: 1.8,
        firstPerson: false
    },
    // Gears of War-inspired combat camera: lower, wider, and farther over the shoulder.
    [CAMERA_MODES.GEARS]: {
        label: 'Combat Shoulder',
        distance: 4.3,
        height: 1.75,
        lookAtHeight: 1.28,
        shoulderOffset: 1.0,
        aimForward: 1.35,
        fov: 72,
        sprintFov: 76,
        slideFov: 78,
        smoothSpeed: 8.2,
        minPitch: -0.35,
        maxPitch: 0.8,
        autoFollowStrength: 1.55,
        firstPerson: false
    },
    // First person view for direct mouse-look movement and close combat.
    [CAMERA_MODES.FIRST_PERSON]: {
        label: 'First Person',
        distance: 0,
        height: 1.58,
        lookAtHeight: 1.58,
        shoulderOffset: 0,
        aimForward: 4.0,
        fov: 75,
        sprintFov: 78,
        slideFov: 76,
        smoothSpeed: 14.0,
        minPitch: -0.8,
        maxPitch: 0.85,
        autoFollowStrength: 0,
        firstPerson: true
    }
});

export class ThirdPersonCamera {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;
        
        this.yaw = 0;
        this.pitch = 0.35;
        
        this.currentPos = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this._forward = new THREE.Vector3();
        this._flatForward = new THREE.Vector3();
        this._right = new THREE.Vector3();
        this._up = new THREE.Vector3(0, 1, 0);
        this._idealPos = new THREE.Vector3();
        this._idealLookAt = new THREE.Vector3();
        
        // Camera config
        this.mode = CAMERA_MODES.CHASE;
        this.modeIndex = 0;
        this.distance = 6;
        this.height = 2.2;
        this.lookAtHeight = 1.3;
        this.minPitch = -0.4;
        this.maxPitch = 1.0;
        this.sensitivity = 0.00125;
        this.smoothSpeed = 5.5;
        this.shakeScale = 0.45;
        this.autoFollowDelay = 0.8;
        this.autoFollowStrength = 1.4;
        this._timeSinceManualLook = 0;
        
        // Optional PostProcessing reference for delegated effects
        this.postProcessing = null;
        
        // Local camera shake fallback (used when no PostProcessing is wired)
        this.localShakeIntensity = 0;
        this.localShakeDuration = 0;
        this.localShakeMaxDuration = 0;
        this.localShakeOffset = new THREE.Vector3();
        this._targetMeshVisibility = null;
    }

    getMode() {
        return this.mode;
    }

    getModeLabel() {
        return CAMERA_PRESETS[this.mode]?.label || this.mode;
    }

    setMode(mode) {
        if (!CAMERA_PRESETS[mode]) return this.getModeLabel();
        this._setFirstPersonVisibility(CAMERA_PRESETS[mode].firstPerson);
        this.mode = mode;
        this.modeIndex = CAMERA_MODE_ORDER.indexOf(mode);
        const preset = CAMERA_PRESETS[mode];
        this.pitch = Math.max(preset.minPitch, Math.min(preset.maxPitch, this.pitch));
        return this.getModeLabel();
    }

    cycleMode(direction = 1) {
        const count = CAMERA_MODE_ORDER.length;
        const next = (this.modeIndex + direction + count) % count;
        return this.setMode(CAMERA_MODE_ORDER[next]);
    }
    
    /** Wire up a PostProcessing instance so shake can be handled there. */
    setPostProcessing(pp) {
        this.postProcessing = pp;
    }
    
    /**
     * Trigger camera shake.
     * Delegates to PostProcessing if available, otherwise runs a local fallback.
     */
    shake(intensity, duration) {
        if (this.postProcessing) {
            this.postProcessing.shake(intensity * this.shakeScale, duration * 0.8);
        } else {
            this.localShakeIntensity = Math.max(this.localShakeIntensity, intensity * this.shakeScale);
            this.localShakeDuration  = Math.max(this.localShakeDuration, duration);
            this.localShakeMaxDuration = this.localShakeDuration;
        }
    }
    
    /** Compute shake offset using the local fallback system. */
    getLocalShakeOffset(dt) {
        if (this.localShakeDuration <= 0) {
            this.localShakeOffset.set(0, 0, 0);
            return this.localShakeOffset;
        }
        
        this.localShakeDuration -= dt;
        const envelope = Math.max(0, this.localShakeDuration / Math.max(0.001, this.localShakeMaxDuration));
        const intensity = this.localShakeIntensity * envelope;
        
        const time = performance.now() * 0.02;
        this.localShakeOffset.set(
            (Math.sin(time * 15) + Math.cos(time * 23)) * 0.5 * intensity,
            (Math.sin(time * 17) + Math.cos(time * 31)) * 0.5 * intensity,
            (Math.sin(time * 19) + Math.cos(time * 29)) * 0.5 * intensity
        );
        
        return this.localShakeOffset;
    }
    
    update(dt, mouseDelta, world) {
        const preset = CAMERA_PRESETS[this.mode] || CAMERA_PRESETS[CAMERA_MODES.CHASE];
        const manualLookAmount = Math.abs(mouseDelta.x) + Math.abs(mouseDelta.y);
        if (manualLookAmount > 0.01) {
            this._timeSinceManualLook = 0;
        } else {
            this._timeSinceManualLook += dt;
        }

        // Update rotation from mouse input
        this.yaw -= mouseDelta.x * this.sensitivity;
        this.pitch += mouseDelta.y * this.sensitivity;
        this.pitch = Math.max(preset.minPitch, Math.min(preset.maxPitch, this.pitch));

        // If the player is moving and not actively steering the camera, let the
        // camera gently settle behind the runner's visual heading.
        const horizontalSpeed = this.target.velocity
            ? Math.hypot(this.target.velocity.x, this.target.velocity.z)
            : 0;
        if (this._timeSinceManualLook > this.autoFollowDelay && horizontalSpeed > 0.5 && this.target.mesh) {
            const desiredYaw = this.target.mesh.rotation.y;
            const deltaYaw = shortestAngleDelta(this.yaw, desiredYaw);
            this.yaw += deltaYaw * Math.min(1, preset.autoFollowStrength * dt);
        }
        
        this._setFirstPersonVisibility(preset.firstPerson);
        const { idealPos, idealLookAt } = this._computeRig(preset);
        const finalPos = preset.firstPerson
            ? idealPos.clone()
            : this._collideCamera(idealPos, idealLookAt, world);
        
        // Smooth interpolation
        const alpha = 1 - Math.exp(-preset.smoothSpeed * dt);
        this.currentPos.lerp(finalPos, alpha);
        this.currentLookAt.lerp(idealLookAt, alpha);
        
        // --- Speed-based FOV stretch ---
        let targetFOV = preset.fov;
        const state = this.target.state;
        if (state === 'SLIDE') {
            targetFOV = preset.slideFov;
        } else if (state === 'SPRINT') {
            targetFOV = preset.sprintFov;
        }
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, dt * 3.5);
        this.camera.updateProjectionMatrix();
        
        // --- Apply position with camera shake offset ---
        this.camera.position.copy(this.currentPos);
        
        const shakeOffset = this.postProcessing
            ? this.postProcessing.getShakeOffset(dt)
            : this.getLocalShakeOffset(dt);
        this.camera.position.add(shakeOffset);
        
        this.camera.lookAt(this.currentLookAt);
    }

    _computeRig(preset) {
        const targetPos = this.target.position;
        const eyeHeight = preset.firstPerson
            ? Math.max(1.1, (this.target.currentHeight || 1.8) * 0.82)
            : preset.lookAtHeight;
        const cosPitch = Math.cos(this.pitch);
        const sinPitch = Math.sin(this.pitch);

        this._forward.set(
            Math.sin(this.yaw) * cosPitch,
            sinPitch,
            Math.cos(this.yaw) * cosPitch
        ).normalize();
        this._flatForward.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
        this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

        this._idealLookAt.copy(targetPos)
            .addScaledVector(this._up, eyeHeight)
            .addScaledVector(this._right, preset.shoulderOffset * 0.35)
            .addScaledVector(this._forward, preset.aimForward);

        if (preset.firstPerson) {
            this._idealPos.copy(targetPos)
                .addScaledVector(this._up, eyeHeight)
                .addScaledVector(this._forward, 0.12);
        } else if (this.mode === CAMERA_MODES.CHASE) {
            this._idealPos.copy(targetPos)
                .addScaledVector(this._flatForward, -preset.distance)
                .addScaledVector(this._up, preset.height + sinPitch * preset.distance * 0.28);
        } else {
            this._idealPos.copy(targetPos)
                .addScaledVector(this._flatForward, -preset.distance)
                .addScaledVector(this._right, preset.shoulderOffset)
                .addScaledVector(this._up, preset.height + sinPitch * preset.distance * 0.22);
        }

        return { idealPos: this._idealPos, idealLookAt: this._idealLookAt };
    }

    _collideCamera(idealPos, idealLookAt, world) {
        const collidables = world && Array.isArray(world.collidables) ? world.collidables : [];
        const dir = new THREE.Vector3().subVectors(idealPos, idealLookAt).normalize();
        const ray = new THREE.Ray(idealLookAt, dir);
        const maxDist = idealLookAt.distanceTo(idealPos);
        let closestHit = maxDist;
        
        for (const obj of collidables) {
            const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
            const hitPoint = new THREE.Vector3();
            const result = ray.intersectBox(box, hitPoint);
            
            if (result !== null) {
                const dist = idealLookAt.distanceTo(hitPoint);
                if (dist < closestHit && dist > 1.0) {
                    closestHit = dist;
                }
            }
        }
        
        return idealLookAt.clone().add(dir.multiplyScalar(Math.max(0.6, closestHit - 0.3)));
    }

    _setFirstPersonVisibility(firstPerson) {
        if (!this.target || !this.target.mesh) return;
        if (this._targetMeshVisibility === null) {
            this._targetMeshVisibility = this.target.mesh.visible;
        }
        this.target.mesh.visible = firstPerson ? false : this._targetMeshVisibility;
    }
}

function shortestAngleDelta(from, to) {
    let delta = to - from;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    return delta;
}
