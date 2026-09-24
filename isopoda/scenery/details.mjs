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
 if(kind==='limestone-shelf'){
  const dark='#343b37',mid='#727568',hi='#aaa994',edge='#555c55';
  for(let yy=-18;yy<=18;yy+=2){
   const span=Math.max(5,Math.round((1-Math.abs(yy)/20)*34)+(noise(yy,301,seed)%7)-3);
   localPixel(g,o,-span,yy,span*2,2,yy<-8?hi:yy>10?dark:mid);
   if(yy%6===0)localPixel(g,o,-span+7+(noise(yy,303,seed)%Math.max(8,span)),yy,6+(noise(yy,307,seed)%11),1,edge);
  }
  localLine(g,o,-25,-8,-4,-14,1,'#c0bda4');localLine(g,o,3,-15,25,-7,1,'#969783');return;
 }
 if(kind==='flowstone'){
  const dark='#4f554f',mid='#7d7e70',hi='#b7b39a';
  localPixel(g,o,-22,4,44,6,dark);
  for(let i=0;i<7;i++){const u=-18+i*6,h=9+(noise(i,311,seed)%18);localPixel(g,o,u,-h,4,h+4,mid);localPixel(g,o,u+1,-h-2,2,4,hi);if(i%2===0)localPixel(g,o,u+3,-Math.floor(h*.55),2,2,dark)}
  localLine(g,o,-22,4,20,4,1,hi);return;
 }
 if(kind==='seep-film'){
  const dark='#233936',mid='#36534d',hi='#9aa894';
  localLine(g,o,-34,-5,-14,2,7,dark);localLine(g,o,-14,2,4,-3,9,dark);localLine(g,o,4,-3,31,5,6,dark);
  localLine(g,o,-33,-5,-14,2,3,mid);localLine(g,o,-14,2,4,-3,4,mid);localLine(g,o,4,-3,30,5,3,mid);
  for(let i=0;i<5;i++)localPixel(g,o,-25+i*13,-4+(i%2)*4,5,1,hi);return;
 }
 if(kind==='cave-silt'){
  const colors=['#343832','#4a4d42','#666654'];
  for(let i=0;i<22;i++){const n=noise(i,313,seed),u=-24+n%49,v=-11+((n>>>8)%23);localPixel(g,o,u,v,2+(n%5),1,colors[i%3])}return;
 }
 if(kind==='sand-ripple'){
  const dark='#7b7258',mid='#a99b72',hi='#d2bf89';
  for(let j=-3;j<=3;j++){
   const v=j*5;
   for(let u=-34;u<34;u+=7){
    if(noise(u,j+317,seed)%5===0)continue;
    const y=v+Math.round(Math.sin((u+seed)*.12+j)*1.5);
    localPixel(g,o,u,y,4+(noise(u,j,seed)%5),1,j%3===0?hi:(j%2?dark:mid));
   }
  }return;
 }
 if(kind==='foam-trace'){
  const foam='#ddd5ad',shadow='#9fa98b';
  for(let u=-38;u<38;u+=6){const n=noise(u,331,seed);if(n%4===0)continue;const v=Math.sin((u+seed)*.11)*3;localPixel(g,o,u,v,3+(n%6),1,foam);if(n%5===0)localPixel(g,o,u+2,v+3,2,1,shadow)}return;
 }
 if(kind==='dish-sediment'){
  const colors=['#394943','#667166','#a09e88','#c3bda1'];
  for(let i=0;i<18;i++){const n=noise(i,337,seed),u=-21+n%43,v=-13+((n>>>9)%27);localPixel(g,o,u,v,1+(n%3),1,colors[i%4]);if(i%6===0)localPixel(g,o,u+1,v+1,1,1,colors[3])}return;
 }
 if(kind==='glass-scratch'){
  const faint='rgba(220,222,202,.34)',dark='rgba(56,73,67,.35)';
  localLine(g,o,-31,-8,29,9,1,dark);localLine(g,o,-30,-9,12,3,1,faint);
  localLine(g,o,-8,18,7,-20,1,'rgba(213,216,198,.20)');return;
 }
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
 if(kind==='humus'||kind==='silt'||kind==='abyssal-silt'||kind==='estuary-silt'){
  const colors=kind==='humus'?['#29261f','#3a3327','#514634']:kind==='silt'?['#314039','#435046','#5a5d4b']:kind==='estuary-silt'?['#47483a','#5d5a44','#777057']:['#182326','#243033','#354043'];
  for(let i=0;i<26;i++){const n=noise(i,53,seed),u=-25+(n%51),v=-14+((n>>>8)%29),w=1+(n%5);localPixel(g,o,u,v,w,1,colors[i%colors.length]);if(i%7===0)localPixel(g,o,u+1,v-1,1,1,colors[2])}return;
 }
 if(kind==='tidal-runnel'){
  const dark='#263b38',mid='#36544e',edge='#77715a',glint='#8d9475';
  localLine(g,o,-48,-3,-24,4,11,dark);localLine(g,o,-24,4,2,-2,13,dark);localLine(g,o,2,-2,28,6,11,dark);localLine(g,o,28,6,48,1,9,dark);
  localLine(g,o,-47,-3,-24,4,5,mid);localLine(g,o,-24,4,2,-2,7,mid);localLine(g,o,2,-2,28,6,5,mid);localLine(g,o,28,6,47,1,4,mid);
  for(let i=0;i<8;i++){const u=-42+i*12,v=Math.sin(i*.9+seed)*5;localPixel(g,o,u,v-8,6,1,edge);if(i%2===0)localPixel(g,o,u+3,v-1,5,1,glint)}
  return;
 }
 if(kind==='mud-burrows'){
  const mud='#625f49',rim='#8b8061',hole='#293631';
  for(let i=0;i<9;i++){const n=noise(i,131,seed),u=-24+(n%49),v=-14+((n>>>8)%29),r=2+(n%3);localPixel(g,o,u-r,v-r,2*r+2,2*r+1,mud);localPixel(g,o,u-r+1,v-r,Math.max(2,2*r),1,rim);localPixel(g,o,u-1,v-1,3,3,hole);if(i%3===0)localPixel(g,o,u+r+2,v,2,1,rim)}
  return;
 }
 if(kind==='wrack-line'){
  const dark='#3a392b',mid='#5a5739',olive='#747047',pale='#8f8560';
  for(let i=0;i<11;i++){const n=noise(i,137,seed),u=-36+(n%73),v=-8+((n>>>9)%17),len=8+((n>>>15)%18),side=n&1?1:-1;localLine(g,o,u,v,u+side*len,v+((n>>>21)%9)-4,1,i%3===0?dark:mid);if(i%2===0)localPixel(g,o,u+side*Math.floor(len*.55),v-1,4,2,olive);if(i%4===0)localPixel(g,o,u-side*3,v+2,2,1,pale)}
  return;
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
