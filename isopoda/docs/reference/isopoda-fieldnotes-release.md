# Isopoda Fugue — 所见之物 / 2026-09-10

Published target: fivsevn/umwelt, existing /isopoda/ address.

## Changes

- Empty terrarium with title and one introductory sentence. Random draw reveals five individuals and unlocks the species. Draws favor unseen species until all thirteen have been encountered.
- Five stable individuals, with S/M/L variation. Twenty-four encounter scenes, nineteen choreography types, and encounter-specific responses to observation, care, and disturbance. Each seven-day run uses twenty-one distinct encounters. These are authored game simulations, not evidence about animal intentions.
- Three persistent pixel instruments: round dial, paired windows, vertical thermometer. Ventilation and light retained. No real-time clock wording.
- “所见之物” contains species encounters and endings. Unseen species/ending pages remain blank. Species pages show basic names, morphology/state controls, and exact unsigned literary text. Global “出处与旁注” gathers references without inventing claim evidence.
- Icon buttons for collection, paper journal, sound, references, and draw. Journal uses pixel paper notes and the same seeded specific time as the observation. Morning 06:00–10:59, afternoon 13:00–17:59, night 20:00–23:59; different each day and stable after reload.
- Observation progress fraction and ending return-to-Umwelt link removed.
- Whole habitat fits at 1× without cropping individuals on narrow or landscape screens. Existing zoom and drag remain available. Paused, hidden and offscreen individuals do not keep walking animations running.

## Compatibility

Existing isopoda-fugue-v3 and isopoda-fugue-endings-v3 keys remain. Existing run and archived species unlock automatically. New collection/preferences key is isopoda-fieldnotes-v1. An interrupted first draw resumes its reveal. Scientific species records, uncertain taxonomy, literature, thirteen IDs, phenotype coefficients, and anatomical molt/curl logic remain unchanged. No complete species/phenotype definitions are saved. Unchosen legacy count prompts that exceed five are regenerated; existing feedback and journal text remain intact. Old journal entries receive reproducible display times when absent.

## Validation

- 18 Node tests passed: complete seeded runs, all six endings reachable, all thirteen historical save fixtures resume, collection recovery/draws, times, unique encounters, movement bounds and reduced motion.
- Browser morphology checks: 979 passed, zero failures, zero static specimen animations.
- Actual browser: empty start, draw, unlocked/locked pages, Sources, three instruments, paper journal, 21 choices through an ending, ending inclusion and reload recovery; no console errors.
- Visual checks at 390×844, 320×568 and 844×390. 320-pixel screen has no horizontal overflow. Five habitat specimen nodes.
- Local iframe first load: DOM ready 13 ms, load 44 ms; zero start-screen animations, no overflow, font loaded. These are local measurements, not an internet performance guarantee. Existing Chinese pixel font is about 916 KB; no new image/font assets added.

## Files

Main controller/layout: isopoda/game.js, index.html, style.css.
Collection/catalog/reference presentation: collection.mjs, catalog.mjs.
Simulation/timing: engine.mjs, encounters.mjs, behaviors.mjs, habitat.mjs.
Pixel interface: ui.mjs.
Cache identifiers only: species.mjs, sprites.mjs.
Validation: tests/fieldnotes.test.mjs; Pages workflow now runs all *.test.mjs.

## Deferred

Full Harvest Moon-like sprite pixel-art restyling is the next iteration. The current scientific morphology and renderer remain intact. Field-level external evidence stays empty where precise supporting URLs were absent from the supplied standards. Existing font payload has not been subsetted in this round.
