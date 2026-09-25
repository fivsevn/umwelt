import test from 'node:test';import assert from 'node:assert/strict';
import {microscope,checkMicroscope,petriReady,focusTarget,stepPetri,DISH} from '../isopoda/scenery/petri.mjs';
import {PETRI_STEPS,petriText,petriIndex} from '../isopoda/data/habitats/petri-observation.mjs';
import {createRun,ensureScene,choose,advance,migrateV4} from '../isopoda/engine.mjs';
import {makeIndividuals} from '../isopoda/behaviors.mjs';
import {habitatConfig} from '../isopoda/habitats.mjs';
import {drawCohort} from '../isopoda/collection.mjs';
test('dish always draws one small specimen and keeps it well inside the glass',()=>{
 for(const id of habitatConfig('petri-dish').species){const s=createRun(id,42,'petri-dish'),group=makeIndividuals(s.cohort);assert.equal(s.cohort.length,1);assert.equal(drawCohort({unlocked:[],draws:0},42,'petri-dish').length,1);assert.ok(habitatConfig(s).actorScale<1);
  group[0].x=-100;group[0].y=600;for(let n=0;n<12000;n++){stepPetri(group,{state:s,time:n*.1,dt:.1});assert.ok(Math.hypot(group[0].x-DISH.x,group[0].y-DISH.y)<=DISH.radius+.001)}
 }
});
test('microscope actions, not choices, unlock required observations and survive reload',()=>{
 const s=createRun('maculosa',42,'petri-dish');let steps=0;
 while(s.stage!=='ended'){
  const scene=ensureScene(s),m=microscope(s);if(scene.requirement)assert.equal(choose(s,'petri-note'),false);
  if(scene.requirement==='enter')m.mode=true;
  if(scene.requirement==='focus'){m.focus=50;checkMicroscope(s,false);assert.equal(petriReady(s),false)}
  if(scene.requirement==='zoom'){m.magnification=8;m.focus=focusTarget(m)}
  if(scene.requirement==='move')m.moves=3;
  if(scene.requirement==='light'){m.lights=1;m.light=55}
  if(scene.requirement==='widen')m.magnification=4;
  if(scene.requirement==='return')m.mode=false;
  checkMicroscope(s,true);assert.equal(petriReady(s),true);assert.equal(petriReady(migrateV4(s)),true);
  assert.ok(choose(s,'petri-note'));assert.ok(advance(s));steps++;
 }assert.equal(steps,9);assert.equal(s.ending,'petri-dish-observed');
});
test('all microscope prompts and records are localized without a named narrator',()=>{
 for(let i=0;i<9;i++)for(let j=0;j<6;j++)for(const lang of ['zh','en','ja','isopod']){const key=`petri:${i}:${j}`,text=petriText(key,lang);assert.notEqual(text,key);assert.doesNotMatch(text,/阿西莫夫|Asimov|アシモフ/)}
 for(const [,gate] of PETRI_STEPS)if(gate)for(const lang of ['zh','en','ja','isopod'])assert.notEqual(petriText('petri:gate:'+gate,lang),'petri:gate:'+gate);
});
