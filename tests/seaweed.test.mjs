import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,ensureScene,choose,advance,migrateV4,recordDirectInteraction,validRun} from '../isopoda/engine.mjs';
import {drawCohort,restoreCollection} from '../isopoda/collection.mjs';
import {environmentScale} from '../isopoda/observation-header.mjs';
import {gameText} from '../isopoda/locales/game.mjs';
import {seaweedIndex,seaweedProgress} from '../isopoda/data/habitats/seaweed-observation.mjs';
import {sceneObjects,layoutForHabitat} from '../isopoda/scenery/index.mjs';
import {kelpGeometry,surfacePoint,kelpDepth,visibleKelpCell,hitKelp,drawKelp} from '../isopoda/scenery/kelp-geometry.mjs';
import {createSeaweedBed,seaweedFrame,stageSeaweed,stepSeaweed,beginSeaweedHold,moveSeaweedHold,endSeaweedHold} from '../isopoda/scenery/shallow-marine.mjs';
const items=sceneObjects(layoutForHabitat('shallow-marine'));
test('nine seaweed observations finish, localize and preserve legacy saves',()=>{
 for(let branch=0;branch<3;branch++){
  const s=createRun('balthica',77,'shallow-marine');
  for(let i=0;i<9;i++){
   const scene=ensureScene(s);assert.equal(seaweedIndex(s),i);assert.equal(scene.options.length,3);
   for(const lang of ['zh','en','ja','isopod'])for(const key of [scene.title,scene.text,...scene.options.flatMap(o=>[o.label,o.text])])assert.ok(!gameText(key,lang).includes('kelp:'),key);
   s.seaweedEvidence={crossed:1,hidden:1,plucked:i%2};
   assert.ok(choose(s,scene.options[branch].id));assert.ok(!gameText(s.feedback,'en').includes('kelp:'));assert.equal(seaweedIndex(s),i);
   assert.deepEqual(migrateV4(structuredClone(s)).records,s.records);assert.ok(advance(s));assert.ok(validRun(s));
  }
  assert.equal(s.stage,'ended');assert.equal(s.ending,'shallow-marine-observed');assert.equal(seaweedProgress(s),9);
 }
 const legacy=createRun('balthica',18,'shallow-marine');delete legacy.seaweedVersion;legacy.cohort=legacy.cohort.slice(0,7);legacy.day=2;legacy.period=1;legacy.scene=null;
 const copy=migrateV4(legacy);assert.equal(copy.day,2);assert.equal(ensureScene(copy).kind,'aquatic');
});
test('shared geometry keeps base fixed, moves contacts, preserves pixel masks',()=>{
 const item=items.find(o=>o.layered),a=kelpGeometry(item,{time:0}),b=kelpGeometry(item,{time:5,bend:30});
 assert.deepEqual(a.surfaces[0][0],b.surfaces[0][0]);assert.notDeepEqual(a.surfaces[0].at(-1),b.surfaces[0].at(-1));
 for(const [x,y] of b.cells){assert.ok(Number.isInteger(x)&&Number.isInteger(y))}
 const mask=kelpDepth([a]);for(const [x,y] of a.cells.filter(([x,y])=>x>=0&&x<384&&y>=0&&y<430).slice(0,100)){
  assert.equal(visibleKelpCell(mask,x,y,a.z-1),false);assert.equal(visibleKelpCell(mask,x,y,a.z+1),true);
 }
 assert.deepEqual(kelpGeometry(item,{time:5,bend:30}),b);
});
test('attachment follows bent blades and transfers remain continuous for every taxon',()=>{
 for(const species of ['balthica','linearis','emarginata','neglecta','maculosa']){
  const bed=createSeaweedBed(items);seaweedFrame(bed,{});const a={id:0,species,phase:0,interactionState:null};stageSeaweed([a],bed);
  const p=bed.frame.byId.get(a.weed.plant);beginSeaweedHold(bed,p,{x:100});moveSeaweedHold(bed,{x:125});
  stepSeaweed([a],bed,{time:.1,dt:.1,flow:46});const anchor=surfacePoint(bed.frame.byId.get(a.weed.plant).surfaces[a.weed.surface],a.weed.t);
  assert.equal(a.x,anchor.x);assert.equal(a.y,anchor.y);assert.ok(endSeaweedHold(bed));
  let previous={x:a.x,y:a.y};for(let i=2;i<900;i++){
   stepSeaweed([a],bed,{time:i*.08,dt:.08,flow:46});assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y));
   assert.ok(Math.hypot(a.x-previous.x,a.y-previous.y)<8,'no teleport');previous={x:a.x,y:a.y};
  }
  assert.ok(bed.events.crossed>0,species+' must reach neighbouring surfaces');assert.ok(Math.abs(bed.bends.get(p.id)||0)<.05);
 }
});
test('a declared parting is not reported as performed before a drag',()=>{
 const s=createRun('balthica',1,'shallow-marine');choose(s,ensureScene(s).options[0].id);advance(s);
 choose(s,ensureScene(s).options[0].id);assert.match(gameText(s.feedback,'en'),/hand rests beside/);
 assert.equal(s.interactionIntent.hint,'kelp:hint');
 s.seaweedEvidence={plucked:1};recordDirectInteraction(s,{type:'seaweed',point:{x:50,y:50}});
 assert.match(gameText(s.feedback,'en'),/swinging back/);assert.equal(s.interactionIntent,null);assert.ok(s.interactionDiscoveries.seaweed);
 advance(s);while(seaweedIndex(s)<6){choose(s,ensureScene(s).options[0].id);advance(s)}choose(s,ensureScene(s).options[1].id);assert.equal(s.interactionIntent.hint,'');
});

