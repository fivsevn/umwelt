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
    const scale=environmentScale(s,lang);if(scale){assert.match(scale.value,/\d/);assert.doesNotMatch(scale.value,/NaN|\d+\/\d+/);assert.ok(scale.label)}
   }
   choose(s,scene.options[0].id);advance(s);
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
