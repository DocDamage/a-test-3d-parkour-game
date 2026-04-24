# Warehouse Parkour Playground

A browser-based 3D parkour playground built with **Three.js r160** (ES modules). No build step required—just serve the files and play.

> 🎮 **Play now:** Serve the repo root with any static file server (`python -m http.server 8080`) and open `http://localhost:8080`.

---

## Features

### Core Parkour
- **Responsive movement** — ground acceleration, air control, coyote time, jump buffering
- **15 movement states** — Idle, Walk, Sprint, Crouch, Jump, Fall, Climb, Slide, Vault, Wallrun, Hang, Roll, Stumble, Ragdoll, Grapple, Swing
- **Advanced tech** — crouch jumps, edge boosts, climb cancel kicks, chain vaulting, bunny-hop chaining, strafe jumps

### World & Environment
- **Original warehouse** — 80×80m floor, perimeter walls, ceiling beams, atmospheric lighting
- **8 interactive areas** — moving platform gauntlet, laser corridor, glass bridge, wrecking ball room, fan shaft, spinner alley, conveyor run, mirror room
- **7 specialized zones** — Rooftop, Underground Tunnel, Vertical Shaft, Water Treatment, Freezer Section (icy physics), Server Room (lasers + narrow corridors), Hangar Bay (massive open floor + crane)
- **Dynamic weather** — rain (slippery), steam (blinds drones), power outage (lasers off + emergency strobes)
- **Structural collapse** — fracture physics on marked walls

### Grappling & Traversal
- **Grappling hook** — aim with RMB, pendulum physics swing, constant-speed retract
- **Zipline network** — grab and slide with Space
- **Chain grapple relays** — cyan rings reset cooldown
- **Magnet boots** — ceiling run with Ctrl

### Combat & Drones
- **Base drones** — patrol, detect, chase
- **Sniper drones** — ground-tracking laser, stun projectile
- **Swarm drones** — 3-drone triangle formation, simultaneous detection locks player
- **Hunter drones** — platform-destroying pursuit (Rising Tide only)
- **Drone takedown** — press F while wall-running

### Boss Fight: The Overseer
- **3-phase arena battle** in a custom circular arena
- **Phase 1** — Ground supremacy: sweep beam, shockwave slam, drone spawns
- **Phase 2** — Aerial dominance: dive bombs, missile barrage, platform purge, perimeter lasers
- **Phase 3** — Overclocked fury: time distortion fields, healing drones, arena collapse
- **Weak-point cores** — destroy all 3 to win; S-F grading based on hits taken

### Power-Ups (10 Types)
Speed, Ghost, Double Jump, Gravity, Magnet, Time Freeze, Super Jump, Invincible, Bounce, Teleport

### Level Editor
- **In-browser 3D editor** — press F1 to toggle
- **14 placeable object types** — platforms, walls, ramps, moving platforms, hazards, drones, collectibles, grapple points, power-ups, vents, mirrors, checkpoints, spawn points
- **Mouse tools** — click to place/select, right-click to delete, drag to move, scroll to rotate, shift+scroll to scale
- **Properties panel** — live-edit position, rotation, scale, color, and type-specific settings
- **Export/Import JSON** — save and share custom levels
- **Free-fly camera** — WASD + Q/E + middle-mouse orbit

### Photo & Cinematic Modes
- **Photo mode** — F12, orbit camera, filter presets (grayscale, sepia, invert, cyberpunk, overexposed)
- **Director mode** — AI camera predicts highlight moments, records 30s rolling buffer

### Progression & Challenges
- **Time trial** — 10-checkpoint race with ghost replay
- **Speedrun ILs** — per-zone time trials (1=Rooftop, 2=Freezer, 3=Server, 4=Hangar) with S-F grades
- **Rising Tide** — endless survival mode, toxic sludge rises from below
- **Ghost racing** — record/replay + up to 5 random ghost capsules
- **Combo system** — flow meter with 1.0–1.30× speed boost
- **Trick dictionary** — 6 discoverable named sequences
- **Daily seed leaderboard** — same layout for everyone, 24h rotation
- **Movement grade** — S/A/B/C/D/F based on input perfection, chain length, stumble count
- **10 achievements** — First Blood, First Vault, First Wallrun, Sky Hunter, Speed Demon, Flow Master, Chip Hoarder, Survivor, Destroyer, Photographer, First Boss Kill

