// Run against prepare-site + subset-font + stamp-assets output, never the source server.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium, webkit } = require("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:8794";
const output = process.env.QA_OUTPUT || "/tmp/umwelt-artifact-screenshots";
const legacyReviewRoutes = new Map([
  ["/rooftop/3d/?scene=south&weather=rain&time=dusk&season=autumn&layout=local", "bird"],
  ["/rooftop/previews/pixel-01/?scene=north&weather=clear&time=day&season=spring&layout=local", "terrace"],
]);
const routes = [
  ["/", ".desktop-icon"],
  ["/tick/", "#tick"],
  ["/isopoda/", "#startBtn"],
  ["/isopoda/morphology/", ".anatomy-app"],
  ["/isopoda/habitat.html", "#assetList button"],
  ["/rooftop/?scene=north", "#garden"],
  ["/rooftop/?scene=south", "#garden"],
  ...[...legacyReviewRoutes.keys()].map((route) => [route, "#garden"]),
  ["/rooftop/arrange/", "[data-asset=mint]"],
  ["/rooftop/room/", "canvas"],
];
(async () => {
  await fs.mkdir(output, { recursive: true });
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch({
      headless: true,
      ...(engine === chromium
        ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }
        : {}),
    });
    try {
      const context = await browser.newContext();
      for (const width of [1440, 390]) {
        for (const [index, [route, selector]] of routes.entries()) {
          // Isolate each document's errors while retaining browser cache/storage.
          // Closing a prior page can cancel its lazy thumbnail requests; those
          // cancellations must not be attributed to the next document.
          const page = await context.newPage();
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          page.on("requestfailed", (request) =>
            errors.push(request.url() + ": " + request.failure()?.errorText),
          );
          page.on("response", (response) => {
            if (response.status() >= 400)
              errors.push(response.status() + " " + response.url());
          });
          await page.setViewportSize({ width, height: 900 });
          const startedAt = Date.now();
          console.log(`${engine.name()} ${width} ${route}: checking`);
          // Software WebGL compiles the terrace's materials at first entry.
          // Keep the normal load check, with a larger budget for these routes.
          const response = await page.goto(
            base + route,
            route.startsWith("/rooftop/") ? { timeout: 90000 } : {},
          );
          assert.ok(
            response.ok() || response.status() === 304,
            route + " document status " + response.status(),
          );
          await page.locator(selector).first().waitFor({ state: "visible" });
          await page.evaluate(() => document.fonts.ready);
          if (
            engine === chromium &&
            route.startsWith("/rooftop/") &&
            !legacyReviewRoutes.has(route)
          ) {
            await page.waitForFunction(
              () =>
                window.rooftop?.graphics?.drawCalls > 0 ||
                window.room?.graphics?.drawCalls > 0,
              null,
              { timeout: 90000 },
            );
            if (route.includes("room/")) {
              await page.waitForFunction(() => window.room?.graphics?.roomBackground?.loaded, null, { timeout: 90000 });
              assert.equal(await page.locator("canvas").getAttribute("data-room-door-parts"), "14");
              assert.equal(await page.locator("canvas").getAttribute("data-room-background-error"), null);
            }
            const graphics = await page.evaluate(
              () => window.rooftop?.graphics || window.room.graphics,
            );
            assert.equal(graphics.catalog, 294);
            assert.ok(graphics.drawCalls > 0);
            assert.equal(graphics.raster.enabled, true, "formal room, garage and observation use game sampling");
            assert.ok(graphics.raster.pixelStep >= 2, "formal pages retain visible grain");
            assert.equal(
              graphics.controls,
              route.includes("arrange")
                ? "edit"
                : route.includes("room")
                  ? "orbit"
                  : "pan",
            );
          }
          if (route.startsWith("/rooftop/?")) {
            // Public game entries retain their empty terrace and narrative controls.
            // A door behind a real wall/roof must not intercept view gestures.
            const publicState = await page.evaluate(() => ({
              layout: rooftop.layout,
              scene: rooftop.scene,
              graphics: rooftop.graphics,
            }));
            assert.deepEqual(publicState.layout.scenes.north, []);
            assert.deepEqual(publicState.layout.scenes.south, []);
            if (publicState.graphics.drawCalls) {
              assert.equal(publicState.graphics.narrativeView, "bird");
              assert.equal(publicState.graphics.actorsHidden, true);
              assert.deepEqual(publicState.graphics.actorVisibility, { person: false, pig: false });
              await page.waitForFunction(() => rooftop.graphics.background.loaded);
              assert.equal(await page.locator("#sceneDoor").isVisible(), false,
                "the bird's real eave view does not expose the door behind it");
              for (const view of ["drone", "neighbor", "bird"]) {
                await page.locator('[data-narrative-view="' + view + '"]').click();
                await page.waitForFunction(name => rooftop.graphics.narrativeView === name, view);
                assert.equal(await page.locator('[data-narrative-view="' + view + '"]').getAttribute("aria-pressed"), "true");
              }
            }
            const nextScene = publicState.scene === "north" ? "south" : "north";
            await page.locator("#sceneCard").click();
            await page.waitForFunction(name => rooftop.scene === name, nextScene);
            if (publicState.graphics.drawCalls) {
              await page.waitForFunction(name => rooftop.graphics.scene === name, nextScene);
              assert.equal(await page.evaluate(() => rooftop.graphics.narrativeView), "bird");
            }
            assert.equal(new URL(page.url()).searchParams.get("scene"), nextScene);
            assert.deepEqual(await page.evaluate(() => rooftop.layout), publicState.layout,
              "view/scene controls preserve layout data");
          }
          if (legacyReviewRoutes.has(route)) {
            const redirected = new URL(page.url());
            const original = new URL(route, base);
            assert.equal(redirected.pathname, "/rooftop/");
            assert.equal(redirected.searchParams.get("stage"), "background");
            assert.equal(redirected.searchParams.get("view"), legacyReviewRoutes.get(route));
            assert.equal(redirected.searchParams.has("layout"), false);
            for (const key of ["scene", "weather", "time", "season"])
              assert.equal(redirected.searchParams.get(key), original.searchParams.get(key));
            await page.waitForFunction(
              () =>
                window.rooftop?.graphics?.drawCalls > 0 ||
                document.querySelector('[role="alert"]'),
              null,
              { timeout: 90000 },
            );
            const rendered = await page.evaluate(() =>
              Boolean(window.rooftop?.graphics?.drawCalls),
            );
            if (engine === chromium)
              assert.ok(rendered, "3D must render with software WebGL");
            if (rendered) {
              const initial = await page.evaluate(() => ({ scene: rooftop.scene, layout: rooftop.layout }));
              assert.equal(initial.scene, original.searchParams.get("scene"));
              assert.deepEqual(initial.layout.scenes.north, []);
              assert.deepEqual(initial.layout.scenes.south, []);
              const view = page.getByRole("combobox", { name: "测试视角", exact: true });
              assert.deepEqual(await view.locator("option").evaluateAll((options) => options.map((option) => option.value)),
                ["terrace", "row", "outlook", "bird", "drone", "neighbor"]);
              assert.equal(await view.inputValue(), legacyReviewRoutes.get(route));
              await view.selectOption("row");
              await view.selectOption("outlook");
              await view.selectOption("terrace");
              const scene = page.getByRole("combobox", { name: "测试场景", exact: true });
              await scene.selectOption("south");
              await page.waitForFunction(
                () => rooftop.scene === "south",
              );
              await scene.selectOption("north");
              await page.waitForFunction(
                () => rooftop.scene === "north",
              );
              assert.deepEqual(await page.evaluate(() => [rooftop.layout.scenes.north, rooftop.layout.scenes.south]), [[], []]);
            }
          }
          await page.waitForTimeout(250);
          if (process.env.EXPECTED_SHA) {
            const urls = await page
              .locator("script[src],link[rel=stylesheet]")
              .evaluateAll((elements) => elements.map((e) => e.src || e.href));
            assert.ok(urls.length, route + " runtime assets");
            for (const url of urls)
              assert.equal(
                new URL(url).searchParams.get("v"),
                process.env.EXPECTED_SHA,
                route + " deployed version",
              );
          }
          await page.screenshot({
            path: `${output}/${engine.name()}-${width}-${index}.png`,
            fullPage: true,
          });
          assert.deepEqual(
            errors,
            [],
            engine.name() + " " + route + " runtime/resource errors",
          );
          console.log(
            `${engine.name()} ${width} ${route}: passed in ${Date.now() - startedAt}ms`,
          );
          await page.close();
        }
      }
      console.log(engine.name() + ": " + routes.length * 2 + " final artifact entry checks passed");
    } finally {
      await browser.close();
    }
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
