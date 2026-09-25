import {ESTUARY_LAYOUT} from './authored-layouts.mjs';
import {ESTUARY_NODES,estuaryIndex} from '../data/narrative/estuary.mjs';

// These IDs are the shared anchors for water, actors and observation marks.
// Keep them when replacing an exported stage. Coordinates are authored, not field measurements.
export const ESTUARY_ANCHORS=Object.freeze({origin:'estuary-origin-wood',algae:'estuary-algae-base',runnel:'estuary-observation-runnel'});
export const ESTUARY_STAGE_META=Object.freeze(ESTUARY_NODES.map((node,index)=>Object.freeze({id:node.id,label:`${String(index+1).padStart(2,'0')} · ${node.name[0]} / ${node.name[1].toUpperCase()}`})));
const additions=[
 {id:ESTUARY_ANCHORS.origin,type:'sunken-wood-01',x:149,y:225,scale:1.25,angle:-.16,flipX:false,z:58,seed:461,params:{labDetail:'sunken-wood'}},
 {id:ESTUARY_ANCHORS.algae,type:'ulva-clump-01',x:261,y:253,scale:1.1,angle:.12,flipX:false,z:60,seed:463,params:{kind:'ulva',height:38,flow:42}},
 {id:ESTUARY_ANCHORS.runnel,type:'tidal-runnel-01',x:234,y:294,scale:1.08,angle:.26,flipX:false,z:4,seed:467,params:{labDetail:'tidal-runnel'}}
];
// Only loose material changes position. The origin and comparison surfaces remain fixed.
const movement=[0,3,7,7,4,1];
export const ESTUARY_STAGE_LAYOUTS=Object.freeze(ESTUARY_NODES.map((node,index)=>{
 const layout=structuredClone(ESTUARY_LAYOUT);
 layout.objects=layout.objects.map(item=>item.type==='wrack-line-01'?{...item,x:item.x+movement[index],y:item.y+movement[index]*.4}:item);
 layout.objects.push(...structuredClone(additions));
 layout.reference={species:'hookeri',stage:'M',x:167,y:239,a:-.16,seed:189,visible:false};
 layout.observationIndex=index;
 layout.metadata={habitat:'estuary',sequence:'estuary-observation',observationIndex:index,nodeId:node.id,anchors:{...ESTUARY_ANCHORS}};
 return Object.freeze(layout);
}));
export function estuaryLayout(value=0){
 const index=Number.isInteger(value)?value:estuaryIndex(value);
 return ESTUARY_STAGE_LAYOUTS[Math.max(0,Math.min(5,index))];
}
export function estuaryStageFilename(index){
 if(!Number.isInteger(index)||index<0||index>5)throw new RangeError('Invalid estuary observation index');
 return `habitat-layout-brackish-estuary-observation-${String(index+1).padStart(2,'0')}-${ESTUARY_NODES[index].id}.json`;
}
export function validateEstuaryLayout(layout,index=layout?.metadata?.observationIndex){
 if(!Number.isInteger(index)||index<0||index>5)throw new RangeError('河口观察序号必须为 0–5 / Estuary observation must be 0–5');
 if(layout?.background?.type!=='water-estuary')throw new Error('河口布景需要 water-estuary 背景 / Estuary background required');
 if(layout.metadata?.nodeId&&layout.metadata.nodeId!==ESTUARY_NODES[index].id)throw new Error('河口阶段名称与序号不一致 / Estuary stage identity mismatch');
 const ids=layout.objects?.map(o=>o.id)||[];
 for(const id of Object.values(ESTUARY_ANCHORS))if(ids.filter(value=>value===id).length!==1)throw new Error('缺少唯一观察锚点 / Missing unique observation anchor: '+id);
 return index;
}
export function estuaryPoint(layout,point){
 const id=ESTUARY_ANCHORS[point.anchor],item=layout.objects.find(o=>o.id===id);
 if(!item)return null; // Deleted anchors never silently fall back to unrelated coordinates.
 const scale=item.scale??1,angle=item.angle??item.a??0,x=point.x*(item.flipX?-1:1),y=point.y;
 return {x:item.x+(x*Math.cos(angle)-y*Math.sin(angle))*scale,y:item.y+(x*Math.sin(angle)+y*Math.cos(angle))*scale};
}