### Accessibility
- **Assist mode** — Shift+P: extended coyote time, auto-vault, halved knockback, slower drones, slower Rising Tide
- **Full gamepad support** — Xbox/PS/Switch Pro with auto-detection, dead zones, rumble on hard landings

### Visual Effects
- **Post-processing chain** — SAO → Bloom → Motion Blur → Film Grain → Chromatic Aberration → Vignette → Output
- **Day/Night/Neon presets** — N key to cycle
- **God rays** — 4 volumetric shafts with dust motes
- **Lens flares** — on atmospheric point lights
- **Particle effects** — speed lines, sparks, dust, explosions
- **Procedural animation** — head tracking, breathing, lean
- **Foot IK** — slope adaptation, wall bracing

### Audio
- **Procedural Web Audio API synthesis** — no external audio files
- Dynamic ambience, UI clicks, movement audio hooks

---

## Controls

### Keyboard & Mouse
| Key | Action |
|-----|--------|
| `W A S D` | Move |
| `Shift` | Sprint |
| `Space` | Jump / Grab / Hang |
| `C` | Slide / Crouch / Roll |
| `Q` | Air Dash |
| `Shift + Q` | Overclock (slow-mo + 2 dashes) |
| `Ctrl` | Magnet Boots (ceiling run) |
| `F` | Drone Takedown (while wall-running) |
| `E` | Drop / Interact / Mirror Rotate |
| `Mouse2` | Grapple Aim |
| `T` | Time Trial |
| `P` | Rising Tide Mode |
| `Shift + P` | Assist Mode |
| `N` | Day / Night / Neon |
| `F12` | Photo Mode |
| `V` | Runner Vision |
| `F1` | Level Editor |
| `B` | Boss Fight |
| `1-4` | Speedrun ILs (Rooftop / Freezer / Server / Hangar) |

### Controller (Xbox / PlayStation / Switch Pro)
| Input | Action |
|-------|--------|
| Left Stick | Move |
| Right Stick | Look |
| A / Cross | Jump / Grab |
| B / Circle | Slide / Crouch |
| X / Square | Air Dash |
| Y / Triangle | Drop |
| LB / L1 | Sprint |
| RB / R1 | Takedown |
| LT / L2 | Grapple Aim |
| RT / R2 | Overclock |
| L3 | Magnet Boots |
| R3 | Day / Night |

### Level Editor
| Input | Action |
|-------|--------|
| `Click` | Place / Select |
| `Right-Click` | Delete |
| `Drag` | Move selected |
| `Shift + Drag` | Move on Y axis only |
| `Scroll` | Rotate Y |
| `Shift + Scroll` | Scale uniformly |
| `Middle-Mouse Drag` | Orbit camera |
| `W A S D` | Fly camera |
| `Q / E` | Move camera up / down |
| `Space` | Fast camera speed |
| `G` | Toggle grid snap |
| `H` | Toggle helpers |
| `Delete` | Delete selected |
| `Ctrl + Z` | Undo |
| `Ctrl + S` | Export level JSON |
| `Ctrl + O` | Import level JSON |

---

## Architecture

```
index.html          — UI panels, canvas container, controls overlay
js/main.js          — Game loop hub: imports all modules, wires updates, handles input dispatch
js/Player.js        — Full state-machine parkour controller (~1700 lines)
js/World.js         — Warehouse geometry, zones, object placement
js/ThirdPersonCamera.js — Orbit camera with collision avoidance
js/InputManager.js  — Keyboard + mouse input with edge detection
js/GamepadController.js — Gamepad API with dead zones and rumble
js/PostProcessing.js — EffectComposer chain + day/night transitions
js/AudioManager.js  — Procedural Web Audio synthesis
```

