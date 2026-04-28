export const AUDIO_TAGS = Object.freeze({
    BOOT: 'boot',
    UI: 'ui',
    PLAYER: 'player',
    WEAPON: 'weapon',
    LOOT: 'loot',
    ENEMY: 'enemy',
    COMBAT: 'combat',
    AMBIENCE: 'ambience'
});

// Runtime audio uses compact OGG Vorbis files converted from the local source
// packs in /my game assets/audio. Keep this list curated; the raw pack is over
// 1.5 GB and should not be treated as a shipping manifest.
export const AUDIO_ASSET_MANIFEST = Object.freeze({
    'ui.click': {
        path: 'assets/audio/ui/click.ogg',
        tags: [AUDIO_TAGS.BOOT, AUDIO_TAGS.UI],
        category: 'ui',
        volume: 0.7,
        source: 'UI/click_double_on.wav'
    },
    'ui.hover': {
        path: 'assets/audio/ui/hover.ogg',
        tags: [AUDIO_TAGS.UI],
        category: 'ui',
        volume: 0.45,
        source: 'UI/sci_fi_hover.wav'
    },
    'ui.select': {
        path: 'assets/audio/ui/select.ogg',
        tags: [AUDIO_TAGS.BOOT, AUDIO_TAGS.UI],
        category: 'ui',
        volume: 0.6,
        source: 'UI/sci_fi_select.wav'
    },

    'player.jump': {
        path: 'assets/audio/player/jump.ogg',
        tags: [AUDIO_TAGS.PLAYER],
        category: 'sfx',
        volume: 0.55,
        source: 'Retro/jump_short.wav'
    },
    'player.slide': {
        path: 'assets/audio/player/slide_whoosh.ogg',
        tags: [AUDIO_TAGS.PLAYER],
        category: 'sfx',
        volume: 0.5,
        source: 'Other/whoosh_1.wav'
    },

    'weapon.fire.generic': {
        path: 'assets/audio/weapons/fire_generic.ogg',
        tags: [AUDIO_TAGS.BOOT, AUDIO_TAGS.WEAPON],
        category: 'sfx',
        volume: 0.75,
        source: 'Weapons/shot_muffled.wav'
    },
    'weapon.reload': {
        path: 'assets/audio/weapons/reload.ogg',
        tags: [AUDIO_TAGS.BOOT, AUDIO_TAGS.WEAPON],
        category: 'sfx',
        volume: 0.65,
        source: 'Weapons/weapon_equip_short.wav'
    },
    'weapon.switch': {
        path: 'assets/audio/weapons/switch.ogg',
        tags: [AUDIO_TAGS.BOOT, AUDIO_TAGS.WEAPON],
        category: 'sfx',
        volume: 0.55,
        source: 'Weapons/weapon_equip.wav'
    },
    'weapon.sword.swing': {
        path: 'assets/audio/weapons/sword_swing.ogg',
        tags: [AUDIO_TAGS.WEAPON, AUDIO_TAGS.COMBAT],
        category: 'sfx',
        volume: 0.7,
        source: 'Weapons/sword_slice.wav'
    },
    'weapon.sword.clash': {
        path: 'assets/audio/weapons/sword_clash.ogg',
        tags: [AUDIO_TAGS.WEAPON, AUDIO_TAGS.COMBAT],
        category: 'sfx',
        volume: 0.7,
        source: 'Weapons/sword_clash.wav'
    },

    'combat.hit': {
        path: 'assets/audio/combat/hit_thud.ogg',
        tags: [AUDIO_TAGS.COMBAT],
        category: 'sfx',
        volume: 0.65,
        source: 'Weapons/harsh_thud.wav'
    },
    'combat.parry': {
        path: 'assets/audio/combat/electric_parry.ogg',
        tags: [AUDIO_TAGS.COMBAT],
        category: 'sfx',
        volume: 0.65,
        source: 'ELECSprk_Anime Spark 1.wav',
        trim: { start: 0, duration: 1.2 }
    },
    'combat.explosion': {
        path: 'assets/audio/combat/explosion.ogg',
        tags: [AUDIO_TAGS.COMBAT, AUDIO_TAGS.ENEMY],
        category: 'sfx',
        volume: 0.75,
        source: 'Retro/explosion_medium.wav'
    },
    'ability.charge': {
        path: 'assets/audio/combat/ability_charge.ogg',
        tags: [AUDIO_TAGS.COMBAT],
        category: 'sfx',
        volume: 0.45,
        source: 'MAGSpel_Anime Ability Charge 2.wav',
        trim: { start: 0, duration: 1.4 }
    },

    'loot.pickup': {
        path: 'assets/audio/loot/pickup.ogg',
        tags: [AUDIO_TAGS.BOOT, AUDIO_TAGS.LOOT],
        category: 'sfx',
        volume: 0.65,
        source: 'Items/item_equip.wav'
    },
    'loot.rare': {
        path: 'assets/audio/loot/rare.ogg',
        tags: [AUDIO_TAGS.LOOT],
        category: 'sfx',
        volume: 0.7,
        source: 'Weapons/weapon_upgrade.wav'
    },

    'enemy.drone.alert': {
        path: 'assets/audio/enemies/drone_alert.ogg',
        tags: [AUDIO_TAGS.ENEMY],
        category: 'sfx',
        volume: 0.45,
        source: 'Horror SFX Free/Monsters & Ghosts/robotic_hiss.wav',
        trim: { start: 0, duration: 1.2 }
    },
    'enemy.drone.death': {
        path: 'assets/audio/enemies/drone_death.ogg',
        tags: [AUDIO_TAGS.ENEMY],
        category: 'sfx',
        volume: 0.6,
        source: 'Horror SFX Free/Monsters & Ghosts/Robotic_bass.wav',
        trim: { start: 0, duration: 1.2 }
    },
    'enemy.drone.explosion': {
        path: 'assets/audio/enemies/drone_explosion.ogg',
        tags: [AUDIO_TAGS.ENEMY, AUDIO_TAGS.COMBAT],
        category: 'sfx',
        volume: 0.75,
        source: 'Retro/explosion_large.wav'
    }
});

export const AUDIO_CUES = Object.freeze({
    mechanical_click: ['ui.click'],
    dialogue_advance: ['ui.select'],
    camera_shutter: ['ui.select'],
    weapon_switch: ['weapon.switch'],
    reload: ['weapon.reload'],
    light_swing: ['weapon.sword.swing'],
    heavy_swing: ['weapon.sword.swing'],
    hit_stop: ['combat.hit'],
    parry: ['combat.parry'],
    enemy_death: ['combat.hit', 'enemy.drone.death'],
    miniboss_death: ['combat.explosion'],
    boss_phase: ['ability.charge'],
    drone_explosion: ['enemy.drone.explosion'],
    respawn: ['loot.rare'],
    loot_pickup: ['loot.pickup'],
    loot_rare: ['loot.rare']
});

export function getAudioAsset(id) {
    return AUDIO_ASSET_MANIFEST[id] || null;
}

export function getAudioCueVariants(cueId) {
    return AUDIO_CUES[cueId] || null;
}
