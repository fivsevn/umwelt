import test from 'node:test';import assert from 'node:assert/strict';
import {createRun,validRun,ensureScene,choose,advance,runSpecies,migrateV3,recordDirectInteraction,directMemoryForDay,endingMemoryFor} from '../isopoda/engine.mjs';
import {drawCohort,restoreCollection,unlock} from '../isopoda/collection.mjs';
import {SPECIES} from '../isopoda/species.mjs';
import {makeIndividuals} from '../isopoda/behaviors.mjs';
import {environmentFor,environmentTarget} from '../isopoda/environment.mjs?v=forest-8';
test('cohort distribution, compatible unique taxa, unseen anchor and deterministic identities',()=>{
 const counts=[0,0,0];for(let seed=0;seed<10000;seed++){const c=restoreCollection(null,null),batch=drawCohort(c,seed);assert.deepEqual(batch,drawCohort(c,seed));assert.equal(batch.length,7);const taxa=[...new Set(batch.map(c=>c.species))];counts[taxa.length-1]++;assert.equal(new Set(batch.map(c=>c.seed)).size,7)}
 for(const [i,p] of [.30,.45,.25].entries())assert.ok(Math.abs(counts[i]/10000-p)<.025,counts.join(','));
 const c=restoreCollection(null,null);while(c.unlocked.length<SPECIES.length){const b=drawCohort(c,c.draws+98);assert.ok(b.some(s=>!c.unlocked.includes(s.species)));for(const s of b)unlock(c,s.species);c.draws++}
});
test('mixed cohort survives all 21 turns, serialization, archives and renderer',()=>{
 for(let seed=0;seed<100;seed++){let s=createRun('dairy',seed);s.cohort=drawCohort(restoreCollection(null,null),seed);const identity=JSON.stringify(s.cohort);for(let i=0;i<21;i++){assert.ok(validRun(s));choose(s,ensureScene(s).options[0].id);advance(s);s=JSON.parse(JSON.stringify(s));assert.equal(JSON.stringify(s.cohort),identity)}assert.equal(s.stage,'ended');assert.equal(s.records.length,21);assert.deepEqual(makeIndividuals(s.cohort).map(c=>c.seed),s.cohort.map(c=>c.seed));assert.deepEqual(restoreCollection(null,null,[{species:runSpecies(s)}]).unlocked,runSpecies(s))}
});
test('v3 feedback and progress preserved; pending route regenerated; invalid data rejected',()=>{
 const old={...createRun('dairy',77),version:3,species:'ducky',day:4,stage:'feedback',feedback:'留存',records:[{text:'留存'}]};delete old.cohort;const s=migrateV3(old);assert.ok(validRun(s));assert.equal(s.day,4);assert.equal(s.feedback,'留存');assert.deepEqual(s.records,old.records);assert.ok(s.cohort.every(c=>c.species==='ducky'));assert.equal(migrateV3({...old,species:'fake'}),null);assert.equal(validRun({...s,cohort:s.cohort.slice(1)}),false)
});
test('same environment produces species-specific spatial choices',()=>{const s=createRun();s.humidity=80;s.light=30;environmentFor(s).wetZones[0].moisture=80;const targets=SPECIES.map(p=>environmentTarget(s,{id:1,species:p.id}).kind);assert.ok(new Set(targets).size>1)});

test('direct handling becomes persistent observer memory without invalidating v4 saves',()=>{
 const s=createRun('dairy',991);delete s.directTouches;delete s.directGrabs;delete s.directMoves;delete s.directRecords;assert.ok(validRun(s));
 const base=s.interventions;recordDirectInteraction(s,{type:'tap',specimen:'B',point:{x:80,y:120}});assert.equal(s.directTouches,1);assert.equal(s.interventions,base+1);assert.ok(s.environment.disturbance>=1);assert.match(directMemoryForDay(s),/个体 B/);
 s.scene=null;assert.match(ensureScene(s).text,/你的手|原因|新痕/);s.scene=null;recordDirectInteraction(s,{type:'grab',specimen:'C',point:{x:140,y:180}});recordDirectInteraction(s,{type:'place',specimen:'C',point:{x:260,y:300}});assert.equal(s.directGrabs,1);assert.equal(s.directMoves,1);assert.ok(s.environment.scuffs.some(mark=>mark.direct&&mark.x===260&&mark.y===300));assert.match(directMemoryForDay(s),/个体 C/);assert.match(endingMemoryFor(s),/个体 C/);assert.ok(validRun(s));
 const restored=JSON.parse(JSON.stringify(s));assert.match(endingMemoryFor(restored),/放回另一个位置/);
});
