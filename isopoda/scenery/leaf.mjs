import {paint,contains,nearLine} from './grammar.mjs';
import {hash32} from './pixel.mjs';
export const LEAF_PALETTES=[
 ['#61402c','#a36b36','#cd9347','#e3b765','#49302a'],
 ['#59352c','#975033','#bd7546','#d8995a','#422c29'],
 ['#422e29','#704532','#996443','#b58757','#352827'],
 ['#51443a','#827052','#a7956d','#c0ad7f','#39332e']
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
 const kind=((variant%6)+6)%6,p=LEAF_PALETTES[((tone%4)+4)%4],shape=SHAPES[kind],h=hash32(seed,'leaf');
 const damaged=gap||age>8||h%4===0,notch=(h%3-1)*9;
 const inside=(u,v)=>contains(shape,u,v)&&!(damaged&&u>notch&&u<notch+7&&v>8)&&!(gap&&u>8&&u<14&&v< -6&&v> -13);
 paint(ctx,{x,y,a,scale,extent:48,inside,edge:p[4],shade:(u,v)=>{
  if(nearLine(u,v,-34,0,kind===4?20:32,kind===4?-2:0,1.5))return p[0];
  for(const side of [-1,1])for(const start of [-15,0,14])if(nearLine(u,v,start,0,start+13,side*(kind===1?6:17),1.1))return p[1];
  if(v>5+u*.12)return p[1];
  if(v< -5&&u<16)return p[3];
  return p[2];
 }});
 // The petiole is structural, not texture noise.
 paint(ctx,{x,y,a,scale,extent:47,inside:(u,v)=>u< -29&&u> -45&&Math.abs(v-(u+30)*.14)<1.5,shade:()=>p[0],edge:null,shadow:false});
}
