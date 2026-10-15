import { prepareStructuralVisibility, updateStructuralVisibility, disposeStructuralVisibility } from './native-structural-visibility.mjs';

// One Three r160 runtime, one canonical texture per authoring family. GLB
// templates remain in metres; only their runtime instances receive unit scale.
const runtimes = new WeakMap();
const readiness = new WeakMap();
export function versionedNativeUrl(file, moduleUrl = import.meta.url) {
  const origin = new URL(moduleUrl), url = new URL(file, new URL('../', origin));
  if (origin.searchParams.has('v')) url.searchParams.set('v', origin.searchParams.get('v'));
  return url.href;
}
function runtime(T) {
  if (!runtimes.has(T)) runtimes.set(T, { models: new Map(), atlases: new Map(), materials: new Map(), errors: new Map(), pending: 0, loaded: 0 });
  return runtimes.get(T);
}
export function nativeModelStats(T) {
  const r = runtime(T);
  return { loaded: r.loaded, pending: r.pending, atlases: r.atlases.size, materials: r.materials.size, errors: [...r.errors].map(([id, error]) => ({ id, error })) };
}
function atlas(T, file) {
  const r = runtime(T), url = versionedNativeUrl(file);
  if (!r.atlases.has(url)) r.atlases.set(url, new T.TextureLoader().loadAsync(url).then(texture => {
    texture.colorSpace = T.SRGBColorSpace; texture.flipY = false;
    texture.minFilter = texture.magFilter = T.NearestFilter; texture.generateMipmaps = false;
    texture.userData.nativeItemShared = true; return texture;
  }));
  return r.atlases.get(url);
}
export const canonicalAtlasPlugin = texture => () => ({ name: 'UMWELT_native_canonical_atlas', loadTexture: () => Promise.resolve(texture) });
export async function loadNativeModel(T, definition, { windTime, windPower, weather } = {}) {
  if (!definition?.file || !definition?.atlas) throw new Error('Native model needs a file and canonical atlas.');
  const r = runtime(T), key = versionedNativeUrl(definition.file);
  if (!r.models.has(key)) {
    r.pending++;
    r.models.set(key, (async () => {
      const [{ GLTFLoader }, texture] = await Promise.all([import('./vendor/gltf/GLTFLoader.js'), atlas(T, definition.atlas)]);
      // Preserve the actual source GLB payload while bypassing its duplicate
      // embedded image decode. Every source image was checked against this
      // canonical family PNG; the parser receives the same shared GPU texture.
      const gltf = await new GLTFLoader().register(canonicalAtlasPlugin(texture)).loadAsync(key), oldTextures = new Set(), oldMaterials = new Set();
      gltf.scene.traverse(mesh => {
        if (!mesh.isMesh) return;
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.geometry.userData.nativeItemShared = true;
        const replace = old => {
          if (old.map && old.map !== texture) oldTextures.add(old.map);
          oldMaterials.add(old);
          const finish = String(mesh.userData.finish || old.name || ''), role = mesh.userData.part_role || '',
            windKind = definition.category === '植物' && /leaf|stem|petal|cactus|frond|petiole|branch|pinna|fruit|body/.test(role) ? /body|cactus/.test(role) ? 'rigid' : 'leaf' : null;
          const materialKey = [texture.uuid, finish, windKind, old.color?.getHexString(), old.opacity, old.transparent, old.side, old.emissive?.getHexString()].join(':');
          if (!r.materials.has(materialKey)) {
            const material = new T.MeshLambertMaterial({ map: texture, color: old.color || '#ffffff', flatShading: true,
              side: old.transparent ? T.DoubleSide : old.side, opacity: old.opacity, transparent: old.transparent, depthWrite: !old.transparent });
            if (old.emissive) material.emissive.copy(old.emissive);
            material.userData = { ...old.userData, nativeItemShared: true, finish, windKind };
            r.materials.set(materialKey, material);
          }
          return r.materials.get(materialKey);
        };
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map(replace) : replace(mesh.material);
      });
      for (const old of oldTextures) { old.dispose(); old.image?.close?.(); }
      for (const old of oldMaterials) old.dispose();
      if (definition.family === 'plants-retained') {
        const { mergeGeometries } = await import('./vendor/gltf/BufferGeometryUtils.js');
        mergeNativePlantParts(T, gltf.scene, mergeGeometries);
      }
      gltf.scene.userData.nativeDefinition = { id: definition.modelId || definition.id, family: definition.family, source: 'Blender', textureAuthor: 'Pixelorama', texelsPerMetre: 16 };
      r.loaded++; return gltf.scene;
    })().catch(error => { r.errors.set(definition.modelId || definition.id, error.message); throw error; }).finally(() => r.pending--));
  }
  return r.models.get(key);
}

