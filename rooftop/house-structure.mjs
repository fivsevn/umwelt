// Saved arrangements stay in terrace-local coordinates. Both terraces belong
// to one continuous residential block; both terraces are rendered in public views.
export const HOUSE = Object.freeze({
  id: "dongdong-home",
  roof: { x: -82, z: 4, width: 148, depth: 24, eave: 5.6, ridge: 13.2 },
  base: -28.15,
  row: { homes: [[0, 1], [-20, -1], [52, 1], [32, -1], [-52, 1], [-72, -1]], gapCentres: [-36, 16], gapWidth: 12 },
  terraces: {
    north: { rotation: 0, origin: [0, 0] },
    south: { rotation: -Math.PI / 2, origin: [0, 32] },
  },
});
export function housePoint(scene, x, z) {
  return scene === "south" ? [-z, HOUSE.terraces.south.origin[1] + x] : [x, z];
}
export function terracePoint(scene, x, z) {
  return scene === "south" ? [z - HOUSE.terraces.south.origin[1], -x] : [x, z];
}

// Ray/solid intersections follow the intact sixth floor and its recessed entry.
// A ray can cross the open north door lane without crossing an invented wall.
export function houseOccludes(from, to) {
  const r=HOUSE.roof, x0=r.x, x1=r.x+r.width, z0=r.z, z1=r.z+r.depth;
  const hit=(planes)=>{
    let enter=0,exit=1;
    for(const plane of planes){
      const a=plane(from),b=plane(to),d=b-a;
      if(Math.abs(d)<1e-10){if(a>0)return false;continue;}
      const t=-a/d;if(d>0)exit=Math.min(exit,t);else enter=Math.max(enter,t);
      if(enter>exit)return false;
    }
    return exit>1e-6&&enter<1-1e-6&&exit-enter>1e-6;
  };
  const box=(xa,xb,za,zb,ya,yb)=>hit([
    p=>xa-p[0],p=>p[0]-xb,p=>za-p[2],p=>p[2]-zb,p=>ya-p[1],p=>p[1]-yb,
  ]);
  if(box(x0,x1,z0,z1,HOUSE.base,-.4))return true;
  if(box(x0,x1,z0+8,z1,-.4,r.eave))return true;
  for(const [cx,mirror] of HOUSE.row.homes){
    const a=mirror===1?cx-10:cx-6,b=mirror===1?cx+6:cx+10;
    if(box(a,b,z0,z0+8,-.4,r.eave))return true;
  }
  for(const cx of HOUSE.row.gapCentres){
    if(box(cx-6,cx+6,z0-4.4,z0+8,-.4,r.eave))return true;
    if(box(cx-6,cx+6,z1,z1+4,-.4,r.eave))return true;
  }
  const half=r.depth/2+.6, slope=(r.ridge-r.eave)/half;
  return hit([
    p=>x0-1-p[0],p=>p[0]-x1-1,p=>z0-.6-p[2],p=>p[2]-z1-.6,
    p=>r.eave-p[1],p=>p[1]-r.eave-slope*(p[2]-z0+.6),
    p=>p[1]-r.eave-slope*(z1+.6-p[2]),
  ]);
}
