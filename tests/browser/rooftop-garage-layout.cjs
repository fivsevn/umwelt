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
    const placement = document.querySelector('#placementControls');
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
      workspace: rect(document.querySelector('.workspace')),
      toolbar: rect(toolbar),
      shelf: rect(document.querySelector('.catalog')),
      note: rect(document.querySelector('.note-column')),
      actors,
      cameraGroups,
      cameraBelowScene: toolbar.contains(camera) && !placement.contains(camera),
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
    };
  });
  assert.ok(layout.fitsPage, `${width} × ${height}: page has no horizontal overflow`);
  assert.ok(Math.abs(layout.stage.width - layout.workspace.width) <= 2,
    'the scene uses the full central workspace width');
  assert.ok(layout.toolbar.y >= layout.stage.bottom - 1,
    'scene and file controls sit below the scene');
  assert.ok(layout.cameraBelowScene, 'camera controls do not share the object placement card');
  assert.ok(layout.toolbarFits && layout.placementFits,
    'visible controls fit inside their own cards');
  assert.ok(layout.popupsFit, 'open import panels fit the page and contain their own controls');
  assert.ok(layout.cameraGroups.every(group => group.grouped && group.fits),
    'pan, zoom and orbit controls remain distinct complete groups');
  assert.equal(layout.actors.length, 2);
  assert.ok(Math.abs(layout.actors[0].y - layout.actors[1].y) <= 2,
    'DongDong and pig display switches share one row');
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
  assert.deepEqual(await p.evaluate(()=>rooftop.layout.scenes.north),[],"garage starts with an empty terrace");
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
  await p.setViewportSize({ width: 1600, height: 1100 });
  await p.waitForTimeout(100);
  const box = await p.locator("#garden").boundingBox(),
    controls = await p.locator(".inspector").boundingBox();
  assert.equal(await p.locator(".note-column>.inspector").count(), 1);
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
  for (const w of [900, 390]) {
    await p.setViewportSize({ width: w, height: 844 });
    await p.waitForTimeout(100);
    await assertEditorLayout(p, { width: w, height: 844, columns: false });
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
  assert.ok(narrowRoom.width>300&&narrowRoom.width<=390);
  assert.ok(narrowRoom.height >= 320, 'the narrow room retains a usable scene height');
  await p.setViewportSize({ width: 844, height: 390 });
  await p.waitForTimeout(100);
  await assertEditorLayout(p, { width: 844, height: 390, columns: true });
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
