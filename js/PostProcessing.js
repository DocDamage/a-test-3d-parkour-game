import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SAOPass } from 'three/addons/postprocessing/SAOPass.js';

/**
 * Custom radial motion-blur shader.
 * Samples are pulled outward from screen centre; intensity is driven by
 * player horizontal speed so sprinting / sliding feel fast.
 */
const MotionBlurShader = {
	name: 'MotionBlurShader',
	uniforms: {
		tDiffuse: { value: null },
		speed:    { value: 0.0 }
	},
	vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: /* glsl */`
		uniform sampler2D tDiffuse;
		uniform float speed;
		varying vec2 vUv;

		void main() {
			vec2 center = vec2(0.5, 0.5);
			vec2 dir = vUv - center;
			float dist = length(dir);
			dir = dist > 0.0 ? normalize(dir) : vec2(0.0);

			vec4 color = texture2D(tDiffuse, vUv);
			float total = 1.0;

			// 8-sample radial blur; weight falls off with distance from centre
			for (int i = 1; i <= 8; i++) {
				float t = float(i) / 8.0;
				vec2 offset = dir * speed * t * 0.035;
				float weight = (1.0 - t) * 0.5;
				color += texture2D(tDiffuse, vUv - offset) * weight;
				total += weight;
			}

			gl_FragColor = color / total;
		}
	`
};

/* =============================================================
 *  NEW POST-PROCESSING SHADERS
 * ============================================================= */

/** Subtle film-grain noise overlay. */
const FilmGrainShader = {
	name: 'FilmGrainShader',
	uniforms: {
		tDiffuse: { value: null },
		time:     { value: 0.0 },
		strength: { value: 0.05 }
	},
	vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: /* glsl */`
		uniform sampler2D tDiffuse;
		uniform float time;
		uniform float strength;
		varying vec2 vUv;

		float rand(vec2 co) {
			return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
		}

		void main() {
			vec4 color = texture2D(tDiffuse, vUv);
			float noise = rand(vUv * time) - 0.5;
			color.rgb += noise * strength;
			gl_FragColor = color;
		}
	`
};

/** RGB channel offset that increases toward screen edges. */
const ChromaticAberrationShader = {
	name: 'ChromaticAberrationShader',
	uniforms: {
		tDiffuse: { value: null },
		strength: { value: 0.005 }
	},
	vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: /* glsl */`
		uniform sampler2D tDiffuse;
		uniform float strength;
		varying vec2 vUv;

		void main() {
			vec2 center = vec2(0.5, 0.5);
			vec2 dir = vUv - center;
			float dist = length(dir);
			vec2 offset = dir * strength * dist;

			float r = texture2D(tDiffuse, vUv + offset).r;
			float g = texture2D(tDiffuse, vUv).g;
			float b = texture2D(tDiffuse, vUv - offset).b;

			gl_FragColor = vec4(r, g, b, 1.0);
		}
	`
};

/** Darkened screen corners. */
const VignetteShader = {
	name: 'VignetteShader',
	uniforms: {
		tDiffuse: { value: null },
		strength: { value: 1.5 }
	},
	vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: /* glsl */`
		uniform sampler2D tDiffuse;
		uniform float strength;
		varying vec2 vUv;

		void main() {
			vec4 color = texture2D(tDiffuse, vUv);
			vec2 center = vec2(0.5, 0.5);
			float dist = distance(vUv, center);
			float vignette = 1.0 - dist * dist * strength;
			color.rgb *= clamp(vignette, 0.0, 1.0);
			gl_FragColor = color;
		}
	`
};

/**
 * Full-screen colour-filter pass used by Photo Mode.
 * mode: 0=off, 1=grayscale, 2=sepia, 3=invert, 4=cyberpunk, 5=overexposed
 */
const FilterShader = {
	name: 'FilterShader',
	uniforms: {
		tDiffuse: { value: null },
		mode:     { value: 0 },
		amount:   { value: 1.0 }
	},
	vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: /* glsl */`
		uniform sampler2D tDiffuse;
		uniform int mode;
		uniform float amount;
		varying vec2 vUv;

		void main() {
			vec4 color = texture2D(tDiffuse, vUv);

			if (mode == 1) { // grayscale
				float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
				color.rgb = mix(color.rgb, vec3(gray), amount);
			}
			else if (mode == 2) { // sepia
				vec3 sepia = vec3(
					dot(color.rgb, vec3(0.393, 0.769, 0.189)),
					dot(color.rgb, vec3(0.349, 0.686, 0.168)),
					dot(color.rgb, vec3(0.272, 0.534, 0.131))
				);
				color.rgb = mix(color.rgb, sepia, amount);
			}
			else if (mode == 3) { // invert
				color.rgb = mix(color.rgb, 1.0 - color.rgb, amount);
			}
			else if (mode == 4) { // cyberpunk
				float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
				vec3 boosted = mix(vec3(lum), color.rgb, 1.8);
				boosted.r += 0.12 * amount;
				boosted.b += 0.18 * amount;
				boosted.g -= 0.06 * amount;
				color.rgb = mix(color.rgb, clamp(boosted, 0.0, 1.0), amount);
			}
			else if (mode == 5) { // overexposed
				color.rgb = mix(color.rgb, color.rgb * 2.2 + 0.25, amount);
			}

			gl_FragColor = color;
		}
	`
};

