import * as THREE from 'three';
import { CHARACTER_BASES, getCharacterBase } from './CharacterBaseVisuals.js';

export const CHARACTER_PARTS = Object.freeze([
    { base: 'drizzel', kind: 'weapon', id: 'stick', label: 'Drizzel Staff', assetId: 'player.part.drizzel.weapon.stick', path: 'assets/models/player/parts/drizzel_weapon_stick.glb' },
    { base: 'drizzel', kind: 'body', id: 'drizzle', label: 'Drizzel Split Body', assetId: 'player.part.drizzel.body.drizzle', path: 'assets/models/player/parts/drizzel_body_drizzle.glb' },
    { base: 'drizzel', kind: 'fx', id: 'ui_circle', label: 'Drizzel Halo Ring', assetId: 'player.part.drizzel.fx.ui_circle', path: 'assets/models/player/parts/drizzel_fx_ui_circle.glb' },
    { base: 'drizzel', kind: 'fx', id: 'ui', label: 'Drizzel Holo Plate', assetId: 'player.part.drizzel.fx.ui', path: 'assets/models/player/parts/drizzel_fx_ui.glb' },
    { base: 'gekkou', kind: 'gear', id: 'scabbard', label: 'Gekkou Scabbard', assetId: 'player.part.gekkou.gear.scabbard', path: 'assets/models/player/parts/gekkou_gear_scabbard.glb' },
    { base: 'gekkou', kind: 'weapon', id: 'katana', label: 'Gekkou Katana', assetId: 'player.part.gekkou.weapon.katana', path: 'assets/models/player/parts/gekkou_weapon_katana.glb' },
    { base: 'gekkou', kind: 'body', id: 'gekkou', label: 'Gekkou Split Body', assetId: 'player.part.gekkou.body.gekkou', path: 'assets/models/player/parts/gekkou_body_gekkou.glb' },
    { base: 'gekkou', kind: 'fx', id: 'smoke', label: 'Gekkou Smoke', assetId: 'player.part.gekkou.fx.smoke', path: 'assets/models/player/parts/gekkou_fx_smoke.glb' },
    { base: 'kasa', kind: 'body', id: 'kasa', label: 'Kasa Split Body', assetId: 'player.part.kasa.body.kasa', path: 'assets/models/player/parts/kasa_body_kasa.glb' },
    { base: 'kasa', kind: 'gear', id: 'tail', label: 'Kasa Tail', assetId: 'player.part.kasa.gear.tail', path: 'assets/models/player/parts/kasa_gear_tail.glb' },
    { base: 'kasa', kind: 'gear', id: 'cape', label: 'Kasa Cape', assetId: 'player.part.kasa.gear.cape', path: 'assets/models/player/parts/kasa_gear_cape.glb' },
    { base: 'kasa', kind: 'gear', id: 'tissue_a', label: 'Kasa Cloth A', assetId: 'player.part.kasa.gear.tissue_a', path: 'assets/models/player/parts/kasa_gear_tissue_a.glb' },
    { base: 'kasa', kind: 'gear', id: 'tissue_b', label: 'Kasa Cloth B', assetId: 'player.part.kasa.gear.tissue_b', path: 'assets/models/player/parts/kasa_gear_tissue_b.glb' },
    { base: 'kasa', kind: 'fx', id: 'fake_smoke', label: 'Kasa Smoke', assetId: 'player.part.kasa.fx.fake_smoke', path: 'assets/models/player/parts/kasa_fx_fake_smoke.glb' },
    { base: 'kasa', kind: 'weapon', id: 'katana', label: 'Kasa Katana', assetId: 'player.part.kasa.weapon.katana', path: 'assets/models/player/parts/kasa_weapon_katana.glb' },
    { base: 'kurenai', kind: 'gear', id: 'cloth', label: 'Kurenai Cloth', assetId: 'player.part.kurenai.gear.cloth', path: 'assets/models/player/parts/kurenai_gear_cloth.glb' },
    { base: 'kurenai', kind: 'fx', id: 'fake_smoke', label: 'Kurenai Smoke', assetId: 'player.part.kurenai.fx.fake_smoke', path: 'assets/models/player/parts/kurenai_fx_fake_smoke.glb' },
    { base: 'kurenai', kind: 'body', id: 'body', label: 'Kurenai Split Body', assetId: 'player.part.kurenai.body.body', path: 'assets/models/player/parts/kurenai_body_body.glb' },
    { base: 'kurenai', kind: 'head', id: 'head', label: 'Kurenai Head', assetId: 'player.part.kurenai.head.head', path: 'assets/models/player/parts/kurenai_head_head.glb' },
    { base: 'samidale', kind: 'body', id: 'samidale', label: 'Samidale Split Body', assetId: 'player.part.samidale.body.samidale', path: 'assets/models/player/parts/samidale_body_samidale.glb' },
    { base: 'samidale', kind: 'gear', id: 'pipe', label: 'Samidale Pipe Pack', assetId: 'player.part.samidale.gear.pipe', path: 'assets/models/player/parts/samidale_gear_pipe.glb' },
    { base: 'samidale', kind: 'gear', id: 'cape_up', label: 'Samidale Cape Up', assetId: 'player.part.samidale.gear.cape_up', path: 'assets/models/player/parts/samidale_gear_cape_up.glb' },
    { base: 'samidale', kind: 'gear', id: 'cape_down', label: 'Samidale Cape Down', assetId: 'player.part.samidale.gear.cape_down', path: 'assets/models/player/parts/samidale_gear_cape_down.glb' },
    { base: 'shogun', kind: 'body', id: 'shogun', label: 'Shogun Split Body', assetId: 'player.part.shogun.body.shogun', path: 'assets/models/player/parts/shogun_body_shogun.glb' },
    { base: 'shogun', kind: 'weapon', id: 'katana', label: 'Shogun Katana', assetId: 'player.part.shogun.weapon.katana', path: 'assets/models/player/parts/shogun_weapon_katana.glb' },
    { base: 'shogun', kind: 'gear', id: 'scabbard', label: 'Shogun Scabbard', assetId: 'player.part.shogun.gear.scabbard', path: 'assets/models/player/parts/shogun_gear_scabbard.glb' }
]);

