import * as THREE from 'three';

export class OverclockSystem {
    constructor(scene, player, postProcessing) {
        this.scene = scene;
        this.player = player;
        this.postProcessing = postProcessing;
        this.heat = 0;
        this.maxHeat = 100;
        this.overclockActive = false;
        this.overclockTimer = 0;
        this.overclockDuration = 3.0;
        this.venting = false;
        this.heatDecay = 25; // per second when not sprinting
        this.heatBuild = 35; // per second when sprinting
        this.coolantPuddles = [];
        this.timeScale = 1.0;
        this._buildUI();
    }

    _buildUI() {
        this.ui = document.createElement('div');
        this.ui.style.cssText = 'position:fixed;bottom:20px;right:20px;width:200px;height:12px;background:rgba(0,0,0,0.5);border-radius:6px;overflow:hidden;z-index:20;border:1px solid rgba(255,100,0,0.3);';
        this.bar = document.createElement('div');
        this.bar.style.cssText = 'width:0%;height:100%;background:linear-gradient(90deg,#ff4400,#ffaa00);transition:width 0.1s;';
        this.ui.appendChild(this.bar);
        this.label = document.createElement('div');
        this.label.style.cssText = 'position:absolute;top:-18px;right:0;color:#ffaa00;font-size:11px;font-family:monospace;';
        this.label.textContent = 'HEAT';
        this.ui.appendChild(this.label);
        document.body.appendChild(this.ui);
    }

    addCoolantPuddle(x, z, radius = 2) {
        const geo = new THREE.CircleGeometry(radius, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0088ff, emissiveIntensity: 0.5, transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.3 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0.02, z);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.coolantPuddles.push({ mesh, x, z, radius });
    }

    update(dt, input) {
        // Time scale smoothing
        const targetScale = this.overclockActive ? 0.3 : 1.0;
        this.timeScale = THREE.MathUtils.lerp(this.timeScale, targetScale, dt * 8);

        if (this.overclockActive) {
            this.overclockTimer -= dt * (1 / this.timeScale); // real-time countdown
            this.heat = 100 * (this.overclockTimer / this.overclockDuration);
            if (this.overclockTimer <= 0) {
                this.overclockActive = false;
                this.heat = 0;
                this._setPostFX(false);
            }
            this._updateUI();
            return this.timeScale;
        }

        // Heat build/decay
        const sprinting = this.player.state === 'SPRINT';
        const sliding = this.player.state === 'SLIDE';
        const onCoolant = this._checkCoolant();

        if (onCoolant && sliding) {
            this.venting = true;
            this.heat = Math.max(0, this.heat - dt * 120);
        } else {
            this.venting = false;
            if (sprinting) this.heat = Math.min(this.maxHeat, this.heat + dt * this.heatBuild);
            else this.heat = Math.max(0, this.heat - dt * this.heatDecay);
        }

        // Overclock trigger
        if (this.heat >= this.maxHeat && input.wasPressed('KeyQ') && input.isPressed('ShiftLeft')) {
            this._activateOverclock();
        }

        // Overheat stumble
        if (this.heat >= this.maxHeat && !this.overclockActive && !input.isPressed('ShiftLeft')) {
            this.player.startStumble();
            this.heat = 0;
        }

        this._updateUI();
        return 1.0;
    }

    _activateOverclock() {
        this.overclockActive = true;
        this.overclockTimer = this.overclockDuration;
        this.player.dashCount = 0; // reset air dashes
        this.player.maxAirDashes = 2;
        this._setPostFX(true);
        if (this.player.audio && this.player.audio.playJump) this.player.audio.playJump();
    }

    _setPostFX(active) {
        if (!this.postProcessing) return;
        if (active) {
            this.postProcessing.toggleChromaticAberration(true);
            this.postProcessing.toggleVignette(true);
            this.postProcessing.chromaticAberrationPass.uniforms.strength.value = 0.025;
            this.postProcessing.vignettePass.uniforms.strength.value = 3.0;
        } else {
            this.postProcessing.toggleChromaticAberration(false);
            this.postProcessing.toggleVignette(false);
            this.player.maxAirDashes = 1;
        }
    }

    _checkCoolant() {
        for (const p of this.coolantPuddles) {
            const dx = this.player.position.x - p.x;
            const dz = this.player.position.z - p.z;
            if (dx * dx + dz * dz < p.radius * p.radius) return true;
        }
        return false;
    }

    _updateUI() {
        this.bar.style.width = (this.heat / this.maxHeat * 100) + '%';
        if (this.overclockActive) {
            this.label.textContent = 'OVERCLOCK ' + this.overclockTimer.toFixed(1) + 's';
            this.bar.style.background = 'linear-gradient(90deg,#00ffff,#0088ff)';
        } else if (this.heat >= this.maxHeat) {
            this.label.textContent = 'OVERHEAT WARNING! SHIFT+Q';
            this.bar.style.background = '#ff0000';
        } else if (this.venting) {
            this.label.textContent = 'VENTING';
            this.bar.style.background = 'linear-gradient(90deg,#00aaff,#00ffff)';
        } else {
            this.label.textContent = 'HEAT';
            this.bar.style.background = 'linear-gradient(90deg,#ff4400,#ffaa00)';
        }
    }
}
