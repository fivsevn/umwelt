# Morphology layout repair — 2026-09-23

## Confirmed regressions

Baseline: `efafe9151a5c04bbb5ec0ae0f717dc156489d0c7` (main at checkout). Reviewed the four original screenshots and reproduced the faults in a browser.

- `493f8f1` added dossier styling; `d25afe8` reverted the Sep 21 stylesheet changes without removing the dossier HTML. The stylesheet no longer included the dossier in the bordered panels. At 1440×900 its bounding height was **0px**, with the summary painting into the reference panel; at 390px it had **no border**.
- `.side-stack` still declared `auto minmax(0,1fr)` for three children. References became an implicit row while the dossier took the zero-minimum flexible row. A fixed viewport shell and hidden overflow made content changes affect unrelated siblings.
- `7ea3b81` / `bdd9c2f` consolidated the intended two compositions but left earlier responsive rules in place. `4460a7e`, `ea54334` and `5ad69ec` changed centering and scales in the wrapper. The iframe stylesheet and injected `!important` rules independently controlled offsets, sizing and transforms. Centering transparent, potentially flex-shrunk canvases did not ensure the painted specimen was centered.
- `efafe91` moved the stylesheet into `morphology/` without rebasing asset URLs. Requests for `morphology/anatomy-vhs.css` and `isopoda/assets/fonts/...woff2` returned 404. The injected `<base>` also caused a speculative request to `morphology/morphology/style.css` before the correct request.

## Repair

Materialized the existing wrapper transformations into direct HTML and `app.mjs`, preserving registry imports, evidence content, renderer, two VHS feeds and selection behavior. Removed the iframe, template fetch, regex source rewrites, injected styles and layered breakpoint patches. Corrected the font URL; monitor styling is owned by the canonical stylesheet without development-only assets.

Five independently bordered panels use named grid areas. Desktop retains three columns; narrow DOM/visual order is inspector, viewer, layers, dossier, references. Content-sized rows and document scrolling preserve expanded dossiers and added text. Desktop references retain bounded internal scrolling; narrow references expand naturally. The optical field measures painted pixels and fits an unshrunk stage; monitors occupy their own row. Habitat files are unchanged.

## Acceptance coverage

1440×900, 1440×600, 1121×900, 1120×900, 1024×768, 768×1024, 768×430, 430×932, 390×844 and 320×640. All 49 specimens at each size; painted center tolerance <1 CSS pixel; panel borders, containment, columns and narrow ordering; expanded/collapsed dossier; added/removed long rows, unbroken strings, enlarged descriptions and an extra layer control; monitor/list selection, reset, previous/next, keyboard buttons and reload; browser/asset errors and habitat smoke checks.

Run instructions are in `isopoda/morphology/README.md`. Screenshots are generated with `QA_OUTPUT` outside the published site.

## Verified result

Local Chrome and WebKit each passed all ten sizes × 49 specimens, growth/removal and interaction checks. The WebKit run additionally exposed native select text overflowing at 320px for long specimen names; explicit select overflow and maximum width resolved it. All 88 existing unit tests passed. Public-surface, morphology structure and i18n checks passed (i18n reports existing annotation/string warnings). No habitat assets changed.

The dedicated `morphology-layout.yml` workflow repeats browser regression checks on relevant pull requests and main-branch changes, retaining screenshots as CI artifacts.
