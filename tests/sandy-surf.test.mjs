import test from 'node:test';
import assert from 'node:assert/strict';
import {stageSand,stepSand,buriedAt,uncoverSand,sandVisibleCells,drawSandMarks,sandPose} from '../isopoda/scenery/sandy-surf.mjs';
import {createRun,choose,advance,ensureScene,migrateV4,recordDirectInteraction} from '../isopoda/engine.mjs';
import {makeIndividuals} from '../isopoda/behaviors.mjs';
import {holdIndividual} from '../isopoda/interaction.mjs';
import {renderModel} from '../isopoda/sprites.mjs';
import {speciesById} from '../isopoda/species-registry.mjs';
import {sandText} from '../isopoda/data/habitats/sandy-observation.mjs';
const setup=()=>{const state=createRun('pulchra',42,'sandy-surf'),group=makeIndividuals(state.cohort);group.forEach(a=>a.model=renderModel(speciesById(a.species).visual));stageSand(group,state);return {state,group}};
test('quiet buried residents exist before digging and have no visible trace',()=>{
 const {state,group}=setup(),a=group.find(a=>a.hidden&&a.sand.quiet);assert.ok(a);assert.equal(buriedAt(group,a),a);assert.equal(buriedAt(group,{x:0,y:0}),undefined);
 const calls=[];drawSandMarks({fillRect:(...args)=>calls.push(args)},[a],2);assert.equal(calls.length,0);
 assert.deepEqual(sandVisibleCells([[a.x,a.y,'red']],a),[]);
 const count=group.length;uncoverSand(a);assert.equal(a.hidden,false);assert.equal(group.length,count);assert.equal(buriedAt(group,a),undefined);
 holdIndividual(a,'grabbed');const xy=[a.x,a.y];for(let t=0;t<10;t++)stepSand(group,{state,time:t,dt:.1});assert.deepEqual([a.x,a.y],xy);
 holdIndividual(a,'recovering',800);let buried=false;for(let t=0;t<150;t++){stepSand(group,{state,time:t*.1,dt:.1});if(a.hidden)buried=true}assert.ok(buried,'released animal reburies');
});
test('burial masks progressively and natural cycles continue after the story',()=>{
 const {state,group}=setup();state.stage='ended';const a=group.find(a=>a.hidden);let emerged=false;
 for(let i=0;i<450;i++){stepSand(group,{state,time:i*.1,dt:.1});if(!a.hidden&&a.sand.depth===0)emerged=true}assert.ok(emerged);
 const cells=Array.from({length:20},(_,x)=>[a.x+x,a.y,'red']);a.a=0;a.sand.depth=.5;const visible=sandVisibleCells(cells,a);assert.ok(visible.length>0&&visible.length<20);
});
test('nine observations finish with either approach and all displayed keys resolve',()=>{
 for(const option of [0,1]){const s=createRun('pulchra',42,'sandy-surf');let n=0;while(s.stage!=='ended'){const scene=ensureScene(s);for(const lang of ['zh','en','ja','isopod'])for(const key of [scene.title,scene.text,...scene.options.flatMap(o=>[o.label,o.text]),'sand:arrival','sand:hint','sand:ending:body'])assert.notEqual(sandText(key,lang),key);assert.ok(choose(s,scene.options[option].id));assert.ok(advance(s));n++}assert.equal(n,9);assert.ok(s.ending.startsWith('sandy-surf-'))}
});

test('legacy pending sand scenes refresh without erasing completed notes',()=>{const s=createRun('pulchra',42,'sandy-surf');s.scene={id:'sandy-surf:1.0',kind:'aquatic',options:[{id:'water-adjust'}]};s.records=[{kind:'aquatic',choice:'water-wait',text:'water:still'}];const next=migrateV4(s);assert.equal(ensureScene(next).id,'sand:0');assert.deepEqual(next.records,s.records);s.stage='feedback';s.feedback='water:still';assert.equal(migrateV4(s).feedback,s.feedback)});

test('water excavation draws only short-lived ripples; sand has no slab fills',()=>{const calls=[],g={save(){},restore(){},fillRect(x,y,w,h){calls.push({x,y,w,h,color:this.fillStyle})}};drawSandMarks(g,[],.7,[{x:100,y:390,time:0}],false,{tide:46});assert.ok(calls.length);assert.ok(calls.every(c=>['#91bcb0','#c4d2b4'].includes(c.color)));calls.length=0;drawSandMarks(g,[],3,[{x:100,y:390,time:0}],false,{tide:46});assert.equal(calls.length,0);drawSandMarks(g,[],.7,[{x:100,y:100,time:0}],false,{tide:46});assert.ok(calls.length);assert.ok(calls.every(c=>c.w<=2&&c.h===1));});
test('burrowing lifts the rear without changing the animal position',()=>{const {group}=setup(),a=group[2],before=[a.x,a.y,a.a];a.sand.mode='burying';a.sand.age=.2;assert.ok(sandPose(a).sandRearLift>0);assert.equal(sandPose(a,true).sandRearLift,0);a.sand.age=.9;assert.equal(sandPose(a).sandRearLift,0);assert.deepEqual([a.x,a.y,a.a],before)});

