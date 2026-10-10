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
        // This suite exercises geometry and picking with software WebGL.
        // Separate layout/artifact suites retain wide and mobile coverage.
        viewport: { width: 1280, height: 800 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.stack||e.message));
    page.on("console",message=>{if(message.type()==="error"&&/THREE.WebGLProgram|Shader Error/.test(message.text()))errors.push(message.text());});
    page.setDefaultNavigationTimeout(90000);
    await page.goto(base + "/rooftop/arrange/", {
      waitUntil: "domcontentloaded",
    });
    try { await page.waitForFunction(() => window.rooftop); }
    catch (error) { console.error("Game startup errors:",errors); throw error; }
    const webgl = await page.evaluate(() => !!rooftop.modelRenderer);
    if (engine === "chromium")
      assert.ok(webgl, "software WebGL must create models");
    if (webgl) {
      await page.waitForFunction(() =>
        document.querySelector('#assets canvas[data-renderer="3d"]'),
      );
      await page.waitForFunction(
        () => rooftop.graphics.foliageMotion.time > 0.1,
      );
      const style = await page.evaluate(() => rooftop.graphics);
      assert.ok(
        style.cataloguePreviews < style.catalog,
        "initial shelf does not rasterize the entire catalogue",
      );
      assert.equal(style.style, "native-pixelorama-v2");
      assert.equal(style.textures,1,"one shared native Pixelorama atlas");
      assert.ok(
        style.drawCalls < 1000,
        "leaves reuse surfaces rather than one draw per leaf",
      );
      assert.ok(
        style.surfaces < 260,
        "bounded shared surfaces including the expanded vessel profiles",
      );
      assert.equal(style.neighborhood.buildings, 3);
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
        const seedPortraits = [2472093529, 1029384756].map((seed) => {
          const c = document.createElement("canvas");
          c.width = c.height = 128;
          renderer.thumbnail({ type: "basil", seed }, c);
          const pixels = Array.from(
            c.getContext("2d").getImageData(0, 0, 128, 128).data,
          );
          return {
            pixels,
            hash: pixels.reduce(
              (hash, value) => Math.imul(hash ^ value, 16777619) >>> 0,
              2166136261,
            ),
          };
        });
        return {
          records,
          empty,
          seedHashes: seedPortraits.map((p) => p.hash),
          seedPixels: seedPortraits[0].pixels,
          before,
          after: rooftop.graphics.buffer,
        };
      });
      assert.equal(audit.records.length, 304);
      assert.deepEqual(audit.empty, []);
      assert.notEqual(
        audit.seedHashes[0],
        audit.seedHashes[1],
        "different seeds visibly vary the plant and pot portrait",
      );
      assert.deepEqual(
        audit.before,
        audit.after,
        "sprites must not resize the scene canvas",
      );
      for (const model of audit.records) {
        assert.ok(model.instances+(model.meshes||0)>0,model.type);
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
      await page
        .locator("#supportParent")
        .selectOption({ label: "三层铁花架" });
      const stableBuilds = await page.evaluate(
        () => rooftop.graphics.modelBuilds,
      );
      for (const surface of ["lower", "upper", "middle"]) {
        await page.locator("#supportLevel").selectOption(surface);
        assert.equal(
          await page.evaluate(
            () => rooftop.layout.scenes.north.at(-1).support.surface,
          ),
          surface,
        );
      }
      assert.equal(
        await page.evaluate(() => rooftop.graphics.modelBuilds),
        stableBuilds,
        "switching tiers reuses object geometry",
      );
      const stableTier = await page.evaluate(async () => {
        const { resolveSupports } = await import(
          "/rooftop/3d/spatial-layout.mjs"
        );
        const child = rooftop.layout.scenes.north.at(-1),
          renderer = rooftop.modelRenderer,
          point = renderer.projectObject(child.id),
          height = resolveSupports(rooftop.layout.scenes.north).get(
            child.id,
          ).height,
          anchor = renderer.pointAtHeight(point.clientX, point.clientY, height);
        return renderer.placementAt(
          point.clientX + 2,
          point.clientY + 1,
          child,
          new Set([child.id]),
          { x: anchor.x - child.x, y: anchor.y - child.y },
        )?.support.surface;
      });
      assert.equal(
        stableTier,
        "middle",
        "small adjustments preserve the explicitly selected tier",
      );
      const arrangement = await page.evaluate(
          () => rooftop.layout.scenes.north,
        ),
        cameraBefore = await page.evaluate(() => rooftop.graphics.wanted),
        rackPoint = await page.evaluate(
          (id) => rooftop.modelRenderer.projectObject(id),
          arrangement[0].id,
        );
      await page.mouse.move(rackPoint.clientX, rackPoint.clientY);
      await page.mouse.down();
      await page.mouse.move(rackPoint.clientX + 55, rackPoint.clientY + 25, {
        steps: 5,
      });
      await page.mouse.up();
      const carried = await page.evaluate(() => rooftop.layout.scenes.north);
      assert.notEqual(carried[0].x, arrangement[0].x);
      assert.equal(
        carried[1].x - carried[0].x,
        arrangement[1].x - arrangement[0].x,
      );
      assert.deepEqual(
        await page.evaluate(() => rooftop.graphics.wanted),
        cameraBefore,
        "object drag cannot orbit or pan the background",
      );
      await page.locator("#rotate").click();
      const rotated = await page.evaluate(() => rooftop.layout.scenes.north);
      assert.equal(rotated[1].rotation, 90);
      assert.equal(rotated[1].support.surface, "middle");
      await page.locator("#scaleUp").click();
      await page.locator("#scaleDown").click();
      assert.deepEqual(
        await page.evaluate(() => rooftop.layout.scenes.north),
        rotated,
      );
      assert.equal(
        await page.evaluate(() => rooftop.graphics.modelBuilds),
        stableBuilds,
        "moving, rotating and scaling furniture reuse geometry",
      );
      await page.locator("#remove").click();
      assert.equal(
        (await page.evaluate(() => rooftop.layout.scenes.north)).length,
        2,
        "occupied rack cannot leave floating contents",
      );
      await page.reload();
      await page.waitForFunction(() => window.rooftop);
      const refreshedPortrait = await page.evaluate(() => {
        const c = document.createElement("canvas");
        c.width = c.height = 128;
        rooftop.modelRenderer.thumbnail({ type: "basil", seed: 2472093529 }, c);
        const pixels = Array.from(
          c.getContext("2d").getImageData(0, 0, 128, 128).data,
        );
        return {
          pixels,
          hash: pixels.reduce(
            (hash, value) => Math.imul(hash ^ value, 16777619) >>> 0,
            2166136261,
          ),
        };
      });
      const drift = [];
      for (let i = 0; i < audit.seedPixels.length; i += 4) {
        if (
          audit.seedPixels
            .slice(i, i + 4)
            .some((n, k) => n !== refreshedPortrait.pixels[i + k])
        )
          drift.push({
            x: (i / 4) % 128,
            y: Math.floor(i / 4 / 128),
            before: audit.seedPixels.slice(i, i + 4),
            after: refreshedPortrait.pixels.slice(i, i + 4),
          });
      }
      // WebKit's framebuffer quantization changes two RGB pixels by 2/255.
      // Keep alpha and the other 16,382 pixels exact; a changed shape, palette,
      // soil field or seed therefore cannot pass this narrow raster tolerance.
      assert.ok(
        drift.length <= 2 &&
          drift.every(
            (pixel) =>
              pixel.before[3] === pixel.after[3] &&
              pixel.before
                .slice(0, 3)
                .every((n, k) => Math.abs(n - pixel.after[k]) <= 2),
          ),
        "the same seed has identical pigment and soil across reloads and scene wind; " +
          JSON.stringify({
            changedPixels: drift.length,
            sample: drift.slice(0, 10),
          }),
      );
      assert.deepEqual(
        await page.evaluate(() => rooftop.layout.scenes.north),
        rotated,
        "explicit middle tier survives reload",
      );
      await page.locator("#clear").click();
      const addAsset = async (query, type) => {
        await page.locator("#search").fill(query);
        await page.locator("[data-asset=" + type + "]").click();
      };
      const clickModel = async (type) => {
        const point = await page.evaluate((type) => {
          const o = rooftop.layout.scenes.north.find((o) => o.type === type);
          return rooftop.modelRenderer.projectObject(o.id);
        }, type);
        await page.mouse.click(point.clientX, point.clientY);
      };
      const small = async () => {
        for (let i = 0; i < 5; i++) await page.locator("#scaleDown").click();
      };
      const categories = await page
        .locator("#categories button")
        .allTextContents();
      assert.deepEqual(categories.slice(1, 9), [
        "仙人掌",
        "多肉",
        "香草",
        "观叶",
        "藤蔓",
        "花卉",
        "蔬果",
        "苔藓",
      ]);
      assert.deepEqual(categories.slice(9, 16), [
        "花架",
        "桌椅与台面",
        "柜床与箱桶",
        "水池台",
        "玻璃罩与保湿柜",
        "空容器",
        "花盆与花器",
      ]);
      // Transparent glass and an explicit retrieval path both preserve selection.
      await addAsset("沃德", "wardcase");
      await addAsset("日轮玉", "new-aucampiae");
      await small();
      await page
        .locator("#supportParent")
        .selectOption({ label: "沃德玻璃箱" });
      const glassPlant = await page.evaluate(() =>
        rooftop.layout.scenes.north.at(-1),
      );
      await clickModel("new-aucampiae");
      assert.equal(
        await page.evaluate(() => rooftop.selected),
        glassPlant.id,
        "glass must pass picking through to the plant",
      );
      await clickModel("wardcase");
      assert.equal(await page.locator("#contentsControl").isVisible(), true);
      await page.locator("#contentsSelect").selectOption(glassPlant.id);
      await page.locator("#remove").click();
      await clickModel("wardcase");
      await page.locator("#remove").click();
      assert.equal(
        (await page.evaluate(() => rooftop.layout.scenes.north)).length,
        0,
        "contents and glass case can both be recovered",
      );
      // Ground access under opaque furniture is not a support dependency.
      await addAsset("工作台", "table");
      await addAsset("工作手套", "gloves");
      await small();
      await page.locator("#supportParent").selectOption({ label: "工作台" });
      await page.locator("#supportLevel").selectOption("under");
      const underGround = await page.evaluate(() =>
        rooftop.layout.scenes.north.at(-1),
      );
      assert.equal(underGround.support, null);
      await clickModel("table");
      assert.ok(
        (await page.locator("#contentsSelect option").allTextContents()).some(
          (t) => t === "下方地面 · 工作手套",
        ),
      );
      const tablePoint = await page.evaluate(() =>
        rooftop.modelRenderer.projectObject(rooftop.layout.scenes.north[0].id),
      );
      await page.mouse.move(tablePoint.clientX, tablePoint.clientY);
      await page.mouse.down();
      await page.mouse.move(tablePoint.clientX + 55, tablePoint.clientY + 25, {
        steps: 5,
      });
      await page.mouse.up();
      assert.deepEqual(
        await page.evaluate(() => rooftop.layout.scenes.north.at(-1)),
        underGround,
        "moving the table leaves the floor item stationary",
      );
      await page.reload();
      await page.waitForFunction(() => window.rooftop);
      assert.deepEqual(
        await page.evaluate(() => rooftop.layout.scenes.north.at(-1)),
        underGround,
      );
      await page.locator("#clear").click();
      // Both washstations expose a continuous perforated deck and one bowl point.
      for (const [query, type] of [
        ["不锈钢水槽", "sink"],
        ["蓝色水池台", "basin"],
      ]) {
        await addAsset(query, type);
        await addAsset("红柄园艺剪", "pruning-shears");
        await small();
        await page.locator("#supportParent").selectOption({ label: query });
        for (const surface of ["counter", "inside", "under"]) {
          await page.locator("#supportLevel").selectOption(surface);
          const child = await page.evaluate(() =>
            rooftop.layout.scenes.north.at(-1),
          );
          assert.equal(
            child.support?.surface || null,
            surface === "under" ? null : surface,
          );
        }
        await page.locator("#clear").click();
      }
      // The stair treads must fit ordinary default-size pots, not only tiny props.
      for (const [query, type] of [
        ["木阶花架", "woodshelf"],
        ["梯形木花架", "ladderstand"],
      ]) {
        await addAsset(query, type);
        await addAsset("金琥", "barrel");
        await page.locator("#supportParent").selectOption({ label: query });
        for (const surface of ["lower", "upper", "middle"]) {
          await page.locator("#supportLevel").selectOption(surface);
          assert.equal(
            await page.evaluate(
              () => rooftop.layout.scenes.north.at(-1).support.surface,
            ),
            surface,
          );
        }
        const stairs = await page.evaluate(() => rooftop.layout.scenes.north);
        await page.reload();
        await page.waitForFunction(() => window.rooftop);
        assert.deepEqual(
          await page.evaluate(() => rooftop.layout.scenes.north),
          stairs,
        );
        await page.locator("#clear").click();
      }
      // A holder can be nested on a middle tier and still hold another object.
      await addAsset("宽网格铁架", "wirestand");
      await addAsset("蓝色收纳箱", "crate");
      await small();
      await page
        .locator("#supportParent")
        .selectOption({ label: "宽网格铁架" });
      await page.locator("#supportLevel").selectOption("middle");
      await addAsset("红柄园艺剪", "pruning-shears");
      await small();
      await page
        .locator("#supportParent")
        .selectOption({ label: "蓝色收纳箱" });
      const nested = await page.evaluate(() => rooftop.layout.scenes.north);
      assert.equal(nested[1].support.surface, "middle");
      assert.equal(nested[2].support.id, nested[1].id);
      await page.reload();
      await page.waitForFunction(() => window.rooftop);
      assert.deepEqual(
        await page.evaluate(() => rooftop.layout.scenes.north),
        nested,
      );
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
      assert.equal(
        await page.locator("#garden").getAttribute("tabindex"),
        "0",
        "3D observation canvas accepts keyboard focus",
      );
      await page.locator("#garden").focus();
      for (let i = 0; i < 6; i++) await page.keyboard.press("+");
      await page.getByRole("button", { name: "移动画面", exact: true }).click();
      await page.locator("#garden").focus();
      const panStart = await page.evaluate(() => rooftop.graphics.target[0]);
      await page.keyboard.press("ArrowRight");
      await page.waitForFunction(
        (x) => Math.abs(rooftop.graphics.target[0] - x) > 0.05,
        panStart,
      );
      await page.getByRole("button", { name: "转动画面", exact: true }).click();
      const homepageLayout = await page.evaluate(() => rooftop.layout),
        homepageBuilds = await page.evaluate(
          () => rooftop.graphics.modelBuilds,
        ),
        beforeDrag = await page.evaluate(() => rooftop.graphics.wanted.theta),
        stage = await page.locator("#garden").boundingBox();
      await page.mouse.move(
        stage.x + stage.width * 0.75,
        stage.y + stage.height * 0.4,
      );
      await page.mouse.down();
      await page.mouse.move(
        stage.x + stage.width * 0.65,
        stage.y + stage.height * 0.45,
        { steps: 6 },
      );
      await page.mouse.up();
      await page.waitForFunction(
        (t) => rooftop.graphics.view.theta > t + 0.1,
        beforeDrag,
      );
      assert.deepEqual(
        await page.evaluate(() => rooftop.layout),
        homepageLayout,
        "homepage orbit never changes placements",
      );
      assert.equal(
        await page.evaluate(() => rooftop.graphics.modelBuilds),
        homepageBuilds,
        "orbit does not rebuild models",
      );
      await page.mouse.wheel(0, -130);
      await page.waitForFunction(() => rooftop.graphics.view.zoom > 1.25);
      assert.ok(await page.evaluate(() => rooftop.graphics.wanted.zoom <= 4.5));
      await page.locator("#garden").press("Home");
      assert.deepEqual(await page.evaluate(() => rooftop.graphics.wanted), {
        theta: -0.12,
        phi: 0.35,
        zoom: 1.8,
      });
      const wind = await page.evaluate(() => rooftop.graphics.foliageMotion);
      assert.ok(wind.programs > 0, "foliage uses a compiled wind shader");
      assert.ok(wind.strength > 0);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(
        (t) => rooftop.graphics.foliageMotion.time > t + 0.05,
        wind.time,
      );
      await page.emulateMedia({ reducedMotion: "no-preference" });
      assert.equal(await page.evaluate(() => rooftop.graphics.controls), "pan");
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
          ? "304 actual models, tier selection, carried contents, drag camera ownership, reload, edit/undo, wardrobe families"
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
