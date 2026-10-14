const { chromium, webkit } = require("playwright");
const out = process.env.QA_OUTPUT || "/tmp";
const assert = require("node:assert/strict");

async function assertEditorLayout(page, { width, height, columns }) {
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
    const placement = document.querySelector('#placementControls');
    const itemControls = document.querySelector('.item-controls');
    const inspector = document.querySelector('.inspector');
    const workspace = document.querySelector('.workspace');
    const catalog = document.querySelector('.catalog');
    const assets = catalog.querySelector('.asset-grid');
    const weather = document.querySelector('.weather-controls');
    const weatherFields = ['weatherSelect', 'timeSelect', 'seasonSelect']
      .map(id => document.getElementById(id).closest('label'));
    const actors = [...document.querySelectorAll('.actor-toggles label')].map(rect);
    const cameraGroups = ['.camera-pan', '.camera-zoom', '.camera-orbit'].map(selector => {
      const group = camera.querySelector(selector);
      return {
        grouped: group?.getAttribute('role') === 'group',
        fits: !!group && contains(camera, group) &&
          [...group.querySelectorAll('button')].every(button => contains(group, button)),
      };
    });
    return {
      fitsPage: document.documentElement.scrollWidth <= innerWidth,
      stage: rect(document.querySelector('#garden')),
      workspace: rect(workspace),
      toolbar: toolbarBox,
      toolbarContent,
      toolbarView: rect(viewTools),
      toolbarLayout: rect(layoutTools),
      camera: rect(camera),
      files: rect(toolbar.querySelector('.layout-transfer')),
      shelf: rect(catalog),
      note: rect(document.querySelector('.note-column')),
      actors,
      cameraGroups,
      cameraBelowScene: toolbar.contains(camera) && !placement.contains(camera),
      toolbarOwnership: viewTools.getAttribute('role') === 'group' &&
        layoutTools.getAttribute('role') === 'group' && viewTools.contains(camera) &&
        ['snap', 'clear', 'restore', 'export'].every(id =>
          layoutTools.contains(document.getElementById(id)) &&
          !viewTools.contains(document.getElementById(id))),
      toolGroupsFit: [viewTools, layoutTools].every(group => contains(toolbar, group) &&
        [...group.querySelectorAll('button, summary, label')]
          .filter(element => !element.closest('.transfer-body') &&
            element.getBoundingClientRect().width > 0)
          .every(element => contains(group, element))),
      toolbarFits: contains(toolbar, camera) &&
        [...toolbar.querySelectorAll('button, summary, label')]
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
      placementFits: [...placement.querySelectorAll('label, select')]
        .every(element => contains(placement, element)),
      objectControlsTogether: itemControls.contains(inspector) && itemControls.contains(placement) &&
        document.querySelector('.note-column').contains(itemControls) &&
        !workspace.contains(inspector) && !workspace.contains(placement) &&
        contains(itemControls, inspector) && contains(itemControls, placement),
      weatherFields: weatherFields.map(rect),
      weatherFits: weatherFields.every(field => contains(weather, field) &&
        contains(field, field.querySelector('select'))),
      catalogCapacity: {
        gridHeight: assets.clientHeight,
        scrollable: ['auto', 'scroll'].includes(getComputedStyle(assets).overflowY),
        overflow: assets.scrollHeight > assets.clientHeight,
        fits: contains(catalog, assets) && catalog.scrollHeight <= catalog.clientHeight + 1 &&
          assets.scrollWidth <= assets.clientWidth + 1,
      },
    };
  });
  assert.ok(layout.fitsPage, `${width} × ${height}: page has no horizontal overflow`);
  assert.ok(Math.abs(layout.stage.width - layout.workspace.width) <= 2,
    'the scene uses the full central workspace width');
  assert.ok(layout.toolbar.y >= layout.stage.bottom - 1,
    'scene and file controls sit below the scene');
  assert.ok(layout.cameraBelowScene, 'camera controls do not share the object placement card');
  assert.ok(layout.objectControlsTogether,
    'placement and object controls remain together in the inspector column, away from the canvas');
  assert.ok(layout.toolbarOwnership && layout.toolGroupsFit,
    'view controls and scene/file controls have distinct containers with complete boundaries');
  assert.ok(Math.abs(layout.camera.x - layout.toolbarContent.left) <= 2 &&
    Math.abs(layout.files.right - layout.toolbarContent.right) <= 2,
  'camera controls align left and scene/file controls align right');
  if (layout.toolbarContent.right - layout.toolbarContent.left <= 580) {
    assert.ok(layout.toolbarLayout.y >= layout.toolbarView.bottom - 1,
      'a narrow workspace puts scene/file controls on the row below the camera');
  } else {
    assert.ok(Math.abs(layout.toolbarLayout.y - layout.toolbarView.y) <= 2 &&
      layout.toolbarView.right <= layout.toolbarLayout.x + 1,
    'a wide workspace places view and scene/file controls on one row');
  }
  assert.ok(layout.toolbarFits && layout.placementFits,
    'visible controls fit inside their own cards');
  assert.ok(layout.popupsFit, 'open import panels fit the page and contain their own controls');
  assert.ok(layout.cameraGroups.every(group => group.grouped && group.fits),
    'pan, zoom and orbit controls remain distinct complete groups');
  assert.equal(layout.actors.length, 2);
  assert.ok(Math.abs(layout.actors[0].y - layout.actors[1].y) <= 2,
    'DongDong and pig display switches share one row');
  assert.ok(layout.weatherFits, 'weather fields and selectors fit inside their environment card');
  if (!columns) {
    assert.ok(layout.weatherFields.every(field =>
      Math.abs(field.y - layout.weatherFields[0].y) <= 2 &&
      Math.abs(field.width - layout.weatherFields[0].width) <= 2),
    'portrait weather, time and season fields form three equally sized columns');
  }
  assert.ok(layout.catalogCapacity.scrollable && layout.catalogCapacity.overflow &&
    layout.catalogCapacity.fits && layout.catalogCapacity.gridHeight >= 80,
  'the item grid retains usable capacity and scrolls inside a bounded catalog');
  if (columns) {
    assert.ok(layout.shelf.right <= layout.workspace.x + 1 &&
      layout.workspace.right <= layout.note.x + 1,
    'catalog, scene and inspector stay in three columns');
    assert.ok(layout.stage.height >= height * (height <= 550 ? .33 : .55),
      'the scene keeps a substantial share of the viewport height');
    assert.ok(layout.toolbar.bottom <= height + 1,
      'the scene and its bottom controls fit in the desktop viewport');
  } else {
    assert.ok(layout.stage.bottom <= layout.shelf.y + 1 &&
      layout.shelf.bottom <= layout.note.y + 1,
    'the scene comes first, followed by the catalog and inspector');
    assert.ok(layout.stage.height >= 320,
      'portrait screens retain a usable scene instead of a small preview');
  }
}