const LIMB_BASES = ['drizzel', 'gekkou', 'kasa', 'kurenai', 'samidale', 'shogun'];
const LIMB_SLOTS = [
    ['head', 'Head'],
    ['torso', 'Torso'],
    ['leftArm', 'Left Arm'],
    ['rightArm', 'Right Arm'],
    ['leftLeg', 'Left Leg'],
    ['rightLeg', 'Right Leg']
];

export const CHARACTER_LIMBS = Object.freeze(LIMB_BASES.flatMap(base => LIMB_SLOTS.map(([kind, label]) => ({
    base,
    kind,
    id: kind,
    label: `${titleCase(base)} ${label}`,
    assetId: `player.limb.${base}.${kind}`,
    path: `assets/models/player/limbs/${base}_limb_${kind}.glb`
}))));

const ALL_CUSTOMIZATION_PARTS = Object.freeze([...CHARACTER_PARTS, ...CHARACTER_LIMBS]);
const ANATOMY_SLOTS = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];

export const SILHOUETTES = Object.freeze({
    balanced: { label: 'Balanced', scale: 1, yOffset: 0 },
    agile: { label: 'Agile', scale: 0.94, yOffset: 0.02 },
    heavy: { label: 'Heavy', scale: 1.08, yOffset: -0.03 },
    tall: { label: 'Tall', scale: 1.04, yOffset: 0.04 },
    compact: { label: 'Compact', scale: 0.9, yOffset: 0.01 }
});

export const STYLE_PRESETS = Object.freeze([
    { id: 'rift', label: 'Rift Neon', primary: '#1e7cff', accent: '#ffb020', emissive: '#28f0ff' },
    { id: 'redline', label: 'Redline Rush', primary: '#c92828', accent: '#ffffff', emissive: '#ff4422' },
    { id: 'synapse', label: 'Synapse Pulse', primary: '#2f66ff', accent: '#0ee6b7', emissive: '#66ddff' },
    { id: 'hollow', label: 'Hollow Hazard', primary: '#4d3344', accent: '#ff7a1a', emissive: '#ff3300' },
    { id: 'ghostworks', label: 'Ghostworks Mono', primary: '#d8dce8', accent: '#454a5a', emissive: '#b8f4ff' }
]);

const STORAGE_KEY = 'apex_character_customization_v1';

