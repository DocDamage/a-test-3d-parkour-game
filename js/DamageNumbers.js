/**
 * DamageNumbers — floating combat text system.
 * Self-contained; only needs camera and document.body.
 */

export class DamageNumbers {
    constructor(camera) {
        this.camera = camera;
        this.damageNumbers = [];
    }

    spawn(position, amount, isCrit, damageType) {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.left = '50%';
        div.style.top = '50%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.color = isCrit ? '#ffaa00' : this._typeColor(damageType);
        div.style.fontWeight = 'bold';
        div.style.fontSize = isCrit ? '24px' : '16px';
        div.style.textShadow = '0 1px 4px rgba(0,0,0,0.8)';
        div.style.pointerEvents = 'none';
        div.style.zIndex = '100';
        div.style.transition = 'opacity 0.5s';
        div.textContent = amount;
        document.body.appendChild(div);

        const vec = position.clone();
        vec.project(this.camera);
        const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(vec.y * 0.5) + 0.5) * window.innerHeight;
        div.style.left = x + 'px';
        div.style.top = y + 'px';

        this.damageNumbers.push({ div, life: 0.8, vy: -30 });
    }

    update(dt) {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            dn.life -= dt;
            const rect = dn.div.getBoundingClientRect();
            dn.div.style.top = (rect.top + dn.vy * dt) + 'px';
            if (dn.life <= 0.3) dn.div.style.opacity = dn.life / 0.3;
            if (dn.life <= 0) {
                dn.div.remove();
                this.damageNumbers.splice(i, 1);
            }
        }
    }

    _typeColor(type) {
        switch (type) {
            case 'energy': return '#ffaa00';
            case 'explosive': return '#ff3300';
            case 'electric': return '#00ccff';
            case 'freeze': return '#88ccff';
            case 'magic': return '#aa44ff';
            default: return '#ffffff';
        }
    }
}
