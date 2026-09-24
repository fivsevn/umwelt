import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as scenery from '../isopoda/scenery/index.mjs';
import * as study from './support/scenery-study.mjs';
const render=(draw,options={})=>{
 const calls=[],ctx={fillStyle:null,imageSmoothingEnabled:true,fillRect(x,y,w,h){calls.push([x,y,w,h,this.fillStyle])}};
 draw(ctx,options);return {calls,ctx};
};
test('lab compatibility exports are the production renderers',()=>{
 for(const name of ['Substrate','Leaf','Bark','Stone','Cuttlebone','Twig','WoodChip'])assert.equal(study['drawStudy'+name],scenery['draw'+name]);
 assert.equal(study.drawStudyMoss,scenery.drawMossPatch);
 const source=readFileSync(new URL('../isopoda/habitat-lab.mjs',import.meta.url),'utf8');
 assert.ok(source.includes("from './scenery/index.mjs"));assert.ok(!source.includes('../tests/'));
});
test('all rotated, scaled scenery stays on opaque one-pixel cells, deterministic and finite',()=>{
 for(const name of ['Leaf','Bark','Stone','MossPatch','Cuttlebone','Twig','WoodChip'])for(const a of [0,.26,1.57,2.7])for(const scale of [.45,1,1.8]){
  const options={x:173.4,y:216.8,a,scale,seed:97};
  const {calls,ctx}=render(scenery['draw'+name],options);
  assert.ok(calls.length>0,name);assert.equal(ctx.imageSmoothingEnabled,false);
  assert.deepEqual(calls,render(scenery['draw'+name],options).calls);
  for(const [x,y,w,h,color] of calls){assert.ok([x,y,w,h].every(Number.isInteger));assert.equal(w,1);assert.equal(h,1);assert.match(color,/^#[0-9a-f]{6}$/i)}
  assert.ok(new Set(calls.map(c=>c[4])).size<=36,name+' finite palette');
 }
});
test('leaf pixel cache preserves the cold raster exactly and is translation-safe',()=>{
 const options={x:173.4,y:216.8,a:.413,scale:1.137,seed:23063,tone:2,variant:3,gap:true};
 const cold=render(scenery.drawLeaf,options).calls;
 const hot=render(scenery.drawLeaf,options).calls;
 assert.deepEqual(hot,cold,'cached replay must match the uncached pixel stream');
 const moved={...options,x:191.6,y:241.2},translated=render(scenery.drawLeaf,moved).calls;
 const dx=Math.round(moved.x)-Math.round(options.x),dy=Math.round(moved.y)-Math.round(options.y);
 assert.deepEqual(translated,cold.map(([x,y,w,h,color])=>[x+dx,y+dy,w,h,color]),'position is applied only after cached rasterization');
});

test('six leaves have distinct silhouettes; damage, seed and palette are visible',()=>{
 const silhouette=options=>new Set(render(scenery.drawLeaf,options).calls.map(c=>c.slice(0,4).join(',')));
 const variants=Array.from({length:6},(_,variant)=>JSON.stringify([...silhouette({variant,seed:19})]));
 assert.equal(new Set(variants).size,6);
 assert.notDeepEqual(silhouette({seed:19,gap:true}),silhouette({seed:19,gap:false}));
 assert.notDeepEqual(render(scenery.drawLeaf,{seed:19,tone:0}).calls,render(scenery.drawLeaf,{seed:19,tone:3}).calls);
 assert.ok(new Set(Array.from({length:12},(_,seed)=>JSON.stringify(render(scenery.drawLeaf,{seed}).calls))).size>2);
});
test('soil has coherent dark humus islands and moisture with clustered near-color texture',()=>{
 const dry=render(scenery.drawSubstrate),wet=render(scenery.drawSubstrate,{wetZones:[{x:80,y:200,rx:160,ry:240,moisture:95}]});
 assert.deepEqual(dry.calls[0].slice(0,4),[0,0,384,430]);
 assert.ok(dry.calls.every(c=>c[2]>=1&&c[3]>=1));
 assert.ok(new Set(dry.calls.map(c=>c[4])).size<=20);
 const base=dry.calls.filter(c=>c[2]===1&&c[3]===1).slice(0,384*430);
 assert.equal(new Set(base.map(c=>c[4])).size,9);
 const changes=base.reduce((n,c,i)=>n+Number(i%384!==0&&c[4]!==base[i-1][4]),0);
 assert.ok(changes/base.length>.25,'neighboring near-colors keep soil pixels readable');
 assert.notDeepEqual(dry.calls,wet.calls);assert.ok(wet.calls.every(c=>/^#[0-9a-f]{6}$/i.test(c[4])));
});
test('complete production composition is pure, including lift, stones and both calcium shapes',()=>{
 const options={seed:57,wetZones:[{x:42,y:215,rx:92,ry:250,moisture:78}]},before=JSON.stringify([scenery.BASE_SCENE,options]);
 const normal=render(scenery.drawBaseScene,options),lift=render(scenery.drawBaseScene,{...options,shelterLift:-12});
 assert.equal(JSON.stringify([scenery.BASE_SCENE,options]),before);assert.notDeepEqual(normal.calls,lift.calls);
 assert.ok(scenery.BASE_SCENE.some(x=>x.type==='stone'));
 assert.notDeepEqual(render(scenery.drawCuttlebone,{variant:0}).calls,render(scenery.drawCuttlebone,{variant:1}).calls);
});

test('hero bark and broad leaves remain large relative to a habitat specimen',()=>{
 const width=calls=>Math.max(...calls.map(c=>c[0]+c[2]))-Math.min(...calls.map(c=>c[0]));
 const bark=scenery.BASE_SCENE.find(x=>x.id==='shelter');
 const leaf=scenery.BASE_SCENE.find(x=>x.id==='leaf-top-right');
 assert.ok(width(render(scenery.drawBark,{...bark,a:0}).calls)>=210);
 assert.ok(width(render(scenery.drawLeaf,{...leaf,a:0}).calls)>=100);
});

test('default habitat composition has the requested starter-box anchors',()=>{
 const bark=scenery.BASE_SCENE.filter(item=>item.type==='bark');
 const moss=scenery.BASE_SCENE.filter(item=>item.type==='moss');
 const leaves=scenery.BASE_SCENE.filter(item=>item.type==='leaf');
 assert.ok(bark.length>=5,'central and surrounding wood pieces');
 assert.ok(moss.some(item=>item.x<40&&item.ry>80),'left moss border');
 assert.ok(moss.some(item=>item.x>300&&item.y>380),'bottom-right moss');
 assert.ok(leaves.some(item=>item.x>280&&item.y<120),'top-right leaf litter');
 assert.ok(leaves.some(item=>item.x<160&&item.y>300),'lower-left leaf litter');
});

test('flat material shades contain deterministic near-color clusters rather than solid fills',async()=>{
 const {materialInk}=await import('../isopoda/scenery/grammar.mjs');
 for(const material of ['wood','grain','stone','soil']){
  const pixels=Array.from({length:32*32},(_,i)=>materialInk('#806747',i%32,Math.floor(i/32),57,material));
  assert.equal(new Set(pixels).size,3,'bounded three-color material ramp');
  const changes=pixels.filter((c,i)=>i%32&&c!==pixels[i-1]).length;
  assert.ok(changes>250&&changes<850,'readable clusters without a solid fill or alternating every pixel');
  assert.deepEqual(pixels,Array.from({length:32*32},(_,i)=>materialInk('#806747',i%32,Math.floor(i/32),57,material)));
  assert.notDeepEqual(pixels,Array.from({length:32*32},(_,i)=>materialInk('#806747',i%32,Math.floor(i/32),97,material)));
 }
});
