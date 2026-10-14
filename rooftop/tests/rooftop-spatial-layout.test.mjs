import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,getItemDefinition,ITEM_METRES_TO_UNITS as U} from '../item-catalog.mjs';
import {ASSETS,initialLayout,validateLayout,fits,supportedLayout,findGroundPlacement,resizedObject} from '../scene.mjs';
import {physicalFootprint,placementSpaces,spaceObstacles,placementKind} from '../3d/placement-profiles.mjs';
import {resolveSupports,supportSurfaces,fitsSurface,movedArrangement,contactOffset,clearPlacement,placeOnSurface,createPlacementContext,surfacePoint,localPoint,groundArea,accessibleContents} from '../3d/spatial-layout.mjs';
const o=(id,type,x=312,y=240,scale=1,rotation=0)=>({id,type,x,y,scale,rotation,support:null});
function placed(list,id,parent,surface){const next=placeOnSurface(list,id,parent,surface);assert.ok(next,`${id} on ${parent}/${surface}`);return list.map(item=>item.id===id?next:item);}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('every native item has finite true geometry bounds and unique scaled support identities',()=>{
  assert.equal(ASSETS.length,294);
  for(const item of ITEMS)for(const scale of [.5,1,2]){
    const itemObject=o(item.id,item.id,312,240,scale),p=physicalFootprint(itemObject),surfaces=supportSurfaces(itemObject);
    for(const key of ['w','d','h','body','mouthW','mouthD','groundW','groundD'])assert.ok(Number.isFinite(p[key])&&p[key]>0,item.id+'/'+key);
    assert.equal(new Set(surfaces.map(s=>s.id)).size,surfaces.length);
    for(const s of surfaces){assert.ok(s.w>0&&s.d>0&&Number.isFinite(s.x+s.y+s.z));assert.ok(s.y>=0&&s.y<=item.height*U*scale+.001,item.id+'/'+s.id);}
  }
  assert.throws(()=>placementKind('unregistered-object'),/缺少空间定义/);
});
test('legacy type aliases identify the new model and never become duplicate live catalog rows',()=>{
  for(const [old,type] of [['shelf','iron-3-black'],['woodshelf','wood-3'],['table','wood-square-table'],['room-bed','bed-modern']]){
    assert.equal(getItemDefinition(old),getItemDefinition(type));assert.deepEqual(supportSurfaces(o('x',old)),supportSurfaces(o('x',type)));
    assert.ok(!ASSETS.some(a=>a.id===old));
  }
});
test('table, crate and tool form a real nested bearing chain whose heights sum actual native floors',()=>{
  let list=[o('table','wood-square-table'),o('box','crate-blue',330,240,.8),o('tool','pruning-shears',340,240,.5)];
  list=placed(list,'box','table','table-top');list=placed(list,'tool','box','inside-floor');
  const r=resolveSupports(list);assert.equal(r.get('box').parentId,'table');assert.equal(r.get('tool').parentId,'box');
  close(r.get('box').height,.6875*U);close(r.get('tool').height,(.6875+.022*.8)*U);
  assert.ok(clearPlacement(list));assert.ok(supportedLayout('north',list));
  const layout=initialLayout();layout.scenes.north=list;assert.deepEqual(validateLayout(layout).scenes.north,list);
});
test('short crowns clear native lower tiers while tall crowns only clear the top',()=>{
  const rack=o('rack','iron-3-black'),short=o('short','barrel'),tall=o('tall','column'),surfaces=supportSurfaces(rack);
  assert.ok(fitsSurface(short,rack,surfaces[0]));assert.ok(!fitsSurface(tall,rack,surfaces[0]));
  assert.equal(placeOnSurface([rack,tall],'tall','rack','shelf-1'),null);
  assert.ok(placeOnSurface([rack,tall],'tall','rack','shelf-3'));
  close(surfaces[0].ceiling,.4125*U);assert.equal(surfaces[2].ceiling,Infinity);
});
test('wood steps keep actual native depth offsets and heights at all four orientations',()=>{
  for(const rotation of [0,90,180,270]){
    const rack=o('rack','step-rack',312,240,1,rotation),surfaces=supportSurfaces(rack);
    assert.deepEqual(surfaces.map(s=>s.y),[.1875,.4375,.6875].map(y=>y*U));
    for(const s of surfaces){const p=surfacePoint(rack,s),q=localPoint({...o('child','pruning-shears'),...p},rack);close(q.x,s.x);close(q.z,s.z);}
    assert.ok(placed([rack,o('plant','barrel',330,260,.5)],'plant','rack',surfaces[2].id));
  }
});
test('open containers constrain the rigid body and neck, allowing leaves above the rim',()=>{
  const box=o('box','crate-blue'),plant=o('plant','column',312,240,.5),inside=supportSurfaces(box)[0];
  assert.ok(physicalFootprint(plant).h>inside.internalDepth);assert.equal(inside.ceiling,Infinity);
  assert.ok(placeOnSurface([box,plant],'plant','box','inside-floor'));
  assert.ok(!fitsSurface(plant,box,{...inside,openingW:.01}));
  assert.ok(!fitsSurface(o('big','vessel-foam'),box,inside));
});
test('real drainage holes reject a landing over the void while an offset landing can bridge intact floor',()=>{
  const parent=o('parent','vessel-terra'),surface=supportSurfaces(parent)[0];
  const tiny={w:.012,d:.012,mouthW:.012,mouthD:.012,h:.01,body:.01,circle:true,ellipse:true};
  assert.ok(surface.holes.length);assert.ok(!fitsSurface(o('tiny','pruning-shears'),parent,surface,{footprint:tiny}));
  const p=surfacePoint(parent,{x:surface.x+surface.w*.25,z:surface.z});
  assert.ok(fitsSurface({...o('tiny','pruning-shears'),...p},parent,surface,{footprint:tiny}));
});
test('nonround floors use the approved conservative ellipse and preserve both axes',()=>{
  for(const id of ['antique-kenzan-chestnut','antique-banko-teapot','antique-oribe-ewer']){
    const item=getItemDefinition(id);assert.ok(item,id);
    const surface=supportSurfaces(o('parent',item.id))[0];assert.equal(surface.shape,'ellipse');assert.ok(surface.conservativeFit);
    const small={w:surface.w*.3,d:surface.d*.3,mouthW:surface.w*.3,mouthD:surface.d*.3,h:.01,body:.01,ellipse:true};
    const withoutHole={...surface,holes:[],openingW:surface.w,openingD:surface.d};assert.ok(fitsSurface(o('child','pruning-shears'),o('parent',item.id),withoutHole,{footprint:small}));
    assert.ok(!fitsSurface({...o('child','pruning-shears'),x:312+surface.w*16*.48},o('parent',item.id),withoutHole,{footprint:small}));
  }
});
test('metal grid support is taken from real exported bars rather than the retired generic pitch',()=>{
  const rack=o('rack','iron-3-black'),surface=supportSurfaces(rack)[0];assert.equal(surface.gridBars.length,12);
  const tiny={w:.004,d:.004,mouthW:.004,mouthD:.004,h:.001,body:.001};
  const a=surface.gridBars[0],p=surfacePoint(rack,{x:a.x,z:a.z});
  assert.ok(fitsSurface({...o('tool','pruning-shears'),...p},rack,surface,{footprint:tiny}));
  // The exported grid has depth rails at X multiples of .0944m and cross
  // ties at Z=0,+/-.095375m. This point lies in the middle of a real opening.
  assert.ok(!fitsSurface({...o('tool','pruning-shears'),...surfacePoint(rack,{x:.0472*U,z:.0476875*U})},rack,surface,{footprint:tiny}));
});
test('explicit ground placement stays independent; no new item snaps to a coincident rack',()=>{
  const rack=o('rack','iron-3-black'),plant=o('plant','barrel');assert.deepEqual(resolveSupports([rack,plant]).get('plant'),{height:0});
  assert.equal(contactOffset(plant),0);assert.equal(contactOffset({...plant,pot:'foam',rotation:90}),0);
});
test('moving, rotating and scaling a real support carries all descendants and preserves seed, pot and tier',()=>{
  let list=[o('table','wood-square-table',300,230),o('box','crate-blue',304,232,.8),{...o('plant','barrel',304,232,.5),pot:'plastic',seed:345}];
  list=placed(list,'box','table','table-top');list=placed(list,'plant','box','inside-floor');
  const source=structuredClone(list),next=movedArrangement(list,'table',{x:330,y:260,rotation:90,scale:1.1}),r=resolveSupports(next);
  assert.deepEqual(list,source);assert.equal(next[2].seed,345);assert.equal(next[2].pot,'plastic');assert.equal(next[2].rotation,90);
  assert.equal(r.get('plant').parentId,'box');assert.equal(r.get('box').parentId,'table');
  close(next[1].x,330-(list[1].y-230)*1.1);close(next[1].y,260+(list[1].x-300)*1.1);
});
test('shared placement contexts choose free space, reject cycles, and match fresh searches',()=>{
  let list=[o('table','wood-square-table'),o('one','pruning-shears',330,240,.5),o('two','pruning-shears',340,240,.5)];
  list=placed(list,'one','table','table-top');const context=createPlacementContext(list,'two');
  const cached=placeOnSurface(list,'two','table','table-top',context),fresh=placeOnSurface(list,'two','table','table-top');assert.deepEqual(cached,fresh);assert.ok(fresh);
  assert.ok(Math.hypot(fresh.x-list[1].x,fresh.y-list[1].y)>1);
  list=list.map(item=>item.id==='two'?fresh:item);assert.ok(clearPlacement(list));
  assert.equal(placeOnSurface(list,'table','one','inside-floor'),null);
});
test('overlapping rigid children, vanished parent IDs and self cycles are refused by shared spatial checks',()=>{
  const table=o('t','wood-square-table'),one={...o('a','pruning-shears'),support:{id:'t',surface:'table-top'}},two={...one,id:'b'};
  assert.ok(fitsSurface(one,table,supportSurfaces(table)[0]));assert.ok(!clearPlacement([table,one,two]));
  assert.equal(resolveSupports([{...one,support:{id:'missing',surface:'table-top'}}]).get('a').invalid,'missing');
  assert.equal(resolveSupports([{...table,support:{id:'t',surface:'table-top'}}]).get('t').invalid,'missing');
});
test('under-table ground fits actual leg clearance and ceiling and does not follow the table',()=>{
  const table=o('table','wood-square-table'),plant=o('plant','barrel'),tall=o('tall','column'),under=placementSpaces(table).find(s=>s.bearing==='ground');
  assert.ok(under);assert.ok(placeOnSurface([table,plant],'plant','table','under'));
  assert.equal(placeOnSurface([table,tall],'tall','table','under'),null);
  const list=[table,plant];assert.ok(groundArea(list,plant));assert.ok(accessibleContents(list,'table').some(c=>c.id==='plant'&&c.ground));
  const next=movedArrangement(list,'table',{x:table.x+30,rotation:90});assert.deepEqual(next[1],plant);
});
test('actual legs and plumbing remain solid even though under-table floor is accessible',()=>{
  for(const rotation of [0,90,180,270]){
    const table=o('table','wood-square-table',312,240,1,rotation),leg=spaceObstacles(table).find(p=>p.role==='post');
    const q=surfacePoint(table,{x:leg.x,z:leg.z}),plant={...o('plant','barrel',312,240,.5),...q};
    assert.ok(!clearPlacement([table,plant],new Set(['plant'])));
  }
});
test('a tall grounded crown cannot pass through a tabletop while a short potted plant can stand underneath',()=>{
  const table=o('table','wood-square-table'),short=o('short','barrel'),tall=o('tall','column');
  assert.ok(clearPlacement([table,short],new Set(['short'])));
  assert.ok(!clearPlacement([table,tall],new Set(['tall'])));
});
test('nested vessel contents retain the enclosing shelf headroom instead of passing through the next board',()=>{
  const rack=o('rack','iron-3-black'),box={...o('box','crate-blue',312,240,.95),support:{id:'rack',surface:'shelf-1'}},plant={...o('plant','column'),pot:'plastic',support:{id:'box',surface:'inside-floor'}};
  assert.ok(fitsSurface(box,rack,supportSurfaces(rack)[0]));
  assert.ok(fitsSurface(plant,box,supportSurfaces(box)[0]));
  assert.ok(!clearPlacement([rack,box,plant],new Set(['plant'])));
  const top={...box,support:{id:'rack',surface:'shelf-3'}};
  assert.ok(clearPlacement([rack,top,plant],new Set(['plant'])));
});
test('taking out a nested item searches genuine free floor and still allows ordinary resizing',()=>{
  let list=[o('table','wood-square-table'),o('box','crate-blue',320,245,.8),o('tool','pruning-shears',330,260,.5)];
  list=placed(list,'box','table','table-top');list=placed(list,'tool','box','inside-floor');
  const tool=list.find(o=>o.id==='tool'),remaining=list.filter(o=>o.id!=='tool');
  const floor=findGroundPlacement('north',{...tool,support:null},remaining,{x:tool.x,y:tool.y});
  assert.ok(floor);assert.equal(floor.support,null);assert.ok(fits('north',floor));assert.ok(clearPlacement([...remaining,floor],new Set(['tool'])));
  const resized=resizedObject('north',floor,1.2,[...remaining,floor]);assert.ok(resized);assert.equal(resized.scale,1.2);assert.equal(resized.support,null);
});
test('an opaque tabletop keeps floor contents reachable without turning them into carried descendants',()=>{
  let list=[o('table','wood-square-table'),o('ground','barrel',312,240,.5),o('top','pruning-shears',325,240,.5)];
  list=placed(list,'top','table','table-top');
  const contents=accessibleContents(list,'table');assert.ok(contents.some(c=>c.id==='ground'&&c.ground));assert.ok(contents.some(c=>c.id==='top'&&!c.ground));
  assert.equal(resolveSupports(list).get('ground').parentId,undefined);
  const next=movedArrangement(list,'table',{x:352,y:280,rotation:90});assert.deepEqual(next[1],list[1]);assert.notDeepEqual(next[2],list[2]);
  assert.ok(resizedObject('north',list[1],1.2,list));
});
test('filled foam boxes and aquaria expose no imaginary empty cavity',()=>{
  for(const type of ['foam-soil','foam-seedlings','aquarium-rectangle','aquarium-square','ceramic-fish-bowl']){
    assert.deepEqual(supportSurfaces(o('x',type)),[]);assert.equal(placementKind(type).bearing,false);assert.equal(placeOnSurface([o('x',type),o('p','barrel')],'p','x','inside'),null);
  }
  assert.ok(supportSurfaces(o('x','vessel-foam')).some(s=>s.container));
});
test('washstation worktops, real bowl floor, rim and outlet remain distinct at native scale',()=>{
  const sink=o('sink','steel-sink'),surfaces=supportSurfaces(sink),floor=surfaces.find(s=>s.container);
  assert.equal(surfaces.length,3);close(floor.y,.5745*U);close(floor.rim,.8125*U);close(floor.holes[0].w,.06*U);
  assert.ok(floor.y<surfaces[0].y);assert.ok(floor.internalDepth>0);assert.equal(floor.ceiling,Infinity);
  for(const s of surfaces)for(const rotation of [0,90,180,270]){const p={...sink,rotation},q=localPoint({...o('c','pruning-shears'),...surfacePoint(p,s)},p);close(q.x,s.x);close(q.z,s.z);}
});
test('a parent must fit the world boundary and supported children cannot rescue an outside parent',()=>{
  const stand=o('stand','iron-3-black'),child={...o('child','barrel'),support:{id:'stand',surface:'shelf-3'}};
  assert.ok(fits('north',child,[stand]));assert.ok(!fits('north',child,[{...stand,x:0,y:0}]));assert.ok(!supportedLayout('north',[child]));
});
