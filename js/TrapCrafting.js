import * as THREE from 'three';

export class TrapCrafting {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.costs = { proximity_mine: 10, tripwire: 8, emp_trap: 14 };
    }

    craft(type = 'proximity_mine') {
        const cost = this.costs[type] ?? this.costs.proximity_mine;
        if ((this.player._scrap || 0) < cost) return false;
        this.player._scrap -= cost;
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(type === 'tripwire' ? 1.2 : 0.3, 0.12, 0.3),
            new THREE.MeshBasicMaterial({ color: type === 'emp_trap' ? 0x00ccff : 0xff6600 })
        );
        mesh.position.copy(this.player.position);
        mesh.position.y = 0.12;
        this.scene.add(mesh);
        if (!this.world._proximityMines) this.world._proximityMines = [];
        this.world._proximityMines.push({
            mesh,
            type,
            exploded: false,
            damage: type === 'emp_trap' ? 20 : 45,
            disables: type === 'emp_trap'
        });
        return true;
    }
}
