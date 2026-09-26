import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,ensureScene,choose,advance,migrateV4,validRun} from '../isopoda/engine.mjs';
import {habitatConfig} from '../isopoda/habitats.mjs';
import {gameText} from '../isopoda/locales/game.mjs';
import {environmentScale} from '../isopoda/observation-header.mjs';
import {intertidalInstrument,TEXT_CATALOG} from '../isopoda/data/narrative/intertidal.mjs';
import {makeIndividuals} from '../isopoda/behaviors.mjs';
import {stepIntertidal,intertidalSurface,drawIntertidalLife} from '../isopoda/scenery/intertidal.mjs';
test('one low-to-low tide, all choice paths, reloads and four languages',()=>{
 for(let choice=0;choice<3;choice++){
  let s=createRun('granulosa',42,'intertidal');const times=[];
  for(let i=0;i<9;i++){
   const scene=ensureScene(s);times.push(environmentScale(s).value);assert.equal(scene.kind,'intertidal-tide');
   for(const lang of ['zh','en','ja','isopod']){
    for(const k of [scene.title,scene.text,...scene.options.flatMap(o=>[o.label,o.text])])assert.notEqual(gameText(k,lang),k);
    if(lang==='isopod')for(const text of [...intertidalInstrument(s,lang),environmentScale(s,lang).value])assert.doesNotMatch(text,/[\p{Script=Han}0-9]/u);
   }
   assert.equal(advance(s),false);assert.ok(choose(s,scene.options[choice].id));assert.equal(choose(s,scene.options[choice].id),false);
   s=migrateV4(JSON.parse(JSON.stringify(s)));assert.ok(validRun(s));assert.ok(advance(s));
  }
  assert.equal(s.stage,'ended');assert.equal(s.ending,'intertidal-cycle');assert.equal(s.records.length,9);assert.equal(times[0],'00:00');assert.equal(times.at(-1),'12:25');
 }
 for(const row of TEXT_CATALOG)for(const lang of ['zh','en','ja','isopod'])assert.notEqual(gameText(row.key,lang),row.key);
});
test('old intertidal records keep their nine dated turns and original ending decoder',()=>{
 const old=createRun('granulosa',42,'intertidal');delete old.intertidalVersion;
 let s=migrateV4(old);assert.equal(s.intertidalLegacy,true);assert.equal(environmentScale(s),null);assert.equal(habitatConfig(s).tides[1],72);
 for(let i=0;i<9;i++){assert.ok(choose(s,'water-wait'));assert.ok(advance(s))}assert.equal(s.ending,'intertidal-calm');
});
test('reduced motion preserves tide, gait, wider high-water routes and wet refuges',()=>{
 const s=createRun('granulosa',42,'intertidal'),actors=makeIndividuals(s.cohort);
 const run=n=>{for(let i=0;i<n;i++)stepIntertidal(actors,{state:s,dt:.1,reduced:true})};
 run(400);const low=Math.min(...actors.map(a=>a.y)),phase=actors[0].phase;
 s.tide=94;run(1000);assert.ok(intertidalSurface(s)<50);assert.ok(Math.min(...actors.map(a=>a.y))<low-80);assert.ok(actors[0].phase>phase);
 s.tide=24;run(400);assert.ok(actors.every(a=>a.y>=intertidalSurface(s)+11&&a.y<=405));
 const g={},a=[],b=[];s.tide=94;run(400);drawIntertidalLife(g,s,1,(...p)=>a.push(p));drawIntertidalLife(g,s,2,(...p)=>b.push(p));assert.ok(a.length>0);assert.notDeepEqual(a,b);
});

test('new intertidal taxa are playable, appended and keep notebook prose separate from dossiers',async()=>{
 const {SPECIES,speciesById}=await import('../isopoda/species-registry.mjs');
 const {localizedAnnotationLines}=await import('../isopoda/locales/annotations.mjs');
 const {drawCohort}=await import('../isopoda/collection.mjs');
 const {sources}=await import('../isopoda/sources-registry.mjs');
 const ids=habitatConfig('intertidal').species;assert.equal(ids.length,7);
 for(const id of ids){
  const p=speciesById(id);assert.ok(p.profile.scientificNotes?.length);assert.ok(p.evidenceIds.every(id=>sources.some(s=>s.id===id)));
  for(const lang of ['zh','en','ja','isopod']){
   const lines=localizedAnnotationLines(p,lang,p.notes);assert.equal(lines.length,2);
   if(lang!=='isopod')assert.doesNotMatch(lines.join(' '),/我们|\b(?:We|we|I|Our|our)\b|私たち|わたしたち|私|并不需要|最大|盐度梯度|雄体|雌体|\bmm\b/);
   else assert.doesNotMatch(lines.join(' '),/[\p{Script=Han}]/u);
  }
 }
 assert.deepEqual(SPECIES.slice(65,67).map(s=>s.id),['albifrons','hirsuta']);
 const drawn=new Set();for(let i=0;i<160;i++)for(const c of drawCohort({unlocked:[],draws:0},i,'intertidal'))drawn.add(c.species);
 for(const id of ids)assert.ok(drawn.has(id),id+' can be collected');
 const j=speciesById('albifrons'),c=speciesById('hirsuta');assert.ok(j.visual.body.convexity<c.visual.body.convexity);assert.equal(c.visual.uropods.ramiPerUropod,1);
 for(const id of ['albifrons','hirsuta']){
  let s=createRun(id,91,'intertidal');for(let i=0;i<9;i++){assert.ok(choose(s,ensureScene(s).options[1].id));s=migrateV4(JSON.parse(JSON.stringify(s)));assert.ok(validRun(s));assert.ok(advance(s))}assert.equal(s.ending,'intertidal-cycle');
 }
});

