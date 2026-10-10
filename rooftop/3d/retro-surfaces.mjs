// Pixelorama: terrace-surfaces.pxo. Each tile is 64 x 64 actual pixels.
export const RETRO_TILES = Object.freeze({
  wood: 0, "wood-light": 1, metal: 2, steel: 3, paving: 4, wall: 5,
  roof: 6, brick: 7, cloth: 8, enamel: 9, rubber: 10, glass: 11,
  "face-door": 12, "face-cabinet": 13, stone: 14, "room-wall": 15,
});
export function retroField(kind) {
  const base = kind.replace(/^wrap-/, "").replace(/^weather-/, "");
  if (base in RETRO_TILES) return base;
  return { "face-board": "wood", "face-drawer": "face-cabinet",
    "facade-tile": "paving", "round-metal": "steel", "panel-door": "face-door",
    asphalt: "stone", paint: "metal", plain: "steel" }[base] || null;
}
export function retroRect(name) {
  const i = RETRO_TILES[name];
  return [(i % 4) / 4, Math.floor(i / 4) / 4, .25, .25];
}
