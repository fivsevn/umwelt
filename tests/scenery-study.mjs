import {px,rot,hash32,WORLD_W,WORLD_H} from '../isopoda/scenery/pixel.mjs';

// Local-only visual study for the habitat asset lab.
// Visual target: compact Japanese 16-bit / GBA-era environment sprites.
// Strong silhouettes, stepped colour blocks and directional highlights.
// The public game does not import this module.

const SOIL={
 dry:['#5a4938','#66513d','#705b42','#4b3d31'],
 mid:['#514638','#5a4d3d','#635744','#443c32'],
 wet:['#3f4339','#474a3e','#505246','#373c34'],
 dark:'#332b26',
 light:'#8b704b',
 green:'#5d6b45'
};
const LEAVES=[
 ['#342125','#6b3d2c','#915a37','#bd7d43','#e0a557'],
 ['#35291f','#65523a','#8b7147','#b49357','#d1b36b'],
 ['#3b211e','#7a3825','#a64f2b','#d26f33','#ed9b46'],
 ['#2e2922','#5d5137','#7c7047','#9b8d55','#b6a565']
];
const MOSS=['#203128','#2f4933','#45663a','#6d8d45','#9db95a'];
const BARK=['#291b22','#472d2b','#623d36','#82533f','#a66d49','#ca955f'];
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

 // Large low-frequency tiles: the ground should read as a field, not as noise.
 for(let y=0;y<WORLD_H;y+=8)for(let x=0;x<WORLD_W;x+=8){
  const wet=wetAt(x+4,y+4,wetZones),h=hash32(seed,x>>3,y>>3);
  const pal=wet>.50?SOIL.wet:wet>.16?SOIL.mid:SOIL.dry;
  let ink=pal[h%pal.length];
  if(h%19===0)ink=wet>.28?SOIL.green:SOIL.light;
  if(h%37===0)ink=SOIL.dark;
  px(ctx,x,y,8,8,ink);

  // One subordinate step inside some tiles gives texture without checkerboarding.
  if(h%5===0){
   const sub=shade(ink,(h>>>4)%2?1.08:.88);
   px(ctx,x+((h>>>7)%2?0:4),y+((h>>>8)%2?0:4),4,4,sub);
  }
 }

 // A few authored-looking soil chips and pebbles.
 for(let i=0;i<18;i++){
  const h=hash32(seed,'soil-chip-v2',i),x=10+h%364,y=10+((h>>>9)%410);
  const w=[5,7,9][h%3],ink=[SOIL.dark,'#4a372a','#836946'][h%3];
  px(ctx,x,y,w,2,ink);
  if(h%3===0)px(ctx,x+2,y-1,Math.max(2,w-4),1,shade(ink,1.18));
 }
 for(let i=0;i<9;i++){
  const h=hash32(seed,'soil-pebble-v2',i),x=12+h%358,y=12+((h>>>11)%402);
  px(ctx,x,y,4,3,h%2?'#665443':'#453a31');
  px(ctx,x+1,y,2,1,h%2?'#8a7354':'#66594a');
 }

 if(light<55){
  ctx.fillStyle=`rgba(18,27,22,${(55-light)/120})`;
  ctx.fillRect(0,0,WORLD_W,WORLD_H);
 }
}

function leafShape(variant,t,width){
 const q=Math.max(0,1-Math.abs(t));
 if(variant===1)return width*Math.pow(q,.86)*.58; // narrow willow-like
 if(variant===2)return width*Math.pow(q,.54)*(1+.12*Math.sin((t+.08)*Math.PI*3)); // lobed
 if(variant===3)return width*Math.pow(q,.62)*(t<-.18?.72:1); // torn
 if(variant===4){
  const k=Math.max(0,Math.min(1,(t+1)/1.70)); // fan / ginkgo-like
  return width*Math.sin(k*Math.PI*.90)*(.90+.10*Math.cos(t*Math.PI*3));
 }
 if(variant===5)return width*Math.pow(q,.72)*(.74+.15*Math.cos((t+.08)*Math.PI*2)); // curled
 return width*Math.pow(q,.60);
}

