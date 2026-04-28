import * as THREE from 'three';

/**
 * RunnerVision – tactical highlight mode for interactable objects.
 *
 * Press V to toggle. Smoothly lerps emissive tints on/off over 0.3 s.
 * Does NOT permanently modify materials; original emissive values are
 * stored and restored when the effect turns off.
 *
 * Highlights:
 *   • Climbable walls   → red   (+ point light)
 *   • Vaultable barriers→ orange
 *   • Grapple anchors   → cyan
 *   • Checkpoints       → green (if TimeTrial provided)
 */
export class RunnerVision {
	/**
	 * @param {THREE.Scene} scene
	 * @param {World} world
	 * @param {TimeTrial} [timeTrial] – optional
	 */
	constructor(scene, world, timeTrial = null) {
		this.scene = scene;
		this.world = world;
		this.timeTrial = timeTrial;

		this.active = false;
		this.transition = 0;       // 0..1
		this.transitionSpeed = 1 / 0.3; // 0.3 s full ramp

		// Highlight colour per category
		this.colors = {
			climbable: new THREE.Color(0xff0000),
			vaultable: new THREE.Color(0xff8800),
			grapple:   new THREE.Color(0x00ffff),
			checkpoint: new THREE.Color(0x00ff00),
		};

		// Store original emissive state: Map<objectUUID, { obj, emissive, intensity }>
		this._originals = new Map();

		// Point lights for climbables (one per climbable mesh)
		this._lights = new Map(); // objUUID -> PointLight

		// Pre-scan world objects
		this._scanWorld();
	}

	/** Call before discarding to clean up. */
	dispose() {
		this._restoreAll();
	}

	/* ============================================================
	 *  PUBLIC API
	 * ============================================================ */

	toggle() {
		this.active = !this.active;
	}

	/**
	 * InputManager routing. Call from main.js if available.
	 * @param {InputManager} input
	 */
	handleInput(input) {
		if (input.wasPressed('KeyV')) this.toggle();
	}

	/**
	 * Call every frame.
	 * @param {number} dt
	 */
	update(dt) {
		// Smooth transition
		const target = this.active ? 1 : 0;
		if (this.transition !== target) {
			this.transition += Math.sign(target - this.transition) * this.transitionSpeed * dt;
			this.transition = THREE.MathUtils.clamp(this.transition, 0, 1);
		}

		if (this.transition <= 0 && !this.active) {
			// Fully off: ensure everything is restored and hidden
			this._restoreAll();
			return;
		}

		// Apply highlights scaled by transition
		const t = this.transition;
		for (const [uuid, data] of this._originals) {
			const obj = data.obj;
			if (!obj.material) continue;

			// Lerp emissive colour toward target
			obj.material.emissive.lerpColors(data.emissive, data.targetColor, t);
			obj.material.emissiveIntensity = THREE.MathUtils.lerp(data.intensity, data.targetIntensity, t);
		}

		// Update point-light intensities
		for (const [uuid, light] of this._lights) {
			light.intensity = 1.5 * t;
		}
	}

	/* ============================================================
	 *  PRIVATE – WORLD SCANNING
	 * ============================================================ */

	_scanWorld() {
		// Climbables
		for (const obj of this.world.climbables) {
			this._track(obj, this.colors.climbable, 1.2);
			this._addLight(obj, this.colors.climbable);
		}

		// Vaultables & grapple anchors from collidables
		const climbSet = new Set(this.world.climbables);
		for (const obj of this.world.collidables) {
			if (climbSet.has(obj)) continue;
			if (!obj.userData || !obj.userData.size) continue;

			const s = obj.userData.size;
			const height = s.y;
			const footprint = s.x * s.z;

			if (height <= 1.5) {
				// Low barrier → vaultable
				this._track(obj, this.colors.vaultable, 0.9);
			} else if (height > 3 && footprint < 6) {
				// Tall narrow object → grapple anchor
				this._track(obj, this.colors.grapple, 1.0);
			}
		}

		// Checkpoints
		if (this.timeTrial) {
			for (const cp of this.timeTrial.checkpoints) {
				this._track(cp.mesh, this.colors.checkpoint, 1.0);
			}
		}
	}

	_track(obj, targetColor, targetIntensity) {
		if (!obj.material) return;
		// Clone current emissive so we can restore it later
		this._originals.set(obj.uuid, {
			obj,
			emissive: obj.material.emissive.clone(),
			intensity: obj.material.emissiveIntensity,
			targetColor: targetColor.clone(),
			targetIntensity,
		});
	}

	_addLight(obj, color) {
		const light = new THREE.PointLight(color, 0, 8);
		light.position.copy(obj.position);
		// Offset slightly toward the front
		light.position.y += 1;
		this.scene.add(light);
		this._lights.set(obj.uuid, light);
	}

	_restoreAll() {
		for (const [uuid, data] of this._originals) {
			const obj = data.obj;
			if (obj.material) {
				obj.material.emissive.copy(data.emissive);
				obj.material.emissiveIntensity = data.intensity;
			}
		}
		for (const light of this._lights.values()) {
			light.intensity = 0;
		}
	}
}
