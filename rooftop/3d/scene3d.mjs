import { attachRetroAsset, retroAssetCount } from "./retro-assets.mjs";
import { HOUSE, housePoint, houseOccludes } from "../house-structure.mjs";
import { buildHouseRoof } from "./house-roof.mjs";
import { terraceFloorGeometry } from "./terrace-floor.mjs";
import {
  TERRACE_ZOOM,
  TERRACE_VIEW_DISTANCE,
  terraceOrbit,
  terraceFrame,
  constrainTerracePan,
} from "./terrace-view.mjs";
import { weatherAction } from "../resident-weather.mjs";
import { createAtmosphere } from "./atmosphere.mjs";
import { outdoorPaintKind } from "./weathering.mjs";
import { surfaceSeed } from "./surface-variation.mjs";
import { soilSurface } from "./soil-surface.mjs";
import { SCENES, asset, ASSETS, inside } from "../scene.mjs";
import { PLANTS, POTS } from "../botany.mjs";
import { plantContact } from "../plant-art.mjs";
import { buildCactusBody } from "./cactus-models.mjs";
import { buildFoliage } from "./plant-models.mjs";
import { plantPotSpec } from "./plant-pots.mjs";
import { plantPaintKind } from "./plant-materials.mjs";
import { buildVessel } from "./vessel-models.mjs";
import { buildStand } from "./stand-models.mjs";
import { buildObject, OBJECT_DIMENSIONS } from "./object-models.mjs";
import { PIXEL_STYLE, createPixelMaterials } from "./native-materials.mjs";
import { coarseSides } from "./native-style.mjs";
import {
  latheSurface,
  leafSurface,
} from "./model-surfaces.mjs";
import { buildNeighborhood } from "./neighborhood.mjs";
import { buildWashstation } from "./washstation.mjs";
import {
  resolveSupports,
  supportSurfaces,
  localPoint,
  fitsSurface,
  placementSpaces,
  groundArea,
  surfacePoint,
  contactOffset,
  clearPlacement,
  createPlacementContext,
} from "./spatial-layout.mjs";
import { modelRandom as rng } from "./model-random.mjs";
import { drawingBufferSize } from "./render-budget.mjs";
import { buildWaterBowl } from "./water-models.mjs";
import { populateWater } from "./water-life.mjs";
import { wardrobe } from "../wardrobe.mjs";
import { buildResident, buildPig } from "./residents.mjs";

