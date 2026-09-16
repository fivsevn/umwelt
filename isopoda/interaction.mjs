// GAME defaults, in milliseconds; future species may supply an interaction config.
export function interactionConfig(actor){
 const full=actor.model?.visual.conglobation.ability==='full';
 return {tap:full?'volvation':'freeze',pickupPose:full?'curled':'tucked',longPress:500,defenseDuration:2600,recoveryTime:800,...actor.interaction};
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
export function bindPointerInteraction(canvas,{enabled,worldPoint,hitTest,pan,draw}){
 let gesture=null;
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
  if(g.actor){
   const config=interactionConfig(g.actor);
   if(g.grabbed&&!cancel&&event)placeIndividual(g.actor,worldPoint(event));
   holdIndividual(g.actor,!cancel&&!g.grabbed&&!g.moved?'defensive':'recovering',
    !cancel&&!g.grabbed&&!g.moved?config.defenseDuration:config.recoveryTime);
  }
  if(canvas.hasPointerCapture(g.id))canvas.releasePointerCapture(g.id);
  draw();
 }
 canvas.addEventListener('pointerdown',event=>{
  if(gesture||!enabled()||event.button!==0||event.isPrimary===false)return;
  event.preventDefault();
  const actor=hitTest(worldPoint(event));
  gesture={id:event.pointerId,actor,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false,grabbed:false};
  canvas.setPointerCapture(event.pointerId);
  if(actor){
   holdIndividual(actor,'pressed');
   const g=gesture;
   g.timer=setTimeout(()=>{
    if(gesture!==g||g.moved)return;
    g.grabbed=true;holdIndividual(actor,'grabbed');draw();
   },interactionConfig(actor).longPress);
   draw();
  }
 });
 canvas.addEventListener('pointermove',event=>{
  const g=gesture;if(!g||event.pointerId!==g.id)return;
  event.preventDefault();
  if(g.actor){
   if(g.grabbed){placeIndividual(g.actor,worldPoint(event));draw()}
   else if(Math.hypot(event.clientX-g.startX,event.clientY-g.startY)>10){g.moved=true;clear()}
  }else pan(event.clientX-g.x,event.clientY-g.y);
  g.x=event.clientX;g.y=event.clientY;
 });
 canvas.addEventListener('pointerup',event=>finish(event));
 for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>finish(event,true));
 canvas.addEventListener('contextmenu',event=>event.preventDefault());
 window.addEventListener('blur',()=>finish(null,true));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(null,true)});
 return {cancel:()=>finish(null,true)};
}
