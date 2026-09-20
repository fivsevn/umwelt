import {paint,contains,nearLine} from './grammar.mjs';
export function drawTwig(ctx,{x=0,y=0,a=0,length=18,seed=0}={}){
 paint(ctx,{x,y,a,extent:length+8,inside:(u,v)=>nearLine(u,v,0,0,length,-3,2)||nearLine(u,v,length*.5,-1,length*.75,-9,1.6),edge:null,shade:(u,v)=>v< -2?'#a47a4a':'#4d352c'});
}
export function drawWoodChip(ctx,{x=0,y=0,a=0,variant=0,scale=1,seed=0}={}){
 const shape=variant===1?[[-23,2],[-9,-6],[18,-7],[13,-2],[25,0],[6,5],[-16,6]]:[[-17,1],[-11,-6],[4,-8],[18,-3],[9,1],[13,4],[-4,7]];
 paint(ctx,{x,y,a,scale,extent:28,inside:(u,v)=>contains(shape,u,v),edge:'#4a332b',shade:(u,v)=>Math.abs(v+u*.1)<1.8?'#c1975f':v<0?'#9b7044':'#745034'});
}