/**
 * Post-processing pipeline for the warehouse parkour game.
 *
 * Pass chain (in order):
 *   1. RenderPass
 *   2. SAOPass  – screen-space ambient occlusion
 *   3. UnrealBloomPass
 *   4. ShaderPass (custom radial motion blur)
 *   5. ShaderPass (film grain)
 *   6. ShaderPass (chromatic aberration)
 *   7. ShaderPass (vignette)
 *   8. ShaderPass (photo-mode colour filter)
 *   9. OutputPass – tone-mapping + sRGB output
 *
 * Also handles:
 *   - Camera shake
 *   - Day / night / neon lighting transitions
 *   - Per-effect toggles
 */
export class PostProcessing {
	constructor(renderer, scene, camera) {
		this.renderer = renderer;
		this.scene    = scene;
		this.camera   = camera;

		this.width  = renderer.domElement.width;
		this.height = renderer.domElement.height;

		/* ---------- toggles ---------- */
		this.bloomEnabled      = true;
		this.saoEnabled        = true;
		this.motionBlurEnabled = true;
		this.filmGrainEnabled  = false;
		this.chromaticAberrationEnabled = false;
		this.vignetteEnabled   = false;

		/* ---------- composer ---------- */
		this.composer = new EffectComposer(renderer);

		// 1. RenderPass
		this.renderPass = new RenderPass(scene, camera);
		this.composer.addPass(this.renderPass);

		// 2. SAO (available in r160)
		this.saoPass = new SAOPass(
			scene, camera,
			new THREE.Vector2(this.width, this.height)
		);
		this.saoPass.params.saoBias              = 0.5;
		this.saoPass.params.saoIntensity         = 0.25;
		this.saoPass.params.saoScale             = 50;
		this.saoPass.params.saoKernelRadius      = 25;
		this.saoPass.params.saoMinResolution     = 0;
		this.saoPass.params.saoBlur              = true;
		this.saoPass.params.saoBlurRadius        = 4;
		this.saoPass.params.saoBlurStdDev        = 4;
		this.saoPass.params.saoBlurDepthCutoff   = 0.01;
		this.composer.addPass(this.saoPass);

		// 3. UnrealBloomPass
		this.bloomPass = new UnrealBloomPass(
			new THREE.Vector2(this.width, this.height),
			0.4,   // strength
			0.5,   // radius
			0.85   // threshold
		);
		this.composer.addPass(this.bloomPass);

		// 4. Custom motion-blur pass
		this.motionBlurPass = new ShaderPass(MotionBlurShader);
		this.motionBlurPass.uniforms.speed.value = 0.0;
		this.composer.addPass(this.motionBlurPass);

		// 5. Film Grain
		this.filmGrainPass = new ShaderPass(FilmGrainShader);
		this.filmGrainPass.uniforms.time.value = 0.0;
		this.filmGrainPass.uniforms.strength.value = 0.05;
		this.filmGrainPass.enabled = false;
		this.composer.addPass(this.filmGrainPass);

		// 6. Chromatic Aberration
		this.chromaticAberrationPass = new ShaderPass(ChromaticAberrationShader);
		this.chromaticAberrationPass.uniforms.strength.value = 0.005;
		this.chromaticAberrationPass.enabled = false;
		this.composer.addPass(this.chromaticAberrationPass);

		// 7. Vignette
		this.vignettePass = new ShaderPass(VignetteShader);
		this.vignettePass.uniforms.strength.value = 1.5;
		this.vignettePass.enabled = false;
		this.composer.addPass(this.vignettePass);

		// 8. Photo-mode filter pass
		this.filterPass = new ShaderPass(FilterShader);
		this.filterPass.uniforms.mode.value = 0;
		this.filterPass.uniforms.amount.value = 1.0;
		this.filterPass.enabled = false;
		this.composer.addPass(this.filterPass);

		// 9. OutputPass (gamma / colour-space / tone-mapping output)
		this.outputPass = new OutputPass();
		this.composer.addPass(this.outputPass);

		/* ---------- camera shake ---------- */
		this.shakeIntensity   = 0;
		this.shakeDuration    = 0;
		this.shakeMaxDuration = 0;
		this.shakeOffset      = new THREE.Vector3();

		/* ---------- day / night ---------- */
		this.lights = null;
		this.currentPreset      = 'day';
		this.targetPreset       = 'day';
		this.transitionTime     = 1.0;   // start fully transitioned
		this.transitionDuration = 1.0;
		this.basePointIntensities = new Map();

		this.presets = {
			day: {
				ambient:           { color: new THREE.Color(0x404060), intensity: 0.6 },
				sun:               { color: new THREE.Color(0xffaa55), intensity: 1.2 },
				fill:              { color: new THREE.Color(0x5577ff), intensity: 0.25 },
				background:        new THREE.Color(0x151520),
				fog:               new THREE.Color(0x151520),
				pointMultiplier:   1.0
			},
			night: {
				ambient:           { color: new THREE.Color(0x101020), intensity: 0.2 },
				sun:               { color: new THREE.Color(0x4466aa), intensity: 0.3 },
				fill:              { color: new THREE.Color(0x111122), intensity: 0.05 },
				background:        new THREE.Color(0x050510),
				fog:               new THREE.Color(0x050510),
				pointMultiplier:   2.0
			},
			neon: {
				ambient:           { color: new THREE.Color(0x201030), intensity: 0.4 },
				sun:               { color: new THREE.Color(0xaa00ff), intensity: 0.5 },
				fill:              { color: new THREE.Color(0x00ffff), intensity: 0.4 },
				background:        new THREE.Color(0x0a0515),
				fog:               new THREE.Color(0x0a0515),
				pointMultiplier:   2.5
			}
		};
	}

