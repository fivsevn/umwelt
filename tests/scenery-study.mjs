import {px,rot,hash32,WORLD_W,WORLD_H} from '../isopoda/scenery/pixel.mjs';

// Local-only visual study for the habitat asset lab.
// Direction: compact 16-bit Japanese farm/RPG scenery — limited palette,
// strong silhouettes, clustered highlights, restrained dithering.
// The public game does not import this module.

const SOIL={
  dry:['#6b563a','#745f3f','#7d6948','#5b4933','#8c744c'],
  mid:['#5f5139','#66583f','#6e6046','#4f4433','#78684b'],
  wet:['#4c4938','#50503f','#565747','#3f4235','#61604b'],
  dark:'#3c3328',
  light:'#9a8053',
  green:'#66734f'
};
const LEAVES=[
 ['#3b2f26','#6e4b2d','#8b6238','#b1844c','#d0a45f'],
 ['#3a3325','#695938','#857445','#a59159','#c2aa6a'],
 ['#3c2b23','#71442d','#925b37','#b87845','#d39a5a'],
 ['#373129','#615440','#7a6b4e','#96835b','#b39b6a']
];
const MOSS=['#293b2d','#38543a','#4d7048','#698c57','#8bab67'];
const BARK=['#2f241c','#4a3223','#68462b','#8b6037','#b07d48','#d0a062'];
const STONE=['#30373a','#465157','#5b686e','#748188','#98a2a0'];
const BONE=['#5c594c','#8d8975','#b7b29b','#d8d2b5','#eee5c9'];

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

export function drawStudySubstrate(ctx,{wetZones=[],light=100,seed=57}={}){
 px(ctx,0,0,WORLD_W,WORLD_H,SOIL.dry[0]);

 // 4px ground clusters instead of dense 2px noise.
 for(let y=0;y<WORLD_H;y+=4)for(let x=0;x<WORLD_W;x+=4){
  const wet=wetAt(x+2,y+2,wetZones),h=hash32(seed,x>>2,y>>2);
  const pal=wet>.50?SOIL.wet:wet>.16?SOIL.mid:SOIL.dry;
  let ink=pal[h%pal.length];
  if(h%17===0)ink=wet>.28?SOIL.green:SOIL.light;
  if(h%29===0)ink=SOIL.dark;
  px(ctx,x,y,4,4,ink);
  // Small paired highlight/dark pixels make the field read like tiled 16-bit soil.
  if(h%11===0)px(ctx,x+1,y+1,2,1,shade(ink,1.12));
  if(h%13===0)px(ctx,x+2,y+3,2,1,shade(ink,.78));
 }

 // Sparse readable humus chunks.
 for(let i=0;i<24;i++){
  const h=hash32(seed,'humus-jp',i),x=12+h%360,y=12+((h>>>9)%404);
  const w=[3,4,5,6][h%4],hh=[2,2,3][(h>>>3)%3];
  px(ctx,x,y,w,hh,[SOIL.dark,'#4b3929','#8d7048'][h%3]);
  if(h%4===0)px(ctx,x+1,y,w-2,1,'#9c8257');
 }
 if(light<55){
  ctx.fillStyle=`rgba(20,28,23,${(55-light)/120})`;
  ctx.fillRect(0,0,WORLD_W,WORLD_H);
 }
}

function leafShape(variant,t,width){
 const q=Math.max(0,1-Math.abs(t));
 if(variant===1)return width*Math.pow(q,.78)*.68;
 if(variant===2)return width*Math.pow(q,.56)*(1+.08*Math.sin((t+.1)*Math.PI*3));
 if(variant===3)return width*Math.pow(q,.62)*(t<-.24?.76:1);
 if(variant===4)return width*Math.pow(q,.64)*(.93+.06*Math.cos(t*Math.PI*2));
 if(variant===5)return width*Math.pow(q,.70)*(.78+.12*Math.cos((t+.12)*Math.PI*2));
 return width*Math.pow(q,.60);
}

