import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {LAUNCH_BACKGROUNDS,LAUNCH_DETAILS,drawLaunchBackground,drawLaunchDetail} from '../isopoda/scenery/launch-materials.mjs';
const render=(draw,options)=>{
 const hash=createHash('sha256');let count=0;
 const ctx={canvas:{width:384,height:430},fillRect(x,y,w,h){
  assert.ok([x,y,w,h].every(Number.isInteger),'world-space integer cells');
  assert.ok(w>0&&h>0);assert.match(this.fillStyle,/^#[0-9a-f]{6}$/i);
  count++;hash.update(`${x},${y},${w},${h},${this.fillStyle};`);
 }};
 const before=JSON.stringify(options);draw(ctx,options);assert.equal(JSON.stringify(options),before);
 return {hash:hash.digest('hex'),count};
};
test('launch backgrounds are deterministic opaque pixel fields',()=>{
 const hashes=[];
 for(const kind of LAUNCH_BACKGROUNDS){
  const a=render(drawLaunchBackground,{kind,seed:57});
  assert.ok(a.count>=384*430/4);assert.deepEqual(a,render(drawLaunchBackground,{kind,seed:57}));
  assert.notEqual(a.hash,render(drawLaunchBackground,{kind,seed:97}).hash);hashes.push(a.hash);
 }
 assert.equal(new Set(hashes).size,4);
});
test('every launch object survives fractional placement, rotation and scaling without mutating editor data',()=>{
 for(const kind of LAUNCH_DETAILS)for(const [a,scale] of [[0,.45],[.37,1],[1.57,1.8]]){
  const options={kind,x:172.3,y:206.7,a,scale,seed:91};
  const result=render(drawLaunchDetail,options);assert.ok(result.count>0,kind);
  assert.deepEqual(result,render(drawLaunchDetail,options),kind);
 }
});
