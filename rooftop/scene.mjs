import { ROOM_LAYOUT, paintRoomBase } from "./room-scene.mjs";
import { INITIAL_LAYOUT } from "./initial-layout.mjs";
import { paintDongdong } from "./dongdong.mjs";
import {
  styledView,
  paintStyledView,
  paintStyledForeground,
} from "./styled-views.mjs";
import { objectReferences } from "./object-references.mjs";
import {
  facingKind,
  facingBounds,
  paintFacing,
  hasForeground,
  paintFacingForeground,
} from "./facing.mjs";
import { OBJECTS, LEGACY_DETAILS, paintDetail } from "./objects.mjs";
import { plantSeed } from "./plant-seed.mjs";
import { paintCity } from "./city.mjs";
import { PLANTS, POTS, plant, vessel } from "./botany.mjs";
import { paintPlant, paintVessel, plantContact } from "./plant-art.mjs";
import { FURNITURE, paintFurniture } from "./furniture.mjs";
// All scenery is painted on an integer canvas. No bitmap assets or external dependencies.
export const VERSION = 2;
export const DOORS = {
  north: { x: 400, y: 406, w: 14, h: 34, label: "进入南阳台" },
  south: { x: 221, y: 371, w: 16, h: 58, label: "进入北天台" },
};
export const SCENES = {
  room: {
    name: "东东的房间",
    label: "DONGDONG’S ROOM",
    points: [
      [220, 104],
      [380, 104],
      [380, 328],
      [220, 328],
    ],
    spawn: [300, 290],
  },
  north: {
    name: "北天台",
    label: "NORTH ROOF",
    points: [
      [144, 144],
      [272, 144],
      [272, 80],
      [400, 80],
      [400, 144],
      [464, 144],
      [464, 464],
      [400, 464],
      [400, 336],
      [144, 336],
    ],
    spawn: [432, 432],
  },
  south: {
    name: "南阳台",
    label: "SOUTH BALCONY",
    points: [
      [220, 104],
      [348, 104],
      [348, 424],
      [220, 424],
    ],
    spawn: [246, 376],
  },
};
const LEGACY_ASSETS = [
  ["barrel", "金琥", "仙人掌", 24, 24],
  ["column", "柱状仙人掌", "仙人掌", 18, 23],
  ["bunny", "兔耳仙人掌", "仙人掌", 19, 20],
  ["cluster", "群生仙人掌", "仙人掌", 25, 21],
  ["trailing", "猴尾柱", "仙人掌", 24, 30],
  ["aloe", "芦荟", "多肉", 26, 23],
  ["rosette", "莲座多肉", "多肉", 20, 19],
  ["pink", "粉色石莲", "多肉", 20, 18],
  ["jade", "玉树", "多肉", 25, 26],
  ["sedum", "景天拼盆", "多肉", 30, 20],
  ["mint", "薄荷", "草木", 24, 22],
  ["rosemary", "迷迭香", "草木", 20, 26],
  ["fern", "蕨类", "草木", 28, 25],
  ["broadleaf", "大叶植物", "草木", 30, 28],
  ["yucca", "丝兰", "草木", 32, 36],
  ["vine", "垂藤", "草木", 23, 28],
  ["flower", "季节小花", "草木", 22, 24],
  ["grass", "葱与细叶草", "草木", 20, 23],
  ["moss", "苔藓浅盘", "苔藓与水", 28, 17],
  ["mossbox", "白色苔藓箱", "苔藓与水", 36, 21],
  ["fish", "小鱼缸", "苔藓与水", 36, 25],
  ["pond", "圆水盆", "苔藓与水", 31, 25],
  ["terrarium", "蓝框保湿柜", "器具", 66, 35],
  ["shelf", "黑色花架", "器具", 64, 28],
  ["woodshelf", "木阶花架", "器具", 52, 40],
  ["bench", "木凳", "器具", 40, 19],
  ["sink", "不锈钢水槽", "器具", 52, 29],
  ["basin", "蓝色水池台", "器具", 64, 32],
  ["table", "工作台", "器具", 58, 30],
  ["drying", "折叠晾衣架", "器具", 28, 66],
  ["watering", "浇水壶", "小物", 16, 18],
  ["bucket", "水桶", "小物", 19, 21],
  ["crate", "蓝色收纳箱", "小物", 30, 22],
  ["redbox", "红色方盆", "小物", 28, 22],
  ["pot", "空陶盆", "小物", 20, 18],
  ["tools", "园艺工具", "小物", 25, 15],
  ["hose", "盘管", "小物", 25, 23],
  ["teaset", "一套茶具", "小物", 30, 18],
  ["pigbowl", "小猪的饭碗", "小物", 18, 12],
  ["stool", "小板凳", "小物", 20, 18],
].map(([id, name, category, w, h]) => ({ id, name, category, w, h }));
export const ASSETS = [
  ...PLANTS.map((p) => ({ ...p, plant: true })),
  ...LEGACY_ASSETS.filter((a) => !plant(a.id)).map((a) => ({
    ...a,
    note: "北天台日常园艺物件，按实物结构绘制。",
    care: "放在稳固平面上，留出日常使用空间。",
    sources: [],
    ...LEGACY_DETAILS[a.id],
    ...(["shelf", "woodshelf", "bench", "table", "stool"].includes(a.id)
      ? { furniture: true, category: "家具" }
      : {}),
  })),
  ...FURNITURE,
  ...OBJECTS,
  ...POTS.map((p) => ({
    id: "vessel-" + p.id,
    name: p.name,
    category: "花盆",
    w: 32,
    h: 24,
    vessel: p.id,
  })),
];
for (const a of ASSETS)
  if (!a.plant) {
    const refs = [
      ...(a.sources || []),
      ...(a.vessel ? vessel(a.vessel).sources || [] : []),
      ...objectReferences(a),
    ];
    a.sources = refs.filter(
      (r, i) => refs.findIndex((other) => other.url === r.url) === i,
    );
  }
