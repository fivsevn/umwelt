// Run against prepare-site + subset-font + stamp-assets output, never the source server.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium, webkit } = require("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:8794";
const output = process.env.QA_OUTPUT || "/tmp/umwelt-artifact-screenshots";
const routes = [
  ["/", ".desktop-icon"],
  ["/tick/", "#tick"],
  ["/ophidia/", "#startButton"],
  ["/isopoda/", "#startBtn"],
  ["/isopoda/morphology/", ".anatomy-app"],
  ["/isopoda/habitat.html", "#assetList button"],
  ["/rooftop/?scene=north", "#garden"],
  ["/rooftop/?scene=south", "#garden"],
  ["/rooftop/arrange/", "[data-asset=mint]"],
  ["/rooftop/room/", "canvas"],
];
(async () => {
  await fs.mkdir(output, { recursive: true });
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch({
      headless: true,
      ...(engine === chromium
        ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }
        : {}),
    });
    try {
      const context = await browser.newContext();
      // Exercise the deployed live-weather path without making publication
      // depend on a third-party service's availability or the day's weather.
      await context.route('https://api.open-meteo.com/v1/forecast?*', route => route.fulfill({
        status: 200, contentType: 'application/json', headers: {'access-control-allow-origin': '*'},
        body: JSON.stringify({current: {time: Math.floor(Date.now() / 1000), interval: 900,
          weather_code: 2, temperature_2m: 18.4, cloud_cover: 60, wind_speed_10m: 4,
          wind_gusts_10m: 7, precipitation: 0, snowfall: 0}}),
      }));
      // Visual review belongs to the local source tree, never the site artifact.
      for (const route of ["/rooftop/tests/browser/rooftop.html", "/ophidia/art/ophidia-01/preview/model-review.html", "/tools/check-all.mjs", "/rooftop/3d/index.html", "/rooftop/previews/pixel-01/index.html"]) {
        const response = await context.request.get(base + route);
        assert.equal(response.status(), 404, route + " stays out of the published artifact");
      }
      for (const width of [1440, 390]) {
        for (const [index, [route, selector]] of routes.entries()) {
          // Isolate each document's errors while retaining browser cache/storage.
          // Closing a prior page can cancel its lazy thumbnail requests; those
          // cancellations must not be attributed to the next document.
          const page = await context.newPage();
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          page.on("requestfailed", (request) =>
            errors.push(request.url() + ": " + request.failure()?.errorText),
          );
          page.on("response", (response) => {
            if (response.status() >= 400)
              errors.push(response.status() + " " + response.url());
          });
          await page.setViewportSize({ width, height: 900 });
          const startedAt = Date.now();
          console.log(`${engine.name()} ${width} ${route}: checking`);
          // Software WebGL compiles the terrace's materials at first entry.
          // Keep the normal load check, with a larger budget for these routes.
          const response = await page.goto(
            base + route,
            route.startsWith("/rooftop/") ? { timeout: 90000 } : {},
          );
          assert.ok(
            response.ok() || response.status() === 304,
            route + " document status " + response.status(),
          );
          await page.locator(selector).first().waitFor({ state: "visible" });
          await page.evaluate(() => document.fonts.ready);
          if (route.startsWith('/rooftop/?')) {
            await page.waitForFunction(() => document.querySelector('#environmentHud [data-info="weather"]')?.textContent.includes('多云 18°'));
            assert.equal(await page.locator('#environmentHud [data-info="coordinates"]').textContent(), '32.02°N 120.86°E');
            assert.equal(await page.locator('#environmentHud a').count(), 0, 'weather attribution is plain text');
            assert.equal(await page.locator('#environmentHud .weather-credit').textContent(), 'Open-Meteo');
          }
          if (
            engine === chromium &&
            route.startsWith("/rooftop/")
          ) {
            await page.waitForFunction(
              () =>
                window.rooftop?.graphics?.drawCalls > 0 ||
                window.room?.graphics?.drawCalls > 0,
              null,
              { timeout: 90000 },
            );
            if (route.includes("room/")) {
              await page.waitForFunction(() => window.room?.graphics?.roomBackground?.loaded, null, { timeout: 90000 });
              assert.equal(await page.locator("#room").getAttribute("data-room-door-parts"), "14");
              assert.equal(await page.locator("#room").getAttribute("data-room-background-error"), null);
            } else {
              await page.waitForFunction(() => window.rooftop?.graphics?.terraceFinishes?.loaded, null, { timeout: 90000 });
              const finishes = await page.evaluate(() => rooftop.graphics.terraceFinishes);
              assert.equal(finishes.enabled, true, "published terraces use the approved native finishes");
              assert.equal(finishes.error, null);
              assert.equal(finishes.triangles, 5064);
            }
            const graphics = await page.evaluate(
              () => window.rooftop?.graphics || window.room.graphics,
            );
            assert.equal(graphics.catalog, 294);
            assert.ok(graphics.drawCalls > 0);
            assert.equal(graphics.raster.enabled, true, "formal room, garage and observation use game sampling");
            assert.ok(graphics.raster.pixelStep >= 2, "formal pages retain visible grain");
            assert.equal(
              graphics.controls,
              route.includes("arrange")
                ? "edit"
                : route.includes("room")
                  ? "orbit"
                  : "pan",
            );
          }
          if (route.startsWith("/rooftop/?")) {
            // Public game entries retain their authored arrangement and narrative controls.
            // A door behind a real wall/roof must not intercept view gestures.
            const publicState = await page.evaluate(() => ({
              layout: rooftop.layout,
              scene: rooftop.scene,
              graphics: rooftop.graphics,
              present: rooftop.presence.present,
              personSheltered: !!rooftop.person.insideShelter,
              pigSheltered: !!rooftop.pig.insideShelter,
            }));
            const startingLayout = await page.evaluate(async () => {
              const { initialLayout } = await import("/rooftop/scene.mjs");
              return initialLayout();
            });
            assert.deepEqual(publicState.layout, startingLayout);
            if (publicState.graphics.drawCalls) {
              assert.equal(publicState.graphics.narrativeView, "drone");
              assert.equal(publicState.graphics.stationTravel.current.height, publicState.scene === "north" ? 5.25 : 3);
              assert.equal(publicState.graphics.stationTravel.current.dolly, -2, "the published default uses the approved horizontal retreat");
              assert.equal(publicState.graphics.stationTravel.limits.height - publicState.graphics.stationTravel.current.height, 1.5);
              assert.equal(publicState.graphics.actorsHidden, false,
                "the published game enables Dongdong and the pig");
              assert.deepEqual(publicState.graphics.actorVisibility,
                {person:publicState.present&&!publicState.personSheltered,pig:!publicState.pigSheltered},
                "public actors retain the existing errands and shelter states");
              await page.waitForFunction(() => rooftop.graphics.background.loaded && rooftop.graphics.terraceFinishes?.loaded);
              for (const view of ["drone", "neighbor", "bird"]) {
                await page.locator('[data-narrative-view="' + view + '"]').click();
                await page.waitForFunction(name => rooftop.graphics.narrativeView === name, view);
                assert.equal(await page.locator('[data-narrative-view="' + view + '"]').getAttribute("aria-pressed"), "true");
                if (view === 'neighbor') {
                  for (const selector of ['#environmentHud', '.corner-cards', '#notebook', '.terminal-enter'])
                    assert.equal(await page.locator(selector).isVisible(), false);
                  assert.equal(await page.locator('.view-controls button:visible').count(), 1);
                  await page.locator('[data-narrative-view="neighbor"]').click();
                  await page.waitForFunction(() => rooftop.graphics.narrativeView === 'drone');
                  assert.equal(await page.locator('#environmentHud').isVisible(), true);
                }
                if (view === "bird") assert.equal(await page.locator("#sceneDoor").isVisible(), false,
                  "the bird's real eave view does not expose the door behind it");
              }
            }
            const nextScene = publicState.scene === "north" ? "south" : "north";
            await page.locator("#sceneCard").click();
            await page.waitForFunction(name => rooftop.scene === name, nextScene);
            if (publicState.graphics.drawCalls) {
              await page.waitForFunction(name => rooftop.graphics.scene === name, nextScene);
              assert.equal(await page.evaluate(() => rooftop.graphics.narrativeView), "bird");
            }
            assert.equal(new URL(page.url()).searchParams.get("scene"), nextScene);
            assert.deepEqual(await page.evaluate(() => rooftop.layout), publicState.layout,
              "view/scene controls preserve layout data");
          }
          if(route.includes('/rooftop/room/')) {
            const originalRoom=await page.evaluate(()=>window.room.layout);
            await page.locator('#outfits [data-category="1960–70s"]').click();
            await page.locator('#outfitsOptions [data-value="denim"]').click();
            assert.deepEqual(await page.evaluate(()=>[window.room.outfit,window.room.pig]),['denim','denim']);
            assert.equal(await page.locator('#noteName').textContent(),'双层牛仔');
            assert.ok(await page.locator('#noteSources a').count());
            await page.locator('#decorations [data-category="古典"]').click();
            await page.locator('#decorationsOptions [data-value="tang"]').click();
            assert.deepEqual(await page.evaluate(()=>[window.room.outfit,window.room.pig]),['denim','tang']);
            for(const action of ['water','tea','rest']) {
              await page.locator('#activities [data-value="'+action+'"]').click();
              assert.equal(await page.evaluate(()=>window.room.activity),action);
            }
            assert.deepEqual(await page.evaluate(()=>window.room.layout),originalRoom);
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
          }
          if(route.startsWith('/rooftop/?')) {
            await page.locator('#notebookOpen').click();
            await page.locator('#reviewEntry').selectOption('fashion:smoking');
            assert.equal(await page.locator('#noteName').textContent(),'Le Smoking');
            assert.equal(await page.locator('#reviewEntry option[value^="fashion:"]').count(),60);
            await page.locator('#notebookClose').click();
            await page.locator('.terminal-enter').click();
            await page.waitForFunction(() => document.querySelector('#environmentHud [data-info="coordinates"]')?.textContent === '7C4A : 0FB2');
            assert.equal(await page.locator('#garden').getAttribute('data-terminal-crt'), 'true');
            const terminal = await page.evaluate(() => {
              const screen = document.querySelector('.terminal-screen').getBoundingClientRect();
              const dock = document.querySelector('#terminalLogDock').getBoundingClientRect();
              const rows = [...document.querySelectorAll('#statusLog > *')].filter(row => row.getBoundingClientRect().height);
              return {
                ratio: screen.width / screen.height,
                overflow: document.documentElement.scrollWidth > innerWidth,
                font: getComputedStyle(document.querySelector('#statusLog')).fontFamily,
                rows: rows.length,
                complete: rows.every(row => {
                  const bounds = row.getBoundingClientRect(), text = row.querySelector('.status-text');
                  return bounds.top >= dock.top && bounds.bottom <= dock.bottom && text.scrollWidth <= text.clientWidth;
                }),
                hud: document.querySelector('#environmentHud').innerText,
                hints: [...document.querySelectorAll('#environmentHud [title]')].map(node => node.title).join(' '),
              };
            });
            assert.ok(Math.abs(terminal.ratio - 4 / 3) < .001, 'the television retains its picture ratio');
            assert.equal(terminal.overflow, false);
            assert.match(terminal.font, /Pixel/);
            assert.equal(terminal.rows, 3);
            assert.equal(terminal.complete, true, 'all three journal lines remain complete');
            assert.doesNotMatch(terminal.hud + terminal.hints, /°|濠河|南通|北京时间|UTC|\d{4}\.\d{2}\.\d{2}/);
            assert.equal(await page.locator('#terminalSourceDock #sceneCard').count(), 1);
            assert.equal(await page.locator('#terminalAudioDock #musicToggle').count(), 1);
            for (const selector of ['#notebookOpen', '#roomCard', '#garageCard', '#sceneDoor', '#notebook'])
              assert.equal(await page.locator(selector).isVisible(), false, selector + ' stays outside the television');
            await page.locator('[data-narrative-view="drone"]').click();
            await page.locator('[data-narrative-view="neighbor"]').click();
            assert.equal(await page.locator('.narrative-views button:visible').count(), 3, 'the outer television retains all camera selectors');
            assert.equal(await page.locator('#environmentHud').isVisible(), true);
            await page.locator('[data-narrative-view="drone"]').click();
            await page.locator('.terminal-power').click();
            await page.waitForFunction(() => document.querySelector('#environmentHud [data-info="coordinates"]')?.textContent.includes('°N'));
            assert.equal(await page.locator('#garden').getAttribute('data-terminal-crt'), 'false');
            assert.equal(await page.locator('.status-actions #sceneCard').count(), 1);
            assert.equal(await page.locator('.status-actions #musicToggle').count(), 1);
            const power = await page.locator('.terminal-enter').boundingBox();
            const viewport = page.viewportSize();
            assert.ok(viewport.width - power.x - power.width >= 24 && viewport.height - power.y - power.height >= 24,
              'the television switch leaves room at both screen edges');
            assert.ok(await page.locator('#environmentHud [data-info="weather"]').textContent().then(text => text.includes('多云 18°')));
          }
          await page.waitForTimeout(250);
          if (process.env.EXPECTED_SHA) {
            const urls = await page
              .locator("script[src],link[rel=stylesheet]")
              .evaluateAll((elements) => elements.map((e) => e.src || e.href));
            assert.ok(urls.length, route + " runtime assets");
            for (const url of urls)
              assert.equal(
                new URL(url).searchParams.get("v"),
                process.env.EXPECTED_SHA,
                route + " deployed version",
              );
          }
          await page.screenshot({
            path: `${output}/${engine.name()}-${width}-${index}.png`,
            fullPage: true,
          });
          assert.deepEqual(
            errors,
            [],
            engine.name() + " " + route + " runtime/resource errors",
          );
          console.log(
            `${engine.name()} ${width} ${route}: passed in ${Date.now() - startedAt}ms`,
          );
          await page.close();
        }
      }
      console.log(engine.name() + ": " + routes.length * 2 + " final artifact entry checks passed");
    } finally {
      await browser.close();
    }
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