export function drawStudyLeaf(ctx,{x=0,y=0,a=0,variant=0,scale=.9,tone=0,gap=false,age=0,seed=0}={}){
 const p=LEAVES[tone%LEAVES.length],cell=2;
 const length=[38,43,41,39,42,40][variant%6]*scale;
 const width=[20,16,23,22,20,19][variant%6]*scale;
 const ca=Math.cos(a),sa=Math.sin(a);
 const inside=(u,v)=>{
  if(Math.abs(u)>length)return false;
  const t=u/length,rim=leafShape(variant,t,width);
  if(Math.abs(v)>rim)return false;
  const edge=rim-Math.abs(v),side=Math.sign(v)||1;
  if(variant===0&&t>.40&&t<.58&&side<0&&edge<4)return false;
  if(variant===2&&t>.12&&t<.34&&side>0&&edge<4)return false;
  if(variant===3&&t>.50&&side<0&&edge<5)return false;
  if(variant===4&&t<-.34&&side>0&&edge<4)return false;
  return true;
 };
 const radius=Math.ceil(Math.hypot(length,width)+9);
 const shadowX=gap?5:3,shadowY=gap?6:4;

 // One solid, offset shadow creates the SNES/GBA prop cutout.
 for(let yy=-radius;yy<=radius;yy+=cell)for(let xx=-radius;xx<=radius;xx+=cell){
  const dx=xx-shadowX,dy=yy-shadowY,u=dx*ca+dy*sa,v=-dx*sa+dy*ca;
  if(inside(u,v))px(ctx,x+xx,y+yy,cell,cell,'rgba(36,30,24,.55)');
 }

 for(let yy=-radius;yy<=radius;yy+=cell)for(let xx=-radius;xx<=radius;xx+=cell){
  const u=xx*ca+yy*sa,v=-xx*sa+yy*ca;
  if(!inside(u,v))continue;
  const t=u/length,rim=leafShape(variant,t,width),edge=rim-Math.abs(v);
  let ink=edge<3?p[0]:v<-.14*rim?p[3]:p[2];
  if(v>.45*rim)ink=p[1];
  if(Math.abs(v)<2)ink=p[4];
  const h=hash32(seed,Math.round(u/4),Math.round(v/4));
  if(edge>5&&h%19===0)ink=p[3];
  if(age>0)ink=shade(ink,Math.max(.80,1-Math.min(18,age)*.008));
  px(ctx,x+xx,y+yy,cell,cell,ink);
 }

 // Midrib + short veins.
 for(let u=-length*.76;u<length*.73;u+=4){
  const [dx,dy]=rot(u,0,a);px(ctx,x+dx,y+dy,2,2,p[4]);
 }
 for(const side of [-1,1])for(let q=-.45;q<=.45;q+=.30){
  for(let i=0;i<7;i+=2){
   const u=q*length+i*1.1,v=side*i*.75;
   const [dx,dy]=rot(u,v,a);px(ctx,x+dx,y+dy,2,1,p[3]);
  }
 }

 // Stem.
 for(let i=0;i<Math.max(5,8*scale);i+=2){
  const [dx,dy]=rot(-length-i,0,a);px(ctx,x+dx,y+dy,2,2,p[0]);
 }
}

export function drawStudyMoss(ctx,{x=0,y=0,rx=62,ry=42,seed=0,wetness=.65,alpha=.72}={}){
 // Shadow mass.
 const lumps=[
  [-.52,-.04,.42,.50],[-.18,-.26,.48,.60],[.22,-.18,.52,.58],[.52,.03,.38,.48],
  [-.35,.28,.48,.38],[.06,.31,.56,.38],[.48,.28,.42,.34]
 ];
 for(let yy=-ry;yy<=ry;yy+=4)for(let xx=-rx;xx<=rx;xx+=4){
  let d=9;
  for(const [lx,ly,lrx,lry] of lumps){
   const dx=(xx-rx*lx)/(rx*lrx),dy=(yy-ry*ly)/(ry*lry);
   d=Math.min(d,dx*dx+dy*dy);
  }
  if(d>1)continue;
  px(ctx,x+xx+3,y+yy+4,4,4,'rgba(34,40,29,.55)');
 }

 // Moss is drawn as discrete tufts, not translucent noise.
 for(let i=0;i<Math.round((rx*ry)/42);i++){
  const h=hash32(seed,'tuft',i),ang=(h%628)/100;
  const rr=Math.sqrt(((h>>>7)%1000)/1000);
  const tx=Math.cos(ang)*rx*.88*rr,ty=Math.sin(ang)*ry*.78*rr;
  const nx=tx/(rx||1),ny=ty/(ry||1);
  if(nx*nx+ny*ny>1)continue;
  const wet=Math.max(0,Math.min(1,wetness));
  let tone=1+((h>>>12)%3);
  if(wet>.72&&h%5===0)tone=4;
  const base=MOSS[Math.min(4,tone)];
  const dark=MOSS[Math.max(0,tone-1)],light=MOSS[Math.min(4,tone+1)];
  const cx=Math.round(x+tx),cy=Math.round(y+ty);
  px(ctx,cx-3,cy+1,7,4,dark);
  px(ctx,cx-2,cy-2,5,5,base);
  px(ctx,cx,cy-4,2,3,light);
  if(h%3===0)px(ctx,cx-4,cy-1,2,3,base);
 }

 // A few recognizable upright sphagnum crowns.
 for(let i=0;i<7;i++){
  const h=hash32(seed,'crown',i),cx=x-rx*.55+i*(rx*1.1/6),cy=y-ry*.42-(h%8);
  px(ctx,cx,cy,3,9,MOSS[2]);
  px(ctx,cx-3,cy+2,3,3,MOSS[3]);
  px(ctx,cx+3,cy,3,3,MOSS[4]);
  px(ctx,cx,cy-3,3,3,MOSS[4]);
 }
}

