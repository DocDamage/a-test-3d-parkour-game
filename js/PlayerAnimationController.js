import * as THREE from 'three';

const BONE_NAMES = Object.freeze({
    hips: ['mixamorig:Hips'],
    spine: ['mixamorig:Spine', 'mixamorig:Spine1'],
    chest: ['mixamorig:Spine2'],
    neck: ['mixamorig:Neck'],
    head: ['mixamorig:Head'],
    leftUpperArm: ['mixamorig:LeftArm'],
    leftForeArm: ['mixamorig:LeftForeArm', 'ForeArm.L'],
    rightUpperArm: ['mixamorig:RightArm'],
    rightForeArm: ['mixamorig:RightForeArm', 'ForeArm.R'],
    leftUpperLeg: ['mixamorig:LeftUpLeg'],
    leftLowerLeg: ['mixamorig:LeftLeg'],
    rightUpperLeg: ['mixamorig:RightUpLeg'],
    rightLowerLeg: ['mixamorig:RightLeg'],
    leftFoot: ['mixamorig:LeftFoot'],
    rightFoot: ['mixamorig:RightFoot']
});

export class PlayerAnimationController {
    constructor(root, player, animationLibrary = null) {
        this.root = root;
        this.player = player;
        this.animationLibrary = animationLibrary;
        this.time = 0;
        this.bones = {};
        this.bind = new Map();
        this.available = false;
        this.mixer = null;
        this.actions = new Map();
        this.activeAction = null;
        this.activeClipId = null;
        this._scanBones();
    }

    update(dt, moveAmount = 0) {
        if (!this.available) return;
        this.time += dt;

        const speed = this.player.velocity ? Math.hypot(this.player.velocity.x, this.player.velocity.z) : 0;
        if (this._updateAuthored(dt, moveAmount, speed)) return;

        this._resetPose(dt);

        const state = this.player.state;
        if (state === 'CLIMB' || state === 'HANG') {
            this._poseClimb();
        } else if (state === 'SLIDE' || state === 'ROLL' || state === 'SLIDE_JUMP' || state === 'GRIND') {
            this._poseSlide();
        } else if (state === 'GRAPPLE_AIM' || state === 'GRAPPLE_SWING' || state === 'GRAPPLE_RETRACT') {
            this._poseGrapple();
        } else if (!this.player.grounded) {
            this._poseAir();
        } else if (moveAmount > 0.1 || speed > 0.4) {
            this._poseRun(state === 'SPRINT' ? 1.35 : 1.0);
        } else {
            this._poseIdle();
        }
    }

    setAnimationLibrary(animationLibrary) {
        this.animationLibrary = animationLibrary;
        this.actions.clear();
        this.activeAction = null;
        this.activeClipId = null;
        this.mixer = null;
    }

    _scanBones() {
        const allBones = [];
        this.root.traverse(obj => {
            if (obj.isBone) allBones.push(obj);
        });

        for (const [key, names] of Object.entries(BONE_NAMES)) {
            this.bones[key] = allBones.find(bone => names.includes(bone.name)) || null;
        }

        for (const bone of allBones) {
            this.bind.set(bone, {
                rotation: bone.rotation.clone(),
                position: bone.position.clone()
            });
        }

        this.available = !!(
            this.bones.hips &&
            this.bones.leftUpperArm &&
            this.bones.rightUpperArm &&
            this.bones.leftUpperLeg &&
            this.bones.rightUpperLeg
        );
    }

    _updateAuthored(dt, moveAmount, speed) {
        if (!this.animationLibrary) return false;
        const state = this.player.state;
        if (state === 'CLIMB' || state === 'HANG' || state === 'SLIDE' || state === 'ROLL' || state === 'SLIDE_JUMP' || state === 'GRIND' || state === 'GRAPPLE_AIM' || state === 'GRAPPLE_SWING' || state === 'GRAPPLE_RETRACT') {
            this._stopAuthored();
            return false;
        }

        const clipId = this.animationLibrary.getClipIdForPlayer(this.player, moveAmount, speed);
        const clip = this.animationLibrary.getClip(clipId);
        if (!clip) {
            this._stopAuthored();
            return false;
        }

        if (!this.mixer) this.mixer = new THREE.AnimationMixer(this.root);
        let action = this.actions.get(clipId);
        if (!action) {
            action = this.mixer.clipAction(clip);
            action.enabled = true;
            action.clampWhenFinished = this.animationLibrary.getLoopMode(clipId) === THREE.LoopOnce;
            const loopMode = this.animationLibrary.getLoopMode(clipId);
            action.setLoop(loopMode, loopMode === THREE.LoopOnce ? 1 : Infinity);
            this.actions.set(clipId, action);
        }

        if (this.activeAction !== action) {
            action.reset().fadeIn(0.12).play();
            if (this.activeAction) this.activeAction.fadeOut(0.12);
            this.activeAction = action;
            this.activeClipId = clipId;
        }

        action.timeScale = clipId === 'sprint' ? 1.18 : clipId === 'walk' ? 0.95 : 1;
        this.mixer.update(dt);
        return true;
    }

