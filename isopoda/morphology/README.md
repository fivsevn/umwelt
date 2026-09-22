# Morphology page structure

`/isopoda/morphology/` is the only public and canonical morphology laboratory.

## Canonical files

- `index.html` — public entry point and the only public morphology route.
- `template.txt` — internal document loaded by `index.html`; it is implementation detail inside the canonical morphology directory, not a standalone public page.
- `style.css` — live morphology-lab stylesheet.
- Shared renderer and specimen data remain in the normal ISOPODA runtime modules such as `../sprites.mjs`, `../morphology.mjs` and `../species-registry.mjs`.

The retired `/isopoda/anatomy-test.html` entry and the old `isopoda/anatomy-test.css` path have been removed. Do not recreate a second morphology page or compatibility copy.

## Development-only diagnostics

- `../dev/previews/exploded-preview.html` — exploded morphology layer study.
- `../dev/previews/projection-preview.html` — posture / projection matrix.
- `../../tests/browser/morphology.html` — renderer regression harness.

These diagnostics are not public content and may evolve independently of the canonical morphology page.

## Maintenance rule

When adding a species, add it through the normal species registry/data pipeline. Do not manually duplicate species lists inside the morphology page. The specimen selector and counts are derived from the shared registry at runtime.

Presentation work for the morphology laboratory belongs under `isopoda/morphology/`. Renderer or species morphology work belongs in the shared renderer/data modules. Keep the public route stable at `/isopoda/morphology/`.
