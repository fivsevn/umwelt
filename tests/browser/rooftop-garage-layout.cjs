const { chromium, webkit } = require("playwright");
const out = process.env.QA_OUTPUT || "/tmp";
const assert = require("node:assert/strict");
(async () => {
  const engine = process.env.BROWSER || "chromium",
    b = await (engine === "webkit" ? webkit : chromium).launch({
      headless: true,
      ...(engine === "chromium"
        ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }
        : {}),
      ...(engine === "chromium" && !process.env.CI
        ? { channel: "chrome" }
        : {}),
    }),
    p = await b.newPage({ viewport: { width: 1600, height: 1100 } }),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(
    (process.env.BASE_URL || "http://127.0.0.1:8773") + "/rooftop/arrange/",
  );
  await p.waitForFunction(() => window.rooftop);
  await p.locator("[data-asset=barrel]").click();
  await p.screenshot({
    path: out + "/garage-layout-" + engine + ".png",
    fullPage: true,
  });
  assert.deepEqual(
    await p
      .locator(".studio")
      .evaluate((e) => Array.from(e.children).map((c) => c.className)),
    ["note-column", "catalog"],
  );
  for (const width of [1600, 1366, 1100]) {
    await p.setViewportSize({ width, height: 1100 });
    await p.waitForTimeout(100);
    const row = await p.locator(".inspector").evaluate((e) => {
      const groups = [
        e.querySelector(".section-title"),
        ...e.querySelector("#objectControls").children,
      ];
      return {
        centers: groups.map((x) => {
          const b = x.getBoundingClientRect();
          return b.y + b.height / 2;
        }),
        fits: e.scrollWidth <= e.clientWidth,
      };
    });
    const shelf = await p.locator(".catalog").boundingBox(),
      stage = await p.locator(".workspace").boundingBox(),
      note = await p.locator(".notebook").boundingBox();
    assert.ok(
      shelf.x + shelf.width <= stage.x && stage.x + stage.width <= note.x,
      "shelf, scene and notebook form three columns",
    );
    assert.ok(row.fits, "desktop controls fit without horizontal scrolling");
  }
  await p.setViewportSize({ width: 1600, height: 1100 });
  await p.waitForTimeout(100);
  const box = await p.locator("#garden").boundingBox(),
    controls = await p.locator(".inspector").boundingBox();
  assert.equal(await p.locator(".note-column>.inspector").count(), 1);
  assert.ok(box.y + box.height < 1100);
  const northFrame = await p.locator(".canvas-wrap").boundingBox();
  await p.locator("[data-scene=south]").click();
  await p.waitForTimeout(100);
  const southFrame = await p.locator(".canvas-wrap").boundingBox();
  assert.equal(Math.round(northFrame.width), Math.round(southFrame.width));
  assert.equal(Math.round(northFrame.height), Math.round(southFrame.height));
  assert.equal(await p.locator(".canvas-wrap #weatherStatus").count(), 1);
  assert.equal(await p.locator(".canvas-wrap #message").count(), 1);
  assert.equal(await p.locator("[data-scene=south]").innerText(), "南阳台");
  assert.equal(await p.locator("[data-scene=north]").innerText(), "北天台");
  assert.equal(await p.locator(".workspace-toolbar #export").count(), 1);
  assert.equal(await p.locator(".topbar #preview").count(), 1);
  await p.screenshot({ path: out + "/garage-south-native-" + engine + ".png" });
  await p.locator("[data-scene=room]").click();
  await p.waitForTimeout(100);
  const roomFrame=await p.locator("#garden").boundingBox();
  assert.ok(roomFrame.width>600,"garage room uses the workspace instead of a 340px card");
  assert.ok(Math.abs(roomFrame.width/roomFrame.height-4/3)<.02);
  assert.ok(roomFrame.y+roomFrame.height<1100);
  await p.locator("[data-scene=north]").click();
  await p.locator("[data-asset=barrel]").click();
  await p.locator("#scaleUp").click();
  assert.equal(await p.locator("#scaleValue").innerText(), "110%");
  await p.locator(".transfer summary").click();
  assert.ok(await p.locator("#importText").isVisible());
  const dl = p.waitForEvent("download");
  await p.locator("#export").click();
  assert.ok((await dl).suggestedFilename().endsWith(".json"));
  await p.locator(".transfer summary").click();
  for (const w of [900, 390]) {
    await p.setViewportSize({ width: w, height: 844 });
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.ok(await p.locator("#garden").isVisible());
    const shelf = await p.locator(".catalog").boundingBox(),
      note = await p.locator(".notebook").boundingBox();
    assert.ok(
      shelf.y + shelf.height <= note.y,
      "notebook is last on narrow screens",
    );
    await p.screenshot({
      path: out + "/garage-layout-" + w + "-" + engine + ".png",
      fullPage: true,
    });
  }
  await p.locator("[data-scene=room]").click();
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const narrowRoom=await p.locator("#garden").boundingBox();
  assert.ok(narrowRoom.width>300&&narrowRoom.width<=390);
  assert.ok(Math.abs(narrowRoom.height/narrowRoom.width-1.12)<.02);
  assert.deepEqual(errors, []);
  await b.close();
  console.log(engine + " layout passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
