import {paint,contains,nearLine,rounded} from './grammar.mjs';
const SHAPES=[
 [[-15,2],[-13,-7],[-4,-12],[7,-11],[15,-4],[17,5],[8,11],[-7,10]],
 [[-21,1],[-12,-8],[4,-10],[18,-5],[23,3],[13,8],[-10,8]],
 [[-12,-2],[-4,-12],[5,-9],[7,-2],[13,3],[6,10],[-8,8]],
 [[-8,1],[-4,-6],[4,-5],[9,1],[3,6],[-5,5]]
];
const CONTOURS=SHAPES.map(shape=>{const points=rounded(shape);return {points,minX:Math.min(...points.map(p=>p[0])),maxX:Math.max(...points.map(p=>p[0])),minY:Math.min(...points.map(p=>p[1])),maxY:Math.max(...points.map(p=>p[1]))}});
export function drawStone(ctx,{x=0,y=0,a=0,scale=1,variant=0,seed=0}={}){
 const contour=CONTOURS[variant%4];
 const inside=(u,v)=>{const x=u+Math.sin(v*.43+seed)*.55,y=v+Math.sin(u*.38+seed)*.65;return x>=contour.minX&&x<=contour.maxX&&y>=contour.minY&&y<=contour.maxY&&contains(contour.points,x,y)};
 paint(ctx,{x,y,seed,texture:'stone',a,scale,extent:26,inside,edge:'#626653',shade:(u,v)=>{
  if(seed%3===0&&nearLine(u,v,1,-8,5,2,1.1))return '#57584a';
  if(nearLine(u,v,-8,-3,3,4,1.3)&&variant===2)return '#42433b';
  if(v+Math.sin(u*.3)>5||u>12)return '#515844';
  if(v< -5+Math.cos(u*.2)*2&&u<7)return '#89866b';
  return '#6d725b';
 }});
}
