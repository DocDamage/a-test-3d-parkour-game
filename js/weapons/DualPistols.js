/**
 * DualPistols — akimbo pistols with high fire-rate.
 * Dodge-roll firing: shooting while rolling grants i-frames and fans both guns.
 * Fan-the-hammer: rapid burst of 6 shots with high spread.
 */

import * as THREE from 'three';

export class DualPistols {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Dual Pistols';
        this.type = 'sidearm';
        this.slot = 2;
        this.id = 'dual_pistols';

        this.damage = 10;
        this.range = 22;
        this.attackSpeed = 7;
        this.cooldown = 0;
        this.clipSize = 24;
        this.ammo = this.clipSize;
        this.reloadTime = 1.6;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.spread = 0.08;
        this.fanSpread = 0.22;
        this.fanShots = 6;
        this.fanCooldown = 0.05;

        this.leftMesh = this._buildMesh(-0.12);
        this.rightMesh = this._buildMesh(0.12);
        this.leftMesh.visible = false;
        this.rightMesh.visible = false;
        this.scene.add(this.leftMesh);
        this.scene.add(this.rightMesh);
    }

    _buildMesh(xOff) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.1, 0.22),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5 })
        );
        g.add(body);
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.18;
        g.add(barrel);
        g.userData.xOff = xOff;
        return g;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.ammo = this.clipSize;
                this.isReloading = false;
            }
        }
        if (this.player && this.leftMesh.visible) {
            const base = this.player.position.clone();
            base.y += this.player.currentHeight * 0.5;
            const facing = this.player.facing || 0;
            [this.leftMesh, this.rightMesh].forEach(m => {
                const off = new THREE.Vector3(m.userData.xOff, -0.05, -0.25).applyAxisAngle(new THREE.Vector3(0,1,0), facing);
                m.position.copy(base).add(off);
                m.rotation.y = facing;
            });
        }
    }

    canFire() { return this.cooldown <= 0 && !this.isReloading && this.ammo > 0; }

    fire(origin, direction, isFan = false) {
        if (!this.canFire()) { if (this.ammo <= 0 && !this.isReloading) this.reload(); return null; }
        const isRoll = this.player && this.player.state === 'ROLL';
        const shots = isFan ? Math.min(this.fanShots, this.ammo) : 1;
        const results = [];
        for (let i = 0; i < shots; i++) {
            this.cooldown = isFan ? this.fanCooldown : (1 / this.attackSpeed);
            this.ammo--;
            const s = isFan || isRoll ? this.fanSpread : this.spread;
            const dir = direction.clone();
            dir.x += (Math.random() - 0.5) * s;
            dir.z += (Math.random() - 0.5) * s;
            dir.normalize();
            results.push({
                type: 'projectile',
                damage: this.damage,
                range: this.range,
                speed: 55,
                origin: origin.clone(),
                direction: dir,
                damageType: 'kinetic',
                isRollFire: isRoll,
                isFan,
            });
        }
        return isFan ? { type: 'burst', shots: results } : results[0];
    }

    fanTheHammer(origin, direction) {
        return this.fire(origin, direction, true);
    }

    reload() {
        if (this.isReloading || this.ammo === this.clipSize) return false;
        this.isReloading = true;
        this.reloadTimer = this.reloadTime;
        return true;
    }
    setVisible(v) {
        this.leftMesh.visible = v;
        this.rightMesh.visible = v;
    }
}
