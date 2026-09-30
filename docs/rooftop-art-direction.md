# Rooftop object art direction

The approved direction is the first supplied reference (IMG_2252): neighbouring olive, khaki and earthy colour clusters, visible material planes, and dark occlusion inside foliage. Reference images guide technique only; do not copy their compositions or artwork.

- During plant/pot palette work, keep the rooftop, city and garage backgrounds unchanged. The later weather brief explicitly authorizes sky, city detail, surface repairs, rust and a small corner drain. Preserve the base palette and intact architecture while adding these features.
- Block in silhouettes with the material midtone. Do not wrap leaves, cactus pads, pots or furniture in a continuous dark contour.
- Shift hue across each ramp: warmer muted highlights, cooler/olive shadows. Retain plant-specific blue, burgundy and flower colours.
- Separate overlapping leaves with small connected shadow planes. Give neighbouring leaves different values according to their position.
- Use a few interlocking pixel clusters at face transitions; do not cover objects with checkerboard dithering or random noise.
- Pots keep their researched profiles and dark default terracotta. Rims catch limited light; they should not become a bright enclosing band.
- Furniture uses side planes, wood grain, slat gaps and joints to describe volume.
- Artwork is transparent; the screen-space contact shadow stays small and underneath when rotated.
- Retain short notebook notes and the actual references, including the selected container references.

## Technique references consulted

- [cure: Pixel Art Tutorial](https://pixeljoint.com/forum/forum_posts.asp?TID=11299): clusters, selective dithering, avoiding noise and pillow shading.
- [Raymond Schlitter: Pixelblog 1 — Color Palettes](https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes): hue shifts, saturation and relative contrast within colour ramps.

Botanical observations are grounded in the source links stored on each plant profile. This revision also checks the jade plant, spearmint and Boston fern against their NC State Extension profiles.

## Weather (2026-10-01)

The garage offers seven weather conditions and five time phases plus automatic options. Its choice persists separately from the layout. The public scene selects weather independently at entry and changes gently every eight minutes; its time phase follows the local device clock. These are ambient simulations, not live forecasts.

Foliage and vessels are separate cached layers. Wind shifts only foliage in integer pixel groups; succulents stay substantially rigid. Rain falls down the screen in both native map layouts; ripples and wet surface marks follow the roof. Night lights reuse deterministic room samples so late-night lights are a subset of early-night lights.

The first weather pass was rejected because a full-frame tint flattened values. The revised renderer leaves the sky on its own layer and recolours opaque material pixels with light/shadow ramps. No whole-scene dark or fog veil is used. Sunset has coherent warm receiving planes, cool shade, and longer object/rail shadows. Rain accumulates in irregular roof puddles, with clipped object reflections, ripples, crown splashes and runnels near the grate; water persists briefly after the weather clears.
