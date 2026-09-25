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
