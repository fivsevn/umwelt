import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as scenery from '../isopoda/scenery/index.mjs';
import * as study from './scenery-study.mjs';
const render=(draw,options={})=>{
 const calls=[],ctx={fillStyle:null,imageSmoothingEnabled:true,fillRect(x,y,w,h){calls.push([x,y,w,h,this.fillStyle])}};
 draw(ctx,options);return {calls,ctx};
};
test('lab compatibility exports are the production renderers',()=>{
 for(const name of ['Substrate','Leaf','Bark','Stone','Cuttlebone','Twig','WoodChip'])assert.equal(study['drawStudy'+name],scenery['draw'+name]);
 assert.equal(study.drawStudyMoss,scenery.drawMossPatch);
 const source=readFileSync(new URL('../isopoda/scenery-test.mjs',import.meta.url),'utf8');
 assert.ok(source.includes("from './scenery/index.mjs"));assert.ok(!source.includes('../tests/'));
});
test('all rotated, scaled scenery stays on opaque two-pixel cells, deterministic and finite',()=>{
 for(const name of ['Leaf','Bark','Stone','MossPatch','Cuttlebone','Twig','WoodChip'])for(const a of [0,.26,1.57,2.7])for(const scale of [.45,1,1.8]){
  const options={x:173.4,y:216.8,a,scale,seed:97};
  const {calls,ctx}=render(scenery['draw'+name],options);
  assert.ok(calls.length>0,name);assert.equal(ctx.imageSmoothingEnabled,false);
  assert.deepEqual(calls,render(scenery['draw'+name],options).calls);
  for(const [x,y,w,h,color] of calls){assert.ok([x,y,w,h].every(Number.isInteger));assert.ok(x%2===0&&y%2===0);assert.equal(w,2);assert.equal(h,2);assert.match(color,/^#[0-9a-f]{6}$/i)}
  assert.ok(new Set(calls.map(c=>c[4])).size<=8,name+' finite palette');
 }
});
test('six leaves have distinct silhouettes; damage, seed and palette are visible',()=>{
 const silhouette=options=>new Set(render(scenery.drawLeaf,options).calls.map(c=>c.slice(0,4).join(',')));
 const variants=Array.from({length:6},(_,variant)=>JSON.stringify([...silhouette({variant,seed:19})]));
 assert.equal(new Set(variants).size,6);
 assert.notDeepEqual(silhouette({seed:19,gap:true}),silhouette({seed:19,gap:false}));
 assert.notDeepEqual(render(scenery.drawLeaf,{seed:19,tone:0}).calls,render(scenery.drawLeaf,{seed:19,tone:3}).calls);
 assert.ok(new Set(Array.from({length:12},(_,seed)=>JSON.stringify(render(scenery.drawLeaf,{seed}).calls))).size>2);
});
test('soil has coherent dark humus islands and moisture without fine dither',()=>{
 const dry=render(scenery.drawSubstrate),wet=render(scenery.drawSubstrate,{wetZones:[{x:80,y:200,rx:160,ry:240,moisture:95}]});
 assert.deepEqual(dry.calls[0].slice(0,4),[0,0,384,430]);
 assert.ok(dry.calls.every(c=>c[2]>=2&&c[3]>=2));
 assert.ok(new Set(dry.calls.map(c=>c[4])).size<=10);
 const base=dry.calls.filter(c=>c[2]===4&&c[3]===4).slice(0,96*108);
 assert.equal(new Set(base.map(c=>c[4])).size,3);
 const changes=base.reduce((n,c,i)=>n+Number(i%96!==0&&c[4]!==base[i-1][4]),0);
 assert.ok(changes/base.length<.12,'large connected patches, not random pixel colors');
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
