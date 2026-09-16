import {bindPointerInteraction} from './interaction.mjs?v=pointer-1';
import {createReactions,actionFocus,drawReactionBubbles} from './reactions.mjs?v=bubbles-1';
import {environmentFor} from './environment.mjs?v=cohort-4';
import {makeIndividuals,stageIndividuals,stepIndividuals} from './behaviors.mjs?v=pointer-1';
import {encounterById,responseMode} from './encounters.mjs?v=cohort-4';
import {pixelAnatomy,renderModel} from './sprites.mjs?v=cohort-4';
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
export function createHabitat(canvas,layer,getState){
const display=canvas.getContext('2d'),world=document.createElement('canvas');world.width=384;world.height=430;
const backdrop=document.createElement('canvas');backdrop.width=Math.round(world.width*BACKGROUND_SCALE);backdrop.height=Math.round(world.height*BACKGROUND_SCALE);
const backdropCtx=backdrop.getContext('2d');backdropCtx.imageSmoothingEnabled=false;
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
 pan:(dx,dy)=>{
  const r=canvas.getBoundingClientRect(),scale=Math.max(1,r.width/384)*camera.zoom;
  camera.x-=dx/scale;camera.y-=dy/scale;present();
 },
 draw:()=>drawHabitat(performance.now())
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
 const shelterY=memory.shelter.y-(effect&&elapsed<effect.until&&effect.id==='lift'?12:0);
 // Larger crossed slabs fill the central shelter footprint while retaining two distinct pieces.
 bark(memory.shelter.x+8,shelterY-4,-.12,0,1.38);
 bark(memory.shelter.x-58,memory.shelter.y+40,.10,1,.92);
 for(const f of memory.foodNodes){
  for(let i=0;i<7;i++)px(ctx,f.x-9+i*3,f.y+10+i%2*3,1,1,'#806a42');
  if(f.amount>0)for(let y=0;y<12;y++)for(let x=0;x<Math.min(22,8+f.amount*6);x++){if((x+y+f.age*2)%17<3)continue;px(ctx,f.x+x-8,f.y+y-6,1,1,y>8?'#8b7043':y%3===0?'#d1b578':'#c6a86d')}
 }
 if(encounter&&!memory.removedShells.includes(encounter.id)&&['shell','molt'].includes(encounter.motion)){const [x,y]=encounter.place;px(ctx,x-20,y+10,7,3,'#c9c4a8');px(ctx,x-18,y+8,4,1,'#aaa990');px(ctx,x-15,y+11,1,1,'#f1ecd0')}
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
  const phase=reduced?0:Math.floor(actor.phase)%4,key=[actor.posture,actor.molt,phase,actor.moving].join(':');
  let source=actor.pixels.get(key);
  if(!source){source=new Map();for(const part of pixelAnatomy(actor.model,{posture:actor.posture,molt:actor.molt,phase,moving:actor.moving}))for(const [x,y,color] of part.cells)source.set(x+','+y,color);actor.pixels.set(key,source);if(actor.pixels.size>40)actor.pixels.delete(actor.pixels.keys().next().value)}
  if(actor.interactionState?.mode==='grabbed')px(ctx,actor.x-7,actor.y+8,14,2,'#252b21');
  actor.hitCells=sceneActorPixels(source,actor);
  for(const [x,y,color] of actor.hitCells)px(ctx,x,y,1,1,color);
 }
}
// Six silhouettes suggest mixed broadleaf litter without tying the scene to one exact tree species.
function leaf(c,x,y,a,variant=0,scale=1,tone=0){
 const palette=LEAF_PALETTES[tone%LEAF_PALETTES.length],ca=Math.cos(a),sa=Math.sin(a);
 const lengths=[49,45,46,50,43,40],widths=[25,12,22,19,27,24];
 const length=lengths[variant%6]*scale,width=widths[variant%6]*scale,radius=Math.ceil(length+width);
 for(let yy=-radius;yy<=radius;yy++)for(let xx=-radius;xx<=radius;xx++){
  const u=xx*ca+yy*sa,v=-xx*sa+yy*ca,t=u/length;if(Math.abs(t)>1)continue;
  let rim=width*Math.pow(Math.max(0,1-t*t),variant===1?.95:variant===5?.58:.72);
  if(variant===2)rim*=.72+.31*Math.abs(Math.sin((t+.05)*Math.PI*3.1));
  if(variant===3)rim*=1+.11*Math.sin((t+.2)*Math.PI*4)+(v>0?.07:-.04);
  if(variant===4)rim*=.82+.21*Math.abs(Math.cos(t*Math.PI*2.45));
  if(variant===5)rim*=.88+.08*Math.cos(t*Math.PI*2);
  if(Math.abs(v)>rim)continue;
  const nick=Math.floor((u+19)/Math.max(.35,scale)/7);
  if(variant===3&&nick%4===0&&v>rim-2.5*Math.max(.5,scale))continue;
  if(variant===0&&nick%7===0&&v>rim-1.8*Math.max(.5,scale))continue;
  if(variant===2&&Math.abs(t)>.14&&Math.abs(t)<.84&&Math.abs(v)>rim*.69&&((Math.floor((t+1)*11)+Math.sign(v))%3===0))continue;
  if(variant===4&&Math.abs(t)>.18&&Math.abs(t)<.8&&Math.abs(v)>rim*.73&&Math.floor((t+1)*9)%2===0)continue;
  let ink=palette[1];
  if(v>rim-1.4*Math.max(.5,scale))ink=palette[0];
  else if(v< -rim+1.2*Math.max(.5,scale))ink=palette[2];
  else if(Math.abs(v)<.75*Math.max(.6,scale))ink=palette[3];
  else if((Math.floor(u/2)+Math.floor(v/2)+variant)%11===0)ink=palette[2];
  if((variant===3||variant===5)&&t>.15&&t<.4&&v>rim*.34&&v<rim*.67)continue;
  px(c,x+xx,y+yy,1,1,ink);
 }
 const stem=(variant===1?11:variant===4?5:7)*scale;
 for(let i=0;i<stem;i++)px(c,x-ca*(length+i),y-sa*(length+i),1,1,palette[4]);
}
// Real decayed bark reads as a broad slab: mostly straight edges, tapered sides, localized rot and broken fibre.
function bark(x,y,a=0,variant=0,scale=1){
 const ca=Math.cos(a),sa=Math.sin(a),half=(variant===1?62:78)*scale,depth=(variant===1?25:34)*scale;
 const plot=(u,v,color)=>px(ctx,x+u*ca-v*sa,y+u*sa+v*ca,1,1,color);
 for(let row=Math.floor(-depth-5);row<=depth+6;row++)for(let col=Math.floor(-half-6);col<=half+6;col++){
  const n=(row+depth)/(depth*2),left=-half+(variant===0?5:9)*n*scale,right=half-(variant===0?11:4)*n*scale;
  if(col<left||col>right||row< -depth||row>depth)continue;
  // Decay remains local: eaten corners, softened side bites and collapsed fibres rather than a scalloped perimeter.
  const rotCorner=variant===0&&col>right-31*scale&&row< -depth+18*scale&&row<(-depth+18*scale)+(col-(right-31*scale))*.48;
  const brokenEnd=variant===0&&col<left+17*scale&&row>depth-13*scale&&row>(depth-13*scale)+(left+17*scale-col)*.35;
  const sideBite=variant===1&&col>right-19*scale&&row>depth-17*scale&&row>(depth-17*scale)+(col-(right-19*scale))*.42;
  const endLoss=variant===1&&col<left+15*scale&&row< -depth+12*scale;
  const softEdge=variant===0&&col<left+28*scale&&row< -depth+8*scale+(col-left)*.17;
  const lowerRot=variant===0&&col>right-46*scale&&col<right-21*scale&&row>depth-9*scale&&((col+row)%7<3);
  const smallChip=((Math.floor(col*5+row*7+variant*19)%137)===0)&&(Math.abs(row)>depth-5*scale||Math.abs(col)>half-7*scale);
  if(rotCorner||brokenEnd||sideBite||endLoss||softEdge||lowerRot||smallChip)continue;
  let ink=variant===0?'#684a32':'#62452f';
  const fibre=Math.floor((row+depth)/(variant===0?8:7));
  if(fibre%4===0&&Math.abs(row)<depth-4*scale)ink=variant===0?'#573d2e':'#51382b';
  else if(fibre%4===2)ink=variant===0?'#745437':'#6d4d33';
  if(row<=-depth+2*scale)ink=variant===0?'#8c6743':'#866342';
  else if(row>=depth-3*scale)ink='#392f27';
  const rotBand=(variant===0&&col>half*.28&&row< -depth*.30)||(variant===1&&col>half*.34&&row>depth*.18);
  if(rotBand)ink=((col+row)%5<2)?'#49382e':'#574131';
  if((Math.floor(col*11+row*17+variant*23)%71)===0)ink='#8e6a45';
  plot(col,row,ink);
 }
 // Long fibres and a few larger fractures carry the texture without peppering the slab with dark marks.
 const fibres=variant===0?[[-60,-18,96,.015],[-67,-8,116,.01],[-66,3,108,-.018],[-48,13,92,.018],[-41,20,76,.022]]:[[-44,-11,67,.025],[-50,-1,76,.01],[-49,8,70,-.02]];
 for(const [sx,sy,len,slope] of fibres)for(let i=0;i<len*scale;i++)if(i%5!==2)plot((sx+i)*scale,(sy+i*slope+Math.sin(i*.32)*.55)*scale,'#3c3028');
 const cracks=variant===0?[[-33,-9,24,.25],[3,15,28,-.22],[39,-12,20,.30]]:[[-24,-7,21,.26],[8,5,24,-.18]];
 for(const [sx,sy,len,slope] of cracks)for(let i=0;i<len*scale;i++)if(i%4!==1)plot((sx+i)*scale,(sy+i*slope+Math.sin(i*.55))*scale,'#2d2923');
 // One broad delaminated patch reads as lifted bark rather than many small dark spots.
 const flakes=variant===0?[[-42,9,19,8]]:[[20,-4,15,6]];
 for(const [fx,fy,fw,fh] of flakes)for(let yy=-fh;yy<=fh;yy++)for(let xx=-fw;xx<=fw;xx++){
  const d=(xx/fw)**2+(yy/fh)**2;if(d>=1)continue;
  const rim=d>.68;plot((fx+xx)*scale,(fy+yy)*scale,rim?'#80603f':'#49382d');
 }
 if(variant===0){
  // A single larger soft-rot cavity replaces the former cluster of small pits and galleries.
  const holes=[[18,-1,18,11]];
  for(const [hx,hy,rx,ry] of holes)for(let yy=-ry;yy<=ry;yy++)for(let xx=-rx;xx<=rx;xx++){
   const d=(xx/rx)**2+(yy/ry)**2;if(d<1)plot(hx*scale+xx*scale,hy*scale+yy*scale,d>.66?'#5b422f':d>.34?'#403128':'#2b2923');
  }
  // Pale exposed fibres on the eroded upper-right corner.
  for(let i=0;i<19;i++){plot((half-35*scale+i*1.15*scale),(-depth+16*scale+i*.3*scale),'#9d774e');if(i%3===0)plot((half-36*scale+i*1.15*scale),(-depth+19*scale+i*.3*scale),'#6f533a')}
 }else{
  const holes=[[10,2,10,7]];
  for(const [hx,hy,rx,ry] of holes)for(let yy=-ry;yy<=ry;yy++)for(let xx=-rx;xx<=rx;xx++){const d=(xx/rx)**2+(yy/ry)**2;if(d<1)plot(hx*scale+xx,hy*scale+yy,d>.65?'#5b4432':'#373029')}
  for(let yy=-7;yy<=7;yy++)for(let xx=-5;xx<=5;xx++){const d=(xx/5)**2+(yy/7)**2;if(d<1)plot((-half+11*scale)+xx,yy,d>.6?'#765639':d>.25?'#8f6a47':'#47352b')}
 }
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
function sphagnumPatch(cx,cy,rx,ry,seed=0){
 const greens=['#354638','#40523d','#4d6244','#60704c','#78805a'];
 for(let i=0;i<150;i++){
  const a=(i*2.399+seed*.73),r=Math.sqrt(((i*37+seed*13)%149)/149);
  const x=cx+Math.cos(a)*rx*r*(.82+.18*Math.sin(i*.61+seed)),y=cy+Math.sin(a)*ry*r;
  const edge=((x-cx)/rx)**2+((y-cy)/ry)**2;if(edge>1+.08*Math.sin(i))continue;
  const base=greens[(i+seed)%4];px(ctx,x,y,2+(i%3===0),1+(i%4===0),base);
  if(i%5===0){const len=3+i%4;for(let j=1;j<=len;j++){px(ctx,x,y-j,1,1,greens[2+(j+i)%3]);if(j>1&&j%2===0)px(ctx,x+(i%2?1:-1),y-j,1,1,greens[1+(i+j)%3])}}
 }
}
function scenery(t){
 // Sphagnum/moss remains clustered, with a few smaller islands to keep the floor from reading empty.
 sphagnumPatch(48,80,36,58,1);sphagnumPatch(42,184,31,70,3);sphagnumPatch(48,318,38,58,5);sphagnumPatch(323,390,34,25,8);
 sphagnumPatch(112,368,16,12,11);sphagnumPatch(338,211,15,18,13);
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
 // Mixed-tree litter: irregular size classes and non-cyclic angles keep the floor from looking stamped.
 for(let i=0;i<34;i++){
  const x=20+(i*91+i%5*17+i%3*7)%344,y=18+(i*67+i%7*19+i%4*11)%390;
  const hash=(i*53+x*7+y*11)%997,variant=hash%6,tone=(hash>>3)%LEAF_PALETTES.length;
  const sizeClass=[.14,.18,.22,.27,.34,.43,.52][hash%7],angle=((hash*0.017+i*1.618)%6.283)-3.1415;
  leaf(ctx,x,y,angle,variant,sizeClass,tone);
  if(i%9===0)leaf(ctx,x+5,y+4,angle+1.7,(variant+3)%6,sizeClass*.58,(tone+2)%LEAF_PALETTES.length);
 }
 // Small wood debris in several shapes supports the two larger shelter slabs.
 const chips=[[106,101,.55,0,.75],[337,119,-.35,1,.66],[82,382,2.55,2,.82],[258,350,-1.0,0,.6],[160,57,.15,2,.55],[320,269,2.15,1,.55],[214,42,2.82,0,.5],[47,226,-.84,1,.47],[346,365,.42,2,.6],[136,223,1.7,0,.42]];
 for(const [x,y,a,kind,s] of chips)woodChip(x,y,a,kind,s);
}

new ResizeObserver(()=>drawHabitat(0)).observe(canvas);
return {reset,stage,react,zoom,zoomBy:d=>zoom(camera.zoom+d),home:()=>{camera.x=192;camera.y=215;return zoom(1)},start:()=>{if(!active){active=true;last=performance.now();frame=requestAnimationFrame(tick)}},stop:()=>{interaction.cancel();active=false;cancelAnimationFrame(frame)},visible:()=>critters.filter(c=>!c.hidden).length};
}
