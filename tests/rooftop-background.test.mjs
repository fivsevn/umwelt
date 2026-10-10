import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {HOUSE,housePoint} from '../rooftop/house-structure.mjs';
import {SCENES} from '../rooftop/scene.mjs';
const directory=new URL('../rooftop/assets/background/',import.meta.url);
import {BACKGROUND as manifest} from '../rooftop/assets/background/empty-rooftop.mjs';
const bytes=readFileSync(new URL('empty-rooftop.bin',directory));
test('Blender export has bounded binary sections, proper normals and a lightweight payload',()=>{
 assert.equal(manifest.sha256,createHash('sha256').update(bytes).digest('hex'));
 assert.ok(bytes.length<6500000);
 const sections=[{...manifest.cube,mode:'mesh'},...manifest.parts];
 for(const p of manifest.parts)for(const g of p.assemblies||[])sections.push({mode:'instances',offset:g.sourceOffset,count:g.sourceCount},{mode:'instances',offset:g.worldOffset,count:g.worldCount});
 for(const part of sections){
  const size=part.mode==='instances'?(part.directCount??part.count)*16:part.vertices*8;
  assert.ok(part.offset+size*4<=bytes.length);
  for(let i=0;i<size;i++)assert.ok(Number.isFinite(bytes.readFloatLE(part.offset+i*4)));
  if(part.mode==='mesh')for(let i=0;i<part.vertices;i++){
   const offset=part.offset+i*32+12;
   assert.ok(Math.abs(Math.hypot(bytes.readFloatLE(offset),bytes.readFloatLE(offset+4),bytes.readFloatLE(offset+8))-1)<1e-5);
  }
 }
 for(const p of manifest.parts.filter(p=>p.mode==='instances'))assert.equal(p.count,p.directCount+(p.assemblies||[]).reduce((n,g)=>n+g.sourceCount*g.worldCount,0));
 assert.equal(manifest.row.northTerraces,6);assert.equal(manifest.row.southTerraces,6);
 assert.equal(manifest.row.pairs,3);assert.equal(manifest.row.interPairSetback,12);
 assert.deepEqual(manifest.row.centres,HOUSE.row.homes.map(p=>p[0]));
 assert.deepEqual(manifest.row.mirrors,HOUSE.row.homes.map(p=>p[1]));
 assert.equal(manifest.sixthFloor.eave,HOUSE.roof.eave);assert.equal(manifest.sixthFloor.ridge,HOUSE.roof.ridge);
});
test('unique Pixelorama floor charts cover both saved walkable contours at one texel density',()=>{
 for(const name of ['north','south']){
  const part=manifest.parts.find(p=>p.field===name+'-floor');
  const points=new Set();
  for(let i=0;i<part.vertices;i++){
   const offset=part.offset+i*32;
   points.add([bytes.readFloatLE(offset),bytes.readFloatLE(offset+8)].join(','));
   assert.ok(bytes.readFloatLE(offset+4)>=0 && bytes.readFloatLE(offset+4)<=Math.fround(.015));
  }
  const center=name==='north'?[304,272]:[284,264];
  for(const [sx,sz]of SCENES[name].points){
   const p=housePoint(name,(sx-center[0])/16,(sz-center[1])/16);
   assert.ok(points.has(p.join(',')),name+' floor retains '+p);
  }
 }
});
test('the home is between neighbours, and paired projections do not bridge the garage gaps',()=>{
 const part=manifest.parts.find(p=>p.field==='north-floor');
 const triangles=[],points=new Set();
 for(let i=0;i<part.vertices;i+=3){
  const triangle=[];
  for(let j=0;j<3;j++){
   const offset=part.offset+(i+j)*32;
   const p=[bytes.readFloatLE(offset),bytes.readFloatLE(offset+8)];
   points.add(p.join(','));triangle.push(p);
  }
  triangles.push(triangle);
 }
 assert.ok(HOUSE.row.homes.some(p=>p[0]>0)&&HOUSE.row.homes.some(p=>p[0]<0));
 for(const [cx,mirror]of HOUSE.row.homes){
  for(const x of [-2,6])assert.ok(points.has([cx+mirror*x,-12].join(',')),'each home has the projecting floor bay');
 }
 const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
 for(const x of HOUSE.row.gapCentres){
  assert.ok(!triangles.some(t=>{
   const s=t.map((a,i)=>cross(a,t[(i+1)%3],[x,-5]));
   return s.every(v=>v>=0)||s.every(v=>v<=0);
  }),'the twelve-unit gap has no terrace floor bridge');
 }
 assert.equal(manifest.neighbourhood.south,'matching paired-terrace apartments');
 assert.equal(manifest.neighbourhood.skylineDirections,360);
});
test('mapped rows stay parallel, separate and free of shops on the home building',()=>{
 const n=manifest.neighbourhood;
 assert.equal(n.homeShops,0);assert.equal(n.layoutSource,'map-layout.json');
 for(const part of manifest.parts.filter(p=>p.field.startsWith('sign-'))){
  assert.equal(part.mode,'mesh');
  for(let i=0;i<part.vertices;i++){
   const offset=part.offset+i*32,x=bytes.readFloatLE(offset),z=bytes.readFloatLE(offset+8);
   assert.ok(x<-82||x>66||z<-12||z>36,'actual storefront meshes stay off the home building');
  }
 }
 const all=[{id:'home',x:-8,z:12,width:148,depth:48},...n.oldBlocks];
 for(const b of n.oldBlocks){assert.equal(b.angle,0);assert.equal(b.storeys,6);assert.equal(b.sourcePixel.length,2);}
 for(let i=0;i<all.length;i++)for(const b of all.slice(i+1)){
  const a=all[i],dx=Math.abs(a.x-b.x)-(a.width+b.width)/2,dz=Math.abs(a.z-b.z)-(a.depth+b.depth)/2;
  assert.ok(dx>=0||dz>=0,'mapped apartment footprints do not intersect: '+a.id+' / '+b.id);
 }
 assert.ok(n.towers.length>0);
 assert.ok(n.towers.every(b=>b.z<-500),'the observed northern tower district is separated from the immediate old rows');
});
