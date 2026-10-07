export function washstationSpec(w,d,h,type) {
  return {top:h*.94,bx:type==='sink'?w*.19:0,bw:type==='sink'?w*.48:w*.72,bd:d*.68,depth:Math.min(.45,h*.53)};
}

// A continuous counter with a real opening, a closed bowl and visible plumbing.
// All outlines and surface pixels are constructed here; no image/model assets.
export function roundedRectangle(w, d, radius, cx = 0, cz = 0) {
  const r = Math.min(radius, w / 2, d / 2), points = [];
  for (const [x, z, start] of [
    [w / 2 - r, d / 2 - r, 0],
    [-w / 2 + r, d / 2 - r, Math.PI / 2],
    [-w / 2 + r, -d / 2 + r, Math.PI],
    [w / 2 - r, -d / 2 + r, Math.PI * 1.5],
  ]) for (let j = 0; j <= 3; j++) {
    const a = start + j * Math.PI / 6;
    points.push([cx + x + Math.cos(a) * r, cz + z + Math.sin(a) * r]);
  }
  return points;
}

export function recessedBowlGeometry(T, w, d, depth, cx = 0, oval=false) {
  const rings = [
    [w, d, 0], [w - .09, d - .09, -.08],
    [w * .78, d * .74, -depth],
    [w * .78, d * .74, -depth - .055],
    [w + .025, d + .025, -.05], [w, d, 0],
  ];
  const positions = [], uvs = [], indices = [], n = 16;
  rings.forEach(([ww, dd, y], k) => {
    const pts = oval ? Array.from({length:16},(_,j)=>[cx+Math.cos(j*Math.PI/8)*ww/2,Math.sin(j*Math.PI/8)*dd/2]) : roundedRectangle(ww, dd, Math.min(.18, dd * .16), cx);
    pts.forEach(([x, z], j) => {
      positions.push(x, y, z);
      uvs.push(j / n, k / (rings.length - 1));
    });
  });
  for (let k = 0; k < rings.length - 1; k++)
    for (let j = 0; j < n; j++) {
      const a = k * n + j, b = k * n + (j + 1) % n, c = a + n, e = b + n;
      indices.push(a, c, b, b, c, e);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  const flat = geo.toNonIndexed(); geo.dispose(); flat.computeVertexNormals();
  return flat;
}

export function buildWashstation(api, g, w, d, h, type) {
  const { T, box, cyl, beam, group, mat, P } = api;
  const steel = type === "sink", {top,bx,bw,bd,depth}=washstationSpec(w,d,h,type),
    paint = steel ? "#bac7cd" : "#e3e5dc",
    inner = steel ? "#829ca7" : "#4388a8";
  const shape = new T.Shape();
  shape.setFromPoints(roundedRectangle(w, d, .09).map(([x, z]) => new T.Vector2(x, z)));
  const hole = new T.Path();
  hole.setFromPoints((steel ? roundedRectangle(bw, bd, .18, bx) : Array.from({length:16},(_,j)=>[bx+Math.cos(j*Math.PI/8)*bw/2,Math.sin(j*Math.PI/8)*bd/2])).reverse()
    .map(([x, z]) => new T.Vector2(x, z)));
  shape.holes.push(hole);
  const deckGeo = new T.ExtrudeGeometry(shape, { depth: .075, bevelEnabled: false, curveSegments: 1 });
  deckGeo.rotateX(-Math.PI / 2);
  const deck = new T.Mesh(deckGeo, mat(paint, steel ? "metal" : "enamel"));
  deck.position.y = top; deck.castShadow = deck.receiveShadow = true; g.add(deck);
  const bowl = new T.Mesh(recessedBowlGeometry(T, bw, bd, depth, bx,!steel), mat(inner, steel ? "metal" : "enamel"));
  bowl.position.y = top; bowl.castShadow = bowl.receiveShadow = true; g.add(bowl);
  // Floor sits inside the sloping shell, with a drain at its lowest point.
  if(steel)box(g, bx, top - depth - .012, 0, bw * .78, .065, bd * .74, inner,"metal");
  else {const floor=group(g,bx,top-depth-.012,0);floor.scale.z=bd*.74/(bw*.78);cyl(floor,0,0,0,bw*.39,bw*.39,.065,inner,16,"enamel");}
  cyl(g, bx, top - depth + .031, 0, .10, .10, .018, "#b2b9b1", 12, "metal");
  cyl(g, bx, top - depth + .043, 0, .06, .06, .008, P.metalDark, 8);
  for (const x of [-.035, .035])
    box(g, bx + x, top - depth + .05, 0, .017, .008, .10, "#c7c9b9");
  // Four folded apron strips close the underside of the worktop.
  for (const z of [-d * .48, d * .48])
    box(g, 0, top - .13, z, w, .25, .065, steel ? "#7b8d8f" : P.blue, "metal");
  for (const x of [-w * .48, w * .48])
    box(g, x, top - .13, 0, .065, .25, d, steel ? "#7b8d8f" : P.blue, "metal");
  for (const x of [-w * .43, w * .43]) {
    for (const z of [-d * .41, d * .41]) {
      box(g, x, top / 2 - .05, z, .085, top - .1, .085, P.metal, "metal");
      box(g, x, .045, z, .14, .09, .14, P.metalDark);
      box(g, x, top - .15, z, .025, .028, .095, P.metalLight);
    }
    box(g, x, top * .25, 0, .055, .055, d * .83, P.metalDark, "metal");
  }
  box(g, 0, top * .25, -d * .4, w * .85, .055, .055, P.metal, "metal");
  if (steel) {
    // Pressed drainboard flutes stop before the bowl and slope into it.
    const left = -w * .45, right = bx - bw / 2 - .09;
    for (let j = 0; j < 7; j++)
      box(g, (left + right) / 2, top + .088, -bd * .41 + j * bd * .136,
        right - left, .024, .035, "#cad0c4", "metal");
  } else {
    box(g, 0, top - .265, d * .515, w * .84, .035, .025, "#3f636e");
    for (const x of [-w * .43, w * .43])
      box(g, x, top - .17, d * .518, .03, .06, .024, P.metalLight);
  }
  // Raised splashback, mounting flange and a faceted goose-neck tap.
  box(g, 0, top + .16, -d * .48, w, .23, .065, paint, "metal");
  const tz = -bd / 2 - .09, tap = group(g, bx, top + .075, tz);
  cyl(tap, 0, .018, 0, .13, .13, .035, "#b8c1b5", 12, "metal");
  const path = [[0, .04, 0], [0, .37, 0], [0, .50, .07], [0, .54, .17], [0, .50, .27], [0, .37, .29]];
  for (let j = 1; j < path.length; j++) beam(tap, path[j - 1], path[j], .072, "#afbcb7");
  cyl(tap, 0, .357, .29, .057, .057, .07, P.metalDark, 8);
  beam(tap, [-.20, .16, 0], [.20, .16, 0], .045, "#c6cfc0");
  cyl(tap, 0, .17, 0, .095, .095, .07, "#93a6a3", 8);
  for (const x of [-.20, .20]) box(tap, x, .16, 0, .055, .08, .055, "#b7c1b6");
  // Waste tube and trap are connected to the bowl, never floating below it.
  const py = top - depth - .06;
  const waste = [[bx, py, 0], [bx, Math.max(.13, py - .20), 0],
    [bx, .12, -.17], [bx, .12, -.34], [bx, .35, -.43], [bx, .35, -d * .46]];
  for (let j = 1; j < waste.length; j++) beam(g, waste[j - 1], waste[j], .07, "#b6bab0");
  for (const y of [py, py - .12]) cyl(g, bx, y, 0, .064, .064, .04, P.metalLight, 8);
  g.userData.washstation = { opening: [bx, bw, bd], top, bottom: top - depth, continuousDeck: true };
}
