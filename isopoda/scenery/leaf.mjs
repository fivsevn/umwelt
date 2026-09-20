import {paint,contains,nearLine,rounded} from './grammar.mjs?v=forest-9';
import {hash32} from './pixel.mjs';
export const LEAF_PALETTES=[
 ['#51402b','#7b6038','#a08750','#b49a61','#3a3528'],
 ['#4c3529','#765036','#997247','#ae8653','#342e25'],
 ['#352f25','#58452f','#7b623e','#948054','#292c24'],
 ['#44402e','#686044','#8c8054','#a4996a','#303127']
];
export const LEAF_KINDS=['oak','willow','magnolia','maple','ginkgo','beech'];
const SHAPES=[
 [[-36,0],[-26,-7],[-25,-13],[-17,-13],[-20,-20],[-10,-23],[-6,-17],[0,-25],[8,-24],[10,-16],[21,-17],[22,-9],[34,-5],[39,0],[29,8],[20,9],[20,18],[10,19],[7,14],[-1,24],[-10,20],[-10,13],[-22,15],[-25,8]],
 [[-42,0],[-23,-6],[0,-10],[22,-7],[43,-2],[28,3],[9,8],[-13,7],[-30,4]],
 [[-37,0],[-27,-12],[-11,-21],[8,-23],[26,-15],[38,-3],[29,11],[10,20],[-11,18],[-29,9]],
 [[-30,0],[-22,-8],[-30,-20],[-14,-17],[-14,-32],[-1,-20],[13,-30],[11,-13],[36,-17],[24,-2],[40,4],[23,11],[21,26],[6,17],[-6,28],[-10,15],[-27,17],[-21,6]],
 [[-29,0],[-14,-11],[-7,-23],[4,-31],[17,-34],[26,-27],[31,-13],[20,-2],[33,3],[30,17],[21,29],[6,30],[-8,20],[-16,9]],
 [[-35,0],[-22,-12],[-5,-20],[13,-17],[32,-6],[37,0],[21,12],[4,18],[-15,12]]
];
export function drawLeaf(ctx,{x=0,y=0,a=0,variant=0,scale=.9,tone=0,gap=false,age=0,seed=0}={}){
 const kind=((variant%6)+6)%6,p=LEAF_PALETTES[((tone%4)+4)%4],shape=SHAPES[kind],roundedShape=rounded(shape),h=hash32(seed,'leaf');
 const damaged=gap||age>8||h%4===0,notch=(h%3-1)*9;
 const holes=gap||h%3===0;
 scale*=1.25;
 const inside=(u,v)=>contains(roundedShape,u+Math.sin(v*.43+seed)*.55,v+Math.sin(u*.38+seed)*.65)&&!(holes&&((u-10)/6)**2+((v+7)/4.5)**2<1)&&!(damaged&&((u-notch)/3.8)**2+((v-19)/9)**2<1)&&!(gap&&((u-11)/3)**2+((v+10)/4)**2<1);
 paint(ctx,{x,y,seed,a,scale,extent:48,inside,edge:p[0],shade:(u,v)=>{
  if(nearLine(u,v,-34,0,kind===4?20:32,kind===4?-2:0, .65))return p[1];
  for(const side of [-1,1])for(const start of [-23,-12,0,12,24]){
   if(nearLine(u,v,start,0,start+10,side*(kind===1?7:20),.48))return p[1];
   if(nearLine(u,v,start-2,-2,start+8,side*(kind===1?7:20)-2,.42))return p[3];
  }
  const patch=hash32(seed,Math.floor((u+v*.45+Math.sin(v*.5))/3),Math.floor(v/2));
  if(patch%9===0)return p[1];
  if(patch%13===0&&Math.abs(v)>5)return p[3];
  if(v>5+u*.12)return p[1];
  if(v< -5&&u<16)return p[2];
  return p[2];
 }});
 // The petiole is structural, not texture noise.
 paint(ctx,{x,y,seed,a,scale,extent:47,texture:false,inside:(u,v)=>u< -29&&u> -45&&Math.abs(v-(u+30)*.14)<1.5,shade:()=>p[0],edge:null,shadow:false});
}
