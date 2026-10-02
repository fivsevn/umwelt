# Test layout

The repository keeps automated tests and browser/manual regression harnesses together under `tests/`, but they have different roles.

## Automated CI tests

Files matching:

```text
tests/*.test.mjs
```

are the default Node test suite and can still be run directly with:

```bash
node --test tests/*.test.mjs
```

For the full non-browser structural gate used by the ISOPODA CI workflow, run:

```bash
node isopoda/tools/check-all.mjs
```

That entry point runs the Node tests plus localization, species, habitat, narrative, morphology-page and public-surface checks in a fixed order. It does not run browser/visual regression or deployment font tooling.

These tests protect game state, habitats, localization, morphology, scenery, interactions, save compatibility and other deterministic/runtime contracts.

## Test support

- `fixtures/` — stable test fixtures such as historical save data.
- `support/scenery-study.mjs` — support module imported by `scenery.test.mjs`.

These are support files, not standalone CI test entry points.

## Browser / visual regression harnesses

Files such as:

- `browser/browser-habitats.cjs`
- `browser/pointer-browser.cjs`
- `browser/browser-checks.mjs`
- `browser/morphology.html`
- `browser/pixel-life.html`

are browser-oriented regression or diagnostic harnesses. They are intentionally not matched by the default Node test glob. Some require a local HTTP server, Playwright/Chrome, or manual inspection.

Do not rename a browser harness to `*.test.mjs` unless it is safe and deterministic in the normal CI environment.

## Maintenance rule

Runtime behavior should be covered by a `*.test.mjs` test when practical. Browser-only checks should stay clearly separated from the default CI suite and should not become production dependencies.

## Public output comparison

`browser/public-regression.cjs` covers 320×568, 390×844 and 1440×900 in Chromium or WebKit, four public routes, terrestrial/abyssal arrival, choice, feedback, reload and Credits. It fixes date/randomness and steps animation frames only inside the test browser. With `COMPARE_URL`, it requires identical screenshots, visible text, overflow state and saved JSON against a separately served baseline. Without a baseline it checks runtime errors, assets and core interactions; it does not establish pixel equivalence.

```sh
BASE_URL=http://127.0.0.1:8765 COMPARE_URL=http://127.0.0.1:8766 node tests/browser/public-regression.cjs
BROWSER=webkit BASE_URL=http://127.0.0.1:8765 COMPARE_URL=http://127.0.0.1:8766 node tests/browser/public-regression.cjs
```

Use `QA_OUTPUT` outside the site for screenshots. The existing morphology workflow runs both harnesses in each browser. `data-contracts.test.mjs` adds schema, narrative and invalid-input checks; `asset-stamping.test.mjs` covers the deployment URL transform. Existing compatibility tests remain in place.


## Habitat lab editor regression

`browser/habitat-lab.cjs` exercises all five presets, registry coverage, JSON/share/file round trips, import failure rollback, real game-scale specimen pixels, equal-depth selection, layer edits, imported scales, responsive dragging, transfer-panel placement and game-save isolation. It runs in both browser jobs alongside the morphology regression.

```sh
BASE_URL=http://127.0.0.1:8765 node tests/browser/habitat-lab.cjs
BROWSER=webkit BASE_URL=http://127.0.0.1:8765 node tests/browser/habitat-lab.cjs
```

`CHROME_PATH` optionally selects a local Chromium executable; `QA_OUTPUT` saves screenshots outside the site. The scene-codec Node tests also import every shipped authored layout, including named bark tones.

## Sand excavation

`browser/sandy-surf.cjs` checks quiet buried residents, hold-to-dig/lift, drag/release, cancelled holds, empty digs, four languages, save/reload and the live post-ending scene at 320, 390 and 1440 pixels. Run with `BROWSER=webkit` for the second engine, `BASE_URL` for a server, `CHROME_PATH` for Chromium, and `QA_OUTPUT` for screenshots. Chromium mobile cases use real touch events. `sandy-surf.test.mjs` covers burial visibility, recovery, natural cycles, narrative completion and legacy pending scenes.

The sand cover and excavation are habitat effects, not new anatomical poses. Scientific sources are shared between the two laboratories; the habitat reference describes accelerated timing, visual cues and the weaker species-specific evidence for E. spinigera.

## Petri dish microscope

