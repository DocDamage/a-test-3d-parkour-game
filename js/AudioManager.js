import * as THREE from 'three';

const _sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
export { _sharedCtx as sharedAudioContext };

export class AudioManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.ctx = null;
        this.masterGain = null;
        this.reverbNode = null;
        this.reverbGain = null;
        this.dryGain = null;
        this.slideNode = null;
        this.ambienceNodes = [];
        this._clangTimeout = null;
        this._ambiencePlaying = false;
        this.initialized = false;
        this.listener = null;
    }

    init() {
        if (this.initialized) return;
        this.ctx = _sharedCtx;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;
        this.masterGain.connect(this.ctx.destination);

        // Reverb
        this.reverbNode = this.ctx.createConvolver();
        this.reverbNode.buffer = this.createReverbImpulse(2.5, 2.0);
        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.value = 0.3;
        this.dryGain = this.ctx.createGain();
        this.dryGain.gain.value = 1.0;

        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.masterGain);
        this.dryGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.voiceGain = this.ctx.createGain();
        this.uiGain = this.ctx.createGain();
        this.musicGain.connect(this.masterGain);
        this.voiceGain.connect(this.masterGain);
        this.uiGain.connect(this.masterGain);

        this.initialized = true;
    }

    createReverbImpulse(duration, decay) {
        const sampleRate = this.ctx.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const buffer = this.ctx.createBuffer(2, length, sampleRate);
        for (let c = 0; c < 2; c++) {
            const data = buffer.getChannelData(c);
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const env = Math.pow(1 - t / duration, decay);
                data[i] = (Math.random() * 2 - 1) * env;
            }
        }
        return buffer;
    }

    ensureInit() {
        if (!this.initialized) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    setMasterVolume(vol) {
        this.ensureInit();
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(Math.max(0, vol), this.ctx.currentTime, 0.05);
        }
    }

    setSFXVolume(vol) {
        this.ensureInit();
        if (this.dryGain) {
            this.dryGain.gain.setTargetAtTime(Math.max(0, vol), this.ctx.currentTime, 0.05);
        }
    }

    setMusicVolume(vol) {
        this.ensureInit();
        if (this.musicGain) {
            this.musicGain.gain.setTargetAtTime(Math.max(0, vol), this.ctx.currentTime, 0.05);
        }
    }

    setVoiceVolume(vol) {
        this.ensureInit();
        if (this.voiceGain) {
            this.voiceGain.gain.setTargetAtTime(Math.max(0, vol), this.ctx.currentTime, 0.05);
        }
    }

    setUIVolume(vol) {
        this.ensureInit();
        if (this.uiGain) {
            this.uiGain.gain.setTargetAtTime(Math.max(0, vol), this.ctx.currentTime, 0.05);
        }
    }

    attachToCamera(camera) {
        if (!this.listener) {
            this.listener = new THREE.AudioListener();
            camera.add(this.listener);
            if (this.listener.context.state === 'suspended') {
                this.listener.context.resume();
            }
        }
    }

    _createToneBuffer(freq, duration, type = 'sine') {
        if (!this.listener) return null;
        const ctx = this.listener.context;
        const sampleRate = ctx.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            if (type === 'sine') sample = Math.sin(2 * Math.PI * freq * t);
            else if (type === 'square') sample = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
            else if (type === 'sawtooth') sample = 2 * (t * freq - Math.floor(t * freq + 0.5));
            else if (type === 'noise') sample = Math.random() * 2 - 1;
            const env = Math.min(1, (length - i) / (length * 0.1));
            data[i] = sample * env * 0.5;
        }
        return buffer;
    }

    playPositionalSound(position, options = {}) {
        if (!this.listener) return;
        const buffer = this._createToneBuffer(
            options.freq || 440,
            options.duration || 0.5,
            options.type || 'sine'
        );
        if (!buffer) return;
        const sound = new THREE.PositionalAudio(this.listener);
        sound.setBuffer(buffer);
        sound.setRefDistance(options.refDistance || 10);
        sound.setMaxDistance(options.maxDistance || 100);
        sound.setRolloffFactor(options.rolloff || 1);
        sound.position.copy(position);
        this.scene.add(sound);
        sound.play();
        const duration = options.duration || 0.5;
        setTimeout(() => {
            this.scene.remove(sound);
            if (sound.source) sound.source.stop();
        }, duration * 1000 + 100);
    }

    // ------------------------------------------------------------
    // Surface detection
    // ------------------------------------------------------------
    detectSurface(position) {
        if (!this.world || !this.world.collidables) return 'concrete';
        const origin = new THREE.Vector3(position.x, position.y + 0.05, position.z);
        const ray = new THREE.Ray(origin, new THREE.Vector3(0, -1, 0));
        let closestDist = Infinity;
        let material = 'concrete';

        for (const obj of this.world.collidables) {
            const box = new THREE.Box3().setFromObject(obj);
            const hit = new THREE.Vector3();
            if (ray.intersectBox(box, hit) !== null) {
                const dist = origin.distanceTo(hit);
                if (dist < closestDist && dist < 5) {
                    closestDist = dist;
                    material = obj.userData?.material || 'concrete';
                }
            }
        }
        if (closestDist === Infinity && position.y < 0.15) {
            material = 'concrete';
        }
        return material;
    }

    // ------------------------------------------------------------
    // Routing helper
    // ------------------------------------------------------------
    _makeDestination() {
        const merger = this.ctx.createGain();
        merger.connect(this.dryGain);
        merger.connect(this.reverbNode);
        return merger;
    }

    // ------------------------------------------------------------
    // Footsteps
    // ------------------------------------------------------------
    playFootstep(material = 'concrete', intensity = 1.0) {
        this.ensureInit();
        const t = this.ctx.currentTime;
        const dest = this._makeDestination();
        const pitchVar = 0.9 + Math.random() * 0.2;

        // Noise burst
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.2);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        if (material === 'metal') {
            filter.type = 'bandpass';
            filter.frequency.value = 2500 * pitchVar;
            filter.Q.value = 2;
            gain.gain.setValueAtTime(0.35 * intensity, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        } else if (material === 'wood') {
            filter.type = 'lowpass';
            filter.frequency.value = 950 * pitchVar;
            filter.Q.value = 1;

            // Resonant knock
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 200 * pitchVar;
            const oscGain = this.ctx.createGain();
            oscGain.gain.setValueAtTime(0.12 * intensity, t);
            oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.connect(oscGain);
            oscGain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.15);

            gain.gain.setValueAtTime(0.3 * intensity, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        } else {
            // concrete
            filter.type = 'lowpass';
            filter.frequency.value = 1500 * pitchVar;
            filter.Q.value = 0.8;
            gain.gain.setValueAtTime(0.3 * intensity, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        }

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(t);
        noise.stop(t + 0.25);
    }

    // ------------------------------------------------------------
    // Jump
    // ------------------------------------------------------------
    playJump() {
        this.ensureInit();
        const t = this.ctx.currentTime;
        const dest = this._makeDestination();

        // Grunt
        const gruntOsc = this.ctx.createOscillator();
        gruntOsc.type = 'sawtooth';
        gruntOsc.frequency.setValueAtTime(170, t);
        gruntOsc.frequency.exponentialRampToValueAtTime(80, t + 0.14);
        const gruntGain = this.ctx.createGain();
        gruntGain.gain.setValueAtTime(0.18, t);
        gruntGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        const gruntFilter = this.ctx.createBiquadFilter();
        gruntFilter.type = 'lowpass';
        gruntFilter.frequency.value = 350;
        gruntOsc.connect(gruntFilter);
        gruntFilter.connect(gruntGain);
        gruntGain.connect(dest);
        gruntOsc.start(t);
        gruntOsc.stop(t + 0.22);

        // Woosh
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const d = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) d[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const wooshFilter = this.ctx.createBiquadFilter();
        wooshFilter.type = 'bandpass';
        wooshFilter.frequency.setValueAtTime(1400, t);
        wooshFilter.frequency.exponentialRampToValueAtTime(180, t + 0.3);
        wooshFilter.Q.value = 1;
        const wooshGain = this.ctx.createGain();
        wooshGain.gain.setValueAtTime(0.12, t);
        wooshGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        noise.connect(wooshFilter);
        wooshFilter.connect(wooshGain);
        wooshGain.connect(dest);
        noise.start(t);
        noise.stop(t + 0.35);
    }

    // ------------------------------------------------------------
    // Land
    // ------------------------------------------------------------
    playLand(impactForce) {
        this.ensureInit();
        const t = this.ctx.currentTime;
        const dest = this._makeDestination();
        const force = Math.min(Math.max(impactForce / 15, 0.1), 1.5);

        // Low thud
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 70;
        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.45 * force, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(oscGain);
        oscGain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.32);

        // Texture crackle
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const d = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) d[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 550;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.22 * force, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(dest);
        noise.start(t);
        noise.stop(t + 0.15);
    }

    // ------------------------------------------------------------
    // Slide (looping while active)
    // ------------------------------------------------------------
    playSlide(active) {
        this.ensureInit();
        if (active) {
            if (this.slideNode) return;
            const t = this.ctx.currentTime;
            const dest = this._makeDestination();

            const bufferSize = Math.floor(this.ctx.sampleRate * 1.0);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                let env = 1;
                if (i < 64) env = i / 64;
                if (i > bufferSize - 64) env = (bufferSize - i) / 64;
                data[i] = (Math.random() * 2 - 1) * env;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 900;
            filter.Q.value = 2.5;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.14, t);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            noise.start(t);

            this.slideNode = { noise, filter, gain };
        } else {
            if (!this.slideNode) return;
            const t = this.ctx.currentTime;
            this.slideNode.gain.gain.setTargetAtTime(0, t, 0.04);
            setTimeout(() => {
                if (this.slideNode) {
                    try { this.slideNode.noise.stop(); } catch(e) { if (window.__DEV__) console.warn(e); }
                    this.slideNode = null;
                }
            }, 150);
        }
    }

    // ------------------------------------------------------------
    // Climb
    // ------------------------------------------------------------
    playClimbGrab() {
        this.ensureInit();
        const t = this.ctx.currentTime;
        const dest = this._makeDestination();

        const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 900;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(t);
        noise.stop(t + 0.1);
    }

    // ------------------------------------------------------------
    // Vault
    // ------------------------------------------------------------
    playVault() {
        this.ensureInit();
        const t = this.ctx.currentTime;
        const dest = this._makeDestination();

        // Quick grunt
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.exponentialRampToValueAtTime(160, t + 0.1);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.15);

        // Impact thump
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 110;
        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0.28, t + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc2.connect(gain2);
        gain2.connect(dest);
        osc2.start(t + 0.05);
        osc2.stop(t + 0.25);
    }

    // ------------------------------------------------------------
    // Roll
    // ------------------------------------------------------------
    playRoll() {
        this.ensureInit();
        const t = this.ctx.currentTime;
        const dest = this._makeDestination();

        const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, t);
        filter.frequency.exponentialRampToValueAtTime(120, t + 0.45);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(t);
        noise.stop(t + 0.5);
    }

    // ------------------------------------------------------------
    // Ambience
    // ------------------------------------------------------------
    playAmbience() {
        this.ensureInit();
        if (this._ambiencePlaying) return;
        this._ambiencePlaying = true;
        const t = this.ctx.currentTime;
        const dest = this.musicGain;

        // Low drone
        const droneOsc = this.ctx.createOscillator();
        droneOsc.type = 'sine';
        droneOsc.frequency.value = 52;
        const droneGain = this.ctx.createGain();
        droneGain.gain.value = 0.12;
        const droneLFO = this.ctx.createOscillator();
        droneLFO.frequency.value = 0.12;
        const droneLFOGain = this.ctx.createGain();
        droneLFOGain.gain.value = 18;
        droneLFO.connect(droneLFOGain);
        droneLFOGain.connect(droneOsc.frequency);
        droneOsc.connect(droneGain);
        droneGain.connect(dest);
        droneOsc.start(t);
        droneLFO.start(t);

        // Second drone layer
        const drone2 = this.ctx.createOscillator();
        drone2.type = 'triangle';
        drone2.frequency.value = 108;
        const d2Gain = this.ctx.createGain();
        d2Gain.gain.value = 0.04;
        drone2.connect(d2Gain);
        d2Gain.connect(dest);
        drone2.start(t);

        this.ambienceNodes.push(droneOsc, droneLFO, droneGain, droneLFOGain, drone2, d2Gain);
        this._scheduleClang();
    }

    _scheduleClang() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime + 0.05;
        const dest = this._makeDestination();
        const freq = 250 + Math.random() * 350;

        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = freq;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = freq;
        filter.Q.value = 10;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.025, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2 + Math.random());
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 2.5);

        const duration = 2.5;
        setTimeout(() => {
            try { osc.stop(); } catch(e) { if (window.__DEV__) console.warn(e); }
            try { osc.disconnect(); } catch(e) { if (window.__DEV__) console.warn(e); }
            try { filter.disconnect(); } catch(e) { if (window.__DEV__) console.warn(e); }
            try { gain.disconnect(); } catch(e) { if (window.__DEV__) console.warn(e); }
        }, duration * 1000 + 50);

        this._clangTimeout = setTimeout(() => this._scheduleClang(), 4000 + Math.random() * 8000);
    }

    stopAmbience() {
        if (!this.initialized) return;
        this._ambiencePlaying = false;
        const t = this.ctx.currentTime;
        if (this.ambienceNodes) {
            this.ambienceNodes.forEach(n => { try { n.disconnect(); } catch(e) { if (window.__DEV__) console.warn(e); } });
        }
        this.ambienceNodes.forEach(node => {
            if (node.gain) {
                try { node.gain.setTargetAtTime(0, t, 0.5); } catch(e) { if (window.__DEV__) console.warn(e); }
            } else if (node.stop) {
                try { node.stop(t + 0.6); } catch(e) { if (window.__DEV__) console.warn(e); }
            }
        });
        this.ambienceNodes = [];
        if (this._clangTimeout) {
            clearTimeout(this._clangTimeout);
            this._clangTimeout = null;
        }
    }

    // ------------------------------------------------------------
    // UI
    // ------------------------------------------------------------
    playUIClick() {
        this.ensureInit();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain);
        gain.connect(this.uiGain);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    playHitSound(type = 'generic', position = null) {
        this.ensureInit();
        if (position && this.listener) {
            const freq = type === 'explosion' ? 80 : 150;
            this.playPositionalSound(position, {
                freq,
                duration: 0.35,
                type: 'sawtooth',
                refDistance: 8,
                rolloff: 1.5
            });
            return;
        }
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(type === 'explosion' ? 80 : 150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain).connect(this.dryGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
    }

    playDeathSound(position = null) {
        this.ensureInit();
        if (position && this.listener) {
            this.playPositionalSound(position, {
                freq: 200,
                duration: 1.5,
                type: 'sine',
                refDistance: 12,
                rolloff: 1.2
            });
            return;
        }
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.5);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        osc.connect(gain).connect(this.dryGain);
        osc.start();
        osc.stop(ctx.currentTime + 1.6);
    }

    playWeaponFire(weaponName = 'default', position = null) {
        this.ensureInit();
        if (position && this.listener) {
            const baseFreq = weaponName.includes('pistol') ? 600 : weaponName.includes('rifle') ? 400 : 200;
            this.playPositionalSound(position, {
                freq: baseFreq,
                duration: 0.2,
                type: weaponName.includes('melee') ? 'square' : 'sawtooth',
                refDistance: 10,
                rolloff: 1.0
            });
            return;
        }
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = weaponName.includes('melee') ? 'square' : 'sawtooth';
        const baseFreq = weaponName.includes('pistol') ? 600 : weaponName.includes('rifle') ? 400 : 200;
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain).connect(this.dryGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }

    playSFX(id, position = null) {
        switch(id) {
            case 'mechanical_click': this.playUIClick(); break;
            case 'boss_phase':
                if (position && this.listener) {
                    this.playPositionalSound(position, { freq: 300, duration: 1.2, type: 'sawtooth', refDistance: 15, rolloff: 1.0 });
                }
                break;
            case 'enemy_death':
                if (position && this.listener) {
                    this.playPositionalSound(position, { freq: 120, duration: 0.6, type: 'sawtooth', refDistance: 10, rolloff: 1.2 });
                }
                break;
            case 'drone_explosion':
                if (position && this.listener) {
                    this.playPositionalSound(position, { freq: 200, duration: 0.5, type: 'noise', refDistance: 12, rolloff: 1.5 });
                }
                break;
            case 'miniboss_death':
                if (position && this.listener) {
                    this.playPositionalSound(position, { freq: 100, duration: 1.0, type: 'sawtooth', refDistance: 15, rolloff: 1.2 });
                }
                break;
            default: break;
        }
    }

    playTone(freq, duration, type = 'sine') {
        this.ensureInit();
        const t = this.ctx.currentTime;
        const dest = this._makeDestination();
        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + duration + 0.02);
    }
}
