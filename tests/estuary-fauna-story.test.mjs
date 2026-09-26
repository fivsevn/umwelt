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
