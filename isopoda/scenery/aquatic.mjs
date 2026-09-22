import {stepInteraction} from '../interaction.mjs?v=touchhold-1';
import {habitatConfig} from '../habitats.mjs';
import {drawStone,drawBark,drawLeaf,drawMossPatch} from './index.mjs?v=forest-10';

const noise=(x,y,seed=0)=>{let n=Math.imul(x+seed+1,374761393)^Math.imul(y+1,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
const pixel=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};

export const AQUATIC_BACKDROPS=Object.freeze({
 freshwater:{palette:['#273b32','#344439','#4e5140','#68634b'],water:'#31564f',accent:'#81906a'},
 intertidal:{palette:['#324743','#405552','#69736a','#9b9880'],water:'#456b67',accent:'#aab59b'},
 'shallow-marine':{palette:['#203e3d','#355452','#6d7660','#969375'],water:'#315e5a',accent:'#a7ad83'}
});

function localPixel(g,o,u,v,w,h,c){
 const scale=o.scale??1,a=o.a||0,ca=Math.cos(a),sa=Math.sin(a);
 const x=o.x+(u*ca-v*sa)*scale,y=o.y+(u*sa+v*ca)*scale;
 pixel(g,x,y,w*scale,h*scale,c);
}
function localLine(g,o,ax,ay,bx,by,width,color){
 const steps=Math.max(1,Math.ceil(Math.max(Math.abs(bx-ax),Math.abs(by-ay))));
 for(let i=0;i<=steps;i++){const t=i/steps;localPixel(g,o,ax+(bx-ax)*t,ay+(by-ay)*t,width,width,color)}
}
function plantRamp(kind){
 if(kind==='waterweed')return ['#21372d','#4c7049','#7f9668','#b5b98a'];
 if(kind==='rockweed')return ['#27382d','#596943','#87915f','#b8b07a'];
 if(kind==='seagrass')return ['#21362f','#4f765a','#82a06f','#bcc494'];
 if(kind==='ulva')return ['#21372e','#4e7955','#85a873','#c0c993'];
 return ['#22352c','#536f43','#87945b','#b8b47c'];
}

// Small scene modules use the same hard-edged pixel vocabulary as the larger scenery.
// They are exported so Habitat Lab can place the exact same elements as the live game.
export function drawAquaticDetail(g,{kind='barnacle',x=0,y=0,a=0,scale=1,seed=0,count}={}){
 const o={x,y,a,scale};
 if(kind==='barnacle'){
  const total=count??(7+seed%6);
  for(let i=0;i<total;i++){
   const n=noise(i,31,seed),u=-18+(n%37),v=-10+((n>>>8)%21),w=3+(n%3),h=3+((n>>>4)%2);
   // Pale square U-shaped shell with a dark aperture; this restores the old tide-rock motif.
   localPixel(g,o,u-1,v-1,w+2,h+2,'#59635a');
   localPixel(g,o,u,v,w,1,'#c0bea0');
   localPixel(g,o,u,v+1,1,h-1,'#a9ad91');
   localPixel(g,o,u+w-1,v+1,1,h-1,'#d0c9aa');
   localPixel(g,o,u+1,v+1,Math.max(1,w-2),Math.max(1,h-2),'#4b5751');
   if(i%3===0)localPixel(g,o,u+1,v,1,1,'#ded8b5');
  }
  return;
 }
 if(kind==='limpet'){
  const total=count??(4+seed%4);
  for(let i=0;i<total;i++){
   const n=noise(i,43,seed),u=-14+(n%29),v=-9+((n>>>9)%19),w=5+(n%4);
   localPixel(g,o,u,v,w,2,'#596158');
   localPixel(g,o,u+1,v-1,Math.max(2,w-2),1,'#b8b79b');
   localPixel(g,o,u+2,v-2,Math.max(1,w-4),1,'#d2c9a9');
   localPixel(g,o,u+1,v+1,Math.max(2,w-2),1,'#747b68');
  }
  return;
 }
 if(kind==='detritus'){
  const total=count??(8+seed%7);
  for(let i=0;i<total;i++){
   const n=noise(i,57,seed),u=-22+(n%45),v=-14+((n>>>7)%29),len=4+((n>>>13)%8),side=n&1?1:-1;
   const dark=i%3===0?'#3a4634':'#4a533a',mid=i%2?'#697052':'#5b6247';
   localLine(g,o,u,v,u+side*len,v+((n>>>4)%5)-2,1,dark);
   if(i%2===0)localPixel(g,o,u+side*Math.floor(len*.55),v-1,2,1,mid);
  }
  return;
 }
 if(kind==='shellgrit'){
  const total=count??(12+seed%8);
  for(let i=0;i<total;i++){
   const n=noise(i,71,seed),u=-20+(n%41),v=-11+((n>>>9)%23),w=1+(n%4);
   const c=i%5===0?'#c4bea0':i%3===0?'#92927a':'#6f796c';
   localPixel(g,o,u,v,w,1,c);
   if(i%6===0)localPixel(g,o,u+1,v-1,1,1,'#d7d0ae');
  }
 }
}

export function drawAquaticBackground(g,{kind='freshwater',palette,seed=57}={}){
 const preset=AQUATIC_BACKDROPS[kind]||AQUATIC_BACKDROPS.freshwater,p=palette||preset.palette,w=g.canvas?.width||384,h=g.canvas?.height||430;
 for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){
  const n=noise(x>>1,y>>1,seed),wave=Math.sin((x+seed)*.024+y*.013)+Math.sin(y*.031);
  const highlightMod=kind==='shallow-marine'?103:kind==='intertidal'?67:47;
  const midMod=kind==='shallow-marine'?5:3;
  const band=n%highlightMod===0?3:wave>.85&&n%midMod===0?2:n%midMod===0?1:0;
  pixel(g,x,y,2,2,p[band]);
 }
 // Sparse granular flecks make the ground read as a submerged surface rather than flat water.
 for(let i=0;i<Math.round(w*h/780);i++){
  const n=noise(i,91,seed),x=n%w,y=(n>>>11)%h;
  pixel(g,x,y,n%5===0?2:1,1,n%3===0?p[3]:p[1]);
 }
 if(kind==='freshwater'){
  // Peaty silt pockets, tiny decomposing fragments and darker anaerobic spots.
  for(let i=0;i<34;i++){
   const n=noise(i,101,seed),x=n%w,y=(n>>>10)%h,span=3+(n%8);
   pixel(g,x,y,span,1,i%3?'rgba(39,56,43,.58)':'rgba(108,107,75,.42)');
   if(i%4===0)pixel(g,x+2,y+2,2,1,'rgba(129,132,91,.38)');
  }
 }
 if(kind==='intertidal'){
  for(let x=0;x<w;x+=7){const y=Math.round(h*.56+Math.sin((x+seed)*.055)*2);pixel(g,x,y,5,1,'rgba(157,185,164,.34)')}
  // Mineral pitting and wet rock-pool scuffs keep the floor from reading as a flat carpet.
  for(let i=0;i<28;i++){
   const n=noise(i,109,seed),x=n%w,y=(n>>>10)%h;
   pixel(g,x,y,2+(n%4),1,i%4===0?'rgba(188,188,156,.28)':'rgba(46,67,62,.45)');
   if(i%6===0)pixel(g,x+1,y+2,1,1,'rgba(183,193,166,.38)');
  }
 }
 if(kind==='shallow-marine'){
  // Broken sand ripples and shell glints: geometric rather than smooth gradients.
  for(let i=0;i<20;i++){
   const n=noise(i,117,seed),x=n%w,y=(n>>>11)%h,len=7+(n%13);
   for(let j=0;j<len;j+=3)pixel(g,x+j,y+Math.round(Math.sin((j+i)*.8)),2,1,'rgba(157,160,126,.22)');
  }
  for(let i=0;i<22;i++){const n=noise(i,121,seed);pixel(g,n%w,(n>>>9)%h,1+(n%3),1,i%4===0?'rgba(205,201,158,.38)':'rgba(86,105,83,.34)')}
 }
}

