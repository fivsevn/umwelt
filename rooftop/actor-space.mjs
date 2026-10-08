import {
  createPlacementContext,
  placementKind,
  contactOffset,
} from "./3d/spatial-layout.mjs";
// Walking uses the same physical solids and support heights as object placement.
// A raised shelf is not a flat sprite rectangle; a low board still blocks a head.
export function createActorSpace(objects) {
  const context = createPlacementContext(objects, null),
    solids = [];
  for (const o of objects) {
    const base = context.relations.get(o.id)?.height || 0,
      size = context.footprints.get(o.id),
      parts = context.parts.get(o.id);
    const angle = ((o.rotation || 0) * Math.PI) / 180,
      c = Math.cos(angle),
      s = Math.sin(angle);
    const add = (part) =>
      solids.push({
        x: o.x / 16 + (part.x || 0) * c - (part.z || 0) * s,
        z:
          (o.y + contactOffset(o)) / 16 + (part.x || 0) * s + (part.z || 0) * c,
        c,
        s,
        w: part.w,
        d: part.d,
        low: base + part.y - part.h / 2,
        high: base + part.y + part.h / 2,
      });
    parts.forEach(add);
    if (
      !placementKind(o.type).bearing ||
      context.surfaces.get(o.id).some((surface) => surface.container)
    )
      add({
        x: 0,
        z: 0,
        y: size.h / 2,
        w: size.mouthW || size.w,
        d: size.mouthD || size.d,
        h: size.h,
      });
  }
  return {
    fits(x, y, { radius = 0.48, height = 2.42 } = {}) {
      return !solids.some((part) => {
        if (part.high <= 0.025 || part.low >= height) return false;
        const dx = x / 16 - part.x,
          dz = y / 16 - part.z,
          lx = dx * part.c + dz * part.s,
          lz = -dx * part.s + dz * part.c;
        const nx = Math.max(0, Math.abs(lx) - part.w / 2),
          nz = Math.max(0, Math.abs(lz) - part.d / 2);
        return nx * nx + nz * nz < radius * radius;
      });
    },
  };
}