// Catalogue lookup is shared by rendering, placement and save validation.
const assetIndex = new Map(ASSETS.map((a) => [a.id, a]));
export const asset = (id) => assetIndex.get(id);
export function initialLayout() {
  const layout = structuredClone(INITIAL_LAYOUT);
  layout.scenes.room = structuredClone(ROOM_LAYOUT);
  layout.roomVersion = 2;
  return layout;
}
export function inside(scene, x, y, margin = 0) {
  const pts = SCENES[scene].points;
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i],
      [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      hit = !hit;
  }
  if (!hit) return false;
  if (margin)
    return [
      [margin, 0],
      [-margin, 0],
      [0, margin],
      [0, -margin],
    ].every(([dx, dy]) => inside(scene, x + dx, y + dy));
  return true;
}
export function dimensions(o) {
  const a = asset(o.type),
    turn = o.rotation % 180 !== 0;
  return { w: (turn ? a.h : a.w) * o.scale, h: (turn ? a.w : a.h) * o.scale };
}
export function displayBounds(o) {
  const a = asset(o.type),
    d = styledView(a, o.rotation),
    b = d
      ? {
          left: -d.w / 2,
          right: d.w / 2,
          top: -d.h / 2 - 3,
          bottom: d.h / 2 + 2,
        }
      : facingBounds(a, o.rotation);
  return Object.fromEntries(
    Object.entries(b).map(([key, value]) => [key, value * o.scale]),
  );
}
const SUPPORTS = new Set([
  "shelf",
  "woodshelf",
  "tierstand",
  "ladderstand",
  "wallrack",
  "plantcart",
  "pottingbench",
  "table",
  "wirestand",
  "coveredstand",
  "lowplatform",
  "foamstand",
]);
function worldPoint(o, x, y) {
  const a = (o.rotation * Math.PI) / 180;
  return [
    o.x + (x * Math.cos(a) - y * Math.sin(a)) * o.scale,
    o.y + (x * Math.sin(a) + y * Math.cos(a)) * o.scale,
  ];
}
function stripPoints(o, box) {
  const pts = [];
  for (const y of [box.top, box.bottom])
    for (let x = box.left; x <= box.right; x += 2)
      pts.push(worldPoint(o, x, y));
  for (let y = box.top; y <= box.bottom; y += 2)
    for (const x of [box.left, box.right]) pts.push(worldPoint(o, x, y));
  pts.push(
    worldPoint(o, box.right, box.top),
    worldPoint(o, box.right, box.bottom),
  );
  return pts;
}
export function contactPoints(o) {
  const a = asset(o.type);
  if (a.plant) return stripPoints(o, plantContact(o));
  const inset = SUPPORTS.has(o.type) ? Math.min(8, a.w * 0.15) : 0;
  return stripPoints(o, {
    left: -a.w / 2 + inset,
    right: a.w / 2 - inset,
    top: -a.h / 2 + (SUPPORTS.has(o.type) ? Math.min(6, a.h * 0.15) : 0),
    bottom: a.h / 2 - (SUPPORTS.has(o.type) ? Math.min(6, a.h * 0.15) : 0),
  });
}
export function roomFeet(o) {
  const a = asset(o.type),
    b = displayBounds(o),
    inset = Math.min(4 * o.scale, (b.right - b.left) / 6);
  return [
    [o.x + b.left + inset, o.y + b.bottom - 8 * o.scale],
    [o.x + b.right - inset, o.y + b.bottom - 8 * o.scale],
    [o.x + b.left + inset, o.y + b.bottom - 2 * o.scale],
    [o.x + b.right - inset, o.y + b.bottom - 2 * o.scale],
  ];
}
function groundFits(scene, o) {
  if (scene === "room" && asset(o.type).furniture)
    return roomFeet(o).every(
      ([x, y]) => x >= 220 && x <= 380 && y >= 104 && y <= 328,
    );
  return contactPoints(o).every(([x, y]) =>
    inside(scene, x, y, asset(o.type).plant ? 1 : 2),
  );
}
function surfaceContains(shelf, x, y) {
  const a = asset(shelf.type),
    angle = (-shelf.rotation * Math.PI) / 180,
    dx = (x - shelf.x) / shelf.scale,
    dy = (y - shelf.y) / shelf.scale,
    lx = dx * Math.cos(angle) - dy * Math.sin(angle),
    ly = dx * Math.sin(angle) + dy * Math.cos(angle);
  return Math.abs(lx) <= a.w / 2 - 3 && Math.abs(ly) <= a.h / 2 - 3;
}
export function fits(scene, o, objects = []) {
  if (!asset(o.type)) return false;
  if (groundFits(scene, o)) return true;
  if (!asset(o.type).plant) return false;
  return objects.some(
    (shelf) =>
      shelf.id !== o.id &&
      SUPPORTS.has(shelf.type) &&
      groundFits(scene, shelf) &&
      contactPoints(o).every(([x, y]) => surfaceContains(shelf, x, y)),
  );
}
// Prevent moving or deleting the sole support out from under a plant.
export function supportedLayout(scene, objects) {
  return objects.every((o) => fits(scene, o, objects));
}
// A larger object may need a small inward nudge to keep its whole footprint on the roof.
export function resizedObject(scene, o, scale, objects = []) {
  if (!Number.isFinite(scale) || scale < 0.5 || scale > 2) return null;
  const next = { ...o, scale };
  if (fits(scene, next, objects)) return next;
  const offsets = [];
  for (let dy = -32; dy <= 32; dy++)
    for (let dx = -32; dx <= 32; dx++) offsets.push([dx, dy]);
  offsets.sort((a, b) => a[0] * a[0] + a[1] * a[1] - b[0] * b[0] - b[1] * b[1]);
  for (const [dx, dy] of offsets) {
    const candidate = { ...next, x: o.x + dx, y: o.y + dy };
    if (fits(scene, candidate, objects)) return candidate;
  }
  return null;
}
function fitsFootprint(scene, o, a) {
  const turn = o.rotation % 180 !== 0,
    w = (turn ? a.h : a.w) * o.scale,
    h = (turn ? a.w : a.h) * o.scale;
  return [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [-w / 2, h / 2],
    [w / 2, h / 2],
  ].every(([dx, dy]) => inside(scene, o.x + dx, o.y + dy, 3));
}
export function validateLayout(data) {
  if (!data || ![1, VERSION].includes(data.version) || !data.scenes)
    throw Error("布局版本不正确");
  const clean = { version: VERSION, roomVersion: 2, scenes: {} };
  for (const scene of Object.keys(SCENES)) {
    const list =
      data.scenes[scene] ??
      (scene === "room" ? structuredClone(ROOM_LAYOUT) : undefined);
    if (!Array.isArray(list) || list.length > 400)
      throw Error("每个场景最多 400 件物件");
    const ids = new Set();
    clean.scenes[scene] = list.map((raw) => {
      let o = raw;
      if (
        scene === "room" &&
        data.scenes.room &&
        data.roomVersion !== 2 &&
        o &&
        asset(o.type)
      ) {
        const d = dimensions(o);
        o = {
          ...o,
          y: Math.max(
            104 + d.h / 2 + 3,
            Math.min(328 - d.h / 2 - 3, 104 + (o.y - 104) * 0.7),
          ),
        };
      }
      if (
        data.version === 1 &&
        scene === "south" &&
        o &&
        Number.isFinite(o.x) &&
        Number.isFinite(o.y)
      )
        o = {
          ...o,
          x: 568 - o.y,
          y: Math.round(((o.x - 320) * 5) / 6 + 264),
          rotation: asset(o.type)?.plant ? o.rotation : (o.rotation + 90) % 360,
        };
      if (
        !o ||
        typeof o.id !== "string" ||
        !o.id ||
        ids.has(o.id) ||
        !asset(o.type) ||
        ![o.x, o.y, o.scale, o.rotation].every(Number.isFinite) ||
        o.scale < 0.5 ||
        o.scale > 2 ||
        ![0, 90, 180, 270].includes(o.rotation)
      )
        throw Error("物件数据不正确");
      ids.add(o.id);
      const next = {
        id: o.id,
        type: o.type,
        x: o.x,
        y: o.y,
        scale: o.scale,
        rotation: o.rotation,
      };
      const p = plant(o.type);
      if (p) {
        if (
          o.seed !== undefined &&
          (!Number.isInteger(o.seed) || o.seed < 0 || o.seed > 4294967295)
        )
          throw Error("植物 seed 不正确");
        next.seed = o.seed ?? plantSeed(o.id);
      }
      if (o.pot !== undefined) {
        if (!p || !p.containers.includes(o.pot))
          throw Error("花盆不适合这株植物");
        next.pot = o.pot;
      }
      return next;
    });
    const objects = clean.scenes[scene];
    for (let i = 0; i < objects.length; i++) {
      const o = objects[i];
      if (fits(scene, o, objects)) continue;
      const legacy = LEGACY_ASSETS.find((a) => a.id === o.type),
        old = list[i];
      if (
        (data.version === 1 && scene === "south") ||
        (plant(o.type) &&
          legacy &&
          old.pot === undefined &&
          fitsFootprint(scene, o, legacy))
      ) {
        const next = resizedObject(scene, o, o.scale, objects);
        if (next) {
          Object.assign(o, next);
          continue;
        }
      }
      throw Error("有物件的承重点超出了阳台或花架边界");
    }
  }
  return clean;
}
export function foregroundObjects(objects) {
  return objects.filter((o) => hasForeground(asset(o.type)));
}
export function plantOccluders(o, objects) {
  if (!asset(o.type).plant) return [];
  const points = contactPoints(o),
    x = points.reduce((sum, p) => sum + p[0], 0) / points.length,
    y = Math.max(...points.map((p) => p[1]));
  return objects.filter((s) => {
    if (!hasForeground(asset(s.type))) return false;
    const b = displayBounds(s);
    return (
      x >= s.x + b.left + 2 &&
      x <= s.x + b.right - 2 &&
      y >= s.y + b.top + 2 &&
      y <= s.y + b.bottom - 2
    );
  });
}
export function paintPlantOccluders(c, o, objects) {
  const frames = plantOccluders(o, objects);
  if (!frames.length) return;
  const b = displayBounds(o);
  c.save();
  c.beginPath();
  c.rect(
    o.x + b.left - 2,
    o.y + b.top - 2,
    b.right - b.left + 4,
    b.bottom - b.top + 4,
  );
  c.clip();
  for (const s of frames) {
    c.save();
    c.translate(Math.round(s.x), Math.round(s.y));
    c.scale(s.scale, s.scale);
    if (!paintStyledForeground(c, asset(s.type), s.rotation))
      paintFacingForeground(c, asset(s.type), s.rotation);
    c.restore();
  }
  c.restore();
}

