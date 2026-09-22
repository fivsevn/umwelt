# ISOPODA development-only files

This directory contains preview pages and retired/experimental presentation assets used while developing the game and the two public Asimov laboratories.

Nothing under `isopoda/dev/` is part of the deployed public surface. GitHub Pages excludes this directory.

Current previews:

- `previews/exploded-preview.html` — exploded morphology layer study.
- `previews/projection-preview.html` — posture / projection matrix for sprite inspection.
- `styles/anatomy-vhs.css` — archived VHS styling experiment. The public morphology lab currently applies its VHS styling from `morphology/index.html`; this file is not a runtime dependency.

Do not move a file here only because its name contains “test”. In particular, `isopoda/anatomy-test.css` is a live dependency of `isopoda/morphology/template.txt` and must remain deployable.
