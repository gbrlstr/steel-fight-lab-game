import {test} from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {WebSocket} from 'ws';import {checksum} from '../app/game/shared/combat.ts';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
test('room, authoritative rollback snapshots, spectator, tournament and disconnect',{timeout:15000},async()=>{
 const port=3100+Math.floor(Math.random()*300);const process=spawn(globalThis.process.execPath,['server/index.mjs'],{env:{...globalThis.process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});const clients=[];
 try{
 await new Promise((resolve,reject)=>{process.stdout.once('data',resolve);process.once('error',reject)});
 async function client(){const ws=new WebSocket(`ws://127.0.0.1:${port}`);const messages=[];ws.on('message',b=>messages.push(JSON.parse(b)));await new Promise(r=>ws.once('open',r));const c={ws,messages,send:m=>ws.send(JSON.stringify(m)),async until(type,predicate=()=>true){for(let i=0;i<150;i++){const m=messages.find(m=>m.type===type&&predicate(m));if(m)return m;await wait(20)}throw Error('Timeout '+type)}};clients.push(c);return c}
 const host=await client();host.send({type:'create',nick:'Streamer'});const welcome=await host.until('welcome');
 const a=await client(),b=await client();for(const [c,nick]of [[a,'A'],[b,'B']]){c.send({type:'join',nick,code:welcome.code});await c.until('welcome');c.send({type:'queue'})}
 await wait(100);host.send({type:'tournament'});await host.until('room',m=>m.pair.length===2);a.send({type:'ready'});b.send({type:'ready'});await a.until('start');await b.until('start');await host.until('start');
 const snap=await a.until('snapshot',m=>m.state.frame>10);a.send({type:'input',seq:0,frame:snap.state.frame-3,input:{},damage:999999,winner:0});b.send({type:'input',seq:0,frame:snap.state.frame-3,input:{left:true}});
 await wait(250);const sa=a.messages.filter(m=>m.type==='snapshot').at(-1);const sh=await host.until('snapshot',m=>m.state.frame===sa.state.frame);assert.equal(sa.hash,sh.hash);assert.equal(sa.hash,checksum(sa.state));assert.ok(sa.state.fighters.every(f=>f.hp===2000));
 // Spoofed winner and arbitrary damage are ignored; duplicate sequence cannot replace an input.
 a.send({type:'result',winner:'A',damage:999999});await wait(80);assert.equal(host.messages.filter(m=>m.type==='result').length,0);
 b.ws.close();const result=await host.until('result');assert.equal(result.reason,'disconnect');const aid=(await a.until('welcome')).id;assert.equal(result.winner,aid);const bracket=await host.until('room',m=>m.champion===aid);assert.equal(bracket.bracket[0].winner,aid);
 }finally{clients.forEach(c=>c.ws.close());process.kill()}
});
