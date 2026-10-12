const assert = require("node:assert/strict");
const { chromium, webkit } = require("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:8773";
const engine = process.env.BROWSER || "chromium";

async function assertRoomLayout(page, { width, height, columns }) {
  const layout = await page.evaluate(() => {
    const rect = (element) => {
      const { x, y, width, height, right, bottom } = element.getBoundingClientRect();
      return { x, y, width, height, right, bottom };
    };
    const contains = (parent, child) => {
      const a = rect(parent), b = rect(child);
      return b.x >= a.x - 1 && b.right <= a.right + 1 &&
        b.y >= a.y - 1 && b.bottom <= a.bottom + 1;
    };
    const toolbar = document.querySelector('.workspace-toolbar');
    const camera = document.querySelector('#editCameraControls');
    const viewTools = toolbar.querySelector('.toolbar-view');
    const layoutTools = toolbar.querySelector('.toolbar-layout');
    const toolbarBox = rect(toolbar), toolbarStyle = getComputedStyle(toolbar);
    const toolbarContent = {
      left: toolbarBox.x + parseFloat(toolbarStyle.paddingLeft),
      right: toolbarBox.right - parseFloat(toolbarStyle.paddingRight),
    };
    const activities = document.querySelector('.room-activities');
    const wardrobe = document.querySelector('.room-wardrobe');
    return {
      fitsPage: document.documentElement.scrollWidth <= innerWidth,
      stage: rect(document.querySelector('#room')),
      workspace: rect(document.querySelector('.workspace')),
      toolbar: toolbarBox,
      toolbarContent,
      toolbarView: rect(viewTools),
      toolbarLayout: rect(layoutTools),
      camera: rect(camera),
      files: rect(toolbar.querySelector('.layout-transfer')),
      wardrobe: rect(wardrobe),
      note: rect(document.querySelector('.note-column')),
      actors: [...document.querySelectorAll('.actor-toggles label')].map(rect),
      cameraBelowScene: toolbar.contains(camera),
      toolbarOwnership: viewTools.getAttribute('role') === 'group' &&
        layoutTools.getAttribute('role') === 'group' && viewTools.contains(camera) &&
        layoutTools.contains(document.querySelector('#exportRoom')) &&
        layoutTools.contains(toolbar.querySelector('details.transfer')) &&
        !viewTools.contains(document.querySelector('#exportRoom')),
      toolGroupsFit: [viewTools, layoutTools].every(group => contains(toolbar, group) &&
        [...group.querySelectorAll('button, summary')]
          .filter(element => !element.closest('.transfer-body') &&
            element.getBoundingClientRect().width > 0)
          .every(element => contains(group, element))),
      toolbarFits: contains(toolbar, camera) &&
        [...toolbar.querySelectorAll('button, summary')]
          .filter(element => !element.closest('.transfer-body') &&
            element.getBoundingClientRect().width > 0)
          .every(element => contains(toolbar, element)),
      popupsFit: [...toolbar.querySelectorAll('details.transfer')]
        .filter(details => details.open)
        .every(details => {
          const popup = details.querySelector('.transfer-body');
          if (!popup) return false;
          const box = rect(popup);
          return box.width > 0 && box.height > 0 && box.x >= -1 && box.right <= innerWidth + 1 &&
            [...popup.querySelectorAll('button, input, select, textarea, label')]
              .filter(element => element.getBoundingClientRect().width > 0)
              .every(element => contains(popup, element));
        }),
      cameraGroups: ['.camera-pan', '.camera-zoom', '.camera-orbit'].map(selector => {
        const group = camera.querySelector(selector);
        return !!group && group.getAttribute('role') === 'group' && contains(camera, group) &&
          [...group.querySelectorAll('button')].every(button => contains(group, button));
      }),
      activitiesSeparate: ['#activities', '#pigActivities', '#facing'].every(selector =>
        activities.contains(document.querySelector(selector)) &&
        !toolbar.contains(document.querySelector(selector))),
      panelsFit: wardrobe.scrollWidth <= wardrobe.clientWidth &&
        activities.scrollWidth <= activities.clientWidth,
    };
  });
  assert.ok(layout.fitsPage, `${width} × ${height}: room has no horizontal overflow`);
  assert.ok(Math.abs(layout.stage.width - layout.workspace.width) <= 2,
    'the room uses the full central workspace width');
  assert.ok(layout.toolbar.y >= layout.stage.bottom - 1 && layout.cameraBelowScene,
    'room view and file controls sit below the scene');
  assert.ok(layout.toolbarOwnership && layout.toolGroupsFit,
    'room camera and file controls have distinct containers with complete boundaries');
  assert.ok(Math.abs(layout.camera.x - layout.toolbarContent.left) <= 2 &&
    Math.abs(layout.files.right - layout.toolbarContent.right) <= 2,
  'room camera controls align left and file controls align right');
  if (layout.toolbarContent.right - layout.toolbarContent.left <= 580) {
    assert.ok(layout.toolbarLayout.y >= layout.toolbarView.bottom - 1,
      'a narrow room workspace puts file controls on the row below the camera');
  } else {
    assert.ok(Math.abs(layout.toolbarLayout.y - layout.toolbarView.y) <= 2 &&
      layout.toolbarView.right <= layout.toolbarLayout.x + 1,
    'a wide room workspace places view and file controls on one row');
  }
  assert.ok(layout.toolbarFits && layout.panelsFit,
    'view, file, wardrobe and activity controls fit their own cards');
  assert.ok(layout.popupsFit, 'open room import panels fit the page and contain their own controls');
  assert.ok(layout.cameraGroups.every(Boolean),
    'room pan, zoom and orbit controls remain distinct complete groups');
  assert.ok(layout.activitiesSeparate,
    'character activities and facing do not share the camera controls');
  assert.equal(layout.actors.length, 2);
  assert.ok(Math.abs(layout.actors[0].y - layout.actors[1].y) <= 2,
    'room character display switches share one row');
  if (columns) {
    assert.ok(layout.wardrobe.right <= layout.workspace.x + 1 &&
      layout.workspace.right <= layout.note.x + 1,
    'wardrobe, room and activities stay in three columns');
    assert.ok(layout.stage.height >= height * (height <= 550 ? .33 : .55),
      'the room keeps a substantial share of the viewport height');
    assert.ok(layout.toolbar.bottom <= height + 1,
      'the room and its bottom controls fit in the desktop viewport');
  } else {
    assert.ok(layout.stage.bottom <= layout.wardrobe.y + 1 &&
      layout.wardrobe.bottom <= layout.note.y + 1,
    `the room comes first, followed by wardrobe and activities at ${width}x${height}: ${JSON.stringify({stage:layout.stage,wardrobe:layout.wardrobe,note:layout.note})}`);
    assert.ok(layout.stage.height >= 320, 'portrait screens retain a usable room scene');
  }
}

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
      await page.locator("button[data-scene=room]").getAttribute("aria-pressed"),
      "true",
    );
    assert.deepEqual(await page.evaluate(() => rooftop.layout.scenes.room),[],"new room starts empty");
    const fixture=require("../fixtures/rooftop-native-layout.json");
    await page.evaluate(data=>localStorage.setItem("umwelt-rooftop-layout-v1",JSON.stringify(data)),fixture);
    await page.reload();await page.waitForFunction(()=>window.rooftop);
    const initial = await page.evaluate(() => rooftop.layout);
    assert.ok(initial.scenes.room.length>=4,"explicit native furniture fixture exercises clear/undo and room export");
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
    await room.waitForFunction(() => document.querySelector('#room').dataset.roomBackgroundLoaded === 'true');
    const roomGrid = await room.locator('#room').evaluate(canvas => ({
      sampling: canvas.dataset.sampling, target: canvas.dataset.targetCssPixelStep,
      step: Number(canvas.dataset.physicalPixelStep), ratio: Number(canvas.dataset.pixelRatio),
    }));
    assert.equal(roomGrid.sampling, 'game', 'the public room retains pixel sampling');
    assert.equal(roomGrid.target, '2', 'arrangement views are slightly clearer than the game');
    assert.equal(roomGrid.step, Math.round(2 * roomGrid.ratio),
      'room samples use complete device-pixel cells');
    for (const [person, pig] of [[false, true], [true, false], [false, false], [true, true]]) {
      await room.locator('#person').setChecked(person);
      await room.locator('#pig').setChecked(pig);
      await room.waitForFunction(({ person, pig }) => {
        const state = document.querySelector('#room').dataset;
        return state.personVisible === String(person) && state.pigVisible === String(pig);
      }, { person, pig });
    }
    assert.deepEqual(
      await room.evaluate(() => room.layout),
      initial.scenes.room,
    );
    await page.locator("#clear").click();
    await room.waitForFunction(() => room.layout.length === 0);
    await page.keyboard.press("Control+z");
    await room.waitForFunction(
      (count) => window.room.layout.length === count,
      initial.scenes.room.length,
    );
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
    await room.locator(".transfer summary").click();
    for (const viewport of [
      { width: 1600, height: 844, columns: true },
      { width: 900, height: 844, columns: false },
      { width: 390, height: 844, columns: false },
      { width: 320, height: 844, columns: false },
      { width: 844, height: 390, columns: true },
    ]) {
      const { width, height } = viewport;
      await room.setViewportSize({ width, height });
      await room.waitForTimeout(100);
      await assertRoomLayout(room, viewport);
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
            process.env.QA_OUTPUT + "/room-" + width + "x" + height + "-" + engine + ".png",
          fullPage: true,
        });
    }
    await room.getByRole('button', { name: '复位', exact: true }).click();
    const landscapeTarget = await room.locator('#room').getAttribute('data-camera-target');
    await room.getByRole('button', { name: '向右移动', exact: true }).click();
    await room.waitForFunction(before => document.querySelector('#room').dataset.cameraTarget !== before,
      landscapeTarget);
    const landscapeZoom = Number(await room.locator('#room').getAttribute('data-camera-zoom'));
    await room.getByRole('button', { name: '拉近', exact: true }).click();
    await room.waitForFunction(before => Number(document.querySelector('#room').dataset.cameraZoom) > before,
      landscapeZoom);
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
          "room undo redo, terrace isolation, cross-tab synchronization, wardrobe, activity feedback, export import rollback, reload, independent actors, grouped controls, portrait and landscape workspace, camera movement",
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
