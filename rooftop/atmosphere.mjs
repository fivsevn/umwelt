// Shared art direction for the 2D observer and the 3D terraces. All vectors are
// world-space: north is -z on the terrace, and -x on the south balcony.
const LIGHT = {
  dawn: {
    sky: "#b9bdcc",
    horizon: "#dfc9b6",
    zenith: "#9caac1",
    sunColor: "#ffe0b2",
    ambientColor: "#c1cada",
    bounceColor: "#897c74",
    ambient: 0.5,
    direct: 2.35,
    moon: 0,
    x: 30.6,
    y: 13,
    z: -15.3,
  },
  morning: {
    sky: "#becddd",
    horizon: "#dbe1d9",
    zenith: "#8baecb",
    sunColor: "#fff1d6",
    ambientColor: "#d8e3f0",
    bounceColor: "#92917e",
    ambient: 0.72,
    direct: 2.55,
    moon: 0,
    x: 15.3,
    y: 25,
    z: 6.8,
  },
  day: {
    sky: "#bacfdd",
    horizon: "#dbe4dc",
    zenith: "#83aac9",
    sunColor: "#fff7e6",
    ambientColor: "#dbe9f3",
    bounceColor: "#959584",
    ambient: 0.92,
    direct: 2.7,
    moon: 0,
    x: 0,
    y: 48,
    z: 5.1,
  },
  afternoon: {
    sky: "#c6cbd0",
    horizon: "#e5d8bd",
    zenith: "#92acc6",
    sunColor: "#ffe3b4",
    ambientColor: "#d0dce7",
    bounceColor: "#9a8873",
    ambient: 0.65,
    direct: 2.55,
    moon: 0,
    x: -17,
    y: 25,
    z: 6.8,
  },
  dusk: {
    sky: "#a8a5b4",
    horizon: "#d3a183",
    zenith: "#748ba9",
    sunColor: "#ffc28c",
    ambientColor: "#acbdd8",
    bounceColor: "#82696c",
    ambient: 0.4,
    direct: 2.35,
    moon: 0,
    x: -37.4,
    y: 12,
    z: -18.7,
  },
  evening: {
    sky: "#3a4c68",
    horizon: "#65728b",
    zenith: "#273b59",
    sunColor: "#c2d1ec",
    ambientColor: "#99b1d0",
    bounceColor: "#485b79",
    ambient: 0.31,
    direct: 0,
    moon: 0.34,
    x: -16,
    y: 36,
    z: 14,
  },
  late: {
    sky: "#263a53",
    horizon: "#4f6177",
    zenith: "#1c2e49",
    sunColor: "#bdd0e9",
    ambientColor: "#8da8cb",
    bounceColor: "#394d6d",
    ambient: 0.23,
    direct: 0,
    moon: 0.28,
    x: -16,
    y: 36,
    z: 14,
  },
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
export function lightingProfile(weather, phase) {
  const p = LIGHT[phase] || LIGHT.day,
    night = phase === "evening" || phase === "late";
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
  const grey = night ? "#3c4b61" : rainGrey[weather.id] || "#9faab2";
  return {
    sky: mix(p.sky, grey, diffuse * 0.65),
    horizon: mix(p.horizon, grey, diffuse * 0.78),
    zenith: mix(p.zenith, grey, diffuse * 0.62),
    sunColor: mix(p.sunColor, "#d0d9df", diffuse * 0.7),
    ambientColor: mix(
      p.ambientColor,
      night ? "#90a7c4" : "#c1ceda",
      diffuse * 0.6,
    ),
    bounceColor: p.bounceColor,
    ambient: p.ambient * transmission + (!night ? diffuse * 0.2 : 0),
    direct: p.direct * (1 - diffuse),
    moon: p.moon * (1 - diffuse * 0.8),
    sunX: p.x,
    sunY: p.y,
    sunZ: p.z,
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
  return state.rain > 0.06 ||
    ["rain", "heavy", "thunderstorm", "typhoon"].includes(state.condition)
    ? "shelter"
    : "garden";
}
export function atmosphereCaption(state) {
  const wet = {
    rain: "雨点落在盆沿，东东和小猪回门边避雨。",
    heavy: "雨水汇向下水口，屋里传来小猪的动静。",
    thunderstorm: "雷光照亮楼群，雨敲着盆沿。",
    typhoon: "阵风把雨吹斜，叶片向一侧伏下。",
  };
  if (wet[state.condition]) return wet[state.condition];
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
