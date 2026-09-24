import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES,speciesById} from '../isopoda/species-registry.mjs';
import {sources} from '../isopoda/sources-registry.mjs';
import {displayScaleForMm,referenceLengthMm} from '../isopoda/species-size.mjs';

const original=['dairy','cappuccino','diablo','echinatus','pink','coros','bolivari','ducky','daxin','ember','amber','vex','orange'];
const firstBatch=['maculatum','klugii','gestroi','versicolor','hoffmannseggii'];
const secondBatch=['nasatum','granulatum','expansus','haasi','officinalis'];
const thirdBatch=['vulgare','asellus','muscorum','rathkii','reaumuri'];
const fourthBatch=['pictum','pulchellum','werneri','spinicornis','magnificus'];
const marineReference=['uniramea'];
const hobbyBatch=['pandaKing','pinkPandaKing','magicPotion','papaya','whiteShark'];
const unresolvedHobby=['pandaKing','pinkPandaKing','whiteShark'];
const acceptedMorphs=['magicPotion','papaya'];
const aquaticExpansion=['hilgendorfii','ischiosetosa','bidentata','linearis','maculosa','hookeri','rugicauda','chelipes','carinata'];
const releaseAquatic=['pulchra','affinis','spinigera','cavaticus','lusitanicus','virei'];
const accepted=[...firstBatch,...secondBatch,...thirdBatch,...fourthBatch,...marineReference,...aquaticExpansion,...releaseAquatic];

test('expanded registry preserves accepted batches and appends a diversified hobby batch',()=>{
 assert.equal(SPECIES.length,64);
 assert.deepEqual(SPECIES.slice(0,13).map(s=>s.id),original);
 assert.deepEqual(SPECIES.slice(13,18).map(s=>s.id),firstBatch);
 assert.deepEqual(SPECIES.slice(18,23).map(s=>s.id),secondBatch);
 assert.deepEqual(SPECIES.slice(23,28).map(s=>s.id),thirdBatch);
 assert.deepEqual(SPECIES.slice(28,33).map(s=>s.id),fourthBatch);
 assert.deepEqual(SPECIES.slice(33,34).map(s=>s.id),marineReference);
 assert.deepEqual(SPECIES.slice(34,39).map(s=>s.id),hobbyBatch);
 assert.deepEqual(SPECIES.slice(-15,-6).map(s=>s.id),aquaticExpansion);
 assert.deepEqual(SPECIES.slice(-6).map(s=>s.id),releaseAquatic);
 assert.equal(new Set(SPECIES.map(s=>s.id)).size,64);
 for(const id of accepted){
  const p=speciesById(id);
  assert.equal(p.taxonomy.speciesStatus,'accepted_species');
  assert.ok(p.taxonomy.acceptedScientificName);
  assert.ok(p.visual);
  assert.equal(p.evidence.status,'literature_supported');
  for(const evidenceId of p.evidenceIds)assert.ok(sources.some(s=>s.id===evidenceId),`${id}: missing ${evidenceId}`);
 }
 for(const id of hobbyBatch){
  const p=speciesById(id);assert.ok(p.visual);assert.equal(p.evidence.status,'hobby_documented');
  for(const evidenceId of p.evidenceIds)assert.ok(sources.some(s=>s.id===evidenceId),`${id}: missing ${evidenceId}`);
 }
 for(const id of unresolvedHobby){
  const p=speciesById(id);assert.equal(p.taxonomy.speciesStatus,'undescribed_or_unresolved');assert.equal(p.taxonomy.acceptedScientificName,null);assert.equal(p.taxonomy.genus,'Cubaris');
 }
 assert.equal(speciesById('magicPotion').taxonomy.acceptedScientificName,'Armadillidium vulgare');
 assert.equal(speciesById('magicPotion').trade.morph,'Magic Potion');
 assert.equal(speciesById('papaya').taxonomy.acceptedScientificName,'Cubaris murina');
 assert.equal(speciesById('papaya').trade.morph,'Papaya');
});

