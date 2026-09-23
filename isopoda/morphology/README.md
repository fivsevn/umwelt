# Morphology laboratory

`/isopoda/morphology/` is the sole public morphology route.

- `index.html`: complete accessible document; no iframe, fetched template, or runtime HTML rewrites.
- `style.css`: component styling and responsive layout. Assets resolve relative to this directory.
- `app.mjs`: shared species/renderer imports, evidence rendering, selection, VHS feeds, and optical sizing.

The species list/count comes from `../species-registry.mjs`. Anatomy comes from the shared `pixelAnatomy()` renderer. Do not duplicate either data set here.

## Layout contract

At widths above 1120px, named grid areas place the layer controls on the left, the optical table in the center, and the inspector, dossier and references on the right. Rows grow with their content. The reference list alone has a desktop maximum height and its own scrollbar; the document remains scrollable when other content grows or the viewport is short.

At 1120px and below, the DOM and visual order is inspector → optical table → layer controls → dossier → references. All content flows vertically and the reference list uses document scrolling. Smaller typography at 620px does not introduce another composition.

The dossier and references are independent native disclosures. The dossier starts closed and references start open; mouse or keyboard activation of each summary toggles that panel. Both retain their item cards and count-only summaries. Collapsed references size to their summary instead of stretching into an empty grid row.

All five panels own their borders. Do not use `display:contents` on a bordered panel or constrain a content panel to a fixed height. Additional right-column panels need a named area and a deliberate place in the mobile reading order. Adding rows/cards within existing panels requires no layout change.

The optical table has four flow rows: label, optical field, two-monitor row, hint. Absolute positions belong only to the renderer coordinate system and monitor overlays. The 640×520 stage never flex-shrinks. `centerSpecimen()` measures painted pixels; `ResizeObserver` fits them into the available field. Transparent canvas margins do not determine the visual center. New renderer layers must retain the existing native 64×64 / displayed 320×320 coordinate contract or update that conversion explicitly.

Header metrics and green terminal colors match `../habitat.css`. This repair does not modify habitat assets. Keep the two pages' visual language aligned when changing these metrics.

## Verification

Serve the repository root, then run:

```sh
node --test tests/*.test.mjs
node isopoda/tools/check-morphology-page.mjs
node isopoda/tools/check-public-surface.mjs
node isopoda/tools/check-i18n.mjs
BASE_URL=http://127.0.0.1:8765 node tests/browser/morphology-layout.cjs
BROWSER=webkit BASE_URL=http://127.0.0.1:8765 node tests/browser/morphology-layout.cjs
```

The browser test requires Playwright (Chromium uses installed Chrome; WebKit uses Playwright's browser). `NODE_PATH` can point to a shared installation. Set `QA_OUTPUT` to save screenshots outside the deployed site. It checks all registered specimens at ten viewport sizes, actual painted-pixel centering, panel borders/order/containment, content growth/removal, input paths, reload, missing assets and a habitat smoke check.

See `../../docs/morphology-layout-repair.md` for the regression history. Development renderer diagnostics remain under `../dev/` and `../../tests/browser/`; do not create another public morphology page.
