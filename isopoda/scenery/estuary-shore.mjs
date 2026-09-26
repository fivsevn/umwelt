import {shoreFaunaSnapshot,SHORE_FAUNA_RULES} from '../data/habitats/shore-fauna.mjs';
import {shoreFrontOffset,shoreMarineFraction} from '../data/habitats/shore-hydrology.mjs';
import {SHORE_LAYOUTS} from './authored-shore-layouts.mjs';
import {stepInteraction} from '../interaction.mjs';
import {materialInk} from './grammar.mjs';
import {shorePoint,shoreTide,shoreRain,shoreIndex} from '../data/habitats/estuary-shore.mjs';
const px=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
const noise=(x,y,s=57)=>{let n=Math.imul(x+s,374761393)^Math.imul(y+1,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
// Three distinct banks share the same tidal excursion, not the same terrain.
export const shoreHeight=tide=>[246,194,296,336][tide];
export function shoreLine(x,point=1,tide=0,level=shoreHeight(tide)){
 if(point===0)return level+18-x*.12+Math.sin(x*.015)*28;
 if(point===2)return level-30-x*.48+Math.sin(x*.014)*12;
 return level-x*.27+Math.sin((x-45)*.017)*31+48*smooth((x-245)/110);
}
export function shoreWalkPose(point,direction){
 const x=direction<0?46:338;
 const y=shoreLine(x,point,1)-38;
 const slope=(shoreLine(x+2,point,1)-shoreLine(x-2,point,1))/4;
 return {x,y,angle:Math.atan2(slope,1)+(direction<0?Math.PI:0)};
}
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export const shoreWaterBlend=shoreMarineFraction;
export const shoreWaterType=(x,y,point,tide=0,rain=false)=>shoreWaterBlend(x,y,point,tide,rain)<.5?'fresh':'sea';
function farBank(g,point,seed){
 if(point!==0)return;
 // Cropped foreground bank, using the same rounded soil patches as the far shore.
 for(let x=222;x<384;x+=2)for(let y=370;y<430;y+=2){
  const edge=426-(x-222)*.23+Math.sin(x*.033)*4+Math.sin(x*.081)*3;
  if(y<edge)continue;
  const d=y-edge,u=x-190,v=y-310;
  const broad=Math.sin(u*.031+Math.sin(v*.023))*Math.cos(v*.042)+Math.sin((u+v)*.018)*.45;
  const rim=d+Math.sin(x*.12+y*.07)*2;
  const color=rim<4?'#82816a':rim<10?'#77775e':broad<-.58?'#565e4a':broad>.74?'#7a755c':'#6d6b54';
  px(g,x,y,2,2,materialInk(color,x,y,seed,'soil'));
 }
}
// Cache the fixed intermediate inks; no continuous interpolation per pixel.
const shoreHalfInks=new Map();
function shoreHalfInk(a,b){
 const key=a+b;if(!shoreHalfInks.has(key))shoreHalfInks.set(key,'#'+[1,3,5].map(i=>Math.round((parseInt(a.slice(i,i+2),16)+parseInt(b.slice(i,i+2),16))/2).toString(16).padStart(2,'0')).join(''));
 return shoreHalfInks.get(key);
}
export function drawShoreBackground(g,{point=1,tide=0,rain=false,seed=467,level=shoreHeight(tide),front=shoreFrontOffset(tide,rain)}={}){
 const soils=[['#566044','#697154','#414f3c'],['#74715a','#858064','#575d48'],['#969076','#aaa084','#7c8067']][point];
 for(let y=0;y<430;y+=2)for(let x=0;x<384;x+=2){
  const edge=shoreLine(x,point,tide,level),distance=y-edge,q=noise(x>>1,y>>1,seed+point*53);
  // The same rounded humus-island grammar as the woodland substrate.
  const u=x+point*41,v=y+point*29;
  const broad=Math.sin(u*.031+Math.sin(v*.023))*Math.cos(v*.042)+Math.sin((u+v)*.018)*.45;
  const patch=Math.sin(Math.floor(x/8)*.73+Math.floor(y/6)*.51)*.22+Math.sin(x*.11-y*.15)*.12;
  const wet=y>shoreLine(x,point,1)-12;
  let color=broad<-.58?soils[2]:broad>.74?soils[1]:soils[0];
  if(distance<0){
   if(wet&&y-shoreLine(x,point,1)+12+patch*12>8){
    const wetSoils=point===2?['#85816c','#918971','#70765e']:['#6d6b54','#7a755c','#565e4a'];
    color=wetSoils[broad<-.58?2:broad>.74?1:0];
   }
   // Damp silt approaches the water in two discrete, gently broken shelves.
   const rim=distance+Math.sin(x*.085)*3+patch*4;
   if(rim>-15)color=point===2?(rim>-6?'#898770':'#817f67'):(rim>-6?'#82816a':'#77775e');
   // Root-dark hollows, branching mud tongues, or broad parallel sand runnels.
   if(point===0&&y<170&&Math.abs(x-(84+Math.sin(y*.027)*23+y*.28))<3+Math.sin(y*.09)*2)color='#46563e';
   if(point===1&&Math.abs(x-(140+Math.sin(y*.024)*58))<2+Math.sin(y*.07)&&y>100&&y<220)color='#595f50';
   if(point===2&&wet&&Math.sin(y*.19+x*.07+Math.sin(x*.04))>.9&&q%4)color='#938d75';
   if(q%31===0)color=wet?'#999073':soils[1];
  }else{
   // Opaque color shelves with broken edges, rather than stacked gradients.
   const sea=shoreWaterBlend(x,y,point,tide,rain,front),d=distance+patch*20+Math.sin(x*.07-y*.04)*7;
   const band=d<7?0:d<17?1:d<31?2:d<49?3:d<72?4:d<100?5:6;
   const fresh=rain?['#89866e','#828369','#797f64','#707b60','#64765b','#587056','#4c6852']:['#8c896e','#87876a','#808367','#778163','#6a7d5d','#587457','#486a53'];
   const marine=['#8b8d75','#839080','#779087','#6a8c85','#58827e','#447573','#32676b'];
   const mixed=['#8b896e','#82886e','#7a866d','#70836c','#617c66','#507562','#406e61'];
   const seam=sea+patch*.18;
   const bank=seam<.28?fresh:seam>.72?marine:mixed;
   color=seam>=.28&&seam<.43?shoreHalfInk(fresh[band],mixed[band]):seam>.57&&seam<=.72?shoreHalfInk(mixed[band],marine[band]):bank[band];
  }
  px(g,x,y,2,2,materialInk(color,x,y,seed+point*113,'soil'));
 }
 for(let i=0;i<145;i++){
  const q=noise(i,39,seed+point*13),x=q%384,y=(q>>>10)%430;
  if(y<shoreLine(x,point,tide,level))px(g,x,y,1+q%3,1,point===2?'#aaa287':i%4?'#60634c':'#aaa07a');
 }
 for(let x=5;x<380;x+=4){const y=shoreLine(x,point,1)-9;if(noise(x,3,point)%4)px(g,x,y,3,1,point===2?'#aca085':'#77775c')}
 farBank(g,point,seed);
}
export function shoreLayout(point=1,tide=0,rain=false){
 const layout=structuredClone(SHORE_LAYOUTS[point]);
 Object.assign(layout.background.params,{point,tide,rain});
 Object.assign(layout.metadata,{point,tide});
 layout.observationIndex=`shore-${point}-${tide}-${rain}`;
 return layout;
}
const shoreObject=(point,id)=>SHORE_LAYOUTS[point].objects.find(o=>o.id===id);
export const shoreLayoutFor=s=>shoreLayout(shorePoint(s),shoreTide(s),shoreRain(s));
// Seeded stop-and-go paths around real authored refuges. Pace is a game proxy.
export function stepShore(group,{state,time=0,dt=0,reduced=false,layout:editedLayout}){
 const point=shorePoint(state),layout=editedLayout||SHORE_LAYOUTS[point],t=time*(reduced?.65:1);
 const snapshot=shoreFaunaSnapshot(group,point,shoreIndex(state));
 const local=group.some(a=>a.species)?group.filter((a,i)=>snapshot[i].visible):group.slice(0,4);
 for(const [i,a] of group.entries()){
  a.hidden=!local.includes(a);if(a.hidden)continue;
  const slot=local.indexOf(a),seed=(a.seed??i)>>>0,id=a.species||'hookeri';
  const refuge=SHORE_FAUNA_RULES[id]?.refuge,mud=refuge==='mud',stone=refuge==='stone',algae=refuge==='algae';
  const candidates=layout.objects.filter(o=>stone?/stone/.test(o.type)&&o.y>shoreLine(o.x,point,1)-40:algae?/ulva|seagrass|sunken-wood/.test(o.type):mud?/mud-burrows|estuary-silt/.test(o.type)&&o.y>shoreLine(o.x,point,1)-25:/sunken-wood/.test(o.type));
  const shelter=candidates[(seed+slot)%Math.max(1,candidates.length)]||layout.objects.find(o=>o.id==='shore-wood')||shoreObject(point,'shore-wood');
  const key=String(point);
  if(a.shoreTrack?.key!==key)a.shoreTrack={key,dx:0,dy:0,clockOffset:0,lastTime:t};
  if(t<a.shoreTrack.lastTime)a.shoreTrack.clockOffset+=a.shoreTrack.lastTime;
  a.shoreTrack.lastTime=t;
  const clock=t+a.shoreTrack.clockOffset,period=(mud?17:stone?12:10)+(seed%7),phase=clock+(seed%71)*.31,cycle=Math.floor(phase/period),u=(phase%period)/period;
  const travel=mud?.36:stone?.56:.72,progress=smooth(Math.min(1,u/travel));
  const radius=mud?9:stone?15:algae?30:24;
  const target=n=>{const q=noise(n+1,slot+19,seed);return {x:shelter.x+((q%101)/50-1)*radius,y:shelter.y+10+((q>>>9)%101)/100*(mud?10:22)}};
  const from=target(cycle),to=target(cycle+1),x=from.x+(to.x-from.x)*progress,y=from.y+(to.y-from.y)*progress;
  if(a.interactionState){a.shoreTrack.dx=a.x-x;a.shoreTrack.dy=a.y-y;if(stepInteraction(a,dt))continue}
  a.x=Math.max(22,Math.min(360,x+a.shoreTrack.dx));a.y=Math.max(30,Math.min(407,y+a.shoreTrack.dy));
  a.a=Math.atan2(to.y-from.y,to.x-from.x);a.moving=u<travel;
  a.occlusion=mud?(a.moving?.18:.48):0;a.lift=0;a.posture=mud&&!a.moving?'buried':'normal';a.activity=a.moving?'crawl':'rest';
  a.phase=seed*.1+(a.moving?t*2.8:Math.floor(phase/period));a.habitatScale=1;
 }
}
function fish(g,x,y,dir=1,goby=false,t=0){
 const c=goby?'#899074':'#a2afa0',dark=goby?'#56634f':'#657e73',tail=Math.round(Math.sin(t*5)*1.5),fin=Math.round(Math.sin(t*4));
 px(g,x-5,y,11,2,dark);px(g,x-3,y-1,7,2,c);
 px(g,x-7*dir,y-1+tail,2,3,dark);px(g,x+4*dir,y,1,1,'#344b43');px(g,x-1,y+2+fin,3,1,dark);
}
// Available to deterministic motion checks as well as the live renderer.
export function shoreGoby(s,time=0){
 const point=shorePoint(s),phase=time*.5+point*.8,x=252+Math.sin(phase)*24;
 return {x,y:Math.max(shoreLine(x,point,shoreTide(s))+42,305)+Math.sin(time*.8)*2,dir:Math.cos(phase)<0?-1:1};
}
export function drawShoreWater(g,s,time=0,reduced=false,animalTime=time){
 const point=shorePoint(s),tide=shoreTide(s),t=time*(reduced?.65:1),dir=tide<2?-1:1,level=s.shoreLevel??shoreHeight(tide);
 // Shallow translucent water covers the lower portions of the fixed wood and stones.
 for(let x=0;x<384;x+=2){const y=shoreLine(x,point,tide,level);px(g,x,y,2,Math.max(1,430-Math.round(y)),'rgba(54,91,80,.07)')}
 for(let i=0;i<22;i++){
  const x=(i*67+dir*t*3+384)%384,y=shoreLine(x,point,tide,level)+14+(i*37)%171;
  px(g,x,y,4+i%5,1,'rgba(173,190,164,.27)');
 }
 for(let x=0;x<384;x+=6){if(noise(x,11,point)%3===0)continue;const y=shoreLine(x,point,tide,level)+Math.sin(t*.65+x*.025)*1.5;px(g,x,y,4,1,'rgba(178,190,153,.40)')}
 // Small schools pass intermittently; routes stay below the current shoreline.
 const life=animalTime*(reduced?.65:1),cycle=(life+point*4)%24;
 if(cycle<9){
  const x=410-cycle*48;
  for(let i=0;i<3;i++){const fx=x+i*21,fy=Math.max(shoreLine(fx,point,tide,level)+24,342+i*10)+Math.sin(life*.8+i)*2;if(fy<418)fish(g,fx,fy,-1,false,life+i);}
 }
 const goby=shoreGoby(s,life);fish(g,goby.x,goby.y,goby.dir,true,life);
 // Surface insects pause between short skates, leaving a broken wake.
 for(let i=0;i<2;i++){
  const phase=(life+i*5.3)%11,travel=Math.min(1,phase/2.4),x=90+i*125+Math.sin(travel*Math.PI*2)*12;
  const y=shoreLine(x,point,tide,level)+38+i*14;
  if(y<412){px(g,x,y,3,1,'#465b47');for(const side of [-1,1]){px(g,x-1,y+side*2,2,1,'#798e71');px(g,x+3,y+side*2,2,1,'#798e71');}if(phase<2.4){px(g,x-6,y-3,3,1,'#97a58b');px(g,x-6,y+3,3,1,'#97a58b');}}
 }
 // A few reed fragments drift with the current, always inside the shallow water.
 for(let i=0;i<3;i++){const x=(83+i*107+dir*t*2+384)%384,y=shoreLine(x,point,tide,level)+28+i*18;px(g,x,y,4,1,'#8b9472');px(g,x+2,y+1,2,1,'#546d56')}
 if(tide>=2){
  const hole=shoreObject(point,'shore-holes'),x=hole.x,y=hole.y;
  px(g,x,y,5,2,'#414b3c');
  if(life%18<12){const d=Math.sin((life%18)/12*Math.PI)*12;px(g,x+d,y-3,6,3,'#98906b');for(let i=0;i<3;i++){px(g,x+d-2,y-4+i*2+Math.round(Math.sin(life*5+i)),2,1,'#727657');px(g,x+d+6,y-4+i*2+Math.round(Math.sin(life*5+i)),2,1,'#727657')}}
  if(tide===3)for(let i=0;i<15;i++)px(g,207+i*2,238+Math.round(Math.sin(i*.6+life*.6)*2),1,1,'#545d49');
 }
 farBank(g,point,467);
}
