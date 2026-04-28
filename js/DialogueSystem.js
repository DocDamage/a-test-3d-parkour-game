/**
 * DialogueSystem.js
 * Zelda-style NPC dialogue panel with linear lines and optional quest triggers.
 */

import * as THREE from 'three';

const INTERACT_RANGE = 3;

// World positions per NPC id — update to match actual scene placement.
const NPC_POSITIONS = {
    malik:        new THREE.Vector3(2,  1, -1),
    vega_npc:     new THREE.Vector3(-1, 1,  2),
    informant:    new THREE.Vector3(0,  1,  0),
    dr_chen:      new THREE.Vector3(-2, 1, -2),
    scrap_broker: new THREE.Vector3(3,  1,  1),
};

const NPC_NAMES = {
    malik:        'Malik',
    vega_npc:     'Vega',
    informant:    'The Informant',
    dr_chen:      'Dr. Chen',
    scrap_broker: 'Scrap Broker',
};

// Dialogue data keyed by NPC id.
// Each entry: { lines, quest?, onOpen? }
const DIALOGUES = {
    malik: {
        lines: [
            "Got scrap? Got creds? Either way, I got options.",
            "Synapse is pushing new drone patterns tonight — watch yourself out there.",
        ],
        quest: {
            label: 'Accept Quest: Clear 3 Drones',
            onAccept(player, bountySystem) {
                if (!bountySystem) return;
                const id = `bounty_malik_${Date.now().toString(36)}`;
                bountySystem._boardContracts.push({
                    id, targetType: 'assassinate', targetFaction: 'Synapse',
                    sectorId: 'sector_4', modifiers: [],
                    reward: { credits: 150, experience: 50, reputation: 10 },
                    timeLimit: 0, rankRequired: 'street',
                    description: 'Eliminate 3 Synapse drones in Sector 4.',
                    targetCount: 3, difficulty: 2,
                    accepted: false, completed: false, abandoned: false,
                    createdAt: Date.now(),
                });
                bountySystem.acceptContract(id);
            },
        },
    },
    vega_npc: {
        lines: [
            "You're slow today, runner. Or maybe I'm just faster.",
            "Steam vents in Sector 5 give a vertical boost — time your jump right.",
        ],
    },
    informant: {
        lines: [
            "The fog hides many things. For the right price, I hide fewer.",
            "Dungeon entrance is beneath Sector 3. Corps bricked the door but the vent shaft is still open.",
        ],
    },
    dr_chen: {
        lines: [
            "You look wrecked. Patched you up — try not to make it a habit.",
        ],
        onOpen(player) {
            if (!player) return;
            if (typeof player.heal === 'function') player.heal(player.maxHealth);
            else player.health = player.maxHealth;
        },
    },
    scrap_broker: {
        lines: [
            "Bring me gear and I'll turn it into creds. No questions asked, no serial numbers needed.",
        ],
    },
};

export class DialogueSystem {
    constructor(player, npcSystem, bountySystem, world = null) {
        this._player      = player;
        this._bountySystem = bountySystem;
        this._world       = world;
        this._open        = false;
        this._currentNpcId = null;
        this._lineIndex   = 0;
        this._nearNpcId   = null;
        this._tmp         = new THREE.Vector3();
        this._buildUI();
        this._validateNpcPositions();
    }

    get isOpen() { return this._open; }

    _buildUI() {
        const css = (el, s) => { Object.assign(el.style, s); return el; };

        this._prompt = css(document.createElement('div'), {
            position: 'fixed', bottom: '220px', left: '50%',
            transform: 'translateX(-50%)', color: '#ffd700',
            fontFamily: 'monospace', fontSize: '13px',
            pointerEvents: 'none', display: 'none',
            textShadow: '0 1px 3px #000',
        });
        document.body.appendChild(this._prompt);

        this._panel = css(document.createElement('div'), {
            position: 'fixed', bottom: '40px', left: '50%',
            transform: 'translateX(-50%)', width: '320px',
            background: 'rgba(10,10,20,0.92)', border: '2px solid #ffd700',
            borderRadius: '6px', padding: '14px 16px 12px',
            color: '#e8e8e8', fontFamily: 'monospace', fontSize: '14px',
            display: 'none', zIndex: '9999',
            boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
        });

        this._nameEl = css(document.createElement('div'), {
            color: '#ffd700', fontWeight: 'bold', fontSize: '15px',
            marginBottom: '8px', letterSpacing: '0.05em',
        });
        this._textEl = css(document.createElement('div'), {
            minHeight: '50px', lineHeight: '1.5', marginBottom: '12px',
        });
        this._btnRow = css(document.createElement('div'), {
            display: 'flex', gap: '8px', justifyContent: 'flex-end',
        });

        this._nextBtn  = this._btn('[F] Next',     () => this._advance());
        this._questBtn = this._btn('Accept Quest', () => this._acceptQuest());
        this._closeBtn = this._btn('Close',        () => this.closeDialogue());
        this._questBtn.style.display = 'none';
        this._closeBtn.style.display = 'none';

        this._btnRow.append(this._questBtn, this._nextBtn, this._closeBtn);
        this._panel.append(this._nameEl, this._textEl, this._btnRow);
        document.body.appendChild(this._panel);
    }

