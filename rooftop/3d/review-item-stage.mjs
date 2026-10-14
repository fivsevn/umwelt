import { ITEM_METRES_TO_UNITS, getItemDefinition, getPlantAssembly } from "../item-catalog.mjs";
import { createNativeItemLibrary, nativeModelReady } from "./native-model-loader.mjs";
import { createAtmosphere } from "./atmosphere.mjs";
import { createOutdoorRasterPass } from "./outdoor-raster.mjs";
import { resolveScenePixelGrid, pixelGridSize } from "./pixel-grid.mjs";

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// One reusable native-item stage. The calling review page owns its clock,
// environment controls, authorization guard and animation frame loop.
export function createReviewItemStage(canvas, {
  getDefinition = getItemDefinition, getAssembly = getPlantAssembly,
} = {}) {
  const T = window.THREE;
  if (!T) throw new Error("Three.js 未能加载");
  const renderer = new T.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "default" });
  renderer.setPixelRatio(1); renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.type = T.BasicShadowMap;
  const gl = renderer.getContext(), debug = gl.getExtension("WEBGL_debug_renderer_info"),
    software = /swiftshader|llvmpipe|softpipe|swrast|software/i.test(debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "");
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(40, 1, .01, 6000);
  scene.fog = new T.Fog("#bdc2c5", 180, 6000);
  const hemi = new T.HemisphereLight("#f3f2e9", "#a0aaa4", 2), sun = new T.DirectionalLight("#fff8e7", 1.45);
  sun.position.set(-22, 38, -14); sun.castShadow = true;
  sun.shadow.mapSize.set(software ? 512 : 1024, software ? 512 : 1024);
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 100 });
  sun.shadow.bias = -.0008; sun.shadow.normalBias = .02;
  scene.add(hemi, sun, sun.target);
  const groundGeometry = new T.PlaneGeometry(1, 1), groundMaterial = new T.MeshLambertMaterial({ color: "#afb2a8" }),
    ground = new T.Mesh(groundGeometry, groundMaterial), groundPigment = groundMaterial.color.clone();
  ground.name = "Neutral item-review reference ground"; ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.006; ground.receiveShadow = true; ground.scale.set(12, 12, 1); scene.add(ground);
  const windTime = { value: 0 }, windPower = { value: 0 }, weather = { wet: { value: 0 }, rain: { value: 0 } },
    originalMaterials = new Set();
  let sampling = "source", model = null, requestToken = 0,
    selectedId = null, pending = false, error = null, disposed = false, modelRevision = 0,
    surfaces = 0, boundsMetres = null, modelMeshes = 0, modelTriangles = 0, nativeSources = [],
    frameCount = 0, skippedFrames = 0, pendingGPU = null, floorSpan = 12,
    radius = 1, zoom = 1, yaw = .68, pitch = .5, lastWidth = 0, lastHeight = 0,
    lastGrid = null, lastMs = 0, warming = false;
  const aim = new T.Vector3(0, .5, 0), itemBounds = new T.Box3(), frameTimes = new Float32Array(90);
  const library = createNativeItemLibrary(T, {
    getDefinition, getAssembly, units: ITEM_METRES_TO_UNITS, windTime, windPower, weather,
    onChange() { if (!disposed) renderer.shadowMap.needsUpdate = true; },
  });
  const atmosphereFx = createAtmosphere(T, scene, renderer, {
    coords: (_name, x, y) => [(x - 300) / 384 * floorSpan, (y - 280) / 384 * floorSpan],
    hemi, sun, materialCache: new Map(), windowMats: [], software,
  });
  // The atmosphere's rooftop-only precipitation/snow/cloud floor shapes are
  // not reference surfaces for an isolated object. Its sky, lights and moving
  // world-space air remain the ordinary game atmosphere.
  const terraceOverlays = scene.children.filter(node => node.isGroup && node.children.some(child => child.material?.uniforms?.wet));
  terraceOverlays.forEach(node => { node.visible = false; });
  const raster = createOutdoorRasterPass(T, renderer, { enabled: false });
  canvas.dataset.renderer = "3d"; canvas.dataset.reviewGroup = "item";

  function releaseModel(root) {
    if (!root) return;
    root.removeFromParent();
    const ownGeometry = new Set(), ownMaterials = new Set();
    root.traverse(mesh => {
      if (!mesh.isMesh) return;
      if (!mesh.geometry.userData.nativeItemShared && !mesh.geometry.userData.structuralVisibilityPrivate) ownGeometry.add(mesh.geometry);
      const source = mesh.material;
      for (const material of Array.isArray(source) ? source : [source]) if (material.userData.nativeSoilChart) ownMaterials.add(material);
    });
    library.dispose(root);
    ownGeometry.forEach(geometry => geometry.dispose());
    ownMaterials.forEach(material => { material.dispose(); originalMaterials.delete(material); });
  }
  function resetCamera() { yaw = .68; pitch = .5; zoom = 1; }
  async function setItem(id) {
    if (disposed) return false;
    const token = ++requestToken, definition = getDefinition(id);
    selectedId = definition?.id || String(id); pending = true; error = null;
    releaseModel(model); model = null; modelMeshes = modelTriangles = surfaces = 0; boundsMetres = null; nativeSources = [];
    if (!definition) { pending = false; error = "未找到原生物件：" + id; throw new Error(error); }
    const record = { type: definition.id, seed: 1835, ...(definition.category === "植物" ? { pot: definition.defaultPot } : {}) };
    let candidate = null;
    try {
      await library.preload(record);
      if (disposed || token !== requestToken) return false;
      candidate = library.make(record); await nativeModelReady(candidate);
      if (disposed || token !== requestToken) { releaseModel(candidate); return false; }
      model = candidate; scene.add(model); model.updateWorldMatrix(true, true);
      // Read actual complete geometry. Only a world translation and the
      // catalogue's one shared metre conversion are applied to the model.
      itemBounds.setFromObject(model);
      if (itemBounds.isEmpty()) throw new Error("原生模型没有完整几何：" + id);
      boundsMetres = { min: itemBounds.min.toArray().map(v => v / ITEM_METRES_TO_UNITS), max: itemBounds.max.toArray().map(v => v / ITEM_METRES_TO_UNITS) };
      const centre = itemBounds.getCenter(new T.Vector3());
      model.position.set(-centre.x, -itemBounds.min.y, -centre.z); model.updateWorldMatrix(true, true);
      itemBounds.setFromObject(model); itemBounds.getCenter(aim);
      radius = Math.max(.001, itemBounds.getBoundingSphere(new T.Sphere()).radius);
      camera.near = Math.max(.0001, Math.min(.05, radius * .02));
      const size = itemBounds.getSize(new T.Vector3()); floorSpan = Math.max(4, size.x * 4, size.z * 4, radius * 5);
      ground.scale.set(floorSpan, floorSpan, 1);
      model.traverse(mesh => {
        if (mesh.userData.nativeDefinition) nativeSources.push({ ...mesh.userData.nativeDefinition });
        if (!mesh.isMesh) return;
        modelMeshes++; modelTriangles += (mesh.geometry.index?.count || mesh.geometry.getAttribute("position").count) / 3;
      });
      resetCamera(); modelRevision++; pending = false;
      renderer.shadowMap.needsUpdate = true; return true;
    } catch (failure) {
      if (candidate) releaseModel(candidate);
      if (!disposed && token === requestToken) { model = null; pending = false; error = String(failure.message || failure); }
      if (disposed || token !== requestToken) return false;
      throw failure;
    }
  }
  function setSampling(mode) { sampling = mode === "game" ? "game" : "source"; lastWidth = 0; }
  function positionCamera() {
    const vertical = T.MathUtils.degToRad(camera.fov), horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect),
      distance = radius / Math.sin(Math.min(vertical, horizontal) / 2) * 1.12 / zoom;
    camera.position.copy(aim).add(new T.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(distance));
    camera.lookAt(aim); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    ground.visible = pitch >= .015;
  }
  function draw({ atmosphere: a, time = 0, dt = 0, reduced = false } = {}, captureSize = null) {
    if (disposed || !a) return false;
    if (pendingGPU) {
      if (!captureSize && gl.clientWaitSync(pendingGPU, 0, 0) === gl.TIMEOUT_EXPIRED) { skippedFrames++; return false; }
      gl.deleteSync(pendingGPU); pendingGPU = null;
    }
    const started = performance.now(), width = captureSize?.width ?? canvas.clientWidth, height = captureSize?.height ?? canvas.clientHeight;
    if (!width || !height) return false;
    const grid = resolveScenePixelGrid(captureSize?.pixelRatio ?? window.devicePixelRatio, { sourceInspection: sampling === "source" }), size = pixelGridSize(width, height, grid);
    if (size.output[0] !== lastWidth || size.output[1] !== lastHeight) {
      renderer.setSize(...size.output, false); lastWidth = size.output[0]; lastHeight = size.output[1];
      camera.aspect = width / height; renderer.shadowMap.needsUpdate = true;
    }
    lastGrid = grid;
    Object.assign(canvas.dataset, { sampling, physicalPixelStep: String(grid.pixelStep), pixelRatio: String(grid.pixelRatio), targetCssPixelStep: String(grid.targetCssPixelStep) });
    canvas.style.imageRendering = sampling === "source" ? "auto" : "pixelated";
    positionCamera();
    const motion = atmosphereFx.update("north", a, time, reduced, camera, { targetDistance: camera.position.distanceTo(aim) });
    terraceOverlays.forEach(node => { node.visible = false; });
    windTime.value = time; windPower.value = motion.wind;
    weather.wet.value = a.wetness || 0; weather.rain.value = a.rain || 0;
    library.updateAtmosphere(a, false);
    groundMaterial.color.copy(groundPigment).multiplyScalar(1 - weather.wet.value * .10);
    library.updateVisibility(camera, size.source[1], false);
    atmosphereFx.refreshShadows("north", time, !reduced && motion.wind > .01);
    raster.render(scene, camera, ...size.output, false, grid);
    if (gl.fenceSync) { pendingGPU = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush(); }
    lastMs = performance.now() - started; frameTimes[frameCount++ % frameTimes.length] = lastMs;
    canvas.dataset.frames = String(frameCount);
    if (!warming) { warming = true; atmosphereFx.warm(camera).catch(() => {}); }
    return true;
  }
  async function capture({ width = 144, height = 144, pixelRatio = 1, atmosphere, time = 0, reduced = false } = {}) {
    if (disposed || pending || !model) throw new Error("物件尚未准备好，无法生成图册快照");
    if (!atmosphere) throw new Error("图册快照需要当前环境参数");
    const dimensions = {
      width: Math.max(1, Math.round(Number(width) || 144)),
      height: Math.max(1, Math.round(Number(height) || 144)),
      pixelRatio: Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1,
    };
    resetCamera();
    // Issue the snapshot in one task while the drawing buffer is valid. This
    // reuses the sole renderer even when the detail canvas has display:none.
    // The normal next draw restores its CSS size and device pixel ratio.
    if (!draw({ atmosphere, time, dt: 0, reduced }, dimensions)) throw new Error("图册快照未完成绘制");
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (blob) resolve(blob); else reject(new Error("图册快照 PNG 编码失败"));
    }, "image/png"));
  }

  const pointers = new Map(); let pinch = null;
  function down(event) { event.preventDefault(); canvas.setPointerCapture(event.pointerId); pointers.set(event.pointerId, [event.clientX, event.clientY]); pinch = null; }
  function move(event) {
    const prior = pointers.get(event.pointerId); if (!prior) return;
    pointers.set(event.pointerId, [event.clientX, event.clientY]);
    if (pointers.size >= 2) {
      const pair = [...pointers.values()], distance = Math.hypot(pair[0][0] - pair[1][0], pair[0][1] - pair[1][1]);
      if (!pinch) pinch = { distance, zoom };
      zoom = clamp(pinch.zoom * distance / Math.max(1, pinch.distance), .5, 6);
    } else { yaw -= (event.clientX - prior[0]) * .008; pitch = clamp(pitch + (event.clientY - prior[1]) * .008, -1.48, 1.48); }
  }
  function up(event) { pointers.delete(event.pointerId); pinch = null; }
  function wheel(event) { event.preventDefault(); zoom = clamp(zoom * Math.exp(-event.deltaY * .001), .5, 6); }
  function context(event) { event.preventDefault(); }
  const listeners = [["pointerdown", down], ["pointermove", move], ["pointerup", up], ["pointercancel", up], ["lostpointercapture", up], ["wheel", wheel], ["contextmenu", context]];
  const originalTouchAction = canvas.style.touchAction; canvas.style.touchAction = "none";
  listeners.forEach(([name, listener]) => canvas.addEventListener(name, listener, { passive: false }));
  function dispose() {
    if (disposed) return; disposed = true; requestToken++;
    listeners.forEach(([name, listener]) => canvas.removeEventListener(name, listener)); canvas.style.touchAction = originalTouchAction;
    pointers.clear(); if (pendingGPU) gl.deleteSync(pendingGPU); pendingGPU = null;
    releaseModel(model); model = null;
    originalMaterials.forEach(material => material.dispose());
    const geometries = new Set(), materials = new Set();
    scene.traverse(node => {
      if (node.geometry) geometries.add(node.geometry);
      for (const material of Array.isArray(node.material) ? node.material : node.material ? [node.material] : []) materials.add(material);
      node.shadow?.map?.dispose(); node.shadow?.mapPass?.dispose();
    });
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
    raster.dispose(); renderer.dispose(); scene.clear();
  }
  return { setItem, setSampling, resetCamera, draw, capture, dispose,
    get stats() {
      const samples = [...frameTimes].filter(Boolean).sort((a, b) => a - b), definition = selectedId && getDefinition(selectedId);
      return { id: selectedId, group: "item", ready: !!model && !pending && !error && !disposed, loaded: !!model, pending, error, disposed,
        objects: model ? 1 : 0, meshes: modelMeshes, triangles: modelTriangles, modelRevision,
        units: ITEM_METRES_TO_UNITS, boundsMetres, nativeSources: nativeSources.map(record => ({ ...record })),
        plantAssembly: model?.userData.plantAssembly ? { ...model.userData.plantAssembly } : null,
        source: definition?.modelSource || "Blender", textureAuthor: definition?.textureAuthor || "Pixelorama",
        sampling, raster: { sourceInspection: sampling === "source", ...raster.stats }, structuralVisibility: false,
        atmosphere: atmosphereFx.stats, camera: { yaw, pitch, zoom, eye: camera.position.toArray(), target: aim.toArray() },
        referenceGround: { visible: ground.visible, kind: "neutral", span: floorSpan, terraceOverlaysVisible: terraceOverlays.some(node => node.visible) },
        nativeItems: library.stats, software, pixelGrid: lastGrid ? { ...lastGrid } : null,
        performance: { frames: frameCount, skippedFrames, lastMs, p95Ms: samples[Math.floor((samples.length - 1) * .95)] || 0 },
      };
    },
  };
}
