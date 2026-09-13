# Environment memory / memory-14

The same observation box now retains local wet patches, added leaves (including a gap or flat placement), food and crumbs, bark position, and disturbance marks. Moisture and food decay only when turns advance. Non-participating animals and animals between encounters seek these persistent places. Encounter actors and molt anatomy remain intact. Old v3 runs gain a spatial snapshot on first use; past records and pending feedback remain untouched.

Morning observations retain the encounter vignette, evenings retain one reflective passage, and choice feedback no longer appends a second encounter explanation. Notes and endings remain complete.

The homepage and Isopoda load `window-system.css`: identical 3px raised outer frames, 32px title bars, 24px pixel title controls with 2px bevels, and matching recessed content frames. Catalog help/close controls, pagination, and pressed states share those tokens. Module and stylesheet URLs use `memory-14`.

Validation: 33 Node tests, including five spatial persistence/behavior regressions. Actual Chrome checks at 1440×900, 390×844, 320×568 and 844×390 exercised homepage, launch, draw confirmation, minimize/restore, fullscreen/restore, close, catalog/help/tabs/pagination, saved feedback reload and square scenes. A full 21-choice browser run reached an archived ending with no page errors.
