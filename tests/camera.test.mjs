import {test} from 'node:test';import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {frameFight,CAMERA} from '../app/game/render/fight-camera.ts';
import {initial,step,roster,RULES} from '../app/game/shared/combat.ts';
const wall=(RULES.edge-roster.tusk.m_flHeroWidth/2)/300;
test('fighters remain framed at either wall and opposite walls across aspect ratios',()=>{
 for(const aspect of [4/3,16/9,21/9])for(const positions of [[-wall,2],[-wall,-4],[4,wall],[-wall,wall]]){
 const camera=new PerspectiveCamera(38,aspect,.1,200);camera.position.set(0,2.55,13.2);frameFight(camera);camera.updateProjectionMatrix();
 for(const x of positions)for(const side of [-1,1])for(const y of [0,3.8]){const p=new Vector3(x+side*1.8,y,CAMERA.planeZ+1).project(camera);assert.ok(Math.abs(p.x)<=1,`clipped x=${p.x} positions=${positions} aspect=${aspect}`);assert.ok(Math.abs(p.y)<=1,`clipped y=${p.y}`)}
 }
});
test('simulation stops at walls and preserves body separation under pressure',()=>{
 for(const sign of [-1,1]){let state=initial();state.fighters[0].x=sign*(RULES.edge-100);state.fighters[1].x=sign*(RULES.edge-300);
 for(let i=0;i<240;i++)state=step(state,[sign<0?{left:true}:{right:true},sign<0?{left:true}:{right:true}]);
 for(const f of state.fighters)assert.ok(Math.abs(f.x)+roster[f.hero].m_flHeroWidth/2<=RULES.edge);
 assert.ok(Math.abs(state.fighters[1].x-state.fighters[0].x)>=275);
 }
});

test('approaching and retreating preserve projected fighter size and camera transform',()=>{
 for(const aspect of [4/3,16/9,21/9]){
  const camera=new PerspectiveCamera(CAMERA.fov,aspect,.1,200);
  frameFight(camera);camera.updateProjectionMatrix();
  const transform=camera.matrixWorld.toArray();let height;
  for(const x of [-wall,-3,-.5,0,.5,3,wall]){
   frameFight(camera);
   assert.deepEqual(camera.matrixWorld.toArray(),transform);
   const feet=new Vector3(x,0,CAMERA.planeZ).project(camera);
   const head=new Vector3(x,3.8,CAMERA.planeZ).project(camera);
   const projectedHeight=head.y-feet.y;
   if(height!==undefined)assert.ok(Math.abs(projectedHeight-height)<1e-12);
   height=projectedHeight;
  }
 }
});




