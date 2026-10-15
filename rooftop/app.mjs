import { LOOKS } from './fashion/catalog.mjs';
import { paintFashionThumbnail, cancelFashionThumbnail } from './fashion/thumbnails.mjs';
import { createEnvironmentHud } from "./environment-hud.mjs";
import { createLiveWeather, updateWeatherCredit } from "./live-weather.mjs";
import { paintSeasonalAir } from "./seasons.mjs";
import { MONTHS, SEASON_MONTH, validMonth } from "./climate.mjs";
import { attachEditorCameraControls } from "./editor-camera-controls.mjs";
import { fillNotebook, notebookEntry } from "./notebook.mjs";
import { createActionCard } from "./resident-weather.mjs";
import { atmosphereCaption } from "./atmosphere.mjs";
import { createCatalogPreviews, paintCatalogThumbnail } from "./catalog-previews.mjs";
import { onRoomBackgroundReady } from "./room-scene.mjs";
import {
  movedArrangement,
  clearPlacement,
  resolveSupports,
  supportedIds,
  accessibleContents,
} from "./3d/spatial-layout.mjs";
import { createPlacementEditor } from "./placement-editor.mjs";
import { createGardenRenderer } from "./3d/scene3d.mjs";
import { DEFAULT_NARRATIVE_VIEW, NARRATIVE_VIEWS } from "./3d/story-camera.mjs";
import { REVIEW_VIEWS, reviewState, reviewURL, emptyReviewLayout } from "./review-state.mjs";
import { opticOverlayMarkup, updateOpticOverlay } from "./3d/optic-overlay.mjs";
import { LAYOUT_KEY, readLayout, readObservationLayout, writeLayout } from "./layout-storage.mjs";
import { createEditHistory } from "./edit-history.mjs";
import { attachCardFeed } from "./card-feed.mjs";
import { observerIcon, stationActionGlyph, NARRATIVE_LABELS, STATION_ACTIONS } from "./observer-ui.mjs";
import { paintPig } from "./wardrobe.mjs";
import { attachGardenMusic } from "./music.mjs";
import { paintObjectLights } from "./objects.mjs";
import { plantSeed } from "./plant-seed.mjs";
import {
  WEATHER,
  timeOptions,
  makeWeather,
  paintSky,
  paintLighting,
  paintRain,
  paintWetRoof,
  paintSunShadows,
  paintDistanceFog,
} from "./weather.mjs";
import { paintCityLights } from "./city.mjs";
import { plant, vessel, allowedPots } from "./botany.mjs";
import { gardenCamera } from "./camera.mjs";
import { makeResident } from "./resident.mjs";
import {
  SCENES,
  DOORS,
  ASSETS,
  CATALOG_CATEGORIES,
  catalogMatchesCategory,
  asset,
  initialLayout,
  findGroundPlacement,
  paintBase,
  paintSurroundings,
  paintDoor,
  paintObject,
  paintPlantOccluders,
  foregroundObjects,
  paintPerson,
  makeWalker,
  dimensions,
  displayBounds,
  contactPoints,
  resizedObject,
  inside,
  fits,
  supportedLayout,
  validateLayout,
} from "./scene.mjs";
const $ = (id) => document.getElementById(id),
  editor = document.body.classList.contains("editor");
const review = reviewState(location.search);
const backgroundStage = review.active && !editor;
const itemPreviewStage = review.active && editor;
const hideActors = backgroundStage;
const reviewQuery = "background";
const previewStorageKey = "umwelt-rooftop-background-preview-v1";
const previewStorage = {
  getItem: () => sessionStorage.getItem(previewStorageKey) || (review.legacyGameModel ? sessionStorage.getItem("umwelt-rooftop-game-model-preview-v1") : null),
  setItem: (_key, value) => sessionStorage.setItem(previewStorageKey, value),
};
let reviewView = review.view, reviewSampling = review.sampling;
let persistReviewState = () => {};
if (backgroundStage) window.history.replaceState(null, "", reviewURL(location.href));
const narrativeButtons = () => NARRATIVE_VIEWS.map(({id}) => '<button type="button" class="world-card" data-narrative-view="' + id + '" aria-label="' + NARRATIVE_LABELS[id] + '" title="' + NARRATIVE_LABELS[id] + '" aria-pressed="' + (id === DEFAULT_NARRATIVE_VIEW) + '">' + (id === 'neighbor' ? '?' : observerIcon(id)) + '</button>').join("");
let syncNarrativeUI = () => {};
const edits = createEditHistory();
let scene =
    (editor || backgroundStage) && new URLSearchParams(location.search).get("scene") === "room"
      ? "room"
      : new URLSearchParams(location.search).get("scene") === "south"
        ? "south"
        : "north",
  layout = initialLayout(),
  selected = null,
  category = "全部",
  drag = null,
  showPerson = true,
  showPig = !hideActors;
let flushDrag = null;
const dragPerformance = { updates: 0, totalMs: 0, maxMs: 0 };
try {
  if (editor) {
    layout = itemPreviewStage && !previewStorage.getItem()
      ? emptyReviewLayout(initialLayout(), { room: true })
      : readLayout(itemPreviewStage ? previewStorage : localStorage);
  } else layout = backgroundStage
    ? emptyReviewLayout(initialLayout(), { room: true })
    : readObservationLayout();
} catch {
  layout = backgroundStage || itemPreviewStage
    ? emptyReviewLayout(initialLayout(), { room: true })
    : initialLayout();
  if (editor) $("message").textContent = "本机布局无法读取，已恢复初始布局。";
}
if (backgroundStage) {
  document.body.classList.add("background-stage");
  document.title = "空场景 · 综合测试 · 花农时代";
  const reviewStyle = document.createElement("link");reviewStyle.rel="stylesheet";
  reviewStyle.href=new URL("./background-review.css",import.meta.url).href;document.head.append(reviewStyle);
  const controls = document.createElement("div"); controls.className="background-review";
  controls.innerHTML='<span>空场景 · 综合测试</span><select id="reviewScene" aria-label="测试场景"><option value="north">北天台</option><option value="south">南阳台</option><option value="room">空房间</option></select><select id="reviewView" aria-label="测试视角">' + REVIEW_VIEWS.map(({id,label}) => '<option value="' + id + '">' + label + '</option>').join("") + '</select><select id="reviewSampling" aria-label="画面效果"><option value="source">原模型</option><option value="game">游戏像素</option></select><button type="button" id="reviewNotebook">东东的手帐</button><select id="reviewWeather" aria-label="自定义天气"></select><select id="reviewTime" aria-label="自定义时间点"></select><select id="reviewSeason" aria-label="自定义月份"></select>';
  document.querySelector(".roof-world")?.append(controls);
  $("reviewScene").value = scene;
  $("reviewView").value = reviewView;
  $("reviewSampling").value = reviewSampling;
  const placeNotebook = () => document.documentElement.style.setProperty("--review-bottom", Math.ceil(controls.getBoundingClientRect().bottom) + 8 + "px");
  new ResizeObserver(placeNotebook).observe(controls);
  document.fonts.ready.then(placeNotebook);
  window.addEventListener("resize", placeNotebook);
}
if (!editor) attachGardenMusic($("musicToggle"));
let garden3d = null,
  placementEditor = null;
