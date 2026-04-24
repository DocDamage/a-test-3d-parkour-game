import * as THREE from 'three';

/**
 * DecalSystem – persistent environmental marks from player movement.
 *
 * Marks:
 *   • Footprints       – on landing from jump/fall (fade 10 s)
 *   • Slide marks      – streak while sliding
 *   • Wall scuffs      – scratch marks during wall-run
 *   • Dust puff        – particle burst on hard landings
 *   • Landing cracks   – radial decal on very hard landings (>5 m fall)
 *
 * All decals are simple planes with procedural CanvasTextures.
 * Max 100 decals at once; oldest removed when limit reached.
 */
export class DecalSystem {
	/**
	 * @param {THREE.Scene} scene
	 * @param {World} world
	 */
	constructor(scene, world) {
		this.scene = scene;
		this.world = world;

		this.maxDecals = 100;
		this.decals = []; // { mesh, lifetime, maxLifetime, type }

		// Internal state for transition detection
		this._wasGrounded = true;
		this._wasSliding = false;
		this._wasWallRunning = false;
		this._lastSlidePos = new THREE.Vector3();
		this._slideInterval = 0.08;
		this._slideTimer = 0;
		this._wallRunInterval = 0.12;
		this._wallRunTimer = 0;
		this._fallStartY = 0;
		this._wasAirborne = false;

		// Shared raycaster for ground normal sampling
		this._raycaster = new THREE.Raycaster();
	}

	/* ============================================================
	 *  PUBLIC API
	 * ============================================================ */

	/**
	 * Call every frame from the game loop.
	 * @param {number} dt
	 * @param {Player} player
	 */
	update(dt, player) {
		const grounded = player.grounded;
		const state = player.state;

		// Track fall start height
		if (!grounded && (state === 'JUMP' || state === 'FALL')) {
			if (!this._wasAirborne) {
				this._fallStartY = player.position.y;
			}
			this._wasAirborne = true;
		}

		// Landing detection
		if (grounded && !this._wasGrounded) {
			const fallDist = this._fallStartY - player.position.y;
			this._onLand(player, fallDist);
			this._wasAirborne = false;
		}

		// Sliding detection
		const isSliding = state === 'SLIDE';
		if (isSliding) {
			this._slideTimer += dt;
			if (this._slideTimer >= this._slideInterval) {
				this._slideTimer -= this._slideInterval;
				this._addSlideMark(player);
			}
		}
		this._wasSliding = isSliding;

		// Wall-run detection
		const isWallRun = state === 'WALLRUN';
		if (isWallRun && player.wallRunData) {
			this._wallRunTimer += dt;
			if (this._wallRunTimer >= this._wallRunInterval) {
				this._wallRunTimer -= this._wallRunInterval;
				this._addWallScuff(player);
			}
		}
		this._wasWallRunning = isWallRun;

		// Age & remove decals
		this._updateDecals(dt);

		this._wasGrounded = grounded;
	}

	/* ============================================================
	 *  PRIVATE – EVENT HANDLERS
	 * ============================================================ */

	_onLand(player, fallDist) {
		const pos = player.position.clone();

		// Footprint
		this._addFootprint(pos, player.mesh.rotation.y);

		// Dust puff on hard landing (>2 m)
		if (fallDist > 2) {
			this._addDustPuff(pos);
		}

		// Landing cracks on very hard landing (>5 m)
		if (fallDist > 5) {
			this._addLandingCrack(pos);
		}
	}

	/* ============================================================
	 *  PRIVATE – DECAL PLACEMENT
	 * ============================================================ */

	_addFootprint(pos, facingY) {
		const normal = this._getGroundNormal(pos);
		if (!normal) return;

		const tex = this._createFootprintTexture();
		const geo = new THREE.PlaneGeometry(0.25, 0.4);
		const mat = new THREE.MeshBasicMaterial({
			map: tex,
			transparent: true,
			opacity: 0.6,
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: -1,
		});
		const mesh = new THREE.Mesh(geo, mat);
		this._orientDecal(mesh, pos, normal, facingY);
		this._pushDecal(mesh, 10);
	}

