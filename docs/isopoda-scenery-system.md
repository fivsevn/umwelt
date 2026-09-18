# Isopoda scenery system

Status: phase checkpoint, 2026-09-18.

This document defines the maintenance boundary for the habitat scenery used by **Isopoda Fugue / 等足目赋格**. The current public game is intentionally left unchanged during this documentation pass. The next visual phase should improve scenery by editing scenery content and renderers rather than by adding more scene-specific logic to the game shell.

## 1. Current responsibilities

The habitat is split into three different concerns:

- `environment.mjs` — persistent environmental state and turn-based memory.
- `habitat.mjs` — runtime orchestration: camera, specimens, interaction, encounter staging and scene composition.
- `scenery/` — code-drawn pixel scenery modules.

These layers should remain separate.

**State answers “what exists / what changed”. Rendering answers “how it looks”. Runtime orchestration answers “when and where it is shown”.**

A scenery renderer must not become the source of truth for persistent state.

## 2. Existing scenery modules

Current programmatic scenery modules:

| Module | Responsibility |
| --- | --- |
| `pixel.mjs` | shared integer-pixel helpers, world constants and deterministic hashing |
| `substrate.mjs` | substrate field and wet/dry visual gradient |
| `leaf.mjs` | leaf litter variants |
| `moss.mjs` | moss / sphagnum-like cover patches |
| `bark.mjs` | bark shelters and bark fragments |
| `stone.mjs` | stone variants; currently useful in the local asset lab |
| `cuttlebone.mjs` | calcium-source prop |
| `debris.mjs` | twigs and wood chips |
| `index.mjs` | current scene composition entry point |

The 384 × 430 habitat world remains the canonical scene coordinate system for this phase.

## 3. Target data model for the next phase

The next integration pass should introduce two data layers without changing the visual API of the public game:

```text
scenery/
├─ pixel.mjs
├─ substrate.mjs
├─ leaf.mjs
├─ moss.mjs
├─ bark.mjs
├─ stone.mjs
├─ cuttlebone.mjs
├─ debris.mjs
├─ registry.mjs     # asset definitions
├─ presets.mjs      # scene compositions
└─ index.mjs        # renderer dispatch / public scenery API
```

### `registry.mjs`

One stable asset id should describe one reusable scene asset. The local scenery lab and the runtime should eventually read the same registry.

Recommended shape:

```js
{
  id: 'leaf-broad-01',
  type: 'leaf',
  category: 'litter',
  habitats: ['terrestrial'],
  interactive: null,
  radius: 44,
  defaults: {
    variant: 0,
    tone: 0,
    scale: 0.72
  }
}
```

The registry stores **render configuration and editor metadata**, not simulation history.

Recommended fields:

- `id` — permanent stable id.
- `type` — renderer family: substrate, leaf, moss, bark, stone, cuttlebone, twig, chip, etc.
- `category` — editor grouping.
- `habitats` — broad environment compatibility, initially `terrestrial`; future values may include `marine`.
- `interactive` — optional interaction role such as `lift`.
- `radius` — selection / editor approximation only.
- `defaults` — default renderer parameters.
- `labOnly` — optional flag for assets that are useful for visual testing but not yet part of a public preset.

Do not duplicate renderer functions inside the registry.

### `presets.mjs`

A preset describes composition only:

```js
{
  id: 'culture-bin',
  habitat: 'terrestrial',
  substrate: 'substrate-wet-left',
  items: [
    {asset: 'moss-sphagnum-01', x: 78, y: 92, z: 10},
    {asset: 'leaf-broad-01', x: 312, y: 94, a: -0.58, z: 24},
    {asset: 'bark-shelter-01', x: 192, y: 216, a: -0.08, z: 30}
  ]
}
```

A preset must reference registry ids rather than redefine visual assets.

## 4. Scene layers

For maintenance, scenery should be thought of as these layers:

1. **Base / substrate**
   - dry and wet soil
   - moisture gradients
   - low-frequency humus texture

2. **Soft cover**
   - moss / sphagnum
   - fine organic cover