export class CharacterCustomizationSystem {
    constructor(assetManager, player) {
        this.assetManager = assetManager;
        this.player = player;
        this.current = this._normalize(this._loadLocal());
        this._registerPartAssets();
    }

    getOptions(kind = null) {
        return kind ? ALL_CUSTOMIZATION_PARTS.filter(part => part.kind === kind) : [...ALL_CUSTOMIZATION_PARTS];
    }

    getConfig() {
        return this._normalize(this.current);
    }

    setConfig(config, options = {}) {
        this.current = this._normalize({ ...this.current, ...config });
        this._saveLocal();
        if (options.apply !== false) this.applyToPlayer();
        return this.getConfig();
    }

    randomize() {
        const bases = CHARACTER_BASES.map(base => base.id);
        const pick = (kind) => {
            const options = this.getOptions(kind);
            return Math.random() < 0.25 || options.length === 0 ? null : options[Math.floor(Math.random() * options.length)].assetId;
        };
        const style = STYLE_PRESETS[Math.floor(Math.random() * STYLE_PRESETS.length)];
        return this.setConfig({
            baseId: bases[Math.floor(Math.random() * bases.length)],
            silhouette: Object.keys(SILHOUETTES)[Math.floor(Math.random() * Object.keys(SILHOUETTES).length)],
            primary: style.primary,
            accent: style.accent,
            emissive: style.emissive,
            gear: pick('gear'),
            weapon: pick('weapon'),
            fx: Math.random() < 0.45 ? pick('fx') : null,
            head: Math.random() < 0.55 ? pick('head') : null,
            torso: Math.random() < 0.45 ? pick('torso') : null,
            leftArm: Math.random() < 0.45 ? pick('leftArm') : null,
            rightArm: Math.random() < 0.45 ? pick('rightArm') : null,
            leftLeg: Math.random() < 0.45 ? pick('leftLeg') : null,
            rightLeg: Math.random() < 0.45 ? pick('rightLeg') : null
        });
    }

    serialize() {
        return this.getConfig();
    }

    deserialize(data) {
        if (!data) return;
        this.current = this._normalize(data);
        this._saveLocal();
        this.applyToPlayer();
    }

    async applyToPlayer(player = this.player) {
        if (!player || !this.assetManager) return false;
        const config = this.getConfig();
        const base = getCharacterBase(config.baseId);
        const silhouette = SILHOUETTES[config.silhouette] || SILHOUETTES.balanced;
        const anatomyIds = this._resolveAnatomyIds(config);
        const usesCompositeBody = anatomyIds.length > 0;
        const selectedIds = [usesCompositeBody ? null : base.assetId, ...anatomyIds, config.gear, config.weapon, config.fx].filter(Boolean);
        await Promise.all(selectedIds.map(id => this.assetManager.loadModel(id)));

        const root = new THREE.Group();
        root.name = 'CustomizedRunnerVisual';

        if (usesCompositeBody) {
            for (const id of anatomyIds) {
                const model = this.assetManager.instantiateModel(id, { castShadow: true });
                if (!model) continue;
                model.name = `Anatomy_${id.split('.').pop()}`;
                this._tintModel(model, config, true);
                root.add(model);
            }
            root.add(this._createSeamArmor(config));
        } else {
            const baseModel = this.assetManager.instantiateModel(base.assetId, { castShadow: true });
            if (!baseModel) return false;
            baseModel.name = 'BaseBody';
            this._tintModel(baseModel, config, true);
            root.add(baseModel);
        }

        for (const slot of ['gear', 'weapon', 'fx']) {
            const id = config[slot];
            if (!id) continue;
            const model = this.assetManager.instantiateModel(id, { castShadow: true });
            if (!model) continue;
            model.name = `Custom_${slot}`;
            this._tintModel(model, config, false);
            model.userData.customizationSlot = slot;
            root.add(model);
        }

        return player.setVisualModel(root, {
            scale: silhouette.scale,
            yOffset: silhouette.yOffset,
            rotationY: Math.PI
        });
    }

    _registerPartAssets() {
        if (!this.assetManager || typeof this.assetManager.registerModel !== 'function') return;
        for (const part of ALL_CUSTOMIZATION_PARTS) {
            this.assetManager.registerModel(part.assetId, {
                path: part.path,
                tags: ['player'],
                scale: 1,
                notes: `Character creator ${part.kind} part exported from ${part.base}.`
            });
        }
    }

