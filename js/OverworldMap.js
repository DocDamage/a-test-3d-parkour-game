import { DUNGEONS } from './DungeonSystem.js';
import { KEY_ITEMS } from './KeyItemSystem.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAP_W = 480;
const WORLD_MIN = -42;
const WORLD_RANGE = 84;   // -42 to +42
const FOG_CELLS = 40;
const CELL_WORLD = 2;     // 2 world-units per fog cell  (40 cells × 2 = 80 world-units, -40 to +40)
const REVEAL_RADIUS = 5;  // world-units revealed around player

// ─── Helpers ─────────────────────────────────────────────────────────────────
function worldToCanvas(wx, wz) {
    return {
        cx: ((wx - WORLD_MIN) / WORLD_RANGE) * MAP_W,
        cy: ((wz - WORLD_MIN) / WORLD_RANGE) * MAP_W,
    };
}

function hexStr(color) {
    return '#' + (color >>> 0).toString(16).padStart(6, '0');
}

// ─── OverworldMap ─────────────────────────────────────────────────────────────
/**
 * Zelda-style overworld map overlay.
 * Toggle key: Backquote  (backtick `)  — verified free in main.js as of initial commit.
 *
 * Integration (main.js):
 *   import { OverworldMap } from './OverworldMap.js';
 *   const overworldMap = new OverworldMap(player, dungeons, keyItems);
 *   // in animate():
 *   overworldMap.update(finalDt, activeInput);
 */
export class OverworldMap {
    constructor(player, dungeonSystem, keyItemSystem) {
        this._player       = player;
        this._dungeons     = dungeonSystem;
        this._keyItems     = keyItemSystem;
        this._open         = false;
        /** 40×40 grid; 0 = unvisited, 1 = visited */
        this._fogGrid      = new Float32Array(FOG_CELLS * FOG_CELLS);
        this._overlay      = null;
        this._canvas       = null;
        this._ctx          = null;
        this._build();
    }

    // ─── DOM construction ─────────────────────────────────────────────────────
    _build() {
        // Semi-transparent full-screen dim behind the map
        this._overlay = document.createElement('div');
        this._overlay.style.cssText =
            'position:fixed;inset:0;background:rgba(0,0,0,0.65);' +
            'display:none;z-index:1000;pointer-events:none;';
        document.body.appendChild(this._overlay);

        // Map canvas — gold border via box-shadow
        this._canvas = document.createElement('canvas');
        this._canvas.width  = MAP_W;
        this._canvas.height = MAP_W;
        this._canvas.style.cssText =
            'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);' +
            'z-index:1001;display:none;box-shadow:0 0 0 3px #ffd700,0 0 24px #ffd70055;' +
            'image-rendering:pixelated;';
        document.body.appendChild(this._canvas);
        this._ctx = this._canvas.getContext('2d');
    }

    // ─── Public API ───────────────────────────────────────────────────────────
    get isOpen() { return this._open; }

    open() {
        this._open = true;
        this._overlay.style.display = 'block';
        this._canvas.style.display  = 'block';
        this.render();
    }

    close() {
        this._open = false;
        this._overlay.style.display = 'none';
        this._canvas.style.display  = 'none';
    }

    toggle() { this._open ? this.close() : this.open(); }

    /**
     * Call every frame from animate() with finalDt and activeInput.
     * Handles the toggle hotkey and updates fog-of-war.
     */
    update(_dt, activeInput) {
        if (activeInput.wasPressed('Backquote')) this.toggle();
        if (this._open && activeInput.wasPressed('Escape')) this.close();

        // ── Fog-of-war accumulation ──────────────────────────────────────────
        const px = this._player.position.x;
        const pz = this._player.position.z;

        // Fog grid cell that the player is currently standing in
        const cx = Math.floor((px + FOG_CELLS) / CELL_WORLD);   // +40 / 2
        const cz = Math.floor((pz + FOG_CELLS) / CELL_WORLD);

        const revCells = Math.ceil(REVEAL_RADIUS / CELL_WORLD) + 1;
        for (let dz = -revCells; dz <= revCells; dz++) {
            for (let dx = -revCells; dx <= revCells; dx++) {
                const nx = cx + dx;
                const nz = cz + dz;
                if (nx < 0 || nx >= FOG_CELLS || nz < 0 || nz >= FOG_CELLS) continue;
                // World-space centre of this fog cell
                const wcx = nx * CELL_WORLD - (FOG_CELLS * CELL_WORLD * 0.5) + CELL_WORLD * 0.5;
                const wcz = nz * CELL_WORLD - (FOG_CELLS * CELL_WORLD * 0.5) + CELL_WORLD * 0.5;
                if (Math.hypot(px - wcx, pz - wcz) <= REVEAL_RADIUS) {
                    this._fogGrid[nz * FOG_CELLS + nx] = 1;
                }
            }
        }

        if (this._open) this.render();
    }

