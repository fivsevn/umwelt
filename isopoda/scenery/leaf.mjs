import {px,rot,hash32} from './pixel.mjs';

export const LEAF_PALETTES=[
 ['#4b3d2d','#6d4e32','#8b633b','#aa7f4d','#352d27'],
 ['#514632','#6b5a3c','#86764a','#a18d59','#373129'],
 ['#5b4130','#795238','#986843','#b67d50','#3c2f27'],
 ['#51483a','#6e6045','#88784f','#9e8a5d','#38332c']
];

function widthAt(variant,t,width){
 const q=Math.max(0,1-Math.abs(t));
 if(variant===1)return width*Math.pow(q,.72)*.72;
 if(variant===2)return width*Math.pow(q,.56)*(.90+.09*Math.sin((t+.06)*Math.PI*3));
 if(variant===3)return width*Math.pow(q,.52)*(t<-.22?.78:1);
 if(variant===4)return width*Math.pow(q,.61)*(.92+.07*Math.cos(t*Math.PI*2));
 if(variant===5)return width*Math.pow(q,.64)*(.82+.10*Math.cos((t+.1)*Math.PI*2.3));
 return width*Math.pow(q,.58);
}

export function drawLeaf(ctx,{x=0,y=0,a=0,variant=0,scale=.9,tone=0,gap=false,age=0,seed=0}={}){
 const p=LEAF_PALETTES[tone%LEAF_PALETTES.length],cell=2,ca=Math.cos(a),sa=Math.sin(a);
 const fade=Math.max(.78,1-Math.min(20,age)*.008);
 const length=[39,44,42,40,43,41][variant%6]*scale,width=[21,17,24,23,21,20][variant%6]*scale;
 const inside=(u,v)=>{
  if(Math.abs(u)>length)return false;
  const t=u/length,rim=widthAt(variant,t,width);if(Math.abs(v)>rim)return false;
  const edge=rim-Math.abs(v),side=Math.sign(v)||1;
  if(variant===0&&t>.40&&t<.58&&side<0&&edge<3)return false;
  if(variant===2&&t>.12&&t<.34&&side>0&&edge<3)return false;
  if(variant===3&&t>.52&&side<0&&edge<3.5)return false;
  if(variant===4&&t<-.36&&side>0&&edge<3)return false;
  return true;
 };
 const radius=Math.ceil(Math.hypot(length,width)+9);
 const sx=gap?4:2,sy=gap?5:3;
 for(let yy=-radius;yy<=radius;yy+=cell)for(let xx=-radius;xx<=radius;xx+=cell){
  const dx=xx-sx,dy=yy-sy,u=dx*ca+dy*sa,v=-dx*sa+dy*ca;
  if(inside(u,v))px(ctx,x+xx,y+yy,cell,cell,'rgba(28,25,22,.34)');
 }
 for(let yy=-radius;yy<=radius;yy+=cell)for(let xx=-radius;xx<=radius;xx+=cell){
  const u=xx*ca+yy*sa,v=-xx*sa+yy*ca;if(!inside(u,v))continue;
  const t=u/length,rim=widthAt(variant,t,width),edge=rim-Math.abs(v);
  let ink=p[1];if(edge<2.4)ink=p[0];else if(v<0)ink=p[2];if(t<-.12&&v<-.2*rim)ink=p[3];
  if(fade<1){
   // age by darkening only, never by puncturing the fill
   const m=fade,hex=ink.slice(1),r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
   ink=`rgb(${Math.round(r*m)},${Math.round(g*m)},${Math.round(b*m)})`;
  }
  px(ctx,x+xx,y+yy,cell,cell,ink);
 }
 for(let u=-length*.74;u<length*.72;u+=4){
  const [dx,dy]=rot(u,0,a);px(ctx,x+dx,y+dy,2,2,p[3]);
 }
 const h=hash32(seed,x,y,variant);
 for(const side of [-1,1]){
  const u=(-.10+(h%7)*.012)*length,r=widthAt(variant,u/length,width)*.62;
  for(let q=.38;q<.9;q+=.34){const [dx,dy]=rot(u+q*length*.12,side*r*q,a);px(ctx,x+dx,y+dy,2,2,p[2])}
 }
 for(let i=0;i<7*scale;i+=2){const [dx,dy]=rot(-length-i,0,a);px(ctx,x+dx,y+dy,2,2,p[4])}
}
