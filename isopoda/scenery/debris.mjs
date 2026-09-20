import {paint,contains,nearLine,rounded} from './grammar.mjs?v=forest-8';
import {hash32} from './pixel.mjs';
export function drawTwig(ctx,{x=0,y=0,a=0,length=18,seed=0}={}){
 if(length>100){
  const curve=u=>Math.sin(u*.025)*15;
  paint(ctx,{x,y,seed,texture:'wood',a,extent:length+8,shadow:false,edge:null,inside:(u,v)=>u>=0&&u<length&&(Math.abs(v-curve(u))<2.5||[40,100,170,250].some(k=>nearLine(u,v,k,curve(k),k+18,curve(k)+20,1.5))),shade:(u,v)=>v<curve(u)?'#78603e':'#2c2e24'});return;
 }
 const curve=u=>-u*.12+Math.sin(u*.18+seed)*.8;
 paint(ctx,{x,y,seed,texture:'wood',a,extent:length+8,inside:(u,v)=>u>=0&&u<length&&Math.abs(v-curve(u))<1.65-u/length*.8||nearLine(u,v,length*.48,curve(length*.48),length*.79,-9,.7),edge:null,shade:(u,v)=>hash32(seed,Math.floor(u/3))%7===0?'#68533e':v<curve(u)-.4?'#8b7350':'#574332'});
}
export function drawWoodChip(ctx,{x=0,y=0,a=0,variant=0,scale=1,seed=0}={}){
 const shape=variant===1?[[-23,2],[-9,-6],[18,-7],[13,-2],[25,0],[6,5],[-16,6]]:[[-17,1],[-11,-6],[4,-8],[18,-3],[9,1],[13,4],[-4,7]];
 const roundedShape=rounded(shape);
 paint(ctx,{x,y,seed,texture:'wood',a,scale,extent:28,inside:(u,v)=>contains(roundedShape,u+Math.sin(v*.43+seed)*.55,v+Math.sin(u*.38+seed)*.65),edge:'#684b36',shade:(u,v)=>Math.sin(v*1.4+Math.sin(u*.21))+Math.sin(u*.39+seed)*.5>.7?'#927953':v<Math.sin(u*.2)?'#806747':'#65523b'});
}
