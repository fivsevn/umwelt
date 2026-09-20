import {paint,contains} from './grammar.mjs';
import {hash32} from './pixel.mjs';
const TUFT=[[-1,.4],[-.95,.05],[-.78,.05],[-.85,-.18],[-.62,-.22],[-.65,-.5],[-.4,-.48],[-.4,-.76],[-.18,-.7],[-.12,-.94],[.08,-.86],[.18,-.65],[.39,-.74],[.43,-.45],[.65,-.49],[.64,-.23],[.87,-.23],[.81,.04],[1,.15],[.9,.4],[.67,.42],[.7,.65],[.4,.61],[.26,.85],[.03,.73],[-.19,.83],[-.37,.63],[-.63,.72],[-.69,.47]];
export function drawMossPatch(ctx,{x=0,y=0,a=0,rx=62,ry=42,seed=0,wetness=.65,variant=0}={}){
 const p=wetness>.72?['#293e30','#3c5939','#557a47','#7c9c59']:['#30432d','#4a6539','#6e8b49','#9aac64'];
 const lobes=[[-.54,.12,.42],[-.26,-.35,.46],[.16,-.25,.52],[.57,.05,.38],[-.17,.35,.50],[.4,.4,.38]];
 const ca=Math.cos(a),sa=Math.sin(a);
 for(let i=0;i<lobes.length;i++){
  const [lx,ly,r]=lobes[i],h=hash32(seed,i),dx=lx*rx,dy=ly*ry;
  const sx=rx*r,sy=ry*r*(variant===2?.75:1),shift=(h%5-2)*.035;
  paint(ctx,{x:x+dx*ca-dy*sa,y:y+dx*sa+dy*ca,a,extent:Math.max(sx,sy)+4,edge:p[1],inside:(u,v)=>contains(TUFT,u/sx+shift,v/sy),shade:(u,v)=>{
   if(v>sy*.40||u>sx*.70)return p[0];
   if(v>sy*.15)return p[1];
   if(contains([[-.7,-.3],[-.3,-.7],[.1,-.6],[.25,-.15],[.6,-.1],[.3,.2],[-.25,.05],[-.45,.25]],u/sx,v/sy))return p[3];
   return p[2];
  }});
 }
}
