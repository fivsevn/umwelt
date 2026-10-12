import { animateActorPose } from "./actor-pose.mjs";
import { HOUSE, housePoint, houseOccludes } from "../house-structure.mjs";
import { loadArchitecturalShell } from "./architectural-shell.mjs";
import { loadRoomBackground } from "./room-background-loader.mjs";
import { createRoomDoor, mountRoomDoorLeaves } from "./room-door.mjs";
import { ROOM_BACKGROUND } from "../assets/room/room-background.mjs";
import { roomFrame } from "./room-frame.mjs";
import { BACKGROUND } from "../assets/background/empty-rooftop.mjs";
import { readScopeOptics, createScopeSurfaceCache } from "./scope-reading.mjs";
import { lensUnwarpNdc } from "./lens-pass.mjs";
import { createOutdoorRasterPass, outdoorSampleNdc, rasterCellCentre } from "./outdoor-raster.mjs";
import { resolvePixelGrid, resolveScenePixelGrid, pixelGridSize } from "./pixel-grid.mjs";
import { projectVisibleDoor } from "./door-projection.mjs";
import {
  narrativePreset,
  narrativeFrame,
  applyNarrativeFrameOffset,
  narrativePose,
  constrainNarrativeHead,
  constrainNarrativeTarget,
  constrainNarrativeStation,
  birdHeadAtStation,
  narrativeDrag,
  nudgeNarrativeStation as advanceNarrativeStation,
} from "./story-camera.mjs";
import {
  TERRACE_ZOOM,
  TERRACE_VIEW_DISTANCE,
  terraceOrbit,
  terraceFrame,
  constrainTerracePan,
} from "./terrace-view.mjs";
import { weatherAction } from "../resident-weather.mjs";
import { createAtmosphere, invalidateShadowsAfterLoad } from "./atmosphere.mjs";
import { outdoorPaintKind } from "./weathering.mjs";
import { surfaceSeed } from "./surface-variation.mjs";
import { SCENES, asset, ASSETS, inside } from "../scene.mjs";
import { PLANTS, POTS } from "../botany.mjs";
import { ITEM_METRES_TO_UNITS, getItemDefinition, getPlantAssembly } from "../item-catalog.mjs";
import { createNativeItemLibrary, isTrailingPlant } from "./native-model-loader.mjs";
import { PIXEL_STYLE, createPixelMaterials } from "./native-materials.mjs";
import { coarseSides } from "./native-style.mjs";
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
import { wardrobe } from "../wardrobe.mjs";
import { buildResident, buildPig } from "./residents.mjs";

