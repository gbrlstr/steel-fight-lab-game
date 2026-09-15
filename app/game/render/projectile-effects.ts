import {FIGHTER_PRESENCE} from './fighters'
import {originalMissiles} from './original-missiles'
import * as T from 'three'

export type ProjectileVisual={root:T.Object3D;update:(x:number,face:number,frame:number)=>void;dispose:()=>void}
// Original PNG sequences exported by Source 2 Viewer. This is a scoped browser
// adaptation of the goo's sprite layers, not a general Source 2 particle interpreter.
export function projectileEffects(){
 const textures=new Map<string,T.Texture>(),loader=new T.TextureLoader()
 const texture=(name:string)=>{let t=textures.get(name);if(!t){t=loader.load('/effects/'+(name.includes('/')?name:'bristleback/'+name)+'.png');t.colorSpace=T.SRGBColorSpace;textures.set(name,t)}return t}
 const missiles=originalMissiles(texture)
 function create(hero:string,born:number):ProjectileVisual{
  if(hero!=='bristleback')return missiles.create(hero,born)
  const root=new T.Group(),parts:{sprite:T.Sprite;kind:number;index:number}[]=[]
  const add=(kind:number,index:number,map:T.Texture,color:number)=>{
   const sprite=new T.Sprite(new T.SpriteMaterial({map,color,transparent:true,depthWrite:false,toneMapped:false,blending:kind===0?T.AdditiveBlending:T.NormalBlending}))
   if(kind===1){
    // Re-tint the molten texture's luminance; its baked orange must not override goo green.
    sprite.material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`vec4 texel = texture2D(map, vMapUv); float mask = max(texel.r, max(texel.g, texel.b)); diffuseColor *= vec4(vec3(mask), texel.a);`)}
    sprite.material.customProgramCacheKey=()=> 'goo-molten-tint'
   }
   root.add(sprite);parts.push({sprite,kind,index})
  }
  const molten=Array.from({length:36},(_,i)=>texture('lava_blast_seq0_'+i))
  const spray=Array.from({length:24},(_,i)=>texture('spray1_seq0_'+i))
  add(0,0,texture('particle_glow_04'),0x44982d)
  for(let i=0;i<4;i++)add(1,i,molten[0]!,0x6e8f2d)
  for(let i=0;i<18;i++)add(2,i,spray[0]!,0xa7c409)
  for(let i=0;i<10;i++)add(3,i,texture('droplets_seq0'),0xa4c66e)
  return {root,update(x,face,frame){
   root.position.set(x/300,1.2*FIGHTER_PRESENCE,4.15+.15*FIGHTER_PRESENCE)
   const time=Math.max(0,(frame-born)/60)
   for(const {sprite,kind,index} of parts){
    if(kind===0){sprite.scale.setScalar(.6);sprite.material.opacity=.45;continue}
    if(kind===1){
     const phase=(time*.4+index/4)%1,angle=time*.6+index*2.4
     sprite.material.map=molten[Math.floor(phase*36)]!
     sprite.position.set(Math.cos(angle)*.07,Math.sin(angle)*.07,.02+index*.001)
     sprite.scale.setScalar(.38+Math.sin(phase*Math.PI)*.12);sprite.material.rotation=angle;sprite.material.opacity=.9
    }else{
     const life=kind===2?.65:.6,offset=index/(kind===2?18:10)*life
     const age=(time+offset)%life,t=age/life,seed=Math.sin(index*31.7+kind*3)
     sprite.visible=time>=age
     // 1200 units/s travel and -600 units/s² gravity from the original definitions.
     sprite.position.set(-face*4*age+seed*.12,age*(.5+seed*.35)-age*age,.03)
     if(kind===2)sprite.material.map=spray[Math.min(23,Math.floor(t*24))]!
     sprite.scale.setScalar(kind===2?.12+t*.38:.08*(1-t*.9))
     sprite.material.rotation=seed*3+age;sprite.material.opacity=(1-t)*.85
    }
   }
  },dispose(){for(const p of parts)p.sprite.material.dispose()}}
 }
 return {create,dispose(){missiles.dispose();for(const t of textures.values())t.dispose();textures.clear()}}
}


