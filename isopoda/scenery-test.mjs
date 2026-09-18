import {drawStudySubstrate,drawStudyLeaf,drawStudyMoss,drawStudyBark,drawStudyStone,drawStudyCuttlebone,drawStudyTwig,drawStudyWoodChip} from '../tests/scenery-study.mjs?v=jp16-3';
import {SPECIES,speciesById} from './species-registry.mjs?v=species-39b';
import {renderModel,pixelAnatomy} from './sprites.mjs?v=exuvia-1';

const $=s=>document.querySelector(s);
const scene=$('#scene'),ctx=scene.getContext('2d');ctx.imageSmoothingEnabled=false;

// Exact projection multiplier used by habitat.mjs for live specimens.
// Keep this local tool value in sync with SCENE_ACTOR_SCALE when the game renderer changes.
const GAME_ACTOR_SCALE=.88;
const reference={
 species:'dairy',stage:'M',x:226,y:286,a:-.34,seed:189,visible:true
};
let referenceHitCells=[];

for(const p of SPECIES.filter(p=>p.game?.habitatEligible!==false)){
 const option=new Option(`${p.label||p.name||p.id} · ${p.taxon||p.id}`,p.id);
 $('#referenceSpecies').append(option);
}
$('#referenceSpecies').value=reference.species;
$('#referenceStage').value=reference.stage;

const ASSETS=[
 {id:'substrate-dry',category:'substrate',kind:'background',label:'Dry substrate',note:'基质 / 干燥',params:{wetZones:[],light:82}},
 {id:'substrate-wet-left',category:'substrate',kind:'background',label:'Moisture gradient',note:'基质 / 左侧湿区',params:{wetZones:[{x:44,y:215,rx:92,ry:250,moisture:78}],light:82}},
 {id:'substrate-forest',category:'substrate',kind:'background',label:'Forest floor',note:'基质 / 林地湿润斑块',params:{wetZones:[{x:60,y:120,rx:115,ry:170,moisture:74},{x:320,y:300,rx:90,ry:115,moisture:58}],light:76}},

 {id:'moss-sphagnum-01',category:'moss',label:'Sphagnum cluster 01',note:'水苔 / 大片',radius:52,params:{rx:48,ry:31,wetness:.76,alpha:.80}},
 {id:'moss-sphagnum-02',category:'moss',label:'Sphagnum cluster 02',note:'水苔 / 小片',radius:38,params:{rx:34,ry:22,wetness:.62,alpha:.76}},
 {id:'moss-carpet-03',category:'moss',label:'Moss carpet 03',note:'苔藓 / 林地大片',radius:64,params:{rx:58,ry:36,wetness:.70,alpha:.84}},

 {id:'leaf-broad-01',category:'leaf',label:'Dry leaf 01',note:'枯叶 / 宽叶',radius:44,params:{variant:0,tone:0,scale:.72}},
 {id:'leaf-narrow-01',category:'leaf',label:'Dry leaf 02',note:'枯叶 / 狭长',radius:46,params:{variant:1,tone:1,scale:.72}},
 {id:'leaf-broken-01',category:'leaf',label:'Broken leaf 01',note:'枯叶 / 破损',radius:46,params:{variant:3,tone:2,scale:.74,gap:true}},
 {id:'leaf-fan-01',category:'leaf',label:'Fan leaf 01',note:'枯叶 / 扇形裂叶',radius:48,params:{variant:4,tone:1,scale:.78}},
 {id:'leaf-curled-01',category:'leaf',label:'Curled leaf 01',note:'枯叶 / 卷曲',radius:44,params:{variant:5,tone:2,scale:.72}},

 {id:'bark-shelter-01',category:'bark',label:'Bark shelter 01',note:'树皮 / 躲避',radius:88,params:{variant:0,scale:.72}},
 {id:'bark-fragment-01',category:'bark',label:'Bark fragment 01',note:'树皮 / 碎片',radius:68,params:{variant:1,scale:.68}},

 {id:'stone-round-01',category:'stone',label:'Stone round 01',note:'石块 / 圆',radius:18,params:{variant:0,scale:1}},
 {id:'stone-flat-01',category:'stone',label:'Stone flat 01',note:'石块 / 扁平',radius:20,params:{variant:1,scale:1}},
 {id:'stone-small-01',category:'stone',label:'Stone small 01',note:'石块 / 小',radius:15,params:{variant:2,scale:.82}},

 {id:'cuttlebone-01',category:'calcium',label:'Cuttlebone 01',note:'墨鱼骨 / 钙源',radius:30,params:{scale:.82}},

 {id:'twig-01',category:'debris',label:'Twig 01',note:'细枝',radius:24,params:{length:24}},
 {id:'woodchip-01',category:'debris',label:'Wood chip 01',note:'木屑 / 碎片',radius:26,params:{variant:0,scale:.82}},
 {id:'woodchip-02',category:'debris',label:'Wood chip 02',note:'木屑 / 长片',radius:30,params:{variant:1,scale:.72}}
];
const ASSET_BY_ID=new Map(ASSETS.map(a=>[a.id,a]));

