import { WEAPONS } from "../weapons.mjs";
import { PLANTS, POTS } from "../botany.mjs";
import { plantPotSpec } from "./plant-pots.mjs";
import { vesselDimensions, vesselInterior } from "./vessel-models.mjs";
import { foliageHeight } from "./plant-envelope.mjs";
import { washstationSpec } from "./washstation.mjs";
import { OBJECT_DIMENSIONS } from "./object-dimensions.mjs";
import { RACK_GRID } from "./rack-grid.mjs";

const plants = new Map(PLANTS.map((p) => [p.id, p]));
const weapons = new Map(WEAPONS.map((a) => [a.id, a]));
const pots = new Map(POTS.map((p) => [p.id, p]));
// A single catalogue contract. Adding a non-botanical asset requires choosing a
// group here and defining its surfaces/clearances below; unknown IDs never fall
// through to a misleading "small prop" category.
export const SPACE_GROUPS = [
  {
    id: "racks",
    role: "furniture",
    label: "花架",
    types: [
      "shelf",
      "woodshelf",
      "tierstand",
      "ladderstand",
      "wallrack",
      "plantcart",
      "wirestand",
      "basketstand",
      "coveredstand",
    ],
  },
  {
    id: "tops",
    role: "furniture",
    label: "桌椅与台面",
    types: [
      "table",
      "pottingbench",
      "bistrotable",
      "bench",
      "stool",
      "gardenbench",
      "foldingchair",
      "room-armchair",
      "ceramicseat",
      "lowplatform",
      "stepstool",
      "foamstand",
    ],
  },
  {
    id: "closed",
    role: "furniture",
    label: "柜床与箱桶",
    types: [
      "room-wardrobe",
      "room-dresser",
      "storagechest",
      "room-bed",
      "rainbarrel",
    ],
  },
  { id: "wash", role: "furniture", label: "水池台", types: ["sink", "basin"] },
  {
    id: "cases",
    role: "holder",
    label: "玻璃罩与保湿柜",
    types: ["terrarium", "wardcase"],
  },
  {
    id: "containers",
    role: "holder",
    label: "空容器",
    types: [
      "bucket",
      "crate",
      "redbox",
      "pot",
      "enamelbowl",
      "strainer",
      "wirebasket",
      "bamboo-basket",
    ],
  },
  {
    id: "vessels",
    role: "holder",
    label: "花盆与花器",
    types: POTS.map((p) => "vessel-" + p.id),
  },
  { id: "plants", role: "item", label: "植物", types: PLANTS.map((p) => p.id) },
  {
    id: "cultivation",
    role: "item",
    label: "栽培物件",
    types: ["moss", "mossbox", "seedtray", "foambox"],
  },
  {
    id: "aquatic",
    role: "item",
    label: "水族物件",
    types: ["fish", "pond", "medakabowl", "goldfishbowl", "fishbox"],
  },
  {
    id: "tools",
    role: "item",
    label: "园艺工具",
    types: [
      "watering",
      "tools",
      "hose",
      "thermometer",
      "towel",
      "soilbag",
      "labels",
      "gloves",
      "brush",
      "lid",
      "sprayer",
      "pruning-shears",
      "broom",
    ],
  },
  {
    id: "daily",
    role: "item",
    label: "生活用品与装置",
    types: ["teaset", "pigbowl", "drying", "trellis", "parasol"],
  },
  {
    id: "decoration",
    role: "item",
    label: "灯饰与摆件",
    types: [
      "solarlamp",
      "tasklamp",
      "tinlantern",
      "stringlights",
      "pinwheel",
      "windchime",
    ],
  },
  {
    id: "firearms",
    role: "item",
    label: "枪械",
    types: WEAPONS.filter((w) => w.category === "枪械").map((w) => w.id),
  },
  {
    id: "weapons",
    role: "item",
    label: "其他兵器",
    types: WEAPONS.filter((w) => w.category !== "枪械").map((w) => w.id),
  },
];
const definitions = new Map();
for (const [order, group] of SPACE_GROUPS.entries())
  for (const type of group.types) {
    if (definitions.has(type)) throw Error("重复空间定义：" + type);
    definitions.set(type, {
      group: group.id,
      category: group.label,
      role: group.role,
      order,
      bearing: group.role !== "item",
      portable: true,
      // Compatibility inference is deliberately narrower than explicit placement.
      // Existing floor furniture must not acquire a new parent when opening a save.
      inferLegacy:
        group.role !== "furniture" ||
        ["bench", "stool", "ceramicseat"].includes(type),
      kind: plants.has(type)
        ? "plant"
        : group.id === "vessels"
          ? "vessel"
          : group.role === "holder"
            ? "container"
            : group.role === "furniture"
              ? "furniture"
              : "prop",
    });
  }
