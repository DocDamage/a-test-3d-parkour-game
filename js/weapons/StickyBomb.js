/**
 * StickyBomb — throwable explosive gadget.
 * Sticks to surfaces or enemies, remote detonate or timed fuse.
 */

import * as THREE from 'three';

export class StickyBomb {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Sticky Bomb';
        this.type = 'throwable';
        this.slot = 4;

        this.damage = 120;
        this.blastRadius = 4;
        this.fuseTime = 3.0;
        this.attackSpeed = 0.8; // throws per second
        this.cooldown = 0;
        this.ammo = 3;
        this.maxAmmo = 3;
        this.reloadTime = 4.0;
        this.isReloading = false;
        this.reloadTimer = 0;

        this.activeBombs = [];
        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const group = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xcc3300 })
        );
        group.add(body);
        const light = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xff6600 })
        );
        light.position.y = 0.05;
        group.add(light);
        return group;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.ammo = this.maxAmmo;
                this.isReloading = false;
            }
        }
        if (this.mesh.visible && this.player) {
            const offset = new THREE.Vector3(0.15, -0.05, -0.2).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0);
            this.mesh.position.copy(this.player.position).add(offset);
        }

        // Update active bombs
        for (let i = this.activeBombs.length - 1; i >= 0; i--) {
            const bomb = this.activeBombs[i];
            if (!bomb.stuck) {
                bomb.velocity.y -= 9.8 * dt; // gravity
                bomb.mesh.position.addScaledVector(bomb.velocity, dt);
                // Ground collision
                if (bomb.mesh.position.y <= 0.06) {
                    bomb.mesh.position.y = 0.06;
                    bomb.stuck = true;
                    bomb.velocity.set(0, 0, 0);
                }
            }
            bomb.timer -= dt;
            // Blink faster as timer runs down
            const blinkRate = bomb.timer < 1.0 ? 0.1 : 0.3;
            bomb.mesh.children[1].visible = Math.floor(bomb.timer / blinkRate) % 2 === 0;

            if (bomb.timer <= 0 || bomb.detonateNow) {
                this._explode(bomb);
                this.scene.remove(bomb.mesh);
                this.activeBombs.splice(i, 1);
            }
        }
    }

    canFire() {
        return this.cooldown <= 0 && !this.isReloading && this.ammo > 0;
    }

    fire(origin, direction) {
        if (!this.canFire()) {
            if (this.ammo <= 0 && !this.isReloading) this.reload();
            return null;
        }
        this.cooldown = 1 / this.attackSpeed;
        this.ammo--;

        const bombMesh = this._buildMesh();
        bombMesh.position.copy(origin);
        bombMesh.scale.setScalar(1.5);
        this.scene.add(bombMesh);

        const velocity = direction.clone().multiplyScalar(12);
        velocity.y += 3; // arc

        this.activeBombs.push({
            mesh: bombMesh,
            velocity: velocity,
            timer: this.fuseTime,
            stuck: false,
            detonateNow: false,
            origin: origin.clone()
        });

        return { type: 'sticky_thrown' };
    }

    detonateAll() {
        for (const bomb of this.activeBombs) {
            bomb.detonateNow = true;
        }
    }

    _explode(bomb) {
        // Create explosion visual
        const expGeo = new THREE.SphereGeometry(this.blastRadius, 8, 8);
        const expMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.6 });
        const exp = new THREE.Mesh(expGeo, expMat);
        exp.position.copy(bomb.mesh.position);
        this.scene.add(exp);
        setTimeout(() => { this.scene.remove(exp); expGeo.dispose(); expMat.dispose(); }, 200);

        // Damage query handled by caller (main.js / WeaponSystem)
        if (this.onExplode) {
            this.onExplode({
                position: bomb.mesh.position.clone(),
                radius: this.blastRadius,
                damage: this.damage,
                type: 'explosive'
            });
        }
    }

    reload() {
        if (this.isReloading || this.ammo === this.maxAmmo) return false;
        this.isReloading = true;
        this.reloadTimer = this.reloadTime;
        return true;
    }

    setVisible(v) { this.mesh.visible = v; }
}
