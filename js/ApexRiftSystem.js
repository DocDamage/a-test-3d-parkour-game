/**
 * ApexRiftSystem.js
 * Greater Rift endgame loop.
 *
 * Flow:
 *   1. Player enters portal (or presses hotkey)
 *   2. Spawn procedural vertical arena
 *   3. Kill enemies → fill progress bar
 *   4. Progress 100% → spawn Rift Guardian
 *  5. Kill guardian within time limit → upgrade rift level
 *   6. Fail time limit → no upgrade, reduced rewards
 */

import * as THREE from 'three';

export class ApexRiftSystem {
  constructor(scene, world, player, bossFight, challengeSystem, lootSystem, difficultyTier) {
    this.scene = scene;
    this.world = world;
    this.player = player;
    this.bossFight = bossFight;
    this.challengeSystem = challengeSystem;
    this.lootSystem = lootSystem;
    this.difficultyTier = difficultyTier;

    this.active = false;
    this.riftLevel = 1;
    this.progress = 0;        // 0 – 100
    this.progressTarget = 100;
    this.elapsed = 0;
    this.timeLimit = 600;     // 10 min base
    this.kills = 0;
    this.floor = 1;
    this.spawnedEnemies = []; // tracked drone refs
    this.guardianSpawned = false;
    this.guardianDefeated = false;
    this.arenaObjects = [];   // meshes to cleanup
    this._portalMesh = null;

    // Scaling per rift level: +17% HP/damage
    this.riftScaling = 1.17;

    this._load();
  }

  /* ------------------------------------------------------------------ */
  /*  Lifecycle                                                          */
  /* ------------------------------------------------------------------ */

  startRift() {
    if (this.active) return false;
    this.active = true;
    this.progress = 0;
    this.elapsed = 0;
    this.kills = 0;
    this.floor = 1;
    this.guardianSpawned = false;
    this.guardianDefeated = false;
    this.spawnedEnemies = [];

    this._buildArena();
    this._spawnWave(1);

    // Time limit shrinks slightly at higher rift levels (min 7 min)
    this.timeLimit = Math.max(420, 600 - (this.riftLevel - 1) * 5);

    const hud = document.getElementById('rift-hud');
    if (hud) hud.style.display = 'block';
    const result = document.getElementById('rift-result-overlay');
    if (result) result.style.display = 'none';

    console.log(`[Apex Rift] Started level ${this.riftLevel}. Time limit: ${this.timeLimit}s`);
    return true;
  }

  endRift(success) {
    if (!this.active) return;
    this.active = false;

    const timeUsed = this.elapsed;
    let upgrades = 0;

    if (success) {
      if (timeUsed < 600) upgrades = 3;
      else if (timeUsed < 900) upgrades = 1;
      this.riftLevel += upgrades;
      console.log(`[Apex Rift] CLEARED! +${upgrades} levels. New level: ${this.riftLevel}`);
      if (this.challengeSystem) {
        this.challengeSystem.unlock('riftClear');
        if (this.riftLevel >= 10) this.challengeSystem.unlock('riftLevel10');
        if (this.riftLevel >= 25) this.challengeSystem.unlock('riftLevel25');
        if (this.riftLevel >= 50) this.challengeSystem.unlock('riftLevel50');
        if (this.riftLevel >= 75) this.challengeSystem.unlock('riftLevel75');
        if (this.riftLevel >= 100) this.challengeSystem.unlock('riftLevel100');
      }
    } else {
      console.log(`[Apex Rift] FAILED. Level unchanged: ${this.riftLevel}`);
    }

    const hud = document.getElementById('rift-hud');
    if (hud) hud.style.display = 'none';
    const result = document.getElementById('rift-result-overlay');
    if (result) {
      result.style.display = 'flex';
      const title = document.getElementById('rift-result-title');
      if (title) title.textContent = success ? 'CLEARED' : 'FAILED';
      const timeEl = document.getElementById('rift-result-time');
      if (timeEl) timeEl.textContent = `Time: ${Math.floor(timeUsed / 60)}:${String(Math.floor(timeUsed % 60)).padStart(2, '0')}`;
      const lvlEl = document.getElementById('rift-result-levels');
      if (lvlEl) lvlEl.textContent = `Levels Gained: ${upgrades}`;
      setTimeout(() => { if (result) result.style.display = 'none'; }, 3000);
    }

    this._cleanupArena();
    this._save();
    return { success, timeUsed, upgrades, riftLevel: this.riftLevel };
  }

  /* ------------------------------------------------------------------ */
  /*  Per-frame update                                                   */
  /* ------------------------------------------------------------------ */

  update(dt) {
    if (!this.active) return;
    this._updateHUD();

    this.elapsed += dt;

    // Time limit fail
    if (this.elapsed >= this.timeLimit && !this.guardianDefeated) {
      this.endRift(false);
      return;
    }

    // Spawn additional waves as progress fills
    if (!this.guardianSpawned && this.progress < 100) {
      const waveThreshold = this.floor * 15;
      if (this.progress >= waveThreshold) {
        this.floor++;
        this._spawnWave(this.floor);
      }
    }

    // Check guardian defeat
    if (this.guardianSpawned && this.bossFight && !this.bossFight.isActive() && !this.guardianDefeated) {
      // Boss fight ended — if we get here, boss was defeated
      this.guardianDefeated = true;
      // Small delay then end rift
      setTimeout(() => this.endRift(true), 2000);
    }

    // Remove dead enemies from tracking
    this.spawnedEnemies = this.spawnedEnemies.filter(e => e && !e.isDead);
  }

  /* ------------------------------------------------------------------ */
  /*  Enemy events                                                       */
  /* ------------------------------------------------------------------ */

