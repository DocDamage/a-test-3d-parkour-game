import * as THREE from 'three';
import { MovingPlatform } from './MovingPlatform.js';
import { Hazards } from './Hazards.js';
import { DroneAI } from './DroneAI.js';
import { Collectibles } from './Collectibles.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.collidables = [];
        this.climbables = [];
        this.platforms = [];
        this.hazards = new Hazards(scene, this.collidables);
        this.drones = new DroneAI(scene, this, null);
        this.collectibles = new Collectibles(scene, this);

        this.createFloor();
        this.createWalls();
        this.createObstacles();
        this.placeDrones();
        this.placeChips();
        this.placePowerUps();
        this.placeHologramZones();
        this.markStructuralElements();
        this.createRooftopSection();
        this.createUndergroundTunnel();
        this.createVerticalShaft();
        this.createWaterTreatment();
        this.createFreezerSection();
        this.createServerRoom();
        this.createHangarBay();
    }

    createFloor() {
        const floorGeo = new THREE.PlaneGeometry(80, 80);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x333340,
            roughness: 0.95,
            metalness: 0.05
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Grid pattern overlay
        const grid = new THREE.GridHelper(80, 80, 0x555566, 0x3a3a4a);
        grid.position.y = 0.01;
        this.scene.add(grid);

        // Concrete details - random dark patches
        for (let i = 0; i < 20; i++) {
            const patch = new THREE.Mesh(
                new THREE.CircleGeometry(1 + Math.random() * 2, 8),
                new THREE.MeshBasicMaterial({ color: 0x2a2a35, transparent: true, opacity: 0.3 })
            );
            patch.rotation.x = -Math.PI / 2;
            patch.position.set(
                (Math.random() - 0.5) * 60,
                0.02,
                (Math.random() - 0.5) * 60
            );
            this.scene.add(patch);
        }
    }

    createWalls() {
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x4a4a55,
            roughness: 0.85,
            metalness: 0.15
        });
        const wallHeight = 10;
        const wallThick = 1;
        const size = 80;

        const walls = [
            { pos: [0, wallHeight/2, -size/2], size: [size, wallHeight, wallThick] },
            { pos: [0, wallHeight/2, size/2], size: [size, wallHeight, wallThick] },
            { pos: [-size/2, wallHeight/2, 0], size: [wallThick, wallHeight, size] },
            { pos: [size/2, wallHeight/2, 0], size: [wallThick, wallHeight, size] },
        ];

        walls.forEach(w => {
            const geo = new THREE.BoxGeometry(...w.size);
            const mesh = new THREE.Mesh(geo, wallMat);
            mesh.position.set(...w.pos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.collidables.push(mesh);
            this.climbables.push(mesh);
        });

        // Ceiling beams
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x2a2a35 });
        for (let i = -35; i <= 35; i += 10) {
            const beam = new THREE.Mesh(
                new THREE.BoxGeometry(80, 0.6, 0.8),
                beamMat
            );
            beam.position.set(0, 8, i);
            beam.castShadow = true;
            this.scene.add(beam);
        }

        // Support columns
        for (let x of [-30, -10, 10, 30]) {
            for (let z of [-30, -10, 10, 30]) {
                const col = new THREE.Mesh(
                    new THREE.BoxGeometry(1.5, 10, 1.5),
                    wallMat
                );
                col.position.set(x, 5, z);
                col.castShadow = true;
                col.receiveShadow = true;
                this.scene.add(col);
                this.collidables.push(col);
            }
        }
    }

    createObstacles() {
        // === VAULT TRAINING AREA (near origin) ===
        // Row of low barriers to practice vaulting
        for (let i = 0; i < 4; i++) {
            this.createBox([5 + i * 3, 0.5, -5], [2, 1, 0.4], 0xcc7722, true);
        }

        // === CLIMBING WALLS ===
        // Tall climbable wall
        this.createBox([15, 2.5, -15], [0.8, 5, 6], 0x777788, true, true);
        // Another climbing wall with different height
        this.createBox([-15, 2, -10], [4, 4, 0.8], 0x777788, true, true);
        // Corner climb structure
        this.createBox([-20, 1.5, 15], [0.8, 3, 4], 0x777788, true, true);
        this.createBox([-18, 1.5, 17], [4, 3, 0.8], 0x777788, true, true);

        // === PLATFORMS & JUMPING ===
        // Central tall platform
        this.createBox([0, 2, 0], [5, 4, 5], 0x8B4513, true);

        // Stepping stones leading to central platform
        const stones = [
            [-4, 0.4, 4], [-7, 0.8, 2], [-9, 1.2, 5],
            [4, 0.4, -4], [7, 0.8, -2], [9, 1.2, -5],
            [-4, 0.4, -4], [-7, 0.8, -6], [-5, 1.2, -9],
            [4, 0.4, 4], [7, 0.8, 6], [5, 1.2, 9],
        ];
        stones.forEach(s => {
            this.createBox([s[0], s[1]/2, s[2]], [1.5, s[1], 1.5], 0xAA6633, true);
        });

        // Tall pillars to jump between
        this.createBox([-8, 3, -15], [2, 6, 2], 0x8B4513, true);
        this.createBox([-4, 2, -18], [2, 4, 2], 0x8B4513, true);
        this.createBox([0, 4, -20], [2, 8, 2], 0x8B4513, true);
        this.createBox([5, 2.5, -18], [2, 5, 2], 0x8B4513, true);

        // === RAMP AREA ===
        this.createRamp([-15, 0, 5], [4, 3, 10], 0.25, 0x666677);
        this.createRamp([20, 0, -5], [3, 2, 8], -0.3, 0x666677);

        // === BALANCE BEAMS ===
        this.createBox([10, 1, 10], [12, 0.2, 0.6], 0x9999aa, true);
        this.createBox([8, 2, 14], [8, 0.2, 0.6], 0x9999aa, true);
        this.createBox([14, 1.5, 16], [6, 0.2, 0.6], 0x9999aa, true);

        // === SLIDE TUNNEL ===
        // Low tunnel - must slide or crouch to get through
        this.createBox([20, 0.7, 10], [0.8, 1.4, 8], 0x555566, true);
        this.createBox([26, 0.7, 10], [0.8, 1.4, 8], 0x555566, true);
        this.createBox([23, 0.95, 10], [7, 0.4, 8], 0x555566, true);
        // Low barrier at entrance to force slide
        this.createBox([17.5, 0.35, 10], [0.5, 0.7, 2], 0x555566, true);

        // === CRATE STACKS ===
        this.createBox([-5, 0.5, 12], [2, 1, 2], 0xCD853F, true);
        this.createBox([-5, 1.5, 12], [2, 1, 2], 0xCD853F, true);
        this.createBox([-3, 0.5, 15], [2, 1, 2], 0xCD853F, true);

        // === WALL JUMP CORRIDOR ===
        // Narrow corridor with walls close together for wall-jumping
        this.createBox([-25, 2, 0], [0.8, 4, 10], 0x777788, true, true);
        this.createBox([-30, 2, 0], [0.8, 4, 10], 0x777788, true, true);

        // Platforms in the corridor
        this.createBox([-27.5, 1.5, -3], [4, 0.3, 1.5], 0x8B4513, true);
        this.createBox([-27.5, 3, 0], [4, 0.3, 1.5], 0x8B4513, true);
        this.createBox([-27.5, 4.5, 3], [4, 0.3, 1.5], 0x8B4513, true);

        // === MORE VARIED OBSTACLES ===
        // Zigzag walls
        this.createBox([15, 0.6, 5], [0.5, 1.2, 4], 0x888899, true, true);
        this.createBox([18, 0.6, 7], [4, 1.2, 0.5], 0x888899, true, true);
        this.createBox([21, 0.6, 5], [0.5, 1.2, 4], 0x888899, true, true);

        // Long jump platform
        this.createBox([0, 1, 20], [4, 2, 4], 0x8B4513, true);
        this.createBox([8, 1, 22], [3, 2, 3], 0x8B4513, true);
        this.createBox([-8, 1, 22], [3, 2, 3], 0x8B4513, true);

        // Caution stripes on some edges
        this.createCautionStripes([0, 4.05, 0], [5, 0.05, 5]);

        // ============================================================
        //  NEW INTERACTIVE AREAS
        // ============================================================
        this.createMovingPlatformGauntlet();
        this.createLaserCorridor();
        this.createGlassBridge();
        this.createWreckingBallRoom();
        this.createFanShaft();
        this.createSpinnerAlley();
        this.createConveyorRun();
        this.createMirrorRoom();
    }

    // ============================================================
    //  NEW AREA BUILDERS
    // ============================================================

    /** Series of moving platforms over a gap. */
    createMovingPlatformGauntlet() {
        // Static start and end platforms
        this.createBox([26, 0.5, -20], [4, 0.4, 3], 0x555566, true);
        this.createBox([38, 0.5, -16], [4, 0.4, 3], 0x555566, true);

        // Elevator platform
        const p1 = new MovingPlatform(this.scene, 'elevator', {
            x: 28, y: 2, z: -20,
            minY: 1, maxY: 4.5,
            speed: 1, width: 2.5, depth: 2.5,
            color: 0x667788
        });

        // Shuttle platform (moves along X)
        const p2 = new MovingPlatform(this.scene, 'shuttle', {
            x: 31.5, y: 3, z: -20,
            axis: 'x', min: -1.5, max: 1.5,
            speed: 1.3, width: 2, depth: 2,
            color: 0x667788
        });

        // Circular orbit platform
        const p3 = new MovingPlatform(this.scene, 'circular', {
            x: 35, y: 3, z: -20,
            radius: 2,
            speed: 0.8, width: 2.2, depth: 2.2,
            color: 0x667788
        });

        // Pendulum platform
        const p4 = new MovingPlatform(this.scene, 'pendulum', {
            x: 36, y: 5.5, z: -18,
            armLength: 3, swingAngle: Math.PI / 5,
            speed: 1.1, axis: 'z',
            width: 2.2, depth: 2.2,
            color: 0x667788
        });

        this.platforms.push(p1, p2, p3, p4);
        for (const p of this.platforms) {
            this.collidables.push(p.mesh);
        }
    }

    /** Narrow hallway with alternating lasers. */
    createLaserCorridor() {
        const cx = 33.5, cz = 5;
        // Corridor walls
        this.createBox([cx - 1.8, 2, cz], [0.4, 4, 14], 0x444455, true);
        this.createBox([cx + 1.8, 2, cz], [0.4, 4, 14], 0x444455, true);

        // Horizontal lasers (always on)
        this.hazards.createLaser({
            x: cx, y: 0.6, z: cz, length: 12,
            orientation: 'horizontal', axis: 'z'
        });
        this.hazards.createLaser({
            x: cx, y: 1.3, z: cz + 2, length: 8,
            orientation: 'horizontal', axis: 'z'
        });
        this.hazards.createLaser({
            x: cx, y: 2.4, z: cz - 2, length: 10,
            orientation: 'horizontal', axis: 'z'
        });

        // Vertical toggling lasers
        this.hazards.createLaser({
            x: cx, y: 1.2, z: cz - 4, length: 2.5,
            orientation: 'vertical', toggleInterval: 2
        });
        this.hazards.createLaser({
            x: cx, y: 1.2, z: cz + 1, length: 2.5,
            orientation: 'vertical', toggleInterval: 2.3
        });
        this.hazards.createLaser({
            x: cx, y: 1.2, z: cz + 5, length: 2.5,
            orientation: 'vertical', toggleInterval: 1.8
        });
    }

    /** Glass panels spanning a 6-unit gap. */
    createGlassBridge() {
        const bx = -15, bz = 25;
        // Start and end supports
        this.createBox([bx - 4, 0.5, bz], [3, 1, 3], 0x555566, true);
        this.createBox([bx + 4, 0.5, bz], [3, 1, 3], 0x555566, true);

        // Glass panels in the gap
        for (let i = -1; i <= 1; i++) {
            this.hazards.createGlassPanel({
                x: bx + i * 2.2,
                y: 0.15,
                z: bz,
                width: 2,
                depth: 2.5
            });
        }
    }

    /** Open area with swinging wrecking balls. */
    createWreckingBallRoom() {
        const rx = 25, rz = 25;
        // Boundary walls
        this.createBox([rx - 6, 2, rz], [0.4, 4, 12], 0x555566, true);
        this.createBox([rx + 6, 2, rz], [0.4, 4, 12], 0x555566, true);
        this.createBox([rx, 2, rz - 6], [12, 4, 0.4], 0x555566, true);

        // Wrecking balls
        this.hazards.createWreckingBall({
            x: rx - 2, y: 7, z: rz,
            armLength: 5, swingAngle: Math.PI / 4, speed: 0.8
        });
        this.hazards.createWreckingBall({
            x: rx + 2, y: 7, z: rz + 2,
            armLength: 4, swingAngle: Math.PI / 5, speed: 1.1
        });
    }

    /** Vertical shaft with stacked fans boosting player upward. */
    createFanShaft() {
        const fx = -30, fz = -25;
        // Shaft walls
        this.createBox([fx - 3, 5, fz], [0.4, 10, 6], 0x444455, true);
        this.createBox([fx + 3, 5, fz], [0.4, 10, 6], 0x444455, true);
        this.createBox([fx, 5, fz - 3], [6, 10, 0.4], 0x444455, true);
        this.createBox([fx, 5, fz + 3], [6, 10, 0.4], 0x444455, true);

        // Landing platforms between fans
        this.createBox([fx, 0.2, fz], [2, 0.4, 2], 0x555566, true);
        this.createBox([fx, 4.2, fz], [2, 0.4, 2], 0x555566, true);
        this.createBox([fx, 8.2, fz], [2, 0.4, 2], 0x555566, true);

        // Three fans placed at different spots within the shaft
        this.hazards.createFanVent({ x: fx - 1, z: fz - 1, height: 5, force: 20 });
        this.hazards.createFanVent({ x: fx + 1, z: fz + 1, height: 5, force: 20 });
        this.hazards.createFanVent({ x: fx - 1, z: fz + 1, height: 5, force: 20 });
    }

    /** Three spinning beams in sequence. */
    createSpinnerAlley() {
        const sx = 10, sz = -28;
        this.hazards.createSpinnerBeam({ x: sx, y: 1.2, z: sz, length: 7, speed: 1.5 });
        this.hazards.createSpinnerBeam({ x: sx + 4, y: 1.8, z: sz, length: 6, speed: 2 });
        this.hazards.createSpinnerBeam({ x: sx + 8, y: 1.0, z: sz, length: 8, speed: 1.2 });
    }

    /** Long conveyor belt pushing player toward wall-jump section. */
    createConveyorRun() {
        const cx = -35, cz = 15;
        // Conveyor belt
        this.hazards.createConveyorBelt({
            x: cx, z: cz,
            width: 4, length: 14,
            speed: 5, dirX: 0, dirZ: 1
        });

        // Side walls to keep player on belt
        this.createBox([cx - 2.3, 1, cz], [0.3, 2, 15], 0x555566, true);
        this.createBox([cx + 2.3, 1, cz], [0.3, 2, 15], 0x555566, true);

        // Wall-jump target at end
        this.createBox([cx - 1.5, 2, cz + 8], [0.4, 4, 3], 0x777788, true, true);
        this.createBox([cx + 1.5, 2, cz + 8], [0.4, 4, 3], 0x777788, true, true);
    }

    /** Small room with highly reflective floor and one wall. */
    createMirrorRoom() {
        const mx = 32, mz = 32, size = 8;

        // Glossy reflective floor (Reflector fallback)
        const floorGeo = new THREE.PlaneGeometry(size, size);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x777788,
            roughness: 0.02,
            metalness: 0.98,
            envMapIntensity: 1.5
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(mx, 0.01, mz);
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Reflective back wall
        const wallGeo = new THREE.PlaneGeometry(size, 5);
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x888899,
            roughness: 0.02,
            metalness: 0.98,
            envMapIntensity: 1.5
        });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(mx, 2.5, mz - size / 2 + 0.05);
        this.scene.add(wall);

        // Other walls (matte border)
        this.createBox([mx - size / 2, 2.5, mz], [0.2, 5, size], 0x555566, true);
        this.createBox([mx + size / 2, 2.5, mz], [0.2, 5, size], 0x555566, true);
        this.createBox([mx, 2.5, mz + size / 2], [size, 5, 0.2], 0x555566, true);
    }

    // ============================================================
    //  UTILITIES
    // ============================================================

    /**
     * Find which moving platform the player is currently standing on.
     * Returns the platform instance or null.
     */
    getPlatformUnderPlayer(player) {
        for (const platform of this.platforms) {
            if (platform.containsPointXZ(player.position.x, player.position.z)) {
                const topY = platform.getTopY();
                const dy = player.position.y - topY;
                // Allow small tolerance for grounded / landing state
                if (dy >= -0.15 && dy <= 0.3) {
                    return platform;
                }
            }
        }
        return null;
    }

    createBox(pos, size, color, collidable = true, climbable = false) {
        const geo = new THREE.BoxGeometry(...size);
        const mat = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.75,
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(pos[0], pos[1], pos[2]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        if (collidable) {
            this.collidables.push(mesh);
            mesh.userData.size = { x: size[0], y: size[1], z: size[2] };
        }
        if (climbable) {
            this.climbables.push(mesh);
        }
        return mesh;
    }

    createRamp(pos, size, angle, color) {
        const geo = new THREE.BoxGeometry(...size);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(pos[0], pos[1] + size[1]/2, pos[2]);
        mesh.rotation.z = angle;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.collidables.push(mesh);
        mesh.userData.size = { x: size[0], y: size[1], z: size[2] };
        mesh.userData.isRamp = true;
        mesh.userData.angle = angle;
        return mesh;
    }

    createCautionStripes(pos, size) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#ffcc00';
        for (let i = -128; i < 256; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 16, 0);
            ctx.lineTo(i - 16 + 128, 128);
            ctx.lineTo(i - 32 + 128, 128);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(size[0] / 2, size[2] / 2);

        const geo = new THREE.PlaneGeometry(size[0], size[2]);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(pos[0], pos[1], pos[2]);
        this.scene.add(mesh);
    }

    // ============================================================
    //  DRONES & COLLECTIBLES
    // ============================================================


    // ============================================================
    //  NEW FEATURE PLACEMENTS
    // ============================================================

    placeZiplines(ziplineNetwork) {
        // Vault training area to central platform
        if (ziplineNetwork) {
            ziplineNetwork.addZipline(
                new THREE.Vector3(8, 4, -5),
                new THREE.Vector3(0, 4, 0)
            );
        }
        // Tall pillars zipline
        if (ziplineNetwork) {
            ziplineNetwork.addZipline(
                new THREE.Vector3(-8, 6, -15),
                new THREE.Vector3(0, 8, -20)
            );
        }
        // Moving platform gauntlet shortcut
        if (ziplineNetwork) {
            ziplineNetwork.addZipline(
                new THREE.Vector3(26, 5, -20),
                new THREE.Vector3(38, 5, -16)
            );
        }
    }

    placeCoolantPuddles(overclockSystem) {
        if (overclockSystem) {
            overclockSystem.addCoolantPuddle(5, -8, 2.5);
            overclockSystem.addCoolantPuddle(-15, 15, 2);
            overclockSystem.addCoolantPuddle(25, 25, 3);
            overclockSystem.addCoolantPuddle(-30, -20, 2);
            overclockSystem.addCoolantPuddle(10, -28, 2.5);
        }
    }

    placeGrappleRelays(grappleRelays) {
        if (grappleRelays) {
            grappleRelays.addRelay(new THREE.Vector3(15, 6, -10), 1.5);
            grappleRelays.addRelay(new THREE.Vector3(0, 7, -15), 1.5);
            grappleRelays.addRelay(new THREE.Vector3(-20, 5, 5), 1.5);
            grappleRelays.addRelay(new THREE.Vector3(30, 6, 0), 1.5);
        }
    }


    // ============================================================
    //  POWER UPS
    // ============================================================
    placePowerUps(powerUpSystem) {
        if (powerUpSystem) {
            const pu = powerUpSystem;
            pu.addPowerUp('speed', 5, 1, -5);
            pu.addPowerUp('ghost', -15, 3, -10);
            pu.addPowerUp('doubleJump', 0, 5, 0);
            pu.addPowerUp('gravity', 15, 2, 15);
            pu.addPowerUp('magnet', -20, 1, 20);
            pu.addPowerUp('speed', 25, 1, 25);
            pu.addPowerUp('ghost', -30, 5, -25);
            pu.addPowerUp('timeFreeze', 0, 3, 20);
            pu.addPowerUp('superJump', 30, 1, -30);
            pu.addPowerUp('invincible', -25, 2, 25);
            pu.addPowerUp('bounce', 20, 0.5, 20);
            pu.addPowerUp('teleport', -10, 1, -30);
            pu.addPowerUp('magnet', 35, 1, -10);
            pu.addPowerUp('doubleJump', -5, 4, 30);
            pu.addPowerUp('gravity', 15, 6, -15);
        }
    }

    // ============================================================
    //  HOLOGRAM ZONES
    // ============================================================
    placeHologramZones(hologramPlatforms) {
        if (hologramPlatforms) {
            const hp = hologramPlatforms;
            hp.addHologramZone(
                new THREE.Vector3(10, 0, 10),
                8,
                [[8, 2, 8], [10, 3, 12], [12, 2, 10], [10, 4, 14]]
            );
            hp.addHologramZone(
                new THREE.Vector3(-15, 0, 15),
                10,
                [[-15, 3, 15], [-12, 4, 18], [-18, 2, 12], [-15, 5, 20]]
            );
        }
    }

    // ============================================================
    //  STRUCTURAL COLLAPSE
    // ============================================================
    markStructuralElements(structuralCollapse) {
        if (structuralCollapse) {
            const sc = structuralCollapse;
            // Mark some pillars as structural
            for (const obj of this.collidables) {
                const box = new THREE.Box3().setFromObject(obj);
                const size = new THREE.Vector3().subVectors(box.max, box.min);
                if (size.y > 4 && size.x < 3 && size.z < 3) {
                    sc.markStructural(obj, 1);
                }
            }
        }
    }

    // ============================================================
    //  NEW LEVEL ZONES
    // ============================================================
    createRooftopSection() {
        // Elevated outdoor-ish platform at the edge
        const rx = 35, rz = 35;
        this.createBox([rx, 8, rz], [12, 0.5, 12], 0x555566, true);
        // Rooftop obstacles
        this.createBox([rx-3, 9, rz-3], [2, 1, 2], 0x777788, true);
        this.createBox([rx+3, 9, rz+3], [2, 1, 2], 0x777788, true);
        this.createBox([rx-3, 9, rz+3], [2, 1, 2], 0x777788, true);
        this.createBox([rx+3, 9, rz-3], [2, 1, 2], 0x777788, true);
        // Access ramp
        this.createRamp([rx-8, 4, rz], [4, 4, 8], -0.6, 0x666677);
        // Climbable walls on rooftop
        this.createBox([rx+6, 9.5, rz], [0.5, 3, 4], 0x777788, true, true);
        this.createBox([rx-6, 9.5, rz], [0.5, 3, 4], 0x777788, true, true);
    }

    createUndergroundTunnel() {
        const tx = -35, tz = -15;
        // Tunnel entrance
        this.createBox([tx, 1, tz], [6, 2, 2], 0x444455, true);
        // Tunnel walls
        this.createBox([tx-3, 1, tz+4], [0.5, 2, 10], 0x444455, true);
        this.createBox([tx+3, 1, tz+4], [0.5, 2, 10], 0x444455, true);
        this.createBox([tx, 2.2, tz+4], [6, 0.5, 10], 0x444455, true);
        // Tunnel floor
        this.createBox([tx, 0.1, tz+4], [6, 0.2, 10], 0x333344, true);
        // Tunnel obstacles
        this.createBox([tx-1, 0.5, tz+3], [1, 1, 1], 0x555566, true);
        this.createBox([tx+1, 0.5, tz+6], [1, 1, 1], 0x555566, true);
        this.createBox([tx, 0.5, tz+8], [1, 1, 1], 0x555566, true);
        // Secret exit
        this.createBox([tx, 1, tz+10], [2, 2, 0.5], 0x444455, true, true);
    }

    createVerticalShaft() {
        const vx = 20, vz = -30;
        // Shaft walls
        this.createBox([vx-2, 5, vz], [0.5, 10, 4], 0x444455, true, true);
        this.createBox([vx+2, 5, vz], [0.5, 10, 4], 0x444455, true, true);
        this.createBox([vx, 5, vz-2], [4, 10, 0.5], 0x444455, true, true);
        this.createBox([vx, 5, vz+2], [4, 10, 0.5], 0x444455, true, true);
        // Platforms inside shaft
        this.createBox([vx, 2, vz], [2, 0.2, 2], 0x555566, true);
        this.createBox([vx, 5, vz], [2, 0.2, 2], 0x555566, true);
        this.createBox([vx, 8, vz], [2, 0.2, 2], 0x555566, true);
        // Ledge on outside
        this.createBox([vx, 0.5, vz-3], [2, 1, 1], 0x555566, true);
    }


    // ============================================================
    //  MORE LEVEL ZONES
    // ============================================================

    createWaterTreatment() {
        const wx = -25, wz = 25;
        // Water pools (blue reflective floor)
        const poolGeo = new THREE.PlaneGeometry(8, 8);
        const poolMat = new THREE.MeshStandardMaterial({ color: 0x0066aa, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.8 });
        const pool = new THREE.Mesh(poolGeo, poolMat);
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(wx, 0.02, wz);
        this.scene.add(pool);
        
        // Pool edges
        this.createBox([wx-4, 0.5, wz], [0.5, 1, 8], 0x555566, true);
        this.createBox([wx+4, 0.5, wz], [0.5, 1, 8], 0x555566, true);
        this.createBox([wx, 0.5, wz-4], [8, 1, 0.5], 0x555566, true);
        this.createBox([wx, 0.5, wz+4], [8, 1, 0.5], 0x555566, true);
        
        // Crossing platforms
        this.createBox([wx-2, 0.8, wz], [2, 0.2, 0.6], 0x777788, true);
        this.createBox([wx+2, 1.2, wz], [2, 0.2, 0.6], 0x777788, true);
        this.createBox([wx, 1.6, wz], [0.6, 0.2, 2], 0x777788, true);
        
        // Pipe structures
        this.createBox([wx-5, 2, wz-5], [0.8, 4, 0.8], 0x666677, true);
        this.createBox([wx+5, 2, wz+5], [0.8, 4, 0.8], 0x666677, true);
    }

    createFreezerSection() {
        const fx = 30, fz = -30;
        // Icy floor (white/blue, very low friction handled in gameplay)
        const iceGeo = new THREE.PlaneGeometry(10, 10);
        const iceMat = new THREE.MeshStandardMaterial({ color: 0xaaccff, roughness: 0.02, metalness: 0.3, transparent: true, opacity: 0.9 });
        const ice = new THREE.Mesh(iceGeo, iceMat);
        ice.rotation.x = -Math.PI / 2;
        ice.position.set(fx, 0.02, fz);
        ice.userData.material = 'ice';
        this.scene.add(ice);
        
        // Ice walls
        this.createBox([fx-5, 2, fz], [0.5, 4, 10], 0xaaccff, true);
        this.createBox([fx+5, 2, fz], [0.5, 4, 10], 0xaaccff, true);
        this.createBox([fx, 2, fz-5], [10, 4, 0.5], 0xaaccff, true);
        this.createBox([fx, 2, fz+5], [10, 4, 0.5], 0xaaccff, true);
        
        // Ice pillars
        this.createBox([fx-3, 1.5, fz-3], [1, 3, 1], 0xbbddff, true);
        this.createBox([fx+3, 1.5, fz+3], [1, 3, 1], 0xbbddff, true);
        
        // Icy ramps
        this.createRamp([fx-2, 0, fz+2], [3, 2, 4], 0.3, 0xaaccff);
        this.createRamp([fx+2, 0, fz-2], [3, 2, 4], -0.3, 0xaaccff);
    }

    createServerRoom() {
        const sx = -10, sz = -35;
        // Narrow corridor walls
        for (let i = 0; i < 6; i++) {
            this.createBox([sx-2, 2, sz + i*3], [0.3, 4, 2], 0x333344, true);
            this.createBox([sx+2, 2, sz + i*3], [0.3, 4, 2], 0x333344, true);
        }
        // Server racks
        for (let i = 0; i < 5; i++) {
            const rack = this.createBox([sx-1.2, 1, sz + i*3 + 1.5], [0.8, 2, 0.4], 0x222233, true);
            rack.userData.isServer = true;
        }
        // Lasers in server room (more dense)
        this.hazards.createLaser({ x: sx, y: 0.8, z: sz+3, length: 3.8, orientation: 'horizontal', axis: 'z' });
        this.hazards.createLaser({ x: sx, y: 1.4, z: sz+7, length: 3.8, orientation: 'horizontal', axis: 'z' });
        this.hazards.createLaser({ x: sx, y: 2.2, z: sz+11, length: 3.8, orientation: 'horizontal', axis: 'z' });
    }

    createHangarBay() {
        const hx = 0, hz = 35;
        // Massive open floor
        const floorGeo = new THREE.PlaneGeometry(20, 20);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.9 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(hx, 0.01, hz);
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Hangar walls (partial)
        this.createBox([hx-10, 3, hz], [0.5, 6, 20], 0x555566, true);
        this.createBox([hx+10, 3, hz], [0.5, 6, 20], 0x555566, true);
        this.createBox([hx, 3, hz-10], [20, 6, 0.5], 0x555566, true);
        
        // Large cargo crates
        this.createBox([hx-5, 1.5, hz-5], [3, 3, 3], 0x8B4513, true);
        this.createBox([hx+5, 1, hz+5], [2, 2, 2], 0xCD853F, true);
        this.createBox([hx, 2, hz], [4, 4, 4], 0x8B4513, true);
        
        // Crane beam overhead
        this.createBox([hx, 8, hz], [16, 0.4, 0.4], 0x666677, true);
        
        // Tall climbable wall at back
        this.createBox([hx, 4, hz+10], [0.5, 8, 8], 0x777788, true, true);
    }

    setPlayer(player) {
        this.player = player;
        this.drones.setPlayer(player);
    }

    /** Six patrol drones placed at strategic parkour choke points. */
    placeDrones() {
        // 1. Vault-training corridor (near origin)
        this.drones.addDrone({
            waypoints: [[5, -8], [14, -8], [14, -2], [5, -2]],
            speed: 2.5,
            height: 3.0,
            pauseTime: 1.5
        });

        // 2. Wall-jump corridor
        this.drones.addDrone({
            waypoints: [[-25, -4], [-30, -4], [-30, 4], [-25, 4]],
            speed: 2,
            height: 3.5,
            pauseTime: 2.0
        });

        // 3. Moving-platform gauntlet
        this.drones.addDrone({
            waypoints: [[28, -22], [38, -22], [38, -18], [28, -18]],
            speed: 2.5,
            height: 3.0,
            pauseTime: 1.2
        });

        // 4. Laser corridor entrance
        this.drones.addDrone({
            waypoints: [[31, -2], [31, 12], [36, 12], [36, -2]],
            speed: 2,
            height: 2.8,
            pauseTime: 1.5
        });

        // 5. Spinner alley
        this.drones.addDrone({
            waypoints: [[10, -31], [18, -31], [18, -25], [10, -25]],
            speed: 3,
            height: 2.5,
            pauseTime: 1.0
        });

        // 6. Fan shaft (top exit)
        this.drones.addDrone({
            waypoints: [[-28, -27], [-32, -27], [-32, -23], [-28, -23]],
            speed: 2,
            height: 4.0,
            pauseTime: 2.0
        });
    }

    /** Twenty data chips scattered at hard-to-reach spots. */
    placeChips() {
        this.collectibles.addChip(15, 5.3, -15);      // top of tall climb wall
        this.collectibles.addChip(-19, 3.3, 16);      // top of corner climb
        this.collectibles.addChip(0, 4.3, 0);         // central platform
        this.collectibles.addChip(0, 8.3, -20);       // tallest pillar
        this.collectibles.addChip(16, 1.5, 10);       // end of balance beam
        this.collectibles.addChip(23, 1.2, 14);       // slide tunnel exit
        this.collectibles.addChip(-5, 2.3, 12);       // crate stack top
        this.collectibles.addChip(-27.5, 4.8, 3);     // highest wall-jump platform
        this.collectibles.addChip(8, 1.3, 22);        // far long-jump platform
        this.collectibles.addChip(38, 1.0, -16);      // moving platform gauntlet end
        this.collectibles.addChip(33.5, 0.8, 11);     // laser corridor exit
        this.collectibles.addChip(-15, 0.5, 25);      // glass bridge middle
        this.collectibles.addChip(25, 0.5, 28);       // wrecking ball room (back)
        this.collectibles.addChip(-30, 8.6, -25);     // fan shaft top
        this.collectibles.addChip(14, 2.2, -28);      // spinner alley middle
        this.collectibles.addChip(-35, 1.0, 22);      // conveyor run end
        this.collectibles.addChip(32, 1, 32);         // mirror room centre
        this.collectibles.addChip(20, 2, 10);         // inside slide tunnel (crouch)
        this.collectibles.addChip(-27.5, 6, 0);       // high wall-jump corridor
        this.collectibles.addChip(31, 4, -20);        // mid-air between moving platforms
    }
}
