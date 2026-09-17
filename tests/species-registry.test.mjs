import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES,speciesById} from '../isopoda/species-registry.mjs';
import {sources} from '../isopoda/sources.mjs';

const original=['dairy','cappuccino','diablo','echinatus','pink','coros','bolivari','ducky','daxin','ember','amber','vex','orange'];
const firstBatch=['maculatum','klugii','gestroi','versicolor','hoffmannseggii'];
const secondBatch=['nasatum','granulatum','expansus','haasi','officinalis'];
const added=[...firstBatch,...secondBatch];

test('expanded registry preserves the original 13 and appends ten sourced accepted species',()=>{
 assert.equal(SPECIES.length,23);
 assert.deepEqual(SPECIES.slice(0,13).map(s=>s.id),original);
 assert.deepEqual(SPECIES.slice(13,18).map(s=>s.id),firstBatch);
 assert.deepEqual(SPECIES.slice(18).map(s=>s.id),secondBatch);
 assert.equal(new Set(SPECIES.map(s=>s.id)).size,23);
 for(const id of added){
  const p=speciesById(id);
  assert.equal(p.taxonomy.speciesStatus,'accepted_species');
  assert.ok(p.taxonomy.acceptedScientificName);
  assert.ok(p.visual);
  assert.equal(p.evidence.status,'literature_supported');
  for(const evidenceId of p.evidenceIds)assert.ok(sources.some(s=>s.id===evidenceId),`${id}: missing ${evidenceId}`);
 }
});

test('new sprites retain conservative scaffolds while species evidence changes readable morphology',()=>{
 for(const id of ['maculatum','klugii','gestroi','versicolor']){
  const p=speciesById(id);
  assert.equal(p.visual.morphologyKey,'armadillidiumCompact');
  assert.equal(p.visual.conglobation.ability,'full');
 }
 const titan=speciesById('hoffmannseggii').visual,dairy=speciesById('dairy').visual;
 assert.equal(titan.morphologyKey,'porcellioStandard');
 assert.ok(titan.body.length>dairy.body.length);
 assert.ok(titan.uropods.projection>dairy.uropods.projection);

 const nasatum=speciesById('nasatum').visual;
 assert.equal(nasatum.morphologyKey,'armadillidiumNasatum');
 assert.equal(nasatum.cephalon.confidence,'species-character');
 assert.equal(nasatum.conglobation.ability,'full');

 const granulatum=speciesById('granulatum').visual;
 assert.equal(granulatum.morphologyKey,'armadillidiumGranulatum');
 assert.equal(granulatum.surface.sculpture,'tuberculate');
 assert.ok(granulatum.surface.intensity>.7);

 const expansus=speciesById('expansus').visual;
 assert.equal(expansus.morphologyKey,'porcellioExpansus');
 assert.equal(expansus.conglobation.ability,'none');
 assert.ok(expansus.body.width>dairy.body.width);

 const haasi=speciesById('haasi').visual;
 assert.equal(haasi.morphologyKey,'porcellioHaasi');
 assert.ok(haasi.patterns.some(p=>p.type==='spotRow'));
 assert.equal(haasi.conglobation.ability,'none');

 const officinalis=speciesById('officinalis').visual;
 assert.equal(officinalis.morphologyKey,'armadillidHobby');
 assert.equal(officinalis.conglobation.ability,'full');
});
