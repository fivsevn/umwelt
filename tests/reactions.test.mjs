import test from 'node:test';
import assert from 'node:assert/strict';
import {createReactions,cueFor,bubbleLayout,drawReactionBubbles} from '../isopoda/reactions.mjs';
const actor=(id=0,extra={})=>({id,role:id,x:190,y:215,posture:'normal',occlusion:0,moving:true,...extra});
const encounter={id:'meal',motion:'feed',actors:3,place:[190,215]};
const context=(time,extra={})=>({time,encounter,state:{},...extra});
test('one per individual, global cap, and stronger stimulus interrupts positive feedback',()=>{
 const r=createReactions(),group=Array.from({length:7},(_,i)=>actor(i,{posture:'feeding'}));
 for(let t=0;t<2;t+=.1){r.update(group,context(t));assert.ok(r.active.length<=3);assert.equal(new Set(r.active.map(b=>b.id)).size,r.active.length)}
 r.update(group,context(2,{reaction:{id:'lift',mode:'disturb',selected:[0,1],age:0}}));
 assert.equal(r.active.filter(b=>b.cue==='!!').length,0); // Urgent cues still stagger.
 for(const time of [2.05,2.22,2.35])r.update(group,context(time,{reaction:{id:'lift',mode:'disturb',selected:[0,1],age:time-2}}));
 assert.deepEqual(r.active.filter(b=>b.cue==='!!').map(b=>b.id),[0,1]);
 group.forEach(c=>c.posture='curled');
 r.update(group,context(2.4,{reaction:{id:'lift',mode:'disturb',selected:[0,1],age:.4}}));
 assert.equal(r.active.find(b=>b.id===0).cue,'!!');
 r.update(group,context(2.81,{reaction:{id:'lift',mode:'disturb',selected:[0,1],age:.81}}));
 r.update(group,context(3.0,{reaction:{id:'lift',mode:'disturb',selected:[0,1],age:1}}));
 assert.equal(r.active.find(b=>b.id===0).cue,'◎');
});
test('stable actions do not loop bubbles, scene reset clears everything, feeding is staggered',()=>{
 const r=createReactions(),group=[actor(0,{posture:'feeding'}),actor(1,{posture:'feeding'})];
 r.update(group,context(0));r.update(group,context(.2));assert.equal(r.active.length,1);
 r.update(group,context(.6));assert.equal(r.active.length,2);
 r.update(group,context(3));assert.equal(r.active.length,0);
 r.update(group,context(8));assert.equal(r.active.length,0);
 r.reset();assert.equal(r.active.length,0);r.update(group,context(0));r.update(group,context(.2));assert.equal(r.active.length,1);
});
test('cues require actual posture; shell feeding never gets a heart, quiet routes stay quiet',()=>{
 const c=actor();assert.equal(cueFor(c,[c],encounter,{}),'?');c.posture='feeding';assert.equal(cueFor(c,[c],encounter,{}),'♡');
 assert.equal(cueFor(c,[c],{...encounter,motion:'shell'},{}),'…');
 c.posture='turning';for(const motion of ['orbit','disperse','parallel'])assert.equal(cueFor(c,[c],{...encounter,motion},{}),null);
 c.posture='probing';assert.equal(cueFor(c,[c],{...encounter,motion:'contact'},{}),'…');
 assert.equal(cueFor(c,[c,actor(1,{x:210,posture:'probing'})],{...encounter,motion:'contact'},{}),'!');
});
test('long rest waits; molt uses a longer duration',()=>{
 const r=createReactions(),c=actor(0,{posture:'resting'});r.update([c],context(0));r.update([c],context(1.3));assert.equal(r.active.length,0);r.update([c],context(1.5));assert.equal(r.active[0].cue,'…');
 r.reset();c.posture='molting';r.update([c],context(0));r.update([c],context(.2));assert.equal(r.active[0].until,2.1);
});
test('bubble and shadow stay inside camera edges, snap to scene lattice, reduced motion retains cue',()=>{
 const b={cue:'!!',start:0},view={sx:80,sy:100,sw:160,sh:160};
 for(const x of [84,160,236])for(const y of [104,180,256]){
  const c=actor(0,{x,y}),r=bubbleLayout(c,b,1,view);assert.ok(r);assert.ok(r.x*2>=view.sx);assert.ok((r.x+r.w+1)*2<=view.sx+view.sw);assert.ok((r.y-3)*2>=view.sy);assert.ok((r.y+r.h+4)*2<=view.sy+view.sh);
  const cells=[];drawReactionBubbles({fillRect:(...v)=>cells.push(v)},[{...b,id:0}],[c],1,view,true);
  assert.ok(cells.length);assert.ok(cells.every(v=>v.every(n=>n%2===0)));
 }
 assert.equal(bubbleLayout(actor(0,{x:20}),b,1,view),null);
 assert.deepEqual(bubbleLayout(actor(),b,0,view,true),bubbleLayout(actor(),b,1,view,true));
});

