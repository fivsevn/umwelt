import {paint,contains} from './grammar.mjs?v=forest-5';
export function drawCuttlebone(ctx,{x=330,y=170,a=-.42,scale=.72,seed=3,variant=0}={}){
 const shape=variant? [[-23,0],[-15,-7],[3,-10],[16,-7],[11,-2],[22,1],[15,5],[18,8],[-4,10],[-18,5]]:[[-26,0],[-16,-7],[2,-11],[19,-8],[27,-2],[21,5],[7,10],[-13,7]];
 paint(ctx,{x,y,a,scale,extent:31,inside:(u,v)=>contains(shape,u,v),edge:'#9f9675',shade:(u,v)=>{
  if(u> -15&&u<18&&Math.abs(((u+v*.6+40)%8)-4)<1.2&&Math.abs(v)>2)return '#a49d7e';
  if(v>4)return '#b7a681';
  if(Math.abs(v+u*.09)<2)return '#d8cfaa';
  if(u> -15&&u<18&&v<0)return '#bfb692';
  return '#a49d7e';
 }});
}
