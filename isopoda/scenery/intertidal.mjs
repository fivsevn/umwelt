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
 for(const a of group){
  if(stepInteraction(a,dt))continue;
  a.tideClock=(a.tideClock??0)+dt*pace;const t=a.tideClock,slot=Math.floor((t+a.offset)/9);
  const upperRefuge=a.species==='hirsuta',stoneDweller=a.species==='albifrons';
  const wetStones=stoneDweller?stones.filter(p=>p.y>top+18):[];
  // C. hirsuta occurs in barnacle/crevice refuges above the receding waterline.
  // Its exposed-phase route contracts around a refuge rather than following open water.
  const pool=upperRefuge?(level<50?[shells[a.id%shells.length]]:shells):wetStones.length?wetStones:anchors;
  const anchor=pool[(a.id+slot)%pool.length],floor=upperRefuge?28:top;

  // Only the swimming-capable Idotea exemplar makes open-water excursions.
  // All trajectories and timings are authored visual proxies, not measured kinetics.
  const swim=a.species==='granulosa'&&level>48&&slot%3===1,cling=!swim&&(slot+a.id)%3!==0;
  const x=clamp(anchor.x+Math.sin(t*.38+a.offset)*(swim?34:upperRefuge&&level<50?2:cling?2:13),22,362),y=clamp(anchor.y-12+Math.cos(t*.3+a.id)*(swim?22:upperRefuge&&level<50?2:cling?2:9),floor,402);
  if(a.tideInitialized!==true){a.x=clamp(anchor.x+a.id*3-9,22,362);a.y=clamp(anchor.y-12,floor,402);a.tideInitialized=true}
  const dx=x-a.x,dy=y-a.y,distance=Math.hypot(dx,dy),rate=(swim?12:cling?5:7)*Math.max(.6,a.speed/.68),travel=Math.min(distance,dt*pace*rate);
  if(distance>1){a.a=Math.atan2(dy,dx);a.x+=dx/distance*travel;a.y+=dy/distance*travel}
  // Follow a receding wet margin continuously instead of teleporting at a turn boundary.
  a.y=clamp(a.y,floor,405);a.x=clamp(a.x,20,364);a.phase+=dt*pace*(swim?8:cling?2.4:4);
  a.activity=swim?'swim':cling?'cling':'crawl';a.posture=swim?'swimming':cling?'probing':'normal';
  a.moving=swim||distance>4;a.hidden=false;a.occlusion=0;a.molt='none';
 }
}
