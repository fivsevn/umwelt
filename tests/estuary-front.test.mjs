import test from 'node:test';
import assert from 'node:assert/strict';
import {shoreMarineFraction,shoreLocalSalinity} from '../isopoda/data/habitats/shore-hydrology.mjs';
import {shoreLayout} from '../isopoda/scenery/estuary-shore.mjs';
test('marine influence advances on flood, retreats on ebb, and river input resists intrusion',()=>{
 for(const point of [0,1,2]){
  const coverage=(tide,rain=false)=>Array.from({length:96},(_,i)=>shoreMarineFraction(i*4,350,point,tide,rain)).reduce((a,b)=>a+b,0);
  assert.ok(coverage(1)>coverage(0));assert.ok(coverage(0)>coverage(2));assert.ok(coverage(2)>coverage(3));
  assert.ok(coverage(1,true)<coverage(1));
  assert.ok(shoreLocalSalinity(point,1,false)>=shoreLocalSalinity(point,3,false));
  const baseline=shoreLayout(point,0).objects;
  for(let tide=0;tide<4;tide++)for(const rain of [false,true])assert.deepEqual(shoreLayout(point,tide,rain).objects,baseline);
 }
 assert.ok(shoreLocalSalinity(1,1,false)>shoreLocalSalinity(1,1,true));
});
