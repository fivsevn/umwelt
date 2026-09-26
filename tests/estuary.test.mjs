import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun as createCurrentRun,ensureScene,choose,advance,migrateV4,validRun} from '../isopoda/engine.mjs';
import {habitatConfig} from '../isopoda/habitats.mjs';
import {aquaticText,AQUATIC_ENDINGS} from '../isopoda/aquatic-story.mjs';
import {TEXT_CATALOG,ESTUARY_NODES,ESTUARY_KIND,estuaryRecords,estuaryIndex,estuarySummary,estuaryRecordLine,estuaryInstrument} from '../isopoda/data/narrative/estuary.mjs';
import {ESTUARY_STAGE_LAYOUTS,ESTUARY_ANCHORS,estuaryStageFilename,estuaryPoint,validateEstuaryLayout} from '../isopoda/scenery/estuary-stages.mjs';
import {stepEstuary,drawEstuaryEvidence} from '../isopoda/scenery/estuary.mjs';
import {importScene,exportScene,shareCode} from '../isopoda/scene-codec.mjs';

const createRun=(...args)=>{const s=createCurrentRun(...args);delete s.estuaryShoreVersion;return s};
const reload=s=>migrateV4(JSON.parse(JSON.stringify(s)));
const physical=s=>['salinity','flow','oxygen','cover','light','detritus','tide','algae'].map(k=>s[k]);

test('all 729 estuary paths preserve evidence, physics, reloads and exactly six turns',()=>{
 for(let code=0;code<3**6;code++){
  let s=createRun('hookeri',57,'estuary'),digits=code;
  assert.equal(habitatConfig(s).turns,6);
  for(let i=0;i<6;i++){
   const scene=ensureScene(s),choice=digits%3;digits=Math.floor(digits/3);
   assert.equal(scene.estuaryNode,ESTUARY_NODES[i].id);assert.equal(scene.options.length,3);
   assert.equal(estuaryIndex(s),i);
   assert.equal(s.salinity,ESTUARY_NODES[i].samples[0]);
   s=reload(s);assert.ok(s&&validRun(s));
   const before=physical(s),options=ensureScene(s).options;
   assert.equal(choose(s,options[choice].id),true);assert.deepEqual(physical(s),before);
   assert.equal(choose(s,options[choice].id),false);
   const record=estuaryRecords(s).at(-1),e=record.evidence;
   assert.equal(record.kind,ESTUARY_KIND);assert.equal(record.observationIndex,i);
   assert.deepEqual([!!e.origin,!!e.track,!!e.pair],[choice===0,choice===1,choice===2]);
   if(e.track){
    const previous=s.records.at(-2)?.evidence?.track;
    assert.equal(e.track.continuous,i===0||!!previous&&!previous.lost);
    assert.equal(e.track.lost,i===3);
    if(i>0&&previous&&!previous.lost)assert.equal(e.track.token,previous.token);
   }
   for(const lang of ['zh','en','ja','isopod']){
    assert.ok(estuaryRecordLine(record,lang));assert.ok(!estuaryRecordLine(record,lang).includes('{a}'));
    assert.equal(estuaryInstrument(s,lang).length,3);
   }
   const feedback=s.feedback;s=reload(s);assert.equal(s.feedback,feedback);assert.equal(estuaryIndex(s),i);
   assert.equal(advance(s),true);assert.ok(validRun(s));
  }
  assert.equal(s.stage,'ended');assert.equal(s.ending,'estuary-notebook');assert.equal(s.records.length,6);
  assert.equal(advance(s),false);assert.deepEqual(reload(s).records,s.records);
  assert.equal(estuarySummary(s.records,'en').split('\n\n').length,7);
 }
});

test('legacy nine-turn estuary saves retain their original decoder, feedback and endings',()=>{
 let s=createRun('hookeri',99,'estuary');delete s.estuaryVersion;s.estuaryLegacy=true;
 Object.assign(s,habitatConfig(s).defaults);ensureScene(s);
 for(let turn=0;turn<9;turn++){
  const old=JSON.parse(JSON.stringify(s));delete old.estuaryLegacy;
  s=migrateV4(old);assert.ok(s);assert.equal(habitatConfig(s).days,3);assert.equal(s.estuaryLegacy,true);
  const scene=ensureScene(s);assert.notEqual(scene.kind,ESTUARY_KIND);
  choose(s,scene.options[0].id);const feedback=s.feedback;
  const inFeedback=JSON.parse(JSON.stringify(s));delete inFeedback.estuaryLegacy;
  s=migrateV4(inFeedback);assert.equal(s.feedback,feedback);advance(s);
 }
 assert.equal(s.stage,'ended');assert.ok(['estuary-calm','estuary-care','estuary-trace'].includes(s.ending));
 assert.equal(reload(s).ending,s.ending);assert.equal(s.records.length,9);
});