    _stopAuthored() {
        if (!this.activeAction) return;
        this.activeAction.fadeOut(0.1);
        this.activeAction = null;
        this.activeClipId = null;
    }

    _resetPose(dt) {
        const alpha = Math.min(1, dt * 12);
        for (const [bone, pose] of this.bind) {
            bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, pose.rotation.x, alpha);
            bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, pose.rotation.y, alpha);
            bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, pose.rotation.z, alpha);
            bone.position.lerp(pose.position, alpha);
        }
    }

    _poseIdle() {
        const breathe = Math.sin(this.time * 2.2) * 0.035;
        rotate(this.bones.spine, breathe, 0, 0);
        rotate(this.bones.chest, breathe * 0.7, 0, 0);
        rotate(this.bones.leftUpperArm, 0.08, 0, 0.08);
        rotate(this.bones.rightUpperArm, 0.08, 0, -0.08);
    }

    _poseRun(multiplier) {
        const stride = Math.sin(this.time * 9.5 * multiplier);
        const counter = Math.cos(this.time * 9.5 * multiplier);
        const arm = stride * 0.75;
        const leg = stride * 0.55;
        rotate(this.bones.leftUpperArm, arm, 0, 0.04);
        rotate(this.bones.rightUpperArm, -arm, 0, -0.04);
        rotate(this.bones.leftForeArm, Math.max(0.1, -arm * 0.45), 0, 0);
        rotate(this.bones.rightForeArm, Math.max(0.1, arm * 0.45), 0, 0);
        rotate(this.bones.leftUpperLeg, -leg, 0, 0);
        rotate(this.bones.rightUpperLeg, leg, 0, 0);
        rotate(this.bones.leftLowerLeg, Math.max(0, counter) * 0.5, 0, 0);
        rotate(this.bones.rightLowerLeg, Math.max(0, -counter) * 0.5, 0, 0);
        if (this.bones.hips) this.bones.hips.position.y += Math.abs(counter) * 0.018;
        rotate(this.bones.chest, 0.08, 0, -stride * 0.05);
    }

    _poseAir() {
        rotate(this.bones.leftUpperArm, -0.38, 0, 0.18);
        rotate(this.bones.rightUpperArm, -0.34, 0, -0.18);
        rotate(this.bones.leftUpperLeg, -0.28, 0, 0.04);
        rotate(this.bones.rightUpperLeg, 0.18, 0, -0.04);
        rotate(this.bones.leftLowerLeg, 0.45, 0, 0);
        rotate(this.bones.rightLowerLeg, 0.28, 0, 0);
        rotate(this.bones.chest, -0.08, 0, 0);
    }

    _poseSlide() {
        rotate(this.bones.spine, -0.42, 0, 0);
        rotate(this.bones.chest, -0.28, 0, 0);
        rotate(this.bones.leftUpperArm, -0.7, 0, 0.45);
        rotate(this.bones.rightUpperArm, -0.7, 0, -0.45);
        rotate(this.bones.leftUpperLeg, -1.0, 0, 0.18);
        rotate(this.bones.rightUpperLeg, -0.85, 0, -0.18);
        rotate(this.bones.leftLowerLeg, 0.72, 0, 0);
        rotate(this.bones.rightLowerLeg, 0.58, 0, 0);
    }

    _poseClimb() {
        const reach = Math.sin(this.time * 5.0) * 0.45;
        rotate(this.bones.leftUpperArm, -1.45 + reach, 0, 0.24);
        rotate(this.bones.rightUpperArm, -1.45 - reach, 0, -0.24);
        rotate(this.bones.leftForeArm, -0.5, 0, 0);
        rotate(this.bones.rightForeArm, -0.5, 0, 0);
        rotate(this.bones.leftUpperLeg, 0.45 - reach * 0.4, 0, 0.08);
        rotate(this.bones.rightUpperLeg, -0.15 + reach * 0.4, 0, -0.08);
        rotate(this.bones.chest, -0.2, 0, 0);
    }

    _poseGrapple() {
        rotate(this.bones.rightUpperArm, -1.55, 0, -0.15);
        rotate(this.bones.rightForeArm, -0.45, 0, 0);
        rotate(this.bones.leftUpperArm, -0.35, 0, 0.2);
        rotate(this.bones.leftUpperLeg, -0.42, 0, 0.1);
        rotate(this.bones.rightUpperLeg, -0.2, 0, -0.1);
        rotate(this.bones.chest, -0.12, 0, -0.08);
    }
}

function rotate(bone, x = 0, y = 0, z = 0) {
    if (!bone) return;
    bone.rotation.x += x;
    bone.rotation.y += y;
    bone.rotation.z += z;
}