export function drawAquaticPlant(g,{kind='waterweed',x=0,y=0,a=0,scale=1,seed=0,height=64,time=0,flow=45}={}){
 const ramp=plantRamp(kind),o={x,y,a,scale},swayBase=Math.sin(time*.55+seed*.17)*(flow/100);
 if(kind==='waterweed'){
  const stems=2+(seed%2);
  for(let stem=0;stem<stems;stem++){
   const baseU=(stem-(stems-1)/2)*5,stemHeight=height*(.78+((noise(stem,3,seed)%23)/100));
   let prev={u:baseU,v:1};
   for(let j=0;j<=stemHeight;j+=3){
    const drift=Math.sin(j*.085+seed*.31+stem*.9)*(2.2+j*.055*(flow/70))+swayBase*j*.045;
    const cur={u:baseU+drift,v:-j};
    localLine(g,o,prev.u,prev.v,cur.u,cur.v,3,'#1d3029');
    localLine(g,o,prev.u,prev.v,cur.u,cur.v,1.5,j%12<6?ramp[0]:ramp[1]);prev=cur;
    if(j>7&&j%9<3){
     const side=((j/9+stem+seed)&1)?1:-1,leaf=6+(noise(j,stem,seed)%6);
     localLine(g,o,cur.u,cur.v,cur.u+side*leaf,cur.v-4,3.5,'#1d3029');
     localLine(g,o,cur.u+side*2,cur.v-1,cur.u+side*(leaf-1),cur.v-5,3.5,'#1d3029');
     localLine(g,o,cur.u,cur.v,cur.u+side*leaf,cur.v-4,2,ramp[1]);
     localLine(g,o,cur.u+side*2,cur.v-1,cur.u+side*(leaf-1),cur.v-5,2,ramp[2]);
     localPixel(g,o,cur.u+side*(leaf-1),cur.v-5,2,2,ramp[3]);
     localPixel(g,o,cur.u,cur.v,1,1,ramp[3]);
    }
   }
  }
  localPixel(g,o,-5,1,11,3,ramp[0]);return;
 }
 if(kind==='rockweed'){
  const branches=4+(seed%3);
  for(let b=0;b<branches;b++){
   const side=b-(branches-1)/2,len=height*(.58+(noise(b,9,seed)%35)/100),bend=side*4+Math.sin(seed+b)*3;
   localLine(g,o,0,0,bend*.35,-len*.45,4,'#1e3029');
   localLine(g,o,bend*.35,-len*.45,bend,-len,4,'#1e3029');
   localLine(g,o,0,0,bend*.35,-len*.45,2.3,ramp[0]);
   localLine(g,o,bend*.35,-len*.45,bend,-len,2.5,ramp[b%2?1:2]);
   for(let k=1;k<4;k++){
    const t=k/4,u=bend*t+(side<0?-1:1)*(3+k),v=-len*t;
    localPixel(g,o,u-1,v+1,6+k%2,4,'#1e3029');
    localPixel(g,o,u,v,4+k%2,3,ramp[2]);
   }
   localPixel(g,o,bend-2,-len-2,5,5,ramp[1]);
   localPixel(g,o,bend-1,-len-1,3,3,ramp[3]);
   localPixel(g,o,bend,-len,1,1,ramp[0]);
  }
  localPixel(g,o,-7,0,14,4,ramp[0]);return;
 }
 if(kind==='seagrass'){
  const blades=7+(seed%4);
  for(let b=0;b<blades;b++){
   const u=(b-(blades-1)/2)*2.6,len=height*(.55+(noise(b,13,seed)%45)/100),tip=u+Math.sin(seed*.2+b)*8+swayBase*8;
   localLine(g,o,u,1,u*.6,-len*.55,3.4,'#1c302a');
   localLine(g,o,u*.6,-len*.55,tip,-len,3.7,'#1c302a');
   localLine(g,o,u,1,u*.6,-len*.55,1.8,ramp[b%3?1:0]);
   localLine(g,o,u*.6,-len*.55,tip,-len,2.1,ramp[b%3===0?3:2]);
   if(b%3===0)localPixel(g,o,tip,-len,1,2,ramp[3]);
  }
  localPixel(g,o,-8,1,16,3,ramp[0]);return;
 }
 if(kind==='ulva'){
  const fans=3+(seed%3);
  for(let f=0;f<fans;f++){
   const side=f-(fans-1)/2,fanHeight=height*(.62+(noise(f,19,seed)%32)/100),lean=side*5+((noise(f,23,seed)%7)-3);
   for(let j=0;j<fanHeight;j+=2){
    const t=j/fanHeight,width=Math.max(3,Math.round((Math.sin(t*Math.PI)*9+3)*(1-t*.22)));
    const center=lean*t+Math.sin(j*.12+seed+f)*2+swayBase*j*.03;
    localPixel(g,o,center-width/2-1,-j+1,width+2,3,'#1d3129');
    localPixel(g,o,center-width/2,-j,width,2,j%8<4?ramp[1]:ramp[2]);
    if(j%10===0)localPixel(g,o,center-width/2,-j,1,1,ramp[3]);
    if(j%14===0)localPixel(g,o,center+width/4,-j,1,1,ramp[0]);
   }
  }
  localPixel(g,o,-7,1,14,3,ramp[0]);return;
 }
 // Kelp: a thin stipe with broad, stepped alternating blades and a visible holdfast.
 const stipeHeight=height,stipe=[];
 for(let j=0;j<=stipeHeight;j+=3){
  const drift=Math.sin(j*.058+seed*.41)*(2.5+j*.052*(flow/60))+swayBase*j*.055;
  stipe.push({u:drift,v:-j});
  if(stipe.length>1){
   const p=stipe[stipe.length-2];
   localLine(g,o,p.u,p.v,drift,-j,3.2,'#1c3028');
   localLine(g,o,p.u,p.v,drift,-j,1.7,j%12<6?ramp[0]:ramp[1]);
  }
 }
 for(let j=12,index=0;j<stipeHeight-5;j+=14,index++){
  const p=stipe[Math.min(stipe.length-1,Math.round(j/3))],side=((index+seed)&1)?1:-1;
  const bladeLen=16+(noise(index,17,seed)%13),bladeWidth=4+(noise(index,21,seed)%4);
  for(let k=0;k<bladeLen;k+=2){
   const t=k/bladeLen,curve=Math.sin(t*Math.PI)*bladeWidth*side;
   const u=p.u+side*k*.38+curve,v=p.v-k*.58-Math.sin(t*Math.PI)*3;
   const w=Math.max(2,Math.round((1-Math.abs(t-.52)*1.25)*bladeWidth));
   localPixel(g,o,u-1,v+1,w+2,3,'#1c3028');
   localPixel(g,o,u,v,w,2,k%6<3?ramp[2]:ramp[1]);
   localPixel(g,o,u-side*Math.max(1,w/2),v,1,1,ramp[0]);
   if(k%8===0)localPixel(g,o,u+side,v-1,1,1,ramp[3]);
  }
 }
 // Crown blade breaks the repeated ladder-like silhouette of the old renderer.
 const top=stipe[stipe.length-1];
 for(let k=0;k<Math.min(30,height*.35);k+=2){
  const u=top.u+Math.sin(k*.22+seed)*5+swayBase*k*.2,v=top.v-k*.82;
  const crownW=5+Math.round(Math.sin(k*.17)**2*4);
  localPixel(g,o,u-1,v+1,crownW+2,3,'#1c3028');
  localPixel(g,o,u,v,crownW,2,k%6<3?ramp[2]:ramp[1]);
 }
 localPixel(g,o,-6,0,4,3,ramp[0]);localPixel(g,o,2,0,5,3,ramp[0]);localPixel(g,o,-2,2,4,2,ramp[1]);
}

