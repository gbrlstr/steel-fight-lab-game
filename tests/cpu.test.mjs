import {test} from 'node:test';import assert from 'node:assert/strict';
import {initial,step} from '../app/game/shared/combat.ts';
import {createLocalCpu} from '../app/game/ai/local-cpu.ts';
const steady=()=>0.5;
test('cpu walks toward the player when far away',()=>{
 const cpu=createLocalCpu(1,steady);let s=initial('tusk','tusk');s.fighters[0].x=-800;s.fighters[1].x=800;
 for(let i=0;i<40;i++)s=step(s,[{},cpu.read(s,'play')]);
 assert.ok(s.fighters[1].x<800);
});
test('cpu can jab an idle opponent in range',()=>{
 const cpu=createLocalCpu(1,steady);let s=initial('tusk','tusk');s.fighters[0].x=-150;s.fighters[1].x=150;
 for(let i=0;i<90;i++)s=step(s,[{},cpu.read(s,'play')]);
 assert.ok(s.fighters[0].hp<2000);
});
test('cpu starts guarding after reacting to a strike',()=>{
 const cpu=createLocalCpu(1,steady);let s=initial();s.fighters[0].x=-1200;s.fighters[1].x=1200;let guarded=false;
 s=step(s,[{attack:true},{}]);
 for(let i=0;i<24;i++){const input=cpu.read(s,'play');if(input.left&&input.right&&input.down)guarded=true;s=step(s,[{},input])}
 assert.ok(guarded);
});
test('cpu chains jab into the rest of the string',()=>{
 const cpu=createLocalCpu(1,steady);let s=initial('tusk','tusk');s.fighters[0].x=-150;s.fighters[1].x=150;const seen=new Set();
 for(let i=0;i<160;i++){s=step(s,[{},cpu.read(s,'play')]);seen.add(s.fighters[1].action)}
 assert.ok(seen.has('JAB_ACTION_DEFINITION'));
 assert.ok(seen.has('JAB_2_ACTION_DEFINITION')||seen.has('FINISHER_ACTION_DEFINITION'));
 assert.ok(s.fighters[0].hp<=1800||s.fighters[1].combo>1);
});
test('cpu continues marci light string into cross',()=>{
 const cpu=createLocalCpu(1,steady);let s=initial('tusk','marci');s.fighters[0].x=-150;s.fighters[1].x=150;const seen=new Set();
 for(let i=0;i<180;i++){s=step(s,[{},cpu.read(s,'play')]);seen.add(s.fighters[1].action)}
 assert.ok(seen.has('JAB_ACTION_DEFINITION'));
 assert.ok(seen.has('CROSS_ACTION_DEFINITION')||seen.has('FINISHER_ACTION_DEFINITION'));
});
test('cpu leaves a gap so the player can attack, and damaging hits reduce HP',()=>{
 const cpu=createLocalCpu(1,steady);let s=initial('tusk','tusk');s.fighters[0].x=-150;s.fighters[1].x=150;let idleTogether=0;
 for(let i=0;i<240;i++){
  s=step(s,[{},cpu.read(s,'play')]);
  if(s.fighters[0].action==='IDLE_ACTION_DEFINITION'&&s.fighters[1].action==='IDLE_ACTION_DEFINITION'&&!s.fighters[0].stun&&!s.fighters[1].stun)idleTogether++;
 }
 assert.ok(idleTogether>20);
 assert.ok(s.fighters[0].hp<2000);
});