const canvas = $("garden");
try {
  garden3d = createGardenRenderer(
    canvas,
    layout,
    editor ? null : $("sceneDoor"),
    {
      scene,
      backgroundStage,
      reviewView,
      reviewSampling,
      hideActors,
      controls: editor ? "edit" : "pan",
      initialTheta: editor ? undefined : -0.34,
      selected: () => selected,
    },
  );
} catch (error) {
  if (!/context|WebGL/i.test(error.message)) throw error;
}
if (!editor) {
  const viewControls = document.querySelector(".view-controls");
  const legacyControls = viewControls.querySelector(".legacy-view-controls");
  viewControls.hidden = !garden3d;
  if (backgroundStage) document.querySelector(".background-review").append(viewControls);
  if (!backgroundStage) {
    const choices = document.createElement("div");
    choices.className = "narrative-views";
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-label", "观察视角");
    choices.innerHTML = narrativeButtons();
    viewControls.prepend(choices);
  }
  const scope = document.createElement("div");
  scope.className = "neighbor-scope";
  scope.setAttribute("aria-hidden", "true");
  scope.innerHTML = opticOverlayMarkup();
  scope.hidden = true;
  document.querySelector(".roof-world")?.append(scope);
  const stationControls = document.createElement("div");
  stationControls.className = "station-controls";
  stationControls.hidden = true;
  stationControls.setAttribute("role", "group");
  stationControls.setAttribute("aria-label", "观察者移动");
  viewControls.append(stationControls);
  const notebookControls = backgroundStage ? document.querySelector(".background-review") : viewControls;
  const positionNotebook = () => {
    document.documentElement.style.setProperty("--observation-controls-bottom", Math.ceil(notebookControls.getBoundingClientRect().bottom) + "px");
  };
  new ResizeObserver(positionNotebook).observe(notebookControls);
  window.addEventListener("resize", positionNotebook);
  positionNotebook();

  let stationKind = null;
  const updateScope = () => {
    if (!scope.hidden && !document.hidden) updateOpticOverlay(scope, garden3d?.scopeReading);
  };
  setInterval(updateScope, 250);
  syncNarrativeUI = () => {
    const name = garden3d?.stats.narrativeView;
    if (backgroundStage && $("reviewView")) $("reviewView").value = garden3d?.stats.reviewView || reviewView;
    if (legacyControls) legacyControls.hidden = Boolean(name);
    for (const choice of document.querySelectorAll("[data-narrative-view]"))
      choice.setAttribute("aria-pressed", String(choice.dataset.narrativeView === name));
    scope.hidden = name !== "neighbor";
    if (stationKind !== name) {
      const actions = STATION_ACTIONS[name] || [];
      stationControls.innerHTML = actions.map(([action,label]) => '<button type="button" class="world-card" data-station-action="' + action + '" aria-label="' + label + '" title="' + label + '"><span class="station-glyph" aria-hidden="true">' + stationActionGlyph(action) + '</span></button>').join("");
      stationControls.hidden = !actions.length;
      for (const button of stationControls.querySelectorAll("[data-station-action]")) button.onclick = () => {
        const action = button.dataset.stationAction;
        if (action === "in" || action === "out") garden3d?.nudgeNarrativeOptics(action);
        else garden3d?.nudgeNarrativeStation(action);
      };
      const labels = { bird: "小鸟操作", drone: "无人机操作", neighbor: "瞄准镜操作" };
      const hints = { bird: "左右拖动沿檐走动，上下拖动微微抬头或低头。", drone: "拖动转动镜头，按钮升降；滚轮或双指靠近、退远。", neighbor: "拖动瞄准；滚轮或双指调整倍率。" };
      stationControls.setAttribute("aria-label", labels[name] || "观察者移动");
      canvas.title = hints[name] || "";
      stationKind = name;
    }
    updateScope();
    const choices = document.querySelector(".narrative-views");
    if (choices) choices.hidden = !name;
  };
  for (const button of document.querySelectorAll("[data-narrative-view]"))
    button.onclick = () => { garden3d?.setNarrativeView(button.dataset.narrativeView); syncNarrativeUI(); cardFeed?.notifyObserver(button.dataset.narrativeView, time); };
  const chooseViewMode = (button) => {
    garden3d.setNavigationMode(button.dataset.viewMode);
    for (const choice of viewControls.querySelectorAll("[data-view-mode]"))
      choice.setAttribute("aria-pressed", String(choice === button));
  };
  for (const button of viewControls.querySelectorAll("[data-view-mode]")) {
    button.onclick = () => chooseViewMode(button);
    // Selecting a mode is idempotent. Respond on touch release as well, since
    // a browser can defer or suppress click synthesis after a drag.
    button.addEventListener("pointerup", (event) => {
      if (event.pointerType === "touch") chooseViewMode(button);
    });
  }
  $("viewReset").onclick = () => { garden3d.setScene(scene); syncNarrativeUI(); };
  syncNarrativeUI();
}
const display = garden3d ? null : canvas.getContext("2d"),
  materialFrame = document.createElement("canvas"),
  ctx = materialFrame.getContext("2d"),
  base = document.createElement("canvas");
base.width = 640;
base.height = 520;
const baseCtx = base.getContext("2d");
if (!garden3d) onRoomBackgroundReady(() => {
  if (scene === "room") paintBase(baseCtx, scene, { includeCity: false });
});
let walker, pigWalker;
const cameras = {
  room: { x: 196, y: 56, w: 208, h: 288 },
  north: { x: 96, y: 48, w: 416, h: 440 },
  south: { x: 76, y: 44, w: 416, h: 440 },
};
let camera = cameras[scene];
const pans = {
  room: { x: 0, y: 0 },
  north: { x: 0, y: 0 },
  south: { x: 0, y: 0 },
};
let panDrag = null;
const zooms = { room: 1, north: 1, south: 1 },
  pointers = new Map();
let pinch = null;
const backdrop = document.createElement("canvas");
const WEATHER_KEY = backgroundStage || itemPreviewStage ? "umwelt-rooftop-background-weather-preview-v1" : "umwelt-rooftop-weather-v1";
let weatherChoices = { condition: "clear", phase: "day" };
if (editor)
  try {
    weatherChoices =
      JSON.parse(localStorage.getItem(WEATHER_KEY) || (review.legacyGameModel ? localStorage.getItem("umwelt-rooftop-game-model-weather-preview-v1") : null)) || weatherChoices;
  } catch {}
// Old editor season selections retain their representative month.
if (!validMonth(weatherChoices.month) && SEASON_MONTH[weatherChoices.season]) {
  weatherChoices = {...weatherChoices, month:String(SEASON_MONTH[weatherChoices.season]), season:'auto'};
}
const liveWeather = createLiveWeather({storage:(()=>{try{return localStorage;}catch{return null;}})()});
const weather = makeWeather(
  editor
    ? { ...weatherChoices, manualTransition: 0.65, liveWeather:liveWeather.snapshot }
    : {
        liveWeather:liveWeather.snapshot,
        condition:
          new URLSearchParams(location.search).get("weather") ||
          (backgroundStage ? "clear" : "auto"),
        phase: new URLSearchParams(location.search).get("time") || (backgroundStage ? "day" : "auto"),
        season: new URLSearchParams(location.search).get("season") || (backgroundStage ? "spring" : "auto"),
        month: new URLSearchParams(location.search).get("month") || "auto",
        festival: new URLSearchParams(location.search).get("festival") || "auto",
      },
);
const environmentHud = createEnvironmentHud($("environmentHud"));
let atmosphere = weather.state,
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches,
  cityBounds;