  onEnemyKilled(enemy, source) {
    if (!this.active || this.guardianSpawned) return;

    this.kills++;

    // Progress per enemy type
    let progressGain = 2; // base drone
    if (enemy.isElite) progressGain = 8;
    if (enemy.type === 'boss' || enemy.type === 'guardian') progressGain = 25;

    this.progress = Math.min(100, this.progress + progressGain);

    // Spawn guardian at 100%
    if (this.progress >= 100 && !this.guardianSpawned) {
      this._spawnGuardian();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Arena & spawning                                                   */
  /* ------------------------------------------------------------------ */

  _buildArena() {
    // Create a circular platform for the rift
    const radius = 20 + this.riftLevel * 0.5;
    const geo = new THREE.CylinderGeometry(radius, radius, 0.5, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0.3
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.arenaObjects.push(floor);

    // Rift portal visual
    const portalGeo = new THREE.TorusGeometry(2, 0.3, 16, 32);
    const portalMat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.8
    });
    this._portalMesh = new THREE.Mesh(portalGeo, portalMat);
    this._portalMesh.position.set(0, 1.5, 0);
    this._portalMesh.rotation.x = Math.PI / 2;
    this.scene.add(this._portalMesh);
    this.arenaObjects.push(this._portalMesh);

    // Position player at center
    if (this.player) {
      this.player.position.set(0, 0.5, 0);
      this.player.velocity.set(0, 0, 0);
    }

    // Add to world collidables
    if (this.world && this.world.collidables) {
      this.world.collidables.push(floor);
    }
  }

  _cleanupArena() {
    for (const obj of this.arenaObjects) {
      if (!obj) continue;
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      // Remove from world collidables
      if (this.world && this.world.collidables) {
        const idx = this.world.collidables.indexOf(obj);
        if (idx >= 0) this.world.collidables.splice(idx, 1);
      }
    }
    this.arenaObjects = [];
    this._portalMesh = null;

    // Despawn remaining enemies
    for (const enemy of this.spawnedEnemies) {
      if (enemy && enemy.group) enemy.group.visible = false;
    }
    this.spawnedEnemies = [];
  }

  _spawnWave(floorNumber) {
    if (!this.world || !this.world.drones || !this.world.drones.addDrone) return;

    const count = Math.min(3 + Math.floor(floorNumber / 2), 8);
    const isEliteChance = Math.min(0.05 + floorNumber * 0.02, 0.4);

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 8 + Math.random() * 8;
      const pos = {
        x: Math.cos(angle) * dist,
        y: 0.5,
        z: Math.sin(angle) * dist
      };

      const isElite = Math.random() < isEliteChance;
      const drone = this.world.drones.addDrone({
        position: pos,
        type: isElite ? 'elite' : 'patrol',
        isElite
      });

      if (drone) {
        // Apply difficulty + rift scaling
        const diffMult = this.difficultyTier ? this.difficultyTier.getTierConfig().hpMult : 1.0;
        const riftMult = Math.pow(this.riftScaling, this.riftLevel - 1);
        const totalMult = diffMult * riftMult;

        drone.maxHealth = Math.floor((drone.maxHealth || 40) * totalMult);
        drone.health = drone.maxHealth;
        if (drone.meleeDamage) drone.meleeDamage *= this.difficultyTier ? this.difficultyTier.getTierConfig().dmgMult : 1.0;

        // Track for cleanup
        this.spawnedEnemies.push(drone);
      }
    }
  }

  _spawnGuardian() {
    this.guardianSpawned = true;
    console.log('[Apex Rift] Rift Guardian spawned!');

    if (this.bossFight && typeof this.bossFight.start === 'function') {
      // Scale boss health by rift level and difficulty
      const diffMult = this.difficultyTier ? this.difficultyTier.getTierConfig().hpMult : 1.0;
      const riftMult = Math.pow(this.riftScaling, this.riftLevel - 1);
      this.bossFight._riftMultiplier = diffMult * riftMult;
      this.bossFight.start();
    }
  }

  _updateHUD() {
    const levelEl = document.getElementById('rift-level');
    const timerEl = document.getElementById('rift-timer');
    const fillEl = document.getElementById('rift-progress-fill');
    const waveEl = document.getElementById('rift-wave');
    const killsEl = document.getElementById('rift-kills');
    const flashEl = document.getElementById('rift-flash');

    if (levelEl) levelEl.textContent = this.riftLevel;
    if (timerEl) {
      const remaining = Math.max(0, this.timeLimit - this.elapsed);
      timerEl.textContent = `${Math.floor(remaining / 60)}:${String(Math.floor(remaining % 60)).padStart(2, '0')}`;
    }
    if (fillEl) fillEl.style.width = `${Math.min(100, this.progress)}%`;
    if (waveEl) waveEl.textContent = this.floor;
    if (killsEl) killsEl.textContent = this.kills;
    if (flashEl) {
      if (this.guardianSpawned && !this.guardianDefeated) {
        flashEl.style.opacity = '1';
      } else {
        flashEl.style.opacity = '0';
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Serialization                                                      */
  /* ------------------------------------------------------------------ */

  serialize() {
    return {
      riftLevel: this.riftLevel,
      highestRiftLevel: this._highestRiftLevel || this.riftLevel
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.riftLevel) this.riftLevel = data.riftLevel;
    if (data.highestRiftLevel) this._highestRiftLevel = data.highestRiftLevel;
  }

  _save() {
    try {
      localStorage.setItem('apex_rifts', JSON.stringify(this.serialize()));
    } catch (e) { /* ignore */ }
  }

  _load() {
    try {
      const raw = localStorage.getItem('apex_rifts');
      if (raw) this.deserialize(JSON.parse(raw));
    } catch (e) { /* ignore */ }
  }
}
