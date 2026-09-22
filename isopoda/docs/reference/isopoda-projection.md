# Isopoda top-view projection

The renderer now composes anatomical modules inside one projected shell envelope:
60% parallel middle, short asymmetric half-ellipse caps. Side plates have a compressed rim and seven paired skirt lobes. Species controls
select narrow rounded rims, broad shield lobes or swept lobes; protective poses
retract them. The head and tail caps use independent roundness. Convexity controls
edge compression and shading; existing species length, width, palettes, patterns,
surface sculpture and conglobation abilities remain distinct.

Legs are drawn underneath the shell. A phase-dependent subset exposes 1–3 cells;
resting and tucked poses conceal more. Moving is part of the raster cache key.
Antennae use three linked segments with V opening/sweep and cumulative joint
rotations, including two folds toward the body. Rotation remains nearest-neighbour
sampling onto the original integer grid.

The gameplay, collection and persistence rules are unchanged. The seven thoracic
modules and anterior/posterior molt regions remain addressable; fully rolled
species retain their closed-dorsum rendering.

## Review

Serve the repository and open `isopoda/projection-preview.html`. The slider selects
four frames; the play button animates them. Thirteen species are shown in nine
pose/orientation combinations. This page uses the real renderer.

Validation: `node --test tests/*.test.mjs` (26 tests), including all 13 species ×
3 stages × 10 poses × 4 phases, broad-middle/blunt-cap checks, exposed-leg limits,
and rotation-safe raster bounds. Browser preview: 117 canvases, four frames,
no page errors. Existing save, ending, collection, molt and behavior tests pass.
