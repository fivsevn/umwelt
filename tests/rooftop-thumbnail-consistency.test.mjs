import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ITEMS,getPlantAssembly} from '../rooftop/item-catalog.mjs';
const records=JSON.parse(readFileSync(new URL('../docs/art/rooftop-thumbnail-02/audit.json',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('all native shelf images belong to their actual model and remain complete in frame',()=>{
 assert.equal(records.length,ITEMS.length);const byId=new Map(records.map(r=>[r.id,r]));assert.equal(byId.size,ITEMS.length);
 for(const item of ITEMS) assert.equal(sha(readFileSync(new URL('../rooftop/'+item.atlas,import.meta.url))),byId.get(item.id).atlasSha256,item.id+' material identity');
 for(const item of ITEMS){const r=byId.get(item.id);assert.equal(r.modelId,item.modelId);const image=readFileSync(new URL('../rooftop/'+item.thumbnail,import.meta.url));assert.equal(sha(image),r.pngSha256,item.id);assert.equal(image.readUInt32BE(16),144);assert.equal(image.readUInt32BE(20),144);assert.equal(sha(readFileSync(new URL('../rooftop/'+item.file,import.meta.url))),r.sourceModelSha256,item.id);assert.ok(r.opaquePixels>0);assert.ok(r.alphaBounds[0]>=2&&r.alphaBounds[1]>=2&&r.alphaBounds[2]<=141&&r.alphaBounds[3]<=141);assert.equal(item.thumbnailFactory,'actual-native-item-assembly-v2');}
});
test('every plant shelf image uses its real default vessel and calibrated contact point',()=>{
 const byId=new Map(records.map(r=>[r.id,r]));const plants=ITEMS.filter(item=>item.category==='植物');assert.equal(plants.length,110);
 for(const item of plants){const r=byId.get(item.id),a=getPlantAssembly(item.id);assert.equal(r.defaultPot,a.pot.id,item.id);assert.equal(r.projection.pot,a.pot.id,item.id);assert.deepEqual(r.plantAssembly,{pot:a.pot.id,soilTop:a.soilTop,foliageOffset:a.foliageOffset,opening:a.opening});assert.equal(sha(readFileSync(new URL('../rooftop/'+a.pot.file,import.meta.url))),r.vesselModelSha256,item.id);assert.equal(sha(readFileSync(new URL('../rooftop/'+a.pot.atlas,import.meta.url))),r.vesselAtlasSha256,item.id);assert.deepEqual(item.thumbnailProjection.anchor,r.projection.anchor);assert.equal(item.thumbnailProjection.metresPerPixel,r.projection.metresPerPixel);}
});
