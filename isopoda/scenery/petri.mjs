import {petriIndex,PETRI_STEPS} from '../data/habitats/petri-observation.mjs';
export const DISH={x:192,y:215,radius:132};
export function microscope(s){
 const m=s.microscope??={mode:false,magnification:4,focus:28,light:65,x:192,y:215,moves:0,lights:0,completed:{}};
 m.completed??={};return m;
}
export const focusTarget=m=>m.magnification>=32?76:m.magnification>=16?68:m.magnification>=8?60:50;
export const isFocused=m=>Math.abs(m.focus-focusTarget(m))<=8;
export function checkMicroscope(s,visible=true){
 const m=microscope(s),i=petriIndex(s),gate=PETRI_STEPS[i][1];
 const ready=!gate||({enter:m.mode,focus:m.mode&&isFocused(m)&&visible,zoom:m.mode&&m.magnification>=8&&isFocused(m)&&visible,move:m.mode&&m.moves>=2&&visible,light:m.mode&&m.lights>=1&&m.light>=35&&m.light<=85,widen:m.mode&&m.magnification===4,return:!m.mode})[gate];
 if(ready)m.completed[i]=true;return !!m.completed[i];
}
export function petriReady(s){return !!microscope(s).completed[petriIndex(s)]||!PETRI_STEPS[petriIndex(s)][1]}
export function confinePetri(a){
 const dx=a.x-DISH.x,dy=a.y-DISH.y,d=Math.hypot(dx,dy);
 if(d>DISH.radius){a.x=DISH.x+dx/d*DISH.radius;a.y=DISH.y+dy/d*DISH.radius;a.a=Math.atan2(-dy,-dx)+.35}
 a.hidden=false;a.occlusion=0;
}
export function stepPetri(group,{state,time,dt,reduced}){
 for(const a of group){
  a.hidden=false;a.occlusion=0;a.molt='none';a.posture='normal';a.activity='crawl';a.moving=Math.sin(time*.35+a.id)>.05;
  if(a.moving){const speed=(reduced?.12:.32)*Math.min(4,Number(globalThis.__ISOPODA_HABITAT_SPEED__)||1);a.a+=Math.sin(time*.27+a.offset)*dt*.2;a.x+=Math.cos(a.a)*speed*dt;a.y+=Math.sin(a.a)*speed*dt;a.phase+=dt*3}
  confinePetri(a);
 }
}