### Gameplay Modules
```
js/GrapplingHook.js        — Aim/swing/retract with cable visual
js/ComboSystem.js          — Flow meter + speed boost
js/DroneAI.js              — Base patrol drone
js/AdvancedDrones.js       — Sniper, Swarm, Hunter variants
js/DroneTakedown.js        — Wall-run takedown + slow-mo
js/ZiplineNetwork.js       — Grab/slide traversal
js/OverclockSystem.js      — Heat-based slow-mo
js/MagnetBoots.js          — Ceiling run
js/ChainGrappleRelays.js   — Cooldown reset rings
js/Collectibles.js         — Data chips
js/TimeTrial.js            — Race mode with checkpoints
js/RunnerVision.js         — Highlight interactive objects
js/DecalSystem.js          — Wall-run decals
js/Hazards.js              — Lasers, glass, wrecking balls, fans, spinners, conveyors
js/WeatherSystem.js        — Rain/steam/power-outage visuals
js/WeatherGameplay.js      — Weather affects friction, drones, lasers
js/PowerUpSystem.js        — 10 collectible orbs
js/HologramPlatforms.js    — Sprint-to-solidify platforms
js/StructuralCollapse.js   — Fracture physics
js/RisingTide.js           — Endless sludge survival
js/MovingPlatform.js       — Path-based moving platforms
js/ParticleEffects.js      — Speed lines, sparks, dust, explosions
js/LensFlare.js            — Point light lens flares
js/GodRays.js              — Volumetric light shafts
js/FootIK.js               — Slope/wall bracing IK
js/ProceduralAnimation.js  — Head tracking, breathing, lean
```

### New Systems
```
js/LevelEditor.js          — Full 3D level editor
js/BossFight.js            — 3-phase boss arena
js/AdvancedMovement.js     — Crouch jump, edge boost, climb cancel, chain vault
js/InteractiveEnvironment.js — Breakable vents, magnetic crane, steam pipes, mirrors
js/DirectorMode.js         — AI cinematic camera
js/GhostRacing.js          — Record/replay ghost runs
js/BulletTime.js           — Spatial slow-mo triggers
js/AssistMode.js           — Accessibility modifiers
js/SpeedrunILs.js          — Per-zone time trials
js/ChallengeSystem.js      — Style points, trick dictionary, daily seed, movement grades
js/PhotoMode.js            — Orbit camera + filters
js/Trajectory.js           — Grapple trajectory line
```

---

## Development Setup

No build tooling required.

```bash
# Clone the repo
git clone https://github.com/DocDamage/a-test-3d-parkour-game.git
cd a-test-3d-parkour-game

# Serve with any static file server
python -m http.server 8080

# Open in browser
open http://localhost:8080
```

### Requirements
- Modern browser with WebGL 2 support
- ES module support (all modern browsers)

### CDN Dependencies
- `three` @ 0.160.0 (via unpkg importmap)
- `three/addons/` (examples/jsm) @ 0.160.0

---

## Level Format

Levels are JSON files with this structure:

```json
{
  "version": 1,
  "metadata": { "name": "My Level", "author": "Player", "created": "2026-04-24" },
  "spawnPoint": { "x": 0, "y": 2, "z": 0 },
  "objects": [
    {
      "type": "platform",
      "position": { "x": 5, "y": 1, "z": 0 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "scale": { "x": 1, "y": 1, "z": 1 },
      "color": 8899994,
      "props": { "width": 4, "height": 0.4, "depth": 4 }
    }
  ]
}
```

Import via the Level Editor (`Ctrl+O`) or programmatically with `levelEditor.importLevel(jsonString)`.

---

## License

MIT License — feel free to fork, modify, and build on top of this playground.

---

Built with ❤️ and way too many `requestAnimationFrame` callbacks.
