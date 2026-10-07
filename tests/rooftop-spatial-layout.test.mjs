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

test('each tier has a persistent identity; a chosen middle tier survives nested transforms and validation',async()=>{
 const {placeOnSurface}=await import('../rooftop/3d/spatial-layout.mjs');
 const {validateLayout}=await import('../rooftop/scene.mjs');
 const list=[o('rack','tierstand',312,240),o('tool','gloves',312,240,.5)];
 const placed=placeOnSurface(list,'tool','rack','middle');assert.ok(placed);
 list[1]=placed;
 assert.equal(resolveSupports(list).get('tool').surfaceId,'middle');
 const moved=movedArrangement(list,'rack',{x:330,y:270,rotation:90});
 assert.equal(resolveSupports(moved).get('tool').height,supportSurfaces(moved[0])[1].y);
 const saved=validateLayout({version:2,roomVersion:2,scenes:{north:moved,south:[],room:[]}});
 assert.deepEqual(saved.scenes.north,moved);
 assert.equal(resolveSupports(saved.scenes.north).get('tool').surfaceId,'middle');
});
test('explicit ground placement does not silently snap back to a nearby shelf',()=>{
 const rack=o('rack','shelf'),tool={...o('tool','gloves'),support:null};
 assert.equal(resolveSupports([rack,tool]).get('tool').height,0);
});
test('legacy edge contacts migrate minimally and carry a shelf arrangement without losing its tiers',async()=>{
 const {validateLayout,initialLayout}=await import('../rooftop/scene.mjs');
 const parsley={...o('parsley','parsley',320,76,.6),seed:2762693746};
 const rack=o('rack','tierstand',352,96),plant={...o('plant','new-cooperi',340,92,.5),seed:2839102273,pot:'mashiko'};
 const old={version:2,roomVersion:2,scenes:{north:[parsley],south:[],room:[rack,plant]}},copy=structuredClone(old);
 const before=resolveSupports(old.scenes.room).get('plant');
 const migrated=validateLayout(old),[movedRack,movedPlant]=migrated.scenes.room;
 assert.deepEqual(old,copy);
 assert.equal(migrated.scenes.north[0].y,77);
 assert.equal(migrated.scenes.north[0].seed,parsley.seed);
 assert.equal(movedPlant.x-movedRack.x,plant.x-rack.x);
 assert.equal(movedPlant.y-movedRack.y,plant.y-rack.y);
 assert.deepEqual(movedPlant.support,{id:rack.id,surface:before.surfaceId});
 assert.equal(resolveSupports(migrated.scenes.room).get('plant').height,before.height);
 assert.deepEqual(validateLayout(migrated),migrated);
 assert.deepEqual(validateLayout(initialLayout()),initialLayout());
 assert.throws(()=>validateLayout({...old,scenes:{...old.scenes,north:[{...parsley,support:null}]}}),/承重点/);
 assert.throws(()=>validateLayout({...old,scenes:{...old.scenes,north:[{...parsley,y:40}]}}),/承重点/);
});
test('dangling parents, missing tier IDs and circular support chains are rejected',async()=>{
 const {validateLayout}=await import('../rooftop/scene.mjs');
 const validate=north=>validateLayout({version:2,roomVersion:2,scenes:{north,south:[],room:[]}});
 const tool={...o('tool','gloves',312,240,.5),support:{id:'missing',surface:'top'}};
 assert.throws(()=>validate([tool]),/承重点/);
 assert.throws(()=>validate([{...tool,support:{id:'rack',surface:'fifth'}},o('rack','shelf',312,240)]),/承重点/);
 const a={...o('a','crate',312,240),support:{id:'b',surface:'inside'}},b={...o('b','crate',312,240),support:{id:'a',surface:'inside'}};
 assert.throws(()=>validate([a,b]),/承重点/);
});
test('the whole catalogue has finite physical bounds and unique scaled surface IDs',async()=>{
 const {ASSETS}=await import('../rooftop/scene.mjs');
 const {physicalFootprint,placementKind}=await import('../rooftop/3d/spatial-layout.mjs');
 for(const a of ASSETS)for(const scale of [.5,1,2]) {
  const object={type:a.id,scale,seed:1835},bounds=physicalFootprint(object),surfaces=supportSurfaces(object);
  for(const key of ['w','d','h','groundW','groundD'])assert.ok(bounds[key]>0&&Number.isFinite(bounds[key]),a.id+' '+key);
  assert.equal(new Set(surfaces.map(s=>s.id)).size,surfaces.length,a.id);
  for(const surface of surfaces)for(const key of ['y','w','d'])assert.ok(Number.isFinite(surface[key])&&surface[key]>0,a.id+' '+key);
  if(a.placement.kind==='furniture')assert.equal(placementKind(a.id).portable,false);
 }
});
test('short plants fit a middle tier while taller seeded crowns clear only the top',async()=>{
 const {placeOnSurface}=await import('../rooftop/3d/spatial-layout.mjs');
 const rack=o('rack','wirestand'),short=o('short','new-lesliei',0,0,.5),tall=o('tall','column',0,0,1);
 assert.ok(placeOnSurface([rack,short],'short','rack','middle'));
 assert.equal(placeOnSurface([rack,tall],'tall','rack','middle'),null);
 assert.ok(placeOnSurface([rack,tall],'tall','rack','upper'));
});
test('deep containers rest contents on their floor, leaving the rim and counter separate',async()=>{
 const {placeOnSurface}=await import('../rooftop/3d/spatial-layout.mjs');
 const basin=o('sink','sink'),tool=o('tool','gloves',0,0,.5);
 for(const id of ['inside','counter']) {
  const placed=placeOnSurface([basin,tool],'tool','sink',id);assert.ok(placed);
  assert.equal(resolveSupports([basin,placed]).get('tool').height,supportSurfaces(basin).find(s=>s.id===id).y);
 }
 assert.ok(supportSurfaces(basin).find(s=>s.id==='inside').y<supportSurfaces(basin).find(s=>s.id==='counter').y-.3);
 const vessel=o('v','vessel-antique-shino'),small=o('small','pruning-shears',0,0,.5);
 assert.ok(supportSurfaces(vessel).length,'empty ceramics expose their actual cavity');
});
test('flat furniture and its contents can be placed flush with a straight wall in every orientation',async()=>{
 const {physicalFootprint}=await import('../rooftop/3d/spatial-layout.mjs');
 const {fits,contactPoints}=await import('../rooftop/scene.mjs');
 for(const type of ['shelf','wirestand','table','room-bed','room-wardrobe','storagechest'])for(const rotation of [0,90,180,270]) {
  const object=o('wall',type,300,216,1,rotation),bounds=physicalFootprint(object);
  object.x=220+(rotation%180?bounds.groundD:bounds.groundW)*8;
  assert.ok(fits('room',object),type+' '+rotation);
  assert.ok(Math.abs(Math.min(...contactPoints(object).map(p=>p[0]))-220)<1e-6);
 }
});

