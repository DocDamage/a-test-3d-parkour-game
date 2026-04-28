/**
 * Runtime wrapper for data-driven procedural weapons.
 *
 * The generated item remains JSON-safe in the backpack. Equipping creates this
 * adapter, preserving baseWeapon metadata that points at the existing shipped
 * weapon class. The adapter intentionally avoids static imports of those classes
 * so Node-based validation can load inventory modules without a local three
 * package; browser visuals can be attached later by a small async factory.
 */
export class ProceduralWeaponAdapter {
    constructor(itemData, scene, player) {
        this.itemData = clonePlain(itemData);
        this.scene = scene;
        this.player = player;
        this.baseInstance = null;

        this.id = itemData.id;
        this.name = itemData.name;
        this.shortName = itemData.shortName || deriveShortName(itemData.name);
        this.itemType = 'weapon';
        this.isProceduralWeapon = true;
        this.baseWeapon = itemData.baseWeapon || null;
        this.manufacturer = itemData.manufacturer;
        this.rarity = itemData.compatRarity || itemData.rarity;
        this.weaponRarity = itemData.rarity;
        this.weaponType = itemData.weaponType;
        this.slot = itemData.slot;
        this.type = itemData.type;
        this.ammoType = itemData.ammoType || null;
        this.damageType = itemData.damageType || 'kinetic';
        this.damage = itemData.damage;
        this.fireRate = itemData.fireRate;
        this.attackSpeed = itemData.attackSpeed || itemData.fireRate;
        this.clipSize = itemData.clipSize;
        this.reloadTime = itemData.reloadTime;
        this.spread = itemData.spread || 0;
        this.range = itemData.range;
        this.projectileSpeed = itemData.projectile?.speed || 0;
        this.critChance = itemData.critChance || 0;
        this.critDamage = itemData.critDamage || 1.5;
        this.affixes = itemData.affixes || [];
        this.legendaryEffects = itemData.legendaryEffects || [];
        this.mods = itemData.mods || [];
        this.projectile = itemData.projectile || {};

    }

    fire(origin, direction) {
        const projectile = this.projectile || {};
        const common = {
            damage: this.damage,
            range: this.range,
            damageType: this.damageType,
            origin: origin.clone(),
            direction: direction.clone(),
            color: projectile.color,
            piercing: (projectile.pierce || 0) > 0,
            pierce: projectile.pierce || 0
        };

        if (this.type === 'melee' || projectile.behavior === 'slash') {
            return {
                type: 'melee',
                ...common,
                range: this.range,
                arcAngle: Math.PI / 2.5,
                stagger: 0.6,
                knockback: 4
            };
        }

        if (projectile.behavior === 'pellet') {
            const projectiles = [];
            const count = projectile.pelletCount || 8;
            for (let i = 0; i < count; i++) {
                projectiles.push({
                    type: 'projectile',
                    ...common,
                    speed: projectile.speed || this.projectileSpeed || 55,
                    spread: this.spread,
                    direction: applySpread(direction, this.spread)
                });
            }
            return { type: 'shotgun', projectiles };
        }

        if (projectile.behavior === 'rocket') {
            return {
                type: 'rocket',
                ...common,
                speed: projectile.speed || this.projectileSpeed || 35,
                blastRadius: projectile.blastRadius || 4
            };
        }

        if (this.type === 'hitscan' || projectile.behavior === 'beam') {
            return {
                type: 'hitscan',
                ...common,
                headshotMultiplier: this.critDamage,
                piercing: true
            };
        }

        return {
            type: 'projectile',
            ...common,
            speed: projectile.speed || this.projectileSpeed || 40,
            spread: this.spread
        };
    }

    update(dt) {
        if (this.baseInstance && typeof this.baseInstance.update === 'function') {
            this.baseInstance.update(dt);
        }
    }

    setVisible(visible) {
        if (this.baseInstance && typeof this.baseInstance.setVisible === 'function') {
            this.baseInstance.setVisible(visible);
        }
    }

    dispose() {
        if (!this.baseInstance?.mesh || !this.scene) return;
        this.scene.remove(this.baseInstance.mesh);
        this.baseInstance.mesh.traverse?.((child) => {
            child.geometry?.dispose?.();
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose?.());
            else child.material?.dispose?.();
        });
    }

    toItemData() {
        return clonePlain(this.itemData);
    }
}

export function createProceduralWeaponAdapter(itemData, scene, player) {
    return new ProceduralWeaponAdapter(itemData, scene, player);
}

function applySpread(direction, spread) {
    const dir = direction.clone().normalize();
    if (spread > 0) {
        dir.x += (Math.random() - 0.5) * spread;
        dir.y += (Math.random() - 0.5) * spread;
        dir.z += (Math.random() - 0.5) * spread;
        dir.normalize();
    }
    return dir;
}

function clonePlain(value) {
    return JSON.parse(JSON.stringify(value || {}));
}

function deriveShortName(name = 'PW') {
    return String(name).split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
}
