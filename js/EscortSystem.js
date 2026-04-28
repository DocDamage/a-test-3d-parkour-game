import * as THREE from 'three';

export class EscortSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.active = false;
        this.destination = null;
        this.health = 100;
        this.mesh = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.25, 1.0, 4, 8),
            new THREE.MeshStandardMaterial({ color: 0x44ffaa, emissive: 0x116644, emissiveIntensity: 0.4 })
        );
        this.mesh.visible = false;
        scene.add(this.mesh);
    }

    start(destination) {
        this.destination = destination.clone();
        this.mesh.position.copy(this.player.position).add(new THREE.Vector3(1.5, 0.5, 0));
        this.health = 100;
        this.active = true;
        this.mesh.visible = true;
    }

    update(dt) {
        if (!this.active) return;
        const follow = this.player.position.clone().add(new THREE.Vector3(-1.2, 0.5, -1.2));
        const toFollow = follow.sub(this.mesh.position);
        if (toFollow.length() > 0.1) this.mesh.position.addScaledVector(toFollow.normalize(), 2.4 * dt);

        if (this.destination && this.mesh.position.distanceTo(this.destination) < 2) {
            this.complete();
        }
        if (this.health <= 0) this.fail();
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }

    complete() {
        this.active = false;
        this.mesh.visible = false;
        if (this.onComplete) this.onComplete();
    }

    fail() {
        this.active = false;
        this.mesh.visible = false;
        if (this.onFail) this.onFail();
    }
}
