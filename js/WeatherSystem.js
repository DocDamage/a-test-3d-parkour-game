import * as THREE from 'three';

/**
 * WeatherSystem – atmospheric states for the warehouse.
 *
 * States:
 *   CLEAR        – default, no effects
 *   RAIN         – falling particles, splash, wet floor, rain ambience
 *   STEAM        – rising vent particles, increased fog density
 *   POWER_OUTAGE – emergency strobes, player flashlight, dark
 */
export class WeatherSystem {
	/**
	 * @param {THREE.Scene} scene
	 * @param {THREE.PerspectiveCamera} camera
	 * @param {Object} lights – { ambient, sun, fill, points }
	 */
	constructor(scene, camera, lights) {
		this.scene = scene;
		this.camera = camera;
		this.lights = lights;

		this.mode = 'CLEAR';

		// ---------- Rain ----------
		this.rainCount = 2000;
		this.rainDrops = [];
		this.rainGeo = new THREE.BoxGeometry(0.02, 0.15, 0.02);
		this.rainMat = new THREE.MeshBasicMaterial({ color: 0x8899aa, transparent: true, opacity: 0.6 });
		this._initRain();

		this.splashes = [];
		this.splashGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
		this.splashMat = new THREE.MeshBasicMaterial({ color: 0xaabbcc, transparent: true, opacity: 0.7 });

		this._originalFloorRoughness = null;
		this._wetFloorTimer = 0;

		// ---------- Steam ----------
		this.steamParticles = [];
		this.steamGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
		this.steamMat = new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.25 });
		// Fake pipe vent locations around the warehouse
		this.steamVents = [
			new THREE.Vector3(-20, 0, -20),
			new THREE.Vector3(20, 0, 20),
			new THREE.Vector3(-10, 0, 25),
			new THREE.Vector3(30, 0, -10),
			new THREE.Vector3(0, 0, -30),
		];
		this._steamTimer = 0;

		// ---------- Power Outage ----------
		this.emergencyLights = [];
		this._powerTimer = 0;
		this._flashlight = null;
		this._savedLightState = null;

		// ---------- Audio ----------
		this.rainAudioNode = null;
		this.rainAudioGain = null;
	}

	/* ============================================================
	 *  PUBLIC API
	 * ============================================================ */

	setWeather(mode) {
		if (this.mode === mode) return;

		// Cleanup previous state
		this._exitState(this.mode);
		this.mode = mode;
		this._enterState(this.mode);
	}

	update(dt) {
		switch (this.mode) {
			case 'RAIN':  this._updateRain(dt); break;
			case 'STEAM': this._updateSteam(dt); break;
			case 'POWER_OUTAGE': this._updatePowerOutage(dt); break;
			default: break;
		}
	}

	/* ============================================================
	 *  STATE TRANSITIONS
	 * ============================================================ */

	_enterState(mode) {
		switch (mode) {
			case 'RAIN':
				this._setRainVisible(true);
				this._startRainAudio();
				this._wetFloorTimer = 0;
				break;
			case 'STEAM':
				if (this.scene.fog) {
					this._savedFogDensity = this.scene.fog.density || 0;
					this.scene.fog.density = 0.12;
				}
				break;
			case 'POWER_OUTAGE':
				this._enterPowerOutage();
				break;
		}
	}

	_exitState(mode) {
		switch (mode) {
			case 'RAIN':
				this._setRainVisible(false);
				this._stopRainAudio();
				this._restoreFloorRoughness();
				break;
			case 'STEAM':
				if (this.scene.fog) {
					this.scene.fog.density = this._savedFogDensity || 0.02;
				}
				// Clear remaining steam particles
				for (const p of this.steamParticles) this.scene.remove(p.mesh);
				this.steamParticles = [];
				break;
			case 'POWER_OUTAGE':
				this._exitPowerOutage();
				break;
		}
	}

	/* ============================================================
	 *  RAIN
	 * ============================================================ */

	_initRain() {
		for (let i = 0; i < this.rainCount; i++) {
			const mesh = new THREE.Mesh(this.rainGeo, this.rainMat);
			mesh.visible = false;
			this.scene.add(mesh);
			this.rainDrops.push({
				mesh,
				x: (Math.random() - 0.5) * 80,
				y: 15 + Math.random() * 10,
				z: (Math.random() - 0.5) * 80,
				speed: 12 + Math.random() * 8,
			});
		}
	}

	_setRainVisible(visible) {
		for (const d of this.rainDrops) d.mesh.visible = visible;
	}

	_updateRain(dt) {
		for (const d of this.rainDrops) {
			d.y -= d.speed * dt;
			if (d.y <= 0) {
				// Splash
				this._addSplash(d.x, d.z);
				// Respawn
				d.x = this.camera.position.x + (Math.random() - 0.5) * 50;
				d.z = this.camera.position.z + (Math.random() - 0.5) * 50;
				d.y = 15 + Math.random() * 5;
			}
			d.mesh.position.set(d.x, d.y, d.z);
		}

		// Update splashes
		for (let i = this.splashes.length - 1; i >= 0; i--) {
			const s = this.splashes[i];
			s.life -= dt;
			s.mesh.position.y += s.velY * dt;
			s.mesh.scale.setScalar(1 - s.life / s.maxLife);
			s.mesh.material.opacity = s.life / s.maxLife * 0.7;
			if (s.life <= 0) {
				this.scene.remove(s.mesh);
				this.splashes.splice(i, 1);
			}
		}

		// Wet floor: reduce roughness over time
		this._wetFloorTimer += dt;
		if (this._wetFloorTimer > 2) {
			this._wetFloorTimer = 0;
			this._applyWetFloor();
		}
	}

	_addSplash(x, z) {
		// Only spawn splash near camera to save perf
		const camDist = Math.abs(x - this.camera.position.x) + Math.abs(z - this.camera.position.z);
		if (camDist > 30) return;

		const mesh = new THREE.Mesh(this.splashGeo, this.splashMat.clone());
		mesh.position.set(x, 0.05, z);
		this.scene.add(mesh);
		this.splashes.push({
			mesh,
			velY: 1 + Math.random() * 2,
			life: 0.15 + Math.random() * 0.1,
			maxLife: 0.25,
		});
	}

	_applyWetFloor() {
		// Find floor mesh in scene (first large plane)
		this.scene.traverse((obj) => {
			if (obj.isMesh && obj.geometry && obj.geometry.type === 'PlaneGeometry' && obj.material.roughness !== undefined) {
				if (this._originalFloorRoughness === null) {
					this._originalFloorRoughness = obj.material.roughness;
				}
				obj.material.roughness = THREE.MathUtils.lerp(obj.material.roughness, 0.4, 0.3);
			}
		});
	}

	_restoreFloorRoughness() {
		if (this._originalFloorRoughness === null) return;
		this.scene.traverse((obj) => {
			if (obj.isMesh && obj.geometry && obj.geometry.type === 'PlaneGeometry' && obj.material.roughness !== undefined) {
				obj.material.roughness = this._originalFloorRoughness;
			}
		});
		this._originalFloorRoughness = null;
	}

	/* ---------- Rain Audio (procedural noise) ---------- */

	_startRainAudio() {
		try {
			const AudioContext = window.AudioContext || window.webkitAudioContext;
			if (!this._audioCtx) this._audioCtx = new AudioContext();
			const ctx = this._audioCtx;
			if (ctx.state === 'suspended') ctx.resume();

			const bufferSize = Math.floor(ctx.sampleRate * 2); // 2-second loop
			const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < bufferSize; i++) {
				let env = 1;
				if (i < 1024) env = i / 1024;
				if (i > bufferSize - 1024) env = (bufferSize - i) / 1024;
				data[i] = (Math.random() * 2 - 1) * env;
			}

			const noise = ctx.createBufferSource();
			noise.buffer = buffer;
			noise.loop = true;

			const filter = ctx.createBiquadFilter();
			filter.type = 'lowpass';
			filter.frequency.value = 800;

			this.rainAudioGain = ctx.createGain();
			this.rainAudioGain.gain.setValueAtTime(0, ctx.currentTime);
			this.rainAudioGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1);

			noise.connect(filter);
			filter.connect(this.rainAudioGain);
			this.rainAudioGain.connect(ctx.destination);
			noise.start();

			this.rainAudioNode = noise;
		} catch (e) {
			// Audio not available – silently ignore
		}
	}

	_stopRainAudio() {
		if (this.rainAudioGain && this._audioCtx) {
			try {
				this.rainAudioGain.gain.linearRampToValueAtTime(0, this._audioCtx.currentTime + 0.5);
			} catch (e) {}
		}
		if (this.rainAudioNode) {
			try {
				this.rainAudioNode.stop(this._audioCtx.currentTime + 0.6);
			} catch (e) {}
			this.rainAudioNode = null;
		}
		this.rainAudioGain = null;
	}

	/* ============================================================
	 *  STEAM
	 * ============================================================ */

	_updateSteam(dt) {
		this._steamTimer += dt;
		// Spawn new particles periodically
		if (this._steamTimer > 0.06) {
			this._steamTimer -= 0.06;
			const vent = this.steamVents[Math.floor(Math.random() * this.steamVents.length)];
			const mesh = new THREE.Mesh(this.steamGeo, this.steamMat.clone());
			mesh.position.set(
				vent.x + (Math.random() - 0.5) * 1.5,
				vent.y + 0.2,
				vent.z + (Math.random() - 0.5) * 1.5
			);
			this.scene.add(mesh);
			this.steamParticles.push({
				mesh,
				life: 4 + Math.random() * 3,
				maxLife: 7,
				velY: 0.5 + Math.random() * 1,
				drift: new THREE.Vector3((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3),
			});
		}

		// Update existing steam
		for (let i = this.steamParticles.length - 1; i >= 0; i--) {
			const p = this.steamParticles[i];
			p.life -= dt;
			p.mesh.position.y += p.velY * dt;
			p.mesh.position.x += p.drift.x * dt;
			p.mesh.position.z += p.drift.z * dt;
			p.mesh.rotation.x += dt * 0.3;
			p.mesh.rotation.y += dt * 0.2;

			const ratio = p.life / p.maxLife;
			p.mesh.material.opacity = 0.15 * ratio;
			const s = 1 + (1 - ratio) * 3;
			p.mesh.scale.setScalar(s);

			if (p.life <= 0) {
				this.scene.remove(p.mesh);
				p.mesh.material.dispose();
				this.steamParticles.splice(i, 1);
			}
		}
	}

	/* ============================================================
	 *  POWER OUTAGE
	 * ============================================================ */

	_enterPowerOutage() {
		if (!this.lights) return;

		// Save current state
		this._savedLightState = {
			ambient: { intensity: this.lights.ambient.intensity },
			sun:     { intensity: this.lights.sun.intensity },
			fill:    { intensity: this.lights.fill.intensity },
			points:  this.lights.points.map(pl => ({ intensity: pl.intensity })),
		};

		// Kill main lights
		this.lights.ambient.intensity = 0.02;
		this.lights.sun.intensity = 0;
		this.lights.fill.intensity = 0;
		for (const pl of this.lights.points) pl.intensity = 0;

		// Create emergency red strobes at the original point-light positions
		for (let i = 0; i < this.lights.points.length; i++) {
			const orig = this.lights.points[i];
			const light = new THREE.PointLight(0xff0000, 0, 20);
			light.position.copy(orig.position);
			this.scene.add(light);
			this.emergencyLights.push({ light, phase: i * 1.5 });
		}

		// Player flashlight (SpotLight attached to camera)
		if (!this._flashlight) {
			this._flashlight = new THREE.SpotLight(0xffffff, 2, 25, Math.PI / 5, 0.5, 1);
			this._flashlight.position.set(0, 0, 0);
			this._flashlight.target.position.set(0, 0, -1);
			this.camera.add(this._flashlight);
			this.camera.add(this._flashlight.target);
		}
		this._flashlight.intensity = 2;
	}

	_updatePowerOutage(dt) {
		this._powerTimer += dt;
		// 2 Hz strobe
		for (const el of this.emergencyLights) {
			const t = this._powerTimer + el.phase;
			const on = (t % 0.5) < 0.25; // 2 Hz square wave
			el.light.intensity = on ? 1.5 : 0.1;
		}
	}

	_exitPowerOutage() {
		if (!this._savedLightState) return;

		// Restore main lights
		this.lights.ambient.intensity = this._savedLightState.ambient.intensity;
		this.lights.sun.intensity = this._savedLightState.sun.intensity;
		this.lights.fill.intensity = this._savedLightState.fill.intensity;
		for (let i = 0; i < this.lights.points.length; i++) {
			this.lights.points[i].intensity = this._savedLightState.points[i].intensity;
		}

		// Remove emergency lights
		for (const el of this.emergencyLights) {
			this.scene.remove(el.light);
		}
		this.emergencyLights = [];

		// Hide flashlight
		if (this._flashlight) {
			this._flashlight.intensity = 0;
		}

		this._savedLightState = null;
	}
}
