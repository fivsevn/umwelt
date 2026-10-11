// Camera choices are relative to the playable terrace, never map coordinates.
export const NARRATIVE_VIEWS = Object.freeze([
  { id: "bird", label: "小鸟" },
  { id: "drone", label: "无人机" },
  { id: "neighbor", label: "邻居" },
]);

const settings = {
  bird: { span: 12, minSpan: 12, maxSpan: 12, yaw: .28, pitch: .08, travel: 0, station: { walk: 4, height: 0, dolly: 0 } },
  drone: { span: 14, minSpan: 14, maxSpan: 14, maxWidth: 14, yaw: .065, pitch: 0, travel: 0, station: { walk: 0, height: 3, dolly: 3 } },
  neighbor: { span: 12, minSpan: 2.5, maxSpan: 22, yaw: 0, pitch: 0, travel: 9, station: { walk: 0, height: 0, dolly: 0 } },
};
const anchors = {
  north: {
    bird: { eye: [0, 6.1, 3.4], target: [0, .7, -3] },
    drone: { eye: [10, 27, -30], target: [6, 6, 3] },
    neighbor: { eye: [-130, 42, -100], target: [0, .8, -2] },
  },
  south: {
    // Local -X is the intact house; +X points out of the south balcony.
    bird: { eye: [-3.4, 6.1, 0], target: [0, .7, 0] },
    drone: { eye: [30, 27, 6], target: [0, 4, 0] },
    neighbor: { eye: [100, 42, -130], target: [0, .8, 0] },
  },
};
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

export function narrativePreset(scene, name = "bird") {
  const id = settings[name] ? name : "bird";
  const source = anchors[scene === "south" ? "south" : "north"][id];
  return { id, scene: scene === "south" ? "south" : "north", ...settings[id], station: { ...settings[id].station }, eye: [...source.eye], target: [...source.target] };
}

export function narrativeFrame(preset, width, height) {
  const aspect = Math.max(1, width) / Math.max(1, height);
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

export function constrainNarrativeHead(preset, yaw, pitch) {
  return { theta: clamp(yaw, -preset.yaw, preset.yaw), phi: clamp(pitch, -preset.pitch, preset.pitch) };
}

export function constrainNarrativeTarget(preset, point) {
  return {
    x: clamp(point.x, preset.target[0] - preset.travel, preset.target[0] + preset.travel),
    y: preset.target[1],
    z: clamp(point.z, preset.target[2] - preset.travel, preset.target[2] + preset.travel),
  };
}

export function constrainNarrativeStation(preset, state = {}) {
  return Object.fromEntries(["walk", "height", "dolly"].map(key => [key, clamp(Number(state[key]) || 0, -preset.station[key], preset.station[key])]));
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
  return constrainNarrativeHead(preset, travel.walk / (preset.station.walk || 1) * preset.yaw, pitch);
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
    station.height = (station.height || 0) + dy * .015;
    return { station: constrainNarrativeStation(preset, station), ...constrainNarrativeHead(preset, (state.theta || 0) - dx * .002, 0) };
  }
  return { station: constrainNarrativeStation(preset, station), ...constrainNarrativeHead(preset, 0, 0) };
}

export function narrativePose(preset, state = {}, point = preset.target) {
  const station = constrainNarrativeStation(preset, state.station), eye = [...preset.eye];
  if (preset.id === "bird") eye[preset.scene === "south" ? 2 : 0] += station.walk;
  if (preset.id === "drone") {
    const toward = preset.target.map((value, axis) => value - preset.eye[axis]), length = Math.hypot(...toward);
    for (let axis = 0; axis < 3; axis++) eye[axis] += toward[axis] / length * station.dolly;
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