export function drawAquaticBase(g,s){
 const h=habitatConfig(s),p=h.palette,seed=s.seed%991;
 drawAquaticBackground(g,{kind:h.id,palette:p,seed});
 // Reuse the established irregular, textured stone renderer, then add habitat-specific epibionts.
 for(let i=0;i<h.rocks;i++){
  const x=22+noise(i,2,seed)%340,y=30+noise(i,4,seed)%370,rockScale=h.tides?2.3+(i%3)*.6:.8+(i%3)*.5;
  drawStone(g,{x,y,scale:rockScale,variant:i%4,seed:i+31});
  if(h.tides){
   drawAquaticDetail(g,{kind:'barnacle',x,y,scale:.72+(i%3)*.08,seed:seed+i*37,count:7+i%5});
   if(i%2===0)drawAquaticDetail(g,{kind:'limpet',x:x+10,y:y+9,scale:.7,seed:seed+i*41,count:2+i%3});
  }
 }
 if(h.wood){
  drawBark(g,{x:168,y:247,a:.43,scale:1.06,variant:2,seed:57});drawMossPatch(g,{x:62,y:125,rx:34,ry:55,seed:11,alpha:.7});
  for(let i=0;i<6;i++)drawLeaf(g,{x:60+i*49,y:85+(i*71)%285,a:i*.8,scale:.48,variant:i%6,seed:32+i,tone:2});
  for(let i=0;i<5;i++){const n=noise(i,135,seed);drawAquaticDetail(g,{kind:'detritus',x:36+n%310,y:90+(n>>>9)%305,scale:.72+(i%3)*.08,seed:seed+i*29,count:6+i%4})}
 }
 if(h.id==='shallow-marine'){
  for(let i=0;i<7;i++){const n=noise(i,143,seed);drawAquaticDetail(g,{kind:'shellgrit',x:28+n%330,y:92+(n>>>10)%310,scale:.72+(i%2)*.12,seed:seed+i*43,count:8+i%6})}
 }
 // Extra gravel and organic fragments add depth without introducing image assets.
 for(let i=0;i<Math.round(s.detritus*2.4);i++){const n=noise(i,8,seed);pixel(g,n%380,(n>>>10)%426,1+i%3,1,p[3])}
 if(!h.wood)for(let i=0;i<14;i++){const n=noise(i,77,seed);pixel(g,n%380,(n>>>9)%426,2+i%2,1,i%3?p[2]:p[3])}
}

