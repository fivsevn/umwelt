import { modelRandom } from "./model-random.mjs";

// A shallow, asymmetric mound; the rim stays at the same measured fill level.
// Seed variants are shared meshes, so moving a planter never rebuilds its soil.
export function soilHeight(x, z, variant = 0) {
  const random = modelRandom(variant ^ 0x2d759),
    a = random() * 6.28,
    cx = (random() - 0.5) * 0.7,
    cz = (random() - 0.5) * 0.7;
  const r = Math.min(1, Math.hypot(x, z)),
    dome = Math.max(0, 1 - r * r);
  return (
    dome *
    (0.62 +
      0.16 * Math.sin(x * 2.8 + a) +
      0.13 * Math.cos(z * 3.1 - a) +
      0.24 * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / 0.27) -
      0.12 * Math.exp(-((x + cx + 0.22) ** 2 + (z - cz - 0.25) ** 2) / 0.12))
  );
}

const outline = (shape, a) =>
  shape === "rect"
    ? 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)))
    : shape === "rounded-square"
      ? 0.95 / (Math.abs(Math.cos(a)) ** 4 + Math.abs(Math.sin(a)) ** 4) ** 0.25
      : shape === "square"
        ? 0.82 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)))
        : shape === "mokko"
          ? 1 + 0.12 * Math.cos(a * 4)
          : shape === "scallop"
            ? 1 + 0.055 * Math.cos(a * 10)
            : shape === "irregular"
              ? 1 + 0.06 * Math.sin(a * 3 + 1.4)
              : 1;
export function soilPointHeight(shape, x, z, variant = 0) {
  const a = Math.atan2(z, x),
    r = Math.hypot(x, z) / outline(shape, a);
  return soilHeight(Math.cos(a) * r, Math.sin(a) * r, variant);
}

export function soilSurface(T, shape = "round", sides = 24, variant = 0) {
  const rectangular = shape === "rect",
    n = rectangular ? 8 : Math.max(8, Math.min(20, Math.ceil(sides / 4) * 4)),
    rings = 2;
  const positions = [0, soilHeight(0, 0, variant), 0],
    uvs = [0.5, 0.5],
    indices = [];
  for (let j = 1; j <= rings; j++)
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2,
        r = j / rings,
        rr = r * outline(shape, a),
        x = Math.cos(a) * rr,
        z = Math.sin(a) * rr;
      positions.push(
        x,
        soilHeight(Math.cos(a) * r, Math.sin(a) * r, variant),
        z,
      );
      uvs.push(x * 0.42 + 0.5, z * 0.42 + 0.5);
    }
  for (let k = 0; k < n; k++) indices.push(0, 1 + ((k + 1) % n), 1 + k);
  for (let j = 1; j < rings; j++)
    for (let k = 0; k < n; k++) {
      const a = 1 + (j - 1) * n + k,
        b = 1 + j * n + k,
        c = 1 + (j - 1) * n + ((k + 1) % n),
        d = 1 + j * n + ((k + 1) % n);
      indices.push(a, c, b, c, d, b);
    }
  const outer = 1 + (rings - 1) * n,
    bottom = positions.length / 3;
  for (let k = 0; k < n; k++) {
    positions.push(
      positions[(outer + k) * 3],
      -0.45,
      positions[(outer + k) * 3 + 2],
    );
    uvs.push(uvs[(outer + k) * 2], uvs[(outer + k) * 2 + 1]);
  }
  const centre = positions.length / 3;
  positions.push(0, -0.45, 0);
  uvs.push(0.5, 0.5);
  for (let k = 0; k < n; k++) {
    const next = (k + 1) % n;
    indices.push(
      outer + k,
      bottom + next,
      bottom + k,
      outer + k,
      outer + next,
      bottom + next,
    );
    indices.push(centre, bottom + k, bottom + next);
  }
  const indexed = new T.BufferGeometry();
  indexed.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  indexed.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  indexed.setIndex(indices);
  const geometry = indexed.toNonIndexed();
  indexed.dispose();
  geometry.computeVertexNormals();
  return geometry;
}
