# Current species data contract

The authoritative runtime boundary is `../species-registry.mjs`: `SPECIES` and `speciesById`. Raw specimen append order is owned by `../data/species/manifest.mjs`; raw evidence/source append order is owned by `../data/sources/manifest.mjs`. The registry applies display size and locomotion profiles after manifest assembly. The original 13 entries are a save-compatible prefix, not the complete catalog. The 2026-09-13 specifications in `reference/` are historical.

## Identity and schema

- `id` is a unique, permanent specimen/archive key, not a scientific name. Preserve existing IDs and registry order. Never use the forgiving `speciesById` fallback to validate references: check explicit registry membership.
- `name`, `label`, `taxon`, `status`, `names`, `taxonomy`, `trade`, `profile`, `evidence`, `evidenceIds` and `visual` describe the specimen. Narrative annotation sources are `notes` or `literature.lines`; localized annotations are separately maintained in `locales/annotations.mjs`.
- `speed`, `wet`, `cover` are finite gameplay abstractions. Wet and cover use 0–100; they are not husbandry guidance or diagnostic taxonomy.
- Unknown scientific fields remain null/unknown, with empty evidence arrays where appropriate. Do not fabricate values to satisfy a validator. The current data intentionally permits nullable names, optional game flags and optional provenance/profile details.

## Scientific, trade and rendering boundaries

`taxonomy` contains accepted taxonomy or explicitly unresolved identification. `accepted_species` requires an accepted scientific name and species epithet. Unresolved/cf./trade identities must not be promoted into accepted species by copying their display label. `trade` owns morph, lineage and commercial naming independently of the accepted parent species.

`evidence.status` and `evidence.claims` describe support, not visual fidelity. Every nested `evidenceIds` entry must resolve through `sources-registry.mjs`. Sources can support limited claims; a source URL does not certify every renderer feature. Historical unresolved entries remain explicit uncertainty, not invented literature support.

`visual` is a renderer proxy, with `morphologyKey`, `provenance`, body/head/pereon/pleon/tail/appendages, palette, patterns, conglobation and stage profiles. Preserve confidence/proxy labels. Body dimensions and ordered juvenile/subadult/adult scales must be positive; core palette colors are required, while optional appendage colors may be null and inherit existing renderer fallbacks. Display scale is applied to the entire silhouette by the registry; do not duplicate it in source morphology.

## Habitat boundary

`habitats.mjs` owns playable pools. Terrestrial eligibility defaults to true unless `game.habitatEligible === false`. Aquatic membership is explicit in each habitat's `species` list and the specimen's `game.habitats`. Both must agree. `game.referenceOnly` specimens remain catalog-visible but cannot enter playable pools. Cohort size comes from habitat configuration; see `cohort.md`.

`tools/validate-habitats.mjs` separately checks habitat configuration shape: localized names, duration/cohort settings, aquatic defaults, palette/scenery knobs, metric/default alignment, per-species motion entries, tide coverage and dialogue-only parameters. This is structural validation, not an ecological or husbandry claim.

## Adding a specimen

1. Choose accepted-species, hobby-lineage, aquatic or reference-only ownership; append without editing legacy identity/order.
2. Add source IDs and scoped evidence, retaining scientific uncertainty and separating trade naming.
3. Register a new specimen batch once in `data/species/manifest.mjs`; register a new source batch once in `data/sources/manifest.mjs`. Existing group order is append-only.
4. Supply renderer scaffolding and explicit proxy provenance, then let the registry apply size/locomotion.
5. Register habitat membership in both directions if playable. Add authored annotations/locales without adding broad i18n exemptions.
6. Run `node isopoda/tools/check-all.mjs`. Existing snapshot/compatibility tests remain mandatory; deliberately update append-only expectations when adding entries.
7. Run morphology browser regression in Chromium/WebKit and main-game smoke. Review scientific claims separately: structural validation cannot establish their truth.

