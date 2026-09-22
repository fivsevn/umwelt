import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENE_LAYOUTS,layoutForHabitat} from '../isopoda/scenery/authored-layouts.mjs';
import {sceneObjects,isAnimatedSceneElement} from '../isopoda/scenery/index.mjs';

test('the five exported habitat layouts are the canonical editor scenes',()=>{
 const expected={forest:42,freshwater:46,intertidal:51,'shallow-marine':32,abyssal:9};
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
});

test('authored aquatic plant positions remain animation-ready without changing editor coordinates',()=>{
 for(const id of ['freshwater','intertidal','shallow-marine']){
  const source=SCENE_LAYOUTS[id].objects.filter(item=>item.params?.kind);
  const runtime=sceneObjects(SCENE_LAYOUTS[id]).filter(isAnimatedSceneElement);
  assert.equal(runtime.length,source.length,id);
  assert.deepEqual(runtime.map(item=>[item.x,item.y,item.a,item.flipX]),source.map(item=>[item.x,item.y,item.angle||0,item.flipX]));
 }
 assert.equal(sceneObjects(SCENE_LAYOUTS.abyssal).filter(isAnimatedSceneElement).length,0);
});
