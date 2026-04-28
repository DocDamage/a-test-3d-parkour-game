import * as THREE from 'three';

export class PredatorDrone {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.active = false;
        this.health = 120;
        this.maxHealth = 120;
        this.isDead = false;
        this.team = 'enemy';
        this.speed = 5.5;
        this.attackCooldown = 0;

        this.group = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.ConeGeometry(0.35, 0.9, 4),
            new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xff0033, emissiveIntensity: 1.2 })
        );
        body.rotation.x = Math.PI / 2;
        this.group.add(body);
        this.trail = [];
        this.group.visible = false;
        scene.add(this.group);
    }

    spawn(position = null) {
        const start = position || this.player.position.clone().add(new THREE.Vector3(-12, 6, -12));
        this.group.position.copy(start);
        this.health = this.maxHealth;
        this.isDead = false;
        this.active = true;
        this.group.visible = true;
    }

    update(dt) {
        if (!this.active || this.isDead || !this.player) return;
        const target = this.player.position.clone();
        target.y += 2.2;
        const dir = target.sub(this.group.position);
        const dist = dir.length();
        if (dist > 0.01) {
            dir.normalize();
            this.group.position.addScaledVector(dir, this.speed * dt);
            this.group.lookAt(this.player.position);
        }

        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        if (dist < 1.8 && this.attackCooldown <= 0 && this.player.takeDamage) {
            this.player.takeDamage(18, 'kinetic', this);
            this.attackCooldown = 1.2;
        }

        this._dropTrail();
        this._updateTrail(dt);
    }

    takeDamage(amount, type, source) {
        if (this.isDead) return 0;
        this.health -= amount;
        if (this.health <= 0) this.die(source);
        return amount;
    }

    die(source = null) {
        this.isDead = true;
        this.active = false;
        this.group.visible = false;
        if (this.onDeath) this.onDeath(this, source);
    }

    get position() {
        return this.group.position;
    }

    getMeshes() {
        return [this.group];
    }

    _dropTrail() {
        if (this.trail.length > 24) return;
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xff0033, transparent: true, opacity: 0.45 })
        );
        mesh.position.copy(this.group.position);
        this.scene.add(mesh);
        this.trail.push({ mesh, life: 0.8 });
    }

    _updateTrail(dt) {
        for (let i = this.trail.length - 1; i >= 0; i--) {
            const t = this.trail[i];
            t.life -= dt;
            t.mesh.material.opacity = Math.max(0, t.life / 0.8 * 0.45);
            if (t.life <= 0) {
                this.scene.remove(t.mesh);
                t.mesh.geometry.dispose();
                t.mesh.material.dispose();
                this.trail.splice(i, 1);
            }
        }
    }

    dispose() {
        this.scene.remove(this.group);
        for (const t of this.trail) {
            this.scene.remove(t.mesh);
            t.mesh.geometry.dispose();
            t.mesh.material.dispose();
        }
        this.trail = [];
    }
}
