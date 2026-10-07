import { buildFoliage } from './plant-models.mjs';
import { modelRandom } from './model-random.mjs';

// Measure the same seeded construction as the renderer, without Three.js or a
// canvas. Living tips may overhang horizontally; their height still clears a shelf.
const cache = new Map();
export function foliageHeight(plant, object, radius, potTop) {
  const key = [plant.id, object.seed || 1835, radius, potTop].join(':');
  if (cache.has(key)) return cache.get(key);
  const parts = [];
  const group = (parent, x = 0, y = 0, z = 0) => ({parent, x, y, z, rotation:{x:0,y:0,z:0}});
  const root = group(null);
  const bounds = (node, x, y, z, w, h, d) => parts.push({node, x, y, z, w, h, d});
  const beam = (node, a, b, width) => bounds(node, ...a.map((v,i)=>(v+b[i])/2), ...a.map((v,i)=>Math.abs(v-b[i])+width));
  buildFoliage({
    group, box:bounds, beam, ellipsoid:(g,x,y,z,rx,ry,rz)=>bounds(g,x,y,z,rx*2,ry*2,rz*2),
    shade:c=>c, rng:modelRandom,
    blade:(g,a,b,w)=>beam(g,a,b,w*.6),
    cactusBody:(g,x,z,r,h)=>bounds(g,x,h/2,z,r*2+.2,h+.04,r*2+.2),
  }, root, plant, {...object,potRadius:radius,potTop, floorAt:()=>-potTop+.09});
  let top = 0;
  for (const p of parts) for (const sx of [-1,1]) for (const sy of [-1,1]) for (const sz of [-1,1]) {
    let v = [p.x+sx*p.w/2,p.y+sy*p.h/2,p.z+sz*p.d/2];
    for(let n=p.node;n;n=n.parent) {
      const {x,y,z}=n.rotation;
      const a=[v[0]*Math.cos(z)-v[1]*Math.sin(z),v[0]*Math.sin(z)+v[1]*Math.cos(z),v[2]];
      const b=[a[0]*Math.cos(y)+a[2]*Math.sin(y),a[1],-a[0]*Math.sin(y)+a[2]*Math.cos(y)];
      v=[b[0]+n.x,b[1]*Math.cos(x)-b[2]*Math.sin(x)+n.y,b[1]*Math.sin(x)+b[2]*Math.cos(x)+n.z];
    }
    top=Math.max(top,v[1]);
  }
  if(cache.size>1500)cache.clear();
  cache.set(key,top);return top;
}
