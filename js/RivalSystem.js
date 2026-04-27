/**
 * RivalSystem.js
 * Rival runner manager — spawns human NPC entities in the world.
 * Creates simple Three.js meshes. Call dispose() on cleanup.
 */

import * as THREE from 'three';

export const RELATIONSHIP = {
  RIVAL: -2,
  HOSTILE: -1,
  NEUTRAL: 0,
  FRIEND: 1,
  MENTOR: 2,
};

export const ARCHETYPES = {
  TRACEUR: 'traceur',
  SPECIMEN: 'specimen',
  NETRUNNER: 'netrunner',
  SABOTEUR: 'saboteur',
};

const RIVAL_DEFINITIONS = [
  {
    id: 'vega',
    name: 'Vega',
    archetype: ARCHETYPES.TRACEUR,
    origin: 'corporate',
    gearLoadout: ['light_frame', 'grappling_hook', 'optics_mk2'],
    relationship: RELATIONSHIP.RIVAL,
    hostile: false,
    color: 0x00aaff, // cyan
    dropItemId: 'aeroframe',
    sectorPreference: ['sector_4', 'sector_6', 'sector_9'],
    height: 1.75,
  },
  {
    id: 'kael',
    name: 'Kael',
    archetype: ARCHETYPES.SPECIMEN,
    origin: 'military',
    gearLoadout: ['heavy_frame', 'riot_shield', 'shock_gauntlets'],
    relationship: RELATIONSHIP.HOSTILE,
    hostile: true,
    color: 0xff3333, // red
    dropItemId: 'kinetic_weave',
    sectorPreference: ['sector_2', 'sector_5', 'sector_11'],
    height: 1.9,
  },
  {
    id: 'jun',
    name: 'Jun',
    archetype: ARCHETYPES.NETRUNNER,
    origin: 'street',
    gearLoadout: ['holo_cloak', 'data_spike', 'ghost_soles'],
    relationship: RELATIONSHIP.NEUTRAL,
    hostile: false,
    color: 0xaa33ff, // purple
    dropItemId: null, // becomes ally after quest — no drop
    sectorPreference: ['sector_3', 'sector_8', 'sector_12'],
    height: 1.65,
  },
  {
    id: 'old_man_rust',
    name: 'Old Man Rust',
    archetype: ARCHETYPES.SABOTEUR,
    origin: 'salvage',
    gearLoadout: ['rusted_frame', 'detonator', 'mag_stompers'],
    relationship: RELATIONSHIP.FRIEND,
    hostile: false,
    color: 0xffaa00, // orange
    dropItemId: null, // gives tips, not gear
    sectorPreference: ['sector_1', 'sector_7', 'sector_10'],
    height: 1.6,
  },
];

function _makeCapsuleMesh(color, height) {
  // Simple capsule-like shape: cylinder + two spheres
  const group = new THREE.Group();

  const radius = 0.25;
  const bodyHeight = Math.max(0.1, height - radius * 2);

  const bodyGeo = new THREE.CylinderGeometry(radius, radius, bodyHeight, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.3 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  const topGeo = new THREE.SphereGeometry(radius, 8, 8);
  const top = new THREE.Mesh(topGeo, bodyMat);
  top.position.y = bodyHeight / 2;
  top.castShadow = true;
  group.add(top);

  const botGeo = new THREE.SphereGeometry(radius, 8, 8);
  const bot = new THREE.Mesh(botGeo, bodyMat);
  bot.position.y = -bodyHeight / 2;
  bot.castShadow = true;
  group.add(bot);

  // Eyes — small glowing indicators
  const eyeGeo = new THREE.SphereGeometry(0.04, 4, 4);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.08, bodyHeight / 2 + radius * 0.3, radius * 0.85);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.08, bodyHeight / 2 + radius * 0.3, radius * 0.85);
  group.add(rightEye);

  // Store refs for disposal
  group.userData._rivalMeshes = [body, top, bot, leftEye, rightEye];
  group.userData._rivalMaterials = [bodyMat, eyeMat];
  group.userData._rivalGeometries = [bodyGeo, topGeo, botGeo, eyeGeo];

  return group;
}

