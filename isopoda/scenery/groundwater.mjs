import {stepInteraction} from '../interaction.mjs';
import {GROUNDWATER_OBSERVATIONS,groundwaterObservationIndex} from '../data/habitats/groundwater-observation.mjs';
export const CAVE_WET_PATCHES=[[199,94],[192,132],[205,232],[186,318]];
// Authored wet-surface paths are illustrative, never measured animal speeds or hidden tunnels.
export function stageGroundwater(group,state){
 const index=groundwaterObservationIndex(state),focus=GROUNDWATER_OBSERVATIONS[index].focus;
 for(const a of group){
  a.caveTime=(a.id===0?0:(a.seed%100)/10);a.caveObservation=index;
  const patch=CAVE_WET_PATCHES[(a.id+3)%CAVE_WET_PATCHES.length];
  a.caveAnchor=a.id===0?focus:[patch[0]+((a.seed>>>3)%13)-6,patch[1]+((a.seed>>>8)%13)-6];
 }
 stepGroundwater(group,{state,dt:0,reduced:false,speed:1});
}
export function stepGroundwater(group,{state,dt,reduced=false,speed=1}){
 const index=groundwaterObservationIndex(state);
 if(group.some(a=>a.caveObservation!==index||!a.caveAnchor))stageGroundwater(group,state);
 for(const a of group){
  if(a.interactionState){a.caveDisplaced=true;if(stepInteraction(a,dt))continue}
  // Released animals resume gradually; grabbing never snaps them back to a path.
  const previous={x:a.x,y:a.y};
  a.caveTime+=dt*speed*(reduced?.65:1);
  const t=a.caveTime,focus=a.id===0,[cx,cy]=a.caveAnchor;
  // Asynchronous crawl/pause cycles; antenna and gait phases continue during a pause.
  const cycle=t%18,travel=cycle<6?cycle:cycle<9?6:cycle<15?cycle-3:12;
  const angle=travel*Math.PI/6+(focus?0:a.offset),rx=focus?10:6+a.id%5,ry=focus?18:9+a.id%7;
  a.x=cx+Math.sin(angle)*rx;a.y=cy+Math.cos(angle)*ry;
  a.a=Math.atan2(-Math.sin(angle)*ry,Math.cos(angle)*rx);
  a.moving=cycle<6||(cycle>=9&&cycle<15);a.activity='crawl';a.posture=a.moving?'normal':'probing';a.molt='none';a.hidden=false;a.occlusion=0;
  a.phase+=dt*speed*(reduced?.65:1)*3;
  if(focus&&[1,7].includes(index)){
   // Retreat behind this same stone lip, then emerge at the same opening.
   const q=(1-Math.cos(t*Math.PI/12))/2;
   a.x=cx+3;a.y=cy+18-q*24;a.a=-Math.PI/2;a.occlusion=Math.max(0,(q-.45)/.55)*.92;
   a.posture='emerging';a.activity='under';a.moving=true;
  }
  if(index===5&&cycle>=6&&cycle<9)a.posture='probing';
  if(a.caveDisplaced){
   const dx=a.x-previous.x,dy=a.y-previous.y,distance=Math.hypot(dx,dy),step=dt*speed*7;
   if(distance>step){a.x=previous.x+dx/distance*step;a.y=previous.y+dy/distance*step;a.a=Math.atan2(dy,dx);a.moving=true;a.posture='normal';a.occlusion=0}
   else a.caveDisplaced=false;
  }
 }
}
export function drawGroundwaterWater(g,s,time,pixel){
 const index=groundwaterObservationIndex(s),seep=(s.seepage??36)/100,linked=index>=2&&index<=5;
 if(linked){
  // The visible water connection is distinct from the player's dashed inferred route.
  for(let y=149;y<215;y+=3){const x=193+(y-149)*.16;pixel(g,x,y,2,3,'rgba(114,154,147,.22)')}
 }
 for(const [j,[cx,cy]] of CAVE_WET_PATCHES.entries()){
  for(let i=0;i<3;i++){
   const phase=time*(.22+seep*.85)+i+j,yy=cy-14+i*13;
   for(let x=-10;x<=10;x+=4)pixel(g,cx+x,yy+Math.sin(phase+x*.25)*2,linked?3:2,1,`rgba(170,185,164,${.08+seep*.15})`);
  }
 }
 if(index>=2)for(let i=0;i<9;i++){
  const y=203+(i*7+time*seep*7)%52;pixel(g,200+(i*11)%13,y,1,1,'rgba(166,171,147,.45)');
 }
 if(index>=4)for(let i=0;i<14;i++){
  const y=252+(i*13+time*seep*5)%76;pixel(g,183+(i*17)%25,y,2,1,i%3?'#625b45':'#8a7e5c');
 }
 // A modest patch of attached material, not an illustration of identifiable microbes.
 if(index>=4)for(let i=0;i<12;i++)pixel(g,179+(i*7)%25,312+(i*11)%16,2,1,'rgba(107,102,68,.35)');
}
