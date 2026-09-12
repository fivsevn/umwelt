import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES} from '../isopoda/species.mjs';
import {pixelAnatomy,renderModel,POSTURES} from '../isopoda/sprites.mjs';
const shell=p=>/^(p\d|epimera\d|cephalon|pleon|pleotelson)$/.test(p.region);
test('projected shells have a broad middle and short asymmetric caps',()=>{
 for(const species of SPECIES){const parts=pixelAnatomy(renderModel(species.visual)),columns=new Map();for(const part of parts.filter(shell))for(const [x,y] of part.cells){if(!columns.has(x))columns.set(x,[]);columns.get(x).push(y)}
 const widths=[...columns].sort((a,b)=>a[0]-b[0]).map(([,ys])=>Math.max(...ys)-Math.min(...ys)+1),max=Math.max(...widths);
 assert.ok(widths.filter(w=>w>=max-2).length/widths.length>=.55,species.id+' broad middle');assert.ok(widths[0]>max*.4&&widths.at(-1)>max*.4,species.id+' blunt ends');assert.notEqual(widths[0],widths.at(-1));
 }
});
test('walking feet are occluded, sparse, short and alternate across frames',()=>{
 for(const species of SPECIES){const frames=[];for(let phase=0;phase<4;phase++){const parts=pixelAnatomy(renderModel(species.visual),{phase,moving:true}),cover=new Set(parts.filter(shell).flatMap(p=>p.cells.map(([x,y])=>x+','+y))),feet=parts.find(p=>p.region==='legs').cells.filter(([x,y])=>!cover.has(x+','+y));
 const visible=new Set(feet.map(([x,y])=>x+','+y));assert.ok(visible.size<=18,species.id+' few tips');for(const [x,y] of feet){assert.ok([1,2,3].some(d=>cover.has(x+','+(y-Math.sign(y)*d))),species.id+' <=3 cells exposed')}frames.push([...visible].sort().join(';'));
 }assert.ok(new Set(frames).size>1,species.id+' alternating feet')}
});
test('all stages, poses and phases remain finite integer pixels within the rotation-safe raster',()=>{
 for(const species of SPECIES)for(const stage of ['juvenile','subadult','adult'])for(const posture of POSTURES)for(let phase=0;phase<4;phase++)for(const part of pixelAnatomy(renderModel(species.visual,{stage}),{posture,phase,moving:true}))for(const [x,y] of part.cells){assert.ok(Number.isInteger(x)&&Number.isInteger(y));assert.ok(Math.hypot(x,y)<31,species.id+' rotation bounds')}
});
