export const CHARACTER_BASES = Object.freeze([
    {
        id: 'drizzel',
        name: 'Drizzel',
        tag: 'Agile Frame',
        icon: 'DRZ',
        assetId: 'player.base.drizzel',
        file: 'assets/models/player/base_drizzel.glb',
        description: 'Lean runner silhouette for fast parkour reads.'
    },
    {
        id: 'gekkou',
        name: 'Gekkou',
        tag: 'Night Frame',
        icon: 'GEK',
        assetId: 'player.base.gekkou',
        file: 'assets/models/player/base_gekkou.glb',
        description: 'Stealthy profile with a sharp combat stance.'
    },
    {
        id: 'kasa',
        name: 'Kasa',
        tag: 'Balanced Frame',
        icon: 'KSA',
        assetId: 'player.base.kasa',
        file: 'assets/models/player/base_kasa.glb',
        description: 'Balanced base body for general-purpose builds.'
    },
    {
        id: 'kurenai',
        name: 'Kurenai',
        tag: 'Assault Frame',
        icon: 'KUR',
        assetId: 'player.base.kurenai',
        file: 'assets/models/player/base_kurenai.glb',
        description: 'Aggressive silhouette for close-range combat builds.'
    },
    {
        id: 'samidale',
        name: 'Samidale',
        tag: 'Heavy Frame',
        icon: 'SMD',
        assetId: 'player.base.samidale',
        file: 'assets/models/player/base_samidale.glb',
        description: 'Sturdier base body for tankier runner fantasies.'
    },
    {
        id: 'shogun',
        name: 'Shogun',
        tag: 'Duelist Frame',
        icon: 'SHG',
        assetId: 'player.base.shogun',
        file: 'assets/models/player/base_shogun.glb',
        description: 'Blade-forward silhouette for melee and precision builds.'
    }
]);

export function getCharacterBase(id) {
    return CHARACTER_BASES.find(base => base.id === id) || CHARACTER_BASES[0];
}

