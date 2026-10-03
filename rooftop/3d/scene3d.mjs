import { SCENES, paintBase, asset, ASSETS } from "../scene.mjs";
import { PLANTS, POTS } from "../botany.mjs";
import { plantContact } from "../plant-art.mjs";
import { buildFoliage } from "./plant-models.mjs";
import { buildVessel } from "./vessel-models.mjs";
import { buildObject, OBJECT_DIMENSIONS } from "./object-models.mjs";
import { OUTFITS, DECORATIONS, wardrobe } from "../wardrobe.mjs";

// This renderer consumes the same initial layout and botanical palette as the 2D game.
// Only the canvas changes; the observer's cards, clock, weather and residents are shared.
export function createGardenRenderer(canvas, layout, doorButton, options = {}) {
  const controls = options.controls || "orbit";
  const editable = controls === "edit";
  const T = window.THREE;
  if (!T) throw new Error("Three.js 未能加载");
  const D = {
    plants: PLANTS,
    pots: POTS,
    layout: {
      north: layout.scenes.north.map(withContact),
      south: layout.scenes.south.map(withContact),
      room: (layout.scenes.room || []).map(withContact),
    },
  };
  function withContact(o) {
    return PLANTS.some((p) => p.id === o.type)
      ? { ...o, contactY: (plantContact(o).bottom - 1) * o.scale }
      : o;
  }
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: "default",
  });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.type = T.BasicShadowMap;
  renderer.setClearColor("#bdc2c5");
  const scene = new T.Scene(),
    camera = new T.OrthographicCamera(-20, 20, 20, -20, 0.1, 500);
  scene.fog = new T.Fog("#bdc2c5", 48, 130);
  const hemi = new T.HemisphereLight("#f3f2e9", "#a0aaa4", 2.0);
  scene.add(hemi);
  const sun = new T.DirectionalLight("#fff8e7", 1.45);
  sun.position.set(-22, 38, -14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -32,
    right: 32,
    top: 32,
    bottom: -32,
    near: 1,
    far: 100,
  });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  scene.add(sun.target);
  const P = {
    metal: "#59675b",
    metalLight: "#8f9a87",
    metalDark: "#424d44",
    wood: "#8d7a5f",
    woodLight: "#a59478",
    woodDark: "#70614f",
    white: "#c5c6ae",
    blue: "#577f82",
    blueDark: "#3d606b",
    soil: "#5f5140",
    tile: "#a29f8c",
    wall: "#bdb59e",
    cap: "#d0c7ae",
  };
  const materialCache = new Map(),
    texCache = new Map(),
    windTime = { value: 0 },
    windPower = { value: 0 };
  let primitives = [],
    batches = [],
    groups = {},
    doors = {},
    actors = {},
    foliage = [],
    waterAnimations = [];
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function shade(c, v) {
    const n = new T.Color(c);
    n.multiplyScalar(v);
    return "#" + n.getHexString();
  }
  function pixelTexture(kind, color) {
    const key = kind + color;
    if (texCache.has(key)) return texCache.get(key);
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const ctx = c.getContext("2d"),
      r = rng(1356 + kind.length);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = shade(color, 0.85 + r() * 0.29);
      const x = Math.floor(r() * 32),
        y = Math.floor(r() * 32);
      ctx.fillRect(
        x,
        y,
        kind === "wood" ? 3 + Math.floor(r() * 7) : 1 + (r() > 0.7 ? 1 : 0),
        1,
      );
    }
    if (kind === "wood") {
      ctx.fillStyle = shade(color, 0.7);
      ctx.fillRect(9, 17, 4, 1);
      ctx.fillRect(11, 18, 2, 1);
    }
    const tex = new T.CanvasTexture(c);
    tex.magFilter = tex.minFilter = T.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = T.SRGBColorSpace;
    texCache.set(key, tex);
    return tex;
  }
  function mat(c, kind = "plain") {
    const key = c + kind;
    if (!materialCache.has(key)) {
      const m = new T.MeshLambertMaterial({
        color: kind === "plain" || kind === "leaf" ? c : "#ffffff",
        map: kind === "plain" || kind === "leaf" ? null : pixelTexture(kind, c),
      });
      m.userData.kind = kind;
      m.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <dithering_fragment>",
          "float grain = mod(gl_FragCoord.x + mod(gl_FragCoord.y, 2.0), 2.0) * .35; gl_FragColor.rgb = floor(gl_FragColor.rgb * 24.0 + grain) / 24.0;",
        );
        if (kind === "leaf") {
          shader.uniforms.leafTime = windTime;
          shader.uniforms.leafWind = windPower;
          shader.vertexShader =
            "uniform float leafTime; uniform float leafWind;\n" +
            shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x += sin(leafTime * 1.8 + instanceMatrix[3].x * 1.5 + instanceMatrix[3].z) * leafWind * .18 * max(0.0, instanceMatrix[3].y - .3);\n#endif",
          );
        }
      };
      materialCache.set(key, m);
    }
    return materialCache.get(key);
  }
  function isFoliage(g) {
    for (let p = g; p; p = p.parent) if (p.userData.foliage) return true;
    return false;
  }
  const cube = new T.BoxGeometry(1, 1, 1),
    cylinderCache = new Map();
  function group(parent, x = 0, y = 0, z = 0) {
    const g = new T.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  }
  function box(g, x, y, z, w, h, d, c, kind = "plain", rx = 0, ry = 0, rz = 0) {
    if (w <= 0 || h <= 0 || d <= 0) return;
    primitives.push({
      g,
      x,
      y,
      z,
      w,
      h,
      d,
      color: c,
      m: mat(c, isFoliage(g) ? "leaf" : kind),
      geo: cube,
      rx,
      ry,
      rz,
    });
  }
  function cyl(g, x, y, z, rt, rb, h, c, n = 12, kind = "plain") {
    const key = [rt, rb, h, n].join(",");
    let geo = cylinderCache.get(key);
    if (!geo) {
      geo = new T.CylinderGeometry(rt, rb, h, n, 1, false);
      cylinderCache.set(key, geo);
    }
    primitives.push({
      g,
      x,
      y,
      z,
      w: 1,
      h: 1,
      d: 1,
      color: c,
      m: mat(c, kind),
      geo,
      rx: 0,
      ry: 0,
      rz: 0,
    });
  }
  function beam(g, a, b, width, color, depth = width) {
    const v = new T.Vector3(...b).sub(new T.Vector3(...a)),
      mid = new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(0.5);
    const q = new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        v.clone().normalize(),
      ),
      e = new T.Euler().setFromQuaternion(q);
    box(
      g,
      mid.x,
      mid.y,
      mid.z,
      width,
      v.length(),
      depth,
      color,
      "plain",
      e.x,
      e.y,
      e.z,
    );
  }
  function ellipsoid(g, x, y, z, rx, ry, rz, color, step = 0.115, seed = 1) {
    const r = rng(seed),
      ramp = [shade(color, 0.73), shade(color, 0.9), color, shade(color, 1.14)];
    for (let yy = -ry; yy <= ry; yy += step)
      for (let xx = -rx; xx <= rx; xx += step)
        for (let zz = -rz; zz <= rz; zz += step) {
          const norm =
            (xx * xx) / (rx * rx) +
            (yy * yy) / (ry * ry) +
            (zz * zz) / (rz * rz);
          if (
            norm <= 1 &&
            norm > Math.max(0, 1 - (step * 3) / Math.min(rx, ry, rz))
          ) {
            const index = Math.min(
              3,
              Math.floor(r() * 3 + (yy / ry > 0.3 ? 0.8 : 0)),
            );
            box(g, x + xx, y + yy, z + zz, step, step, step, ramp[index]);
          }
        }
  }
  function leaf(g, start, end, width, color) {
    const a = new T.Vector3(...start),
      b = new T.Vector3(...end),
      d = b.clone().sub(a),
      n = Math.max(3, Math.ceil(d.length() / 0.11));
    for (let i = 0; i < n; i++) {
      const t = i / n,
        pt = a.clone().addScaledVector(d, t);
      const w = Math.max(0.055, width * Math.sin(Math.PI * (0.15 + t * 0.85)));
      box(
        g,
        pt.x,
        pt.y,
        pt.z,
        w,
        0.09,
        w * 0.5,
        i % 4 === 0 ? shade(color, 1.14) : color,
      );
    }
  }
  function bloom(g, x, y, z, color) {
    box(g, x, y, z, 0.1, 0.13, 0.1, "#d6ba70");
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      box(
        g,
        x + Math.cos(a) * 0.1,
        y + 0.02,
        z + Math.sin(a) * 0.1,
        0.16,
        0.1,
        0.16,
        color,
      );
    }
  }
  const plants = new Map(D.plants.map((o) => [o.id, o])),
    pots = new Map(D.pots.map((o) => [o.id, o]));
  function pot(g, id, r = 0.46, h = 0.38, empty = false) {
    const p = pots.get(id) || pots.get("terra");
    return buildVessel({ box, beam, shade }, g, p, r, h, { empty });
  }
  function makePlant(parent, o) {
    const p = plants.get(o.type),
      g = group(parent);
    g.scale.setScalar(o.scale * (o.type === "barrel" ? 1.15 : 1.38));
    g.rotation.y = (-o.rotation * Math.PI) / 180;
    const radius =
      o.type === "barrel" ? 0.67 : Math.min(0.65, (p.w || 24) / 64 + 0.07);
    const height = pot(
      g,
      o.pot || p.defaultPot,
      radius,
      o.type === "barrel" ? 0.5 : 0.38,
    );
    const fol = group(g, 0, height, 0);
    fol.userData.foliage = true;
    buildFoliage({ box, beam, ellipsoid, group, shade, rng }, fol, p, o);
    return g;
  }
  const dims = OBJECT_DIMENSIONS;
  function stand(g, w, d, h, type) {
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
              ? "#3a4840"
              : P.metal,
      ck = wooden ? "wood" : "metal",
      thick = wooden ? 0.14 : 0.075;
    if (type === "woodshelf" || type === "ladderstand") {
      for (let level = 0; level < 3; level++) {
        const yy = 0.18 + (level * (h - 0.24)) / 2,
          zz = d / 2 - ((level + 0.5) * d) / 3;
        const ww = w - (type === "ladderstand" ? level * 0.18 : 0);
        for (const xx of [-ww * 0.46, ww * 0.46])
          box(g, xx, yy / 2, zz, 0.11, yy, 0.11, P.woodDark, "wood");
        for (let slat = 0; slat < 3; slat++)
          box(
            g,
            0,
            yy,
            zz - d * 0.13 + slat * d * 0.13,
            ww,
            0.1,
            d * 0.11,
            P.wood,
            "wood",
          );
      }
      for (const xx of [-w * 0.46, w * 0.46])
        beam(g, [xx, 0.05, d * 0.47], [xx, h, -d * 0.45], 0.1, P.woodDark);
      return;
    }
    const levels =
      /shelf|stand/.test(type) && !["foamstand", "lowplatform"].includes(type)
        ? [0.18, h * 0.52, h * 0.92]
        : [h * 0.94];
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
          box(g, 0, yy, -d * 0.42 + i * d * 0.28, w, 0.11, d * 0.22, c, "wood");
      } else {
        box(g, 0, yy, -d * 0.46, w, 0.075, 0.09, c);
        box(g, 0, yy, d * 0.46, w, 0.075, 0.09, c);
        for (const x of [-w * 0.48, w * 0.48])
          box(g, x, yy, 0, 0.075, 0.075, d, c);
        for (let i = 0; i < Math.round(w / 0.38); i++)
          box(
            g,
            -w * 0.43 + i * 0.38,
            yy,
            0,
            0.04,
            0.04,
            d * 0.88,
            P.metalLight,
          );
        for (let j = 0; j < Math.round(d / 0.38); j++)
          box(g, 0, yy, -d * 0.4 + j * 0.38, w * 0.9, 0.04, 0.04, P.metal);
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
      const cover = new T.Mesh(
        new T.BoxGeometry(w * 1.05, h + 0.23, d * 1.08),
        new T.MeshLambertMaterial({
          color: "#bac6ae",
          transparent: true,
          opacity: 0.14,
          depthWrite: false,
          side: T.DoubleSide,
        }),
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
    if (type === "foamstand") {
      box(g, 0, h + 0.24, 0, w * 0.82, 0.4, d * 0.82, P.white, "clay");
      box(g, 0, h + 0.46, 0, w * 0.73, 0.02, d * 0.7, P.soil);
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
  function basin(g, w, d, h, type) {
    const steel = type === "sink",
      hh = steel ? 0.66 : 0.72,
      top = steel ? "#a8b3a9" : "#c4c4ad";
    for (const x of [-w * 0.44, w * 0.44])
      for (const z of [-d * 0.43, d * 0.43])
        box(g, x, hh / 2, z, 0.065, hh, 0.065, "#596a60");
    const bx = steel ? w * 0.13 : 0,
      rx = steel ? w * 0.24 : w * 0.31,
      rz = d * 0.35;
    // Open tray: the recessed bowl has a bottom and sides, never a disk over a solid lid.
    const n = 28,
      bowl = group(g, bx, hh - 0.06, 0);
    for (let i = 0; i < n; i++) {
      const a = (i * Math.PI * 2) / n,
        aa = ((i + 1) * Math.PI * 2) / n;
      beam(
        bowl,
        [Math.cos(a) * rx, 0, Math.sin(a) * rz],
        [Math.cos(aa) * rx, 0, Math.sin(aa) * rz],
        0.08,
        steel ? "#c6d0c1" : "#577f82",
        0.11,
      );
      box(
        bowl,
        Math.cos(a) * rx * 0.93,
        -0.12,
        Math.sin(a) * rz * 0.93,
        0.1,
        0.25,
        0.1,
        steel ? "#869a91" : "#416e77",
      );
    }
    const bottom = group(bowl, 0, -0.23, 0);
    bottom.scale.set(rx * 0.89, 1, rz * 0.89);
    cyl(bottom, 0, 0, 0, 1, 1, 0.045, steel ? "#929d91" : "#71928b", 28);
    cyl(bowl, 0, -0.194, 0, 0.085, 0.085, 0.018, "#435952", 12);
    // A steel drainboard occupies the left half; the blue fixture has a wide ivory rim.
    if (steel) {
      box(g, -w * 0.28, hh - 0.03, 0, w * 0.42, 0.085, d, top, "metal");
      for (let z = -d * 0.39; z < d * 0.4; z += 0.17)
        box(g, -w * 0.29, hh + 0.022, z, w * 0.32, 0.035, 0.025, "#d2d6c7");
    }
    for (const z of [-d * 0.46, d * 0.46])
      box(g, 0, hh, z, w, 0.09, d * 0.08, top, "metal");
    for (const x of [-w * 0.48, w * 0.48])
      box(g, x, hh, 0, w * 0.07, 0.09, d, top, "metal");
    if (!steel)
      for (const x of [-w * 0.37, w * 0.37])
        box(g, x, hh - 0.04, 0, w * 0.17, 0.075, d * 0.83, top);
    box(g, 0.12, hh + 0.2, -d * 0.44, 0.08, 0.41, 0.08, "#a3b2a8");
    box(g, 0.32, hh + 0.43, -d * 0.44, 0.48, 0.07, 0.085, "#d0d4c5");
    box(g, 0.56, hh + 0.35, -d * 0.44, 0.075, 0.17, 0.075, "#a3b2a8");
    box(g, 0.07, hh + 0.17, -d * 0.39, 0.22, 0.05, 0.055, "#81958b");
  }
  function terrarium(g, w, d, h) {
    box(
      g,
      0,
      h * 0.46,
      -d * 0.42,
      w * 0.92,
      h * 0.74,
      0.045,
      "#647e78",
      "metal",
    );
    for (let i = 0; i < 12; i++)
      box(
        g,
        -w * 0.43 + i * w * 0.078,
        h * 0.46,
        -d * 0.454,
        0.04,
        h * 0.69,
        0.035,
        "#8b9f8e",
      );
    for (const x of [-w * 0.47, w * 0.47])
      for (const z of [-d * 0.43, d * 0.43])
        box(g, x, h * 0.5, z, 0.11, h, 0.1, P.blueDark, "metal");
    box(g, 0, 0.09, 0, w, 0.14, d, P.blueDark);
    for (const zz of [-d * 0.43, d * 0.43])
      box(g, 0, h, zz, w, 0.1, 0.1, P.blue);
    for (const xx of [-w * 0.47, w * 0.47])
      box(g, xx, h, 0, 0.1, 0.1, d, P.blue);
    for (let i = 0; i < 6; i++)
      box(g, -w * 0.41 + i * w * 0.164, h, 0, 0.035, 0.04, d * 0.82, "#b1c2b1");
    for (let i = 0; i < 9; i++)
      box(
        g,
        -w * 0.42 + i * w * 0.105,
        h * 0.52,
        -d * 0.44,
        0.045,
        h * 0.86,
        0.04,
        "#a6b8a9",
      );
    for (const yy of [0.17, h * 0.9])
      box(g, 0, yy, d * 0.45, w, 0.085, 0.08, P.blue);
    const glass = new T.Mesh(
      new T.BoxGeometry(w * 0.88, h * 0.82, d * 0.8),
      new T.MeshLambertMaterial({
        color: "#86aba7",
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    );
    glass.position.y = h * 0.5;
    g.add(glass);
    for (let k = 0; k < 10; k++)
      box(
        g,
        -w * 0.38 + k * w * 0.08,
        0.22,
        -d * 0.22 + (k % 3) * d * 0.2,
        0.22,
        0.09,
        0.23,
        "#6e875a",
      );
    box(g, w * 0.12, h * 0.54, d * 0.5, 0.2, 0.06, 0.055, P.white);
    box(g, w * 0.2, h * 0.49, d * 0.5, 0.06, 0.18, 0.055, P.white);
  }

  function waterBowl(g, r, h) {
    cyl(g, 0, h * 0.42, 0, r, r * 0.63, h * 0.83, P.blueDark, 16);
    cyl(g, 0, h * 0.88, 0, r * 1.04, r * 1.04, 0.1, P.blue, 16);
    cyl(g, 0, h * 0.92, 0, r * 0.91, r * 0.91, 0.035, "#789d93", 16);
    for (let i = 0; i < 4; i++) {
      const f = group(
        g,
        Math.sin(i * 2.5) * r * 0.4,
        h * 0.955,
        Math.cos(i * 2.5) * r * 0.4,
      );
      f.userData.animated = true;
      box(f, 0, 0, 0, 0.15, 0.035, 0.055, i % 2 ? "#d8c7a0" : "#acac88");
      box(f, -0.09, 0, 0, 0.06, 0.033, 0.095, "#c9b796");
      waterAnimations.push({
        g: f,
        baseX: f.position.x,
        baseZ: f.position.z,
        phase: i * 1.8,
        r: r * 0.3,
      });
    }
    for (let i = 0; i < 3; i++)
      box(
        g,
        r * 0.4 - i * r * 0.2,
        h * 0.96,
        -r * 0.4 + i * r * 0.3,
        0.12,
        0.025,
        0.11,
        "#b9c3a7",
      );
  }
  function modelApi() {
    return {
      T,
      box,
      cyl,
      beam,
      group,
      ellipsoid,
      shade,
      P,
      stand,
      basin,
      terrarium,
      waterBowl,
      makePot: pot,
    };
  }
  function makeObject(parent, o) {
    const g = group(parent);
    g.scale.setScalar(o.scale);
    g.rotation.y = (-o.rotation * Math.PI) / 180;
    buildObject(modelApi(), g, asset(o.type), o);
    return g;
  }
  function polygonShape(points) {
    const s = new T.Shape();
    points.forEach(([x, z], i) => (i ? s.lineTo(x, z) : s.moveTo(x, z)));
    s.closePath();
    return s;
  }
  function floorTexture(name) {
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 520;
    paintBase(c.getContext("2d"), name, { includeCity: false });
    const tex = new T.CanvasTexture(c);
    tex.magFilter = tex.minFilter = T.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }
  const sourcePolygons = {
    north: SCENES.north.points,
    south: SCENES.south.points,
    room: SCENES.room.points,
  };
  const coords = (name, x, y) =>
    name === "north"
      ? [(x - 304) / 16, (y - 272) / 16]
      : name === "room"
        ? [(x - 300) / 16, (y - 216) / 16]
        : [(x - 284) / 16, (y - 264) / 16];
  function roof(parent, name) {
    if (name === "room") {
      roomShell(parent);
      return;
    }
    const points = sourcePolygons[name].map((p) => coords(name, ...p)),
      shape = polygonShape(points);
    const geo = new T.ExtrudeGeometry(shape, {
      depth: 18,
      bevelEnabled: false,
      steps: 1,
    });
    geo.rotateX(Math.PI / 2);
    const slab = new T.Mesh(geo, mat("#939587", "wall"));
    slab.position.y = -0.1;
    slab.castShadow = slab.receiveShadow = true;
    parent.add(slab);
    const faceGeo = new T.ShapeGeometry(shape);
    faceGeo.rotateX(Math.PI / 2);
    const pos = faceGeo.attributes.position,
      uv = faceGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        z = pos.getZ(i);
      const sx = x * 16 + (name === "north" ? 304 : 284),
        sy = z * 16 + (name === "north" ? 272 : 264);
      uv.setXY(i, sx / 640, 1 - sy / 520);
    }
    uv.needsUpdate = true;
    faceGeo.computeVertexNormals();
    const top = new T.Mesh(
      faceGeo,
      new T.MeshLambertMaterial({
        map: floorTexture(name),
        side: T.DoubleSide,
      }),
    );
    top.position.y = 0.015;
    top.receiveShadow = true;
    parent.add(top);
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]),
        mx = (a[0] + b[0]) / 2,
        mz = (a[1] + b[1]) / 2,
        horizontal = Math.abs(a[1] - b[1]) < 0.01;
      const isDoor =
        name === "north" &&
        !horizontal &&
        a[0] === 6 &&
        Math.min(a[1], b[1]) >= 4;
      if (isDoor) {
        for (const [z1, z2] of [
          [4, 7.5],
          [9.75, 12],
        ]) {
          box(
            parent,
            mx,
            0.48,
            (z1 + z2) / 2,
            0.28,
            0.96,
            z2 - z1,
            P.wall,
            "wall",
          );
          box(
            parent,
            mx,
            1.02,
            (z1 + z2) / 2,
            0.4,
            0.14,
            z2 - z1 + 0.08,
            P.cap,
          );
        }
        door(parent, name, mx, 8.375, -Math.PI / 2);
      } else {
        box(
          parent,
          mx,
          0.38,
          mz,
          horizontal ? len + 0.12 : 0.26,
          0.76,
          horizontal ? 0.26 : len + 0.12,
          P.wall,
          "wall",
        );
        box(
          parent,
          mx,
          0.83,
          mz,
          horizontal ? len + 0.2 : 0.36,
          0.15,
          horizontal ? 0.36 : len + 0.2,
          P.cap,
          "wall",
        );
        for (let k = 0.6; k < len; k += 1.45) {
          const xx = a[0] + ((b[0] - a[0]) * k) / len,
            zz = a[1] + ((b[1] - a[1]) * k) / len;
          box(
            parent,
            xx,
            0.42,
            zz,
            horizontal ? 0.035 : 0.29,
            0.56,
            horizontal ? 0.29 : 0.035,
            "#aaa593",
          );
        }
      }
      // Six storeys continue from the terrace all the way to the shared ground.
      const outward = new T.Vector2(b[1] - a[1], a[0] - b[0]).normalize();
      for (let floor = 0; floor < 6; floor++) {
        const yy = -1.65 - floor * 3;
        for (let k = 1.5; k < len - 1; k += 3.1) {
          const xx = a[0] + ((b[0] - a[0]) * k) / len + outward.x * 0.045,
            zz = a[1] + ((b[1] - a[1]) * k) / len + outward.y * 0.045;
          facadeWindow(
            parent,
            xx,
            yy,
            zz,
            horizontal
              ? outward.y > 0
                ? 0
                : Math.PI
              : outward.x > 0
                ? Math.PI / 2
                : -Math.PI / 2,
            1.32,
            1.55,
            (floor + Math.round(k)) % 7,
          );
        }
        box(
          parent,
          mx,
          -3 - floor * 3,
          mz,
          horizontal ? len + 0.1 : 0.075,
          0.06,
          horizontal ? 0.075 : len + 0.1,
          "#a5ab9d",
        );
      }
    }
    if (name === "north") {
      for (let x = -1.7; x < 5.9; x += 0.88)
        box(parent, x, 1.2, -12, 0.065, 1.15, 0.065, P.metal);
      box(parent, 2, 1.8, -12, 7.9, 0.08, 0.09, P.metal);
      box(parent, 8, 0.04, 11.72, 2.8, 0.08, 0.72, "#5d6051");
      for (let x = 6.7; x < 9.4; x += 0.3)
        box(parent, x, 0.09, 11.72, 0.065, 0.025, 0.63, "#a8aa92");
      for (let z = -6.2; z < -0.8; z += 1)
        box(parent, 9.95, 0.94, z, 0.06, 0.75, 0.07, P.metal);
      box(parent, 9.95, 1.3, -3.7, 0.07, 0.07, 5.5, P.metal);
    } else {
      for (const x of [-4, 4]) {
        for (let z = -9.6; z < 10; z += 2.8)
          box(parent, x, 1.05, z, 0.065, 1.4, 0.1, P.metal);
        box(parent, x, 1.75, 0, 0.1, 0.08, 20, P.metal);
      }
      door(parent, name, -3.83, 8.1, -Math.PI / 2);
    }
    // tiny drain at its original corner
    const [dx, dz] = coords(
      name,
      ...(name === "north" ? [282, 147] : [236, 407]),
    );
    cyl(parent, dx, 0.035, dz, 0.23, 0.23, 0.04, "#64776a", 12);
    for (let i = -1; i < 2; i++)
      box(parent, dx + i * 0.1, 0.06, dz, 0.04, 0.02, 0.3, "#bac0a3");
  }
  function door(parent, name, x, z, angle) {
    const frame = group(parent, x, 0.02, z);
    frame.rotation.y = angle;
    for (const xx of [-0.61, 0.61])
      box(frame, xx, 1.32, 0, 0.15, 2.64, 0.3, P.cap, "wall");
    box(frame, 0, 2.64, 0, 1.38, 0.16, 0.34, P.cap);
    box(frame, 0, 0.06, 0.12, 1.5, 0.12, 0.7, "#bbb49c");
    const hinge = group(frame, -0.51, 0, 0);
    hinge.userData.animated = true;
    box(hinge, 0.51, 1.25, 0, 1.02, 2.5, 0.16, P.metalDark, "wood");
    box(hinge, 0.51, 1.27, 0.095, 0.8, 2.26, 0.05, "#7a8271", "wood");
    box(hinge, 0.51, 1.27, 0.132, 0.59, 1.86, 0.03, "#626f62");
    for (let j = 0; j < 5; j++)
      box(hinge, 0.51, 0.51 + j * 0.36, 0.152, 0.55, 0.025, 0.025, "#8d9781");
    box(hinge, 0.8, 1.18, 0.18, 0.055, 0.16, 0.06, P.cap);
    doors[name] = { hinge, frame };
  }
  // Clothing and poses follow the game's existing authored pixel designs in wardrobe/dongdong.
  function resident(parent, name) {
    const g = group(parent);
    g.userData.animated = true;
    const body = group(g);
    body.userData.animated = true;
    const [, color, dark, light, kind] =
      OUTFITS[wardrobe.outfit] || OUTFITS.sage;
    box(body, 0, 1.1, 0, 0.49, 0.7, 0.32, color, "cloth");
    if (kind === "overall") {
      for (const x of [-0.17, 0.17]) {
        box(body, x, 0.65, 0, 0.23, 0.5, 0.28, color, "cloth");
        box(body, x, 1.31, 0.19, 0.055, 0.38, 0.035, light);
      }
      box(body, 0, 1.03, 0.18, 0.34, 0.32, 0.035, dark);
    } else {
      for (let j = 0; j < 5; j++)
        box(
          body,
          0,
          0.66 + j * 0.06,
          0,
          0.63 - j * 0.027,
          0.07,
          0.4 - j * 0.012,
          j === 0 ? dark : color,
          "cloth",
        );
      for (const x of [-0.28, 0.28])
        box(body, x, 0.85, 0, 0.08, 0.26, 0.38, dark, "cloth");
    }
    if (kind === "stripe" || kind === "check")
      for (const z of [-0.185, 0.185])
        for (let j = 0; j < 5; j++) {
          if (kind === "stripe")
            box(body, 0, 0.79 + j * 0.13, z, 0.5, 0.033, 0.023, light);
          else
            for (let k = 0; k < 4; k++)
              box(
                body,
                -0.19 + k * 0.13,
                0.8 + j * 0.12,
                z,
                0.052,
                0.052,
                0.023,
                light,
              );
        }
    if (kind === "apron") {
      box(body, 0, 1.04, 0.19, 0.34, 0.55, 0.035, light, "cloth");
      box(body, 0, 1, 0.212, 0.37, 0.035, 0.025, dark);
      for (const x of [-0.2, 0.2])
        box(body, x, 1.41, 0.04, 0.045, 0.17, 0.31, light);
      for (const x of [-0.11, 0.11])
        box(body, x, 1, -0.19, 0.16, 0.085, 0.065, light);
      box(body, 0, 0.9, 0.22, 0.18, 0.09, 0.018, color);
    }
    if (kind === "pocket")
      for (const x of [-0.145, 0.145]) {
        box(body, x, 1.02, 0.18, 0.17, 0.17, 0.055, dark);
        box(body, x, 1.11, 0.21, 0.17, 0.024, 0.023, light);
        box(body, x, 0.85, -0.185, 0.14, 0.13, 0.025, dark);
      }
    if (kind === "jacket") {
      box(body, 0, 1.11, 0.183, 0.065, 0.64, 0.025, dark);
      for (const x of [-0.09, 0.09])
        box(
          body,
          x,
          1.39,
          0.19,
          0.07,
          0.19,
          0.055,
          light,
          "cloth",
          0,
          0,
          x < 0 ? -0.35 : 0.35,
        );
      for (let j = 0; j < 4; j++)
        box(body, 0, 0.92 + j * 0.11, 0.209, 0.025, 0.025, 0.025, light);
    }
    box(body, 0, 1.78, 0, 0.44, 0.47, 0.37, "#bba387");
    box(body, 0, 2.04, 0, 0.49, 0.16, 0.41, "#685044");
    box(body, -0.23, 1.88, 0, 0.1, 0.35, 0.4, "#4f4038");
    box(body, 0.2, 1.92, -0.08, 0.09, 0.25, 0.28, "#685044");
    box(body, 0, 1.86, -0.18, 0.4, 0.24, 0.065, "#685044");
    for (const x of [-0.1, 0.1])
      box(body, x, 1.79, 0.195, 0.045, 0.045, 0.025, "#4c5147");
    const legs = [];
    for (const x of [-0.16, 0.16]) {
      const leg = group(g, x, 0.4, 0);
      leg.userData.animated = true;
      box(leg, 0, -0.12, 0, 0.13, 0.45, 0.14, "#a49781");
      box(leg, 0, -0.33, 0.08, 0.2, 0.13, 0.32, "#424b40");
      legs.push(leg);
    }
    const arms = [];
    for (const x of [-0.33, 0.33]) {
      const arm = group(body, x, 1.38, 0);
      arm.userData.animated = true;
      if (kind === "jacket")
        box(arm, 0, -0.14, 0, 0.19, 0.34, 0.21, color, "cloth");
      box(arm, 0, -0.25, 0, 0.14, 0.27, 0.15, "#bba387");
      box(arm, 0, -0.42, 0.01, 0.13, 0.14, 0.14, "#bba387");
      arms.push(arm);
    }
    const tools = {};
    for (const kind of [
      "water",
      "sweep",
      "prune",
      "tend",
      "wipe",
      "wash",
      "tea",
      "feed",
    ]) {
      const tool = group(arms[1], 0, -0.43, 0.06);
      tool.userData.animated = true;
      tool.visible = false;
      tools[kind] = tool;
      if (kind === "water") {
        const can = group(tool, 0.1, -0.05, 0.03);
        can.scale.setScalar(0.4);
        buildObject(modelApi(), can, asset("watering"), {});
      }
      if (kind === "sweep") {
        beam(tool, [0, 0.08, 0], [0.15, -0.83, 0.24], 0.035, P.wood);
        box(tool, 0.15, -0.84, 0.24, 0.34, 0.12, 0.15, "#a49473");
        for (let j = 0; j < 7; j++)
          box(
            tool,
            0.015 + j * 0.044,
            -0.94,
            0.24,
            0.026,
            0.11,
            0.15,
            "#786952",
          );
      }
      if (kind === "prune") {
        for (const v of [-1, 1]) {
          beam(
            tool,
            [v * 0.055, -0.07, 0],
            [-v * 0.09, 0.16, 0.03],
            0.025,
            P.metalLight,
          );
          box(tool, v * 0.055, -0.08, 0, 0.07, 0.08, 0.025, P.blueDark);
        }
      }
      if (kind === "tend") {
        box(tool, 0, 0.07, 0, 0.04, 0.2, 0.04, P.wood);
        box(tool, 0, -0.08, 0.03, 0.11, 0.13, 0.045, P.metalLight);
      }
      if (kind === "wipe")
        box(tool, 0, -0.05, 0.04, 0.25, 0.035, 0.17, "#a4b3a7", "cloth");
      if (kind === "tea" || kind === "feed") {
        cyl(
          tool,
          0,
          -0.025,
          0.09,
          kind === "tea" ? 0.1 : 0.16,
          0.085,
          0.12,
          P.white,
          12,
        );
        cyl(tool, 0, 0.04, 0.09, 0.075, 0.075, 0.014, "#756956", 12);
      }
      if (kind === "wash" || kind === "water")
        for (let j = 0; j < 5; j++)
          box(
            tool,
            0.27 + j * 0.04,
            -0.15 - j * 0.1,
            0.02,
            0.025,
            0.055,
            0.025,
            "#a8c0be",
          );
    }
    actors[name] = { person: g, body, legs, arms, tools };
  }
  function pig(parent, name) {
    const g = group(parent);
    g.userData.animated = true;
    box(g, 0, 0.43, 0, 0.65, 0.41, 0.35, "#c7aaa7");
    box(g, 0, 0.63, 0, 0.5, 0.1, 0.29, "#d6beb7");
    box(g, 0, 0.46, 0.36, 0.32, 0.32, 0.29, "#d3b8b2");
    box(g, 0, 0.4, 0.53, 0.23, 0.15, 0.11, "#bb9295");
    for (const x of [-0.16, 0.16]) {
      box(g, x, 0.66, 0.29, 0.09, 0.18, 0.13, "#bb9396");
      box(g, x * 1.1, 0.5, 0.39, 0.025, 0.045, 0.04, "#5a524c");
    }
    for (const x of [-0.12, 0.12])
      for (const z of [-0.22, 0.25])
        box(g, x, 0.14, z, 0.1, 0.26, 0.12, "#bb9a97");
    box(g, 0, 0.5, -0.39, 0.06, 0.1, 0.11, "#b48f95");
    const decoration = DECORATIONS[wardrobe.pig];
    if (decoration) {
      const col = wardrobe.pig.includes("clay")
        ? "#ae8270"
        : wardrobe.pig.includes("cream") || wardrobe.pig === "flower"
          ? "#c3b994"
          : wardrobe.pig.includes("berry") || wardrobe.pig === "ribbon"
            ? "#986e7c"
            : wardrobe.pig.includes("blue") || wardrobe.pig === "scarf"
              ? "#788d9b"
              : "#778578";
      const kind = wardrobe.pig.split("-")[0];
      if (kind === "cap" || kind === "bonnet") {
        box(g, 0, 0.76, 0.3, 0.4, 0.12, 0.32, col);
        box(g, 0, 0.84, 0.29, 0.25, 0.15, 0.23, col);
        if (kind === "bonnet") {
          for (let k = 0; k < 12; k++) {
            const a = (k * Math.PI) / 6;
            box(
              g,
              Math.cos(a) * 0.22,
              0.76,
              0.3 + Math.sin(a) * 0.18,
              0.075,
              0.08,
              0.07,
              "#ddd3b5",
            );
          }
          for (const x of [-0.16, 0.16])
            box(g, x, 0.57, 0.43, 0.03, 0.23, 0.035, col);
        } else box(g, 0, 0.77, 0.51, 0.34, 0.04, 0.14, col);
      } else if (kind === "vest") {
        box(g, 0, 0.57, 0, 0.38, 0.14, 0.56, col);
        for (const x of [-0.18, 0.18])
          box(g, x, 0.44, 0, 0.06, 0.24, 0.56, col);
        box(g, 0, 0.5, 0.29, 0.24, 0.24, 0.05, col);
        for (let j = 0; j < 3; j++)
          box(g, 0, 0.44 + j * 0.055, 0.32, 0.025, 0.025, 0.025, "#c8c2a4");
      } else if (kind === "ribbon") {
        box(g, 0, 0.72, 0.29, 0.08, 0.11, 0.08, col);
        for (const x of [-0.13, 0.13]) {
          box(g, x, 0.73, 0.29, 0.16, 0.16, 0.065, col);
          box(g, x * 0.4, 0.62, 0.3, 0.065, 0.15, 0.04, col);
        }
      } else if (kind === "flower") {
        for (let k = 0; k < 5; k++) {
          const a = (k * 6.283) / 5;
          box(
            g,
            Math.cos(a) * 0.12,
            0.75 + Math.sin(a) * 0.12,
            0.38,
            0.11,
            0.11,
            0.06,
            col,
          );
        }
        box(g, 0, 0.75, 0.42, 0.065, 0.065, 0.03, "#ccb473");
      } else {
        for (const x of [-0.2, 0.2])
          box(g, x, 0.45, 0.18, 0.045, 0.1, 0.32, col);
        box(g, 0, 0.44, 0.34, 0.4, 0.09, 0.055, col);
        if (kind === "bell") {
          cyl(g, 0, 0.32, 0.39, 0.055, 0.075, 0.12, "#bfa46e", 8);
          box(g, 0, 0.25, 0.39, 0.022, 0.025, 0.022, "#715f43");
        } else {
          box(g, 0.07, 0.36, 0.39, 0.15, 0.19, 0.055, col);
          box(g, 0.04, 0.46, 0.37, 0.09, 0.08, 0.08, col);
        }
      }
    }
    actors[name].pig = g;
  }
  // Lift plant bases to nearby real shelf surfaces; do not scale screen height into footprint depth.
  function supportHeight(o, list) {
    let best = null;
    for (const f of list) {
      if (!/shelf|stand|platform|bench|plantcart|bistrotable/.test(f.type))
        continue;
      const dd = dims[f.type];
      if (!dd) continue;
      const a = (-f.rotation * Math.PI) / 180,
        dx = (o.x - f.x) / 16,
        dz = (o.y - f.y) / 16,
        lx = dx * Math.cos(a) - dz * Math.sin(a),
        lz = dx * Math.sin(a) + dz * Math.cos(a),
        w = (dd[0] / 16) * f.scale,
        d = (dd[1] / 16) * f.scale,
        h = (dd[2] / 16) * f.scale;
      if (Math.abs(lx) < w * 0.53 && Math.abs(lz) < d * 0.57) {
        const score = (lx / w) ** 2 + (lz / d) ** 2;
        if (!best || score < best.score) {
          const levels =
            /shelf|stand/.test(f.type) && !["foamstand"].includes(f.type)
              ? [0.18, 0.52, 0.92]
              : [0.94];
          const factor =
            levels.length === 1
              ? levels[0]
              : lz < -d * 0.12
                ? 0.92
                : lz > d * 0.13
                  ? 0.18
                  : 0.52;
          best = {
            score,
            y:
              h * factor + 0.06 + (f.type === "foamstand" ? 0.43 * f.scale : 0),
          };
        }
      }
    }
    return best ? best.y : 0;
  }
  const objectRoots = { north: new Map(), south: new Map(), room: new Map() };
  function objectPosition(name, o, list) {
    const contact = plants.has(o.type) ? withContact(o) : o;
    const [x, z] = coords(name, o.x, o.y + (contact.contactY || 0));
    const y =
      plants.has(o.type) ||
      ["teaset", "labels", "tools", "tasklamp"].includes(o.type)
        ? supportHeight(contact, list)
        : 0;
    return new T.Vector3(x, y + 0.02, z);
  }
  function addModel(name, o, list) {
    const anchor = group(groups[name]);
    anchor.position.copy(objectPosition(name, o, list));
    anchor.userData.animated = true;
    anchor.userData.objectId = o.id;
    anchor.userData.signature = JSON.stringify([
      o.type,
      o.rotation,
      o.scale,
      o.pot,
      o.seed,
    ]);
    (plants.has(o.type) ? makePlant : makeObject)(anchor, o);
    objectRoots[name].set(o.id, anchor);
    return anchor;
  }
  function build(name) {
    if (groups[name]) return groups[name];
    const root = group(scene);
    root.name = name;
    groups[name] = root;
    roof(root, name);
    const list = D.layout[name];
    for (const o of list) addModel(name, o, list);
    resident(root, name);
    pig(root, name);
    return root;
  }
  function release(root) {
    root.removeFromParent();
    const owned = new Set();
    root.traverse((n) => {
      if (n.isInstancedMesh) {
        owned.add(n);
        n.dispose();
      } else if (n.isMesh) {
        n.geometry?.dispose();
        if (![...materialCache.values()].includes(n.material))
          n.material?.dispose();
      }
    });
    batches = batches.filter((b) => !owned.has(b));
    waterAnimations = waterAnimations.filter((f) => {
      for (let p = f.g; p; p = p.parent) if (p === root) return false;
      return true;
    });
  }
  let layoutKey = JSON.stringify(layout.scenes);
  function syncLayout(next) {
    const key = JSON.stringify(next.scenes);
    if (key === layoutKey) return;
    layoutKey = key;
    layout = next;
    for (const name of ["north", "south", "room"]) {
      D.layout[name] = (next.scenes[name] || []).map(withContact);
      if (!groups[name]) continue;
      const list = D.layout[name],
        roots = objectRoots[name],
        ids = new Set(list.map((o) => o.id));
      for (const [id, root] of roots)
        if (!ids.has(id)) {
          release(root);
          roots.delete(id);
        }
      for (const o of list) {
        const signature = JSON.stringify([
          o.type,
          o.rotation,
          o.scale,
          o.pot,
          o.seed,
        ]);
        let root = roots.get(o.id);
        if (root && root.userData.signature !== signature) {
          release(root);
          roots.delete(o.id);
          root = null;
        }
        if (!root) root = addModel(name, o, list);
        root.position.copy(objectPosition(name, o, list));
      }
    }
    if (primitives.length) compileInstances();
    renderer.shadowMap.needsUpdate = true;
  }
  function roomShell(root) {
    const w = 10,
      d = 14;
    box(root, 0, -0.13, 0, w, 0.25, d, "#b4a991", "wood");
    box(root, 0, 1.25, -d / 2, w, 2.5, 0.15, "#c6bea4", "wall");
    box(root, -w / 2, 1.25, 0, 0.15, 2.5, d, "#b7ae95", "wall");
    box(root, w / 2, 0.23, 0, 0.15, 0.45, d, "#b7ae95", "wall");
    for (let z = -6.9; z < 7; z += 1)
      box(root, 0, 0.003, z, w, 0.015, 0.025, "#988e76");
    box(root, 0, 1.57, -6.9, 3.4, 1.5, 0.045, "#7f968a");
    for (const x of [-1.75, 0, 1.75])
      box(root, x, 1.57, -6.86, 0.065, 1.6, 0.055, "#d0cfad");
    box(root, 0, 1.57, -6.85, 3.5, 0.065, 0.055, "#d0cfad");
    for (let k = 0; k < 7; k++)
      box(root, 0, 1.04 + k * 0.19, -6.82, 3.5, 0.035, 0.025, "#b9c3a6");
    door(root, "room", -4.9, 4, -Math.PI / 2);
  }
  // Instanced geometry keeps thousands of voxel clusters inexpensive and fully three dimensional.
  function compileInstances() {
    scene.updateMatrixWorld(true);
    const buckets = new Map(),
      dummy = new T.Object3D(),
      worldMat = new T.Matrix4();
    for (const p of primitives) {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.w, p.h, p.d);
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.updateMatrix();
      p.g.updateWorldMatrix(true, false);
      worldMat.multiplyMatrices(p.g.matrixWorld, dummy.matrix);
      let root = p.g;
      while (root.parent && root.parent !== scene && !root.userData.animated)
        root = root.parent;
      const cast =
        root.name !== "city" &&
        !(p.geo === cube && Math.min(p.w, p.h, p.d) < 0.065);
      const m = p.m.userData.window
        ? p.m
        : mat("#ffffff", p.m.userData.kind || "plain");
      const key = root.uuid + "|" + m.uuid + "|" + p.geo.uuid + "|" + cast;
      let b = buckets.get(key);
      if (!b) {
        b = { root, m, geo: p.geo, cast, matrices: [], colors: [] };
        buckets.set(key, b);
      }
      b.matrices.push(worldMat.clone());
      b.colors.push(p.m.userData.window ? "#ffffff" : p.color);
    }
    for (const b of buckets.values()) {
      const inst = new T.InstancedMesh(b.geo, b.m, b.matrices.length);
      const inv = b.root.matrixWorld.clone().invert();
      b.matrices.forEach(
        (m, i) => (
          inst.setMatrixAt(i, new T.Matrix4().multiplyMatrices(inv, m)),
          inst.setColorAt(i, new T.Color(b.colors[i]))
        ),
      );
      inst.castShadow = b.cast;
      inst.receiveShadow = b.root.name !== "city";
      inst.instanceMatrix.needsUpdate = true;
      inst.computeBoundingSphere();
      b.root.add(inst);
      batches.push(inst);
    }
    primitives = [];
  }
  const city = group(scene);
  city.name = "city";
  const groundY = -18.15,
    windowMats = [];
  function facadeWindow(parent, x, y, z, angle, w, h, variant) {
    const g = group(parent, x, y, z);
    g.rotation.y = angle;
    box(g, 0, 0, 0, w + 0.16, h + 0.15, 0.1, "#9da899");
    const color = [
      "#6d8584",
      "#78948e",
      "#b4bbaa",
      "#8b9d8e",
      "#748e88",
      "#b7b492",
      "#718988",
    ][variant % 7];
    const m = mat(color);
    m.userData.window = true;
    if (!windowMats.includes(m)) windowMats.push(m);
    box(g, 0, 0, 0.066, w, h, 0.055, color);
    box(g, 0, 0, 0.103, 0.05, h, 0.04, "#c1c4af");
    box(g, 0, -h * 0.2, 0.102, w, 0.045, 0.04, "#bec2ac");
    box(g, 0, -h / 2 - 0.08, 0.16, w + 0.22, 0.13, 0.32, "#b8bba7");
    if (variant % 5 === 0) {
      box(g, w * 0.55, -h * 0.4, 0.12, 0.47, 0.35, 0.28, "#b3b7a7");
      for (let j = 0; j < 3; j++)
        box(
          g,
          w * 0.55,
          -h * 0.5 + j * 0.08,
          0.275,
          0.35,
          0.025,
          0.02,
          "#7d8980",
        );
    }
  }
  function building(x, z, w, d, floors, seed) {
    const g = group(city, x, groundY, z),
      h = floors * 3,
      r = rng(seed);
    box(g, 0, h / 2, 0, w, h, d, "#a6afa4", "wall");
    box(g, 0, h + 0.06, 0, w + 0.35, 0.28, d + 0.35, "#97a698", "wall");
    for (let yy = 1.45; yy < h; yy += 3) {
      for (let xx = -w / 2 + 1.5; xx < w / 2 - 0.8; xx += 2.8) {
        facadeWindow(g, xx, yy, d / 2, 0, 1.3, 1.55, Math.floor(r() * 7));
        facadeWindow(
          g,
          xx,
          yy,
          -d / 2,
          Math.PI,
          1.3,
          1.55,
          Math.floor(r() * 7),
        );
      }
      for (let zz = -d / 2 + 1.5; zz < d / 2 - 0.8; zz += 2.8) {
        facadeWindow(
          g,
          w / 2,
          yy,
          zz,
          Math.PI / 2,
          1.25,
          1.55,
          Math.floor(r() * 7),
        );
        facadeWindow(
          g,
          -w / 2,
          yy,
          zz,
          -Math.PI / 2,
          1.25,
          1.55,
          Math.floor(r() * 7),
        );
      }
      box(g, 0, yy - 1.43, d / 2 + 0.04, w, 0.06, 0.07, "#bbc0ae");
    }
    // Soft tiled roof with shallow pitch and a stairwell rather than disconnected slabs.
    for (let zz = -d * 0.5; zz < d * 0.51; zz += 0.35)
      box(
        g,
        0,
        h + 0.25 + (0.5 - Math.abs(zz / d)) * 0.7,
        zz,
        w + 0.3,
        0.09,
        0.34,
        "#6f8076",
        "wall",
      );
    box(g, -w * 0.18, h + 0.45, -d * 0.22, 1.6, 0.9, 1.3, "#a2ad9a", "wall");
    box(g, -w * 0.18, h + 0.94, -d * 0.22, 1.8, 0.12, 1.5, "#859682");
    box(g, 0, 0.8, d / 2 + 0.04, 0.9, 1.6, 0.08, "#526a60");
    box(g, 0, 1.65, d / 2 + 0.4, 1.8, 0.12, 0.9, "#9daa97");
  }
  [
    [-22, -20, 11, 10, 6],
    [-5, -29, 13, 8, 6],
    [20, -23, 13, 10, 6],
    [-23, 2, 10, 13, 5],
    [25, 3, 12, 14, 6],
    [-23, 23, 13, 10, 6],
    [-4, 28, 15, 10, 5],
    [22, 28, 14, 10, 6],
  ].forEach((v, i) => building(...v, 876 + i));
  const ground = new T.Mesh(
    new T.PlaneGeometry(240, 240),
    mat("#939d8e", "wall"),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = groundY - 0.05;
  ground.receiveShadow = true;
  scene.add(ground);
  // Community lanes, kerbs, planted strips, bicycle shelter and a few parked cars.
  const lanes = group(city, 0, groundY + 0.03, 0);
  for (const x of [-15, 16]) {
    box(lanes, x, 0, 0, 5, 0.055, 100, "#89968e", "wall");
    for (const side of [-1, 1])
      box(lanes, x + side * 2.6, 0.08, 0, 0.25, 0.13, 100, "#b5b9a5");
  }
  for (const z of [-15, 17]) {
    box(lanes, 0, 0.02, z, 100, 0.06, 4.5, "#89968e", "wall");
    for (const side of [-1, 1])
      box(lanes, 0, 0.08, z + side * 2.35, 100, 0.13, 0.25, "#b5b9a5");
  }
  for (let k = 0; k < 22; k++) {
    const x = k % 2 ? 19 : -18,
      z = -32 + Math.floor(k / 2) * 6;
    box(lanes, x, 0.08, z, 1.7, 0.12, 3.5, "#708467", "wall");
    box(lanes, x, 1, z, 0.12, 1.9, 0.12, "#6b6b52");
    // Stepped blocks keep the greenery pixel-like without costly micro-voxels.
    for (let j = 0; j < 5; j++)
      box(
        lanes,
        x + Math.sin(j * 2.4) * 0.43,
        2.2 + Math.cos(j) * 0.23,
        z + Math.cos(j * 2.4) * 0.43,
        1.0,
        0.8,
        1.0,
        j % 2 ? "#788b6c" : "#5f7b66",
      );
  }
  for (let k = 0; k < 6; k++) {
    const g = group(lanes, k % 2 ? -14 : 15, 0.1, -12 + k * 5);
    g.rotation.y = Math.PI / 2;
    const c = ["#a6b8ac", "#697e7c", "#b7aa90"][k % 3];
    box(g, 0, 0.4, 0, 1.2, 0.52, 2.25, c);
    box(g, 0, 0.8, -0.13, 1.05, 0.45, 1.16, c);
    box(g, 0, 0.82, 0.48, 0.93, 0.28, 0.035, "#496865");
    box(g, 0, 0.82, -0.73, 0.93, 0.28, 0.035, "#496865");
    for (const x of [-0.61, 0.61])
      for (const z of [-0.68, 0.68])
        box(g, x, 0.22, z, 0.12, 0.36, 0.36, "#485750");
  }
  box(lanes, -10, 0.55, 17, 6, 0.9, 2.2, "#879782", "wall");
  box(lanes, -10, 1.1, 17, 6.3, 0.14, 2.4, "#bcc2ab");
  for (let i = 0; i < 4; i++) {
    box(lanes, 10 + i * 0.55, 0.55, 17, 0.1, 1, 0.1, "#788981");
    box(lanes, 10 + i * 0.55, 1.12, 17, 0.52, 0.045, 0.1, "#9fad98");
  }
  build(options.scene || "north");
  compileInstances();
  let current = "north",
    view = { theta: -0.12, phi: 1.15, zoom: 1 },
    wanted = { ...view };
  const target = new T.Vector3(0, 0.2, -1.1),
    desiredTarget = target.clone();
  const pointers = new Map();
  let lastDistance = 0,
    lastShadow = 0,
    doorProgress = 0;
  function reset(name) {
    current = name;
    build(name);
    if (primitives.length) compileInstances();
    for (const [key, g] of Object.entries(groups)) g.visible = key === name;
    city.visible = name !== "room";
    wanted.theta =
      controls === "fixed"
        ? 0
        : name === "north"
          ? -0.12
          : name === "room"
            ? -0.18
            : -0.25;
    wanted.phi = controls === "fixed" ? 1.05 : name === "room" ? 1.08 : 1.15;
    wanted.zoom = name === "room" ? 1.07 : innerWidth < 640 ? 1.06 : 1.22;
    desiredTarget.set(
      name === "north" ? 0 : -0.4,
      0.2,
      name === "north" ? -2.35 : name === "room" ? -0.8 : 0,
    );
    Object.assign(view, wanted);
    target.copy(desiredTarget);
    pointers.clear();
    lastDistance = 0;
    doorProgress = 0;
    doors[name].hinge.rotation.y = 0;
    renderer.shadowMap.needsUpdate = true;
    resize();
  }
  function resize() {
    // Fine fixed pixel grid, independent of Retina/device density.
    const w = canvas.clientWidth || innerWidth,
      h = canvas.clientHeight || innerHeight;
    renderer.setSize(Math.ceil(w / 1.2), Math.ceil(h / 1.2), false);
    const height =
      current === "room"
        ? Math.max(18, (14 * h) / w)
        : w < 640
          ? Math.max(28, (21 * h) / w)
          : 27;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.left = (-height * w) / h / 2;
    camera.right = (height * w) / h / 2;
    camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
  }
  function zoom(delta) {
    wanted.zoom = T.MathUtils.clamp(wanted.zoom * Math.exp(delta), 0.58, 1.85);
  }
  function distance() {
    const p = [...pointers.values()];
    return p.length === 2 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0;
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    if (controls === "none") return;
    const object = editable && pick(e.clientX, e.clientY);
    pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      object: object?.id,
    });
    lastDistance = distance();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    const old = pointers.get(e.pointerId),
      dx = e.clientX - old.x,
      dy = e.clientY - old.y;
    if (controls === "none") return;
    const object = editable && pick(e.clientX, e.clientY);
    pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      object: object?.id,
    });
    if (pointers.size === 2) {
      const d = distance();
      if (d && lastDistance) zoom(Math.log(d / lastDistance));
      lastDistance = d;
    } else if (controls === "fixed") {
      desiredTarget.x -=
        (dx * (camera.right - camera.left)) / view.zoom / canvas.clientWidth;
      desiredTarget.z -=
        (dy * (camera.top - camera.bottom)) /
        view.zoom /
        canvas.clientHeight /
        Math.sin(view.phi);
      desiredTarget.x = T.MathUtils.clamp(desiredTarget.x, -6, 6);
      desiredTarget.z = T.MathUtils.clamp(desiredTarget.z, -8, 8);
    } else if (!old.object) {
      wanted.theta -= dx * 0.006;
      wanted.phi = T.MathUtils.clamp(wanted.phi + dy * 0.005, 0.35, 1.49);
    }
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(type, (e) => {
      pointers.delete(e.pointerId);
      lastDistance = distance();
    });
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom(-T.MathUtils.clamp(e.deltaY, -130, 130) * 0.0015);
    },
    { passive: false },
  );
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("keydown", (e) => {
    const keys = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "+",
      "-",
      "=",
      "Home",
    ];
    if (editable || controls === "none" || !keys.includes(e.key)) return;
    if (controls === "fixed" && e.key.startsWith("Arrow")) return;
    e.preventDefault();
    if (e.key === "ArrowLeft") wanted.theta -= 0.14;
    if (e.key === "ArrowRight") wanted.theta += 0.14;
    if (e.key === "ArrowUp") wanted.phi = Math.min(1.49, wanted.phi + 0.1);
    if (e.key === "ArrowDown") wanted.phi = Math.max(0.35, wanted.phi - 0.1);
    if (e.key === "+" || e.key === "=") zoom(0.12);
    if (e.key === "-") zoom(-0.12);
    if (e.key === "Home") reset(current);
  });
  window.addEventListener("resize", resize);
  // Rain is three-dimensional and wraps around the terrace, with wet concrete and ripples.
  const drops = 520,
    rainPositions = new Float32Array(drops * 6),
    rainSeeds = Array.from({ length: drops }, (_, i) => rng(973 + i)());
  const rainGeo = new T.BufferGeometry();
  rainGeo.setAttribute("position", new T.BufferAttribute(rainPositions, 3));
  const rainMat = new T.LineBasicMaterial({
    color: "#b7c9cf",
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const rain = new T.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  scene.add(rain);
  const puddles = {};
  for (const name of ["north", "south", "room"]) {
    const list =
      name === "north"
        ? [
            [280, 204, 0.7, 0.3],
            [302, 308, 0.7, 0.42],
            [446, 430, 0.5, 0.36],
            [376, 324, 0.9, 0.25],
          ]
        : [
            [235, 395, 0.6, 0.32],
            [300, 310, 0.55, 0.3],
          ];
    const g = group(scene);
    g.visible = false;
    const m = new T.MeshLambertMaterial({
      color: "#718b86",
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    for (const [x, y, rx, rz] of list) {
      const [xx, zz] = coords(name, x, y),
        p = new T.Mesh(new T.CircleGeometry(1, 18), m);
      p.rotation.x = -Math.PI / 2;
      p.scale.set(rx, rz, 1);
      p.position.set(xx, 0.026, zz);
      g.add(p);
    }
    const rippleMat = new T.LineBasicMaterial({
      color: "#b5c5b6",
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const rippleList = [];
    for (let k = 0; k < 5; k++) {
      const [x, y] = list[k % list.length],
        [xx, zz] = coords(name, x, y);
      const vertices = [];
      for (let j = 0; j < 25; j++) {
        const a = (j * Math.PI * 2) / 24;
        vertices.push(Math.cos(a), 0, Math.sin(a));
      }
      const geom = new T.BufferGeometry();
      geom.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
      const line = new T.Line(geom, rippleMat);
      line.position.set(xx, 0.033, zz);
      g.add(line);
      rippleList.push(line);
    }
    puddles[name] = { g, m, rippleMat, rippleList };
  }
  const cloudShadowMat = new T.MeshBasicMaterial({
    color: "#596f75",
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const cloudShadow = new T.Mesh(new T.PlaneGeometry(9, 7), cloudShadowMat);
  cloudShadow.rotation.x = -Math.PI / 2;
  cloudShadow.position.y = 0.03;
  scene.add(cloudShadow);
  const projected = new T.Vector3();
  function positionDoor() {
    if (!doorButton) return;
    const frame = doors[current].frame,
      rect = canvas.getBoundingClientRect(),
      points = [];
    for (const x of [-0.65, 0.65])
      for (const y of [0.05, 2.7]) {
        projected.set(x, y, 0);
        frame.localToWorld(projected);
        projected.project(camera);
        points.push([
          (projected.x * 0.5 + 0.5) * rect.width,
          (0.5 - projected.y * 0.5) * rect.height,
        ]);
      }
    const xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]);
    const left = Math.min(...xs),
      top = Math.min(...ys),
      width = Math.max(44, Math.max(...xs) - left),
      height = Math.max(44, Math.max(...ys) - top);
    doorButton.hidden =
      left + width < 0 ||
      left > rect.width ||
      top + height < 0 ||
      top > rect.height;
    Object.assign(doorButton.style, {
      left: left + "px",
      top: top + "px",
      width: width + "px",
      height: height + "px",
    });
  }
  function updateActor(pig, person, present, time) {
    const a = actors[current];
    a.person.visible = present;
    const update = (g, p) => {
      const [x, z] = coords(current, p.x, p.y);
      g.position.set(x, 0.04, z);
      g.rotation.y =
        { south: 0, north: Math.PI, east: Math.PI / 2, west: -Math.PI / 2 }[
          p.facing
        ] || 0;
    };
    update(a.person, person);
    update(a.pig, pig);
    const walk = person.state === "walk" ? Math.sin(time * 8) * 0.28 : 0;
    const action =
      person.state === "care"
        ? /水/.test(person.task)
          ? "water"
          : /修/.test(person.task)
            ? "prune"
            : /擦/.test(person.task)
              ? "wipe"
              : /扫/.test(person.task)
                ? "sweep"
                : "tend"
        : person.state;
    const seated = ["sit", "tea"].includes(action),
      working = [
        "water",
        "sweep",
        "prune",
        "tend",
        "wipe",
        "inspect",
        "wash",
        "feed",
      ].includes(action);
    a.person.position.y -= seated ? 0.24 : 0;
    a.body.rotation.x = ["prune", "tend", "feed", "inspect"].includes(action)
      ? 0.2
      : 0;
    a.legs.forEach(
      (g, i) => (g.rotation.x = seated ? -1.15 : (i ? -1 : 1) * walk),
    );
    a.arms.forEach(
      (g, i) =>
        (g.rotation.x = working
          ? -0.7 + Math.sin(time * 3) * (action === "sweep" ? 0.25 : 0.08)
          : action === "tea" && i === 1
            ? -1.4 + Math.sin(time * 1.5) * 0.3
            : (i ? 1 : -1) * walk * 0.7),
    );
    for (const [key, tool] of Object.entries(a.tools))
      tool.visible = key === action;
    a.pig.position.y +=
      pig.state === "walk" ? Math.abs(Math.sin(time * 9)) * 0.035 : 0;
  }
  function draw({
    time,
    dt,
    selected,
    atmosphere: a,
    person,
    pig,
    present,
    doorOpen,
    reduced,
  }) {
    updateWardrobe();
    resizeIfNeeded();
    const speed = reduced ? 1 : 1 - Math.exp(-dt * 14);
    for (const key of ["theta", "phi", "zoom"])
      view[key] += (wanted[key] - view[key]) * speed;
    target.lerp(desiredTarget, speed);
    const radius = 58;
    camera.position.set(
      target.x + Math.sin(view.theta) * Math.cos(view.phi) * radius,
      target.y + Math.sin(view.phi) * radius,
      target.z + Math.cos(view.theta) * Math.cos(view.phi) * radius,
    );
    camera.lookAt(target);
    camera.zoom = view.zoom;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    doorProgress += (Number(doorOpen) - doorProgress) * Math.min(1, dt * 12);
    doors[current].hinge.rotation.y = -doorProgress * 0.58;
    updateActor(pig, person, present, time);
    windTime.value = time;
    windPower.value = a.wind;
    renderer.setClearColor(a.sky);
    scene.fog.color.set(a.sky);
    scene.fog.near = 52 - a.fog * 12;
    scene.fog.far = 150 - a.fog * 150;
    hemi.color.set(
      a.night > 0.5
        ? "#a5b7d2"
        : a.rain > 0.1
          ? "#b8c4d2"
          : a.cloud > 0.7
            ? "#c7d0cf"
            : "#e7ecdf",
    );
    for (const m of materialCache.values())
      if (m.userData.kind === "light") {
        m.emissive.set("#edc783");
        m.emissiveIntensity = (a.lamps || 0) * 0.85;
      }
    hemi.intensity = current === "room" ? 1.4 : 1.75 - a.lightAmount * 1.12;
    hemi.groundColor.set(a.night > 0.5 ? "#566d79" : "#9ea795");
    sun.color.set(
      a.phase === "dusk"
        ? "#ddae87"
        : a.phase === "dawn"
          ? "#d5beb0"
          : "#e8e6ca",
    );
    sun.intensity = current === "room" ? 0.85 : 0.25 + a.sun * 0.9;
    sun.position.set(-22, a.phase === "dusk" ? 15 : 36, -14);
    windowMats.forEach((m, i) => {
      const lit = (i % 7) / 7 < a.lamps;
      m.emissive.set(lit ? "#d1bc85" : "#000000");
      m.emissiveIntensity = lit ? 0.5 : 0;
    });
    for (const f of waterAnimations) {
      f.g.position.x = f.baseX + Math.sin(time * 0.2 + f.phase) * f.r * 0.4;
      f.g.position.z = f.baseZ + Math.cos(time * 0.16 + f.phase) * f.r * 0.25;
      f.g.rotation.y = Math.cos(time * 0.2 + f.phase) * 0.4;
    }
    for (const [name, p] of Object.entries(puddles))
      p.g.visible = name === current && current !== "room";
    puddles[current].m.opacity = a.wetness * 0.55;
    puddles[current].rippleMat.opacity = a.rain * 0.55;
    puddles[current].rippleList.forEach((l, i) => {
      const t = (time * 1.1 + i * 0.23) % 1;
      l.scale.setScalar(0.1 + t * 0.47);
    });
    rain.visible = current !== "room" && a.rain > 0.01;
    rainMat.opacity = 0.2 + a.rain * 0.35;
    if (rain.visible) {
      const count = Math.floor(drops * a.rain);
      rainGeo.setDrawRange(0, count * 2);
      for (let i = 0; i < count; i++) {
        const seed = rainSeeds[i],
          x = ((seed * 397.1) % 1) * 34 - 17,
          z = ((seed * 723.3) % 1) * 32 - 16,
          y = 14 - ((time * (9 + a.rain * 7) + seed * 20) % 15),
          idx = i * 6;
        rainPositions[idx] = x;
        rainPositions[idx + 1] = y;
        rainPositions[idx + 2] = z;
        rainPositions[idx + 3] = x - a.wind * 0.12;
        rainPositions[idx + 4] = y - 0.4 - a.rain * 0.25;
        rainPositions[idx + 5] = z - 0.08;
      }
      rainGeo.attributes.position.needsUpdate = true;
    }
    cloudShadowMat.opacity = a.cloud * 0.035 * (1 - a.night);
    cloudShadow.position.x = Math.sin(time * 0.015) * 8;
    cloudShadow.position.z = Math.cos(time * 0.012) * 5;
    if (time - lastShadow > 0.22) {
      lastShadow = time;
      renderer.shadowMap.needsUpdate = true;
    }
    scene.updateMatrixWorld();
    positionDoor();
    const chosen = selected && objectRoots[current].get(selected);
    selectionBox.visible = !!chosen;
    if (chosen) {
      selectionBox.box.setFromObject(chosen);
      selectionBox.updateMatrixWorld(true);
    }
    renderer.render(scene, camera);
  }
  const raycaster = new T.Raycaster(),
    ndc = new T.Vector2(),
    floorPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  const selectionBox = new T.Box3Helper(new T.Box3(), 0xd6c38b);
  scene.add(selectionBox);
  selectionBox.visible = false;
  let wardrobeKey = JSON.stringify(wardrobe),
    lastSize = "";
  function resizeIfNeeded() {
    const key = canvas.clientWidth + ":" + canvas.clientHeight + ":" + current;
    if (lastSize !== key) {
      lastSize = key;
      resize();
    }
  }
  function ray(x, y) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((x - rect.left) / rect.width) * 2 - 1,
      1 - ((y - rect.top) / rect.height) * 2,
    );
    raycaster.setFromCamera(ndc, camera);
  }
  function groundPoint(x, y) {
    ray(x, y);
    const v = new T.Vector3();
    if (!raycaster.ray.intersectPlane(floorPlane, v)) return null;
    const center =
      current === "north"
        ? [304, 272]
        : current === "room"
          ? [300, 216]
          : [284, 264];
    return { x: v.x * 16 + center[0], y: v.z * 16 + center[1] };
  }
  function pick(x, y) {
    ray(x, y);
    const hits = raycaster.intersectObjects(
      [...objectRoots[current].values()],
      true,
    );
    for (const hit of hits) {
      let n = hit.object;
      while (n && !n.userData.objectId) n = n.parent;
      if (n) return D.layout[current].find((o) => o.id === n.userData.objectId);
    }
    return null;
  }
  function projectObject(id) {
    const root = objectRoots[current].get(id);
    if (!root) return null;
    const rect = canvas.getBoundingClientRect();
    const b = new T.Box3().setFromObject(root),
      v = b.getCenter(new T.Vector3()).project(camera);
    return {
      clientX: rect.left + (v.x * 0.5 + 0.5) * rect.width,
      clientY: rect.top + (0.5 - v.y * 0.5) * rect.height,
    };
  }
  function updateWardrobe() {
    const key = JSON.stringify(wardrobe);
    if (key === wardrobeKey) return;
    wardrobeKey = key;
    for (const name of Object.keys(groups)) {
      release(actors[name].person);
      release(actors[name].pig);
      resident(groups[name], name);
      pig(groups[name], name);
    }
    compileInstances();
    renderer.shadowMap.needsUpdate = true;
  }
  const spriteCache = new Map(),
    catalogInfo = new Map();
  function thumbnail(o, output) {
    const a = asset(o.type),
      key = JSON.stringify([
        o.type,
        o.pot,
        o.seed || 1835,
        output.width,
        output.height,
      ]);
    if (spriteCache.has(key)) {
      output.getContext("2d").drawImage(spriteCache.get(key), 0, 0);
      return;
    }
    const stage = new T.Scene(),
      g = group(stage);
    g.userData.animated = true;
    const start = batches.length;
    (a.plant ? makePlant : makeObject)(g, { ...o, rotation: 0, scale: 1 });
    compileInstances();
    stage.add(new T.HemisphereLight("#eee8d6", "#78846d", 2));
    const light = new T.DirectionalLight("#f4e7c6", 1.2);
    light.position.set(-5, 8, 5);
    stage.add(light);
    const bounds = new T.Box3().setFromObject(g),
      size = bounds.getSize(new T.Vector3()),
      center = bounds.getCenter(new T.Vector3());
    catalogInfo.set(o.type, {
      type: o.type,
      extent: [size.x, size.y, size.z],
      instances: batches.slice(start).reduce((n, b) => n + b.count, 0),
      sourceCount:
        a.plant?.sources?.length ||
        a.weapon?.sources?.length ||
        a.sources?.length ||
        0,
    });
    const span = Math.max(size.x, size.z, size.y) * 1.18,
      cam = new T.OrthographicCamera(
        -span / 2,
        span / 2,
        span / 2,
        -span / 2,
        0.1,
        50,
      );
    cam.position.copy(center).add(new T.Vector3(4, 6, 8));
    cam.lookAt(center);
    const oldColor = renderer.getClearColor(new T.Color()).clone(),
      oldAlpha = renderer.getClearAlpha();
    const target = new T.WebGLRenderTarget(output.width, output.height, {
      minFilter: T.NearestFilter,
      magFilter: T.NearestFilter,
    });
    target.texture.colorSpace = T.SRGBColorSpace;
    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    renderer.setClearColor(0, 0);
    renderer.render(stage, cam);
    const pixels = new Uint8Array(output.width * output.height * 4);
    renderer.readRenderTargetPixels(
      target,
      0,
      0,
      output.width,
      output.height,
      pixels,
    );
    const copy = document.createElement("canvas");
    copy.width = output.width;
    copy.height = output.height;
    const image = copy
        .getContext("2d")
        .createImageData(output.width, output.height),
      row = output.width * 4;
    for (let y = 0; y < output.height; y++)
      image.data.set(
        pixels.subarray(
          (output.height - 1 - y) * row,
          (output.height - y) * row,
        ),
        y * row,
      );
    copy.getContext("2d").putImageData(image, 0, 0);
    spriteCache.set(key, copy);
    output.getContext("2d").drawImage(copy, 0, 0);
    renderer.setRenderTarget(previous);
    target.dispose();
    release(g);
    batches.length = Math.min(start, batches.length);
    renderer.setClearColor(oldColor, oldAlpha);
    return copy;
  }
  reset(options.scene || "north");
  return {
    setScene: reset,
    syncLayout,
    resize,
    groundPoint,
    pick,
    projectObject,
    thumbnail,
    catalogModel(type) {
      if (!catalogInfo.has(type)) {
        const output = document.createElement("canvas");
        output.width = output.height = 32;
        thumbnail({ type, seed: 1835 }, output);
      }
      return catalogInfo.get(type);
    },
    get gesturing() {
      return pointers.size > 1;
    },
    draw,
    get stats() {
      return {
        scene: current,
        view: { ...view },
        wanted: { ...wanted },
        pixels: 1.2,
        controls,
        selectedModel: options.selected?.() || null,
        wardrobe: { ...wardrobe },
        modelIds: [...objectRoots[current].keys()],
        catalog: ASSETS.length,
        objects: D.layout[current].length,
        instances: batches.reduce((n, b) => n + b.count, 0),
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        groundY,
        storeys: 6,
        buffer: [canvas.width, canvas.height],
      };
    },
  };
}
