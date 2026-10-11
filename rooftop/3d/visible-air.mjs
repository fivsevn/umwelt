const clamp = (value, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const hash = value => {
  let n = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
};
const unit = value => hash(value) / 4294967296;
const cellSeed = (x, y, z, level, seed) => hash(
  Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791) ^
  Math.imul(level + 1, 2654435761) ^ seed,
);

// Air has world coordinates and depth, just like the building. The camera only
// chooses which fixed world cells need a small live pool; it never transforms
// an existing particle's anchor. No city-wide geometry or particle array exists.
export function createVisibleAirField(T, options = {}) {
  const capacity = Math.max(1, Math.floor(options.capacity || 112)),
    seed = Number(options.seed) | 0,
    baseSize = Math.max(1, Number(options.cellSize) || 8),
    maximumDepth = Math.max(4, Number(options.maxDistance) || 320),
    minimumDepth = Math.max(.01, Number(options.nearDistance) || .5),
    safety = Math.max(1.04, Number(options.safety) || 1.18),
    fadeSeconds = Math.max(.05, Number(options.fadeSeconds) || .22),
    motionRadius = Math.max(0, options.motionRadius === undefined ? 8 : Number(options.motionRadius)),
    maxCells = Math.max(64, Math.floor(options.maxCells || 512)),
    maxSamples = Math.max(256, Math.floor(options.maxSamples || 8192)),
    maxCandidates = Math.max(capacity, Math.floor(options.maxCandidates || Math.max(1024, capacity * 5))),
    initialBounds = options.bounds || [-Infinity, -Infinity, -Infinity, Infinity, Infinity, Infinity],
    bounds = [...initialBounds],
    boundsY = options.boundsY || [bounds[1], bounds[4]],
    slots = Array.from({ length: capacity }, () => null),
    projection = new T.Matrix4(), projected = new T.Vector4(),
    local = new T.Vector3(), world = new T.Vector3(),
    bucketCount = 60;
  let camera = null, lastTime = null, lastScan = -Infinity, scanKey = "",
    candidates = [], allocated = new Set(), stats = {}, activeDepth = maximumDepth, budget = capacity, sampleCalls = 0,
    ellipse = null;

  function visibility(position) {
    if (!camera || !position || position.length < 3 || !position.every(Number.isFinite)) return 0;
    projected.set(position[0], position[1], position[2], 1).applyMatrix4(projection);
    // Perspective particles behind the eye cannot borrow the mirrored frustum.
    if (projected.w <= 0) return 0;
    const x = Math.abs(projected.x / projected.w), y = Math.abs(projected.y / projected.w),
      edge = ellipse ? Math.hypot(x / ellipse[0], y / ellipse[1]) : Math.max(x, y);
    if (edge >= safety) return 0;
    local.set(...position).applyMatrix4(camera.matrixWorldInverse);
    const depth = -local.z;
    if (depth <= minimumDepth || depth >= activeDepth) return 0;
    return smooth((safety - edge) / (safety - 1)) *
      smooth((depth - minimumDepth) / Math.min(1, activeDepth * .02)) *
      smooth((activeDepth - depth) / (activeDepth * .12));
  }

  function sample(entry, time, sampler) {
    sampleCalls++;
    const result = sampler ? sampler(entry, time) : entry.anchor;
    const position = Array.isArray(result) || ArrayBuffer.isView(result) ? Array.from(result) : result?.position;
    if (!position || position.length < 3 || !position.every(Number.isFinite)) return false;
    entry.sample = result;
    entry.sampleTime = time;
    entry.position = position;
    entry.visibility = visibility(position);
    entry.depth = -local.z;
    entry.bucket = Math.max(0, Math.min(4, Math.floor((projected.x / projected.w + 1) * 2.5))) +
      Math.max(0, Math.min(3, Math.floor((projected.y / projected.w + 1) * 2))) * 5 +
      (entry.depth < activeDepth * .25 ? 0 : entry.depth < activeDepth * .65 ? 1 : 2) * 20;
    return true;
  }

  function cornerAt(x, y, depth) {
    local.set(x, y, 0).applyMatrix4(camera.projectionMatrixInverse);
    if (camera.isPerspectiveCamera) local.multiplyScalar(-depth / local.z);
    else local.z = -depth;
    return world.copy(local).applyMatrix4(camera.matrixWorld);
  }

  function scan(time, sampler) {
    const pool = new Map(), depths = [minimumDepth, 8, 24, 72, 192, activeDepth]
      .filter((value, i, array) => value <= activeDepth && (i === 0 || value > array[i - 1])),
      // Narrow neighbour optics cut through only a few coarse world cells.
      // A fixed set of sub-cell identities prevents an empty pencil of air;
      // this is birth-time search, not a larger live or uploaded buffer.
      samplesPerCell = Math.max(16, Math.ceil(budget / 64));
    if (depths.at(-1) !== activeDepth) depths.push(activeDepth);
    let visited = 0, tested = 0;
    for (let band = 1; band < depths.length; band++) {
      const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      const halfX = safety * (ellipse?.[0] || 1), halfY = safety * (ellipse?.[1] || 1);
      for (const depth of [depths[band - 1], depths[band]]) for (const x of [-halfX, halfX]) for (const y of [-halfY, halfY]) {
        const point = cornerAt(x, y, depth).toArray();
        for (let axis = 0; axis < 3; axis++) { lo[axis] = Math.min(lo[axis], point[axis] - motionRadius); hi[axis] = Math.max(hi[axis], point[axis] + motionRadius); }
      }
      for (let axis = 0; axis < 3; axis++) { lo[axis] = Math.max(lo[axis], bounds[axis]); hi[axis] = Math.min(hi[axis], bounds[axis + 3]); }
      lo[1] = Math.max(lo[1], boundsY[0]); hi[1] = Math.min(hi[1], boundsY[1]);
      if (lo.some((value, axis) => value > hi[axis])) continue;
      const width = Math.max(2 / Math.abs(camera.projectionMatrix.elements[0]), 2 / Math.abs(camera.projectionMatrix.elements[5])) *
        (camera.isPerspectiveCamera ? depths[band] : 1);
      let level = Math.max(0, Math.ceil(Math.log2(width / (baseSize * 8)))), cellSize, from, to, cells;
      do {
        cellSize = baseSize * 2 ** level;
        from = lo.map(value => Math.floor(value / cellSize)); to = hi.map(value => Math.floor(value / cellSize));
        cells = from.reduce((product, value, axis) => product * (to[axis] - value + 1), 1);
        if (cells > Math.floor(maxCells / (depths.length - 1))) level++;
      } while (cells > Math.floor(maxCells / (depths.length - 1)));
      const bandSampleBudget = Math.floor(maxSamples / (depths.length - 1)),
        desiredSamples = band === 1 ? Math.max(samplesPerCell, 64) : samplesPerCell,
        samples = Math.max(1, Math.min(desiredSamples, Math.floor(bandSampleBudget / cells)));
      let bandSamples = 0;
      for (let x = from[0]; x <= to[0]; x++) for (let y = from[1]; y <= to[1]; y++) for (let z = from[2]; z <= to[2]; z++) {
        visited++;
        const cell = cellSeed(x, y, z, level, seed);
        for (let n = 0; n < samples && bandSamples < bandSampleBudget; n++) {
          const id = `${level}:${x}:${y}:${z}:${n}`;
          if (pool.has(id) || allocated.has(id)) continue;
          const identity = hash(cell ^ Math.imul(n + 1, 104729)),
            anchor = [(x + unit(identity + 11)) * cellSize, (y + unit(identity + 29)) * cellSize, (z + unit(identity + 53)) * cellSize];
          if (anchor[1] < boundsY[0] || anchor[1] > boundsY[1] || anchor.some((value, axis) => value < bounds[axis] || value > bounds[axis + 3])) continue;
          const entry = { index: -1, id, seed: identity & 0x7fffffff, anchor, cellSize, fade: 0, opacity: 0, priority: unit(identity + 97) };
          tested++; bandSamples++;
          if (!sample(entry, time, sampler) || entry.visibility <= .001 || entry.depth < depths[band - 1] || entry.depth > depths[band]) continue;
          pool.set(id, entry);
        }
      }
    }
    // Bounded births are balanced across the actual view, while identities and
    // their paths stay world anchored. Sorting affects only still-empty slots.
    const limit = Math.min(maxCandidates, Math.max(256, budget * 5)),
      ranked = [...pool.values()].sort((a, b) => a.priority - b.priority),
      binCounts = new Uint16Array(bucketCount), selected = [], remainder = [],
      perBin = Math.max(1, Math.floor(limit / bucketCount));
    for (const entry of ranked) {
      if (binCounts[entry.bucket] < perBin) { selected.push(entry); binCounts[entry.bucket]++; }
      else remainder.push(entry);
    }
    candidates = selected.concat(remainder.slice(0, Math.max(0, limit - selected.length)));
    const depthCandidates = [0, 0, 0];
    for (const entry of candidates) depthCandidates[Math.floor(entry.bucket / 20)]++;
    stats = { ...stats, cells: visited, candidates: candidates.length, sampledCandidates: tested, generated: tested, depthCandidates, scans: (stats.scans || 0) + 1 };
    lastScan = time;
  }

  return {
    visibility,
    update(nextCamera, time = 0, { sample: sampler, budget: requestedBudget = capacity, maxDistance = maximumDepth,
      bounds: requestedBounds = initialBounds, ndcEllipse = null } = {}) {
      camera = nextCamera;
      if (!camera) return [];
      sampleCalls = 0;
      camera.updateMatrixWorld();
      projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      budget = clamp(Math.floor(requestedBudget), 0, capacity);
      activeDepth = clamp(Number(maxDistance) || maximumDepth, minimumDepth + 2, maximumDepth);
      for (let axis = 0; axis < 6; axis++) bounds[axis] = requestedBounds[axis];
      ellipse = ndcEllipse?.length === 2 && ndcEllipse.every(value => Number.isFinite(value) && value > 0) ? [...ndcEllipse] : null;
      const now = Number.isFinite(time) ? time : 0,
        dt = lastTime === null ? 1 / 60 : clamp(now - lastTime, 0, .1),
        step = dt / fadeSeconds,
        key = [...camera.position.toArray().map(value => Math.round(value / (baseSize * .18))),
          ...camera.quaternion.toArray().map(value => Math.round(value / .025)),
          ...camera.projectionMatrix.elements.map(value => Math.round(value * 100)), budget, Math.round(activeDepth), ...bounds,
          ...(ellipse || [])].join(":");
      lastTime = now;
      allocated = new Set();
      let updated = 0;
      for (let index = 0; index < capacity; index++) {
        const entry = slots[index]; if (!entry) continue;
        updated++;
        const valid = sample(entry, now, sampler), target = index < budget && valid && entry.visibility > .001 ? 1 : 0;
        entry.fade = clamp(entry.fade + (target ? step : -step));
        entry.opacity = entry.fade * (valid ? entry.visibility : 0);
        if (entry.fade <= 0) slots[index] = null;
        else allocated.add(entry.id);
      }
      const vacancies = slots.slice(0, budget).some(entry => !entry);
      if (vacancies && (key !== scanKey || now - lastScan >= .25)) {
        scan(now, sampler); scanKey = key;
      }
      const buckets = Array.from({ length: bucketCount }, () => []), occupancy = new Uint16Array(bucketCount);
      for (const entry of slots) if (entry && entry.opacity > 0) occupancy[entry.bucket]++;
      if (vacancies) for (const entry of candidates) if (!allocated.has(entry.id) &&
        (entry.sampleTime === now || sample(entry, now, sampler)) && entry.visibility > .001) buckets[entry.bucket].push(entry);
      for (let index = 0; index < budget; index++) if (!slots[index]) {
        let chosen = -1;
        // Priority cycles through depth thirds instead of exhausting nearby
        // screen buckets first. Both parallax-rich foreground and the actual
        // roof depth remain represented with very small seasonal budgets.
        const preferredDepth = index % 3;
        for (let pass = 0; pass < 2 && chosen < 0; pass++) for (let bucket = 0; bucket < bucketCount; bucket++) {
          if (!buckets[bucket].length || (pass === 0 && Math.floor(bucket / 20) !== preferredDepth)) continue;
          if (chosen < 0 || occupancy[bucket] < occupancy[chosen]) chosen = bucket;
        }
        if (chosen < 0) break;
        const entry = buckets[chosen].shift();
        entry.index = index; entry.fade = Math.min(1, step); entry.opacity = entry.fade * entry.visibility;
        slots[index] = entry; allocated.add(entry.id); occupancy[chosen]++;
      }
      const entries = slots.filter(Boolean);
      stats = { ...stats, count: entries.length, active: entries.filter(entry => entry.opacity > .001).length,
        capacity, budget, updated, sampleCalls, depthRange: [minimumDepth, activeDepth], safety,
        ndcEllipse: ellipse ? [...ellipse] : null, worldAnchored: true };
      return entries;
    },
    get stats() { return stats; },
  };
}
