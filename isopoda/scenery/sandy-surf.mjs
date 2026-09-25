import {stepInteraction} from '../interaction.mjs';
// Authored, accelerated observation. Sources and limits live in the habitat lab.
export const sandShore=(s,time=0)=>Math.max(112,Math.min(326,270-(s.tide-50)*1.55+Math.sin(time*.55)*22));
export function stageSand(group,s){
 const shore=sandShore(s);
 group.forEach((a,i)=>{
  a.x=48+(i*71+s.seed%37)%285;a.y=i===0?shore+20:Math.max(80,shore-100)+(i%3)*35;
  a.sand={mode:i%3===0?'surface':i%3===1?'buried':'burying',depth:i%3===1?1:0,age:i*1.3,quiet:i%2===1,cycle:0};
  a.hidden=a.sand.mode==='buried';a.occlusion=0;a.moving=false;
 });
}
export function buriedAt(group,p){return [...group].reverse().find(a=>a.sand&&a.sand.depth>0&&!a.interactionState&&Math.hypot(p.x-a.x,p.y-a.y)<16)}
export function uncoverSand(a){if(!a?.sand)return;a.sand.mode='surface';a.sand.depth=0;a.sand.age=0;a.hidden=false;a.occlusion=0}
export function stepSand(group,{state:s,time,dt,reduced}){
 const shore=sandShore(s,time);
 for(const a of group){
  const b=a.sand;if(!b)continue;
  if(a.interactionState?.mode==='digging'){b.depth=Math.max(0,b.depth-dt*1.7);a.hidden=b.depth>=1;a.moving=false;continue}
  if(a.interactionState){uncoverSand(a);if(a.interactionState.mode==='grabbed')a.lift=-12;if(stepInteraction(a,dt))continue;}
  const paceFactor=Math.min(64,Math.max(1,Number(globalThis.__ISOPODA_HABITAT_SPEED__)||1)),delta=dt*paceFactor;
  b.age+=delta; a.molt='none';a.posture='normal';a.activity='crawl';a.moving=false;
  if(b.mode==='buried'){
   // Quiet individuals offer no location cue. All remain real, diggable actors.
   if((a.y>shore-10&&b.age>6+(a.id%3))||b.age>24+(a.id%4)*3){b.mode='emerging';b.age=0;b.cycle++}
  }else if(b.mode==='burying'){
   b.depth=Math.min(1,b.depth+delta*.65);if(b.depth===1){b.mode='buried';b.age=0}
  }else if(b.mode==='emerging'){
   b.depth=Math.max(0,b.depth-delta*.8);if(b.depth===0){b.mode='surface';b.age=0}
  }else{
   const wet=a.y>shore,pace=(wet?8:2.7)*(reduced?.5:1);
   a.activity=wet?'swim':'crawl';a.posture=wet?'swimming':'normal';a.moving=true;
   a.phase+=delta*(wet?8:4);a.a+=Math.sin(time*.45+a.id)*delta*.4;
   a.x+=Math.cos(a.a)*pace*delta;a.y+=Math.sin(a.a)*pace*delta;
   if(a.x<24||a.x>358)a.a=Math.PI-a.a;if(a.y<65||a.y>398)a.a=-a.a;
   a.x=Math.max(24,Math.min(358,a.x));a.y=Math.max(65,Math.min(398,a.y));
   if(b.age>(wet?14:5)+(a.id%4)){b.mode='burying';b.age=0}
  }
  a.hidden=b.depth>=1;a.occlusion=0;
 }
}
export function sandVisibleCells(cells,a){
 const depth=a.sand?.depth||0;if(!depth)return cells;
 // Mask anatomy with sediment instead of making the animal translucent.
 const ys=cells.map(c=>c[1]),lo=Math.min(...ys),hi=Math.max(...ys),edge=hi-depth*(hi-lo+2);
 return cells.filter(([x,y])=>y<edge+(Math.abs(x*17)%3-1));
}
export function drawSandMarks(g,group,time,holes=[],reduced=false){
 const px=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
 for(const h of holes){const age=time-h.time;if(age<0||age>7)continue;const r=age<.45?4+age*18:12;g.save();g.globalAlpha=Math.min(1,(7-age)/2);px(h.x-r+3,h.y-5,r*2-6,2,'#8b795b');px(h.x-r,h.y-3,r*2,6,'#968363');px(h.x-r+4,h.y-2,r*2-8,3,'#88775b');px(h.x-r,h.y+3,r*2,2,'#d0bd8a');for(let i=0;i<6;i++){const d=r+2+Math.min(age,.5)*10;px(h.x+Math.cos(i*1.1)*d,h.y+Math.sin(i*1.1)*d*.55,2,1,'#cbbc91')}g.restore()}
 for(const a of group){const b=a.sand;if(!b||a.interactionState)continue;
  const active=b.mode==='burying'||b.mode==='emerging';
  const hint=!b.quiet&&b.mode==='buried'&&b.age%8<.7;
  if(!active&&!hint)continue;
  for(let i=0;i<5;i++){const shift=reduced?0:Math.sin(time*11+i)*1.5;px(a.x-7+i*3+shift,a.y+3+(i%2)*2,2,1,i%2?'#d7c79b':'#9d8b68')}
 }
}
