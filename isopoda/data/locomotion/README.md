# Locomotion research layer

This directory documents the hidden locomotion model used by the ISOPODA simulation.

The public game is intentionally quiet about these fields. They exist for three reasons:

1. keep animation differences traceable instead of accumulating unexplained magic numbers;
2. let future events query movement capabilities and context sensitivity;
3. separate biological evidence from game/render tuning.

## Evidence and simulation are separate

A locomotion profile contains two parallel branches.

- `research` stores what the project can actually support: direct measurements, qualitative descriptions, taxon transfers, context effects, source IDs and limitations.
- `simulation` stores normalized coefficients used by animation. A value such as `cruise: 1.10` is **not** 1.10 mm/s. It is a relative render coefficient.

The simulation may be informed by literature without pretending that a paper measured the exact coefficient used by the game.

## Evidence basis

- `direct_measurement`: quantitative evidence on the same accepted species.
- `direct_qualitative`: locomotor behaviour described for the same species, without a directly usable speed measurement.
- `reference_taxon_transfer`: evidence belongs to a reference taxon used cautiously for an unresolved/cf. cultured line.
- `related_taxon_transfer`: genus/family/ecotype evidence used only to constrain a proxy.
- `game_proxy`: no suitable locomotion evidence is currently attached. The value exists for animation balance and is flagged for review.

Every non-proxy claim must cite a resolvable source ID; locomotion research sources live in [`sources.mjs`](sources.mjs) in this directory and are resolved by the locomotion module, separately from `sources-registry.mjs`.

## Extension rule

Do not overwrite research facts to make animation feel better. Change `simulation` and leave an explicit `tuningNotes` entry. If a new paper is found, add the source and claim first, then decide whether the simulation should change.

For runtime action integration, see the [animation guide](../../docs/animation.md). [Documentation index](../../docs/README.md).
