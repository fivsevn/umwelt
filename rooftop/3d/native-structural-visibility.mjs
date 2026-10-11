/* Display-only compensation for thin, real furniture structure.
 * Call prepare once on each cloned preview object, after loading its real GLB.
 * Call update before drawing. worldPerSample is the orthographic world height
 * divided by the existing outdoorRaster source height (including camera zoom).
 * Neither this module nor its callers need to change the raster/pixel grid.
 * Source view: update(root, {enabled:false}) restores exact source attributes.
 */
const roots = new WeakMap();
const canonicalGeometry = new WeakMap();

// A six-millimetre grid stays a grid. Primary structural members reach 1.15
// raster samples; dense shelf grids use a lighter floor and a much smaller cap.
const POLICY = Object.freeze({
  structuralSamples: 1.15, gridSamples: .80,
  maximumScale: 8, gridMaximumScale: 1.75,
  maximumExtraRadiusMetres: .030,
  roles: Object.freeze(['post', 'leg', 'shelf-edge', 'joint', 'brace', 'support',
    'frame', 'rail', 'rib', 'wood-edge', 'shelf-grid']),
});
const token = word => new RegExp(`(?:^|[\\s:_/-])(?:${word})(?=$|[\\s:_/-])`, 'i');
const structuralRole = token('post|leg|shelf-edge|joint|brace|support|frame|rail|rib|wood-edge');
const gridRole = token('shelf-grid|grid-depth|grid-cross');
const excludedRole = /leaf|petal|stem|soil|cloth|fabric|cushion|glass|water|blade|pot-shell|ceramic|porcelain/i;
const excludedFinish = /^(?:cloth|leather|leaf|stem|soil|glass|water|porcelain|ceramic)(?:$|[-:])/i;

function arrayOf(attribute) {
  if (!attribute) return null;
  const values = new Float32Array(attribute.count * attribute.itemSize);
  for (let i = 0; i < attribute.count; i++) {
    values[i * attribute.itemSize] = attribute.getX(i);
    if (attribute.itemSize > 1) values[i * attribute.itemSize + 1] = attribute.getY(i);
    if (attribute.itemSize > 2) values[i * attribute.itemSize + 2] = attribute.getZ(i);
    if (attribute.itemSize > 3) values[i * attribute.itemSize + 3] = attribute.getW(i);
  }
  return values;
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const subtract = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

function pca(points) {
  const center = [0, 0, 0];
  for (const p of points) for (let k = 0; k < 3; k++) center[k] += p[k] / points.length;
  const matrix = Array.from({length: 3}, () => [0, 0, 0]);
  for (const p of points) {
    const d = subtract(p, center);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) matrix[i][j] += d[i] * d[j] / points.length;
  }
  const vectors = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let iteration = 0; iteration < 32; iteration++) {
    let p = 0, q = 1;
    for (const [i, j] of [[0, 2], [1, 2]]) if (Math.abs(matrix[i][j]) > Math.abs(matrix[p][q])) [p, q] = [i, j];
    if (Math.abs(matrix[p][q]) < 1e-15) break;
    const angle = .5 * Math.atan2(2 * matrix[p][q], matrix[q][q] - matrix[p][p]);
    const c = Math.cos(angle), s = Math.sin(angle), pp = matrix[p][p], qq = matrix[q][q], pq = matrix[p][q];
    matrix[p][p] = c*c*pp - 2*s*c*pq + s*s*qq;
    matrix[q][q] = s*s*pp + 2*s*c*pq + c*c*qq;
    matrix[p][q] = matrix[q][p] = 0;
    for (let k = 0; k < 3; k++) {
      if (k !== p && k !== q) {
        const kp = matrix[k][p], kq = matrix[k][q];
        matrix[k][p] = matrix[p][k] = c*kp - s*kq;
        matrix[k][q] = matrix[q][k] = s*kp + c*kq;
      }
      const vp = vectors[k][p], vq = vectors[k][q];
      vectors[k][p] = c*vp - s*vq; vectors[k][q] = s*vp + c*vq;
    }
  }
  const eigen = [0, 1, 2].sort((a, b) => matrix[b][b] - matrix[a][a]);
  const axes = eigen.map(i => vectors.map(row => row[i]));
  const spans = axes.map(axis => {
    const values = points.map(p => dot(subtract(p, center), axis));
    return Math.max(...values) - Math.min(...values);
  });
  return {center, axes, spans};
}

function uniquePositions(position) {
  // UV charts duplicate face vertices; they must not bias the PCA or split the
  // same physical cross-section into unrelated surface fragments.
  const points = [], map = new Map(), mapping = new Uint32Array(position.length / 3);
  let largest = 0;
  for (const value of position) largest = Math.max(largest, Math.abs(value));
  const epsilon = Math.max(1e-8, largest * 1e-7);
  for (let i = 0; i < mapping.length; i++) {
    const p = Array.from(position.subarray(i * 3, i * 3 + 3));
    const key = p.map(v => Math.round(v / epsilon)).join(',');
    if (!map.has(key)) {map.set(key, points.length); points.push(p);}
    mapping[i] = map.get(key);
  }
  return {points, mapping};
}

