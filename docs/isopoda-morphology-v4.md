# Isopoda morphology and species migration — 2026-09-10

Implemented against the author-supplied `isopod-species-data-standard.md` and `morphology-renderer-spec.md`, both Draft v1.0. Literature is copied verbatim as two separate paragraphs per entry. No independent taxonomy research or invented claim URLs.

Repository discovery: the supplied mirror contains a nested `fivsevn/umwelt` checkout at local commit `c505d4e`. Remote main is `6b8c83dfb65adec31fab9feba4795dc7e94166f2`; its tree exactly matches that baseline. The explicitly named `fivsevn/y29` repository has no Umwelt route. User confirmed publication to the actual fivsevn/umwelt repository, preserving https://umwelt.fivsevn.com/isopoda/. Synced project files remain read-only; all implementation work is in an isolated copy. Same-origin v3 saves remain compatible; localStorage cannot automatically cross between domains.

## Changed implementation

- `isopoda/species.mjs`: names, taxonomy, trade, biogeography, profile, nomenclature, literature, evidence references, genetics/breeding placeholders. Legacy display aliases name/label/taxon/status remain for the existing controller; shape/colors/pattern removed.
- `isopoda/phenotypes.mjs`: normalized morphology coefficients, regional palette, pattern primitives, rendering stage profiles; no genetics model.
- `isopoda/sprites.mjs`, `isopoda/sprites.css`: one CSS-only renderer. Eleven anatomical regions, seven independent epimera, one legs layer and one antennae layer; 22 descendant nodes per specimen. No species-specific renderer branches or CSS selectors.
- `isopoda/sources.mjs`, `isopoda/catalog.mjs`: structured sources and expandable scientific/trade/origin/note/literature/source sections, stage and condition controls.
- `isopoda/game.js`, `isopoda/habitat.mjs`, `isopoda/style.css`, `isopoda/index.html`: integration, stable run-seed/index identities, mobile layout and cache version. Stop habitat animation while reading a dialog; resume on close.
- `tests/morphology.test.mjs`, `tests/browser-checks.mjs`, `tests/morphology.html`, `tests/fixtures/v3-saves.json`: state, structure, browser and original-save verification. Existing engine tests now inspect phenotype uniqueness.
- Umwelt engine/content values, index, font and CNAME are unchanged; production module imports are cache-versioned. The exploratory Y.29 integration changes were discarded after the user confirmed the existing Umwelt destination.

## 13 migration statuses

| id | Main name | Data and visual status |
|---|---|---|
| dairy | 奶牛 | Complete; Porcellio cf. laevis, cultured line; low runner, irregular stable blotches |
| cappuccino | 卡布奇诺 | Complete; tentative Cubaris trade taxon; convex coffee center and cream edges |
| diablo | 破坏神 | Complete; Ardentiella sp. working trade attribution; yellow blotches and red flared epimera |
| echinatus | 紫海胆 | Complete; Porcellio echinatus; low body and independent tuberculate sculpture |
| pink | 粉镭射 | Complete; unresolved trade complex; pale pink with low-contrast stripe |
| coros | 高露丝 | Complete; P. spatulatus, Coros locality; broad pale epimera |
| bolivari | 玻利瓦里 | Complete; P. bolivari; long low body, longest antennae and uropods |
| ducky | 鸭仔 | Complete; tentative Cubaris trade taxon; yellow head, short domed body, compact tail |
| daxin | 大新三色 | Complete; Venezillo sp. trade attribution; warm cephalon/P1–P2, dark P3–P5, pale P6–P7/rear |
| ember | 火蜂 | Complete; Ardentiella sp. working trade attribution; warm lateral progression |
| amber | 琥珀 | Complete; Amber Ducky trade designation; warm body and broad saddle |
| vex | 维克斯 | Complete; Troglodillo sp. trade assignment; wide convex overlapping armor |
| orange | 橘化科孚岛彩斑 | Complete; A. frontetriangulum + Orange morph; organized pale spot rows |

## Verification

The five benchmarks were enabled first and inspected in-browser in color and with neutral palette/no pattern before enabling the other eight. Ducky: short/convex/retracted rear; Bolivari: long/low/long appendages; Coros: especially broad epimera; Echinatus: low/sculptured; Dairy: low runner with irregular blotches. Echinatus and Dairy intentionally share a runner body plan; sculpture distinguishes them beyond color.

- S/M/L map to juvenile/subadult/adult. Scale, width ratio, plate maturity, appendage ratio and pattern expression all vary; base palette does not automatically lighten juveniles.
- Anterior molt: cephalon + P1–P4. Posterior molt: P5–P7 + pleon + pleotelson + uropods. The two sets are disjoint and cover all 11 regions.
- Curl capabilities: none shortens defensively; partial bends without closure; full closes the body outline and hides exposed legs/antennae/uropods. Unverified species-level capabilities and stage parameters remain explicitly labeled rendering models, not natural-history facts.
- 12 isopoda Node tests passed. The exploratory Y.29 integration also passed all 65 tests and its static build, but was not selected for publication. Umwelt deploys its static repository directly, without a separate build step.
- Real browser: 979 checks passed over 13 × 3 stages × 4 conditions plus seed/pattern checks, including a repeat after old CSS removal. Static specimen animations: 0.
- A real 21-turn game completed, with a mid-run reload retaining feedback, and the completed ending loaded again after cleanup.
- Original v3 save fixtures for every species resume from six recorded choices and complete all 21, without copying taxonomy/visual/sources into save. Keys/version and original game logic unchanged (engine import URLs versioned for cache safety); v1 migration tests pass.
- Browser layouts checked at 320×568, 390×844 and 844×390, including detail scrolling, Sources expansion and game controls. No horizontal overflow in the 390×844 measurement.
- Local unthrottled 390×844 iframe sample: DOMContentLoaded 16 ms, load 48 ms; local font loaded. These are development-machine samples, not low-end phone/network benchmarks. Runtime source about 118 KB plus the unchanged 916 KB font. No isopod image resources.
- One catalog entry is mounted at a time. Cards use content-visibility/contain-intrinsic-size; hidden/off-camera animals stop limb animations, background tabs and dialogs pause animation. Cached state application avoids repeated anatomy class updates on each frame.
- Legacy sprite CSS/fallback removed only after all 13/state/save checks; old p0–p6/feelers/tail and species-specific CSS are gone.

## Evidence and remaining limits

Species-level `sources`/`evidence` arrays are intentionally empty: the standards supplied source directories but not precise per-claim evidence links. Sources UI states this, separately exposing two exact shared morphology references and optional search-directory links. Unknown family, measurements, range, region and genetics remain null/unknown. Do not confuse migrated working-baseline records with independently verified taxonomy.

This round does not add an economic, narrative, breeding or genetic system. The pre-existing habitat Canvas remains; every animal is CSS. First-screen testing does not constitute physical-device or slow-network testing. Cross-origin localStorage migration is outside this change; no source-origin saves were accessed or reset.
