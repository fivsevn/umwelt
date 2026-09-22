import test from 'node:test';
import assert from 'node:assert/strict';
import {HABITATS,habitatConfig,eligibleSpecies,cycleHabitat} from '../isopoda/habitats.mjs';
import {createRun,migrateV4,validRun,ensureScene,choose,advance} from '../isopoda/engine.mjs';
import {SPECIES} from '../isopoda/species-registry.mjs';
import {drawCohort} from '../isopoda/collection.mjs';
import {environmentFor} from '../isopoda/environment.mjs';
import {gameText} from '../isopoda/locales/game.mjs';
import {AQUATIC_ENDINGS} from '../isopoda/aquatic-story.mjs';
import {ABYSSAL_NODES,ABYSSAL_ENDING_DATA} from '../isopoda/data/habitats/abyssal-dialogue.mjs';
import {stepAquatic} from '../isopoda/scenery/aquatic.mjs';
import {sources} from '../isopoda/sources-registry.mjs';
const languages=['zh','en','ja','isopod'];
test('all configured habitats complete their full duration with eligible animals and localized distinct scenes',()=>{
 for(const h of HABITATS){
  const cohort=drawCohort({unlocked:[],draws:0},901,h.id),s=createRun(cohort[0].species,901,h.id);s.cohort=cohort;
  assert.ok(validRun(s));assert.ok(cohort.every(c=>eligibleSpecies(SPECIES.find(p=>p.id===c.species),h.id)));
  const scenes=new Set();let turns=0;const expectedTurns=h.turns||h.days*3;
  while(s.stage!=='ended'){
   const scene=ensureScene(s);scenes.add(scene.text);
   if(h.aquatic)for(const lang of languages)for(const key of [scene.text,...scene.options.flatMap(o=>[o.label,o.text])]){const text=gameText(key,lang);assert.ok(text&&!text.startsWith('water:')&&!text.startsWith('abyssal:'),key);if(lang==='en'||lang==='ja')assert.notEqual(text,gameText(key,'zh'))}
   assert.ok(choose(s,scene.options[turns%3].id));assert.ok(advance(s));turns++;assert.ok(turns<=expectedTurns);assert.ok(validRun(s));
  }
  assert.equal(turns,expectedTurns);if(h.aquatic){assert.equal(scenes.size,expectedTurns);assert.ok(s.ending.startsWith(h.id));assert.equal(environmentFor(s).habitatId,h.id)}
 }
});
test('v4 migration preserves records, scene, environment and cohort without changing input',()=>{
 const old=createRun('dairy',44);delete old.habitatId;ensureScene(old);choose(old,old.scene.options[0].id);const before=structuredClone(old);
 const migrated=migrateV4(old);assert.equal(migrated.habitatId,'terrestrial');delete migrated.habitatId;assert.deepEqual(migrated,before);assert.deepEqual(old,before);
 assert.equal(migrateV4({...old,habitatId:'unknown'}),null);
});
test('preview switching never changes the existing save, and selected environment controls new draw',()=>{
 const saved=createRun('dairy',9);const before=JSON.stringify(saved);let selected='terrestrial';
 for(let i=0;i<4;i++){selected=cycleHabitat(selected,1);const cohort=drawCohort({unlocked:[],draws:0},i,selected);const run=createRun(cohort[0].species,i,selected);assert.equal(run.habitatId,selected);assert.equal(JSON.stringify(saved),before)}
});
test('tides advance when waiting and water quality responds to choices',()=>{
 const s=createRun('serratum',1,'intertidal'),tides=[];
 while(s.stage!=='ended'){tides.push(s.tide);choose(s,'water-wait');advance(s)}assert.ok(new Set(tides).size>=6);
 const a=createRun('aquaticus',1,'freshwater'),b=structuredClone(a);choose(a,'water-adjust');choose(b,'water-wait');assert.ok(a.oxygen>b.oxygen);assert.ok(a.flow>b.flow);
});
test('aquatic locomotion tuning stays hidden, differentiated and affects animation pace',()=>{
 for(const h of HABITATS.filter(h=>h.aquatic)){
  const speeds=h.species.map(id=>SPECIES.find(p=>p.id===id).speed);
  assert.ok(speeds.every(v=>Number.isFinite(v)&&v>=.55&&v<=1.45));
  if(h.species.length>1)assert.ok(new Set(speeds).size>=2);else{assert.equal(h.dialogue,true);assert.equal(h.cohortSize,1)}
 }
 const state=createRun('aquaticus',5,'freshwater');
 const actor=speed=>({id:0,offset:0,x:180,y:220,a:0,phase:0,speed,interactionState:null,activity:'crawl',hidden:false,occlusion:0,posture:'normal',molt:'none',moving:true});
 const slow=actor(.42),fast=actor(.92);
 stepAquatic([slow],{state,time:0,dt:.1,reduced:false});
 stepAquatic([fast],{state,time:0,dt:.1,reduced:false});
 assert.ok(fast.x-180>slow.x-180);
});

