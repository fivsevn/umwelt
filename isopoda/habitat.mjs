import {isShore,shorePoint,shoreTide} from './data/habitats/estuary-shore.mjs';
import {shoreLayoutFor,shoreHeight,drawShoreBackground,drawShoreWater} from './scenery/estuary-shore.mjs';
import {createSeaweedBed,seaweedFrame,stageSeaweed,stepSeaweed,beginSeaweedHold,moveSeaweedHold,endSeaweedHold,noteSeaweedVisibility} from './scenery/shallow-marine.mjs';
import {drawKelp,hitKelp,visibleKelpCell} from './scenery/kelp-geometry.mjs';
import {drawWaterBackground} from './scenery/aquatic-materials.mjs';
import {createPetriOptics} from './scenery/petri-optics.mjs';
import {microscope,beginPetriStep,noteMicroscopeAction,confinePetri} from './scenery/petri.mjs';
import {stageSand,buriedAt,uncoverSand,drawSandMarks,sandVisibleCells,sandPose,sandShore} from './scenery/sandy-surf.mjs';
import {isEstuaryObservation,estuaryIndex} from './data/narrative/estuary.mjs';
import {estuaryLayout} from './scenery/estuary-stages.mjs';
import {stepEstuary,drawEstuaryWater,drawEstuaryEvidence} from './scenery/estuary.mjs';
import {stageGroundwater} from './scenery/groundwater.mjs';
import {GROUNDWATER_OBSERVATIONS,groundwaterObservationIndex} from './data/habitats/groundwater-observation.mjs';
import {habitatConfig} from './habitats.mjs';
import {drawAquaticWater,stepAquatic} from './scenery/aquatic.mjs';
import {bindPointerInteraction} from './interaction.mjs';
import {createReactions,actionFocus,drawReactionBubbles} from './reactions.mjs';
import {environmentFor} from './environment.mjs';
import {makeIndividuals,stageIndividuals,stepIndividuals} from './behaviors-speed.mjs';
import {encounterById,responseMode} from './encounters.mjs';
import {pixelAnatomy,renderModel,exuviaPixels} from './sprites.mjs';
import {speciesById} from './species-registry.mjs';
import {drawBaseScene,drawLeaf,DEFAULT_LAYOUT,drawSceneBackground,drawSceneElement,sceneObjects,layoutForHabitat,isAnimatedSceneElement} from './scenery/index.mjs';
import {freshwaterLayout} from './scenery/freshwater-stages.mjs';
import {ACTOR_SCALE} from './scenery/grammar.mjs';
// Anatomy and scenery share the same integer world lattice.
export const SCENE_PIXEL=1;
const SCENE_ACTOR_SCALE=ACTOR_SCALE,SCENE_OUTPUT_SCALE=1;

