// Approved revision 8: the same physical square on every unfolded surface.
export const PIXEL_STYLE = Object.freeze({
  id: "native-pixelorama-v1", textureSize: 32, texelsPerUnit: 8, renderScale: 1,
  palette: { metal: "#929c9c", metalLight: "#c9cdcc", metalDark: "#353b3d",
    wood: "#a58052", woodLight: "#cba578", woodDark: "#624e39",
    white: "#e5e4dc", blue: "#537f97", blueDark: "#274866", soil: "#50402d",
    tile: "#c1c2b4", wall: "#cfcec2", cap: "#e0ddd0" },
});
// Contour facets remain sloping shells, rather than grids of cubes.
export function coarseSides(sides = 8, shape = "round", ribs = 0) {
  if (ribs) return Math.min(32, Math.max(6, Math.round(sides)));
  if (shape === "square" || shape === "rounded-square" || shape === "mokko") return 8;
  if (shape === "scallop") return 20;
  if (shape === "fluted") return 12;
  return Math.max(4, Math.min(8, Math.round(sides)));
}
