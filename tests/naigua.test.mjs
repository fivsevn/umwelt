import test from 'node:test';
import assert from 'node:assert/strict';
import {addRareSpecimens} from '../isopoda/rare-specimens.mjs';
import {drawCohort,restoreCollection} from '../isopoda/collection.mjs';
import {createRun,validRun,migrateV4,recordDirectInteraction} from '../isopoda/engine.mjs';
import {HABITATS} from '../isopoda/habitats.mjs';
import {speciesById} from '../isopoda/species-registry.mjs';
import {renderModel,pixelAnatomy} from '../isopoda/sprites.mjs';
import {makeIndividuals} from '../isopoda/behaviors.mjs';
import {holdIndividual,stepInteraction} from '../isopoda/interaction.mjs';
test('rare naigua are ordinary persistent specimens, capped at two and excluded from deep sea and cabinet draws',()=>{
 let encounters=0;const counts=new Set();
 for(let seed=0;seed<10000;seed++){
  const cohort=addRareSpecimens([],seed,'terrestrial');if(cohort.length){encounters++;counts.add(cohort.length)}
  assert.ok(cohort.length<=2);assert.deepEqual(cohort,addRareSpecimens([],seed,'terrestrial'));assert.deepEqual(addRareSpecimens([],seed,'abyssal'),[]);
 }
 assert.ok(encounters>650&&encounters<950);assert.deepEqual([...counts].sort(),[1,2]);
 const seed=Array.from({length:1000},(_,i)=>i).find(seed=>addRareSpecimens([],seed,'terrestrial').length===2);
 for(const h of HABITATS){
  const cohort=drawCohort({unlocked:[],draws:0},seed,h.id),s=createRun(cohort[0].species,seed,h.id);s.cohort=cohort;
  assert.equal(cohort.filter(c=>c.species==='naigua').length,['abyssal','petri-dish'].includes(h.id)?0:2);
  assert.ok(validRun(s),h.id);assert.deepEqual(migrateV4(JSON.parse(JSON.stringify(s))).cohort,cohort);
  const restored=restoreCollection(null,s);assert.equal(restored.unlocked.includes('naigua'),!['abyssal','petri-dish'].includes(h.id));
  if(!['abyssal','petri-dish'].includes(h.id)){recordDirectInteraction(s,{type:'tap',specimen:cohort.at(-1).id,point:{x:100,y:100}});assert.equal(s.directRecords.at(-1).specimen,cohort.at(-1).id);s.cohort.push(...Array.from({length:3},(_,i)=>({...cohort.at(-1),id:String.fromCharCode(65+cohort.length+i)})));assert.equal(validRun(s),false)}
 }
});
test('same morphology renderer and interaction state machine retain widely spaced eyes in both poses',()=>{
 const species=speciesById('naigua'),model=renderModel(species.visual,{stage:'L',seed:12});
 for(const posture of ['normal','curled']){
  const parts=pixelAnatomy(model,{posture});assert.equal(parts.filter(p=>/^p[1-7]$/.test(p.region)).length,7);
  const eyes=parts.flatMap(p=>p.cells).filter(c=>c[2]===species.visual.cephalon.eyeWhite);
  const axis=posture==='curled'?0:1,above=eyes.filter(c=>c[axis]<0),below=eyes.filter(c=>c[axis]>0);assert.ok(above.length>10&&below.length>10);
  assert.ok(Math.min(...below.map(c=>c[axis]))-Math.max(...above.map(c=>c[axis]))>=(posture==='curled'?10:4));
 }
 const actor=makeIndividuals([{id:'A',species:'naigua',seed:12,stage:'L'}])[0];actor.model=model;
 holdIndividual(actor,'defensive',2600);assert.equal(actor.posture,'curled');assert.ok(stepInteraction(actor,1));assert.equal(stepInteraction(actor,2),false);
 const other=speciesById('orange');assert.ok(pixelAnatomy(renderModel(other.visual),{posture:'curled'}).every(p=>p.region!=='cephalon'));
});

test('seven misses guarantee exactly one on the next outdoor non-abyssal draw, repeatably and across reloads',async()=>{
 const {recordNaiguaDraw}=await import('../isopoda/rare-specimens.mjs');
 const seed=Array.from({length:1000},(_,i)=>i).find(seed=>addRareSpecimens([],seed,'terrestrial').length===0);
 let collection=restoreCollection(null,null);
 for(let cycle=0;cycle<2;cycle++){
  for(let i=0;i<7;i++){
   const h=['terrestrial','freshwater','abyssal','groundwater','estuary','shallow-marine','intertidal'][i];
   const cohort=drawCohort(collection,seed,h);assert.equal(cohort.some(c=>c.species==='naigua'),false);
   recordNaiguaDraw(collection,cohort);collection=restoreCollection(JSON.parse(JSON.stringify(collection)),null);assert.equal(collection.naiguaMisses,i+1);
  }
  const deep=drawCohort(collection,seed,'abyssal');assert.equal(deep.some(c=>c.species==='naigua'),false);recordNaiguaDraw(collection,deep);assert.equal(collection.naiguaMisses,7);
  const dish=drawCohort(collection,seed,'petri-dish');assert.equal(dish.some(c=>c.species==='naigua'),false);assert.equal(collection.naiguaMisses,7);
  const cohort=drawCohort(collection,seed,'freshwater');assert.equal(cohort.filter(c=>c.species==='naigua').length,1);recordNaiguaDraw(collection,cohort);assert.equal(collection.naiguaMisses,0);
 }
 const lucky=Array.from({length:1000},(_,i)=>i).find(seed=>addRareSpecimens([],seed,'terrestrial').length===2);
 collection.naiguaMisses=4;recordNaiguaDraw(collection,drawCohort(collection,lucky,'terrestrial'));assert.equal(collection.naiguaMisses,0);
 assert.equal(addRareSpecimens([],lucky,'terrestrial',7).length,1);
});

