/**
 * Glaive — thrown curved blade that boomerangs back to the player.
 * Can bank shots off walls (richochet). Catching it on return resets cooldown instantly.
 */

import * as THREE from 'three';

export class Glaive {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Glaive';
        this.type = 'primary';
        this.slot = 3;
        this.id = 'glaive';

        this.damage = 35;
        this.range = 20;
        this.attackSpeed = 1.8;
        this.cooldown = 0;
        this.inFlight = false;
        this.flightTimer = 0;
        this.flightDuration = 0.8;
        this.bounces = 2;
        this.returnSpeed = 25;
        this.projectile = null;
        this.hits = new Set();

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const g = new THREE.Group();
        const blade = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.06, 0.35, 6),
            new THREE.MeshStandardMaterial({ color: 0x00ddaa, emissive: 0x00ddaa, emissiveIntensity: 0.3, metalness: 0.8 })
        );
        blade.rotation.x = Math.PI / 2;
        g.add(blade);
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.08, 0.012, 8, 16),
            new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.4 })
        );
        g.add(ring);
        return g;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.inFlight && this.projectile) {
            this.flightTimer += dt;
            this.projectile.mesh.rotation.z += 10 * dt;
            if (this.flightTimer >= this.flightDuration) {
                // Return to player
                const pPos = this.player.position.clone();
                pPos.y += 1.2;
                const dir = pPos.sub(this.projectile.mesh.position);
                const dist = dir.length();
                if (dist < 0.8) {
                    this._catch();
                } else {
                    dir.normalize();
                    this.projectile.mesh.position.addScaledVector(dir, this.returnSpeed * dt);
                }
            } else {
                // Outward arc
                this.projectile.mesh.position.addScaledVector(this.projectile.dir, 18 * dt);
            }
        }
        if (!this.inFlight && this.player && this.mesh.visible) {
            const off = new THREE.Vector3(0.28, -0.06, -0.36).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0);
            this.mesh.position.copy(this.player.position).add(off);
            this.mesh.rotation.y = this.player.facing || 0;
        }
    }

    canFire() { return this.cooldown <= 0 && !this.inFlight; }

    fire(origin, direction) {
        if (!this.canFire()) return null;
        this.inFlight = true;
        this.flightTimer = 0;
        this.hits.clear();
        const mesh = this.mesh.clone();
        mesh.visible = true;
        mesh.position.copy(origin);
        this.scene.add(mesh);
        this.projectile = { mesh, dir: direction.clone().normalize() };
        return {
            type: 'projectile',
            damage: this.damage,
            range: this.range,
            speed: 18,
            origin: origin.clone(),
            direction: direction.clone(),
            damageType: 'kinetic',
            bounces: this.bounces,
            boomerang: true,
        };
    }

    _catch() {
        this.inFlight = false;
        this.cooldown = 0;
        if (this.projectile) {
            this.scene.remove(this.projectile.mesh);
            this.projectile = null;
        }
    }

    onBounce() {
        if (this.projectile && this.bounces > 0) {
            this.bounces--;
            // Reverse direction roughly toward nearest enemy
            this.projectile.dir.negate();
        }
    }

    reload() { return false; }
    setVisible(v) { if (!this.inFlight) this.mesh.visible = v; }
}