export function mergeNativePlantParts(T, root, mergeGeometries) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(), groups = new Map(), originals = new Set();
  root.traverse(mesh => {
    if (!mesh.isMesh || Array.isArray(mesh.material)) return;
    const role = mesh.userData.part_role || '', key = mesh.material.uuid + ':' + role;
    if (!groups.has(key)) groups.set(key, { material: mesh.material, role, meshes: [], geometries: [] });
    const record = groups.get(key), geometry = mesh.geometry.clone();
    geometry.applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));
    // Normalize interleaved/indexed exporters before merging. Face-local UV
    // vertices remain duplicated, preserving flat faces and every atlas chart.
    const expanded = geometry.index ? geometry.toNonIndexed() : geometry;
    if (expanded !== geometry) geometry.dispose();
    for (const [name, attribute] of Object.entries(expanded.attributes)) if (attribute.isInterleavedBufferAttribute) {
      const array = new Float32Array(attribute.count * attribute.itemSize);
      for (let i = 0; i < attribute.count; i++) for (let k = 0; k < attribute.itemSize; k++) array[i * attribute.itemSize + k] = attribute[['getX', 'getY', 'getZ', 'getW'][k]](i);
      expanded.setAttribute(name, new T.BufferAttribute(array, attribute.itemSize, attribute.normalized));
    }
    record.meshes.push(mesh); record.geometries.push(expanded); originals.add(mesh.geometry);
  });
  let mergedParts = 0;
  for (const record of groups.values()) {
    const geometry = record.geometries.length === 1 ? record.geometries[0] : mergeGeometries(record.geometries, false);
    if (!geometry) throw new Error('Native plant charts could not be merged for ' + record.role);
    geometry.userData.nativeItemShared = true;
    let offset = 0;
    geometry.userData.nativePartRanges = record.geometries.map(part => {
      const range = { start: offset, count: part.getAttribute('position').count }; offset += range.count; return range;
    });
    const mesh = new T.Mesh(geometry, record.material);
    mesh.name = record.meshes[0].name; mesh.userData = { ...record.meshes[0].userData, nativeSourceParts: record.meshes.length };
    mesh.castShadow = mesh.receiveShadow = true; root.add(mesh);
    record.meshes.forEach(source => source.removeFromParent());
    if (record.geometries.length > 1) record.geometries.forEach(source => source.dispose());
    mergedParts++;
  }
  originals.forEach(geometry => geometry.dispose());
  root.userData.nativePlantParts = { source: [...groups.values()].reduce((n, g) => n + g.meshes.length, 0), merged: mergedParts };
  return root.userData.nativePlantParts;
}
export function cloneNativeModel(T, template, { structural = true, materialTransform } = {}) {
  const clone = template.clone(true);
  clone.userData.nativeItemRoot = true;
  if (materialTransform) clone.traverse(mesh => { if (mesh.isMesh) mesh.material = Array.isArray(mesh.material) ? mesh.material.map(materialTransform) : materialTransform(mesh.material); });
  if (structural) prepareStructuralVisibility(T, clone);
  return clone;
}
export const nativeModelReady = root => readiness.get(root) || Promise.resolve(root);

export function setNativeLidOpen(root, definition, open) {
  const parts = new Set(definition?.removableParts || []);
  if (!parts.size) return 0;
  let count = 0;
  root.traverse(node => {
    if (parts.has(node.userData.name || node.name)) { node.visible = !open; count++; }
  });
  return count;
}

