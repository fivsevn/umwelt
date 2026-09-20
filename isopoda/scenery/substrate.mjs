import {px,WORLD_W,WORLD_H,hash32} from './pixel.mjs';
const PALETTES=[['#795338','#704a33','#886040'],['#6c4933','#63412f','#785237'],['#5e402f','#56392c','#694731']];
export function drawSubstrate(ctx,{wetZones=[],light=100,seed=57}={}){
 ctx.imageSmoothingEnabled=false;
 const wetAt=(x,y)=>Math.max(0,...wetZones.map(z=>Math.max(0,1-((x-z.x)/(z.rx||1))**2-((y-z.y)/(z.ry||1))**2)*(Number(z.moisture)||0)/100));
 const palette=(x,y)=>PALETTES[wetAt(x,y)>.5?2:wetAt(x,y)>.16?1:0];
 px(ctx,0,0,WORLD_W,WORLD_H,PALETTES[0][0]);
 // Broad, stepped moisture bands. No per-cell random color or dithering.
 for(let y=0;y<WORLD_H;y+=6)for(let x=0;x<WORLD_W;x+=6)px(ctx,x,y,6,6,palette(x,y)[0]);
 for(let i=0;i<95;i++){
  const h=hash32(seed,'soil-cluster',i),x=6+(h%181)*2,y=6+((h>>>10)%205)*2,w=6+((h>>>21)%5)*2;
  const p=palette(x,y);px(ctx,x,y,w,4,p[1]);px(ctx,x+4,y-2,w-4,2,p[1]);
  if(i%5===0)px(ctx,x+2,y-4,6,2,p[2]);
 }
 for(let i=0;i<18;i++){
  const h=hash32(seed,'humus',i),x=8+h%180*2,y=8+(h>>>10)%202*2;
  px(ctx,x,y,6,2,'#4c362c');if(i%3===0)px(ctx,x+4,y-2,4,2,'#a0784b');
 }
 if(light<55){ctx.fillStyle=`rgba(14,24,20,${(55-light)/135})`;ctx.fillRect(0,0,WORLD_W,WORLD_H)}
}
