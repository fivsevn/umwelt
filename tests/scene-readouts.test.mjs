import test from 'node:test';
import assert from 'node:assert/strict';
import {HABITATS} from '../isopoda/habitats.mjs';
import {createRun,ensureScene,choose,advance} from '../isopoda/engine.mjs';
import {sceneInstrument} from '../isopoda/scene-readouts.mjs';
import {environmentScale} from '../isopoda/observation-header.mjs';
import {microscope} from '../isopoda/scenery/petri.mjs';
import {HABITAT_REFERENCES} from '../isopoda/data/habitats/references.mjs';

test('eight habitats retain three numeric scales and one qualitative state across the complete story and reload',()=>{
 for(const h of HABITATS.filter(h=>h.id!=='estuary')){
  const s=createRun(h.species?.[0]||'dairy',37,h.id),times=new Set();let turns=0;
  while(s.stage!=='ended'){
   const scene=ensureScene(s);
   for(const lang of ['zh','en','ja','isopod']){
    const rows=sceneInstrument(s,lang);assert.equal(rows.length,4,h.id);
    for(const text of rows.slice(0,3)){assert.match(text,/\d/,h.id);assert.doesNotMatch(text,/NaN|undefined/)}
    assert.doesNotMatch(rows[3],/\d/);assert.deepEqual(sceneInstrument(JSON.parse(JSON.stringify(s)),lang),rows);
    const clock=environmentScale(s,lang);if(clock&&lang==='en')times.add(clock.value);
   }
   if(h.id==='petri-dish')microscope(s).completed[(s.day-1)*3+s.period]=true;
   choose(s,scene.options[0].id);
   const feedback=environmentScale(s);assert.deepEqual(environmentScale(JSON.parse(JSON.stringify(s))),feedback);
   advance(s);assert.ok(++turns<=21);
  }
  if(!['terrestrial','petri-dish'].includes(h.id))assert.ok(times.size>1,h.id+' dynamic time/space');
  const refs=HABITAT_REFERENCES[h.id];assert.ok(refs.entries.length);assert.equal(new Set(refs.entries.map(e=>e.sourceId)).size,refs.entries.length);
 }
 assert.equal(sceneInstrument(createRun('hookeri',37,'estuary')),null);
});
test('petri settings respond to each dial and distinguish inactive presets from optical focus',()=>{
 const s=createRun('maculosa',1,'petri-dish'),m=microscope(s);
 assert.match(sceneInstrument(s)[1],/预设/);m.mode=true;
 const before=sceneInstrument(s);m.focus=50;assert.notEqual(sceneInstrument(s)[1],before[1]);assert.equal(sceneInstrument(s)[3],'合焦');
 m.magnification=8;assert.equal(sceneInstrument(s)[3],'失焦');m.focus=60;m.light=42;
 assert.match(sceneInstrument(s)[0],/8×/);assert.match(sceneInstrument(s)[2],/42%/);assert.equal(sceneInstrument(s)[3],'合焦');
});
