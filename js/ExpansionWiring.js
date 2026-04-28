/**
 * ExpansionWiring — init-time wiring and per-frame helpers for expansion systems.
 * Extracted from main.js to keep the composition root under the file size limit.
 */

import * as THREE from 'three';
import { Hitbox } from './HitboxSystem.js';

export function wireExpansionSystems(deps) {
    const {
        world, eliteModifierSystem, hitboxSystem, scene, enemyHealthBars,
        nephalemGlory, buildCodeSystem, showHint
    } = deps;

    // Wire drone death & elite modifiers
    if (world.drones && world.drones.drones) {
        world.drones.drones.forEach(drone => {
            if (drone && !drone.onDeath) {
                if (eliteModifierSystem && Math.random() < 0.10) {
                    eliteModifierSystem.makeElite(drone, 1);
                }
                drone.onDeath = (enemy, source) => {
                    if (deps.onEnemyKilled) deps.onEnemyKilled(enemy, source);
                    if (eliteModifierSystem) eliteModifierSystem.onDroneDeath(enemy, enemy.position);
                };
                drone.onDamageTaken = (amount, type, source) => {
                    let finalAmount = amount;
                    if (eliteModifierSystem) {
                        finalAmount = eliteModifierSystem.onDroneDamaged(drone, amount, type, source);
                    }
                    const pos = drone.position ? drone.position.clone() : drone.mesh.position.clone();
                    pos.y += 1.0;
                    if (deps.spawnDamageNumber) deps.spawnDamageNumber(pos, Math.ceil(finalAmount), false, type);
                };
                const bar = new (deps.EnemyHealthBar || class { constructor(){} update(){} })(scene, drone);
                enemyHealthBars.push(bar);
                if (hitboxSystem) {
                    const hurtbox = new Hitbox(drone, 'hurtbox', { type: 'sphere', radius: 0.5 }, new THREE.Vector3(0, 0.4, 0), -1, null);
                    hurtbox.team = 'enemy';
                    hitboxSystem.registerHitbox(hurtbox);
                }
            }
        });
        if (nephalemGlory) nephalemGlory.setEnemyHealthBars(enemyHealthBars);
    }

    // Elite modifier death bomb callback
    if (eliteModifierSystem) {
        eliteModifierSystem._onDeathBomb = (data) => {
            if (deps.particleEffects) deps.particleEffects.explosion(data.position.clone(), 0xff6600, 20);
            const hb = new Hitbox(
                { position: data.position }, 'explosion',
                { type: 'sphere', radius: data.radius }, new THREE.Vector3(0, 0, 0), 0.3
            );
            hb.damage = 30; hb.team = 'enemy';
            if (hitboxSystem) hitboxSystem.registerHitbox(hb);
        };
    }

    // Build code UI wiring
    (function wireBuildCode() {
        const importBtn = document.getElementById('btn-import-build');
        const exportBtn = document.getElementById('btn-export-build');
        const input = document.getElementById('build-code-input');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const code = input ? input.value.trim() : '';
                const result = buildCodeSystem.importBuild(code);
                if (result.success) {
                    if (input) input.value = '';
                    showHint('Build imported successfully!');
                } else {
                    showHint('Invalid build code.');
                }
            });
        }
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const code = buildCodeSystem.exportBuild();
                if (input) input.value = code;
                navigator.clipboard.writeText(code).catch(() => {});
                showHint('Build code copied to clipboard!');
            });
        }
    })();
}

export function updateMeatShield(deps, finalDt, activeInput) {
    const { player, world } = deps;
    if (activeInput.isPressed('KeyE') && !player.isDead) {
        const drones = world.drones ? world.drones.drones : [];
        let shieldDrone = null;
        for (const drone of drones) {
            if (drone.isDead || drone.team !== 'player') continue;
            const pos = drone.position || (drone.mesh && drone.mesh.position);
            if (pos && pos.distanceTo(player.position) < 2.5) {
                shieldDrone = drone;
                break;
            }
        }
        if (shieldDrone) {
            if (!player._meatShield) player._meatShield = 50;
            const front = new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing)).multiplyScalar(1.2);
            const targetPos = player.position.clone().add(front);
            targetPos.y = Math.max(targetPos.y, 1);
            const sPos = shieldDrone.position || (shieldDrone.mesh && shieldDrone.mesh.position);
            if (sPos) sPos.lerp(targetPos, 0.1);
        }
    } else {
        player._meatShield = 0;
    }
}

export function updateShoulderBash(deps, finalDt) {
    const { player, world, enemyManager, spawnDamageNumber, gamepad } = deps;
    if (player.state !== 'SPRINT') return;
    if (!player._shoulderBashCooldown) player._shoulderBashCooldown = 0;
    player._shoulderBashCooldown -= finalDt;
    if (player._shoulderBashCooldown > 0) return;
    const allEnemies = [
        ...(world.drones ? world.drones.drones : []),
        ...(enemyManager ? enemyManager.enemies : [])
    ];
    for (const e of allEnemies) {
        if (e.isDead || e.team === 'player') continue;
        const pos = e.position || (e.mesh && e.mesh.position);
        if (!pos) continue;
        const dist = player.position.distanceTo(pos);
        if (dist < 1.5) {
            if (e.takeDamage) e.takeDamage(25, 'kinetic', player);
            if (spawnDamageNumber) spawnDamageNumber(pos.clone().add(new THREE.Vector3(0, 1, 0)), 25, false, 'kinetic');
            if (gamepad && gamepad.rumble) gamepad.rumble(0.3, 0.6, 80);
            player._shoulderBashCooldown = 1.0;
            break;
        }
    }
}

