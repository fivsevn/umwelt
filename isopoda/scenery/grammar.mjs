// World-space cells: rotate the geometry, never the canvas or the pixel grid.
// Anatomy uses 1px structure; scenery retains 1px edges but builds readable 2px material color clusters.
import {hash32} from './pixel.mjs';

export const SCENERY_CELL=1;
export const SCENERY_CLUSTER=2.75;
export const ACTOR_SCALE=.88;
export function contains(points,x,y){
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [ax,ay]=points[i],[bx,by]=points[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside;
}
export function nearLine(x,y,ax,ay,bx,by,width=1.4){
 const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));
 return Math.hypot(x-ax-t*dx,y-ay-t*dy)<width;
}
function rgb(hex){
 const n=parseInt(hex.slice(1),16);return [n>>16&255,n>>8&255,n&255];
}
function hex([r,g,b]){return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');}
export function softEdge(fill,shadow='#302f29',amount=.42){
 const a=rgb(fill),b=rgb(shadow);return hex(a.map((v,i)=>v*(1-amount)+b[i]*amount));
}
// Three discrete near-colors per ink. Staggered 2px clusters supply visible
// material texture even within a single shade; sparse 1px accents break the grid.
// No blur, alpha blend, gradient, or per-frame random noise is used.
const textureRamps=new Map();
export function materialInk(fill,x,y,seed=0,material='grain'){
 if(material===false)return fill;
 const amount=material==='soil'?7:material==='stone'?10:material==='wood'?14:12;
 const key=fill+':'+amount;
 let ramp=textureRamps.get(key);
 if(!ramp){const base=rgb(fill);ramp=[hex(base.map((v,i)=>v-amount*[1,.88,.65][i])),fill,hex(base.map((v,i)=>v+amount*[1,.92,.68][i]))];textureRamps.set(key,ramp)}
 const row=(y/SCENERY_CLUSTER)|0,col=((x+(row&1))/SCENERY_CLUSTER)|0;
 // Small integer hash: this runs once for every scenery cell, so avoid the
 // general-purpose string hash and modulo-heavy path used by authored shapes.
 let h=Math.imul((col+seed)|0,374761393)^Math.imul(row,668265263);
 h=Math.imul(h^(h>>>13),1274126177);h=(h^(h>>>16))>>>0;
 const step=(col+row+(h%3)+seed)%3;
 const accent=(((x|0)+(y|0)*3+seed)&15)===0;
 return ramp[accent?2:(step+3)%3];
}
export function paint(ctx,{x=0,y=0,a=0,scale=1,extent=90,inside,shade,edge=(u,v,fill)=>softEdge(fill),shadow=true,roughness=.14,seed=0,texture='grain'}){
 ctx.imageSmoothingEnabled=false;
 const c=Math.cos(a),s=Math.sin(a),r=Math.ceil((extent*scale+6)/2)*2,cell=SCENERY_CELL;
 const sample=(xx,yy)=>[(xx*c+yy*s)/scale,(-xx*s+yy*c)/scale];
 const ox=Math.round(x/cell)*cell,oy=Math.round(y/cell)*cell;
 if(shadow){
  ctx.fillStyle='#252e24';
  for(let yy=-r;yy<=r;yy+=cell)for(let xx=-r;xx<=r;xx+=cell){
   const [u,v]=sample(xx,yy);if(inside(u,v))ctx.fillRect(ox+xx,oy+yy+4,cell,cell);
  }
 }
 for(let yy=-r;yy<=r;yy+=cell)for(let xx=-r;xx<=r;xx+=cell){
  const [u,v]=sample(xx,yy);if(!inside(u,v))continue;
  const border=edge&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!inside(u+dx/scale,v+dy/scale));
  // Natural pixel edges are slightly porous. Break a few outline cells so
  // silhouettes do not read like a vector sticker with a complete keyline.
  const broken=border&&roughness>0&&(hash32('rough-edge',Math.round(u/2),Math.round(v/2),Math.round(a*32))%100)<roughness*100;
  if(broken)continue;
  const fill=materialInk(shade(Math.floor(u/SCENERY_CLUSTER)*SCENERY_CLUSTER,Math.floor(v/SCENERY_CLUSTER)*SCENERY_CLUSTER),xx,yy,seed,texture),rim=typeof edge==='function'?edge(u,v,fill):edge;
  ctx.fillStyle=border?rim:fill;ctx.fillRect(ox+xx,oy+yy,cell,cell);
 }
}

// Two corner-cutting passes soften authored contours without canvas antialiasing.
export function rounded(points){
 for(let pass=0;pass<2;pass++)points=points.flatMap((p,i)=>{
  const q=points[(i+1)%points.length];
  return [[p[0]*.8+q[0]*.2,p[1]*.8+q[1]*.2],[p[0]*.2+q[0]*.8,p[1]*.2+q[1]*.8]];
 });
 return points;
}
