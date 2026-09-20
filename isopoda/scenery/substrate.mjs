import {px,WORLD_W,WORLD_H,hash32} from './pixel.mjs';
const PALETTES=[['#493e2e','#39372b','#534532'],['#403b2d','#303328','#49412f'],['#37392c','#2c3228','#414030']];
export function drawSubstrate(ctx,{wetZones=[],light=100,seed=57}={}){
 ctx.imageSmoothingEnabled=false;
 const wetAt=(x,y)=>Math.max(0,...wetZones.map(z=>Math.max(0,1-((x-z.x)/(z.rx||1))**2-((y-z.y)/(z.ry||1))**2)*(Number(z.moisture)||0)/100));
 const palette=(x,y)=>PALETTES[wetAt(x,y)>.5?2:wetAt(x,y)>.16?1:0];
 px(ctx,0,0,WORLD_W,WORLD_H,PALETTES[0][0]);
 // Restore the early forest floor's coherent humus islands, not per-pixel noise.
 for(let y=0;y<WORLD_H;y+=4)for(let x=0;x<WORLD_W;x+=4){
  const n=Math.sin(x*.031+Math.sin(y*.023))*Math.cos(y*.042)+Math.sin((x+y)*.018)*.45;
  const p=palette(x,y);px(ctx,x,y,4,4,n<-.58?p[1]:n>.74?p[2]:p[0]);
 }
 for(let i=0;i<240;i++){
  const h=hash32(seed,'humus',i),x=4+h%187*2,y=4+(h>>>10)%209*2,w=4+(h>>>21)%4*2;
  px(ctx,x,y,w,2+(i%3===0?2:0),i%3===0?'#5b4b34':'#393329');
  if(i%9===0)px(ctx,x+2,y-2,4,2,'#756044');
 }
 // Sparse mineral and decomposed leaf clusters supply readable mid-scale detail.
 for(let i=0;i<38;i++){
  const h=hash32(seed,'mineral',i),x=8+h%180*2,y=8+(h>>>10)%202*2;
  px(ctx,x,y,6,4,'#2e3026');px(ctx,x,y-2,4,4,i%3?'#77745a':'#64664a');
  if(i%3===0)px(ctx,x,y-2,2,2,'#a29a72');
 }
 if(light<55){ctx.fillStyle=`rgba(14,24,20,${(55-light)/135})`;ctx.fillRect(0,0,WORLD_W,WORLD_H)}
}
