import { PASSIVE_TREES } from './SkillData.js';

/**
 * PassiveTree.js
 * Node investment, bonus computation, and save/load for archetype passive trees.
 */
export class PassiveTree {
    constructor(archetypeId, skillSystem) {
        this.archetypeId = archetypeId;
        this.skillSystem = skillSystem;
        this.nodes = PASSIVE_TREES[archetypeId] || [];
        this.invested = new Map(); // nodeId -> currentRank
        this.availablePoints = 0;
        this._load();
        this._recompute();
    }

    investPoint(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return false;
        const current = this.invested.get(nodeId) || 0;
        if (current >= node.maxRank) return false;
        if (this.availablePoints <= 0) return false;

        // Check prerequisites
        if (node.requires && node.requires.length > 0) {
            for (const reqId of node.requires) {
                const reqRank = this.invested.get(reqId) || 0;
                const reqNode = this.nodes.find(n => n.id === reqId);
                if (!reqNode || reqRank < reqNode.maxRank) return false;
            }
        }

        this.invested.set(nodeId, current + 1);
        this.availablePoints--;
        this._save();
        this._recompute();
        return true;
    }

    getNodeRank(nodeId) {
        return this.invested.get(nodeId) || 0;
    }

    isNodeLocked(node) {
        if (!node.requires || node.requires.length === 0) return false;
        for (const reqId of node.requires) {
            const reqNode = this.nodes.find(n => n.id === reqId);
            if (!reqNode) return true;
            const reqRank = this.invested.get(reqId) || 0;
            if (reqRank < reqNode.maxRank) return true;
        }
        return false;
    }

    addPoints(amount) {
        this.availablePoints += amount;
        this._save();
    }

    _recompute() {
        const bonuses = {};
        for (const node of this.nodes) {
            const rank = this.invested.get(node.id) || 0;
            if (rank > 0 && node.bonuses) {
                for (const [stat, val] of Object.entries(node.bonuses)) {
                    bonuses[stat] = (bonuses[stat] || 0) + val * rank;
                }
            }
        }
        if (this.skillSystem) {
            this.skillSystem.setPassiveBonuses(bonuses);
        }
    }

    serialize() {
        return {
            archetypeId: this.archetypeId,
            invested: Array.from(this.invested.entries()),
            availablePoints: this.availablePoints
        };
    }

    deserialize(data) {
        if (!data) return;
        if (data.invested) {
            this.invested = new Map(data.invested);
        }
        if (data.availablePoints !== undefined) {
            this.availablePoints = data.availablePoints;
        }
    }

    _save() {
        try {
            const allTrees = JSON.parse(localStorage.getItem('apex_passives') || '{}');
            allTrees[this.archetypeId] = this.serialize();
            localStorage.setItem('apex_passives', JSON.stringify(allTrees));
        } catch (e) { /* ignore */ }
    }

    _load() {
        try {
            const saved = localStorage.getItem('apex_passives');
            if (saved) {
                const allTrees = JSON.parse(saved);
                if (allTrees[this.archetypeId]) {
                    this.deserialize(allTrees[this.archetypeId]);
                }
            }
        } catch (e) { if (window.__DEV__) console.warn(e); }
    }

    _renderUI() {
        const panel = document.getElementById('passive-tree');
        if (!panel) return;
        const pointsEl = document.getElementById('pt-points');
        const gridEl = document.getElementById('pt-grid');
        if (pointsEl) {
            const color = this.skillSystem && this.skillSystem.resource ? this.skillSystem.resource.getColor() : '#fff';
            pointsEl.textContent = `Available Points: ${this.availablePoints}`;
            pointsEl.style.color = color;
        }
        if (!gridEl) return;
        gridEl.innerHTML = '';
        for (const node of this.nodes) {
            const rank = this.invested.get(node.id) || 0;
            const locked = this.isNodeLocked(node);
            const div = document.createElement('div');
            div.className = 'pt-node' + (locked ? ' locked' : '');
            div.innerHTML = `
                <div class="pt-name">${node.name}</div>
                <div class="pt-rank">${rank} / ${node.maxRank}</div>
                <div class="pt-desc">${node.description || ''}</div>
            `;
            const btn = document.createElement('button');
            btn.textContent = 'Spend Point';
            btn.disabled = locked || rank >= node.maxRank || this.availablePoints <= 0;
            btn.onclick = () => {
                if (this.investPoint(node.id)) {
                    this._renderUI();
                }
            };
            div.appendChild(btn);
            gridEl.appendChild(div);
        }
    }
}