`tests/petri.test.mjs` checks single-specimen draws, circular containment, per-step operation gates and saved progress. `tests/browser/petri.cjs` runs the nine observations at 320, 390 and 1440 pixels in Chromium or WebKit (`BROWSER=webkit`). It covers microscope entry, physical-style rotary controls, focus, magnification, panning, illumination, return to overview, 32× reload, four languages and the standalone ending. `BASE_URL` selects a served repository; `QA_OUTPUT` selects screenshot output. Microscope magnifications are authored display enlargement, not calibrated optical measurements.

Petri refinement also checks equal archive/microscope button sizes, filled background edges, touch/drag/keyboard dial control, three choices, no visible numeric controls, pre-adjusted magnification remaining locked, and optical edge dispersion/defocus rendering.

## Observation scales

`browser/scene-readouts.cjs` checks all eight non-estuary environments in four languages at 320, 390 and 1440 px: three numeric readings plus one qualitative state, unclipped text, complete story progression (petri has its dedicated full harness), saved feedback, changing story clocks/depths, the petri local clock and live focus control, and per-environment laboratory references. Use `BASE_URL`, `BROWSER`, `QA_OUTPUT`, and optionally `CHROME_PATH`. The browser workflow runs it in Chromium and WebKit. `scene-readouts.test.mjs` checks complete narratives, localization, saved readings and focus semantics. Legacy Estuary keeps its existing display; the nearshore prototype uses three numeric readings, tide state and local coordinates.

`browser/estuary-shore.cjs` covers the nearshore full flow and twelve laboratory layouts in Chromium and WebKit at 320, 390 and 1440 px. `browser/estuary-shore-motion.cjs` checks visible isopod, reed and water-fauna animation in all twelve point/tide combinations, coordinate stability and the one-time opening hint. Both use `BASE_URL`, `BROWSER`, and optionally `CHROME_PATH`.

`browser/estuary-shore-interaction.cjs` verifies the live 1×/16×/64× clock, return to 1×, unchanged narrative tide, picking up and placing visible isopods at all three banks, no snap-back after release, and interrupted gestures. It runs mouse input in Chromium/WebKit and native touch in Chromium, with reduced motion enabled.

## Legacy rendering harness limitation

`rendering.browser.mjs` still includes a historical all-habitats loop which assumes every stage exposes a choice button immediately. Interactive observation gates no longer satisfy that assumption; a `Missing choice` result from that loop is not evidence of a production regression. Use the habitat-specific harnesses under `browser/` for those interactions, and `browser/public-regression.cjs` for baseline pixel/text/save comparisons. Its preceding scenery pixel comparison remains useful.

`site-artifact.test.mjs` protects the tracked-file publication boundary and module preloads. `sprite-color-cache.test.mjs` compares the optimized sprite renderer against uncached color arithmetic across every species, pose and frame.

天台无视觉变化维护使用 `browser/rooftop-maintenance.cjs`；模块职责与对比运行方式见 [天台维护指南](../docs/rooftop-maintenance.md)。

天台扩容：`node --test tests/rooftop*.test.mjs`；`browser/rooftop-expansion.cjs` 在 Chromium / WebKit 验证分类、手帐、承托、存档、昼夜灯光、透明像素、旋转与手机布局。`BASE_URL` 可指向已部署页面。

花农时代的 `rooftop-regression.yml` 在 Chromium / WebKit 自动运行维护、车库布局和房间回归。`rooftop-room.cjs` 验证房间与车库共享存档、跨页面同步、换装和活动反馈、导入导出及手机布局。维护脚本的 `COMPARE_URL` 可对照三个车库场景和三个公开入口，共 36 组画面。

## System and observation prerequisites

`system-regression.yml` runs homepage, cross-game language, TICK and shared audio checks in Chromium/WebKit. `entry-gates.cjs` starts with empty storage, verifies locked entries in four languages, then completes land and beach observations through the real UI and verifies persistent unlocks. Existing unlocked-scene suites use `support/observation-fixtures.cjs`; this test fixture never enables controls or changes production rules.

Sand and kelp pointer checks scroll the canvas into view before selecting a visible coordinate. Ordinary cohort counts are checked independently of rare visitors. Use `QA_OUTPUT` outside the repository for screenshots.

最终发布成品检查：`BASE_URL=http://127.0.0.1:8794 EXPECTED_SHA=<完整提交SHA> node tests/browser/published-artifact.cjs`。服务根目录必须是完成字体子集和资源版本标记的发布目录；Pages 工作流自动运行 Chromium 与 WebKit，并保存截图。
