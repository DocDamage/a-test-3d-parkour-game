/**
 * BountySystem.js
 * Procedural contract generator and runner-rank tracker.
 *
 * Contracts refresh daily (real-time) or on demand.
 * Runner Rank: Street → Runner → Ace → Legend.
 */

import { SECTORS } from './TerritorySystem.js';
import { FACTIONS } from './FactionSystem.js';

const STORAGE_KEY = 'parkour_bounties_v1';

const RUNNER_RANKS = [
    { key: 'street',  label: 'Street',  threshold: 0 },
    { key: 'runner',  label: 'Runner',  threshold: 50 },
    { key: 'ace',     label: 'Ace',     threshold: 150 },
    { key: 'legend',  label: 'Legend',  threshold: 350 },
];

const CONTRACT_TEMPLATES = [
    {
        id: 'assassinate',
        name: 'Assassinate Elite',
        build: (sector, faction, rankIdx) => ({
            description: `Assassinate an Elite ${faction} unit in ${sector.name}.`,
            targetCount: 1,
            timeLimit: 0,
            baseDifficulty: 2 + rankIdx,
        }),
        validate: (contract, stats) => {
            return (stats.eliteKills || 0) >= contract.targetCount;
        },
    },
    {
        id: 'liberate',
        name: 'Liberate Sector',
        build: (sector, faction, rankIdx) => ({
            description: `Liberate ${sector.name} within the time limit.`,
            targetCount: 1,
            timeLimit: 180 + Math.max(0, 120 - rankIdx * 30), // seconds
            baseDifficulty: 3 + rankIdx,
        }),
        validate: (contract, stats, territorySystem) => {
            if (!territorySystem) return false;
            const liberated = territorySystem.isLiberated(contract.sectorId);
            const inTime = contract.timeLimit <= 0 || (stats.time || Infinity) <= contract.timeLimit;
            return liberated && inTime;
        },
    },
    {
        id: 'survive',
        name: 'Survive Waves',
        build: (sector, faction, rankIdx) => {
            const waves = 3 + rankIdx * 2;
            return {
                description: `Survive ${waves} waves in ${sector.name}.`,
                targetCount: waves,
                timeLimit: 0,
                baseDifficulty: 2 + rankIdx,
            };
        },
        validate: (contract, stats) => {
            return (stats.wavesSurvived || 0) >= contract.targetCount;
        },
    },
    {
        id: 'stealth',
        name: 'Stealth Takedown',
        build: (sector, faction, rankIdx) => {
            const count = 3 + rankIdx * 2;
            return {
                description: `Stealth takedown ${count} ${faction} drones in ${sector.name} without alerts.`,
                targetCount: count,
                timeLimit: 0,
                baseDifficulty: 3 + rankIdx,
            };
        },
        validate: (contract, stats) => {
            const stealthKills = stats.stealthKills || 0;
            const alerts = stats.alertsTriggered || 0;
            return stealthKills >= contract.targetCount && alerts === 0;
        },
    },
    {
        id: 'collect',
        name: 'Collect Scrap',
        build: (sector, faction, rankIdx) => {
            const amount = 50 + rankIdx * 50;
            return {
                description: `Collect ${amount} scrap in ${sector.name}.`,
                targetCount: amount,
                timeLimit: 300 + rankIdx * 60,
                baseDifficulty: 1 + rankIdx,
            };
        },
        validate: (contract, stats) => {
            return (stats.scrapCollected || 0) >= contract.targetCount;
        },
    },
];

const MODIFIER_POOL = [
    { id: 'no_predator_vision',    label: 'No Predator Vision',    difficultyMod: 1.2 },
    { id: 'no_weapons',            label: 'No Weapons',            difficultyMod: 1.3 },
    { id: 'time_limit',            label: 'Strict Time Limit',     difficultyMod: 1.25 },
    { id: 'elite_only',            label: 'Elite Only',            difficultyMod: 1.4 },
    { id: 'faction_reinforcement', label: 'Faction Reinforcement', difficultyMod: 1.15 },
];