// This renderer consumes the same initial layout and botanical palette as the 2D game.
// Only the canvas changes; the observer's cards, clock, weather and residents are shared.
export function createGardenRenderer(canvas, layout, doorButton, options = {}) {
  const controls = options.controls || "orbit";
  const editable = controls === "edit";
  let navigationMode = "rotate",
    orbitLimits = null;
  if (controls !== "none") canvas.tabIndex = 0;
  if (controls === "pan") canvas.removeAttribute("title");
  if (!editable && controls === "orbit")
    canvas.title = "拖动转动视角，滚轮或双指缩放，方向键旋转，Home 复位";
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
  const gl = renderer.getContext(),
    debug = gl.getExtension("WEBGL_debug_renderer_info");
  const software = /swiftshader|llvmpipe|softpipe|swrast|software/i.test(
    debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "",
  );
  renderer.setPixelRatio(1);
  canvas.dataset.renderer = "3d";
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.type = T.BasicShadowMap;
  renderer.setClearColor("#bdc2c5");
  const scene = new T.Scene(),
    camera =
      controls === "pan"
        ? new T.PerspectiveCamera(40, 1, 0.1, 500)
        : new T.OrthographicCamera(-20, 20, 20, -20, 0.1, 500);
  scene.fog = new T.Fog("#bdc2c5", 48, 130);
  const hemi = new T.HemisphereLight("#f3f2e9", "#a0aaa4", 2.0);
  scene.add(hemi);
  const sun = new T.DirectionalLight("#fff8e7", 1.45);
  sun.position.set(-22, 38, -14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(software ? 512 : 1024, software ? 512 : 1024);
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
  const surfaceWeather = { wet: { value: 0 }, rain: { value: 0 } };
  const style = createPixelMaterials(T, windTime, windPower, surfaceWeather);
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
      m: mat(
        c,
        outdoorPaintKind(g, kind === "plain" ? isFoliage(g) || kind : kind),
      ),
      geo: cube,
      rx,
      ry,
      rz,
    });
  }
  function cyl(g, x, y, z, rt, rb, h, c, n = 8, kind = "plain") {
    n = coarseSides(n);
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
      m: mat(
        c,
        outdoorPaintKind(
          g,
          kind === "plain" ? isFoliage(g) || "paint" : kind,
          true,
        ),
      ),
      geo,
      rx: 0,
      ry: 0,
      rz: 0,
    });
  }
  function beam(g, a, b, width, color, depth = width, kind = "plain") {
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
      kind,
      e.x,
      e.y,
      e.z,
    );
  }
  const surfaceCache = new Map();
  const roundGeo = new T.SphereGeometry(1, 6, 3).toNonIndexed();
  roundGeo.computeVertexNormals();
  const soilParticleGeo = new T.SphereGeometry(1, 6, 3).toNonIndexed();
  soilParticleGeo.computeVertexNormals();
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
      m: mat(
        color,
        outdoorPaintKind(
          g,
          kind === "paint" && isFoliage(g) ? isFoliage(g) : kind,
          true,
        ),
      ),
      geo,
      rx: 0,
      ry: 0,
      rz: 0,
    });
  }
  function ellipsoid(g, x, y, z, rx, ry, rz, color, kind = "paint") {
    if (kind === "petal") {
      box(g, x, y, z, rx * 2, ry * 2, rz * 2, color, "petal");
      return;
    }
    surface(
      g,
      kind === "soil" ? soilParticleGeo : roundGeo,
      x,
      y,
      z,
      rx,
      ry,
      rz,
      color,
      typeof kind === "string"
        ? ["metal", "paint", "enamel", "cloth", "wood"].includes(kind)
          ? "wrap-" + kind
          : kind
        : "wrap-paint",
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
    sides = coarseSides(sides, shape, ribs);
    const key = JSON.stringify([points, sides, shape, ribs]);
    if (!surfaceCache.has(key))
      surfaceCache.set(key, latheSurface(T, points, sides, shape, ribs));
    surface(g, surfaceCache.get(key), 0, 0, 0, 1, 1, 1, color, kind);
  }
  function soil(
    g,
    x,
    y,
    z,
    w,
    d,
    { shape = "round", sides = 24, color = P.soil } = {},
  ) {
    let owner = g;
    while (owner.parent && owner.userData.paintSeed === undefined)
      owner = owner.parent;
    const variant = Math.floor((owner.userData.paintSeed || 0) * 32),
      key = "soil:" + shape + ":" + sides + ":" + variant;
    if (!surfaceCache.has(key))
      surfaceCache.set(key, soilSurface(T, shape, sides, variant));
    const amplitude = Math.min(0.045, Math.min(w, d) * 0.065);
    g.userData.soilField = { x, y, z, w, d, shape, variant, amplitude };
    surface(
      g,
      surfaceCache.get(key),
      x,
      y,
      z,
      w / 2,
      amplitude,
      d / 2,
      color,
      "soil",
    );
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
  function cactusBody(g, ...args) {
    buildCactusBody({ group, profile }, g, ...args);
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
    return buildVessel({ box, beam, shade, profile, group, soil }, g, p, r, h, {
      empty,
    });
  }
  function makePlant(parent, o) {
    const p = plants.get(o.type),
      g = group(parent);
    g.userData.animated = true;
    g.userData.paintSeed = surfaceSeed(o.seed);
    g.scale.setScalar(o.scale * (o.type === "barrel" ? 1.15 : 1.38));
    g.rotation.y = (-o.rotation * Math.PI) / 180;
    const spec = plantPotSpec(p),
      radius = spec.radius;
    const height = pot(g, o.pot || p.defaultPot, radius, spec.height);
    const fol = group(g, 0, height - 0.044, 0);
    // Soil grains belong to the native square painting, rather than hundreds
    // of sub-pixel spheres. The closed, uneven soil surface remains geometric.
    fol.userData.foliage = plantPaintKind(p);
    buildFoliage(
      { box, beam, ellipsoid, group, shade, rng, blade, profile, cactusBody },
      fol,
      p,
      {
        ...o,
        potRadius: radius,
        potTop: height,
        floorAt: (xx, zz) => {
          const k = g.scale.x,
            a = (-(o.rotation || 0) * Math.PI) / 180;
          const floor = -(parent.position.y + height * k) / k + 0.09;
          const support = parent.userData.support;
          if (!support?.parent) return floor;
          const q = localPoint(
            {
              x: o.x + (xx * Math.cos(a) + zz * Math.sin(a)) * k * 16,
              y: o.y + (-xx * Math.sin(a) + zz * Math.cos(a)) * k * 16,
              contactY: o.contactY || 0,
            },
            support.parent,
          );
          const surface = supportSurfaces(support.parent)[support.level];
          return surface &&
            Math.abs(q.x - (surface.x || 0)) < surface.w / 2 + 0.06 &&
            Math.abs(q.z - surface.z) < surface.d / 2 + 0.06
            ? -height + 0.1
            : floor;
        },
      },
    );
    return g;
  }
  const dims = OBJECT_DIMENSIONS;
  function stand(g, w, d, h, type) {
    buildStand({ T, box, beam, group, cyl, shade, P, mat }, g, w, d, h, type);
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
      paintedPane("#86aba7",.2),
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

  function paintedPane(color,opacity){
    const base=mat(color,"glass"),material=base.clone();
    material.onBeforeCompile=base.onBeforeCompile;material.customProgramCacheKey=base.customProgramCacheKey;
    material.defaultAttributeValues=base.defaultAttributeValues;
    material.transparent=true;material.opacity=opacity;material.depthWrite=false;
    return material;
  }
  function fishSchool(g, width, depth, level, goldfish = false) {
    populateWater(
      {
        group,
        ellipsoid,
        box,
        registerWater: (fish) => waterAnimations.push(fish),
      },
      g,
      { width, depth, level, goldfish, count: goldfish ? 3 : 5 },
    );
  }
  function waterSurface(g, width, depth, level, round = false) {
    const base = mat("#749993", "water"),
      waterMaterial = base.clone();
    waterMaterial.onBeforeCompile = base.onBeforeCompile;
    waterMaterial.customProgramCacheKey = base.customProgramCacheKey;
    waterMaterial.transparent = true;
    waterMaterial.opacity = 0.56;
    waterMaterial.depthWrite = false;
    const geometry = round
      ? new T.CircleGeometry(0.5, 16)
      : new T.PlaneGeometry(1, 1);
    const water = new T.Mesh(geometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.scale.set(width, depth, 1);
    water.position.y = level;
    g.add(water);
  }
  function waterBowl(g, r, h, type) {
    buildWaterBowl({ profile, group, cyl, box, shade, fishSchool, waterSurface, P }, g, r, h, type);
  }
  function modelApi() {
    return {
      T,
      mat,
      box,
      cyl,
      beam,
      group,
      ellipsoid,
      surface,
      soil,
      profile,
      shade,
      P,
      stand,
      basin,
      terrarium,
      waterBowl,
      fishSchool,
      waterSurface,
      registerMotion: (g, kind) => {
        g.userData.animated = true;
        objectMotion.push({ g, kind });
      },
      makePot: pot,
    };
  }
  function makeObject(parent, o) {
    const g = group(parent);
    let space = parent;
    while (space.parent && !["north", "south", "room"].includes(space.name))
      space = space.parent;
    g.userData.weathered =
      !asset(o.type).weapon &&
      (["north", "south", "room"].includes(space.name)
        ? space.name !== "room"
        : !o.type.startsWith("room-"));
    g.userData.animated = true;
    g.userData.paintSeed = surfaceSeed(o.seed);
    g.scale.setScalar(o.scale);
    g.rotation.y = (-o.rotation * Math.PI) / 180;
    if (!attachRetroAsset(g, o.type, mat)) buildObject(modelApi(), g, asset(o.type), o);
    return g;
  }
  function polygonShape(points) {
    const s = new T.Shape();
    points.forEach(([x, z], i) => (i ? s.lineTo(x, z) : s.moveTo(x, z)));
    s.closePath();
    return s;
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
      depth: 0.38,
      bevelEnabled: false,
      steps: 1,
    });
    geo.rotateX(Math.PI / 2);
    const slab = new T.Mesh(geo, mat("#c1bfb0", "wall"));
    geo.setAttribute(
      "paintSeed",
      new T.Float32BufferAttribute(
        new Array(geo.attributes.position.count).fill(
          surfaceSeed(name === "north" ? 15773 : 39127),
        ),
        1,
      ),
    );
    slab.position.y = -0.1;
    slab.castShadow = slab.receiveShadow = true;
    parent.add(slab);
    // The terrace is the top of a real house, rather than a floating platform.
    const foundation = new T.ExtrudeGeometry(shape, {
      depth: -0.48 - HOUSE.base,
      bevelEnabled: false,
      steps: 1,
    });
    foundation.rotateX(Math.PI / 2);
    const walls = new T.Mesh(foundation, mat("#bdbbae", "wall"));
    walls.position.y = -0.48;
    walls.castShadow = walls.receiveShadow = true;
    parent.add(walls);
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const nx = Math.sin(angle),
        nz = -Math.cos(angle);
      for (let floor = 0; floor < 6; floor++)
        for (let d = 2; d < length - 1; d += 4.5)
          facadeWindow(
            parent,
            a[0] + ((b[0] - a[0]) * d) / length + nx * 0.04,
            -3 - floor * 5.6,
            a[1] + ((b[1] - a[1]) * d) / length + nz * 0.04,
            Math.PI - angle,
            2.8,
            2.5,
            (floor + i) % 7,
          );
    }
    const faceGeo = terraceFloorGeometry(T,shape);
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
      mat(P.tile, "paving"),
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
            "parapet",
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
          "parapet",
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
    if (editable || name === "north")
      buildHouseRoof(
        { T, group, box, beam, mat, window: facadeWindow },
        parent,
        name,
      );
    // A single damp joint has a few shoots; the usable terrace remains clear.
    const growth = group(
      parent,
      ...(name === "north" ? [9.7, 0, 10.55] : [3.78, 0, -9.18]),
    );
    growth.userData.paintSeed = surfaceSeed(name === "north" ? 11371 : 39671);
    for (let j = 0; j < 3; j++) {
      const lean = (surfaceSeed(j * 137 + 397) - 0.5) * 0.12,
        h = 0.16 + surfaceSeed(j * 719 + 19) * 0.21;
      beam(
        growth,
        [j * 0.045, 0, 0],
        [lean, h, -0.025],
        0.014,
        "#627248",
        0.014,
        "leaf",
      );
      box(
        growth,
        lean - 0.045,
        h * 0.58,
        0.012,
        0.11,
        0.018,
        0.065,
        "#657944",
        "leaf",
        -0.37,
        0.38 + j * 0.71,
        0.24,
      );
      box(
        growth,
        lean + 0.03,
        h * 0.82,
        -0.019,
        0.08,
        0.015,
        0.075,
        "#879359",
        "leaf",
        0.32,
        -0.29 + j * 0.37,
        -0.24,
      );
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
    attachRetroAsset(frame, "door-frame", mat);
    if (name !== "room") attachRetroAsset(frame, "door-awning", mat);
    const hinge = group(frame, -0.5, 0, 0);
    hinge.userData.animated = true;
    attachRetroAsset(hinge, "door-leaf", mat);
    doors[name] = { hinge, frame };
  }
  function resident(parent, name) {
    actors[name] = buildResident(
      { group, box, beam, cyl, ellipsoid, modelApi, P },
      parent,
    );
  }
  function pig(parent, name) {
    Object.assign(
      actors[name],
      buildPig({ group, box, beam, cyl, ellipsoid, P }, parent),
    );
  }
  const objectRoots = { north: new Map(), south: new Map(), room: new Map() };
  let modelBuilds = 0;
  const supportCache = new WeakMap();
  function relationsFor(list) {
    if (!supportCache.has(list)) supportCache.set(list, resolveSupports(list));
    return supportCache.get(list);
  }
  function objectPosition(name, o, list) {
    const contact = plants.has(o.type) ? withContact(o) : o;
    const [x, z] = coords(name, o.x, o.y + (contact.contactY || 0));
    const placement = relationsFor(list).get(o.id);
    return new T.Vector3(x, (placement?.height || 0) + 0.02, z);
  }
  function geometrySignature(o, list) {
    const shape = [o.type, o.pot, o.seed];
    // Hanging foliage is clipped against the actual floor and shelf edge. Its
    // clipping envelope changes geometry; ordinary transforms never do.
    if (
      /tails|ivy|exp-(beadtail|threads|segments|fishbone)/.test(
        plants.get(o.type)?.form || "",
      )
    ) {
      const relation = relationsFor(list).get(o.id),
        parent = list.find((p) => p.id === relation?.parentId),
        q = parent && localPoint(o, parent);
      shape.push(
        ((relation?.height || 0) + 0.02) / o.scale,
        parent?.type,
        parent?.scale,
        relation?.surfaceId,
        q?.x,
        q?.z,
        ((o.rotation || 0) - (parent?.rotation || 0) + 360) % 360,
      );
    }
    return JSON.stringify(shape);
  }
  function modelPlacement(name, anchor, o, list) {
    anchor.position.copy(objectPosition(name, o, list));
    const placement = relationsFor(list).get(o.id);
    anchor.userData.support = placement?.parentId
      ? { ...placement, parent: list.find((p) => p.id === placement.parentId) }
      : null;
    anchor.userData.model.scale.setScalar(
      o.scale * (plants.has(o.type) ? (o.type === "barrel" ? 1.15 : 1.38) : 1),
    );
    anchor.userData.model.rotation.y = (-(o.rotation || 0) * Math.PI) / 180;
  }
  function addModel(name, o, list) {
    const anchor = group(groups[name]);
    anchor.position.copy(objectPosition(name, o, list));
    anchor.userData.animated = true;
    anchor.userData.objectId = o.id;
    anchor.userData.signature = geometrySignature(o, list);
    const placement = supportCache.get(list)?.get(o.id);
    anchor.userData.support = placement?.parentId
      ? { ...placement, parent: list.find((p) => p.id === placement.parentId) }
      : null;
    anchor.userData.model = (plants.has(o.type) ? makePlant : makeObject)(
      anchor,
      o,
    );
    modelBuilds++;
    objectRoots[name].set(o.id, anchor);
    return anchor;
  }
  function build(name) {
    if (groups[name]) return groups[name];
    const root = group(scene);
    root.name = name;
    root.userData.paintSeed = surfaceSeed(
      name === "north" ? 15773 : name === "south" ? 39127 : 21191,
    );
    root.userData.weathered = name !== "room";
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
    const owned = new Set(),
      disposable = new Set();
    root.traverse((n) => {
      if (n.isInstancedMesh) {
        owned.add(n);
        n.dispose();
        if (n.geometry.userData.transient) disposable.add(n.geometry);
      } else if (n.isMesh) {
        n.geometry?.dispose();
        if (![...materialCache.values()].includes(n.material))
          n.material?.dispose();
      }
    });
    batches = batches.filter((b) => !owned.has(b));
    for (const geometry of disposable)
      if (!batches.some((b) => b.geometry === geometry)) geometry.dispose();
    objectMotion = objectMotion.filter((f) => {
      for (let p = f.g; p; p = p.parent) if (p === root) return false;
      return true;
    });
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
        const signature = geometrySignature(o, list);
        let root = roots.get(o.id);
        if (root && root.userData.signature !== signature) {
          release(root);
          roots.delete(o.id);
          root = null;
        }
        if (!root) root = addModel(name, o, list);
        modelPlacement(name, root, o, list);
      }
    }
    if (primitives.length) compileInstances();
    renderer.shadowMap.needsUpdate = true;
  }
  function roomShell(root) {
    const w = 10,
      d = 14;
    box(root, 0, -0.13, 0, w, 0.25, d, "#b4a991", "wood");
    // A real opening lets daylight and the mullion shadows enter the room.
    for (const x of [-3.4, 3.4])
      box(root, x, 1.25, -d / 2, 3.2, 2.5, 0.15, "#c6bea4", "room-wall");
    box(root, 0, 0.4, -d / 2, 3.6, 0.8, 0.15, "#c6bea4", "room-wall");
    box(root, 0, 2.43, -d / 2, 3.6, 0.14, 0.15, "#c6bea4", "room-wall");
    box(root, -w / 2, 1.25, 0, 0.15, 2.5, d, "#b7ae95", "room-wall");
    box(root, w / 2, 0.23, 0, 0.15, 0.45, d, "#b7ae95", "room-wall");
    box(root, 0, 0.003, 0, w, 0.015, d, "#b2a180", "wood");
    const glass = new T.Mesh(
      new T.PlaneGeometry(3.4, 1.5),
      paintedPane("#aabfc6",.16),
    );
    glass.position.set(0, 1.57, -6.92);
    root.add(glass);
    for (const x of [-1.75, 0, 1.75])
      box(root, x, 1.57, -6.86, 0.065, 1.6, 0.055, "#d0cfad");
    box(root, 0, 1.57, -6.85, 3.5, 0.065, 0.055, "#d0cfad");
    box(root, 0, 0.8, -6.76, 3.7, 0.09, 0.44, "#c9c2a8", "wood");
    // Partially drawn cloth leaves a broad opening; no opaque pane blocks the sun.
    for (let k = 0; k < 3; k++)
      box(
        root,
        -1.54 + k * 0.1,
        1.57,
        -6.77,
        0.16,
        1.53,
        0.08,
        k === 1 ? "#ada88f" : "#c2bea5",
        "actor-cloth",
      );
    beam(
      root,
      [-4.92, 2.04, -0.8],
      [-4.45, 2.22, -0.8],
      0.05,
      "#655b4b",
      "metal",
    );
    cyl(root, -4.45, 2.18, -0.8, 0.12, 0.25, 0.19, "#aaa185", 12, "cloth");
    ellipsoid(root, -4.45, 2.06, -0.8, 0.085, 0.065, 0.085, "#e4c99f", "light");
    door(root, "room", -4.9, 4, -Math.PI / 2);
  }
  // Batch the painted surfaces and structural pieces without duplicating draw calls.
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
      p.matrix = worldMat.clone();
      const cast =
        root.name !== "city" &&
        !(p.geo === cube && Math.min(p.w, p.h, p.d) < 0.065);
      const m = p.m.userData.window
        ? p.m
        : mat("#ffffff", p.m.userData.kind || "plain");
      const key = root.uuid + "|" + m.uuid + "|" + p.geo.uuid + "|" + cast;
      let b = buckets.get(key);
      if (!b) {
        b = {
          root,
          m,
          geo: p.geo,
          cast,
          matrices: [],
          colors: [],
          seeds: [],
        };
        buckets.set(key, b);
      }
      let painted = p.g;
      while (painted.parent && painted.userData.paintSeed === undefined)
        painted = painted.parent;
      b.seeds.push(painted.userData.paintSeed || 0);
      b.matrices.push(worldMat.clone());
      b.colors.push(p.m.userData.window ? "#ffffff" : p.color);
    }
    for (const b of buckets.values()) {
      // Plants retain their existing surface normals and appearance. Rigid
      // folded shells have one normal per polygon, shared by its triangles;
      // smooth vertex normals must never bend the 2D pixel grid.
      const botanical=/^(leaf|cactus|soil|canopy|petal|skin|hair|actor-cloth)/.test(b.m.userData.nativeField||""),
        original=b.geo,
        painted=botanical?original:(original.index?original.toNonIndexed():original.clone());
      if(!botanical)painted.computeVertexNormals();
      const geo = new T.BufferGeometry();
      // Share immutable CPU arrays, but own the GPU attributes: disposing a
      // catalogue portrait must not delete buffers used by the live scene.
      if (painted.index)
        geo.setIndex(new T.BufferAttribute(painted.index.array, 1));
      for (const [name, attribute] of Object.entries(painted.attributes))
        geo.setAttribute(
          name,
          new T.BufferAttribute(
            attribute.array,
            attribute.itemSize,
            attribute.normalized,
          ),
        );
      geo.boundingBox = painted.boundingBox;
      geo.boundingSphere = painted.boundingSphere;
      geo.userData.transient = true;
      geo.setAttribute(
        "paintSeed",
        new T.InstancedBufferAttribute(new Float32Array(b.seeds), 1),
      );
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
    // Local transforms of architecture and mesh batches never change. Animated
    // parents still propagate their world matrices to these frozen children.
    scene.traverse((node) => {
      if ((node.isGroup || node.isInstancedMesh) && !node.userData.animated) {
        node.updateMatrix();
        node.matrixAutoUpdate = false;
      }
    });
  }
  const city = group(scene);
  city.name = "city";
  city.userData.paintSeed = surfaceSeed(70591);
  city.userData.weathered = true;
  const groundY = HOUSE.base,
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
    const m = mat(color, "window");
    m.userData.window = true;
    if (!windowMats.includes(m)) windowMats.push(m);
    box(g, 0, 0, 0.07, w, h, 0.038, color, "window");
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
    { T, box, beam, cyl, ellipsoid, group, mat, P, surface },
    city,
    groundY,
    facadeWindow,
  );
  if (!editable && options.scene !== "room") {
    build("north");
    build("south");
  } else build(options.scene || "north");
  compileInstances();
  let current = "north",
    view = { theta: -0.12, phi: 1.15, zoom: 1 },
    wanted = { ...view };
  let terraceBounds = null;
  const target = new T.Vector3(0, 0.2, -1.1),
    desiredTarget = target.clone();
  const pointers = new Map();
  let lastDistance = 0,
    multiTouchGesture = false,
    doorProgress = 0;
  function reset(name) {
    current = name;
    build(name);
    if (primitives.length) compileInstances();
    for (const [key, g] of Object.entries(groups)) {
      g.visible = !editable && name !== "room" ? key !== "room" : key === name;
      g.position.set(0, 0, 0);
      g.rotation.y = 0;
      if (!editable && name !== "room" && key !== "room") {
        if (name === "north" && key === "south") {
          g.position.z = HOUSE.terraces.south.origin[1];
          g.rotation.y = -Math.PI / 2;
        }
        if (name === "south" && key === "north") {
          g.position.x = -HOUSE.terraces.south.origin[1];
          g.rotation.y = Math.PI / 2;
        }
      }
      g.updateMatrix();
      g.updateMatrixWorld(true);
    }
    city.visible = name !== "room";
    city.position.set(
      name === "south" && !editable ? -HOUSE.terraces.south.origin[1] : 0,
      0,
      0,
    );
    city.rotation.y = name === "south" && !editable ? Math.PI / 2 : 0;
    city.updateMatrix();
    orbitLimits = terraceOrbit(name, canvas.clientWidth);
    wanted.theta =
      !editable && name !== "room"
        ? orbitLimits.theta
        : ((name === "south" && controls === "pan" && canvas.clientWidth >= 640
            ? -Math.PI / 2 + 0.34
            : options.initialTheta) ??
          (controls === "fixed"
            ? -0.34
            : name === "north"
              ? -0.12
              : name === "room"
                ? -0.18
                : -0.25));
    wanted.phi =
      !editable && name !== "room"
        ? orbitLimits.phi
        : controls === "fixed"
          ? 0.87
          : name === "room"
            ? 0.9
            : 0.87;
    wanted.zoom = name === "room" ? 1.07 : editable ? 1 : TERRACE_ZOOM.min;
    desiredTarget.set(
      name === "room" ? -0.4 : 0,
      0.2,
      name === "room" ? -0.8 : 0,
    );
    Object.assign(view, wanted);
    target.copy(desiredTarget);
    pointers.clear();
    multiTouchGesture = false;
    lastDistance = 0;
    doorProgress = 0;
    doors[name].hinge.rotation.y = 0;
    renderer.shadowMap.needsUpdate = true;
    terraceBounds = null;
    resize();
    target.copy(desiredTarget);
    positionCamera();
    positionDoor();
  }
  function resize() {
    // Geometry is rasterized at the CSS display size with MSAA. Pixel size belongs
    // to the nearest-filtered face drawing, not an enlarged coarse framebuffer.
    const w = canvas.clientWidth || innerWidth,
      h = canvas.clientHeight || innerHeight;
    const [bufferW, bufferH] = drawingBufferSize(
      w / PIXEL_STYLE.renderScale,
      h / PIXEL_STYLE.renderScale,
      software,
    );
    renderer.setSize(bufferW, bufferH, false);
    if (current !== "room") {
      const previousFrame = terraceBounds;
      terraceBounds = terraceFrame(
        current,
        w,
        h,
        wanted.theta,
        wanted.phi,
        editable ? 1 : TERRACE_ZOOM.min,
      );
      if (!previousFrame || (editable && wanted.zoom === 1))
        desiredTarget.set(terraceBounds.target.x, 0.2, terraceBounds.target.z);
      else if (!editable) {
        desiredTarget.x += terraceBounds.target.x - previousFrame.target.x;
        desiredTarget.z += terraceBounds.target.z - previousFrame.target.z;
      }
      constrainPan();
    }
    const height =
      current === "room" ? Math.max(15.5, (13.8 * h) / w) : terraceBounds.span;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.left = (-height * w) / h / 2;
    camera.right = (height * w) / h / 2;
    if (camera.isPerspectiveCamera) {
      camera.aspect = w / h;
      camera.fov = T.MathUtils.radToDeg(
        2 * Math.atan(height / (2 * TERRACE_VIEW_DISTANCE)),
      );
    }
    camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
  }
  function constrainPan() {
    if (!terraceBounds || current === "room") return;
    const p = constrainTerracePan(
      terraceBounds,
      desiredTarget,
      wanted.zoom,
      wanted.theta,
      wanted.phi,
      !editable,
    );
    desiredTarget.x = p.x;
    desiredTarget.z = p.z;
  }
  function pan(dx, dy) {
    const u =
      (-dx * (camera.right - camera.left)) / wanted.zoom / canvas.clientWidth;
    const v =
      (-dy * (camera.top - camera.bottom)) /
      wanted.zoom /
      canvas.clientHeight /
      Math.sin(wanted.phi);
    desiredTarget.x += Math.cos(wanted.theta) * u + Math.sin(wanted.theta) * v;
    desiredTarget.z += -Math.sin(wanted.theta) * u + Math.cos(wanted.theta) * v;
    constrainPan();
  }
  function zoom(delta, x, y) {
    const old = wanted.zoom;
    wanted.zoom = T.MathUtils.clamp(
      old * Math.exp(delta),
      current === "room" ? 0.58 : editable ? 1 : TERRACE_ZOOM.min,
      current === "room" ? 1.85 : editable ? 3.5 : TERRACE_ZOOM.max,
    );
    if (current !== "room" && x !== undefined) {
      const point = groundPoint(x, y);
      if (point) {
        const centre = current === "north" ? [304, 272] : [284, 264];
        const wx = (point.x - centre[0]) / 16,
          wz = (point.y - centre[1]) / 16;
        const ratio = old / wanted.zoom;
        desiredTarget.x = wx + (desiredTarget.x - wx) * ratio;
        desiredTarget.z = wz + (desiredTarget.z - wz) * ratio;
      }
    }
    constrainPan();
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
      rotate:
        current === "room" ||
        (controls === "pan" ? navigationMode === "rotate" : e.shiftKey),
    });
    lastDistance = distance();
    if (pointers.size > 1) multiTouchGesture = true;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    const old = pointers.get(e.pointerId),
      dx = e.clientX - old.x,
      dy = e.clientY - old.y;
    if (controls === "none") return;
    pointers.set(e.pointerId, { ...old, x: e.clientX, y: e.clientY });
    // Gesture ownership is fixed on pointerdown, even after the object moves
    // out from under the pointer or a second finger touches the canvas.
    if ([...pointers.values()].some((p) => p.object)) return;
    if (pointers.size === 2) {
      const ps = [...pointers.values()],
        x = (ps[0].x + ps[1].x) / 2,
        y = (ps[0].y + ps[1].y) / 2;
      const d = distance();
      if (d && lastDistance) zoom(Math.log(d / lastDistance), x, y);
      if (controls === "pan" && current !== "room") pan(dx / 2, dy / 2);
      lastDistance = d;
    } else if (multiTouchGesture) {
      return;
    } else if ((controls === "fixed" || controls === "pan") && !old.rotate) {
      pan(dx, dy);
    } else if (!old.object) {
      wanted.theta -= dx * 0.006;
      wanted.phi = T.MathUtils.clamp(
        wanted.phi + dy * 0.005,
        current === "room" ? 0.35 : editable ? 0.45 : orbitLimits.minPhi,
        current === "room" ? 1.49 : editable ? 1.35 : orbitLimits.maxPhi,
      );
      resize();
    }
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(type, (e) => {
      pointers.delete(e.pointerId);
      lastDistance = distance();
      if (!pointers.size) multiTouchGesture = false;
    });
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (![...pointers.values()].some((p) => p.object))
        zoom(
          -T.MathUtils.clamp(e.deltaY, -130, 130) * 0.002,
          e.clientX,
          e.clientY,
        );
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
    if (
      controls === "pan" &&
      navigationMode === "move" &&
      current !== "room" &&
      e.key.startsWith("Arrow")
    ) {
      e.preventDefault();
      pan(
        e.key === "ArrowLeft" ? 35 : e.key === "ArrowRight" ? -35 : 0,
        e.key === "ArrowUp" ? 35 : e.key === "ArrowDown" ? -35 : 0,
      );
      return;
    }
    e.preventDefault();
    if (e.key === "ArrowLeft") wanted.theta -= 0.14;
    if (e.key === "ArrowRight") wanted.theta += 0.14;
    if (e.key === "ArrowUp") wanted.phi = Math.min(1.49, wanted.phi + 0.1);
    if (e.key === "ArrowDown")
      wanted.phi = Math.max(
        current !== "room" && !editable ? orbitLimits.minPhi : 0.35,
        wanted.phi - 0.1,
      );
    if (current !== "room") {
      wanted.phi = T.MathUtils.clamp(
        wanted.phi,
        orbitLimits.minPhi,
        orbitLimits.maxPhi,
      );
      resize();
    }
    if (e.key === "+" || e.key === "=") zoom(0.12);
    if (e.key === "-") zoom(-0.12);
    if (e.key === "Home") reset(current);
  });
  window.addEventListener("resize", resize);
  const atmosphereFx = createAtmosphere(T, scene, renderer, {
    coords,
    hemi,
    sun,
    materialCache,
    windowMats,
    software,
  });
  const projected = new T.Vector3();
  function positionCamera() {
    const radius = camera.isPerspectiveCamera ? TERRACE_VIEW_DISTANCE : 58;
    camera.position.set(
      target.x + Math.sin(view.theta) * Math.cos(view.phi) * radius,
      target.y + Math.sin(view.phi) * radius,
      target.z + Math.cos(view.theta) * Math.cos(view.phi) * radius,
    );
    camera.lookAt(target);
    camera.zoom = view.zoom;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }
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
  function updateActor(pig, person, present, time, weather) {
    const a = actors[current];
    a.person.visible = present && !person.insideShelter;
    a.pig.visible = !pig.insideShelter;
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
    if (current === "room" && person.state === "rest")
      person = {
        ...person,
        ...weatherAction(weather, "person", Math.floor(time / 9), {
          indoor: true,
        }),
      };
    if (current === "room" && pig.state === "rest")
      pig = {
        ...pig,
        ...weatherAction(weather, "pig", Math.floor(time / 8), {
          indoor: true,
        }),
      };
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
    // Distinct idle poses use the same cached joints, including sheltered actions.
    a.body.rotation.z =
      action === "brace"
        ? -0.055
        : action === "stretch"
          ? Math.sin(time) * 0.035
          : 0;
    if (["warm-hands", "dry-hands"].includes(action))
      a.arms.forEach((arm, i) => {
        arm.rotation.x = -0.9;
        arm.rotation.z = (i ? 1 : -1) * (0.4 + Math.sin(time * 3) * 0.04);
      });
    else {
      a.arms.forEach((arm) => (arm.rotation.z = 0));
      if (action === "stretch")
        a.arms.forEach((arm, i) => {
          arm.rotation.x = -2.1;
          arm.rotation.z = (i ? 1 : -1) * 0.22;
        });
      if (
        ["wipe-sweat", "look-out", "check-window", "check-ties"].includes(
          action,
        )
      )
        a.arms[1].rotation.x = -2.35 + Math.sin(time * 1.5) * 0.04;
      if (action === "comfort")
        a.arms[0].rotation.x = -0.68 + Math.sin(time * 2) * 0.13;
      if (action === "wipe-pot") {
        a.arms[1].rotation.x = -0.85 + Math.sin(time * 3) * 0.15;
        a.tools.wipe.visible = true;
      }
    }
    const sleepy = ["snooze", "curl", "huddle"].includes(pig.state);
    const shake = pig.state === "shake";
    a.pig.scale.set(1, sleepy ? 0.84 : 1, 1);
    a.pig.rotation.z = shake ? Math.sin(time * 22) * 0.055 : 0;
    a.pigFace.rotation.x = ["sniff", "sniff-wet", "eat"].includes(pig.state)
      ? 0.1 + Math.sin(time * 3) * 0.025
      : pig.state === "sniff-air"
        ? -0.08
        : 0;
    const blink = sleepy ? 0.12 : Math.sin(time * 1.3) > 0.985 ? 0.12 : 1;
    a.pigEyes.forEach((eye) => (eye.scale.y = blink));
    a.pig.position.y +=
      pig.state === "walk" ? Math.abs(Math.sin(time * 9)) * 0.035 : 0;
    a.pigLegs.forEach(
      (leg, i) =>
        (leg.rotation.x =
          pig.state === "walk"
            ? Math.sin(time * 9 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.22
            : 0),
    );
    a.ears.forEach(
      (ear, i) =>
        (ear.rotation.z =
          Math.sin(time * (pig.state === "ear-flick" ? 7 : 1.8) + i * 2.4) *
          (pig.state === "ear-flick" ? 0.2 : 0.07)),
    );
    a.tail.rotation.z = Math.sin(time * 2.6) * 0.15;
  }
  const frameTimes = new Float32Array(90);
  let pendingGPU = null, previewReadbacks = 0,
    skippedFrames = 0;
  let frameCount = 0,
    frameCursor = 0,
    selectionKey = "",
    lastDrawAt = null;
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
    // Keep one GPU frame in flight. Software rendering and slow devices must
    // not accumulate an unbounded command queue while the UI keeps ticking.
    if (previewReadbacks) { skippedFrames++; return; }
    if (pendingGPU) {
      if (gl.clientWaitSync(pendingGPU, 0, 0) === gl.TIMEOUT_EXPIRED) {
        skippedFrames++;
        return;
      }
      gl.deleteSync(pendingGPU);
      pendingGPU = null;
    }
    const frameStart = performance.now();
    // Camera response follows elapsed time between rendered frames, including
    // GPU backpressure. Discarded submissions must not slow down navigation.
    const motionDt =
      lastDrawAt === null
        ? dt
        : Math.min(0.25, Math.max(0, (frameStart - lastDrawAt) / 1000));
    lastDrawAt = frameStart;
    updateWardrobe();
    resizeIfNeeded();
    const speed = reduced ? 1 : 1 - Math.exp(-motionDt * 14);
    for (const key of ["theta", "phi", "zoom"])
      view[key] += (wanted[key] - view[key]) * speed;
    target.lerp(desiredTarget, speed);
    positionCamera();
    doorProgress += (Number(doorOpen) - doorProgress) * Math.min(1, dt * 12);
    doors[current].hinge.rotation.y = -doorProgress * 0.58;
    updateActor(pig, person, present, time, a);
    const weatherMotion = atmosphereFx.update(current, a, time, reduced);
    for (const motion of objectMotion) {
      if (motion.kind === "spin")
        motion.angle =
          (motion.angle || 0) + dt * (0.24 + weatherMotion.wind * 0.55);
      motion.g.rotation.z =
        motion.kind === "spin"
          ? motion.angle
          : Math.sin(time * 1.7) * (0.045 + weatherMotion.wind * 0.05);
    }
    windTime.value = time;
    windPower.value = weatherMotion.wind;
    style.updateAtmosphere(a, current === "room");
    surfaceWeather.wet.value = current === "room" ? 0 : a.wetness;
    surfaceWeather.rain.value = current === "room" ? 0 : a.rain;
    for (const f of waterAnimations) {
      f.g.position.x = f.baseX + Math.sin(time * 0.2 + f.phase) * f.r * 0.4;
      f.g.position.z = f.baseZ + Math.cos(time * 0.16 + f.phase) * f.r * 0.25;
      f.g.rotation.y = Math.cos(time * 0.2 + f.phase) * 0.4;
    }
    atmosphereFx.refreshShadows(current, time,
      present || objectMotion.length > 0 || waterAnimations.length > 0 ||
      Math.abs(Number(doorOpen) - doorProgress) > .001);
    positionDoor();
    const chosen = selected && objectRoots[current].get(selected);
    selectionBox.visible = !!chosen;
    const key = chosen
      ? [
          chosen.uuid,
          ...chosen.position.toArray(),
          ...chosen.userData.model.scale.toArray(),
          chosen.userData.model.rotation.y,
          chosen.userData.signature,
        ].join(":")
      : "";
    if (chosen && key !== selectionKey) {
      selectionBox.box.setFromObject(chosen);
      selectionBox.updateMatrixWorld(true);
    }
    selectionKey = key;
    renderer.render(scene, camera);
    if (gl.fenceSync) {
      pendingGPU = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
    }
    frameTimes[frameCursor++ % frameTimes.length] =
      performance.now() - frameStart;
    frameCount++;
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
  const groundPoint = (x, y) => pointAtHeight(x, y, 0);
  function placementAt(
    x,
    y,
    child,
    excluded = new Set(),
    offset = { x: 0, y: 0 },
  ) {
    const list = D.layout[current],
      relations = relationsFor(list),
      binding = relations.get(child.id)?.parentId
        ? relations.get(child.id)
        : groundArea(list, child, relations),
      candidates = [];
    const context = createPlacementContext(list, child.id, relations);
    for (const parent of list) {
      if (excluded.has(parent.id) || relations.get(parent.id)?.invalid)
        continue;
      for (const surface of context.surfaces.get(parent.id)) {
        if (
          surface.bearing === "ground" &&
          relations.get(parent.id)?.height !== 0
        )
          continue;
        const height = (relations.get(parent.id)?.height || 0) + surface.y;
        const point = pointAtHeight(x, y, height);
        if (!point) continue;
        let next = {
          ...child,
          x: point.x - offset.x,
          y: point.y - offset.y,
          support:
            surface.bearing === "ground"
              ? null
              : { id: parent.id, surface: surface.id },
        };
        if (surface.point) {
          const centre = surfacePoint(parent, surface);
          if (
            Math.hypot(
              next.x - centre.x,
              next.y + contactOffset(child) - centre.y,
            ) >
            Math.min(surface.w, surface.d) * 8
          )
            continue;
          next = { ...next, x: centre.x, y: centre.y - contactOffset(child) };
        }
        if (
          fitsSurface(next, parent, surface, {
            footprint: context.footprints.get(child.id),
          })
        )
          candidates.push({
            next,
            height,
            current:
              binding?.parentId === parent.id &&
              binding.surfaceId === surface.id,
          });
      }
    }
    // A selected tier stays stable while dragging within its bearing area,
    // including steep camera angles where higher tiers project onto the same spot.
    // Otherwise the closest horizontal surface is struck first by the camera ray.
    candidates.sort(
      (a, b) => Number(b.current) - Number(a.current) || b.height - a.height,
    );
    for (const candidate of candidates) {
      const next = candidate.next,
        proposed = list.map((o) => (o.id === child.id ? next : o)),
        updated = new Map(relations);
      updated.set(
        child.id,
        next.support
          ? {
              height: candidate.height,
              parentId: next.support.id,
              surfaceId: next.support.surface,
              container: context.surfaces
                .get(next.support.id)
                .find((s) => s.id === next.support.surface).container,
            }
          : { height: 0 },
      );
      if (clearPlacement(proposed, new Set([child.id]), updated, context))
        return next;
    }
    const point = groundPoint(x, y);
    return point
      ? {
          ...child,
          x: point.x - offset.x,
          y: point.y - offset.y,
          support: null,
        }
      : null;
  }
  function pick(x, y) {
    ray(x, y);
    const hits = raycaster.intersectObjects(
      [...objectRoots[current].values()],
      true,
    );
    const owner = (hit) => {
      let n = hit.object;
      while (n && !n.userData.objectId) n = n.parent;
      return n && D.layout[current].find((o) => o.id === n.userData.objectId);
    };
    for (const hit of hits) {
      const materials = Array.isArray(hit.object.material)
        ? hit.object.material
        : [hit.object.material];
      if (materials.every((m) => m?.transparent && m.opacity < 0.45)) continue;
      if (!editable && current !== "room") {
        const eye = housePoint(current, camera.position.x, camera.position.z),
          point = housePoint(current, hit.point.x, hit.point.z);
        if (
          houseOccludes(
            [eye[0], camera.position.y, eye[1]],
            [point[0], hit.point.y, point[1]],
          )
        )
          return null;
      }
      let n = hit.object;
      while (n && !n.userData.objectId) n = n.parent;
      if (n) return D.layout[current].find((o) => o.id === n.userData.objectId);
    }
    return hits.length ? owner(hits[0]) : null;
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
    catalogInfo = new Map(),
    waitingPortraits = new WeakMap();
  function thumbnail(o, output, asynchronous = false) {
    // Never cache an untextured portrait while the single native book loads.
    if (!style.loaded) {
      const request = Symbol();
      waitingPortraits.set(output, request);
      return style.ready.then(() => {
        if (waitingPortraits.get(output) === request)
          return thumbnail(o, output, asynchronous);
      });
    }
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
    stage.add(new T.HemisphereLight("#ffffff", "#7b8a99", 0.95));
    const light = new T.DirectionalLight("#ffffff", 2.3);
    light.position.set(-8, 11, 5);
    stage.add(light);
    const bounds = new T.Box3().setFromObject(g),
      size = bounds.getSize(new T.Vector3()),
      center = bounds.getCenter(new T.Vector3());
    let meshes=0;g.traverse(node=>{if(node.isMesh&&!node.isInstancedMesh)meshes++;});
    catalogInfo.set(o.type, {
      type: o.type,
      meshes,
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
      samples: software || asynchronous ? 0 : 4,
    });
    target.texture.colorSpace = T.SRGBColorSpace;
    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    renderer.setClearColor(0, 0);
    // A seed's catalogue portrait must not depend on the live scene's breeze.
    const sceneWindTime = windTime.value,
      sceneWindPower = windPower.value,
      sceneWet = surfaceWeather.wet.value,
      sceneRain = surfaceWeather.rain.value,
      sceneTone = style.tone.value.clone();
    windTime.value = windPower.value = 0;
    surfaceWeather.wet.value = surfaceWeather.rain.value = 0;
    style.updateAtmosphere({ night: 0 });
    const sceneShadowDirty = renderer.shadowMap.needsUpdate;
    try {
      renderer.render(stage, cam);
    } finally {
      renderer.shadowMap.needsUpdate = sceneShadowDirty;
      windTime.value = sceneWindTime;
      windPower.value = sceneWindPower;
      surfaceWeather.wet.value = sceneWet;
      surfaceWeather.rain.value = sceneRain;
      style.tone.value.copy(sceneTone);
    }
    const pixels = new Uint8Array(output.width * output.height * 4);
    function finish() {
      const copy = document.createElement("canvas");
      copy.width = output.width;
      copy.height = output.height;
      const image = copy.getContext("2d").createImageData(output.width, output.height),
        row = output.width * 4;
      for (let y = 0; y < output.height; y++)
        image.data.set(pixels.subarray((output.height - 1 - y) * row,
          (output.height - y) * row), y * row);
      copy.getContext("2d").putImageData(image, 0, 0);
      spriteCache.set(key, copy);
      if (output.isConnected || !asynchronous)
        output.getContext("2d").drawImage(copy, 0, 0);
      target.dispose();
      return copy;
    }
    let readback;
    if (asynchronous && gl.fenceSync && gl.getBufferSubData) {
      // Queue the GPU copy into a tiny buffer and poll without blocking input.
      // readRenderTargetPixels otherwise waits for the entire live scene too.
      previewReadbacks++;
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
      gl.bufferData(gl.PIXEL_PACK_BUFFER, pixels.byteLength, gl.STREAM_READ);
      gl.readPixels(0, 0, output.width, output.height, gl.RGBA, gl.UNSIGNED_BYTE, 0);
      const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      gl.flush();
      readback = new Promise((resolve, reject) => {
        function poll() {
          const status = gl.clientWaitSync(fence, 0, 0);
          if (status === gl.TIMEOUT_EXPIRED) { setTimeout(poll, 16); return; }
          if (status === gl.WAIT_FAILED || gl.isContextLost()) {
            gl.deleteSync(fence); gl.deleteBuffer(buffer); target.dispose();
            previewReadbacks--;
            reject(new Error("Catalogue preview readback failed")); return;
          }
          gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
          gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, pixels);
          gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
          gl.deleteSync(fence); gl.deleteBuffer(buffer);
          previewReadbacks--;
          resolve(finish());
        }
        setTimeout(poll, 0);
      });
    } else {
      renderer.readRenderTargetPixels(target, 0, 0, output.width, output.height, pixels);
    }
    renderer.setRenderTarget(previous);
    release(g);
    batches.length = Math.min(start, batches.length);
    renderer.setClearColor(oldColor, oldAlpha);
    return readback || finish();
  }
  reset(options.scene || "north");
  atmosphereFx.warm(camera).catch(error => console.warn("Weather shader warmup:", error));
  function terracesInFrame() {
    return Object.entries(groups)
      .filter(([name, root]) => {
        if (!root.visible) return false;
        const eyeXZ = housePoint(current, camera.position.x, camera.position.z);
        const eye = [eyeXZ[0], camera.position.y, eyeXZ[1]];
        const points = [...SCENES[name].points];
        for (let x = 140; x <= 464; x += 16)
          for (let z = 80; z <= 464; z += 16)
            if (inside(name, x, z)) points.push([x, z]);
        return points.some(([x, z]) => {
          const [lx, lz] = coords(name, x, z);
          return [0, 2, 4.2].some((y) => {
            const world = root.localToWorld(new T.Vector3(lx, y, lz));
            const p = world.clone().project(camera);
            if ([p.x, p.y, p.z].some((n) => Math.abs(n) > 1)) return false;
            const [hx, hz] = housePoint(current, world.x, world.z);
            return (
              editable || current === "room" || !houseOccludes(eye, [hx, y, hz])
            );
          });
        });
      })
      .map(([name]) => name);
  }
  return {
    setScene: reset,
    setNavigationMode(mode) {
      if (mode === "move" || mode === "rotate") navigationMode = mode;
    },
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
      return pointers.size > 1 && ![...pointers.values()].some((p) => p.object);
    },
    get interacting() {
      return (
        pointers.size > 0 ||
        ["theta", "phi", "zoom"].some(
          (k) => Math.abs(wanted[k] - view[k]) > 0.001,
        ) ||
        target.distanceToSquared(desiredTarget) > 0.000001
      );
    },
    draw,
    get stats() {
      return {
        performance: {
          skippedFrames,
          frames: frameCount,
          p95Ms: [...frameTimes].sort((a, b) => a - b)[85],
          lastMs:
            frameTimes[
              (frameCursor + frameTimes.length - 1) % frameTimes.length
            ],
        },
        scene: current,
        view: { ...view },
        wanted: { ...wanted },
        pixels: PIXEL_STYLE.renderScale,
        antialias: renderer.getContext().getContextAttributes().antialias,
        style: PIXEL_STYLE.id,
        authoredAssets: retroAssetCount(),
        textures: texCache.size,
        surfaces: surfaceCache.size,
        foliageMotion: {
          time: windTime.value,
          strength: windPower.value,
          programs: (renderer.info.programs || []).filter((p) =>
            /native-pixelorama-metric-v2-(leaf|rigid)/.test(p.cacheKey),
          ).length,
        },
        controls,
        navigationMode,
        projection: camera.isPerspectiveCamera ? "perspective" : "orthographic",
        orbitLimits,
        programs: renderer.info.programs?.length || 0,
        selectedModel: options.selected?.() || null,
        wardrobe: { ...wardrobe },
        modelIds: [...objectRoots[current].keys()],
        catalog: ASSETS.length,
        objects: D.layout[current].length,
        modelBuilds,
        cataloguePreviews: spriteCache.size,
        instances: batches.reduce((n, b) => n + b.count, 0),
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        groundY,
        house: HOUSE,
        mountedTerraces: Object.keys(groups).filter(
          (key) => groups[key].visible,
        ),
        visibleTerraces: terracesInFrame(),
        target: target.toArray(),
        terraceFrame: terraceBounds,
        zoomLimits: TERRACE_ZOOM,
        storeys: 6,
        neighborhood,
        atmosphere: atmosphereFx.stats,
        buffer: [canvas.width, canvas.height],
        software,
      };
    },
  };
}
