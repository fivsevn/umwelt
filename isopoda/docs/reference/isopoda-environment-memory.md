# Isopoda environment memory

Status: current maintenance note, 2026-09-18.

The observation habitat keeps spatial state across observation turns. Environment memory is part of the simulation state and is separate from scenery artwork.

For the scene-rendering architecture and next visual phase, see:

```text
/docs/isopoda-scenery-system.md
```

## Authority

`environment.mjs` owns persistent environment state.

Current environment data is version 3 and includes:

- `wetZones` — local moisture regions;
- `leaves` — added leaf litter and placement state;
- `foodNodes` — food amount, position and age;
- `shelter` — stateful shelter position;
- `disturbance` — short-lived disturbance memory;
- `scuffs` — persistent handling marks;
- `shells` — visible shed-shell traces;
- `pendingShells` — shell traces waiting for a later observation turn;
- `removedShells` — collected / removed shell ids.

These values advance with observation turns rather than wall-clock time or render-frame count.

## Runtime boundary

`habitat.mjs` reads environment state and combines it with:

- the current specimen cohort;
- behavior state;
- encounters;
- direct pointer interaction;
- camera state;
- scenery renderers.

It should not become the permanent storage location for visual assets.

`scenery/` contains programmatic visual renderers. Scenery modules may read state passed to them, but should not mutate the saved environment history.

## Persistent spatial behavior

Animals evaluate local habitat opportunities individually. A specimen can respond to:

- the closest / best matching wet zone;
- food nodes;
- leaf edges and gaps;
- the shelter;
- disturbance;
- current light conditions.

The game uses these values as authored simulation abstractions. They are not husbandry measurements or biological prescriptions.

## Shed-shell memory

Molt traces are staged through `pendingShells` and later released into `shells`. Removing a shell records the id in `removedShells` so the same trace does not reappear.

This logic belongs to environment memory because the shell is a persistent consequence of an observation, not a fixed scenery prop.

## Scene-rendering rule

A stateful object must be drawn from its state position.

In particular, the primary shelter has both:

- a reusable bark visual;
- persistent `environment.shelter` coordinates.

The next scenery integration pass should make those two layers meet through the scenery registry / preset system. The visual preset must not silently override the saved shelter position.

## Save compatibility

Existing environment versions are migrated forward in `environmentFor()`. Migration should remain conservative:

- retain observations and records;
- retain existing environment values when they can be interpreted;
- initialize only missing fields;
- avoid re-rolling scenery or specimens during migration.

## Validation

Environment changes should continue to be covered by:

```bash
node --test tests/environment.test.mjs
node --test tests/*.test.mjs
```

Visual composition should be inspected separately in the local scenery lab.

## Non-goals

Environment memory does not define:

- scientific care recommendations;
- asset palettes;
- scenery pixel shapes;
- public UI layout;
- taxonomy.

Those concerns belong to their own data or rendering layers.
