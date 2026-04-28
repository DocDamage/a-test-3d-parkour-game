/**
 * DoubleJumpSystem — second jump in mid-air with reduced height.
 * Visual wing burst. Resets on grounding or grapple.
 */

import * as THREE from 'three';

export class DoubleJumpSystem {
    constructor(player, particleEffects = null) {
        this.player = player;
        this.particleEffects = particleEffects;
        this.available = true;
        this.heightMul = 0.7;
        this._wingMesh = null;
        this._wingTimer = 0;
    }

    update(dt) {
        if (this.player.grounded || this.player.state === 'GRAPPLE_SWING') {
            this.available = true;
        }
        if (this._wingTimer > 0) {
            this._wingTimer -= dt;
            if (this._wingTimer <= 0 && this._wingMesh) {
                this._wingMesh.visible = false;
            }
            // Animate wings
            if (this._wingMesh && this._wingMesh.visible) {
                this._wingMesh.position.copy(this.player.position);
                this._wingMesh.position.y += this.player.currentHeight * 0.5;
                const flap = Math.sin(this._wingTimer * 20) * 0.3;
                this._wingMesh.rotation.z = flap;
                this._wingMesh.rotation.y = this.player.facing || 0;
            }
        }
    }

    tryDoubleJump(inputPressed) {
        if (!inputPressed || this.player.grounded) return false;
        if (!this.available) return false;
        if (this.player.state === 'CLIMB' || this.player.state === 'HANG') return false;

        this.available = false;
        const jumpForce = (this.player.jumpForce || 7) * this.heightMul;
        this.player.velocity.y = jumpForce;

        this._showWings();
        if (this.particleEffects && this.particleEffects.burst) {
            this.particleEffects.burst(this.player.position, 0xaaddff, 8);
        }
        if (this.player.onDoubleJump) this.player.onDoubleJump();
        return true;
    }

    _showWings() {
        if (!this._wingMesh) this._buildWingMesh();
        if (this._wingMesh) {
            this._wingMesh.visible = true;
            this._wingTimer = 0.4;
        }
    }

    _buildWingMesh() {
        if (!this.player.scene && !window.scene) return;
        const scene = this.player.scene || window.scene;
        const g = new THREE.Group();
        const wingGeo = new THREE.PlaneGeometry(0.8, 0.3);
        const wingMat = new THREE.MeshBasicMaterial({
            color: 0xaaddff, transparent: true, opacity: 0.4, side: THREE.DoubleSide
        });
        const left = new THREE.Mesh(wingGeo, wingMat);
        left.position.x = -0.4;
        left.rotation.y = -0.3;
        g.add(left);
        const right = new THREE.Mesh(wingGeo, wingMat);
        right.position.x = 0.4;
        right.rotation.y = 0.3;
        g.add(right);
        scene.add(g);
        this._wingMesh = g;
    }

    reset() {
        this.available = true;
        this._wingTimer = 0;
        if (this._wingMesh) this._wingMesh.visible = false;
    }
}
