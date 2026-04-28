import * as THREE from 'three';

const EFFECT_TEXTURES = Object.freeze({
    explosion: { textureId: 'fx.explosion', columns: 6, rows: 5, duration: 0.55, size: 2.2 },
    electric: { textureId: 'fx.electricRing', columns: 6, rows: 5, duration: 0.35, size: 1.4 },
    fire: { textureId: 'fx.fire', columns: 6, rows: 5, duration: 0.45, size: 1.6 },
    void: { textureId: 'fx.vortex', columns: 6, rows: 5, duration: 0.65, size: 1.8 },
    impact: { textureId: 'fx.impactWhite', columns: 6, rows: 4, duration: 0.25, size: 1.0 },
    charge: { textureId: 'fx.charge', columns: 7, rows: 6, duration: 0.55, size: 1.5 }
});

export class SpriteSheetEffects {
    constructor(scene, camera, assetManager) {
        this.scene = scene;
        this.camera = camera;
        this.assetManager = assetManager;
        this.effects = [];
        this._loading = new Set();
        this._ready = new Set();
    }

    preload() {
        return Promise.all(Object.values(EFFECT_TEXTURES).map(def => this._ensureTexture(def.textureId)));
    }

    spawn(type, position, options = {}) {
        const def = EFFECT_TEXTURES[type] || EFFECT_TEXTURES.impact;
        const texture = this.assetManager?.textures?.get(def.textureId);
        if (!texture) {
            this._ensureTexture(def.textureId);
            return null;
        }

        const sheet = texture.clone();
        sheet.needsUpdate = true;
        sheet.repeat.set(1 / def.columns, 1 / def.rows);
        sheet.offset.set(0, 1 - 1 / def.rows);

        const material = new THREE.SpriteMaterial({
            map: sheet,
            color: options.color || 0xffffff,
            transparent: true,
            opacity: options.opacity ?? 0.9,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.setScalar(options.size || def.size);
        this.scene.add(sprite);

        this.effects.push({
            sprite,
            texture: sheet,
            material,
            age: 0,
            duration: options.duration || def.duration,
            columns: def.columns,
            rows: def.rows
        });
        return sprite;
    }

    spawnForDamageType(damageType, position, options = {}) {
        const type = damageType === 'explosive' ? 'explosion'
            : damageType === 'electric' ? 'electric'
            : damageType === 'burn' || damageType === 'fire' ? 'fire'
            : damageType === 'void' || damageType === 'psychic' ? 'void'
            : 'impact';
        return this.spawn(type, position, options);
    }

    update(dt) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const fx = this.effects[i];
            fx.age += dt;
            const t = Math.min(1, fx.age / fx.duration);
            const totalFrames = fx.columns * fx.rows;
            const frame = Math.min(totalFrames - 1, Math.floor(t * totalFrames));
            const col = frame % fx.columns;
            const row = Math.floor(frame / fx.columns);
            fx.texture.offset.x = col / fx.columns;
            fx.texture.offset.y = 1 - (row + 1) / fx.rows;
            fx.material.opacity = Math.max(0, 1 - t);
            if (this.camera) fx.sprite.quaternion.copy(this.camera.quaternion);

            if (fx.age >= fx.duration) {
                this.scene.remove(fx.sprite);
                fx.material.dispose();
                fx.texture.dispose();
                this.effects.splice(i, 1);
            }
        }
    }

    dispose() {
        for (const fx of this.effects) {
            this.scene.remove(fx.sprite);
            fx.material.dispose();
            fx.texture.dispose();
        }
        this.effects.length = 0;
    }

    async _ensureTexture(textureId) {
        if (this._ready.has(textureId) || this._loading.has(textureId) || !this.assetManager) return null;
        this._loading.add(textureId);
        const texture = await this.assetManager.loadTexture(textureId);
        if (texture) this._ready.add(textureId);
        this._loading.delete(textureId);
        return texture;
    }
}

