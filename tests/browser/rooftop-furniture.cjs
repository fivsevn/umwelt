const assert = require("node:assert/strict"),
  { chromium, webkit } = require("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:8773",
  engine = process.env.BROWSER || "chromium",
  out = process.env.QA_OUTPUT || "/tmp";
(async () => {
  const b = await (engine === "webkit" ? webkit : chromium).launch({
    headless: true,
    ...(engine === "chromium" ? { channel: "chrome" } : {}),
  });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1050 } }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base + "/rooftop/arrange/");
    await p.waitForFunction(() => window.rooftop);
    await p.locator("#clear").click();
    await p.locator("[data-asset=woodshelf]").click();
    const original = await p.evaluate(() => rooftop.layout);
    await p.locator("#scaleUp").click();
    assert.equal(
      (await p.evaluate(() => rooftop.layout.scenes.north))[0].scale,
      1.1,
    );
    assert.equal(await p.locator("#scaleValue").innerText(), "110%");
    await p.keyboard.press("Control+z");
    assert.deepEqual(await p.evaluate(() => rooftop.layout), original);
    await p.keyboard.press("Control+Shift+z");
    for (let i = 0; i < 4; i++) await p.locator("#scaleUp").click();
    assert.equal(
      (await p.evaluate(() => rooftop.layout.scenes.north))[0].scale,
      1.5,
    );
    await p.locator("#rotate").click();
    await p.locator("#scaleDown").click();
    assert.equal(
      (await p.evaluate(() => rooftop.layout.scenes.north))[0].scale,
      1.4,
    );
    await p.reload();
    await p.waitForFunction(() => window.rooftop);
    assert.equal(
      (await p.evaluate(() => rooftop.layout.scenes.north))[0].scale,
      1.4,
    );
    await p.locator("[data-asset=pottingbench]").click();
    await p.locator("#scaleUp").click();
    await p.screenshot({
      path: out + "/furniture-editor-" + engine + ".png",
      fullPage: true,
    });
    await p.locator("[data-asset=yucca]").click();
    assert.doesNotMatch(
      await p.locator("#noteAliases").innerText(),
      /日本|台湾/,
    );
    assert.ok(
      (await p.locator("#noteSources a").allTextContents()).every(
        (t) => !/^\s*(EN|JP|TW|CN)\s*·/.test(t),
      ),
    );
    await p.locator("#potSelect").selectOption("deep");
    const result = await p.evaluate(async () => {
      const { POTS } = await import("/rooftop/botany.mjs"),
        { paintVessel } = await import("/rooftop/plant-art.mjs");
      const cv = document.createElement("canvas");
      cv.width = 64;
      cv.height = 48;
      const c = cv.getContext("2d"),
        shapes = new Set();
      for (const v of POTS.filter((v) => v.kind === "ceramic")) {
        c.clearRect(0, 0, 64, 48);
        c.save();
        c.translate(32, 16);
        paintVessel(
          c,
          {
            ...v,
            color: "#444444",
            rim: "#444444",
            ink: "#444444",
            pattern: "plain",
          },
          0,
          28,
        );
        c.restore();
        shapes.add(
          Array.from(c.getImageData(0, 0, 64, 48).data)
            .filter((v, i) => i % 4 === 3)
            .join(","),
        );
      }
      return shapes.size;
    });
    assert.ok(result >= 12);
    await p.setViewportSize({ width: 390, height: 844 });
    await p.locator("[data-asset=gardenbench]").click();
    await p.locator("#scaleDown").click();
    assert.equal(
      (await p.evaluate(() => rooftop.layout.scenes.north)).at(-1).scale,
      0.9,
    );
    assert.ok(await p.locator("#scaleDown").isVisible());
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        engine,
        passed: true,
        distinctCeramicSilhouettes: result,
        checks:
          "furniture sizing and buttons, rotation, undo redo, reload, mobile, source labels",
      }),
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
