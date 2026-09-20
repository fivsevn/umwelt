import {exportScene,importScene,shareCode} from './scene-codec.mjs?v=forest-5';
import {drawSubstrate,drawLeaf,drawMossPatch,drawBark,drawStone,drawCuttlebone,drawTwig,drawWoodChip,BASE_SCENE} from './scenery/index.mjs?v=forest-5';
import {ACTOR_SCALE} from './scenery/grammar.mjs';
import {SPECIES,speciesById} from './species-registry.mjs?v=species-39b';
import {renderModel,pixelAnatomy} from './sprites.mjs?v=exuvia-1';

const $=s=>document.querySelector(s);
const scene=$('#scene'),ctx=scene.getContext('2d');ctx.imageSmoothingEnabled=false;

// Exact projection multiplier used by habitat.mjs for live specimens.
// The scale is shared with the game renderer.
const GAME_ACTOR_SCALE=ACTOR_SCALE;
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
 {id:'moss-carpet-03',category:'moss',label:'Moss carpet 03',note:'苔藓 / 林地大片',radius:64,params:{variant:2,rx:58,ry:36,wetness:.70,alpha:.84}},

 {id:'leaf-broad-01',category:'leaf',label:'Oak leaf',note:'橡树 / 裂片枯叶',radius:58,params:{variant:0,tone:0,scale:1.04}},
 {id:'leaf-narrow-01',category:'leaf',label:'Willow leaf',note:'柳树 / 狭长枯叶',radius:46,params:{variant:1,tone:1,scale:.92}},
 {id:'leaf-broken-01',category:'leaf',label:'Maple leaf',note:'枫树 / 掌状破损叶',radius:46,params:{variant:3,tone:2,scale:1.04,gap:true}},
 {id:'leaf-fan-01',category:'leaf',label:'Ginkgo leaf',note:'银杏 / 扇形裂叶',radius:60,params:{variant:4,tone:0,scale:1.04}},
 {id:'leaf-curled-01',category:'leaf',label:'Beech leaf',note:'林地阔叶 / 山毛榉',radius:58,params:{variant:5,tone:2,scale:1.0}},

 {id:'leaf-magnolia-01',category:'leaf',label:'Magnolia leaf',note:'玉兰 / 大宽叶',radius:60,params:{variant:2,tone:3,scale:1.10}},
 {id:'leaf-oak-rust',category:'leaf',label:'Oak · russet',note:'橡树 / 赤褐破损叶',radius:58,params:{variant:0,tone:1,scale:.72,gap:true}},
 {id:'leaf-ginkgo-brown',category:'leaf',label:'Ginkgo · aged',note:'银杏 / 深棕枯叶',radius:58,params:{variant:4,tone:2,scale:.72}},
 {id:'bark-log-01',category:'bark',label:'Mossy broken log',note:'断木 / 附苔',radius:68,params:{variant:2,scale:1.02}},
 {id:'bark-shelter-01',category:'bark',label:'Bark shelter 01',note:'树皮 / 躲避',radius:112,params:{variant:0,scale:1.16}},
 {id:'bark-fragment-01',category:'bark',label:'Bark fragment 01',note:'树皮 / 碎片',radius:68,params:{variant:1,scale:.96}},

 {id:'stone-round-01',category:'stone',label:'Stone round 01',note:'石块 / 圆',radius:18,params:{variant:0,scale:1}},
 {id:'stone-flat-01',category:'stone',label:'Stone flat 01',note:'石块 / 扁平',radius:20,params:{variant:1,scale:1}},
 {id:'stone-small-01',category:'stone',label:'Stone small 01',note:'石块 / 小',radius:15,params:{variant:3,scale:.82}},

 {id:'stone-shard-01',category:'stone',label:'Stone shard',note:'石块 / 缺角碎石',radius:18,params:{variant:2,scale:1}},
 {id:'cuttlebone-broken',category:'calcium',label:'Broken cuttlebone',note:'墨鱼骨 / 破损片',radius:30,params:{variant:1,scale:.82}},
 {id:'cuttlebone-01',category:'calcium',label:'Cuttlebone 01',note:'墨鱼骨 / 钙源',radius:30,params:{scale:.82}},

 {id:'twig-01',category:'debris',label:'Twig 01',note:'细枝',radius:24,params:{length:24}},
 {id:'woodchip-01',category:'debris',label:'Wood chip 01',note:'木屑 / 碎片',radius:26,params:{variant:0,scale:.82}},
 {id:'woodchip-02',category:'debris',label:'Wood chip 02',note:'木屑 / 长片',radius:30,params:{variant:1,scale:.72}}
];
const ASSET_BY_ID=new Map(ASSETS.map(a=>[a.id,a]));

