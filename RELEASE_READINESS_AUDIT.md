# Apex Rift — AAA Release-Readiness Audit Report
**Date:** 2026-04-27  
**Scope:** `index.html`, `js/*.js` (117 modules), docs, scripts  
**Auditor:** Kimi Code CLI

---

## Executive Summary

| Severity | Count | Release Blocking? |
|----------|-------|-------------------|
| **Critical** | 9 | **Yes** |
| **High** | 21 | Strongly recommended |
| **Medium** | 35 | Recommended |
| **Low** | 18 | Polish |

**Top blockers:**
1. **Level Editor exposed to players** via `F1` with no gating.
2. **Save/Load buttons** in Settings have **zero confirmation** — one mis-click overwrites all progress.
3. **Double `preUpdate()`** in `main.js` + `Player.js` breaks edge-triggered input detection.
4. **~25 gameplay systems** are **not registered with `SaveSystem`** — massive progress loss on refresh.
5. **Weapon scroll-switching is completely broken** — `InputManager` never emits `ScrollUp`/`ScrollDown`.
6. **Gamepad R2 maps to invalid `'ShiftQ'`** — Overclock/Decoy unavailable on controller.
7. **Gamepad L3 overrides `ControlLeft`** — Magnet Boots toggle broken on controller.
8. **No player damage/death audio** and **no weapon fire audio**.
9. **Ambience audio stacks** every time pointer lock is regained.

---

## Critical Issues (Release Blockers)

### C1. Level Editor Exposed to Players
- **File:** `js/main.js:1420–1434`
- **Issue:** Pressing `F1` opens the full Level Editor with palette, property inspector, export/import JSON, and playtest. No unlock condition, no dev flag, no build-time stripping.
- **Fix:** Gate behind a non-obvious unlock or remove from release builds. Minimum fix:
  ```js
  // In main.js:1420
  if (activeInput.wasPressed('F1') && window.location.hash === '#dev') {
      levelEditor.toggle();
  }
  ```
  Also hide `#editor-ui` in `index.html:1618` by default or remove the DOM entirely for release.

### C2. Save/Load Buttons Have No Confirmation
- **File:** `index.html:2005–2006`, `js/main.js:1378–1379`
- **Issue:** `btn-save-game` and `btn-load-game` trigger `saveSystem.save()` / `load()` immediately on click. A mis-click overwrites or destroys hours of progress.
- **Fix:** Add confirmation dialogs:
  ```js
  saveBtn.addEventListener('click', () => {
      if (confirm('Overwrite current save?')) saveSystem.save();
  });
  loadBtn.addEventListener('click', () => {
      if (confirm('Load saved game? Unsaved progress will be lost.')) saveSystem.load();
  });
  ```

### C3. Double `preUpdate()` Breaks Edge Detection
- **File:** `js/main.js:1399`, `js/Player.js:309`
- **Issue:** `main.js` calls `activeInput.preUpdate()` at the start of the frame. `Player.js:309` calls `input.preUpdate()` again inside `update()`. This overwrites `prevKeys` mid-frame. Any key pressed and released between these two calls will be invisible to `wasPressed()` for the rest of the frame.
- **Fix:** Remove `input.preUpdate()` from `Player.js:309`. Ensure `main.js` is the sole caller.
  ```js
  // In Player.js:309 — DELETE this line:
  // input.preUpdate();
  ```

### C4. ~25 Gameplay Systems Not Registered with SaveSystem
- **File:** `js/main.js` (various lines)
- **Issue:** The following systems implement `serialize()`/`deserialize()` (or `_save()`/`_load()`) but are **never registered** with `saveSystem`. On refresh/tab-close, all this state evaporates:
  - `SkillSystem`, `ResourceSystem` — skills revert to defaults
  - `InventorySystem` — consumables reset
  - `FactionSystem`, `TerritorySystem` — standing/territory reset
  - `MasterySystem`, `CodexSystem`, `LegacySystem`, `NewGamePlus`, `CollapseMode`
  - `NPCSystem`, `AccessorySystem`, `NephalemGlory`
  - `ApexRiftSystem`, `DifficultyTierSystem`, `BountySystem`
  - `DebtSystem`, `ConsequenceSystem`, `ChallengeSystem`, `RisingTide`
  - `GhostRacing`, `SpeedrunILs`, `TimeTrial`, `InventoryStash`
- **Fix:** Register each after instantiation:
  ```js
  saveSystem.register('skillSystem', () => skillSystem.serialize(), (d) => skillSystem.deserialize(d));
  // ... repeat for all systems above
  ```
  Also remove duplicate private-key saves (e.g. `CharacterSheet`, `ExoSuitSystem`, `WeaponModSystem`, `PassiveTree`, `SafehouseSystem`) OR make `SaveSystem` the single source of truth and delete the `_save()` / `_load()` calls in those subsystems.

