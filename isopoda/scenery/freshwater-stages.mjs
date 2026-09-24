import {FRESHWATER_LAYOUT} from './authored-layouts.mjs';

const BASE_IDS=new Set([
 'instance-1', // submerged log
 'instance-3','instance-4','instance-6', // stable stones
 'instance-9','instance-10','instance-12','instance-14','instance-15', // stable waterweed anchors
 'instance-19', // root tangle
 'instance-26' // silt pocket
]);
const fixed=FRESHWATER_LAYOUT.objects.filter(item=>BASE_IDS.has(item.id)).map(item=>structuredClone(item));

const object=(id,type,x,y,scale,angle,z,seed,params,flipX=false)=>({
 id,type,x,y,scale,angle,flipX,z,seed,params
});
const leaf=(id,x,y,scale,angle,z,seed,{variant=0,tone=0,gap=false}={})=>
 object(id,variant===3?'leaf-broken-01':'leaf-broad-01',x,y,scale,angle,z,seed,{variant,tone,scale:1.04,gap});
const fragment=(id,x,y,scale,angle,z,seed,{variant=1,tone=2,gap=true}={})=>
 object(id,variant===3?'leaf-broken-01':'leaf-narrow-01',x,y,scale,angle,z,seed,{variant,tone,scale:variant===1?.92:1.04,gap});
const skeleton=(id,x,y,scale,angle,z,seed)=>
 object(id,'leaf-skeleton-01',x,y,scale,angle,z,seed,{labDetail:'leaf-skeleton'});
const detritus=(id,x,y,scale,angle,z,seed,count=13)=>
 object(id,'freshwater-detritus-01',x,y,scale,angle,z,seed,{detail:'detritus',count});
const silt=(id,x,y,scale,angle,z,seed)=>
 object(id,'silt-pocket-01',x,y,scale,angle,z,seed,{labDetail:'silt'});

export const FRESHWATER_STAGE_META=Object.freeze([
 {id:'leaf',label:'01 · 叶片 / LEAF'},
 {id:'conditioned',label:'02 · 微生物加工 / CONDITIONED'},
 {id:'fragmented',label:'03 · 啃食与破碎 / FRAGMENTED'},
 {id:'suspended',label:'04 · 悬浮碎屑 / SUSPENDED'},
 {id:'redeposited',label:'05 · 再沉积底面 / REDEPOSITED'}
]);

const stageObjects=[
 [
  leaf('material-leaf-main',244,238,1.34,-.34,48,5001,{variant:0,tone:0,gap:false}),
  detritus('material-detritus-a',284,282,.42,-.08,43,5101,8)
 ],
 [
  leaf('material-leaf-main',242,239,1.31,-.32,48,5001,{variant:0,tone:2,gap:false}),
  detritus('material-detritus-a',274,274,.68,-.08,45,5101,12),
  detritus('material-biofilm-a',226,228,.38,.18,49,5109,7)
 ],
 [
  leaf('material-leaf-main',238,241,1.16,-.30,48,5001,{variant:0,tone:2,gap:true}),
  skeleton('material-veins-main',241,241,.72,-.30,49,5201),
  fragment('material-fragment-a',305,252,.45,.22,50,5207,{variant:1,tone:2,gap:true}),
  fragment('material-fragment-b',190,290,.38,-.72,45,5213,{variant:3,tone:2,gap:true}),
  detritus('material-detritus-a',281,276,.82,.08,44,5101,16)
 ],
 [
  skeleton('material-veins-main',228,246,.63,-.28,44,5201),
  fragment('material-fragment-a',304,198,.35,.58,49,5301,{variant:1,tone:2,gap:true}),
  fragment('material-fragment-b',335,276,.28,-.42,49,5307,{variant:3,tone:2,gap:true}),
  fragment('material-fragment-c',180,190,.24,1.02,48,5311,{variant:1,tone:2,gap:true}),
  detritus('material-detritus-a',270,300,.76,-.08,43,5317,18),
  detritus('material-detritus-b',330,330,.52,.12,43,5321,11)
 ],
 [
  skeleton('material-veins-remnant',196,268,.34,-.18,42,5401),
  detritus('material-bed-a',278,302,1.28,-.12,47,5411,22),
  detritus('material-bed-b',320,322,1.12,.08,47,5417,20),
  detritus('material-bed-c',244,330,.96,.18,46,5423,18),
  silt('material-silt-a',298,318,1.16,-.06,43,5431),
  silt('material-silt-b',252,346,.82,.08,42,5437),
  fragment('material-fragment-last',344,300,.19,.32,49,5441,{variant:1,tone:2,gap:true})
 ]
];

export const FRESHWATER_STAGE_LAYOUTS=Object.freeze(stageObjects.map((objects,index)=>Object.freeze({
 version:1,
 materialStage:index,
 canvas:{width:384,height:430},
 angleUnit:'radians',
 background:structuredClone(FRESHWATER_LAYOUT.background),
 objects:[...fixed.map(item=>structuredClone(item)),...objects],
 reference:structuredClone(FRESHWATER_LAYOUT.reference)
})));

export function freshwaterStageIndex(value){
 const explicit=Number(value?.scene?.materialStage);
 if(Number.isInteger(explicit))return Math.max(0,Math.min(FRESHWATER_STAGE_LAYOUTS.length-1,explicit));
 const records=Array.isArray(value?.records)?value.records:[];
 const completed=records.filter(record=>record.kind==='freshwater-material').length;
 return Math.max(0,Math.min(FRESHWATER_STAGE_LAYOUTS.length-1,completed));
}
export function freshwaterLayout(value=0){
 const index=Number.isInteger(value)?value:freshwaterStageIndex(value);
 return FRESHWATER_STAGE_LAYOUTS[Math.max(0,Math.min(FRESHWATER_STAGE_LAYOUTS.length-1,index))];
}
export function freshwaterStageFilename(index){
 const safe=Math.max(0,Math.min(FRESHWATER_STAGE_META.length-1,Number(index)||0));
 return `habitat-layout-freshwater-pool-stage-${String(safe+1).padStart(2,'0')}-${FRESHWATER_STAGE_META[safe].id}.json`;
}