export function plantAnchor(h,i){return {x:18+(i*83)%350,y:96+(i*97)%318}}

export function drawAquaticWater(g,s,time=0){
 const h=habitatConfig(s),surface=h.tides?Math.round(360-s.tide*3.35):0;
 // Water is transparent stippling with stepped ripples, never a smooth gradient.
 for(let y=surface;y<430;y+=4)for(let x=0;x<384;x+=4)if(noise(x,y)%4===0)pixel(g,x,y,2,1,'rgba(80,133,126,.13)');
 const rawCount=Math.max(3,Math.round(h.plants*(s.algae/70)));
 const count=h.id==='shallow-marine'?Math.max(6,Math.round(rawCount*.52)):h.id==='intertidal'?Math.max(4,Math.round(rawCount*.72)):rawCount;
 const kind=h.id==='freshwater'?'waterweed':h.id==='intertidal'?'rockweed':'kelp';
 for(let i=0;i<count;i++){
  const anchor=plantAnchor(h,i),baseHeight=h.id==='freshwater'?35+i%4*13:h.id==='intertidal'?22+i%4*8:60+i%5*15;
  drawAquaticPlant(g,{kind,x:anchor.x,y:anchor.y,a:(noise(i,55,s.seed)%9-4)*.025,scale:h.id==='shallow-marine'?.9+(i%3)*.08:.88+(i%2)*.08,seed:s.seed+i*19,height:baseHeight,time,flow:s.flow});
 }
 // Low seagrass and broad Ulva fans fill negative space without competing with the animals.
 if(h.id==='shallow-marine'){
  for(let i=0;i<8;i++){const n=noise(i,66,s.seed);drawAquaticPlant(g,{kind:'seagrass',x:18+n%350,y:118+(n>>>10)%285,scale:.62,seed:s.seed+i*31,height:24+i%3*8,time,flow:s.flow})}
  for(let i=0;i<4;i++){const n=noise(i,149,s.seed);drawAquaticPlant(g,{kind:'ulva',x:28+n%330,y:150+(n>>>11)%245,scale:.58+(i%2)*.08,seed:s.seed+i*47,height:30+i%3*7,time,flow:s.flow})}
 }
 if(h.tides){for(let x=0;x<384;x+=3){const y=surface+Math.round(Math.sin(x*.07+time)*3);pixel(g,x,y,3,1,'#9db9a4');if(x%12===0)pixel(g,x+2,y+5,5,1,'#6f948b')}}
 const particles=30+Math.round(s.detritus*.5);for(let i=0;i<particles;i++){const n=noise(i,37,s.seed),x=(n%384+time*s.flow*.085)%384,y=surface+((n>>>12)%Math.max(1,430-surface));pixel(g,x,y,i%7===0?2:1,1,i%3?'#889a79':'#b1bc95')}
 if(s.light>45)for(let i=0;i<8;i++){const x=20+i*49+Math.round(Math.sin(time*.6+i)*5),y=35+(i*67)%340;pixel(g,x,y,18+i%3*6,1,'rgba(202,217,158,.23)');pixel(g,x+9,y+3,8,1,'rgba(202,217,158,.13)')}
}

