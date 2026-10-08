import { createGardenRenderer } from "../3d/scene3d.mjs";
import { makeWeather } from "../weather.mjs";
import { readLayout, writeLayout } from "../layout-storage.mjs";
import {
  paintBase,
  paintObject,
  initialLayout,
  validateLayout,
  asset,
  dimensions,
  freeActorPoint,
} from "../scene.mjs";
import { paintDongdong } from "../dongdong.mjs";
import {
  paintPig,
  wardrobe,
  dress,
  OUTFITS,
  DECORATIONS,
  ACTIVITIES,
} from "../wardrobe.mjs";
const $ = (id) => document.getElementById(id),
  canvas = $("room");
let c = null;
let room3d = null;
const indoorWeather = makeWeather({
  condition: new URLSearchParams(location.search).get("weather") || "auto",
  phase: "auto",
});

canvas.style.height = "100%";
canvas.style.touchAction = "none";
canvas.tabIndex = 0;
let activity = "rest",
  pigActivity = "rest";
$("preview").href = "https://umwelt.fivsevn.com/rooftop/";
function choices(id, items, current, select) {
  for (const [key, value] of Object.entries(items)) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = Array.isArray(value) ? value[0] : value;
    b.dataset.value = key;
    b.setAttribute("aria-pressed", String(key === current()));
    b.onclick = () => {
      select(key);
      for (const child of $(id).children)
        child.setAttribute("aria-pressed", String(child === b));
      $("caption").textContent =
        id === "pigActivities"
          ? "猪猪正在" + { rest: "歇一会儿", walk: "散步" }[key] + "。"
          : id === "activities"
            ? "东东正在" + ACTIVITIES[key] + "。"
            : id === "outfits"
              ? "换好了，穿着" + OUTFITS[key][0] + "上楼。"
              : "小猪的装饰：" + DECORATIONS[key] + "。";
    };
    $(id).append(b);
  }
}
const wardrobeViews = [];
function groupedChoices(id, items, current, select) {
  const root = $(id);
  root.className = "wardrobe-catalog";
  const groups = new Map();
  const kinds = new Map();
  for (const [key, value] of Object.entries(items)) {
    const label = Array.isArray(value) ? value[0] : value;
    const kind = label.slice(2);
    if (!groups.has(kind)) groups.set(kind, []);
    groups.get(kind).push([key, label]);
    kinds.set(key, kind);
  }
  let category = kinds.get(current()) || groups.keys().next().value;
  const categories = document.createElement("div");
  categories.className = "categories wardrobe-categories";
  categories.setAttribute(
    "aria-label",
    id === "outfits" ? "衣服种类" : "配饰种类",
  );
  const options = document.createElement("div");
  options.id = id + "Options";
  options.className = "asset-grid wardrobe-options";
  for (const kind of groups.keys()) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = kind;
    button.dataset.category = kind;
    button.setAttribute("aria-controls", options.id);
    button.onclick = () => {
      category = kind;
      render();
    };
    categories.append(button);
  }
  root.replaceChildren(categories, options);
  function updateSelection() {
    for (const button of options.children)
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.value === current()),
      );
  }
  function render() {
    for (const button of categories.children)
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.category === category),
      );
    options.setAttribute("aria-label", category + "的全部选项");
    options.replaceChildren();
    for (const [key, label] of groups.get(category)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "asset-card wardrobe-option";
      button.dataset.value = key;
      const name = document.createElement("span");
      name.textContent = label;
      button.append(name);
      button.onclick = () => {
        select(key);
        updateSelection();
        $("caption").textContent =
          id === "outfits"
            ? "换好了，穿着" + OUTFITS[key][0] + "上楼。"
            : "小猪的装饰：" + DECORATIONS[key] + "。";
      };
      options.append(button);
    }
    updateSelection();
  }
  wardrobeViews.push(() => {
    category = kinds.get(current());
    render();
  });
  render();
}
groupedChoices(
  "outfits",
  OUTFITS,
  () => wardrobe.outfit,
  (key) => dress("outfit", key),
);
groupedChoices(
  "decorations",
  DECORATIONS,
  () => wardrobe.pig,
  (key) => dress("pig", key),
);
choices(
  "activities",
  ACTIVITIES,
  () => activity,
  (key) => (activity = key),
);
choices(
  "pigActivities",
  { rest: "歇一会儿", walk: "散步" },
  () => pigActivity,
  (key) => (pigActivity = key),
);
const px = (x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
};
let roomLayout = initialLayout(),
  personPoint = [300, 240],
  pigPoint = [260, 260];
