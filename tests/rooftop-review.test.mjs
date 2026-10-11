import test from "node:test";
import assert from "node:assert/strict";
import { REVIEW_VIEWS, reviewState, reviewURL, emptyReviewLayout } from "../rooftop/review-state.mjs";

test('the consolidated preview canonicalizes cloudy links and explicit legacy choices', () => {
  for (const choice of [undefined, 'cloudy', 'overcast']) {
    const url = reviewURL('http://localhost/rooftop/?stage=background&weather=cloudy&time=afternoon&season=autumn&scene=south&view=drone', choice ? { condition: choice } : {});
    assert.equal(url.searchParams.get('weather'), 'overcast');
    assert.equal(url.searchParams.get('time'), 'afternoon');
    assert.equal(url.searchParams.get('season'), 'autumn');
    assert.equal(url.searchParams.get('scene'), 'south');
    assert.equal(url.searchParams.get('view'), 'drone');
  }
});

test("all scene inspection aliases converge on one entry with the selected environment", () => {
  for (const query of ["stage=background", "stage=game-model", "test=1"]) {
    const url = reviewURL("http://localhost/rooftop/?" + query + "&scene=south&weather=rain&time=dusk&season=autumn&layout=local");
    assert.equal(url.pathname, "/rooftop/");
    assert.equal(url.searchParams.get("stage"), "background");
    assert.equal(url.searchParams.get("scene"), "south");
    assert.equal(url.searchParams.get("weather"), "rain");
    assert.equal(url.searchParams.get("time"), "dusk");
    assert.equal(url.searchParams.get("season"), "autumn");
    assert.equal(url.searchParams.has("test"), false);
    assert.equal(url.searchParams.has("layout"), false);
    assert.equal(reviewState(url.search).active, true);
  }
});

test("six real camera selections and environment changes survive a reload URL", () => {
  assert.deepEqual(REVIEW_VIEWS.map(({ id }) => id), ["terrace", "row", "outlook", "bird", "drone", "neighbor"]);
  for (const { id } of REVIEW_VIEWS) {
    const url = reviewURL("http://localhost/rooftop/?stage=background", {
      view: id, scene: "south", condition: "mist", phase: "afternoon", season: "winter",
    });
    assert.equal(reviewState(url.search).view, id);
    assert.equal(reviewState(url.search).scene, "south");
    assert.equal(url.searchParams.get("weather"), "mist");
    assert.equal(url.searchParams.get("time"), "afternoon");
    assert.equal(url.searchParams.get("season"), "winter");
  }
  assert.equal(reviewState("?stage=game-model").view, "bird");
  assert.equal(reviewState("?stage=background&view=unknown").view, "terrace");
  assert.equal(reviewState("?scene=south").active, false);
});

test("empty inspection cannot restore items or modify an existing saved arrangement", () => {
  const saved = { version: 2, roomVersion: 2, spaceVersion: 1, scenes: {
    north: [{ id: "rack", type: "metal-rack" }, { id: "pot", support: { id: "rack", surface: "top" } }],
    south: [{ id: "plant", type: "mint" }], room: [{ id: "chair" }],
  } };
  const bytes = JSON.stringify(saved);
  const empty = emptyReviewLayout(saved);
  assert.deepEqual(empty.scenes.north, []);
  assert.deepEqual(empty.scenes.south, []);
  assert.deepEqual(empty.scenes.room, saved.scenes.room);
  assert.equal(empty.roomVersion, 2);
  assert.equal(empty.spaceVersion, 1);
  assert.equal(JSON.stringify(saved), bytes);
  assert.deepEqual(emptyReviewLayout(empty), empty);
});
