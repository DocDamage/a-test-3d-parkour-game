import * as THREE from 'three';

export class ThirdPersonCamera {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;
        
        this.yaw = 0;
        this.pitch = 0.35;
        
        this.currentPos = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        
        // Camera config
        this.distance = 6;
        this.height = 2.2;
        this.lookAtHeight = 1.3;
        this.minPitch = -0.4;
        this.maxPitch = 1.0;
        this.sensitivity = 0.002;
        this.smoothSpeed = 8;
        
        // Optional PostProcessing reference for delegated effects
        this.postProcessing = null;
        
        // Local camera shake fallback (used when no PostProcessing is wired)
        this.localShakeIntensity = 0;
        this.localShakeDuration = 0;
        this.localShakeMaxDuration = 0;
        this.localShakeOffset = new THREE.Vector3();
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
            this.postProcessing.shake(intensity, duration);
        } else {
            this.localShakeIntensity = Math.max(this.localShakeIntensity, intensity);
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
        // Update rotation from mouse input
        this.yaw -= mouseDelta.x * this.sensitivity;
        this.pitch += mouseDelta.y * this.sensitivity;
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
        
        // Calculate ideal camera position (spherical coords around target)
        const cosPitch = Math.cos(this.pitch);
        const sinPitch = Math.sin(this.pitch);
        
        const offsetX = Math.sin(this.yaw) * cosPitch * this.distance;
        const offsetY = sinPitch * this.distance + this.height;
        const offsetZ = Math.cos(this.yaw) * cosPitch * this.distance;
        
        const targetPos = this.target.position;
        const idealPos = new THREE.Vector3(
            targetPos.x + offsetX,
            targetPos.y + offsetY,
            targetPos.z + offsetZ
        );
        const idealLookAt = new THREE.Vector3(
            targetPos.x,
            targetPos.y + this.lookAtHeight,
            targetPos.z
        );
        
        // Collision detection with world
        const dir = new THREE.Vector3().subVectors(idealPos, idealLookAt).normalize();
        const ray = new THREE.Ray(idealLookAt, dir);
        const maxDist = idealLookAt.distanceTo(idealPos);
        
        let closestHit = maxDist;
        
        for (const obj of world.collidables) {
            const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
            const hitPoint = new THREE.Vector3();
            const result = ray.intersectBox(box, hitPoint);
            
            if (result !== null) {
                const dist = idealLookAt.distanceTo(hitPoint);
                // Ensure we don't get too close (min 1.5 units)
                if (dist < closestHit && dist > 1.5) {
                    closestHit = dist;
                }
            }
        }
        
        // Apply collision adjustment
        const finalPos = idealLookAt.clone().add(dir.multiplyScalar(closestHit - 0.3));
        
        // Smooth interpolation
        const alpha = 1 - Math.exp(-this.smoothSpeed * dt);
        this.currentPos.lerp(finalPos, alpha);
        this.currentLookAt.lerp(idealLookAt, alpha);
        
        // --- Speed-based FOV stretch ---
        let targetFOV = 75;
        const state = this.target.state;
        if (state === 'SLIDE') {
            targetFOV = 90;
        } else if (state === 'SPRINT') {
            targetFOV = 85;
        }
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, dt * 6);
        this.camera.updateProjectionMatrix();
        
        // --- Apply position with camera shake offset ---
        this.camera.position.copy(this.currentPos);
        
        const shakeOffset = this.postProcessing
            ? this.postProcessing.getShakeOffset(dt)
            : this.getLocalShakeOffset(dt);
        this.camera.position.add(shakeOffset);
        
        this.camera.lookAt(this.currentLookAt);
    }
}
