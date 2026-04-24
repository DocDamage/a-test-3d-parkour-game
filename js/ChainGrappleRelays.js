import * as THREE from 'three';

export class ChainGrappleRelays {
    constructor(scene) {
        this.scene = scene;
        this.relays = [];
        this.triggered = new Set();
    }

    addRelay(position, radius = 1.5) {
        const group = new THREE.Group();
        group.position.copy(position);

        const ringGeo = new THREE.TorusGeometry(radius, 0.06, 8, 32);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        const innerGeo = new THREE.TorusGeometry(radius * 0.6, 0.03, 8, 24);
        const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        inner.rotation.x = Math.PI / 2;
        group.add(inner);

        const light = new THREE.PointLight(0x00ffff, 2, 8);
        group.add(light);

        this.scene.add(group);
        this.relays.push({ position, radius, group, ring, inner, light, active: true });
    }

    update(dt, player) {
        for (const relay of this.relays) {
            relay.ring.rotation.z += dt * 2;
            relay.inner.rotation.z -= dt * 3;
            const dist = player.position.distanceTo(relay.position);
            if (dist < relay.radius && relay.active && player.state.startsWith('GRAPPLE')) {
                // Trigger relay
                relay.active = false;
                player.grapplingHook.cooldownTimer = 0;
                const boostDir = player.velocity.clone().normalize();
                player.velocity.add(boostDir.multiplyScalar(6));
                player.velocity.y = Math.max(player.velocity.y, 4);
                this._spawnRipple(relay);
                if (player.audio && player.audio.playJump) player.audio.playJump();
                setTimeout(() => relay.active = true, 3000);
            }
        }
    }

    _spawnRipple(relay) {
        const ripple = new THREE.Mesh(
            new THREE.RingGeometry(relay.radius * 0.8, relay.radius * 1.2, 32),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
        );
        ripple.position.copy(relay.position);
        ripple.rotation.x = -Math.PI / 2;
        this.scene.add(ripple);
        let life = 0.5;
        const anim = () => {
            life -= 0.016;
            ripple.scale.multiplyScalar(1.08);
            ripple.material.opacity = Math.max(0, life * 1.6);
            if (life > 0) requestAnimationFrame(anim);
            else { this.scene.remove(ripple); ripple.geometry.dispose(); ripple.material.dispose(); }
        };
        anim();
    }
}