export function sceneActorPixels(source,actor){
 const cells=new Map(),size=SCENE_ACTOR_SCALE*actor.model.growth.scale*(actor.habitatScale||1),ca=Math.cos(actor.a),sa=Math.sin(actor.a);
 const centerX=Math.round(actor.x),centerY=Math.round(actor.y+(actor.lift||0));
 const front=['under','gather'].includes(actor.activity),rearLift=actor.sandRearLift||0;
 // Inverse-sample the output lattice: forward scattering leaves holes even at 1.1x.
 // Bounds include appendages; the sand lift is a piecewise affine shear in source x.
 let radius=0;
 for(const key of source.keys()){const [x,y]=key.split(',').map(Number);radius=Math.max(radius,Math.hypot(x,y)+1)}
 radius=Math.ceil(radius*size+Math.abs(rearLift)+1);
 for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
  const projected=x*ca+y*sa;
  let sx=projected/size;
  if(rearLift){
   const mid=(projected+rearLift*sa*16/36)/(size+rearLift*sa/36);
   sx=mid>=16?projected/size:mid<=-20?(projected+rearLift*sa)/size:mid;
  }
  const lift=rearLift*Math.max(0,Math.min(1,(16-sx)/36));
  const sy=Math.round((-x*sa+(y+lift)*ca)/size);sx=Math.round(sx);
  if(actor.occlusion>0&&(front?sx>24-actor.occlusion*49:sx< -24+actor.occlusion*49))continue;
  const color=source.get(sx+','+sy);
  if(color)cells.set((centerX+x)+','+(centerY+y),[centerX+x,centerY+y,color]);
 }
 return [...cells.values()];
}
export function cameraWindow(width,height,zoom=1,x=192,y=215,wide=false){
 const scale=Math.max(1,width/384)*zoom,sw=width/scale,sh=height/scale;
 if(wide){x=192;y=215}else {x=Math.max(sw/2,Math.min(384-sw/2,x));y=Math.max(sh/2,Math.min(430-sh/2,y));}
 return {scale,sw,sh,x,y,sx:x-sw/2,sy:y-sh/2};
}
export function createHabitat(canvas,layer,getState,onDirectInteraction=()=>{}){
const display=canvas.getContext('2d'),world=document.createElement('canvas');world.width=384;world.height=430;
const overlay=document.createElement('canvas');overlay.width=384;overlay.height=430;const overlayCtx=overlay.getContext('2d'),reactions=createReactions();
const ctx=world.getContext('2d');ctx.imageSmoothingEnabled=false;
const viewport=canvas.closest('.habitat-viewport');
const caveMask=canvas.id==='habitat'&&viewport?document.createElement('div'):null;
if(caveMask){caveMask.className='cave-observer-mask';caveMask.hidden=true;caveMask.setAttribute('aria-hidden','true');viewport.append(caveMask)}
const beam={x:50,y:54,size:34,dx:0,dy:0,last:0};
function paintBeam(){if(!caveMask)return;caveMask.style.setProperty('--beam-x',beam.x+'%');caveMask.style.setProperty('--beam-y',beam.y+'%');caveMask.style.width=beam.size+'%'}
function beamMove(dx,dy){beam.x=Math.max(0,Math.min(100,beam.x+dx));beam.y=Math.max(0,Math.min(100,beam.y+dy));paintBeam()}
function beamResize(delta){beam.size=Math.max(18,Math.min(66,beam.size+delta));paintBeam();return beam.size}
function beamHome(){
 const current=getState(),focus=GROUNDWATER_OBSERVATIONS[groundwaterObservationIndex(current)].focus;
 const rect=canvas.getBoundingClientRect(),view=cameraWindow(rect.width||384,rect.height||430);
 beam.x=Math.max(0,Math.min(100,(focus[0]-view.sx)/view.sw*100));beam.y=Math.max(0,Math.min(100,(focus[1]-view.sy)/view.sh*100));beam.dx=0;beam.dy=0;paintBeam();return beam.size;
}
function syncCaveObserver(){
 if(!caveMask||!viewport)return;
 const current=getState(),on=habitatConfig(current).id==='groundwater';
 caveMask.hidden=!on;viewport.classList.toggle('groundwater-observation',on);
 const last=Array.isArray(current.records)?current.records.at(-1):null;
 caveMask.dataset.lightsOut=String(on&&['feedback','ended'].includes(current.stage)&&last?.kind==='groundwater-pulse'&&last?.choice==='lights-out');
}
const sceneryCanvas=document.createElement('canvas');sceneryCanvas.width=384;sceneryCanvas.height=430;
const sceneryCtx=sceneryCanvas.getContext('2d');sceneryCtx.imageSmoothingEnabled=false;let sceneryKey='';
let aquaticPlan=null,aquaticPlanKey='';
const [traceCanvas,traceCtx]=offscreen();let traceKey='';
function offscreen(){
 const c=document.createElement('canvas');c.width=384;c.height=430;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return [c,g];
}
function buildAquaticPlan(layout){
 const [background,backgroundCtx]=offscreen();if(layout.background.params.shore)drawShoreBackground(backgroundCtx,layout.background.params);else drawSceneBackground(backgroundCtx,layout);
 const steps=[];let layerCanvas=null,layerCtx=null,layerHasInk=false;
 const flush=()=>{if(layerCanvas&&layerHasInk)steps.push({canvas:layerCanvas});layerCanvas=null;layerCtx=null;layerHasInk=false};
 for(const item of sceneObjects(layout).sort((a,b)=>(a.z||0)-(b.z||0))){
  if(isAnimatedSceneElement(item)){flush();steps.push({item});continue}
  if(!layerCanvas)[layerCanvas,layerCtx]=offscreen();
  if(seaweed&&item.layered)drawKelp(layerCtx,seaweed.frame.byId.get(item.id));
  else drawSceneElement(layerCtx,item);
  layerHasInk=true;
 }
 flush();return {background,steps};
}
const [shoreCanvas,shoreCtx]=offscreen();let shorePaintKey='',shoreVisual=null;
function drawAquaticLayout(time){
 const layout=isShore(state)?shoreLayoutFor(state):isEstuaryObservation(state)?estuaryLayout(state):state.habitatId==='freshwater'?freshwaterLayout(state):layoutForHabitat(state),key=(state.habitatId||'freshwater')+':'+(layout.observationIndex??layout.materialStage??'base')+':'+layout.background.seed+':'+layout.objects.length;
 if(!aquaticPlan||aquaticPlanKey!==key){aquaticPlan=buildAquaticPlan(layout);aquaticPlanKey=key}
 if(isShore(state)){
  const point=shorePoint(state),target=shoreHeight(shoreTide(state));
  if(!shoreVisual||shoreVisual.point!==point||empty)shoreVisual={point,level:target,time};
  const dt=Math.max(0,Math.min(.15,time-shoreVisual.time));shoreVisual.time=time;
  shoreVisual.level=reduced?target:shoreVisual.level+(target-shoreVisual.level)*Math.min(1,dt*4.5);
  if(Math.abs(target-shoreVisual.level)<1)shoreVisual.level=target;
  const level=Math.round(shoreVisual.level/2)*2,paintKey=key+':'+level;
  if(shorePaintKey!==paintKey){drawShoreBackground(shoreCtx,{...layout.background.params,level});shorePaintKey=paintKey}
  ctx.drawImage(shoreCanvas,0,0);
 }else ctx.drawImage(aquaticPlan.background,0,0);
 for(const step of aquaticPlan.steps){
  if(step.canvas)ctx.drawImage(step.canvas,0,0);
  else if(seaweed&&step.item.layered)drawKelp(ctx,seaweed.frame.byId.get(step.item.id));
  else drawSceneElement(ctx,step.item,{time:isShore(state)?time*(reduced?.9:1.4):time,motion:isShore(state)?(reduced?.8:1.2):reduced?.22:1});
 }
}
let seaweed=null;
let state=getState(),critters=[],last=0,active=false,effect=null,frame=0,encounter=null,elapsed=0,empty=false,shelterHeld=false;
const drawOptics=createPetriOptics();
const lensCanvas=document.createElement('canvas'),lensCtx=lensCanvas.getContext('2d');
const camera={zoom:1,x:192,y:215},motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=motionPreference.matches;motionPreference.addEventListener('change',event=>{reduced=event.matches});
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
 interaction.cancel();state=getState();shoreVisual=null;syncCaveObserver();empty=!!options.empty;layer.replaceChildren();elapsed=0;effect=null;shelterHeld=false;reactions.reset();
 const config=habitatConfig(state);
 seaweed=config.id==='shallow-marine'?createSeaweedBed(sceneObjects(layoutForHabitat(state))):null;
 if(seaweed)seaweedFrame(seaweed,{flow:state.flow,reduced});
 critters=empty?[]:makeIndividuals(state.cohort).map(c=>({...c,interaction:speciesById(c.species).interaction,model:renderModel(speciesById(c.species).visual,{stage:c.stage,seed:c.seed}),habitatScale:config.actorScale||1,pixels:new Map()}));
 canvas.dataset.specimens=String(critters.length);canvas.dataset.taxa=[...new Set(critters.map(c=>c.species))].join(',');
 encounter=empty?null:encounterForScene(state.scene);
 if(config.dialogue&&critters[0]){const a=critters[0];a.x=196;a.y=246;a.a=-.18;a.activity='crawl';a.posture='normal';a.moving=false;a.hidden=false;a.occlusion=0}else stageIndividuals(critters,encounter,{initial:true});
 if(config.id==='sandy-surf'&&!empty){stageSand(critters,state);sandHoles=[]}
 if(config.id==='petri-dish'&&!empty){for(const a of critters){a.x=192;a.y=215;a.a=-.35;confinePetri(a)}}
 if(config.id==='groundwater'&&!empty)stageGroundwater(critters,state);
 if(seaweed&&!empty)stageSeaweed(critters,seaweed);
 if(isEstuaryObservation(state)&&!empty)stepEstuary(critters,{state,time:0,reduced});
 if(!empty)placeSceneMolt(state.scene);drawHabitat(0);
}
function stage(scene){interaction.cancel();state=getState();syncCaveObserver();if(state.habitatId==='groundwater'){stageGroundwater(critters,state);beamHome()}encounter=encounterForScene(scene);if(!seaweed)elapsed=0;else {seaweed.events={attached:0,crossed:0,hidden:0,reappeared:0,plucked:0};state.seaweedEvidence={}}effect=null;shelterHeld=false;reactions.reset();if(!habitatConfig(state).dialogue&&!['sandy-surf','petri-dish','shallow-marine'].includes(state.habitatId))stageIndividuals(critters,encounter);if(state.habitatId==='sandy-surf')sandHoles=[];if(isEstuaryObservation(state))stepEstuary(critters,{state,time:0,reduced});placeSceneMolt(scene);if(encounter){[camera.x,camera.y]=encounter.place}drawHabitat(0)}
function react(id){state=getState();if(isEstuaryObservation(state)){stepEstuary(critters,{state,time:elapsed,reduced});drawHabitat(performance.now());return}if(state.habitatId==='groundwater'){if(id==='film-dark'){beamMove(30,0)}else if(id!=='lights-out')beamHome();drawHabitat(performance.now());return}const point=actionFocus(id,state,encounter);const selected=[...critters].sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y)).slice(0,2).map(c=>c.id);effect={id,selected,mode:responseMode(id),start:elapsed,until:elapsed+10};drawHabitat(performance.now())}
function heartBurst(){if(empty||!critters.length)return;reactions.burst(critters,'♡',elapsed);drawHabitat(performance.now())}
function scopeVisible(){const m=microscope(getState()),a=critters[0];return !!a&&Math.hypot(a.x-m.x,a.y-m.y)<130/m.magnification}
function scopeControl(action,value){
 state=getState();if(state.habitatId!=='petri-dish')return;
 const m=beginPetriStep(state),a=critters[0],before={...m};
 if(action==='toggle'){m.mode=!m.mode;if(m.mode&&a){m.x=a.x;m.y=a.y}}
 if(action==='zoom')m.magnification=Math.max(4,Math.min(32,m.magnification*(value>0?2:.5)));
 if(action==='focus')m.focus=Math.max(0,Math.min(100,Number(value)));
 if(action==='light'){if(Math.abs(m.light-value)>0)m.lights++;m.light=Math.max(10,Math.min(100,Number(value)))}
 if(action==='center'&&a){m.x=a.x;m.y=a.y}
 if(action==='move'&&m.mode){m.x=Math.max(40,Math.min(344,m.x+value[0]));m.y=Math.max(55,Math.min(375,m.y+value[1]));m.moves+=Math.hypot(...value)}
 if(action==='zoom'&&m.magnification!==before.magnification)noteMicroscopeAction(state,m.magnification>before.magnification?'zoomUp':'zoomDown');
 if(['focus','light'].includes(action)&&m[action]!==before[action])noteMicroscopeAction(state,action);
 if(action==='move')noteMicroscopeAction(state,'move',Math.hypot(m.x-before.x,m.y-before.y));
 onDirectInteraction({type:'microscope',visible:scopeVisible()});drawHabitat(performance.now());
}
const abyssFloor=document.createElement('canvas');let abyssFloorSeed=null;
function present(){
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 const w=Math.max(80,Math.round(rect.width*SCENE_OUTPUT_SCALE)),h=Math.max(80,Math.round(rect.height*SCENE_OUTPUT_SCALE));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 display.imageSmoothingEnabled=false;
 const m=state.habitatId==='petri-dish'?microscope(state):null;
 const petriScale=Math.max(rect.width/384,rect.height/430)*(m?.mode?m.magnification:1);
 const view=m?{scale:petriScale,sw:rect.width/petriScale,sh:rect.height/petriScale,x:m.mode?m.x:192,y:m.mode?m.y:215,sx:(m.mode?m.x:192)-rect.width/petriScale/2,sy:(m.mode?m.y:215)-rect.height/petriScale/2}:cameraWindow(rect.width,rect.height,camera.zoom,camera.x,camera.y,state.habitatId==='abyssal'),{scale,sw,sh,sx,sy}=view;camera.x=view.x;camera.y=view.y;
 if(canvas.id==='habitat'&&isShore(state)){
  const anchors=[[78,185],[302,126]];
  for(const [i,id] of ['shorePrev','shoreNext'].entries()){
   const button=document.getElementById(id),[x,y]=anchors[i];
   button.style.left=Math.max(15,Math.min(85,(x-sx)/sw*100))+'%';
   button.style.top=Math.max(18,Math.min(76,(y-sy)/sh*100))+'%';
  }
 }
 if(m&&!m.mode){camera.zoom=1;camera.x=192;camera.y=215}

 overlayCtx.clearRect(0,0,overlay.width,overlay.height);overlayCtx.drawImage(world,0,0);if(habitatConfig(state).id!=='groundwater'&&!isEstuaryObservation(state))drawReactionBubbles(overlayCtx,reactions.active,seaweed?critters.filter(a=>a.hitCells?.length):critters,elapsed,view,reduced);display.clearRect(0,0,w,h);
 if(state.habitatId==='abyssal'&&camera.zoom<1){
  // The same procedural sediment continues in world coordinates outside the authored patch.
  const seed=layoutForHabitat(state).background.seed;
  if(abyssFloorSeed!==seed){
   abyssFloor.width=2304;abyssFloor.height=2580;const floor=abyssFloor.getContext('2d');
   drawWaterBackground(floor,{kind:'abyssal',seed,originX:-960,originY:-1074});
   floor.fillStyle='rgba(5,11,14,.10)';floor.fillRect(0,0,abyssFloor.width,abyssFloor.height);abyssFloorSeed=seed;
  }
  display.drawImage(abyssFloor,sx+960,sy+1074,sw,sh,0,0,w,h);
 }

 if(m){display.fillStyle='#19241f';display.fillRect(0,0,w,h)}display.drawImage(overlay,sx,sy,sw,sh,0,0,w,h);
 if(state.habitatId==='abyssal'&&camera.zoom<1){
  const distance=(1-camera.zoom)/.75,actor=critters[0];
  const cx=((actor?.x??192)-sx)/sw*w,cy=((actor?.y??215)-sy)/sh*h;
  // Wide, continuous falloff across the viewport: sediment remains beneath it.
  const shade=display.createRadialGradient(cx,cy,0,cx,cy,Math.hypot(w,h)*.64);
  for(const [stop,opacity] of [[0,.18],[.18,.25],[.4,.48],[.65,.72],[1,.88]])shade.addColorStop(stop,`rgba(3,8,11,${opacity*distance})`);
  display.fillStyle=shade;display.fillRect(0,0,w,h);
 }
 if(m?.mode){
  if(lensCanvas.width!==w||lensCanvas.height!==h){lensCanvas.width=w;lensCanvas.height=h}
  lensCtx.imageSmoothingEnabled=false;lensCtx.clearRect(0,0,w,h);lensCtx.drawImage(world,sx,sy,sw,sh,0,0,w,h);
  for(const actor of critters){const source=actor.pixels.get([actor.posture,actor.molt,Math.floor(actor.phase)%4,actor.moving].join(':'));if(!source)continue;
   const cells=sceneActorPixels(source,{...actor,x:(actor.x-sx)*scale,y:(actor.y-sy)*scale,habitatScale:actor.habitatScale*scale});
   for(const [x,y,color] of cells){lensCtx.fillStyle=color;lensCtx.fillRect(x,y,1,1)}
  }
  drawOptics(display,lensCanvas,m);
 }

 layer.hidden=true;
}
function zoom(z){if(getState().habitatId==='petri-dish')return 1;camera.zoom=getState().habitatId==='abyssal'?Math.max(.25,Math.min(1,z)):Math.max(1,Math.min(3,z));present();return camera.zoom}