	/**
	 * Register scene lights so day/night transitions can manipulate them.
	 * @param {THREE.AmbientLight}   ambient
	 * @param {THREE.DirectionalLight} sun
	 * @param {THREE.DirectionalLight} fill
	 * @param {THREE.PointLight[]}   pointLights
	 */
	registerLights(ambient, sun, fill, pointLights = []) {
		this.lights = { ambient, sun, fill, points: pointLights.slice() };
		this.basePointIntensities.clear();
		for (const pl of this.lights.points) {
			this.basePointIntensities.set(pl, pl.intensity);
		}
		// Snap to day preset so we have a known starting state
		this.applyPresetValues(this.presets.day, 1.0);
	}

	/** Switch between 'day', 'night', and 'neon'. Transition lasts 1 s. */
	setTimeOfDay(mode) {
		if (!this.presets[mode]) return;
		this.targetPreset   = mode;
		this.transitionTime = 0;
	}

	/** Trigger a camera shake. */
	shake(intensity, duration) {
		this.shakeIntensity   = Math.max(this.shakeIntensity, intensity);
		this.shakeDuration    = Math.max(this.shakeDuration, duration);
		this.shakeMaxDuration = this.shakeDuration;
	}

	/** Compute and return the shake offset for the current frame. */
	getShakeOffset(dt) {
		if (this.shakeDuration <= 0) {
			this.shakeOffset.set(0, 0, 0);
			this.shakeIntensity = 0;
			return this.shakeOffset;
		}

		this.shakeDuration -= dt;
		const envelope = Math.max(0, this.shakeDuration / Math.max(0.001, this.shakeMaxDuration));
		const intensity = this.shakeIntensity * envelope;

		const time = (this._renderNow || performance.now()) * 0.02;
		this.shakeOffset.set(
			(Math.sin(time * 15) + Math.cos(time * 23)) * 0.5 * intensity,
			(Math.sin(time * 17) + Math.cos(time * 31)) * 0.5 * intensity,
			(Math.sin(time * 19) + Math.cos(time * 29)) * 0.5 * intensity
		);

		return this.shakeOffset;
	}

	/** Resize all render targets when the canvas changes size. */
	resize(width, height) {
		this.width  = width;
		this.height = height;
		this.composer.setSize(width, height);
		if (this.saoPass) this.saoPass.setSize(width, height);
		this.bloomPass.resolution.set(width, height);
	}

	/* ---------- toggles ---------- */
	toggleBloom(enabled)      { this.bloomEnabled = enabled;      this.updatePassEnabled(); }
	toggleSAO(enabled)        { this.saoEnabled = enabled;        this.updatePassEnabled(); }
	toggleMotionBlur(enabled) { this.motionBlurEnabled = enabled; this.updatePassEnabled(); }
	toggleFilmGrain(enabled)  { this.filmGrainEnabled = enabled;  this.updatePassEnabled(); }
	toggleChromaticAberration(enabled) { this.chromaticAberrationEnabled = enabled; this.updatePassEnabled(); }
	toggleVignette(enabled)   { this.vignetteEnabled = enabled;   this.updatePassEnabled(); }

