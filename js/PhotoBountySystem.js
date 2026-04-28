import * as THREE from 'three';

export class PhotoBountySystem {
    constructor(player, world, rewards = {}) {
        this.player = player;
        this.world = world;
        this.rewards = rewards;
        this.activeBounty = null;
        this.completed = 0;
    }

    startBounty(subjectType = null) {
        const pool = subjectType ? [subjectType] : ['drone', 'elite', 'boss', 'predator'];
        this.activeBounty = {
            subjectType: pool[Math.floor(Math.random() * pool.length)],
            startedAt: performance.now(),
            rewardChips: 25 + this.completed * 5
        };
        return this.activeBounty;
    }

    submitPhoto(subject) {
        if (!this.activeBounty || !subject) return false;
        const type = subject.type || (subject.isElite ? 'elite' : subject.isBoss ? 'boss' : subject.constructor?.name?.toLowerCase() || 'drone');
        const ok = type.includes(this.activeBounty.subjectType) || this.activeBounty.subjectType === 'drone';
        if (!ok) return false;
        this.completed++;
        this.player._chips = (this.player._chips || 0) + this.activeBounty.rewardChips;
        this.activeBounty = null;
        if (this.rewards.onComplete) this.rewards.onComplete(this.completed);
        return true;
    }

    captureFromCamera(camera, candidates = []) {
        if (!camera) return false;
        if (!this.activeBounty) this.startBounty();
        let best = null;
        let bestScore = Infinity;
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);

        for (const subject of candidates) {
            if (!subject || subject.isDead) continue;
            const pos = subject.position || subject.mesh?.position || subject.group?.position;
            if (!pos) continue;
            const toSubject = pos.clone().sub(camera.position);
            const dist = toSubject.length();
            if (dist > 35 || dist <= 0.01) continue;
            const alignment = forward.dot(toSubject.normalize());
            if (alignment < 0.86) continue;
            const score = dist * (1.2 - alignment);
            if (score < bestScore) {
                best = subject;
                bestScore = score;
            }
        }

        return this.submitPhoto(best);
    }

    update() {
        if (!this.activeBounty) this.startBounty();
    }

    serialize() {
        return { activeBounty: this.activeBounty, completed: this.completed };
    }

    deserialize(data) {
        if (!data) return;
        this.activeBounty = data.activeBounty || null;
        this.completed = data.completed || 0;
    }
}
