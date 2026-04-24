import * as THREE from 'three';

export class ParticleEffects {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.emitters = [];
        this._createDustSystem();
        this._createSparkSystem();
        this._createSpeedLines();
    }

    _createDustSystem() {
        const count = 200;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            positions[i*3] = (Math.random()-0.5) * 40;
            positions[i*3+1] = Math.random() * 0.5;
            positions[i*3+2] = (Math.random()-0.5) * 40;
            sizes[i] = 0.02 + Math.random() * 0.04;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        const mat = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.05,
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
            sizeAttenuation: true
        });
        this.dustParticles = new THREE.Points(geo, mat);
        this.scene.add(this.dustParticles);
    }

    _createSparkSystem() {
        const count = 100;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffaa00,
            size: 0.08,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.sparkParticles = new THREE.Points(geo, mat);
        this.scene.add(this.sparkParticles);
        this.sparkTimer = 0;
    }

    _createSpeedLines() {
        const count = 50;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.03,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.speedLines = new THREE.Points(geo, mat);
        this.scene.add(this.speedLines);
    }

    update(dt) {
        const speed = Math.sqrt(this.player.velocity.x**2 + this.player.velocity.z**2);
        const t = Date.now() * 0.001;

        // Dust swirls around player when moving fast
        const dustPos = this.dustParticles.geometry.attributes.position.array;
        for (let i = 0; i < dustPos.length / 3; i++) {
            const dx = dustPos[i*3] - this.player.position.x;
            const dz = dustPos[i*3+2] - this.player.position.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist > 20) {
                dustPos[i*3] = this.player.position.x + (Math.random()-0.5) * 10;
                dustPos[i*3+1] = Math.random() * 0.5;
                dustPos[i*3+2] = this.player.position.z + (Math.random()-0.5) * 10;
            }
        }
        this.dustParticles.geometry.attributes.position.needsUpdate = true;
        this.dustParticles.material.opacity = Math.min(0.3, speed / 20);

        // Sparks when grinding/sliding
        if (this.player.state === 'SLIDE' || this.player.state === 'WALLRUN') {
            this.sparkTimer += dt;
            if (this.sparkTimer > 0.05) {
                this.sparkTimer = 0;
                this._emitSparks(5);
            }
        }
        this._updateSparks(dt);

        // Speed lines at high velocity
        if (speed > 12) {
            const sp = this.speedLines.geometry.attributes.position.array;
            for (let i = 0; i < sp.length/3; i++) {
                sp[i*3] = this.player.position.x + (Math.random()-0.5) * 2;
                sp[i*3+1] = this.player.position.y + this.player.currentHeight * 0.5 + (Math.random()-0.5) * 2;
                sp[i*3+2] = this.player.position.z + (Math.random()-0.5) * 2;
            }
            this.speedLines.geometry.attributes.position.needsUpdate = true;
            this.speedLines.material.opacity = Math.min(0.6, (speed - 12) / 8);
        } else {
            this.speedLines.material.opacity = 0;
        }
    }

    _emitSparks(count) {
        const sp = this.sparkParticles.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * (sp.length / 3));
            sp[idx*3] = this.player.position.x + (Math.random()-0.5) * 0.5;
            sp[idx*3+1] = this.player.position.y + (Math.random()-0.5) * 0.5;
            sp[idx*3+2] = this.player.position.z + (Math.random()-0.5) * 0.5;
        }
        this.sparkParticles.geometry.attributes.position.needsUpdate = true;
        this.sparkParticles.material.opacity = 1;
    }

    _updateSparks(dt) {
        this.sparkParticles.material.opacity = Math.max(0, this.sparkParticles.material.opacity - dt * 3);
    }

    // Explosion effect
    explosion(position, color = 0xffaa00, count = 20) {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];
        for (let i = 0; i < count; i++) {
            positions[i*3] = position.x;
            positions[i*3+1] = position.y;
            positions[i*3+2] = position.z;
            velocities.push(new THREE.Vector3(
                (Math.random()-0.5) * 10,
                Math.random() * 8,
                (Math.random()-0.5) * 10
            ));
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color, size: 0.1, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
        const points = new THREE.Points(geo, mat);
        this.scene.add(points);
        let life = 0.8;
        const anim = () => {
            life -= 0.016;
            const pos = points.geometry.attributes.position.array;
            for (let i = 0; i < count; i++) {
                pos[i*3] += velocities[i].x * 0.016;
                pos[i*3+1] += velocities[i].y * 0.016;
                pos[i*3+2] += velocities[i].z * 0.016;
                velocities[i].y -= 9.8 * 0.016;
            }
            points.geometry.attributes.position.needsUpdate = true;
            mat.opacity = Math.max(0, life);
            if (life > 0) requestAnimationFrame(anim);
            else { this.scene.remove(points); geo.dispose(); mat.dispose(); }
        };
        anim();
    }
}