async function assertCatalogScroll(page) {
  const grid = page.locator('.catalog .asset-grid');
  await grid.hover();
  const before = await grid.evaluate(element => ({
    top: element.scrollTop, max: element.scrollHeight - element.clientHeight, pageY: scrollY,
  }));
  const delta = before.top < before.max / 2 ? 240 : -240;
  await page.mouse.wheel(0, delta);
  await page.waitForFunction(top =>
    Math.abs(document.querySelector('.catalog .asset-grid').scrollTop - top) >= 1,
  before.top);
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - before.pageY) <= 1,
    'scrolling the item grid does not move the whole page');
}

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
  await p.waitForFunction(()=>document.querySelector('#garden').dataset.backgroundLoaded==='true');
  const garageGrid = await p.locator('#garden').evaluate(canvas => ({
    sampling: canvas.dataset.sampling, target: canvas.dataset.targetCssPixelStep,
    step: Number(canvas.dataset.physicalPixelStep), ratio: Number(canvas.dataset.pixelRatio),
  }));
  assert.equal(garageGrid.sampling, 'game', 'the public garage retains pixel sampling');
  assert.equal(garageGrid.target, '2', 'arrangement views are slightly clearer than the game');
  assert.equal(garageGrid.step, Math.round(2 * garageGrid.ratio),
    'garage samples use complete device-pixel cells');
  for(const [person,pig] of [[false,true],[true,false],[false,false],[true,true]]) {
    await p.locator('#person').setChecked(person);await p.locator('#pig').setChecked(pig);
    await p.waitForFunction(({person,pig})=>{const d=document.querySelector('#garden').dataset;return d.personVisible===String(person)&&d.pigVisible===String(pig)},{person,pig});
  }
  const cameraTarget=await p.locator('#garden').getAttribute('data-camera-target');
  await p.getByRole('button',{name:'向右移动',exact:true}).click();
  await p.waitForFunction(before=>document.querySelector('#garden').dataset.cameraTarget!==before,cameraTarget);
  const zoom=Number(await p.locator('#garden').getAttribute('data-camera-zoom'));
  await p.getByRole('button',{name:'拉近',exact:true}).click();
  await p.waitForFunction(before=>Number(document.querySelector('#garden').dataset.cameraZoom)>before,zoom);
  await p.getByRole('button',{name:'复位',exact:true}).click();
  const initial=await p.evaluate(async()=> (await import('/rooftop/scene.mjs')).initialLayout());
  assert.deepEqual(await p.evaluate(()=>rooftop.layout),initial,"garage starts with the complete authored arrangement");
  assert.equal(await p.evaluate(()=>rooftop.graphics.objects),initial.scenes.north.length);
  // Isolate the layout/control checks from the large authored furnishing set.
  // A deliberately cleared personal save must load as empty rather than reset.
  const cleared={...initial,scenes:{north:[],south:[],room:[]}};
  await p.evaluate(data=>localStorage.setItem('umwelt-rooftop-layout-v1',JSON.stringify(data)),cleared);
  await p.reload();await p.waitForFunction(()=>window.rooftop);
  assert.deepEqual(await p.evaluate(()=>rooftop.layout),cleared,"an intentionally empty arrangement is preserved");
  await p.locator("[data-asset=barrel]").click();
  assert.equal((await p.evaluate(()=>rooftop.layout.scenes.north)).length,1,"new native plant is hand placed");
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
    await assertEditorLayout(p, { width, height: 1100, columns: true });
  }
  await assertCatalogScroll(p);
  await p.setViewportSize({ width: 1600, height: 1100 });
  await p.waitForTimeout(100);
  const box = await p.locator("#garden").boundingBox(),
    controls = await p.locator(".inspector").boundingBox();
  assert.equal(await p.locator(".note-column .item-controls .inspector").count(), 1);
  assert.ok(box.y + box.height < 1100);
  const northFrame = await p.locator(".canvas-wrap").boundingBox();
  await p.locator("button[data-scene=south]").click();
  await p.waitForTimeout(100);
  const southFrame = await p.locator(".canvas-wrap").boundingBox();
  assert.equal(Math.round(northFrame.width), Math.round(southFrame.width));
  assert.equal(Math.round(northFrame.height), Math.round(southFrame.height));
  assert.equal(await p.locator(".canvas-wrap #weatherStatus").count(), 1);
  assert.equal(await p.locator(".canvas-wrap #message").count(), 1);
  assert.equal(await p.locator("button[data-scene=south]").innerText(), "南阳台");
  assert.equal(await p.locator("button[data-scene=north]").innerText(), "北天台");
  assert.equal(await p.locator(".workspace-toolbar #export").count(), 1);
  assert.equal(await p.locator(".topbar #preview").count(), 1);
  await p.screenshot({ path: out + "/garage-south-native-" + engine + ".png" });
  await p.locator("button[data-scene=room]").click();
  await p.waitForTimeout(100);
  const roomFrame=await p.locator("#garden").boundingBox();
  assert.ok(roomFrame.width>600,"garage room uses the workspace instead of a 340px card");
  assert.ok(Math.abs(roomFrame.width - (await p.locator('.workspace').boundingBox()).width) <= 2,
    'the garage room fills the same central workspace as the terraces');
  assert.ok(roomFrame.y+roomFrame.height<1100);
  await p.locator("button[data-scene=north]").click();
  await p.locator("[data-asset=barrel]").click();
  await p.locator("#scaleUp").click();
  assert.equal(await p.locator("#scaleValue").innerText(), "110%");
  await p.locator(".transfer summary").click();
  assert.ok(await p.locator("#importText").isVisible());
  const dl = p.waitForEvent("download");
  await p.locator("#export").click();
  assert.ok((await dl).suggestedFilename().endsWith(".json"));
  await p.locator(".transfer summary").click();
  for (const w of [900, 390, 320]) {
    await p.setViewportSize({ width: w, height: 844 });
    await p.waitForTimeout(100);
    await assertEditorLayout(p, { width: w, height: 844, columns: false });
    await assertCatalogScroll(p);
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
  await p.locator("button[data-scene=room]").click();
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const narrowRoom=await p.locator("#garden").boundingBox();
  const availableWidth = await p.evaluate(() => document.documentElement.clientWidth);
  assert.ok(narrowRoom.width >= availableWidth * .9 && narrowRoom.width <= availableWidth,
    'the narrow room retains nearly all available page width, including when scrollbars take space');
  assert.ok(narrowRoom.height >= 320, 'the narrow room retains a usable scene height');
  await p.setViewportSize({ width: 844, height: 390 });
  await p.waitForTimeout(100);
  await assertEditorLayout(p, { width: 844, height: 390, columns: true });
  await assertCatalogScroll(p);
  await p.getByRole('button', { name: '复位', exact: true }).click();
  const landscapeTarget = await p.locator('#garden').getAttribute('data-camera-target');
  await p.getByRole('button', { name: '向右移动', exact: true }).click();
  await p.waitForFunction(before => document.querySelector('#garden').dataset.cameraTarget !== before,
    landscapeTarget);
  await p.screenshot({ path: out + '/garage-layout-844x390-' + engine + '.png', fullPage: true });
  assert.deepEqual(errors, []);
  await b.close();
  console.log(engine + " layout passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
