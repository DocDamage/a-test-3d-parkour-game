# Agent Guide — Warehouse Parkour Playground

This file contains instructions for AI coding agents working on this project.

---

## Tech Stack

- **Renderer:** Three.js r160 (ES modules via CDN importmap)
- **Post-processing:** EffectComposer → SAO → Bloom → MotionBlur → FilmGrain → ChromaticAberration → Vignette → OutputPass
- **Audio:** Web Audio API procedural synthesis (no external files)
- **Build:** None. Pure ES modules, served statically.
- **Platform:** Browser only (WebGL 2 required)

---

## File Organization

```
index.html          — UI panels, canvas, importmap, CSS
js/main.js          — Game loop hub. Imports ALL modules, wires updates.
js/Player.js        — ~1700-line state machine. THE source of truth for player state.
js/World.js         — Geometry, zones, collidables, platforms, climbables.
js/*.js             — One module per subsystem (see README.md for full list).
```

**Rule:** Every new gameplay module gets its own `js/ModuleName.js` file. Do not bloat `Player.js` or `World.js` with new feature logic.

---

## Critical Integration Points

### Player.js Contract
All subsystems expect `player` to expose:
- `position`, `velocity` (THREE.Vector3)
- `state` (string: IDLE, WALK, SPRINT, CROUCH, JUMP, FALL, CLIMB, SLIDE, VAULT, WALLRUN, HANG, ROLL, STUMBLE, RAGDOLL, GRAPPLE_AIM, SWING, RETRACT)
- `grounded` (boolean), `facing` (number/radians)
- `RADIUS`, `currentHeight`
- `comboSystem`, `grapplingHook`
- `mesh`, `leftArm`, `rightArm`
- Methods: `startJump()`, `startStumble()`, `startRagdoll()`, `respawn()`, `jump()`, `takeDamage(amount)`

### main.js Time Dilation
```javascript
const timeScale = overclock.update(dt, activeInput);
const slowMo = droneTakedown.update(dt, player, activeInput, world.drones.drones);
const finalDt = dt * Math.min(timeScale, slowMo);
```
All gameplay updates receive `finalDt`. Visual/camera FX can use `dt` or `renderDt`.

### World Arrays
- `world.collidables[]` — THREE.Mesh objects for AABB collision
- `world.climbables[]` — subset of collidables the player can climb
- `world.platforms[]` — MovingPlatform or compatible objects
- `world.grapplePoints[]` — THREE.Vector3 positions
- `world.hazards.lasers[]`, `world.hazards.spinners[]`
- `world.drones.drones[]`
- `world.collectibles.chips[]`

**Never** mutate these arrays directly from gameplay modules. Use the Level Editor or World's placement methods.

### InputManager API
```javascript
input.preUpdate();          // Snapshot previous frame (call FIRST in animate)
input.isPressed('KeyW');    // Held this frame
input.wasPressed('KeyW');   // Pressed this frame (edge)
input.wasReleased('KeyW');  // Released this frame (edge)
input.consumeMouse();       // Returns {x, y} delta and resets
```

### GamepadController API
```javascript
const activeInput = (gamepad.gamepad) ? gamepad : input;
```
GamepadController mirrors InputManager's interface. Always fall back to keyboard/mouse.

---

## Adding a New Module

1. Create `js/MyModule.js` exporting a class.
2. Import it in `js/main.js` (after existing imports).
3. Instantiate it after `world` and `player` exist.
4. Call `.update(finalDt, ...)` inside the `animate()` loop.
5. If it needs input, call `.handleInput(activeInput)` before the physics update.
6. If it creates THREE objects, implement a `.dispose()` or `.cleanup()` method.
7. Add its controls to `index.html` `#ui` panel if player-facing.

---

## Post-Processing

The composer chain is built in `js/PostProcessing.js`. Adding a new pass:
1. Import the pass class in `PostProcessing.js`.
2. Insert it into `this.composer.addPass(...)` in the constructor.
3. Expose a setter if it needs runtime configuration.

---

## Audio

All audio is procedural. `AudioManager.js` contains synthesis functions. No external audio files.
- Use `audio.playUIClick()`, `audio.playAmbience()` for standard sounds.
- Add new synthesis methods to `AudioManager.js` for new SFX.

---

## Performance Budget

| System | Target CPU/frame |
|--------|-----------------|
| Player physics + collision | < 1ms |
| Foot IK (4 raycasts) | < 0.5ms |
| Drone AI (all drones) | < 0.5ms |
| Post-processing (full chain) | GPU-bound, ~2ms on mid-range |
| Particle effects | < 0.3ms |

If adding heavy systems (physics bodies, navmesh, many NPCs), gate them behind `config.enabled` flags.

---

## Testing Checklist

Before committing a feature:
- [ ] `node -c js/main.js` passes (syntax check)
- [ ] New module has `node -c js/NewModule.js` pass
- [ ] Game loads at `http://localhost:8080` without console errors
- [ ] Feature works with keyboard + mouse
- [ ] Feature works with gamepad (if applicable)
- [ ] Feature does not break existing modules (player movement, time trial, photo mode)
- [ ] Memory: no geometry/material leaks on repeated start/stop cycles

---

## Common Pitfalls

1. **Pointer lock vs editor mode** — The Level Editor exits pointer lock. Mouse deltas for camera are tracked via `input.consumeMouse()` (pointer lock) or `LevelEditor._editorMouse` (middle-mouse drag). Do not mix them.

2. **`finalDt` vs `dt`** — Gameplay uses `finalDt` (time-dilated). Visual FX can use `dt`. Photo mode uses `dt` and early-returns from `animate()`.

3. **World array sync** — The Level Editor rebuilds `world.collidables`, `world.platforms`, etc. on play mode entry via `syncWorldArrays()`. Do not cache references to world arrays across editor toggles.

4. **Boss Fight arena isolation** — BossFight creates its own geometry and adds it to `world.collidables`. `cleanup()` removes it. Do not confuse boss arena objects with editor objects.

5. **Constructor signatures** — Always verify a module's constructor signature before instantiating. Many classes expect `(scene, player, world)` in different orders.

---

## Git Workflow

This repo uses simple trunk-based development:
1. Make changes on a feature branch if experimenting.
2. Ensure `node -c` passes on all modified `.js` files.
3. Commit with descriptive messages.
4. Push to `origin/main`.

---

## Useful References

- Three.js docs: https://threejs.org/docs/
- Three.js examples: https://threejs.org/examples/
- Web Gamepad API: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
