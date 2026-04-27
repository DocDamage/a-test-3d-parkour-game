/**
 * Flamethrower — cone fire DOT, ignites surfaces, overheating.
 */

import * as THREE from 'three';

export class Flamethrower {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.name = 'Flamethrower';
        this.type = 'heavy';
        this.slot = 3;
        this.damage = 8; // per tick
        this.tickRate = 10; // ticks per second
        this.range = 8;
        this.heat = 0;
        this.maxHeat = 100;
        this.cooling = 20; // per second
        this.overheated = false;
        this.firing = false;
        this.mesh = this._buildMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }
    _buildMesh() {
        const g = new THREE.Group();
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0xaa3300 }));
        tank.rotation.x = Math.PI / 2; tank.position.z = -0.2;
        g.add(tank);
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 }));
        nozzle.rotation.x = Math.PI / 2; nozzle.position.z = 0.15;
        g.add(nozzle);
        return g;
    }
    update(dt) {
        if (this.firing && !this.overheated) {
            this.heat += 30 * dt;
            if (this.heat >= this.maxHeat) { this.overheated = true; this.firing = false; }
        } else {
            this.heat = Math.max(0, this.heat - this.cooling * dt);
            if (this.heat <= 20) this.overheated = false;
        }
        if (this.mesh.visible && this.player) { const off = new THREE.Vector3(0.25, -0.05, -0.3).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.facing || 0); this.mesh.position.copy(this.player.position).add(off); this.mesh.rotation.y = this.player.facing || 0; }
    }
    startFire() { if (!this.overheated) this.firing = true; }
    stopFire() { this.firing = false; }
    canFire() { return this.firing && !this.overheated; }
    fire(origin, direction) {
        if (!this.canFire()) return null;
        return { type: 'flame', damage: this.damage, range: this.range, tickRate: this.tickRate, origin: origin.clone(), direction: direction.clone(), damageType: 'energy' };
    }
    reload() { this.heat = 0; this.overheated = false; return true; }
    setVisible(v) { this.mesh.visible = v; }
}
