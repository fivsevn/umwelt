import {isShore,shorePoint,shoreWalkLabel} from './data/habitats/estuary-shore.mjs';
import {shoreWalkPose} from './scenery/estuary-shore.mjs';
// Blocky forefoot, inward arch and separate heel, sampled after rotation.
function footprints(canvas,angle){
 const g=canvas.getContext('2d');canvas.width=52;canvas.height=48;g.imageSmoothingEnabled=false;
 const sole=['00111100','01111110','11111111','11111111','11111111','11111111','11111111','11111111','11111110','11111100','11111000','11111000','00000000','00000000','01111100','01111100','01111100','01111100','00111000'];
 const cells=new Set(),turn=angle+Math.PI/2,c=Math.cos(turn),sn=Math.sin(turn);
 for(let y=1;y<47;y++)for(let x=1;x<51;x++){
  const dx=x-26,dy=y-24,u=dx*c+dy*sn,v=-dx*sn+dy*c;
  for(const [ox,oy,mirror] of [[-9,5,false],[6,-5,true]]){
   let sx=Math.floor(u-ox+4),sy=Math.floor(v-oy+9);if(mirror)sx=7-sx;
   if(sy>=0&&sy<sole.length&&sx>=0&&sx<8&&sole[sy][sx]==='1')cells.add(x+','+y);
  }
 }
 // A dark upper lip and a sunlit lower rim make the marks sink into the mud.
 for(const key of cells){const [x,y]=key.split(',').map(Number);g.fillStyle='#a69b77';g.fillRect(x+1,y+1,1,1);}
 for(const key of cells){const [x,y]=key.split(',').map(Number);g.fillStyle=!cells.has(x+','+(y-1))||!cells.has((x-1)+','+y)?'#354233':'#566047';g.fillRect(x,y,1,1);}
}
export function createShoreControls(previous,next){
 const buttons=[[previous,-1],[next,1]],viewport=previous.parentElement;let currentPoint=1;
 // Navigation stays at the unzoomed view positions, independently of camera pan/zoom.
 const position=()=>{
  const r=viewport.getBoundingClientRect(),scale=Math.max(1,r.width/384),sw=r.width/scale,sh=r.height/scale;
  if(!sw||!sh)return;
  for(const [button,direction] of buttons){const {x,y}=shoreWalkPose(currentPoint,direction);button.style.left=(direction<0?10:90)+'%';button.style.top=Math.max(26,Math.min(80,(y-(215-sh/2))/sh*100+12))+'%';}
 };
 new ResizeObserver(position).observe(viewport);
 for(const [button,direction] of buttons){const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');const label=document.createElement('span');label.className='shore-walk-label';label.dataset.directLocale='true';button.replaceChildren(canvas,label)}
 return (state,lang)=>{
  currentPoint=shorePoint(state);position();
  for(const [button,direction] of buttons){
   const canvas=button.querySelector('canvas'),point=shorePoint(state);if(canvas.dataset.point!==String(point)){footprints(canvas,shoreWalkPose(point,direction).angle);canvas.dataset.point=String(point)}
   const outside=shorePoint(state)+direction<0||shorePoint(state)+direction>2;
   button.hidden=!isShore(state)||outside;button.disabled=outside;
   const label=shoreWalkLabel(state,direction,lang);button.querySelector('span').textContent=label;button.setAttribute('aria-label',label);button.title=label;
  }
 };
}
