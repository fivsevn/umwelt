import test from 'node:test';
import assert from 'node:assert/strict';
import {HABITATS,habitatConfig,eligibleSpecies,cycleHabitat,habitatLayoutFilename} from '../isopoda/habitats.mjs';
import {createRun,migrateV4,validRun,ensureScene,choose,advance} from '../isopoda/engine.mjs';
import {SPECIES} from '../isopoda/species-registry.mjs';
import {drawCohort} from '../isopoda/collection.mjs';
import {environmentFor} from '../isopoda/environment.mjs';
import {gameText} from '../isopoda/locales/game.mjs';
import {AQUATIC_ENDINGS} from '../isopoda/aquatic-story.mjs';
import {ABYSSAL_NODES,ABYSSAL_ENDING_DATA} from '../isopoda/data/habitats/abyssal-dialogue.mjs';
import {stepAquatic} from '../isopoda/scenery/aquatic.mjs';
import {FRESHWATER_STAGE_LAYOUTS,FRESHWATER_STAGE_META} from '../isopoda/scenery/freshwater-stages.mjs';
import {sources} from '../isopoda/sources-registry.mjs';
const languages=['zh','en','ja','isopod'];
test('aquatic habitat order follows the fresh-to-deep-sea gradient',()=>{
 assert.deepEqual(HABITATS.filter(h=>h.aquatic).map(h=>h.id),['freshwater','groundwater','estuary','intertidal','sandy-surf','shallow-marine','abyssal','petri-dish']);
});

test('habitat layout downloads use stable descriptive scene filenames',()=>{
 const expected={
  forest:'habitat-layout-forest-litter.json',
  freshwater:'habitat-layout-freshwater-pool.json',
  groundwater:'habitat-layout-limestone-groundwater-cave.json',
  estuary:'habitat-layout-brackish-estuary.json',
  intertidal:'habitat-layout-intertidal-rock-pool.json',
  'sandy-surf':'habitat-layout-sandy-surf-zone.json',
  'shallow-marine':'habitat-layout-nearshore-seaweed-bed.json',
  abyssal:'habitat-layout-abyssal-plain.json',
  'petri-dish':'habitat-layout-asimovs-dish.json'
 };
 for(const [scene,filename] of Object.entries(expected))assert.equal(habitatLayoutFilename(scene),filename,scene);
});

