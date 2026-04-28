/**
 * ShockHammer — slow heavy melee with ground slam AOE shockwave.
 * Aerial slam creates a larger radius impact. Shocks enemies (stun + chain lightning).
 */

import * as THREE from 'three';

export class ShockHammer {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Shock Hammer';
        this.type = 'melee';
        this.slot = 1;
        this.id = 'shock_hammer';

        this.damage = 45;
        this.slamDamage = 30;
        this.range = 2.8;
        this.slamRadius = 4;
        this.aerialSlamRadius = 7;
        this.attackSpeed = 0.9;
        this.cooldown = 0;
        this.chargeTime = 0;
        this.isCharging = false;

        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const g = new THREE.Group();
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8),
            new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 })
        );
        handle.rotation.x = Math.PI / 2;
        handle.position.z = -0.35;
        g.add(handle);
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.18, 0.25),
            new THREE.MeshStandardMaterial({ color: 0x4444aa, metalness: 0.6, emissive: 0x2222ff, emissiveIntensity: 0.2 })
        );
        head.position.z = 0.15;
        g.add(head);
        const coil = new THREE.Mesh(
            new THREE.TorusGeometry(0.06, 0.01, 8, 12),
            new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x88ccff, emissiveIntensity: 0.6 })
        );
        coil.position.set(0, 0.1, 0.15);
        g.add(coil);
        return g;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.isCharging) this.chargeTime += dt;
        if (this.player && this.mesh.visible) {
            const pos = this.player.position.clone();
            pos.y += this.player.currentHeight * 0.5;
            this.mesh.position.copy(pos);
            this.mesh.rotation.y = this.player.facing || 0;
        }
    }

    canFire() { return this.cooldown <= 0; }

    fire(origin, direction) {
        if (!this.canFire()) return null;
        this.cooldown = 1 / this.attackSpeed;
        const isSlam = this.chargeTime >= 0.7;
        const isAerial = isSlam && this.player && !this.player.grounded;
        const dmg = isSlam ? this.slamDamage : this.damage;
        const radius = isAerial ? this.aerialSlamRadius : (isSlam ? this.slamRadius : this.range);
        this.chargeTime = 0;
        this.isCharging = false;
        return {
            type: isSlam ? 'ground_slam' : 'melee',
            damage: dmg,
            range: radius,
            origin: origin.clone(),
            direction: direction.clone(),
            isSlam,
            isAerial,
            shock: true,
            shockChain: 2,
        };
    }

    startCharge() { this.isCharging = true; }
    releaseCharge() { this.isCharging = false; }
    reload() { return false; }
    setVisible(v) { this.mesh.visible = v; }
}