const STARTER=[
 {assetId:'moss-sphagnum-01',x:76,y:94,a:0,scale:1,seed:3,z:10},
 {assetId:'moss-sphagnum-02',x:58,y:352,a:0,scale:1,seed:11,z:11},
 {assetId:'leaf-broad-01',x:305,y:94,a:-.55,scale:1,seed:17,z:24},
 {assetId:'leaf-broken-01',x:118,y:342,a:-2.35,scale:1,seed:19,z:25},
 {assetId:'stone-flat-01',x:308,y:312,a:0,scale:1,seed:27,z:27},
 {assetId:'bark-shelter-01',x:194,y:220,a:-.06,scale:1,seed:57,z:30},
 {assetId:'cuttlebone-01',x:332,y:166,a:-.42,scale:1,seed:67,z:33}
];

const FOREST_STUDY=[
 {assetId:'moss-carpet-03',x:58,y:62,a:0,scale:1.28,seed:101,z:8},
 {assetId:'moss-sphagnum-01',x:26,y:142,a:0,scale:1.00,seed:103,z:9},
 {assetId:'moss-sphagnum-02',x:354,y:140,a:0,scale:.92,seed:107,z:9},
 {assetId:'moss-carpet-03',x:42,y:365,a:0,scale:1.18,seed:109,z:8},
 {assetId:'moss-sphagnum-02',x:338,y:236,a:0,scale:.82,seed:113,z:9},

 {assetId:'bark-shelter-01',x:118,y:128,a:-.10,scale:1.16,seed:127,z:24},
 {assetId:'bark-fragment-01',x:89,y:160,a:-.18,scale:.88,seed:131,z:23},

 {assetId:'leaf-fan-01',x:320,y:78,a:.28,scale:1.24,seed:137,z:28},
 {assetId:'leaf-broad-01',x:122,y:286,a:.72,scale:1.35,seed:139,z:27},
 {assetId:'leaf-broken-01',x:322,y:292,a:-.74,scale:1.12,seed:149,z:27},
 {assetId:'leaf-curled-01',x:338,y:366,a:-.28,scale:.88,seed:151,z:27},
 {assetId:'leaf-narrow-01',x:213,y:372,a:2.66,scale:.66,seed:157,z:26},

 {assetId:'twig-01',x:235,y:52,a:.46,scale:2.65,seed:163,z:19},
 {assetId:'twig-01',x:265,y:177,a:.22,scale:2.25,seed:167,z:19},
 {assetId:'twig-01',x:18,y:325,a:.35,scale:2.15,seed:173,z:18},
 {assetId:'woodchip-01',x:170,y:235,a:-.38,scale:.85,seed:179,z:20},
 {assetId:'woodchip-02',x:244,y:324,a:.72,scale:.76,seed:181,z:20},

 {assetId:'stone-round-01',x:292,y:188,a:0,scale:1.18,seed:191,z:25},
 {assetId:'stone-flat-01',x:318,y:346,a:.04,scale:1.48,seed:193,z:25},
 {assetId:'stone-small-01',x:194,y:334,a:0,scale:.86,seed:197,z:24},
 {assetId:'stone-small-01',x:82,y:238,a:0,scale:.78,seed:199,z:24},

 {assetId:'cuttlebone-01',x:314,y:214,a:-.20,scale:1.14,seed:211,z:31}
];

let state={background:'substrate-wet-left',backgroundSeed:57,items:[],selected:null,nextId:1};
let category='all',drag=null;

function loadPreset(items,background='substrate-wet-left'){
 state.background=background;
 state.backgroundSeed=(background==='substrate-forest'?103:57);
 state.items=items.map(item=>({...item,id:'instance-'+state.nextId++}));
 state.selected=null;
}
function cloneStarter(){loadPreset(STARTER,'substrate-wet-left')}
cloneStarter();

function drawBackground(target,assetId=state.background,seed=state.backgroundSeed){
 const asset=ASSET_BY_ID.get(assetId)||ASSET_BY_ID.get('substrate-dry');
 drawStudySubstrate(target,{...asset.params,seed});
}

