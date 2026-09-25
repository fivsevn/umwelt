import {stepInteraction} from '../interaction.mjs';
// Authored, accelerated observation. Sources and limits live in the habitat lab.
export const sandShore=(s,time=0)=>Math.max(112,Math.min(326,270-(s.tide-50)*1.55+Math.sin(time*.55)*22));
export function stageSand(group,s){
 const shore=sandShore(s);
 group.forEach((a,i)=>{
  a.x=48+(i*71+s.seed%37)%285;a.y=i===0?shore+20:Math.max(80,shore-100)+(i%3)*35;
  a.sand={mode:i%3===0?'surface':i%3===1?'buried':'burying',depth:i%3===1?1:0,age:i%3===2?0:i*1.3,quiet:i%2===1,cycle:0};
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
  b.age+=['burying','emerging'].includes(b.mode)?dt:delta; a.molt='none';a.posture='normal';a.activity='crawl';a.moving=false;
  if(b.mode==='buried'){
   // Quiet individuals offer no location cue. All remain real, diggable actors.
   if((a.y>shore-10&&b.age>6+(a.id%3))||b.age>24+(a.id%4)*3){b.mode='emerging';b.age=0;b.cycle++}
  }else if(b.mode==='burying'){
   a.moving=true;b.depth=sandProgress(b.age);a.phase+=dt*12;if(b.depth===1){b.mode='buried';b.age=0}
  }else if(b.mode==='emerging'){
   a.moving=true;a.phase+=dt*12;b.depth=1-sandProgress(b.age);if(b.depth===0){b.mode='surface';b.age=0}
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
 const axis=([x,y])=>(x-a.x)*Math.cos(a.a||0)+(y-a.y)*Math.sin(a.a||0),values=cells.map(axis),lo=Math.min(...values),hi=Math.max(...values),edge=hi-depth*(hi-lo+2);
 return cells.filter(cell=>a.sand.mode==='emerging'?axis(cell)>lo+depth*(hi-lo+2):axis(cell)<edge+(Math.abs(cell[0]*17)%3-1));
}
// Visible actions keep their real-time duration even when observation time is sped up.
export function sandProgress(age){
 const t=Math.max(0,age-.45),step=Math.floor(t/.9),phase=(t%.9)/.9;
 return Math.min(1,(step+Math.min(1,Math.max(0,(phase-.35)/.45)))/3);
}
export function sandPose(a,reduced=false){
 if(!a.sand||!['burying','emerging'].includes(a.sand.mode)||a.interactionState)return a;
 const phase=(a.sand.age%.9)/.9,push=reduced?0:Math.sin(phase*Math.PI),out=a.sand.mode==='emerging';
 return {...a,a:a.a+Math.sin(phase*Math.PI*2)*(reduced?0:.22),
 x:a.x+Math.cos(a.a)*push*(out?-3:3),y:a.y+Math.sin(a.a)*push*(out?-3:3),
 sandRearLift:out?0:push*9,lift:(a.lift||0)-(out?push*6:0),moving:true};
}
export function drawSandMarks(g,group,time,holes=[],reduced=false,state={tide:46}){
 const shore=sandShore(state,time),px=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
 for(const h of holes){
  const age=time-h.time;if(age<0||age>7)continue;
  const water=h.water||h.y>=shore;
  g.save();
  if(water){
   if(age>1.8){g.restore();continue}
   g.globalAlpha=(1-age/1.8)*.65;
   for(let ring=0;ring<2;ring++){const r=4+age*13+ring*5;for(let i=0;i<22;i++){if((i+ring)%5===0)continue;const a=i*Math.PI/11;px(h.x+Math.cos(a)*r,h.y+Math.sin(a)*r*.42,2,1,ring?'#91bcb0':'#c4d2b4')}}
  }else{
   const r=7+Math.min(age/.35,1)*5,seed=Math.round(h.x*13+h.y*7),wet=h.y>shore-45;
   g.globalAlpha=Math.min(.85,(7-age)/3);
   // Uneven stippled hollow, a broken shaded lip and loose grains; no rectangular rim.
   for(let y=-6;y<=6;y++)for(let x=-13;x<=13;x++){
    const n=Math.abs(x*31+y*47+seed)%19,q=x*x/(r*r)+y*y/30;
    if(q<.72&&n<10)px(h.x+x,h.y+y,1,1,wet?'#777b60':'#a18d65');
    if(q>.72&&q<1.12&&n<12)px(h.x+x,h.y+y,1,1,y<0?(wet?'#878769':'#ae9970'):(wet?'#b1ac80':'#d1bf91'));
   }
   for(let i=0;i<13;i++){const a=i*2.4+seed,rim=r+2+(i%4)+Math.min(age,.4)*5;px(h.x+Math.cos(a)*rim,h.y+Math.sin(a)*rim*.5,1+i%2,1,i%3?'#c5b487':'#ae996f')}
  }
  g.restore();
 }
 for(const a of group){const b=a.sand;if(!b||a.interactionState)continue;
  const active=b.mode==='burying'||b.mode==='emerging',hint=!b.quiet&&b.mode==='buried'&&b.age%8<.7;
  if(!active&&!hint)continue;
  if(a.y>=shore){
   const pulse=reduced?0:b.age%1;
   for(let i=0;i<12;i++){if(i%4===0)continue;const theta=i*Math.PI/6,r=7+pulse*8;px(a.x+Math.cos(theta)*r,a.y+Math.sin(theta)*r*.4,2,1,i%2?'#91bcb0':'#c4d2b4')}
   continue;
  }
  for(let i=0;i<7;i++){const push=reduced?0:Math.max(0,Math.sin(b.age*Math.PI*2.4)),spread=5+i%3*3+push*4,side=i%2?1:-1;
   const x=a.x+Math.cos(a.a+Math.PI/2)*side*spread-Math.cos(a.a)*3,y=a.y+Math.sin(a.a+Math.PI/2)*side*spread-Math.sin(a.a)*3;
   px(x,y,1+i%2,1,i%2?'#d7c79b':'#9d8b68');
  }
 }
}