export function drawStudyBark(ctx,{x=192,y=218,a=-.08,scale=1,variant=0,lift=0,seed=57}={}){
 y+=lift;
 const half=(variant?64:80)*scale,depth=(variant?26:33)*scale,cell=2;
 const ca=Math.cos(a),sa=Math.sin(a);
 const at=(u,v,w,h,color)=>{
  const [dx,dy]=rot(u,v,a);px(ctx,x+dx,y+dy,w,h,color);
 };
 const inside=(u,v)=>{
  const q=(v+depth)/(depth*2);
  const left=-half+(7+q*9)*scale,right=half-(6+(1-q)*9)*scale;
  if(u<left||u>right||v<-depth||v>depth)return false;
  if(variant&&u<left+12&&v<-depth+13)return false;
  return true;
 };
 const radius=Math.ceil(Math.hypot(half,depth)+10);

 // Strong offset shadow.
 for(let yy=-radius;yy<=radius;yy+=cell)for(let xx=-radius;xx<=radius;xx+=cell){
  const u=(xx-4)*ca+(yy-5)*sa,v=-(xx-4)*sa+(yy-5)*ca;
  if(inside(u,v))px(ctx,x+xx,y+yy,cell,cell,'rgba(31,27,22,.62)');
 }

 for(let v=-depth;v<=depth;v+=cell)for(let u=-half;u<=half;u+=cell){
  if(!inside(u,v))continue;
  const p=(u+half)/(half*2),q=(v+depth)/(depth*2);
  let ink=BARK[2];
  if(q<.13)ink=BARK[4];
  if(q>.82)ink=BARK[1];
  if(p<.035||p>.965||q<.045||q>.955)ink=BARK[0];
  const h=hash32(seed,Math.round(u/6),Math.round(v/6),variant);
  if(h%17===0&&q>.18&&q<.78)ink=BARK[3];
  at(u,v,2,2,ink);
 }

 // Broad golden exposed fibre panel.
 for(let v=-10*scale;v<5*scale;v+=2)for(let u=-22*scale;u<38*scale;u+=2){
  const nx=(u+22*scale)/(60*scale),ny=(v+10*scale)/(15*scale);
  if(nx<.03+ny*.13||nx>.96-ny*.08)continue;
  at(u,v,2,2,ny<.34?BARK[5]:BARK[4]);
 }
 // Chunky vertical fibre rhythm.
 for(let u=-12*scale;u<36*scale;u+=8*scale){
  at(u,-8*scale,2,12*scale,BARK[3]);
  at(u+2*scale,-6*scale,2,7*scale,BARK[5]);
 }

 const cracks=variant?[[-32,8,25,-.13],[7,-12,22,.18]]:[[-44,7,34,.10],[8,15,29,-.17],[34,-17,22,.20]];
 for(const [sx,sy,len,slope] of cracks)for(let i=0;i<len*scale;i+=4)at(sx*scale+i,sy*scale+i*slope,3,2,BARK[0]);
}

