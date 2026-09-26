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
