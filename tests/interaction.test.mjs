import test from 'node:test';
import assert from 'node:assert/strict';
import {holdIndividual,stepInteraction,placeIndividual,interactionConfig} from '../isopoda/interaction.mjs';
import {makeIndividuals,stepIndividuals} from '../isopoda/behaviors.mjs';
import {SPECIES,speciesById} from '../isopoda/species.mjs';
import {renderModel} from '../isopoda/sprites.mjs';
test('defense respects existing species visuals, repeated taps restart recovery',()=>{
 for(const {id:species} of SPECIES){
  const actor=makeIndividuals(1)[0];
  actor.model=renderModel(speciesById(species).visual);
  holdIndividual(actor,'defensive',2600);
  assert.equal(actor.posture,actor.model.visual.conglobation.ability==='full'?'curled':'tucked');
  assert.equal(stepInteraction(actor,2),true);
  holdIndividual(actor,'defensive',2600);
  assert.equal(stepInteraction(actor,2),true);
  assert.equal(stepInteraction(actor,.7),false);
 }
});
test('grabbed actors suspend AI and resume after release recovery; placement uses AI bounds',()=>{
 const group=makeIndividuals(3),actor=group[0];
 holdIndividual(actor,'grabbed');
 const position=[actor.x,actor.y,actor.a];
 for(let i=0;i<100;i++)stepIndividuals(group,{time:i,dt:.1});
 assert.deepEqual([actor.x,actor.y,actor.a],position);
 assert.equal(actor.moving,false);
 placeIndividual(actor,{x:-500,y:900});assert.deepEqual([actor.x,actor.y],[24,400]);
 holdIndividual(actor,'recovering',interactionConfig(actor).recoveryTime);
 for(let i=0;i<7;i++)stepIndividuals(group,{time:30,dt:.1});
 assert.deepEqual([actor.x,actor.y],[24,400]);
 for(let i=0;i<20;i++)stepIndividuals(group,{time:30,dt:.1});
 assert.equal(actor.interactionState,null);
 assert.notDeepEqual([actor.x,actor.y],[24,400]);
});
