import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { ITEMS, ITEM_METRES_TO_UNITS, getItemDefinition, getPlantAssembly } from '../item-catalog.mjs';
import { versionedNativeUrl, cloneNativeModel, createNativeItemLibrary, nativeModelReady, mergeNativePlantParts, settleTrailingGeometry, createSoilMaterial, soilChart, setNativeLidOpen, isTrailingPlant, canonicalAtlasPlugin } from '../3d/native-model-loader.mjs';

const context = { console: { warn() {} } };
vm.runInNewContext(readFileSync(new URL('../3d/vendor/three.min.js', import.meta.url), 'utf8'), context);
const T = globalThis.THREE = context.THREE;
const { GLTFLoader } = await import('../3d/vendor/gltf/GLTFLoader.js');
const { mergeGeometries } = await import('../3d/vendor/gltf/BufferGeometryUtils.js');
const hash = value => createHash('sha256').update(value).digest('hex');
const templates = new Map();
const map = new T.Texture({ width: 2048, height: 2048 });

async function geometryTemplate(item) {
  if (templates.has(item.id)) return templates.get(item.id);
  const data = readFileSync(new URL('../' + item.file, import.meta.url));
  // Parse the untouched actual GLB, including its embedded images. The plugin
  // binds the canonical atlas before any image decode: Node has no decoder.
  const { scene } = await new GLTFLoader().register(canonicalAtlasPlugin(map)).parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
  const materials = new Map();
  scene.traverse(mesh => {
    if (!mesh.isMesh) return;
    if (!materials.has(mesh.material)) materials.set(mesh.material, new T.MeshLambertMaterial({ map, color: '#ffffff', flatShading: true }));
    mesh.material = materials.get(mesh.material); mesh.material.userData = { nativeItemShared: true, finish: mesh.userData.finish, windKind: item.category === '植物' && /leaf|stem|branch|petiole/.test(mesh.userData.part_role) ? 'leaf' : null };
    mesh.geometry.userData.nativeItemShared = true;
  });
  scene.userData.nativeDefinition = { id: item.modelId, family: item.family };
  templates.set(item.id, scene); return scene;
}
function metrics(root) {
  let meshes = 0, triangles = 0, vertices = 0;
  root.traverse(mesh => { if (mesh.isMesh) { meshes++; triangles += (mesh.geometry.index?.count || mesh.geometry.getAttribute('position').count) / 3; vertices += mesh.geometry.getAttribute('position').count; } });
  return { meshes, triangles, vertices };
}
function signature(root) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(), faces = [], point = new T.Vector3();
  root.traverse(mesh => {
    if (!mesh.isMesh) return;
    const transform = inverse.clone().multiply(mesh.matrixWorld), p = mesh.geometry.getAttribute('position'), uv = mesh.geometry.getAttribute('uv'), index = mesh.geometry.index;
    for (let i = 0; i < (index?.count || p.count); i += 3) {
      const vertices = [];
      for (let j = 0; j < 3; j++) {
        const v = index ? index.getX(i + j) : i + j;
        point.fromBufferAttribute(p, v).applyMatrix4(transform);
        vertices.push([...point.toArray(), uv.getX(v), uv.getY(v)].map(n => Math.round(n * 1e6)).join(','));
      }
      faces.push(vertices.sort().join('|'));
    }
  });
  return hash(faces.sort().join('\n'));
}

test('294 native GLBs match catalog hashes and seven canonical embedded atlases', () => {
  assert.equal(ITEMS.length, 294);
  const families = new Set();
  for (const item of ITEMS) {
    families.add(item.family);
    const runtime = readFileSync(new URL('../' + item.file, import.meta.url));
    assert.equal(hash(runtime), item.modelSha256, item.id);
    assert.equal(runtime.readUInt32LE(0), 0x46546c67);
    const jsonLength = runtime.readUInt32LE(12), gltf = JSON.parse(runtime.subarray(20, 20 + jsonLength).toString()), binStart = 28 + jsonLength;
    assert.equal(gltf.images.length, 1, item.id + ' single authored atlas');
    const view = gltf.bufferViews[gltf.images[0].bufferView], embedded = runtime.subarray(binStart + (view.byteOffset || 0), binStart + (view.byteOffset || 0) + view.byteLength);
    assert.equal(hash(embedded), hash(readFileSync(new URL('../' + item.atlas, import.meta.url))), item.id + ' embedded image is exactly the canonical atlas');
  }
  assert.equal(families.size, 7);
});

