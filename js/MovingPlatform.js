import * as THREE from 'three';

/**
 * MovingPlatform - Interactive platform that carries the player.
 * Types: 'elevator', 'shuttle', 'circular', 'pendulum'
 */
export class MovingPlatform {
    constructor(scene, type, config = {}) {
        this.scene = scene;
        this.type = type;
        this.config = {
            width: 2.5,
            depth: 2.5,
            height: 0.4,
            color: 0x8899aa,
            speed: 1.5,
            x: 0,
            y: 1,
            z: 0,
            ...config
        };

        this.mesh = this.createMesh();
        this.scene.add(this.mesh);

        // Randomize start phase so platforms don't all move in sync
        this.time = Math.random() * Math.PI * 2;
        this.currentVelocity = new THREE.Vector3();
        this.lastPosition = new THREE.Vector3();

        this.startPos = new THREE.Vector3(this.config.x, this.config.y, this.config.z);
        this.mesh.position.copy(this.startPos);
        this.lastPosition.copy(this.startPos);
    }

    createMesh() {
        const geo = new THREE.BoxGeometry(this.config.width, this.config.height, this.config.depth);
        const mat = new THREE.MeshStandardMaterial({
            color: this.config.color,
            roughness: 0.5,
            metalness: 0.4
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Tag for collision logic
        mesh.userData.isMovingPlatform = true;
        mesh.userData.platform = this;
        mesh.userData.size = {
            x: this.config.width,
            y: this.config.height,
            z: this.config.depth
        };
        return mesh;
    }

    /** Update platform position and compute current velocity. */
    update(dt) {
        this.lastPosition.copy(this.mesh.position);
        this.time += dt * this.config.speed;

        switch (this.type) {
            case 'elevator':
                this.updateElevator();
                break;
            case 'shuttle':
                this.updateShuttle();
                break;
            case 'circular':
                this.updateCircular();
                break;
            case 'pendulum':
                this.updatePendulum();
                break;
        }

        // Derive velocity from frame delta
        const safeDt = Math.max(dt, 0.001);
        this.currentVelocity.subVectors(this.mesh.position, this.lastPosition).divideScalar(safeDt);
    }

    /** Oscillate vertically between minY and maxY. */
    updateElevator() {
        const minY = this.config.minY ?? (this.config.y - 2);
        const maxY = this.config.maxY ?? (this.config.y + 2);
        const offset = (minY + maxY) / 2;
        const amplitude = (maxY - minY) / 2;
        this.mesh.position.y = offset + Math.sin(this.time) * amplitude;
    }

    /** Move back/forth along a single axis. */
    updateShuttle() {
        const axis = this.config.axis || 'x';
        const min = this.config.min ?? -3;
        const max = this.config.max ?? 3;
        const offset = (min + max) / 2;
        const amplitude = (max - min) / 2;
        this.mesh.position[axis] = this.startPos[axis] + offset + Math.sin(this.time) * amplitude;
    }

    /** Orbit in a circle on the XZ plane. */
    updateCircular() {
        const radius = this.config.radius ?? 3;
        this.mesh.position.x = this.startPos.x + Math.cos(this.time) * radius;
        this.mesh.position.z = this.startPos.z + Math.sin(this.time) * radius;
    }

    /**
     * Swing like a pendulum.
     * Pivot is at startPos; platform hangs below and arcs.
     */
    updatePendulum() {
        const swingAngle = this.config.swingAngle ?? Math.PI / 6;
        const armLength = this.config.armLength ?? 3;
        const axis = this.config.axis || 'z';
        const angle = Math.sin(this.time) * swingAngle;

        if (axis === 'z') {
            // Swing in XY plane (rotate around Z)
            this.mesh.position.x = this.startPos.x + Math.sin(angle) * armLength;
            this.mesh.position.y = this.startPos.y - Math.cos(angle) * armLength;
            this.mesh.rotation.z = angle;
        } else {
            // Swing in ZY plane (rotate around X)
            this.mesh.position.z = this.startPos.z + Math.sin(angle) * armLength;
            this.mesh.position.y = this.startPos.y - Math.cos(angle) * armLength;
            this.mesh.rotation.x = -angle;
        }
    }

    /** World-space Y of the platform's top surface. */
    getTopY() {
        return this.mesh.position.y + this.config.height / 2;
    }

    /** Check if a point (x,z) is within the platform's horizontal bounds. */
    containsPointXZ(x, z) {
        const hw = this.config.width / 2;
        const hd = this.config.depth / 2;
        const dx = Math.abs(x - this.mesh.position.x);
        const dz = Math.abs(z - this.mesh.position.z);
        return dx < hw && dz < hd;
    }
}
