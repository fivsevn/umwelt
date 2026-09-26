# Specimen size and raster review

The archive now provides a small real-world adult-size ruler and a taped note for oversized specimens. Visual size remains compressed for the game; archive ruler lengths derive from the rendered head-to-pleotelson body extent, excluding antennae and uropods. Large outlines may intentionally cross the mount border. Notes are separate from scientific references and the specimen acquisition tag.

Only supported adult-size references are eligible for the ruler. Adult-range midpoints are approximate illustration anchors, not population means. Maximum records and type-specimen measurements never supply a fallback. At this review, 15 of 69 specimens have eligible references; 54 display an explicit unresolved-size label. This is a data limitation, not an implicit maximum-to-average conversion. Exact source qualifications for newly added references are visible in the morphology laboratory. The game's existing compressed-size anchors are unchanged.

The habitat raster now inverse-samples occupied source cells onto the output grid. Enlarging and rotating a body no longer scatters individual source cells and leaves pinholes. Sand rear-lift and front/rear occlusion remain part of the transform. DOM specimen raster bounds prevent out-of-range source cells from aliasing onto a different row.

Launch controls use explicit inset edges instead of browser-native beveled borders. The intermittent original black corner was not independently reproduced; the replacement was visually checked across fractional display scales and CSS zoom levels.

Validation:

- `node isopoda/tools/check-all.mjs`: all structural checks and Node tests pass, including intermediate-scale/rotation plate integrity and rejection of maximum-only ruler data.
- `tests/browser/specimen-size.cjs`: all 69 specimens in all four languages at 320, 390, and 1440 px, Chromium and WebKit; labels, notes, tag separation, and locked-card concealment.
- `tests/browser/public-regression.cjs`: Chromium and WebKit, 320×568 / 390×844 / 1440×900, public routes, terrestrial/abyssal start, choices, reload, Credits.
- `tests/browser/morphology-layout.cjs`: Chromium and WebKit, responsive specimen and reference-panel checks.
- `tests/browser/habitat-lab.cjs`: Chromium, presets, scale, layers, transfers, rollback, downloads, responsive dragging, save isolation.
- Actual magnificus habitat and archive screenshots reviewed. No production deployment is part of this branch.
