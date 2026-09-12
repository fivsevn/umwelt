import {makeIndividuals,stageIndividuals,stepIndividuals} from './behaviors.mjs?v=projection-7';
import {encounterById,responseMode} from './encounters.mjs?v=pixel-life-6';
import {makeIsopod,setIsopodState} from './sprites.mjs?v=projection-7';
import {speciesById} from './species.mjs?v=projection-7';
export function cameraWindow(width,height,zoom=1,x=192,y=215){
 const scale=Math.max(1,width/384)*zoom,sw=width/scale,sh=height/scale;
 x=Math.max(sw/2,Math.min(384-sw/2,x));y=Math.max(sh/2,Math.min(430-sh/2,y));
 return {scale,sw,sh,x,y,sx:x-sw/2,sy:y-sh/2};
}
export function createHabitat(canvas,layer,getState){
const display=canvas.getContext('2d'),world=document.createElement('canvas');world.width=384;world.height=430;
const ctx=world.getContext('2d');ctx.imageSmoothingEnabled=false;
let state=getState(),critters=[],last=0,active=false,effect=null,frame=0,encounter=null,elapsed=0,empty=false;
const camera={zoom:1,x:192,y:215},reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function reset(options={}){
 state=getState();empty=!!options.empty;layer.replaceChildren();const p=speciesById(state.species);elapsed=0;effect=null;
 critters=empty?[]:makeIndividuals(state.seed,p.speed).map(c=>{const el=makeIsopod(p,{stage:c.stage,seed:c.seed});el.style.position='absolute';el.style.left='0';el.style.top='0';layer.append(el);return {...c,el}});
 encounter=empty?null:encounterById(state.scene?.encounter);stageIndividuals(critters,encounter,{initial:true});drawHabitat(0);
}
function stage(scene){encounter=encounterById(scene.encounter);elapsed=0;effect=null;stageIndividuals(critters,encounter);if(encounter){[camera.x,camera.y]=encounter.place}drawHabitat(0)}
function react(id){effect={id,mode:responseMode(id),start:elapsed,until:elapsed+10}}
function present(){
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 const w=Math.max(80,Math.round(rect.width/2)),h=w;
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 display.imageSmoothingEnabled=false;
 const view=cameraWindow(rect.width,rect.height,camera.zoom,camera.x,camera.y),{scale,sw,sh,sx,sy}=view;camera.x=view.x;camera.y=view.y;display.drawImage(world,sx,sy,sw,sh,0,0,w,h);
 const scaleX=scale,scaleY=scale;
 for(const c of critters){const x=(c.x-sx)*scaleX,y=(c.y-sy)*scaleY;const offscreen=x< -50||y< -50||x>rect.width+50||y>rect.height+50;c.el.style.visibility=c.hidden||offscreen?'hidden':'visible';setIsopodState(c.el,{posture:c.posture,molt:c.molt,moving:active&&!c.hidden&&!offscreen&&c.moving&&!reduced,phase:c.phase,angle:c.a,occlusion:c.occlusion,occlusionSide:['under','gather'].includes(c.activity)?'front':'rear'});c.el.dataset.activity=c.activity||'rest';c.el.classList.toggle('grooming',active&&c.groom&&!c.hidden&&!offscreen&&!reduced);c.el.style.transform='translate('+Math.round(x)+'px,'+Math.round(y+(c.lift||0))+'px) translate(-50%,-50%) scale('+scale*c.size+')'}
}
function zoom(z){camera.zoom=Math.max(1,Math.min(3,z));present();return camera.zoom}
document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const c of critters){setIsopodState(c.el,{posture:c.posture,molt:c.molt,moving:false,phase:c.phase,angle:c.a,occlusion:c.occlusion,occlusionSide:['under','gather'].includes(c.activity)?'front':'rear'});c.el.classList.remove('grooming')}});
let pointer=null;
canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!pointer)return;const r=canvas.getBoundingClientRect();camera.x-=(e.clientX-pointer.x)/(Math.max(1,r.width/384)*camera.zoom);camera.y-=(e.clientY-pointer.y)/(Math.max(1,r.width/384)*camera.zoom);pointer={x:e.clientX,y:e.clientY};present()});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>pointer=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(camera.zoom+(e.deltaY<0?.25:-.25));const label=document.querySelector('#zoomLevel');if(label)label.textContent=camera.zoom.toFixed(1)+'×'},{passive:false});
function tick(t){if(!active)return;if(!document.hidden&&t-last>50){const dt=Math.min(.1,(t-last)/1000);state=getState();elapsed+=dt;stepIndividuals(critters,{encounter,state,time:elapsed,dt,reaction:effect&&elapsed<effect.until?{...effect,age:elapsed-effect.start}:null,reduced});drawHabitat(t);last=t}frame=requestAnimationFrame(tick)}
function px(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,Math.max(2,Math.round(w/2)*2),Math.max(2,Math.round(h/2)*2))}
function drawHabitat(t){
  const w=world.width,h=world.height;ctx.fillStyle="#443729";ctx.fillRect(0,0,w,h);
  // Soil aggregates use clustered cells, not isolated uniform confetti.
  for(let i=0;i<900;i++){const x=(i*67+i%9*11)%w,y=(i*113+i%7*19)%h;
   const shades=['#3a3025','#4b3c2c','#54432f','#302b22','#665039'];
   px(ctx,x,y,4+i%3*2,2+i%2*2,shades[i%5]);
   if(i%4===0)px(ctx,x+2,y+4,4,2,'#392f24');
  }
  // wet patch
  for(let y=8;y<422;y+=4){const edge=72+Math.round(18*Math.sin(y*.04)+12*Math.sin(y*.09));px(ctx,8,y,edge,4,state.humidity>70?"#344637":"#45432f")}for(let i=0;i<40;i++)px(ctx,(i*31)%75,30+(i*47)%370,3,2,"#60705a");
  scenery(t);
  // leaves
  leaf(ctx,275,110,-.45,"#917b45");leaf(ctx,290,344,.35,"#745936");if(state.cover>65||effect&&elapsed<effect.until&&effect.id==='leaf')leaf(ctx,90,315,-.15,"#a4824d");
  // bark shelter
  bark(190,215-(effect&&elapsed<effect.until&&effect.id==='lift'?12:0));
  if(state.food){px(ctx,315,252,13,10,"#ba9b62");px(ctx,327,258,8,7,"#d0af70")}
  if(encounter&&['shell','molt'].includes(encounter.motion)){const [x,y]=encounter.place;px(ctx,x-20,y+10,7,4,'#c9c4a8');px(ctx,x-18,y+8,4,2,'#aaa990')}
  if(state.light<35){ctx.fillStyle='rgba(15,27,21,.16)';ctx.fillRect(0,0,w,h)}
  if(!reduced&&effect&&elapsed<effect.until&&['mist','wet-left','wet-all'].includes(effect.id))for(let i=0;i<18;i++){const x=12+(i*29)%(effect.id==='wet-all'?350:82),y=(i*71+t*.05)%420;px(ctx,x,y,2,3,'#91a994')}
  ctx.fillStyle="rgba(210,214,183,.07)";ctx.fillRect(4,4,w-8,h-8);ctx.strokeStyle="#93947c";ctx.lineWidth=4;ctx.strokeRect(2,2,w-4,h-4);
  present();
}
// Rasterize each rotated leaf directly onto the world grid; no antialiased paths.
function leaf(c,x,y,a,color,scale=1){
 const ca=Math.cos(a),sa=Math.sin(a),length=49*scale,width=25*scale;
 const radius=Math.ceil(length+width);
 for(let yy=-radius;yy<=radius;yy+=2)for(let xx=-radius;xx<=radius;xx+=2){
  const u=xx*ca+yy*sa,v=-xx*sa+yy*ca,t=u/length;
  if(Math.abs(t)>1)continue;
  const rim=width*Math.pow(Math.max(0,1-t*t),.72)*(1+.10*Math.sin(Math.floor(u/scale/5)*2));
  if(Math.abs(v)>rim)continue;
  const nick=Math.floor(u/scale/7);if(nick%5===0&&v>rim-4*scale)continue;
  let ink=color;
  if(v>rim-3*scale)ink='#4b3b28';
  else if(v< -rim+3*scale)ink='#ab8b50';
  else if(Math.abs(v)<1.5*scale)ink='#c0a06a';
  else if(Math.abs((u+Math.abs(v)*1.5)%(13*scale))<2*scale)ink='#594631';
  else if((Math.floor(u/3)+Math.floor(v/3))%9===0)ink='#79603b';
  px(c,x+xx,y+yy,2,2,ink);
 }
 for(let i=0;i<7*scale;i+=2)px(c,x-ca*(length+i),y-sa*(length+i),2,2,'#998057');
}
function bark(x,y){
 // A dark mouth under a torn slab, with chipped ends and layered cork ridges.
 for(let row=-34;row<=38;row+=2)for(let col=-70;col<=70;col+=2){
  const edge=66-((Math.floor((row+34)/8)%3)*2);
  if(Math.abs(col)>edge||row< -30&&Math.abs(col)>50)continue;
  const grain=Math.floor((row+col*.12)/6),chip=(Math.floor(col/8)+grain*3)%11;
  const shades=['#443326','#715337','#8b6842','#60462f','#503b29'];
  const ink=row>27?'#24281e':row< -26?'#9b7950':chip===0?'#372d23':shades[((grain%5)+5)%5];
  px(ctx,x+col,y+row,2,2,ink);
  if(col%18===0&&row> -24&&row<22)px(ctx,x+col,y+row,2,4,'#3c3025');
 }
 for(let i=0;i<11;i++)px(ctx,x-59+i*12,y+34+(i%3)*2,6,4,'#29291f');
}

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
  for(let i=0;i<14;i++){leaf(ctx,35+(i*91)%320,30+(i*63)%365,i*.8,["#897246","#a08750","#645336"][i%3],.22+(i%3)*.08)}
  // Small fern rosettes, kept to the damp side.
  for(const [x,y] of [[52,60],[40,330],[323,382]])for(let i=0;i<6;i++)for(let j=0;j<9;j++){
    const a=i*Math.PI/3,xx=x+Math.cos(a)*j*3,yy=y+Math.sin(a)*j*3;
    px(ctx,xx,yy,3,3,"#768253");if(j%2===0){px(ctx,xx-4,yy,5,2,"#4f6940");px(ctx,xx,yy-3,5,2,"#627b49")}
  }
}

new ResizeObserver(()=>drawHabitat(0)).observe(canvas);
return {reset,stage,react,zoom,zoomBy:d=>zoom(camera.zoom+d),home:()=>{camera.x=192;camera.y=215;return zoom(1)},start:()=>{if(!active){active=true;last=performance.now();frame=requestAnimationFrame(tick)}},stop:()=>{active=false;cancelAnimationFrame(frame);for(const c of critters){setIsopodState(c.el,{posture:c.posture,molt:c.molt,moving:false,phase:c.phase,angle:c.a,occlusion:c.occlusion,occlusionSide:['under','gather'].includes(c.activity)?'front':'rear'});c.el.classList.remove('grooming')}},visible:()=>critters.filter(c=>!c.hidden).length};
}
