// Deterministic before/after comparison plus editor state regression checks.
// BASE_URL=http://127.0.0.1:8773 COMPARE_URL=http://127.0.0.1:8774 BROWSER=webkit NODE_PATH=... node tests/browser/rooftop-maintenance.cjs
const assert = require("node:assert/strict");
const { chromium, webkit } = require("playwright");
async function equalPixels(a, b, label) {
  const actual = await a.screenshot({ fullPage: true, animations: "disabled" }),
    expected = await b.screenshot({ fullPage: true, animations: "disabled" });
  if (!actual.equals(expected)) {
    const fs = require("node:fs/promises");
    await fs.writeFile("/tmp/rooftop-actual.png", actual);
    await fs.writeFile("/tmp/rooftop-expected.png", expected);
  }
  assert.ok(actual.equals(expected), label);
}
const base = process.env.BASE_URL || "http://127.0.0.1:8773",
  compare = process.env.COMPARE_URL,
  engine = process.env.BROWSER || "chromium";
(async () => {
  const browser = await (engine === "webkit" ? webkit : chromium).launch({
    headless: true,
    ...(engine === "chromium" ? { channel: "chrome" } : {}),
  });
  try {
    const errors = [],
      context = await browser.newContext();
    await context.addInitScript(() => {
      const NativeDate = Date;
      window.Date = class extends NativeDate {
        constructor(...args) {
          super(...(args.length ? args : ["2026-10-01T04:00:00Z"]));
        }
        static now() {
          return new NativeDate("2026-10-01T04:00:00Z").getTime();
        }
      };
      Math.random = () => 0.2;
      let serial = 0;
      crypto.randomUUID = () =>
        `00000000-0000-4000-8000-${String(++serial).padStart(12, "0")}`;
      let frames = [];
      window.requestAnimationFrame = (callback) => {
        frames.push(callback);
        return frames.length;
      };
      window.stepFrames = (ms) => {
        const pending = frames;
        frames = [];
        for (const callback of pending) callback(ms);
      };
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(r.status() + " " + r.url());
    });
    const reference = compare ? await context.newPage() : null;
    let comparisons = 0;
    for (const viewport of [
      { width: 1600, height: 1100 },
      { width: 1100, height: 900 },
      { width: 900, height: 844 },
      { width: 390, height: 844 },
    ])
      for (const scene of ["north", "south", "room"]) {
        const route = "/rooftop/arrange/?scene=" + scene;
        for (const [p, url] of [
          [page, base],
          ...(reference ? [[reference, compare]] : []),
        ]) {
          await p.setViewportSize(viewport);
          await p.goto(url + route);
          await p.waitForFunction(() => window.rooftop);
          await p.evaluate(() => document.fonts.ready);
          await p.waitForTimeout(150);
        }
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "no page overflow",
        );
        if (process.env.QA_OUTPUT)
          await page.screenshot({
            path:
              process.env.QA_OUTPUT +
              "/garage-" +
              viewport.width +
              "-" +
              scene +
              "-" +
              engine +
              ".png",
            fullPage: true,
            animations: "disabled",
          });
        if (reference) {
          await equalPixels(
            page,
            reference,
            `${viewport.width} ${scene} initial pixels`,
          );
          await page.locator("[data-asset=mint]").click();
          await reference.locator("[data-asset=mint]").click();
          await equalPixels(
            page,
            reference,
            `${viewport.width} ${scene} selected pixels`,
          );
          assert.equal(
            await page.locator("body").innerText(),
            await reference.locator("body").innerText(),
          );
          assert.deepEqual(
            await page.evaluate(() =>
              JSON.parse(localStorage.getItem("umwelt-rooftop-layout-v1")),
            ),
            await reference.evaluate(() =>
              JSON.parse(localStorage.getItem("umwelt-rooftop-layout-v1")),
            ),
          );
          comparisons += 2;
        }
      }
    if (reference)
      for (const width of [1600, 1100, 900, 390])
        for (const route of [
          "/rooftop/?scene=north",
          "/rooftop/?scene=south",
          "/rooftop/room/",
        ]) {
          for (const [p, url] of [
            [page, base],
            [reference, compare],
          ]) {
            await p.setViewportSize({ width, height: 844 });
            await p.goto(url + route);
            await p.waitForFunction(() => window.rooftop || window.room);
            await p.evaluate(() => document.fonts.ready);
            await p.evaluate(() => {
              stepFrames(1000);
              stepFrames(2000);
            });
            await p.waitForTimeout(200);
          }
          assert.equal(
            await page.locator("body").innerText(),
            await reference.locator("body").innerText(),
            route + " visible text",
          );
          await equalPixels(page, reference, width + " " + route + " pixels");
          comparisons++;
        }
    await page.setViewportSize({ width: 1600, height: 1100 });
    await page.goto(base + "/rooftop/arrange/");
    await page.waitForFunction(() => window.rooftop);
    await page.locator("#clear").click();
    await page.locator("[data-asset=mint]").click();
    await page.locator("#scaleUp").click();
    await page.keyboard.press("Control+z");
    assert.equal(await page.locator("#redo").isEnabled(), true);
    await page
      .locator("#posX")
      .evaluate((e) => e.dispatchEvent(new Event("change")));
    assert.equal(
      await page.locator("#redo").isEnabled(),
      true,
      "unchanged coordinates preserve redo",
    );
    await page.keyboard.press("Control+Shift+z");
    assert.equal(await page.locator("#scaleValue").innerText(), "110%");
    const original = await page.evaluate(() => rooftop.layout),
      o = original.scenes.north[0],
      camera = await page.evaluate(() => rooftop.camera),
      box = await page.locator("#garden").boundingBox();
    const x = box.x + ((o.x - camera.x) * box.width) / camera.w,
      y = box.y + ((o.y - camera.y) * box.height) / camera.h;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page
      .locator("#garden")
      .dispatchEvent("pointermove", {
        pointerId: 42,
        clientX: x + 40,
        clientY: y + 20,
      });
    assert.deepEqual(
      await page.evaluate(() => rooftop.layout),
      original,
      "unrelated pointer cannot move selection",
    );
    await page.locator("#garden").dispatchEvent("pointerup", { pointerId: 42 });
    await page.mouse.move(x + 30, y + 20, { steps: 5 });
    await page.mouse.up();
    assert.notDeepEqual(
      await page.evaluate(() => rooftop.layout),
      original,
      "unrelated pointer release cannot end drag",
    );
    await page.keyboard.press("Control+z");
    assert.deepEqual(
      await page.evaluate(() => rooftop.layout),
      original,
      "drag is one undo step",
    );
    await page.reload();
    await page.waitForFunction(() => window.rooftop);
    assert.deepEqual(
      await page.evaluate(() => rooftop.layout),
      original,
      "saved layout survives reload",
    );
    await page.locator(".transfer summary").click();
    await page.locator("#layoutText").fill("{invalid");
    await page.locator("#importText").click();
    assert.match(await page.locator("#message").innerText(), /导入失败/);
    assert.deepEqual(
      await page.evaluate(() => rooftop.layout),
      original,
      "invalid import is atomic",
    );
    await page.evaluate(() => {
      File.prototype.text = async () => {
        throw Error("read failure");
      };
    });
    await page
      .locator("#importFile")
      .setInputFiles({
        name: "layout.json",
        mimeType: "application/json",
        buffer: Buffer.from("{}"),
      });
    await page.waitForFunction(() =>
      document.querySelector("#message").textContent.includes("read failure"),
    );
    assert.equal(
      await page.locator("#importFile").inputValue(),
      "",
      "failed file read resets input",
    );
    assert.deepEqual(
      await page.evaluate(() => rooftop.layout),
      original,
      "failed file read preserves layout",
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        engine,
        comparisons,
        passed: true,
        checks:
          "pixel equality, responsive overflow, no-op redo, pointer ownership, drag undo, persistence, import failure recovery, runtime errors",
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
