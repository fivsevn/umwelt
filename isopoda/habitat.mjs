import {bindPointerInteraction} from './interaction.mjs?v=environment-memory-1';
import {createReactions,actionFocus,drawReactionBubbles} from './reactions.mjs?v=bubbles-1';
import {environmentFor} from './environment.mjs?v=leaf-integration-1';
import {makeIndividuals,stageIndividuals,stepIndividuals} from './behaviors.mjs?v=appendage-2';
import {encounterById,responseMode} from './encounters.mjs?v=narrative-pool-2';
import {pixelAnatomy,renderModel,exuviaPixels} from './sprites.mjs?v=exuvia-1';
import {speciesById} from './species.mjs?v=cohort-4';
// Habitat scenery and specimens share one world lattice, but scenery is allowed to sit one visual step behind the specimens.
export const SCENE_PIXEL=1;
const SCENE_ACTOR_SCALE=.88,SCENE_OUTPUT_SCALE=.76,BACKGROUND_SCALE=.72;
const LEAF_PALETTES=[
 ['#504332','#68543a','#806a48','#97805a','#393229'],
 ['#59412f','#704f35','#89613e','#9f774d','#3d3027'],
 ['#4b4433','#615a40','#786f4c','#8f845b','#37342b'],
 ['#5c4932','#755c3a','#8f7146','#a18455','#40342a'],
 ['#484033','#5e523d','#746449','#897858','#35312a'],
 ['#524536','#69583e','#806b4c','#95805b','#3a332b']
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
function syncArtwork(view){
 const root=canvas.parentElement?.querySelector('.habitat-art');if(!root)return;
 const {scale,sx,sy}=view,base=root.querySelector('.habitat-art-bg'),barkLayer=root.querySelector('.habitat-art-bark');
 const transform=(dy=0)=>`translate(${-sx*scale}px,${(-sy+dy)*scale}px) scale(${scale})`;
 const lifted=shelterHeld||!!(effect&&elapsed<effect.until&&['lift','direct-lift'].includes(effect.id));
 if(base)base.style.transform=transform();
 if(barkLayer)barkLayer.style.transform=transform(lifted?-12:0);
}
function present(){
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 const w=Math.max(80,Math.round(rect.width*SCENE_OUTPUT_SCALE)),h=Math.max(80,Math.round(rect.height*SCENE_OUTPUT_SCALE));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 display.imageSmoothingEnabled=false;
 const view=cameraWindow(rect.width,rect.height,camera.zoom,camera.x,camera.y),{scale,sw,sh,sx,sy}=view;camera.x=view.x;camera.y=view.y;syncArtwork(view);
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
 const w=world.width,h=world.height;ctx.clearRect(0,0,w,h);
 const memory=environmentFor(state);
 // Only user-created traces sit above the fixed pixel-art husbandry layout.
 for(const mark of memory.scuffs)for(let i=0;i<8;i++)px(ctx,mark.x-18+i*5,mark.y+i%2*2,3,1,'rgba(108,84,58,.55)');
 for(const l of memory.leaves){
  if(['leaf-a','leaf-b','leaf-old'].includes(l.id))continue;
  const hash=Math.abs(Math.round(l.x*17+l.y*31+l.a*100)),variant=hash%6,tone=(hash>>2)%LEAF_PALETTES.length;
  // Ignore legacy tiny saved scales here: litter should read like the large leaves already painted into the habitat.
  const baseSize=1.34+(hash%6)*.13,size=baseSize*(1-Math.min(l.age,20)*.003),angle=l.a+((hash%7)-3)*.065;
  leaf(ctx,l.x,l.y,angle,variant,size,tone,l.gap);
 }
 for(const f of memory.foodNodes){
  if(f.amount>0)for(let y=0;y<10;y+=2)for(let x=0;x<Math.min(20,8+f.amount*5);x+=2)px(ctx,f.x+x-8,f.y+y-5,2,2,y>6?'#80683f':'#c3a46b');
 }
 for(const shell of memory.shells||[])drawMoltShell(shell);
 if(state.light<55){ctx.fillStyle=`rgba(15,27,21,${(55-state.light)/120})`;ctx.fillRect(0,0,w,h)}
 if(!reduced&&effect&&elapsed<effect.until&&['mist','wet-left','wet-all'].includes(effect.id))for(let i=0;i<18;i++){const x=12+(i*29)%(effect.id==='wet-all'?350:82),y=(i*71+t*.05)%420;px(ctx,x,y,1,2,'#91a994')}
 ctx.strokeStyle='rgba(147,148,124,.55)';ctx.lineWidth=2;ctx.strokeRect(1,1,w-2,h-2);
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
// Added litter uses the same broad silhouettes as the fixed background leaves:
// large / medium hierarchy, solid fill, thick body and only restrained veins.
function leaf(c,x,y,a,variant=0,scale=1,tone=0,gap=false){
 const p=LEAF_PALETTES[tone%LEAF_PALETTES.length],ca=Math.cos(a),sa=Math.sin(a),cell=2;
 const length=[44,50,47,44,49,46][variant%6]*scale,width=[26,21,29,29,26,25][variant%6]*scale;
 const widthAt=t=>{
  const q=Math.max(0,1-Math.abs(t));
  if(variant===1)return width*Math.pow(q,.70)*.76;
  if(variant===2)return width*Math.pow(q,.56)*(.88+.10*Math.sin((t+.05)*Math.PI*3));
  if(variant===3)return width*Math.pow(q,.50)*(t<-.25?.76:1);
  if(variant===4)return width*Math.pow(q,.60)*(.92+.07*Math.cos(t*Math.PI*2));
  if(variant===5)return width*Math.pow(q,.63)*(.82+.10*Math.cos((t+.1)*Math.PI*2.4));
  return width*Math.pow(q,.57);
 };
 const inside=(u,v)=>{
  if(Math.abs(u)>length)return false;
  const t=u/length,rim=widthAt(t);if(Math.abs(v)>rim)return false;
  const edge=rim-Math.abs(v),side=Math.sign(v)||1;
  if(variant===0&&t>.38&&t<.58&&side<0&&edge<cell*1.35)return false;
  if(variant===1&&t<-.22&&t>-.48&&side>0&&edge<cell*1.30)return false;
  if(variant===2&&t>.12&&t<.38&&side>0&&edge<cell*1.45)return false;
  if(variant===3&&t>.50&&side<0&&edge<cell*1.55)return false;
  if(variant===4&&t<-.36&&side>0&&edge<cell*1.35)return false;
  if(variant===5&&t>.30&&t<.55&&side<0&&edge<cell*1.30)return false;
  return true;
 };
 const radius=Math.ceil(Math.hypot(length,width)+10);
 // Rotated shadow, rasterized on the world grid so there can be no holes.
 const su=gap?4:2,sv=gap?6:4;
 for(let yy=-radius;yy<=radius;yy+=cell)for(let xx=-radius;xx<=radius;xx+=cell){
  const dx=xx-su,dy=yy-sv,u=dx*ca+dy*sa,v=-dx*sa+dy*ca;
  if(inside(u,v))px(c,x+xx,y+yy,cell,cell,'rgba(35,31,26,.34)');
 }
 // Solid body. Every world-grid cell inside the silhouette is filled.
 for(let yy=-radius;yy<=radius;yy+=cell)for(let xx=-radius;xx<=radius;xx+=cell){
  const u=xx*ca+yy*sa,v=-xx*sa+yy*ca;if(!inside(u,v))continue;
  const t=u/length,rim=widthAt(t),edge=rim-Math.abs(v);
  let ink=p[1];
  if(edge<cell*1.25)ink=p[0];
  else if(v<0)ink=p[2];
  if(t>.22&&v>0)ink=p[2];
  if(t<-.10&&t>-.38&&v<-.15*rim)ink=p[3];
  px(c,x+xx,y+yy,cell,cell,ink);
 }
 // Midrib and one quiet vein pair; no stippling.
 for(let u=-length*.76;u<length*.74;u+=cell*2){
  const xx=u*ca,yy=u*sa;px(c,x+xx,y+yy,cell,cell,p[3]);
 }
 const vu=-.12*length,vr=widthAt(-.12)*.66;
 for(const side of [-1,1])for(let q=.34;q<.92;q+=.32){
  const u=vu+q*length*.12,v=side*vr*q,xx=u*ca-v*sa,yy=u*sa+v*ca;
  px(c,x+xx,y+yy,cell,cell,p[2]);
 }
 for(let i=0;i<8*scale;i+=cell){
  const u=-length-i,xx=u*ca,yy=u*sa;px(c,x+xx,y+yy,cell,cell,p[4]);
 }
}
// Cork bark is a hand-composed low-resolution "photo": large tonal patches, broken edge, very few cracks.
function bark(x,y,a=0,variant=0,scale=1){
 const ca=Math.cos(a),sa=Math.sin(a),half=(variant===1?57:78)*scale,depth=(variant===1?23:32)*scale,cell=Math.max(2,Math.round(3*scale));
 const plot=(u,v,color,w=cell,h=cell)=>px(ctx,x+u*ca-v*sa,y+u*sa+v*ca,w,h,color);
 const pal=variant===0
  ?['#302620','#493126','#62432d','#7a5435','#986d45','#b98d5e','#cfaa76']
  :['#302722','#463329','#5d432f','#725338','#8d6744','#aa7d52','#c39868'];
 const leftAt=v=>-half+(6+((v+depth)/(depth*2))*8)*scale;
 const rightAt=v=> half-(6+(1-(v+depth)/(depth*2))*9)*scale;
 for(let v=-depth;v<=depth;v+=cell)for(let u=-half;u<=half;u+=cell){
  const left=leftAt(v),right=rightAt(v);if(u<left||u>right)continue;
  const pxn=(u-left)/Math.max(1,right-left),pyn=(v+depth)/(depth*2);
  // Four intentionally large regions, like a downsampled photograph.
  let ink=pal[2];
  if(pyn<.18)ink=pal[4];
  if(pyn>.80)ink=pal[1];
  if(((pxn-.54)/.34)**2+((pyn-.40)/.29)**2<1)ink=pal[4];
  if(((pxn-.24)/.23)**2+((pyn-.61)/.25)**2<1)ink=pal[1];
  if(((pxn-.76)/.18)**2+((pyn-.64)/.22)**2<1)ink=pal[3];
  if(((pxn-.54)/.17)**2+((pyn-.28)/.15)**2<1)ink=pal[5];
  // Irregular broken silhouette, but no holes inside the slab.
  const broken=(variant===0&&pxn>.90&&pyn<.24)||(variant===0&&pxn<.08&&pyn>.72)||
               (variant===1&&pxn<.12&&pyn<.25)||(variant===1&&pxn>.91&&pyn>.70);
  if(broken)continue;
  if(pxn<.035||pxn>.965||pyn<.055||pyn>.95)ink=pal[0];
  plot(u,v,ink);
 }
 // One broad peeled patch.
 const patch=variant===0?[-19,-10,60,15]:[-22,-8,43,13];
 const [pu,pv,pw,ph]=patch;
 for(let v=0;v<ph*scale;v+=cell)for(let u=0;u<pw*scale;u+=cell){
  const nx=u/(pw*scale),ny=v/(ph*scale);
  if(nx<.05+ny*.12||nx>.96-ny*.08)continue;
  plot((pu*scale)+u,(pv*scale)+v,ny<.35?pal[6]:pal[5]);
 }
 // Two to three coarse fractures only.
 const cracks=variant===0?[[-43,5,33,.10],[14,12,28,-.18],[33,-17,20,.20]]:[[-31,7,26,-.12],[7,-12,22,.19]];
 for(const [sx,sy,len,slope] of cracks)for(let i=0;i<len*scale;i+=cell)plot((sx*scale)+i,(sy*scale)+i*slope,pal[0],cell,Math.max(2,cell-1));
 // Small pale splinters at one damaged end.
 const side=variant===0?1:-1,ex=side*(half-6*scale);
 for(let i=0;i<4;i++)for(let j=0;j<(7+i*2)*scale;j+=cell)plot(ex+side*j,(-depth*.42+i*depth*.24)+j*(i%2?.08:-.06),pal[6],cell,Math.max(2,cell-1));
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
function sphagnumPatch(cx,cy,rx,ry,seed=0,alpha=.46){
 const colors=[
  `rgba(48,78,59,${alpha*.68})`,
  `rgba(62,98,67,${alpha*.78})`,
  `rgba(79,120,78,${alpha*.86})`,
  `rgba(101,145,94,${alpha*.94})`,
  `rgba(132,171,112,${alpha})`
 ],cell=4;
 // Union of several broad cushions creates an irregular mass; no fine speckling.
 const lobes=[
  [-.46,-.02,.52,.58],[.02,-.18,.62,.72],[.48,.00,.48,.58],
  [-.22,.28,.58,.48],[.28,.30,.62,.46],[-.68,.25,.30,.36],[.70,.26,.28,.34]
 ];
 for(let yy=-ry;yy<=ry;yy+=cell)for(let xx=-rx;xx<=rx;xx+=cell){
  let inside=false,best=9;
  for(const [lx,ly,lr,lry] of lobes){
   const dx=(xx-rx*lx)/(rx*lr),dy=(yy-ry*ly)/(ry*lry),d=dx*dx+dy*dy;
   if(d<=1){inside=true;best=Math.min(best,d)}
  }
  if(!inside)continue;
  const upper=(yy/ry)<-.05,tone=upper?3:best<.35?2:1;
  const shift=((Math.floor((xx+rx)/20)+Math.floor((yy+ry)/16)+seed)%3===0)?1:0;
  px(ctx,cx+xx,cy+yy,cell,cell,colors[Math.min(4,tone+shift)]);
 }
 // A handful of large upright tufts.
 const crowns=[[-.55,-.42,12],[-.27,-.58,16],[.04,-.66,18],[.31,-.55,14],[.57,-.39,11]];
 for(const [sx,sy,h] of crowns){
  const bx=cx+rx*sx,by=cy+ry*sy;
  for(let j=0;j<h;j+=3){px(ctx,bx,by-j,4,3,colors[3+(j%2)]);if(j>5&&j%6===0){px(ctx,bx-5,by-j+2,5,3,colors[3]);px(ctx,bx+4,by-j,5,3,colors[4])}}
 }
}
function scenery(t){
 // Wet side: one broad upper-left sphagnum field and a smaller lower-left refuge.
 sphagnumPatch(84,96,96,72,3,.43);
 sphagnumPatch(57,348,58,39,11,.40);

 // Calcium source remains a small husbandry detail.
 cuttlebone(332,166,-.42,.70);

 // Bare substrate stays visible. Only a few coarse bits of humus interrupt it.
 const humus=[[38,43,7,3],[145,34,8,3],[238,52,6,3],[337,45,7,3],[118,166,8,4],[57,213,6,3],[328,244,9,4],[82,287,7,3],[219,307,8,3],[345,359,7,3],[153,391,9,3],[278,394,6,3]];
 for(let i=0;i<humus.length;i++){const [x,y,w,h]=humus[i];px(ctx,x,y,w,h,['#3a3027','#4a392b','#5b4430'][i%3])}

 // Leaf litter is deliberately sparse and layered, with a clear large / medium / small hierarchy.
 const leaves=[
  [315,100,-.62,0,1.02,1],
  [300,320,.62,2,.88,0],
  [218,370,-2.56,4,.78,2],
  [116,349,-.28,1,.66,1],
  [338,235,2.24,3,.60,0],
  [84,182,.34,5,.54,2],
  [248,86,2.68,0,.48,1],
  [147,90,-2.15,4,.42,0],
  [333,373,-1.32,1,.36,2],
  [61,270,1.72,5,.31,1],
  [189,55,.10,2,.26,0],
  [268,235,-.44,3,.22,2]
 ];
 for(const [x,y,a,v,s,tone] of leaves)leaf(ctx,x,y,a,v,s,tone);

 // A few sticks and bark crumbs imply litter without filling every empty patch.
 const twigs=[[122,302,-.55,19],[327,76,2.35,17],[80,385,-2.70,14],[282,280,1.82,15]];
 for(const [x,y,a,len] of twigs)twig(x,y,a,len);
 const chips=[[146,246,.55,0,.55],[335,128,-.32,1,.52],[227,45,2.82,0,.44],[320,352,.40,2,.50]];
 for(const [x,y,a,kind,s] of chips)woodChip(x,y,a,kind,s);
}

new ResizeObserver(()=>drawHabitat(0)).observe(canvas);
return {reset,stage,react,zoom,zoomBy:d=>zoom(camera.zoom+d),home:()=>{camera.x=192;camera.y=215;return zoom(1)},start:()=>{if(!active){active=true;last=performance.now();frame=requestAnimationFrame(tick)}},stop:()=>{interaction.cancel();active=false;cancelAnimationFrame(frame)},visible:()=>critters.filter(c=>!c.hidden).length};
}
