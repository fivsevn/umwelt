import {PIXEL_STYLE} from './native-style.mjs';
// Orthonormal charts copied from the approved folded-face method. Neither old
// UV proportions nor triangle-specific affine artwork can change a texel.
export function surfaceFrame(T,points,{vessel=false,weapon=false,botanical=false}={}){
 const [a,b,c]=points, n=b.clone().sub(a).cross(c.clone().sub(a)).normalize();
  const u=(Math.abs(n.y)>.98?new T.Vector3(1,0,0).addScaledVector(n,-n.x):new T.Vector3(0,1,0).cross(n)).normalize();
 const v=n.clone().cross(u).normalize();
 const facet=Math.floor((Math.atan2(n.z,n.x)+Math.PI+.00001)/(Math.PI/4));
 const phase=[vessel?3+2*((facet%8+8)%8):16,botanical||vessel?1:16];
 return {n,u,v,phase,points:points.map(p=>[p.dot(u),p.dot(v)])};
}
export function nativeCell(frame,point){
 return [point.dot(frame.u),point.dot(frame.v)].map((p,i)=>{
  const q=Math.floor(p*PIXEL_STYLE.texelsPerUnit+frame.phase[i]);return (q%32+32)%32;
 });
}