export function soilChart(source) {
  const uv = source.geometry.getAttribute('uv'), normal = source.geometry.getAttribute('normal');
  let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
  for (let i = 0; i < uv.count; i++) if (normal.getY(i) > .9) {
    minU = Math.min(minU, uv.getX(i)); maxU = Math.max(maxU, uv.getX(i));
    minV = Math.min(minV, uv.getY(i)); maxV = Math.max(maxV, uv.getY(i));
  }
  const map = (Array.isArray(source.material) ? source.material[0] : source.material).map,
    width = map.image.width, height = map.image.height;
  return { origin: [Math.round(minU * width), Math.round(minV * height)],
    size: [Math.max(1, Math.ceil((maxU - minU) * width - .0001)), Math.max(1, Math.ceil((maxV - minV) * height - .0001))], atlas: [width, height] };
}
export function createSoilMaterial(T, source, weather) {
  if (!source) throw new Error('A rooted native plant needs its native soil chart.');
  const chart = soilChart(source), material = (Array.isArray(source.material) ? source.material[0] : source.material).clone();
  material.userData = { ...material.userData, nativeItemShared: false, nativeSoilChart: chart, texelsPerMetre: 16 };
  material.onBeforeCompile = shader => {
    shader.uniforms.soilChart = { value: new T.Vector4(...chart.origin, ...chart.size) };
    shader.uniforms.soilAtlas = { value: new T.Vector2(...chart.atlas) };
    shader.uniforms.nativeSoilWet = weather?.wet || { value: 0 };
    shader.vertexShader = 'varying vec3 nativeSoilPoint; varying vec3 nativeSoilNormal;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nnativeSoilPoint = position; nativeSoilNormal = normal;');
    shader.fragmentShader = 'uniform vec4 soilChart; uniform vec2 soilAtlas; uniform float nativeSoilWet; varying vec3 nativeSoilPoint; varying vec3 nativeSoilNormal;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
      vec3 n = normalize(nativeSoilNormal);
      vec2 plane = abs(n.y) > .9 ? nativeSoilPoint.xz : vec2(atan(nativeSoilPoint.z,nativeSoilPoint.x) * length(nativeSoilPoint.xz), nativeSoilPoint.y);
      vec2 cell = mod(floor(plane * 16.), soilChart.zw);
      diffuseColor *= texture2D(map, (soilChart.xy + cell + .5) / soilAtlas);
      diffuseColor.rgb *= 1. - nativeSoilWet * .16;
      #endif`);
  };
  material.customProgramCacheKey = () => 'native-item-soil-16'; return material;
}

// Flexible trailing growth settles on its actual bearing surface. Work only on
// detached instance geometry: source positions, UVs and other plants survive.
export function settleTrailingGeometry(T, root, floorAt, vessel = null) {
  let changed = 0;
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(), point = new T.Vector3();
  root.traverse(mesh => {
    if (!mesh.isMesh || !/leaf|stem|branch|frond|petiole/.test(mesh.userData.part_role || '')) return;
    const toRoot = inverse.clone().multiply(mesh.matrixWorld), toMesh = toRoot.clone().invert();
    const source = mesh.geometry.getAttribute('position');
    let geometry = null, position = null;
    if (/leaf|frond|pinna|flattened-stem-segment/.test(mesh.userData.part_role || '')) {
      const ranges = mesh.geometry.userData.nativePartRanges || [{ start: 0, count: source.count }];
      for (const range of ranges) {
        const points = []; let cx = 0, cz = 0;
        for (let i = range.start; i < range.start + range.count; i++) {
          const p = new T.Vector3().fromBufferAttribute(source, i).applyMatrix4(toRoot);
          points.push(p); cx += p.x / range.count; cz += p.z / range.count;
        }
        let dx = 0, dz = 0, dy = 0;
        if (vessel) {
          const length = Math.hypot(cx - vessel.x, cz - vessel.z), ux = (cx - vessel.x) / (length || 1), uz = (cz - vessel.z) / (length || 1),
            rx = vessel.width / 2 + .005, rz = vessel.depth / 2 + .005;
          let offset = 0;
          if (length > .035) for (const p of points) if (p.y < vessel.soilTop - .004) {
            const x = p.x - vessel.x, z = p.z - vessel.z, c = (x / rx) ** 2 + (z / rz) ** 2 - 1;
            if (c >= 0) continue;
            const a = (ux / rx) ** 2 + (uz / rz) ** 2, b = 2 * (x * ux / rx ** 2 + z * uz / rz ** 2);
            offset = Math.max(offset, (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a));
          }
          dx = ux * offset; dz = uz * offset;
        }
        for (const p of points) { const floor = floorAt(p.x + dx, p.z + dz); if (Number.isFinite(floor)) dy = Math.max(dy, floor - p.y); }
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) < 1e-8) continue;
        if (!geometry) { geometry = mesh.geometry.clone(); geometry.userData = { ...geometry.userData, nativeItemShared: false }; position = geometry.getAttribute('position'); }
        points.forEach((p, index) => { p.add(new T.Vector3(dx, dy, dz)).applyMatrix4(toMesh); position.setXYZ(range.start + index, p.x, p.y, p.z); changed++; });
      }
    } else for (let i = 0; i < source.count; i++) {
      point.fromBufferAttribute(source, i).applyMatrix4(toRoot);
      let displaced = false;
      if (vessel && point.y < vessel.soilTop - .004) {
        const dx = point.x - vessel.x, dz = point.z - vessel.z, radial = Math.hypot(dx, dz),
          radius = Math.hypot(dx / (vessel.width / 2 + .005), dz / (vessel.depth / 2 + .005));
        // Root cores stay in the soil. Downward branches beyond the core clear
        // the selected vessel's shell before settling on the bearing surface.
        if (radial > .035 && radius < 1) { const amount = Math.min(1, (vessel.soilTop - .004 - point.y) / .024); point.x += (dx / radius - dx) * amount; point.z += (dz / radius - dz) * amount; displaced = true; }
      }
      const minimum = floorAt(point.x, point.z);
      if (!displaced && (!Number.isFinite(minimum) || point.y >= minimum)) continue;
      if (!geometry) { geometry = mesh.geometry.clone(); geometry.userData = { ...geometry.userData, nativeItemShared: false }; position = geometry.getAttribute('position'); }
      if (Number.isFinite(minimum)) point.y = Math.max(point.y, minimum);
      point.applyMatrix4(toMesh); position.setXYZ(i, point.x, point.y, point.z); changed++;
    }
    if (geometry) { position.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere(); mesh.geometry = geometry; }
  });
  return changed;
}