test('all configured habitats complete their full duration with eligible animals and localized distinct scenes',()=>{
 for(const h of HABITATS){
  const cohort=drawCohort({unlocked:[],draws:0},901,h.id),s=createRun(cohort[0].species,901,h.id);s.cohort=cohort;
  assert.ok(validRun(s));assert.ok(cohort.every(c=>eligibleSpecies(SPECIES.find(p=>p.id===c.species),h.id)));
  const scenes=new Set();let turns=0;const expectedTurns=h.turns||h.days*3;
  while(s.stage!=='ended'){
   const scene=ensureScene(s);scenes.add(scene.text);
   if(h.aquatic)for(const lang of languages)for(const key of [scene.text,...scene.options.flatMap(o=>[o.label,o.text])]){const text=gameText(key,lang);assert.ok(text&&!text.startsWith('water:')&&!text.startsWith('abyssal:'),key);if(lang==='en'||lang==='ja')assert.notEqual(text,gameText(key,'zh'))}
   assert.ok(choose(s,scene.options[turns%scene.options.length].id));assert.ok(advance(s));turns++;assert.ok(turns<=expectedTurns);assert.ok(validRun(s));
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
test('tides advance in tidal habitats and freshwater advances material state without day-night time',()=>{
 const s=createRun('serratum',1,'intertidal'),tides=[];
 while(s.stage!=='ended'){tides.push(s.tide);choose(s,'water-wait');advance(s)}assert.ok(new Set(tides).size>=6);
 const fresh=createRun('aquaticus',1,'freshwater'),stages=[],beats=[],detritus=[];
 while(fresh.stage!=='ended'){const scene=ensureScene(fresh);stages.push(scene.materialStage);beats.push(scene.materialBeat);detritus.push(fresh.detritus);assert.ok(choose(fresh,scene.options[0].id));assert.ok(advance(fresh))}
 assert.equal(fresh.day,1);assert.equal(fresh.period,0);
 assert.deepEqual(stages,[0,0,1,1,2,2,3,3,4,4]);assert.deepEqual(beats,[0,1,0,1,0,1,0,1,0,1]);assert.deepEqual(detritus,[55,55,62,62,70,70,78,78,64,64]);
});
test('groundwater uses four untimed connectivity pulses and topology-based endings',()=>{
 const metricRun=createRun('cavaticus',37,'groundwater'),metrics=[];let turns=0;
 while(metricRun.stage!=='ended'){
  const scene=ensureScene(metricRun);assert.equal(scene.kind,'groundwater-pulse');assert.equal(scene.pulseIndex,turns);metrics.push([metricRun.connectivity,metricRun.seepage,metricRun.input]);
  const option=scene.options.find(o=>o.lens==='medium');assert.ok(option);assert.ok(choose(metricRun,option.id));assert.ok(advance(metricRun));turns++;
 }
 assert.equal(turns,4);assert.equal(metricRun.day,1);assert.equal(metricRun.period,0);assert.equal(metricRun.ending,'groundwater-medium');
 assert.deepEqual(metrics,[[18,16,4],[36,48,5],[76,66,8],[68,74,72]]);
 for(const [lens,ending] of [['body','groundwater-body'],['limit','groundwater-limit']]){
  const s=createRun('cavaticus',41,'groundwater');while(s.stage!=='ended'){const scene=ensureScene(s),option=scene.options.find(o=>o.lens===lens);assert.ok(option);assert.ok(choose(s,option.id));assert.ok(advance(s))}assert.equal(s.ending,ending);
 }
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
 for(const h of HABITATS.filter(h=>h.aquatic&&!h.dialogue&&!['freshwater','groundwater'].includes(h.id)))for(const [choice,kind] of [['water-adjust','care'],['water-wait','calm'],['water-record','trace']]){
  const s=createRun(h.species[0],37,h.id);while(s.stage!=='ended'){choose(s,choice);advance(s)}assert.equal(s.ending,h.id+'-'+kind);
 }
 for(const [strategy,kind] of [['relation','care'],['object','trace'],['mixed','calm']]){
  const s=createRun('aquaticus',37,'freshwater');let turn=0;
  while(s.stage!=='ended'){
   const scene=ensureScene(s);let option;
   if(strategy==='relation')option=scene.options.find(o=>o.lens==='relation')||scene.options[0];
   else if(strategy==='object')option=scene.options.find(o=>o.lens==='object')||scene.options[0];
   else {const desired=turn%2?'object':'relation';option=scene.options.find(o=>o.lens===desired)||scene.options[0]}
   assert.ok(choose(s,option.id));assert.ok(advance(s));turn++;
  }
  assert.equal(s.ending,'freshwater-'+kind);
 }
 const abyssal=habitatConfig('abyssal'),validIds=new Set(Object.keys(ABYSSAL_ENDING_DATA));
 const samePath=[];
 for(const metric of [null,'restraint','interpretation','attention']){
  const s=createRun(abyssal.species[0],37,abyssal.id);if(metric)s[metric]=50;
  while(s.stage!=='ended'){const scene=ensureScene(s);assert.ok(choose(s,scene.options[0].id));advance(s)}
  assert.equal(s.records.filter(r=>r.kind==='abyssal-dialogue').length,abyssal.turns);
  assert.match(s.ending,/^abyssal-record-/);assert.ok(validIds.has(s.ending));samePath.push(s.ending);
 }
 assert.equal(new Set(samePath).size,1);
 assert.equal(Object.keys(ABYSSAL_ENDING_DATA).filter(id=>id.startsWith('abyssal-record-')).length,64);
 const s=createRun(abyssal.species[0],91,abyssal.id);
 while(s.stage!=='ended'){const scene=ensureScene(s);assert.ok(choose(s,scene.options[(s.records.length+1)%3].id));advance(s)}
 assert.match(s.ending,/^abyssal-record-/);assert.ok(validIds.has(s.ending));
 assert.equal(s.day,1);
 assert.equal(s.period,0);
});

test('abyssal story is direct narrative without translation-layer disclaimers',()=>{
 const visible=JSON.stringify({nodes:ABYSSAL_NODES,endings:ABYSSAL_ENDING_DATA});
 assert.doesNotMatch(visible,/翻译层|虚构.{0,4}翻译|translation layer|fictional translation|翻訳層/u);
 assert.equal(ABYSSAL_NODES.length,habitatConfig('abyssal').turns);
 assert.ok(ABYSSAL_NODES.every(node=>node.options.length===3));
 assert.ok(Object.keys(ABYSSAL_ENDING_DATA).length>=10);
 assert.doesNotMatch(JSON.stringify(ABYSSAL_NODES),/三天|第二天|第三天|观察时段|我们/u);
 const archiveNote=SPECIES.find(p=>p.id==='giganteus').literature.lines.join('');
 assert.doesNotMatch(archiveNote,/我们|大王具足虫|Bathynomus giganteus/u);
});

test('aquatic presets draw distinct deterministic finite pixel scenes and tide changes water',async()=>{
 const {drawAquaticBase,drawAquaticWater}=await import('../isopoda/scenery/aquatic.mjs');
 const render=(draw,s)=>{const calls=[],ctx={fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isFinite));calls.push([x,y,w,h,this.fillStyle])}};draw(ctx,s,0);return calls};
 const scenes=[];
 for(const h of HABITATS.filter(h=>h.aquatic)){const s=createRun(h.species[0],7,h.id),a=render(drawAquaticBase,s);assert.deepEqual(a,render(drawAquaticBase,s));scenes.push(JSON.stringify(a));assert.ok(render(drawAquaticWater,s).length>0)}
 assert.equal(new Set(scenes).size,HABITATS.filter(h=>h.aquatic).length);
 const s=createRun('serratum',8,'intertidal');assert.notDeepEqual(render(drawAquaticWater,s),render(drawAquaticWater,{...s,tide:94}));
});


test('freshwater material layouts use the five authored filename-mapped scenes',()=>{
 assert.equal(FRESHWATER_STAGE_LAYOUTS.length,5);assert.equal(FRESHWATER_STAGE_META.length,5);
 assert.deepEqual(FRESHWATER_STAGE_LAYOUTS.map(layout=>layout.objects.length),[24,29,35,36,37]);
 assert.deepEqual(FRESHWATER_STAGE_LAYOUTS.map(layout=>layout.materialStage),[0,1,2,3,4]);
 assert.deepEqual(FRESHWATER_STAGE_LAYOUTS.map(layout=>layout.metadata.stageId),FRESHWATER_STAGE_META.map(stage=>stage.id));
 assert.ok(FRESHWATER_STAGE_LAYOUTS[0].objects.some(object=>object.id==='material-leaf-main'&&object.type==='leaf-broad-01'&&Math.abs(object.x-248.69859126103347)<1e-9));
 assert.ok(FRESHWATER_STAGE_LAYOUTS[1].objects.some(object=>object.id==='instance-5'&&object.type==='leaf-broken-01'));
 assert.equal(FRESHWATER_STAGE_LAYOUTS[3].objects.filter(object=>object.type==='leaf-skeleton-01').length,2);
 assert.equal(FRESHWATER_STAGE_LAYOUTS[4].objects.filter(object=>object.type==='freshwater-detritus-01').length,5);
 assert.equal(FRESHWATER_STAGE_LAYOUTS[4].objects.some(object=>object.type==='bark-log-01'),false);
});


test('freshwater suspended material stage renders moving leaf fragments',async()=>{
 const {drawAquaticWater}=await import('../isopoda/scenery/aquatic.mjs');
 const s=createRun('aquaticus',57,'freshwater');
 for(let i=0;i<6;i++){const scene=ensureScene(s);assert.equal(scene.materialStage,Math.floor(i/2));assert.ok(choose(s,scene.options[0].id));assert.ok(advance(s))}
 const scene=ensureScene(s);assert.equal(scene.materialStage,3);assert.equal(scene.materialBeat,0);
 const calls=[],ctx={fillStyle:'',fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isFinite));calls.push([x,y,w,h,this.fillStyle])}};
 assert.doesNotThrow(()=>drawAquaticWater(ctx,s,2,{drawPlants:false}));
 assert.ok(calls.some(([, ,w,h,color])=>w>=3&&h===2&&['#6b5738','#806846'].includes(color)),'stage IV should include visible drifting leaf fragments');
});


