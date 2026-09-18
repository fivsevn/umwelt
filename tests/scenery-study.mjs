import {px,rot,hash32,WORLD_W,WORLD_H} from '../isopoda/scenery/pixel.mjs';

// Local-only visual study for the habitat asset lab.
// Visual target: compact Japanese 16-bit / GBA-era environment sprites.
// Strong dark silhouettes, stepped colour blocks, directional highlights and
// deliberately sparse texture. The public game does not import this module.

const SOIL={
 dry:['#594837','#66513b','#705b42','#4a3c30','#7b6447'],
 mid:['#514738','#5b4e3b','#665843','#433b31','#706149'],
 wet:['#3f4338','#47493b','#505143','#363b33','#5a5a48'],
 dark:'#332b26',
 light:'#8f744d',
 green:'#5e6c43'
};
const LEAVES=[
 ['#342125','#6b3d2c','#915a37','#bd7d43','#e0a557'],
 ['#35291f','#65523a','#8b7147','#b49357','#d1b36b'],
 ['#3b211e','#7a3825','#a64f2b','#d26f33','#ed9b46'],
 ['#2e2922','#5d5137','#7c7047','#9b8d55','#b6a565']
];
const MOSS=['#24332a','#334a34','#4b683c','#6f8e46','#9db655'];
const BARK=['#2a1d23','#49302c','#654039','#855641','#a9704d','#c99361'];
const STONE=['#2d3034','#43484d','#596168','#747d80','#9ca4a0'];
const BONE=['#555146','#817d6b','#aca68e','#d0c8aa','#eadfbd'];

