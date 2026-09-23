# ISOPODA development map

This directory serves the public game and two public development/reference laboratories. File organization should protect the existing public surface first and make future content additions predictable.

## Public surface contract

These routes are intentionally public and should keep their current appearance and behavior:

- `/` — UMWELT desktop / launcher.
- `/isopoda/` — ISOPODA FUGUE game.
- `/isopoda/morphology/` — Asimov Morphology Lab.
- `/isopoda/habitat.html` — Asimov Habitat Lab.

The morphology lab is canonical under `morphology/` and depends on `morphology/app.mjs` plus `morphology/style.css`. The habitat lab depends on `habitat-lab.mjs`, `habitat.css`, the shared scenery modules and the shared specimen renderer.

## Runtime boundaries

- Game orchestration: `game.js`, `engine.mjs`, `habitat.mjs`, `environment.mjs`, `interaction.mjs`.
- Authored narrative: `content.mjs`, `encounters.mjs`, `aquatic-story.mjs`, `data/habitats/`.
- Species / evidence: `species-registry.mjs`, `data/species/manifest.mjs`, `data/sources/manifest.mjs`, `species.mjs`, `data/species/`, `data/sources/`, `sources*.mjs`.
- Rendering: `sprites.mjs`, `morphology.mjs`, `scenery/`, `locomotion.mjs`.
- Localization: `i18n.mjs`, `runtime-locales.mjs`, `locales/`.
- Public labs: `morphology/`, `habitat.html`, `habitat-lab.mjs`, `habitat.css`.
- Development-only previews: `dev/`.
- Developer documentation: `docs/` (single entry point: `docs/README.md`).
- CI / repository checks: `tools/`.

Start with [the documentation index](docs/README.md). See [the content map](docs/content-map.md) before adding story, encounter, species or locale content. Historical and subsystem notes live under `docs/reference/`; they are reference material rather than automatic runtime contracts.

## Stability rules

1. Keep save-compatible habitat, species, scene and ending IDs stable.
2. Do not move a runtime file just to improve folder aesthetics; first add a compatibility boundary or update all verified consumers.
3. Chinese authored copy is the canonical source for legacy terrestrial text, but visible active strings must have EN and JA coverage.
4. Water / abyssal stories use stable content keys; preserve those keys when rewriting prose.
5. Register new specimen/source batches through the manifests; do not extend the runtime registries with another parallel import list.
6. Run `node isopoda/tools/check-all.mjs` before merging structural or authored-content changes. See `../tests/README.md` for browser/manual regression harnesses.