test('new sprites retain conservative scaffolds while evidence changes readable morphology',()=>{
 for(const id of ['maculatum','klugii','gestroi','versicolor']){
  const p=speciesById(id);assert.equal(p.visual.morphologyKey,'armadillidiumCompact');assert.equal(p.visual.conglobation.ability,'full');
 }
 const titan=speciesById('hoffmannseggii').visual,dairy=speciesById('dairy').visual;
 assert.equal(titan.morphologyKey,'porcellioStandard');assert.ok(titan.body.length>dairy.body.length);assert.ok(titan.uropods.projection>dairy.uropods.projection);
 const nasatum=speciesById('nasatum').visual;assert.equal(nasatum.morphologyKey,'armadillidiumNasatum');assert.equal(nasatum.cephalon.confidence,'species-character');assert.equal(nasatum.conglobation.ability,'full');
 const granulatum=speciesById('granulatum').visual;assert.equal(granulatum.morphologyKey,'armadillidiumGranulatum');assert.equal(granulatum.surface.sculpture,'tuberculate');assert.ok(granulatum.surface.intensity>.7);
 const expansus=speciesById('expansus').visual;assert.equal(expansus.morphologyKey,'porcellioExpansus');assert.equal(expansus.conglobation.ability,'none');assert.ok(expansus.body.width>dairy.body.width);
 const haasi=speciesById('haasi').visual;assert.equal(haasi.morphologyKey,'porcellioHaasi');assert.ok(haasi.patterns.some(p=>p.type==='spotRow'));assert.equal(haasi.conglobation.ability,'none');
 const officinalis=speciesById('officinalis').visual;assert.equal(officinalis.morphologyKey,'armadillidHobby');assert.equal(officinalis.conglobation.ability,'full');
 const vulgare=speciesById('vulgare').visual;assert.equal(vulgare.morphologyKey,'armadillidiumVulgare');assert.equal(vulgare.conglobation.ability,'full');assert.equal(vulgare.cephalon.confidence,'species-character');
 const asellus=speciesById('asellus').visual;assert.equal(asellus.morphologyKey,'oniscusAsellus');assert.equal(asellus.antennae.flagellumArticles,3);assert.equal(asellus.conglobation.ability,'none');assert.ok(asellus.body.width>dairy.body.width);
 const muscorum=speciesById('muscorum').visual;assert.equal(muscorum.morphologyKey,'philosciaMuscorum');assert.equal(muscorum.antennae.flagellumArticles,3);assert.equal(muscorum.conglobation.strategy,'runner');assert.ok(muscorum.pleon.width<asellus.pleon.width);
 const rathkii=speciesById('rathkii').visual;assert.equal(rathkii.morphologyKey,'trachelipusRathkii');assert.equal(rathkii.antennae.flagellumArticles,2);assert.ok(rathkii.patterns.some(p=>p.type==='lateralStripe'));
 const reaumuri=speciesById('reaumuri').visual;assert.equal(reaumuri.morphologyKey,'hemilepistusDesert');assert.equal(reaumuri.surface.sculpture,'tuberculate');assert.equal(reaumuri.conglobation.ability,'none');assert.ok(reaumuri.legs.visibility>.9);
 const pictum=speciesById('pictum').visual;assert.equal(pictum.morphologyKey,'armadillidiumPictum');assert.equal(pictum.conglobation.ability,'full');assert.ok(pictum.patterns.some(p=>p.type==='spotRow'));
 const pulchellum=speciesById('pulchellum').visual;assert.equal(pulchellum.morphologyKey,'armadillidiumPulchellum');assert.equal(pulchellum.conglobation.ability,'partial');assert.equal(pulchellum.pleotelson.shape,'trapezoidal');
 const werneri=speciesById('werneri').visual;assert.equal(werneri.morphologyKey,'armadillidiumWerneri');assert.equal(werneri.conglobation.ability,'full');assert.ok(werneri.patterns.some(p=>p.type==='spotRow'));
 const spinicornis=speciesById('spinicornis').visual;assert.equal(spinicornis.morphologyKey,'porcellioSpinicornis');assert.equal(spinicornis.conglobation.ability,'none');assert.ok(spinicornis.patterns.some(p=>p.type==='dorsalStripe'));assert.ok(spinicornis.patterns.some(p=>p.type==='lateralStripe'));
 const magnificus=speciesById('magnificus').visual;assert.equal(magnificus.morphologyKey,'porcellioMagnificus');assert.equal(magnificus.conglobation.ability,'none');assert.ok(magnificus.uropods.projection>dairy.uropods.projection);assert.equal(magnificus.palette.tergite,'#c76935');
 const uniramea=speciesById('uniramea');assert.equal(uniramea.taxonomy.suborder,'Asellota');assert.equal(uniramea.game.habitatEligible,false);assert.equal(uniramea.game.referenceOnly,false);assert.deepEqual(uniramea.game.habitats,['petri-dish']);assert.equal(uniramea.visual.morphologyKey,'halacarsantiaMarine');assert.equal(uniramea.visual.uropods.ramiPerUropod,1);assert.deepEqual(uniramea.visual.legs.posteriorAnchoringPairs,[5,6,7]);

 const pulchra=speciesById('pulchra'),cavaticus=speciesById('cavaticus'),lusitanicus=speciesById('lusitanicus'),virei=speciesById('virei');
 assert.equal(pulchra.visual.morphologyKey,'cirolanidSurf');assert.ok(pulchra.game.habitats.includes('sandy-surf'));
 assert.equal(cavaticus.visual.morphologyKey,'asellidStygobite');assert.equal(cavaticus.visual.cephalon.eyeScale,0);
 assert.equal(lusitanicus.visual.morphologyKey,'asellidStygobiteLong');assert.equal(lusitanicus.visual.cephalon.eyeScale,0);
 assert.equal(virei.visual.morphologyKey,'stenasellidGroundwater');assert.ok(virei.game.habitats.includes('groundwater'));
 const giant=speciesById('giganteus');assert.equal(giant.taxonomy.acceptedScientificName,'Bathynomus giganteus');assert.equal(giant.game.habitats[0],'abyssal');assert.equal(giant.game.habitatEligible,false);assert.equal(giant.visual.morphologyKey,'cirolanidAbyssal');assert.equal(giant.names.zhCN,'大王具足虫');assert.equal(giant.names.ja,'ダイオウグソクムシ');assert.equal(giant.visual.antennae.secondaryPair,true);assert.equal(giant.visual.pleotelson.shape,'fan-rounded');assert.equal(giant.visual.pleotelson.serrations,7);assert.equal(giant.visual.uropods.mode,'fan-lateral');assert.equal(giant.visual.patterns.length,0);assert.ok(giant.visual.body.width>=.95);assert.ok(giant.visual.legs.visibility>=.9);
 const panda=speciesById('pandaKing').visual,pink=speciesById('pinkPandaKing').visual,magic=speciesById('magicPotion').visual,papaya=speciesById('papaya').visual,shark=speciesById('whiteShark').visual;
 assert.equal(panda.morphologyKey,'cubarisPandaKing');assert.ok(panda.patterns.some(p=>p.type==='segmentBand'));
 assert.equal(pink.morphologyKey,'cubarisPinkPandaKing');assert.ok(pink.patterns.some(p=>p.type==='segmentBand'));
 assert.equal(magic.morphologyKey,'armadillidiumVulgareMagicPotion');assert.ok(magic.patterns.some(p=>p.type==='spotRow'));assert.equal(magic.conglobation.ability,'full');
 assert.equal(papaya.morphologyKey,'cubarisMurinaPapaya');assert.equal(speciesById('papaya').taxonomy.species,'murina');
 assert.equal(shark.morphologyKey,'cubarisWhiteShark');assert.ok(shark.patterns.some(p=>p.type==='segmentBand'));assert.equal(speciesById('whiteShark').taxonomy.species,null);
 assert.notEqual(panda.palette.tergite,pink.palette.tergite);assert.notEqual(papaya.palette.tergite,shark.palette.tergite);
});

