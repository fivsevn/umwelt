import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSupports, supportSurfaces, fitsSurface, movedArrangement, contactOffset, clearContainerWalls } from '../rooftop/3d/spatial-layout.mjs';
const o=(id,type,x=0,y=0,scale=1,rotation=0)=>({id,type,x,y,scale,rotation});
test('table tops include thickness; small objects nest in a tray on the table',()=>{
 const table=o('t','table'),box=o('c','crate',0,0,.65),tool=o('tool','gloves',0,0,.35);
 const r=resolveSupports([table,box,tool]);
 assert.equal(r.get('c').parentId,'t');
 assert.equal(r.get('c').height,24/16+.05);
 assert.equal(r.get('tool').parentId,'c');
 assert.equal(r.get('tool').height,r.get('c').height+.075*.65);
});
test('tier gaps reject tall plants and choose an unobstructed top board',()=>{
 const rack=o('r','tierstand',0,0),plant=o('p','column',0,0,.5);plant.y=-contactOffset(plant);
 const r=resolveSupports([rack,plant]);
 assert.equal(r.get('p').parentId,'r');assert.equal(r.get('p').level,2);
 assert.ok(r.get('p').height>2);
});
test('stepped wooden shelves use their actual board elevations and depth',()=>{
 const rack=o('r','woodshelf');const surfaces=supportSurfaces(rack);
 assert.ok(Math.abs(surfaces[0].y-.23)<1e-9);
 assert.ok(Math.abs(surfaces[2].y-(34/16-.06+.05))<1e-9);
 const p=o('p','new-aucampiae',0,surfaces[0].z*16,.4);p.y-=contactOffset(p);
 assert.equal(resolveSupports([rack,p]).get('p').level,0);
});
test('a pot must fit the complete container opening; foliage may overhang',()=>{
 const box=o('c','crate'),small=o('s','new-aucampiae',0,0,.45),big=o('b','barrel',0,0,1);small.y=-contactOffset(small);
 assert.equal(resolveSupports([box,small]).get('s').container,true);
 assert.equal(resolveSupports([box,big]).get('b').height,0);
});
test('rotated shelves use local axes, contact anchors and the complete bearing footprint',()=>{
 const rack=o('r','table',0,0,1,90),tool=o('t','gloves',0,18,.6,90);
 assert.ok(fitsSurface(tool,rack,supportSurfaces(rack)[0]));
 const edge={...tool,x:20};assert.ok(!fitsSurface(edge,rack,supportSurfaces(rack)[0]));
});
test('moving and rotating a supporter carries the nested arrangement and leaves the source intact',()=>{
 const list=[o('table','table',100,100),o('tray','crate',108,104,.65),o('tool','gloves',108,104,.35)];
 const copy=structuredClone(list),next=movedArrangement(list,'table',{x:200,y:200,rotation:90});
 assert.deepEqual(list,copy);
 assert.equal(next[1].x,196);assert.equal(next[1].y,208);assert.equal(next[2].x,196);assert.equal(next[2].rotation,90);
});

test('legacy plant image anchors rotate around their pot contact rather than their foliage centre',()=>{
 const table=o('t','table',100,100),plant=o('p','new-aucampiae',106,104,.45);plant.y-=contactOffset(plant);
 const next=movedArrangement([table,plant],'t',{rotation:90});
 assert.equal(next[1].x,96);assert.equal(next[1].y+contactOffset(next[1]),106);assert.equal(resolveSupports(next).get('p').parentId,'t');
});

test('a rigid pot cannot be dropped through the wall of a smaller container',()=>{
 const table=o('t','table'),tray=o('c','crate',0,0,.7),plant=o('p','new-aucampiae',0,0,.5);plant.y=-contactOffset(plant);
 assert.equal(clearContainerWalls([table,tray,plant],new Set(['p'])),false);
 tray.scale=1;assert.equal(clearContainerWalls([table,tray,plant],new Set(['p'])),true);assert.equal(resolveSupports([table,tray,plant]).get('p').parentId,'c');
 plant.x=40;assert.equal(clearContainerWalls([table,tray,plant],new Set(['p'])),true);
});