function _makeId() {
    return `bounty_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function _todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export class BountySystem {
    /**
     * @param {object} player
     * @param {CharacterSheet} characterSheet
     * @param {ProgressionSystem} progression
     * @param {FactionSystem} factionSystem
     * @param {TerritorySystem} territorySystem
     */
    constructor(player, characterSheet, progression, factionSystem, territorySystem) {
        this.player = player;
        this.characterSheet = characterSheet;
        this.progression = progression;
        this.factionSystem = factionSystem;
        this.territorySystem = territorySystem;

        /** @type {number} runner reputation */
        this._runnerReputation = 0;

        /** @type {object[]} contracts currently on the bounty board */
        this._boardContracts = [];

        /** @type {object[]} contracts the player has accepted */
        this._acceptedContracts = [];

        /** @type {object[]} history of completed / abandoned contracts */
        this._history = [];

        /** @type {string} YYYY-MM-DD of last board refresh */
        this._lastRefreshDate = '';

        this._loadFromStorage();
    }

    /* ============================================================
       CONTRACT GENERATION
       ============================================================ */

    /**
     * Generate a fresh set of contracts for the bounty board.
     * @param {number} count — how many contracts to generate
     * @returns {object[]} the new board contracts
     */
    generateContracts(count = 3) {
        const today = _todayString();
        this._lastRefreshDate = today;

        const currentRankIdx = this._getRankIndex();
        const contracts = [];

        for (let i = 0; i < count; i++) {
            // Bias contract difficulty toward current rank ±1.
            const rankOffset = Math.random() < 0.7 ? 0 : (Math.random() < 0.5 ? -1 : 1);
            const contractRankIdx = Math.max(0, Math.min(RUNNER_RANKS.length - 1, currentRankIdx + rankOffset));

            const template = _pick(CONTRACT_TEMPLATES);
            const sectorId = _pick(SECTORS);
            const faction = _pick(Object.values(FACTIONS));
            const sector = this.territorySystem
                ? this.territorySystem.getSectorData(sectorId)
                : { id: sectorId, name: sectorId };

            const built = template.build(sector, faction, contractRankIdx);

            // Apply 0–2 random modifiers.
            const modifierCount = Math.random() < 0.4 ? 1 : (Math.random() < 0.15 ? 2 : 0);
            const modifiers = [];
            const modPool = MODIFIER_POOL.slice();
            for (let m = 0; m < modifierCount && modPool.length > 0; m++) {
                const idx = Math.floor(Math.random() * modPool.length);
                modifiers.push(modPool.splice(idx, 1)[0]);
            }

            // If the template has no time limit but we rolled the time_limit modifier,
            // inject a default time limit.
            if (built.timeLimit === 0 && modifiers.some(m => m.id === 'time_limit')) {
                built.timeLimit = 120 + Math.random() * 180;
            }

            const difficulty = this._calculateDifficulty(built.baseDifficulty, modifiers, contractRankIdx);
            const rewards = this._calculateRewards(difficulty, contractRankIdx);
            const rankRequired = RUNNER_RANKS[contractRankIdx].key;

            contracts.push({
                id: _makeId(),
                targetType: template.id,
                targetFaction: faction,
                sectorId,
                modifiers: modifiers.map(m => ({ id: m.id, label: m.label })),
                reward: rewards,
                timeLimit: Math.floor(built.timeLimit),
                rankRequired,
                description: built.description,
                targetCount: built.targetCount,
                difficulty,
                accepted: false,
                completed: false,
                abandoned: false,
                createdAt: Date.now(),
            });
        }

        this._boardContracts = contracts;
        this._saveToStorage();
        return contracts.map(c => ({ ...c }));
    }

    /**
     * Check whether the board needs a daily refresh.
     * @returns {boolean}
     */
    needsDailyRefresh() {
        return this._lastRefreshDate !== _todayString();
    }

    /* ============================================================
       CONTRACT LIFECYCLE
       ============================================================ */

    /** @returns {object[]} shallow copy of board contracts */
    getBoardContracts() {
        return this._boardContracts.map(c => ({ ...c }));
    }

    /** @returns {object[]} accepted contracts the player is working on */
    getActiveContracts() {
        return this._acceptedContracts
            .filter(c => !c.completed && !c.abandoned)
            .map(c => ({ ...c }));
    }

    /**
     * Accept a contract from the board.
     * @param {string} contractId
     * @returns {boolean}
     */
    acceptContract(contractId) {
        const idx = this._boardContracts.findIndex(c => c.id === contractId);
        if (idx === -1) {
            window.__DEV__ && console.warn(`BountySystem: contract ${contractId} not found on board.`);
            return false;
        }

        const contract = this._boardContracts[idx];
        const playerRankIdx = this._getRankIndex();
        const requiredRankIdx = RUNNER_RANKS.findIndex(r => r.key === contract.rankRequired);

        if (requiredRankIdx === -1) {
            window.__DEV__ && console.warn(`BountySystem: unknown rank requirement ${contract.rankRequired}.`);
            return false;
        }

        if (playerRankIdx < requiredRankIdx) {
            window.__DEV__ && console.warn(`BountySystem: rank too low to accept ${contractId}.`);
            return false;
        }

        // Move from board to accepted.
        this._boardContracts.splice(idx, 1);
        const accepted = { ...contract, accepted: true, acceptedAt: Date.now() };
        this._acceptedContracts.push(accepted);
        this._saveToStorage();
        return true;
    }

    /**
     * Complete an accepted contract and grant rewards.
     * @param {string} contractId
     * @param {object} stats — { time, kills, damage, eliteKills?, wavesSurvived?, stealthKills?, alertsTriggered?, scrapCollected? }
     * @returns {object} { success: boolean, reward: object|null, message: string }
     */
    completeContract(contractId, stats = {}) {
        const idx = this._acceptedContracts.findIndex(c => c.id === contractId);
        if (idx === -1) {
            return { success: false, reward: null, message: 'Contract not found.' };
        }

        const contract = this._acceptedContracts[idx];
        if (contract.completed || contract.abandoned) {
            return { success: false, reward: null, message: 'Contract already resolved.' };
        }

        const template = CONTRACT_TEMPLATES.find(t => t.id === contract.targetType);
        const isValid = template
            ? template.validate(contract, stats, this.territorySystem)
            : false;

        if (!isValid) {
            return { success: false, reward: null, message: 'Contract objectives not met.' };
        }

        contract.completed = true;
        contract.completedAt = Date.now();
        contract.completionStats = { ...stats };

        // Grant reputation.
        const repGain = this._getReputationReward(contract);
        this._addReputation(repGain);

        // Also grant XP via progression if available.
        if (this.progression && typeof this.progression.addXP === 'function') {
            this.progression.addXP(Math.floor(20 * contract.difficulty), 'bounty_complete');
        }

        this._history.push({
            id: contract.id,
            result: 'completed',
            reward: contract.reward,
            repGain,
            timestamp: Date.now(),
        });

        this._saveToStorage();

        return {
            success: true,
            reward: contract.reward,
            message: `Contract completed. +${repGain} rep.`,
        };
    }

    /**
     * Abandon an accepted contract.
     * @param {string} contractId
     * @returns {boolean}
     */
    abandonContract(contractId) {
        const idx = this._acceptedContracts.findIndex(c => c.id === contractId);
        if (idx === -1) {
            window.__DEV__ && console.warn(`BountySystem: contract ${contractId} not found.`);
            return false;
        }

        const contract = this._acceptedContracts[idx];
        if (contract.completed || contract.abandoned) return false;

        contract.abandoned = true;
        contract.abandonedAt = Date.now();

        // Small reputation penalty.
        this._addReputation(-5);

        this._history.push({
            id: contract.id,
            result: 'abandoned',
            timestamp: Date.now(),
        });

        this._saveToStorage();
        return true;
    }

    /* ============================================================
       RUNNER RANK
       ============================================================ */

    /** @returns {string} current rank key — 'street' | 'runner' | 'ace' | 'legend' */
    getRunnerRank() {
        return RUNNER_RANKS[this._getRankIndex()].key;
    }

    /** @returns {string} human-readable rank label */
    getRunnerRankLabel() {
        return RUNNER_RANKS[this._getRankIndex()].label;
    }

    /**
     * @returns {object} progress toward the next rank.
     */
    getRankProgress() {
        const idx = this._getRankIndex();
        const current = RUNNER_RANKS[idx];
        const next = RUNNER_RANKS[idx + 1];
        const rep = this._runnerReputation;

        if (!next) {
            return { current: rep, next: current.threshold, percent: 100, rank: current.key };
        }

        const range = next.threshold - current.threshold;
        const progress = rep - current.threshold;
        const percent = Math.min(100, Math.max(0, (progress / range) * 100));

        return {
            current: rep,
            next: next.threshold,
            percent: Math.round(percent),
            rank: current.key,
        };
    }

    /* ============================================================
       INTERNALS
       ============================================================ */

    _getRankIndex() {
        for (let i = RUNNER_RANKS.length - 1; i >= 0; i--) {
            if (this._runnerReputation >= RUNNER_RANKS[i].threshold) {
                return i;
            }
        }
        return 0;
    }

    _addReputation(delta) {
        this._runnerReputation = Math.max(0, this._runnerReputation + delta);
    }

    _calculateDifficulty(baseDifficulty, modifiers, rankIdx) {
        let diff = baseDifficulty + rankIdx * 0.5;
        for (const m of modifiers) {
            diff *= m.difficultyMod;
        }
        return Math.round(diff * 100) / 100;
    }

    _calculateRewards(difficulty, rankIdx) {
        const scale = 1 + difficulty * 0.2;
        const rewards = {
            scrap: Math.floor((50 + rankIdx * 40) * scale),
            chips: Math.floor((1 + rankIdx * 0.5) * scale),
            rareModChips: 0,
            bossCores: 0,
        };

        if (difficulty >= 3) {
            rewards.rareModChips = Math.floor(Math.random() * 2) + 1;
        }
        if (difficulty >= 5 && Math.random() < 0.3) {
            rewards.bossCores = 1;
        }
        if (rankIdx >= 3 && Math.random() < 0.15) {
            rewards.bossCores = (rewards.bossCores || 0) + 1;
        }

        return rewards;
    }

    _getReputationReward(contract) {
        const rankIdx = RUNNER_RANKS.findIndex(r => r.key === contract.rankRequired);
        const base = 10 + (rankIdx * 15);
        return Math.floor(base * contract.difficulty);
    }

    /* ============================================================
       SERIALIZATION
       ============================================================ */

    serialize() {
        return {
            runnerReputation: this._runnerReputation,
            lastRefreshDate: this._lastRefreshDate,
            boardContracts: this._boardContracts.map(c => ({ ...c })),
            acceptedContracts: this._acceptedContracts.map(c => ({ ...c })),
            history: this._history.slice(),
        };
    }

    deserialize(data) {
        if (!data || typeof data !== 'object') return;

        if (typeof data.runnerReputation === 'number') {
            this._runnerReputation = Math.max(0, data.runnerReputation);
        }
        if (typeof data.lastRefreshDate === 'string') {
            this._lastRefreshDate = data.lastRefreshDate;
        }
        if (Array.isArray(data.boardContracts)) {
            this._boardContracts = data.boardContracts
                .filter(c => c && typeof c === 'object')
                .map(c => ({ ...c }));
        }
        if (Array.isArray(data.acceptedContracts)) {
            this._acceptedContracts = data.acceptedContracts
                .filter(c => c && typeof c === 'object')
                .map(c => ({ ...c }));
        }
        if (Array.isArray(data.history)) {
            this._history = data.history.slice();
        }
    }

    /* ============================================================
       LOCAL STORAGE
       ============================================================ */

    _saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.serialize()));
        } catch (e) {
            window.__DEV__ && console.warn('BountySystem: save failed', e);
        }
    }

    _loadFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                this.deserialize(JSON.parse(raw));
            }
        } catch (e) {
            window.__DEV__ && console.warn('BountySystem: load failed', e);
        }
    }
}
