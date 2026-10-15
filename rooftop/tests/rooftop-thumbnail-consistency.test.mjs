import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ITEMS,getPlantAssembly} from '../item-catalog.mjs';
import {displayBounds} from '../scene.mjs';
const records=JSON.parse(readFileSync(new URL('../art/rooftop-thumbnail-02/audit.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('audited portrait bounds enclose visible pixels and remain usable by the canvas fallback',()=>{
 const byId=new Map(records.map(r=>[r.id,r]));
 for(const item of ITEMS){
  const r=byId.get(item.id),p=item.thumbnailProjection;
  assert.deepEqual(p,r.projection,item.id+' synchronized projection');
  for(const key of ['min','max','anchor']) assert.ok(Array.isArray(p[key])&&p[key].length===2&&p[key].every(Number.isFinite),item.id+' '+key);
  const [left,top,right,bottom]=r.alphaBounds,m=p.metresPerPixel;
  assert.ok(Number.isFinite(m)&&m>0,item.id+' scale');
  assert.ok(p.min[0]<p.max[0]&&p.min[1]<p.max[1],item.id+' nonempty bounds');
  assert.ok(p.min[0]<=(left-p.anchor[0])*m+1e-9&&p.min[1]<=(top-p.anchor[1])*m+1e-9,item.id+' near edges');
  assert.ok(p.max[0]>=(right+1-p.anchor[0])*m-1e-9&&p.max[1]>=(bottom+1-p.anchor[1])*m-1e-9,item.id+' far edges');
  if(item.category!=='植物') for(const rotation of [0,90,180,270]){
   const b=displayBounds({type:item.id,rotation,scale:1});
   assert.ok(Object.values(b).every(Number.isFinite)&&b.left<b.right&&b.top<b.bottom,item.id+' fallback bounds');
  }
 }
});
test('all native shelf images belong to their actual model and remain complete in frame',()=>{
 assert.equal(records.length,ITEMS.length);const byId=new Map(records.map(r=>[r.id,r]));assert.equal(byId.size,ITEMS.length);
 for(const item of ITEMS) assert.equal(sha(readFileSync(new URL('../'+item.atlas,import.meta.url))),byId.get(item.id).atlasSha256,item.id+' material identity');
 for(const item of ITEMS){const r=byId.get(item.id);assert.equal(r.modelId,item.modelId);const image=readFileSync(new URL('../'+item.thumbnail,import.meta.url));assert.equal(sha(image),r.pngSha256,item.id);assert.equal(image.readUInt32BE(16),144);assert.equal(image.readUInt32BE(20),144);assert.equal(sha(readFileSync(new URL('../'+item.file,import.meta.url))),r.sourceModelSha256,item.id);assert.ok(r.opaquePixels>0);assert.ok(r.alphaBounds[0]>=2&&r.alphaBounds[1]>=2&&r.alphaBounds[2]<=141&&r.alphaBounds[3]<=141);assert.equal(item.thumbnailFactory,'actual-native-item-assembly-v2');}
});
test('every plant shelf image uses its real default vessel and calibrated contact point',()=>{
 const byId=new Map(records.map(r=>[r.id,r]));const plants=ITEMS.filter(item=>item.category==='植物');assert.equal(plants.length,110);
 for(const item of plants){const r=byId.get(item.id),a=getPlantAssembly(item.id);assert.equal(r.defaultPot,a.pot.id,item.id);assert.equal(r.projection.pot,a.pot.id,item.id);assert.deepEqual(r.plantAssembly,{pot:a.pot.id,soilTop:a.soilTop,foliageOffset:a.foliageOffset,opening:a.opening});assert.equal(sha(readFileSync(new URL('../'+a.pot.file,import.meta.url))),r.vesselModelSha256,item.id);assert.equal(sha(readFileSync(new URL('../'+a.pot.atlas,import.meta.url))),r.vesselAtlasSha256,item.id);assert.deepEqual(item.thumbnailProjection.anchor,r.projection.anchor);assert.equal(item.thumbnailProjection.metresPerPixel,r.projection.metresPerPixel);}
});
