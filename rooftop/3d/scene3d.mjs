import { SCENES, paintBase } from "../scene.mjs";
import { PLANTS, POTS } from "../botany.mjs";
import { plantContact } from "../plant-art.mjs";
import { OUTFITS, DECORATIONS, wardrobe } from "../wardrobe.mjs";

// This renderer consumes the same initial layout and botanical palette as the 2D game.
// Only the canvas changes; the observer's cards, clock, weather and residents are shared.
export function createGardenRenderer(canvas, layout, doorButton) {
  const T = window.THREE;
  if (!T) throw new Error("Three.js 未能加载");
  const D = {
    plants: PLANTS,
    pots: POTS,
    layout: {
      north: layout.scenes.north.map(withContact),
      south: layout.scenes.south.map(withContact),
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
    alpha: false,
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
      if (kind === "leaf")
        m.onBeforeCompile = (shader) => {
          shader.uniforms.leafTime = windTime;
          shader.uniforms.leafWind = windPower;
          shader.vertexShader =
            "uniform float leafTime; uniform float leafWind;\n" +
            shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x += sin(leafTime * 1.8 + instanceMatrix[3].x * 1.5 + instanceMatrix[3].z) * leafWind * .18 * max(0.0, instanceMatrix[3].y - .3);\n#endif",
          );
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
      m: mat(c, isFoliage(g) ? "leaf" : kind),
      geo: cube,
      rx,
      ry,
      rz,
    });
  }
  function cyl(g, x, y, z, rt, rb, h, c, n = 12) {
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
      m: mat(c),
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
  function pot(g, id, r = 0.46, h = 0.38) {
    const p = pots.get(id) || {
      color: "#8d6045",
      rim: "#b08158",
      shape: "round",
    };
    if (["box", "basket", "bag"].includes(p.shape)) {
      box(g, 0, h / 2, 0, r * 1.9, h, r * 1.5, p.color, "clay");
      box(g, 0, h - 0.025, 0, r * 2.02, 0.1, r * 1.62, p.rim);
      box(g, 0, h + 0.029, 0, r * 1.7, 0.045, r * 1.29, P.soil);
      if (p.shape === "box") {
        for (const x of [-r * 0.98, r * 0.98])
          box(g, x, h * 0.5, 0, 0.07, h * 0.65, r * 1.45, p.rim);
      }
    } else {
      const shallow = ["shallow", "oval"].includes(p.shape);
      h *= shallow ? 0.62 : 1;
      cyl(g, 0, h / 2, 0, r * 0.98, r * 0.72, h, p.color, 16);
      for (let j = 0; j < 8; j++) {
        const a = (j * Math.PI) / 4;
        box(
          g,
          Math.sin(a) * r * 0.86,
          h * 0.56,
          Math.cos(a) * r * 0.86,
          0.045,
          h * 0.4,
          0.025,
          shade(p.color, j % 2 ? 1.07 : 0.93),
          "plain",
          0,
          a,
          0,
        );
      }
      cyl(g, 0, h - 0.035, 0, r * 1.09, r * 1.09, 0.13, p.rim);
      cyl(g, 0, h + 0.035, 0, r * 0.91, r * 0.91, 0.04, P.soil);
      cyl(g, 0, 0.035, 0, r * 0.76, r * 0.78, 0.08, shade(p.color, 0.77));
      if (id === "imari" || id === "arita" || id === "mino" || id === "tobe") {
        for (let i = 0; i < 12; i++) {
          let a = (i * Math.PI) / 6;
          box(
            g,
            Math.sin(a) * r * 0.95,
            h * 0.56,
            Math.cos(a) * r * 0.95,
            0.09,
            0.14,
            0.07,
            "#577687",
            "plain",
            0,
            a,
            0,
          );
        }
      }
    }
    return h;
  }
  function makePlant(parent, o) {
    const p = plants.get(o.type),
      g = group(parent),
      r = rng(o.seed || 1835),
      form = p.form || "herb",
      color = p.leaf || "#72815a",
      flower = p.flower || "#bcb09b";
    const big = o.type === "barrel";
    const radius = big ? 0.67 : Math.min(0.65, (p.w || 24) / 64 + 0.07);
    let height = pot(g, o.pot || p.defaultPot, radius, big ? 0.5 : 0.38);
    const fol = group(g, 0, height, 0);
    fol.userData.foliage = true;
    g.scale.setScalar(o.scale * (big ? 1.15 : 1.38));
    const cactus =
      /barrel|column|pads|cluster|exp-(star|flatstar|ribbed|woolball|redcolumn|chin|chinflower|smooth|bluebarrel|goldcolumn|offsets|hooked|haircolumn|thimbles|peanuts|multicost|wavy)/.test(
        form,
      );
    if (form === "exp-stones" || form === "exp-splitrock") {
      for (const x of [-0.22, 0.22]) {
        ellipsoid(
          fol,
          x,
          0.22,
          0,
          0.27,
          0.22,
          0.32,
          color,
          0.08,
          o.seed + x * 100,
        );
        box(fol, x, 0.44, 0, 0.25, 0.03, 0.3, shade(color, 1.15));
        for (let k = 0; k < 8; k++)
          box(
            fol,
            x + (r() - 0.5) * 0.25,
            0.461,
            (r() - 0.5) * 0.24,
            0.03,
            0.02,
            0.035,
            shade(color, 0.68),
          );
      }
      box(fol, 0, 0.3, 0, 0.025, 0.3, 0.35, shade(color, 0.55));
    } else if (form === "pads") {
      ellipsoid(fol, 0, 0.3, 0, 0.23, 0.3, 0.11, color, 0.08, o.seed);
      for (const x of [-0.23, 0.23]) {
        ellipsoid(fol, x, 0.78, 0, 0.25, 0.4, 0.1, color, 0.08, o.seed + 2);
        for (let j = 0; j < 7; j++)
          box(
            fol,
            x + (r() - 0.5) * 0.33,
            0.5 + r() * 0.54,
            0.115,
            0.04,
            0.035,
            0.03,
            "#d4cda7",
          );
      }
    } else if (form === "exp-scales") {
      for (let k = 0; k < 7; k++) {
        const a = k * 2.4,
          h = 0.65 + r() * 0.65;
        for (let j = 0; j < h / 0.09; j++) {
          const yy = j * 0.09;
          box(
            fol,
            Math.cos(a) * (0.13 + yy * 0.13),
            yy,
            Math.sin(a) * (0.13 + yy * 0.13),
            0.13,
            0.08,
            0.13,
            j % 3 ? color : shade(color, 1.15),
          );
        }
      }
    } else if (form === "oxalis") {
      for (let k = 0; k < 7; k++) {
        const a = k * 2.4,
          x = Math.cos(a) * 0.43,
          z = Math.sin(a) * 0.43,
          yy = 0.45 + r() * 0.35;
        beam(fol, [0, 0, 0], [x, yy, z], 0.035, shade(color, 0.7));
        for (let j = 0; j < 3; j++) {
          const aa = j * 2.094 + a;
          leaf(
            fol,
            [x, yy, z],
            [x + Math.cos(aa) * 0.26, yy + 0.03, z + Math.sin(aa) * 0.26],
            0.2,
            color,
          );
        }
      }
    } else if (form === "exp-felt") {
      for (let k = 0; k < 5; k++) {
        const a = k * 2.4,
          yy = 0.45 + k * 0.13;
        beam(
          fol,
          [0, 0, 0],
          [Math.cos(a) * 0.2, yy, Math.sin(a) * 0.2],
          0.07,
          "#75806b",
        );
        leaf(
          fol,
          [0, yy - 0.12, 0],
          [Math.cos(a) * 0.55, yy + 0.14, Math.sin(a) * 0.55],
          0.27,
          color,
        );
        box(
          fol,
          Math.cos(a) * 0.53,
          yy + 0.14,
          Math.sin(a) * 0.53,
          0.1,
          0.08,
          0.08,
          "#7d7161",
        );
      }
    } else if (cactus) {
      const isTall = /column/.test(form),
        isCluster = /cluster|offsets|thimbles|peanuts/.test(form);
      let count = isCluster ? 5 : 1;
      for (let k = 0; k < count; k++) {
        const a = k * 2.4,
          cx = count > 1 ? Math.cos(a) * 0.32 : 0,
          cz = count > 1 ? Math.sin(a) * 0.3 : 0,
          cr = count > 1 ? 0.27 : big ? 0.74 : 0.43,
          cy = isTall ? 0.76 : cr;
        ellipsoid(
          fol,
          cx,
          cy,
          cz,
          cr,
          cy,
          cr,
          color,
          big ? 0.125 : 0.1,
          123 + k,
        );
        for (let i = 0; i < 12; i++) {
          const theta = (i * Math.PI) / 6;
          for (let j = 0; j < 5; j++) {
            const yy = 0.12 + j * ((cy * 1.75) / 5),
              rr = cr * Math.sqrt(Math.max(0, 1 - ((yy - cy) / cy) ** 2));
            box(
              fol,
              cx + Math.sin(theta) * rr,
              yy,
              cz + Math.cos(theta) * rr,
              0.045,
              0.065,
              0.045,
              i % 3 === 0 ? "#e0d3a0" : "#b3b685",
            );
          }
        }
        if (form.includes("flower")) bloom(fol, cx, cy * 2 + 0.1, cz, flower);
      }
      if (form === "pads") {
        for (let k = 0; k < 3; k++)
          ellipsoid(
            fol,
            (k - 1) * 0.35,
            0.55 + Math.abs(k - 1) * 0.48,
            0,
            0.26,
            0.4,
            0.13,
            color,
            0.09,
            424 + k,
          );
      }
    } else if (
      /rosette|swords|spikes|agave|zebra|exp-(triangle|ridged|pointed|powder|velvet|paws|crinkle|fan|paddles|windows|jaws)|lettuce/.test(
        form,
      )
    ) {
      const count = /swords|spikes|agave/.test(form) ? 11 : 16;
      for (let k = 0; k < count; k++) {
        const a = k * 2.4,
          len = 0.5 + r() * 0.45,
          outer = k % 2 === 0;
        leaf(
          fol,
          [0, 0.07, 0],
          [
            Math.cos(a) * len,
            (outer ? 0.28 : 0.55) + r() * 0.22,
            Math.sin(a) * len,
          ],
          0.22,
          color,
        );
        if (/zebra|ridged|jaws/.test(form))
          for (let j = 2; j < 7; j++) {
            const t = j / 7;
            box(
              fol,
              Math.cos(a) * len * t,
              (outer ? 0.28 : 0.55) * t + 0.07,
              Math.sin(a) * len * t,
              0.085,
              0.025,
              0.085,
              form === "exp-jaws" ? "#c4c6a4" : "#b2c1a0",
            );
          }
      }
      if (form === "lettuce")
        ellipsoid(fol, 0, 0.36, 0, 0.55, 0.36, 0.55, color, 0.12, 121);
    } else if (/snake|onion|needles|spider/.test(form)) {
      for (let k = 0; k < 14; k++) {
        const a = k * 2.4,
          tall = form === "snake" ? 1.3 : form === "onion" ? 0.85 : 1;
        leaf(
          fol,
          [Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15],
          [
            Math.cos(a) * (0.35 + r() * 0.45),
            tall * (0.6 + r() * 0.4),
            Math.sin(a) * (0.35 + r() * 0.45),
          ],
          form === "snake" ? 0.18 : 0.09,
          color,
        );
      }
    } else if (form === "exp-feather") {
      for (let k = 0; k < 38; k++) {
        const a = r() * 6.28,
          rad = Math.sqrt(r()) * 0.59,
          xx = Math.cos(a) * rad,
          zz = Math.sin(a) * rad;
        box(fol, xx, 0.08, zz, 0.15, 0.12, 0.14, color);
        for (let j = 0; j < 3; j++)
          box(
            fol,
            xx + 0.07 * j,
            0.13 + 0.026 * j,
            zz,
            0.08,
            0.035,
            0.16,
            j % 2 ? shade(color, 1.15) : color,
          );
      }
    } else if (/fern|parsley/.test(form)) {
      for (let k = 0; k < 9; k++) {
        const a = k * 2.4,
          rad = 0.6 + r() * 0.32,
          tip = [Math.cos(a) * rad, 0.25 + r() * 0.75, Math.sin(a) * rad];
        leaf(fol, [0, 0, 0], tip, 0.06, shade(color, 0.8));
        for (let j = 1; j < 7; j++) {
          const t = j / 7,
            c = [tip[0] * t, tip[1] * t + 0.12, tip[2] * t],
            size = 0.21 * Math.sin(Math.PI * t);
          for (const s of [-1, 1])
            leaf(
              fol,
              c,
              [
                c[0] + Math.sin(a) * size * s,
                c[1] + 0.04,
                c[2] - Math.cos(a) * size * s,
              ],
              0.085,
              j % 2 ? color : shade(color, 1.15),
            );
        }
      }
    } else if (form === "beads") {
      for (let k = 0; k < 10; k++) {
        const a = k * 2.4,
          xx = Math.cos(a) * 0.35,
          zz = Math.sin(a) * 0.35;
        for (let j = 0; j < 5; j++) {
          const yy = j * 0.11;
          box(
            fol,
            xx,
            yy,
            zz,
            0.15,
            0.13,
            0.16,
            j % 2 ? color : shade(color, 1.12),
          );
        }
      }
    } else if (/tails|ivy|beadtail|threads|segments|fishbone/.test(form)) {
      for (let k = 0; k < 7; k++) {
        const a = k * 2.4,
          len = 1 + r() * 0.8;
        for (let j = 0; j < 10; j++) {
          const t = j / 10,
            x = Math.cos(a) * (0.15 + Math.sin(t * 2) * 0.55),
            z = Math.sin(a) * (0.15 + Math.sin(t * 2) * 0.55),
            y = 0.3 + Math.sin(t * 3) * 0.15 - t * len;
          box(
            fol,
            x,
            y,
            z,
            0.17,
            0.16,
            0.16,
            j % 3 === 0 ? shade(color, 1.15) : color,
          );
        }
      }
    } else if (
      /moss|tiny|exp-(cushion|stars|redstars|silver|hairpoints|bent|sphagnum|two-row)/.test(
        form,
      )
    ) {
      for (let k = 0; k < 35; k++) {
        const a = r() * 6.28,
          rad = Math.sqrt(r()) * 0.58;
        box(
          fol,
          Math.cos(a) * rad,
          0.08 + r() * 0.13,
          Math.sin(a) * rad,
          0.15,
          0.12,
          0.15,
          k % 4 ? color : shade(color, 1.17),
        );
      }
    } else {
      const broad = /split|hosta|round|hydrangea/.test(form),
        height = /jade|berries|rose|bougainvillea|exp-tree|tomato/.test(form)
          ? 1.2
          : 0.75;
      for (let k = 0; k < 9; k++) {
        const a = k * 2.4,
          rad = 0.35 + r() * 0.4,
          yy = 0.3 + r() * height;
        const tip = [Math.cos(a) * rad, yy, Math.sin(a) * rad];
        beam(fol, [0, 0, 0], tip, 0.05, shade(color, 0.68));
        if (broad) {
          leaf(fol, [tip[0] * 0.4, yy * 0.7, tip[2] * 0.4], tip, 0.34, color);
        } else {
          ellipsoid(fol, ...tip, 0.18, 0.16, 0.18, color, 0.09, 312 + k);
        }
        if (
          /flower|trumpet|marigold|daisy|cosmos|pansy|rose|camellia|round|bougainvillea|kalanchoe|fuchsia|gardenia|jasmine/.test(
            form,
          ) &&
          k % 2 === 0
        )
          bloom(fol, tip[0], tip[1] + 0.16, tip[2], flower);
        if (/berries|tomato|strawberry/.test(form) && k % 3 === 0) {
          box(
            fol,
            tip[0] + 0.1,
            tip[1] - 0.1,
            tip[2],
            0.13,
            0.14,
            0.12,
            flower,
          );
          box(
            fol,
            tip[0] - 0.03,
            tip[1] - 0.13,
            tip[2] + 0.12,
            0.12,
            0.13,
            0.11,
            flower,
          );
        }
        if (/coleus/.test(form)) {
          leaf(fol, [tip[0] * 0.6, yy * 0.8, tip[2] * 0.6], tip, 0.2, flower);
        }
        if (/herb|coleus|shiso/.test(form)) {
          leaf(fol, [0, 0.25, 0], tip, 0.24, color);
        }
      }
    }
    return g;
  }
  // Everyday objects: proportions derived from the original model footprint and height table.
  const dims = {
    shelf: [64, 32, 32],
    woodshelf: [52, 29, 34],
    tierstand: [48, 28, 38],
    ladderstand: [38, 26, 38],
    wirestand: [58, 32, 40],
    coveredstand: [52, 32, 40],
    foamstand: [46, 28, 20],
    basketstand: [28, 22, 32],
    lowplatform: [48, 28, 12],
    plantcart: [46, 28, 22],
    storagechest: [48, 29, 22],
    pottingbench: [60, 32, 28],
    bench: [40, 24, 10],
    stool: [20, 18, 12],
    bistrotable: [36, 26, 22],
    terrarium: [66, 32, 25],
    fish: [36, 28, 12],
    basin: [64, 46, 13],
    sink: [52, 42, 17],
    drying: [28, 23, 54],
  };
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
      box(
        g,
        0,
        h + 0.28,
        0,
        w * 1.1,
        0.09,
        d * 1.12,
        "#b7b8a4",
        "cloth",
        0.05,
        0,
        0,
      );
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
  function makeObject(parent, o) {
    const g = group(parent),
      type = o.type,
      dd = dims[type] || [26, 20, 18],
      w = dd[0] / 16,
      d = dd[1] / 16,
      h = dd[2] / 16;
    g.scale.setScalar(o.scale);
    g.rotation.y = (-o.rotation * Math.PI) / 180;
    if (/shelf|stand|platform|bench|stool|plantcart/.test(type))
      stand(g, w, d, h, type);
    else if (type === "basin" || type === "sink") basin(g, w, d, h, type);
    else if (type === "terrarium") terrarium(g, w, d, h);
    else if (type === "storagechest") {
      box(g, 0, h * 0.45, 0, w, h * 0.9, d, P.wood, "wood");
      for (let i = 0; i < 5; i++)
        box(
          g,
          0,
          h + 0.025,
          -d * 0.43 + i * d * 0.215,
          w * 1.02,
          0.1,
          d * 0.19,
          P.woodDark,
          "wood",
        );
      for (const x of [-w * 0.38, w * 0.38])
        box(g, x, h * 0.5, d * 0.51, 0.08, h * 0.7, 0.05, P.metalDark);
    } else if (type === "bistrotable") {
      cyl(g, 0, h - 0.03, 0, w * 0.5, w * 0.5, 0.09, P.metal, 16);
      for (let i = 0; i < 3; i++) {
        const a = i * 2.094;
        beam(
          g,
          [Math.sin(a) * w * 0.27, 0.02, Math.cos(a) * w * 0.27],
          [Math.sin(a) * w * 0.14, h, Math.cos(a) * w * 0.14],
          0.055,
          P.metalDark,
        );
      }
      box(g, 0, h, 0.2, 0.25, 0.025, 0.25, P.white);
    } else if (type === "medakabowl" || type === "pond") waterBowl(g, 1, 0.62);
    else if (type === "fish") {
      box(g, 0, 0.38, 0, w, 0.65, d, P.blue, "metal");
      box(g, 0, 0.73, 0, w * 0.87, 0.03, d * 0.82, "#86a69c");
      for (let i = 0; i < 4; i++)
        box(
          g,
          -w * 0.3 + i * w * 0.2,
          0.755,
          ((i % 2) - 0.5) * 0.3,
          0.19,
          0.04,
          0.065,
          "#d4c5a4",
        );
    } else if (type === "drying") {
      for (const x of [-0.7, 0.7]) {
        beam(g, [x, 0, -0.65], [x, 2.25, 0.55], 0.065, P.metalLight);
        beam(g, [x, 0, 0.65], [x, 2.25, -0.55], 0.065, P.metalLight);
      }
      for (let i = 0; i < 8; i++)
        box(g, 0, 2.25, -0.55 + i * 0.157, 1.55, 0.045, 0.035, P.metalLight);
      for (let i = 0; i < 6; i++)
        box(
          g,
          -0.62 + i * 0.23,
          1.1,
          -0.13,
          0.18,
          1.7,
          0.028,
          "#acb7b5",
          "cloth",
        );
    } else if (type === "watering") {
      cyl(g, 0, 0.34, 0, 0.4, 0.35, 0.65, "#7b8272");
      beam(g, [0.2, 0.2, 0], [0.76, 0.56, 0], 0.12, "#869080");
      box(g, 0.8, 0.6, 0, 0.16, 0.1, 0.16, P.metalLight);
      beam(g, [-0.32, 0.65, 0], [-0.48, 0.84, 0], 0.07, P.metal);
      beam(g, [-0.48, 0.84, 0], [0.1, 0.84, 0], 0.07, P.metal);
    } else if (type === "bucket") {
      cyl(g, 0, 0.4, 0, 0.44, 0.34, 0.74, "#758681");
      cyl(g, 0, 0.77, 0, 0.46, 0.46, 0.07, "#a7b5a7");
      cyl(g, 0, 0.795, 0, 0.39, 0.39, 0.025, "#46574f");
      beam(g, [-0.45, 0.68, 0], [-0.36, 1.04, 0], 0.045, P.metalLight);
      beam(g, [-0.36, 1.04, 0], [0.36, 1.04, 0], 0.045, P.metalLight);
      beam(g, [0.36, 1.04, 0], [0.45, 0.68, 0], 0.045, P.metalLight);
    } else if (type === "hose") {
      for (let k = 0; k < 3; k++)
        for (let i = 0; i < 32; i++) {
          const a = (i * Math.PI) / 16,
            rad = 0.57 - k * 0.11;
          box(
            g,
            Math.cos(a) * rad,
            0.06,
            Math.sin(a) * rad,
            0.13,
            0.1,
            0.13,
            "#47655b",
          );
        }
      box(g, 0.63, 0.1, 0, 0.12, 0.12, 0.36, "#819d84");
    } else if (type === "soilbag") {
      box(g, 0, 0.42, 0, 0.95, 0.8, 0.65, "#b4b8a1", "cloth");
      box(g, 0, 0.45, 0.34, 0.63, 0.37, 0.018, "#70846b");
      box(g, 0, 0.89, 0, 0.73, 0.08, 0.54, "#c6c5a9");
      box(g, 0, 0.27, 0.356, 0.35, 0.028, 0.02, "#d3cfb2");
    } else if (type === "crate" || type === "foambox") {
      const c = type === "crate" ? P.blue : P.white;
      box(g, 0, 0.05, 0, 1.65, 0.1, 1.15, c);
      for (const x of [-0.79, 0.79])
        box(g, x, 0.38, 0, 0.1, 0.68, 1.15, c, "clay");
      for (const z of [-0.52, 0.52])
        box(g, 0, 0.38, z, 1.65, 0.68, 0.1, c, "clay");
      box(
        g,
        0,
        0.6,
        0,
        1.48,
        0.035,
        0.95,
        type === "crate" ? "#647d77" : "#708460",
      );
    } else if (type === "browncover") {
      ellipsoid(g, 0, 0.23, 0, 0.45, 0.23, 0.45, "#9d8d69", 0.09, 431);
    } else if (type === "lid" || type === "strainer" || type === "pigbowl") {
      cyl(
        g,
        0,
        0.09,
        0,
        0.44,
        0.38,
        0.16,
        type === "pigbowl" ? "#bdb593" : P.blue,
        12,
      );
      cyl(
        g,
        0,
        0.18,
        0,
        0.34,
        0.34,
        0.02,
        type === "pigbowl" ? "#8b7f5f" : "#819f96",
        12,
      );
    } else if (type === "towel") {
      box(g, 0, 0.035, 0, 0.8, 0.05, 0.5, "#b8bba9", "cloth");
      for (let i = 0; i < 6; i++)
        box(g, -0.35 + i * 0.14, 0.07, 0, 0.045, 0.035, 0.5, "#99a3a0");
    } else if (type === "brush" || type === "tools") {
      box(g, 0, 0.06, 0, 0.08, 0.09, 1.05, "#8f7a59", "wood");
      box(g, 0, 0.11, 0.48, 0.37, 0.16, 0.24, "#a99975");
      if (type === "tools") box(g, 0.32, 0.06, 0, 0.07, 0.08, 0.9, "#967652");
    } else if (type === "sprayer") {
      cyl(g, 0, 0.35, 0, 0.22, 0.24, 0.58, "#a5b7a5", 8);
      box(g, 0, 0.68, 0, 0.31, 0.14, 0.16, P.blue);
      box(g, 0.17, 0.71, 0, 0.23, 0.07, 0.11, P.white);
    } else if (type === "thermometer") {
      box(g, 0, 0.86, 0, 0.36, 1.6, 0.12, P.white);
      box(g, -0.04, 0.94, 0.075, 0.04, 1.18, 0.025, P.blueDark);
      for (let i = 0; i < 9; i++)
        box(g, 0.06, 0.4 + i * 0.12, 0.08, 0.1, 0.02, 0.015, "#7c8775");
    } else if (type === "teaset") {
      cyl(g, 0, 0.14, 0, 0.23, 0.24, 0.26, P.white, 10);
      box(g, 0.25, 0.18, 0, 0.13, 0.08, 0.12, P.white);
      for (const x of [-0.4, 0.4])
        cyl(g, x, 0.1, 0.14, 0.1, 0.1, 0.16, P.white, 8);
    } else if (type === "gloves") {
      for (const x of [-0.18, 0.18]) {
        box(g, x, 0.07, 0, 0.2, 0.13, 0.35, "#bcb693", "cloth");
        for (let i = 0; i < 3; i++)
          box(
            g,
            x - 0.075 + i * 0.065,
            0.06,
            0.24,
            0.045,
            0.09,
            0.2,
            "#bcb693",
          );
      }
    } else if (type === "labels") {
      for (let i = 0; i < 4; i++) {
        box(g, -0.25 + i * 0.17, 0.24, 0, 0.035, 0.45, 0.03, "#aaa785");
        box(g, -0.25 + i * 0.17, 0.44, 0, 0.13, 0.18, 0.05, P.white);
      }
    } else {
      box(g, 0, h * 0.3, 0, w * 0.7, h * 0.6, d * 0.7, P.wood, "wood");
    }
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
  };
  const coords = (name, x, y) =>
    name === "north"
      ? [(x - 304) / 16, (y - 272) / 16]
      : [(x - 284) / 16, (y - 264) / 16];
  function roof(parent, name) {
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
  function resident(parent, name) {
    const g = group(parent);
    g.userData.animated = true;
    const outfit = OUTFITS[wardrobe.outfit] || OUTFITS.sage;
    box(g, 0, 1.1, 0, 0.49, 0.7, 0.32, outfit[1], "cloth");
    if (outfit[4] === "overall") {
      for (const x of [-0.17, 0.17])
        box(g, x, 0.65, 0, 0.23, 0.5, 0.28, outfit[2]);
    } else {
      box(g, 0, 0.79, 0, 0.65, 0.3, 0.4, outfit[1]);
      for (const x of [-0.28, 0.28])
        box(g, x, 0.85, 0, 0.08, 0.26, 0.38, outfit[2]);
    }
    if (/stripe|check/.test(outfit[4]))
      for (let j = 0; j < 5; j++)
        box(g, 0, 0.75 + j * 0.13, 0.205, 0.56, 0.035, 0.015, outfit[3]);
    if (/apron|pocket/.test(outfit[4]))
      box(g, 0, 1, 0.18, 0.3, 0.32, 0.03, outfit[3]);
    box(g, 0, 1.78, 0, 0.44, 0.47, 0.37, "#bba387");
    box(g, 0, 2.04, 0, 0.49, 0.16, 0.41, "#685044");
    box(g, -0.23, 1.88, 0, 0.1, 0.35, 0.4, "#4f4038");
    box(g, 0.2, 1.92, -0.08, 0.09, 0.25, 0.28, "#685044");
    for (const x of [-0.1, 0.1])
      box(g, x, 1.79, 0.195, 0.045, 0.045, 0.025, "#4c5147");
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
      const arm = group(g, x, 1.38, 0);
      arm.userData.animated = true;
      box(arm, 0, -0.18, 0, 0.14, 0.38, 0.15, "#bba387");
      box(arm, 0, -0.42, 0.01, 0.13, 0.14, 0.14, "#bba387");
      arms.push(arm);
    }
    const tool = group(g, 0.43, 0.92, 0.26);
    tool.userData.animated = true;
    tool.visible = false;
    cyl(tool, 0, 0, 0, 0.18, 0.19, 0.3, "#879480", 10);
    beam(tool, [0.15, 0, 0], [0.32, 0.13, 0], 0.045, "#99a58c");
    actors[name] = { person: g, legs, arms, tool };
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
        : wardrobe.pig.includes("cream")
          ? "#c3b994"
          : wardrobe.pig.includes("berry") || wardrobe.pig === "ribbon"
            ? "#986e7c"
            : wardrobe.pig.includes("blue") || wardrobe.pig === "scarf"
              ? "#788d9b"
              : "#778578";
      if (/cap|bonnet/.test(wardrobe.pig)) {
        box(g, 0, 0.76, 0.3, 0.4, 0.12, 0.32, col);
        box(g, 0, 0.84, 0.29, 0.25, 0.15, 0.23, col);
      } else if (wardrobe.pig.startsWith("vest")) {
        box(g, 0, 0.57, 0, 0.38, 0.14, 0.56, col);
        for (const x of [-0.18, 0.18])
          box(g, x, 0.44, 0, 0.06, 0.24, 0.56, col);
      } else if (/ribbon|flower/.test(wardrobe.pig)) {
        box(g, 0, 0.7, 0.29, 0.12, 0.13, 0.11, col);
        for (const x of [-0.13, 0.13])
          box(g, x, 0.71, 0.29, 0.14, 0.17, 0.08, col);
      } else {
        box(g, 0, 0.4, 0.21, 0.4, 0.14, 0.08, col);
        box(g, 0.08, 0.38, 0.29, 0.14, 0.16, 0.08, col);
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
  function build(name) {
    const root = group(scene);
    root.name = name;
    groups[name] = root;
    roof(root, name);
    const list = D.layout[name];
    for (const o of list) {
      const isPlant = plants.has(o.type),
        contact = isPlant ? { ...o, y: o.y + (o.contactY || 0) } : o;
      const [x, z] = coords(name, contact.x, contact.y),
        anchor = group(root, x, 0.02, z);
      if (isPlant) {
        anchor.position.y += supportHeight(contact, list);
        makePlant(anchor, o);
      } else {
        if (["teaset"].includes(o.type))
          anchor.position.y += supportHeight(o, list);
        makeObject(anchor, o);
      }
    }
    resident(root, name);
    pig(root, name);
    return root;
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
      worldMat.multiplyMatrices(p.g.matrixWorld, dummy.matrix);
      let root = p.g;
      while (root.parent && root.parent !== scene && !root.userData.animated)
        root = root.parent;
      const cast =
        root.name !== "city" &&
        !(p.geo === cube && Math.min(p.w, p.h, p.d) < 0.065);
      const key = root.uuid + "|" + p.m.uuid + "|" + p.geo.uuid + "|" + cast;
      let b = buckets.get(key);
      if (!b) {
        b = { root, m: p.m, geo: p.geo, cast, matrices: [] };
        buckets.set(key, b);
      }
      b.matrices.push(worldMat.clone());
    }
    for (const b of buckets.values()) {
      const inst = new T.InstancedMesh(b.geo, b.m, b.matrices.length);
      const inv = b.root.matrixWorld.clone().invert();
      b.matrices.forEach((m, i) =>
        inst.setMatrixAt(i, new T.Matrix4().multiplyMatrices(inv, m)),
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
  build("north");
  build("south");
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
    groups.north.visible = name === "north";
    groups.south.visible = name === "south";
    wanted.theta = name === "north" ? -0.12 : -0.25;
    wanted.phi = 1.15;
    wanted.zoom = innerWidth < 640 ? 1.06 : 1.22;
    desiredTarget.set(
      name === "north" ? 0 : -0.4,
      0.2,
      name === "north" ? -2.35 : 0,
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
    // Fixed finer pixels: 1.35 CSS pixels, independent of device pixel density.
    const w = canvas.clientWidth || innerWidth,
      h = canvas.clientHeight || innerHeight;
    renderer.setSize(Math.ceil(w / 1.35), Math.ceil(h / 1.35), false);
    const height = w < 640 ? Math.max(28, (21 * h) / w) : 27;
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
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastDistance = distance();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    const old = pointers.get(e.pointerId),
      dx = e.clientX - old.x,
      dy = e.clientY - old.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const d = distance();
      if (d && lastDistance) zoom(Math.log(d / lastDistance));
      lastDistance = d;
    } else {
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
    if (!keys.includes(e.key)) return;
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
  for (const name of ["north", "south"]) {
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
    const g = group(groups[name]);
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
    a.legs.forEach((g, i) => (g.rotation.x = (i ? -1 : 1) * walk));
    a.arms.forEach(
      (g, i) =>
        (g.rotation.x =
          person.state === "care"
            ? -0.65 + Math.sin(time * 3) * 0.08
            : (i ? 1 : -1) * walk * 0.7),
    );
    a.tool.visible = person.state === "care" && /水/.test(person.task);
    a.pig.position.y +=
      pig.state === "walk" ? Math.abs(Math.sin(time * 9)) * 0.035 : 0;
  }
  function draw({
    time,
    dt,
    atmosphere: a,
    person,
    pig,
    present,
    doorOpen,
    reduced,
  }) {
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
    hemi.intensity = 1.75 - a.lightAmount * 1.12;
    hemi.groundColor.set(a.night > 0.5 ? "#566d79" : "#9ea795");
    sun.color.set(
      a.phase === "dusk"
        ? "#ddae87"
        : a.phase === "dawn"
          ? "#d5beb0"
          : "#e8e6ca",
    );
    sun.intensity = 0.25 + a.sun * 0.9;
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
    puddles[current].m.opacity = a.wetness * 0.55;
    puddles[current].rippleMat.opacity = a.rain * 0.55;
    puddles[current].rippleList.forEach((l, i) => {
      const t = (time * 1.1 + i * 0.23) % 1;
      l.scale.setScalar(0.1 + t * 0.47);
    });
    rain.visible = a.rain > 0.01;
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
    renderer.render(scene, camera);
  }
  reset("north");
  return {
    setScene: reset,
    draw,
    get stats() {
      return {
        scene: current,
        view: { ...view },
        wanted: { ...wanted },
        pixels: 1.35,
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
