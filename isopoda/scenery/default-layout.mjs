// Canonical scene data authored in /isopoda/habitat and exported by the editor.
import {FOREST_LAYOUT} from './authored-layouts.mjs?v=authored-1';

export const DEFAULT_LAYOUT=FOREST_LAYOUT;
export const DEFAULT_SHELTER=DEFAULT_LAYOUT.objects.find(item=>item.type==='bark-shelter-01');

function familyFor(item){
 const p=item.params||{},id=item.type;
 if(p.labDetail)return 'scene-detail';
 if(p.detail)return 'aquatic-detail';
 if(p.kind)return 'aquatic';
 if(id.startsWith('woodchip'))return 'chip';
 if(id.startsWith('twig'))return 'twig';
 if(id.startsWith('cuttlebone'))return 'cuttlebone';
 if(id.startsWith('bark'))return 'bark';
 if(id.startsWith('leaf'))return 'leaf';
 if(id.startsWith('moss'))return 'moss';
 if(id.startsWith('stone'))return 'stone';
 return id.split('-')[0];
}

export function sceneObjects(layout=DEFAULT_LAYOUT){
 return layout.objects.map(item=>{
  const p=item.params||{},type=familyFor(item),instanceScale=item.scale??1;
  const result={...p,id:item.id,assetId:item.type,type,x:item.x,y:item.y,a:item.angle||0,seed:item.seed,z:item.z||0,flipX:item.flipX===true,params:p};
  if(['leaf','bark','stone','cuttlebone','chip'].includes(type))result.scale=(p.scale??1)*instanceScale;
  else if(type==='moss'){result.scale=instanceScale;result.rx=(p.rx??30)*instanceScale;result.ry=(p.ry??20)*instanceScale}
  else if(type==='twig'){result.scale=instanceScale;result.length=(p.length??18)*instanceScale}
  else result.scale=instanceScale;
  return result;
 });
}