test('seaweed draws two or three taxa, spreads eighteen animals and preserves old cohorts',()=>{
 const collection=restoreCollection(null,null);
 for(let seed=0;seed<80;seed++){
  const cohort=drawCohort(collection,seed,'shallow-marine');assert.equal(cohort.length,18);assert.ok([2,3].includes(new Set(cohort.map(c=>c.species)).size));
  const run=createRun(cohort[0].species,seed,'shallow-marine');run.cohort=cohort;assert.ok(validRun(run));
 }
 const run=createRun('balthica',1,'shallow-marine');run.cohort=run.cohort.slice(0,7);const original=structuredClone(run.cohort),copy=migrateV4(run);assert.equal(copy.cohort.length,18);assert.deepEqual(copy.cohort.slice(0,7),original);
 const bed=createSeaweedBed(items);seaweedFrame(bed);const group=copy.cohort.map((c,id)=>({...c,id,phase:0}));stageSeaweed(group,bed);
 for(const [min,max] of [[0,150],[150,280],[280,430]])assert.ok(group.filter(a=>a.y>=min&&a.y<max).length>=3,'all height bands occupied');
 const first=environmentScale(copy).value;choose(copy,ensureScene(copy).options[0].id);assert.equal(environmentScale(copy).value,first);advance(copy);assert.notEqual(environmentScale(copy).value,first);
});
test('actual blade movement triggers a bounded startle and continuous escape',()=>{
 const bed=createSeaweedBed(items);seaweedFrame(bed);const group=Array.from({length:18},(_,id)=>({id,species:'balthica',phase:0}));stageSeaweed(group,bed);
 const a=group[4],p=bed.frame.byId.get(a.weed.plant),original=p.id;beginSeaweedHold(bed,p,{x:100});
 stepSeaweed(group,bed,{time:.1,dt:.1});assert.equal(a.weed.cue,undefined);
 moveSeaweedHold(bed,{x:125});stepSeaweed(group,bed,{time:.2,dt:.1});assert.equal(a.weed.cue,'!');assert.equal(a.posture,'tucked');delete a.weed.cue;
 stepSeaweed(group,bed,{time:.3,dt:.1});assert.equal(a.weed.cue,undefined);endSeaweedHold(bed);
 for(let i=4;i<60;i++)stepSeaweed(group,bed,{time:i*.1,dt:.1});assert.notEqual(a.weed.plant,original);
});

test('decorative kelp is cached and occludes without accepting attachment or dragging',()=>{
 const bed=createSeaweedBed(items);seaweedFrame(bed);
 assert.equal(bed.items.length,12);assert.equal(bed.scenery.length,7);
 const group=Array.from({length:18},(_,id)=>({id,species:'balthica',phase:0}));stageSeaweed(group,bed);
 const decorations=new Set(bed.scenery.map(p=>p.id)),geometry=bed.scenery.slice(),depth=bed.frame.mask.depth,owners=bed.frame.mask.owners;
 for(let i=0;i<120;i++)stepSeaweed(group,bed,{time:i*.1,dt:.1});
 assert.ok(group.every(a=>!decorations.has(a.weed.plant)&&!decorations.has(a.weed.travel?.plant)));
 assert.equal(bed.frame.mask.depth,depth);assert.equal(bed.frame.mask.owners,owners);
 bed.scenery.forEach((p,i)=>assert.equal(p,geometry[i]));
 const rebuilt=kelpDepth(bed.frame.plants);
 assert.deepEqual(bed.frame.mask,rebuilt,'cached scenery and reused buffers preserve frontmost ownership');
 const decoration=bed.scenery.find(p=>p.cells.some(([x,y])=>x>=0&&x<384&&y>=0&&y<430&&bed.frame.mask.depth[y*384+x]===p.z));
 const [x,y]=decoration.cells.find(([x,y])=>x>=0&&x<384&&y>=0&&y<430&&bed.frame.mask.depth[y*384+x]===decoration.z);
 assert.equal(hitKelp(bed.frame,{x,y}),null,'foreground scenery cannot select a blade behind it');
 assert.equal(visibleKelpCell(bed.frame.mask,x,y,decoration.z-1),false);
});

test('palette batching preserves every blade pixel with only one style change per color',()=>{
 const plant=kelpGeometry(items.find(o=>o.layered)),painted=new Map();let color,changes=0;
 drawKelp({set fillStyle(value){color=value;changes++},fillRect(x,y,w,h){assert.equal(w,1);assert.equal(h,1);painted.set(x+','+y,color)}},plant);
 assert.equal(changes,new Set(plant.cells.map(c=>c[2])).size);
 assert.deepEqual(painted,new Map(plant.cells.map(([x,y,c])=>[x+','+y,c])));
});

test('cached decoration respects original paint order when plant depths tie',()=>{
 const source=items.find(o=>o.layered),active={...source,id:'active',interactive:true},still={...source,id:'still',interactive:false};
 for(const objects of [[active,still],[still,active]]){
  const bed=createSeaweedBed(objects);seaweedFrame(bed);
  assert.deepEqual(bed.frame.mask,kelpDepth(bed.frame.plants));
 }
});