const activityEnvironment = () => ({
  ...atmosphere,
  condition: atmosphere.activityCondition || atmosphere.condition,
});
const resident = editor
  ? null
  : makeResident(Math.random, {
      phase: () => atmosphere.phase,
      environment: activityEnvironment,
    });
if (resident) showPerson = !hideActors && resident.present;
matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
  "change",
  (e) => {
    reduced = e.matches;
  },
);
function refreshTimeOptions(id) {
  const select = $(id); if (!select) return;
  const month = validMonth(weather.choices.month) ? weather.choices.month : SEASON_MONTH[weather.choices.season];
  select.replaceChildren(new Option('随北京时间', 'auto'), ...timeOptions(month).map(v=>new Option(v.name,v.id)));
  select.value = weather.choices.phase;
}
if (editor) {
  attachEditorCameraControls($("editCameraControls"), action => garden3d?.nudgeEditCamera(action));
  for (const [id, key, values] of [
    ["weatherSelect", "condition", [{id:"simulated",name:"季节天气模拟"},...WEATHER]],
    ["timeSelect", "phase", timeOptions(weather.choices.month)],
    ["seasonSelect", "month", MONTHS],
  ]) {
    const select = $(id);
    for (const item of values) {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.name;
      select.append(option);
    }
    select.value = weather.choices[key];
    select.onchange = () => {
      weather.set(key, select.value);
      if (key === "condition") liveWeather.resume();
      if (key === "month") refreshTimeOptions("timeSelect");
      try {
        localStorage.setItem(WEATHER_KEY, JSON.stringify(weather.choices));
      } catch {}
    };
  }
  refreshTimeOptions("timeSelect");
}
if (backgroundStage) {
  persistReviewState = () => {
    window.history.replaceState(null, "", reviewURL(location.href, { scene, view: reviewView, sampling: reviewSampling, ...weather.choices }));
  };
  $("reviewSampling").onchange=()=>{
    reviewSampling=$("reviewSampling").value;
    garden3d?.setReviewSampling(reviewSampling);
    persistReviewState();
  };
  $("reviewView").onchange=()=>{
    reviewView=$("reviewView").value;
    garden3d?.setReviewView(reviewView);
    syncNarrativeUI();
    persistReviewState();
  };
  for (const [id,key,values] of [["reviewWeather","condition",WEATHER],["reviewTime","phase",timeOptions(weather.choices.month)],["reviewSeason","month",MONTHS]]) {
    const select=$(id);if(!select)continue;
    select.append(new Option(key==="condition"?"濠河实时天气":"随现实日历", "auto"));
    if(key==="condition")select.append(new Option("季节天气模拟","simulated"));
    for(const item of values){const option=document.createElement("option");option.value=item.id;option.textContent=item.name;select.append(option);}
    select.value=key==="month" && weather.choices.season!=="auto" ? String(SEASON_MONTH[weather.choices.season]) : weather.choices[key];select.onchange=()=>{weather.set(key,select.value);if(key==="condition")liveWeather.resume();if(key==="month")refreshTimeOptions("reviewTime");persistReviewState();};
  }
  refreshTimeOptions("reviewTime");
  $("reviewScene").onchange=()=>{
    scene=$("reviewScene").value;
    persistReviewState();
    rebuild();
  };
  persistReviewState();
}
let displayedCalendar = '';
function weatherCaption() {
  const calendar = `${atmosphere.monthName}:${atmosphere.sunrise}:${atmosphere.sunset}`;
  if (calendar !== displayedCalendar) {
    displayedCalendar = calendar;
    if (editor) refreshTimeOptions('timeSelect');
    if (backgroundStage) refreshTimeOptions('reviewTime');
  }
  updateWeatherCredit($("weatherSource"), atmosphere);
  const text = atmosphereCaption(atmosphere);
  $("weatherStatus").title = `${atmosphere.monthName} · ${atmosphere.period}`;
  if ($("weatherStatus").textContent !== text)
    $("weatherStatus").textContent = text;
}
const actionCard = createActionCard();
function updateActionCard() {
  const action = actionCard.update(walker?.person, pigWalker?.person, {
    present: showPerson,
    scene,
    weather: atmosphere,
  });
  if ($("actionStatus") && $("actionStatus").textContent !== action)
    $("actionStatus").textContent = action;
  if (editor && $("actionStatus")) $("actionStatus").hidden = !showPerson;
}
const objects = () => layout.scenes[scene],
  selection = () => objects().find((o) => o.id === selected);
function save() {
  if (backgroundStage) return;
  try {
    writeLayout(layout, itemPreviewStage ? previewStorage : localStorage);
  } catch {
    message("本机存储不可用，请导出 JSON 保存。");
  }
}
function message(text) {
  if (editor) $("message").textContent = text;
}
function checkpoint() {
  edits.checkpoint(JSON.stringify(layout));
  buttons();
}
function buttons() {
  if (!editor) return;
  $("undo").disabled = !edits.canUndo;
  $("redo").disabled = !edits.canRedo;
  $("count").textContent = objects().length + " 件";
  const o = selection();
  $("selectedName").textContent = o ? asset(o.type).name : "挑一件东西";
  if (editor) {
    const picker = $("contentsSelect"),
      contents = o ? accessibleContents(objects(), o.id) : [];
    $("contentsControl").hidden = !contents.length;
    picker.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "选择上面或里面的东西";
    picker.append(placeholder);
    for (const { id, ground } of contents) {
      const child = objects().find((p) => p.id === id),
        option = document.createElement("option");
      option.value = id;
      option.textContent =
        (ground ? "下方地面 · " : "") + asset(child.type).name;
      picker.append(option);
    }
  }
  $("objectControls").hidden = !o;
  $("positionText").hidden = !o;
  if (o) {
    positionFields(o);
    $("scale").value = o.scale;
    $("scaleValue").textContent = Math.round(o.scale * 100) + "%";
  }
  placementEditor?.update();
  notebook(o);
}
function positionFields(o) {
  $("posX").value = o.x;
  $("posY").value = o.y;
  const text = "X " + Math.round(o.x) + "  Y " + Math.round(o.y);
  if ($("positionText").textContent !== text)
    $("positionText").textContent = text;
}
function rebuild() {
  if (backgroundStage && $("reviewScene")) {
    $("reviewScene").value=scene;
  }
  if (editor) document.body.classList.toggle("room-edit", scene === "room");
  if (garden3d) {
    garden3d.syncLayout(layout);
    garden3d.setScene(scene);
    syncNarrativeUI();
  }
  if (!editor) {
    zooms[scene] = scene === "north" ? 1.7 : 1;
    pans[scene] = scene === "north" ? { x: 56, y: -20 } : { x: 0, y: 0 };
    pointers.clear();
    panDrag = null;
    pinch = null;
  }
  for (const b of document.querySelectorAll("button[data-scene]"))
    b.setAttribute("aria-pressed", String(b.dataset.scene === scene));
  camera = cameras[scene];
  fitView();
  if (!garden3d) paintBase(baseCtx, scene, { includeCity: false });
  walker = makeWalker(scene, objects, {
    environment: activityEnvironment,
    company: () => [pigWalker?.person],
  });
  pigWalker = makeWalker(scene, objects, {
    visits: 7,
    actor: "pig",
    environment: activityEnvironment,
    body: { radius: 0.76, height: 1.0 },
    company: () => (showPerson ? [walker?.person] : []),
  });
  walker.randomize();
  pigWalker.randomize();
  selected = null;
  buttons();
  syncPresence();
  render();
}
function changed() {
  garden3d?.syncLayout(layout);
  save();
  buttons();
  walker.reset();
  pigWalker.reset();
}
function commitMove(o, patch) {
  if (Object.entries(patch).every(([key, value]) => o[key] === value))
    return true;
  const next = movedArrangement(objects(), o.id, patch);
  if (!supportedLayout(scene, next)) {
    message("这里放不稳，检查层间高度、支撑范围或阳台边界。");
    buttons();
    return false;
  }
  if (
    !clearPlacement(
      next,
      new Set(next.filter((p, i) => p !== objects()[i]).map((p) => p.id)),
    )
  ) {
    message("这里放不下这个器物，移到旁边或换一只小盆。");
    buttons();
    return false;
  }
  checkpoint();
  next.forEach((p, i) => Object.assign(objects()[i], p));
  changed();
  return true;
}

