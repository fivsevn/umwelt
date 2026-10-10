// Camera choices are relative to the playable terrace, never map coordinates.
export const NARRATIVE_VIEWS = Object.freeze([
  { id: "bird", label: "小鸟" },
  { id: "drone", label: "无人机" },
  { id: "neighbor", label: "狙击手" },
]);

const settings = {
  bird: { span: 12, minSpan: 12, maxSpan: 12, yaw: .28, pitch: .08, pitchMax: .01, travel: 0, station: { walk: 4, height: 0, dolly: 0 } },
  drone: { span: 20, minSpan: 20, maxSpan: 20, overviewWidth: 28.5, yaw: .055, pitch: 0, travel: 0, station: { walk: 0, height: 0, heightMin: -3, dolly: 2, dollyMin: 0 } },
  neighbor: { span: 12, minSpan: 2.5, maxSpan: 22, yaw: 0, pitch: 0, travel: 9, station: { walk: 0, height: 0, dolly: 0 } },
};
const anchors = {
  north: {
    bird: { eye: [0, 6.1, 3.4], target: [0, .7, -3] },
    drone: { eye: [5.730418254117132, 10.185871659274401, -16.91505953279829], target: [0.9888763353084746, 0.4845046136253277, -2.9724913957751387], nearEye: [4.4457313087451755, 7.6208540250916945, -13.342043664359059], nearTarget: [1.593392938621363, -0.4838285655536021, -3.520557996517132], span: 11.214104312826068, minSpan: 11.214104312826068, maxSpan: 11.214104312826068, overviewWidth: 15.980098645777145, yaw: .15, pitch: .08, station: { walk: 0, height: 2.25, heightMin: -2.75, dolly: 4.582158706046302, dollyMin: 0 } },
    neighbor: { eye: [-130, 42, -100], target: [0, .8, -2] },
  },
  south: {
    // Local -X is the intact house; +X points out of the south balcony.
    bird: { eye: [-3.4, 6.1, 0], target: [0, .7, 0] },
    drone: { eye: [26.8, 17.13, 5.36], target: [0, .7, 0], span: 16.5, minSpan: 16.5, maxSpan: 16.5, overviewWidth: 27, yaw: .045, station: { walk: 0, height: 0, heightMin: -3, dolly: 2, dollyMin: 0 } },
    neighbor: { eye: [100, 42, -130], target: [0, .8, 0] },
  },
};
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

export function narrativePreset(scene, name = "bird") {
  const id = settings[name] ? name : "bird";
  const source = anchors[scene === "south" ? "south" : "north"][id];
  return { id, scene: scene === "south" ? "south" : "north", ...settings[id], ...source, station: { ...(source.station || settings[id].station) }, eye: [...source.eye], target: [...source.target] };
}

export function narrativeFrame(preset, width, height) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  if (preset.id === "drone") {
    // Keep the complete terrace centred at every viewport size. Limits belong
    // to the observer's movement, not a crop that shifts the playable space.
    const span = Math.max(preset.span, preset.overviewWidth / aspect);
    return { span, width: span * aspect, shiftY: 0, zoom: { min: 1, max: 1 } };
  }
  const portraitLimit = preset.id === "bird" ? 1.15 : preset.id === "drone" ? 1 : 1.7;
  // A wide monitor must not widen the drone into a street-level district view.
  const span = Math.min(preset.id === "bird" ? Infinity : preset.maxSpan,
    preset.span * Math.min(portraitLimit, Math.max(1, .85 / aspect)),
    preset.maxWidth ? preset.maxWidth / aspect : Infinity);
  return {
    span,
    width: span * aspect,
    zoom: preset.id === "neighbor" ? { min: span / preset.maxSpan, max: span / preset.minSpan } : { min: 1, max: 1 },
  };
}

export function applyNarrativeFrameOffset(camera, frame, width, height) {
  if (frame?.shiftY > 0) camera.setViewOffset(width, height, 0, -frame.shiftY * height / 2, width, height);
  else camera.clearViewOffset();
}

export function constrainNarrativeHead(preset, yaw, pitch) {
  return { theta: clamp(yaw, -preset.yaw, preset.yaw), phi: clamp(pitch, -preset.pitch, preset.pitchMax ?? preset.pitch) };
}

export function constrainNarrativeTarget(preset, point) {
  return {
    x: clamp(point.x, preset.target[0] - preset.travel, preset.target[0] + preset.travel),
    y: preset.target[1],
    z: clamp(point.z, preset.target[2] - preset.travel, preset.target[2] + preset.travel),
  };
}

