# ISOPODA data layout

This note defines where species, source and locale data live after the repository cleanup.

## Runtime species data

- `isopoda/species.mjs` — the original stable base cohort. It remains at its historical path for compatibility and focused morphology tests.
- `isopoda/data/species/` — extension batches and specialist/reference groups.
- `isopoda/species-registry.mjs` — the complete runtime registry used by the public game.

Runtime modules that need the complete playable/reference catalog must import `species-registry.mjs` directly. Do not rely on an HTML import map to turn `species.mjs` into the full registry.

Current extension files:

- `data/species/batch-01.mjs`
- `data/species/batch-02.mjs`
- `data/species/batch-03.mjs`
- `data/species/batch-04.mjs`
- `data/species/marine-reference.mjs`
- `data/species/hobby-lines.mjs`

The registry preserves the existing concatenation order. Stable species ids, save data and draw behavior must not be changed by file moves.

## Source data

- `isopoda/sources.mjs` — base scientific/reference source data.
- `isopoda/data/sources/` — extension source groups.
- `isopoda/sources-registry.mjs` — complete source registry.

The extension groups currently mirror the specialist data domains:

- `data/sources/marine-reference.mjs`
- `data/sources/hobby-lines.mjs`

## Locale data

Locale data belongs under `isopoda/locales/`:

- `ui.mjs` — keyed static UI copy.
- `game.mjs` — authored encounter/game translations.
- `annotations.mjs` — specimen annotation translations.

`i18n.mjs` and `runtime-locales.mjs` remain runtime adapters rather than locale-data files.

## Test contract

Browser runtime and Node integration tests must use the same complete registry where behavior depends on the public catalog.

Focused tests may import `species.mjs` intentionally when they are specifically verifying the original stable base cohort.

Run before merging structural changes:

```bash
node --test tests/*.test.mjs
node isopoda/tools/check-i18n.mjs
node isopoda/tools/check-morphology-page.mjs
```

Structural cleanup must not change stable ids, public URLs, save formats, visual renderer output, narrative copy or game mechanics.
