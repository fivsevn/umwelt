import {px,rot,hash32} from './pixel.mjs';

export function drawCuttlebone(ctx,{x=330,y=170,a=-.42,scale=.72,seed=3}={}){
 const rx=25*scale,ry=10*scale,ca=Math.cos(a),sa=Math.sin(a);
 for(let yy=-Math.ceil(ry);yy<=Math.ceil(ry);yy++)for(let xx=-Math.ceil(rx);xx<=Math.ceil(rx);xx++){
  const d=(xx/rx)**2+(yy/ry)**2;if(d>1)continue;if(xx>rx*.58&&yy<-ry*.22)continue;
  const h=hash32(seed,xx,yy),edge=d>.72;let ink=edge?'#aaa795':h%9<2?'#d1cdb7':'#bebaa4';
  if(h%17===0)ink='#8b8a79';
  const [dx,dy]=rot(xx,yy,a);px(ctx,x+dx,y+dy,1,1,ink);
 }
 for(let i=-13;i<=13;i+=5){const [dx,dy]=rot(i*scale,1*scale,a);px(ctx,x+dx,y+dy,1,1,'#888878')}
}
