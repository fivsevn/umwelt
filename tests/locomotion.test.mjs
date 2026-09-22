import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES} from '../isopoda/species-registry.mjs';
import {LOCOMOTION_SOURCES,validateLocomotionProfile,locomotionSourceIds} from '../isopoda/locomotion.mjs';
import {sources as PUBLIC_SOURCES} from '../isopoda/sources-registry.mjs';
import {makeIndividuals} from '../isopoda/behaviors.mjs';
import {stepAquatic} from '../isopoda/scenery/aquatic.mjs';
import {createRun} from '../isopoda/engine.mjs';

test('every registry species has a validated hidden locomotion profile',()=>{
 for(const species of SPECIES){
  const p=species.locomotion;
  assert.equal(p.hidden,true,species.id);
  assert.equal(p.provenance.public,false,species.id);
  assert.deepEqual(validateLocomotionProfile(p),[],species.id);
  assert.equal(species.speed,p.simulation.cruise,species.id);
  assert.ok(Array.isArray(p.simulation.tags)&&p.simulation.tags.length,species.id);
  assert.ok(['aquatic','terrestrial'].includes(p.domain),species.id);
 }
});

test('locomotion evidence registry stays backend-only and all cited ids resolve',()=>{
 const ids=new Set(LOCOMOTION_SOURCES.map(s=>s.id));
 assert.equal(ids.size,LOCOMOTION_SOURCES.length);
 for(const source of LOCOMOTION_SOURCES){
  assert.ok(source.title&&source.url&&source.supports.length);
  assert.ok(!PUBLIC_SOURCES.some(publicSource=>publicSource.id===source.id),source.id);
 }
 for(const species of SPECIES)for(const id of locomotionSourceIds(species.locomotion))assert.ok(ids.has(id),species.id+':'+id);
});

test('direct evidence, transfer evidence and proxies remain distinguishable',()=>{
 const by=id=>SPECIES.find(s=>s.id===id).locomotion.research;
 assert.equal(by('asellus').basis,'direct_measurement');
 assert.equal(by('granulosa').basis,'direct_measurement');
 assert.equal(by('aquaticus').basis,'direct_qualitative');
 assert.equal(by('dairy').basis,'reference_taxon_transfer');
 assert.equal(by('meridianus').basis,'related_taxon_transfer');
 assert.equal(by('cappuccino').basis,'game_proxy');
 assert.equal(by('asellus').measurements[0].unit,'mm/s');
 assert.equal(by('granulosa').measurements[0].unit,'percent');
});

test('individual variation preserves species pace and structured simulation fields',()=>{
 const slowSpecies=SPECIES.find(s=>s.id==='vex'),fastSpecies=SPECIES.find(s=>s.id==='dairy');
 const slow=makeIndividuals([{id:'A',species:slowSpecies.id,seed:101,stage:'M'}])[0];
 const fast=makeIndividuals([{id:'A',species:fastSpecies.id,seed:101,stage:'M'}])[0];
 assert.ok(fast.speed>slow.speed);
 assert.equal(fast.locomotion,fastSpecies.locomotion.simulation);
 assert.ok(fast.locomotion.burst>1);
});

test('aquatic animation consumes cruise and per-mode scales',()=>{
 const state=createRun('aquaticus',5,'freshwater');
 const actor=(speed,modeScale)=>({id:0,offset:0,x:180,y:220,a:0,phase:0,speed,locomotion:{modeScale:{crawl:modeScale,cling:.4,swim:1,drift:.6}},interactionState:null,activity:'crawl',hidden:false,occlusion:0,posture:'normal',molt:'none',moving:true});
 const slow=actor(.68,.7),fast=actor(.68,1.3);
 stepAquatic([slow],{state,time:0,dt:.1,reduced:false});
 stepAquatic([fast],{state,time:0,dt:.1,reduced:false});
 assert.ok(fast.x-180>slow.x-180);
});