test('dynamic resource URLs inherit the publication revision', () => {
  assert.equal(versionedNativeUrl('assets/items/wood-3.glb', 'https://umwelt.fivsevn.com/rooftop/3d/native-model-loader.mjs?v=abc123'), 'https://umwelt.fivsevn.com/rooftop/assets/items/wood-3.glb?v=abc123');
  assert.equal(versionedNativeUrl('assets/items/everyday-atlas.png?v=old', 'https://site/rooftop/3d/native-model-loader.mjs?v=new'), 'https://site/rooftop/assets/items/everyday-atlas.png?v=new');
});

test('all 110 plant templates merge draw parts while preserving every actual triangle and UV', async () => {
  let sourceParts = 0, mergedParts = 0;
  for (const item of ITEMS.filter(i => i.category === '植物')) {
    const template = await geometryTemplate(item), before = metrics(template), fingerprint = signature(template);
    const merged = mergeNativePlantParts(T, template, mergeGeometries), after = metrics(template);
    sourceParts += merged.source; mergedParts += merged.merged;
    assert.equal(after.triangles, before.triangles, item.id);
    assert.equal(signature(template), fingerprint, item.id + ' actual metre geometry / atlas charts');
    assert.ok(after.meshes < before.meshes, item.id);
    const roles = []; template.traverse(mesh => { if (mesh.isMesh) roles.push(mesh.userData.part_role); });
    assert.equal(roles.filter(role => role === 'review-pot').length, 1, item.id);
    assert.equal(roles.filter(role => role === 'review-soil').length, 1, item.id);
  }
  assert.ok(sourceParts > 6000); assert.ok(mergedParts < 1100, 'a populated garage should not draw 6591 individual source parts');
  console.log(JSON.stringify({ nativePlantSourceParts: sourceParts, nativePlantMergedParts: mergedParts }));
});

test('plant assembly removes only reviewer vessel and soil, uses selected native pot and one uniform unit scale', async () => {
  const loadModel = async (_T, definition) => geometryTemplate(definition);
  const library = createNativeItemLibrary(T, { getDefinition: getItemDefinition, getAssembly: getPlantAssembly, units: ITEM_METRES_TO_UNITS, loadModel });
  const plant = library.make({ type: 'basil', pot: 'white', seed: 123 }), root = new T.Group(); root.add(plant);
  await nativeModelReady(plant);
  const assembly = getPlantAssembly('basil', 'white'), roles = [];
  plant.traverse(mesh => { if (mesh.isMesh) roles.push(mesh.userData.part_role); });
  assert.ok(!roles.includes('review-pot')); assert.ok(!roles.includes('review-soil')); assert.ok(roles.includes('runtime-soil'));
  assert.equal(plant.userData.plantAssembly.pot, 'vessel-white'); assert.equal(plant.userData.plantAssembly.removedReviewMeshes, 2);
  assert.deepEqual(Array.from(plant.children[0].scale.toArray()), [ITEM_METRES_TO_UNITS, ITEM_METRES_TO_UNITS, ITEM_METRES_TO_UNITS]);
  const soil = plant.children[0].children.find(node => node.userData.part_role === 'runtime-soil');
  assert.ok(Math.abs(soil.position.y + .0125 - assembly.soilTop) < 1e-8);
  assert.equal(soil.material.map, map); assert.equal(soil.material.userData.texelsPerMetre, 16);
  library.dispose(plant);
});

