# Reaction bubbles (GAME)

Bubbles are a transient reading aid for observable animation, not a statement about
isopod emotions or social cognition. `isopoda/reactions.mjs` reads individual
coordinates, posture, motion, occlusion and the existing reaction mode. It does
not change the simulation or saved run.

- Six hand-rasterized symbols: `!`, `?`, `…`, `♡`, `~`, `◎`; lifting uses `!!`.
- Priority: strong disturbance, alert, defense, exploration/observation, positive.
- At most one bubble per individual and three in the scene. Player disturbance
  highlights the two individuals nearest the changed place. Ordinary starts are
  staggered; a stable cue is shown once until the action changes.
- Ordinary bubbles last 1.2 seconds, molt observations 1.9 seconds, lift impact
  0.8 seconds before a possible defense cue. Time pauses with the habitat.
- Bodies are 22 × 18 scene pixels (26 × 18 for `!!`). All body, glyph, tail and
  shadow cells use the existing two-world-unit lattice, before camera scaling.
- Camera bounds are recalculated on every presentation, including pan/zoom;
  tails flip above an individual near the upper edge. Offscreen individuals
  do not acquire a floating marker at the viewport edge.
- Reduced motion removes the stepped four-pixel rise, retaining the same cues
  and durations. No text antialiasing, interpolated scaling or emoji fonts.

Contact requires the authored probe pose and another probing participant within
contact range. Hearts require feeding (shell encounters use dots instead).
Shelter cues require actual occlusion, so a threshold encounter cannot claim
entry when the existing choreography only hesitates. Orbit, departure and
parallel routes have no default bubbles. Underlying care/disturb animations can
still produce their relevant feedback during these encounters.

Validation: `node --test tests/*.test.mjs` includes timing, priority, limits,
staggering, reset, camera clipping, reduced motion and a 24-encounter × 10-action
simulation sweep that checks the overlay does not mutate simulation state.
Browser verification also covers desktop/mobile 21-choice runs, endings,
catalog/sources, camera pan/zoom and the lift-to-defense visual sequence.
