import * as THREE from 'three';

export class StructuralCollapse {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.structuralObjects = [];
        this.debris = [];
    }

    markStructural(mesh, health = 1) {
        mesh.userData.structural = true;
        mesh.userData.structuralHealth = health;
        mesh.userData.originalColor = mesh.material.color.clone();
        this.structuralObjects.push(mesh);
    }

    update(dt, player) {
        // Check for wrecking ball hits on structural objects
        for (const wb of this.world.hazards.wreckingBalls) {
            const ballPos = wb.mesh.position.clone();
            for (const obj of this.structuralObjects) {
                if (!obj.userData.structural) continue;
                const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
                const center = new THREE.Vector3();
                box.getCenter(center);
                const dist = center.distanceTo(ballPos);
                if (dist < wb.radius + 1.5) {
                    this._fracture(obj);
                }
            }
        }

        // Check for player impact at high speed
        if (player.state !== 'RAGDOLL') {
            const impactSpeed = player.prevVelocity.length();
            if (impactSpeed > 12) {
                for (const obj of this.structuralObjects) {
                    if (!obj.userData.structural) continue;
                    const box = obj.userData.bbox || new THREE.Box3().setFromObject(obj);
                    const playerBox = new THREE.Box3(
                        new THREE.Vector3(player.position.x - player.RADIUS, player.position.y, player.position.z - player.RADIUS),
                        new THREE.Vector3(player.position.x + player.RADIUS, player.position.y + player.currentHeight, player.position.z + player.RADIUS)
                    );
                    if (playerBox.intersectsBox(box)) {
                        this._fracture(obj);
                        player.startRagdoll();
                    }
                }
            }
        }

        // Update debris physics
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const d = this.debris[i];
            d.velocity.y -= 28 * dt;
            d.mesh.position.add(d.velocity.clone().multiplyScalar(dt));
            d.mesh.rotation.x += d.angVel.x * dt;
            d.mesh.rotation.y += d.angVel.y * dt;
            d.mesh.rotation.z += d.angVel.z * dt;
            d.life -= dt;
            if (d.mesh.position.y < 0) {
                d.mesh.position.y = 0;
                d.velocity.y *= -0.3;
                d.velocity.x *= 0.8;
                d.velocity.z *= 0.8;
            }
            if (d.life <= 0) {
                this.scene.remove(d.mesh);
                d.mesh.geometry.dispose();
                d.mesh.material.dispose();
                this.debris.splice(i, 1);
            }
        }
    }

    _fracture(obj) {
        if (!obj.userData.structural) return;
        obj.userData.structural = false;

        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3().subVectors(box.max, box.min);
        const center = new THREE.Vector3().addVectors(box.max, box.min).multiplyScalar(0.5);

        // Remove from world
        const collIdx = this.world.collidables.indexOf(obj);
        if (collIdx >= 0) this.world.collidables.splice(collIdx, 1);
        const climbIdx = this.world.climbables.indexOf(obj);
        if (climbIdx >= 0) this.world.climbables.splice(climbIdx, 1);
        this.scene.remove(obj);

        // Spawn debris
        const pieces = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < pieces; i++) {
            const px = (Math.random() - 0.5) * size.x * 0.5;
            const py = (Math.random() - 0.5) * size.y * 0.5;
            const pz = (Math.random() - 0.5) * size.z * 0.5;
            const geo = new THREE.BoxGeometry(
                Math.max(0.2, size.x * (0.2 + Math.random() * 0.2)),
                Math.max(0.2, size.y * (0.2 + Math.random() * 0.2)),
                Math.max(0.2, size.z * (0.2 + Math.random() * 0.2))
            );
            const mat = new THREE.MeshStandardMaterial({
                color: obj.userData.originalColor || 0x888899,
                roughness: 0.9
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(center.x + px, center.y + py, center.z + pz);
            mesh.castShadow = true;
            this.scene.add(mesh);
            this.debris.push({
                mesh,
                velocity: new THREE.Vector3((Math.random()-0.5)*5, Math.random()*5, (Math.random()-0.5)*5),
                angVel: new THREE.Vector3(Math.random()*3, Math.random()*3, Math.random()*3),
                life: 10
            });
        }

        // Add to collidables as debris ramps
        for (const d of this.debris.slice(-pieces)) {
            this.world.collidables.push(d.mesh);
            d.mesh.userData.isRamp = true;
        }
    }
}
