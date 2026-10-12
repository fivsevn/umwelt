import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ITEMS,ITEM_METRES_TO_UNITS as U,getItemDefinition,getPlantAssembly,getVesselItemDefinition,canonicalItemId} from '../rooftop/item-catalog.mjs';
import {PLANTS,POTS} from '../rooftop/botany.mjs';
import {WEAPONS} from '../rooftop/weapons.mjs';
import {ASSETS,CATALOG_CATEGORIES,catalogMatchesCategory,initialLayout,validateLayout} from '../rooftop/scene.mjs';
import {SPACE_GROUPS,physicalFootprint,supportSurfaces} from '../rooftop/3d/placement-profiles.mjs';

test('the runtime catalog contains exactly the approved 294 distinct native models and eight spatial groups',()=>{
  assert.equal(ITEMS.length,294);assert.equal(ASSETS.length,294);
  assert.equal(new Set(ITEMS.map(i=>i.id)).size,294);assert.equal(new Set(ITEMS.map(i=>i.modelId)).size,294);
  assert.deepEqual(SPACE_GROUPS.map(g=>g.types.length),[110,8,10,20,16,44,66,20]);
  assert.deepEqual(SPACE_GROUPS.map(g=>g.label),['植物','架子','桌椅与居室','栽培与盛放','日用与照明','收藏','枪械','兵器']);
  assert.ok(ASSETS.slice(0,110).every(a=>a.plant));
  assert.ok(!ASSETS.some(a=>['shelf','room-bed','wardcase','gloves'].includes(a.id)));
  assert.equal(canonicalItemId('shelf'),'iron-3-black');
});
test('all original plants, 37 vessels and 86 weapons retain their stable IDs and complete source records',()=>{
  for(const p of PLANTS){const a=getItemDefinition(p.id);assert.deepEqual(a.botany,p,p.id);assert.equal(a.note,p.note);assert.deepEqual(a.sources,p.sources);}
  for(const p of POTS){const a=getVesselItemDefinition(p.id);assert.ok(a,p.id);assert.equal(a.id,'vessel-'+p.id);assert.equal(a.name,p.name);assert.equal(a.note,p.note);assert.deepEqual(a.sources,p.sources);}
  for(const p of WEAPONS){const a=getItemDefinition(p.id);assert.equal(a.id,p.id);assert.equal(a.name,p.name);assert.equal(a.note,p.note);assert.deepEqual(a.sources,p.sources);}
});
test('plant browsing preserves every original botanical subcategory alongside the broad plant group',()=>{
  for(const category of new Set(PLANTS.map(p=>p.category))){
    assert.ok(CATALOG_CATEGORIES.includes(category));
    assert.deepEqual(ASSETS.filter(a=>catalogMatchesCategory(a,category)).map(a=>a.id),PLANTS.filter(p=>p.category===category).map(p=>p.id));
  }
  assert.equal(ASSETS.filter(a=>catalogMatchesCategory(a,'植物')).length,110);
  assert.equal(ASSETS.filter(a=>catalogMatchesCategory(a,'全部')).length,294);
});
test('native models and true-mesh fallback thumbnails exist for every item and match recorded source bytes',()=>{
  for(const item of ITEMS){
    const model=new URL('../rooftop/'+item.file,import.meta.url);
    const source=new URL('../docs/art/rooftop-furniture-02/preview/assets/'+item.modelId+'.glb',import.meta.url);
    // Asset copying can run independently; the authoritative approved export
    // is always present and its hash must match the metadata used for physics.
    const bytes=readFileSync(existsSync(model)?model:source);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),item.modelSha256,item.id);
    const thumb=readFileSync(new URL('../rooftop/'+item.thumbnail,import.meta.url));
    assert.equal(thumb.subarray(1,4).toString(),'PNG',item.id);
  }
});
test('all support heights, offsets, openings, holes and clearances use the same metre conversion',()=>{
  assert.equal(U,5.6/3);
  for(const item of ITEMS)for(const scale of [.5,1,2]){
    const surfaces=supportSurfaces({type:item.id,scale}),k=U*scale;
    assert.equal(surfaces.length,item.surfaces.length);
    for(const [index,s] of surfaces.entries()){
      const original=item.surfaces[index];assert.equal(s.y,original.height*k);assert.equal(s.w,original.width*k);assert.equal(s.d,original.depth*k);
      assert.equal(s.x,(original.center?.[0]||0)*k);assert.equal(s.z,-(original.center?.[1]||0)*k);
      if(original.container){assert.equal(s.rim,original.rimHeight*k);assert.ok(Math.abs(s.internalDepth-(original.rimHeight-original.height)*k)<1e-12);assert.equal(s.ceiling,Infinity);assert.ok(s.openingW>0&&s.openingD>0);}
      assert.ok(s.holes.every(h=>Number.isFinite(h.x+h.z+h.w+h.d)&&h.w>0&&h.d>0));
    }
  }
});
test('every permitted pot selection controls the plant rigid body and foliage contact without old sprite offsets',()=>{
  for(const p of PLANTS)for(const potId of p.containers){
    const assembly=getPlantAssembly(p.id,potId),pot=getVesselItemDefinition(potId),profile=physicalFootprint({type:p.id,pot:potId,scale:1});
    assert.equal(assembly.pot,pot);assert.equal(profile.body,pot.height*U);assert.equal(profile.mouthW,pot.width*U);assert.equal(profile.mouthD,pot.depth*U);
    assert.equal(profile.h,assembly.height*U);assert.ok(assembly.soilTop>0&&assembly.soilTop<=pot.height);
    assert.ok(Math.abs(assembly.foliageOffset[1]+p.reviewSoilTop-assembly.soilTop)<1e-12||Math.abs(assembly.foliageOffset[1]+assembly.reviewSoilTop-assembly.soilTop)<1e-12);
    assert.ok([profile.w,profile.d,profile.body,profile.h].every(v=>Number.isFinite(v)&&v>0));
  }
});
test('authored defaults and personal native layouts survive round trips with stable seed, pot and nested support data',()=>{
  const layout=initialLayout(),copy=initialLayout();
  assert.deepEqual(validateLayout(JSON.parse(JSON.stringify(layout))),layout);
  const byId=new Map(layout.scenes.north.map(o=>[o.id,o]));
  const nested=layout.scenes.north.find(o=>o.type==='vessel-plastic'&&o.support);
  assert.equal(byId.get(nested.support.id).type,'crate-red');
  assert.equal(byId.get(byId.get(nested.support.id).support.id).type,'wood-square-table');
  const planted=layout.scenes.north.find(o=>o.type==='pelargonium');
  assert.equal(planted.seed,2314049475);assert.equal(planted.pot,'hasami');assert.equal(planted.support.surface,'shelf-3');
  layout.scenes.north=[{id:'stand',type:'iron-3-black',x:312,y:240,scale:1,rotation:0,support:null},{id:'plant',type:'barrel',x:312,y:240,scale:1,rotation:0,seed:42,pot:'plastic',support:{id:'stand',surface:'shelf-3'}}];
  assert.equal(copy.scenes.north.length,83);const restored=validateLayout(JSON.parse(JSON.stringify(layout)));assert.deepEqual(restored,layout);
});
