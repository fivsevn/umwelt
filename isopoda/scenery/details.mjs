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
 if(kind==='humus'||kind==='silt'||kind==='abyssal-silt'){
  const colors=kind==='humus'?['#29261f','#3a3327','#514634']:kind==='silt'?['#314039','#435046','#5a5d4b']:['#182326','#243033','#354043'];
  for(let i=0;i<26;i++){const n=noise(i,53,seed),u=-25+(n%51),v=-14+((n>>>8)%29),w=1+(n%5);localPixel(g,o,u,v,w,1,colors[i%colors.length]);if(i%7===0)localPixel(g,o,u+1,v-1,1,1,colors[2])}return;
 }
 if(kind==='rock-crack'){
  const c='#2d3937';localLine(g,o,-24,-9,-7,-2,1,c);localLine(g,o,-7,-2,2,8,1,c);localLine(g,o,2,8,19,15,1,c);localLine(g,o,-5,0,4,-9,1,'#42504c');localLine(g,o,1,8,-8,16,1,'#27322f');return;
 }
 if(kind==='algae-film'||kind==='crustose'){
  const colors=kind==='crustose'?['#5a5156','#6f5d63','#836b6b','#9a8077']:['#3b563f','#506a49','#6c7951','#899064'];
  for(let i=0;i<24;i++){const n=noise(i,67,seed),u=-22+(n%45),v=-13+((n>>>9)%27),w=3+(n%8),h=1+((n>>>14)%3);localPixel(g,o,u,v,w,h,colors[i%colors.length])}return;
 }
 if(kind==='shell-fragment'){
  localPixel(g,o,-17,-4,31,8,'#6b7169');localPixel(g,o,-14,-7,26,4,'#aba78e');localPixel(g,o,-8,-10,16,3,'#cec5a2');localPixel(g,o,6,-7,6,4,'#817f6d');localPixel(g,o,-14,2,24,2,'#8e8b75');return;
 }
 if(kind==='holdfast'){
  const dark='#33432e',mid='#536240',hi='#74805a';localPixel(g,o,-7,-2,14,5,dark);
  for(let i=0;i<8;i++){const ang=(i/8)*Math.PI*2,len=10+(noise(i,79,seed)%12);localLine(g,o,0,0,Math.cos(ang)*len,Math.sin(ang)*len*.65,2,i%3===0?hi:mid)}return;
 }
 if(kind==='nodule'){
  const colors=['#111719','#202728','#323a38','#525a53'];
  for(let i=0;i<9;i++){const n=noise(i,83,seed),u=-20+(n%41),v=-11+((n>>>8)%23),r=3+(n%5);localPixel(g,o,u-r/2,v-r/2,r,r,colors[i%3]);localPixel(g,o,u,v-1,Math.max(1,r-2),1,colors[3])}return;
 }
 if(kind==='sponge'){
  const dark='#676e69',mid='#969a8d',hi='#c2c0ab';localPixel(g,o,-8,2,17,4,dark);
  for(let i=0;i<5;i++){const n=noise(i,97,seed),u=-8+i*4,h=12+((n>>>7)%19),w=3+(n%3);localPixel(g,o,u,-h,w,h+2,mid);localPixel(g,o,u+1,-h-2,Math.max(1,w-2),3,hi);if(i%2===0)localPixel(g,o,u,-Math.floor(h*.55),1,2,dark)}return;
 }
 if(kind==='sunken-wood'){
  localPixel(g,o,-30,-6,58,12,'#252a26');localPixel(g,o,-27,-8,52,4,'#3b3c32');
  for(let i=0;i<7;i++){const u=-23+i*8;localPixel(g,o,u,-7,4,2,i%2?'#4b4939':'#34362e')}
  localLine(g,o,-18,5,-8,12,2,'#1b211f');localLine(g,o,12,5,22,11,2,'#1b211f');
 }
}
export function drawSceneDetail(g,options={}){
 return withSoftWorldShadow(g,shadowFor(options.kind),()=>drawShape(g,options));
}
