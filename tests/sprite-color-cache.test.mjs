import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SPECIES} from '../isopoda/species-registry.mjs';
import {pixelAnatomy,renderModel,POSTURES} from '../isopoda/sprites.mjs';
test('bounded color cache preserves exact anatomy for every species, pose and animation frame',async()=>{
 const url=new URL('../isopoda/sprites.mjs',import.meta.url);
 const source=(await readFile(url,'utf8')).replace("'./phenotypes.mjs'",JSON.stringify(new URL('./phenotypes.mjs',url).href));
 // Independent uncached arithmetic is the pixel oracle, including rounding.
 const reference=source.replace(/const mix=\(a,b,t\)=>\{[\s\S]*?\n\};/,`const mix=(a,b,t)=>{const rgb=c=>c.slice(1).match(/../g).map(x=>parseInt(x,16));return '#'+rgb(a).map((v,i)=>Math.round(v*(1-t)+rgb(b)[i]*t).toString(16).padStart(2,'0')).join('')};`);
 assert.notEqual(reference,source);
 const original=await import('data:text/javascript;base64,'+Buffer.from(reference).toString('base64'));
 for(const species of SPECIES)for(const posture of POSTURES)for(const phase of [0,1,2,3]){
  const model=renderModel(species.visual,{seed:4107}),options={posture,phase,moving:true};
  assert.deepEqual(pixelAnatomy(model,options),original.pixelAnatomy(model,options),`${species.id}/${posture}/${phase}`);
 }
});
