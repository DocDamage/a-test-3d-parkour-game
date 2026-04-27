import * as THREE from 'three';

// ─── Config ────────────────────────────────────────────────────────────────
const SHOP_POS  = new THREE.Vector3(10, 0, -5);
const PROXIMITY = 2.5;

const ITEMS = [
    { id: 'red_potion',     name: 'Red Potion',     cost: 50,  desc: 'Heals 2 hearts'    },
    { id: 'green_potion',   name: 'Green Potion',   cost: 40,  desc: 'Restores 50% HP'   },
    { id: 'fairy_bottle',   name: 'Fairy Bottle',   cost: 80,  desc: 'Captures a fairy'  },
    { id: 'bombs',          name: 'Bombs ×5',       cost: 30,  desc: '+5 bombs'           },
    { id: 'wallet_upgrade', name: 'Wallet Upgrade', cost: 150, desc: '+250 max scrap'     },
];

// ─── ShopSystem ────────────────────────────────────────────────────────────
export class ShopSystem {
    constructor(scene, player, heartSystem) {
        this._scene       = scene;
        this._player      = player;
        this._heartSystem = heartSystem;
        this._bottleSystem = null;
        this._open         = false;
        this._msgTimer     = null;

        player.scrap = player.scrap || 200;

        this._buildMesh();
        this._buildUI();
    }

    // ─── Public API ────────────────────────────────────────────────────────
    get isOpen() { return this._open; }

    setBottleSystem(bottleSystem) { this._bottleSystem = bottleSystem; }

    checkProximity(playerPos) {
        const dx = playerPos.x - SHOP_POS.x;
        const dz = playerPos.z - SHOP_POS.z;
        return dx * dx + dz * dz <= PROXIMITY * PROXIMITY;
    }

    open() {
        this._open = true;
        this._refresh();
        this._panel.style.display = 'block';
    }

    close() {
        this._open = false;
        this._panel.style.display = 'none';
    }

    update(dt, activeInput) {
        // Pulse emissive glow
        if (this._mesh) {
            const t = performance.now() * 0.002;
            this._mesh.material.emissiveIntensity = 0.35 + Math.sin(t) * 0.2;
        }
        // F key toggle
        if (activeInput && activeInput.wasPressed('KeyF')) {
            if (this._open) {
                this.close();
            } else if (this.checkProximity(this._player.position)) {
                this.open();
            }
        }
    }

    dispose() {
        this._scene.remove(this._mesh);
        this._scene.remove(this._light);
        this._scene.remove(this._sprite);
        this._mesh.geometry.dispose();
        this._mesh.material.dispose();
        this._sprite.material.map.dispose();
        this._sprite.material.dispose();
        clearTimeout(this._msgTimer);
        this._panel.remove();
    }

