import {createHabitat as createBaseHabitat,SCENE_PIXEL} from './habitat.mjs?v=ambient-1';

export {SCENE_PIXEL};

// Habitat-only legibility pass. The specimen pixels themselves are unchanged:
// a muted light rim on the upper/left edge and a dark rim on the lower/right edge
// separate tiny moving animals from bark, soil and leaf litter without affecting
// the catalog, morphology lab or any other renderer.
const LIGHT_RIM='rgba(218,216,184,.48)';
const DARK_RIM='rgba(24,28,22,.62)';
const RIM_STEPS=[[-1,0,LIGHT_RIM],[0,-1,LIGHT_RIM],[1,0,DARK_RIM],[0,1,DARK_RIM]];

function patchWorldCanvas(canvas){
 const getContext=canvas.getContext.bind(canvas);
 let patched=false;
 canvas.getContext=function(type,...args){
  const ctx=getContext(type,...args);
  if(type!=='2d'||!ctx||patched)return ctx;
  patched=true;
  const fillRect=ctx.fillRect.bind(ctx),drawImage=ctx.drawImage.bind(ctx);

  function installSpecimenPass(){
   const painted=new Set();
   ctx.fillRect=function(x,y,w,h){
    // drawHabitat() begins every new frame with one full-world fill. Restore the
    // native fast path there so scenery rendering pays no per-pixel rim overhead.
    if(w>=300&&h>=300){ctx.fillRect=fillRect;painted.clear();return fillRect(x,y,w,h)}
    if(w===1&&h===1){
     const px=Math.round(x),py=Math.round(y),style=ctx.fillStyle;
     for(const [dx,dy,color] of RIM_STEPS){
      const nx=px+dx,ny=py+dy,key=nx+','+ny;
      if(painted.has(key))continue;
      ctx.fillStyle=color;fillRect(nx,ny,1,1);
     }
     ctx.fillStyle=style;
     const result=fillRect(x,y,1,1);
     painted.add(px+','+py);
     return result;
    }
    return fillRect(x,y,w,h);
   };
  }

  // The habitat renderer composites its coarsened scenery back into the world
  // immediately before drawActors(). That boundary is the safest place to turn
  // the specimen-only rim on; the next frame turns it back off automatically.
  ctx.drawImage=function(...drawArgs){
   const result=drawImage(...drawArgs);
   installSpecimenPass();
   return result;
  };
  return ctx;
 };
}

export function createHabitat(canvas,layer,getState){
 const createElement=document.createElement.bind(document);
 let canvasIndex=0;
 document.createElement=function(tagName,...args){
  const element=createElement(tagName,...args);
  if(String(tagName).toLowerCase()==='canvas'&&++canvasIndex===1)patchWorldCanvas(element);
  return element;
 };
 try{return createBaseHabitat(canvas,layer,getState)}
 finally{document.createElement=createElement}
}
