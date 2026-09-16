import {bindPointerInteraction} from './interaction.mjs?v=pointer-1';
import {createReactions,actionFocus,drawReactionBubbles} from './reactions.mjs?v=bubbles-1';
import {environmentFor} from './environment.mjs?v=cohort-4';
import {makeIndividuals,stageIndividuals,stepIndividuals} from './behaviors.mjs?v=pointer-1';
import {encounterById,responseMode} from './encounters.mjs?v=cohort-4';
import {pixelAnatomy,renderModel} from './sprites.mjs?v=cohort-4';
import {speciesById} from './species.mjs?v=cohort-4';
// Habitat scenery and specimens share one world unit per visible pixel.
export const SCENE_PIXEL=1;
const SCENE_ACTOR_SCALE=.94;
export function sceneActorPixels(source,actor){
 const cells=new Map(),size=SCENE_ACTOR_SCALE*actor.model.growth.scale,ca=Math.cos(actor.a),sa=Math.sin(actor.a);
 const centerX=Math.round(actor.x),centerY=Math.round(actor.y+(actor.lift||0));
 const front=['under','gather'].includes(actor.activity);
 for(const [key,color] of source){
  const comma=key.indexOf(','),sx=Number(key.slice(0,comma)),sy=Number(key.slice(comma+1));
  if(actor.occlusion>0&&(front?sx>24-actor.occlusion*49:sx< -24+actor.occlusion*49))continue;
  const ox=sx*size,oy=sy*size;
  const x=Math.round(centerX+ox*ca-oy*sa),y=Math.round(centerY+ox*sa+oy*ca);
  cells.set(x+','+y,[x,y,color]);
 }
 return [...cells.values()];
}
export function cameraWindow(width,height,zoom=1,x=192,y=215){
 const scale=Math.max(1,width/384)*zoom,sw=width/scale,sh=height/scale;
 x=Math.max(sw/2,Math.min(384-sw/2,x));y=Math.max(sh/2,Math.min(430-sh/2,y));
 return {scale,sw,sh,x,y,sx:x-sw/2,sy:y-sh/2};
}
export function createHabitat(canvas,layer,getState){
const display=canvas.getContext('2d'),world=document.createElement('canvas');world.width=384;world.height=430;
const overlay=document.createElement('canvas');overlay.width=384;overlay.height=430;const overlayCtx=overlay.getContext('2d'),reactions=createReactions();
const ctx=world.getContext('2d');ctx.imageSmoothingEnabled=false;
let state=getState(),critters=[],last=0,active=false,effect=null,frame=0,encounter=null,elapsed=0,empty=false;
const camera={zoom:1,x:192,y:215},reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function reset(options={}){
 interaction.cancel();state=getState();empty=!!options.empty;layer.replaceChildren();elapsed=0;effect=null;reactions.reset();
 critters=empty?[]:makeIndividuals(state.cohort).map(c=>({...c,interaction:speciesById(c.species).interaction,model:renderModel(speciesById(c.species).visual,{stage:c.stage,seed:c.seed}),pixels:new Map()}));
 canvas.dataset.specimens=String(critters.length);canvas.dataset.taxa=[...new Set(critters.map(c=>c.species))].join(',');
 encounter=empty?null:encounterById(state.scene?.encounter);stageIndividuals(critters,encounter,{initial:true});drawHabitat(0);
}
function stage(scene){interaction.cancel();encounter=encounterById(scene.encounter);elapsed=0;effect=null;reactions.reset();stageIndividuals(critters,encounter);if(encounter){[camera.x,camera.y]=encounter.place}drawHabitat(0)}
function react(id){state=getState();const point=actionFocus(id,state,encounter);const selected=[...critters].sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y)).slice(0,2).map(c=>c.id);effect={id,selected,mode:responseMode(id),start:elapsed,until:elapsed+10};drawHabitat(performance.now())}
function present(){
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 const w=Math.max(80,Math.round(rect.width)),h=Math.max(80,Math.round(rect.height));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 display.imageSmoothingEnabled=false;
 const view=cameraWindow(rect.width,rect.height,camera.zoom,camera.x,camera.y),{scale,sw,sh,sx,sy}=view;camera.x=view.x;camera.y=view.y;overlayCtx.drawImage(world,0,0);drawReactionBubbles(overlayCtx,reactions.active,critters,elapsed,view,reduced);display.drawImage(overlay,sx,sy,sw,sh,0,0,w,h);
 layer.hidden=true;
}
function zoom(z){camera.zoom=Math.max(1,Math.min(3,z));present();return camera.zoom}

