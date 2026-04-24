import * as THREE from 'three';

export class Trajectory {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.createLine();
    }
    
    createLine() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineDashedMaterial({
            color: 0x00ff00,
            dashSize: 0.25,
            gapSize: 0.15,
            linewidth: 1,
            opacity: 0.6,
            transparent: true
        });
        this.line = new THREE.Line(geometry, material);
        this.line.frustumCulled = false;
        this.scene.add(this.line);
    }
    
    update(player, world) {
        // Grapple aim arc takes priority
        if (player.state === 'GRAPPLE_AIM' && player.grapplingHook) {
            this.updateGrappleAim(player);
            return;
        }
        
        const airborne = !player.grounded || player.state === 'JUMP' || player.state === 'FALL';
        if (!airborne) {
            this.hide();
            return;
        }
        
        this.active = true;
        const pos = player.position.clone();
        const vel = player.velocity.clone();
        const gravity = new THREE.Vector3(0, player.GRAVITY || -28, 0);
        const stepDt = 0.04;
        const maxSteps = 50;
        
        const points = [];
        let hitGround = false;
        let hitVoid = false;
        
        for (let i = 0; i < maxSteps && !hitGround; i++) {
            points.push(pos.clone());
            vel.add(gravity.clone().multiplyScalar(stepDt));
            pos.add(vel.clone().multiplyScalar(stepDt));
            
            if (pos.y < -10) {
                hitVoid = true;
                break;
            }
            
            if (pos.y < 0.05) {
                pos.y = 0;
                hitGround = true;
            }
            
            for (const obj of world.collidables) {
                const box = new THREE.Box3().setFromObject(obj);
                if (pos.x >= box.min.x && pos.x <= box.max.x &&
                    pos.z >= box.min.z && pos.z <= box.max.z &&
                    pos.y >= box.min.y - 0.05 && pos.y <= box.max.y + 0.5) {
                    if (vel.y <= 0 && pos.y >= box.max.y - 0.3) {
                        pos.y = box.max.y;
                        hitGround = true;
                        break;
                    }
                }
            }
        }
        
        if (points.length < 2) {
            this.hide();
            return;
        }
        
        const positions = new Float32Array(points.length * 3);
        for (let i = 0; i < points.length; i++) {
            positions[i * 3] = points[i].x;
            positions[i * 3 + 1] = points[i].y + 0.05;
            positions[i * 3 + 2] = points[i].z;
        }
        
        this.line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.line.computeLineDistances();
        
        const color = hitGround ? 0x00ff00 : 0xff3333;
        this.line.material.color.setHex(color);
        this.line.material.needsUpdate = true;
        this.line.visible = true;
    }
    
    /**
     * Draw a prediction arc from player hand toward grapple target.
     * Green if anchor valid, red if out of range.
     */
    updateGrappleAim(player) {
        const hook = player.grapplingHook;
        if (!hook) {
            this.hide();
            return;
        }
        
        const start = player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const target = hook.getAimTarget();
        
        if (!target) {
            // Draw arc to max range in aim direction
            const end = start.clone().add(
                new THREE.Vector3(Math.sin(player.facing), 0.25, Math.cos(player.facing))
                    .normalize()
                    .multiplyScalar(hook.MAX_RANGE)
            );
            this.drawArc(start, end, 0xff0000);
        } else {
            this.drawArc(start, target, 0x00ff00);
        }
    }
    
    drawArc(start, end, colorHex) {
        const points = [];
        const steps = 30;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const pos = new THREE.Vector3().lerpVectors(start, end, t);
            // Subtle gravity sag
            pos.y -= Math.sin(t * Math.PI) * 0.4;
            points.push(pos);
        }
        
        const positions = new Float32Array(points.length * 3);
        for (let i = 0; i < points.length; i++) {
            positions[i * 3] = points[i].x;
            positions[i * 3 + 1] = points[i].y;
            positions[i * 3 + 2] = points[i].z;
        }
        
        this.line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.line.computeLineDistances();
        this.line.material.color.setHex(colorHex);
        this.line.material.needsUpdate = true;
        this.line.visible = true;
        this.active = true;
    }
    
    hide() {
        if (this.active) {
            this.line.visible = false;
            this.active = false;
        }
    }
    
    dispose() {
        this.scene.remove(this.line);
        this.line.geometry.dispose();
        this.line.material.dispose();
    }
}