const STARTER=BASE_SCENE.map(item=>{
 const assetId='game-'+item.id;
 const category=item.type==='cuttlebone'?'calcium':['twig','chip'].includes(item.type)?'debris':item.type;
 const {x,y,a,seed,z,...params}=item;
 const asset={id:assetId,category,label:item.id,note:'正式场景',radius:item.type==='bark'?90:item.type==='moss'?item.rx:45,params};
 ASSET_BY_ID.set(assetId,asset);
 return {assetId,x,y,a:a||0,scale:1,seed,z};
});

const FOREST_STUDY=[
 ...STARTER.filter(item=>!['game-leaf-top-right','game-leaf-bottom-right'].includes(item.assetId)),
 {assetId:'leaf-magnolia-01',x:300,y:87,a:-.65,scale:1.0,seed:137,z:28},
 {assetId:'leaf-oak-rust',x:281,y:347,a:.42,scale:1.16,seed:139,z:28},
 {assetId:'leaf-narrow-01',x:195,y:127,a:1.75,scale:.58,seed:149,z:23},
 {assetId:'leaf-curled-01',x:70,y:285,a:.12,scale:.46,seed:151,z:23},
 {assetId:'woodchip-01',x:74,y:364,a:-.75,scale:.92,seed:157,z:24},
 {assetId:'leaf-broken-01',x:166,y:53,a:.65,scale:.46,seed:163,z:23}
];

let state={background:'substrate-wet-left',backgroundSeed:57,items:[],selected:null,nextId:1};
let category='all',drag=null;

function loadPreset(items,background='substrate-wet-left'){
 state.background=background;delete state.backgroundParams;
 state.backgroundSeed=(background==='substrate-forest'?103:57);
 state.items=items.map(item=>({...item,id:'instance-'+state.nextId++}));
 state.selected=null;
}
function cloneStarter(){loadPreset(STARTER,'substrate-wet-left')}
cloneStarter();

function drawBackground(target,assetId=state.background,seed=state.backgroundSeed){
 const asset=ASSET_BY_ID.get(assetId)||ASSET_BY_ID.get('substrate-dry');
 drawSubstrate(target,{...asset.params,...(target===ctx?state.backgroundParams:{}),seed});
}

function drawObject(target,asset,item,preview=false){
 const x=item.x,y=item.y,a=item.a||0,seed=item.seed||0,mult=item.scale??1,p=item.params??asset.params??{};
 if(asset.category==='leaf')return drawLeaf(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
 if(asset.category==='moss')return drawMossPatch(target,{...p,x,y,a,seed,rx:(p.rx||30)*mult,ry:(p.ry||20)*mult});
 if(asset.category==='bark')return drawBark(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
 if(asset.category==='stone')return drawStone(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
 if(asset.category==='calcium')return drawCuttlebone(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
 if(asset.id.startsWith('twig')||p.type==='twig')return drawTwig(target,{...p,x,y,a,seed,length:(p.length||18)*mult});
 if(asset.id.startsWith('woodchip')||p.type==='chip')return drawWoodChip(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
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
  const scale=asset.category==='bark'?.48:asset.category==='leaf'?.72:asset.category==='moss'?.88:1;
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
 state.background=assetId;delete state.backgroundParams;state.backgroundSeed=(state.backgroundSeed+17)>>>0;drawScene();
}
function addAsset(asset){
 if(state.items.length>=150){$('#sceneMessage').textContent='最多放置 150 个物件';return}
 while(state.items.some(i=>i.id==='instance-'+state.nextId))state.nextId++;
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

const sceneText=$('#sceneText'),message=$('#sceneMessage');
const snapshot=()=>exportScene(state,reference,ASSET_BY_ID);
async function copy(text){
 sceneText.value=text;
 try{await navigator.clipboard.writeText(text);message.textContent='已复制场景'}
 catch{sceneText.focus();sceneText.select();message.textContent='请复制下方已选中的场景文本'}
}
$('#copyScene').onclick=()=>copy(JSON.stringify(snapshot(),null,2));
$('#copyShare').onclick=()=>copy(shareCode(snapshot()));
$('#downloadScene').onclick=()=>{
 const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download='habitat-layout.json';link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);message.textContent='已下载场景';
};
function restore(text){
 try{
  const imported=importScene(text.trim(),ASSET_BY_ID,reference);
  if(!SPECIES.some(p=>p.id===imported.reference.species))throw new Error('未知标本种类');
  state=imported.state;Object.assign(reference,imported.reference);drag=null;
  $('#referenceSpecies').value=reference.species;$('#referenceStage').value=reference.stage;
  $('#toggleReference').setAttribute('aria-pressed',String(reference.visible));
  $('#toggleReference').textContent='GAME SCALE · '+(reference.visible?'ON':'OFF');
  drawScene();message.textContent='已精确还原 '+state.items.length+' 个物件';
 }catch(error){message.textContent=error.message}
}
$('#importScene').onclick=()=>restore(sceneText.value);
$('#sceneFile').onchange=async event=>{
 const file=event.target.files[0];if(!file)return;
 if(file.size>1000000){message.textContent='场景文件过大';return}
 sceneText.value=await file.text();restore(sceneText.value);event.target.value='';
};