// This renderer consumes the same initial layout and botanical palette as the 2D game.
// Only the canvas changes; the observer's cards, clock, weather and residents are shared.
export function createGardenRenderer(canvas, layout, doorButton, options = {}) {
  const controls = options.controls || "orbit";
  const editable = controls === "edit";
  const backgroundStage = options.backgroundStage === true;
  const gameModelStage = options.gameModelStage === true;
  let sourceInspection = backgroundStage && options.reviewSampling !== "game";
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
  function withContact(o) { return { ...o, contactY: 0 }; }
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
  // Match the furniture study's unfiltered low-poly shadow edge.
  renderer.shadowMap.type = T.BasicShadowMap;
  renderer.setClearColor("#bdc2c5");
  const outdoorRaster = createOutdoorRasterPass(T, renderer);
  let outdoorGrid = resolvePixelGrid(window.devicePixelRatio), airScopeEllipse = null;
  window.addEventListener("pagehide", event => { if (!event.persisted) outdoorRaster.dispose(); });
  const scene = new T.Scene(),
    camera =
      controls === "pan"
        ? new T.PerspectiveCamera(40, 1, 0.1, 6000)
        : new T.OrthographicCamera(-20, 20, 20, -20, 0.1, 6000);
  scene.fog = new T.Fog("#bdc2c5", 180, 6000);
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
  let nativeRevision = 0, roomBackground = null;
  const nativeItems = createNativeItemLibrary(T, { getDefinition: getItemDefinition, getAssembly: getPlantAssembly,
    units: ITEM_METRES_TO_UNITS, windTime, windPower, weather: surfaceWeather,
    onChange() {
      nativeRevision++; renderer.shadowMap.needsUpdate = true;
      const state = nativeItems.stats;
      canvas.dataset.itemModelsLoaded = String(state.loaded); canvas.dataset.itemModelsPending = String(state.pending);
      canvas.dataset.itemAtlases = String(state.atlases); canvas.dataset.itemModelErrors = JSON.stringify(state.errors);
    } });
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
  const plants = new Map(D.plants.map(o => [o.id, o]));
  function makePlant(parent, o) {
    const k = ITEM_METRES_TO_UNITS * (o.scale || 1), a = -(o.rotation || 0) * Math.PI / 180;
    const g = nativeItems.make(o, { floorAt(xx, zz) {
      const ground = (.025 - parent.position.y) / k;
      const support = parent.userData.support;
      if (!support?.parent) return ground;
      const q = localPoint({ x: o.x + (xx * Math.cos(a) + zz * Math.sin(a)) * k * 16,
        y: o.y + (-xx * Math.sin(a) + zz * Math.cos(a)) * k * 16, contactY: 0 }, support.parent);
      const board = supportSurfaces(support.parent)[support.level];
      return board && Math.abs(q.x - (board.x || 0)) < board.w / 2 && Math.abs(q.z - (board.z || 0)) < board.d / 2
        ? (support.height + .025 - parent.position.y) / k : ground;
    }});
    parent.add(g); g.scale.setScalar(o.scale || 1); g.rotation.y = a;
    return g;
  }
  function makeObject(parent, o) {
    const g = nativeItems.make(o); parent.add(g);
    g.scale.setScalar(o.scale || 1); g.rotation.y = -(o.rotation || 0) * Math.PI / 180;
    return g;
  }
  function modelApi() {
    return { makeNativeItem(parent, type) { const model = nativeItems.make({ type }); parent.add(model); return model; } };
  }
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
    // The saved Blender shell owns every outdoor slab, wall and roof. The
    // terrace-local door stays separate so its hinge and transition remain live.
    door(parent, name, ...(name === "north" ? [6, 8.375] : [-3.83, 8.1]), name === "north" ? Math.PI / 2 : -Math.PI / 2);
  }
  function door(parent, name, x, z, angle) {
    const frame = group(parent, x, 0.02, z);
    frame.rotation.y = angle;
    // The approved outdoor opening is 2.1 metres high. Its export uses the
    // established terrace units (3 metres = 5.6 units); room proportions stay.
    const height = name === "room" ? 2.5 : 2.1 * 5.6 / 3,
      heightScale = height / 2.5,
      frameHeight = height + 0.14;
    for (const xx of [-0.61, 0.61])
      box(frame, xx, frameHeight / 2, 0, 0.15, frameHeight, 0.3, P.cap, "wall");
    box(frame, 0, frameHeight, 0, 1.38, 0.16, 0.34, P.cap);
    box(frame, 0, 0.06, 0.12, 1.5, 0.12, 0.7, "#bbb49c");
    if (name !== "room") {
      box(frame, 0.2, frameHeight + 0.28, 0.78, 3.55, 0.12, 1.9, "#9eaba7", "metal", -0.06);
      for (const xx of [-1.25, 1.25])
        beam(frame, [xx, frameHeight - 0.24, 0.06], [xx, frameHeight + 0.22, 1.13], 0.055, "#6c7a79");
    }
    const hinge = group(frame, -0.51, 0, 0);
    hinge.userData.animated = true;
    box(hinge, 0.51, height / 2, 0, 1.02, height, 0.16, "#64706e", "metal");
    box(hinge, 0.51, 1.27 * heightScale, 0.094, 0.86, 2.27 * heightScale, 0.025, "#ffffff", "panel-door");
    for (const xx of [0.035, 0.985])
      box(hinge, xx, height / 2, 0.09, 0.045, 2.4 * heightScale, 0.025, "#7c8e8f", "metal");
    box(hinge, 0.81, 1.19 * heightScale, 0.139, 0.055, 0.17 * heightScale, 0.045, "#b4baac", "metal");
    doors[name] = { hinge, frame, height };
  }
  function resident(parent, name) {
    actors[name] = buildResident(
      { group, box, beam, cyl, ellipsoid, modelApi, P },
      parent,
    );
    actors[name].person.visible = !options.hideActors;
  }
  function pig(parent, name) {
    Object.assign(
      actors[name],
      buildPig({ group, box, beam, cyl, ellipsoid, P }, parent),
    );
    actors[name].pig.visible = !options.hideActors;
  }
  const objectRoots = { north: new Map(), south: new Map(), room: new Map() };
  let modelBuilds = 0, layoutRevision = 0;
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
    if (isTrailingPlant(getItemDefinition(o.type))) {
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
    anchor.userData.model.scale.setScalar(o.scale || 1);
    anchor.userData.model.rotation.y = (-(o.rotation || 0) * Math.PI) / 180;
    nativeItems.setContents(anchor.userData.model, [...relationsFor(list).values()].some(relation => relation.parentId === o.id));
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
    nativeItems.setContents(anchor.userData.model, [...relationsFor(list).values()].some(relation => relation.parentId === o.id));
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
    nativeItems.dispose(root);
    const owned = new Set(),
      disposable = new Set();
    root.traverse((n) => {
      if (n.isInstancedMesh) {
        owned.add(n);
        n.dispose();
        if (n.geometry.userData.transient) disposable.add(n.geometry);
      } else if (n.isMesh) {
        if (!n.geometry?.userData.nativeItemShared && !n.geometry?.userData.structuralVisibilityPrivate) n.geometry?.dispose();
        for (const material of Array.isArray(n.material) ? n.material : [n.material])
          if (!material?.userData.nativeItemShared && ![...materialCache.values()].includes(material)) material?.dispose();
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
    layoutRevision++;
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
    const nativeDoor = ROOM_BACKGROUND.door;
    doors.room = createRoomDoor(T, root, {
      centre: nativeDoor.frameOriginRuntime,
      width: nativeDoor.leafWidthRuntime,
      height: nativeDoor.heightRuntime,
    });
    roomBackground = loadRoomBackground(T, root, {
      onReady({ leaves }) {
        mountRoomDoorLeaves(doors.room, leaves);
        canvas.dataset.roomBackgroundLoaded = "true";
        canvas.dataset.roomBackgroundReadyMs = String(performance.now());
        canvas.dataset.roomDoorParts = String(leaves.length);
      },
      onError(error) { canvas.dataset.roomBackgroundError = String(error.message || error); },
    });
    invalidateShadowsAfterLoad(renderer, roomBackground.ready);
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
  let loadedArchitecturalShell = null;
  const architecturalShell = {
    get stats() { return loadedArchitecturalShell?.stats || { loaded: false, deferred: true, source: "Blender", error: null }; },
    measure(raycaster) { return loadedArchitecturalShell?.measure(raycaster) || null; },
    update(atmosphere) { loadedArchitecturalShell?.update(atmosphere); },
  };
  function ensureArchitecturalShell() {
    if (loadedArchitecturalShell) return;
    loadedArchitecturalShell = loadArchitecturalShell(T, city);
    loadedArchitecturalShell.ready.then(() => {
      canvas.dataset.backgroundLoaded = "true";
      canvas.dataset.backgroundReadyMs = String(performance.now());
    }).catch(error => {
      canvas.dataset.backgroundError = String(error.message || error);
    });
    invalidateShadowsAfterLoad(renderer, loadedArchitecturalShell.ready);
  }
  const neighborhood = { source: "Blender", row: true, gameRange: true };
  if (!editable && options.scene !== "room") {
    build("north");
    build("south");
  } else build(options.scene || "north");
  compileInstances();
  let current = "north",
    view = { theta: -0.12, phi: 1.15, zoom: 1 },
    wanted = { ...view };
  let terraceBounds = null, roomBounds = null, backgroundOverview = false, backgroundOutlook = false;
  const narrativeViews = ["bird", "drone", "neighbor"];
  const reviewViews = ["terrace", "row", "outlook", ...narrativeViews];
  let reviewViewMode = reviewViews.includes(options.reviewView)
    ? options.reviewView : gameModelStage ? "bird" : "terrace";
  let narrativeView = narrativeViews.includes(reviewViewMode) ? reviewViewMode : "bird", storyFrame = null;
  const narrativeActive = () => !editable && current !== "room" && (!backgroundStage || narrativeViews.includes(reviewViewMode));
  let freeCamera = false, freeYaw = 0, freePitch = 0, freeDistance = 1;
  const freeEye = new T.Vector3();
  const freeDirection = () => new T.Vector3(Math.sin(freeYaw) * Math.cos(freePitch), Math.sin(freePitch), Math.cos(freeYaw) * Math.cos(freePitch));
  const storyPreset = () => narrativePreset(current, narrativeView);
  const station = { walk: 0, height: 0, dolly: 0 }, wantedStation = { ...station };
  const target = new T.Vector3(0, 0.2, -1.1),
    desiredTarget = target.clone();
  const pointers = new Map();
  let lastDistance = 0,
    multiTouchGesture = false,
    doorProgress = 0;
  function setReviewView(name) {
    if (!backgroundStage || editable || current === "room" || !reviewViews.includes(name)) return;
    reviewViewMode = name;
    if (narrativeViews.includes(name)) narrativeView = name;
    reset(current);
  }
  function reset(name) {
    freeCamera = false;
    backgroundOverview = backgroundStage && !editable && name !== "room" && reviewViewMode === "row";
    backgroundOutlook = backgroundStage && !editable && name !== "room" && reviewViewMode === "outlook";
    Object.assign(station, { walk: 0, height: 0, dolly: 0 });
    Object.assign(wantedStation, station);
    current = name;
    canvas.dataset.scene = name;
    if (name !== "room") ensureArchitecturalShell();
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
      name === "south" ? -HOUSE.terraces.south.origin[1] : 0,
      0,
      0,
    );
    city.rotation.y = name === "south" ? Math.PI / 2 : 0;
    city.updateMatrix();
    orbitLimits = terraceOrbit(name, canvas.clientWidth);
    wanted.theta = name !== "room"
      ? orbitLimits.theta
      : (options.initialTheta ?? 0.78);
    wanted.phi = name === "room" ? 0.8 : editable ? 1.08 : orbitLimits.phi;
    if (backgroundStage && !narrativeActive() && name !== "room") {
      wanted.theta = name === "north" ? Math.PI - .48 : Math.PI / 2 + .48;
      wanted.phi = .68;
    }
    wanted.zoom = name === "room" ? 1 : editable ? 1.25 : TERRACE_ZOOM.min;
    desiredTarget.set(
      name === "room" ? -0.4 : 0,
      0.2,
      name === "room" ? -0.8 : 0,
    );
    if (narrativeActive()) {
      const preset = storyPreset();
      wanted.theta = 0;
      wanted.phi = 0;
      wanted.zoom = 1;
      desiredTarget.set(...preset.target);
      orbitLimits = { fullRotation: false, minTheta: -preset.yaw, maxTheta: preset.yaw, minPhi: -preset.pitch, maxPhi: preset.pitch };
    } else if (backgroundOverview) {
      wanted.phi = .60;
      wanted.zoom = 1;
    } else if (backgroundOutlook) {
      wanted.theta = name === "north" ? 0 : -Math.PI / 2;
      wanted.phi = .4;
      wanted.zoom = 1.8;
    }
    Object.assign(view, wanted);
    target.copy(desiredTarget);
    pointers.clear();
    multiTouchGesture = false;
    lastDistance = 0;
    doorProgress = 0;
    doors[name].hinge.rotation.y = 0;
    renderer.shadowMap.needsUpdate = true;
    terraceBounds = null;
    roomBounds = null;
    resize();
    if (backgroundOverview) {
      const rowCentre = HOUSE.roof.x + HOUSE.roof.width / 2;
      desiredTarget.set(name === "north" ? rowCentre : -22, -8, name === "north" ? 10 : -rowCentre);
    }
    target.copy(desiredTarget);
    positionCamera();
    canvas.dataset.cameraTarget = JSON.stringify(target.toArray());
    canvas.dataset.cameraZoom = String(view.zoom);
    positionDoor();
  }
  function resize() {
    const w = canvas.clientWidth || innerWidth,
      h = canvas.clientHeight || innerHeight;
    // Same fixed circular opening as .neighbor-scope. Cache at resize instead
    // of measuring DOM layout separately for every particle or every frame.
    const scopeDiameter = Math.min(innerWidth * .88, (window.visualViewport?.height || innerHeight) * .82);
    airScopeEllipse = [scopeDiameter / w, scopeDiameter / h];
    // Retina CSS presentation must preserve the already rasterized square
    // cells rather than interpolate their edges into smaller colour fragments.
    canvas.style.imageRendering = sourceInspection ? "auto" : "pixelated";
    outdoorGrid = resolveScenePixelGrid(window.devicePixelRatio, { sourceInspection, arrangement: !backgroundStage && (editable || current === "room") });
    canvas.dataset.pixelRatio = String(outdoorGrid.pixelRatio);
    canvas.dataset.physicalPixelStep = String(outdoorGrid.pixelStep);
    canvas.dataset.targetCssPixelStep = String(outdoorGrid.targetCssPixelStep);
    canvas.dataset.sampling = sourceInspection ? "source" : "game";
    // The world remains a cheap low target. The final pass uses the actual DPR
    // so each square cell is an integer number of device pixels at every density.
    const [bufferW, bufferH] = pixelGridSize(w, h, outdoorGrid).output;
    renderer.setSize(bufferW, bufferH, false);
    if (narrativeActive()) {
      storyFrame = narrativeFrame(storyPreset(), w, h);
      wanted.zoom = T.MathUtils.clamp(wanted.zoom, storyFrame.zoom.min, storyFrame.zoom.max);
      constrainPan();
    } else if (current === "room") {
      const previousFrame = roomBounds;
      roomBounds = roomFrame(w, h, wanted.theta, wanted.phi, {
        distance: camera.isPerspectiveCamera ? TERRACE_VIEW_DISTANCE : null,
      });
      if (!previousFrame) desiredTarget.set(roomBounds.target.x, roomBounds.target.y, roomBounds.target.z);
      else {
        desiredTarget.x += roomBounds.target.x - previousFrame.target.x;
        desiredTarget.z += roomBounds.target.z - previousFrame.target.z;
      }
    } else {
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
    const height = narrativeActive() ? storyFrame.span :
      current === "room" ? roomBounds.span : terraceBounds.span;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.left = (-height * w) / h / 2;
    camera.right = (height * w) / h / 2;
    if (camera.isPerspectiveCamera) {
      camera.aspect = w / h;
      camera.fov = backgroundOutlook ? 80 : backgroundOverview ? 50 : T.MathUtils.radToDeg(
        2 * Math.atan(height / (2 * (narrativeActive() ? narrativePose(storyPreset()).distance : TERRACE_VIEW_DISTANCE))),
      );
      applyNarrativeFrameOffset(camera, narrativeActive() ? storyFrame : null, w, h);
    }
    camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
  }
  function constrainPan() {
    if (narrativeActive()) {
      const point = constrainNarrativeTarget(storyPreset(), desiredTarget);
      desiredTarget.set(point.x, point.y, point.z);
      return;
    }
    if (!terraceBounds || current === "room") return;
    const p = constrainTerracePan(
      terraceBounds,
      desiredTarget,
      wanted.zoom,
      wanted.theta,
      wanted.phi,
      true,
    );
    desiredTarget.x = p.x;
    desiredTarget.z = p.z;
  }
  function pan(dx, dy) {
    if (freeCamera) {
      const scale = 2 * freeDistance * Math.tan(T.MathUtils.degToRad(camera.fov / 2)) / Math.max(1, canvas.clientHeight);
      freeEye.addScaledVector(new T.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), -dx * scale);
      freeEye.addScaledVector(new T.Vector3(0, 1, 0).applyQuaternion(camera.quaternion), dy * scale);
      return;
    }
    if (narrativeActive()) {
      const preset = storyPreset();
      if (preset.id === "bird" || preset.id === "drone") {
        const next = narrativeDrag(preset, { ...wanted, station: wantedStation }, dx, dy);
        Object.assign(wantedStation, next.station);
        wanted.theta = next.theta; wanted.phi = next.phi;
        return;
      }
      const pose = narrativePose(preset, { ...wanted, station: wantedStation }, desiredTarget.toArray()),
        u = (-dx * (camera.right - camera.left)) / wanted.zoom / Math.max(1, canvas.clientWidth),
        v = (-dy * (camera.top - camera.bottom)) / wanted.zoom / Math.max(1, canvas.clientHeight) / Math.max(.18, -Math.sin(pose.pitch));
      desiredTarget.x += Math.cos(pose.yaw) * u + Math.sin(pose.yaw) * v;
      desiredTarget.z += -Math.sin(pose.yaw) * u + Math.cos(pose.yaw) * v;
      constrainPan();
      return;
    }
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
    if (freeCamera) {
      const step = delta * Math.max(1, freeDistance) * .65;
      freeEye.addScaledVector(freeDirection(), step);
      freeDistance = Math.max(.5, freeDistance - step);
      return;
    }
    if (narrativeActive() && narrativeView === "bird") return;
    if (narrativeActive() && narrativeView === "drone") {
      wantedStation.dolly += delta * 8;
      Object.assign(wantedStation, constrainNarrativeStation(storyPreset(), wantedStation));
      return;
    }
    const old = wanted.zoom;
    wanted.zoom = T.MathUtils.clamp(
      old * Math.exp(delta),
      narrativeActive() ? storyFrame.zoom.min : current === "room" ? 0.58 : editable ? 1 : TERRACE_ZOOM.min,
      narrativeActive() ? storyFrame.zoom.max : current === "room" ? 1.85 : editable ? 3.5 : TERRACE_ZOOM.max,
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
  function constrainHead() {
    if (!narrativeActive()) return;
    Object.assign(wanted, constrainNarrativeHead(storyPreset(), wanted.theta, wanted.phi));
  }
  function distance() {
    const p = [...pointers.values()];
    return p.length === 2 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0;
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse" && !(freeCamera && e.button === 2)) return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    if (controls === "none") return;
    const object = editable && pick(e.clientX, e.clientY);
    pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      object: object?.id,
      rotate:
        freeCamera ? e.button === 0 && !e.shiftKey : !narrativeActive() && (current === "room" ||
        (controls === "pan" ? navigationMode === "rotate" : e.shiftKey)),
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
      if ((narrativeActive() || controls === "pan") && current !== "room") pan(dx / 2, dy / 2);
      lastDistance = d;
    } else if (multiTouchGesture) {
      return;
    } else if (freeCamera) {
      if (old.rotate) {
        freeYaw -= dx * .006;
        freePitch = T.MathUtils.clamp(freePitch - dy * .005, -1.5, 1.5);
      } else pan(dx, dy);
    } else if (narrativeActive() || (controls === "fixed" || controls === "pan") && !old.rotate) {
      pan(dx, dy);
    } else if (!old.object) {
      wanted.theta -= dx * 0.006;
      wanted.phi = T.MathUtils.clamp(
        wanted.phi + dy * 0.005,
        current === "room" ? 0.35 : editable ? 0.45 : orbitLimits.minPhi,
        current === "room" ? 1.49 : editable ? 1.35 : orbitLimits.maxPhi,
      );
      constrainHead();
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
    if (narrativeActive()) {
      e.preventDefault();
      if (e.key.startsWith("Arrow")) pan(
        e.key === "ArrowLeft" ? 35 : e.key === "ArrowRight" ? -35 : 0,
        e.key === "ArrowUp" ? 35 : e.key === "ArrowDown" ? -35 : 0,
      );
      if (e.key === "+" || e.key === "=") zoom(.12);
      if (e.key === "-") zoom(-.12);
      return;
    }
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
      constrainHead();
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
    if (freeCamera) {
      camera.position.copy(freeEye);
      camera.lookAt(freeEye.clone().add(freeDirection()));
      camera.zoom = 1;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      return;
    }
    if (narrativeActive()) {
      const pose = narrativePose(storyPreset(), { ...view, station }, target.toArray());
      camera.position.set(...pose.eye);
      camera.lookAt(...pose.target);
      camera.zoom = view.zoom;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      return;
    }
    if (backgroundOutlook) {
      const pitch=view.phi-.48;
      camera.position.set(current === "north" ? 0 : 2.5, 3.1, current === "north" ? -4 : 0);
      camera.lookAt(camera.position.x-Math.sin(view.theta)*100*Math.cos(pitch),camera.position.y-Math.sin(pitch)*100,camera.position.z-Math.cos(view.theta)*100*Math.cos(pitch));
      camera.zoom=view.zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();return;
    }
    const radius = backgroundOverview
      ? Math.max(100, (HOUSE.roof.width + 18) / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * Math.max(.25, camera.aspect)))
      : camera.isPerspectiveCamera ? TERRACE_VIEW_DISTANCE : 58;
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
  const doorVisibility = { key: null, checked: -Infinity, blocked: true };
  function positionDoor() {
    if (!doorButton) return;
    const door = doors[current], rect = canvas.getBoundingClientRect(),
      lens = narrativeActive() && narrativeView === "neighbor"
        ? { unwarp: lensUnwarpNdc, radius: Math.min(.88 * rect.width, .82 * rect.height) / 2 } : null,
      bounds = projectVisibleDoor(T, {
        camera, frame: door.frame, width: rect.width, height: rect.height, doorHeight: door.height, lens,
        isOccluded(point) {
          if (current === "room") return false;
          const eye = housePoint(current, camera.position.x, camera.position.z), p = housePoint(current, point.x, point.z);
          if (houseOccludes([eye[0], camera.position.y, eye[1]], [p[0], point.y, p[1]])) return true;
          const key = [current, architecturalShell?.stats.loaded, ...camera.position.toArray(), ...camera.quaternion.toArray()].join(":"), now = performance.now();
          if (doorVisibility.key === key) return doorVisibility.blocked;
          // While a camera moves, conservatively disable the DOM target until
          // its native visibility is checked; never let it intercept a drag.
          if (now - doorVisibility.checked < 125) return true;
          const delta = point.clone().sub(camera.position), measureRay = new T.Raycaster(camera.position, delta.clone().normalize(), .01, delta.length() - .2);
          doorVisibility.key = key; doorVisibility.checked = now;
          doorVisibility.blocked = !!architecturalShell?.measure(measureRay);
          return doorVisibility.blocked;
        },
      });
    doorButton.hidden = !bounds;
    if (!bounds) {
      Object.assign(doorButton.style, { left: "0px", top: "0px", width: "0px", height: "0px" });
      return;
    }
    Object.assign(doorButton.style, {
      left: bounds.left + "px",
      top: bounds.top + "px",
      width: bounds.width + "px",
      height: bounds.height + "px",
    });
  }
  function updateActor(pig, person, present, time, weather, pigPresent = true) {
    const a = actors[current];
    a.person.visible = !options.hideActors && present && !person.insideShelter;
    a.pig.visible = !options.hideActors && pigPresent && !pig.insideShelter;
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
    animateActorPose(a, person, pig, time);
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
    pigPresent = true,
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
    for (const key of ["walk", "height", "dolly"])
      station[key] += (wantedStation[key] - station[key]) * speed;
    target.lerp(desiredTarget, speed);
    positionCamera();
    canvas.dataset.cameraTarget = JSON.stringify(target.toArray());
    canvas.dataset.cameraZoom = String(view.zoom);
    {
      const observer = narrativeActive() ? narrativeView : null,
        detailZoom = observer === "neighbor" ? view.zoom * storyPreset().span / storyFrame.span : 1;
      outdoorGrid = resolveScenePixelGrid(window.devicePixelRatio, { sourceInspection, arrangement: !backgroundStage && (editable || current === "room"), view: observer, zoom: detailZoom });
      canvas.dataset.physicalPixelStep = String(outdoorGrid.pixelStep);
      canvas.dataset.targetCssPixelStep = String(outdoorGrid.targetCssPixelStep);
    }
    doorProgress += (Number(doorOpen) - doorProgress) * Math.min(1, dt * 12);
    doors[current].hinge.rotation.y = -doorProgress * 0.58;
    updateActor(pig, person, present, time, a, pigPresent);
    canvas.dataset.personVisible = String(actors[current].person.visible);
    canvas.dataset.pigVisible = String(actors[current].pig.visible);
    // Only the three actual game observers need complete air coverage.
    // Local inspection views retain their small terrace field and its budget.
    const weatherMotion = atmosphereFx.update(current, a, time, reduced,
      narrativeActive() ? camera : null,
      { targetDistance: camera.position.distanceTo(target),
        ndcEllipse: narrativeActive() && narrativeView === "neighbor" ? airScopeEllipse : null });
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
    nativeItems.updateAtmosphere(a, current === "room");
    architecturalShell?.update(a);
    roomBackground?.update(a);
    // Atmosphere owns visibility alongside the seasonal light palette; keep
    // its near/far layers coherent when a weather transition changes the sky.
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
          nativeRevision,
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
    const nativeVisibility = nativeItems.updateVisibility(camera, Math.max(1, Math.floor(canvas.height / outdoorGrid.pixelStep)), !sourceInspection);
    if (nativeVisibility.changed) renderer.shadowMap.needsUpdate = true;
    outdoorRaster.render(scene, camera, canvas.width, canvas.height, narrativeActive() && narrativeView === "neighbor", outdoorGrid);
    if (gl.fenceSync) {
      pendingGPU = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
    }
    frameTimes[frameCursor++ % frameTimes.length] =
      performance.now() - frameStart;
    frameCount++;
    canvas.dataset.objects = String(D.layout[current].length);
    canvas.dataset.drawCalls = String(renderer.info.render.calls);
    canvas.dataset.triangles = String(renderer.info.render.triangles);
    canvas.dataset.frames = String(frameCount);
    if (!canvas.dataset.firstFrameMs) canvas.dataset.firstFrameMs = String(performance.now());
    canvas.dataset.lastRenderMs = String(frameTimes[(frameCursor + frameTimes.length - 1) % frameTimes.length]);
  }
  const raycaster = new T.Raycaster(),
    ndc = new T.Vector2(),
    floorPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  const scopeRaycaster = new T.Raycaster(), scopeCentre = new T.Vector2();
  const scopeSurfaceCache = createScopeSurfaceCache();
  function scopeReading() {
    if (!narrativeActive() || narrativeView !== "neighbor") return null;
    const now = performance.now(),
      key = current + ":" + camera.position.toArray().join(",") + ":" + camera.quaternion.toArray().join(",") + ":" + camera.projectionMatrix.elements.join(",") + ":" + canvas.clientWidth + ":" + canvas.clientHeight + ":" + outdoorGrid.pixelRatio + ":" + outdoorGrid.pixelStep + ":" + layoutRevision + ":" + architecturalShell.stats.loaded;
    const sample = scopeSurfaceCache.read(key, now, () => {
      scopeCentre.set(...outdoorSampleNdc([canvas.clientWidth / 2, canvas.clientHeight / 2], canvas.clientWidth, canvas.clientHeight, true, outdoorGrid));
      scopeRaycaster.near = camera.near; scopeRaycaster.far = camera.far;
      scopeRaycaster.setFromCamera(scopeCentre, camera);
      const livingMeshes = [];
      for (const root of Object.values(groups)) if (root.visible)
        root.traverseVisible(node => { if (node.isMesh) livingMeshes.push(node); });
      const livingHit = scopeRaycaster.intersectObjects(livingMeshes, false)[0],
        buildingHit = architecturalShell.measure?.(scopeRaycaster),
        hit = !livingHit ? buildingHit : !buildingHit || livingHit.distance < buildingHit.distance ? livingHit : buildingHit;
      return hit ? { point: hit.point.clone(), measuredSurface: true } : null;
    }, !options.hideActors || objectMotion.length > 0 || foliage.length > 0 || waterAnimations.length > 0);
    const
      fallback = narrativePose(storyPreset(), view, target.toArray()).target,
      point = sample?.point || new T.Vector3(...fallback),
      eyeXZ = housePoint(current, camera.position.x, camera.position.z),
      hitXZ = housePoint(current, point.x, point.z);
    const value = readScopeOptics({
      eye: [eyeXZ[0], camera.position.y, eyeXZ[1]],
      hit: [hitXZ[0], point.y, hitXZ[1]],
      metresPerUnit: BACKGROUND.texelMetresPerUnit,
      verticalFovDegrees: camera.isPerspectiveCamera ? camera.fov : 2 * Math.atan((camera.top - camera.bottom) / (2 * camera.position.distanceTo(point))) * 180 / Math.PI,
      zoom: camera.zoom,
      viewportHeight: canvas.clientHeight,
      measuredSurface: !!sample?.measuredSurface,
    });
    return value && { ...value };
  }
  const selectionBox = new T.Box3Helper(new T.Box3(), 0xd6c38b);
  scene.add(selectionBox);
  selectionBox.visible = false;
  let wardrobeKey = JSON.stringify(wardrobe),
    lastSize = "";
  function resizeIfNeeded() {
    const key = canvas.clientWidth + ":" + canvas.clientHeight + ":" + current + ":" + window.devicePixelRatio;
    if (lastSize !== key) {
      lastSize = key;
      resize();
    }
  }
  function ray(x, y) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(...outdoorSampleNdc([x - rect.left, y - rect.top], rect.width, rect.height, narrativeActive() && narrativeView === "neighbor", outdoorGrid));
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
    if (narrativeActive() && narrativeView === "neighbor") {
      const point = lensUnwarpNdc([v.x, v.y], canvas.width / canvas.height);
      v.x = point[0]; v.y = point[1];
    }
    const point = [(v.x * .5 + .5) * rect.width, (.5 - v.y * .5) * rect.height],
      presented = rasterCellCentre(point, outdoorGrid, rect.width, rect.height);
    return { clientX: rect.left + Math.min(rect.width - .5, presented[0]),
      clientY: rect.top + Math.min(rect.height - .5, presented[1]) };
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
  function thumbnail(o, output, asynchronous = false, request = null) {
    if (request === null) {
      request = Symbol();
      waitingPortraits.set(output, request);
      o = { ...o };
    } else if (waitingPortraits.get(output) !== request) return;
    // Preload only requested native models. No untextured or empty portrait can
    // enter the cache while its GLB or selected vessel is still in flight.
    if (!nativeItems.isReady(o)) {
      return nativeItems.preload(o).then(() => {
        if (waitingPortraits.get(output) === request)
          return thumbnail(o, output, asynchronous, request);
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
      const cached = spriteCache.get(key);
      output.dataset.nativeProjection = cached.dataset.nativeProjection;
      output.getContext("2d").drawImage(cached, 0, 0);
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
        2,
      source: "Blender",
      textureAuthor: "Pixelorama",
      modelId: getItemDefinition(o.type)?.modelId,
      family: getItemDefinition(o.type)?.family,
    });
    const portraitRight = new T.Vector3(8, 0, -6).normalize(),
      portraitUp = new T.Vector3(6, 5, 8).normalize().cross(portraitRight).normalize(),
      portraitCorners = [bounds.min.x, bounds.max.x].flatMap(x =>
        [bounds.min.y, bounds.max.y].flatMap(y =>
          [bounds.min.z, bounds.max.z].map(z => new T.Vector3(x, y, z)))),
      portraitX = portraitCorners.map(p => p.dot(portraitRight)),
      portraitY = portraitCorners.map(p => p.dot(portraitUp));
    const span = Math.max(Math.max(...portraitX) - Math.min(...portraitX),
      Math.max(...portraitY) - Math.min(...portraitY)) * 1.1,
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
    cam.updateMatrixWorld();
    const origin = new T.Vector3(0, 0, 0).project(cam);
    const nativeProjection = JSON.stringify({
      metresPerPixel: span / output.width / ITEM_METRES_TO_UNITS,
      anchor: [(origin.x + 1) * output.width / 2, (1 - origin.y) * output.height / 2],
      seed: o.seed || 1835, pot: a.plant ? getPlantAssembly(o.type, o.pot).pot.id : null,
    });
    output.dataset.nativeProjection = nativeProjection;
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
      copy.dataset.nativeProjection = nativeProjection;
      const image = copy.getContext("2d").createImageData(output.width, output.height),
        row = output.width * 4;
      for (let y = 0; y < output.height; y++)
        image.data.set(pixels.subarray((output.height - 1 - y) * row,
          (output.height - y) * row), y * row);
      copy.getContext("2d").putImageData(image, 0, 0);
      spriteCache.set(key, copy);
      if (waitingPortraits.get(output) === request)
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
    nudgeEditCamera(action) {
      if (!editable && current !== "room") return;
      if (action === "reset") { reset(current); return; }
      const moves = { left: [42, 0], right: [-42, 0], up: [0, 42], down: [0, -42] };
      if (moves[action]) pan(...moves[action]);
      if (action === "near" || action === "far") zoom(action === "near" ? .16 : -.16);
      if (action === "turn-left" || action === "turn-right") {
        wanted.theta += action === "turn-left" ? .2 : -.2;
        resize();
      }
    },
    setReviewView,
    setReviewSampling(mode) {
      if (!backgroundStage) return;
      sourceInspection = mode !== "game";
      resize();
    },
    setFreeCamera(enabled) {
      if (!gameModelStage || options.allowFreeCamera !== true || editable || current === "room") return;
      if (!enabled) { freeCamera = false; reset(current); return; }
      if (freeCamera) return;
      positionCamera();
      freeEye.copy(camera.position);
      const direction = camera.getWorldDirection(new T.Vector3());
      freeYaw = Math.atan2(direction.x, direction.z);
      freePitch = Math.asin(direction.y);
      freeDistance = camera.position.distanceTo(target);
      freeCamera = true;
      pointers.clear();
    },
    get scopeReading() { return scopeReading(); },
    nudgeNarrativeStation(action) {
      if (!narrativeActive()) return;
      if (freeCamera) {
        if (action === "up" || action === "down") freeEye.y += action === "up" ? .75 : -.75;
        if (action === "near" || action === "far") {
          const step = action === "near" ? 1 : -1;
          freeEye.addScaledVector(freeDirection(), step);
          freeDistance = Math.max(.5, freeDistance - step);
        }
        return;
      }
      const preset = storyPreset();
      Object.assign(wantedStation, advanceNarrativeStation(preset, wantedStation, action));
      if (preset.id === "bird") Object.assign(wanted, birdHeadAtStation(preset, wantedStation, wanted.phi));
    },
    nudgeNarrativeOptics(action) {
      if (!narrativeActive() || narrativeView !== "neighbor") return;
      if (action === "in" || action === "out") zoom(action === "in" ? .18 : -.18);
    },
    setNarrativeView(name) {
      if (editable || current === "room" || !narrativeViews.includes(name)) return;
      if (backgroundStage) { setReviewView(name); return; }
      narrativeView = name;
      reset(current);
    },
    setBackgroundView(wide) {
      setReviewView(wide ? "row" : "terrace");
    },
    setBackgroundOutlook() {
      setReviewView("outlook");
    },
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
    preloadModel: o => nativeItems.preload(o),
    async catalogModel(type) {
      if (!catalogInfo.has(type)) {
        const output = document.createElement("canvas");
        output.width = output.height = 32;
        await thumbnail({ type, seed: 1835 }, output, true);
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
        || ["walk", "height", "dolly"].some(key => Math.abs(wantedStation[key] - station[key]) > .001)
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
        textures: texCache.size,
        nativeItems: nativeItems.stats,
        surfaces: surfaceCache.size,
        foliageMotion: {
          time: windTime.value,
          strength: windPower.value,
          programs: (renderer.info.programs || []).filter((p) =>
            /native-pixelorama-metric-v2-(leaf|rigid)|native-item-wind-(leaf|rigid)/.test(p.cacheKey),
          ).length,
        },
        controls,
        navigationMode,
        projection: camera.isPerspectiveCamera ? "perspective" : "orthographic",
        orbitLimits,
        reviewView: backgroundStage && !editable && current !== "room" ? reviewViewMode : null,
        narrativeView: narrativeActive() ? narrativeView : null,
        freeCamera,
        freeCameraPose: freeCamera ? { eye: freeEye.toArray(), target: freeEye.clone().addScaledVector(freeDirection(), freeDistance).toArray() } : null,
        cameraPreset: narrativeActive() ? { ...storyPreset(), frame: { ...storyFrame }, pose: narrativePose(storyPreset(), { ...view, station }, target.toArray()) } : null,
        stationTravel: narrativeActive() ? { current: { ...station }, wanted: { ...wantedStation }, limits: { ...storyPreset().station } } : null,
        scopeLens: narrativeActive() && narrativeView === "neighbor" ? outdoorRaster.lensStats : null,
        raster: { enabled: !sourceInspection, sourceInspection, ...outdoorRaster.stats },
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
        zoomLimits: narrativeActive() ? { ...storyFrame.zoom } : TERRACE_ZOOM,
        storeys: 6,
        neighborhood,
        background: architecturalShell.stats,
        roomBackground: roomBackground?.stats || null,
        gameModelReview: gameModelStage,
        cameraRange: { near: camera.near, far: camera.far },
        distanceFog: { near: scene.fog.near, far: scene.fog.far },
        actorsHidden: !!options.hideActors,
        actorVisibility: { person: actors[current].person.visible, pig: actors[current].pig.visible },
        mountedActorVisibility: Object.fromEntries(Object.entries(actors).map(([name,a])=>[name,{person:a.person.visible,pig:a.pig.visible}])),
        atmosphere: atmosphereFx.stats,
        buffer: [canvas.width, canvas.height],
        software,
      };
    },
  };
}
