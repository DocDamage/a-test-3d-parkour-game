import * as THREE from 'three';

/**
 * BulletTime - Explosive event slow-motion system.
 * Triggers a localized time dilation when explosions occur,
 * with a slight desaturation + contrast boost visual effect.
 */
export class BulletTime {
    constructor(renderer = null, scene = null, containerElement = null) {
        this.renderer = renderer;
        this.scene = scene;

        this.timeScale = 1.0;
        this.targetTimeScale = 1.0;
        this._returnSpeed = 3.0;

        // Active bullet-time zones
        this.zones = []; // { origin, radius, timer, active }
        this.defaultDuration = 0.4;
        this.defaultRadius = 8.0;
        this.slowMoScale = 0.2;

        // Visual overlay
        this._overlay = null;
        this._container = containerElement;
        this._setupOverlay();
    }

    /** Create a CSS-based overlay for desaturation / contrast. */
    _setupOverlay() {
        // Try to find a sensible container if none provided
        let target = this._container;
        if (!target && typeof document !== 'undefined') {
            target = document.querySelector('canvas');
            if (!target) target = document.body;
        }
        if (!target) return;

        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = '0';
        div.style.left = '0';
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.pointerEvents = 'none';
        div.style.zIndex = '10';
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.15s ease-out';
        div.style.backdropFilter = 'saturate(0.65) contrast(1.35)';
        div.style.webkitBackdropFilter = 'saturate(0.65) contrast(1.35)';

        // Ensure the overlay sits on top of the canvas but doesn't block input
        target.style.position = target.style.position || 'relative';
        target.parentElement.style.position = target.parentElement.style.position || 'relative';
        target.parentElement.appendChild(div);

        this._overlay = div;
    }

    /**
     * Trigger bullet time at a world position.
     * @param {THREE.Vector3} origin
     * @param {number} radius
     */
    trigger(origin, radius = this.defaultRadius) {
        const o = origin.clone ? origin.clone() : new THREE.Vector3(origin.x, origin.y, origin.z);
        this.zones.push({
            origin: o,
            radius: radius,
            timer: this.defaultDuration,
            active: true
        });

        this.targetTimeScale = this.slowMoScale;
        this._updateOverlay(0.45);
    }

    /**
     * Check if a world position is currently inside an active bullet-time zone.
     * @param {THREE.Vector3} position
     * @returns {boolean}
     */
    isNearEvent(position) {
        for (const z of this.zones) {
            if (!z.active) continue;
            if (position.distanceTo(z.origin) <= z.radius) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get current time scale for a specific position (spatial bullet time).
     * @param {THREE.Vector3} position
     * @returns {number}
     */
    getTimeScaleAtPosition(position) {
        for (const z of this.zones) {
            if (!z.active) continue;
            const dist = position.distanceTo(z.origin);
            if (dist <= z.radius) {
                // Smooth falloff at edges
                const edge = Math.max(0, dist - (z.radius * 0.7)) / (z.radius * 0.3);
                return THREE.MathUtils.lerp(this.slowMoScale, 1.0, edge);
            }
        }
        return this.timeScale;
    }

    /**
     * Main update.
     * @param {number} dt - real delta time in seconds
     * @returns {number} current global time scale
     */
    update(dt) {
        let anyActive = false;

        for (const z of this.zones) {
            if (!z.active) continue;
            z.timer -= dt;
            if (z.timer <= 0) {
                z.active = false;
            } else {
                anyActive = true;
            }
        }

        // Clean up expired zones
        this.zones = this.zones.filter(z => z.active);

        if (anyActive) {
            this.targetTimeScale = this.slowMoScale;
        } else {
            this.targetTimeScale = 1.0;
        }

        // Smoothly interpolate current time scale
        this.timeScale = THREE.MathUtils.lerp(this.timeScale, this.targetTimeScale, dt * this._returnSpeed);
        if (Math.abs(this.timeScale - this.targetTimeScale) < 0.005) {
            this.timeScale = this.targetTimeScale;
        }

        // Visual overlay intensity based on how deep in slow-mo we are
        const blend = 1.0 - ((this.timeScale - this.slowMoScale) / (1.0 - this.slowMoScale));
        const opacity = Math.max(0, Math.min(0.5, blend * 0.5));
        this._updateOverlay(opacity);

        return this.timeScale;
    }

    /** Return true if bullet time is currently active. */
    isActive() {
        return this.timeScale < 0.95;
    }

    _updateOverlay(opacity) {
        if (this._overlay) {
            this._overlay.style.opacity = String(opacity);
        }
    }

    /** Destroy overlay element. Call on game teardown. */
    dispose() {
        if (this._overlay && this._overlay.parentElement) {
            this._overlay.parentElement.removeChild(this._overlay);
            this._overlay = null;
        }
    }
}