function tubeSections(geometry, unique) {
  // For bent/closed tube frames, source perimeter edges are the shortest
  // incident edges. Their connected rings provide actual local cross-sections;
  // a global bounding-box enlargement would inflate the whole furniture loop.
  const {points, mapping} = unique, edges = new Map(), minimum = new Float64Array(points.length).fill(Infinity);
  const index = geometry.index, count = index ? index.count : mapping.length;
  const vertex = i => mapping[index ? index.getX(i) : i];
  for (let i = 0; i + 2 < count; i += 3) {
    const triangle = [vertex(i), vertex(i + 1), vertex(i + 2)];
    for (let j = 0; j < 3; j++) {
      const a = triangle[j], b = triangle[(j + 1) % 3];
      if (a === b) continue;
      const key = `${Math.min(a,b)}:${Math.max(a,b)}`;
      if (edges.has(key)) continue;
      const length = Math.hypot(...subtract(points[a], points[b]));
      edges.set(key, {a, b, length}); minimum[a] = Math.min(minimum[a], length); minimum[b] = Math.min(minimum[b], length);
    }
  }
  const parents = Array.from({length: points.length}, (_, i) => i);
  function find(i) {while (parents[i] !== i) {parents[i] = parents[parents[i]]; i = parents[i];} return i;}
  for (const {a, b, length} of edges.values()) if (length <= Math.min(minimum[a], minimum[b]) * 1.4 + 1e-8) parents[find(a)] = find(b);
  const groups = new Map();
  for (let i = 0; i < points.length; i++) {const key = find(i); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(i);}
  const sections = [];
  for (const ids of groups.values()) {
    if (ids.length < 5) continue;
    const fit = pca(ids.map(i => points[i]));
    if (fit.spans[1] < 1e-6 || fit.spans[0] / fit.spans[1] > 3 || fit.spans[2] > fit.spans[1] * .08) continue;
    sections.push({...fit, ids, expand: [0, 1]});
  }
  return sections.reduce((sum, s) => sum + s.ids.length, 0) >= points.length * .95 ? sections : null;
}

function candidateRole(mesh) {
  const data = mesh.userData || {}, asset = String(data.asset_id || '');
  const role = String(data.part_role || ''), component = String(mesh.name || '').split('/').pop();
  const finish = String(data.finish || ''), label = `${role} ${component}`;
  if (mesh.isSkinnedMesh || Object.keys(mesh.geometry.morphAttributes || {}).length ||
      /^(?:weapon-|plant-)/.test(asset) || excludedRole.test(label) || excludedFinish.test(finish)) return null;
  const grid = gridRole.test(label);
  if (!grid && !structuralRole.test(label) && !(token('foot').test(role) && token('leg').test(component))) return null;
  return {role, component, grid};
}

function eligiblePlan(mesh, source, candidate) {
  const {role, component, grid} = candidate, label = `${role} ${component}`;
  const unique = uniquePositions(source.position);
  if (unique.points.length < 5) return null;
  const fit = pca(unique.points), order = [0, 1, 2].sort((a, b) => fit.spans[b] - fit.spans[a]);
  const major = fit.spans[order[0]], middle = fit.spans[order[1]];
  if (major < 1e-7 || middle < 1e-7) return null;
  let sections, kind;
  if (token('joint').test(label) && major <= .12) {
    sections = [{...fit, ids: unique.points.map((_, i) => i), expand: [0, 1, 2]}]; kind = 'joint';
  } else if (major / middle >= 2.75 && middle <= .18) {
    sections = [{...fit, ids: unique.points.map((_, i) => i), expand: order.slice(1)}]; kind = 'linear';
  } else if (!grid && token('frame|support|rail').test(label)) {
    sections = tubeSections(mesh.geometry, unique); kind = 'tube-sections';
    if (!sections) return null;
  } else return null;
  return {unique, sections, kind, role: role || component, grid};
}

function sourceOf(geometry) {
  if (canonicalGeometry.has(geometry)) return canonicalGeometry.get(geometry);
  const source = {position: arrayOf(geometry.getAttribute('position')), normal: arrayOf(geometry.getAttribute('normal'))};
  canonicalGeometry.set(geometry, source);
  return source;
}

