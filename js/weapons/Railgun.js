/**
 * Railgun — charge-up hitscan weapon. Penetrates multiple enemies.
 * Charging while wallrunning grants overcharge (3× penetration, +50% damage).
 */

import * as THREE from 'three';

export class Railgun {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Railgun';
        this.type = 'primary';
        this.slot = 3;
        this.id = 'railgun';

        this.damage = 80;
        this.chargeDamage = 120;
        this.range = 60;
        this.attackSpeed = 0.6;
        this.cooldown = 0;
        this.clipSize = 4;
        this.ammo = this.clipSize;
        this.reloadTime = 2.5;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.chargeTime = 0;
        this.isCharging = false;
        this.penetration = 3;
        this.overchargePenetration = 6;

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const g = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.18, 0.7),
            new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.6 })
        );
        g.add(body);
        const rails = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.04, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 0.5 })
        );
        rails.position.set(0, 0.06, 0.1);
        g.add(rails);
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.48;
        g.add(barrel);
        return g;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isCharging) this.chargeTime += dt;
        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.ammo = this.clipSize;
                this.isReloading = false;
            }
        }
        if (this.mesh.visible && this.player) {
            const off = new THREE.Vector3(0.3, -0.08, -0.4).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0);
            this.mesh.position.copy(this.player.position).add(off);
            this.mesh.rotation.y = this.player.facing || 0;
        }
    }

    canFire() {
        return this.cooldown <= 0 && !this.isReloading && this.ammo > 0;
    }

    startCharge() { if (!this.isReloading && this.ammo > 0) this.isCharging = true; }
    releaseCharge() {
        if (!this.isCharging) return null;
        const result = this.fire(this.player.position.clone().add(new THREE.Vector3(0,1.4,0)),
            new THREE.Vector3(Math.sin(this.player.facing||0), 0, Math.cos(this.player.facing||0)));
        this.isCharging = false;
        return result;
    }

    fire(origin, direction) {
        if (!this.canFire()) { if (this.ammo <= 0 && !this.isReloading) this.reload(); return null; }
        this.cooldown = 1 / this.attackSpeed;
        this.ammo--;
        const isOvercharge = this.chargeTime >= 1.2 && this.player && this.player.state === 'WALLRUN';
        const dmg = isOvercharge ? this.chargeDamage * 1.5 : (this.chargeTime >= 0.8 ? this.chargeDamage : this.damage);
        const pen = isOvercharge ? this.overchargePenetration : this.penetration;
        this.chargeTime = 0;
        return {
            type: 'hitscan',
            damage: dmg,
            range: this.range,
            origin: origin.clone(),
            direction: direction.clone(),
            penetration: pen,
            damageType: 'kinetic',
            isOvercharge,
        };
    }

    reload() {
        if (this.isReloading || this.ammo === this.clipSize) return false;
        this.isReloading = true;
        this.reloadTimer = this.reloadTime;
        this.isCharging = false;
        this.chargeTime = 0;
        return true;
    }
    setVisible(v) { this.mesh.visible = v; }
}
