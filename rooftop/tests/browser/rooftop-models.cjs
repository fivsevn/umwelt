const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium, webkit } = require("playwright");
const engine = process.env.BROWSER || "chromium",
  base = process.env.BASE_URL || "http://127.0.0.1:8773";
async function visiblePickPoint(page, id) {
  await page.waitForFunction(() => {
    const g = rooftop.graphics;
    return g.nativeItems.pending === 0 && ["theta", "phi", "zoom"].every(k => Math.abs(g.view[k] - g.wanted[k]) < .005);
  });
  return page.evaluate(id => {
    const renderer = rooftop.modelRenderer, centre = renderer.projectObject(id),
      canvas = document.querySelector("#garden"), rect = canvas.getBoundingClientRect(),
      step = Math.max(1, Number(canvas.dataset.physicalPixelStep) / Number(canvas.dataset.pixelRatio));
    if (!centre) throw Error("Native model has no projected bounds: " + id);
    const hit = (dx, dy) => {
      const clientX = centre.clientX + dx, clientY = centre.clientY + dy;
      if (clientX <= rect.left || clientX >= rect.right || clientY <= rect.top || clientY >= rect.bottom) return null;
      return renderer.pick(clientX, clientY)?.id === id ? { clientX, clientY, id } : null;
    };
    // Open racks have empty space at their projected bounds centre. Probe the
    // actual shared raster cells until a visible frame or board owns the ray.
    for (let radius = 0; radius <= Math.min(180, Math.max(rect.width, rect.height) / 3); radius += step)
      for (let offset = -radius; offset <= radius; offset += step) {
        const point = hit(offset, -radius) || hit(offset, radius) || hit(-radius, offset) || hit(radius, offset);
        if (point) return point;
      }
    throw Error("No visible native mesh can be picked for " + id);
  }, id);
}
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
    const defaultLayout=await page.evaluate(async()=> (await import('/rooftop/scene.mjs')).initialLayout());
    assert.deepEqual(await page.evaluate(()=>rooftop.layout),defaultLayout,
      "a new garage starts with the authored arrangement");
    // This suite audits lazy catalogue loading and isolated placements. Start
    // those checks with an explicit cleared personal layout, independent of defaults.
    await page.evaluate(data=>localStorage.setItem('umwelt-rooftop-layout-v1',JSON.stringify(data)),
      {...defaultLayout,scenes:{north:[],south:[],room:[]}});
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.rooftop);
    const webgl = await page.evaluate(() => !!rooftop.modelRenderer);
    if (engine === "chromium")
      assert.ok(webgl, "software WebGL must create models");
    if (webgl) {
      await page.waitForFunction(() =>
        document.querySelector('#assets canvas[data-renderer="blender-preview"], #assets img[data-renderer="native-image"]'),
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
      assert.ok(style.nativeItems.loaded <= 3,"formal catalog images do not preload a shelf of native GLBs");
      assert.ok(style.nativeItems.atlases <= 1,"only the resident hand prop may load its authoring family at startup");
      assert.equal(style.textures,1,"the resident and door painting book remains shared separately");
      assert.ok(
        style.drawCalls < 1000,
        "leaves reuse surfaces rather than one draw per leaf",
      );
      assert.ok(
        style.surfaces < 260,
        "bounded shared surfaces including the expanded vessel profiles",
      );
      await page.waitForFunction(() => rooftop.graphics.background.loaded, null, { timeout: 90000 });
      const background = await page.evaluate(() => rooftop.graphics.background);
      assert.equal(background.source, "Blender");
      assert.equal(background.textureAuthor, "Pixelorama");
      assert.equal(background.row.homes, 6);
      assert.equal(background.row.pairs, 3);
      assert.ok(background.layers.near.triangles > 0 && background.layers.far.triangles > 0);
      const declaredBytes = await page.evaluate(async () => {
        const { BACKGROUND } = await import("/rooftop/assets/background/empty-rooftop.mjs");
        return BACKGROUND.bytes + BACKGROUND.textures.reduce((total, texture) => total + texture.bytes, 0);
      });
      assert.equal(background.payloadBytes, declaredBytes, "loaded environment matches the native export payload");
      // Match the native export budget in rooftop-background.test.mjs. The
      // physical floor/wall charts and distant atlases total about 8.3 MiB.
      assert.ok(background.payloadBytes < 12000000, "runtime environment stays below the native export budget");
      assert.ok(style.groundY < -18, "six storeys meet community ground");
      const audit = await page.evaluate(async () => {
        const { ASSETS } = await import("/rooftop/scene.mjs"),
          renderer = rooftop.modelRenderer;
        const before = rooftop.graphics.buffer, records = [], empty = [];
        // Preload bounded batches, then inspect the exact native models. A
        // pending thumbnail must never be mistaken for missing geometry.
        for (let index = 0; index < ASSETS.length; index += 4) {
          const batch = ASSETS.slice(index, index + 4);
          await Promise.all(batch.map(a => renderer.preloadModel({ type: a.id })));
          for (const a of batch) {
            records.push(await renderer.catalogModel(a.id));
            const c = document.createElement("canvas"); c.width = c.height = 64;
            await renderer.thumbnail({ type: a.id, seed: 1835 }, c, true);
            const pixels = c.getContext("2d").getImageData(0, 0, 64, 64).data;
            let painted = 0;
            for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) painted++;
            if (painted < 8) empty.push(a.id);
          }
        }
        const seedPortraits = [];
        for (const seed of [2472093529, 1029384756]) {
          const c = document.createElement("canvas"); c.width = c.height = 128;
          await renderer.thumbnail({ type: "basil", seed }, c, true);
          const pixels = Array.from(c.getContext("2d").getImageData(0, 0, 128, 128).data);
          seedPortraits.push({ pixels, hash: pixels.reduce((hash, value) => Math.imul(hash ^ value, 16777619) >>> 0, 2166136261) });
        }
        return {
          records,
          empty,
          seedHashes: seedPortraits.map((p) => p.hash),
          seedPixels: seedPortraits[0].pixels,
          before,
          after: rooftop.graphics.buffer,
          native: rooftop.graphics.nativeItems,
        };
      });
      assert.equal(audit.records.length, 294);
      assert.equal(audit.native.loaded,294,"all catalog sources share one cached model each");
      assert.equal(audit.native.atlases,7,"one canonical native atlas per authoring family");
      assert.equal(audit.native.pending,0);
      assert.deepEqual(audit.native.errors,[]);
      assert.deepEqual(audit.empty, []);
      assert.notEqual(
        audit.seedHashes[0],
        audit.seedHashes[1],
        "different seeds visibly vary the native rooted specimen orientation",
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
        assert.equal(model.source,"Blender",model.type);
        assert.equal(model.textureAuthor,"Pixelorama",model.type);
        assert.ok(model.modelId && model.family,model.type + " source identity");
      }
      // Inspect the changed artwork through the actual game controls. These
      // captures use the same renderer, backdrop and saved-layout path as play.
      const artOutput=process.env.QA_OUTPUT || "/tmp/rooftop-models";
      await fs.mkdir(artOutput,{recursive:true});
      await page.locator("#weatherSelect").selectOption("clear");
      await page.locator("#timeSelect").selectOption("day");
      await page.waitForFunction(()=>rooftop.weather.transition.mix>.999);
      await page.locator("#clear").click();
      for(const [query,id] of [["三阶斜式木架","step-rack"],["浇水壶","watering-can"],["铁质三层架","iron-3-black"]]){
        await page.locator("#search").fill(query);
        await page.locator("[data-asset="+id+"]").click();
      }
      await page.locator("#garden").focus();
      for(let i=0;i<4;i++)await page.keyboard.press("+");
      await page.waitForFunction(()=>Math.abs(rooftop.graphics.view.zoom-rooftop.graphics.wanted.zoom)<.01);
      await page.screenshot({path:artOutput+"/nonplant-game-arrange.png",fullPage:true});
      await page.locator("#garden").press("Home");
      // Real controls, picking and dragging verify the shared placement contract.
      await page.locator("#clear").click();
      await page.locator("#search").fill("铁质三层架");
      await page.locator("[data-asset=iron-3-black]").click();
      await page.locator("#search").fill("金琥");
      await page.locator("[data-asset=barrel]").click();
      await page
        .locator("#supportParent")
        .selectOption({ label: "铁质三层架 · 黑色" });
      const stableBuilds = await page.evaluate(
        () => rooftop.graphics.modelBuilds,
      );
      for (const surface of ["shelf-1", "shelf-3", "shelf-2"]) {
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
        "shelf-2",
        "small adjustments preserve the explicitly selected tier",
      );
      const arrangement = await page.evaluate(
          () => rooftop.layout.scenes.north,
        ),
        cameraBefore = await page.evaluate(() => rooftop.graphics.wanted),
        rackPoint = await visiblePickPoint(page, arrangement[0].id);
      assert.equal(rackPoint.id, arrangement[0].id, "drag begins on the actual visible rack frame or board");
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
      assert.equal(rotated[1].support.surface, "shelf-2");
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
      const refreshedPortrait = await page.evaluate(async () => {
        const c = document.createElement("canvas");
        c.width = c.height = 128;
        await rooftop.modelRenderer.thumbnail({ type: "basil", seed: 2472093529 }, c, true);
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
        await page.waitForFunction(() => rooftop.graphics.nativeItems.pending === 0, null, { timeout: 90000 });
      };
      const clickModel = async (type) => {
        const id = await page.evaluate(type => rooftop.layout.scenes.north.find(o => o.type === type).id, type),
          point = await visiblePickPoint(page, id);
        await page.mouse.click(point.clientX, point.clientY);
      };
      const small = async () => {
        for (let i = 0; i < 5; i++) await page.locator("#scaleDown").click();
      };
      const categories = await page
        .locator("#categories button")
        .allTextContents();
      assert.deepEqual(categories.slice(2, 10), [
        "仙人掌",
        "多肉",
        "香草",
        "观叶",
        "藤蔓",
        "花卉",
        "蔬果",
        "苔藓",
      ]);
      assert.deepEqual(categories.slice(10), ["架子", "桌椅与居室", "栽培与盛放", "日用与照明", "收藏", "枪械", "兵器"]);
      // Filled native aquariums have glass walls and a real water volume; they
      // do not advertise an empty cavity for arbitrary nested furniture.
      await addAsset("长方玻璃鱼缸", "aquarium-rectangle");
      const aquarium = await page.evaluate(async () => {
        const { supportSurfaces } = await import("/rooftop/3d/spatial-layout.mjs");
        return supportSurfaces(rooftop.layout.scenes.north.at(-1));
      });
      assert.deepEqual(aquarium, []);
      await page.locator("#clear").click();
      // Ground access under opaque furniture is not a support dependency.
      await addAsset("方木桌", "wood-square-table");
      await addAsset("园艺铲", "trowel");
      await small();
      await page.locator("#supportParent").selectOption({ label: "方木桌" });
      await page.locator("#supportLevel").selectOption("under");
      const underGround = await page.evaluate(() =>
        rooftop.layout.scenes.north.at(-1),
      );
      assert.equal(underGround.support, null);
      await clickModel("wood-square-table");
      assert.ok(
        (await page.locator("#contentsSelect option").allTextContents()).some(
          (t) => t === "下方地面 · 园艺铲",
        ),
      );
      const tableId = await page.evaluate(() => rooftop.layout.scenes.north[0].id),
        tablePoint = await visiblePickPoint(page, tableId);
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
      // Native sink descriptors expose their actual deck and basin floor.
      for (const [query, type, surfaces] of [
        ["不锈钢水槽", "steel-sink", ["drainboard", "basin-floor"]],
        ["蓝色水池台", "enamel-basin", ["basin-floor"]],
      ]) {
        await addAsset(query, type); await addAsset("喷壶", "trigger-sprayer"); await small();
        await page.locator("#rotate").click();
        await page.locator("#supportParent").selectOption({ label: query });
        for (const surface of surfaces) {
          await page.locator("#supportLevel").selectOption(surface);
          assert.equal(await page.evaluate(() => rooftop.layout.scenes.north.at(-1).support?.surface), surface);
        }
        await page.locator("#clear").click();
      }
      // Each actual stair tread and wood board must fit a default rooted pot.
      for (const [query, type, surfaces] of [
        ["三阶斜式木架", "step-rack", ["step-1", "step-3", "step-2"]],
        ["木质三层架", "wood-3", ["shelf-1", "shelf-3", "shelf-2"]],
      ]) {
        await addAsset(query, type); await addAsset("金琥", "barrel");
        await page.locator("#supportParent").selectOption({ label: query });
        for (const surface of surfaces) {
          await page.locator("#supportLevel").selectOption(surface);
          assert.equal(await page.evaluate(() => rooftop.layout.scenes.north.at(-1).support.surface), surface);
        }
        const stairs = await page.evaluate(() => rooftop.layout.scenes.north);
        await page.reload(); await page.waitForFunction(() => window.rooftop);
        assert.deepEqual(await page.evaluate(() => rooftop.layout.scenes.north), stairs);
        await page.locator("#clear").click();
      }
      // A holder can be nested on a middle tier and still hold another object.
      await addAsset("铁质三层架", "iron-3-silver");
      await addAsset("蓝色周转箱", "crate-blue");
      await small();
      await page
        .locator("#supportParent")
        .selectOption({ label: "铁质三层架 · 银色" });
      await page.locator("#supportLevel").selectOption("shelf-2");
      await addAsset("园艺剪", "pruning-shears");
      await small();
      await page
        .locator("#supportParent")
        .selectOption({ label: "蓝色周转箱" });
      const nested = await page.evaluate(() => rooftop.layout.scenes.north);
      assert.equal(nested[1].support.surface, "shelf-2");
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
      const point = await visiblePickPoint(page, initial.id);
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
      const beforeRestore=await page.evaluate(()=>rooftop.layout);
      await page.locator("#restore").click();
      const authored=await page.evaluate(async()=> (await import('/rooftop/scene.mjs')).initialLayout());
      assert.deepEqual(await page.evaluate(()=>rooftop.layout.scenes.north),authored.scenes.north,
        "restore returns the active terrace to the authored default");
      for(const scene of ['south','room'])assert.deepEqual(await page.evaluate(scene=>rooftop.layout.scenes[scene],scene),beforeRestore.scenes[scene],
        "restore preserves arrangements in the other scenes");
      // Test live foliage on the restored plants, not a transient thumbnail program.
      await page.waitForFunction(()=>rooftop.graphics.nativeItems.pending===0&&rooftop.graphics.foliageMotion.programs>0,null,{timeout:90000});
      const output = process.env.QA_OUTPUT || "/tmp/rooftop-models";
      await fs.mkdir(output, { recursive: true });
      await page.screenshot({
        path: output + "/garage-3d.png",
        fullPage: true,
      });
      // The placement editor keeps live plant motion, including reduced-motion preferences.
      const wind = await page.evaluate(() => rooftop.graphics.foliageMotion);
      assert.ok(wind.programs > 0, "foliage uses its compiled wind shader");
      assert.ok(wind.strength > 0);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(time => rooftop.graphics.foliageMotion.time > time + .05, wind.time);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const storedArrangement = await page.evaluate(() => localStorage.getItem("umwelt-rooftop-layout-v1"));
      await page.goto(base + "/rooftop/?weather=clear&time=day&season=summer");
      await page.waitForFunction(() => rooftop.graphics?.drawCalls > 0 && rooftop.graphics.background.loaded, null, { timeout: 90000 });
      assert.equal(await page.locator("#garden").getAttribute("tabindex"), "0", "observation canvas accepts keyboard focus");
      const homepageLayout = await page.evaluate(() => rooftop.layout), homepageBuilds = await page.evaluate(() => rooftop.graphics.modelBuilds);
      assert.deepEqual(homepageLayout, JSON.parse(storedArrangement), "the public view displays the saved editor arrangement");
      assert.equal(await page.evaluate(()=>rooftop.graphics.objects),homepageLayout.scenes.north.length);
      assert.equal(await page.evaluate(() => rooftop.graphics.actorsHidden), false,
        "the public game enables Dongdong and the pig");
      const publicActors=await page.evaluate(()=>({visible:rooftop.graphics.actorVisibility,
        present:rooftop.presence.present,personSheltered:!!rooftop.person.insideShelter,pigSheltered:!!rooftop.pig.insideShelter}));
      assert.deepEqual(publicActors.visible,{person:publicActors.present&&!publicActors.personSheltered,pig:!publicActors.pigSheltered},
        "rendered actors follow the existing errands and shelter states");
      assert.equal(await page.evaluate(() => rooftop.graphics.narrativeView), "drone");
      assert.equal(await page.evaluate(() => rooftop.graphics.stationTravel.current.height), 5.25);
      await page.locator('[data-narrative-view="bird"]').click();
      await page.waitForFunction(() => rooftop.graphics.narrativeView === "bird");
      assert.equal(await page.locator("#sceneDoor").isVisible(), false, "a door behind the bird does not intercept dragging");
      const beforeWalk = await page.evaluate(() => rooftop.graphics.stationTravel.wanted.walk), stage = await page.locator("#garden").boundingBox();
      await page.mouse.move(stage.x + stage.width * .6, stage.y + stage.height * .5);
      await page.mouse.down();
      await page.mouse.move(stage.x + stage.width * .6 + 90, stage.y + stage.height * .5 + 15, { steps: 6 });
      await page.mouse.up();
      await page.waitForFunction(walk => rooftop.graphics.stationTravel.wanted.walk < walk - .5, beforeWalk);
      assert.equal(await page.evaluate(() => rooftop.scene), "north");
      await page.locator("#garden").focus();
      await page.keyboard.press("+");
      await page.mouse.wheel(0, -130);
      assert.equal(await page.evaluate(() => rooftop.graphics.wanted.zoom), 1, "bird magnification remains fixed");
      await page.screenshot({ path: output + "/authored-game-north-bird.png", fullPage: true });
      for (const view of ["drone", "neighbor"]) {
        await page.locator('[data-narrative-view="' + view + '"]').click();
        await page.waitForFunction(name => rooftop.graphics.narrativeView === name, view);
        assert.equal(await page.locator('[data-narrative-view="' + view + '"]').getAttribute("aria-pressed"), "true");
      }
      const scopeZoom = await page.evaluate(() => rooftop.graphics.wanted.zoom);
      await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
      await page.mouse.wheel(0, -130);
      await page.waitForFunction(zoom => rooftop.graphics.wanted.zoom > zoom, scopeZoom);
      assert.equal(await page.locator(".neighbor-scope").isVisible(), true);
      assert.deepEqual(await page.evaluate(() => rooftop.layout), homepageLayout, "observer controls never alter placements");
      assert.equal(await page.evaluate(() => rooftop.graphics.modelBuilds), homepageBuilds, "view changes do not rebuild catalogue geometry");
      assert.equal(await page.evaluate(() => localStorage.getItem("umwelt-rooftop-layout-v1")), storedArrangement, "the public view retains saved editor bytes");
      assert.equal(await page.evaluate(() => rooftop.graphics.controls), "pan");
      await page.locator('[data-narrative-view="neighbor"]').click();
      await page.waitForFunction(() => rooftop.graphics.narrativeView === 'drone');
      await page.locator("#sceneCard").click();
      await page.waitForFunction(() => rooftop.graphics.scene === "south");
      assert.deepEqual(await page.evaluate(() => rooftop.layout), homepageLayout);
      await page.goto(base + "/rooftop/room/");
      await page.waitForFunction(() => room.graphics?.drawCalls > 0);
      for (const key of [
        "古典",
        "1900–50s",
        "1960–70s",
        "1980–90s",
        "2000s",
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
        "古典",
        "1900–50s",
        "1960–70s",
        "1980–90s",
        "2000s",
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
          ? "294 cached native models and 7 canonical atlases, tier selection, carried contents, drag camera ownership, reload, edit/undo, wardrobe families"
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
