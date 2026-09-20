import test from 'node:test';
import assert from 'node:assert/strict';
import {exportScene,importScene,shareCode} from '../isopoda/scene-codec.mjs';
const assets=new Map([['substrate-wet-left',{kind:'background',params:{light:82,wetZones:[]}}],['leaf',{params:{variant:2,scale:.8}}]]);
const reference={species:'orange',stage:'M',x:10,y:20,a:.2,seed:12,visible:true};
const state={background:'substrate-wet-left',backgroundSeed:94,items:[{id:'instance-3',assetId:'leaf',x:81.125,y:234.75,a:-1.1234,scale:1.3,z:-2,seed:4294967295}]};
test('JSON and share code preserve every rendering parameter exactly',()=>{
 const scene=exportScene(state,reference,assets);
 for(const text of [JSON.stringify(scene),shareCode(scene)]){
  const restored=importScene(text,assets,reference);
  assert.deepEqual(exportScene(restored.state,restored.reference,assets),scene);
 }
});
test('legacy items and angle alias retain precision',()=>{
 const restored=importScene(JSON.stringify(state),assets,reference);
 assert.deepEqual(restored.state.items,state.items);
});
test('invalid imports are rejected without touching the source scene',()=>{
 const before=JSON.stringify(state),scene=exportScene(state,reference,assets);
 for(const change of [s=>s.objects.push(s.objects[0]),s=>s.objects[0].scale=0,s=>s.objects[0].x='4',s=>s.objects[0].type='missing',s=>s.canvas.width=500,s=>s.version=2,s=>s.objects[0].params.rx=100000,s=>s.reference.stage='XX']){
  const copy=structuredClone(scene);change(copy);assert.throws(()=>importScene(JSON.stringify(copy),assets,reference));
 }
 assert.throws(()=>importScene('{',assets,reference));assert.equal(JSON.stringify(state),before);
});