    // ─── Rendering ────────────────────────────────────────────────────────────
    render() {
        const ctx    = this._ctx;
        const W      = MAP_W;
        const cellPx = W / FOG_CELLS;

        // Background
        ctx.fillStyle = '#080810';
        ctx.fillRect(0, 0, W, W);

        // Visited terrain tiles
        ctx.fillStyle = '#162216';
        for (let gz = 0; gz < FOG_CELLS; gz++) {
            for (let gx = 0; gx < FOG_CELLS; gx++) {
                if (this._fogGrid[gz * FOG_CELLS + gx] > 0) {
                    ctx.fillRect(gx * cellPx, gz * cellPx, cellPx, cellPx);
                }
            }
        }

        // Key item faint halos (at portal location, only if not yet collected)
        for (const dungeon of Object.values(DUNGEONS)) {
            if (!dungeon.keyItem) continue;
            if (this._keyItems && this._keyItems.hasItem(dungeon.keyItem)) continue;
            const { cx, cy } = worldToCanvas(dungeon.worldPosition.x, dungeon.worldPosition.z);
            ctx.beginPath();
            ctx.arc(cx, cy, 11, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,180,0.22)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Dungeon portal dots
        ctx.textBaseline = 'middle';
        ctx.textAlign    = 'center';
        for (const [id, dungeon] of Object.entries(DUNGEONS)) {
            const { cx, cy } = worldToCanvas(dungeon.worldPosition.x, dungeon.worldPosition.z);

            // Coloured filled circle
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fillStyle = hexStr(dungeon.color);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Completion checkmark
            const done = this._dungeons?.completionData?.[id]?.completed;
            if (done) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px monospace';
                ctx.fillText('✓', cx, cy - 14);
            }

            // Tiny dungeon name label
            ctx.fillStyle = 'rgba(210,210,210,0.60)';
            ctx.font = '7px monospace';
            ctx.textBaseline = 'top';
            ctx.fillText(dungeon.name, cx, cy + 9);
            ctx.textBaseline = 'middle';
        }

        // Fog-of-war dark overlay for unvisited cells
        ctx.fillStyle = 'rgba(0,0,0,0.93)';
        for (let gz = 0; gz < FOG_CELLS; gz++) {
            for (let gx = 0; gx < FOG_CELLS; gx++) {
                if (this._fogGrid[gz * FOG_CELLS + gx] === 0) {
                    ctx.fillRect(gx * cellPx, gz * cellPx, cellPx, cellPx);
                }
            }
        }

        // Player triangle (blinks every 500 ms)
        if ((Date.now() >> 9) & 1) {   // toggle every ~512 ms
            const pos    = this._player.position;
            const facing = this._player.facing ?? 0;
            const { cx, cy } = worldToCanvas(pos.x, pos.z);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(facing);
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(5,  6);
            ctx.lineTo(-5, 6);
            ctx.closePath();
            ctx.fillStyle = '#ffd700';
            ctx.fill();
            ctx.restore();
        }

        // Title bar
        ctx.fillStyle    = '#ffd700';
        ctx.font         = 'bold 14px monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('OVERWORLD MAP', W / 2, 8);

        // Close hint
        ctx.fillStyle    = 'rgba(200,200,200,0.45)';
        ctx.font         = '9px monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText('[`] or [Esc] to close', W / 2, W - 4);
    }

    dispose() {
        this._overlay?.remove();
        this._canvas?.remove();
    }
}