test('terrestrial replacement keeps seven slots and inherits local ecology without changing morphology',async()=>{
 const {normalizeNaiguaCohort}=await import('../isopoda/rare-specimens.mjs');
 const base=createRun('orange',18).cohort,cohort=addRareSpecimens(base,18,'terrestrial',7);
 assert.equal(cohort.length,7);assert.deepEqual(cohort.map(c=>c.id),base.map(c=>c.id));assert.equal(cohort.filter(c=>c.species==='naigua').length,1);assert.equal(cohort.find(c=>c.species==='naigua').ecologySpecies,'orange');
 const index=cohort.findIndex(c=>c.species==='naigua'),a=makeIndividuals(cohort)[index],b=makeIndividuals(base)[index];assert.equal(a.speed,b.speed);assert.deepEqual(a.locomotion,b.locomotion);
 const old=[...base,{id:'H',species:'naigua',seed:8,stage:'L'},{id:'I',species:'naigua',seed:9,stage:'L'}];
 const fixed=normalizeNaiguaCohort(old,'terrestrial',true);assert.equal(fixed.length,7);assert.equal(fixed.filter(c=>c.species==='naigua').length,2);assert.deepEqual(fixed.map(c=>c.id),base.map(c=>c.id));
 assert.equal(normalizeNaiguaCohort(old,'terrestrial',false).length,9);
 assert.equal(addRareSpecimens([{id:'A',species:'naigua',seed:1,stage:'L'}],18,'petri-dish')[0].ecologySpecies,'uniramea');
});
test('unfolded naigua uses ducky anatomy while its single size retains the approved adult face',()=>{
 const v=speciesById('naigua').visual,duck=speciesById('ducky').visual;
 assert.deepEqual({...v.body,confidence:undefined},{...duck.body,confidence:undefined});
 for(const key of ['pereon','pleon','pleotelson','uropods','antennae','legs','surface']){
  const clean=value=>JSON.parse(JSON.stringify(value,(key,value)=>['confidence','template'].includes(key)?undefined:value));
  assert.deepEqual(clean(v[key]),clean(duck[key]),key);
 }
 assert.equal(v.conglobation.rolledWidth,1.05);
 const adult=renderModel(v,{stage:'L',seed:12});
 assert.deepEqual(adult.growth,duck.stageProfiles.adult);
 for(const stage of ['S','M','L','juvenile','subadult','adult']){
  const model=renderModel(v,{stage,seed:12});
  assert.deepEqual(model.growth,adult.growth);
  for(const posture of ['normal','curled'])assert.deepEqual(pixelAnatomy(model,{posture}),pixelAnatomy(adult,{posture}));
 }
});

test('guaranteed terrestrial naigua can occupy every arrival slot and remains stable on reload',()=>{
 const base=createRun('orange',18).cohort,positions=new Set();
 for(let seed=0;seed<100;seed++){
  const cohort=addRareSpecimens(base,seed,'terrestrial',7);
  positions.add(cohort.findIndex(c=>c.species==='naigua'));
  assert.equal(cohort.filter(c=>c.species==='naigua').length,1);
  assert.deepEqual(cohort.map(c=>c.id),base.map(c=>c.id));
  assert.deepEqual(cohort,addRareSpecimens(base,seed,'terrestrial',7));
  assert.deepEqual(cohort,addRareSpecimens(JSON.parse(JSON.stringify(cohort)),seed,'terrestrial',7));
 }
 assert.deepEqual([...positions].sort(),[0,1,2,3,4,5,6]);
});

test('cabinet draws never inject Naigua at random or at the guarantee threshold',()=>{
 const base=createRun('dairy',18,'petri-dish').cohort;
 for(const misses of [0,6,7,99])for(let seed=0;seed<1000;seed++)assert.deepEqual(addRareSpecimens(base,seed,'petri-dish',misses),base);
 const selected=createRun('naigua',18,'petri-dish');
 assert.equal(addRareSpecimens(selected.cohort,18,'petri-dish',7).length,1);
 assert.equal(addRareSpecimens(selected.cohort,18,'petri-dish',7)[0].species,'naigua');
});
test('old cabinet visitors are removed while selection, notes and progress survive reload',()=>{
 for(const arrivalPending of [true,false]){
  const saved=createRun('dairy',18,'petri-dish');saved.arrivalPending=arrivalPending;saved.day=2;saved.records=[{kind:'test-preserved-note',text:'existing observation'}];
  saved.cohort.push({id:'B',species:'naigua',seed:19,stage:'L'},{id:'C',species:'naigua',seed:20,stage:'L'});
  assert.equal(validRun(saved),false);
  const restored=migrateV4(saved);assert.ok(validRun(restored));assert.deepEqual(restored.cohort,[saved.cohort[0]]);
  assert.equal(restored.day,2);assert.equal(restored.arrivalPending,arrivalPending);assert.deepEqual(restored.records,saved.records);
  assert.equal(saved.cohort.length,3,'migration does not mutate the input');
 }
 const selected=migrateV4(createRun('naigua',18,'petri-dish'));assert.equal(selected.cohort[0].species,'naigua');assert.ok(validRun(selected));
});
