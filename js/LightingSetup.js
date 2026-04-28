import * as THREE from 'three';
import { LensFlare } from './LensFlare.js';

export function setupLighting(scene, camera, postProcessing) {
    const ambient = new THREE.AmbientLight(0x404060, 0.35);
    scene.add(ambient);

    // Sky-to-ground gradient ambient: cool blue-purple sky, dark warm-brown ground
    const hemiLight = new THREE.HemisphereLight(0x1a2045, 0x200f05, 0.55);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xffaa55, 1.2);
    sun.position.set(25, 40, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x5577ff, 0.25);
    fill.position.set(-15, 10, -15);
    scene.add(fill);

    // Cool blue rim light from behind for depth and material separation
    const rim = new THREE.DirectionalLight(0x2244aa, 0.2);
    rim.position.set(-8, 3, -28);
    scene.add(rim);

    const pointLights = [];
    const lightDefs = [
        { pos: [15, 6, 12], color: 0xff6600, intensity: 3, dist: 25 },
        { pos: [-15, 6, -12], color: 0x0066ff, intensity: 3, dist: 25 },
        { pos: [0, 6, -20], color: 0xffcc00, intensity: 2, dist: 20 },
        { pos: [23, 3, 10], color: 0xff3333, intensity: 2, dist: 15 },
    ];

    lightDefs.forEach(l => {
        const pl = new THREE.PointLight(l.color, l.intensity, l.dist);
        pl.position.set(...l.pos);
        scene.add(pl);
        pointLights.push(pl);

        const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            new THREE.MeshBasicMaterial({ color: l.color })
        );
        orb.position.set(...l.pos);
        scene.add(orb);
    });

    const lensFlare = new LensFlare(scene, camera);
    postProcessing.registerLights(ambient, sun, fill, pointLights);
    lensFlare.addFlare(new THREE.Vector3(15, 6, 12), 0xff6600, 2.5);
    lensFlare.addFlare(new THREE.Vector3(-15, 6, -12), 0x0066ff, 2.5);
    lensFlare.addFlare(new THREE.Vector3(0, 6, -20), 0xffcc00, 2);
    lensFlare.addFlare(new THREE.Vector3(23, 3, 10), 0xff3333, 1.5);

    return { ambient, hemiLight, sun, fill, rim, pointLights, lensFlare };
}