export class RivalSystem {
  constructor(scene, player, world, exoSuitSystem = null) {
    this.scene = scene;
    this.player = player;
    this.world = world;
    this.exoSuitSystem = exoSuitSystem;

    this._rivals = new Map(); // rivalId -> data
    this._entities = new Map(); // rivalId -> THREE.Group
    this._activeChallenges = new Map(); // rivalId -> { type, startTime, checkpointIndex }

    for (const def of RIVAL_DEFINITIONS) {
      this._rivals.set(def.id, {
        ...def,
        defeated: false,
        spawned: false,
        currentSector: null,
        relationship: def.relationship,
        questsCompleted: [],
        raceBestTime: null,
      });
    }
  }

  /* ---------- Spawning ---------- */

  spawnRival(rivalId, sectorId) {
    const rival = this._rivals.get(rivalId);
    if (!rival) {
      throw new Error(`Unknown rival: ${rivalId}`);
    }
    if (this._entities.has(rivalId)) {
      this.despawnRival(rivalId);
    }

    const mesh = _makeCapsuleMesh(rival.color, rival.height);

    // Position somewhere in the sector (use a platform or collidable if available)
    const pos = this._findSpawnPosition(sectorId);
    mesh.position.copy(pos);

    this.scene.add(mesh);
    this._entities.set(rivalId, mesh);

    rival.spawned = true;
    rival.currentSector = sectorId;

    return mesh;
  }

  despawnRival(rivalId) {
    const mesh = this._entities.get(rivalId);
    if (!mesh) return false;

    this.scene.remove(mesh);
    this._disposeMesh(mesh);
    this._entities.delete(rivalId);

    const rival = this._rivals.get(rivalId);
    if (rival) {
      rival.spawned = false;
      rival.currentSector = null;
    }

    return true;
  }

  _findSpawnPosition(sectorId) {
    // Try to find a platform or collidable in the target sector.
    // Fallback to a deterministic offset based on sector name hash.
    if (this.world && this.world.platforms && this.world.platforms.length > 0) {
      const plat = this.world.platforms.find(p => p.sectorId === sectorId);
      if (plat && plat.mesh) {
        const pos = plat.mesh.position.clone();
        pos.y += 1.0;
        return pos;
      }
    }

    if (this.world && this.world.collidables && this.world.collidables.length > 0) {
      const col = this.world.collidables.find(c => c.userData && c.userData.sectorId === sectorId);
      if (col && col.position) {
        const pos = col.position.clone();
        pos.y += 1.0;
        return pos;
      }
    }

    // Deterministic fallback
    let hash = 0;
    for (let i = 0; i < sectorId.length; i++) hash = ((hash << 5) - hash) + sectorId.charCodeAt(i);
    hash = Math.abs(hash);
    return new THREE.Vector3(
      (hash % 50) - 25,
      1.0,
      ((hash >> 8) % 50) - 25
    );
  }

  _disposeMesh(group) {
    if (!group) return;
    const meshes = group.userData._rivalMeshes || [];
    const materials = group.userData._rivalMaterials || [];
    const geometries = group.userData._rivalGeometries || [];

    for (const m of meshes) {
      if (m.parent) m.parent.remove(m);
    }
    for (const mat of materials) {
      if (mat && typeof mat.dispose === 'function') mat.dispose();
    }
    for (const geo of geometries) {
      if (geo && typeof geo.dispose === 'function') geo.dispose();
    }

    group.userData._rivalMeshes = null;
    group.userData._rivalMaterials = null;
    group.userData._rivalGeometries = null;
  }

  /* ---------- Challenges ---------- */

  challengeToRace(rivalId) {
    const rival = this._rivals.get(rivalId);
    if (!rival) return null;
    if (rival.defeated) return { error: 'Rival already defeated.' };
    if (!rival.spawned) return { error: 'Rival not spawned.' };

    // Race through checkpoints in the rival's current sector
    const checkpoints = this._generateCheckpoints(rival.currentSector, 5);
    const challenge = {
      type: 'race',
      rivalId,
      startTime: performance.now(),
      checkpoints,
      nextCheckpoint: 0,
    };

    this._activeChallenges.set(rivalId, challenge);
    return challenge;
  }

