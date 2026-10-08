const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium, webkit } = require("playwright");
const engine = process.env.BROWSER || "chromium",
  base = process.env.BASE_URL || "http://127.0.0.1:8773";
(async () => {
  const browser = await (engine === "webkit" ? webkit : chromium).launch({
    headless: true,
    ...(engine === "chromium"
      ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }
      : {}),
  });
  try {
    const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const scene of ["north", "south"]) {
      await page.goto(
        `${base}/rooftop/?scene=${scene}&weather=rain&time=afternoon`,
      );
      await page.waitForFunction(() => rooftop.graphics?.drawCalls > 0);
      const original = await page.evaluate(() => rooftop.layout);
      assert.deepEqual(
        await page.evaluate(() => rooftop.graphics.visibleTerraces),
        [scene],
      );
      assert.equal(
        await page.evaluate(() => rooftop.graphics.house.id),
        "dongdong-home",
      );
      const cv = page.locator("#garden");
      await cv.focus();
      for (let i = 0; i < 12; i++) await page.keyboard.press("-");
      assert.equal(await page.evaluate(() => rooftop.graphics.wanted.zoom), 1);
      for (let i = 0; i < 16; i++) await page.keyboard.press("+");
      await page.waitForFunction(() => rooftop.graphics.view.zoom > 3.4);
      assert.equal(
        await page.evaluate(() => rooftop.graphics.wanted.zoom),
        3.5,
      );
      const start = await page.evaluate(() => rooftop.graphics.target);
      const b = await cv.boundingBox();
      await page.mouse.move(b.width * 0.7, b.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(b.width * 0.45, b.height * 0.45, { steps: 8 });
      await page.mouse.up();
      await page.waitForFunction(
        (s) =>
          Math.hypot(
            rooftop.graphics.target[0] - s[0],
            rooftop.graphics.target[2] - s[2],
          ) > 0.1,
        start,
      );
      assert.equal(
        await page.locator(".observation-notebook").isVisible(),
        false,
      );
      assert.deepEqual(await page.evaluate(() => rooftop.layout), original);
      await cv.press("Home");
      await page.waitForFunction(() => rooftop.graphics.view.zoom < 1.02);
      // Find a visible opaque object through the same projection and picking path.
      const point = await page.evaluate(() => {
        for (const o of rooftop.layout.scenes[rooftop.scene]) {
          const p = rooftop.modelRenderer.projectObject(o.id);
          if (
            p &&
            p.clientX > 40 &&
            p.clientX < innerWidth - 310 &&
            p.clientY > 40 &&
            p.clientY < innerHeight - 130 &&
            rooftop.modelRenderer.pick(p.clientX, p.clientY)
          )
            return p;
        }
      });
      assert.ok(point, "a rendered item is inspectable");
      await page.mouse.move(point.clientX, point.clientY);
      await page.locator(".observation-notebook").waitFor({ state: "visible" });
      assert.ok((await page.locator("#noteShape").innerText()).length > 5);
      assert.ok((await page.locator("#noteComment").innerText()).length > 5);
      await page.mouse.click(point.clientX, point.clientY);
      await page.mouse.move(20, 20);
      await page.waitForTimeout(600);
      assert.equal(
        await page.locator(".observation-notebook").isVisible(),
        true,
      );
      await page.locator(".notebook details summary").click();
      assert.ok(await page.locator("#noteSources a").count());
      assert.equal(
        await page.locator("#noteAliases,#noteCare,.note-foot").count(),
        0,
      );
      await page.locator("#notebookClose").click();
      assert.equal(
        await page.locator(".observation-notebook").isVisible(),
        false,
      );
      await page.mouse.move(point.clientX, point.clientY);
      await page.locator(".observation-notebook").waitFor({ state: "visible" });
      await page.keyboard.press("Escape");
      await page.locator("#actionCard").waitFor({ state: "visible" });
      assert.equal(await page.locator("#weatherCard #actionStatus").count(), 0);
      await page.waitForFunction(
        () => rooftop.person.sheltered && rooftop.pig.sheltered,
        { timeout: 30000 },
      );
      assert.doesNotMatch(
        await page.locator("#actionStatus").innerText(),
        /浇水/,
      );
      await page
        .getByRole("button", {
          name: scene === "north" ? "进入南阳台" : "进入北天台",
          exact: true,
        })
        .click();
      assert.equal(
        await page.evaluate(() => rooftop.scene),
        scene === "north" ? "south" : "north",
      );
      assert.deepEqual(
        await page.evaluate(() => rooftop.graphics.visibleTerraces),
        [scene === "north" ? "south" : "north"],
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/rooftop/?scene=south&weather=heavy");
    await page.waitForFunction(() => rooftop.graphics?.drawCalls > 0);
    assert.equal(await page.evaluate(() => rooftop.graphics.view.zoom), 1);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    const out = process.env.QA_OUTPUT || "/tmp/rooftop-observation";
    await fs.mkdir(out, { recursive: true });
    await page.screenshot({ path: out + "/observation-" + engine + ".png" });
    assert.deepEqual(errors, []);
    console.log(
      engine +
        " observation: bounded north/south camera, zoom, pan, unchanged layouts, hover/click/source notebook, rain actions and mobile passed",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
