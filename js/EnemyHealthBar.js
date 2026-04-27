import * as THREE from 'three';

/**
 * Simple floating health bar above an enemy.
 * Uses a CanvasTexture on a Sprite for lightweight billboard rendering.
 */
export class EnemyHealthBar {
    constructor(scene, enemy) {
        this.scene = scene;
        this.enemy = enemy;

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 8;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        this.texture = texture;

        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        this.sprite = new THREE.Sprite(material);
        this.sprite.scale.set(1.5, 0.2, 1);
        this.sprite.position.set(0, 0.8, 0);
        this.scene.add(this.sprite);

        this.update(0);
    }

    update(dt) {
        if (!this.enemy || !this.sprite) return;

        // Follow enemy mesh/group
        const enemyMesh = this.enemy.mesh || this.enemy.group || this.enemy;
        if (enemyMesh && enemyMesh.getWorldPosition) {
            const worldPos = new THREE.Vector3();
            enemyMesh.getWorldPosition(worldPos);
            this.sprite.position.set(worldPos.x, worldPos.y + 0.8, worldPos.z);
        }

        // Resolve health values
        const maxHealth = this.enemy.maxHealth || this.enemy.hp || 1;
        const health = this.enemy.health !== undefined ? this.enemy.health : (this.enemy.hp || 0);
        const pct = maxHealth > 0 ? health / maxHealth : 0;

        // Hide at full health or when dead, unless always visible
        this.sprite.visible = this.alwaysVisible || (pct < 1.0 && pct > 0);

        if (this.sprite.visible) {
            this._drawBar(pct);
        }
    }

    _drawBar(pct) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, w, h);

        // Fill colour
        let r, g, b;
        if (this._pulseGold) {
            r = 255; g = 215; b = 0;
        } else if (pct <= 0.25) {
            r = 255; g = 0; b = 0;
        } else if (pct <= 0.5) {
            r = 255; g = 165; b = 0;
        } else {
            r = 0; g = 255; b = 0;
        }

        const fillW = Math.max(1, Math.floor(pct * (w - 2)));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(1, 1, fillW, h - 2);

        this.texture.needsUpdate = true;
    }

    dispose() {
        if (this.sprite) {
            this.scene.remove(this.sprite);
            if (this.sprite.material.map) this.sprite.material.map.dispose();
            this.sprite.material.dispose();
            this.sprite = null;
        }
        this.enemy = null;
    }
}
