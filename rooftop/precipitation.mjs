// Rain strikes are renewed every lifetime. Basins stay in place as water collects.
export const RAIN_SHAPES = {
  rain: {
    seed: 11,
    impacts: 28,
    radius: 0.14,
    lifetime: 1.18,
    splash: 0.045,
    streak: 0.28,
  },
  heavy: {
    seed: 37,
    impacts: 94,
    radius: 0.24,
    lifetime: 0.68,
    splash: 0.13,
    streak: 0.58,
  },
  thunderstorm: {
    seed: 61,
    impacts: 116,
    radius: 0.28,
    lifetime: 0.78,
    splash: 0.17,
    streak: 0.68,
  },
  typhoon: {
    seed: 89,
    impacts: 144,
    radius: 0.32,
    lifetime: 0.5,
    splash: 0.24,
    streak: 0.86,
  },
};
export function rainShape(state) {
  return RAIN_SHAPES[state.condition] || RAIN_SHAPES.rain;
}
export function rainHash(value) {
  return (((Math.sin(value * 127.17 + 91.31) * 43758.5453) % 1) + 1) % 1;
}
export function rainStrike(shape, i, time, bounds, sceneSeed = 0) {
  const clock = time / shape.lifetime + rainHash(i + shape.seed),
    cycle = Math.floor(clock);
  const key = shape.seed * 971 + i * 17 + cycle * 139 + sceneSeed;
  return {
    x: bounds[0] + rainHash(key) * (bounds[2] - bounds[0]),
    y: bounds[1] + rainHash(key + 7.3) * (bounds[3] - bounds[1]),
    age: clock - cycle,
    size: shape.radius * (0.65 + rainHash(key + 3.1) * 0.65),
  };
}