function add(type, source) {
  const origin = source || {
    x: scene === "north" ? 310 : 284,
    y: scene === "north" ? 240 : 264,
  };
  const object = {
    ...(source || { type, rotation: 0, scale: 1 }),
    id: crypto.randomUUID(),
    support: null,
  };
  if (plant(type)) object.seed = plantSeed(object.id);
  const pos = findGroundPlacement(scene, object, objects(), origin);
  if (!pos) {
    message("这个物件放不进当前阳台。");
    return;
  }
  const o = pos;
  if (objects().length >= 400) {
    message("每个阳台最多 400 件物件。");
    return;
  }
  checkpoint();
  objects().push(o);
  selected = o.id;
  changed();
  message("拿出了 " + asset(type).name + "，拖动即可放到天台上。");
}
function remove() {
  const o = selection();
  if (!o) return;
  if (supportedIds(objects(), o.id).size > 1) {
    message("先把上面的东西移开，再收起这件家具。");
    return;
  }
  const next = objects().filter((p) => p.id !== o.id);
  if (!supportedLayout(scene, next)) {
    message("这里的物件还需要支撑，先调整承放位置。");
    return;
  }
  checkpoint();
  layout.scenes[scene] = next;
  selected = null;
  changed();
}
function rotate() {
  const o = selection();
  if (o) commitMove(o, { rotation: (o.rotation + 90) % 360 });
}

let notebookKey = "";
function notebook(o) {
  const p = o && plant(o.type),
    a = o && asset(o.type),
    key = o
      ? o.id +
        ":" +
        o.type +
        ":" +
        (o.seed || 0) +
        ":" +
        (o.pot || p?.defaultPot || "")
      : "empty";
  if (key === notebookKey) return;
  notebookKey = key;
  document.querySelector(".notebook details").open = false;
  $("notebookBody").hidden = !o;
  $("notebookEmpty").hidden = !!o;
  if ($("vesselControls")) $("vesselControls").hidden = !p;
  if (!o) return;
  fillNotebook(o);
  const preview = $("notePreview");
  cancelFashionThumbnail(preview);
  if(o.type.startsWith('fashion:')){paintFashionThumbnail(preview,o.type.slice(8));return;}
  preview.getContext("2d").clearRect(0, 0, 96, 96);
  paintObject(preview.getContext("2d"), {
    type: o.type,
    pot: o.pot,
    seed: o.seed,
    x: 48,
    y: 48,
    rotation: 0,
    scale: p ? 1.7 : a.weapon ? Math.min(2, 80 / a.w) : 2,
  });
  if (garden3d) {
    preview.getContext("2d").clearRect(0, 0, 96, 96);
    garden3d.thumbnail(o, preview);
  }
  if (p && editor) {
    $("potSelect").replaceChildren();
    for (const pot of allowedPots(o.type)) {
      const option = document.createElement("option");
      option.value = pot.id;
      option.textContent =
        pot.name + (pot.shapeLabel ? " · " + pot.shapeLabel : "");
      $("potSelect").append(option);
    }
    $("potSelect").value = o.pot || p.defaultPot;
    $("potReason").textContent = p.containerNote;
    vesselNote(o.pot || p.defaultPot);
  }
}
function vesselNote(id) {
  $("vesselNote").textContent = notebookEntry({
    type: "vessel-" + id,
  }).description;
}

if (!editor) {
  const note = document.querySelector(".notebook");
  let pinned = false,
    timer = null,
    down = null,
    moved = false;
  const touching = new Set();
  const close = () => {
    pinned = false;
    note.hidden = true;
    $("notebookOpen")?.setAttribute("aria-expanded", "false");
    clearTimeout(timer);
    notebookKey = "";
  };
  const open = (o, pin = false) => {
    if (!o) return;
    clearTimeout(timer);
    notebook(o);
    note.hidden = false;
    pinned = pin;
    $("notebookOpen")?.setAttribute("aria-expanded", "true");
  };
  const journalOpeners = [$("notebookOpen"), $("reviewNotebook")].filter(Boolean);
  if (journalOpeners.length) {
    const browse = document.createElement("select");
    browse.id = "reviewEntry";
    browse.className = "notebook-browser";
    browse.setAttribute("aria-label", "手帐资料条目");
    for (const item of [...ASSETS,...LOOKS.map(l=>({id:'fashion:'+l.id,name:'衣服 · '+l.name}))]) {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.name;
      browse.append(option);
    }
    note.querySelector(".notebook-title").after(browse);
    const showEntry = () => open({ id: "notebook-browse", type: browse.value, seed: 1835 }, true);
    browse.onchange = showEntry;
    for (const opener of journalOpeners) opener.onclick = showEntry;
    if ($("notebookOpen")) $("notebookOpen").hidden = backgroundStage;
  }
  const inspectAt = (e) =>
    garden3d ? garden3d.pick(e.clientX, e.clientY) : hit(coords(e));
  canvas.addEventListener("pointerdown", (e) => {
    touching.add(e.pointerId);
    down = [e.clientX, e.clientY];
    moved = touching.size > 1;
    clearTimeout(timer);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (down) {
      moved ||= Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5;
      if (moved && !pinned) note.hidden = true;
      return;
    }
    if (pinned || e.pointerType === "touch") return;
    clearTimeout(timer);
    // Hold the item under the cursor, rather than picking again after the
    // delay: wind can move a thin leaf away while its notebook is opening.
    const hovered = inspectAt(e);
    timer = setTimeout(() => {
      if (pinned) return;
      if (hovered) open(hovered);
      else if (!note.matches(":hover") && !pinned) note.hidden = true;
    }, 350);
  });
  canvas.addEventListener("pointerleave", () => {
    clearTimeout(timer);
    if (!pinned && !down)
      timer = setTimeout(() => {
        if (!pinned && !note.matches(":hover")) note.hidden = true;
      }, 500);
  });
  canvas.addEventListener("wheel", () => {
    clearTimeout(timer);
    if (!pinned) note.hidden = true;
  });
  canvas.addEventListener("pointerup", (e) => {
    if (down && !moved) {
      const o = inspectAt(e);
      if (o) open(o, true);
      else close();
    }
    touching.delete(e.pointerId);
    down = null;
  });
  for (const event of ["pointercancel", "lostpointercapture"])
    canvas.addEventListener(event, (e) => {
      touching.delete(e.pointerId);
      down = null;
      clearTimeout(timer);
    });
  note.addEventListener("pointerenter", () => clearTimeout(timer));
  note.addEventListener("pointerleave", () => {
    if (!pinned)
      timer = setTimeout(() => {
        if (!pinned) note.hidden = true;
      }, 500);
  });
  note.addEventListener("click", () => {
    pinned = true;
  });
  $("notebookClose").onclick = (e) => {
    e.stopPropagation();
    close();
  };
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
  $("sceneDoor").addEventListener("click", close);
}