	_addSlideMark(player) {
		const pos = player.position.clone();
		// Slight jitter so marks don't overlap perfectly
		pos.x += (Math.random() - 0.5) * 0.1;
		pos.z += (Math.random() - 0.5) * 0.1;

		const normal = this._getGroundNormal(pos);
		if (!normal) return;

		const tex = this._createSlideTexture();
		const geo = new THREE.PlaneGeometry(0.15, 0.35);
		const mat = new THREE.MeshBasicMaterial({
			map: tex,
			transparent: true,
			opacity: 0.5,
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: -1,
		});
		const mesh = new THREE.Mesh(geo, mat);
		this._orientDecal(mesh, pos, normal, player.mesh.rotation.y);
		this._pushDecal(mesh, 6);
	}

	_addWallScuff(player) {
		if (!player.wallRunData) return;
		const wallNormal = player.wallRunData.normal;
		const pos = player.position.clone().add(wallNormal.clone().multiplyScalar(0.35));
		pos.y += (Math.random() - 0.5) * 0.3;

		const tex = this._createScuffTexture();
		const geo = new THREE.PlaneGeometry(0.25, 0.08);
		const mat = new THREE.MeshBasicMaterial({
			map: tex,
			transparent: true,
			opacity: 0.5,
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: -1,
		});
		const mesh = new THREE.Mesh(geo, mat);
		this._orientDecal(mesh, pos, wallNormal, Math.atan2(-wallNormal.x, -wallNormal.z));
		this._pushDecal(mesh, 8);
	}

	_addLandingCrack(pos) {
		const normal = this._getGroundNormal(pos);
		if (!normal) return;

		const tex = this._createCrackTexture();
		const geo = new THREE.PlaneGeometry(1.2, 1.2);
		const mat = new THREE.MeshBasicMaterial({
			map: tex,
			transparent: true,
			opacity: 0.7,
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: -1,
		});
		const mesh = new THREE.Mesh(geo, mat);
		this._orientDecal(mesh, pos, normal, Math.random() * Math.PI * 2);
		this._pushDecal(mesh, 12);
	}

	_addDustPuff(pos) {
		const count = 6 + Math.floor(Math.random() * 3); // 6–8 cubes
		for (let i = 0; i < count; i++) {
			const size = 0.04 + Math.random() * 0.05;
			const geo = new THREE.BoxGeometry(size, size, size);
			const mat = new THREE.MeshBasicMaterial({
				color: 0xaaaa99,
				transparent: true,
				opacity: 0.8,
				depthWrite: false,
			});
			const mesh = new THREE.Mesh(geo, mat);
			mesh.position.copy(pos);
			mesh.position.y += 0.1;
			// Explode outward
			const vel = new THREE.Vector3(
				(Math.random() - 0.5) * 2,
				Math.random() * 2 + 0.5,
				(Math.random() - 0.5) * 2
			);
			mesh.userData.velocity = vel;
			this._pushDecal(mesh, 1.0);
		}
	}

	/* ============================================================
	 *  PRIVATE – HELPERS
	 * ============================================================ */

	_orientDecal(mesh, position, normal, rotationY) {
		mesh.position.copy(position);
		// Lift slightly to avoid z-fighting
		mesh.position.add(normal.clone().multiplyScalar(0.02));
		mesh.lookAt(mesh.position.clone().add(normal));
		mesh.rotateZ(rotationY);
		this.scene.add(mesh);
	}

	_getGroundNormal(pos) {
		// Raycast downward through collidables
		this._raycaster.set(
			new THREE.Vector3(pos.x, pos.y + 0.2, pos.z),
			new THREE.Vector3(0, -1, 0)
		);
		const intersects = this._raycaster.intersectObjects(this.world.collidables, false);
		if (intersects.length > 0) {
			return intersects[0].face.normal.clone().transformDirection(intersects[0].object.matrixWorld);
		}
		// Default ground plane normal
		if (pos.y < 0.1) return new THREE.Vector3(0, 1, 0);
		return null;
	}

