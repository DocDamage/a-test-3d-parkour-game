import * as THREE from 'three';

export const PLAYER_ANIMATION_CLIPS = Object.freeze({
    idle: { id: 'idle', assetId: 'player.anim.idle01', path: 'assets/animations/player/idle_01.glb', loop: true },
    idleAlt: { id: 'idleAlt', assetId: 'player.anim.idle02', path: 'assets/animations/player/idle_02.glb', loop: true },
    walk: { id: 'walk', assetId: 'player.anim.walkForward', path: 'assets/animations/player/walk_forward.glb', loop: true },
    run: { id: 'run', assetId: 'player.anim.runForward', path: 'assets/animations/player/run_forward.glb', loop: true },
    sprint: { id: 'sprint', assetId: 'player.anim.sprintForward', path: 'assets/animations/player/sprint_forward.glb', loop: true },
    jump: { id: 'jump', assetId: 'player.anim.jump', path: 'assets/animations/player/jump.glb', loop: false },
    jumpBegin: { id: 'jumpBegin', assetId: 'player.anim.jumpBegin', path: 'assets/animations/player/jump_begin.glb', loop: false },
    jumpLand: { id: 'jumpLand', assetId: 'player.anim.jumpLand', path: 'assets/animations/player/jump_land.glb', loop: false },
    fall: { id: 'fall', assetId: 'player.anim.fall', path: 'assets/animations/player/fall.glb', loop: true },
    turnLeft: { id: 'turnLeft', assetId: 'player.anim.turnLeft', path: 'assets/animations/player/turn_left.glb', loop: false },
    turnRight: { id: 'turnRight', assetId: 'player.anim.turnRight', path: 'assets/animations/player/turn_right.glb', loop: false },
    handsClosed: { id: 'handsClosed', assetId: 'player.anim.handsClosed', path: 'assets/animations/player/hands_closed.glb', loop: false },
    handsGrip: { id: 'handsGrip', assetId: 'player.anim.handsGrip', path: 'assets/animations/player/hands_grip.glb', loop: false }
});

// Source library bones use B-* names. Runtime character bodies use Mixamo-style
// names. This bridge keeps authored FBX clips usable without changing Player.js
// into a retargeting monolith.
const BONE_REMAP = Object.freeze({
    'B-hips': 'mixamorig:Hips',
    'B-spine': 'mixamorig:Spine',
    'B-chest': 'mixamorig:Spine2',
    'B-neck': 'mixamorig:Neck',
    'B-head': 'mixamorig:Head',
    'B-shoulder.L': 'mixamorig:LeftShoulder',
    'B-upperArm.L': 'mixamorig:LeftArm',
    'B-forearm.L': 'mixamorig:LeftForeArm',
    'B-hand.L': 'mixamorig:LeftHand',
    'B-thumb01.L': 'mixamorig:LeftHandThumb1',
    'B-thumb02.L': 'mixamorig:LeftHandThumb2',
    'B-thumb03.L': 'mixamorig:LeftHandThumb3',
    'B-indexFinger01.L': 'mixamorig:LeftHandIndex1',
    'B-indexFinger02.L': 'mixamorig:LeftHandIndex2',
    'B-indexFinger03.L': 'mixamorig:LeftHandIndex3',
    'B-middleFinger01.L': 'mixamorig:LeftHandMiddle1',
    'B-middleFinger02.L': 'mixamorig:LeftHandMiddle2',
    'B-middleFinger03.L': 'mixamorig:LeftHandMiddle3',
    'B-pinky01.L': 'mixamorig:LeftHandPinky1',
    'B-pinky02.L': 'mixamorig:LeftHandPinky2',
    'B-pinky03.L': 'mixamorig:LeftHandPinky3',
    'B-shoulder.R': 'mixamorig:RightShoulder',
    'B-upperArm.R': 'mixamorig:RightArm',
    'B-forearm.R': 'mixamorig:RightForeArm',
    'B-hand.R': 'mixamorig:RightHand',
    'B-thumb01.R': 'mixamorig:RightHandThumb1',
    'B-thumb02.R': 'mixamorig:RightHandThumb2',
    'B-thumb03.R': 'mixamorig:RightHandThumb3',
    'B-indexFinger01.R': 'mixamorig:RightHandIndex1',
    'B-indexFinger02.R': 'mixamorig:RightHandIndex2',
    'B-indexFinger03.R': 'mixamorig:RightHandIndex3',
    'B-middleFinger01.R': 'mixamorig:RightHandMiddle1',
    'B-middleFinger02.R': 'mixamorig:RightHandMiddle2',
    'B-middleFinger03.R': 'mixamorig:RightHandMiddle3',
    'B-pinky01.R': 'mixamorig:RightHandPinky1',
    'B-pinky02.R': 'mixamorig:RightHandPinky2',
    'B-pinky03.R': 'mixamorig:RightHandPinky3',
    'B-thigh.L': 'mixamorig:LeftUpLeg',
    'B-shin.L': 'mixamorig:LeftLeg',
    'B-foot.L': 'mixamorig:LeftFoot',
    'B-toe.L': 'mixamorig:LeftToeBase',
    'B-thigh.R': 'mixamorig:RightUpLeg',
    'B-shin.R': 'mixamorig:RightLeg',
    'B-foot.R': 'mixamorig:RightFoot',
    'B-toe.R': 'mixamorig:RightToeBase'
});

