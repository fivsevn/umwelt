// Display-space curvature only. Authored geometry and material sampling stay intact.
export const TERMINAL_CRT_STRENGTH = .065;
export function crtWarpNdc([x, y], strength = TERMINAL_CRT_STRENGTH) {
  return [x * (1 + strength * y * y), y * (1 + strength * x * x)];
}
export function crtUnwarpNdc([x, y], strength = TERMINAL_CRT_STRENGTH) {
  let u = x, v = y;
  for (let i = 0; i < 12; i++) {
    const nextU = x / (1 + strength * v * v);
    v = y / (1 + strength * u * u); u = nextU;
  }
  return [u, v];
}
