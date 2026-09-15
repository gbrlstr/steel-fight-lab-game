import * as T from 'three'
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js'
import {loadGltf} from './asset-cache'
import {FIGHTER_PRESENCE} from './fighters'
import type {ProjectileVisual} from './projectile-effects'

export function originalMissiles(texture:(name:string)=>T.Texture){
 let penguin:ReturnType<typeof loadGltf>|undefined,disposed=false
 function create(hero:string,born:number):ProjectileVisual{
  const ice=hero==='tusk',root=new T.Group(),body=new T.Group();root.add(body)
  let dead=false,mixer:T.AnimationMixer|undefined
  const sprites:T.Sprite[]=[]
  const add=(path:string,color:number,size:number)=>{const s=new T.Sprite(new T.SpriteMaterial({map:texture(path),color,transparent:true,depthWrite:false,toneMapped:false,blending:T.AdditiveBlending}));s.scale.setScalar(size);root.add(s);sprites.push(s);return s}
  if(ice){
   penguin??=loadGltf('/effects/tusk/whiskey_the_stout_slider.glb')
   void penguin.then(g=>{if(dead||disposed)return;const model=clone(g.scene);const pivot=new T.Group();body.add(pivot);pivot.add(model);mixer=new T.AnimationMixer(model);if(g.animations[0])mixer.clipAction(g.animations[0]).play();mixer.setTime(0);const box=new T.Box3().setFromObject(model,true),size=box.getSize(new T.Vector3());body.scale.setScalar(.85/Math.max(size.x,size.y,size.z));pivot.position.sub(box.getCenter(new T.Vector3()));model.traverse(o=>{o.frustumCulled=false})}).catch(e=>console.error('Peng Pal model failed to load',e))
   add('tusk/beam_blue_energy_01',0x94deff,.8)
   for(let i=0;i<16;i++)add(i%3===0?'tusk/crystal_seq0':'tusk/frost_seq0_'+(i*2),0xd5f0f6,.2)
  }else{
   add('vengeful/particle_glow_05',0xa954f8,.85)
   add('vengeful/aircraft_white_v2',0xf3cfff,.65)
   for(let i=0;i<20;i++)add(i%3===0?'vengeful/particle_cone_gradient_1':'vengeful/yellowflare2',0xffb0e0,.18)
  }
  return {root,update(x,face,frame){
   const time=Math.max(0,(frame-born)/60);root.position.set(x/300,(ice?.42:1.2)*FIGHTER_PRESENCE,4.15+.15*FIGHTER_PRESENCE);body.rotation.y=face*Math.PI/2;mixer?.setTime(time)
   sprites.forEach((s,i)=>{
    if(i<(ice?1:2)){s.material.rotation=ice?Math.PI/2:time*(i?-.7:.5);s.material.opacity=ice?.4:.75;return}
    const age=(time+i*.031)%.48,t=age/.48,seed=Math.sin(i*17.3)
    s.visible=time>=age;s.position.set(-face*(ice?4:1600/300)*age,seed*.18+(ice?.12:t*.1),.05)
    s.material.opacity=(1-t)*.8;s.material.rotation=seed*3+time
    s.scale.setScalar(ice?.12+t*.35:.06+(1-t)*.2)
   })
  },dispose(){dead=true;mixer?.stopAllAction();for(const s of sprites)s.material.dispose()}}
 }
 return {create,dispose(){disposed=true}}
}

