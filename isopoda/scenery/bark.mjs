import {paint,nearLine} from './grammar.mjs?v=forest-10';
import {hash32} from './pixel.mjs';
// Curved, interrupted fibres sampled on the anatomy-sized world grid.
export function drawBark(ctx,{x=192,y=218,a=-.08,scale=1,variant=0,lift=0,seed=57}={}){
 const h=hash32(seed,'bark'),phase=(h%17)*.11;
 const half=variant===1?76:variant===2?84:94,depth=variant===1?26:42;
 const bounds=u=>{
  const cap=Math.sqrt(Math.max(0,1-(u/(half+2))**2));
  return [-depth*cap-4*Math.sin(u*.09+phase)-2*Math.sin(u*.23)+.8*Math.sin(u*.73+phase),depth*.83*cap+4*Math.sin(u*.14+1.7)+Math.sin(u*.61+phase)];
 };
 const inside=(u,v)=>{const [top,bottom]=bounds(u);return Math.abs(u)<half&&v>=top&&v<=bottom&&!(u>half-14&&v< -8&&v> -17)};
 paint(ctx,{x,y:y+lift,seed,texture:'wood',a,scale,extent:half+8,inside,edge:'#68533d',shade:(u,v)=>{
  const [top,bottom]=bounds(u);
  const ridge=v+3*Math.sin(u*.055+phase)+1.3*Math.sin(u*.19+v*.06);
  const knot=Math.sqrt(((u-18)/13)**2+((v+3)/8)**2);
  if(knot<1.1)return knot>.88?'#8e7350':knot>.65?'#735b40':knot>.35?'#63503a':'#534532';
  if(v>bottom-2.5)return '#534532';
  if(v<top+1.5)return '#9b815b';
  if(variant===2&&u< -25&&v< -10){const moss=Math.sin(u*.18)+Math.cos(v*.26);if(moss>.35)return moss>1?'#798052':'#4c5b39'}
  const wave=Math.sin(ridge*1.15+Math.sin(u*.11))* .65+Math.sin(ridge*.47+Math.sin(u*.043))* .35;
  const grain=hash32(seed,Math.floor(u/3),Math.floor(ridge/2));
  if(wave<-.76&&Math.sin(u*.16+ridge*.2)>.05)return '#534532';
  if(wave>.73&&grain%4!==0)return '#9b815b';
  if(wave>.28)return '#8e7350';
  if(wave<-.3)return '#63503a';
  return grain%5===0?'#806747':'#735b40';
 }});
}
