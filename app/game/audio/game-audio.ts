import {action,roster} from '../shared/combat'
import type {Fighter} from '../shared/combat'

const files=import.meta.glob('../../assets/audio/**/*.{mp3,wav}',{eager:true,query:'?url',import:'default'}) as Record<string,string>
const clip:Record<string,string>={}
for(const [key,url] of Object.entries(files)){
 const name=key.replaceAll('\\','/').split('/audio/')[1]?.replace(/\.(mp3|wav)$/,'')
 if(name)clip[name]=url
}
const url=(name:string)=>clip[name]

const banks:Record<string,string[]>={
 'Hero_Tusk.PreAttack':['weapons/hero/axe/preattack01','weapons/hero/axe/preattack02','weapons/hero/axe/preattack03'],
 'Hero_Tusk.Attack':['weapons/hero/beastmaster/attack01','weapons/hero/beastmaster/attack02','weapons/hero/beastmaster/attack03'],
 'Hero_Tusk.WalrusKick.Target':['weapons/hero/tusk/punch_target'],
 'Hero_Tusk.WalrusPunch.Target':['weapons/hero/tusk/punch_target'],
 'Hero_Tusk.IceShards.Penguin':['weapons/hero/tusk/penguin01'],
 'Hero_Tusk.Snowball.Stun.Small':['weapons/hero/tusk/snowball_stun01'],
 'Hero_Bristleback.PreAttack':['weapons/hero/shared/large_blade/whoosh01','weapons/hero/shared/large_blade/whoosh02','weapons/hero/shared/large_blade/whoosh03'],
 'Hero_Bristleback.Attack':['weapons/hero/spirit_breaker/attack01','weapons/hero/spirit_breaker/attack02','weapons/hero/spirit_breaker/attack03'],
 'Hero_Bristleback.ViscousGoo.Cast':['weapons/hero/bristlebog/goo_cast'],
 'Hero_Bristleback.ViscousGoo.Target':['weapons/hero/bristlebog/goo_target'],
 'Hero_Bristleback.QuillSpray.Cast':['weapons/hero/bristlebog/quill_cast'],
 'Hero_Bristleback.QuillSpray.Target':['weapons/hero/bristlebog/quill_target01'],
 'Hero_Shen.PreAttack':['weapons/hero/phantom_assassin/phantom_assassin_swing1'],
 'Hero_Shen.Attack':['weapons/hero/shared/small_blade/attack_long01','weapons/hero/shared/small_blade/attack_long02','weapons/hero/shared/small_blade/attack_long03'],
 'Hero_VengefulSpirit.MagicMissile':['weapons/hero/vengeful_spirit/magic_missile1'],
 'Hero_VengefulSpirit.MagicMissileImpact':['weapons/hero/vengeful_spirit/magic_missile_impact'],
 'Hero_VengefulSpirit.NetherSwap':['weapons/hero/vengeful_spirit/nether_swap'],
 'Hero_Marci.PreAttack':['weapons/hero/marci/preattack01','weapons/hero/marci/preattack02','weapons/hero/marci/preattack03'],
 'Hero_Marci.Attack':['weapons/hero/marci/attack01','weapons/hero/marci/attack02','weapons/hero/marci/attack03'],
 'Hero_Marci.Rebound.Cast':['weapons/hero/marci/rebound_cast'],
 'Hero_Marci.Unleash.Charged':['weapons/hero/marci/unleash_charged_3d'],
 'Hero_Marci.Unleash.Pulse':['weapons/hero/marci/unleash_pulse'],
 'Hero_Marci.Unleash.Cast':['weapons/hero/marci/unleash_cast'],
 'Hero_Dawnbreaker.PreAttack':['weapons/hero/axe/preattack01','weapons/hero/axe/preattack02','weapons/hero/axe/preattack03'],
 'Hero_Dawnbreaker.Attack':['weapons/hero/dawnbreaker/attack01','weapons/hero/dawnbreaker/attack02','weapons/hero/dawnbreaker/attack03'],
 'Hero_Dawnbreaker.Fire_Wreath.Sweep':['weapons/hero/dawnbreaker/fire_wreath_sweep'],
 'Hero_Dawnbreaker.Fire_Wreath.Smash':['weapons/hero/dawnbreaker/fire_wreath_smash'],
 'Hero_Dawnbreaker.Solar_Guardian.Stun':['weapons/hero/dawnbreaker/elated_stun'],
}
const voice:Record<string,string>={
 tusk:'vo/announcer_dota_fighter/dota_fighter_hero_110_tusk',
 bristleback:'vo/announcer_dota_fighter/dota_fighter_hero_013_bristleback',
 dawnbreaker:'vo/announcer_dota_fighter/dota_fighter_hero_023_dawnbreaker',
 marci:'vo/announcer_dota_fighter/dota_fighter_hero_057_marci',
 vengeful:'vo/announcer_dota_fighter/dota_fighter_npc_010_shendelzare',
}