function drawObject(target,asset,item,preview=false){
 const x=item.x,y=item.y,a=item.a||0,seed=item.seed||0,mult=item.scale??1,p=asset.params||{};
 if(asset.category==='leaf')return drawStudyLeaf(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
 if(asset.category==='moss')return drawStudyMoss(target,{...p,x,y,seed,rx:(p.rx||30)*mult,ry:(p.ry||20)*mult});
 if(asset.category==='bark')return drawStudyBark(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
 if(asset.category==='stone')return drawStudyStone(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
 if(asset.category==='calcium')return drawStudyCuttlebone(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
 if(asset.id.startsWith('twig'))return drawStudyTwig(target,{...p,x,y,a,seed,length:(p.length||18)*mult});
 if(asset.id.startsWith('woodchip'))return drawStudyWoodChip(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
}

function drawReferenceSpecimen(){
 referenceHitCells=[];
 if(!reference.visible)return;
 const species=speciesById(reference.species);
 const model=renderModel(species.visual,{stage:reference.stage,seed:reference.seed});
 const scale=GAME_ACTOR_SCALE*model.growth.scale,ca=Math.cos(reference.a),sa=Math.sin(reference.a);
 const seen=new Map();
 for(const module of pixelAnatomy(model,{posture:'normal',phase:0,moving:false})){
  for(const [sx,sy,color] of module.cells){
   if(!color)continue;
   const ox=sx*scale,oy=sy*scale;
   const x=Math.round(reference.x+ox*ca-oy*sa),y=Math.round(reference.y+ox*sa+oy*ca);
   seen.set(x+','+y,[x,y,color]);
  }
 }
 referenceHitCells=[...seen.values()];
 for(const [x,y,color] of referenceHitCells){ctx.fillStyle=color;ctx.fillRect(x,y,1,1)}
 const size=species.renderSize?.referenceMm;
 $('#specimenReadout').textContent=`${species.label||species.name||species.id} · ${reference.stage} · 1× game habitat scale${Number.isFinite(size)?` · ref ${size.toFixed(size<2?1:0)} mm`:''}`;
}

function referenceHit(point){
 return reference.visible&&referenceHitCells.some(([x,y])=>point.x>=x-3&&point.x<=x+4&&point.y>=y-3&&point.y<=y+4);
}

function drawScene(){
 ctx.clearRect(0,0,scene.width,scene.height);
 drawBackground(ctx);
 const ordered=[...state.items].sort((a,b)=>(a.z||0)-(b.z||0));
 for(const item of ordered){
  const asset=ASSET_BY_ID.get(item.assetId);if(asset)drawObject(ctx,asset,item);
 }
 drawReferenceSpecimen();
 const selected=state.items.find(i=>i.id===state.selected);
 if(selected){
  const asset=ASSET_BY_ID.get(selected.assetId),r=Math.max(8,(asset?.radius||24)*selected.scale);
  ctx.save();ctx.strokeStyle='rgba(222,220,196,.72)';ctx.lineWidth=1;ctx.setLineDash([3,3]);
  ctx.strokeRect(Math.round(selected.x-r),Math.round(selected.y-r),Math.round(r*2),Math.round(r*2));ctx.restore();
 }
 $('#objectCount').textContent=`${state.items.length} OBJECTS`;
 $('#backgroundReadout').textContent=state.background;
 updateInspector();
}

function makePreview(asset){
 const c=document.createElement('canvas');c.width=148;c.height=128;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 if(asset.kind==='background'){
  drawBackground(g,asset.id,57);
 }else{
  const scale=asset.category==='bark'?.72:asset.category==='leaf'?.82:asset.category==='moss'?.88:1;
  drawObject(g,asset,{x:c.width/2,y:c.height/2,a:asset.category==='leaf'?-.35:asset.category==='bark'?-.08:0,seed:57,scale});
 }
 return c;
}

function renderAssetList(){
 const list=$('#assetList');list.replaceChildren();
 for(const asset of ASSETS){
  if(category!=='all'&&asset.category!==category)continue;
  const card=document.createElement('button');card.type='button';card.className='asset-card';card.dataset.kind=asset.kind||'object';
  const copy=document.createElement('div'),name=document.createElement('b'),type=document.createElement('span'),note=document.createElement('small');
  name.textContent=asset.label;type.textContent=asset.id;note.textContent=asset.note;
  copy.append(name,type,note);card.append(makePreview(asset),copy);
  card.onclick=()=>asset.kind==='background'?setBackground(asset.id):addAsset(asset);
  list.append(card);
 }
}

function setBackground(assetId){
 state.background=assetId;state.backgroundSeed=(state.backgroundSeed+17)>>>0;drawScene();
}
function addAsset(asset){
 const n=state.items.length;
 const item={assetId:asset.id,id:'instance-'+state.nextId++,x:192+((n*29)%80)-40,y:215+((n*37)%90)-45,a:0,scale:1,seed:(57+n*31)>>>0,z:20+n};
 state.items.push(item);state.selected=item.id;drawScene();
}

function selectedItem(){return state.items.find(i=>i.id===state.selected)||null}
function updateInspector(){
 const item=selectedItem(),empty=$('#emptyInspector'),panel=$('#selectedInspector');
 empty.hidden=!!item;panel.hidden=!item;if(!item)return;
 const asset=ASSET_BY_ID.get(item.assetId);
 $('#selectedLabel').textContent=asset?.label||item.assetId;$('#selectedId').textContent=item.id+' / '+item.assetId;
 $('#selectedType').textContent=asset?.category||'—';$('#selectedPosition').textContent=`${Math.round(item.x)}, ${Math.round(item.y)}`;
 $('#selectedSeed').textContent=String(item.seed>>>0);$('#selectedScale').textContent=item.scale.toFixed(2);
 $('#selectedAngle').textContent=(item.a||0).toFixed(2)+' rad';$('#selectedZ').textContent=String(item.z||0);
}

function canvasPoint(event){
 const r=scene.getBoundingClientRect();
 return {x:(event.clientX-r.left)*scene.width/r.width,y:(event.clientY-r.top)*scene.height/r.height};
}
function hitTest(point){
 return [...state.items].sort((a,b)=>(b.z||0)-(a.z||0)).find(item=>{
  const asset=ASSET_BY_ID.get(item.assetId),r=Math.max(8,(asset?.radius||24)*item.scale);
  return Math.hypot(point.x-item.x,point.y-item.y)<=r;
 })||null;
}
scene.addEventListener('pointerdown',event=>{
 const p=canvasPoint(event);
 if(referenceHit(p)){
  state.selected=null;drag={kind:'specimen',dx:p.x-reference.x,dy:p.y-reference.y};
  scene.setPointerCapture(event.pointerId);
 }else{
  const item=hitTest(p);state.selected=item?.id||null;
  if(item){drag={kind:'asset',id:item.id,dx:p.x-item.x,dy:p.y-item.y};scene.setPointerCapture(event.pointerId)}
 }
 $('#pointerReadout').textContent=`${Math.round(p.x)}, ${Math.round(p.y)}`;drawScene();
});
scene.addEventListener('pointermove',event=>{
 const p=canvasPoint(event);$('#pointerReadout').textContent=`${Math.round(p.x)}, ${Math.round(p.y)}`;
 if(!drag)return;
 if(drag.kind==='specimen'){
  reference.x=Math.max(0,Math.min(scene.width,p.x-drag.dx));
  reference.y=Math.max(0,Math.min(scene.height,p.y-drag.dy));
  drawScene();return;
 }
 const item=state.items.find(i=>i.id===drag.id);if(!item)return;
 item.x=Math.max(0,Math.min(scene.width,p.x-drag.dx));item.y=Math.max(0,Math.min(scene.height,p.y-drag.dy));drawScene();
});
scene.addEventListener('pointerup',()=>drag=null);scene.addEventListener('pointercancel',()=>drag=null);
scene.addEventListener('pointerleave',()=>{if(!drag)$('#pointerReadout').textContent='—'});

for(const button of document.querySelectorAll('[data-category]'))button.onclick=()=>{
 category=button.dataset.category;
 for(const b of document.querySelectorAll('[data-category]'))b.setAttribute('aria-pressed',String(b===button));
 renderAssetList();
};

$('#forestScene').onclick=()=>{
 loadPreset(FOREST_STUDY,'substrate-forest');
 reference.x=208;reference.y=248;reference.a=-.26;drawScene();
};
$('#resetScene').onclick=()=>{cloneStarter();reference.x=226;reference.y=286;reference.a=-.34;drawScene()};
$('#clearScene').onclick=()=>{state.items=[];state.selected=null;drawScene()};

$('#referenceSpecies').onchange=event=>{reference.species=event.target.value;reference.seed=(reference.seed+31)>>>0;drawScene()};
$('#referenceStage').onchange=event=>{reference.stage=event.target.value;drawScene()};
$('#toggleReference').onclick=event=>{
 reference.visible=!reference.visible;
 event.currentTarget.setAttribute('aria-pressed',String(reference.visible));
 event.currentTarget.textContent='GAME SCALE · '+(reference.visible?'ON':'OFF');
 drawScene();
};

document.querySelector('.control-grid').addEventListener('click',event=>{
 const button=event.target.closest('button[data-action]'),item=selectedItem();if(!button||!item)return;
 const action=button.dataset.action;
 if(action==='rotate-left')item.a=(item.a||0)-Math.PI/12;
 if(action==='rotate-right')item.a=(item.a||0)+Math.PI/12;
 if(action==='scale-down')item.scale=Math.max(.45,item.scale-.1);
 if(action==='scale-up')item.scale=Math.min(1.8,item.scale+.1);
 if(action==='back')item.z=(item.z||0)-1;
 if(action==='front')item.z=(item.z||0)+1;
 if(action==='reroll')item.seed=(item.seed+97)>>>0;
 if(action==='delete'){state.items=state.items.filter(i=>i.id!==item.id);state.selected=null}
 drawScene();
});

renderAssetList();drawScene();
