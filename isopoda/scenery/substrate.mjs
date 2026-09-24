import {materialInk} from './grammar.mjs';
import {px,WORLD_W,WORLD_H,hash32} from './pixel.mjs';
const PALETTES=[['#493e2e','#39372b','#534532'],['#403b2d','#303328','#49412f'],['#37392c','#2c3228','#414030']];
export function drawSubstrate(ctx,{wetZones=[],light=100,seed=57}={}){
 ctx.imageSmoothingEnabled=false;
 const wetAt=(x,y)=>{let wet=0;for(const z of wetZones)wet=Math.max(wet,Math.max(0,1-((x-z.x)/(z.rx||1))**2-((y-z.y)/(z.ry||1))**2)*(Number(z.moisture)||0)/100);return wet};
 const palette=(x,y)=>{const wet=wetAt(x,y);return PALETTES[wet>.5?2:wet>.16?1:0]};
 px(ctx,0,0,WORLD_W,WORLD_H,PALETTES[0][0]);
 // Restore the early forest floor's coherent humus islands, not per-pixel noise.
 // Write the opaque soil in one upload instead of 165,120 canvas calls.
 const image=typeof document!=='undefined'&&typeof ctx.createImageData==='function'&&typeof ctx.drawImage==='function'?ctx.createImageData(WORLD_W,WORLD_H):null,colors=new Map();
 for(let y=0;y<WORLD_H;y++)for(let x=0;x<WORLD_W;x++){
  const n=Math.sin(x*.031+Math.sin(y*.023))*Math.cos(y*.042)+Math.sin((x+y)*.018)*.45;
  const p=palette(x,y),color=materialInk(n<-.58?p[1]:n>.74?p[2]:p[0],x,y,seed,'soil');
  if(image){
   let rgb=colors.get(color);if(!rgb){const value=parseInt(color.slice(1),16);rgb=[value>>16&255,value>>8&255,value&255];colors.set(color,rgb)}
   const i=(y*WORLD_W+x)*4;image.data[i]=rgb[0];image.data[i+1]=rgb[1];image.data[i+2]=rgb[2];image.data[i+3]=255;
  }else px(ctx,x,y,1,1,color);
 }
 if(image){const raster=document.createElement('canvas');raster.width=WORLD_W;raster.height=WORLD_H;raster.getContext('2d').putImageData(image,0,0);ctx.drawImage(raster,0,0)}
 for(let i=0;i<240;i++){
  const h=hash32(seed,'humus',i),x=4+h%187*2,y=4+(h>>>10)%209*2,w=2+(h>>>21)%4;
  px(ctx,x,y,w,1+(i%3===0?1:0),i%3===0?'#5b4b34':'#393329');
  if(i%9===0)px(ctx,x+1,y-1,2,1,'#756044');
 }
 // Sparse mineral and decomposed leaf clusters supply readable mid-scale detail.
 for(let i=0;i<38;i++){
  const h=hash32(seed,'mineral',i),x=8+h%180*2,y=8+(h>>>10)%202*2;
  px(ctx,x,y,4,3,'#2e3026');px(ctx,x,y-1,3,2,i%3?'#77745a':'#64664a');
  if(i%3===0)px(ctx,x,y-1,1,1,'#a29a72');
 }
 if(light<55){ctx.fillStyle=`rgba(14,24,20,${(55-light)/135})`;ctx.fillRect(0,0,WORLD_W,WORLD_H)}
}
