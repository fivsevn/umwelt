import {px,hash32} from './pixel.mjs';

export function drawMossPatch(ctx,{x=0,y=0,rx=62,ry=42,seed=0,wetness=.65,alpha=.72}={}){
 const greens=[
  [46,69,53],[58,88,61],[75,109,72],[96,133,86],[121,155,101]
 ];
 const lobes=[
  [-.52,-.02,.46,.52],[-.16,-.22,.55,.68],[.22,-.18,.58,.66],[.55,.04,.42,.54],
  [-.34,.27,.52,.42],[.08,.30,.62,.43],[.50,.28,.46,.38]
 ];
 const cell=2;
 for(let yy=-ry;yy<=ry;yy+=cell)for(let xx=-rx;xx<=rx;xx+=cell){
  let d=9;
  for(const [lx,ly,lrx,lry] of lobes){
   const dx=(xx-rx*lx)/(rx*lrx),dy=(yy-ry*ly)/(ry*lry);
   d=Math.min(d,dx*dx+dy*dy);
  }
  if(d>1)continue;
  const h=hash32(seed,xx>>1,yy>>1),upper=yy<-.05*ry;
  let tone=upper?3:d<.32?2:1;if(h%9===0)tone=Math.min(4,tone+1);if(h%17===0)tone=Math.max(0,tone-1);
  const [r,g,b]=greens[tone],wet=.82+wetness*.18;
  px(ctx,x+xx,y+yy,cell,cell,`rgba(${Math.round(r*wet)},${Math.round(g*wet)},${Math.round(b*wet)},${alpha})`);
 }
 const crowns=[[-.56,-.48,10],[-.32,-.61,14],[-.05,-.68,16],[.24,-.61,13],[.50,-.45,11]];
 for(const [sx,sy,h] of crowns){
  const bx=x+rx*sx,by=y+ry*sy;
  for(let j=0;j<h;j+=2){
   px(ctx,bx,by-j,2,2,`rgba(112,151,96,${alpha})`);
   if(j>4&&j%4===0){px(ctx,bx-3,by-j+1,3,2,`rgba(91,132,85,${alpha})`);px(ctx,bx+2,by-j,3,2,`rgba(124,163,104,${alpha})`)}
  }
 }
}
