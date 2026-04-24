import * as THREE from 'three';

/**
 * InteractiveEnvironment adds dynamic environmental features to the parkour world:
 * - Breakable Vents (sprint into them to reveal duct tunnels)
 * - Magnetic Crane Hook (grapple and swing to create temporary ziplines)
 * - Steam Pipe Bursts (dash or wrecking-ball impact creates upward steam jets)
 * - Floodlight Mirrors (rotate to redirect hazard lasers)
 */
export class InteractiveEnvironment {
    constructor(scene, world, player, hazards, audio) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.hazards = hazards;
        this.audio = audio;

        this.vents = [];
        this.pipes = [];
        this.mirrors = [];
        this.craneHooks = [];
        this.steamJets = [];
        this.reflectedBeams = [];
        this.particleSystems = [];

        // Ensure grapple points array exists for the existing grapple system
        if (!this.world.grapplePoints) {
            this.world.grapplePoints = [];
        }
    }

    // ============================================================
    //  CREATION API
    // ============================================================

    addVent(x, y, z, width, height) {
        const thickness = 0.15;
        const geo = new THREE.BoxGeometry(width, height, thickness);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x556655,
            roughness: 0.7,
            metalness: 0.4
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.isVent = true;
        mesh.userData.width = width;
        mesh.userData.height = height;

        // Grill slats visual
        const slatGeo = new THREE.BoxGeometry(width * 0.9, 0.02, thickness * 1.1);
        const slatMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
        for (let i = 0; i < 5; i++) {
            const slat = new THREE.Mesh(slatGeo, slatMat);
            slat.position.y = ((i / 4) - 0.5) * height * 0.8;
            mesh.add(slat);
        }

        this.scene.add(mesh);
        this.world.collidables.push(mesh);

        // Hidden duct tunnel behind the vent (dark interior)
        const tunnelDepth = 4;
        const tunnelGeo = new THREE.BoxGeometry(width * 0.85, height * 0.85, tunnelDepth);
        const tunnelMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
        const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
        // Offset tunnel behind the vent based on world position logic
        // We'll just place it behind; caller should ensure wall orientation
        tunnel.position.set(0, 0, -thickness / 2 - tunnelDepth / 2);
        mesh.add(tunnel);

        this.vents.push({
            mesh,
            x, y, z,
            width, height,
            broken: false,
            tunnel,
            brokenFrame: null
        });
    }

    addSteamPipe(x, y, z, axis = 'x') {
        const length = 2.5;
        const radius = 0.18;
        const geo = new THREE.CylinderGeometry(radius, radius, length, 10);
        if (axis === 'z') geo.rotateX(Math.PI / 2);
        else if (axis === 'y') geo.rotateZ(Math.PI / 2);

        const mat = new THREE.MeshStandardMaterial({
            color: 0x882222,
            roughness: 0.5,
            metalness: 0.6
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.userData.isSteamPipe = true;
        mesh.userData.axis = axis;

        this.scene.add(mesh);
        this.world.collidables.push(mesh);

        this.pipes.push({
            mesh,
            x, y, z,
            axis,
            length,
            radius,
            burst: false,
            burstTimer: 0,
            valveMesh: null
        });
    }

    addMirror(x, y, z, rotationY = 0) {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        group.rotation.y = rotationY;

        // Mirror panel (slightly angled frame)
        const frameGeo = new THREE.BoxGeometry(1.0, 1.4, 0.08);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        group.add(frame);

        // Reflective surface
        const surfGeo = new THREE.BoxGeometry(0.85, 1.25, 0.02);
        const surfMat = new THREE.MeshStandardMaterial({
            color: 0xccffff,
            metalness: 1.0,
            roughness: 0.05,
            emissive: 0x112233,
            emissiveIntensity: 0.3
        });
        const surface = new THREE.Mesh(surfGeo, surfMat);
        surface.position.z = 0.04;
        surface.rotation.y = Math.PI / 4; // 45° for typical 90° laser reflections
        group.add(surface);

        // Highlight ring when near
        const ringGeo = new THREE.RingGeometry(0.5, 0.55, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.9;
        group.add(ring);

        this.scene.add(group);

        this.mirrors.push({
            group,
            frame,
            surface,
            ring,
            x, y, z,
            rotationY,
            reflectedBeams: [],
            baseRotation: rotationY
        });
    }

    addCraneHook(x, y, z) {
        const group = new THREE.Group();
        group.position.set(x, y, z);

        // Hook body
        const bodyGeo = new THREE.TorusGeometry(0.25, 0.06, 8, 16, Math.PI * 1.3);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.9, roughness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.z = Math.PI / 2;
        group.add(body);

        // Stem
        const stemGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
        const stem = new THREE.Mesh(stemGeo, bodyMat);
        stem.position.y = 0.35;
        group.add(stem);

        // Magnet glow
        const glowGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = 0.15;
        group.add(glow);

        this.scene.add(group);

        const hook = {
            group,
            body,
            glow,
            x, y, z,
            originalPos: new THREE.Vector3(x, y, z),
            currentPos: new THREE.Vector3(x, y, z),
            grappled: false,
            releaseTimer: 0,
            grappleIndex: -1,
            ziplineLine: null
        };

        // Register as grapple point for the existing grapple system
        hook.grappleIndex = this.world.grapplePoints.length;
        this.world.grapplePoints.push(hook.currentPos);

        this.craneHooks.push(hook);
    }

    // ============================================================
    //  UPDATE LOOP
    // ============================================================

    update(dt, input) {
        this.updateVents(dt);
        this.updatePipes(dt);
        this.updateMirrors(dt, input);
        this.updateCraneHooks(dt);
        this.updateSteamJets(dt);
        this.updateReflectedLasers(dt);
        this.updateParticles(dt);
    }

    // --------------------------------------------------------
    //  BREAKABLE VENTS
    // --------------------------------------------------------

    updateVents(dt) {
        for (const vent of this.vents) {
            if (vent.broken) continue;

            const p = this.player.position;
            const halfW = vent.width / 2 + this.player.RADIUS;
            const halfH = vent.height / 2;
            const dx = Math.abs(p.x - vent.x);
            const dy = Math.abs((p.y + this.player.currentHeight / 2) - vent.y);
            const dz = Math.abs(p.z - vent.z);

            // Collision: player overlaps vent bounds and is sprinting
            const overlap = dx < halfW && dy < halfH + this.player.currentHeight / 2 && dz < 0.5;
            if (overlap && this.player.state === 'SPRINT') {
                this.breakVent(vent);
            }
        }
    }

    breakVent(vent) {
        vent.broken = true;

        // Remove solid vent from collidables
        const idx = this.world.collidables.indexOf(vent.mesh);
        if (idx !== -1) this.world.collidables.splice(idx, 1);

        // Hide solid slats, show broken interior
        vent.mesh.children.forEach(child => {
            if (child !== vent.tunnel) child.visible = false;
        });
        vent.tunnel.visible = true;

        // Create broken frame (climbable)
        const frameThick = 0.08;
        const frameGeo = new THREE.BoxGeometry(vent.width, vent.height, 0.12);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x334433, metalness: 0.5 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.copy(vent.mesh.position);
        this.scene.add(frame);
        this.world.climbables.push(frame);
        vent.brokenFrame = frame;

        // Particle burst
        this.spawnParticles(vent.x, vent.y, vent.z, 0x889988, 20, 4);

        // Sound
        this._playMetalCrash(vent.x, vent.y, vent.z);
    }

    // --------------------------------------------------------
    //  STEAM PIPES
    // --------------------------------------------------------

    updatePipes(dt) {
        for (const pipe of this.pipes) {
            if (pipe.burst) continue;

            // Player dash collision
            let hit = false;
            const p = this.player.position;
            const dist = new THREE.Vector3(p.x, p.y + this.player.currentHeight / 2, p.z).distanceTo(new THREE.Vector3(pipe.x, pipe.y, pipe.z));

            if (dist < pipe.radius + this.player.RADIUS + 0.3 && this.player.dashTimer > 0) {
                hit = true;
            }

            // Wrecking ball collision
            if (!hit && this.hazards && this.hazards.wreckingBalls) {
                for (const wb of this.hazards.wreckingBalls) {
                    const ballPos = new THREE.Vector3();
                    wb.ball.getWorldPosition(ballPos);
                    if (ballPos.distanceTo(new THREE.Vector3(pipe.x, pipe.y, pipe.z)) < wb.radius + pipe.radius + 0.2) {
                        hit = true;
                        break;
                    }
                }
            }

            if (hit) {
                this.burstPipe(pipe);
            }
        }
    }

    burstPipe(pipe) {
        pipe.burst = true;
        pipe.burstTimer = 8;

        // Remove pipe from collidables (it no longer blocks)
        const idx = this.world.collidables.indexOf(pipe.mesh);
        if (idx !== -1) this.world.collidables.splice(idx, 1);

        // Change pipe material to dark/burnt
        pipe.mesh.material = pipe.mesh.material.clone();
        pipe.mesh.material.color.setHex(0x331111);

        // Particle burst at burst point
        this.spawnParticles(pipe.x, pipe.y, pipe.z, 0xdddddd, 30, 3);

        // Steam jet force field
        const jetHeight = 8;
        const coneGeo = new THREE.ConeGeometry(0.9, jetHeight, 12, 1, true);
        const coneMat = new THREE.MeshBasicMaterial({
            color: 0xccffff,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.set(pipe.x, pipe.y + jetHeight / 2, pipe.z);
        this.scene.add(cone);

        // Steam cloud (expanding sphere)
        const cloudGeo = new THREE.SphereGeometry(1.2, 12, 12);
        const cloudMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.25,
            depthWrite: false
        });
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set(pipe.x, pipe.y + 1, pipe.z);
        this.scene.add(cloud);

        // Point particles rising
        const pCount = 60;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(pCount * 3);
        const pVel = [];
        for (let i = 0; i < pCount; i++) {
            pPos[i * 3] = pipe.x + (Math.random() - 0.5) * 0.4;
            pPos[i * 3 + 1] = pipe.y + Math.random() * 0.5;
            pPos[i * 3 + 2] = pipe.z + (Math.random() - 0.5) * 0.4;
            pVel.push(new THREE.Vector3((Math.random() - 0.5) * 1, 2 + Math.random() * 3, (Math.random() - 0.5) * 1));
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.7 });
        const points = new THREE.Points(pGeo, pMat);
        this.scene.add(points);

        this.steamJets.push({
            pipe,
            cone,
            cloud,
            points,
            pVel,
            timer: 8,
            height: jetHeight,
            baseY: pipe.y
        });

        this._playSteamHiss(pipe.x, pipe.y, pipe.z);
    }

    updateSteamJets(dt) {
        for (let i = this.steamJets.length - 1; i >= 0; i--) {
            const jet = this.steamJets[i];
            jet.timer -= dt;

            // Fade out near end
            const fade = Math.min(1, jet.timer / 1.5);
            jet.cone.material.opacity = 0.12 * fade;
            jet.cloud.material.opacity = 0.25 * fade;
            jet.points.material.opacity = 0.7 * fade;

            // Animate particles
            const positions = jet.points.geometry.attributes.position.array;
            for (let j = 0; j < jet.pVel.length; j++) {
                positions[j * 3] += jet.pVel[j].x * dt;
                positions[j * 3 + 1] += jet.pVel[j].y * dt;
                positions[j * 3 + 2] += jet.pVel[j].z * dt;

                // Reset particles that go too high
                if (positions[j * 3 + 1] > jet.baseY + jet.height) {
                    positions[j * 3] = jet.pipe.x + (Math.random() - 0.5) * 0.4;
                    positions[j * 3 + 1] = jet.pipe.y;
                    positions[j * 3 + 2] = jet.pipe.z + (Math.random() - 0.5) * 0.4;
                }
            }
            jet.points.geometry.attributes.position.needsUpdate = true;

            // Apply upward force to player if inside steam column
            const dx = this.player.position.x - jet.pipe.x;
            const dz = this.player.position.z - jet.pipe.z;
            const hDist = Math.sqrt(dx * dx + dz * dz);
            const vDist = this.player.position.y - jet.pipe.y;
            if (hDist < 0.9 && vDist > 0 && vDist < jet.height && jet.timer > 0) {
                this.player.velocity.y += 18 * dt;
                this.player.velocity.y += 6 * dt; // extra lift like fan
            }

            if (jet.timer <= 0) {
                this.scene.remove(jet.cone);
                this.scene.remove(jet.cloud);
                this.scene.remove(jet.points);
                jet.cone.geometry.dispose();
                jet.cone.material.dispose();
                jet.cloud.geometry.dispose();
                jet.cloud.material.dispose();
                jet.points.geometry.dispose();
                jet.points.material.dispose();
                this.steamJets.splice(i, 1);
            }
        }
    }

    // --------------------------------------------------------
    //  MIRRORS & LASER REFLECTION
    // --------------------------------------------------------

    updateMirrors(dt, input) {
        for (const mirror of this.mirrors) {
            // Proximity highlight
            const dist = new THREE.Vector3(this.player.position.x, this.player.position.y + this.player.currentHeight / 2, this.player.position.z)
                .distanceTo(new THREE.Vector3(mirror.x, mirror.y + 0.5, mirror.z));
            mirror.ring.material.opacity = dist < 2.5 ? 0.4 : 0;

            // Rotate on E press
            if (dist < 2.5 && input && input.wasPressed && input.wasPressed('KeyE')) {
                mirror.rotationY += Math.PI / 2;
                mirror.group.rotation.y = mirror.rotationY;
                this._playMechanicalClick(mirror.x, mirror.y, mirror.z);
            }
        }

        this.updateLaserReflections();
    }

    updateLaserReflections() {
        // Clean up old reflected beams
        for (const beam of this.reflectedBeams) {
            this.scene.remove(beam.group);
            beam.line.geometry.dispose();
            beam.line.material.dispose();
            if (beam.mesh) {
                beam.mesh.geometry.dispose();
                beam.mesh.material.dispose();
            }
            if (beam.light) beam.light.dispose();
        }
        this.reflectedBeams = [];

        if (!this.hazards || !this.hazards.lasers) return;

        for (const mirror of this.mirrors) {
            const mirrorBox = new THREE.Box3().setFromObject(mirror.frame);
            const mirrorNormal = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), mirror.rotationY + Math.PI / 4);
            mirrorNormal.normalize();

            for (const laser of this.hazards.lasers) {
                if (!laser.active) continue;

                // Update bbox if not current
                laser.bbox.setFromObject(laser.mesh);

                if (!laser.bbox.intersectsBox(mirrorBox)) continue;

                // Determine laser direction
                const laserDir = new THREE.Vector3();
                if (laser.orientation === 'horizontal') {
                    laserDir.set(laser.axis === 'x' ? 1 : 0, 0, laser.axis === 'z' ? 1 : 0);
                } else {
                    laserDir.set(0, 1, 0);
                }

                // Reflection direction: R = D - 2(D·N)N
                const dot = laserDir.dot(mirrorNormal);
                if (Math.abs(dot) < 0.01) continue; // grazing, no useful reflection

                const reflectDir = new THREE.Vector3()
                    .copy(laserDir)
                    .sub(mirrorNormal.clone().multiplyScalar(2 * dot))
                    .normalize();

                // Approximate hit point as midpoint between mirror and laser centers
                const laserCenter = new THREE.Vector3();
                laser.bbox.getCenter(laserCenter);
                const mirrorCenter = new THREE.Vector3();
                mirrorBox.getCenter(mirrorCenter);
                const hitPoint = new THREE.Vector3().lerpVectors(laserCenter, mirrorCenter, 0.5);

                // Create reflected beam visual
                const beamLength = laser.length || 6;
                const beamGroup = new THREE.Group();
                beamGroup.position.copy(hitPoint);

                // Orient beam along reflection
                const beamGeo = new THREE.CylinderGeometry(0.06, 0.06, beamLength, 8);
                const beamMat = new THREE.MeshStandardMaterial({
                    color: 0xff0000,
                    emissive: 0xff0000,
                    emissiveIntensity: 4
                });
                const beamMesh = new THREE.Mesh(beamGeo, beamMat);

                // Align cylinder to reflection direction
                const up = new THREE.Vector3(0, 1, 0);
                const q = new THREE.Quaternion().setFromUnitVectors(up, reflectDir);
                beamMesh.setRotationFromQuaternion(q);
                beamGroup.add(beamMesh);

                // Glow line
                const half = beamLength / 2;
                const linePoints = [
                    hitPoint.clone().add(reflectDir.clone().multiplyScalar(-half)),
                    hitPoint.clone().add(reflectDir.clone().multiplyScalar(half))
                ];
                const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
                const lineMat = new THREE.LineBasicMaterial({ color: 0xffaaaa, transparent: true, opacity: 0.9 });
                const line = new THREE.Line(lineGeo, lineMat);
                beamGroup.add(line);

                // Point light
                const light = new THREE.PointLight(0xff0000, 2, 5);
                beamGroup.add(light);

                this.scene.add(beamGroup);
                this.reflectedBeams.push({
                    group: beamGroup,
                    mesh: beamMesh,
                    line,
                    light,
                    bbox: new THREE.Box3().setFromObject(beamMesh)
                });

                // Hazard check: if player touches reflected beam, push them
                const playerCenter = this.player.position.clone().add(new THREE.Vector3(0, this.player.currentHeight / 2, 0));
                const playerSize = new THREE.Vector3(this.player.RADIUS * 2, this.player.currentHeight, this.player.RADIUS * 2);
                const playerBox = new THREE.Box3().setFromCenterAndSize(playerCenter, playerSize);
                if (this.reflectedBeams[this.reflectedBeams.length - 1].bbox.intersectsBox(playerBox)) {
                    const push = reflectDir.clone().multiplyScalar(8);
                    push.y = 4;
                    this.player.velocity.add(push);
                    if ('startStumble' in this.player && typeof this.player.startStumble === 'function') {
                        this.player.startStumble();
                    }
                }
            }
        }
    }

    updateReflectedLasers(dt) {
        // Timers or fade effects could go here; currently beams are rebuilt each frame
    }

    // --------------------------------------------------------
    //  CRANE HOOK
    // --------------------------------------------------------

    updateCraneHooks(dt) {
        for (const hook of this.craneHooks) {
            const gh = this.player.grapplingHook;
            const isGrappled = gh && (gh.state === 'SWING' || gh.state === 'RETRACT') && gh.anchorPoint && gh.anchorPoint.distanceTo(hook.currentPos) < 1.5;

            if (isGrappled) {
                hook.grappled = true;
                hook.releaseTimer = 10;

                // Move hook horizontally toward player's movement (swing effect)
                const targetX = THREE.MathUtils.lerp(hook.currentPos.x, this.player.position.x, dt * 1.5);
                const targetZ = THREE.MathUtils.lerp(hook.currentPos.z, this.player.position.z, dt * 1.5);
                // Clamp distance from original to avoid infinite drift
                const maxOffset = 8;
                const offX = targetX - hook.originalPos.x;
                const offZ = targetZ - hook.originalPos.z;
                const offLen = Math.sqrt(offX * offX + offZ * offZ);
                if (offLen > maxOffset) {
                    const scale = maxOffset / offLen;
                    targetX = hook.originalPos.x + offX * scale;
                    targetZ = hook.originalPos.z + offZ * scale;
                }

                hook.currentPos.set(targetX, hook.originalPos.y, targetZ);
                hook.group.position.copy(hook.currentPos);

                // Update grapple anchor so the cable follows
                gh.anchorPoint.copy(hook.currentPos);

                // Update registered grapple point
                if (hook.grappleIndex >= 0 && hook.grappleIndex < this.world.grapplePoints.length) {
                    this.world.grapplePoints[hook.grappleIndex].copy(hook.currentPos);
                }

                // Visual zipline cable from hook to ground
                this.updateZiplineVisual(hook);
            } else {
                if (hook.grappled) {
                    hook.grappled = false;
                    hook.releaseTimer = 10;
                }

                if (hook.releaseTimer > 0) {
                    hook.releaseTimer -= dt;
                    this.updateZiplineVisual(hook);
                } else {
                    // Return to original position
                    if (hook.currentPos.distanceTo(hook.originalPos) > 0.01) {
                        hook.currentPos.lerp(hook.originalPos, dt * 2);
                        hook.group.position.copy(hook.currentPos);
                        if (hook.grappleIndex >= 0 && hook.grappleIndex < this.world.grapplePoints.length) {
                            this.world.grapplePoints[hook.grappleIndex].copy(hook.currentPos);
                        }
                    }
                    if (hook.ziplineLine) {
                        this.scene.remove(hook.ziplineLine);
                        hook.ziplineLine.geometry.dispose();
                        hook.ziplineLine.material.dispose();
                        hook.ziplineLine = null;
                    }
                }
            }
        }
    }

    updateZiplineVisual(hook) {
        if (!hook.ziplineLine) {
            const geo = new THREE.BufferGeometry();
            const mat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
            hook.ziplineLine = new THREE.Line(geo, mat);
            hook.ziplineLine.frustumCulled = false;
            this.scene.add(hook.ziplineLine);
        }
        // Cable drops from hook to a point below (ground at y=0 or player height)
        const groundY = 0.2;
        const points = [
            hook.currentPos.clone(),
            new THREE.Vector3(hook.currentPos.x, groundY, hook.currentPos.z)
        ];
        hook.ziplineLine.geometry.setFromPoints(points);
    }

    // --------------------------------------------------------
    //  PARTICLES
    // --------------------------------------------------------

    spawnParticles(x, y, z, color, count, speed) {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];
        for (let i = 0; i < count; i++) {
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed
            ));
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color, size: 0.12, transparent: true, opacity: 0.9 });
        const points = new THREE.Points(geo, mat);
        this.scene.add(points);

        this.particleSystems.push({
            points,
            velocities,
            timer: 1.5,
            geo
        });
    }

    updateParticles(dt) {
        for (let i = this.particleSystems.length - 1; i >= 0; i--) {
            const sys = this.particleSystems[i];
            sys.timer -= dt;
            sys.points.material.opacity = Math.max(0, sys.timer / 1.5);

            const pos = sys.points.geometry.attributes.position.array;
            for (let j = 0; j < sys.velocities.length; j++) {
                pos[j * 3] += sys.velocities[j].x * dt;
                pos[j * 3 + 1] += sys.velocities[j].y * dt;
                pos[j * 3 + 2] += sys.velocities[j].z * dt;
                sys.velocities[j].y -= 2 * dt; // gravity
            }
            sys.points.geometry.attributes.position.needsUpdate = true;

            if (sys.timer <= 0) {
                this.scene.remove(sys.points);
                sys.geo.dispose();
                sys.points.material.dispose();
                this.particleSystems.splice(i, 1);
            }
        }
    }

    // --------------------------------------------------------
    //  AUDIO HELPERS
    // --------------------------------------------------------

    _playMetalCrash(x, y, z) {
        if (!this.audio || !this.audio.ctx) return;
        try {
            this.audio.ensureInit();
            const t = this.audio.ctx.currentTime;
            const dest = this.audio._makeDestination();

            const bufferSize = Math.floor(this.audio.ctx.sampleRate * 0.3);
            const buffer = this.audio.ctx.createBuffer(1, bufferSize, this.audio.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

            const noise = this.audio.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.audio.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1200;
            filter.Q.value = 1;
            const gain = this.audio.ctx.createGain();
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            noise.start(t);
            noise.stop(t + 0.35);
        } catch (e) {}
    }

    _playSteamHiss(x, y, z) {
        if (!this.audio || !this.audio.ctx) return;
        try {
            this.audio.ensureInit();
            const t = this.audio.ctx.currentTime;
            const dest = this.audio._makeDestination();

            const bufferSize = Math.floor(this.audio.ctx.sampleRate * 1.5);
            const buffer = this.audio.ctx.createBuffer(1, bufferSize, this.audio.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

            const noise = this.audio.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.audio.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 800;
            const gain = this.audio.ctx.createGain();
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            noise.start(t);
            noise.stop(t + 1.3);
        } catch (e) {}
    }

    _playMechanicalClick(x, y, z) {
        if (!this.audio || !this.audio.ctx) return;
        try {
            this.audio.ensureInit();
            const t = this.audio.ctx.currentTime;
            const dest = this.audio._makeDestination();

            const osc = this.audio.ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = 600;
            const filter = this.audio.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 2000;
            const gain = this.audio.ctx.createGain();
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.08);
        } catch (e) {}
    }
}
