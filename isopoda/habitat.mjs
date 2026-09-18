import {bindPointerInteraction} from './interaction.mjs?v=environment-memory-1';
import {createReactions,actionFocus,drawReactionBubbles} from './reactions.mjs?v=bubbles-1';
import {environmentFor} from './environment.mjs?v=molt-sequence-1';
import {makeIndividuals,stageIndividuals,stepIndividuals} from './behaviors.mjs?v=appendage-2';
import {encounterById,responseMode} from './encounters.mjs?v=narrative-pool-2';
import {pixelAnatomy,renderModel,exuviaPixels} from './sprites.mjs?v=exuvia-1';
import {speciesById} from './species.mjs?v=cohort-4';
// Habitat scenery and specimens share one world lattice, but scenery is allowed to sit one visual step behind the specimens.
export const SCENE_PIXEL=1;
const SCENE_ACTOR_SCALE=.88,SCENE_OUTPUT_SCALE=.76,BACKGROUND_SCALE=.72;
const LEAF_PALETTES=[
 ['#5a422c','#7a5935','#a17c48','#c09b5c','#3e3428'],
 ['#67482f','#8d6238','#b4864d','#d0a567','#433126'],
 ['#4d402d','#6d5a39','#92804d','#b6a066','#38362b'],
 ['#6a5232','#927343','#bea05e','#d4b875','#473a29'],
 ['#463a2c','#67513a','#806545','#a38158','#322f28'],
 ['#594333','#75563b','#98734b','#b79261','#3b322b']
];
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
export function createHabitat(canvas,layer,getState,onDirectInteraction=()=>{}){
const display=canvas.getContext('2d'),world=document.createElement('canvas');world.width=384;world.height=430;
const backdrop=document.createElement('canvas');backdrop.width=Math.round(world.width*BACKGROUND_SCALE);backdrop.height=Math.round(world.height*BACKGROUND_SCALE);
const backdropCtx=backdrop.getContext('2d');backdropCtx.imageSmoothingEnabled=false;
const overlay=document.createElement('canvas');overlay.width=384;overlay.height=430;const overlayCtx=overlay.getContext('2d'),reactions=createReactions();
const ctx=world.getContext('2d');ctx.imageSmoothingEnabled=false;
let state=getState(),critters=[],last=0,active=false,effect=null,frame=0,encounter=null,elapsed=0,empty=false,shelterHeld=false;
const camera={zoom:1,x:192,y:215},reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function encounterForScene(scene){
 const base=encounterById(scene?.encounter);if(!base)return null;
 return {...base,place:Array.isArray(scene?.encounterPlace)?scene.encounterPlace:base.place,specimenId:base.motion==='molt'?scene?.moltVisual?.specimen:null};
}
function placeSceneMolt(scene){
 const molt=scene?.moltVisual;if(!molt)return;
 const actor=critters.find(c=>c.specimenId===molt.specimen);if(!actor)return;
 actor.x=molt.x;actor.y=molt.y;actor.a=molt.a||0;actor.posture='molting';actor.molt=molt.phase||'posterior';actor.moving=false;actor.hidden=false;actor.occlusion=0;
}
function reset(options={}){
 interaction.cancel();state=getState();empty=!!options.empty;layer.replaceChildren();elapsed=0;effect=null;shelterHeld=false;reactions.reset();
 critters=empty?[]:makeIndividuals(state.cohort).map(c=>({...c,interaction:speciesById(c.species).interaction,model:renderModel(speciesById(c.species).visual,{stage:c.stage,seed:c.seed}),pixels:new Map()}));
 canvas.dataset.specimens=String(critters.length);canvas.dataset.taxa=[...new Set(critters.map(c=>c.species))].join(',');
 encounter=empty?null:encounterForScene(state.scene);stageIndividuals(critters,encounter,{initial:true});if(!empty)placeSceneMolt(state.scene);drawHabitat(0);
}
function stage(scene){interaction.cancel();encounter=encounterForScene(scene);elapsed=0;effect=null;shelterHeld=false;reactions.reset();stageIndividuals(critters,encounter);placeSceneMolt(scene);if(encounter){[camera.x,camera.y]=encounter.place}drawHabitat(0)}
function react(id){state=getState();const point=actionFocus(id,state,encounter);const selected=[...critters].sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y)).slice(0,2).map(c=>c.id);effect={id,selected,mode:responseMode(id),start:elapsed,until:elapsed+10};drawHabitat(performance.now())}
function present(){
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 // Specimens lose only one display step; the backdrop is separately coarsened before they are composited.
 const w=Math.max(80,Math.round(rect.width*SCENE_OUTPUT_SCALE)),h=Math.max(80,Math.round(rect.height*SCENE_OUTPUT_SCALE));
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
 objectHitTest:point=>{
  const env=environmentFor(getState()),shell=[...(env.shells||[])].reverse().find(item=>Math.hypot(point.x-item.x,point.y-item.y)<15);
  if(shell)return {kind:'shell',id:shell.id};
  if(point.x>=env.shelter.x-88&&point.x<=env.shelter.x+90&&point.y>=env.shelter.y-48&&point.y<=env.shelter.y+62)return {kind:'shelter'};
  return null;
 },
 objectHoldStart:(object,point)=>{
  state=getState();
  if(object.kind==='shell'){
   onDirectInteraction({type:'collect',shell:object.id,point});
   effect={id:'shell-collect',selected:[],mode:'quiet',start:elapsed,until:elapsed+.8,point};
  }else if(object.kind==='shelter'){
   shelterHeld=true;const env=environmentFor(state),origin={x:env.shelter.x,y:env.shelter.y};
   const selected=[...critters].sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)).slice(0,4).map(actor=>actor.id);
   effect={id:'direct-lift',selected,mode:'disturb',start:elapsed,until:elapsed+4,point:origin};
   onDirectInteraction({type:'lift',point:origin});
  }
 },
 objectHoldEnd:object=>{if(object.kind==='shelter')shelterHeld=false},
 groundTap:point=>{
  const selected=[...critters].sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y)).slice(0,3).map(actor=>actor.id);
  effect={id:'ground-tap',selected,mode:'disturb',start:elapsed,until:elapsed+3.2,point};
  onDirectInteraction({type:'ground',point});
 },
 pan:(dx,dy)=>{
  const r=canvas.getBoundingClientRect(),scale=Math.max(1,r.width/384)*camera.zoom;
  camera.x-=dx/scale;camera.y-=dy/scale;present();
 },
 draw:()=>drawHabitat(performance.now()),
 report:event=>onDirectInteraction({type:event.type,specimen:event.actor?.specimenId||null,point:event.point||null})
});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(camera.zoom+(e.deltaY<0?.25:-.25));const label=document.querySelector('#zoomLevel');if(label)label.textContent=camera.zoom.toFixed(1)+'×'},{passive:false});
function tick(t){if(!active)return;if(!document.hidden&&t-last>50){const dt=Math.min(.1,(t-last)/1000);state=getState();elapsed+=dt;stepIndividuals(critters,{encounter,state,time:elapsed,dt,reaction:effect&&elapsed<effect.until?{...effect,age:elapsed-effect.start}:null,reduced});reactions.update(critters,{encounter,state,time:elapsed,reaction:effect&&elapsed<effect.until?{...effect,age:elapsed-effect.start}:null});drawHabitat(t);last=t}frame=requestAnimationFrame(tick)}
function px(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
function coarsenScenery(){
 backdropCtx.clearRect(0,0,backdrop.width,backdrop.height);backdropCtx.drawImage(world,0,0,backdrop.width,backdrop.height);
 ctx.clearRect(0,0,world.width,world.height);ctx.imageSmoothingEnabled=false;ctx.drawImage(backdrop,0,0,backdrop.width,backdrop.height,0,0,world.width,world.height);
}
function soilMoisture(zones){
 for(const z of zones)for(let y=8;y<422;y+=2)for(let x=8;x<376;x+=2){
  const wet=Math.max(0,Math.min(1,z.moisture/100)),radius=.5+wet;
  const edge=((x-z.x)/(z.rx*radius))**2+((y-z.y)/(z.ry*radius))**2;
  const ripple=(Math.sin(y*.13)+Math.cos(x*.2))*.08;
  if(edge>=1+ripple)continue;
  const grain=Math.abs((x*19+y*31+Math.floor(z.x*7)+Math.floor(z.y*11))%29);
  const cover=.44+wet*.42;if(grain/29>cover)continue;
  const palette=wet>.66?['#302d27','#353028','#393329','#2c3029','#3e372c']:wet>.36?['#3b342b','#40372d','#453b30','#35332b','#493d31']:['#463b30','#4b4033','#514536','#40382e','#574938'];
  let ink=palette[grain%palette.length];
  if(wet>.58&&grain%17===0)ink='#304137';
  else if(wet>.72&&grain%23===0)ink='#263a32';
  px(ctx,x,y,2,2,ink);
  if(wet>.55&&grain%13===0)px(ctx,x+1,y,1,1,'#55604a');
 }
}
function drawHabitat(t){
 const w=world.width,h=world.height;ctx.fillStyle="#443729";ctx.fillRect(0,0,w,h);
 // Loam remains brown first; moisture is a darker soil pass instead of a separate green terrain layer.
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
 soilMoisture(memory.wetZones);
 scenery(t);
 for(const mark of memory.scuffs)for(let i=0;i<12;i++)px(ctx,mark.x-30+i*5,mark.y+i%3*2,3,1,'#69543a');
 for(const l of memory.leaves){
  if(l.gap)for(let x=-30;x<32;x+=2)px(ctx,l.x+x,l.y+15,1,5,'#202c22');
  const hash=Math.abs(Math.round(l.x*17+l.y*31+l.a*100)),variant=hash%6,tone=(hash>>2)%LEAF_PALETTES.length;
  const size=(.62+(hash%7)*.085)*(1-Math.min(l.age,20)*.006),angle=l.a+((hash%9)-4)*.11;
  leaf(ctx,l.x,l.y,angle,variant,size,tone);
 }
 const shelterY=memory.shelter.y-((shelterHeld||(effect&&elapsed<effect.until&&effect.id==='lift'))?12:0);
 // Larger crossed slabs fill the central shelter footprint while retaining two distinct pieces.
 bark(memory.shelter.x+8,shelterY-4,-.12,0,1.38);
 bark(memory.shelter.x-58,memory.shelter.y+40,.10,1,.92);
 for(const f of memory.foodNodes){
  for(let i=0;i<7;i++)px(ctx,f.x-9+i*3,f.y+10+i%2*3,1,1,'#806a42');
  if(f.amount>0)for(let y=0;y<12;y++)for(let x=0;x<Math.min(22,8+f.amount*6);x++){if((x+y+f.age*2)%17<3)continue;px(ctx,f.x+x-8,f.y+y-6,1,1,y>8?'#8b7043':y%3===0?'#d1b578':'#c6a86d')}
 }
 for(const shell of memory.shells||[])drawMoltShell(shell);
 if(state.light<55){ctx.fillStyle=`rgba(15,27,21,${(55-state.light)/120})`;ctx.fillRect(0,0,w,h)}
 if(!reduced&&effect&&elapsed<effect.until&&['mist','wet-left','wet-all'].includes(effect.id))for(let i=0;i<18;i++){const x=12+(i*29)%(effect.id==='wet-all'?350:82),y=(i*71+t*.05)%420;px(ctx,x,y,1,2,'#91a994')}
 ctx.fillStyle="rgba(210,214,183,.055)";ctx.fillRect(3,3,w-6,h-6);ctx.strokeStyle="#93947c";ctx.lineWidth=3;ctx.strokeRect(1.5,1.5,w-3,h-3);
 coarsenScenery();
 drawActors();
 present();
}
// Use the original anatomy pixels directly; habitat projection only rotates and lightly reduces them.
function drawActors(){
 for(const actor of [...critters].sort((a,b)=>Number(a.interactionState?.mode==='grabbed')-Number(b.interactionState?.mode==='grabbed'))){if(actor.hidden){actor.hitCells=[];continue;}
  const phase=Math.floor(actor.phase)%4,key=[actor.posture,actor.molt,phase,actor.moving].join(':');
  let source=actor.pixels.get(key);
  if(!source){source=new Map();for(const part of pixelAnatomy(actor.model,{posture:actor.posture,molt:actor.molt,phase,moving:actor.moving}))for(const [x,y,color] of part.cells)source.set(x+','+y,color);actor.pixels.set(key,source);if(actor.pixels.size>40)actor.pixels.delete(actor.pixels.keys().next().value)}
  if(actor.interactionState?.mode==='grabbed')px(ctx,actor.x-7,actor.y+8,14,2,'#252b21');
  actor.hitCells=sceneActorPixels(source,actor);
  for(const [x,y,color] of actor.hitCells)px(ctx,x,y,1,1,color);
 }
}
// Fallen leaves use broad readable silhouettes, a strong midrib and a few broken margins.
function leaf(c,x,y,a,variant=0,scale=1,tone=0){
 const palette=LEAF_PALETTES[tone%LEAF_PALETTES.length],ca=Math.cos(a),sa=Math.sin(a);
 const lengths=[45,48,44,41,47,43],widths=[22,12,24,25,20,17],length=lengths[variant%6]*scale,width=widths[variant%6]*scale;
 const plot=(u,v,color,w=1,h=1)=>px(c,x+u*ca-v*sa,y+u*sa+v*ca,w,h,color);
 const rimAt=t=>{
  const q=Math.max(0,1-Math.abs(t)),base=width*Math.pow(q,.55);
  if(variant===1)return base*.54*(.92+.08*Math.cos(t*Math.PI*3));
  if(variant===2)return base*(.72+.24*Math.abs(Math.sin((t+.05)*Math.PI*3.2)));
  if(variant===3){const p=(t+1)/2;return width*Math.pow(Math.max(0,Math.sin(p*Math.PI)),.42)*(.52+.58*p)}
  if(variant===4)return base*(.86+.12*Math.cos((t+.18)*Math.PI*2.2));
  if(variant===5)return base*(.68+.18*Math.sin((t+.1)*Math.PI*2.6));
  return base*(.92+.07*t);
 };
 const radius=Math.ceil(length+width+4);
 for(let yy=-radius;yy<=radius;yy++)for(let xx=-radius;xx<=radius;xx++){
  const u=xx*ca+yy*sa,v=-xx*sa+yy*ca,t=u/length;if(t<-1||t>1)continue;
  let rim=rimAt(t);if(Math.abs(v)>rim)continue;
  const side=Math.sign(v)||1,edge=rim-Math.abs(v),band=Math.floor((t+1)*12);
  // Missing pieces stay on the perimeter: no internal pinholes or swiss-cheese texture.
  if(variant===2&&edge<3*scale&&band%4===1&&side>0)continue;
  if(variant===3&&t>.58&&edge<4*scale&&Math.abs(v)<rim*.42)continue;
  if(variant===4&&edge<3.2*scale&&((band===3&&side<0)||(band===8&&side>0)))continue;
  if(variant===5&&edge<2.8*scale&&band%5===2)continue;
  let ink=palette[1];
  if(edge<1.5*Math.max(.55,scale))ink=palette[0];
  else if(v< -rim*.38)ink=palette[2];
  else if(Math.abs(v)<1.3*Math.max(.65,scale))ink=palette[3];
  else if(((Math.floor(u/4)+Math.floor(v/3)+variant*3)&7)===0)ink=palette[2];
  plot(u,v,ink);
 }
 // Midrib and a restrained set of lateral veins keep the leaf readable at game scale.
 for(let u=-length*.86;u<length*.82;u+=1.3)plot(u,0,palette[3]);
 const branchInk=palette[2];
 for(const t of [-.55,-.28,.02,.30,.56]){
  const u=t*length,rim=rimAt(t)*.78;
  for(const side of [-1,1]){
   const reach=rim*(variant===1?.72:.88),steps=Math.max(2,Math.round(reach));
   for(let i=1;i<steps;i+=2){const q=i/steps;plot(u+q*length*.18,side*i,branchInk)}
  }
 }
 // A short crooked petiole.
 const stem=(variant===1?10:7)*scale;
 for(let i=0;i<stem;i++)plot(-length-i,Math.sin(i*.7)*.45,palette[4]);
}
// Bark is treated like a low-resolution photo: broad tonal masses first, only a few coarse cracks on top.
function bark(x,y,a=0,variant=0,scale=1){
 const ca=Math.cos(a),sa=Math.sin(a),half=(variant===1?60:80)*scale,depth=(variant===1?25:34)*scale;
 const plot=(u,v,color,w=2,h=2)=>px(ctx,x+u*ca-v*sa,y+u*sa+v*ca,w,h,color);
 const palette=variant===0
  ?['#2f2722','#4a3428','#67462f','#825b39','#a47749','#bd9160']
  :['#302822','#49362b','#60452f','#76563a','#936b45','#ad8154'];
 const leftAt=v=>-half+(7+((v+depth)/(depth*2))*7)*scale;
 const rightAt=v=>half-(6+(1-(v+depth)/(depth*2))*8)*scale;
 // Coarse 3x3 sampling prevents any dense repetitive pattern.
 for(let vv=-depth;vv<=depth;vv+=3)for(let uu=-half;uu<=half;uu+=3){
  const left=leftAt(vv),right=rightAt(vv);if(uu<left||uu>right)continue;
  const q=(vv+depth)/(depth*2),p=(uu-left)/Math.max(1,right-left);
  const broken=(variant===0&&p>.86&&q<.20)||(variant===0&&p<.10&&q>.76)||
               (variant===1&&p<.14&&q<.24)||(variant===1&&p>.88&&q>.72);
  if(broken)continue;
  let ink;
  // Large light/dark zones imitate real uneven bark lighting rather than procedural hatching.
  if(q<.16)ink=palette[4];
  else if(q>.78)ink=palette[1];
  else if(p>.56&&q<.52)ink=palette[3];
  else ink=palette[2];
  const lightPatch=((p-.48)/.33)**2+((q-.37)/.27)**2<1;
  const darkPatch=((p-.20)/.25)**2+((q-.66)/.22)**2<1;
  if(lightPatch)ink=palette[4+(variant===0?1:0)];
  if(darkPatch)ink=palette[1];
  if(p<.06||p>.94||q<.05||q>.95)ink=palette[0];
  plot(uu,vv,ink,3,3);
 }
 // A few broad longitudinal color bands.
 const bands=variant===0?[[-55,-14,86,5,5],[-42,5,108,7,3],[-18,19,72,6,1]]:[[-42,-11,70,5,4],[-36,5,82,7,3],[2,17,50,5,1]];
 for(const [sx,sy,len,thick,tone] of bands){
  for(let i=0;i<len*scale;i+=2){
   const lift=Math.sin(i*.09+variant)*1.3*scale;
   for(let d=-thick*scale/2;d<=thick*scale/2;d+=2)plot((sx+i)*scale,sy*scale+lift+d,palette[tone],2,2);
  }
 }
 // Only three or four chunky fractures.
 const cracks=variant===0?[[-48,-2,31,.18],[5,12,34,-.13],[34,-17,23,.24]]:[[-31,-1,28,.16],[8,12,26,-.17]];
 for(const [sx,sy,len,slope] of cracks)for(let i=0;i<len*scale;i+=2)plot((sx+i)*scale,(sy+i*slope)*scale,palette[0],2,2);
 // Light exposed fibres at one broken end.
 const side=variant===0?1:-1,ex=side*(half-5*scale);
 for(let i=0;i<5;i++){
  const yy=(-depth*.46+i*depth*.23),len=(7+i%2*4)*scale;
  for(let j=0;j<len;j+=2)plot(ex+side*j,yy+j*(i%2?.11:-.08),palette[5],2,2);
 }
}
function drawMoltShell(shell){
 const specimen=state.cohort?.find(c=>c.id===shell.specimen)||state.cohort?.[0];
 const species=speciesById(specimen?.species||state.cohort?.[0]?.species||'dairy');
 const model=renderModel(species.visual,{stage:specimen?.stage||'M',seed:specimen?.seed||shell.id});
 const cells=exuviaPixels(model,{phase:shell.phase||'whole',age:shell.age||0});
 const scale=.82*model.growth.scale,ca=Math.cos(shell.a||0),sa=Math.sin(shell.a||0);
 for(const [sx,sy,color] of cells){
  const ox=sx*scale,oy=sy*scale;
  px(ctx,shell.x+ox*ca-oy*sa,shell.y+ox*sa+oy*ca,1,1,color);
 }
}
function cuttlebone(x,y,a=-.42,scale=.72){
 const ca=Math.cos(a),sa=Math.sin(a),rx=25*scale,ry=10*scale;
 const plot=(u,v,color)=>px(ctx,x+u*ca-v*sa,y+u*sa+v*ca,1,1,color);
 for(let yy=-Math.ceil(ry);yy<=Math.ceil(ry);yy++)for(let xx=-Math.ceil(rx);xx<=Math.ceil(rx);xx++){
  const d=(xx/rx)**2+(yy/ry)**2;if(d>1)continue;
  if(xx>rx*.58&&yy< -ry*.22)continue;
  const edge=d>.72,grain=Math.abs((xx*11+yy*17+37)%19);
  let ink=edge?'#8f8d7a':grain<3?'#a7a58e':'#bbb8a0';
  if(grain===7||grain===8)ink='#777866';
  plot(xx,yy,ink);
 }
 for(let i=-13;i<=13;i+=5)plot(i*scale,1*scale,'#777866');
}
function woodChip(x,y,a,kind=0,scale=1){
 const ca=Math.cos(a),sa=Math.sin(a),length=(kind===0?21:kind===1?28:17)*scale,width=(kind===2?8:6)*scale;
 for(let yy=-Math.ceil(width);yy<=Math.ceil(width);yy++)for(let xx=-Math.ceil(length);xx<=Math.ceil(length);xx++){
  const u=xx*ca+yy*sa,v=-xx*sa+yy*ca,t=u/length;if(Math.abs(t)>1)continue;
  let rim=width*(1-Math.abs(t)*.58)+(kind===1?Math.sin(u*.45)*1.3:0);if(Math.abs(v)>rim)continue;
  if(kind===2&&t>.1&&t<.35&&v>0)continue;
  let ink=Math.abs(v)<1?'#997347':v<0?'#725238':'#513d2e';
  if(Math.abs(t)>.86)ink='#352f28';
  if((Math.floor(u)+Math.floor(v)*5+kind)%17===0)ink='#9f7a4f';
  px(ctx,x+xx,y+yy,1,1,ink);
 }
}
function twig(x,y,a,len=18,shade='#5b432e'){
 const ca=Math.cos(a),sa=Math.sin(a);
 for(let i=0;i<len;i++){px(ctx,x+ca*i,y+sa*i,1,1,shade);if(i===Math.floor(len*.55))for(let j=1;j<6;j++)px(ctx,x+ca*i-sa*j,y+sa*i+ca*j,1,1,'#49372c')}
}
function sphagnumPatch(cx,cy,rx,ry,seed=0,alpha=.62){
 const greens=[
  `rgba(43,70,55,${alpha*.72})`,
  `rgba(55,91,62,${alpha*.82})`,
  `rgba(73,113,76,${alpha*.90})`,
  `rgba(96,139,91,${alpha})`,
  `rgba(128,168,112,${Math.min(.82,alpha*1.08)})`
 ];
 const topAt=xx=>{
  const n=Math.abs(xx/rx),fall=Math.pow(Math.max(0,1-n),.48);
  return -ry*fall*(.66+.13*Math.sin(xx*.085+seed)+.10*Math.sin(xx*.19+seed*1.4));
 };
 const bottomAt=xx=>{
  const n=Math.abs(xx/rx),fall=Math.max(0,1-n);
  return ry*(.24+.08*Math.sin(xx*.075+seed*.6))*fall;
 };
 // Broad translucent mass.
 for(let xx=-rx;xx<=rx;xx+=3){
  const top=topAt(xx),bottom=bottomAt(xx);if(top>=bottom)continue;
  for(let yy=Math.floor(top);yy<=bottom;yy+=3){
   const h=Math.abs((xx*29+yy*17+seed*41)%97),rel=(yy-top)/Math.max(1,bottom-top);
   const ink=rel<.23?greens[3+h%2]:rel>.72?greens[h%2]:greens[1+h%3];
   px(ctx,cx+xx,cy+yy,3,3,ink);
  }
 }
 // Large irregular crowns rather than many tiny specks.
 for(let xx=-rx+8;xx<rx-8;xx+=9){
  const top=topAt(xx),h=Math.abs((xx*13+seed*31)%9),height=4+h%8;
  for(let j=1;j<=height;j+=2)px(ctx,cx+xx,cy+top-j,3,2,greens[2+(j+h)%3]);
  if(h%2===0){px(ctx,cx+xx-4,cy+top-height+2,4,2,greens[3]);px(ctx,cx+xx+3,cy+top-height,4,2,greens[4])}
 }
 // A few detached lobes make the outline less rectangular.
 const lobes=[[-.82,-.12,.18],[.78,-.18,.20],[-.62,.18,.14],[.58,.20,.12]];
 for(const [sx,sy,s] of lobes){
  const lx=cx+rx*sx,ly=cy+ry*sy,rr=rx*s;
  for(let yy=-rr*.5;yy<=rr*.5;yy+=3)for(let xx=-rr;xx<=rr;xx+=3){
   if((xx/rr)**2+(yy/(rr*.55))**2<=1)px(ctx,lx+xx,ly+yy,3,3,greens[2+((xx+yy+seed)&1)]);
  }
 }
}
function scenery(t){
 // Two broad translucent sphagnum cushions: a large upper-left patch and a smaller lower-left patch.
 sphagnumPatch(92,104,92,64,3,.58);
 sphagnumPatch(64,344,55,34,11,.54);
 // A small cuttlebone fragment marks this as a maintained culture rather than untouched forest floor.
 cuttlebone(333,168,-.42,.72);
 // More humus flecks and tiny decomposing fragments fill negative space without becoming new focal objects.
 for(let i=0;i<95;i++){const x=18+(i*83+i%7*19)%350,y=20+(i*137+i%11*23)%392,v=(i*29+x+y)%9;px(ctx,x,y,1+v%3,1,['#2d2b24','#3a3127','#58442f','#67513a','#454033'][v%5]);if(v===1)px(ctx,x+2,y+1,1,1,'#8b7048')}
 // Pebbles stay subdued but are slightly more numerous.
 for(let i=0;i<44;i++){const x=25+(i*73)%338,y=22+(i*119)%386;
  px(ctx,x,y,7,4,'#2d2d23');px(ctx,x,y-2,5,3,['#77715a','#67694f','#8b8167'][i%3]);if(i%3===0)px(ctx,x+1,y-2,1,1,'#aaa486');
 }
 // Fine root / twig line on the right side plus scattered short twigs elsewhere.
 for(let i=0;i<58;i++){const x=278+Math.sin(i*.075)*27,y=18+i*5;px(ctx,x,y,3,5,'#302a20');px(ctx,x+1,y,1,4,'#705338');if(i%6===0)for(let j=0;j<7;j++)px(ctx,x-j*3,y+j,3,1,'#5e4830')}
 const twigs=[[91,143,.36,20],[142,336,-.62,17],[331,74,2.38,15],[234,93,-.15,22],[298,304,1.9,18],[74,261,-2.35,14],[188,386,.18,21],[347,334,-1.15,16]];
 for(const [x,y,a,len] of twigs)twig(x,y,a,len);
 // Fallen leaves have an obvious size hierarchy instead of a field of similarly tiny pieces.
 const leafSizes=[.92,.82,.74,.68,.61,.57,.52,.48,.44,.40,.36,.33,.30,.27,.24,.22,.20,.18,.16,.14];
 for(let i=0;i<leafSizes.length;i++){
  const x=28+(i*97+i%4*23+i%3*11)%332,y=24+(i*71+i%6*29+i%5*13)%378;
  const hash=(i*61+x*7+y*13)%997,variant=hash%6,tone=(hash>>3)%LEAF_PALETTES.length;
  const angle=((hash*.021+i*1.414)%6.283)-3.1415;
  leaf(ctx,x,y,angle,variant,leafSizes[i],tone);
 }
 // Small wood debris in several shapes supports the two larger shelter slabs.
 const chips=[[106,101,.55,0,.75],[337,119,-.35,1,.66],[82,382,2.55,2,.82],[258,350,-1.0,0,.6],[160,57,.15,2,.55],[320,269,2.15,1,.55],[214,42,2.82,0,.5],[47,226,-.84,1,.47],[346,365,.42,2,.6],[136,223,1.7,0,.42]];
 for(const [x,y,a,kind,s] of chips)woodChip(x,y,a,kind,s);
}

new ResizeObserver(()=>drawHabitat(0)).observe(canvas);
return {reset,stage,react,zoom,zoomBy:d=>zoom(camera.zoom+d),home:()=>{camera.x=192;camera.y=215;return zoom(1)},start:()=>{if(!active){active=true;last=performance.now();frame=requestAnimationFrame(tick)}},stop:()=>{interaction.cancel();active=false;cancelAnimationFrame(frame)},visible:()=>critters.filter(c=>!c.hidden).length};
}
