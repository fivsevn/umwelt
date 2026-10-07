const assert = require("node:assert/strict");
const { chromium, webkit } = require("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:8773";
const engine = process.env.BROWSER || "chromium";
(async () => {
  const browser = await (engine === "webkit" ? webkit : chromium).launch({
    headless: true,
    ...(engine === "chromium" ? {args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]} : {}),
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
    await room.waitForFunction(() => room.layout.length === 5);
    assert.equal(await room.locator(".wardrobe-catalog details, .wardrobe-catalog canvas, .wardrobe-catalog input").count(), 0);
    assert.equal(await room.locator("#outfits [data-category]").count(), 7);
    assert.equal(await room.locator("#decorations [data-category]").count(), 7);
    const outfitBeforeBrowsing = await room.evaluate(() => window.room.outfit);
    for (const kind of ["背心裙", "围裙", "背带裤", "条纹裙", "格子裙", "短外套", "口袋工作服"]) {
      await room.locator(`#outfits [data-category="${kind}"]`).click();
      assert.equal(await room.locator("#outfitsOptions button").count(), 5);
      assert.ok((await room.locator("#outfitsOptions button").allTextContents()).every(label => label.endsWith(kind)));
      assert.equal(await room.evaluate(() => window.room.outfit), outfitBeforeBrowsing);
    }
    await room.locator('#outfits [data-category="背心裙"]').click();
    await room.locator("#outfits button[data-value=blue]").click();
    assert.equal(await room.evaluate(() => window.room.outfit), "blue");
    assert.equal(await room.locator("#outfitsOptions [aria-pressed=true]").getAttribute("data-value"), "blue");
    assert.equal(await room.evaluate(() => JSON.parse(localStorage.getItem("umwelt-dongdong-wardrobe-v1")).outfit), "blue");
    await room.locator('#decorations [data-category="铃铛项圈"]').click();
    assert.equal(await room.locator("#decorationsOptions button").count(), 5);
    await room.locator('#decorationsOptions [data-value="bell-cream"]').click();
    assert.equal(await room.evaluate(() => window.room.pig), "bell-cream");
    assert.equal(await room.locator("#decorationsOptions [aria-pressed=true]").getAttribute("data-value"), "bell-cream");
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
    assert.equal(data.wardrobe.pig, "bell-cream");
    await room.locator('#outfits [data-category="围裙"]').click();
    await room.locator('#outfitsOptions [data-value="apron-sage"]').click();
    await room.locator('#decorations [data-category="小领巾"]').click();
    await room.locator('#decorationsOptions [data-value="scarf-sage"]').click();
    await room.locator("#roomFile").setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("{}"),
    });
    await room.waitForFunction(() => document.querySelector("#caption").textContent.includes("无法导入"));
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
    assert.equal(await room.locator("#outfits .wardrobe-categories [aria-pressed=true]").innerText(), "背心裙");
    assert.equal(await room.locator("#outfitsOptions [aria-pressed=true]").getAttribute("data-value"), "blue");
    assert.equal(await room.locator("#decorations .wardrobe-categories [aria-pressed=true]").innerText(), "铃铛项圈");
    assert.equal(await room.locator("#decorationsOptions [aria-pressed=true]").getAttribute("data-value"), "bell-cream");
    for (const width of [1600, 900, 390, 320]) {
      await room.setViewportSize({ width, height: 844 });
      if(width===1600)assert.ok((await room.locator('#room').boundingBox()).width>=600,'room should use the available central column');
      assert.ok(
        await room.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await room.locator('#outfits [data-category="口袋工作服"]').click();
      await room.locator('#outfitsOptions [data-value="pocket-berry"]').click();
      assert.equal(await room.evaluate(() => window.room.outfit), "pocket-berry");
      await room.locator('#decorations [data-category="花边帽"]').click();
      await room.locator('#decorationsOptions [data-value="bonnet-blue"]').click();
      assert.equal(await room.evaluate(() => window.room.pig), "bonnet-blue");
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
