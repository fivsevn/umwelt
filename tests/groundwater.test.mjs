import {GROUNDWATER_LAYOUT} from '../isopoda/scenery/authored-layouts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,ensureScene,choose,advance,migrateV4,validRun} from '../isopoda/engine.mjs';
import {GROUNDWATER_OBSERVATIONS as GROUNDWATER_PULSES,groundwaterProgress} from '../isopoda/data/habitats/groundwater-observation.mjs';
import {makeIndividuals} from '../isopoda/behaviors.mjs';
import {stageGroundwater,stepGroundwater,CAVE_WET_PATCHES} from '../isopoda/scenery/groundwater.mjs';
import {AQUATIC_ENDINGS} from '../isopoda/aquatic-story.mjs';
import {gameText} from '../isopoda/locales/game.mjs';

const metrics=[[32,36,8],[74,78,10],[82,66,78],[38,24,42]];
test('all 6561 groundwater choice paths finish in eight untimed observations and survive reload',()=>{
 for(let path=0;path<6561;path++){
  let s=createRun('cavaticus',37,'groundwater'),code=path;
  const counts={body:0,medium:0,limit:0};
  for(let turn=0;turn<8;turn++){
   assert.equal(s.stage,'choice');
   const scene=ensureScene(s);
   assert.equal(scene.kind,'groundwater-pulse');assert.equal(scene.observationIndex,turn);
   assert.deepEqual([s.connectivity,s.seepage,s.input],metrics[Math.floor(turn/2)]);
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
  keys.push(`groundwater:observation:${i}:name`,`groundwater:observation:${i}:prompt`);
  for(const j of pulse.options.keys())for(const field of ['label','text'])keys.push(`groundwater:observation:${i}:option:${j}:${field}`);
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


test('old four-round cave saves retain feedback and progress into the expanded sequence',()=>{
 const old=createRun('cavaticus',15,'groundwater');old.cohort=old.cohort.slice(0,7);old.stage='feedback';old.feedback='groundwater:pulse:1:option:0:text';old.scene={kind:'groundwater-pulse',pulseIndex:1};old.records=[{kind:'groundwater-pulse',choice:'mark-entrance'},{kind:'groundwater-pulse',choice:'connect-marks'}];
 const saved=structuredClone(old),restored=migrateV4(old);assert.deepEqual(old,saved);assert.ok(validRun(restored));assert.equal(restored.cohort.length,14);assert.equal(restored.feedback,saved.feedback);assert.equal(groundwaterProgress(restored),4);assert.ok(advance(restored));assert.equal(ensureScene(restored).observationIndex,4);
});

test('cave animals keep moving gently on wet patches, including reduced-motion mode',()=>{
 for(const reduced of [false,true])for(let index=0;index<8;index++){
  const state=createRun('cavaticus',37,'groundwater');state.scene={observationIndex:index};const group=makeIndividuals(state.cohort);stageGroundwater(group,state);
  const films=GROUNDWATER_LAYOUT.objects.filter(o=>o.type==='seep-film-01');
  for(const a of group)assert.ok(films.some(o=>o.x===a.caveAnchor[0]&&o.y===a.caveAnchor[1]),'anchor follows an authored fissure');
  const initial=group.map(a=>[a.x,a.y]);let occluded=false,paused=false;
  for(let tick=0;tick<400;tick++){
   stepGroundwater(group,{state,dt:.1,reduced,speed:1});
   for(const a of group){assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y));assert.equal(a.activity==='swim',false);const angle=a.caveSite.angle||0,across=-(a.x-a.caveSite.x)*Math.sin(angle)+(a.y-a.caveSite.y)*Math.cos(angle);assert.ok(Math.abs(across)<=3*a.caveSite.scale+1e-8,'crawl follows rotated wet film');assert.ok(Math.hypot(a.x-a.caveAnchor[0],a.y-a.caveAnchor[1])<24);occluded||=a.occlusion>.5;paused||=!a.moving}
  }
  assert.ok(group.some((a,i)=>Math.hypot(a.x-initial[i][0],a.y-initial[i][1])>2));assert.ok(paused);if([1,7].includes(index))assert.ok(occluded);
 }
});

test('released cave animals choose the closest crack and crawl there without snapping back',async()=>{
 const {settleGroundwater}=await import('../isopoda/scenery/groundwater.mjs');
 const {holdIndividual}=await import('../isopoda/interaction.mjs');
 for(const reduced of [false,true]){
  const state=createRun('cavaticus',37,'groundwater'),group=makeIndividuals(state.cohort);stageGroundwater(group,state);
  const a=group[0],old=a.caveSite,target=GROUNDWATER_LAYOUT.objects.filter(o=>o.type==='seep-film-01').find(o=>Math.hypot(o.x-old.x,o.y-old.y)>100);
  a.x=target.x+8;a.y=target.y+6;const dropped=[a.x,a.y];settleGroundwater(a);holdIndividual(a,'recovering',800);
  assert.equal(a.caveSite.id,target.id);stepGroundwater(group,{state,dt:.1,reduced,speed:1});assert.deepEqual([a.x,a.y],dropped);
  for(let i=0;i<600;i++){const x=a.x,y=a.y,returning=a.caveDisplaced;stepGroundwater(group,{state,dt:.1,reduced,speed:1});assert.ok(Math.hypot(a.x-x,a.y-y)<=(returning?.701:1.1),'no release teleport');}
  assert.equal(a.caveSite.id,target.id);assert.ok(Math.hypot(a.x-target.x,a.y-target.y)<22);
  state.scene={observationIndex:1};stageGroundwater(group,state);assert.equal(a.caveSite.id,target.id,'next observation keeps the relocated refuge');
 }
});

test('torch motes stay inside the uneven light and drift independently of torch movement',async()=>{
 const {caveMotes,caveIllumination,drawCaveLight}=await import('../isopoda/scenery/cave-light.mjs');
 const beam={x:50,y:54,size:34},a=caveMotes(0,384,430,beam),b=caveMotes(7,384,430,beam);
 assert.ok(a.length&&b.length);assert.notDeepEqual(a,b);assert.ok(a.length>=8&&a.length<35,'visible but bounded light-only particles');
 for(const p of [...a,...b])assert.ok(Math.hypot((p.x-192)/65.28,(p.y-232.2)/65.28)<1.07);
 assert.notEqual(caveIllumination(.4,0),caveIllumination(-.4,0));assert.equal(caveIllumination(1.2,0),0);
 const calls=[],g={canvas:{width:384,height:430},clearRect(){},fillRect(...args){calls.push(args)},drawImage(){throw Error('light texture must not draw after lights out')}};
 drawCaveLight(g,{},beam,7,true);assert.equal(calls.length,1,'lights out paints only darkness, no bright motes');
});
