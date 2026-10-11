import { OBSERVER_MESSAGES } from "./observer-ui.mjs";
// New and updated cards enter at the top; hidden cards reserve no space.
export function attachCardFeed(root, { scene, presence }) {
  const schedule = [
    ["weatherCard", 0.4],
    ["actionCard", 1],
    ["garageCard", 2],
    ["musicToggle", 5],
    ["returnWorld", 8.2],
    ["roomCard", 11.5],
    ["dongdongStatus", 1.2],
    ["observerStatus", 0],
  ]
    .map(([id, at]) => ({ el: root.querySelector(`#${id}`), at }))
    .filter(({ el }) => el);
  const homeCards = new Set(["garageCard", "roomCard"]);
  const content = new Map();
  const appeared = new Set();
  let wasPresent = presence().present;
  let returnUntil = 0;
  let returnedAt = null;
  let observerEvent = null;
  for (const { el } of schedule) el.hidden = true;

  function update(elapsed) {
    const resident = presence();
    const arrived = resident.present && !wasPresent;
    const departed = !resident.present && wasPresent;
    if (arrived) {
      returnUntil = elapsed + 7;
      returnedAt = elapsed;
    }
    if (departed) {
      returnUntil = 0;
      returnedAt = null;
    }
    wasPresent = resident.present;
    const status = schedule.find(({ el }) => el.id === "dongdongStatus").el;
    const statusText = resident.present ? "东东回来了。" : resident.status;
    if (status.textContent !== statusText) status.textContent = statusText;
    const arrivals = [];
    for (const { el, at } of schedule) {
      let due = at;
      let eligible = elapsed >= at;
      if (homeCards.has(el.id)) {
        due =
          returnedAt === null
            ? at
            : returnedAt + (el.id === "garageCard" ? 0.8 : 2);
        eligible = resident.present && elapsed >= due;
      }
      if (el.id === "returnWorld") eligible = eligible && scene() === "north";
      if (el.id === "observerStatus") {
        eligible = Boolean(observerEvent);
        due = observerEvent?.at || 0;
      }
      if (el.id === "dongdongStatus") {
        eligible = resident.present
          ? elapsed < returnUntil
          : eligible || departed;
        if (arrived || departed) due = elapsed;
      }
      // Include nested weather text and navigation destinations in card updates.
      const nextContent = JSON.stringify([
        el.textContent,
        el.getAttribute("href"),
        el.id === "observerStatus" ? observerEvent?.revision : null,
      ]);
      const revised = content.has(el) && content.get(el) !== nextContent;
      content.set(el, nextContent);
      if (!eligible) {
        el.hidden = true;
        el.classList.remove("feed-enter");
      } else if (el.hidden || revised) {
        arrivals.push({ el, at: appeared.has(el) ? elapsed : due });
      }
    }
    // Preserve event order even when one frame crosses several initial reveal times.
    arrivals.sort((a, b) => a.at - b.at);
    for (const { el } of arrivals) {
      el.hidden = true;
      el.classList.remove("feed-enter");
      el.remove();
      root.prepend(el);
      el.hidden = false;
      void el.offsetWidth;
      el.classList.add("feed-enter");
      appeared.add(el);
    }
  }
  return { update, notifyObserver(view, elapsed) {
    const text = OBSERVER_MESSAGES[view], el = root.querySelector("#observerStatus");
    if (!text || !el) return false;
    observerEvent = { at: elapsed, revision: (observerEvent?.revision || 0) + 1 };
    el.textContent = text;
    update(elapsed);
    return true;
  } };
}
