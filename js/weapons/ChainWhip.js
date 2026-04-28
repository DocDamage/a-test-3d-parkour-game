/**
 * ChainWhip — mid-range melee that pulls enemies and can yank them off ledges.
 * Light: quick lash. Heavy: hook and pull (stuns target, brings them into melee range).
 */

import * as THREE from 'three';

export class ChainWhip {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Chain Whip';
        this.type = 'melee';
        this.slot = 1;
        this.id = 'chain_whip';

        this.damage = 16;
        this.pullDamage = 22;
        this.range = 5.5;
        this.attackSpeed = 1.3;
        this.cooldown = 0;
        this.isPulling = false;
        this.pullTarget = null;

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const g = new THREE.Group();
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.035, 0.35, 8),
            new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 })
        );
        handle.rotation.x = Math.PI / 2;
        handle.position.z = -0.2;
        g.add(handle);
        const links = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 1.0, 6),
            new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 })
        );
        links.rotation.x = Math.PI / 2;
        links.position.z = 0.4;
        g.add(links);
        const tip = new THREE.Mesh(
            new THREE.ConeGeometry(0.03, 0.08, 6),
            new THREE.MeshStandardMaterial({ color: 0x660000, metalness: 0.5 })
        );
        tip.rotation.x = -Math.PI / 2;
        tip.position.z = 0.95;
        g.add(tip);
        return g;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.pullTarget && this.player && this.mesh.visible) {
            const tPos = this.pullTarget.position || (this.pullTarget.mesh && this.pullTarget.mesh.position);
            if (tPos) {
                const dir = this.player.position.clone().sub(tPos).normalize();
                tPos.addScaledVector(dir, 8 * dt);
                if (tPos.distanceTo(this.player.position) < 1.5) {
                    this.pullTarget = null;
                    this.isPulling = false;
                }
            }
        }
        if (this.player && this.mesh.visible) {
            const pos = this.player.position.clone();
            pos.y += this.player.currentHeight * 0.5;
            this.mesh.position.copy(pos);
            this.mesh.rotation.y = this.player.facing || 0;
        }
    }

    canFire() { return this.cooldown <= 0 && !this.isPulling; }

    fire(origin, direction, isHeavy = false) {
        if (!this.canFire()) return null;
        this.cooldown = 1 / this.attackSpeed;
        if (isHeavy) {
            this.isPulling = true;
            return {
                type: 'melee',
                damage: this.pullDamage,
                range: this.range,
                origin: origin.clone(),
                direction: direction.clone(),
                isPull: true,
                onHit: (target) => { this.pullTarget = target; },
            };
        }
        return {
            type: 'melee',
            damage: this.damage,
            range: this.range,
            origin: origin.clone(),
            direction: direction.clone(),
        };
    }

    reload() { return false; }
    setVisible(v) { this.mesh.visible = v; }
}
