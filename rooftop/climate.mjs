// Chongchuan's public regional reference; no household/map-source metadata.
// Sources and game-weight assumptions: docs/chongchuan-climate.md.
export const CLIMATE_LOCATION = Object.freeze({
  name: "南通·崇川", latitude: 32.02, longitude: 120.86,
  timeZone: "Asia/Shanghai", utcOffset: 8,
});
export const MONTHS = [
  ["隆冬", "winter", 0], ["冬末", "winter", 0],
  ["冬春之交", "spring", .18], ["仲春", "spring", 1], ["春末", "spring", .45],
  ["初夏·梅雨", "summer", .55], ["盛夏", "summer", 1], ["盛夏", "summer", .9],
  ["夏秋之交", "autumn", .3], ["深秋", "autumn", 1], ["秋末", "autumn", .65],
  ["初冬", "winter", 0],
].map(([stage, season, air], i) => Object.freeze({id: String(i + 1), month: i + 1, name: `${i + 1}月·${stage}`, stage, season, air}));
export const SEASON_MONTH = Object.freeze({spring: 4, summer: 7, autumn: 10, winter: 1});
export function validMonth(value) { return /^([1-9]|1[0-2])$/.test(String(value)); }
export function monthProfile(month) { return MONTHS[(validMonth(month) ? Number(month) : 10) - 1]; }
export function chongchuanDate(date = new Date()) {
  const local = new Date(date.getTime() + 8 * 3600000);
  return {year: local.getUTCFullYear(), month: local.getUTCMonth() + 1, day: local.getUTCDate(),
    hour: local.getUTCHours() + local.getUTCMinutes() / 60 + local.getUTCSeconds() / 3600};
}
const radians = Math.PI / 180;
const dayCache = new Map();
// NOAA fractional-year equations, including the leap-year denominator.
export function solarDay({year = 2026, month = 10, day = 15} = {}) {
  const key = `${year}-${month}-${day}`;
  if (dayCache.has(key)) return dayCache.get(key);
  const start = Date.UTC(year, 0, 1), days = (Date.UTC(year + 1, 0, 1) - start) / 86400000,
    index = (Date.UTC(year, month - 1, day) - start) / 86400000,
    g = 2 * Math.PI / days * index,
    equation = 229.18 * (.000075 + .001868 * Math.cos(g) - .032077 * Math.sin(g) - .014615 * Math.cos(2*g) - .040849 * Math.sin(2*g)),
    declination = .006918 - .399912*Math.cos(g) + .070257*Math.sin(g) - .006758*Math.cos(2*g) + .000907*Math.sin(2*g) - .002697*Math.cos(3*g) + .00148*Math.sin(3*g),
    latitude = CLIMATE_LOCATION.latitude * radians,
    hourAngle = Math.acos(Math.cos(90.833*radians)/(Math.cos(latitude)*Math.cos(declination)) - Math.tan(latitude)*Math.tan(declination)) / radians,
    noon = (720 - 4*CLIMATE_LOCATION.longitude - equation + 480) / 60,
    result = Object.freeze({sunrise: noon - hourAngle/15, sunset: noon + hourAngle/15, noon, declination, equation});
  if (dayCache.size >= 32) dayCache.delete(dayCache.keys().next().value);
  dayCache.set(key, result);
  return result;
}
const wrap = h => ((h % 24) + 24) % 24;
export function clockLabel(hour) {
  const minutes = Math.round(wrap(hour) * 60) % 1440;
  return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
}
export function timeBands(date = chongchuanDate()) {
  const {sunrise, sunset} = solarDay(date), quarter = h => Math.round(h*4)/4,
    rise = quarter(sunrise), set = quarter(sunset),
    bounds = [rise - .5, rise + 1, 11, 14, set - .75, set + .5, 23, rise - .5 + 24],
    names = [['dawn','清晨'],['morning','上午'],['day','中午'],['afternoon','下午'],['dusk','黄昏'],['evening','前半夜'],['late','深夜']];
  return names.map(([id, label], i) => ({id, label, start: bounds[i], end: bounds[i+1],
    name: `${label} ${clockLabel(bounds[i])}–${i===6?'次日':''}${clockLabel(bounds[i+1])}`}));
}
export function phaseAtHour(hour, date = chongchuanDate()) {
  const h = wrap(Number.isFinite(hour) ? hour : 12);
  return timeBands(date).find(b => b.end > 24 ? h >= b.start || h < b.end-24 : h >= b.start && h < b.end)?.id || 'late';
}
export function phaseHour(phase, date) {
  const band = timeBands(date).find(b => b.id === phase) || timeBands(date)[2];
  const solar = solarDay(date);
  if (phase === 'dawn') return solar.sunrise + .6;
  if (phase === 'dusk') return solar.sunset - .6;
  return phase === 'day' ? solar.noon : wrap((band.start + band.end) / 2);
}
// Physical east/up/south vector, converted to model units by the renderer.
export function solarVector(hour, date) {
  const {declination: d, equation} = solarDay(date), lat = CLIMATE_LOCATION.latitude*radians,
    h = ((hour*60 + equation + 4*CLIMATE_LOCATION.longitude - 480)/4 - 180)*radians;
  return [-Math.cos(d)*Math.sin(h)*48,
    (Math.sin(lat)*Math.sin(d) + Math.cos(lat)*Math.cos(d)*Math.cos(h))*48,
    (Math.sin(lat)*Math.cos(d)*Math.cos(h) - Math.cos(lat)*Math.sin(d))*48];
}

// Relative GAME weights, not measured percentages or a live forecast.
// The seasonal constraints follow Nantong CMA summaries: rain concentrates in
// June/July; typhoon influence in summer/autumn; snow is uncommon in winter.
const WEATHER_KEYS = ['clear','partly-cloudy','overcast','mist','wind','plum-rain','rain','heavy','thunderstorm','typhoon','snow'];
const MONTH_WEIGHTS = [
  [30,25,17,8,7,0,10,0,0,0,3], [27,25,20,8,8,0,10,0,0,0,2],
  [23,24,22,7,10,0,12,1,1,0,0], [25,25,18,5,8,0,15,2,2,0,0],
  [24,26,16,4,6,0,16,4,4,0,0], [14,17,14,3,4,26,12,5,4.5,.5,0],
  [23,21,10,1,4,10,12,8,9,2,0], [28,23,11,1,5,0,12,8,9,3,0],
  [30,25,16,3,7,0,10,5,2,2,0], [37,26,16,5,7,0,7,1,.8,.2,0],
  [32,27,19,7,7,0,7,1,0,0,0], [34,26,18,6,7,0,7,0,0,0,2],
];
export function climateWeatherWeights(month, hour = 12) {
  const m = monthProfile(month).month, weights = [...MONTH_WEIGHTS[m-1]], night = hour < 7 || hour >= 20;
  weights[3] *= night ? 1.6 : .65;
  weights[8] *= hour >= 13 && hour < 20 ? 1.45 : .65;
  return Object.fromEntries(WEATHER_KEYS.map((key, i) => [key, weights[i]]));
}
function hash(n) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function localWeather(milliseconds, month) {
  const date = chongchuanDate(new Date(milliseconds)), m = validMonth(month) ? Number(month) : date.month,
    slot = Math.floor(milliseconds / 720000), random = hash(slot ^ Math.imul(m, 7919));
  const weights = Object.entries(climateWeatherWeights(m, date.hour)), sum = weights.reduce((a,[,v])=>a+v,0);
  let pick = random * sum;
  for (const [id, weight] of weights) { pick -= weight; if (pick < 0) return id; }
  return 'clear';
}
