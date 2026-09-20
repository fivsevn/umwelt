import {paint,nearLine} from './grammar.mjs?v=forest-2';
import {hash32} from './pixel.mjs';
// Adapted from the layered cork in habitat.mjs at 6959a88.
// Broad ridges, broken fibres and a knot; detail is sampled on the shared 2px grid.
export function drawBark(ctx,{x=192,y=218,a=-.08,scale=1,variant=0,lift=0,seed=57}={}){
 const h=hash32(seed,'bark'),phase=(h%17)*.11;
 const half=variant===1?76:variant===2?84:94,depth=variant===1?26:42;
 const bounds=u=>{
  const cap=Math.sqrt(Math.max(0,1-(u/(half+2))**2));
  return [-depth*cap-4*Math.sin(u*.09+phase)-2*Math.sin(u*.23),depth*.83*cap+4*Math.sin(u*.14+1.7)];
 };
 const inside=(u,v)=>{const [top,bottom]=bounds(u);return Math.abs(u)<half&&v>=top&&v<=bottom&&!(u>half-14&&v< -8&&v> -17)};
 paint(ctx,{x,y:y+lift,a,scale,extent:half+8,inside,edge:'#352e25',shade:(u,v)=>{
  const [top,bottom]=bounds(u),ridge=v+3*Math.sin(u*.055+phase)+2*Math.sin(u*.17),band=((ridge%9)+9)%9;
  const knot=((u-18)/13)**2+((v+3)/8)**2;
  if(knot<1)return knot>.64?'#947348':knot>.26?'#403428':'#352e25';
  if(v>bottom-6)return '#403428';
  if(v<top+4)return '#a08452';
  if(variant===2&&u< -25&&v< -10){const moss=Math.sin(u*.18)+Math.cos(v*.26);if(moss>.35)return moss>1?'#798052':'#4c5b39'}
  for(const [ax,ay,bx,by] of [[-63,12,-26,9],[-20,-19,4,-12],[42,-15,67,-8]])if(nearLine(u,v,ax,ay,bx,by,1.8))return '#352e25';
  if(band<2)return '#403428';
  if(band>6)return '#a08452';
  const grain=hash32(seed,Math.floor(u/8),Math.floor(ridge/9));
  if(grain%7===0&&band>3)return '#947348';
  return Math.floor(ridge/9)%2===0?'#80613e':'#6d5035';
 }});
}