test('all encounters and player actions keep bounded cues without mutating simulation',async()=>{
 const {ENCOUNTERS,responseMode}=await import('../isopoda/encounters.mjs');
 const {makeIndividuals,stageIndividuals,stepIndividuals}=await import('../isopoda/behaviors.mjs');
 const {createRun}=await import('../isopoda/engine.mjs');
 const {changeEnvironment}=await import('../isopoda/environment.mjs?v=forest-10');
 const {actionFocus}=await import('../isopoda/reactions.mjs');
 const observed=new Set();
 for(const e of ENCOUNTERS)for(const action of [null,'mist','wet-left','food','leaf','gap','flat','lift','wet-all','remove']){
  const state=createRun('dairy',42),group=makeIndividuals(state.cohort),r=createReactions();stageIndividuals(group,e,{initial:true});
  if(action)changeEnvironment(state,action);
  const point=actionFocus(action,state,e),selected=[...group].sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y)).slice(0,2).map(c=>c.id);
  for(let tick=0;tick<300;tick++){
   const time=tick*.1,reaction=action&&time<10?{id:action,mode:responseMode(action),selected,age:time}:null;
   stepIndividuals(group,{encounter:e,state,time,dt:.1,reaction});
   const before=JSON.stringify([group,state]);r.update(group,{encounter:e,state,time,reaction});assert.equal(JSON.stringify([group,state]),before);
   assert.ok(r.active.length<=3);for(const b of r.active){assert.ok(group.some(c=>c.id===b.id));assert.ok(b.until>time);observed.add(b.cue)}
  }
 }
 assert.deepEqual([...observed].sort(),['!','!!','?','~','…','◎','♡','*','z'].sort());
});

test('sand hides ordinary cues but a language burst reaches hidden individuals',()=>{
 const r=createReactions(),group=[actor(0,{hidden:true,sand:{depth:1}}),actor(1)],view={sx:0,sy:0,sw:384,sh:430};
 let cells=[];const ctx={fillRect:(...v)=>cells.push(v)};
 r.notify(group[0],'?',0);drawReactionBubbles(ctx,r.active,group,.1,view);assert.equal(cells.length,0);
 r.burst(group,'♡',0);r.update(group,context(.1));assert.equal(r.active.length,2);
 drawReactionBubbles(ctx,r.active,[group[0]],.1,view);assert.ok(cells.length);
 group[0].hidden=false;r.notify(group[0],'!',.2);assert.equal(r.active.find(b=>b.id===0).cue,'!');
 r.update(group,context(2));assert.ok(!r.active.some(b=>b.id===0&&b.cue==='!'));
});

test('beach ambient bubbles are sparse and varied without hiding the language burst',()=>{
 const r=createReactions(),group=Array.from({length:7},(_,id)=>actor(id,{sand:{mode:'surface'}})),seen=new Set(),cues=new Set(),last=new Map();let globalLast=-Infinity,starts=0;
 for(let tick=0;tick<6000;tick++){
  const time=tick*.1;r.update(group,context(time,{encounter:null,state:{habitatId:'sandy-surf'}}));assert.ok(r.active.length<=1);
  for(const b of r.active){const key=b.id+':'+b.start;if(seen.has(key))continue;seen.add(key);cues.add(b.cue);assert.ok(b.start-globalLast>=5);assert.ok(b.start-(last.get(b.id)??-Infinity)>=18);last.set(b.id,b.start);globalLast=b.start;starts++}
 }
 assert.ok(starts>5&&starts<100);
 assert.ok(cues.size>=5);
 r.burst(group,'♡',601);r.update(group,context(601.1,{encounter:null,state:{habitatId:'sandy-surf'}}));assert.equal(r.active.length,7);
});
