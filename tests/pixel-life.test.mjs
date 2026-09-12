import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES} from '../isopoda/species.mjs';
import {pixelAnatomy,renderModel,POSTURES} from '../isopoda/sprites.mjs';
import {makeIndividuals,stageIndividuals,stepIndividuals,actorOrder} from '../isopoda/behaviors.mjs';
import {ENCOUNTERS} from '../isopoda/encounters.mjs';
test('every posture has distinct integer-cell anatomy for all thirteen phenotypes',()=>{
 for(const species of SPECIES){const model=renderModel(species.visual,{seed:189});const shapes=POSTURES.map(posture=>pixelAnatomy(model,{posture,molt:posture==='molting'?'posterior':'none'}));
 assert.equal(new Set(shapes.map(s=>JSON.stringify(s))).size,POSTURES.length,species.id);
 for(const modules of shapes)for(const part of modules)for(const [x,y,c] of part.cells){assert.ok(Number.isInteger(x)&&Number.isInteger(y));assert.match(c,/^#[a-f0-9]{6}$/i);assert.ok(Math.abs(x)<32&&Math.abs(y)<32,species.id+' within raster')}
 const normal=shapes[0];assert.equal(normal.filter(p=>/^p\d$/.test(p.region)).length,7);assert.equal(normal.find(p=>p.region==='legs').cells.length>14,true);
 const curl=shapes[4];assert.equal(curl.some(p=>p.region==='antennae'),species.visual.conglobation.ability!=='full');
 }
});
test('identity is repeatable, diverse, and uninterrupted across scene transitions',()=>{
 const g=makeIndividuals(989);assert.deepEqual(g,makeIndividuals(989));assert.notDeepEqual(g,makeIndividuals(990));assert.ok(new Set(g.map(c=>c.speed)).size>2);assert.ok(new Set(g.map(c=>c.pause)).size>1);
 const positions=g.map(c=>[c.x,c.y]);for(const e of ENCOUNTERS){stageIndividuals(g,e);assert.deepEqual(g.map(c=>[c.x,c.y]),positions)}
 assert.ok(new Set(ENCOUNTERS.map(e=>actorOrder(g,e)[0].id)).size>=3);
});
test('long observations retain independent activity and all encounters resolve poses',()=>{
 const poses=new Set();for(const e of ENCOUNTERS){const g=makeIndividuals(42);stageIndividuals(g,e,{initial:true});let moving=0;for(let i=0;i<1200;i++){stepIndividuals(g,{encounter:e,time:i*.1,dt:.1,state:{humidity:70}});g.forEach(c=>poses.add(c.posture));if(i>1000)moving+=g.filter(c=>c.moving).length;for(const c of g)assert.ok(Number.isFinite(c.x+c.y+c.a+c.occlusion))}assert.ok(moving>0,e.id+' never freezes group')}
 for(const p of POSTURES)assert.ok(poses.has(p),'encounters use '+p);
});

import {cameraWindow} from '../isopoda/habitat.mjs';
test('square camera uses one scale, crops at small widths and clamps drag to world',()=>{
 for(const size of [220,286,356,620])for(const zoom of [1,1.5,3])for(const x of [-900,190,999])for(const y of [-900,215,999]){const c=cameraWindow(size,size,zoom,x,y);assert.equal(c.sw,c.sh);assert.equal(c.scale*c.sw,size);assert.ok(c.sx>=-1e-9&&c.sy>=-1e-9&&c.sx+c.sw<=384+1e-9&&c.sy+c.sh<=430+1e-9)}
 assert.equal(cameraWindow(286,286).scale,1);assert.equal(cameraWindow(356,356).scale,1);assert.ok(cameraWindow(620,620).scale>1);
});
