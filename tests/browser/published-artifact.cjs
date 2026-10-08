// Run against prepare-site + subset-font + stamp-assets output, never the source server.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
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
  const { INITIAL_LAYOUT: authoredLayout } = await import(
    pathToFileURL(path.resolve(__dirname, "../../rooftop/initial-layout.mjs")).href
  );
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
          const response = await page.goto(base + route);
          assert.ok(
            response.ok() || response.status() === 304,
            route + " document status " + response.status(),
          );
          await page.locator(selector).first().waitFor({ state: "visible" });
          await page.evaluate(() => document.fonts.ready);
          if (
            engine === chromium &&
            route.startsWith("/rooftop/") &&
            route !== "/rooftop/3d/"
          ) {
            await page.waitForFunction(
              () =>
                window.rooftop?.graphics?.drawCalls > 0 ||
                window.room?.graphics?.drawCalls > 0,
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
          if (route === "/rooftop/3d/") {
            await page.waitForFunction(
              () =>
                window.rooftop3d?.drawCalls > 0 ||
                document.querySelector('[role="alert"]'),
            );
            const rendered = await page.evaluate(() =>
              Boolean(window.rooftop3d?.drawCalls),
            );
            if (engine === chromium)
              assert.ok(rendered, "3D must render with software WebGL");
            if (rendered) {
              const initial = await page.evaluate(() => ({
                scene: rooftop.scene,
                layout: rooftop.layout,
                theta: rooftop3d.view.theta,
              }));
              assert.deepEqual(initial.layout, authoredLayout);
              assert.equal(
                await page.locator(".topbar,.scene-tabs,.tools").count(),
                0,
              );
              await page.locator("#garden").focus();
              await page.keyboard.press("ArrowRight");
              await page.waitForFunction(
                (theta) => rooftop3d.view.theta > theta + 0.05,
                initial.theta,
              );
              await page
                .getByRole("button", { name: "进入南阳台", exact: true })
                .click();
              await page.waitForFunction(
                () => rooftop.scene === "south" && rooftop3d.scene === "south",
              );
              assert.equal(
                await page.locator("#garageCard").getAttribute("href"),
                "../arrange/?scene=south",
              );
              await page
                .getByRole("button", { name: "进入北天台", exact: true })
                .click();
              await page.waitForFunction(
                () => rooftop.scene === "north" && rooftop3d.scene === "north",
              );
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
