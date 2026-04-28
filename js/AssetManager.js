import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { VISUAL_ASSET_MANIFEST } from './VisualAssetRegistry.js';

export class AssetManager {
    constructor(options = {}) {
        this.manifest = options.manifest || VISUAL_ASSET_MANIFEST;
        this.dev = !!options.dev;
        this.gltfLoader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.models = new Map();
        this.modelPromises = new Map();
        this.textures = new Map();
        this.texturePromises = new Map();
        this.failures = new Set();
    }

    getModelDefinition(id) {
        return this.manifest.models?.[id] || null;
    }

    registerModel(id, definition) {
        if (!id || !definition || !definition.path) return false;
        if (!this.manifest.models) this.manifest.models = {};
        this.manifest.models[id] = { ...definition };
        return true;
    }

    getTextureDefinition(id) {
        return this.manifest.textures?.[id] || null;
    }

    hasModel(id) {
        return this.models.has(id);
    }

    hasTexture(id) {
        return this.textures.has(id);
    }

    getStatus() {
        return {
            modelsLoaded: this.models.size,
            texturesLoaded: this.textures.size,
            modelIds: Array.from(this.models.keys()).sort(),
            textureIds: Array.from(this.textures.keys()).sort(),
            failures: Array.from(this.failures).sort(),
            pendingModels: Array.from(this.modelPromises.keys()).sort(),
            pendingTextures: Array.from(this.texturePromises.keys()).sort()
        };
    }

    async preloadTagged(tag) {
        const ids = Object.entries(this.manifest.models || {})
            .filter(([, def]) => Array.isArray(def.tags) && def.tags.includes(tag) && def.preload === true)
            .map(([id]) => id);
        return this.preloadModels(ids);
    }

    async preloadModels(ids = []) {
        const results = await Promise.allSettled(ids.map(id => this.loadModel(id)));
        return results.filter(result => result.status === 'fulfilled').map(result => result.value);
    }

    async loadModel(id) {
        if (this.models.has(id)) return this.models.get(id);
        if (this.modelPromises.has(id)) return this.modelPromises.get(id);

        const def = this.getModelDefinition(id);
        if (!def || !def.path) {
            if (this.dev) console.warn(`AssetManager: missing model definition for ${id}`);
            return null;
        }

        const promise = new Promise(resolve => {
            this.gltfLoader.load(
                def.path,
                gltf => resolve(gltf),
                undefined,
                err => {
                    this.failures.add(id);
                    if (this.dev) console.warn(`AssetManager: failed to load ${id} (${def.path})`, err);
                    resolve(null);
                }
            );
        })
            .then(gltf => {
                if (!gltf) return null;
                const scene = gltf.scene || gltf.scenes?.[0] || null;
                if (scene) {
                    this._prepareModel(scene);
                    this.models.set(id, { id, definition: def, gltf, scene });
                }
                return this.models.get(id) || null;
            })
            .finally(() => {
                this.modelPromises.delete(id);
            });

        this.modelPromises.set(id, promise);
        return promise;
    }

    async loadTexture(id) {
        if (this.textures.has(id)) return this.textures.get(id);
        if (this.texturePromises.has(id)) return this.texturePromises.get(id);

        const def = this.getTextureDefinition(id);
        if (!def || !def.path) {
            if (this.dev) console.warn(`AssetManager: missing texture definition for ${id}`);
            return null;
        }

        const promise = new Promise(resolve => {
            this.textureLoader.load(
                def.path,
                texture => resolve(texture),
                undefined,
                err => {
                    this.failures.add(id);
                    if (this.dev) console.warn(`AssetManager: failed to load texture ${id} (${def.path})`, err);
                    resolve(null);
                }
            );
        })
            .then(texture => {
                if (!texture) return null;
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                this.textures.set(id, texture);
                return texture;
            })
            .finally(() => {
                this.texturePromises.delete(id);
            });

        this.texturePromises.set(id, promise);
        return promise;
    }

    instantiateModel(id, options = {}) {
        const cached = this.models.get(id);
        if (!cached || !cached.scene) return null;

        const clone = cloneSkeleton(cached.scene);
        const scale = options.scale ?? cached.definition.scale ?? 1;
        clone.scale.multiplyScalar(scale);

        if (options.position) clone.position.copy(options.position);
        if (options.rotation) clone.rotation.set(options.rotation.x || 0, options.rotation.y || 0, options.rotation.z || 0);
        if (typeof options.yaw === 'number') clone.rotation.y = options.yaw;

        clone.traverse(obj => {
            if (!obj.isMesh || !obj.material) return;
            obj.material = Array.isArray(obj.material)
                ? obj.material.map(mat => mat.clone())
                : obj.material.clone();
        });
        this._prepareModel(clone, {
            castShadow: options.castShadow !== false,
            receiveShadow: !!options.receiveShadow,
            materialTint: options.materialTint,
            emissiveTint: options.emissiveTint
        });

        return clone;
    }

    dispose() {
        for (const model of this.models.values()) {
            disposeObject3D(model.scene);
        }
        for (const texture of this.textures.values()) {
            texture.dispose();
        }
        this.models.clear();
        this.modelPromises.clear();
        this.textures.clear();
        this.texturePromises.clear();
        this.failures.clear();
    }

    _prepareModel(root, options = {}) {
        root.traverse(obj => {
            if (!obj.isMesh) return;
            obj.castShadow = options.castShadow !== false;
            obj.receiveShadow = !!options.receiveShadow;
            if (!obj.material) return;
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const mat of materials) {
                if (mat.color && options.materialTint) mat.color.lerp(new THREE.Color(options.materialTint), 0.25);
                if (mat.emissive && options.emissiveTint) {
                    mat.emissive.lerp(new THREE.Color(options.emissiveTint), 0.35);
                    mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 0.35);
                }
                mat.needsUpdate = true;
            }
        });
    }
}

export function disposeObject3D(root) {
    if (!root) return;
    root.traverse(obj => {
        if (obj.geometry && typeof obj.geometry.dispose === 'function') obj.geometry.dispose();
        if (obj.material) {
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const mat of materials) {
                for (const value of Object.values(mat)) {
                    if (value && value.isTexture && typeof value.dispose === 'function') value.dispose();
                }
                if (typeof mat.dispose === 'function') mat.dispose();
            }
        }
    });
}
