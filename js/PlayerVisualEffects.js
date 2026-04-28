import * as THREE from 'three';

export function createBunnyHopFlashMesh(player) {
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.15),
        new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthTest: false
        })
    );
    mesh.position.set(0, 2.0, 0.35);
    mesh.renderOrder = 100;
    mesh.visible = false;
    player.mesh.add(mesh);
    return mesh;
}

export function createScreenGlowMesh(player) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 30, 128, 128, 180);
    grad.addColorStop(0, 'rgba(0, 255, 255, 0)');
    grad.addColorStop(1, 'rgba(0, 255, 255, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 4),
        new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(canvas),
            transparent: true,
            opacity: 0,
            depthTest: false,
            side: THREE.DoubleSide
        })
    );
    mesh.renderOrder = 999;
    mesh.visible = false;
    player.scene.add(mesh);
    return mesh;
}

export function createTrailMeshes(player) {
    const meshes = [];
    for (let i = 0; i < 16; i++) {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.06 + i * 0.005, 4, 4),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0 })
        );
        mesh.visible = false;
        player.scene.add(mesh);
        meshes.push(mesh);
    }
    return meshes;
}

export function updateTrail(player, dt) {
    const active = !player.isDead && (player.velocity.lengthSq() > 16 || ['SPRINT', 'DASH', 'GRIND', 'WALLRUN'].includes(player.state));
    if (active) {
        const p = player.position.clone();
        p.y += 0.8;
        player.trailHistory.unshift(p);
    }
    player.trailHistory.length = Math.min(player.trailHistory.length, player.trailMeshes.length);
    player.trailMeshes.forEach((m, i) => {
        const p = player.trailHistory[i];
        m.visible = !!p;
        if (p) {
            m.position.copy(p);
            m.material.opacity = (1 - i / player.trailMeshes.length) * 0.32;
        }
    });
}

export function updateScreenGlow(player) {
    const cfg = player.comboSystem.getVisualConfig();
    const color = player.comboSystem.isBreakFlashActive() ? 0xff2244 : cfg.screenGlowColor;
    player.screenGlowMesh.visible = !!color;
    player.screenGlowMesh.material.opacity = color ? 0.35 : 0;
    if (!color) return;
    player.screenGlowMesh.material.color.setHex(color);
    player.screenGlowMesh.position.copy(player.position).add(new THREE.Vector3(0, 1.2, 0));
    player.screenGlowMesh.lookAt(player.camera.position);
}
