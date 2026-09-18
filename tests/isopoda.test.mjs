import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES} from '../isopoda/species.mjs';
import {ENDINGS,MINI_TYPES} from '../isopoda/content.mjs';
import {createRun,ensureScene,choose,advance,validRun,migrateLegacy,endingFor,hash} from '../isopoda/engine.mjs';
test('all thirteen references have distinct skins and stable identifiers',()=>{
 assert.equal(SPECIES.length,13);assert.equal(new Set(SPECIES.map(s=>s.id)).size,13);
 assert.equal(new Set(SPECIES.map(s=>JSON.stringify(s.visual))).size,13);
 for(const p of SPECIES){assert.equal(p.notes.length,3);assert.ok(p.status.length>10)}
});
test('every species completes 21 turns across seeded branches; reload never duplicates a choice',()=>{
 const kinds=new Set(),endings=new Set();let choices=0;
 for(const p of SPECIES)for(let seed=1;seed<=40;seed++){
  let s=createRun(p.id,seed);assert.ok(validRun(s));
  for(let turn=0;turn<21;turn++){
   const scene=ensureScene(s);kinds.add(scene.kind);assert.ok(scene.text);assert.equal(scene.options.length,scene.kind==='route'?4:3);
   assert.equal(advance(s),false);assert.equal(choose(s,'missing'),false);
   // Exercise each offered option in an independent copy before choosing the run's branch.
   for(const o of scene.options){const copy=structuredClone(s);assert.equal(choose(copy,o.id),true);assert.ok(copy.feedback);assert.equal(copy.records.length,turn+1);choices++}
   const option=scene.options[hash(seed,turn)%3];assert.equal(choose(s,option.id),true);assert.equal(choose(s,option.id),false);
   s=JSON.parse(JSON.stringify(s));assert.ok(validRun(s));assert.equal(s.stage,'feedback');assert.equal(s.feedback,option.text);
   assert.equal(advance(s),true);assert.ok(s.humidity>=35&&s.humidity<=96);assert.ok(s.temp>=20&&s.temp<=27);
  }
  assert.equal(s.stage,'ended');assert.equal(s.records.length,21);assert.ok(ENDINGS.some(e=>e.id===s.ending));endings.add(s.ending);
  assert.equal(advance(s),false);assert.equal(choose(s,'wait'),false);
 }
 for(const k of MINI_TYPES)assert.ok(kinds.has(k));assert.ok(choices>30000);
});
test('fifteen endings form deterministic pools around observation styles, without good/bad scoring',()=>{
 assert.equal(ENDINGS.length,15);
 const families=[
  [{interventions:12},['visitor','hand']],
  [{quiet:12},['margin','stillness','shadow']],
  [{labels:6},['names','unnamed','grammar']],
  [{maps:5},['map','arrows','scale']],
  [{care:4},['instrument','gradient']],
  [{},['witness','ordinary']]
 ];
 const all=new Set();
 for(const [fields,ids] of families){const seen=new Set();for(let seed=1;seed<=240;seed++){const e=endingFor({...createRun('dairy',seed),...fields});assert.ok(ids.includes(e.id));assert.equal(endingFor({...createRun('dairy',seed),...fields}).id,e.id);seen.add(e.id);all.add(e.id)}assert.deepEqual([...seen].sort(),[...ids].sort())}
 assert.deepEqual([...all].sort(),ENDINGS.map(e=>e.id).sort());
 assert.ok(['visitor','hand'].includes(endingFor({...createRun('dairy',91),directMoves:2}).id));
});
test('legal seven-day play reaches multiple pooled ending families',()=>{
 const reached=new Set();
 for(let seed=1;seed<=300;seed++)for(const goal of ['quiet','labels','maps','interventions','care','random']){
  const s=createRun('dairy',seed);
  for(let t=0;t<21;t++){
   const scene=ensureScene(s);let best=scene.options[hash(seed,t)%Math.min(3,scene.options.length)];
   if(goal!=='random')for(const o of scene.options)if((o.delta[goal]||0)>(best.delta[goal]||0))best=o;
   choose(s,best.id);advance(s);
  }
  assert.ok(ENDINGS.some(e=>e.id===s.ending));reached.add(s.ending);
 }
 const groups=[['visitor','hand'],['margin','stillness','shadow'],['names','unnamed','grammar'],['map','arrows','scale'],['instrument','gradient'],['witness','ordinary']];
 assert.ok(groups.filter(group=>group.some(id=>reached.has(id))).length>=5,[...reached].join(','));
 assert.ok(reached.size>=8,[...reached].join(','));
});
test('new runs and pending legacy scenes never offer counting tasks',()=>{
 assert.ok(!MINI_TYPES.includes('count'));
 for(let seed=0;seed<50;seed++){const s=createRun('pink',seed);s.period=1;for(let day=1;day<=7;day++){s.day=day;s.scene=null;assert.notEqual(ensureScene(s).kind,'count')}}
 const old=createRun('pink',17);old.period=1;old.scene={kind:'count',count:3};assert.notEqual(ensureScene(old).kind,'count');assert.equal(old.day,1);assert.equal(old.period,1);
});
test('legacy saves retain day and survive malformed input',()=>{
 assert.equal(migrateLegacy({day:5,moisture:2,leaves:1}).day,5);assert.ok(validRun(migrateLegacy(null)));assert.equal(validRun({day:99}),false);assert.equal(validRun(null),false);
});
