# Test layout

The repository keeps automated tests and browser/manual regression harnesses together under `tests/`, but they have different roles.

## Automated CI tests

Files matching:

```text
tests/*.test.mjs
```

are the default Node test suite and are run by GitHub Actions with:

```bash
node --test tests/*.test.mjs
```

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