test('emerged barnacle refuges retain hirsuta while albifrons follows retained shallow water',()=>{
 const s=createRun('hirsuta',42,'intertidal'),group=makeIndividuals(s.cohort);group[1].species='albifrons';
 const run=n=>{for(let i=0;i<n;i++)stepIntertidal(group,{state:s,dt:.1,reduced:true})};
 run(400);assert.ok(group[0].y<intertidalSurface(s)-20);assert.ok(group[1].y>intertidalSurface(s));
 const p=group[0].phase;s.tide=94;run(800);s.tide=24;run(800);
 assert.ok(group[0].y<intertidalSurface(s)-20);assert.ok(group[1].y>=intertidalSurface(s));assert.ok(group[0].phase>p);
});


test('new rock-pool draws always contrast emerged refuges with aquatic taxa, with seven persistent individuals',async()=>{
 const {drawCohort,drawSpecies,restoreCollection}=await import('../isopoda/collection.mjs');
 const allowed=new Set(habitatConfig('intertidal').species),counts=new Set();
 for(const unlocked of [[],[...allowed]])for(let seed=0;seed<1000;seed++){
  const c=drawCohort({unlocked,draws:seed},seed,'intertidal'),taxa=new Set(c.map(x=>x.species));
  assert.equal(c.length,7);assert.equal(taxa.size,2);assert.ok(taxa.has('hirsuta'));counts.add(taxa.size);assert.ok(c.every(x=>allowed.has(x.species)));
 }
 assert.deepEqual([...counts].sort(),[2]);
 // A previously saved three-taxon cohort is not silently redrawn on reload.
 const old=createRun('granulosa',92,'intertidal');old.cohort[1].species='serratum';old.cohort[2].species='pelagica';
 assert.deepEqual(migrateV4(old).cohort,old.cohort);
 assert.ok(Array.from({length:100},(_,seed)=>drawCohort({unlocked:[],draws:0},seed,'terrestrial')).some(c=>new Set(c.map(x=>x.species)).size===3));
});
test('accelerated low-tide bouts vary independently while aquatic animals remain submerged',()=>{
 const s=createRun('granulosa',87,'intertidal'),group=makeIndividuals(s.cohort),destinations=new Set(),durations=new Set();
 for(let i=0;i<1200;i++){stepIntertidal(group,{state:s,dt:.1,speed:4});for(const a of group){assert.ok(a.y>=intertidalSurface(s));const r=a.tideRoute;destinations.add(`${r.x.toFixed(1)},${r.y.toFixed(1)}`);durations.add(r.until.toFixed(2))}}
 assert.ok(destinations.size>50);assert.ok(durations.size>50);
});


test('interleaved emerged residents use all three barnacle patches and explore locally',async()=>{
 const {drawCohort}=await import('../isopoda/collection.mjs');
 for(const seed of [17,42,88,133]){
  const s=createRun('hirsuta',seed,'intertidal');s.cohort=drawCohort({unlocked:[],draws:0},seed,'intertidal');
  const group=makeIndividuals(s.cohort),residents=group.filter(a=>a.species==='hirsuta'),positions=residents.map(()=>[]);
  for(let i=0;i<1000;i++){stepIntertidal(group,{state:s,dt:.1,speed:4});residents.forEach((a,j)=>positions[j].push([a.x,a.y]));assert.equal(new Set(residents.map(a=>a.tideRoute.anchor.id)).size,3)}
  for(const path of positions){assert.ok(Math.max(...path.map(p=>p[0]))-Math.min(...path.map(p=>p[0]))>12);assert.ok(Math.max(...path.map(p=>p[1]))-Math.min(...path.map(p=>p[1]))>8)}
  for(const a of residents)assert.ok(a.y<intertidalSurface(s));
 }
});
