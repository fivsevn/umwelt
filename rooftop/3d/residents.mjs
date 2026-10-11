import { OUTFITS, DECORATIONS, wardrobe } from "../wardrobe.mjs";
// Box silhouettes, asymmetric hair and tailored garments share the existing wardrobe.
// Primitive records are also authored and independently reopened in Blender.
function actorPrimitives(api) {
  return { ...api,
    box(...args) { if (!args[8] || args[8] === "plain") args[8] = "actor-plain"; return api.box(...args); },
    beam(g, a, b, width, color, depth = width, kind = "actor-plain") { return api.beam(g, a, b, width, color, depth, kind); },
  };
}
export function buildResident(api, parent) {
  const { group, box, beam, modelApi, P } = actorPrimitives(api);
  const cyl = (g,x,y,z,rt,rb,h,color,_sides,kind) => box(g,x,y,z,Math.max(rt,rb)*2,h,Math.max(rt,rb)*2,color,kind);
  const block = (g,x,y,z,rx,ry,rz,color,kind) => box(g,x,y,z,rx*2,ry*2,rz*2,color,kind);
  const g = group(parent);
  g.scale.setScalar(1.1);
  g.userData.weathered = false;
  g.userData.animated = true;
  const body = group(g);
  body.userData.animated = true;
  const [, color, dark, light, kind] = OUTFITS[wardrobe.outfit] || OUTFITS.sage;
  box(body, 0, 1.1, 0, 0.49, 0.7, 0.32, color, "actor-cloth");
  if (kind === "overall") {
    for (const x of [-0.17, 0.17]) {
      box(body, x, 0.65, 0, 0.23, 0.5, 0.28, color, "actor-cloth");
      box(body, x, 1.31, 0.19, 0.055, 0.38, 0.035, light);
    }
    box(body, 0, 1.03, 0.18, 0.34, 0.32, 0.035, dark);
  } else {
    for (let j = 0; j < 5; j++)
      box(
        body,
        0,
        0.66 + j * 0.06,
        0,
        0.63 - j * 0.027,
        0.07,
        0.4 - j * 0.012,
        j === 0 ? dark : color,
        "actor-cloth",
      );
    for (const x of [-0.28, 0.28])
      box(body, x, 0.85, 0, 0.08, 0.26, 0.38, dark, "actor-cloth");
  }
  if (kind === "stripe" || kind === "check")
    for (const z of [-0.185, 0.185])
      for (let j = 0; j < 5; j++) {
        if (kind === "stripe")
          box(body, 0, 0.79 + j * 0.13, z, 0.5, 0.033, 0.023, light);
        else
          for (let k = 0; k < 4; k++)
            box(
              body,
              -0.19 + k * 0.13,
              0.8 + j * 0.12,
              z,
              0.052,
              0.052,
              0.023,
              light,
            );
      }
  if (kind === "apron") {
    box(body, 0, 1.04, 0.19, 0.34, 0.55, 0.035, light, "actor-cloth");
    box(body, 0, 1, 0.212, 0.37, 0.035, 0.025, dark);
    for (const x of [-0.2, 0.2])
      box(body, x, 1.41, 0.04, 0.045, 0.17, 0.31, light);
    for (const x of [-0.11, 0.11])
      box(body, x, 1, -0.19, 0.16, 0.085, 0.065, light);
    box(body, 0, 0.9, 0.22, 0.18, 0.09, 0.018, color);
  }
  if (kind === "pocket")
    for (const x of [-0.145, 0.145]) {
      box(body, x, 1.02, 0.18, 0.17, 0.17, 0.055, dark);
      box(body, x, 1.11, 0.21, 0.17, 0.024, 0.023, light);
      box(body, x, 0.85, -0.185, 0.14, 0.13, 0.025, dark);
    }
  if (kind === "jacket") {
    box(body, 0, 1.11, 0.183, 0.065, 0.64, 0.025, dark);
    for (const x of [-0.09, 0.09])
      box(
        body,
        x,
        1.39,
        0.19,
        0.07,
        0.19,
        0.055,
        light,
        "actor-cloth",
        0,
        0,
        x < 0 ? -0.35 : 0.35,
      );
    for (let j = 0; j < 4; j++)
      box(body, 0, 0.92 + j * 0.11, 0.209, 0.025, 0.025, 0.025, light);
  }
  // Tailored neckline, hem and an offset pocket stay legible at roof scale.
  box(body, 0, 1.44, 0.01, 0.2, 0.16, 0.25, "#cfad90", "skin");
  box(body, -0.085, 1.45, 0.174, 0.12, 0.05, 0.034, light, "actor-cloth");
  box(body, 0.1, 1.43, 0.174, 0.1, 0.045, 0.034, dark, "actor-cloth");
  if (["dress", "stripe", "check"].includes(kind)) {
    box(body, -0.15, 0.98, 0.209, 0.16, 0.17, 0.025, color, "actor-cloth");
    box(body, -0.15, 1.055, 0.225, 0.16, 0.025, 0.015, light);
    box(body, 0.1, 0.71, -0.18, 0.08, 0.08, 0.023, dark, "actor-cloth");
  }
  block(body, 0, 1.78, 0.015, 0.23, 0.26, 0.205, "#d0ad91", "skin");
  block(body, -0.015, 1.98, -0.025, 0.25, 0.15, 0.215, "#685044", "hair");
  box(body, -0.21, 1.87, -0.02, 0.105, 0.3, 0.35, "#4f4038", "hair");
  box(body, 0.2, 1.92, -0.08, 0.09, 0.25, 0.28, "#735847", "hair");
  box(body, 0, 1.86, -0.18, 0.4, 0.24, 0.065, "#685044", "hair");
  box(
    body,
    -0.11,
    1.94,
    0.244,
    0.19,
    0.12,
    0.055,
    "#755a48",
    "hair",
    0,
    0,
    -0.13,
  );
  box(
    body,
    0.105,
    1.97,
    0.242,
    0.16,
    0.095,
    0.055,
    "#685044",
    "hair",
    0,
    0,
    0.18,
  );
  for (const x of [-0.1, 0.1])
    box(body, x, 1.79, 0.211, 0.035, 0.048, 0.023, "#443e38");
  box(body, 0.018, 1.737, 0.228, 0.052, 0.05, 0.035, "#c49a7f", "skin");
  box(body, -0.075, 1.695, 0.229, 0.07, 0.022, 0.018, "#b17a72");
  for (const x of [-0.23, 0.23])
    block(body, x, 1.78, 0, 0.042, 0.068, 0.04, "#c09b81", "skin");
  const legs = [];
  for (const x of [-0.16, 0.16]) {
    const leg = group(g, x, 0.65, 0);
    leg.userData.animated = true;
    box(
      leg,
      0,
      -0.27,
      0,
      0.14,
      0.62,
      0.16,
      kind === "overall" ? color : "#c09e83",
      kind === "overall" ? "actor-cloth" : "skin",
    );
    box(leg, 0, -0.49, 0.01, 0.15, 0.1, 0.17, "#c5bca6", "actor-cloth");
    box(leg, 0, -0.58, 0.075, 0.2, 0.13, 0.29, "#424b40", "actor-cloth");
    box(leg, 0, -0.632, 0.065, 0.21, 0.035, 0.3, "#2d3734");
    box(leg, -0.03, -0.555, 0.184, 0.08, 0.024, 0.022, "#7d8675");
    legs.push(leg);
  }
  const arms = [];
  for (const x of [-0.33, 0.33]) {
    const arm = group(body, x, 1.38, 0);
    arm.userData.animated = true;
    if (kind === "jacket")
      box(arm, 0, -0.14, 0, 0.19, 0.34, 0.21, color, "actor-cloth");
    box(arm, 0, -0.25, 0, 0.14, 0.27, 0.15, "#c9a68b", "skin");
    block(arm, 0, -0.42, 0.02, 0.075, 0.09, 0.074, "#d0ad91", "skin");
    arms.push(arm);
  }
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
  return { person: g, body, legs, arms, tools };
}
export function buildPig(api, parent) {
  const { group, box, beam, P } = actorPrimitives(api);
  const cyl = (g,x,y,z,rt,rb,h,color,_sides,kind) => box(g,x,y,z,Math.max(rt,rb)*2,h,Math.max(rt,rb)*2,color,kind);
  const block = (g,x,y,z,rx,ry,rz,color,kind) => box(g,x,y,z,rx*2,ry*2,rz*2,color,kind);
  const g = group(parent);
  g.userData.weathered = false;
  g.userData.animated = true;
  block(g, 0, 0.43, -0.06, 0.335, 0.265, 0.395, "#dfb5a5", "skin");
  const face = group(g);
  face.userData.animated = true;
  block(face, 0, 0.49, 0.32, 0.275, 0.25, 0.27, "#edc6b1", "skin");
  block(face, 0, 0.435, 0.605, 0.132, 0.092, 0.1, "#dba59c", "skin");
  for (const x of [-0.062, 0.062])
    box(face, x, 0.452, 0.706, 0.026, 0.028, 0.012, "#986b63");
  const ears = [],
    eyes = [];
  for (const side of [-1, 1]) {
    const ear = group(face, side * 0.235, 0.715, 0.27);
    ear.userData.animated = true;
    box(
      ear,
      0,
      0.028,
      0.008,
      0.135,
      0.16,
      0.12,
      "#d6a194",
      "skin",
      0.22,
      0,
      side * -0.42,
    );
    box(
      ear,
      side * 0.008,
      0.02,
      0.073,
      0.065,
      0.095,
      0.015,
      "#c58a83",
      "skin",
      0.2,
      0,
      side * -0.42,
    );
    ears.push(ear);
    const eye = group(face, side * 0.148, 0.565, 0.608);
    eye.userData.animated = true;
    box(eye, 0, 0, 0, 0.052, 0.066, 0.028, "#50433c");
    box(eye, -0.008, 0.014, 0.018, 0.019, 0.019, 0.015, "#fff0dc");
    eyes.push(eye);
    block(
      face,
      side * 0.212,
      0.448,
      0.609,
      0.047,
      0.031,
      0.015,
      "#dc9e95",
      "skin",
    );
    beam(
      face,
      [side * 0.02, 0.345, 0.606],
      [side * 0.065, 0.327, 0.607],
      0.014,
      "#986b63",
    );
    beam(
      face,
      [side * 0.065, 0.327, 0.607],
      [side * 0.092, 0.347, 0.606],
      0.014,
      "#986b63",
    );
  }
  const pigLegs = [];
  for (const x of [-0.18, 0.18])
    for (const z of [-0.28, 0.25]) {
      const leg = group(g, x, 0.21, z);
      leg.userData.animated = true;
      box(leg, 0, -0.065, 0, 0.112, 0.15, 0.125, "#c99a8e", "skin");
      box(leg, 0, -0.157, 0.01, 0.12, 0.07, 0.145, "#826762");
      box(leg, 0, -0.157, 0.087, 0.012, 0.054, 0.012, "#4e4844");
      pigLegs.push(leg);
    }
  const tail = group(g, 0.045, 0.49, -0.445);
  tail.userData.animated = true;
  const curl = [
    [0, 0, 0],
    [0.075, 0.055, -0.025],
    [0.115, 0.015, -0.045],
    [0.072, -0.038, -0.05],
    [0.045, -0.015, -0.052],
  ];
  for (let j = 1; j < curl.length; j++)
    beam(tail, curl[j - 1], curl[j], 0.025, "#c89690", 0.025, "skin");
  const decoration = DECORATIONS[wardrobe.pig];
  if (decoration) {
    const col = wardrobe.pig.includes("clay")
      ? "#ae8270"
      : wardrobe.pig.includes("cream") || wardrobe.pig === "flower"
        ? "#c3b994"
        : wardrobe.pig.includes("berry") || wardrobe.pig === "ribbon"
          ? "#986e7c"
          : wardrobe.pig.includes("blue") || wardrobe.pig === "scarf"
            ? "#788d9b"
            : "#778578";
    const kind = wardrobe.pig.split("-")[0];
    const headwear = group(face);
    if (kind === "cap" || kind === "bonnet") {
      box(headwear, 0, .775, .32, .48, .07, .43, col, "actor-cloth");
      box(headwear, 0, .855, .32, .33, .11, .31, col, "actor-cloth");
      if (kind === "bonnet") {
        for (const [x,z] of [[-.27,.10],[-.10,.08],[.10,.08],[.27,.10],[-.27,.32],[.27,.32],[-.27,.55],[-.10,.57],[.10,.57],[.27,.55]])
          box(headwear,x,.775,z,.075,.065,.07,"#ddd3b5");
        for (const x of [-.20,.20]) box(headwear,x,.61,.618,.035,.27,.035,col,"actor-cloth");
      } else box(headwear,0,.77,.61,.38,.045,.20,col,"actor-cloth");
    } else if (kind === "vest") {
      box(g,0,.43,-.06,.698,.556,.816,col,"actor-cloth");
      for (const x of [-.345,.345]) box(g,x,.44,-.05,.035,.30,.60,col,"actor-cloth");
      box(g,0,.40,-.465,.24,.22,.026,col,"actor-cloth");
      for (let j=0;j<3;j++) box(g,0,.34+j*.055,-.49,.025,.025,.025,"#c8c2a4");
    } else if (kind === "ribbon") {
      box(headwear,0,.81,.64,.08,.10,.08,col,"actor-cloth");
      for (const x of [-.13,.13]) {
        box(headwear,x,.81+(x<0?.015:-.012),.625,.17,.14,.065,col,"actor-cloth",0,0,x<0?-.16:.23);
        box(headwear,x*.4,.71,.621,.065,.15,.04,col,"actor-cloth");
      }
    } else if (kind === "flower") {
      for (const [x,y] of [[-.11,0],[.11,0],[0,.11],[0,-.11]]) box(headwear,x,.81+y,.625,.115,.115,.06,col,"actor-cloth");
      box(headwear,0,.81,.66,.07,.07,.04,"#ccb473");
    } else {
      for (const x of [-.29,.29]) box(g,x,.29,.42,.04,.09,.38,col,"actor-cloth");
      box(g,0,.29,.615,.57,.09,.055,col,"actor-cloth");
      if (kind === "bell") {
        box(g,0,.19,.636,.11,.12,.10,"#bfa46e");
        box(g,0,.12,.636,.022,.025,.022,"#715f43");
      } else {
        box(g,.075,.17,.632,.15,.19,.055,col,"actor-cloth");
        box(g,.04,.275,.634,.09,.075,.08,col,"actor-cloth");
      }
    }
  }

  return { pig: g, pigLegs, ears, tail, pigFace: face, pigEyes: eyes };
}
