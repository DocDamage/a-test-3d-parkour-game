import * as THREE from 'three';

/**
 * GodRays - Volumetric light shafts and floating dust particles.
 *
 * Creates 4 skylight shafts using custom cone shaders with additive blending,
 * plus 150 drifting dust motes that pick up colour from nearby point lights.
 * When the player walks through a shaft the local dust swirls.
 *
 * API:
 *   new GodRays(scene, player, world)
 *   .setTimeOfDay('day'|'night'|'neon')
 *   .update(dt)
 *   .dispose()
 */
export class GodRays {
    constructor(scene, player, world) {
        this.scene = scene;
        this.player = player;
        this.world = world;

        /** Current visual intensity (day=1.0, neon=0.25, night=0). */
        this.intensityMultiplier = 1.0;
        this.frame = 0;

        this.shafts = [];
        this.dustParticles = null;
        this.dustData = [];           // per-particle simulation state
        this.sceneLights = [];        // cached PointLights

        this.tempVec = new THREE.Vector3();

        this.createNoiseTexture();
        this.createSkylightShafts();
        this.createDustParticles();
        this.cacheSceneLights();
    }

    /* -------------------------------------------------------------
       Textures
       ------------------------------------------------------------- */
    createNoiseTexture() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(size, size);
        for (let i = 0; i < imgData.data.length; i += 4) {
            const v = Math.random() * 255;
            imgData.data[i] = v;
            imgData.data[i + 1] = v;
            imgData.data[i + 2] = v;
            imgData.data[i + 3] = v * 0.4;
        }
        ctx.putImageData(imgData, 0, 0);
        this.noiseTexture = new THREE.CanvasTexture(canvas);
        this.noiseTexture.wrapS = THREE.RepeatWrapping;
        this.noiseTexture.wrapT = THREE.RepeatWrapping;
    }

    /* -------------------------------------------------------------
       Light Shafts
       ------------------------------------------------------------- */
    createSkylightShafts() {
        // 4 warehouse skylights near the ceiling (walls are height 10)
        const origins = [
            new THREE.Vector3(0, 9.5, 0),
            new THREE.Vector3(20, 9.5, 15),
            new THREE.Vector3(-18, 9.5, -12),
            new THREE.Vector3(12, 9.5, -22),
        ];

        const height = 9.0;
        const radius = 2.5;
        // Cone apex at +Y by default; translate so apex sits at local origin
        const geo = new THREE.ConeGeometry(radius, height, 32, 1, true);
        geo.translate(0, -height / 2, 0);

        for (const pos of origins) {
            const mat = new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                uniforms: {
                    uTime: { value: 0 },
                    uIntensity: { value: 1.0 },
                    uNoiseTexture: { value: this.noiseTexture },
                    uColor: { value: new THREE.Color(0xffddaa) },
                },
                vertexShader: /* glsl */ `
                    varying vec2 vUv;
                    varying vec3 vWorldPos;
                    varying vec3 vLocalPos;
                    void main() {
                        vUv = uv;
                        vLocalPos = position;
                        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: /* glsl */ `
                    uniform float uTime;
                    uniform float uIntensity;
                    uniform sampler2D uNoiseTexture;
                    uniform vec3 uColor;
                    varying vec2 vUv;
                    varying vec3 vWorldPos;
                    varying vec3 vLocalPos;

                    void main() {
                        // Fade from centre axis
                        float radial = 1.0 - smoothstep(0.0, 0.8, length(vLocalPos.xz) / max(0.01, abs(vLocalPos.y)));

                        // Fade toward floor
                        float vertical = smoothstep(0.0, 1.0, 1.0 - (vWorldPos.y + 0.5) / 9.5);

                        // Subtle scrolling dust texture
                        vec2 noiseUv = vWorldPos.xz * 0.15 + vec2(0.0, uTime * 0.03);
                        float noise = texture2D(uNoiseTexture, noiseUv).r;

                        float alpha = radial * vertical * noise * 0.35 * uIntensity;
                        gl_FragColor = vec4(uColor, alpha);
                    }
                `,
            });

            const mesh = new THREE.Mesh(geo.clone(), mat);
            mesh.position.copy(pos);
            this.scene.add(mesh);

            this.shafts.push({
                mesh,
                mat,
                position: pos.clone(),
                radius,
                height,
                swirlStrength: 0.0,
            });
        }
    }

    /* -------------------------------------------------------------
       Floating Dust
       ------------------------------------------------------------- */
    createDustParticles() {
        const count = 150;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const c = new THREE.Color();

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = Math.random() * 8 + 0.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

            c.setHSL(0.1, 0.2, 0.5 + Math.random() * 0.5);
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;

            sizes[i] = 0.02 + Math.random() * 0.04;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const mat = new THREE.PointsMaterial({
            size: 0.04,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });

        this.dustParticles = new THREE.Points(geo, mat);
        this.scene.add(this.dustParticles);

        for (let i = 0; i < count; i++) {
            this.dustData.push({
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.05,
                    (Math.random() - 0.5) * 0.1
                ),
                basePos: new THREE.Vector3(
                    positions[i * 3],
                    positions[i * 3 + 1],
                    positions[i * 3 + 2]
                ),
            });
        }
    }

    cacheSceneLights() {
        this.sceneLights.length = 0;
        this.scene.traverse((obj) => {
            if (obj.isPointLight) this.sceneLights.push(obj);
        });
    }

    /* -------------------------------------------------------------
       Public API
       ------------------------------------------------------------- */
    setTimeOfDay(preset) {
        if (preset === 'day') this.intensityMultiplier = 1.0;
        else if (preset === 'neon') this.intensityMultiplier = 0.25;
        else if (preset === 'night') this.intensityMultiplier = 0.0;
    }

    update(dt) {
        const time = performance.now() * 0.001;
        this.frame++;

        // --- Shafts ---
        for (const shaft of this.shafts) {
            shaft.mat.uniforms.uTime.value = time;
            shaft.mat.uniforms.uIntensity.value = this.intensityMultiplier;

            const dx = this.player.position.x - shaft.position.x;
            const dz = this.player.position.z - shaft.position.z;
            const inShaft =
                (dx * dx + dz * dz) < (shaft.radius * shaft.radius) &&
                this.player.position.y < shaft.position.y &&
                this.player.position.y > shaft.position.y - shaft.height;

            shaft.swirlStrength = THREE.MathUtils.lerp(
                shaft.swirlStrength,
                inShaft ? 1.0 : 0.0,
                dt * 3.0
            );
        }

        // --- Dust ---
        const posAttr = this.dustParticles.geometry.attributes.position;
        const colAttr = this.dustParticles.geometry.attributes.color;
        const positions = posAttr.array;
        const colors = colAttr.array;
        const count = this.dustData.length;

        for (let i = 0; i < count; i++) {
            const data = this.dustData[i];
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;

            // Gentle ambient drift
            positions[ix] += data.velocity.x * dt;
            positions[iy] += data.velocity.y * dt;
            positions[iz] += data.velocity.z * dt;

            // Swirl when inside any active shaft
            let sx = 0, sy = 0, sz = 0;
            for (const shaft of this.shafts) {
                if (shaft.swirlStrength <= 0.01) continue;
                const dx = positions[ix] - shaft.position.x;
                const dz = positions[iz] - shaft.position.z;
                const dy = positions[iy] - (shaft.position.y - shaft.height * 0.5);
                const distSq = dx * dx + dz * dz + dy * dy;
                if (distSq < 20.0) {
                    const dist = Math.sqrt(distSq);
                    const strength = (1.0 - dist / 4.472) * shaft.swirlStrength * 0.5; // 4.472 ≈ sqrt(20)
                    sx += -dz * strength;
                    sz += dx * strength;
                    sy += Math.sin(time * 2 + positions[ix]) * strength * 0.3;
                }
            }
            positions[ix] += sx * dt;
            positions[iz] += sz * dt;
            positions[iy] += sy * dt;

            // Wrap bounds
            if (positions[iy] < 0.2) positions[iy] = 8.0;
            if (positions[iy] > 10) positions[iy] = 0.5;
            if (Math.abs(positions[ix]) > 40) positions[ix] *= -0.9;
            if (Math.abs(positions[iz]) > 40) positions[iz] *= -0.9;

            // Colour update: cheap per-particle lighting (distribute across frames)
            if ((this.frame + i) % 6 === 0 && this.sceneLights.length > 0) {
                const px = positions[ix];
                const py = positions[iy];
                const pz = positions[iz];
                let r = 0.8, g = 0.8, b = 0.7;
                for (const light of this.sceneLights) {
                    const dSq = this.tempVec.set(light.position.x, light.position.y, light.position.z).distanceToSquared(this.tempVec.set(px, py, pz));
                    const radiusSq = (light.distance * light.distance) || 400;
                    if (dSq < radiusSq) {
                        const falloff = 1.0 - dSq / radiusSq;
                        const intensity = light.intensity * falloff * 0.15;
                        r += (light.color.r - r) * intensity;
                        g += (light.color.g - g) * intensity;
                        b += (light.color.b - b) * intensity;
                    }
                }
                colors[ix] = r;
                colors[ix + 1] = g;
                colors[ix + 2] = b;
            }
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
    }

    dispose() {
        for (const shaft of this.shafts) {
            shaft.mesh.geometry.dispose();
            shaft.mat.dispose();
            this.scene.remove(shaft.mesh);
        }
        this.shafts = [];

        if (this.dustParticles) {
            this.dustParticles.geometry.dispose();
            this.dustParticles.material.dispose();
            this.scene.remove(this.dustParticles);
            this.dustParticles = null;
        }
        this.noiseTexture.dispose();
        this.sceneLights = [];
    }
}
