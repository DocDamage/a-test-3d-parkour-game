import * as THREE from 'three';

/**
 * PhotoMode – free-camera screenshot system.
 *
 * Features:
 *  • F12 toggle, Escape exits
 *  • WASD + QE free fly with Shift/Ctrl speed modifiers
 *  • Mouse look (orbital / FPS hybrid)
 *  • 5 character poses (manipulates player mesh parts)
 *  • 5 photo filters (grayscale, sepia, invert, cyberpunk, overexposed)
 *  • Enter to screenshot via renderer.domElement.toBlob()
 *  • Injected DOM UI (no index.html changes required)
 */
export class PhotoMode {
	/**
	 * @param {THREE.WebGLRenderer} renderer
	 * @param {THREE.Scene} scene
	 * @param {THREE.PerspectiveCamera} camera
	 * @param {Player} player
	 * @param {PostProcessing} postProcessing
	 */
	constructor(renderer, scene, camera, player, postProcessing) {
		this.renderer = renderer;
		this.scene = scene;
		this.camera = camera;
		this.player = player;
		this.postProcessing = postProcessing;

		this.active = false;

		// Camera state
		this.savedCameraPos = new THREE.Vector3();
		this.savedCameraQuat = new THREE.Quaternion();
		this.yaw = 0;
		this.pitch = 0;
		this.moveSpeed = 6;
		this.fastMult = 3;
		this.slowMult = 0.2;

		// Input listeners (separate from InputManager so we work everywhere)
		this._keys = {};
		this._onKeyDown = this._onKeyDown.bind(this);
		this._onKeyUp = this._onKeyUp.bind(this);
		this._onMouseMove = this._onMouseMove.bind(this);
		this._mouseDX = 0;
		this._mouseDY = 0;

		// UI
		this.uiContainer = null;
		this.uiBadge = null;
		this.uiBottom = null;
		this.uiHidden = false;
		this._buildUI();

		// Poses
		this.poseIndex = -1; // -1 = no override
		this.poses = this._buildPoses();
		this._savedPoseState = null;

		// Filters: name -> post-processing mode id
		this.filters = [
			{ name: 'None', mode: 0 },
			{ name: 'Grayscale', mode: 1 },
			{ name: 'Sepia', mode: 2 },
			{ name: 'Invert', mode: 3 },
			{ name: 'Cyberpunk', mode: 4 },
			{ name: 'Overexposed', mode: 5 },
		];
		this.filterIndex = 0;
		this.onPhotoTaken = null;
	}

	/* ============================================================
	 *  PUBLIC API
	 * ============================================================ */

	/** Returns true while photo mode is active. */
	isActive() {
		return this.active;
	}

	/** Toggle photo mode on / off. */
	toggle() {
		if (this.active) this._exit();
		else this._enter();
	}

