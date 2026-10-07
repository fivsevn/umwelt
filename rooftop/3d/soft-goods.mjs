import { roundedRectangle } from './washstation.mjs';
export function soilBagGeometry(T) {
 const rings=[[.67,.54,0],[.84,.76,.045],[.98,.96,.26],[1,1,.50],[.91,.88,.74],[.77,.38,.90],[.69,.055,.99]],n=16;
 const vertices=rings.map(([w,d,y],k)=>roundedRectangle(w,d,Math.min(.13,d*.25)).map(([x,z],j)=>[x,y+(k>0&&k<6?(j%3-1)*.012:0),z]));
 const positions=[],uv=[],indices=[];
 for(let k=0;k<vertices.length;k++)for(let j=0;j<n;j++){const[x,y,z]=vertices[k][j];positions.push(x,y,z);uv.push(.06+(x+.5)*.88,.08+y*.86)}
 for(let k=0;k<rings.length-1;k++)for(let j=0;j<n;j++){const a=k*n+j,b=k*n+(j+1)%n;indices.push(a,a+n,b,b,a+n,b+n)}
 for(const [k,flip]of[[0,false],[rings.length-1,true]])for(let j=1;j<n-1;j++){const a=k*n,b=a+j,c=b+1;indices.push(...(flip?[a,c,b]:[a,b,c]))}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);
 const flat=geo.toNonIndexed();geo.dispose();flat.computeVertexNormals();return flat;
}
export function buildSoilBag(api,g,w,d,h) {
 api.surface(g,soilBagGeometry(api.T),0,0,0,w,h,d,'#b4bb9c','bag');
 // Narrow heat-sealed mouth and folded bottom gussets follow the bag, without
 // a rigid lid, rectangular side boards or a floating printed sign.
 api.beam(g,[-w*.34,h*.992,-d*.018],[w*.34,h*.992,d*.018],.027,'#d1ccb0');
 for(const x of[-w*.35,w*.35])api.beam(g,[x,h*.06,-d*.18],[x*.93,h*.14,-d*.30],.014,'#929e81');
}
