import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES,speciesById} from '../isopoda/species-registry.mjs';
import {sources} from '../isopoda/sources.mjs';
import {displayScaleForMm,referenceLengthMm} from '../isopoda/species-size.mjs';

const original=['dairy','cappuccino','diablo','echinatus','pink','coros','bolivari','ducky','daxin','ember','amber','vex','orange'];
const firstBatch=['maculatum','klugii','gestroi','versicolor','hoffmannseggii'];
const secondBatch=['nasatum','granulatum','expansus','haasi','officinalis'];
const thirdBatch=['vulgare','asellus','muscorum','rathkii','reaumuri'];
const fourthBatch=['pictum','pulchellum','werneri','spinicornis','magnificus'];
const added=[...firstBatch,...secondBatch,...thirdBatch,...fourthBatch];

test('expanded registry preserves the original 13 and appends twenty sourced accepted species',()=>{
 assert.equal(SPECIES.length,33);
 assert.deepEqual(SPECIES.slice(0,13).map(s=>s.id),original);
 assert.deepEqual(SPECIES.slice(13,18).map(s=>s.id),firstBatch);
 assert.deepEqual(SPECIES.slice(18,23).map(s=>s.id),secondBatch);
 assert.deepEqual(SPECIES.slice(23,28).map(s=>s.id),thirdBatch);
 assert.deepEqual(SPECIES.slice(28).map(s=>s.id),fourthBatch);
 assert.equal(new Set(SPECIES.map(s=>s.id)).size,33);
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

 const vulgare=speciesById('vulgare').visual;
 assert.equal(vulgare.morphologyKey,'armadillidiumVulgare');
 assert.equal(vulgare.conglobation.ability,'full');
 assert.equal(vulgare.cephalon.confidence,'species-character');

 const asellus=speciesById('asellus').visual;
 assert.equal(asellus.morphologyKey,'oniscusAsellus');
 assert.equal(asellus.antennae.flagellumArticles,3);
 assert.equal(asellus.conglobation.ability,'none');
 assert.ok(asellus.body.width>dairy.body.width);

 const muscorum=speciesById('muscorum').visual;
 assert.equal(muscorum.morphologyKey,'philosciaMuscorum');
 assert.equal(muscorum.antennae.flagellumArticles,3);
 assert.equal(muscorum.conglobation.strategy,'runner');
 assert.ok(muscorum.pleon.width<asellus.pleon.width);

 const rathkii=speciesById('rathkii').visual;
 assert.equal(rathkii.morphologyKey,'trachelipusRathkii');
 assert.equal(rathkii.antennae.flagellumArticles,2);
 assert.ok(rathkii.patterns.some(p=>p.type==='lateralStripe'));

 const reaumuri=speciesById('reaumuri').visual;
 assert.equal(reaumuri.morphologyKey,'hemilepistusDesert');
 assert.equal(reaumuri.surface.sculpture,'tuberculate');
 assert.equal(reaumuri.conglobation.ability,'none');
 assert.ok(reaumuri.legs.visibility>.9);

 const pictum=speciesById('pictum').visual;
 assert.equal(pictum.morphologyKey,'armadillidiumPictum');
 assert.equal(pictum.conglobation.ability,'full');
 assert.ok(pictum.patterns.some(p=>p.type==='spotRow'));

 const pulchellum=speciesById('pulchellum').visual;
 assert.equal(pulchellum.morphologyKey,'armadillidiumPulchellum');
 assert.equal(pulchellum.conglobation.ability,'partial');
 assert.equal(pulchellum.pleotelson.shape,'trapezoidal');

 const werneri=speciesById('werneri').visual;
 assert.equal(werneri.morphologyKey,'armadillidiumWerneri');
 assert.equal(werneri.conglobation.ability,'full');
 assert.ok(werneri.patterns.some(p=>p.type==='spotRow'));

 const spinicornis=speciesById('spinicornis').visual;
 assert.equal(spinicornis.morphologyKey,'porcellioSpinicornis');
 assert.equal(spinicornis.conglobation.ability,'none');
 assert.ok(spinicornis.patterns.some(p=>p.type==='dorsalStripe'));
 assert.ok(spinicornis.patterns.some(p=>p.type==='lateralStripe'));

 const magnificus=speciesById('magnificus').visual;
 assert.equal(magnificus.morphologyKey,'porcellioMagnificus');
 assert.equal(magnificus.conglobation.ability,'none');
 assert.ok(magnificus.uropods.projection>dairy.uropods.projection);
 assert.equal(magnificus.palette.tergite,'#c76935');
});

test('adult body-length references scale whole specimens without changing stage ratios',()=>{
 const small=speciesById('versicolor'),neutral=speciesById('dairy'),large=speciesById('expansus');
 assert.equal(referenceLengthMm(small),10);
 assert.equal(referenceLengthMm(speciesById('nasatum')),15);
 assert.equal(referenceLengthMm(speciesById('klugii')),21);
 assert.equal(referenceLengthMm(speciesById('vulgare')),18);
 assert.equal(referenceLengthMm(speciesById('asellus')),18);
 assert.equal(referenceLengthMm(speciesById('muscorum')),9.5);
 assert.equal(referenceLengthMm(speciesById('rathkii')),15);
 assert.equal(referenceLengthMm(speciesById('reaumuri')),22);
 assert.equal(referenceLengthMm(speciesById('pictum')),9);
 assert.equal(referenceLengthMm(speciesById('pulchellum')),5);
 assert.equal(referenceLengthMm(speciesById('werneri')),21);
 assert.equal(referenceLengthMm(speciesById('spinicornis')),12);
 assert.equal(referenceLengthMm(speciesById('magnificus')),29);
 assert.equal(referenceLengthMm(large),30);
 assert.ok(speciesById('pulchellum').renderSize.scale<=.82);
 assert.ok(speciesById('muscorum').renderSize.scale<.9);
 assert.ok(small.renderSize.scale<.9);
 assert.equal(neutral.renderSize.scale,1);
 assert.ok(speciesById('reaumuri').renderSize.scale>1.15);
 assert.ok(speciesById('magnificus').renderSize.scale>=1.27);
 assert.ok(large.renderSize.scale>=1.27);
 assert.equal(small.visual.adultDisplayScale,displayScaleForMm(10));
 assert.equal(large.visual.adultDisplayScale,displayScaleForMm(30));
 for(const p of [small,large,speciesById('muscorum'),speciesById('reaumuri'),speciesById('pulchellum'),speciesById('magnificus')]){
  assert.ok(p.visual.stageProfiles.juvenile.scale<p.visual.stageProfiles.subadult.scale);
  assert.ok(p.visual.stageProfiles.subadult.scale<p.visual.stageProfiles.adult.scale);
  assert.ok(Math.abs(p.visual.stageProfiles.juvenile.scale/p.visual.stageProfiles.adult.scale-.72)<1e-9);
 }
});
