import * as THREE from 'three';

export class WeatherGameplay {
    constructor(world, player) {
        this.world = world;
        this.player = player;
        this.frictionMultiplier = 1.0;
        this.visibilityMultiplier = 1.0;
        this.lasersDisabled = false;
        this._rainWetness = 0;
    }

    update(dt, weatherSystem) {
        const mode = weatherSystem.mode;
        
        switch (mode) {
            case 'RAIN':
                this.frictionMultiplier = 0.6;
                this.visibilityMultiplier = 1.0;
                this.lasersDisabled = false;
                this._rainWetness = Math.min(1, this._rainWetness + dt * 0.5);
                break;
            case 'STEAM':
                this.frictionMultiplier = 1.0;
                this.visibilityMultiplier = 0.4;
                this.lasersDisabled = false;
                this._rainWetness = Math.max(0, this._rainWetness - dt * 0.3);
                // Blind drones in steam
                for (const drone of this.world.drones.drones) {
                    drone.visionRange = 10 * this.visibilityMultiplier;
                    drone.spotLight.distance = drone.visionRange;
                }
                break;
            case 'POWER_OUTAGE':
                this.frictionMultiplier = 1.0;
                this.visibilityMultiplier = 0.7;
                this.lasersDisabled = true;
                this._rainWetness = Math.max(0, this._rainWetness - dt * 0.3);
                // Disable lasers during outage
                for (const laser of this.world.hazards.lasers) {
                    laser.active = false;
                    laser.mesh.visible = false;
                    laser.line.visible = false;
                    laser.light.intensity = 0;
                }
                break;
            default:
                this.frictionMultiplier = 1.0;
                this.visibilityMultiplier = 1.0;
                this.lasersDisabled = false;
                this._rainWetness = Math.max(0, this._rainWetness - dt * 0.3);
                // Restore drone vision
                for (const drone of this.world.drones.drones) {
                    drone.visionRange = 10;
                    drone.spotLight.distance = 10;
                }
                // Restore lasers if not toggled
                if (!this.lasersDisabled) {
                    for (const laser of this.world.hazards.lasers) {
                        if (laser.toggleInterval <= 0) {
                            laser.active = true;
                            laser.mesh.visible = true;
                            laser.line.visible = true;
                            laser.light.intensity = 3;
                        }
                    }
                }
        }

        // Apply slippery friction to player grounded movement
        if (this.player.grounded) {
            this.player.velocity.x *= this.frictionMultiplier;
            this.player.velocity.z *= this.frictionMultiplier;
        }
    }
}
