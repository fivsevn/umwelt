# Save and content compatibility

Current behavior is implemented by `engine.mjs`, `game.js`, `collection.mjs` and `aquatic-story.mjs`; this cleanup does not change their state transitions or migrations.

| Storage key | Purpose |
| --- | --- |
| `isopoda-fugue-v4` | Current run, version 4 |
| `isopoda-fugue-v3` | Legacy migration input; retained backup |
| `umwelt-isopod-v1` | Earliest legacy detection/input |
| `isopoda-fugue-endings-v3` | Ending archive |
| `isopoda-fieldnotes-v1` | Collection/unlocks |
| `isopoda-interaction-discoveries-v1` | Interaction discoveries |
| `isopoda-ui-language-v1` | Language preference |

Stable identity includes species IDs, habitat IDs, cohort A–G identities (A only for abyssal), seeds/stages, ending IDs, encounter/option IDs and recorded content keys. The v3 migration preserves progress, records, feedback, environment and endings while reconstructing the cohort; current v4 restoration is habitat-aware. Single-species legacy archive entries and newer species arrays both contribute collection membership.

Aquatic `water:<habitat>:turn:<index>:<field>` and alternate keys include positional indices. Abyssal text keys include node IDs and option indices; choices also retain option IDs. Reordering or inserting into existing indexed rows can reinterpret saved feedback, even if the text is unchanged. Treat index positions as stable IDs: append to a new versioned pool or supply a tested migration, never silently reshuffle. Presentation-order maps are distinct from authored option identity.

Before renaming/removing any ID or changing state shape, enumerate every reader and saved/archive representation; add explicit migration fixtures for old, active feedback, ended and reload states. Preserve backup keys and unknown/legacy fallbacks until a deliberate migration policy replaces them. Do not bump storage versions to perform documentation, asset-query or validator maintenance. Asset query versions are deployment metadata and never save versions.

`content.mjs:MORNING` had no runtime/test/migration consumers and was removed; historical text is retrievable from pre-cleanup main `08a3613`. All active source paths, authored copy and migration behavior remain intact.