test('placing another small item chooses free bearing space rather than overlapping rigid bases',async()=>{
 const {placeOnSurface}=await import('../rooftop/3d/spatial-layout.mjs');
 const rack=o('rack','wirestand'),a=o('a','gloves',0,0,.5),b=o('b','gloves',0,0,.5);
 const first=placeOnSurface([rack,a],'a','rack','middle');
 const second=placeOnSurface([rack,first,b],'b','rack','middle');
 assert.ok(second);assert.notEqual(second.x,first.x);
 assert.ok(fitsSurface(second,rack,supportSurfaces(rack)[1]));
});
test('covered racks reject contents taller than the clear space beneath the hood',async()=>{
 const {placeOnSurface}=await import('../rooftop/3d/spatial-layout.mjs');
 const rack=o('rack','coveredstand'),plant=o('p','column',0,0,.5),tool=o('tool','gloves',0,0,.5);
 assert.equal(placeOnSurface([rack,plant],'p','rack','upper'),null);
 assert.ok(placeOnSurface([rack,tool],'tool','rack','upper'));
});

test('shared placement snapshots preserve free-space, headroom and cycle decisions',async()=>{
 const {createPlacementContext,placeOnSurface}=await import('../rooftop/3d/spatial-layout.mjs');
 const rack=o('rack','wirestand'),sink=o('sink','sink',64,0),tray={...o('tray','seedtray',0,0,.5),support:{id:'rack',surface:'middle'}},
   small=o('small','gloves',0,0,.5),tall=o('tall','column',0,0,1),occupied=placeOnSurface([rack,small],'small','rack','middle');
 const list=[rack,sink,tray,occupied,tall,o('next','gloves',0,0,.5)];
 for(const child of list) {
  const context=createPlacementContext(list,child.id);
  for(const parent of list)for(const surface of supportSurfaces(parent))
   assert.deepEqual(placeOnSurface(list,child.id,parent.id,surface.id,context),placeOnSurface(list,child.id,parent.id,surface.id),child.id+' / '+parent.id+' / '+surface.id);
 }
 const next=placeOnSurface(list,'next','rack','middle',createPlacementContext(list,'next'));
 assert.ok(next);assert.notEqual(next.x,occupied.x);
 assert.equal(placeOnSurface(list,'tall','rack','middle',createPlacementContext(list,'tall')),null);
 assert.equal(placeOnSurface(list,'rack','tray','inside',createPlacementContext(list,'rack')),null);
});
