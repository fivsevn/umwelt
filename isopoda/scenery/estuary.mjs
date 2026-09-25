import {ESTUARY_NODES,ESTUARY_ROUTES,estuaryIndex,estuaryRecords} from '../data/narrative/estuary.mjs';
import {estuaryLayout,estuaryPoint} from './estuary-stages.mjs';

const pixel=(g,x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h)};
const clamp=n=>Math.max(0,Math.min(1,n));
function routeAt(points,progress){
 const position=clamp(progress)*(points.length-1),index=Math.min(points.length-2,Math.floor(position)),t=position-index;
 const a=points[index],b=points[index+1];
 return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,a:Math.atan2(b.y-a.y,b.x-a.x)};
}
export function estuaryRoute(layout,index){return ESTUARY_ROUTES[index].map(point=>estuaryPoint(layout,point)).filter(Boolean)}
// Authored compressed intervals. Choosing a method never moves animals toward a probe.
// Reduced motion keeps the interval's final frame, including genuine occlusion gaps.
export function stepEstuary(group,{state,time=0,reduced=false,layout=estuaryLayout(state)}){
 const index=estuaryIndex(state),progress=reduced||state.stage!=='choice'?1:clamp(time/6),route=estuaryRoute(layout,index);
 if(route.length<2)return;
 for(const [i,actor] of group.entries()){
  let position;
  if(i===0)position=routeAt(route,progress);
  else{
   const anchor=['origin','algae','runnel'][i%3],base=estuaryPoint(layout,{anchor,x:((i*17)%45)-23,y:20+((i*11)%29)});
   if(!base)continue;
   const phase=i*.7+(reduced?0:time*.19),amplitude=i%2?2:0;
   position={x:base.x+Math.sin(phase)*amplitude,y:base.y+Math.cos(phase*.6)*amplitude,a:i*.85};
  }
  actor.x=position.x;actor.y=position.y;actor.a=position.a;actor.hidden=i===0&&index===3&&progress>=1;
  actor.occlusion=0;actor.lift=0;actor.posture='normal';actor.activity='crawl';
  actor.moving=!reduced&&(i===0?progress<1&&!(index===2&&progress>.8):i%2===1);
  actor.phase=(actor.seed||i)*.1+time*(actor.moving?1.4:.16);
 }
}
export function drawEstuaryWater(g,index,time=0,layout=estuaryLayout(index),reduced=false){
 const node=ESTUARY_NODES[index],t=reduced?0:time,origin=estuaryPoint(layout,{anchor:'runnel',x:0,y:0});
 if(!origin)return;
 // Particles indicate moving water, not a visible salinity boundary. Runnel rotation is editable.
 for(let i=0;i<38;i++){
  const travel=((i*19+t*node.direction*11)%132+132)%132-66;
  const point=estuaryPoint(layout,{anchor:'runnel',x:travel,y:(i*13)%62-31+Math.sin(i*.9)*4});
  if(point)pixel(g,point.x,point.y,i%5===0?2:1,1,'rgba(177,181,153,.34)');
 }
 for(let i=0;i<8;i++){
  const phase=((i*21+t*node.direction*5)%96+96)%96-48;
  const a=estuaryPoint(layout,{anchor:'runnel',x:phase,y:i*8-29});
  const b=estuaryPoint(layout,{anchor:'runnel',x:phase+7,y:i*8-29});
  if(a&&b){g.save();g.strokeStyle='rgba(137,161,145,.20)';g.lineWidth=1;g.beginPath();g.moveTo(Math.round(a.x),Math.round(a.y));g.lineTo(Math.round(b.x),Math.round(b.y));g.stroke();g.restore()}
 }
}
function mark(g,point,label,strong=false){
 if(!point)return;
 const color=strong?'rgba(226,217,168,.9)':'rgba(204,207,180,.58)';
 pixel(g,point.x-4,point.y,9,1,color);pixel(g,point.x,point.y-4,1,9,color);
 // Pixel letters avoid loading another font and stay aligned to the scenery lattice.
 const glyph=label==='P'?['1110','1001','1110','1000','1000']:['0110','1001','1001','1011','0111'];
 glyph.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='1')pixel(g,point.x+7+x,point.y-7+y,1,1,color)}));
}
function line(g,points,alpha){
 g.save();g.strokeStyle=`rgba(219,207,150,${alpha})`;g.lineWidth=1;g.setLineDash([2,3]);g.beginPath();
 points.forEach((p,i)=>i?g.lineTo(Math.round(p.x),Math.round(p.y)):g.moveTo(Math.round(p.x),Math.round(p.y)));g.stroke();g.restore();
}
export function drawEstuaryEvidence(g,state,layout=estuaryLayout(state)){
 const records=estuaryRecords(state),last=records.at(-1),method=last?.lens;
 mark(g,estuaryPoint(layout,{anchor:'origin',x:0,y:14}),'P',method==='site'||method==='compare');
 mark(g,estuaryPoint(layout,{anchor:'algae',x:0,y:12}),'Q',method==='compare');
 // Draw every captured segment separately. Never connect across a gap or reveal an unchosen route.
 for(const record of records){
  if(!record.evidence?.track)continue;
  const points=record.evidence.track.points.map(point=>estuaryPoint(layout,point)).filter(Boolean);
  if(points.length>1)line(g,points,record===last ? .82 : .33);
  if(record.evidence.track.lost&&points.length){const end=points.at(-1);pixel(g,end.x-2,end.y-2,4,1,'rgba(219,207,150,.8)')}
 }
}
