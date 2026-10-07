import { cubeContactPaint } from "./contact-paint.mjs";
import { SCENES, asset, ASSETS } from "../scene.mjs";
import { PLANTS, POTS } from "../botany.mjs";
import { plantContact } from "../plant-art.mjs";
import { buildFoliage } from "./plant-models.mjs";
import { plantPotSpec } from "./plant-pots.mjs";
import { buildVessel } from "./vessel-models.mjs";
import { buildObject, OBJECT_DIMENSIONS } from "./object-models.mjs";
import {
  PIXEL_STYLE,
  createPixelMaterials,
  paintPixels,
} from "./pixel-materials.mjs";
import { latheSurface, leafSurface, beveledBoxSurface } from "./model-surfaces.mjs";
import { buildNeighborhood } from "./neighborhood.mjs";
import { buildWashstation } from "./washstation.mjs";
import { resolveSupports, supportSurfaces, localPoint, fitsSurface, placementSpaces, groundArea, surfacePoint, contactOffset, clearPlacement, createPlacementContext } from "./spatial-layout.mjs";
import { modelRandom as rng } from "./model-random.mjs";
import { drawingBufferSize } from "./render-budget.mjs";
import { populateWater } from "./water-life.mjs";
import { OUTFITS, DECORATIONS, wardrobe } from "../wardrobe.mjs";

