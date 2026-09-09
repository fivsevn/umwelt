import {makeIsopod,setIsopodState} from './sprites.mjs?v=morphology-4';
import {speciesById} from './species.mjs?v=morphology-4';
export function createHabitat(canvas,layer,getState){
const display=canvas.getContext('2d'),world=document.createElement('canvas');world.width=384;world.height=430;
const ctx=world.getContext('2d');ctx.imageSmoothingEnabled=false;
let state=getState(),critters=[],last=0,active=false,effect=null,frame=0;
const camera={zoom:1,x:192,y:215},reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function reset(){
 state=getState();layer.replaceChildren();const p=speciesById(state.species);
 critters=Array.from({length:12},(_,i)=>{const el=makeIsopod(p,{stage:['S','M','L'][i%3],seed:state.seed+':'+i});el.style.position='absolute';el.style.left='0';el.style.top='0';layer.append(el);return {el,x:45+(i*71)%300,y:65+(i*97)%320,a:i*.9,speed:(.12+(i%4)*.025)*p.speed,pause:i*6,turn:20+i*7,hidden:false,size:.95+(i%2)*.05}});
}
function react(id){
 effect={id,until:performance.now()+6000};
 for(const c of critters){c.turn=1;c.pause=['lift','mist','wet-all'].includes(id)?24:3}
 if(id==='shadow'||id==='patient'){critters[0].x=115;critters[0].y=166;critters[0].hidden=false}
}
function updateCritter(c,i,t){
 c.turn--;c.pause--;
 const p=speciesById(state.species);
 if(c.turn<0){let targetX=state.humidity<p.wet?65:state.humidity>85?270:190,targetY=state.food>0&&i%3===0?252:215;
  if(effect&&t<effect.until){if(['edge','air'].includes(effect.id))targetX=335;if(['shadow','leaf','gap'].includes(effect.id))targetX=180;if(effect.id.startsWith('route')&&i===0){targetX=state.scene.target==='湿苔'?65:state.scene.target==='木片'?190:290;targetY=state.scene.target==='叶缘'?344:215}}
  c.a=Math.atan2(targetY-c.y,targetX-c.x)+Math.sin(t*.0008+i)*1.9;c.turn=50+i*6}
 if(c.pause<0&&!reduced){c.x+=Math.cos(c.a)*c.speed*2;c.y+=Math.sin(c.a)*c.speed*2}
 if(c.pause<-85)c.pause=20+i%4*10;
 c.x=Math.max(18,Math.min(365,c.x));c.y=Math.max(18,Math.min(410,c.y));
 const shelter=c.x>122&&c.x<252&&c.y>184&&c.y<243;
 c.hidden=shelter&&Math.sin(t*.00025+i)>((100-state.cover)/100);
 c.posture=c.pause>15&&state.light>65?'curled':c.pause>0?'resting':'normal';
}
function present(){
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 const w=Math.max(80,Math.round(rect.width/2)),h=Math.max(60,Math.round(rect.height/2));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 display.imageSmoothingEnabled=false;
 const fit=Math.max(w/384,h/430),sw=w/(fit*camera.zoom),sh=h/(fit*camera.zoom);
 camera.x=Math.max(sw/2,Math.min(384-sw/2,camera.x));camera.y=Math.max(sh/2,Math.min(430-sh/2,camera.y));
 const sx=camera.x-sw/2,sy=camera.y-sh/2;display.drawImage(world,sx,sy,sw,sh,0,0,w,h);
 const scale=rect.width/sw;
 for(const c of critters){const x=(c.x-sx)*scale,y=(c.y-sy)*scale;const offscreen=x< -50||y< -50||x>rect.width+50||y>rect.height+50;c.el.style.visibility=c.hidden||offscreen?'hidden':'visible';setIsopodState(c.el,{posture:c.posture,moving:active&&!c.hidden&&!offscreen&&c.pause<=0&&!reduced});c.el.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px) translate(-50%,-50%) rotate('+c.a+'rad) scale('+scale*c.size+')'}
}
function zoom(z){camera.zoom=Math.max(1,Math.min(3,z));present();return camera.zoom}
document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const c of critters)c.el.classList.remove('moving')});
let pointer=null;
canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!pointer)return;const r=canvas.getBoundingClientRect(),scale=Math.max(r.width/384,r.height/430)*camera.zoom;camera.x-=(e.clientX-pointer.x)/scale;camera.y-=(e.clientY-pointer.y)/scale;pointer={x:e.clientX,y:e.clientY};present()});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>pointer=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(camera.zoom+(e.deltaY<0?.25:-.25));document.querySelector('#zoomLevel').textContent=camera.zoom.toFixed(1)+'×'},{passive:false});
function tick(t){if(!active)return;if(!document.hidden&&t-last>50){state=getState();drawHabitat(t);last=t}frame=requestAnimationFrame(tick)}
function px(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)}
function drawHabitat(t){
  const w=world.width,h=world.height;ctx.fillStyle="#443729";ctx.fillRect(0,0,w,h);
  for(let i=0;i<165;i++){const x=(i*67)%w,y=(i*113)%h;px(ctx,x,y,(i%3)+2,(i%2)+2,i%5===0?"#6f5940":"#342a21")}
  // wet patch
  for(let y=8;y<422;y+=4){const edge=72+Math.round(18*Math.sin(y*.04)+12*Math.sin(y*.09));px(ctx,8,y,edge,4,state.humidity>70?"#344637":"#45432f")}for(let i=0;i<40;i++)px(ctx,(i*31)%75,30+(i*47)%370,3,2,"#60705a");
  scenery(t);
  // leaves
  leaf(ctx,275,110,-.45,"#917b45");leaf(ctx,290,344,.35,"#745936");if(state.cover>65)leaf(ctx,90,315,-.15,"#a4824d");
  // bark shelter
  ctx.save();ctx.translate(190,215);ctx.rotate(-.09);ctx.fillStyle="#5a412b";ctx.fillRect(-68,-36,136,72);ctx.fillStyle="#76583a";ctx.fillRect(-64,-32,128,8);for(let i=-55;i<60;i+=18)px(ctx,i,-20,8,46,i%36?"#4b3527":"#6b4d33");ctx.restore();
  if(state.food){px(ctx,315,252,13,10,"#ba9b62");px(ctx,327,258,8,7,"#d0af70")}
  critters.forEach((c,i)=>updateCritter(c,i,t));
  if(state.light<35){ctx.fillStyle='rgba(15,27,21,.16)';ctx.fillRect(0,0,w,h)}
  if(effect&&t<effect.until&&['mist','wet-left','wet-all'].includes(effect.id))for(let i=0;i<18;i++){const x=12+(i*29)%(effect.id==='wet-all'?350:82),y=(i*71+t*.05)%420;px(ctx,x,y,2,3,'#91a994')}
  ctx.fillStyle="rgba(210,214,183,.07)";ctx.fillRect(4,4,w-8,h-8);ctx.strokeStyle="#93947c";ctx.lineWidth=4;ctx.strokeRect(2,2,w-4,h-4);
  present();
}
function leaf(c,x,y,a,color){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=color;c.beginPath();c.moveTo(-50,0);c.lineTo(-22,-23);c.lineTo(14,-29);c.lineTo(45,-10);c.lineTo(50,15);c.lineTo(14,27);c.lineTo(-24,20);c.closePath();c.fill();c.strokeStyle="#4d402a";c.lineWidth=3;c.beginPath();c.moveTo(-47,0);c.lineTo(46,2);c.stroke();for(let n=-25;n<35;n+=15){c.beginPath();c.moveTo(n,1);c.lineTo(n+13,n<0?-17:18);c.stroke()}c.restore()}

