import {INTERTIDAL_LAYOUT} from './authored-layouts.mjs';
import {stepInteraction} from '../interaction.mjs';
const waterLevels=new WeakMap();
export function intertidalSurface(state){return 360-(waterLevels.get(state)??state.tide)*3.35}
const plants=INTERTIDAL_LAYOUT.objects.filter(o=>o.type.startsWith('rockweed-'));
const shells=INTERTIDAL_LAYOUT.objects.filter(o=>o.type.startsWith('barnacle-'));
const stones=INTERTIDAL_LAYOUT.objects.filter(o=>o.type.startsWith('stone-')&&o.y>35&&o.y<400);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Match the shared barnacle renderer's cluster positions, including edited transforms.
const noise=(x,y,s=0)=>{let h=Math.imul((x+s)|0,374761393)^Math.imul(y|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0};
export function drawIntertidalLife(g,s,time,pixel){
 const surface=intertidalSurface(s);
 for(const o of shells)for(let i=0;i<(o.params.count??9);i++){
  const q=noise(i,79,o.seed),u=(-17+q%35)*(o.flipX?-1:1)*o.scale,v=(-10+(q>>>8)%21)*o.scale;
  const x=o.x+u*Math.cos(o.angle)-v*Math.sin(o.angle),y=o.y+u*Math.sin(o.angle)+v*Math.cos(o.angle);
  if(y<surface+5)continue;
  const reach=Math.max(0,Math.sin(time*2.2+i*.73+o.seed))*5*o.scale;
  for(let ray=-1;ray<=1;ray++)for(let d=1;d<reach;d++)pixel(g,x+ray*d*.55+Math.sin(time+i)*d*.18,y-d,1,1,'#b9c4a5');
 }
}
export function stepIntertidal(group,{state:s,dt=0,reduced=false,speed=1}){
 const prior=waterLevels.get(s)??s.tide,level=prior+(s.tide-prior)*Math.min(1,dt*.8);waterLevels.set(s,level);
 const surface=intertidalSurface(s),top=Math.max(28,surface+12),wet=plants.filter(p=>p.y>top+18&&p.y<407),anchors=wet.length?wet:plants.slice(-2);
 const pace=(reduced?.55:1)*speed;
 const refugeResidents=group.filter(a=>a.species==='hirsuta');
 // Seeded homes include every exposed authored cluster, without stacking residents.
 const exposed=shells.filter(o=>o.y<surface-25);
 const homes=(exposed.length?exposed:shells).slice().sort((a,b)=>noise(a.seed,113,s.seed)-noise(b.seed,113,s.seed));
 for(const a of group){
  if(stepInteraction(a,dt))continue;
  a.tideClock=(a.tideClock??0)+dt*pace;const t=a.tideClock;
  const upperRefuge=a.species==='hirsuta',stoneDweller=a.species==='albifrons';
  const wetStones=stoneDweller?stones.filter(p=>p.y>top+18):[];
  // Cohort IDs are interleaved by species (0, 3, 6); rank residents instead of
  // taking ID modulo refuge count, which stacked all three on the same shell patch.
  const residentIndex=refugeResidents.indexOf(a),home=homes[Math.max(0,residentIndex)%homes.length];
  const pool=upperRefuge?(level<50?[home]:shells):wetStones.length?wetStones:anchors;
  const floor=upperRefuge?28:top;
  // Independent, seeded bouts: each individual chooses a new local destination and dwell time.
  // Exposed hirsuta stay close to their damp refuge; aquatic taxa follow the wet margin.
  let route=a.tideRoute;
  if(!route||t>=route.until||!pool.includes(route.anchor)||route.y<floor){
   const bout=(route?.bout??0)+1,r=n=>noise(bout,n,(a.seed||0)+a.id*7919)/4294967296;
   const alternatives=upperRefuge&&level>=50?pool.filter(o=>o!==route?.anchor&&!refugeResidents.some(other=>other!==a&&other.tideRoute?.anchor===o)):[];
   const destinations=alternatives.length?alternatives:pool;
   const anchor=destinations[Math.floor(r(11)*destinations.length)],swim=a.species==='granulosa'&&level>48&&r(29)<.3,cling=!swim&&r(37)<.55;
   const radius=swim?30:upperRefuge?Math.max(12,Math.min(20,anchor.scale*15)):cling?5:17,angle=r(43)*Math.PI*2;
   route=a.tideRoute={bout,anchor,swim,cling,until:t+2+r(53)*11,pauseUntil:t+r(61)*2.8,x:clamp(anchor.x+Math.cos(angle)*radius*(.35+.65*r(71)),22,362),y:clamp(anchor.y-8+Math.sin(angle)*radius*.7*(.35+.65*r(83)),floor,402),rate:.65+r(97)*.8};
   if(upperRefuge&&a.tideInitialized)route.until+=Math.hypot(route.x-a.x,route.y-a.y)/((cling?5:7)*Math.max(.6,a.speed/.68)*route.rate);
  }
  const {anchor,swim,cling}=route,x=route.x,y=route.y;
  if(a.tideInitialized!==true){a.x=upperRefuge?x:clamp(anchor.x+a.id*3-9,22,362);a.y=upperRefuge?y:clamp(anchor.y-12,floor,402);a.tideInitialized=true}
  const dx=x-a.x,dy=y-a.y,distance=Math.hypot(dx,dy),rate=(swim?12:cling?5:7)*Math.max(.6,a.speed/.68),travel=Math.min(distance,(t<route.pauseUntil?0:dt*pace*rate*route.rate));
  if(distance>1){a.a=Math.atan2(dy,dx);a.x+=dx/distance*travel;a.y+=dy/distance*travel}
  // Follow a receding wet margin continuously instead of teleporting at a turn boundary.
  a.y=clamp(a.y,floor,405);a.x=clamp(a.x,20,364);a.phase+=dt*pace*(swim?8:cling?2.4:4);
  a.activity=swim?'swim':cling?'cling':'crawl';a.posture=swim?'swimming':cling?'probing':'normal';
  a.moving=travel>0.01;a.hidden=false;a.occlusion=0;a.molt='none';
 }
}
