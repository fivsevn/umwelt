// GAME defaults, in milliseconds; future species may supply an interaction config.
export function interactionConfig(actor){
 const full=actor.model?.visual.conglobation.ability==='full';
 return {tap:full?'volvation':'freeze',pickupPose:full?'curled':'tucked',longPress:400,defenseDuration:2600,recoveryTime:800,...actor.interaction};
}
export function holdIndividual(actor,mode,duration=0){
 const config=interactionConfig(actor);
 actor.interactionState={mode,remaining:duration/1000};
 actor.posture=mode==='defensive'?(config.tap==='volvation'?'curled':'tucked'):config.pickupPose;
 actor.moving=false;actor.lift=mode==='grabbed'?-4:0;
 actor.occlusion=0;actor.hidden=false;
}
export function stepInteraction(actor,dt){
 const interaction=actor.interactionState;
 if(!interaction)return false;
 if(interaction.mode==='defensive'||interaction.mode==='recovering'){
  interaction.remaining-=dt;
  if(interaction.remaining<=0){actor.interactionState=null;actor.lift=0;return false}
 }
 actor.moving=false;
 return true;
}
export function placeIndividual(actor,point){
 actor.x=Math.max(24,Math.min(355,point.x));
 actor.y=Math.max(30,Math.min(400,point.y));
}
// A single captured pointer owns either an animal gesture or the existing camera pan.
export function bindPointerInteraction(canvas,{enabled,worldPoint,hitTest,objectHitTest=()=>null,pan,draw,report=()=>{},objectHoldStart=()=>{},objectHoldEnd=()=>{},groundTap=()=>{}}){
 let gesture=null,lastObjectTap=null;
 // Mobile Safari/Chrome must treat the habitat as a game surface, not selectable page content.
 canvas.style.touchAction='none';
 canvas.style.userSelect='none';
 canvas.style.webkitUserSelect='none';
 canvas.style.webkitTouchCallout='none';
 for(const type of ['selectstart','dragstart'])canvas.addEventListener(type,event=>event.preventDefault());
 const clear=()=>{if(gesture?.timer)clearTimeout(gesture.timer)};
 function finish(event,cancel=false){
  if(!gesture||(event&&event.pointerId!==gesture.id))return;
  const g=gesture;clear();gesture=null;
  const point=event?worldPoint(event):null;
  if(g.actor){
   const config=interactionConfig(g.actor);
   if(g.grabbed&&!cancel&&point){placeIndividual(g.actor,point);report({type:'place',actor:g.actor,point})}
   if(!cancel&&!g.grabbed&&!g.moved)report({type:'tap',actor:g.actor,point});
   holdIndividual(g.actor,!cancel&&!g.grabbed&&!g.moved?'defensive':'recovering',
    !cancel&&!g.grabbed&&!g.moved?config.defenseDuration:config.recoveryTime);
  }else if(g.object){
   if(g.objectHeld)objectHoldEnd(g.object,point,{cancel});
  }else if(!cancel&&!g.moved&&point)groundTap(point);
  if(canvas.hasPointerCapture(g.id))canvas.releasePointerCapture(g.id);
  draw();
 }
 canvas.addEventListener('pointerdown',event=>{
  if(gesture||!enabled()||event.button!==0||event.isPrimary===false)return;
  event.preventDefault();
  const point=worldPoint(event),actor=hitTest(point),object=actor?null:objectHitTest(point);
  gesture={id:event.pointerId,actor,object,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false,grabbed:false,objectHeld:false};
  canvas.setPointerCapture(event.pointerId);
  const g=gesture;
  if(actor){
   holdIndividual(actor,'pressed');
   g.timer=setTimeout(()=>{
    if(gesture!==g||g.moved)return;
    g.grabbed=true;holdIndividual(actor,'grabbed');report({type:'grab',actor,point:worldPoint(event)});draw();
   },interactionConfig(actor).longPress);
   draw();
  }else if(object){
   const now=performance.now(),previous=lastObjectTap;
   const doubled=previous&&previous.object.kind===object.kind&&now-previous.time<360&&Math.hypot(previous.x-point.x,previous.y-point.y)<20;
   if(doubled){
    lastObjectTap=null;g.objectHeld=true;objectHoldStart(object,point);draw();
   }else{
    lastObjectTap={object,time:now,x:point.x,y:point.y};
    g.timer=setTimeout(()=>{
     if(gesture!==g||g.moved)return;
     g.objectHeld=true;objectHoldStart(object,point);draw();
    },420);
   }
  }
 });
 canvas.addEventListener('pointermove',event=>{
  const g=gesture;if(!g||event.pointerId!==g.id)return;
  event.preventDefault();
  const distance=Math.hypot(event.clientX-g.startX,event.clientY-g.startY);
  if(g.actor){
   if(g.grabbed){placeIndividual(g.actor,worldPoint(event));draw()}
   else if(distance>10){g.moved=true;clear()}
  }else if(g.object){
   if(!g.objectHeld&&distance>10){g.moved=true;clear();pan(event.clientX-g.x,event.clientY-g.y)}
  }else{
   if(distance>8)g.moved=true;
   pan(event.clientX-g.x,event.clientY-g.y);
  }
  g.x=event.clientX;g.y=event.clientY;
 });
 canvas.addEventListener('pointerup',event=>finish(event));
 for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>finish(event,true));
 canvas.addEventListener('contextmenu',event=>event.preventDefault());
 window.addEventListener('blur',()=>finish(null,true));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(null,true)});
 return {cancel:()=>finish(null,true)};
}
