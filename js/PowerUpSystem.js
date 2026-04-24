import * as THREE from 'three';

export class PowerUpSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.powerUps = [];
        this.activeEffects = new Map();
    }

    addPowerUp(type, x, y, z) {
        const colors = {
            speed: 0xff0000,
            ghost: 0x00ff00,
            doubleJump: 0x0000ff,
            gravity: 0xff00ff,
            magnet: 0xffff00,
            timeFreeze: 0x00ffff,
            superJump: 0xff8800,
            invincible: 0xffffff,
            bounce: 0xff00aa,
            teleport: 0x8800ff
        };
        const color = colors[type] || 0xffffff;
        const geo = new THREE.IcosahedronGeometry(0.3, 1);
        const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2, transparent: true, opacity: 0.9 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        this.scene.add(mesh);

        const light = new THREE.PointLight(color, 2, 6);
        light.position.copy(mesh.position);
        this.scene.add(light);

        this.powerUps.push({ type, mesh, light, x, y, z, collected: false, respawnTimer: 0 });
    }

    update(dt) {
        const t = Date.now() * 0.002;
        for (const pu of this.powerUps) {
            if (pu.collected) {
                pu.respawnTimer -= dt;
                if (pu.respawnTimer <= 0) {
                    pu.collected = false;
                    pu.mesh.visible = true;
                    pu.light.visible = true;
                }
                continue;
            }

            pu.mesh.position.y = pu.y + Math.sin(t + pu.x) * 0.2;
            pu.mesh.rotation.x += dt * 1.5;
            pu.mesh.rotation.y += dt * 2;
            pu.light.position.copy(pu.mesh.position);

            const dist = this.player.position.distanceTo(pu.mesh.position);
            if (dist < 1.0) {
                this._collect(pu);
            }
        }

        // Update active effects
        for (const [type, timer] of this.activeEffects) {
            this.activeEffects.set(type, timer - dt);
            if (timer <= 0) {
                this._deactivate(type);
                this.activeEffects.delete(type);
            }
        }
    }

    _collect(pu) {
        pu.collected = true;
        pu.mesh.visible = false;
        pu.light.visible = false;
        pu.respawnTimer = 30;
        this._activate(pu.type);
        this._spawnCollectParticles(pu.mesh.position, pu.mesh.material.color);
    }

    _activate(type) {
        const durations = { speed: 8, ghost: 5, doubleJump: 10, gravity: 6, magnet: 8, timeFreeze: 4, superJump: 6, invincible: 5, bounce: 8, teleport: 1 };
        this.activeEffects.set(type, durations[type] || 5);
        
        switch (type) {
            case 'speed':
                this.player.SPEED_SPRINT *= 1.5;
                break;
            case 'ghost':
                this.player.mesh.traverse(c => { if (c.isMesh) { c.material = c.material.clone(); c.material.transparent = true; c.material.opacity = 0.4; } });
                break;
            case 'doubleJump':
                this.player.maxAirDashes = 2;
                break;
            case 'gravity':
                this.player.GRAVITY = -14;
                break;
            case 'magnet':
                // Handled in update via attraction
                break;
            case 'timeFreeze':
                // Handled externally via time scale
                break;
            case 'superJump':
                this.player.JUMP_FORCE *= 1.8;
                break;
            case 'invincible':
                this.player.mesh.traverse(c => { if (c.isMesh) { c.material = c.material.clone(); c.material.emissive.setHex(0xffffff); c.material.emissiveIntensity = 1; } });
                break;
            case 'bounce':
                // Handled in ground collision
                break;
            case 'teleport':
                // Instant random teleport to safe spot
                this.player.position.set((Math.random()-0.5)*40, 5, (Math.random()-0.5)*40);
                this.player.velocity.set(0,0,0);
                break;
        }
    }

    _deactivate(type) {
        switch (type) {
            case 'speed':
                this.player.SPEED_SPRINT /= 1.5;
                break;
            case 'ghost':
                this.player.mesh.traverse(c => { if (c.isMesh) { c.material.opacity = 1.0; } });
                break;
            case 'doubleJump':
                this.player.maxAirDashes = 1;
                break;
            case 'gravity':
                this.player.GRAVITY = -28;
                break;
        }
    }

    _spawnCollectParticles(pos, color) {
        for (let i = 0; i < 10; i++) {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), new THREE.MeshBasicMaterial({ color }));
            p.position.copy(pos);
            p.userData.velocity = new THREE.Vector3((Math.random()-0.5)*6, Math.random()*6, (Math.random()-0.5)*6);
            this.scene.add(p);
            let life = 0.5;
            const anim = () => {
                life -= 0.016;
                p.position.add(p.userData.velocity.clone().multiplyScalar(0.016));
                p.userData.velocity.y -= 9.8 * 0.016;
                if (life > 0) requestAnimationFrame(anim);
                else { this.scene.remove(p); p.geometry.dispose(); p.material.dispose(); }
            };
            anim();
        }
    }

    isGhostActive() { return this.activeEffects.has('ghost'); }
    isMagnetActive() { return this.activeEffects.has('magnet'); }
    isTimeFrozen() { return this.activeEffects.has('timeFreeze'); }
    isInvincible() { return this.activeEffects.has('invincible'); }
    isBounceActive() { return this.activeEffects.has('bounce'); }
}

