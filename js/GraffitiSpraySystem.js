/**
 * GraffitiSpraySystem — active spray-paint tagging on walls.
 * Hold G to spray on facing wall. Paint resource limited. Style bonus for dynamic tags.
 * Integrates with TerritorySystem and TrickSystem.
 */

import * as THREE from 'three';

export class GraffitiSpraySystem {
    constructor(scene, player, world, territorySystem = null) {
        this.scene = scene;
        this.player = player;
        this.world = world;
        this.territorySystem = territorySystem;
        this.maxPaint = 100;
        this.paint = this.maxPaint;
        this.costPerTag = 5;
        this.sprayRange = 4;
        this.isSpraying = false;
        this.sprayCooldown = 0;
        this.tags = [];
        this._raycaster = new THREE.Raycaster();
        this._lastTagPos = new THREE.Vector3();
        this._tagCooldown = 0.5;
    }

    update(dt, player, input, world) {
        this.world = world || this.world;
        if (this.sprayCooldown > 0) this.sprayCooldown = Math.max(0, this.sprayCooldown - dt);

        if (input && input.isPressed('KeyG') && this.paint >= this.costPerTag && this.sprayCooldown <= 0) {
            this.isSpraying = true;
            if (this._tryPlaceTag()) {
                this.paint -= this.costPerTag;
                this.sprayCooldown = this._tagCooldown;
            }
        } else {
            this.isSpraying = false;
        }
    }

    _tryPlaceTag() {
        const origin = this.player.position.clone().add(new THREE.Vector3(0, 1.4, 0));
        const dir = new THREE.Vector3(Math.sin(this.player.facing || 0), 0, Math.cos(this.player.facing || 0));
        this._raycaster.set(origin, dir);

        const targets = this.world && this.world.collidables ? this.world.collidables : [];
        const hits = this._raycaster.intersectObjects(targets, false);
        if (hits.length === 0) return false;

        const hit = hits[0];
        const pos = hit.point.clone();
        // Prevent spam at same spot
        if (pos.distanceTo(this._lastTagPos) < 1.5) return false;
        this._lastTagPos.copy(pos);

        // Create decal
        const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize() : new THREE.Vector3(0, 0, 1);
        const decal = this._createDecal(pos, normal);
        this.scene.add(decal);
        this.tags.push({ mesh: decal, pos: pos.clone(), time: performance.now() });

        // Style bonus based on context
        let bonus = 1;
        if (this.player.state === 'WALLRUN') bonus = 2;
        else if (!this.player.grounded) bonus = 1.5;
        else if (this.player.state === 'SPRINT') bonus = 1.3;

        if (this.player.onSprayTag) this.player.onSprayTag(bonus);

        // Territory influence
        if (this.territorySystem && this.territorySystem.claim) {
            this.territorySystem.claim(pos, 'player', 2);
        }

        return true;
    }

    _createDecal(pos, normal) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 50%)`;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(64, 64, 40 + Math.random() * 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(40, 64); ctx.lineTo(88, 64);
        ctx.moveTo(64, 40); ctx.lineTo(64, 88);
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        const geo = new THREE.PlaneGeometry(0.6, 0.6);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos).addScaledVector(normal, 0.02);
        const up = new THREE.Vector3(0, 1, 0);
        const q = new THREE.Quaternion().setFromUnitVectors(up, normal);
        mesh.quaternion.copy(q);
        return mesh;
    }

    refill(amount = this.maxPaint) {
        this.paint = Math.min(this.maxPaint, this.paint + amount);
    }

    reset() {
        for (const t of this.tags) {
            if (t.mesh) this.scene.remove(t.mesh);
        }
        this.tags = [];
        this.paint = this.maxPaint;
        this.isSpraying = false;
    }
}
