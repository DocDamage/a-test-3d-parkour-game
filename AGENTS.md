# Agent Guide — Apex Rift (Warehouse Parkour Playground)

This file is the **map**, not the encyclopedia. For deeper context, see:
- `docs/ARCHITECTURE.md` — module graph, dependency rules, performance budgets
- `docs/DESIGN.md` — core beliefs, skill design philosophy, anti-patterns
- `docs/QUALITY.md` — system grades, known debt, action priority
- `docs/plans/` — execution plans with decision logs

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
js/*.js             — One module per subsystem.
docs/               — Architecture, design, quality, plans
scripts/            — check.sh / check.ps1 for mechanical validation
```

**Rule:** Every new gameplay module gets its own `js/ModuleName.js` file. Do not bloat `Player.js` or `World.js`.

---

## Critical Integration Points

### Player.js Contract
All subsystems expect `player` to expose:
- `position`, `velocity` (THREE.Vector3)
- `state` (string), `grounded` (boolean), `facing` (number)
- `health`, `maxHealth`, `isDead`, `isInvincible`
- `takeDamage(amount, type, source)`, `heal(amount)`, `die()`, `respawn()`
- `getRPGStats()` → merged base + gear + temp bonuses
- `RADIUS`, `currentHeight`

### main.js Time Dilation
```javascript
const timeScale = overclock.update(dt, activeInput);
const slowMo = droneTakedown.update(dt, player, activeInput, world.drones.drones);
const finalDt = dt * Math.min(timeScale, slowMo);
```
All gameplay updates receive `finalDt`. Visual FX can use `dt`.

### World Arrays
- `world.collidables[]` — THREE.Mesh objects for AABB collision
- `world.climbables[]` — subset of collidables the player can climb
- `world.platforms[]` — MovingPlatform or compatible objects
- `world.drones.drones[]` — DroneAI instances

**Never** mutate these arrays directly from gameplay modules.

### InputManager API
```javascript
input.preUpdate();          // Snapshot previous frame (call FIRST in animate)
input.isPressed('KeyW');    // Held this frame
input.wasPressed('KeyW');   // Pressed this frame (edge)
input.wasReleased('KeyW');  // Released this frame (edge)
input.consumeMouse();       // Returns {x, y} delta and resets
```

---

## Adding a New Module

1. Create `js/MyModule.js` exporting a class.
2. Import it in `js/main.js` (after existing imports).
3. Instantiate it after `world` and `player` exist.
4. Call `.update(finalDt, ...)` inside the `animate()` loop.
5. If it needs input, call `.handleInput(activeInput)` before the physics update.
6. If it creates THREE objects, implement a `.dispose()` or `.cleanup()` method.
7. Add its controls to `index.html` `#ui` panel if player-facing.
8. Run `scripts/check.ps1` (or `check.sh`) before committing.

---

## Mechanical Validation

Run before every commit:
```powershell
scripts/check.ps1   # Windows
scripts/check.sh    # Unix
```

This checks:
- `node -c` on all `js/*.js` files
- File size limits (2000 lines max)
- Docs freshness (`docs/ARCHITECTURE.md`, `DESIGN.md`, `QUALITY.md` exist)

---

## Common Pitfalls

1. **Pointer lock vs editor mode** — The Level Editor exits pointer lock. Do not mix `input.consumeMouse()` with `LevelEditor._editorMouse`.
2. **`finalDt` vs `dt`** — Gameplay uses `finalDt` (time-dilated). Visual FX can use `dt`. Photo mode uses `dt` and early-returns from `animate()`.
3. **World array sync** — The Level Editor rebuilds `world.collidables` on play mode entry. Do not cache references across editor toggles.
4. **Constructor signatures** — Always verify a module's constructor signature before instantiating. Many classes expect `(scene, player, world)` in different orders.

---

## Git Workflow

Simple trunk-based development:
1. Run `scripts/check.ps1` (or `check.sh`).
2. Commit with descriptive messages.
3. Push to `origin/master`.

---

## Useful References

- Three.js docs: https://threejs.org/docs/
- Three.js examples: https://threejs.org/examples/
- Web Gamepad API: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
