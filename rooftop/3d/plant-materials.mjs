// Leaf drawings follow morphology, while all fields share the approved metric.
export function plantPaintKind(p) {
  if (p.form === "split") return "leaf-split";
  if (/snake|spider|zebra|exp-(ridged|windows|scales)/.test(p.form)) return "leaf-striped";
  if (/coleus|hosta|exp-silver/.test(p.form)) return "leaf-variegated";
  if (/exp-(cushion|swept|feather|fern-moss|stars|redstars|hairpoints|bent|broad-moss|two-row|sphagnum)/.test(p.form)) return "leaf-moss";
  if (/rosette|jade|kalanchoe|agave|exp-(triangle|pointed|powder|velvet|paws|crinkle|paddles|jaws|tree|stones|bubble)/.test(p.form)) return "leaf-succulent";
  return p.family === "dry" ? "leafRigid" : "leaf";
}