const catalogPreviews = editor
  ? createCatalogPreviews($("assets"), async (sprite, preview) => {
      await paintCatalogThumbnail(preview, asset(sprite.type).thumbnail);
    }, { busy: () => (atmosphere.transition?.mix ?? 1) < .999 || garden3d?.interacting || document.activeElement?.matches("#weatherSelect, #timeSelect, #seasonSelect") })
  : null;
function catalog() {
  const q = $("search").value.trim().toLowerCase();
  catalogPreviews.reset();
  $("assets").replaceChildren();
  for (const a of ASSETS.filter(
    (a) =>
      catalogMatchesCategory(a, category) &&
      (!q ||
        [a.name, a.scientific, a.ja, a.aliases]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)),
  )) {
    const button = document.createElement("button");
    button.className = "asset-card";
    button.dataset.asset = a.id;
    button.title = "添加" + a.name;
    const preview = document.createElement("canvas");
    preview.width = 64;
    preview.height = 64;
    const sprite = {
      type: a.id,
      x: 32,
      y: 32,
      scale: a.w > 52 ? 0.75 : a.plant ? 1.15 : 1,
      rotation: 0,
    };
    catalogPreviews.observe(preview, sprite);
    const name = document.createElement("span");
    name.textContent = a.name;
    button.append(preview, name);
    button.onclick = () => add(a.id);
    $("assets").append(button);
  }
}
function coords(e, height = 0) {
  if (garden3d)
    return (
      garden3d.pointAtHeight(e.clientX, e.clientY, height) || { x: 0, y: 0 }
    );
  const r = canvas.getBoundingClientRect(),
    x = ((e.clientX - r.left) * camera.w) / r.width + camera.x,
    y = ((e.clientY - r.top) * camera.h) / r.height + camera.y;
  return { x, y };
}
function hit(pos) {
  return [...objects()]
    .sort((a, b) => b.y - a.y)
    .find((o) => {
      const b = displayBounds(o);
      return (
        pos.x >= o.x + b.left - 4 &&
        pos.x <= o.x + b.right + 4 &&
        pos.y >= o.y + b.top - 4 &&
        pos.y <= o.y + b.bottom + 4
      );
    });
}
for (const button of document.querySelectorAll("button[data-scene]"))
  button.onclick = () => {
    if (editor) document.querySelector(".transfer").open = false;
    scene = button.dataset.scene;
    for (const b of document.querySelectorAll("button[data-scene]"))
      b.setAttribute("aria-pressed", String(b === button));
    rebuild();
  };
