/**
 * WeaponSystem — 5-slot weapon manager with ammo tracking, switching, and mod support.
 *
 * Slots:
 *   1: Melee (always equipped, E or Mouse1 when no ranged)
 *   2: Sidearm (pistol) — key 1
 *   3: Primary (rifle/shotgun) — key 2
 *   4: Heavy/Gadget — key 3
 *   5: Throwable — key 4
 *
 * Integration:
 *   const weapons = new WeaponSystem(player, scene, hitboxSystem, projectileManager);
 *   weapons.update(dt, input);
 *   weapons.fireCurrent(origin, direction);
 *   weapons.switchSlot(2);
 */

import * as THREE from 'three';

export const WEAPON_SLOTS = {
    MELEE: 1,
    SIDEARM: 2,
    PRIMARY: 3,
    HEAVY: 4,
    THROWABLE: 5,
};

export const AMMO_TYPES = {
    PISTOL: 'pistol',
    RIFLE: 'rifle',
    SHOTGUN: 'shotgun',
    HEAVY: 'heavy',
    GADGET: 'gadget',
    THROWABLE: 'throwable',
};

export class WeaponSystem {
    constructor(player, scene, hitboxSystem, projectileManager) {
        this.player = player;
        this.scene = scene;
        this.hitboxSystem = hitboxSystem;
        this.projectileManager = projectileManager;

        this.slots = new Map();
        this.currentSlot = WEAPON_SLOTS.MELEE;
        this.ammo = {
            [AMMO_TYPES.PISTOL]: { clip: 0, reserve: 0 },
            [AMMO_TYPES.RIFLE]: { clip: 0, reserve: 0 },
            [AMMO_TYPES.SHOTGUN]: { clip: 0, reserve: 0 },
            [AMMO_TYPES.HEAVY]: { clip: 0, reserve: 0 },
            [AMMO_TYPES.GADGET]: { clip: 0, reserve: 0 },
            [AMMO_TYPES.THROWABLE]: { clip: 0, reserve: 0 },
        };

        this.reloadTimer = 0;
        this.fireCooldown = 0;
        this.isReloading = false;
        this.modSystem = null;
        this.familiaritySystem = null;

        this._buildUI();
    }

    setModSystem(modSystem) {
        this.modSystem = modSystem;
    }

    setFamiliaritySystem(fs) {
        this.familiaritySystem = fs;
    }

    _getEffectiveStats() {
        const w = this.getCurrentWeapon();
        if (!w) return null;
        const stats = {
            damage: w.damage ?? 20,
            fireRate: w.fireRate ?? w.attackSpeed ?? 1,
            spread: w.spread ?? 0,
            range: w.range ?? 30,
            reloadTime: w.reloadTime ?? 1.5,
            clipSize: w.clipSize ?? 10,
            projectileSpeed: w.projectileSpeed ?? 40,
        };
        if (this.modSystem) {
            const modStats = this.modSystem.getModStats(this.currentSlot);
            stats.damage *= modStats.damageMul;
            stats.fireRate *= modStats.fireRateMul;
            stats.spread *= modStats.spreadMul;
            stats.range *= modStats.rangeMul;
            stats.reloadTime /= modStats.reloadSpeedMul; // higher mul = faster = lower time
            stats.clipSize += modStats.clipSizeAdd;
            stats.projectileSpeed *= modStats.projectileSpeedMul;
        }
        if (this.familiaritySystem) {
            const w = this.getCurrentWeapon();
            const weaponId = w ? (w.id || w.name || 'melee') : 'melee';
            const fam = this.familiaritySystem.getFamiliarityBonus(weaponId);
            if (fam) stats.damage *= fam.damageMult;
        }
        return stats;
    }

    /* ------------------------------------------------------------------ */
    /*  Inventory                                                         */
    /* ------------------------------------------------------------------ */

    equip(weapon, slot) {
        if (!weapon || !slot) return false;
        this.slots.set(slot, {
            ...weapon,
            mods: weapon.mods || [],
        });
        return true;
    }

    unequip(slot) {
        this.slots.delete(slot);
    }

    getWeapon(slot) {
        return this.slots.get(slot) || null;
    }

    getCurrentWeapon() {
        return this.slots.get(this.currentSlot) || null;
    }

    switchSlot(slot) {
        if (this.slots.has(slot)) {
            this.currentSlot = slot;
            this._updateUI();
            return true;
        }
        return false;
    }

    cycleSlot(direction) {
        const keys = Array.from(this.slots.keys()).sort((a, b) => a - b);
        if (keys.length === 0) return false;
        const idx = keys.indexOf(this.currentSlot);
        let next = idx + direction;
        if (next < 0) next = keys.length - 1;
        if (next >= keys.length) next = 0;
        this.currentSlot = keys[next];
        this._updateUI();
        return true;
    }

    /* ------------------------------------------------------------------ */
    /*  Ammo                                                              */
    /* ------------------------------------------------------------------ */

    addAmmo(type, amount) {
        if (!this.ammo[type]) return 0;
        this.ammo[type].reserve += amount;
        return this.ammo[type].reserve;
    }