test('native source cache survives clone release and cancelled async insertion', async () => {
  const template = await geometryTemplate(getItemDefinition('iron-3-black'));
  const meshes = []; template.traverse(mesh => { if (mesh.isMesh) meshes.push(mesh); });
  const source = meshes[0], clone = cloneNativeModel(T, template), copied = [];
  clone.traverse(mesh => { if (mesh.isMesh) copied.push(mesh); });
  assert.equal(copied[0].material, source.material);
  let sourceDisposed = false; source.geometry.addEventListener('dispose', () => sourceDisposed = true);
  let resolveLoad;
  const library = createNativeItemLibrary(T, { getDefinition: getItemDefinition, getAssembly: getPlantAssembly, units: ITEM_METRES_TO_UNITS, loadModel: () => new Promise(resolve => resolveLoad = resolve) });
  const pending = library.make({ type: 'iron-3-black' }); library.dispose(pending); resolveLoad(template); await nativeModelReady(pending);
  assert.equal(pending.children.length, 0); assert.equal(sourceDisposed, false);
});

test('native soil reuses its authored chart at 16 cells per metre independent of pot width', async () => {
  const template = await geometryTemplate(getItemDefinition('basil')); let soil;
  template.traverse(mesh => { if (mesh.userData.part_role === 'review-soil') soil = mesh; });
  const chart = soilChart(soil); assert.ok(chart.size.every(n => n > 0 && n < 20));
  const material = createSoilMaterial(T, soil, { wet: { value: .5 } }), shader = { uniforms: {}, vertexShader: T.ShaderLib.lambert.vertexShader, fragmentShader: T.ShaderLib.lambert.fragmentShader };
  material.onBeforeCompile(shader);
  assert.match(shader.fragmentShader, /floor\(plane \* 16\.\)/); assert.equal(material.map, soil.material.map);
  assert.deepEqual(Array.from(shader.uniforms.soilChart.value.toArray()), [...chart.origin, ...chart.size]);
});

test('trailing instance settles above a floor without changing cached positions or UVs', async () => {
  const template = await geometryTemplate(getItemDefinition('trailing')), before = signature(template), clone = cloneNativeModel(T, template, { structural: false });
  const changed = settleTrailingGeometry(T, clone, () => .10); assert.ok(changed > 0);
  clone.updateMatrixWorld(true);
  clone.traverse(mesh => {
    if (!mesh.isMesh || !/leaf|stem|branch|frond|petiole/.test(mesh.userData.part_role)) return;
    const points = mesh.geometry.getAttribute('position'), p = new T.Vector3();
    for (let i = 0; i < points.count; i++) assert.ok(p.fromBufferAttribute(points, i).applyMatrix4(mesh.matrixWorld).y >= .10 - 1e-6);
  });
  assert.equal(signature(template), before);
});

test('negative Three Y rotation agrees with the spatial convention on eccentric surfaces', () => {
  const local = new T.Vector3(.3, .7, -.2), theta = 90 * Math.PI / 180;
  const model = local.clone().applyAxisAngle(new T.Vector3(0, 1, 0), -theta);
  const spatial = [local.x * Math.cos(theta) - local.z * Math.sin(theta), local.x * Math.sin(theta) + local.z * Math.cos(theta)];
  assert.ok(Math.abs(model.x - spatial[0]) < 1e-10); assert.ok(Math.abs(model.z - spatial[1]) < 1e-10);
});

test('each renderer owns wind and wetness uniforms while immutable source geometry and atlas stay shared', async () => {
  const template = await geometryTemplate(getItemDefinition('basil'));
  const build = wet => createNativeItemLibrary(T, { getDefinition: getItemDefinition, getAssembly: getPlantAssembly, units: ITEM_METRES_TO_UNITS,
    loadModel: async (_T, item) => geometryTemplate(item), windTime: { value: wet + 1 }, windPower: { value: wet + 2 }, weather: { wet: { value: wet } } });
  const first = build(.2), second = build(.8), a = first.make({ type: 'basil' }), b = second.make({ type: 'basil' });
  await Promise.all([nativeModelReady(a), nativeModelReady(b)]);
  let am, bm; a.traverse(mesh => { if (mesh.isMesh && mesh.material.userData.windKind) am = mesh; }); b.traverse(mesh => { if (mesh.isMesh && mesh.material.userData.windKind) bm = mesh; });
  assert.equal(am.geometry, bm.geometry); assert.equal(am.material.map, bm.material.map); assert.notEqual(am.material, bm.material);
  const shader = () => ({ uniforms: {}, vertexShader: T.ShaderLib.lambert.vertexShader, fragmentShader: T.ShaderLib.lambert.fragmentShader }), sa = shader(), sb = shader();
  am.material.onBeforeCompile(sa); bm.material.onBeforeCompile(sb);
  assert.equal(sa.uniforms.nativeItemWet.value, .2); assert.equal(sb.uniforms.nativeItemWet.value, .8);
  assert.notEqual(sa.uniforms.nativeLeafTime, sb.uniforms.nativeLeafTime);
  assert.match(sa.vertexShader, /position\.y/); assert.match(sa.fragmentShader, /nativeItemWet/);
});

