import {kelpGeometry,kelpDepth,surfacePoint} from './kelp-geometry.mjs';
import {stepInteraction} from '../interaction.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const turn=(a,target,dt)=>a+clamp(Math.atan2(Math.sin(target-a),Math.cos(target-a)),-dt*2.4,dt*2.4);
export function createSeaweedBed(items){
 const plants=items.filter(o=>o.layered&&o.kind==='kelp');
 const order=new Map(plants.map((p,i)=>[p.id,i]));
 const scenery=plants.filter(o=>o.interactive===false).map(item=>kelpGeometry(item));
 return {items:plants.filter(o=>o.interactive!==false),scenery,order,sceneryMask:kelpDepth(scenery,384,430,null,null,scenery.map(p=>order.get(p.id))),mask:null,bends:new Map(),held:null,frame:null,events:{attached:0,crossed:0,hidden:0,reappeared:0,plucked:0},time:0};
}
export function seaweedFrame(bed,{time=bed.time,flow=46,reduced=false}={}){
 bed.time=time;
 const moving=bed.items.map(item=>kelpGeometry(item,{time,flow,motion:reduced?.18:1,bend:bed.bends.get(item.id)||0}));
 const plants=[...bed.scenery,...moving].sort((a,b)=>bed.order.get(a.id)-bed.order.get(b.id));
 bed.mask=kelpDepth(moving,384,430,bed.mask,bed.sceneryMask,moving.map(p=>bed.order.get(p.id)));
 return bed.frame={plants,byId:new Map(plants.map(p=>[p.id,p])),mask:bed.mask};
}
export function beginSeaweedHold(bed,plant,point){bed.held={id:plant.id,x:point.x,initial:bed.bends.get(plant.id)||0,reacted:false};}
export function moveSeaweedHold(bed,point){if(bed.held)bed.bends.set(bed.held.id,clamp(bed.held.initial+(point.x-bed.held.x)*.9,-38,38))}
export function endSeaweedHold(bed){const moved=bed.held&&Math.abs((bed.bends.get(bed.held.id)||0)-bed.held.initial)>2;bed.held=null;if(moved)bed.events.plucked++;return moved}
export function stageSeaweed(group,bed){
 const plants=bed.frame.plants.filter(p=>p.item.interactive!==false).sort((a,b)=>a.item.y-b.item.y||a.item.x-b.item.x);
 group.forEach((a,i)=>{
  const plant=plants[Math.round(i*(plants.length-1)/Math.max(1,group.length-1))];if(!plant)return;
  const surface=1+(i*3)%Math.max(1,plant.surfaces.length-1),t=.35+(i%3)*.14;
  a.weed={plant:plant.id,surface,t,face:i%4===3?-1:1,mode:'cling',age:0,wait:3+i*.9,travel:null,visible:true};
  const p=surfacePoint(plant.surfaces[surface],t);a.x=p.x;a.y=p.y;a.a=p.a;a.depth=plant.z+a.weed.face*.25;a.occlusion=0;a.hidden=false;
 });
}
function closestSurface(frame,a,exclude=null,group=[]){
 let best=null;
 for(const plant of frame.plants){if(plant.item.interactive===false||plant.id===exclude)continue;for(let surface=1;surface<plant.surfaces.length;surface++)for(const t of [.25,.6,.85]){
  const p=surfacePoint(plant.surfaces[surface],t),distance=Math.hypot(p.x-a.x,p.y-a.y);
  // Spread arrivals across leaves instead of converging on the same nearest point.
  const penalty=group.reduce((n,o)=>n+(o!==a&&Math.hypot(o.x-p.x,o.y-p.y)<26?24:0),0);
  if(!best||distance+penalty<best.score)best={plant:plant.id,surface,t,p,distance,score:distance+penalty};
 }}return best;
}
export function stepSeaweed(group,bed,{time,dt,reduced,flow=46}){
 const pace=reduced?.55:1;
 for(const [id,bend] of bed.bends)if(bed.held?.id!==id){const next=bend*Math.exp(-dt*2.2);if(Math.abs(next)<.04)bed.bends.delete(id);else bed.bends.set(id,next)}
 seaweedFrame(bed,{time,flow,reduced});
 const held=bed.held;
 if(held&&!held.reacted&&Math.abs((bed.bends.get(held.id)||0)-held.initial)>6){
  held.reacted=true;
  // A brief authored disturbance cue, not a model of animal emotion.
  const attached=group.filter(a=>a.weed?.plant===held.id&&!a.interactionState&&a.weed.mode!=='transfer'&&time-(a.weed.lastStartle??-Infinity)>6);
  attached.slice(0,2).forEach((a,i)=>{const w=a.weed;w.lastStartle=time;w.startleUntil=time+.6;w.escape=i===0;w.cue=i===0?'!':'?';w.mode='cling';w.age=0;w.wait=5});
 }
 for(const a of group){
  const w=a.weed;if(!w)continue;
  if(a.interactionState){
   const mode=a.interactionState.mode;
   if(mode==='grabbed'){w.mode='released';w.travel=null;a.depth=200}
   if(stepInteraction(a,dt)){
    if(w.mode!=='released'){const plant=bed.frame.byId.get(w.plant),p=surfacePoint(plant.surfaces[w.surface],w.t);a.x=p.x;a.y=p.y;a.a=p.a}continue;
   }
  }
  w.age+=dt*pace;a.hidden=false;a.occlusion=0;a.molt='none';a.phase+=dt*4*pace;
  if(w.mode==='released'){
   const target=closestSurface(bed.frame,a,null,group);if(target){w.mode='transfer';w.travel={...target,start:{x:a.x,y:a.y},age:0,duration:Math.max(1,target.distance/14),depth:a.depth};}else continue;
  }
  let plant=bed.frame.byId.get(w.plant);
  if(w.mode==='transfer'){
   const travel=w.travel,targetPlant=bed.frame.byId.get(travel.plant),end=surfacePoint(targetPlant.surfaces[travel.surface],travel.t);
   travel.age+=dt*pace;const t=clamp(travel.age/travel.duration,0,1),smooth=t*t*(3-2*t);
   const nx=travel.start.x+(end.x-travel.start.x)*smooth,ny=travel.start.y+(end.y-travel.start.y)*smooth-Math.sin(t*Math.PI)*Math.min(8,travel.distance*.12);
   a.a=turn(a.a,Math.atan2(ny-a.y,nx-a.x),dt*pace);a.x=nx;a.y=ny;a.depth=travel.depth+(targetPlant.z+.25-travel.depth)*t;
   a.activity=travel.distance<14?'crawl':'swim';a.posture=travel.distance<14?'normal':'swimming';a.moving=true;
   if(t>=1){w.plant=travel.plant;w.surface=travel.surface;w.t=travel.t;w.face=1;w.mode='cling';w.travel=null;w.age=0;w.wait=4+(a.id%4);bed.events.crossed++;bed.events.attached++}
   continue;
  }
  if(!plant)continue;
  if(w.startleUntil){
   const p=surfacePoint(plant.surfaces[w.surface],w.t);a.x=p.x;a.y=p.y;
   if(time<w.startleUntil){a.posture='tucked';a.activity='cling';a.moving=false;continue}
   w.startleUntil=0;
   if(w.escape){const target=closestSurface(bed.frame,a,plant.id,group);if(target&&target.distance<90){w.mode='transfer';w.travel={...target,start:{x:a.x,y:a.y},age:0,duration:Math.max(1.2,target.distance/22),depth:a.depth};w.escape=false;continue}}
   w.escape=false;
  }
  if(w.mode==='cling'&&w.age>w.wait){w.mode='crawl';w.age=0;w.direction=w.t>.45?-1:1}
  if(w.mode==='crawl'){
   w.t=clamp(w.t+dt*.10*pace*w.direction,.1,.9);
   if(w.age>3.2){
    const p=surfacePoint(plant.surfaces[w.surface],w.t);a.x=p.x;a.y=p.y;
    const target=closestSurface(bed.frame,a,plant.id,group);
    if(target&&target.distance<80&&Math.abs((bed.bends.get(plant.id)||0))<27){
     w.mode='transfer';w.travel={...target,start:{x:a.x,y:a.y},age:0,duration:Math.max(1.2,target.distance/(a.species==='maculosa'?7:13)),depth:a.depth};
    }else{w.mode='cling';w.age=0;w.wait=3.5}
   }
  }
  const p=surfacePoint(plant.surfaces[w.surface],w.t);a.x=p.x;a.y=p.y;a.a=turn(a.a,p.a+(w.direction===-1?Math.PI:0),dt*pace);a.depth=plant.z+w.face*.25;
  a.moving=w.mode==='crawl';a.activity=a.moving?'crawl':'cling';a.posture=a.moving?'normal':'probing';
 }
}
export function noteSeaweedVisibility(bed,actor,visible,total){
 const w=actor.weed;if(!w)return;
 const seen=visible>0;
 if(w.visible&&!seen)bed.events.hidden++;
 if(!w.visible&&seen)bed.events.reappeared++;
 w.visible=seen;w.visiblePixels=visible;w.totalPixels=total;
}
