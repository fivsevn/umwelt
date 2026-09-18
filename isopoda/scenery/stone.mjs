import {px,hash32} from './pixel.mjs';

// Code-drawn placeholder stones for the habitat asset lab.
// Kept separate from scenery/index.mjs so the live game is not changed by this test pass.
export function drawStone(ctx,{x=0,y=0,scale=1,variant=0,seed=0}={}){
 const shapes=[
  {rx:12,ry:8,flat:.18},
  {rx:15,ry:6,flat:.34},
  {rx:9,ry:9,flat:.08}
 ];
 const s=shapes[variant%shapes.length],rx=s.rx*scale,ry=s.ry*scale,cell=1;
 const pal=['#3a3b35','#505046','#666657','#7a7967','#8d8b76'];
 for(let yy=-Math.ceil(ry);yy<=Math.ceil(ry);yy+=cell)for(let xx=-Math.ceil(rx);xx<=Math.ceil(rx);xx+=cell){
  const nx=xx/rx,ny=yy/ry;
  let d=nx*nx+ny*ny;
  if(variant===1&&ny<-.45)d+=Math.abs(ny+.45)*s.flat;
  if(d>1)continue;
  const h=hash32(seed,xx,yy,variant);
  const edge=d>.72;
  let tone=edge?0:ny<-.18?3:2;
  if(h%13===0)tone=Math.min(4,tone+1);
  if(h%19===0)tone=Math.max(0,tone-1);
  px(ctx,x+xx,y+yy,1,1,pal[tone]);
 }
 for(let i=-Math.floor(rx*.55);i<=Math.floor(rx*.45);i+=4){
  const h=hash32(seed,'vein',i);
  if(h%3===0)px(ctx,x+i,y-Math.max(1,Math.round(ry*.18)),2,1,'#96927c');
 }
}
