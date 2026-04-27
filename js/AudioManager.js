import * as THREE from 'three';

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
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

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
        // Music is part of ambience; scale ambience nodes
        const target = Math.max(0, vol);
        for (const node of this.ambienceNodes) {
            if (node.gain) {
                try { node.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05); } catch (e) {}
            }
        }
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
                    try { this.slideNode.noise.stop(); } catch (e) {}
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
        const t = this.ctx.currentTime;
        const dest = this._makeDestination();

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

        this._clangTimeout = setTimeout(() => this._scheduleClang(), 4000 + Math.random() * 8000);
    }

    stopAmbience() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        this.ambienceNodes.forEach(node => {
            if (node.gain) {
                try { node.gain.setTargetAtTime(0, t, 0.5); } catch (e) {}
            } else if (node.stop) {
                try { node.stop(t + 0.6); } catch (e) {}
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
        const dest = this._makeDestination();
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.08);
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
