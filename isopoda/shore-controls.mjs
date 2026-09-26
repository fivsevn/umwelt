import {isShore,shorePoint,shoreWalkLabel} from './data/habitats/estuary-shore.mjs';
// Two small shoe impressions, rasterized directly on the scene's pixel lattice.
function footprints(canvas,direction){
 const g=canvas.getContext('2d');canvas.width=38;canvas.height=24;g.imageSmoothingEnabled=false;
 const sole=['00111100','01111110','11111111','11111111','11111111','11111111','01111110','01111100','00111100','00111000','00111000','00000000','00111100','00111100','00111100','00111100','00011000'];
 g.fillStyle='#b5bb98';
 for(const [ox,oy] of [[1,12],[20,1]])for(let y=0;y<sole.length;y++)for(let x=0;x<8;x++)if(sole[y][x]==='1'){
  const px=ox+16-y,py=oy+x;g.fillRect(direction>0?px:37-px,py,1,1);
 }
}
export function createShoreControls(previous,next){
 const buttons=[[previous,-1],[next,1]];
 for(const [button,direction] of buttons){const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');footprints(canvas,direction);const label=document.createElement('span');label.className='shore-walk-label';label.dataset.directLocale='true';button.replaceChildren(canvas,label)}
 return (state,lang)=>{
  for(const [button,direction] of buttons){
   const outside=shorePoint(state)+direction<0||shorePoint(state)+direction>2;
   button.hidden=!isShore(state)||outside;button.disabled=outside;
   const label=shoreWalkLabel(state,direction,lang);button.querySelector('span').textContent=label;button.setAttribute('aria-label',label);button.title=label;
  }
 };
}