let bed:HTMLAudioElement|null=null
let bedName=''
let fade=0
let line:HTMLAudioElement|null=null
let lineGen=0
const later:number[]=[]
const KEY='sleet-audio'
type Mix={volume:number;muted:boolean}
const bases=new WeakMap<HTMLAudioElement,number>()
const live=new Set<HTMLAudioElement>()
function loadMix():Mix{
 try{
  const raw=JSON.parse(localStorage.getItem(KEY)||'')
  const volume=Number(raw.volume)
  if(Number.isFinite(volume))return {volume:Math.max(0,Math.min(1,volume)),muted:!!raw.muted}
 }catch{/* keep the quieter default */}
 return {volume:.4,muted:false}
}
let mix=loadMix()
function heard(base:number){return mix.muted?0:Math.max(0,Math.min(1,base*mix.volume))}
function track(audio:HTMLAudioElement,base:number){
 bases.set(audio,Math.max(0,Math.min(1,base)))
 audio.volume=heard(bases.get(audio)!)
 live.add(audio)
 const drop=()=>live.delete(audio)
 audio.addEventListener('ended',drop)
 audio.addEventListener('error',drop)
}
function applyMix(){
 for(const audio of live){const base=bases.get(audio);if(base!=null)audio.volume=heard(base)}
 localStorage.setItem(KEY,JSON.stringify(mix))
}
function saveMix(next:Partial<Mix>){
 if(next.volume!=null)mix.volume=Math.max(0,Math.min(1,next.volume))
 if(next.muted!=null)mix.muted=next.muted
 applyMix()
}
const armed=()=>{document.addEventListener('pointerdown',resume,{once:true});document.addEventListener('keydown',resume,{once:true})}
function resume(){if(bed?.paused)void bed.play().catch(()=>{})}

function one(src:string|undefined,volume=1,rate=1){
 if(!src)return
 const audio=new Audio(src)
 audio.playbackRate=rate
 track(audio,volume)
 void audio.play().catch(()=>live.delete(audio))
}
function pick(name:string,volume=1,rate=1){
 const list=banks[name]
 if(!list?.length)return
 one(url(list[Math.floor(Math.random()*list.length)]),volume,rate*(.97+Math.random()*.06))
}
function named(path:string,volume=1,rate=1){one(url(path),volume,rate)}
function speak(path:string|undefined,volume=.95){
 const src=path?url(path):undefined
 if(!src)return Promise.resolve()
 const gen=lineGen
 return new Promise<void>(done=>{
  const audio=new Audio(src)
  line=audio
  track(audio,volume)
  const finish=()=>{if(line===audio)line=null;if(gen===lineGen)done()}
  audio.onended=finish
  audio.onerror=finish
  void audio.play().catch(finish)
 })
}
function stopLine(){lineGen++;if(line)live.delete(line);line?.pause();line=null}

function music(name:'menu'|'fight',volume:number){
 if(bedName===name&&bed&&!bed.paused)return
 stopMusic(0)
 bedName=name
 const src=url(name==='menu'?'misc/crownfall/music/fighting_menu':'misc/crownfall/music/fighting_main')
 if(!src)return
 bed=new Audio(src)
 bed.loop=true
 track(bed,volume)
 void bed.play().catch(()=>armed())
}
function stopMusic(seconds=0){
 const current=bed
 bed=null
 bedName=''
 if(!current)return
 live.delete(current)
 if(seconds<=0){current.pause();return}
 const start=bases.get(current)??1
 const steps=8
 let i=0
 window.clearInterval(fade)
 fade=window.setInterval(()=>{
  i++
  current.volume=heard(start*(1-i/steps))
  if(i>=steps){window.clearInterval(fade);current.pause()}
 },seconds*1000/steps)
}

const quiet=new Set(['IDLE_ACTION_DEFINITION','BLOCKSTUN_ACTION_DEFINITION','HITSTUN_ACTION_DEFINITION','GUARDBREAK_ACTION_DEFINITION','DASH_ACTION_DEFINITION','BACKDASH_ACTION_DEFINITION','VICTORY_ACTION_DEFINITION','DEFEAT_ACTION_DEFINITION'])

