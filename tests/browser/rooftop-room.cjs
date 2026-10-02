const assert = require("node:assert/strict");
const { chromium, webkit } = require("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:8773";
const engine = process.env.BROWSER || "chromium";
(async () => {
  const browser = await (engine === "webkit" ? webkit : chromium).launch({
    headless: true,
    ...(engine === "chromium" && !process.env.CI ? { channel: "chrome" } : {}),
  });
  try {
    const context = await browser.newContext(),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(response.status() + " " + response.url());
    });
    await page.goto(base + "/rooftop/arrange/?scene=room");
    await page.waitForFunction(() => window.rooftop);
    assert.equal(
      await page.locator("[data-scene=room]").getAttribute("aria-pressed"),
      "true",
    );
    const initial = await page.evaluate(() => rooftop.layout);
    await page.locator("#clear").click();
    assert.equal(
      (await page.evaluate(() => rooftop.layout.scenes.room)).length,
      0,
    );
    assert.deepEqual(
      await page.evaluate(() => rooftop.layout.scenes.north),
      initial.scenes.north,
    );
    await page.keyboard.press("Control+z");
    assert.deepEqual(await page.evaluate(() => rooftop.layout), initial);
    await page.keyboard.press("Control+Shift+z");
    assert.equal(
      (await page.evaluate(() => rooftop.layout.scenes.room)).length,
      0,
    );
    await page.keyboard.press("Control+z");
    const room = await context.newPage();
    await room.goto(base + "/rooftop/room/");
    await room.waitForFunction(() => window.room);
    room.on("pageerror", (error) => errors.push(error.message));
    assert.deepEqual(
      await room.evaluate(() => room.layout),
      initial.scenes.room,
    );
    await page.locator("#clear").click();
    await room.waitForFunction(() => room.layout.length === 0);
    await page.keyboard.press("Control+z");
    await room.waitForFunction(() => room.layout.length === 18);
    const group = room
      .locator("#outfits details")
      .filter({ has: room.locator("button[data-value=blue]") });
    if (!(await group.evaluate((el) => el.open)))
      await group.locator("summary").click();
    await room.locator("#outfits button[data-value=blue]").click();
    assert.equal(await room.evaluate(() => window.room.outfit), "blue");
    await room.locator("#activities button[data-value=tea]").click();
    assert.equal(await room.evaluate(() => window.room.activity), "tea");
    assert.match(await room.locator("#caption").innerText(), /喝茶/);
    await room.locator(".transfer summary").click();
    const download = room.waitForEvent("download");
    await room.locator("#exportRoom").click();
    const file = await download,
      fs = require("node:fs/promises"),
      data = JSON.parse(await fs.readFile(await file.path(), "utf8"));
    assert.deepEqual(data.objects, initial.scenes.room);
    assert.equal(data.wardrobe.outfit, "blue");
    await room.locator("#roomFile").setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("{}"),
    });
    assert.match(await room.locator("#caption").innerText(), /无法导入/);
    assert.deepEqual(
      await room.evaluate(() => room.layout),
      initial.scenes.room,
    );
    await room.locator("#roomFile").setInputFiles({
      name: "room.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(data)),
    });
    await room.waitForFunction(
      () =>
        document.querySelector("#caption").textContent === "房间和换装已恢复。",
    );
    assert.deepEqual(
      await room.evaluate(() => room.layout),
      initial.scenes.room,
    );
    assert.equal(await room.evaluate(() => room.outfit), "blue");
    for (const width of [1600, 900, 390]) {
      await room.setViewportSize({ width, height: 844 });
      assert.ok(
        await room.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      if (process.env.QA_OUTPUT)
        await room.screenshot({
          path:
            process.env.QA_OUTPUT + "/room-" + width + "-" + engine + ".png",
          fullPage: true,
        });
    }
    await room.reload();
    await room.waitForFunction(() => window.room);
    assert.deepEqual(
      await room.evaluate(() => room.layout),
      initial.scenes.room,
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        engine,
        passed: true,
        checks:
          "room undo redo, terrace isolation, cross-tab synchronization, wardrobe, activity feedback, export import rollback, reload, responsive overflow",
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
