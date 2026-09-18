import {px,WORLD_W,WORLD_H,hash32} from './pixel.mjs';

const DRY=['#4b3f33','#45392f','#514435','#3d342c','#57483a'];
const MID=['#40372e','#39332b','#463b30','#34312a','#4b3d31'];
const WET=['#342f29','#302c27','#393129','#292d28','#3c352c'];

export function drawSubstrate(ctx,{wetZones=[],light=100,seed=57}={}){
 px(ctx,0,0,WORLD_W,WORLD_H,'#40362d');
 for(let y=2;y<WORLD_H-2;y+=2)for(let x=2;x<WORLD_W-2;x+=2){
  let wet=0;
  for(const z of wetZones){
   const rx=Math.max(1,z.rx||1),ry=Math.max(1,z.ry||1);
   const d=((x-z.x)/rx)**2+((y-z.y)/ry)**2;
   if(d<1.28)wet=Math.max(wet,Math.max(0,1-d/1.28)*(Number(z.moisture)||0)/100);
  }
  const palette=wet>.52?WET:wet>.18?MID:DRY;
  const h=hash32(seed,x>>1,y>>1);
  let ink=palette[h%palette.length];
  if(wet>.48&&h%29===0)ink='#425044';
  if(h%43===0)ink=wet>.35?'#53604d':'#6b5842';
  px(ctx,x,y,2,2,ink);
 }
 // sparse humus chunks, large enough to read without becoming noise
 for(let i=0;i<32;i++){
  const h=hash32(seed,'humus',i),x=10+h%364,y=10+((h>>>9)%410),w=2+((h>>>18)%5),hh=1+((h>>>23)%3);
  px(ctx,x,y,w,hh,[ '#302b26','#5c4734','#6d533a','#2c2a26'][h%4]);
 }
 if(light<55){
  ctx.fillStyle=`rgba(14,24,20,${(55-light)/135})`;
  ctx.fillRect(0,0,WORLD_W,WORLD_H);
 }
}
