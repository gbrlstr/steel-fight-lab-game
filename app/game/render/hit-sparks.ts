import * as T from 'three'

export type HitSpark={root:T.Object3D;update:(time:number)=>boolean;dispose:()=>void}
// Scoped browser adaptation of fighting_game_hitspark / fighting_game_blockspark.
// Layer counts, colors, 0.2–0.4s lifetimes and punch-axis spray follow the VPCFs.
// Sprite size is a function of age, so playback rate cannot inflate the burst.
const plane=new T.PlaneGeometry(1,1)
const hitLife=.62,blockLife=.32

function easeRadius(t:number){return t<=.206?t/.206*.751:.751+(t-.206)/.794*.249}
function easeAlpha(t:number){return t<=.128?.881+t/.128*.119:Math.max(0,1-(t-.128)/.872)}
function mulberry(seed:number){let s=seed>>>0;return ()=>{s=Math.imul(s,1664525)+1013904223>>>0;return s/4294967296}}
function travel(v:number,drag:number,age:number){return v/drag*(1-Math.exp(-drag*age))}
function velocity(v:number,drag:number,age:number,gravity=0){return (v-gravity/drag)*Math.exp(-drag*age)+gravity/drag}

const maps:Record<string,string>={
 particle_flare_006_white:'/effects/hit/particle_flare_006_white.png',
 particle_flare_004b_mod:'/effects/hit/particle_flare_004b_mod.png',
 particle_glow_08:'/effects/hit/particle_glow_08.png',
 particle_heroring_bad:'/effects/hit/particle_heroring_bad.png',
 stylized_explosion_sprite:'/effects/hit/stylized_explosion_sprite.png',
 particle_glow_01:'/effects/hit/particle_glow_01.png',
 fleks5_seq25:'/effects/hit/fleks5_seq25.png',
 fleks5_seq26:'/effects/hit/fleks5_seq26.png',
 fleks5_seq27:'/effects/hit/fleks5_seq27.png',
 fleks5_seq28:'/effects/hit/fleks5_seq28.png',
 particle_sphere_highlight5:'/effects/hit/particle_sphere_highlight5.png',
}

