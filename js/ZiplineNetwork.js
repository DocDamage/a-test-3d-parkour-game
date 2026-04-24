import * as THREE from 'three';

export class ZiplineNetwork {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.ziplines = [];
        this.playerOnZipline = null;
        this.t = 0;
        this.speed = 0;
        this.maxSpeed = 18;
        this.accel = 8;
        this.grabRadius = 1.2;
        this.releaseBoost = 1.3;
    }

    addZipline(start, end) {
        const dir = new THREE.Vector3().subVectors(end, start);
        const len = dir.length();
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const cable = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, len, 8),
            new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff4400, emissiveIntensity: 2, metalness: 0.8, roughness: 0.2 })
        );
        cable.position.copy(mid);
        cable.lookAt(end);
        cable.rotateX(Math.PI / 2);
        cable.castShadow = true;
        this.scene.add(cable);

        const glow = new THREE.PointLight(0xff6600, 2, 6);
        glow.position.copy(mid);
        this.scene.add(glow);

        // Anchor rings
        const ringGeo = new THREE.TorusGeometry(0.25, 0.04, 8, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const startRing = new THREE.Mesh(ringGeo, ringMat);
        startRing.position.copy(start);
        startRing.lookAt(end);
        this.scene.add(startRing);
        const endRing = new THREE.Mesh(ringGeo, ringMat);
        endRing.position.copy(end);
        endRing.lookAt(start);
        this.scene.add(endRing);

        this.ziplines.push({ start, end, len, dir: dir.normalize(), cable, glow, startRing, endRing });
    }

    update(dt, player, input) {
        // If on zipline, slide
        if (this.playerOnZipline) {
            const zip = this.playerOnZipline;
            this.speed = Math.min(this.speed + this.accel * dt, this.maxSpeed);
            this.t += (this.speed / zip.len) * dt;
            const pos = new THREE.Vector3().lerpVectors(zip.start, zip.end, Math.min(this.t, 1));
            player.position.copy(pos);
            player.position.y -= 0.8; // hang below cable
            player.velocity.set(0, 0, 0);
            player.state = 'HANG';

            if (this.t >= 1 || input.wasPressed('Space') || input.wasPressed('KeyE')) {
                this.release(player, zip);
            }
            return;
        }

        // Check for grab
        if (input.wasPressed('Space') && (player.state === 'JUMP' || player.state === 'FALL')) {
            for (const zip of this.ziplines) {
                const closest = this.closestPointOnSegment(player.position, zip.start, zip.end);
                const dist = player.position.distanceTo(closest);
                if (dist < this.grabRadius) {
                    this.playerOnZipline = zip;
                    this.t = this.projectOnSegment(closest, zip.start, zip.end);
                    this.speed = Math.max(5, new THREE.Vector3(player.velocity.x, 0, player.velocity.z).length());
                    if (this.t > 0.5) this.speed *= 0.7; // slow if grabbing from far end
                    break;
                }
            }
        }
    }

    release(player, zip) {
        const releaseDir = zip.dir.clone();
        if (this.t > 0.5) releaseDir.negate();
        player.velocity.set(releaseDir.x * this.speed * this.releaseBoost, 3, releaseDir.z * this.speed * this.releaseBoost);
        player.state = 'JUMP';
        this.playerOnZipline = null;
        this.speed = 0;
        this.t = 0;
    }

    closestPointOnSegment(p, a, b) {
        const ab = new THREE.Vector3().subVectors(b, a);
        const t = Math.max(0, Math.min(1, new THREE.Vector3().subVectors(p, a).dot(ab) / ab.lengthSq()));
        return new THREE.Vector3().copy(a).add(ab.multiplyScalar(t));
    }

    projectOnSegment(p, a, b) {
        const ab = new THREE.Vector3().subVectors(b, a);
        return Math.max(0, Math.min(1, new THREE.Vector3().subVectors(p, a).dot(ab) / ab.lengthSq()));
    }
}
