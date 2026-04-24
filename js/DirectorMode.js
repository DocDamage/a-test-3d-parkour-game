import * as THREE from 'three';

/**
 * DirectorMode - AI Camera Director
 * Auto-films big moments by predicting events, switching to slow-mo,
 * and cutting between cinematic angles.
 */
export class DirectorMode {
    constructor() {
        this._active = false;
        this._filming = false;
        this._filmTimer = 0;
        this._filmDuration = 3.5;
        this._modeTimer = 0;
        this._modeDuration = 1.2;
        this._currentMode = 'wide';
        this._timeScale = 1.0;
        this._slowMoTarget = 0.3;

        // Rolling buffer of camera states (last 30 seconds)
        this._bufferDuration = 30;
        this._buffer = []; // { t, pos:[x,y,z], quat:[x,y,z,w], target:[x,y,z], fov, mode }

        // Highlights extracted from buffer when events occur
        this.highlights = []; // { startTime, endTime, states: [] }
        this._currentHighlight = null;

        // Predicted / registered events
        this._pendingEvents = []; // { type, position, timeToImpact }
        this._eventCooldowns = new Map(); // type -> timer

        // Auto-detection state
        this._prevState = 'IDLE';
        this._prevVelocity = new THREE.Vector3();
        this._prevFlowLevel = 0;
        this._nearMissTimer = 0;
        this._dramaTimer = 0;

        // Hazard registry for near-miss detection
        this._hazards = []; // { type, position, radius }

        // Orbit data
        this._orbitYaw = 0;
        this._orbitPitch = 0.4;
        this._orbitTarget = new THREE.Vector3();
        this._orbitPos = new THREE.Vector3();
        this._savedControllerState = null;

        this._elapsed = 0;
        this._totalTime = 0;
    }

    /**
     * Register an upcoming event so the director can prepare.
     * Call this from external systems (e.g., collapsing pillars).
     */
    registerEvent(type, position, timeToImpact = 0.6) {
        this._pendingEvents.push({
            type,
            position: position.clone ? position.clone() : new THREE.Vector3(position.x, position.y, position.z),
            timeToImpact: Math.max(0.05, timeToImpact),
            registeredAt: this._totalTime
        });
    }

    /** Alias for registerEvent. */
    predictEvent(type, position, timeToImpact = 0.6) {
        this.registerEvent(type, position, timeToImpact);
    }

    /** Register a hazard position for near-miss detection. */
    registerHazard(type, position, radius = 2.5) {
        this._hazards.push({
            type,
            position: position.clone ? position.clone() : new THREE.Vector3(position.x, position.y, position.z),
            radius
        });
    }

    /** Clear all registered hazards. */
    clearHazards() {
        this._hazards.length = 0;
    }

    isActive() {
        return this._filming;
    }

    /** Return current time scale (1.0 normal, 0.3 when filming). */
    getTimeScale() {
        return this._timeScale;
    }

    /**
     * Export highlights as a JSON blob that can be saved or shared.
     */
    exportReplay() {
        const payload = {
            version: 1,
            exportedAt: Date.now(),
            duration: this._totalTime,
            highlightCount: this.highlights.length,
            highlights: this.highlights.map(h => ({
                startTime: h.startTime,
                endTime: h.endTime,
                duration: h.endTime - h.startTime,
                states: h.states.map(s => ({
                    t: s.t,
                    pos: s.pos,
                    quat: s.quat,
                    target: s.target,
                    fov: s.fov,
                    mode: s.mode
                }))
            }))
        };
        return JSON.stringify(payload);
    }

    /** Start filming manually (or call internally). */
    startFilming(reason = 'manual') {
        if (this._filming) return;
        this._filming = true;
        this._active = true;
        this._filmTimer = this._filmDuration;
        this._modeTimer = 0;
        this._currentMode = this._pickNextMode();
        this._timeScale = this._slowMoTarget;

        // Begin a new highlight by grabbing the trailing 2s from buffer
        const now = this._totalTime;
        const trailStart = now - 2;
        const trailStates = this._buffer.filter(s => s.t >= trailStart && s.t <= now);
        this._currentHighlight = {
            startTime: trailStart,
            endTime: now,
            states: trailStates.slice()
        };
    }

