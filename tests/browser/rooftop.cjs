// BASE_URL=http://127.0.0.1:8773 BROWSER=webkit NODE_PATH=... node tests/browser/rooftop.cjs
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { chromium, webkit } = require("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:8773",
  engine = process.env.BROWSER || "chromium";
(async () => {
  const browser = await (engine === "webkit" ? webkit : chromium).launch({
    headless: true,
    ...(engine === "chromium" ? { channel: "chrome" } : {}),
  });
  try {
    const context = await browser.newContext({
        acceptDownloads: true,
        viewport: { width: 1440, height: 1000 },
      }),
      page = await context.newPage(),
      errors = [];
    await page.addInitScript(() => {
      Math.random = () => 0.2;
    });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/");
    await page.locator("#closeWelcome").click();
    await page.locator('a[href="./rooftop/"]').click();
    await page.waitForFunction(() => window.rooftop);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const first = await page.evaluate(() => rooftop.person);
    await page.waitForFunction(
      (first) =>
        Math.hypot(rooftop.person.x - first.x, rooftop.person.y - first.y) > 1,
      first,
      { timeout: 30000 },
    );
    const moved = await page.evaluate(() => rooftop.person);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const before = await page.locator("#garden").screenshot();
    await page.waitForTimeout(2500);
    const after = await page.locator("#garden").screenshot();
    assert.ok(!before.equals(after), "required motion survives reduced motion");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForFunction(
      () => rooftop.person.visits > 0,
      {},
      { timeout: 45000 },
    );
    assert.equal(await page.locator("#garageCard[href*=arrange]").count(), 1);
    assert.equal(await page.locator("#togglePerson").count(), 0);
    assert.equal(await page.locator("header").count(), 0);
    assert.equal(await page.locator("#dongdongStatus").isVisible(), false);
    await page.locator("#sceneDoor").click();
    assert.equal(await page.evaluate(() => rooftop.scene), "south");
    await page.locator("#sceneDoor").click();
    assert.equal(await page.evaluate(() => rooftop.scene), "north");
    await page.locator("#returnWorld").click();
    await page.waitForURL(base + "/");
    await page.goto(base + "/rooftop/arrange/?scene=south");
    await page.waitForFunction(() => window.rooftop);
    assert.equal(await page.evaluate(() => rooftop.scene), "south");
    assert.equal(
      await page.locator(".asset-card").count(),
      await page.evaluate(async () => {
        const { ASSETS } = await import("/rooftop/scene.mjs");
        return ASSETS.length;
      }),
    );
    await page.locator("[data-scene=north]").click();
    const initial = await page.evaluate(() => rooftop.layout);
    assert.equal(
      await page.evaluate(async () => {
        const { validateLayout } = await import("/rooftop/scene.mjs");
        return !!validateLayout(rooftop.layout);
      }),
      true,
    );
    await page.locator("#clear").click();
    assert.equal(
      (await page.evaluate(() => rooftop.layout.scenes.north)).length,
      0,
    );
    await page.screenshot({
      path: process.env.QA_OUTPUT + "/north-empty-" + engine + ".png",
    });
    await page.locator("[data-asset=mint]").click();
    assert.equal(
      (await page.evaluate(() => rooftop.layout.scenes.north)).length,
      1,
    );
    const added = await page.evaluate(() => rooftop.layout.scenes.north[0]);
    const box = await page.locator("#garden").boundingBox();
    const dragPoint = (o) => ({
      x: box.x + ((o.x - 96) * box.width) / 416,
      y: box.y + ((o.y - 48) * box.height) / 440,
    });
    let point = dragPoint(added);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 40, point.y + 28, { steps: 10 });
    await page.mouse.up();
    const dragged = await page.evaluate(() => rooftop.layout.scenes.north[0]);
    assert.notEqual(dragged.x, added.x);
    assert.notEqual(dragged.y, added.y);
    await page.keyboard.press("Control+z");
    assert.deepEqual(
      await page.evaluate(() => rooftop.layout.scenes.north[0]),
      added,
    );
    await page.keyboard.press("Control+Shift+z");
    assert.deepEqual(
      await page.evaluate(() => rooftop.layout.scenes.north[0]),
      dragged,
    );
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await page.locator("#rotate").click();
    assert.equal(
      await page.evaluate(() => rooftop.layout.scenes.north[0].rotation),
      90,
    );
    await page.locator("#duplicate").evaluate((button) => button.click());
    assert.equal(
      (await page.evaluate(() => rooftop.layout.scenes.north)).length,
      2,
    );
    await page.locator("#remove").click();
    assert.equal(
      (await page.evaluate(() => rooftop.layout.scenes.north)).length,
      1,
    );
    await page.reload();
    await page.waitForFunction(() => window.rooftop);
    assert.equal(
      (await page.evaluate(() => rooftop.layout.scenes.north)).length,
      1,
    );
    await page.locator(".transfer summary").click();
    const exported = page.waitForEvent("download");
    await page.locator("#export").click();
    const download = await exported;
    const saved = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
    assert.deepEqual(saved, await page.evaluate(() => rooftop.layout));
    await page.locator("#layoutText").fill(JSON.stringify(initial));
    await page.locator("#importText").click();
    assert.deepEqual(await page.evaluate(() => rooftop.layout), initial);
    await page
      .locator("#layoutText")
      .fill('{"version":1,"scenes":{"north":[],"south":[{"type":"fake"}]}}');
    await page.locator("#importText").click();
    assert.deepEqual(await page.evaluate(() => rooftop.layout), initial);
    assert.match(await page.locator("#message").innerText(), /导入失败/);
    assert.equal(
      await page.locator("#preview").getAttribute("href"),
      "https://umwelt.fivsevn.com/rooftop/",
    );
    const preview = await page.context().newPage();
    await preview.goto(base + "/rooftop/?layout=local");
    await preview.waitForFunction(() => window.rooftop);
    assert.deepEqual(await preview.evaluate(() => rooftop.layout), initial);
    await preview.close();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: process.env.QA_OUTPUT + "/editor-mobile-" + engine + ".png",
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.locator("[data-scene=south]").click();
    await page.locator("#clear").click();
    await page.screenshot({
      path: process.env.QA_OUTPUT + "/south-empty-mobile-" + engine + ".png",
      fullPage: true,
    });
    await page.locator("[data-asset=fish]").click();
    assert.equal(
      (await page.evaluate(() => rooftop.layout.scenes.south)).length,
      1,
    );
    await page.goto(base + "/rooftop/");
    assert.ok(
      await page.evaluate(() => {
        const c = document.querySelector("#garden"),
          d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data,
          colors = new Set();
        for (let i = 0; i < d.length; i += 4)
          colors.add(d[i] + "," + d[i + 1] + "," + d[i + 2]);
        return colors.size > 40;
      }),
      "scene is painted at entry",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: process.env.QA_OUTPUT + "/north-" + engine + ".png",
    });
    await page.locator("#sceneDoor").click();
    await page.screenshot({
      path: process.env.QA_OUTPUT + "/south-" + engine + ".png",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: process.env.QA_OUTPUT + "/south-mobile-" + engine + ".png",
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.goto(base + "/rooftop/arrange/");
    await page.locator("#restore").click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: process.env.QA_OUTPUT + "/editor-" + engine + ".png",
    });
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        engine,
        passed: true,
        errors,
        taskObserved: moved.state,
        checks:
          "vertical entry, doors, no editor link or presence controls, both scenes, motion, reduced/live preference, tasks, empty base, add, drag, undo/redo, transform, copy/remove, persistence, export/import, invalid import, preview, mobile",
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
