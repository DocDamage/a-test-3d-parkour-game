import * as THREE from 'three';

export class DroneTakedown {
    constructor(scene) {
        this.scene = scene;
        this.slowMoTimer = 0;
        this.slowMoDuration = 0.4;
        this.onKill = null;
    }

    update(dt, player, input, drones) {
        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= dt;
            return 0.2; // return time scale
        }

        if (player.state !== 'WALLRUN') return 1.0;
        if (!input.wasPressed('KeyF')) return 1.0;

        // Find nearest drone
        let nearest = null;
        let nearestDist = Infinity;
        for (const drone of drones) {
            const dist = player.position.distanceTo(drone.group.position);
            if (dist < nearestDist && dist < 3.0) {
                nearestDist = dist;
                nearest = drone;
            }
        }

        if (!nearest) return 1.0;

        // Execute takedown
        this._performTakedown(player, nearest);
        return 0.2;
    }

    _performTakedown(player, drone) {
        // Destroy drone visuals
        drone.group.traverse(c => {
            if (c.isMesh) {
                c.material = c.material.clone();
                c.material.emissive.setHex(0xff0000);
                c.material.emissiveIntensity = 3;
            }
        });

        // Explosion particles
        for (let i = 0; i < 12; i++) {
            const p = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.08, 0.08),
                new THREE.MeshBasicMaterial({ color: 0xffaa00 })
            );
            p.position.copy(drone.group.position);
            p.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8
            );
            this.scene.add(p);
            let life = 0.6;
            const anim = () => {
                life -= 0.016;
                p.position.add(p.userData.velocity.clone().multiplyScalar(0.016));
                p.userData.velocity.y -= 9.8 * 0.016;
                p.rotation.x += 0.1; p.rotation.y += 0.1;
                if (life > 0) requestAnimationFrame(anim);
                else { this.scene.remove(p); p.geometry.dispose(); p.material.dispose(); }
            };
            anim();
        }

        // Push player off wall with boost
        const away = new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing)).normalize();
        player.velocity.set(away.x * 10, 7, away.z * 10);
        player.state = 'JUMP';
        player.wallRunData = null;
        player.comboSystem.registerMove('airDash');
        player.comboSystem.flowMeter = Math.min(100, player.comboSystem.flowMeter + 25);

        // Disable drone
        drone.state = 'SEARCH';
        if (this.onKill) this.onKill(drone);
        drone.detection = 0;
        drone.group.visible = false;
        drone.spotLight.visible = false;
        drone.coneMesh.visible = false;
        setTimeout(() => {
            drone.group.visible = true;
            drone.spotLight.visible = true;
            drone.coneMesh.visible = true;
            drone.state = 'PATROL';
        }, 8000);

        this.slowMoTimer = this.slowMoDuration;
        if (player.cameraController) player.cameraController.shake(0.4, 0.3);
        if (player.audio && player.audio.playLand) player.audio.playLand(2);
    }
}
