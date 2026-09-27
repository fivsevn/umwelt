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
test('rare naigua are ordinary persistent specimens, capped at two and excluded from deep sea',()=>{
 let encounters=0;const counts=new Set();
 for(let seed=0;seed<10000;seed++){
  const cohort=addRareSpecimens([],seed,'terrestrial');if(cohort.length){encounters++;counts.add(cohort.length)}
  assert.ok(cohort.length<=2);assert.deepEqual(cohort,addRareSpecimens([],seed,'terrestrial'));assert.deepEqual(addRareSpecimens([],seed,'abyssal'),[]);
 }
 assert.ok(encounters>650&&encounters<950);assert.deepEqual([...counts].sort(),[1,2]);
 const seed=Array.from({length:1000},(_,i)=>i).find(seed=>addRareSpecimens([],seed,'terrestrial').length===2);
 for(const h of HABITATS){
  const cohort=drawCohort({unlocked:[],draws:0},seed,h.id),s=createRun(cohort[0].species,seed,h.id);s.cohort=cohort;
  assert.equal(cohort.filter(c=>c.species==='naigua').length,h.id==='abyssal'?0:2);
  assert.ok(validRun(s),h.id);assert.deepEqual(migrateV4(JSON.parse(JSON.stringify(s))).cohort,cohort);
  const restored=restoreCollection(null,s);assert.equal(restored.unlocked.includes('naigua'),h.id!=='abyssal');
  if(h.id!=='abyssal'){recordDirectInteraction(s,{type:'tap',specimen:cohort.at(-1).id,point:{x:100,y:100}});assert.equal(s.directRecords.at(-1).specimen,cohort.at(-1).id);s.cohort.push({...cohort.at(-1),id:String.fromCharCode(65+cohort.length)});assert.equal(validRun(s),false)}
 }
});
test('same morphology renderer and interaction state machine retain widely spaced eyes in both poses',()=>{
 const species=speciesById('naigua'),model=renderModel(species.visual,{stage:'L',seed:12});
 for(const posture of ['normal','curled']){
  const parts=pixelAnatomy(model,{posture});assert.equal(parts.filter(p=>/^p[1-7]$/.test(p.region)).length,7);
  const eyes=parts.flatMap(p=>p.cells).filter(c=>c[2]===species.visual.cephalon.eyeWhite);
  const axis=posture==='curled'?0:1,above=eyes.filter(c=>c[axis]<0),below=eyes.filter(c=>c[axis]>0);assert.ok(above.length>10&&below.length>10);
  assert.ok(Math.min(...below.map(c=>c[axis]))-Math.max(...above.map(c=>c[axis]))>=10);
 }
 const actor=makeIndividuals([{id:'A',species:'naigua',seed:12,stage:'L'}])[0];actor.model=model;
 holdIndividual(actor,'defensive',2600);assert.equal(actor.posture,'curled');assert.ok(stepInteraction(actor,1));assert.equal(stepInteraction(actor,2),false);
 const other=speciesById('orange');assert.ok(pixelAnatomy(renderModel(other.visual),{posture:'curled'}).every(p=>p.region!=='cephalon'));
});

test('seven misses guarantee exactly one on the next non-abyssal draw, repeatably and across reloads',async()=>{
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
  const cohort=drawCohort(collection,seed,'petri-dish');assert.equal(cohort.filter(c=>c.species==='naigua').length,1);recordNaiguaDraw(collection,cohort);assert.equal(collection.naiguaMisses,0);
 }
 const lucky=Array.from({length:1000},(_,i)=>i).find(seed=>addRareSpecimens([],seed,'terrestrial').length===2);
 collection.naiguaMisses=4;recordNaiguaDraw(collection,drawCohort(collection,lucky,'terrestrial'));assert.equal(collection.naiguaMisses,0);
 assert.equal(addRareSpecimens([],lucky,'terrestrial',7).length,1);
});
