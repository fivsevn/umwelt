# Habitat-aware cohorts (save version 4)

A terrestrial run owns seven immutable `cohort` entries: A–G, species ID, numeric seed and growth stage. Arrival, habitat and ending use those same entries. Scene changes assign encounter roles but never redraw animals. Habitat positions remain continuous between scenes; reopening restores deterministic starting positions, while identity and appearance persist.

`habitats.mjs` controls eligibility and cohort size. Ordinary aquatic habitats also use seven entries drawn only from their habitat species list. Abyssal sets `cohortSize:1`: one Bathynomus giganteus, ID A, stage L; it uses a single 15-turn dialogue sequence (`days:1`), not seven days or three daily periods. Do not infer cohort length from the catalog size.

The unseen-first draw selects an anchor, then other taxa within 20 wet / 35 cover points of that anchor. These are authored game compatibility limits, not real mixed-species husbandry recommendations. One/two/three taxa occur at 30/45/25 percent. Two-taxon counts are 4+3 / 5+2 / 6+1 at 70/20/10; three-taxon counts are 3+2+2 / 4+2+1 / 5+1+1 at 70/20/10. Assignments are shuffled deterministically. All taxa unlock on arrival.

Each animal evaluates available wet zones against its own wet preference, and shelter against its own cover preference. Food remains an individual opportunity. Care rewards spatial improvement only when at least one animal benefits without worsening another animal's habitat fit; no species mean is calculated. These preferences are gameplay abstractions. Route observations identify a focal individual and use its target.

`isopoda-fugue-v4` is the new run key. A v3 save migrates its species to seven same-species animals while retaining progress, feedback, records, environment and ending. Pending choices regenerate; completed feedback remains intact. The old key remains as a backup. Historical single-species archives and new species arrays both restore collection membership.

The current catalog comes from `species-registry.mjs`; pagination uses its length. The original 13 entries are only the stable legacy prefix, not the whole registry. Reference-only entries remain in the catalog but are excluded from playable draws. See `species-data-contract.md` and `save-compat.md`.

Validation: `node --test tests/*.test.mjs`, plus browser arrival, seven-actor habitat, reload/continue, 21 observations, ending, collection pagination, and narrow-screen checks.

Intertidal sets `maxTaxa:2`: new rock-pool draws contain one or two taxa, still seven individuals. The existing 30 percent single-taxon branch is retained; the other branches yield two taxa. Other habitats keep their previous draw distribution, and saved cohorts are not redrawn.
