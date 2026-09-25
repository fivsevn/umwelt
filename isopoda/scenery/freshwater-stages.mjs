// Freshwater material-cycle layouts authored in /isopoda/habitat.
// Stage identity follows the supplied filenames/order. Embedded JSON metadata is
// intentionally ignored because later layouts were edited from earlier exports.
import STAGE_01 from './freshwater-stage-data/01.mjs';
import STAGE_02 from './freshwater-stage-data/02.mjs';
import STAGE_03 from './freshwater-stage-data/03.mjs';
import STAGE_04 from './freshwater-stage-data/04.mjs';
import STAGE_05 from './freshwater-stage-data/05.mjs';

export const FRESHWATER_STAGE_META=Object.freeze([{"id":"leaf","label":"01 · 叶片 / LEAF"},{"id":"conditioned","label":"02 · 微生物加工 / CONDITIONED"},{"id":"fragmented","label":"03 · 啃食与破碎 / FRAGMENTED"},{"id":"suspended","label":"04 · 悬浮碎屑 / SUSPENDED"},{"id":"redeposited","label":"05 · 再沉积底面 / REDEPOSITED"}]);

const BACKGROUND={"type":"water-freshwater","seed":83,"params":{"aquatic":true,"kind":"freshwater","palette":["#273b32","#344439","#4e5140","#68634b"]}};
const REFERENCE={"species":"aquaticus","stage":"M","x":226,"y":286,"a":-0.34,"seed":189,"visible":false};
const PARAMS={"bark-log-01":{"variant":2,"scale":1.02,"tone":"waterlogged"},"stone-round-01":{"variant":0,"scale":1},"stone-flat-01":{"variant":1,"scale":1},"stone-shard-01":{"variant":2,"scale":1},"waterweed-tuft-02":{"kind":"waterweed","height":78,"flow":42},"waterweed-tuft-01":{"kind":"waterweed","height":58,"flow":36},"root-tangle-01":{"labDetail":"root-tangle"},"leaf-broad-01":{"variant":0,"tone":0,"scale":1.04},"twig-01":{"length":24},"moss-sphagnum-02":{"rx":34,"ry":22,"wetness":0.62,"alpha":0.76},"silt-pocket-01":{"labDetail":"silt"},"leaf-narrow-01":{"variant":1,"tone":1,"scale":0.92},"woodchip-01":{"variant":0,"scale":0.82},"woodchip-02":{"variant":1,"scale":0.72},"stone-small-01":{"variant":3,"scale":0.82},"freshwater-detritus-01":{"detail":"detritus","count":13},"leaf-broken-01":{"variant":3,"tone":2,"scale":1.04,"gap":true},"bark-fragment-01":{"variant":1,"scale":0.96},"leaf-skeleton-01":{"labDetail":"leaf-skeleton"}};
const ROWS=[STAGE_01,STAGE_02,STAGE_03,STAGE_04,STAGE_05];

function expand(row){
 const [id,type,x,y,scale,angle,flipX,z,seed]=row;
 return {id,type,x,y,scale,angle,flipX:!!flipX,z,seed,params:structuredClone(PARAMS[type]||{})};
}
export const FRESHWATER_STAGE_LAYOUTS=Object.freeze(ROWS.map((rows,index)=>Object.freeze({
 version:1,
 materialStage:index,
 canvas:{width:384,height:430},
 angleUnit:'radians',
 background:structuredClone(BACKGROUND),
 objects:rows.map(expand),
 reference:structuredClone(REFERENCE),
 metadata:Object.freeze({habitat:'freshwater',materialStage:index,stageId:FRESHWATER_STAGE_META[index].id})
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
