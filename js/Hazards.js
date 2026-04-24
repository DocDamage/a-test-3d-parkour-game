import * as THREE from 'three';

/**
 * Hazards - Manages all interactive environmental hazards.
 * Lasers, breakable glass, wrecking balls, fans, spinning beams, conveyor belts.
 */
export class Hazards {
    constructor(scene, worldCollidables) {
        this.scene = scene;
        this.worldCollidables = worldCollidables;

        this.lasers = [];
        this.glassPanels = [];
        this.wreckingBalls = [];
        this.fans = [];
        this.spinners = [];
        this.conveyors = [];
    }

    // ============================================================
    //  CREATION HELPERS
    // ============================================================

    /**
     * Create a laser beam.
     * @param {Object} cfg
     * @param {number} cfg.x,y,z - position
     * @param {number} cfg.length - beam length
     * @param {'horizontal'|'vertical'} cfg.orientation
     * @param {'x'|'z'} cfg.axis - axis for horizontal lasers
     * @param {number} cfg.toggleInterval - seconds between toggles (0 = always on)
     */
    createLaser(cfg) {
        const {
            x = 0, y = 1, z = 0,
            length = 6,
            orientation = 'horizontal',
            axis = 'x',
            toggleInterval = 0
        } = cfg;

        const group = new THREE.Group();
        group.position.set(x, y, z);

        const radius = orientation === 'horizontal' ? 0.06 : 0.1;
        let geo;
        if (orientation === 'horizontal') {
            geo = new THREE.CylinderGeometry(radius, radius, length, 8);
            if (axis === 'x') geo.rotateZ(Math.PI / 2);
            else geo.rotateX(Math.PI / 2);
        } else {
            geo = new THREE.CylinderGeometry(radius, radius, length, 8);
        }

        const mat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 4
        });
        const mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);

        // Glow line core
        const points = [];
        if (orientation === 'horizontal') {
            const half = length / 2;
            if (axis === 'x') {
                points.push(new THREE.Vector3(-half, 0, 0));
                points.push(new THREE.Vector3(half, 0, 0));
            } else {
                points.push(new THREE.Vector3(0, 0, -half));
                points.push(new THREE.Vector3(0, 0, half));
            }
        } else {
            const half = length / 2;
            points.push(new THREE.Vector3(0, -half, 0));
            points.push(new THREE.Vector3(0, half, 0));
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffaaaa, transparent: true, opacity: 0.9 });
        const line = new THREE.Line(lineGeo, lineMat);
        group.add(line);

        // Point light for glow
        const light = new THREE.PointLight(0xff0000, 3, 6);
        group.add(light);

        this.scene.add(group);

        this.lasers.push({
            group, mesh, line, light,
            orientation, axis, toggleInterval,
            timer: toggleInterval > 0 ? Math.random() * toggleInterval : 0,
            active: true,
            x, y, z, length,
            bbox: new THREE.Box3()
        });
    }

    /**
     * Create a breakable glass floor panel.
     */
    createGlassPanel(cfg) {
        const { x = 0, y = 0.1, z = 0, width = 2, depth = 2 } = cfg;

        const geo = new THREE.BoxGeometry(width, 0.15, depth);
        const mat = new THREE.MeshPhysicalMaterial({
            color: 0xaaccff,
            transparent: true,
            opacity: 0.55,
            roughness: 0.05,
            metalness: 0.1,
            transmission: 0.6,
            thickness: 0.15
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.receiveShadow = true;
        mesh.userData.isGlass = true;
        mesh.userData.size = { x: width, y: 0.15, z: depth };

        this.scene.add(mesh);
        this.worldCollidables.push(mesh);

        this.glassPanels.push({
            mesh, x, y, z, width, depth,
            standTime: 0,
            state: 'solid', // solid | cracking | broken
            crackTimer: 0,
            respawnTimer: 0
        });
    }

    /**
     * Create a wrecking ball on a chain.
     */
    createWreckingBall(cfg) {
        const {
            x = 0, y = 6, z = 0,
            armLength = 5,
            swingAngle = Math.PI / 3,
            speed = 1
        } = cfg;

        const group = new THREE.Group();
        group.position.set(x, y, z);

        // Chain
        const chainGeo = new THREE.CylinderGeometry(0.06, 0.06, armLength, 6);
        const chainMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const chain = new THREE.Mesh(chainGeo, chainMat);
        chain.position.y = -armLength / 2;
        group.add(chain);

        // Ball
        const ballRadius = 2;
        const ballGeo = new THREE.SphereGeometry(ballRadius, 20, 20);
        const ballMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.3,
            metalness: 0.9
        });
        const ball = new THREE.Mesh(ballGeo, ballMat);
        ball.position.y = -armLength;
        ball.castShadow = true;
        group.add(ball);

        this.scene.add(group);

        const wb = {
            group, chain, ball,
            x, y, z, armLength, swingAngle, speed,
            time: Math.random() * 10,
            radius: ballRadius
        };
        this.wreckingBalls.push(wb);
        this.worldCollidables.push(ball);
        ball.userData.isHazard = true;
        ball.userData.size = { x: ballRadius * 2, y: ballRadius * 2, z: ballRadius * 2 };
    }

    /**
     * Create a floor fan vent with upward force field.
     */
    createFanVent(cfg) {
        const { x = 0, z = 0, height = 8, force = 18 } = cfg;

        const group = new THREE.Group();
        group.position.set(x, 0.05, z);

        // Base ring
        const baseGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.15, 20);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        group.add(base);

        // Blades
        const bladeGeo = new THREE.BoxGeometry(2.4, 0.06, 0.35);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const blades = [];
        for (let i = 0; i < 4; i++) {
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.rotation.y = (i / 4) * Math.PI;
            blade.position.y = 0.1;
            group.add(blade);
            blades.push(blade);
        }

        // Force field cone
        const coneGeo = new THREE.ConeGeometry(1.4, height, 16, 1, true);
        const coneMat = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = height / 2;
        group.add(cone);

        this.scene.add(group);

        this.fans.push({
            group, base, blades, cone,
            x, z, height, force,
            bladeAngle: Math.random() * Math.PI * 2
        });
    }

    /**
     * Create a long rotating beam on a central pivot.
     */
    createSpinnerBeam(cfg) {
        const { x = 0, y = 1.5, z = 0, length = 8, speed = 2 } = cfg;

        const group = new THREE.Group();
        group.position.set(x, y, z);

        // Pivot post
        const pivotGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 8);
        const pivotMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const pivot = new THREE.Mesh(pivotGeo, pivotMat);
        pivot.rotation.x = Math.PI / 2;
        group.add(pivot);

        // Beam
        const beamGeo = new THREE.BoxGeometry(length, 0.35, 0.35);
        const beamMat = new THREE.MeshStandardMaterial({ color: 0xaa2222 });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.castShadow = true;
        group.add(beam);

        this.scene.add(group);

        this.spinners.push({ group, beam, x, y, z, length, speed, angle: 0 });
        this.worldCollidables.push(beam);
        beam.userData.isHazard = true;
        beam.userData.size = { x: length, y: 0.35, z: 0.35 };
    }

    /**
     * Create a conveyor belt with animated stripes.
     */
    createConveyorBelt(cfg) {
        const {
            x = 0, z = 0,
            width = 4, length = 12,
            speed = 4,
            dirX = 1, dirZ = 0
        } = cfg;

        // Animated stripe texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(0, 0, 64, 10);
        ctx.fillRect(0, 32, 64, 10);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(length / 2, width / 2);

        const geo = new THREE.BoxGeometry(length, 0.25, width);
        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.7,
            metalness: 0.2
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, 0.125, z);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        mesh.userData.isConveyor = true;
        mesh.userData.size = { x: length, y: 0.25, z: width };

        this.scene.add(mesh);

        this.conveyors.push({
            mesh, tex,
            x, z, width, length,
            speed,
            direction: new THREE.Vector3(dirX, 0, dirZ).normalize(),
            offset: 0
        });
        this.worldCollidables.push(mesh);
    }

    // ============================================================
    //  UPDATE LOOP
    // ============================================================

    update(dt, player) {
        this.updateLasers(dt, player);
        this.updateGlass(dt, player);
        this.updateWreckingBalls(dt, player);
        this.updateFans(dt, player);
        this.updateSpinners(dt, player);
        this.updateConveyors(dt, player);
    }

    // --------------------------------------------------------
    //  LASERS
    // --------------------------------------------------------
    updateLasers(dt, player) {
        const playerCenter = player.position.clone().add(new THREE.Vector3(0, player.currentHeight / 2, 0));
        const playerSize = new THREE.Vector3(player.RADIUS * 2, player.currentHeight, player.RADIUS * 2);
        const playerBox = new THREE.Box3().setFromCenterAndSize(playerCenter, playerSize);

        for (const laser of this.lasers) {
            // Toggle logic
            if (laser.toggleInterval > 0) {
                laser.timer += dt;
                if (laser.timer >= laser.toggleInterval) {
                    laser.timer -= laser.toggleInterval;
                    laser.active = !laser.active;
                }
            }

            laser.mesh.visible = laser.active;
            laser.line.visible = laser.active;
            laser.light.intensity = laser.active ? 3 : 0;

            if (!laser.active) continue;

            // Approximate collision with world-space bounding box
            laser.bbox.setFromObject(laser.mesh);
            if (playerBox.intersectsBox(laser.bbox)) {
                // Push back + upward bump
                const push = new THREE.Vector3()
                    .subVectors(playerCenter, new THREE.Vector3(laser.x, laser.y, laser.z))
                    .normalize();
                push.y = 0.4;
                push.normalize();
                player.velocity.add(push.multiplyScalar(10));
                player.velocity.y += 4;
                // Stumble if the property exists
                if ('startStumble' in player && typeof player.startStumble === 'function') {
                    player.startStumble();
                }
            }
        }
    }

    // --------------------------------------------------------
    //  BREAKABLE GLASS
    // --------------------------------------------------------
    updateGlass(dt, player) {
        for (const glass of this.glassPanels) {
            if (glass.state === 'broken') {
                glass.respawnTimer -= dt;
                if (glass.respawnTimer <= 0) {
                    this.respawnGlass(glass);
                }
                continue;
            }

            const onGlass = this.isPlayerOnGlass(player, glass);
            if (onGlass) {
                glass.standTime += dt;
            } else {
                glass.standTime = Math.max(0, glass.standTime - dt * 0.5);
            }

            if (glass.state === 'solid' && glass.standTime > 1.5) {
                glass.state = 'cracking';
                glass.crackTimer = 0.5;
                // Visual crack: darker, more opaque (stress lines)
                glass.mesh.material.color.setHex(0x7799aa);
                glass.mesh.material.opacity = 0.45;
            }

            if (glass.state === 'cracking') {
                glass.crackTimer -= dt;
                const progress = 1 - glass.crackTimer / 0.5;
                glass.mesh.material.opacity = 0.45 - progress * 0.25;
                if (glass.crackTimer <= 0) {
                    this.breakGlass(glass);
                }
            }
        }
    }

    isPlayerOnGlass(player, glass) {
        const dx = Math.abs(player.position.x - glass.x);
        const dz = Math.abs(player.position.z - glass.z);
        const dy = player.position.y - glass.y;
        return dx < glass.width / 2 &&
               dz < glass.depth / 2 &&
               dy > -0.15 && dy < 0.4 &&
               player.grounded;
    }

    breakGlass(glass) {
        glass.state = 'broken';
        glass.mesh.visible = false;
        glass.respawnTimer = 5;
        const idx = this.worldCollidables.indexOf(glass.mesh);
        if (idx !== -1) this.worldCollidables.splice(idx, 1);
    }

    respawnGlass(glass) {
        glass.state = 'solid';
        glass.standTime = 0;
        glass.mesh.visible = true;
        glass.mesh.material.color.setHex(0xaaccff);
        glass.mesh.material.opacity = 0.55;
        if (!this.worldCollidables.includes(glass.mesh)) {
            this.worldCollidables.push(glass.mesh);
        }
    }

    // --------------------------------------------------------
    //  WRECKING BALLS
    // --------------------------------------------------------
    updateWreckingBalls(dt, player) {
        for (const wb of this.wreckingBalls) {
            wb.time += dt * wb.speed;
            const angle = Math.sin(wb.time) * wb.swingAngle;
            wb.group.rotation.z = angle;
            wb.group.updateMatrixWorld();

            // World-space ball center
            const ballPos = new THREE.Vector3();
            wb.ball.getWorldPosition(ballPos);

            const playerCenter = player.position.clone().add(new THREE.Vector3(0, player.currentHeight / 2, 0));
            const dist = ballPos.distanceTo(playerCenter);
            if (dist < wb.radius + player.RADIUS + 0.1) {
                const launch = new THREE.Vector3()
                    .subVectors(player.position, ballPos)
                    .normalize();
                launch.y = 0.6;
                launch.normalize();
                player.velocity.copy(launch.multiplyScalar(28));
                player.velocity.y = 14;
            }
        }
    }

    // --------------------------------------------------------
    //  FAN VENTS
    // --------------------------------------------------------
    updateFans(dt, player) {
        for (const fan of this.fans) {
            // Spin blades
            fan.bladeAngle += dt * 12;
            fan.blades.forEach((blade, i) => {
                blade.rotation.y = fan.bladeAngle + (i / 4) * Math.PI;
            });

            // Animate force field visibility
            fan.cone.material.opacity = 0.06 + Math.sin(Date.now() * 0.004) * 0.03;

            // Check if player is inside force cylinder
            const dx = player.position.x - fan.x;
            const dz = player.position.z - fan.z;
            const hDist = Math.sqrt(dx * dx + dz * dz);
            const vDist = player.position.y - 0.1;

            if (hDist < 1.4 && vDist > 0 && vDist < fan.height) {
                // Upward push + reduced gravity compensation
                player.velocity.y += fan.force * dt;
                player.velocity.y += 6 * dt; // extra lift to counter gravity
            }
        }
    }

    // --------------------------------------------------------
    //  SPINNING BEAMS
    // --------------------------------------------------------
    updateSpinners(dt, player) {
        for (const spinner of this.spinners) {
            spinner.angle += dt * spinner.speed;
            spinner.group.rotation.y = spinner.angle;
            spinner.group.updateMatrixWorld();
        }
    }

    // --------------------------------------------------------
    //  CONVEYOR BELTS
    // --------------------------------------------------------
    updateConveyors(dt, player) {
        for (const belt of this.conveyors) {
            // Animate texture
            belt.offset += dt * belt.speed * 0.4;
            belt.tex.offset.y = -belt.offset;

            // Check if player is grounded on belt
            const dx = Math.abs(player.position.x - belt.x);
            const dz = Math.abs(player.position.z - belt.z);
            const dy = player.position.y - belt.mesh.position.y;
            const onBelt = dx < belt.length / 2 - 0.1 &&
                           dz < belt.width / 2 - 0.1 &&
                           dy > -0.1 && dy < 0.4 &&
                           player.grounded;

            if (onBelt) {
                const push = belt.direction.clone().multiplyScalar(belt.speed * dt * 2.5);
                player.position.add(push);
                player.velocity.x += belt.direction.x * belt.speed * dt * 3;
                player.velocity.z += belt.direction.z * belt.speed * dt * 3;
            }
        }
    }
}
