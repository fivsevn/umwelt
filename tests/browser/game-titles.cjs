const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium, webkit} = require('playwright');
const base = (process.env.BASE_URL || 'http://127.0.0.1:8765').replace(/\/$/, '');
const output = process.env.QA_OUTPUT;
// Explicit expected copy catches accidental changes to the shared title registry.
const games = {
  tick: ['TICK.SYS', '三个信号', 'Three Signals', '三つの信号'],
  isopoda: ['ISOPODA.EXE', '等足目赋格', 'Isopoda Fugue', '等脚目のフーガ'],
  rooftop: ['ROOFTOP.EXE', '花农时代', 'Horticultural Era', '園芸時代'],
  ophidia: ['OPHIDIA.EXE', '体温调节', 'Thermoregulation', '体温調節'],
};

(async () => {
  const name = process.env.BROWSER || 'chromium';
  const browser = await {chromium, webkit}[name].launch({
    headless: true,
    ...(name === 'chromium' ? {args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']} : {}),
  });
  if (output) await fs.mkdir(output, {recursive: true});
  try {
    for (const width of [320, 1440]) {
      for (const [language, column] of [['zh', 1], ['en', 2], ['ja', 3]]) {
        const context = await browser.newContext({viewport: {width, height: 900}});
        // Title checks should not depend on the external weather service.
        await context.route('https://api.open-meteo.com/v1/forecast?*', route => route.fulfill({
          status: 200, contentType: 'application/json', headers: {'access-control-allow-origin': '*'},
          body: JSON.stringify({current: {time: Math.floor(Date.now() / 1000), interval: 900,
            weather_code: 2, temperature_2m: 18.4, cloud_cover: 60, wind_speed_10m: 4,
            wind_gusts_10m: 7, precipitation: 0, snowfall: 0}}),
        }));
        await context.addInitScript(language => {
          localStorage.setItem('umwelt-desktop-language', language);
          localStorage.setItem('isopoda-ui-language-v1', language);
          localStorage.setItem('umwelt-ophidia-language', language);
        }, language);
        const errors = [];
        const newPage = async () => {
          const page = await context.newPage();
          page.on('pageerror', error => {errors.push(error.message); console.error(`${name} ${language} ${width}: ${error.message}`);});
          page.on('response', response => {
            if (response.status() >= 400 && new URL(response.url()).origin === new URL(base).origin) errors.push(`${response.status()} ${response.url()}`);
          });
          return page;
        };
        const finishPage = async page => {
          assert.deepEqual(errors, [], `${name} ${language} ${width}: ${page.url()}`);
          // Closing a page cancels lazy asset loads; those teardown errors must
          // not be attributed to the next game. Keep the shared language state.
          page.removeAllListeners('pageerror');
          page.removeAllListeners('response');
          await page.close();
        };
        const page = await newPage();
        await page.goto(base + '/');
        await page.waitForFunction(() => document.querySelector('#desktopTime').textContent.length === 5);
        for (const [id, labels] of Object.entries(games)) {
          const link = page.locator(`a[href="./${id}/"]`);
          assert.equal(await link.locator('small').innerText(), labels[column]);
          const filename = await link.evaluate(element => [...element.lastElementChild.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('').trim());
          assert.equal(filename, labels[0], `${language}: program filename`);
        }
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.locator('#closeWelcome').click();
        if (output) await page.screenshot({path: path.join(output, `titles-${name}-${language}-${width}.png`)});
        await finishPage(page);
        for (const [id, labels] of Object.entries(games)) {
          const page = await newPage();
          await page.goto(`${base}/${id}/`);
          const expected = language === 'en' ? labels[2] : `${labels[2]} / ${labels[column]}`;
          await page.waitForFunction(title => document.title === title, expected).catch(async error => {
            throw new Error(`${name} ${language} ${width} /${id}/: expected ${expected}; received ${await page.title()}; errors: ${JSON.stringify(errors)}; ${error.message}`);
          });
          if (id === 'isopoda') {
            await page.waitForFunction(() => !!document.querySelector('#startBtn')?.onclick).catch(error => {
              throw new Error(`${name} ${language} ${width}: Isopoda initialization failed: ${JSON.stringify(errors)}; ${error.message}`);
            });
            assert.match(await page.locator('#titleCard .window-title span').innerText(), /^ISOPODA\.EXE \/ /);
          }
          if (id === 'ophidia') {
            assert.equal(await page.locator('#game').getAttribute('aria-label'), labels[column]);
          }
          console.log(`${name} ${language} ${width}: /${id}/ title verified`);
          await finishPage(page);
        }
        await context.close();
      }
    }
    console.log(`${name}: three languages, four fixed filenames, four readable titles and game pages at two widths passed.`);
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