	/**
	 * Per-frame update. Call this instead of normal game updates when active.
	 * @param {number} dt        – delta time in seconds
	 * @param {InputManager} input – optional existing input manager
	 */
	update(dt, input = null) {
		if (!this.active) return;

		// Consume mouse from our own listener
		const mdX = this._mouseDX;
		const mdY = this._mouseDY;
		this._mouseDX = 0;
		this._mouseDY = 0;

		// Also drain InputManager so deltas don't accumulate elsewhere
		if (input) input.consumeMouse();

		// Look
		const sens = 0.002;
		this.yaw -= mdX * sens;
		this.pitch -= mdY * sens;
		this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));

		// Movement basis
		const forward = new THREE.Vector3(
			Math.sin(this.yaw) * Math.cos(this.pitch),
			Math.sin(this.pitch),
			Math.cos(this.yaw) * Math.cos(this.pitch)
		).normalize();
		const right = new THREE.Vector3(
			Math.cos(this.yaw),
			0,
			-Math.sin(this.yaw)
		).normalize();
		const up = new THREE.Vector3(0, 1, 0);

		// Speed modifier
		let speed = this.moveSpeed;
		if (this._keys['ShiftLeft'] || this._keys['ShiftRight']) speed *= this.fastMult;
		if (this._keys['ControlLeft'] || this._keys['ControlRight']) speed *= this.slowMult;

		// WASD + QE
		const move = new THREE.Vector3();
		if (this._keys['KeyW']) move.add(forward);
		if (this._keys['KeyS']) move.sub(forward);
		if (this._keys['KeyD']) move.add(right);
		if (this._keys['KeyA']) move.sub(right);
		if (this._keys['KeyE']) move.add(up);
		if (this._keys['KeyQ']) move.sub(up);
		if (move.length() > 0) move.normalize().multiplyScalar(speed * dt);

		this.camera.position.add(move);
		this.camera.lookAt(this.camera.position.clone().add(forward));
	}

	/* ============================================================
	 *  PRIVATE – LIFECYCLE
	 * ============================================================ */

	_enter() {
		this.active = true;

		// Save camera state
		this.savedCameraPos.copy(this.camera.position);
		this.savedCameraQuat.copy(this.camera.quaternion);

		// Derive yaw/pitch from current quaternion
		const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
		this.yaw = euler.y;
		this.pitch = euler.x;

		// Hook inputs
		document.addEventListener('keydown', this._onKeyDown);
		document.addEventListener('keyup', this._onKeyUp);
		document.addEventListener('mousemove', this._onMouseMove);

		// Show UI
		this.uiContainer.style.display = 'block';
		this._updateUIVisibility();

		// Apply current filter
		this._applyFilter();
	}

	_exit() {
		this.active = false;

		// Restore camera
		this.camera.position.copy(this.savedCameraPos);
		this.camera.quaternion.copy(this.savedCameraQuat);

		// Unhook inputs
		document.removeEventListener('keydown', this._onKeyDown);
		document.removeEventListener('keyup', this._onKeyUp);
		document.removeEventListener('mousemove', this._onMouseMove);

		// Hide UI
		this.uiContainer.style.display = 'none';

		// Reset filter
		this.postProcessing.setFilter(0);

		// Reset pose
		this._clearPose();
	}

	/* ============================================================
	 *  PRIVATE – INPUT
	 * ============================================================ */

	_onKeyDown(e) {
		if (!window.gameStarted || window.paused) return;
		this._keys[e.code] = true;

		if (e.code === 'F12') {
			e.preventDefault();
			this.toggle();
			return;
		}

		if (!this.active) return;

		if (e.code === 'Escape') {
			this._exit();
			return;
		}

		if (e.code === 'Enter') {
			this._takeScreenshot();
			return;
		}
	}

	_onKeyUp(e) {
		this._keys[e.code] = false;
	}

	_onMouseMove(e) {
		if (!this.active) return;
		this._mouseDX += e.movementX;
		this._mouseDY += e.movementY;
	}

	/* ============================================================
	 *  PRIVATE – SCREENSHOT
	 * ============================================================ */

	_takeScreenshot() {
		// Render one clean frame first
		this.postProcessing.render(0.016);
		if (this.onPhotoTaken) this.onPhotoTaken(this.camera);

		if (audioManager && typeof audioManager.playSFX === 'function') audioManager.playSFX('camera_shutter');

		this.renderer.domElement.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `parkour-photo-${Date.now()}.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		});
	}

	/* ============================================================
	 *  PRIVATE – UI
	 * ============================================================ */

	_buildUI() {
		const container = document.createElement('div');
		container.style.cssText = `
			position:fixed; inset:0; pointer-events:none; z-index:50;
			font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;
			display:none;
		`;

		// Top-left badge
		const badge = document.createElement('div');
		badge.textContent = 'PHOTO MODE';
		badge.style.cssText = `
			position:absolute; top:20px; left:20px;
			background:rgba(0,0,0,0.7); color:#ffaa00;
			padding:10px 18px; border-radius:6px;
			font-size:14px; font-weight:bold; letter-spacing:2px;
			border:1px solid rgba(255,170,0,0.4);
		`;
		container.appendChild(badge);

		// Bottom panel
		const bottom = document.createElement('div');
		bottom.style.cssText = `
			position:absolute; bottom:30px; left:50%; transform:translateX(-50%);
			background:rgba(0,0,0,0.75); padding:14px 24px; border-radius:10px;
			display:flex; gap:12px; pointer-events:auto;
			border:1px solid rgba(255,255,255,0.1);
		`;

		// Hide UI button
		bottom.appendChild(this._makeBtn('Hide UI', () => {
			this.uiHidden = !this.uiHidden;
			this._updateUIVisibility();
		}));

		// Pose button
		bottom.appendChild(this._makeBtn('Pose ▶', () => {
			this.poseIndex = (this.poseIndex + 1) % this.poses.length;
			this._applyPose(this.poses[this.poseIndex]);
		}));

		// Filter button
		bottom.appendChild(this._makeBtn('Filter ▶', () => {
			this.filterIndex = (this.filterIndex + 1) % this.filters.length;
			this._applyFilter();
		}));

		// Hint text
		const hint = document.createElement('div');
		hint.style.cssText = `
			color:#888; font-size:11px; margin-left:8px;
			display:flex; align-items:center;
		`;
		hint.innerHTML = '<span style="color:#aaa">WASD</span> move &nbsp; <span style="color:#aaa">QE</span> up/down &nbsp; <span style="color:#aaa">Shift/Ctrl</span> speed &nbsp; <span style="color:#aaa">Enter</span> save &nbsp; <span style="color:#aaa">Esc</span> exit';
		bottom.appendChild(hint);

		container.appendChild(bottom);
		document.body.appendChild(container);

		this.uiContainer = container;
		this.uiBadge = badge;
		this.uiBottom = bottom;
	}

	_makeBtn(label, onClick) {
		const btn = document.createElement('button');
		btn.textContent = label;
		btn.style.cssText = `
			background:#ffaa00; color:#111; border:none; border-radius:6px;
			padding:8px 14px; font-size:12px; font-weight:bold; cursor:pointer;
			transition:background 0.15s;
		`;
		btn.addEventListener('mouseenter', () => btn.style.background = '#ffcc00');
		btn.addEventListener('mouseleave', () => btn.style.background = '#ffaa00');
		btn.addEventListener('click', onClick);
		return btn;
	}

	_updateUIVisibility() {
		this.uiBadge.style.opacity = this.uiHidden ? '0' : '1';
		this.uiBottom.style.opacity = this.uiHidden ? '0' : '1';
		this.uiBottom.style.pointerEvents = this.uiHidden ? 'none' : 'auto';
	}

	/* ============================================================
	 *  PRIVATE – POSES
	 * ============================================================ */

	_buildPoses() {
		// The player mesh is built from simple primitives.
		// We store pose deltas as { part: 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg' | 'torso' | 'head' | 'cap' | 'group', rotation: {x,y,z}, position: {x,y,z} }
		return [
			{
				name: 'Mid-Jump Tuck',
				parts: {
					leftArm:  { rotation: { x: -2.2, y: 0, z: 0.4 } },
					rightArm: { rotation: { x: -2.2, y: 0, z: -0.4 } },
					leftLeg:  { rotation: { x: -1.9, y: 0, z: 0.3 }, position: { y: 0.55 } },
					rightLeg: { rotation: { x: -1.7, y: 0, z: -0.3 }, position: { y: 0.55 } },
					torso:    { rotation: { x: 0.35 } },
					head:     { rotation: { x: -0.25 } },
				}
			},
			{
				name: 'Wall-Run Lean',
				parts: {
					leftArm:  { rotation: { x: -0.5, y: 0, z: 2.0 } },
					rightArm: { rotation: { x: 0.8, y: 0, z: -0.3 } },
					leftLeg:  { rotation: { x: -0.6, y: 0, z: 0.4 } },
					rightLeg: { rotation: { x: 0.4, y: 0, z: -0.2 } },
					torso:    { rotation: { x: 0, y: 0, z: -0.35 } },
					head:     { rotation: { x: 0, y: 0, z: 0.2 } },
				}
			},
			{
				name: 'Slide Crouch',
				parts: {
					leftArm:  { rotation: { x: -1.3, y: 0, z: 0.6 } },
					rightArm: { rotation: { x: -1.3, y: 0, z: -0.6 } },
					leftLeg:  { rotation: { x: -1.4, y: 0, z: 0.3 } },
					rightLeg: { rotation: { x: -1.2, y: 0, z: -0.3 } },
					torso:    { rotation: { x: 0.15 }, position: { y: 0.6 } },
					head:     { rotation: { x: 0.15 } },
				}
			},
			{
				name: 'Idle Heroic',
				parts: {
					leftArm:  { rotation: { x: 0, y: 0, z: 0.5 } },
					rightArm: { rotation: { x: 0, y: 0, z: -0.5 } },
					leftLeg:  { rotation: { x: 0, y: 0, z: 0.1 } },
					rightLeg: { rotation: { x: 0, y: 0, z: -0.1 } },
					torso:    { rotation: { x: -0.08 } },
					head:     { rotation: { x: -0.1 } },
				}
			},
			{
				name: 'Falling Spread',
				parts: {
					leftArm:  { rotation: { x: 0, y: 0, z: 2.4 } },
					rightArm: { rotation: { x: 0, y: 0, z: -2.4 } },
					leftLeg:  { rotation: { x: 0.3, y: 0, z: 0.8 } },
					rightLeg: { rotation: { x: 0.3, y: 0, z: -0.8 } },
					torso:    { rotation: { x: -0.2 } },
					head:     { rotation: { x: 0.2 } },
				}
			},
		];
	}

	_applyPose(pose) {
		if (!pose) return;
		const mesh = this.player.mesh;

		// Map part names to actual objects
		const partMap = {
			torso: mesh.children[0],
			head: mesh.children[1],
			cap: mesh.children[2],
			leftArm: this.player.leftArm,
			rightArm: this.player.rightArm,
			leftLeg: this.player.leftLeg,
			rightLeg: this.player.rightLeg,
		};

		for (const [name, delta] of Object.entries(pose.parts)) {
			const obj = partMap[name];
			if (!obj) continue;
			if (delta.rotation) {
				if (delta.rotation.x !== undefined) obj.rotation.x = delta.rotation.x;
				if (delta.rotation.y !== undefined) obj.rotation.y = delta.rotation.y;
				if (delta.rotation.z !== undefined) obj.rotation.z = delta.rotation.z;
			}
			if (delta.position) {
				if (delta.position.x !== undefined) obj.position.x = delta.position.x;
				if (delta.position.y !== undefined) obj.position.y = delta.position.y;
				if (delta.position.z !== undefined) obj.position.z = delta.position.z;
			}
		}
	}

	_clearPose() {
		this.poseIndex = -1;
		// Player.updateVisuals() will naturally lerp everything back to normal
		// once the game loop resumes; we just snap the group to the current player position.
		if (this.player.mesh) {
			this.player.mesh.position.copy(this.player.position);
		}
	}

	_applyFilter() {
		const f = this.filters[this.filterIndex];
		this.postProcessing.setFilter(f.mode, 1.0);
	}
}
