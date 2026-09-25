import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,ensureScene,choose,advance,migrateV4,validRun} from '../isopoda/engine.mjs';
import {GROUNDWATER_PULSES} from '../isopoda/data/habitats/groundwater-pulse.mjs';
import {AQUATIC_ENDINGS} from '../isopoda/aquatic-story.mjs';
import {gameText} from '../isopoda/locales/game.mjs';

const metrics=[[32,55,8],[74,78,10],[82,66,78],[38,24,42]];
test('all 81 groundwater choice paths finish in four untimed pulses and survive reload',()=>{
 for(let path=0;path<81;path++){
  let s=createRun('cavaticus',37,'groundwater'),code=path;
  const counts={body:0,medium:0,limit:0};
  for(let turn=0;turn<4;turn++){
   assert.equal(s.stage,'choice');
   const scene=ensureScene(s);
   assert.equal(scene.kind,'groundwater-pulse');assert.equal(scene.pulseIndex,turn);
   assert.deepEqual([s.connectivity,s.seepage,s.input],metrics[turn]);
   assert.equal(scene.options.length,3);
   const option=scene.options[code%3];code=Math.floor(code/3);counts[option.lens]++;
   assert.ok(choose(s,option.id));assert.equal(s.records.length,turn+1);
   assert.equal(s.records.at(-1).lens,option.lens);
   const saved=JSON.parse(JSON.stringify(s));s=migrateV4(saved);
   assert.ok(validRun(s));assert.equal(s.stage,'feedback');assert.equal(s.feedback,saved.feedback);
   assert.ok(advance(s));assert.equal(s.day,1);assert.equal(s.period,0);
   s=migrateV4(JSON.parse(JSON.stringify(s)));assert.ok(validRun(s));
  }
  assert.equal(s.stage,'ended');
  const max=Math.max(...Object.values(counts));
  assert.equal(s.ending,'groundwater-'+['medium','limit','body'].find(lens=>counts[lens]===max));
 }
});

test('groundwater pulse prompts, choices and endings resolve in every language',()=>{
 const keys=[];
 for(const [i,pulse] of GROUNDWATER_PULSES.entries()){
  keys.push(`groundwater:pulse:${i}:name`,`groundwater:pulse:${i}:prompt`);
  for(const j of pulse.options.keys())for(const field of ['label','text'])keys.push(`groundwater:pulse:${i}:option:${j}:${field}`);
 }
 for(const ending of AQUATIC_ENDINGS.filter(e=>['groundwater-body','groundwater-medium','groundwater-limit'].includes(e.id)))keys.push(ending.title,ending.body,ending.line);
 for(const key of keys)for(const lang of ['zh','en','ja','isopod']){
  const text=gameText(key,lang);assert.ok(text,key);assert.notEqual(text,key,`${lang}: ${key}`);
 }
});

test('obsolete generic water choices are rejected without advancing a cave observation',()=>{
 const s=createRun('cavaticus',37,'groundwater');ensureScene(s);
 for(const id of ['water-adjust','water-wait','water-record']){
  assert.equal(choose(s,id),false);assert.equal(advance(s),false);
  assert.equal(s.stage,'choice');assert.equal(s.records.length,0);
 }
});
