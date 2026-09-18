# Scenery module contract

This directory contains code-drawn habitat scenery for Isopoda Fugue.

For the full architecture and next-phase plan, see:

```text
/docs/isopoda-scenery-system.md
```

## Current rule

Keep these concerns separate:

- `environment.mjs` owns persistent environmental state.
- `habitat.mjs` owns runtime orchestration and specimen interaction.
- `scenery/` owns visual scenery renderers.

A visual renderer should not create or mutate save-state history.

## Current modules

- `pixel.mjs` — shared pixel helpers and deterministic hash.
- `substrate.mjs` — soil / moisture field.
- `leaf.mjs` — leaf litter.
- `moss.mjs` — moss patches.
- `bark.mjs` — bark shelter / fragments.
- `stone.mjs` — stone variants.
- `cuttlebone.mjs` — calcium-source prop.
- `debris.mjs` — twigs / wood chips.
- `index.mjs` — current composition / dispatch entry point.

## Next integration

The next scenery phase should add:

- `registry.mjs` — one canonical list of reusable scenery assets.
- `presets.mjs` — scene compositions that reference registry ids.

The public game and the local scenery lab should then consume the same asset definitions.

Until that integration is performed, do not create another independent scene-asset catalog.

## Local visual lab

```text
http://localhost:8000/isopoda/scenery-test.html
```

This page is for development only and is excluded from GitHub Pages deployment.

Use it to tune visual content before changing the public scene.