let sandHoles=[];
const interaction=bindPointerInteraction(canvas,{
 enabled:()=>active&&!empty,
 digStart:point=>{if(getState().habitatId!=='sandy-surf')return null;const actor=buriedAt(critters,point);sandHoles.push({...point,time:elapsed,water:point.y>=sandShore(getState(),elapsed)});sandHoles=sandHoles.slice(-16);drawHabitat(performance.now());return {actor}},
 digEnd:(actor,details)=>{const wasBuried=actor?.sand?.depth>0;uncoverSand(actor);if(actor&&!details.cancel&&(details.reveal||wasBuried))reactions.notify(actor,actor.id%2?'?':'!',elapsed);if(!details.cancel&&!details.reveal)onDirectInteraction({type:'ground',point:details.point})},
 worldPoint:event=>{
  const r=canvas.getBoundingClientRect(),view=cameraWindow(r.width,r.height,camera.zoom,camera.x,camera.y,state.habitatId==='abyssal');
  return {x:view.sx+(event.clientX-r.left)/view.scale,y:view.sy+(event.clientY-r.top)/view.scale};
 },
 hitTest:point=>{
  if(getState().habitatId==='petri-dish'||habitatConfig(getState()).dialogue||isEstuaryObservation(getState()))return null;
  const actors=[...critters].sort((a,b)=>seaweed?(b.depth??0)-(a.depth??0):b.id-a.id);
  return actors.find(actor=>!actor.hidden&&(!seaweed||visibleKelpCell(seaweed.frame.mask,point.x,point.y,actor.depth))&&actor.hitCells?.some(([x,y])=>point.x>=x-3&&point.x<=x+4&&point.y>=y-3&&point.y<=y+4));
 },
 objectHitTest:point=>{
  const config=habitatConfig(getState());if(seaweed){const plant=hitKelp(seaweed.frame,point);return plant?{kind:'seaweed',id:plant.id,plant,directDrag:true}:null}if(config.dialogue)return null;if(config.aquatic&&!config.wood)return null;
  const env=environmentFor(getState()),shell=[...(env.shells||[])].reverse().find(item=>Math.hypot(point.x-item.x,point.y-item.y)<15);
  if(shell)return {kind:'shell',id:shell.id};
  if(point.x>=env.shelter.x-88&&point.x<=env.shelter.x+90&&point.y>=env.shelter.y-48&&point.y<=env.shelter.y+62)return {kind:'shelter'};
  return null;
 },
 objectHoldStart:(object,point)=>{
  state=getState();
  if(object.kind==='seaweed'){beginSeaweedHold(seaweed,object.plant,point);return}
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
 objectMove:(object,point)=>{if(object.kind==='seaweed')moveSeaweedHold(seaweed,point)},
 objectHoldEnd:(object,point,{cancel})=>{if(object.kind==='shelter')shelterHeld=false;if(object.kind==='seaweed'){const moved=endSeaweedHold(seaweed);state.seaweedEvidence={...seaweed.events};if(moved&&!cancel)onDirectInteraction({type:'seaweed',point})}},
 groundTap:point=>{
  if(getState().habitatId==='petri-dish'||habitatConfig(getState()).dialogue||isEstuaryObservation(getState()))return;
  if(shelterHeld){shelterHeld=false;effect=null;drawHabitat(performance.now());return}
  const selected=[...critters].sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y)).slice(0,3).map(actor=>actor.id);
  effect={id:'ground-tap',selected,mode:'disturb',start:elapsed,until:elapsed+3.2,point};
  onDirectInteraction({type:'ground',point});
 },
 pan:(dx,dy)=>{
  if(getState().habitatId==='petri-dish'){const m=microscope(getState()),r=canvas.getBoundingClientRect();if(m.mode)scopeControl('move',[-dx/(Math.max(r.width/384,r.height/430)*m.magnification),-dy/(Math.max(r.width/384,r.height/430)*m.magnification)]);return}
  if(['groundwater','abyssal'].includes(habitatConfig(getState()).id))return;
  const r=canvas.getBoundingClientRect(),scale=Math.max(1,r.width/384)*camera.zoom;
  camera.x-=dx/scale;camera.y-=dy/scale;present();
 },
 draw:()=>drawHabitat(performance.now()),
 report:event=>{if(seaweed&&event.actor?.weed&&['grab','place'].includes(event.type)){event.actor.weed.mode='released';event.actor.weed.travel=null;event.actor.depth=200}onDirectInteraction({type:event.type,specimen:event.actor?.specimenId||null,point:event.point||null})}
});
canvas.addEventListener('wheel',e=>{e.preventDefault();if(habitatConfig(getState()).id==='petri-dish'){if(microscope(getState()).mode)scopeControl('zoom',e.deltaY<0?1:-1);return}if(habitatConfig(getState()).id==='groundwater')return;zoom(camera.zoom+(e.deltaY<0?.25:-.25));const label=document.querySelector('#zoomLevel');if(label)label.textContent=camera.zoom.toFixed(2).replace(/0$/,'')+'×'},{passive:false});
function tick(t){if(!active)return;const beamDt=Math.min(.035,Math.max(0,(t-beam.last)/1000));beam.last=t;if(!document.hidden&&getState().habitatId==='groundwater'&&(beam.dx||beam.dy))beamMove(beam.dx*beamDt*42,beam.dy*beamDt*42);if(!document.hidden&&t-last>66){const dt=Math.min(.1,(t-last)/1000);state=getState();elapsed+=dt;if(seaweed){stepSeaweed(critters,seaweed,{time:elapsed,dt,reduced,flow:state.flow});state.seaweedEvidence={...seaweed.events}}else (isEstuaryObservation(state)?stepEstuary:habitatConfig(state).aquatic?stepAquatic:stepIndividuals)(critters,{encounter,state,time:elapsed,dt,reaction:effect&&elapsed<effect.until?{...effect,age:elapsed-effect.start}:null,reduced});for(const a of critters){const source=seaweed?a.weed:a.sand;if(source?.cue){reactions.notify(a,source.cue,elapsed);delete source.cue}}reactions.update(critters,{encounter,state,time:elapsed,reaction:effect&&elapsed<effect.until?{...effect,age:elapsed-effect.start}:null});drawHabitat(t);last=t}frame=requestAnimationFrame(tick)}
function px(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
function drawHabitat(t){
 syncCaveObserver();
 const w=world.width,h=world.height;ctx.clearRect(0,0,w,h);
 const memory=environmentFor(state);
 const lifted=shelterHeld||!!(effect&&elapsed<effect.until&&['lift','direct-lift'].includes(effect.id));
 const sceneryOptions={wetZones:memory.wetZones||[],light:DEFAULT_LAYOUT.background.params.light,shelterLift:lifted?-12:0,seed:DEFAULT_LAYOUT.background.seed};
 const config=habitatConfig(state),aquatic=config.aquatic;
 if(aquatic)drawAquaticLayout(elapsed);
 else{
  const nextSceneryKey=JSON.stringify(sceneryOptions);
  if(nextSceneryKey!==sceneryKey){sceneryCtx.clearRect(0,0,sceneryCanvas.width,sceneryCanvas.height);drawBaseScene(sceneryCtx,sceneryOptions);sceneryKey=nextSceneryKey}
  ctx.drawImage(sceneryCanvas,0,0);
 }

 // All persistent traces change with game state, not with animation time.
 // Value-based invalidation also catches in-place mutations and future trace fields.
 const nextTraceKey=JSON.stringify([memory.scuffs,memory.leaves,memory.foodNodes,memory.shells,state.cohort]);
 if(nextTraceKey!==traceKey){
  traceCtx.clearRect(0,0,384,430);
 for(const mark of memory.scuffs||[])for(let i=0;i<8;i++)px(traceCtx,mark.x-18+i*5,mark.y+i%2*2,3,1,'rgba(108,84,58,.55)');

 // Pre-existing and newly-added leaves share the exact same renderer.
 for(const l of memory.leaves||[]){
  const hash=Math.abs(Math.round(l.x*17+l.y*31+l.a*100)),variant=hash%6,tone=(hash>>2)%4;
  const size=.68+(hash%6)*.055;
  drawLeaf(traceCtx,{x:l.x,y:l.y,a:l.a+((hash%7)-3)*.045,variant,scale:size,tone,gap:!!l.gap,age:l.age||0,seed:hash});
 }

 for(const food of memory.foodNodes||[]){
  if(food.amount>0)for(let y=0;y<10;y+=2)for(let x=0;x<Math.min(20,8+food.amount*5);x+=2)px(traceCtx,food.x+x-8,food.y+y-5,2,2,y>6?'#80683f':'#c3a46b');
 }
 for(const shell of memory.shells||[])drawMoltShell(shell,traceCtx);

  traceKey=nextTraceKey;
 }
 ctx.drawImage(traceCanvas,0,0);

 // Spraying has an immediate visible response now that scenery is on the same canvas layer.
 if(effect&&elapsed<effect.until&&['mist','wet-left','wet-all'].includes(effect.id)){
  const wide=effect.id==='wet-all',span=wide?350:102,origin=wide?12:8;
  for(let i=0;i<(reduced?15:30);i++){
   const x=origin+(i*37)%span,y=(i*67+t*.07)%420;
   px(ctx,x,y,1+(i%3===0),2,'rgba(151,177,157,.82)');
   if(i%5===0)px(ctx,x+2,y+3,1,1,'rgba(190,205,184,.62)');
  }
  ctx.fillStyle=wide?'rgba(54,73,61,.055)':'rgba(48,78,62,.075)';
  if(wide)ctx.fillRect(0,0,w,h);else ctx.fillRect(0,0,112,h);
 }

 if(state.light<55&&!['abyssal','groundwater'].includes(config.id)){ctx.fillStyle=`rgba(15,27,21,${(55-state.light)/120})`;ctx.fillRect(0,0,w,h)}
 if(config.id==='abyssal'){ctx.fillStyle='rgba(5,11,14,.10)';ctx.fillRect(0,0,w,h)}
 if(config.id!=='abyssal'){ctx.strokeStyle='rgba(147,148,124,.55)';ctx.lineWidth=2;ctx.strokeRect(1,1,w-2,h-2);}
 if(isShore(state)){drawShoreWater(ctx,{...state,shoreLevel:shoreVisual?.level},elapsed,reduced);canvas.dataset.shorePoint=String(shorePoint(state));canvas.dataset.shoreTide=String(shoreTide(state));}
 else if(isEstuaryObservation(state))drawEstuaryWater(ctx,estuaryIndex(state),elapsed,estuaryLayout(state),reduced);
 else if(aquatic)drawAquaticWater(ctx,state,reduced?elapsed*.65:elapsed,{drawPlants:false,observationEffect:effect&&elapsed<effect.until?{...effect,age:elapsed-effect.start}:null});
 if(config.id==='groundwater')drawGroundwaterEvidence(ctx,state);
 if(config.id==='abyssal'){
  // Keep the whole animal and its existing light inside the original observation area.
  for(const a of critters){const dx=a.x-192,dy=a.y-215,r=Math.hypot(dx/64,dy/84);if(r>1){a.x=192+dx/r;a.y=215+dy/r;a.a=Math.atan2(-dy,-dx)}}
  drawAbyssalSpotlight(ctx,critters[0]);
 }
 drawActors();
 if(seaweed){state.seaweedEvidence={...seaweed.events};if(canvas.id==='habitat'&&globalThis.__ISOPODA_SEAWEED_DEBUG__)globalThis.__ISOPODA_SEAWEED_DEBUG__({bed:seaweed,critters})}
 if(isEstuaryObservation(state))drawEstuaryEvidence(ctx,state);
 present();
}
function drawGroundwaterEvidence(g,s){
 const records=(Array.isArray(s.records)?s.records:[]).filter(record=>record.kind==='groundwater-pulse');
 if(!records.length)return;
 const nodes={a:[199,94],b:[204,232],c:[187,318],d:[111,153]};
 const mark=([x,y],strong=false)=>{
  const color=strong?'rgba(204,199,170,.72)':'rgba(177,178,153,.48)';
  px(g,x-3,y,7,1,color);px(g,x,y-3,1,7,color);
 };
 const dotted=(from,to,strong=false)=>{
  const [ax,ay]=from,[bx,by]=to,steps=18,color=strong?'rgba(196,193,163,.58)':'rgba(161,165,143,.38)';
  for(let i=0;i<=steps;i++){if(i%2)continue;const t=i/steps;px(g,ax+(bx-ax)*t,ay+(by-ay)*t,2,2,color)}
 };
 if(records.some(r=>['mark-entrance','connect-marks','finish-map'].includes(r.choice)))mark(nodes.a,true);
 if(records.some(r=>['record-silt','connect-marks','finish-map'].includes(r.choice)))mark(nodes.b,true);
 if(records.some(r=>['watch-input','film-record'].includes(r.choice)))mark(nodes.c,true);
 if(records.some(r=>r.choice==='seek-third'))mark(nodes.d,true);
 if(records.some(r=>r.choice==='connect-marks'))dotted(nodes.a,nodes.b,true);
 if(records.some(r=>['watch-input','film-record'].includes(r.choice)))dotted(nodes.b,nodes.c,false);
 if(records.some(r=>r.choice==='finish-map')){
  if(records.some(r=>r.choice==='connect-marks'))dotted(nodes.a,nodes.b,true);
  if(records.some(r=>['watch-input','film-record'].includes(r.choice)))dotted(nodes.b,nodes.c,true);
  if(records.some(r=>r.choice==='seek-third'))dotted(nodes.a,nodes.d,false);
 }
}
function drawAbyssalSpotlight(g,actor){
 const cx=Math.round(actor?.x??196),cy=Math.round(actor?.y??246);
 const bands=[
  {rx:118,ry:78,a:.026},
  {rx:92,ry:60,a:.036},
  {rx:68,ry:44,a:.045}
 ];
 for(const {rx,ry,a} of bands){
  g.fillStyle=`rgba(132,160,166,${a})`;
  for(let dy=-ry;dy<=ry;dy+=3){
   const q=dy/ry,span=Math.round(rx*Math.sqrt(Math.max(0,1-q*q)));
   g.fillRect(cx-span,cy+dy,span*2,3);
  }
 }
}
// Keep anatomy pixels untouched. The habitat only places a dark duplicate beneath each rendered animal.
function drawActorUnderlay(cells){
 for(const [x,y] of cells)px(ctx,x+1,y+2,1,1,'rgba(20,24,18,.46)');
}
function drawActors(){
 if(state.habitatId==='sandy-surf')drawSandMarks(ctx,critters,elapsed,sandHoles,reduced,state);
 for(const actor of [...critters].sort((a,b)=>seaweed?(a.depth??0)-(b.depth??0):Number(a.interactionState?.mode==='grabbed')-Number(b.interactionState?.mode==='grabbed'))){if(actor.hidden){actor.hitCells=[];continue;}
  const phase=Math.floor(actor.phase)%4,key=[actor.posture,actor.molt,phase,actor.moving].join(':');
  let source=actor.pixels.get(key);
  if(!source){source=new Map();for(const part of pixelAnatomy(actor.model,{posture:actor.posture,molt:actor.molt,phase,moving:actor.moving}))for(const [x,y,color] of part.cells)source.set(x+','+y,color);actor.pixels.set(key,source);if(actor.pixels.size>40)actor.pixels.delete(actor.pixels.keys().next().value)}
  if(actor.interactionState?.mode==='grabbed')px(ctx,actor.x-7,actor.y+8,14,2,'#252b21');
  const cells=sandVisibleCells(sceneActorPixels(source,sandPose(actor,reduced)),actor);
  actor.hitCells=seaweed?cells.filter(([x,y])=>visibleKelpCell(seaweed.frame.mask,x,y,actor.depth)):cells;
  if(seaweed)noteSeaweedVisibility(seaweed,actor,actor.hitCells.length,cells.length);
  if(state.habitatId==='petri-dish'&&microscope(state).mode)continue;
  drawActorUnderlay(seaweed?actor.hitCells.filter(([x,y])=>visibleKelpCell(seaweed.frame.mask,x+1,y+2,actor.depth)):actor.hitCells);
  for(const [x,y,color] of actor.hitCells)px(ctx,x,y,1,1,color);
 }
}
function drawMoltShell(shell,target=ctx){
 const specimen=state.cohort?.find(c=>c.id===shell.specimen)||state.cohort?.[0];
 const species=speciesById(specimen?.species||state.cohort?.[0]?.species||'dairy');
 const model=renderModel(species.visual,{stage:specimen?.stage||'M',seed:specimen?.seed||shell.id});
 const cells=exuviaPixels(model,{phase:shell.phase||'whole',age:shell.age||0});
 const scale=.82*model.growth.scale,ca=Math.cos(shell.a||0),sa=Math.sin(shell.a||0);
 for(const [sx,sy,color] of cells){
  const ox=sx*scale,oy=sy*scale;
  px(target,shell.x+ox*ca-oy*sa,shell.y+ox*sa+oy*ca,1,1,color);
 }
}
new ResizeObserver(()=>drawHabitat(0)).observe(canvas);
return {reset,stage,react,heartBurst,scopeControl,scopeVisible,zoom,beamResize,beamMove,beamHome,beamSteer:(dx,dy)=>{beam.dx=dx;beam.dy=dy},beamSize:()=>beam.size,zoomBy:d=>zoom(camera.zoom+d),home:()=>{camera.x=192;camera.y=215;return zoom(1)},start:()=>{if(!active){active=true;last=performance.now();beam.last=last;frame=requestAnimationFrame(tick)}},stop:()=>{beam.dx=0;beam.dy=0;interaction.cancel();active=false;cancelAnimationFrame(frame)},visible:()=>critters.filter(c=>!c.hidden).length};
}
