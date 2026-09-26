import {materialInk} from './grammar.mjs';
import {shorePoint,shoreTide,shoreRain,shoreVisible} from '../data/habitats/estuary-shore.mjs';
const px=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
const noise=(x,y,s=57)=>{let n=Math.imul(x+s,374761393)^Math.imul(y+1,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
// One low bank fills the frame. No opposite bank, horizon or river-map channel.
export const shoreHeight=tide=>[246,194,296,336][tide];
export function shoreLine(x,point=1,tide=0,level=shoreHeight(tide)){return level-x*.27+Math.sin((x+point*83)*.019)*13+(point===0?27:point===2?-25:0)}
export function drawShoreBackground(g,{point=1,tide=0,rain=false,seed=467,level=shoreHeight(tide)}={}){
 for(let y=0;y<430;y+=2)for(let x=0;x<384;x+=2){
  const edge=shoreLine(x,point,tide,level),distance=y-edge,q=noise(x>>1,y>>1,seed+point*53),broad=Math.sin(x*.025+y*.013)+Math.sin(y*.034-x*.009);
  const high=shoreLine(x,point,1),wet=y>high-12;
  let color=distance<0?(wet?(broad>.7?'#777159':'#686650'):(broad>.7?'#77765a':broad<-.9?'#4e5541':'#62664c')):distance<22?'#667566':distance<75?'#526e63':point===2?'#355b57':'#3d6057';
  if(distance>0&&rain)color=distance<65?'#687361':'#536a5b';
  if(distance<0&&q%27===0)color=wet?'#8b8365':'#858264';
  px(g,x,y,2,2,materialInk(color,x,y,seed,'soil'));
 }
 // Quiet sediment grain and old water marks remain fixed as the tide moves.
 for(let i=0;i<145;i++){
  const q=noise(i,39,seed+point*13),x=q%384,y=(q>>>10)%430;
  if(y<shoreLine(x,point,tide,level))px(g,x,y,1+q%3,1,i%4?'#66664e':'#aaa07a');
 }
 for(let x=5;x<380;x+=4){const y=shoreLine(x,point,1)-9;if(noise(x,3,point)%4)px(g,x,y,3,1,'#77775c')}
}
const obj=(id,type,x,y,scale,params={},angle=0,z=30)=>({id,type,x,y,scale,params,angle,flipX:false,z,seed:467+x});
export function shoreLayout(point=1,tide=0,rain=false){
 const plants=point===0?[[65,132,1.1],[126,108,.9],[190,93,.8]]:point===1?[[65,130,1],[125,102,.85]]:[[65,123,.75]];
 const wood=[[159,228],[177,222],[102,171]][point],stone=[[285,190],[285,175],[246,192]][point];
 const objects=[
  ...plants.map(([x,y,s],i)=>obj('shore-reed-'+i,'saltmarsh-tuft-02',x,y,s,{kind:'saltmarsh',height:72,flow:52},-.06,50)),
  obj('shore-wood','sunken-wood-01',...wood,point===2?1.05:1.5,{labDetail:'sunken-wood'},-.26),
  obj('shore-stone','stone-flat-01',...stone,1.22,{variant:1},.15),
  obj('shore-small-stone','stone-small-01',stone[0]+25,stone[1]+16,.6,{variant:3},.2),
  obj('shore-wrack','wrack-line-01',137,116,.75,{labDetail:'wrack-line'},-.22),
  obj('shore-shells','shell-grit-01',point===2?253:237,point===2?228:253,.55,{detail:'shellgrit',count:9}),
  obj('shore-holes','mud-burrows-01',point===2?161:104,point===2?174:242,.62,{labDetail:'mud-burrows'})
 ];
 return {version:1,canvas:{width:384,height:430},angleUnit:'radians',background:{type:'water-estuary',seed:467,params:{aquatic:true,kind:'estuary',shore:true,point,tide,rain}},objects,reference:{species:'hookeri',stage:'M',x:wood[0]+24,y:wood[1]+10,a:-.3,seed:189,visible:false},metadata:{habitat:'estuary',shore:true,point,tide},observationIndex:`shore-${point}-${tide}-${rain}`};
}
export const shoreLayoutFor=s=>shoreLayout(shorePoint(s),shoreTide(s),shoreRain(s));
// Slow, legible travel around the shelter; the leading animal never disappears for a tide.
export function stepShore(group,{state,time=0,reduced=false}){
 const point=shorePoint(state),tide=shoreTide(state),anchor=[[159,228],[177,222],[246,192]][point],t=time*(reduced?.65:1);
 for(const [i,a] of group.entries()){
  const phase=t*.23+i*2.8+point*.45,rx=i?19:32,ry=i?6:10;
  a.hidden=i>1||(i===1&&tide<2);
  a.x=anchor[0]+Math.cos(phase)*rx;a.y=anchor[1]+16+Math.sin(phase)*ry+(i?12:0);
  a.a=Math.atan2(Math.cos(phase)*ry,-Math.sin(phase)*rx);
  a.occlusion=0;a.lift=0;a.posture='normal';a.activity='crawl';a.moving=true;
  a.phase=(a.seed||i)*.1+t*3.2;a.habitatScale=1;
 }
}
function fish(g,x,y,dir=1,goby=false,t=0){
 const c=goby?'#899074':'#a2afa0',dark=goby?'#56634f':'#657e73',tail=Math.round(Math.sin(t*5)*1.5),fin=Math.round(Math.sin(t*4));
 px(g,x-5,y,11,2,dark);px(g,x-3,y-1,7,2,c);
 px(g,x-7*dir,y-1+tail,2,3,dark);px(g,x+4*dir,y,1,1,'#344b43');px(g,x-1,y+2+fin,3,1,dark);
}
// Available to deterministic motion checks as well as the live renderer.
export function shoreGoby(s,time=0){
 const point=shorePoint(s),phase=time*.5+point*.8,x=252+Math.sin(phase)*24;
 return {x,y:Math.max(shoreLine(x,point,shoreTide(s))+42,305)+Math.sin(time*.8)*2,dir:Math.cos(phase)<0?-1:1};
}
export function drawShoreWater(g,s,time=0,reduced=false){
 const point=shorePoint(s),tide=shoreTide(s),t=time*(reduced?.65:1),dir=tide<2?-1:1,level=s.shoreLevel??shoreHeight(tide);
 // Shallow translucent water covers the lower portions of the fixed wood and stones.
 for(let x=0;x<384;x+=2){const y=shoreLine(x,point,tide,level);px(g,x,y,2,Math.max(1,430-Math.round(y)),'rgba(54,91,80,.19)')}
 for(let i=0;i<22;i++){
  const x=(i*67+dir*t*3+384)%384,y=shoreLine(x,point,tide,level)+14+(i*37)%171;
  px(g,x,y,4+i%5,1,'rgba(173,190,164,.27)');
 }
 for(let x=0;x<384;x+=6){if(noise(x,11,point)%3===0)continue;const y=shoreLine(x,point,tide,level)+Math.sin(t*.65+x*.025)*1.5;px(g,x,y,4,1,'rgba(178,190,153,.40)')}
 // Long quiet gaps: one small school on incoming water; a resting goby on the ebb.
 const cycle=t%32;
 if(tide<2&&point>0&&cycle<7){
  const x=410-cycle*48;
  for(let i=0;i<2;i++)fish(g,x+i*25,338+i*12+Math.sin(t*.8+i)*2,-1,false,t+i);
 }
 const goby=shoreGoby(s,t);fish(g,goby.x,goby.y,goby.dir,true,t);
 // A few reed fragments drift with the current, always inside the shallow water.
 for(let i=0;i<3;i++){const x=(83+i*107+dir*t*2+384)%384,y=shoreLine(x,point,tide,level)+28+i*18;px(g,x,y,4,1,'#8b9472');px(g,x+2,y+1,2,1,'#546d56')}
 if(tide>=2){
  const x=point===2?161:104,y=point===2?174:242;
  px(g,x,y,5,2,'#414b3c');
  if(t%18<12){const d=Math.sin((t%18)/12*Math.PI)*12;px(g,x+d,y-3,6,3,'#98906b');for(let i=0;i<3;i++){px(g,x+d-2,y-4+i*2+Math.round(Math.sin(t*5+i)),2,1,'#727657');px(g,x+d+6,y-4+i*2+Math.round(Math.sin(t*5+i)),2,1,'#727657')}}
  if(tide===3)for(let i=0;i<15;i++)px(g,207+i*2,238+Math.round(Math.sin(i*.6+t*.6)*2),1,1,'#545d49');
 }
}