const NORMALIZED_REMAP = Object.freeze(Object.fromEntries(
    Object.entries(BONE_REMAP).map(([source, target]) => [normalizeName(source), target])
));

export class PlayerAnimationLibrary {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.clips = new Map();
        this.retargeted = new Map();
        this._registerAssets();
    }

    async preloadCore() {
        const entries = Object.values(PLAYER_ANIMATION_CLIPS);
        await Promise.all(entries.map(entry => this._loadClip(entry)));
        return this;
    }

    getClipIdForPlayer(player, moveAmount = 0, speed = 0) {
        const state = player?.state;
        if (!player?.grounded) return player?.velocity?.y < -1 ? 'fall' : 'jump';
        if (state === 'SPRINT') return 'sprint';
        if (state === 'WALK' || moveAmount > 0.1 || speed > 0.4) return speed > 4.5 ? 'run' : 'walk';
        return 'idle';
    }

    getClip(id) {
        const baseClip = this.clips.get(id);
        if (!baseClip) return null;
        if (this.retargeted.has(id)) return this.retargeted.get(id);

        const tracks = [];
        for (const track of baseClip.tracks) {
            if (!track.name.endsWith('.quaternion')) continue;
            const remapped = remapTrackName(track.name);
            if (!remapped) continue;
            tracks.push(track.clone());
            tracks[tracks.length - 1].name = remapped;
        }
        if (tracks.length === 0) return null;
        const clip = new THREE.AnimationClip(`retargeted_${id}`, baseClip.duration, tracks);
        this.retargeted.set(id, clip);
        return clip;
    }

    getLoopMode(id) {
        return PLAYER_ANIMATION_CLIPS[id]?.loop === false ? THREE.LoopOnce : THREE.LoopRepeat;
    }

    _registerAssets() {
        if (!this.assetManager?.registerModel) return;
        for (const entry of Object.values(PLAYER_ANIMATION_CLIPS)) {
            this.assetManager.registerModel(entry.assetId, {
                path: entry.path,
                tags: ['player', 'animation'],
                scale: 1,
                notes: `Converted humanoid animation clip: ${entry.id}`
            });
        }
    }

    async _loadClip(entry) {
        const loaded = await this.assetManager?.loadModel?.(entry.assetId);
        const clip = loaded?.gltf?.animations?.[0] || null;
        if (clip) this.clips.set(entry.id, clip);
        return clip;
    }
}

function remapTrackName(name) {
    const propertyIndex = name.lastIndexOf('.');
    if (propertyIndex <= 0) return null;
    const sourceName = name.slice(0, propertyIndex);
    const property = name.slice(propertyIndex);
    const cleanSource = sourceName.split('/').pop();
    const target = BONE_REMAP[cleanSource] || NORMALIZED_REMAP[normalizeName(cleanSource)];
    if (!target) return null;
    const safeTarget = THREE.PropertyBinding?.sanitizeNodeName
        ? THREE.PropertyBinding.sanitizeNodeName(target)
        : target;
    return `${safeTarget}${property}`;
}

function normalizeName(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
}
