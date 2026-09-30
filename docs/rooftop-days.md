# Rooftop Days / 花农时代

First visual prototype. `/rooftop/` is the observation page; `/rooftop/arrange/` is the layout studio. Everything is drawn by integer canvas primitives; there are no raster scenery assets, libraries, or network services.

## Reference geometry

64 logical pixels represent 1 metre. The north terrace follows the green annotations: 5 × 3 m main rectangle, a 2 × 1 m projection offset 2 m from the left, and a 1 × 2 m entrance passage at the right. The south balcony is 3 × 1 m. These are interpretations of the supplied annotations, not a survey. Furniture can be cleared without changing the architecture.

## Layout handoff

The studio stores both scenes under `umwelt-rooftop-layout-v1`. Observation uses the committed initial layout by default. The preview button opens `?layout=local&scene=...` to inspect the saved local arrangement. Editing a layout does not publish it for other visitors.

JSON export contains `{version:1, scenes:{north:[], south:[]}}`. Each object has an id, asset type, integer world position, scale and quarter-turn rotation. Import validates known assets, finite dimensions, unique ids, permitted rotations, roof bounds and a 400-object limit per scene, then replaces both scenes atomically. Objects may overlap for plants on shelves. The walking agent treats footprints as obstacles and finds reachable destinations on an 8-pixel grid.

For the final arrangement, validate an exported layout and adopt its coordinates into `initialLayout()` in `rooftop/scene.mjs`. Preserve the shared renderer between observation and editing.

## Verification

`tests/browser/rooftop.cjs` checks the desktop entry, north/south routes, visible movement, live reduced-motion changes, reaching tasks, empty scene, dragging, undo/redo, transforms, persistence, JSON round trip, rejection of invalid import, preview, initial rendering and mobile overflow. Run with the repository's Playwright setup; set `BASE_URL`, `BROWSER` and an existing `QA_OUTPUT` directory.