    stopFilming() {
        if (!this._filming) return;
        this._filming = false;
        this._active = false;
        this._timeScale = 1.0;

        if (this._currentHighlight) {
            this._currentHighlight.endTime = this._totalTime;
            this.highlights.push(this._currentHighlight);
            // Keep highlights array bounded
            if (this.highlights.length > 20) {
                this.highlights.shift();
            }
            this._currentHighlight = null;
        }
    }

    /**
     * Main update. Call every frame.
     * @param {number} dt - delta time in seconds (realtime)
     * @param {Player} player
     * @param {THREE.Camera} camera
     * @param {ThirdPersonCamera} cameraController
     * @returns {number} timeScale for this frame
     */
    update(dt, player, camera, cameraController) {
        this._totalTime += dt;
        this._elapsed += dt;

        // Record camera state into rolling buffer
        this._recordState(camera);

        // Process pending predicted events
        this._updatePendingEvents(dt, player);

        // Auto-detect moments from player state
        this._detectAutoEvents(dt, player);

        // Cooldowns
        for (const [key, val] of this._eventCooldowns) {
            this._eventCooldowns.set(key, Math.max(0, val - dt));
        }

        // Filming behaviour
        if (this._filming) {
            this._filmTimer -= dt;
            this._modeTimer -= dt;
            this._timeScale = THREE.MathUtils.lerp(this._timeScale, this._slowMoTarget, dt * 4);

            if (this._modeTimer <= 0) {
                this._modeTimer = this._modeDuration + (Math.random() * 0.4 - 0.2);
                this._currentMode = this._pickNextMode(this._currentMode);
            }

            this._applyCinematicCamera(dt, player, camera, cameraController);

            // Append to current highlight
            if (this._currentHighlight) {
                this._currentHighlight.states.push(this._captureState(camera));
                this._currentHighlight.endTime = this._totalTime;
            }

            if (this._filmTimer <= 0) {
                this.stopFilming();
            }
        } else {
            this._timeScale = THREE.MathUtils.lerp(this._timeScale, 1.0, dt * 3);
        }

        this._prevState = player.state;
        this._prevVelocity.copy(player.velocity);
        this._prevFlowLevel = player.comboSystem ? player.comboSystem.getFlowLevel() : 0;

        return this._timeScale;
    }

    // ============================================================
    //  INTERNALS
    // ============================================================

    _recordState(camera) {
        const state = this._captureState(camera);
        this._buffer.push(state);
        // Prune old states
        const cutoff = this._totalTime - this._bufferDuration;
        while (this._buffer.length > 0 && this._buffer[0].t < cutoff) {
            this._buffer.shift();
        }
    }

    _captureState(camera) {
        return {
            t: this._totalTime,
            pos: [camera.position.x, camera.position.y, camera.position.z],
            quat: [camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w],
            target: [
                camera.userData.lastLookAt ? camera.userData.lastLookAt.x : camera.position.x + camera.getWorldDirection(new THREE.Vector3()).x,
                camera.userData.lastLookAt ? camera.userData.lastLookAt.y : camera.position.y + camera.getWorldDirection(new THREE.Vector3()).y,
                camera.userData.lastLookAt ? camera.userData.lastLookAt.z : camera.position.z + camera.getWorldDirection(new THREE.Vector3()).z
            ],
            fov: camera.fov || 75,
            mode: this._currentMode
        };
    }

    _updatePendingEvents(dt, player) {
        for (let i = this._pendingEvents.length - 1; i >= 0; i--) {
            const ev = this._pendingEvents[i];
            ev.timeToImpact -= dt;

            // Start filming 0.5s before impact
            if (ev.timeToImpact <= 0.5 && ev.timeToImpact > 0 && !this._filming) {
                if (player.position.distanceTo(ev.position) < 20) {
                    this.startFilming(ev.type);
                }
            }

            if (ev.timeToImpact <= 0) {
                this._pendingEvents.splice(i, 1);
            }
        }
    }

