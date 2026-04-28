/**
 * SkillCallbacks — wires all 25 archetype skill execution callbacks into SkillSystem.
 *
 * Called from main.js after all dependencies are instantiated.
 */

import * as THREE from 'three';

export function wireSkillCallbacks(ctx) {
    const {
        skillSystem, staminaSystem, Hitbox, hitboxSystem,
        world, player, projectileManager, resourceSystem,
        particleEffects, legendaryPowerSystem, gamepad,
        scene, audio, spawnDamageNumber, activeArchetypeId,
        nephalemGlory, enemyHealthBars, characterSheet,
        postProcessing
    } = ctx;

    // ------------------------------------------------------------------
    // Traceur callbacks
    // ------------------------------------------------------------------
    skillSystem.onExecute('light_strike', (skill, targetPos, p) => {
        if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.lightAttack)) return;
        if (staminaSystem) staminaSystem.spend(staminaSystem.costs.lightAttack);
        const attackDir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
        const offset = attackDir.multiplyScalar(0.8);
        offset.y = 0.5;
        const hitbox = new Hitbox(
            p, 'melee', { type: 'sphere', radius: 0.6 }, offset, 0.15,
            (hb, target) => {
                if (target && typeof spawnDamageNumber === 'function') {
                    const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                    spawnDamageNumber(tPos, Math.round(skill.finalDamage || 15), false, 'kinetic');
                }
                if (target && legendaryPowerSystem) legendaryPowerSystem.onMeleeHit(target);
            }
        );
        hitbox.damage = skill.finalDamage || 15;
        hitbox.team = 'player';
        hitboxSystem.registerHitbox(hitbox);
        if (gamepad && gamepad.rumble) gamepad.rumble(0.1, 0.4, 50);
    });

    skillSystem.onExecute('dive_kick', (skill, targetPos, p) => {
        if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.heavyAttack)) return;
        if (staminaSystem) staminaSystem.spend(staminaSystem.costs.heavyAttack);
        if (p.startDiveKick) p.startDiveKick();
        const offset = new THREE.Vector3(0, -0.5, 0);
        const hitbox = new Hitbox(
            p, 'melee', { type: 'sphere', radius: 1.2 }, offset, 0.3,
            (hb, target) => {
                if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 50, 'kinetic', p);
                if (target && typeof spawnDamageNumber === 'function') {
                    const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                    spawnDamageNumber(tPos, Math.round(skill.finalDamage || 50), false, 'kinetic');
                }
            }
        );
        hitbox.damage = skill.finalDamage || 50;
        hitbox.team = 'player';
        hitboxSystem.registerHitbox(hitbox);
    });

    skillSystem.onExecute('air_dash', (skill, targetPos, p) => {
        const moveDir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
        if (p.startAirDash) p.startAirDash(moveDir);
    });

    skillSystem.onExecute('slide_tackle', (skill, targetPos, p) => {
        if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.lightAttack)) return;
        if (staminaSystem) staminaSystem.spend(staminaSystem.costs.lightAttack);
        const moveDir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
        if (p.startSlide) p.startSlide(moveDir);
        const hitbox = new Hitbox(
            p, 'melee', { type: 'sphere', radius: 0.8 }, new THREE.Vector3(0, 0.3, 0), 0.5,
            (hb, target) => {
                if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 30, 'kinetic', p);
                if (target && typeof spawnDamageNumber === 'function') {
                    const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                    spawnDamageNumber(tPos, Math.round(skill.finalDamage || 30), false, 'kinetic');
                }
            }
        );
        hitbox.damage = skill.finalDamage || 30;
        hitbox.team = 'player';
        hitboxSystem.registerHitbox(hitbox);
    });

    skillSystem.onExecute('ground_pound', (skill, targetPos, p) => {
        if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.heavyAttack)) return;
        if (staminaSystem) staminaSystem.spend(staminaSystem.costs.heavyAttack);
        if (p.startGroundPound) p.startGroundPound();
        const hitbox = new Hitbox(
            p, 'explosion', { type: 'sphere', radius: 5.0 }, new THREE.Vector3(0, 0, 0), 0.4,
            (hb, target) => {
                if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 80, 'explosive', p);
                if (target && typeof spawnDamageNumber === 'function') {
                    const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                    spawnDamageNumber(tPos, Math.round(skill.finalDamage || 80), false, 'explosive');
                }
            }
        );
        hitbox.damage = skill.finalDamage || 80;
        hitbox.team = 'player';
        hitboxSystem.registerHitbox(hitbox);
        if (gamepad && gamepad.rumble) gamepad.rumble(0.5, 1.0, 200);
    });

    // ------------------------------------------------------------------
    // Operative callbacks
    // ------------------------------------------------------------------
    skillSystem.onExecute('silenced_pistol', (skill, targetPos, p) => {
        const dir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
        projectileManager.fire(p.position.clone().add(new THREE.Vector3(0, 1.2, 0)), dir, {
            speed: 60, range: 25, radius: 0.15, damage: skill.finalDamage || 12,
            damageType: 'kinetic', color: 0x00ccff,
            onHit: (target) => {
                if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 12, 'kinetic', p);
                const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                spawnDamageNumber(tPos, Math.round(skill.finalDamage || 12), false, 'kinetic');
            }
        });
    });

    skillSystem.onExecute('ghost_bullet', (skill, targetPos, p) => {
        const dir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
        projectileManager.firePiercing(p.position.clone().add(new THREE.Vector3(0, 1.2, 0)), dir, {
            range: 25, radius: 0.5, damage: skill.finalDamage || 60,
            damageType: 'energy', color: 0x00ffcc,
            onHit: (target) => {
                if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 60, 'energy', p);
                const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                spawnDamageNumber(tPos, Math.round(skill.finalDamage || 60), false, 'energy');
            }
        });
    });

    skillSystem.onExecute('predator_vision', (skill, targetPos, p) => {
        p._predatorVisionActive = true;
        p._critBonusFromPredator = 0.15;
        const overlay = document.getElementById('glory-overlay');
        if (overlay) { overlay.style.background = 'rgba(0,100,255,0.12)'; overlay.style.opacity = '0.12'; }
        enemyHealthBars.forEach(bar => { if (bar && bar.sprite) bar.sprite.visible = true; });
        setTimeout(() => {
            p._predatorVisionActive = false;
            p._critBonusFromPredator = 0;
            if (overlay) { overlay.style.background = ''; overlay.style.opacity = '0'; }
        }, 6000);
    });

    skillSystem.onExecute('smoke_bomb', (skill, targetPos, p) => {
        particleEffects.explosion(p.position.clone(), 0x333333, 15);
        p.isInvisible = true;
        const overlay = document.getElementById('glory-overlay');
        if (overlay) { overlay.style.background = 'rgba(0,0,0,0.4)'; overlay.style.opacity = '0.3'; }
        const drones = world.drones ? world.drones.drones : [];
        for (const drone of drones) {
            const pos = drone.position || (drone.mesh && drone.mesh.position);
            if (pos && pos.distanceTo(p.position) < 4) {
                drone._smokeBlind = true;
                setTimeout(() => { drone._smokeBlind = false; }, 3000);
            }
        }
        setTimeout(() => {
            p.isInvisible = false;
            if (overlay) { overlay.style.background = ''; overlay.style.opacity = '0'; }
        }, 3000);
    });

    skillSystem.onExecute('assassinate', (skill, targetPos, p) => {
        const drones = world.drones ? world.drones.drones : [];
        let nearest = null, nearestDist = Infinity;
        for (const drone of drones) {
            if (drone.isDead) continue;
            const pos = drone.position || (drone.mesh && drone.mesh.position);
            if (!pos) continue;
            const dist = pos.distanceTo(p.position);
            if (dist < 15 && dist < nearestDist) { nearest = drone; nearestDist = dist; }
        }
        if (nearest) {
            const tPos = nearest.position || (nearest.mesh && nearest.mesh.position);
            const behind = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing)).normalize();
            p.position.copy(tPos).sub(behind.multiplyScalar(1.2));
            p.position.y = Math.max(p.position.y, 0.5);
            const hitbox = new Hitbox(
                p, 'melee', { type: 'sphere', radius: 0.8 }, new THREE.Vector3(0, 0.3, 0), 0.15,
                (hb, target) => {
                    if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 200, 'kinetic', p);
                    const tp = target.position || (target.mesh && target.mesh.position) || p.position;
                    spawnDamageNumber(tp, Math.round(skill.finalDamage || 200), false, 'kinetic');
                }
            );
            hitbox.damage = skill.finalDamage || 200;
            hitbox.team = 'player';
            hitboxSystem.registerHitbox(hitbox);
            postProcessing.shake(0.6, 0.3);
        }
    });

    // ------------------------------------------------------------------
    // Saboteur callbacks
    // ------------------------------------------------------------------
    skillSystem.onExecute('scrap_throw', (skill, targetPos, p) => {
        const dir = new THREE.Vector3(Math.sin(p.facing), 0.1, Math.cos(p.facing)).normalize();
        projectileManager.fire(p.position.clone().add(new THREE.Vector3(0, 1.0, 0)), dir, {
            speed: 25, range: 12, radius: 0.25, damage: skill.finalDamage || 18,
            damageType: 'kinetic', color: 0xff3333,
            onHit: (target) => {
                if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 18, 'kinetic', p);
                const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                spawnDamageNumber(tPos, Math.round(skill.finalDamage || 18), false, 'kinetic');
            }
        });
    });

    skillSystem.onExecute('grenade_toss', (skill, targetPos, p) => {
        const start = p.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const dir = new THREE.Vector3(Math.sin(p.facing), 0.4, Math.cos(p.facing)).normalize();
        const end = start.clone().add(dir.multiplyScalar(10));
        projectileManager.fireLob(start, end, {
            fuse: 1.5,
            radius: 0.2,
            color: 0xff3333,
            damage: skill.finalDamage || 55,
            damageType: 'explosive',
            onExpire: (proj) => {
                const explodeAt = proj.mesh.position.clone();
                particleEffects.explosion(explodeAt, 0xff5500, 25);
                const hitbox = new Hitbox(
                    { position: explodeAt }, 'explosion', { type: 'sphere', radius: 4 }, new THREE.Vector3(0, 0, 0), 0.3,
                    (hb, target) => {
                        if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 55, 'explosive', p);
                        const tp = target.position || (target.mesh && target.mesh.position) || explodeAt;
                        spawnDamageNumber(tp, Math.round(skill.finalDamage || 55), false, 'explosive');
                    }
                );
                hitbox.damage = skill.finalDamage || 55;
                hitbox.team = 'player';
                hitboxSystem.registerHitbox(hitbox);
            }
        });
    });

    skillSystem.onExecute('proxy_mine', (skill, targetPos, p) => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9 })
        );
        mesh.position.copy(p.position);
        mesh.position.y = 0.15;
        scene.add(mesh);
        const mine = { mesh, placedAt: performance.now(), exploded: false };
        if (!world._proximityMines) world._proximityMines = [];
        world._proximityMines.push(mine);
        setTimeout(() => {
            if (!mine.exploded) {
                mine.exploded = true;
                scene.remove(mesh);
                mesh.geometry.dispose(); mesh.material.dispose();
                const idx = world._proximityMines.indexOf(mine);
                if (idx >= 0) world._proximityMines.splice(idx, 1);
            }
        }, 30000);
    });

    skillSystem.onExecute('decoy', (skill, targetPos, p) => {
        const forward = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing)).multiplyScalar(3);
        const origin = p.position.clone().add(forward);
        origin.y = 0.5;
        const explodeDecoy = (decoy) => {
            if (!decoy || !decoy.mesh) return;
            const pos = decoy.mesh.position.clone();
            particleEffects.explosion(pos, 0xffaa00, 20);
            const hitbox = new Hitbox(
                { position: pos }, 'explosion', { type: 'sphere', radius: 3 }, new THREE.Vector3(0, 0, 0), 0.3
            );
            hitbox.damage = 30;
            hitbox.team = 'player';
            hitboxSystem.registerHitbox(hitbox);
        };
        const decoy = projectileManager.fireDecoy(origin, {
            mesh: p.mesh,
            health: 30,
            lifetime: 5,
            onDestroyed: explodeDecoy,
            onExpired: explodeDecoy
        });
        const drones = world.drones ? world.drones.drones : [];
        for (const drone of drones) {
            const pos = drone.position || (drone.mesh && drone.mesh.position);
            if (pos && pos.distanceTo(origin) < 10) drone._decoyTarget = decoy;
        }
    });

    skillSystem.onExecute('zero_cooldown', (skill, targetPos, p) => {
        skillSystem.setNoCooldown(true);
        resourceSystem.costMultiplier = 0;
        setTimeout(() => {
            skillSystem.setNoCooldown(false);
            resourceSystem.costMultiplier = 1.0;
        }, 5000);
    });

    // ------------------------------------------------------------------
    // Specimen callbacks
    // ------------------------------------------------------------------
    skillSystem.onExecute('claw_swipe', (skill, targetPos, p) => {
        if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.lightAttack)) return;
        if (staminaSystem) staminaSystem.spend(staminaSystem.costs.lightAttack);
        const forward = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
        let hits = 0;
        const hitbox = new Hitbox(
            p, 'melee', { type: 'sphere', radius: 1.5 }, new THREE.Vector3(0, 0.3, 0), 0.2,
            (hb, target) => {
                if (hits >= 3) return;
                const tPos = target.position || (target.mesh && target.mesh.position);
                if (!tPos) return;
                const toTarget = tPos.clone().sub(p.position).normalize();
                const dot = forward.dot(toTarget);
                if (dot > 0) {
                    hits++;
                    if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 20, 'kinetic', p);
                    spawnDamageNumber(tPos, Math.round(skill.finalDamage || 20), false, 'kinetic');
                    if (legendaryPowerSystem) legendaryPowerSystem.onMeleeHit(target);
                }
            }
        );
        hitbox.damage = skill.finalDamage || 20;
        hitbox.team = 'player';
        hitboxSystem.registerHitbox(hitbox);
        if (gamepad && gamepad.rumble) gamepad.rumble(0.1, 0.4, 50);
    });

    skillSystem.onExecute('berserk_lunge', (skill, targetPos, p) => {
        if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.heavyAttack)) return;
        if (staminaSystem) staminaSystem.spend(staminaSystem.costs.heavyAttack);
        const drones = world.drones ? world.drones.drones : [];
        let nearest = null, nearestDist = Infinity;
        for (const drone of drones) {
            if (drone.isDead) continue;
            const pos = drone.position || (drone.mesh && drone.mesh.position);
            if (!pos) continue;
            const dist = pos.distanceTo(p.position);
            if (dist < 15 && dist < nearestDist) { nearest = drone; nearestDist = dist; }
        }
        if (nearest) {
            const tPos = nearest.position || (nearest.mesh && nearest.mesh.position);
            p.position.copy(tPos);
            p.position.y = Math.max(p.position.y, 0.5);
            postProcessing.shake(0.8, 0.3);
            const hitbox = new Hitbox(
                p, 'melee', { type: 'sphere', radius: 3 }, new THREE.Vector3(0, 0, 0), 0.3,
                (hb, target) => {
                    if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 65, 'kinetic', p);
                    const tp = target.position || (target.mesh && target.mesh.position) || p.position;
                    spawnDamageNumber(tp, Math.round(skill.finalDamage || 65), false, 'kinetic');
                }
            );
            hitbox.damage = skill.finalDamage || 65;
            hitbox.team = 'player';
            hitboxSystem.registerHitbox(hitbox);
            if (gamepad && gamepad.rumble) gamepad.rumble(0.5, 1.0, 200);
        }
    });

    skillSystem.onExecute('roar', (skill, targetPos, p) => {
        if (staminaSystem && !staminaSystem.canSpend(staminaSystem.costs.lightAttack)) return;
        if (staminaSystem) staminaSystem.spend(staminaSystem.costs.lightAttack);
        const drones = world.drones ? world.drones.drones : [];
        for (const drone of drones) {
            const pos = drone.position || (drone.mesh && drone.mesh.position);
            if (pos && pos.distanceTo(p.position) < 6) {
                drone._feared = true;
                setTimeout(() => { drone._feared = false; }, 2000);
            }
        }
        if (audio && audio.ctx) {
            const t = audio.ctx.currentTime;
            const dest = audio._makeDestination();
            const osc = audio.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
            const gain = audio.ctx.createGain();
            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.connect(gain); gain.connect(dest);
            osc.start(t); osc.stop(t + 0.5);
        }
    });

    skillSystem.onExecute('adrenaline_rush', (skill, targetPos, p) => {
        p.moveSpeedMultiplier *= 1.5;
        p._regenPerSecond += 0.05 * p.maxHealth;
        setTimeout(() => {
            p.moveSpeedMultiplier /= 1.5;
            p._regenPerSecond -= 0.05 * p.maxHealth;
        }, 5000);
    });

    skillSystem.onExecute('primal_surge', (skill, targetPos, p) => {
        characterSheet.addTempBonus('primal_surge', 'damageMultiplier', 1.0, 6);
        p.moveSpeedMultiplier *= 1.5;
        p._staggerImmune = true;
        const overlay = document.getElementById('glory-overlay');
        if (overlay) { overlay.style.background = 'rgba(255,0,0,0.2)'; overlay.style.opacity = '0.2'; }
        setTimeout(() => {
            characterSheet.removeTempBonus('primal_surge');
            p.moveSpeedMultiplier /= 1.5;
            p._staggerImmune = false;
            if (overlay) { overlay.style.background = ''; overlay.style.opacity = '0'; }
        }, 6000);
    });

    // ------------------------------------------------------------------
    // Netrunner callbacks
    // ------------------------------------------------------------------
    skillSystem.onExecute('zap', (skill, targetPos, p) => {
        projectileManager.fireChainLightning(p.position.clone().add(new THREE.Vector3(0, 1, 0)), null, {
            maxChains: 1, jumpRange: 6, damage: skill.finalDamage || 14,
            damageType: 'electric', color: 0xaa66ff,
            onHit: (target, dmg) => {
                if (target && target.takeDamage) target.takeDamage(dmg, 'electric', p);
                const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                spawnDamageNumber(tPos, Math.round(dmg), false, 'electric');
            }
        });
    });

    skillSystem.onExecute('hack_drone', (skill, targetPos, p) => {
        const drones = world.drones ? world.drones.drones : [];
        let nearest = null, nearestDist = Infinity;
        for (const drone of drones) {
            if (drone.isDead || drone.team === 'player') continue;
            const pos = drone.position || (drone.mesh && drone.mesh.position);
            if (!pos) continue;
            const dist = pos.distanceTo(p.position);
            if (dist < 12 && dist < nearestDist) { nearest = drone; nearestDist = dist; }
        }
        if (nearest) {
            nearest.team = 'player';
            nearest._hackExpiry = 8;
            spawnDamageNumber((nearest.position || nearest.mesh.position).clone().add(new THREE.Vector3(0, 1, 0)), 'HACKED', false, 'electric');
        }
    });

    skillSystem.onExecute('emp_pulse', (skill, targetPos, p) => {
        const hitbox = new Hitbox(
            p, 'explosion', { type: 'sphere', radius: 5 }, new THREE.Vector3(0, 0, 0), 0.3,
            (hb, target) => {
                if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 30, 'electric', p);
                target._disabled = true;
                setTimeout(() => { target._disabled = false; }, 3000);
                const tp = target.position || (target.mesh && target.mesh.position) || p.position;
                spawnDamageNumber(tp, Math.round(skill.finalDamage || 30), false, 'electric');
            }
        );
        hitbox.damage = skill.finalDamage || 30;
        hitbox.team = 'player';
        hitboxSystem.registerHitbox(hitbox);
        const ringGeo = new THREE.RingGeometry(0.1, 0.2, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(p.position); ring.rotation.x = -Math.PI / 2;
        scene.add(ring);
        let life = 0.5;
        const anim = () => {
            life -= 0.016;
            const s = 1 + (0.5 - life) * 20;
            ring.scale.set(s, s, s);
            ringMat.opacity = Math.max(0, life / 0.5);
            if (life > 0) requestAnimationFrame(anim);
            else { scene.remove(ring); ringGeo.dispose(); ringMat.dispose(); }
        };
        anim();
    });

    skillSystem.onExecute('firewall', (skill, targetPos, p) => {
        p._firewallActive = true;
        const geo = new THREE.SphereGeometry(1.2, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.25, wireframe: true });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(p.position);
        scene.add(mesh);
        const interval = setInterval(() => { mesh.position.copy(p.position); }, 16);
        setTimeout(() => {
            clearInterval(interval);
            p._firewallActive = false;
            scene.remove(mesh);
            geo.dispose(); mat.dispose();
        }, 4000);
    });

    skillSystem.onExecute('swarm_override', (skill, targetPos, p) => {
        const drones = world.drones ? world.drones.drones : [];
        for (const drone of drones) {
            const pos = drone.position || (drone.mesh && drone.mesh.position);
            if (!pos || pos.distanceTo(p.position) > 15) continue;
            drone.team = 'player';
            drone._hackExpiry = 8;
            particleEffects.explosion(pos.clone(), 0xaa66ff, 8);
        }
    });

    // ------------------------------------------------------------------
    // Mage callbacks
    // ------------------------------------------------------------------
    skillSystem.onExecute('arcane_bolt', (skill, targetPos, p) => {
        const dir = new THREE.Vector3(Math.sin(p.facing), 0, Math.cos(p.facing));
        const origin = p.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        projectileManager.fire(origin, dir, {
            speed: 55, range: 20, radius: 0.12, damage: skill.finalDamage || 18,
            damageType: 'magic', color: 0xaa44ff,
            onHit: (target) => {
                if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 18, 'magic', p);
                const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                spawnDamageNumber(tPos, Math.round(skill.finalDamage || 18), false, 'magic');
            }
        });
    });

    skillSystem.onExecute('fireball', (skill, targetPos, p) => {
        const start = p.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const dir = new THREE.Vector3(Math.sin(p.facing), 0.1, Math.cos(p.facing)).normalize();
        const end = start.clone().add(dir.multiplyScalar(18));
        let t = 0;
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff4400 })
        );
        mesh.position.copy(start);
        scene.add(mesh);
        const duration = 1.2;
        const timer = setInterval(() => {
            t += 0.05;
            const frac = Math.min(1, t / duration);
            mesh.position.lerpVectors(start, end, frac);
            mesh.position.y += Math.sin(frac * Math.PI) * 1.5;
            if (frac >= 1) {
                clearInterval(timer);
                scene.remove(mesh);
                mesh.geometry.dispose(); mesh.material.dispose();
                particleEffects.explosion(mesh.position.clone(), 0xff4400, 30);
                const hitbox = new Hitbox(
                    { position: mesh.position }, 'explosion', { type: 'sphere', radius: 3 }, new THREE.Vector3(0, 0, 0), 0.3,
                    (hb, target) => {
                        if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 70, 'magic', p);
                        const tp = target.position || (target.mesh && target.mesh.position) || mesh.position;
                        spawnDamageNumber(tp, Math.round(skill.finalDamage || 70), false, 'magic');
                    }
                );
                hitbox.damage = skill.finalDamage || 70;
                hitbox.team = 'player';
                hitboxSystem.registerHitbox(hitbox);
            }
        }, 50);
    });

    skillSystem.onExecute('frost_armor', (skill, targetPos, p) => {
        const absorb = Math.floor((p.maxHealth || 100) * 0.25);
        p._frostArmorAbsorb = absorb;
        const geo = new THREE.SphereGeometry(1.0, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.3, wireframe: true });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(p.position);
        scene.add(mesh);
        const interval = setInterval(() => { mesh.position.copy(p.position); }, 16);
        setTimeout(() => {
            clearInterval(interval);
            p._frostArmorAbsorb = 0;
            scene.remove(mesh);
            geo.dispose(); mat.dispose();
        }, 6000);
    });

    skillSystem.onExecute('lightning_chain', (skill, targetPos, p) => {
        projectileManager.fireChainLightning(p.position.clone().add(new THREE.Vector3(0, 1, 0)), null, {
            maxChains: 4, jumpRange: 8, damage: skill.finalDamage || 45,
            damageType: 'electric', color: 0xffff00,
            onHit: (target, dmg) => {
                if (target && target.takeDamage) target.takeDamage(dmg, 'electric', p);
                const tPos = target.position || (target.mesh && target.mesh.position) || p.position;
                spawnDamageNumber(tPos, Math.round(dmg), false, 'electric');
            }
        });
    });

    skillSystem.onExecute('void_rift', (skill, targetPos, p) => {
        const riftPos = p.position.clone().add(new THREE.Vector3(Math.sin(p.facing) * 4, 0.5, Math.cos(p.facing) * 4));
        const geo = new THREE.RingGeometry(0.5, 1.5, 32);
        const mat = new THREE.MeshBasicMaterial({ color: 0x440088, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(riftPos);
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);
        let life = 3.0;
        const pullInterval = setInterval(() => {
            const drones = world.drones ? world.drones.drones : [];
            for (const drone of drones) {
                const pos = drone.position || (drone.mesh && drone.mesh.position);
                if (!pos || pos.distanceTo(riftPos) > 6) continue;
                const pullDir = riftPos.clone().sub(pos).normalize();
                if (drone.group) drone.group.position.addScaledVector(pullDir, 3 * 0.05);
            }
        }, 50);
        const anim = () => {
            life -= 0.016;
            mesh.rotation.z += 0.05;
            mat.opacity = Math.max(0, life / 3.0 * 0.7);
            if (life > 0) requestAnimationFrame(anim);
            else {
                clearInterval(pullInterval);
                scene.remove(mesh);
                geo.dispose(); mat.dispose();
                particleEffects.explosion(riftPos.clone(), 0x440088, 35);
                const hitbox = new Hitbox(
                    { position: riftPos }, 'explosion', { type: 'sphere', radius: 5 }, new THREE.Vector3(0, 0, 0), 0.4,
                    (hb, target) => {
                        if (target && target.takeDamage) target.takeDamage(skill.finalDamage || 120, 'magic', p);
                        const tp = target.position || (target.mesh && target.mesh.position) || riftPos;
                        spawnDamageNumber(tp, Math.round(skill.finalDamage || 120), false, 'magic');
                    }
                );
                hitbox.damage = skill.finalDamage || 120;
                hitbox.team = 'player';
                hitboxSystem.registerHitbox(hitbox);
            }
        };
        anim();
    });
}