test('adult body-length references scale whole specimens without changing stage ratios',()=>{
 const small=speciesById('versicolor'),neutral=speciesById('dairy'),large=speciesById('expansus');
 assert.equal(referenceLengthMm(small),10);assert.equal(referenceLengthMm(speciesById('nasatum')),15);assert.equal(referenceLengthMm(speciesById('klugii')),21);assert.equal(referenceLengthMm(speciesById('vulgare')),18);assert.equal(referenceLengthMm(speciesById('asellus')),18);assert.equal(referenceLengthMm(speciesById('muscorum')),9.5);assert.equal(referenceLengthMm(speciesById('rathkii')),15);assert.equal(referenceLengthMm(speciesById('reaumuri')),22);assert.equal(referenceLengthMm(speciesById('pictum')),9);assert.equal(referenceLengthMm(speciesById('pulchellum')),5);assert.equal(referenceLengthMm(speciesById('werneri')),21);assert.equal(referenceLengthMm(speciesById('spinicornis')),12);assert.equal(referenceLengthMm(speciesById('magnificus')),29);assert.equal(referenceLengthMm(speciesById('uniramea')),.85);
 assert.equal(referenceLengthMm(speciesById('pandaKing')),10);assert.equal(referenceLengthMm(speciesById('pinkPandaKing')),10);assert.equal(referenceLengthMm(speciesById('magicPotion')),16.5);assert.equal(referenceLengthMm(speciesById('papaya')),10);assert.equal(referenceLengthMm(speciesById('whiteShark')),12.5);
 assert.equal(referenceLengthMm(large),30);assert.ok(speciesById('pulchellum').renderSize.scale<=.82);assert.equal(speciesById('uniramea').renderSize.scale,.70);assert.ok(speciesById('muscorum').renderSize.scale<.9);assert.ok(small.renderSize.scale<.9);assert.equal(neutral.renderSize.scale,1);assert.ok(speciesById('reaumuri').renderSize.scale>1.15);assert.ok(speciesById('magnificus').renderSize.scale>=1.27);assert.ok(large.renderSize.scale>=1.27);assert.equal(small.visual.adultDisplayScale,displayScaleForMm(10));assert.equal(large.visual.adultDisplayScale,displayScaleForMm(30));
 for(const p of [small,large,speciesById('muscorum'),speciesById('reaumuri'),speciesById('pulchellum'),speciesById('magnificus'),speciesById('uniramea'),speciesById('pandaKing'),speciesById('magicPotion'),speciesById('papaya'),speciesById('whiteShark')]){
  assert.ok(p.visual.stageProfiles.juvenile.scale<p.visual.stageProfiles.subadult.scale);assert.ok(p.visual.stageProfiles.subadult.scale<p.visual.stageProfiles.adult.scale);assert.ok(Math.abs(p.visual.stageProfiles.juvenile.scale/p.visual.stageProfiles.adult.scale-.72)<1e-9);
 }
});
