import {px,rot,hash32} from './pixel.mjs';

export function drawBark(ctx,{x=192,y=218,a=-.08,scale=1,variant=0,lift=0,seed=57}={}){
 y+=lift;
 const ca=Math.cos(a),sa=Math.sin(a),half=(variant?66:82)*scale,depth=(variant?27:34)*scale,cell=2;
 const pal=variant
  ?['#342820','#4c3427','#67452f','#80583a','#9b7049','#bc8e5e']
  :['#30251f','#493126','#65432d','#80583a','#9f734a','#c09362'];
 const leftAt=v=>-half+(6+((v+depth)/(depth*2))*7)*scale,rightAt=v=>half-(5+(1-(v+depth)/(depth*2))*8)*scale;
 const at=(u,v,color)=>{const dx=u*ca-v*sa,dy=u*sa+v*ca;px(ctx,x+dx,y+dy,cell,cell,color)};
 for(let v=-depth;v<=depth;v+=cell)for(let u=-half;u<=half;u+=cell){
  const left=leftAt(v),right=rightAt(v);if(u<left||u>right)continue;
  const p=(u-left)/Math.max(1,right-left),q=(v+depth)/(depth*2);
  const broken=(p>.91&&q<.20)||(p<.075&&q>.75)||(variant&&p<.12&&q<.23);if(broken)continue;
  let ink=pal[2];if(q<.15)ink=pal[4];if(q>.82)ink=pal[1];
  if(((p-.56)/.36)**2+((q-.40)/.30)**2<1)ink=pal[3];
  if(((p-.30)/.25)**2+((q-.64)/.24)**2<1)ink=pal[1];
  if(((p-.56)/.18)**2+((q-.27)/.15)**2<1)ink=pal[4];
  if(p<.035||p>.965||q<.05||q>.95)ink=pal[0];
  const h=hash32(seed,Math.round(u/4),Math.round(v/4));
  if(h%31===0&&q>.18&&q<.78)ink=pal[Math.min(5,pal.indexOf(ink)+1)];
  at(u,v,ink);
 }
 // broad exposed fibre patch
 for(let v=-11*scale;v<5*scale;v+=2)for(let u=-18*scale;u<42*scale;u+=2){
  const nx=(u+18*scale)/(60*scale),ny=(v+11*scale)/(16*scale);
  if(nx<.05+ny*.12||nx>.96-ny*.08)continue;
  at(u,v,ny<.38?pal[5]:pal[4]);
 }
 // a few coarse cracks only
 const cracks=variant?[[-34,7,27,-.11],[8,-13,23,.18]]:[[-45,7,34,.10],[10,14,30,-.16],[35,-18,21,.20]];
 for(const [sx,sy,len,slope] of cracks)for(let i=0;i<len*scale;i+=3)at(sx*scale+i,sy*scale+i*slope,pal[0]);
}
