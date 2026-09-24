import {WATER_DETAILS,drawWaterDetail} from './aquatic-materials.mjs';
import {LAUNCH_DETAILS,drawLaunchDetail} from './launch-materials.mjs';
const noise=(x,y,seed=0)=>{let n=Math.imul(x+seed+1,374761393)^Math.imul(y+1,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
const pixel=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};
function localPixel(g,o,u,v,w,h,c){
 const s=o.scale??1,a=o.a||0,ca=Math.cos(a),sa=Math.sin(a);
 pixel(g,o.x+(u*ca-v*sa)*s,o.y+(u*sa+v*ca)*s,w*s,h*s,c);
}
function localLine(g,o,ax,ay,bx,by,width,color){
 const steps=Math.max(1,Math.ceil(Math.max(Math.abs(bx-ax),Math.abs(by-ay))));
 for(let i=0;i<=steps;i++){const t=i/steps;localPixel(g,o,ax+(bx-ax)*t,ay+(by-ay)*t,width,width,color)}
}
export function withSoftWorldShadow(g,{alpha=.1,dy=2}={},draw){
 if(alpha<=0||dy<=0||typeof g.save!=='function'||typeof g.restore!=='function')return draw();
 g.save();g.shadowColor=`rgba(18,24,20,${alpha})`;g.shadowOffsetX=0;g.shadowOffsetY=dy;g.shadowBlur=0;
 try{return draw()}finally{g.restore()}
}
function shadowFor(kind){
 if(kind==='rock-crack')return {alpha:0,dy:0};
 if(kind==='mycelium'||kind==='humus'||kind==='silt'||kind==='abyssal-silt'||kind==='estuary-silt'||kind==='cave-silt'||kind==='dish-sediment')return {alpha:.055,dy:1};
 if(kind==='tidal-runnel'||kind==='seep-film'||kind==='sand-ripple'||kind==='foam-trace'||kind==='glass-scratch')return {alpha:0,dy:0};
 if(kind==='mud-burrows'||kind==='wrack-line')return {alpha:.07,dy:1};
 if(kind==='limestone-shelf'||kind==='flowstone')return {alpha:.12,dy:2};
 if(kind==='algae-film'||kind==='crustose')return {alpha:.045,dy:1};
 if(kind==='leaf-skeleton'||kind==='root-tangle')return {alpha:.13,dy:2};
 if(kind==='shell-fragment'||kind==='holdfast'||kind==='nodule')return {alpha:.11,dy:2};
 if(kind==='sponge'||kind==='sunken-wood')return {alpha:.14,dy:3};
 return {alpha:.08,dy:2};
}
function drawShape(g,{kind,x=0,y=0,a=0,scale=1,seed=57}={}){
 const o={x,y,a,scale};
 if(WATER_DETAILS.has(kind))return drawWaterDetail(g,{kind,x,y,a,scale,seed});
 if(LAUNCH_DETAILS.has(kind))return drawLaunchDetail(g,{kind,x,y,a,scale,seed});
 if(kind==='root-tangle'){
  for(let i=0;i<7;i++){const n=noise(i,17,seed),sy=-22+(n%45),len=28+((n>>>8)%28),bend=((n>>>15)%15)-7;
   localLine(g,o,-28,sy,-8+bend,sy+((n>>>19)%9)-4,1,i%3===0?'#2f2b22':'#4b4130');
   localLine(g,o,-8+bend,sy+((n>>>19)%9)-4,len-28,sy+((n>>>23)%13)-6,1,i%2?'#5b4d36':'#403729');
   if(i%2===0)localLine(g,o,-2,sy+1,8,sy-7,1,'#6c5b3e');
  }return;
 }
 if(kind==='leaf-skeleton'){
  const dark='#67533a',mid='#8b7350',pale='#b19b70';localLine(g,o,-24,0,24,0,2,dark);
  for(let i=-4;i<=4;i++){const u=i*5;localLine(g,o,u,0,u+(i<0?-9:9),-9+Math.abs(i),1,mid);localLine(g,o,u,0,u+(i<0?-8:8),9-Math.abs(i),1,mid)}
  for(let i=-20;i<=20;i+=5)if((noise(i,31,seed)&3)!==0)localPixel(g,o,i,-1,2,1,pale);return;
 }
 if(kind==='mycelium'){
  for(let i=0;i<13;i++){const n=noise(i,41,seed),u=-22+(n%45),v=-14+((n>>>8)%29),len=4+((n>>>15)%9),dir=(n&1)?1:-1;
   localLine(g,o,u,v,u+dir*len,v+((n>>>20)%7)-3,1,i%4===0?'#c4c0a7':'#9f9e89');if(i%3===0)localPixel(g,o,u,v,2,1,'#d2cdb2')
  }return;
 }
 if(kind==='humus'){
  const colors=['#29261f','#3a3327','#514634'];
  for(let i=0;i<26;i++){const n=noise(i,53,seed),u=-25+(n%51),v=-14+((n>>>8)%29),w=1+(n%5);localPixel(g,o,u,v,w,1,colors[i%colors.length]);if(i%7===0)localPixel(g,o,u+1,v-1,1,1,colors[2])}return;
 }
 if(kind==='shell-fragment'){
  localPixel(g,o,-17,-4,31,8,'#6b7169');localPixel(g,o,-14,-7,26,4,'#aba78e');localPixel(g,o,-8,-10,16,3,'#cec5a2');localPixel(g,o,6,-7,6,4,'#817f6d');localPixel(g,o,-14,2,24,2,'#8e8b75');return;
 }

}
export function drawSceneDetail(g,options={}){
 return withSoftWorldShadow(g,shadowFor(options.kind),()=>drawShape(g,options));
}
