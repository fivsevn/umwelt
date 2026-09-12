import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES} from '../isopoda/species.mjs';
import {restoreCollection,drawSpecies,unlock} from '../isopoda/collection.mjs';
import {createRun,timeFor,ensureScene,choose,advance} from '../isopoda/engine.mjs';
import {ENCOUNTERS,encounterFor} from '../isopoda/encounters.mjs';
import {MOTIONS,actorOrder,makeIndividuals,stageIndividuals,stepIndividuals} from '../isopoda/behaviors.mjs';
test('fresh collection is empty; old run and archive unlock only known species',()=>{
 assert.deepEqual(restoreCollection(null,null).unlocked,[]);
 assert.deepEqual(restoreCollection({unlocked:['fake','ducky','ducky']},{species:'dairy'},[{species:'coros'},{species:'fake'}]).unlocked,['ducky','dairy','coros']);
});
test('thirteen draws unlock thirteen unique species and survive serialization',()=>{
 let c=restoreCollection(null,null);for(let i=0;i<13;i++){const id=drawSpecies(c,177+i);assert.ok(!c.unlocked.includes(id));unlock(c,id);c.draws++;c=restoreCollection(JSON.parse(JSON.stringify(c)),null)}
 assert.equal(c.unlocked.length,13);assert.ok(SPECIES.some(s=>s.id===drawSpecies(c,12)));
});
test('specific times vary every day, remain in their windows and survive reload',()=>{
 for(let seed=0;seed<100;seed++)for(let period=0;period<3;period++){const seen=new Set();for(let day=1;day<=7;day++){const t=timeFor(seed,day,period),[h,m]=t.split(':').map(Number);assert.ok(h>=[6,13,20][period]&&h<=[10,17,23][period]&&m<60);seen.add(t);assert.equal(t,timeFor(JSON.parse(JSON.stringify(seed)),day,period))}assert.equal(seen.size,7)}
});
test('21 rounds couple unique encounters and timed records with choice outcomes',()=>{
 for(let seed=1;seed<=30;seed++){const state=createRun('ducky',seed),seen=new Set();for(let n=0;n<21;n++){const scene=ensureScene(state),e=encounterFor(state);assert.equal(scene.encounter,e.id);assert.ok(!seen.has(e.id));seen.add(e.id);if(scene.kind==='count')assert.ok(scene.count<=5);choose(state,scene.options[0].id);assert.equal(state.records[n].time,timeFor(seed,state.day,state.period));assert.equal(state.records[n].encounter,e.id);advance(state)}}
});
test('all encounter motions animate five bounded stable individuals, with correct molt halves',()=>{
 assert.deepEqual(new Set(ENCOUNTERS.map(e=>e.motion)),new Set(MOTIONS));
 for(const e of ENCOUNTERS){const group=makeIndividuals(42);stageIndividuals(group,e);const ids=group.map(c=>c.seed);let moved=false;for(let i=0;i<240;i++){const before=group.map(c=>[c.x,c.y]);stepIndividuals(group,{encounter:e,state:{humidity:65},time:i*.1,dt:.1});moved ||= group.some((c,j)=>c.x!==before[j][0]||c.y!==before[j][1]);assert.equal(group.length,5);for(const c of group)assert.ok(Number.isFinite(c.a)&&c.x>=24&&c.x<=355&&c.y>=30&&c.y<=400);if(e.motion==='molt')assert.equal(actorOrder(group,e)[0].molt,e.molt)}assert.ok(moved);assert.deepEqual(group.map(c=>c.seed),ids)}
});
test('reduced motion keeps essential activity gentle; disturbing and waiting alter defensive encounter',()=>{
 const e=ENCOUNTERS.find(e=>e.motion==='defend'),g=makeIndividuals(2);stageIndividuals(g,e);const p=g.map(c=>[c.x,c.y]);stepIndividuals(g,{encounter:e,state:{},time:3,reduced:true});assert.ok(g.every((c,i)=>Math.hypot(c.x-p[i][0],c.y-p[i][1])<1));assert.ok(g.some(c=>c.moving));
 stepIndividuals(g,{encounter:e,state:{},time:3,reaction:{mode:'quiet'}});assert.ok(g.every(c=>['tucked','normal','turning'].includes(c.posture)));stepIndividuals(g,{encounter:e,state:{},time:3,reaction:{mode:'disturb'}});assert.ok(g.some(c=>['tucked','curled'].includes(c.posture)));
});
