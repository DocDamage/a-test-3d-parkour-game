import * as THREE from 'three';

/**
 * PuzzleRoom — Zelda-style room puzzle toolkit
 *
 * Provides reusable puzzle primitives:
 *   • FloorSwitch  — pressure plate; triggers when player stands on it.
 *   • PushBlock    — heavy crate the player pushes with [F]; has a target tile.
 *   • SwitchPuzzle — group of FloorSwitches that must all be pressed simultaneously.
 *   • PuzzleRoom   — container; tracks solve state, exposes update().
 *
 * Usage example:
 *   const room = new PuzzleRoom(scene, world, player);
 *   room.addSwitchPuzzle([
 *       new THREE.Vector3(5, 0, 5),
 *       new THREE.Vector3(7, 0, 5),
 *   ], () => openDoor('door_a'));
 *   room.addBlockPuzzle(
 *       new THREE.Vector3(10, 0, 10),  // block start
 *       new THREE.Vector3(10, 0, 14),  // target tile
 *       () => openDoor('door_b')
 *   );
 *   // In animate():
 *   room.update(finalDt, activeInput);
 */

// ─── Floor Switch ─────────────────────────────────────────────────────────────

export class FloorSwitch {
    constructor(scene, position, id = 'switch') {
        this.scene = scene;
        this.id = id;
        this.position = position.clone();
        this.pressed = false;

        /** Callbacks fired on state change. */
        this.onPress = null;
        this.onRelease = null;

        this._buildMesh();
    }

    _buildMesh() {
        // Stone base
        const baseGeo = new THREE.CylinderGeometry(0.42, 0.44, 0.12, 16);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x777766, roughness: 0.9 });
        this.baseMesh = new THREE.Mesh(baseGeo, baseMat);
        this.baseMesh.position.copy(this.position);
        this.baseMesh.position.y += 0.06;
        this.baseMesh.receiveShadow = true;
        this.scene.add(this.baseMesh);

        // Pressure pad (moves down when pressed)
        const padGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.07, 16);
        this.padMat = new THREE.MeshStandardMaterial({
            color: 0x335533,
            emissive: new THREE.Color(0x001100),
            roughness: 0.7,
        });
        this.padMesh = new THREE.Mesh(padGeo, this.padMat);
        this.padMesh.position.copy(this.position);
        this.padMesh.position.y += 0.155;
        this.scene.add(this.padMesh);
    }

    /**
     * Set pressed state. Visually updates the pad and fires callbacks.
     */
    setPressed(pressed) {
        if (this.pressed === pressed) return;
        this.pressed = pressed;

        if (pressed) {
            this.padMat.color.setHex(0x22ff55);
            this.padMat.emissive.setHex(0x005511);
            this.padMesh.position.y = this.position.y + 0.10;
            if (this.onPress) this.onPress(this);
        } else {
            this.padMat.color.setHex(0x335533);
            this.padMat.emissive.setHex(0x001100);
            this.padMesh.position.y = this.position.y + 0.155;
            if (this.onRelease) this.onRelease(this);
        }
    }

    /** Returns true when the player is standing on the switch. */
    checkPlayer(playerPos) {
        const dx = playerPos.x - this.position.x;
        const dz = playerPos.z - this.position.z;
        return Math.sqrt(dx * dx + dz * dz) < 0.48 &&
               Math.abs(playerPos.y - this.position.y) < 0.6;
    }

    dispose() {
        this.scene.remove(this.baseMesh);
        this.scene.remove(this.padMesh);
        this.baseMesh.geometry.dispose();
        this.padMesh.geometry.dispose();
    }
}

// ─── Push Block ───────────────────────────────────────────────────────────────

export class PushBlock {
    /**
     * @param {THREE.Scene}  scene
     * @param {object}       world  - needs world.collidables array
     * @param {THREE.Vector3} position
     * @param {string}       id
     */
    constructor(scene, world, position, id = 'block') {
        this.scene = scene;
        this.world = world;
        this.id = id;

        this.position = position.clone();
        this.targetPosition = null;
        this.solved = false;
        this.onSolve = null;

        this._buildMesh();
    }

    _buildMesh() {
        const geo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
        this.mat = new THREE.MeshStandardMaterial({
            color: 0x998877,
            roughness: 0.9,
            metalness: 0.05,
        });
        this.mesh = new THREE.Mesh(geo, this.mat);
        this.mesh.position.copy(this.position);
        this.mesh.position.y += 0.425;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        // Register as collidable
        if (this.world && this.world.collidables) {
            this.world.collidables.push(this.mesh);
        }
    }

    /**
     * Set a target tile. Shows a golden indicator on the floor.
     */
    setTarget(targetPosition) {
        this.targetPosition = targetPosition.clone();

        const indicGeo = new THREE.PlaneGeometry(0.75, 0.75);
        const indicMat = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        this.indicator = new THREE.Mesh(indicGeo, indicMat);
        this.indicator.rotation.x = -Math.PI / 2;
        this.indicator.position.copy(this.targetPosition);
        this.indicator.position.y += 0.02;
        this.scene.add(this.indicator);
    }