if (editor) {
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".layout-transfer"))
      document.querySelector(".transfer").open = false;
  });
  placementEditor = createPlacementEditor({
    element: $("placementControls"),
    objects,
    selection,
    name: (type) => asset(type).name,
    move: commitMove,
    message,
  });
  for (const name of CATALOG_CATEGORIES) {
    const button = document.createElement("button");
    button.textContent = name;
    button.setAttribute("aria-pressed", String(name === category));
    button.onclick = () => {
      category = name;
      for (const b of $("categories").children)
        b.setAttribute("aria-pressed", String(b === button));
      catalog();
    };
    $("categories").append(button);
  }
  $("rerollPlant").onclick = () => {
    const o = selection();
    if (o && plant(o.type)) {
      commitMove(o, { seed: plantSeed(crypto.randomUUID()) });
      message("已换一个株形。");
    }
  };
  $("search").oninput = catalog;
  catalog();
  $("potSelect").onchange = () => {
    const o = selection();
    if (o && allowedPots(o.type).some((p) => p.id === $("potSelect").value))
      commitMove(o, { pot: $("potSelect").value });
  };
  canvas.onpointerdown = (e) => {
    if (drag && garden3d?.gesturing) {
      const snapshot = drag.before;
      drag = null;
      if (snapshot !== JSON.stringify(layout)) {
        edits.checkpoint(snapshot);
        changed();
      }
      return;
    }
    if (e.button !== 0 || drag) return;
    const o = garden3d ? garden3d.pick(e.clientX, e.clientY) : hit(coords(e));
    const height = o ? resolveSupports(objects()).get(o.id)?.height || 0 : 0;
    const pos = coords(e, height);
    selected = o?.id || null;
    buttons();
    canvas.focus({ preventScroll: true });
    if (o) {
      drag = {
        id: o.id,
        pointerId: e.pointerId,
        dx: pos.x - o.x,
        dy: pos.y - o.y,
        before: JSON.stringify(layout),
        excluded: supportedIds(objects(), o.id),
      };
      canvas.setPointerCapture(e.pointerId);
    }
  };
  canvas.onpointermove = (e) => {
    if (!drag || e.pointerId !== drag.pointerId || garden3d?.gesturing) return;
    drag.pending = { clientX: e.clientX, clientY: e.clientY };
  };
  flushDrag = () => {
    if (!drag?.pending) return;
    const e = drag.pending;
    drag.pending = null;
    const start = performance.now();
    try {
      const o = selection();
      if (!o) return;
      const target = garden3d
        ? garden3d.placementAt(e.clientX, e.clientY, o, drag.excluded, {
            x: drag.dx,
            y: drag.dy,
          })
        : { x: coords(e).x - drag.dx, y: coords(e).y - drag.dy, support: null };
      if (!target) return;
      const step = $("snap").checked ? 4 : 1;
      const patch = {
        x: Math.round(target.x / step) * step,
        y: Math.round(target.y / step) * step,
        support: target.support,
      };
      // Quantisation must not push a pot outside a narrow shelf or a wall contact.
      let next = movedArrangement(objects(), o.id, patch);
      let valid = supportedLayout(scene, next);
      if (!valid) {
        patch.x = target.x;
        patch.y = target.y;
        next = movedArrangement(objects(), o.id, patch);
        valid = supportedLayout(scene, next);
      }
      if (
        valid &&
        clearPlacement(
          next,
          new Set(next.filter((p, i) => p !== objects()[i]).map((p) => p.id)),
        )
      ) {
        next.forEach((p, i) => Object.assign(objects()[i], p));
        garden3d?.syncLayout(layout);
        positionFields(o);
        placementEditor.preview(o);
      }
    } finally {
      const ms = performance.now() - start;
      dragPerformance.updates++;
      dragPerformance.totalMs += ms;
      dragPerformance.maxMs = Math.max(dragPerformance.maxMs, ms);
    }
  };
  const finish = (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    flushDrag();
    const snapshot = drag.before;
    drag = null;
    if (snapshot !== JSON.stringify(layout)) {
      edits.checkpoint(snapshot);
      changed();
      message("已经放好。");
    } else buttons();
  };
  canvas.onpointerup = finish;
  canvas.onpointercancel = finish;
  canvas.onlostpointercapture = finish;
  $("rotate").onclick = rotate;
  $("remove").onclick = remove;
  $("contentsSelect").onchange = () => {
    selected = $("contentsSelect").value || selected;
    buttons();
  };
  $("duplicate").onclick = () => {
    const o = selection();
    if (o) add(o.type, o);
  };
  function resize(scale) {
    const o = selection();
    if (!o) return;
    const next = resizedObject(
      scene,
      o,
      Math.round(Math.max(0.5, Math.min(2, scale)) * 100) / 100,
      objects(),
    );
    if (!next) {
      message("这里容不下这个尺寸，先移到更宽的地方再放大。");
      buttons();
      return;
    }
    const moved = next.x !== o.x || next.y !== o.y;
    if (!commitMove(o, { scale: next.scale, x: next.x, y: next.y })) return;
    message(
      "大小 " +
        Math.round(next.scale * 100) +
        "%" +
        (moved ? "，稍向内挪了一点。" : "。"),
    );
  }
  $("scale").onchange = () => resize(Number($("scale").value));
  $("scaleDown").onclick = () => resize((selection()?.scale || 1) - 0.1);
  $("scaleUp").onclick = () => resize((selection()?.scale || 1) + 0.1);
  for (const id of ["posX", "posY"])
    $(id).onchange = () => {
      const o = selection();
      if (o)
        commitMove(o, { [id === "posX" ? "x" : "y"]: Number($(id).value) });
    };
  $("undo").onclick = () => {
    if (!edits.canUndo) return;
    const previous = selected;
    layout = edits.undo(layout);
    rebuild();
    selected = previous;
    buttons();
    save();
  };
  $("redo").onclick = () => {
    if (!edits.canRedo) return;
    const previous = selected;
    layout = edits.redo(layout);
    rebuild();
    selected = previous;
    buttons();
    save();
  };
  $("clear").onclick = () => {
    checkpoint();
    layout.scenes[scene] = [];
    selected = null;
    changed();
    message("天台腾空了，可以从架上重新挑东西。");
  };
  $("restore").onclick = () => {
    checkpoint();
    layout.scenes[scene] = initialLayout().scenes[scene];
    selected = null;
    changed();
    message("已恢复" + SCENES[scene].name + "的初始陈列。");
  };
  $("person").onchange = () => (showPerson = $("person").checked);
  $("pig").onchange = () => (showPig = $("pig").checked);
  $("preview").onclick = () => {
    save();
    $("preview").href = itemPreviewStage ? "../?stage=" + reviewQuery + "&scene=" + scene : "../?layout=local&scene=" + scene;
  };
  const load = (text) => {
    try {
      const imported = validateLayout(JSON.parse(text));
      checkpoint();
      layout = imported;
      rebuild();
      save();
      message("已导入北天台和南阳台的布局。");
    } catch (e) {
      message("导入失败：" + e.message);
    }
  };
  $("export").onclick = () => {
    const text = JSON.stringify(layout, null, 2);
    $("layoutText").value = text;
    const url = URL.createObjectURL(
        new Blob([text], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "horticultural-era-rooftop-layout.json";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    message("已导出北天台和南阳台的布局 JSON 文件。");
  };
  $("importButton").onclick = () => $("importFile").click();
  $("importFile").onchange = async () => {
    const file = $("importFile").files[0];
    try {
      if (file) load(await file.text());
    } catch (e) {
      message("导入失败：" + e.message);
    } finally {
      $("importFile").value = "";
    }
  };
  $("importText").onclick = () => load($("layoutText").value);
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input,select,textarea")) return;
    const o = selection();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      $(e.shiftKey ? "redo" : "undo").click();
      return;
    }
    if (!o) return;
    const delta = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[e.key];
    if (delta) {
      e.preventDefault();
      commitMove(o, {
        x: o.x + delta[0] * (e.shiftKey ? 8 : 1),
        y: o.y + delta[1] * (e.shiftKey ? 8 : 1),
      });
    }
    if (e.key.toLowerCase() === "r") rotate();
    if (["Delete", "Backspace"].includes(e.key)) {
      e.preventDefault();
      remove();
    }
  });
} else {
  $("sceneDoor").onclick = () => {
    scene = scene === "north" ? "south" : "north";
    const url = new URL(location.href);
    url.searchParams.set("scene", scene);
    historyNavigation.pushState(null, "", url);
    rebuild();
  };
  if ($("sceneCard")) $("sceneCard").onclick = () => $("sceneDoor").click();
  window.addEventListener("popstate", () => {
    scene = backgroundStage ? reviewState(location.search).scene :
      new URLSearchParams(location.search).get("scene") === "south"
        ? "south"
        : "north";
    if (backgroundStage) {
      reviewView=reviewState(location.search).view;
      reviewSampling=reviewState(location.search).sampling;
      $("reviewSampling").value=reviewSampling;
      garden3d?.setReviewSampling(reviewSampling);
      garden3d?.setReviewView(reviewView);
      const query=new URLSearchParams(location.search);
      for (const [id,key,parameter] of [["reviewWeather","condition","weather"],["reviewTime","phase","time"],["reviewSeason","month","month"]]) {
        const value=query.get(parameter) || (key==="month" && SEASON_MONTH[query.get("season")] ? String(SEASON_MONTH[query.get("season")]) : "auto");
        if(value){weather.set(key,value);$(id).value=weather.choices[key];}
      }
      refreshTimeOptions("reviewTime");
    }
    rebuild();
  });
  if (!garden3d) {
    const clampPan = () => {
      pans[scene] = gardenCamera(
        scene,
        innerWidth,
        innerHeight,
        zooms[scene],
        pans[scene],
      ).pan;
    };
    const zoomAt = (factor, point, world = coords(point)) => {
      zooms[scene] = Math.max(1, Math.min(2.5, zooms[scene] * factor));
      fitView();
      const after = coords(point);
      pans[scene].x += world.x - after.x;
      pans[scene].y += world.y - after.y;
      clampPan();
      fitView();
      render();
    };
    const beginGesture = () => {
      const ps = [...pointers.values()];
      if (ps.length >= 2) {
        const a = ps[0],
          b = ps[1],
          center = {
            clientX: (a.clientX + b.clientX) / 2,
            clientY: (a.clientY + b.clientY) / 2,
          };
        pinch = {
          distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
          world: coords(center),
        };
        panDrag = null;
      } else if (ps.length === 1) {
        const e = ps[0];
        pinch = null;
        panDrag = {
          x: e.clientX,
          y: e.clientY,
          origin: { ...pans[scene] },
          camera: { ...camera },
        };
      } else {
        panDrag = null;
        pinch = null;
      }
    };
    canvas.onpointerdown = (e) => {
      if (e.button !== 0) return;
      pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
      canvas.setPointerCapture(e.pointerId);
      beginGesture();
    };
    canvas.onpointermove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
      if (pinch && pointers.size >= 2) {
        const [a, b] = [...pointers.values()],
          distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (distance > 0 && pinch.distance > 0)
          zoomAt(
            distance / pinch.distance,
            {
              clientX: (a.clientX + b.clientX) / 2,
              clientY: (a.clientY + b.clientY) / 2,
            },
            pinch.world,
          );
        pinch.distance = distance;
      } else if (panDrag) {
        const rect = canvas.getBoundingClientRect();
        pans[scene] = {
          x:
            panDrag.origin.x -
            ((e.clientX - panDrag.x) * panDrag.camera.w) / rect.width,
          y:
            panDrag.origin.y -
            ((e.clientY - panDrag.y) * panDrag.camera.h) / rect.height,
        };
        clampPan();
        fitView();
        render();
      }
    };
    const finishPan = (e) => {
      pointers.delete(e.pointerId);
      beginGesture();
    };
    canvas.onpointerup = finishPan;
    canvas.onpointercancel = finishPan;
    canvas.onlostpointercapture = finishPan;
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        zoomAt(Math.exp(-e.deltaY * 0.0015), e);
      },
      { passive: false },
    );
    window.addEventListener("resize", () => {
      fitView();
      render();
    });
  }
}
const historyNavigation = window.history;
function fitView() {
  if (garden3d) {
    if (editor) {
      const ratio =
        scene === "room"
          ? innerWidth < 640
            ? 1 / 1.12
            : 4 / 3
          : camera.w / camera.h;
      canvas.parentElement.style.setProperty("--scene-ratio", ratio);
      canvas.parentElement.style.aspectRatio = String(ratio);
      canvas.style.height = "100%";
    }
    garden3d.resize();
    if (!editor) {
      const door = $("sceneDoor");
      const label = DOORS[scene]?.label || "返回北天台";
      door.setAttribute("aria-label", label);
      door.title = label;
    }
    return;
  }
  if (editor) {
    canvas.width = camera.w;
    canvas.height = camera.h;
  } else {
    const view = gardenCamera(
      scene,
      innerWidth,
      innerHeight,
      zooms[scene],
      pans[scene],
    );
    camera = view.camera;
    pans[scene] = view.pan;
  }
  canvas.width = camera.w;
  canvas.height = camera.h;
  if (editor)
    canvas.parentElement.style.setProperty(
      "--scene-ratio",
      camera.w / camera.h,
    );
  materialFrame.width = camera.w;
  materialFrame.height = camera.h;
  backdrop.width = camera.w;
  backdrop.height = camera.h;
  const bg = backdrop.getContext("2d");
  bg.translate(-camera.x, -camera.y);
  cityBounds = { ...camera };
  if (scene !== "room")
    paintSurroundings(bg, cityBounds, { scene, sky: false });
  if (editor) return;
  const d = DOORS[scene],
    door = $("sceneDoor"),
    rect = canvas.getBoundingClientRect(),
    sx = rect.width / camera.w,
    sy = rect.height / camera.h;
  door.hidden = !d;
  if (!d) return;
  const w = Math.max(44, (d.w + 16) * sx),
    h = Math.max(44, (d.h + 12) * sy);
  Object.assign(door.style, {
    left: (d.x - camera.x) * sx - w / 2 + "px",
    top: (d.y - camera.y) * sy - h / 2 + "px",
    width: w + "px",
    height: h + "px",
  });
  door.setAttribute("aria-label", d.label);
  door.title = d.label;
}
function syncPresence() {
  if (editor) return;
  if ($("sceneCard")) $("sceneCard").textContent = scene === "north" ? "去南阳台看看。" : "去北天台看看。";
  $("roomCard").href =
    "./room/?scene=" + scene + "&weather=" + atmosphere.condition;
  $("garageCard").href = "./arrange/?scene=" + scene;
  if (!resident.present) $("dongdongStatus").textContent = resident.status;
  canvas.setAttribute(
    "aria-label",
    backgroundStage ? SCENES[scene].name + "，空场景综合测试"
      : SCENES[scene].name + "，" + layout.scenes[scene].length + " 件物件，" +
        (resident.present ? "东东和小猪在阳台活动" : resident.status),
  );
}

