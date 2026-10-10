// Integer pigment helpers retained by the deferred botanical geometry.
export const PIGMENT_RAMP = Array.from(
  { length: 9 },
  (_, j) =>
    "#" +
    Math.round((j * 255) / 8)
      .toString(16)
      .padStart(2, "0")
      .repeat(3),
);
// A stable integer hash has no repeating checker or diagonal lattice.
export function pointThreshold(x, y, seed = 0) {
  let n =
    Math.imul(x | 0, 0x45d9f3b) ^
    Math.imul(y | 0, 0x119de1f3) ^
    Math.imul(seed | 0, 0x27d4eb2d);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const pointInk = (value, x, y, phase = 0, max = 4) => {
  const v = clamp(value, 0, max),
    a = Math.floor(v);
  return a + (v - a > pointThreshold(x, y, phase) ? 1 : 0);
};