test('aquatic sources, species counts and all ending translations are complete',()=>{
 for(const h of HABITATS.filter(h=>h.aquatic)){if(h.dialogue)assert.equal(h.species.length,1);else assert.ok(h.species.length>=3&&h.species.length<=7);for(const id of h.species){const p=SPECIES.find(p=>p.id===id);assert.ok(p.provenance.renderLimitation);assert.ok(p.taxonomy.acceptedScientificName);assert.ok(p.evidenceIds.every(id=>sources.some(s=>s.id===id)));assert.equal(eligibleSpecies(p,'terrestrial'),false)}}
 assert.equal(eligibleSpecies(SPECIES.find(p=>p.id==='uniramea'),'shallow-marine'),false);
 for(const e of AQUATIC_ENDINGS)for(const lang of languages)for(const key of [e.title,e.body,e.line])assert.ok(!gameText(key,lang).startsWith('water:'));
});

test('aquatic endings resolve after each habitat completes its configured observation sequence',()=>{
 for(const h of HABITATS.filter(h=>h.aquatic&&!h.dialogue))for(const [choice,kind] of [['water-adjust','care'],['water-wait','calm'],['water-record','trace']]){
  const s=createRun(h.species[0],37,h.id);while(s.stage!=='ended'){choose(s,choice);advance(s)}assert.equal(s.ending,h.id+'-'+kind);
 }
 const abyssal=habitatConfig('abyssal'),validIds=new Set(Object.keys(ABYSSAL_ENDING_DATA));
 for(const [metric,ending] of [['restraint','abyssal-untranslated'],['interpretation','abyssal-voice'],['attention','abyssal-field']]){
  const s=createRun(abyssal.species[0],37,abyssal.id);s[metric]=50;
  while(s.stage!=='ended'){const scene=ensureScene(s);assert.ok(choose(s,scene.options[0].id));advance(s)}
  assert.equal(s.records.filter(r=>r.kind==='abyssal-dialogue').length,abyssal.turns);
  assert.equal(s.ending,ending);
 }
 const s=createRun(abyssal.species[0],91,abyssal.id);
 while(s.stage!=='ended'){const scene=ensureScene(s);assert.ok(choose(s,scene.options[(s.records.length+1)%3].id));advance(s)}
 assert.ok(validIds.has(s.ending));
});

test('abyssal story is direct narrative without translation-layer disclaimers',()=>{
 const visible=JSON.stringify({nodes:ABYSSAL_NODES,endings:ABYSSAL_ENDING_DATA});
 assert.doesNotMatch(visible,/翻译层|虚构.{0,4}翻译|translation layer|fictional translation|翻訳層/u);
 assert.equal(ABYSSAL_NODES.length,12);
 assert.ok(ABYSSAL_NODES.every(node=>node.options.length===3));
 assert.ok(Object.keys(ABYSSAL_ENDING_DATA).length>=10);
 assert.doesNotMatch(JSON.stringify(ABYSSAL_NODES),/三天|第二天|第三天|观察时段/u);
});

test('aquatic presets draw distinct deterministic finite pixel scenes and tide changes water',async()=>{
 const {drawAquaticBase,drawAquaticWater}=await import('../isopoda/scenery/aquatic.mjs');
 const render=(draw,s)=>{const calls=[],ctx={fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isFinite));calls.push([x,y,w,h,this.fillStyle])}};draw(ctx,s,0);return calls};
 const scenes=[];
 for(const h of HABITATS.filter(h=>h.aquatic)){const s=createRun(h.species[0],7,h.id),a=render(drawAquaticBase,s);assert.deepEqual(a,render(drawAquaticBase,s));scenes.push(JSON.stringify(a));assert.ok(render(drawAquaticWater,s).length>0)}
 assert.equal(new Set(scenes).size,HABITATS.filter(h=>h.aquatic).length);
 const s=createRun('serratum',8,'intertidal');assert.notDeepEqual(render(drawAquaticWater,s),render(drawAquaticWater,{...s,tide:94}));
});
