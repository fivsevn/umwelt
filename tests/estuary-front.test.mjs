import test from 'node:test';
import assert from 'node:assert/strict';
import {shoreMarineFraction,shoreLocalSalinity} from '../isopoda/data/habitats/shore-hydrology.mjs';
import {shoreLayout} from '../isopoda/scenery/estuary-shore.mjs';
test('marine influence advances on flood, retreats on ebb, and river input resists intrusion',()=>{
 for(const point of [0,1,2]){
  const coverage=(tide,rain=false)=>Array.from({length:96},(_,i)=>shoreMarineFraction(i*4,350,point,tide,rain)).reduce((a,b)=>a+b,0);
  assert.ok(coverage(1)>coverage(0));assert.ok(coverage(0)>coverage(2));assert.ok(coverage(2)>coverage(3));
  assert.ok(coverage(1,true)<coverage(1));
  assert.ok(shoreLocalSalinity(point,1,false)>=shoreLocalSalinity(point,3,false));
  const baseline=shoreLayout(point,0).objects;
  for(let tide=0;tide<4;tide++)for(const rain of [false,true])assert.deepEqual(shoreLayout(point,tide,rain).objects,baseline);
 }
 assert.ok(shoreLocalSalinity(1,1,false)>shoreLocalSalinity(1,1,true));
});

test('shore cohorts draw two or three taxa, allocate by habitat preference, and migrate without losing identities',async()=>{
 const {drawCohort}=await import('../isopoda/collection.mjs');const {createRun,migrateV4}=await import('../isopoda/engine.mjs');const {stepShore}=await import('../isopoda/scenery/estuary-shore.mjs');
 for(let seed=1;seed<=60;seed++){
  const cohort=drawCohort({unlocked:[],draws:seed},seed,'estuary');assert.equal(cohort.filter(c=>c.species!=='naigua').length,12);assert.ok([2,3].includes(new Set(cohort.filter(c=>c.species!=='naigua').map(c=>c.species)).size));
  const s=createRun(cohort[0].species,seed,'estuary');s.cohort=cohort;const actors=cohort.map(c=>({...c}));const seen=new Set();
  for(let point=0;point<3;point++){s.shorePoint=point;stepShore(actors,{state:s,time:0});const local=actors.filter(a=>!a.hidden);assert.ok(local.every(a=>point===0||!['carinata','ischiosetosa'].includes(a.species)));local.forEach(a=>seen.add(a.id));
   const start=local.map(a=>[a.x,a.y]);let moves=0,rests=0;for(let t=1;t<45;t++){stepShore(actors,{state:s,time:t});moves+=local.filter(a=>a.moving).length;rests+=local.filter(a=>!a.moving).length;}if(local.length){assert.ok(moves&&rests);assert.ok(local.some((a,i)=>Math.hypot(a.x-start[i][0],a.y-start[i][1])>1));}
  }assert.equal(seen.size,cohort.length);
  const old={...s,cohort:cohort.slice(0,7)},restored=migrateV4(old);assert.deepEqual(restored.cohort.slice(0,7),old.cohort);assert.equal(restored.cohort.length,12);
 }
});

test('river specialists stay riverward across tides, rain and legacy cohorts',async()=>{
 const {stepShore}=await import('../isopoda/scenery/estuary-shore.mjs');
 const {createRun}=await import('../isopoda/engine.mjs');
 for(const count of [7,12])for(let point=0;point<3;point++)for(let index=0;index<8;index++)for(const seed of [7,13]){
  const state=createRun('carinata',seed,'estuary');Object.assign(state,{shorePoint:point,records:Array.from({length:index},()=>({evidence:{version:2}}))});
  const actors=Array.from({length:count},(_,i)=>({species:i%2?'ischiosetosa':'carinata',seed:i}));
  for(const time of [0,20,80]){stepShore(actors,{state,time});assert.ok(actors.every(a=>point===0||a.hidden));}
 }
});
