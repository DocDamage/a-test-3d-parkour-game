import * as THREE from 'three';

export class LensFlare {
    constructor(scene) {
        this.scene = scene;
        this.flares = [];
    }

    addFlare(position, color = 0xffaa00, size = 2) {
        const group = new THREE.Group();
        group.position.copy(position);

        // Main glow
        const glowGeo = new THREE.PlaneGeometry(size * 2, size * 2);
        const glowMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.lookAt(0, 0, 1);
        group.add(glow);

        // Rings
        const ringGeo = new THREE.RingGeometry(size * 0.3, size * 0.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        group.add(ring);

        // Secondary spots
        for (let i = 0; i < 3; i++) {
            const spotGeo = new THREE.CircleGeometry(size * (0.1 + i * 0.05), 16);
            const spotMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.2 - i * 0.05,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const spot = new THREE.Mesh(spotGeo, spotMat);
            spot.position.x = (i + 1) * size * 0.8;
            spot.scale.setScalar(1 - i * 0.2);
            group.add(spot);
        }

        this.scene.add(group);
        this.flares.push({ group, glow, ring, spots: group.children.slice(2), baseSize: size });
    }

    update(dt, camera) {
        for (const flare of this.flares) {
            // Face camera
            flare.group.lookAt(camera.position);
            
            // Pulsate
            const t = Date.now() * 0.001;
            const pulse = 1 + Math.sin(t * 2) * 0.1;
            flare.glow.scale.setScalar(pulse);
            flare.ring.scale.setScalar(pulse * 0.8);
            
            // Animate secondary spots
            for (let i = 0; i < flare.spots.length; i++) {
                flare.spots[i].position.x = (i + 1) * flare.baseSize * 0.8 * pulse;
            }
        }
    }
}