3. **Litter**
   - whole leaves
   - broken leaves
   - flat / gap-producing leaves

4. **Shelter / hardscape**
   - bark
   - stones
   - future wood or mineral shelters

5. **Small debris**
   - twigs
   - wood chips
   - small fragments

6. **Resources**
   - cuttlebone / calcium source
   - food nodes

7. **Persistent traces**
   - shed shells
   - scuffs
   - depleted food
   - later environmental marks

8. **Transient effects**
   - mist / spray
   - temporary lift state
   - reaction overlays

Only layers 1–6 belong in the reusable scenery asset library. Persistent traces belong to environment state. Transient effects belong to runtime presentation.

## 5. Environment memory contract

`environment.mjs` remains authoritative for persistent state:

- `wetZones`
- `leaves`
- `foodNodes`
- `shelter`
- `disturbance`
- `scuffs`
- `shells`
- `pendingShells`
- `removedShells`

When a stateful object moves, the renderer must read the state position. A fixed visual preset must not silently disagree with the stored position.

Known integration point for the next pass: the main shelter currently exists both as a preset visual and as persistent `environment.shelter` state. The next scenery integration should make the rendered shelter use the environment position while keeping its visual asset definition in the scenery registry.

## 6. Local scenery lab

The local asset lab is:

```text
/isopoda/scenery-test.html
```

It is a developer tool only. It is intentionally excluded from the GitHub Pages artifact.

Purpose:

- preview individual code-drawn assets;
- drag assets in the 384 × 430 world;
- inspect overlap and z-order;
- rotate / scale / reseed assets;
- compare substrate configurations;
- assemble candidate compositions before changing a public preset.

The lab should eventually consume `registry.mjs` and `presets.mjs`. It should not maintain a second independent asset catalog.

The test page may expose editor-only controls. Those controls must never be required by the public game.

## 7. Pixel-art workflow for the next phase

When scenery visual work resumes, prefer this sequence:

1. Edit one renderer module or one asset definition.
2. Inspect it in the local scenery lab.
3. Compare it against the current full preset.
4. Check important overlaps at 384 × 430.
5. Check specimen legibility over the changed background.
6. Only after the asset reads correctly, update the scene preset if placement is needed.
7. Run automated tests before deployment.

The goal is that most scenery iteration becomes **content tuning**:

- palette;
- silhouette;
- pixel clustering;
- seed;
- scale;
- angle;
- placement;
- z-order;
- preset membership.

Avoid adding a new branch to `habitat.mjs` for a purely visual change.

## 8. Terrestrial and future aquatic scenes

The current public habitat is terrestrial. The project now also contains non-Oniscidea reference taxa and may later include playable aquatic isopods.

Do not encode “all Isopoda live in a soil box” into the asset model.

Use broad habitat compatibility metadata:

```text
terrestrial
marine
intertidal
freshwater
```

These tags are scene-selection metadata, not biological care recommendations.

A future aquatic scene should normally use a different preset and appropriate asset families rather than re-skinning the terrestrial culture-bin preset.

## 9. Validation contract

Before a future scenery registry is wired into runtime, add lightweight checks for:

- duplicate asset ids;
- preset references to missing assets;
- unknown renderer types;
- missing required default parameters;
- duplicate preset ids;
- invalid z / x / y numeric values;
- public presets referencing `labOnly` assets.

Visual correctness still requires the local asset lab.

## 10. Public / developer boundary

The repository is public. “Local-only” means **not deployed to the public website**, not secret.

Do not commit:

- passwords;
- API keys;
- tokens;
- personal absolute filesystem paths;
- private source files.

Developer HTML pages, test harnesses and technical notes may remain in the repository, but Pages deployment should exclude them unless they are intentionally part of the public project.

## 11. Non-goals for this phase

This documentation checkpoint does not:

- change the public habitat layout;
- change specimen behavior;
- change save data;
- change encounters;
- change environmental scoring;
- redesign the public UI;
- introduce aquatic gameplay.

The next phase is primarily a scenery-pixel-art pass built on the boundaries above.
