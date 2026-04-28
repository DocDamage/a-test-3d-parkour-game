export class RhythmParkour {
    constructor(player) {
        this.player = player;
        this.active = false;
        this.prompts = ['Space', 'ShiftLeft', 'KeyQ', 'KeyE'];
        this.currentPrompt = null;
        this.promptTimer = 0;
        this.score = { perfect: 0, good: 0, miss: 0 };
    }

    start(duration = 20) {
        this.active = true;
        this.remaining = duration;
        this.score = { perfect: 0, good: 0, miss: 0 };
        this._nextPrompt();
    }

    update(dt, input) {
        if (!this.active) return;
        this.remaining -= dt;
        this.promptTimer -= dt;
        if (this.currentPrompt && input?.wasPressed?.(this.currentPrompt)) {
            if (this.promptTimer > 0.45) this.score.perfect++;
            else this.score.good++;
            this._nextPrompt();
        } else if (this.promptTimer <= 0) {
            this.score.miss++;
            this._nextPrompt();
        }
        if (this.remaining <= 0) this.finish();
    }

    finish() {
        this.active = false;
        if (this.onComplete) this.onComplete({ ...this.score });
    }

    _nextPrompt() {
        this.currentPrompt = this.prompts[Math.floor(Math.random() * this.prompts.length)];
        this.promptTimer = 0.9;
    }
}
