// Closed, faceted surfaces carry painted pixels. No dense voxel shell is required.
export function latheSurface(T, points, sides = 12, shape = "round", ribs = 0) {
  const positions = [],
    indices = [],
    uvs = [];
  const radius = (r, a, k) =>
    r *
    (shape === "mokko"
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
      uvs.push(k / sides, j / (points.length - 1));
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

export function leafSurface(
  T,
  start,
  end,
  width,
  teeth = false,
  fleshy = false,
) {
  const v = new T.Vector3(...end).sub(new T.Vector3(...start)),
    length = v.length();
  const side = new T.Vector3(-v.z, 0, v.x);
  if (side.lengthSq() < 0.001) side.set(1, 0, 0);
  side.normalize();
  const normal = side.clone().cross(v).normalize();
  const positions = [],
    uvs = [],
    indices = [],
    n = 5;
  for (let j = 0; j <= n; j++) {
    const t = j / n,
      mid = new T.Vector3(...start).addScaledVector(v, t);
    mid.y += Math.sin(t * Math.PI) * length * 0.08;
    const w =
      Math.max(0.008, width * Math.sin(Math.PI * (0.04 + 0.96 * t)) * 0.5) *
      (teeth && j % 2 ? 0.83 : 1);
    const thickness = fleshy ? 0.045 + 0.045 * Math.sin(t * Math.PI) : 0.018;
    for (const [s, yy] of [
      [-1, thickness],
      [1, thickness],
      [-1, -thickness],
      [1, -thickness],
    ]) {
      const p = mid
        .clone()
        .addScaledVector(side, s * w)
        .addScaledVector(normal, yy);
      positions.push(p.x, p.y, p.z);
      uvs.push((s + 1) / 2, t);
    }
  }
  for (let j = 0; j < n; j++) {
    const a = j * 4,
      b = a + 4;
    indices.push(
      a,
      b,
      a + 1,
      a + 1,
      b,
      b + 1,
      a + 2,
      a + 3,
      b + 2,
      a + 3,
      b + 3,
      b + 2,
      a,
      a + 2,
      b,
      a + 2,
      b + 2,
      b,
      a + 1,
      b + 1,
      a + 3,
      a + 3,
      b + 1,
      b + 3,
    );
  }
  indices.push(
    0,
    1,
    2,
    1,
    3,
    2,
    n * 4,
    n * 4 + 2,
    n * 4 + 1,
    n * 4 + 1,
    n * 4 + 2,
    n * 4 + 3,
  );
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
