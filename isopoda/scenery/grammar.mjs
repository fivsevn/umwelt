// World-space cells: rotate the geometry, never the canvas or the pixel grid.
// Anatomy uses 1px structure; scenery groups those units into opaque 2px clusters.
export const SCENERY_CELL=2;
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
export function paint(ctx,{x=0,y=0,a=0,scale=1,extent=90,inside,shade,edge='#392c2a',shadow=true}){
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
  const border=edge&&[[2,0],[-2,0],[0,2],[0,-2]].some(([dx,dy])=>!inside(u+dx/scale,v+dy/scale));
  ctx.fillStyle=border?edge:shade(u,v);ctx.fillRect(ox+xx,oy+yy,cell,cell);
 }
}
