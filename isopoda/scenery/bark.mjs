import {paint,contains,nearLine} from './grammar.mjs';
import {hash32} from './pixel.mjs';
const OUTLINE=[[-82,12],[-76,-9],[-66,-14],[-70,-27],[-44,-24],[-27,-34],[1,-29],[26,-36],[45,-27],[74,-29],[65,-14],[82,-18],[77,0],[63,6],[74,16],[47,22],[28,18],[13,31],[-15,26],[-30,32],[-51,23],[-75,27]];
export function drawBark(ctx,{x=192,y=218,a=-.08,scale=1,variant=0,lift=0,seed=57}={}){
 const h=hash32(seed,'bark'),sx=variant===1?.8:variant===2?.68:1,sy=variant===1?.58:variant===2?.92:1;
 const shape=OUTLINE.map(([u,v])=>[u*sx,v*sy]);
 paint(ctx,{x,y:y+lift,a,scale,extent:90,inside:(u,v)=>contains(shape,u,v),edge:'#342a2b',shade:(xx,yy)=>{
  const u=xx/sx,v=yy/sy;
  if(variant===0&&contains([[-68,12],[-50,4],[28,6],[52,13],[29,22],[-30,26]],u,v))return '#342a2b';
  if(contains([[-68,-15],[-38,-23],[-8,-21],[-22,-12],[6,-14],[37,-23],[61,-21],[43,-12],[8,-4],[-36,-3]],u,v))return '#b18453';
  if(contains([[-63,-9],[-29,-15],[-40,-6],[-6,-9],[-18,-1],[-49,4]],u,v))return '#d0a16a';
  for(const [ax,ay,bx,by] of [[-64,10,-10,-2],[-5,15,51,2],[-18,-18,18,-24],[36,-7,66,-15]])if(nearLine(u,v,ax,ay,bx,by,2))return '#342a2b';
  if((variant===2||h%3===0)&&contains([[-9,-25],[4,-29],[16,-23],[26,-22],[22,-12],[10,-8],[4,-13],[-9,-10]],u,v))return v< -19?'#8d9c57':'#536b3e';
  return v>8?'#795035':v< -8?'#94643f':'#795035';
 }});
}
