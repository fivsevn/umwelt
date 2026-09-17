# Morphology page structure

`/isopoda/morphology/` is the only public/canonical morphology page.

- `index.html` — public shell and the only page that should receive UI/VHS/interaction changes.
- `template.txt` — internal HTML template loaded by `index.html`; it is not a standalone page. It reads `../species-registry.mjs` directly, so newly registered species appear automatically.
- `../anatomy-test.html` — retired compatibility URL; redirects to `/isopoda/morphology/`.
- `../../tests/morphology.html` — developer verification harness for renderer regression checks, not a public content page.
- `../exploded-preview.html` and `../projection-preview.html` — developer-only visual diagnostics. They are independent of the public page and may be removed later if no longer useful.

## Maintenance rule

When adding a species, add it to the normal species registry/data pipeline. Do not manually add it to the public morphology page. The specimen selector, index count and `MORPHOLOGY ARRAY` count are derived from the shared registry at runtime.

Morphology-page presentation changes belong in `morphology/index.html`. Renderer/species morphology changes belong in the shared renderer/data modules (`sprites.mjs`, `morphology.mjs`, species files), not in the page shell.
