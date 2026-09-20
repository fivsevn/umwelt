import {paint,contains,nearLine} from './grammar.mjs?v=forest-3';
export function drawTwig(ctx,{x=0,y=0,a=0,length=18,seed=0}={}){
 if(length>100){
  const curve=u=>Math.sin(u*.025)*15;
  paint(ctx,{x,y,a,extent:length+8,shadow:false,edge:null,inside:(u,v)=>u>=0&&u<length&&(Math.abs(v-curve(u))<2.5||[40,100,170,250].some(k=>nearLine(u,v,k,curve(k),k+18,curve(k)+20,1.5))),shade:(u,v)=>v<curve(u)?'#78603e':'#2c2e24'});return;
 }
 paint(ctx,{x,y,a,extent:length+8,inside:(u,v)=>nearLine(u,v,0,0,length,-3,2)||nearLine(u,v,length*.5,-1,length*.75,-9,1.6),edge:null,shade:(u,v)=>v< -2?'#826743':'#4d352c'});
}
export function drawWoodChip(ctx,{x=0,y=0,a=0,variant=0,scale=1,seed=0}={}){
 const shape=variant===1?[[-23,2],[-9,-6],[18,-7],[13,-2],[25,0],[6,5],[-16,6]]:[[-17,1],[-11,-6],[4,-8],[18,-3],[9,1],[13,4],[-4,7]];
 paint(ctx,{x,y,a,scale,extent:28,inside:(u,v)=>contains(shape,u,v),edge:'#4a332b',shade:(u,v)=>Math.abs(v+u*.1)<1.8?'#a18451':v<0?'#82613e':'#594730'});
}
