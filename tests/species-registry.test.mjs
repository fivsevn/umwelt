import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES,speciesById} from '../isopoda/species-registry.mjs';
import {sources} from '../isopoda/sources.mjs';

const original=['dairy','cappuccino','diablo','echinatus','pink','coros','bolivari','ducky','daxin','ember','amber','vex','orange'];
const added=['maculatum','klugii','gestroi','versicolor','hoffmannseggii'];

test('expanded registry preserves the original 13 and appends five sourced accepted species',()=>{
 assert.equal(SPECIES.length,18);
 assert.deepEqual(SPECIES.slice(0,13).map(s=>s.id),original);
 assert.deepEqual(SPECIES.slice(13).map(s=>s.id),added);
 assert.equal(new Set(SPECIES.map(s=>s.id)).size,18);
 for(const id of added){
  const p=speciesById(id);
  assert.equal(p.taxonomy.speciesStatus,'accepted_species');
  assert.ok(p.taxonomy.acceptedScientificName);
  assert.ok(p.visual);
  assert.equal(p.evidence.status,'literature_supported');
  for(const evidenceId of p.evidenceIds)assert.ok(sources.some(s=>s.id===evidenceId),`${id}: missing ${evidenceId}`);
 }
});

test('new sprites retain genus scaffolds while species evidence changes readable silhouettes and patterns',()=>{
 for(const id of ['maculatum','klugii','gestroi','versicolor']){
  const p=speciesById(id);
  assert.equal(p.visual.morphologyKey,'armadillidiumCompact');
  assert.equal(p.visual.conglobation.ability,'full');
 }
 const titan=speciesById('hoffmannseggii').visual,dairy=speciesById('dairy').visual;
 assert.equal(titan.morphologyKey,'porcellioStandard');
 assert.ok(titan.body.length>dairy.body.length);
 assert.ok(titan.uropods.projection>dairy.uropods.projection);
});