    _btn(label, fn) {
        const b = document.createElement('button');
        b.textContent = label;
        Object.assign(b.style, {
            background: 'rgba(255,215,0,0.12)', border: '1px solid #ffd700',
            borderRadius: '4px', color: '#ffd700', fontFamily: 'monospace',
            fontSize: '13px', padding: '4px 10px', cursor: 'pointer',
        });
        b.addEventListener('click', fn);
        return b;
    }

    update(dt, activeInput) {
        if (this._player.isDead) {
            if (this._open) this.closeDialogue();
            return;
        }

        if (this._open) {
            // F handling is now centralized in main.js unified dispatcher
            return;
        }

        // Proximity check
        this._nearNpcId = null;
        const pPos = this._player.position;
        for (const id of Object.keys(NPC_POSITIONS)) {
            if (this._tmp.copy(NPC_POSITIONS[id]).sub(pPos).length() <= INTERACT_RANGE) {
                this._nearNpcId = id;
                break;
            }
        }

        if (this._nearNpcId) {
            this._prompt.textContent = `[F] Talk to ${NPC_NAMES[this._nearNpcId] || this._nearNpcId}`;
            this._prompt.style.display = 'block';
            // F handling is now centralized in main.js unified dispatcher
        } else {
            this._prompt.style.display = 'none';
        }
    }

    openDialogue(npcId) {
        const data = DIALOGUES[npcId];
        if (!data) return;
        if (typeof data.onOpen === 'function') data.onOpen(this._player);
        this._currentNpcId = npcId;
        this._lineIndex    = 0;
        this._open         = true;
        this._nameEl.textContent = NPC_NAMES[npcId] || npcId;
        this._prompt.style.display = 'none';
        this._panel.style.display  = 'block';
        if (audioManager && typeof audioManager.playSFX === 'function') audioManager.playSFX('dialogue_advance');
        this._renderLine();
    }

    _renderLine() {
        const data   = DIALOGUES[this._currentNpcId];
        const isLast = this._lineIndex >= data.lines.length - 1;
        this._textEl.textContent = data.lines[this._lineIndex];
        if (isLast) {
            this._nextBtn.style.display  = 'none';
            this._closeBtn.style.display = 'inline-block';
            this._questBtn.style.display = data.quest ? 'inline-block' : 'none';
            if (data.quest) this._questBtn.textContent = data.quest.label;
        } else {
            this._nextBtn.style.display  = 'inline-block';
            this._closeBtn.style.display = 'none';
            this._questBtn.style.display = 'none';
        }
    }

    _advance() {
        if (audioManager && typeof audioManager.playSFX === 'function') audioManager.playSFX('dialogue_advance');
        const data = DIALOGUES[this._currentNpcId];
        if (!data) { this.closeDialogue(); return; }
        if (this._lineIndex < data.lines.length - 1) {
            this._lineIndex++;
            this._renderLine();
        } else if (!data.quest) {
            this.closeDialogue();
        }
    }

    _acceptQuest() {
        const data = DIALOGUES[this._currentNpcId];
        if (data?.quest?.onAccept) data.quest.onAccept(this._player, this._bountySystem);
        this.closeDialogue();
    }

    closeDialogue() {
        if (audioManager && typeof audioManager.playSFX === 'function') audioManager.playSFX('dialogue_advance');
        this._open         = false;
        this._currentNpcId = null;
        this._panel.style.display  = 'none';
        this._prompt.style.display = 'none';
        const canvas = document.querySelector('canvas');
        if (canvas) canvas.requestPointerLock();
    }

    /** Register or override the world position for an NPC id. */
    registerNPCPosition(npcId, vec3) {
        NPC_POSITIONS[npcId] = vec3;
        if (this._world && typeof this._world.getGroundHeight === 'function') {
            vec3.y = this._world.getGroundHeight(vec3.x, vec3.z) + 1;
        }
    }

    _validateNpcPositions() {
        if (!this._world || typeof this._world.getGroundHeight !== 'function') return;
        for (const pos of Object.values(NPC_POSITIONS)) {
            pos.y = this._world.getGroundHeight(pos.x, pos.z) + 1;
        }
    }

    dispose() {
        this._panel.remove();
        this._prompt.remove();
    }
}
