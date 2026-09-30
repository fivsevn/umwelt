# Horticultural Era / 花农时代

The observation fills the viewport. A door on the north entrance passage leads to the south balcony; its sliding door returns to the north terrace. Dongdong is automatically present or out on a randomly selected errand, without visitor controls. When present there is no presence label; the wind card remains, with a separate desktop return card on the north terrace.

Visual prototype. `/rooftop/` is the observation page; `/rooftop/arrange/` is 东东的车库 (the layout studio). Everything is drawn by integer canvas primitives; there are no raster scenery assets, libraries, or network services.

## Reference geometry

64 logical pixels represent 1 metre. The north terrace follows the green annotations: 5 × 3 m main rectangle, a 2 × 1 m projection offset 2 m from the left, and a 1 × 2 m entrance passage at the right. The south balcony is 3 × 1 m. These are interpretations of the supplied annotations, not a survey. Furniture can be cleared without changing the architecture.

## Layout handoff

The studio stores both scenes under `umwelt-rooftop-layout-v1`. Observation uses the committed initial layout by default. The preview button opens `?layout=local&scene=...` to inspect the saved local arrangement. Editing a layout does not publish it for other visitors.

JSON export contains `{version:1, scenes:{north:[], south:[]}}`. Each object has an id, asset type, integer world position, scale and quarter-turn rotation. Import validates known assets, finite dimensions, unique ids, permitted rotations, roof bounds and a 400-object limit per scene, then replaces both scenes atomically. Objects may overlap for plants on shelves. The walking agent treats footprints as obstacles and finds reachable destinations on an 8-pixel grid.

For the final arrangement, validate an exported layout and adopt its coordinates into `initialLayout()` in `rooftop/scene.mjs`. Preserve the shared renderer between observation and editing.

## Verification

`tests/browser/rooftop.cjs` checks the desktop entry, north/south routes, door navigation, random presence and errands, visible movement, live reduced-motion changes, reaching tasks, empty scene, dragging, undo/redo, transforms, persistence, JSON round trip, rejection of invalid import, preview, initial rendering and mobile overflow. Run with the repository's Playwright setup; set `BASE_URL`, `BROWSER` and an existing `QA_OUTPUT` directory.

The south balcony door returns to the north terrace. On the north terrace, the separate lower-left card “去别处走走。” links back to the Umwelt desktop. Desktop insect artwork is centered by its occupied pixel bounds, keeping its existing size.

Observation cards form a fixed lower-left vertical stack, with each temporary status in its own card. Narrow screens use a closer camera and pointer dragging pans the world independently of cards. The desktop welcome window remains centered over the launchers.

The observer camera supports cursor-anchored wheel zoom and native two-finger pinch, with single-pointer pan. These gestures change only world coordinates; cards stay at fixed CSS dimensions. The south balcony observation rotates clockwise 90 degrees (door on the left), while garage layout coordinates remain unchanged. Desktop entry centers the terrace; mobile opens a closer view.

North opens at 1.7 times the full-garden fit scale, focused toward the right main garden; south opens at the full-garden fit scale. Zoom is clamped to 1–2.5 times that fit; panning is restricted to the garden bounds, and axes that already show the whole garden remain centered. Scene entry resets its view. Dongdong is painted upright in south observation, counteracting the map rotation at his foot position.

South observation treats the vertical balcony as its normal map orientation. City buildings, including extended background blocks, are rendered upright within their existing footprints, with roofs above vertical windows.

Background buildings now share a continuous city renderer across the old 640 × 520 tile boundary. Window rows stay within wall margins, roof edges remain complete, weathering is painted behind windows, and extension blocks avoid overlapping the existing city footprints. Both observation and garage use the same buildings.
