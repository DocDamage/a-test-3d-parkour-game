/**
 * ExpansionWiring — init-time wiring and per-frame helpers for expansion systems.
 * Extracted from main.js to keep the composition root under the file size limit.
 */

import * as THREE from 'three';
import { Hitbox } from './HitboxSystem.js';
import { updateLifecycle } from './Lifecycle.js';

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
    const { world, scene, particleEffects, hitboxSystem, enemyManager, predatorDrone } = deps;
    if (!world._proximityMines) return;
    for (let i = world._proximityMines.length - 1; i >= 0; i--) {
        const mine = world._proximityMines[i];
        if (mine.exploded) continue;
        const targets = [
            ...(world.drones ? world.drones.drones : []),
            ...(enemyManager ? enemyManager.enemies : []),
            ...(predatorDrone && predatorDrone.active ? [predatorDrone] : [])
        ];
        for (const target of targets) {
            if (target.isDead || target.team === 'player') continue;
            const pos = target.position || (target.mesh && target.mesh.position) || (target.group && target.group.position);
            if (pos && pos.distanceTo(mine.mesh.position) < 3) {
                mine.exploded = true;
                if (particleEffects) particleEffects.explosion(mine.mesh.position.clone(), 0xff3300, 20);
                const hb = new Hitbox(
                    { position: mine.mesh.position }, 'explosion', { type: 'sphere', radius: 3 }, new THREE.Vector3(0,0,0), 0.3
                );
                hb.damage = mine.damage || 40; hb.team = 'player';
                if (hitboxSystem) hitboxSystem.registerHitbox(hb);
                if (mine.disables) {
                    target._disabled = true;
                    setTimeout(() => { target._disabled = false; }, 3000);
                }
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
        trickSystem, fatalitySystem, graffitiSpraySystem,
        predatorDrone, photoBountySystem, escortSystem, rhythmParkour, trapCrafting,
        exoSuit, player, world, activeInput, resourceSystem, arenaMode
    } = deps;
    const context = {
        ...deps,
        dt: finalDt,
        enemies: deps.world?.drones ? deps.world.drones.drones : [],
        gameTime: 12
    };
    const update = (system, args = ['dt']) => updateLifecycle(system, context, args);

    update(archetype);
    update(companion, ['dt', 'player', 'world', 'enemies']);
    update(territory);
    update(loyalty);
    update(npcSystem, ['dt', 'gameTime']);
    if (blackout && blackout.update) {
        blackout.update(finalDt, 12);
        applyBlackoutGameplayEffects({ blackout, player, world, resourceSystem, arenaMode }, finalDt);
    }
    update(rivals, ['dt', 'player']);
    update(mastery, ['dt', 'player']);
    update(subLevels, ['dt', 'player']);
    update(collapse, ['dt', 'player']);
    update(safehouse);
    update(bounty, ['dt', 'player']);
    update(codex, ['dt', 'player']);
    update(implants, ['dt', 'player']);
    update(legacy);
    update(ngPlus);
    update(consequences);
    update(debt);
    update(shop);
    update(factions);
    update(familiarity);
    update(apexRift);
    update(nephalemGlory);
    update(legendaryPowerSystem);
    update(projectileManager);
    update(predatorDrone);
    update(photoBountySystem);
    update(escortSystem);
    update(rhythmParkour, ['dt', 'activeInput']);

    // World & quest systems
    update(wanderingVendor);
    if (dailyQuestSystem) dailyQuestSystem.save();
    if (graffitiCollectible) graffitiCollectible.update();
    update(fastTravel);

    // RPG progression systems
    if (setBonusSystem) setBonusSystem.update(exoSuit);
    if (prestigeSystem) prestigeSystem.addXP(0);
    update(trainingDummy);
    update(lootVacuum);
    if (moddingAPI) moddingAPI.dispatch('preUpdate', finalDt);

    // Trick / Fatality / Graffiti
    update(trickSystem);
    update(fatalitySystem, ['dt', 'player', 'world', 'activeInput']);
    update(graffitiSpraySystem, ['dt', 'player', 'activeInput', 'world']);

    if (activeInput?.wasPressed?.('Digit6') && trapCrafting) trapCrafting.craft('proximity_mine');
    if (activeInput?.wasPressed?.('Digit7') && predatorDrone && !predatorDrone.active) predatorDrone.spawn();
    if (activeInput?.wasPressed?.('Digit8') && escortSystem && !escortSystem.active) {
        escortSystem.start(player.position.clone().add({ x: 12, y: 0, z: 12 }));
    }
    if (activeInput?.wasPressed?.('Digit9') && rhythmParkour && !rhythmParkour.active) rhythmParkour.start();
}

function applyBlackoutGameplayEffects(deps, dt) {
    const { blackout, player, world, resourceSystem, arenaMode } = deps;
    const active = blackout.getCurrentEvent ? blackout.getCurrentEvent() : null;
    const effects = active?.config?.effects || {};

    if (resourceSystem) {
        if (effects.flowCostMult !== undefined && !resourceSystem._blackoutCostOverride) {
            resourceSystem._preBlackoutCostMultiplier = resourceSystem.costMultiplier ?? 1;
            resourceSystem._blackoutCostOverride = true;
        }
        if (effects.flowCostMult !== undefined) {
            resourceSystem.costMultiplier = effects.flowCostMult;
        } else if (resourceSystem._blackoutCostOverride) {
            resourceSystem.costMultiplier = resourceSystem._preBlackoutCostMultiplier ?? 1;
            resourceSystem._blackoutCostOverride = false;
        }
    }

    if (player && effects.healthDrainPerSecond && player.takeDamage) {
        player.takeDamage((player.maxHealth || 100) * effects.healthDrainPerSecond * dt, 'energy', null);
    }

    if (world?.drones?.drones) {
        for (const drone of world.drones.drones) {
            if (drone._baseVisionRange === undefined && drone.visionRange !== undefined) {
                drone._baseVisionRange = drone.visionRange;
            }
            if (drone._baseVisionRange !== undefined) {
                drone.visionRange = drone._baseVisionRange * (effects.droneVisionMult || 1);
            }
        }
    }

    if (arenaMode) {
        arenaMode._lockdownSealed = !!effects.sealArenas;
    }
}
