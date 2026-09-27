import test from 'node:test';
import assert from 'node:assert/strict';
import {arrivalText,unlockedPetriSpecies} from '../isopoda/arrival.mjs';
import {drawCohort,restoreCollection} from '../isopoda/collection.mjs';
import {createRun,validRun,migrateV4,ensureScene} from '../isopoda/engine.mjs';
import {SPECIES} from '../isopoda/species-registry.mjs';
import {HABITATS} from '../isopoda/habitats.mjs';
test('freshwater draws two or three taxa without changing the seven-animal cohort',()=>{
 const counts=new Set();
 for(let seed=0;seed<300;seed++){
  const cohort=drawCohort(restoreCollection(null,null),seed,'freshwater'),taxa=new Set(cohort.filter(c=>c.species!=='naigua').map(c=>c.species));
  assert.ok(taxa.size===2||taxa.size===3);counts.add(taxa.size);assert.equal(cohort.filter(c=>c.species!=='naigua').length,7);
  const s=createRun(cohort[0].species,seed,'freshwater');s.cohort=cohort;assert.ok(validRun(s));assert.equal(ensureScene(s).materialStage,0);
 }
 assert.equal(counts.size,2);
});
test('petri selector lists only unlocked species, including terrestrial animals but excluding giant isopods',()=>{
 assert.deepEqual(unlockedPetriSpecies({unlocked:['dairy','giganteus','fake']}),['dairy']);
 assert.deepEqual(unlockedPetriSpecies({unlocked:[]}),[]);
 for(const p of SPECIES){const s=createRun(p.id,18,'petri-dish');assert.equal(s.cohort[0].species,p.id==='giganteus'?'uniramea':p.id);assert.equal(s.cohort.length,1);assert.ok(validRun(migrateV4(JSON.parse(JSON.stringify(s)))))}
});
test('each outdoor arrival has one short localized preparation, with punctuation',()=>{
 for(const h of HABITATS.filter(h=>h.id!=='terrestrial'))for(const lang of ['zh','en','ja','isopod']){
  const text=arrivalText(h.id,lang);assert.ok(text);
  if(lang==='zh'||lang==='ja')assert.equal(text.match(/。/g)?.length,1);
  if(lang==='en')assert.equal(text.match(/\./g)?.length,1);
  if(lang==='zh')assert.doesNotMatch(text,/等足目|个体|物种|这片/);
 }
});

test('legacy giant dish saves keep progress with a dish-sized specimen',()=>{
 const s=createRun('uniramea',18,'petri-dish');s.cohort[0].species='giganteus';s.day=2;
 const restored=migrateV4(s);assert.ok(validRun(restored));assert.equal(restored.day,2);assert.equal(restored.cohort[0].species,'uniramea');assert.equal(s.cohort[0].species,'giganteus');
 assert.equal(createRun('giganteus',18,'abyssal').cohort[0].species,'giganteus');
});

test('Naigua is selectable in the cabinet only after collection unlock, regardless of misses',()=>{
 for(const naiguaMisses of [0,7]){
  assert.equal(unlockedPetriSpecies({unlocked:['dairy'],naiguaMisses}).includes('naigua'),false);
  assert.equal(unlockedPetriSpecies({unlocked:['dairy','naigua'],naiguaMisses}).includes('naigua'),true);
 }
});