const racks = new Set(SPACE_GROUPS[0].types);
const floorFurniture = new Set(
  SPACE_GROUPS.filter((g) => g.role === "furniture").flatMap((g) => g.types),
);
export function placementKind(type) {
  const definition = definitions.get(type);
  if (!definition) throw Error("缺少空间定义：" + type);
  return definition;
}

export function physicalFootprint(o) {
  const p = plants.get(o.type),
    s = o.scale || 1;
  if (p || o.type.startsWith("vessel-") || o.type === "pot") {
    const spec = p
      ? plantPotSpec(p)
      : o.type === "pot"
        ? { radius: 0.5625, height: 0.9375 }
        : { radius: 0.67, height: 0.58 };
    const pot =
      pots.get(
        p
          ? o.pot || p.defaultPot
          : o.type === "pot"
            ? "terra"
            : o.type.slice(7),
      ) || pots.get("terra");
    const v = vesselDimensions(pot, spec.radius, spec.height),
      k = s * (p ? (p.id === "barrel" ? 1.15 : 1.38) : 1);
    let w, d, mw, md;
    if (/box|bag/.test(pot.shape)) {
      w = spec.radius * (pot.id === "trough" ? 3.1 : 1.95);
      d = spec.radius * (pot.id === "trough" ? 1.32 : 1.55);
      mw = w + 0.12;
      md = d + 0.12;
    } else {
      const base =
        v.foot > 0
          ? Math.max(0.66, v.art?.footRadius || 0)
          : v.art?.profile[0][0] || 0.7;
      w = d = v.r * 2 * base;
      mw =
        v.r * 2 * (v.art ? Math.max(...v.art.profile.map((q) => q[0])) : 1) +
        0.1;
      md = mw * (v.art?.shape === "oval" ? 0.76 : 1);
      d *= v.art?.shape === "oval" ? 0.76 : 1;
    }
    const body = v.h + v.foot,
      extra = p ? foliageHeight(p, o, spec.radius, body) : 0;
    return {
      w: w * k,
      d: d * k,
      mouthW: mw * k,
      mouthD: md * k,
      h:
        (!p && pot.antique
          ? body + Math.max(0.012, v.r * 0.025)
          : body - 0.044 + extra) * k,
      body: body * k,
      circle: !/box|bag|square/.test(v.art?.shape || pot.shape),
      groundW: w * k,
      groundD: d * k,
    };
  }
  const weapon = weapons.get(o.type);
  if (weapon)
    return {
      w: weapon.w * 0.043 * s,
      d: weapon.h * 0.043 * s,
      h: 0.28 * s,
      body: 0.28 * s,
      groundW: weapon.w * 0.043 * s,
      groundD: weapon.h * 0.043 * s,
    };
  const dim = OBJECT_DIMENSIONS[o.type];
  if (!dim) throw Error("缺少放置规格：" + o.type);
  const [w, d, h] = dim.map((v) => (v / 16) * s);
  const smallBases = {
    parasol: [1.02, 1.02],
    broom: [(w * 0.55) / s, (d * 0.42) / s],
    pinwheel: [0.54, 0.54],
    tasklamp: [0.7, 0.7],
    windchime: [0.8, 0.6],
    solarlamp: [0.1, 0.1],
    thermometer: [0.2, 0.15],
  };
  const base = smallBases[o.type];
  const rackBase =
    racks.has(o.type) &&
    !["woodshelf", "ladderstand", "plantcart"].includes(o.type);
  const feet = rackBase
    ? [w * 0.9 + 0.075 * 1.7 * s, d * 0.86 + 0.075 * 1.7 * s]
    : null;
  return {
    w,
    d,
    h,
    body: h,
    groundW: base
      ? base[0] * s
      : feet
        ? feet[0]
        : floorFurniture.has(o.type)
          ? Math.max(0.2, w - 0.12 * s)
          : w,
    groundD: base
      ? base[1] * s
      : feet
        ? feet[1]
        : floorFurniture.has(o.type)
          ? Math.max(0.15, d - 0.12 * s)
          : d,
  };
}

