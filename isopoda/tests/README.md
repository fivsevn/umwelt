# 等足目测试

[游戏文档](../README.md) · [全项目测试](../../tests/README.md)

从仓库根目录运行。Node 测试使用 `node --test isopoda/tests/*.test.mjs`；完整结构检查使用 `node tools/check-all.mjs`，其中包含物种、环境、叙事、语言与实验室验证。

`browser/` 保存观察、实验室与语言检查，`fixtures/` 保存历史存档，`support/` 保存等足目专用测试辅助。浏览器脚本需要已启动的本地服务、Playwright 及对应浏览器；用 `BASE_URL`、`BROWSER`、`QA_OUTPUT` 指定地址、浏览器和仓库外截图目录。

```sh
BASE_URL=http://127.0.0.1:8765 node isopoda/tests/browser/morphology-layout.cjs
BROWSER=webkit BASE_URL=http://127.0.0.1:8765 node isopoda/tests/browser/morphology-layout.cjs
```

CI 的 `morphology-layout.yml` 保留两种浏览器和原有专项矩阵。跨主页、蜱虫和等足目的整体对照仍在根 `tests/browser/public-regression.cjs`。

## 入口与存档前置条件

地下水要求完成陆地观察，深海要求完成沙滩观察，饲养箱要求完成一次观察且有合格标本。不能仅添加收藏就认定入口已解锁，也不能点击 disabled 按钮后假定已进入观察。`entry-gates.cjs` 从空存档实际完成观察验证解锁与刷新；`support/observation-fixtures.cjs` 只为其他测试准备既有完成记录。

普通群体与稀有访客分开计数。指针测试先把画布滚入视口，再按当时镜头和可见像素计算坐标；WebKit 鼠标坐标不能落在视口之外。

## 语言与完整观察

`browser/game-locales.cjs` exercises composed terrestrial observations, dynamic specimen prompts and evening movement memories in four languages at 320, 390 and 1440 pixels in Chromium and WebKit. It checks feedback, saved-run reload, journal copy, a full seven-day observation and restart. Run with `BASE_URL`, `BROWSER` and optional `QA_OUTPUT`. `game-locales.test.mjs` checks all seven days across seeded branches and every evening variant paired with specimen memories.

## Habitat lab editor regression

`browser/habitat-lab.cjs` exercises every registered habitat preset, registry coverage, JSON/share/file round trips, import failure rollback, real game-scale specimen pixels, equal-depth selection, layer edits, imported scales, responsive dragging, transfer-panel placement and game-save isolation. It runs in both browser jobs alongside the morphology regression.

```sh
BASE_URL=http://127.0.0.1:8765 node isopoda/tests/browser/habitat-lab.cjs
BROWSER=webkit BASE_URL=http://127.0.0.1:8765 node isopoda/tests/browser/habitat-lab.cjs
```

`CHROME_PATH` optionally selects a local Chromium executable; `QA_OUTPUT` saves screenshots outside the site. The scene-codec Node tests also import every shipped authored layout, including named bark tones.

## Sand excavation

`browser/sandy-surf.cjs` checks quiet buried residents, hold-to-dig/lift, drag/release, cancelled holds, empty digs, four languages, save/reload and the live post-ending scene at 320, 390 and 1440 pixels. Run with `BROWSER=webkit` for the second engine, `BASE_URL` for a server, `CHROME_PATH` for Chromium, and `QA_OUTPUT` for screenshots. Chromium mobile cases use real touch events. `sandy-surf.test.mjs` covers burial visibility, recovery, natural cycles, narrative completion and legacy pending scenes.

The sand cover and excavation are habitat effects, not new anatomical poses. Scientific sources are shared between the two laboratories; the habitat reference describes accelerated timing, visual cues and the weaker species-specific evidence for E. spinigera.

## Petri dish microscope

`isopoda/tests/petri.test.mjs` checks single-specimen draws, circular containment, per-step operation gates and saved progress. `isopoda/tests/browser/petri.cjs` runs the nine observations at 320, 390 and 1440 pixels in Chromium or WebKit (`BROWSER=webkit`). It covers microscope entry, physical-style rotary controls, focus, magnification, panning, illumination, return to overview, 32× reload, four languages and the standalone ending. `BASE_URL` selects a served repository; `QA_OUTPUT` selects screenshot output. Microscope magnifications are authored display enlargement, not calibrated optical measurements.

Petri refinement also checks equal archive/microscope button sizes, filled background edges, touch/drag/keyboard dial control, three choices, no visible numeric controls, pre-adjusted magnification remaining locked, and optical edge dispersion/defocus rendering.

## Observation scales

`browser/scene-readouts.cjs` checks all eight non-estuary environments in four languages at 320, 390 and 1440 px: three numeric readings plus one qualitative state, unclipped text, complete story progression (petri has its dedicated full harness), saved feedback, changing story clocks/depths, the petri local clock and live focus control, and per-environment laboratory references. Use `BASE_URL`, `BROWSER`, `QA_OUTPUT`, and optionally `CHROME_PATH`. The browser workflow runs it in Chromium and WebKit. `scene-readouts.test.mjs` checks complete narratives, localization, saved readings and focus semantics. Legacy Estuary keeps its existing display; the nearshore prototype uses three numeric readings, tide state and local coordinates.

`browser/estuary-shore.cjs` covers the nearshore full flow and twelve laboratory layouts in Chromium and WebKit at 320, 390 and 1440 px. `browser/estuary-shore-motion.cjs` checks visible isopod, reed and water-fauna animation in all twelve point/tide combinations, coordinate stability and the one-time opening hint. Both use `BASE_URL`, `BROWSER`, and optionally `CHROME_PATH`.

`browser/estuary-shore-interaction.cjs` verifies the live 1×/16×/64× clock, return to 1×, unchanged narrative tide, picking up and placing visible isopods at all three banks, no snap-back after release, and interrupted gestures. It runs mouse input in Chromium/WebKit and native touch in Chromium, with reduced motion enabled.

## 场景渲染对照

`rendering.browser.mjs` 比较直接绘制与缓存合成的场景像素，连续切换湿度和遮蔽物抬升量，共 12 组，检查缓存失效与透明图层的舍入误差。它已接入 `morphology-layout.yml` 的 Chromium / WebKit 矩阵；本地不指定 `BROWSER` 时依次运行两种浏览器。

```sh
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs BASE_URL=http://127.0.0.1:8765 node isopoda/tests/rendering.browser.mjs
```

已移除不适配现有观察入口的历史通用点击循环。各环境完整流程与存档继续由 `browser/` 中的专项检查负责；整理前后的画面、文本与存档对照使用根 `tests/browser/public-regression.cjs`。

The root `tests/site-artifact.test.mjs` protects the tracked-file publication boundary and module preloads. `sprite-color-cache.test.mjs` compares the optimized sprite renderer against uncached color arithmetic across every species, pose and frame.
