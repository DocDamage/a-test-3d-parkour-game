import * as THREE from 'three';

export class RisingTide {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.active = false;
        this.sludgeLevel = -5;
        this.riseSpeed = 0.3;
        this.oxygen = 100;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('risingTideHigh') || '0');
        this.spawnTimer = 0;
        this.platforms = [];
        this._createSludge();
        this._buildUI();
    }

    _createSludge() {
        const geo = new THREE.PlaneGeometry(200, 200);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x2a1a0a,
            emissive: 0x441100,
            emissiveIntensity: 0.3,
            roughness: 0.1,
            metalness: 0.5,
            transparent: true,
            opacity: 0.9
        });
        this.sludgeMesh = new THREE.Mesh(geo, mat);
        this.sludgeMesh.rotation.x = -Math.PI / 2;
        this.sludgeMesh.position.y = this.sludgeLevel;
        this.sludgeMesh.visible = false;
        this.scene.add(this.sludgeMesh);

        const bubbleGeo = new THREE.SphereGeometry(0.1, 6, 6);
        const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.6 });
        this.bubbles = [];
        for (let i = 0; i < 50; i++) {
            const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
            bubble.visible = false;
            this.scene.add(bubble);
            this.bubbles.push({ mesh: bubble, offset: Math.random() * 10, speed: 0.5 + Math.random() });
        }
    }

    _buildUI() {
        this.ui = document.createElement('div');
        this.ui.style.cssText = 'position:fixed;top:60px;right:20px;color:white;font-family:monospace;z-index:20;text-align:right;display:none;';
        this.ui.innerHTML = [
            '<div style="font-size:24px;font-weight:bold;color:#ff6600;text-shadow:0 0 10px #ff4400;">RISING TIDE</div>',
            '<div style="font-size:14px;">Height: <span id="tide-height">0</span>m</div>',
            '<div style="font-size:14px;">Oxygen: <span id="tide-oxygen">100</span>%</div>',
            '<div style="font-size:12px;color:#aaa;">Best: <span id="tide-best">0</span>m</div>'
        ].join('');
        document.body.appendChild(this.ui);
    }

    start() {
        this.active = true;
        this.sludgeLevel = -5;
        this.oxygen = 100;
        this.score = 0;
        this.spawnTimer = 0;
        this.sludgeMesh.visible = true;
        this.ui.style.display = 'block';
        this.player.respawn();
        this.player.position.set(0, 2, 0);
        this.player.velocity.set(0, 0, 0);
    }

    stop() {
        this.active = false;
        this.sludgeMesh.visible = false;
        this.ui.style.display = 'none';
        for (const b of this.bubbles) b.mesh.visible = false;
        for (const p of this.platforms) {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        }
        this.platforms = [];
    }

    update(dt) {
        if (!this.active) return;
        this.sludgeLevel += this.riseSpeed * dt;
        this.sludgeMesh.position.y = this.sludgeLevel;
        this.score = Math.max(this.score, Math.floor(this.player.position.y));
        const flowLevel = this.player.comboSystem.getFlowLevel();
        if (flowLevel > 0) {
            this.oxygen = Math.min(100, this.oxygen + dt * 10 * flowLevel);
        } else {
            this.oxygen -= dt * 8;
        }
        if (this.oxygen <= 0) {
            this.player.startStumble();
            this.oxygen = 30;
        }
        if (this.player.position.y < this.sludgeLevel + 0.5) {
            this.player.respawn();
            this.player.position.set(0, this.sludgeLevel + 5, 0);
            this.oxygen = 50;
        }
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 2;
            this._spawnPlatform();
        }
        const t = Date.now() * 0.001;
        for (const b of this.bubbles) {
            b.mesh.visible = true;
            b.mesh.position.x = Math.sin(t * b.speed + b.offset) * 20;
            b.mesh.position.z = Math.cos(t * b.speed + b.offset * 2) * 20;
            b.mesh.position.y = this.sludgeLevel + 0.1 + Math.sin(t * 3 + b.offset) * 0.3;
            b.mesh.scale.setScalar(1 + Math.sin(t * 2 + b.offset) * 0.5);
        }
        const hEl = document.getElementById('tide-height');
        const oEl = document.getElementById('tide-oxygen');
        const bEl = document.getElementById('tide-best');
        if (hEl) hEl.textContent = this.score;
        if (oEl) { oEl.textContent = Math.floor(this.oxygen); oEl.style.color = this.oxygen < 30 ? '#ff0000' : '#00ff00'; }
        if (bEl) bEl.textContent = this.highScore;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('risingTideHigh', this.highScore.toString());
        }
    }

    _spawnPlatform() {
        const y = this.player.position.y + 5 + Math.random() * 3;
        const x = (Math.random() - 0.5) * 30;
        const z = (Math.random() - 0.5) * 30;
        const geo = new THREE.BoxGeometry(2 + Math.random() * 2, 0.3, 2 + Math.random() * 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.platforms.push({ mesh });
        this.player.world.collidables.push(mesh);
        mesh.userData.size = { x: geo.parameters.width, y: geo.parameters.height, z: geo.parameters.depth };
    }
}
