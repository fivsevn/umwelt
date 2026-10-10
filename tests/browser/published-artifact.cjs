// Run against prepare-site + subset-font + stamp-assets output, never the source server.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium, webkit } = require("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:8794";
const output = process.env.QA_OUTPUT || "/tmp/umwelt-artifact-screenshots";
const routes = [
  ["/", ".desktop-icon"],
  ["/tick/", "#tick"],
  ["/isopoda/", "#startBtn"],
  ["/isopoda/morphology/", ".anatomy-app"],
  ["/isopoda/habitat.html", "#assetList button"],
  ["/rooftop/?scene=north", "#garden"],
  ["/rooftop/?scene=south", "#garden"],
  ["/rooftop/3d/", "#garden"],
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
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("requestfailed", (request) =>
        errors.push(request.url() + ": " + request.failure()?.errorText),
      );
      page.on("response", (response) => {
        if (response.status() >= 400)
          errors.push(response.status() + " " + response.url());
      });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        for (const [index, [route, selector]] of routes.entries()) {
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
            route.startsWith("/rooftop/")
          ) {
            await page.waitForFunction(
              () =>
                window.rooftop?.graphics?.drawCalls > 0 ||
                window.room?.graphics?.drawCalls > 0,
              null,
              { timeout: 90000 },
            );
            const graphics = await page.evaluate(
              () => window.rooftop?.graphics || window.room.graphics,
            );
            assert.equal(graphics.catalog, 304);
            assert.ok(graphics.instances > 0);
            assert.equal(
              graphics.controls,
              route.includes("arrange")
                ? "edit"
                : route.includes("room")
                  ? "orbit"
                  : "pan",
            );
          }
          if (route === "/rooftop/3d/" || route.startsWith("/rooftop/?")) {
            // The old 3D URL remains a public entry to the same empty terrace.
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
        }
      }
      console.log(engine.name() + ": 20 final artifact entry checks passed");
    } finally {
      await browser.close();
    }
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
