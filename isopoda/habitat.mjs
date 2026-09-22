import {habitatConfig} from './habitats.mjs';
import {drawAquaticWater,stepAquatic} from './scenery/aquatic.mjs?v=locomotion-1';
import {bindPointerInteraction} from './interaction.mjs?v=environment-memory-1';
import {createReactions,actionFocus,drawReactionBubbles} from './reactions.mjs?v=aquatic-1';
import {environmentFor} from './environment.mjs?v=aquatic-1';
import {makeIndividuals,stageIndividuals,stepIndividuals} from './behaviors-speed.mjs?v=locomotion-1';
import {encounterById,responseMode} from './encounters.mjs?v=narrative-pool-2';
import {pixelAnatomy,renderModel,exuviaPixels} from './sprites.mjs?v=swim-1';
import {speciesById} from './species-registry.mjs?v=locomotion-1';
import {drawBaseScene,drawLeaf,DEFAULT_LAYOUT,drawSceneBackground,drawSceneElement,sceneObjects,layoutForHabitat,isAnimatedSceneElement} from './scenery/index.mjs?v=motion-2';
import {ACTOR_SCALE} from './scenery/grammar.mjs';
// Anatomy and scenery share the same integer world lattice.
export const SCENE_PIXEL=1;
const SCENE_ACTOR_SCALE=ACTOR_SCALE,SCENE_OUTPUT_SCALE=1;

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
const overlay=document.createElement('canvas');overlay.width=384;overlay.height=430;const overlayCtx=overlay.getContext('2d'),reactions=createReactions();
const ctx=world.getContext('2d');ctx.imageSmoothingEnabled=false;
const sceneryCanvas=document.createElement('canvas');sceneryCanvas.width=384;sceneryCanvas.height=430;
const sceneryCtx=sceneryCanvas.getContext('2d');sceneryCtx.imageSmoothingEnabled=false;let sceneryKey='';
let aquaticPlan=null,aquaticPlanKey='';
function offscreen(){
 const c=document.createElement('canvas');c.width=384;c.height=430;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return [c,g];
}
function buildAquaticPlan(layout){
 const [background,backgroundCtx]=offscreen();drawSceneBackground(backgroundCtx,layout);
 const steps=[];let layerCanvas=null,layerCtx=null,layerHasInk=false;
 const flush=()=>{if(layerCanvas&&layerHasInk)steps.push({canvas:layerCanvas});layerCanvas=null;layerCtx=null;layerHasInk=false};
 for(const item of sceneObjects(layout).sort((a,b)=>(a.z||0)-(b.z||0))){
  if(isAnimatedSceneElement(item)){flush();steps.push({item});continue}
  if(!layerCanvas)[layerCanvas,layerCtx]=offscreen();
  drawSceneElement(layerCtx,item);layerHasInk=true;
 }
 flush();return {background,steps};
}
function drawAquaticLayout(time){
 const layout=layoutForHabitat(state),key=(state.habitatId||'freshwater')+':'+layout.background.seed+':'+layout.objects.length;
 if(!aquaticPlan||aquaticPlanKey!==key){aquaticPlan=buildAquaticPlan(layout);aquaticPlanKey=key}
 ctx.drawImage(aquaticPlan.background,0,0);
 for(const step of aquaticPlan.steps){
  if(step.canvas)ctx.drawImage(step.canvas,0,0);
  else drawSceneElement(ctx,step.item,{time,motion:reduced?.22:1});
 }
}
let state=getState(),critters=[],last=0,active=false,effect=null,frame=0,encounter=null,elapsed=0,empty=false,shelterHeld=false;
const camera={zoom:1,x:192,y:215},reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function encounterForScene(scene){
 const base=encounterById(scene?.encounter);if(!base)return null;
 return {...base,place:Array.isArray(scene?.encounterPlace)?scene.encounterPlace:base.place,specimenId:scene?.moltVisual?.specimen||scene?.specimen||null};
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
function heartBurst(){if(empty||!critters.length)return;reactions.burst(critters,'♡',elapsed);drawHabitat(performance.now())}
function present(){
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 const w=Math.max(80,Math.round(rect.width*SCENE_OUTPUT_SCALE)),h=Math.max(80,Math.round(rect.height*SCENE_OUTPUT_SCALE));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 display.imageSmoothingEnabled=false;
 const view=cameraWindow(rect.width,rect.height,camera.zoom,camera.x,camera.y),{scale,sw,sh,sx,sy}=view;camera.x=view.x;camera.y=view.y;
 overlayCtx.clearRect(0,0,overlay.width,overlay.height);overlayCtx.drawImage(world,0,0);drawReactionBubbles(overlayCtx,reactions.active,critters,elapsed,view,reduced);display.clearRect(0,0,w,h);display.drawImage(overlay,sx,sy,sw,sh,0,0,w,h);
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
  const config=habitatConfig(getState());if(config.aquatic&&!config.wood)return null;
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
  if(shelterHeld){shelterHeld=false;effect=null;drawHabitat(performance.now());return}
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
function tick(t){if(!active)return;if(!document.hidden&&t-last>66){const dt=Math.min(.1,(t-last)/1000);state=getState();elapsed+=dt;(habitatConfig(state).aquatic?stepAquatic:stepIndividuals)(critters,{encounter,state,time:elapsed,dt,reaction:effect&&elapsed<effect.until?{...effect,age:elapsed-effect.start}:null,reduced});reactions.update(critters,{encounter,state,time:elapsed,reaction:effect&&elapsed<effect.until?{...effect,age:elapsed-effect.start}:null});drawHabitat(t);last=t}frame=requestAnimationFrame(tick)}
function px(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
function drawHabitat(t){
 const w=world.width,h=world.height;ctx.clearRect(0,0,w,h);
 const memory=environmentFor(state);
 const lifted=shelterHeld||!!(effect&&elapsed<effect.until&&['lift','direct-lift'].includes(effect.id));
 const sceneryOptions={wetZones:memory.wetZones||[],light:DEFAULT_LAYOUT.background.params.light,shelterLift:lifted?-12:0,seed:DEFAULT_LAYOUT.background.seed};
 const aquatic=habitatConfig(state).aquatic;
 if(aquatic)drawAquaticLayout(elapsed);
 else{
  const nextSceneryKey=JSON.stringify(sceneryOptions);
  if(nextSceneryKey!==sceneryKey){sceneryCtx.clearRect(0,0,sceneryCanvas.width,sceneryCanvas.height);drawBaseScene(sceneryCtx,sceneryOptions);sceneryKey=nextSceneryKey}
  ctx.drawImage(sceneryCanvas,0,0);
 }

 for(const mark of memory.scuffs||[])for(let i=0;i<8;i++)px(ctx,mark.x-18+i*5,mark.y+i%2*2,3,1,'rgba(108,84,58,.55)');

 // Pre-existing and newly-added leaves share the exact same renderer.
 for(const l of memory.leaves||[]){
  const hash=Math.abs(Math.round(l.x*17+l.y*31+l.a*100)),variant=hash%6,tone=(hash>>2)%4;
  const size=.68+(hash%6)*.055;
  drawLeaf(ctx,{x:l.x,y:l.y,a:l.a+((hash%7)-3)*.045,variant,scale:size,tone,gap:!!l.gap,age:l.age||0,seed:hash});
 }

 for(const food of memory.foodNodes||[]){
  if(food.amount>0)for(let y=0;y<10;y+=2)for(let x=0;x<Math.min(20,8+food.amount*5);x+=2)px(ctx,food.x+x-8,food.y+y-5,2,2,y>6?'#80683f':'#c3a46b');
 }
 for(const shell of memory.shells||[])drawMoltShell(shell);

 // Spraying has an immediate visible response now that scenery is on the same canvas layer.
 if(!reduced&&effect&&elapsed<effect.until&&['mist','wet-left','wet-all'].includes(effect.id)){
  const wide=effect.id==='wet-all',span=wide?350:102,origin=wide?12:8;
  for(let i=0;i<30;i++){
   const x=origin+(i*37)%span,y=(i*67+t*.07)%420;
   px(ctx,x,y,1+(i%3===0),2,'rgba(151,177,157,.82)');
   if(i%5===0)px(ctx,x+2,y+3,1,1,'rgba(190,205,184,.62)');
  }
  ctx.fillStyle=wide?'rgba(54,73,61,.055)':'rgba(48,78,62,.075)';
  if(wide)ctx.fillRect(0,0,w,h);else ctx.fillRect(0,0,112,h);
 }

 if(state.light<55){ctx.fillStyle=`rgba(15,27,21,${(55-state.light)/120})`;ctx.fillRect(0,0,w,h)}
 ctx.strokeStyle='rgba(147,148,124,.55)';ctx.lineWidth=2;ctx.strokeRect(1,1,w-2,h-2);
 if(aquatic)drawAquaticWater(ctx,state,reduced?0:elapsed,{drawPlants:false});
 drawActors();
 present();
}
// Keep anatomy pixels untouched. The habitat only places a dark duplicate beneath each rendered animal.
function drawActorUnderlay(cells){
 for(const [x,y] of cells)px(ctx,x+1,y+2,1,1,'rgba(20,24,18,.46)');
}
function drawActors(){
 for(const actor of [...critters].sort((a,b)=>Number(a.interactionState?.mode==='grabbed')-Number(b.interactionState?.mode==='grabbed'))){if(actor.hidden){actor.hitCells=[];continue;}
  const phase=Math.floor(actor.phase)%4,key=[actor.posture,actor.molt,phase,actor.moving].join(':');
  let source=actor.pixels.get(key);
  if(!source){source=new Map();for(const part of pixelAnatomy(actor.model,{posture:actor.posture,molt:actor.molt,phase,moving:actor.moving}))for(const [x,y,color] of part.cells)source.set(x+','+y,color);actor.pixels.set(key,source);if(actor.pixels.size>40)actor.pixels.delete(actor.pixels.keys().next().value)}
  if(actor.interactionState?.mode==='grabbed')px(ctx,actor.x-7,actor.y+8,14,2,'#252b21');
  actor.hitCells=sceneActorPixels(source,actor);
  drawActorUnderlay(actor.hitCells);
  for(const [x,y,color] of actor.hitCells)px(ctx,x,y,1,1,color);
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
new ResizeObserver(()=>drawHabitat(0)).observe(canvas);
return {reset,stage,react,heartBurst,zoom,zoomBy:d=>zoom(camera.zoom+d),home:()=>{camera.x=192;camera.y=215;return zoom(1)},start:()=>{if(!active){active=true;last=performance.now();frame=requestAnimationFrame(tick)}},stop:()=>{interaction.cancel();active=false;cancelAnimationFrame(frame)},visible:()=>critters.filter(c=>!c.hidden).length};
}
