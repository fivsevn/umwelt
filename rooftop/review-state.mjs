import { NARRATIVE_VIEWS } from "./3d/story-camera.mjs";
import { canonicalWeatherCondition } from "./weather-condition.mjs";

export const REVIEW_VIEWS = Object.freeze([
  { id: "terrace", label: "天台" },
  { id: "row", label: "楼排" },
  { id: "outlook", label: "远处" },
  ...NARRATIVE_VIEWS,
]);

export function reviewState(search) {
  const query = new URLSearchParams(search);
  const legacyGameModel = query.get("stage") === "game-model";
  const active = query.get("stage") === "background" || legacyGameModel || query.get("test") === "1";
  const view = query.get("view");
  return {
    active,
    legacyGameModel,
    scene: ["south", "room"].includes(query.get("scene")) ? query.get("scene") : "north",
    sampling: query.get("sampling") === "game" ? "game" : "source",
    view: REVIEW_VIEWS.some(({ id }) => id === view) ? view : legacyGameModel ? "bird" : "terrace",
  };
}

export function reviewURL(address, choices = {}) {
  const url = new URL(address);
  const state = reviewState(url.search);
  url.searchParams.set("stage", "background");
  url.searchParams.delete("test");
  url.searchParams.delete("layout");
  url.searchParams.set("scene", choices.scene || state.scene);
  url.searchParams.set("view", choices.view || state.view);
  url.searchParams.set("sampling", choices.sampling || state.sampling);
  for (const [key, parameter] of [["condition", "weather"], ["phase", "time"], ["season", "season"]]) {
    const value = choices[key] || url.searchParams.get(parameter);
    if (value) url.searchParams.set(parameter, key === "condition" ? canonicalWeatherCondition(value) : value);
  }
  return url;
}

// Scene inspection never consumes the player's or the item editor's layout.
export function emptyReviewLayout(value, { room = false } = {}) {
  return { ...value, scenes: { ...value.scenes, north: [], south: [], ...(room ? { room: [] } : {}) } };
}
