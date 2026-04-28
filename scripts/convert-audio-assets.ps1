param(
    [string]$SourceRoot = "my game assets/audio",
    [string]$OutputRoot = "assets/audio",
    [string]$Ffmpeg = "ffmpeg"
)

$ErrorActionPreference = "Stop"

$items = @(
    @{ Source = "UI/click_double_on.wav"; Output = "ui/click.ogg"; Quality = 4 },
    @{ Source = "UI/sci_fi_hover.wav"; Output = "ui/hover.ogg"; Quality = 4 },
    @{ Source = "UI/sci_fi_select.wav"; Output = "ui/select.ogg"; Quality = 4; Duration = 0.65 },

    @{ Source = "Retro/jump_short.wav"; Output = "player/jump.ogg"; Quality = 4 },
    @{ Source = "Other/whoosh_1.wav"; Output = "player/slide_whoosh.ogg"; Quality = 4 },

    @{ Source = "Weapons/shot_muffled.wav"; Output = "weapons/fire_generic.ogg"; Quality = 4 },
    @{ Source = "Weapons/weapon_equip_short.wav"; Output = "weapons/reload.ogg"; Quality = 4 },
    @{ Source = "Weapons/weapon_equip.wav"; Output = "weapons/switch.ogg"; Quality = 4; Duration = 0.55 },
    @{ Source = "Weapons/sword_slice.wav"; Output = "weapons/sword_swing.ogg"; Quality = 4 },
    @{ Source = "Weapons/sword_clash.wav"; Output = "weapons/sword_clash.ogg"; Quality = 4 },

    @{ Source = "Weapons/harsh_thud.wav"; Output = "combat/hit_thud.ogg"; Quality = 4 },
    @{ Source = "ELECSprk_Anime Spark 1.wav"; Output = "combat/electric_parry.ogg"; Quality = 4; Duration = 1.2 },
    @{ Source = "Retro/explosion_medium.wav"; Output = "combat/explosion.ogg"; Quality = 4 },
    @{ Source = "MAGSpel_Anime Ability Charge 2.wav"; Output = "combat/ability_charge.ogg"; Quality = 4; Duration = 1.4 },

    @{ Source = "Items/item_equip.wav"; Output = "loot/pickup.ogg"; Quality = 4 },
    @{ Source = "Weapons/weapon_upgrade.wav"; Output = "loot/rare.ogg"; Quality = 4 },

    @{ Source = "Horror SFX Free/Monsters & Ghosts/robotic_hiss.wav"; Output = "enemies/drone_alert.ogg"; Quality = 4; Duration = 1.2 },
    @{ Source = "Horror SFX Free/Monsters & Ghosts/Robotic_bass.wav"; Output = "enemies/drone_death.ogg"; Quality = 4; Duration = 1.2 },
    @{ Source = "Retro/explosion_large.wav"; Output = "enemies/drone_explosion.ogg"; Quality = 4 }
)

foreach ($item in $items) {
    $source = Join-Path $SourceRoot $item.Source
    $output = Join-Path $OutputRoot $item.Output
    if (!(Test-Path -LiteralPath $source)) {
        Write-Warning "Missing source audio: $source"
        continue
    }

    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $output) | Out-Null
    $args = @("-y", "-hide_banner", "-loglevel", "error")
    if ($item.ContainsKey("Start")) { $args += @("-ss", [string]$item.Start) }
    $args += @("-i", $source)
    if ($item.ContainsKey("Duration")) { $args += @("-t", [string]$item.Duration) }
    $args += @("-ac", "2", "-ar", "44100", "-c:a", "libvorbis", "-q:a", [string]$item.Quality, $output)
    & $Ffmpeg @args
    Write-Host "OK $($item.Source) -> $($item.Output)"
}
