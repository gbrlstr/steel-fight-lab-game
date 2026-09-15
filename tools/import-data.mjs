import fs from 'node:fs';
import crypto from 'node:crypto';
const base='app/assets/scripts/events/crownfall/';
export function parseKV(text){
 const tokens=text.replace(/<!--[^]*?-->/g,'').match(/"(?:\\.|[^"\\])*"|[{}\[\]=,:]|[^\s{}\[\]=,:]+/g); let i=0;
 function value(){let t=tokens[i++]; if(t==='{'){let o={};while(tokens[i]!=='}'){const k=tokens[i++];if(tokens[i++]!=='=')throw Error('Expected = '+k);o[k]=value();}i++;return o;}if(t==='['){let a=[];while(tokens[i]!==']'){if(tokens[i]===','){i++;continue;}a.push(value());}i++;return a;}if(tokens[i]===':'){i++;return value();}if(t.startsWith('"'))return JSON.parse(t);if(t==='true'||t==='false')return t==='true';if(Number.isFinite(Number(t)))return Number(t);return t;}
 const result=value();if(i!==tokens.length)throw Error('Unconsumed KV3');return result;
}
const names={tusk:'Tusk',bristleback:'Bristleback',vengeful:'Shendelzare',marci:'Marci',dawnbreaker:'Dawnbreaker'};
const loc=fs.readFileSync('app/assets/scripts/localization/dota_english.txt','utf8');
const labels=Object.fromEntries([...loc.matchAll(/"(DOTA_FightingGame_[^"]+)"\s+"([^"]*)"/g)].map(m=>['#'+m[1],m[2]]));
const roster={}; const manifest=[];
for(const [id,name] of Object.entries(names)){
 const file=`fighting_game_hero_${id}.vdata`,raw=fs.readFileSync(base+file,'utf8');
 roster[id]={id,name,...parseKV(raw)};
 manifest.push({source:'scripts/events/crownfall/'+file+'_c',export:base+file,sha256:crypto.createHash('sha256').update(raw).digest('hex'),purpose:id,validation:'parsed; original explicit values preserved'});
}
fs.mkdirSync('app/game/shared',{recursive:true});
fs.writeFileSync('app/game/shared/roster.json',JSON.stringify(roster,null,2));
fs.writeFileSync('app/game/shared/labels.json',JSON.stringify(labels,null,2));
fs.writeFileSync('docs/data-manifest.json',JSON.stringify(manifest,null,2));
let md='# Movesets extraídos do VPK local\n\nValores explícitos originais; ausência de campo NÃO equivale a zero. Semântica do motor ainda requer validação. F=frente, B=trás, D=baixo, A=ataque, S=especial.\n';
for(const hero of Object.values(roster)){
 md+=`\n## ${hero.name}\n\n| Estado | Animação | Duração | Impacto / duração | Dano | Comandos de saída e condições |\n|---|---|---|---|---|---|\n`;
 for(const a of hero.m_vecActionDefinitions){const commands=(a.m_vecCancelOptions??[]).map(c=>JSON.stringify(c).replaceAll('|',' + ')).join('<br>');md+=`| ${a.m_nActionID} | ${a.m_pszSequenceName??'ausente'} | ${a.m_nDuration??'ausente'} | ${a.m_nHitBoxStart??'—'} / ${a.m_nHitBoxDuration??'—'} | ${a.m_flHitDamage??'—'} | ${commands} |\n`;}
 md+='\nHitboxes, hurtboxes, sons, partículas e demais condições: registro integral em `app/game/shared/roster.json`.\n';
}
fs.writeFileSync('docs/movesets.md',md);console.log('Imported',Object.keys(roster));
