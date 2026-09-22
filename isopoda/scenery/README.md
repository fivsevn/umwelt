# Scenery renderer contract

Production and the public Asimov Habitat Lab import `index.mjs`. `tests/scenery-study.mjs` only re-exports compatibility names; it contains no artwork.

- `grammar.mjs`: integer world-space 1px edges and 2px near-color material clusters, inverse geometry rotation, opaque palette fills, and the shared 0.88 anatomy projection scale. No rotated canvas, bitmap assets, or blurred gradients. Deterministic clustered dithering makes surface pixels visible.
- `substrate.mjs`: dark woodland ground, connected humus islands, sparse mineral clusters and moisture bands.
- `leaf.mjs`: oak, willow, magnolia, maple, ginkgo and beech silhouettes; four palettes and deterministic damage.
- `moss.mjs`: top-down branching shoots, smaller patches and forest carpet.
- `bark.mjs`: large layered cork shelter, flat bark, mossy log, wavy grain, knots and splits; adapted from historical `6959a88`.
- `stone.mjs`: rounded, flat, chipped and small polygonal stones.
- `cuttlebone.mjs`: whole and broken calcium pieces.
- `debris.mjs`: branched twigs and wood chips.
- `index.mjs`: production composition and dispatch, including stones.

`environment.mjs` still owns saves and ecology. Renderers never mutate scene objects. `habitat.mjs` caches the static scenery in an in-memory canvas; its key includes moisture, seed and shelter lift. This is a runtime Canvas buffer, not a texture file. Anatomy and scenery are displayed with smoothing disabled.

Open `/isopoda/habitat.html`. RESET reads BASE_SCENE at exact production object dimensions. FOREST STUDY demonstrates mixed species. Placement, dragging, rotation, scale, depth, seed and live-size anatomy reference remain available. Pages publishes only this lab; other excluded development pages remain excluded.

Run `node --test tests/*.test.mjs` plus the repository checks under `isopoda/tools/`. Scenery tests enforce renderer identity, opaque integer cells, bounded palettes, low-frequency soil, deterministic variety and pure scene composition.

The second visual pass follows the early woodland screenshot: muted ochre leaves, dark soil, a larger central shelter and large leaf litter. No simulation or save logic changes. `FOREST STUDY` uses the same production composition plus extra litter.