	/**
	 * Activate a photo-mode colour filter.
	 * @param {number} mode   0=off, 1=grayscale, 2=sepia, 3=invert, 4=cyberpunk, 5=overexposed
	 * @param {number} amount Blend amount (0–1)
	 */
	setFilter(mode, amount = 1.0) {
		this.filterPass.uniforms.mode.value = mode;
		this.filterPass.uniforms.amount.value = amount;
		this.filterPass.enabled = mode !== 0;
	}

	updatePassEnabled() {
		this.bloomPass.enabled = this.bloomEnabled;
		if (this.saoPass) this.saoPass.enabled = this.saoEnabled;
		this.motionBlurPass.enabled = this.motionBlurEnabled;
		this.filmGrainPass.enabled = this.filmGrainEnabled;
		this.chromaticAberrationPass.enabled = this.chromaticAberrationEnabled;
		this.vignettePass.enabled = this.vignetteEnabled;
	}

	setEffectEnabled(name, enabled) {
		switch (name) {
			case 'bloom': this.toggleBloom(enabled); break;
			case 'sao': this.toggleSAO(enabled); break;
			case 'motionBlur': this.toggleMotionBlur(enabled); break;
			case 'filmGrain': this.toggleFilmGrain(enabled); break;
			case 'chromaticAberration': this.toggleChromaticAberration(enabled); break;
			case 'vignette': this.toggleVignette(enabled); break;
		}
	}

	setFOV(degrees) {
		if (this.camera) {
			this.camera.fov = Math.max(60, Math.min(120, degrees));
			this.camera.updateProjectionMatrix();
		}
	}

	/* ---------- internals ---------- */

	applyPresetValues(preset, _t) {
		if (!this.lights) return;
		this.lights.ambient.color.copy(preset.ambient.color);
		this.lights.ambient.intensity = preset.ambient.intensity;
		this.lights.sun.color.copy(preset.sun.color);
		this.lights.sun.intensity = preset.sun.intensity;
		this.lights.fill.color.copy(preset.fill.color);
		this.lights.fill.intensity = preset.fill.intensity;
		this.scene.background.copy(preset.background);
		if (this.scene.fog) this.scene.fog.color.copy(preset.fog);
		for (const pl of this.lights.points) {
			const base = this.basePointIntensities.get(pl) || 1;
			pl.intensity = base * preset.pointMultiplier;
		}
	}

	updateDayNight(dt) {
		if (!this.lights) return;
		if (this.currentPreset === this.targetPreset && this.transitionTime >= this.transitionDuration) return;

		this.transitionTime = Math.min(this.transitionDuration, this.transitionTime + dt);
		const t    = this.transitionTime / this.transitionDuration;
		const ease = t * t * (3 - 2 * t); // smoothstep

		const from = this.presets[this.currentPreset];
		const to   = this.presets[this.targetPreset];

		// Ambient
		this.lights.ambient.color.lerpColors(from.ambient.color, to.ambient.color, ease);
		this.lights.ambient.intensity = THREE.MathUtils.lerp(from.ambient.intensity, to.ambient.intensity, ease);

		// Sun
		this.lights.sun.color.lerpColors(from.sun.color, to.sun.color, ease);
		this.lights.sun.intensity = THREE.MathUtils.lerp(from.sun.intensity, to.sun.intensity, ease);

		// Fill
		this.lights.fill.color.lerpColors(from.fill.color, to.fill.color, ease);
		this.lights.fill.intensity = THREE.MathUtils.lerp(from.fill.intensity, to.fill.intensity, ease);

		// Background & fog
		this.scene.background.lerpColors(from.background, to.background, ease);
		if (this.scene.fog) {
			this.scene.fog.color.lerpColors(from.fog, to.fog, ease);
		}

		// Point lights (scaled by multiplier)
		const pointMult = THREE.MathUtils.lerp(from.pointMultiplier, to.pointMultiplier, ease);
		for (const pl of this.lights.points) {
			const base = this.basePointIntensities.get(pl) || 1;
			pl.intensity = base * pointMult;
		}

		if (this.transitionTime >= this.transitionDuration) {
			this.currentPreset = this.targetPreset;
		}
	}

	/**
	 * Render one frame through the post-processing pipeline.
	 * @param {number} dt           – delta time in seconds
	 * @param {number} playerSpeed  – horizontal speed of the player (used for motion blur)
	 */
	render(dt, playerSpeed = 0) {
		// Drive motion blur by player speed (normalised 0-1)
		const normalizedSpeed = Math.min(1.0, playerSpeed / 12);
		this.motionBlurPass.uniforms.speed.value = normalizedSpeed;

		// Animate film-grain time uniform
		this._renderNow = performance.now();
		this.filmGrainPass.uniforms.time.value = this._renderNow * 0.001;

		this.updateDayNight(dt);
		this.getShakeOffset(dt);
		this.updatePassEnabled();

		this.composer.render();
	}
}