### C5. Weapon Scroll Switching Completely Broken
- **File:** `js/InputManager.js` (missing handler), `js/WeaponSystem.js:258–259`
- **Issue:** `WeaponSystem.js` checks `input.wasPressed('ScrollUp')` and `ScrollDown`, but `InputManager` never handles `wheel` events. Weapon switching via scroll wheel is dead code.
- **Fix:** Add wheel handler to `InputManager`:
  ```js
  // In InputManager.setupEvents()
  document.addEventListener('wheel', (e) => {
      this.keys['ScrollUp'] = e.deltaY < 0;
      this.keys['ScrollDown'] = e.deltaY > 0;
  });
  // In InputManager.preUpdate()
  this.prevKeys['ScrollUp'] = this.keys['ScrollUp'];
  this.prevKeys['ScrollDown'] = this.keys['ScrollDown'];
  this.keys['ScrollUp'] = false;
  this.keys['ScrollDown'] = false;
  ```

### C6. Gamepad R2 Mapped to Invalid `'ShiftQ'`
- **File:** `js/GamepadController.js:31, 83–86`
- **Issue:** Button 7 (R2/RT) maps to `'ShiftQ'`, which is not a valid `KeyboardEvent.code`. The intention was `ShiftLeft` + `KeyQ` for Overclock/Decoy, but the special-case code at line 83 only sets `KeyQ` and `ShiftLeft` — it never writes `ShiftQ`. No other file checks for `'ShiftQ'`, so R2 does nothing.
- **Fix:** Remove `'ShiftQ'` from the map and rely on the special-case branch (which already works). Change line 31 to a dummy or document it:
  ```js
  7: null, // handled specially below as Shift+Q (Overclock)
  ```
  And guard the loop:
  ```js
  if (!code) continue;
  ```

### C7. Gamepad L3 Overrides `ControlLeft` — Magnet Boots Broken
- **File:** `js/GamepadController.js:34, 100–102`
- **Issue:** Button 10 is mapped to `ControlLeft` in `buttonMap`, but then `preUpdate()` re-maps it to `ShiftLeft` at lines 100–102. L3 can never trigger magnet boots via `ControlLeft`.
- **Fix:** Remove the override or change it to toggle logic:
  ```js
  // Option A: remove lines 100–102 entirely
  // Option B: if you want L3 to be sprint, use a different button for magnet boots
  ```

