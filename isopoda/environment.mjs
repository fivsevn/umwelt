import {habitatConfig} from './habitats.mjs';
import {DEFAULT_LAYOUT,DEFAULT_SHELTER} from './scenery/default-layout.mjs?v=authored-1';
import {speciesById} from './species-registry.mjs?v=aquatic-1';
// Spatial traces advance with observation turns, never with frame rate or wall time.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function environmentFor(s){
 if(habitatConfig(s).aquatic&&!s.environment){const h=habitatConfig(s);s.environment={version:3,habitatId:h.id,wetZones:[],leaves:[],foodNodes:[],shelter:{x:190,y:250},disturbance:0,scuffs:[],shells:[],pendingShells:[],removedShells:[]}}
 if(s.environment?.version===3)return s.environment;
 if(s.environment?.version===1||s.environment?.version===2){
  s.environment.version=3;
  s.environment.shells=Array.isArray(s.environment.shells)?s.environment.shells:[];
  s.environment.pendingShells=Array.isArray(s.environment.pendingShells)?s.environment.pendingShells:[];
  s.environment.removedShells=Array.isArray(s.environment.removedShells)?s.environment.removedShells:[];
  return s.environment;
 }
 return s.environment={version:3,wetZones:structuredClone(DEFAULT_LAYOUT.background.params.wetZones),leaves:[],foodNodes:s.food?[{x:320,y:258,amount:s.food,age:0}]:[],shelter:{x:DEFAULT_SHELTER.x,y:DEFAULT_SHELTER.y},disturbance:0,scuffs:[],shells:[],pendingShells:[],removedShells:[]};
}
const observationTurn=s=>(Math.max(1,Number(s.day)||1)-1)*3+Math.max(0,Number(s.period)||0);
export function releaseDueShells(s){
 const e=environmentFor(s),turn=observationTurn(s),keep=[];
 for(const trace of e.pendingShells){
  if((trace.dueTurn??Infinity)>turn){keep.push(trace);continue}
  if(e.removedShells.includes(trace.id)||e.shells.some(shell=>shell.id===trace.id))continue;
  e.shells.push({id:trace.id,source:trace.source||null,specimen:trace.specimen||null,phase:trace.phase||'whole',x:Math.round(trace.x),y:Math.round(trace.y),a:Number(trace.a)||0,age:0,createdDay:s.day,createdPeriod:s.period});
 }
 e.pendingShells=keep;e.shells=e.shells.slice(-12);return e;
}
export function syncSceneTrace(s,scene){
 const e=environmentFor(s),trace=scene?.shellTrace;if(!trace||!trace.id)return e;
 if(e.removedShells.includes(trace.id)||e.shells.some(shell=>shell.id===trace.id)||e.pendingShells.some(shell=>shell.id===trace.id))return e;
 e.pendingShells.push({id:trace.id,source:trace.source||scene.encounter||null,specimen:trace.specimen||null,phase:trace.phase||'whole',x:Math.round(trace.x),y:Math.round(trace.y),a:Number(trace.a)||0,dueTurn:observationTurn(s)+1});
 e.pendingShells=e.pendingShells.slice(-12);return e;
}
export function takeShell(s,id){
 const e=environmentFor(s),index=e.shells.findIndex(shell=>shell.id===id);if(index<0)return null;
 const [shell]=e.shells.splice(index,1);if(!e.removedShells.includes(id))e.removedShells.push(id);e.removedShells=e.removedShells.slice(-24);return shell;
}
export function changeEnvironment(s,id){
 const e=environmentFor(s),turn=s.records.length;
 if(['mist','wet-left','wet-all'].includes(id)){
  e.wetZones[0].moisture=clamp(e.wetZones[0].moisture+22,15,100);
  if(id==='wet-all'){if(!e.wetZones[1])e.wetZones.push({x:265,y:235,rx:90,ry:145,moisture:25});e.wetZones[1].moisture=clamp(e.wetZones[1].moisture+40,15,100)}
 }
 if(id==='air')for(const z of e.wetZones)z.moisture=Math.max(12,z.moisture-15);
 if(['leaf','gap','flat'].includes(id)){
  const n=e.leaves.length,h=((s.seed>>>0)^Math.imul(turn+11,2654435761)^Math.imul(n+3,2246822507))>>>0;
  const sites=[[92,164],[276,142],[116,300],[286,314],[206,108],[326,244],[73,356],[238,356],[156,225],[312,382],[67,238],[252,252]];
  const site=sites[(n+((h>>>17)%sites.length))%sites.length],x=clamp(site[0]+(h%23)-11,48,338),y=clamp(site[1]+((h>>>8)%21)-10,55,388);
  const a=((h>>>12)%628)/100-3.14,scale=.68+((h>>>5)%6)*.055;
  e.leaves.push({id:'leaf-'+turn,x,y,a,gap:id!=='flat',age:0,scale});
 }
 if(id==='food')e.foodNodes.push({x:310-(turn%3)*24,y:258+(turn%2)*30,amount:1,age:0});
 if(id==='clean'){let left=2;for(const f of e.foodNodes){const take=Math.min(left,f.amount);f.amount-=take;left-=take}}
 if(id==='remove'&&s.scene?.encounter){
  const removed=e.shells.filter(shell=>shell.source===s.scene.encounter);e.shells=e.shells.filter(shell=>shell.source!==s.scene.encounter);
  for(const shell of removed)if(!e.removedShells.includes(shell.id))e.removedShells.push(shell.id);
 }
 if(['lift','clean','remove','wet-all','flat'].includes(id)){
  e.disturbance=3;e.scuffs.push({x:e.shelter.x,y:e.shelter.y+30,turn});
  if(id==='lift'){e.shelter.x=190+(turn%2?12:-12);e.shelter.y=209}
 }
 return e;
}
export function ageEnvironment(s){
 const e=environmentFor(s);
 for(const z of e.wetZones)z.moisture=Math.max(12,z.moisture-(s.vent>70?8:4));
 for(const l of e.leaves)l.age++;
 if(s.period===0){let remaining=1;for(const f of e.foodNodes){const take=Math.min(remaining,f.amount);f.amount-=take;remaining-=take;f.age++}}
 for(const shell of e.shells)shell.age=(shell.age||0)+1;
 e.shells=e.shells.filter(shell=>shell.age<9);
 e.disturbance=Math.max(0,e.disturbance-1);
}
// Score available microhabitats separately for each animal; never average taxa.
export function habitatFit(s,c){
 if(habitatConfig(s).aquatic)return s.oxygen*.4+s.cover*.2-Math.abs(s.flow-45)*.2;
 const e=environmentFor(s),p=speciesById(c.species||s.cohort?.[0]?.species||'dairy');
 const moisture=Math.min(Math.abs(Math.max(15,s.humidity-22)-p.wet),...e.wetZones.map(z=>Math.abs(z.moisture-p.wet)));
 const cover=Math.max(0,p.cover-s.cover-e.leaves.filter(l=>l.gap).length*3);
 return -moisture-cover*.4;
}
export function environmentTarget(s,c){
 if(habitatConfig(s).aquatic)return {x:180,y:240,kind:s.flow>65?'shelter':'edge'};
 const e=s.environment;if(!e)return null;
 const p=speciesById(c.species||s.cohort?.[0]?.species||'dairy'),i=Number.isInteger(c.id)?c.id:Math.max(0,'ABCDEFG'.indexOf(c.id));
 const dry=Math.max(15,s.humidity-22),z=e.wetZones.reduce((a,b)=>Math.abs(a.moisture-p.wet)<=Math.abs(b.moisture-p.wet)?a:b);
 if(e.disturbance||s.light>100-p.cover*.6)return {...e.shelter,kind:'shelter'};
 if(Math.abs(dry-p.wet)-Math.abs(z.moisture-p.wet)>12)return {x:z.x+8+i*3,y:90+i*42,kind:'wet'};
 const food=e.foodNodes.filter(f=>f.amount>0);
 if(food.length&&i%2===0)return {...food[i%food.length],kind:'food'};
 if(s.cover<p.cover)return {...e.shelter,kind:'shelter'};
 const leaf=e.leaves[i%e.leaves.length];return leaf?{...leaf,kind:leaf.gap?'shelter':'edge'}:{x:300,y:200,kind:'edge'};
}
