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

