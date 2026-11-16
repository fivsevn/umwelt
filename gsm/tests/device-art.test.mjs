import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {shells,charms} from '../device/catalog.mjs';
import {paintDevice,ART_SIZE} from '../tools/paint-device.mjs';
const sharp=createRequire(new URL('../tools/engine/package.json',import.meta.url))('sharp');

test('published device artwork is a bounded WebP with an open native screen',async()=>{
 for(const [shell,charm,mobile] of [[shells[0],charms[0],true],[shells[1],charms[2],true],[shells[5],charms[7],false]]){
  const output=await paintDevice(shell,charm,mobile),image=sharp(output),meta=await image.metadata();
  assert.equal(meta.format,'webp');assert.deepEqual([meta.width,meta.height],ART_SIZE);
  assert.ok(output.length<400_000,'one selected composite stays below 400 KB');
  const {data,info}=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const alpha=(x,y)=>data[(y*info.width+x)*4+3];
  assert.equal(alpha(540,900),0,'the LCD opening remains transparent');
  assert.equal(alpha(245,100),0,'shared antennas remain separate from shell/charm composites');
  assert.ok(alpha(520,1480)>240,'the device body is present');
 }
});
