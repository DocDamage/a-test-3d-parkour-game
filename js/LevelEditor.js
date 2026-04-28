import * as THREE from 'three';
import { MovingPlatform } from './MovingPlatform.js';

/**
 * LevelEditor - Browser-based 3D parkour level editor using Three.js.
 *
 * Integrates into an existing parkour game with scene, camera, renderer, world, and player.
 */

const POWERUP_TYPES = [
    'speed', 'ghost', 'doubleJump', 'gravity', 'magnet',
    'timeFreeze', 'superJump', 'invincible', 'bounce', 'teleport'
];

const DEFAULT_PROPS = {
    platform:       { width: 4, height: 0.4, depth: 4 },
    wall:           { width: 0.8, height: 4, depth: 4 },
    ramp:           { width: 4, height: 2, depth: 8, angle: 0.25 },
    movingPlatform: { width: 2.5, height: 0.4, depth: 2.5, speed: 1.5, distance: 3, axis: 'x', waitTime: 0 },
    hazard_laser:   { length: 6, orientation: 'horizontal', axis: 'x', toggleInterval: 0, damage: 10 },
    hazard_spinner: { length: 8, speed: 2 },
    drone:          { patrolRadius: 5, speed: 2.5, detectionRange: 10, height: 3 },
    collectible_chip: {},
    grapplePoint:   { radius: 1.5 },
    powerup:        { type: 'speed', duration: 8 },
    vent:           { width: 1.5, height: 1.5 },
    mirror:         { rotationSnap: 90 },
    checkpoint:     { zoneName: 'zone_1' },
    spawnPoint:     {}
};

const TYPE_COLORS = {
    platform: 0x8899aa,
    wall: 0x777788,
    ramp: 0x666677,
    movingPlatform: 0x667788,
    hazard_laser: 0xff0000,
    hazard_spinner: 0xaa2222,
    drone: 0x0088ff,
    collectible_chip: 0x00ffff,
    grapplePoint: 0x00ffff,
    powerup: 0xff0000,
    vent: 0x556655,
    mirror: 0xccffff,
    checkpoint: 0x00ff00,
    spawnPoint: 0x00ff00
};

export default class LevelEditor {
    constructor(scene, camera, renderer, world, player) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.world = world;
        this.player = player;

        this.mode = 'play';
        this.selectedObject = null;
        this.placementType = 'platform';
        this.tool = 'place';
        this.gridSize = 1;
        this.snapToGrid = true;
        this.showHelpers = true;

        // Internal state
        this.editorObjects = []; // { type, root, instance?, props }
        this.undoStack = [];
        this.maxUndo = 20;
        this.isDragging = false;
        this.dragStartPos = new THREE.Vector3();
        this.dragOffset = new THREE.Vector3();
        this.dragStartPoint = new THREE.Vector3();
        this.shiftPressed = false;
        this.lastDt = 0.016;

        // Camera state for edit mode
        this.editCamera = {
            position: new THREE.Vector3(10, 10, 10),
            yaw: -Math.PI / 4,
            pitch: -Math.PI / 6,
            savedState: null
        };

        // Mouse / raycast
        this.mouseNDC = new THREE.Vector2(0, 0);
        this.raycaster = new THREE.Raycaster();
        this.editorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        // Ghost preview
        this.ghostMesh = null;

        // Visual helpers
        this.selectionBox = null;
        this.gizmoGroup = null;
        this.gridHelper = null;

