/**
 * DebtSystem — loans, repayment, credit score, bounty hunters.
 *
 * Integration:
 *   const debt = new DebtSystem(player, enemyManager);
 *   debt.borrow(5000);        // take a loan
 *   debt.repay(2500);         // pay back chips
 *   debt.update(dt);          // check deadlines, spawn hunters
 */

import * as THREE from 'three';

export class DebtSystem {
    constructor(player, enemyManager) {
        this.player = player;
        this.enemyManager = enemyManager;

        this.loans = []; // { amount, repayment, deadlineDays, takenAtDay, repaid }
        this.creditScore = 500; // 0–1000
        this.totalDebt = 0;
        this.maxLoan = 5000;
        this.day = 0;
        this.dayTimer = 0;
        this.DAY_LENGTH = 300; // 5 real minutes = 1 game day

        this._hunterSpawned = false;
        this._load();
    }

    /* ------------------------------------------------------------------ */
    /*  Loan API                                                          */
    /* ------------------------------------------------------------------ */

    borrow(amount) {
        if (amount > this.maxLoan) return { success: false, reason: 'Exceeds max loan' };
        if (this.totalDebt + amount > this.maxLoan * 2) return { success: false, reason: 'Debt cap reached' };

        const interestRate = this._getInterestRate();
        const repayment = Math.floor(amount * (1 + interestRate));
        const deadlineDays = 3;

        this.loans.push({
            amount,
            repayment,
            deadlineDays,
            takenAtDay: this.day,
            repaid: 0,
            defaulted: false
        });

        this.totalDebt += repayment;
        this._save();
        return { success: true, repayment, dueDay: this.day + deadlineDays };
    }

    repay(amount) {
        let remaining = amount;
        for (const loan of this.loans) {
            if (loan.repaid >= loan.repayment) continue;
            const needed = loan.repayment - loan.repaid;
            const pay = Math.min(needed, remaining);
            loan.repaid += pay;
            remaining -= pay;
            this.totalDebt -= pay;
            if (remaining <= 0) break;
        }

        // Early pay bonus: credit score up
        const paid = amount - remaining;
        if (paid > 0) {
            this.creditScore = Math.min(1000, this.creditScore + Math.floor(paid / 100));
            this.maxLoan = 5000 + Math.floor(this.creditScore * 5);
        }

        this._save();
        return { paid, remaining };
    }

    /* ------------------------------------------------------------------ */
    /*  Per-frame update                                                  */
    /* ------------------------------------------------------------------ */

    update(dt) {
        this.dayTimer += dt;
        if (this.dayTimer >= this.DAY_LENGTH) {
            this.dayTimer -= this.DAY_LENGTH;
            this._advanceDay();
        }
    }

    _advanceDay() {
        this.day++;
        let anyDefault = false;

        for (const loan of this.loans) {
            if (loan.repaid >= loan.repayment) continue;
            const daysElapsed = this.day - loan.takenAtDay;
            if (daysElapsed >= loan.deadlineDays && !loan.defaulted) {
                loan.defaulted = true;
                anyDefault = true;
                this.creditScore = Math.max(0, this.creditScore - 100);
            }
        }

        // Spawn bounty hunters on default
        if (anyDefault && !this._hunterSpawned && this.enemyManager) {
            this._spawnHunters();
            this._hunterSpawned = true;
        }
    }

    _spawnHunters() {
        if (!this.player) return;
        const pos = this.player.position.clone();
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 15 + Math.random() * 10;
            const spawn = new THREE.Vector3(
                pos.x + Math.cos(angle) * dist,
                3,
                pos.z + Math.sin(angle) * dist
            );
            this.enemyManager.spawnEnemy('brawler', {
                position: spawn,
                isElite: true,
                maxHealth: 120,
                attackDamage: 20,
                speed: 4
            });
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Queries                                                           */
    /* ------------------------------------------------------------------ */

    _getInterestRate() {
        // Base 50% interest, reduced by credit score
        const reduction = this.creditScore / 10000; // 0–0.1
        return 0.5 - reduction;
    }

    getSummary() {
        const active = this.loans.filter(l => l.repaid < l.repayment);
        return {
            totalDebt: this.totalDebt,
            activeLoans: active.length,
            creditScore: this.creditScore,
            maxLoan: this.maxLoan,
            nextDue: active.length > 0
                ? Math.min(...active.map(l => l.takenAtDay + l.deadlineDays - this.day))
                : null
        };
    }

    /* ------------------------------------------------------------------ */
    /*  Persistence                                                       */
    /* ------------------------------------------------------------------ */

    _save() {
        try {
            localStorage.setItem('apex_debt', JSON.stringify({
                loans: this.loans,
                creditScore: this.creditScore,
                totalDebt: this.totalDebt,
                maxLoan: this.maxLoan,
                day: this.day
            }));
        } catch (e) {}
    }

    _load() {
        try {
            const raw = localStorage.getItem('apex_debt');
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data.loans) this.loans = data.loans;
            if (data.creditScore !== undefined) this.creditScore = data.creditScore;
            if (data.totalDebt !== undefined) this.totalDebt = data.totalDebt;
            if (data.maxLoan !== undefined) this.maxLoan = data.maxLoan;
            if (data.day !== undefined) this.day = data.day;
        } catch (e) {}
    }
}