    _normalize(config = {}) {
        const base = getCharacterBase(config.baseId || localStorage.getItem('character_base') || 'drizzel');
        return {
            baseId: base.id,
            silhouette: SILHOUETTES[config.silhouette] ? config.silhouette : 'balanced',
            primary: sanitizeColor(config.primary, '#1e7cff'),
            accent: sanitizeColor(config.accent, '#ffb020'),
            emissive: sanitizeColor(config.emissive, '#28f0ff'),
            head: validPart(config.head, 'head'),
            torso: validPart(config.torso, 'torso'),
            leftArm: validPart(config.leftArm, 'leftArm'),
            rightArm: validPart(config.rightArm, 'rightArm'),
            leftLeg: validPart(config.leftLeg, 'leftLeg'),
            rightLeg: validPart(config.rightLeg, 'rightLeg'),
            gear: validPart(config.gear, 'gear'),
            weapon: validPart(config.weapon, 'weapon'),
            fx: validPart(config.fx, 'fx')
        };
    }

    _resolveAnatomyIds(config) {
        const hasAnyOverride = ANATOMY_SLOTS.some(slot => !!config[slot]);
        if (!hasAnyOverride) return [];
        return ANATOMY_SLOTS.map(slot => config[slot] || `player.limb.${config.baseId}.${slot}`);
    }

    _createSeamArmor(config) {
        const group = new THREE.Group();
        group.name = 'CompositeSeamArmor';
        const accent = new THREE.Color(config.accent);
        const glow = new THREE.Color(config.emissive);
        const mat = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: glow,
            emissiveIntensity: 0.18,
            roughness: 0.38,
            metalness: 0.55
        });

        const addBand = (name, radius, tube, y, scaleX = 1, scaleZ = 1) => {
            const band = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 32), mat.clone());
            band.name = name;
            band.rotation.x = Math.PI / 2;
            band.position.y = y;
            band.scale.set(scaleX, 1, scaleZ);
            band.castShadow = true;
            group.add(band);
            return band;
        };

        const addShoulder = (name, x) => {
            const pad = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mat.clone());
            pad.name = name;
            pad.position.set(x, 1.22, 0);
            pad.rotation.z = x < 0 ? -0.35 : 0.35;
            pad.scale.set(1.45, 0.7, 1.0);
            pad.castShadow = true;
            group.add(pad);
        };

        addBand('NeckSeal', 0.16, 0.025, 1.28, 1.05, 0.85);
        addBand('ChestSeal', 0.32, 0.02, 1.02, 1.22, 0.82);
        addBand('BeltSeal', 0.28, 0.03, 0.72, 1.25, 0.9);
        addBand('LeftThighSeal', 0.105, 0.018, 0.5, 0.85, 0.72).position.set(-0.13, 0.5, 0);
        addBand('RightThighSeal', 0.105, 0.018, 0.5, 0.85, 0.72).position.set(0.13, 0.5, 0);
        addShoulder('LeftShoulderPad', -0.35);
        addShoulder('RightShoulderPad', 0.35);
        return group;
    }

    _tintModel(root, config, isBase) {
        const primary = new THREE.Color(config.primary);
        const accent = new THREE.Color(config.accent);
        const emissive = new THREE.Color(config.emissive);
        root.traverse(obj => {
            if (!obj.isMesh || !obj.material) return;
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const mat of mats) {
                if (mat.color) mat.color.lerp(isBase ? primary : accent, isBase ? 0.22 : 0.18);
                if (mat.emissive) {
                    mat.emissive.lerp(emissive, isBase ? 0.18 : 0.28);
                    mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, isBase ? 0.12 : 0.22);
                }
                mat.needsUpdate = true;
            }
        });
    }

    _loadLocal() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch (_) {
            return {};
        }
    }

    _saveLocal() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.current));
            localStorage.setItem('character_base', this.current.baseId);
        } catch (_) {}
    }
}

function validPart(assetId, kind) {
    if (!assetId) return null;
    return ALL_CUSTOMIZATION_PARTS.some(part => part.kind === kind && part.assetId === assetId) ? assetId : null;
}

function sanitizeColor(value, fallback) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function titleCase(value) {
    return String(value).slice(0, 1).toUpperCase() + String(value).slice(1);
}
