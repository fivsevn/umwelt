import {SHORE_LAYOUTS} from './authored-shore-layouts.mjs';
import {stepInteraction} from '../interaction.mjs';
import {materialInk} from './grammar.mjs';
import {shorePoint,shoreTide,shoreRain,shoreVisible} from '../data/habitats/estuary-shore.mjs';
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
const rgbCache=new Map();
function mix(a,b,t){
 const rgb=c=>{if(!rgbCache.has(c))rgbCache.set(c,[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)));return rgbCache.get(c)};
 const aa=rgb(a),bb=rgb(b),k=Math.round(Math.max(0,Math.min(1,t))*5)/5;
 return '#'+aa.map((v,i)=>Math.round(v+(bb[i]-v)*k).toString(16).padStart(2,'0')).join('');
}
export function shoreWaterBlend(x,y,point){
 const boundary=(point===0?326:point===2?35:192)+Math.sin(y*.022)*[30,61,24][point]+Math.sin(y*.009)*18;
 const eddy=Math.sin(x*.027+y*.018)*9+Math.sin(x*.011-y*.035)*7;
 return smooth(.5+(x-boundary+eddy)/100);
}
export const shoreWaterType=(x,y,point)=>shoreWaterBlend(x,y,point)<.5?'fresh':'sea';
function farBank(g,point,seed){
 if(point!==0)return;
 // Just the cropped tip of the opposite bank, never a second full landscape.
 for(let x=222;x<384;x+=2)for(let y=370;y<430;y+=2){
  const edge=426-(x-222)*.23+Math.sin(x*.033)*4;
  if(y<edge)continue;
  const d=y-edge,q=noise(x>>1,y>>1,seed);
  px(g,x,y,2,2,d<5?'#858569':d<13?'#5b6650':q%9<2?'#6d7655':'#485e47');
 }
}
export function drawShoreBackground(g,{point=1,tide=0,rain=false,seed=467,level=shoreHeight(tide)}={}){
 const soils=[['#566044','#697154','#414f3c'],['#74715a','#858064','#575d48'],['#969076','#aaa084','#7c8067']][point];
 for(let y=0;y<430;y+=2)for(let x=0;x<384;x+=2){
  const edge=shoreLine(x,point,tide,level),distance=y-edge,q=noise(x>>1,y>>1,seed+point*53);
  const broad=point===0?Math.sin(x*.042+y*.012)+Math.sin(y*.033):point===1?Math.sin(x*.022-y*.02)+Math.sin(y*.044+x*.008):Math.sin(y*.085+x*.029)*.7+Math.sin(x*.009)*.3;
  const wet=y>shoreLine(x,point,1)-12;
  let color=broad<0?mix(soils[0],soils[2],smooth(-broad/1.7)):mix(soils[0],soils[1],smooth(broad/1.7));
  if(distance<0){
   if(wet){const wetInk=point===2?mix('#757861','#85816c',smooth((broad+1)/2)):mix('#656550','#777159',smooth((broad+1)/2));color=mix(color,wetInk,smooth((y-shoreLine(x,point,1)+12)/30));}
   // Root-dark hollows, branching mud tongues, or broad parallel sand runnels.
   if(point===0&&y<170&&Math.abs(x-(84+Math.sin(y*.027)*23+y*.28))<3+Math.sin(y*.09)*2)color='#46563e';
   if(point===1&&Math.abs(x-(140+Math.sin(y*.024)*58))<2+Math.sin(y*.07)&&y>100&&y<220)color='#595f50';
   if(point===2&&wet&&Math.sin(y*.19+x*.07+Math.sin(x*.04))>.9&&q%4)color='#938d75';
   if(q%31===0)color=wet?'#999073':soils[1];
  }else{
   const sea=shoreWaterBlend(x,y,point),depth=smooth((distance+((q%7)-3))/105);
   const fresh=mix(rain?'#7c836b':'#858971',rain?'#677960':'#526e57',depth);
   const marine=mix('#73918a','#356a70',depth);
   color=mix(fresh,marine,sea);
   color=mix(point===2?'#85816c':'#777159',color,smooth(distance/10));
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
// Slow, legible travel around the shelter; the leading animal never disappears for a tide.
export function stepShore(group,{state,time=0,dt=0,reduced=false}){
 const point=shorePoint(state),tide=shoreTide(state),shelter=shoreObject(point,point===2?'shore-stone':'shore-wood'),anchor=[shelter.x,shelter.y],t=time*(reduced?.65:1);
 for(const [i,a] of group.entries()){
  const phase=t*.23+i*2.8+point*.45,rx=i?19:32,ry=i?6:10;
  const x=anchor[0]+Math.cos(phase)*rx,y=anchor[1]+16+Math.sin(phase)*ry+(i?12:0),key=point+':'+tide;
  if(a.shoreTrack?.key!==key)a.shoreTrack={key,dx:0,dy:0};
  if(a.interactionState){a.shoreTrack.dx=a.x-x;a.shoreTrack.dy=a.y-y;if(stepInteraction(a,dt))continue}
  a.hidden=i>1||(i===1&&tide<2);
  a.x=Math.max(24,Math.min(355,x+a.shoreTrack.dx));a.y=Math.max(30,Math.min(400,y+a.shoreTrack.dy));
  a.a=Math.atan2(Math.cos(phase)*ry,-Math.sin(phase)*rx);
  a.occlusion=0;a.lift=0;a.posture='normal';a.activity='crawl';a.moving=true;
  a.phase=(a.seed||i)*.1+t*3.2;a.habitatScale=1;
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
 // Long quiet gaps: one small school on incoming water; a resting goby on the ebb.
 const life=animalTime*(reduced?.65:1),cycle=life%32;
 if(tide<2&&point>0&&cycle<7){
  const x=410-cycle*48;
  for(let i=0;i<2;i++)fish(g,x+i*25,338+i*12+Math.sin(life*.8+i)*2,-1,false,life+i);
 }
 const goby=shoreGoby(s,life);fish(g,goby.x,goby.y,goby.dir,true,life);
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