### C8. No Player Damage / Death Audio + No Weapon Fire Audio
- **Files:** `js/Player.js:1859–1975`, `js/Player.js:1982–2017`, `js/WeaponSystem.js:181–219`
- **Issue:** `takeDamage()`, `die()`, and `fire()` are completely silent. This is a massive feedback gap for a combat game.
- **Fix:** Inject audioManager calls:
  ```js
  // In Player.js:1859+ (takeDamage)
  audioManager.playHitSound?.(type);
  
  // In Player.js:1982+ (die)
  audioManager.playDeathSound?.();
  
  // In WeaponSystem.js:181+ (fire)
  audioManager.playWeaponFire(this.currentWeapon);
  ```
  (Add corresponding methods to `AudioManager.js` or use generic `playSFX(id)`.

### C9. Ambience Audio Stacks on Every Pointer-Lock Reacquisition
- **File:** `js/main.js:1128`
- **Issue:** `audio.playAmbience()` is called inside the `pointerlockchange` listener. Every time the user clicks back into the game (after pause, menu, etc.), new drone oscillators start without checking if ambience is already playing. The result is a stacking drone that gets louder and louder.
- **Fix:** Add a guard in `AudioManager.js`:
  ```js
  playAmbience() {
      if (this._ambiencePlaying) return;
      this._ambiencePlaying = true;
      // ... existing code ...
  }
  stopAmbience() {
      this._ambiencePlaying = false;
      // ... existing code ...
  }
  ```
  And call `stopAmbience()` when exiting gameplay (pause, menu, etc.).

---

## High Severity

### H1. Missing Credits / Legal / License Notices
- **File:** `index.html`, `README.md`
- **Issue:** No attribution for Three.js (MIT license, loaded from unpkg CDN). No copyright line, no license headers, no credits screen.
- **Fix:** Add to `index.html` before `</body>` or in a dedicated credits screen:
  ```html
  <div id="credits-overlay" style="display:none">
      <p>Built with <a href="https://threejs.org">Three.js</a> (MIT License)</p>
      <p>© 2026 Apex Rift Team</p>
  </div>
  ```

### H2. Key Conflicts — Multiple Actions on Same Key
- **File:** `js/main.js:1556–1573`, `js/TimeTrial.js:556–566`, `js/UIManager.js:101–104`, `js/UIManager.js:142–145`
- **Issues:**
  - `T` starts both Apex Rift AND Time Trial in the same frame.
  - `Shift+T` opens Arena Selector AND restarts Time Trial.
  - `G` opens Gear panel AND fires Disk Throw projectile.
  - `M` opens Implants panel AND cycles global difficulty tier.
- **Fix:** Make `UIManager.handleInput()` **consume** keys by returning a boolean, and skip gameplay input if it returns `true`:
  ```js
  // In main.js
  if (uiManager.handleInput(activeInput)) return;
  // Then skip weapon/combat/disk-throw checks for that frame.
  ```
  Alternatively, add `Shift` / `Alt` modifiers to disambiguate.

### H3. Missing Inventory UI
- **File:** `js/InventorySystem.js`
- **Issue:** `InventorySystem` tracks 20 slots of consumables/crafting mats but has **zero DOM UI**. Players can only use items via hotkeys 6–9; they cannot view what they own.
- **Fix:** Add an inventory panel in `index.html`, render it in `UIManager.js`, and bind `KeyI` (or another key) to toggle it. Re-use the existing stash panel layout as a template.

### H4. Missing Level-Up Toast
- **File:** `index.html:1954–1957`, `js/main.js:437–438`
- **Issue:** `#levelup-toast` DOM exists and is styled, but `ProgressionSystem.onLevelUp` only logs to console. The toast is never shown.
- **Fix:** Replace the console.log with toast display:
  ```js
  progression.onLevelUp = (level, points) => {
      const toast = document.getElementById('levelup-toast');
      const msg = document.getElementById('levelup-msg');
      if (toast && msg) {
          msg.textContent = `Level ${level}! Attribute points: ${points}`;
          toast.style.display = 'block';
          setTimeout(() => toast.style.display = 'none', 3000);
      }
      if (passiveTree) passiveTree.addPoints(1);
  };
  ```

### H5. ChallengeSystem Listener Leak
- **File:** `js/ChallengeSystem.js:459–461, 508–512`
- **Issue:** `showGradeScreen()` adds `keydown` and `click` listeners. `hideGradeScreen()` never removes them. Repeated runs leak listeners indefinitely.
- **Fix:**
  ```js
  hideGradeScreen() {
      if (this.gradeScreen && this.gradeScreen.style.display === 'flex') {
          this.gradeScreen.style.display = 'none';
          document.removeEventListener('keydown', this._gradeKeyHandler);
          this.gradeScreen.removeEventListener('click', this._gradeKeyHandler);
          this.resetRunStats();
      }
  }
  ```

### H6. BlackoutSystem Unbounded History Growth
- **File:** `js/BlackoutSystem.js:148`
- **Issue:** `this._eventHistory.push(...)` on every `startEvent()`. Array is never truncated. Long sessions will consume unbounded memory.
- **Fix:** Cap the array:
  ```js
  this._eventHistory.push({...});
  if (this._eventHistory.length > 100) this._eventHistory.shift();
  ```

### H7. Pause Does Not Close Open Panels
- **File:** `js/main.js:1403–1412`
- **Issue:** If Settings, Stash, Shop, or RPG panels are open, pressing `Escape` opens the pause menu **behind** them. The panels stay visible and block pause-menu interaction.
- **Fix:** Before showing pause menu, close all panels:
  ```js
  if (paused) {
      uiManager.closeAllPanels(); // implement this
      if (pauseMenu) pauseMenu.style.display = 'flex';
      document.exitPointerLock();
  }
  ```

### H8. Death Screen Does Not Freeze Game Loop
- **File:** `js/main.js:1438–1447`
- **Issue:** The death screen is shown but `animate()` continues running. If `player.isDead` flips back to `false` for any reason (heal callback, bug), the death screen hides instantly without player input.
- **Fix:** Add an explicit `gameOver` flag:
  ```js
  // In animate()
  if (gameOver) {
      // Only process death-screen input, skip world/physics updates
      return;
  }
  ```

### H9. Rift Result Overlay Auto-Dismisses Without Button
- **File:** `js/ApexRiftSystem.js:109`, `index.html:1931–1935`
- **Issue:** `#rift-result-overlay` hides after a hardcoded 3-second `setTimeout`. No close button, no early dismiss, pointer lock not restored.
- **Fix:** Add a close button to the overlay and restore pointer lock on click:
  ```html
  <div id="rift-result-overlay" style="display:none">
      <div id="rift-result-content"></div>
      <button id="rift-result-close">Continue</button>
  </div>
  ```
  ```js
  // In ApexRiftSystem:109
  const closeBtn = document.getElementById('rift-result-close');
  closeBtn.onclick = () => {
      overlay.style.display = 'none';
      document.body.requestPointerLock();
  };
  // Remove the setTimeout
  ```

### H10. Quit to Main Menu Does Not Reset Game State
- **File:** `js/main.js:1091–1104`
- **Issue:** `btnQuit` shows `#start-screen` but does not reset `bossFight`, `levelEditor`, or `apexRift` states. Boss logic continues updating in the background.
- **Fix:** Call cleanup methods before showing start screen:
  ```js
  btnQuit.addEventListener('click', () => {
      paused = false;
      gameStarted = false;
      if (bossFight) bossFight.cleanup();
      if (levelEditor) levelEditor.exit();
      if (apexRift) apexRift.endRun();
      // ... reset player position, health, etc.
      showStartScreen();
  });
  ```

### H11. Boss Victory → Warehouse Does Not Reset Player
- **File:** `js/main.js:1146–1152`
- **Issue:** `boss-exit` button calls `bossFight.cleanup()` but does not reset player position, clear status effects, or restore health.
- **Fix:** Add reset logic:
  ```js
  document.getElementById('boss-exit').addEventListener('click', () => {
      bossFight.cleanup();
      player.position.copy(world.spawnPoint || new THREE.Vector3(0, 2, 0));
      player.health = player.maxHealth;
      statusEffectSystem.clearAll();
      // ... restore UI
  });
  ```

### H12. No Touch Support
- **File:** ALL `js/*.js`
- **Issue:** Zero touch event handlers (`touchstart`, `touchmove`, `touchend`). The game is completely unplayable on mobile/tablet devices.
- **Fix:** Add a virtual joystick + action buttons overlay for touch devices, or at minimum show a "Keyboard & Mouse Required" message when touch is the only input detected.

### H13. No `preventDefault()` on Keydown
- **File:** `js/InputManager.js:16–17`
- **Issue:** Browser defaults fire for Space (scroll page), Tab (focus change), F1 (browser help), Ctrl+S (save dialog), etc.
- **Fix:**
  ```js
  document.addEventListener('keydown', (e) => {
      if (['Space', 'Tab', 'F1', 'F12'].includes(e.code) || (e.ctrlKey && e.code === 'KeyS')) {
          e.preventDefault();
      }
      this.keys[e.code] = true;
  });
  ```

### H14. Photo Mode Bypasses Pause
- **File:** `js/PhotoMode.js:198–212`, `js/main.js:1403–1412`
- **Issue:** Photo Mode uses raw `document.addEventListener('keydown', …)`. If the game is paused, pressing `F12` still enters Photo Mode. `Escape` exits Photo Mode instead of closing the pause menu.
- **Fix:** Check `paused` and `gameStarted` flags inside Photo Mode's key handler, or route Photo Mode through `InputManager` / `activeInput`.

### H15. No Error Boundary / WebGL Fallback
- **File:** `index.html:1483–1497`, `js/main.js`
- **Issue:** If WebGL is not supported or Three.js CDN fails, the user sees a blank black screen. No fallback message.
- **Fix:** Add a WebGL check and CDN fallback in `index.html`:
  ```html
  <script>
      const canvas = document.createElement('canvas');
      if (!canvas.getContext('webgl2')) {
          document.body.innerHTML = '<h1>WebGL 2 Required</h1><p>Please use a modern browser.</p>';
      }
  </script>
  ```

### H16. Loading Overlay Hidden Synchronously
- **File:** `js/main.js:1383–1384`
- **Issue:** `#loading-overlay` is hidden the instant the script finishes parsing. It does not wait for Three.js CDN modules, world generation, or shader compilation.
- **Fix:** Move the hide to the end of the init IIFE after all systems are instantiated, or gate it behind a `Promise.all` of critical async work.

### H17. SaveSystem Corruption Recovery Missing
- **File:** `js/SaveSystem.js:23–35`
- **Issue:** `load()` catches `JSON.parse` errors and logs a warning, but does not attempt recovery, fallback keys, or notify the user.
- **Fix:** Add a backup key and user notification:
  ```js
  load() {
      try {
          const raw = localStorage.getItem(this.key);
          if (!raw) return;
          const data = JSON.parse(raw);
          // ... deserialize ...
      } catch (e) {
          console.warn('SaveSystem: load failed', e);
          const backup = localStorage.getItem(this.key + '_backup');
          if (backup) {
              if (confirm('Save corrupted. Restore from backup?')) {
                  localStorage.setItem(this.key, backup);
                  location.reload();
              }
          }
      }
  }
  ```

### H18. Difficulty Tier Cycled Without Unlock Check
- **File:** `js/main.js:1567–1573`
- **Issue:** Pressing `M` cycles through Normal → Torment VI without verifying the tier is actually unlocked. `setTier` return value is ignored.
- **Fix:**
  ```js
  if (activeInput.wasPressed('KeyM')) {
      const tiers = ['normal', 'nightmare', 'hell', ...];
      let next = (current + 1) % tiers.length;
      while (next !== current && !difficultyTier.setTier(tiers[next])) {
          next = (next + 1) % tiers.length;
      }
  }
  ```

### H19. Puzzle Solve Callback Is Empty
- **File:** `js/main.js:978–983`
- **Issue:** `demoPuzzle.addBlockPuzzle(...)` has an empty arrow function `{}` for the solve callback.
- **Fix:** Implement the callback (e.g., open a door, spawn loot, play sound) or remove the puzzle if unfinished.

### H20. NPC Coordinates Not Validated
- **File:** `js/DialogueSystem.js:11–17`
- **Issue:** NPC coordinates (`malik: (2,1,-1)`, etc.) are hardcoded and not validated against world geometry.
- **Fix:** Query `world.getGroundHeight(x, z)` at runtime and offset Y accordingly, or store NPC spawn points as world object references.

### H21. Middle Mouse Button Ignored
- **File:** `js/InputManager.js:31–48`
- **Issue:** Only mouse buttons 0 (LMB) and 2 (RMB) are handled. Button 1 (MMB) is ignored, breaking potential middle-mouse binds.
- **Fix:**
  ```js
  } else if (e.button === 1) {
      this.mouse1Down = true;
      this.keys['Mouse3'] = true;
  }
  // And corresponding mouseup handling
  ```

---

## Medium Severity

### M1. 53 Console Statements in Release Code
- **Files:** See full list in audit data.
- **Fix:** Wrap all `console.*` calls behind a `__DEV__` flag, or strip them at build time:
  ```js
  const __DEV__ = window.location.hash === '#dev';
  if (__DEV__) console.warn('...');
  ```

### M2. Three Separate AudioContexts
- **Files:** `js/AudioManager.js:21`, `js/Collectibles.js`, `js/WeatherSystem.js:230`
- **Issue:** Wastes resources and risks quota exhaustion.
- **Fix:** Export a shared `AudioContext` from `AudioManager.js` and import it into `Collectibles.js` and `WeatherSystem.js`.

### M3. No Key Remapping Support
- **Files:** ALL `js/*.js`
- **Issue:** All key codes are hardcoded string literals. No config object or `localStorage` persistence for bindings.
- **Fix:** Create a `KeyBindings.js` module with a default map and load/save to `localStorage`. Replace all raw key strings with lookups (e.g. `bindings.get('jump')` → `'Space'`).

### M4. Gamepad State Clobbers Keyboard Input
- **File:** `js/GamepadController.js:67–70`
- **Issue:** Left stick unconditionally overwrites `KeyW/A/S/D` every frame. Slight stick drift on a resting gamepad clobbers keyboard input.
- **Fix:** Only write gamepad keys when the stick is actually outside the dead zone, and prefer keyboard when both are active:
  ```js
  // Detect keyboard activity this frame and skip gamepad WASD if keyboard is active
  ```

### M5. No Empty States for Multiple Panels
- **Files:** `js/UIManager.js:310–321`, `js/UIManager.js:338–350`, `js/UIManager.js:352–363`
- **Issue:** `#safehouse-upgrades`, `#codex-entries`, `#mastery-moves` show completely blank when their arrays are empty.
- **Fix:** Add fallback text:
  ```js
  container.innerHTML = upgrades.length ? upgrades.map(...).join('') : '<p class="empty">No upgrades available.</p>';
  ```

### M6. Settings Panel Missing from Start Screen
- **File:** `index.html:1515–1519`
- **Issue:** `#start-screen` has no Settings button. Settings can only be opened with `O` key or from the pause menu.
- **Fix:** Add a "Settings" button to `#start-screen` that opens `#settings-panel`.

### M7. Character Creation Has No Back/Skip Button
- **File:** `index.html:1500–1513`
- **Issue:** `#char-create` forces the user to pick an origin + archetype with no way to return to the start screen.
- **Fix:** Add a "Back" button that clears `sessionStorage` and shows `#start-screen`.

### M8. sessionStorage for Character Creation Evaporates on Tab Close
- **File:** `js/main.js:228–235`
- **Issue:** Origin/archetype choices are stored in `sessionStorage`, which is cleared when the tab/browser closes.
- **Fix:** Use `localStorage` instead, or ensure the unified save captures them immediately.

### M9. ChallengeSystem JSON.parse Unguarded
- **File:** `js/ChallengeSystem.js:51, 197`
- **Issue:** `_loadAchievements()` and `_loadDiscoveredTricks()` do `JSON.parse(saved)` outside the `try/catch`. Corrupted data crashes initialization.
- **Fix:** Move `JSON.parse` inside the `try` block.

### M10. Weapon Bar Has `pointer-events: none`
- **File:** `index.html:21`, `js/WeaponSystem.js:388–411`
- **Issue:** `#ui` has `pointer-events: none`. The weapon bar appended inside it inherits this, preventing any future click-to-switch interactivity.
- **Fix:**
  ```css
  #weapon-bar { pointer-events: auto; }
  ```

### M11. Speedrun Panel Referenced but Does Not Exist
- **File:** `js/WeaponSystem.js:262`
- **Issue:** Defensive check for `document.getElementById('speedrun-panel')`, but no such element exists in `index.html`. Dead code.
- **Fix:** Remove the defensive check or create the panel.

### M12. `SkillSystem.resetAllCooldowns()` Is Dead Code
- **File:** `js/SkillSystem.js:295–298`
- **Issue:** Exists but is never called. Potential debug artifact.
- **Fix:** Remove if unused, or gate behind `__DEV__`.

### M13. PassiveTree Manual Load Hack
- **File:** `js/main.js:447–454`
- **Issue:** Hard-codes `saveSystem.key` and duplicates JSON.parse logic. Brittle if the key ever changes.
- **Fix:** Move `passiveTree` instantiation before `saveSystem.load()`, or add a `saveSystem.registerLate()` API.

### M14. Photo Mode / RunnerVision / LevelEditor Bypass InputManager
- **Files:** `js/PhotoMode.js`, `js/RunnerVision.js`, `js/LevelEditor.js`
- **Issue:** Raw `document.addEventListener('keydown', ...)` bypasses both `InputManager` and `GamepadController`.
- **Fix:** Route these through `activeInput` or at minimum check for gamepad equivalents.

### M15. No 3D Positional Audio
- **File:** `js/AudioManager.js`
- **Issue:** Imports `THREE` but never creates `THREE.AudioListener` or attaches positional audio to the camera.
- **Fix:** Add a `THREE.AudioListener` to the camera and use `THREE.PositionalAudio` for in-world sounds (footsteps, gunfire, explosions).

### M16. Audio Nodes Never Disconnected
- **File:** `js/AudioManager.js:421–454, 457–480`
- **Issue:** Oscillators/filters/gains are stopped but never disconnected from the audio graph.
- **Fix:** Call `.disconnect()` on all created nodes before dropping references.

### M17. Player Invincibility Timeout Stacking
- **File:** `js/Player.js:1883, 2005`
- **Issue:** Rapid death/respawn can stack `setTimeout` timers, causing `isInvincible = false` to fire early from an old timer.
- **Fix:** Store timer IDs and clear them:
  ```js
  clearTimeout(this._invincibilityTimer);
  this._invincibilityTimer = setTimeout(() => { this.isInvincible = false; }, duration);
  ```

### M18. Empty `catch (e) {}` Blocks Hide Failures
- **Files:** `js/AudioManager.js:82,319,487,489`, `js/ConsequenceSystem.js:115,126`, `js/DebtSystem.js:169,182`, `js/GamepadController.js:128`, `js/InteractiveEnvironment.js:863,892,917`, `js/WeatherSystem.js:272,277`, `js/main.js:448,1298`
- **Fix:** Log at minimum:
  ```js
  catch (e) { if (__DEV__) console.warn(e); }
  ```

### M19. No Haptics Config / Disable Option
- **File:** `js/GamepadController.js:119–129`
- **Issue:** No UI or setting to disable/enable rumble.
- **Fix:** Add a "Vibration" toggle to Settings and guard all `gamepad.rumble()` calls.

### M20. GhostRacing Iterates All localStorage Keys
- **File:** `js/GhostRacing.js:102`
- **Issue:** `loadRandomGhosts()` iterates every `localStorage` key. If localStorage is large (from other sites), this blocks the main thread.
- **Fix:** Filter by known prefix:
  ```js
  const keys = Object.keys(localStorage).filter(k => k.startsWith('ghostRun_'));
  ```

### M21. Settings Schema Has No Versioning
- **File:** `js/main.js:1192`
- **Issue:** `apex_settings` has no version field. Adding a new toggle later will leave old saves with `undefined` values.
- **Fix:**
  ```js
  const SETTINGS_KEY = 'apex_settings_v1';
  // and merge defaults
  function applySettings(raw) {
      const settings = { ...DEFAULT_SETTINGS, ...raw };
      // ...
  }
  ```

### M22. No Export/Import for Unified Save
- **File:** `js/SaveSystem.js`
- **Issue:** Players cannot backup or transfer saves.
- **Fix:** Add download/upload JSON methods:
  ```js
  exportToFile() {
      const blob = new Blob([localStorage.getItem(this.key)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'apex-rift-save.json';
      a.click();
  }
  ```

### M23. Rumble Signature Mismatch
- **File:** `js/GamepadController.js:119–129`
- **Issue:** `rumble(intensity, duration)` takes 2 parameters, but callers pass 3 (e.g., `rumble(0.3, 0.7, 100)`). The 3rd is silently ignored.
- **Fix:** Update signature to `rumble(intensity, duration, delay = 0)` and pass all args through.

### M24. Director Mode / Arena Mode Bound to Undocumented Keys
- **File:** `js/main.js:1563–1565`
- **Issue:** `Shift+T` toggles `arenaMode.toggleSelector()` with no in-game explanation.
- **Fix:** Remove the binding or add it to the controls help panel.

### M25. Day/Night Toggle Ignores Gamepad
- **File:** `js/main.js:1641`
- **Issue:** Uses raw `input` instead of `activeInput`.
- **Fix:** Change to `activeInput.wasPressed('KeyN')`.

### M26. `Player.updateVisuals` During Countdown Uses Raw Input
- **File:** `js/main.js:1664`
- **Issue:** `player.updateVisuals(dt, ..., input)` uses keyboard-only `input` during countdown. Ignores gamepad.
- **Fix:** Pass `activeInput` instead.

### M27. Weapon System Defensive Checks Inconsistent
- **File:** `js/WeaponSystem.js:262–268`
- **Issue:** Guards `if (input && input.wasPressed && ...)` before calling methods, but other modules call directly without guards.
- **Fix:** Standardize: either all modules guard or none do (preferring the latter if `input` is guaranteed).

### M28. Difficulty Popup Missing Close Button
- **File:** `index.html:1939`, `js/DifficultyTierSystem.js:136–150`
- **Issue:** `#difficulty-popup` can only be closed by clicking the badge again. No × button, no click-outside-to-close.
- **Fix:** Add an × button and a `mousedown` outside listener to dismiss.

### M29. Celebration Element Has No Dismiss Button
- **File:** `index.html:1615`, `js/TimeTrial.js:280`
- **Issue:** New-best-time celebration has no dismiss button and no early-hide API.
- **Fix:** Add a 5-second auto-hide and a close button.

### M30. Legacy Health Bar Hidden in CSS
- **File:** `index.html:697–702`
- **Issue:** `#player-health-bar` and `#player-health-text` are dead DOM with `display: none !important`.
- **Fix:** Remove from `index.html`.

### M31. Settings Panel Lacks Explicit Close Button
- **File:** `index.html:1967`
- **Issue:** Only an × span; no explicit "Close" button for accessibility.
- **Fix:** Add `<button class="btn-close">Close</button>`.

### M32. Passive Tree Buttons Rebuilt on Every Open
- **File:** `js/PassiveTree.js:133–140`
- **Issue:** `_renderUI()` rebuilds DOM from scratch every toggle.
- **Fix:** Cache the DOM or use a diffing approach. (Low priority; functionally OK.)

### M33. No Audio Category Buses
- **File:** `js/AudioManager.js`
- **Issue:** Only master, dry (SFX), and ambience buses. No separate voice, UI, or music buses.
- **Fix:** Add `musicGain`, `voiceGain`, `uiGain` nodes.

### M34. No Loading State for World Generation
- **File:** `js/main.js:207–1000`
- **Issue:** Dozens of systems instantiated synchronously with no progress indicator.
- **Fix:** Show "Generating world..." text and update it between subsystem batches.

### M35. No Empty State for Bounty Contracts Panel
- **File:** `js/UIManager.js:323–336`
- **Issue:** Shows "No active contracts" initially, but stale text persists if contracts are accepted later because `_panelDirty.bounty` gates re-render.
- **Fix:** Force re-render on bounty state change, or use a reactive observer pattern.

---

## Low Severity

### L1. Unused `THREE` Import in GamepadController
- **File:** `js/GamepadController.js:1`
- **Fix:** Remove `import * as THREE from 'three';`

### L2. Dead `this.ctx` in GamepadController
- **File:** `js/GamepadController.js:21`
- **Fix:** Remove `this.ctx = null;`

### L3. Right-Stick Sensitivity Hardcoded
- **File:** `js/GamepadController.js:75–76`
- **Fix:** Add a "Camera Sensitivity" slider to Settings and read it at runtime.

### L4. `Object.entries` on Button Map Returns Strings
- **File:** `js/GamepadController.js:79–89`
- **Issue:** String keys coerce back to numbers, but is fragile.
- **Fix:** Use `for (let i = 0; i < gp.buttons.length; i++)` instead.

### L5. Placeholder Comments in Source
- **Files:** `js/InventorySystem.js:95`, `js/main.js:244–246`, `js/WeatherSystem.js:43`, `js/NephalemGlory.js:254`, `js/LootSystem.js:422`, `js/DroneAI.js:488`, `js/SkillSystem.js:295`, `js/ResourceSystem.js:68`
- **Fix:** Clean up or rephrase to production-friendly comments.

### L6. No Version / Build Metadata
- **Files:** `js/main.js`, `index.html`
- **Fix:** Add a `const VERSION = '1.0.0';` and render it in the start screen or settings footer.

### L7. Parent-Directory Imports Valid but Unverified at Runtime
- **Files:** `js/minibosses/*.js`
- **Note:** All verified to exist. No fix needed.

### L8. `alert()` Used for Editor Import Error
- **File:** `js/EditorUI.js:62–63`
- **Fix:** Replace with in-game toast or console-only error for release.

### L9. `_consumeKeyPress` Hack in main.js
- **File:** `js/main.js:1457–1462`
- **Issue:** Manually mutates `prevKeys` on both input managers, breaking encapsulation.
- **Fix:** Refactor to use `InputManager.consumeKey(code)` API.

### L10. `ensureInit` Called Every SFX Play
- **File:** `js/AudioManager.js`
- **Note:** Low overhead; acceptable pattern.

### L11. `LevelEditor.js` Internal Hotkey Docs in Source
- **File:** `js/LevelEditor.js:10–16`
- **Fix:** Move to `AGENTS.md` or remove from release source.

### L12. `SpeedrunILs.js` Debug-Oriented Comment
- **File:** `js/SpeedrunILs.js:245–246`
- **Fix:** Remove "visualised only in debug" comment.

### L13. `WeaponModSystem` Slot Key Ambiguity
- **File:** `js/WeaponModSystem.js:206–214`
- **Issue:** `Number(weaponSlot) || weaponSlot`. If enum values change, Map keys mismatch.
- **Fix:** Normalize keys consistently (always string or always number).

### L14. `DungeonSystem` Enter/Exit Silent
- **File:** `js/DungeonSystem.js:267+`
- **Fix:** Add audio hook for dungeon transitions.

### L15. `ShopSystem` Open/Close/Buy Silent
- **File:** `js/ShopSystem.js`
- **Fix:** Add UI click sounds to shop interactions.

### L16. `DialogueSystem` Advance/Open/Close Silent
- **File:** `js/DialogueSystem.js:154+`
- **Fix:** Add subtle UI blip on dialogue advance.

### L17. `PhotoMode` Enter/Exit/Screenshot Silent
- **File:** `js/PhotoMode.js:147–192`
- **Fix:** Add shutter sound on screenshot.

### L18. `RunnerVision` Toggle Silent
- **File:** `js/RunnerVision.js:65–67`
- **Fix:** Add toggle sound.

---

## Storefront / Certification Blockers

| Issue | Certification Relevance |
|-------|------------------------|
| Missing credits/legal (Three.js MIT) | **Nintendo, Sony, Microsoft, Apple** all require third-party attribution. |
| No touch support | Mobile storefronts (App Store, Google Play) will reject or rate poorly. |
| No error handling for WebGL failure | Console cert requires graceful degradation messaging. |
| Save corruption with no recovery | Platform holders require robust save data handling. |
| Debug features exposed (Editor, console logs) | Some cert processes flag exposed dev tools. |
| No version/build metadata | Required by most storefront metadata systems. |
| No pause/resume state cleanup | Console TCR/TRC require proper suspend/resume handling. |

---

## Fix Priority Roadmap

### Week 1 — Blockers
1. Gate/remove Level Editor (`C1`)
2. Add Save/Load confirmations (`C2`)
3. Remove double `preUpdate()` (`C3`)
4. Register all missing systems with `SaveSystem` (`C4`)
5. Fix scroll wheel weapon switching (`C5`)
6. Fix gamepad R2 + L3 mappings (`C6`, `C7`)
7. Add damage/death/weapon audio (`C8`)
8. Fix ambience stacking (`C9`)

### Week 2 — High Priority
9. Add credits/legal notices (`H1`)
10. Resolve key conflicts (`H2`)
11. Add inventory UI (`H3`)
12. Wire level-up toast (`H4`)
13. Fix ChallengeSystem listener leak (`H5`)
14. Cap BlackoutSystem history (`H6`)
15. Fix pause-panel interaction (`H7`)
16. Freeze game loop on death (`H8`)
17. Add rift result close button (`H9`)
18. Fix quit-to-menu state reset (`H10`)
19. Fix boss exit player reset (`H11`)
20. Add touch support or block message (`H12`)
21. Add `preventDefault` to InputManager (`H13`)
22. Route Photo Mode through input abstraction (`H14`)
23. Add WebGL fallback screen (`H15`)
24. Fix loading overlay timing (`H16`)
25. Add save corruption recovery (`H17`)
26. Gate difficulty tier cycling (`H18`)
27. Implement or remove empty puzzle callback (`H19`)
28. Validate NPC positions (`H20`)
29. Add MMB support (`H21`)

### Week 3 — Medium Priority
30. Strip console logs (`M1`)
31. Unify AudioContexts (`M2`)
32. Add key remapping (`M3`)
33. Fix gamepad/keyboard fighting (`M4`)
34. Add empty states (`M5`)
35. Add Settings to start screen (`M6`)
36. Add Back button to char create (`M7`)
37. Use localStorage for char creation (`M8`)
38. Guard ChallengeSystem JSON.parse (`M9`)
39. Add pointer-events to weapon bar (`M10`)
40. Remove dead speedrun-panel check (`M11`)
41. Remove dead `resetAllCooldowns` (`M12`)
42. Fix passiveTree load hack (`M13`)
43. Unify raw key listeners (`M14`)
44. Add positional audio (`M15`)
45. Disconnect audio nodes (`M16`)
46. Clear invincibility timers (`M17`)
47. Log empty catches (`M18`)
48. Add haptics toggle (`M19`)
49. Prefix-filter GhostRacing keys (`M20`)
50. Version settings schema (`M21`)
51. Add save export/import (`M22`)
52. Fix rumble signature (`M23`)
53. Document or remove director/arena keys (`M24`)
54. Fix gamepad-ignored inputs (`M25`, `M26`)
55. Standardize input guards (`M27`)
56. Add close/dismiss to popups (`M28`, `M29`)
57. Remove dead health bar DOM (`M30`)
58. Add accessible close buttons (`M31`)
59. Add loading progress text (`M34`)
60. Fix bounty panel dirty flag (`M35`)

---

*End of Report*
