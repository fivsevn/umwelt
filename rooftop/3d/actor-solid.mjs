// Closed authored polygons, triangulated in their own face plane. Newell's
// normal also handles concave lapels whose first three corners are collinear.
export function actorSolidGeometry(T, vertices, faces) {
  const positions=[],uv=[];
  for(const face of faces){
    const points=face.map(i=>new T.Vector3(...vertices[i])),normal=new T.Vector3();
    for(let i=0;i<points.length;i++)normal.add(new T.Vector3().crossVectors(points[i],points[(i+1)%points.length]));
    const axis=['x','y','z'].sort((a,b)=>Math.abs(normal[b])-Math.abs(normal[a]))[0],axes=['x','y','z'].filter(a=>a!==axis);
    const triangles=T.ShapeUtils.triangulateShape(points.map(p=>new T.Vector2(p[axes[0]],p[axes[1]])),[]);
    for(const triangle of triangles){
      let [a,b,c]=triangle.map(i=>points[i]);
      if(new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(c,a)).dot(normal)<0)[b,c]=[c,b];
      for(const p of [a,b,c]){positions.push(...p.toArray());uv.push(p[axes[0]],p[axes[1]]);}
    }
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();return geometry;
}