let doorOpen = false;
if (!editor) {
  const door = $("sceneDoor");
  door.onpointerenter = () => {
    doorOpen = true;
    render();
  };
  door.onpointerleave = () => {
    doorOpen = false;
    render();
  };
  door.onfocus = () => {
    doorOpen = true;
    render();
  };
  door.onblur = () => {
    doorOpen = false;
    render();
  };
}
let last = performance.now(),
  time = 0,
  drawAt = 0,
  renderedAt = 0;
function render() {
  if (garden3d) {
    const dt = Math.min(0.1, Math.max(1 / 120, time - renderedAt));
    renderedAt = time;
    garden3d.draw({
      time,
      dt,
      atmosphere,
      person: walker.person,
      pig: pigWalker.person,
      present: showPerson,
      pigPresent: showPig,
      doorOpen: doorOpen,
      selected,
      reduced,
    });
    if (scene === "room")
      $("weatherStatus").textContent = "窗外的声音隔着一层玻璃。";
    else weatherCaption();
    return;
  }
  if (scene === "room") {
    display.clearRect(0, 0, canvas.width, canvas.height);
    display.imageSmoothingEnabled = false;
    display.save();
    display.translate(-camera.x, -camera.y);
    display.drawImage(base, 0, 0);
    const items = objects().map((o) => ({
      y: o.y - (asset(o.type).furniture ? dimensions(o).h / 2 : 0),
      o,
    }));
    if (showPerson) items.push({ y: walker.person.y, p: walker.person });
    if (showPig) items.push({ y: pigWalker.person.y, pig: pigWalker.person });
    items.sort((a, b) => a.y - b.y);
    for (const item of items)
      if (item.o) paintObject(display, item.o, time, item.o.id === selected);
      else if (item.p) paintPerson(display, item.p, time);
      else paintPig(display, item.pig, time);
    display.restore();
    $("weatherStatus").textContent = "窗外的声音隔着一层玻璃。";
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  display.imageSmoothingEnabled = false;
  paintSky(
    display,
    { x: 0, y: 0, w: canvas.width, h: canvas.height },
    atmosphere,
    time,
    { reduced },
  );
  ctx.drawImage(backdrop, 0, 0);
  paintDistanceFog(ctx, canvas.width, canvas.height, atmosphere);
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  ctx.drawImage(base, 0, 0);
  paintWetRoof(ctx, SCENES[scene].points, atmosphere, time, {
    objects: objects(),
    reflect: (c, o) => paintObject(c, o, time),
  });
  paintSunShadows(
    ctx,
    SCENES[scene].points,
    objects().map((o) => ({
      ...o,
      width: asset(o.type).w,
      height: asset(o.type).h,
    })),
    atmosphere,
    { scene },
  );
  if (editor && $("grid").checked) {
    ctx.fillStyle = "#747e6338";
    for (let y = 80; y < 470; y += 8)
      for (let x = 136; x < 520; x += 8)
        if (inside(scene, x, y)) ctx.fillRect(x, y, 1, 1);
  }
  const sprites = objects().map((o) => ({
    y: asset(o.type).plant
      ? Math.max(...contactPoints(o).map((p) => p[1]))
      : o.y -
        (asset(o.type).furniture ||
        [
          "shelf",
          "woodshelf",
          "table",
          "bench",
          "sink",
          "basin",
          "terrarium",
          "stool",
        ].includes(o.type)
          ? dimensions(o).h / 2
          : 0),
    object: o,
  }));
  const pig = pigWalker.person;
  if (showPig && !pig.insideShelter) sprites.push({ y: pig.y, pig });
  if (showPerson && !walker.person.insideShelter)
    sprites.push({ y: walker.person.y, person: walker.person });
  sprites.sort((a, b) => a.y - b.y);
  const foreground = foregroundObjects(objects());
  for (const s of sprites)
    if (s.object) {
      paintObject(ctx, s.object, time, s.object.id === selected, atmosphere);
      paintPlantOccluders(ctx, s.object, foreground);
    } else if (s.pig) paintPig(ctx, s.pig, time);
    else paintPerson(ctx, s.person, time);
  if (!editor) paintDoor(ctx, scene, doorOpen);
  ctx.restore();
  paintLighting(ctx, canvas.width, canvas.height, atmosphere, time, { camera });
  display.drawImage(materialFrame, 0, 0);
  display.save();
  display.translate(-camera.x, -camera.y);
  paintObjectLights(display, objects(), asset, atmosphere);
  display.restore();
  display.save();
  display.translate(-camera.x, -camera.y);
  display.beginPath();
  display.rect(
    cityBounds.x - 20,
    cityBounds.y - 20,
    cityBounds.w + 40,
    cityBounds.h + 40,
  );
  SCENES[scene].points.forEach(([x, y], i) =>
    i ? display.lineTo(x, y) : display.moveTo(x, y),
  );
  display.closePath();
  display.clip("evenodd");
  paintCityLights(display, cityBounds, atmosphere.lamps, { scene });
  display.restore();
  paintRain(display, canvas.width, canvas.height, atmosphere, time, {
    reduced,
  });
  paintSeasonalAir(display, canvas.width, canvas.height, atmosphere, time, { reduced });
  weatherCaption();
}
function frame(now) {
  const elapsed = Math.max(0, (now - last) / 1000),
    dt = Math.min(elapsed, 0.1);
  last = now;
  time += dt;
  if (cardFeed) cardFeed.update(time);
  const previousCondition = atmosphere.condition;
  // An editor selection follows wall time even if a slow frame was skipped.
  // Resident physics keep their bounded step above.
  atmosphere = weather.update(editor ? Math.min(elapsed, 2) : dt);
  environmentHud.update(atmosphere);
  if (previousCondition !== atmosphere.condition) syncPresence();
  if (resident && resident.update(dt, activityEnvironment())) {
    showPerson = !hideActors && resident.present;
    syncPresence();
    if (showPerson) walker.arrive();
  }
  if (showPerson) walker.update(dt);
  pigWalker.update(dt * 0.8);
  updateActionCard();
  const drawInterval = garden3d ? (garden3d.interacting ? 16 : 33) : 50;
  if (now - drawAt > drawInterval) {
    drawAt = now;
    flushDrag?.();
    render();
  }
  requestAnimationFrame(frame);
}
if (editor) {
  const switches = document.querySelector(".arrange-controls"),
    note = document.querySelector(".notebook"),
    column = document.createElement("div");
  column.className = "note-column";
  note.before(column);
  column.append(note);
  const inspector = document.querySelector(".inspector"),
    itemControls = document.createElement("section");
  itemControls.className = "item-controls";
  itemControls.setAttribute("aria-label", "所选物件控制");
  itemControls.append(inspector, $("placementControls"));
  note.before(itemControls);
  const placeSwitches = () => {
    if (innerWidth > 900 || (innerWidth >= 700 && innerHeight <= 550)) {
      column.prepend(switches);
    } else {
      const workspace = document.querySelector(".workspace");
      workspace.prepend(switches);
    }
  };
  placeSwitches();
  window.addEventListener("resize", placeSwitches);
}
// Reserve the measured controls and page chrome, including wrapped toolbars.
if (editor) {
  const workspace = document.querySelector(".workspace"),
    wrap = canvas.parentElement,
    layoutRoot = document.querySelector(".editor-layout");
  const fitEditorHeight = () => {
    if (innerWidth <= 900 && !(innerWidth >= 700 && innerHeight <= 550)) {
      workspace.style.removeProperty("--scene-height");
      return;
    }
    const top = document
        .querySelector(".topbar")
        .getBoundingClientRect().bottom,
      padding = getComputedStyle(layoutRoot);
    let occupied =
      top +
      parseFloat(padding.paddingTop) +
      parseFloat(padding.paddingBottom) +
      8;
    for (const child of workspace.children)
      if (child !== wrap) {
        const style = getComputedStyle(child);
        occupied +=
          child.getBoundingClientRect().height +
          parseFloat(style.marginTop) +
          parseFloat(style.marginBottom);
      }
    workspace.style.setProperty(
      "--scene-height",
      Math.max(140, innerHeight - occupied) + "px",
    );
  };
  const sizing = new ResizeObserver(fitEditorHeight);
  for (const el of [document.querySelector(".topbar"), ...workspace.children])
    if (el !== wrap) sizing.observe(el);
  window.addEventListener("resize", fitEditorHeight);
  document.fonts.ready.then(fitEditorHeight);
  fitEditorHeight();
}
if (garden3d) window.addEventListener("resize", fitView);
let cardFeed = null;
rebuild();
if (!editor)
  cardFeed = attachCardFeed(document.querySelector(".corner-cards"), {
    scene: () => scene,
    presence: () => resident,
  });
requestAnimationFrame(frame);
// Read-only runtime state also makes movement and layout behavior inspectable during QA.
window.rooftop = {
  get placementPerformance() {
    return { ...dragPerformance, pending: !!drag?.pending };
  },
  get weather() {
    return {
      ...weather.state,
      choices: weather.choices,
      elapsed: time,
      reduced,
    };
  },
  get scene() {
    return scene;
  },
  get layout() {
    return structuredClone(layout);
  },
  get person() {
    return { ...walker.person };
  },
  get pig() {
    return { ...pigWalker.person };
  },
  get selected() {
    return selected;
  },
  get presence() {
    return resident
      ? {
          present: resident.present,
          status: resident.status,
          remaining: resident.remaining,
        }
      : null;
  },
  get modelRenderer() {
    return garden3d;
  },
  get graphics() {
    return garden3d?.stats || { controls: "2d-fallback" };
  },
  get camera() {
    return { ...camera };
  },
};

// The first frame has already been submitted before the optional request starts.
requestAnimationFrame(()=>setTimeout(()=>liveWeather.start({isEnabled:()=>weather.choices.condition==='auto',document}),0));
window.addEventListener('pagehide',()=>liveWeather.stop());
window.addEventListener('pageshow',event=>{if(event.persisted)liveWeather.start({isEnabled:()=>weather.choices.condition==='auto',document});});