export function prepareStructuralVisibility(THREE, root) {
  if (roots.has(root)) return roots.get(root).prepared;
  const state = {THREE, meshes: [], prepared: null};
  let examined = 0;
  root.traverse(mesh => {
    if (!mesh.isMesh || !mesh.geometry?.getAttribute('position')) return;
    examined++;
    const candidate = candidateRole(mesh);
    if (!candidate) return;
    const source = sourceOf(mesh.geometry), plan = eligiblePlan(mesh, source, candidate);
    if (!plan) return;
    // Object3D.clone shares its geometries. Always detach before writing, even
    // when another preview was prepared from an already-compensated clone.
    const geometry = mesh.geometry.clone();
    geometry.userData = {...geometry.userData, structuralVisibilityPrivate: true};
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(source.position.slice(), 3));
    if (source.normal) geometry.setAttribute('normal', new THREE.Float32BufferAttribute(source.normal.slice(), 3));
    canonicalGeometry.set(geometry, source); mesh.geometry = geometry;
    state.meshes.push({mesh, geometry, source, ...plan, active: false, signature: ''});
  });
  const roles = {};
  for (const record of state.meshes) roles[record.role] = (roles[record.role] || 0) + 1;
  state.prepared = Object.freeze({examined, eligible: state.meshes.length, roles: Object.freeze(roles), policy: POLICY});
  roots.set(root, state); return state.prepared;
}

function worldLength(matrix, axis) {
  const e = matrix.elements;
  return Math.hypot(e[0]*axis[0] + e[4]*axis[1] + e[8]*axis[2],
    e[1]*axis[0] + e[5]*axis[1] + e[9]*axis[2], e[2]*axis[0] + e[6]*axis[1] + e[10]*axis[2]);
}
function restore(record) {
  if (!record.active) return false;
  const geometry = record.mesh.geometry;
  geometry.getAttribute('position').array.set(record.source.position); geometry.getAttribute('position').needsUpdate = true;
  if (record.source.normal) {geometry.getAttribute('normal').array.set(record.source.normal); geometry.getAttribute('normal').needsUpdate = true;}
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  record.active = false; record.signature = ''; return true;
}

export function updateStructuralVisibility(root, {worldPerSample = 0, enabled = true} = {}) {
  const state = roots.get(root);
  if (!state) throw new Error('Prepare structural visibility on this preview object before updating it.');
  const active = enabled && Number.isFinite(worldPerSample) && worldPerSample > 0;
  root.updateWorldMatrix(true, true);
  let changed = 0, compensated = 0, limited = 0, maximumScaleApplied = 1;
  for (const record of state.meshes) {
    if (!active) {if (restore(record)) changed++; continue;}
    const target = worldPerSample * (record.grid ? POLICY.gridSamples : POLICY.structuralSamples);
    const cap = record.grid ? POLICY.gridMaximumScale : POLICY.maximumScale;
    let enlarged = false, capped = false;
    const scales = record.sections.map(section => section.axes.map((axis, k) => {
      if (!section.expand.includes(k) || section.spans[k] < 1e-7) return 1;
      const width = section.spans[k] * worldLength(record.mesh.matrixWorld, axis);
      if (width <= 1e-9) return 1;
      const requested = Math.max(1, target / width);
      const scale = Math.min(requested, cap, 1 + 2 * POLICY.maximumExtraRadiusMetres / width);
      enlarged ||= scale > 1.000001; capped ||= requested > scale + 1e-6;
      maximumScaleApplied = Math.max(maximumScaleApplied, scale); return scale;
    }));
    if (!enlarged) {if (restore(record)) changed++; continue;}
    compensated++; if (capped) limited++;
    const signature = scales.flat().map(n => n.toFixed(7)).join(',');
    if (signature === record.signature && record.active) continue;
    const points = record.unique.points.map(p => p.slice());
    record.sections.forEach((section, si) => {
      for (const index of section.ids) {
        const delta = subtract(record.unique.points[index], section.center), point = section.center.slice();
        for (let k = 0; k < 3; k++) {
          const extent = dot(delta, section.axes[k]) * scales[si][k];
          for (let j = 0; j < 3; j++) point[j] += section.axes[k][j] * extent;
        }
        points[index] = point;
      }
    });
    const geometry = record.mesh.geometry, position = geometry.getAttribute('position');
    for (let i = 0; i < position.count; i++) position.setXYZ(i, ...points[record.unique.mapping[i]]);
    position.needsUpdate = true;
    if (record.source.normal) geometry.computeVertexNormals();
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    record.active = true; record.signature = signature; changed++;
  }
  return Object.freeze({enabled: Boolean(active), eligible: state.meshes.length, changed, compensated,
    limited, maximumScaleApplied, structuralSamples: POLICY.structuralSamples, gridSamples: POLICY.gridSamples});
}

// Remove a preview object from its scene, then release only this module's owned
// geometry clones. Shared model-cache geometry, materials and textures survive.
export function disposeStructuralVisibility(root) {
  const state = roots.get(root);
  if (!state) return 0;
  const geometries = new Set();
  for (const record of state.meshes) {
    if (record.mesh.geometry === record.geometry) restore(record);
    geometries.add(record.geometry);
  }
  for (const geometry of geometries) {geometry.dispose(); canonicalGeometry.delete(geometry);}
  roots.delete(root);
  return geometries.size;
}