// These descriptors are also used by the geometry builders. Heights identify the
// top of a board, never its centre; ceiling is clear space under the next board.
export function supportSurfaces(o) {
  if (o.type.startsWith("vessel-") || o.type === "pot") {
    const p = pots.get(o.type === "pot" ? "terra" : o.type.slice(7));
    const radius = o.type === "pot" ? 0.5625 : 0.67,
      height = o.type === "pot" ? 0.9375 : 0.58;
    const interior = vesselInterior(p, radius, height),
      s = o.scale || 1;
    return [
      {
        id: "inside",
        label: "器物内部",
        x: 0,
        z: 0,
        y: interior.y * s,
        w: interior.w * s,
        d: interior.d * s,
        rim: interior.rim * s,
        shape: interior.shape,
        container: true,
        ceiling: Infinity,
        thickness: 0,
      },
    ];
  }
  const dim = OBJECT_DIMENSIONS[o.type];
  if (!dim) return [];
  const [w, d, h] = dim.map((v) => v / 16),
    type = o.type,
    s = o.scale || 1;
  const rect = (id, label, y, ww = w, dd = d, z = 0, extra = {}) => ({
    id,
    label,
    y: y * s,
    w: ww * s,
    d: dd * s,
    x: 0,
    z: z * s,
    ceiling: Infinity,
    thickness: 0,
    ...extra,
  });
  const scaleExtra = (v) =>
    Object.fromEntries(
      Object.entries(v).map(([k, n]) => [
        k,
        typeof n === "number" &&
        ["x", "ceiling", "thickness", "rim"].includes(k)
          ? n * s
          : n,
      ]),
    );
  const r = (id, label, y, ww = w, dd = d, z = 0, extra = {}) =>
    rect(id, label, y, ww, dd, z, scaleExtra(extra));
  if (["woodshelf", "ladderstand"].includes(type))
    return [0, 1, 2].map((i) =>
      r(
        ["lower", "middle", "upper"][i],
        ["第一层", "第二层", "第三层"][i],
        0.23 + (i * (h - 0.24)) / 2,
        w - (type === "ladderstand" ? i * 0.18 : 0),
        d * 0.37,
        d / 2 - ((i + 0.5) * d) / 3,
        { thickness: 0.1 },
      ),
    );
  if (racks.has(type) && type !== "foamstand") {
    const yy =
      type === "plantcart"
        ? [h * 0.13, h * 0.51, h * 0.9]
        : type === "wallrack"
          ? [0.18, h * 0.4, h * 0.68, h * 0.92]
          : [0.18, h * 0.52, h * 0.92];
    const thickness = type === "plantcart" ? 0.06 : 0.075;
    return yy.map((y, i) =>
      r(
        ["lower", "middle", "upper", "highest"][i],
        `第${["一", "二", "三", "四"][i]}层`,
        y + thickness / 2,
        w * 0.94,
        d * 0.88,
        0,
        {
          thickness,
          lattice: { pitch: RACK_GRID.pitch * s, bar: RACK_GRID.bar * s },
          ceiling:
            i < yy.length - 1
              ? yy[i + 1] - y - thickness
              : type === "coveredstand"
                ? h + 0.21 - y - thickness / 2
                : Infinity,
        },
      ),
    );
  }
  if (type === "stepstool")
    return [
      r("lower", "下层踏板", h * 0.48 + 0.055, w * 0.88, d * 0.35, d * 0.26),
      r("upper", "上层踏板", h + 0.06, w * 0.88, d * 0.44, -d * 0.2),
    ];
  if (["table", "bistrotable"].includes(type))
    return [
      r("top", "桌面", h + 0.05, w * 0.96, d * 0.94, 0, {
        shape: type === "bistrotable" ? "ellipse" : "rect",
      }),
    ];
  if (["bench", "stool", "lowplatform", "pottingbench"].includes(type))
    return [r("top", "台面", h * 0.94 + 0.055, w * 0.94, d * 0.92)];
  if (["room-dresser", "room-wardrobe", "storagechest"].includes(type))
    return [r("top", "柜顶", h + 0.06, w * 0.95, d * 0.95)];
  if (type === "room-bed")
    return [r("top", "床面", h * 0.71 + 0.009, w * 0.86, d * 0.49, d * 0.19)];
  if (type === "room-armchair")
    return [r("seat", "座面", h * 0.5, w * 0.66, d * 0.52, d * 0.1)];
  if (type === "gardenbench")
    return [r("seat", "座面", h * 0.5 + 0.05, w * 0.76, d * 0.7, d * 0.04)];
  if (type === "foldingchair")
    return [r("seat", "座面", h * 0.52 + 0.05, w * 0.78, d * 0.61)];
  if (type === "ceramicseat")
    return [
      r("top", "顶面", h + 0.058, w * 0.75, d * 0.75, 0, { shape: "ellipse" }),
    ];
  if (type === "foamstand")
    return [
      r("top", "木台面", h * 0.94 + 0.055, w * 0.94, d * 0.92, 0, {
        thickness: 0.11,
      }),
    ];
  if (["crate", "redbox", "wirebasket"].includes(type))
    return [
      r("inside", "容器内部", 0.075, w - 0.2, d - 0.2, 0, {
        container: true,
        rim: h + 0.05,
      }),
    ];
  if (type === "bamboo-basket")
    return [
      r("inside", "篮内底面", 0.075, w * 0.65, d * 0.64, 0, {
        container: true,
        rim: h * 0.73,
        shape: "ellipse",
      }),
    ];
  if (type === "rainbarrel")
    return [
      r("top", "桶盖", h * 0.93 + 0.057, w * 0.78, d * 0.78, 0, {
        shape: "ellipse",
        holes: [{ x: 0, z: 0, w: 0.35 * s, d: 0.12 * s, shape: "rect" }],
      }),
    ];
  if (["terrarium", "wardcase"].includes(type))
    return [
      r("inside", "柜内底板", 0.16, w * 0.83, d * 0.73, 0, {
        container: true,
        ceiling: h * 0.71 - 0.16,
        rim: h,
      }),
    ];
  if (type === "bucket")
    return [
      r("inside", "桶内", 0.095, 0.5, 0.5, 0, {
        container: true,
        rim: 0.69,
        shape: "ellipse",
      }),
    ];
  if (["enamelbowl", "strainer"].includes(type))
    return [
      r(
        "inside",
        "盆内",
        type === "enamelbowl" ? 0.18 : 0.075,
        w * 0.53,
        d * 0.53,
        0,
        { container: true, rim: h * 0.8, shape: "ellipse" },
      ),
    ];
  if (type === "sink" || type === "basin") {
    const { bw, bd, bx, top, depth } = washstationSpec(w, d, h, type);
    return [
      r("counter", "水池台面", top + 0.075, w * 0.98, d * 0.93, d * 0.015, {
        holes: [
          {
            x: bx * s,
            z: 0,
            w: (bw + 0.04) * s,
            d: (bd + 0.04) * s,
            shape: type === "basin" ? "ellipse" : "rect",
          },
        ],
      }),
      r("inside", "池内中央", top - depth + 0.021, bw * 0.72, bd * 0.69, 0, {
        x: bx,
        container: true,
        rim: top,
        shape: type === "basin" ? "ellipse" : "rect",
        point: true,
      }),
    ];
  }
  return [];
}

