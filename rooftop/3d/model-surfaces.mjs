// Closed, faceted surfaces carry painted pixels. No dense voxel shell is required.
export function latheSurface(T, points, sides = 12, shape = "round", ribs = 0) {
  const positions = [],
    indices = [],
    uvs = [];
  const low = Math.min(...points.map(p=>p[1])), high = Math.max(...points.map(p=>p[1]));
  const radius = (r, a, k) =>
    r *
    (shape === "square"
      ? 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))) * .82
      : shape === "fluted"
        ? 1 + .025 * (k % 2 ? -1 : 1)
        : shape === "mokko"
      ? 1 + 0.12 * Math.cos(a * 4)
      : shape === "scallop"
        ? 1 + 0.055 * Math.cos(a * 10)
        : shape === "irregular"
          ? 1 + 0.06 * Math.sin(a * 3 + 1.4)
          : ribs
            ? 0.76 + 0.24 * (k % 2 === 0 ? 1 : 0)
            : 1);
  for (let j = 0; j < points.length; j++)
    for (let k = 0; k <= sides; k++) {
      const a = (k / sides) * Math.PI * 2,
        rr = radius(points[j][0], a, k);
      positions.push(
        Math.cos(a) * rr,
        points[j][1],
        Math.sin(a) * rr * (shape === "oval" ? 0.76 : 1),
      );
      // Exterior wall uses the full painted height; the closed inner wall must
      // not consume the majority of the exterior's texture coordinates.
      uvs.push(k / sides, points[j][2] ?? ((points[j][1]-low) / Math.max(.001,high-low)));
    }
  for (let j = 0; j < points.length - 1; j++)
    for (let k = 0; k < sides; k++) {
      const a = j * (sides + 1) + k,
        b = a + sides + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  const flat = g.toNonIndexed();
  g.dispose();
  flat.computeVertexNormals();
  return flat;
}

export function leafSurface(T, start, end, width, teeth = false, fleshy = false) {
  const v = new T.Vector3(...end).sub(new T.Vector3(...start)), length = v.length();
  const side = new T.Vector3(-v.z, 0, v.x);
  if (side.lengthSq() < .001) side.set(1, 0, 0);
  side.normalize();
  const normal = side.clone().cross(v).normalize();
  const split = teeth === 'split';
  const positions = [], uvs = [], indices = [], n = split ? 14 : fleshy ? 6 : 8, stride = 6;
  for (let j = 0; j <= n; j++) {
    const t = j / n, bend = Math.sin(t*Math.PI),
      mid = new T.Vector3(...start).addScaledVector(v,t);
    mid.y += bend * length * (fleshy ? .11 : .035);
    const silhouette = split ? [.14,.48,.76,.30,.95,.34,1,.32,.93,.35,.79,.30,.56,.32,.04][j]
      : fleshy ? Math.sin(Math.PI*(.025+.975*t)) : [.08,.48,.75,.96,1,.88,.64,.32,.04][j];
    const w = Math.max(.008, width * silhouette*.5)
      * (teeth && !split && j%2 ? .85 : 1);
    const edge = fleshy ? .022 + .016*bend : .0035,
      ridge = fleshy ? .045 + .075*bend : .005 + .008*bend;
    for (const [x,y] of [[-1,edge],[0,ridge],[1,edge],[-1,-edge],[0,-ridge*.55],[1,-edge]]) {
      const p = mid.clone().addScaledVector(side,x*w).addScaledVector(normal,y);
      positions.push(p.x,p.y,p.z); uvs.push((x+1)/2,t);
    }
  }
  for(let j=0;j<n;j++) {
    const a=j*stride,b=a+stride;
    for(let k=0;k<2;k++) {
      indices.push(a+k,b+k,a+k+1,a+k+1,b+k,b+k+1);
      indices.push(a+k+3,a+k+4,b+k+3,a+k+4,b+k+4,b+k+3);
    }
    indices.push(a,a+3,b,a+3,b+3,b, a+2,b+2,a+5,a+5,b+2,b+5);
  }
  for(const [base,flip] of [[0,false],[n*stride,true]]) {
    for(const tri of [[0,1,3],[1,4,3],[1,2,4],[2,5,4]]) {
      const t=flip?[tri[0],tri[2],tri[1]]:tri;
      indices.push(...t.map(k=>base+k));
    }
  }
  const g=new T.BufferGeometry();
  // The cross-leaf basis points toward -X; reverse winding so upper faces
  // receive the sun and the closed underside faces away from it.
  for (let j=0;j<indices.length;j+=3) [indices[j+1],indices[j+2]]=[indices[j+2],indices[j+1]];
  g.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  g.setAttribute("uv",new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);
  const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();return flat;
}

// A narrow three-dimensional bevel catches the light on mouldings and boards.
export function beveledBoxSurface(T) {
 const shape=new T.Shape();shape.moveTo(-.482,-.482);shape.lineTo(.482,-.482);shape.lineTo(.482,.482);shape.lineTo(-.482,.482);shape.closePath();
 const geo=new T.ExtrudeGeometry(shape,{depth:.964,steps:1,curveSegments:1,bevelEnabled:true,bevelSegments:1,bevelSize:.018,bevelThickness:.018});geo.translate(0,0,-.482);geo.computeVertexNormals();return geo;
}
