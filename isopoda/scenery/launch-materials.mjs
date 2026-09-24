// Launch-only art. Shares the woodland's world-space cells and material clusters;
// existing habitats and shared woodland/marine assets do not pass through here.
import {paint,contains,rounded,nearLine,materialInk} from './grammar.mjs';
import {px} from './pixel.mjs';
export const LAUNCH_BACKGROUNDS=new Set(['groundwater','estuary','sandy-surf','petri-dish']);
export const LAUNCH_DETAILS=new Set(['limestone-shelf','flowstone','seep-film','cave-silt','estuary-silt','mud-burrows','wrack-line','sand-ripple','foam-trace','dish-sediment','glass-scratch','dish-bubbles','dish-floc','tidal-runnel']);
const n=(x,y,s)=>{let h=Math.imul((x+s)|0,374761393)^Math.imul(y|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0};
const shore=(x,s)=>197+Math.sin((x+s)*.013)*17+Math.sin(x*.039+s)*5;
const channel=(y,s)=>{const t=y/430;return {c:164+54*t+Math.sin(y*.023+s)*24+Math.sin(y*.009)*11,r:10+15*t+78*t*t}};
function ground(g,w,h,seed,shade){
 for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){const c=shade(x,y,n(x>>2,y>>2,seed));px(g,x,y,2,2,materialInk(c,x,y,seed,'soil'))}
}
export function drawLaunchBackground(g,{kind,seed=57}={}){
 const w=g.canvas?.width||384,h=g.canvas?.height||430;
 if(kind==='groundwater'){
  ground(g,w,h,seed,(x,y,q)=>{
   const edge=Math.min(x,w-x)+Math.sin(y*.035)*15;
   const beds=Math.sin(x*.021+y*.012+seed)+Math.sin(y*.057-x*.009);
   if(edge<28+beds*12)return beds>.45?'#454c43':'#333d36';
   const wet=Math.abs(x-(190+Math.sin(y*.019)*35));
   if(wet<48+Math.sin(y*.031)*18)return q%9===0?'#2b403b':'#1c302e';
   return beds>.7?'#343b32':beds<-.65?'#1c2723':'#28322c';
  });
  // Fine mineral seams are broken, irregular, and subordinate to movable rock shelves.
  for(let i=0;i<48;i++){const q=n(i,7,seed),x=q%w,y=(q>>>10)%h;if(x>95&&x<285)continue;for(let j=0;j<12+q%19;j++)if(n(j,i,seed)%5)px(g,x+j,y+Math.floor(Math.sin(j*.18+i)*2),1,1,i%3?'#535849':'#777866')}
  return;
 }
 if(kind==='estuary'){
  ground(g,w,h,seed,(x,y,q)=>{
   const {c,r}=channel(y,seed),d=Math.abs(x-c)-r;
   const bank=Math.sin(x*.068+y*.027)*3+Math.sin(y*.11)*2;
   if(d<bank)return d< -9?(q%13===0?'#38514a':'#29413c'):'#424f40';
   if(d<9+bank)return '#69634b';
   const mud=Math.sin(x*.024+y*.013)+Math.sin(y*.047-x*.017);
   return mud>.8?'#625e45':mud<-.75?'#414838':'#51523e';
  });
  // Hairline drainage fans disappear into the wet bank; no disconnected tributaries.
  for(const [yy,side,len] of [[96,-1,81],[160,1,70],[264,-1,76],[326,1,40]]){
   const {c,r}=channel(yy,seed);for(let i=0;i<len;i++){
    const x=c+side*(r+i),y=yy-i*.34+Math.sin(i*.06)*4;
    px(g,x,y,2,i<30?3:1,'#374637');if(i%4===0)px(g,x,y-2,2,1,'#756b4f');
   }
  }
  return;
 }
 if(kind==='sandy-surf'){
  ground(g,w,h,seed,(x,y,q)=>{
   const sy=shore(x,seed),depth=y-sy;
   const ripple=Math.sin(y*.35+Math.sin(x*.02)*2+x*.009);
   if(depth< -18)return ripple>.88?'#b6a475':ripple<-.85?'#968762':'#a99970';
   if(depth<5)return '#918565';
   if(depth<70+Math.sin(x*.018)*9)return ripple>.91?'#999274':'#7e8067';
   return depth<95?'#5d786a':q%17===0?'#4a7165':'#3a615a';
  });
  for(let i=0;i<230;i++){const q=n(i,17,seed),x=q%w,y=(q>>>10)%h;if(y<shore(x,seed)+40)px(g,x,y,q%7===0?2:1,1,q%5===0?'#c8b98d':'#827859')}
  // A feathered, scalloped swash line; lower contrast than the editable foam.
  for(let x=0;x<w;x++){const y=shore(x,seed)+79+Math.sin(x*.053)*5;if(n(x,9,seed)%5)px(g,x,y,1,1,'#9eae91');if(x%7===0)px(g,x,y+3,2,1,'#728f7b')}
  return;
 }
 if(kind==='petri-dish'){
  ground(g,w,h,seed,(x,y,q)=>q%37===0?'#303a31':'#252f29');
  const cx=w/2,cy=h/2,r=Math.min(w*.44,170);
  // Glass has separate lower thickness, inner meniscus and directional reflections.
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy),shadow=Math.hypot(dx-4,dy-7);
   if(d>r){if(shadow<r+2)px(g,x,y,1,1,'#141e1a');continue}
   const light=(dx+dy*.75)/r,q=n(x>>2,y>>2,seed);
   let c;
   if(d>r-2)c=light<-.3?'#a6ad93':'#606f5f';
   else if(d>r-5)c=light<-.5?'#d1ccb0':light>.6?'#7d8d78':'#a4b19a';
   else if(d>r-8)c='#576f60';
   else if(d>r-10)c=light<0?'#a5b59b':'#8c9d85';
   else if(d>r-14)c='#425e52';
   else if(d>r-18)c='#627b68';
   else {const field=Math.sin(x*.024+y*.012)+Math.sin(y*.027);c=field>.9?'#7d8e77':field<-.9?'#758771':'#798b74';if(q%41===0)c='#82917b'}
   // Glass/liquid gets quieter clusters than porous soil or stone.
   if(d<r-18){const v=parseInt(c.slice(1),16),delta=(q%3-1)*2;c='#'+[v>>16&255,v>>8&255,v&255].map(k=>(k+delta).toString(16).padStart(2,'0')).join('')}
   px(g,x,y,1,1,c);
  }
  // Abraded glass arcs, never a full bright outline or synthetic calibration spokes.
  for(let i=0;i<155;i++){const a=3.58+i*.007,rr=r-4+(i%13===0?1:0);if(i%17<13)px(g,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,1,1,'#e1dcc0')}
  for(let i=0;i<58;i++){const a=.45+i*.01;px(g,cx+Math.cos(a)*(r-8),cy+Math.sin(a)*(r-8),1,1,'#b6c0a2')}
  // Small trapped bubbles sit in the meniscus, built from sparse square cells.
  for(let i=0;i<12;i++){const a=i*.51+seed,rr=r-19-n(i,41,seed)%5,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;px(g,x,y,2,1,'#b0b99d');px(g,x-1,y+1,1,2,'#96a78b');px(g,x+1,y+2,2,1,'#4e6a58')}
 }
}
function pebble(g,o,u,v,r,colors){
 const ca=Math.cos(o.a||0),sa=Math.sin(o.a||0),s=o.scale??1;
 paint(g,{x:o.x+(u*ca-v*sa)*s,y:o.y+(u*sa+v*ca)*s,a:o.a,scale:s,seed:o.seed,extent:r+2,shadow:false,texture:'stone',roughness:.16,
 inside:(x,y)=>x*x/(r*r)+y*y/(r*r*.48)<1,shade:(x,y)=>y< -r*.23?colors[2]:y>r*.24?colors[0]:colors[1]});
}
export function drawLaunchDetail(g,{kind,x=0,y=0,a=0,scale=1,seed=57}={}){
 const o={x,y,a,scale,seed};
 const dot=(u,v,w,h,c)=>{ // Rasterize in world coordinates even after rotation/scaling.
  paint(g,{...o,extent:Math.max(Math.abs(u)+w,Math.abs(v)+h)+2,shadow:false,edge:false,texture:false,inside:(xx,yy)=>xx>=u&&xx<u+w&&yy>=v&&yy<v+h,shade:()=>c});
 };
 const line=(ax,ay,bx,by,width,c)=>paint(g,{...o,extent:Math.max(Math.abs(ax),Math.abs(ay),Math.abs(bx),Math.abs(by))+width+2,shadow:false,edge:false,texture:false,inside:(u,v)=>nearLine(u,v,ax,ay,bx,by,width),shade:()=>c});
 if(kind==='limestone-shelf'){
  const outline=rounded([[-44,-9],[-35,-25],[-15,-29],[-3,-23],[13,-29],[37,-16],[43,0],[33,18],[12,23],[-8,17],[-31,22],[-46,7]].map(([u,v],i)=>[u+(n(i,13,seed)%7)-3,v+(n(i,15,seed)%7)-3]));
  paint(g,{...o,extent:51,texture:'stone',shadow:false,roughness:.24,inside:(u,v)=>contains(outline,u+Math.sin(v*.32+seed)*1.4,v+Math.sin(u*.29+seed)*1.2),shade:(u,v)=>{
   const layer=v+Math.sin(u*.09+seed)*3+Math.sin(u*.24)*1.4;
   if(nearLine(u,v,-19,-24,-9,4,1)||nearLine(u,v,-9,4,16,17,.8))return '#444c40';
   if(layer>13)return '#535c4e';
   if(layer< -15)return '#a6a58a';
   if(Math.sin(layer*.72+seed)>.72)return '#72765f';
   if(n(Math.floor(u/4),Math.floor(v/3),seed)%29===0)return '#5c6654';
   return layer< -3?'#90947a':'#7e856c';
  }});
  for(let i=0;i<5;i++){const q=n(i,21,seed);pebble(g,o,-39+q%77,24+(q>>>9)%8,2+q%3,['#4c5648','#737a62','#999a7d'])}
  return;
 }
 if(kind==='flowstone'){
  // Top-down overlapping calcite lobes, with sinuous growth terraces and wet hollows.
  const outline=rounded([[-27,8],[-23,-12],[-10,-23],[3,-25],[18,-15],[28,3],[20,15],[5,21],[-13,17]]);
  paint(g,{...o,extent:34,shadow:false,texture:'stone',inside:(u,v)=>contains(outline,u+Math.sin(v*.4)*1.1,v),shade:(u,v)=>{
   const rr=Math.hypot(u*.87,v+12)+Math.sin(u*.21+seed)*2,band=rr%7;
   if(band<1.6)return '#b2ae8e';if(band>5.4)return '#616e5a';
   return u+v>13?'#7b846b':'#949b7f';
  }});return;
 }
 if(kind==='seep-film'||kind==='tidal-runnel'){
  paint(g,{...o,extent:38,shadow:false,texture:'soil',roughness:.4,inside:(u,v)=>Math.abs(u)<35&&Math.abs(v-Math.sin(u*.1+seed)*3)<(3.4+Math.sin(u*.2))*Math.sqrt(1-u*u/1225),shade:(u,v)=>v< -1?'#5c7867':'#2d4b42'});
  for(let i=0;i<6;i++){const u=-27+i*10;line(u,Math.sin(u*.1+seed)*3-2,u+3,Math.sin(u*.1+seed)*3-2,.5,'#94a28a')}return;
 }
 if(['cave-silt','estuary-silt','dish-sediment'].includes(kind)){
  const ramp=kind==='cave-silt'?['#344035','#606851','#898c70']:kind==='estuary-silt'?['#434936','#71694a','#958560']:['#4e6450','#8f9571','#b6b292'];
  for(let i=0;i<24;i++){const q=n(i,53,seed),u=-24+q%49,v=-14+(q>>>9)%29;if((u/25)**2+(v/15)**2>1)continue;pebble(g,o,u,v,i%6===0?2.6:1.2+(q%3)*.25,ramp)}
  return;
 }
 if(kind==='mud-burrows'){
  for(let i=0;i<6;i++){const q=n(i,61,seed),u=-22+q%45,v=-12+(q>>>9)%25,r=3+q%3;pebble(g,o,u,v,r+2,['#55573e','#726b4c','#8f805a']);pebble(g,o,u,v-1,r*.52,['#343e2f','#2b372d','#49503a']);for(let j=0;j<3;j++)pebble(g,o,u+r+j*2,v+2+j%2,1,['#54543a','#776c4b','#93805b'])}return;
 }
 if(kind==='wrack-line'){
  for(let i=0;i<12;i++){
   const q=n(i,71,seed),u=-33+q%67,v=-8+(q>>>8)%17,len=6+(q>>>16)%18,sign=q%2?1:-1;
   const points=rounded([[u,v],[u+len*.3,v-3],[u+len,v+sign*4],[u+len*.5,v+3],[u+3,v+2]]);
   paint(g,{...o,extent:62,shadow:false,texture:'wood',inside:(xx,yy)=>contains(points,xx,yy),shade:(xx,yy)=>yy<v?'#8b7950':'#5a593a'});
   line(u,v,u+len,v+sign*2,.55,'#a08d5f');
   if(i%3===0){line(u,v,u-6,v-5,.7,'#514832');line(u-3,v-2,u-8,v,.5,'#78633f')}
  }return;
 }
 if(kind==='sand-ripple'){
  for(let j=-3;j<=3;j++){
   paint(g,{...o,extent:41,shadow:false,edge:false,texture:'soil',inside:(u,v)=>Math.abs(u)<35-Math.abs(j)*3&&Math.abs(v-j*5-Math.sin(u*.058+seed+j*.4)*2)<1.2&&n(Math.floor(u/7),j,seed)%7!==0,shade:(u,v)=>v<j*5+Math.sin(u*.058+seed+j*.4)*2?'#c1ac7b':'#918363'});
  }return;
 }
 if(kind==='foam-trace'){
  for(let i=0;i<24;i++){const q=n(i,83,seed),u=-39+i*3.3,v=Math.sin(u*.06+seed)*4+(q%3);if(q%5===0)continue;line(u,v,u+2+q%4,v-.5,.6,'#c2c4a3');if(i%4===0){dot(u+1,v+3,2,1,'#9bad90');dot(u+3,v+1,1,2,'#d2cfad')}}return;
 }
 if(kind==='dish-bubbles'){
  for(let i=0;i<5;i++){
   const q=n(i,97,seed),u=-13+q%27,v=-9+(q>>>8)%19,r=i===0?5:1.5+q%3;
   paint(g,{...o,extent:24,shadow:false,edge:false,texture:false,inside:(xx,yy)=>{const d=Math.hypot(xx-u,yy-v);return d<r&&d>r-1.2},shade:(xx,yy)=>xx-u+yy-v<0?'#c5c9a8':'#4b6959'});
   dot(u-r*.45,v-r*.5,1,1,'#d6d4b4');
  }return;
 }
 if(kind==='dish-floc'){
  for(let i=0;i<13;i++){
   const q=n(i,101,seed),u=-17+q%35,v=-10+(q>>>8)%21;
   if((u/18)**2+(v/11)**2>1)continue;
   pebble(g,o,u,v,2+q%3,['#637756','#8f9a70','#b5b68a']);
   if(i%3===0)line(u,v,u+4,v-4,.5,'#bfc095');
  }return;
 }
 if(kind==='glass-scratch'){
  line(-24,-5,18,5,.5,'#91a18a');line(-16,-3,5,2,.5,'#a1ad94');line(7,9,15,-9,.5,'#6b816b');
 }
}
