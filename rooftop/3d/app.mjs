import { SCENES, DOORS, initialLayout, makeWalker } from "../scene.mjs";
import { WEATHER, timeOfDay, makeWeather } from "../weather.mjs";
import { makeResident } from "../resident.mjs";
import { attachGardenMusic } from "../music.mjs";
import { attachCardFeed } from "../card-feed.mjs";
import { createGardenRenderer } from "./scene3d.mjs";

const $ = (id) => document.getElementById(id),
  canvas = $("garden");
const layout = initialLayout();
let scene =
  new URLSearchParams(location.search).get("scene") === "south"
    ? "south"
    : "north";
let walker,
  pigWalker,
  doorOpen = false;
const resident = makeResident(Math.random, {
  phase: () => timeOfDay(new Date().getHours() + new Date().getMinutes() / 60),
});
const weather = makeWeather({
  condition: WEATHER[Math.floor(Math.random() * WEATHER.length)].id,
  phase: "auto",
});
let atmosphere = weather.state,
  weatherAge = 0,
  time = 0,
  last = performance.now(),
  drawAt = 0;
let reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
  "change",
  (e) => (reduced = e.matches),
);
attachGardenMusic($("musicToggle"));
let garden;
try {
  garden = createGardenRenderer(canvas, layout, $("sceneDoor"));
} catch (error) {
  const note = document.createElement("aside");
  note.className = "world-card";
  note.setAttribute("role", "alert");
  note.textContent = "立体阳台暂时无法显示。";
  const link = document.createElement("a");
  link.href = "../";
  link.textContent = "回到花农时代";
  note.append(" ", link);
  document.querySelector(".corner-cards").append(note);
  console.error(error);
}
function syncPresence() {
  $("roomCard").href = "../room/?scene=" + scene;
  $("garageCard").href = "../arrange/?scene=" + scene;
  if (!resident.present) $("dongdongStatus").textContent = resident.status;
  canvas.setAttribute(
    "aria-label",
    SCENES[scene].name +
      "，" +
      (resident.present ? "东东正在照料植物" : resident.status),
  );
}
function rebuild() {
  walker = makeWalker(scene, () => layout.scenes[scene]);
  pigWalker = makeWalker(scene, () => layout.scenes[scene], { visits: 7 });
  walker.randomize();
  pigWalker.randomize();
  doorOpen = false;
  garden?.setScene(scene);
  $("sceneDoor").ariaLabel = DOORS[scene].label;
  $("sceneDoor").title = DOORS[scene].label;
  syncPresence();
}
$("sceneDoor").onclick = () => {
  scene = scene === "north" ? "south" : "north";
  history.pushState(null, "", "?scene=" + scene);
  rebuild();
};
window.addEventListener("popstate", () => {
  scene =
    new URLSearchParams(location.search).get("scene") === "south"
      ? "south"
      : "north";
  rebuild();
});
for (const event of ["pointerenter", "focus"])
  $("sceneDoor").addEventListener(event, () => (doorOpen = true));
for (const event of ["pointerleave", "blur"])
  $("sceneDoor").addEventListener(event, () => (doorOpen = false));
function weatherCaption() {
  const text =
    atmosphere.phase === "late"
      ? "窗灯渐少，楼群安静下来。"
      : atmosphere.phase === "evening"
        ? "还有几扇窗亮着。"
        : atmosphere.phase === "dawn"
          ? "天亮了，几扇窗还没有熄灯。"
          : atmosphere.phase === "dusk"
            ? "窗灯先于天空亮起来。"
            : {
                clear: "墙角的影子慢慢挪。",
                cloudy: "云影从楼群之间经过。",
                overcast: "光散在叶片上。",
                rain: "雨点落在盆沿和地面。",
                heavy: "水沿修补过的地面流向下水口。",
                wind: "风从楼群之间吹过。",
                mist: "远处的楼房隐在薄雾里。",
              }[atmosphere.condition];
  if ($("weatherStatus").textContent !== text)
    $("weatherStatus").textContent = text;
}
let cardFeed;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  time += dt;
  weatherAge += dt;
  if (weatherAge > 480) {
    weatherAge = 0;
    const options = WEATHER.filter((w) => w.id !== weather.choices.condition);
    weather.set(
      "condition",
      options[Math.floor(Math.random() * options.length)].id,
    );
  }
  atmosphere = weather.update(dt);
  if (resident.update(dt)) {
    syncPresence();
    if (resident.present) walker.arrive();
  }
  if (resident.present) walker.update(dt);
  pigWalker.update(dt * 0.8);
  weatherCaption();
  cardFeed.update(time);
  if (now - drawAt >= 33) {
    const renderDt = (now - drawAt) / 1000;
    drawAt = now;
    garden?.draw({
      time,
      dt: Math.min(renderDt, 0.1),
      atmosphere,
      person: walker.person,
      pig: pigWalker.person,
      present: resident.present,
      doorOpen,
      reduced,
    });
  }
  requestAnimationFrame(frame);
}
rebuild();
cardFeed = attachCardFeed(document.querySelector(".corner-cards"), {
  scene: () => scene,
  presence: () => resident,
});
requestAnimationFrame(frame);
// The same read-only observer state used by the original game's release checks.
window.rooftop = {
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
  get presence() {
    return {
      present: resident.present,
      status: resident.status,
      remaining: resident.remaining,
    };
  },
  get weather() {
    return {
      ...weather.state,
      choices: weather.choices,
      elapsed: time,
      reduced,
    };
  },
  get camera() {
    return garden?.stats.view;
  },
};
Object.defineProperty(window, "rooftop3d", { get: () => garden?.stats });
