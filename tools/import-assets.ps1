param([string]$Vpk='E:\SteamLibrary\steamapps\common\dota 2 beta\game\dota\pak01_dir.vpk')
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (!(Test-Path -LiteralPath $Vpk)) { throw "VPK ausente: $Vpk" }
$cli=Join-Path (Get-Location) '.tools/vrf/cli/Source2Viewer-CLI.exe'
& $cli --help | Out-File docs/vrf-help.txt
$models=@{
 tuskarr=@('tuskarr','tusk_armor_glove','tusk_cowl','tusk_hat','tusk_horns','tusk_weapon','tusk_fish_basket')
 bristleback=@('bristleback','bristleback_back','bristleback_bracer','bristleback_head','bristleback_necklace','bristleback_weapon')
 marci=@('marci_base','marci_back','marci_costume','marci_head','marci_shoulders')
 dawnbreaker=@('dawnbreaker','dawnbreaker_armor','dawnbreaker_arms','dawnbreaker_head','dawnbreaker_weapon')
}
foreach($hero in $models.Keys){
 $filter=($models[$hero] | ForEach-Object { "models/heroes/$hero/$_.vmdl_c" }) -join ','
 & $cli -i $Vpk -o imports/original -f $filter -d --gltf_export_format glb --gltf_export_animations --gltf_export_materials --gltf_textures_adapt *> "docs/export-$hero.log"
 if($LASTEXITCODE -ne 0){throw "Falha no export $hero"}
}
New-Item -ItemType Directory -Force public/fighters | Out-Null
Copy-Item -Path imports/original/models/heroes/* -Destination public/fighters -Recurse -Force
$shen=@('vengeful_spirit_arcana','vengeful_spirit_arcana_head_refit','vengeful_spirit_arcana_legs_refit','vengeful_spirit_arcana_weapon','vengeful_spirit_arcana_shoulders')
$filter=($shen | ForEach-Object { "models/items/vengefulspirit/vengeful_spirit_arcana/$_.vmdl_c" }) -join ','
& $cli -i $Vpk -o imports/original -f $filter -d --gltf_export_format glb --gltf_export_animations --gltf_export_materials --gltf_textures_adapt *> docs/export-shendelzare.log
New-Item -ItemType Directory -Force public/fighters/shendelzare,public/arena,public/ui | Out-Null
Copy-Item -Path imports/original/models/items/vengefulspirit/vengeful_spirit_arcana/* -Destination public/fighters/shendelzare -Force
& $cli -i $Vpk -o imports/original -f 'scripts/events/crownfall/fighting_game_hero_,resource/localization/dota_english.txt,resource/localization/dota_brazilian.txt,soundevents/soundevents_fighting_game.vsndevts_c,scripts/items/items_game.txt,panorama/images/events/crownfall/fight/hud/' -d *> docs/export-reference.log
$heroFilters=@('tusk','bristleback','vengefulspirit_alt1','marci','dawnbreaker') | ForEach-Object {"panorama/images/heroes/npc_dota_hero_$($_)_png.vtex_c","panorama/images/heroes/selection/npc_dota_hero_$($_)_png.vtex_c"}
& $cli -i $Vpk -o imports/original -f ($heroFilters -join ',') -d *> docs/export-portraits.log
Copy-Item -Path imports/original/panorama/images/heroes/* -Destination public/ui -Recurse -Force
Copy-Item -Path imports/original/panorama/images/events/crownfall/fight/hud/* -Destination public/ui -Force
# The fight loads public/arena/arena-scene.glb. Re-copy only when a fresh source export exists.
$arenaSource='app/assets/maps/scenes/crownfall/arena.glb'
if (Test-Path -LiteralPath $arenaSource) { Copy-Item -LiteralPath $arenaSource -Destination public/arena/arena-scene.glb -Force }
New-Item -ItemType Directory -Force app/assets/scripts/events/crownfall,app/assets/scripts/localization | Out-Null
Copy-Item -Path imports/original/scripts/events/crownfall/fighting_game_hero_*.vdata -Destination app/assets/scripts/events/crownfall -Force
Copy-Item -Path imports/original/resource/localization/dota_english.txt -Destination app/assets/scripts/localization/dota_english.txt -Force
node tools/import-data.mjs
node tools/optimize-glb.mjs
node --input-type=module -e "import {optimize} from './tools/optimize-glb.mjs'; optimize('public/arena/arena-scene.glb');"
Remove-Item -LiteralPath imports -Recurse -Force
Write-Output 'Reinicie o Vite após importar novos arquivos públicos.'
