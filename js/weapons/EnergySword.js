/**
 * EnergySword — melee weapon that deflects projectiles.
 */

import * as THREE from 'three';

export class EnergySword {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Energy Sword';
        this.type = 'melee';
        this.slot = 0;
        this.damage = 35;
        this.range = 2.8;
        this.attackSpeed = 1.1;
        this.cooldown = 0;
        this._deflectWindow = 0;
        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }
    _buildMesh() {
        const g = new THREE.Group();
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
        hilt.rotation.x = Math.PI / 2; hilt.position.z = -0.15;
        g.add(hilt);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.6), new THREE.MeshStandardMaterial({ color: 0x00ffaa, emissive: 0x00ffaa, emissiveIntensity: 2 }));
        blade.position.z = 0.2;
        g.add(blade);
        return g;
    }
    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        this._deflectWindow = Math.max(0, this._deflectWindow - dt);
        if (this.mesh.visible && this.player) { const pos = this.player.position.clone(); pos.y += this.player.currentHeight * 0.5; this.mesh.position.copy(pos); this.mesh.rotation.y = this.player.facing || 0; }
    }
    canFire() { return this.cooldown <= 0; }
    fire(origin, direction) {
        if (!this.canFire()) return null;
        this.cooldown = 1 / this.attackSpeed;
        this._deflectWindow = 0.3;
        return { type: 'melee', damage: this.damage, range: this.range, shieldBreak: true, origin: origin.clone(), direction: direction.clone(), arcAngle: Math.PI / 2.5, stagger: 0.8, knockback: 5, deflectWindow: true };
    }
    isDeflecting() { return this._deflectWindow > 0; }
    reload() { return true; }
    setVisible(v) { this.mesh.visible = v; }
}