export function drawStudyStone(ctx,{x=0,y=0,a=0,scale=1,variant=0,seed=0}={}){
 const shapes=[{rx:12,ry:8},{rx:15,ry:6},{rx:9,ry:9}],s=shapes[variant%3];
 const rx=s.rx*scale,ry=s.ry*scale;
 // shadow
 for(let yy=-Math.ceil(ry);yy<=Math.ceil(ry);yy++)for(let xx=-Math.ceil(rx);xx<=Math.ceil(rx);xx++){
  if((xx/rx)**2+(yy/ry)**2>1)continue;
  const [dx,dy]=rot(xx+2,yy+3,a);px(ctx,x+dx,y+dy,1,1,'#2b2f2f');
 }
 for(let yy=-Math.ceil(ry);yy<=Math.ceil(ry);yy++)for(let xx=-Math.ceil(rx);xx<=Math.ceil(rx);xx++){
  const d=(xx/rx)**2+(yy/ry)**2;if(d>1)continue;
  let tone=d>.76?0:yy<-.12*ry?3:2;
  const h=hash32(seed,xx,yy,variant);
  if(h%17===0)tone=Math.min(4,tone+1);
  const [dx,dy]=rot(xx,yy,a);px(ctx,x+dx,y+dy,1,1,STONE[tone]);
 }
 const [hx,hy]=rot(-rx*.32,-ry*.34,a);
 px(ctx,x+hx,y+hy,Math.max(2,Math.round(rx*.52)),2,STONE[4]);
}

export function drawStudyCuttlebone(ctx,{x=330,y=170,a=-.42,scale=.72,seed=3}={}){
 const rx=25*scale,ry=10*scale;
 for(let yy=-Math.ceil(ry);yy<=Math.ceil(ry);yy++)for(let xx=-Math.ceil(rx);xx<=Math.ceil(rx);xx++){
  const d=(xx/rx)**2+(yy/ry)**2;if(d>1)continue;
  const [sx,sy]=rot(xx+2,yy+3,a);px(ctx,x+sx,y+sy,1,1,'#4c493f');
 }
 for(let yy=-Math.ceil(ry);yy<=Math.ceil(ry);yy++)for(let xx=-Math.ceil(rx);xx<=Math.ceil(rx);xx++){
  const d=(xx/rx)**2+(yy/ry)**2;if(d>1)continue;
  if(xx>rx*.58&&yy<-ry*.22)continue;
  let tone=d>.75?1:yy<-.1*ry?4:3;
  if(hash32(seed,xx,yy)%21===0)tone=2;
  const [dx,dy]=rot(xx,yy,a);px(ctx,x+dx,y+dy,1,1,BONE[tone]);
 }
 for(let i=-13;i<=13;i+=5){
  const [dx,dy]=rot(i*scale,1*scale,a);px(ctx,x+dx,y+dy,2,1,BONE[1]);
 }
}

export function drawStudyTwig(ctx,{x=0,y=0,a=0,length=18,seed=0}={}){
 // shadow
 for(let i=0;i<length;i+=2){const [dx,dy]=rot(i+2,3,a);px(ctx,x+dx,y+dy,2,2,'#34291f')}
 for(let i=0;i<length;i+=2){
  const [dx,dy]=rot(i,0,a);px(ctx,x+dx,y+dy,2,2,i%6?'#60452d':'#7d5b36');
  if(i===Math.floor(length*.55/2)*2)for(let j=2;j<8;j+=2){const [bx,by]=rot(i,j,a);px(ctx,x+bx,y+by,2,2,'#4b3527')}
 }
}

export function drawStudyWoodChip(ctx,{x=0,y=0,a=0,variant=0,scale=1,seed=0}={}){
 const length=[18,25,16][variant%3]*scale,width=[5,6,7][variant%3]*scale,ca=Math.cos(a),sa=Math.sin(a);
 for(let yy=-Math.ceil(width)-3;yy<=Math.ceil(width)+3;yy++)for(let xx=-Math.ceil(length)-3;xx<=Math.ceil(length)+3;xx++){
  const u=(xx-2)*ca+(yy-3)*sa,v=-(xx-2)*sa+(yy-3)*ca,t=u/length;
  if(Math.abs(t)>1)continue;const rim=width*(1-Math.abs(t)*.60);if(Math.abs(v)>rim)continue;
  px(ctx,x+xx,y+yy,1,1,'#34291f');
 }
 for(let yy=-Math.ceil(width);yy<=Math.ceil(width);yy++)for(let xx=-Math.ceil(length);xx<=Math.ceil(length);xx++){
  const u=xx*ca+yy*sa,v=-xx*sa+yy*ca,t=u/length;if(Math.abs(t)>1)continue;
  const rim=width*(1-Math.abs(t)*.60)+(variant===1?Math.sin(u*.45):0);if(Math.abs(v)>rim)continue;
  let ink=Math.abs(v)<1?'#b1844f':v<0?'#86603b':'#5a422f';
  if(Math.abs(t)>.84)ink='#3d3229';
  if(hash32(seed,xx,yy)%31===0)ink='#c09258';
  px(ctx,x+xx,y+yy,1,1,ink);
 }
}
