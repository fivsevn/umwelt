import test from 'node:test';
import assert from 'node:assert/strict';
import {HABITATS} from '../isopoda/habitats.mjs';
import {createRun,ensureScene,choose,advance,recordDirectInteraction} from '../isopoda/engine.mjs';
import {encounterById,encounterFor} from '../isopoda/encounters.mjs';
import {observationTitle,environmentScale} from '../isopoda/observation-header.mjs';
import {makeIndividuals} from '../isopoda/behaviors.mjs';
import {stageGroundwater,stepGroundwater} from '../isopoda/scenery/groundwater.mjs';
import {holdIndividual,placeIndividual} from '../isopoda/interaction.mjs';

test('every environment uses a localized story subtitle, never a turn counter',()=>{
 for(const habitat of HABITATS){
  const s=createRun(habitat.species?.[0]||'dairy',37,habitat.id),seen=new Set();
  while(s.stage!=='ended'){
   const scene=ensureScene(s),encounter=encounterById(scene.encounter)||(!habitat.aquatic?encounterFor(s):null);
   for(const lang of ['zh','en','ja','isopod']){
    const title=observationTitle(s,scene,encounter,lang);assert.ok(title?.length,habitat.id);assert.doesNotMatch(title,/^(water|groundwater|abyssal):|\d+\/\d+/);
    if(lang==='zh'){assert.ok(title.length<20,title);seen.add(title)}
    const scale=environmentScale(s,lang);if(scale){assert.match(scale.value,lang==='isopod'?/^[▁▂▃▄▅▆▇]+$/:/\d/);assert.doesNotMatch(scale.value,/NaN|\d+\/\d+/);assert.ok(scale.label)}
   }
   if(s.habitatId==='petri-dish')s.microscope={completed:{[(s.day-1)*3+s.period]:true}};choose(s,scene.options[0].id);advance(s);
  }
  assert.ok(seen.size>1,habitat.id);
 }
});
test('cave picking holds animals, release resumes continuously and all 14 IDs are recorded',()=>{
 const state=createRun('cavaticus',37,'groundwater'),group=makeIndividuals(state.cohort);ensureScene(state);stageGroundwater(group,state);
 const actor=group[13];holdIndividual(actor,'grabbed');placeIndividual(actor,{x:110,y:160});
 for(let i=0;i<10;i++)stepGroundwater(group,{state,dt:.1});
 assert.equal(actor.x,110);assert.equal(actor.y,160);assert.equal(actor.moving,false);
 holdIndividual(actor,'recovering',800);
 for(let i=0;i<7;i++)stepGroundwater(group,{state,dt:.1});
 assert.equal(actor.x,110);assert.equal(actor.y,160);
 let previous={x:actor.x,y:actor.y};for(let i=0;i<20;i++){
  stepGroundwater(group,{state,dt:.1});assert.ok(Math.hypot(actor.x-previous.x,actor.y-previous.y)<=.701);previous={x:actor.x,y:actor.y};
 }
 assert.ok(Math.hypot(actor.x-110,actor.y-160)>5);
 assert.equal(recordDirectInteraction(state,{type:'grab',specimen:'N'}).specimen,'N');
 assert.equal(recordDirectInteraction(state,{type:'grab',specimen:'Z'}).specimen,null);
});

test('cave elevation follows nearby observation points, not a monotonic turn counter',()=>{
 const s=createRun('cavaticus',37,'groundwater'),values=[];
 while(s.stage!=='ended'){const scene=ensureScene(s);values.push(Number(environmentScale(s).value.match(/[0-9.]+/)[0]));choose(s,scene.options[0].id);advance(s)}
 assert.ok(new Set(values).size>3);assert.ok(Math.max(...values)-Math.min(...values)<2);
 assert.ok(values.some((v,i)=>i&&v<values[i-1]));assert.ok(values.some((v,i)=>i&&v>values[i-1]));
});

test('cave notebook prose is distinct from scientific morphology records in every language',async()=>{
 const {localizedAnnotationLines}=await import('../isopoda/locales/annotations.mjs');
 const {speciesById}=await import('../isopoda/species-registry.mjs');
 for(const id of ['cavaticus','lusitanicus','virei','valdensis']){
  const species=speciesById(id),facts=species.literature.lines;
  assert.equal(facts.length,2);
  for(const lang of ['zh','en','ja','isopod']){
   const prose=localizedAnnotationLines(species,lang,facts);
   assert.equal(prose.length,2);assert.notDeepEqual(prose,facts);assert.ok(prose.every(line=>line.length>0));
   assert.doesNotMatch(prose.join(' '),/4\.2|Asellidae|sedimentary biofilm|微生物|分类|研究/);
  }
 }
});