export function hitSparks(){
 const textures=new Map<string,T.Texture>(),loader=new T.TextureLoader()
 const texture=(name:string)=>{let map=textures.get(name);if(!map){map=loader.load(maps[name]??name);map.colorSpace=T.SRGBColorSpace;textures.set(name,map)}return map}
 function create(kind:'hit'|'block',at:{x:number;y:number;z:number},face:number,born:number):HitSpark{
  const root=new T.Group(),materials:T.Material[]=[],layers:((age:number)=>void)[]=[]
  root.position.set(at.x-face*.15,at.y,at.z)
  const rand=mulberry((Math.random()*0x7fffffff)|0)
  const sprite=(map:string,color:number)=>{
   const material=new T.SpriteMaterial({map:texture(map),color,transparent:true,depthWrite:false,depthTest:false,toneMapped:false,blending:T.AdditiveBlending})
   materials.push(material)
   const node=new T.Sprite(material);node.renderOrder=20;node.frustumCulled=false;root.add(node);return node
  }
  const streak=(map:string,color:number)=>{
   const material=new T.MeshBasicMaterial({map:texture(map),color,transparent:true,depthWrite:false,depthTest:false,toneMapped:false,blending:T.AdditiveBlending,side:T.DoubleSide})
   materials.push(material)
   const node=new T.Mesh(plane,material);node.renderOrder=20;node.frustumCulled=false;root.add(node);return node
  }
  if(kind==='hit'){
   const flash=sprite('particle_flare_006_white',0xfff4e4)
   const soft=sprite('particle_flare_004b_mod',0xffc7c7)
   const bloom=sprite('particle_glow_08',0xffe0c2)
   const ring=sprite('particle_heroring_bad',0xfff6e8)
   flash.material.rotation=rand()*Math.PI*2
   layers.push(age=>{
    const t=Math.min(1,age/.2),live=age<.2
    flash.visible=soft.visible=bloom.visible=ring.visible=live
    if(!live)return
    const radius=easeRadius(t),alpha=easeAlpha(t)
    flash.scale.setScalar(2.2+radius*3.6);flash.material.opacity=alpha
    soft.scale.setScalar((2.2+radius*3.6)*.42);soft.material.opacity=alpha*.85
    bloom.scale.setScalar(2.4+radius*2.8);bloom.material.opacity=alpha*.5
    ring.scale.setScalar(.9+radius*4.2);ring.material.opacity=alpha*.9
    ring.position.x=face*age*.4
   })
   const cores=Array.from({length:5},()=>{
    const spread=(rand()-.5)*.85
    return {mesh:streak('stylized_explosion_sprite',0xffd7a6),spread,speed:.35+rand()*.85}
   })
   layers.push(age=>{
    const t=Math.min(1,age/.4)
    for(const core of cores){
     core.mesh.visible=age<.4
     if(age>=.4)continue
     const length=1.1+t*1.4,rot=-face*Math.PI/2+core.spread,dx=-Math.sin(rot),dy=Math.cos(rot),lead=length*.45+core.speed*age
     core.mesh.material.opacity=t<.1?t/.1:Math.max(0,1-(t-.1)/.9)
     core.mesh.scale.set(.42,length,1)
     core.mesh.position.set(dx*lead,dy*lead,.02)
     core.mesh.rotation.z=rot
    }
   })
   const flecks=['fleks5_seq25','fleks5_seq26','fleks5_seq27','fleks5_seq28']
   const sparks=Array.from({length:14},(_,i)=>{
    const drag=.15+rand()*.08
    const orange=i>9
    return {
     mesh:streak(i<6?flecks[i%4]!:'particle_glow_01',orange?0xffb36b:0xffd6d6),
     vx:face*(1.6+rand()*2.4),vy:(rand()-.42)*2.2,drag,life:.32+rand()*.28,width:.16+rand()*.1,grav:-1.15,
    }
   })
   layers.push(age=>{
    for(const spark of sparks){
     const t=age/spark.life
     spark.mesh.visible=t<1
     if(t>=1)continue
     const vx=velocity(spark.vx,spark.drag,age),vy=velocity(spark.vy,spark.drag,age,spark.grav)
     spark.mesh.position.set(travel(spark.vx,spark.drag,age),travel(spark.vy,spark.drag,age)+spark.grav/spark.drag*(age-travel(1,spark.drag,age)),.04)
     spark.mesh.rotation.z=Math.atan2(vy,vx)-Math.PI/2
     spark.mesh.scale.set(spark.width,spark.width+Math.hypot(vx,vy)*.1,1)
     spark.mesh.material.opacity=(1-t)*.9
    }
   })
  }else{
   const edge=sprite('particle_sphere_highlight5',0x3eb5ff)
   const dome=sprite('particle_glow_08',0x8fd8ff)
   edge.material.rotation=face*Math.PI/2
   layers.push(age=>{
    const t=Math.min(1,age/.22),alpha=t<.12?t/.12:Math.max(0,1-(t-.12)/.88)
    edge.visible=age<.22;dome.visible=age<.28
    edge.scale.setScalar(2.2+t*1.1);edge.material.opacity=alpha;edge.position.x=face*age*.35
    dome.scale.setScalar(2.4+t*1.2);dome.material.opacity=alpha*.32
   })
   const sparks=Array.from({length:6},()=>({
    mesh:streak('particle_glow_01',0x9adfff),
    vx:-face*(.4+rand()*.9),vy:(rand()-.2)*.7,drag:.2,life:.12+rand()*.12,width:.05+rand()*.04,
   }))
   layers.push(age=>{
    for(const spark of sparks){
     const t=age/spark.life
     spark.mesh.visible=t<1
     if(t>=1)continue
     const vx=velocity(spark.vx,spark.drag,age),vy=velocity(spark.vy,spark.drag,age)
     spark.mesh.position.set(travel(spark.vx,spark.drag,age),travel(spark.vy,spark.drag,age),.03)
     spark.mesh.rotation.z=Math.atan2(vy,vx)-Math.PI/2
     spark.mesh.scale.set(spark.width,spark.width+Math.hypot(vx,vy)*.08,1)
     spark.mesh.material.opacity=(1-t)*.75
    }
   })
  }
  return {root,update(time){const age=Math.max(0,(time-born)/1000);for(const tick of layers)tick(age);return age<(kind==='hit'?hitLife:blockLife)},dispose(){for(const material of materials)material.dispose()}}
 }
 return {create,dispose(){for(const map of textures.values())map.dispose();textures.clear()}}
}
