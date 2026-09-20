import {paint,contains,nearLine,rounded} from './grammar.mjs?v=forest-8';
const SHAPES=[
 [[-15,2],[-13,-7],[-4,-12],[7,-11],[15,-4],[17,5],[8,11],[-7,10]],
 [[-21,1],[-12,-8],[4,-10],[18,-5],[23,3],[13,8],[-10,8]],
 [[-12,-2],[-4,-12],[5,-9],[7,-2],[13,3],[6,10],[-8,8]],
 [[-8,1],[-4,-6],[4,-5],[9,1],[3,6],[-5,5]]
];
export function drawStone(ctx,{x=0,y=0,a=0,scale=1,variant=0,seed=0}={}){
 const shape=SHAPES[variant%4],roundedShape=rounded(shape);
 paint(ctx,{x,y,seed,texture:'stone',a,scale,extent:26,inside:(u,v)=>contains(roundedShape,u+Math.sin(v*.43+seed)*.55,v+Math.sin(u*.38+seed)*.65),edge:'#626653',shade:(u,v)=>{
  if(seed%3===0&&nearLine(u,v,1,-8,5,2,1.1))return '#57584a';
  if(nearLine(u,v,-8,-3,3,4,1.3)&&variant===2)return '#42433b';
  if(v+Math.sin(u*.3)>5||u>12)return '#515844';
  if(v< -5+Math.cos(u*.2)*2&&u<7)return '#89866b';
  return '#6d725b';
 }});
}