    getAmmo(type) {
        return this.ammo[type] || { clip: 0, reserve: 0 };
    }

    /* ------------------------------------------------------------------ */
    /*  Firing                                                            */
    /* ------------------------------------------------------------------ */

    canFire() {
        if (this.isReloading) return false;
        if (this.fireCooldown > 0) return false;
        const w = this.getCurrentWeapon();
        if (!w) return false;
        // Delegate to weapon object if it has its own state
        if (w.canFire && typeof w.canFire === 'function') return w.canFire();
        if (w.type === 'melee') return true;
        const eff = this._getEffectiveStats();
        const ammo = this.ammo[w.ammoType];
        const effectiveClip = eff ? Math.round(eff.clipSize) : (w.clipSize || 10);
        return ammo && ammo.clip > 0 && ammo.clip <= effectiveClip;
    }

    fire(origin, direction) {
        if (!this.canFire()) return false;
        const w = this.getCurrentWeapon();
        if (!w) return false;

        let result = null;
        if (w.fire && typeof w.fire === 'function') {
            result = w.fire(origin, direction);
        } else if (w.type === 'melee') {
            this._fireMelee(w, origin, direction);
        } else if (w.type === 'projectile') {
            this._fireProjectile(w, origin, direction);
        } else if (w.type === 'hitscan') {
            this._fireHitscan(w, origin, direction);
        }

        // Handle rich weapon return values (shotgun, melee, sticky)
        if (result) {
            if (result.type === 'shotgun' && result.projectiles) {
                for (const p of result.projectiles) this._fireProjectile(p, p.origin, p.direction);
            } else if (result.type === 'melee') {
                this._fireMelee(result, origin, direction);
            } else if (result.type === 'projectile') {
                this._fireProjectile(result, origin, direction);
            }
        }

        // Consume ammo
        if (w.ammoType) {
            const ammo = this.ammo[w.ammoType];
            if (ammo) ammo.clip--;
        }

        const eff = this._getEffectiveStats();
        const fireRate = eff ? eff.fireRate : (w.fireRate || w.attackSpeed || 5);
        this.fireCooldown = 1 / fireRate;
        this._updateUI();
        return true;
    }

    startReload() {
        const w = this.getCurrentWeapon();
        if (!w || w.type === 'melee' || this.isReloading) return false;
        const eff = this._getEffectiveStats();
        const reloadTime = eff ? eff.reloadTime : (w.reloadTime || 1.5);
        const clipSize = eff ? Math.round(eff.clipSize) : (w.clipSize || 10);
        if (w.reload && typeof w.reload === 'function') {
            const did = w.reload();
            if (did) { this.isReloading = true; this.reloadTimer = reloadTime; }
            return did;
        }
        const ammo = this.ammo[w.ammoType];
        if (!ammo || ammo.reserve <= 0 || ammo.clip >= clipSize) return false;

        this.isReloading = true;
        this.reloadTimer = reloadTime;
        return true;
    }

    /* ------------------------------------------------------------------ */
    /*  Per-frame update                                                  */
    /* ------------------------------------------------------------------ */

