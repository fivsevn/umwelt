import {kelpGeometry,drawKelp} from './kelp-geometry.mjs';
import {stepPetri} from './petri.mjs';
import {stepSand,sandShore} from './sandy-surf.mjs';
import {isIntertidal} from '../data/narrative/intertidal.mjs';
import {intertidalSurface,stepIntertidal,drawIntertidalLife} from './intertidal.mjs';
import {stepGroundwater,drawGroundwaterWater} from './groundwater.mjs';
import {WATER_BACKGROUNDS,drawWaterBackground,drawWaterDetail,drawWaterPlant} from './aquatic-materials.mjs';
import {LAUNCH_BACKGROUNDS,drawLaunchBackground} from './launch-materials.mjs';
import {stepInteraction} from '../interaction.mjs';
import {habitatConfig} from '../habitats.mjs';
import {drawStone} from './stone.mjs';
import {drawBark} from './bark.mjs';
import {drawLeaf} from './leaf.mjs';
import {drawMossPatch} from './moss.mjs';
import {layoutForHabitat} from './authored-layouts.mjs';
import {freshwaterLayout} from './freshwater-stages.mjs';

const noise=(x,y,seed=0)=>{let n=Math.imul(x+seed+1,374761393)^Math.imul(y+1,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
const pixel=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};

// Large water-body stipple is visually static between state changes. Cache those
// transparent pixels and keep only foam, particles and ripples on the live frame.
const waterLayerCache=new Map();
function staticWaterLayer(key,draw,limit=16){
 if(typeof document==='undefined')return null;
 let canvas=waterLayerCache.get(key);
 if(canvas){waterLayerCache.delete(key);waterLayerCache.set(key,canvas);return canvas}
 canvas=document.createElement('canvas');canvas.width=384;canvas.height=430;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;draw(ctx);
 waterLayerCache.set(key,canvas);
 if(waterLayerCache.size>limit)waterLayerCache.delete(waterLayerCache.keys().next().value);
 return canvas;
}

export const AQUATIC_BACKDROPS=Object.freeze({
 freshwater:{palette:['#273b32','#344439','#4e5140','#68634b'],water:'#31564f',accent:'#81906a'},
 groundwater:{palette:['#111716','#202724','#64675d','#aaa793'],water:'#263d3b',accent:'#c1bda5'},
 intertidal:{palette:['#324743','#405552','#69736a','#9b9880'],water:'#456b67',accent:'#aab59b'},
 'sandy-surf':{palette:['#3b625f','#6f8576','#a99b73','#d0bd8a'],water:'#356762',accent:'#e0d4a4'},
 estuary:{palette:['#3d4135','#4e5140','#68644d','#8f8263'],water:'#385750',accent:'#a89a70'},
 'shallow-marine':{palette:['#203e3d','#355452','#6d7660','#969375'],water:'#315e5a',accent:'#a7ad83'},
 abyssal:{palette:['#10181b','#172225','#223033','#343d3f'],water:'#17272b',accent:'#667374'},
 'petri-dish':{palette:['#202925','#53615b','#a6ad9b','#d8d8c3'],water:'#667f76',accent:'#e4e1c9'}
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
 if(kind==='saltmarsh')return ['#3a452f','#59613b','#7b7b4d','#a39a63'];
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
  saltmarsh:{amp:6.2,speed:.34,ripple:.12},
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
 if(['barnacle','limpet','detritus'].includes(kind))return drawWaterDetail(g,{kind,x,y,a,scale,seed,count});
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
 if(LAUNCH_BACKGROUNDS.has(kind))return drawLaunchBackground(g,{kind,seed});
 if(WATER_BACKGROUNDS.has(kind))return drawWaterBackground(g,{kind,seed});
}

const coastalPlantBuffers=new WeakMap();
export function drawAquaticPlant(g,options={}){
 if(options.layered&&options.kind==='kelp')return drawKelp(g,kelpGeometry(options,{time:options.time||0,motion:options.motion??1}));
 // As with the larger marine plants, apply the world shadow once per plant,
 // not thousands of times to its individual pixels (particularly costly in WebKit).
 if(!['seagrass','saltmarsh','ulva'].includes(options.kind)||typeof g.drawImage!=='function')return paintAquaticPlant(g,options);
 const {x=0,y=0,scale=1,height=64}=options,r=Math.ceil((height+42)*scale+16),size=r*2+2;
 let buffer=coastalPlantBuffers.get(g);
 if(!buffer){
  if(typeof OffscreenCanvas==='function')buffer=new OffscreenCanvas(size,size);
  else if(typeof document!=='undefined'){buffer=document.createElement('canvas');buffer.width=size;buffer.height=size}
  else return paintAquaticPlant(g,options);
  coastalPlantBuffers.set(g,buffer);
 }
 if(buffer.width<size||buffer.height<size){buffer.width=size;buffer.height=size}
 const ctx=buffer.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,buffer.width,buffer.height);ctx.imageSmoothingEnabled=false;
 ctx.setTransform(1,0,0,1,r-Math.round(x),r-Math.round(y));
 paintAquaticPlant(ctx,options);
 g.imageSmoothingEnabled=false;g.drawImage(buffer,Math.round(x)-r,Math.round(y)-r);
}
function paintAquaticPlant(g,{kind='waterweed',x=0,y=0,a=0,scale=1,seed=0,height=64,time=0,flow=45,motion=1}={}){
 const ramp=plantRamp(kind),o={x,y,a,scale};

 if(['waterweed','rockweed','kelp'].includes(kind))return drawWaterPlant(g,{kind,x,y,a,scale,seed,height,time,flow,motion},(j,len,phase)=>plantSway(kind,j,len,time,seed,flow,phase)*motion);

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

 if(kind==='saltmarsh'){
  // Fine stems, folded blades, ochre seed heads and a ragged fibrous crown.
  const blades=11+(seed%4);
  for(let b=0;b<blades;b++){
   const q=noise(b,151,seed),u=(b-(blades-1)/2)*1.45,len=height*(.42+(q%54)/100);
   const lean=(b-(blades-1)/2)*2.1+((q>>>9)%9)-4;
   let lastX=u,lastY=2;
   for(let j=2;j<=len;j+=2){
    const t=j/len,xx=u+lean*t*t+plantSway('saltmarsh',j,len,time,seed,flow,b*.37)*motion;
    const width=t<.28?3:t<.77?2:1;
    localLine(g,o,lastX,lastY,xx,-j,width,b%3===0?ramp[1]:ramp[0]);
    if(t>.15&&t<.86)localPixel(g,o,xx,-j,1,2,(b+j)%5===0?ramp[3]:ramp[2]);
    if(j===Math.floor(len*.5/2)*2&&b%3!==0){
     const side=b%2?1:-1;
     localLine(g,o,xx,-j,xx+side*8,-j-9,2,ramp[1]);
     localLine(g,o,xx+side*8,-j-9,xx+side*12,-j-16,1,ramp[2]);
    }
    lastX=xx;lastY=-j;
   }
   if(b%4===0){for(let k=0;k<8;k++){localPixel(g,o,lastX+(k%3===0?-1:0),lastY+k,2,1,k%3?'#8c8655':'#b0a16a')}}
  }
  for(let i=0;i<12;i++){const q=noise(i,163,seed),u=-12+q%25,v=(q>>>9)%5;localLine(g,o,u,v,u+(q%7)-3,v+3,1,i%3===0?'#8b7a50':ramp[0])}
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
function authoredPlantAnchors(h,state=null){
 const freshwater=h.id==='freshwater',stage=freshwater?(Number.isInteger(state?.scene?.materialStage)?state.scene.materialStage:0):null,key=freshwater?`freshwater:${stage}`:h.id;
 if(anchorCache.has(key))return anchorCache.get(key);
 const layout=freshwater?freshwaterLayout(stage):layoutForHabitat(h.id),anchors=(layout.objects||[]).filter(o=>o.params?.kind).map(o=>({x:o.x,y:o.y}));
 anchorCache.set(key,anchors);return anchors;
}
export function plantAnchor(h,i,state=null){
 const anchors=authoredPlantAnchors(h,state);
 if(anchors.length)return anchors[((i%anchors.length)+anchors.length)%anchors.length];
 return {x:18+(i*83)%350,y:96+(i*97)%318};
}


function freshwaterObjects(s){
 const objects=freshwaterLayout(s).objects||[];
 const by=prefix=>objects.filter(o=>String(o.type).startsWith(prefix));
 return {
  leaves:by('leaf-').sort((a,b)=>(b.scale||1)-(a.scale||1)),
  plants:objects.filter(o=>o.params?.kind==='waterweed'),
  debris:objects.filter(o=>o.type==='freshwater-detritus-01'),
  stones:by('stone-'),
  wood:by('bark-')
 };
}
function freshwaterReactionPlan(id,s,actor,time){
 const o=freshwaterObjects(s),pick=(list,index=0)=>list.length?list[Math.abs(index)%list.length]:null;
 const offset=(base,dx=0,dy=0)=>base?{x:base.x+dx,y:base.y+dy}:null;
 if(['fw-edge','fw-route','fw-surface','fw-relate-surface'].includes(id)){
  const leaf=pick(o.leaves,actor.id),side=actor.id%2?1:-1;
  return {target:offset(leaf,side*18,(actor.id%3-1)*7),posture:id==='fw-surface'||id==='fw-relate-surface'?'feeding':'probing',stop:true,activity:'crawl'};
 }
 if(['fw-under','fw-gap'].includes(id)){
  const leaf=pick(o.leaves,0);return {target:offset(leaf,(actor.id%2?9:-9),14),posture:'emerging',stop:true,occlusion:.48,activity:'crawl'};
 }
 if(['fw-new-edges','fw-use-fragments'].includes(id)){
  const leaf=pick(o.leaves,actor.id+1)||pick(o.debris,actor.id);
  return {target:offset(leaf,(actor.id%2?7:-7),actor.id%3*4),posture:id==='fw-use-fragments'?'feeding':'probing',stop:true,activity:'crawl'};
 }
 if(id==='fw-cling'){
  const target=pick(o.plants.length?o.plants:o.stones,actor.id);return {target:offset(target,0,-10),posture:'probing',stop:true,activity:'cling'};
 }
 if(['fw-cross-bed','fw-new-route'].includes(id)){
  const target=pick(o.debris,actor.id+2)||pick(o.stones,actor.id);return {target:offset(target,(actor.id%2?16:-16),actor.id%3*5),posture:'normal',stop:false,activity:'crawl'};
 }
 return null;
}
function drawFreshwaterObservationOverlay(g,s,time,effect){
 if(!effect||!String(effect.id).startsWith('fw-'))return;
 const id=effect.id,o=freshwaterObjects(s),pulse=.45+.35*Math.sin(time*4),mark=(x,y,c='rgba(208,205,166,.72)')=>{pixel(g,x-4,y,3,1,c);pixel(g,x+2,y,3,1,c);pixel(g,x,y-4,1,3,c);pixel(g,x,y+2,1,3,c)};
 const leaf=o.leaves[0],origin={x:249,y:234};
 if(['fw-mark-leaf','fw-name-leaf'].includes(id)&&leaf){
  const rx=Math.max(18,Math.round(24*(leaf.scale||1))),ry=Math.max(12,Math.round(16*(leaf.scale||1))),c=`rgba(208,205,166,${pulse})`;
  for(let x=-rx;x<=rx;x+=7){pixel(g,leaf.x+x,leaf.y-ry,3,1,c);pixel(g,leaf.x+x,leaf.y+ry,3,1,c)}
  for(let y=-ry;y<=ry;y+=7){pixel(g,leaf.x-rx,leaf.y+y,1,3,c);pixel(g,leaf.x+rx,leaf.y+y,1,3,c)}
  mark(leaf.x,leaf.y,c);
 }
 if(id==='fw-link-fragments'&&o.leaves.length){
  const center=o.leaves.reduce((a,b)=>({x:a.x+b.x/o.leaves.length,y:a.y+b.y/o.leaves.length}),{x:0,y:0});
  for(const leafPart of o.leaves){const steps=9;for(let i=0;i<=steps;i+=2){const t=i/steps;pixel(g,center.x+(leafPart.x-center.x)*t,center.y+(leafPart.y-center.y)*t,2,1,`rgba(208,205,166,${pulse})`)}} 
 }
 if(id==='fw-fragment'&&leaf)mark(leaf.x,leaf.y,`rgba(208,205,166,${pulse})`);
 if(id==='fw-drift'){
  for(let i=0;i<4;i++){const n=noise(i,397,s.seed),x=(n%420+time*(4.5+s.flow*.035))%420-18,y=55+((n>>>10)%320)+Math.sin(time*.42+i)*4;mark(x,y,`rgba(208,205,166,${pulse})`)}
 }
 if(id==='fw-redistribute')for(const d of o.debris.slice(0,5))mark(d.x,d.y,`rgba(169,180,139,${pulse})`);
 if(id==='fw-track-displacement'){
  const target=o.leaves[0]||o.debris[0]||origin;for(let i=0;i<=16;i+=2){const t=i/16;pixel(g,origin.x+(target.x-origin.x)*t,origin.y+(target.y-origin.y)*t,2,1,`rgba(208,205,166,${pulse})`)}mark(origin.x,origin.y);
 }
 if(id==='fw-origin'){
  mark(origin.x,origin.y,`rgba(208,205,166,${pulse})`);for(const d of o.debris.slice(0,3))mark(d.x,d.y,'rgba(169,180,139,.58)');
 }
 if(id==='fw-boundary'&&o.debris.length){
  const cx=o.debris.reduce((n,d)=>n+d.x,0)/o.debris.length,cy=o.debris.reduce((n,d)=>n+d.y,0)/o.debris.length,c=`rgba(208,205,166,${pulse})`;
  for(let a=0;a<Math.PI*2;a+=.35)pixel(g,cx+Math.cos(a)*58,cy+Math.sin(a)*34,2,1,c);
 }
}

export function drawAquaticWater(g,s,time=0,{drawPlants=true,observationEffect=null}={}){
 const h=habitatConfig(s),surface=isIntertidal(s)?Math.round(intertidalSurface(s)):h.tides?Math.round(360-s.tide*3.35):0;
 if(h.id==='groundwater'){drawGroundwaterWater(g,s,time,pixel);return}
 if(h.id==='petri-dish'){
  const cx=192,cy=215,r=143,drift=time*s.flow*.025;
  for(let i=0;i<24;i++){
   const n=noise(i,277,s.seed),a=(n%628)/100,rr=18+((n>>>9)%116),x=cx+Math.cos(a)*rr+Math.sin(time*.23+i)*drift,y=cy+Math.sin(a)*rr;
   pixel(g,x,y,i%7===0?2:1,1,i%5===0?'rgba(223,221,195,.32)':'rgba(120,145,134,.22)');
  }
  const rr=24+Math.sin(time*.8)*4;for(let x=-rr;x<=rr;x+=5)pixel(g,cx+x,cy-44+Math.sin(x*.18+time)*1.5,3,1,'rgba(196,207,184,.16)');
  return;
 }
 if(h.id==='sandy-surf'){
  const shore=Math.round(sandShore(s,time));
  const drawBody=target=>{for(let y=shore;y<430;y+=4)for(let x=0;x<384;x+=4)if(noise(x,y,s.seed)%3!==0)pixel(target,x,y,4,2,'rgba(48,105,99,.18)')};
  const body=staticWaterLayer(`sandy:${s.seed}:${shore}`,drawBody);
  if(body&&typeof g.drawImage==='function')g.drawImage(body,0,0);else drawBody(g);
  // Three broken swash/foam bands; gaps prevent the shoreline from reading as a UI divider.
  for(let band=0;band<3;band++){
   const by=shore+band*8+Math.sin(time*.8+band)*3;
   for(let x=2;x<382;x+=11){
    const n=noise(x,band+281,s.seed);if(n%5===0)continue;
    const y=by+Math.sin(x*.045+time*.9+band)*2.5;
    pixel(g,x,y,5+(n%8),band===0?2:1,band===0?'rgba(229,221,184,.72)':'rgba(197,207,174,.36)');
   }
  }
  for(let i=0;i<20;i++){const n=noise(i,283,s.seed),x=(n%384+time*s.flow*.04)%384,y=shore+8+((n>>>10)%Math.max(1,420-shore));pixel(g,x,y,1+(n%2),1,'rgba(196,205,169,.26)')}
  return;
 }
 if(h.id==='estuary'){
  // Tide changes glints and suspended matter inside the authored river-mouth shape,
  // without laying a horizontal water sheet over the mudflat.
  const level=(s.tide-50)/50;
  for(let i=0;i<28;i++){
   const n=noise(i,289,s.seed),y=70+(n>>>10)%340,t=(y-20)/410,center=384*(.43+.17*t)+Math.sin((y+s.seed)*.023)*22,half=10+13*t+74*t*t;
   const x=center-half+(n%(Math.max(4,Math.floor(half*2))));
   pixel(g,x,y,2+(i%3),1,i%5===0?'rgba(177,187,146,.26)':'rgba(91,131,118,.15)');
  }
  if(level>.25)for(let y=335;y<430;y+=9)pixel(g,110+Math.sin(y*.03+time)*8,y,260,1,'rgba(149,165,130,.10)');
  return;
 }
 // Water is transparent stippling with stepped ripples, never a smooth gradient.
 const drawBody=target=>{for(let y=surface;y<430;y+=4)for(let x=0;x<384;x+=4)if(noise(x,y)%4===0)pixel(target,x,y,2,1,'rgba(80,133,126,.13)')};
 const body=staticWaterLayer(`water:${surface}`,drawBody);
 if(body&&typeof g.drawImage==='function')g.drawImage(body,0,0);else drawBody(g);
 if(drawPlants&&h.plants>0){
  const rawCount=Math.max(3,Math.round(h.plants*(s.algae/70)));
  const count=h.id==='shallow-marine'?Math.max(6,Math.round(rawCount*.52)):h.id==='intertidal'?Math.max(4,Math.round(rawCount*.72)):h.id==='estuary'?Math.max(5,Math.round(rawCount*.68)):rawCount;
  const kind=h.id==='freshwater'?'waterweed':h.id==='intertidal'?'rockweed':h.id==='estuary'?'saltmarsh':'kelp';
  for(let i=0;i<count;i++){
   const anchor=plantAnchor(h,i,s),baseHeight=h.id==='freshwater'?35+i%4*13:h.id==='intertidal'?22+i%4*8:h.id==='estuary'?42+i%4*9:60+i%5*15;
   drawAquaticPlant(g,{kind,x:anchor.x,y:anchor.y,a:(noise(i,55,s.seed)%9-4)*.025,scale:h.id==='shallow-marine'?.9+(i%3)*.08:h.id==='estuary'?.66+(i%3)*.07:.88+(i%2)*.08,seed:s.seed+i*19,height:baseHeight,time,flow:s.flow});
  }
  if(h.id==='shallow-marine'){
   for(let i=0;i<8;i++){const n=noise(i,66,s.seed);drawAquaticPlant(g,{kind:'seagrass',x:18+n%350,y:118+(n>>>10)%285,scale:.62,seed:s.seed+i*31,height:24+i%3*8,time,flow:s.flow})}
   for(let i=0;i<3;i++){const n=noise(i,149,s.seed);drawAquaticPlant(g,{kind:'ulva',x:28+n%330,y:150+(n>>>11)%245,scale:.52+(i%2)*.06,seed:s.seed+i*47,height:28+i%3*6,time,flow:s.flow})}
  }
 }
 if(h.tides){for(let x=0;x<384;x+=3){const y=surface+Math.round(Math.sin(x*.07+time)*3);pixel(g,x,y,3,1,'#9db9a4');if(x%12===0)pixel(g,x+2,y+5,5,1,'#6f948b')}}
 const abyssal=h.id==='abyssal',freshwaterStage=h.id==='freshwater'?(Number.isInteger(s.scene?.materialStage)?s.scene.materialStage:0):-1,particles=abyssal?14+Math.round(s.detritus*.18):30+Math.round(s.detritus*.5)+(freshwaterStage===3?28:0),drift=abyssal?time*s.flow*.022:time*s.flow*.085;for(let i=0;i<particles;i++){const n=noise(i,37,s.seed),x=(n%384+drift)%384,y=surface+((n>>>12)%Math.max(1,430-surface));pixel(g,x,y,i%9===0?2:1,1,abyssal?(i%3?'#46595d':'#607176'):(i%3?'#889a79':'#b1bc95'))}
 if(freshwaterStage===3){for(let i=0;i<9;i++){const n=noise(i,397,s.seed),x=(n%420+time*(4.5+s.flow*.035))%420-18,y=55+((n>>>10)%320)+Math.sin(time*.42+i)*4,w=3+(n%6);pixel(g,x,y,w,2,i%3===0?'#6b5738':'#806846');if(i%2===0)pixel(g,x+1,y-1,Math.max(1,w-2),1,'#9a8155')}}
 if(s.light>45)for(let i=0;i<8;i++){const x=20+i*49+Math.round(Math.sin(time*.6+i)*5),y=35+(i*67)%340;pixel(g,x,y,18+i%3*6,1,'rgba(202,217,158,.23)');pixel(g,x+9,y+3,8,1,'rgba(202,217,158,.13)')}
 if(isIntertidal(s))drawIntertidalLife(g,s,time,pixel);
 if(h.id==='freshwater')drawFreshwaterObservationOverlay(g,s,time,observationEffect);
}

export function stepAquatic(group,{state:s,time,dt,reduced,reaction}){
 const h=habitatConfig(s),speed=Math.min(64,Math.max(1,Number(globalThis.__ISOPODA_HABITAT_SPEED__)||1)),motionScale=(reduced?.45:1)*(h.motionScale??1);
 if(isIntertidal(s)){stepIntertidal(group,{state:s,dt,reduced,speed});return}
 if(h.id==='petri-dish'){stepPetri(group,{state:s,time,dt,reduced});return}
 if(h.id==='sandy-surf'){stepSand(group,{state:s,time,dt,reduced});return}
 if(h.id==='groundwater'){stepGroundwater(group,{state:s,dt,reduced,speed});return}
 for(const a of group){if(stepInteraction(a,dt))continue;
  const custom=h.id==='freshwater'&&reaction?.selected?.includes(a.id)&&reaction.age<7?freshwaterReactionPlan(reaction.id,s,a,time):null;
  if(custom?.target){const dx=custom.target.x-a.x,dy=custom.target.y-a.y,dist=Math.hypot(dx,dy),arrived=dist<10,pace=(custom.activity==='drift'?8:4.8)*Math.max(.65,Math.min(1.4,(Number(a.speed)||.68)/.68))*motionScale;a.a=Math.atan2(dy,dx);a.moving=custom.stop? !arrived:dist>4;a.activity=custom.activity;a.posture=arrived?custom.posture:'normal';a.occlusion=arrived?(custom.occlusion||0):0;a.hidden=false;a.molt='none';a.phase+=dt*speed*(custom.activity==='drift'?7:4)*motionScale;if(a.moving&&dist>0){const travel=Math.min(dist,pace*dt*speed);a.x+=dx/dist*travel;a.y+=dy/dist*travel}a.x=Math.max(20,Math.min(362,a.x));a.y=Math.max(25,Math.min(405,a.y));continue}
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
   const target=plantAnchor(h,a.id%Math.max(1,h.plants),s),rate=dt*.28*specimenPace*motionScale;
   a.x+=(target.x-a.x)*rate;a.y+=(Math.max(waterTop+8,target.y-22)-a.y)*rate;
   a.a+=Math.sin(time*.42+a.offset)*dt*.08*specimenPace*motionScale;
   continue;
  }
  if(h.id==='abyssal'){
   const dx=(a.x-192)/64,dy=(a.y-215)/84,r=Math.hypot(dx,dy);
   if(r>.72&&Math.cos(a.a)*dx+Math.sin(a.a)*dy>0){const target=Math.atan2(215-a.y,192-a.x),turn=Math.atan2(Math.sin(target-a.a),Math.cos(target-a.a));a.a+=Math.sign(turn)*Math.min(Math.abs(turn),dt*speed*.7)}
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
