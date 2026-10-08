// Local northern-hemisphere calendar, shared by both scene renderers. No network.
export const SEASONS = [
  { id: "spring", name: "春天", effect: "柳絮", count: 72 },
  { id: "summer", name: "夏天", effect: "蚊虫", count: 20 },
  { id: "autumn", name: "秋天", effect: "桂花与落叶", count: 64 },
  { id: "winter", name: "冬天", effect: "雪", count: 112 },
];
export function seasonAt(date = new Date()) {
  const month = date.getMonth() + 1;
  return month >= 3 && month <= 5 ? "spring" : month >= 6 && month <= 8 ? "summer" : month >= 9 && month <= 11 ? "autumn" : "winter";
}
const hash = (n) => {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const wrap = (n) => ((n % 1) + 1) % 1;
export function seasonalProfile(season) {
  return Object.fromEntries(SEASONS.map(s => ["season" + s.id, +(s.id === season)]));
}
// Normalized world volume. Insects stay low, while flowers, leaves, catkins and
// flakes cross the roof in distinct paths. Stable identity survives weather changes.
export function seasonalParticle(season, i, time, wind = .32, reduced = false) {
  const k = SEASONS.findIndex(s => s.id === season), seed = i * 113 + k * 977 + 19;
  const a = hash(seed), b = hash(seed + 37), c = hash(seed + 71);
  const t = time * (reduced ? .62 : 1), leaf = season === "autumn" && i % 3 === 0;
  const insect = season === "summer";
  const speed = insect ? .024 : leaf ? .037 : season === "winter" ? .045 : .018;
  const age = wrap(c + t * speed);
  const sway = Math.sin(t * (insect ? 2.2 : .48) + a * 12);
  return {
    x: insect ? .15 + a * .7 + Math.sin(t * .7 + c * 12) * .032 : wrap(a + t * (.003 + Math.min(wind, 2.5) * .004) + sway * (leaf ? .025 : .011)),
    y: insect ? .08 + b * .16 + sway * .012 : 1 - age,
    z: insect ? .15 + b * .7 + Math.cos(t * .9 + a * 12) * .029 : wrap(b + Math.cos(t * .37 + c * 12) * .018),
    angle: insect ? t * 6 + a * 12 : leaf ? t * .9 + a * 6 : a * 6,
    size: insect ? .035 : leaf ? .16 + b * .075 : season === "autumn" ? .062 : season === "winter" ? .064 + b * .045 : .073 + b * .045,
    kind: insect ? 1 : leaf ? 2 : season === "autumn" ? 3 : season === "winter" ? 4 : 0,
    color: insect ? "#4b4a35" : leaf ? ["#b78345", "#bca063", "#9b6040"][i % 3] : season === "autumn" ? ["#e8bc68", "#f0cf89", "#dca352"][i % 3] : season === "winter" ? "#e5eef1" : "#e7e5cd",
  };
}
export function seasonalStrength(state, season) {
  const weight = state["season" + season] ?? +(state.season === season);
  const rain = Math.max(state.rain || 0, state.rainIntent || 0);
  const shelter = season === "summer" ? Math.max(0, 1 - rain * 2 - Math.max(0, (state.wind || 0) - .8) * .7) : Math.max(.12, 1 - rain * .75);
  return weight * shelter * (season === "summer" ? .55 + (state.night || 0) * .45 : 1);
}
export function seasonalCaption(state) {
  if (!state.season || (state.rain || 0) > .12) return "";
  return {
    spring: "柳絮随着风，慢慢越过盆沿。",
    summer: "小虫在叶片和盆边兜着圈。",
    autumn: "细小的桂花和几片落叶飘过阳台。",
    winter: "雪花落得很慢，楼群隐在冷光里。",
  }[state.season] || "";
}
// Canvas fallback uses the same particle identities and clock as the 3D scene.
export function paintSeasonalAir(ctx, width, height, state, time, {reduced = false} = {}) {
  ctx.save();
  for (const season of SEASONS) {
    const strength = seasonalStrength(state, season.id);
    if (strength < .01) continue;
    ctx.globalAlpha = strength * .75;
    for (let i = 0; i < season.count; i++) {
      const p = seasonalParticle(season.id, i, time, state.wind, reduced);
      const x = Math.round(p.x * width), y = Math.round((1 - p.y) * height);
      ctx.fillStyle = p.color;
      if (p.kind === 2) { ctx.fillRect(x, y, 3, 2); ctx.fillRect(x + 1, y - 1, 2, 1); }
      else if (p.kind === 3) { ctx.fillRect(x, y, 2, 1); ctx.fillRect(x, y + 1, 1, 1); }
      else { ctx.fillRect(x, y, p.kind === 1 ? 1 : 2, 1); if (p.kind !== 1) ctx.fillRect(x, y + 1, 1, 1); }
    }
  }
  ctx.restore();
}
