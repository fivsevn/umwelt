// GAME choreography: spatial events are coupled to the same encounter ID as the written record.
export const MOTIONS=['contact','follow','feed','gather','yield','climb','groom','molt','shell','border','defend','emerge','orbit','rest','under','disperse','parallel','wall','hesitate'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function makeIndividuals(seed,speed=1){return Array.from({length:5},(_,i)=>({id:i,seed:seed+':'+i,x:85+i*46,y:120+(i%3)*70,a:i*.9,speed:(.8+i*.09)*speed,size:.95+i%2*.05,stage:['S','M','L','M','L'][i],hidden:false,posture:'normal',moving:false,molt:'none'}))}
export function stageIndividuals(group,encounter){
 const [x,y]=encounter?.place||[190,220];for(const [i,c] of group.entries()){c.x=clamp(x+(i-2)*27,28,348);c.y=clamp(y+(i%2?28:-24),35,395);c.a=i%2?Math.PI:0;c.hidden=false;c.molt='none';c.posture='normal'}
}
export function stepIndividuals(group,{encounter,state,time=0,dt=.05,reaction=null,reduced=false}){
 const motion=encounter?.motion||'rest',[x,y]=encounter?.place||[190,220],participants=encounter?.actors||1;
 const positions=group.map(c=>({x:c.x,y:c.y}));
 for(const [i,c] of group.entries()){
  const phase=(time+i*.7)%16,focus=i<participants;let tx=80+(i*61)%260+Math.sin(time*.16+i)*24,ty=75+(i*83)%315+Math.cos(time*.14+i)*18,pace=c.speed,stop=false,molt='none',posture='normal';
  if(focus){tx=x+(i-(participants-1)/2)*22;ty=y;
   switch(motion){
    case 'contact':tx=x+(i-(participants-1)/2)*(phase<8?16:40);ty=y+(i%2?5:-5);stop=phase>4&&phase<7;break;
    case 'follow':if(i){tx=positions[i-1].x-20;ty=positions[i-1].y+6}else{tx=x+Math.sin(time*.22)*45;ty=y+Math.cos(time*.22)*22}break;
    case 'feed':tx=x+Math.cos(i*2.1)*19;ty=y+Math.sin(i*2.1)*19;stop=phase>4;break;
    case 'gather':tx=x+(i-1)*17;ty=y+(i%2)*12;stop=phase>6;break;
    case 'yield':tx=x+(i===0?(phase<7?-15:42):-42);ty=y+(i?7:-7);stop=i===0&&phase<7;break;
    case 'climb':tx=x+Math.sin(time*.35+i)*27;ty=y+Math.cos(time*.35+i)*12;pace*=.7;break;
    case 'groom':stop=phase<11;posture='resting';break;
    case 'molt':stop=true;molt=encounter.molt;posture='resting';break;
    case 'shell':tx=x+i*23;ty=y+8;stop=phase>5;break;
    case 'border':tx=68+Math.sin(time*.65+i)*16;ty=y+i*23+Math.sin(time*.18)*30;break;
    case 'defend':stop=i===0&&phase<10;posture=stop?'curled':'normal';tx=x+i*34;break;
    case 'emerge':tx=185+(phase>i*3?42:-10);ty=241+i*17;stop=phase<i*3;break;
    case 'orbit':tx=x+Math.cos(time*.28+i*Math.PI)*28;ty=y+Math.sin(time*.28+i*Math.PI)*24;break;
    case 'rest':stop=phase<13;posture='resting';break;
    case 'under':tx=280+i*16;ty=338;stop=phase>6;break;
    case 'disperse':tx=x+Math.cos(i*1.5)*70;ty=y+Math.sin(i*1.5)*65;stop=phase<i*2;break;
    case 'parallel':tx=x+Math.sin(time*.2)*42;ty=y+i*24;break;
    case 'wall':tx=344;ty=y+Math.sin(time*.2)*65;break;
    case 'hesitate':tx=125+Math.sin(time*.9)*13;ty=211;stop=phase%4<1.7;break;
   }
  }else{stop=(phase+i*2)%12<2.5; if(state.humidity>85)tx+=25;if(state.humidity<55)tx-=30}
  if(reaction?.mode==='disturb'){tx=c.x+(c.x-x||i+1)*2;ty=c.y+(c.y-y||i+1)*2;pace*=1.8;stop=false;posture=i===0&&group[0].id===0?'curled':'normal';if(i===0)stop=true}
  else if(reaction?.mode==='care'){if(['mist','wet-left'].includes(reaction.id)){tx=75+i*22;ty=130+i*42}else if(reaction.id==='food'){tx=306+i%2*22;ty=249+i*12}else{tx=160+i*18;ty=210+i%2*18}stop=phase>12}
  else if(reaction?.mode==='quiet'&&motion==='defend'){stop=false;posture='normal'}
  const dx=tx-c.x,dy=ty-c.y,dist=Math.hypot(dx,dy);c.moving=!stop&&dist>3&&!reduced;
  if(c.moving){const desired=Math.atan2(dy,dx),delta=Math.atan2(Math.sin(desired-c.a),Math.cos(desired-c.a));c.a+=clamp(delta,-dt*2.4,dt*2.4);const step=Math.min(dist,pace*dt*16);c.x+=Math.cos(c.a)*step;c.y+=Math.sin(c.a)*step}
  // Bodies share space without permanently stacking; contact stays brief and directional.
  for(let j=0;j<i;j++){const other=group[j],d=Math.hypot(c.x-other.x,c.y-other.y);if(!reduced&&d<14&&d>0){c.x+=(c.x-other.x)/d*(14-d)*.3;c.y+=(c.y-other.y)/d*(14-d)*.3}}
  c.x=clamp(c.x,24,355);c.y=clamp(c.y,30,400);c.posture=posture;c.molt=molt;c.activity=focus?motion:stop?'rest':'wander';
  c.hidden=focus&&((motion==='under'&&Math.hypot(c.x-286,c.y-338)<20)||(motion==='gather'&&c.x>145&&c.x<230&&c.y>204&&c.y<237));
  c.lift=focus&&motion==='climb'?Math.round(Math.sin(time*2+i)*2):0;c.groom=focus&&motion==='groom'&&stop;
 }
 return group;
}
