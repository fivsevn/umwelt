# TICK.SYS

Dependency-free HTML/CSS/JS perception study. No visible instructions, HUD or About button during play.

1. Hover/touch the tick for a small, thin, breathing radar with sparse dim stars. Leaving/releasing fades it out. Drag at least 0.3 viewport-normalized distance; after approximately three seconds a small heat source is placed randomly on the far side of the field, invisible until approached within sensing range. Remain near it for 1.2 seconds.
2. The tick falls toward a gently breathing thermal target made of fine irregular pixels, without a landing cue or focus highlight. Click/tap the field (or press Enter/Space) while overlapping it. Early/late input or missing the target resets the search, including its delay and randomized source.
3. Drag through irregularly distributed long, yellow-brown hairs with anchored roots, tapered tips and slow breathing sway. A faint branching vascular field pulses beneath the hairs at a 2.8-second double-pulse cadence through tapering, asymmetrically branching vessels. Move to the convergence and linger briefly to finish; no red point is used. Keyboard arrows also move the tick.
4. The Umwelt introduction fades in over 2.4 seconds over the final scene. Click the small tick below the text to return home.

The drawing retains a 48px invisible touch target. Hair sway and vascular pulses remain visible with reduced motion enabled, disabled, and changed during play. Reduced motion only softens nonessential radar and star decoration. Hidden tabs pause progress. zh/en/ja follow the homepage language preference.

Preview from the repository root: `python3 -m http.server 8793`, then http://localhost:8793/tick/.

The existing Pages workflow publishes changes merged into `main` at https://umwelt.fivsevn.com/tick/.

## Visual references

- Derek Yu, Pixel Art Tutorial: Basics — pixel contour, limited palette and volume: https://www.derekyu.com/makegames/pixelart.html
- Kandi Runner sprite tutorial — hair silhouettes and grouped shading: https://design.tutsplus.com/tutorials/kandi-runner-create-a-pixel-art-sprite-from-scratch--cms-21705
- OpenStax, Structure and Function of Blood Vessels — arteriole/capillary-bed/venule structure, abstracted for the target rather than copied as a medical diagram: https://openstax.org/books/anatomy-and-physiology-2e/pages/20-1-structure-and-function-of-blood-vessels
