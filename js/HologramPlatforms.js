import * as THREE from 'three';

export class HologramPlatforms {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.platforms = [];
    }

    addHologramZone(center, size, platformPositions) {
        // Neon zone floor marker
        const markerGeo = new THREE.PlaneGeometry(size, size);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.rotation.x = -Math.PI / 2;
        marker.position.copy(center);
        marker.position.y = 0.03;
        this.scene.add(marker);

        // Create hologram platforms
        for (const pos of platformPositions) {
            const geo = new THREE.BoxGeometry(1.5, 0.2, 1.5);
            const mat = new THREE.MeshStandardMaterial({
                color: 0xff00ff,
                emissive: 0xff00ff,
                emissiveIntensity: 0.2,
                transparent: true,
                opacity: 0.25,
                roughness: 0.1,
                metalness: 0.9
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(pos[0], pos[1], pos[2]);
            mesh.castShadow = false;
            mesh.receiveShadow = true;
            this.scene.add(mesh);

            const light = new THREE.PointLight(0xff00ff, 0.5, 4);
            light.position.set(pos[0], pos[1] + 0.5, pos[2]);
            this.scene.add(light);

            this.platforms.push({ mesh, light, basePos: new THREE.Vector3(pos[0], pos[1], pos[2]), solid: false, cooldown: 0 });
        }
    }

    update(dt, player) {
        const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.z ** 2);
        const shouldSolidify = speed > 8;

        for (const plat of this.platforms) {
            plat.cooldown = Math.max(0, plat.cooldown - dt);

            if (shouldSolidify && plat.cooldown <= 0) {
                if (!plat.solid) {
                    plat.solid = true;
                    plat.mesh.material.opacity = 0.85;
                    plat.mesh.material.emissiveIntensity = 1.5;
                    plat.light.intensity = 2;
                    // Add to world collidables temporarily
                    if (!this.world.collidables.includes(plat.mesh)) {
                        this.world.collidables.push(plat.mesh);
                        plat.mesh.userData.size = { x: 1.5, y: 0.2, z: 1.5 };
                    }
                }
            } else if (!shouldSolidify && plat.solid) {
                plat.solid = false;
                plat.cooldown = 0.5;
                plat.mesh.material.opacity = 0.25;
                plat.mesh.material.emissiveIntensity = 0.2;
                plat.light.intensity = 0.5;
                const idx = this.world.collidables.indexOf(plat.mesh);
                if (idx >= 0) this.world.collidables.splice(idx, 1);
            }

            // Float animation
            plat.mesh.position.y = plat.basePos.y + Math.sin(Date.now() * 0.001 + plat.basePos.x) * 0.05;
            plat.light.position.y = plat.mesh.position.y + 0.5;
        }
    }
}