// A ground region is a convenience for finding the real floor under furniture.
// It creates no support edge and is never carried by that furniture.
export function placementSpaces(o) {
  const surfaces = supportSurfaces(o).map((s) => ({ ...s, bearing: "object" }));
  const dim = OBJECT_DIMENSIONS[o.type];
  if (!dim) return surfaces;
  const [w, d, h] = dim.map((v) => v / 16),
    type = o.type,
    s = o.scale || 1;
  let ceiling = null,
    ww = w * 0.78,
    dd = d * 0.72,
    z = 0;
  if (
    [
      "table",
      "bench",
      "stool",
      "lowplatform",
      "foamstand",
      "pottingbench",
    ].includes(type)
  )
    ceiling = (type === "table" ? h : h * 0.94) - 0.065;
  if (type === "bistrotable") {
    ceiling = h - 0.06;
    ww = w * 0.76;
    dd = d * 0.76;
  }
  if (type === "gardenbench") ceiling = h * 0.5 - 0.055;
  if (type === "foldingchair") {
    ceiling = h * 0.52 - 0.055;
    ww = w * 0.65;
    dd = d * 0.59;
  }
  if (type === "room-bed") {
    ceiling = h * 0.39 - 0.08;
    ww = w * 0.79;
    dd = d * 0.82;
  }
  if (type === "room-armchair") {
    ceiling = h * 0.32;
    ww = w * 0.66;
    dd = d * 0.72;
  }
  if (["room-dresser", "room-wardrobe"].includes(type)) ceiling = h * 0.08;
  if (["sink", "basin"].includes(type)) {
    ceiling = h * 0.94 - 0.26;
    ww = w * 0.77;
    dd = d * 0.72;
  }
  if (racks.has(type) && !["woodshelf", "ladderstand"].includes(type))
    ceiling = supportSurfaces({ ...o, scale: 1 })[0].y - 0.09;
  if (["woodshelf", "ladderstand"].includes(type))
    for (const board of supportSurfaces(o))
      surfaces.push({
        ...board,
        id: "under-" + board.id,
        label: board.label + "下方地面",
        bearing: "ground",
        y: 0,
        w: board.w - 0.3 * s,
        d: board.d - 0.16 * s,
        ceiling: board.y - 0.1 * s,
        thickness: 0,
      });
  if (ceiling !== null && ceiling > 0.025)
    surfaces.push({
      id: "under",
      label: "下方地面",
      bearing: "ground",
      x: 0,
      z: z * s,
      y: 0,
      w: ww * s,
      d: dd * s,
      ceiling: ceiling * s,
      thickness: 0,
    });
  return surfaces;
}