    update(dt, input) {
        if (this.fireCooldown > 0) this.fireCooldown -= dt;
        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this._finishReload();
            }
        }

        // Update active weapon visual / cooldowns
        const w = this.getCurrentWeapon();
        if (w && w.update && typeof w.update === 'function') w.update(dt);

        // Input: scroll wheel cycles
        if (input && input.wasPressed && input.wasPressed('ScrollUp')) this.cycleSlot(-1);
        if (input && input.wasPressed && input.wasPressed('ScrollDown')) this.cycleSlot(1);

        // Input: number keys switch slots (skip if speedrun IL digits are in use)
        if (input && input.wasPressed && !document.getElementById('speedrun-panel')) {
            if (input.wasPressed('Digit1')) this.switchSlot(WEAPON_SLOTS.MELEE);
            if (input.wasPressed('Digit2')) this.switchSlot(WEAPON_SLOTS.SIDEARM);
            if (input.wasPressed('Digit3')) this.switchSlot(WEAPON_SLOTS.PRIMARY);
            if (input.wasPressed('Digit4')) this.switchSlot(WEAPON_SLOTS.HEAVY);
            if (input.wasPressed('Digit5')) this.switchSlot(WEAPON_SLOTS.THROWABLE);
        }
        if (input && input.wasPressed && input.wasPressed('KeyR')) this.startReload();
    }

    /* ------------------------------------------------------------------ */
    /*  Internal firing implementations                                   */
    /* ------------------------------------------------------------------ */

    _fireMelee(weapon, origin, direction) {
        if (!this.hitboxSystem) return;
        const { Hitbox } = this._getHitboxCtor();
        if (!Hitbox) return;
        const eff = this._getEffectiveStats();
        const damage = eff ? eff.damage : (weapon.damage || 15);
        const range = eff ? eff.range : (weapon.range || 1.2);

        const offset = direction.clone().multiplyScalar(0.8);
        offset.y = 0.5;
        const hb = new Hitbox(
            this.player, 'melee',
            { type: 'sphere', radius: range },
            offset, 0.15,
            (hitbox, target) => {
                if (target && target.takeDamage) {
                    target.takeDamage(damage, 'kinetic', this.player);
                }
            }
        );
        hb.damage = damage;
        hb.team = 'player';
        this.hitboxSystem.registerHitbox(hb);
    }

    _fireProjectile(weapon, origin, direction) {
        if (!this.projectileManager) return;
        const eff = this._getEffectiveStats();
        const speed = eff ? eff.projectileSpeed : (weapon.projectileSpeed || 40);
        const range = eff ? eff.range : (weapon.range || 30);
        const damage = eff ? eff.damage : (weapon.damage || 20);
        const spread = eff ? eff.spread : (weapon.spread || 0);

        // Apply spread to direction
        let fireDir = direction.clone().normalize();
        if (spread > 0) {
            fireDir.x += (Math.random() - 0.5) * spread;
            fireDir.y += (Math.random() - 0.5) * spread;
            fireDir.z += (Math.random() - 0.5) * spread;
            fireDir.normalize();
        }

        this.projectileManager.fire(origin, fireDir, {
            speed,
            range,
            radius: 0.15,
            damage,
            damageType: weapon.damageType || 'kinetic',
            color: weapon.color || 0xffffff,
            onHit: (target) => {
                if (target && target.takeDamage) {
                    target.takeDamage(damage, weapon.damageType || 'kinetic', this.player);
                }
            }
        });
    }

    _fireHitscan(weapon, origin, direction) {
        // Simple raycast hitscan — for now, approximate with short-lived hitbox
        if (!this.hitboxSystem) return;
        const { Hitbox } = this._getHitboxCtor();
        if (!Hitbox) return;
        const eff = this._getEffectiveStats();
        const damage = eff ? eff.damage : (weapon.damage || 20);
        const range = eff ? eff.range : (weapon.range || 20);

        const offset = direction.clone().multiplyScalar(range);
        offset.y = 0.5;
        const hb = new Hitbox(
            this.player, 'projectile',
            { type: 'sphere', radius: 0.2 },
            offset, 0.02,
            (hitbox, target) => {
                if (target && target.takeDamage) {
                    target.takeDamage(damage, weapon.damageType || 'kinetic', this.player);
                }
            }
        );
        hb.damage = damage;
        hb.team = 'player';
        this.hitboxSystem.registerHitbox(hb);
    }

    _finishReload() {
        const w = this.getCurrentWeapon();
        if (!w || !w.ammoType) { this.isReloading = false; return; }
        const ammo = this.ammo[w.ammoType];
        if (!ammo) { this.isReloading = false; return; }

        const eff = this._getEffectiveStats();
        const clipSize = eff ? Math.round(eff.clipSize) : (w.clipSize || 10);
        const needed = clipSize - ammo.clip;
        const taken = Math.min(needed, ammo.reserve);
        ammo.clip += taken;
        ammo.reserve -= taken;
        this.isReloading = false;
        this._updateUI();
    }

    _getHitboxCtor() {
        // Lazy access to avoid circular import issues
        try {
            return { Hitbox: null }; // main.js passes hitboxSystem, we use it directly
        } catch (e) {
            return { Hitbox: null };
        }
    }

    /* ------------------------------------------------------------------ */
    /*  UI                                                                */
    /* ------------------------------------------------------------------ */

    _buildUI() {
        const container = document.getElementById('ui');
        if (!container) return;

        const wrap = document.createElement('div');
        wrap.id = 'weapon-bar';
        wrap.style.cssText =
            'position:absolute;bottom:82px;left:50%;transform:translateX(-50%);' +
            'display:flex;gap:4px;z-index:10;';

        for (let i = 1; i <= 5; i++) {
            const slot = document.createElement('div');
            slot.id = `weapon-slot-${i}`;
            slot.style.cssText =
                'width:40px;height:40px;background:rgba(0,0,0,0.6);' +
                'border:1px solid rgba(255,255,255,0.2);border-radius:3px;' +
                'display:flex;align-items:center;justify-content:center;' +
                'font-family:monospace;font-size:10px;color:#aaa;';
            slot.textContent = String(i);
            wrap.appendChild(slot);
        }

        container.appendChild(wrap);
    }

    _updateUI() {
        for (let i = 1; i <= 5; i++) {
            const el = document.getElementById(`weapon-slot-${i}`);
            if (!el) continue;
            const w = this.slots.get(i);
            const isActive = i === this.currentSlot;
            el.style.borderColor = isActive ? '#44ff88' : 'rgba(255,255,255,0.2)';
            el.textContent = w ? (w.shortName || w.name || String(i)) : String(i);
            if (w && w.ammoType) {
                const ammo = this.ammo[w.ammoType];
                el.title = `${w.name || 'Weapon'} — ${ammo.clip}/${ammo.reserve}`;
            }
        }
    }
}
