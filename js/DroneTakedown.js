import * as THREE from 'three';

export class DroneTakedown {
    constructor(scene) {
        this.scene = scene;
        this.slowMoTimer = 0;
        this.slowMoDuration = 0.4;
        this.onKill = null;

        // Hijack state
        this.hijackTarget = null;
        this.hijackTimer = 0;
        this.hijackHoldTimer = 0;
        this.HIJACK_HOLD_TIME = 1.0;
        this.HIJACK_DURATION = 5.0;
    }

    update(dt, player, input, drones) {
        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= dt;
            return 0.2; // return time scale
        }

        // Hijack mode: hold F for 1s near any drone
        if (this.hijackTarget) {
            this.hijackTimer -= dt;
            if (this.hijackTimer <= 0 || !input.isPressed('KeyF')) {
                this._endHijack(player);
            } else {
                this._updateHijack(dt, player);
            }
            return 1.0;
        }

        if (input.isPressed('KeyF')) {
            let nearest = null;
            let nearestDist = Infinity;
            for (const drone of drones) {
                if (drone.isDead || drone.team === 'player') continue;
                const pos = drone.position || (drone.mesh && drone.mesh.position);
                if (!pos) continue;
                const dist = player.position.distanceTo(pos);
                if (dist < nearestDist && dist < 3.0) {
                    nearestDist = dist;
                    nearest = drone;
                }
            }
            if (nearest) {
                this.hijackHoldTimer += dt;
                if (this.hijackHoldTimer >= this.HIJACK_HOLD_TIME) {
                    this._startHijack(player, nearest);
                    this.hijackHoldTimer = 0;
                    return 1.0;
                }
            }
        } else {
            this.hijackHoldTimer = 0;
        }

        // Standard takedown: tap F while wallrunning
        if (player.state !== 'WALLRUN') return 1.0;
        if (!input.wasPressed('KeyF')) return 1.0;

        let nearest = null;
        let nearestDist = Infinity;
        for (const drone of drones) {
            const dist = player.position.distanceTo(drone.group.position);
            if (dist < nearestDist && dist < 3.0) {
                nearestDist = dist;
                nearest = drone;
            }
        }

        if (!nearest) return 1.0;

