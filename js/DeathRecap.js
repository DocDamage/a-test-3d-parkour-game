/**
 * DeathRecap — shows damage sources, biggest hit, and stats on death.
 */

export class DeathRecap {
    constructor() {
        this._sessionDamage = []; // { source, amount, type, time }
        this._kills = 0;
        this._startTime = performance.now();
        this._biggestHit = 0;
    }

    onDamageTaken(amount, type, source) {
        this._sessionDamage.push({
            source: source ? (source.constructor.name || 'Unknown') : 'Unknown',
            amount,
            type: type || 'generic',
            time: performance.now(),
        });
        if (amount > this._biggestHit) this._biggestHit = amount;
    }

    onEnemyKilled() {
        this._kills++;
    }

    getRecap() {
        const duration = (performance.now() - this._startTime) / 1000;
        const bySource = {};
        const byType = {};
        for (const d of this._sessionDamage) {
            bySource[d.source] = (bySource[d.source] || 0) + d.amount;
            byType[d.type] = (byType[d.type] || 0) + d.amount;
        }
        return {
            duration: Math.round(duration),
            totalDamage: this._sessionDamage.reduce((s, d) => s + d.amount, 0),
            biggestHit: this._biggestHit,
            hitsTaken: this._sessionDamage.length,
            kills: this._kills,
            bySource,
            byType,
        };
    }

    reset() {
        this._sessionDamage = [];
        this._kills = 0;
        this._startTime = performance.now();
        this._biggestHit = 0;
    }

    renderHTML() {
        const r = this.getRecap();
        const sourceRows = Object.entries(r.bySource)
            .sort((a, b) => b[1] - a[1])
            .map(([src, dmg]) => `<div style="display:flex;justify-content:space-between;font-size:12px;"><span>${src}</span><span>${Math.round(dmg)}</span></div>`)
            .join('');

        return `
            <div style="background:rgba(0,0,0,0.9);border:1px solid #ff3333;border-radius:8px;padding:16px;color:#fff;max-width:320px;">
                <h3 style="color:#ff3333;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Death Recap</h3>
                <div style="font-size:13px;margin-bottom:8px;">Survived: <strong>${r.duration}s</strong> · Kills: <strong>${r.kills}</strong></div>
                <div style="font-size:13px;margin-bottom:8px;">Total Damage: <strong>${Math.round(r.totalDamage)}</strong> · Biggest Hit: <strong>${Math.round(r.biggestHit)}</strong></div>
                <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;margin-top:8px;">
                    <div style="font-size:11px;color:#888;text-transform:uppercase;margin-bottom:4px;">Damage Sources</div>
                    ${sourceRows || '<div style="font-size:12px;color:#555;">No damage recorded</div>'}
                </div>
            </div>
        `;
    }
}
