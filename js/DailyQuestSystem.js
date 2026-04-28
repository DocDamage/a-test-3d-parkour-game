/**
 * DailyQuestSystem — rotating daily and weekly bounties based on real-world date.
 */

const QUEST_TEMPLATES = [
    { type: 'kill', target: 'drones', count: 10, reward: { shards: 100, xp: 200 } },
    { type: 'kill_elite', target: 'elite drones', count: 3, reward: { shards: 250, xp: 500 } },
    { type: 'time_trial', target: 'complete any time trial', count: 1, reward: { shards: 150, xp: 300 } },
    { type: 'no_damage', target: 'clear a zone without taking damage', count: 1, reward: { shards: 300, xp: 600 } },
    { type: 'parkour', target: 'perform 50 vaults', count: 50, reward: { shards: 100, xp: 200 } },
    { type: 'combo', target: 'reach 3x combo', count: 1, reward: { shards: 200, xp: 400 } },
    { type: 'boss', target: 'defeat a boss', count: 1, reward: { shards: 500, xp: 1000 } },
];

export class DailyQuestSystem {
    constructor(player) {
        this.player = player;
        this.daily = null;
        this.weekly = null;
        this._lastDailySeed = 0;
        this._lastWeeklySeed = 0;
        this._progress = new Map();
        this._load();
        this._generateQuests();
    }

    _getDaySeed() {
        const d = new Date();
        return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }

    _getWeekSeed() {
        const d = new Date();
        return d.getFullYear() * 100 + this._getWeekNumber(d);
    }

    _getWeekNumber(d) {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    }

    _generateQuests() {
        const daySeed = this._getDaySeed();
        const weekSeed = this._getWeekSeed();

        if (daySeed !== this._lastDailySeed) {
            this._lastDailySeed = daySeed;
            this.daily = this._rollQuest(daySeed, 'Daily');
            this._progress.set(this.daily.id, 0);
        }
        if (weekSeed !== this._lastWeeklySeed) {
            this._lastWeeklySeed = weekSeed;
            this.weekly = this._rollQuest(weekSeed, 'Weekly');
            this._progress.set(this.weekly.id, 0);
        }
    }

    _rollQuest(seed, prefix) {
        const rng = this._mulberry32(seed);
        const template = QUEST_TEMPLATES[Math.floor(rng() * QUEST_TEMPLATES.length)];
        return {
            id: `${prefix.toLowerCase()}_${seed}`,
            name: `${prefix}: ${template.target}`,
            ...template,
        };
    }

    _mulberry32(a) {
        return function() {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    reportEvent(eventType, amount = 1) {
        this._generateQuests(); // Check for day rollover
        for (const quest of [this.daily, this.weekly]) {
            if (!quest) continue;
            let matched = false;
            if (eventType === 'kill' && quest.type === 'kill') matched = true;
            if (eventType === 'kill_elite' && quest.type === 'kill_elite') matched = true;
            if (eventType === 'time_trial_finish' && quest.type === 'time_trial') matched = true;
            if (eventType === 'no_damage_zone' && quest.type === 'no_damage') matched = true;
            if (eventType === 'vault' && quest.type === 'parkour') matched = true;
            if (eventType === 'combo_3x' && quest.type === 'combo') matched = true;
            if (eventType === 'boss_kill' && quest.type === 'boss') matched = true;

            if (matched) {
                const current = this._progress.get(quest.id) || 0;
                const next = Math.min(quest.count, current + amount);
                this._progress.set(quest.id, next);
                if (next >= quest.count && current < quest.count) {
                    this._completeQuest(quest);
                }
            }
        }
    }

    _completeQuest(quest) {
        if (window.__DEV__) console.log('[Quest] Completed:', quest.name);
        // Emit completion event
        if (this._onComplete) {
            this._onComplete(quest);
        }
    }

    getProgress(quest) {
        if (!quest) return 0;
        return this._progress.get(quest.id) || 0;
    }

    isComplete(quest) {
        return this.getProgress(quest) >= (quest ? quest.count : 0);
    }

    serialize() {
        return {
            daily: this.daily,
            weekly: this.weekly,
            lastDailySeed: this._lastDailySeed,
            lastWeeklySeed: this._lastWeeklySeed,
            progress: Array.from(this._progress.entries()),
        };
    }

    deserialize(data) {
        if (!data) return;
        this.daily = data.daily;
        this.weekly = data.weekly;
        this._lastDailySeed = data.lastDailySeed || 0;
        this._lastWeeklySeed = data.lastWeeklySeed || 0;
        if (data.progress) {
            this._progress = new Map(data.progress);
        }
    }

    _load() {
        try {
            const raw = localStorage.getItem('apex_quests');
            if (raw) this.deserialize(JSON.parse(raw));
        } catch (e) {}
    }

    save() {
        try {
            localStorage.setItem('apex_quests', JSON.stringify(this.serialize()));
        } catch (e) {}
    }
}
