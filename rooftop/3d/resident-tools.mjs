export function buildResidentTools(api, arms) {
  const {group,box,beam,modelApi,P}=api;
  const cyl=(g,x,y,z,rt,rb,h,color,_sides,kind)=>box(g,x,y,z,Math.max(rt,rb)*2,h,Math.max(rt,rb)*2,color,kind);
  const tools = {};
  for (const kind of [
    "water",
    "sweep",
    "prune",
    "tend",
    "wipe",
    "wash",
    "tea",
    "feed",
  ]) {
    const tool = group(arms[1], 0, -0.43, 0.06);
    tool.userData.animated = true;
    tool.visible = false;
    tools[kind] = tool;
    if (kind === "water") {
      const can = group(tool, 0.1, -0.05, 0.03);
      can.scale.setScalar(0.4);
      modelApi().makeNativeItem(can, "watering-can");
    }
    if (kind === "sweep") {
      beam(tool, [0, 0.08, 0], [0.15, -0.83, 0.24], 0.035, P.wood);
      box(tool, 0.15, -0.84, 0.24, 0.34, 0.12, 0.15, "#a49473");
      for (let j = 0; j < 7; j++)
        box(tool, 0.015 + j * 0.044, -0.94, 0.24, 0.026, 0.11, 0.15, "#786952");
    }
    if (kind === "prune") {
      for (const v of [-1, 1]) {
        beam(
          tool,
          [v * 0.055, -0.07, 0],
          [-v * 0.09, 0.16, 0.03],
          0.025,
          P.metalLight,
        );
        box(tool, v * 0.055, -0.08, 0, 0.07, 0.08, 0.025, P.blueDark);
      }
    }
    if (kind === "tend") {
      box(tool, 0, 0.07, 0, 0.04, 0.2, 0.04, P.wood);
      box(tool, 0, -0.08, 0.03, 0.11, 0.13, 0.045, P.metalLight);
    }
    if (kind === "wipe")
      box(tool, 0, -0.05, 0.04, 0.25, 0.035, 0.17, "#a4b3a7", "actor-cloth");
    if (kind === "tea" || kind === "feed") {
      cyl(
        tool,
        0,
        -0.025,
        0.09,
        kind === "tea" ? 0.1 : 0.16,
        0.085,
        0.12,
        P.white,
        12,
      );
      cyl(tool, 0, 0.04, 0.09, 0.075, 0.075, 0.014, "#756956", 12);
    }
    if (kind === "wash" || kind === "water")
      for (let j = 0; j < 5; j++)
        box(
          tool,
          0.27 + j * 0.04,
          -0.15 - j * 0.1,
          0.02,
          0.025,
          0.055,
          0.025,
          "#a8c0be",
        );
  }
  return tools;
}
