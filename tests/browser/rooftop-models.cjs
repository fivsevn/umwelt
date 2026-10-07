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
        viewport: { width: 1600, height: 1000 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/rooftop/arrange/");
    await page.waitForFunction(() => window.rooftop);
    const webgl = await page.evaluate(() => !!rooftop.modelRenderer);
    if (engine === "chromium")
      assert.ok(webgl, "software WebGL must create models");
    if (webgl) {
      await page.waitForFunction(()=>rooftop.graphics.foliageMotion.time>0.1);
      const style = await page.evaluate(() => rooftop.graphics);
      assert.equal(style.style, "painted-lowpoly-v1");
      assert.ok(style.textures >= 20, "shared painted material library");
      assert.ok(
        style.drawCalls < 1000,
        "leaves reuse surfaces rather than one draw per leaf",
      );
      assert.ok(
        style.surfaces < 260,
        "bounded shared surfaces including the expanded vessel profiles",
      );
      assert.equal(style.neighborhood.buildings, 8);
      assert.equal(style.neighborhood.shelters, 1);
      assert.ok(style.groundY < -18, "six storeys meet community ground");
      const audit = await page.evaluate(async () => {
        const { ASSETS } = await import("/rooftop/scene.mjs"),
          renderer = rooftop.modelRenderer;
        const before = rooftop.graphics.buffer,
          records = ASSETS.map((a) => renderer.catalogModel(a.id));
        const empty = [];
        for (const a of ASSETS) {
          const c = document.createElement("canvas");
          c.width = c.height = 64;
          renderer.thumbnail({ type: a.id, seed: 1835 }, c);
          const pixels = c.getContext("2d").getImageData(0, 0, 64, 64).data;
          let painted = 0;
          for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) painted++;
          if (painted < 8) empty.push(a.id);
        }
        return { records, empty, before, after: rooftop.graphics.buffer };
      });
      assert.equal(audit.records.length, 305);
      assert.deepEqual(audit.empty, []);
      assert.deepEqual(
        audit.before,
        audit.after,
        "sprites must not resize the scene canvas",
      );
      for (const model of audit.records) {
        assert.ok(model.instances > 0, model.type);
        assert.ok(
          model.extent.every((n) => n > 0 && Number.isFinite(n)),
          model.type,
        );
        assert.ok(model.sourceCount > 0, model.type + " sources");
      }
      // Real controls, picking and dragging verify the shared placement contract.
      await page.locator("#clear").click();
      await page.locator("#search").fill("三层铁花架");
      await page.locator("[data-asset=tierstand]").click();
      await page.locator("#search").fill("工作手套");
      await page.locator("[data-asset=gloves]").click();
      await page.locator("#supportParent").selectOption({label:"三层铁花架"});
      for(const surface of ["lower","upper","middle"]) {
        await page.locator("#supportLevel").selectOption(surface);
        assert.equal(await page.evaluate(()=>rooftop.layout.scenes.north.at(-1).support.surface),surface);
      }
      const arrangement=await page.evaluate(()=>rooftop.layout.scenes.north),
        cameraBefore=await page.evaluate(()=>rooftop.graphics.wanted),
        rackPoint=await page.evaluate(id=>rooftop.modelRenderer.projectObject(id),arrangement[0].id);
      await page.mouse.move(rackPoint.clientX,rackPoint.clientY);
      await page.mouse.down();
      await page.mouse.move(rackPoint.clientX+55,rackPoint.clientY+25,{steps:5});
      await page.mouse.up();
      const carried=await page.evaluate(()=>rooftop.layout.scenes.north);
      assert.notEqual(carried[0].x,arrangement[0].x);
      assert.equal(carried[1].x-carried[0].x,arrangement[1].x-arrangement[0].x);
      assert.deepEqual(await page.evaluate(()=>rooftop.graphics.wanted),cameraBefore,"object drag cannot orbit or pan the background");
      await page.locator("#rotate").click();
      const rotated=await page.evaluate(()=>rooftop.layout.scenes.north);
      assert.equal(rotated[1].rotation,90);
      assert.equal(rotated[1].support.surface,"middle");
      await page.locator("#remove").click();
      assert.equal((await page.evaluate(()=>rooftop.layout.scenes.north)).length,2,"occupied rack cannot leave floating contents");
      await page.reload();await page.waitForFunction(()=>window.rooftop);
      assert.deepEqual(await page.evaluate(()=>rooftop.layout.scenes.north),rotated,"explicit middle tier survives reload");
      await page.locator("#clear").click();
      await page.locator("#search").fill("量天尺");
      await page.locator("[data-asset=column]").click();
      await page.locator("#potSelect").selectOption("growbag");
      await page.locator("#rotate").click();
      const initial = await page.evaluate(() => rooftop.layout.scenes.north[0]);
      assert.equal(initial.rotation, 90);
      assert.equal(initial.pot, "growbag");
      const point = await page.evaluate(
        (id) => rooftop.modelRenderer.projectObject(id),
        initial.id,
      );
      await page.mouse.move(point.clientX, point.clientY);
      await page.mouse.down();
      await page.mouse.move(point.clientX + 30, point.clientY + 15, {
        steps: 4,
      });
      await page.mouse.up();
      assert.notDeepEqual(
        await page.evaluate(() => rooftop.layout.scenes.north[0]),
        initial,
      );
      await page.locator("#garden").focus();
      await page.keyboard.press("Control+z");
      assert.deepEqual(
        await page.evaluate(() => rooftop.layout.scenes.north[0]),
        initial,
      );
      await page.reload();
      assert.equal(
        await page.evaluate(() => rooftop.layout.scenes.north[0].pot),
        "growbag",
      );
      await page.locator("#restore").click();
      const output = process.env.QA_OUTPUT || "/tmp/rooftop-models";
      await fs.mkdir(output, { recursive: true });
      await page.screenshot({
        path: output + "/garage-3d.png",
        fullPage: true,
      });
      await page.goto(base + "/rooftop/");
      await page.waitForFunction(() => rooftop.graphics?.drawCalls > 0);
      const theta = await page.evaluate(() => rooftop.graphics.view.theta);
      await page.locator("#garden").focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(
        await page.evaluate(() => rooftop.graphics.view.theta),
        theta,
        "homepage keeps fixed projection",
      );
      const wind = await page.evaluate(() => rooftop.graphics.foliageMotion);
      assert.ok(wind.programs > 0, "foliage uses a compiled wind shader");
      assert.ok(wind.strength > 0);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(
        (t) => rooftop.graphics.foliageMotion.time > t + 0.05,
        wind.time,
      );
      await page.emulateMedia({ reducedMotion: "no-preference" });
      assert.equal(
        await page.evaluate(() => rooftop.graphics.controls),
        "fixed",
      );
      await page
        .getByRole("button", { name: "进入南阳台", exact: true })
        .click();
      assert.equal(await page.evaluate(() => rooftop.graphics.scene), "south");
      await page.goto(base + "/rooftop/room/");
      await page.waitForFunction(() => room.graphics?.drawCalls > 0);
      for (const key of [
        "背心裙",
        "围裙",
        "背带裤",
        "条纹裙",
        "格子裙",
        "短外套",
        "口袋工作服",
      ]) {
        await page.locator('#outfits [data-category="' + key + '"]').click();
        const button = page.locator("#outfitsOptions button").first();
        const chosen = await button.getAttribute("data-value");
        await button.click();
        await page.waitForFunction(
          (id) => room.graphics.wardrobe.outfit === id,
          chosen,
        );
      }
      for (const key of [
        "小领巾",
        "蝴蝶结",
        "小花",
        "小背心",
        "小帽子",
        "花边帽",
        "铃铛项圈",
      ]) {
        await page
          .locator('#decorations [data-category="' + key + '"]')
          .click();
        const button = page.locator("#decorationsOptions button").first();
        const chosen = await button.getAttribute("data-value");
        await button.click();
        await page.waitForFunction(
          (id) => room.graphics.wardrobe.pig === id,
          chosen,
        );
      }
      await page.screenshot({ path: output + "/room-3d.png", fullPage: true });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.locator("#activities [data-value=water]").click();
      assert.ok((await page.evaluate(() => room.graphics.instances)) > 0);
      assert.deepEqual(errors, []);
    }
    console.log(
      JSON.stringify({
        browser: engine,
        webgl,
        checked: webgl
          ? "305 actual models, tier selection, carried contents, drag camera ownership, reload, edit/undo, wardrobe families"
          : "2D fallback available",
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
