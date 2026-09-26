// Finishing pass for the four aquatic scenes. Established woodland and the four
// launch additions do not use these backgrounds or scene-exclusive assets.
import {paint,rounded,contains,nearLine,materialInk} from './grammar.mjs';
import {px} from './pixel.mjs';
export const WATER_BACKGROUNDS=new Set(['freshwater','intertidal','shallow-marine','abyssal']);
export const WATER_DETAILS=new Set(['silt','rock-crack','algae-film','crustose','holdfast','abyssal-silt','nodule','sponge','sunken-wood']);
const noise=(x,y,s=0)=>{let h=Math.imul((x+s)|0,374761393)^Math.imul(y|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0};

// Non-periodic relief: distant sediment forms grow broader instead of repeating.
function sedimentNoise(x,y,seed){
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),n=(a,b)=>noise(a,b,seed)/4294967295;
 return (n(ix,iy)*(1-sx)+n(ix+1,iy)*sx)*(1-sy)+(n(ix,iy+1)*(1-sx)+n(ix+1,iy+1)*sx)*sy;
}
function outerSediment(x,y,seed,base){
 const outside=Math.hypot(Math.max(0,-x,x-384),Math.max(0,-y,y-430));if(!outside)return base;
 const t=Math.min(1,outside/230),blend=t*t*(3-2*t),dx=x-192,dy=y-215,r=Math.hypot(dx,dy);
 const stretch=1+Math.max(0,r-250)/850,u=192+dx/stretch,v=215+dy/stretch;
 const warp=(sedimentNoise(u/510,v/510,seed+91)-.5)*210;
 const relief=sedimentNoise((u+warp)/330,(v-warp*.6)/430,seed+137)*.78+sedimentNoise(u/150,v/210,seed+211)*.22;
 const level=Math.max(0,Math.min(1,(relief-.2)/.65)),low=[18,29,32],high=[39,51,53];
 return '#'+[1,3,5].map((i,k)=>Math.round(parseInt(base.slice(i,i+2),16)*(1-blend)+(low[k]+(high[k]-low[k])*level)*blend).toString(16).padStart(2,'0')).join('');
}

export function drawWaterBackground(g,{kind,seed=57,originX=0,originY=0}={}){
 const w=g.canvas?.width||384,h=g.canvas?.height||430;
 for(let y=originY;y<originY+h;y+=2)for(let x=originX;x<originX+w;x+=2){
  const broad=Math.sin(x*.023+y*.011+seed)+Math.sin(y*.029-x*.017)+Math.sin(x*.011-y*.007)*.6;
  const grain=noise(x>>3,y>>3,seed);let c;
  if(kind==='freshwater'){
   // Peaty islands and shaded, olive-brown silt, with quiet lanes of water.
   c=broad>.9?'#4a503b':broad<-.8?'#273c31':'#374635';
   if(broad>.5&&grain%23===0)c='#585940';
  }else if(kind==='intertidal'){
   // Submerged bedrock shelves: muted mineral patches, no full-field white speckle.
   const bed=Math.sin(x*.018+y*.025+seed)*.7+Math.sin(y*.046-x*.012);
   c=bed>.85?'#526258':bed<-.6?'#2b4945':'#3c554d';
   if(broad>1.3)c='#52675a';
  }else if(kind==='shallow-marine'){
   // Sand windows between shaded algal beds. The plants carry the bright values.
   const sand=Math.sin(x*.021+y*.012+seed)+Math.sin(y*.033-x*.009);
   c=sand>1.2?'#576d56':sand>.75?'#48614c':sand<-.9?'#203f39':'#305247';
   if(sand>.85&&Math.sin(y*.4+Math.sin(x*.031)*1.7)>.88&&grain%5!==0)c='#68785f';
  }else{
   // Broad, faint sediment drifts preserve the abyssal negative space.
   c=broad>1?'#293536':broad<-.85?'#172528':'#213033';
   if(originX||originY)c=outerSediment(x,y,seed,c);
  }
  px(g,x-originX,y-originY,2,2,materialInk(c,x,y,seed,'soil'));
 }
 if(kind==='freshwater'){
  for(let i=0;i<100;i++){
   const q=noise(i,13,seed),x=q%w,y=(q>>>10)%h;
   if(i%4===0){px(g,x,y,3+q%4,1,'#716d4d');px(g,x+2,y+1,2,1,'#3a4431')}
   else px(g,x,y,1,1,'#586046');
  }
 }else if(kind==='intertidal'){
  // Broken etched seams remain in the substrate beneath editable rocks.
  for(let i=0;i<22;i++){
   const q=noise(i,19,seed),x=q%w,y=(q>>>10)%h;
   for(let j=0;j<10+q%17;j++)if(noise(j,i,seed)%7)px(g,x+j,y+Math.floor(Math.sin(j*.14+i)*2),1,1,i%3?'#60786a':'#7f8c75');
  }
 }else if(kind==='shallow-marine'){
  for(let i=0;i<54;i++){const q=noise(i,23,seed);px(g,q%w,(q>>>10)%h,i%9?1:2,1,i%5?'#637d64':'#aba587')}
 }else{
  for(let i=0;i<30;i++){
   const q=noise(i,31,seed),x=q%w,y=(q>>>10)%h;
   for(let j=0;j<8+q%10;j++)if(noise(j,i,seed)%4)px(g,x+j,y+Math.round(Math.sin(j*.13+i)),1,1,i%4?'#354144':'#42504e');
  }
 }
}