// Solid parts occupy local volumes. Both dropdown placement and dragging use
// these constraints, including legs, braces, plumbing and the underside of bowls.
function buildSpaceObstacles(o) {
  const dim = OBJECT_DIMENSIONS[o.type];
  if (!dim) return [];
  const [w, d, h] = dim.map((v) => v / 16),
    type = o.type,
    s = o.scale || 1,
    parts = [];
  const box = (x, y, z, ww, hh, dd, extra = {}) =>
    parts.push({
      x: x * s,
      y: y * s,
      z: z * s,
      w: ww * s,
      h: hh * s,
      d: dd * s,
      ...extra,
    });
  if (
    floorFurniture.has(type) &&
    ![
      "ceramicseat",
      "storagechest",
      "rainbarrel",
      "woodshelf",
      "ladderstand",
    ].includes(type)
  ) {
    const legTop = ["gardenbench", "foldingchair"].includes(type)
      ? h * 0.5
      : type === "room-bed"
        ? h * 0.45
        : type === "room-armchair"
          ? h * 0.3
          : ["room-wardrobe", "room-dresser"].includes(type)
            ? 0.19
            : h;
    for (const x of [-w * 0.45, w * 0.45])
      for (const z of [-d * 0.43, d * 0.43])
        box(x, legTop / 2, z, 0.14, legTop, 0.14);
  }
  if (["woodshelf", "ladderstand"].includes(type))
    for (const board of supportSurfaces({ ...o, scale: 1 }))
      for (const x of [-board.w * 0.46, board.w * 0.46])
        box(x, (board.y - 0.05) / 2, board.z, 0.11, board.y - 0.05, 0.11);
  if (["storagechest", "ceramicseat", "rainbarrel"].includes(type)) {
    const bodyTop = type === "rainbarrel" ? h * 0.93 + 0.03 : h;
    box(0, bodyTop / 2, 0, w * 0.8, bodyTop, d * 0.8);
  }
  if (type === "table") box(0, h * 0.7, -d * 0.41, w, 0.12, 0.11);
  if (type === "pottingbench")
    box(0, h * 0.8, d * 0.3, w * 0.9, h * 0.22, d * 0.32);
  if (["room-wardrobe", "room-dresser"].includes(type))
    box(0, h * 0.53, 0, w, h * 0.9, d);
  if (type === "room-armchair") {
    box(0, h * 0.76, -d * 0.37, w * 0.84, h * 0.53, d * 0.18);
    for (const x of [-w * 0.44, w * 0.44])
      box(x, h * 0.58, 0, w * 0.16, h * 0.4, d * 0.88);
  }
  if (["gardenbench", "foldingchair"].includes(type))
    box(0, h * 0.79, -d * 0.4, w * 0.85, h * 0.4, 0.14);
  if (type === "room-bed")
    for (const z of [-d * 0.47, d * 0.47])
      box(0, h * (z < 0 ? 0.67 : 0.33), z, w, h * (z < 0 ? 0.66 : 0.28), 0.14);
  if (type === "bistrotable")
    for (const z of [-d * 0.2, d * 0.2])
      box(0, h * 0.48, z, w * 0.45, h * 0.9, 0.07);
  if (["sink", "basin"].includes(type)) {
    const { bw, bd, bx, top, depth } = washstationSpec(w, d, h, type),
      py = top - depth - 0.06;
    box(bx, top - depth / 2 - 0.028, 0, bw, depth + 0.055, bd, {
      cavity: "inside",
    });
    box(bx, (py + 0.08) / 2, 0, 0.15, py - 0.08, 0.15);
    box(bx, 0.12, -0.2, 0.12, 0.12, 0.42);
    box(bx, 0.235, -0.43, 0.12, 0.35, 0.12);
    box(bx, 0.35, (-0.43 - d * 0.46) / 2, 0.12, 0.12, d * 0.46 - 0.43 + 0.12);
    for (const x of [-w * 0.43, w * 0.43])
      box(x, top * 0.25, 0, 0.055, 0.055, d * 0.83);
    box(0, top * 0.25, -d * 0.4, w * 0.85, 0.055, 0.055);
    box(0, top + 0.16, -d * 0.48, w, 0.23, 0.065);
    box(bx, top + 0.33, -bd / 2 + 0.06, 0.48, 0.58, 0.45);
  }
  for (const surface of supportSurfaces({ ...o, scale: 1 }).filter(
    (q) => !q.container && !q.holes,
  )) {
    const thick = surface.thickness || 0.11;
    box(
      surface.x || 0,
      surface.y - thick / 2,
      surface.z || 0,
      surface.w,
      thick,
      surface.d,
    );
  }
  return parts;
}

const obstacleCache = new Map();
export function spaceObstacles(o) {
  const key = o.type + ":" + (o.scale || 1);
  if (!obstacleCache.has(key)) {
    if (obstacleCache.size > 1024) obstacleCache.clear();
    obstacleCache.set(key, buildSpaceObstacles(o));
  }
  return obstacleCache.get(key);
}
