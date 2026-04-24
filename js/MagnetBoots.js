import * as THREE from 'three';

export class MagnetBoots {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.active = false;
        this.magnetRange = 1.8;
        this.detachCooldown = 0;
        this.ceilingNormal = new THREE.Vector3(0, -1, 0);
        this._createFX();
    }

    _createFX() {
        const geo = new THREE.ConeGeometry(0.1, 0.3, 8);
        geo.rotateX(Math.PI);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
        this.fxMesh = new THREE.Mesh(geo, mat);
        this.fxMesh.visible = false;
        this.scene.add(this.fxMesh);
    }

    update(dt, input) {
        this.detachCooldown = Math.max(0, this.detachCooldown - dt);

        if (this.active) {
            // Check if still under ceiling
            if (!input.isPressed('ControlLeft') && !input.isPressed('ControlRight')) {
                this._detach();
                return;
            }
            if (!this._checkCeiling()) {
                this._detach();
                return;
            }
            // Upside-down gravity and movement
            this.player.velocity.y = 0;
            const moveDir = this.player.getMoveDir(input, this.player.facing);
            const targetSpeed = this.player.SPEED_WALK * (input.isPressed('ShiftLeft') ? 1.8 : 1.0);
            this.player.velocity.x = moveDir.x * targetSpeed;
            this.player.velocity.z = moveDir.z * targetSpeed;
            this.player.mesh.rotation.z = Math.PI; // upside down
            this.player.mesh.position.y = this.player.position.y + this.player.currentHeight;
            this.fxMesh.position.copy(this.player.position).add(new THREE.Vector3(0, this.player.currentHeight + 0.2, 0));
            this.fxMesh.visible = true;
            return;
        }

        // Try to attach
        if ((input.isPressed('ControlLeft') || input.isPressed('ControlRight')) && this.detachCooldown <= 0) {
            const ceiling = this._checkCeiling();
            if (ceiling && (this.player.state === 'JUMP' || this.player.state === 'FALL')) {
                this._attach(ceiling);
            }
        }

        if (!this.active) {
            this.fxMesh.visible = false;
            this.player.mesh.rotation.z = THREE.MathUtils.lerp(this.player.mesh.rotation.z, 0, dt * 10);
        }
    }

    _checkCeiling() {
        const origin = this.player.position.clone().add(new THREE.Vector3(0, this.player.currentHeight + 0.1, 0));
        const ray = new THREE.Ray(origin, new THREE.Vector3(0, 1, 0));
        for (const obj of this.world.collidables) {
            const box = new THREE.Box3().setFromObject(obj);
            const hit = new THREE.Vector3();
            if (ray.intersectBox(box, hit) !== null) {
                const dist = hit.y - origin.y;
                if (dist >= 0 && dist < this.magnetRange) {
                    return { y: hit.y, object: obj };
                }
            }
        }
        return null;
    }

    _attach(ceiling) {
        this.active = true;
        this.player.state = 'HANG';
        this.player.position.y = ceiling.y - this.player.currentHeight - 0.05;
        this.player.velocity.set(0, 0, 0);
        if (this.player.audio && this.player.audio.playClimbGrab) this.player.audio.playClimbGrab();
    }

    _detach() {
        if (!this.active) return;
        this.active = false;
        this.detachCooldown = 0.3;
        this.player.state = 'FALL';
        this.player.velocity.y = -2;
        this.player.mesh.rotation.z = 0;
    }
}