  challengeToDuel(rivalId) {
    const rival = this._rivals.get(rivalId);
    if (!rival) return null;
    if (rival.defeated) return { error: 'Rival already defeated.' };
    if (!rival.spawned) return { error: 'Rival not spawned.' };

    const challenge = {
      type: 'duel',
      rivalId,
      startTime: performance.now(),
      rivalHealth: 100,
    };

    this._activeChallenges.set(rivalId, challenge);
    return challenge;
  }

  _generateCheckpoints(sectorId, count) {
    const checkpoints = [];
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random positions around the sector
      let hash = 0;
      const seed = `${sectorId}_${i}`;
      for (let j = 0; j < seed.length; j++) hash = ((hash << 5) - hash) + seed.charCodeAt(j);
      hash = Math.abs(hash);
      checkpoints.push(new THREE.Vector3(
        (hash % 40) - 20,
        2 + (hash % 10),
        (((hash >> 8) % 40) - 20)
      ));
    }
    return checkpoints;
  }

  /* ---------- State & Relationships ---------- */

  getRivalState(rivalId) {
    const rival = this._rivals.get(rivalId);
    if (!rival) return null;

    const mesh = this._entities.get(rivalId);
    return {
      id: rival.id,
      name: rival.name,
      archetype: rival.archetype,
      origin: rival.origin,
      gearLoadout: rival.gearLoadout.slice(),
      relationship: rival.relationship,
      relationshipLabel: this._labelForRelationship(rival.relationship),
      defeated: rival.defeated,
      spawned: rival.spawned,
      currentSector: rival.currentSector,
      raceBestTime: rival.raceBestTime,
      questsCompleted: rival.questsCompleted.slice(),
      position: mesh ? mesh.position.clone() : null,
    };
  }

  adjustRelationship(rivalId, delta) {
    const rival = this._rivals.get(rivalId);
    if (!rival) return false;

    let next = rival.relationship + delta;
    next = Math.max(RELATIONSHIP.RIVAL, Math.min(RELATIONSHIP.MENTOR, next));
    rival.relationship = next;

    // Auto-flip hostile flag
    rival.hostile = rival.relationship <= RELATIONSHIP.HOSTILE;

    return true;
  }

  _labelForRelationship(value) {
    if (value <= RELATIONSHIP.RIVAL) return 'rival';
    if (value === RELATIONSHIP.HOSTILE) return 'hostile';
    if (value === RELATIONSHIP.NEUTRAL) return 'neutral';
    if (value === RELATIONSHIP.FRIEND) return 'friend';
    return 'mentor';
  }

  /* ---------- Challenge Resolution ---------- */

  resolveRace(rivalId, playerWon, playerTimeMs = null) {
    const challenge = this._activeChallenges.get(rivalId);
    if (!challenge || challenge.type !== 'race') return false;

    const rival = this._rivals.get(rivalId);
    if (playerWon) {
      this.adjustRelationship(rivalId, 1);
      if (playerTimeMs !== null && (rival.raceBestTime === null || playerTimeMs < rival.raceBestTime)) {
        rival.raceBestTime = playerTimeMs;
      }
    } else {
      this.adjustRelationship(rivalId, -1);
    }

    this._activeChallenges.delete(rivalId);
    return true;
  }

  resolveDuel(rivalId, playerWon) {
    const challenge = this._activeChallenges.get(rivalId);
    if (!challenge || challenge.type !== 'duel') return false;

    const rival = this._rivals.get(rivalId);
    if (playerWon) {
      rival.defeated = true;
      this.adjustRelationship(rivalId, 1);
      this._dropExoSuitPiece(rival);
    } else {
      this.adjustRelationship(rivalId, -1);
    }

    this._activeChallenges.delete(rivalId);
    return true;
  }

  _dropExoSuitPiece(rival) {
    if (!rival.dropItemId) return;
    if (this.exoSuitSystem && typeof this.exoSuitSystem.addItem === 'function') {
      this.exoSuitSystem.addItem(rival.dropItemId);
    }
    // Also expose via player inventory if available
    if (this.player && this.player.inventory && typeof this.player.inventory.add === 'function') {
      this.player.inventory.add(rival.dropItemId);
    }
  }

  /* ---------- Update ---------- */

  update(dt, player) {
    const now = performance.now();
    // Face player if hostile and within range
    for (const [rivalId, mesh] of this._entities) {
      const rival = this._rivals.get(rivalId);
      if (!rival || !mesh) continue;

      if (rival.hostile && player && player.position) {
        const dist = mesh.position.distanceTo(player.position);
        if (dist < 15) {
          mesh.lookAt(player.position.x, mesh.position.y, player.position.z);
        }
      }

      // Bobbing animation
      const bob = Math.sin(now * 0.003 + rivalId.length) * 0.03;
      mesh.position.y += bob * dt * 2;
      // Clamp back to reasonable floor height
      if (mesh.position.y < 0.5) mesh.position.y = 0.5 + rival.height / 2;
    }

    // Update active challenges
    for (const [rivalId, challenge] of this._activeChallenges) {
      if (challenge.type === 'race' && player && player.position) {
        const target = challenge.checkpoints[challenge.nextCheckpoint];
        if (target && player.position.distanceTo(target) < 2.0) {
          challenge.nextCheckpoint += 1;
          if (challenge.nextCheckpoint >= challenge.checkpoints.length) {
            this.resolveRace(rivalId, true, now - challenge.startTime);
          }
        }
      }
    }
  }

  /* ---------- Cleanup ---------- */

  dispose() {
    for (const rivalId of this._entities.keys()) {
      this.despawnRival(rivalId);
    }
    this._entities.clear();
    this._activeChallenges.clear();
  }

  /* ---------- Serialization ---------- */

  serialize() {
    const data = {};
    for (const [id, rival] of this._rivals) {
      data[id] = {
        relationship: rival.relationship,
        defeated: rival.defeated,
        spawned: rival.spawned,
        currentSector: rival.currentSector,
        raceBestTime: rival.raceBestTime,
        questsCompleted: rival.questsCompleted.slice(),
      };
    }
    return {
      rivals: data,
      activeChallenges: Array.from(this._activeChallenges.entries()).map(([k, v]) => {
        return [k, {
          type: v.type,
          rivalId: v.rivalId,
          startTime: v.startTime,
          nextCheckpoint: v.nextCheckpoint,
          checkpoints: v.checkpoints.map(c => ({ x: c.x, y: c.y, z: c.z })),
          rivalHealth: v.rivalHealth || null,
        }];
      }),
    };
  }

  deserialize(data) {
    if (!data || typeof data !== 'object') return;

    if (data.rivals && typeof data.rivals === 'object') {
      for (const [id, incoming] of Object.entries(data.rivals)) {
        const rival = this._rivals.get(id);
        if (!rival) continue;

        if (typeof incoming.relationship === 'number') {
          rival.relationship = Math.max(RELATIONSHIP.RIVAL, Math.min(RELATIONSHIP.MENTOR, incoming.relationship));
          rival.hostile = rival.relationship <= RELATIONSHIP.HOSTILE;
        }
        if (typeof incoming.defeated === 'boolean') rival.defeated = incoming.defeated;
        if (typeof incoming.spawned === 'boolean') rival.spawned = incoming.spawned;
        if (typeof incoming.currentSector === 'string') rival.currentSector = incoming.currentSector;
        if (typeof incoming.raceBestTime === 'number') rival.raceBestTime = incoming.raceBestTime;
        if (Array.isArray(incoming.questsCompleted)) {
          rival.questsCompleted = incoming.questsCompleted.slice();
        }
      }
    }

    if (Array.isArray(data.activeChallenges)) {
      this._activeChallenges.clear();
      for (const [id, ch] of data.activeChallenges) {
        const challenge = {
          type: ch.type,
          rivalId: ch.rivalId,
          startTime: ch.startTime,
          nextCheckpoint: ch.nextCheckpoint || 0,
          checkpoints: (ch.checkpoints || []).map(c => new THREE.Vector3(c.x, c.y, c.z)),
          rivalHealth: ch.rivalHealth || null,
        };
        this._activeChallenges.set(id, challenge);
      }
    }
  }
}
