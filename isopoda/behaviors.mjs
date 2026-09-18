import {stepInteraction} from './interaction.mjs?v=pointer-1';
import {speciesById} from './species.mjs?v=cohort-4';
import {cohortFor} from './engine.mjs?v=cohort-4';
import {stableHash} from './sprites.mjs?v=appendage-2';
export const MOTIONS=['contact','follow','feed','gather','yield','climb','groom','molt','shell','border','defend','emerge','orbit','rest','under','disperse','parallel','wall','hesitate'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const trait=(seed,key)=>stableHash(seed+':trait:'+key)%1001/1000;
export function behaviorTraits(seed){return {
 boldness:trait(seed,'boldness'),exploration:trait(seed,'exploration'),shelterAffinity:trait(seed,'shelter'),moistureAffinity:trait(seed,'moisture'),
 foraging:trait(seed,'foraging'),grooming:trait(seed,'grooming'),restlessness:trait(seed,'restlessness'),socialDistance:trait(seed,'social-distance')
}}
function ambientCounts(group,self){const counts={};for(const c of group){if(c===self||!c.ambientAction)continue;counts[c.ambientAction]=(counts[c.ambientAction]||0)+1}return counts}
function chooseAmbient(c,group,slot,state){
 const t=c.traits,counts=ambientCounts(group,c),humidity=state.humidity??70,food=state.environment?.foodNodes?.some(f=>f.amount>0),period=state.period??0,activity=period===2?1.38:period===1?.76:1;
 const choices=[
  ['explore',1.05*(.55+t.exploration*1.15)*(.75+t.restlessness*.55)*activity],
  ['probe',.62*(.55+t.boldness*.8)*activity],
  ['groom',.55*(.38+t.grooming*1.35)*(period===1?1.12:1)],
  ['rest',.62*(1.25-t.restlessness*.7)*(period===1?1.38:period===2?.72:1)],
  ['forage',(food?.52:.12)*(.35+t.foraging*1.55)*activity*(period===2?1.18:1)],
  ['wet',.42*(.35+t.moistureAffinity*1.5)*(humidity<82?1.2:.72)*(humidity<58?1.45:1)],
  ['shelter',.46*(.35+t.shelterAffinity*1.5)*(1.15-t.boldness*.28)*(humidity<60?1.5:1)*(period===1?1.18:1)],
  ['edge',.34*(.4+t.exploration*1.25)*activity]
 ];
 let total=0;for(const choice of choices){const n=counts[choice[0]]||0;choice[1]*=n===0?1:n===1?.30:.07;total+=choice[1]}
 let roll=(stableHash(c.seed+':ambient:'+slot)%100000)/100000*total;
 for(const [action,weight] of choices){roll-=weight;if(roll<=0)return action}return 'explore';
}
function ambientTarget(action,state,c,slot){
 const env=state.environment||{},h=stableHash(c.seed+':target:'+slot);
 if(action==='forage'){const nodes=(env.foodNodes||[]).filter(f=>f.amount>0);if(nodes.length){const f=nodes[h%nodes.length];return {x:f.x+(c.id%2?13:-13),y:f.y,kind:'food'}}}
 if(action==='wet'&&env.wetZones?.length){const z=env.wetZones[h%env.wetZones.length];return {x:z.x+((h>>>6)%25-12),y:z.y+((h>>>11)%21-10),kind:'wet'}}
 if(action==='shelter'&&env.shelter)return {x:env.shelter.x+((h>>>6)%31-15),y:env.shelter.y+12+((h>>>12)%15),kind:'shelter'};
 if(action==='edge'){const side=h%4,p=38+(h>>>5)%310;return side===0?{x:30,y:clamp(p,45,385),kind:'edge'}:side===1?{x:350,y:clamp(p,45,385),kind:'edge'}:side===2?{x:clamp(p,35,345),y:36,kind:'edge'}:{x:clamp(p,35,345),y:392,kind:'edge'}}
 return null;
}
export function makeIndividuals(seed,speed=.68){return (Array.isArray(seed)?seed:cohortFor('dairy',seed)).map((specimen,id)=>{
 const h=stableHash(specimen.seed),stage=specimen.stage;return {id,specimenId:specimen.id,species:specimen.species,seed:specimen.seed,x:55+h%260,y:65+(h>>>8)%290,a:(h%628)/100,speed:(.65+(h>>>12)%70/100)*speed*speciesById(specimen.species).speed,size:.94+(h>>>18)%13/100,stage,alertness:.25+(h>>>16)%60/100,pause:2+(h>>>20)%5,offset:h%190/10,hidden:false,posture:'normal',moving:false,molt:'none',occlusion:0,phase:0,gaitPhase:h%4,traits:behaviorTraits(specimen.seed),ambientSlot:-1,ambientAction:null};
})}
export function actorOrder(group,encounter){
 if(encounter?.specimenId)return [...group].sort((a,b)=>Number(b.specimenId===encounter.specimenId)-Number(a.specimenId===encounter.specimenId)||stableHash(a.seed+':'+encounter?.id)-stableHash(b.seed+':'+encounter?.id));
 if(encounter?.id==='younger'||encounter?.id==='touch-return')return [...group].sort((a,b)=>['S','M','L'].indexOf(a.stage)-['S','M','L'].indexOf(b.stage));
 return [...group].sort((a,b)=>stableHash(a.seed+':'+encounter?.id)-stableHash(b.seed+':'+encounter?.id));
}
export function stageIndividuals(group,encounter,{initial=false}={}){
 const [x,y]=encounter?.place||[190,220],ordered=actorOrder(group,encounter);
 for(const c of group){c.hidden=false;c.molt='none';c.occlusion=0;c.posture='normal';c.role=ordered.indexOf(c);c.encounterId=encounter?.id;c.ambientSlot=-1;c.ambientAction=null}
 if(initial)for(const c of group){const i=c.role;if(i<(encounter?.actors||1)){const a=i*2.4+stableHash(c.seed)%10;c.x=clamp(x+Math.cos(a)*38,24,355);c.y=clamp(y+Math.sin(a)*32,30,400);c.a=Math.atan2(y-c.y,x-c.x)}}
}
export function stepIndividuals(group,{encounter,state={},time=0,dt=.05,reaction=null,reduced=false}){
 dt=clamp(dt,0,.1);const motion=encounter?.motion||'rest',[x,y]=encounter?.place||[190,220],participants=encounter?.actors||1;
 const ordered=actorOrder(group,encounter),positions=ordered.map(c=>({x:c.x,y:c.y,a:c.a}));
 for(const c of group){
  if(stepInteraction(c,dt))continue;
  const i=ordered.indexOf(c),phase=(time+c.offset)%22;
  const ambient=time>24&&motion!=='molt'&&(!reaction||reaction.age>4),focus=i<participants&&!ambient,near=Math.hypot(c.x-x,c.y-y)<48;
  const lifeSpan=10-c.traits.restlessness*3.5,lifeSlot=Math.floor((time+c.offset)/lifeSpan),lifeAge=(time+c.offset)%lifeSpan;
  if(ambient&&c.ambientSlot!==lifeSlot){c.ambientSlot=lifeSlot;c.ambientAction=chooseAmbient(c,group,lifeSlot,state)}
  if(!ambient)c.ambientAction=null;
  const lifeAction=c.ambientAction||'explore';
  let tx=70+(stableHash(c.seed)%240)+Math.sin((time+c.offset)*.12)*35,ty=85+(stableHash(c.seed+'y')%250)+Math.cos((time+c.offset)*.11)*32,pace=c.speed,stop=false,molt='none',posture='normal',face=null,hide=0,travel=0;
  if(!focus&&c.traits.socialDistance<.35){const nearest=group.filter(o=>o!==c&&!o.hidden).sort((a,b)=>Math.hypot(c.x-a.x,c.y-a.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];if(nearest){tx=tx*.82+nearest.x*.18;ty=ty*.82+nearest.y*.18}}
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
  }else if(ambient){
   const brief=2.0+(1-c.traits.restlessness)*1.2;
   if(lifeAction==='probe'&&lifeAge<brief){stop=true;posture='probing'}
   else if(lifeAction==='groom'&&lifeAge<brief+.5){stop=true;posture='grooming'}
   else if(lifeAction==='rest'&&lifeAge<brief+1.1){stop=true;posture='resting'}
   else {stop=false;posture='normal';if(state.humidity>85)tx+=18;if(state.humidity<55)tx-=20}
  }else{
   stop=phase<c.pause;posture=stop?(phase<2?'grooming':'resting'):'normal';if(state.humidity>85)tx+=18;if(state.humidity<55)tx-=20;
  }
  const target=ambient?ambientTarget(lifeAction,state,c,lifeSlot):null;
  if(target&&['forage','wet','shelter','edge'].includes(lifeAction)){
   tx=target.x;ty=target.y;hide=0;stop=false;
   const arrived=Math.hypot(tx-c.x,ty-c.y)<14;
   if(arrived){stop=true;posture=target.kind==='food'?'feeding':target.kind==='shelter'?'emerging':'probing';hide=target.kind==='shelter'?.50:0}
  }
  if(reaction?.mode==='disturb'){
   const age=reaction.age||0,rx=reaction.point?.x??x,ry=reaction.point?.y??y,distance=Math.hypot(c.x-rx,c.y-ry),range=105+c.alertness*38;hide=0;
   if(distance<range){
    const shock=Math.max(.15,1-distance/range);
    if(age<.65+c.alertness*1.25&&c.alertness>.35-shock*.12){stop=true;posture=age<.32?'tucked':c.model?.visual?.conglobation?.ability==='full'?'curled':'tucked'}
    else{tx=clamp(c.x+(c.x-rx||i+1)*(1.5+shock),24,355);ty=clamp(c.y+(c.y-ry||i+1)*(1.5+shock),30,400);pace*=1.25+c.alertness+shock*.55;stop=false;posture='normal'}
   }
  }else if(reaction?.mode==='care'){
   const env=state.environment||{},food=env.foodNodes?.at(-1),wet=env.wetZones?.[0],leaf=env.leaves?.at(-1);
   if(['mist','wet-left'].includes(reaction.id)){if(wet){tx=wet.x;ty=wet.y}posture=(reaction.age||0)<2?'probing':'normal';stop=(reaction.age||0)<c.alertness}
   else if(reaction.id==='food'){const f=food||{x:316,y:255};tx=f.x+Math.cos(i*1.3)*12;ty=f.y+Math.sin(i*1.3)*12;posture=Math.hypot(tx-c.x,ty-c.y)<10?'feeding':'normal';stop=posture==='feeding';face=Math.atan2(ty-c.y,tx-c.x)}
   else if(['leaf','gap','flat'].includes(reaction.id)&&leaf){tx=leaf.x+(leaf.gap?0:35);ty=leaf.y+c.id%2*10;const close=Math.hypot(tx-c.x,ty-c.y)<12;posture=close&&leaf.gap?'emerging':'probing';hide=close&&leaf.gap?.6:0;stop=close}
  }else if(reaction?.mode==='quiet'&&motion==='defend'){stop=false;posture=(reaction.age||0)<2?'tucked':'normal'}
  const sceneMolt=state.scene?.moltVisual;
  if(sceneMolt?.specimen===c.specimenId){
   tx=sceneMolt.x;ty=sceneMolt.y;hide=0;pace*=.22;stop=Math.hypot(tx-c.x,ty-c.y)<9;posture='molting';molt=sceneMolt.phase||'posterior';
  }
  const dx=tx-c.x,dy=ty-c.y,dist=Math.hypot(dx,dy);c.moving=!stop&&dist>5;
  if(c.moving){const desired=Math.atan2(dy,dx),delta=Math.atan2(Math.sin(desired-c.a),Math.cos(desired-c.a));c.a+=clamp(delta,-dt*1.7,dt*1.7);if(Math.abs(delta)>.7&&posture==='normal')posture='turning';travel=Math.min(dist,pace*dt*11*(reduced?.45:1));c.x+=Math.cos(c.a)*travel;c.y+=Math.sin(c.a)*travel}
  else if(face!==null){const d=Math.atan2(Math.sin(face-c.a),Math.cos(face-c.a));c.a+=clamp(d,-dt*1.5,dt*1.5)}
  if(c.moving)for(const other of group){if(c===other)continue;const d=Math.hypot(c.x-other.x,c.y-other.y),spacing=18+c.traits.socialDistance*12;if(d>0&&d<spacing){c.x+=(c.x-other.x)/d*(spacing-d)*dt;c.y+=(c.y-other.y)/d*(spacing-d)*dt}}
  c.x=clamp(c.x,24,355);c.y=clamp(c.y,30,400);c.posture=posture;c.molt=molt;c.activity=focus?motion:posture==='feeding'?'feed':ambient?lifeAction:stop?'rest':'wander';c.role=i;
  c.occlusion=c.occlusion+clamp(hide-c.occlusion,-dt*.35,dt*.35);c.hidden=c.occlusion>=.99;
  if(c.moving)c.gaitPhase=(c.gaitPhase??0)+Math.max(travel*1.1,dt*4);
  c.phase=c.moving?Math.floor(c.gaitPhase):Math.floor((time+c.offset)*(posture==='grooming'?2:1));
  c.lift=focus&&motion==='climb'?Math.round(Math.sin(time+i)*2):0;
 }
 return group;
}
