import {stableHash} from './sprites.mjs?v=projection-7';
export const MOTIONS=['contact','follow','feed','gather','yield','climb','groom','molt','shell','border','defend','emerge','orbit','rest','under','disperse','parallel','wall','hesitate'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function makeIndividuals(seed,speed=1){return Array.from({length:5},(_,id)=>{
 const h=stableHash(seed+':'+id),stage=['S','M','L','M','L'][id];return {id,seed:seed+':'+id,x:55+h%260,y:65+(h>>>8)%290,a:(h%628)/100,speed:(.65+(h>>>12)%70/100)*speed,size:.94+(h>>>18)%13/100,stage,alertness:.25+(h>>>16)%60/100,pause:2+(h>>>20)%5,offset:h%190/10,hidden:false,posture:'normal',moving:false,molt:'none',occlusion:0,phase:0};
})}
export function actorOrder(group,encounter){
 if(encounter?.id==='younger'||encounter?.id==='touch-return')return [...group].sort((a,b)=>['S','M','L'].indexOf(a.stage)-['S','M','L'].indexOf(b.stage));
 return [...group].sort((a,b)=>stableHash(a.seed+':'+encounter?.id)-stableHash(b.seed+':'+encounter?.id));
}
export function stageIndividuals(group,encounter,{initial=false}={}){
 const [x,y]=encounter?.place||[190,220],ordered=actorOrder(group,encounter);
 for(const c of group){c.hidden=false;c.molt='none';c.occlusion=0;c.posture='normal';c.role=ordered.indexOf(c);c.encounterId=encounter?.id}
 // Only arrival places the animals. Later scenes preserve their positions and identities.
 if(initial)for(const c of group){const i=c.role;if(i<(encounter?.actors||1)){const a=i*2.4+stableHash(c.seed)%10;c.x=clamp(x+Math.cos(a)*38,24,355);c.y=clamp(y+Math.sin(a)*32,30,400);c.a=Math.atan2(y-c.y,x-c.x)}}
}
export function stepIndividuals(group,{encounter,state={},time=0,dt=.05,reaction=null,reduced=false}){
 dt=clamp(dt,0,.1);const motion=encounter?.motion||'rest',[x,y]=encounter?.place||[190,220],participants=encounter?.actors||1;
 const ordered=actorOrder(group,encounter),positions=ordered.map(c=>({x:c.x,y:c.y,a:c.a}));
 for(const c of group){
  const i=ordered.indexOf(c),phase=(time+c.offset)%22,focus=i<participants,near=Math.hypot(c.x-x,c.y-y)<48;
  let tx=70+(stableHash(c.seed)%240)+Math.sin((time+c.offset)*.12)*35,ty=85+(stableHash(c.seed+'y')%250)+Math.cos((time+c.offset)*.11)*32,pace=c.speed,stop=false,molt='none',posture='normal',face=null,hide=0;
  if(focus){tx=x;ty=y;
   switch(motion){
    case 'contact':{const cycle=time%20,spread=cycle<8?26:cycle<12?20:64;tx=x+(i%2?1:-1)*spread;ty=y+(i>1?32:0);if(near&&cycle>=6&&cycle<12){stop=true;posture='probing';face=Math.atan2(y-c.y,x-c.x)}else if(cycle>=12)posture='turning';break}
    case 'follow':if(i){tx=positions[i-1].x-Math.cos(positions[i-1].a)*42;ty=positions[i-1].y-Math.sin(positions[i-1].a)*42+(encounter.id==='younger'?28:0)}else{tx=x+Math.sin(time*.15)*48;ty=y+Math.cos(time*.15)*24}break;
    case 'feed':tx=x+Math.cos(i*Math.PI*2/participants)*26;ty=y+Math.sin(i*Math.PI*2/participants)*25;if(Math.hypot(tx-c.x,ty-c.y)<9){stop=phase>2;posture='feeding';face=Math.atan2(y-c.y,x-c.x)}break;
    case 'gather':tx=165+i*17;ty=224;hide=near?clamp((time-i*2)/15,0,.94):0;stop=Math.hypot(tx-c.x,ty-c.y)<7;posture=near?'emerging':'normal';break;
    case 'yield':tx=x+(i? -65:65);ty=y+(i?18:0);stop=i===0&&time%18<7&&near;posture=stop?'probing':'normal';break;
    case 'climb':tx=x+Math.sin(time*.23+i*2)*35;ty=y+Math.cos(time*.23+i*2)*20;pace*=.65;posture=i?'emerging':'turning';hide=i&&near?.45:0;break;
    case 'groom':stop=near&&phase<17;posture=stop?'grooming':'probing';break;
    case 'molt':stop=near;molt=encounter.molt;posture='molting';pace*=.3;break;
    case 'shell':tx=x+(i?42:0);ty=y+(i?15:0);stop=!i&&near;posture=stop?'feeding':'turning';break;
    case 'border':tx=68+Math.sin((time+c.offset)*.35)*20;ty=y+i*30+Math.sin(time*.15)*40;posture=phase<c.pause?'probing':'turning';stop=phase<c.pause;break;
    case 'defend':stop=i===0&&near&&time%24<16;posture=stop?(time%24<3||time%24>12?'tucked':'curled'):'normal';tx=x+i*50;ty=y+Math.sin(time*.2+i)*22;break;
    case 'emerge':tx=185+i*19;ty=250+Math.min(40,time*2-i*12);hide=near?clamp(.85-(time-i*3)/13,0,.85):0;stop=near&&time<i*3+2;posture=hide>0?'emerging':'probing';break;
    case 'orbit':tx=x+Math.cos(time*.19+i*Math.PI)*38;ty=y+Math.sin(time*.19+i*Math.PI)*33;posture='turning';break;
    case 'rest':tx=x+(i-1)*35;ty=y+i%2*22;stop=near&&phase<18;posture=stop?(phase<15?'resting':'probing'):'normal';break;
    case 'under':tx=280+i*20;ty=338;hide=near?clamp((time-i*4)/14,0,1):0;stop=near&&Math.hypot(tx-c.x,ty-c.y)<8;posture='emerging';break;
    case 'disperse':tx=x+Math.cos(i*1.7)*95;ty=y+Math.sin(i*1.7)*90;stop=time<i*3;posture=stop?'resting':'normal';break;
    case 'parallel':tx=x+Math.sin(time*.17)*65;ty=y+i*35;break;
    case 'wall':tx=344;ty=y+Math.sin(time*.16)*75;posture=Math.abs(c.x-344)<10?'probing':'normal';break;
    case 'hesitate':tx=125+Math.sin(time*.5)*15;ty=211;stop=near&&phase%6<3;posture=stop?'probing':'tucked';break;
   }
  }else{stop=phase<c.pause;posture=stop?(phase<2?'grooming':'resting'):'normal';if(state.humidity>85)tx+=25;if(state.humidity<55)tx-=30}
  if(reaction?.mode==='disturb'){
   const age=reaction.age||0;hide=0;
   if(age<1.2+c.alertness&&c.alertness>.48){stop=true;posture=age<.4?'tucked':'curled'}else{tx=clamp(c.x+(c.x-x||i+1)*2,24,355);ty=clamp(c.y+(c.y-y||i+1)*2,30,400);pace*=1.4+c.alertness;stop=false;posture='normal'}
  }else if(reaction?.mode==='care'){
   if(['mist','wet-left'].includes(reaction.id)){tx=70+c.id*17;ty=120+c.id*42;posture=(reaction.age||0)<2?'probing':'normal';stop=(reaction.age||0)<c.alertness}
   else if(reaction.id==='food'){tx=316+Math.cos(i*1.3)*26;ty=255+Math.sin(i*1.3)*26;posture=Math.hypot(tx-c.x,ty-c.y)<10?'feeding':'normal';stop=posture==='feeding';face=Math.atan2(255-c.y,316-c.x)}
   else {tx=155+c.id*19;ty=234+c.id%2*18;posture='emerging';hide=near?.3:0;stop=false}
  }else if(reaction?.mode==='quiet'&&motion==='defend'){stop=false;posture=(reaction.age||0)<2?'tucked':'normal'}
  const dx=tx-c.x,dy=ty-c.y,dist=Math.hypot(dx,dy);c.moving=!stop&&dist>5;
  if(c.moving){const desired=Math.atan2(dy,dx),delta=Math.atan2(Math.sin(desired-c.a),Math.cos(desired-c.a));c.a+=clamp(delta,-dt*1.7,dt*1.7);if(Math.abs(delta)>.7&&posture==='normal')posture='turning';const step=Math.min(dist,pace*dt*11*(reduced?.45:1));c.x+=Math.cos(c.a)*step;c.y+=Math.sin(c.a)*step}
  else if(face!==null){const d=Math.atan2(Math.sin(face-c.a),Math.cos(face-c.a));c.a+=clamp(d,-dt*1.5,dt*1.5)}
  // Avoid crowding without disturbing a stationary molting animal.
  if(c.moving)for(const other of group){if(c===other)continue;const d=Math.hypot(c.x-other.x,c.y-other.y);if(d>0&&d<24){c.x+=(c.x-other.x)/d*(24-d)*dt;c.y+=(c.y-other.y)/d*(24-d)*dt}}
  c.x=clamp(c.x,24,355);c.y=clamp(c.y,30,400);c.posture=posture;c.molt=molt;c.activity=focus?motion:stop?'rest':'wander';c.role=i;
  c.occlusion=c.occlusion+clamp(hide-c.occlusion,-dt*.35,dt*.35);c.hidden=c.occlusion>=.99;
  c.phase=reduced?0:Math.floor((time+c.offset)*(c.moving?c.speed*5:posture==='grooming'?2:1));
  c.lift=focus&&motion==='climb'?Math.round(Math.sin(time+i)*2):0;
 }
 return group;
}