// This renderer consumes the same initial layout and botanical palette as the 2D game.
// Only the canvas changes; the observer's cards, clock, weather and residents are shared.
export function createGardenRenderer(canvas, layout, doorButton, options = {}) {
  const controls = options.controls || "orbit";
  const editable = controls === "edit";
  if(controls!=="none")canvas.tabIndex=0;
  if(!editable&&controls==="orbit")canvas.title="拖动转动视角，滚轮或双指缩放，方向键旋转，Home 复位";
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
  const P = PIXEL_STYLE.palette;
  const windTime = { value: 0 },
    windPower = { value: 0 };
  const style = createPixelMaterials(T, windTime, windPower);
  const materialCache = style.cache,
    texCache = style.textures,
    mat = style.mat;
  let primitives = [],
    batches = [],
    groups = {},
    doors = {},
    actors = {},
    foliage = [],
    waterAnimations = [],
    objectMotion = [];
  function shade(c, v) {
    const n = new T.Color(c);
    n.multiplyScalar(v);
    return "#" + n.getHexString();
  }
  function isFoliage(g) {
    for (let p = g; p; p = p.parent)
      if (p.userData.foliage) return p.userData.foliage;
    return false;
  }
  const cube = beveledBoxSurface(T),
    cylinderCache = new Map();
  cube.setAttribute("paintBox", new T.Float32BufferAttribute(new Array(cube.attributes.position.count).fill(1), 1));
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
      m: mat(c, kind === "plain" ? isFoliage(g) || kind : kind),
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
  const surfaceCache = new Map();
  const roundGeo = new T.SphereGeometry(1, 16, 10).toNonIndexed();
  roundGeo.computeVertexNormals();
  function surface(g, geo, x, y, z, w, h, d, color, kind = "paint") {
    primitives.push({
      g,
      x,
      y,
      z,
      w,
      h,
      d,
      color,
      m: mat(color, kind === "paint" ? isFoliage(g) || kind : kind),
      geo,
      rx: 0,
      ry: 0,
      rz: 0,
    });
  }
  function ellipsoid(g, x, y, z, rx, ry, rz, color, kind = "paint") {
    surface(
      g,
      roundGeo,
      x,
      y,
      z,
      rx,
      ry,
      rz,
      color,
      typeof kind === "string" ? kind : "paint",
    );
  }
  function profile(
    g,
    points,
    sides,
    color,
    kind = "clay",
    shape = "round",
    ribs = 0,
  ) {
    const key = JSON.stringify([points, sides, shape, ribs]);
    if (!surfaceCache.has(key))
      surfaceCache.set(key, latheSurface(T, points, sides, shape, ribs));
    surface(g, surfaceCache.get(key), 0, 0, 0, 1, 1, 1, color, kind);
  }
  function blade(g, start, end, width, color, teeth = false, fleshy = false) {
    const key = "blade:" + teeth + ":" + fleshy;
    if (!surfaceCache.has(key))
      surfaceCache.set(
        key,
        leafSurface(T, [0, 0, 0], [0, 0, 1], 1, teeth, fleshy),
      );
    const v = new T.Vector3(...end).sub(new T.Vector3(...start)),
      length = Math.max(0.001, v.length());
    const side = new T.Vector3(v.z, 0, -v.x);
    if (side.lengthSq() < 0.001) side.set(1, 0, 0);
    side.normalize();
    const normal = v.clone().cross(side).normalize(),
      leaf = group(g, ...start);
    leaf.quaternion.setFromRotationMatrix(
      new T.Matrix4().makeBasis(side, normal, v.normalize()),
    );
    leaf.scale.set(width, length, length);
    surface(
      leaf,
      surfaceCache.get(key),
      0,
      0,
      0,
      1,
      1,
      1,
      color,
      isFoliage(g) || "leaf",
    );
  }
  function cactusBody(g, x, z, radius, height, ribs, tall, color, form = "") {
    const plant = group(g, x, 0, z),
      rr = radius;
    const shell = group(plant);
    shell.scale.set(radius, height, radius);
    const points = tall
      ? [
          [0, 0],
          [0.78, 0.025],
          [1, 0.16],
          [1, 0.66],
          [0.87, 0.89],
          [0.24, 1],
          [0, 1],
        ]
      : [
          [0, 0],
          [0.57, 0.06],
          [0.94, 0.28],
          [1, 0.53],
          [0.85, 0.81],
          [0.25, 1],
          [0, 1],
        ];
    profile(
      shell,
      points,
      Math.max(6, ribs * 2),
      color,
      "cactus",
      "round",
      ribs,
    );
    // Raised areoles/thorns remain geometry; rib shading is painted into the surface.
    for (let k = 0; k < ribs; k++)
      for (let j = 1; j < 4; j++) {
        const a = (k * Math.PI * 2) / ribs,
          yy = (height * j) / 4;
        const rad =
          rr *
          (tall
            ? 1
            : Math.sqrt(
                Math.max(0.1, 1 - ((yy - height * 0.5) / (height * 0.53)) ** 2),
              ));
        const wool = /wool|hair|cluster/.test(form),
          hook = /hooked/.test(form),
          ink = hook ? "#a57357" : wool ? "#d9d7b7" : "#e0d0a3";
        box(
          plant,
          Math.cos(a) * (rad + 0.026),
          yy,
          Math.sin(a) * (rad + 0.026),
          wool ? 0.06 : 0.033,
          wool ? 0.12 : 0.044,
          0.033,
          ink,
        );
        if (k % 2 === 0 && !/star|smooth|chin/.test(form))
          beam(
            plant,
            [Math.cos(a) * rad, yy, Math.sin(a) * rad],
            [
              Math.cos(a) * (rad + 0.09),
              yy + 0.025,
              Math.sin(a) * (rad + 0.09),
            ],
            0.016,
            ink,
          );
        if (hook && k % 2 === 0)
          box(
            plant,
            Math.cos(a) * (rad + 0.09),
            yy - 0.015,
            Math.sin(a) * (rad + 0.09),
            0.025,
            0.06,
            0.025,
            ink,
          );
      }
  }
  function leaf(g, start, end, width, color) {
    blade(g, start, end, width, color);
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
    return buildVessel({ box, beam, shade, profile, group }, g, p, r, h, {
      empty,
    });
  }
  function makePlant(parent, o) {
    const p = plants.get(o.type),
      g = group(parent);
    g.userData.animated=true;
    g.scale.setScalar(o.scale * (o.type === "barrel" ? 1.15 : 1.38));
    g.rotation.y = (-o.rotation * Math.PI) / 180;
    const spec = plantPotSpec(p), radius = spec.radius;
    const height = pot(
      g,
      o.pot || p.defaultPot,
      radius,
      spec.height,
    );
    const fol = group(g, 0, height - .044, 0);
    if(spec.grit)for(let j=0;j<17;j++){const a=j*2.4,rr=radius*(.43+.32*(j%5)/5);ellipsoid(g,Math.cos(a)*rr,height-.022,Math.sin(a)*rr,.025,.013,.023,j%3?"#bdac89":"#a49780","soil");}
    fol.userData.foliage = p.family === "dry" ? "leafRigid" : "leaf";
    buildFoliage(
      { box, beam, ellipsoid, group, shade, rng, blade, cactusBody },
      fol,
      p,
      { ...o, potRadius: radius, potTop: height,
        floorAt: (xx,zz) => {
          const k=g.scale.x, a=-(o.rotation||0)*Math.PI/180;
          const floor=-(parent.position.y+height*k)/k+.09;
          const support=parent.userData.support;
          if(!support?.parent)return floor;
          const q=localPoint({x:o.x+(xx*Math.cos(a)+zz*Math.sin(a))*k*16,y:o.y+(-xx*Math.sin(a)+zz*Math.cos(a))*k*16,contactY:o.contactY||0},support.parent);
          const surface=supportSurfaces(support.parent)[support.level];
          return surface && Math.abs(q.x-(surface.x||0))<surface.w/2+.06 && Math.abs(q.z-surface.z)<surface.d/2+.06 ? -height+.10 : floor;
        }
      },
    );
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
        const surface = supportSurfaces({type})[level];
        const yy = surface.y - surface.thickness / 2, zz = surface.z, ww = surface.w;
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
    const levels = supportSurfaces({type}).filter(s=>!s.container).map(s=>s.y-(s.thickness||.11)/2);
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
    buildWashstation({ T, box, cyl, beam, group, mat, P }, g, w, d, h, type);
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

  function fishSchool(g, width, depth, level, goldfish = false) {
    populateWater({ group, ellipsoid, box, registerWater: (fish) => waterAnimations.push(fish) },
      g, { width, depth, level, goldfish, count: goldfish ? 3 : 5 });
  }
  function waterSurface(g, width, depth, level, round = false) {
    const base = mat("#749993", "water"), waterMaterial = base.clone();
    waterMaterial.onBeforeCompile = base.onBeforeCompile;
    waterMaterial.customProgramCacheKey = base.customProgramCacheKey;
    waterMaterial.transparent = true;
    waterMaterial.opacity = .56;
    waterMaterial.depthWrite = false;
    const geometry = round ? new T.CircleGeometry(.5, 16) : new T.PlaneGeometry(1, 1);
    const water = new T.Mesh(geometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.scale.set(width, depth, 1);
    water.position.y = level;
    g.add(water);
  }
  function waterBowl(g, r, h, type = "pond") {
    const ceramic = type === "medakabowl", enamel = type === "goldfishbowl";
    const color = ceramic ? "#92795a" : enamel ? P.white : P.blue;
    const kind = ceramic ? "clay" : enamel ? "enamel" : "metal";
    profile(g, [
      [.02, 0], [.65, 0], [.84, .18], [1, .80], [1.025, 1],
      [.90, 1], [.88, .83], [.72, .19], [.02, .19], [.02, 0],
    ].map(([rr, y]) => [rr * r, y * h]), 16, color, kind);
    const lip = group(g, 0, h, 0);
    profile(lip, [[r*.9, -.018], [r*1.035, -.018], [r*1.035, .035],
      [r*.9, .035], [r*.9, -.018]], 16, enamel ? P.blueDark : shade(color, 1.12), kind);
    cyl(g, 0, h*.18, 0, r*.71, r*.71, .02, ceramic ? "#766d52" : P.blueDark, 16);
    const level = h*.80;
    fishSchool(g, r*1.65, r*1.65, level, enamel);
    waterSurface(g, r*1.75, r*1.75, level, true);
    for (const [x, z, length] of [[-.23, -.32, .25], [.22, .19, .16]])
      box(g, r*x, level+.006, r*z, r*length, .008, .025, "#b3c0ae", "water");
    if (ceramic) for (let j=0;j<3;j++) {
      const pad = group(g, r*.40, level+.012, (j-1)*r*.18);
      cyl(pad, 0, 0, 0, .09, .09, .01, "#7b9470", 8);
    }
  }
  function modelApi() {
    return {
      T,
      box,
      cyl,
      beam,
      group,
      ellipsoid,
      surface,
      profile,
      shade,
      P,
      stand,
      basin,
      terrarium,
      waterBowl,
      fishSchool,
      waterSurface,
      registerMotion:(g,kind)=>{g.userData.animated=true;objectMotion.push({g,kind});},
      makePot: pot,
    };
  }
  function makeObject(parent, o) {
    const g = group(parent);
    g.userData.animated=true;
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
    const ctx = c.getContext("2d"),
      tile = document.createElement("canvas");
    tile.width = tile.height = 64;
    paintPixels(tile.getContext("2d"), "wall", "#c8c3b2");
    for (let y = 0; y < 520; y += 64)
      for (let x = 0; x < 640; x += 64) ctx.drawImage(tile, x, y);
    for (let y = 0; y < 520; y += 16) {
      ctx.fillStyle = "#8f9187";
      ctx.fillRect(0, y, 640, 1);
      ctx.fillStyle = "#d3d0bc";
      ctx.fillRect(0, y + 1, 640, 1);
    }
    for (let x = 0; x < 640; x += 16) {
      ctx.fillStyle = "#95988a";
      ctx.fillRect(x, 0, 1, 520);
    }
    // Low-frequency worn paving and corner cracks; no white-noise flecks.
    for (const [x, y] of [
      [180, 194],
      [268, 180],
      [350, 276],
      [210, 310],
      [422, 292],
      [368, 362],
    ]) {
      ctx.fillStyle = "#adaf9d";
      ctx.fillRect(x, y, 10, 3);
      ctx.fillRect(x + 3, y - 2, 5, 7);
      ctx.fillStyle = "#858e7f";
      ctx.fillRect(x + 12, y + 5, 5, 1);
      ctx.fillRect(x + 16, y + 6, 1, 3);
      ctx.fillRect(x + 17, y + 8, 4, 1);
    }
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
    const slab = new T.Mesh(geo, mat("#c1bfb0", "wall"));
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
      if (len > 5)
        for (const k of [0.55, len - 0.55]) {
          const xx = a[0] + ((b[0] - a[0]) * k) / len + outward.x * 0.17;
          const zz = a[1] + ((b[1] - a[1]) * k) / len + outward.y * 0.17;
          box(parent, xx, -8.85, zz, 0.08, 18.3, 0.08, "#879b94", "metal");
          for (let y = -1.2; y > -18; y -= 3)
            box(parent, xx, y, zz, 0.16, 0.05, 0.16, "#b1bbae", "metal");
        }
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
    box(hinge, 0.51, 1.25, 0, 1.02, 2.5, 0.16, "#455962", "metal");
    box(hinge, 0.51, 1.27, 0.094, 0.86, 2.27, 0.025, "#ffffff", "panel-door");
    for (const xx of [0.035, 0.985])
      box(hinge, xx, 1.25, 0.09, 0.045, 2.4, 0.025, "#7c8e8f", "metal");
    box(hinge, 0.81, 1.19, 0.139, 0.055, 0.17, 0.045, "#b4baac", "metal");
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
  const objectRoots = { north: new Map(), south: new Map(), room: new Map() };
  let modelBuilds=0;
  const supportCache = new WeakMap();
  function relationsFor(list) {
    if(!supportCache.has(list))supportCache.set(list,resolveSupports(list));
    return supportCache.get(list);
  }
  function objectPosition(name, o, list) {
    const contact = plants.has(o.type) ? withContact(o) : o;
    const [x,z] = coords(name,o.x,o.y+(contact.contactY||0));
    const placement=relationsFor(list).get(o.id);
    return new T.Vector3(x,(placement?.height||0)+.02,z);
  }
  function geometrySignature(o,list) {
    const shape=[o.type,o.pot,o.seed];
    // Hanging foliage is clipped against the actual floor and shelf edge. Its
    // clipping envelope changes geometry; ordinary transforms never do.
    if(/tails|ivy|exp-(beadtail|threads|segments|fishbone)/.test(plants.get(o.type)?.form||'')) {
      const relation=relationsFor(list).get(o.id),parent=list.find(p=>p.id===relation?.parentId),q=parent&&localPoint(o,parent);
      shape.push(((relation?.height||0)+.02)/o.scale,parent?.type,parent?.scale,relation?.surfaceId,q?.x,q?.z,((o.rotation||0)-(parent?.rotation||0)+360)%360);
    }
    return JSON.stringify(shape);
  }
  function modelPlacement(name,anchor,o,list) {
    anchor.position.copy(objectPosition(name,o,list));
    const placement=relationsFor(list).get(o.id);
    anchor.userData.support=placement?.parentId?{...placement,parent:list.find(p=>p.id===placement.parentId)}:null;
    anchor.userData.model.scale.setScalar(o.scale*(plants.has(o.type)?(o.type==='barrel'?1.15:1.38):1));
    anchor.userData.model.rotation.y=-(o.rotation||0)*Math.PI/180;
  }
  function addModel(name, o, list) {
    const anchor = group(groups[name]);
    anchor.position.copy(objectPosition(name, o, list));
    anchor.userData.animated = true;
    anchor.userData.objectId = o.id;
    anchor.userData.signature = geometrySignature(o,list);
    const placement=supportCache.get(list)?.get(o.id);
    anchor.userData.support=placement?.parentId ? {...placement,parent:list.find(p=>p.id===placement.parentId)} : null;
    anchor.userData.model=(plants.has(o.type) ? makePlant : makeObject)(anchor, o);
    modelBuilds++;
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
    const owned = new Set(), disposable = new Set();
    root.traverse((n) => {
      if (n.isInstancedMesh) {
        owned.add(n);
        n.dispose();
        if(n.geometry.userData.transient)disposable.add(n.geometry);
      } else if (n.isMesh) {
        n.geometry?.dispose();
        if (![...materialCache.values()].includes(n.material))
          n.material?.dispose();
      }
    });
    batches = batches.filter((b) => !owned.has(b));
    for(const geometry of disposable) if(!batches.some(b=>b.geometry===geometry))geometry.dispose();
    objectMotion = objectMotion.filter(f=>{for(let p=f.g;p;p=p.parent)if(p===root)return false;return true;});
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
        const signature = geometrySignature(o,list);
        let root = roots.get(o.id);
        if (root && root.userData.signature !== signature) {
          release(root);
          roots.delete(o.id);
          root = null;
        }
        if (!root) root = addModel(name, o, list);
        modelPlacement(name,root,o,list);
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
  // Batch the painted surfaces and structural pieces without duplicating draw calls.
  function compileInstances() {
    scene.updateMatrixWorld(true);
    const buckets = new Map(),
      contactGroups = new Map(),
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
      p.matrix = worldMat.clone();
      if(!contactGroups.has(root)) contactGroups.set(root, []);
      contactGroups.get(root).push(p);
      const cast =
        root.name !== "city" &&
        !(p.geo === cube && Math.min(p.w, p.h, p.d) < 0.065);
      const m = p.m.userData.window
        ? p.m
        : mat("#ffffff", p.m.userData.kind || "plain");
      const key = root.uuid + "|" + m.uuid + "|" + p.geo.uuid + "|" + cast;
      let b = buckets.get(key);
      if (!b) {
        b = { root, m, geo: p.geo, cast, matrices: [], colors: [], parts: [] };
        buckets.set(key, b);
      }
      b.parts.push(p);
      b.matrices.push(worldMat.clone());
      b.colors.push(p.m.userData.window ? "#ffffff" : p.color);
    }
    const contacts = new Map();
    for (const [root, parts] of contactGroups) if(root.name!=="city") for(const [p,mask] of cubeContactPaint(T,parts,cube)) contacts.set(p,mask);
    for (const b of buckets.values()) {
      const geo=b.geo===cube ? cube.clone() : b.geo;
      if(b.geo===cube) {
        geo.userData.transient=true;
        geo.setAttribute("paintShadePositive",new T.InstancedBufferAttribute(new Float32Array(b.parts.flatMap(p=>contacts.get(p)?.positive||[0,0,0])),3));
        geo.setAttribute("paintShadeNegative",new T.InstancedBufferAttribute(new Float32Array(b.parts.flatMap(p=>contacts.get(p)?.negative||[0,0,0])),3));
      }
      const inst = new T.InstancedMesh(geo, b.m, b.matrices.length);
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
    box(g, 0, 0, 0, w + 0.18, h + 0.2, 0.12, "#a7aca1", "metal");
    const color = [
      "#a1aaa0",
      "#829697",
      "#b1b5a4",
      "#849792",
      "#99aaa6",
      "#b1b4a1",
      "#a2ada1",
    ][variant % 7];
    const m = mat(color, "panel-glass");
    m.userData.window = true;
    if (!windowMats.includes(m)) windowMats.push(m);
    box(g, 0, 0, 0.07, w, h, 0.038, color, "panel-glass");
    box(g, 0, 0, 0.106, 0.05, h + 0.06, 0.042, "#d1d2bf", "metal");
    box(g, 0, -h * 0.13, 0.107, w, 0.04, 0.04, "#c9cebd", "metal");
    for (const sx of [-1, 1])
      box(
        g,
        sx * (w * 0.5 + 0.032),
        0,
        0.073,
        0.06,
        h + 0.11,
        0.04,
        "#d2d0bc",
        "metal",
      );
    box(g, 0, -h / 2 - 0.1, 0.13, w + 0.29, 0.16, 0.32, "#c3c2af", "wall");
    box(g, 0, h / 2 + 0.09, 0.045, w + 0.22, 0.1, 0.18, "#d1ceb9", "wall");
    if (variant % 4 === 0) {
      box(
        g,
        w * 0.5 + 0.41,
        -h * 0.31,
        0.14,
        0.66,
        0.5,
        0.37,
        "#c6c9bc",
        "metal",
      );
      box(
        g,
        w * 0.5 + 0.41,
        -h * 0.31,
        0.337,
        0.6,
        0.45,
        0.017,
        "#ffffff",
        "panel-ac",
      );
      for (const sx of [-1, 1])
        box(
          g,
          w * 0.5 + 0.41 + sx * 0.22,
          -h * 0.5 - 0.07,
          0.14,
          0.055,
          0.075,
          0.5,
          "#546967",
          "metal",
        );
    }
  }
  const neighborhood = buildNeighborhood(
    { T, box, beam, cyl, ellipsoid, group, mat, P },
    city,
    groundY,
    facadeWindow,
  );
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
    wanted.theta = options.initialTheta ?? (
      controls === "fixed"
        ? -0.34
        : name === "north"
          ? -0.12
          : name === "room"
            ? -0.18
            : -0.25);
    wanted.phi = controls === "fixed" ? .87 : name === "room" ? .90 : .87;
    wanted.zoom = name === "room" ? 1.07 : innerWidth < 640 ? (name === "south" ? 1.24 : 1.14) : 1.22;
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
    const [bufferW,bufferH]=drawingBufferSize(w/PIXEL_STYLE.renderScale,h/PIXEL_STYLE.renderScale);
    renderer.setSize(bufferW,bufferH,false);
    const height =
      current === "room"
        ? Math.max(15.5, (13.8 * h) / w)
        : w < 640
          ? Math.max(28, ((current === "south" ? 21 : 29) * h) / w)
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
    pointers.set(e.pointerId, {...old, x:e.clientX, y:e.clientY});
    // Gesture ownership is fixed on pointerdown, even after the object moves
    // out from under the pointer or a second finger touches the canvas.
    if ([...pointers.values()].some(p=>p.object)) return;
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
      if (![...pointers.values()].some(p=>p.object))
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
    for(const motion of objectMotion) motion.g.rotation.z=motion.kind==="spin"?time*(.24+(a.wind||0)*.55):Math.sin(time*1.7)*(.045+(a.wind||0)*.05);
    windTime.value = time;
    windPower.value = current === "room" ? 0 : a.wind;
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
    hemi.intensity = current === "room" ? 1.05 : 1.05 - a.lightAmount * .40;
    hemi.groundColor.set(a.night > 0.5 ? "#738395" : "#b2a890");
    sun.color.set(
      a.phase === "dusk"
        ? "#ddae87"
        : a.phase === "dawn"
          ? "#d5beb0"
          : "#e8e6ca",
    );
    sun.intensity = current === "room" ? .95 : .12 + a.sun * 1.20;
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
  function pointAtHeight(x, y, height = 0) {
    ray(x, y);
    const v = new T.Vector3();
    floorPlane.constant = -height;
    if (!raycaster.ray.intersectPlane(floorPlane, v)) return null;
    const center =
      current === "north"
        ? [304, 272]
        : current === "room"
          ? [300, 216]
          : [284, 264];
    return { x: v.x * 16 + center[0], y: v.z * 16 + center[1] };
  }
  const groundPoint = (x,y)=>pointAtHeight(x,y,0);
  function placementAt(x,y,child,excluded=new Set(),offset={x:0,y:0}) {
    const list=D.layout[current],relations=relationsFor(list),binding=relations.get(child.id)?.parentId?relations.get(child.id):groundArea(list,child,relations),candidates=[];
    const context=createPlacementContext(list,child.id,relations);
    for(const parent of list) {
      if(excluded.has(parent.id)||relations.get(parent.id)?.invalid)continue;
      for(const surface of context.surfaces.get(parent.id)) {
        if(surface.bearing==='ground'&&relations.get(parent.id)?.height!==0)continue;
        const height=(relations.get(parent.id)?.height||0)+surface.y;
        const point=pointAtHeight(x,y,height);if(!point)continue;
        let next={...child,x:point.x-offset.x,y:point.y-offset.y,support:surface.bearing==='ground'?null:{id:parent.id,surface:surface.id}};
        if(surface.point) {
          const centre=surfacePoint(parent,surface);
          if(Math.hypot(next.x-centre.x,next.y+contactOffset(child)-centre.y)>Math.min(surface.w,surface.d)*8)continue;
          next={...next,x:centre.x,y:centre.y-contactOffset(child)};
        }
        if(fitsSurface(next,parent,surface,{footprint:context.footprints.get(child.id)}))candidates.push({next,height,current:binding?.parentId===parent.id&&binding.surfaceId===surface.id});
      }
    }
    // A selected tier stays stable while dragging within its bearing area,
    // including steep camera angles where higher tiers project onto the same spot.
    // Otherwise the closest horizontal surface is struck first by the camera ray.
    candidates.sort((a,b)=>Number(b.current)-Number(a.current)||b.height-a.height);
    for(const candidate of candidates) {
      const next=candidate.next,proposed=list.map(o=>o.id===child.id?next:o),updated=new Map(relations);
      updated.set(child.id,next.support?{height:candidate.height,parentId:next.support.id,surfaceId:next.support.surface,container:context.surfaces.get(next.support.id).find(s=>s.id===next.support.surface).container}:{height:0});
      if(clearPlacement(proposed,new Set([child.id]),updated,context))return next;
    }
    const point=groundPoint(x,y);
    return point?{...child,x:point.x-offset.x,y:point.y-offset.y,support:null}:null;
  }
  function pick(x, y) {
    ray(x, y);
    const hits = raycaster.intersectObjects(
      [...objectRoots[current].values()],
      true,
    );
    const owner=hit=>{let n=hit.object;while(n&&!n.userData.objectId)n=n.parent;return n&&D.layout[current].find(o=>o.id===n.userData.objectId)};
    for (const hit of hits) {
      const materials=Array.isArray(hit.object.material)?hit.object.material:[hit.object.material];
      if(materials.every(m=>m?.transparent&&m.opacity<.45))continue;
      let n = hit.object;
      while (n && !n.userData.objectId) n = n.parent;
      if (n) return D.layout[current].find((o) => o.id === n.userData.objectId);
    }
    return hits.length?owner(hits[0]):null;
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
    stage.add(new T.HemisphereLight("#fff1d7", "#727e80", .95));
    const light = new T.DirectionalLight("#fff4df", 1.32);
    light.position.set(-8, 11, 5);
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
    cam.position.copy(center).add(new T.Vector3(6, 5, 8));
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
    pointAtHeight,
    placementAt,
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
      return pointers.size > 1 && ![...pointers.values()].some(p=>p.object);
    },
    get interacting() {
      return pointers.size>0||['theta','phi','zoom'].some(k=>Math.abs(wanted[k]-view[k])>.001)||target.distanceToSquared(desiredTarget)>.000001;
    },
    draw,
    get stats() {
      return {
        scene: current,
        view: { ...view },
        wanted: { ...wanted },
        pixels: PIXEL_STYLE.renderScale,
        style: PIXEL_STYLE.id,
        textures: texCache.size,
        surfaces: surfaceCache.size,
        foliageMotion: {
          time: windTime.value,
          strength: windPower.value,
          programs: (renderer.info.programs || []).filter((p) =>
            p.cacheKey.includes("pixel-wind"),
          ).length,
        },
        controls,
        selectedModel: options.selected?.() || null,
        wardrobe: { ...wardrobe },
        modelIds: [...objectRoots[current].keys()],
        catalog: ASSETS.length,
        objects: D.layout[current].length,
        modelBuilds,
        instances: batches.reduce((n, b) => n + b.count, 0),
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        groundY,
        storeys: 6,
        neighborhood,
        buffer: [canvas.width, canvas.height],
      };
    },
  };
}