export const sfx={
 arm:armed,
 menu(){music('menu',.7);armed()},
 fightMusic(){music('fight',.5)},
 stop(){for(const id of later)window.clearTimeout(id);later.length=0;stopLine();stopMusic(.35)},
 click(){named('ui/panorama/panorama_generic_button_click_01',.8)},
 confirm(){named('ui/menu/pick_select',.35);named('ui/panorama/panorama_weighty_topmenu_01',.85);named('ui/panorama/panorama_topmenu_select_03',.6)},
 startFight(){named('ui/hero_picked',.4)},
 selectHero(){named('ui/panorama/panorama_player_radar_appear_01',.5)},
 back(){named('ui/menu/map_open',.4)},
 slide(){named('ui/menu/map_open',.4,.8)},
 hero(id:string){const path=voice[id];if(path)named(path,.9)},
 swing(hero:string,actionId:string){
  if(quiet.has(actionId))return
  if(actionId==='SWAP_ACTION_DEFINITION'){pick('Hero_VengefulSpirit.NetherSwap',1);return}
  if(actionId==='PROJECTILE_ACTION_DEFINITION'&&hero==='vengeful'){pick('Hero_VengefulSpirit.MagicMissile',1);return}
  if(actionId==='UNLEASH_ACTION_DEFINITION'){pick('Hero_Marci.Unleash.Cast',1);return}
  if(actionId==='LUMINOSITY_ACTION_DEFINITION'){pick('Hero_Dawnbreaker.Solar_Guardian.Stun',1);return}
  if(actionId==='STARBREAKER_1_ACTION_DEFINITION'||actionId==='STARBREAKER_2_ACTION_DEFINITION'){pick('Hero_Dawnbreaker.Fire_Wreath.Sweep',.9);return}
  if(actionId==='STARBREAKER_3_ACTION_DEFINITION'){pick('Hero_Dawnbreaker.Fire_Wreath.Smash',1);return}
  const def=roster[hero]?.m_vecActionDefinitions.find((a:any)=>a.m_nActionID===actionId)
  if(!def?.m_pszSwingSound&&!def?.m_HitBox&&!def?.m_flProjectileSpeed&&!def?.m_nInstallFrames)return
  pick(def?.m_pszSwingSound??roster[hero]?.m_pszBasicSwingSound,1)
 },
 impact(hero:string,actionId:string,kind:'hit'|'block'){
  const fighter={hero,action:actionId} as Fighter
  const def=action(fighter)
  pick(def?.m_pszHitSound??roster[hero]?.m_pszBasicHitSound,kind==='block'?0.45:1,kind==='block'?1.12:1)
 },
 intro(a:string,b:string,onGo:()=>void,onPhase?:(phase:'round'|'fight')=>void){
  stopMusic(.25)
  const gen=lineGen
  void (async()=>{
   await speak(voice[a])
   if(gen!==lineGen)return
   await speak('vo/announcer_dota_fighter/dota_fighter_versus')
   if(gen!==lineGen)return
   await speak(voice[b])
   if(gen!==lineGen)return
   await this.roundCall(false,onPhase)
   if(gen!==lineGen)return
   music('fight',.5)
   onGo()
  })()
 },
 roundCall(finalRound:boolean,onPhase?:(phase:'round'|'fight')=>void){
  const gen=lineGen
  return (async()=>{
   onPhase?.('round')
   await speak(finalRound?'vo/announcer_dota_fighter/dota_fighter_round_final':'vo/announcer_dota_fighter/dota_fighter_round_01')
   if(gen!==lineGen)return
   named('weapons/hero/techies/suicide',.35)
   onPhase?.('fight')
   await speak(Math.random()<.5?'vo/announcer_dota_fighter/dota_fighter_fight_01':'vo/announcer_dota_fighter/dota_fighter_fight_02')
  })()
 },
 roundOver(timeout:boolean){
  if(timeout)return speak('ui/treasure_01',.5)
  named('misc/spectator/crowd_client01',.7)
  return speak(Math.random()<.5?'vo/announcer_dota_fighter/dota_fighter_ko_01':'vo/announcer_dota_fighter/dota_fighter_ko_02',1)
 },
 matchOver(){
  named('vo/announcer_dota_fighter/dota_fighter_victory_01',1)
  named('music/valve_dota_001/stingers/radiant_win',.25)
  if(bed){bases.set(bed,Math.min(bases.get(bed)??.5,.12));bed.volume=heard(bases.get(bed)!)}
 },
 mix(){return {volume:mix.volume,muted:mix.muted}},
 setVolume(volume:number){saveMix({volume})},
 setMuted(muted:boolean){saveMix({muted})},
}
