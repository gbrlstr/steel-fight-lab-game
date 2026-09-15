import {WebSocketServer} from 'ws';
import {randomUUID,randomBytes} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {initial,step,checksum,roster,RULES} from '../app/game/shared/combat.ts';
const port=Number(process.env.PORT??3001),wss=new WebSocketServer({port,host:process.env.HOST??'127.0.0.1',maxPayload:4096});
const rooms=new Map();
function send(ws,data){if(ws.readyState===1&&ws.bufferedAmount<1024*1024)ws.send(JSON.stringify(data));}
function broadcast(r,data){for(const p of r.people.values())send(p.ws,data)}
function view(r){return {type:'room',code:r.code,host:r.host,people:[...r.people.values()].map(({id,nick,hero,ready,online})=>({id,nick,hero,ready,online})),queue:r.queue,pair:r.pair,deadline:r.deadline,bracket:r.bracket,champion:r.champion,active:!!r.match}}
function update(r){broadcast(r,view(r))}
function schedule(r){if(r.match||r.pair.length)return;const next=r.bracket.find(m=>!m.done);if(next)r.pair=[...next.players];else if(!r.bracket.length&&r.queue.length>=2)r.pair=r.queue.splice(0,2);if(r.pair.length){r.deadline=Date.now()+30000;r.pair.forEach(id=>{r.people.get(id).ready=false});update(r)}}
function finish(r,winner,reason){const pair=[...r.pair];broadcast(r,{type:'result',winner,reason});const node=r.bracket.find(m=>!m.done&&m.players[0]===pair[0]&&m.players[1]===pair[1]);if(node){node.done=true;node.winner=winner;const round=r.bracket.filter(m=>m.round===node.round);if(round.every(m=>m.done)){const winners=round.map(m=>m.winner);if(winners.length===1)r.champion=winners[0];else for(let i=0;i<winners.length;i+=2)r.bracket.push({round:node.round+1,players:[winners[i],winners[i+1]],done:false});}}
 r.match=null;r.pair=[];r.deadline=0;update(r);}