export function createNativeItemLibrary(T, { getDefinition, getAssembly, units, windTime, windPower, weather, loadModel = loadNativeModel, onChange = () => {} } = {}) {
  const templates = new Map(), roots = new Set(), appearanceMaterials = new Map();
  function appearance(base) {
    if (appearanceMaterials.has(base)) return appearanceMaterials.get(base);
    const material = base.clone(), finish = material.userData.finish || '', botanical = !!material.userData.windKind;
    material.userData = { ...material.userData, nativeItemShared: true };
    material.onBeforeCompile = shader => {
      if (weather) {
        shader.uniforms.nativeItemWet = weather.wet;
        shader.fragmentShader = 'uniform float nativeItemWet;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 1. - nativeItemWet * .10;');
      }
      if (!botanical || !windTime || !windPower) return;
      shader.uniforms.nativeLeafTime = windTime; shader.uniforms.nativeLeafWind = windPower;
      shader.vertexShader = 'uniform float nativeLeafTime; uniform float nativeLeafWind;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\ntransformed.x += sin(nativeLeafTime * 1.8 + position.y * .7) * nativeLeafWind * ${material.userData.windKind === 'rigid' ? '.003' : '.015'} * max(0., position.y - .20);`);
    };
    material.customProgramCacheKey = () => 'native-item-' + (botanical ? 'wind-' + material.userData.windKind : 'static');
    appearanceMaterials.set(base, material); return material;
  }
  const clone = (template, structural = true) => cloneNativeModel(T, template, { structural, materialTransform: appearance });
  const options = { windTime, windPower, weather };
  function preload(o) {
    const definition = getDefinition(typeof o === 'string' ? o : o.type);
    if (!definition) return Promise.reject(new Error('No native catalog model for ' + (o.type || o)));
    const assembly = definition.category === '植物' ? getAssembly(definition.id, o.pot) : null;
    const definitions = assembly ? [definition, assembly.pot] : [definition];
    const jobs = definitions.map(d => loadModel(T, d, options).then(template => { templates.set(d.modelId || d.id, template); onChange(); return template; }));
    onChange(); return Promise.all(jobs).finally(onChange);
  }
  function isReady(o) {
    const definition = getDefinition(o.type || o), assembly = definition?.category === '植物' ? getAssembly(definition.id, o.pot) : null;
    return !!definition && [definition, ...(assembly ? [assembly.pot] : [])].every(d => templates.has(d.modelId || d.id));
  }
  function make(o, { floorAt } = {}) {
    const root = new T.Group(); root.userData.nativeItemRoot = true; root.userData.animated = true; roots.add(root);
    const populate = () => {
      if (root.userData.nativeDisposed) return root;
      const definition = getDefinition(o.type), assembly = definition.category === '植物' ? getAssembly(definition.id, o.pot) : null;
      const content = new T.Group(); content.scale.setScalar(units); root.add(content);
      if (!assembly) content.add(clone(templates.get(definition.modelId || definition.id)));
      else {
        content.add(clone(templates.get(assembly.pot.modelId || assembly.pot.id)));
        const foliage = clone(templates.get(definition.modelId || definition.id), false);
        const removed = [];
        foliage.traverse(node => { if (['review-pot', 'review-soil'].includes(node.userData.part_role)) removed.push(node); });
        const reviewSoil = removed.find(node => node.userData.part_role === 'review-soil');
        removed.forEach(node => node.removeFromParent());
        const center = definition.reviewVesselCenter || [0, 0], floorCenter = assembly.opening.center || [0, 0];
        foliage.position.set(-center[0], assembly.foliageOffset[1], center[1]);
        const rooted = new T.Group(); rooted.position.set(floorCenter[0], 0, -floorCenter[1]); rooted.add(foliage); content.add(rooted);
        // Seed controls the rooted specimen's orientation, while the selected
        // vessel and its real bearing position remain stable.
        rooted.rotation.y = (((Math.imul((o.seed || 1835) >>> 0, 2654435761) >>> 0) / 4294967296) - .5) * Math.PI / 2;
        if (isTrailingPlant(definition) && floorAt) settleTrailingGeometry(T, content, floorAt, {
          soilTop: assembly.soilTop, x: floorCenter[0], z: -floorCenter[1], width: assembly.pot.width, depth: assembly.pot.depth });
        const { width, depth, shape } = assembly.opening;
        const geometry = shape === 'rectangle' ? new T.BoxGeometry(width * .94, .025, depth * .94) : new T.CylinderGeometry(.5, .5, .025, 12);
        if (shape !== 'rectangle') geometry.scale(width * .94, 1, depth * .94);
        const material = createSoilMaterial(T, reviewSoil, weather);
        const soil = new T.Mesh(geometry, material); soil.position.set(floorCenter[0], assembly.soilTop - .0125, -floorCenter[1]); soil.receiveShadow = true;
        soil.userData.part_role = 'runtime-soil'; content.add(soil);
        root.userData.plantAssembly = { pot: assembly.pot.id, soilTop: assembly.soilTop, removedReviewMeshes: removed.length };
      }
      root.userData.nativeLoaded = true; root.userData.modelId = definition.modelId || definition.id;
      setNativeLidOpen(root, definition, !!root.userData.lidOpen);
      root.userData.source = 'Blender'; root.userData.textureAuthor = 'Pixelorama'; onChange(); return root;
    };
    const ready = isReady(o) ? Promise.resolve(populate()) : preload(o).then(populate);
    readiness.set(root, ready); ready.catch(error => { root.userData.nativeError = error.message; onChange(); });
    return root;
  }
  function dispose(root) {
    root.traverse(node => { node.userData.nativeDisposed = true; roots.delete(node); if (node.userData.nativeItemRoot) disposeStructuralVisibility(node); });
  }
  function updateVisibility(camera, sourceHeight, enabled) {
    let changed = 0, compensated = 0;
    for (const root of roots) {
      if (!root.parent || !root.userData.nativeLoaded) continue;
      const worldPerSample = camera.isOrthographicCamera ? (camera.top - camera.bottom) / camera.zoom / sourceHeight
        : 2 * camera.position.distanceTo(root.getWorldPosition(new T.Vector3())) * Math.tan(T.MathUtils.degToRad(camera.fov / 2)) / camera.zoom / sourceHeight;
      root.traverse(node => {
        if (!node.userData.nativeItemRoot || node === root) return;
        // Botanical clones deliberately have no structural visibility state.
        if (node.userData.nativeDefinition?.family === 'plants-retained') return;
        const state = updateStructuralVisibility(node, { worldPerSample, enabled }); changed += state.changed; compensated += state.compensated;
      });
    }
    return { changed, compensated };
  }
  function updateAtmosphere(atmosphere, indoor = false) {
    const night = Math.max(0, Math.min(1, atmosphere.night || 0));
    for (const material of appearanceMaterials.values()) {
      // The source finish "light" marks a bulb; steel-light and wood-light
      // describe pale pigments and must remain ordinary lit surfaces.
      const glowing = material.userData.finish === 'light';
      if (glowing) { material.emissive.set('#e7b96c'); material.emissiveIntensity = night * .85; }
    }
  }
  function setContents(root, occupied) {
    root.userData.lidOpen = occupied;
    return setNativeLidOpen(root, getDefinition(root.userData.modelId), occupied);
  }
  return { preload, isReady, make, dispose, updateVisibility, updateAtmosphere, setContents, get stats() { return nativeModelStats(T); } };
}

export const isTrailingPlant = definition => definition?.trailing || definition?.botany?.trailing || definition?.morphologyWorkflowGroup === 'trailing';
