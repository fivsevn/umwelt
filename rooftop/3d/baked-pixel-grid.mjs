// Derived GPU metadata only. The exported positions, normals and UV bytes stay
// intact. A rectangular atlas face is two affine, coplanar triangles.
export function bakedFaceBounds(data, atlasSize) {
  const vertices = data.length / 8, bounds = new Float32Array(vertices * 4);
  let faces = 0, unsupportedTriangles = 0;
  for (let start = 0; start < vertices; start += 6) {
    const count = Math.min(6, vertices - start), face = [];
    for (let i = 0; i < count; i++) face.push(Array.from(data.slice((start + i) * 8, (start + i + 1) * 8)));
    const us = [...new Set(face.map(v => v[6]))].sort((a, b) => a - b),
      vs = [...new Set(face.map(v => v[7]))].sort((a, b) => a - b),
      corners = new Map(face.map(v => [v[6] + ":" + v[7], v]));
    let valid = count === 6 && us.length === 2 && vs.length === 2 && corners.size === 4 &&
      (us[1] - us[0]) * atlasSize[0] >= 1 && (vs[1] - vs[0]) * atlasSize[1] >= 1 &&
      face.every(v => v.every(Number.isFinite) && v[6] >= 0 && v[6] <= 1 && v[7] >= 0 && v[7] <= 1 &&
        [3, 4, 5].every(k => Math.abs(v[k] - face[0][k]) < 1e-4));
    if (valid) {
      const a = corners.get(us[0] + ":" + vs[0]), b = corners.get(us[1] + ":" + vs[0]),
        c = corners.get(us[0] + ":" + vs[1]), d = corners.get(us[1] + ":" + vs[1]);
      valid = [0, 1, 2].every(k => Math.abs(a[k] + d[k] - b[k] - c[k]) < 1e-3) &&
        [face.slice(0, 3), face.slice(3)].every(triangle => new Set(triangle.map(v => v[6] + ":" + v[7])).size === 3) &&
        face.every(v => [0, 1, 2].every(k => Math.abs(v[k] - corners.get(v[6] + ":" + v[7])[k]) < 1e-4));
    }
    if (!valid) { unsupportedTriangles += count / 3; continue; }
    const rect = [us[0], vs[0], us[1], vs[1]];
    for (let i = 0; i < count; i++) bounds.set(rect, (start + i) * 4);
    faces++;
  }
  return { bounds, faces, unsupportedTriangles };
}

const normalize = v => { const length = Math.hypot(...v); return v.map(n => n / length); },
  cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  dot = (a, b) => a.reduce((sum, n, i) => sum + n * b[i], 0);

// CPU counterpart used to audit physical grid size under nonuniform exported
// game axes and instancing. The shader uses this same orthonormal face basis.
export function physicalSurfaceChart(position, normal, metres, density = 16, matrix = null) {
  let p = [...position], n = [...normal];
  if (matrix) {
    p = [0, 1, 2].map(i => matrix[i] * position[0] + matrix[4 + i] * position[1] + matrix[8 + i] * position[2] + matrix[12 + i]);
    const axes = [matrix.slice(0, 3), matrix.slice(4, 7), matrix.slice(8, 11)],
      cofactors = [cross(axes[1], axes[2]), cross(axes[2], axes[0]), cross(axes[0], axes[1])], determinant = dot(axes[0], cofactors[0]);
    n = [0, 1, 2].map(i => cofactors.reduce((sum, axis, j) => sum + axis[i] * normal[j], 0) / determinant);
  }
  p = p.map((value, i) => value * metres[i]);
  n = normalize(n.map((value, i) => value / metres[i]));
  const u = normalize(cross(Math.abs(n[1]) > .98 ? [0, 0, 1] : [0, 1, 0], n)), v = normalize(cross(n, u));
  return [dot(p, u) * density, dot(p, v) * density];
}

// Invert the screen derivatives, then map a physical pixel centre into the
// original atlas UV. Edge pixels are clipped to their own face, never a neighbour.
export function bakedPixelUv(chart, uv, dx, dy, uvDx, uvDy, bounds, atlasSize) {
  const determinant = dx[0] * dy[1] - dx[1] * dy[0],
    magnitude = Math.max(Math.hypot(...dx) * Math.hypot(...dy), 1e-20);
  if (bounds[2] <= bounds[0] || bounds[3] <= bounds[1] || Math.abs(determinant) <= magnitude * 1e-5)
    return { uv: [...uv], fallback: true };
  const delta = chart.map(value => Math.floor(value) + .5 - value),
    screen = [(dy[1] * delta[0] - dy[0] * delta[1]) / determinant, (dx[0] * delta[1] - dx[1] * delta[0]) / determinant],
    mapped = uv.map((value, i) => value + uvDx[i] * screen[0] + uvDy[i] * screen[1]),
    result = mapped.map((value, i) => Math.max(bounds[i] + .5 / atlasSize[i], Math.min(bounds[i + 2] - .5 / atlasSize[i], value)));
  return { uv: result, fallback: false };
}

export const BAKED_GRID_FRAGMENT = `
  vec2 shellBakedPixelUv(vec2 originalUv) {
    vec2 dx = dFdx(shellBakedChart), dy = dFdy(shellBakedChart);
    vec2 uvDx = dFdx(originalUv), uvDy = dFdy(originalUv);
    float determinant = dx.x * dy.y - dx.y * dy.x;
    float magnitude = max(length(dx) * length(dy), 1e-20);
    if (shellBakedBounds.z <= shellBakedBounds.x || shellBakedBounds.w <= shellBakedBounds.y ||
        abs(determinant) <= magnitude * 1e-5) return originalUv;
    vec2 delta = floor(shellBakedChart) + .5 - shellBakedChart;
    vec2 screen = vec2(dy.y * delta.x - dy.x * delta.y, dx.x * delta.y - dx.y * delta.x) / determinant;
    vec2 mapped = originalUv + uvDx * screen.x + uvDy * screen.y;
    vec2 halfTexel = .5 / shellBakedAtlas;
    return clamp(mapped, shellBakedBounds.xy + halfTexel, shellBakedBounds.zw - halfTexel);
  }
`;