function wetAt(x,y,wetZones=[]){
 let wet=0;
 for(const z of wetZones){
  const rx=Math.max(1,z.rx||1),ry=Math.max(1,z.ry||1);
  const d=((x-z.x)/rx)**2+((y-z.y)/ry)**2;
  if(d<1.22)wet=Math.max(wet,Math.max(0,1-d/1.22)*(Number(z.moisture)||0)/100);
 }
 return wet;
}
function shade(hex,m){
 const h=hex.replace('#','');
 const r=Math.max(0,Math.min(255,Math.round(parseInt(h.slice(0,2),16)*m)));
 const g=Math.max(0,Math.min(255,Math.round(parseInt(h.slice(2,4),16)*m)));
 const b=Math.max(0,Math.min(255,Math.round(parseInt(h.slice(4,6),16)*m)));
 return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function putRot(ctx,x,y,a,u,v,w,h,color){
 const [dx,dy]=rot(u,v,a);px(ctx,x+dx,y+dy,w,h,color);
}

export function drawStudySubstrate(ctx,{wetZones=[],light=100,seed=57}={}){
 px(ctx,0,0,WORLD_W,WORLD_H,SOIL.dry[0]);

 // Broad four-pixel tiles form the ground plane; texture stays subordinate to props.
 for(let y=0;y<WORLD_H;y+=4)for(let x=0;x<WORLD_W;x+=4){
  const wet=wetAt(x+2,y+2,wetZones),h=hash32(seed,x>>2,y>>2);
  const pal=wet>.50?SOIL.wet:wet>.16?SOIL.mid:SOIL.dry;
  let ink=pal[h%pal.length];
  if(h%23===0)ink=wet>.28?SOIL.green:SOIL.light;
  if(h%31===0)ink=SOIL.dark;
  px(ctx,x,y,4,4,ink);
 }

 // Sparse two-step chips make the floor feel authored rather than noisy.
 for(let i=0;i<22;i++){
  const h=hash32(seed,'soil-chip',i),x=10+h%364,y=10+((h>>>9)%410);
  const w=[4,5,6][h%3],ink=[SOIL.dark,'#4a372a','#8a6c48'][h%3];
  px(ctx,x,y,w,2,ink);
  if(h%4===0)px(ctx,x+1,y-1,Math.max(2,w-2),1,shade(ink,1.18));
 }
 for(let i=0;i<13;i++){
  const h=hash32(seed,'soil-pebble',i),x=12+h%358,y=12+((h>>>11)%402);
  px(ctx,x,y,3,3,h%2?'#665443':'#453a31');
  px(ctx,x,y,2,1,h%2?'#8a7354':'#66594a');
 }
 if(light<55){
  ctx.fillStyle=`rgba(18,27,22,${(55-light)/120})`;
  ctx.fillRect(0,0,WORLD_W,WORLD_H);
 }
}

function leafShape(variant,t,width){
 const q=Math.max(0,1-Math.abs(t));
 if(variant===1)return width*Math.pow(q,.82)*.62;
 if(variant===2)return width*Math.pow(q,.54)*(1+.10*Math.sin((t+.08)*Math.PI*3));
 if(variant===3)return width*Math.pow(q,.62)*(t<-.20?.74:1);
 if(variant===4){
  // fan leaf: narrow at the stem, broad toward the tip
  const k=Math.max(0,Math.min(1,(t+1)/1.65));
  return width*Math.sin(k*Math.PI*.88)*(.88+.10*Math.cos(t*Math.PI*3));
 }
 if(variant===5)return width*Math.pow(q,.72)*(.78+.12*Math.cos((t+.08)*Math.PI*2));
 return width*Math.pow(q,.60);
}

export function drawStudyLeaf(ctx,{x=0,y=0,a=0,variant=0,scale=.9,tone=0,gap=false,age=0,seed=0}={}){
 const p=LEAVES[tone%LEAVES.length],cell=2;
 const length=[38,44,41,39,38,40][variant%6]*scale;
 const width=[20,15,23,22,25,19][variant%6]*scale;
 const ca=Math.cos(a),sa=Math.sin(a);
 const inside=(u,v)=>{
  if(Math.abs(u)>length)return false;
  const t=u/length,rim=leafShape(variant,t,width);
  if(Math.abs(v)>rim)return false;
  const edge=rim-Math.abs(v),side=Math.sign(v)||1;
  if(variant===0&&t>.40&&t<.61&&side<0&&edge<4)return false;
  if(variant===2&&t>.12&&t<.36&&side>0&&edge<4)return false;
  if(variant===3&&t>.48&&side<0&&edge<5)return false;
  if(variant===3&&t<-.10&&t>.34&&side>0&&edge<3)return false;
  if(variant===4&&Math.abs(t-.55)<.11&&Math.abs(v)<width*.25)return false;
  return true;
 };
 const radius=Math.ceil(Math.hypot(length,width)+10),shadowX=gap?6:4,shadowY=gap?7:5;

 // Drop shadow, intentionally blocky.
 for(let yy=-radius;yy<=radius;yy+=cell)for(let xx=-radius;xx<=radius;xx+=cell){
  const dx=xx-shadowX,dy=yy-shadowY,u=dx*ca+dy*sa,v=-dx*sa+dy*ca;
  if(inside(u,v))px(ctx,x+xx,y+yy,cell,cell,'rgba(37,28,27,.52)');
 }

 // Sprite body with a real one-cell dark contour.
 for(let yy=-radius;yy<=radius;yy+=cell)for(let xx=-radius;xx<=radius;xx+=cell){
  const u=xx*ca+yy*sa,v=-xx*sa+yy*ca;if(!inside(u,v))continue;
  const border=!inside(u+cell,v)||!inside(u-cell,v)||!inside(u,v+cell)||!inside(u,v-cell);
  const t=u/length,rim=Math.max(1,leafShape(variant,t,width));
  let ink=p[2];
  if(border)ink=p[0];
  else if(v<-.18*rim)ink=p[3];
  else if(v>.46*rim)ink=p[1];
  if(age>0)ink=shade(ink,Math.max(.80,1-Math.min(18,age)*.008));
  px(ctx,x+xx,y+yy,cell,cell,ink);
 }

 // Large highlight islands: fixed areas, not surface noise.
 const patches=[
  [-.34,-.34,.18,.22],[-.02,-.48,.17,.20],[.30,-.30,.16,.22]
 ];
 for(const [tu,tv,ru,rv] of patches){
  for(let yy=-width;yy<=width;yy+=cell)for(let xx=-length;xx<=length;xx+=cell){
   const u=xx,v=yy,t=u/length;if(!inside(u,v))continue;
   if(((t-tu)/ru)**2+((v/width-tv)/rv)**2>1)continue;
   putRot(ctx,x,y,a,u,v,cell,cell,p[3]);
  }
 }

 // Midrib and short angular veins like a hand-drawn sprite.
 for(let u=-length*.78;u<length*.72;u+=4)putRot(ctx,x,y,a,u,0,2,2,p[4]);
 for(const side of [-1,1])for(const q of [-.48,-.18,.14,.42]){
  const start=q*length;
  for(let i=2;i<9;i+=2)putRot(ctx,x,y,a,start+i*.9,side*i*.62,2,2,p[3]);
 }

 // Stem.
 for(let i=0;i<Math.max(7,10*scale);i+=2)putRot(ctx,x,y,a,-length-i,0,2,2,p[0]);
}

function mossInside(rx,ry,xx,yy){
 const lobes=[
  [-.70,.06,.28,.44],[-.48,-.18,.38,.58],[-.18,-.30,.42,.70],[.12,-.36,.40,.72],
  [.40,-.23,.38,.62],[.68,.02,.26,.44],[-.48,.30,.40,.42],[-.12,.34,.50,.46],
  [.28,.31,.46,.42],[.56,.26,.33,.34]
 ];
 let d=99;
 for(const [lx,ly,lrx,lry] of lobes){
  const dx=(xx-rx*lx)/(rx*lrx),dy=(yy-ry*ly)/(ry*lry);
  d=Math.min(d,dx*dx+dy*dy);
 }
 return d<=1;
}

export function drawStudyMoss(ctx,{x=0,y=0,rx=62,ry=42,seed=0,wetness=.65,alpha=.72}={}){
 const cell=3;

 // Shadow mass.
 for(let yy=-ry;yy<=ry;yy+=cell)for(let xx=-rx;xx<=rx;xx+=cell){
  if(mossInside(rx,ry,xx-4,yy-5))px(ctx,x+xx,y+yy,cell,cell,'rgba(26,34,29,.58)');
 }

 // One coherent bush-like silhouette with a dark green underside.
 for(let yy=-ry;yy<=ry;yy+=cell)for(let xx=-rx;xx<=rx;xx+=cell){
  if(!mossInside(rx,ry,xx,yy))continue;
  const border=!mossInside(rx,ry,xx+cell,yy)||!mossInside(rx,ry,xx-cell,yy)||!mossInside(rx,ry,xx,yy+cell)||!mossInside(rx,ry,xx,yy-cell);
  const h=hash32(seed,Math.floor(xx/6),Math.floor(yy/6));
  let tone=yy<-ry*.12?3:2;
  if(yy>ry*.36)tone=1;
  if(h%7===0)tone=Math.min(4,tone+1);
  if(h%11===0)tone=Math.max(1,tone-1);
  if(border)tone=0;
  const wet=wetness>.72&&tone>1?1:0;
  const ink=MOSS[Math.min(4,tone+wet)];
  px(ctx,x+xx,y+yy,cell,cell,ink);
 }

 // Large lime highlight clusters on upper-facing masses.
 const crowns=[
  [-.50,-.28,9],[-.22,-.48,11],[.08,-.50,10],[.37,-.36,9],[.57,-.14,7],
  [-.08,-.10,8],[.25,-.08,7]
 ];
 for(let i=0;i<crowns.length;i++){
  const [sx,sy,r]=crowns[i],h=hash32(seed,'moss-crown',i);
  const cx=x+rx*sx,cy=y+ry*sy,ink=h%3===0?MOSS[4]:MOSS[3];
  px(ctx,cx-r*.35,cy-r*.20,r*.68,r*.36,ink);
  px(ctx,cx-r*.12,cy-r*.48,r*.34,r*.42,ink);
  if(h%2===0)px(ctx,cx+r*.20,cy-r*.22,r*.28,r*.30,MOSS[4]);
 }

 // Deep base line makes the patch read as one game sprite.
 for(let xx=-rx*.78;xx<=rx*.72;xx+=6){
  const h=hash32(seed,'moss-base',xx);
  px(ctx,x+xx,y+ry*.48+(h%3),6,3,MOSS[0]);
 }
}

function barkInside(half,depth,variant,u,v){
 if(v<-depth||v>depth)return false;
 const q=(v+depth)/(depth*2);
 const left=-half+(variant?10:6)+(q*7);
 const right=half-(variant?7:5)-((1-q)*7);
 if(u<left||u>right)return false;
 // stepped broken ends
 if(u<left+10&&v<-depth*.55)return false;
 if(u>right-13&&v>depth*.42)return false;
 if(variant&&u>right-20&&v<-depth*.50)return false;
 return true;
}

export function drawStudyBark(ctx,{x=192,y=218,a=-.08,scale=1,variant=0,lift=0,seed=57}={}){
 y+=lift;
 const half=(variant?62:80)*scale,depth=(variant?25:33)*scale,cell=2;

 // Strong offset shadow.
 const radius=Math.ceil(Math.hypot(half,depth)+12);
 for(let yy=-radius;yy<=radius;yy+=cell)for(let xx=-radius;xx<=radius;xx+=cell){
  const [u,v]=rot(xx-5,yy-6,-a);
  if(barkInside(half,depth,variant,u,v))px(ctx,x+xx,y+yy,cell,cell,'rgba(31,24,27,.62)');
 }

 // Main slab: purple-brown contour, warm top plane, darker lower edge.
 for(let v=-depth;v<=depth;v+=cell)for(let u=-half;u<=half;u+=cell){
  if(!barkInside(half,depth,variant,u,v))continue;
  const border=!barkInside(half,depth,variant,u+cell,v)||!barkInside(half,depth,variant,u-cell,v)||!barkInside(half,depth,variant,u,v+cell)||!barkInside(half,depth,variant,u,v-cell);
  let ink=BARK[2];
  if(border)ink=BARK[0];
  else if(v<-depth*.42)ink=BARK[4];
  else if(v<depth*.10)ink=BARK[3];
  else if(v>depth*.68)ink=BARK[1];
  putRot(ctx,x,y,a,u,v,cell,cell,ink);
 }

 // Broad top highlights, arranged as deliberate bark planes.
 const planes=variant
  ?[[-38,-9,26,7],[-7,-15,30,8],[24,-8,22,7]]
  :[[-50,-10,31,8],[-15,-16,36,9],[25,-11,30,8]];
 for(const [u,v,w,h] of planes){
  for(let yy=0;yy<h*scale;yy+=2)for(let xx=0;xx<w*scale;xx+=2){
   const uu=u*scale+xx,vv=v*scale+yy;
   if(barkInside(half,depth,variant,uu,vv))putRot(ctx,x,y,a,uu,vv,2,2,yy<3?BARK[5]:BARK[4]);
  }
 }

 // Dark stepped cracks and longitudinal grain.
 const cracks=variant
  ?[[-43,8,26,-.18],[-8,13,25,-.10],[20,-1,27,.20]]
  :[[-56,10,35,-.12],[-18,14,31,-.09],[19,4,33,.16],[43,-15,20,.28]];
 for(const [sx,sy,len,slope] of cracks){
  for(let i=0;i<len*scale;i+=4){
   const u=sx*scale+i,v=sy*scale+i*slope;
   if(barkInside(half,depth,variant,u,v))putRot(ctx,x,y,a,u,v,4,2,BARK[0]);
  }
 }

 // Moss on the broken fragment; a smaller patch on the shelter keeps materials coherent.
 const mossPatches=variant
  ?[[-16,-3,18,10],[12,5,15,9]]
  :[[24,6,12,7]];
 for(let pIndex=0;pIndex<mossPatches.length;pIndex++){
  const [mu,mv,mw,mh]=mossPatches[pIndex];
  for(let yy=-mh;yy<=mh;yy+=3)for(let xx=-mw;xx<=mw;xx+=3){
   if((xx/mw)**2+(yy/mh)**2>1)continue;
   const u=mu*scale+xx*scale,v=mv*scale+yy*scale;
   if(!barkInside(half,depth,variant,u,v))continue;
   const h=hash32(seed,'bark-moss',pIndex,xx,yy);
   const ink=h%5===0?MOSS[4]:h%2?MOSS[2]:MOSS[3];
   putRot(ctx,x,y,a,u,v,3,3,ink);
  }
 }
}

export function drawStudyStone(ctx,{x=0,y=0,a=0,scale=1,variant=0,seed=0}={}){
 const shapes=[{rx:13,ry:9},{rx:16,ry:7},{rx:10,ry:10}],s=shapes[variant%3];
 const rx=s.rx*scale,ry=s.ry*scale;

 for(let yy=-Math.ceil(ry)-3;yy<=Math.ceil(ry)+3;yy++)for(let xx=-Math.ceil(rx)-3;xx<=Math.ceil(rx)+3;xx++){
  if(((xx-2)/rx)**2+((yy-3)/ry)**2<=1)putRot(ctx,x,y,a,xx,yy,1,1,'#272a2d');
 }
 for(let yy=-Math.ceil(ry);yy<=Math.ceil(ry);yy++)for(let xx=-Math.ceil(rx);xx<=Math.ceil(rx);xx++){
  const d=(xx/rx)**2+(yy/ry)**2;if(d>1)continue;
  const border=d>.74;
  let tone=border?0:yy<-.12*ry?3:2;
  if(hash32(seed,Math.floor(xx/4),Math.floor(yy/4),variant)%11===0)tone=Math.min(4,tone+1);
  putRot(ctx,x,y,a,xx,yy,1,1,STONE[tone]);
 }
 // One flat highlight plane.
 for(let i=0;i<Math.max(4,Math.round(rx*.72));i+=2)putRot(ctx,x,y,a,-rx*.45+i,-ry*.32,2,2,STONE[4]);
}

export function drawStudyCuttlebone(ctx,{x=330,y=170,a=-.42,scale=.72,seed=3}={}){
 const rx=25*scale,ry=10*scale;
 for(let yy=-Math.ceil(ry)-3;yy<=Math.ceil(ry)+3;yy++)for(let xx=-Math.ceil(rx)-3;xx<=Math.ceil(rx)+3;xx++){
  if(((xx-2)/rx)**2+((yy-3)/ry)**2<=1)putRot(ctx,x,y,a,xx,yy,1,1,'#49453c');
 }
 for(let yy=-Math.ceil(ry);yy<=Math.ceil(ry);yy++)for(let xx=-Math.ceil(rx);xx<=Math.ceil(rx);xx++){
  const d=(xx/rx)**2+(yy/ry)**2;if(d>1)continue;
  if(xx>rx*.58&&yy<-ry*.22)continue;
  let tone=d>.76?1:yy<-.10*ry?4:3;
  if(hash32(seed,Math.floor(xx/5),Math.floor(yy/4))%9===0)tone=2;
  putRot(ctx,x,y,a,xx,yy,1,1,BONE[tone]);
 }
 for(let i=-13;i<=13;i+=5)putRot(ctx,x,y,a,i*scale,1*scale,2,1,BONE[1]);
}

export function drawStudyTwig(ctx,{x=0,y=0,a=0,length=18,seed=0}={}){
 for(let i=0;i<length;i+=2)putRot(ctx,x,y,a,i+2,3,2,2,'#2f2523');
 for(let i=0;i<length;i+=2){
  putRot(ctx,x,y,a,i,0,2,2,i%6?BARK[2]:BARK[4]);
  if(i===Math.floor(length*.55/2)*2)for(let j=2;j<8;j+=2)putRot(ctx,x,y,a,i,j,2,2,BARK[1]);
 }
}

export function drawStudyWoodChip(ctx,{x=0,y=0,a=0,variant=0,scale=1,seed=0}={}){
 const length=[18,25,16][variant%3]*scale,width=[5,6,7][variant%3]*scale,ca=Math.cos(a),sa=Math.sin(a);
 const inside=(u,v)=>{
  const t=u/length;if(Math.abs(t)>1)return false;
  const rim=width*(1-Math.abs(t)*.58)+(variant===1?Math.sin(u*.42)*.8:0);
  if(Math.abs(v)>rim)return false;
  if(variant===2&&t>.08&&t<.34&&v>0)return false;
  return true;
 };
 for(let yy=-Math.ceil(width)-4;yy<=Math.ceil(width)+4;yy++)for(let xx=-Math.ceil(length)-4;xx<=Math.ceil(length)+4;xx++){
  const u=(xx-2)*ca+(yy-3)*sa,v=-(xx-2)*sa+(yy-3)*ca;
  if(inside(u,v))px(ctx,x+xx,y+yy,1,1,'#302522');
 }
 for(let yy=-Math.ceil(width);yy<=Math.ceil(width);yy++)for(let xx=-Math.ceil(length);xx<=Math.ceil(length);xx++){
  const u=xx*ca+yy*sa,v=-xx*sa+yy*ca;if(!inside(u,v))continue;
  const border=!inside(u+1,v)||!inside(u-1,v)||!inside(u,v+1)||!inside(u,v-1);
  let ink=border?BARK[0]:Math.abs(v)<1?BARK[5]:v<0?BARK[3]:BARK[2];
  if(hash32(seed,Math.floor(xx/5),Math.floor(yy/3))%17===0&&!border)ink=BARK[4];
  px(ctx,x+xx,y+yy,1,1,ink);
 }
}
