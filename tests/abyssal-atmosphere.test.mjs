import test from 'node:test';
import assert from 'node:assert/strict';
import {drawWaterBackground} from '../isopoda/scenery/aquatic-materials.mjs';
import {drawAbyssalAtmosphere} from '../isopoda/scenery/abyssal-atmosphere.mjs';
const recorder=()=>({canvas:{width:24,height:32},pixels:new Map(),save(){},restore(){},fillRect(x,y,w,h){this.pixels.set(`${x},${y},${w},${h}`,this.fillStyle)}});
test('yielding seabed rows preserve the continuous world-coordinate texture',()=>{
 const whole=recorder(),sliced=recorder(),options={kind:'abyssal',seed:251,originX:-960,originY:-1074,details:false};
 drawWaterBackground(whole,options);
 for(let row=0;row<32;row+=8)drawWaterBackground(sliced,{...options,rowStart:row,rowEnd:row+8});
 assert.deepEqual(sliced.pixels,whole.pixels);
});
test('abyssal atmosphere stays sparse and animates with either motion preference',()=>{
 for(const reduced of [false,true]){
  const frames=[];
  for(let time=0;time<40;time++){
   const g=recorder();drawAbyssalAtmosphere(g,{time,seed:37,reduced});
   assert.ok(g.pixels.size<=19);frames.push(JSON.stringify([...g.pixels]));
  }
  assert.ok(new Set(frames).size>20);
 }
});
test('lights and bubbles stay outside the moving animal clearance',()=>{
 for(const x of [110,192,260])for(const time of [1,3,5,8,14,17,22,28]){
  const g=recorder(),avoid={x,y:215,rx:110,ry:112};
  drawAbyssalAtmosphere(g,{time,seed:37,avoid});
  for(const [rect,color] of g.pixels){
   const alpha=Number(color.match(/,([\d.e-]+)\)$/)?.[1]);
   if(!alpha)continue;
   const [px,py]=rect.split(',').map(Number);
   assert.ok(Math.hypot((px-x)/110,(py-215)/112)>.96,'visible particle intrudes on animal');
  }
 }
});
