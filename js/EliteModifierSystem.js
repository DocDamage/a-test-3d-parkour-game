/**
 * EliteModifierSystem — random affixes for elite drones.
 */

export const ELITE_MODIFIERS = [
    { id: 'reflective', name: 'Reflective', color: 0x00ffff, effect: 'projectilesBounce' },
    { id: 'phasing', name: 'Phasing', color: 0xaa00ff, effect: 'dodgeChance', value: 0.50 },
    { id: 'vampiric', name: 'Vampiric', color: 0xff0000, effect: 'lifesteal', value: 0.15 },
    { id: 'explosive', name: 'Explosive', color: 0xff6600, effect: 'deathBomb', value: 3.0 },
    { id: 'shielded', name: 'Shielded', color: 0xffff00, effect: 'damageShield', value: 50 },
    { id: 'frenzied', name: 'Frenzied', color: 0xff00ff, effect: 'attackSpeed', value: 1.50 },
];

export class EliteModifierSystem {
    constructor(scene) {
        this.scene = scene;
        this._eliteRegistry = new WeakMap();
    }

    makeElite(drone, tier = 1) {
        if (!drone || this._eliteRegistry.has(drone)) return;
        const count = Math.min(tier, 2);
        const mods = [];
        const pool = [...ELITE_MODIFIERS];
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            mods.push(pool.splice(idx, 1)[0]);
        }
        this._eliteRegistry.set(drone, mods);
        drone._isElite = true;
        drone._eliteMods = mods;
        drone.maxHealth = (drone.maxHealth || 100) * (1 + tier * 0.5);
        drone.health = drone.maxHealth;

        // Visual: aura glow
        if (drone.mesh && this.scene) {
            const color = mods[0].color;
            drone.mesh.material = drone.mesh.material.clone();
            drone.mesh.material.emissive = new THREE.Color(color);
            drone.mesh.material.emissiveIntensity = 0.3;
        }

        // Scale up slightly
        if (drone.mesh) {
            drone.mesh.scale.multiplyScalar(1.15);
        }
    }

    onDroneDamaged(drone, amount, type, source) {
        const mods = this._eliteRegistry.get(drone);
        if (!mods) return amount;

        let finalAmount = amount;
        for (const mod of mods) {
            switch (mod.effect) {
                case 'dodgeChance':
                    if (Math.random() < mod.value) {
                        finalAmount = 0; // phased through
                        if (window.__DEV__) console.log('[Elite] Phased dodge');
                    }
                    break;
                case 'damageShield':
                    if (drone._shieldHp > 0) {
                        drone._shieldHp -= finalAmount;
                        finalAmount = Math.max(0, -drone._shieldHp);
                        drone._shieldHp = Math.max(0, drone._shieldHp);
                    }
                    break;
                case 'lifesteal':
                    if (source && source.takeDamage) {
                        const steal = finalAmount * mod.value;
                        drone.health = Math.min(drone.maxHealth, drone.health + steal);
                    }
                    break;
            }
        }
        return finalAmount;
    }

    onDroneDeath(drone, position) {
        const mods = this._eliteRegistry.get(drone);
        if (!mods) return;
        for (const mod of mods) {
            if (mod.effect === 'deathBomb') {
                this._spawnExplosion(position, mod.value);
            }
        }
    }

    _spawnExplosion(pos, radius) {
        // Emit event for main.js to create hitbox
        if (this._onDeathBomb) {
            this._onDeathBomb({ position: pos, radius, damage: 30 });
        }
    }

    getModifierText(drone) {
        const mods = this._eliteRegistry.get(drone);
        if (!mods) return '';
        return mods.map(m => m.name).join(' · ');
    }
}
