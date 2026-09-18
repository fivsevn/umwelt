export const WORLD_W=384;
export const WORLD_H=430;
export function px(ctx,x,y,w=1,h=1,color='#000'){
 ctx.fillStyle=color;
 ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));
}
export function rot(x,y,a){
 const c=Math.cos(a),s=Math.sin(a);
 return [x*c-y*s,x*s+y*c];
}
export function hash32(...parts){
 let h=2166136261>>>0;
 for(const part of parts){
  const text=String(part);
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
 }
 return h>>>0;
}
