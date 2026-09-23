import {stepInteraction} from '../interaction.mjs';
import {habitatConfig} from '../habitats.mjs';
import {drawStone} from './stone.mjs';
import {drawBark} from './bark.mjs';
import {drawLeaf} from './leaf.mjs';
import {drawMossPatch} from './moss.mjs';
import {layoutForHabitat} from './authored-layouts.mjs';

const noise=(x,y,seed=0)=>{let n=Math.imul(x+seed+1,374761393)^Math.imul(y+1,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
const pixel=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};

export const AQUATIC_BACKDROPS=Object.freeze({
 freshwater:{palette:['#273b32','#344439','#4e5140','#68634b'],water:'#31564f',accent:'#81906a'},
 intertidal:{palette:['#324743','#405552','#69736a','#9b9880'],water:'#456b67',accent:'#aab59b'},
 'shallow-marine':{palette:['#203e3d','#355452','#6d7660','#969375'],water:'#315e5a',accent:'#a7ad83'},
 abyssal:{palette:['#10181b','#172225','#223033','#343d3f'],water:'#17272b',accent:'#667374'}
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
 // Greens stay inside the existing muted palette, but vegetation gets its own hue/value lane.
 // The darkest tone is a green shadow, not a black outline.
 if(kind==='waterweed')return ['#365640','#55794f','#7f9b65','#b0ba7b'];
 if(kind==='rockweed')return ['#3d5535','#647344','#8b9258','#b6ad70'];
 if(kind==='seagrass')return ['#365b46','#5d805e','#89a670','#bbc58b'];
 if(kind==='ulva')return ['#294638','#3f5f43','#59754b','#7b8d5b'];
 return ['#405733','#667646','#8d9353','#b8ae6c'];
}

function plantSway(kind,j,height,time,seed,flow,phase=0){
 const t=Math.max(0,Math.min(1,j/Math.max(1,height)));
 // Smooth cantilever profile: roots remain fixed while the flexible upper body carries most motion.
 const flex=t*t*(3-2*t);
 const current=Math.max(.34,Math.min(1.18,(Number(flow)||45)/58));
 const profile={
  waterweed:{amp:8.5,speed:.66,ripple:.28},
  rockweed:{amp:5.4,speed:.43,ripple:.20},
  seagrass:{amp:11.5,speed:.74,ripple:.20},
  ulva:{amp:7.2,speed:.52,ripple:.24},
  kelp:{amp:13.5,speed:.39,ripple:.30}
 }[kind]||{amp:8,speed:.5,ripple:.22};
 const basePhase=seed*.071+phase;
 const broad=Math.sin(time*profile.speed+basePhase);
 // A slower second current keeps the motion from reading as a mechanical pendulum.
 const undertow=Math.sin(time*profile.speed*.57+basePhase*1.73+j*.016);
 // A small travelling wave makes neighbouring stem segments lag behind each other.
 const ripple=Math.sin(time*profile.speed*1.24+basePhase*.63+j*.052);
 return profile.amp*current*flex*(broad*.68+undertow*.22+ripple*profile.ripple);
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

export function drawAquaticPlant(g,{kind='waterweed',x=0,y=0,a=0,scale=1,seed=0,height=64,time=0,flow=45,motion=1}={}){
 const ramp=plantRamp(kind),o={x,y,a,scale};

 if(kind==='waterweed'){
  const stems=2+(seed%2);
  for(let stem=0;stem<stems;stem++){
   const baseU=(stem-(stems-1)/2)*6,stemHeight=height*(.78+(noise(stem,3,seed)%23)/100);
   let prev={u:baseU,v:1};
   for(let j=0;j<=stemHeight;j+=3){
    const staticDrift=Math.sin(j*.075+seed*.31+stem*.85)*(1.8+j*.045*(flow/70));
    const drift=staticDrift+plantSway('waterweed',j,stemHeight,time,seed,flow,stem*.58)*motion;
    const cur={u:baseU+drift,v:-j};
    localLine(g,o,prev.u,prev.v,cur.u,cur.v,1.4,j%12<6?ramp[0]:ramp[1]);
    prev=cur;
    if(j>7&&j%10<3){
     const side=((Math.floor(j/10)+stem+seed)&1)?1:-1,leaf=7+(noise(j,stem,seed)%6);
     // Leaves are compact tapered clusters rather than dark outlined sticks.
     const lu=cur.u+side*2,lv=cur.v-1;
     localPixel(g,o,side>0?lu:lu-4,lv,4,2,ramp[1]);
     localPixel(g,o,side>0?cur.u+side*4:cur.u+side*4-5,cur.v-3,5,2,ramp[2]);
     localPixel(g,o,side>0?cur.u+side*(leaf-1):cur.u+side*(leaf-1)-3,cur.v-5,3,2,ramp[2]);
     localPixel(g,o,cur.u+side*leaf,cur.v-5,1,1,ramp[3]);
    }
   }
  }
  localPixel(g,o,-5,1,11,3,ramp[0]);
  localPixel(g,o,-3,0,6,1,ramp[2]);
  return;
 }

 if(kind==='rockweed'){
  const branches=4+(seed%3);
  for(let b=0;b<branches;b++){
   const side=b-(branches-1)/2,len=height*(.58+(noise(b,9,seed)%35)/100),bend=side*4+Math.sin(seed+b)*3;
   const midSway=plantSway('rockweed',len*.46,len,time,seed,flow,b*.47)*motion;
   const tipSway=plantSway('rockweed',len,len,time,seed,flow,b*.47)*motion;
   const midU=bend*.38+midSway,tipU=bend+tipSway;
   localLine(g,o,0,0,midU,-len*.46,2,ramp[0]);
   localLine(g,o,midU,-len*.46,tipU,-len,2,ramp[b%2?1:2]);
   for(let k=1;k<4;k++){
    const t=k/4,dir=(side<0?-1:1),u=bend*t+plantSway('rockweed',len*t,len,time,seed,flow,b*.47)*motion+dir*(3+k),v=-len*t;
    // Short overlapping olive-green fronds form readable pixel clusters.
    const frondW=5+k%2;
    localPixel(g,o,dir>0?u-1:u-frondW+1,v+1,frondW,2,ramp[0]);
    localPixel(g,o,dir>0?u:u-frondW,v,frondW,3,ramp[k===2?2:1]);
    localPixel(g,o,dir>0?u+3+k%2:u-4-k%2,v-1,2,1,ramp[3]);
   }
   // Rounded air bladder at the tip.
   localPixel(g,o,tipU-2,-len-2,5,4,ramp[1]);
   localPixel(g,o,tipU-1,-len-3,3,2,ramp[2]);
   localPixel(g,o,tipU,-len-3,1,1,ramp[3]);
  }
  localPixel(g,o,-7,0,14,4,ramp[0]);
  localPixel(g,o,-4,-1,8,2,ramp[1]);
  return;
 }

 if(kind==='seagrass'){
  const blades=6+(seed%4);
  for(let b=0;b<blades;b++){
   const u=(b-(blades-1)/2)*3,len=height*(.58+(noise(b,13,seed)%42)/100);
   const naturalLean=Math.sin(seed*.2+b)*7;
   const middle=u*.62+naturalLean*.28+plantSway('seagrass',len*.58,len,time,seed,flow,b*.41)*motion;
   const tip=u+naturalLean+plantSway('seagrass',len,len,time,seed,flow,b*.41)*motion;
   localLine(g,o,u,1,middle,-len*.58,1.7,b%3===0?ramp[0]:ramp[1]);
   localLine(g,o,middle,-len*.58,tip,-len,1.8,b%3===0?ramp[2]:ramp[1]);
   if(b%2===0)localPixel(g,o,tip,-len,1,2,ramp[3]);
  }
  localPixel(g,o,-8,1,16,3,ramp[0]);
  localPixel(g,o,-5,0,10,1,ramp[2]);
  return;
 }

 if(kind==='ulva'){
  // Sea lettuce: deliberately irregular pixel mass, closer to the earlier noisy aquatic style.
  const fans=3+(seed%3);
  for(let f=0;f<fans;f++){
   const side=f-(fans-1)/2;
   const fanHeight=height*(.62+(noise(f,19,seed)%32)/100);
   const lean=side*5+((noise(f,23,seed)%7)-3);
   for(let j=0;j<fanHeight;j+=2){
    const t=j/fanHeight;
    const baseWidth=Math.max(3,Math.round((Math.sin(t*Math.PI)*8+3)*(1-t*.16)));
    const wobble=((noise(f,j+11,seed)%5)-2);
    const center=lean*t+Math.sin(j*.12+seed+f)*2+plantSway('ulva',j,fanHeight,time,seed,flow,f*.53)*motion;
    const width=Math.max(2,baseWidth+wobble);
    const left=center-width/2+((noise(f,j+17,seed)%3)-1);

    // Broken, mottled clusters instead of clean horizontal bands.
    const roll=noise(f,j+31,seed)%12;
    const tone=roll<3?ramp[1]:roll<10?ramp[2]:ramp[3];
    localPixel(g,o,left,-j,width,2,tone);

    // Darker internal chips plus a muted olive midtone add depth without making the plant glow.
    if(noise(f,j+41,seed)%2===0)localPixel(g,o,left-1,-j+1,2,1,ramp[0]);
    if(width>5&&noise(f,j+43,seed)%3===0)localPixel(g,o,left+2+(noise(f,j+47,seed)%(width-4)),-j,1,1,ramp[0]);
    if(width>4&&noise(f,j+53,seed)%6===0)localPixel(g,o,left+1+(noise(f,j+59,seed)%(width-2)),-j-1,2,1,'#687a50');
    if(width>3&&noise(f,j+67,seed)%5===0)localPixel(g,o,left+Math.max(1,Math.floor(width*.35)),-j+1,2,1,ramp[1]);
    if(noise(f,j+61,seed)%9===0)localPixel(g,o,left+width-1,-j+1,2,1,ramp[3]);
   }
  }
  // Uneven holdfast instead of a neat rectangular base.
  localPixel(g,o,-7,1,6,2,ramp[0]);
  localPixel(g,o,0,0,7,3,ramp[1]);
  localPixel(g,o,-3,-1,5,1,ramp[2]);
  return;
 }

 // Kelp: thin stipe + broad alternating ribbon blades. The blade mass, not a dark outline,
 // carries the silhouette; shadows use the same green family as the rest of the plant.
 const stipeHeight=height,stipe=[];
 for(let j=0;j<=stipeHeight;j+=3){
  const staticDrift=Math.sin(j*.055+seed*.41)*(2.2+j*.046*(flow/60));
  const drift=staticDrift+plantSway('kelp',j,stipeHeight,time,seed,flow)*motion;
  stipe.push({u:drift,v:-j});
  if(stipe.length>1){
   const p=stipe[stipe.length-2];
   localLine(g,o,p.u,p.v,drift,-j,1.6,j%15<7?ramp[0]:ramp[1]);
  }
 }
 for(let j=12,index=0;j<stipeHeight-7;j+=15,index++){
  const p=stipe[Math.min(stipe.length-1,Math.round(j/3))],side=((index+seed)&1)?1:-1;
  const bladeLen=18+(noise(index,17,seed)%13),bladeWidth=5+(noise(index,21,seed)%4);
  for(let k=0;k<bladeLen;k+=2){
   const t=k/bladeLen;
   const arc=Math.sin(t*Math.PI);
   const centerU=p.u+side*(k*.45+arc*bladeWidth*.55);
   const centerV=p.v-k*.46-arc*3;
   const w=Math.max(3,Math.round((2+arc*bladeWidth)*(1-t*.22)));
   // A lower-side shadow and two larger color clusters suggest a folded ribbon.
   localPixel(g,o,centerU-side*1,centerV+1,w,2,ramp[0]);
   localPixel(g,o,centerU,centerV,w,2,(index+k/2)%3===0?ramp[1]:ramp[2]);
   if(k>3&&k<bladeLen-4&&k%6===0)localPixel(g,o,centerU+side*Math.max(1,Math.floor(w*.22)),centerV-1,2,1,ramp[3]);
  }
 }
 // Terminal blade is shorter and fuller to break the old ladder-like repetition.
 const top=stipe[stipe.length-1],crownLen=Math.min(25,height*.3);
 for(let k=0;k<crownLen;k+=2){
  const t=k/crownLen,arc=Math.sin(t*Math.PI),u=top.u+Math.sin(k*.2+seed)*3+plantSway('kelp',stipeHeight+k*.35,stipeHeight+crownLen*.35,time,seed,flow,.31)*motion,v=top.v-k*.72;
  const w=4+Math.round(arc*6);
  localPixel(g,o,u-1,v+1,w,2,ramp[0]);
  localPixel(g,o,u,v,w,2,k%6<3?ramp[2]:ramp[1]);
  if(k%8===0)localPixel(g,o,u+Math.floor(w*.35),v-1,1,1,ramp[3]);
 }
 localPixel(g,o,-7,1,5,3,ramp[0]);
 localPixel(g,o,1,1,6,3,ramp[0]);
 localPixel(g,o,-3,0,7,2,ramp[1]);
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
 const debrisDots=h.id==='abyssal'?Math.round(s.detritus*.55):Math.round(s.detritus*2.4);for(let i=0;i<debrisDots;i++){const n=noise(i,8,seed);pixel(g,n%380,(n>>>10)%426,1+i%3,1,p[3])}
 if(!h.wood)for(let i=0;i<14;i++){const n=noise(i,77,seed);pixel(g,n%380,(n>>>9)%426,2+i%2,1,i%3?p[2]:p[3])}
}

const anchorCache=new Map();
function authoredPlantAnchors(h){
 if(anchorCache.has(h.id))return anchorCache.get(h.id);
 const layout=layoutForHabitat(h.id),anchors=(layout.objects||[]).filter(o=>o.params?.kind).map(o=>({x:o.x,y:o.y}));
 anchorCache.set(h.id,anchors);return anchors;
}
export function plantAnchor(h,i){
 const anchors=authoredPlantAnchors(h);
 if(anchors.length)return anchors[((i%anchors.length)+anchors.length)%anchors.length];
 return {x:18+(i*83)%350,y:96+(i*97)%318};
}

export function drawAquaticWater(g,s,time=0,{drawPlants=true}={}){
 const h=habitatConfig(s),surface=h.tides?Math.round(360-s.tide*3.35):0;
 // Water is transparent stippling with stepped ripples, never a smooth gradient.
 for(let y=surface;y<430;y+=4)for(let x=0;x<384;x+=4)if(noise(x,y)%4===0)pixel(g,x,y,2,1,'rgba(80,133,126,.13)');
 if(drawPlants&&h.plants>0){
  const rawCount=Math.max(3,Math.round(h.plants*(s.algae/70)));
  const count=h.id==='shallow-marine'?Math.max(6,Math.round(rawCount*.52)):h.id==='intertidal'?Math.max(4,Math.round(rawCount*.72)):rawCount;
  const kind=h.id==='freshwater'?'waterweed':h.id==='intertidal'?'rockweed':'kelp';
  for(let i=0;i<count;i++){
   const anchor=plantAnchor(h,i),baseHeight=h.id==='freshwater'?35+i%4*13:h.id==='intertidal'?22+i%4*8:60+i%5*15;
   drawAquaticPlant(g,{kind,x:anchor.x,y:anchor.y,a:(noise(i,55,s.seed)%9-4)*.025,scale:h.id==='shallow-marine'?.9+(i%3)*.08:.88+(i%2)*.08,seed:s.seed+i*19,height:baseHeight,time,flow:s.flow});
  }
  if(h.id==='shallow-marine'){
   for(let i=0;i<8;i++){const n=noise(i,66,s.seed);drawAquaticPlant(g,{kind:'seagrass',x:18+n%350,y:118+(n>>>10)%285,scale:.62,seed:s.seed+i*31,height:24+i%3*8,time,flow:s.flow})}
   for(let i=0;i<3;i++){const n=noise(i,149,s.seed);drawAquaticPlant(g,{kind:'ulva',x:28+n%330,y:150+(n>>>11)%245,scale:.52+(i%2)*.06,seed:s.seed+i*47,height:28+i%3*6,time,flow:s.flow})}
  }
 }
 if(h.tides){for(let x=0;x<384;x+=3){const y=surface+Math.round(Math.sin(x*.07+time)*3);pixel(g,x,y,3,1,'#9db9a4');if(x%12===0)pixel(g,x+2,y+5,5,1,'#6f948b')}}
 const abyssal=h.id==='abyssal',particles=abyssal?14+Math.round(s.detritus*.18):30+Math.round(s.detritus*.5),drift=abyssal?time*s.flow*.022:time*s.flow*.085;for(let i=0;i<particles;i++){const n=noise(i,37,s.seed),x=(n%384+drift)%384,y=surface+((n>>>12)%Math.max(1,430-surface));pixel(g,x,y,i%9===0?2:1,1,abyssal?(i%3?'#46595d':'#607176'):(i%3?'#889a79':'#b1bc95'))}
 if(s.light>45)for(let i=0;i<8;i++){const x=20+i*49+Math.round(Math.sin(time*.6+i)*5),y=35+(i*67)%340;pixel(g,x,y,18+i%3*6,1,'rgba(202,217,158,.23)');pixel(g,x+9,y+3,8,1,'rgba(202,217,158,.13)')}
}

export function stepAquatic(group,{state:s,time,dt,reduced}){
 const h=habitatConfig(s),speed=Math.min(64,Math.max(1,Number(globalThis.__ISOPODA_HABITAT_SPEED__)||1)),motionScale=(reduced?.45:1)*(h.motionScale??1);
 for(const a of group){if(stepInteraction(a,dt))continue;
  const slot=Math.floor((time+a.offset*.35)/7),mode=h.motion[(a.id+slot)%h.motion.length],swimming=mode==='swim'||mode==='drift';
  // makeIndividuals() stores .68 × species pace × slight individual variance.
  // Normalize the shared .68 base here so the habitat mode constants stay readable.
  const cruisePace=Math.max(.55,Math.min(1.45,(Number(a.speed)||.68)/.68));
  const modePace=Math.max(0,Math.min(1.5,Number(a.locomotion?.modeScale?.[mode]??1)));
  const specimenPace=cruisePace*modePace;
  a.activity=mode;a.hidden=false;a.occlusion=0;a.posture=swimming?'swimming':mode==='cling'?'probing':'normal';a.molt='none';a.moving=mode!=='cling';
  a.phase+=dt*speed*specimenPace*(swimming?8:mode==='crawl'?4:2.4)*motionScale;
  const waterTop=h.tides?Math.max(25,355-s.tide*3.2):25;
  if(mode==='cling'){
   const target=plantAnchor(h,a.id%Math.max(1,h.plants)),rate=dt*.28*specimenPace*motionScale;
   a.x+=(target.x-a.x)*rate;a.y+=(Math.max(waterTop+8,target.y-22)-a.y)*rate;
   a.a+=Math.sin(time*.42+a.offset)*dt*.08*specimenPace*motionScale;
   continue;
  }
  const flow=s.flow/100,rate=mode==='swim'?11:mode==='drift'?6.5:3.4;
  const steer=(Math.sin(time*.31+a.offset)+Math.sin(time*.13+a.id))*dt*(swimming?.34:.18)*specimenPace*motionScale;
  a.a+=steer;
  const nx=a.x+(Math.cos(a.a)*rate+flow*(swimming?2.5:1.4))*dt*speed*specimenPace*motionScale;
  const ny=a.y+(Math.sin(a.a)*rate+(mode==='drift'?Math.sin(time*.72+a.offset)*.7:0))*dt*speed*specimenPace*motionScale;
  if(nx<=20||nx>=362)a.a=Math.PI-a.a;
  if(ny<=waterTop||ny>=405)a.a=-a.a;
  a.x=Math.max(20,Math.min(362,nx));a.y=Math.max(waterTop,Math.min(405,ny));
 }
}