test('freshwater keeps ten observation beats with four choices and animation metadata',()=>{
 const s=createRun('aquaticus',73,'freshwater'),seen=[];
 while(s.stage!=='ended'){
  const scene=ensureScene(s);seen.push([scene.materialStage,scene.materialBeat,scene.options.length]);
  assert.equal(scene.options.length,4);assert.ok(scene.options.every(o=>o.animation&&['object','relation'].includes(o.lens)));
  assert.ok(choose(s,scene.options[0].id));assert.ok(advance(s));
 }
 assert.deepEqual(seen,[[0,0,4],[0,1,4],[1,0,4],[1,1,4],[2,0,4],[2,1,4],[3,0,4],[3,1,4],[4,0,4],[4,1,4]]);
 assert.equal(s.records.filter(r=>r.kind==='freshwater-material').length,10);
 assert.ok(s.records.every(r=>r.animation&&r.lens));
});

test('freshwater narrative reactions visibly steer the selected observation without changing material stage',()=>{
 const s=createRun('aquaticus',81,'freshwater');ensureScene(s);
 const actor={id:0,offset:0,x:40,y:60,a:0,phase:0,speed:.68,interactionState:null,activity:'crawl',hidden:false,occlusion:0,posture:'normal',molt:'none',moving:true};
 const before=Math.hypot(actor.x-248.69859126103347,actor.y-234.42874491852993);
 stepAquatic([actor],{state:s,time:1,dt:.1,reduced:false,reaction:{id:'fw-edge',selected:[0],age:.4}});
 const after=Math.hypot(actor.x-248.69859126103347,actor.y-234.42874491852993);
 assert.ok(after<before);assert.equal(ensureScene(s).materialStage,0);
});


