import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../isopoda/engine.mjs';
import {drawShoreWater} from '../isopoda/scenery/estuary-shore.mjs';
import {drawAquaticWater} from '../isopoda/scenery/aquatic.mjs';
const render=fn=>{const calls=[],g={fillStyle:'',fillRect(...xy){calls.push([...xy,this.fillStyle])}};fn(g);return calls};
test('shore fish and crabs accelerate independently of water and floating reed fragments',()=>{
 const state=createRun('hookeri',42,'estuary');state.shorePoint=1;
 const a=render(g=>drawShoreWater(g,state,2,false,2)),b=render(g=>drawShoreWater(g,state,2,false,128));
 const water=calls=>calls.filter(c=>String(c.at(-1)).startsWith('rgba')||['#8b9472','#546d56'].includes(c.at(-1)));
 assert.deepEqual(water(a),water(b));assert.notDeepEqual(a,b);
});
test('intertidal barnacle cirri accelerate while water and plants retain their own time',()=>{
 const state=createRun('hirsuta',42,'intertidal');state.tide=94;
 const a=render(g=>drawAquaticWater(g,state,2,{animalTime:2})),b=render(g=>drawAquaticWater(g,state,2,{animalTime:128}));
 assert.deepEqual(a.filter(c=>c.at(-1)!=='#b9c4a5'),b.filter(c=>c.at(-1)!=='#b9c4a5'));
 assert.notDeepEqual(a.filter(c=>c.at(-1)==='#b9c4a5'),b.filter(c=>c.at(-1)==='#b9c4a5'));
});
