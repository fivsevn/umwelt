export const SCENE_VERSION=1;
const fail=message=>{throw new Error(message)};
const number=(v,fallback,min=-10000,max=10000)=>{
 const n=v===undefined?fallback:v;
 if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)fail('场景数值超出允许范围');
 return n;
};
function params(value,depth=0){
 if(depth===0&&(!value||Array.isArray(value)||typeof value!=='object'))fail('素材参数须为对象');
 if(depth>6)fail('参数层级过深');
 if(value===null||typeof value==='boolean')return value;
 if(typeof value==='number')return number(value,0);
 if(typeof value==='string'&&value.length<200)return value;
 if(Array.isArray(value)&&value.length<=100)return value.map(v=>params(v,depth+1));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>{
  if(['__proto__','constructor','prototype'].includes(k))fail('非法参数');
  if(['variant','tone'].includes(k)&&(!Number.isInteger(v)||v<0||v>5))fail('素材变体无效');
  if(['wetness','alpha','age','light','moisture','lift','x','y','a'].includes(k))number(v,0);
  if(k==='wetZones'&&(!Array.isArray(v)||v.some(z=>!z||typeof z!=='object'||!Number.isFinite(z.x)||!Number.isFinite(z.y))))fail('湿区参数无效');
  if(['rx','ry','length'].includes(k))number(v,1,.01,500);
  if(k==='scale')number(v,1,.05,4);
  return [k,params(v,depth+1)];
 }));
 fail('非法参数');
}
export function exportScene(state,reference,assets){
 return {version:SCENE_VERSION,canvas:{width:384,height:430},angleUnit:'radians',
  background:{type:state.background,seed:state.backgroundSeed,params:state.backgroundParams??assets.get(state.background).params},
  objects:state.items.map(item=>({id:item.id,type:item.assetId,x:item.x,y:item.y,scale:item.scale,angle:item.a,z:item.z,seed:item.seed,params:item.params??assets.get(item.assetId).params})),reference:{...reference}};
}
export function importScene(text,assets,defaultReference){
 if(text.length>1000000)fail('场景文件过大');
 let data;
 try{data=JSON.parse(text.startsWith('UMWELT1:')?decodeURIComponent(escape(atob(text.slice(8)))):text)}catch{fail('无法读取 JSON 或分享代码')}
 if(!data||typeof data!=='object')fail('场景必须是 JSON 对象');
 if(data.version!==undefined&&data.version!==1)fail('不支持此场景版本');
 if(data.angleUnit&&data.angleUnit!=='radians')fail('角度单位必须是 radians');
 if(data.canvas&&(data.canvas.width!==384||data.canvas.height!==430))fail('画布尺寸须为 384 × 430');
 const bg=typeof data.background==='string'?{type:data.background,seed:data.backgroundSeed}:data.background||{type:'substrate-wet-left'};
 if(assets.get(bg.type)?.kind!=='background')fail('未知基质类型');
 const objects=data.objects??data.items;
 if(!Array.isArray(objects)||objects.length>150)fail('场景须包含不超过 150 个物件');
 const ids=new Set();
 const items=objects.map((o,i)=>{
  if(!o||typeof o!=='object')fail('非法场景物件');
  const assetId=o.type??o.assetId,id=o.id??'instance-'+(i+1);
  if(!assets.has(assetId)||assets.get(assetId).kind==='background')fail('未知素材类型：'+String(assetId));
  if(typeof id!=='string'||id.length>120||ids.has(id))fail('物件 id 无效或重复');ids.add(id);
  return {id,assetId,x:number(o.x,192),y:number(o.y,215),a:number(o.angle??o.a,0),scale:number(o.scale,1,.05,4),z:number(o.z,0),seed:number(o.seed,0,0,4294967295),...(o.params===undefined?{}:{params:params(o.params)})};
 });
 const r={...defaultReference,...data.reference};
 if(typeof r.species!=='string'||!['S','M','L'].includes(r.stage)||typeof r.visible!=='boolean')fail('标本参考参数无效');
 for(const k of ['x','y','a','seed'])r[k]=number(r[k],defaultReference[k],k==='seed'?0:-10000,k==='seed'?4294967295:10000);
 let nextId=1;while(ids.has('instance-'+nextId))nextId++;
 return {state:{background:bg.type,backgroundSeed:number(bg.seed,57,0,4294967295),...(bg.params===undefined?{}:{backgroundParams:params(bg.params)}),items,selected:null,nextId},reference:r};
}
export function shareCode(scene){return 'UMWELT1:'+btoa(unescape(encodeURIComponent(JSON.stringify(scene))))}