        this.setupHelpers();
        this.setupEventListeners();
    }

    /* ============================================================
       SETUP
       ============================================================ */

    setupHelpers() {
        // Selection box (yellow)
        this.selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0xffff00);
        this.selectionBox.visible = false;
        this.scene.add(this.selectionBox);

        // Transform gizmo arrows
        this.gizmoGroup = new THREE.Group();
        this.createGizmoArrow(new THREE.Vector3(1, 0, 0), 0xff0000); // X
        this.createGizmoArrow(new THREE.Vector3(0, 1, 0), 0x00ff00); // Y
        this.createGizmoArrow(new THREE.Vector3(0, 0, 1), 0x0000ff); // Z
        this.gizmoGroup.visible = false;
        this.scene.add(this.gizmoGroup);

        // Large grid for edit mode
        this.gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x333333);
        this.gridHelper.visible = false;
        this.scene.add(this.gridHelper);
    }

    createGizmoArrow(dir, color) {
        const origin = new THREE.Vector3(0, 0, 0);
        const length = 1.5;
        const headLength = 0.3;
        const headWidth = 0.2;

        // Shaft
        const shaftEnd = dir.clone().multiplyScalar(length - headLength);
        const shaftGeo = new THREE.BufferGeometry().setFromPoints([origin, shaftEnd]);
        const shaftMat = new THREE.LineBasicMaterial({ color });
        const shaft = new THREE.Line(shaftGeo, shaftMat);
        this.gizmoGroup.add(shaft);

        // Arrowhead (simple cone-ish lines)
        const headBase = shaftEnd.clone();
        const tip = dir.clone().multiplyScalar(length);
        const perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
        if (perp.lengthSq() < 0.001) perp.set(1, 0, 0);
        const perp2 = new THREE.Vector3().crossVectors(dir, perp).normalize();

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const offset = perp.clone().multiplyScalar(Math.cos(angle) * headWidth)
                .add(perp2.clone().multiplyScalar(Math.sin(angle) * headWidth));
            const base = headBase.clone().add(offset);
            const headGeo = new THREE.BufferGeometry().setFromPoints([base, tip.clone()]);
            const headLine = new THREE.Line(headGeo, shaftMat);
            this.gizmoGroup.add(headLine);
        }
    }

    setupEventListeners() {
        const canvas = this.renderer.domElement;

        this._editorMouse = { dx: 0, dy: 0, middleDown: false };

        this._onMouseMove = (e) => {
            if (this.mode !== 'edit') return;
            const rect = canvas.getBoundingClientRect();
            this.mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            if (this.isDragging && this.selectedObject) {
                this.updateDrag();
            }
            if (this._editorMouse.middleDown) {
                this._editorMouse.dx += e.movementX;
                this._editorMouse.dy += e.movementY;
            }
        };

        this._onMouseDown = (e) => {
            if (this.mode !== 'edit') return;
            if (e.button === 0) {
                this.onLeftClick();
            } else if (e.button === 1) {
                this._editorMouse.middleDown = true;
            } else if (e.button === 2) {
                this.onRightClick();
            }
        };

        this._onMouseUp = (e) => {
            if (this.mode !== 'edit') return;
            if (e.button === 0 && this.isDragging) {
                this.endDrag();
            }
            if (e.button === 1) {
                this._editorMouse.middleDown = false;
            }
        };

        this._onWheel = (e) => {
            if (this.mode !== 'edit') return;
            e.preventDefault();
            if (this.selectedObject) {
                const delta = Math.sign(e.deltaY);
                if (this.shiftPressed) {
                    // Scale uniformly
                    const s = this.selectedObject.scale.x - delta * 0.1;
                    const newScale = Math.max(0.1, s);
                    this.selectedObject.scale.setScalar(newScale);
                } else {
                    // Rotate Y
                    this.selectedObject.rotation.y -= delta * 0.1;
                }
                this.updateSelectionBox();
                this.updateGizmos();
                this.syncPropsFromObject(this.selectedObject);
            }
        };

        this._onKeyDown = (e) => {
            if (this.mode !== 'edit') return;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                this.shiftPressed = true;
            }
        };

        this._onKeyUp = (e) => {
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                this.shiftPressed = false;
            }
        };

        canvas.addEventListener('mousemove', this._onMouseMove);
        canvas.addEventListener('mousedown', this._onMouseDown);
        canvas.addEventListener('mouseup', this._onMouseUp);
        canvas.addEventListener('wheel', this._onWheel, { passive: false });
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
    }

    /* ============================================================
       MODE MANAGEMENT
       ============================================================ */

    toggle() {
        if (this.mode === 'play') {
            this.enterEditMode();
        } else {
            this.enterPlayMode();
        }
    }

    isActive() {
        return this.mode === 'edit';
    }

    enterEditMode() {
        this.mode = 'edit';

        // Save play camera state
        this.editCamera.savedState = {
            position: this.camera.position.clone(),
            quaternion: this.camera.quaternion.clone()
        };

        // Restore edit camera position
        this.camera.position.copy(this.editCamera.position);
        this.camera.quaternion.setFromEuler(
            new THREE.Euler(this.editCamera.pitch, this.editCamera.yaw, 0, 'YXZ')
        );

        // Freeze player
        if (this.player) {
            this.player.velocity.set(0, 0, 0);
            if (this.player.state) this.player.state = 'IDLE';
        }

        // Show helpers
        this.gridHelper.visible = this.showHelpers;
        this.updateGhost();

        // Sync selection visuals
        this.updateSelectionBox();
        this.updateGizmos();
    }

    enterPlayMode() {
        this.mode = 'play';

        // Save edit camera state
        this.editCamera.position.copy(this.camera.position);
        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
        this.editCamera.yaw = euler.y;
        this.editCamera.pitch = euler.x;

        // Hide helpers
        this.gridHelper.visible = false;
        this.deselect();
        this.clearGhost();

        // Sync world arrays so gameplay sees current editor objects
        this.syncWorldArrays();
    }

    /* ============================================================
       CAMERA
       ============================================================ */

    updateCamera(dt, input) {
        if (this.mode !== 'edit') return;

        const speed = input.isPressed('Space') ? 20 : 8;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        right.y = 0;
        right.normalize();

        const move = new THREE.Vector3();
        if (input.isPressed('KeyW')) move.add(forward);
        if (input.isPressed('KeyS')) move.sub(forward);
        if (input.isPressed('KeyA')) move.sub(right);
        if (input.isPressed('KeyD')) move.add(right);
        if (input.isPressed('KeyQ')) move.y -= 1;
        if (input.isPressed('KeyE')) move.y += 1;

        if (move.lengthSq() > 0) {
            move.normalize().multiplyScalar(speed * dt);
            this.camera.position.add(move);
        }

        // Mouse look (middle-mouse drag to orbit)
        const mouseDelta = { x: this._editorMouse.dx, y: this._editorMouse.dy };
        this._editorMouse.dx = 0;
        this._editorMouse.dy = 0;
        const sensitivity = 0.003;

        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
        euler.y -= mouseDelta.x * sensitivity;
        euler.x -= mouseDelta.y * sensitivity;
        euler.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, euler.x));
        this.camera.quaternion.setFromEuler(euler);
    }

    /* ============================================================
       MOUSE INTERACTION
       ============================================================ */

    getRaycastIntersects(objects) {
        this.raycaster.setFromCamera(this.mouseNDC, this.camera);
        return this.raycaster.intersectObjects(objects, true);
    }

    getPlacementPosition() {
        this.raycaster.setFromCamera(this.mouseNDC, this.camera);

        // Try intersecting existing collidables first for surface snap
        const allTargets = [...this.world.collidables, ...this.editorObjects.map(e => e.root)];
        const hits = this.raycaster.intersectObjects(allTargets, true);
        let point;
        if (hits.length > 0) {
            point = hits[0].point.clone();
        } else {
            // Fall back to y=0 plane
            const target = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.editorPlane, target);
            point = target;
        }

        if (!point) point = new THREE.Vector3();

        if (this.snapToGrid) {
            point.x = Math.round(point.x / this.gridSize) * this.gridSize;
            point.y = Math.round(point.y / this.gridSize) * this.gridSize;
            point.z = Math.round(point.z / this.gridSize) * this.gridSize;
        }
        return point;
    }

    onLeftClick() {
        if (this.tool === 'place') {
            const pos = this.getPlacementPosition();
            this.createObject(this.placementType, pos);
        } else if (this.tool === 'select') {
            const hits = this.getRaycastIntersects(this.editorObjects.map(e => e.root));
            if (hits.length > 0) {
                let obj = hits[0].object;
                // Walk up to find the root with editorObject flag
                while (obj && !obj.userData.editorObject && obj.parent) {
                    obj = obj.parent;
                }
                if (obj && obj.userData.editorObject) {
                    this.selectObject(obj);
                    this.startDrag();
                } else {
                    this.deselect();
                }
            } else {
                this.deselect();
            }
        }
    }

    onRightClick() {
        if (this.tool === 'delete') {
            const hits = this.getRaycastIntersects(this.editorObjects.map(e => e.root));
            if (hits.length > 0) {
                let obj = hits[0].object;
                while (obj && !obj.userData.editorObject && obj.parent) {
                    obj = obj.parent;
                }
                if (obj && obj.userData.editorObject) {
                    this.deleteObject(obj);
                }
            }
        }
    }

    startDrag() {
        if (!this.selectedObject) return;
        this.isDragging = true;
        this.dragStartPoint.copy(this.getPlacementPosition());
        this.dragStartPos.copy(this.selectedObject.position);
    }

    endDrag() {
        if (!this.isDragging) return;
        this.isDragging = false;
        // Push a modify undo if position changed meaningfully
        const dist = this.selectedObject.position.distanceTo(this.dragStartPos);
        if (dist > 0.01) {
            this.pushUndo({
                action: 'modify',
                object: this.selectedObject,
                previousState: {
                    position: this.dragStartPos.clone(),
                    rotation: this.selectedObject.rotation.clone(),
                    scale: this.selectedObject.scale.clone()
                }
            });
        }
    }

    updateDrag() {
        if (!this.selectedObject) return;
        const currentPoint = this.getPlacementPosition();
        const delta = new THREE.Vector3().subVectors(currentPoint, this.dragStartPoint);

        if (this.shiftPressed) {
            // Constrain to Y only
            delta.x = 0;
            delta.z = 0;
        }

        this.selectedObject.position.copy(this.dragStartPos).add(delta);
        this.updateSelectionBox();
        this.updateGizmos();
        this.syncPropsFromObject(this.selectedObject);
    }

    /* ============================================================
       OBJECT CREATION
       ============================================================ */

    createObject(type, position, overrideProps = null) {
        let root = null;
        let instance = null;
        const props = overrideProps ? { ...DEFAULT_PROPS[type], ...overrideProps } : { ...DEFAULT_PROPS[type] };

        switch (type) {
            case 'platform':
                root = this._createBoxMesh(position, props, TYPE_COLORS.platform);
                root.userData.isPlatform = true;
                break;
            case 'wall':
                root = this._createBoxMesh(position, props, TYPE_COLORS.wall);
                root.userData.isClimbable = true;
                break;
            case 'ramp':
                root = this._createRampMesh(position, props);
                break;
            case 'movingPlatform':
                instance = this._createMovingPlatform(position, props);
                root = instance.mesh;
                break;
            case 'hazard_laser':
                instance = this._createHazardLaser(position, props);
                root = instance.group;
                break;
            case 'hazard_spinner':
                instance = this._createHazardSpinner(position, props);
                root = instance.group;
                break;
            case 'drone':
                instance = this._createDrone(position, props);
                root = instance.group;
                break;
            case 'collectible_chip':
                instance = this._createChip(position);
                root = instance.mesh;
                break;
            case 'grapplePoint':
                root = this._createGrapplePoint(position, props);
                break;
            case 'powerup':
                root = this._createPowerupMesh(position, props);
                break;
            case 'vent':
                root = this._createVentMesh(position, props);
                break;
            case 'mirror':
                root = this._createMirrorMesh(position, props);
                break;
            case 'checkpoint':
                root = this._createCheckpointMesh(position, props);
                break;
            case 'spawnPoint':
                root = this._createSpawnPointMesh(position);
                break;
            default:
                if (window.__DEV__) console.warn('Unknown placement type:', type);
                return;
        }

        if (!root) return;

        root.userData.editorObject = true;
        root.userData.type = type;
        root.userData.props = this._buildProps(position, root.rotation, root.scale, TYPE_COLORS[type] || 0xffffff, props);

        this.scene.add(root);
        this.editorObjects.push({ type, root, instance, props: root.userData.props });
        this.pushUndo({ action: 'create', object: root });

        if (this.tool === 'place') {
            this.selectObject(root);
        }

        this.updateGhost();
    }

    _buildProps(position, rotation, scale, color, extraProps) {
        return {
            position: { x: position.x, y: position.y, z: position.z },
            rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
            scale: { x: scale.x, y: scale.y, z: scale.z },
            color,
            ...extraProps
        };
    }

    _createBoxMesh(pos, props, color) {
        const w = props.width || 4;
        const h = props.height || 0.4;
        const d = props.depth || 4;
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.4 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.size = { x: w, y: h, z: d };
        return mesh;
    }

    _createRampMesh(pos, props) {
        const w = props.width || 4;
        const h = props.height || 2;
        const d = props.depth || 8;
        const angle = props.angle || 0.25;
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color: TYPE_COLORS.ramp, roughness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        mesh.position.y += h / 2;
        mesh.rotation.z = angle;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.size = { x: w, y: h, z: d };
        mesh.userData.isRamp = true;
        mesh.userData.angle = angle;
        return mesh;
    }

    _createMovingPlatform(pos, props) {
        const cfg = {
            width: props.width || 2.5,
            height: props.height || 0.4,
            depth: props.depth || 2.5,
            color: TYPE_COLORS.movingPlatform,
            speed: props.speed || 1.5,
            x: pos.x,
            y: pos.y,
            z: pos.z
        };
        // Use shuttle as default editor type since it's most predictable
        const mp = new MovingPlatform(this.scene, 'shuttle', cfg);
        mp.mesh.userData.isMovingPlatform = true;
        mp.mesh.userData.platform = mp;
        return mp;
    }

    _createHazardLaser(pos, props) {
        const group = new THREE.Group();
        group.position.copy(pos);

        const length = props.length || 6;
        const orientation = props.orientation || 'horizontal';
        const axis = props.axis || 'x';
        const radius = orientation === 'horizontal' ? 0.06 : 0.1;

        let geo;
        if (orientation === 'horizontal') {
            geo = new THREE.CylinderGeometry(radius, radius, length, 8);
            if (axis === 'x') geo.rotateZ(Math.PI / 2);
            else geo.rotateX(Math.PI / 2);
        } else {
            geo = new THREE.CylinderGeometry(radius, radius, length, 8);
        }

        const mat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 4 });
        const mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);

        // Glow line
        const points = [];
        const half = length / 2;
        if (orientation === 'horizontal') {
            if (axis === 'x') {
                points.push(new THREE.Vector3(-half, 0, 0), new THREE.Vector3(half, 0, 0));
            } else {
                points.push(new THREE.Vector3(0, 0, -half), new THREE.Vector3(0, 0, half));
            }
        } else {
            points.push(new THREE.Vector3(0, -half, 0), new THREE.Vector3(0, half, 0));
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffaaaa, transparent: true, opacity: 0.9 }));
        group.add(line);

        const light = new THREE.PointLight(0xff0000, 3, 6);
        group.add(light);

        this.scene.add(group);

        return {
            group, mesh, line, light,
            orientation, axis,
            toggleInterval: props.toggleInterval || 0,
            timer: 0,
            active: true,
            x: pos.x, y: pos.y, z: pos.z, length,
            bbox: new THREE.Box3()
        };
    }

    _createHazardSpinner(pos, props) {
        const group = new THREE.Group();
        group.position.copy(pos);

        const length = props.length || 8;
        const pivotGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 8);
        const pivotMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const pivot = new THREE.Mesh(pivotGeo, pivotMat);
        pivot.rotation.x = Math.PI / 2;
        group.add(pivot);

        const beamGeo = new THREE.BoxGeometry(length, 0.35, 0.35);
        const beamMat = new THREE.MeshStandardMaterial({ color: 0xaa2222 });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.castShadow = true;
        group.add(beam);

        this.scene.add(group);
        beam.userData.isHazard = true;
        beam.userData.size = { x: length, y: 0.35, z: 0.35 };

        return { group, beam, x: pos.x, y: pos.y, z: pos.z, length, speed: props.speed || 2, angle: 0 };
    }

    _createDrone(pos, props) {
        // Build a single-waypoint drone so it hovers at placement spot
        const patrolRadius = props.patrolRadius || 5;
        const waypoints = [
            [pos.x, pos.z],
            [pos.x + patrolRadius, pos.z],
            [pos.x + patrolRadius, pos.z + patrolRadius],
            [pos.x, pos.z + patrolRadius]
        ];
        const config = {
            waypoints,
            speed: props.speed || 2.5,
            height: props.height || 3,
            pauseTime: 1.5
        };
        // We use the internal Drone class from DroneAI module indirectly,
        // but since we don't import it, we build a simple drone group manually.
        const group = new THREE.Group();
        group.position.set(pos.x, props.height || 3, pos.z);

        const bodyGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x0088ff, emissive: 0x0044aa, emissiveIntensity: 1.5, roughness: 0.3, metalness: 0.6
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        const ringGeo = new THREE.TorusGeometry(0.4, 0.03, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ccff });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        group.add(ring);

        const spotLight = new THREE.SpotLight(0xffff00, 8, 10, Math.PI / 4, 0.5, 1);
        group.add(spotLight);

        this.scene.add(group);

        // Return a minimal drone-like object that mirrors DroneAI expectations
        return {
            group, body, ring, spotLight,
            waypoints: waypoints.map(w => new THREE.Vector3(w[0], props.height || 3, w[1])),
            speed: config.speed,
            height: config.height,
            state: 'PATROL',
            currentIndex: 0,
            pauseTimer: 0,
            detection: 0,
            timeInCone: 0,
            caught: false,
            update(dt, player) {
                this.ring.rotation.x += dt * 2.5;
                this.ring.rotation.y += dt * 1.8;
                // Simple patrol hover
            },
            getMeshes() { return [this.group]; }
        };
    }

    _createChip(pos) {
        const geo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 6);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2.5,
            roughness: 0.2, metalness: 0.9, transparent: true, opacity: 0.95
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        mesh.castShadow = true;
        this.scene.add(mesh);

        const light = new THREE.PointLight(0x00ffff, 1.2, 5);
        light.position.copy(pos);
        this.scene.add(light);

        return { mesh, light, basePosition: pos.clone(), collected: false, respawnTimer: 0 };
    }

    _createGrapplePoint(pos, props) {
        const group = new THREE.Group();
        group.position.copy(pos);

        // Cyan ring
        const ringGeo = new THREE.TorusGeometry(0.35, 0.05, 8, 24);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        group.add(ring);

        // Inner glow sphere
        const glowGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        this.scene.add(group);
        group.userData.grapplePoint = new THREE.Vector3(pos.x, pos.y, pos.z);
        return group;
    }

    _createPowerupMesh(pos, props) {
        const colors = {
            speed: 0xff0000, ghost: 0x00ff00, doubleJump: 0x0000ff,
            gravity: 0xff00ff, magnet: 0xffff00, timeFreeze: 0x00ffff,
            superJump: 0xff8800, invincible: 0xffffff, bounce: 0xff00aa, teleport: 0x8800ff
        };
        const type = props.type || 'speed';
        const color = colors[type] || 0xffffff;
        const geo = new THREE.IcosahedronGeometry(0.3, 1);
        const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2, transparent: true, opacity: 0.9 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        mesh.castShadow = true;
        this.scene.add(mesh);

        const light = new THREE.PointLight(color, 2, 6);
        light.position.copy(pos);
        this.scene.add(light);

        // Link light to mesh for easier cleanup
        mesh.userData.light = light;
        return mesh;
    }

    _createVentMesh(pos, props) {
        const width = props.width || 1.5;
        const height = props.height || 1.5;
        const thickness = 0.15;
        const geo = new THREE.BoxGeometry(width, height, thickness);
        const mat = new THREE.MeshStandardMaterial({ color: TYPE_COLORS.vent, roughness: 0.7, metalness: 0.4 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Slats
        const slatGeo = new THREE.BoxGeometry(width * 0.9, 0.02, thickness * 1.1);
        const slatMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
        for (let i = 0; i < 5; i++) {
            const slat = new THREE.Mesh(slatGeo, slatMat);
            slat.position.y = ((i / 4) - 0.5) * height * 0.8;
            mesh.add(slat);
        }

        // Tunnel behind
        const tunnelDepth = 4;
        const tunnelGeo = new THREE.BoxGeometry(width * 0.85, height * 0.85, tunnelDepth);
        const tunnelMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
        const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
        tunnel.position.set(0, 0, -thickness / 2 - tunnelDepth / 2);
        mesh.add(tunnel);

        this.scene.add(mesh);
        mesh.userData.isVent = true;
        mesh.userData.width = width;
        mesh.userData.height = height;
        return mesh;
    }

    _createMirrorMesh(pos, props) {
        const group = new THREE.Group();
        group.position.copy(pos);

        const frameGeo = new THREE.BoxGeometry(1.0, 1.4, 0.08);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        group.add(frame);

        const surfGeo = new THREE.BoxGeometry(0.85, 1.25, 0.02);
        const surfMat = new THREE.MeshStandardMaterial({
            color: 0xccffff, metalness: 1.0, roughness: 0.05,
            emissive: 0x112233, emissiveIntensity: 0.3
        });
        const surface = new THREE.Mesh(surfGeo, surfMat);
        surface.position.z = 0.04;
        surface.rotation.y = Math.PI / 4;
        group.add(surface);

        this.scene.add(group);
        return group;
    }

    _createCheckpointMesh(pos, props) {
        const w = 2, h = 2, d = 2;
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshBasicMaterial({
            color: TYPE_COLORS.checkpoint, transparent: true, opacity: 0.15, depthWrite: false
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        this.scene.add(mesh);
        mesh.userData.isCheckpoint = true;
        mesh.userData.zoneName = props.zoneName || 'zone_1';
        return mesh;
    }

    _createSpawnPointMesh(pos) {
        const group = new THREE.Group();
        group.position.copy(pos);

        // Green arrow pointing up
        const shaftGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        const mat = new THREE.MeshBasicMaterial({ color: TYPE_COLORS.spawnPoint });
        const shaft = new THREE.Mesh(shaftGeo, mat);
        shaft.position.y = 0.5;
        group.add(shaft);

        const coneGeo = new THREE.ConeGeometry(0.15, 0.3, 8);
        const cone = new THREE.Mesh(coneGeo, mat);
        cone.position.y = 1.15;
        group.add(cone);

        // Ring on ground
        const ringGeo = new THREE.RingGeometry(0.3, 0.4, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: TYPE_COLORS.spawnPoint, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        group.add(ring);

        this.scene.add(group);
        group.userData.isSpawnPoint = true;
        return group;
    }

    /* ============================================================
       SELECTION & VISUAL HELPERS
       ============================================================ */

    selectObject(obj) {
        this.selectedObject = obj;
        this.updateSelectionBox();
        this.updateGizmos();
    }

    deselect() {
        this.selectedObject = null;
        this.selectionBox.visible = false;
        this.gizmoGroup.visible = false;
        this.isDragging = false;
    }

    deleteObject(obj) {
        const entry = this.editorObjects.find(e => e.root === obj || this._rootContains(e.root, obj));
        if (!entry) return;

        this.pushUndo({ action: 'delete', object: entry.root, entry: { ...entry } });

        this._removeEditorEntry(entry);
        if (this.selectedObject === entry.root || this._rootContains(entry.root, this.selectedObject)) {
            this.deselect();
        }
    }

    _rootContains(root, child) {
        if (!child) return false;
        let p = child;
        while (p) {
            if (p === root) return true;
            p = p.parent;
        }
        return false;
    }

    _removeEditorEntry(entry) {
        const idx = this.editorObjects.indexOf(entry);
        if (idx !== -1) this.editorObjects.splice(idx, 1);

        // Remove from scene
        this.scene.remove(entry.root);

        // Dispose geometries/materials recursively
        entry.root.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });

        // Clean up associated lights stored on userData
        if (entry.root.userData.light) {
            this.scene.remove(entry.root.userData.light);
        }
        if (entry.instance) {
            if (entry.instance.light) this.scene.remove(entry.instance.light);
            if (entry.instance.spotLight) {
                this.scene.remove(entry.instance.spotLight);
                if (entry.instance.spotTarget) this.scene.remove(entry.instance.spotTarget);
            }
        }
    }

    updateSelectionBox() {
        if (!this.selectedObject || !this.showHelpers) {
            this.selectionBox.visible = false;
            return;
        }
        this.selectionBox.setFromObject(this.selectedObject);
        this.selectionBox.visible = true;
    }

    updateGizmos() {
        if (!this.selectedObject || !this.showHelpers) {
            this.gizmoGroup.visible = false;
            return;
        }
        this.gizmoGroup.position.copy(this.selectedObject.position);
        this.gizmoGroup.visible = true;
    }

    /* ============================================================
       GHOST PREVIEW
       ============================================================ */

    updateGhost() {
        this.clearGhost();
        if (this.mode !== 'edit' || this.tool !== 'place') return;

        const pos = this.getPlacementPosition();
        const ghost = this._createGhostForType(this.placementType, pos);
        if (ghost) {
            this.ghostMesh = ghost;
            this.scene.add(ghost);
        }
    }

    clearGhost() {
        if (this.ghostMesh) {
            this.scene.remove(this.ghostMesh);
            this.ghostMesh.traverse(c => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) c.material.dispose();
            });
            this.ghostMesh = null;
        }
    }

    _createGhostForType(type, pos) {
        let geo, mat, mesh;
        const color = TYPE_COLORS[type] || 0xffffff;

        switch (type) {
            case 'platform':
                geo = new THREE.BoxGeometry(4, 0.4, 4);
                break;
            case 'wall':
                geo = new THREE.BoxGeometry(0.8, 4, 4);
                break;
            case 'ramp':
                geo = new THREE.BoxGeometry(4, 2, 8);
                break;
            case 'movingPlatform':
                geo = new THREE.BoxGeometry(2.5, 0.4, 2.5);
                break;
            case 'hazard_laser':
                geo = new THREE.CylinderGeometry(0.06, 0.06, 6, 8);
                break;
            case 'hazard_spinner':
                geo = new THREE.BoxGeometry(8, 0.35, 0.35);
                break;
            case 'drone':
                geo = new THREE.SphereGeometry(0.3, 16, 16);
                break;
            case 'collectible_chip':
                geo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 6);
                break;
            case 'grapplePoint':
                geo = new THREE.TorusGeometry(0.35, 0.05, 8, 24);
                break;
            case 'powerup':
                geo = new THREE.IcosahedronGeometry(0.3, 1);
                break;
            case 'vent':
                geo = new THREE.BoxGeometry(1.5, 1.5, 0.15);
                break;
            case 'mirror':
                geo = new THREE.BoxGeometry(1.0, 1.4, 0.08);
                break;
            case 'checkpoint':
                geo = new THREE.BoxGeometry(2, 2, 2);
                break;
            case 'spawnPoint':
                geo = new THREE.ConeGeometry(0.15, 0.3, 8);
                break;
            default:
                return null;
        }

        mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        if (type === 'ramp') mesh.position.y += 1;
        if (type === 'spawnPoint') mesh.position.y += 1.15;
        mesh.userData.isGhost = true;
        return mesh;
    }

    /* ============================================================
       PROPERTIES SYSTEM
       ============================================================ */

    getSelectedProps() {
        if (!this.selectedObject) return null;
        return this.selectedObject.userData.props || null;
    }

    setSelectedProp(key, value) {
        if (!this.selectedObject) return;
        const props = this.selectedObject.userData.props;
        if (!props) return;

        // Store old state for undo
        const oldValue = props[key];
        if (oldValue === value) return;
        if (typeof oldValue === 'object' && typeof value === 'object' &&
            JSON.stringify(oldValue) === JSON.stringify(value)) return;

        const oldState = { position: this.selectedObject.position.clone(), rotation: this.selectedObject.rotation.clone(), scale: this.selectedObject.scale.clone() };

        props[key] = value;
        this.applyPropToObject(this.selectedObject, key, value);
        this.updateSelectionBox();
        this.updateGizmos();

        this.pushUndo({
            action: 'modify',
            object: this.selectedObject,
            previousState: oldState
        });
    }

    applyPropToObject(obj, key, value) {
        const type = obj.userData.type;
        if (key === 'position' && typeof value === 'object') {
            obj.position.set(parseFloat(value.x), parseFloat(value.y), parseFloat(value.z));
        } else if (key === 'rotation' && typeof value === 'object') {
            obj.rotation.set(parseFloat(value.x), parseFloat(value.y), parseFloat(value.z));
        } else if (key === 'scale' && typeof value === 'object') {
            obj.scale.set(Math.max(0.1, parseFloat(value.x)), Math.max(0.1, parseFloat(value.y)), Math.max(0.1, parseFloat(value.z)));
        } else if (key.endsWith('.x') || key.endsWith('.y') || key.endsWith('.z')) {
            const [prop, axis] = key.split('.');
            if (prop === 'position') obj.position[axis] = parseFloat(value);
            else if (prop === 'rotation') obj.rotation[axis] = parseFloat(value);
            else if (prop === 'scale') obj.scale[axis] = Math.max(0.1, parseFloat(value));
        } else if (key === 'color') {
            const hex = typeof value === 'string' ? parseInt(value.replace('#', ''), 16) : parseInt(value);
            obj.traverse(c => {
                if (c.isMesh && c.material && !c.userData.isGhost) {
                    c.material.color.setHex(hex);
                }
            });
        } else {
            if (obj.userData.props) obj.userData.props[key] = value;
        }
    }

    syncPropsFromObject(obj) {
        if (!obj.userData.props) return;
        const p = obj.userData.props;
        p.position = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
        p.rotation = { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z };
        p.scale = { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z };
    }

    /* ============================================================
       UNDO SYSTEM
       ============================================================ */

    pushUndo(entry) {
        this.undoStack.push(entry);
        if (this.undoStack.length > this.maxUndo) {
            this.undoStack.shift();
        }
    }

    undo() {
        const entry = this.undoStack.pop();
        if (!entry) return;

        switch (entry.action) {
            case 'create': {
                const e = this.editorObjects.find(o => o.root === entry.object);
                if (e) this._removeEditorEntry(e);
                const idx = this.editorObjects.findIndex(o => o.root === entry.object);
                if (idx !== -1) this.editorObjects.splice(idx, 1);
                if (this.selectedObject === entry.object) this.deselect();
                break;
            }
            case 'delete':
                if (entry.entry) {
                    this.editorObjects.push(entry.entry);
                    this.scene.add(entry.entry.root);
                }
                break;
            case 'modify':
                if (entry.object && entry.previousState) {
                    const s = entry.previousState;
                    entry.object.position.copy(s.position);
                    entry.object.rotation.copy(s.rotation);
                    entry.object.scale.copy(s.scale);
                    this.syncPropsFromObject(entry.object);
                    this.updateSelectionBox();
                    this.updateGizmos();
                }
                break;
        }
    }

    /* ============================================================
       SERIALIZATION
       ============================================================ */

    exportLevel() {
        const objects = this.editorObjects.map(e => {
            const p = e.root.userData.props || {};
            const extraProps = { ...p };
            delete extraProps.position;
            delete extraProps.rotation;
            delete extraProps.scale;
            delete extraProps.color;
            return {
                type: e.type,
                position: p.position,
                rotation: p.rotation,
                scale: p.scale,
                color: p.color,
                props: extraProps
            };
        });

        // Find spawn point
        let spawnPoint = null;
        const spawn = this.editorObjects.find(e => e.type === 'spawnPoint');
        if (spawn) {
            spawnPoint = { x: spawn.root.position.x, y: spawn.root.position.y, z: spawn.root.position.z };
        } else if (this.player) {
            spawnPoint = { x: this.player.position.x, y: this.player.position.y, z: this.player.position.z };
        }

        const data = {
            version: 1,
            objects,
            spawnPoint,
            metadata: {
                name: 'Untitled Level',
                author: '',
                created: new Date().toISOString()
            }
        };

        return JSON.stringify(data, null, 2);
    }

    importLevel(jsonString) {
        let data;
        try {
            data = JSON.parse(jsonString);
        } catch (e) {
            window.__DEV__ && console.error('Failed to parse level JSON:', e);
            return false;
        }

        if (!data || data.version !== 1) {
            window.__DEV__ && console.warn('Unsupported level version');
            return false;
        }

        this.clearEditorObjects();

        for (const objData of data.objects || []) {
            const type = objData.type;
            const pos = new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z);

            const mergedProps = { ...DEFAULT_PROPS[type], ...objData.props };
            this.createObject(type, pos, mergedProps);

            const entry = this.editorObjects[this.editorObjects.length - 1];
            if (entry) {
                const root = entry.root;
                if (objData.rotation) {
                    root.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z);
                }
                if (objData.scale) {
                    root.scale.set(objData.scale.x, objData.scale.y, objData.scale.z);
                }
                if (objData.color) {
                    root.traverse(c => {
                        if (c.isMesh && c.material) c.material.color.setHex(objData.color);
                    });
                }
                root.userData.props = { ...mergedProps, position: objData.position, rotation: objData.rotation, scale: objData.scale, color: objData.color };
            }
        }

        this.syncWorldArrays();
        this.deselect();
        return true;
    }

    /* ============================================================
       WORLD ARRAY SYNC
       ============================================================ */

    syncWorldArrays() {
        // Remove all editor objects from world arrays first
        this._filterWorldArrays();

        // Re-add current editor objects
        for (const entry of this.editorObjects) {
            const { type, root, instance } = entry;
            switch (type) {
                case 'platform':
                    if (!this.world.platforms.find(p => p.mesh === root)) {
                        // Wrap static platform in a minimal object for getPlatformUnderPlayer compatibility
                        const plat = {
                            mesh: root,
                            config: { width: root.userData.size?.x || 4, height: root.userData.size?.y || 0.4, depth: root.userData.size?.z || 4 },
                            currentVelocity: new THREE.Vector3(),
                            getTopY() { return this.mesh.position.y + this.config.height / 2; },
                            containsPointXZ(x, z) {
                                const hw = this.config.width / 2;
                                const hd = this.config.depth / 2;
                                return Math.abs(x - this.mesh.position.x) < hw && Math.abs(z - this.mesh.position.z) < hd;
                            },
                            update() {}
                        };
                        this.world.platforms.push(plat);
                    }
                    if (!this.world.collidables.includes(root)) this.world.collidables.push(root);
                    break;
                case 'wall':
                    if (!this.world.collidables.includes(root)) this.world.collidables.push(root);
                    if (!this.world.climbables.includes(root)) this.world.climbables.push(root);
                    break;
                case 'ramp':
                    if (!this.world.collidables.includes(root)) this.world.collidables.push(root);
                    break;
                case 'movingPlatform':
                    if (instance && !this.world.platforms.includes(instance)) {
                        this.world.platforms.push(instance);
                    }
                    if (instance && !this.world.collidables.includes(instance.mesh)) {
                        this.world.collidables.push(instance.mesh);
                    }
                    break;
                case 'hazard_laser':
                    if (instance && !this.world.hazards.lasers.includes(instance)) {
                        this.world.hazards.lasers.push(instance);
                    }
                    break;
                case 'hazard_spinner':
                    if (instance && !this.world.hazards.spinners.includes(instance)) {
                        this.world.hazards.spinners.push(instance);
                    }
                    if (instance && !this.world.collidables.includes(instance.beam)) {
                        this.world.collidables.push(instance.beam);
                    }
                    break;
                case 'drone':
                    if (instance && !this.world.drones.drones.includes(instance)) {
                        this.world.drones.drones.push(instance);
                    }
                    break;
                case 'collectible_chip':
                    if (instance && !this.world.collectibles.chips.includes(instance)) {
                        this.world.collectibles.chips.push(instance);
                    }
                    break;
                case 'grapplePoint':
                    if (root.userData.grapplePoint) {
                        const gp = root.userData.grapplePoint;
                        gp.copy(root.position);
                        if (!this.world.grapplePoints.includes(gp)) {
                            this.world.grapplePoints.push(gp);
                        }
                    }
                    break;
                case 'vent':
                    if (!this.world.collidables.includes(root)) this.world.collidables.push(root);
                    break;
                case 'checkpoint':
                case 'spawnPoint':
                case 'powerup':
                case 'mirror':
                    // No native world arrays; kept as scene objects
                    break;
            }
        }
    }

    _filterWorldArrays() {
        const isEditor = (obj) => obj && obj.userData && obj.userData.editorObject;
        const isEditorMesh = (mesh) => {
            for (const e of this.editorObjects) {
                if (e.root === mesh || this._rootContains(e.root, mesh)) return true;
            }
            return false;
        };

        this.world.collidables = this.world.collidables.filter(obj => !isEditor(obj) && !isEditorMesh(obj));
        this.world.climbables = this.world.climbables.filter(obj => !isEditor(obj) && !isEditorMesh(obj));
        this.world.platforms = this.world.platforms.filter(p => {
            const mesh = p.mesh || p;
            return !isEditor(mesh) && !isEditorMesh(mesh);
        });
        this.world.hazards.lasers = this.world.hazards.lasers.filter(l => !isEditor(l.group));
        this.world.hazards.spinners = this.world.hazards.spinners.filter(s => !isEditor(s.group));
        this.world.drones.drones = this.world.drones.drones.filter(d => !isEditor(d.group));
        this.world.collectibles.chips = this.world.collectibles.chips.filter(c => !isEditor(c.mesh));
        this.world.grapplePoints = this.world.grapplePoints.filter(gp => {
            // Check if this vector belongs to an editor grapple point
            for (const e of this.editorObjects) {
                if (e.type === 'grapplePoint' && e.root.userData.grapplePoint === gp) return false;
            }
            return true;
        });
    }

    clearEditorObjects() {
        for (const entry of [...this.editorObjects]) {
            this._removeEditorEntry(entry);
        }
        this.editorObjects = [];
        this.undoStack = [];
        this.deselect();
    }

    /* ============================================================
       UI INTEGRATION METHODS
       ============================================================ */

    setPlacementType(type) {
        this.placementType = type;
        if (this.mode === 'edit') {
            this.updateGhost();
        }
    }

    setTool(tool) {
        this.tool = tool;
        if (tool !== 'place') {
            this.clearGhost();
        } else if (this.mode === 'edit') {
            this.updateGhost();
        }
    }

    handleInput(input, mouseDelta) {
        if (this.mode !== 'edit') return;

        this.updateCamera(this.lastDt, input);

        if (input.wasPressed('KeyG')) {
            this.snapToGrid = !this.snapToGrid;
        }
        if (input.wasPressed('KeyH')) {
            this.showHelpers = !this.showHelpers;
            this.gridHelper.visible = this.showHelpers && this.mode === 'edit';
            this.updateSelectionBox();
            this.updateGizmos();
        }
        if (input.wasPressed('Delete') || input.wasPressed('Backspace')) {
            if (this.selectedObject) {
                this.deleteObject(this.selectedObject);
            }
        }
        if ((input.isPressed('ControlLeft') || input.isPressed('ControlRight')) && input.wasPressed('KeyZ')) {
            this.undo();
        }
    }

    update(dt) {
        if (this.mode !== 'edit') return;
        this.lastDt = dt;

        // Update ghost position to follow mouse
        if (this.tool === 'place' && this.ghostMesh) {
            const pos = this.getPlacementPosition();
            this.ghostMesh.position.copy(pos);
            if (this.placementType === 'ramp') this.ghostMesh.position.y += 1;
            if (this.placementType === 'spawnPoint') this.ghostMesh.position.y += 1.15;
        }

        // Animate editor-only visuals
        for (const entry of this.editorObjects) {
            if (entry.type === 'collectible_chip' && entry.instance) {
                const t = Date.now() * 0.002;
                entry.instance.mesh.position.y = entry.instance.basePosition.y + Math.sin(t) * 0.15;
                entry.instance.mesh.rotation.y += dt * 1.8;
            }
            if (entry.type === 'grapplePoint') {
                entry.root.rotation.y += dt * 1.5;
            }
            if (entry.type === 'powerup') {
                entry.root.rotation.y += dt * 2;
                entry.root.rotation.x += dt * 1.5;
                if (entry.root.userData.light) {
                    entry.root.userData.light.position.copy(entry.root.position);
                }
            }
            if (entry.type === 'drone' && entry.instance) {
                entry.instance.ring.rotation.x += dt * 2.5;
                entry.instance.ring.rotation.y += dt * 1.8;
            }
        }

        this.updateSelectionBox();
        this.updateGizmos();
    }

    /* ============================================================
       CLEANUP
       ============================================================ */

    dispose() {
        const canvas = this.renderer.domElement;
        canvas.removeEventListener('mousemove', this._onMouseMove);
        canvas.removeEventListener('mousedown', this._onMouseDown);
        canvas.removeEventListener('mouseup', this._onMouseUp);
        canvas.removeEventListener('wheel', this._onWheel);
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);

        this.clearEditorObjects();
        this.clearGhost();

        this.scene.remove(this.selectionBox);
        this.scene.remove(this.gizmoGroup);
        this.scene.remove(this.gridHelper);
    }
}
