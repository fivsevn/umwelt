// Small, deterministic contact masks from neighbouring solid parts of each model.
// No screen-space filter: the baked six-face values stay attached when furniture moves.
export function cubeContactPaint(T, parts, cube) {
 const bounds=parts.filter(p=>p.geo===cube && !/leaf|cactus|petal|soil/.test(p.m.userData.kind)).map(p=>({p,b:new T.Box3(new T.Vector3(-.5,-.5,-.5),new T.Vector3(.5,.5,.5)).applyMatrix4(p.matrix)}));
 const result=new Map();
 if(bounds.length>600)return result;
 for(const {p}of bounds) {
  const positive=[0,0,0],negative=[0,0,0],scale=new T.Vector3().setFromMatrixScale(p.matrix),reach=Math.max(.055,Math.min(.20,Math.max(scale.x,scale.y,scale.z)*.13));
  for(let axis=0;axis<3;axis++)for(const sign of[-1,1]) {
   const tangent=[0,1,2].filter(i=>i!==axis);let blocked=0;
   for(const u of[-.38,.38])for(const v of[-.38,.38]) {
    const point=[0,0,0];point[axis]=sign*.5;point[tangent[0]]=u;point[tangent[1]]=v;
    const origin=new T.Vector3(...point).applyMatrix4(p.matrix),normal=new T.Vector3().setComponent(axis,sign).transformDirection(p.matrix);
    let amount=0;
    for(const distance of[.025,reach]) {
     const probe=origin.clone().addScaledVector(normal,distance);
     if(bounds.some(q=>q.p!==p && q.b.containsPoint(probe)))amount=Math.max(amount,distance===.025?1:.45);
    }
    blocked+=amount;
   }
   (sign>0?positive:negative)[axis]=Math.round(blocked/4*4)/4;
  }
  result.set(p,{positive,negative});
 }
 return result;
}