export function constrainNarrativeStation(preset, state = {}) {
  return Object.fromEntries(["walk", "height", "dolly"].map(key => [key, clamp(Number(state[key]) || 0, preset.station[`${key}Min`] ?? -preset.station[key], preset.station[key])]));
}

export function nudgeNarrativeStation(preset, state, action) {
  const next = { ...state };
  const moves = preset.id === "bird" ? { left: ["walk", -.8], right: ["walk", .8] }
    : preset.id === "drone" ? { up: ["height", .75], down: ["height", -.75], near: ["dolly", 1], far: ["dolly", -1] } : {};
  const move = moves[action];
  if (move) next[move[0]] = (next[move[0]] || 0) + move[1];
  return constrainNarrativeStation(preset, next);
}

export function birdHeadAtStation(preset, station, pitch = 0) {
  const travel = constrainNarrativeStation(preset, station);
  const eye = [...preset.eye];
  eye[preset.scene === "south" ? 2 : 0] += travel.walk;
  const delta = preset.target.map((value, axis) => value - eye[axis]),
    restingDelta = preset.target.map((value, axis) => value - preset.eye[axis]),
    directionPitch = Math.atan2(delta[1], Math.hypot(delta[0], delta[2])),
    widestHalfFov = Math.atan(preset.span * 1.15 / (2 * Math.hypot(...restingDelta))),
    upwardLimit = Math.min(preset.pitchMax ?? preset.pitch, -widestHalfFov - .004 - directionPitch),
    head = constrainNarrativeHead(preset, travel.walk / (preset.station.walk || 1) * preset.yaw, pitch);
  // Walking changes the eye-to-floor angle. Bound the final look direction,
  // rather than letting an unchanged relative pitch lift the skyline into view.
  head.phi = clamp(head.phi, -preset.pitch, upwardLimit);
  return head;
}

// Each view owns its gesture; legacy rotate/move UI cannot change its meaning.
export function narrativeDrag(preset, state, dx, dy) {
  const station = { ...state.station };
  if (preset.id === "bird") {
    station.walk = (station.walk || 0) - dx * .018;
    const bounded = constrainNarrativeStation(preset, station);
    return { station: bounded, ...birdHeadAtStation(preset, bounded, (state.phi || 0) + dy * .0008) };
  }
  if (preset.id === "drone") {
    return { station: constrainNarrativeStation(preset, station), ...constrainNarrativeHead(preset, (state.theta || 0) - dx * .0015, (state.phi || 0) + dy * .001) };
  }
  return { station: constrainNarrativeStation(preset, station), ...constrainNarrativeHead(preset, 0, 0) };
}

export function narrativePose(preset, state = {}, point = preset.target) {
  const station = constrainNarrativeStation(preset, state.station), eye = [...preset.eye];
  if (preset.id === "bird") eye[preset.scene === "south" ? 2 : 0] += station.walk;
  if (preset.id === "drone") {
    if (preset.nearEye) {
      const progress = station.dolly / preset.station.dolly;
      for (let axis = 0; axis < 3; axis++) eye[axis] += (preset.nearEye[axis] - preset.eye[axis]) * progress;
      point = point.map((value, axis) => value + (preset.nearTarget[axis] - preset.target[axis]) * progress);
    } else {
      const toward = preset.target.map((value, axis) => value - preset.eye[axis]), length = Math.hypot(...toward);
      for (let axis = 0; axis < 3; axis++) eye[axis] += toward[axis] / length * station.dolly;
    }
    eye[1] += station.height;
  }
  const
    delta = point.map((value, axis) => value - eye[axis]),
    distance = Math.hypot(...delta),
    head = preset.id === "bird" ? birdHeadAtStation(preset, station, state.phi || 0)
      : constrainNarrativeHead(preset, state.theta || 0, state.phi || 0),
    yaw = Math.atan2(delta[0], delta[2]) + head.theta,
    pitch = Math.atan2(delta[1], Math.hypot(delta[0], delta[2])) + head.phi;
  const target = [
    eye[0] + Math.sin(yaw) * Math.cos(pitch) * distance,
    eye[1] + Math.sin(pitch) * distance,
    eye[2] + Math.cos(yaw) * Math.cos(pitch) * distance,
  ];
  return { eye, target, distance, yaw, pitch };
}
