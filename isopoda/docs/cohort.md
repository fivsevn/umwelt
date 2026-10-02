# Habitat-aware cohorts (save version 4)

A terrestrial run owns seven immutable `cohort` entries: A–G, species ID, numeric seed and growth stage. Arrival, habitat and ending use those same entries. Scene changes assign encounter roles but never redraw animals. Habitat positions remain continuous between scenes; reopening restores deterministic starting positions, while identity and appearance persist.

`habitats.mjs` controls eligibility and cohort size. New runs use the following sizes; saved version flags can select legacy configurations. Do not infer cohort length from the catalog size or assume every aquatic habitat has seven animals.

| Habitat | Current new-run cohort | Sequence |
| --- | --- | --- |
| Terrestrial | 7 | Seven days |
| Freshwater | 7 | Ten material observations |
| Groundwater | 14 | Eight cave observations |
| Estuary shore | 12 | Shore observation; legacy six-frame and three-day saves retain 7 |
| Intertidal | 7 | Nine tidal observations |
| Sandy surf | 7 | Sand observation sequence |
| Shallow marine | 18 | Nine seaweed observations; legacy saves retain 7 |
| Abyssal | 1 | Fifteen dialogue turns; Bathynomus giganteus, ID A, stage L |
| Petri dish | 1 | Microscope observation sequence |

`habitatConfig(state)` and the saved habitat flags determine compatibility. Restore existing identities and records rather than redrawing a saved cohort to match this table.

The unseen-first draw selects an anchor, then other taxa within 20 wet / 35 cover points of that anchor. These are authored game compatibility limits, not real mixed-species husbandry recommendations. One/two/three taxa occur at 30/45/25 percent. Two-taxon counts are 4+3 / 5+2 / 6+1 at 70/20/10; three-taxon counts are 3+2+2 / 4+2+1 / 5+1+1 at 70/20/10. Assignments are shuffled deterministically. All taxa unlock on arrival.

Each animal evaluates available wet zones against its own wet preference, and shelter against its own cover preference. Food remains an individual opportunity. Care rewards spatial improvement only when at least one animal benefits without worsening another animal's habitat fit; no species mean is calculated. These preferences are gameplay abstractions. Route observations identify a focal individual and use its target.

`isopoda-fugue-v4` is the new run key. A v3 save migrates its species to seven same-species animals while retaining progress, feedback, records, environment and ending. Pending choices regenerate; completed feedback remains intact. The old key remains as a backup. Historical single-species archives and new species arrays both restore collection membership.

The current catalog comes from `species-registry.mjs`; pagination uses its length. The original 13 entries are only the stable legacy prefix, not the whole registry. Reference-only entries remain in the catalog but are excluded from playable draws. See `species-data-contract.md` and `save-compat.md`.

Validation: `node --test tests/*.test.mjs`, plus browser arrival, seven-actor habitat, reload/continue, 21 observations, ending, collection pagination, and narrow-screen checks.

Intertidal sets `maxTaxa:2`: new rock-pool draws contain hirsuta from emerged damp refuges plus one other aquatic taxon, still seven individuals. Shallow marine sets `maxTaxa:3`. The aquatic draw prioritizes uncollected taxa; habitat-specific rules override the general distribution above. Saved cohorts are not redrawn.
