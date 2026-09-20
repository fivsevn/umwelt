import {drawBaseScene,DEFAULT_LAYOUT} from './scenery/index.mjs?v=forest-10';

const canvas=document.querySelector('#emptyHabitat');
if(canvas){
 const world=document.createElement('canvas');
 world.width=384;world.height=430;
 const ctx=world.getContext('2d');
 ctx.imageSmoothingEnabled=false;
 drawBaseScene(ctx,{
  wetZones:DEFAULT_LAYOUT.background.params.wetZones,
  light:DEFAULT_LAYOUT.background.params.light,
  shelterLift:0,
  seed:DEFAULT_LAYOUT.background.seed
 });

 const rect=canvas.getBoundingClientRect();
 const width=Math.max(80,Math.round(rect.width||384));
 const height=Math.max(80,Math.round(rect.height||430));
 const scale=Math.max(1,(rect.width||384)/384);
 const sw=(rect.width||384)/scale;
 const sh=(rect.height||430)/scale;
 const x=Math.max(sw/2,Math.min(384-sw/2,192));
 const y=Math.max(sh/2,Math.min(430-sh/2,215));
 const sx=x-sw/2,sy=y-sh/2;

 canvas.width=width;canvas.height=height;
 const display=canvas.getContext('2d');
 display.imageSmoothingEnabled=false;
 display.clearRect(0,0,width,height);
 display.drawImage(world,sx,sy,sw,sh,0,0,width,height);
 canvas.dataset.titlePreview='ready';
}