// Child geometry is transformed before rasterization. No rotated canvas or
// enlarged rectangular pixels: the one-pixel grid is shared with woodland art.
function at(o,u,v,extra=0){const a=o.a||0,c=Math.cos(a),s=Math.sin(a),scale=o.scale??1;return {...o,x:o.x+(u*c-v*s)*scale,y:o.y+(u*s+v*c)*scale,a:a+extra}}
const shapeCache=new Map();
function canvasFor(width,height){
 if(typeof OffscreenCanvas==='function')return new OffscreenCanvas(width,height);
 if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=width;c.height=height;return c}
 return null;
}
function shape(g,o,points,shade,{texture='grain',roughness=.18,edge}={}){
 const extent=Math.max(...points.flat().map(Math.abs))+3;
 const draw=(ctx,origin)=>{const outline=rounded(points);paint(ctx,{...origin,extent,texture,roughness,shadow:false,inside:(u,v)=>contains(outline,u,v),shade,...(edge===undefined?{}:{edge})})};
 // Leaf geometry, material and angle stay fixed while the rooted plant sways.
 // Cache those integer pixels; translate the finished tile without scaling it.
 if(typeof g.drawImage!=='function')return draw(g,o);
 const key=JSON.stringify([o.kind,o.seed,o.a,o.scale,points,texture,roughness,edge]);
 let tile=shapeCache.get(key);
 if(!tile){
  const r=Math.ceil((extent*(o.scale??1)+6)/2)*2,c=canvasFor(r*2+2,r*2+2);
  if(!c)return draw(g,o);
  draw(c.getContext('2d'),{...o,x:r,y:r});tile={canvas:c,r};
  if(shapeCache.size>=512)shapeCache.delete(shapeCache.keys().next().value);
  shapeCache.set(key,tile);
 }
 g.imageSmoothingEnabled=false;g.drawImage(tile.canvas,Math.round(o.x)-tile.r,Math.round(o.y)-tile.r);
}
function line(g,o,ax,ay,bx,by,width,color){
 const cx=(ax+bx)/2,cy=(ay+by)/2,local=at(o,cx,cy);
 paint(g,{...local,extent:Math.max(Math.abs(bx-ax),Math.abs(by-ay))/2+width+2,shadow:false,texture:false,edge:false,inside:(u,v)=>nearLine(u,v,ax-cx,ay-cy,bx-cx,by-cy,width),shade:()=>color});
}
function pebble(g,o,u,v,r,colors){
 const q=noise(Math.round(u),Math.round(v),o.seed);
 paint(g,{...at(o,u,v),extent:r+2,shadow:false,texture:'stone',roughness:.2,inside:(x,y)=>x*x/(r*r)+y*y/(r*r*.63)<1+Math.sin(x*.6+q)*.1,shade:(x,y)=>y< -r*.3?colors[2]:y>r*.27?colors[0]:colors[1]});
}
export function drawWaterDetail(g,{kind,x=0,y=0,a=0,scale=1,seed=57,count}={}){
 const o={kind,x,y,a,scale,seed};
 if(kind==='silt'||kind==='abyssal-silt'){
  const deep=kind==='abyssal-silt',colors=deep?['#273437','#3a4849','#55615b']:['#3a4834','#596047','#7a7953'];
  for(let i=0;i<26;i++){
   const q=noise(i,41,seed),u=-26+q%53,v=-14+(q>>>8)%29;
   if(u*u/729+v*v/225>1)continue;
   if(i%5===0)line(g,o,u,v,u+5+q%7,v-1,.55,colors[1]);
   else pebble(g,o,u,v,i%7===0?2.2:1,colors);
  }return;
 }
 if(kind==='rock-crack'){
  for(const [ax,ay,bx,by] of [[-24,-9,-8,-3],[-8,-3,2,7],[2,7,20,15],[-7,-2,2,-12],[2,7,-9,15]]){
   line(g,o,ax,ay-1,bx,by-1,.7,'#838d71');line(g,o,ax,ay,bx,by,.6,'#3e5045');
  }return;
 }
 if(kind==='algae-film'||kind==='crustose'){
  const crust=kind==='crustose',colors=crust?['#63595c','#80696a','#a1847b']:['#476043','#60794e','#85925d'];
  for(let i=0;i<9;i++){
   const q=noise(i,47,seed),u=-21+q%43,v=-12+(q>>>8)%25,rx=4+q%8,ry=3+(q>>>14)%4;
   paint(g,{...at(o,u,v),extent:rx+3,shadow:false,texture:'grain',roughness:.38,inside:(xx,yy)=>xx*xx/(rx*rx)+yy*yy/(ry*ry)<1+Math.sin(xx*.7+seed+i)*.18,
    shade:(xx,yy)=>{const d=xx*xx/(rx*rx)+yy*yy/(ry*ry);return d>.68?colors[2]:noise(Math.floor(xx/3),Math.floor(yy/3),seed+i)%4?colors[1]:colors[0]}});
  }return;
 }
 if(kind==='holdfast'){
  for(let i=0;i<11;i++){
   const angle=i*.58+seed*.12,len=11+noise(i,51,seed)%11,ux=Math.cos(angle),vy=Math.sin(angle)*.62;
   line(g,o,0,1,ux*len*.6,vy*len*.6,1.4,i%3?'#566845':'#6b7850');
   line(g,o,ux*len*.6,vy*len*.6,ux*len+vy*3,vy*len-ux*3,.7,'#889068');
   if(i%3===0)line(g,o,ux*len*.6,vy*len*.6,ux*len-vy*4,vy*len+ux*4,.7,'#566846');
  }
  pebble(g,o,0,0,5,['#3f5037','#61734a','#879464']);return;
 }
 if(kind==='nodule'){
  for(let i=0;i<8;i++){
   const q=noise(i,61,seed),u=-20+q%41,v=-11+(q>>>8)%23,r=3+q%5;
   paint(g,{...at(o,u,v),extent:r+2,shadow:false,texture:'stone',inside:(xx,yy)=>xx*xx/(r*r)+yy*yy/(r*r*.65)<1+Math.sin(xx*.9+i)*.14,
    shade:(xx,yy)=>{const ridge=(Math.hypot(xx+2,yy+1)+Math.sin(xx*.6))%3;return yy>r*.3?'#273331':ridge<1?'#5b6558':'#414d43'}});
  }return;
 }
 if(kind==='sponge'){
  // Unequal hollow cups with porous walls and a ragged encrusting base.
  for(let i=0;i<5;i++){
   const q=noise(i,67,seed),u=-10+i*5,v=-6-(q%17),r=3+(q>>>8)%3;
   shape(g,at(o,u,0),[[-r,v],[-r-1,v+5],[-2,5],[3,5],[r,v+5],[r,v]],(xx,yy)=>xx< -1?'#88988a':xx>1?'#5b7168':'#a3ad99',{texture:'stone'});
   paint(g,{...at(o,u,v+1),extent:r+2,shadow:false,texture:'stone',inside:(xx,yy)=>xx*xx/(r*r)+yy*yy/5<1,shade:(xx,yy)=>Math.abs(xx)<r-1&&Math.abs(yy)<1.2?'#354d48':'#b5bca4'});
   for(let k=0;k<3;k++)pebble(g,o,u+(k%2?1:-1),v+5+k*4,.7,['#49635b','#668174','#8b9b87']);
  }
  for(let i=0;i<6;i++)pebble(g,o,-10+i*4,5,2,['#465e55','#768d7b','#9da993']);return;
 }
 if(kind==='sunken-wood'){
  const points=[[-31,-3],[-23,-9],[-8,-7],[9,-10],[29,-6],[24,-2],[33,2],[21,7],[4,8],[-18,6],[-29,8]];
  shape(g,o,points,(u,v)=>{
   const grain=v+Math.sin(u*.16+seed)*1.6;
   if(nearLine(u,v,-18,-2,22,0,.65))return '#24312d';
   if(Math.sin(grain*1.6+seed)>.45)return v<0?'#66705a':'#35473b';
   return v< -3?'#77806a':'#4c5c49';
  },{texture:'wood',roughness:.3});
  line(g,o,-22,4,-11,11,1.1,'#374c40');line(g,o,10,-7,20,-13,.8,'#687661');
  for(let i=0;i<7;i++){const q=noise(i,71,seed);pebble(g,o,-24+q%49,-4+(q>>>8)%9,1.2,['#2b3c34','#364a3d','#576751'])}return;
 }
 if(kind==='barnacle'){
  for(let i=0;i<(count??9);i++){
   const q=noise(i,79,seed),u=-17+q%35,v=-10+(q>>>8)%21,r=2.1+q%3*.45;
   const points=[[-r,1],[-r*.8,-r],[0,-r-1],[r,-r*.45],[r,1],[0,r*.65]];
   shape(g,at(o,u,v),points,(xx,yy)=>xx<0?'#c0bca0':'#8d9e87',{texture:'stone',roughness:.05});
   line(g,o,u,v-r*.6,u+.4,v+.4,.6,'#425c52');
  }return;
 }
 if(kind==='limpet'){
  for(let i=0;i<(count??5);i++){
   const q=noise(i,83,seed),u=-14+q%29,v=-9+(q>>>8)%19,r=3+q%3;
   paint(g,{...at(o,u,v),extent:r+2,shadow:false,texture:'stone',inside:(xx,yy)=>xx*xx/(r*r)+yy*yy/(r*r*.48)<1,shade:(xx,yy)=>{
    if(Math.abs(xx)<1&&yy<0)return '#d0c6a2';
    return Math.sin(Math.atan2(yy,xx)*7)>.3?'#aaa88a':'#788671';
   }});
  }return;
 }
 if(kind==='detritus'){
  for(let i=0;i<(count??12);i++){
   const q=noise(i,89,seed),u=-22+q%45,v=-14+(q>>>8)%29,len=3+q%7;
   shape(g,at(o,u,v,(q%7-3)*.17),[[-len,0],[-2,-2],[len,-1],[len-2,2],[-3,3]],(xx,yy)=>yy<0?'#81774e':'#515739',{texture:'wood',roughness:.35});
   if(i%3===0)line(g,o,u-len,v,u+len,v+.5,.5,'#a18e5d');
  }
 }
}