test('every freshwater option survives feedback reload and resolves in all four languages',()=>{
 const visited=new Set(),sequences=[];
 for(let slot=0;slot<4;slot++){
  let s=createRun('aquaticus',93,'freshwater');const stages=[];
  while(s.stage!=='ended'){
   const scene=ensureScene(s),option=scene.options[slot];visited.add(option.id);
   stages.push([scene.materialStage,scene.materialBeat,s.detritus,s.day,s.period]);
   if(scene.materialStage===0&&scene.materialBeat===1)assert.ok(scene.text.includes(':after:'));
   for(const lang of languages)for(const key of [scene.text,option.label,option.text]){
    const resolved=gameText(key,lang);assert.ok(resolved&&resolved!==key&&!resolved.includes('water:'),`${lang}: ${key}`);
   }
   assert.ok(choose(s,option.id));
   const restored=JSON.parse(JSON.stringify(s));assert.ok(validRun(restored));
   assert.equal(restored.records.at(-1).choice,option.id);
   assert.equal(restored.records.at(-1).animation,option.animation);
   s=restored;assert.ok(advance(s));
  }
  assert.equal(s.records.length,10);assert.match(s.ending,/^freshwater-(care|calm|trace)$/);
  sequences.push(stages);
 }
 assert.equal(visited.size,40);
 for(const sequence of sequences)assert.deepEqual(sequence,sequences[0]);
});