export function random(seed) {
  let v = seed | 0;
  return () => {
    v = (Math.imul(v, 1664525) + 1013904223) | 0;
    return (v >>> 0) / 4294967296;
  };
}
const rect = (c, x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
function oval(c, x, y, rx, ry, col) {
  for (let j = -ry; j <= ry; j++) {
    const span = Math.floor(
      rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry))),
    );
    rect(c, x - span, y + j, span * 2 + 1, 1, col);
  }
}
function line(c, x, y, xx, yy, col, width = 1) {
  const n = Math.max(Math.abs(xx - x), Math.abs(yy - y));
  for (let i = 0; i <= n; i++)
    rect(c, x + ((xx - x) * i) / n, y + ((yy - y) * i) / n, width, width, col);
}
function polygon(c, points, col) {
  c.fillStyle = col;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}
const BACKGROUND = {
  ink: "#363b33",
  deep: "#454a35",
  olive: "#656c42",
  leaf: "#808653",
  light: "#a2a372",
  cream: "#c0b9a0",
  soil: "#575044",
  terra: "#8d6852",
  rim: "#b58e70",
  metal: "#4b5451",
  sky: "#bdc2cc",
};
export function paintBase(c, scene, { includeCity = true } = {}) {
  c.clearRect(0, 0, 640, 520);
  if (scene === "room") {
    paintRoomBase(c);
    return;
  }
  rect(c, 0, 0, 640, 520, BACKGROUND.sky);
  const rng = random(1826);
  // Retain the original random sequence for the approved terrace wear pattern.
  // The continuous city layer below replaces this legacy tile backdrop.
  const blocks = [
    [-20, -20, 130, 105],
    [145, -18, 106, 77],
    [429, -29, 173, 127],
    [-35, 162, 137, 145],
    [516, 173, 150, 121],
    [22, 385, 108, 126],
    [154, 394, 181, 133],
    [495, 368, 177, 147],
  ];
  for (const block of blocks) {
    let [x, y, w, h] = block;
    c.save();
    rect(c, x + 7, y + 12, w, h, "#8b9185");
    rect(c, x, y, w, h, "#aaa998");
    rect(c, x - 3, y - 7, w + 6, 34, "#737a6c");
    for (let k = 0; k < 6; k++) {
      rect(c, x - 2, y - 6 + k * 5, w + 4, 1, "#969b88");
      for (let j = 0; j < w; j += 17)
        rect(c, x + j, y - 6 + k * 5, 1, 4, "#636c60");
    }
    for (let a = 0; a < Math.floor(w / 23); a++)
      for (let b = 0; b < Math.floor((h - 28) / 26); b++) {
        const wx = x + 10 + a * 23,
          wy = y + 37 + b * 26;
        rect(c, wx, wy, 13, 16, "#7f8c85");
        rect(c, wx + 2, wy + 1, 4, 13, "#b2b9a3");
        rect(c, wx + 8, wy + 1, 1, 13, "#d0cbb5");
        rect(c, wx - 2, wy + 16, 17, 2, "#c0b99e");
        if (rng() < 0.3) {
          rect(c, wx + 3, wy + 20, 12, 6, "#c6c1a9");
          rect(c, wx + 5, wy + 21, 6, 3, "#969f8d");
        }
      }
    for (let i = 0; i < 140; i++)
      rect(
        c,
        x + rng() * w,
        y + 30 + rng() * (h - 30),
        2,
        2,
        rng() < 0.5 ? "#b5b29d" : "#989e8c",
      );
    c.restore();
  }
  // Small patches of vegetation between neighboring buildings.
  for (let i = 0; i < 160; i++) {
    const x = 38 + rng() * 70,
      y = 318 + rng() * 53;
    rect(
      c,
      x,
      y,
      3 + rng() * 5,
      3 + rng() * 4,
      ["#7c8866", "#929e75", "#68795e"][Math.floor(rng() * 3)],
    );
  }
  // Atmospheric veil keeps the balcony foreground readable.
  c.fillStyle = "#bec1c3";
  c.globalAlpha = 0.22;
  c.fillRect(0, 0, 640, 520);
  c.globalAlpha = 1;
  c.clearRect(0, 0, 640, 520);
  if (includeCity) paintCity(c, { x: 0, y: 0, w: 640, h: 520 }, { scene });
  const points = SCENES[scene].points;
  polygon(
    c,
    points.map(([x, y]) => [x + 7, y + 15]),
    "#777e78",
  );
  polygon(c, points, "#a19e8b");
  c.save();
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.clip();
  for (let y = 64; y < 484; y += 24)
    for (let x = 112; x < 540; x += 32) {
      rect(
        c,
        x,
        y,
        31,
        23,
        ["#a29f8c", "#aaa593", "#999989", "#a7a390"][Math.floor(rng() * 4)],
      );
      rect(c, x, y, 32, 1, "#b4ae9b");
      rect(c, x + 31, y + 1, 1, 23, "#8f9283");
    }
  for (let i = 0; i < 2400; i++) {
    const x = 112 + Math.floor(rng() * 430),
      y = 60 + Math.floor(rng() * 430);
    rect(c, x, y, rng() < 0.25 ? 3 : 2, 2, rng() < 0.5 ? "#b1ad99" : "#969887");
  }
  for (let i = 0; i < 65; i++) {
    const x = 144 + Math.floor(rng() * 318),
      y = 100 + Math.floor(rng() * 359);
    line(
      c,
      x,
      y,
      x + Math.floor(rng() * 18),
      y + Math.floor(rng() * 12),
      "#84897e",
    );
    rect(c, x + 1, y + 2, 2, 1, "#c0b9a4");
  }
  // Small repair pours overlap the old surface; edges are intact, not rubble.
  const repairs =
    scene === "north"
      ? [
          [208, 215, 45, 30],
          [306, 282, 56, 33],
          [282, 126, 36, 26],
          [412, 371, 25, 35],
        ]
      : [
          [272, 162, 29, 42],
          [252, 303, 25, 48],
        ];
  for (const [x, y, w, h] of repairs) {
    polygon(
      c,
      [
        [x + 3, y],
        [x + w - 4, y + 2],
        [x + w, y + h - 5],
        [x + w - 7, y + h],
        [x + 1, y + h - 2],
        [x, y + 5],
      ],
      "#a2a399",
    );
    for (let yy = 3; yy < h - 3; yy += 4) {
      line(
        c,
        x + 3 + (yy % 3),
        y + yy,
        x + w - 6,
        y + yy - 1,
        yy % 8 ? "#a9aa9d" : "#979d91",
      );
      rect(c, x + w - 8, y + yy, 2, 1, "#b1b0a0");
    }
    line(c, x + 3, y + h - 2, x + w - 9, y + h, "#94998c");
    line(c, x + 5, y + 1, x + w - 7, y + 2, "#b4b2a3");
  }
  const cracks =
    scene === "north"
      ? [
          [228, 191, 13, 7],
          [332, 247, 17, 8],
          [386, 321, 10, -8],
          [444, 411, -7, 13],
        ]
      : [
          [260, 211, -6, 14],
          [300, 367, -7, -10],
        ];
  for (const [x, y, dx, dy] of cracks) {
    line(c, x, y, x + dx * 0.48, y + dy * 0.4, "#8e958a");
    line(c, x + dx * 0.48, y + dy * 0.4, x + dx, y + dy, "#92988c");
    line(
      c,
      x + dx * 0.48,
      y + dy * 0.4,
      x + dx * 0.25,
      y + dy * 0.8,
      "#999e91",
    );
  }
  // A seven-pixel circular grate sits just inside the upper terrace corner.
  const [drainX, drainY] = scene === "north" ? [282, 147] : [236, 407];
  oval(c, drainX, drainY, 4, 3, "#b4b29e");
  oval(c, drainX, drainY, 3, 3, "#69746b");
  oval(c, drainX, drainY, 2, 2, "#818c7c");
  for (const dx of [-1, 1])
    line(c, drainX + dx, drainY - 1, drainX + dx, drainY + 1, "#515f58");
  rect(c, drainX - 1, drainY - 3, 3, 1, "#c0bdab");
  c.restore();
  // Low concrete parapets, pale caps, worn wall faces and occasional moss.
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    if (a[1] === b[1]) {
      const x = Math.min(a[0], b[0]),
        w = Math.abs(a[0] - b[0]);
      rect(c, x, a[1] - 7, w, 7, "#c2baa3");
      rect(c, x, a[1], w, 7, "#727b70");
      rect(c, x, a[1] - 7, w, 2, "#d0c7ae");
      for (let j = x + 8; j < x + w - 6; j += 23)
        rect(c, j, a[1] + 1, 3, 4, "#858b78");
    } else {
      const y = Math.min(a[1], b[1]),
        h = Math.abs(a[1] - b[1]);
      rect(c, a[0] - 6, y, 7, h, "#bdb59e");
      rect(c, a[0] + 1, y, 4, h, "#70796d");
      rect(c, a[0] - 6, y, 2, h, "#d0c7ae");
    }
  }
  if (scene === "north") {
    // The inner building face and narrow entrance are architecture, not furniture.
    rect(c, 144, 336, 256, 12, "#7e8171");
    rect(c, 144, 335, 256, 3, "#c1b69c");
    for (let x = 148; x < 396; x += 26) {
      rect(c, x, 340, 20, 5, "#92907d");
      rect(c, x, 338, 1, 10, "#71776c");
    }
    rect(c, 274, 68, 124, 3, BACKGROUND.metal);
    for (let x = 279; x < 398; x += 14) rect(c, x, 69, 2, 10, "#637364");
    rect(c, 274, 77, 124, 2, "#8b9681");
    rect(c, 408, 453, 45, 13, "#514e42");
    for (let x = 413; x < 450; x += 5) rect(c, x, 455, 2, 8, "#797961");
    rect(c, 409, 465, 45, 3, "#c1b69c");
    rect(c, 460, 165, 3, 100, BACKGROUND.metal);
    for (let y = 172; y < 260; y += 16) {
      rect(c, 459, y, 5, 3, "#c0b9a1");
      rect(c, 465, y, 2, 7, "#6c776e");
    }
  } else {
    rect(c, 348, 105, 10, 318, "#97a6a0");
    rect(c, 358, 105, 3, 318, "#d1ccba");
    for (let y = 109; y < 427; y += 53) {
      rect(c, 347, y, 18, 3, "#616f6a");
      rect(c, 354, y + 4, 1, 50, "#bfc8ba");
    }
    rect(c, 211, 104, 9, 320, "#7d8478");
    rect(c, 218, 118, 4, 222, "#c8c4ae");
    for (let y = 121; y < 340; y += 55) {
      rect(c, 213, y, 14, 3, "#d3d0bf");
      rect(c, 224, y + 4, 2, 58, "#94a4a0");
    }
    rect(c, 213, 347, 9, 48, "#5d6257");
    rect(c, 219, 351, 2, 41, "#c0bca5");
  }
  // Only a few rail joints and exposed edges carry small rusty chips.
  if (scene === "north") {
    for (const [x, y] of [
      [288, 69],
      [344, 69],
      [387, 77],
      [461, 191],
      [461, 240],
    ]) {
      rect(c, x, y, 2, 2, "#90725a");
      rect(c, x + 1, y + 2, 1, 2, "#a1876c");
    }
  } else
    for (const y of [162, 322, 377]) {
      rect(c, 359, y, 1, 3, "#9a7c64");
      rect(c, 357, y + 1, 2, 1, "#836b57");
    }
  paintDoor(c, scene);
}
function paintGroundDetail(c, a, rotation, time) {
  if (!rotation) {
    paintDetail(c, a, time);
    return;
  }
  const size = Math.ceil((Math.max(a.w, a.h) + 32) / 2) * 2,
    cv =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(size, size)
        : document.createElement("canvas");
  cv.width = cv.height = size;
  const source = cv.getContext("2d");
  source.translate(size / 2, size / 2);
  paintDetail(source, a, time);
  const d = source.getImageData(0, 0, size, size).data,
    r = (rotation * Math.PI) / 180,
    cos = Math.round(Math.cos(r)),
    sin = Math.round(Math.sin(r));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (!d[i + 3]) continue;
      const u = x - size / 2,
        v = y - size / 2;
      c.fillStyle = `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`;
      c.fillRect(
        Math.round(u * cos - (v / 0.6) * sin),
        Math.round(u * 0.6 * sin + v * cos),
        sin ? 2 : 1,
        1,
      );
    }
}
function paintObjectPixels(c, o, time = 0, selected = false) {
  const a = asset(o.type);
  c.save();
  c.translate(Math.round(o.x), Math.round(o.y));
  c.scale(o.scale, o.scale);
  if (a.plant) {
    c.rotate((o.rotation * Math.PI) / 180);
    paintPlant(c, o);
  } else if (facingKind(a) === "flat") {
    if (["lid", "hose"].includes(a.shape || a.id))
      paintDetail(c, { ...a, rotation: o.rotation }, time);
    else paintGroundDetail(c, a, o.rotation, time);
  } else if (paintStyledView(c, a, o.rotation, time)) {
  } else if (o.rotation && paintFacing(c, a, o.rotation, time)) {
  } else if (paintDetail(c, { ...a, rotation: o.rotation }, time)) {
  } else if (a.furniture) paintFurniture(c, o.type, a.w, a.h);
  else if (a.vessel) {
    const v = vessel(a.vessel);
    paintVessel(
      c,
      v,
      0,
      ["oval", "box", "mokko"].includes(v.shape) && o.rotation % 180 ? 20 : 28,
    );
  } else if (o.type === "drying") {
    for (const x of [-10, 10]) {
      rect(c, x, -30, 2, 60, "#58685a");
      rect(c, x + 1, -30, 1, 60, "#96a080");
    }
    for (const y of [-29, 27]) {
      rect(c, -14, y, 28, 3, "#83957a");
      rect(c, -14, y + 2, 28, 1, "#5f675b");
    }
    line(c, -9, -27, 10, 26, "#6e7d67");
    line(c, 10, -27, -9, 26, "#8d9d7d");
    for (let y = -22; y < 23; y += 7) rect(c, -11, y, 24, 1, "#7f9173");
  } else throw Error("缺少物件绘制：" + o.type);
  c.restore();
  if (selected) {
    const d = dimensions(o);
    c.strokeStyle = "#b8ac83";
    c.lineWidth = 1;
    c.strokeRect(
      Math.round(o.x - d.w / 2) - 3.5,
      Math.round(o.y - d.h / 2) - 3.5,
      Math.round(d.w) + 7,
      Math.round(d.h) + 7,
    );
    for (const [x, y] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      rect(
        c,
        o.x + x * (d.w / 2 + 3) - 1,
        o.y + y * (d.h / 2 + 3) - 1,
        3,
        3,
        "#c5bc9a",
      );
  }
}
// Raster bounds keep the small contact shadow beneath the actual artwork after any turn.
const objectSprites = new Map();
export function paintObject(c, o, time = 0, selected = false, weather = null) {
  const a = asset(o.type),
    key =
      o.type +
      ":" +
      (o.pot || "") +
      ":" +
      (o.seed ?? "preview") +
      ":" +
      (a.plant ? 0 : o.rotation),
    dynamic = a.aquarium;
  let entry = dynamic ? null : objectSprites.get(key);
  if (!entry) {
    const b = displayBounds({
        type: o.type,
        rotation: a.plant ? 0 : o.rotation,
        scale: 1,
      }),
      size = a.plant
        ? Math.max(a.w, a.h) + 32
        : Math.ceil(
            Math.max(
              a.w,
              a.h,
              ...Object.values(b).map((v) => Math.abs(v) * 2),
            ) + 24,
          ),
      sprite =
        typeof OffscreenCanvas !== "undefined"
          ? new OffscreenCanvas(size, size)
          : document.createElement("canvas");
    sprite.width = size;
    sprite.height = size;
    const context = sprite.getContext("2d");
    paintObjectPixels(
      context,
      {
        type: o.type,
        pot: o.pot,
        seed: o.seed,
        x: sprite.width / 2,
        y: sprite.height / 2,
        rotation: a.plant ? 0 : o.rotation,
        scale: 1,
      },
      time,
    );
    const pixels = context.getImageData(0, 0, sprite.width, sprite.height).data;
    let x0 = sprite.width,
      y0 = sprite.height,
      x1 = 0,
      y1 = 0;
    for (let y = 0; y < sprite.height; y++)
      for (let x = 0; x < sprite.width; x++)
        if (pixels[(y * sprite.width + x) * 4 + 3]) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
    entry = {
      sprite,
      bounds: [
        x0 - sprite.width / 2,
        y0 - sprite.height / 2,
        x1 - sprite.width / 2,
        y1 - sprite.height / 2,
      ],
    };
    if (!dynamic) {
      if (objectSprites.size >= 768)
        objectSprites.delete(objectSprites.keys().next().value);
      objectSprites.set(key, entry);
    }
  }
  c.save();
  c.translate(Math.round(o.x), Math.round(o.y));
  const world = c.getTransform(),
    angle = Math.atan2(world.b, world.a),
    turn = angle + ((a.plant ? o.rotation : 0) * Math.PI) / 180,
    [x0, y0, x1, y1] = entry.bounds;
  const contact = a.plant ? plantContact(o) : null,
    shadowCorners = contact
      ? [
          [contact.left, contact.top],
          [contact.right, contact.top],
          [contact.left, contact.bottom],
          [contact.right, contact.bottom],
        ]
      : [
          [x0, y0],
          [x1, y0],
          [x0, y1],
          [x1, y1],
        ];
  const corners = shadowCorners.map(([x, y]) => [
      x * Math.cos(turn) - y * Math.sin(turn),
      x * Math.sin(turn) + y * Math.cos(turn),
    ]),
    xs = corners.map((p) => p[0]),
    ys = corners.map((p) => p[1]);
  c.save();
  c.rotate(-angle);
  c.scale(o.scale, o.scale);
  const footX = (Math.min(...xs) + Math.max(...xs)) / 2,
    footY = Math.round(Math.max(...ys)) + 2,
    shadowWidth = Math.max(
      2,
      Math.round((Math.max(...xs) - Math.min(...xs)) * 0.28),
    );
  if (weather?.sun > 0.05) {
    oval(
      c,
      footX + 2,
      footY + 1,
      shadowWidth + 2,
      2,
      `rgba(35,44,37,${weather.sun * 0.08})`,
    );
  }
  oval(
    c,
    footX,
    footY,
    shadowWidth,
    1,
    `rgba(25,35,27,${weather?.night > 0.5 ? 0.1 : 0.16})`,
  );
  c.restore();
  if (a.plant) c.rotate((o.rotation * Math.PI) / 180);
  c.scale(o.scale, o.scale);
  c.imageSmoothingEnabled = false;
  if (a.plant && weather) paintPlant(c, o, { time, wind: weather.wind });
  else
    c.drawImage(
      entry.sprite,
      -entry.sprite.width / 2,
      -entry.sprite.height / 2,
    );
  c.restore();
  if (selected) {
    const b = displayBounds(o);
    c.strokeStyle = "#d8c37a";
    c.lineWidth = 1;
    c.strokeRect(
      Math.round(o.x + b.left) - 3.5,
      Math.round(o.y + b.top) - 3.5,
      Math.round(b.right - b.left) + 7,
      Math.round(b.bottom - b.top) + 7,
    );
    for (const [x, y] of [
      [b.left, b.top],
      [b.right, b.top],
      [b.left, b.bottom],
      [b.right, b.bottom],
    ])
      rect(
        c,
        o.x + x - 1 + (x === b.left ? -3 : 3),
        o.y + y - 1 + (y === b.top ? -3 : 3),
        3,
        3,
        "#e4d6a4",
      );
  }
}
export const paintPerson = paintDongdong;
export function actorFits(scene, objects, x, y) {
  if (!inside(scene, x, y, 7)) return false;
  return !objects.some((o) => {
    if (scene === "room") {
      const b = displayBounds(o);
      return (
        x > o.x + b.left - 8 &&
        x < o.x + b.right + 8 &&
        y > o.y + b.top - 2 &&
        y < o.y + b.bottom + 36
      );
    }
    const d = dimensions(o);
    return Math.abs(o.x - x) < d.w / 2 + 4 && Math.abs(o.y - y) < d.h / 2 + 2;
  });
}
export function freeActorPoint(scene, objects, x, y) {
  const candidates = [];
  for (let yy = 84; yy < 472; yy += 8)
    for (let xx = 140; xx < 516; xx += 8)
      if (actorFits(scene, objects, xx, yy)) candidates.push([xx, yy]);
  candidates.sort(
    (a, b) => Math.hypot(a[0] - x, a[1] - y) - Math.hypot(b[0] - x, b[1] - y),
  );
  return candidates[0] || null;
}
export function makeWalker(scene, objects, { visits = 0 } = {}) {
  const cell = 8,
    cols = 80,
    rows = 65;
  let route = [],
    pause = 0,
    target = null;
  const p = {
    x: SCENES[scene].spawn[0],
    y: SCENES[scene].spawn[1],
    state: "walk",
    task: "散步",
    visits,
    facing: "south",
    targetId: null,
  };
  const toCell = (x, y) => Math.floor(y / cell) * cols + Math.floor(x / cell),
    point = (i) => [(i % cols) * cell + 4, Math.floor(i / cols) * cell + 4];
  const walkable = (i) => {
    if (i < 0 || i >= cols * rows) return false;
    const [x, y] = point(i);
    return actorFits(scene, objects(), x, y);
  };
  function choose() {
    if (!walkable(toCell(p.x, p.y))) {
      const free = freeActorPoint(scene, objects(), p.x, p.y);
      if (!free) {
        p.state = "rest";
        p.task = "没有可走的空地";
        pause = 2;
        return;
      }
      const pt = point(toCell(...free));
      p.x = pt[0];
      p.y = pt[1];
      if (!walkable(toCell(p.x, p.y))) {
        const available = Array.from({ length: cols * rows }, (_, i) => i).find(
          walkable,
        );
        if (available === undefined) {
          pause = 2;
          return;
        }
        const safe = point(available);
        p.x = safe[0];
        p.y = safe[1];
      }
    }
    const start = toCell(p.x, p.y),
      parent = new Map([[start, -1]]),
      q = [start];
    for (let k = 0; k < q.length; k++) {
      const i = q[k];
      for (const j of [i - 1, i + 1, i - cols, i + cols])
        if (
          !parent.has(j) &&
          walkable(j) &&
          Math.abs((j % cols) - (i % cols)) <= 1
        ) {
          parent.set(j, i);
          q.push(j);
        }
    }
    let candidates = objects().filter(
      (o) =>
        (["bench", "gardenbench", "foldingchair", "stool"].includes(o.type) ||
          !asset(o.type).furniture) &&
        !["shelf", "woodshelf", "drying", "crate", "table"].includes(o.type),
    );
    candidates.sort(
      (a, b) =>
        Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
    );
    target = candidates.length
      ? candidates[p.visits % candidates.length]
      : null;
    p.targetId = target?.id || null;
    let end;
    if (target) {
      end = q.reduce((best, i) => {
        const [x, y] = point(i),
          [bx, by] = point(best);
        return Math.hypot(x - target.x, y - target.y) <
          Math.hypot(bx - target.x, by - target.y)
          ? i
          : best;
      }, start);
    } else end = q[Math.floor(Math.random() * q.length)];
    route = [];
    for (
      let i = end;
      i !== start && i !== undefined && i !== -1;
      i = parent.get(i)
    )
      route.unshift(point(i));
    p.state = "walk";
    p.task = "散步";
    if (route.length === 0 && !target) {
      pause = 2;
      p.state = "rest";
      p.task = "看看天台";
    }
  }
  choose();
  return {
    person: p,
    update(dt) {
      if (pause > 0) {
        pause -= dt;
        if (pause <= 0) choose();
        return;
      }
      if (!route.length) {
        p.visits++;
        const a = target && asset(target.type),
          near =
            target &&
            Math.hypot(p.x - target.x, p.y - target.y) <
              (Math.max(a.w, a.h) * target.scale) / 2 + 26;
        if (near) {
          const dx = target.x - p.x,
            dy = target.y - p.y;
          p.facing =
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? "east"
                : "west"
              : dy > 0
                ? "south"
                : "north";
          p.state =
            target.type === "teaset"
              ? "tea"
              : target.type === "pigbowl"
                ? "feed"
                : ["bench", "gardenbench", "foldingchair", "stool"].includes(
                      target.type,
                    )
                  ? "sit"
                  : ["sink", "basin"].includes(target.type)
                    ? "wash"
                    : a.aquarium
                      ? "tend"
                      : a.plant
                        ? a.category === "仙人掌" || a.category === "多肉"
                          ? "inspect"
                          : ["water", "prune", "inspect"][p.visits % 3]
                        : [
                              "sink",
                              "basin",
                              "terrarium",
                              "thermometer",
                            ].includes(target.type)
                          ? "wipe"
                          : ["tools", "soilbag", "labels"].includes(target.type)
                            ? "inspect"
                            : "sweep";
        } else p.state = "rest";
        p.task = {
          tea: "喝一杯茶",
          wash: "洗掉手上的泥土",
          sit: "坐着看看天",
          feed: "给小猪添饭",
          water: "浇水",
          prune: "摘掉枯叶",
          inspect: "看看叶片和花盆",
          tend: "喂小鱼",
          wipe: "擦拭器具",
          sweep: "扫落叶",
          rest: "歇一会儿",
        }[p.state];
        pause = 4 + Math.random() * 4;
        return;
      }
      const [x, y] = route[0];
      p.facing =
        Math.abs(x - p.x) > Math.abs(y - p.y)
          ? x > p.x
            ? "east"
            : "west"
          : y > p.y
            ? "south"
            : "north";
      const distance = Math.hypot(x - p.x, y - p.y),
        move = dt * 15;
      if (distance <= move) {
        p.x = x;
        p.y = y;
        route.shift();
      } else {
        p.x += ((x - p.x) / distance) * move;
        p.y += ((y - p.y) / distance) * move;
      }
    },
    randomize() {
      const cells = Array.from({ length: cols * rows }, (_, i) => i).filter(
        walkable,
      );
      if (!cells.length) return;
      const pt = point(cells[Math.floor(Math.random() * cells.length)]);
      p.x = pt[0];
      p.y = pt[1];
      p.visits = Math.floor(Math.random() * 100);
      pause = 0;
      choose();
      const advance = 120 + Math.floor(Math.random() * 900);
      for (let i = 0; i < advance; i++) this.update(0.1);
      for (let i = 0; i < 2400 && p.state === "walk"; i++) this.update(0.1);
    },
    arrive() {
      const d = DOORS[scene];
      p.x = d ? d.x + 16 : SCENES[scene].spawn[0];
      p.y = d ? d.y - 8 : SCENES[scene].spawn[1];
      pause = 0;
      choose();
    },
    reset: choose,
  };
}

export function paintDoor(c, scene, open = false) {
  const d = DOORS[scene];
  if (scene === "north") {
    rect(c, d.x - 8, d.y - 18, 17, 37, "#484e40");
    rect(c, d.x - 6, d.y - 16, 12, 33, "#b7aa8d");
    rect(c, d.x - 4, d.y - 14, 9, 29, "#766951");
    rect(c, d.x - 3, d.y - 12, 3, 25, "#958464");
    rect(c, d.x + 2, d.y - 12, 1, 25, "#5b5745");
    rect(c, d.x + 3, d.y + 4, 2, 3, "#d4bd80");
    rect(c, d.x - 8, d.y + 17, 18, 2, "#c3b89b");
  } else {
    rect(c, d.x - 10, d.y - 31, 18, 62, "#4b5143");
    rect(c, d.x - 8, d.y - 28, 14, 56, "#b3a58a");
    rect(c, d.x - 6, d.y - 25, 10, 50, "#766951");
    for (let y = d.y - 24; y < d.y + 24; y += 8)
      rect(c, d.x - 5, y, 8, 1, "#998665");
    rect(c, d.x, d.y + 19, 2, 3, "#d4bd80");
    rect(c, d.x - 11, d.y - 30, 2, 61, "#c8bba0");
  }
  if (open) {
    const top = scene === "north" ? d.y - 16 : d.y - 28,
      h = scene === "north" ? 33 : 56;
    rect(c, d.x - 6, top, 12, h, "#353b31");
    rect(c, d.x - 6, top + 1, 8, h - 2, "#7b7057");
    rect(c, d.x - 5, top + 2, 5, h - 4, "#a29476");
    rect(c, d.x - 3, top + 4, 2, h - 8, "#776b51");
    rect(c, d.x + 1, top + h * 0.7, 1, 2, "#c3af80");
    rect(c, d.x + 3, top + 1, 2, h - 2, "#242d26");
  }
}
// Extend the city outside the original scene tile for edge-to-edge viewports.
export function paintSurroundings(c, bounds, options) {
  paintCity(c, bounds, options);
}