function begin(r){r.match={state:initial(...r.pair.map(id=>r.people.get(id).hero)),history:new Map(),inputs:new Map(),sequence:[-1,-1],clock:performance.now(),terminal:0};broadcast(r,{type:'start',pair:r.pair,state:r.match.state});update(r)}
wss.on('connection',ws=>{
 let room=null,person=null,count=0,bucket=Date.now();
 ws.on('message',raw=>{try{
  if(Date.now()-bucket>1000){bucket=Date.now();count=0}if(++count>180)return ws.close(1008,'rate');
  const m=JSON.parse(raw.toString());if(m.type==='ping')return send(ws,{type:'pong',at:m.at});
  if(m.type==='create'||m.type==='join'){
   if(room)throw Error('Already connected to a room');
   if(m.type==='create'){if(rooms.size>=100)throw Error('Server full');const code=randomBytes(3).toString('hex').toUpperCase();room={code,host:null,people:new Map(),queue:[],pair:[],bracket:[],champion:null,match:null,deadline:0};rooms.set(code,room)}else room=rooms.get(String(m.code).toUpperCase());
   if(!room)throw Error('Room not found');if(room.people.size>=64)throw Error('Room full');
   person={id:randomUUID(),nick:String(m.nick??'Viewer').trim().slice(0,24)||'Viewer',hero:'tusk',ready:false,online:true,ws};room.people.set(person.id,person);if(!room.host)room.host=person.id;
   send(ws,{type:'welcome',id:person.id,code:room.code});send(ws,view(room));if(room.match)send(ws,{type:'start',pair:room.pair,state:room.match.state});update(room);return;
  }
  if(!room||!person)throw Error('Join a room first');
  if(m.type==='hero'){if(room.pair.includes(person.id))throw Error('Hero select locked during call-up');if(Object.hasOwn(roster,m.hero))person.hero=m.hero;}
  if(m.type==='queue'){if(room.bracket.length)throw Error('Registration closed');if(!room.queue.includes(person.id)&&!room.pair.includes(person.id))room.queue.push(person.id);}
  if(m.type==='call'){if(person.id!==room.host)throw Error('Host only');schedule(room)}
  if(m.type==='tournament'){if(person.id!==room.host)throw Error('Host only');if(room.match||room.pair.length||room.bracket.length)throw Error('Event already started');const n=room.queue.length;if(n<2||n>32||(n&(n-1)))throw Error('Register 2, 4, 8, 16, or 32 players');for(let i=0;i<n;i+=2)room.bracket.push({round:1,players:room.queue.slice(i,i+2),done:false});room.queue=[];schedule(room)}
  if(m.type==='ready'&&room.pair.includes(person.id)&&!room.match){person.ready=true;if(room.pair.every(id=>room.people.get(id).ready))begin(room)}
  if(m.type==='leave'&&room.pair.includes(person.id)){finish(room,room.pair.find(id=>id!==person.id),'forfeit');return}
  if(m.type==='input'){
   const match=room.match,i=room.pair.indexOf(person.id);if(!match||i<0)return;
   if(!Number.isInteger(m.seq)||m.seq<=match.sequence[i]||!Number.isInteger(m.frame)||m.frame<Math.max(1,match.state.frame-RULES.rollback)||m.frame>match.state.frame+12)return;
   if(!m.input||typeof m.input!=='object')return;const input={};for(const k of ['left','right','up','down','attack','special'])input[k]=m.input[k]===true;
   const key=m.frame;const values=match.inputs.get(key)??[null,null];if(values[i])return;values[i]=input;match.inputs.set(key,values);match.sequence[i]=m.seq;
   if(key<=match.state.frame&&match.history.has(key-1)){const end=match.state.frame;match.state=structuredClone(match.history.get(key-1));for(let f=key;f<=end;f++){match.state=step(match.state,match.inputs.get(f)??[{},{}]);match.history.set(f,match.state)}}return;
  }
  update(room);
 }catch(e){send(ws,{type:'error',message:e.message})}});
 ws.on('close',()=>{if(!room||!person)return;person.online=false;room.queue=room.queue.filter(id=>id!==person.id);if(room.pair.includes(person.id))finish(room,room.pair.find(id=>id!==person.id),'disconnect');if(person.id===room.host)room.host=[...room.people.values()].find(p=>p.online)?.id??null;update(room);if(![...room.people.values()].some(p=>p.online))rooms.delete(room.code)});
});
setInterval(()=>{for(const r of rooms.values()){
 if(!r.match){if(r.deadline&&Date.now()>r.deadline){const ready=r.pair.filter(id=>r.people.get(id).ready);finish(r,ready[0]??r.pair[0],ready.length?'ausência':'dupla ausência: avanço administrativo do primeiro inscrito')}continue}
 const m=r.match,now=performance.now();let budget=8;
 while(now-m.clock>=1000/60&&budget--){m.clock+=1000/60;m.history.set(m.state.frame,m.state);m.state=step(m.state,m.inputs.get(m.state.frame+1)??[{},{}]);for(const key of m.history.keys())if(key<m.state.frame-RULES.rollback-1)m.history.delete(key);for(const key of m.inputs.keys())if(key<m.state.frame-RULES.rollback-1)m.inputs.delete(key);
  if(m.state.winner!==null){if(!m.terminal)m.terminal=m.state.frame;if(m.state.frame-m.terminal>RULES.rollback){finish(r,r.pair[m.state.winner],'combat validated');break}}else m.terminal=0;
 }
 if(r.match)broadcast(r,{type:'snapshot',state:m.state,hash:checksum(m.state),acks:m.sequence});
}},1000/20);
wss.on('listening',()=>console.log(`Local server: ws://127.0.0.1:${port}`));
