const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium, webkit } = require("playwright");
const engine = process.env.BROWSER || "chromium",
  base = process.env.BASE_URL || "http://127.0.0.1:8773";
const selectView = async (page, name) => {
  await page.locator('[data-narrative-view="' + name + '"]').click();
  await page.waitForFunction(id => rooftop.graphics.narrativeView === id, name);
  assert.equal(await page.locator('[data-narrative-view="' + name + '"]').getAttribute("aria-pressed"), "true");
};
const dragView = async (page, dx, dy) => {
  const box = await page.locator("#garden").boundingBox(), x = box.x + box.width * .52, y = box.y + box.height * .5;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
};
const checkBounds = async page => {
  const g = await page.evaluate(() => rooftop.graphics), preset = g.cameraPreset;
  assert.ok(Math.abs(g.wanted.theta) <= preset.yaw + 1e-6);
  assert.ok(Math.abs(g.wanted.phi) <= preset.pitch + 1e-6);
  for (const key of ["walk", "height", "dolly"]) {
    const limits = g.stationTravel.limits;
    assert.ok(g.stationTravel.wanted[key] >= (limits[key + "Min"] ?? -limits[key]) - 1e-6);
    assert.ok(g.stationTravel.wanted[key] <= limits[key] + 1e-6);
  }
  assert.ok(g.wanted.zoom >= g.zoomLimits.min - 1e-6 && g.wanted.zoom <= g.zoomLimits.max + 1e-6);
};
const checkScopeCircle = async (page, label) => {
  // Wait for the actual resized bitmap; the periodic update can be delayed in CI.
  await page.waitForFunction(() => {
    const mask = document.querySelector(".scope-mask"), rect = mask.getBoundingClientRect(),
      scope = document.querySelector(".neighbor-scope").getBoundingClientRect(),
      engraving = document.querySelector(".scope-engraving");
    return mask.width === Math.ceil(rect.width / 2) && mask.height === Math.ceil(rect.height / 2)
      && engraving.width === Math.ceil(scope.width / 2);
  }, null, { timeout: 10000 });
  const lens = await page.evaluate(() => {
    const mask = document.querySelector(".scope-mask"), rect = mask.getBoundingClientRect(),
      scope = document.querySelector(".neighbor-scope").getBoundingClientRect(),
      engraving = document.querySelector(".scope-engraving").getBoundingClientRect(),
      pixels = mask.getContext("2d").getImageData(0, 0, mask.width, mask.height).data;
    const diameter = horizontal => {
      const length = horizontal ? mask.width : mask.height, middle = Math.floor((horizontal ? mask.height : mask.width) / 2);
      let first = length, last = -1;
      for (let i = 0; i < length; i++) {
        const x = horizontal ? i : middle, y = horizontal ? middle : i;
        if (pixels[(y * mask.width + x) * 4 + 3] < 230) { first = Math.min(first, i); last = i; }
      }
      return (last - first + 1) * (horizontal ? rect.width / mask.width : rect.height / mask.height);
    };
    return { horizontal: diameter(true), vertical: diameter(false), scopeWidth: scope.width,
      scopeHeight: scope.height, engravingWidth: engraving.width, engravingHeight: engraving.height,
      maskHeight: rect.height, viewportHeight: innerHeight };
  });
  assert.ok(lens.horizontal > 100, label + " has a visible optical opening");
  assert.ok(Math.abs(lens.horizontal - lens.vertical) <= 4, label + " painted opening stays circular: " + JSON.stringify(lens));
  assert.ok(Math.abs(lens.horizontal - (lens.scopeWidth - 8)) <= 4, label + " mask follows the lens diameter");
  assert.ok(Math.abs(lens.scopeWidth - lens.scopeHeight) <= 1, label + " lens container stays square");
  assert.ok(Math.abs(lens.engravingWidth - lens.engravingHeight) <= 1, label + " reticle pixels have equal horizontal and vertical scale");
  return lens;
};
const checkSavedArrangementIsolation = async browser => {
  // A separate context represents a returning player, without changing the
  // clean-start checks below or any user's running preview.
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } }),
    page = await context.newPage(), errors = [],
    layoutKey = "umwelt-rooftop-layout-v1",
    previewKey = "umwelt-rooftop-game-model-preview-v1";
  page.setDefaultNavigationTimeout(90000);
  page.on("pageerror", error => errors.push(error.message));
  const ready = async url => {
    await page.goto(url);
    await page.waitForFunction(() => rooftop.graphics?.drawCalls > 0 && rooftop.graphics.background.loaded, null, { timeout: 90000 });
  };
  try {
    await ready(base + "/rooftop/?scene=north");
    const fixture = await page.evaluate(async () => {
      const { initialLayout, validateLayout } = await import("/rooftop/scene.mjs"),
        saved = validateLayout(initialLayout());
      // Distinct saved IDs prove that the editor actually loads storage,
      // rather than coincidentally matching its default arrangement.
      for (const [scene, objects] of Object.entries(saved.scenes)) {
        const ids = new Map(objects.map((object, index) => [object.id, "saved-" + scene + "-" + index]));
        for (const object of objects) {
          object.id = ids.get(object.id);
          if (object.support) object.support.id = ids.get(object.support.id);
        }
      }
      return validateLayout(saved);
    });
    assert.ok(fixture.scenes.north.length > 0 && fixture.scenes.south.length > 0, "the regression starts with valid furnished terraces");
    const raw = JSON.stringify(fixture, null, 2);
    await page.evaluate(({ layoutKey, previewKey, raw }) => {
      localStorage.setItem(layoutKey, raw);
      sessionStorage.setItem(previewKey, raw);
    }, { layoutKey, previewKey, raw });
    const checkStorage = async () => {
      const stored = await page.evaluate(({ layoutKey, previewKey }) => ({
        local: localStorage.getItem(layoutKey), preview: sessionStorage.getItem(previewKey),
      }), { layoutKey, previewKey });
      assert.equal(stored.local, raw, "empty observation never rewrites the saved local arrangement");
      assert.equal(stored.preview, raw, "empty observation never rewrites the saved preview arrangement");
    };
    for (const stage of ["", "&stage=game-model"]) for (const scene of ["north", "south"]) {
      await ready(`${base}/rooftop/?scene=${scene}&layout=local${stage}`);
      const shown = await page.evaluate(() => rooftop.layout);
      assert.deepEqual(shown.scenes.north, [], "old layout=local links still show an empty north terrace");
      assert.deepEqual(shown.scenes.south, [], "old layout=local links still show an empty south terrace");
      assert.deepEqual(shown.scenes.room, fixture.scenes.room, "clearing the terrace view preserves the stored room");
      assert.equal(await page.evaluate(() => rooftop.graphics.objects), 0);
      assert.deepEqual(await page.evaluate(() => rooftop.graphics.modelIds), []);
      await checkStorage();
    }
    for (const scene of ["north", "south"]) {
      await ready(`${base}/rooftop/arrange/?scene=${scene}`);
      assert.deepEqual(await page.evaluate(() => rooftop.layout), fixture, "the garage retains the player's original arrangement");
      assert.equal(await page.evaluate(() => rooftop.graphics.objects), fixture.scenes[scene].length);
      await checkStorage();
    }
    assert.deepEqual(errors, []);
    console.log(engine + " saved arrangement: north/south layout=local and game-model previews remain empty, storage bytes unchanged, garage still loads saved furnishings passed");
  } finally { await context.close(); }
};
(async () => {
  const browser = await (engine === "webkit" ? webkit : chromium).launch({
    headless: true,
    ...(engine === "chromium" ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } : {}),
  });
  let page;
  const errors = [], output = process.env.QA_OUTPUT || "/tmp/rooftop-observation";
  try {
    await checkSavedArrangementIsolation(browser);
    if (process.env.QA_SAVED_LAYOUT_ONLY === "1") return;
    await fs.mkdir(output, { recursive: true });
    page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultNavigationTimeout(90000);
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", message => { if (message.type() === "error" && /THREE.WebGLProgram|Shader Error/.test(message.text())) errors.push(message.text()); });
    for (const scene of ["north", "south"]) {
      await page.goto(`${base}/rooftop/?scene=${scene}&weather=rain&time=afternoon&season=autumn`);
      await page.waitForFunction(() => rooftop.graphics?.drawCalls > 0 && rooftop.graphics.background.loaded, null, { timeout: 90000 });
      await page.evaluate(() => {
        window.observationEvents = [];
        for (const type of ["pointerdown", "pointerup", "click", "keydown"])
          document.addEventListener(type, event => {
            observationEvents.push({ type, id: event.target.id, key: event.key });
            if (observationEvents.length > 12) observationEvents.shift();
          }, true);
      });
      const original = await page.evaluate(() => rooftop.layout);
      assert.deepEqual(original.scenes.north, []);
      assert.deepEqual(original.scenes.south, []);
      assert.equal(await page.evaluate(() => rooftop.graphics.objects), 0);
      assert.deepEqual(await page.evaluate(() => rooftop.graphics.modelIds), []);
      assert.equal(await page.evaluate(() => rooftop.graphics.actorsHidden), true);
      assert.deepEqual(await page.evaluate(() => rooftop.graphics.actorVisibility), { person: false, pig: false });
      assert.equal(await page.evaluate(() => rooftop.graphics.projection), "perspective");
      assert.deepEqual(await page.evaluate(() => rooftop.graphics.visibleTerraces), [scene]);
      assert.equal(await page.locator("#sceneDoor").isVisible(), false);
      assert.equal(await page.getByRole("button", { name: "转动画面", exact: true }).isVisible(), false);
      assert.equal(await page.getByRole("button", { name: "移动画面", exact: true }).isVisible(), false);
      assert.equal(await page.getByRole("button", { name: "复位画面", exact: true }).isVisible(), false);
      assert.equal(await page.locator("#reviewFreeCamera").count(), 0);

      // A drag changes the bird's station without the invisible door stealing it.
      const bird = await page.evaluate(() => rooftop.graphics.stationTravel.wanted.walk);
      await dragView(page, 90, 15);
      await page.waitForFunction(walk => rooftop.graphics.stationTravel.wanted.walk < walk - .5, bird);
      assert.equal(await page.evaluate(() => rooftop.scene), scene);
      await page.locator("#garden").focus();
      await page.keyboard.press("+");
      await page.mouse.wheel(0, -130);
      assert.equal(await page.evaluate(() => rooftop.graphics.wanted.zoom), 1, "bird uses its fixed wide-angle lens");
      for (let i = 0; i < 12; i++) await page.keyboard.press("ArrowRight");
      await checkBounds(page);
      await page.locator('[data-station-action="left"]').click();
      await checkBounds(page);

      await selectView(page, "drone");
      const drone = await page.evaluate(() => ({ eye: rooftop.graphics.cameraPreset.pose.eye, theta: rooftop.graphics.wanted.theta }));
      await dragView(page, -45, 20);
      await page.waitForFunction(theta => Math.abs(rooftop.graphics.wanted.theta - theta) > .01, drone.theta);
      await page.locator('[data-station-action="down"]').click();
      await page.locator('[data-station-action="near"]').click();
      await page.waitForFunction(eye => Math.hypot(...rooftop.graphics.cameraPreset.pose.eye.map((value, i) => value - eye[i])) > .1, drone.eye);
      assert.equal(await page.evaluate(() => rooftop.graphics.wanted.zoom), 1, "drone moves physically, without arbitrary optical zoom");
      await checkBounds(page);
      assert.equal(await page.locator(".neighbor-scope").isVisible(), false);

      await selectView(page, "neighbor");
      assert.equal(await page.locator(".neighbor-scope").isVisible(), true);
      const neighbor = await page.evaluate(() => ({ eye: rooftop.graphics.cameraPreset.pose.eye, target: rooftop.graphics.target, zoom: rooftop.graphics.wanted.zoom }));
      await dragView(page, -35, 12);
      await page.waitForFunction(target => Math.hypot(...rooftop.graphics.target.map((value, i) => value - target[i])) > .05, neighbor.target);
      assert.deepEqual(await page.evaluate(() => rooftop.graphics.cameraPreset.pose.eye), neighbor.eye, "the observer remains at one real station");
      await page.locator('[data-station-action="in"]').click();
      await page.waitForFunction(zoom => rooftop.graphics.wanted.zoom > zoom, neighbor.zoom);
      await page.waitForFunction(() => document.querySelector("[data-scope-zoom]").textContent.includes("×") && !document.querySelector("[data-scope-zoom]").textContent.includes("—"));
      const reading = await page.evaluate(() => rooftop.modelRenderer.scopeReading);
      assert.ok(reading.magnification > 0 && reading.mradPixels > 0);
      assert.ok(Number.isFinite(reading.inclinationDegrees));
      if (reading.measuredSurface) assert.ok(reading.distanceMetres > 0);
      assert.ok(await page.evaluate(() => rooftop.graphics.scopeLens.passes > 0));
      await checkBounds(page);
      assert.deepEqual(await page.evaluate(() => rooftop.layout), original, "all three view controls preserve placements and stored room data");

      // Empty terraces still expose the preserved botanical, antique and weapon database.
      await page.locator("#notebookOpen").click();
      await page.locator(".observation-notebook").waitFor({ state: "visible" });
      await page.waitForTimeout(650);
      assert.equal(await page.locator(".observation-notebook").isVisible(), true, "an earlier canvas hover timer cannot close the pinned journal");
      assert.equal(await page.locator("#reviewEntry option").count(), 304);
      for (const id of ["mint", "vessel-antique-shino", "weapon-arisaka-38"]) {
        await page.locator("#reviewEntry").selectOption(id);
        await page.locator(".observation-notebook").waitFor({ state: "visible" });
        console.log(engine + " " + scene + " notebook " + id);
        assert.ok((await page.locator("#noteShape").innerText()).length > 5);
        assert.ok((await page.locator("#noteComment").innerText()).length > 5);
        await page.locator(".notebook details summary").click();
        assert.ok(await page.locator("#noteSources a").count(), id + " keeps its source records");
        await page.locator(".notebook details summary").click();
      }
      await page.locator("#notebookClose").click();
      assert.equal(await page.locator(".observation-notebook").isVisible(), false);
      assert.deepEqual(await page.evaluate(() => rooftop.layout), original);

      // Actors are visually hidden, while their existing rain shelter/actions and time keep running.
      const elapsed = await page.evaluate(() => rooftop.weather.elapsed);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(t => rooftop.weather.elapsed > t + .25 && rooftop.weather.reduced, elapsed);
      await page.waitForFunction(() => rooftop.person.sheltered && rooftop.pig.sheltered, null, { timeout: 180000 });
      assert.doesNotMatch(await page.locator("#actionStatus").textContent(), /浇水/);
      const weather = await page.evaluate(() => rooftop.weather);
      assert.equal(weather.choices.condition, "rain");
      assert.equal(weather.choices.phase, "afternoon");
      assert.equal(weather.choices.season, "autumn");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.waitForFunction(() => !rooftop.weather.reduced);
      const next = scene === "north" ? "south" : "north";
      await page.locator("#sceneCard").click();
      await page.waitForFunction(name => rooftop.scene === name && rooftop.graphics.scene === name, next);
      assert.equal(new URL(page.url()).searchParams.get("scene"), next);
      assert.equal(new URL(page.url()).searchParams.get("weather"), "rain");
      assert.deepEqual(await page.evaluate(() => rooftop.layout), original);
      await page.screenshot({ path: output + "/observation-" + scene + "-" + engine + ".png" });
    }
    await page.close();
    page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    page.setDefaultNavigationTimeout(90000);
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(base + "/rooftop/?scene=south&weather=heavy&season=winter&time=night");
    await page.waitForFunction(() => rooftop.graphics?.drawCalls > 0 && rooftop.graphics.background.loaded, null, { timeout: 90000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const initialPhoneLayout = await page.evaluate(() => rooftop.layout);
    if (engine === "chromium") {
      const touch = await page.context().newCDPSession(page);
      const gesture = async (points, end) => {
        await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points });
        for (let i = 1; i <= 6; i++) await touch.send("Input.dispatchTouchEvent", {
          type: "touchMove", touchPoints: points.map((p, j) => ({ ...p, x: p.x + (end[j].x - p.x) * i / 6, y: p.y + (end[j].y - p.y) * i / 6 })),
        });
        await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      };
      const walk = await page.evaluate(() => rooftop.graphics.stationTravel.wanted.walk);
      await gesture([{ x: 230, y: 400, id: 1 }], [{ x: 190, y: 415 }]);
      assert.ok(Math.abs((await page.evaluate(() => rooftop.graphics.stationTravel.wanted.walk)) - walk) > .4, "one finger walks along the eave");
      assert.equal(await page.evaluate(() => rooftop.scene), "south");
      await selectView(page, "neighbor");
      const before = await page.evaluate(() => rooftop.graphics.wanted);
      await gesture([{ x: 120, y: 350, id: 1 }, { x: 260, y: 350, id: 2 }], [{ x: 90, y: 345 }, { x: 290, y: 355 }]);
      assert.ok((await page.evaluate(() => rooftop.graphics.wanted.zoom)) > before.zoom + .1, "two fingers adjust scope magnification");
      assert.equal(await page.evaluate(() => rooftop.graphics.wanted.theta), before.theta, "scope station and head stay fixed during pinch");
      await touch.detach();
    } else {
      await selectView(page, "neighbor");
      const button = await page.locator('[data-station-action="in"]').boundingBox(), before = await page.evaluate(() => rooftop.graphics.wanted.zoom);
      await page.touchscreen.tap(button.x + button.width / 2, button.y + button.height / 2);
      assert.ok((await page.evaluate(() => rooftop.graphics.wanted.zoom)) > before);
    }
    await checkBounds(page);
    assert.deepEqual(await page.evaluate(() => rooftop.layout), initialPhoneLayout);
    for (const viewport of [{ width: 390, height: 640 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await checkScopeCircle(page, `${engine} ${viewport.width}x${viewport.height}`);
    }
    await page.setViewportSize({ width: 390, height: 640 });
    // Safari can display a 100vh canvas taller than innerHeight while its bars
    // are open. The bitmap must use its displayed size, including this mismatch.
    await page.locator(".scope-mask").evaluate(mask => { mask.style.height = (innerHeight + 180) + "px"; });
    const mismatched = await checkScopeCircle(page, engine + " browser-bar viewport mismatch");
    assert.ok(mismatched.maskHeight > mismatched.viewportHeight + 170, "the regression actually exercises unequal viewport and canvas heights");
    await page.locator(".scope-mask").evaluate(mask => { mask.style.height = ""; });
    await page.setViewportSize({ width: 390, height: 844 });
    await checkScopeCircle(page, engine + " restored phone viewport");
    await page.locator("#notebookOpen").click();
    await page.locator("#reviewEntry").selectOption("mint");
    const note = await page.locator(".observation-notebook").boundingBox();
    assert.ok(note.width <= 260 && note.x >= 0 && note.x + note.width <= 391, "phone notebook fits without widening the page");
    await page.getByRole("button", { name: "合上手帐", exact: true }).click();
    await page.locator("#sceneCard").click();
    await page.waitForFunction(() => rooftop.scene === "north");
    await page.screenshot({ path: output + "/observation-phone-" + engine + ".png" });
    assert.deepEqual(errors, []);
    console.log(engine + " observation: empty north/south, bounded three-view controls, circular portrait/landscape scope and browser-bar viewport mismatch, touch, preserved database, weather/actions/time and hidden actors passed");
  } catch (error) {
    if (page) {
      console.error("observation state", JSON.stringify(await page.evaluate(() => ({ scene: rooftop.scene, view: rooftop.graphics?.view, wanted: rooftop.graphics?.wanted, observer: rooftop.graphics?.narrativeView, station: rooftop.graphics?.stationTravel, notebook: { hidden: document.querySelector(".notebook").hidden, bodyHidden: document.querySelector("#notebookBody").hidden, entry: document.querySelector("#reviewEntry").value, expanded: document.querySelector("#notebookOpen").getAttribute("aria-expanded"), events: window.observationEvents } })).catch(() => "page unavailable")));
      await fs.mkdir(output, { recursive: true });
      await page.screenshot({ path: output + "/failure-" + engine + ".png" }).catch(() => {});
    }
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
