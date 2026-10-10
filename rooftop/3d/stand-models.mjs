import { supportSurfaces } from "./placement-profiles.mjs";
import { rackBars } from "./rack-grid.mjs";
export function buildStand(api, g, w, d, h, type) {
  const { box, beam, group, cyl, shade, P, mat, T } = api;
    const wooden =
        /woodshelf|ladderstand|foamstand|lowplatform|bench|stool|pottingbench/.test(
          type,
        ),
      c =
        type === "basketstand"
          ? "#c4c4ad"
          : wooden
            ? P.wood
            : /shelf|wirestand|coveredstand/.test(type)
              ? "#383c3d"
              : P.metal,
      ck = wooden ? "wood" : "metal",
      thick = wooden ? 0.14 : 0.075,
      boardThickness = type === "plantcart" ? 0.06 : 0.075;
    if (type === "woodshelf" || type === "ladderstand") {
      for (let level = 0; level < 3; level++) {
        const surface = supportSurfaces({ type })[level];
        const yy = surface.y - surface.thickness / 2,
          zz = surface.z,
          ww = surface.w;
        for (const xx of [-ww * 0.46, ww * 0.46])
          box(g, xx, yy / 2, zz, 0.125, yy, 0.125, P.woodDark, "wood");
        for (let slat = 0; slat < 3; slat++)
          box(
            g,
            0,
            yy,
            zz - surface.d / 3 + slat * surface.d / 3,
            ww,
            0.1,
            surface.d / 3,
            shade(P.wood, [1, 0.91, 1.08][slat]),
            "face-board",
          );
      }
      for (const xx of [-w * 0.46, w * 0.46])
        beam(
          g,
          [xx, 0.05, d * 0.47],
          [xx, h, -d * 0.45],
          0.1,
          P.woodDark,
          0.1,
          "wood",
        );
      return;
    }
    const levels = supportSurfaces({ type })
      .filter((s) => !s.container)
      .map((s) => s.y - (s.thickness || 0.11) / 2);
    for (const x of [-w * 0.45, w * 0.45])
      for (const z of [-d * 0.43, d * 0.43]) {
        box(
          g,
          x,
          h * 0.48,
          z,
          thick,
          h,
          thick,
          wooden ? P.woodDark : P.metalDark,
          ck,
        );
        box(g, x, 0.04, z, thick * 1.7, 0.08, thick * 1.7, P.metalDark);
      }
    for (const yy of levels) {
      if (wooden) {
        for (let i = 0; i < 4; i++)
          box(
            g,
            0,
            yy,
            -d * 0.42 + i * d * 0.28,
            w,
            0.11,
            d * 0.22,
            c,
            "face-board",
          );
      } else {
        box(g, 0, yy, -d * 0.46, w, boardThickness, 0.09, c, ck);
        box(g, 0, yy, d * 0.46, w, boardThickness, 0.09, c, ck);
        for (const x of [-w * 0.48, w * 0.48])
          box(g, x, yy, 0, 0.075, boardThickness, d, c, ck);
        const bars = rackBars(w, d);
        for (const x of bars.x)
          box(
            g,
            x,
            yy,
            0,
            bars.bar,
            boardThickness,
            d * 0.88,
            c,
            "metal",
          );
        for (const z of bars.z)
          box(
            g,
            0,
            yy,
            z,
            w * 0.9,
            boardThickness,
            bars.bar,
            c,
            "metal",
          );
      }
    }
    if (/shelf|tierstand|wirestand|coveredstand|plantcart/.test(type))
      beam(
        g,
        [-w * 0.45, 0.2, d * 0.43],
        [w * 0.45, h * 0.82, d * 0.43],
        0.052,
        P.metalDark,
      );
    if (type === "coveredstand") {
      const coverMaterial = mat("#bac6ae", "glass").clone();
      coverMaterial.onBeforeCompile=mat("#bac6ae", "glass").onBeforeCompile;
      coverMaterial.customProgramCacheKey=mat("#bac6ae", "glass").customProgramCacheKey;
      coverMaterial.transparent=true;coverMaterial.opacity=.14;coverMaterial.depthWrite=false;coverMaterial.side=T.DoubleSide;
      const cover = new T.Mesh(
        new T.BoxGeometry(w * 1.05, h + 0.23, d * 1.08),
        coverMaterial,
      );
      cover.position.y = h * 0.5 + 0.07;
      g.add(cover);
      for (const x of [-w * 0.5, w * 0.5])
        box(g, x, h + 0.15, 0, 0.07, 0.4, 0.07, P.metal);
    }
    if (type === "pottingbench") {
      box(g, 0, h * 0.8, d * 0.3, w * 0.9, h * 0.22, d * 0.32, P.wood, "wood");
      for (const x of [-w * 0.24, w * 0.24]) {
        box(
          g,
          x,
          h * 0.8,
          d * 0.48,
          w * 0.43,
          h * 0.17,
          0.07,
          P.woodLight,
          "wood",
        );
        box(g, x, h * 0.81, d * 0.53, 0.24, 0.04, 0.05, P.metalDark);
      }
      for (const x of [-w * 0.47, w * 0.47])
        box(g, x, h + 0.3, -d * 0.46, 0.12, 0.64, 0.12, P.woodDark, "wood");
      box(g, 0, h + 0.53, -d * 0.46, w, 0.25, 0.1, P.wood, "wood");
    }
    if (type === "plantcart") {
      for (const x of [-w * 0.42, w * 0.42])
        for (const z of [-d * 0.37, d * 0.37]) {
          const wheel = group(g, x, 0.02, z);
          wheel.rotation.z = Math.PI / 2;
          cyl(wheel, 0, 0, 0, 0.13, 0.13, 0.08, P.metalDark, 8);
        }
      beam(
        g,
        [w * 0.48, h * 0.9, -d * 0.4],
        [w * 0.48, h + 0.25, -d * 0.4],
        0.07,
        P.metal,
      );
      box(g, w * 0.48, h + 0.25, 0, 0.07, 0.07, d * 0.8, P.metal);
    }
  }