function scenery(t){
  // Irregular moss carpet, pebbles, roots and leaf litter.
  for(let i=0;i<600;i++){const x=(i*67)%384,y=(i*83)%430;
    if(x<65+28*Math.sin(y*.03)||y>370+15*Math.sin(x*.05)){
      px(ctx,x,y,5+i%5,3+i%3,["#39472e","#4b5837","#607044","#748052"][i%4]);
      if(i%7===0)px(ctx,x+2,y-2,2,2,"#92996b");
    }
  }
  for(let i=0;i<38;i++){const x=30+(i*73)%330,y=25+(i*119)%380;
    px(ctx,x,y,8,5,"#2d2d23");px(ctx,x,y-2,6,4,["#77715a","#67694f","#8b8167"][i%3]);px(ctx,x+1,y-2,2,1,"#a19b7d");
  }
  for(let i=0;i<60;i++){const x=275+Math.sin(i*.07)*30,y=20+i*5;px(ctx,x,y,5,7,"#302a20");px(ctx,x+1,y,2,5,"#705338");if(i%5===0)for(let j=0;j<8;j++)px(ctx,x-j*3,y+j,4,2,"#5e4830")}
  for(let i=0;i<14;i++){ctx.save();ctx.translate(35+(i*91)%320,30+(i*63)%365);ctx.scale(.22+(i%3)*.08,.24);leaf(ctx,0,0,i*.8,["#897246","#a08750","#645336"][i%3]);ctx.restore()}
  // Small fern rosettes, kept to the damp side.
  for(const [x,y] of [[52,60],[40,330],[323,382]])for(let i=0;i<6;i++)for(let j=0;j<9;j++){
    const a=i*Math.PI/3,xx=x+Math.cos(a)*j*3,yy=y+Math.sin(a)*j*3;
    px(ctx,xx,yy,3,3,"#768253");if(j%2===0){px(ctx,xx-4,yy,5,2,"#4f6940");px(ctx,xx,yy-3,5,2,"#627b49")}
  }
}

return {reset,react,zoom,zoomBy:d=>zoom(camera.zoom+d),home:()=>{camera.x=192;camera.y=215;return zoom(1)},start:()=>{if(!active){active=true;frame=requestAnimationFrame(tick)}},stop:()=>{active=false;cancelAnimationFrame(frame);for(const c of critters)c.el.classList.remove('moving')},visible:()=>critters.filter(c=>!c.hidden).length};
}