export function updateProxyMines(deps, finalDt) {
    const { world, scene, particleEffects, hitboxSystem } = deps;
    if (!world._proximityMines) return;
    for (let i = world._proximityMines.length - 1; i >= 0; i--) {
        const mine = world._proximityMines[i];
        if (mine.exploded) continue;
        const drones = world.drones ? world.drones.drones : [];
        for (const drone of drones) {
            if (drone.isDead) continue;
            const pos = drone.position || (drone.mesh && drone.mesh.position);
            if (pos && pos.distanceTo(mine.mesh.position) < 3) {
                mine.exploded = true;
                if (particleEffects) particleEffects.explosion(mine.mesh.position.clone(), 0xff3300, 20);
                const hb = new Hitbox(
                    { position: mine.mesh.position }, 'explosion', { type: 'sphere', radius: 3 }, new THREE.Vector3(0,0,0), 0.3
                );
                hb.damage = 40; hb.team = 'player';
                if (hitboxSystem) hitboxSystem.registerHitbox(hb);
                scene.remove(mine.mesh);
                mine.mesh.geometry.dispose(); mine.mesh.material.dispose();
                world._proximityMines.splice(i, 1);
                break;
            }
        }
    }
}

export function updateDecoys(deps, finalDt) {
    const { world } = deps;
    if (!world._decoys) return;
    for (const decoy of world._decoys) {
        if (decoy.isDead || !decoy.mesh) continue;
        const drones = world.drones ? world.drones.drones : [];
        for (const drone of drones) {
            if (drone._decoyTarget === decoy && !drone.isDead) {
                const pos = drone.position || (drone.mesh && drone.mesh.position);
                if (pos) {
                    const dir = decoy.mesh.position.clone().sub(pos).normalize();
                    drone.group.position.addScaledVector(dir, (drone.speed || 2.5) * finalDt);
                }
            }
        }
    }
}

export function updateExpansionSystems(deps, finalDt) {
    const {
        archetype, companion, territory, loyalty, npcSystem, blackout, rivals, mastery,
        subLevels, collapse, safehouse, bounty, codex, implants, legacy, ngPlus,
        consequences, debt, shop, factions, familiarity, apexRift, nephalemGlory,
        legendaryPowerSystem, projectileManager,
        wanderingVendor, dailyQuestSystem, graffitiCollectible, fastTravel,
        setBonusSystem, prestigeSystem, trainingDummy, lootVacuum, moddingAPI,
        exoSuit, player
    } = deps;

    if (archetype) archetype.update(finalDt);
    if (companion) companion.update(finalDt, player, deps.world, deps.world.drones ? deps.world.drones.drones : []);
    if (territory) territory.update(finalDt);
    if (loyalty && typeof loyalty.update === 'function') loyalty.update(finalDt);
    if (npcSystem && npcSystem.update) npcSystem.update(finalDt, 12);
    if (blackout && blackout.update) blackout.update(finalDt, 12);
    if (rivals && rivals.update) rivals.update(finalDt, player);
    if (mastery && mastery.update) mastery.update(finalDt, player);
    if (subLevels && subLevels.update) subLevels.update(finalDt, player);
    if (collapse && collapse.update) collapse.update(finalDt, player);
    if (safehouse && safehouse.update) safehouse.update(finalDt);
    if (bounty && bounty.update) bounty.update(finalDt, player);
    if (codex && codex.update) codex.update(finalDt, player);
    if (implants && implants.update) implants.update(finalDt, player);
    if (legacy && legacy.update) legacy.update(finalDt);
    if (ngPlus && ngPlus.update) ngPlus.update(finalDt);
    if (consequences && consequences.update) consequences.update(finalDt);
    if (debt && debt.update) debt.update(finalDt);
    if (shop && shop.update) shop.update(finalDt);
    if (factions && factions.update) factions.update(finalDt);
    if (familiarity && familiarity.update) familiarity.update(finalDt);
    if (apexRift) apexRift.update(finalDt);
    if (nephalemGlory) nephalemGlory.update(finalDt);
    if (legendaryPowerSystem) legendaryPowerSystem.update(finalDt);
    if (projectileManager) projectileManager.update(finalDt);

    // World & quest systems
    if (wanderingVendor) wanderingVendor.update(finalDt);
    if (dailyQuestSystem) dailyQuestSystem.save();
    if (graffitiCollectible) graffitiCollectible.update();
    if (fastTravel) fastTravel.update(finalDt);

    // RPG progression systems
    if (setBonusSystem) setBonusSystem.update(exoSuit);
    if (prestigeSystem) prestigeSystem.addXP(0);
    if (trainingDummy) trainingDummy.update(finalDt);
    if (lootVacuum) lootVacuum.update(finalDt);
    if (moddingAPI) moddingAPI.dispatch('preUpdate', finalDt);
}
