# Direct pointer interaction

Minimal GAME interaction, reusing the existing pixel anatomy renderer and save format.

- Tap an animal: defend for 2.6 seconds. Full conglobation models use `curled`;
  other species use the existing `tucked` pose. Repeated taps restart the timer.
- Hold for 500 ms, then drag: the animal pauses its AI, lifts four world units,
  receives a small pixel shadow, and follows the pointer. Release places it within
  the same x=24–355, y=30–400 bounds used by the AI, with 800 ms recovery.
- Movement greater than 10 CSS pixels before pickup cancels the pending long press
  and tap. Empty-ground dragging still pans the camera.
- Pointer capture keeps dragging outside the canvas reliable. Only the primary,
  left-button pointer starts a gesture. Cancellation, capture loss, focus loss,
  hidden documents, scene transitions and habitat stop release pending gestures.
  Existing canvas `touch-action:none` prevents scrolling during touch gestures.

`interaction.mjs` owns the gesture and temporary individual states.
`habitat.mjs` converts screen coordinates through the existing camera, hit-tests
visible actor pixels and draws the pickup cue. `behaviors.mjs` skips the held
individual until its recovery expires. Other animals and narrative choices continue.

Future species entries can provide `interaction` with `tap` (`volvation` or
`freeze`), `pickupPose` (an existing renderer posture), `longPress`,
`defenseDuration`, and `recoveryTime` (all durations in milliseconds).
Species-specific fleeing is a future behavior, not implemented in this baseline.
Positions and temporary gestures remain session-local, consistent with existing actors.

## Validation

Run `node --test tests/*.test.mjs` (45 tests).
Serve the repository on port 8874, install Playwright in the test environment,
then run `node tests/pointer-browser.cjs`. Chrome is required. Set
`ISOPODA_URL` to use another local server address.

The browser test injects read-only access to actors/camera into its intercepted
module response; production code has no debug globals. It exercises desktop
1280×900 and mobile 390×844 with CDP touch input: tap, hold, AI suspension, drag,
release, recovery, zoomed pickup, outside release, cancellation, blur, background
pan, catalog, reload and all 21 rounds through the ending. Screenshots go to /tmp.
This is browser touch emulation; physical iOS/Android devices were not tested.