function loadRoom() {
  try {
    roomLayout = readLayout();
  } catch {
    roomLayout = initialLayout();
  }
  personPoint = freeActorPoint("room", roomLayout.scenes.room, 300, 240);
  pigPoint = freeActorPoint(
    "room",
    roomLayout.scenes.room,
    260,
    260,
    { radius: 0.76, height: 1.0 },
    personPoint ? [{ x: personPoint[0], y: personPoint[1], radius: 0.48 }] : [],
  );
}
loadRoom();
addEventListener("storage", loadRoom);
addEventListener("pageshow", loadRoom);
addEventListener("focus", loadRoom);

const floor = document.createElement("canvas");
floor.width = 640;
floor.height = 520;
paintBase(floor.getContext("2d"), "room");
let lastFrame = 0;
try {
  room3d = createGardenRenderer(canvas, roomLayout, null, {
    scene: "room",
    controls: "orbit",
  });
} catch (error) {
  if (!/context|WebGL/i.test(error.message)) throw error;
  c = canvas.getContext("2d");
  canvas.width = 208;
  canvas.height = 288;
}
function frame(ms) {
  if (ms - lastFrame < (room3d?.interacting ? 16 : 33)) {
    requestAnimationFrame(frame);
    return;
  }
  const dt = Math.min(0.1, (ms - lastFrame) / 1000);
  lastFrame = ms;
  const t = ms / 1000;
  if (room3d) {
    room3d.syncLayout(roomLayout);
    room3d.draw({
      time: t,
      dt,
      atmosphere: indoorWeather.update(dt),
      present: !!personPoint,
      person: {
        x: personPoint?.[0] || 300,
        y: personPoint?.[1] || 240,
        state: activity,
        facing: $("facing").value,
        task: ACTIVITIES[activity],
      },
      pig: {
        x: pigPoint?.[0] || 260,
        y: pigPoint?.[1] || 260,
        state: pigActivity,
        facing: "east",
      },
      doorOpen: false,
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
    requestAnimationFrame(frame);
    return;
  }
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, 208, 288);
  c.save();
  c.translate(-196, -56);
  c.drawImage(floor, 0, 0);
  const sprites = roomLayout.scenes.room.map((o) => ({
    y: o.y - (asset(o.type).furniture ? dimensions(o).h / 2 : 0),
    o,
  }));
  if (personPoint)
    sprites.push({
      y: personPoint[1],
      person: {
        x: personPoint[0],
        y: personPoint[1],
        state: activity,
        facing: $("facing").value,
      },
    });
  if (pigPoint)
    sprites.push({
      y: pigPoint[1],
      pig: {
        x: pigPoint[0],
        y: pigPoint[1],
        state: pigActivity,
        facing: "east",
      },
    });
  sprites.sort((a, b) => a.y - b.y);
  for (const s of sprites)
    if (s.o) paintObject(c, s.o, t);
    else if (s.person) paintDongdong(c, s.person, t);
    else paintPig(c, s.pig, t);
  c.restore();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.room = {
  get graphics() {
    return room3d?.stats;
  },
  get outfit() {
    return wardrobe.outfit;
  },
  get pig() {
    return wardrobe.pig;
  },
  get activity() {
    return activity;
  },
  get person() {
    return personPoint;
  },
  get pigPosition() {
    return pigPoint;
  },
  get layout() {
    return structuredClone(roomLayout.scenes.room);
  },
};

$("exportRoom").onclick = () => {
  loadRoom();
  const data = {
    kind: "dongdong-room",
    version: 1,
    wardrobe: { ...wardrobe },
    roomVersion: roomLayout.roomVersion,
    objects: roomLayout.scenes.room,
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "dongdong-room.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("caption").textContent = "房间和换装已打包。";
};
$("importRoom").onclick = () => $("roomFile").click();
$("roomFile").onchange = async () => {
  const file = $("roomFile").files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (
      data.kind !== "dongdong-room" ||
      data.version !== 1 ||
      !Array.isArray(data.objects) ||
      !OUTFITS[data.wardrobe?.outfit] ||
      !Object.hasOwn(DECORATIONS, data.wardrobe?.pig)
    )
      throw Error();
    loadRoom();
    const next = validateLayout({
      ...roomLayout,
      roomVersion: data.roomVersion,
      scenes: { ...roomLayout.scenes, room: data.objects },
    });
    writeLayout(next);
    dress("outfit", data.wardrobe.outfit);
    dress("pig", data.wardrobe.pig);
    roomLayout = next;
    personPoint = freeActorPoint("room", next.scenes.room, 300, 240);
    pigPoint = freeActorPoint(
      "room",
      next.scenes.room,
      260,
      260,
      { radius: 0.76, height: 1.0 },
      personPoint
        ? [{ x: personPoint[0], y: personPoint[1], radius: 0.48 }]
        : [],
    );
    for (const sync of wardrobeViews) sync();
    document.querySelector(".transfer").open = false;
    $("caption").textContent = "房间和换装已恢复。";
  } catch {
    $("caption").textContent = "这个文件无法导入，请选择导出的房间 JSON。";
  } finally {
    $("roomFile").value = "";
  }
};
