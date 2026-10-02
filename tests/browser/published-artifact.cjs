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
  ["/rooftop/arrange/", "[data-asset=mint]"],
  ["/rooftop/room/", "canvas"],
];
(async () => {
  await fs.mkdir(output, { recursive: true });
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch({ headless: true });
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
          const response = await page.goto(base + route);
          assert.ok(response.ok() || response.status() === 304, route + " document status " + response.status());
          await page.locator(selector).first().waitFor({ state: "visible" });
          await page.evaluate(() => document.fonts.ready);
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
        }
      }
      console.log(engine.name() + ": 18 final artifact entry checks passed");
    } finally {
      await browser.close();
    }
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