function paintWaterPlant(g,{kind,x=0,y=0,a=0,scale=1,seed=0,height=64,time=0,flow=45,motion=1}={},sway){
 const o={kind,x,y,a,scale,seed};
 if(kind==='waterweed'){
  const stems=2+seed%2;
  for(let stem=0;stem<stems;stem++){
   const base=(stem-(stems-1)/2)*6,len=height*(.78+noise(stem,3,seed)%23/100);
   const drift=j=>base+Math.sin(j*.075+seed*.31+stem*.85)*(1.8+j*.045*(flow/70))+sway(j,len,stem*.58);
   for(let j=2;j<len;j+=3)line(g,o,drift(j-2),-j+2,drift(j),-j,.7,j%12<6?'#42613f':'#73905a');
   for(let j=9;j<len-3;j+=10){
    const u=drift(j),leaf=6+noise(j,stem,seed)%5;
    for(const side of [-1,1]){
     const tilt=side>0?-.35:Math.PI+.25,local=at(o,u,-j,tilt);
     shape(g,local,[[0,0],[leaf*.4,-2.3],[leaf,-.5],[leaf*.65,1.5],[leaf*.2,2]],(xx,yy)=>yy<-.3?'#8ea774':'#5e8354',{roughness:.12});
     line(g,local,1,0,leaf-1,0,.45,'#adb78a');
    }
   }
  }
  for(let i=0;i<5;i++)line(g,o,-4+i*2,0,-8+i*4,4+i%2,.5,'#5d6748');return;
 }
 if(kind==='rockweed'){
  const branches=4+seed%3;
  for(let b=0;b<branches;b++){
   const side=b-(branches-1)/2,len=height*(.58+noise(b,9,seed)%35/100),bend=side*4+Math.sin(seed+b)*3;
   const drift=j=>bend*(j/len)+sway(j,len,b*.47);
   for(let j=2;j<len;j+=3)line(g,o,drift(j-2),-j+2,drift(j),-j,1.3,'#657848');
   for(let j=7;j<len;j+=9){
    const u=drift(j),dir=b%2?1:-1;
    shape(g,at(o,u,-j,dir*.65),[[-1,3],[-3,-1],[-2,-8],[0,-12],[3,-8],[3,-2],[1,3]],(xx,yy)=>xx<0?'#95a165':'#718448',{roughness:.15});
    line(g,o,u,-j,u+dir*3,-j-7,.45,'#b1b27c');
   }
   pebble(g,o,drift(len),-len,2.1,['#607241','#8e995c','#b1af77']);
  }
  for(let i=0;i<5;i++)pebble(g,o,-5+i*2,1,1.5,['#3f5636','#607445','#8a945d']);return;
 }
 // Kelp keeps its established stipe, alternating blade cadence and sway profile;
 // pointed whole leaf silhouettes replace rectangular horizontal stripe stacks.
 const len=height;
 const drift=j=>Math.sin(j*.055+seed*.41)*(2.2+j*.046*(flow/60))+sway(j,len,0);
 for(let j=2;j<len;j+=3)line(g,o,drift(j-2),-j+2,drift(j),-j,.85,'#647a4b');
 for(let j=12,i=0;j<len-7;j+=15,i++){
  const side=(i+seed)&1?1:-1,blade=18+noise(i,17,seed)%13,bw=4+noise(i,21,seed)%4;
  const local=at(o,drift(j),-j,side>0?-.72:Math.PI+.72);
  shape(g,local,[[0,0],[blade*.2,-bw*.65],[blade*.53,-bw],[blade*.83,-bw*.3],[blade,0],[blade*.75,bw*.55],[blade*.3,bw*.6]],(u,v)=>{
   if(nearLine(u,v,1,0,blade-2,0,.7))return '#b0af70';
   return v<0?'#929b5a':'#667b43';
  },{roughness:.22});
 }
 const tip=at(o,drift(len),-len,-Math.PI/2+.15*Math.sin(seed));
 shape(g,tip,[[0,0],[8,-4],[18,-5],[25,0],[16,5],[6,3]],(u,v)=>v<0?'#8c995b':'#637943',{roughness:.2});
 for(let i=0;i<5;i++)line(g,o,0,1,-6+i*3,4+i%2,.7,'#566942');
}

// Composite an animated plant before applying its world shadow. This avoids
// thousands of per-cell shadow operations without changing the sway profile.
const plantBuffers=new WeakMap();
export function drawWaterPlant(g,options={},sway=()=>0){
 if(typeof g.drawImage!=='function')return paintWaterPlant(g,options,sway);
 const {x=0,y=0,scale=1,height=64}=options,r=Math.ceil((height+42)*scale+16),size=r*2+2;
 let buffer=plantBuffers.get(g);
 if(!buffer){buffer=canvasFor(size,size);if(!buffer)return paintWaterPlant(g,options,sway);plantBuffers.set(g,buffer)}
 if(buffer.width<size||buffer.height<size){buffer.width=size;buffer.height=size}
 const ctx=buffer.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,buffer.width,buffer.height);ctx.imageSmoothingEnabled=false;
 // Integer translation keeps the original fractional world origin in every
 // geometry calculation, including half-pixel rounding ties.
 ctx.setTransform(1,0,0,1,r-Math.round(x),r-Math.round(y));
 paintWaterPlant(ctx,options,sway);
 g.imageSmoothingEnabled=false;g.drawImage(buffer,Math.round(x)-r,Math.round(y)-r);
}
