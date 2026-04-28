import * as THREE from 'three';
import { sharedAudioContext as importedAudioContext } from './AudioManager.js';

let sharedAudioContext = importedAudioContext || null;

function getAudioContext() {
    if (!sharedAudioContext) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) sharedAudioContext = new AC();
    }
    return sharedAudioContext;
}

function playCollectSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.12, now);
        master.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        master.connect(ctx.destination);

        // Two-tone sparkly chime
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
        osc1.connect(master);
        osc1.start(now);
        osc1.stop(now + 0.35);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, now + 0.05);
        osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.2);
        osc2.connect(master);
        osc2.start(now + 0.05);
        osc2.stop(now + 0.35);
    } catch (e) {
        // Audio unavailable — silently ignore
    }
}

/**
 * Individual data chip with idle animation and sparkle particles.
 */
class Chip {
    constructor(scene, position) {
        this.scene = scene;
        this.basePosition = position.clone();
        this.collected = false;
        this.respawnTimer = 0;

        // ---- Hexagonal prism mesh ----
        const geo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 6);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 2.5,
            roughness: 0.2,
            metalness: 0.9,
            transparent: true,
            opacity: 0.95
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(this.basePosition);
        this.mesh.castShadow = true;
        scene.add(this.mesh);

        // Local point light
        this.light = new THREE.PointLight(0x00ffff, 1.2, 5);
        this.light.position.copy(this.basePosition);
        scene.add(this.light);

        // ---- Sparkle particles ----
        const particleCount = 14;
        const pGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        this.particleSpeeds = new Float32Array(particleCount);
        this.particleBase = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const bx = (Math.random() - 0.5) * 0.7;
            const by = (Math.random() - 0.5) * 0.5;
            const bz = (Math.random() - 0.5) * 0.7;
            positions[i * 3] = bx;
            positions[i * 3 + 1] = by;
            positions[i * 3 + 2] = bz;
            this.particleBase[i * 3] = bx;
            this.particleBase[i * 3 + 1] = by;
            this.particleBase[i * 3 + 2] = bz;
            this.particleSpeeds[i] = 0.15 + Math.random() * 0.4;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const pMat = new THREE.PointsMaterial({
            color: 0xaaffff,
            size: 0.06,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.particles = new THREE.Points(pGeo, pMat);
        this.particles.position.copy(this.basePosition);
        scene.add(this.particles);
    }

    /** Animate float, spin and sparkles (only while visible). */
    updateAnimation(dt) {
        if (this.collected) return;

        const t = Date.now() * 0.002;
        const floatY = this.basePosition.y + Math.sin(t) * 0.15;
        this.mesh.position.y = floatY;
        this.mesh.rotation.y += dt * 1.8;

        // Particles drift upward and reset
        const pos = this.particles.geometry.attributes.position.array;
        for (let i = 0; i < this.particleSpeeds.length; i++) {
            pos[i * 3 + 1] += dt * this.particleSpeeds[i];
            if (pos[i * 3 + 1] > 0.6) {
                pos[i * 3] = this.particleBase[i * 3];
                pos[i * 3 + 1] = this.particleBase[i * 3 + 1];
                pos[i * 3 + 2] = this.particleBase[i * 3 + 2];
            }
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.position.y = floatY;
        this.light.position.y = floatY;
    }

    /** Try to collect this chip. Returns true on first success. */
    collect() {
        if (this.collected) return false;
        this.collected = true;
        this.mesh.visible = false;
        this.particles.visible = false;
        this.light.visible = false;
        playCollectSound();
        return true;
    }

    respawn() {
        this.collected = false;
        this.mesh.visible = true;
        this.particles.visible = true;
        this.light.visible = true;
    }
}

/**
 * Manages all collectible data chips in the level.
 */
export class Collectibles {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.chips = [];
        this.count = 0;
        this.respawnEnabled = false;

        // Build a minimal UI counter and inject it into the existing HUD
        this.uiWrapper = document.createElement('div');
        this.uiWrapper.style.cssText = 'margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.12);font-size:12px;color:#aaa;';
        this.uiWrapper.innerHTML =
            'Data Chips: <span id="chip-count" style="color:#00ffff;font-weight:bold;">0</span>' +
            ' / <span id="chip-total" style="color:#00ffff;font-weight:bold;">0</span>';
        const uiRoot = document.getElementById('ui');
        if (uiRoot) uiRoot.appendChild(this.uiWrapper);
    }

    /** Spawn a chip at the given world coordinates. */
    addChip(x, y, z) {
        const chip = new Chip(this.scene, new THREE.Vector3(x, y, z));
        this.chips.push(chip);
        this.updateUI();
    }

    /** Call every frame. */
    update(dt, player) {
        for (const chip of this.chips) {
            if (!chip.collected) {
                chip.updateAnimation(dt);
                if (player) {
                    const dist = chip.mesh.position.distanceTo(player.position);
                    if (dist < 1.0 && chip.collect()) {
                        this.count++;
                        if (this.respawnEnabled) {
                            chip.respawnTimer = 30;
                        }
                        this.updateUI();
                    }
                }
            } else if (this.respawnEnabled && chip.respawnTimer > 0) {
                chip.respawnTimer -= dt;
                if (chip.respawnTimer <= 0) {
                    chip.respawn();
                }
            }
        }
    }

    getCount() { return this.count; }
    getTotal() { return this.chips.length; }

    reset() {
        this.count = 0;
        for (const chip of this.chips) {
            chip.respawn();
            chip.respawnTimer = 0;
        }
        this.updateUI();
    }

    updateUI() {
        const countEl = document.getElementById('chip-count');
        const totalEl = document.getElementById('chip-total');
        if (countEl) countEl.textContent = this.count;
        if (totalEl) totalEl.textContent = this.chips.length;
    }
}