export function drawStudyLeaf(ctx,{x=0,y=0,a=0,variant=0,scale=.9,tone=0,gap=false,age=0,seed=0}={}){
 const p=LEAVES[tone%LEAVES.length],cell=2;
 const length=[38,45,41,39,37,40][variant%6]*scale;
 const width=[20,14,23,22,26,18][variant%6]*scale;
 const ca=Math.cos(a),sa=Math.sin(a);

 const inside=(u,v)=>{
  if(Math.abs(u)>length)return false;
  const t=u/length,rim=leafShape(variant,t,width);
  if(Math.abs(v)>rim)return false;
  const edge=rim-Math.abs(v),side=Math.sign(v)||1;

  // Distinct silhouette damage / lobing by variant.
  if(variant===0&&t>.40&&t<.61&&side<0&&edge<4)return false;
  if(variant===2&&((t>.10&&t<.28&&side>0)||(t<-.18&&t>-.34&&side<0))&&edge<5)return false;
  if(variant===3&&t>.42&&side<0&&edge<7)return false;
  if(variant===3&&t>.04&&t<.26&&side>0&&edge<5)return false;
  if(variant===4&&t>.48&&t<.68&&Math.abs(v)<width*.23)return false;
  if(variant===5&&t<-.24&&side>0&&edge<4)return false;
  return true;
 };

 const radius=Math.ceil(Math.hypot(length,width)+10),shadowX=gap?6:4,shadowY=gap?7:5;

 for(let yy=-radius;yy<=radius;yy+=cell)for(let xx=-radius;xx<=radius;xx+=cell){
  const dx=xx-shadowX,dy=yy-shadowY,u=dx*ca+dy*sa,v=-dx*sa+dy*ca;
  if(inside(u,v))px(ctx,x+xx,y+yy,cell,cell,'rgba(37,28,27,.52)');
 }

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

 const patches=variant===1
  ?[[-.18,-.30,.22,.18],[.30,-.22,.18,.16]]
  :variant===3
  ?[[-.34,-.30,.16,.18],[.10,-.42,.18,.17]]
  :[[-.34,-.34,.18,.22],[-.02,-.48,.17,.20],[.30,-.30,.16,.22]];

 for(const [tu,tv,ru,rv] of patches){
  for(let yy=-width;yy<=width;yy+=cell)for(let xx=-length;xx<=length;xx+=cell){
   const u=xx,v=yy,t=u/length;if(!inside(u,v))continue;
   if(((t-tu)/ru)**2+((v/width-tv)/rv)**2>1)continue;
   putRot(ctx,x,y,a,u,v,cell,cell,p[3]);
  }
 }

 for(let u=-length*.78;u<length*.72;u+=4)putRot(ctx,x,y,a,u,0,2,2,p[4]);
 for(const side of [-1,1])for(const q of [-.48,-.18,.14,.42]){
  const start=q*length;
  for(let i=2;i<9;i+=2)putRot(ctx,x,y,a,start+i*.9,side*i*.62,2,2,p[3]);
 }

 for(let i=0;i<Math.max(7,10*scale);i+=2)putRot(ctx,x,y,a,-length-i,0,2,2,p[0]);
}

export function drawStudyMoss(ctx,{x=0,y=0,rx=62,ry=42,seed=0,wetness=.65,alpha=.72}={}){
 // Low, broken shadow patches only; no solid dome.
 for(let i=0;i<10;i++){
  const h=hash32(seed,'moss-shadow',i);
  const tx=((h%1000)/1000*1.7-.85)*rx,ty=ry*(.18+((h>>>10)%1000)/1000*.42);
  const w=8+((h>>>20)%16),hh=3+((h>>>25)%5);
  px(ctx,x+tx,y+ty,w,hh,'rgba(25,34,28,.50)');
 }

 // Irregular sphagnum sprigs distributed across an oval footprint.
 const count=Math.max(28,Math.round(rx*ry/58));
 for(let i=0;i<count;i++){
  const h=hash32(seed,'moss-sprig',i),ang=(h%628)/100;
  const rr=Math.sqrt(((h>>>8)%1000)/1000);
  const tx=Math.cos(ang)*rx*.92*rr,ty=Math.sin(ang)*ry*.72*rr+ry*.08;
  const nx=tx/(rx||1),ny=(ty-ry*.08)/(ry*.78||1);
  if(nx*nx+ny*ny>1)continue;

  const baseX=Math.round(x+tx),baseY=Math.round(y+ty);
  const tall=5+((h>>>18)%10);
  const lean=((h>>>22)%5)-2;
  const wetBoost=wetness>.72?1:0;
  const dark=MOSS[1],mid=MOSS[2+wetBoost],light=MOSS[Math.min(4,3+wetBoost)];

  // Dark footprint.
  px(ctx,baseX-3,baseY+2,7,3,MOSS[0]);

  // Upright segmented stem.
  for(let j=0;j<tall;j+=3){
   const sx=baseX+Math.round(lean*j/tall),sy=baseY-j;
   px(ctx,sx,sy,3,3,j<tall*.45?dark:mid);
   if(j>2){
    const side=(h+j)%2?-1:1;
    px(ctx,sx+side*3,sy+1,3,3,mid);
    if(j>tall*.55)px(ctx,sx-side*3,sy,3,3,light);
   }
  }

  // Bright crown, sparse enough to keep holes between stems.
  px(ctx,baseX+lean,baseY-tall-2,3,3,light);
  if(h%4===0)px(ctx,baseX+lean+3,baseY-tall,3,3,MOSS[4]);
 }

 // A few crawling side branches around the perimeter.
 for(let i=0;i<8;i++){
  const h=hash32(seed,'moss-runner',i),sx=x-rx*.72+i*(rx*1.44/7),sy=y+ry*(.30+((h>>>8)%18)/100);
  px(ctx,sx,sy,9,3,MOSS[1]);
  px(ctx,sx+3,sy-3,3,3,MOSS[3]);
  if(i%2===0)px(ctx,sx+7,sy-2,3,3,MOSS[2]);
 }
}