test('named narrative keys and ending resolve in all four presentation languages',()=>{
 const keys=new Set();assert.ok(AQUATIC_ENDINGS.some(e=>e.id==='estuary-notebook'));
 for(const row of TEXT_CATALOG){
  assert.ok(!keys.has(row.key));keys.add(row.key);
  for(const lang of ['zh','en','ja'])assert.ok(row.locales[lang]);
  for(const lang of ['zh','en','ja','isopod'])assert.notEqual(aquaticText(row.key,lang),row.key);
 }
});

test('all six laboratory layouts round trip; anchors move, rotate and mirror with edited objects',()=>{
 for(const [i,layout] of ESTUARY_STAGE_LAYOUTS.entries()){
  assert.equal(validateEstuaryLayout(layout),i);
  assert.match(estuaryStageFilename(i),new RegExp(ESTUARY_NODES[i].id));
  const assets=new Map([[layout.background.type,{kind:'background',params:layout.background.params}],...layout.objects.map(o=>[o.type,{params:o.params}])]);
  const imported=importScene(shareCode(layout),assets,layout.reference);
  const out=exportScene(imported.state,imported.reference,assets);out.metadata=layout.metadata;
  assert.equal(validateEstuaryLayout(out),i);
  assert.deepEqual(out.objects,layout.objects);
  const moved=structuredClone(layout),anchor=moved.objects.find(o=>o.id===ESTUARY_ANCHORS.origin);
  anchor.x=180;anchor.y=210;anchor.scale=2;anchor.angle=Math.PI/2;anchor.flipX=true;
  const p=estuaryPoint(moved,{anchor:'origin',x:10,y:0});assert.ok(Math.abs(p.x-180)<1e-8);assert.ok(Math.abs(p.y-190)<1e-8);
  moved.objects=moved.objects.filter(o=>o.id!==anchor.id);
  assert.equal(estuaryPoint(moved,{anchor:'origin',x:0,y:0}),null);assert.throws(()=>validateEstuaryLayout(moved));
 }
 const bad=structuredClone(ESTUARY_STAGE_LAYOUTS[0]);bad.metadata.nodeId='ebb';assert.throws(()=>validateEstuaryLayout(bad));
});

test('motion is independent of method; reduced motion and occlusion are deterministic',()=>{
 for(let i=0;i<6;i++){
  const s=createRun('hookeri',19,'estuary');for(let k=0;k<i;k++){choose(s,ensureScene(s).options[0].id);advance(s)}
  const poses=[];
  for(let method=0;method<3;method++){
   const copy=structuredClone(s),group=Array.from({length:7},(_,id)=>({id,seed:id+9}));
   choose(copy,ensureScene(copy).options[method].id);stepEstuary(group,{state:copy,time:2});poses.push(group);
   assert.equal(group[0].hidden,i===3);assert.ok(group.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)));
   const reduced=structuredClone(group);stepEstuary(reduced,{state:copy,time:2,reduced:true});assert.ok(reduced.every(a=>!a.moving));
  }
  assert.deepEqual(poses[0],poses[1]);assert.deepEqual(poses[1],poses[2]);
 }
});

test('the overlay never invents routes for site or sample choices',()=>{
 const calls=[],g={fillRect(){},save(){},restore(){},setLineDash(){},beginPath(){calls.push('path')},moveTo(){},lineTo(){},stroke(){}};
 for(const method of [0,2]){const s=createRun('hookeri',11,'estuary');choose(s,ensureScene(s).options[method].id);drawEstuaryEvidence(g,s)}
 assert.equal(calls.length,0);
 const s=createRun('hookeri',11,'estuary');choose(s,ensureScene(s).options[1].id);drawEstuaryEvidence(g,s);assert.equal(calls.length,1);
});
