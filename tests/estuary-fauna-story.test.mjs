import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,choose,advance,ensureScene,migrateV4} from '../isopoda/engine.mjs';
import {drawCohort} from '../isopoda/collection.mjs';
import {shoreBranch,shoreVisible,shoreEvidence,shoreEnding,shoreText,shoreScene} from '../isopoda/data/habitats/estuary-shore.mjs';
import {shoreFaunaSites} from '../isopoda/data/habitats/shore-fauna.mjs';
import {stepShore} from '../isopoda/scenery/estuary-shore.mjs';
test('authored distribution permits empty banks; visual, evidence and story use the same visibility',()=>{
 const branches=new Set();let empty=0,uneven=0;
 for(let seed=1;seed<=60;seed++){
  const cohort=drawCohort({unlocked:[],draws:0},seed,'estuary'),s=createRun(cohort[0].species,seed,'estuary');s.cohort=cohort;
  const sites=shoreFaunaSites(cohort),counts=[0,1,2].map(p=>sites.filter(x=>x===p).length);if(new Set(counts).size>1)uneven++;if(counts.includes(0))empty++;
  for(let turn=0;turn<8;turn++){
   for(let point=0;point<3;point++){
    s.shorePoint=point;s.scene=null;const actors=cohort.map(a=>({...a}));stepShore(actors,{state:s,time:3});const visible=actors.filter(a=>!a.hidden);
    assert.equal(shoreVisible(s),visible.length>0);assert.deepEqual(shoreEvidence(s).taxa,[...new Set(visible.map(a=>a.species))]);
    assert.ok(visible.every(a=>point===0||!['carinata','ischiosetosa'].includes(a.species)));
    const branch=shoreBranch(s);branches.add(branch);for(const lang of ['zh','en','ja','isopod'])assert.ok(!shoreText(shoreScene(s).text,lang).startsWith('estuary:'));
    assert.deepEqual(shoreEvidence(migrateV4(JSON.parse(JSON.stringify(s)))),shoreEvidence(s));
   }
   s.shorePoint=turn%3;s.scene=null;assert.ok(choose(s,'shore-watch'));assert.ok(advance(s));
  }
 }
 assert.ok(empty>0&&uneven>0);assert.deepEqual([...branches].sort(),['again','found','lost','quiet','return']);
});
test('all three endings follow recorded sightings, including a complete empty observation',()=>{
 for(const [finds,id] of [[Array(8).fill(false),'estuary-shore-empty'],[[true,false,true,false,true,false,true,false],'estuary-shore-mosaic'],[Array(8).fill(true),'estuary-shore']]){
  const records=finds.map(found=>({evidence:{version:2,found}}));assert.equal(shoreEnding({records}).id,id);
 }
 const s=createRun('carinata',17,'estuary');s.shorePoint=2;
 for(let turn=0;turn<8;turn++){assert.equal(shoreVisible(s),false);ensureScene(s);choose(s,'shore-watch');advance(s)}
 assert.equal(s.ending,'estuary-shore-empty');assert.ok(s.records.every(r=>r.evidence.found===false&&r.evidence.taxa.length===0));
});
test('neighbours retain visual clearance near shared refuges without moving a held animal',()=>{
 for(let seed=1;seed<=30;seed++){
  const cohort=drawCohort({unlocked:[],draws:0},seed,'estuary'),s=createRun(cohort[0].species,seed,'estuary');s.cohort=cohort;
  for(let point=0;point<3;point++){
   s.shorePoint=point;const actors=cohort.map(a=>({...a}));
   for(const time of [0,10,29,60]){stepShore(actors,{state:s,time});const visible=actors.filter(a=>!a.hidden);
    for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++)assert.ok(Math.hypot(visible[i].x-visible[j].x,visible[i].y-visible[j].y)>24,'nearby bodies should not stack');
   }
   const held=actors.find(a=>!a.hidden);if(held){held.interactionState={mode:'grabbed'};const {x,y}=held;stepShore(actors,{state:s,time:61,dt:.05});assert.deepEqual([held.x,held.y],[x,y]);}
  }
 }
});
test('tides and observation choices assign objectives; arrival gives way to varied local motion',()=>{
 const objectives=[];
 for(let tide=0;tide<4;tide++)for(const focus of ['water','cover']){
  const s=createRun('rugicauda',29,'estuary');s.cohort=s.cohort.slice(0,1);s.shorePoint=shoreFaunaSites(s.cohort)[0];s.records=Array.from({length:tide},()=>({evidence:{version:2}}));s.shoreFocus=focus;s.shoreFocusTurn=tide;
  const actors=s.cohort.map(a=>({...a}));stepShore(actors,{state:s,time:0});if(actors[0].hidden)continue;
  const a=actors[0];objectives.push([tide,focus,a.shoreTrack.objective.kind,a.shoreTrack.objective.y]);
  let reached=false,moving=false,resting=false;const targets=new Set();
  for(let t=.2;t<160;t+=.2){stepShore(actors,{state:s,time:t,dt:.2});if(a.shoreTrack.objective.done){reached=true;moving||=a.moving;resting||=!a.moving;const g=a.shoreTrack.goal;if(g)targets.add([g.x.toFixed(1),g.y.toFixed(1)].join(','));}}
  assert.ok(reached&&moving&&resting);assert.ok(targets.size>2,'after arrival, local exploration changes destination');
 }
 assert.ok(new Set(objectives.map(o=>o[2])).size>=3);assert.ok(objectives.some(o=>o[1]==='cover'&&o[2]==='shelter'));
});
test('release replans from the placed position toward a real refuge instead of translating the old path',()=>{
 const s=createRun('rugicauda',29,'estuary');s.cohort=s.cohort.slice(0,1);s.shorePoint=shoreFaunaSites(s.cohort)[0];const actors=s.cohort.map(a=>({...a})),a=actors[0];stepShore(actors,{state:s,time:0});
 a.x=40;a.y=390;a.interactionState={mode:'grabbed'};stepShore(actors,{state:s,time:.2,dt:.2});assert.deepEqual([a.x,a.y],[40,390]);
 a.interactionState={mode:'recovering',remaining:.1};stepShore(actors,{state:s,time:.4,dt:.2});assert.deepEqual([a.x,a.y],[40,390]);
 const goal={...a.shoreTrack.objective},before=Math.hypot(a.x-goal.x,a.y-goal.y);let previous={x:a.x,y:a.y};
 for(let t=.6;t<45;t+=.2){stepShore(actors,{state:s,time:t,dt:.2});assert.ok(Math.hypot(a.x-previous.x,a.y-previous.y)<1.2,'no teleport after release');previous={x:a.x,y:a.y};}
 assert.ok(Math.hypot(a.x-goal.x,a.y-goal.y)<before-25,'progress toward shelter after placement');
});
