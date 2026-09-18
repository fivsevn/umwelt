import {px,rot,hash32} from './pixel.mjs';

export function drawTwig(ctx,{x=0,y=0,a=0,length=18,seed=0}={}){
 for(let i=0;i<length;i++){
  const [dx,dy]=rot(i,0,a);px(ctx,x+dx,y+dy,1,1,i%5?'#5b432e':'#6d5034');
  if(i===Math.floor(length*.55))for(let j=1;j<6;j++){const [bx,by]=rot(i,j,a);px(ctx,x+bx,y+by,1,1,'#49372c')}
 }
}
export function drawWoodChip(ctx,{x=0,y=0,a=0,variant=0,scale=1,seed=0}={}){
 const length=[18,25,16][variant%3]*scale,width=[5,6,7][variant%3]*scale,ca=Math.cos(a),sa=Math.sin(a);
 for(let yy=-Math.ceil(width);yy<=Math.ceil(width);yy++)for(let xx=-Math.ceil(length);xx<=Math.ceil(length);xx++){
  const u=xx*ca+yy*sa,v=-xx*sa+yy*ca,t=u/length;if(Math.abs(t)>1)continue;
  const rim=width*(1-Math.abs(t)*.60)+(variant===1?Math.sin(u*.45)*1.1:0);if(Math.abs(v)>rim)continue;
  if(variant===2&&t>.1&&t<.35&&v>0)continue;
  const h=hash32(seed,xx,yy);let ink=Math.abs(v)<1?'#957047':v<0?'#705239':'#513d2e';
  if(Math.abs(t)>.86)ink='#352f28';if(h%29===0)ink='#a27a4d';
  px(ctx,x+xx,y+yy,1,1,ink);
 }
}