const interaction=bindPointerInteraction(canvas,{
 enabled:()=>active&&!empty,
 worldPoint:event=>{
  const r=canvas.getBoundingClientRect(),view=cameraWindow(r.width,r.height,camera.zoom,camera.x,camera.y);
  return {x:view.sx+(event.clientX-r.left)/view.scale,y:view.sy+(event.clientY-r.top)/view.scale};
 },
 hitTest:point=>[...critters].reverse().find(actor=>!actor.hidden&&actor.hitCells?.some(([x,y])=>point.x>=x-3&&point.x<=x+4&&point.y>=y-3&&point.y<=y+4)),
 pan:(dx,dy)=>{
  const r=canvas.getBoundingClientRect(),scale=Math.max(1,r.width/384)*camera.zoom;
  camera.x-=dx/scale;camera.y-=dy/scale;present();
 },
 draw:()=>drawHabitat(performance.now())
});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(camera.zoom+(e.deltaY<0?.25:-.25));const label=document.querySelector('#zoomLevel');if(label)label.textContent=camera.zoom.toFixed(1)+'×'},{passive:false});
function tick(t){if(!active)return;if(!document.hidden&&t-last>50){const dt=Math.min(.1,(t-last)/1000);state=getState();elapsed+=dt;stepIndividuals(critters,{encounter,state,time:elapsed,dt,reaction:effect&&elapsed<effect.until?{...effect,age:elapsed-effect.start}:null,reduced});reactions.update(critters,{encounter,state,time:elapsed,reaction:effect&&elapsed<effect.until?{...effect,age:elapsed-effect.start}:null});drawHabitat(t);last=t}frame=requestAnimationFrame(tick)}
function px(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
function drawHabitat(t){
 const w=world.width,h=world.height;ctx.fillStyle="#443729";ctx.fillRect(0,0,w,h);
 // Broad loam shapes stay quiet; a second one-pixel pass supplies the finer grain.
 for(let yy=0;yy<h;yy+=2)for(let xx=0;xx<w;xx+=2){
  const n=Math.sin(xx*.031+Math.sin(yy*.023))*Math.cos(yy*.042)+Math.sin((xx+yy)*.018)*.45;
  if(n>.65)px(ctx,xx,yy,2,2,'#51422f');else if(n<-.65)px(ctx,xx,yy,2,2,'#302e25');
 }
 for(let i=0;i<570;i++){const x=(i*67+i%9*11)%w,y=(i*113+i%7*19)%h;
  const shades=['#3d3429','#483c2e','#514331','#352f26','#5d4b36'];
  px(ctx,x,y,3+i%4,1+i%3,shades[i%5]);
  if(i%4===0)px(ctx,x+1,y+3,3,1,'#392f24');
 }
 for(let i=0;i<1050;i++){const x=(i*97+(i%13)*17)%w,y=(i*149+(i%11)*23)%h,v=(i*37+x+y)%17;
  if(v<5)px(ctx,x,y,1,1,['#625039','#574630','#2f2d24','#756047','#454033'][v]);
  if(v===6)px(ctx,x+1,y,2,1,'#352f26');
 }
 const memory=environmentFor(state);
 for(const z of memory.wetZones)for(let y=8;y<422;y+=2)for(let x=8;x<376;x+=2){
  const radius=.5+z.moisture/100,edge=((x-z.x)/(z.rx*radius))**2+((y-z.y)/(z.ry*radius))**2;
  if(edge<1+(Math.sin(y*.13)+Math.cos(x*.2))*.08){px(ctx,x,y,2,2,z.moisture>65?'#293d31':z.moisture>35?'#34402f':'#404030');if((x+y)%10===0)px(ctx,x+1,y,1,1,'#50604a')}
 }
 scenery(t);
 for(const mark of memory.scuffs)for(let i=0;i<12;i++)px(ctx,mark.x-30+i*5,mark.y+i%3*2,3,1,'#69543a');
 for(const l of memory.leaves){
  if(l.gap)for(let x=-30;x<32;x+=2)px(ctx,l.x+x,l.y+15,1,5,'#202c22');
  leaf(ctx,l.x,l.y,l.a,l.age>8?'#745936':'#a4824d',1-Math.min(l.age,20)*.006);
 }
 bark(memory.shelter.x,memory.shelter.y-(effect&&elapsed<effect.until&&effect.id==='lift'?12:0));
 for(const f of memory.foodNodes){
  for(let i=0;i<7;i++)px(ctx,f.x-9+i*3,f.y+10+i%2*3,1,1,'#806a42');
  if(f.amount>0)for(let y=0;y<12;y++)for(let x=0;x<Math.min(22,8+f.amount*6);x++){if((x+y+f.age*2)%17<3)continue;px(ctx,f.x+x-8,f.y+y-6,1,1,y>8?'#8b7043':y%3===0?'#d1b578':'#c6a86d')}
 }
 if(encounter&&!memory.removedShells.includes(encounter.id)&&['shell','molt'].includes(encounter.motion)){const [x,y]=encounter.place;px(ctx,x-20,y+10,7,3,'#c9c4a8');px(ctx,x-18,y+8,4,1,'#aaa990');px(ctx,x-15,y+11,1,1,'#f1ecd0')}
 if(state.light<55){ctx.fillStyle=`rgba(15,27,21,${(55-state.light)/120})`;ctx.fillRect(0,0,w,h)}
 if(!reduced&&effect&&elapsed<effect.until&&['mist','wet-left','wet-all'].includes(effect.id))for(let i=0;i<18;i++){const x=12+(i*29)%(effect.id==='wet-all'?350:82),y=(i*71+t*.05)%420;px(ctx,x,y,1,2,'#91a994')}
 ctx.fillStyle="rgba(210,214,183,.055)";ctx.fillRect(3,3,w-6,h-6);ctx.strokeStyle="#93947c";ctx.lineWidth=3;ctx.strokeRect(1.5,1.5,w-3,h-3);
 drawActors();
 present();
}
// Use the original anatomy pixels directly; habitat projection only rotates and lightly reduces them.
function drawActors(){
 for(const actor of [...critters].sort((a,b)=>Number(a.interactionState?.mode==='grabbed')-Number(b.interactionState?.mode==='grabbed'))){if(actor.hidden){actor.hitCells=[];continue;}
  const phase=reduced?0:Math.floor(actor.phase)%4,key=[actor.posture,actor.molt,phase,actor.moving].join(':');
  let source=actor.pixels.get(key);
  if(!source){source=new Map();for(const part of pixelAnatomy(actor.model,{posture:actor.posture,molt:actor.molt,phase,moving:actor.moving}))for(const [x,y,color] of part.cells)source.set(x+','+y,color);actor.pixels.set(key,source);if(actor.pixels.size>40)actor.pixels.delete(actor.pixels.keys().next().value)}
  if(actor.interactionState?.mode==='grabbed')px(ctx,actor.x-7,actor.y+8,14,2,'#252b21');
  actor.hitCells=sceneActorPixels(source,actor);
  for(const [x,y,color] of actor.hitCells)px(ctx,x,y,1,1,color);
 }
}
// Leaves use the same one-pixel lattice as the animals, with no antialiasing.
function leaf(c,x,y,a,color,scale=1){
 const ca=Math.cos(a),sa=Math.sin(a),length=49*scale,width=25*scale;
 const radius=Math.ceil(length+width);
 for(let yy=-radius;yy<=radius;yy++)for(let xx=-radius;xx<=radius;xx++){
  const u=xx*ca+yy*sa,v=-xx*sa+yy*ca,t=u/length;
  if(Math.abs(t)>1)continue;
  const rim=width*Math.pow(Math.max(0,1-t*t),.72)*(1+.10*Math.sin(Math.floor(u/Math.max(.3,scale)/5)*2));
  if(Math.abs(v)>rim)continue;
  const nick=Math.floor(u/Math.max(.3,scale)/7);if(nick%5===0&&v>rim-2*Math.max(.5,scale))continue;
  let ink=color;
  if(v>rim-1.4*Math.max(.5,scale))ink='#4b3b28';
  else if(v< -rim+1.4*Math.max(.5,scale))ink='#ab8b50';
  else if(Math.abs(v)<.8*Math.max(.6,scale))ink='#c0a06a';
  else if(Math.abs((u+Math.abs(v)*1.5)%(13*Math.max(.45,scale)))<1.1*Math.max(.5,scale))ink='#594631';
  else if((Math.floor(u/2)+Math.floor(v/2))%11===0)ink='#79603b';
  else if(v<0&&Math.abs(v)<rim*.6)ink='#9b804b';
  if(t>.15&&t<.35&&v>rim*.45&&v<rim*.7)continue;
  px(c,x+xx,y+yy,1,1,ink);
 }
 for(let i=0;i<7*scale;i++)px(c,x-ca*(length+i),y-sa*(length+i),1,1,'#998057');
}
function bark(x,y){
 // Fallen cork keeps its old silhouette, but grain and torn edges resolve at one-pixel detail.
 for(let row=-38;row<=40;row++)for(let col=-72;col<=72;col++){
  const cap=Math.sqrt(Math.max(0,1-(col/74)**2)),top=-30*cap-4*Math.sin(col*.12),bottom=29*cap+4*Math.sin(col*.19);
  if(row<top||row>bottom+8)continue;
  if(row>bottom){px(ctx,x+col,y+row,1,1,'#1d281f');continue}
  const groove=row+3*Math.sin(col*.055)+2*Math.sin(col*.17),band=Math.floor(groove/7);
  let ink=['#6d5035','#77593a','#5c442f','#81613f'][((band%4)+4)%4];
  if(row<top+2)ink='#ad8954';
  else if(row>bottom-3)ink='#433426';
  else if(Math.abs(groove%7)<.9)ink='#3e3125';
  else if(Math.abs(groove%7)>5.6&&col%10!==0)ink='#917049';
  if((col*17+row*31)%47===0)ink='#b08a58';
  if(Math.abs(col)>60&&row%5===0)ink='#3b3025';
  px(ctx,x+col,y+row,1,1,ink);
 }
 for(let yy=-8;yy<=8;yy++)for(let xx=-12;xx<=12;xx++){const d=(xx/12)**2+(yy/8)**2;if(d<1)px(ctx,x+18+xx,y-4+yy,1,1,d>.65?'#9a764a':d>.28?'#4b3727':'#322d22')}
 for(let i=0;i<20;i++){px(ctx,x-40+i,y+8+Math.round(Math.sin(i*.4)*2),2,1,'#342d23');if(i<10)px(ctx,x+40+i,y-12,1,1,'#423225')}
}

function scenery(t){
 // Moss, stones, roots and litter now include one-pixel highlights while retaining the old composition.
 for(let i=0;i<420;i++){const x=(i*67)%384,y=(i*83)%430;
  if(x<65+28*Math.sin(y*.03)||y>370+15*Math.sin(x*.05)){
   px(ctx,x,y,3+i%4,1+i%3,["#39472e","#4b5837","#607044","#748052"][i%4]);px(ctx,x-1,y+2,3,1,"#435333");
   if(i%7===0)px(ctx,x+1,y-1,1,1,"#a3a77a");
  }
 }
 for(let i=0;i<38;i++){const x=30+(i*73)%330,y=25+(i*119)%380;
  px(ctx,x,y,8,5,"#2d2d23");px(ctx,x,y-2,6,3,["#77715a","#67694f","#8b8167"][i%3]);px(ctx,x+1,y-2,1,1,"#b4ad8a");px(ctx,x+5,y+1,1,1,'#4a493b');
 }
 for(let i=0;i<60;i++){const x=275+Math.sin(i*.07)*30,y=20+i*5;px(ctx,x,y,4,6,"#302a20");px(ctx,x+1,y,1,5,"#705338");if(i%5===0)for(let j=0;j<8;j++)px(ctx,x-j*3,y+j,3,1,"#5e4830")}
 for(let i=0;i<14;i++)leaf(ctx,35+(i*91)%320,30+(i*63)%365,i*.8,["#897246","#a08750","#645336"][i%3],.22+(i%3)*.08);
 for(const [x,y] of [[52,60],[40,330],[323,382]])for(let i=0;i<6;i++)for(let j=0;j<9;j++){
  const a=i*Math.PI/3,xx=x+Math.cos(a)*j*3,yy=y+Math.sin(a)*j*3;
  px(ctx,xx,yy,2,2,"#768253");if(j%2===0){px(ctx,xx-3,yy,4,1,"#4f6940");px(ctx,xx,yy-2,4,1,"#627b49")}if(j%3===0)px(ctx,xx+1,yy-1,1,1,'#9ba173');
 }
}

new ResizeObserver(()=>drawHabitat(0)).observe(canvas);
return {reset,stage,react,zoom,zoomBy:d=>zoom(camera.zoom+d),home:()=>{camera.x=192;camera.y=215;return zoom(1)},start:()=>{if(!active){active=true;last=performance.now();frame=requestAnimationFrame(tick)}},stop:()=>{interaction.cancel();active=false;cancelAnimationFrame(frame)},visible:()=>critters.filter(c=>!c.hidden).length};
}
