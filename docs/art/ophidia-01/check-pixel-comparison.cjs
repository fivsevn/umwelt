// Local comparison QA. Exercises the actual current raw/pixel/native images.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8788';
const output = process.env.QA_OUTPUT || path.join(require('node:os').tmpdir(), 'ophidia-review', 'pixel');
(async () => {
  fs.mkdirSync(output,{recursive:true});
  const report = [];
  for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch({ headless: true, ...(engineName === 'chromium' ? { channel: 'chrome' } : {}) });
    try {
      for (const [label, width, height] of [['desktop', 1280, 900], ['mobile', 390, 844], ['small', 320, 568]]) {
        const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
        const errors = [], badResponses = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => { if (response.status() >= 400) badResponses.push(response.url()); });
        await page.goto(base + '/docs/art/ophidia-01/preview/pixel-style/index.html');
        const images = page.locator('figure img');
        assert.equal(await images.count(), 3);
        for (const image of await images.all()) {
          await image.scrollIntoViewIfNeeded();
          await page.waitForFunction(node => node.complete && node.naturalWidth > 0, await image.elementHandle());
        }
        const state = await page.evaluate(() => ({
          images: [...document.querySelectorAll('figure img')].map(image => ({
            url: image.currentSrc, width: image.naturalWidth, height: image.naturalHeight,
            rendering: getComputedStyle(image).imageRendering, filter: getComputedStyle(image).filter,
          })),
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
          captions: [...document.querySelectorAll('figcaption')].map(caption => caption.textContent),
        }));
        assert.ok(state.images[0].url.includes('/renders/source-preview.png'));
        assert.ok(state.images[1].url.includes('/ophidia-01/renders/game-composite.png'));
        assert.ok(state.images[2].url.includes('/ophidia-01/renders/snake-detail.png'));
        assert.deepEqual(state.images.slice(0, 2).map(image => [image.width, image.height]), [[360, 640], [360, 640]]);
        assert.equal(state.images[2].width, 1280); assert.equal(state.images[2].height, 800);
        assert.ok(state.images.slice(0, 2).every(image => image.rendering === 'pixelated'));
        assert.ok(state.images.every(image => image.filter === 'none'));
        assert.equal(state.horizontalOverflow, false);
        assert.ok(state.captions[0].includes('原生合成'));
        assert.ok(state.captions[1].includes('近景立绘'));
        assert.ok(state.captions[2].includes('建模近景'));
        assert.deepEqual(errors, []); assert.deepEqual(badResponses, []);
        await page.evaluate(() => scrollTo(0, 0));
        if (engineName === 'chromium') await page.screenshot({ path: path.join(output, `pixel-style-${label}.png`), fullPage: true });
        report.push({ engine: engineName, label, width, height, errors, badResponses, ...state });
        await page.close();
      }
    } finally { await browser.close(); }
  }
  fs.writeFileSync(path.join(output, 'page-check.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('Passed: current native composite / current close portrait / native model comparison; Chromium and WebKit desktop, mobile and small; no resource/script errors or horizontal overflow.');
})().catch(error => { console.error(error); process.exit(1); });
