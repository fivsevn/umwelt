import {paint,contains,nearLine} from './grammar.mjs?v=forest-2';
import {hash32} from './pixel.mjs';
// Top-down moss: overlapping branching shoots, no shaded hill silhouettes.
const PATCH=[[-1,-.2],[-.75,-.55],[-.38,-.5],[-.22,-.92],[.18,-.75],[.46,-.92],[.7,-.48],[1,-.12],[.8,.25],[.94,.5],[.54,.64],[.3,.92],[-.05,.7],[-.48,.86],[-.62,.47],[-.91,.42]];
export function drawMossPatch(ctx,{x=0,y=0,a=0,rx=62,ry=42,seed=0,wetness=.65,variant=0}={}){
 const p=wetness>.72?['#293b2e','#3b4d32','#53633d','#7b8653']:['#303c2b','#455335','#627044','#7c8553'];
 const shoots=[];
 for(let i=0;i<22;i++){
  const h=hash32(seed,'shoot',i),theta=i*2.399,rad=Math.sqrt((h%997)/997);
  const cx=Math.cos(theta)*rx*.82*rad,cy=Math.sin(theta)*ry*.82*rad,angle=(h>>>12)%628/100,len=10+(h>>>21)%9;
  const ca=Math.cos(angle),sa=Math.sin(angle);
  shoots.push({cx,cy,ca,sa,len});
 }
 paint(ctx,{x,y,a,extent:Math.max(rx,ry)+8,edge:null,shadow:false,inside:(u,v)=>contains(PATCH,u/rx,v/ry),shade:(u,v)=>{
  let ink=p[0];
  for(const s of shoots){
   const dx=u-s.cx,dy=v-s.cy,uu=dx*s.ca+dy*s.sa,vv=-dx*s.sa+dy*s.ca;
   if(Math.abs(uu)>s.len+3||Math.abs(vv)>9)continue;
   if(nearLine(uu,vv,-s.len,0,s.len,0,1.4))ink=p[2];
   for(let j=-s.len+3;j<s.len;j+=6)for(const side of [-1,1]){
    const leaf=[[j-4,0],[j-2,side*5],[j+2,side*7],[j+4,side*3],[j+2,0]];
    if(contains(leaf,uu,vv))ink=side<0?p[3]:p[2];
   }
  }
  if(ink===p[0]&&(Math.sin(u*.17)+Math.cos(v*.22)>.8))return p[1];
  return ink;
 }});
}