test('actual removable collection lids follow contents state and leave their cached source closed', async () => {
  const definition = getItemDefinition('antique-arita-coffee'), template = await geometryTemplate(definition), clone = cloneNativeModel(T, template);
  assert.equal(setNativeLidOpen(clone, definition, true), definition.removableParts.length);
  const parts = new Set(definition.removableParts);
  clone.traverse(mesh => { if (parts.has(mesh.userData.name || mesh.name)) assert.equal(mesh.visible, false); });
  template.traverse(mesh => { if (parts.has(mesh.userData.name || mesh.name)) assert.equal(mesh.visible, true); });
  assert.equal(setNativeLidOpen(clone, definition, false), definition.removableParts.length);
});

test('native lamp source parts retain their daylight colour and emit light at night', async () => {
  const library = createNativeItemLibrary(T, { getDefinition: getItemDefinition, getAssembly: getPlantAssembly, units: ITEM_METRES_TO_UNITS, loadModel: async (_T, item) => geometryTemplate(item) });
  const lamp = library.make({ type: 'solar-lamp' }); await nativeModelReady(lamp);
  const glowing = []; lamp.traverse(mesh => { if (mesh.isMesh && mesh.material.userData.finish === 'light') glowing.push(mesh.material); });
  assert.ok(glowing.length > 0);
  const pigment = glowing[0].color.getHexString(); library.updateAtmosphere({ night: 1 });
  assert.equal(glowing[0].emissiveIntensity, .85); assert.equal(glowing[0].color.getHexString(), pigment);
  library.updateAtmosphere({ night: 0 }); assert.equal(glowing[0].emissiveIntensity, 0);
});

test('seven trailing forms clear shallow/deep selected pots without reversing their thick leaf surfaces', async () => {
  function volume(position, range) {
    let volume = 0;
    for (let i = range.start; i < range.start + range.count; i += 3) {
      const a = new T.Vector3().fromBufferAttribute(position, i), b = new T.Vector3().fromBufferAttribute(position, i + 1), c = new T.Vector3().fromBufferAttribute(position, i + 2);
      volume += a.dot(b.cross(c)) / 6;
    }
    return volume;
  }
  const library = createNativeItemLibrary(T, { getDefinition: getItemDefinition, getAssembly: getPlantAssembly, units: ITEM_METRES_TO_UNITS, loadModel: async (_T, item) => geometryTemplate(item) });
  const trailing = ITEMS.filter(isTrailingPlant); assert.equal(trailing.length, 7);
  for (const definition of trailing) for (const pot of ['shallow', 'deep']) {
    const source = await geometryTemplate(definition), originals = new Map(); source.traverse(mesh => { if (mesh.isMesh) originals.set(mesh.name, mesh); });
    const plant = library.make({ type: definition.id, pot, seed: 123 }, { floorAt: () => .005 }); await nativeModelReady(plant);
    plant.traverse(mesh => {
      if (!mesh.isMesh || !/leaf|stem|branch|frond|petiole/.test(mesh.userData.part_role)) return;
      const original = originals.get(mesh.name);
      if (!original) return;
      for (const range of original.geometry.userData.nativePartRanges || []) {
        const before = volume(original.geometry.getAttribute('position'), range), after = volume(mesh.geometry.getAttribute('position'), range);
        if (Math.abs(before) > 1e-10) assert.ok(before * after >= -1e-15, definition.id + '/' + pot + '/' + mesh.name + ' thick surface');
      }
    });
  }
});
