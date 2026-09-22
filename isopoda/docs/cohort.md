# Seven specimens (save version 4)

A run owns seven immutable `cohort` entries: A–G, species ID, numeric seed and growth stage. Arrival, habitat and ending use those same entries. Scene changes assign encounter roles but never redraw animals. Habitat positions remain continuous between scenes; reopening restores deterministic starting positions, while identity and appearance persist.

The unseen-first draw selects an anchor, then other taxa within 20 wet / 35 cover points of that anchor. These are authored game compatibility limits, not real mixed-species husbandry recommendations. One/two/three taxa occur at 30/45/25 percent. Two-taxon counts are 4+3 / 5+2 / 6+1 at 70/20/10; three-taxon counts are 3+2+2 / 4+2+1 / 5+1+1 at 70/20/10. Assignments are shuffled deterministically. All taxa unlock on arrival.

Each animal evaluates available wet zones against its own wet preference, and shelter against its own cover preference. Food remains an individual opportunity. Care rewards spatial improvement only when at least one animal benefits without worsening another animal's habitat fit; no species mean is calculated. These preferences are gameplay abstractions. Route observations identify a focal individual and use its target.

`isopoda-fugue-v4` is the new run key. A v3 save migrates its species to seven same-species animals while retaining progress, feedback, records, environment and ending. Pending choices regenerate; completed feedback remains intact. The old key remains as a backup. Historical single-species archives and new species arrays both restore collection membership.

The existing 13 catalog entries are unchanged; pagination uses the catalog length. No new taxonomic claims or species have been added.

Validation: `node --test tests/*.test.mjs`, plus browser arrival, seven-actor habitat, reload/continue, 21 observations, ending, collection pagination, and narrow-screen checks.
