import { seasonalCaption } from "./seasons.mjs";
// Shared art direction for the 2D observer and the 3D terraces. All vectors are
// world-space: north is -z on the terrace, and -x on the south balcony.
const LIGHT = {
  dawn: {
    sky: "#bdc3ce",
    horizon: "#e8c09e",
    zenith: "#829bbc",
    sunColor: "#ffe2ba",
    ambientColor: "#adbfda",
    bounceColor: "#8d7f76",
    ambient: 0.46,
    direct: 1.06,
    moon: 0,
    x: 30.6,
    y: 13,
    z: -15.3,
  },
  morning: {
    sky: "#b7ccd9",
    horizon: "#d6e2d6",
    zenith: "#79a8bf",
    sunColor: "#fff2dd",
    ambientColor: "#d2d8d5",
    bounceColor: "#77796f",
    ambient: 0.61,
    direct: 1.28,
    moon: 0,
    x: 15.3,
    y: 25,
    z: 6.8,
  },
  day: {
    sky: "#aacbd8",
    horizon: "#d9e3d7",
    zenith: "#689fbe",
    sunColor: "#fff3dd",
    ambientColor: "#d2d8d5",
    bounceColor: "#77796f",
    ambient: 0.65,
    direct: 1.42,
    moon: 0,
    x: 0,
    y: 48,
    z: 5.1,
  },
  afternoon: {
    sky: "#b4c5d1",
    horizon: "#e2d0a9",
    zenith: "#829db8",
    sunColor: "#ffe8c8",
    ambientColor: "#c5ced6",
    bounceColor: "#80796e",
    ambient: 0.55,
    direct: 1.28,
    moon: 0,
    x: -17,
    y: 25,
    z: 6.8,
  },
  dusk: {
    sky: "#a4a4ba",
    horizon: "#eab08a",
    zenith: "#687ca1",
    sunColor: "#ffd099",
    ambientColor: "#98a8c0",
    bounceColor: "#7c7073",
    ambient: 0.4,
    direct: 1.06,
    moon: 0,
    x: -37.4,
    y: 12,
    z: -18.7,
  },
  evening: {
    sky: "#314665",
    horizon: "#5a6684",
    zenith: "#253957",
    sunColor: "#c2d1ec",
    ambientColor: "#85a4cf",
    bounceColor: "#43546f",
    ambient: 0.3,
    direct: 0,
    moon: 0.3,
    x: -16,
    y: 36,
    z: 14,
  },
  late: {
    sky: "#223551",
    horizon: "#455870",
    zenith: "#192b46",
    sunColor: "#bdd0e9",
    ambientColor: "#799ac5",
    bounceColor: "#374964",
    ambient: 0.24,
    direct: 0,
    moon: 0.24,
    x: -16,
    y: 36,
    z: 14,
  },
};
// Season changes the sky that fills the shade, the ground bounce and the solar
// elevation. Keeping these separate preserves the authored material colours.
const SEASON_LIGHT = {
  spring: { zenith: "#8ebabb", horizon: "#e0e5c8", ambientColor: "#d1ddd4", bounceColor: "#7c8972", sunColor: "#fff2dd", declination: 0 },
  summer: { zenith: "#518fb5", horizon: "#bfdcdf", ambientColor: "#cbd9dd", bounceColor: "#747f78", sunColor: "#fff5df", declination: 23.44 },
  autumn: { zenith: "#7685a4", horizon: "#e4bd8f", ambientColor: "#c3ccd5", bounceColor: "#827469", sunColor: "#ffe3ba", declination: -8 },
  winter: { zenith: "#81a8bb", horizon: "#dce5e2", ambientColor: "#c5d4dc", bounceColor: "#929da3", sunColor: "#edf0df", declination: -23.44 },
};
const mix = (a, b, t) =>
  "#" +
  [1, 3, 5]
    .map((i) =>
      Math.round(
        parseInt(a.slice(i, i + 2), 16) * (1 - t) +
          parseInt(b.slice(i, i + 2), 16) * t,
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
// Representative seasonal sun paths for Wuxi (31.6 N), rather than a
// northern sunrise/sunset reused in winter. Coordinates here are physical
// east/up/south; the renderer converts to the unchanged model's game units.
// Seven named moments remain an art clock, not a live astronomical forecast.
export function seasonalSunVector(phase, season = "summer") {
  const radians = Math.PI / 180, latitude = 31.6 * radians,
    declination = (SEASON_LIGHT[season] || SEASON_LIGHT.summer).declination * radians,
    horizonHour = Math.acos(-Math.tan(latitude) * Math.tan(declination)),
    hour = ({ dawn: -horizonHour + 14 * radians, morning: -40 * radians,
      day: 0, afternoon: 40 * radians, dusk: horizonHour - 14 * radians })[phase];
  if (hour === undefined) return null;
  const east = hour === 0 ? 0 : -Math.cos(declination) * Math.sin(hour),
    up = Math.sin(latitude) * Math.sin(declination) + Math.cos(latitude) * Math.cos(declination) * Math.cos(hour),
    south = Math.sin(latitude) * Math.cos(declination) * Math.cos(hour) - Math.cos(latitude) * Math.sin(declination);
  return [east * 48, up * 48, south * 48];
}
export function lightingProfile(weather, phase, season = "summer") {
  const base = LIGHT[phase] || LIGHT.day,
    seasonal = SEASON_LIGHT[season] || SEASON_LIGHT.summer,
    night = phase === "evening" || phase === "late";
  const p = { ...base };
  for (const key of ["zenith", "horizon", "ambientColor", "bounceColor", "sunColor"])
    p[key] = mix(base[key], seasonal[key], night ? 0.045 : key === "bounceColor" ? 0.4 : key === "sunColor" ? 0.23 : 0.3);
  p.sky = mix(base.sky, seasonal.zenith, night ? 0.025 : 0.12);
  const diffuse =
    weather.id === "clear"
      ? 0
      : weather.id === "cloudy"
        ? 0.4
        : weather.id === "wind"
          ? 0.24
          : weather.id === "mist"
            ? 0.6
            : 1;
  const rainGrey = {
    rain: "#95a6b3",
    heavy: "#788b9a",
    thunderstorm: "#697d8d",
    typhoon: "#6c7c83",
  };
  const transmission =
    { rain: 0.94, heavy: 0.82, thunderstorm: 0.74, typhoon: 0.7 }[weather.id] ||
    1;
  const grey = night ? "#3c4b61" : rainGrey[weather.id] || "#a4aeaf";
  const solar = seasonalSunVector(phase, season) || [p.x, p.y, p.z];
  return {
    sky: mix(p.sky, grey, diffuse * 0.65),
    horizon: mix(p.horizon, grey, diffuse * 0.78),
    zenith: mix(p.zenith, grey, diffuse * 0.62),
    sunColor: mix(p.sunColor, "#d0d9df", diffuse * 0.7),
    ambientColor: mix(
      p.ambientColor,
      night ? "#90a7c4" : "#c3ced0",
      diffuse * 0.6,
    ),
    bounceColor: mix(p.bounceColor, night ? p.bounceColor : "#777e76", diffuse * .55),
    ambient: p.ambient * transmission + (!night ? diffuse * 0.22 : 0),
    direct: p.direct * (1 - diffuse),
    moon: p.moon * (1 - diffuse * 0.8),
    sunX: solar[0],
    sunY: solar[1],
    sunZ: solar[2],
    roomSunX: p.x * .32,
    thunder: weather.id === "thunderstorm" ? 1 : 0,
    gale: weather.id === "typhoon" ? 1 : 0,
  };
}
export function lightPosition(state, scene = "north") {
  return scene === "south"
    ? [state.sunZ, state.sunY, -state.sunX]
    : [state.sunX, state.sunY, state.sunZ];
}
export function weatherMotion(state, time) {
  const gale = state.gale || 0;
  const gust =
    0.68 + 0.22 * Math.sin(time * 0.71) + 0.1 * Math.sin(time * 1.63 + 0.8);
  const wind =
    state.wind * (1 + gust * (gale * 0.72 + (state.rain > 0.7 ? 0.18 : 0.08)));
  return {
    wind,
    x: wind * (0.78 + 0.12 * Math.sin(time * 0.19)),
    z: wind * (0.3 + 0.1 * Math.sin(time * 0.27 + 1.4)),
  };
}
export function lightningPulse(state, time, reduced = false) {
  if (!(state.thunder > 0)) return 0;
  const cycle = Math.floor(time / 21),
    t = time - cycle * 21;
  const at =
    3.2 + ((((Math.sin(cycle * 73.17 + 1.3) * 43758.5453) % 1) + 1) % 1) * 7;
  const pulse = (offset, width) =>
    Math.max(0, 1 - Math.abs(t - offset) / width) ** 2;
  return (
    state.thunder *
    (pulse(at, 0.32) + pulse(at + 0.85, 0.22) * 0.35) *
    (reduced ? 0.35 : 1)
  );
}
export function weatherActivity(state, scene = "north") {
  if (scene === "room") return "garden";
  return state.rain > 0.01 ||
    ["rain", "heavy", "thunderstorm", "typhoon"].includes(state.condition)
    ? "shelter"
    : "garden";
}
export function atmosphereCaption(state) {
  state = { ...state, condition: state.visualCondition || state.condition };
  const wet = {
    rain: "细雨落在盆沿，地面渐渐湿了。",
    heavy: "雨水汇向下水口，屋檐下接连滴水。",
    thunderstorm: "雷光照亮楼群，雨敲着盆沿。",
    typhoon: "阵风把雨吹斜，叶片向一侧伏下。",
  };
  if (wet[state.condition]) return wet[state.condition];
  const seasonal = seasonalCaption(state);
  if (seasonal) return seasonal;
  if (state.condition === "mist") return "近处的叶片清楚，远楼慢慢隐进雾里。";
  if (state.condition === "overcast")
    return "天光散开，盆沿下还留着柔和的暗面。";
  if (state.condition === "cloudy") return "云影经过地面，亮处和暗处缓缓交替。";
  if (state.condition === "wind") return "风穿过楼间，领巾和叶片轻轻动。";
  return {
    dawn: "晨光刚落到盆沿，地面的影子还长。",
    morning: "上午的光照亮叶片，影子渐渐收短。",
    day: "日光落在头顶，阴影缩到物件脚边。",
    afternoon: "下午的光转暖，影子伸向另一侧。",
    dusk: "暖光擦过盆沿，阴影里先有了凉意。",
    evening: "屋里亮起暖灯，楼群落进蓝色夜光。",
    late: "窗灯渐少，月光留在安静的天台上。",
  }[state.phase];
}
