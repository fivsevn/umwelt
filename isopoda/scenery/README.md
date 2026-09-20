# Scenery renderer contract

Production and the public Habitat Asset Lab import `index.mjs`. `tests/scenery-study.mjs` only re-exports compatibility names; it contains no artwork.

- `grammar.mjs`: integer world-space 2px cells, inverse geometry rotation, opaque palette fills, and the shared 0.88 anatomy projection scale. No rotated canvas, bitmap assets, gradients, or dither noise.
- `substrate.mjs`: warm brown ground, stepped moisture bands, sparse humus clusters.
- `leaf.mjs`: oak, willow, magnolia, maple, ginkgo and beech silhouettes; four palettes and deterministic damage.
- `moss.mjs`: layered tuft clusters, smaller patches and forest carpet.
- `bark.mjs`: shelter, flat bark, mossy broken log, exposed fibres and coarse cracks.
- `stone.mjs`: rounded, flat, chipped and small polygonal stones.
- `cuttlebone.mjs`: whole and broken calcium pieces.
- `debris.mjs`: branched twigs and wood chips.
- `index.mjs`: production composition and dispatch, including stones.

`environment.mjs` still owns saves and ecology. Renderers never mutate scene objects. `habitat.mjs` caches the static scenery in an in-memory canvas; its key includes moisture, seed and shelter lift. This is a runtime Canvas buffer, not a texture file. Anatomy and scenery are displayed with smoothing disabled.

Open `/isopoda/scenery-test.html`. RESET reads BASE_SCENE at exact production object dimensions. FOREST STUDY demonstrates mixed species. Placement, dragging, rotation, scale, depth, seed and live-size anatomy reference remain available. Pages publishes only this lab; other excluded development pages remain excluded.

Run `node --test tests/*.test.mjs`, plus the two checks under `isopoda/tools/`. Scenery tests enforce renderer identity, opaque integer cells, bounded palettes, low-frequency soil, deterministic variety and pure scene composition.