function barkInside(half,depth,variant,u,v){
 if(u<-half||u>half)return false;
 const t=(u+half)/(half*2);
 const seg=Math.max(0,Math.min(7,Math.floor(t*8)));
 const topA=variant?[10,5,8,3,6,4,11,7]:[9,4,7,2,6,3,10,6];
 const botA=variant?[4,8,3,7,5,9,4,10]:[5,9,4,7,5,8,3,11];
 const top=-depth+topA[seg];
 const bottom=depth-botA[seg];
 if(v<top||v>bottom)return false;

 // Chunky broken ends and missing bites.
 if(t<.09&&v<top+12)return false;
 if(t<.05&&v>bottom-8)return false;
 if(t>.90&&v>bottom-12)return false;
 if(t>.95&&v<top+10)return false;
 if(variant&&t>.70&&t<.82&&v<top+7)return false;
 if(!variant&&t>.22&&t<.31&&v>bottom-5)return false;
 return true;
}

export function drawStudyBark(ctx,{x=192,y=218,a=-.08,scale=1,variant=0,lift=0,seed=57}={}){
 y+=lift;
 const half=(variant?62:80)*scale,depth=(variant?25:33)*scale,cell=2;
 const radius=Math.ceil(Math.hypot(half,depth)+12);

 for(let yy=-radius;yy<=radius;yy+=cell)for(let xx=-radius;xx<=radius;xx+=cell){
  const [u,v]=rot(xx-5,yy-6,-a);
  if(barkInside(half,depth,variant,u,v))px(ctx,x+xx,y+yy,cell,cell,'rgba(31,24,27,.62)');
 }

 for(let v=-depth;v<=depth;v+=cell)for(let u=-half;u<=half;u+=cell){
  if(!barkInside(half,depth,variant,u,v))continue;
  const border=!barkInside(half,depth,variant,u+cell,v)||!barkInside(half,depth,variant,u-cell,v)||!barkInside(half,depth,variant,u,v+cell)||!barkInside(half,depth,variant,u,v-cell);
  let ink=BARK[2];
  if(border)ink=BARK[0];
  else if(v<-depth*.30)ink=BARK[4];
  else if(v<depth*.18)ink=BARK[3];
  else if(v>depth*.62)ink=BARK[1];
  putRot(ctx,x,y,a,u,v,cell,cell,ink);
 }

 // Irregular highlight planes, broken into offset chunks.
 const planes=variant
  ?[[-39,-11,22,7],[-13,-15,26,8],[17,-9,19,7]]
  :[[-52,-12,25,8],[-21,-17,30,9],[14,-12,25,8],[42,-8,17,6]];

 for(let pIndex=0;pIndex<planes.length;pIndex++){
  const [u,v,w,h]=planes[pIndex];
  for(let yy=0;yy<h*scale;yy+=2)for(let xx=0;xx<w*scale;xx+=2){
   if((xx/2+pIndex)%7===6&&yy>2)continue;
   const uu=u*scale+xx,vv=v*scale+yy;
   if(barkInside(half,depth,variant,uu,vv))putRot(ctx,x,y,a,uu,vv,2,2,yy<3?BARK[5]:BARK[4]);
  }
 }

 const cracks=variant
  ?[[-44,8,25,-.18],[-12,14,28,-.12],[18,2,26,.20]]
  :[[-58,10,34,-.12],[-25,16,32,-.08],[12,7,37,.16],[43,-13,22,.24]];

 for(const [sx,sy,len,slope] of cracks){
  for(let i=0;i<len*scale;i+=4){
   const u=sx*scale+i,v=sy*scale+i*slope;
   if(barkInside(half,depth,variant,u,v))putRot(ctx,x,y,a,u,v,4,2,BARK[0]);
  }
 }

 // Moss lives in crevices, never as a flat sticker.
 const mossPatches=variant
  ?[[-17,-1,17,9],[13,6,13,8]]
  :[[24,7,10,6]];
 for(let pIndex=0;pIndex<mossPatches.length;pIndex++){
  const [mu,mv,mw,mh]=mossPatches[pIndex];
  for(let yy=-mh;yy<=mh;yy+=3)for(let xx=-mw;xx<=mw;xx+=3){
   if((xx/mw)**2+(yy/mh)**2>1)continue;
   const u=mu*scale+xx*scale,v=mv*scale+yy*scale;
   if(!barkInside(half,depth,variant,u,v))continue;
   const h=hash32(seed,'bark-moss-v2',pIndex,xx,yy);
   if(h%4===0)continue;
   putRot(ctx,x,y,a,u,v,3,3,h%5===0?MOSS[4]:h%2?MOSS[2]:MOSS[3]);
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