    /**
     * Attempt a push. playerPos is used to determine adjacency.
     * direction is a unit XZ vector (from player.facing).
     * Returns true if the block moved.
     */
    tryPush(direction, playerPos) {
        if (this.solved) return false;

        // Player must be within push range and roughly behind the block
        const dx = this.mesh.position.x - playerPos.x;
        const dz = this.mesh.position.z - playerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.7 || dist > 1.6) return false;

        const newX = this.mesh.position.x + direction.x;
        const newZ = this.mesh.position.z + direction.z;

        this.mesh.position.x = newX;
        this.mesh.position.z = newZ;
        this.position.x = newX;
        this.position.z = newZ;

        this._checkSolved();
        return true;
    }

    _checkSolved() {
        if (!this.targetPosition || this.solved) return;
        const dx = Math.abs(this.mesh.position.x - this.targetPosition.x);
        const dz = Math.abs(this.mesh.position.z - this.targetPosition.z);
        if (dx < 0.35 && dz < 0.35) {
            // Snap to target
            this.mesh.position.x = this.targetPosition.x;
            this.mesh.position.z = this.targetPosition.z;
            this.solved = true;
            this.mat.color.setHex(0xffcc00);
            this.mat.emissive = new THREE.Color(0x442200);
            if (this.indicator) {
                this.scene.remove(this.indicator);
                this.indicator.geometry.dispose();
                this.indicator = null;
            }
            if (this.onSolve) this.onSolve(this);
        }
    }

    dispose() {
        if (this.world && this.world.collidables) {
            const idx = this.world.collidables.indexOf(this.mesh);
            if (idx !== -1) this.world.collidables.splice(idx, 1);
        }
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        if (this.indicator) {
            this.scene.remove(this.indicator);
            this.indicator.geometry.dispose();
        }
    }
}

// ─── Puzzle Room ─────────────────────────────────────────────────────────────

export class PuzzleRoom {
    /**
     * @param {THREE.Scene}  scene
     * @param {object}       world
     * @param {object}       player  - needs .position (Vector3), .facing (number)
     */
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;

        this._switches = [];
        this._blocks = [];
        this._puzzles = [];

        this.solved = false;
        /** Called when ALL puzzles in this room are solved. */
        this.onSolve = null;

        this._pushCooldown = 0;
        this._solvedCount = 0;
    }

    // ─── Puzzle builders ────────────────────────────────────────────────

    /**
     * Add a switch puzzle: N pressure plates that must ALL be held simultaneously.
     * @param {THREE.Vector3[]} positions
     * @param {Function}        [callback]  called when puzzle solves
     * @returns {FloorSwitch[]}  the created switches (for external reference)
     */
    addSwitchPuzzle(positions, callback) {
        const groupSwitches = positions.map((pos, i) => {
            const sw = new FloorSwitch(this.scene, pos, 'sw_' + this._switches.length + '_' + i);
            this._switches.push(sw);
            return sw;
        });

        let puzzleSolved = false;

        const checkAll = () => {
            if (puzzleSolved) return;
            if (groupSwitches.every(s => s.pressed)) {
                puzzleSolved = true;
                if (callback) callback();
                this._onPuzzlePartSolved();
            }
        };

        groupSwitches.forEach(sw => { sw.onPress = checkAll; });
        this._puzzles.push({ type: 'switch', switches: groupSwitches, solved: false });
        return groupSwitches;
    }

    /**
     * Add a block-push puzzle: push the block onto the target tile.
     * @param {THREE.Vector3} blockPos    starting position of the block
     * @param {THREE.Vector3} targetPos   where the block must end up
     * @param {Function}      [callback]
     * @returns {PushBlock}
     */
    addBlockPuzzle(blockPos, targetPos, callback) {
        const block = new PushBlock(
            this.scene, this.world, blockPos,
            'block_' + this._blocks.length
        );
        block.setTarget(targetPos);

        block.onSolve = () => {
            if (callback) callback();
            this._onPuzzlePartSolved();
        };

        this._blocks.push(block);
        this._puzzles.push({ type: 'block', block, solved: false });
        return block;
    }

    // ─── Update ─────────────────────────────────────────────────────────

    /**
     * Call every frame from main.js.
     * @param {number} dt
     * @param {object} activeInput  - InputManager snapshot
     */
    update(dt, activeInput) {
        if (this.solved) return;

        this._pushCooldown = Math.max(0, this._pushCooldown - dt);
        const playerPos = this.player.position;

        // Floor switch proximity
        for (const sw of this._switches) {
            sw.setPressed(sw.checkPlayer(playerPos));
        }

        // Block pushing is now handled by main.js unified KeyF dispatcher
    }

    // ─── Internal ───────────────────────────────────────────────────────

    _onPuzzlePartSolved() {
        this._solvedCount++;
        const allDone = this._puzzles.every(p => {
            if (p.type === 'switch') {
                return p.switches.every(s => s.pressed);
            }
            if (p.type === 'block') {
                return p.block.solved;
            }
            return true;
        });

        if (allDone && !this.solved) {
            this.solved = true;
            if (this.onSolve) this.onSolve();
        }
    }

    isSolved() { return this.solved; }

    // ─── Cleanup ────────────────────────────────────────────────────────

    dispose() {
        for (const sw of this._switches) sw.dispose();
        for (const b of this._blocks) b.dispose();
        this._switches = [];
        this._blocks = [];
        this._puzzles = [];
        this.solved = false;
    }
}
