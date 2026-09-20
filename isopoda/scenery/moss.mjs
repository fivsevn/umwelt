import {paint,contains,nearLine} from './grammar.mjs?v=forest-9';
import {hash32,px,rot} from './pixel.mjs';
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
 paint(ctx,{x,y,seed,a,extent:Math.max(rx,ry)+8,edge:null,shadow:false,roughness:0,inside:(u,v)=>contains(PATCH,u/rx,v/ry),shade:(u,v)=>{
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

 // Sphagnum grows from capitula: short stems with alternating upright and
 // pendulous branchlets. Draw those as readable 1px cells on top of the mat.
 const at=(u,v,w,h,color)=>{const [dx,dy]=rot(u,v,a);const snap=n=>Math.round(n);px(ctx,snap(x+dx),snap(y+dy),w,h,color)};
 for(let i=0;i<shoots.length;i++){
  const s=shoots[i],h=hash32(seed,'capitulum',i),stem=Math.max(5,Math.round(s.len*.62));
  for(let j=0;j<stem;j++){
   const bend=Math.sin(j*.48+i)*1.2;
   at(s.cx+s.ca*(j-stem*.35)-s.sa*bend,s.cy+s.sa*(j-stem*.35)+s.ca*bend,1,1,p[1]);
  }
  const tipU=s.cx+s.ca*(stem-stem*.35),tipV=s.cy+s.sa*(stem-stem*.35);
  // Small star-like crown, with a few asymmetric arms rather than a round tuft.
  for(let arm=0;arm<5;arm++){
   const angle=(h%628)/100 + arm*1.256;
   const len=4+(h>>>((arm%4)*5))%6;
   const ex=tipU+Math.cos(angle)*len,ey=tipV+Math.sin(angle)*len;
   for(let q=0;q<=len;q++)at(tipU+(ex-tipU)*q/len,tipV+(ey-tipV)*q/len,1,1,arm%2?p[2]:p[3]);
  }
  // Alternating drooping branchlets are the key silhouette cue in real moss.
  for(const side of [-1,1]){
   const start=Math.max(0,Math.round(stem*.18+(h%5))),len=5+(h>>>18)%6;
   const bx=s.cx+s.ca*(start-stem*.35)-s.sa*side*2,by=s.cy+s.sa*(start-stem*.35)+s.ca*side*2;
   for(let q=0;q<len;q++)at(bx+s.ca*q+side*s.sa*q*.55,by+s.sa*q-side*s.ca*q*.55,1,1,p[2]);
  }
 }
}
