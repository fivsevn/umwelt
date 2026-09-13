import test from 'node:test';import assert from 'node:assert/strict';
import {SPECIES} from '../isopoda/species.mjs';import {pixelAnatomy,renderModel} from '../isopoda/sprites.mjs';import {sceneActorPixels,SCENE_PIXEL} from '../isopoda/habitat.mjs';import {createRun} from '../isopoda/engine.mjs';import {restoreCollection,unlock} from '../isopoda/collection.mjs';
test('scene creatures use the same coarse lattice in every orientation and remain smaller than specimens',()=>{
 for(const species of SPECIES)for(const posture of ['normal','curled','molting']){
 const model=renderModel(species.visual),source=new Map();for(const part of pixelAnatomy(model,{posture,molt:posture==='molting'?'posterior':'none'}))for(const [x,y,c] of part.cells)source.set(x+','+y,c);
 for(const a of [0,.4,Math.PI/2,Math.PI,5.3]){const cells=sceneActorPixels(source,{model,a,x:191.7,y:215.2,lift:1.3,occlusion:0});assert.ok(cells.length>10);for(const [x,y] of cells){assert.equal(x%SCENE_PIXEL,0);assert.equal(y%SCENE_PIXEL,0)}assert.ok(cells.length<source.size)}
 const full=sceneActorPixels(source,{model,a:0,x:192,y:216,occlusion:0});const hidden=sceneActorPixels(source,{model,a:0,x:192,y:216,occlusion:1});assert.ok(hidden.length<full.length);
 }
});
test('real local start date and first collection date survive reload and repeat encounters',()=>{
 const run=createRun('dairy',123),today=new Date();assert.equal(run.startedOn,[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-'));
 const c=restoreCollection(null);unlock(c,'dairy',run.startedOn);unlock(c,'dairy','2099-01-01');assert.equal(c.acquired.dairy,run.startedOn);assert.equal(restoreCollection(JSON.parse(JSON.stringify(c))).acquired.dairy,run.startedOn);
 const old={...run};delete old.startedOn;assert.equal(restoreCollection(null,old).acquired.dairy,undefined);
});
