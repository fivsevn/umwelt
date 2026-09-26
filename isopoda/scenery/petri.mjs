import {petriIndex,PETRI_STEPS} from '../data/habitats/petri-observation.mjs';
export const DISH={x:192,y:215,radius:132};
export function microscope(s){
 const m=s.microscope??={mode:false,magnification:4,focus:28,light:65,x:192,y:215,moves:0,lights:0,completed:{}};
 m.inputs??={};m.completed??={};
 if(m.gateVersion!==2){const i=petriIndex(s);m.completed=Object.fromEntries(Object.entries(m.completed).filter(([index])=>Number(index)<i));m.checkpoint=null;m.gateVersion=2}
 return m;
}
export const focusTarget=m=>m.magnification>=32?76:m.magnification>=16?68:m.magnification>=8?60:50;
export const isFocused=m=>Math.abs(m.focus-focusTarget(m))<=8;
export function beginPetriStep(s){const m=microscope(s),i=petriIndex(s);if(m.checkpoint?.index!==i)m.checkpoint={index:i,inputs:{...m.inputs}};return m}
export function noteMicroscopeAction(s,action,amount=1){const m=microscope(s);m.inputs[action]=(m.inputs[action]||0)+Math.abs(amount)}
export function checkMicroscope(s,visible=true){
 const m=beginPetriStep(s),i=petriIndex(s),gate=PETRI_STEPS[i][1],changed=key=>(m.inputs[key]||0)>(m.checkpoint.inputs[key]||0);
 const ready=!gate||({enter:m.mode,focus:changed('focus')&&m.mode&&isFocused(m)&&visible,zoom:changed('zoomUp')&&m.mode&&m.magnification>=8&&isFocused(m)&&visible,move:(m.inputs.move||0)-(m.checkpoint.inputs.move||0)>=2&&m.mode&&visible,light:changed('light')&&m.mode&&m.light>=35&&m.light<=85,widen:changed('zoomDown')&&m.mode&&m.magnification===4,return:!m.mode})[gate];
 if(ready)m.completed[i]=true;return !!m.completed[i];
}
export function petriReady(s){return !!microscope(s).completed[petriIndex(s)]||!PETRI_STEPS[petriIndex(s)][1]}
export function confinePetri(a){
 const dx=a.x-DISH.x,dy=a.y-DISH.y,d=Math.hypot(dx,dy);
 if(d>DISH.radius){a.x=DISH.x+dx/d*DISH.radius;a.y=DISH.y+dy/d*DISH.radius;a.a=Math.atan2(-dy,-dx)+.35}
 a.hidden=false;a.occlusion=0;
}
export function stepPetri(group,{state,time,dt,reduced}){
 const multiplier=Math.max(1,Math.min(64,Number(globalThis.__ISOPODA_HABITAT_SPEED__)||1));
 for(const a of group){
  a.hidden=false;a.occlusion=0;a.molt='none';a.posture='normal';a.activity='crawl';a.moving=Math.sin(time*.71+a.offset)>-.78;a.posture=a.moving?'normal':'probing';a.phase+=dt*multiplier*(a.moving?3:1.2);
  if(a.moving){const speed=(reduced?.12:.32)*multiplier;a.a+=Math.sin(time*.27+a.offset)*dt*multiplier*.2;a.x+=Math.cos(a.a)*speed*dt;a.y+=Math.sin(a.a)*speed*dt}
  confinePetri(a);
 }
}
