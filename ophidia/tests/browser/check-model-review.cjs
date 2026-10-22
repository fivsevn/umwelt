// Local authored-page review; no browser control or publication.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8788';
const output = process.env.QA_OUTPUT || path.join(require('node:os').tmpdir(), 'ophidia-review', 'model');
const expectedViews = ['vessel-overview', 'vessel-plan', 'exterior-deck', 'service-counter', 'entrance-fittings', 'complete-booth', 'booth-reverse', 'interior-overall', 'saloon-depth', 'cup-detail', 'grey-booth', 'snake-detail', 'character-face-detail', 'character-cloth-detail', 'pose-sheet', 'game-composite'];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const report = [];
  for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch({ headless: true, ...(engineName === 'chromium' ? { channel: 'chrome' } : {}) });
    try {
      for (const [label, width, height] of [['desktop', 1280, 1000], ['mobile', 390, 844], ['small', 320, 568]]) {
        const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
        const errors = [], badResponses = [], views = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => { if (response.status() >= 400) badResponses.push(response.url()); });
        await page.goto(base + '/ophidia/art/ophidia-01/preview/model-review.html');
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.title(), '体温调节 · 船舱餐厅');
        assert.deepEqual(await page.locator('[data-view]').evaluateAll(elements => elements.map(element => element.dataset.view)), expectedViews);
        const initialFrame = await page.locator('.model-frame').boundingBox();
        for (const view of expectedViews) {
          await page.locator(`[data-view="${view}"]`).click();
          await page.waitForFunction(expected => {
            const image = document.querySelector('#modelImage');
            return image.complete && image.naturalWidth > 0 && image.currentSrc.endsWith('/' + expected + '.png?v=current');
          }, view);
          const state = await page.evaluate(() => {
            const image = document.querySelector('#modelImage');
            const frame = document.querySelector('.model-frame').getBoundingClientRect();
            return {
              url: image.currentSrc, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
              frame: { width: frame.width, height: frame.height },
              pressed: [...document.querySelectorAll('[aria-pressed=true]')].map(button => button.dataset.view),
              caption: document.querySelector('#modelCaption').textContent,
              imageFit: getComputedStyle(image).objectFit, rendering: getComputedStyle(image).imageRendering,
              overflow: document.documentElement.scrollWidth > innerWidth
            };
          });
          assert.ok(state.naturalWidth > 0 && state.naturalHeight > 0);
          assert.deepEqual(state.pressed, [view]);
          assert.ok(state.caption.length > 8);
          assert.ok(Math.abs(state.frame.width / state.frame.height - 8 / 5) < .005);
          assert.ok(Math.abs(state.frame.height - initialFrame.height) < 1);
          assert.equal(state.imageFit, 'contain');
          assert.equal(state.overflow, false);
          if (view === 'game-composite' || view === 'pose-sheet') assert.equal(state.rendering, 'pixelated');
          views.push({ view, ...state });
        }
        for (const reference of await page.locator('.references img').all()) {
          await reference.scrollIntoViewIfNeeded();
          await page.waitForFunction(image => image.complete && image.naturalWidth > 0, await reference.elementHandle());
        }
        assert.equal(await page.locator('.references figure').count(), 8);
        assert.equal(await page.locator('.references a[href="https://ainosaimaa.fi/"]').count(), 4);
        assert.equal(await page.locator('.references img.plan').count(), 1);
        const speciesResponse=await page.request.get(base+'/ophidia/art/snakes/boaedon-capensis/reference/species.md');
        assert.equal(speciesResponse.status(),200);
        assert.ok((await speciesResponse.text()).includes('Boaedon capensis'));
        assert.ok((await page.locator('footer').textContent()).includes('创作估算'));
        await page.locator('[data-view="vessel-overview"]').click();
        await page.waitForFunction(() => document.querySelector('#modelImage').complete && document.querySelector('#modelImage').naturalWidth > 0);
        await page.evaluate(() => scrollTo(0, 0));
        if (engineName === 'chromium') await page.screenshot({ path: path.join(output, `model-review-${label}.png`), fullPage: true });
        assert.deepEqual(errors, []);
        assert.deepEqual(badResponses, []);
        report.push({ engine: engineName, label, width, height, errors, badResponses, views });
        await page.close();
      }
    } finally { await browser.close(); }
  }
  fs.writeFileSync(path.join(output, 'model-review-check.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('Passed: all 16 viewpoints, 8 public vessel and booth references, desktop/mobile/small in Chromium and WebKit, fixed frame, no image or script errors.');
})().catch(error => { console.error(error); process.exit(1); });
