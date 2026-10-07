# Rooftop object placement contract

Applies only to 花农时代. Keep other games unchanged.

When adding or changing a placed asset:

- Register its spatial role and catalogue group in `3d/placement-profiles.mjs` (`SPACE_GROUPS`). The catalogue shows all plants first, followed by bearing furniture, portable holders, and the remaining items. A bearing asset must expose at least one actual surface; a filled planter or aquarium is an item with no empty cavity.
- Define stable surface IDs, real board-top/interior-floor heights, bearing footprint, opening shape, headroom, and any holes or single-point landing. Use actual geometry measurements, not the old 2D thumbnail bounds. Geometry and placement must share those measurements (as racks and washstations do).
- Define usable ground regions and solid obstacles for raised furniture. A ground region has `bearing: 'ground'`; it creates `support: null`, never a support dependency. Real lower boards are ordinary carried surfaces. Do not pass ground regions to board builders.
- Explicit placement is governed by footprint, clearance, collision and cycles, never by a catalogue name or a floor-only allowlist. Preserve the deliberately limited inference for legacy saves.
- All edit paths use `fitsSurface`, `placeOnSurface`, `resolveSupports`, and `clearPlacement`. Do not add an independent special case in a UI handler. Keep pointer gestures and layout-derived placement snapshots bounded; normal edits must reuse model geometry.
- Transparent enclosure panes must permit picking visible contents. Preserve the inspector's contents selector for items hidden by opaque geometry. Move/rotate carried descendants; leave ground objects stationary; refuse to remove a supporter with occupied surfaces.
- Update `docs/rooftop-placement.md` and meaningful spatial tests for new structural patterns. Run the contract checks and exercise representative controls, drag, retrieval, save/reload, and narrow layouts in the actual browser before publishing.

`sources/` and synced project reference files remain read-only.