        // Execute takedown
        this._performTakedown(player, nearest);
        return 0.2;
    }

    _performTakedown(player, drone) {
        // Destroy drone visuals
        drone.group.traverse(c => {
            if (c.isMesh) {
                c.material = c.material.clone();
                c.material.emissive.setHex(0xff0000);
                c.material.emissiveIntensity = 3;
            }
        });

        // Explosion particles
        for (let i = 0; i < 12; i++) {
            const p = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.08, 0.08),
                new THREE.MeshBasicMaterial({ color: 0xffaa00 })
            );
            p.position.copy(drone.group.position);
            p.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8
            );
            this.scene.add(p);
            let life = 0.6;
            const anim = () => {
                life -= 0.016;
                p.position.add(p.userData.velocity.clone().multiplyScalar(0.016));
                p.userData.velocity.y -= 9.8 * 0.016;
                p.rotation.x += 0.1; p.rotation.y += 0.1;
                if (life > 0) requestAnimationFrame(anim);
                else { this.scene.remove(p); p.geometry.dispose(); p.material.dispose(); }
            };
            anim();
        }

        // Push player off wall with boost
        const away = new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing)).normalize();
        player.velocity.set(away.x * 10, 7, away.z * 10);
        player.state = 'JUMP';
        player.wallRunData = null;
        player.comboSystem.registerMove('airDash');
        player.comboSystem.flowMeter = Math.min(100, player.comboSystem.flowMeter + 25);

        // Disable drone
        drone.state = 'SEARCH';
        if (this.onKill) this.onKill(drone);
        drone.detection = 0;
        drone.group.visible = false;
        drone.spotLight.visible = false;
        drone.coneMesh.visible = false;
        setTimeout(() => {
            drone.group.visible = true;
            drone.spotLight.visible = true;
            drone.coneMesh.visible = true;
            drone.state = 'PATROL';
        }, 8000);

        this.slowMoTimer = this.slowMoDuration;
        if (player.cameraController) player.cameraController.shake(0.4, 0.3);
        if (player.audio && player.audio.playLand) player.audio.playLand(2);
    }

    _startHijack(player, drone) {
        this.hijackTarget = drone;
        this.hijackTimer = this.HIJACK_DURATION;
        drone.team = 'player';
        drone._hackExpiry = this.HIJACK_DURATION;

        // Hijack visual: drone glows cyan
        drone.group.traverse(c => {
            if (c.isMesh && c.material) {
                c.userData._hijackOriginalEmissive = c.material.emissive ? c.material.emissive.getHex() : 0;
                c.material.emissive.setHex(0x00ffff);
                c.material.emissiveIntensity = 2;
            }
        });

        // Create reticle for player
        if (!this._reticle) {
            const rg = new THREE.RingGeometry(0.1, 0.15, 16);
            const rm = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
            this._reticle = new THREE.Mesh(rg, rm);
            this.scene.add(this._reticle);
        }
    }

    _updateHijack(dt, player) {
        const drone = this.hijackTarget;
        if (!drone || drone.isDead) {
            this._endHijack(player);
            return;
        }

        // Reticle follows drone
        const pos = drone.position || (drone.mesh && drone.mesh.position);
        if (pos && this._reticle) {
            this._reticle.position.copy(pos).add(new THREE.Vector3(0, 0.8, 0));
            this._reticle.lookAt(player.position);
        }

        // Auto-fire laser at nearest enemy
        const drones = this.scene.userData?.allDrones || [];
        let nearest = null;
        let nearestDist = Infinity;
        for (const d of drones) {
            if (d === drone || d.isDead || d.team === 'player') continue;
            const dPos = d.position || (d.mesh && d.mesh.position);
            if (!dPos) continue;
            const dist = pos.distanceTo(dPos);
            if (dist < nearestDist && dist < 20) {
                nearestDist = dist;
                nearest = d;
            }
        }

        if (nearest && pos) {
            const targetPos = nearest.position || (nearest.mesh && nearest.mesh.position);
            // Damage tick
            if (Math.random() < dt * 10) { // ~10 dmg/sec
                if (nearest.takeDamage) nearest.takeDamage(1, 'energy', player);
            }
            // Laser beam visual
            if (!this._hijackBeam) {
                const bg = new THREE.BufferGeometry().setFromPoints([pos.clone(), targetPos.clone()]);
                const bm = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 });
                this._hijackBeam = new THREE.Line(bg, bm);
                this.scene.add(this._hijackBeam);
            }
            const positions = this._hijackBeam.geometry.attributes.position.array;
            positions[0] = pos.x; positions[1] = pos.y; positions[2] = pos.z;
            positions[3] = targetPos.x; positions[4] = targetPos.y; positions[5] = targetPos.z;
            this._hijackBeam.geometry.attributes.position.needsUpdate = true;
        }
    }

    _endHijack(player) {
        if (this.hijackTarget) {
            const drone = this.hijackTarget;
            drone.team = 'enemy';
            drone._hackExpiry = 0;
            // Restore visuals
            drone.group.traverse(c => {
                if (c.isMesh && c.material && c.userData._hijackOriginalEmissive !== undefined) {
                    c.material.emissive.setHex(c.userData._hijackOriginalEmissive);
                    c.material.emissiveIntensity = 1.5;
                }
            });
        }
        this.hijackTarget = null;
        this.hijackTimer = 0;
        this.hijackHoldTimer = 0;
        if (this._reticle) {
            this.scene.remove(this._reticle);
            this._reticle.geometry.dispose();
            this._reticle.material.dispose();
            this._reticle = null;
        }
        if (this._hijackBeam) {
            this.scene.remove(this._hijackBeam);
            this._hijackBeam.geometry.dispose();
            this._hijackBeam.material.dispose();
            this._hijackBeam = null;
        }
    }
}
