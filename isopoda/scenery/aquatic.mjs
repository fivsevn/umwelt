import {stepInteraction} from '../interaction.mjs?v=touchhold-1';
import {habitatConfig} from '../habitats.mjs';
import {drawStone,drawBark,drawLeaf,drawMossPatch} from './index.mjs?v=forest-10';
const noise=(x,y,seed=0)=>{let n=Math.imul(x+seed+1,374761393)^Math.imul(y+1,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
const pixel=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
export function drawAquaticBase(g,s){
 const h=habitatConfig(s),p=h.palette,seed=s.seed%991;
 for(let y=0;y<430;y+=2)for(let x=0;x<384;x+=2){const n=noise(x>>1,y>>1,seed),wave=Math.sin(x*.024+y*.013)+Math.sin(y*.031);pixel(g,x,y,2,2,p[n%43===0?3:wave>.8&&n%3===0?2:n%3===0?1:0])}
 // Reuse the established irregular, textured stone renderer.
 for(let i=0;i<h.rocks;i++){const x=22+noise(i,2,seed)%340,y=30+noise(i,4,seed)%370;drawStone(g,{x,y,scale:h.tides?2.3+(i%3)*.6:.8+(i%3)*.5,variant:i%4,seed:i+31});
  if(h.tides)for(let b=0;b<13;b++){const bx=x-17+noise(i,b)%35,by=y-14+noise(b,i)%25;pixel(g,bx,by,4,3,'#b0af91');pixel(g,bx+1,by+1,2,2,'#535e56')}
 }
 if(h.wood){drawBark(g,{x:168,y:247,a:.43,scale:1.06,variant:2,seed:57});drawMossPatch(g,{x:62,y:125,rx:34,ry:55,seed:11,alpha:.7});
  for(let i=0;i<6;i++)drawLeaf(g,{x:60+i*49,y:85+(i*71)%285,a:i*.8,scale:.48,variant:i%6,seed:32+i,tone:2});
 }
 for(let i=0;i<Math.round(s.detritus*2);i++){const n=noise(i,8,seed);pixel(g,n%380,(n>>>10)%426,1+i%3,1,p[3])}
}
export function plantAnchor(h,i){return {x:18+(i*83)%350,y:96+(i*97)%318}}
export function drawAquaticWater(g,s,time=0){
 const h=habitatConfig(s),surface=h.tides?Math.round(360-s.tide*3.35):0;
 // Water is transparent stippling with stepped ripples, never a smooth gradient.
 for(let y=surface;y<430;y+=4)for(let x=0;x<384;x+=4)if(noise(x,y)%4===0)pixel(g,x,y,2,1,'rgba(80,133,126,.13)');
 const count=Math.max(3,Math.round(h.plants*(s.algae/70)));
 for(let i=0;i<count;i++){const a=plantAnchor(h,i),len=h.wood?35+i%4*16:h.tides?24+i%4*10:70+i%5*20;
  for(let j=0;j<len;j+=2){const sway=Math.sin(j*.04+time*.7+i)*j*.12*(s.flow/65),x=a.x+sway,y=a.y-j;
   const width=h.wood?3:h.tides?5:5+Math.round(Math.sin(j*.11+i)**2*9);
   pixel(g,x,y,width,3,j%8<4?'#5d7148':'#435b3c');pixel(g,x+1,y,1,2,'#8b9460');
   if(h.wood&&j%8===0)pixel(g,x-5,y+2,10,2,'#617b50');
  }
 }
 if(h.tides){for(let x=0;x<384;x+=3){const y=surface+Math.round(Math.sin(x*.07+time)*3);pixel(g,x,y,3,1,'#9db9a4');if(x%12===0)pixel(g,x+2,y+5,5,1,'#6f948b')}}
 const particles=30+Math.round(s.detritus*.5);for(let i=0;i<particles;i++){const n=noise(i,37,s.seed),x=(n%384+time*s.flow*.085)%384,y=surface+((n>>>12)%Math.max(1,430-surface));pixel(g,x,y,i%7===0?2:1,1,i%3?'#889a79':'#b1bc95')}
 if(s.light>45)for(let i=0;i<8;i++){const x=20+i*49+Math.round(Math.sin(time*.6+i)*5),y=35+(i*67)%340;pixel(g,x,y,18+i%3*6,1,'rgba(202,217,158,.23)');pixel(g,x+9,y+3,8,1,'rgba(202,217,158,.13)')}
}
export function stepAquatic(group,{state:s,time,dt,reduced}){
 const h=habitatConfig(s),speed=Math.min(64,Math.max(1,Number(globalThis.__ISOPODA_HABITAT_SPEED__)||1));
 for(const a of group){if(stepInteraction(a,dt))continue;
  const mode=h.motion[(a.id+Math.floor(time/9))%h.motion.length];a.activity=mode;a.hidden=false;a.occlusion=0;a.posture='normal';a.molt='none';a.moving=mode!=='cling';
  if(reduced)continue;
  a.phase+=dt*speed*(mode==='swim'?9:3);
  if(mode==='cling'){const target=plantAnchor(h,a.id%h.plants);a.x+=(target.x-a.x)*dt*.22;a.y+=(target.y-22-a.y)*dt*.22}
  const flow=s.flow/100,rate=mode==='swim'?10:mode==='drift'?6:mode==='cling'?.4:3;
  a.a+=Math.sin(time*.3+a.id)*dt*.25;
  a.x=Math.max(20,Math.min(362,a.x+(Math.cos(a.a)*rate+flow*2)*dt*speed));
  a.y=Math.max(h.tides?Math.max(25,355-s.tide*3.2):25,Math.min(405,a.y+Math.sin(a.a)*rate*dt*speed));
  if(a.x>=361||a.x<=21||a.y>=404)a.a+=Math.PI*.6;
 }
}