    _detectAutoEvents(dt, player) {
        const vel = player.velocity;
        const speed = vel.length();
        const prevSpeed = this._prevVelocity.length();
        const state = player.state;
        const flow = player.comboSystem ? player.comboSystem.getFlowLevel() : 0;

        // 1. Drone takedown detection:
        //    Previous state WALLRUN -> current JUMP with high horizontal velocity
        if (this._prevState === 'WALLRUN' && state === 'JUMP') {
            const horiz = new THREE.Vector3(vel.x, 0, vel.z).length();
            if (horiz > 8 && this._checkCooldown('takedown', 2.0)) {
                this.startFilming('takedown');
                return;
            }
        }

        // 2. Near-miss with laser / hazard:
        //    High speed + close to registered hazard + dodge/roll/slide state
        if ((state === 'ROLL' || state === 'SLIDE' || state === 'WALLRUN') && speed > 6) {
            for (const haz of this._hazards) {
                const dist = player.position.distanceTo(haz.position);
                if (dist < haz.radius + 1.5) {
                    if (this._checkCooldown('nearMiss', 1.5)) {
                        this.startFilming('nearMiss');
                        return;
                    }
                }
            }
        }

        // 3. High flow aerial stunts
        if (flow >= 3 && !player.grounded && speed > 8) {
            this._dramaTimer += dt;
            if (this._dramaTimer > 0.8 && this._checkCooldown('flowAerial', 3.0)) {
                this.startFilming('flowAerial');
                this._dramaTimer = 0;
                return;
            }
        } else {
            this._dramaTimer = Math.max(0, this._dramaTimer - dt);
        }

        // 4. Sudden direction change at high speed (dodge)
        if (speed > 10 && prevSpeed > 10) {
            const dot = this._prevVelocity.dot(vel) / (prevSpeed * speed);
            if (dot < 0.3 && this._checkCooldown('sharpDodge', 2.0)) {
                this.startFilming('sharpDodge');
                return;
            }
        }

        // 5. RAGDOLL / hard impact
        if (state === 'RAGDOLL' && this._prevState !== 'RAGDOLL') {
            if (this._checkCooldown('ragdoll', 2.0)) {
                this.startFilming('ragdoll');
                return;
            }
        }
    }

    _checkCooldown(type, duration) {
        const remaining = this._eventCooldowns.get(type) || 0;
        if (remaining > 0) return false;
        this._eventCooldowns.set(type, duration);
        return true;
    }

    _pickNextMode(exclude) {
        const modes = ['wide', 'shoulder', 'low'];
        const pool = modes.filter(m => m !== exclude);
        return pool[Math.floor(Math.random() * pool.length)];
    }

    _applyCinematicCamera(dt, player, camera, cameraController) {
        const targetPos = player.position.clone();
        const facingDir = new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing));

        let idealPos = new THREE.Vector3();
        let idealLookAt = new THREE.Vector3();
        let targetFOV = 75;

        const baseDist = cameraController ? cameraController.distance : 6;
        const baseHeight = cameraController ? cameraController.height : 2.2;

        switch (this._currentMode) {
            case 'wide': {
                // Elevated wide shot looking down at player
                const yaw = this._totalTime * 0.4; // slow orbit
                const dist = baseDist * 2.5;
                const height = baseHeight + 3.5;
                idealPos.set(
                    targetPos.x + Math.sin(yaw) * dist,
                    targetPos.y + height,
                    targetPos.z + Math.cos(yaw) * dist
                );
                idealLookAt.copy(targetPos).add(new THREE.Vector3(0, 1.2, 0));
                targetFOV = 85;
                break;
            }
            case 'shoulder': {
                // Over-shoulder from slightly behind and to the side
                const side = facingDir.clone().cross(new THREE.Vector3(0, 1, 0)).multiplyScalar(1.2);
                const back = facingDir.clone().multiplyScalar(-baseDist * 0.6);
                idealPos.copy(targetPos).add(back).add(side);
                idealPos.y += baseHeight * 0.6;
                idealLookAt.copy(targetPos).add(facingDir.clone().multiplyScalar(6)).add(new THREE.Vector3(0, 1.0, 0));
                targetFOV = 70;
                break;
            }
            case 'low': {
                // Dramatic low angle looking up at player
                const back = facingDir.clone().multiplyScalar(-baseDist * 1.2);
                idealPos.copy(targetPos).add(back);
                idealPos.y = Math.max(0.3, targetPos.y - 0.5);
                idealLookAt.copy(targetPos).add(new THREE.Vector3(0, 1.6, 0));
                targetFOV = 90;
                break;
            }
        }

        // Smooth camera
        const alpha = 1 - Math.exp(-2.5 * dt);
        this._orbitPos.lerp(idealPos, alpha);
        this._orbitTarget.lerp(idealLookAt, alpha);

        camera.position.copy(this._orbitPos);
        camera.lookAt(this._orbitTarget);
        camera.userData.lastLookAt = this._orbitTarget.clone();

        if (camera.fov !== undefined) {
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, alpha);
            camera.updateProjectionMatrix();
        }
    }
}
