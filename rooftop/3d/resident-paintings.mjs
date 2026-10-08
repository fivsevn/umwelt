import { PIGMENT_RAMP, pointInk } from "./face-paintings.mjs";
const cache = new Map();
export const RESIDENT_PAINT_KINDS = ["skin", "hair", "actor-cloth"];
export function residentPainting(kind) {
  if (!RESIDENT_PAINT_KINDS.includes(kind)) return null;
  if (cache.has(kind)) return cache.get(kind);
  const size = 32,
    commands = [];
  for (let face = 0; face < 6; face++)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        let tone = 6.1;
        if (kind === "skin") {
          tone +=
            0.75 * Math.exp(-((x - 12) ** 2 + (y - 10) ** 2) / 180) -
            0.75 * Math.exp(-((x - 27) ** 2 + (y - 24) ** 2) / 120);
          if (face < 4 && y > 21) tone -= 0.25;
        } else if (kind === "hair") {
          const strand = Math.sin(
            x * 0.67 + Math.sin(y * 0.18 + face) * 1.6 + face * 0.9,
          );
          tone =
            5.3 +
            strand * 0.55 +
            0.8 * Math.exp(-((x - 10) ** 2 + (y - 7) ** 2) / 110) -
            (y / size) * 0.35;
        } else {
          const fold = Math.sin(
            x * 0.27 + face * 1.8 + Math.sin(y * 0.12) * 0.45,
          );
          tone =
            5.7 +
            fold * 0.65 +
            0.45 * Math.exp(-((x - 11) ** 2 + (y - 5) ** 2) / 170);
          if (y > 28) tone -= 0.55;
          if (x === 2 && y % 5 === 1 && face !== 5) tone += 0.7;
        }
        commands.push([
          (face % 3) * size + x,
          Math.floor(face / 3) * size + y,
          1,
          1,
          pointInk(tone, x, y, face * 719 + kind.length, 8),
        ]);
      }
  const art = {
    size,
    width: 96,
    height: 64,
    cellWidth: size,
    cellHeight: size,
    variants: 1,
    grayCount: 9,
    ramp: PIGMENT_RAMP,
    commands,
  };
  cache.set(kind, art);
  return art;
}
