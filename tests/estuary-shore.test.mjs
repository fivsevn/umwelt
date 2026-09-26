import {sceneInstrument} from '../isopoda/scene-readouts.mjs';
import {environmentScale} from '../isopoda/observation-header.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,ensureScene,choose,advance,migrateV4} from '../isopoda/engine.mjs';
import {shorePoint,shoreTide,shoreRain,shoreProgress,moveShore,shoreText,SHORE_TEXT_CATALOG} from '../isopoda/data/habitats/estuary-shore.mjs';
import {stepShore,shoreLine,shoreLayout,shoreGoby} from '../isopoda/scenery/estuary-shore.mjs';
import {estuaryRecordLine} from '../isopoda/data/narrative/estuary.mjs';
import {validateTextCatalog} from '../isopoda/tools/validate-narrative.mjs';

test('all three banks share four tides; walking preserves time and a reload preserves the selected bank',()=>{
 for(let start=0;start<3;start++){
  let s=createRun('carinata',57,'estuary');s.shorePoint=start;
  for(let turn=0;turn<8;turn++){
   assert.equal(shoreTide(s),turn%4);
   for(const point of [0,1,2,1,start]){
    while(shorePoint(s)!==point)assert.ok(moveShore(s,point-shorePoint(s)));
    assert.equal(shoreProgress(s),turn);assert.equal(shoreTide(s),turn%4);
    s=migrateV4(JSON.parse(JSON.stringify(s)));assert.equal(shorePoint(s),point);
    assert.equal(ensureScene(s).options.length,1);
   }
   assert.ok(choose(s,'shore-watch'));assert.equal(choose(s,'shore-watch'),false);
   const record=s.records.at(-1);assert.equal(record.evidence.point,start);assert.equal(record.evidence.tide,turn%4);
   assert.ok(advance(s));
  }
  assert.equal(s.stage,'ended');assert.equal(s.ending,'estuary-shore');assert.equal(s.records.length,8);
  assert.equal(advance(s),false);assert.equal(moveShore(s,1),false);
 }
});
test('tide physically uncovers the same bank; actors stay near shelter, with gentler continuous reduced motion',()=>{
 for(let point=0;point<3;point++)for(let tide=0;tide<4;tide++){
  const s=createRun('carinata',7,'estuary');s.shorePoint=point;
  for(let i=0;i<tide;i++){choose(s,'shore-watch');advance(s)}
  const actors=Array.from({length:7},(_,seed)=>({seed}));stepShore(actors,{state:s,time:2,reduced:true});
  assert.ok(actors.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.moving));
  const previous=structuredClone(actors);stepShore(actors,{state:s,time:6,reduced:true});assert.notEqual(actors[0].x,previous[0].x);assert.notEqual(actors[0].phase,previous[0].phase);
  assert.ok(actors.filter(a=>!a.hidden).length<=2);
  assert.equal(actors[0].hidden,false,'the protagonist remains observable at high water too');
  if(tide===3)assert.equal(actors.filter(a=>!a.hidden).length,2);
  const layout=shoreLayout(point,tide);assert.equal(layout.background.params.point,point);assert.equal(layout.background.params.tide,tide);
  assert.ok(shoreLine(192,point,3)>shoreLine(192,point,1)+100);
 }
});
test('rain is seeded and infrequent; status uses three numeric scales and one tide description',()=>{
 let rainy=0;
 for(let seed=0;seed<70;seed++){
  const s=createRun('carinata',seed,'estuary');assert.equal(shoreRain(s),false);
  for(let i=0;i<4;i++){choose(s,'shore-watch');advance(s)}
  if(shoreRain(s))rainy++;
  for(const lang of ['zh','en','ja','isopod']){const rows=sceneInstrument(s,lang);assert.equal(rows.length,4);for(const row of rows.slice(0,3))assert.match(row,lang==='isopod'?/[▁-▇]/:/\d/);assert.doesNotMatch(rows[3],/\d|estuary:/);}
  for(const record of s.records)assert.doesNotMatch(estuaryRecordLine(record,'en'),/estuary:|undefined|‰/);
 }
 assert.equal(rainy,10);assert.deepEqual(validateTextCatalog(SHORE_TEXT_CATALOG),[]);
 for(const {key} of SHORE_TEXT_CATALOG)for(const lang of ['zh','en','ja','isopod'])assert.notEqual(shoreText(key,lang),key);
});

test('each bank and tide animates the protagonist and a supporting animal; only walking changes coordinates',()=>{
 const coordinates=new Set();
 for(let point=0;point<3;point++){
  const s=createRun('carinata',57,'estuary');s.shorePoint=point;
  const coordinate=environmentScale(s).value;coordinates.add(coordinate);
  for(let tide=0;tide<4;tide++){
   const actors=[{seed:17},{seed:18}];stepShore(actors,{state:s,time:0});const before=structuredClone(actors);
   stepShore(actors,{state:s,time:4});assert.equal(actors[0].hidden,false);assert.ok(Math.hypot(actors[0].x-before[0].x,actors[0].y-before[0].y)>8);assert.notEqual(actors[0].phase,before[0].phase);
   const fishBefore=shoreGoby(s,0),fishAfter=shoreGoby(s,4);assert.ok(Math.hypot(fishBefore.x-fishAfter.x,fishBefore.y-fishAfter.y)>2);
   assert.equal(environmentScale(s).value,coordinate);choose(s,'shore-watch');advance(s);
  }
 }
 assert.equal(coordinates.size,3);
});
