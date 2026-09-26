import test from 'node:test';import assert from 'node:assert/strict';
import {microscope,checkMicroscope,petriReady,focusTarget,stepPetri,DISH,beginPetriStep,noteMicroscopeAction} from '../isopoda/scenery/petri.mjs';
import {PETRI_STEPS,petriText,petriIndex} from '../isopoda/data/habitats/petri-observation.mjs';
import {createRun,ensureScene,choose,advance,migrateV4} from '../isopoda/engine.mjs';
import {makeIndividuals} from '../isopoda/behaviors.mjs';
import {habitatConfig} from '../isopoda/habitats.mjs';
import {drawCohort} from '../isopoda/collection.mjs';
test('dish always draws one small specimen and keeps it well inside the glass',()=>{
 for(const id of habitatConfig('petri-dish').species){const s=createRun(id,42,'petri-dish'),group=makeIndividuals(s.cohort);assert.equal(s.cohort.length,1);assert.equal(drawCohort({unlocked:[],draws:0},42,'petri-dish').length,1);assert.ok(habitatConfig(s).actorScale<1);
  group[0].x=-100;group[0].y=600;for(let n=0;n<12000;n++){stepPetri(group,{state:s,time:n*.1,dt:.1});assert.ok(Math.hypot(group[0].x-DISH.x,group[0].y-DISH.y)<=DISH.radius+.001)}
 }
});
test('microscope actions, not choices, unlock required observations and survive reload',()=>{
 const s=createRun('maculosa',42,'petri-dish');let steps=0;
 while(s.stage!=='ended'){
  const scene=ensureScene(s),m=beginPetriStep(s);if(scene.requirement)assert.equal(choose(s,'petri-note'),false);
  if(scene.requirement==='enter')m.mode=true;
  if(scene.requirement==='focus'){m.focus=50;noteMicroscopeAction(s,'focus');checkMicroscope(s,false);assert.equal(petriReady(s),false)}
  if(scene.requirement==='zoom'){m.magnification=8;m.focus=focusTarget(m);noteMicroscopeAction(s,'zoomUp')}
  if(scene.requirement==='move')noteMicroscopeAction(s,'move',3);
  if(scene.requirement==='light'){m.lights=1;m.light=55;noteMicroscopeAction(s,'light')}
  if(scene.requirement==='widen'){m.magnification=4;noteMicroscopeAction(s,'zoomDown')}
  if(scene.requirement==='return')m.mode=false;
  checkMicroscope(s,true);assert.equal(petriReady(s),true);assert.equal(petriReady(migrateV4(s)),true);
  assert.ok(choose(s,'petri-note'));assert.ok(advance(s));steps++;
 }assert.equal(steps,9);assert.equal(s.ending,'petri-dish-observed');
});
test('all microscope prompts and records are localized without a named narrator',()=>{
 for(let i=0;i<9;i++)for(let j=0;j<8;j++)for(const lang of ['zh','en','ja','isopod']){const key=`petri:${i}:${j}`,text=petriText(key,lang);assert.notEqual(text,key);assert.doesNotMatch(text,/阿西莫夫|Asimov|アシモフ/)}
 for(const [,gate] of PETRI_STEPS)if(gate)for(const lang of ['zh','en','ja','isopod'])assert.notEqual(petriText('petri:gate:'+gate,lang),'petri:gate:'+gate);
});

test('pre-existing magnification and old saves cannot complete a new adjustment request',()=>{
 const s=createRun('maculosa',1,'petri-dish');s.day=2;s.period=0;const m=microscope(s);m.mode=true;m.magnification=16;m.focus=68;m.inputs.zoomUp=9;
 checkMicroscope(s);assert.equal(petriReady(s),false);assert.equal(choose(s,'petri-note'),false);
 const loaded=migrateV4(s);checkMicroscope(loaded);assert.equal(petriReady(loaded),false);noteMicroscopeAction(loaded,'zoomUp');checkMicroscope(loaded);assert.equal(petriReady(loaded),true);
 const old={...s,microscope:{...m,gateVersion:1,completed:{3:true}}};checkMicroscope(old);assert.equal(petriReady(old),false);
});

test('eyepiece dispersion and focal-plane halos alter edges while retaining an opaque field',async()=>{
 const {opticalField}=await import('../isopoda/scenery/petri-optics.mjs'),w=96,h=96,source=new Uint8ClampedArray(w*h*4),sharp=new Uint8ClampedArray(source.length),soft=new Uint8ClampedArray(source.length);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;source[i]=source[i+1]=source[i+2]=(x%12<6?70:190);source[i+3]=255}
 opticalField(source,sharp,w,h,{focus:60,magnification:8,light:60});opticalField(source,soft,w,h,{focus:12,magnification:8,light:60});
 assert.notDeepEqual(sharp,soft);assert.deepEqual([...sharp.slice(0,4)],[22,32,27,255]);let fringes=0;
 for(let y=20;y<76;y++)for(let x=20;x<76;x++){const i=(y*w+x)*4;assert.equal(soft[i+3],255);if(Math.abs(soft[i]-soft[i+2])>15)fringes++}
 assert.ok(fringes>20);
});
test('waiting on either side of a choice keeps antenna phase alive, including locomotion pauses',()=>{
 const s=createRun('uniramea',91,'petri-dish'),group=makeIndividuals(s.cohort);let pauses=0;
 for(const stage of ['choice','feedback']){s.stage=stage;for(let i=0;i<1800;i++){const phase=group[0].phase;stepPetri(group,{state:s,time:i*.1,dt:.1});assert.ok(group[0].phase>phase);if(!group[0].moving)pauses++}}
 assert.ok(pauses>0);
});