export function stepAquatic(group,{state:s,time,dt,reduced}){
 const h=habitatConfig(s),speed=Math.min(64,Math.max(1,Number(globalThis.__ISOPODA_HABITAT_SPEED__)||1)),motionScale=reduced?.45:1;
 for(const a of group){if(stepInteraction(a,dt))continue;
  const slot=Math.floor((time+a.offset*.35)/7),mode=h.motion[(a.id+slot)%h.motion.length],swimming=mode==='swim'||mode==='drift';
  a.activity=mode;a.hidden=false;a.occlusion=0;a.posture=swimming?'swimming':mode==='cling'?'probing':'normal';a.molt='none';a.moving=mode!=='cling';
  a.phase+=dt*speed*(swimming?8:mode==='crawl'?4:2.4)*motionScale;
  const waterTop=h.tides?Math.max(25,355-s.tide*3.2):25;
  if(mode==='cling'){
   const target=plantAnchor(h,a.id%Math.max(1,h.plants)),rate=dt*.28*motionScale;
   a.x+=(target.x-a.x)*rate;a.y+=(Math.max(waterTop+8,target.y-22)-a.y)*rate;
   a.a+=Math.sin(time*.42+a.offset)*dt*.08*motionScale;
   continue;
  }
  const flow=s.flow/100,rate=mode==='swim'?11:mode==='drift'?6.5:3.4;
  const steer=(Math.sin(time*.31+a.offset)+Math.sin(time*.13+a.id))*dt*(swimming?.34:.18)*motionScale;
  a.a+=steer;
  const nx=a.x+(Math.cos(a.a)*rate+flow*(swimming?2.5:1.4))*dt*speed*motionScale;
  const ny=a.y+(Math.sin(a.a)*rate+(mode==='drift'?Math.sin(time*.72+a.offset)*.7:0))*dt*speed*motionScale;
  if(nx<=20||nx>=362)a.a=Math.PI-a.a;
  if(ny<=waterTop||ny>=405)a.a=-a.a;
  a.x=Math.max(20,Math.min(362,nx));a.y=Math.max(waterTop,Math.min(405,ny));
 }
}