test('burrow and emergence retain staged motion at 64x without obligatory transition bubbles',()=>{
 const {state,group}=setup(),a=group[0];a.sand.mode='burying';a.sand.age=0;a.sand.depth=0;
 globalThis.__ISOPODA_HABITAT_SPEED__=64;
 try{
  stepSand([a],{state,time:0,dt:.1});assert.equal(a.sand.mode,'burying');assert.equal(a.sand.depth,0);
  for(let i=0;i<40&&a.sand.mode==='burying';i++)stepSand([a],{state,time:i*.1,dt:.1});
  assert.equal(a.sand.mode,'buried');
  a.sand.age=30;stepSand([a],{state,time:4,dt:.1});assert.equal(a.sand.mode,'emerging');assert.equal(a.sand.cue,undefined);
  for(let i=0;i<40&&a.sand.mode==='emerging';i++)stepSand([a],{state,time:5+i*.1,dt:.1});
  assert.equal(a.sand.mode,'surface');assert.equal(a.sand.cue,undefined);
 }finally{delete globalThis.__ISOPODA_HABITAT_SPEED__}
});
test('every beach beat has its own choices and consequences',()=>{
 const s=createRun('pulchra',42,'sandy-surf'),labels=new Set(),feedback=new Set();
 while(s.stage!=='ended'){const scene=ensureScene(s);for(const o of scene.options){labels.add(sandText(o.label));feedback.add(sandText(o.text))}choose(s,scene.options[0].id);advance(s)}
 assert.equal(labels.size,18);assert.equal(feedback.size,18);
});

test('beach prose excludes the framing author and endings reflect observation choices',async()=>{
 const {sandEndingKind}=await import('../isopoda/data/habitats/sandy-observation.mjs');
 const endings=new Set();
 for(const choice of [0,1,2]){
  const s=createRun('pulchra',42,'sandy-surf');if(choice===2)s.groundTaps=3;
  while(s.stage!=='ended'){const scene=ensureScene(s);for(const lang of ['zh','en','ja'])for(const key of [scene.text,...scene.options.flatMap(o=>[o.label,o.text])])assert.doesNotMatch(sandText(key,lang),/阿西莫夫|Asimov|アシモフ/);choose(s,scene.options[choice===1?1:0].id);advance(s)}
  assert.equal(s.ending,'sandy-surf-'+sandEndingKind(s));endings.add(s.ending);
 }
 assert.equal(endings.size,3);
});
test('sand pool appends two evidenced species with distinct pixels and literary notes',async()=>{
 const {HABITATS}=await import('../isopoda/habitats.mjs'),{SPECIES}=await import('../isopoda/species-registry.mjs'),{pixelAnatomy}=await import('../isopoda/sprites.mjs'),{localizedAnnotationLines}=await import('../isopoda/locales/annotations.mjs');
 const pool=HABITATS.find(h=>h.id==='sandy-surf').species,art=new Set();
 assert.equal(pool.length,5);
 for(const id of pool){const p=SPECIES.find(s=>s.id===id);assert.ok(p);art.add(JSON.stringify(pixelAnatomy(renderModel(p.visual,{seed:42,stage:'L'}))));for(const lang of ['zh','en','ja'])assert.equal(localizedAnnotationLines(p,lang,p.literature.lines).length,2)}
 assert.equal(art.size,5);assert.deepEqual(SPECIES.slice(-2).map(s=>s.id),['chiltoni','naylori']);
});

test('sand intervention follows intent, direct action and changed choices',()=>{
 const second=()=>{const s=createRun('pulchra',42,'sandy-surf');choose(s,'sand-look');advance(s);return s};
 let s=second();assert.ok(!sandText(ensureScene(s).text).includes('按住'));choose(s,'sand-look');assert.equal(s.interactionIntent.hint,'sand:dig:hint');recordDirectInteraction(s,{type:'ground'});assert.equal(s.interactionIntent,null);assert.equal(s.feedback,'sand:dig:done');assert.equal(s.interactionDiscoveries.dig,true);
 s=second();choose(s,'sand-wait');recordDirectInteraction(s,{type:'ground'});assert.equal(s.feedback,'sand:dig:changed');assert.equal(s.observerContradictions.length,1);
 s=second();recordDirectInteraction(s,{type:'ground'});assert.equal(s.stage,'choice');assert.equal(ensureScene(s).text,'sand:dig:before');choose(s,'sand-wait');assert.equal(s.feedback,'sand:dig:done');assert.equal(s.interactionIntent,null);
 s=second();s.interactionDiscoveries.dig=true;choose(s,'sand-look');assert.equal(s.interactionIntent.hint,'');
});
