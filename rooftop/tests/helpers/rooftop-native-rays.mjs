import { readFileSync } from "node:fs";
import { BACKGROUND } from "../../assets/background/empty-rooftop.mjs";

// Tests intersect the actual exported, opaque triangles. No camera-specific
// proxy, transparency, or vertical clipping is introduced into the scene.
export function nativeArchitectureRays(T, { layers = ["near", "ground"], envelope, excludeFloor = false } = {}) {
  const bytes = readFileSync(new URL("../../assets/background/empty-rooftop.bin", import.meta.url)),
    buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    triangles = [], cache = new Map(), p = new T.Vector3();
  const sourceGeometry = (offset, count) => {
    const key = offset + ":" + count;
    if (cache.has(key)) return cache.get(key);
    const source = new Float32Array(buffer, offset, count * 8), positions = new Float32Array(count * 3), geometry = new T.BufferGeometry();
    for (let i = 0; i < count; i++) for (let axis = 0; axis < 3; axis++) positions[i * 3 + axis] = source[i * 8 + axis];
    geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
    geometry.computeBoundingBox(); cache.set(key, geometry);
    return geometry;
  };
  const append = (geometry, matrix, field, layer) => {
    if (envelope && !geometry.boundingBox.clone().applyMatrix4(matrix).intersectsBox(envelope)) return;
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i += 3) {
      const points = [0, 1, 2].map(j => p.fromBufferAttribute(positions, i + j).applyMatrix4(matrix).clone()),
        box = new T.Box3().setFromPoints(points);
      triangles.push({ points, box, centre: box.getCenter(new T.Vector3()), field, layer });
    }
  };
  const matrix = new T.Matrix4(), world = new T.Matrix4(), local = new T.Matrix4(), combined = new T.Matrix4();
  for (const part of BACKGROUND.parts) {
    if (!layers.includes(part.layer) || excludeFloor && part.field.endsWith("-floor")) continue;
    if (part.mode === "instances") {
      const geometry = sourceGeometry(BACKGROUND.cube.offset, BACKGROUND.cube.vertices), count = part.directCount ?? part.count,
        direct = new Float32Array(buffer, part.offset, count * 16);
      for (let i = 0; i < count; i++) append(geometry, matrix.fromArray(direct, i * 16), part.field, part.layer);
      for (const assembly of part.assemblies || []) {
        const parents = new Float32Array(buffer, assembly.worldOffset, assembly.worldCount * 16), sources = new Float32Array(buffer, assembly.sourceOffset, assembly.sourceCount * 16);
        for (let i = 0; i < assembly.worldCount; i++) {
          world.fromArray(parents, i * 16);
          for (let j = 0; j < assembly.sourceCount; j++) append(geometry, combined.multiplyMatrices(world, local.fromArray(sources, j * 16)), part.field, part.layer);
        }
      }
    } else {
      const geometry = sourceGeometry(part.offset, part.vertices);
      if (part.mode === "meshInstances") {
        const instances = new Float32Array(buffer, part.matricesOffset, part.count * 16);
        for (let i = 0; i < part.count; i++) append(geometry, matrix.fromArray(instances, i * 16), part.field, part.layer);
      } else append(geometry, matrix.identity(), part.field, part.layer);
    }
  }
  const build = (items) => {
    const box = new T.Box3(); for (const item of items) box.union(item.box);
    if (items.length <= 24) return { box, items };
    const size = box.getSize(new T.Vector3()), axis = size.x >= size.y && size.x >= size.z ? "x" : size.y >= size.z ? "y" : "z";
    items.sort((a, b) => a.centre[axis] - b.centre[axis]);
    const middle = items.length >> 1;
    return { box, left: build(items.slice(0, middle)), right: build(items.slice(middle)) };
  };
  const root = build(triangles), boxHit = new T.Vector3(), hitPoint = new T.Vector3();
  return {
    triangles: triangles.length,
    bounds: root.box,
    hit(ray, far = 6000) {
      let nearest = null, distance = far;
      const visit = node => {
        if (!ray.intersectBox(node.box, boxHit) || boxHit.distanceTo(ray.origin) > distance && !node.box.containsPoint(ray.origin)) return;
        if (node.items) {
          for (const triangle of node.items) {
            if (!ray.intersectTriangle(...triangle.points, false, hitPoint)) continue;
            const candidate = hitPoint.distanceTo(ray.origin);
            if (candidate < .005 || candidate >= distance) continue;
            distance = candidate; nearest = { point: hitPoint.clone(), distance, field: triangle.field, layer: triangle.layer };
          }
        } else { visit(node.left); visit(node.right); }
      };
      visit(root); return nearest;
    },
  };
}