	_pushDecal(mesh, lifetime) {
		this.decals.push({ mesh, lifetime, maxLifetime: lifetime, type: mesh.geometry.type });
		if (this.decals.length > this.maxDecals) {
			const old = this.decals.shift();
			this.scene.remove(old.mesh);
			old.mesh.geometry.dispose();
			if (old.mesh.material.map) old.mesh.material.map.dispose();
			old.mesh.material.dispose();
		}
	}

	_updateDecals(dt) {
		for (let i = this.decals.length - 1; i >= 0; i--) {
			const d = this.decals[i];
			d.lifetime -= dt;

			// Dust-puff physics
			if (d.mesh.userData.velocity) {
				d.mesh.userData.velocity.y -= 9.8 * dt; // gravity
				d.mesh.position.add(d.mesh.userData.velocity.clone().multiplyScalar(dt));
				d.mesh.rotation.x += dt * 3;
				d.mesh.rotation.y += dt * 2;
			}

			if (d.lifetime <= 0) {
				this.scene.remove(d.mesh);
				d.mesh.geometry.dispose();
				if (d.mesh.material.map) d.mesh.material.map.dispose();
				d.mesh.material.dispose();
				this.decals.splice(i, 1);
			} else {
				// Fade opacity
				const ratio = d.lifetime / d.maxLifetime;
				if (d.mesh.material.opacity !== undefined) {
					d.mesh.material.opacity = Math.min(d.mesh.material.opacity, ratio * 0.8);
				}
			}
		}
	}

	/* ============================================================
	 *  PRIVATE – PROCEDURAL TEXTURES
	 * ============================================================ */

	_createFootprintTexture() {
		const canvas = document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 128;
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, 64, 128);
		ctx.fillStyle = '#1a1a1a';
		// Shoe sole shape
		ctx.beginPath();
		ctx.ellipse(32, 30, 12, 22, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.ellipse(32, 85, 10, 28, 0, 0, Math.PI * 2);
		ctx.fill();
		return new THREE.CanvasTexture(canvas);
	}

	_createSlideTexture() {
		const canvas = document.createElement('canvas');
		canvas.width = 32;
		canvas.height = 64;
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, 32, 64);
		ctx.fillStyle = '#111';
		// Irregular skid streak
		for (let i = 0; i < 8; i++) {
			const y = Math.random() * 64;
			const w = 2 + Math.random() * 6;
			const x = 16 - w / 2 + (Math.random() - 0.5) * 4;
			ctx.fillRect(x, y, w, 3 + Math.random() * 4);
		}
		return new THREE.CanvasTexture(canvas);
	}

	_createScuffTexture() {
		const canvas = document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 16;
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, 64, 16);
		ctx.strokeStyle = '#222';
		ctx.lineWidth = 1.5;
		for (let i = 0; i < 4; i++) {
			ctx.beginPath();
			ctx.moveTo(4 + Math.random() * 8, 4 + Math.random() * 8);
			ctx.lineTo(56 - Math.random() * 8, 4 + Math.random() * 8);
			ctx.stroke();
		}
		return new THREE.CanvasTexture(canvas);
	}

	_createCrackTexture() {
		const canvas = document.createElement('canvas');
		canvas.width = 128;
		canvas.height = 128;
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, 128, 128);
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 2;
		// Radial cracks
		const cx = 64, cy = 64;
		for (let i = 0; i < 12; i++) {
			const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
			const len = 20 + Math.random() * 35;
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
			ctx.stroke();
			// Small branches
			if (Math.random() > 0.5) {
				const mid = 0.4 + Math.random() * 0.3;
				const bx = cx + Math.cos(angle) * len * mid;
				const by = cy + Math.sin(angle) * len * mid;
				const bAngle = angle + (Math.random() - 0.5) * 1.2;
				const bLen = 8 + Math.random() * 12;
				ctx.beginPath();
				ctx.moveTo(bx, by);
				ctx.lineTo(bx + Math.cos(bAngle) * bLen, by + Math.sin(bAngle) * bLen);
				ctx.stroke();
			}
		}
		return new THREE.CanvasTexture(canvas);
	}
}
