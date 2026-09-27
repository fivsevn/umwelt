# Zero-UI maintenance — 2026-09-27

Baseline: `3a16915`. Scope: preserve markup appearance, CSS, copy, rules, save formats, animation timing, specimen size and all authored layouts.

## Repository map and publication boundary

- Root HTML/CSS/JS and `assets/`: desktop entry and shared fonts.
- `tick/`: separate public game; retained unchanged.
- `isopoda/`: game and laboratory runtime. `data/`, `locales/`, `scenery/`, `morphology/`, credits and assets remain public.
- `isopoda/dev/`, `isopoda/tools/`, `isopoda/docs/`, root `docs/`, `tests/`: development and verification material; retained in Git, excluded from deployment.
- `.github/scripts/`: artifact preparation, font subsetting and asset versioning.

Publication now copies only tracked public files. README/AGENTS files and local untracked experiments cannot leak into the artifact. No unproven obsolete runtime file was deleted. All public routes remain available. Font subsetting and SHA asset stamping retain their existing order. CI uses the complete structural gate rather than a subset of validators.

## Performance changes

The deployment preparer inserts modulepreload hints for static direct imports of each HTML module entry. Module source and execution remain unchanged; dependencies can be discovered while parsing HTML instead of waiting for entry module downloads. This is a loading strategy improvement, not a measured production latency claim.

Sprite color mixing uses a bounded 4,096-entry cache and parses the second color once per miss. Arithmetic and rounding are unchanged. A local 3,124-case benchmark measured 1,409 ms before versus 378 ms after (about 73% less calculation time). This is not a page FPS or network benchmark. Tests compare exact anatomy data against the original uncached arithmetic across 71 species, 11 postures and four frames.

## Verification and limits

- Full check-all gate: 202 Node tests plus localization, species, habitat, narrative and public-surface validators.
- Public baseline comparisons: Chromium source and WebKit prepared/stamped artifact; 320×568, 390×844, 1440×900. Screenshots, visible text and saves match baseline across four public routes and terrestrial/abyssal entry, feedback, reload and credits.
- Reduced motion: nine habitats in Chromium/WebKit, live preference changes and drawer pause/resume. River-mouth absence is permitted; visible animals must still animate.
- The legacy `tests/rendering.browser.mjs` all-habitat choice loop is outdated for interaction-gated observations; documented in the test README. It is not counted as a passed end-to-end run.
- The browser matrix is not exhaustive proof of every possible game interaction. No production deployment or live network speed measurement is included.

Use `node isopoda/tools/check-all.mjs` and the commands in `tests/README.md` to repeat checks. Browser evidence from this run is under `/tmp/umwelt-zero-ui/qa` and `/tmp/umwelt-zero-ui/qa-webkit` (temporary local artifacts).

## Release follow-up

Preserved upstream `a85f65f` (morphology layout fix) and used it as the new comparison baseline. Additional changes hoist constant pixel-neighbor offsets out of the per-cell allocation path and cap material color ramps at 4,096 entries. Eviction only recomputes identical colors. A proposed edge-color cache was discarded because timing did not demonstrate a reliable gain. No additional frame-rate improvement is claimed. Forty-two scenery raster command comparisons match exactly across seven materials, three rotations and two scales. The full gate now contains 203 tests.

## Existing browser-test drift repaired

The pre-optimization main (`a85f65f`) already failed the estuary, readout, animal-speed, sandy-surf and seaweed browser suites. Follow-up changes update tests only: groundwater has three numeric readings; sandy-surf uses its current arrival cue; Petri clock checks seed an existing specimen observation; arrival species counts include rare visitors; historical estuary layouts are tested by import rather than obsolete selector options. The tests retain their interaction, language, save/reload, rendering and clock assertions. Both browser engines are exercised locally before publication. Production game files are unchanged by this test repair.
