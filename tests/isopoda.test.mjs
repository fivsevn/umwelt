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
   const scene=ensureScene(s);kinds.add(scene.kind);assert.ok(scene.text);assert.equal(scene.options.length,3);
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
test('six endings have explicit distinct triggers, without good/bad scoring',()=>{
 for(const [id,fields] of [['ordinary',{}],['visitor',{interventions:11}],['margin',{quiet:17}],['names',{labels:7}],['map',{maps:6}],['instrument',{care:5}]])assert.equal(endingFor({...createRun(),...fields}).id,id);
});
test('all six endings are reachable through actual legal choices',()=>{
 const reached=new Set();
 for(let seed=1;seed<=300;seed++)for(const goal of ['quiet','labels','maps','interventions','care','random']){
  const s=createRun('dairy',seed);
  for(let t=0;t<21;t++){
   const scene=ensureScene(s);let best=scene.options[hash(seed,t)%3];
   if(goal!=='random')for(const o of scene.options)if((o.delta[goal]||0)>(best.delta[goal]||0))best=o;
   choose(s,best.id);advance(s);
  }
  reached.add(s.ending);
 }
 assert.deepEqual([...reached].sort(),ENDINGS.map(e=>e.id).sort());
});
test('count tasks have exactly one matching answer and give an explicit correction',()=>{
 for(let seed=0;seed<50;seed++){const s=createRun('pink',seed);s.period=1;for(let day=1;day<=7;day++){s.day=day;s.scene=null;const scene=ensureScene(s);if(scene.kind!=='count')continue;assert.equal(scene.options.filter(o=>o.delta.accuracy===1).length,1);assert.ok(scene.options.some(o=>o.label===scene.count+' 只'));}}
});
test('legacy saves retain day and survive malformed input',()=>{
 assert.equal(migrateLegacy({day:5,moisture:2,leaves:1}).day,5);assert.ok(validRun(migrateLegacy(null)));assert.equal(validRun({day:99}),false);assert.equal(validRun(null),false);
});
