param(
    [string]$Vpk = 'E:\SteamLibrary\steamapps\common\dota 2 beta\game\dota\pak01_dir.vpk',
    [switch]$SkipExport,
    [string[]]$Ids
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$cli = Join-Path (Get-Location) '.tools/vrf/cli/Source2Viewer-CLI.exe'
$outRoot = Join-Path (Get-Location) 'imports/skins'
New-Item -ItemType Directory -Force $outRoot | Out-Null

$sets = @(
    @{ hero = 'tuskarr'; id = 'frostiron'; filter = 'models/items/tuskarr/frostiron_raider'; keep = 'frostiron_raider' }
    @{ hero = 'tuskarr'; id = 'frozen_sea'; filter = 'models/items/tuskarr/king_of_the_frozen_sea'; keep = 'king_of_the_frozen_sea' }
    @{ hero = 'tuskarr'; id = 'icelord'; filter = 'models/items/tuskarr/icelord'; keep = 'icelord' }
    @{ hero = 'bristleback'; id = 'fisherman'; filter = 'models/items/bristleback/fisherman_with_evil_eye'; keep = 'fisherman_with_evil_eye' }
    @{ hero = 'bristleback'; id = 'arena'; filter = 'models/items/bristleback/bristleback_warrior_of_arena'; keep = 'bristleback_warrior_of_arena' }
    @{ hero = 'bristleback'; id = 'wrathrunner'; filter = 'models/items/bristleback/wrathrunner'; keep = 'wrathrunner' }
    @{ hero = 'marci'; id = 'dragon'; filter = 'models/items/marci/monk_of_the_dragon_school'; keep = 'monk_of_the_dragon_school' }
    @{ hero = 'marci'; id = 'bloom'; filter = 'models/items/marci/marci_blooming_ornaments'; keep = 'marci_blooming_ornaments' }
    @{ hero = 'marci'; id = 'lotus'; filter = 'models/items/marci/marci_lotus_keeper'; keep = 'marci_lotus_keeper' }
    @{ hero = 'dawnbreaker'; id = 'first_light'; filter = 'models/items/dawnbreaker/first_light'; keep = 'first_light' }
    @{ hero = 'dawnbreaker'; id = 'judgement'; filter = 'models/items/dawnbreaker/judgement_of_light,models/items/dawnbreaker/judgment_of_light_weapon'; keep = 'judgement_of_light|judgment_of_light' }
    @{ hero = 'dawnbreaker'; id = 'astral'; filter = 'models/items/dawnbreaker/dawnbreaker_astral_angel'; keep = 'dawnbreaker_astral_angel' }
    @{ hero = 'shendelzare'; id = 'seraph'; filter = 'models/items/vengefulspirit/venge_lost_seraph'; keep = 'venge_lost_seraph' }
    @{ hero = 'shendelzare'; id = 'countess'; filter = 'models/items/vengefulspirit/dark_arts_countess'; keep = 'dark_arts_countess' }
    @{ hero = 'shendelzare'; id = 'forsaken'; filter = 'models/items/vengefulspirit/forsaken_wings'; keep = 'forsaken_wings' }
)
if ($Ids -and $Ids.Count) {
    $wanted = @($Ids | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    $sets = @($sets | Where-Object { $wanted -contains $_.id })
    if ($sets.Count -eq 0) { throw "Nenhum set corresponde a: $($wanted -join ', ')" }
}

function Copy-Set($set) {
    $out = Join-Path $outRoot "$($set.hero)-$($set.id)"
    $glbs = @(Get-ChildItem -LiteralPath $out -Recurse -Filter *.glb -ErrorAction SilentlyContinue | Where-Object { $_.Name -notmatch 'physics|_fx\.|_cone\.|_butterfly\.|_feather\.' -and $_.Name -match ("^($($set.keep))") })
    if ($glbs.Count -eq 0) { throw "Nenhum GLB isolado em $($set.hero)/$($set.id)" }
    $dest = Join-Path (Get-Location) "public/fighters/$($set.hero)/skins/$($set.id)"
    if (Test-Path -LiteralPath $dest) { Remove-Item -LiteralPath $dest -Recurse -Force }
    New-Item -ItemType Directory -Force $dest | Out-Null
    Get-ChildItem -LiteralPath $out -Recurse -File |
        Where-Object {
            if ($_.Extension -match '^\.(png|jpe?g|webp)$') { return $true }
            if ($_.Extension -ne '.glb') { return $false }
            if ($_.Name -match 'physics|_fx\.|_cone\.|_butterfly\.|_feather\.') { return $false }
            return $_.Name -match ("^($($set.keep))")
        } |
        ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $dest $_.Name) -Force }
    Write-Output "Copiado $($set.hero)/$($set.id) ($($glbs.Count) glb)"
}

if (-not $SkipExport) {
    if (!(Test-Path -LiteralPath $Vpk)) { throw "VPK ausente: $Vpk" }
    foreach ($set in $sets) {
        Write-Output "Export $($set.hero)/$($set.id)"
        $log = "docs/export-skin-$($set.hero)-$($set.id).log"
        $out = Join-Path $outRoot "$($set.hero)-$($set.id)"
        if (Test-Path -LiteralPath $out) { Remove-Item -LiteralPath $out -Recurse -Force }
        New-Item -ItemType Directory -Force $out | Out-Null
        $prev = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        & $cli -i $Vpk -o $out -f $set.filter -d --gltf_export_format glb --gltf_export_animations --gltf_export_materials --gltf_textures_adapt *> $log
        $code = $LASTEXITCODE
        $ErrorActionPreference = $prev
        $glbs = @(Get-ChildItem -LiteralPath $out -Recurse -Filter *.glb -ErrorAction SilentlyContinue)
        if ($glbs.Count -eq 0) { throw "Falha no export $($set.hero)/$($set.id) (exit $code, 0 glb)" }
        Copy-Set $set
    }
} else {
    foreach ($set in $sets) { Copy-Set $set }
}

Write-Output 'Otimizando GLBs de skin...'
node tools/optimize-skin-glbs.mjs
Write-Output 'Skins importadas. Reinicie o Vite se o public/ nao recarregar.'
