import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENE_LAYOUTS,layoutForHabitat} from '../isopoda/scenery/authored-layouts.mjs';
import {sceneObjects,isAnimatedSceneElement} from '../isopoda/scenery/index.mjs';
import {drawAquaticPlant} from '../isopoda/scenery/aquatic.mjs';

test('the exported habitat layouts are the canonical editor scenes',()=>{
 const expected={forest:42,freshwater:54,groundwater:17,estuary:52,intertidal:63,'sandy-surf':19,'shallow-marine':38,abyssal:7,'petri-dish':12};
 assert.deepEqual(Object.keys(SCENE_LAYOUTS),Object.keys(expected));
 for(const [id,count] of Object.entries(expected)){
  const layout=SCENE_LAYOUTS[id];
  assert.deepEqual(layout.canvas,{width:384,height:430});
  assert.equal(layout.objects.length,count,id);
  assert.ok(layout.objects.every(item=>typeof item.flipX==='boolean'),id+' mirror state');
  assert.equal(new Set(layout.objects.map(item=>item.id)).size,count,id+' unique ids');
 }
 assert.equal(layoutForHabitat('terrestrial'),SCENE_LAYOUTS.forest);
 assert.equal(layoutForHabitat('freshwater'),SCENE_LAYOUTS.freshwater);
 assert.equal(layoutForHabitat('estuary'),SCENE_LAYOUTS.estuary);
 assert.equal(SCENE_LAYOUTS.estuary.background.type,'water-estuary');
 assert.notDeepEqual(SCENE_LAYOUTS.estuary.objects,SCENE_LAYOUTS.intertidal.objects);
 const estuaryTypes=new Set(SCENE_LAYOUTS.estuary.objects.map(item=>item.type));
 for(const type of ['saltmarsh-tuft-01','mud-burrows-01','wrack-line-01','estuary-silt-01','tidal-runnel-01'])assert.ok(estuaryTypes.has(type),type);
 assert.ok(![...estuaryTypes].some(type=>type.startsWith('stone-')),'estuary should read as mudflat, not rock pool');
});

test('authored aquatic plant positions remain animation-ready without changing editor coordinates',()=>{
 for(const id of ['freshwater','groundwater','estuary','intertidal','sandy-surf','shallow-marine','petri-dish']){
  const source=SCENE_LAYOUTS[id].objects.filter(item=>item.params?.kind&&item.params.interactive!==false);
  const runtime=sceneObjects(SCENE_LAYOUTS[id]).filter(isAnimatedSceneElement);
  assert.equal(runtime.length,source.length,id);
  assert.deepEqual(runtime.map(item=>[item.x,item.y,item.a,item.flipX]),source.map(item=>[item.x,item.y,item.angle||0,item.flipX]));
 }
 assert.equal(sceneObjects(SCENE_LAYOUTS.abyssal).filter(isAnimatedSceneElement).length,0);
 assert.equal(SCENE_LAYOUTS.groundwater.background.type,'water-groundwater');
 assert.equal(SCENE_LAYOUTS['sandy-surf'].background.type,'water-sandy-surf');
 assert.equal(SCENE_LAYOUTS['petri-dish'].background.type,'water-petri-dish');
});


test('aquatic plants move over time while their rooted base remains anchored',()=>{
 const render=(kind,time)=>{
  const calls=[],ctx={fillStyle:null,fillRect(x,y,w,h){calls.push([Math.round(x),Math.round(y),Math.round(w),Math.round(h),this.fillStyle])}};
  drawAquaticPlant(ctx,{kind,x:180,y:260,scale:1,seed:211,height:92,time,flow:52});
  return calls;
 };
 for(const kind of ['waterweed','rockweed','seagrass','ulva','saltmarsh','kelp']){
  const a=render(kind,0),b=render(kind,1.7);
  assert.notDeepEqual(a,b,kind+' should sway over time');
  const roots=calls=>calls.filter(c=>c[1]>=258&&c[1]<=263).map(c=>c.slice(0,4));
  assert.ok(roots(a).length>0&&roots(b).length>0,kind+' rooted base');
 }
});