    // ─── Mesh ──────────────────────────────────────────────────────────────
    _buildMesh() {
        const mat = new THREE.MeshStandardMaterial({
            color: 0x00cdd4, emissive: 0x00cdd4, emissiveIntensity: 0.5,
        });
        this._mesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.4), mat);
        this._mesh.position.set(SHOP_POS.x, SHOP_POS.y + 0.7, SHOP_POS.z);
        this._scene.add(this._mesh);

        this._light = new THREE.PointLight(0x00ffff, 1.5, 6);
        this._light.position.set(SHOP_POS.x, SHOP_POS.y + 1.6, SHOP_POS.z);
        this._scene.add(this._light);

        // Floating "SHOP" label sprite
        const canvas  = document.createElement('canvas');
        canvas.width  = 128;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle    = '#ffd700';
        ctx.font         = 'bold 24px sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SHOP', 64, 16);
        const spriteMat = new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas), depthTest: false,
        });
        this._sprite = new THREE.Sprite(spriteMat);
        this._sprite.position.set(SHOP_POS.x, SHOP_POS.y + 2.1, SHOP_POS.z);
        this._sprite.scale.set(1.5, 0.4, 1);
        this._scene.add(this._sprite);
    }

    // ─── UI ────────────────────────────────────────────────────────────────
    _buildUI() {
        const panel = document.createElement('div');
        panel.id    = 'shop-panel';
        Object.assign(panel.style, {
            display: 'none', position: 'fixed',
            top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: 'rgba(10,10,20,0.95)', border: '2px solid #ffd700',
            borderRadius: '8px', padding: '20px 24px', color: '#fff',
            fontFamily: 'sans-serif', minWidth: '340px', zIndex: '1000',
            userSelect: 'none', boxShadow: '0 0 24px rgba(0,200,212,0.4)',
        });
        panel.innerHTML = `
            <h2 style="color:#ffd700;margin:0 0 8px;letter-spacing:2px">SHOP</h2>
            <div id="shop-scrap" style="margin-bottom:12px;color:#ffd700;font-size:14px"></div>
            <div id="shop-items"></div>
            <div id="shop-msg" style="min-height:20px;color:#aaffaa;font-size:13px;margin-top:8px"></div>
            <button id="shop-close" style="margin-top:12px;padding:6px 18px;background:#111;
                color:#ffd700;border:1px solid #ffd700;cursor:pointer;border-radius:4px;
                font-size:13px">Close [F]</button>
        `;
        document.body.appendChild(panel);
        this._panel = panel;
        document.getElementById('shop-close').addEventListener('click', () => this.close());
    }

    _refresh() {
        const p = this._player;
        document.getElementById('shop-scrap').textContent = `Scrap: ${p.scrap} 🔩`;

        const itemsDiv  = document.getElementById('shop-items');
        itemsDiv.innerHTML = '';

        for (const item of ITEMS) {
            const canAfford = p.scrap >= item.cost;
            const row       = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;gap:8px';

            const label = document.createElement('span');
            label.style.fontSize = '13px';
            label.innerHTML = `<b>${item.name}</b> — ${item.cost} 🔩 <span style="color:#888;font-size:11px">${item.desc}</span>`;

            const btn = document.createElement('button');
            btn.textContent = 'Buy';
            btn.disabled    = !canAfford;
            Object.assign(btn.style, {
                padding: '4px 12px', borderRadius: '4px', fontSize: '12px',
                background: canAfford ? '#0d2b0d' : '#1a1a1a',
                color:      canAfford ? '#aaffaa' : '#444',
                border:     `1px solid ${canAfford ? '#aaffaa' : '#333'}`,
                cursor:     canAfford ? 'pointer' : 'default',
            });
            btn.addEventListener('click', () => this._buy(item));

            row.appendChild(label);
            row.appendChild(btn);
            itemsDiv.appendChild(row);
        }
    }

    _buy(item) {
        const p  = this._player;
        const hs = this._heartSystem;
        if (p.scrap < item.cost) return;
        p.scrap -= item.cost;

        switch (item.id) {
            case 'red_potion':
                hs ? hs.healHearts(2)
                   : (p.health = Math.min(p.health + 8, p.maxHealth));
                break;
            case 'green_potion':
                p.health = Math.min(p.health + p.maxHealth * 0.5, p.maxHealth);
                break;
            case 'fairy_bottle':
                if (this._bottleSystem) {
                    this._bottleSystem.fillBottle(0, 'health_potion');
                } else {
                    hs ? hs.captureFairy()
                       : (p.health = Math.min(p.health + 4, p.maxHealth));
                }
                break;
            case 'bombs':
                p.bombs = (p.bombs || 0) + 5;
                break;
            case 'wallet_upgrade':
                p.maxScrap = (p.maxScrap || 500) + 250;
                break;
        }

        this._showMsg(`Bought: ${item.name}!`);
        this._refresh();
    }

    sell(itemId, value) {
        const p = this._player;
        if (!value || value <= 0) return false;
        p.scrap = (p.scrap || 0) + value;
        this._showMsg(`Sold for ${value} scrap!`);
        this._refresh();
        return true;
    }

    sellGear(gearItem) {
        if (!gearItem) return false;
        const rarityValue = {
            common: 10, magic: 25, rare: 60,
            legendary: 150, set: 200, ancient: 300, primal: 500
        };
        const value = rarityValue[gearItem.rarity] || 10;
        return this.sell(gearItem.id, value);
    }

    _showMsg(text) {
        const el = document.getElementById('shop-msg');
        if (!el) return;
        el.textContent = text;
        clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(() => { if (el) el.textContent = ''; }, 2000);
    }
}
